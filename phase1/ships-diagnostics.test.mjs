/* Mother Earth — ships diagnostics (collector mac-0.3.5; docs/concepts/SHIPS-DIAGNOSTICS-PROPOSAL.md rev 2.1, Part A).
 * What it proves about phase1/collector-mac.mjs:
 *   - every way a ships run can end without an ok sample writes one diagnostic line, with or without an error event;
 *   - what is UPLOADED for a failed run is one of the fixed phrases and carries none of the logged detail, on every path,
 *     including something thrown outside the socket code;
 *   - local text is cut, cleaned and built from named fields only; the key's value never appears;
 *   - the DNS check is bounded at 2 s, is ignored when late, and cannot keep the process alive (measured on a real child
 *     process whose lookup never answers and holds the process open);
 *   - after every ending the timers are gone and the socket is closed (a --dry child must end by itself, well inside the
 *     20 s its hard-stop timer would otherwise hold it);
 *   - an ok run logs nothing new; a sample the far end closed early, a low-flow sample and the 381.5 s / 700-record
 *     overlong sample are built exactly as before and get one extra line.
 * How: child processes run the REAL collector file as a command under `node --import phase1/ships-diagnostics.stub.mjs`
 * (stubbed WebSocket, dns.lookup and fetch); two cases import it in-process with a controllable clock. No network: any
 * real lookup or any fetch other than the test hub's ships ingest is recorded and fails the suite.
 * What it does NOT prove: what Node's real WebSocket client puts in an error event, or how macOS behaves. Those are read
 * from the Mac's log after installation.
 * Run: node phase1/ships-diagnostics.test.mjs        (about 45 s: two cases wait out the real 15 s and 10 s limits)
 * Breaks (each must fail): BREAK=precedence|upload-detail|outer-raw|no-dns-deadline|no-cleanup|serialise-event|no-exit-outstanding|log-raw-close */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawn } from 'node:child_process'; import { pathToFileURL } from 'node:url';
const HERE = path.dirname(new URL(import.meta.url).pathname), BREAK = process.env.BREAK || '';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ships-diag-'));
const KEYV = 'AIS-TEST-KEY-0123456789';
const allNetwork = [];
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 900)}` : ''}`); } };

// ---------- the collector under test (optionally weakened), as a copy beside its stub
let src = fs.readFileSync(path.join(HERE, 'collector-mac.mjs'), 'utf8');
const BREAKS = {
  'precedence': ["return meaningful.length ? cleanText(parts.join(' | '), 300) : 'no detail from the WebSocket client';", "return 'websocket error: ' + meaningful.join(' | ') || 'no detail from the WebSocket client';"],   // the fault on main: the fallback words can never apply
  'upload-detail': ['const e = new Error(publicNote); e.shipsPublic = publicNote; return e;', "const e = new Error(publicNote); e.shipsPublic = publicNote + ': ' + (d.error || '') + ' close ' + closeText(d.close); return e;"],
  'outer-raw': ['note = (err && err.shipsPublic) || SHIPS_PUBLIC.collector;', 'note = (err && err.shipsPublic) || String(err).slice(0, 200);'],   // main: whatever was thrown is uploaded
  'no-dns-deadline': ['const to = setTimeout(() => finish(`no answer in ${DIAG.deadlineMs / 1000} s`), DIAG.deadlineMs);', 'const to = null;'],
  'no-cleanup': ['const finishRun = () => { timers.forEach(clearTimeout); ws.onopen', 'const finishRun = () => { ws.onopen'],
  'serialise-event': ["let parts = [];\n  try {", "let parts = [];\n  if (ev) return JSON.stringify(ev).slice(0, 300);\n  try {"],
  'no-exit-outstanding': ["if (DIAG.outstanding) { process.stdout.write(text + '\\n', () => process.exit(0)); return; }", ''],
  'log-raw-close': ["const closeText = c => c ? `${Number.isFinite(Number(c.code)) ? Number(c.code) : '?'}/${cleanText(c.reason, 80) || '-'}` : 'unavailable';", "const closeText = c => c ? `${c.code}/${c.reason}` : 'unavailable';"],
};
if (BREAK) { if (!BREAKS[BREAK]) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); } const [a, b] = BREAKS[BREAK]; if (src.split(a).length !== 2) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } src = src.replace(a, b); }
const COLLECTOR = path.join(TMP, 'collector-mac.mjs'); fs.writeFileSync(COLLECTOR, src);
const STUB = path.join(HERE, 'ships-diagnostics.stub.mjs');

