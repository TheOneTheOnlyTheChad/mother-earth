// Buoy reliability (hub 0.6.8; docs/concepts/OSMC-RELIABILITY-PROPOSAL.md rev 2.1 §8, hub cases).
// Everything goes through the Worker's own dispatch — scheduled() for the :07 job and fetch('/admin/run/drifters') for a manual
// run — and is read back through the public endpoints (/cells, /snapshot, /place, /). No network: OSMC is stubbed.
// R2 = in-memory with R2's documented conditional-put semantics (etagMatches / etagDoesNotMatch "*" → null) and hooks to
// interleave runs; D1 = a recorder for collector_runs. The clock is faked for Date.now() AND the no-argument Date constructor.
// Run: node --no-warnings phase1/osmc-reliability-hub.test.mjs
// BREAK=<name> weakens a copy of worker.js; every break must fail:
//   stamp-failed-time | keep-after-good | unconditional | down-unconditional | order-by-retrieved | guarded-writedown |
//   no-place-cutoff | raw-note-public | failed-at-late | same-run-strict | raw-note-down | unreadable-as-empty
import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const BREAKS = {
  'stamp-failed-time': ["? { ...cur, last_attempt: {", "? { ...cur, retrieved_at: nowIso(), last_attempt: {"],
  'keep-after-good': ["  await putJson(env, `latest-cells/${layer}.json`, cellsOnly);        // and its counts — same run, same retrieved_at",
    "  { const was = await getJson(env, `latest-cells/${layer}.json`); await putJson(env, `latest-cells/${layer}.json`, { ...cellsOnly, ...(was && was.last_attempt ? { last_attempt: was.last_attempt } : {}) }); }"],
  'unconditional': ["onlyIf: o ? { etagMatches: o.etag } : { etagDoesNotMatch: '*' } });\n      if (res) return good", "onlyIf: o && !good ? { etagMatches: o.etag } : !o ? { etagDoesNotMatch: '*' } : undefined });\n      if (res) return good"],
  'down-unconditional': ["onlyIf: o ? { etagMatches: o.etag } : { etagDoesNotMatch: '*' } });\n      if (res) return good", "onlyIf: good ? { etagMatches: o.etag } : undefined });\n      if (res) return good"],
  'order-by-retrieved': ["const stored = [cur.scheduled_for, cur.last_attempt && cur.last_attempt.run].filter(Boolean).sort().pop();\n        if (stored && stored >= run)",
    "const stored = [cur.retrieved_at, cur.last_attempt && cur.last_attempt.failed_at].filter(Boolean).sort().pop();\n        if (stored && stored >= nowIso())"],
  'guarded-writedown': ["else if (layer === 'drifters') { try { await driftFail(env, ms, 'internal_error', note, 0); } catch (_) {} }", "else if (layer === 'never') { }"],
  'no-place-cutoff': ["if (la && (Date.now() - Date.parse(cells.retrieved_at)) / 1000 > (cells.stale_after_s || STALE_AFTER_S.drifters)) {", "if (false) {"],
  'raw-note-public': ["? { ...cur, last_attempt: { run,", "? { ...cur, last_attempt: { note, run,"],
  'failed-at-late': ["failed_at: failedAt, status: 'down'", "failed_at: nowIso(), status: 'down'"],
  'same-run-strict': ["if (stored && stored >= run) return", "if (stored && stored > run) return"],
  'raw-note-down': [": down({ note: DRIFT_REASONS[reason] + (reason === 'http_error' && http ? ' ' + http : ''), reason });", ": down({ note, reason });"],
  'unreadable-as-empty': ["return 'left: stored counts unreadable'; }", "text = 'x'; }"],
};
const B = process.env.BREAK;
if (B) { if (!BREAKS[B]) { console.log('unknown break ' + B); process.exit(2); } const [a, b] = BREAKS[B]; if (!src.includes(a)) { console.log('break anchor missing: ' + B); process.exit(2); } src = src.replace(a, b); }
const tmp = path.join(HERE, `.osmc-worker-${process.pid}.mjs`); fs.writeFileSync(tmp, src);
let worker; try { worker = (await import(pathToFileURL(tmp).href)).default; } finally { fs.unlinkSync(tmp); }

// ---------- clock
let NOW = Date.parse('2026-11-10T15:08:15.000Z');
{ const R = Date; globalThis.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }; }
const at = iso => { NOW = Date.parse(iso); };
const H = 3600e3;

