/* The Stage B calling script (phase1/earthview-stage-b-call.sh) against a local stand-in for the hub. Synthetic key, temporary
 * KEYS.md, temporary HOME. Nothing leaves this machine; the live hub is never contacted.
 * Run: node --no-warnings phase1/earthview-stage-b-call.test.mjs
 * BREAK=<name> weakens a copy of the script; each must fail:
 *   check-then-create claim-released no-q no-env-clear retry-allowed redirects-followed key-on-command-line claim-after-wait
 *   late-still-calls non-200-ok */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), BREAK = process.env.BREAK || '';
const BREAKS = {
  'check-then-create': ['if ! mkdir "$CLAIM" 2>/dev/null; then unset KEY', 'if [ -e "$BODY" ] || [ -e "$META" ]; then unset KEY'],
  'claim-released': ['if [ "$RC" -ne 0 ] || [ ! -s "$BODY" ]; then echo "No usable answer', 'if [ "$RC" -ne 0 ] || [ ! -s "$BODY" ]; then rm -rf "$CLAIM" "$META"; echo "No usable answer'],
  'no-q': ['curl -q --config -', 'curl --config -'],
  'no-env-clear': ['env -i PATH="$PATH" HOME="$HOME" curl -q', 'curl -q'],
  'retry-allowed': ['--max-redirs 0 --retry 0 --noproxy', '--max-redirs 0 --retry 2 --retry-all-errors --retry-delay 0 --noproxy'],
  'redirects-followed': ['--max-redirs 0 --retry 0', '--location --location-trusted --max-redirs 5 --retry 0'],
  'key-on-command-line': ["HTTP=$(printf 'header = \"Authorization: Bearer %s\"\\n' \"$KEY\" | env -i PATH=\"$PATH\" HOME=\"$HOME\" curl -q --config - --proto", "HTTP=$(env -i PATH=\"$PATH\" HOME=\"$HOME\" curl -q --header \"Authorization: Bearer $KEY\" --proto"],
  'claim-after-wait': [['if ! mkdir "$CLAIM" 2>/dev/null; then unset KEY', 'if false; then unset KEY'], ['T0=$(utc); CALLED=yes', 'mkdir "$CLAIM" 2>/dev/null || exit 4; T0=$(utc); CALLED=yes'], ['{ echo "claimed_at: $(utc)"; echo "pid: $$"; echo "window: $START + ${WIN}s"; } > "$CLAIM/claim.txt"', ':']],
  'late-still-calls': [['if [ "$NOW" -ge "$E" ]; then unset KEY; echo "result: NOT RUN (started at', 'if false; then unset KEY; echo "result: NOT RUN (started at'], ['if [ "$NOW" -ge "$E" ]; then unset KEY; echo "result: NOT RUN (woke at', 'if false; then unset KEY; echo "result: NOT RUN (woke at']],
  'non-200-ok': ['if [ "$HTTP" != 200 ]; then', 'if false; then'],
};
let src = fs.readFileSync(path.join(HERE, 'earthview-stage-b-call.sh'), 'utf8');
if (BREAK) { if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
  for (const b of Array.isArray(BREAKS[BREAK][0]) ? BREAKS[BREAK] : [BREAKS[BREAK]]) { if (src.split(b[0]).length !== 2) { console.log('FAIL  break did not apply (each part must match exactly once): ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]); } }
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'evb-call-')), SCRIPT = path.join(TMP, 'call.sh'); fs.writeFileSync(SCRIPT, src, { mode: 0o755 });
const KEY = 'synthetic-key-9d41c07e', KEYS = path.join(TMP, 'KEYS.md'); fs.writeFileSync(KEYS, `| name | value |\n|---|---|\n| INGEST_KEY | other |\n| ADMIN_KEY | ${KEY} |\n`);
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 600) : ''}`); } };
// ---------- the stand-in hub: records every request it receives
const S = { reqs: [], mode: 'ok', delay: 0, hold: [] };
const server = http.createServer((req, res) => { const n = S.reqs.length; S.reqs.push({ method: req.method, url: req.url, auth: req.headers.authorization || null, headers: req.headers });
  const answer = () => { if (S.mode === 'hang') { S.hold.push(res); return; }
    if (S.mode === '503') { res.writeHead(503, { 'content-type': 'application/json' }); return res.end('{"error":"busy upstream"}'); }
    if (S.mode === '503-then-200' && n === 0) { res.writeHead(503, { 'content-type': 'application/json', 'retry-after': '0' }); return res.end('{"error":"try again"}'); }
    if (S.mode === 'redirect' && req.url === '/admin/probe/earthview') { res.writeHead(307, { location: '/elsewhere' }); return res.end(); }
    if (S.mode === 'reset') { return req.socket.destroy(); }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify({ layer: 'earthview', probe: 'stage-b', outcome: 'validated', attempt: 'aaaaaaaaaaaa', n })); };
  if (S.delay) setTimeout(answer, S.delay); else answer(); });
await new Promise(r => server.listen(0, '127.0.0.1', r)); const HUB = `http://127.0.0.1:${server.address().port}`;
const reset = (mode = 'ok', delay = 0) => { S.reqs.length = 0; S.mode = mode; S.delay = delay; for (const r of S.hold.splice(0)) try { r.destroy(); } catch (_) { } };
let nOut = 0; const newOut = () => path.join(TMP, 'out-' + (nOut++));
const nowIso = (d = 0) => new Date(Date.now() + d).toISOString().replace(/\.\d+Z$/, 'Z');
/** start the script; resolves { code, signal, text } when it exits. opts: n, start, win, out, home, env, maxTime */
function launch(o = {}) { const out = o.out || newOut(), env = { PATH: process.env.PATH, HOME: o.home || TMP, OUT: out, KEYS_FILE: o.keys || KEYS, STAGE_B_TEST_HUB: HUB, STAGE_B_TEST_MAX_TIME: String(o.maxTime || 20), ...(o.env || {}) };
  const child = spawn('bash', [SCRIPT, String('n' in o ? o.n : 1), o.start || nowIso(-3000), String(o.win || 60)], { env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] }); let text = '';
  child.stdout.on('data', d => { text += d; }); child.stderr.on('data', d => { text += d; });
  const done = new Promise(res => child.on('close', (code, signal) => res({ code, signal, text, out })));
  return { child, done, out }; }
