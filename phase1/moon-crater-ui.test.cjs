/* Moon tab CRaTER event counts (moon.html, mooncrater.js, mooncrater.css) — real globe.gl 2.45.0 under SwiftShader, real craft.js with the
 * dated example served as the hub would. MOON-CRATER-PROPOSAL rev 2 §7, §11-§13; GPT's rev 2 build notes 2-4.
 *  A. off by default: no request for the CRaTER file, panel hidden, toggle not pressed
 *  B. opening: one request; every table row equals the file (N, N/T to 2 dp, sqrt(N)/T to 2 dp); readout at the drawing's default time
 *  C. the drawing's slider selects the group containing its time: 00:00, 00:09, 00:10, 12:49, 23:59, and 11 June 00:00 (the extra group,
 *     labelled); prev/next buttons too; a selection that is not the dated example selects nothing
 *  D. a withheld group (served payload with group 12 withheld, pin adjusted): hatched gap, "no value" with its reason and counts, no value line
 *  E. failures: 404, integrity, unreadable, wrong form (several), timeout — each shows its reason and Retry; Retry recovers; the drawing,
 *     its slider and the globe stay usable; nothing is drawn from a failed load
 *  F. lifecycle: closed while loading (late answer dropped, stays closed); reopened (the older answer cannot replace the newer); an
 *     answer after the deadline does not reopen the chart; loaded once, reopened from memory
 *  G. independence: the drawing's selection, the dated path toggle and the globe are unchanged by opening/closing the chart
 *  H. keyboard: toggle reachable and operable; focus stays on it; table text alternative present
 *  I. narrow 360/390/721 px: no sideways overflow; chart drawn at its own width; axis text at least 10 px tall
 * Run: node phase1/moon-crater-ui.test.cjs [base-url]   (python3 -m http.server 8899 --bind 127.0.0.1 on the tree under test)
 * BREAK=eager|nopin|edge|late|nodeadline|zero|shape|bench|rev|retry|extra must each fail; a missing pattern stops the suite (exit 2). */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const BASE = process.argv[2] || 'http://127.0.0.1:8899', BREAK = process.env.BREAK || '';