// ---------- OSMC
const HEAD = ['platform_code,platform_type,country,time,latitude,longitude,sst', ',,,UTC,degrees_north,degrees_east,Deg C'];
const csv = (n, off = 0) => [...HEAD, ...Array.from({ length: n }, (_, i) => `${900000 + off + i},DRIFTING BUOYS,UNKNOWN,${new Date(NOW - H).toISOString().slice(0, 19)}Z,${(-60 + (i * 7.3) % 120).toFixed(4)},${(-179 + (i * 13.7) % 358).toFixed(4)},${(5 + i % 25).toFixed(2)}`)].join('\n') + '\n';
const good = (n = 1300, off = 0) => () => new Response(csv(n, off), { status: 200 });
const RAW = 'SECRET-RAW-ERROR-TEXT at 10.0.0.7:443';
const KINDS = {
  http_error: () => new Response('origin unreachable ' + RAW, { status: 522 }),
  fetch_failed: () => { throw new Error(RAW); },
  refused_by_checks: () => new Response('<html>' + RAW + '</html>', { status: 200 }),
};
let osmc = []; let osmcDefault = good();   // a queue of one-shot behaviours, then the default
globalThis.fetch = async (url) => { url = String(url); if (!url.includes('osmc.noaa.gov')) return new Response('stub', { status: 503 }); const f = osmc.length ? osmc.shift() : osmcDefault; return f(); };

// ---------- env
const CELLS = 'latest-cells/drifters.json', LATEST = 'latest/drifters.json';
const enc = new TextEncoder(), dec = new TextDecoder();
function makeEnv(extra = {}) {
  const m = new Map(), puts = [], runs = []; let seq = 0; const hooks = { beforePut: null }, fail = { put: null, after: null }, adv = { db: 0, put: 0 };   // adv: ms the clock moves during a D1 insert / an R2 put (slow storage)
  const obj = (k, v) => ({ key: k, size: v.b.length, etag: v.etag, httpEtag: '"' + v.etag + '"', uploaded: new Date(v.up), customMetadata: {}, httpMetadata: {} });
  const R2 = {
    async put(k, value, o = {}) {
      puts.push({ key: k, cond: o.onlyIf ? (o.onlyIf.etagMatches ? 'etag' : 'absent') : 'none', at: NOW });
      if (hooks.beforePut) { const h = hooks.beforePut; const r = await h(k, o); if (r === 'done') hooks.beforePut = null; }
      if (fail.put && fail.put(k, o)) throw new Error('R2 stub: forced put failure ' + k);
      NOW += adv.put;
      const cur = m.get(k), c = o.onlyIf;
      if (c && c.etagDoesNotMatch === '*' && cur) return null;
      if (c && c.etagMatches && (!cur || cur.etag !== c.etagMatches)) return null;
      const v = { b: enc.encode(String(value)), etag: 'e' + (++seq), up: NOW }; m.set(k, v);
      if (fail.after && fail.after(k, o)) throw new Error('R2 stub: the write committed and the call then threw ' + k);
      return obj(k, v);
    },
    async head(k) { const v = m.get(k); return v ? obj(k, v) : null; },
    async get(k) { const v = m.get(k); if (!v) return null; return { ...obj(k, v), body: new Blob([v.b]).stream(), async text() { return dec.decode(v.b); }, async json() { return JSON.parse(dec.decode(v.b)); } }; },
    async delete(k) { m.delete(k); },
    async list({ prefix } = {}) { return { objects: [...m.keys()].filter(k => !prefix || k.startsWith(prefix)).map(key => ({ key, uploaded: new Date() })), truncated: false }; },
  };
  const stmt = (sql) => { const x = (a) => ({ async run() { if (/INSERT INTO collector_runs/.test(sql)) NOW += adv.db; if (/INSERT INTO collector_runs/.test(sql)) runs.push({ layer: a[0], started_at: a[1], finished_at: a[2], status: a[3], http: a[4], records: a[5], note: a[7] }); return {}; },
    async first() { return null; }, async all() { return /FROM collector_runs/.test(sql) ? { results: Object.values(Object.fromEntries(runs.map(r => [r.layer, r]))).map(r => ({ layer: r.layer, started_at: r.started_at, status: r.status, http_status: r.http, records: r.records, bytes: 0, note: r.note })).map(o => { const cols = (/^\s*SELECT\s+(.+?)\s+FROM\s/i.exec(sql) || [])[1]; if (!cols || cols.trim() === '*') return o; const keep = cols.split(',').map(c => c.trim()); return Object.fromEntries(keep.filter(k => k in o).map(k => [k, o[k]])); }) } : { results: [] }; } }); return { bind: (...a) => x(a), ...x([]) }; };   // projection honoured (0.6.10): only the SELECTed columns come back
  const env = { R2, DB: { prepare: stmt, async batch() { return []; } }, ADMIN_KEY: 'k', DRIFTERS_ENABLED: '1', ...extra };
  const raw = k => { const v = m.get(k); return v ? dec.decode(v.b) : null; };
  return { env, m, puts, runs, hooks, fail, adv, raw, setRaw: (k, text) => m.set(k, { b: enc.encode(text), etag: 'x' + (++seq), up: NOW }), json: k => JSON.parse(raw(k)), etag: k => m.get(k) && m.get(k).etag, bruns: () => runs.filter(r => r.layer === 'drifters') };
}
const manual = (E) => worker.fetch(new Request('https://hub/admin/run/drifters?key=k'), E.env);
const hourly = (E, iso) => worker.scheduled({ cron: '7 * * * *', scheduledTime: Date.parse(iso) }, E.env, { waitUntil() {} });
const pub = async (E, p) => { const r = await worker.fetch(new Request('https://hub' + p), E.env); return { status: r.status, text: await r.text() }; };
const pj = async (E, p) => JSON.parse((await pub(E, p)).text);
const strip = c => { const { last_attempt, ...rest } = c; return rest; };
const firstCell = c => Object.keys(c.cells).sort()[0];
const place = (E, id) => pj(E, `/place/g4/${id}?layers=drifters`).then(j => j.layers.drifters);