const files = out => fs.existsSync(out) ? fs.readdirSync(out).sort() : [];
const read = (out, f) => { try { return fs.readFileSync(path.join(out, f), 'utf8'); } catch (_) { return ''; } };
const everything = (r) => r.text + files(r.out).map(f => fs.statSync(path.join(r.out, f)).isDirectory() ? fs.readdirSync(path.join(r.out, f)).map(g => read(r.out, path.join(f, g))).join('') : read(r.out, f)).join('\n');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ===== A. One clean call
{ reset(); const r = await launch().done;
  ok('A1 one POST to /admin/probe/earthview, exit 0', r.code === 0 && S.reqs.length === 1 && S.reqs[0].method === 'POST' && S.reqs[0].url === '/admin/probe/earthview', { code: r.code, reqs: S.reqs.map(q => [q.method, q.url]), text: r.text });
  ok('A2 the key travels in the Authorization header as "Bearer <key>", and in no other header or the URL', S.reqs[0].auth === 'Bearer ' + KEY && !S.reqs[0].url.includes(KEY) && Object.entries(S.reqs[0].headers).filter(([k, v]) => String(v).includes(KEY)).length === 1, S.reqs[0].headers && Object.keys(S.reqs[0].headers));
  ok('A3 the answer is saved as received; the claim and the meta file are kept', files(r.out).join() === 'observation-1.claim,observation-1.json,observation-1.meta.txt' && JSON.parse(read(r.out, 'observation-1.json')).outcome === 'validated' && /http_status: 200/.test(read(r.out, 'observation-1.meta.txt')) && /curl_exit: 0/.test(read(r.out, 'observation-1.meta.txt')), [files(r.out), read(r.out, 'observation-1.meta.txt')]);
  ok('A4 the key is in nothing the script printed and in no file it wrote', !everything(r).includes(KEY), everything(r).slice(0, 300));
  const again = await launch({ out: r.out }).done;
  ok('A5 started again for the same observation: refused (exit 4), no second POST', again.code === 4 && S.reqs.length === 1 && /already claimed/.test(again.text), { code: again.code, reqs: S.reqs.length, text: again.text });
  const other = await launch({ out: r.out, n: 2 }).done;
  ok('A6 another observation number is its own claim: runs once', other.code === 0 && S.reqs.length === 2 && files(r.out).includes('observation-2.json'), { code: other.code, files: files(r.out) }); }

