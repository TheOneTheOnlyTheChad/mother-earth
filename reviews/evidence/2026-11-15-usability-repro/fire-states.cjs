/* Reproduction only (15 Nov 2026): what main says about fires in five hub states, on every surface.
 * Real page (index.html, app.js at main), real hub code for /place (worker.js fetch over in-memory R2 + SQLite D1). */
const { chromium } = require('playwright');
const fs = require('fs'); const { pathToFileURL } = require('url'); const { DatabaseSync } = require('node:sqlite');
const REPO = '/home/claude/mother-earth';
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const wd = setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 9 * 60e3);
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
(async () => {
  const Wsrc = fs.readFileSync(REPO + '/phase1/worker.js', 'utf8');
  const m = Wsrc.match(/const why = utcHour < FIRMS_DAY_BOUNDARY_H \? `([^`]+)` : `([^`]+)`;/);
  const NOTE_BOUNDARY = m[1].replace('${res.text.length}', '122');
  const NOTE_FETCH = 'TypeError: fetch failed';
  const iso = ms => new Date(Date.now() - ms).toISOString();
  const GOOD = iso(3 * 3600e3), NOW = iso(60e3), DOWN_AT = iso(30e3), NEWER = iso(20e3);
  const FIELDS = ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'];
  const RECS = [[-33.80, 18.60, GOOD, 'n', 5.8, 'N20', 'D'], [-33.81, 18.61, GOOD, 'n', 2.3, 'N20', 'D']];
  const cov = { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections', observed_fraction: 1 };
  const base = { schema_version: 1, collector_version: '0.6.14', layer: 'firms', scheduled_for: NOW, interruptions: [], stale_after_s: 1800, record_format: 'rows', quantity: 'one VIIRS detection per pass' };
  const goodSnap = at => ({ ...base, retrieved_at: at, window_start: GOOD, window_end: at, source_status: 'ok', scope: 'world', raw_bytes: 5000, cells: { [cellOf(-33.8, 18.6)]: { count: 2, coverage: cov } }, record_fields: FIELDS, records: RECS });
  const goodCells = at => ({ ...goodSnap(at), records: undefined });
  const downCells = note => ({ ...base, retrieved_at: DOWN_AT, window_start: null, window_end: null, source_status: 'down', cells: {}, record_fields: [], note });
  const zeroSnap = at => ({ ...base, retrieved_at: at, window_start: GOOD, window_end: at, source_status: 'ok', scope: 'world', raw_bytes: 5000, cells: {}, record_fields: FIELDS, records: [] });
  const STATES = {
    'A missing daily feed': { cells: downCells(NOTE_BOUNDARY), snap: goodSnap(GOOD) },
    'B failed refresh': { cells: downCells(NOTE_FETCH), snap: goodSnap(GOOD) },
    'C valid zero': { cells: { ...zeroSnap(NOW), records: undefined }, snap: zeroSnap(NOW) },
    'D run mismatch (valid count)': { cells: goodCells(NEWER), snap: goodSnap(GOOD) },
    'E records file unreadable (valid count)': { cells: goodCells(NOW), snap: null },
    'F all good': { cells: goodCells(NOW), snap: goodSnap(NOW) },
  };
  const env0 = (layer, extra) => ({ layer, collector_version: '0.6.14', retrieved_at: NOW, source_status: 'ok', stale_after_s: 10800, window_start: GOOD, window_end: NOW, quantity: 'q', ...extra });
  const usgsF = ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], usgsR = [['q1', -33.9, 18.4, 10, 3.1, 'ml', GOOD, 'M 3.1 - off Cape Town', '']];
  const usgsCells = { [cellOf(-33.9, 18.4)]: { count: 1, coverage: cov } };
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const out = {};
  for (const [name, S] of Object.entries(STATES)) {
    const store = new Map();
    store.set('latest-cells/firms.json', JSON.stringify(S.cells)); if (S.snap) store.set('latest/firms.json', JSON.stringify(S.snap));
    store.set('latest/usgs.json', JSON.stringify(env0('usgs', { record_format: 'rows', record_fields: usgsF, records: usgsR, cells: usgsCells })));
    store.set('latest-cells/usgs.json', JSON.stringify(env0('usgs', { cells: usgsCells })));
    const R2 = { async get(k) { const b = store.get(k); if (b === undefined) return null; return { body: b, httpEtag: '"' + k + '"', async json() { return JSON.parse(b); }, async text() { return b; } }; },
      async head(k) { const b = store.get(k); if (b === undefined) return null; return { key: k, size: new TextEncoder().encode(b).length, etag: k, httpEtag: '"' + k + '"', uploaded: new Date(), customMetadata: undefined }; },
      async put(k, b) { store.set(k, String(b)); }, async delete(k) { store.delete(k); }, async list() { return { objects: [] }; } };
    const db = new DatabaseSync(':memory:'); db.exec(fs.readFileSync(REPO + '/phase1/schema.sql', 'utf8'));
    const D1 = { prepare(sql) { const mk = a => ({ sql, async all() { return { results: db.prepare(sql).all(...a) }; }, async first() { return db.prepare(sql).get(...a) ?? null; }, async run() { db.prepare(sql).run(...a); return {}; } }); return { bind: (...a) => mk(a), ...mk([]) }; },
      async batch(st) { return Promise.all(st.map(s => /^\s*SELECT/i.test(s.sql) ? s.all() : s.run())); } };
    const HENV = { R2, DB: D1 }; const W = await import(pathToFileURL(REPO + '/phase1/worker.js').href + '?n=' + encodeURIComponent(name));
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(HUB + '/**', async route => {
      const u = new URL(route.request().url()); const p = u.pathname;
      if (p.startsWith('/place/')) { const res = await W.default.fetch(new Request(HUB + p + u.search), HENV); return route.fulfill({ status: res.status, contentType: 'application/json', body: await res.text() }); }
      const mm = /^\/(cells|snapshot)\/(\w+)$/.exec(p);
      if (mm) { const k = (mm[1] === 'cells' ? 'latest-cells/' : 'latest/') + mm[2] + '.json'; const b = store.get(k);
        if (b) return route.fulfill({ status: 200, contentType: 'application/json', body: b });
        if (mm[2] === 'firms') return route.fulfill({ status: 500, body: '{}' });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(env0(mm[2], { cells: {}, index: null, record_format: 'rows', record_fields: [], records: [], sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW } })) }); }
      if (p === '/') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'x', history: { collecting: false, retained: { exists: false } } }) });
      route.fulfill({ status: 404, body: '{}' });
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.renderState && ME.renderState(), null, { timeout: 40000 });
    await page.waitForTimeout(800);
    const r = {};
    r.card = await page.evaluate(() => { const t = id => document.getElementById(id); return { state: t('s-firms').textContent, tooltip: t('s-firms').title, count: t('v-firms').textContent, src: t('m-firms').textContent, pairHidden: t('p-firms').hidden, pair: t('p-firms').textContent }; });
    r.pairState = await page.evaluate(() => ME.pairState('firms').firms);
    r.key = await page.evaluate(() => ME.keyState());
    await page.evaluate(() => document.getElementById('find-firms').click()); await page.waitForTimeout(200);
    r.find = await page.evaluate(() => document.getElementById('find-note').textContent);
    await page.evaluate(() => { const q = document.getElementById('search-q'); q.value = '-33.8, 18.6'; document.getElementById('search-form').requestSubmit(); }); await page.waitForTimeout(500);
    r.search = await page.evaluate(() => ({ status: document.getElementById('search-status').textContent, notes: [...document.getElementById('search-notes').children].map(e => e.textContent).filter(t => /fire/i.test(t)) }));
    r.report = await page.evaluate(() => { const R = ME.report(ME.readings()); return { text: (R.text.split('; ').find(s => /fire/i.test(s)) || ''), state: R.states.firms }; });
    await page.evaluate(id => ME.openPlace(id), cellOf(-33.8, 18.6)); await page.waitForTimeout(1500);
    r.place = await page.evaluate(() => { const rows = [...document.querySelectorAll('#insp tr, #insp .row, #insp dt')]; const all = document.getElementById('insp').innerText.split('\n'); const i = all.findIndex(l => /^Fire detections/.test(l)); return all.slice(i, i + 3).join(' | '); });
    r.perr = perr;
    out[name] = r; await ctx.close();
  }
  await browser.close(); clearTimeout(wd);
  fs.writeFileSync('/home/claude/repro/fire-states.json', JSON.stringify(out, null, 1));
  for (const [n, r] of Object.entries(out)) { console.log('\n=== ' + n); console.log(JSON.stringify(r, null, 1)); }
})().catch(e => { console.log('ERR', e); process.exit(1); });