let pass = 0, failN = 0;
const t = async (n, fn) => { try { await fn(); pass++; console.log('ok   -', n); } catch (e) { failN++; console.log('FAIL -', n, '\n      ', String(e && e.message || e).split('\n')[0].slice(0, 300)); } };
// a good 15:07 scheduled run to start every case from
async function seeded(extra) { const E = makeEnv(extra); at('2026-11-10T15:08:15.000Z'); osmc = []; osmcDefault = good(); await hourly(E, '2026-11-10T15:07:00Z'); return E; }

await t('0. hub reports at least 0.6.8', async () => { const E = makeEnv(); const v = String((await pj(E, '/')).version).split('.').map(Number); assert.ok(v.length === 3 && v.every(Number.isInteger) && (v[0] > 0 || v[1] > 6 || (v[1] === 6 && v[2] >= 8)), 'version ' + v.join('.')); });

await t('1. good → 522 → recovery, scheduled runs, public endpoints', async () => {
  const E = await seeded();
  const c0 = await pj(E, '/cells/drifters'), s0raw = (await pub(E, '/snapshot/drifters')).text, s0 = JSON.parse(s0raw), e0 = E.etag(LATEST);
  assert.equal(c0.source_status, 'ok'); assert.equal(c0.retrieved_at, s0.retrieved_at); assert.equal(c0.last_attempt, undefined);
  at('2026-11-10T16:08:42.580Z'); osmc = [KINDS.http_error]; await hourly(E, '2026-11-10T16:07:00Z');
  const c1 = await pj(E, '/cells/drifters');
  assert.deepEqual(strip(c1), c0, 'decoded counts payload minus last_attempt = the good run\'s decoded counts payload');
  assert.deepEqual(c1.last_attempt, { run: '2026-11-10T16:07:00.000Z', failed_at: '2026-11-10T16:08:42.580Z', status: 'down', http: 522, reason: 'http_error', consecutive_failures: 1 });
  assert.equal((await pub(E, '/snapshot/drifters')).text, s0raw, 'records bytes unchanged'); assert.equal(E.etag(LATEST), e0, 'records object not rewritten');
  assert.equal(JSON.parse(s0raw).retrieved_at, c1.retrieved_at, 'same run id on both');
  const last = E.bruns().at(-1); assert.equal(last.status, 'down'); assert.equal(last.http, 522); assert.equal(last.note, 'http 522'); assert.equal(last.started_at, '2026-11-10T16:07:00.000Z');
  const per = E.json('cells/drifters/2026-11-10T16-07Z.json'); assert.equal(per.source_status, 'down'); assert.equal(per.note, 'http 522');
  at('2026-11-10T17:08:09.000Z'); await hourly(E, '2026-11-10T17:07:00Z');
  const c2 = await pj(E, '/cells/drifters'), s2 = await pj(E, '/snapshot/drifters');
  assert.equal(c2.last_attempt, undefined, 'field gone after a good run'); assert.equal(c2.retrieved_at, '2026-11-10T17:08:09.000Z'); assert.equal(s2.retrieved_at, c2.retrieved_at); assert.equal(c2.source_status, 'ok');
  assert.equal(E.bruns().at(-1).status, 'ok');
});

