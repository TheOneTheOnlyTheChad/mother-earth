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
const SHIPS_MODE = ME.SHIPS_MODE = { text: 'about every 30 min while the home Mac is awake and online (launchd; verified by two unattended samples, 1 Nov 2026) — gaps when it sleeps', verified_schedule: true };   // flip back to false if the schedule is removed

const $ = ME.$ = id => document.getElementById(id);
const esc = ME.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ago = ME.ago = iso => { if (!iso) return 'unknown'; const s = (Date.now() - Date.parse(iso)) / 1000; return s < 90 ? Math.round(s) + ' s ago' : s < 5400 ? Math.round(s / 60) + ' min ago' : (s / 3600).toFixed(1) + ' h ago'; };
const dur = ME.dur = s => s < 3600 ? Math.round(s / 60) + ' min' : (s % 3600 === 0 ? (s / 3600) + ' h' : (s / 3600).toFixed(1) + ' h');   // plain-language limits: 10800 → "3 h"
const hhmm = ME.hhmm = iso => iso ? iso.slice(11, 16) + ' UTC' : '–';
const when = ME.when = iso => iso ? iso.replace('T', ' ').slice(0, 16) + ' UTC' : 'source time not supplied';
const num = (x, d = 2) => Number.isFinite(+x) ? (+x).toFixed(d) : '–';

// ---------- missing vs genuine zero (review round 5): a value the source did not supply is NEVER formatted as 0.
// A zero the source did report is shown as 0 and said to be the source's, so the two can never be read as the same thing.
const MISSING = ME.MISSING = 'not provided';
const has = ME.has = x => !(x === null || x === undefined || x === '' || !Number.isFinite(+x));
const fmt = ME.fmt = (x, { dp = 0, unit = '', zeroNote = 'source-reported zero' } = {}) => {
  if (!has(x)) return MISSING;
  const n = +x;
  const s = n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp }) + (unit ? ' ' + unit : '');
  return n === 0 && zeroNote ? `${s} (${zeroNote})` : s;
};

// ---------- snapshot identity (review round 5): cells and records are only ever combined when they come from the SAME run.
// retrieved_at is written once per collector run and copied into both latest/<layer>.json and latest-cells/<layer>.json.
const snapId = ME.snapId = snap => (snap && snap.retrieved_at) || null;
ME.samePair = (cellsSnap, recordsSnap) => !!snapId(cellsSnap) && snapId(cellsSnap) === snapId(recordsSnap);

// ---------- extreme within a loaded snapshot (navigation only; not a ranking of the world).
// Records with no value are excluded, never treated as zero. Ties are all returned.
ME.extremeOf = (recs, key) => {
  const usable = (recs || []).filter(r => has(r[key]));
  if (!usable.length) return null;
  const max = Math.max(...usable.map(r => +r[key]));
  return { max, tied: usable.filter(r => +r[key] === max), excluded: (recs || []).length - usable.length, considered: usable.length };
};

// ---------- search over records ALREADY LOADED in this browser (thread 5). No geocoder, no place dataset,
// no country boundaries, no new request of any kind. Pure functions so they can be tested offline and run
// against real snapshots from the console (START-HERE §5a).
const MIN_QUERY = ME.MIN_QUERY = 2;             // one character matches nearly everything and helps nobody
const MIN_DIGITS = ME.MIN_DIGITS = 3;           // an MMSI fragment shorter than this is not a search
const MAX_RESULTS = ME.MAX_RESULTS = 12;        // the true total is always stated alongside
const SEARCH_RADIUS_KM = ME.SEARCH_RADIUS_KM = 250;   // a radius chosen for this box. NOT a coverage boundary, and not derived from the cell grid.
// Only fields a layer actually publishes as text. firms and forest publish none — they are never listed as text-searchable.
const TEXT_FIELDS = ME.TEXT_FIELDS = { usgs: ['title'], firms: [], ships: ['name', 'mmsi'], forest: [] };

