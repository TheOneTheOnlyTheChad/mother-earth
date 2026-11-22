/* Counts the R2 and D1 calls one collector run makes, by kind of run, on hub 0.6.22. The real worker.js against a recording bucket,
 * EUMETView replaced by the fixtures. Nothing reaches the network.   node operation-counts.mjs */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), P1 = path.resolve(HERE, '../../../phase1'), FX = path.join(P1, 'earthview-fixtures');
const tmp = path.join(os.tmpdir(), `worker-count-${process.pid}.mjs`); fs.writeFileSync(tmp, fs.readFileSync(path.join(P1, 'worker.js'))); const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);
const log = console.log.bind(console); console.log = () => { };
const store = new Map(), ops = [], rows = []; let latest = '2026-11-19T11:00:00Z', ev = 0;
const R2 = {
  async put(key, body, o = {}) { ops.push('put'); if (o.onlyIf) { const had = store.get(key); if (o.onlyIf.etagDoesNotMatch === '*' ? !!had : (!had || had.etag !== o.onlyIf.etagMatches)) return null; } const buf = Buffer.from(typeof body === 'string' ? body : body.buffer ? body.buffer : body), etag = crypto.createHash('md5').update(buf).digest('hex'); store.set(key, { buf, etag, o }); return { key, etag }; },
  async get(key) { ops.push('get'); const x = store.get(key); if (!x) return null; return { body: x.buf, etag: x.etag, customMetadata: x.o.customMetadata, async arrayBuffer() { return x.buf.buffer.slice(x.buf.byteOffset, x.buf.byteOffset + x.buf.byteLength); }, async json() { return JSON.parse(x.buf.toString('utf8')); }, async text() { return x.buf.toString('utf8'); } }; },
  async head(key) { ops.push('head'); const x = store.get(key); return x ? { size: x.buf.length, etag: x.etag } : null; },
  async list({ prefix = '' } = {}) { ops.push('list'); const all = [...store.keys()].filter(k => k.startsWith(prefix)).sort(); return { objects: all.map(key => ({ key, size: store.get(key).buf.length })), truncated: false }; },
  async delete(key) { ops.push('delete'); store.delete(key); } };
const DB = { prepare(sql) { return { bind() { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) rows.push(1); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }; } };
const env = { R2, DB, ADMIN_KEY: 'k', EARTHVIEW_ENABLED: 'manual' }, AUTH = { Authorization: 'Bearer k' }, CTX = { waitUntil() { } };
globalThis.fetch = async url => { const u = String(url); ev++; if (/GetCapabilities/.test(u)) return new Response(`<WMS_Capabilities><Layer><Name>mtg_fd:rgb_geocolour</Name><Dimension name="time" default="${latest}">x</Dimension></Layer></WMS_Capabilities>`, { headers: { 'content-type': 'text/xml' } });
  const isPic = /image\/jpeg/.test(u), t = (u.match(/time=([^&]+)/) || [])[1]; return new Response(fs.readFileSync(path.join(FX, isPic ? 'day.jpg' : 'day.png')), { headers: { 'content-type': isPic ? 'image/jpeg' : 'image/png', warning: `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` } }); };
const call = (p, m = 'POST') => W.default.fetch(new Request('https://hub.test' + p, { method: m, headers: AUTH }), env, CTX).then(r => r.json());
const measure = async (name, fn) => { ops.length = 0; rows.length = 0; ev = 0; const r = await fn(); const n = k => ops.filter(o => o === k).length;
  log(`| ${name} | ${typeof r === 'string' ? r : r.result || r.action || JSON.stringify(r).slice(0, 40)} | ${ev} | ${n('get') + n('head')} (get ${n('get')}, head ${n('head')}) | ${n('put') + n('list')} (put ${n('put')}, list ${n('list')}) | ${n('delete')} | ${rows.length} |`); };
log('| Call | Result | Requests to the source | Class B: reads | Class A: writes and lists | Deletes (free) | Run-log rows |\n|---|---|---|---|---|---|---|');
await measure('status (dry, empty storage)', () => call('/admin/earthview/status', 'GET'));
await measure('hold', () => call('/admin/earthview/hold?apply=1'));
let plan; await measure('recover dry run', async () => { const d = await call('/admin/earthview/recover', 'GET'); plan = d.plan_id; return d; });
await measure('recover apply (first start)', () => call('/admin/earthview/recover?apply=1&plan=' + plan));
await measure('release apply', () => call('/admin/earthview/release?apply=1'));
await measure('manual run: first published frame', () => call('/admin/run/earthview'));
await measure('run: nothing newer', () => call('/admin/run/earthview'));
latest = '2026-11-19T11:10:00Z'; await measure('run: second published frame', () => call('/admin/run/earthview'));
latest = '2026-11-19T11:20:00Z'; await measure('run: third published frame (steady state without a deletion)', () => call('/admin/run/earthview'));
await measure('status (three pictures held)', () => call('/admin/earthview/status', 'GET'));
env.EARTHVIEW_ENABLED = undefined; await measure('run refused by the gate', () => call('/admin/run/earthview'));