for (const [reason, http] of [['http_error', 522], ['fetch_failed', null], ['refused_by_checks', 200]]) {
  await t(`2. failure kind ${reason}: counts kept, right reason, manual run path, raw text not public`, async () => {
    const E = await seeded(); const c0 = await pj(E, '/cells/drifters'), before = E.puts.length;
    at('2026-11-10T16:08:42.000Z'); osmc = [KINDS[reason]]; assert.equal((await manual(E)).status, 200);
    const c1 = await pj(E, '/cells/drifters'); assert.deepEqual(strip(c1), c0); assert.equal(c1.last_attempt.reason, reason); assert.equal(c1.last_attempt.http, http);
    assert.equal(c1.last_attempt.run, '2026-11-10T16:08:42.000Z', 'a manual run is ordered by its own start');
    const mine = E.puts.slice(before).filter(p => p.key === CELLS); assert.deepEqual(mine.map(p => p.cond), ['etag'], 'exactly one write to the counts, conditional');
    assert.equal(E.bruns().at(-1).status, 'down');
    for (const p of ['/cells/drifters', '/snapshot/drifters', `/place/g4/${firstCell(c0)}?layers=drifters`, '/']) assert.ok(!(await pub(E, p)).text.includes('SECRET-RAW'), 'raw text in ' + p);
    if (reason === 'fetch_failed') { assert.ok(E.bruns().at(-1).note.includes('SECRET-RAW'), 'raw note kept in collector_runs'); assert.ok(E.raw('cells/drifters/2026-11-10T16-08Z.json').includes('SECRET-RAW'), 'raw note kept in the private per-run object');
      { const st = JSON.parse((await pub(E, '/status')).text), d = st.last_runs.find(x => x.layer === 'drifters'); assert.ok(d && !('note' in d) && !JSON.stringify(d).includes('SECRET-RAW'), '/status last_runs (hub >= 0.6.10): no run note'); assert.equal(d.status, 'down'); }
      assert.equal((await pub(E, '/cells/drifters/2026-11-10T16-08Z.json')).status !== 200 || !(await pub(E, '/cells/drifters/2026-11-10T16-08Z.json')).text.includes('SECRET-RAW'), true, 'no public route returns the per-run object'); }
  });
}

await t('2d. unexpected throw inside the run (guarded): internal_error, counts kept, generic writeDown not used', async () => {
  const E = await seeded(); const c0 = await pj(E, '/cells/drifters'), before = E.puts.length;
  at('2026-11-10T16:08:42.000Z'); osmc = [good()];
  const get = E.env.R2.get; let armed = true; E.env.R2.get = async (k) => { if (armed && k === LATEST) { armed = false; throw new Error(RAW); } return get(k); };   // the run's own read of the previous snapshot throws
  await hourly(E, '2026-11-10T16:07:00Z'); E.env.R2.get = get;
  const c1 = await pj(E, '/cells/drifters'); assert.deepEqual(strip(c1), c0); assert.equal(c1.last_attempt.reason, 'internal_error');
  assert.ok(E.puts.slice(before).filter(p => p.key === CELLS).every(p => p.cond !== 'none'), 'no unconditional write to the counts');
  assert.ok(!(await pub(E, '/cells/drifters')).text.includes('SECRET-RAW')); assert.equal(E.bruns().at(-1).status, 'down'); assert.match(E.bruns().at(-1).note, /^uncaught: /);
});

await t('3. two failures in a row: consecutive_failures 2, failed_at and run move, counts still the good run\'s', async () => {
  const E = await seeded(); const c0 = await pj(E, '/cells/drifters');
  at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error]; await hourly(E, '2026-11-10T16:07:00Z');
  at('2026-11-10T17:08:40.000Z'); osmc = [KINDS.fetch_failed]; await hourly(E, '2026-11-10T17:07:00Z');
  const c = await pj(E, '/cells/drifters'); assert.deepEqual(strip(c), c0);
  assert.deepEqual(c.last_attempt, { run: '2026-11-10T17:07:00.000Z', failed_at: '2026-11-10T17:08:40.000Z', status: 'down', http: null, reason: 'fetch_failed', consecutive_failures: 2 });
  assert.equal(E.bruns().filter(r => r.status === 'down').length, 2);
});

await t('4. late failure against a newer good publish: the newer pair survives, no last_attempt; the failure is still logged', async () => {
  const E = await seeded();
  // run A (16:07) is waiting on OSMC; run B (manual, 16:07:30) publishes a good pair; then A gets its 522
  let release; const gate = new Promise(r => { release = r; });
  at('2026-11-10T16:07:05.000Z'); osmc = [async () => { await gate; return KINDS.http_error(); }];
  const a = hourly(E, '2026-11-10T16:07:00Z'); await new Promise(r => setTimeout(r, 20));
  at('2026-11-10T16:07:30.000Z'); osmc.push(good(1310, 5000)); await manual(E);
  const cB = E.raw(CELLS), sB = E.raw(LATEST), eC = E.etag(CELLS), eS = E.etag(LATEST);
  at('2026-11-10T16:08:42.000Z'); release(); await a;
  assert.equal(E.raw(CELLS), cB, 'counts byte for byte'); assert.equal(E.raw(LATEST), sB); assert.equal(E.etag(CELLS), eC); assert.equal(E.etag(LATEST), eS);
  assert.equal(JSON.parse(cB).last_attempt, undefined); assert.equal(JSON.parse(cB).scheduled_for, '2026-11-10T16:07:30.000Z');
  const d = E.bruns().filter(r => r.status === 'down'); assert.equal(d.length, 1); assert.equal(d[0].started_at, '2026-11-10T16:07:00.000Z');
  assert.ok(E.raw('cells/drifters/2026-11-10T16-07Z.json'), 'per-run failure record written although latest-* was left alone');
});

