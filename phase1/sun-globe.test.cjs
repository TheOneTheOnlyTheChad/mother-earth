/* Sun globe (sun.html, sunglobe.js) — real globe.gl 2.45.0 under SwiftShader; the hub's sunface routes are answered by this test.
 *  A. projection: a synthetic "SDO" picture is painted here, by this file's OWN forward formula, with coloured spots at known
 *     heliographic places for a date with a known tilt (B0); the globe must show each spot where it says it is looking
 *  B. mask: limb band, sky, corner caption and the far side never come from the picture
 *  C. disc fit; pictures with no clean disc are refused
 *  D. words about time (never "observed")
 *  E. the three-hour age limit: in an open tab, with the hub silent, on resume, just before and exactly at the cutoff; clock offset
 *  F. replacement rules: a bad or older replacement never displaces a valid picture
 *  G. controls, zoom, failure states, no request to SDO
 * Run: node phase1/sun-globe.test.cjs [base-url]
 * BREAK=mirror|no-b0|flip|no-mask|no-limb|age-late|no-timer|no-resume|no-offset|step-back|bad-displaces|limit-raised|future-ok|observed must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8899'; const BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..');
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAKS = {
  mirror: ["const x = cl * Math.sin(lon), y = sl * cb - cl * co * sb;", "const x = -cl * Math.sin(lon), y = sl * cb - cl * co * sb;"],
  'no-b0': ["    const b0 = sunB0(Date.parse(im.file_updated));", "    const b0 = 0;"],
  flip: ["py = Math.round(g.cy - g.R * y);", "py = Math.round(g.cy + g.R * y);"],
  'no-mask': ["if (x * x + y * y <= MASK_RHO * MASK_RHO) {", "if (true) {"],
  'no-limb': ["MASK_RHO = 0.97,", "MASK_RHO = 1.2,"],
  'age-late': ["ageS(im) >= -60 && ageS(im) < limitS;", "ageS(im) >= -60 && ageS(im) <= limitS + 30;"],
  'no-timer': ["  setInterval(tick, TICK_MS);", ""],
  'no-resume': ["  for (const ev of ['visibilitychange', 'pageshow', 'focus']) addEventListener(ev, () => { if (document.visibilityState !== 'hidden') tick(); });\n  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') tick(); });", ""],
  'no-offset': ["offset = Date.parse(m.now) - Date.now();", "offset = 0;"],
  'step-back': ["        if (shown && Date.parse(im.file_updated) <= Date.parse(shown.image.file_updated)) break;   // never step back to an older picture\n", ""],
  'bad-displaces': ["        catch (e) { if (!shown) note =", "        catch (e) { shown = null; if (!shown) note ="],
  'limit-raised': ["m.age_limit_s > 0 && m.age_limit_s <= 10800) limitS", "m.age_limit_s > 0) limitS"],
  'future-ok': ["ageS(im) >= -60 && ageS(im) < limitS;", "ageS(im) < limitS;"],
  observed: ["`File updated at ${utc(", "`Observed at ${utc("],
};
if (BREAK && !(BREAK in BREAKS)) { console.log('FAIL unknown break ' + BREAK); process.exit(1); }
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 400) : ''); } };
const near = (a, b, tol = 45) => a.every((v, k) => Math.abs(v - b[k]) <= tol);
const iso = ms => new Date(ms).toISOString().replace('.000Z', 'Z');
// Two dates with a tilt known from almanacs (not from the code under test): 8 Sep 2026 → B0 = +7.25°; 6 Jun 2026 → B0 ≈ 0°.
const SEP = Date.UTC(2026, 8, 8, 11, 0, 0), JUN = Date.UTC(2026, 5, 6, 11, 0, 0), B0_SEP = 7.25, B0_JUN = 0;
const SPOTS = [['red', 0, 0, [255, 0, 0]], ['green', 30, 40, [0, 255, 0]], ['blue', -20, -50, [0, 0, 255]], ['magenta', 60, 10, [255, 0, 255]], ['cyanish', -45, 25, [0, 200, 255]]];
const PLAINS = [[38, 43, 51], [58, 64, 74]], isPlain = c => PLAINS.some(p => near(c, p, 10));

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  /** A picture like SDO's, painted in a page by this file's own formula. opt: b0, cx, cy, R, spots, corners (bright blocks + caption outside the disc), kind */
  const paint = (p, opt) => p.evaluate(o => {
    const W = 1024, c = document.createElement('canvas'); c.width = W; c.height = W; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, W);
    const cx = o.cx ?? 512, cy = o.cy ?? 512, R = o.R ?? 480, D = Math.PI / 180;
    if (o.kind === 'black') return c.toDataURL('image/png').split(',')[1];
    if (o.kind === 'square') { g.fillStyle = '#f80'; g.fillRect(100, 100, 824, 824); return c.toDataURL('image/png').split(',')[1]; }
    g.fillStyle = 'rgb(255,150,40)'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    for (const [, lat, lon, rgb] of o.spots || []) {   // forward projection, written here independently of sunglobe.js
      const x = Math.cos(lat * D) * Math.sin(lon * D), y = Math.sin(lat * D) * Math.cos(o.b0 * D) - Math.cos(lat * D) * Math.cos(lon * D) * Math.sin(o.b0 * D);
      g.fillStyle = `rgb(${rgb})`; g.beginPath(); g.arc(cx + R * x, cy - R * y, 13, 0, 7); g.fill(); }
    if (o.centreDot) { g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 13, 0, 7); g.fill(); }
    if (o.corners) { g.fillStyle = 'rgb(128,255,128)'; for (const [x, y] of [[0, 0], [W - 110, 0], [0, W - 110], [W - 110, W - 110]]) g.fillRect(x, y, 110, 110); g.font = '14px monospace'; g.fillText('SDO/HMI Quick-Look Continuum: 20260908_103000', 4, W - 6);
      g.strokeStyle = 'rgb(128,255,128)'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R - 4, 0, 7); g.stroke(); }   // a bright ring just inside the limb: must fall in the masked band
    return c.toDataURL('image/png').split(',')[1];
  }, opt);
  const mk = async (opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: opt.w || 1000, height: 900 }, reducedMotion: 'reduce' });
    const reqs = []; ctx.on('request', r => reqs.push(r.url()));
    await ctx.route(/fonts\.googleapis/, r => r.abort());
    await ctx.route('**/unpkg.com/globe.gl**', async r => { if (opt.noLib) return r.abort(); if (opt.stall) await new Promise(res => setTimeout(res, opt.stall)); r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }).catch(() => {}); });
    await ctx.route('**/sunglobe.js*', r => { let s = fs.readFileSync(path.join(ROOT, 'sunglobe.js'), 'utf8'); if (BREAK) { const [a, c] = BREAKS[BREAK]; if (!s.includes(a)) { console.log('FAIL break did not apply: ' + BREAK); process.exit(1); } s = s.replace(a, c); } r.fulfill({ status: 200, contentType: 'application/javascript', body: s }); });
    const hub = { meta: null, metaStatus: 200, images: {}, hits: { meta: 0, img: 0 }, down: false, skewMs: 0 };   // skewMs = device clock − hub clock
    let page = null;
    await ctx.route(/workers\.dev/, async r => { const u = new URL(r.request().url());
      if (hub.down) return r.abort();
      if (u.pathname === '/snapshot/sunface/meta') { hub.hits.meta++; if (hub.metaStatus !== 200) return r.fulfill({ status: hub.metaStatus, body: 'no' }); const hubNow = (await page.evaluate(() => Date.now())) - hub.skewMs; const m = typeof hub.meta === 'function' ? hub.meta(hubNow) : hub.meta; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(m) }); }
      const mm = /^\/snapshot\/sunface\/([^/]+)\/sun\.jpg$/.exec(u.pathname);
      if (mm) { hub.hits.img++; const im = hub.images[mm[1]]; if (!im) return r.fulfill({ status: 404, body: 'no', headers: { 'access-control-allow-origin': '*' } }); return r.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: Buffer.from(im, 'base64') }); }
      return r.abort(); });
    const p = await ctx.newPage(); page = p;
    if (opt.clock !== undefined) await p.clock.install({ time: new Date(opt.clock) });
    return { ctx, p, hub, reqs };
  };
  const img = (id, fileMs, extra = {}) => ({ id, file: 'sun.jpg', path: `/snapshot/sunface/${id}/sun.jpg`, type: 'image/jpeg', bytes: 1, sha256: 'x', w: 1024, h: 1024, observed_at: null, file_updated: iso(fileMs), retrieved_at: iso(fileMs + 8 * 60000), ...extra });
  const meta = (hubNowMs, image, previous = null, extra = {}) => ({ schema: 1, layer: 'sunface', image, previous, last_checked: iso(hubNowMs), last_attempt: null, age_limit_s: 10800, now: iso(hubNowMs), ...extra });
  const open = async (o, sel = '#sg-globe[data-ready="1"]') => { await o.p.goto(BASE + '/sun.html', { waitUntil: 'domcontentloaded' }); await o.p.waitForSelector(sel, { timeout: 25000 }).catch(() => {}); };
  const upWith = async (o, id) => { await o.p.waitForFunction(i => document.getElementById('sg-globe').dataset.image === i, id, { timeout: 25000 }).catch(() => {}); await o.p.waitForTimeout(900); };
  const centre = async p => { const sh = await p.locator('#sg-globe').screenshot(); return p.evaluate(async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(c.width / 2 - 3, c.height / 2 - 3, 6, 6).data; let s = [0, 0, 0]; for (let k = 0; k < d.length; k += 4) { s[0] += d[k]; s[1] += d[k + 1]; s[2] += d[k + 2]; } return s.map(v => Math.round(v / 36)); }, sh.toString('base64')); };
  const count = async (p, rgb, tol = 40) => { const sh = await p.locator('#sg-globe').screenshot(); return p.evaluate(async ({ b64, rgb, tol }) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 0; k < d.length; k += 4) if (Math.abs(d[k] - rgb[0]) <= tol && Math.abs(d[k + 1] - rgb[1]) <= tol && Math.abs(d[k + 2] - rgb[2]) <= tol) n++; return n; }, { b64: sh.toString('base64'), rgb, tol }); };
  const point = async (p, lat, lng) => { await p.evaluate(([a, c]) => SunGlobe.point(a, c), [lat, lng]); await p.waitForTimeout(450); };
  const T = sel => o => o.p.textContent(sel);

  // ---------- A. projection, for a tilted date and an untilted one
  for (const [name, date, b0] of [['8 Sep 2026 (B0 +7.25°)', SEP, B0_SEP], ['6 Jun 2026 (B0 0°)', JUN, B0_JUN]]) {
    const o = await mk({ clock: date + 3600000 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0, spots: b0 ? SPOTS : SPOTS.slice(1), centreDot: true }); o.hub.meta = n => meta(n, img('A', date));
    await open(o); await upWith(o, 'A');
    const s = await o.p.evaluate(() => SunGlobe.shown());
    ok(`A ${name}: picture is up`, !!s && s.id === 'A', s);
    ok(`A ${name}: tilt computed for the file's date matches the almanac value within 0.1°`, s && Math.abs(s.b0 - b0) < 0.1, s && s.b0);
    ok(`A ${name}: disc located within 1 px (centre 512, 512; radius 480)`, s && Math.abs(s.geom.cx - 512) < 1 && Math.abs(s.geom.cy - 512) < 1 && Math.abs(s.geom.R - 480) < 1 && s.geom.rms < 1, s && s.geom);
    const v0 = await o.p.evaluate(() => SunGlobe.view());
    ok(`A ${name}: opens on the Earth-facing centre (lat = B0, lon 0)`, Math.abs(v0.lat - b0) < 0.1 && Math.abs(v0.lng) < 0.01, v0);
    await o.p.waitForTimeout(800); const c0 = await centre(o.p); ok(`A ${name}: the centre of the picture is at the centre of the opening view`, near(c0, [255, 255, 255]), c0);
    for (const [n, lat, lon, rgb] of (b0 ? SPOTS : SPOTS.slice(1))) { await point(o.p, lat, lon); const c = await centre(o.p); ok(`A ${name}: spot at ${lat}°, ${lon}° (${n}) is where the view says`, near(c, rgb), c); }
    await point(o.p, 10, 15); ok(`A ${name}: between spots the surface is the picture's orange`, near(await centre(o.p), [255, 150, 40]), await centre(o.p));
    ok(`A ${name}: ambient light only`, JSON.stringify(await o.p.evaluate(() => SunGlobe.lights())) === '["AmbientLight"]');
    await o.ctx.close(); }

  // ---------- B. mask
  { const o = await mk({ clock: SEP + 3600000 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS, corners: true }); o.hub.meta = n => meta(n, img('A', SEP));
    await open(o); await upWith(o, 'A');
    ok('B a picture with bright corners, a caption and a bright ring at the limb is still located', await o.p.evaluate(() => { const s = SunGlobe.shown(); return !!s && Math.abs(s.geom.R - 480) < 2; }), await o.p.evaluate(() => SunGlobe.shown()));
    let cyan = 0; const views = [[B0_SEP, 0], [0, 90], [0, -90], [80, 0], [-80, 0], [0, 180], [0, 60], [0, -60], [45, 45], [-45, -45]];
    for (const [la, lo] of views) { await point(o.p, la, lo); cyan += await count(o.p, [128, 255, 128], 50); }
    ok('B nothing from outside the disc or from the limb band appears anywhere on the globe (ten viewpoints)', cyan === 0, cyan);
    await point(o.p, B0_SEP, 70); const in70 = await centre(o.p), r70 = await T('#sg-read')(o);
    ok('B 70° from the centre: picture, and the readout says so', near(in70, [255, 150, 40]) && / · in this picture$/.test(r70), { in70, r70 });
    await point(o.p, B0_SEP, 80); const in80 = await centre(o.p), r80 = await T('#sg-read')(o);
    ok('B 80° from the centre (inside the disc, in the limb band): plain, "outside this image’s view"', isPlain(in80) && / · outside this image’s view$/.test(r80), { in80, r80 });
    await point(o.p, 0, 180); ok('B far side: plain, "outside this image’s view"', isPlain(await centre(o.p)) && /180°[WE] · outside this image’s view$/.test(await T('#sg-read')(o)), { c: await centre(o.p), r: await T('#sg-read')(o) });
    await point(o.p, 0, 120); ok('B 120° west: plain', isPlain(await centre(o.p)));
    ok('B the plain side is striped (both plain tones are present)', await (async () => { await point(o.p, 0, 180); return (await count(o.p, PLAINS[0], 6)) > 500 && (await count(o.p, PLAINS[1], 6)) > 50; })());
    await o.ctx.close(); }

  // ---------- C. disc fit
  { const o = await mk({ clock: SEP + 3600000 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS, cx: 520, cy: 505, R: 470 }); o.hub.meta = n => meta(n, img('A', SEP));
    await open(o); await upWith(o, 'A'); const s = await o.p.evaluate(() => SunGlobe.shown());
    ok('C an off-centre, smaller disc is located within 1 px', s && Math.abs(s.geom.cx - 520) < 1 && Math.abs(s.geom.cy - 505) < 1 && Math.abs(s.geom.R - 470) < 1, s && s.geom);
    for (const [, lat, lon, rgb] of SPOTS.slice(0, 3)) { await point(o.p, lat, lon); ok(`C …and its spots are still where the view says (${lat}, ${lon})`, near(await centre(o.p), rgb), await centre(o.p)); }
    await o.ctx.close(); }
  for (const kind of ['black', 'square']) { const o = await mk({ clock: SEP + 3600000 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { kind }); o.hub.meta = n => meta(n, img('A', SEP));
    await open(o); await o.p.waitForFunction(() => /could not/.test(document.getElementById('sg-times').textContent), null, { timeout: 20000 }).catch(() => {});
    ok(`C a ${kind} picture (no clean disc) is refused: "No recent picture", with the reason`, (await T('#sg-state')(o)) === 'No recent picture' && /disc could not be located/.test(await T('#sg-times')(o)) && (await o.p.evaluate(() => SunGlobe.shown())) === null, await T('#sg-times')(o));
    await point(o.p, 0, 0); ok(`C ${kind}: the globe is plain and the readout says "no picture"`, isPlain(await centre(o.p)) && / · no picture$/.test(await T('#sg-read')(o)), await T('#sg-read')(o));
    await o.ctx.close(); }

  // ---------- D. words about time
  { const o = await mk({ clock: SEP + 72 * 60000 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.meta = n => meta(n, img('A', SEP));
    await open(o); await upWith(o, 'A'); const t = await T('#sg-times')(o), all = await T('#sun-globe')(o);
    ok('D "File updated at …" with its age, the hub retrieval time, and that the observation time is not stated', t === 'File updated at 8 Sep 2026, 11:00 UTC (1 h 12 min ago). Retrieved by our hub at 8 Sep 2026, 11:08 UTC. The file does not state when the Sun was observed.', t);
    ok('D never "observed at", "now" or "live"', !/observed at|\bnow\b|\blive\b/i.test(t) && !/observed at/i.test(all), t);
    ok('D status line', (await T('#sg-state')(o)) === 'The Sun · drag to turn, or use the buttons');
    ok('D the page explains the plain side, the blank edge, the three-hour rule and the scale', /outside this image’s view/.test(all) && /beyond about 76°/.test(all) && /at most three hours/.test(all) && /sizes are not comparable/.test(all) && /east is to the left/.test(all));
    ok('D no request went to SDO; the picture came from the hub', !o.reqs.some(u => /sdo\.gsfc\.nasa\.gov/.test(u)) && o.reqs.some(u => /workers\.dev\/snapshot\/sunface\/A\/sun\.jpg/.test(u)), o.reqs.filter(u => /nasa|workers/.test(u)));
    await o.ctx.close(); }

  // ---------- E. the age limit
  { const start = SEP + 2 * 3600000; const o = await mk({ clock: start }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS, centreDot: true }); o.hub.meta = n => meta(n, img('A', SEP));
    await open(o); await upWith(o, 'A');
    await o.p.waitForTimeout(800); const cE = await centre(o.p);
    ok('E two hours old: shown', (await T('#sg-state')(o)) !== 'No recent picture' && near(cE, [255, 255, 255]), cE);
    o.hub.down = true;                                   // from here the hub never answers again
    const off = await o.p.evaluate(() => SunGlobe.offset());   // the page's correction to its own clock, from the pointer read (only latency here)
    ok('E the correction from the hub clock is small here (same clock, only latency)', Math.abs(off) < 2000, off);
    const cut = SEP + 3 * 3600000 - off;                 // device time at which the corrected age is exactly three hours
    await o.p.clock.pauseAt(new Date(cut - 1)); await o.p.evaluate(() => SunGlobe.tick());
    ok('E one millisecond before three hours, hub silent: still shown', (await o.p.evaluate(() => !!SunGlobe.shown())) && /2 h 59 min ago/.test(await T('#sg-times')(o)), await T('#sg-times')(o));
    await o.p.clock.pauseAt(new Date(cut)); await o.p.evaluate(() => SunGlobe.tick());
    ok('E exactly three hours, hub silent: removed, "No recent picture"', (await o.p.evaluate(() => SunGlobe.shown())) === null && (await T('#sg-state')(o)) === 'No recent picture', await T('#sg-state')(o));
    ok('E …and the words give the file time and the limit', /^The last picture’s file was updated at 8 Sep 2026, 11:00 UTC, more than 3 hours ago\.$/.test(await T('#sg-times')(o)), await T('#sg-times')(o));
    await o.p.clock.resume(); await o.p.waitForTimeout(900); await point(o.p, B0_SEP, 0);
    ok('E …and the globe itself is plain', isPlain(await centre(o.p)) && / · no picture$/.test(await T('#sg-read')(o)), await centre(o.p));
    await o.ctx.close(); }
  { const start = SEP + 3 * 3600000 - 40000; const o = await mk({ clock: start }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.meta = n => meta(n, img('A', SEP));
    await open(o); await upWith(o, 'A'); const up = await o.p.evaluate(() => !!SunGlobe.shown()); o.hub.down = true;
    await o.p.clock.runFor(60000);                        // the tab just stays open; nobody touches it
    ok('E an open tab removes the picture by its own timer when the limit passes', up && (await o.p.evaluate(() => SunGlobe.shown())) === null && (await T('#sg-state')(o)) === 'No recent picture', { up, s: await T('#sg-state')(o) });
    await o.ctx.close(); }
  { const start = SEP + 3600000; const o = await mk({ clock: start }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.meta = n => meta(n, img('A', SEP));
    await open(o); await upWith(o, 'A'); o.hub.down = true;
    await o.p.clock.setSystemTime(new Date(SEP + 5 * 3600000));   // laptop lid closed for hours: the clock jumped, no timer ran
    const before = await o.p.evaluate(() => !!SunGlobe.shown());
    await o.p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    ok('E on resume after a long sleep the picture is removed at once', before && (await o.p.evaluate(() => SunGlobe.shown())) === null && (await T('#sg-state')(o)) === 'No recent picture', { before });
    await o.ctx.close(); }
  for (const [name, skewH, ageH, want] of [['device clock 5 h slow, picture 2 h old by the hub', -5, 2, true], ['device clock 5 h fast, picture 2 h old by the hub', 5, 2, true], ['device clock 5 h slow, picture 4 h old by the hub', -5, 4, false], ['device clock 2 h slow, picture 3 h 1 min old by the hub', -2, 3 + 1 / 60, false]]) {
    const hubNow = SEP + ageH * 3600000, o = await mk({ clock: hubNow + skewH * 3600000 }); o.hub.skewMs = skewH * 3600000; await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.meta = n => meta(n, img('A', SEP));
    await open(o); await o.p.waitForFunction(() => document.getElementById('sg-state').textContent !== 'loading…' && Math.abs(SunGlobe.offset()) > 1000, null, { timeout: 20000 }).catch(() => {}); await o.p.waitForTimeout(1500);
    ok(`E ${name}: ${want ? 'shown' : 'not shown'} (the hub's clock decides)`, (await o.p.evaluate(() => !!SunGlobe.shown())) === want, { s: await T('#sg-state')(o), t: await T('#sg-times')(o) });
    await o.ctx.close(); }
  { const o = await mk({ clock: SEP + 3600000 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.meta = n => meta(n, img('A', SEP), null, { age_limit_s: 99999 });
    await open(o); await upWith(o, 'A');
    ok('E the hub cannot lengthen the limit past three hours', (await o.p.evaluate(() => SunGlobe.limit())) === 10800, await o.p.evaluate(() => SunGlobe.limit()));
    const o2 = await mk({ clock: SEP + 2 * 3600000 }); await o2.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o2.hub.images.A = await paint(o2.p, { b0: B0_SEP, spots: SPOTS }); o2.hub.meta = n => meta(n, img('A', SEP), null, { age_limit_s: 3600 });
    await open(o2); await o2.p.waitForFunction(() => document.getElementById('sg-state').textContent !== 'loading…', null, { timeout: 20000 }).catch(() => {}); await o2.p.waitForTimeout(1200);
    ok('E the hub can shorten it (limit 1 h, picture 2 h old: not shown)', (await o2.p.evaluate(() => SunGlobe.shown())) === null && (await T('#sg-state')(o2)) === 'No recent picture');
    await o.ctx.close(); await o2.ctx.close(); }
  { const hubNow = SEP + 3600000, o = await mk({ clock: hubNow }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.meta = n => meta(n, img('A', hubNow + 10 * 60000));   // file "updated" ten minutes after the hub's clock
    await open(o); await o.p.waitForFunction(() => document.getElementById('sg-state').textContent !== 'loading…', null, { timeout: 20000 }).catch(() => {}); await o.p.waitForTimeout(1200);
    ok('E a file time in the future of the hub clock is not shown', (await o.p.evaluate(() => SunGlobe.shown())) === null && (await T('#sg-state')(o)) === 'No recent picture');
    for (const bad of [null, '', 'yesterday', 12345]) { o.hub.meta = n => meta(n, { ...img('A', SEP), file_updated: bad }); await o.p.evaluate(() => SunGlobe.refresh()); await o.p.waitForTimeout(700);
      ok('E a picture without a usable file time is not shown: ' + JSON.stringify(bad), (await o.p.evaluate(() => SunGlobe.shown())) === null); }
    await o.ctx.close(); }

  // ---------- F. replacement rules
  { const t0 = SEP + 3600000, o = await mk({ clock: t0 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    const A = img('A', SEP), spotsB = [['white', 0, 0, [255, 255, 255]]];
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.images.B = await paint(o.p, { b0: B0_SEP, spots: spotsB }); o.hub.images.BAD = await paint(o.p, { kind: 'black' });
    o.hub.meta = n => meta(n, A); await open(o); await upWith(o, 'A');
    const refresh = async m => { o.hub.meta = m; await o.p.evaluate(() => SunGlobe.refresh()); await o.p.waitForTimeout(1500); return o.p.evaluate(() => SunGlobe.shown() && SunGlobe.shown().id); };
    ok('F a newer picture whose file is missing (404) does not displace the valid one', (await refresh(n => meta(n, img('GONE', SEP + 30 * 60000), A))) === 'A');
    ok('F a newer picture that cannot be placed (no disc) does not displace the valid one', (await refresh(n => meta(n, img('BAD', SEP + 30 * 60000), A))) === 'A');
    ok('F …and the words still describe the picture on screen', /^File updated at 8 Sep 2026, 11:00 UTC/.test(await T('#sg-times')(o)), await T('#sg-times')(o));
    o.hub.metaStatus = 503; ok('F the hub failing leaves the valid picture up', (await refresh(n => meta(n, null))) === 'A'); o.hub.metaStatus = 200;
    ok('F a pointer with no picture leaves the valid picture up until its own limit', (await refresh(n => meta(n, null))) === 'A');
    ok('F a good newer picture replaces it', (await refresh(n => meta(n, img('B', SEP + 30 * 60000), A))) === 'B' && /11:30 UTC/.test(await T('#sg-times')(o)), await T('#sg-times')(o));
    await point(o.p, 0, 0); ok('F …and the globe shows the new picture', near(await centre(o.p), [255, 255, 255]), await centre(o.p));
    ok('F the pointer going back to the older picture does not step the globe back', (await refresh(n => meta(n, A))) === 'B');
    await o.ctx.close(); }
  { const t0 = SEP + 3.5 * 3600000, o = await mk({ clock: t0 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.OLD = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.images.NEWBAD = await paint(o.p, { kind: 'black' });
    o.hub.meta = n => meta(n, img('NEWBAD', SEP + 3 * 3600000), img('OLD', SEP + 1.5 * 3600000));   // current cannot be placed; previous is 2 h old
    await open(o); await upWith(o, 'OLD');
    ok('F current picture unusable, previous still under three hours: the previous one is shown, with its own time', (await o.p.evaluate(() => SunGlobe.shown() && SunGlobe.shown().id)) === 'OLD' && /12:30 UTC \(2 h 0 min ago\)/.test(await T('#sg-times')(o)), await T('#sg-times')(o));
    const o2 = await mk({ clock: t0 }); o2.hub.meta = n => meta(n, img('X', SEP), img('Y', SEP - 3600000)); await open(o2); await o2.p.waitForTimeout(1500);
    ok('F both pictures past three hours: "No recent picture", nothing fetched', (await T('#sg-state')(o2)) === 'No recent picture' && o2.hub.hits.img === 0 && /no picture of the Sun younger than three hours/.test(await T('#sg-times')(o2)), { t: await T('#sg-times')(o2), hits: o2.hub.hits });
    const o3 = await mk({ clock: t0 }); o3.hub.metaStatus = 503; await open(o3); await o3.p.waitForTimeout(1500);
    ok('F hub unreachable at first load: "No recent picture" with that reason; the globe is still there to turn', (await T('#sg-state')(o3)) === 'No recent picture' && /hub could not be reached/.test(await T('#sg-times')(o3)) && await o3.p.isVisible('#sg-globe'), await T('#sg-times')(o3));
    await o.ctx.close(); await o2.ctx.close(); await o3.ctx.close(); }

  // ---------- G. controls, zoom, failure states
  { const o = await mk({ clock: SEP + 3600000 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.meta = n => meta(n, img('A', SEP)); await open(o); await upWith(o, 'A');
    const R = () => T('#sg-read')(o), A = () => o.p.evaluate(() => SunGlobe.view().altitude);
    ok('G opening readout', (await R()) === 'Centre of view: 7°N 0° · in this picture', await R());
    await o.p.click('#sg-west'); await o.p.click('#sg-west'); ok('G West ▶ turns toward solar west (right)', (await R()) === 'Centre of view: 7°N 30°W · in this picture', await R());
    for (let k = 0; k < 4; k++) await o.p.click('#sg-east'); ok('G ◀ East', (await R()) === 'Centre of view: 7°N 30°E · in this picture', await R());
    await o.p.click('#sg-north'); await o.p.click('#sg-south'); await o.p.click('#sg-south'); ok('G North / South', (await R()) === 'Centre of view: 8°S 30°E · in this picture', await R());
    await o.p.click('#sg-far'); ok('G Far side', /^Centre of view: 7°S 180°[WE] · outside this image’s view$/.test(await R()), await R());
    await o.p.click('#sg-near'); ok('G Earth-facing side', (await R()) === 'Centre of view: 7°N 0° · in this picture', await R());
    const b0 = await o.p.locator('#sg-globe').boundingBox(); await o.p.click('#sg-zin'); await o.p.click('#sg-west');
    ok('G Zoom in moves the camera; turning keeps it', Math.abs((await A()) - 1.65) < .01, await A());
    for (let k = 0; k < 8; k++) await o.p.click('#sg-zin'); const b1 = await o.p.locator('#sg-globe').boundingBox();
    ok('G closest look 0.5; the box does not change', Math.abs((await A()) - .5) < .01 && Math.abs(b1.width - b0.width) < .5 && Math.abs(b1.height - b0.height) < .5, { a: await A() });
    for (let k = 0; k < 9; k++) await o.p.click('#sg-zout'); ok('G Zoom out stops at the whole Sun', Math.abs((await A()) - 2.2) < .01);
    await o.p.locator('#sg-globe').scrollIntoViewIfNeeded(); const bb = await o.p.locator('#sg-globe').boundingBox(); await o.p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    const y0 = await o.p.evaluate(() => scrollY); await o.p.mouse.wheel(0, 240); await o.p.waitForTimeout(400);
    ok('G plain wheel scrolls the page, not the globe', (await o.p.evaluate(() => scrollY)) > y0 && Math.abs((await A()) - 2.2) < .01);
    ok('G eight ordinary buttons; the globe box is an image, not a tab stop', (await o.p.locator('#sg-ctl button').count()) === 8 && await o.p.getAttribute('#sg-globe', 'role') === 'img' && await o.p.getAttribute('#sg-globe', 'tabindex') === null);
    ok('G no blocking library tag; spacecraft drawing present', await o.p.evaluate(() => ![...document.querySelectorAll('script[src*="unpkg"]')].some(x => !x.async)) && await o.p.locator('#craft-view').count() === 1);
    ok('G no sideways overflow', await o.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await o.ctx.close(); }
  { const o = await mk({ clock: SEP + 3600000, w: 390 }); await o.p.goto(BASE + '/sources.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
    o.hub.images.A = await paint(o.p, { b0: B0_SEP, spots: SPOTS }); o.hub.meta = n => meta(n, img('A', SEP)); await open(o); await upWith(o, 'A');
    const bb = await o.p.locator('#sg-globe').boundingBox();
    ok('G phone: square globe with a strip each side; buttons 40 px; no overflow', bb && Math.abs(bb.width - bb.height) < 2 && bb.x >= 30 && 390 - (bb.x + bb.width) >= 30 && (await o.p.locator('#sg-zout').boundingBox()).height >= 40 && await o.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), bb);
    await o.ctx.close(); }
  { const o = await mk({ noLib: true }); o.hub.meta = n => meta(n, null); await open(o, '#sg-why:not([hidden])'); await o.p.waitForTimeout(800);
    ok('G no library: "Sun globe unavailable" with the reason; box and buttons hidden; spacecraft section visible', (await T('#sg-state')(o)) === 'Sun globe unavailable' && /did not load/.test(await T('#sg-why')(o)) && !(await o.p.isVisible('#sg-globe')) && !(await o.p.isVisible('#sg-ctl')) && await o.p.isVisible('#craft-view'), await T('#sg-state')(o));
    await o.ctx.close(); }
  { const t0 = Date.now(); const o = await mk({ stall: 40000 }); o.hub.meta = n => meta(n, null); await o.p.goto(BASE + '/sun.html', { waitUntil: 'domcontentloaded' });
    await o.p.waitForFunction(() => document.getElementById('craft-state').textContent !== 'loading…', null, { timeout: 9000 }).catch(() => {});
    ok('G library pending: the spacecraft section does not wait for it', (await T('#craft-state')(o)) !== 'loading…' && Date.now() - t0 < 11000, await T('#craft-state')(o));
    await o.p.waitForFunction(() => document.getElementById('sg-state').textContent === 'Sun globe unavailable', null, { timeout: 16000 }).catch(() => {});
    ok('G library pending: the globe gives up at about 12 s', (await T('#sg-state')(o)) === 'Sun globe unavailable' && /12 seconds/.test(await T('#sg-why')(o)) && Date.now() - t0 >= 11500, { ms: Date.now() - t0 });
    await o.ctx.close(); }

  await b.close();
  console.log(`sun-globe: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