/** Runs the collector as a command. Returns exit code, both streams, the uploads the stub saw, and how long it took. */
let seq = 0;
function run({ scenario, dnsMode = 'ok', dry = false, env = {}, limitMs = 30000, args = ['--window=10'] }) {
  return new Promise(resolve => {
    const outFile = path.join(TMP, `out-${++seq}.txt`); fs.writeFileSync(outFile, '');
    const t0 = Date.now();
    const child = spawn(process.execPath, ['--import', pathToFileURL(STUB).href, COLLECTOR, 'ships', ...args, '--state=' + path.join(TMP, 'state-' + seq), ...(dry ? ['--dry', '--quiet'] : [])],
      { env: { PATH: process.env.PATH, HUB: 'https://hub.test', INGEST_KEY: 'ingest-test', AISSTREAM_KEY: KEYV, SHIPS_STUB: scenario, SHIPS_DNS: dnsMode, SHIPS_STUB_OUT: outFile, ...env } });
    let so = '', se = ''; child.stdout.on('data', d => so += d); child.stderr.on('data', d => se += d);
    let killed = false; const killer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, limitMs);
    child.on('close', code => { clearTimeout(killer); const lines = fs.readFileSync(outFile, 'utf8').split('\n').filter(Boolean);
      resolve({ code, killed, ms: Date.now() - t0, stdout: so, stderr: se, diag: se.split('\n').filter(l => /^ships: outcome=/.test(l)), sample: se.split('\n').filter(l => /^ships: window=/.test(l)),
        uploads: lines.filter(l => l.startsWith('UPLOAD ')).map(l => JSON.parse(l.slice(7))), lookups: lines.filter(l => l.startsWith('LOOKUP ')).length, network: lines.filter(l => l.startsWith('NETWORK ')) }); });
  });
}
const PHRASES = ['websocket error before connection', 'websocket error after connection', 'connection closed before confirmation', 'no subscription confirmation within the window', 'connect timeout (15 s)', 'collector error'];
const noLeak = (r, label) => { const up = JSON.stringify(r.uploads);
  ok(`${label}: nothing but the fixed phrase is uploaded (no error text, no close text, no key, no path)`, !/ECONN|hang up|policy|violation|boom|Users|line one|xxxx|rrrr/.test(up) && !up.includes(KEYV), up.slice(0, 300));
  ok(`${label}: the key's value is nowhere in the log or the output`, !r.stderr.includes(KEYV) && !r.stdout.includes(KEYV));
  ok(`${label}: no control character or line break inside the diagnostic line`, r.diag.every(l => !/[\u0000-\u001f\u007f]/.test(l)), r.diag);
  allNetwork.push(...r.network); };
/** A failed run: exit 3, one down report with exactly this phrase, exactly one diagnostic line. */
const failed = (r, label, phrase, outcome) => {
  ok(`${label}: the run ends by itself with exit 3 (down report uploaded)`, r.code === 3 && !r.killed, [r.code, r.killed, r.stderr.slice(-300)]);
  ok(`${label}: one down report, note exactly "${phrase}"`, r.uploads.length === 1 && r.uploads[0].source_status === 'down' && r.uploads[0].note === phrase && r.uploads[0].layer === 'ships' && r.uploads[0].collector_version === 'mac-0.3.5', r.uploads.map(u => [u.source_status, u.note, u.collector_version]));
  ok(`${label}: exactly one diagnostic line, outcome=${outcome}`, r.diag.length === 1 && r.diag[0].startsWith(`ships: outcome=${outcome} `), r.diag);
  noLeak(r, label); };