// ===== B. GPT's reproduction 1: two launches at the same moment
for (const [label, delay] of [['B1 two launches at the same moment, slow hub', 1500], ['B2 two launches at the same moment, fast hub', 0]]) { reset('ok', delay); const out = newOut(), a = launch({ out }), b = launch({ out }), [ra, rb] = await Promise.all([a.done, b.done]);
  ok(label + ': exactly ONE POST; one exits 0, the other 4', S.reqs.length === 1 && [ra.code, rb.code].sort().join() === '0,4', { reqs: S.reqs.length, codes: [ra.code, rb.code] }); }
{ reset('ok', 300); const out = newOut(), all = await Promise.all(Array.from({ length: 8 }, () => launch({ out }).done));
  ok('B3 eight launches at the same moment: exactly ONE POST; one exit 0, seven exit 4', S.reqs.length === 1 && all.filter(r => r.code === 0).length === 1 && all.filter(r => r.code === 4).length === 7, { reqs: S.reqs.length, codes: all.map(r => r.code) }); }
{ reset(); const out = newOut(), a = launch({ out, start: nowIso(4000) }); await sleep(800); const b = await launch({ out, start: nowIso(-1000) }).done;
  ok('B4 a second launch while the first is still WAITING for its window: refused, no POST yet', b.code === 4 && S.reqs.length === 0, { code: b.code, reqs: S.reqs.length });
  const ra = await a.done; ok('B5 and the first then makes its one call when the window opens', ra.code === 0 && S.reqs.length === 1, { code: ra.code, reqs: S.reqs.length }); }

// ===== C. GPT's reproduction 2: inherited curl configuration cannot change the contract
{ const home = path.join(TMP, 'home-hostile'); fs.mkdirSync(home); const trace = path.join(home, 'trace.txt');
  const rc = `retry = 3\nretry-all-errors\nretry-delay = 0\nlocation\nlocation-trusted\nverbose\ntrace-ascii = "${trace}"\nheader = "X-From-Curlrc: 1"\nfail-with-body\n`;
  fs.writeFileSync(path.join(home, '.curlrc'), rc); fs.writeFileSync(path.join(home, '_curlrc'), rc);
  const curlHome = path.join(TMP, 'curl-home'); fs.mkdirSync(curlHome); fs.writeFileSync(path.join(curlHome, '.curlrc'), rc);
  const hostile = { home, env: { CURL_HOME: curlHome, http_proxy: 'http://127.0.0.1:9', HTTP_PROXY: 'http://127.0.0.1:9', all_proxy: 'http://127.0.0.1:9', ALL_PROXY: 'http://127.0.0.1:9' } };
  reset('503-then-200'); let r = await launch(hostile).done;
  ok('C1 ~/.curlrc and CURL_HOME say retry; hub answers 503 then would answer 200: ONE POST, the 503 saved, exit 8 (not a completed observation)', S.reqs.length === 1 && r.code === 8 && /http_status: 503/.test(read(r.out, 'observation-1.meta.txt')) && /try again/.test(read(r.out, 'observation-1.json')), { reqs: S.reqs.length, code: r.code, meta: read(r.out, 'observation-1.meta.txt') });
  ok('C2 the curlrc\'s extra header was not sent, its trace file was not written, nothing verbose was captured, the key is nowhere', !S.reqs[0].headers['x-from-curlrc'] && !fs.existsSync(trace) && !everything(r).includes(KEY) && !/^[<>*] /m.test(everything(r)), { hdr: S.reqs[0].headers['x-from-curlrc'], trace: fs.existsSync(trace) });
  const again = await launch({ ...hostile, out: r.out }).done; ok('C3 after that 503 the observation stays claimed: a relaunch makes no call', again.code === 4 && S.reqs.length === 1, { code: again.code, reqs: S.reqs.length });
  reset('redirect'); r = await launch(hostile).done;
  ok('C4 the hub answers with a redirect and the curlrc says follow: ONE request, the redirect target is never asked, exit 7 (a redirect carries no answer)', S.reqs.length === 1 && S.reqs[0].url === '/admin/probe/earthview' && r.code === 7 && /http_status: 307/.test(read(r.out, 'observation-1.meta.txt')), { reqs: S.reqs.map(q => q.url), code: r.code });
  reset('reset'); r = await launch(hostile).done;
  ok('C5 the connection is cut and the curlrc says retry: ONE request, exit 7 (no usable answer), claim kept', S.reqs.length === 1 && r.code === 7 && files(r.out).includes('observation-1.claim') && /curl_exit: [1-9]/.test(read(r.out, 'observation-1.meta.txt')), { reqs: S.reqs.length, code: r.code, meta: read(r.out, 'observation-1.meta.txt') });
  reset(); r = await launch(hostile).done;
  ok('C6 with all of that inherited, a normal call is still one POST, straight to the hub (proxy variables ignored), exit 0', S.reqs.length === 1 && r.code === 0 && S.reqs[0].auth === 'Bearer ' + KEY, { reqs: S.reqs.length, code: r.code, text: r.text }); }

