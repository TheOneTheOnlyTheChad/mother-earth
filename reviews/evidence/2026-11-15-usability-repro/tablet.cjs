/* Reproduction only (15 Nov 2026): legend entries vs what is drawn, and controls at intermediate widths, on main. */
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const F = '/home/claude/spike/node_modules/@fontsource/';
const face = (fam, dir, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${F}${dir}/files/${dir}-latin-${w}-normal.woff2`).toString('base64')}) format("woff2")}`;
const CSS = [face('IBM Plex Mono', 'ibm-plex-mono', 400), face('IBM Plex Mono', 'ibm-plex-mono', 500), face('Barlow Condensed', 'barlow-condensed', 500), face('Barlow Condensed', 'barlow-condensed', 600), face('Barlow Condensed', 'barlow-condensed', 700)].join('');
const wd = setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 9 * 60e3);
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
(async () => {
  const iso = ms => new Date(Date.now() - ms).toISOString(); const GOOD = iso(3 * 3600e3), NOW = iso(60e3);
  const cov = { grade: 'partial', evidence: 'e', observed_fraction: 1 };
  const env0 = (layer, extra) => ({ layer, schema_version: 1, collector_version: '0.6.14', retrieved_at: NOW, source_status: 'ok', stale_after_s: 10800, window_start: GOOD, window_end: NOW, quantity: 'q', record_format: 'rows', ...extra });
  const mk = (layer, fields, recs, extra = {}) => { const cells = {}; const iLat = fields.indexOf('lat'), iLng = fields.indexOf('lng'); for (const r of recs) { const k = cellOf(r[iLat], r[iLng]); (cells[k] = cells[k] || { count: 0, coverage: cov }).count++; } return { snap: env0(layer, { record_fields: fields, records: recs, cells, ...extra }), cells: env0(layer, { cells, ...extra }) }; };
  const L = {
    usgs: mk('usgs', ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], [['q1', -33.9, 18.4, 10, 3.1, 'ml', GOOD, 'M 3.1 - off Cape Town', '']], { source_generated_at: NOW, source_age_s: 40 }),
    firms: mk('firms', ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'], [[-33.5, 18.9, GOOD, 'n', 5.8, 'N20', 'D']], { scope: 'world', raw_bytes: 5000 }),
    ships: mk('ships', ['mmsi', 'name', 'lat', 'lng', 'sog_kn', 'class', 'observed_at', 'received_at'], [['601000001', 'TEST VESSEL', -33.8, 18.5, 9.1, 'A', GOOD, NOW]], { window_s: 60, class_a: 1, class_b: 0, socket_connected_s: 60, collected_by: 'mac' }),
  };
  const FIRMS_DOWN = { ...L.firms.cells, retrieved_at: iso(30e3), source_status: 'down', cells: {}, note: 'TypeError: fetch failed' };
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (w, h, firmsDown) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: CSS }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(HUB + '/**', async route => { const p = new URL(route.request().url()).pathname; const j = b => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
      const m = /^\/(cells|snapshot)\/(\w+)$/.exec(p);
      if (m && L[m[2]]) return j(m[1] === 'cells' ? (m[2] === 'firms' && firmsDown ? FIRMS_DOWN : L[m[2]].cells) : L[m[2]].snap);
      if (m && m[2] === 'forest') return j(env0('forest', { cells: { '22_46': { count: 12, confidence: { nominal: 9, high: 3, highest: 0 }, since: '2026-11-08', queried_at: NOW, version: 'v1', coverage: cov } }, sweep: { answered: 559, cells_total: 559, oldest_queried_at: GOOD } }));
      if (m) return j(env0(m[2], { cells: {}, index: null, record_fields: [], records: [] }));
      if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } });
      route.fulfill({ status: 404, body: '{}' }); });
    const page = await ctx.newPage();
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.renderState && ME.renderState(), null, { timeout: 40000 });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(700);
    return { ctx, page };
  };
  const out = { t: {} };
  for (const [w, h] of [[768, 1024], [820, 1180], [1024, 768], [1100, 800], [1101, 800], [1180, 820], [1279, 720], [1280, 720], [1366, 768]]) {
    const { ctx, page } = await open(w, h, false);
    out.t[w + 'x' + h] = await page.evaluate(() => { const R = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }; };
      const g = R('#globe') || R('.globe'); const leg = R('#legend'), img = R('#img-note') || R('.imgnote'), cr = R('#credits');
      const tg = [...document.querySelectorAll('button.tgl')].map(b => ({ l: b.dataset.layer, top: Math.round(b.getBoundingClientRect().top) }));
      const canvas = document.querySelector('#globe canvas'); const cr2 = canvas ? canvas.getBoundingClientRect() : null;
      const over = (a, b) => a && b ? Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) * Math.max(0, Math.min(a.left + a.w, b.left + b.w) - Math.max(a.left, b.left)) : 0;
      const ovl = [...document.querySelectorAll('#globe ~ *, .globe-wrap > *')].length;
      return { vh: innerHeight, globe: g, canvas: cr2 ? { w: Math.round(cr2.width), h: Math.round(cr2.height) } : null, legend: leg, credits: cr, legendOverGlobePx: over(leg, g), firstToggle: tg[0], toggles: tg.map(t => t.l + '@' + t.top).join(' '), togglesInView: tg.filter(t => t.top >= 0 && t.top < innerHeight - 36).length + '/' + tg.length, pageScrollH: document.documentElement.scrollHeight, bodyOverflow: getComputedStyle(document.body).overflowY }; });
    await ctx.close();
  }
  await browser.close(); clearTimeout(wd);
  for (const [k, v] of Object.entries(out.t)) console.log(k, JSON.stringify(v));
})().catch(e => { console.log('ERR', e); process.exit(1); });