// ---------- A. unit: the two pure helpers
// argv[1] is THIS file, never the collector's path: the collector runs main() only when it is the command itself. A socket that throws stands in until case F installs its own, so an in-process slip can never reach the network.
globalThis.WebSocket = class { constructor() { allNetwork.push('NETWORK in-process WebSocket'); throw new Error('no network in this suite'); } };
const mod = await (async () => { process.argv = [process.argv[0], new URL(import.meta.url).pathname, 'ships', '--window=60', '--dry']; process.env.AISSTREAM_KEY = KEYV; process.env.INGEST_KEY = 'unused';
  globalThis.fetch = async u => { allNetwork.push('NETWORK in-process ' + u); throw new Error('no network in this suite'); };
  return import(pathToFileURL(COLLECTOR).href); })();
{ const { errorDetail, dnsCheck, DIAG, SHIPS_PUBLIC } = mod;
  ok('A the six fixed public phrases are the collector\'s whole set', JSON.stringify(Object.values(SHIPS_PUBLIC).sort()) === JSON.stringify(PHRASES.slice().sort()), Object.values(SHIPS_PUBLIC));
  ok('A an error event with nothing in it gives the words "no detail from the WebSocket client"', errorDetail({ type: 'error' }) === 'no detail from the WebSocket client' && errorDetail({}) === 'no detail from the WebSocket client' && errorDetail(null) === 'no detail from the WebSocket client', [errorDetail({ type: 'error' }), errorDetail({}), errorDetail(null)]);
  const d = errorDetail({ type: 'error', message: 'a\nb\u2028c', error: { name: 'TypeError', message: 'm'.repeat(500) + KEYV, code: 'ECODE', cause: { code: 'ECAUSE' } }, secret: 'UNNAMED-FIELD-MARKER', target: { url: 'wss://x', deep: { key: KEYV } } });
  ok('A named fields only: an unnamed field of the event never appears', !d.includes('UNNAMED-FIELD-MARKER') && !d.includes('wss://x') && !d.includes('deep'), d);
  ok('A each field is cut to 80 characters and the whole to 300; line breaks are removed; the key is struck out', d.length <= 300 && !/[\n\r\u2028]/.test(d) && !d.includes(KEYV) && d.includes('a b c') && d.includes('TypeError') && d.includes('ECODE') && d.includes('ECAUSE') && !d.includes('m'.repeat(81)), d);
  ok('A a field that is an object is not serialised', errorDetail({ type: 'error', message: { toString() { return 'OBJECT-MARKER'; } } }) === 'no detail from the WebSocket client');
  // dnsCheck with a replaced lookup: success, error, no answer, late answer
  const real = DIAG.lookup; let calls = 0;
  DIAG.lookup = (h, cb) => { calls++; setTimeout(() => cb(null, '192.0.2.1', 4), 15); }; let r = await dnsCheck();
  ok('A dns_check success: "resolved in N ms", one lookup of the stream host', /^resolved in \d+ ms$/.test(r) && calls === 1, r);
  DIAG.lookup = (h, cb) => setTimeout(() => cb(Object.assign(new Error('x'), { code: 'ENOTFOUND' })), 15); r = await dnsCheck();
  ok('A dns_check error: "error ENOTFOUND"', r === 'error ENOTFOUND', r);
  DIAG.lookup = () => { throw Object.assign(new Error('x'), { code: 'EBADNAME' }); }; r = await dnsCheck();
  ok('A dns_check when the lookup itself throws: recorded, never thrown on', r === 'error EBADNAME', r);
  let lateCb = null; DIAG.lookup = (h, cb) => { lateCb = cb; }; const t0 = Date.now(); r = await Promise.race([dnsCheck(), new Promise(f => setTimeout(() => f('STILL WAITING after 4 s'), 4000))]); const took = Date.now() - t0;   // raced, so a missing deadline is reported as a failure here and the suite goes on
  ok('A dns_check with no answer: "no answer in 2 s", after the 2 s deadline and not later than 2.5 s', r === 'no answer in 2 s' && took >= 1950 && took < 2500, [r, took]);
  ok('A …and the lookup is recorded as still outstanding', DIAG.outstanding === true);
  let threw = false; try { lateCb(null, '192.0.2.1', 4); } catch (_) { threw = true; }
  ok('A a late answer changes nothing and throws nothing', !threw && r === 'no answer in 2 s');
  DIAG.lookup = real; DIAG.outstanding = false; }