await t('4b. run order and publish order disagree: a LATER attempt fails after an EARLIER run published late → the earlier run\'s counts get last_attempt', async () => {
  const E = await seeded();
  // run B (scheduled 16:07:00) is slow and good; run A (manual 16:07:30) fails; B publishes between A's read and A's write
  at('2026-11-10T16:07:30.000Z'); osmc = [KINDS.http_error];
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; const keep = NOW; NOW = Date.parse('2026-11-10T16:07:50.000Z'); osmc.unshift(good(1310, 7000)); await hourly(E, '2026-11-10T16:07:00Z'); NOW = keep; return 'done'; };
  await manual(E);
  const c = E.json(CELLS), s = E.json(LATEST);
  assert.equal(c.scheduled_for, '2026-11-10T16:07:00.000Z'); assert.equal(c.retrieved_at, '2026-11-10T16:07:50.000Z', 'B\'s counts (published later than A started)'); assert.equal(s.retrieved_at, c.retrieved_at);
  assert.equal(c.last_attempt.run, '2026-11-10T16:07:30.000Z', 'A is the later ATTEMPT, so its failure is the latest attempt'); assert.equal(Object.values(c.cells).reduce((a, x) => a + x.count, 0), 1310);
});

await t('5. conditional write loses the race to a newer good publish (between read and put): re-read once, newer data never overwritten', async () => {
  const E = await seeded();
  at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error];
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; const keep = NOW; NOW = Date.parse('2026-11-10T16:08:43.000Z'); osmc.unshift(good(1320, 9000)); await manual(E); NOW = keep; return 'done'; };
  await hourly(E, '2026-11-10T16:07:00Z');
  const c = E.json(CELLS); assert.equal(c.scheduled_for, '2026-11-10T16:08:43.000Z'); assert.equal(c.last_attempt, undefined); assert.equal(E.json(LATEST).retrieved_at, c.retrieved_at);
  assert.equal(Object.values(c.cells).reduce((a, x) => a + x.count, 0), 1320);
});

await t('6. late failure against a later failure: the later last_attempt stands', async () => {
  const E = await seeded();
  let release; const gate = new Promise(r => { release = r; });
  at('2026-11-10T16:07:05.000Z'); osmc = [async () => { await gate; return KINDS.http_error(); }];
  const a = hourly(E, '2026-11-10T16:07:00Z'); await new Promise(r => setTimeout(r, 20));
  at('2026-11-10T16:07:40.000Z'); osmc.push(KINDS.fetch_failed); await manual(E);
  const mid = E.raw(CELLS); assert.equal(JSON.parse(mid).last_attempt.run, '2026-11-10T16:07:40.000Z');
  at('2026-11-10T16:08:42.000Z'); release(); await a;
  assert.equal(E.raw(CELLS), mid); assert.equal(E.bruns().filter(r => r.status === 'down').length, 2);
});

await t('7. nothing good to keep: first run ever fails → empty down envelope, created conditionally, fixed-phrase note', async () => {
  const E = makeEnv(); at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.fetch_failed]; await hourly(E, '2026-11-10T16:07:00Z');
  const c = E.json(CELLS); assert.equal(c.source_status, 'down'); assert.deepEqual(c.cells, {}); assert.equal(c.note, 'request failed'); assert.equal(c.reason, 'fetch_failed'); assert.equal(c.last_attempt, undefined);
  assert.deepEqual(E.puts.filter(p => p.key === CELLS).map(p => p.cond), ['absent']); assert.ok(!E.raw(CELLS).includes('SECRET-RAW')); assert.equal(E.raw(LATEST), null);
  // a second failure over an existing down envelope: replaced conditionally on its etag
  at('2026-11-10T17:08:42.000Z'); osmc = [KINDS.http_error]; await hourly(E, '2026-11-10T17:07:00Z');
  const c2 = E.json(CELLS); assert.equal(c2.source_status, 'down'); assert.equal(c2.note, 'http error 522'); assert.equal(c2.scheduled_for, '2026-11-10T17:07:00.000Z');
  assert.deepEqual(E.puts.filter(p => p.key === CELLS).map(p => p.cond), ['absent', 'etag']);
});

await t('7a. absent-key race: the failure read an absent key, a good run then published → the new counts are not replaced', async () => {
  const E = makeEnv(); at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.fetch_failed];
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; const keep = NOW; NOW = Date.parse('2026-11-10T16:08:43.000Z'); osmc.unshift(good()); await manual(E); NOW = keep; return 'done'; };
  await hourly(E, '2026-11-10T16:07:00Z');
  const c = E.json(CELLS); assert.equal(c.source_status, 'ok'); assert.equal(c.scheduled_for, '2026-11-10T16:08:43.000Z'); assert.equal(c.last_attempt, undefined); assert.equal(E.json(LATEST).retrieved_at, c.retrieved_at);
});

