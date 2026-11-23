/* Earth from Space, Stage A probe (phase1/evprobe.js): the build, the plan, a run, and the rule that reads the result.
 * Nothing reaches the network; EUMETView is stubbed with the fixtures. 2048 px inputs are real frames; the 1536 px inputs are those
 * frames RESIZED here (earthview-fixtures/*-1536-derived.jpg, see SOURCE.md): they exercise the probe's code path at that size and
 * say nothing about how EUMETView renders 1536 px (that is evidence/…/validation-1536.md).
 * Run: node --no-warnings phase1/evprobe.test.mjs        SIM=0 skips the whole-window simulation (about a minute)
 * BREAK=<name> weakens a copy of evprobe.js; each must fail:
 *   window-ignored excluded-ignored size-fixed repeats-once ballast-not-written ballast-released-early no-start-line
 *   fetched-logged-late header-gates-validation fourth-request budget-ignored stale-build actual-time-ignored
 *   request-may-outlast-slot duplicate-in-isolate-runs no-attempt-id; and of evprobe.report.mjs: report-missing-counts-as-pass
 *   report-checkpoint-any report-refusal-ignored report-cpu-null-is-zero report-any-validation-count report-no-invocation-needed
 *   report-first-attempt-wins report-stitches-attempts report-build-unchecked report-plan-unchecked report-diagnosis-by-time
 *   report-absence-is-failure */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto'; import { execFileSync } from 'node:child_process'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), FX = path.join(HERE, 'earthview-fixtures'), BREAK = process.env.BREAK || '';
