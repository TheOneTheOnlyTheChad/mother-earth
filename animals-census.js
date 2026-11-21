/* Mother Earth — Animals page, population counts (animals-tab-rc, stage 3; ANIMALS-PENGUIN-CHART-PROPOSAL rev 1.1). PRIVATE PREVIEW.
 * One card: the yearly census of occupied nest sites at each African penguin colony in one pinned, public-domain deposit,
 * 1979 to 2019, exactly as deposited. A dated record, not a feed.
 * What this file does: fetches its own list, the manifest the list pins, and the display file the manifest pins; checks each
 * checksum; then checks the display file's STRUCTURE (years, colonies, the three cell states, where the markers are, and every
 * colony's summary recomputed from its entries). Only then does it draw. If any check fails nothing is drawn and no number shown.
 * What it never does: add colonies together, compute a trend, percentage or projection, fill a missing year, draw the authors'
 * 0.1 model markers, or put anything on the globe. A line joins two counts only when they are in consecutive years.
 * It is separate from the journeys: its own list file and its own request, time limit and token. It does not need WebGL.
 * Every sentence and number on the card comes from the manifest; none is typed into the page. */
(() => {
  const ME = window.ME = window.ME || {};
  const $ = id => document.getElementById(id);
  const C = { CATALOG: 'assets/animals/populations-R1.catalog.json', CATALOG_SHA256: '5c49f68f6d1ae076b0b2b357637a9dd93602b19d14d8214ada272b3e55d848eb', BASE: 'assets/animals/', ID: 'african-penguin-census', WAIT_MS: 20000,
    T: { checking: 'Checking the census file…', unverified: 'The census file could not be verified. Nothing is shown.', failed: 'The census file could not be loaded. Nothing is shown.',
      ready: 'Census file verified.', open: 'Open the larger chart and the table', close: 'Close' } };
  const root = $('an-census'); if (!root) return;
  const st = { status: 'loading', detail: '', tok: 0, req: null, man: null, d: null, open: -1, announced: '' };
  const nf = x => Number(x).toLocaleString('en-GB');
  const hex = async buf => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
  class Unverified extends Error { }
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const SVG = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs) => { const e = document.createElementNS(SVG, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  function announce(t) { st.announced = t; const s = $('cen-say'); if (s) s.textContent = t; }

  // ---------- one colony's figures, recomputed here from its entries (the same definitions as the builder's)
  function summarise(years, v) {
    const cs = []; for (let i = 0; i < v.length; i++) if (Number.isInteger(v[i])) cs.push([years[i], v[i]]);
    if (!cs.length) return null;
    let hi = cs[0], lo = cs[0][1], joined = 0; for (let i = 0; i < cs.length; i++) { if (cs[i][1] > hi[1]) hi = cs[i]; if (cs[i][1] < lo) lo = cs[i][1]; if (i && cs[i][0] - cs[i - 1][0] === 1) joined++; }
    let inside = 0; for (let i = 0; i < v.length; i++) if (v[i] === null && years[i] > cs[0][0] && years[i] < cs[cs.length - 1][0]) inside++;
    return { counted_years: cs.length, first_year: cs[0][0], first_value: cs[0][1], last_year: cs[cs.length - 1][0], last_value: cs[cs.length - 1][1], highest_value: hi[1], highest_year: hi[0], lowest_value: lo,
      gaps_inside: inside, joined_pairs: joined, marker_years: years.filter((y, i) => v[i] === 'm') };
  }
  /** the display file's structure against its verified manifest; throws Unverified. Nothing is drawn from a file that fails. */
  function validate(man, d) {
    if (!man || man.kind !== 'colony-census' || !man.period || !Array.isArray(man.colonies) || !man.wording || !man.record || !man.totals) throw new Unverified('the manifest is not a colony-census manifest');
    if (!d || d.schema !== 1 || d.kind !== 'colony-census' || d.id !== man.id) throw new Unverified('the display file is not this census');
    const P = man.period, years = d.years;
    if (!Array.isArray(years) || years.length !== P.years || years[0] !== P.first_year || years[years.length - 1] !== P.last_year || years.some((y, i) => !Number.isInteger(y) || (i && y !== years[i - 1] + 1))) throw new Unverified('the years are not the manifest\'s period, consecutive, once each');
    if (!Array.isArray(d.colonies) || d.colonies.length !== man.colonies.length || d.colonies.length !== man.totals.colonies) throw new Unverified('the number of colonies does not match the manifest');
    let counts = 0, none = 0, marks = 0;
    d.colonies.forEach((c, k) => { const mc = man.colonies[k];
      if (!c || c.name !== mc.name || !Array.isArray(c.v) || c.v.length !== years.length) throw new Unverified('a colony is missing, out of order or has the wrong number of entries');
      for (const x of c.v) { if (x === null) none++; else if (x === 'm') marks++; else if (Number.isInteger(x) && x >= 1) counts++; else throw new Unverified('an entry is not a count, no count, or the marker'); }
      const s = summarise(years, c.v); if (!s) throw new Unverified('a colony has no count');
      for (const f of ['counted_years', 'first_year', 'first_value', 'last_year', 'last_value', 'highest_value', 'highest_year', 'lowest_value', 'gaps_inside', 'joined_pairs']) if (s[f] !== mc[f]) throw new Unverified(`a colony's summary does not match its entries (${f})`);
      if (s.marker_years.join() !== (mc.marker_years || []).join()) throw new Unverified('a marker is not where the manifest says');
      if (!Number.isInteger(mc.later_file_differing_years) || mc.later_file_differing_years < 0 || typeof mc.country !== 'string') throw new Unverified('a colony\'s details are malformed'); });
    if (counts !== man.totals.counts || none !== man.totals.no_count || marks !== man.totals.markers || counts + none + marks !== man.totals.cells) throw new Unverified('the totals of the three states do not match the manifest');
    for (const f of ['unit', 'unit_detail', 'version_note', 'no_total', 'one_colony', 'scales', 'no_count', 'no_count_general', 'marker', 'marker_note', 'archive']) if (typeof man.wording[f] !== 'string' || !man.wording[f]) throw new Unverified('a sentence the card needs is missing from the manifest');
    for (const f of ['dataset_citation_as_given', 'paper_citation_as_given', 'licence_as_given', 'licence_url', 'checked']) if (typeof man.record[f] !== 'string' || !man.record[f]) throw new Unverified('the record details are missing from the manifest');
  }

  // ---------- loading: its own request, time limit and token. A newer load or leaving the page cancels an older one, and an
  // answer that still arrives after that changes and says nothing.
  function cancel() { const r = st.req; st.req = null; st.tok++; if (r) { clearTimeout(r.timer); try { r.c.abort(); } catch (_) { } } }
  async function load(byUser) {
    cancel(); const tok = st.tok, c = new AbortController(), R = { c, timer: setTimeout(() => c.abort(), C.WAIT_MS) }; st.req = R;
    st.status = 'loading'; st.detail = ''; st.man = null; st.d = null; st.open = -1; paint();
    const get = async url => { const r = await fetch(url, { cache: 'no-store', signal: c.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); };
    const J = b => { try { return JSON.parse(new TextDecoder().decode(b)); } catch (_) { throw new Unverified('a file is not valid JSON'); } };
    try {
      const cb = await get(C.CATALOG); if (tok !== st.tok) return;
      if (await hex(cb) !== C.CATALOG_SHA256) throw new Unverified('the population list does not match its pinned checksum'); if (tok !== st.tok) return;
      const cat = J(cb), ce = cat && Array.isArray(cat.populations) ? cat.populations.find(e => e.id === C.ID) : null;
      if (!ce || typeof ce.manifest !== 'string' || !/^[\w.-]+$/.test(ce.manifest)) throw new Unverified('the population list has no usable entry for this census');
      const mb = await get(C.BASE + ce.manifest); if (tok !== st.tok) return;
      if (await hex(mb) !== ce.manifest_sha256) throw new Unverified('the manifest does not match the checksum in the population list'); if (tok !== st.tok) return;
      const man = J(mb), disp = man && man.display;
      if (!disp || typeof disp.file !== 'string' || !/^[\w.-]+$/.test(disp.file)) throw new Unverified('the manifest names no display file');
      const db = await get(C.BASE + disp.file); if (tok !== st.tok) return;
      if (db.byteLength !== disp.bytes || await hex(db) !== disp.sha256) throw new Unverified('the display file does not match the manifest checksum'); if (tok !== st.tok) return;
      const d = J(db); validate(man, d);
      st.man = man; st.d = d; st.status = 'ready';
      if (byUser) announce(C.T.ready);
    } catch (e) {
      if (tok !== st.tok) return;                                                    // superseded: say and change nothing
      st.man = null; st.d = null; st.status = e instanceof Unverified ? 'unverified' : 'failed'; st.detail = String(e && e.message || e);
      announce(st.status === 'unverified' ? C.T.unverified : C.T.failed);
    } finally { clearTimeout(R.timer); if (st.req === R) st.req = null; }
    paint();
  }

  // ---------- drawing
  /** the printed top of a chart's scale: the highest count rounded up to 1, 2, 2.5 or 5 times a power of ten */
  function scaleTop(max) { const p = Math.pow(10, Math.floor(Math.log10(max))); for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= max) return m * p; return 10 * p; }
  /** one colony's chart. Same year span in every chart; from zero; its own printed scale and unit; a dot per count; a line only
   *  between counts in consecutive years; nothing for a missing year or a marker. */
  function chart(years, v, big, label, narrow) {
    const W = big ? (narrow ? 360 : 720) : 260, H = big ? (narrow ? 230 : 300) : 130, L = big ? 14 : 8, Rm = big ? 14 : 8, T = big ? 34 : 26, B = big ? 26 : 18;
    const x0 = L, x1 = W - Rm, yTop = T, y0 = H - B, max = Math.max(...v.filter(Number.isInteger)), top = scaleTop(max);
    const X = y => x0 + (y - years[0]) / (years[years.length - 1] - years[0]) * (x1 - x0), Y = n => y0 - n / top * (y0 - yTop);
    const s = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: big ? (narrow ? 'cen-svg cen-svg-big cen-svg-narrow' : 'cen-svg cen-svg-big') : 'cen-svg', 'data-top': top, 'data-x0': x0, 'data-x1': x1, 'data-y0': y0, 'data-ytop': yTop, 'data-first': years[0], 'data-last': years[years.length - 1], preserveAspectRatio: 'xMidYMid meet' });
    if (label) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', label); } else s.setAttribute('aria-hidden', 'true');
    s.append(sv('line', { x1: x0, x2: x1, y1: yTop, y2: yTop, class: 'cen-grid' }), sv('line', { x1: x0, x2: x1, y1: y0, y2: y0, class: 'cen-axis' }));
    const t1 = sv('text', { x: x0, y: yTop - 6, class: 'cen-scale' }); t1.textContent = `${nf(top)} occupied nest sites`;
    const t0 = sv('text', { x: x0, y: y0 - 3, class: 'cen-zero' }); t0.textContent = '0';
    const ta = sv('text', { x: x0, y: H - 4, class: 'cen-year' }); ta.textContent = String(years[0]);
    const tb = sv('text', { x: x1, y: H - 4, class: 'cen-year', 'text-anchor': 'end' }); tb.textContent = String(years[years.length - 1]);
    s.append(t1, t0, ta, tb);
    let run = [];
    const flush = () => { if (run.length > 1) s.append(sv('polyline', { class: 'cen-line', points: run.map(([y, n]) => `${X(y).toFixed(2)},${Y(n).toFixed(2)}`).join(' '), 'data-years': run.map(r => r[0]).join(',') })); run = []; };
    years.forEach((y, i) => { if (Number.isInteger(v[i])) run.push([y, v[i]]); else flush(); }); flush();
    years.forEach((y, i) => { if (Number.isInteger(v[i])) s.append(sv('circle', { class: 'cen-dot', cx: X(y).toFixed(2), cy: Y(v[i]).toFixed(2), r: big ? 3.2 : 2.1, 'data-year': y, 'data-v': v[i] })); });
    return s;
  }
  const sumText = mc => `${mc.counted_years} of ${st.man.period.years} years have a count. First count ${mc.first_year}: ${nf(mc.first_value)}. Last count ${mc.last_year}: ${nf(mc.last_value)}. Highest ${mc.highest_year}: ${nf(mc.highest_value)}.`;

  function paintIntro() { const m = st.man, W = m.wording, box = $('cen-intro'); box.textContent = '';
    const p = (cls, t) => box.append(el('p', cls, t));
    p('cen-unit', W.unit + ' ' + W.unit_detail); p('cen-archive', W.archive); p('cen-version', W.version_note);
    p('cen-total', W.one_colony + ' ' + W.no_total); p('cen-scales', W.scales); p('cen-nocount', `“${W.no_count}”: ${W.no_count_general}`);
    const R = m.record, dl = $('cen-dates'); dl.textContent = '';
    for (const [k, v] of [['Period covered', `${m.period.first_year} to ${m.period.last_year}`], ['Version of the deposit', R.deposit_version_as_given || m.deposit_version], ['Record last checked by Mother Earth', R.checked]]) { dl.append(el('dt', '', k), el('dd', '', v)); }
    const src = $('cen-source'); src.textContent = '';
    const a = (href, t) => { const x = el('a', '', t); x.href = href; x.rel = 'noopener'; x.target = '_blank'; return x; };
    const line = (k, ...nodes) => { const q = el('p', 'cen-src'); q.append(el('b', '', k + ' '), ...nodes); src.append(q); };
    line('Dataset, cited as given:', R.dataset_citation_as_given, ' ', a(m.dataset_url, 'doi:' + m.dataset_doi));
    line('Paper, cited as given:', R.paper_citation_as_given);
    line('Licence, as the record gives it:', a(R.licence_url, R.licence_as_given));
    line('Evidence type:', m.evidence_type + '. ' + m.simplification + '.');
    line('Later file:', `${m.later_file.what}. It is not used here. ${m.later_file.total_differing_cells} entries differ in the shared years; where a colony is affected its details say how many. Source of that comparison: ${m.later_file.source_of_these_counts}.`);
  }
  function paintGrid() { const m = st.man, d = st.d, grid = $('cen-grid'); grid.textContent = ''; let country = null, list = null;
    d.colonies.forEach((c, k) => { const mc = m.colonies[k];
      if (mc.country !== country) { country = mc.country; grid.append(el('h4', 'cen-country', `${country} (${m.colonies.filter(x => x.country === country).length} colonies)`)); list = el('div', 'cen-list'); grid.append(list); }
      const b = el('button', 'cen-card'); b.type = 'button'; b.dataset.colony = String(k); b.id = 'cen-card-' + k; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'cen-detail');
      b.append(el('span', 'cen-name', c.name), chart(d.years, c.v, false, ''), el('span', 'cen-sum', sumText(mc)), el('span', 'cen-open', C.T.open));
      b.addEventListener('click', () => openDetail(k)); list.append(b); }); }
  function openDetail(k) { const m = st.man, d = st.d, c = d.colonies[k], mc = m.colonies[k], W = m.wording, box = $('cen-detail'); if (!c) return;
    const was = st.open; st.open = k; box.textContent = ''; box.hidden = false;
    const h = el('h4', 'cen-dh', `${c.name}: yearly entries, ${m.period.first_year} to ${m.period.last_year}`); h.id = 'cen-dh'; h.tabIndex = -1;
    const x = el('button', 'cen-close', C.T.close); x.type = 'button'; x.id = 'cen-close'; x.addEventListener('click', () => closeDetail(true));
    const head = el('div', 'cen-dhead'); head.append(h, x);
    const notes = el('div', 'cen-notes'); notes.append(el('p', '', `${mc.country}. ${sumText(mc)} ${mc.gaps_inside} of the years between the first and last count have no count in this file.`));
    for (const y of mc.marker_years) notes.append(el('p', 'cen-marknote', W.marker_note.replace('{year}', y)));
    if (mc.later_file_differing_years > 0) notes.append(el('p', 'cen-later', m.later_file.sentence.replace('{n}', mc.later_file_differing_years)));
    const tb = el('div', 'cen-tablebox'); tb.tabIndex = 0; tb.setAttribute('role', 'region'); tb.setAttribute('aria-label', `${c.name}: table of yearly entries`);
    const t = el('table', 'cen-table'); t.append(el('caption', '', `${c.name}: one row per year. ${W.unit}`));
    const hr = el('tr'); const h1 = el('th', '', 'Year'), h2 = el('th', '', 'Entry in the file'); h1.scope = 'col'; h2.scope = 'col'; hr.append(h1, h2); const th = el('thead'); th.append(hr); const body = el('tbody');
    d.years.forEach((y, i) => { const r = el('tr'), a = el('th', '', String(y)); a.scope = 'row'; const v = c.v[i], cell = el('td', v === null ? 'cen-none' : v === 'm' ? 'cen-mark' : 'cen-count', v === null ? W.no_count : v === 'm' ? W.marker : nf(v)); cell.dataset.state = v === null ? 'none' : v === 'm' ? 'marker' : 'count'; r.append(a, cell); body.append(r); });
    t.append(th, body); tb.append(t);
    const top = scaleTop(mc.highest_value), sc = el('p', 'cen-scaleline', `Chart scale: 0 to ${nf(top)} occupied nest sites. Years ${m.period.first_year} to ${m.period.last_year}. A dot is one count; a line joins counts in consecutive years only.`); sc.id = 'cen-scaleline';
    box.append(head, sc, chart(d.years, c.v, true, `${c.name}. ${W.unit} ${sumText(mc)} Scale from 0 to ${nf(top)}.`, box.clientWidth < 560), notes, tb);
    if (was >= 0 && $('cen-card-' + was)) $('cen-card-' + was).setAttribute('aria-expanded', 'false');
    $('cen-card-' + k).setAttribute('aria-expanded', 'true');
    h.focus({ preventScroll: true }); try { box.scrollIntoView({ block: 'nearest', behavior: 'auto' }); } catch (_) { }
    announce(`${c.name}: larger chart and table opened.`);
  }
  function closeDetail(refocus) { const k = st.open, box = $('cen-detail'); if (k < 0) return; st.open = -1; box.hidden = true; box.textContent = '';
    const b = $('cen-card-' + k); if (b) { b.setAttribute('aria-expanded', 'false'); if (refocus) b.focus(); }
    announce(`${st.d.colonies[k].name}: larger chart and table closed.`); }
  function paint() { const ready = st.status === 'ready', bad = st.status === 'unverified' || st.status === 'failed';
    const s = $('cen-state'); s.textContent = st.status === 'loading' ? C.T.checking : ready ? `${C.T.ready} ${st.man.totals.colonies} colonies, ${st.man.period.first_year} to ${st.man.period.last_year}.` : st.status === 'unverified' ? C.T.unverified : C.T.failed;
    const rb = $('cen-retry'); rb.hidden = !bad; root.setAttribute('aria-busy', st.status === 'loading' ? 'true' : 'false');
    $('cen-body').hidden = !ready; const box = $('cen-detail');
    if (!ready) { $('cen-intro').textContent = ''; $('cen-dates').textContent = ''; $('cen-source').textContent = ''; $('cen-grid').textContent = ''; box.textContent = ''; box.hidden = true; $('cen-title').textContent = ''; return; }
    $('cen-title').textContent = st.man.label; paintIntro(); paintGrid(); box.textContent = ''; box.hidden = true; }

  $('cen-retry').addEventListener('click', () => load(true));
  $('cen-detail').addEventListener('keydown', e => { if (e.key === 'Escape' && st.open >= 0) { e.preventDefault(); closeDetail(true); } });
  window.addEventListener('pagehide', () => { if (st.req) { cancel(); if (st.status === 'loading') { st.status = 'failed'; st.detail = 'cancelled when the page was left'; paint(); } } });
  window.addEventListener('pageshow', e => { if (e.persisted && st.status !== 'ready') load(false); });

  ME.census = { C, load, open: openDetail, close: closeDetail, scaleTop, summarise,
    state: () => ({ status: st.status, detail: st.detail, busy: !!st.req, tok: st.tok, open: st.open, announced: st.announced, colonies: st.d ? st.d.colonies.length : 0 }) };
  load(false);
})();
