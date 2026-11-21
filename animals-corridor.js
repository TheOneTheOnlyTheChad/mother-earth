/* Mother Earth — a published corridor on the Animals page's globe (animals-tab-rc, stage 4 MVP;
 * docs/concepts/ANIMALS-CORRIDOR-PROPOSAL.md rev 2.2, with Chad's choice C-D4 B: labelled lines and a scale, no regional picture).
 * PRIVATE PREVIEW. Two published polygon classes for one herd (Medium and High use). The source's Low class is NOT in the files
 * this script reads and is never drawn. Nothing here is a path, a position or a count of animals.
 * Trust chain: this script pins the corridor list; the list pins the manifest; the manifest pins the display file; then a
 * structure check; only then is anything drawn. Its own switch, request, time limit and token: independent of the journeys.
 * Shared globe (proposal 6.1): this script owns three globe layers and nothing else (polygons, paths, html elements; the
 * journeys use none of them), its legend and its scale bar. Off removes only those. The page is scrolled only at a press of
 * the switch or Retry, never by an answer. The camera is moved once per press, and only if that press is still current. */
(() => {
  const ME = window.ME = window.ME || {};
  const $ = id => document.getElementById(id), root = $('cor-panel'); if (!root) return;
  const C = { CATALOG: 'assets/animals/corridors-R1.catalog.json', CATALOG_SHA256: '47a029f074dc24e93bcc43e19ad065e71a00f70a1ca2084d3f5c04d7cb1174f5', BASE: 'assets/animals/', ID: 'mule-deer-east-walker-corridor', WAIT_MS: 20000,
    ALT: { medium: 0.00004, high: 0.00008, lines: 0.00012 },                           // heights above the globe, in globe radii (ours): only to fix the drawing order
    FILL: { medium: 'rgba(255,196,84,0.38)', high: 'rgba(255,112,54,0.72)' }, STROKE: { medium: '#ffd98a', high: '#ffffff' }, LINE: 'rgba(170,205,255,0.55)',
    SCALE_PX: 120, SCALE_TOL: 0.05, SETTLE_MS: 160, QUIET_MS: 20, R_KM: 6371.0088,
    T: { off: 'Off. Switch on to draw these published areas on the globe.', loading: 'Checking the published areas…', shown: 'Shown on the globe.', unverified: 'The corridor files could not be verified, so nothing is drawn.', failed: 'The corridor files could not be loaded.',
      factsLoading: 'Checking the corridor record…', factsBad: 'The corridor record could not be verified, so this switch is unavailable.', factsFailed: 'The corridor record could not be loaded, so this switch is unavailable.',
      noGlobe: 'The globe is not available in this browser, so the areas cannot be drawn. The description below still applies.', lost: 'The globe stopped, so the areas are no longer drawn. The description below still applies. Reload the page to use the globe again.',
      blur: 'At this close view the whole-globe backdrop is a blur: one picture for the whole Earth, about 20 km a pixel. It is context only and shows nothing about the animals or the study years.' } };
  class Unverified extends Error { }
  const st = { facts: 'loading', factsErr: '', man: null, status: 'off', err: '', on: false, tok: 0, req: null, geo: null, pendingMove: false, drawn: false, view: '', announced: '', scale: null, moves: 0, reveals: 0, scrolls: 0, timer: 0, held: '' };
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const hex = async b => [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(v => v.toString(16).padStart(2, '0')).join('');
  const J = b => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(b));
  const nf = v => v.toLocaleString('en-GB', { maximumFractionDigits: 1 });
  function announce(t) { st.announced = t; const s = $('cor-say'); if (s) s.textContent = t; }
  function cancel() { const r = st.req; st.req = null; st.tok++; if (r) { clearTimeout(r.timer); try { r.c.abort(); } catch (_) { } } }
  async function get(url, R) { const r = await fetch(url, { signal: R.c.signal, cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url); return r.arrayBuffer(); }

  // ---------- checks
  function checkManifest(m) { const need = (c, w) => { if (!c) throw new Unverified('manifest: ' + w); };
    need(m && m.schema === 1 && m.id === C.ID, 'not this corridor'); need(Array.isArray(m.classes_shown) && m.classes_shown.join() === 'medium,high' && m.class_not_shown === 'low', 'classes are not Medium and High with Low left out');
    need(m.display && typeof m.display.file === 'string' && /^[a-z0-9-]+\.json$/i.test(m.display.file) && /^[0-9a-f]{64}$/.test(m.display.sha256) && m.display.bytes > 0, 'display file entry');
    need(m.relation && (m.relation.result === 'nested' || m.relation.result === 'bands'), 'relation between the classes is not bands or nested');
    for (const k of ['what', 'method_plain', 'method_detail', 'not_whole', 'sample', 'legend_high', 'legend_medium', 'legend_low', 'omission', 'unshaded', 'fixed', 'not_product', 'also', 'geometry', 'area_note', 'reference', 'plain_view', 'dates', 'preview']) need(m.wording && typeof m.wording[k] === 'string' && m.wording[k].length > 8, 'wording.' + k);
    need(m.relation.result !== 'nested' || ['nested_note', 'legend_nested', 'definitions_note', 'area_medium_label', 'area_band_label'].every(k => typeof m.wording[k] === 'string' && m.wording[k].length > 8), 'nested wording');
    for (const k of ['medium', 'high']) { const f = m.facts && m.facts[k]; need(f && f.patches > 0 && f.holes >= 0 && f.points > 0 && f.source_net_area_km2 > 0 && f.extent_deg && ['west', 'east', 'south', 'north'].every(d => Number.isFinite(f.extent_deg[d])), 'facts.' + k); }
    need(m.view && Number.isFinite(m.view.lat) && Number.isFinite(m.view.lng) && m.view.altitude > 0 && m.grid && m.grid.step_deg > 0, 'view or grid');
    need(m.definitions_as_in_metadata && m.record && m.record.doi && Array.isArray(m.record.originators_as_listed) && m.record.originators_as_listed.length > 0 && m.metadata_quotes && typeof m.metadata_quotes.use === 'string', 'record');
    need(!JSON.stringify(m.facts).toLowerCase().includes('"low"'), 'facts name a Low class'); }
  function decode(man, d) { const need = (c, w) => { if (!c) throw new Unverified('display file: ' + w); };
    need(d && d.schema === 1 && d.id === C.ID && d.units_per_degree === 100000, 'header'); need(Array.isArray(d.classes) && d.classes.length === 2 && d.classes[0].key === 'medium' && d.classes[1].key === 'high', 'exactly the classes Medium and High, in that order');
    const S = d.units_per_degree, out = {};
    for (const c of d.classes) { const f = man.facts[c.key]; let holes = 0, pts = 0, w = Infinity, e = -Infinity, s = Infinity, n = -Infinity; need(Array.isArray(c.polygons) && c.polygons.length === f.patches, c.key + ': number of patches'); need(Object.keys(c).sort().join() === 'key,polygons', c.key + ': unexpected fields');
      const ring = a => { need(Array.isArray(a) && a.length >= 6 && a.length % 2 === 0 && a.every(Number.isInteger), c.key + ': a ring is not whole-number steps'); const r = []; let x = 0, y = 0;
        for (let i = 0; i < a.length; i += 2) { x += a[i]; y += a[i + 1]; need(i === 0 || a[i] !== 0 || a[i + 1] !== 0, c.key + ': two successive vertices are equal'); r.push([x / S, y / S]); w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
        need(r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1], c.key + ': a ring repeats its first vertex'); pts += r.length + 1; r.push(r[0]); return r; };
      const polys = c.polygons.map(p => { need(p && Array.isArray(p.holes) && Object.keys(p).sort().join() === 'holes,outer', c.key + ': polygon fields'); holes += p.holes.length; return [ring(p.outer), ...p.holes.map(ring)]; });
      need(holes === f.holes, c.key + ': number of holes'); need(pts === f.points, c.key + ': number of points');
      const x = f.extent_deg; need(w / S === x.west && e / S === x.east && s / S === x.south && n / S === x.north, c.key + ': extent differs from the manifest');
      out[c.key] = polys; }
    return out; }

  // ---------- loading
  async function loadFacts() { cancel(); const tok = st.tok, c = new AbortController(), R = { c, timer: setTimeout(() => c.abort(), C.WAIT_MS) }; st.req = R; st.facts = 'loading'; paint();
    try { const cb = await get(C.CATALOG, R); if (tok !== st.tok) return; if (await hex(cb) !== C.CATALOG_SHA256) throw new Unverified('the corridor list does not match its pinned checksum'); if (tok !== st.tok) return;
      const cat = J(cb), ce = (cat.corridors || []).find(x => x.id === C.ID); if (!ce || !/^[a-z0-9-]+\.manifest\.json$/i.test(ce.manifest)) throw new Unverified('the corridor list has no entry for this corridor');
      const mb = await get(C.BASE + ce.manifest, R); if (tok !== st.tok) return; if (await hex(mb) !== ce.manifest_sha256) throw new Unverified('the manifest does not match the checksum in the corridor list'); if (tok !== st.tok) return;
      const man = J(mb); checkManifest(man); st.man = man; st.facts = 'ready'; st.factsErr = '';
    } catch (e) { if (tok !== st.tok) return; st.man = null; st.facts = e instanceof Unverified ? 'unverified' : 'failed'; st.factsErr = String(e && e.message || e); }
    if (tok === st.tok) { clearTimeout(R.timer); st.req = null; paint(); } }
  async function loadGeometry() { cancel(); const tok = st.tok; if (st.geo) return finish(tok);
    const c = new AbortController(), R = { c, timer: setTimeout(() => c.abort(), C.WAIT_MS) }; st.req = R;
    try { const disp = st.man.display, db = await get(C.BASE + disp.file, R); if (tok !== st.tok) return;
      if (db.byteLength !== disp.bytes || await hex(db) !== disp.sha256) throw new Unverified('the display file does not match the manifest checksum'); if (tok !== st.tok) return;
      st.geo = decode(st.man, J(db)); clearTimeout(R.timer); st.req = null; finish(tok);
    } catch (e) { if (tok !== st.tok) return; clearTimeout(R.timer); st.req = null; fail(e instanceof Unverified ? 'unverified' : 'failed', String(e && e.message || e)); } }
  function finish(tok) { if (tok !== st.tok || !st.on) return; const g = ME.globe && ME.globe(); if (!g) return fail('failed', C.T.noGlobe);
    draw(g); st.status = 'shown'; st.err = ''; if (st.pendingMove) { st.pendingMove = false; move(g); } paint(); settle(); announce('Mule deer corridor areas shown. ' + st.man.wording.omission); }
  function fail(kind, msg) { st.on = false; st.pendingMove = false; st.status = kind; st.err = msg; clearOwned(); paint(); announce('Mule deer corridor areas could not be shown. ' + (kind === 'unverified' ? C.T.unverified : msg === C.T.noGlobe ? C.T.noGlobe : C.T.failed)); }

  // ---------- drawing: only this script's three layers
  function draw(g) { const m = st.man, feats = ['medium', 'high'].map(k => ({ key: k, geometry: { type: 'MultiPolygon', coordinates: st.geo[k] } }));
    g.polygonsData(feats).polygonGeoJsonGeometry(d => d.geometry).polygonCapColor(d => C.FILL[d.key]).polygonSideColor(() => null).polygonStrokeColor(d => C.STROKE[d.key]).polygonAltitude(d => C.ALT[d.key]).polygonsTransitionDuration(0).polygonLabel(() => '');
    setTimeout(() => quiet(g), C.QUIET_MS);                                        // after the library has built the shapes (it does so in a timer of its own, straight after this call)
    const G = m.grid, lines = [], labels = [], n = v => Math.round(v * 1e6) / 1e6;
    for (let la = G.south; la <= G.north + 1e-9; la += G.step_deg) { const pts = []; for (let lo = G.west; lo <= G.east + 1e-9; lo += G.step_deg / 5) pts.push([n(la), n(lo)]); lines.push({ kind: 'lat', v: n(la), pts }); labels.push({ kind: 'lat', lat: n(la), lng: G.west, text: `${Math.abs(n(la)).toFixed(2)}°${la >= 0 ? 'N' : 'S'}` }); }
    for (let lo = G.west; lo <= G.east + 1e-9; lo += G.step_deg) { const pts = []; for (let la = G.south; la <= G.north + 1e-9; la += G.step_deg / 5) pts.push([n(la), n(lo)]); lines.push({ kind: 'lng', v: n(lo), pts }); labels.push({ kind: 'lng', lat: G.south, lng: n(lo), text: `${Math.abs(n(lo)).toFixed(2)}°${lo >= 0 ? 'E' : 'W'}` }); }
    g.pathsData(lines).pathPoints(d => d.pts).pathPointLat(p => p[0]).pathPointLng(p => p[1]).pathPointAlt(() => C.ALT.lines).pathColor(() => C.LINE).pathStroke(null).pathDashLength(1).pathDashGap(0).pathTransitionDuration(0);
    g.htmlElementsData(labels).htmlLat(d => d.lat).htmlLng(d => d.lng).htmlAltitude(() => C.ALT.lines).htmlElement(d => { const e = el('div', 'cor-tick', ''); e.append(el('span', 'cor-tick-' + d.kind, d.text)); e.setAttribute('aria-hidden', 'true'); return e; });
    st.drawn = true; }
  function clearOwned() { const g = ME.animalsGlobe && ME.animalsGlobe.raw && ME.animalsGlobe.raw(); if (g && st.drawn) { try { g.polygonsData([]); g.pathsData([]); g.htmlElementsData([]); } catch (_) { } } st.drawn = false; st.view = ''; hideScale(); }

  // ---------- camera (one move per press, only while that press is current) and the page scroll (only at a press)
  function move(g) { try { g.controls().autoRotate = false; g.pointOfView(st.man.view, 0); st.moves++; } catch (_) { } st.view = (ME.journey && ME.journey.on && ME.journey.on()) ? 'View moved to the corridor. The journey remains on.' : 'View moved to the corridor.'; }
  function reveal() { const box = $('an-globe-box'); if (!box) return; const r = box.getBoundingClientRect(); if (root.getBoundingClientRect().top < r.bottom - 1) return;      // the switch is beside the globe
    const h = document.querySelector('header.top'), hp = h ? getComputedStyle(h).position : '', clear = h && (hp === 'sticky' || hp === 'fixed') ? Math.max(0, h.getBoundingClientRect().bottom) : 0;
    if (r.top >= clear && r.bottom <= innerHeight) return; const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), top = Math.max(0, Math.round(scrollY + r.top - clear - 8));
    st.reveals++; st.scrolls++; try { window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' }); } catch (_) { window.scrollTo(0, top); } }

  // ---------- scale bar: valid at the centre of the view, hidden whenever that cannot be shown to hold
  const km = (a, b) => { const R = Math.PI / 180, dl = (b.lat - a.lat) * R, dn = (b.lng - a.lng) * R, h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * R) * Math.cos(b.lat * R) * Math.sin(dn / 2) ** 2; return 2 * C.R_KM * Math.asin(Math.min(1, Math.sqrt(h))); };
  const noRay = () => { };                                                       // the scale bar asks the library where screen points meet the globe; once they are built, this script's own shapes are left out of that test
  function quiet(g) { try { g.scene().traverse(o => { if (o.__globeObjType === 'polygon' || o.__globeObjType === 'path') o.traverse(c => { c.raycast = noRay; }); }); } catch (_) { } }
  function hideScale() { st.scale = null; const s = $('cor-scale'); if (s) s.hidden = true; }
  function scale() { const g = ME.globe && ME.globe(), box = $('an-globe'), s = $('cor-scale'); if (!s) return; if (!g || st.status !== 'shown' || !box) return hideScale();
    const w = box.clientWidth, h = box.clientHeight, y = h / 2, P = C.SCALE_PX, at = x => { const a = g.toGlobeCoords(x, y), b = g.toGlobeCoords(x + P, y); return a && b ? km(a, b) : null; };
    if (w < P * 2 + 8) return hideScale(); const c = at(w / 2 - P / 2), l = at(2), r = at(w - P - 2);
    if (!(c > 0) || !(l > 0) || !(r > 0) || Math.abs(l - c) / c > C.SCALE_TOL || Math.abs(r - c) / c > C.SCALE_TOL) return hideScale();
    const p = 10 ** Math.floor(Math.log10(c)), nice = [5, 2, 1].map(v => v * p).find(v => v <= c), px = P * nice / c;
    st.scale = { km: nice, px, a: g.toGlobeCoords(w / 2 - px / 2, y), b: g.toGlobeCoords(w / 2 + px / 2, y) }; $('cor-scale-bar').style.width = px.toFixed(1) + 'px'; $('cor-scale-text').textContent = `${nf(nice)} km · scale at the centre of the view`; s.hidden = false; }
  function settle() { clearTimeout(st.timer); hideScale(); st.timer = setTimeout(() => { scale(); paintLegend(); }, C.SETTLE_MS); }
  function userMoved() { st.pendingMove = false; if (st.view) { st.view = ''; } hideScale(); paintLegend(); }

  // ---------- switch
  function on() { if (st.facts !== 'ready') return announce('Mule deer corridor areas cannot be shown. ' + (st.facts === 'loading' ? C.T.factsLoading : st.facts === 'unverified' ? C.T.factsBad : C.T.factsFailed));
    if (!(ME.globe && ME.globe())) { st.status = 'failed'; st.err = C.T.noGlobe; paint(); return announce(C.T.noGlobe); }
    st.on = true; st.status = 'loading'; st.err = ''; st.pendingMove = true; paint(); reveal(); announce('Mule deer corridor areas loading.'); loadGeometry(); }
  function off(say) { cancel(); st.on = false; st.pendingMove = false; st.status = 'off'; st.err = ''; clearOwned(); paint(); if (say !== false) announce('Mule deer corridor areas switched off.'); }

  // ---------- painting (text comes from the manifest)
  function paintFacts() { const box = $('cor-about'), m = st.man; box.textContent = ''; if (!m) return; const W = m.wording, add = (c, t) => { const p = el('p', c, t); box.append(p); return p; };
    add('cor-what', W.what); const leg = el('ul', 'cor-leg'); for (const [k, t] of [['high', W.legend_high], ['medium', W.legend_medium], ['low', W.legend_low]]) { const li = el('li', 'cor-li cor-li-' + k); li.append(el('span', 'cor-sw cor-sw-' + k), el('span', '', t)); leg.append(li); } box.append(leg);
    add('cor-omit', W.omission + ' ' + W.unshaded); if (W.nested_note) add('cor-note', W.nested_note); add('cor-note', W.method_plain); add('cor-note', W.not_whole); add('cor-note', W.sample); add('cor-note', W.dates); add('cor-note', W.fixed); add('cor-note', W.not_product); add('cor-note', W.also);
    const d = el('details', 'cor-more'), sm = el('summary', '', 'Areas in words, method, position and source'); d.append(sm);
    for (const k of ['high', 'medium']) { const f = m.facts[k], x = f.extent_deg, D = (v, a, b) => `${Math.abs(v).toFixed(3)}°${v >= 0 ? a : b}`;
      d.append(el('p', 'cor-alt', `${k === 'high' ? 'High use' : W.area_medium_label || 'Medium use'}: ${f.patches} separate ${f.patches === 1 ? 'patch' : 'patches'}, ${f.holes} ${f.holes === 1 ? 'hole' : 'holes'}, ${nf(f.source_net_area_km2)} km². From ${D(x.west, 'E', 'W')} to ${D(x.east, 'E', 'W')} and ${D(x.south, 'N', 'S')} to ${D(x.north, 'N', 'S')}.`)); }
    if (m.medium_only_band_km2 != null && W.area_band_label) d.append(el('p', 'cor-alt', `${W.area_band_label}: ${nf(m.medium_only_band_km2)} km².`));
    d.append(el('p', 'cor-note', W.area_note), el('p', 'cor-note', m.record.location), el('p', 'cor-note', W.method_detail), el('p', 'cor-note', W.geometry), el('p', 'cor-note', W.reference));
    d.append(el('p', 'cor-note', `Class definitions as the layer's metadata gives them. Medium: "${m.definitions_as_in_metadata.medium}" High: "${m.definitions_as_in_metadata.high}" Low (not shown): "${m.definitions_as_in_metadata.low}"`)); if (W.definitions_note) d.append(el('p', 'cor-note', W.definitions_note));
    const src = el('p', 'cor-note'), a = el('a', '', m.record.release_title); a.href = m.record.url; a.rel = 'noopener'; src.append('Source: U.S. Geological Survey, ', a, `, doi ${m.record.doi}. Layer: ${m.record.layer_title}. Licence as the record words it: ${m.record.licence_as_on_record}. The layer's metadata also says: "${m.metadata_quotes.use}" No endorsement is implied.`); d.append(src);
    d.append(el('p', 'cor-note', `Originators as the metadata lists them (${m.record.originators_as_listed.length} entries): ${m.record.originators_as_listed.join(', ')}.`), el('p', 'cor-note', m.record.report + '.'), el('p', 'cor-note', W.preview)); box.append(d); }
  function paintLegend() { const L = $('cor-legend'), m = st.man, show = st.status === 'shown' && !!m; L.hidden = !show; if (!show) { L.textContent = ''; return; } const W = m.wording, G = ME.animalsGlobe && ME.animalsGlobe.state ? ME.animalsGlobe.state() : {};
    L.textContent = ''; const row = el('p', 'cor-lg-row'); for (const [k, t] of [['high', W.legend_high], ['medium', W.legend_medium]]) { const s = el('span', 'cor-lg-item'); s.append(el('span', 'cor-sw cor-sw-' + k), el('span', '', t)); row.append(s); } L.append(row);
    if (W.legend_nested) L.append(el('p', 'cor-lg-nest', W.legend_nested)); L.append(el('p', 'cor-lg-omit', W.omission + ' ' + W.unshaded), el('p', 'cor-lg-small', W.legend_low), el('p', 'cor-lg-small', W.reference + ' ' + C.T.blur + (G.backdrop === 'plain' ? ' ' + W.plain_view : '')));
    if (st.view) L.append(el('p', 'cor-lg-view', st.view)); }
  let painted = null; const RETRY = ['cor-retry', 'cor-facts-retry'];
  function paint() { const b = $('cor-tgl'), s = $('cor-state'), o = $('cor-obs'), ready = st.facts === 'ready';
    b.setAttribute('aria-checked', st.on ? 'true' : 'false'); b.setAttribute('aria-busy', st.status === 'loading' ? 'true' : 'false'); if (ready) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true');
    s.textContent = !ready ? (st.facts === 'loading' ? 'checking' : 'unavailable') : st.status === 'shown' ? 'shown' : st.status === 'loading' ? 'loading' : st.status === 'off' ? 'off' : 'not shown';
    o.textContent = !ready ? (st.facts === 'loading' ? C.T.factsLoading : st.facts === 'unverified' ? C.T.factsBad : C.T.factsFailed) : st.status === 'failed' && (st.err === C.T.noGlobe || st.err === C.T.lost) ? st.err : C.T[st.status];
    const can = { 'cor-retry': ready && (st.status === 'failed' || st.status === 'unverified') && st.err !== C.T.lost, 'cor-facts-retry': st.facts === 'unverified' || st.facts === 'failed' };
    for (const id of RETRY) { const r = $(id); r.hidden = !(can[id] || st.held === id); if (can[id]) r.removeAttribute('aria-disabled'); else r.setAttribute('aria-disabled', 'true'); }      // a pressed Retry stays, inactive, while it has the focus
    $('cor-goto').hidden = st.status !== 'shown';
    if (painted !== st.man) { painted = st.man; paintFacts(); $('cor-label').textContent = st.man ? st.man.label : 'Mule deer, East Walker herd, California: migration corridor'; }
    paintLegend(); }

  // ---------- events
  $('cor-tgl').addEventListener('click', () => { if (st.on) off(); else on(); });
  // A pressed Retry is never hidden or removed while it has the focus: it stays where it is through loading, success and failure, inactive until it applies again, and goes only after focus has left it.
  for (const id of RETRY) { const r = $(id);
    r.addEventListener('click', () => { if (r.getAttribute('aria-disabled') === 'true') return; st.held = id; if (document.activeElement !== r) r.focus({ preventScroll: true }); if (id === 'cor-retry') on(); else loadFacts(); });
    r.addEventListener('focusout', () => setTimeout(() => { if (st.held === id && document.activeElement !== r) { st.held = ''; paint(); } }, 0)); }
  $('cor-goto').addEventListener('click', () => { const g = ME.globe && ME.globe(); if (!g || st.status !== 'shown') return; st.pendingMove = false; move(g); paintLegend(); settle(); });
  document.addEventListener('click', e => { const t = e.target && e.target.closest ? e.target.closest('[data-journey].an-tgl, .an-sw[data-journey] .journey-retry, #replay-goto') : null; if (!t) return; st.pendingMove = false;
    if (st.status === 'shown') { st.view = t.id === 'replay-goto' ? 'View moved to the journey. The corridor remains on.' : ''; settle(); } }, true);
  function hook() { const g = ME.animalsGlobe && ME.animalsGlobe.raw && ME.animalsGlobe.raw(); if (!g) return; try { const ct = g.controls(); ct.addEventListener('start', userMoved); ct.addEventListener('end', () => { if (st.status === 'shown') settle(); }); } catch (_) { }
    const cv = g.renderer && g.renderer().domElement; if (cv) cv.addEventListener('webglcontextlost', () => { if (st.on || st.status === 'shown' || st.status === 'loading') { cancel(); st.on = false; st.pendingMove = false; st.drawn = false; st.status = 'failed'; st.err = C.T.lost; hideScale(); paint(); announce(C.T.lost); } }); }
  hook(); if (ME.animalsGlobe && ME.animalsGlobe.onChange) ME.animalsGlobe.onChange(() => paintLegend());
  { const box = $('an-globe'); if (box && typeof ResizeObserver === 'function') new ResizeObserver(() => { if (st.status === 'shown') settle(); }).observe(box); else window.addEventListener('resize', () => { if (st.status === 'shown') settle(); }); }
  window.addEventListener('pagehide', () => { if (st.req) { const wasFacts = st.facts === 'loading'; cancel(); if (wasFacts) { st.facts = 'failed'; st.factsErr = 'cancelled when the page was left'; paint(); } else if (st.status === 'loading') off(false); } });
  window.addEventListener('pageshow', e => { if (e.persisted && st.facts !== 'ready') loadFacts(); });

  ME.corridor = { C, on, off, km, loadFacts,
    state: () => ({ facts: st.facts, factsErr: st.factsErr, status: st.status, err: st.err, on: st.on, busy: !!st.req, tok: st.tok, pendingMove: st.pendingMove, drawn: st.drawn, view: st.view, announced: st.announced, held: st.held, moves: st.moves, reveals: st.reveals, scale: st.scale ? { km: st.scale.km, px: st.scale.px, a: st.scale.a, b: st.scale.b } : null, cached: !!st.geo }) };
  paint(); loadFacts();
})();
