/* Mother Earth — Met catalogue sample card, page side (Arts release proposal rev 2.1 §7 Page + Accessibility + Layout).
 * Real index.html + app.js + arts.js served locally; hub routed to the generated file phase1/arts/met-R1-e394878.json
 * and to fault fixtures; real globe.gl 2.45.0 (SwiftShader). Accessibility checks use Playwright's accessibility
 * tree (role, name, expanded state, aria-controls) — NOT what a screen reader announces.
 * Run:   node phase1/arts-ui.test.cjs                (needs the 8899 server in the repo and /home/claude/spike)
 * Break: BREAK=no-consistency | eager | no-warning | no-aria | show-retrieval | css-hidden  node phase1/arts-ui.test.cjs   → must FAIL
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const FILE = fs.readFileSync(path.join(__dirname, 'arts/met-R1-e394878.json'), 'utf8');
const J = JSON.parse(FILE);
let ARTS_JS = fs.readFileSync(path.join(__dirname, '..', 'arts.js'), 'utf8');
const BREAKS = {
  'no-consistency': ['    if (!reason) reason = consistency(j);', '    // (break) consistency check removed'],
  'eager': ["  $('tgl-arts').addEventListener('click', () => setOn(!st.on));", "  $('tgl-arts').addEventListener('click', () => setOn(!st.on)); setOn(true);"],
  'no-warning': ["      + `<div class=\"arts-warn\">Sensitivity not fully assessed${labs.length ? '' : ' — ' + esc(sens.unlabelled)}</div>`", "      + ''"],
  'no-aria': ["    b.setAttribute('aria-expanded', String(open));", "    // (break) aria-expanded not updated"],
  'css-hidden': null,
  'show-retrieval': ["      : s === 'ok' ? `loaded — source CSV of 2 Nov 2026 (commit e394878) · view prepared 7 Nov 2026`", "      : s === 'ok' ? `loaded ${new Date().toISOString()}`"],
};
const B = process.env.BREAK;
let CSS_BREAK = B === 'css-hidden';
if (B && !CSS_BREAK) { const [a, b] = BREAKS[B]; if (!ARTS_JS.includes(a)) throw new Error('break anchor missing: ' + B); ARTS_JS = ARTS_JS.replace(a, b); }

const RUN = new Date(Date.now() - 60e3).toISOString();
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 400)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 6 min — failure, not a hang'); process.exit(1); }, 6 * 60e3);

const mutate = f => { const j = JSON.parse(FILE); f(j); return JSON.stringify(j); };
const FIX = {
  ok: () => ({ status: 200, body: FILE }),
  integrity503: () => ({ status: 503, body: JSON.stringify({ kind: 'catalogue_snapshot', layer: 'arts', status: 'unavailable', reason: 'integrity' }) }),
  missing503: () => ({ status: 503, body: JSON.stringify({ kind: 'catalogue_snapshot', layer: 'arts', status: 'unavailable', reason: 'missing' }) }),
  plain500: () => ({ status: 500, body: 'oops' }),
  idMismatch: () => ({ status: 200, body: mutate(j => { j.snapshot_id = 'f'.repeat(64); }) }),
  shortRecords: () => ({ status: 200, body: mutate(j => { j.records.pop(); }) }),
  sumMismatch: () => ({ status: 200, body: mutate(j => { j.counts.by_country[0][1] -= 1; }) }),
  notJson: () => ({ status: 200, body: '{"kind":' }),
  abort: () => null,
  hostile: () => ({ status: 200, body: mutate(j => { j.records[0].object_name = '<img src=x onerror="window.__xss=1">'; }) }),
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const run = async (viewport, mode = 'ok', delayMs = 0) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const hits = [], external = [];
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(/metmuseum\.org|metmuseum\.github|githubusercontent/, r => { external.push(r.request().url()); r.abort(); });
    await ctx.route(BASE + '/arts.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: ARTS_JS }));
    if (CSS_BREAK) await ctx.route(BASE + '/style.css*', async r => { const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8').replace('.arts-list[hidden],.arts-objs[hidden]{display:none}', ''); r.fulfill({ status: 200, contentType: 'text/css', body: css }); });
    await ctx.route(HUB + '/**', async route => {
      const p = new URL(route.request().url()).pathname; hits.push(p);
      if (p === '/snapshot/arts') {
        if (delayMs) await new Promise(r => setTimeout(r, delayMs));
        const f = FIX[mode](); if (!f) return route.abort();
        return route.fulfill({ status: f.status, contentType: 'application/json', body: f.body });
      }
      const body = p === '/snapshot/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: [['x', 10, 10, 10, 5, 'mb', RUN, 't', '']] }
        : p === '/cells/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { '25_47': { count: 1, coverage: { grade: 'adequate', evidence: 'e', observed_fraction: 1 } } } }
        : p.startsWith('/snapshot/orbital') || p.startsWith('/elements') ? null
        : { layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null };
      if (!body) return route.fulfill({ status: 404, body: '{}' });
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.arts && ME.pairState && ME.pairState('usgs').usgs.usable, null, { timeout: 30000 });
    await page.waitForTimeout(600);
    const artsHits = () => hits.filter(p => p === '/snapshot/arts').length;
    return { ctx, page, hits, external, perr, artsHits };
  };
  const status = page => page.evaluate(() => ME.arts.state());
  const waitStatus = (page, s) => page.waitForFunction(s => ME.arts.state().status === s, s, { timeout: 15000 }).then(() => true, () => false);
  const overflow = page => page.evaluate(() => ({ sw: document.scrollingElement.scrollWidth, w: innerWidth }));

  for (const vp of [{ width: 1280, height: 860, tag: 'desktop' }, { width: 390, height: 844, tag: 'phone 390' }]) {
    const T = s => `[${vp.tag}] ${s}`;
    const { ctx, page, external, perr, artsHits } = await run({ width: vp.width, height: vp.height });
    // ---- off on load
    ok(T('off on load: no /snapshot/arts request'), artsHits() === 0, artsHits());
    ok(T('off on load: switch off, list hidden (not rendered), status off'), (await status(page)).status === 'off' && await page.$eval('#arts-list', e => e.hidden && e.offsetParent === null) && await page.getAttribute('#tgl-arts', 'aria-checked') === 'false');
    const card = await page.$eval('#card-arts', e => e.innerText);
    ok(T('card: Catalogued label, never Observed/Computed'), /Catalogued/i.test(card) && !/\bObserved\b|\bComputed\b/i.test(await page.$eval('#card-arts .ovl-h', e => e.innerText)));
    ok(T('card: GPT sample wording visible'), card.includes("479 objects retained from a seeded 2,000-record sample of 59,137 Met records with typed geography. This filtered view draws from four departments; it does not represent the Met's whole collection or the world's art."));
    ok(T('card: present-day ≠ historical nationality; sensitivity not fully assessed'), /not historical nationality/.test(card) && /Sensitivity not fully assessed/.test(card));
    ok(T('card: source date and preparation date, separately'), card.includes('Source: Met Open Access CSV of 2 Nov 2026 (commit e394878) · view prepared 7 Nov 2026'));
    const scope = await page.$eval('#arts-scope', e => e.textContent);
    ok(T('every file limitation is reachable from the card (verbatim)'), J.limitations.every(l => scope.includes(l)), J.limitations.filter(l => !scope.includes(l)));
    ok(T('credit line in the footer (D7)'), (await page.$eval('#credits', e => e.innerText)).includes('Collection data: The Metropolitan Museum of Art Open Access (CC0), source CSV of 2 Nov 2026 (commit e394878)'));
    const key0 = await page.evaluate(() => ME.keyState().label);
    // ---- on
    if (vp.width <= 720) { await page.$eval('#card-arts', e => e.scrollIntoView()); }
    await page.click('#tgl-arts');
    ok(T('on → loads'), await waitStatus(page, 'ok'), await status(page));
    ok(T('on → exactly one request'), artsHits() === 1, artsHits());
    ok(T('on → 479 objects, 25 country rows'), (await status(page)).objects === 479 && await page.$$eval('.arts-row', b => b.length) === 25);
    const rowsN = await page.$$eval('.arts-row .n', s => s.map(x => +x.textContent));
    ok(T('row counts = file by_country, sum 479'), JSON.stringify(rowsN) === JSON.stringify(J.counts.by_country.map(x => x[1])) && rowsN.reduce((a, b) => a + b, 0) === 479, rowsN);
    ok(T('value line from the file'), (await page.textContent('#v-arts')) === '479 objects · 25 present-day countries');
    const obs = await page.textContent('#o-arts');
    ok(T('status shows source + preparation dates, never a fetch time'), obs.includes('source CSV of 2 Nov 2026') && obs.includes('view prepared 7 Nov 2026') && !obs.includes(J.published_file_generated_at) && !/\d\d:\d\d|ago|retriev/i.test(obs), obs);
    ok(T('Key count unchanged (nothing drawn on the globe)'), (await page.evaluate(() => ME.keyState().label)) === key0, [key0]);
    ok(T('nothing expanded yet: no object row is rendered visibly'), await page.$$eval('.arts-objs', u => u.every(x => x.hidden && x.offsetParent === null && x.getBoundingClientRect().height === 0)) && await page.$$eval('.arts-o', ls => ls.every(l => l.offsetParent === null)));
    // ---- accessibility tree: role, name, expanded, controls (not screen-reader announcement)
    const usa = page.getByRole('button', { name: /United States\s+USA\s+239/, expanded: false });
    ok(T('a11y tree: USA row is a button named with country, code and count, expanded=false'), await usa.count() === 1);
    const heads = await page.$$eval('.arts-row .nm', ns => ns.map(n => n.firstChild.textContent.trim()));
    ok(T('row headings = the file heading_text (CHN "China", no borrowed segment)'), heads.length === 25 && heads.every((h, i) => h === J.counts.heading_text[J.counts.by_country[i][0]]) && heads.includes('China') && !heads.some(h => h.includes('/')), heads);
    ok(T('row heading left-aligned (name starts at the row\'s left)'), await page.$eval('#arts-b-USA', b => { const n = b.querySelector('.nm').getBoundingClientRect(), r = b.getBoundingClientRect(); return n.left - r.left < 30; }));
    ok(T('a11y: every row has aria-controls pointing at its list'), await page.$$eval('.arts-row', bs => bs.every(b => { const t = document.getElementById(b.getAttribute('aria-controls')); return t && t.tagName === 'UL'; })));
    await page.focus('#arts-b-USA'); await page.keyboard.press('Enter');
    ok(T('Enter expands; a11y tree shows expanded=true; list rendered'), await page.getByRole('button', { name: /United States\s+USA/, expanded: true }).count() === 1 && await page.$eval('#arts-l-USA', e => !e.hidden && e.offsetParent !== null));
    ok(T('focus stays on the row after toggling'), await page.evaluate(() => document.activeElement && document.activeElement.id) === 'arts-b-USA');
    const usaItems = await page.$$eval('#arts-l-USA > li', ls => ls.map(l => l.innerText));
    ok(T('USA list has 239 objects'), usaItems.length === 239, usaItems.length);
    ok(T('every expanded object visibly shows "Sensitivity not fully assessed"'), await page.$$eval('#arts-l-USA > li', ls => ls.every(l => { const w = l.querySelector('.arts-warn'); return w && w.offsetParent !== null && /Sensitivity not fully assessed/.test(w.innerText); })));
    ok(T('every expanded object shows the Met wording + country verbatim and a Met link'), await page.$$eval('#arts-l-USA > li', ls => ls.every(l => l.querySelector('.arts-met') && /The Met: /.test(l.innerText) && l.querySelector('a.arts-link[target="_blank"][rel="noopener"]'))));
    const ov1 = await overflow(page); ok(T('no page overflow with the longest list open'), ov1.sw <= ov1.w, ov1);
    await page.keyboard.press(' ');
    ok(T('Space collapses; expanded=false; list not rendered'), await page.getByRole('button', { name: /United States\s+USA/, expanded: false }).count() === 1 && await page.$eval('#arts-l-USA', e => e.hidden && e.offsetParent === null));
    await page.keyboard.press('Tab');
    const nextFocus = await page.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.tagName + '.' + a.className) : null; });
    ok(T('Tab moves to the next country row'), nextFocus === 'arts-b-FRA', nextFocus);
    // expand every country: tentative labels and the unlabelled note
    for (const id of await page.$$eval('.arts-row', bs => bs.map(b => b.id))) if (await page.getAttribute('#' + id, 'aria-expanded') === 'false') await page.click('#' + id);
    const all = await page.$$eval('.arts-o', ls => ls.map(l => ({ lab: !!l.querySelector('.arts-lab'), warn: l.querySelector('.arts-warn') ? l.querySelector('.arts-warn').innerText : '' })));
    ok(T('all 479 expanded; 11 show a tentative label'), all.length === 479 && all.filter(x => x.lab).length === 11, [all.length, all.filter(x => x.lab).length]);
    ok(T('unlabelled objects say "does NOT mean not sensitive"; labelled ones do not'), all.every(x => x.lab ? !/does NOT mean/.test(x.warn) : /does NOT mean not sensitive/.test(x.warn)));
    ok(T('Yup\'ik mask 717572 present with its labels'), (await page.$eval('a[href$="/search/717572"]', a => a.closest('li').innerText)).includes('potential Indigenous source community'));
    const ov2 = await overflow(page); ok(T('no page overflow with every list open'), ov2.sw <= ov2.w, ov2);
    ok(T('no inner scrollbar on the list (one scrolling surface)'), await page.$eval('#arts-list', e => !['auto', 'scroll'].includes(getComputedStyle(e).overflowY)));
    ok(T('no request to any Met host or image (links are not followed)'), external.length === 0, external);
    // ---- off
    await page.click('#tgl-arts');
    ok(T('off → cleared, status off, no further request'), (await status(page)).status === 'off' && await page.$eval('#arts-list', e => e.hidden && e.innerHTML === '') && artsHits() === 1 && (await page.textContent('#v-arts')) === '–');
    ok(T('no page errors'), perr.length === 0, perr);
    await ctx.close();
  }

  // ---- failure paths: unavailable with a reason, never a number or a list
  for (const [mode, re] of [['integrity503', /unavailable — the hub reports integrity/], ['missing503', /unavailable — the hub reports missing/], ['plain500', /unavailable — the hub answered 500/],
    ['idMismatch', /unavailable — snapshot mismatch/], ['shortRecords', /unavailable — count mismatch/], ['sumMismatch', /unavailable — count mismatch/], ['notJson', /unavailable — invalid/], ['abort', /unavailable — the hub could not be reached/]]) {
    const { ctx, page } = await run({ width: 1280, height: 860 }, mode);
    await page.click('#tgl-arts'); await waitStatus(page, 'unavailable');
    const o = await page.textContent('#o-arts');
    ok(`[fault ${mode}] "${re.source}"`, re.test(o), o);
    ok(`[fault ${mode}] no list, no count shown`, await page.$eval('#arts-list', e => e.hidden && e.innerHTML === '') && (await page.textContent('#v-arts')) === '–');
    await ctx.close();
  }
  // ---- switched off while loading: stays off
  { const { ctx, page } = await run({ width: 1280, height: 860 }, 'ok', 1500);
    await page.click('#tgl-arts'); await page.waitForTimeout(200); await page.click('#tgl-arts'); await page.waitForTimeout(2500);
    ok('[race] off while loading → stays off, no list', (await status(page)).status === 'off' && await page.$eval('#arts-list', e => e.hidden));
    await ctx.close(); }
  // ---- text from the file is escaped
  { const { ctx, page } = await run({ width: 1280, height: 860 }, 'hostile');
    await page.click('#tgl-arts'); await waitStatus(page, 'ok');
    for (const id of await page.$$eval('.arts-row', bs => bs.map(b => b.id))) await page.click('#' + id);
    await page.waitForTimeout(300);
    ok('[escape] markup in a record is shown as text, not run', await page.evaluate(() => !window.__xss) && await page.$$eval('.arts-on', ls => ls.some(l => l.textContent.includes('<img src=x'))));
    await ctx.close(); }

  clearTimeout(wd); await browser.close();
  console.log(`\narts-ui: ${pass} passed, ${fail} failed${B ? ' [BREAK=' + B + ']' : ''}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  crashed:', e); process.exit(1); });