await t('7b. existing-down race: the failure read a down envelope, a good run then published → the new counts are not replaced', async () => {
  const E = makeEnv(); at('2026-11-10T15:08:42.000Z'); osmc = [KINDS.fetch_failed]; await hourly(E, '2026-11-10T15:07:00Z'); assert.equal(E.json(CELLS).source_status, 'down');
  at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.fetch_failed];
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; const keep = NOW; NOW = Date.parse('2026-11-10T16:08:43.000Z'); osmc.unshift(good()); await manual(E); NOW = keep; return 'done'; };
  await hourly(E, '2026-11-10T16:07:00Z');
  const c = E.json(CELLS); assert.equal(c.source_status, 'ok'); assert.equal(c.scheduled_for, '2026-11-10T16:08:43.000Z'); assert.equal(c.last_attempt, undefined);
});

await t('7c. an older attempt failing after a newer down envelope: nothing written', async () => {
  const E = makeEnv(); let release; const gate = new Promise(r => { release = r; });
  at('2026-11-10T16:07:05.000Z'); osmc = [async () => { await gate; return KINDS.http_error(); }];
  const a = hourly(E, '2026-11-10T16:07:00Z'); await new Promise(r => setTimeout(r, 20));
  at('2026-11-10T16:07:40.000Z'); osmc.push(KINDS.fetch_failed); await manual(E); const mid = E.raw(CELLS);
  at('2026-11-10T16:08:42.000Z'); release(); await a; assert.equal(E.raw(CELLS), mid); assert.equal(JSON.parse(mid).scheduled_for, '2026-11-10T16:07:40.000Z');
});

await t('8. exact partial publish: records written, counts write throws → old counts + last_attempt, /place withheld; the next good run restores both endpoints', async () => {
  const E = await seeded(); const c0 = await pj(E, '/cells/drifters'); const id = firstCell(c0);
  at('2026-11-10T16:08:10.000Z'); osmc = [good(1310, 3000)]; E.fail.put = (k, o) => k === CELLS && !o.onlyIf;
  await hourly(E, '2026-11-10T16:07:00Z'); E.fail.put = null;
  const c1 = await pj(E, '/cells/drifters'), s1 = await pj(E, '/snapshot/drifters');
  assert.equal(s1.retrieved_at, '2026-11-10T16:08:10.000Z', '/snapshot serves the new records'); assert.deepEqual(strip(c1), c0, '/cells serves the old counts'); assert.equal(c1.last_attempt.reason, 'internal_error');
  const p = await place(E, id); assert.equal(p.state, 'withheld'); assert.match(p.why, /not from the same collector run/); assert.equal(p.records, undefined); assert.equal(p.last_attempt, undefined);
  assert.equal(E.bruns().at(-1).status, 'down');
  at('2026-11-10T17:08:09.000Z'); osmc = []; await hourly(E, '2026-11-10T17:07:00Z');
  const c2 = await pj(E, '/cells/drifters'), s2 = await pj(E, '/snapshot/drifters'); assert.equal(c2.retrieved_at, s2.retrieved_at); assert.equal(c2.retrieved_at, '2026-11-10T17:08:09.000Z'); assert.equal(c2.last_attempt, undefined);
  const p2 = await place(E, firstCell(c2)); assert.equal(p2.state, 'ok'); assert.equal(p2.last_attempt, undefined);
});

await t('8b. the failure handler\'s own write throws: run logged, latest-* unchanged, generic writeDown never attempted', async () => {
  const E = await seeded(); const cRaw = E.raw(CELLS), sRaw = E.raw(LATEST), before = E.puts.length;
  at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error]; E.fail.put = (k) => k === CELLS; await hourly(E, '2026-11-10T16:07:00Z'); E.fail.put = null;
  assert.equal(E.raw(CELLS), cRaw); assert.equal(E.raw(LATEST), sRaw); assert.equal(E.bruns().at(-1).status, 'down');
  assert.ok(E.puts.slice(before).filter(p => p.key === CELLS).every(p => p.cond !== 'none'), 'no unconditional write attempted');
});

await t('9. missing records object beside fallback counts: /place withheld, nothing listed', async () => {
  const E = await seeded(); const c0 = await pj(E, '/cells/drifters');
  at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error]; await hourly(E, '2026-11-10T16:07:00Z'); E.m.delete(LATEST);
  const p = await place(E, firstCell(c0)); assert.equal(p.state, 'withheld'); assert.equal(p.records, undefined); assert.equal(p.last_attempt, undefined);
});

