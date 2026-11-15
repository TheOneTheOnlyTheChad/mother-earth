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
  // ---- legend vs drawn
  const legendText = page => page.evaluate(() => { const leg = document.getElementById('legend'); const line = leg.children[1]; const vis = n => { let t = ''; for (const c of n.childNodes) { if (c.nodeType === 3) t += c.textContent; else if (c.nodeType === 1 && !c.hidden && getComputedStyle(c).display !== 'none') t += vis(c); } return t; }; return { line: vis(line).replace(/\s+/g, ' ').trim(), drawn: ME.keyState().drawn, legendDisplay: getComputedStyle(leg).display }; });
  const out = { legend: {}, widths: {} };
  { const { ctx, page } = await open(1280, 860, false);
    out.legend.allOn = await legendText(page);
    await page.evaluate(() => document.querySelector('button.tgl[data-layer="firms"]').click()); await page.waitForTimeout(300);
    out.legend.firesOff = await legendText(page);
    await page.evaluate(() => { for (const l of ['usgs', 'ships', 'forest']) document.querySelector(`button.tgl[data-layer="${l}"]`).click(); }); await page.waitForTimeout(300);
    out.legend.allCoreOff = await legendText(page);
    await ctx.close(); }
  { const { ctx, page } = await open(1280, 860, true); out.legend.firesDown = await legendText(page); await ctx.close(); }
  // ---- controls at widths
  const probe = page => page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight; const issues = [];
    const vis = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || e.hidden) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const lab = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '')) + ' "' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28) + '"';
    const els = [...document.querySelectorAll('button, a, input, summary, header .clock, header h1, .state')].filter(vis);
    if (document.documentElement.scrollWidth > vw + 1) issues.push('page scrolls sideways: scrollWidth ' + document.documentElement.scrollWidth + ' > ' + vw);
    for (const e of els) { const r = e.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) issues.push('off-screen horizontally: ' + lab(e) + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
      if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible') issues.push('text clipped: ' + lab(e) + ' ' + e.scrollWidth + '>' + e.clientWidth);
      if ((e.tagName === 'BUTTON' || e.tagName === 'A') && (r.height < 24 || r.width < 24)) issues.push('small target: ' + lab(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      { let a = e.parentElement; while (a && a !== document.body) { const cs = getComputedStyle(a); if (/hidden|clip/.test(cs.overflowX)) { const ar = a.getBoundingClientRect(); if (r.right > ar.right + 1.5 || r.left < ar.left - 1.5) { issues.push('clipped by ' + lab(a).slice(0, 30) + ': ' + lab(e) + ' by ' + Math.round(Math.max(r.right - ar.right, ar.left - r.left)) + 'px'); break; } } a = a.parentElement; } }
      // hidden behind something else at its centre
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2; if (cx >= 0 && cx < vw && cy >= 0 && cy < vh) { const top = document.elementFromPoint(cx, cy); if (top && top !== e && !e.contains(top) && !top.contains(e)) issues.push('covered at centre: ' + lab(e) + ' by ' + lab(top)); } }
    const hdr = [...document.querySelectorAll('header > *, header .tabs a, header .menu > button')].filter(vis);
    for (let i = 0; i < hdr.length; i++) for (let j = i + 1; j < hdr.length; j++) { const a = hdr[i], b = hdr[j]; if (a.contains(b) || b.contains(a)) continue; const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); const ox = Math.min(x.right, y.right) - Math.max(x.left, y.left), oy = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top); if (ox > 2 && oy > 2) issues.push('header overlap: ' + lab(a) + ' × ' + lab(b) + ' by ' + Math.round(ox) + 'px'); }
    const h = document.querySelector('header'); const hr = h ? h.getBoundingClientRect() : null;
    return { issues, header: hr ? { h: Math.round(hr.height), scrollW: h.scrollWidth, clientW: h.clientWidth } : null, headerItems: hdr.map(e => lab(e) + '@' + Math.round(e.getBoundingClientRect().left) + '-' + Math.round(e.getBoundingClientRect().right)).slice(0, 14) };
  });
  for (const w of [721, 768, 820, 900, 901, 1000, 1100, 1101, 1139, 1140, 1279, 1280]) {
    const { ctx, page } = await open(w, 800, false);
    out.widths[w] = await probe(page);
    out.widths[w].layout = await page.evaluate(() => { const R = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }; return { globe: R('#globe') || R('.globe'), legend: R('#legend'), side: R('aside') || R('.side') || R('#sheet'), credits: R('#credits'), tglH: [...document.querySelectorAll('button.tgl')].map(b => Math.round(b.getBoundingClientRect().height)), docH: document.documentElement.scrollHeight, vh: innerHeight }; });
    if ([721, 820, 900, 1000, 1100, 1101, 1280].includes(w)) await page.screenshot({ path: `/home/claude/repro/w${w}.png` });
    // Sky zoom-out view controls too
    const hasZoom = null && await page.evaluate(() => { const b = document.getElementById('sky-btn') || document.querySelector('[data-view="sky"], #zoom-open, #sky-open'); if (b) { b.click(); return b.id || 'found'; } return null; });
    if (hasZoom) { await page.waitForTimeout(1500); out.widths[w].sky = (await probe(page)).issues; if ([721, 900, 1100].includes(w)) await page.screenshot({ path: `/home/claude/repro/w${w}-sky.png` }); }
    out.widths[w].skyBtn = hasZoom;
    await ctx.close();
  }
  await browser.close(); clearTimeout(wd);
  fs.writeFileSync('/home/claude/repro/widths.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out.legend, null, 1));
  for (const [w, r] of Object.entries(out.widths)) console.log('\n== ' + w, JSON.stringify(r.header), 'skyBtn', r.skyBtn, JSON.stringify(r.layout), '\n  ' + r.issues.join('\n  '), r.sky ? '\n  SKY: ' + r.sky.join('\n  SKY: ') : '');
  console.log(out.widths[900].headerItems);
})().catch(e => { console.log('ERR', e); process.exit(1); });