const BREAKS = {
  'window-ignored': ["  if (k < 0 || k >= PROBE.SLOTS) {", "  if (false) {"],
  'excluded-ignored': ["    if (PROBE.EXCLUDED_UTC_MINUTES.includes(minute)) {", "    if (false) {"],
  'size-fixed': ["size: PROBE.SIZES[n % 2], validations:", "size: PROBE.SIZES[0], validations:"],
  'repeats-once': ["validations: phase === 2 ? PROBE.REPEATS : 1,", "validations: 1,"],
  'ballast-not-written': ["const b = new Uint8Array(1048576); b.fill((i * 31 + 7) & 255); ballast.push(b);", "const b = new Uint8Array(1048576); ballast.push(b);"],
  'ballast-released-early': ["    let last = null, refused = 0;", "    let last = null, refused = 0; ballast = ballast && [];"],
  'no-start-line': ["  evprobeSay({ ...base, ev: 'start',", "  if (false) evprobeSay({ ...base, ev: 'start',"],
  'fetched-logged-late': [["    evprobeSay({ ...base, ev: 'fetched', frame_time: T, actual: evprobeIso(Date.now()), cache_age_s: r.headers.get('age'), picture: fact(pic), check: fact(chk), header_ok });\n", ""], ["    let ballast_ok = null;", "    evprobeSay({ ...base, ev: 'fetched', frame_time: T, actual: evprobeIso(Date.now()), cache_age_s: r.headers.get('age'), picture: fact(pic), check: fact(chk), header_ok });\n    let ballast_ok = null;"]],
  'header-gates-validation': ["    if (!pic.ok || !chk.ok) return done('fetch failed', { frame_time: T, header_ok });", "    if (!pic.ok || !chk.ok || !header_ok) return done('fetch failed', { frame_time: T, header_ok });"],
  'fourth-request': ["    const T = evLatest(xml); if (!T) return done('frame list: no time for this layer');", "    const T = evLatest(xml); if (!T) return done('frame list: no time for this layer'); try { await fetch(EARTHVIEW.CAP); } catch (_) {}"],
  'budget-ignored': ["    if (left() < 2 * EARTHVIEW.TIMEOUT_MS) return done('wall budget: not enough left for the pictures');", ""],
  'actual-time-ignored': ["  if (began < slotStart || began >= slotEnd) {", "  if (false) {"],
  'request-may-outlast-slot': ["const fits = timeoutMs => { const now = Date.now(); return now >= slotStart && now + timeoutMs <= slotEnd; };", "const fits = timeoutMs => true;"],
  'duplicate-in-isolate-runs': ["  if (EVPROBE_ISOLATE.slots.has(k)) {", "  if (false) {"],
  'no-attempt-id': ["const base = { probe: 'evprobe', attempt: evprobeHex(6), k,", "const base = { probe: 'evprobe', attempt: 'x', k,"],
  'stale-build': ["/* ===== PART 2: phase1/evprobe.driver.js ===== */", "/* ===== PART 2: phase1/evprobe.driver.js ===== */\nconst EDITED_BY_HAND = 1;"],
};
const REPORT_BREAKS = {
  'report-missing-counts-as-pass': ["const c2 = tri(hFailed.length > 0, hSeen.length === h.length);", "const c2 = tri(hFailed.length > 0, true);"],
  'report-checkpoint-any': ["upTo.length > 0 && upSlots.every(s => s.clean));", "true);"],
  'report-refusal-ignored': ["refusals.every(r => r.diagnosis === 'a') && p12.every(", "p12.every("],
  'report-cpu-null-is-zero': ["const cpuOf = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0) ? v : null;", "const cpuOf = v => Number(v) || 0;"],
  'report-any-validation-count': ["return idx === want ? null : `${what} indices ${idx || 'none'}, expected ${want}`; };", "return null; };"],
  'report-no-invocation-needed': ["const clean = one && A[0].complete && okOutcome &&", "const clean = A.length === 1 && A[0].complete &&"],
  'report-first-attempt-wins': ["const A = [...(byK.get(s.k) || new Map())].map(([id, L]) => readAttempt(s, id, L)), inv = invK.get(s.k) || [],", "const A = [...(byK.get(s.k) || new Map())].map(([id, L]) => readAttempt(s, id, L)).slice(0, 1), inv = (invK.get(s.k) || []).slice(0, 1),"],
  'report-stitches-attempts': ["const id = typeof l.attempt === 'string' && l.attempt ? l.attempt : null;", "const id = 'one';"],
  'report-build-unchecked': ["if (st[0].build !== build) problems.push('build is not the reviewed one');", ""],
  'report-plan-unchecked': ["if (l.phase !== s.phase || l.size !== s.size || l.ballast_mib !== s.ballast_mib) {", "if (false) {"],
  'report-diagnosis-by-time': ["diagnosis: (a.inputs && diagnoses[a.inputs]) || null", "diagnosis: diagnoses[a.frame_time + ' ' + size] || (a.inputs && diagnoses[a.inputs]) || null"],
  'report-absence-is-failure': ["const c5 = tri(upSlots.some(s => s.resource.length || s.attempts.some(a => a.ballast_ok === false || a.refused.length)),", "const c5 = tri(upSlots.some(s => !s.clean),"],
};
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 700) : ''}`); } };
for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { console.log('FAIL  suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const mutate = (src, table, name) => { const parts = Array.isArray(table[name][0]) ? table[name] : [table[name]]; for (const b of parts) { if (src.split(b[0]).length !== 2) { console.log('FAIL  break did not apply (each part must match exactly once): ' + name); process.exit(1); } src = src.replace(b[0], b[1]); } return src; };
if (BREAK && !(BREAK in BREAKS) && !(BREAK in REPORT_BREAKS)) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
const ONDISK = fs.readFileSync(path.join(HERE, 'evprobe.js'), 'utf8'), WORKER = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const load = async (src, name) => { const tmp = path.join(os.tmpdir(), `${name}-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`); fs.writeFileSync(tmp, src); try { return await import(pathToFileURL(tmp).href); } finally { fs.unlinkSync(tmp); } };
const probeSrc = BREAK in BREAKS ? mutate(ONDISK, BREAKS, BREAK) : ONDISK;
const M = await load(probeSrc, 'evprobe'), P = M.default.__probe;
const R = await load(BREAK in REPORT_BREAKS ? mutate(fs.readFileSync(path.join(HERE, 'evprobe.report.mjs'), 'utf8'), REPORT_BREAKS, BREAK) : fs.readFileSync(path.join(HERE, 'evprobe.report.mjs'), 'utf8'), 'evreport');
const B = await import(pathToFileURL(path.join(HERE, 'evprobe.build.mjs')).href);

// ===== A. the build: the file on disk is exactly what the candidate and the driver build; the validation code is the candidate's text
{ const start = P.PROBE_START, again = B.build(WORKER, fs.readFileSync(path.join(HERE, 'evprobe.driver.js'), 'utf8'), start);
  ok('A1 evprobe.js is byte for byte the build of worker.js and evprobe.driver.js for its own start time', again === probeSrc, [again.length, probeSrc.length]);
  let v = ''; try { v = execFileSync('node', [path.join(HERE, 'evprobe.build.mjs'), '--verify'], { encoding: 'utf8' }); } catch (e) { v = String(e.stdout || e); }
  ok('A2 the build script\'s own --verify agrees, and names the file\'s hash', new RegExp('^ok .*sha256 ' + sha(ONDISK)).test(v), v);
  const part1 = ONDISK.slice(ONDISK.indexOf('/* ===== PART 1'), ONDISK.indexOf('/* ===== PART 2'));
  ok('A3 every declaration of part 1 occurs, whole and unchanged, exactly once in worker.js', B.BLOCKS.every(n => { const t = B.cut(WORKER, n); return WORKER.split(t).length === 2 && part1.split(t).length === 2 && sha(t) === P.PROBE_SOURCE.blocks[n]; }) && Object.keys(P.PROBE_SOURCE.blocks).length === B.BLOCKS.length, Object.keys(P.PROBE_SOURCE.blocks));
  ok('A4 part 1 is nothing but those declarations', part1.split('\n').slice(1).join('\n').trimEnd() === B.BLOCKS.map(n => B.cut(WORKER, n)).join('\n'), null);
  ok('A5 the cut of the carried decoder is the whole decoder with its licence notice', /Licensed under the Apache License, Version 2\.0/.test(B.cut(WORKER, 'EV_JPEG')) && /return JpegImage;\n\}\)\(\);$/.test(B.cut(WORKER, 'EV_JPEG')) && B.cut(WORKER, 'EV_JPEG').split('\n').length > 1000);
  let threw = ''; try { B.build(WORKER, 'x', '2026-11-21T07:05:00Z'); } catch (e) { threw = String(e.message); } ok('A6 a start time off the ten-minute grid is refused', /ten-minute grid/.test(threw), threw);
  ok('A7 the Worker has a scheduled handler and NO fetch handler; nothing else is exported', Object.keys(M).join() === 'default' && typeof M.default.scheduled === 'function' && !('fetch' in M.default) && Object.keys(M.default).sort().join() === '__probe,scheduled', Object.keys(M.default));
  ok('A8 the file names no binding, no storage and no secret: env is never read', !/\benv\.[A-Za-z_]/.test(ONDISK.slice(ONDISK.indexOf('/* ===== PART 2'))) && !/\.R2\b|\.DB\b|ADMIN_KEY/.test(ONDISK.slice(ONDISK.indexOf('/* ===== PART 2'))), null); }

// ===== B. the plan
{ const plan = P.evprobePlan(Date.parse('2026-11-21T07:00:00Z')), runs = plan.filter(s => !s.excluded), per = (size, phase) => runs.filter(s => s.size === size && s.phase === phase);
  ok('B1 start 07:00 UTC: 72 slots, 70 runs, the 18:00 and 18:10 slots excluded', plan.length === 72 && runs.length === 70 && plan.filter(s => s.excluded).map(s => s.at).join() === '2026-11-21T18:00:00Z,2026-11-21T18:10:00Z', plan.filter(s => s.excluded));
  ok('B2 per size: 18 runs in phase 1, 5 in phase 2, 12 in phase 3', [2048, 1536].every(z => per(z, 1).length === 18 && per(z, 2).length === 5 && per(z, 3).length === 12), [2048, 1536].map(z => [1, 2, 3].map(p => per(z, p).length)));
  ok('B3 phase 3: each size gets every rung of the ladder exactly twice', [2048, 1536].every(z => [16, 32, 48, 64, 80, 96].every(b => per(z, 3).filter(s => s.ballast_mib === b).length === 2)), per(2048, 3).map(s => s.ballast_mib));
  ok('B4 phase 2 validates six times, the others once; only phase 3 takes extra memory', runs.every(s => s.validations === (s.phase === 2 ? 6 : 1) && (s.phase === 3) === (s.ballast_mib > 0)));
  let all = true, worst = null; for (let m = 0; m < 144; m++) { const st = Date.UTC(2026, 10, 21, 0, 0, 0) + m * 600000, pl = P.evprobePlan(st), rr = pl.filter(s => !s.excluded), c = (z, p) => rr.filter(s => s.size === z && s.phase === p).length;
    const good = pl.length === 72 && rr.length === 70 && [2048, 1536].every(z => c(z, 1) === 18 && c(z, 2) === 5 && c(z, 3) === 12 && [16, 32, 48, 64, 80, 96].every(b => rr.filter(s => s.size === z && s.ballast_mib === b).length === 2)) && rr.every((s, i) => s.size === [2048, 1536][i % 2]) && pl.filter(s => s.excluded).every(s => /T(06|18):[01]0:00Z$/.test(s.at));
    if (!good) { all = false; worst = new Date(st).toISOString(); break; } }
  ok('B5 the same holds for EVERY start on the ten-minute grid: 70 runs, 18/5/12 per size, two full ladders per size, sizes alternating', all, worst);
  ok('B6 at most three requests a run: 210 in all', runs.length * 3 === 210); }

// ===== C. a run (EUMETView stubbed)
const RealDate = Date; let offset = 0; globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); } static now() { return RealDate.now() + offset; } };
const setNow = ms => { offset = ms - RealDate.now(); };
const FILES = { 2048: n => fs.readFileSync(path.join(FX, n + '.jpg')), 1536: n => fs.readFileSync(path.join(FX, n + '-1536-derived.jpg')), png: n => fs.readFileSync(path.join(FX, n + '.png')) };
const START = Date.parse(P.PROBE_START), PLAN = P.evprobePlan(), slotAt = k => START + k * 600000, kOf = pred => PLAN.find(s => !s.excluded && pred(s)).k;
const caps = t => `<WMS_Capabilities><Capability><Layer><Layer><Name>mtg_fd:rgb_geocolour</Name><Dimension name="time" default="${t}" units="ISO8601">x</Dimension></Layer></Layer></Capability></WMS_Capabilities>`;
function stub(o = {}) { P.EVPROBE_ISOLATE.slots.clear();   // each stub stands for a fresh isolate
  const w = { reqs: [], lines: [], base: 'day', latest: '2026-11-19T11:00:00Z', warn: 'echo', picWarn: undefined, chkWarn: undefined, pic: null, capStatus: 200, capDelayMs: 0, picDelayMs: 0, ...o };
  globalThis.fetch = async (url, init) => { const u = String(url); w.reqs.push({ u, ua: init && init.headers && init.headers['User-Agent'] });
    if (!u.startsWith('https://view.eumetsat.int/')) throw new Error('unexpected fetch ' + u);
    if (/GetCapabilities/.test(u)) { if (w.capDelayMs) offset += w.capDelayMs; return new Response(caps(w.latest), { status: w.capStatus, headers: { 'content-type': 'text/xml', age: '12' } }); }
    const isPic = /image\/jpeg/.test(u), t = (u.match(/time=([^&]+)/) || [])[1], size = Number((u.match(/width=(\d+)/) || [])[1]); if (isPic && w.picDelayMs) offset += w.picDelayMs;
    if (isPic && w.pic) return new Response(w.pic.body, { status: w.pic.status || 200, headers: { 'content-type': w.pic.type || 'image/jpeg', ...(w.pic.warn === null ? {} : { warning: `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` }) } });
    const wv = isPic ? (w.picWarn !== undefined ? w.picWarn : w.warn) : (w.chkWarn !== undefined ? w.chkWarn : w.warn), h = { 'content-type': isPic ? 'image/jpeg' : 'image/png' };
    if (wv !== null) h.warning = wv === 'echo' ? `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` : wv;
    return new Response(isPic ? FILES[size](w.base) : FILES.png(w.base), { headers: h }); };
  const real = console.log; w.capture = async fn => { console.log = s => { try { w.lines.push(JSON.parse(s)); } catch (_) { w.lines.push({ raw: String(s) }); } }; try { return await fn(); } finally { console.log = real; } };
  w.run = (k, viaHandler = true, actualMs = slotAt(k) + 2000) => { setNow(actualMs); return w.capture(() => viaHandler ? M.default.scheduled({ scheduledTime: slotAt(k), cron: '*/10 * * * *' }, new Proxy({}, { get(_, p) { throw new Error('env was read: ' + String(p)); } }), { waitUntil() { } }) : P.evprobeRun(slotAt(k))); };
  return w; }
const evs = w => w.lines.map(l => l.ev).join(' ');
{ const w = stub(), k = kOf(s => s.phase === 1 && s.size === 2048); await w.run(k); const f = w.lines.find(l => l.ev === 'fetched'), v = w.lines.find(l => l.ev === 'validated'), d = w.lines.find(l => l.ev === 'done'), want = 'https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetMap&version=1.3.0&layers=mtg_fd:rgb_geocolour&styles=&crs=EPSG:900003&bbox=-5500000,-5500000,5500000,5500000';
  ok('C1 phase 1, 2048 px: the lines come in order, start first and the fetch facts before any decode', evs(w) === 'start fetched validate-begin validated done', evs(w));
  ok('C2 exactly three requests: the frame list, the collector\'s pinned picture request, the collector\'s check-image request; each with the hub\'s User-Agent', w.reqs.length === 3 && /GetCapabilities/.test(w.reqs[0].u) && w.reqs[1].u === want + '&width=2048&height=2048&format=image/jpeg&bgcolor=0x0B1016&time=2026-11-19T11:00:00Z' && w.reqs[2].u === want + '&width=256&height=256&format=image/png&transparent=true&time=2026-11-19T11:00:00Z' && w.reqs.every(r => /^mother-earth-collector\/0\.6\.24 /.test(r.ua)), w.reqs);
  ok('C3 the fetch line records, per response, the bytes, the hash, whether the header came and the time it named', f.frame_time === '2026-11-19T11:00:00Z' && f.header_ok === true && f.picture.bytes === 676253 && f.picture.sha256 === '781aa8a233090cac58f24a86052d4059e5634e608a0aa15c35edc6ad24275ed0' && f.picture.header_present === true && f.picture.header_names === '2026-11-19T11:00:00Z' && f.check.header_names === '2026-11-19T11:00:00Z', f);
  ok('C4 the validation line carries the outcome and every measure', v.ok === true && v.scans === 10 && v.progressive === true && v.agreement > 0.9 && v.surround_share_background === 1 && v.disk_brightness_spread > 12 && typeof v.wall_ms === 'number', v);
  ok('C5 the last line says validated; every line carries the slot, run, phase, size and isolate', d.outcome === 'validated' && d.header_ok === true && d.ballast_ok === null && w.lines.every(l => l.probe === 'evprobe' && l.k === k && l.phase === 1 && l.size === 2048 && /^[0-9a-f]{8}$/.test(l.isolate) && /^[0-9a-f]{12}$/.test(l.attempt) && l.attempt === w.lines[0].attempt) && w.lines[0].start === P.PROBE_START && w.lines[0].build === P.EVPROBE_BUILD, d);
  ok('C6 the environment was never read (it throws if touched) and nothing was written anywhere', w.reqs.every(r => /^https:\/\/view\.eumetsat\.int\//.test(r.u))); }
{ const w = stub({ base: 'night' }), k = kOf(s => s.phase === 1 && s.size === 1536); await w.run(k); const v = w.lines.find(l => l.ev === 'validated');
  ok('C7 the 1536 px slot asks for 1536 px and validates at that size (same code, same limits)', /&width=1536&height=1536&format=image\/jpeg/.test(w.reqs[1].u) && /&width=256&height=256&format=image\/png/.test(w.reqs[2].u) && v.ok === true && w.lines.every(l => l.size === 1536), [w.reqs[1].u.slice(-90), v]);
  const w2 = stub({ pic: { body: FILES[2048]('day') } }); await w2.run(k); const v2 = w2.lines.find(l => l.ev === 'validated');
  ok('C8 a 2048 px picture answered to the 1536 px slot is refused for its size', v2.ok === false && /size 2048x2048/.test(v2.detail) && w2.lines.find(l => l.ev === 'done').outcome === 'validation refused', v2); }
{ const w = stub({ base: 'dusk' }), k = kOf(s => s.phase === 2 && s.size === 2048); await w.run(k);
  ok('C9 phase 2: six validations of the same bytes in one invocation, still three requests', evs(w) === 'start fetched' + ' validate-begin validated'.repeat(6) + ' done' && w.reqs.length === 3 && w.lines.filter(l => l.ev === 'validated').every(l => l.ok) && w.lines.find(l => l.ev === 'done').validations === 6, [evs(w), w.reqs.length]); }
{ const w = stub(), k = kOf(s => s.phase === 3 && s.ballast_mib === 48 && s.size === 1536); await w.run(k); const b = w.lines.find(l => l.ev === 'ballast'), d = w.lines.find(l => l.ev === 'done');
  ok('C10 phase 3: the memory is taken first (its own line, before any request is logged), kept through the validation and found intact afterwards', evs(w) === 'start ballast fetched validate-begin validated done' && b.held_mib === 48 && d.ballast_ok === true && d.outcome === 'validated' && w.lines.every(l => l.ballast_mib === 48), [evs(w), d]); }
{ const w = stub({ chkWarn: null }), k = kOf(s => s.phase === 1 && s.size === 2048); await w.run(k); const f = w.lines.find(l => l.ev === 'fetched'), d = w.lines.find(l => l.ev === 'done');
  ok('C11 no header on the check image: recorded as not confirmed, and the validation still runs (memory is measured on every run)', f.header_ok === false && f.check.header_present === false && f.picture.header_present === true && d.outcome === 'validated' && d.header_ok === false, [f, d]);
  const w2 = stub({ picWarn: '99 Nearest value used: time=2026-11-19T10:50:00.000Z ISO8601 (mtg_fd:rgb_geocolour)' }); await w2.run(k); const f2 = w2.lines.find(l => l.ev === 'fetched');
  ok('C12 a header naming another frame: recorded with the time it named', f2.header_ok === false && f2.picture.header_names === '2026-11-19T10:50:00Z' && f2.check.header_names === '2026-11-19T11:00:00Z', f2); }
{ const k = kOf(s => s.phase === 1 && s.size === 2048), w = stub({ pic: { body: 'no', status: 500, type: 'text/plain' } }); await w.run(k); const d = w.lines.find(l => l.ev === 'done');
  ok('C13 the picture request fails: logged, no check-image request, no validation', d.outcome === 'fetch failed' && w.reqs.length === 2 && w.lines.find(l => l.ev === 'fetched').picture.reason === 'picture http error' && !w.lines.some(l => l.ev === 'validate-begin'), [evs(w), d]);
  const w2 = stub({ capStatus: 503 }); await w2.run(k); ok('C14 the frame list fails: one request only', w2.reqs.length === 1 && w2.lines.find(l => l.ev === 'done').outcome === 'frame list: http error', evs(w2));
  const w3 = stub({ capDelayMs: 100000 }); await w3.run(k); ok('C15 wall budget: with too little of the 240 s left for both pictures, none is asked for', w3.reqs.length === 1 && /^wall budget/.test(w3.lines.find(l => l.ev === 'done').outcome), [w3.reqs.length, evs(w3)]);
  const g = (await import(pathToFileURL(path.join(HERE, 'worker.js')).href)); const cut = (() => { const b = FILES[2048]('day'); return new Uint8Array(b.subarray(0, b.length >> 1)); })();
  const w4 = stub({ pic: { body: cut } }); await w4.run(k); const v4 = w4.lines.find(l => l.ev === 'validated');
  ok('C16 a damaged picture is refused with the collector\'s wording, and the run says so', v4.ok === false && v4.reason === 'picture failed validation' && /^structure: /.test(v4.detail) && g.evJpegScans(cut).reason === v4.detail.replace('structure: ', '') && w4.lines.find(l => l.ev === 'done').outcome === 'validation refused', v4); }
{ // the window and the exclusions
  const w = stub(); for (const k of [-1, -6, 72, 77]) await w.run(k); ok('C17 outside the window: no request at all; one short line per tick for the hour either side', w.reqs.length === 0 && w.lines.map(l => l.ev).join() === 'not started,not started,expired,expired', w.lines);
  const w2 = stub(); for (const k of [-7, -1000, 78, 5000]) await w2.run(k); ok('C18 further outside: no request and no line', w2.reqs.length === 0 && w2.lines.length === 0, w2.lines);
  const w3 = stub(), ex = PLAN.filter(s => s.excluded).map(s => s.k); for (const k of ex) await w3.run(k); ok('C19 an excluded slot: no request', ex.length === 2 && w3.reqs.length === 0 && w3.lines.every(l => l.ev === 'excluded'), w3.lines); }
{ // ACTUAL TIME (GPT's review of ef3fd5c, hold 1). The slot comes from the scheduled time; whether anything happens comes from the clock.
  const k0 = kOf(s => s.phase === 1 && s.size === 2048), END = START + 72 * 600000;
  const w = stub({ capStatus: 503 }); await w.run(k0, true, END + 3600000); P.EVPROBE_ISOLATE.slots.clear(); await w.run(k0, true, END + 3600000);
  ok('C22 GPT\'s reproduction: a valid 07:00 slot delivered twice, one hour after the approved end: no request, no start line', w.reqs.length === 0 && !w.lines.some(l => l.ev === 'start') && w.lines.length === 2 && w.lines.every(l => l.ev === 'not run' && l.why === 'delivered after its slot'), [w.reqs.length, w.lines]);
  const w2 = stub(); await w2.run(k0 + 4, true, START - 60000); ok('C23 a slot delivered before the approved start (clock early): no request', w2.reqs.length === 0 && w2.lines[0].ev === 'not run' && w2.lines[0].why === 'delivered before its slot', w2.lines);
  const w3 = stub(); await w3.run(k0, true, slotAt(k0) + 600000 + 5000); ok('C24 a tick delivered eleven minutes late, inside the window: not run in the next slot\'s time', w3.reqs.length === 0 && w3.lines[0].why === 'delivered after its slot', w3.lines);
  const kx = PLAN.find(s => s.excluded).k, w4 = stub(); await w4.run(kx - 1, true, slotAt(kx) + 30000); ok('C25 the slot before an excluded one, delivered during the excluded (Dust RGB) time: no request', w4.reqs.length === 0 && w4.lines[0].ev === 'not run', w4.lines);
  const w5 = stub(); await w5.run(k0, true, slotAt(k0) + 600000 - 20000); ok('C26 twenty seconds before the slot ends: the frame list (30 s timeout) would not be over in time, so it is not asked for', w5.reqs.length === 0 && /^slot ending: frame list/.test(w5.lines.find(l => l.ev === 'done').outcome), evs(w5));
  const w6 = stub({ picDelayMs: 20000 }); await w6.run(k0, true, slotAt(k0) + 600000 - 100000); ok('C27 a hundred seconds before the slot ends, the picture taking 20 s: the list is read, the picture (90 s timeout) is asked for, and the check image is NOT (it would not be over before the slot ends)', w6.reqs.length === 2 && w6.lines.find(l => l.ev === 'fetched').check.reason === 'not requested: slot or budget ending' && w6.lines.find(l => l.ev === 'done').outcome === 'fetch failed', [w6.reqs.length, evs(w6)]);
  const w7 = stub({ capDelayMs: 50000 }); await w7.run(k0, true, slotAt(k0) + 600000 - 110000); ok('C28 the slot\'s end arrives between requests (the list took 50 s): the picture is not asked for', w7.reqs.length === 1 && /^slot ending: picture/.test(w7.lines.find(l => l.ev === 'done').outcome), [w7.reqs.length, evs(w7)]);
  const kl = PLAN[71].excluded ? 69 : 71, w8 = stub(); await w8.run(kl, true, slotAt(kl) + 2000); const lastStart = slotAt(kl) + 2000; ok('C29 the last slot runs, and every request it can start must be over by the approved end', w8.reqs.length === 3 && slotAt(kl) + 600000 <= END && lastStart + 90000 <= END, w8.reqs.length);
  const w9 = stub(); await w9.run(k0); await w9.run(k0); ok('C30 the same slot delivered twice to one isolate runs once', w9.reqs.length === 3 && w9.lines.filter(l => l.ev === 'start').length === 1 && w9.lines[w9.lines.length - 1].why === 'this slot already ran in this isolate', evs(w9));
  const w10 = stub(); await w10.run(k0); P.EVPROBE_ISOLATE.slots.clear(); await w10.run(k0); const at = w10.lines.filter(l => l.ev === 'start').map(l => l.attempt);
  ok('C31 delivered to two isolates (nothing shared, nothing stored) it runs twice, and the two attempts carry different ids', w10.reqs.length === 6 && at.length === 2 && at[0] !== at[1], at); }
{ // isolate bookkeeping
  const w = stub(), k = kOf(s => s.phase === 1 && s.size === 2048); await w.run(k); await w.run(k + 2); const s = w.lines.filter(l => l.ev === 'start');
  ok('C20 two runs in one isolate show as such; neither overlapped', s.length === 2 && s[1].isolate === s[0].isolate && s[1].isolate_run === s[0].isolate_run + 1 && s.every(x => x.overlapping === 0) && P.EVPROBE_ISOLATE.active === 0, s);
  const w2 = stub(); setNow(slotAt(k) + 2000); await w2.capture(() => Promise.all([P.evprobeRun(slotAt(k)), P.evprobeRun(slotAt(k + 2))])); const s2 = w2.lines.filter(l => l.ev === 'start');
  ok('C21 two slots delivered at one moment: only the one whose time it is runs, so runs of different slots cannot overlap', s2.length === 1 && s2[0].k === k && s2[0].overlapping === 0 && w2.lines.some(l => l.ev === 'not run' && l.k === k + 2) && w2.reqs.length === 3 && P.EVPROBE_ISOLATE.active === 0, w2.lines.map(l => [l.k, l.ev])); }

// ===== D. the probe refuses exactly what the hub's collector refuses, for the same reason
{ const W = await import(pathToFileURL(path.join(HERE, 'worker.js')).href), G = FILES[2048]('day'), sos = (() => { const o = []; for (let i = 2; i < G.length - 1; i++) if (G[i] === 0xff && G[i + 1] === 0xda) o.push(i); return o; })();
  const inputs = { 'a real day frame': [G, 'day'], 'a real night frame': [FILES[2048]('night'), 'night'], 'a real dusk frame': [FILES[2048]('dusk'), 'dusk'], 'cut in half': [G.subarray(0, G.length >> 1), 'day'], 'end marker missing': [G.subarray(0, G.length - 2), 'day'],
    'bytes after the end marker': [Buffer.concat([G, Buffer.from([1, 2, 3])]), 'day'], 'first scan only': [Buffer.concat([G.subarray(0, sos[1]), Buffer.from([0xff, 0xd9])]), 'day'], 'scan data replaced': [(() => { const b = Buffer.from(G); for (let i = 0; i < 4000; i++) b[sos[0] + 300 + i] = i % 2 ? 0 : 0xff; return b; })(), 'day'],
    'first scan zeroed': [(() => { const b = Buffer.from(G); b.fill(0, sos[0] + 200, sos[0] + 40200); return b; })(), 'day'], 'day picture against the night check image': [G, 'night'], 'a 1536 px picture': [FILES[1536]('day'), 'day'] };
  const store = new Map(), runs = [], etag = b => sha(b).slice(0, 32);
  const env = { ADMIN_KEY: 'k', EARTHVIEW_ENABLED: '1', R2: { async put(k, body, o = {}) { const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body); const had = store.get(k); if (o.onlyIf && (o.onlyIf.etagDoesNotMatch === '*' ? had : (!had || had.etag !== o.onlyIf.etagMatches))) return null; store.set(k, { buf, etag: etag(buf) }); return { key: k }; },
    async get(k) { const o = store.get(k); return o ? { etag: o.etag, async json() { return JSON.parse(o.buf.toString()); }, async arrayBuffer() { return o.buf.buffer.slice(o.buf.byteOffset, o.buf.byteOffset + o.buf.length); } } : null; }, async head(k) { const o = store.get(k); return o ? { etag: o.etag, size: o.buf.length } : null; },
    async list({ prefix = '' } = {}) { return { objects: [...store.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key, size: store.get(key).buf.length })), truncated: false }; }, async delete(k) { store.delete(k); } },
    DB: { prepare(sql) { return { bind(...a) { return { async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push({ status: a[3], note: a[7] }); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }; } }; } } };
  await W.evAdmin(env, 'hold', true, null); const d = await W.evAdmin(env, 'recover', false, null); await W.evAdmin(env, 'recover', true, d.body.plan_id); await W.evAdmin(env, 'release', true, null);
  let n = 0;
  for (const [name, [pic, chkBase]] of Object.entries(inputs)) { const t = new Date(Date.UTC(2026, 10, 19, 11, 0, 0) + (++n) * 600000).toISOString().replace('.000Z', 'Z'), chk = FILES.png(chkBase);
    globalThis.fetch = async url => { const u = String(url); if (/GetCapabilities/.test(u)) return new Response(caps(t), { headers: { 'content-type': 'text/xml' } }); const isPic = /image\/jpeg/.test(u); return new Response(isPic ? pic : chk, { headers: { 'content-type': isPic ? 'image/jpeg' : 'image/png', warning: `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` } }); };
    setNow(Date.parse(t) + 21 * 60000); const hub = await W.collectEarthView(env, Date.now()), note = runs[runs.length - 1].note, pr = await P.evprobeValidate(pic.buffer.slice(pic.byteOffset, pic.byteOffset + pic.length), chk.buffer.slice(chk.byteOffset, chk.byteOffset + chk.length), 2048);
    const same = pr.ok ? /^earthview:published/.test(hub) && note.includes('agreement ' + pr.agreement) : hub === 'earthview:down ' + pr.reason && note.includes(pr.detail);
    ok(`D ${name}: the probe and the hub's collector agree (${pr.ok ? 'accepted' : pr.detail.slice(0, 40)})`, same, [hub, note.slice(0, 160), pr.ok, pr.reason, pr.detail]); } }

