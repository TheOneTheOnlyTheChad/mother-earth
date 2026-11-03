// Offline test + CPU measurement of the hub's orbital build (orbBuild) on a real Space-Track GP file.
// Usage: node phase1/orbital.test.mjs <space-track-gp.csv>   (the 3 Nov sample lives in bench-private, not in the repo)
// No network, no R2. Measures CPU of THIS machine (process.cpuUsage) — a proxy, not the Worker's figure.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { orbBuild, orbClassify, ORB_CLASSES } from './worker.js';

const path = process.argv[2];
if (!path) { console.error('usage: node phase1/orbital.test.mjs <gp.csv>'); process.exit(2); }
const TEXT = fs.readFileSync(path, 'utf8');
let passed = 0; const t = (name, fn) => { fn(); passed++; console.log('ok -', name); };
const cpu = (fn) => { const a = process.cpuUsage(); const r = fn(); const b = process.cpuUsage(a); return { r, ms: Math.round((b.user + b.system) / 1000) }; };
const rowsOf = (s) => s.split('\n').filter(Boolean).length - 1;
const FULL = rowsOf(TEXT);

t('classifier: type first; status only for payloads; unknown never becomes inactive', () => {
  assert.equal(orbClassify('ROCKET BODY', '+'), 'rocket_body');
  assert.equal(orbClassify('DEBRIS', undefined), 'debris');
  assert.equal(orbClassify('UNKNOWN', '+'), 'unknown_type');
  assert.equal(orbClassify('TBA', '-'), 'unknown_type');
  for (const c of ['+', 'P', 'B', 'S', 'X']) assert.equal(orbClassify('PAYLOAD', c), 'active');
  assert.equal(orbClassify('PAYLOAD', '-'), 'inactive');
  for (const c of ['', '?', 'D']) assert.equal(orbClassify('PAYLOAD', c), 'payload_status_unknown');
  assert.equal(orbClassify('PAYLOAD', null), 'payload_unmatched');
  assert.equal(orbClassify('PAYLOAD', undefined), 'payload_status_unavailable');
});

let base;
t(`real file (${TEXT.length} B, ${FULL} rows): valid, counts by type match the 3 Nov measurement`, () => {
  const { r, ms } = cpu(() => orbBuild(TEXT, null, null));
  base = r; console.log('   cpu (this machine) build, no status map:', ms, 'ms; out', r.csv.length, 'B');
  assert.ok(r.ok, r.problems.join('; '));
  assert.equal(r.rows, FULL);
  assert.equal(r.counts.rocket_body + r.counts.debris + r.counts.unknown_type + r.counts.payload_status_unavailable, FULL);
  if (FULL === 32517) {   // the 07:31 sample: payload 18,954 · rocket body 2,205 · debris 10,124 · unknown 1,234
    assert.deepEqual([r.counts.payload_status_unavailable, r.counts.rocket_body, r.counts.debris, r.counts.unknown_type], [18954, 2205, 10124, 1234]);
  }
  const lines = r.csv.split('\n'); assert.equal(lines[0].split(',').length, 18); assert.ok(lines.slice(1, -1).every(l => l.split(',').length === 18));
});

t('with a status map: every payload lands in exactly one status class; missing ⇒ unmatched, never inactive', () => {
  const m = new Map(); let i = 0;
  for (const line of TEXT.split('\n').slice(1)) {
    if (!line) continue; const f = line.slice(1, -1).split('","'); if (f[29] !== 'PAYLOAD') continue;
    const k = i++ % 10; if (k === 9) continue;                 // 10 % of payloads absent from the map
    m.set(f[19], ['+', '+', '+', '+', '-', '', '?', 'P', 'X'][k]);
  }
  const { r, ms } = cpu(() => orbBuild(TEXT, m, FULL)); console.log('   cpu (this machine) build with status map:', ms, 'ms');
  assert.ok(r.ok);
  const p = r.counts.active + r.counts.inactive + r.counts.payload_status_unknown + r.counts.payload_unmatched;
  assert.equal(p, base.counts.payload_status_unavailable);
  assert.equal(r.counts.payload_status_unavailable, 0);
  assert.ok(r.counts.payload_unmatched > 0 && r.counts.payload_status_unknown > 0);
});

t('truncated mid-row (no trailing newline) ⇒ refused', () => {
  const r = orbBuild(TEXT.slice(0, Math.floor(TEXT.length * 0.6)), null, FULL); assert.equal(r.ok, false); assert.equal(r.csv, null);
  assert.match(r.problems.join(';'), /final line incomplete/);
});
t('truncated mid-row but ending in a newline (partial last row) ⇒ refused by field count', () => {
  const cut = TEXT.lastIndexOf('","', Math.floor(TEXT.length * 0.98)); const r = orbBuild(TEXT.slice(0, cut) + '"\n', null, FULL);
  assert.equal(r.ok, false); assert.match(r.problems.join(';'), /not \d+ quoted fields/);
});
t('truncated on a COMPLETE row at 80 % ⇒ refused by the 90 %-of-previous floor', () => {
  const cut = TEXT.indexOf('\n', Math.floor(TEXT.length * 0.8)) + 1; const r = orbBuild(TEXT.slice(0, cut), null, FULL);
  assert.equal(r.ok, false); assert.match(r.problems.join(';'), /vs previous valid/);
});
t('truncated on a COMPLETE row at 95 % ⇒ PASSES (known blind spot: not detectable from the body; stated in meta)', () => {
  const cut = TEXT.indexOf('\n', Math.floor(TEXT.length * 0.95)) + 1; const r = orbBuild(TEXT.slice(0, cut), null, FULL);
  assert.equal(r.ok, true); assert.ok(r.rows < FULL);
});
t('first run with no previous: complete-row cut above the 20,000-row floor also passes (same blind spot)', () => {
  const cut = TEXT.indexOf('\n', Math.floor(TEXT.length * 0.7)) + 1; assert.equal(orbBuild(TEXT.slice(0, cut), null, null).ok, true);
});
t('HTML error page with HTTP 200, empty body, wrong header ⇒ refused', () => {
  assert.equal(orbBuild('<html>error</html>\n', null, null).ok, false);
  assert.equal(orbBuild('', null, null).ok, false);
  assert.equal(orbBuild('A,B,C\n"1","2","3"\n', null, null).ok, false);
});
t('a corrupted row (field dropped) and a duplicate NORAD id ⇒ refused', () => {
  const lines = TEXT.split('\n'); const bad = lines.slice(); bad[100] = bad[100].replace('","', '');
  assert.match(orbBuild(bad.join('\n'), null, FULL).problems.join(';'), /quoted fields/);
  const dup = lines.slice(); dup.splice(200, 0, lines[150]);
  assert.match(orbBuild(dup.join('\n'), null, FULL).problems.join(';'), /duplicate NORAD/);
});
console.log(`\n${passed}/10 passed`);
console.log('classes', JSON.stringify(base.counts));
