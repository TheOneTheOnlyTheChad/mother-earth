/* Mother Earth — shared page logic for World View (index.html) and Sources & Details (sources.html).
 * One module decides freshness, wording, rules and the status report, so the two pages cannot drift. Spec v0.3 §7.
 * The page reads only the collector's published snapshots; never calls a data source directly (imagery tiles are the one exception, dated on the globe). */
(() => {
const ME = window.ME = {};
const HUB = ME.HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const CELL_DEG = ME.CELL_DEG = 4;
const REFRESH_MS = ME.REFRESH_MS = 5 * 60e3;
const BASELINE_SINCE = '30 Oct 2026';
// What the hub keeps per layer (read from D1 + R2 lifecycle rules, 4 Nov 2026). Shown wherever a comparison is mentioned.
// History, as REPORTED by the hub (GET / → history: {collecting, retained:{exists, first, last, layers}}) — two separate facts:
// whether new history is being collected now, and what history already exists. Collection off never means "deleted";
// an unreadable hub means unknown, never "none" (GPT re-check, 5 Nov). Base lines (KEPT) state only what is always true.
ME.HISTORY = null;
ME.loadHistory = async () => { try { const j = await getJson('/'); ME.HISTORY = (j && j.history) || null; } catch (e) { ME.HISTORY = null; } return ME.HISTORY; };
const HIST_LAYERS = ME.HIST_LAYERS = ['usgs', 'firms', 'seaice', 'co2', 'drifters', 'plastic', 'orbital'];
const KEPT_WITH_HISTORY = ME.KEPT_WITH_HISTORY = {
  usgs: 'every revision of every event we receive, and the last published file of each UTC day',
  firms: 'per-cell daily totals as of our last pull of each UTC day (later-processed detections not included), and that day\'s last published file',
  seaice: 'each daily value per hemisphere with NSIDC\'s climatology value for that day, and each changed published file',
  co2: 'each changed published file',
  drifters: 'each buoy fix as returned by our hourly query (a sampled track, not every fix the buoy reported; corrections kept)',
  plastic: 'each changed version of NOAA\'s published data or of our check results',
  orbital: 'the population in our catalogue query per published element file (counts by object type)',
};
const d10 = x => String(x || '').slice(0, 10);
ME.historyLine = layer => {
  const h = ME.HISTORY; if (!HIST_LAYERS.includes(layer)) return null;
  if (!h || !h.retained || typeof h.retained.exists !== 'boolean') return 'whether further history is kept could not be read just now';
  const r = h.retained.layers && h.retained.layers[layer], what = KEPT_WITH_HISTORY[layer];
  if (h.collecting) return r ? `${what} (collecting; retained since ${d10(r.first)})` : `${what} (collecting; nothing retained for this layer yet)`;
  if (r) return `${what}: retained for ${d10(r.first)} to ${d10(r.last)}; collection is off now — retained history is not deleted`;
  return 'no further history collected';
};
ME.kept = layer => { const b = KEPT[layer], hl = ME.historyLine(layer); return b && hl ? `${b}; ${hl}` : (b || hl); };
const KEPT = ME.KEPT = { usgs: 'hourly per-cell counts kept since 30 Oct 2026', firms: 'hourly per-cell counts kept since 30 Oct 2026', ships: 'hourly per-cell counts kept since 1 Nov 2026; no vessel position kept beyond 2 days', forest: 'daily per-cell alert counts kept since 1 Nov 2026', swpc: 'every Kp value kept since 30 Oct 2026', co2: 'daily values kept as NOAA publishes them, since 29 Oct 2026', seaice: 'the current file', drifters: 'the current file', plastic: 'the current NOAA file, plus Oceaneye\'s original file used for the checks' };   // always-true base facts; history is added by ME.historyLine
const IMG_DAY = ME.IMG_DAY = new Date(Date.now() - 36 * 3600e3).toISOString().slice(0, 10);
const IMG_LABEL = ME.IMG_LABEL = new Date(IMG_DAY).toUTCString().slice(5, 16);
// Backdrop imagery layer (8 Nov 2026): NOAA-21. Measured 8 Nov: NOAA-21 had far fewer near-black pixels than NOAA-20 for 6–7 Nov
// (the dates the page shows now), but more for 4–5 Nov — this improves the current images, it does not guarantee completeness.
// A later fallback rule is a separate proposal. One place to change it; the page names it.
const IMG_LAYER = ME.IMG_LAYER = { id: 'VIIRS_NOAA21_CorrectedReflectance_TrueColor', sat: 'NOAA-21' };
// Operating mode of the home collector. Change only when a schedule has been installed AND verified from logs (brief §5).
/* Cloud fallback (hub 0.3.5, 3 Nov 2026): taken only when no home sample arrived for 40 min. Measured once so far: the cloud
 * connection heard 1,873 vessels in 60 s vs the home collector's 3,408 — stated, never hidden; update after more samples. */
ME.SHIPS_CLOUD_TEXT = 'this sample was taken by the cloud hub because no home sample arrived in the last 40 min — in our tests the cloud connection hears fewer vessels than the home collector (1,873 vs 3,408 on 3 Nov), so a lower count here is not fewer ships';
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

// FRP as delivered (smoke review 6 Nov): FIRMS reports FRP to 2 decimals, so it is shown to 2 decimals at most and is never
// rounded to a whole number. A positive value can never read as 0, a reported 0 is labelled as the source's, and a missing
// value is "not provided".
const frp = ME.frp = x => {
  if (!has(x)) return MISSING;
  const v = +x;
  if (v === 0) return fmt(0, { unit: 'MW' });
  if (v > 0 && v < 0.005) return '< 0.01 MW';
  return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' MW';
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
const LABEL = ME.LABEL = { usgs: 'Earthquakes', firms: 'Fire detections', ships: 'Ships', forest: 'Forest disturbance', swpc: 'Kp index', co2: 'CO₂', seaice: 'Sea ice', drifters: 'Drifting buoys', plastic: 'Microplastic samples' };
const SOURCE = ME.SOURCE = {
  usgs: { name: 'USGS', url: 'https://earthquake.usgs.gov/', credit: 'Credit: U.S. Geological Survey', terms: 'U.S. public domain' },
  firms: { name: 'NASA FIRMS', url: 'https://firms.modaps.eosdis.nasa.gov/', credit: 'We acknowledge the use of data and/or imagery from NASA\'s Land, Atmosphere Near real-time Capability for Earth observations (LANCE), part of NASA\'s Earth Science Data and Information System (ESDIS).', terms: 'NASA data policy; LANCE acknowledgment requested' },
  ships: { name: 'aisstream.io', url: 'https://aisstream.io/', credit: 'AIS via aisstream.io', terms: 'free API, server-side use only; no licence page published — redistribution scope not established' },
  forest: { name: 'Global Nature Watch', url: 'https://www.globalforestwatch.org/', credit: 'Source: "Integrated Deforestation Alerts". UMD/GLAD and WUR, accessed through Global Nature Watch. Powered by Resource Watch / Global Nature Watch (WRI).', terms: 'CC BY 4.0 (dataset metadata); WRI terms: attribute the API; comply with the dataset licence' },
  swpc: { name: 'NOAA SWPC', url: 'https://www.swpc.noaa.gov/', credit: 'NOAA Space Weather Prediction Center', terms: 'U.S. public domain' },
  co2: { name: 'NOAA GML', url: 'https://gml.noaa.gov/ccgg/trends/', credit: 'Lan, X., Tans, P. and Thoning, K.W.: Trends in globally-averaged CO2 determined from NOAA Global Monitoring Laboratory measurements. NOAA GML.', terms: 'freely available; citation requested; recent months preliminary' },
  seaice: { name: 'NSIDC', url: 'https://nsidc.org/data/g02135', credit: 'Fetterer, F., Knowles, K., Meier, W. N., Savoie, M., Windnagel, A. K. & Stafford, T. (2025). Sea Ice Index. (G02135, Version 4). [Data Set]. Boulder, Colorado USA. National Snow and Ice Data Center. https://doi.org/10.7265/a98x-0f50. Daily sea-ice extent, Northern and Southern Hemispheres, and the 1981–2010 daily climatology. Date accessed: the retrieval date of the snapshot shown.', terms: 'open (NOAA mirror); citation required as a condition of use' },
  plastic: { name: 'Oceaneye via NOAA NCEI', url: 'https://www.ncei.noaa.gov/products/microplastics', credit: 'NOAA NCEI Marine Microplastics (Nyadjro et al. 2018; Nyadjro et al. 2023, Scientific Data, doi:10.1038/s41597-023-02632-y); dataset NCEI Accession 0276422 (Faure, Saini, Potter, Galgani, de Alencastro, Hagmann 2023); original counts Hagmann & Potter (2022), SEANOE doi:10.17882/86630', terms: 'NCEI compiled product CC0; Oceaneye original CC BY 4.0; NCEI archive licence unstated' },
  drifters: { name: 'NOAA OSMC', url: 'https://osmc.noaa.gov/erddap/tabledap/OSMC_flattened.html', credit: 'NOAA Observing System Monitoring Center (OSMC) — drifting-buoy reports relayed over the WMO GTS', terms: 'CC0 1.0 (public domain dedication)' },
  gibs: { name: 'NASA GIBS', url: 'https://earthdata.nasa.gov/gibs', credit: `Imagery: NASA GIBS, VIIRS ${IMG_LAYER.sat} true colour`, terms: 'open; dated; not live' },
};
const TIER = ME.TIER = { usgs: 'observation', firms: 'observation (per satellite pass; NRT product)', ships: 'observation (sampled, not continuous)', forest: 'observation (satellite-derived alert pixels, published; three alert systems with their own confidence rules)', swpc: 'observation (index, not a map layer)', co2: 'observation (one station index, not a map layer; recent months preliminary)', seaice: 'observation (passive-microwave extent; index per hemisphere, not a map layer)', gibs: 'imagery (dated; not live)', drifters: 'observation (each buoy\'s latest reported fix; positions at different times, not one moment)', plastic: 'observation (dated samples 2011–2024; concentrations as published by NOAA NCEI; not current positions)' };

// ---------- state
const state = ME.state = { usgs: null, firms: null, ships: null, forest: null, swpc: null, co2: null, seaice: null, drifters: null, plastic: null };
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
  if (snap.source_status === 'degraded') return { grade: 'partial', why: ME.degradedWhy(layer, snap) };
  return { grade: 'adequate', why: 'retrieved ' + ago(snap.retrieved_at) };
};
// Why a snapshot is 'degraded' (8 Nov 2026, reviews/2026-11-08-kp-degraded-finding.md). The flag is set by OUR collector's
// rules, never by the source, so the wording names our rule. Observation age (how old the source's value is) is kept apart from
// collector freshness (when we last retrieved; handled above via stale_after_s). Ships' degraded state is a sampling-quality
// fact, never "late". Unknown or missing reasons get a neutral collection-quality sentence, never a cause.
const span = s => !Number.isFinite(s) ? 'unknown' : s >= 2 * 86400 ? (s / 86400).toFixed(1).replace(/\.0$/, '') + ' days' : dur(Math.round(s));
ME.kpInterval = t => { const a = Date.parse(t); return Number.isFinite(a) ? `${t.slice(11, 16)}–${new Date(a + 3 * 3600e3).toISOString().slice(11, 16)} UTC` : 'unknown interval'; };
ME.degradedWhy = function (layer, snap) {
  const r = snap && snap.status_reason;
  if (r && r.code === 'observation_older_than_limit') return `older than our observation-age limit: the newest value is ${span(r.age_s)} old, measured from ${layer === 'swpc' ? 'the start of its 3-hour interval' : 'its date'} (our limit: ${span(r.limit_s)}${layer === 'swpc' ? ', provisional' : ''}) — marked by our collector, not by the source`;
  if (r && r.code === 'feed_not_refreshed') return `the feed was generated ${span(r.age_s)} before our retrieval, beyond our ${span(r.limit_s)} feed-age limit — marked by our collector, not by the source`;
  if (r && r.code === 'time_tag_invalid') return `the source's timestamp for the newest value could not be read, so its age is unknown — marked by our collector`;
  if (r && r.code === 'time_tag_in_future') return `the source's timestamp for the newest value is later than our clock, so its age cannot be judged — marked by our collector`;
  if (r && r.code === 'sample_overlong') return `the sample ran ${span(r.elapsed_s)} against a ${span(r.window_s)} window (over our 1.25× limit), so it is not counted as a full sample — our sampling standard, not a statement about the source or the sea`;
  if (r && r.code === 'sample_flow_below_standard') return `messages flowed for ${Math.round((r.fraction || 0) * 100)}% of the ${span(r.window_s)} sample (inferred from arrival gaps; our standard is 90%) — our sampling standard, not a statement about the source or the sea`;
  if (layer === 'ships' && snap) {                     // the Mac collector's envelope carries the facts but no reason code
    const w = snap.window_s, f = snap.connection_fraction_of_sample;
    if (snap.overlong_sample) return `the sample ran ${span(snap.elapsed_wall_s)} against a ${span(w)} window (over our 1.25× limit), so it is not counted as a full sample — our sampling standard, not a statement about the source or the sea`;
    if (Number.isFinite(f) && f < 0.9) return `messages flowed for ${Math.round(f * 100)}% of the ${span(w)} sample (inferred from arrival gaps; our standard is 90%) — our sampling standard, not a statement about the source or the sea`;
  }
  return 'below our collection-quality standard for this layer — marked by our collector, not by the source';
};
ME.stateWord = (f, layer) => f.grade === 'adequate' ? [layer === 'plastic' ? 'loaded' : 'current', 'ok']   // plastic: the badge is about our retrieval, and beside 2011–2024 samples 'current' would read as current observations (GPT review, 4 Nov)
   : f.grade === 'partial' ? (layer === 'forest' ? [f.sweeping ? 'sweeping' : 'partial', 'warn'] : ['degraded', 'warn']) : ['unknown', 'bad'];   // forest is partial by design (REGISTER): say what it is, not 'degraded'

// ---------- readings: one object per layer that both pages render from (value, unit, observed, source, freshness, coverage, comparison)
ME.readings = function () {
  const R = {};
  const u = state.usgs, fu = ME.freshness('usgs');
  R.usgs = { label: LABEL.usgs, source: SOURCE.usgs, fresh: fu, value: fu.grade !== 'unknown' ? ME.total(u) : null, unit: 'M2.5+ in the last 24 h',
    observed: u ? `feed generated ${hhmm(u.source_generated_at)}, ${Math.round(u.source_age_s || 0)} s old at retrieval` : '', retrieved: u && u.retrieved_at,
    coverage: 'M2.5 completeness is regional (USGS documents global completeness at M4.5+); cells shown partial', quantity: u && u.quantity, window: '24 h rolling window; events keep their age inside it', cadence: 'collected every 5 min', comparison: `none of ours shown yet — ${ME.kept('usgs')}` };
  const f = state.firms, ff = ME.freshness('firms');
  R.firms = { label: LABEL.firms, source: SOURCE.firms, fresh: ff, value: ff.grade !== 'unknown' ? ME.total(f) : null, unit: 'detections so far today (UTC)',
    observed: f ? `VIIRS NOAA-20, ${f.scope || 'world'}; passes since 00:00 UTC that NRT has processed (~2–3 h behind)` : '', retrieved: f && f.retrieved_at,
    coverage: 'pass schedule not yet wired; cloud may hide detections; one detection per pass, not one fire', quantity: f && f.quantity, window: 'today (UTC) so far — FIRMS day_range=1 is the current UTC date, not a rolling 24 h; the count resets at 00:00 UTC and is lowest in the first hours of the day', cadence: 'collected every 15 min', comparison: `none of ours shown yet — ${ME.kept('firms')}`,
    caveat: 'NASA: not for tactical decisions or local-scale conditions' };
  const s = state.ships, fs = ME.freshness('ships');
  const lastCount = s ? ME.total(s) : null;
  R.ships = { label: LABEL.ships, source: SOURCE.ships, fresh: fs, value: fs.grade !== 'unknown' ? lastCount : null, lastSample: lastCount, unit: `vessel identities in a ${s ? s.window_s : 60} s AIS sample`,
    sampleEnd: s && s.window_end, observed: s ? `sample ended ${hhmm(s.window_end)}; ${s.class_a} Class A + ${s.class_b} Class B; socket connected ${num(s.socket_connected_s ?? s.socket_up_s, 0)} s of ${s.window_s} s` : '', retrieved: s && s.retrieved_at,
    mode: s && /cloud/.test(s.collected_by || '') ? ME.SHIPS_CLOUD_TEXT : SHIPS_MODE.text, coverage: 'terrestrial AIS only — a cell with no vessels is not an empty sea; positions between samples unknown', quantity: s && s.quantity,
    window: s ? `${s.window_s} s listening sample per snapshot (duty cycle ≈ ${(100 * (s.window_s || 60) / 1800).toFixed(1)}% at a 30-min cadence)` : '60 s sample', cadence: SHIPS_MODE.text, comparison: `none of ours shown yet — ${ME.kept('ships')}` };
  const fo = state.forest, ffo = ME.freshness('forest');
  const fsum = fo ? Object.values(fo.cells || {}).reduce((a, c) => { a.n += c.count || 0; a.hi += (c.confidence && c.confidence.highest) || 0; a.cells++; return a; }, { n: 0, hi: 0, cells: 0 }) : { n: 0, hi: 0, cells: 0 };
  R.forest = { label: LABEL.forest, source: SOURCE.forest, fresh: ffo, value: ffo.grade !== 'unknown' ? fsum.n : null, highest: fsum.hi, cells: fsum.cells, sweep: fo && fo.sweep, unit: 'alert pixels (10 m) · published in the last 7 days',
    observed: fo && fo.sweep ? `${fo.sweep.answered} of ${fo.sweep.cells_total} tropical land cells queried (each cell carries its own query time; sweep ≈ 2 days); dataset ${fo.source_version || 'latest'}` : '', retrieved: fo && fo.retrieved_at,
    coverage: 'alert systems operate between 30°N and 30°S only — cells outside are unknown by definition, not zero; inside, cloud and alert-system coverage vary (partial); counts can fall when low-confidence alerts are retracted', quantity: fo && fo.quantity,
    window: 'alerts whose detection date falls in the 7 days before each cell\'s query; detection date ≠ clearing date', cadence: '6 cells every 30 min (one GFW query each, sequential); full sweep ≈ 2 days', comparison: `none of ours shown yet — ${ME.kept('forest')}`,
    caveat: 'GFW: alerts detect tree-cover disturbance and do not distinguish human-caused loss from other types; not for area estimates or trend assessment' };
  const k = state.swpc, fk = ME.freshness('swpc');
  R.swpc = { label: LABEL.swpc, source: SOURCE.swpc, fresh: fk, value: k && k.index && fk.grade !== 'unknown' ? k.index.value : null, unit: 'planetary Kp (0–9)',
    observedAt: k && k.index && k.index.time_tag, observed: k && k.index ? `interval ${ME.kpInterval(k.index.time_tag)} (began ${ago(k.index.time_tag)}); 3-hourly product, timestamped at the interval start` : '', retrieved: k && k.retrieved_at,
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
  parts.push(R.firms.value !== null ? `${R.firms.value.toLocaleString()} fire detections so far today, UTC (NASA FIRMS, ${state.firms.scope || 'world'}; retrieved ${ago(R.firms.retrieved)}; cloud may hide detections; ${R.firms.fresh.grade === 'partial' ? 'marked degraded by our collector; ' : ''}detections per pass, not a fire census)` : `fires: unknown — ${R.firms.fresh.why}`);
  parts.push(R.ships.value !== null ? `${R.ships.value.toLocaleString()} vessel identities received during a ${state.ships.window_s} s AIS sample ending ${hhmm(R.ships.sampleEnd)} (aisstream.io, ${state.ships.class_a} Class A + ${state.ships.class_b} Class B; ${R.ships.mode}; terrestrial receivers only; positions between samples unknown)` : `ships: unknown — ${R.ships.fresh.why}${R.ships.lastSample !== null ? `; last sample ${R.ships.lastSample.toLocaleString()} vessels ending ${hhmm(R.ships.sampleEnd)}, current positions unknown` : ''}`);
  parts.push(R.forest.value !== null ? `${R.forest.value.toLocaleString()} forest-disturbance alert pixels published in the last 7 days across ${R.forest.cells} queried cells (${R.forest.highest.toLocaleString()} highest-confidence; Global Nature Watch integrated alerts; sweep ${R.forest.sweep.answered} of ${R.forest.sweep.cells_total} tropical land cells; 10 m pixels, not hectares; detection date ≠ clearing date; not for area or trend)` : `forest disturbance: unknown — ${R.forest.fresh.why}`);
  parts.push(R.swpc.value !== null ? `Kp ${R.swpc.value} for ${ME.kpInterval(R.swpc.observedAt)} (began ${ago(R.swpc.observedAt)}; NOAA SWPC${R.swpc.fresh.grade === 'partial' ? '; marked degraded by our collector' : ''})` : `Kp: unknown — ${R.swpc.fresh.why}`);
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
  add('general', 'Day/night overlay', 'Optional, off unless switched on, and computed rather than observed (like the orbital layers, it is calculated, not observed) — tier: computed (astronomical context — calculated from the clock, not observed). It is not a layer: no source, no snapshot, no coverage grade, no freshness, and it never enters the status report. It shows calculated solar illumination for the UTC time it states, and nothing else: not whether anything was observed in daylight (the records were observed at many different times), not satellite coverage, not cloud, not visibility, and not evidence of absence. It does not explain fire-detection counts — VIIRS detects thermal anomalies by day and by night. The boundary is geometric (the Sun\'s centre on the horizon, no refraction and no solar disc), so it is not sunrise, and twilight is not drawn. It makes no request and recomputes locally once a minute while visible.', true);
  add('general', 'Search', `The Explore box searches only the records this browser has already loaded from each layer's latest snapshot. It searches earthquake descriptions as USGS writes them, vessel names and MMSIs, and a latitude and longitude typed in that order. Fire detections and forest disturbance publish no text and are never text-searched; fire detections are included in a coordinate search. A layer that is hidden, unknown, or whose records are withheld by the pairing rule is not searched, and the panel says which and why. There is no geocoder, no place-name dataset and no country boundaries: a place or country word matches the source's own description text and nothing more, so it finds records described that way and misses records in the same country described another way. Coordinates are read whole: leading decimals are kept as written, and a number that cannot be read in full is refused by name rather than repaired, because dropping a character would silently move the position somewhere else. A coordinate search always offers to move the view to the position, and separately lists loaded records within ${SEARCH_RADIUS_KM} km, nearest first, up to ${MAX_RESULTS} with the true total stated; that radius is a choice made for this box and is not a coverage boundary. Where the browser cannot show the globe there is no view to move, and the panel says so rather than reporting a movement that did not happen. "No matching loaded records" describes the loaded snapshot only and does not establish absence. A result stays tied to the collector run, the layer visibility and the freshness it was found under: if any of those changes the result is marked and refused rather than opened, and no camera movement or selection happens without a click.`, true);
  add('general', 'Navigation', 'The "find in this snapshot" buttons move the view to the largest value inside the records already loaded — the loaded snapshot, not the world, and not a danger ranking. They make no further requests, run only when clicked, and never move the camera on their own.', true);
  add('general', 'Comparisons', `none of Mother Earth\'s own shown yet; what is kept is listed under What Mother Earth keeps; descriptive comparisons from phase 3, highlights only after a held-out validation. Source-provided comparisons (NOAA CO₂, NSIDC climatology) are shown and labelled as the source\'s.`, true);
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
  add('imagery', 'Imagery', `Dated true-colour imagery from NASA GIBS, VIIRS ${IMG_LAYER.sat}, image date ${IMG_DAY} — not live (the only direct source call). Fire detections use NOAA-20 separately. Dark areas may reflect insufficient sunlight or unavailable imagery; the cause of individual gaps has not been established.`);
  return rows;
};

// ---------- orbital layers (Space-Track GP via the hub): MODEL tier — positions computed, never observed.
// Pure helpers only (thread 8, 3 Nov 2026); drawing reuses the satellites design. Object TYPE (Space-Track) and payload
// operational STATUS (CelesTrak, pending) are separate facts: a payload is shown as a payload while its status is unknown.
ME.ORB = {
  HEADER: 'OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,RA_OF_ASC_NODE,ARG_OF_PERICENTER,MEAN_ANOMALY,EPHEMERIS_TYPE,CLASSIFICATION_TYPE,NORAD_CAT_ID,ELEMENT_SET_NO,REV_AT_EPOCH,BSTAR,MEAN_MOTION_DOT,MEAN_MOTION_DDOT,CLASS',
  PAYLOAD_CLASSES: ['active', 'inactive', 'payload_status_unknown', 'payload_unmatched', 'payload_status_unavailable'],
  // While payload status is pending, toggles follow object type only. When the hub supplies status, the spec's toggles
  // apply (Active · Inactive & rocket bodies · Debris) and payloads without a usable status are counted, not drawn.
  GROUPS_BY_TYPE: [
    { id: 'payload', label: 'Payloads', classes: ['active', 'inactive', 'payload_status_unknown', 'payload_unmatched', 'payload_status_unavailable'] },
    { id: 'rocket_body', label: 'Rocket bodies', classes: ['rocket_body'] },
    { id: 'debris', label: 'Debris', classes: ['debris'] },
  ],
  GROUPS_WITH_STATUS: [
    { id: 'active', label: 'Active satellites', classes: ['active'] },
    { id: 'inactive_rb', label: 'Inactive satellites & rocket bodies', classes: ['inactive', 'rocket_body'] },
    { id: 'debris', label: 'Orbital debris', classes: ['debris'] },
  ],
  NOT_DRAWN_BY_TYPE: ['unknown_type'],
  NOT_DRAWN_WITH_STATUS: ['unknown_type', 'payload_status_unknown', 'payload_unmatched', 'payload_status_unavailable'],
};
ME.orbStatusPending = meta => !meta || !meta.classification || /^pending/.test(meta.classification.payload_status || 'pending');
ME.orbGroups = meta => ME.orbStatusPending(meta) ? ME.ORB.GROUPS_BY_TYPE : ME.ORB.GROUPS_WITH_STATUS;
ME.orbNotDrawn = meta => ME.orbStatusPending(meta) ? ME.ORB.NOT_DRAWN_BY_TYPE : ME.ORB.NOT_DRAWN_WITH_STATUS;
// Which toggle (group id) draws an object of this class, or null if it is counted but never drawn.
ME.orbGroupOf = (cls, meta) => { for (const g of ME.orbGroups(meta)) if (g.classes.includes(cls)) return g.id; return null; };

ME.orbMetaProblem = meta => {
  if (!meta || meta.layer !== 'orbital') return 'the hub has no orbital element file yet';
  if (meta.source_status !== 'ok') return 'the hub reports the orbital file as ' + (meta.source_status || 'unknown');
  const e = meta.elements || {};
  if (!(e.rows > 0) || !/^[0-9a-f]{64}$/.test(e.sha256 || '') || !Array.isArray(e.columns) || e.columns.join(',') !== ME.ORB.HEADER) return 'the orbital file description is incomplete or in an unexpected format';
  if (!meta.retrieved_at || !Date.parse(meta.retrieved_at)) return 'the orbital file has no retrieval time';
  if (!meta.counts || typeof meta.counts !== 'object') return 'the orbital file has no counts';
  const sum = Object.values(meta.counts).reduce((a, b) => a + (b || 0), 0);
  if (sum !== e.rows) return 'the orbital file counts do not add up to its rows';
  return null;
};

/* Panel text from what the page knows: meta = last good /snapshot/orbital (or null); lastRun = the hub's latest 'orbital'
*  row from /status (or null); now = ms. Freshness states: none (no file yet) · ok · refresh failed (previous file kept,
*  shown with its ORIGINAL time) · stale (older than stale_after_s). Never invents a time. */
ME.orbPanel = (meta, lastRun, now) => {
  const n = x => (x || 0).toLocaleString('en-US');
  const t = iso => iso.replace('T', ' ').slice(0, 16) + ' UTC';
  const problem = meta ? ME.orbMetaProblem(meta) : 'the hub has no orbital element file yet';
  const failedRun = lastRun && lastRun.status !== 'ok' && (!meta || Date.parse(lastRun.started_at) > Date.parse(meta.retrieved_at)) ? lastRun : null;
  if (problem) return { state: 'none', available: false,
    headline: 'Orbital layers not available: ' + problem + '.',
    lines: failedRun ? [`Latest hub attempt ${t(failedRun.started_at)}: ${failedRun.status} (${(failedRun.note || '').slice(0, 120)}).`] : [], groups: [] };
  const ageS = (now - Date.parse(meta.retrieved_at)) / 1000, stale = ageS > (meta.stale_after_s || 8 * 3600);
  const c = meta.counts, pending = ME.orbStatusPending(meta);
  const groups = ME.orbGroups(meta).map(g => ({ id: g.id, label: g.label, count: g.classes.reduce((a, k) => a + (c[k] || 0), 0),
    parts: g.classes.length > 1 && !pending ? g.classes.map(k => ({ cls: k, count: c[k] || 0 })) : null }));
  const notDrawn = ME.orbNotDrawn(meta).reduce((a, k) => a + (c[k] || 0), 0);
  const lines = [
    `Element file retrieved ${t(meta.retrieved_at)} · ${n(meta.elements.rows)} objects · Space-Track.org (not decayed, elements under 10 days old).`,
    pending ? 'Object type comes from Space-Track. Operational status (active or inactive) is not shown yet: payloads are identified as payloads, and whether each one is working is not established here.'
            : 'Object type comes from Space-Track; payload operational status from CelesTrak. Missing status is never counted as inactive.',
    `${n(notDrawn)} object${notDrawn === 1 ? ' is' : 's are'} counted but not drawn (${pending ? 'object type unknown' : 'object type unknown, or payload status unknown or unmatched'}).`,
    'Completeness unverified: the source gives no row count, so a file cut short between rows could pass our checks.',
    'Positions computed from published orbital elements — not observed. Markers enlarged for visibility; not to physical scale.',
  ];
  let state = 'ok';
  if (failedRun) { state = 'refresh_failed'; lines.unshift(`Latest refresh ${t(failedRun.started_at)} failed (${failedRun.status}); showing the previous file, retrieved ${t(meta.retrieved_at)}.`); }
  if (stale) { state = state === 'refresh_failed' ? 'refresh_failed_stale' : 'stale'; lines.unshift(`This element file is ${Math.floor(ageS / 3600)} h old (older than ${Math.round((meta.stale_after_s || 28800) / 3600)} h); positions are computed from it as it stands.`); }
  return { state, available: true, headline: null, lines, groups };
};

// ---------- orbital renderer helpers (thread 9, 3 Nov 2026). Same design as satellites: worker propagation every 2 s only
// while a toggle is on and the tab is visible; one particle set PER TOGGLE, created once, positions written in place,
// visibility toggled, never re-digested. The worker carries CLASS so each object goes to its group via ME.orbGroupOf;
// a class with no group (null) is counted, never drawn.
Object.assign(ME.ORB, {
  UPDATE_MS: 2000, META_RECHECK_MS: 30 * 60e3, STALE_DAYS: 3, GEO_H_KM: 35786, R_KM: 6371, MARKER_PX: 2.5, CAPACITY_HEADROOM: 0.25,
  COLOURS: { payload: '#c9b6ff', active: '#c9b6ff', rocket_body: '#ffd27a', inactive_rb: '#ffd27a', debris: '#9fb4c8' },
  // ESA, "ESA Space Environment Report 2025" (esa.int, 1 Apr 2025; data to end of 2024). Figures as published there.
  SIZE_FLOOR: 'Only catalogued objects can be drawn. Space surveillance networks track about 40,000 objects; ESA estimates more than 1.2 million objects larger than 1 cm in orbit (ESA Space Environment Report 2025, data to end of 2024). Objects that are not catalogued are not shown.',
});
ME.orbColour = id => ME.ORB.COLOURS[id] || '#c9b6ff';
// class → group id (or null) for every class the hub can publish, under this meta's classification
ME.orbGroupMap = meta => Object.fromEntries((meta && meta.classification && meta.classification.classes || Object.keys((meta && meta.counts) || {})).map(k => [k, ME.orbGroupOf(k, meta)]));

// The CSV that arrives must be exactly the file the meta describes (hash), with the expected 18-column header.
ME.orbCsvProblem = async (csv, meta) => {
  if (typeof csv !== 'string' || !csv.length) return 'the element file was empty';
  const head = csv.slice(0, csv.indexOf('\n')).replace(/\r$/, '');
  if (head !== ME.ORB.HEADER) return 'the element file has an unexpected header';
  if ((await ME.sha256Hex(csv)) !== meta.elements.sha256) return 'the element file does not match its published checksum (it may have changed mid-read); nothing was drawn from it';
  return null;
};

// One line per ON toggle, from that toggle's own pass (never mixed across passes or groups).
// g = { id, label, count } from orbPanel; p = { rows, drawn, failed, stale, beyond, at } for that group
ME.orbPassLine = (g, p) => {
  const n = x => (x || 0).toLocaleString('en-US');
  const notDrawn = p.rows - p.drawn;
  return `${g.label}: ${n(p.rows)} in the file · ${n(p.drawn)} drawn` + (notDrawn ? ` · ${n(notDrawn)} not drawn (unusable elements or propagation failure)` : '')
    + (p.stale ? ` · ${n(p.stale)} with elements older than ${ME.ORB.STALE_DAYS} days (positions may be unreliable)` : '')
    + (p.beyond ? ` · ${n(p.beyond)} above geostationary height (${n(ME.ORB.GEO_H_KM)} km)` : '') + '.';
};
ME.orbLegend = (groups, at) => `<b>Orbital</b> · ${groups.map(g => `<span class="orb-sw" style="--oc:${ME.orbColour(g.id)}"></span>${g.label}`).join(' · ')} · computed positions · ${at.slice(11, 19)} UTC · markers enlarged, not to scale`;

/* Worker: CSV (17 propagation columns + CLASS) → satrecs per group → positions for the groups asked for.
*  init {csv, version, groupOf:{class: groupId|null}} → ready {rows, version, groups:{id:{rows, usable, initFail}}, notDrawn, unknownClass}
*  prop {t, seq, version, globeR, groups:[ids]} → pos {seq, version, at, groups:{id:{xyz, rows, drawn, failed, stale, beyond}}}
*  Same arithmetic as the satellites worker (placement agreed with globe.gl to 9e-5 units). */
ME.orbWorkerSource = (satjsUrl, R_KM, staleDays, geoKm) => `
let loadErr = null;
try { importScripts(${JSON.stringify(satjsUrl)}); } catch (e) { loadErr = String(e && e.message || e); }
const NUM = new Set(['MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','EPHEMERIS_TYPE','NORAD_CAT_ID','ELEMENT_SET_NO','REV_AT_EPOCH','BSTAR','MEAN_MOTION_DOT','MEAN_MOTION_DDOT']);
const D2R = Math.PI / 180, RKM = ${R_KM}, STALE_MS = ${staleDays} * 86400e3, GEO = ${geoKm};
let G = {}, rows = 0;
onmessage = e => { const m = e.data;
  if (m.type === 'init') {
    if (loadErr || typeof satellite === 'undefined') { postMessage({ type: 'error', why: 'the orbit library could not be loaded' + (loadErr ? ' (' + loadErr + ')' : '') }); return; }
    G = {}; let notDrawn = 0, unknownClass = 0;
    const L = m.csv.trim().split(/\\r?\\n/); const h = L[0].split(','); const iC = h.indexOf('CLASS'); rows = L.length - 1;
    for (let i = 1; i < L.length; i++) {
      const c = L[i].split(','); const cls = c[iC];
      if (!(cls in m.groupOf)) { unknownClass++; notDrawn++; continue; }
      const gid = m.groupOf[cls]; if (gid === null) { notDrawn++; continue; }
      const g = G[gid] || (G[gid] = { recs: [], epoch: [], rows: 0, initFail: 0 }); g.rows++;
      const o = {}; h.forEach((k, j) => { if (k !== 'CLASS') o[k] = NUM.has(k) ? +c[j] : c[j]; });
      try { const s = satellite.json2satrec(o); if (!s || s.error) { g.initFail++; continue; } g.recs.push(s); g.epoch.push(Date.parse(o.EPOCH + 'Z')); } catch (err) { g.initFail++; }
    }
    const groups = {}; for (const k in G) groups[k] = { rows: G[k].rows, usable: G[k].recs.length, initFail: G[k].initFail };
    postMessage({ type: 'ready', rows, version: m.version, groups, notDrawn, unknownClass });
  }
  if (m.type === 'prop') {
    const t = m.t, d = new Date(t), gm = satellite.gstime(d), GR = m.globeR, out = {}, tr = [];
    for (const gid of m.groups) { const g = G[gid];
      if (!g) { const xyz = new Float32Array(0); out[gid] = { xyz, rows: 0, drawn: 0, failed: 0, stale: 0, beyond: 0 }; continue; }
      const N = g.recs.length, xyz = new Float32Array(N * 3); let k = 0, failed = 0, stale = 0, beyond = 0;
      for (let i = 0; i < N; i++) {
        if (t - g.epoch[i] > STALE_MS) stale++;
        let pv; try { pv = satellite.propagate(g.recs[i], d); } catch (err) { pv = null; }
        const p = pv && pv.position;
        if (!p || typeof p !== 'object' || !isFinite(p.x)) { failed++; continue; }
        const q = satellite.eciToGeodetic(p, gm); const lat = q.latitude / D2R, lng = q.longitude / D2R, hkm = q.height;
        if (!isFinite(lat) || !isFinite(lng) || !isFinite(hkm)) { failed++; continue; }
        if (hkm > GEO) beyond++;
        const r = GR * (1 + hkm / RKM), phi = (90 - lat) * D2R, th = (90 - lng) * D2R;
        xyz[k++] = r * Math.sin(phi) * Math.cos(th); xyz[k++] = r * Math.cos(phi); xyz[k++] = r * Math.sin(phi) * Math.sin(th);
      }
      out[gid] = { xyz, rows: g.rows, drawn: k / 3, failed: failed + g.initFail, stale, beyond }; tr.push(xyz.buffer);
    }
    postMessage({ type: 'pos', seq: m.seq, version: m.version, at: d.toISOString(), groups: out }, tr);
  }
};`;

// ---------- satellites: MODEL tier — positions are COMPUTED by SGP4 from CelesTrak element sets, never observed.
// Pure helpers live here so they can be tested in Node; the overlay itself is in index.html. Benchmarked design
// (thread 6/7, bench 1.6.1): propagation in a Web Worker every 2 s, one batched particle layer created once,
// positions written in place, visibility toggled — never re-digested (that path is what produced a stale reference).
ME.SAT = {
  SATJS_URL: 'https://cdn.jsdelivr.net/npm/satellite.js@6.0.2/dist/satellite.min.js',   // pinned; loaded inside the worker only
  UPDATE_MS: 2000,                 // propagation cadence while on and visible
  META_RECHECK_MS: 30 * 60e3,      // while on, re-read the hub's small meta file this often; the element CSV is fetched only when it changed
  STALE_DAYS: 3,                   // disclosure threshold, not an accuracy claim
  GEO_H_KM: 35786,                 // geostationary height above the surface
  R_KM: 6371,                      // globe.gl draws a sphere; one globe radius = mean Earth radius
  MARKER_PX: 2.5, COLOUR: '#c9b6ff',
  HEADER: 'OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,RA_OF_ASC_NODE,ARG_OF_PERICENTER,MEAN_ANOMALY,EPHEMERIS_TYPE,CLASSIFICATION_TYPE,NORAD_CAT_ID,ELEMENT_SET_NO,REV_AT_EPOCH,BSTAR,MEAN_MOTION_DOT,MEAN_MOTION_DDOT',
  CAPACITY_HEADROOM: 0.25,         // the layer's buffer is sized once with headroom so a later, larger file is still written in place
};

// The hub's meta file must describe an element file we can trust before we fetch 2.5 MB. Returns a reason or null.
ME.satMetaProblem = meta => {
  if (!meta || meta.layer !== 'satellites') return 'the hub has no satellite element file yet';
  if (meta.source_status !== 'ok') return 'the hub reports the element file as ' + (meta.source_status || 'unknown');
  const e = meta.elements || {};
  if (!(e.rows > 0) || !/^[0-9a-f]{64}$/.test(e.sha256 || '') || e.header !== ME.SAT.HEADER) return 'the element file description is incomplete or in an unexpected format';
  if (!meta.retrieved_at || !Date.parse(meta.retrieved_at)) return 'the element file has no retrieval time';
  return null;
};

ME.sha256Hex = async text => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
};

// The CSV that arrives must be exactly the file the meta describes (hash), with the expected header.
ME.satCsvProblem = async (csv, meta) => {
  if (typeof csv !== 'string' || !csv.length) return 'the element file was empty';
  const head = csv.slice(0, csv.indexOf('\n')).replace(/\r$/, '');
  if (head !== ME.SAT.HEADER) return 'the element file has an unexpected header';
  if ((await ME.sha256Hex(csv)) !== meta.elements.sha256) return 'the element file does not match its published checksum (it may have changed mid-read); nothing was drawn from it';
  return null;
};

// Scope and disclosure lines, from ONE propagation pass's own numbers (never mixed across passes).
// p = { rows, drawn, failed, stale, beyondGeo, at } ; meta = hub meta
ME.satLines = (p, meta) => {
  const n = x => (x || 0).toLocaleString('en-US');
  const notDrawn = p.rows - p.drawn;
  return {
    scope: `CelesTrak "active" element sets · ${n(p.rows)} in the file · ${n(p.drawn)} drawn · ${n(notDrawn)} not drawn (unusable elements or propagation failure${p.failed ? `: ${n(p.failed)} failed this pass` : ''}) · public catalogue only, not every object in orbit`,
    marker: 'Markers enlarged for visibility; not to physical scale.',
    time: `Positions propagated for ${p.at.replace('T', ' ').slice(0, 19)} UTC · element file retrieved ${meta.retrieved_at.replace('T', ' ').slice(0, 16)} UTC (CelesTrak data as of ${meta.source_stamp.replace('T', ' ').slice(0, 16)} UTC)`,
    stale: p.stale ? `${n(p.stale)} object${p.stale === 1 ? '' : 's'} use${p.stale === 1 ? 's' : ''} element sets older than ${ME.SAT.STALE_DAYS} days; ${p.stale === 1 ? 'its' : 'their'} propagated position${p.stale === 1 ? '' : 's'} may be unreliable.` : `No object uses element sets older than ${ME.SAT.STALE_DAYS} days.`,
    beyond: p.beyondGeo ? `${n(p.beyondGeo)} object${p.beyondGeo === 1 ? ' is' : 's are'} higher than geostationary orbit (${n(ME.SAT.GEO_H_KM)} km) and may lie outside the current view.` : '',
    legend: `<b>Satellites</b> · computed positions · ${p.at.slice(11, 19)} UTC · markers enlarged, not to scale`,
  };
};

// Worker source: CSV → satrecs → positions. Same arithmetic as bench 1.6.1 (placement agreed with globe.gl to 9e-5 units).
// Runs off the main thread; reports per pass: drawn, failed, stale (epoch older than STALE_DAYS at the pass time), beyond GEO.
ME.satWorkerSource = (satjsUrl, R_KM, staleDays, geoKm) => `
let loadErr = null;
try { importScripts(${JSON.stringify(satjsUrl)}); } catch (e) { loadErr = String(e && e.message || e); }
const NUM = new Set(['MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','EPHEMERIS_TYPE','NORAD_CAT_ID','ELEMENT_SET_NO','REV_AT_EPOCH','BSTAR','MEAN_MOTION_DOT','MEAN_MOTION_DDOT']);
const D2R = Math.PI / 180, RKM = ${R_KM}, STALE_MS = ${staleDays} * 86400e3, GEO = ${geoKm};
let recs = [], epochMs = [], rows = 0;
onmessage = e => { const m = e.data;
  if (m.type === 'init') {
    if (loadErr || typeof satellite === 'undefined') { postMessage({ type: 'error', why: 'the orbit library could not be loaded' + (loadErr ? ' (' + loadErr + ')' : '') }); return; }
    recs = []; epochMs = []; let quoted = 0, initFail = 0;
    const L = m.csv.trim().split(/\\r?\\n/); const h = L[0].split(','); rows = L.length - 1;
    for (let i = 1; i < L.length; i++) { const line = L[i]; if (line.indexOf('"') >= 0) { quoted++; continue; }
      const c = line.split(','); const o = {}; h.forEach((k, j) => o[k] = NUM.has(k) ? +c[j] : c[j]);
      try { const s = satellite.json2satrec(o); if (!s || s.error) { initFail++; continue; } recs.push(s); epochMs.push(Date.parse(o.EPOCH + 'Z')); } catch (err) { initFail++; } }
    postMessage({ type: 'ready', rows, usable: recs.length, quoted, initFail, version: m.version });
  }
  if (m.type === 'prop') {
    const t = m.t, d = new Date(t), gm = satellite.gstime(d), N = recs.length, GR = m.globeR;
    const xyz = new Float32Array(N * 3); let k = 0, failed = 0, stale = 0, beyond = 0;
    for (let i = 0; i < N; i++) {
      if (t - epochMs[i] > STALE_MS) stale++;
      let pv; try { pv = satellite.propagate(recs[i], d); } catch (err) { pv = null; }
      const p = pv && pv.position;
      if (!p || typeof p !== 'object' || !isFinite(p.x)) { failed++; continue; }
      const g = satellite.eciToGeodetic(p, gm); const lat = g.latitude / D2R, lng = g.longitude / D2R, hkm = g.height;
      if (!isFinite(lat) || !isFinite(lng) || !isFinite(hkm)) { failed++; continue; }
      if (hkm > GEO) beyond++;
      const r = GR * (1 + hkm / RKM), phi = (90 - lat) * D2R, th = (90 - lng) * D2R;
      xyz[k++] = r * Math.sin(phi) * Math.cos(th); xyz[k++] = r * Math.cos(phi); xyz[k++] = r * Math.sin(phi) * Math.sin(th);
    }
    postMessage({ type: 'pos', seq: m.seq, version: m.version, at: d.toISOString(), xyz, drawn: k / 3, failed, stale, beyond, rows }, [xyz.buffer]);
  }
};`;

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
// ---------- Place view (§ proposal rev 2): everything the hub holds for one 4° cell. Pure: the hub's /place envelope → inspector rows.
// Each layer keeps its own date, evidence label, coverage statement and limits; nothing links layers; nothing absent becomes zero.
ME.PLACE_ORDER = ['usgs', 'firms', 'ships', 'forest', 'drifters', 'plastic'];
ME.PLACE_OPTIONAL = ['drifters', 'plastic'];
ME.PLACE_NONE = {
  usgs: 'none in the feed window (M2.5+, last 24 h) reached us for this cell — not a statement that none occurred',
  firms: 'no detection reached us for this cell so far today (UTC) — not “no fires”: satellite passes, cloud and processing decide what can be detected',
  ships: 'no vessel heard in this cell in the latest sample — terrestrial AIS only; not an empty sea',
  drifters: 'no buoy\'s latest fix is in this cell — buoys are sparse; this says nothing about the water',
  plastic: 'no dated sample in this cell — a missing sample does not establish plastic-free water',
};
ME.placeRecordLine = (layer, o) => {
  const n = (x, dp) => has(x) ? Number(x).toLocaleString('en', { maximumFractionDigits: dp }) : MISSING;
  if (layer === 'usgs') return `M${has(o.mag) ? Number(o.mag).toFixed(1) : '?'} · ${when(o.observed_at)} · ${o.title || ''}`;
  if (layer === 'firms') return `${when(o.observed_at)} · FRP ${frp(o.frp_mw)} · ${o.daynight === 'D' ? 'day pass' : o.daynight === 'N' ? 'night pass' : 'pass ' + MISSING}`;
  if (layer === 'ships') return `MMSI ${o.mmsi || MISSING}${o.name ? ' · ' + o.name : ''} · ${when(o.observed_at)}`;
  if (layer === 'drifters') return `Buoy ${o.id || MISSING} · fix ${when(o.observed_at)} · SST ${has(o.sst_c) ? n(o.sst_c, 2) + ' °C' : MISSING}`;
  if (layer === 'plastic') return `${o.sampled_on || MISSING} · ${o.pieces_m3 === 0 ? 'reported zero' : n(o.pieces_m3, 4) + ' pieces/m³'} · check: ${(o.check || MISSING).replace(/_/g, ' ')}`;
  return '';
};
ME.placeRows = function (P, nowMs = Date.now()) {
  const rows = [], c = P.cell || {};
  const lat = (a, b) => `${Math.abs(a)}°${a < 0 ? 'S' : 'N'}–${Math.abs(b)}°${b < 0 ? 'S' : 'N'}`, lng = (a, b) => `${Math.abs(a)}°${a < 0 ? 'W' : 'E'}–${Math.abs(b)}°${b < 0 ? 'W' : 'E'}`;
  rows.push(['Selected', `4° cell ${esc(c.id)} (${esc(c.ref)}) · ${lat(c.south, c.north)}, ${lng(c.west, c.east)} · about ${Number(c.area_km2).toLocaleString('en')} km² (cells shrink toward the poles)`]);
  rows.push(['Read this first', `<b class="pstmt">${esc(P.statement)}</b>`]);
  for (const l of ME.PLACE_ORDER) {
    const s = (P.layers || {})[l] || { state: 'unavailable' }; const name = LABEL[l];
    if (s.state === 'off_not_requested') { rows.push([name, `layer off · <button type="button" class="placeload" data-place-layer="${l}">Load this layer's data for this place</button> <span class="q">fetches data for this panel only; the layer stays off on the globe</span>`]); continue; }
    const stale = s.retrieved_at && s.stale_after_s && (nowMs - Date.parse(s.retrieved_at)) / 1000 > s.stale_after_s;
    const meta = s.retrieved_at ? ` <span class="q">· retrieved ${esc(when(s.retrieved_at))}${stale ? ' · <b>stale</b>: older than its refresh limit' : ''}</span>` : '';
    if (s.state === 'withheld') { rows.push([name, `withheld — ${esc(s.why)}${meta}`]); continue; }
    if (s.state === 'unavailable' || s.state === 'down') { rows.push([name, `unknown — ${esc(s.note || 'the collector reported down')}${meta}`]); continue; }
    if (s.state === 'not_covered') { rows.push([name, `not covered — ${esc(s.why)}${meta}`]); continue; }
    if (s.state === 'pending') { rows.push([name, `unknown — ${esc(s.why)}${meta}`]); continue; }
    if (s.state === 'no_records') { rows.push([name, `${esc(ME.PLACE_NONE[l] || 'no records reached us for this cell')}${meta}`]); continue; }
    if (l === 'forest') { const cf = (s.cell && s.cell.confidence) || {};
      rows.push([name, `${fmt(s.cell.count)} alert pixels (10 m) published in the 7 days from ${esc(s.cell.since || MISSING)} · nominal ${fmt(cf.nominal, { zeroNote: null })} · high ${fmt(cf.high, { zeroNote: null })} · highest ${fmt(cf.highest, { zeroNote: null })} · queried ${esc(when(s.cell.queried_at))} <span class="q">· pixels, not hectares or trends</span>${meta}`]); continue; }
    const objs = rowsToObjects({ record_fields: s.record_fields, records: s.records });
    const cov = (s.cell && s.cell.coverage) || s.coverage_default;
    const head = `${s.records_total} ${l === 'plastic' ? 'dated sample' + (s.records_total === 1 ? '' : 's') + ' (2011–2024 programme; not current water)' : l === 'drifters' ? 'buoy' + (s.records_total === 1 ? '' : 's') + ' with a latest fix here (each at its own time)' : l === 'ships' ? 'vessel' + (s.records_total === 1 ? '' : 's') + ' heard in the latest sample' : l === 'firms' ? 'detection' + (s.records_total === 1 ? '' : 's') + ' so far today (UTC)' : 'event' + (s.records_total === 1 ? '' : 's') + ' in the feed window'}`;
    const list = objs.map(o => `<li>${esc(ME.placeRecordLine(l, o))}</li>`).join('');
    const more = s.records_total > objs.length ? `<li class="q">${s.records_total - objs.length} more in this cell, not listed</li>` : '';
    rows.push([name, `${head}${cov ? ` <span class="q">· coverage ${esc(cov.grade || MISSING)}</span>` : ''}${meta}<ul class="plist">${list}${more}</ul>`]);
  }
  const C = P.collection;
  if (C) for (const l of ['usgs', 'firms', 'ships']) { const x = C[l]; if (!x) continue; const a = x.collection_ran, b = x.records_reached_us_here;
    // an absent record is never a zero: with no aggregated hour in a period, that period is unknown, not "0 of N"
    if (!a.last_7d.hours_aggregated) { rows.push(['Collection · ' + LABEL[l], `unknown — no aggregated hour of ours is on record for the last 7 days${a.retention_start ? ` (record retained since ${esc(a.retention_start)})` : ''}. <span class="q">Neither collection nor its absence is the source's geographic coverage.</span>`]); continue; }
    const part = (o, h) => o.hours_aggregated ? `${o.hours_with_a_usable_sample} of ${o.hours_aggregated} aggregated hour${o.hours_aggregated === 1 ? '' : 's'}` + (o.hours_aggregated < h ? ` (of ${h} h in the period)` : '') : `unknown (no aggregated hour of the ${h} h is on record)`;
    rows.push(['Collection · ' + LABEL[l], `our collector produced a usable sample in ${part(a.last_24h, 24)} over the last 24 h and ${part(a.last_7d, 168)} over the last 7 days (all places at once); records for this cell reached us in ${b.last_24h_hours} h of the last 24 h and ${b.last_7d_hours} h of the last 7 days. Retained since ${esc(b.retention_start || a.retention_start || MISSING)}; first retained report here: ${esc(b.first_report_retained || 'none retained')}. <span class="q">Neither is the source's geographic coverage.</span>`]); }
  if (C && C.forest) rows.push(['Collection · ' + LABEL.forest, C.forest.queries_retained ? `${C.forest.queries_retained} queries of this cell retained (${esc(C.forest.first_query)} to ${esc(C.forest.last_query)})` : 'no query of this cell retained']);
  if (!C && P.collection_note) rows.push(['Collection', `unknown — ${esc(P.collection_note)}`]);
  rows.push(['Not place-based', 'Kp index, CO₂, sea ice, orbital objects and day/night have no value for a single cell — details below']);
  rows.push(['Why not per place', Object.entries(P.not_place_based || {}).map(([k, v]) => `${esc(LABEL[k] || (k === 'orbital' ? 'Orbital objects' : k === 'daynight' ? 'Day/night' : k))}: ${esc(v)}`).join('<br>'), 'more']);
  if (P.collection_meaning) rows.push(['Collection, defined', esc(P.collection_meaning), 'more']);
  rows.push(['Generated', `${esc(when(P.generated_at))} by the hub (${esc(P.collector_version)}) — each layer above keeps its own time`, 'more']);
  return rows;
};
ME.clock = function () { const c = $('clock'); if (c) setInterval(() => { c.firstChild.textContent = new Date().toISOString().slice(11, 19); }, 1000); };
})();