// ===== E. the rule that reads the result (evprobe.report.mjs), on a simulated whole window
if (process.env.SIM !== '0') { const frames = ['2026-11-19T00:00:00Z', '2026-11-19T11:00:00Z', '2026-11-19T16:50:00Z'], bases = ['night', 'day', 'dusk'], w = stub();
  for (const s of PLAN) { const i = Math.floor(s.k / 6) % 3; w.latest = frames[i]; w.base = bases[i]; await w.run(s.k, false); }
  const lines = w.lines, RUNS = PLAN.filter(s => !s.excluded), inv = RUNS.map(s => ({ scheduled: s.at, outcome: 'ok', cpu_ms: s.phase === 2 ? 2300 : 410, wall_ms: 3000 }));
  ok('E0 the simulated window: 70 runs, 210 requests, none on the excluded slots', lines.filter(l => l.ev === 'start').length === 70 && w.reqs.length === 210 && lines.filter(l => l.ev === 'excluded').length === 2, [lines.filter(l => l.ev === 'start').length, w.reqs.length]);
  const ev = (o = {}) => R.evaluate({ start: o.start || P.PROBE_START, build: o.build || P.EVPROBE_BUILD, lines: o.lines || lines, invocations: o.inv || inv, diagnoses: o.diagnoses || {} }, P.evprobePlan);
  const base = await ev(), crit = (r, z = 2048) => Object.values(r.sizes[z].criteria).join(), notQ = (r, z = 2048) => r.sizes[z].verdict !== 'qualifies' && r.forward !== String(z);
  ok('E1 a complete, clean window: both sizes qualify on all five criteria; 2048 px goes forward; the note about the top rung is raised (a local run has no memory limit)', base.forward === '2048' && [2048, 1536].every(z => base.sizes[z].verdict === 'qualifies' && crit(base, z) === 'met,met,met,met,met' && base.sizes[z].header.observed_matching === 18 && base.sizes[z].ladder.every(r => r.planned === 2 && r.clean === 2) && base.sizes[z].notes.some(n => /may not be counted/.test(n)) && base.sizes[z].runs.phase2.clean === 5) && base.runs_planned === 70 && base.attempts_observed === 70 && base.requests_observed_at_most === 210, base.sizes[2048]);
  ok('E2 coverage is counted from what was seen: three distinct frames per size', base.sizes[2048].coverage.distinct_frames === 3 && base.sizes[1536].coverage.distinct_frames === 3, base.sizes[2048].coverage);
  const kOfSize = (pred, z = 2048) => RUNS.filter(s => s.size === z && pred(s)).map(s => s.k);
  const cut = (o, k, keep, outcome) => ({ lines: o.lines.filter(l => l.k !== k || keep(l)), inv: outcome === undefined ? o.inv : o.inv.map(i => i.scheduled === PLAN[k].at ? { ...i, outcome } : i) });
  const upTo = evName => l => ['start', 'ballast', 'fetched', 'validate-begin'].slice(0, ['start', 'ballast', 'fetched', 'validate-begin'].indexOf(evName) + 1).includes(l.ev);
  let o = { lines, inv }; for (const k of [...kOfSize(s => s.ballast_mib === 96), ...kOfSize(s => s.ballast_mib === 80)]) o = cut(o, k, upTo('validate-begin'), 'exceededMemory');
  const top = await ev(o);
  ok('E3 runs at 80 and 96 MiB ended for memory while decoding: reported where they died; the checkpoint at 48 MiB is still met; no "not counted" note', top.sizes[2048].criteria[5] === 'met' && top.sizes[2048].verdict === 'qualifies' && top.sizes[2048].ladder.find(r => r.mib === 96).clean === 0 && top.sizes[2048].ladder.find(r => r.mib === 96).ended_for_resources === 2 && /decoding \(validation 1\)/.test(top.sizes[2048].ladder.find(r => r.mib === 80).died_at[0]) && !top.sizes[2048].notes.some(n => /may not be counted/.test(n)), top.sizes[2048].ladder);
  const k48 = kOfSize(s => s.ballast_mib === 48), at48 = await ev(cut({ lines, inv }, k48[1], upTo('start'), 'exceededMemory'));
  ok('E4 ONE of the two runs at 48 MiB ended for memory (taking the memory): the checkpoint is NOT MET; 2048 px does not qualify; 1536 px goes forward', at48.sizes[2048].criteria[5] === 'not met' && at48.sizes[2048].verdict === 'does not qualify' && /taking the extra memory/.test(at48.sizes[2048].ladder.find(r => r.mib === 48).died_at[0]) && at48.forward === '1536', [at48.sizes[2048].ladder.find(r => r.mib === 48), at48.forward]);
  const quiet = await ev(cut({ lines, inv }, k48[1], upTo('fetched')));
  ok('E4b the same run with its lines stopping early but NO resource outcome recorded: not shown to have failed, so INCOMPLETE, not "not met"', quiet.sizes[2048].criteria[5] === 'incomplete' && quiet.sizes[2048].verdict === 'incomplete' && quiet.forward === '1536', quiet.sizes[2048].criteria);
  const kH = kOfSize(s => s.phase === 1 && s.k > 4)[0], missed = await ev({ lines: lines.filter(l => l.k !== kH), inv: inv.filter(i => i.scheduled !== PLAN[kH].at) });
  ok('E5 a phase 1 slot that never ran: not a header failure and not a pass: INCOMPLETE (17 of 18 observed)', missed.sizes[2048].criteria[2] === 'incomplete' && missed.sizes[2048].header.observed_matching === 17 && missed.sizes[2048].header.failures.length === 0 && missed.sizes[2048].verdict === 'incomplete' && missed.sizes[2048].runs.phase1.not_run === 1 && missed.forward === '1536', [missed.sizes[2048].criteria, missed.sizes[2048].header]);
  const hdr = await ev({ lines: lines.map(l => l.k === kH && l.ev === 'fetched' ? { ...l, header_ok: false, check: { ...l.check, header_present: false, header_names: null } } : l.k === kH && l.ev === 'done' ? { ...l, header_ok: false } : l) });
  ok('E6 one phase 1 run without the header on the check image: NOT MET, with the pattern (which run, which attempt, which response)', hdr.sizes[2048].criteria[2] === 'not met' && hdr.sizes[2048].header.observed_matching === 17 && hdr.sizes[2048].header.failures.length === 1 && hdr.sizes[2048].header.failures[0].k === kH && hdr.sizes[2048].header.failures[0].check_present === false && hdr.sizes[2048].verdict === 'does not qualify', hdr.sizes[2048].header);
  const ref = lines.map(l => l.k === kH && l.ev === 'validated' ? { ...l, ok: false, reason: 'picture failed validation', detail: 'picture does not match the check image' } : l.k === kH && l.ev === 'done' ? { ...l, outcome: 'validation refused', refused: 1 } : l), r0 = await ev({ lines: ref }), fl = lines.find(l => l.k === kH && l.ev === 'fetched'), key = `${fl.picture.sha256} ${fl.check.sha256} 2048`;
  ok('E7 a refused frame with no diagnosis: the size cannot qualify yet (incomplete); the refusal is listed with the hashes of what was refused', r0.sizes[2048].criteria[3] === 'incomplete' && r0.sizes[2048].refusals.length === 1 && r0.sizes[2048].refusals[0].inputs === key && notQ(r0), r0.sizes[2048].refusals);
  const ra = await ev({ lines: ref, diagnoses: { [key]: 'a' } }), rb = await ev({ lines: ref, diagnoses: { [key]: 'b' } }), rc = await ev({ lines: ref, diagnoses: { [key]: 'c' } });
  ok('E8 diagnosed as a faulty picture: criterion 3 met. Diagnosed as a sound picture (b or c): NOT met', ra.sizes[2048].criteria[3] === 'met' && rb.sizes[2048].criteria[3] === 'not met' && rc.sizes[2048].criteria[3] === 'not met' && rc.sizes[2048].verdict === 'does not qualify', [ra.sizes[2048].criteria, rb.sizes[2048].criteria]);
  const rw = await ev({ lines: ref, diagnoses: { [fl.frame_time + ' 2048']: 'a', [`${'0'.repeat(64)} ${fl.check.sha256} 2048`]: 'a' } });
  ok('E8b a diagnosis filed under the frame time, or under another picture\'s hash, does not cover this refusal', rw.sizes[2048].criteria[3] === 'incomplete' && rw.sizes[2048].refusals[0].diagnosis === null, rw.sizes[2048].refusals);
  const withCpu = v => inv.map(i => i.scheduled === PLAN[kH].at ? { ...i, cpu_ms: v } : i), cpu = await ev({ inv: withCpu(5200) });
  ok('E9 CPU is judged on the MAXIMUM single-validation run: one run at 5,200 ms fails it', cpu.sizes[2048].criteria[4] === 'not met' && cpu.sizes[2048].cpu.single_validation_max_ms === 5200 && base.sizes[2048].cpu.single_validation_max_ms === 410 && base.sizes[2048].cpu.six_validations_max_ms === 2300, cpu.sizes[2048].cpu);
  for (const [name, v] of [['absent', undefined], ['null', null], ['an empty string', ''], ['text', 'fast'], ['a numeric string', '410'], ['NaN', NaN], ['negative', -1], ['Infinity', Infinity]]) { const r = await ev({ inv: withCpu(v) });
    ok(`E9 one run's CPU figure is ${name}: it is missing, never zero: criterion 4 incomplete`, r.sizes[2048].criteria[4] === 'incomplete' && r.sizes[2048].cpu.valid_figures === 17 && notQ(r), r.sizes[2048].cpu); }
  const zero = await ev({ inv: inv.map(i => ({ ...i, cpu_ms: 0 })) }); ok('E9 a measured zero is a real figure', zero.sizes[2048].criteria[4] === 'met' && zero.sizes[2048].cpu.single_validation_max_ms === 0 && zero.sizes[2048].cpu.valid_figures === 18, zero.sizes[2048].cpu);
  const kP2 = kOfSize(s => s.phase === 2, 1536)[0], oom2 = await ev(cut({ lines, inv }, kP2, l => ['start', 'fetched'].includes(l.ev) || (l.ev === 'validate-begin' && l.i <= 4) || (l.ev === 'validated' && l.i < 4), 'exceededMemory'));
  ok('E10 a phase 2 run ended for memory: criterion 1 not met for that size only, with where it died', oom2.sizes[1536].criteria[1] === 'not met' && oom2.sizes[1536].ended_for_resources_in_phases_1_2.length === 1 && /decoding \(validation 4\)/.test(oom2.sizes[1536].ended_for_resources_in_phases_1_2[0].died_at[0]) && oom2.sizes[2048].verdict === 'qualifies' && oom2.forward === '2048', oom2.sizes[1536].ended_for_resources_in_phases_1_2);
  const none = await ev({ lines: [], inv: [] }); ok('E11 no observations at all: nothing is met and nothing is failed', none.forward === 'undecided: the experiment is incomplete' && crit(none) === 'incomplete,incomplete,incomplete,incomplete,incomplete', none.sizes[2048].criteria);
  const noinv = await ev({ inv: [] }); ok('E12 probe lines without ANY invocation records: criteria 1, 4 and 5 are incomplete, not assumed', noinv.sizes[2048].criteria[1] === 'incomplete' && noinv.sizes[2048].criteria[4] === 'incomplete' && noinv.sizes[2048].criteria[5] === 'incomplete' && notQ(noinv), noinv.sizes[2048].criteria);

  // ----- GPT's review of ef3fd5c, hold 2: each of these qualified under the first rule. None may.
  const p2 = new Set(kOfSize(s => s.phase === 2));
  const g1 = await ev({ lines: lines.filter(l => !(p2.has(l.k) && ['validated', 'validate-begin'].includes(l.ev) && l.i > 1)).map(l => p2.has(l.k) && l.ev === 'done' ? { ...l, validations: 1 } : l) });
  ok('F1 GPT: every 2048 phase 2 run holds one validation and its done line claims one: does NOT qualify (six are required)', notQ(g1) && g1.sizes[2048].runs.phase2.clean === 0 && g1.sizes[2048].not_clean.some(x => /indices 1, expected 1,2,3,4,5,6/.test(x.why.join(' '))) && g1.sizes[2048].criteria[1] !== 'met', [g1.sizes[2048].criteria, g1.sizes[2048].not_clean[0]]);
  const p3 = new Set(RUNS.filter(s => s.phase === 3).map(s => s.at)), g2 = await ev({ inv: inv.filter(i => !p3.has(i.scheduled)) });
  ok('F2 GPT: no invocation records for the ballast runs: the checkpoint is INCOMPLETE; nothing qualifies', g2.sizes[2048].criteria[5] === 'incomplete' && g2.sizes[1536].criteria[5] === 'incomplete' && /undecided/.test(g2.forward), [g2.sizes[2048].criteria, g2.forward]);
  const g3 = await ev({ inv: inv.map(i => ({ ...i, cpu_ms: null })) });
  ok('F3 GPT: every CPU figure null: criterion 4 INCOMPLETE with no figure at all (not zero)', g3.sizes[2048].criteria[4] === 'incomplete' && g3.sizes[2048].cpu.single_validation_max_ms === null && g3.sizes[2048].cpu.valid_figures === 0 && /undecided/.test(g3.forward), g3.sizes[2048].cpu);
  const kM = kOfSize(s => s.phase === 1)[0], mixed = lines.flatMap(l => l.k !== kM ? [l] : l.ev === 'done' ? [{ ...l, attempt: 'attempt-B' }] : l.ev === 'start' ? [{ ...l, attempt: 'attempt-A' }, { ...l, attempt: 'attempt-B' }] : [{ ...l, attempt: 'attempt-A' }]);
  const g4 = await ev({ lines: mixed, inv: [...inv, inv.find(i => i.scheduled === PLAN[kM].at)] });
  ok('F4 GPT: one slot with fetch and validation from attempt A and the done line from attempt B, two invocation records: never stitched; the slot is not clean and the size does NOT qualify', notQ(g4) && g4.sizes[2048].runs.phase1.clean === 17 && g4.sizes[2048].not_clean.some(x => x.k === kM && /2 attempts/.test(x.why.join(' ')) && /2 invocation records/.test(x.why.join(' '))) && g4.sizes[2048].notes.some(n => /more than one attempt/.test(n)), [g4.sizes[2048].criteria, g4.sizes[2048].not_clean]);
  // ----- the same family, further
  const second = (mut) => lines.flatMap(l => l.k !== kM ? [l] : [l, mut({ ...l, attempt: 'second-try' })]), dupInv = [...inv, { ...inv.find(i => i.scheduled === PLAN[kM].at) }];
  const g5 = await ev({ lines: second(l => l), inv: dupInv });
  ok('F5 a slot that ran twice, both attempts complete and clean: still not counted as clean (two attempts, two records): INCOMPLETE, and both attempts are reported', notQ(g5) && g5.attempts_observed === 71 && g5.requests_observed_at_most === 213 && g5.sizes[2048].criteria[2] === 'incomplete', [g5.attempts_observed, g5.sizes[2048].criteria]);
  const g6 = await ev({ lines: second(l => l.ev === 'fetched' ? { ...l, header_ok: false, picture: { ...l.picture, header_present: false, header_names: null } } : l), inv: dupInv });
  ok('F6 a slot that ran twice, the second attempt without the header: the clean first attempt does not erase it: criterion 2 NOT MET', g6.sizes[2048].criteria[2] === 'not met' && g6.sizes[2048].header.failures[0].attempt === 'second-try', g6.sizes[2048].header);
  const g7 = await ev({ lines: second(l => l).filter(l => !(l.attempt === 'second-try' && ['validated', 'done'].includes(l.ev))), inv: [...inv, { ...inv.find(i => i.scheduled === PLAN[kM].at), outcome: 'exceededMemory' }] });
  ok('F7 a slot that ran twice, the second attempt ended for memory: criterion 1 NOT MET', g7.sizes[2048].criteria[1] === 'not met' && g7.sizes[2048].ended_for_resources_in_phases_1_2[0].k === kM, g7.sizes[2048].ended_for_resources_in_phases_1_2);
  const g8 = await ev({ lines: lines.map(l => l.k === kM ? { ...l, size: 1536 } : l) });
  ok('F8 a slot whose lines claim another size than the plan gives it: not evidence for either size', notQ(g8) && g8.sizes[2048].not_clean.some(x => x.k === kM && /does not match the plan/.test(x.why.join(' '))), g8.sizes[2048].not_clean);
  const g9 = await ev({ build: 'aaaaaaaaaaaa-bbbbbbbbbbbb' }), g10 = await ev({ lines: lines.map(l => l.ev === 'start' ? { ...l, start: '2026-11-20T07:00:00Z' } : l) });
  ok('F9 lines from another build, or naming another start time, are not evidence: nothing qualifies', /undecided/.test(g9.forward) && g9.sizes[2048].runs.phase1.clean === 0 && /undecided/.test(g10.forward) && g10.sizes[1536].runs.phase3.clean === 0, [g9.forward, g10.forward]);
  const kTwo = [...p2][0], g11 = await ev({ lines: lines.map(l => l.k === kTwo && l.i === 4 ? { ...l, i: 6 } : l) });
  ok('F10 a phase 2 run with validation 4 missing and 6 twice (still six lines, done says six): not clean', notQ(g11) && g11.sizes[2048].not_clean.some(x => x.k === kTwo && /indices 1,2,3,5,6,6/.test(x.why.join(' '))), g11.sizes[2048].not_clean);
  const g12 = await ev({ lines: lines.map(l => l.k === kM && l.ev === 'done' ? { ...l, validations: 6 } : l) });
  ok('F11 a done line whose count disagrees with the validation lines: not clean', notQ(g12) && g12.sizes[2048].not_clean.some(x => /does not agree/.test(x.why.join(' '))), g12.sizes[2048].not_clean);
  const g13 = await ev({ lines: lines.map(l => { if (l.k !== kM) return l; const { attempt, ...rest } = l; return rest; }) });
  ok('F12 lines with no attempt id cannot be attributed: the slot is not evidence', notQ(g13) && g13.lines_without_attempt_id > 0 && g13.sizes[2048].runs.phase1.clean === 17, [g13.lines_without_attempt_id, g13.sizes[2048].runs.phase1]);
  const g14 = await ev({ inv: inv.map(i => i.scheduled === PLAN[kM].at ? { ...i, outcome: 'unknown' } : i) }), g15 = await ev({ inv: inv.map(i => i.scheduled === PLAN[kM].at ? { ...i, outcome: undefined } : i) });
  ok('F13 only an explicit "ok" outcome counts: "unknown" or no outcome leaves the slot unclean (incomplete, not failed)', g14.sizes[2048].criteria[1] === 'incomplete' && g15.sizes[2048].criteria[1] === 'incomplete' && notQ(g14) && notQ(g15), [g14.sizes[2048].criteria, g15.sizes[2048].criteria]);
  const kB = kOfSize(s => s.ballast_mib === 32)[0], g16 = await ev({ lines: lines.map(l => l.k === kB && l.ev === 'done' ? { ...l, ballast_ok: false } : l) }), g17 = await ev({ lines: lines.filter(l => !(l.k === kB && l.ev === 'ballast')) });
  ok('F14 a checkpoint run whose memory was not intact: NOT MET; one with no ballast line: not clean', g16.sizes[2048].criteria[5] === 'not met' && g17.sizes[2048].criteria[5] === 'incomplete', [g16.sizes[2048].criteria, g17.sizes[2048].criteria]); }
console.log(`\nevprobe${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