// ---------- B. every failed ending, as a real process
{ let r = await run({ scenario: 'error-before-open' });
  failed(r, 'B error before the socket opens', 'websocket error before connection', 'error');
  ok('B …opened=false confirmed=false messages=0, the named fields, the close code, and a DNS result', /opened=false confirmed=false messages=0 error=error \| connect ECONNREFUSED \| Error \| .*ECONNREFUSED.* close=1006\/- dns_check=resolved in \d+ ms$/.test(r.diag[0]) && r.lookups === 1, r.diag);
  ok('B …an unnamed field of the event is not logged, and the long multi-line message is cut', !r.diag[0].includes('UNNAMED-FIELD-MARKER') && !r.diag[0].includes('x'.repeat(81)) && r.diag[0].length < 520, r.diag[0].length);

  r = await run({ scenario: 'error-empty', dnsMode: 'error' });
  failed(r, 'B error event with no fields', 'websocket error before connection', 'error');
  ok('B …the line says "no detail from the WebSocket client" and records the DNS error without comment', / error=no detail from the WebSocket client close=\S+ dns_check=error ENOTFOUND$/.test(r.diag[0]), r.diag);

  r = await run({ scenario: 'error-after-open' });
  failed(r, 'B error after the socket opened, no messages', 'websocket error after connection', 'error');
  ok('B …opened=true confirmed=false messages=0', /opened=true confirmed=false messages=0 error=error \| socket hang up /.test(r.diag[0]), r.diag);

  r = await run({ scenario: 'error-after-messages' });
  failed(r, 'B error after messages had arrived', 'websocket error after connection', 'error');
  ok('B …opened=true confirmed=true messages=2', /opened=true confirmed=true messages=2 error=error \| read ECONNRESET \| ECONNRESET /.test(r.diag[0]), r.diag);

  r = await run({ scenario: 'close-before-confirmation' });
  failed(r, 'B far end closes before confirming, with NO error event', 'connection closed before confirmation', 'close-before-confirmation');
  ok('B …the close code and a cut, single-line reason are logged; no error= field is invented', / opened=true confirmed=false messages=0 close=1008\/policy violation r{1,69} dns_check=/.test(r.diag[0]) && !/ error=/.test(r.diag[0]), r.diag);

  const t0 = Date.now();
  const [nc, to] = await Promise.all([run({ scenario: 'no-confirmation' }), run({ scenario: 'never-opens', args: ['--window=20'] })]);
  failed(nc, 'B open, never confirmed, our own window ends it', 'no subscription confirmation within the window', 'no-confirmation');
  ok('B …it took the 10 s window, not longer than 13 s', nc.ms >= 9900 && nc.ms < 13000, nc.ms);
  failed(to, 'B the socket never opens', 'connect timeout (15 s)', 'connect-timeout');
  ok('B …ended at the 15 s limit plus the lookup, not later than 19 s; close details not waited for', to.ms >= 14900 && to.ms < 19000 && /opened=false confirmed=false messages=0 close=(unavailable|\d+\/\S+) dns_check=/.test(to.diag[0]), [to.ms, to.diag]);
  void t0; }

// ---------- C. the outer catch, and other throws from outside the socket code
{ let r = await run({ scenario: 'ctor-throws' });
  failed(r, 'C something thrown outside the socket handlers', 'collector error', 'collector-error');
  ok('C …the local line carries the cleaned text on one line, without the key', /^ships: outcome=collector-error error=Error \| boom from the socket constructor second line \/Users\/someone\/private \[key\]$/.test(r.diag[0]), r.diag);
  r = await run({ scenario: 'ok', env: { AISSTREAM_KEY: '' } });
  ok('C no key configured: uploaded as "collector error", reason in the local log only', r.code === 3 && r.uploads.length === 1 && r.uploads[0].note === 'collector error' && /outcome=collector-error error=Error \| AISSTREAM_KEY not set/.test(r.diag[0] || ''), [r.code, r.uploads.map(u => u.note), r.diag]);
  r = await run({ scenario: 'no-websocket', env: { NODE_OPTIONS: '--no-experimental-websocket' } });
  ok('C no WebSocket in this Node: uploaded as "collector error"', r.code === 3 && r.uploads.length === 1 && r.uploads[0].note === 'collector error', [r.code, r.uploads.map(u => u.note), r.stderr.slice(-200)]); allNetwork.push(...r.network); }

