/* Mother Earth — Organic-soil emissions (modelled) (soil-release-rc, 25 Nov 2026; reviewed as the fixture preview soil-preview-rc e51ca61).
 * Proposal: docs/concepts/NATURE-CONTEXT-SOIL-PROPOSAL.md rev 3 (§1 row, §1b optional globe layer); Chad's S1–S4 of 25 Nov.
 * Reference contract: docs/research/soil-c1/soil_reference.py. Every text and class here reproduces it (tests: phase1/soil-ui.test.cjs).
 * - MODELLED, not measured: Glen et al. 2026 model outputs v1.0.1, 2021–2024 annual average, whole 4° cell totals.
 * - Nothing is requested at load. The table is read when the layer is switched on, or when a place panel needs its row.
 * - The table's bytes are checked against the pinned SHA-256, then the WHOLE table is validated, before any record is used and
 *   before an absent cell is ever read as "no organic soil mapped". Any failure: unknown everywhere, nothing drawn, never zero.
 * - The pinned table is the full 4° table (790 records; built by docs/research/soil-c1/soil_build.py). A cell in the 45 × 90 domain
 *   that is not listed has no mapped organic soil (the table's sparse rule, applied only after validation). A table that carries the
 *   preview's fixture metadata is refused: the release never reads a subset as the whole.
 * - States come from the record's flags, never from formatted numbers. Display is two significant figures; a positive never shows 0.
 * - The layer draws the same 4° cells as the data: no points, no hotspots inside a cell, no combined total, one period.
 */
