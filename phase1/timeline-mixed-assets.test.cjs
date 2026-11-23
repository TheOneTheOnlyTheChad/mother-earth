/*
 * Shared stylesheet and mixed builds (docs/concepts/TIMELINE-TRAVEL-PROPOSAL.md rev 2.1 §3, "Shared stylesheet").
 *  1. The other five pages are laid out identically with the stylesheet from commit a44e31d and with this checkout's
 *     (every element's box, colours, font size and display; hub and outside hosts blocked, clock fixed).
 *  2. Timeline files from different builds fail safe: the earlier page and script still draw properly from this
 *     stylesheet; a page, script or stylesheet that does not belong to the same build leaves the list as the only view.
 * Break (must make the suite fail): BREAK=no-style-guard
 * Run: NODE_PATH=/opt/npm-tools/node_modules node --no-warnings phase1/timeline-mixed-assets.test.cjs  (static server on 8899;
 *   needs commit a44e31d in the clone)
 */
const { chromium } = require('playwright'); const { execFileSync } = require('child_process'); const fs = require('fs');
const ROOT = require('path').resolve(__dirname, '..'), BASE = process.argv[2] || 'http://127.0.0.1:8899';
const old = f => execFileSync('git', ['show', 'a44e31d:' + f], { cwd: ROOT, maxBuffer: 1 << 26 }).toString();
const GUARD = "styled = getComputedStyle(E.xpl).touchAction === 'pan-y';";
const cur = f => { let t = fs.readFileSync(ROOT + '/' + f, 'utf8');   // BREAK=no-style-guard must make this suite fail
  if (process.env.BREAK === 'no-style-guard' && f === 'timeline.js') { if (t.split(GUARD).length !== 2) throw new Error('break anchor missing'); t = t.replace(GUARD, 'styled = true;'); } return t; };
const CATOF = u => fs.readFileSync(ROOT + '/phase1/timeline/catalogue/' + u.split('/').pop() + '.json');   // each page asks for its own revision by name
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const boxes = async (page, css, w, h) => { const c = await b.newContext({ viewport: { width: w, height: h } });
    await c.route(/fonts\.googleapis|unpkg|gibs|jsdelivr|workers\.dev|nasa|eumetsat/, r => r.abort());
    await c.route(/style\.css/, r => r.fulfill({ contentType: 'text/css', body: css }));
    await c.addInitScript(() => { const D = Date, t0 = 1795000000000; Date.now = () => t0; });
    const p = await c.newPage(); await p.goto(BASE + '/' + page, { waitUntil: 'load' }); await p.waitForTimeout(1200);
    const r = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => !e.closest('#clock, canvas, .clock')).map(e => { const q = e.getBoundingClientRect(), s = getComputedStyle(e); return [e.tagName, e.id, Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height), s.color, s.backgroundColor, s.fontSize, s.display].join('|'); }));
    await c.close(); return r; };
  for (const page of ['index.html', 'sources.html', 'moon.html', 'sun.html', 'animals.html']) for (const [w, h] of [[1280, 860], [390, 844]]) {
    const a = await boxes(page, old('style.css'), w, h), a2 = await boxes(page, old('style.css'), w, h), n = await boxes(page, cur('style.css'), w, h);
    const diff = (x, y) => x.length !== y.length ? -1 : x.filter((v, i) => v !== y[i]).length;
    const noise = diff(a, a2), d = diff(a, n);
    if (d !== 0) bad++;
    console.log(`${page} ${w}: ${a.length} elements; old vs old again: ${noise} differ; old vs branch stylesheet: ${d} differ`);
  }
  // mixed Timeline assets
  for (const [nm, html, js, css, want] of [['new page + new script + OLD stylesheet', cur('timeline.html'), cur('timeline.js'), old('style.css'), 'off:stylesheet'], ['OLD page + OLD script + new stylesheet', old('timeline.html'), old('timeline.js'), cur('style.css'), 'on'],
    ['new page + OLD script', cur('timeline.html'), old('timeline.js'), cur('style.css'), 'off:build'], ['OLD page + new script', old('timeline.html'), cur('timeline.js'), cur('style.css'), 'off:build']]) for (const w of [1280, 390]) {
    const c = await b.newContext({ viewport: { width: w, height: 844 } });
    await c.route(/fonts\.googleapis|unpkg|gibs|jsdelivr/, r => r.abort());
    await c.route(/workers\.dev\/catalogue\/timeline/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: CATOF(r.request().url()) }));
    await c.route(/timeline\.html/, r => r.fulfill({ contentType: 'text/html', body: html })); await c.route(/timeline\.js/, r => r.fulfill({ contentType: 'application/javascript', body: js })); await c.route(/style\.css/, r => r.fulfill({ contentType: 'text/css', body: css }));
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(BASE + '/timeline.html'); await p.waitForFunction(() => window.TL_AXIS && window.TL_AXIS.state !== 'pending'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({ st: window.TL_AXIS.state + (window.TL_AXIS.reason ? ':' + window.TL_AXIS.reason : ''), sw: document.documentElement.scrollWidth, iw: innerWidth, cards: document.querySelectorAll('#dated .card').length, offMsg: !document.getElementById('axis-off').hidden }));
    await p.click('#dated .card .ctitle a'); await p.waitForTimeout(200); const opened = await p.evaluate(() => !document.getElementById('detail').hidden);
    const good = r.st === want && r.sw <= r.iw && r.cards === 5 && opened && errs.length === 0 && (want === 'on' || r.offMsg);
    if (!good) bad++;
    console.log(`${good ? 'ok  ' : 'FAIL'} mixed ${w}: ${nm}: axis ${r.st}; overflow ${r.sw > r.iw}; list cards ${r.cards}; a card opens ${opened}; page errors ${errs.length}`);
    await c.close();
  }
  await b.close(); console.log(`timeline-mixed-assets: ${18 - bad} pass, ${bad} fail`); process.exit(bad ? 1 : 0);
})();