// ---------- D. the DNS deadline on a real process, and cleanup
{ let r = await run({ scenario: 'error-before-open', dnsMode: 'hang', limitMs: 12000 });
  ok('D lookup never answers and holds the process open: the run still ends by itself, exit 3', r.code === 3 && !r.killed, [r.code, r.killed, r.ms]);
  ok('D …within the bound: at least the 2 s deadline, under 4 s in all', r.ms >= 2000 && r.ms < 4000, r.ms);
  ok('D …the line says "no answer in 2 s" and the down report was uploaded', /dns_check=no answer in 2 s$/.test(r.diag[0] || '') && r.uploads.length === 1 && r.uploads[0].note === 'websocket error before connection', [r.diag, r.uploads.map(u => u.note)]);
  r = await run({ scenario: 'error-before-open', dnsMode: 'late', limitMs: 12000 });
  ok('D lookup answers after the deadline: recorded as no answer, run ends under 4 s', r.code === 3 && r.ms < 4000 && /dns_check=no answer in 2 s$/.test(r.diag[0] || ''), [r.code, r.ms, r.diag]);
  r = await run({ scenario: 'error-before-open', dnsMode: 'hang', dry: true, limitMs: 12000 });
  let parsed = null; try { parsed = JSON.parse(r.stdout); } catch (_) { }
  ok('D --dry with a lookup that never answers: output complete, process ends by itself under 4 s', r.code === 0 && !r.killed && r.ms < 4000 && parsed && parsed.source_status === 'down' && parsed.note === 'websocket error before connection', [r.code, r.killed, r.ms, r.stdout.slice(0, 120)]);
  ok('D --dry uploads nothing', r.uploads.length === 0);
  // cleanup: a --dry run has no explicit exit when the lookup answered, so it ends only if no timer or socket is left
  for (const sc of ['error-before-open', 'error-after-messages', 'close-before-confirmation']) { r = await run({ scenario: sc, dry: true, limitMs: 12000 });
    ok(`D cleanup after "${sc}": the process ends by itself in under 3 s (its 10 s and 20 s timers are gone, the socket is closed)`, r.code === 0 && !r.killed && r.ms < 3000, [r.code, r.killed, r.ms]); allNetwork.push(...r.network); }
}

// ---------- E. runs that are still samples: built as before, one extra line at most
{ let r = await run({ scenario: 'ok' });
  ok('E an ok run: exit 0, one ok sample uploaded', r.code === 0 && r.uploads.length === 1 && r.uploads[0].source_status === 'ok' && r.uploads[0].records.length > 10, [r.code, r.uploads.map(u => [u.source_status, (u.records || []).length]), r.stderr.slice(-300)]);
  ok('E an ok run logs nothing new: the one sample line it always wrote, no diagnostic line, no lookup', r.sample.length === 1 && r.diag.length === 0 && r.lookups === 0 && /status=ok/.test(r.sample[0]) && /close=null/.test(r.sample[0]), [r.sample, r.diag, r.lookups]);
  ok('E an ok sample\'s envelope has no note and the close field as before', r.uploads[0].note === undefined && r.uploads[0].close === null, [r.uploads[0].note, r.uploads[0].close]); allNetwork.push(...r.network);
  r = await run({ scenario: 'close-after-confirmation' });
  ok('E far end closes after confirming, mid-window: still a sample (degraded by flow), exit 0, records kept, no down report', r.code === 0 && r.uploads.length === 1 && r.uploads[0].source_status === 'degraded' && r.uploads[0].records.length === 2 && r.uploads[0].note === undefined, [r.code, r.uploads.map(u => [u.source_status, (u.records || []).length, u.note])]);
  ok('E …one extra line: outcome=close-after-confirmation with the close code; no DNS lookup (it is not a failed run)', r.diag.length === 1 && /^ships: outcome=close-after-confirmation after=0\.\ds opened=true confirmed=true messages=2 close=1001\/going away$/.test(r.diag[0]) && r.lookups === 0, [r.diag, r.lookups]);
  ok('E …the envelope\'s close field keeps its two fields only', JSON.stringify(Object.keys(r.uploads[0].close)) === '["code","reason"]', r.uploads[0].close); noLeak(r, 'E close after confirmation'); }

