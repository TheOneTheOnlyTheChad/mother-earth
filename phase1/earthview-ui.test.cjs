/* Earth from Space page (space.html, space.js) against the REAL hub code and REAL frames, through phase1/earthview-preview.mjs
 * (started by this file on its own port; nothing reaches the network).
 *  A. nothing verified yet            B. a first frame: words, time, age, the picture itself       C. a newer frame is offered, never swapped in
 *  D. failed source check             E. failed collection (never a requested time as a frame time)  F. later frames, reload
 *  G. nothing newer / checks stopped  H. hub unreachable; picture unreachable                       I. zoom, drag, keyboard
 *  J. narrow screens                  K. wording that must never appear; requests made               L. the pure wording table
 * Run: node phase1/earthview-ui.test.cjs
 * BREAK=rollback-current|waiting-with-offer|offer-heading-lost|auto-swap|requested-time|delay-wording|current-on-failed-check|stale-ignored|step-back|zoom-unbounded|pan-unbounded|offer-hidden|keep-on-error|contacts-source  must each fail. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');
const PORT = 8896, B = 'http://127.0.0.1:' + PORT, BREAK = process.env.BREAK || '';
const BREAKS = {
  'auto-swap': ["if (m.frame && !st.shown && !st.loading && !(st.failed && st.failed.id === m.frame.id)) load(m.frame);", "if (m.frame && !st.loading && (!st.shown || st.shown.id !== m.frame.id)) load(m.frame);"],
  'requested-time': ["set('ev-time', full(s.source_frame_time));", "set('ev-time', full((st.meta && st.meta.collection && st.meta.collection.frame_time) || s.source_frame_time));"],
  'delay-wording': ["`We could not check the source at ${hm(sc.at)}. Whether a newer frame exists is unknown.`", "`The source is delayed.`"],
  'current-on-failed-check': ["    else if (sc.ok === false) lines.push(", "    else if (sc.ok === false) current = true; else if (false) lines.push("],
  'stale-ignored': ["    else if (checkAge > CHECK_STALE_S) lines.push(", "    else if (false) lines.push("],
  'step-back': ["      if (st.meta && st.meta.frame && (!m.frame || m.frame.source_frame_time < st.meta.frame.source_frame_time)) m = { ...m, frame: st.meta.frame };   // never step back\n", ""],
  'zoom-unbounded': ["const s = Math.max(1, Math.min(maxScale(), z.s * f));", "const s = Math.max(1, z.s * f);"],
  'pan-unbounded': ["z.x = Math.max(-lim, Math.min(lim, z.x)); z.y = Math.max(-lim, Math.min(lim, z.y));", ""],
  'offer-hidden': ["off.hidden = !w.offer || !!st.loading;", "off.hidden = true;"],
  'keep-on-error': ["st.loading = null; st.loadError = `The ${hm(frame.source_frame_time)} picture could not be loaded.", "st.loading = null; st.shown = frame; st.loadError = `The ${hm(frame.source_frame_time)} picture could not be loaded."],
  'rollback-current': ["    else if (newest < f.source_frame_time) lines.push(", "    else if (false) lines.push("],
  'waiting-with-offer': [": offer ? `The newest frame the source lists is ${hm(newest)}.` : 'Waiting for the next frame.');", ": 'Waiting for the next frame.');"],
  'offer-heading-lost': ["    const head = offer ? 'Showing an earlier frame' : current ?", "    const head = current ? (offer ? 'Showing an earlier frame' : 'Current: the newest frame the source lists') : false ?"],
  'contacts-source': ["  apply(); render(); read();", "  apply(); render(); read(); fetch('https://view.eumetsat.int/geoserver/ows?service=WMS&request=GetCapabilities').catch(() => {});"],
};
if (BREAK && !(BREAK in BREAKS)) { console.log('FAIL unknown break ' + BREAK); process.exit(1); }
let pass = 0, fail = 0; const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL', name, info !== undefined ? JSON.stringify(info).slice(0, 500) : ''); } };
const get = p => fetch(B + p).then(r => r.json()); const scene = n => get('/__scene?name=' + n);
(async () => {
  const srv = spawn(process.execPath, ['--no-warnings', path.join(__dirname, 'earthview-preview.mjs'), String(PORT)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res, rej) => { srv.stdout.on('data', d => /local preview/.test(String(d)) && res()); srv.on('exit', c => rej(new Error('preview server exited ' + c))); setTimeout(() => rej(new Error('preview server did not start')), 15000); });
  const b = await chromium.launch(); const outside = [];
  try {
    const open = async (w = 1280, h = 900, opt = {}) => { const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: opt.reduced ? 'reduce' : 'no-preference' }), p = await ctx.newPage();
      await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith(B)) { if (BREAK && /\/space\.js/.test(u)) return (async () => { const res = await r.fetch(); let s = await res.text(); const [a, c] = BREAKS[BREAK]; if (!s.includes(a)) { console.log('FAIL break did not apply: ' + BREAK); process.exit(1); } r.fulfill({ response: res, body: s.replace(a, c) }); })(); return r.continue(); }
        outside.push(u); return r.abort(); });
      await p.goto(B + '/space.html'); await p.waitForFunction(() => document.getElementById('ev-state').textContent !== 'Loading…' && !/Loading the picture/.test(document.getElementById('ev-state').textContent), null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(150); return p; };
    const reread = async p => { await p.evaluate(() => window.dispatchEvent(new Event('pageshow'))); await p.waitForTimeout(700); };
    const S = p => p.evaluate(() => { const t = id => document.getElementById(id), vis = e => !!e && !e.hidden && getComputedStyle(e).display !== 'none'; const img = t('ev-img');
      return { head: t('ev-state').textContent, lines: [...t('ev-lines').querySelectorAll('p')].map(x => x.textContent), linesShown: vis(t('ev-lines')), offer: vis(t('ev-offer')) ? t('ev-offer-say').textContent : null, busy: vis(t('ev-busy')) ? t('ev-busy').textContent : null, retry: vis(t('ev-retry')),
        view: vis(t('ev-view')), time: t('ev-time').textContent, datetime: t('ev-time').getAttribute('datetime'), age: t('ev-age').textContent, alt: img.alt, src: img.getAttribute('src'), nat: [img.naturalWidth, img.naturalHeight], info: vis(t('ev-frame')), ctl: vis(t('ev-ctl')), year: t('ev-year').textContent, text: document.querySelector('main').innerText }; });
    const pix = (p, pts) => p.evaluate(pts => { const img = document.getElementById('ev-img'), c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return pts.map(([x, y]) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3)); }, pts);

    // ===== A. nothing verified yet
    await scene('empty'); let p = await open(); let s = await S(p);
    ok('A1 no frame: says so plainly, shows no picture, no controls, no time', s.head === 'No verified picture is available' && !s.view && !s.ctl && !s.info && !s.offer, s);
    await get('/__run?latest=2026-11-19T00:00:00Z&fault=noheader'); await reread(p); s = await S(p);
    ok('A2 a frame is listed but collection failed, nothing held: still no picture, and the failure is said', s.head === 'No verified picture is available' && /A frame \(00:00 UTC\) is listed, but our collection failed\./.test(s.lines.join(' ')) && !s.view, s);
    await p.context().close();
    // ===== B. a first frame
    await scene('first-night'); p = await open(); s = await S(p);
    ok('B1 current, waiting, last check time', s.head === 'Current: the newest frame the source lists' && s.lines[0] === 'Waiting for the next frame.' && s.lines[1] === 'Source last checked at 00:25 UTC.', s);
    ok('B2 source frame time in UTC with the date, machine-readable too', s.time === '00:00 UTC, 19 Nov 2026' && s.datetime === '2026-11-19T00:00:00Z', [s.time, s.datetime]);
    ok('B3 age counted from the hub’s clock, not this device’s', s.age === '25 minutes ago', s.age);
    ok('B4 the picture is the hub’s, whole, 2048 square', /^http:\/\/127\.0\.0\.1:\d+\/snapshot\/earthview\/20261119T0000Z-[0-9a-f]{16}\/picture\.jpg$/.test(s.src) && s.nat.join() === '2048,2048', [s.src, s.nat]);
    ok('B5 alternative text names the product and the source frame time', /Meteosat at 0° longitude/.test(s.alt) && /GeoColour/.test(s.alt) && /source frame time 00:00 UTC, 19 Nov 2026/.test(s.alt), s.alt);
    { const c = await pix(p, [[6, 6], [2040, 6], [6, 2040], [2040, 2040], [1024, 1024], [700, 500], [1300, 800], [1024, 300], [1500, 1400]]);
      ok('B6 the surround is the colour that was asked for and the disk is not', c.slice(0, 4).every(x => Math.abs(x[0] - 11) < 8 && Math.abs(x[1] - 16) < 8 && Math.abs(x[2] - 22) < 8) && c.slice(4).some(x => Math.abs(x[0] - 11) > 25 || Math.abs(x[1] - 16) > 25 || Math.abs(x[2] - 22) > 25), c);
      const box = await p.evaluate(() => { const v = document.getElementById('ev-view').getBoundingClientRect(), i = document.getElementById('ev-img').getBoundingClientRect(); return [v.width, v.height, i.width, i.height, v.bottom, innerHeight]; });
      ok('B7 never stretched: the box and the picture are square', Math.abs(box[0] - box[1]) < 1 && Math.abs(box[2] - box[3]) < 1 && Math.abs(box[0] - box[2]) < 3, box);
      ok('B8 on a 1280 x 900 screen the whole disk is in view without scrolling', box[4] <= box[5] + 1, box); }
    ok('B9 credits: EUMETSAT with the frame’s year, licence, product link, NASA background, no endorsement', /Contains modified EUMETSAT Meteosat data 2026/.test(s.text) && /CC BY 4\.0/.test(s.text) && /NASA Black Marble/.test(s.text) && /do not endorse/.test(s.text) && s.year === '2026', null);
    ok('B10 the city-lights caution is always visible', /The city lights are not tonight’s\./.test(s.text), null);
    // ===== C. a newer verified frame: offered, never swapped in
    await scene('newer-day'); await reread(p); s = await S(p);
    ok('C1 the picture, its time and its age are unchanged', /20261119T0000Z/.test(s.src) && s.time === '00:00 UTC, 19 Nov 2026' && /^11 hours 25 minutes ago$/.test(s.age), [s.src, s.time, s.age]);
    ok('C2 one separate line offers the newer frame', s.offer === 'A newer frame, 11:00 UTC, is available.' && s.head === 'Showing an earlier frame', s);
    ok('C3 the page does not call an earlier frame current', !/^Current/.test(s.head), s.head);
    ok('C3b while a newer verified frame is on offer the page does not say it is waiting for one; it says what the source lists (GPT 3b)', !/Waiting/.test(s.lines.join(' ')) && s.lines[0] === 'The newest frame the source lists is 11:00 UTC.' && s.lines[1] === 'Source last checked at 11:25 UTC.', s.lines);
    await p.waitForTimeout(1500); ok('C4 and it stays that way without being asked', /20261119T0000Z/.test((await S(p)).src));
    await p.click('#ev-offer-btn'); await p.waitForFunction(() => /1100Z/.test(document.getElementById('ev-img').getAttribute('src')), null, { timeout: 15000 }).catch(() => {}); s = await S(p);
    ok('C5 on request: the newer picture, its own time and age, and the offer gone', /20261119T1100Z/.test(s.src) && s.time === '11:00 UTC, 19 Nov 2026' && s.age === '25 minutes ago' && !s.offer && s.head === 'Current: the newest frame the source lists' && /source frame time 11:00 UTC/.test(s.alt), s);
    // ===== D. the source check fails
    await scene('check-failed'); await reread(p); s = await S(p);
    ok('D1 said as a failed check, with its time, and that a newer frame is unknown', s.lines.includes('We could not check the source at 11:35 UTC. Whether a newer frame exists is unknown.') && s.head === 'Showing the last verified frame', s);
    ok('D2 never worded as a delay at the source, never "current", never "waiting"', !/delay|late|Waiting|^Current/i.test(s.head + ' ' + s.lines.join(' ')), s);
    ok('D3 the picture and its time stay', /1100Z/.test(s.src) && s.time === '11:00 UTC, 19 Nov 2026' && s.age === '35 minutes ago', [s.src, s.time, s.age]);
    // ===== E. a newer frame is listed but could not be collected
    for (const [name, sc] of [['no served-time header', 'no-header'], ['a different frame served', 'different-frame'], ['a damaged picture', 'damaged-picture']]) { await scene(sc); await reread(p); s = await S(p);
      ok(`E ${name}: the listed frame and the failure are said; the displayed frame is named`, s.lines.includes('A newer frame (16:50 UTC) is listed, but our collection failed. Showing 11:00 UTC.') && s.head === 'Showing the last verified frame', s);
      ok(`E ${name}: 16:50 never appears as the picture’s time, in the alternative text or as an offer`, s.time === '11:00 UTC, 19 Nov 2026' && !/16:50/.test(s.alt) && !s.offer && /1100Z/.test(s.src), [s.time, s.offer]); }
    // ===== F. later frame; a fresh visit shows the newest verified frame
    await scene('dusk-published'); await reread(p); s = await S(p);
    ok('F1 once verified, 16:50 is offered', s.offer === 'A newer frame, 16:50 UTC, is available.' && s.time === '11:00 UTC, 19 Nov 2026', s);
    { await get('/__run?latest=2026-11-19T16:50:00Z&fault=check503'); await reread(p); const x = await S(p);
      ok('F1b an earlier frame displayed, a newer one on offer, and the source check fails: the heading still says an earlier frame is shown; the failed check is its own line (GPT 3c)', x.head === 'Showing an earlier frame' && x.offer === 'A newer frame, 16:50 UTC, is available.' && /^We could not check the source at \d\d:\d\d UTC\. Whether a newer frame exists is unknown\.$/.test(x.lines[0]), x);
      await get('/__clock?at=2026-11-19T17:25:08Z'); await get('/__run?latest=2026-11-19T16:50:00Z'); await reread(p); }
    const p2 = await open(); const s2 = await S(p2);
    ok('F2 a new visit opens on the newest verified frame', s2.time === '16:50 UTC, 19 Nov 2026' && /1650Z/.test(s2.src) && s2.head === 'Current: the newest frame the source lists' && s2.age === '35 minutes ago', s2);
    await scene('source-stepped-back'); await reread(p2); s = await S(p2);
    ok('F3 the source’s list steps back to 11:00 with 16:50 verified and displayed: NOT "Current"; said as an out-of-date list (GPT 3a)', s.head === 'Showing the last verified frame' && s.lines[0] === 'At 17:35 UTC the source’s list ended at 11:00 UTC, earlier than the 16:50 UTC frame already verified. The list we were given was out of date. Whether a newer frame exists is unknown.' && !/Current|Waiting|nothing newer/.test(s.head + s.lines.join(' ')) && /1650Z/.test(s.src) && s.time === '16:50 UTC, 19 Nov 2026', s);
    await reread(p); { const x = await S(p); ok('F3b the same list seen from the page still on 11:00: an earlier frame, 16:50 on offer, the out-of-date list said beneath', x.head === 'Showing an earlier frame' && !!x.offer && /out of date/.test(x.lines[0]) && x.time === '11:00 UTC, 19 Nov 2026', x); }
    // ===== G. nothing newer for a long time; checks stop
    await scene('nothing-newer'); await reread(p2); s = await S(p2);
    ok('G1 after the provisional limit: says what is listed, promises nothing', s.lines[0] === 'The source has listed nothing newer than the 16:50 UTC frame.' && s.lines[1] === 'Source last checked at 18:25 UTC.' && s.age === '95 minutes ago' && !/Waiting|soon|expected/i.test(s.lines.join(' ')), s);
    await scene('checks-stopped'); await reread(p2); s = await S(p2);
    ok('G2 no source check for 40 minutes: not called current; the last check time and the unknown are said', s.head === 'Showing the last verified frame' && /^Our last check of the source was at 18:25 UTC, 40 minutes ago\. Whether a newer frame exists is unknown\.$/.test(s.lines[0]), s);
    await reread(p); { const x = await S(p);
      ok('G3 11:00 displayed, 16:50 offered and not accepted, checks stopped: heading "Showing an earlier frame"; the stopped checks reported separately (GPT 3c)', x.head === 'Showing an earlier frame' && x.offer === 'A newer frame, 16:50 UTC, is available.' && /^Our last check of the source was at 18:25 UTC, 40 minutes ago\. Whether a newer frame exists is unknown\.$/.test(x.lines[0]) && x.time === '11:00 UTC, 19 Nov 2026', x); }
    // ===== H. hub unreachable; picture unreachable
    await p2.route('**/snapshot/earthview/meta', r => r.abort()); await reread(p2); s = await S(p2);
    ok('H1 hub unreachable: said, with the time of the last good read; the picture stays', /^Mother Earth’s hub could not be reached since \d\d:\d\d UTC\. The picture shown is the last one loaded\.$/.test(s.lines[0]) && s.head === 'Showing the last picture loaded' && /1650Z/.test(s.src) && s.time === '16:50 UTC, 19 Nov 2026', s);
    await p2.context().close();
    await get('/__picdown'); await p.click('#ev-offer-btn'); await p.waitForTimeout(900); s = await S(p);
    ok('H2 the newer picture fails to load: said, and the displayed picture and its time stay', s.busy === 'The 16:50 UTC picture could not be loaded. Still showing 11:00 UTC.' && s.retry && /1100Z/.test(s.src) && s.time === '11:00 UTC, 19 Nov 2026', s);
    await p.click('#ev-retry'); await p.waitForFunction(() => /1650Z/.test(document.getElementById('ev-img').getAttribute('src')), null, { timeout: 15000 }).catch(() => {}); s = await S(p);
    ok('H3 Try again loads it', /1650Z/.test(s.src) && s.time === '16:50 UTC, 19 Nov 2026' && !s.retry && !s.busy, s);
    { // a hub that answers with an OLDER frame than one already seen
      await get('/__run'); await reread(p);
      await p.route('**/snapshot/earthview/meta', async r => { const res = await r.fetch(), j = await res.json(); j.frame = j.previous; r.fulfill({ response: res, body: JSON.stringify(j) }); }); await reread(p); s = await S(p);
      ok('H4 a record that steps back to an older frame changes nothing: the newest frame already seen stays the newest', !s.offer && /1650Z/.test(s.src) && s.head === 'Current: the newest frame the source lists' && !/not been collected|11:00/.test(s.lines.join(' ')), s); await p.unroute('**/snapshot/earthview/meta'); }
    // ===== I. zoom, drag, keyboard
    { const Z = () => p.evaluate(() => { const m = new DOMMatrix(getComputedStyle(document.getElementById('ev-img')).transform), v = document.getElementById('ev-view'); return { s: +m.a.toFixed(3), x: Math.round(m.e), y: Math.round(m.f), w: v.clientWidth, zin: document.getElementById('ev-zin').disabled, zout: document.getElementById('ev-zout').disabled, reset: document.getElementById('ev-reset').disabled, say: document.getElementById('ev-zoomsay').textContent }; });
      let z = await Z(); const max = 2048 / z.w;
      ok('I1 starts with the whole picture: zoom out and reset disabled', z.s === 1 && z.zout && z.reset && !z.zin && z.say === 'Whole picture shown.', z);
      await p.click('#ev-zin'); z = await Z(); ok('I2 Zoom in enlarges by 1.5', z.s === 1.5 && !z.zout && !z.reset, z);
      for (let k = 0; k < 8; k++) await p.click('#ev-zin', { force: true }).catch(() => {}); z = await Z();
      ok('I3 zoom stops at one picture pixel per screen pixel', Math.abs(z.s - max) < 0.01 && z.zin && /one picture pixel per screen pixel/.test(z.say), [z, max]);
      const box = await p.evaluate(() => { const r = document.getElementById('ev-view').getBoundingClientRect(); return [r.left, r.top, r.width]; });
      await p.mouse.move(box[0] + 300, box[1] + 300); await p.mouse.down(); await p.mouse.move(box[0] + 200, box[1] + 240, { steps: 4 }); await p.mouse.up(); z = await Z();
      ok('I4 dragging moves the picture', z.x === -100 && z.y === -60, z);
      await p.mouse.move(box[0] + 300, box[1] + 300); await p.mouse.down(); await p.mouse.move(box[0] - 4000, box[1] - 4000, { steps: 3 }); await p.mouse.up(); z = await Z();
      const lim = Math.round(z.w * (z.s - 1) / 2); ok('I5 it cannot be dragged past its own edge', Math.abs(z.x + lim) <= 1 && Math.abs(z.y + lim) <= 1, [z, lim]);
      await p.focus('#ev-view'); await p.keyboard.press('ArrowLeft'); const z2 = await Z(); ok('I6 arrow keys move it when zoomed', z2.x === z.x + 60, [z.x, z2.x]);
      await p.keyboard.press('-'); const z3 = await Z(); ok('I7 minus zooms out, plus zooms in', z3.s < z2.s, z3); await p.keyboard.press('+'); ok('I7b plus', (await Z()).s > z3.s);
      await p.keyboard.press('0'); z = await Z(); ok('I8 0 or "Whole picture" returns to the whole picture', z.s === 1 && z.x === 0 && z.y === 0, z);
      const y0 = await p.evaluate(() => { scrollTo(0, 0); return scrollY; }); await p.focus('#ev-view'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200);
      ok('I9 not zoomed: arrow keys are left to the page', await p.evaluate(() => getComputedStyle(document.getElementById('ev-img')).transform) !== null && (await Z()).y === 0, null); void y0;
      const order = []; await p.evaluate(() => document.getElementById('ev-h').scrollIntoView()); await p.focus('#menu-btn'); for (let k = 0; k < 12; k++) { await p.keyboard.press('Tab'); order.push(await p.evaluate(() => document.activeElement.id || document.activeElement.tagName)); }
      ok('I10 keyboard reaches the picture, each enabled control and the explanation', ['ev-view', 'ev-zin'].every(id => order.includes(id)) && order.indexOf('ev-view') < order.indexOf('ev-zin') && order.includes('SUMMARY'), order);
      await p.focus('#ev-how summary'); await p.keyboard.press('Enter'); ok('I11 "How this image is made" is closed until opened, and opens from the keyboard', await p.evaluate(() => document.getElementById('ev-how').open), null);
      const how = await p.evaluate(() => document.getElementById('ev-how').innerText);
      ok('I12 it says: scanned not instantaneous, the fixed night map, what the time means, what was changed', /not a photograph taken in one instant/.test(how) && /Black Marble, a fixed map/.test(how) && /only when the service itself confirms that time/.test(how) && /Nothing was recoloured, sharpened or retouched/.test(how) && /never contacts EUMETSAT/.test(how), how.slice(0, 200));
      const pr = await open(1280, 900, { reduced: true }); const tr = await pr.evaluate(() => [...document.querySelectorAll('#ev-main *')].filter(e => { const c = getComputedStyle(e); return parseFloat(c.transitionDuration) > 0 || c.animationName !== 'none'; }).length);
      ok('I13 nothing on the page animates', tr === 0, tr); await pr.context().close(); }
    await p.context().close();
    // ===== J. narrow screens
    for (const w of [320, 390, 768]) { const q = await open(w, 800); const m = await q.evaluate(() => { const R = e => e.getBoundingClientRect(), v = R(document.getElementById('ev-view')), main = R(document.getElementById('ev-main'));
        const small = [...document.querySelectorAll('#ev-main button:not([hidden]), #ev-how summary')].filter(e => { const r = R(e); return r.width && (r.height < 40 || r.width < 44); }).map(e => e.id || e.tagName);
        return { sw: document.documentElement.scrollWidth, W: innerWidth, vw: v.width, vh: v.height, mainW: main.width, small, order: R(document.getElementById('ev-view')).top < R(document.getElementById('ev-frame')).top && R(document.getElementById('ev-frame')).top < R(document.getElementById('ev-how')).top && R(document.getElementById('ev-how')).top < R(document.getElementById('ev-credits')).top }; });
      ok(`J ${w}px: no sideways scrolling`, m.sw <= m.W, m); ok(`J ${w}px: the picture is square and uses the width it has`, Math.abs(m.vw - m.vh) < 1 && (w > 600 || m.vw >= w - 34), m);
      ok(`J ${w}px: picture, then the facts, then the explanation, then credits`, m.order, m); ok(`J ${w}px: every control is at least 44 x 40`, m.small.length === 0, m.small); await q.context().close(); }
    // ===== K. wording that must never appear; requests
    { const q = await open(); await q.evaluate(() => { document.getElementById('ev-how').open = true; }); const t = await q.evaluate(() => document.querySelector('main').innerText);
      ok('K1 no claim of a live view, a photograph time, a scan time or an exact perspective', !/\blive\b|real[- ]time|taken at|observed at|scan(ned)? (start|end|began|ended)s? at|exact (satellite )?perspective|right now/i.test(t), (t.match(/\blive\b|real[- ]time|taken at|observed at|exact (satellite )?perspective|right now/i) || [])[0]);
      ok('K2 the label is "Source frame time"', /SOURCE FRAME TIME|Source frame time/.test(t), null); await q.context().close(); }
    ok('K3 the page asked nothing of EUMETSAT or any other outside host except the font stylesheet', outside.every(u => /^https:\/\/fonts\.googleapis\.com\//.test(u)), [...new Set(outside)].slice(0, 5));
    // ===== L. the wording table, pure
    { const q = await open(); const r = await q.evaluate(() => { const w = window.__earthview.words, T = Date.parse('2026-11-19T12:00:00Z'), f = (t, id) => ({ id, source_frame_time: t }), A = f('2026-11-19T11:30:00Z', 'a'), O = f('2026-11-19T11:00:00Z', 'o');
        const sc = (ok, newest, at = '2026-11-19T11:55:00Z') => ({ ok, at, ...(ok ? { newest } : {}) }), lim = { waiting_s: 2700 };
        return { cur: w({ frame: A, source_check: sc(true, A.source_frame_time), limits: lim }, A, T), old: w({ frame: A, source_check: sc(true, A.source_frame_time), limits: lim }, A, T + 3600e3 - 1e3),
          later: w({ frame: A, source_check: sc(true, A.source_frame_time, '2026-11-19T12:55:00Z'), limits: lim }, A, T + 3600e3), failed: w({ frame: A, source_check: sc(false) }, A, T),
          listed: w({ frame: A, source_check: sc(true, '2026-11-19T11:40:00Z'), collection: { outcome: 'failed', frame_time: '2026-11-19T11:40:00Z' } }, A, T), pending: w({ frame: A, source_check: sc(true, '2026-11-19T11:40:00Z'), collection: { outcome: 'published', frame_time: A.source_frame_time } }, A, T),
          earlier: w({ frame: A, source_check: sc(true, A.source_frame_time), limits: lim }, O, T), back: w({ frame: A, source_check: sc(true, O.source_frame_time), limits: lim }, A, T), backOld: w({ frame: A, source_check: sc(true, O.source_frame_time), limits: lim }, A, T + 20 * 60e3),
          earlierFailed: w({ frame: A, source_check: sc(false) }, O, T), earlierStale: w({ frame: A, source_check: sc(true, A.source_frame_time), limits: lim }, O, T + 3600e3), earlierListed: w({ frame: A, source_check: sc(true, '2026-11-19T11:40:00Z'), collection: { outcome: 'failed', frame_time: '2026-11-19T11:40:00Z' } }, O, T), earlierQuiet: w({ frame: A, source_check: sc(true, A.source_frame_time, '2026-11-19T12:55:00Z'), limits: lim }, O, T + 3600e3), none: w({ frame: null, source_check: sc(true, null) }, null, T), nocheck: w({ frame: A, source_check: null }, A, T) }; });
      ok('L1 current + waiting', r.cur.head === 'Current: the newest frame the source lists' && r.cur.lines[0] === 'Waiting for the next frame.' && !r.cur.offer, r.cur);
      ok('L2 a check older than 25 minutes is not "current"', r.old.head === 'Showing the last verified frame' && /Whether a newer frame exists is unknown/.test(r.old.lines[0]), r.old);
      ok('L3 a recent check, the newest frame older than the limit: "nothing newer than"', r.later.head === 'Current: the newest frame the source lists' && r.later.lines[0] === 'The source has listed nothing newer than the 11:30 UTC frame.', r.later);
      ok('L4 failed check', r.failed.lines[0] === 'We could not check the source at 11:55 UTC. Whether a newer frame exists is unknown.', r.failed);
      ok('L5 newer listed and its collection failed', r.listed.lines[0] === 'A newer frame (11:40 UTC) is listed, but our collection failed. Showing 11:30 UTC.', r.listed);
      ok('L6 newer listed, not yet collected, no failure on record for it: no failure is claimed', r.pending.lines[0] === 'A newer frame (11:40 UTC) is listed. It has not been collected yet.', r.pending);
      ok('L7 looking at an earlier frame: offered the newer one, not called current, and not told to wait for one', r.earlier.head === 'Showing an earlier frame' && r.earlier.offer && r.earlier.offer.id === 'a' && r.earlier.lines[0] === 'The newest frame the source lists is 11:30 UTC.' && !/Waiting/.test(r.earlier.lines.join(' ')), r.earlier);
      ok('L7a a list that ends earlier than a verified frame is never "current"', r.back.head === 'Showing the last verified frame' && /^At 11:55 UTC the source’s list ended at 11:00 UTC, earlier than the 11:30 UTC frame already verified\./.test(r.back.lines[0]) && r.back.lines.length === 1 && r.backOld.head === 'Showing the last verified frame', r.back);
      ok('L7b an earlier frame with a failed check, a stale check, a failed collection: the heading stays "Showing an earlier frame" and each fact has its own line', [r.earlierFailed, r.earlierStale, r.earlierListed, r.earlierQuiet].every(x => x.head === 'Showing an earlier frame' && x.offer) && /could not check/.test(r.earlierFailed.lines[0]) && /Our last check/.test(r.earlierStale.lines[0]) && r.earlierListed.lines[0] === 'A newer frame (11:40 UTC) is listed, but our collection failed. Showing 11:00 UTC.' && r.earlierQuiet.lines[0] === 'The source has listed nothing newer than the 11:30 UTC frame.', [r.earlierFailed, r.earlierStale, r.earlierListed, r.earlierQuiet]);
      ok('L8 nothing verified', r.none.head === 'No verified picture is available', r.none); ok('L9 no check on record: no claim either way', r.nocheck.head === 'Showing the last verified frame' && r.nocheck.lines[0] === 'No source check is on record.', r.nocheck); await q.context().close(); }
  } catch (e) { fail++; console.log('FAIL suite stopped on an error: ' + String(e && e.stack || e).split('\n').slice(0, 4).join(' | ')); }
  await b.close(); srv.kill();
  console.log(`earthview-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
