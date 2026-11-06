// Breaks must bite: each deliberate break of the FIRMS v2 code must make firms-v2.test.mjs FAIL in a BEHAVIOURAL case
// (S0, the SQL-text comparison, does not count — a break must be caught by what the worker does).
// Writes modified copies of worker.js to a temp dir and runs the suite against each. Nothing in the repo is changed.
// Usage: node phase1/firms-v2-breaks.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const here = path.dirname(new URL(import.meta.url).pathname);
const src = fs.readFileSync(path.join(here, 'worker.js'), 'utf8');
const BREAKS = {
  'claim ignores a live owner': ['     AND NOT EXISTS (SELECT 1 FROM firms_attempts b WHERE b.run_id = ?1 AND b.finished_at IS NULL AND b.lease_until > ?4)\n', '\n'],
  'commit not fenced to the latest attempt': ['  WHERE a.token = ?1 AND a.finished_at IS NULL\n    AND a.attempt = (SELECT MAX(attempt) FROM firms_attempts m WHERE m.run_id = a.run_id)\n', '  WHERE a.token = ?1 AND a.finished_at IS NULL\n'],
  'failure fence result ignored': ["if (!fenced.meta || fenced.meta.changes !== 1) { await env.DB.prepare(FVSQL.FAIL_STALE)", "if (false) { await env.DB.prepare(FVSQL.FAIL_STALE)"],
  'same run = ours (rev-5 bug)': ["if (md.status === me.status) return me.status === 'ok' && md.token !== me.token ? 'mismatch' : 'ours';\n  return md.status === 'down' && me.status === 'ok' ? 'older' : 'newer';", "return 'ours';"],
  'other runs always older': ["if (md.run_id !== me.run_id) return md.retrieved_at > me.retrieved_at ? 'newer' : 'older';", "if (md.run_id !== me.run_id) return 'older';"],
  'discovery skips the current run (> not >=)': ['AND publish_attempts < 3 AND retrieved_at >= ?1 ORDER BY retrieved_at DESC LIMIT 1`,', 'AND publish_attempts < 3 AND retrieved_at > ?1 ORDER BY retrieved_at DESC LIMIT 1`,'],
  'publication put unconditional': ["{ onlyIf: o === 'absent' ? { etagDoesNotMatch: '*' } : { etagMatches: h.etag }, customMetadata: meta,", "{ customMetadata: meta,"],
  'create-only not gated on verification': ["if (o === 'absent' && env.FIRMS_CREATE_ONLY !== 'verified') return 'refused-absent';", ''],
  'legacy after-retrieval treated as older': ["? 'older' : 'uncertain';", "? 'older' : 'older';"],
  'resource guard removed (v2)': ['if (a.bytes > FIRMS_MAX_PARSE_BYTES) {', 'if (false) {'],
  'line limit not enforced': ["if (ln.length > FV.maxLine) throw new Error(`line longer than ${FV.maxLine} chars`); yield ln;", 'yield ln;'],
  'Content-Length not checked': ['if (contentLength !== null && contentLength !== res.bytes)', 'if (false)'],
  'writer drops completed parts (single put of the last part)': ['if (!mpu) { await env.R2.put(key, buf.slice(0, n), putOpts);', 'if (true) { if (mpu) await mpu.abort(); await env.R2.put(key, buf.slice(0, n), putOpts);'],
  '/place ties out of legacy order': ["while (pos > 0 && String(top[pos - 1][iT]) < k) pos--;", "while (pos > 0 && String(top[pos - 1][iT]) <= k) pos--;"],
  '/place cache unbounded': ['while (fvPlace.bytes > FV.placeCacheBytes && fvPlace.cache.size)', 'while (false)'],
  '/place scan cap removed': ['while (fvPlace.scans >= FV.placeScans) {', 'while (false) {'],
  'legacy snapshot size not checked': ['if (sz > FV.legacyMaxJson) {', 'if (false) {'],
  'gunzip not bounded': ['if (n > limit) { try { await rd.cancel(); } catch (_) {} return null; }', ''],
  'v2 uncaught → legacy writeDown': ["if (layer === 'firms' && env.FIRMS_PIPELINE === 'v2') { try {", "if (false) { try {"],
  'sidecar FRP count wrong': ["g.frpSum = (g.frpSum ?? 0) + row[4]; g.frpN++;", "g.frpSum = (g.frpSum ?? 0) + row[4];"],
  'checkpoint always prefers legacy': ["if (newer && (!legacy || newer.retrieved_at > legacy.retrieved_at)) return", "if (newer && !legacy) return"],
  'publication error not left for repair': ["try { return { r: await fvPublish(env, runId), records: p.records, bytes: p.bytes }; } catch (e) { return { r: 'publication error (pending repair): ' + String(e).slice(0, 160) }; }", "return { r: await fvPublish(env, runId), records: p.records, bytes: p.bytes };"],
  'empty-file note changed': ["const why = new Date().getUTCHours() < FIRMS_DAY_BOUNDARY_H ? `${FV.boundary} (UTC)", "const why = new Date().getUTCHours() < FIRMS_DAY_BOUNDARY_H ? `nothing yet (UTC)"],
  'counts written before records commit (no CAS on latest/)': ["const r1 = await fvCas(env, FV.latest, async () => fvBody(await env.R2.get(out.snapshot_key)), me);", "const r1 = 'written';"],
  'download never times out': ['const ac = new AbortController(), timer = setTimeout(() => ac.abort(', 'const ac = new AbortController(), timer = setTimeout(() => ('],
  // GPT production-review fixes (G1–G5)
  'checkpoint always prefers the committed output (rollback wrong)': ["if (newer && (!legacy || newer.retrieved_at > legacy.retrieved_at)) return", "if (newer) return"],
  'checkpoint swallows a failed D1 read (gap instead of defer)': ["catch (e) { if (!(env.FIRMS_PIPELINE !== 'v2' && /no such table/i.test(String(e)))) throw new Error('committed-output read failed; checkpoint deferred: ' + String(e).slice(0, 160)); }", "catch (e) { }"],
  'sidecar never validated': ["function fvAuxProblem(aux, out, size) {\n  if (!aux) return 'missing';", "function fvAuxProblem(aux, out, size) {\n  return null;"],
  'snapshot hash not checked at checkpoint': ["if (got.bytes !== out.snapshot_bytes || got.sha256 !== out.snapshot_sha256) { try { await env.R2.delete(key); }", "if (false) { try { await env.R2.delete(key); }"],
  'publication uses the sidecar unchecked': ["const aux = await fvAuxFor(env, out, 'publication');", "const aux = await getJson(env, out.aux_key);"],
  'snapshot object not matched to the commit': ["if (!h || h.size !== out.snapshot_bytes || md.run_id !== out.run_id || md.token !== out.token || md.retrieved_at !== out.retrieved_at)", "if (!h)"],
  'health compares the log with the records upload (G4 false alarm)': ["else cmpMs = tAt(o.cells_at, nowMs, 'publication completed (cells_at)');", "else void 0;"],
  'health takes the age from the repair log (stale data looks fresh)': ["const pubMs = Math.min(logMs, fileMs);", "const pubMs = logMs;"],
  'health ignores which run the ok log is for': ["if (!String(ok.note || '').includes('run=' + md.run_id)) reasons.push(", "if (false) reasons.push("],
  'writer does not abort on its own failure': ["const guard = async fn => { try { return await fn(); } catch (e) { await abort(); throw e; } };", "const guard = async fn => fn();"],
  'probe does not abort the uploads it tracks': ["for (const u of uploads) if (u.isOpen()) try { await u.abort(); } catch (_) {}", ""],
  'v2 path used before v2 ever ran (deploy with v2 off changes the checkpoint)': ["if (env.FIRMS_PIPELINE === 'v2') return true;\n  try {", "if (true) return true;\n  try {"],
  'cutover-state read failure treated as "never ran"': ["catch (e) { if (/no such table/i.test(String(e))) return false; throw new Error('v2 state read failed", "catch (e) { if (true) return false; throw new Error('v2 state read failed"],
};
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'firms-v2-breaks-'));
let bit = 0; const missed = [];
for (const [name, [from, to]] of Object.entries(BREAKS)) {
  if (src.split(from).length !== 2) { console.log('BAD BREAK (pattern not found exactly once):', name); missed.push(name); continue; }
  const f = path.join(dir, name.replace(/\W+/g, '-') + '.js'); fs.writeFileSync(f, src.replace(from, to));
  const r = spawnSync(process.execPath, ['--no-warnings', path.join(here, 'firms-v2.test.mjs')], { env: { ...process.env, WORKER: f }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 600e3 });
  const fails = (r.stdout.match(/^FAIL - (\w+)\./gm) || []).map(x => x.slice(7, -1)).filter(x => x !== 'S0');
  if (r.status !== 0 && fails.length) { bit++; console.log(`bites  - ${name}: ${fails.join(', ')}`); } else { missed.push(name); console.log(`MISSED - ${name}` + (r.status ? ' (only S0 or a crash)' : ' (suite passed)') + (r.stderr ? ' ' + r.stderr.slice(0, 200) : '')); }
}
console.log(`\n${bit} of ${Object.keys(BREAKS).length} breaks caught`); process.exit(missed.length ? 1 : 0);