await t('10. place cutoff: fallback at 3 h 59 min → records with last_attempt; at 4 h 01 min → withheld, no records; an ordinary old pair is listed as today', async () => {
  const E = await seeded(); const c0 = await pj(E, '/cells/drifters'), id = firstCell(c0);
  at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error]; await hourly(E, '2026-11-10T16:07:00Z');
  NOW = Date.parse(c0.retrieved_at) + 4 * H - 60e3; let p = await place(E, id);
  assert.equal(p.state, 'ok'); assert.ok(p.records.length >= 1); assert.equal(p.last_attempt.failed_at, '2026-11-10T16:08:42.000Z'); assert.equal(p.retrieved_at, c0.retrieved_at);
  NOW = Date.parse(c0.retrieved_at) + 4 * H + 60e3; p = await place(E, id);
  assert.equal(p.state, 'withheld'); assert.match(p.why, /latest update failed and the last successful update is over 4 h old/); assert.equal(p.records, undefined); assert.equal(p.cell, null); assert.equal(p.records_total, undefined);
  // no last_attempt (collection simply stopped): today's handling, records still returned for the page to label stale
  const F = await seeded(); const f0 = await pj(F, '/cells/drifters'); NOW = Date.parse(f0.retrieved_at) + 5 * H; const q = await place(F, firstCell(f0));
  assert.equal(q.state, 'ok'); assert.ok(q.records.length >= 1); assert.equal(q.last_attempt, undefined);
});

await t('10b. recovery during a place request: judged on the final counts envelope (recovered pair, no clause, no cutoff)', async () => {
  const E = await seeded(); const c0 = await pj(E, '/cells/drifters'), id = firstCell(c0);
  at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error]; await hourly(E, '2026-11-10T16:07:00Z');
  NOW = Date.parse(c0.retrieved_at) + 5 * H;   // the fallback is already expired when the request starts
  // a good run lands after /place read the counts and before it reads the records
  const get = E.env.R2.get; let armed = true;
  E.env.R2.get = async (k) => { if (armed && k === LATEST) { armed = false; osmc.unshift(good()); await manual(E); } return get(k); };
  const p = await place(E, id); E.env.R2.get = get;
  assert.notEqual(p.state, 'withheld'); assert.equal(p.last_attempt, undefined); assert.equal(p.retrieved_at, E.json(CELLS).retrieved_at); assert.equal(E.json(CELLS).last_attempt, undefined);
});

