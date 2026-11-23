/* The Earth from Space admin caller (phase1/earthview-admin.sh) against a local stand-in for the hub. Synthetic key, temporary
 * KEYS.md, temporary HOME. Nothing leaves this machine; the live hub is never contacted.
 * Run: node --no-warnings phase1/earthview-admin.test.mjs
 * BREAK=<name> weakens a copy of the script; each must fail:
 *   check-then-create claim-released no-q no-env-clear retry-allowed redirects-followed key-on-command-line key-in-url
 *   non-200-ok run-any-step step-not-matched read-only-claims plan-unchecked run2-any-time run2-after-published
 *   run2-after-lost overwrite-read mutate-by-get note-request-wrong note-field-dropped stderr-noise
 *   note-case-in-substitution (the defect found on 22 Nov 2026 in Stage C step C1: a case inside $( ), which bash 3.2 cannot
 *   parse. It fails ONLY under a bash that cannot parse it, so it is the native macOS negative control: run it there.
 *   Under bash 4 or later the old line works and this break reports 0 failed; that is expected and proves nothing.) */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), BREAK = process.env.BREAK || '';
const BREAKS = {
  'check-then-create': ['  if ! mkdir "$CLAIM" 2>/dev/null; then unset KEY', '  if [ -e "$BASE.json" ] || [ -e "$BASE.meta.txt" ]; then unset KEY'],
  'claim-released': ['if [ "$RC" -ne 0 ] || [ ! -s "$BODY" ]; then\n', 'if [ "$RC" -ne 0 ] || [ ! -s "$BODY" ]; then [ "$MUT" = yes ] && rm -rf "$CLAIM" "$META"\n'],
  'no-q': ['curl -q --config -', 'curl --config -'],
  'no-env-clear': ['env -i PATH="$PATH" HOME="$HOME" curl -q', 'curl -q'],
  'retry-allowed': ['--max-redirs 0 --retry 0 --noproxy', '--max-redirs 0 --retry 2 --retry-all-errors --retry-delay 0 --noproxy'],
  'redirects-followed': ['--max-redirs 0 --retry 0', '--location --location-trusted --max-redirs 5 --retry 0'],
  'key-on-command-line': ["HTTP=$(printf 'header = \"Authorization: Bearer %s\"\\n' \"$KEY\" | env -i PATH=\"$PATH\" HOME=\"$HOME\" curl -q --config - --proto", "HTTP=$(env -i PATH=\"$PATH\" HOME=\"$HOME\" curl -q --header \"Authorization: Bearer $KEY\" --proto"],
  'key-in-url': ['--write-out \'%{http_code}\' "$HUB$URLPATH" 2>"$META.err"); RC=$?', '--write-out \'%{http_code}\' "$HUB$URLPATH$( case "$URLPATH" in *\\?*) echo "&";; *) echo "?";; esac )key=$KEY" 2>"$META.err"); RC=$?'],
  'non-200-ok': ['if [ "$HTTP" != 200 ]; then echo "The hub answered', 'if false; then echo "The hub answered'],
  'run-any-step': ['  if [ "$WORD" = run ]; then case "$STEP" in C7-run-1|C7-run-2) ;; *) echo "the manual run exists only as step C7-run-1 or C7-run-2" >&2; exit 2;; esac', '  if [ "$WORD" = run ]; then :'],
  'step-not-matched': ['    case "$TAIL" in "$WORD") ;; "$WORD"-*)', '    case "$TAIL" in *) ;; "$WORD"-*)'],
  'read-only-claims': ['  case "$STEP" in *-hold|*-hold-*|*-recover|*-recover-*|*-sweep|*-sweep-*|*-release|*-release-*|*-run|*-run-*) echo "step id', '  case "$STEP" in NEVER) echo "step id'],
  'plan-unchecked': [['  recover-apply|sweep-apply) case "$PLAN" in ????????????????) ;; *) echo "this command needs the 16-character plan id from its dry run" >&2; exit 2;; esac', '  recover-apply|sweep-apply) :'], ['                             case "$PLAN" in *[!0-9a-f]*) echo "a plan id is 16 characters, 0-9 and a-f" >&2; exit 2;; esac\n', '']],
  'run2-any-time': [['  if [ "$AGE" -lt 600 ]; then', '  if false; then'], ['  if [ "$AGE" -gt 2400 ]; then', '  if false; then']],
  'run2-after-published': ["  if [ -s \"$B1\" ] && grep -q 'published' \"$B1\"; then", '  if false; then'],
  'run2-after-lost': ['  if [ ! -s "$B1" ]; then unset KEY', '  if false; then unset KEY'],
  'overwrite-read': ['  K=1; while ! ( set -o noclobber; : > "$OUT/$STEP.$K.meta.txt" ) 2>/dev/null; do K=$((K + 1));', '  K=1; while false; do K=$((K + 1));'],
  'note-case-in-substitution': [`printf 'request: %s %s%s\\n' "$METHOD" "$HUB" "$URLPATH"; cat; }`, 'echo "request: $METHOD $HUB${URLPATH%%\\?*}$( case "$URLPATH" in *\\?*) echo "?${URLPATH#*\\?}";; esac )"; cat; }'],
  'note-request-wrong': [`printf 'request: %s %s%s\\n' "$METHOD" "$HUB" "$URLPATH"; cat; }`, `printf 'request: %s %s%s\\n' "$METHOD" "$HUB" "\${URLPATH%%\\?*}"; cat; }`],
  'note-field-dropped': ['echo "curl_exit: $RC"; echo "http_status: $HTTP"', 'echo "http_status: $HTTP"'],
  'stderr-noise': ['echo "Done: HTTP 200. Saved $BODY"; echo', 'echo "admin.sh: command substitution: line 106: syntax error near unexpected token" >&2; echo "Done: HTTP 200. Saved $BODY"; echo'],
  'mutate-by-get': ["  hold)          MUT=yes; METHOD=POST; WORD=hold;", "  hold)          MUT=yes; METHOD=GET; WORD=hold;"],
};
let src = fs.readFileSync(path.join(HERE, 'earthview-admin.sh'), 'utf8');
if (BREAK) { if (!(BREAK in BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
  for (const b of Array.isArray(BREAKS[BREAK][0]) ? BREAKS[BREAK] : [BREAKS[BREAK]]) { if (src.split(b[0]).length !== 2) { console.log('FAIL  break did not apply (each part must match exactly once): ' + BREAK); process.exit(1); } src = src.replace(b[0], b[1]); } }
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-admin-')), SCRIPT = path.join(TMP, 'admin.sh'); fs.writeFileSync(SCRIPT, src, { mode: 0o755 });
const KEY = 'synthetic-key-5b20e7a1', KEYS = path.join(TMP, 'KEYS.md'); fs.writeFileSync(KEYS, `| name | value |\n|---|---|\n| INGEST_KEY | other |\n| ADMIN_KEY | ${KEY} |\n`);
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 700) : ''}`); } };
// ---------- the stand-in hub: records every request it receives
const S = { reqs: [], mode: 'ok', hold: [], body: null };
const server = http.createServer((req, res) => { const n = S.reqs.length; S.reqs.push({ method: req.method, url: req.url, auth: req.headers.authorization || null, headers: req.headers });
  if (S.mode === 'hang') { S.hold.push(res); return; }
  if (S.mode === '503') { res.writeHead(503, { 'content-type': 'application/json' }); return res.end('{"error":"unavailable"}'); }
  if (S.mode === '409') { res.writeHead(409, { 'content-type': 'application/json' }); return res.end('{"layer":"earthview","applied":false,"refused":"not held"}'); }
  if (S.mode === '503-then-200' && n === 0) { res.writeHead(503, { 'content-type': 'application/json', 'retry-after': '0' }); return res.end('{"error":"try again"}'); }
  if (S.mode === 'redirect' && !req.url.startsWith('/elsewhere')) { res.writeHead(307, { location: '/elsewhere' }); return res.end(); }
  if (S.mode === 'reset') return req.socket.destroy();
  res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(S.body || JSON.stringify({ layer: 'earthview', ok: true, n })); });
await new Promise(r => server.listen(0, '127.0.0.1', r)); const HUB = `http://127.0.0.1:${server.address().port}`;
const reset = (mode = 'ok', body = null) => { S.reqs.length = 0; S.mode = mode; S.body = body; for (const r of S.hold.splice(0)) try { r.destroy(); } catch (_) { } };
let nOut = 0; const newOut = () => path.join(TMP, 'out-' + (nOut++));
function launch(args, o = {}) { const out = o.out || newOut(), env = { PATH: o.path || process.env.PATH, HOME: o.home || TMP, OUT: out, KEYS_FILE: o.keys || KEYS, EV_ADMIN_TEST_HUB: HUB, EV_ADMIN_TEST_MAX_TIME: String(o.maxTime || 20), ...(o.env || {}) };
  const child = spawn('bash', [SCRIPT, ...args], { env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] }); let text = '', err = '';
  child.stdout.on('data', d => { text += d; }); child.stderr.on('data', d => { text += d; err += d; });
  return { child, out, done: new Promise(res => child.on('close', (code, signal) => res({ code, signal, text, err, out }))) }; }
