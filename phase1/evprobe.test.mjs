/* Earth from Space, Stage A probe (phase1/evprobe.js): the build, the plan, a run, and the rule that reads the result.
 * Nothing reaches the network; EUMETView is stubbed with the fixtures. 2048 px inputs are real frames; the 1536 px inputs are those
 * frames RESIZED here (earthview-fixtures/*-1536-derived.jpg, see SOURCE.md): they exercise the probe's code path at that size and
 * say nothing about how EUMETView renders 1536 px (that is evidence/…/validation-1536.md).
 * Run: node --no-warnings phase1/evprobe.test.mjs        SIM=0 skips the whole-window simulation (about a minute)
 * BREAK=<name> weakens a copy of evprobe.js; each must fail:
 *   window-ignored excluded-ignored size-fixed repeats-once ballast-not-written ballast-released-early no-start-line
 *   fetched-logged-late header-gates-validation fourth-request budget-ignored stale-build report-missing-counts-as-pass
 *   report-checkpoint-any report-refusal-ignored */
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
  'fetched-logged-late': [["    evprobeSay({ ...base, ev: 'fetched', frame_time: T, cache_age_s: r.headers.get('age'), picture: fact(pic), check: fact(chk), header_ok });\n", ""], ["    let ballast_ok = null;", "    evprobeSay({ ...base, ev: 'fetched', frame_time: T, cache_age_s: r.headers.get('age'), picture: fact(pic), check: fact(chk), header_ok });\n    let ballast_ok = null;"]],
  'header-gates-validation': ["    if (!pic.ok || !chk.ok) return done('fetch failed', { frame_time: T, header_ok });", "    if (!pic.ok || !chk.ok || !header_ok) return done('fetch failed', { frame_time: T, header_ok });"],
  'fourth-request': ["    const T = evLatest(xml); if (!T) return done('frame list: no time for this layer');", "    const T = evLatest(xml); if (!T) return done('frame list: no time for this layer'); try { await fetch(EARTHVIEW.CAP); } catch (_) {}"],
  'budget-ignored': ["    if (left() < 2 * EARTHVIEW.TIMEOUT_MS) return done('wall budget: not enough left for the pictures');", ""],
  'stale-build': ["/* ===== PART 2: phase1/evprobe.driver.js ===== */", "/* ===== PART 2: phase1/evprobe.driver.js ===== */\nconst EDITED_BY_HAND = 1;"],
};
const REPORT_BREAKS = {
  'report-missing-counts-as-pass': ["const c2 = failed.length ? 'not met' : seen.length < h.length ? 'incomplete' : 'met';", "const c2 = failed.length ? 'not met' : 'met';"],
  'report-checkpoint-any': ["upTo.some(r => r.completed_intact < r.planned) || !upTo.length ? 'incomplete' : 'met';", "'met';"],
  'report-refusal-ignored': ["refusals.some(r => !r.diagnosis) ? 'incomplete' :", ""],
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
function stub(o = {}) { const w = { reqs: [], lines: [], base: 'day', latest: '2026-11-19T11:00:00Z', warn: 'echo', picWarn: undefined, chkWarn: undefined, pic: null, capStatus: 200, capDelayMs: 0, ...o };
  globalThis.fetch = async (url, init) => { const u = String(url); w.reqs.push({ u, ua: init && init.headers && init.headers['User-Agent'] });
    if (!u.startsWith('https://view.eumetsat.int/')) throw new Error('unexpected fetch ' + u);
    if (/GetCapabilities/.test(u)) { if (w.capDelayMs) offset += w.capDelayMs; return new Response(caps(w.latest), { status: w.capStatus, headers: { 'content-type': 'text/xml', age: '12' } }); }
    const isPic = /image\/jpeg/.test(u), t = (u.match(/time=([^&]+)/) || [])[1], size = Number((u.match(/width=(\d+)/) || [])[1]);
    if (isPic && w.pic) return new Response(w.pic.body, { status: w.pic.status || 200, headers: { 'content-type': w.pic.type || 'image/jpeg', ...(w.pic.warn === null ? {} : { warning: `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` }) } });
    const wv = isPic ? (w.picWarn !== undefined ? w.picWarn : w.warn) : (w.chkWarn !== undefined ? w.chkWarn : w.warn), h = { 'content-type': isPic ? 'image/jpeg' : 'image/png' };
    if (wv !== null) h.warning = wv === 'echo' ? `99 Nearest value used: time=${t.replace('Z', '.000Z')} ISO8601 (mtg_fd:rgb_geocolour)` : wv;
    return new Response(isPic ? FILES[size](w.base) : FILES.png(w.base), { headers: h }); };
  const real = console.log; w.capture = async fn => { console.log = s => { try { w.lines.push(JSON.parse(s)); } catch (_) { w.lines.push({ raw: String(s) }); } }; try { return await fn(); } finally { console.log = real; } };
  w.run = (k, viaHandler = true) => { setNow(slotAt(k) + 2000); return w.capture(() => viaHandler ? M.default.scheduled({ scheduledTime: slotAt(k), cron: '*/10 * * * *' }, new Proxy({}, { get(_, p) { throw new Error('env was read: ' + String(p)); } }), { waitUntil() { } }) : P.evprobeRun(slotAt(k))); };
  return w; }
const evs = w => w.lines.map(l => l.ev).join(' ');
{ const w = stub(), k = kOf(s => s.phase === 1 && s.size === 2048); await w.run(k); const f = w.lines.find(l => l.ev === 'fetched'), v = w.lines.find(l => l.ev === 'validated'), d = w.lines.find(l => l.ev === 'done'), want = 'https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetMap&version=1.3.0&layers=mtg_fd:rgb_geocolour&styles=&crs=EPSG:900003&bbox=-5500000,-5500000,5500000,5500000';
  ok('C1 phase 1, 2048 px: the lines come in order, start first and the fetch facts before any decode', evs(w) === 'start fetched validate-begin validated done', evs(w));
  ok('C2 exactly three requests: the frame list, the collector\'s pinned picture request, the collector\'s check-image request; each with the hub\'s User-Agent', w.reqs.length === 3 && /GetCapabilities/.test(w.reqs[0].u) && w.reqs[1].u === want + '&width=2048&height=2048&format=image/jpeg&bgcolor=0x0B1016&time=2026-11-19T11:00:00Z' && w.reqs[2].u === want + '&width=256&height=256&format=image/png&transparent=true&time=2026-11-19T11:00:00Z' && w.reqs.every(r => /^mother-earth-collector\/0\.6\.20 /.test(r.ua)), w.reqs);
  ok('C3 the fetch line records, per response, the bytes, the hash, whether the header came and the time it named', f.frame_time === '2026-11-19T11:00:00Z' && f.header_ok === true && f.picture.bytes === 676253 && f.picture.sha256 === '781aa8a233090cac58f24a86052d4059e5634e608a0aa15c35edc6ad24275ed0' && f.picture.header_present === true && f.picture.header_names === '2026-11-19T11:00:00Z' && f.check.header_names === '2026-11-19T11:00:00Z', f);
  ok('C4 the validation line carries the outcome and every measure', v.ok === true && v.scans === 10 && v.progressive === true && v.agreement > 0.9 && v.surround_share_background === 1 && v.disk_brightness_spread > 12 && typeof v.wall_ms === 'number', v);
  ok('C5 the last line says validated; every line carries the slot, run, phase, size and isolate', d.outcome === 'validated' && d.header_ok === true && d.ballast_ok === null && w.lines.every(l => l.probe === 'evprobe' && l.k === k && l.phase === 1 && l.size === 2048 && /^[0-9a-f]{8}$/.test(l.isolate)), d);
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
{ // isolate bookkeeping
  const w = stub(), k = kOf(s => s.phase === 1 && s.size === 2048); await w.run(k); await w.run(k + 2); const s = w.lines.filter(l => l.ev === 'start');
  ok('C20 two runs in one isolate show as such; neither overlapped', s.length === 2 && s[1].isolate === s[0].isolate && s[1].isolate_run === s[0].isolate_run + 1 && s.every(x => x.overlapping === 0) && P.EVPROBE_ISOLATE.active === 0, s);
  const w2 = stub(); setNow(slotAt(k) + 2000); await w2.capture(() => Promise.all([P.evprobeRun(slotAt(k)), P.evprobeRun(slotAt(k + 2))])); const s2 = w2.lines.filter(l => l.ev === 'start');
  ok('C21 two runs at once are reported as overlapping', s2.map(x => x.overlapping).sort().join() === '0,1' && P.EVPROBE_ISOLATE.active === 0, s2); }

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
  const lines = w.lines, inv = PLAN.filter(s => !s.excluded).map(s => ({ scheduled: s.at, outcome: 'ok', cpu_ms: s.phase === 2 ? 2300 : 410, wall_ms: 3000 }));
  ok('E0 the simulated window: 70 runs, 210 requests, none on the excluded slots', lines.filter(l => l.ev === 'start').length === 70 && w.reqs.length === 210 && lines.filter(l => l.ev === 'excluded').length === 2, [lines.filter(l => l.ev === 'start').length, w.reqs.length]);
  const ev = (o = {}) => R.evaluate({ start: P.PROBE_START, lines: o.lines || lines, invocations: o.inv || inv, diagnoses: o.diagnoses || {} }, P.evprobePlan);
  const base = await ev();
  ok('E1 a complete, clean window: both sizes qualify on all five criteria; 2048 px goes forward; the note about the top rung is raised (a local run has no memory limit)', base.forward === '2048' && [2048, 1536].every(z => base.sizes[z].verdict === 'qualifies' && Object.values(base.sizes[z].criteria).every(c => c === 'met') && base.sizes[z].header.both_named_the_requested_time === 18 && base.sizes[z].ladder.every(r => r.planned === 2 && r.completed_intact === 2) && base.sizes[z].notes.some(n => /may not be counted/.test(n))) && base.runs_planned === 70 && base.requests_at_most === 210, base.sizes[2048]);
  ok('E2 coverage is counted from what was seen: three distinct frames per size', base.sizes[2048].coverage.distinct_frames === 3 && base.sizes[1536].coverage.distinct_frames === 3, base.sizes[2048].coverage);
  const died = (o, k, keep, outcome) => ({ lines: o.lines.filter(l => l.k !== k || keep.includes(l.ev)), inv: o.inv.map(i => i.scheduled === PLAN[k].at ? { ...i, outcome } : i) });
  const k96 = PLAN.filter(s => s.ballast_mib === 96 && s.size === 2048).map(s => s.k), k80 = PLAN.filter(s => s.ballast_mib === 80 && s.size === 2048).map(s => s.k), k48 = PLAN.filter(s => s.ballast_mib === 48 && s.size === 2048).map(s => s.k);
  let o = { lines, inv }; for (const k of [...k96, ...k80]) o = died(o, k, ['start', 'ballast', 'fetched', 'validate-begin'], 'exceededMemory');
  const top = await ev(o);
  ok('E3 runs at 80 and 96 MiB killed for memory while decoding: reported where they died; the checkpoint at 48 MiB is still met; no "not counted" note', top.sizes[2048].criteria[5] === 'met' && top.sizes[2048].verdict === 'qualifies' && top.sizes[2048].ladder.find(r => r.mib === 96).completed_intact === 0 && /decoding \(validation 1\) \(exceededMemory\)/.test(top.sizes[2048].ladder.find(r => r.mib === 80).died[0]) && !top.sizes[2048].notes.some(n => /may not be counted/.test(n)), top.sizes[2048].ladder);
  const at48 = await ev(died({ lines, inv }, k48[1], ['start'], 'exceededMemory'));
  ok('E4 ONE of the two runs at 48 MiB killed (taking the memory): the checkpoint is not met and 2048 px does not qualify; 1536 px goes forward', at48.sizes[2048].criteria[5] === 'not met' && at48.sizes[2048].verdict === 'does not qualify' && /taking the extra memory/.test(at48.sizes[2048].ladder.find(r => r.mib === 48).died[0]) && at48.forward === '1536', [at48.sizes[2048].ladder.find(r => r.mib === 48), at48.forward]);
  const kH = PLAN.find(s => s.phase === 1 && s.size === 2048 && s.k > 4).k, missed = await ev({ lines: lines.filter(l => l.k !== kH), inv: inv.filter(i => i.scheduled !== PLAN[kH].at) });
  ok('E5 a phase 1 slot that never ran: not a header failure and not a pass: the size is INCOMPLETE (17 of 18 observed)', missed.sizes[2048].criteria[2] === 'incomplete' && missed.sizes[2048].header.observed === 17 && missed.sizes[2048].header.failures.length === 0 && missed.sizes[2048].verdict === 'incomplete' && missed.sizes[2048].runs.phase1.not_run === 1 && missed.forward === '1536', [missed.sizes[2048].criteria, missed.sizes[2048].header, missed.forward]);
  const hdr = await ev({ lines: lines.map(l => l.k === kH && l.ev === 'fetched' ? { ...l, header_ok: false, check: { ...l.check, header_present: false, header_names: null } } : l) });
  ok('E6 one phase 1 run without the header on the check image: the criterion is NOT MET, with the pattern (which run, which response)', hdr.sizes[2048].criteria[2] === 'not met' && hdr.sizes[2048].header.both_named_the_requested_time === 17 && hdr.sizes[2048].header.failures.length === 1 && hdr.sizes[2048].header.failures[0].k === kH && hdr.sizes[2048].header.failures[0].check_present === false && hdr.sizes[2048].verdict === 'does not qualify', hdr.sizes[2048].header);
  const ref = lines.map(l => l.k === kH && l.ev === 'validated' ? { ...l, ok: false, reason: 'picture failed validation', detail: 'picture does not match the check image' } : l), r0 = await ev({ lines: ref }), ft = lines.find(l => l.k === kH && l.ev === 'fetched').frame_time;
  ok('E7 a refused frame with no diagnosis: the size cannot qualify yet (incomplete), and the refusal is listed with its frame', r0.sizes[2048].criteria[3] === 'incomplete' && r0.sizes[2048].refusals.length === 1 && r0.sizes[2048].refusals[0].frame_time === ft && r0.sizes[2048].verdict === 'incomplete', r0.sizes[2048].refusals);
  const ra = await ev({ lines: ref, diagnoses: { [ft + ' 2048']: 'a' } }), rb = await ev({ lines: ref, diagnoses: { [ft + ' 2048']: 'b' } }), rc = await ev({ lines: ref, diagnoses: { [ft + ' 2048']: 'c' } });
  ok('E8 diagnosed as a faulty picture: met. Diagnosed as a sound picture (refusal reproduces, or does not): NOT met', ra.sizes[2048].criteria[3] === 'met' && ra.sizes[2048].verdict === 'qualifies' && rb.sizes[2048].criteria[3] === 'not met' && rc.sizes[2048].criteria[3] === 'not met' && rc.sizes[2048].verdict === 'does not qualify', [ra.sizes[2048].criteria, rb.sizes[2048].criteria]);
  const cpu = await ev({ inv: inv.map(i => i.scheduled === PLAN[kH].at ? { ...i, cpu_ms: 5200 } : i) }), nocpu = await ev({ inv: inv.map(i => i.scheduled === PLAN[kH].at ? { ...i, cpu_ms: undefined } : i) });
  ok('E9 CPU is judged on the MAXIMUM single-validation run: one run at 5,200 ms fails it; a run with no CPU figure leaves it incomplete', cpu.sizes[2048].criteria[4] === 'not met' && cpu.sizes[2048].cpu.single_validation_max_ms === 5200 && nocpu.sizes[2048].criteria[4] === 'incomplete' && base.sizes[2048].cpu.single_validation_max_ms === 410 && base.sizes[2048].cpu.six_validations_max_ms === 2300, [cpu.sizes[2048].cpu, nocpu.sizes[2048].criteria]);
  const kP2 = PLAN.find(s => s.phase === 2 && s.size === 1536).k, oom2 = await ev({ lines: lines.filter(l => l.k !== kP2 || ['start', 'fetched', 'validate-begin'].includes(l.ev) || (l.ev === 'validated' && l.i < 4)), inv: inv.map(i => i.scheduled === PLAN[kP2].at ? { ...i, outcome: 'exceededMemory' } : i) });
  ok('E10 a phase 2 run killed for memory: criterion 1 not met for that size only, with where it died', oom2.sizes[1536].criteria[1] === 'not met' && oom2.sizes[1536].killed_in_phases_1_2.length === 1 && /exceededMemory/.test(oom2.sizes[1536].killed_in_phases_1_2[0].outcome) && oom2.sizes[2048].verdict === 'qualifies' && oom2.forward === '2048', oom2.sizes[1536].killed_in_phases_1_2);
  const none = await ev({ lines: [], inv: [] }); ok('E11 no observations at all: nothing is met and nothing is failed; the experiment is incomplete', none.forward === 'undecided: the experiment is incomplete' && Object.values(none.sizes[2048].criteria).every(c => c === 'incomplete'), none.sizes[2048].criteria);
  const noinv = await ev({ inv: [] }); ok('E12 probe lines without Cloudflare\'s invocation records: memory/CPU outcome and CPU time are incomplete, not assumed', noinv.sizes[2048].criteria[1] === 'incomplete' && noinv.sizes[2048].criteria[4] === 'incomplete' && noinv.sizes[2048].verdict === 'incomplete', noinv.sizes[2048].criteria); }
console.log(`\nevprobe${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