await t('13. failed_at is the moment of failure, not the end of slow storage: D1 log +2 s, each R2 write +3 s → still 16:08:58', async () => {
  const E = await seeded(); at('2026-11-10T16:08:58.000Z'); osmc = [KINDS.http_error]; E.adv.db = 2000; E.adv.put = 3000;
  await manual(E); E.adv.db = 0; E.adv.put = 0;   // a manual run runs the buoy job alone, so nothing else moves the clock first
  const c = E.json(CELLS); assert.equal(c.last_attempt.failed_at, '2026-11-10T16:08:58.000Z'); assert.ok(NOW >= Date.parse('2026-11-10T16:09:03.000Z'), 'the clock really did move to 16:09:03 or later during the handler (GPT\'s reproduction)');
});
await t('13b. failed_at survives the conditional-write retry unchanged', async () => {
  const E = await seeded(); at('2026-11-10T16:08:58.000Z'); osmc = [KINDS.http_error]; E.adv.put = 3000;
  // an EARLIER run (15:50, slow) publishes good data between this failure's read and its write → the write is retried on B's counts
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; osmc.unshift(good(1310, 7000)); await hourly(E, '2026-11-10T15:50:00Z'); return 'done'; };
  await manual(E); E.adv.put = 0;
  const c = E.json(CELLS); assert.equal(c.scheduled_for, '2026-11-10T15:50:00.000Z'); assert.equal(c.last_attempt.failed_at, '2026-11-10T16:08:58.000Z'); assert.equal(c.last_attempt.run, '2026-11-10T16:08:58.000Z');
  assert.ok(E.puts.filter(p => p.key === CELLS && p.cond === 'etag').length >= 2, 'the write really was retried');
});
await t('14. same-run guard: both objects publish and the run then throws → the published pair stays intact, no last_attempt, the failure is logged', async () => {
  const E = await seeded(); at('2026-11-10T16:08:10.000Z'); osmc = [good(1310, 3000)];
  E.fail.after = (k, o) => k === CELLS && !o.onlyIf;   // the counts write commits, then the call throws
  await hourly(E, '2026-11-10T16:07:00Z'); E.fail.after = null;
  const c = await pj(E, '/cells/drifters'), s = await pj(E, '/snapshot/drifters');
  assert.equal(c.retrieved_at, '2026-11-10T16:08:10.000Z'); assert.equal(s.retrieved_at, c.retrieved_at); assert.equal(c.scheduled_for, '2026-11-10T16:07:00.000Z');
  assert.equal(c.last_attempt, undefined, 'a run\'s own good data is not labelled as a failed update'); assert.equal(c.source_status, 'ok');
  const last = E.bruns().at(-1); assert.equal(last.status, 'down'); assert.match(last.note, /^uncaught: /);
  const p = await place(E, firstCell(c)); assert.equal(p.state, 'ok'); assert.equal(p.last_attempt, undefined);
});
await t('15. cold failure with a distinctive raw error: the public down envelope and every data endpoint stay clean', async () => {
  const E = makeEnv(); at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.fetch_failed]; await hourly(E, '2026-11-10T16:07:00Z');
  const c = await pj(E, '/cells/drifters'); assert.equal(c.source_status, 'down'); assert.equal(c.note, 'request failed'); assert.equal(c.reason, 'fetch_failed');
  for (const p of ['/cells/drifters', '/place/g4/10_10?layers=drifters', '/']) assert.ok(!(await pub(E, p)).text.includes('SECRET-RAW'), 'raw text in ' + p);
  assert.equal((await pub(E, '/snapshot/drifters')).status, 404);
  assert.ok(E.bruns().at(-1).note.includes('SECRET-RAW')); assert.ok(E.raw('cells/drifters/2026-11-10T16-07Z.json').includes('SECRET-RAW'), 'kept in the private per-run object');
  { const st = JSON.parse((await pub(E, '/status')).text), d = st.last_runs.find(x => x.layer === 'drifters'); assert.ok(d && !('note' in d) && !JSON.stringify(d).includes('SECRET-RAW'), '/status last_runs (hub >= 0.6.10): no run note'); }
  // refused response whose body carries the text
  const F = makeEnv(); at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.refused_by_checks]; await hourly(F, '2026-11-10T16:07:00Z');
  const f = await pj(F, '/cells/drifters'); assert.equal(f.note, 'response refused by our checks'); assert.ok(!F.raw(CELLS).includes('SECRET-RAW'));
});
await t('16. stored counts are malformed JSON: nothing good to keep → replaced by a down envelope, conditionally on the etag read', async () => {
  const E = await seeded(); E.setRaw(CELLS, '{"layer":"drifters","cells":{'); const sRaw = E.raw(LATEST), before = E.puts.length;
  at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error]; await hourly(E, '2026-11-10T16:07:00Z');
  const c = E.json(CELLS); assert.equal(c.source_status, 'down'); assert.equal(c.note, 'http error 522'); assert.equal(c.last_attempt, undefined);
  assert.deepEqual(E.puts.slice(before).filter(p => p.key === CELLS).map(p => p.cond), ['etag']); assert.equal(E.raw(LATEST), sRaw);
  // …and it loses to a good publish that lands in between
  const F = await seeded(); F.setRaw(CELLS, 'not json'); at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error];
  F.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; F.hooks.beforePut = null; const keep = NOW; NOW = Date.parse('2026-11-10T16:08:43.000Z'); osmc.unshift(good()); await manual(F); NOW = keep; return 'done'; };
  await hourly(F, '2026-11-10T16:07:00Z'); assert.equal(F.json(CELLS).source_status, 'ok'); assert.equal(F.json(CELLS).last_attempt, undefined);
});
await t('17. the stored counts body cannot be read (transient): left exactly as it was, the failure still logged', async () => {
  const E = await seeded(); const cRaw = E.raw(CELLS), eC = E.etag(CELLS), before = E.puts.length;
  at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error];
  const get = E.env.R2.get; E.env.R2.get = async (k) => { const o = await get(k); if (o && k === CELLS) { o.text = async () => { throw new Error('body read reset'); }; o.json = async () => { throw new Error('body read reset'); }; } return o; };
  await hourly(E, '2026-11-10T16:07:00Z'); E.env.R2.get = get;
  assert.equal(E.raw(CELLS), cRaw); assert.equal(E.etag(CELLS), eC); assert.equal(E.puts.slice(before).filter(p => p.key === CELLS).length, 0, 'no write attempted');
  assert.equal(E.bruns().at(-1).status, 'down'); assert.equal(E.bruns().at(-1).note, 'http 522');
});

await t('12. every failed run is logged, including the ones that left latest-* alone (cases 4, 6, 8b counted there); other layers still use writeDown', async () => {
  const E = await seeded(); at('2026-11-10T16:08:42.000Z'); osmc = [KINDS.http_error]; await hourly(E, '2026-11-10T16:07:00Z');
  assert.equal(E.bruns().filter(r => r.status === 'down').length, 1);
  const co2 = JSON.parse(E.raw('latest-cells/co2.json')); assert.equal(co2.source_status, 'down', 'co2 (stubbed 503) still gets the generic down envelope');
});

console.log(`\nosmc-reliability-hub: ${pass} passed, ${failN} failed${B ? `  (BREAK=${B})` : ''}`);
process.exit(failN ? 1 : 0);