const run = (args, o) => launch(args, o).done;
const files = out => fs.existsSync(out) ? fs.readdirSync(out).sort() : [];
const read = (out, f) => { try { return fs.readFileSync(path.join(out, f), 'utf8'); } catch (_) { return ''; } };
const everything = r => r.text + files(r.out).map(f => fs.statSync(path.join(r.out, f)).isDirectory() ? fs.readdirSync(path.join(r.out, f)).map(g => read(r.out, path.join(f, g))).join('') : read(r.out, f)).join('\n');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PLAN = '0123456789abcdef';
const isoAgo = s => new Date(Date.now() - s * 1000).toISOString().replace(/\.\d+Z$/, 'Z');

// ===== A. Each command makes the one request it should
{ const table = [
    [['C1', 'status'], 'GET', '/admin/earthview/status'], [['C3', 'recover-plan'], 'GET', '/admin/earthview/recover'], [['C5a', 'sweep-plan'], 'GET', '/admin/earthview/sweep'], [['C5b', 'release-plan'], 'GET', '/admin/earthview/release'],
    [['C2-hold', 'hold'], 'POST', '/admin/earthview/hold?apply=1'], [['C4-recover', 'recover-apply', PLAN], 'POST', '/admin/earthview/recover?apply=1&plan=' + PLAN], [['C5-sweep', 'sweep-apply', PLAN], 'POST', '/admin/earthview/sweep?apply=1&plan=' + PLAN],
    [['C5-release', 'release-apply'], 'POST', '/admin/earthview/release?apply=1'], [['C7-run-1', 'run'], 'POST', '/admin/run/earthview'], [['D12-hold-2', 'hold'], 'POST', '/admin/earthview/hold?apply=1'],
  ];
  for (const [args, method, url] of table) { reset(); const r = await run(args);
    ok(`A1 ${args.join(' ')}: exactly one ${method} ${url}, exit 0`, r.code === 0 && S.reqs.length === 1 && S.reqs[0].method === method && S.reqs[0].url === url, { code: r.code, reqs: S.reqs.map(q => [q.method, q.url]), text: r.text });
    ok(`A2 ${args.join(' ')}: the key travels as "Authorization: Bearer <key>" and nowhere else: not in the URL, not in another header`, S.reqs.length === 1 && S.reqs[0].auth === 'Bearer ' + KEY && !S.reqs[0].url.includes(KEY) && !/key=/.test(S.reqs[0].url) && Object.entries(S.reqs[0].headers).filter(([k, v]) => String(v).includes(KEY)).length === 1, S.reqs[0]);
    ok(`A3 ${args.join(' ')}: the key is in nothing the script printed and in no file it wrote`, !everything(r).includes(KEY), everything(r).slice(0, 300)); }
  reset(); const r = await run(['C2-hold', 'hold']);
  ok('A4 a step that changes something leaves its claim, the answer as received and a meta file', files(r.out).join() === 'C2-hold.claim,C2-hold.json,C2-hold.meta.txt' && JSON.parse(read(r.out, 'C2-hold.json')).ok === true && /http_status: 200/.test(read(r.out, 'C2-hold.meta.txt')) && /called_at: 20/.test(read(r.out, 'C2-hold.meta.txt')), files(r.out));
  const again = await run(['C2-hold', 'hold'], { out: r.out });
  ok('A5 the same step started again: refused (exit 4), no second request', again.code === 4 && S.reqs.length === 1 && /already claimed/.test(again.text), { code: again.code, reqs: S.reqs.length });
  const s1 = await run(['C1', 'status'], { out: r.out }), s2 = await run(['C1', 'status'], { out: r.out });
  ok('A6 a read-only command may be repeated: each answer is saved under the next number and none is overwritten', s1.code === 0 && s2.code === 0 && files(r.out).filter(f => /^C1\./.test(f)).join() === 'C1.1.json,C1.1.meta.txt,C1.2.json,C1.2.meta.txt' && S.reqs.length === 3 && JSON.parse(read(r.out, 'C1.1.json')).n === 1 && JSON.parse(read(r.out, 'C1.2.json')).n === 2, files(r.out)); }