const coordLabel = ME.coordLabel = (lat, lng) =>
  `${Math.abs(lat).toFixed(3)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lng).toFixed(3)}° ${lng < 0 ? 'W' : 'E'}`;
const trim0 = x => String(x).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');

// null  → not a coordinate attempt at all; the caller falls through to a text search.
// {ok:false, why} → it reads as one but cannot be accepted, with the reason in plain language.
// {ok:true, lat, lng, label}
ME.parseCoord = function (raw) {
  const q = String(raw ?? '').trim().replace(/[−–—]/g, '-');
  if (!q || !/\d/.test(q)) return null;
  if (/[^0-9NSEWnsew\s,.+\-°'"]/.test(q)) return null;          // any other letter: this is a text search
  if (/[°'"]/.test(q)) return { ok: false, why: 'Degrees, minutes and seconds are not accepted. Enter decimal degrees, latitude first: <code>-33.92, 18.42</code>.' };
  // A single run with no comma, hemisphere letter or internal space (".5", "219018123") is not a coordinate
  // attempt at all — it is far more likely an MMSI or magnitude fragment, so it falls through to a text search.
  if (!/[,NSEWnsew]/.test(q) && !/\S\s+\S/.test(q)) return null;
  // STRICT tokenising. Every character must belong to a token or a separator, and every token must match in
  // full. The earlier version scanned with `match()`, which SKIPS whatever it cannot match — so ".5" lost its
  // point and became 5, "-.5" lost its sign as well and flipped hemisphere, and "--5" quietly became -5.
  // Nothing may be discarded: a number we cannot read whole is refused by name, never repaired into another place.
  const spaced = q.replace(/([0-9.])\s*([NSEWnsew])/g, '$1 $2').replace(/([NSEWnsew])\s*([0-9.+-])/g, '$1 $2');
  const items = spaced.split(/[\s,]+/).filter(t => t !== '');
  const NUM = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;   // 5 · 5. · 5.5 · .5 · -.5 — each complete, none repaired
  const HEMI = /^[NSEWnsew]$/;
  const twoNumbers = 'Enter two numbers, latitude first and longitude second — <code>-33.92, 18.42</code> or <code>33.92S, 18.42E</code>.';
  const broken = items.find(t => !NUM.test(t) && !HEMI.test(t));
  if (broken) return { ok: false, why: `<code>${esc(broken)}</code> is not a number this box can read, so it is refused rather than guessed at. ${twoNumbers}` };
  const numTok = items.filter(t => NUM.test(t));
  if (numTok.length !== 2) return { ok: false, why: twoNumbers };
  // A hemisphere letter may be written before its number ("S33.92 E18.42") or after it ("33.92 S, 18.42 E").
  // A letter sitting between two numbers is ambiguous on its own, so the style is decided ONCE from where the
  // first letter falls relative to the first number, and then applied to all of them.
  const firstNum = items.findIndex(t => NUM.test(t)), firstHemi = items.findIndex(t => HEMI.test(t));
  const prefixStyle = firstHemi >= 0 && firstHemi < firstNum;
  const hemi = [null, null];
  let seen = -1, bad = false;
  items.forEach(t => {
    if (NUM.test(t)) { seen++; return; }
    const k = prefixStyle ? seen + 1 : seen;
    if (k < 0 || k > 1 || hemi[k]) { bad = true; return; }
    hemi[k] = t.toUpperCase();
  });
  if (bad) return { ok: false, why: twoNumbers };
  if ((hemi[0] === 'E' || hemi[0] === 'W') && (hemi[1] === 'N' || hemi[1] === 'S'))
    return { ok: false, why: `That reads as longitude first (${esc(numTok[0])}${hemi[0]}, ${esc(numTok[1])}${hemi[1]}). This box takes <b>latitude first</b>, then longitude.` };
  if (hemi[0] === 'E' || hemi[0] === 'W') return { ok: false, why: `The first value carries ${hemi[0]}, which marks a longitude. Latitude comes first here.` };
  if (hemi[1] === 'N' || hemi[1] === 'S') return { ok: false, why: `The second value carries ${hemi[1]}, which marks a latitude. Longitude comes second here.` };
  const val = (tok, h) => {
    const neg = tok.startsWith('-');
    if (neg && h) return null;                                   // "-33.92S" says south twice over: refuse rather than guess
    let v = Math.abs(parseFloat(tok));
    if (neg || h === 'S' || h === 'W') v = -v;
    return v;
  };
  const lat = val(numTok[0], hemi[0]), lng = val(numTok[1], hemi[1]);
  if (lat === null || lng === null) return { ok: false, why: 'A minus sign and a hemisphere letter together (<code>-33.92S</code>) is ambiguous, so it is refused rather than guessed. Use one or the other.' };
  if (!(lat >= -90 && lat <= 90)) return { ok: false, why: `Latitude ${esc(trim0(lat))} is outside −90 to 90. Latitude is the first value.` };
  if (!(lng >= -180 && lng <= 180)) return { ok: false, why: `Longitude ${esc(trim0(lng))} is outside −180 to 180. Longitude is the second value.` };
  return { ok: true, lat, lng, label: coordLabel(lat, lng) };
};

ME.kmBetween = function (aLat, aLng, bLat, bLng) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad, dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

// Escape FIRST, then wrap: the match is located in the raw string and each of the three pieces is escaped on its own,
// so source text can never reach the page as markup.
ME.markMatch = (s, at, len) => esc(String(s).slice(0, at)) + '<mark>' + esc(String(s).slice(at, at + len)) + '</mark>' + esc(String(s).slice(at + len));

// pools: [{layer, records, runId, fields}] — the caller has already excluded hidden, unusable and unknown layers,
// and `fields` is the record envelope's own field list, so a field the source did not publish is never searched.
ME.searchLoaded = function (raw, pools) {
  const q = String(raw ?? '').trim();
  const coord = ME.parseCoord(q);
  if (coord && coord.ok) {
    const hits = [];
    for (const p of pools) for (const r of p.records || []) {
      if (!Number.isFinite(+r.lat) || !Number.isFinite(+r.lng)) continue;
      const km = ME.kmBetween(coord.lat, coord.lng, +r.lat, +r.lng);
      if (km <= SEARCH_RADIUS_KM) hits.push({ layer: p.layer, rec: r, runId: p.runId, km, dead: null });
    }
    hits.sort((a, b) => a.km - b.km);
    return { kind: 'coord', coord, total: hits.length, hits: hits.slice(0, MAX_RESULTS),
      searched: pools.map(p => p.layer), considered: pools.reduce((n, p) => n + (p.records || []).length, 0) };
  }
  if (coord) return { kind: 'badcoord', why: coord.why };
  if (/^\d+$/.test(q)) { if (q.length < MIN_DIGITS) return { kind: 'short', why: `Enter at least ${MIN_DIGITS} digits of an MMSI.` }; }
  else if (q.length < MIN_QUERY) return { kind: 'short', why: `Enter at least ${MIN_QUERY} characters, or a latitude and longitude.` };
  const needle = q.toLowerCase();
  const hits = [], searched = [];
  let considered = 0;
  for (const p of pools) {
    const fields = (TEXT_FIELDS[p.layer] || []).filter(f => (p.fields || []).includes(f));
    if (!fields.length) continue;                                 // no text to search: not claimed as searched
    searched.push(p.layer);
    considered += (p.records || []).length;
    for (const r of p.records || []) {
      for (const f of fields) {
        const v = r[f] === null || r[f] === undefined ? '' : String(r[f]);
        const at = v.toLowerCase().indexOf(needle);
        if (at >= 0) { hits.push({ layer: p.layer, rec: r, runId: p.runId, field: f, text: v, at, len: q.length, dead: null }); break; }
      }
    }
  }
  // a bare number that found nothing may have been a half-typed position: offer the order, do not assume it
  const couldBeCoord = !hits.length && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(q);
  return { kind: 'text', q, total: hits.length, hits: hits.slice(0, MAX_RESULTS), searched, considered, couldBeCoord };
};

// ---------- solar geometry: COMPUTED astronomical context, not an observation (thread 5).
// Formulation: the Astronomical Almanac / USNO low-precision solar coordinates — mean longitude and anomaly,
// a two-term equation of centre, obliquity, then right ascension and declination, with GMST for the hour angle.
// A US Government work, so no licence obligation; nothing is reused at runtime and the page gains no dependency.
// ASSUMPTIONS, all of which make this differ from an observed sunrise:
//   · the Sun is a geometric point at its centre — NO atmospheric refraction (~34') and NO solar semi-diameter (~16'),
//     so true sunrise/sunset is about 50' of arc away from this boundary, and much further where the Sun's path is shallow;
//   · a spherical Earth: no topography, no observer elevation;
//   · UTC as supplied by the viewer's clock.
// No accuracy is claimed here. Agreement against an independent reference is measured in phase1/solar.test.mjs
// over a stated date range, and that measurement is the only figure quoted anywhere.
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const wrap180 = ME.wrap180 = d => ((d + 180) % 360 + 360) % 360 - 180;

// The point on Earth where the Sun is directly overhead at `date`.
ME.subsolar = function (date) {
  const d = date instanceof Date ? date : new Date(date);
  const n = d.getTime() / 86400000 + 2440587.5 - 2451545.0;        // days from J2000.0
  const L = 280.460 + 0.9856474 * n;                                // mean longitude
  const g = (357.528 + 0.9856003 * n) * D2R;                        // mean anomaly
  const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;   // ecliptic longitude
  const eps = (23.439 - 0.0000004 * n) * D2R;                       // obliquity
  const lat = Math.asin(Math.sin(eps) * Math.sin(lam)) * R2D;       // declination
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * R2D;
  const gmst = 280.46061837 + 360.98564736629 * n;                  // Greenwich mean sidereal time
  return { lat, lng: wrap180(ra - gmst), at: d.toISOString() };
};

// Geometric test: is (lat, lng) on the sunlit side at this subsolar point? Sun centre on the horizon is the boundary.
ME.sunlit = function (lat, lng, sub) {
  return Math.sin(lat * D2R) * Math.sin(sub.lat * D2R)
    + Math.cos(lat * D2R) * Math.cos(sub.lat * D2R) * Math.cos((lng - sub.lng) * D2R) > 0;
};

// Angular separation between two directions given as lat/lng, in degrees. Used to compare subsolar points
// against a reference without ever differencing longitudes directly (which breaks at the date line and the poles).
ME.angularSep = function (aLat, aLng, bLat, bLng) {
  const p1 = aLat * D2R, p2 = bLat * D2R, dl = (bLng - aLng) * D2R;
  const x = Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl);
  return Math.acos(Math.max(-1, Math.min(1, x))) * R2D;
};

// ---------- WebGL availability, in plain language (item 1). The minified library error goes to diagnostics, not to the reader.
ME.webglMissing = function () {
  try {
    const c = document.createElement('canvas');
    if (c.getContext('webgl2') || c.getContext('webgl')) return null;
    return 'This browser or device has 3-D graphics (WebGL) turned off or unavailable.';
  } catch (e) {
    return 'This browser blocked 3-D graphics (WebGL) when the page asked for it.';
  }
};
const rowsToObjects = ME.rowsToObjects = snap => { const f = snap.record_fields || []; return (snap.records || []).map(r => Object.fromEntries(f.map((k, i) => [k, r[i]]))); };
ME.cellId = (lat, lng) => { const r = Math.max(0, Math.min(44, Math.floor((lat + 90) / CELL_DEG))), c = Math.max(0, Math.min(89, Math.floor((lng + 180) / CELL_DEG))); return r + '_' + c; };
ME.total = snap => Object.values((snap && snap.cells) || {}).reduce((n, c) => n + (c.count || 0), 0);

const LAYERS = ME.LAYERS = ['usgs', 'firms', 'ships', 'forest', 'swpc', 'co2', 'seaice'];
const MAP_LAYERS = ME.MAP_LAYERS = ['usgs', 'firms', 'ships', 'forest'];   // forest is cells-only: counts per cell, no points
const LABEL = ME.LABEL = { usgs: 'Earthquakes', firms: 'Fire detections', ships: 'Ships', forest: 'Forest disturbance', swpc: 'Kp index', co2: 'CO₂', seaice: 'Sea ice' };
const SOURCE = ME.SOURCE = {
  usgs: { name: 'USGS', url: 'https://earthquake.usgs.gov/', credit: 'Credit: U.S. Geological Survey', terms: 'U.S. public domain' },
  firms: { name: 'NASA FIRMS', url: 'https://firms.modaps.eosdis.nasa.gov/', credit: 'We acknowledge the use of data and/or imagery from NASA\'s Land, Atmosphere Near real-time Capability for Earth observations (LANCE), part of NASA\'s Earth Science Data and Information System (ESDIS).', terms: 'NASA data policy; LANCE acknowledgment requested' },
  ships: { name: 'aisstream.io', url: 'https://aisstream.io/', credit: 'AIS via aisstream.io', terms: 'free API, server-side use only; no licence page published — redistribution scope not established' },
  forest: { name: 'Global Nature Watch', url: 'https://www.globalforestwatch.org/', credit: 'Source: "Integrated Deforestation Alerts". UMD/GLAD and WUR, accessed through Global Nature Watch. Powered by Resource Watch / Global Nature Watch (WRI).', terms: 'CC BY 4.0 (dataset metadata); WRI terms: attribute the API; comply with the dataset licence' },
  swpc: { name: 'NOAA SWPC', url: 'https://www.swpc.noaa.gov/', credit: 'NOAA Space Weather Prediction Center', terms: 'U.S. public domain' },
  co2: { name: 'NOAA GML', url: 'https://gml.noaa.gov/ccgg/trends/', credit: 'Lan, X., Tans, P. and Thoning, K.W.: Trends in globally-averaged CO2 determined from NOAA Global Monitoring Laboratory measurements. NOAA GML.', terms: 'freely available; citation requested; recent months preliminary' },
  seaice: { name: 'NSIDC', url: 'https://nsidc.org/data/g02135', credit: 'Fetterer, F., K. Knowles, W. N. Meier, M. Savoie, and A. K. Windnagel. Sea Ice Index, Version 4. NSIDC.', terms: 'open (NOAA mirror); citation requested' },
  gibs: { name: 'NASA GIBS', url: 'https://earthdata.nasa.gov/gibs', credit: 'Imagery: NASA GIBS, VIIRS NOAA-20 true colour', terms: 'open; dated; not live' },
};
const TIER = ME.TIER = { usgs: 'observation', firms: 'observation (per satellite pass; NRT product)', ships: 'observation (sampled, not continuous)', forest: 'observation (satellite-derived alert pixels, published; three alert systems with their own confidence rules)', swpc: 'observation (index, not a map layer)', co2: 'observation (one station index, not a map layer; recent months preliminary)', seaice: 'observation (passive-microwave extent; index per hemisphere, not a map layer)', gibs: 'imagery (dated, previous day)' };

// ---------- state
const state = ME.state = { usgs: null, firms: null, ships: null, forest: null, swpc: null, co2: null, seaice: null };
ME.loadedAt = null;

async function getJson(path) { const r = await fetch(HUB + path, { cache: 'no-store' }); if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); }
ME.getJson = getJson;
// `layers` lets World View refresh only the layers that have no records of their own; the record layers are fetched
// and committed as validated cells+records pairs by the page (review round 5). Sources & Details calls it with no
// argument and gets all seven, because it renders counts and wording only.
ME.loadCells = async function (layers) {
  for (const layer of (layers || LAYERS)) { try { state[layer] = await getJson('/cells/' + layer); } catch (e) { state[layer] = null; } }
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
  if (layer === 'forest' && !(snap.sweep && snap.sweep.answered)) return { grade: 'unknown', why: 'no cell has answered yet — the sweep has not started' };
  if (layer === 'forest') return { grade: 'partial', sweeping: snap.sweep.answered < snap.sweep.cells_total, why: `${snap.sweep.answered < snap.sweep.cells_total ? 'first sweep in progress: ' : 'coverage partial by design: '}${snap.sweep.answered} of ${snap.sweep.cells_total} cells answered; oldest query ${ago(snap.sweep.oldest_queried_at)}; last run ${ago(snap.retrieved_at)}` };   // partial by design in phase 1 (REGISTER: no per-cell observation-opportunity record)
  // the card and the report already print the observation and retrieval times; this reason must not repeat them (review round 5)
  if (snap.source_status === 'degraded') return { grade: 'partial', why: 'the source flagged this observation as degraded' };
  return { grade: 'adequate', why: 'retrieved ' + ago(snap.retrieved_at) };
};
ME.stateWord = (f, layer) => f.grade === 'adequate' ? ['current', 'ok'] : f.grade === 'partial' ? (layer === 'forest' ? [f.sweeping ? 'sweeping' : 'partial', 'warn'] : ['degraded', 'warn']) : ['unknown', 'bad'];   // forest is partial by design (REGISTER): say what it is, not 'degraded'

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
    sampleEnd: s && s.window_end, observed: s ? `sample ended ${hhmm(s.window_end)}; ${s.class_a} Class A + ${s.class_b} Class B; socket connected ${num(s.socket_connected_s ?? s.socket_up_s, 0)} s of ${s.window_s} s` : '', retrieved: s && s.retrieved_at,
    mode: SHIPS_MODE.text, coverage: 'terrestrial AIS only — a cell with no vessels is not an empty sea; positions between samples unknown', quantity: s && s.quantity,
    window: s ? `${s.window_s} s listening sample per snapshot (duty cycle ≈ ${(100 * (s.window_s || 60) / 1800).toFixed(1)}% at a 30-min cadence)` : '60 s sample', cadence: SHIPS_MODE.text, comparison: `none of ours yet — baseline accumulates from first sample (31 Oct 2026)` };
  const fo = state.forest, ffo = ME.freshness('forest');
  const fsum = fo ? Object.values(fo.cells || {}).reduce((a, c) => { a.n += c.count || 0; a.hi += (c.confidence && c.confidence.highest) || 0; a.cells++; return a; }, { n: 0, hi: 0, cells: 0 }) : { n: 0, hi: 0, cells: 0 };
  R.forest = { label: LABEL.forest, source: SOURCE.forest, fresh: ffo, value: ffo.grade !== 'unknown' ? fsum.n : null, highest: fsum.hi, cells: fsum.cells, sweep: fo && fo.sweep, unit: 'alert pixels (10 m) · published in the last 7 days',
    observed: fo && fo.sweep ? `${fo.sweep.answered} of ${fo.sweep.cells_total} tropical land cells queried (each cell carries its own query time; sweep ≈ 2 days); dataset ${fo.source_version || 'latest'}` : '', retrieved: fo && fo.retrieved_at,
    coverage: 'alert systems operate between 30°N and 30°S only — cells outside are unknown by definition, not zero; inside, cloud and alert-system coverage vary (partial); counts can fall when low-confidence alerts are retracted', quantity: fo && fo.quantity,
    window: 'alerts whose detection date falls in the 7 days before each cell\'s query; detection date ≠ clearing date', cadence: '6 cells every 30 min (one GFW query each, sequential); full sweep ≈ 2 days', comparison: `none of ours yet — baseline accumulates from 1 Nov 2026 (forest_daily)`,
    caveat: 'GFW: alerts detect tree-cover disturbance and do not distinguish human-caused loss from other types; not for area estimates or trend assessment' };
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
  const st = (r, k) => `${ME.stateWord(r.fresh, k)[0]} — ${r.fresh.why}`;
  parts.push(R.usgs.value !== null ? `${R.usgs.value.toLocaleString()} earthquakes M2.5+ observed in the last 24 h (USGS; ${R.usgs.observed}; retrieved ${ago(R.usgs.retrieved)})` : `earthquakes: unknown — ${R.usgs.fresh.why}`);
  parts.push(R.firms.value !== null ? `${R.firms.value.toLocaleString()} fire detections so far today, UTC (NASA FIRMS, ${state.firms.scope || 'world'}; retrieved ${ago(R.firms.retrieved)}; cloud may hide detections; ${R.firms.fresh.grade === 'partial' ? 'source degraded; ' : ''}detections per pass, not a fire census)` : `fires: unknown — ${R.firms.fresh.why}`);
  parts.push(R.ships.value !== null ? `${R.ships.value.toLocaleString()} vessel identities received during a ${state.ships.window_s} s AIS sample ending ${hhmm(R.ships.sampleEnd)} (aisstream.io, ${state.ships.class_a} Class A + ${state.ships.class_b} Class B; ${R.ships.mode}; terrestrial receivers only; positions between samples unknown)` : `ships: unknown — ${R.ships.fresh.why}${R.ships.lastSample !== null ? `; last sample ${R.ships.lastSample.toLocaleString()} vessels ending ${hhmm(R.ships.sampleEnd)}, current positions unknown` : ''}`);
  parts.push(R.forest.value !== null ? `${R.forest.value.toLocaleString()} forest-disturbance alert pixels published in the last 7 days across ${R.forest.cells} queried cells (${R.forest.highest.toLocaleString()} highest-confidence; Global Nature Watch integrated alerts; sweep ${R.forest.sweep.answered} of ${R.forest.sweep.cells_total} tropical land cells; 10 m pixels, not hectares; detection date ≠ clearing date; not for area or trend)` : `forest disturbance: unknown — ${R.forest.fresh.why}`);
  parts.push(R.swpc.value !== null ? `Kp ${R.swpc.value} observed ${hhmm(R.swpc.observedAt)} (${ago(R.swpc.observedAt)}; NOAA SWPC${R.swpc.fresh.grade === 'partial' ? '; source degraded' : ''})` : `Kp: unknown — ${R.swpc.fresh.why}`);
  parts.push(R.co2.value !== null ? `CO₂ ${num(R.co2.value)} ppm at Mauna Loa on ${R.co2.date} (NOAA GML, preliminary; ${R.co2.comparison})` : `CO₂: unknown — ${R.co2.fresh.why}`);
  parts.push(R.seaice.north !== null ? `sea ice on ${R.seaice.date}: Arctic ${num(R.seaice.north)} M km², Antarctic ${num(R.seaice.south)} M km² (NSIDC; ${R.seaice.comparison}; baseline NSIDC\'s, subtraction ours)` : `sea ice: unknown — ${R.seaice.fresh.why}`);
  parts.push('aircraft: not shown — OpenSky requires public sites to run a receiver that feeds the network; none installed');
  return { at: new Date().toISOString(), text: `As of ${new Date().toISOString().slice(11, 16)} UTC: ` + parts.join('; ') + '.', states: Object.fromEntries(Object.entries(R).map(([k, r]) => [k, st(r, k)])) };
};

