// Regression test for bench-orbital 1.1: Space-Track's CSV quotes every field; the classifier must see every row.
// orbital-1.0 skipped quoted lines and classified 0 of 32,517 (3 Nov). Usage: node phase1/bench-orbital/unquote.test.mjs [bench.html]
// Shown to fail when unquoteCsv stops converting commas inside fields.
import fs from 'node:fs'; import assert from 'node:assert/strict';
const s = fs.readFileSync(process.argv[2] || new URL("./bench-orbital.html.txt", import.meta.url), 'utf8');
const grab = (name) => { const i = s.indexOf('function ' + name + '('); let d = 0, j = s.indexOf('{', i); for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) break; } return s.slice(i, j + 1); };
const unquoteCsv = eval('(' + grab('unquoteCsv') + ')'); const classify = eval('(' + grab('classify') + ')');
const H = 'OBJECT_NAME,EPOCH,OBJECT_TYPE,NORAD_CAT_ID,TLE_LINE1';
const row = (n, t, id) => [n, '2026-11-02T03:39:04.665312', t, id, '1 00005U 58002B'].map(x => '"' + x + '"').join(',');
const csv = H + '\n' + [row('A', 'PAYLOAD', 1), row('B, X', 'PAYLOAD', 2), row('C', 'ROCKET BODY', 3), row('D', 'DEBRIS', 4), row('E', 'UNKNOWN', 5), row('F', 'PAYLOAD', 6), row('G', 'PAYLOAD', 7)].join('\n') + '\n';
const u = unquoteCsv(csv); assert.equal(u.fields_with_comma, 1);
const { c } = classify(u.csv, { 1: '+', 2: '-', 7: '' });
assert.equal(c.quoted, 0); assert.equal(c.active, 1); assert.equal(c.inactive_payload, 1); assert.equal(c.rocket_body, 1); assert.equal(c.debris, 1);
assert.equal(c.unknown_type, 1); assert.equal(c.payload_unmatched, 1); assert.equal(c.payload_status_unknown, 1); assert.equal(c.payload_total, 4); assert.equal(c.payload_matched, 3);
const raw = classify(csv, {}).c; assert.equal(raw.quoted, 7, 'quoted input unnormalised is all skipped (the 1.0 defect)');
console.log('ok', JSON.stringify(c));