// ===== B. Two launches of one step at the same moment: exactly one calls
{ reset('hang'); const out = newOut(), a = launch(['C4-recover', 'recover-apply', PLAN], { out, maxTime: 3 }), b = launch(['C4-recover', 'recover-apply', PLAN], { out, maxTime: 3 });
  const [ra, rb] = await Promise.all([a.done, b.done]);
  ok('B1 two launches of the same step together: one is refused with exit 4, one calls; ONE request reaches the hub', [ra.code, rb.code].sort().join() === '4,7' && S.reqs.length === 1, { codes: [ra.code, rb.code], reqs: S.reqs.length });
  ok('B2 the caller whose answer was lost says to reconcile and not to repeat; the claim is kept', /Do NOT repeat/.test(ra.text + rb.text) && fs.existsSync(path.join(out, 'C4-recover.claim')), ra.text + rb.text);
  reset(); const c = await run(['C4-recover', 'recover-apply', PLAN], { out });
  ok('B3 after a lost answer the step cannot be started again', c.code === 4 && S.reqs.length === 0, { code: c.code, reqs: S.reqs.length }); }

// ===== C. Nothing inherited can add a request
{ reset('503-then-200'); const home = fs.mkdtempSync(path.join(TMP, 'home-')); fs.writeFileSync(path.join(home, '.curlrc'), 'retry = 3\nretry-all-errors\nretry-delay = 0\nlocation\n');
  const r = await run(['C2-hold', 'hold'], { home });
  ok('C1 a ~/.curlrc asking for retries is not read: one request, the 503 saved as received, exit 8', S.reqs.length === 1 && r.code === 8 && /http_status: 503/.test(read(r.out, 'C2-hold.meta.txt')), { reqs: S.reqs.length, code: r.code });
  reset('redirect'); const r2 = await run(['C7-run-1', 'run']);
  ok('C2 a redirect is not followed: one request, and the key is sent nowhere else', S.reqs.length === 1 && r2.code !== 0, { reqs: S.reqs.map(q => q.url), code: r2.code });
  // a curl stand-in that records its own environment and arguments
  const bin = fs.mkdtempSync(path.join(TMP, 'bin-')), rec = path.join(bin, 'seen.txt');
  fs.writeFileSync(path.join(bin, 'curl'), `#!/bin/bash\n{ echo "ARGS: $*"; echo "ENV:"; env; echo "STDIN:"; cat; } > "${rec}"\nfor a in "$@"; do case "$prev" in --output) printf '{"ok":true}' > "$a";; esac; prev="$a"; done\nprintf 200\n`, { mode: 0o755 });
  reset(); const r3 = await run(['C1', 'status'], { path: bin + ':' + process.env.PATH, env: { https_proxy: 'http://127.0.0.1:9', CURL_HOME: home, ALL_PROXY: 'http://127.0.0.1:9', SECRET_THING: 'x' } }); const seen = fs.readFileSync(rec, 'utf8');
  ok('C3 curl is started with -q first and an emptied environment: no proxy or curl variable reaches it', r3.code === 0 && /^ARGS: -q --config - /m.test(seen) && !/https_proxy|CURL_HOME|ALL_PROXY|SECRET_THING/.test(seen.split('STDIN:')[0]), seen.slice(0, 400));
  ok('C4 the key is not among curl\'s arguments or environment; it arrives on standard input only', !seen.split('STDIN:')[0].includes(KEY) && seen.split('STDIN:')[1].includes('Authorization: Bearer ' + KEY), null); }

