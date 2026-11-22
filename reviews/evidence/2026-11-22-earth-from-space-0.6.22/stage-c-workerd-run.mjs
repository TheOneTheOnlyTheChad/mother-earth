/* Runs the whole hub 0.6.22 (phase1/worker.js, as it is) inside workerd through Miniflare, with real local R2 and D1 bindings kept on
 * disk between restarts and EUMETView replaced by the fixtures, and walks the Stage C runbook with phase1/earthview-admin.sh, the
 * script Chad would start. A variable change is modelled the way it happens in production: the runtime is restarted with the new
 * bindings over the same storage. Then the scheduled handler is fired with chosen scheduled times against an admission window.
 * Shows: the sequence works end to end in Cloudflare's runtime, through HTTP, with the key in a header. It shows NOTHING about
 * memory or CPU limits: local workerd enforces neither.
 *   node stage-c-workerd-run.mjs <path to miniflare's dist/src/index.js> */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFile } from 'node:child_process'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), P1 = path.resolve(HERE, '../../../phase1'), FX = path.join(P1, 'earthview-fixtures');
const { Miniflare, Response } = await import(pathToFileURL(process.argv[2]).href);
const KEY = 'local-test-key-7c1e', PORT = 8793, HUB = `http://127.0.0.1:${PORT}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stage-c-')), keys = path.join(tmp, 'KEYS.md'), OUT = path.join(tmp, 'results'), persist = path.join(tmp, 'persist'); fs.writeFileSync(keys, `| name | value |\n|---|---|\n| ADMIN_KEY | ${KEY} |\n`);
/* As in the Stage B run: this local workerd refuses named exports that are not handlers. Only the test-only `export { … };` lines are
 * removed, and the count is printed. Nothing else in the file is changed. */
const RAWSRC = fs.readFileSync(path.join(P1, 'worker.js'), 'utf8'), EXPORT_LINES = RAWSRC.split('\n').filter(l => /^export \{ .* \};$/.test(l)), SRC = RAWSRC.split('\n').filter(l => !/^export \{ .* \};$/.test(l)).join('\n');
const row = (a, b) => console.log(`| ${a} | ${b} |`);
const S = { latest: '2026-11-19T11:00:00Z', reqs: [] };
async function hub(extra, fn) { const out = [];
  const mf = new Miniflare({ modules: true, script: SRC, compatibilityDate: '2026-07-01', port: PORT, r2Buckets: ['R2'], d1Databases: ['DB'], r2Persist: path.join(persist, 'r2'), d1Persist: path.join(persist, 'd1'), bindings: { ADMIN_KEY: KEY, ...extra },
    outboundService: async request => { const u = request.url; if (!u.includes('view.eumetsat.int')) return new Response('unavailable (local run)', { status: 503 });
      S.reqs.push({ u, auth: request.headers.get('authorization') });
      if (/GetCapabilities/.test(u)) return new Response(`<WMS_Capabilities><Layer><Name>mtg_fd:rgb_geocolour</Name><Dimension name="time" default="${S.latest}">x</Dimension></Layer></WMS_Capabilities>`, { headers: { 'content-type': 'text/xml' } });
      const isPic = /image\/jpeg/.test(u), t = (u.match(/time=([^&]+)/) || [])[1]; return new Response(fs.readFileSync(path.join(FX, isPic ? 'day.jpg' : 'day.png')), { headers: { 'content-type': isPic ? 'image/jpeg' : 'image/png', warning: `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` } }); },
    handleRuntimeStdio(stdout, stderr) { stdout.on('data', d => out.push(String(d))); stderr.on('data', d => out.push(String(d))); } });
  await mf.ready;
  const objects = async () => { const b = await mf.getR2Bucket('R2'), l = await b.list({ prefix: 'earthview/' }); return l.objects.map(o => o.key.replace(/frames\/e[^/]+\/[^/]+\//, 'frames/<epoch>/<id>/').replace(/epochs\/e[^.]+/, 'epochs/<epoch>')).sort(); };
  const lines = () => out.join('').split('\n').filter(l => l.includes('"earthview":"run-')).map(l => { try { return JSON.parse(l.slice(l.indexOf('{'))); } catch (_) { return null; } }).filter(Boolean);
  try { await fn({ mf, out, objects, lines }); } finally { await mf.dispose(); } }
const step = async (id, cmd, plan) => { const { code, text } = await new Promise(res => execFile('bash', [path.join(P1, 'earthview-admin.sh'), id, cmd, ...(plan ? [plan] : [])], { env: { ...process.env, EV_ADMIN_TEST_HUB: HUB, OUT, KEYS_FILE: keys }, encoding: 'utf8' }, (e, so, se) => res({ code: e ? e.code : 0, text: so + se })));
  const f = fs.readdirSync(OUT).filter(x => x.startsWith(id + '.') && x.endsWith('.json')).sort().pop(); return { code, text, j: f ? JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')) : null }; };
const seen = j => j && j.seen ? `pointer ${j.seen.pointer}, list ${j.seen.list}, ${j.seen.objects} picture(s), hold ${j.seen.hold ? 'yes' : 'no'}, guards "${j.seen.guards}"` : JSON.stringify(j);
console.log(`worker.js: ${RAWSRC.length} bytes; ${EXPORT_LINES.length} test-only export lines removed for the local runtime\n`);
console.log('| Step | Result |\n|---|---|');
// ---- gate unset: set up storage
await hub({}, async ({ objects }) => {
  let r = await step('C1', 'status'); row('C1 status (gate unset)', `exit ${r.code}; ${seen(r.j)}`);
  const refused = await fetch(HUB + '/admin/earthview/status?key=' + KEY); row('the same with the key in the URL instead (by hand, a made-up key)', `HTTP ${refused.status} ${(await refused.text()).slice(0, 100)}`);
  r = await step('C7-run-1', 'run'); row('a manual run attempted while the gate is unset (step C7-run-1 is spent on this in the local run only)', `exit ${r.code}; ${JSON.stringify(r.j)}; requests to the stubbed source so far ${S.reqs.length}`);
  r = await step('C2-hold', 'hold'); row('C2-hold', `exit ${r.code}; applied ${r.j && r.j.applied}; ${r.j && r.j.result}`);
  r = await step('C3', 'recover-plan'); const plan = r.j && r.j.plan_id; row('C3 recover-plan', `exit ${r.code}; mode "${r.j && r.j.plan && r.j.plan.mode}"; plan id ${plan ? 'given' : 'MISSING'}`);
  r = await step('C4-recover', 'recover-apply', plan); row('C4-recover', `exit ${r.code}; ${r.j && r.j.result}`);
  r = await step('C5a', 'sweep-plan'); row('C5 sweep-plan', `exit ${r.code}; would add ${r.j && r.j.plan ? r.j.plan.add.length : '?'}`);
  r = await step('C5b', 'release-plan'); row('C5 release-plan', `exit ${r.code}; ${r.j && (r.j.would || r.j.refused)}`);
  r = await step('C5-release', 'release-apply'); row('C5-release', `exit ${r.code}; ${r.j && r.j.result}`);
  r = await step('C5c', 'status'); row('status after release', `exit ${r.code}; ${seen(r.j)}`);
  row('objects under earthview/', (await objects()).join(', '));
  const again = await step('C2-hold', 'hold'); row('C2-hold started a second time', `exit ${again.code}: ${again.text.trim().slice(0, 80)}`);
});
// ---- gate "manual": one manual run
fs.rmSync(path.join(OUT, 'C7-run-1.claim'), { recursive: true, force: true }); for (const f of ['C7-run-1.json', 'C7-run-1.meta.txt']) fs.rmSync(path.join(OUT, f), { force: true });   // local run only: the refused attempt above used the id
await hub({ EARTHVIEW_ENABLED: 'manual' }, async ({ mf, objects, lines }) => { const before = S.reqs.length;
  const w = await mf.getWorker(); const sch = await w.scheduled({ cron: '*/5 * * * *', scheduledTime: new Date('2026-11-19T11:20:08Z') });
  row('gate "manual": a five-minute trigger fired by the runtime', `outcome ${sch.outcome}; requests to the stubbed source ${S.reqs.length - before}; run lines ${lines().length}`);
  const r = await step('C7-run-1', 'run'); row('C7-run-1 (gate "manual")', `exit ${r.code}; ${JSON.stringify(r.j && r.j.result)}; requests to the stubbed source ${S.reqs.length - before}; Authorization forwarded upstream on ${S.reqs.filter(q => q.auth).length}`);
  const l = lines(); row('the run\'s two log lines', l.map(x => `${x.earthview} exec ${x.exec === l[0].exec ? 'same' : 'DIFFERENT'} trigger ${x.trigger || '-'}${x.earthview === 'run-start' ? ` scheduled_before ${x.scheduled_before} fetches_before ${x.fetches_before} crons_before ${JSON.stringify(x.crons_before)}` : ` validations_before ${x.validations_before} validated ${x.validated}`}`).join(' · '));
  row('objects under earthview/', (await objects()).join(', '));
  const meta = await (await fetch(HUB + '/snapshot/earthview/meta')).json(), pic = await fetch(HUB + meta.frame.picture.path), buf = new Uint8Array(await pic.arrayBuffer()), sha = Buffer.from(await crypto.subtle.digest('SHA-256', buf)).toString('hex');
  row('public read-back', `frame ${meta.frame.source_frame_time}; picture HTTP ${pic.status}, ${buf.length} bytes, sha256 ${sha === meta.frame.picture.sha256 ? 'equals' : 'DIFFERS FROM'} the record's; cache-control "${pic.headers.get('cache-control')}"`);
  const st = await step('C8', 'status'); row('status after the run', `exit ${st.code}; ${seen(st.j)}; current ${st.j && st.j.seen.current}`);
  const r2 = await step('C7-run-2', 'run'); row('C7-run-2 started straight away', `exit ${r2.code}: ${r2.text.trim().slice(0, 90)}`);
});
// ---- gate "1" with a window: the scheduled path
await hub({ EARTHVIEW_ENABLED: '1', EARTHVIEW_FROM: '2026-11-19T12:00:00Z', EARTHVIEW_UNTIL: '2026-11-21T12:00:00Z' }, async ({ mf, objects, lines }) => { const w = await mf.getWorker();
  const fire = async (t, cron = '*/5 * * * *') => { const b = S.reqs.length, n = lines().length; const r = await w.scheduled({ cron, scheduledTime: new Date(t) }); return `outcome ${r.outcome}; requests to the stubbed source ${S.reqs.length - b}; run lines ${lines().length - n}`; };
  row('gate "1", window 19 Nov 12:00 to 21 Nov 12:00: trigger scheduled 11:50:08 (before FROM)', await fire('2026-11-19T11:50:08Z'));
  S.latest = '2026-11-19T11:40:00Z'; row('trigger scheduled 12:00:08 (first slot), a newer frame listed', await fire('2026-11-19T12:00:08Z'));
  row('trigger scheduled 12:05:08 (inside, off the cadence)', await fire('2026-11-19T12:05:08Z'));
  row('trigger scheduled 12:10:08, nothing newer listed', await fire('2026-11-19T12:10:08Z'));
  row('the SAME scheduled time 12:10:08 delivered again', await fire('2026-11-19T12:10:08Z'));
  row('trigger scheduled 21 Nov 11:50:08 (last slot)', await fire('2026-11-21T11:50:08Z'));
  row('trigger scheduled 21 Nov 12:00:08 (at UNTIL)', await fire('2026-11-21T12:00:08Z'));
  const l = lines(); row('run-start lines: scheduled_time, exec distinct, scheduled_before, crons_before', l.filter(x => x.earthview === 'run-start').map(x => `${x.scheduled_time} sb=${x.scheduled_before} ${JSON.stringify(x.crons_before)}`).join(' · ') + ` · distinct exec ids ${new Set(l.map(x => x.exec)).size} for ${l.filter(x => x.earthview === 'run-start').length} runs`);
  row('run-end results', l.filter(x => x.earthview === 'run-end').map(x => `${x.result} (validations_before ${x.validations_before})`).join(' · '));
  row('objects under earthview/', (await objects()).join(', '));
});
await hub({ EARTHVIEW_ENABLED: '1' }, async ({ mf, lines }) => { const w = await mf.getWorker(), b = S.reqs.length; const r = await w.scheduled({ cron: '*/5 * * * *', scheduledTime: new Date('2026-11-19T12:20:08Z') });
  row('gate "1" with NO window set: trigger scheduled 12:20:08', `outcome ${r.outcome}; requests to the stubbed source ${S.reqs.length - b}; run lines ${lines().length}`); });
row('the key in every answer the script saved and in everything it printed', fs.readdirSync(OUT).filter(f => !fs.statSync(path.join(OUT, f)).isDirectory()).some(f => fs.readFileSync(path.join(OUT, f), 'utf8').includes(KEY)) ? 'PRESENT' : 'absent');
fs.rmSync(tmp, { recursive: true, force: true });
