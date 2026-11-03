/* Mother Earth — orbital panel: pure-helper tests (thread 8, 3 Nov 2026). No DOM, no hub.
 * Fixture = the hub 0.3.0 meta shape with the counts measured from the real 3 Nov 10:40 build (32,512 objects).
 * Run: node phase1/orbital-ui.test.mjs   (exit 0 = all pass) */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
globalThis.window = {};
new Function(readFileSync(join(here, '..', 'app.js'), 'utf8'))();
const ME = globalThis.window.ME;
let pass = 0, fail = 0;
const ok = (name, cond, got) => { if (cond) pass++; else { fail++; console.log('FAIL ', name, got !== undefined ? '\n      got: ' + JSON.stringify(got) : ''); } };

const COUNTS = { active: 0, inactive: 0, rocket_body: 2205, debris: 10121, unknown_type: 1232, payload_status_unknown: 0, payload_unmatched: 0, payload_status_unavailable: 18954 };
const meta = (o = {}) => ({ layer: 'orbital', source_status: 'ok', retrieved_at: '2026-11-03T13:41:00.000Z', stale_after_s: 28800,
  elements: { rows: 32512, sha256: 'a'.repeat(64), columns: ME.ORB.HEADER.split(',') }, counts: { ...COUNTS },
  classification: { payload_status: 'pending — CelesTrak SATCAT operational status not used yet; every payload is payload_status_unavailable' }, ...o });
const T = Date.parse('2026-11-03T14:00:00Z');

// ---- type vs status
ok('pending ⇒ toggles by object type', ME.orbGroups(meta()).map(g => g.id).join() === 'payload,rocket_body,debris');
ok('pending ⇒ a payload with no status is still a payload (drawn under Payloads)', ME.orbGroupOf('payload_status_unavailable', meta()) === 'payload');
ok('pending ⇒ rocket bodies and debris are their own toggles', ME.orbGroupOf('rocket_body', meta()) === 'rocket_body' && ME.orbGroupOf('debris', meta()) === 'debris');
ok('unknown object type is never drawn', ME.orbGroupOf('unknown_type', meta()) === null);
const withStatus = meta({ classification: { payload_status: 'CelesTrak SATCAT, map dated 2026-11-03' } });
ok('status present ⇒ spec toggles', ME.orbGroups(withStatus).map(g => g.id).join() === 'active,inactive_rb,debris');
ok('status present ⇒ inactive payloads share a toggle with rocket bodies', ME.orbGroupOf('inactive', withStatus) === 'inactive_rb' && ME.orbGroupOf('rocket_body', withStatus) === 'inactive_rb');
for (const k of ['payload_status_unknown', 'payload_unmatched', 'payload_status_unavailable'])
  ok(`status present ⇒ ${k} is counted, not drawn, and never inactive`, ME.orbGroupOf(k, withStatus) === null);
ok('every class lands in exactly one group or the not-drawn list (both modes)', [meta(), withStatus].every(m =>
  Object.keys(COUNTS).every(k => (ME.orbGroups(m).filter(g => g.classes.includes(k)).length + (ME.orbNotDrawn(m).includes(k) ? 1 : 0)) === 1)));

// ---- each toggle shows only its own category: counts
const p = ME.orbPanel(meta(), { layer: 'orbital', status: 'ok', started_at: '2026-11-03T13:41:00Z' }, T);
ok('good snapshot ⇒ state ok', p.state === 'ok' && p.available, p.state);
ok('group counts = own classes only', JSON.stringify(p.groups.map(g => [g.id, g.count])) === JSON.stringify([['payload', 18954], ['rocket_body', 2205], ['debris', 10121]]), p.groups);
ok('drawn + not drawn = rows', p.groups.reduce((a, g) => a + g.count, 0) + 1232 === 32512);
ok('not-drawn line states the count', p.lines.some(l => l.startsWith('1,232 objects are counted but not drawn')), p.lines);
ok('status-pending wording keeps type and status apart', p.lines.some(l => /payloads are identified as payloads/.test(l) && /not established/.test(l)));
ok('completeness marked unverified', p.lines.some(l => /^Completeness unverified/.test(l)));
ok('computed, not observed; markers not to scale', p.lines.some(l => /computed .* not observed/.test(l) && /not to physical scale/.test(l)));
ok('retrieval time shown as published', p.lines[0].startsWith('Element file retrieved 2026-11-03 13:41 UTC · 32,512 objects'), p.lines[0]);
ok('no word "inactive" anywhere while pending', !JSON.stringify(p).includes('inactive') || /active or inactive/.test(JSON.stringify(p)));

// ---- freshness and failure states
const none = ME.orbPanel(null, null, T);
ok('before the first snapshot ⇒ not available, no invented time', none.state === 'none' && !none.available && none.groups.length === 0 && /no orbital element file yet/.test(none.headline), none);
const noneFail = ME.orbPanel(null, { layer: 'orbital', status: 'down', started_at: '2026-11-03T13:41:05Z', note: 'login failed: HTTP 522' }, T);
ok('no snapshot + failed first run ⇒ says so with the attempt time', noneFail.state === 'none' && /13:41 UTC: down \(login failed: HTTP 522\)/.test(noneFail.lines[0]), noneFail.lines);
const failed = ME.orbPanel(meta(), { layer: 'orbital', status: 'down', started_at: '2026-11-03T15:41:04Z', note: 'GP HTTP 500' }, Date.parse('2026-11-03T15:50:00Z'));
ok('refresh failed, previous kept ⇒ state refresh_failed', failed.state === 'refresh_failed', failed.state);
ok('refresh failed ⇒ shows the ORIGINAL retrieval time of the file still served', /failed \(down\); showing the previous file, retrieved 2026-11-03 13:41 UTC/.test(failed.lines[0]), failed.lines[0]);
ok('refresh failed ⇒ the layers stay available with the same counts', failed.available && failed.groups[0].count === 18954);
const olderFail = ME.orbPanel(meta(), { layer: 'orbital', status: 'down', started_at: '2026-11-03T11:41:00Z', note: 'x' }, T);
ok('a failure OLDER than the file served is not reported as current', olderFail.state === 'ok', olderFail.state);
const stale = ME.orbPanel(meta(), null, Date.parse('2026-11-03T22:42:00Z'));
ok('older than stale_after ⇒ stale, with its age', stale.state === 'stale' && /9 h old \(older than 8 h\)/.test(stale.lines[0]), stale.lines[0]);
const staleFail = ME.orbPanel(meta(), { layer: 'orbital', status: 'down', started_at: '2026-11-03T21:41:00Z', note: 'x' }, Date.parse('2026-11-03T22:42:00Z'));
ok('stale + failed ⇒ both stated', staleFail.state === 'refresh_failed_stale' && staleFail.lines.length >= 7);

// ---- meta validation (the panel never draws from a file it cannot trust)
ok('valid meta passes', ME.orbMetaProblem(meta()) === null);
ok('wrong layer refused', !!ME.orbMetaProblem({ ...meta(), layer: 'satellites' }));
ok('missing CLASS column refused', !!ME.orbMetaProblem(meta({ elements: { rows: 32512, sha256: 'a'.repeat(64), columns: ME.ORB.HEADER.split(',').slice(0, -1) } })));
ok('counts that do not add up refused', !!ME.orbMetaProblem(meta({ counts: { ...COUNTS, debris: 1 } })));
ok('non-ok source_status refused', !!ME.orbMetaProblem(meta({ source_status: 'down' })));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