// ===== D. Answers that are not a clean 200
{ reset('409'); const r = await run(['C5b', 'release-plan']);
  ok('D1 a 409 is saved as received and reported (exit 8)', r.code === 8 && /"refused":"not held"/.test(read(r.out, 'C5b.1.json')) && /HTTP 409/.test(r.text), { code: r.code, text: r.text });
  reset('reset'); const r2 = await run(['C1', 'status']);
  ok('D2 a read-only call with no answer: exit 7, and it says nothing was changed', r2.code === 7 && /Nothing was changed/.test(r2.text), r2.text);
  reset('hang'); const r3 = await run(['C7-run-1', 'run'], { maxTime: 2 });
  ok('D3 the manual run with no answer in time: exit 7, "may still have taken effect", "Do NOT repeat", claim kept', r3.code === 7 && /may still have taken effect/.test(r3.text) && /Do NOT repeat/.test(r3.text) && fs.existsSync(path.join(r3.out, 'C7-run-1.claim')) && S.reqs.length === 1, { code: r3.code, text: r3.text });
  reset('hang'); const l = launch(['C2-hold', 'hold'], { maxTime: 30 }); await sleep(700); process.kill(-l.child.pid, 'SIGINT'); const r4 = await l.done;
  ok('D4 interrupted after the call started: exit 9, recorded as interrupted, claim kept, not repeatable', r4.code === 9 && /INTERRUPTED/.test(read(r4.out, 'C2-hold.meta.txt')) && fs.existsSync(path.join(r4.out, 'C2-hold.claim')), { code: r4.code, meta: read(r4.out, 'C2-hold.meta.txt') }); }