(() => {
  const ME = window.ME = window.ME || {};
  const esc = ME.esc || (s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const S = {
    TABLE: 'assets/soil/g4-soil-v1.0.1.json',
    SHA256: 'c5c01ff5a4300ace1e7348d6d25edb079ea424810e70d50a291afd0ffadb30cf',
    CHECKED: '25 Nov 2026',                                   // last version check (record 22137130: total 1, v1.0.1 latest), 10:40 UTC
    PERIOD: '2021_2024',
    PERIODS: ['2001_2005', '2006_2010', '2011_2015', '2016_2020', '2021_2024'],
    COMPONENTS: ['drained', 'burned'],
    BINS: [0, 1e3, 1e4, 1e5, 1e6, 1e7, Infinity],             // t CO2e per year per WHOLE 4° cell; decades, fixed (proposal §1b)
    // One-hue sequential ramp (ochre), dark → light for a dark globe, in OKLCH: L .40/.51/.62/.72/.82/.92, hue 55–90°. Adjacent classes
    // differ by OKLab ΔE 10.2–11.4 (×100; target ≥ 8). Fills are near-opaque (0.88) so cloud, sea and land under a cell do not change its
    // class (GPT preview review P2, 25 Nov: alpha-only steps of one colour blended on the real imagery). Thin dark cell edges separate fills.
    RAMP: ['#6a3913', '#925512', '#b7761f', '#d49838', '#e8bd6d', '#f7e3b0'],
    OPACITY: 0.88,
  };
  const NR = 45, NC = 90, COVERAGE = ['complete', 'incomplete', 'none'], STATES = ['positive', 'zero', 'unknown'];
  const st = { on: false, comp: 'drained', status: 'idle', why: null, table: null, sel: null, loading: null, requests: [] };

  // ---------- the reference contract
  const fmt = (x, unit) => {
    if (x === 0) return `0 ${unit}`;
    if (x < 0.01) return `<0.01 ${unit}`;
    const v = Number(x.toExponential(1)), d = Math.max(0, 1 - Math.floor(Math.log10(v)));
    return (v >= 10 ? Math.trunc(v).toLocaleString('en') : v.toLocaleString('en', { minimumFractionDigits: d, maximumFractionDigits: d })) + ' ' + unit;
  };
  const inDomain = id => { const m = typeof id === 'string' && /^(\d{1,2})_(\d{1,2})$/.exec(id); return !!m && +m[1] < NR && +m[2] < NC && id === `${+m[1]}_${+m[2]}`; };
  const num = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;
  const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  function validate(t) {
    if (!isObj(t) || !isObj(t.meta) || !isObj(t.cells)) return 'not a soil table';
    const m = t.meta;
    if (m.version !== '1.0.1' || m.doi !== '10.5281/zenodo.22137130') return 'unexpected product version';
    if (!isObj(m.grid) || m.grid.id !== 'g4' || m.grid.rows !== NR || m.grid.cols !== NC) return 'unexpected grid';
    if (!isObj(m.totals) || Object.keys(m.totals).sort().join() !== S.PERIODS.join()) return 'unexpected reporting periods';
    if (typeof m.sparse_rule !== 'string' || !m.sparse_rule.includes('not listed has no mapped organic soil')) return 'sparse rule missing';
    const ids = Object.keys(t.cells); if (!ids.length) return 'no cells';
    if (m.fixture !== undefined) return 'a preview fixture, not the full table';   // the release reads the whole table or nothing
    for (const id of ids) {
      const r = t.cells[id], bad = why => `malformed record ${id}: ${why}`;
      if (!inDomain(id)) return bad('id outside the 45 × 90 domain');
      if (!isObj(r) || typeof r.has_mapped_organic_soil !== 'boolean' || !num(r.organic_km2)) return bad('organic-soil fields');
      if (r.has_mapped_organic_soil !== (r.organic_km2 > 0)) return bad('flag disagrees with area');
      if (!isObj(r.periods) || Object.keys(r.periods).sort().join() !== S.PERIODS.join()) return bad('periods');
      for (const p of S.PERIODS) {
        const q = r.periods[p];
        if (!isObj(q) || !COVERAGE.includes(q.coverage) || !num(q.incomplete_source_footprint_km2)) return bad(p + ' coverage');
        if ((q.coverage === 'complete') !== (q.incomplete_source_footprint_km2 === 0)) return bad(p + ' coverage and footprint disagree');
        for (const c of S.COMPONENTS) {
          const s = q[c]; if (!isObj(s) || !STATES.includes(s.state)) return bad(`${p} ${c} state`);
          if (s.state === 'unknown') { if (s.Mg !== null || q.coverage !== 'none') return bad(`${p} ${c} unknown state`); }
          else if (q.coverage === 'none' || !num(s.Mg) || (s.state === 'positive') !== (s.Mg > 0)) return bad(`${p} ${c} value and state disagree`);
        }
      }
    }
    return null;
  }
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  async function loadTable() {
    if (st.status === 'ok' || st.status === 'unavailable') return;
    if (st.loading) return st.loading;
    st.status = 'loading'; paint();
    st.loading = (async () => {
      let why = null, t = null;
      try {
        st.requests.push(S.TABLE);
        const r = await fetch(S.TABLE, { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status);
        const buf = await r.arrayBuffer();
        if (!(window.crypto && crypto.subtle)) throw new Error('this browser cannot check the table\'s fingerprint');
        if (hex(await crypto.subtle.digest('SHA-256', buf)) !== S.SHA256) throw new Error('the soil table is not the pinned version');
        try { t = JSON.parse(new TextDecoder().decode(buf)); } catch (_) { throw new Error('the soil table is not readable'); }
        why = validate(t);
      } catch (e) { why = (e && e.message) || 'the soil table could not be read'; }
      st.table = why ? null : t; st.why = why; st.status = why ? 'unavailable' : 'ok'; st.loading = null;
      redraw(); paint();   // draw first: the card states the number of cells actually drawn
    })();
    return st.loading;
  }
  const ready = () => st.status === 'ok' && !!st.table;

  // { kind, text } for one cell and period; kind: unavailable | no-soil | none | values
  function cellText(id, period = S.PERIOD) {
    if (!ready()) return { kind: 'unavailable', text: st.status === 'loading' || st.status === 'idle' ? 'loading the soil table…' : 'unknown — the soil table is not available' + (st.why ? ` (${st.why})` : '') };
    if (!inDomain(id)) return { kind: 'unavailable', text: 'unknown — not a 4-degree cell' };
    if (!S.PERIODS.includes(period)) return { kind: 'unavailable', text: 'unknown — no such reporting period in this product' };
    const rec = st.table.cells[id];
    if (!rec) return { kind: 'no-soil', text: 'no organic soil mapped in this cell by this model' };
    const p = rec.periods[period];
    if (p.coverage === 'none') return { kind: 'none', text: 'unknown — the model has no estimate for any part of this cell in this period' };
    const parts = S.COMPONENTS.map(c => p[c].state === 'positive' ? `${c} ≈ ${fmt(p[c].Mg, 't CO₂e per year')}`
      : `${c}: 0 assigned by this model in this period; this does not establish zero real-world emissions`);
    parts.push(rec.has_mapped_organic_soil ? `mapped organic soil ≈ ${fmt(rec.organic_km2, 'km²')}` : 'no organic soil mapped');
    if (p.coverage === 'incomplete') parts.push(`incomplete model coverage: source raster cells covering about ${fmt(p.incomplete_source_footprint_km2, 'km²')} within this 4° cell have missing estimates. Values sum the available raster cells`);
    return { kind: 'values', text: parts.join(' · ') };
  }
  // layer class: unavailable | no-soil | unknown | { zero: true, incomplete } | { bin, incomplete }
  // Coverage is kept for zeros as for values (GPT preview review H1): a 0 summed over part of a cell is drawn as incomplete too.
  function cellClass(id, comp = st.comp, period = S.PERIOD) {
    if (!ready() || !S.COMPONENTS.includes(comp) || !S.PERIODS.includes(period) || !inDomain(id)) return 'unavailable';
    const rec = st.table.cells[id]; if (!rec) return 'no-soil';
    const p = rec.periods[period], s = p[comp];
    if (!rec.has_mapped_organic_soil && s.state === 'zero') return 'no-soil';
    if (s.state === 'unknown') return 'unknown';
    if (s.state === 'zero') return { zero: true, incomplete: p.coverage === 'incomplete' };
    let i = 0; while (!(S.BINS[i] <= s.Mg && s.Mg < S.BINS[i + 1])) i++;
    return { bin: i, incomplete: p.coverage === 'incomplete' };
  }
  const bounds = id => { const [r, c] = id.split('_').map(Number), la = a => `${Math.abs(a)}°${a < 0 ? 'S' : 'N'}`, lo = a => `${Math.abs(a)}°${a < 0 ? 'W' : 'E'}`;
    return `${la(r * 4 - 90)}–${la(r * 4 - 86)}, ${lo(c * 4 - 180)}–${lo(c * 4 - 176)}`; };

  // ---------- words shared by the place row and the inspector
  const LABEL = 'Organic-soil emissions (modelled)';
  const CAVEAT = 'Totals for the whole 4° cell, not this point and not per hectare. Substantial model uncertainty; local uncertainty is not quantified. ' +
    'Glen et al. 2026 model outputs v1.0.1 (WRI Land &amp; Carbon Lab; CC BY 4.0): IPCC Tier 1 factors applied to mapped drainage and burned area. ' +
    'Drainage is inferred from nearby roads, canals and land use; fire is conservative. A period average, not this year, and not linked to fires shown elsewhere on this page.';
  const PERIOD_WARN = 'Differences between periods must not be interpreted as measured local change: input coverage and timing can affect them; several infrastructure layers are static.';
  const plabel = p => p.replace('_', '–');
  function periodsHtml(id) {
    const rows = S.PERIODS.map(p => `<li><b>${plabel(p)}</b> · ${esc(cellText(id, p).text)}</li>`).join('');
    return `<details class="soilper"><summary>Show all reporting periods</summary><p class="q">${PERIOD_WARN}</p><ul class="plist">${rows}</ul></details>`;
  }
  function rowHtml(id) {
    const t = cellText(id);
    if (t.kind !== 'values') return esc(t.text);
    return `modelled, not measured · <b>2021–2024 average</b> · ${esc(t.text)} <span class="q">${CAVEAT} Source checked ${S.CHECKED}.</span>${periodsHtml(id)}`;
  }
  S.placeRow = id => [LABEL + ' · whole containing 4° cell', rowHtml(id)];
  S.inspectRows = id => [
    ['Everything here', `<button type="button" class="placelink" data-cell="${esc(id)}">Everything we hold for this cell, all layers</button>`],
    ['Selected', `4° cell ${esc(id)} · ${bounds(id)} — a whole-cell total, outlined on the globe; not a value at the point you clicked`],
    ['Modelled values', rowHtml(id)],
    ['Shown on the globe', `${st.comp} emissions, 2021–2024 average, in t CO₂e per year per whole 4° cell. Cells shrink toward the poles, so colours compare cell totals, not emissions per km².`],
    ['Source', `Glen, E. et al. (2026). Global organic soil disturbance and greenhouse gas emissions, 2001 to 2024: model outputs (version 1.0.1). Zenodo. doi:10.5281/zenodo.22137130 · CC BY 4.0 · summed by Mother Earth from the 1 km maps into 4° cells. <a class="more" href="sources.html#soil">details</a>`],
  ];

  // ---------- the globe layer (drawn through the page's cell polygons; index.html render() asks for S.polys)
  const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
  const fillFor = i => rgba(S.RAMP[i], S.OPACITY);
  const STYLE = {
    stroke: 'rgba(20,12,4,.75)', zeroStroke: rgba(S.RAMP[3], 1), incStroke: 'rgba(186,140,255,1)', clear: 'rgba(0,0,0,0)',
    unknownStroke: 'rgba(255,90,60,.95)', unknownFill: 'rgba(255,90,60,.12)', selStroke: 'rgba(255,255,255,1)',
  };
  // drawnCells: cells carrying a model value or a model zero (what the Key counts); unknownCells: outlined as unknown only (not counted,
  // as the Key's definition says; GPT preview review H2). The selection outline is never counted.
  let drawnCells = 0, unknownCells = 0;
  S.polys = (matFor, cellGeom) => {
    const out = []; drawnCells = 0; unknownCells = 0;
    if (st.on && ready()) for (const id of Object.keys(st.table.cells)) {
      const k = cellClass(id); let fill, stroke, what;
      if (k === 'unknown') { fill = STYLE.unknownFill; stroke = STYLE.unknownStroke; what = 'unknown — no estimate for any part of this cell'; unknownCells++; }
      else if (k && k.zero) { fill = STYLE.clear; stroke = k.incomplete ? STYLE.incStroke : STYLE.zeroStroke; what = `0 assigned by this model (${st.comp})${k.incomplete ? ' · incomplete model coverage' : ''}`; drawnCells++; }
      else if (k && typeof k === 'object') { fill = fillFor(k.bin); stroke = k.incomplete ? STYLE.incStroke : STYLE.stroke; what = `${st.comp} ≈ ${fmt(st.table.cells[id].periods[S.PERIOD][st.comp].Mg, 't CO₂e per year')}${k.incomplete ? ' · incomplete model coverage' : ''}`; drawnCells++; }
      else continue;   // no-soil, unavailable: nothing drawn
      out.push({ layer: 'soil', id, soil: k, fill, stroke, mat: matFor ? matFor(fill) : undefined, geom: cellGeom(id),
        label: `<div style="font:12px IBM Plex Mono,monospace"><b>${LABEL}</b> · cell ${id}<br>${esc(what)}<br><span style="color:#7f8da3">2021–2024 average · whole 4° cell · modelled</span></div>` });
    }
    // the selected-cell outline belongs to this layer: drawn only while the layer is on, so opening a place panel with the layer off
    // changes nothing on the globe (the place view's read-only rule, index.html; nature-context-ui B5)
    if (st.on && st.sel && inDomain(st.sel)) out.push({ layer: 'soil-sel', id: st.sel, fill: STYLE.clear, stroke: STYLE.selStroke, alt: 0.009, mat: matFor ? matFor(STYLE.clear) : undefined, geom: cellGeom(st.sel), label: `<div style="font:12px IBM Plex Mono,monospace">Selected 4° cell ${st.sel}</div>` });
    return out;
  };
  S.drawn = () => st.on && drawnCells > 0;   // a value or a model zero; unknown-only outlines do not count
  // the selected-cell outline: while the place panel or a soil inspector shows a cell (proposal §1b)
  S.select = id => { st.sel = inDomain(id) ? id : null; redraw(); };
  S.clear = () => { if (st.sel === null) return; st.sel = null; redraw(); };
  S.ensure = () => loadTable();
  function redraw() { if (typeof ME.redraw === 'function') ME.redraw(); if (typeof ME.paintKeyExternal === 'function') ME.paintKeyExternal(); }

  // ---------- the card
  const $ = id => document.getElementById(id);
  function keyHtml() {
    const lab = ['more than 0, below 1,000', '1,000–10,000', '10,000–100,000', '100,000–1,000,000', '1,000,000–10,000,000', '10,000,000 or more'];
    const sw = (fill, stroke) => `<span class="soilsw" style="background:${fill};border-color:${stroke}"></span>`;
    return `<div class="soilcap">t CO₂e per year per whole 4° cell, 2021–2024 average (modelled)</div><ul class="soilkey">` +
      lab.map((l, i) => `<li>${sw(fillFor(i), STYLE.stroke)}${l}</li>`).join('') +
      `<li>${sw(STYLE.clear, STYLE.zeroStroke)}hollow: 0 assigned by this model (not proof of no emission)</li>` +
      `<li>${sw(fillFor(3), STYLE.incStroke)}violet outline: incomplete model coverage — filled, a sum over the available raster cells; hollow, a 0 over them</li>` +
      `<li>${sw(STYLE.unknownFill, STYLE.unknownStroke)}unknown: no estimate for the cell</li>` +
      `<li>${sw(STYLE.clear, STYLE.selStroke)}white outline: the selected cell</li>` +
      `<li>${sw(STYLE.clear, 'rgba(0,0,0,0)')}not drawn: no organic soil mapped</li></ul>`;
  }
  function paint() {
    const tgl = $('tgl-soil'); if (!tgl) return;
    tgl.setAttribute('aria-checked', String(st.on));
    const s = $('s-soil'), o = $('o-soil'), k = $('soil-key');
    for (const b of document.querySelectorAll('#soil-comp button')) { const c = b.dataset.comp; b.setAttribute('aria-checked', String(st.on && st.comp === c)); b.disabled = !st.on; b.tabIndex = st.comp === c ? 0 : -1; }
    if (!st.on) { s.textContent = 'off'; o.textContent = 'Off. Switch on to load the modelled 4° table.'; k.hidden = true; return; }
    k.hidden = !ready(); if (ready()) k.innerHTML = keyHtml();
    if (st.status === 'loading' || st.status === 'idle') { s.textContent = 'loading'; o.textContent = 'Loading the modelled 4° table…'; return; }
    if (!ready()) { s.textContent = 'unknown'; o.textContent = `Unknown — the soil table is not available (${st.why}). Nothing is drawn.`; return; }
    s.textContent = 'on';
    o.textContent = `${st.comp === 'drained' ? 'Drained' : 'Burned'} organic soils · 2021–2024 average · ${drawnCells} cells drawn${unknownCells ? ` and ${unknownCells} outlined as unknown` : ''} · Glen et al. 2026 v1.0.1 · checked ${S.CHECKED}.`;
  }
  S.paint = paint;
  function wire() {
    const tgl = $('tgl-soil'); if (!tgl) return;
    tgl.addEventListener('click', () => { st.on = !st.on; if (st.on) loadTable(); redraw(); paint(); });
    const grp = $('soil-comp');
    grp.addEventListener('click', e => { const b = e.target.closest('button[data-comp]'); if (!b || b.disabled || !st.on) return; st.comp = b.dataset.comp; redraw(); paint(); });
    grp.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || !st.on) return; e.preventDefault();
      st.comp = st.comp === 'drained' ? 'burned' : 'drained'; redraw(); paint(); const b = grp.querySelector(`button[data-comp="${st.comp}"]`); if (b) b.focus(); });
    paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  S.test = { fmt, inDomain, validate, cellText, cellClass, state: () => ({ on: st.on, comp: st.comp, status: st.status, why: st.why, sel: st.sel, requests: [...st.requests], drawn: drawnCells, unknown: unknownCells }) };
  ME.soil = S;
})();
