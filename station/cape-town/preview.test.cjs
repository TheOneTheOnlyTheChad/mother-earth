/* Cape Town receiver preview — local suite. A fake receiver stands in for the Pi; the real preview.mjs and preview.html are run.
 * Run: NODE_PATH=/opt/npm-tools/node_modules node preview.test.cjs */
const { chromium } = require('playwright'); const http = require('http'); const { spawn } = require('child_process'); const path = require('path');
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log('FAIL  ' + n + (got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 500) : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let mode = 'live';
// Every entry states its message type, as readsb does (19 Nov rev 5: an entry with no type is no longer assumed to be an aircraft).
const ac = () => [
  { hex: 'aaa001', type: 'adsb_icao', flight: 'TEST101 ', alt_baro: 35000, gs: 450, track: 90, lat: -33.5, lon: 19.0, seen_pos: 0.4, seen: 0.2, r_dst: 40, r_dir: 45, rssi: -12.1 },
  { hex: 'aaa002', type: 'adsb_icao', flight: 'TEST202 ', alt_baro: 'ground', gs: 0, lat: -33.97, lon: 18.6, seen_pos: 1.0, seen: 0.5, r_dst: 6.8, r_dir: 95, rssi: -20 },
  { hex: 'aaa003', type: 'adsb_icao', r: 'ZS-TST', alt_baro: 2500, gs: 120, true_heading: 200, lat: -34.2, lon: 18.4, seen_pos: 20, seen: 1, r_dst: 15, r_dir: 190, rssi: -25 },      // position 20 s old: faded
  { hex: 'aaa004', type: 'adsb_icao', flight: 'OLDPOS  ', alt_baro: 9000, gs: 300, track: 10, lat: -33, lon: 18, seen_pos: 75, seen: 2, r_dst: 60, r_dir: 300, rssi: -27 },             // 75 s old: listed, not drawn
  { hex: 'aaa005', type: 'mode_s', flight: 'NOPOS   ', alt_baro: 31000, seen: 0.3, rssi: -28 },                                                                                      // no position
  { hex: 'aaa006', type: 'mlat', alt_baro: 12000, lat: -33.1, lon: 18.9, seen_pos: 0.2, seen: 0.2, rssi: -9 },                                                                     // position but no range/bearing, no heading
  { hex: 'aaa007', type: 'adsb_other', flight: 'NOHDG   ', lat: -33.3, lon: 18.2, seen_pos: 2, seen: 1, r_dst: 30, r_dir: 270, rssi: -15 },                                              // no heading, no altitude: dot
];
// Extra entries for the "what is an aircraft" cases (mixed = true). Types and categories as readsb documents them.
let mixed = false;
const extra = () => [
  { hex: 'bbb001', type: 'adsb_icao_nt', category: 'C2', flight: 'OPS12   ', alt_baro: 'ground', gs: 12, track: 80, lat: -33.97, lon: 18.61, seen_pos: 0.5, seen: 0.2, r_dst: 6.5, r_dir: 96, rssi: -18 },   // service vehicle
  { hex: 'bbb002', type: 'adsb_icao_nt', alt_baro: 'ground', gs: 5, lat: -33.97, lon: 18.62, seen_pos: 1.0, seen: 0.4, r_dst: 6.6, r_dir: 97, rssi: -19 },                                              // non-transponder, no category
  { hex: 'bbb003', type: 'adsb_icao', category: 'C3', lat: -33.9, lon: 18.5, seen_pos: 2, seen: 1, r_dst: 20, r_dir: 10, rssi: -22 },                                                                  // point obstacle sent by an ordinary type
  { hex: 'bbb004', type: 'adsb_icao_nt', category: 'C0', seen: 3, rssi: -30 },                                                                                                                         // non-transponder, "no information", no position
  { hex: 'bbb005', type: 'adsb_icao_nt', category: 'B1', flight: 'GLIDER1 ', alt_baro: 3000, gs: 60, track: 10, lat: -33.8, lon: 18.8, seen_pos: 1, seen: 0.5, r_dst: 20, r_dir: 120, rssi: -21 },     // glider: flies, counted as aircraft
  { hex: 'bbb007', type: 'adsb_icao', category: 'B3', flight: 'JUMP1   ', alt_baro: 9000, gs: 20, lat: -33.7, lon: 18.7, seen_pos: 1, seen: 0.5, r_dst: 22, r_dir: 60, rssi: -23 },                    // parachutist: not an aircraft
  { hex: 'bbb008', alt_baro: 20000, gs: 300, track: 45, lat: -33.6, lon: 18.9, seen_pos: 1, seen: 0.5, r_dst: 30, r_dir: 50, rssi: -24 },                                                             // no type, no category
  { hex: 'bbb009', type: 'other', alt_baro: 15000, lat: -33.5, lon: 18.3, seen_pos: 2, seen: 1, r_dst: 35, r_dir: 320, rssi: -26 },                                                                    // type documented as source unknown
  { hex: 'bbb006', type: 'adsb_icao', category: 'A3', flight: 'TAXI303 ', alt_baro: 'ground', gs: 8, track: 190, lat: -33.97, lon: 18.6, seen_pos: 0.6, seen: 0.3, r_dst: 7.0, r_dir: 94, rssi: -14 }, // airliner on the ground: an aircraft
];
let frozenNow = null, inPi = 0, maxInPi = 0, flip = 0, shift = 0;
const pi = http.createServer(async (req, res) => {
  inPi++; maxInPi = Math.max(maxInPi, inPi); res.on('close', () => { inPi--; });
  if (mode === 'hang') return;
  if (mode === 'slow') await sleep(3500);                                           // never answers
  if (mode === 'http500') { res.writeHead(500); return res.end('no'); }
  if (mode === 'garbage') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"hello":1}'); }
  const real = Date.now() / 1000;
  const now = mode === 'frozen' ? (frozenNow = frozenNow || real) : mode === 'frozen-old' ? (frozenNow = frozenNow || real - 120) : mode === 'old' ? real - 120
    : mode === 'behind45' ? real - 45 : mode === 'ahead45' ? real + 45 : mode === 'backwards' ? (flip++ % 2 ? Math.floor(real) - 20 : Math.floor(real)) : real - shift;
  res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ now, messages: 4311880, aircraft: mode === 'empty' ? [] : mixed ? [...ac(), ...extra()] : ac() }));
});
(async () => {
  await new Promise(r => pi.listen(18080, '127.0.0.1', r));
  const srv = spawn(process.execPath, [path.join(__dirname, 'preview.mjs')], { env: { ...process.env, PI_URL: 'http://127.0.0.1:18080/data/aircraft.json', PORT: '18787' } });
  await sleep(700);
  const browser = await chromium.launch(); const page = await browser.newPage();
  const S = () => page.evaluate(() => window.CT.state());
  const open = async q => { await page.goto('http://127.0.0.1:18787/' + q); await sleep(1200); };

  mode = 'live'; await open('');
  let s = await S();
  ok('live: state says live and counts the plotted aircraft', s.state === 'live' && /Receiver live — 4 aircraft plotted/.test(s.title), s);
  ok('live: four marks drawn (three arrows or dots in range, one dot without heading)', s.plotted === 4, s);
  ok('live: every aircraft with a position is listed (6 rows)', s.rows === 6, s);
  ok('live: no-position, too-old and no-range aircraft are counted, not drawn', /1 aircraft heard without a usable position/.test(s.nopos) && /1 with a position older than 60 s/.test(s.nopos) && /1 with a position but no distance/.test(s.nopos), s.nopos);
  const html = await page.content();
  ok('live: altitude, speed, heading and position age are shown', /10670 m/.test(html) && /833 km\/h/.test(html) && />90°</.test(html) && /on ground/.test(html) && /too old to plot/.test(html), null);
  ok('live: the faded aircraft is drawn at reduced opacity', /opacity="0.4"/.test(html));
  ok('live: no simulated banner', s.sim === null, s.sim);
  await sleep(17000); s = await S();
  ok('live: still live after more readings (data keeps changing)', s.state === 'live' && s.polls >= 5, s);

  // ---- what counts as an aircraft (19 Nov: the real feed carries adsb_icao_nt entries) ----
  mixed = true; mode = 'live'; await open(''); s = await S();
  ok('mixed feed: the title counts aircraft only (base 4 + glider + grounded airliner = 6 plotted)', s.state === 'live' && /Receiver live — 6 aircraft plotted/.test(s.title) && s.plotted === 6, s);
  ok('mixed feed: the aircraft table lists aircraft only (base 6 + 2)', s.rows === 8, s.rows);
  ok('mixed feed: seven other emitters are listed apart, each with what it is and the evidence', s.others.length === 7 && s.others.some(r => r[0] === 'JUMP1' && r[1] === 'Parachutist or skydiver' && r[2] === 'category B3') && s.others.some(r => r[0] === 'bbb008' && /carries no message type/.test(r[1]) && r[2] === 'no message type sent; no category sent') && s.others.some(r => r[0] === 'bbb009' && /does not say what sent it/.test(r[1]) && r[2] === 'type other; no category sent') && s.others.some(r => r[0] === 'OPS12' && /Surface vehicle: service vehicle/.test(r[1]) && r[2] === 'category C2')
    && s.others.some(r => r[0] === 'bbb003' && /Point obstacle/.test(r[1]) && r[2] === 'category C3') && s.others.some(r => r[0] === 'bbb002' && /Kind not stated/.test(r[1]) && r[2] === 'type adsb_icao_nt; no category sent')
    && s.others.some(r => r[0] === 'bbb004' && /Kind not stated/.test(r[1]) && r[2] === 'type adsb_icao_nt; category C0 (no information)' && r[4] === 'no position'), s.others);
  ok('mixed feed: the count line gives entries, aircraft, type-only, not aircraft and kind not stated', s.classnote === '16 entries in this reading: 9 counted as aircraft (7 of them on message type alone, with no usable emitter category); 3 not aircraft by emitter category; 4 of a kind not stated.', s.classnote);
  ok('mixed feed: "without a usable position" counts aircraft only (the position-less non-transponder entry is not in it)', /^1 aircraft heard without a usable position/.test(s.nopos), s.nopos);
  { const h = await page.content(), plotTxt = await page.evaluate(() => [...document.querySelectorAll('#plot text.lab')].map(t => t.textContent)), rowTxt = await page.evaluate(() => document.getElementById('rows').textContent);
    ok('mixed feed: no vehicle, obstacle or unstated emitter is drawn on the plot or listed with the aircraft', !plotTxt.some(t => /OPS12|JUMP1|bbb00[23489]/.test(t)) && !/OPS12|JUMP1|bbb00[23489]/.test(rowTxt), [plotTxt, rowTxt.slice(0, 200)]);
    ok('mixed feed: the grounded airliner and the glider are drawn and listed as aircraft', plotTxt.includes('TAXI303') && plotTxt.includes('GLIDER1') && /TAXI303/.test(rowTxt) && /on ground/.test(rowTxt), plotTxt);
    ok('mixed feed: the explanation names the aircraft categories without B3 or B5, and the type list', /A1 to A7, B1, B2, B4, B6 and B7 are aircraft/.test(h) && /B3 is a parachutist or skydiver/.test(h) && /B5, C6, C7 and D1 to D7 are reserved/.test(h) && !/B1 to B7/.test(h) && /<code>adsb_icao<\/code>, <code>adsb_other<\/code>, <code>mode_s<\/code>/.test(h));
    ok('mixed feed: the page explains the sorting and does not guess about the unstated kind', /could be a vehicle or an aircraft/.test(h) && /kept out of the aircraft count and the plot/.test(h)); }
  await open('?range=40'); s = await S();
  ok('mixed feed at 40 km: still aircraft only on the plot', /aircraft plotted/.test(s.title) && s.others.length === 7 && !(await page.evaluate(() => [...document.querySelectorAll('#plot text.lab')].map(t => t.textContent))).some(t => /OPS12|JUMP1|bbb00[23489]/.test(t)), s.title);
  await open('?sim=zero'); s = await S();
  ok('mixed feed, sim=zero: 9 aircraft heard, none plotted; the others stay listed without positions', /9 aircraft heard/.test(s.whyText) && s.plotted === 0 && s.others.length === 7 && s.others.every(r => r[4] === 'no position'), [s.whyText, s.others]);
  { const c = await page.evaluate(() => { const k = a => { const r = window.CT.classify(a); return r.cls + (r.by ? ':' + r.by : ''); }; return {
      nt_none: k({ type: 'adsb_icao_nt' }), nt_a0: k({ type: 'adsb_icao_nt', category: 'A0' }), nt_c1: k({ type: 'adsb_icao_nt', category: 'C1' }), nt_a1: k({ type: 'adsb_icao_nt', category: 'A1' }), nt_b6: k({ type: 'adsb_icao_nt', category: 'b6 ' }),
      nt_c6: k({ type: 'adsb_icao_nt', category: 'C6' }), nt_junk: k({ type: 'adsb_icao_nt', category: 'ZZ' }), nt_num: k({ type: 'adsb_icao_nt', category: 7 }),
      icao_none: k({ type: 'adsb_icao' }), other_t: k({ type: 'other' }), junk_t: k({ type: 'weird_new_type' }), num_t: k({ type: 5 }), adsr: k({ type: 'adsr_icao' }), tisb_i: k({ type: 'tisb_icao' }), mlat: k({ type: 'mlat' }), adsc: k({ type: 'adsc' }), adsb_o: k({ type: 'adsb_other' }), modes_ground: k({ type: 'mode_s', alt_baro: 'ground' }),
      b3_icao: k({ type: 'adsb_icao', category: 'B3' }), b3_nt: k({ type: 'adsb_icao_nt', category: 'B3' }), b3_none: k({ category: 'B3' }), b2: k({ type: 'adsb_icao', category: 'B2' }), b5_icao: k({ type: 'adsb_icao', category: 'B5' }), b5_nt: k({ type: 'adsb_icao_nt', category: 'B5' }), b5_none: k({ category: 'B5' }), a1_notype: k({ category: 'A1' }),
      labels: [window.CT.classify({ category: 'B3' }), window.CT.classify({ type: 'weird_new_type' }), window.CT.classify({}), window.CT.classify({ type: 'tisb_icao', category: 'A0' })].map(r => r.kind + ' | ' + r.basis), icao_c2: k({ type: 'adsb_icao', category: 'C2' }), icao_c5: k({ type: 'mlat', category: 'C5' }), modes: k({ type: 'mode_s' }), notype: k({}), notype_ground: k({ alt_baro: 'ground' }),
      nt_air_high: k({ type: 'adsb_icao_nt', alt_baro: 3000, gs: 120 }), tisb: k({ type: 'tisb_trackfile' }), a7_ground: k({ type: 'adsb_icao', category: 'A7', alt_baro: 'ground' }) }; });
    ok('classify: non-transponder type with no, empty-of-information, reserved, unknown or non-text category is "kind not stated"', ['nt_none', 'nt_a0', 'nt_c6', 'nt_junk', 'nt_num'].every(x => c[x] === 'unknown'), c);
    ok('classify: categories C1, C2, C5 are not aircraft whatever the type', c.nt_c1 === 'other' && c.icao_c2 === 'other' && c.icao_c5 === 'other', c);
    ok('classify: an A or B category makes it an aircraft even on the non-transponder type (case and spaces ignored)', c.nt_a1 === 'aircraft:category' && c.nt_b6 === 'aircraft:category', c);
    ok('classify: with no category, exactly the listed types are aircraft on type alone (adsb_icao, adsb_other, mode_s, mlat, adsc)', ['icao_none', 'adsb_o', 'modes', 'mlat', 'adsc'].every(x => c[x] === 'aircraft:type'), c);
    ok('classify: a Mode S aircraft without a category stays an aircraft, on the ground too', c.modes === 'aircraft:type' && c.modes_ground === 'aircraft:type', c);
    ok('classify: no type, a non-text type, an undocumented type, type "other", and the rebroadcast and traffic-service types are "kind not stated" without a category', ['notype', 'notype_ground', 'num_t', 'junk_t', 'other_t', 'adsr', 'tisb', 'tisb_i'].every(x => c[x] === 'unknown'), c);
    ok('classify: B3 (parachutist or skydiver) is an other emitter on any type or none, with its own label', c.b3_icao === 'other' && c.b3_nt === 'other' && c.b3_none === 'other' && c.labels[0] === 'Parachutist or skydiver | category B3', c);
    ok('classify: B2 stays an aircraft; reserved B5 is not a usable category (falls to the type: transponder type aircraft, otherwise not stated)', c.b2 === 'aircraft:category' && c.b5_icao === 'aircraft:type' && c.b5_nt === 'unknown' && c.b5_none === 'unknown', c);
    ok('classify: a usable A category makes an aircraft even with no type', c.a1_notype === 'aircraft:category', c);
    ok('classify: the evidence text names what was and was not sent', c.labels[1] === 'Kind not stated: the message type is not one readsb documents | type weird_new_type (not a documented value); no category sent' && c.labels[2] === 'Kind not stated: the entry carries no message type | no message type sent; no category sent' && c.labels[3] === 'Kind not stated: this message type does not say what sent it | type tisb_icao; category A0 (no information)', c.labels);
    ok('classify: "on the ground" never changes the class (grounded aircraft stay aircraft)', c.a7_ground === 'aircraft:category' && c.modes_ground === 'aircraft:type', c);
    ok('classify: nothing is inferred from altitude or speed (a moving, high non-transponder entry with no category stays unstated)', c.nt_air_high === 'unknown', c); }
  { // control: the reviewed page before this change (d540c5d) counts and draws the same vehicles as aircraft
    const { execFileSync } = require('child_process'), fs = require('fs'), os = require('os'); const old = fs.mkdtempSync(path.join(os.tmpdir(), 'ct-old-'));
    for (const f of ['preview.mjs', 'preview.html']) fs.writeFileSync(path.join(old, f), execFileSync('git', ['show', 'd540c5d:station/cape-town/' + f], { cwd: __dirname, maxBuffer: 1 << 24 }));
    const so = spawn(process.execPath, [path.join(old, 'preview.mjs')], { env: { ...process.env, PI_URL: 'http://127.0.0.1:18080/data/aircraft.json', PORT: '18789' } }); await sleep(700);
    const p2 = await browser.newPage(); await p2.goto('http://127.0.0.1:18789/'); await sleep(1200); const o = await p2.evaluate(() => window.CT.state());
    ok('control (old page, same feed): 12 "aircraft" plotted, the vehicles, the obstacle, the parachutist and the unstated entries among them', /Receiver live — 12 aircraft plotted/.test(o.title) && o.plotted === 12, o.title);
    await p2.close(); so.kill(); fs.rmSync(old, { recursive: true, force: true }); }
  mixed = false;

  mode = 'empty'; await open(''); s = await S();
  ok('fresh feed, nothing heard: live, zero plotted, says so', s.state === 'live' && /no aircraft with a usable position right now/.test(s.title) && s.plotted === 0 && /0 aircraft heard/.test(s.whyText), s);
  mode = 'live'; await open('?sim=zero'); s = await S();
  ok('sim=zero: fresh feed with zero plottable aircraft is its own state', s.state === 'live' && /no aircraft with a usable position right now/.test(s.title) && s.plotted === 0 && /7 aircraft heard/.test(s.whyText) && /7 aircraft heard without a usable position/.test(s.nopos), s);
  ok('sim=zero: the banner says it is simulated', /SIMULATED TEST STATE/.test(s.sim || ''), s.sim);

  await open('?sim=stale'); s = await S();
  ok('sim=stale: live at first (one reading cannot show staleness)', s.state === 'live', s);
  await sleep(13000); s = await S();
  ok('sim=stale: becomes stale when the data stops changing; nothing drawn', s.state === 'stale' && /Receiver data is stale/.test(s.title) && s.plotted === 0 && /has not changed/.test(s.whyText), s);
  // --- clock difference versus stale data (GPT's review of rev 1)
  mode = 'behind45'; await open(''); s = await S();
  ok('receiver clock 45 s behind, first reading: not called live or stale yet; nothing drawn', s.state === 'checking' && s.plotted === 0 && /either old data or a clock difference/.test(s.whyText), s);
  await sleep(4000); s = await S();
  ok('receiver clock 45 s behind, data changing: live, with the clock difference stated', s.state === 'live' && s.plotted === 4 && /about 45 s behind this Mac/.test(s.whyText), s);
  mode = 'ahead45'; await open(''); await sleep(4000); s = await S();
  ok('receiver clock 45 s ahead, data changing: live, with the clock difference stated', s.state === 'live' && s.plotted === 4 && /about 45 s ahead of this Mac/.test(s.whyText), s);
  mode = 'old'; await open(''); await sleep(4000); s = await S();
  ok('receiver clock 2 min behind but moving: live with the clock note, not stale', s.state === 'live' && /2 min behind/.test(s.whyText), s);
  frozenNow = null; mode = 'frozen-old'; await open(''); s = await S();
  ok('old and not moving, first reading: checking', s.state === 'checking' && s.plotted === 0, s);
  await sleep(13000); s = await S();
  ok('old and not moving: stale; nothing drawn', s.state === 'stale' && /has not changed/.test(s.whyText) && s.plotted === 0, s);
  mode = 'live'; await open(''); s = await S();
  ok('clocks agree: live with no clock note', s.state === 'live' && s.whyText === '', s);
  // --- a reading expires on its own after 30 s without a fresh one
  await open(''); await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }));   // polls stop, the page keeps running
  await sleep(3500); const p0 = (await S()).polls; await sleep(24000); s = await S();
  ok('no poll for under 30 s: still live', s.state === 'live' && s.polls === p0, s);
  await sleep(9000); s = await S();
  ok('no poll for over 30 s: no longer live; nothing drawn', s.state === 'expired' && /No fresh reading/.test(s.title) && s.plotted === 0 && s.polls === p0 && /Nothing is drawn until a fresh reading arrives/.test(s.whyText), s);
  await page.evaluate(() => { delete document.hidden; }); await sleep(4000); s = await S();
  ok('polls resume: live again', s.state === 'live' && s.plotted === 4, s);
  // --- one poll in flight; answers cannot arrive out of order
  mode = 'slow'; maxInPi = 0; await open(''); await sleep(15000); s = await S();
  ok('slow receiver (3.5 s per answer, polls every 3 s): polls are skipped while one is waiting', s.skipped >= 2 && s.state === 'live', s);
  ok('never more than one request to the receiver at a time', maxInPi === 1, maxInPi);
  mode = 'backwards'; flip = 0; await open(''); const seen = []; for (let i = 0; i < 6; i++) { await sleep(3000); seen.push((await S()).lastNow); }
  ok('a reading older than the one held is ignored (receiver time never goes backwards on the page)', seen.every((v, i) => i === 0 || v >= seen[i - 1]), seen);
  // --- GPT's review of rev 2: the 30 s limit runs from the last reading that MOVED FORWARD, not from the last answer
  // The same answer is replayed byte for byte (same receiver time, same fetch time), so neither the frozen-clock rule (switched
  // off here) nor the falling-behind rule can act: only the expiry rule is left.
  mode = 'live'; await open(''); await page.evaluate(() => { window.CT.cfg.FROZEN_POLLS = 9999; });
  let replay = null; await page.route('**/aircraft.json*', async route => { if (!replay) { const r = await route.fetch(); replay = await r.text(); } await route.fulfill({ status: 200, contentType: 'application/json', body: replay }); });
  await sleep(24000); s = await S();
  ok('receiver repeating one reading for under 30 s: still live', s.state === 'live' && s.movedAgo > 15, s);
  await sleep(11000); s = await S();
  ok('receiver repeating one reading for over 30 s: no longer live although answers keep arriving', s.state === 'expired' && s.polled === 'live' && s.plotted === 0 && s.polls > 8 && s.movedAgo > 30 && /last moved forward/.test(s.whyText), s);
  await page.unroute('**/aircraft.json*'); await sleep(4000); s = await S();
  ok('receiver moves forward again: live', s.state === 'live' && s.plotted === 4 && s.movedAgo < 5, s);
  // --- a receiver clock that steps backwards is followed once a second reading confirms it
  shift = 0; mode = 'live'; await open(''); await sleep(3500); const before = (await S()).lastNow;
  shift = 300; await sleep(3200); s = await S();
  ok('receiver clock steps back 5 min, first older reading: not yet followed', s.lastNow === before || s.lastNow > before - 100, s);
  await sleep(3500); s = await S();
  ok('second older reading that has moved forward: the page follows the new clock and is live', s.state === 'live' && s.plotted === 4 && s.lastNow < before - 250 && s.clockReset && Math.abs(s.clockReset.by - 300) < 15 && /clock moved back by about 5 min/.test(s.whyText), s);
  await sleep(7000); s = await S();
  ok('and stays live on the new clock', s.state === 'live' && s.movedAgo < 5, s);
  shift = 0; await sleep(4000); s = await S();
  ok('clock jumps forward again: simply newer, still live', s.state === 'live' && s.plotted === 4, s);
  frozenNow = null; mode = 'frozen-old'; await sleep(16000); s = await S();
  ok('clock goes back and does NOT move: stale, not followed', s.state === 'stale' && /went back/.test(s.whyText) && s.plotted === 0, s);
  mode = 'live'; shift = 0;
  // --- range controls
  mode = 'live'; await open(''); s = await S();
  ok('range: 320 km by default, four rings', s.range === 320 && s.rings.join() === '50 km,100 km,200 km,300 km' && s.plotted === 4, s);
  await page.click('#ranges button[data-km="40"]'); s = await S();
  ok('range 40 km: rings 10 to 40; aircraft beyond it are listed and counted, not drawn', s.range === 40 && s.rings.join() === '10 km,20 km,30 km,40 km' && s.plotted === 2 && /2 beyond the 40 km range/.test(s.nopos) && s.rows === 6, s);
  ok('range 40 km: the pressed button is marked', await page.getAttribute('#ranges button[data-km="40"]', 'aria-pressed') === 'true' && await page.getAttribute('#ranges button[data-km="320"]', 'aria-pressed') === 'false');
  await page.click('#ranges button[data-km="100"]'); s = await S();
  ok('range 100 km: rings 25 to 100; all four in range', s.range === 100 && s.rings.join() === '25 km,50 km,75 km,100 km' && s.plotted === 4, s);
  await open('?range=40'); s = await S();
  ok('?range=40 opens at 40 km', s.range === 40 && s.plotted === 2, s);
  mode = 'empty'; await open('?range=40'); s = await S();
  ok('range 40 km, nothing heard: still the fresh-and-empty state', s.state === 'live' && /no aircraft with a usable position right now/.test(s.title), s);
  frozenNow = null; mode = 'frozen'; await open(''); await sleep(13000); s = await S();
  ok('receiver frozen for real: stale; nothing drawn', s.state === 'stale' && s.plotted === 0, s);

  mode = 'live'; await open('?sim=down'); s = await S();
  ok('sim=down: unreachable; nothing drawn; no rows', s.state === 'unreachable' && /Receiver unreachable/.test(s.title) && s.plotted === 0 && /No aircraft with a position to list/.test(await page.content()), s);
  mode = 'http500'; await open(''); s = await S();
  ok('receiver answers HTTP 500: unreachable', s.state === 'unreachable' && /HTTP 500/.test(s.whyText), s);
  mode = 'garbage'; await open(''); s = await S();
  ok('receiver answers with something else: unreachable, says why', s.state === 'unreachable' && /not with aircraft JSON/.test(s.whyText), s);
  mode = 'hang'; await page.goto('http://127.0.0.1:18787/'); await sleep(5500); s = await S();
  ok('receiver does not answer: unreachable after the 4 s limit', s.state === 'unreachable' && /no answer from the receiver within 4 s/.test(s.whyText), s);
  mode = 'live'; await sleep(4000); s = await S();
  ok('recovers to live when the receiver answers again', s.state === 'live' && s.plotted === 4, s);
  mode = 'http500'; await sleep(3500); s = await S();
  ok('live then unreachable: the old aircraft are cleared, not left on screen', s.state === 'unreachable' && s.plotted === 0, s);
  srv.kill(); await sleep(3500); s = await S();
  ok('helper stopped: unreachable, and says the helper is not running', s.state === 'unreachable' && /preview\.mjs/.test(s.whyText), s);

  // the helper listens on this machine only and answers nothing but its two routes
  const srv2 = spawn(process.execPath, [path.join(__dirname, 'preview.mjs')], { env: { ...process.env, PI_URL: 'http://127.0.0.1:18080/data/aircraft.json', PORT: '18788' } }); await sleep(700);
  const os = require('os'); const ext = Object.values(os.networkInterfaces()).flat().find(i => i && i.family === 'IPv4' && !i.internal);
  if (ext) { let reached = false; try { await fetch(`http://${ext.address}:18788/`, { signal: AbortSignal.timeout(1500) }); reached = true; } catch (_) {} ok('the helper is not reachable on the network address, only on localhost', reached === false, ext.address); } else pass++;
  const r404 = await fetch('http://127.0.0.1:18788/data/aircraft.json'); const rpost = await fetch('http://127.0.0.1:18788/aircraft.json', { method: 'POST' });
  ok('unknown path 404; POST refused', r404.status === 404 && rpost.status === 405, [r404.status, rpost.status]);
  srv2.kill(); await browser.close(); pi.close();
  console.log(`\ncape-town-preview: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
