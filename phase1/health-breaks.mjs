// Breaks must bite (HANDOVER §3): each deliberate break of the health code must make health-hub.test.mjs FAIL.
// Writes modified copies of worker.js to a temp dir and runs the suite against each. Nothing in the repo is changed.
// Usage: node phase1/health-breaks.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const here = path.dirname(new URL(import.meta.url).pathname);
const src = fs.readFileSync(path.join(here, 'worker.js'), 'utf8');
const BREAKS = {
  'fail-open on unreadable data': ["r = { healthy: false, reasons: ['health data unreadable: '", "r = { healthy: true, reasons: ['health data unreadable: '"],
  'boundary masks real failures': ["(status = 'down' AND note LIKE ?)", "(status = 'down' AND (note LIKE ? OR 1))"],
  'HEAD not handled (405)': ["if (req.method !== 'GET' && req.method !== 'HEAD') return json({ error: 'GET or HEAD only' }", "if (req.method !== 'GET') return json({ error: 'GET or HEAD only' }"],
  'HEAD answered with a body': ["if (req.method === 'HEAD') return new Response(null,", "if (false) return new Response(null,"],
  'resource guard not checked': ['if (guard) reasons.push(', 'if (false) reasons.push('],
  'guard closed by a later run (P5)': ["AND finished_at > ? AND note LIKE '%resource guard%' ORDER BY finished_at DESC LIMIT 1\").bind(layer, ok.finished_at)", "AND finished_at > ? AND note LIKE '%resource guard%' AND id = (SELECT MAX(id) FROM collector_runs WHERE layer = ?1) ORDER BY finished_at DESC LIMIT 1\").bind(layer, ok.finished_at)"],
  'published file not checked': ['const pubMs = Math.min(logMs, fileMs);', 'const pubMs = logMs;'],
  'cacheable answers': ["const nowMs = Date.now(), hdr = { 'Cache-Control': 'no-store, max-age=0' };", "const nowMs = Date.now(), hdr = { 'Cache-Control': 'public, max-age=60' };"],
  'notes not redacted': ["function healthNote(env, s) {", "function healthNote(env, s) { return String(s); "],
  'gap alerts forever': ['(detected_at >= ? OR detected_at IS NULL', '(detected_at >= ? OR 1 OR detected_at IS NULL'],
  'recent gaps only from the 5-row list (P2)': ["const pend = (pendR.results || []).map(r => r.day), recent = recentR.results || [],", "const pend = (pendR.results || []).map(r => r.day), recent = (listR.results || []).filter(g => g.detected_at >= since),"],
  'silent missing day not checked (P3)': ['if (established && !yy.done', 'if (false && !yy.done'],
  'established only from activity (P3)': ['const established = !!(est.cp || est.gp || est.ha || est.data);', 'const established = !!est.ha;'],
  'future times accepted (P4)': ['if (v > nowMs + HEALTH_SKEW_MS) throw', 'if (false) throw'],
  'coverage evidence not validated (P1)': ['if (bad.length) return { healthy: false', 'if (false) return { healthy: false'],
  'coverage cutoff not matched (P6)': ['if (c.cutoff !== cp.cutoff) bad.push(', 'if (false) bad.push('],
  '/status not redacted': ['return json(redactStatus(env, {', 'return json(((e, x) => x)(env, {'],
  'no boundary allowance': ['if (due >= d0 && due < bEnd) due =', 'if (false) due ='],
  'coverage stale ignored': ["if (c.input_status === 'current') return", "if (true) return"],
};
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-breaks-'));
let bit = 0, missed = [];
for (const [name, [from, to]] of Object.entries(BREAKS)) {
  if (src.split(from).length !== 2) { console.log('BAD BREAK (pattern not found exactly once):', name); missed.push(name); continue; }
  const f = path.join(dir, name.replace(/\W+/g, '-') + '.js'); fs.writeFileSync(f, src.replace(from, to));
  const r = spawnSync(process.execPath, ['--no-warnings', path.join(here, 'health-hub.test.mjs')], { env: { ...process.env, WORKER: f }, encoding: 'utf8' });
  const fails = (r.stdout.match(/^FAIL - ([HP]\d+\w*)/gm) || []).map(x => x.slice(7));
  if (r.status !== 0 && fails.length) { bit++; console.log(`bites  - ${name}: ${fails.join(', ')}`); } else { missed.push(name); console.log(`MISSED - ${name} (suite passed)`); }
}
console.log(`\n${bit} of ${Object.keys(BREAKS).length} breaks caught`); process.exit(missed.length ? 1 : 0);