// ===== C7. What curl is actually started with: a recording stand-in for curl, first on PATH, that then runs the real one
{ const shim = path.join(TMP, 'shim'); fs.mkdirSync(shim); const rec = path.join(TMP, 'curl-started.txt'), real = (process.env.PATH.split(':').map(d => path.join(d, 'curl')).find(f => fs.existsSync(f)));
  fs.writeFileSync(path.join(shim, 'curl'), `#!/bin/bash\n{ echo "ARGS"; printf '%s\\n' "$@"; echo "ENV"; env; } > "${rec}"\nexec "${real}" "$@"\n`, { mode: 0o755 });
  reset(); const r = await launch({ env: { PATH: shim + ':' + process.env.PATH, CURL_HOME: '/nonexistent', https_proxy: 'http://127.0.0.1:9', SSLKEYLOGFILE: path.join(TMP, 'tlskeys.txt'), CURL_CA_BUNDLE: '/nonexistent/ca.pem' } }).done;
  const t = fs.existsSync(rec) ? fs.readFileSync(rec, 'utf8') : '', args = t.split('ENV')[0].split('\n').slice(1).filter(Boolean), envNames = (t.split('ENV\n')[1] || '').split('\n').filter(Boolean).map(l => l.split('=')[0]).filter(n => n !== '_' && n !== 'SHLVL' && n !== 'PWD' && n !== 'OLDPWD').sort();
  ok('C7 curl\'s first argument is -q, and its arguments contain no key', r.code === 0 && args[0] === '-q' && !args.join(' ').includes(KEY) && args.includes('--retry') && args[args.indexOf('--retry') + 1] === '0' && args[args.indexOf('--max-redirs') + 1] === '0', args);
  ok('C8 curl is started with an emptied environment: only PATH and HOME (no CURL_HOME, proxy, key-log or CA variables), and no key', envNames.join() === 'HOME,PATH' && !t.includes(KEY), envNames); }

// ===== D. Failures, timeouts and interruptions keep the claim
{ reset('hang'); const r = await launch({ maxTime: 2 }).done;
  ok('D1 the hub never answers: one POST, exit 7 after the wait, INCOMPLETE recorded, claim kept', S.reqs.length === 1 && r.code === 7 && /curl_exit: 28/.test(read(r.out, 'observation-1.meta.txt')) && files(r.out).includes('observation-1.claim'), { reqs: S.reqs.length, code: r.code, meta: read(r.out, 'observation-1.meta.txt') });
  reset(); const again = await launch({ out: r.out }).done; ok('D2 after a timeout a relaunch makes no call', again.code === 4 && S.reqs.length === 0, { code: again.code, reqs: S.reqs.length }); }
for (const sig of ['SIGTERM', 'SIGINT', 'SIGKILL']) { reset('hang'); const a = launch({ maxTime: 20 }); await sleep(900); try { process.kill(-a.child.pid, sig); } catch (_) { } const r = await a.done;
  ok(`D3 ${sig} to the script and curl during the call: it stops; one POST was made; the claim is kept`, S.reqs.length === 1 && r.code !== 0 && files(r.out).includes('observation-1.claim'), { reqs: S.reqs.length, code: r.code, signal: r.signal, files: files(r.out) });
  if (sig !== 'SIGKILL') ok(`D4 ${sig} during the call: the meta file says so (interrupted or no usable answer), and never claims a result`, /INTERRUPTED|curl_exit: [1-9]/.test(read(r.out, 'observation-1.meta.txt')) && !files(r.out).includes('observation-1.json'), read(r.out, 'observation-1.meta.txt'));
  reset(); const again = await launch({ out: r.out }).done; ok(`D5 after ${sig} during the call a relaunch makes no call`, again.code === 4 && S.reqs.length === 0, { code: again.code, reqs: S.reqs.length }); }
for (const sig of ['SIGTERM', 'SIGKILL']) { reset(); const a = launch({ start: nowIso(30000) }); await sleep(700); try { process.kill(-a.child.pid, sig); } catch (_) { } const r = await a.done;
  ok(`D6 ${sig} while WAITING for the window: no POST; the claim is kept`, S.reqs.length === 0 && r.code !== 0 && files(r.out).includes('observation-1.claim'), { reqs: S.reqs.length, code: r.code, files: files(r.out) });
  if (sig === 'SIGTERM') ok('D7 SIGTERM while waiting: recorded as interrupted before any call, NOT RUN', r.code === 9 && /INTERRUPTED/.test(read(r.out, 'observation-1.meta.txt')) && /before any call: NOT RUN/.test(read(r.out, 'observation-1.meta.txt')), [r.code, read(r.out, 'observation-1.meta.txt')]);
  const again = await launch({ out: r.out }).done; ok(`D8 after ${sig} while waiting a relaunch makes no call (the observation is not moved)`, again.code === 4 && S.reqs.length === 0, { code: again.code, reqs: S.reqs.length }); }