// ---------- rules in force (§7.3): one list, rendered in full on Sources & Details and in part on World View
ME.rules = function (R) {
  const rows = [];
  const add = (section, k, v, fixed) => rows.push({ section, k, v, fixed: !!fixed });
  add('general', 'Promise', 'See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.', true);
  add('general', 'Cell size', `${CELL_DEG}° × ${CELL_DEG}° (fixed set; adjustable from phase 3)`);
  add('general', 'Viewers', 'never collect: this page reads published snapshots only', true);
  add('general', 'Sentence template', 'cannot emit a cause', true);
  add('general', 'Missing is not zero', 'A value the source did not supply is shown as "not provided". A zero the source did report is shown as 0 and marked as the source\'s zero. The two are never displayed the same way.', true);
  add('general', 'Records and cells must match', 'Per-cell counts and individual records are only ever shown together when both files carry the same collector run (retrieved_at). If a run lands between the two reads the page re-reads the counts once; if they still differ, the counts are shown alone and the records are withheld with the reason. A failed record read clears the previous records instead of leaving them beside newer counts.', true);
  add('general', 'Day/night overlay', 'Optional, off unless switched on, and the only thing on this page that is computed rather than observed — tier: computed (astronomical context — calculated from the clock, not observed). It is not a layer: no source, no snapshot, no coverage grade, no freshness, and it never enters the status report. It shows calculated solar illumination for the UTC time it states, and nothing else: not whether anything was observed in daylight (the records were observed at many different times), not satellite coverage, not cloud, not visibility, and not evidence of absence. It does not explain fire-detection counts — VIIRS detects thermal anomalies by day and by night. The boundary is geometric (the Sun\'s centre on the horizon, no refraction and no solar disc), so it is not sunrise, and twilight is not drawn. It makes no request and recomputes locally once a minute while visible.', true);
  add('general', 'Search', `The Explore box searches only the records this browser has already loaded from each layer's latest snapshot. It searches earthquake descriptions as USGS writes them, vessel names and MMSIs, and a latitude and longitude typed in that order. Fire detections and forest disturbance publish no text and are never text-searched; fire detections are included in a coordinate search. A layer that is hidden, unknown, or whose records are withheld by the pairing rule is not searched, and the panel says which and why. There is no geocoder, no place-name dataset and no country boundaries: a place or country word matches the source's own description text and nothing more, so it finds records described that way and misses records in the same country described another way. Coordinates are read whole: leading decimals are kept as written, and a number that cannot be read in full is refused by name rather than repaired, because dropping a character would silently move the position somewhere else. A coordinate search always offers to move the view to the position, and separately lists loaded records within ${SEARCH_RADIUS_KM} km, nearest first, up to ${MAX_RESULTS} with the true total stated; that radius is a choice made for this box and is not a coverage boundary. Where the browser cannot show the globe there is no view to move, and the panel says so rather than reporting a movement that did not happen. "No matching loaded records" describes the loaded snapshot only and does not establish absence. A result stays tied to the collector run, the layer visibility and the freshness it was found under: if any of those changes the result is marked and refused rather than opened, and no camera movement or selection happens without a click.`, true);
  add('general', 'Navigation', 'The "find in this snapshot" buttons move the view to the largest value inside the records already loaded — the loaded snapshot, not the world, and not a danger ranking. They make no further requests, run only when clicked, and never move the camera on their own.', true);
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
    if (layer === 'forest') { add(layer, 'Source caveat', 'Global Nature Watch (read 1 Nov 2026): "these alerts detect forest or tree cover disturbances. This product does not distinguish between human-caused and other disturbance types"; "We do not recommend using deforestation alerts for global or regional trend assessment, nor for area estimates." Recent alerts include false positives that may later be removed; GLAD low-confidence alerts are removed after 180 days, RADD after 90.', true); add(layer, 'Attribution', 'WRI terms require crediting the API: "powered by Resource Watch" text-and-link form (no logos on this site); dataset CC BY 4.0 with the citation above.', true); add(layer, 'Coverage note', 'Only cells between 30°N and 30°S with land are ever queried (559 at 4°); the rest of the globe is outside the alert systems and is shown as nothing, not as zero.', true); }
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