const ROOT = path.join(__dirname, '..'), HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const R1B = fs.readFileSync(path.join(ROOT, 'phase1/skycraft/catalogue/craft-moon-2026-06-R1.json'));
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const ASSET = fs.readFileSync(path.join(ROOT, 'assets/moon/crater/crater-good-2026-06-10-R1.json'));
const DATA = JSON.parse(ASSET);
const JS = fs.readFileSync(path.join(ROOT, 'mooncrater.js'), 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0, brkSeen = false;
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL  ', name, info !== undefined ? JSON.stringify(info).slice(0, 400) : ''); } };
const f2 = x => x.toFixed(2);
const MON = 'June 2026';
function patchJs(s, o = {}) {
  const B = (a, b) => { if (!s.includes(a)) throw new Error('break pattern missing: ' + a); s = s.replace(a, b); brkSeen = true; };
  if (BREAK === 'eager') B("S.sel = (window.ME && window.ME.craftSelection) || null;", "S.sel = (window.ME && window.ME.craftSelection) || null; fetch(URL_);");
  if (BREAK === 'nopin') B("if (await sha256(buf) !== SHA) throw new Error('the file failed its integrity check');", '');
  if (BREAK === 'edge') B('i = Math.floor((t - START) / BIN_MS);', 'i = Math.round((t - START) / BIN_MS);');
  // late answers: every protection removed together (close/reopen aborts, the in-flight checks and the final check); removing any one
  // alone changes no user path, because the others still drop the answer, so a single removal is not counted as a break
  if (BREAK === 'late') { B('if (!on) { S.tok++; if (S.ctl) S.ctl.abort();', 'if (!on) { S.tok++;'); B('if (S.ctl) S.ctl.abort();\n    const ctl', 'const ctl');
    B("const buf = await r.arrayBuffer(); if (tok !== S.tok) return null;", 'const buf = await r.arrayBuffer();');
    B("throw new Error('the file failed its integrity check'); if (tok !== S.tok) return null;", "throw new Error('the file failed its integrity check');");
    B('if (tok !== S.tok || !S.on || !g) return;', 'if (!g) return;'); }
  if (BREAK === 'nodeadline') B('const g = await Promise.race([work, deadline]);', 'const g = await work;');
  if (BREAK === 'zero') B("if (b.withheld) { s += `<rect class=\"crw\"", "if (b.withheld) { b = { rate: 0, bench: 0 }; } if (false) { s += `<rect class=\"crw\"");
  if (BREAK === 'shape') B('if (!Array.isArray(j.rows) || j.rows.length !== NB) return null;', 'if (!Array.isArray(j.rows)) return null;');
  if (BREAK === 'bench') B('bench: Math.sqrt(r[0]) / r[1]', 'bench: Math.sqrt(r[0] / r[1])');
  if (BREAK === 'rev') B("if (!sel || sel.kind !== 'example' || sel.rev !== CRAFT_REV)", 'if (!sel)');
  if (BREAK === 'retry') B("retry.hidden = state !== 'failed';", 'retry.hidden = true;');
  if (BREAK === 'extra') B("${i === NB - 1 ? ' (the extra group)' : ''}", '');
  if (o.sha) { const a = "const SHA = '" + sha(ASSET) + "';"; if (!s.includes(a)) throw new Error('pin pattern missing'); s = s.replace(a, "const SHA = '" + o.sha + "';"); }
  if (o.timeout) { const a = 'const TIMEOUT_MS = 10000;'; if (!s.includes(a)) throw new Error('timeout pattern missing'); s = s.replace(a, `const TIMEOUT_MS = ${o.timeout};`); }
  return s;
}

let br = null;
(async () => {
  br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async (opt = {}) => {
    const ctx = await br.newContext({ viewport: { width: opt.w || 1100, height: opt.h || 1200 }, reducedMotion: 'reduce' });
    const hits = { crater: 0, hub: [] };
    await ctx.route(/fonts\.googleapis/, r => r.abort());
    await ctx.route(HUB + '/**', r => { const u = new URL(r.request().url()); hits.hub.push(u.pathname);
      if (u.pathname === '/catalogue/skycraft/craft-moon-2026-06-R1') return r.fulfill({ status: 200, contentType: 'application/json', body: R1B });
      return r.fulfill({ status: 404, body: '' }); });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/mooncrater.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: patchJs(JS, opt) }));
    await ctx.route('**/assets/moon/crater/crater-good-2026-06-10-R1.json*', async r => { hits.crater++; const n = hits.crater;
      const a = (opt.asset && (typeof opt.asset === 'function' ? opt.asset(n) : opt.asset)) || {};
      if (a.delay) await new Promise(res => setTimeout(res, a.delay));
      if (a.hang) return;
      if (a.status) return r.fulfill({ status: a.status, body: '' }).catch(() => {});
      r.fulfill({ status: 200, contentType: 'application/json', body: a.body || ASSET }).catch(() => {}); });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(BASE + '/moon.html' + (opt.q || ''), { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.ME && ME.craftState && ME.craftState().status === 'ready', null, { timeout: 20000 });
    return { ctx, p, errs, hits, close: () => ctx.close() };
  };
  const cs = p => p.evaluate(() => ME.craterState());
  const waitState = (p, s, t = 12000) => p.waitForFunction(x => ME.craterState().state === x, s, { timeout: t }).catch(() => {});
  const setMinute = (p, i) => p.evaluate(i => { const r = document.getElementById('craft-range'); r.value = String(i); r.dispatchEvent(new Event('input', { bubbles: true })); }, i);
  const rowsN = DATA.rows;

  // ---------- A
  {
    const T = await mk();
    await T.p.waitForTimeout(1200);
    const s = await cs(T.p);
    ok('A1 off by default: no CRaTER request, panel hidden, toggle not pressed', T.hits.crater === 0 && !s.on && s.state === 'off'
      && await T.p.evaluate(() => document.getElementById('cr-panel').hidden && document.getElementById('cr-toggle').getAttribute('aria-pressed') === 'false'), { hits: T.hits.crater, s });
    ok('A2 the hub is asked only for the dated example (CRaTER adds no hub request)', T.hits.hub.every(x => x === '/catalogue/skycraft/craft-moon-2026-06-R1'), T.hits.hub);

    // ---------- B
    await T.p.click('#cr-toggle'); await waitState(T.p, 'shown');
    const s2 = await cs(T.p);
    ok('B1 opening loads the file once and shows the chart', s2.state === 'shown' && T.hits.crater === 1 && s2.n === 145, { s2, hits: T.hits.crater });
    const table = await T.p.$$eval('#cr-tbody tr', trs => trs.map(tr => [...tr.children].map(c => c.textContent)));
    const exp = rowsN.map(r => [String(r[0]), f2(r[0] / r[1]), '±' + f2(Math.sqrt(r[0]) / r[1])]);
    ok('B2 table: 145 rows, each equal to the file (N, N/T, sqrt(N)/T at 2 dp)', table.length === 145 && table.every((t, i) => t[1] === exp[i][0] && t[2] === exp[i][1] && t[3] === exp[i][2]), { first: table[0], exp: exp[0] });
    ok('B3 table labels: first, 12:50 and the extra group', table[0][0] === '10 June 2026, 00:00–00:10 UTC' && table[77][0] === '10 June 2026, 12:50–13:00 UTC' && table[143][0] === '10 June 2026, 23:50–24:00 UTC' && table[144][0] === '11 June 2026, 00:00–00:10 UTC (the extra group)', [table[0][0], table[77][0], table[143][0], table[144][0]]);
    const r72 = rowsN[72];
    ok('B4 readout at the drawing\'s default time (12:00) names the group, value, benchmark, events and seconds', s2.bin === 72 && s2.readout.includes('10 June 2026, 12:00–12:10 UTC') && s2.readout.includes(`${f2(r72[0] / 600)} events a second`) && s2.readout.includes(`±${f2(Math.sqrt(r72[0]) / 600)} approximate counting benchmark`) && s2.readout.includes(`${r72[0].toLocaleString('en-GB')} events in 600 s`) && s2.readout.includes('not a dose or a surface value'), s2.readout);
    const lines = await T.p.$$eval('#cr-svg line.crv', ls => ls.map(l => +l.getAttribute('y1')));
    ok('B5 one value line per shown group, highest drawn at the 12:50 group', lines.length === 145 && lines.indexOf(Math.min(...lines)) === 77, { n: lines.length });
    ok('B6 y axis starts at zero (ticks 0-40)', (await T.p.$$eval('#cr-svg text.crt', ts => ts.map(t => t.textContent))).filter(x => /^\d+$/.test(x)).join() === '0,10,20,30,40');
    const wording = await T.p.evaluate(() => document.getElementById('cr-panel').textContent);
    ok('B7 wording: instrument counts, not dose/flux/surface; benchmark not total uncertainty; grouping; no live-time correction; archived, not live',
      ['not a radiation dose, a particle flux or conditions at a place on the Moon’s surface', 'the causes of its variation have not been determined here', 'approximate counting benchmark', 'do not cover the scatter seen between groups', 'by UTC record time', 'No live-time correction', 'not a live reading', '10.17189/2c1t-ph72'].every(x => wording.includes(x))
      && !/cosmic ray|quiet day|radiation level|safe/i.test(wording), wording.slice(0, 200));

    // ---------- C
    const sel = async (i, bin, lab) => { await setMinute(T.p, i); await T.p.waitForTimeout(60); const s = await cs(T.p);
      ok(`C minute ${i} selects group ${bin}${lab ? ' (' + lab + ')' : ''}`, s.bin === bin && (!lab || s.readout.includes(lab)), { bin: s.bin, readout: s.readout.slice(0, 90) }); };
    await sel(0, 0, '10 June 2026, 00:00–00:10 UTC'); await sel(9, 0); await sel(10, 1, '00:10–00:20'); await sel(769, 76, '12:40–12:50');
    await sel(1439, 143, '23:50–24:00'); await sel(1440, 144, '11 June 2026, 00:00–00:10 UTC (the extra group)');
    await T.p.click('#craft-prev'); await T.p.waitForTimeout(60);
    ok('C7 the drawing\'s Earlier button moves the selection back to group 143', (await cs(T.p)).bin === 143);
    const hl = await T.p.$eval('#cr-svg rect.crsel', r => +r.getAttribute('x')).catch(() => null);
    ok('C8 the selected group is highlighted on the chart', hl !== null);
    await T.p.evaluate(() => document.dispatchEvent(new CustomEvent('me:craft-select', { detail: { kind: 'hub', rev: 'other', t: '2026-06-10T05:00:00Z' } })));
    const s3 = await cs(T.p);
    ok('C9 a selection that is not the dated example selects no group', s3.bin === -1 && /no time from this dated record/.test(s3.readout), s3);
    await T.p.evaluate(() => document.dispatchEvent(new CustomEvent('me:craft-select', { detail: null })));
    ok('C10 no selection (drawing cleared) selects no group', (await cs(T.p)).bin === -1);

    // ---------- G
    await setMinute(T.p, 600); await T.p.waitForTimeout(60);
    const before = await T.p.evaluate(() => ({ c: ME.craftState().i, t: ME.craftState().t }));
    await T.p.click('#cr-toggle'); await T.p.click('#cr-toggle'); await T.p.waitForTimeout(100);
    const after = await T.p.evaluate(() => ({ c: ME.craftState().i, t: ME.craftState().t }));
    ok('G1 opening and closing the chart leaves the drawing\'s selection unchanged', before.c === after.c && before.t === after.t && before.c === 600, { before, after });
    ok('F4 reopened from memory: no second request', T.hits.crater === 1 && (await cs(T.p)).state === 'shown');
    // ---------- H
    await T.p.focus('#cr-toggle'); await T.p.keyboard.press('Enter'); await T.p.waitForTimeout(60);
    let s4 = await cs(T.p);
    ok('H1 keyboard: Enter on the toggle closes it; focus stays on the toggle', !s4.on && await T.p.evaluate(() => document.activeElement.id === 'cr-toggle'));
    await T.p.keyboard.press('Space'); await T.p.waitForTimeout(60); s4 = await cs(T.p);
    ok('H2 keyboard: Space reopens it; aria-pressed follows', s4.on && s4.state === 'shown' && await T.p.evaluate(() => document.getElementById('cr-toggle').getAttribute('aria-pressed') === 'true'));
    ok('H3 text alternative: chart labelled, table of all groups, readout announced politely',
      await T.p.evaluate(() => { const s = document.getElementById('cr-svg'); return s.getAttribute('role') === 'img' && s.getAttribute('aria-labelledby') === 'cr-h cr-alt' && document.getElementById('cr-read').getAttribute('aria-live') === 'polite' && !!document.querySelector('#cr-fig details summary'); }));
    const lroOk = await T.p.evaluate(() => { const b = document.getElementById('mg-lro'); if (!b) return 'no button'; b.click(); const on = b.getAttribute('aria-pressed'); b.click(); return on; });
    ok('G2 the dated-path toggle on the globe still works with the chart open', lroOk === 'true', lroOk);
    ok('K1 no page errors (main run)', T.errs.length === 0, T.errs);
    await T.close();
  }

  // ---------- D withheld group
  {
    const W = JSON.parse(ASSET); W.rows[12] = [null, null, 'non-nominal setting', 600, 599];
    const body = Buffer.from(JSON.stringify(W) + '\n');
    const T = await mk({ asset: { body }, sha: sha(body) });
    await T.p.click('#cr-toggle'); await waitState(T.p, 'shown');
    await setMinute(T.p, 125); await T.p.waitForTimeout(60);
    const s = await cs(T.p);
    ok('D1 a withheld group reads "no value" with its reason and counts', s.bin === 12 && /no value/.test(s.readout) && /not in its nominal settings/.test(s.readout) && /600 of 600 records, 599 nominal/.test(s.readout), s.readout);
    const d = await T.p.evaluate(() => ({ hatch: document.querySelectorAll('#cr-svg rect.crw').length, lines: document.querySelectorAll('#cr-svg line.crv').length, row: document.querySelectorAll('#cr-tbody tr')[12].textContent }));
    ok('D2 drawn as one hatched gap, no value line for it (144 lines), table says no value', d.hatch === 1 && d.lines === 144 && /no value/.test(d.row) && !/\b0\.00\b/.test(d.row), d);
    await T.close();
  }

  // ---------- E failures
  const failCase = async (name, opt, reason) => {
    const T = await mk(opt);
    await T.p.click('#cr-toggle'); await waitState(T.p, 'failed', 15000);
    const s = await cs(T.p);
    const ui = await T.p.evaluate(() => ({ retry: !document.getElementById('cr-retry').hidden, fig: document.getElementById('cr-fig').hidden, lines: document.querySelectorAll('#cr-svg line.crv').length, st: document.getElementById('cr-state').textContent }));
    ok(`E ${name}: fails with its reason, Retry shown, nothing drawn`, s.state === 'failed' && s.why === reason && ui.retry && ui.fig && ui.lines === 0 && ui.st.includes('The drawing above is not affected'), { s, ui });
    return T;
  };
  {
    const T = await failCase('404', { asset: n => n === 1 ? { status: 404 } : {} }, 'the file did not load');
    await setMinute(T.p, 30); await T.p.waitForTimeout(60);
    ok('E1b the drawing and its slider keep working after the chart failed', await T.p.evaluate(() => ME.craftState().i === 30 && ME.craftState().status === 'ready'));
    if (await T.p.isVisible('#cr-retry')) { await T.p.click('#cr-retry'); await waitState(T.p, 'shown'); } else ok('E1c Retry available', false);
    const s = await cs(T.p);
    ok('E1c Retry recovers and selects the drawing\'s current group', s.state === 'shown' && s.bin === 3 && T.hits.crater === 2, s);
    await T.close();
  }
  { const bad = Buffer.from(ASSET.toString().replace('"release":67', '"release":68')); const T = await failCase('integrity (bytes differ from the pin)', { asset: { body: bad } }, 'the file failed its integrity check'); await T.close(); }
  { const b = Buffer.from('{"schema":'); const T = await failCase('unreadable JSON (pin adjusted)', { asset: { body: b }, sha: sha(b) }, 'the file could not be read'); await T.close(); }
  for (const [name, mut] of [['144 rows', j => j.rows.pop()], ['negative N', j => { j.rows[5][0] = -1; }], ['T 599', j => { j.rows[5][1] = 599; }],
    ['unknown withheld reason', j => { j.rows[5] = [null, null, 'other', 600, 600]; }], ['live-time flag true', j => { j.binning.live_time_correction = true; }],
    ['wrong revision', j => { j.revision = 'crater-good-2026-06-10-R2'; }], ['nominal > records', j => { j.rows[5] = [null, null, 'incomplete', 599, 600]; }]]) {
    const J = JSON.parse(ASSET); mut(J); const b = Buffer.from(JSON.stringify(J));
    const T = await failCase('wrong form: ' + name + ' (pin adjusted)', { asset: { body: b }, sha: sha(b) }, 'the file is not in the expected form'); await T.close();
  }
  {
    const T = await failCase('timeout (deadline 1.5 s, server hangs)', { asset: n => n === 1 ? { hang: true } : {}, timeout: 1500 }, 'it took too long');
    await T.close();
  }

  // ---------- F lifecycle
  {
    const T = await mk({ asset: { delay: 1500 } });
    await T.p.click('#cr-toggle'); await T.p.waitForTimeout(200); await T.p.click('#cr-toggle');
    await T.p.waitForTimeout(2200);
    const s = await cs(T.p);
    ok('F1 closed while loading: the late answer is dropped and the chart stays closed', !s.on && s.state === 'off' && await T.p.evaluate(() => document.getElementById('cr-panel').hidden && document.querySelectorAll('#cr-svg line.crv').length === 0), s);
    await T.close();
  }
  {
    // first request slow and altered (would fail integrity), second fast and good: only the second may decide the result
    const bad = Buffer.from(ASSET.toString().replace('"release":67', '"release":68'));
    const T = await mk({ asset: n => n === 1 ? { delay: 2000, body: bad } : { delay: 100 } });
    await T.p.click('#cr-toggle'); await T.p.waitForTimeout(150); await T.p.click('#cr-toggle'); await T.p.click('#cr-toggle');
    await waitState(T.p, 'shown'); await T.p.waitForTimeout(2300);
    const s = await cs(T.p);
    ok('F2 reopened while the first answer was pending: the older answer cannot replace the newer one', s.state === 'shown' && s.why === '' && T.hits.crater === 2, s);
    await T.close();
  }
  {
    const T = await mk({ asset: n => n === 1 ? { delay: 2500 } : {}, timeout: 1000 });
    await T.p.click('#cr-toggle'); await waitState(T.p, 'failed', 5000); await T.p.waitForTimeout(2200);
    const s = await cs(T.p);
    ok('F3 an answer arriving after the deadline does not reopen or fill the chart', s.state === 'failed' && s.why === 'it took too long' && await T.p.evaluate(() => document.querySelectorAll('#cr-svg line.crv').length === 0), s);
    ok('K2 no page errors (lifecycle)', T.errs.length === 0, T.errs);
    await T.close();
  }

  // ---------- I narrow
  for (const w of [360, 390, 721]) {
    const T = await mk({ w, h: 900 });
    await T.p.click('#cr-toggle'); await waitState(T.p, 'shown');
    const m = await T.p.evaluate(() => { const svg = document.getElementById('cr-svg'), vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
      const t = [...svg.querySelectorAll('text.crt')].map(x => x.getBoundingClientRect().height);
      return { sw: document.documentElement.scrollWidth, iw: innerWidth, vbw: vb.width, w: r.width, minText: Math.min(...t) }; });
    ok(`I ${w} px: no sideways overflow; chart drawn at its own width; axis text at least 10 px tall`, m.sw <= m.iw && Math.abs(m.vbw - m.w) <= 1.5 && m.minText >= 10, m);
    await T.close();
  }

  // ---------- J a time outside the record
  {
    const T = await mk({ q: '?t=2026-06-12T00:00:00Z' });
    await T.p.click('#cr-toggle'); await waitState(T.p, 'shown');
    const s = await cs(T.p);
    ok('J1 a page opened at a time outside the dated example: chart shown, no group selected, said in words', s.bin === -1 && /no time from this dated record/.test(s.readout), s);
    await T.close();
  }

  if (BREAK && !brkSeen) { console.log('SETUP FAIL: break pattern not applied: ' + BREAK); process.exitCode = 2; }
  else if (BREAK) console.log('BREAK applied (pattern found): ' + BREAK);
  console.log(`moon-crater-ui: ${pass} passed, ${fail} failed`);
  await br.close();
  if (fail) process.exitCode = 1;
})().catch(async e => { console.log('SETUP FAIL', e && e.message); if (BREAK) console.log(brkSeen ? 'BREAK applied (pattern found): ' + BREAK : 'break pattern not applied: ' + BREAK); console.log(`moon-crater-ui (stopped early): ${pass} passed, ${fail} failed`); process.exitCode = 2; try { if (br) await br.close(); } catch (_) { } });
