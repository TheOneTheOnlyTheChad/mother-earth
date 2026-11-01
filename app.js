/* Mother Earth — shared page logic for World View (index.html) and Sources & Details (sources.html).
 * One module decides freshness, wording, rules and the status report, so the two pages cannot drift. Spec v0.3 §7.
 * The page reads only the collector's published snapshots; never calls a data source directly (imagery tiles are the one exception, dated on the globe). */
(() => {
const ME = window.ME = {};
const HUB = ME.HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const CELL_DEG = ME.CELL_DEG = 4;
const REFRESH_MS = ME.REFRESH_MS = 5 * 60e3;
const BASELINE_SINCE = '30 Oct 2026';
const IMG_DAY = ME.IMG_DAY = new Date(Date.now() - 36 * 3600e3).toISOString().slice(0, 10);
const IMG_LABEL = ME.IMG_LABEL = new Date(IMG_DAY).toUTCString().slice(5, 16);
// Operating mode of the home collector. Change only when a schedule has been installed AND verified from logs (brief §5).
const SHIPS_MODE = ME.SHIPS_MODE = { text: 'manual samples — no schedule installed', verified_schedule: false };

const $ = ME.$ = id => document.getElementById(id);
const esc = ME.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ago = ME.ago = iso => { if (!iso) return 'unknown'; const s = (Date.now() - Date.parse(iso)) / 1000; return s < 90 ? Math.round(s) + ' s ago' : s < 5400 ? Math.round(s / 60) + ' min ago' : (s / 3600).toFixed(1) + ' h ago'; };
const dur = ME.dur = s => s < 3600 ? Math.round(s / 60) + ' min' : (s % 3600 === 0 ? (s / 3600) + ' h' : (s / 3600).toFixed(1) + ' h');   // plain-language limits: 10800 → "3 h"
const hhmm = ME.hhmm = iso => iso ? iso.slice(11, 16) + ' UTC' : '–';
const when = ME.when = iso => iso ? iso.replace('T', ' ').slice(0, 16) + ' UTC' : 'source time not supplied';
const num = (x, d = 2) => Number.isFinite(+x) ? (+x).toFixed(d) : '–';
const rowsToObjects = ME.rowsToObjects = snap => { const f = snap.record_fields || []; return (snap.records || []).map(r => Object.fromEntries(f.map((k, i) => [k, r[i]]))); };
ME.cellId = (lat, lng) => { const r = Math.max(0, Math.min(44, Math.floor((lat + 90) / CELL_DEG))), c = Math.max(0, Math.min(89, Math.floor((lng + 180) / CELL_DEG))); return r + '_' + c; };
ME.total = snap => Object.values((snap && snap.cells) || {}).reduce((n, c) => n + (c.count || 0), 0);

const LAYERS = ME.LAYERS = ['usgs', 'firms', 'ships', 'swpc', 'co2', 'seaice'];
const MAP_LAYERS = ME.MAP_LAYERS = ['usgs', 'firms', 'ships'];
const LABEL = ME.LABEL = { usgs: 'Earthquakes', firms: 'Fire detections', ships: 'Ships', swpc: 'Kp index', co2: 'CO₂', seaice: 'Sea ice' };
const SOURCE = ME.SOURCE = {
  usgs: { name: 'USGS', url: 'https://earthquake.usgs.gov/', credit: 'Credit: U.S. Geological Survey', terms: 'U.S. public domain' },
  firms: { name: 'NASA FIRMS', url: 'https://firms.modaps.eosdis.nasa.gov/', credit: 'We acknowledge the use of data and/or imagery from NASA\'s Land, Atmosphere Near real-time Capability for Earth observations (LANCE), part of NASA\'s Earth Science Data and Information System (ESDIS).', terms: 'NASA data policy; LANCE acknowledgment requested' },
  ships: { name: 'aisstream.io', url: 'https://aisstream.io/', credit: 'AIS via aisstream.io', terms: 'free API, server-side use only; no licence page published — redistribution scope not established' },
  swpc: { name: 'NOAA SWPC', url: 'https://www.swpc.noaa.gov/', credit: 'NOAA Space Weather Prediction Center', terms: 'U.S. public domain' },
  co2: { name: 'NOAA GML', url: 'https://gml.noaa.gov/ccgg/trends/', credit: 'Lan, X., Tans, P. and Thoning, K.W.: Trends in globally-averaged CO2 determined from NOAA Global Monitoring Laboratory measurements. NOAA GML.', terms: 'freely available; citation requested; recent months preliminary' },
  seaice: { name: 'NSIDC', url: 'https://nsidc.org/data/g02135', credit: 'Fetterer, F., K. Knowles, W. N. Meier, M. Savoie, and A. K. Windnagel. Sea Ice Index, Version 4. NSIDC.', terms: 'open (NOAA mirror); citation requested' },
  gibs: { name: 'NASA GIBS', url: 'https://earthdata.nasa.gov/gibs', credit: 'Imagery: NASA GIBS, VIIRS NOAA-20 true colour', terms: 'open; dated; not live' },
};
const TIER = ME.TIER = { usgs: 'observation', firms: 'observation (per satellite pass; NRT product)', ships: 'observation (sampled, not continuous)', swpc: 'observation (index, not a map layer)', co2: 'observation (one station index, not a map layer; recent months preliminary)', seaice: 'observation (passive-microwave extent; index per hemisphere, not a map layer)', gibs: 'imagery (dated, previous day)' };

// ---------- state
const state = ME.state = { usgs: null, firms: null, ships: null, swpc: null, co2: null, seaice: null };
ME.loadedAt = null;

async function getJson(path) { const r = await fetch(HUB + path, { cache: 'no-store' }); if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); }
ME.getJson = getJson;
ME.loadCells = async function () {
  for (const layer of LAYERS) { try { state[layer] = await getJson('/cells/' + layer); } catch (e) { state[layer] = null; } }
  ME.loadedAt = new Date().toISOString();
};

// ---------- freshness check 2 (§3.3): collector freshness; plus the reading corrections from the layout brief §5
// grade: adequate | partial | unknown.   why: the measured reason, shown next to every state word.
ME.freshness = function (layer) {
  const snap = state[layer];
  if (!snap) return { grade: 'unknown', why: 'no snapshot from the hub' };
  const ageS = (Date.now() - Date.parse(snap.retrieved_at)) / 1000;
  if (snap.source_status === 'down') return { grade: 'unknown', why: 'collector reported down: ' + (snap.note || '') };
  if (ageS > (snap.stale_after_s || 900)) return { grade: 'unknown', why: layer === 'ships' ? `last sample is over ${dur(snap.stale_after_s || 900)} old (${ago(snap.retrieved_at)}); current positions unknown` : `last snapshot is over ${dur(snap.stale_after_s || 900)} old (${ago(snap.retrieved_at)})` };
  // FIRMS (brief §5): an empty response is not a validated zero. day_range=1 = today (UTC): the file empties at 00:00 UTC and refills ~2–3 h behind.
  if (layer === 'firms' && ME.total(snap) === 0 && (snap.raw_bytes || 0) < 1000) return { grade: 'unknown', why: new Date().getUTCHours() < 4 ? `no detections processed yet for today (UTC) — FIRMS resets at 00:00 UTC, NRT runs ~2–3 h behind` : `source returned an empty file (${snap.raw_bytes || 0} bytes) — not a validated zero` };
  if (snap.source_status === 'degraded') return { grade: 'partial', why: layer === 'swpc' && snap.index ? `source degraded — observation ${ago(snap.index.time_tag)}, retrieved ${ago(snap.retrieved_at)}` : 'source degraded' };
  return { grade: 'adequate', why: 'retrieved ' + ago(snap.retrieved_at) };
};
ME.stateWord = f => f.grade === 'adequate' ? ['current', 'ok'] : f.grade === 'partial' ? ['degraded', 'warn'] : ['unknown', 'bad'];

// ---------- readings: one object per layer that both pages render from (value, unit, observed, source, freshness, coverage, comparison)
ME.readings = function () {
  const R = {};
  const u = state.usgs, fu = ME.freshness('usgs');
  R.usgs = { label: LABEL.usgs, source: SOURCE.usgs, fresh: fu, value: fu.grade !== 'unknown' ? ME.total(u) : null, unit: 'M2.5+ in the last 24 h',
    observed: u ? `feed generated ${hhmm(u.source_generated_at)}, ${Math.round(u.source_age_s || 0)} s old at retrieval` : '', retrieved: u && u.retrieved_at,
    coverage: 'M2.5 completeness is regional (USGS documents global completeness at M4.5+); cells shown partial', quantity: u && u.quantity, window: '24 h rolling window; events keep their age inside it', cadence: 'collected every 5 min', comparison: `none of ours yet — Mother Earth\'s own baseline accumulates from ${BASELINE_SINCE}` };
  const f = state.firms, ff = ME.freshness('firms');
  R.firms = { label: LABEL.firms, source: SOURCE.firms, fresh: ff, value: ff.grade !== 'unknown' ? ME.total(f) : null, unit: 'detections so far today (UTC)',
    observed: f ? `VIIRS NOAA-20, ${f.scope || 'world'}; passes since 00:00 UTC that NRT has processed (~2–3 h behind)` : '', retrieved: f && f.retrieved_at,
    coverage: 'pass schedule not yet wired; cloud may hide detections; one detection per pass, not one fire', quantity: f && f.quantity, window: 'today (UTC) so far — FIRMS day_range=1 is the current UTC date, not a rolling 24 h; the count resets at 00:00 UTC and is lowest in the first hours of the day', cadence: 'collected every 15 min', comparison: `none of ours yet — baseline accumulates from ${BASELINE_SINCE}`,
    caveat: 'NASA: not for tactical decisions or local-scale conditions' };
  const s = state.ships, fs = ME.freshness('ships');
  const lastCount = s ? ME.total(s) : null;
  R.ships = { label: LABEL.ships, source: SOURCE.ships, fresh: fs, value: fs.grade !== 'unknown' ? lastCount : null, lastSample: lastCount, unit: `vessel identities in a ${s ? s.window_s : 60} s AIS sample`,
    sampleEnd: s && s.window_end, observed: s ? `sample ended ${hhmm(s.window_end)}; ${s.class_a} Class A + ${s.class_b} Class B; socket up ${num(s.socket_up_s, 0)} of ${s.window_s} s` : '', retrieved: s && s.retrieved_at,
    mode: SHIPS_MODE.text, coverage: 'terrestrial AIS only — a cell with no vessels is not an empty sea; positions between samples unknown', quantity: s && s.quantity,
    window: s ? `${s.window_s} s listening sample per snapshot (duty cycle ≈ ${(100 * (s.window_s || 60) / 1800).toFixed(1)}% at a 30-min cadence)` : '60 s sample', cadence: SHIPS_MODE.text, comparison: `none of ours yet — baseline accumulates from first sample (31 Oct 2026)` };
  const k = state.swpc, fk = ME.freshness('swpc');
  R.swpc = { label: LABEL.swpc, source: SOURCE.swpc, fresh: fk, value: k && k.index && fk.grade !== 'unknown' ? k.index.value : null, unit: 'planetary Kp (0–9)',
    observedAt: k && k.index && k.index.time_tag, observed: k && k.index ? `observation ${hhmm(k.index.time_tag)} (${ago(k.index.time_tag)}); 3-hourly product` : '', retrieved: k && k.retrieved_at,
    coverage: 'planetary index, not a map layer', quantity: k && k.quantity, window: '3-hourly index', cadence: 'collected hourly', comparison: 'none' };
  const c = state.co2, fc = ME.freshness('co2'); const cm = (c && c.comparison) || {};
  const wk = (cm.basis || '').match(/week starting (\d{4}-\d\d-\d\d)/);
  const d1 = cm.week_average && cm.one_year_ago ? cm.week_average - cm.one_year_ago : null, d10 = cm.week_average && cm.ten_years_ago ? cm.week_average - cm.ten_years_ago : null;
  R.co2 = { label: LABEL.co2, source: SOURCE.co2, fresh: fc, value: c && c.index && fc.grade !== 'unknown' ? c.index.value : null, unit: 'ppm', date: c && c.index && c.index.date,
    observed: c && c.index ? `daily mean for ${c.index.date} (preliminary), Mauna Loa, Hawaii` : '', retrieved: c && c.retrieved_at,
    coverage: 'one station; not a map layer; recent months preliminary until NOAA finalises them', quantity: c && c.quantity, window: 'daily mean', cadence: 'collected hourly',
    comparison: d1 !== null ? `NOAA\'s own comparison for the week starting ${wk ? wk[1] : '?'}: week average ${num(cm.week_average)} is ${d1 > 0 ? '+' : ''}${num(d1)} ppm vs the same week 1 yr ago (${num(cm.one_year_ago)}) and ${d10 > 0 ? '+' : ''}${num(d10)} vs 10 yr ago (${num(cm.ten_years_ago)})${cm.increase_since_1800 ? `; +${num(cm.increase_since_1800)} since 1800` : ''}` : 'comparison not provided by the source this week',
    comparisonWho: 'source-provided (NOAA GML weekly file); not Mother Earth\'s', cmpWeek: wk ? wk[1] : null, d1, d10, cm };
  const i = state.seaice, fi = ME.freshness('seaice');
  const pct = h => { const cl = h && h.climatology_1981_2010; if (!cl) return 'no baseline for this day'; const pos = h.value < cl.p10 ? 'below the 10th percentile' : h.value < cl.p25 ? 'between the 10th and 25th percentile' : h.value <= cl.p75 ? 'within the middle half' : h.value <= cl.p90 ? 'between the 75th and 90th percentile' : 'above the 90th percentile'; return `${h.difference_from_average > 0 ? '+' : ''}${num(h.difference_from_average)} vs the 1981–2010 average of ${num(cl.average)} for this day of year (${pos})`; };
  const n = i && i.index && i.index.north, so = i && i.index && i.index.south;
  R.seaice = { label: LABEL.seaice, source: SOURCE.seaice, fresh: fi, north: n && fi.grade !== 'unknown' ? n.value : null, south: so && fi.grade !== 'unknown' ? so.value : null, unit: 'million km²', date: n && n.date,
    observed: n ? `daily extent for ${n.date} (~1 day latency)` : '', retrieved: i && i.retrieved_at,
    coverage: 'two numbers per day (area with ≥15% ice concentration); not a map layer; polar-cap imagery not shown (polar night blinds daylight sensors)', quantity: i && i.quantity, window: 'daily extent', cadence: 'collected at 03/09/15/21 UTC',
    comparison: n ? `Arctic ${pct(n)}; Antarctic ${pct(so)}` : 'unknown', comparisonWho: 'baseline is NSIDC\'s 1981–2010 climatology (source-provided); the subtraction is Mother Earth\'s', pctN: n && pct(n), pctS: so && pct(so) };
  return R;
};

// ---------- the status report (§7): generated from a template that cannot emit a cause; identical on both pages
ME.report = function (R) {
  const parts = [];
  const st = r => `${r.fresh.grade === 'adequate' ? 'current' : r.fresh.grade === 'partial' ? 'degraded' : 'unknown'} — ${r.fresh.why}`;
  parts.push(R.usgs.value !== null ? `${R.usgs.value.toLocaleString()} earthquakes M2.5+ observed in the last 24 h (USGS; ${R.usgs.observed}; retrieved ${ago(R.usgs.retrieved)})` : `earthquakes: unknown — ${R.usgs.fresh.why}`);
  parts.push(R.firms.value !== null ? `${R.firms.value.toLocaleString()} fire detections so far today, UTC (NASA FIRMS, ${state.firms.scope || 'world'}; retrieved ${ago(R.firms.retrieved)}; cloud may hide detections; ${R.firms.fresh.grade === 'partial' ? 'source degraded; ' : ''}detections per pass, not a fire census)` : `fires: unknown — ${R.firms.fresh.why}`);
  parts.push(R.ships.value !== null ? `${R.ships.value.toLocaleString()} vessel identities received during a ${state.ships.window_s} s AIS sample ending ${hhmm(R.ships.sampleEnd)} (aisstream.io, ${state.ships.class_a} Class A + ${state.ships.class_b} Class B; ${R.ships.mode}; terrestrial receivers only; positions between samples unknown)` : `ships: unknown — ${R.ships.fresh.why}${R.ships.lastSample !== null ? `; last sample ${R.ships.lastSample.toLocaleString()} vessels ending ${hhmm(R.ships.sampleEnd)}, current positions unknown` : ''}`);
  parts.push(R.swpc.value !== null ? `Kp ${R.swpc.value} observed ${hhmm(R.swpc.observedAt)} (${ago(R.swpc.observedAt)}; NOAA SWPC${R.swpc.fresh.grade === 'partial' ? '; source degraded — ' + R.swpc.fresh.why : ''})` : `Kp: unknown — ${R.swpc.fresh.why}`);
  parts.push(R.co2.value !== null ? `CO₂ ${num(R.co2.value)} ppm at Mauna Loa on ${R.co2.date} (NOAA GML, preliminary; ${R.co2.comparison})` : `CO₂: unknown — ${R.co2.fresh.why}`);
  parts.push(R.seaice.north !== null ? `sea ice on ${R.seaice.date}: Arctic ${num(R.seaice.north)} M km², Antarctic ${num(R.seaice.south)} M km² (NSIDC; ${R.seaice.comparison}; baseline NSIDC\'s, subtraction ours)` : `sea ice: unknown — ${R.seaice.fresh.why}`);
  parts.push('aircraft: not shown — OpenSky requires public sites to run a receiver that feeds the network; none installed');
  return { at: new Date().toISOString(), text: `As of ${new Date().toISOString().slice(11, 16)} UTC: ` + parts.join('; ') + '.', states: Object.fromEntries(Object.entries(R).map(([k, r]) => [k, st(r)])) };
};

// ---------- rules in force (§7.3): one list, rendered in full on Sources & Details and in part on World View
ME.rules = function (R) {
  const rows = [];
  const add = (section, k, v, fixed) => rows.push({ section, k, v, fixed: !!fixed });
  add('general', 'Promise', 'See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.', true);
  add('general', 'Cell size', `${CELL_DEG}° × ${CELL_DEG}° (fixed set; adjustable from phase 3)`);
  add('general', 'Viewers', 'never collect: this page reads published snapshots only', true);
  add('general', 'Sentence template', 'cannot emit a cause', true);
  add('general', 'Comparisons', `none of Mother Earth\'s own in phase 1; its baselines accumulate from ${BASELINE_SINCE}; descriptive comparisons from phase 3, highlights only after a held-out validation. Source-provided comparisons (NOAA CO₂, NSIDC climatology) are shown and labelled as the source\'s.`, true);
  for (const layer of LAYERS) {
    const s = state[layer]; const r = R[layer];
    add(layer, 'Tier', TIER[layer]);
    add(layer, 'Quantity', r.quantity || 'no snapshot yet');
    add(layer, 'Window', r.window);
    add(layer, 'Cadence', r.cadence);
    add(layer, 'Coverage rule', s && s.coverage_default ? `${s.coverage_default.grade}: ${s.coverage_default.evidence} (not adjustable)` : r.coverage, true);
    add(layer, 'Comparison', r.comparison + (r.comparisonWho ? ` — ${r.comparisonWho}` : ''), true);
    if (s) add(layer, 'Stale limit', `${dur(s.stale_after_s)} (stale_after_s = ${s.stale_after_s}) — the layer becomes Unknown past this (not adjustable)`, true);
    if (s) add(layer, 'Collector', `v${s.collector_version}, schema ${s.schema_version}, scheduled ${s.scheduled_for ? s.scheduled_for.slice(11, 16) + ' UTC' : ''}${s.ingested_from ? '; ingested from ' + s.ingested_from : ''}`);
    if (s && s.citation) add(layer, 'Citation', s.citation, true);
    if (layer === 'firms') add(layer, 'Source caveat', 'NASA LANCE: near-real-time product; "their use for tactical decision-making or informing about conditions at a local scale are not advised" (read 30 Oct 2026)', true);
    if (layer === 'ships') add(layer, 'Source terms', 'aisstream.io (read 31 Oct 2026): free; "Direct browser connections are not permitted. Connect from your own server"; 3 subscribed connections per account. No terms-of-use page exists on the site — redistribution/archival scope not established.', true);
    if (layer === 'seaice') add(layer, 'Map layer', 'not shown. Measured 30 Oct 2026: GIBS VIIRS sea ice paints 0.76% of the globe (polar night, cloud); AMSR2 concentration ended 1 Sep 2025; GHRSST MUR is an L4 analysis (model tier). Decision pending.', true);
  }
  add('aircraft', 'Status', 'not shown. OpenSky permits public sites only if they feed the network (reply 30 Oct 2026); cloud collectors are not whitelisted; a home ADS-B receiver in Cape Town is under consideration (site promising, reception unmeasured).', true);
  add('imagery', 'Imagery', `NASA GIBS VIIRS NOAA-20 true colour, ${IMG_DAY} (previous day; the only direct source call). The Arctic appears empty in late October because it is in polar night — a daylight sensor sees nothing there; this is not missing data.`);
  return rows;
};

// ---------- menu (both pages)
ME.menu = function () {
  const btn = $('menu-btn'), list = $('menu-list'); if (!btn || !list) return;
  const items = [...list.querySelectorAll('a')];
  const here = location.pathname.endsWith('sources.html') ? 'sources' : 'world';
  items.forEach(a => { if (a.dataset.page === here) a.setAttribute('aria-current', 'page'); });
  const open = o => { list.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); if (o) items[0].focus(); };
  btn.addEventListener('click', e => { e.stopPropagation(); open(!list.classList.contains('open')); });
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); open(true); } });
  list.addEventListener('keydown', e => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { open(false); btn.focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });
  document.addEventListener('click', e => { if (!list.contains(e.target) && e.target !== btn) open(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && list.classList.contains('open')) { open(false); btn.focus(); } });
  // the menu must not reach the globe
  ['pointerdown', 'pointermove', 'wheel', 'touchstart', 'touchmove'].forEach(t => btn.parentElement.addEventListener(t, e => e.stopPropagation(), { passive: true }));
};
ME.clock = function () { const c = $('clock'); if (c) setInterval(() => { c.firstChild.textContent = new Date().toISOString().slice(11, 19); }, 1000); };
})();