// ===== E. Usage: the step id must name the command; nothing is called on a usage error
{ const bad = [
    [['C2-hold', 'release-apply'], 'a step id that names another command'], [['C2', 'hold'], 'a mutating command under a read-only id'], [['C2-holdx', 'hold'], 'a step id that only starts like the command'],
    [['hold', 'hold'], 'a step id with no stage letter and number'], [['c2-hold', 'hold'], 'a lower-case stage letter'], [['C-hold', 'hold'], 'no step number'], [['C2-hold-x', 'hold'], 'a non-numeric suffix'],
    [['C2-hold', 'status'], 'a read-only command under a mutating step id'], [['C7-run-1', 'status'], 'status under the run step id'],
    [['C7-run-3', 'run'], 'a third run'], [['D1-run-1', 'run'], 'a run in another stage'], [['C7-run', 'run'], 'a run with no number'], [['X9-run-1', 'run'], 'a run under another letter'],
    [['C4-recover', 'recover-apply'], 'recover-apply with no plan id'], [['C4-recover', 'recover-apply', 'xyz'], 'a short plan id'], [['C4-recover', 'recover-apply', '0123456789ABCDEF'], 'an upper-case plan id'], [['C4-recover', 'recover-apply', '0123456789abcde&'], 'a plan id with another character'],
    [['C2-hold', 'hold', PLAN], 'a plan id where none is taken'], [['C1', 'wipe'], 'an unknown command'], [['C1'], 'no command'], [[], 'no arguments'], [['C1/../x', 'status'], 'a step id with a path in it'], [['C1', 'status', '', 'extra'], 'an extra argument'],
  ];
  for (const [args, name] of bad) { reset(); const r = await run(args);
    ok(`E ${name} (${args.join(' ') || 'nothing'}): exit 2, no request, nothing claimed or written`, r.code === 2 && S.reqs.length === 0 && files(r.out).length === 0, { code: r.code, reqs: S.reqs.length, files: files(r.out), text: r.text.slice(0, 160) }); }
  reset(); const r = await run(['C1', 'status'], { keys: path.join(TMP, 'no-such-KEYS.md') });
  ok('E a missing KEYS.md: exit 6, no request, nothing claimed', r.code === 6 && S.reqs.length === 0 && files(r.out).length === 0, { code: r.code, files: files(r.out) });
  reset(); const r2 = await run(['C2-hold', 'hold'], { env: { EV_ADMIN_TEST_HUB: 'http://example.com' } });
  ok('E a hub address that is neither https nor the local test address: refused', r2.code === 2 && S.reqs.length === 0, r2.text); }

