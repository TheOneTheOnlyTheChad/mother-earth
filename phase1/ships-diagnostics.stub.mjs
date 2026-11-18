/* Preload for phase1/ships-diagnostics.test.mjs (node --import). Replaces the WebSocket, dns.lookup and fetch BEFORE the real
 * collector file runs as a command, so a child process can be driven through one ending with nothing leaving the machine.
 * Scenario: SHIPS_STUB=<socket scenario>, SHIPS_DNS=<ok|error|hang|late>. Uploads are appended to the file SHIPS_STUB_OUT.
 * Any fetch that is not the test hub's ships ingest, and any real lookup, writes a NETWORK line there, which fails the suite. */
import dns from 'node:dns';
import fs from 'node:fs';
const S = process.env.SHIPS_STUB || 'ok', D = process.env.SHIPS_DNS || 'ok', OUT = process.env.SHIPS_STUB_OUT;
const out = line => { if (OUT) fs.appendFileSync(OUT, line + '\n'); };
const KEYV = process.env.AISSTREAM_KEY || '';
const pos = i => ({ MessageType: 'PositionReport', MetaData: { MMSI: 100000000 + i, ShipName: 'STUB ' + i, time_utc: new Date().toISOString().replace('T', ' ').replace('Z', ' +0000 UTC') }, Message: { PositionReport: { Latitude: 10 + (i % 50) * 0.1, Longitude: 20 + (i % 70) * 0.1, Sog: 1 } } });
const LONG = 'line one\nline two\ttabbed ' + 'x'.repeat(400) + ' key=' + KEYV;
class StubSocket {
  constructor(url) {
    if (S === 'ctor-throws') throw new Error('boom from the socket constructor\nsecond line /Users/someone/private ' + KEYV);
    this.url = url; this.sent = []; this.onopen = this.onmessage = this.onerror = this.onclose = null; this.closed = false;
    const later = (ms, f) => setTimeout(() => { if (!this.closed || f.force) f(); }, ms);
    const open = () => this.onopen && this.onopen({});
    const confirm = () => this.onmessage && this.onmessage({ data: JSON.stringify({ MessageType: 'SubscriptionConfirmation', Message: { CompressionEnabled: true } }) });
    const msg = i => this.onmessage && this.onmessage({ data: JSON.stringify(pos(i)) });
    const remoteClose = (code, reason) => { this.closed = true; this.onclose && this.onclose({ code, reason }); };
    if (S === 'error-before-open') later(5, () => { this.onerror && this.onerror({ type: 'error', message: 'connect ECONNREFUSED', error: { name: 'Error', message: LONG, code: 'ECONNREFUSED', cause: { code: 'ECONNREFUSED' } }, extra: 'UNNAMED-FIELD-MARKER' }); });
    else if (S === 'error-empty') later(5, () => { this.onerror && this.onerror({ type: 'error' }); });
    else if (S === 'error-after-open') { later(5, open); later(30, () => this.onerror && this.onerror({ type: 'error', message: 'socket hang up' })); }
    else if (S === 'error-after-messages') { later(5, open); later(15, confirm); later(20, () => msg(1)); later(25, () => msg(2)); later(40, () => this.onerror && this.onerror({ type: 'error', error: { message: 'read ECONNRESET', code: 'ECONNRESET' } })); }
    else if (S === 'close-before-confirmation') { later(5, open); later(30, () => remoteClose(1008, 'policy\nviolation ' + 'r'.repeat(200))); }
    else if (S === 'close-after-confirmation') { later(5, open); later(15, confirm); later(20, () => msg(1)); later(25, () => msg(2)); later(300, () => remoteClose(1001, 'going away')); }
    else if (S === 'no-confirmation') { later(5, open); }
    else if (S === 'never-opens') { /* nothing: the 15 s connect limit ends it */ }
    else if (S === 'ok') { later(5, open); later(15, confirm); let i = 0; this._iv = setInterval(() => { if (this.closed) return clearInterval(this._iv); msg(++i); }, 400); }
    StubSocket.last = this;
  }
  send(d) { this.sent.push(d); }
  close(code, reason) { if (this.closed) return; this.closed = true; if (this._iv) clearInterval(this._iv); setTimeout(() => this.onclose && this.onclose({ code: code ?? 1006, reason: reason ?? '' }), 1); }
}
if (S !== 'no-websocket') globalThis.WebSocket = StubSocket;
dns.lookup = (host, cb) => {
  out('LOOKUP ' + host);
  if (D === 'ok') setTimeout(() => cb(null, '192.0.2.1', 4), 20);
  else if (D === 'error') setTimeout(() => cb(Object.assign(new Error('getaddrinfo ENOTFOUND ' + host), { code: 'ENOTFOUND' })), 20);
  else if (D === 'late') setTimeout(() => cb(null, '192.0.2.1', 4), 2600);
  else if (D === 'hang') setInterval(() => { }, 1e6);   // never answers, and holds the process open the way a stuck system resolver would
};
globalThis.fetch = async (url, init) => {
  if (String(url) !== 'https://hub.test/ingest/ships') { out('NETWORK ' + url); throw new Error('unexpected network call in a test: ' + url); }
  out('UPLOAD ' + init.body);
  return { ok: true, status: 200, text: async () => '{"ok":true,"layer":"ships"}' };
};
