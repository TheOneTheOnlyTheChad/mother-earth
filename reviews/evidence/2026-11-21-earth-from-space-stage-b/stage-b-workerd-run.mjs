/* Runs the whole hub (phase1/worker.js, as it is) inside workerd through Miniflare, with real local R2 and D1 bindings and EUMETView
 * replaced by the fixtures, and calls the Stage B route over HTTP with phase1/earthview-stage-b-call.sh, the script Chad would start.
 * Shows: the route works in Cloudflare's runtime; the calling script makes one POST with the key in a header and saves the answer;
 * the bucket and the database are EMPTY afterwards. It shows NOTHING about memory: local workerd enforces no 128 MB limit.
 *   node stage-b-workerd-run.mjs <path to miniflare's dist/src/index.js> */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFile } from 'node:child_process'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), P1 = path.resolve(HERE, '../../../phase1'), FX = path.join(P1, 'earthview-fixtures');
const { Miniflare, Response } = await import(pathToFileURL(process.argv[2]).href);
const T = '2026-11-19T11:00:00Z', KEY = 'local-test-key-51c9', PORT = 8791, HUB = `http://127.0.0.1:${PORT}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stage-b-')), keys = path.join(tmp, 'KEYS.md'); fs.writeFileSync(keys, `| name | value |\n|---|---|\n| ADMIN_KEY | ${KEY} |\n`);
/* This local workerd refuses a module whose named exports are not handlers ("Incorrect type for map entry"). The hub's named
 * exports exist only for its test suites; production (compatibility date 2026-10-30) has always run with them. For this run ONLY those
 * `export { … };` lines are removed; the count removed is printed. Nothing else in the file is changed. */
const RAWSRC = fs.readFileSync(path.join(P1, 'worker.js'), 'utf8'), EXPORT_LINES = RAWSRC.split('\n').filter(l => /^export \{ .* \};$/.test(l)), SRC = RAWSRC.split('\n').filter(l => !/^export \{ .* \};$/.test(l)).join('\n');
const row = (a, b) => console.log(`| ${a} | ${b} |`);
async function hub(extra, fn) { const reqs = [], out = [];
  const mf = new Miniflare({ modules: true, script: SRC, compatibilityDate: '2026-07-01', port: PORT, r2Buckets: ['R2'], d1Databases: ['DB'], bindings: { ADMIN_KEY: KEY, ...extra },
    outboundService: async request => { const u = request.url; reqs.push({ u, auth: request.headers.get('authorization'), ua: request.headers.get('user-agent') });
      if (/GetCapabilities/.test(u)) return new Response(`<WMS_Capabilities><Layer><Name>mtg_fd:rgb_geocolour</Name><Dimension name="time" default="${T}">x</Dimension></Layer></WMS_Capabilities>`, { headers: { 'content-type': 'text/xml' } });
      const isPic = /image\/jpeg/.test(u); return new Response(fs.readFileSync(path.join(FX, isPic ? 'day.jpg' : 'day.png')), { headers: { 'content-type': isPic ? 'image/jpeg' : 'image/png', warning: `99 Nearest value used: time=${T.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` } }); },
    handleRuntimeStdio(stdout, stderr) { stdout.on('data', d => out.push(String(d))); stderr.on('data', d => out.push(String(d))); } });
  await mf.ready;
  const stored = async () => { const b = await mf.getR2Bucket('R2'), l = await b.list(); const db = await mf.getD1Database('DB'); const t = await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name NOT LIKE '\\_cf%' ESCAPE '\\' AND name NOT LIKE 'sqlite%'").first(); return `bucket ${l.objects.length} objects, database ${t.n} tables`; };
  try { await fn({ mf, reqs, out, stored }); } finally { await mf.dispose(); } }
const script = async (n, start, env = {}) => { const o = path.join(tmp, 'out-' + Math.random().toString(16).slice(2));   // not execFileSync: the stubbed service answers from this process
  const { code, text } = await new Promise(res => execFile('bash', [path.join(P1, 'earthview-stage-b-call.sh'), String(n), start, '60'], { env: { ...process.env, STAGE_B_TEST_HUB: HUB, OUT: o, KEYS_FILE: keys, ...env }, encoding: 'utf8' }, (e, so, se) => res({ code: e ? e.code : 0, text: String(so || '') + String(se || '') })));
  const body = path.join(o, `observation-${n}.json`), meta = path.join(o, `observation-${n}.meta.txt`);
  return { code, text, o, j: fs.existsSync(body) ? JSON.parse(fs.readFileSync(body, 'utf8')) : null, meta: fs.existsSync(meta) ? fs.readFileSync(meta, 'utf8') : '' }; };
const nowIso = (d = 0) => new Date(Date.now() + d).toISOString().replace(/\.\d+Z$/, 'Z');
console.log(`worker.js: ${RAWSRC.length} bytes; ${EXPORT_LINES.length} test-only export lines removed for the local runtime\n`);
console.log('| Case | Result |\n|---|---|');
await hub({}, async ({ reqs, out, stored }) => {
  const a = await script(1, nowIso(-5000)), j = a.j || {};
  row('the calling script, window open now', `exit ${a.code}; answer saved: outcome "${j.outcome}", ${j.requests_made} requests, frame ${j.frame_time}, header_ok ${j.header_ok}, validation ok ${j.validation && j.validation.ok}, hub ${j.hub}, isolate requests_served ${j.isolate && j.isolate.requests_served}${j.outcome === "validated" ? "" : " " + JSON.stringify([j.list, j.picture, j.check])}`);
  row('upstream requests as the stub saw them', `${reqs.length}; Authorization forwarded on ${reqs.filter(q => q.auth).length}; User-Agent ${[...new Set(reqs.map(q => q.ua))].join(' / ')}`);
  row('after it: storage', await stored());
  row('the key in what the script printed, in the saved answer, in the meta file, in the runtime\'s output', [a.text, JSON.stringify(a.j), a.meta, out.join('')].map(s => s.includes(KEY) ? 'PRESENT' : 'absent').join(', '));
  row('probe log lines in the runtime\'s output', (out.join('').match(/"ev":"[a-z-]+"/g) || []).join(' '));
  const again = await script(1, nowIso(-5000), { OUT: a.o }); row('the script started again for the same observation', `exit ${again.code}: ${again.text.trim().slice(0, 90)}; upstream requests now ${reqs.length}`);
  const late = await script(2, nowIso(-3600000)); row('the script started an hour after its window', `exit ${late.code}: ${late.meta.split('\n').find(l => /^result/.test(l))}; upstream requests now ${reqs.length}`);
  const f = async (label, init, p = '/admin/probe/earthview') => { const r = await fetch(HUB + p, init); row(label, `HTTP ${r.status} ${(await r.text()).slice(0, 80)}; upstream requests now ${reqs.length}`); };
  await f('GET with the right header', { headers: { authorization: 'Bearer ' + KEY } });
  await f('POST with the key in the URL', { method: 'POST' }, '/admin/probe/earthview?key=' + KEY);
  await f('POST with a wrong key', { method: 'POST', headers: { authorization: 'Bearer nope' } });
  await f('GET /admin/run/earthview with the admin key (manual collector, gate unset)', {}, '/admin/run/earthview?key=' + KEY);
  row('after all of it: storage', await stored());
});
await hub({ EARTHVIEW_ENABLED: '1' }, async ({ reqs, stored }) => { const r = await fetch(HUB + '/admin/probe/earthview', { method: 'POST', headers: { authorization: 'Bearer ' + KEY } });
  row('gate ON (EARTHVIEW_ENABLED=1): POST with the right key', `HTTP ${r.status} ${(await r.text()).slice(0, 90)}; upstream requests ${reqs.length}; ${await stored()}`); });
fs.rmSync(tmp, { recursive: true, force: true });