// ===== F. The second manual run
{ const seed = (out, { age, body, called = true }) => { fs.mkdirSync(path.join(out, 'C7-run-1.claim'), { recursive: true }); fs.writeFileSync(path.join(out, 'C7-run-1.meta.txt'), `step: C7-run-1\ncommand: run\n${called ? 'called_at: ' + isoAgo(age) + '\n' : 'result: INTERRUPTED\n'}http_status: 200\n`); if (body !== null) fs.writeFileSync(path.join(out, 'C7-run-1.json'), body); };
  const SRC_FAIL = '{"job":"earthview","result":"earthview:down source check failed"}', PUB = '{"job":"earthview","result":"earthview:published 2026-11-24T07:10:00Z"}';
  const cases = [
    ['with no first run in this folder', null, 5], ['5 minutes after the first', { age: 300, body: SRC_FAIL }, 5], ['9 min 50 s after the first', { age: 590, body: SRC_FAIL }, 5],
    ['12 minutes after a first run that failed at the source', { age: 720, body: SRC_FAIL }, 0], ['39 minutes after', { age: 2340, body: SRC_FAIL }, 0], ['41 minutes after', { age: 2460, body: SRC_FAIL }, 5], ['a day after', { age: 86400, body: SRC_FAIL }, 5],
    ['20 minutes after a first run that PUBLISHED', { age: 1200, body: PUB }, 5], ['20 minutes after a first run whose answer was lost', { age: 1200, body: null }, 5], ['after a first run that was interrupted before its call', { age: 1200, body: SRC_FAIL, called: false }, 5],
  ];
  for (const [name, s, want] of cases) { reset(); const out = newOut(); fs.mkdirSync(out, { recursive: true }); if (s) seed(out, s); const r = await run(['C7-run-2', 'run'], { out });
    ok(`F C7-run-2 ${name}: ${want === 0 ? 'permitted, one POST to /admin/run/earthview' : 'refused (exit 5), no request, no claim'}`, r.code === want && S.reqs.length === (want === 0 ? 1 : 0) && fs.existsSync(path.join(out, 'C7-run-2.claim')) === (want === 0), { code: r.code, reqs: S.reqs.length, text: r.text.slice(0, 200) }); }
  reset(); const out = newOut(); fs.mkdirSync(out, { recursive: true }); seed(out, { age: 720, body: SRC_FAIL }); await run(['C7-run-2', 'run'], { out }); const again = await run(['C7-run-2', 'run'], { out });
  ok('F the second run cannot be started twice either', again.code === 4 && S.reqs.length === 1, { code: again.code, reqs: S.reqs.length }); }

