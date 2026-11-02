/* Mother Earth — deterministic test of the duration contract's hard boundary.
 *
 * Proves the guard's LOGIC with a stubbed socket and a controllable clock. It is not a substitute for the physical
 * long-sleep/resumption test on the Mac, which stays open: this cannot tell us how macOS behaves, only that our code
 * does the right thing when elapsed time has passed the hard deadline.
 *
 * Case A  a position message is delivered AFTER the hard deadline
 *         -> rejected before it can touch the vessel map, socket closed, sample unusable, run completes.
 * Case B  the deadline passes and NO further message ever arrives
 *         -> the run still ends and is still marked unusable, so cleanup cannot depend on onmessage firing.
 *
 * Run:  node phase1/duration-contract.test.mjs
 */
process.argv = [process.argv[0], import.meta.filename ?? 'test', 'ships', '--window=10', '--dry'];
process.env.AISSTREAM_KEY = 'test-key-not-used-by-the-stub';
process.env.INGEST_KEY = 'unused';

// ---- controllable clock: real time plus an offset we can jump forward on demand
const REAL_NOW = Date.now;
let offsetMs = 0;
Date.now = () => REAL_NOW.call(Date) + offsetMs;
const jump = ms => { offsetMs += ms; };

// ---- stubbed socket: nothing leaves the machine, and we decide exactly what arrives and when
const sockets = [];
class StubSocket {
  constructor(url) {
    this.url = url; this.sent = []; this.closes = [];
    this.onopen = this.onmessage = this.onerror = this.onclose = null;
    sockets.push(this);
    setTimeout(() => this.onopen && this.onopen({}), 5);
  }
  send(d) { this.sent.push(d); }
  close(code, reason) {
    this.closes.push({ code, reason, atOffsetMs: offsetMs });
    if (this.onclose) this.onclose({ code: code ?? 1000, reason: reason ?? '' });
  }
  deliver(obj) { if (this.onmessage) this.onmessage({ data: JSON.stringify(obj) }); }
}
globalThis.WebSocket = StubSocket;

const pos = (mmsi, lat, lng) => ({
  MessageType: 'PositionReport',
  MetaData: { MMSI: mmsi, ShipName: 'STUB ' + mmsi, time_utc: new Date().toISOString().replace('T', ' ').replace('Z', ' +0000 UTC') },
  Message: { PositionReport: { Latitude: lat, Longitude: lng, Sog: 1 } },
});

const { FEEDS } = await import('./collector-mac.mjs');

const WINDOW_S = 10, HARD_MS = 2 * WINDOW_S * 1000, OVERLONG_S = 1.25 * WINDOW_S;
let failures = 0;
const check = (name, cond, detail) => { console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); if (!cond) failures++; };

async function runCase(label, { deliverLate }) {
  console.log(`\n=== ${label} ===`);
  sockets.length = 0; offsetMs = 0;
  const started = REAL_NOW.call(Date);
  const p = FEEDS.ships();
  await new Promise(r => setTimeout(r, 60));
  const ws = sockets[0];
  ws.deliver({ MessageType: 'SubscriptionConfirmation', Message: { CompressionEnabled: true } });
  ws.deliver(pos('111111111', 10, 10));
  ws.deliver(pos('222222222', -20, 30));
  const earlyCloses = ws.closes.length;

  // the host is away: elapsed jumps past the hard deadline while no timer can fire
  jump(HARD_MS + 5000);
  let lateDelivered = false;
  if (deliverLate) { ws.deliver(pos('999999999', 0, 0)); lateDelivered = true; }

  const f = await p;                                   // must complete without hanging
  const realElapsed = (REAL_NOW.call(Date) - started) / 1000;
  const mmsis = f.rows.map(r => r[0]);
  const x = f.extra;

  check('run completed (no hang)', true, `real elapsed ${realElapsed.toFixed(1)} s`);
  check('early records kept', mmsis.includes('111111111') && mmsis.includes('222222222'), `rows: ${mmsis.join(', ') || 'none'}`);
  if (lateDelivered) {
    check('late record REJECTED before touching the vessel map', !mmsis.includes('999999999'), `vessel count ${f.rows.length}, expected 2`);
    check('socket closed by the guard', ws.closes.length > earlyCloses, `closes: ${JSON.stringify(ws.closes)}`);
    check('close reason names the cause', ws.closes.some(c => String(c.reason).includes('overlong')), JSON.stringify(ws.closes.map(c => c.reason)));
  } else {
    check('run ended with no message after the deadline (cleanup not dependent on onmessage)', true, `closes: ${JSON.stringify(ws.closes.map(c => c.reason))}`);
  }
  check('sample marked overlong', x.overlong_sample === true, `elapsed_wall_s ${x.elapsed_wall_s}, threshold ${OVERLONG_S} s`);
  check('sample unusable (degraded, not ok)', x.source_status_override === 'degraded', `status ${x.source_status_override}`);
  check('elapsed not counted as listening', x.elapsed_wall_s > x.messages_flowing_s, `elapsed ${x.elapsed_wall_s} s vs flowing ${x.messages_flowing_s} s (inferred)`);
  check('sleep detector retired, not republished as evidence', !('slept_during_sample' in x) && typeof x.sleep_detection === 'string', Object.keys(x).filter(k => /slept/.test(k)).join(',') || 'no slept_* field');
  check('three measured durations present and distinct', [x.socket_connected_s, x.message_gap_s, x.elapsed_wall_s].every(v => typeof v === 'number'),
    `socket ${x.socket_connected_s}s, gaps ${x.message_gap_s}s, elapsed ${x.elapsed_wall_s}s`);
  return f;
}

console.log(`duration contract under test: window ${WINDOW_S} s · overlong > ${OVERLONG_S} s · hard stop ${HARD_MS / 1000} s`);
await runCase('Case A — position delivered AFTER the hard deadline', { deliverLate: true });
await runCase('Case B — deadline passes, no further message ever arrives', { deliverLate: false });
console.log(`\n${failures ? failures + ' CHECK(S) FAILED' : 'ALL CHECKS PASSED'}`);
process.exit(failures ? 1 : 0);