// ===== E. Windows, keys, arguments
{ reset(); const r = await launch({ start: nowIso(-3600000) }).done;
  ok('E1 started an hour after the window: NOT RUN, no POST, exit 5, claim kept', r.code === 5 && S.reqs.length === 0 && /NOT RUN/.test(read(r.out, 'observation-1.meta.txt')) && files(r.out).includes('observation-1.claim'), { code: r.code, files: files(r.out) });
  const again = await launch({ out: r.out }).done; ok('E2 and it cannot then be run in a later window: refused', again.code === 4 && S.reqs.length === 0, { code: again.code, reqs: S.reqs.length }); }
{ reset(); const keys = path.join(TMP, 'KEYS-none.md'); fs.writeFileSync(keys, '| name | value |\n|---|---|\n| INGEST_KEY | other |\n'); const r = await launch({ keys }).done;
  ok('E3 no ADMIN_KEY in KEYS.md: exit 6, no POST, and NOTHING is claimed (a set-up mistake does not use up the observation)', r.code === 6 && S.reqs.length === 0 && files(r.out).length === 0, { code: r.code, files: files(r.out) });
  const r2 = await launch({ out: r.out }).done; ok('E4 with the key in place the same observation then runs once', r2.code === 0 && S.reqs.length === 1, { code: r2.code, reqs: S.reqs.length }); }
for (const [name, o] of [['E5 observation number 4', { n: 4 }], ['E6 observation number 0', { n: 0 }], ['E7 a window start without Z', { start: '2026-11-25T07:21:30' }], ['E8 a window start that is no date', { start: '2026-13-45T99:99:99Z' }], ['E9 a window length that is not a number', { win: '60;id' }]]) { reset(); const r = await launch(o).done;
  ok(name + ': usage error (exit 2), no POST, nothing claimed', r.code === 2 && S.reqs.length === 0 && files(r.out).length === 0, { code: r.code, files: files(r.out), text: r.text }); }
{ reset(); const r = await launch({ env: { STAGE_B_TEST_HUB: 'http://example.invalid:80' } }).done;
  ok('E10 a plain-http hub that is not this machine is refused before anything else', r.code === 2 && S.reqs.length === 0 && files(r.out).length === 0, { code: r.code, text: r.text }); }

// ===== F. What a process listing shows while the call is in flight
{ reset('hang'); const a = launch({ maxTime: 20 }); await sleep(900); let ps = ''; try { ps = (await new Promise(res => { let t = ''; const c = spawn('ps', ['-eo', 'args'], { stdio: ['ignore', 'pipe', 'ignore'] }); c.stdout.on('data', d => { t += d; }); c.on('close', () => res(t)); })); } catch (_) { }
  ok('F1 while curl is waiting, no process command line on this machine contains the key', ps.length > 100 && /curl -q --config -/.test(ps) && !ps.includes(KEY), ps.split('\n').filter(l => /curl/.test(l)).slice(0, 3));
  try { process.kill(-a.child.pid, 'SIGKILL'); } catch (_) { } await a.done; }

// ===== G. Static
{ const real = fs.readFileSync(path.join(HERE, 'earthview-stage-b-call.sh'), 'utf8'), curls = real.split('\n').filter(l => /\bcurl\s+[-"$]/.test(l) && !/^\s*#/.test(l));
  ok('G1 curl is run in exactly one place, and there -q is its first argument', curls.length === 1 && /\bcurl -q /.test(curls[0]), curls);
  ok('G2 the script never removes a claim', !/rm[^\n]*CLAIM|rmdir/.test(real), (real.match(/rm[^\n]*/g) || []));
  ok('G3 the real hub address is fixed in the script; another address is taken only from the test variable', /^HUB='https:\/\/mother-earth\.chadoberholzer\.workers\.dev'; MAXTIME=180$/m.test(real) && !/\$\{HUB:-/.test(real), null); }
reset(); server.close(); fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${fail ? 'FAILED' : 'PASSED'}: ${pass} passed, ${fail} failed${BREAK ? '  (BREAK=' + BREAK + ')' : ''}`); process.exit(fail ? 1 : 0);