// ===== G. The note file of every step, and no shell diagnostics (added 22 Nov 2026 after Stage C step C1 on macOS bash 3.2)
{ const table = [
    [['C1', 'status'], 'GET', '/admin/earthview/status', 'C1.1'], [['C3', 'recover-plan'], 'GET', '/admin/earthview/recover', 'C3.1'], [['C5a', 'sweep-plan'], 'GET', '/admin/earthview/sweep', 'C5a.1'], [['C5b', 'release-plan'], 'GET', '/admin/earthview/release', 'C5b.1'],
    [['C2-hold', 'hold'], 'POST', '/admin/earthview/hold?apply=1', 'C2-hold'], [['C4-recover', 'recover-apply', PLAN], 'POST', '/admin/earthview/recover?apply=1&plan=' + PLAN, 'C4-recover'], [['C5-sweep', 'sweep-apply', PLAN], 'POST', '/admin/earthview/sweep?apply=1&plan=' + PLAN, 'C5-sweep'],
    [['C5-release', 'release-apply'], 'POST', '/admin/earthview/release?apply=1', 'C5-release'], [['C7-run-1', 'run'], 'POST', '/admin/run/earthview', 'C7-run-1'],
  ];
  const DIAG = /syntax error|command substitution|unexpected token|unexpected EOF|command not found|bad substitution|: line \d+:/;
  const T = '20\\d\\d-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\dZ';
  for (const [args, method, url, base] of table) { reset(); const r = await run(args); const meta = read(r.out, base + '.meta.txt'), lines = meta.split('\n');
    ok(`G1 ${args.join(' ')}: the note's request line is exactly "request: ${method} <hub>${url}"`, lines[2] === `request: ${method} ${HUB}${url}` && meta.split('\n').filter(l => /^request:/.test(l)).length === 1, lines[2]);
    ok(`G2 ${args.join(' ')}: a successful call writes nothing to standard error and no shell diagnostic anywhere`, r.code === 0 && r.err === '' && !DIAG.test(r.text) && !DIAG.test(meta), { code: r.code, err: r.err, text: r.text.slice(0, 300) });
    const want = [`^step: ${args[0]}$`, `^command: ${args[1]}$`, '^request: ', `^called_at: ${T}$`, `^answered_at: ${T}$`, '^curl_exit: 0$', '^http_status: 200$', `^answer_file: ${base.replace(/\./g, '\\.')}\\.json \\(\\d+ bytes\\)$`, '^curl_message: $', '^$'];
    ok(`G3 ${args.join(' ')}: the note holds exactly its nine fields, in order, and nothing else`, lines.length === want.length && want.every((w, i) => new RegExp(w).test(lines[i])), lines); }
  reset('409'); const r = await run(['C2-hold', 'hold']); const m = read(r.out, 'C2-hold.meta.txt').split('\n');
  ok('G4 a refused call (409) still has an exact request line, every field, and no shell diagnostic', r.code === 8 && m[2] === `request: POST ${HUB}/admin/earthview/hold?apply=1` && m[6] === 'http_status: 409' && m.length === 10 && !DIAG.test(r.text), { code: r.code, m, text: r.text });
  reset('hang'); const l = launch(['C4-recover', 'recover-apply', PLAN], { maxTime: 30 }); await sleep(700); process.kill(-l.child.pid, 'SIGINT'); const r2 = await l.done; const m2 = read(r2.out, 'C4-recover.meta.txt').split('\n');
  ok('G5 an interrupted call: the note still has step, command, the exact request line and the INTERRUPTED result; no shell diagnostic', r2.code === 9 && m2[0] === 'step: C4-recover' && m2[1] === 'command: recover-apply' && m2[2] === `request: POST ${HUB}/admin/earthview/recover?apply=1&plan=${PLAN}` && /^result: INTERRUPTED at /.test(m2[3]) && !DIAG.test(r2.text), { code: r2.code, m2, text: r2.text }); }

server.close(); for (const r of S.hold) try { r.destroy(); } catch (_) { }
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { }
{ const v = await new Promise(res => { const c = spawn('bash', ['--version']); let o = ''; c.stdout.on('data', d => { o += d; }); c.on('close', () => res(o.split('\n')[0])); c.on('error', () => res('bash not found')); }); console.log('shell used for the script: ' + v); }
console.log(`\nearthview-admin${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