// ---------- F. the 17 Nov case in-process with a controllable clock: 381.5 s elapsed, 700 vessels, one 348 s silence
{ const REAL = Date.now; let off = 0; Date.now = () => REAL.call(Date) + off;
  const socks = []; class S { constructor() { this.closes = []; this.onopen = this.onmessage = this.onerror = this.onclose = null; socks.push(this); setTimeout(() => this.onopen && this.onopen({}), 5); } send() { } close(c, rs) { this.closes.push([c, rs]); if (this.onclose) this.onclose({ code: c ?? 1000, reason: rs ?? '' }); } deliver(o) { if (this.onmessage) this.onmessage({ data: JSON.stringify(o) }); } }
  globalThis.WebSocket = S;
  const pos = i => ({ MessageType: 'PositionReport', MetaData: { MMSI: 200000000 + i, ShipName: 'V' + i, time_utc: new Date(Date.now()).toISOString().replace('T', ' ').replace('Z', ' +0000 UTC') }, Message: { PositionReport: { Latitude: -60 + (i % 120), Longitude: -170 + (i % 340), Sog: 1 } } });
  const errs = []; const realErr = console.error; console.error = (...a) => errs.push(a.join(' '));
  const p = mod.FEEDS.ships(); await new Promise(r => setTimeout(r, 40)); const ws = socks[0];
  ws.deliver({ MessageType: 'SubscriptionConfirmation', Message: { CompressionEnabled: true } });
  for (let i = 0; i < 175; i++) ws.deliver(pos(i)); off += 6700; for (let i = 175; i < 350; i++) ws.deliver(pos(i)); off += 6700; for (let i = 350; i < 525; i++) ws.deliver(pos(i)); off += 6700; for (let i = 525; i < 700; i++) ws.deliver(pos(i));   // 700 vessels over 20.1 s, no gap over 10 s
  off = 381460;   // the host is away: total elapsed now 381.5 s
  ws.deliver(pos(9999));                                    // the first message after it returns: past the hard bound, rejected, run closed
  const f = await p; console.error = realErr; Date.now = REAL;
  const x = f.extra, line = errs.filter(l => /^ships: outcome=/.test(l));
  ok('F the 381.5 s / 700-vessel sample is built exactly as before: 700 records, overlong, degraded, about 20 s of flow', f.rows.length === 700 && x.overlong_sample === true && x.source_status_override === 'degraded' && Math.abs(x.elapsed_wall_s - 381.5) < 0.3 && Math.abs(x.messages_flowing_s - 20.1) < 0.4 && x.interruptions_override.length === 1, [f.rows.length, x.overlong_sample, x.source_status_override, x.elapsed_wall_s, x.messages_flowing_s, x.interruptions_override]);
  ok('F its diagnostic line: outcome=overlong, messages=700, and the silence\'s own start and end times', line.length === 1 && /^ships: outcome=overlong after=381\.\ds opened=true confirmed=true messages=700 first_interruption=\d{4}-\d\d-\d\dT[\d:.]+Z\.\.\d{4}-\d\d-\d\dT[\d:.]+Z \(36[01]s\) close=4000\/overlong on resumption$/.test(line[0]), line);
  ok('F the late message was rejected and the run closed by the guard, as before', !f.rows.some(r => r[0] === String(200009999)) && ws.closes.some(c => /overlong/.test(c[1])), ws.closes);
  ok('F after the run the socket\'s message, open and error handlers are dropped', ws.onmessage === null && ws.onopen === null && ws.onerror === null);
  ok('F a degraded sample makes no DNS lookup', mod.DIAG.outstanding === false); }

ok('no real network call and no unexpected fetch in the whole suite', allNetwork.length === 0, allNetwork);
console.log(`\nships-diagnostics${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { }
process.exit(fail ? 1 : 0);
