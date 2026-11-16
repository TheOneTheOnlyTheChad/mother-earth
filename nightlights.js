/* Mother Earth — Night lights (NIGHT-LIGHTS-PROPOSAL rev 2, §9 governing; GPT's two build details, 15 Nov 2026). PREVIEW.
 * Two things, both read straight from NASA GIBS (no hub, nothing stored):
 *   1. A globe layer, off on load: NOAA-20 Day/Night Band light as measured at night, for ONE pinned UTC date, drawn in
 *      place of the true-colour picture while it is on. The date is chosen by a rule, never by hand: the newest UTC date
 *      whose 30°S–30°N band has no more than 1% no data, judged on the picture that is displayed (the 2048 × 1024 frame),
 *      not only on the small probe. A date that fails the rule is "still arriving".
 *   2. A comparison of two nights for one box, on the same extent, grid and fixed scale, with every pixel in one of three
 *      states decided from BOTH dates: usable on both · no reliable comparison · no data.
 * Light, not power: nothing here says a place lost power, and no radiance total or percentage change is printed.
 * Kept out of the observation path like ocean heat: it never touches state, points, pmeta, usable() or any globe.gl layer.
 * Round 3 (release work, GPT's three details): every GIBS wait is bounded (WAIT_MS) and ends as "unavailable" with a way to
 * try again; the Sky zoom-out view's imagery label is refreshed whenever this layer changes the Earth picture; a comparison
 * frame that comes back blank says "No data for this date" and nothing more specific; 5° and 10° boxes say they are coarser.
 * Values come from the picture's colours through NASA's own published keys (colormaps v1.3), stored as integers so the
 * 0.95 threshold is an exact comparison: light in tenths of nW/(cm² sr), clear-sky confidence in hundredths; −1 = none.
 */
(() => {
  const ME = window.ME; if (!ME) return;
  const $ = ME.$, esc = ME.esc;
  const NL = {
    WMS: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
    KEYS: 'https://gibs.earthdata.nasa.gov/colormaps/v1.3/',
    LIGHT: 'VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance', LIGHT_KEY: 'VIIRS_DayNightBand_At_Sensor_Radiance.xml',
    CLEAR: 'VIIRS_NOAA20_Clear_Sky_Confidence_Night', CLEAR_KEY: 'VIIRS_Clear_Sky_Confidence.xml',
    SAT: 'NOAA-20', FIRST: '2024-03-25',
    THRESH_H: 95,                 // our threshold: clear-sky confidence 0.95, in hundredths (not a NASA standard)
    BAND: 30, MAX_MISSING: 0.01,  // latest-date rule: no more than 1% no data between 30°S and 30°N
    CANDIDATES: 4,                // today (UTC) and the three days before it
    WAIT_MS: 20000,               // the longest any one GIBS request may take, body included, before it counts as not answered
    TOP_T: 382, UNITS: 'nW/(cm² sr)',
    WORLD: { s: -90, w: -180, n: 90, e: 180 }, PROBE: [512, 256], GLOBAL: [2048, 1024],
    PX_PER_DEG: 240, MAX_PX: 480, SPANS: [0.5, 1, 2, 5, 10],
    NODATA: [[128, 140, 160], [100, 112, 130]],   // checker: no data (the ocean heat no-data colours)
    NOREL: [[150, 112, 30], [44, 34, 12]],        // diagonal stripes: no reliable comparison
    R2: 'Light as measured at the satellite. Moonlight, cloud, fires, lightning, boats and the viewing angle all change it.',
    THRESH_TEXT: 'Mother Earth uses a clear-sky confidence threshold of 0.95 for this comparison, on both nights; not a NASA standard.',
    LOCAL: 'NASA: not for tactical decisions or local-scale conditions.',
  };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ---------- pure logic (ME.nlLogic: the exact functions the layer uses; phase1/night-lights.test.mjs runs them)
  const validDay = d => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(typeof d === 'string' ? d : ''); if (!m) return null; const y = +m[1], mo = +m[2], da = +m[3];
    if (mo < 1 || mo > 12 || da < 1 || da > new Date(Date.UTC(y, mo, 0)).getUTCDate()) return null; return d; };
  const dayText = d => { const v = validDay(d); return v ? `${+v.slice(8, 10)} ${MONTHS[+v.slice(5, 7) - 1]} ${v.slice(0, 4)}` : null; };   // '19 Mar 2026'
  const utcDay = ms => new Date(ms).toISOString().slice(0, 10);
  const num = x => String(+(+x).toFixed(4));
  // WMS 1.3.0 with CRS=EPSG:4326: BBOX is south,west,north,east (the order the backdrop request already uses)
  const wmsUrl = (layer, date, box, w, h) => `${NL.WMS}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${layer}&STYLES=&CRS=EPSG:4326` +
    `&BBOX=${num(box.s)},${num(box.w)},${num(box.n)},${num(box.e)}&WIDTH=${w}&HEIGHT=${h}&FORMAT=image/png&TRANSPARENT=TRUE&TIME=${date}`;
  // NASA's key: every ColorMapEntry that is not marked transparent maps one colour to the LOWER bound of its range.
  // scale = 10 for light (tenths), 100 for confidence (hundredths). Returns Map 'r,g,b' -> integer.
  function parseKey(xml, scale) {
    const map = new Map(); let n = 0;
    for (const m of String(xml).matchAll(/<ColorMapEntry\s+([^>]*?)\/?>/g)) {
      const a = m[1], g = k => (new RegExp('\\b' + k + '=["\']([^"\']*)["\']').exec(a) || [])[1];
      const rgb = g('rgb'), val = g('value'); if (!rgb || g('transparent') === 'true' || val == null) continue;
      const lo = parseFloat(val.replace(/[\[\]()]/g, '').split(',')[0]); if (!Number.isFinite(lo)) continue;
      const key = rgb.replace(/\s+/g, ''); if (map.has(key)) throw new Error('key maps one colour to two values: ' + key);
      map.set(key, Math.round(lo * scale)); n++;
    }
    if (!n) throw new Error('key has no entries');
    return map;
  }
  // RGBA bytes -> integers through the key. Transparent = no data (−1). A colour the key does not hold is counted, never guessed.
  function decode(rgba, n, key) {
    const v = new Int16Array(n); let unknown = 0, none = 0;
    for (let i = 0; i < n; i++) {
      if (rgba[i * 4 + 3] < 10) { v[i] = -1; none++; continue; }
      const x = key.get(rgba[i * 4] + ',' + rgba[i * 4 + 1] + ',' + rgba[i * 4 + 2]);
      if (x === undefined) { v[i] = -1; unknown++; } else v[i] = x;
    }
    return { v, unknown, none };
  }
  // Three states from BOTH dates (§9.1, GPT's build detail 1): one missing light value is enough for "no data";
  // both present but either confidence missing or under the threshold is "no reliable comparison".
  const USABLE = 0, NOREL = 1, NODATA = 2;
  function classify(la, ca, lb, cb, th) {
    const n = la.length, s = new Uint8Array(n);
    for (let i = 0; i < n; i++) s[i] = (la[i] < 0 || lb[i] < 0) ? NODATA : (ca[i] >= th && cb[i] >= th) ? USABLE : NOREL;
    return s;
  }
  // One date on its own (used only when the other date failed to load): readable, not readable, no data.
  function classifyOne(l, c, th) { const n = l.length, s = new Uint8Array(n); for (let i = 0; i < n; i++) s[i] = l[i] < 0 ? NODATA : c[i] >= th ? USABLE : NOREL; return s; }
  function tally(la, ca, lb, cb, th) {
    const n = la.length; let readA = 0, readB = 0, both = 0, noData = 0, noRel = 0;
    for (let i = 0; i < n; i++) {
      const a = la[i] >= 0 && ca[i] >= th, b = lb[i] >= 0 && cb[i] >= th;
      if (a) readA++; if (b) readB++;
      if (la[i] < 0 || lb[i] < 0) noData++; else if (a && b) both++; else noRel++;
    }
    return { n, readA, readB, both, noData, noRel };
  }
  const readable = (l, c, th) => { let k = 0; for (let i = 0; i < l.length; i++) if (l[i] >= 0 && c[i] >= th) k++; return k; };
  // share of no-data pixels in the rows whose centre lies within ±band degrees (whole-globe frame, north at the top)
  function bandMissing(v, W, H, band) {
    let n = 0, miss = 0;
    for (let y = 0; y < H; y++) { const lat = 90 - (y + 0.5) / H * 180; if (lat > band || lat < -band) continue; for (let x = 0; x < W; x++) { n++; if (v[y * W + x] < 0) miss++; } }
    return n ? miss / n : 1;
  }
  // newest first. A decoded frame that fails the rule is "arriving"; a failed or blocked request stops the search and is
  // reported as that (GPT's build detail 2: partial data is never worded as a failure, nor a failure as partial data).
  function pickDate(results) {
    const arriving = [];
    for (const r of results) {
      if (r.status === 'failed' || r.status === 'blocked') return { date: null, arriving, fail: r };
      if (r.status === 'ok' && r.missing <= NL.MAX_MISSING) return { date: r.date, arriving, fail: null };
      arriving.push(r.date);
    }
    return { date: null, arriving, fail: null };
  }
  const pct = (k, n) => { if (!n) return 'none'; const p = Math.round(100 * k / n); return k > 0 && p === 0 ? 'under 1%' : k < n && p === 100 ? 'over 99%' : p + '%'; };
  const lightText = t => t >= NL.TOP_T ? '38.2 or more' : (t / 10).toFixed(1);
  const spanPx = span => Math.min(NL.MAX_PX, Math.round(span * NL.PX_PER_DEG));
  function boxFor(lat, lng, span) {   // kept inside the map: a box is shifted, never wrapped
    const h = span / 2, cl = Math.max(-90 + h, Math.min(90 - h, lat)), cg = Math.max(-180 + h, Math.min(180 - h, lng));
    return { s: +(cl - h).toFixed(4), w: +(cg - h).toFixed(4), n: +(cl + h).toFixed(4), e: +(cg + h).toFixed(4) };
  }
  const joinDays = a => a.map(dayText).join(a.length === 2 ? ' and ' : ', ');
  const logic = { NL, validDay, dayText, utcDay, wmsUrl, parseKey, decode, classify, classifyOne, tally, readable, bandMissing, pickDate, pct, lightText, spanPx, boxFor, USABLE, NOREL, NODATA };
  ME.nlLogic = logic;

  // ---------- state
  const st = { on: false, gen: 0, status: 'off', why: null, date: null, arriving: [], prevUrl: null, blobUrl: null, saved: null, restoring: false, nights: new Map(), want: null, nightOn: null, blob: null, labelFor: null, gated: false, gate: { accepted: [], rejected: [] },
    missing: null, bytes: {}, timings: {}, requests: [], keys: {}, cmp: null, cmpGen: 0, cur: null, opts: { now: null, waitMs: null } };
  const now = () => st.opts.now != null ? st.opts.now : Date.now();
  const waitMs = () => st.opts.waitMs != null ? st.opts.waitMs : NL.WAIT_MS;
  const waitText = () => { const s = waitMs() / 1000; return `NASA GIBS did not answer within ${Number.isInteger(s) ? s : s.toFixed(1)} seconds`; };
  // A bounded fetch: one deadline covers the headers AND the body, so a response that starts and then stalls is caught too.
  // `read` turns the Response into the value wanted (blob or text). The deadline is raced against both steps as well as
  // aborting the request, so it holds even where an abort does not reach the body. A timeout throws an error marked
  // `timeout`; a body that breaks off for another reason leaves `body` null and the caller says so.
  async function bounded(url, init, read) {
    const ac = new AbortController(); let timer;
    const late = new Promise((_, rej) => { timer = setTimeout(() => { const t = new Error('timeout'); t.timeout = true; try { ac.abort(); } catch (_) { } rej(t); }, waitMs()); });
    late.catch(() => { });   // raced below; never an unhandled rejection
    try {
      const r = await Promise.race([fetch(url, { ...(init || {}), signal: ac.signal }), late]);
      let body = null;
      if (r.ok) { try { body = await Promise.race([read(r), late]); } catch (e) { if (e && e.timeout) throw e; } }
      return { r, body };
    } catch (e) {
      if (e && e.timeout) throw e;
      if (ac.signal.aborted) { const t = new Error('timeout'); t.timeout = true; throw t; }
      throw e;
    } finally { clearTimeout(timer); }
  }

  // ---------- fetching (the only network calls this file makes; none before a switch-on or a Compare press)
  async function getImage(url, w, h) {
    st.requests.push(url);
    let r, bl;
    try { const x = await bounded(url, null, q => q.blob()); r = x.r; bl = x.body; }
    catch (e) {
      if (e && e.timeout) return { status: 'failed', why: waitText() };   // a hung request: not answered, never "blocked" and never "arriving"
      // either no answer, or an answer the browser will not let the page read
      try { await bounded(url, { mode: 'no-cors' }, async () => null); return { status: 'blocked', why: 'this browser blocked reading the picture' }; }
      catch (_) { return { status: 'failed', why: 'NASA GIBS did not answer' }; }
    }
    if (!r.ok) return { status: 'failed', why: `NASA GIBS answered HTTP ${r.status}` };
    if (!bl) return { status: 'failed', why: 'the answer from NASA GIBS broke off' };
    if (!/^image\/png/i.test(bl.type)) return { status: 'failed', why: 'NASA GIBS answered without a picture' };
    let bm; try { bm = await createImageBitmap(bl); } catch (e) { return { status: 'failed', why: 'the picture from NASA GIBS could not be read' }; }
    if (bm.width !== w || bm.height !== h) return { status: 'failed', why: `the picture from NASA GIBS is ${bm.width} × ${bm.height}, not ${w} × ${h}` };
    try {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingEnabled = false; g.drawImage(bm, 0, 0);
      return { status: 'ok', img: g.getImageData(0, 0, w, h), bytes: bl.size };
    } catch (e) { return { status: 'blocked', why: 'this browser blocked reading the picture' }; }
  }
  function getKey(name, scale) {
    if (!st.keys[name]) st.keys[name] = (async () => {
      st.requests.push(NL.KEYS + name);
      const x = await bounded(NL.KEYS + name, null, q => q.text()); if (!x.r.ok) throw new Error(`HTTP ${x.r.status}`);
      return parseKey(x.body, scale);
    })().catch(e => { delete st.keys[name]; throw e; });
    return st.keys[name];
  }
  // one frame for one date: light + (optionally) clear-sky confidence, decoded. Never throws.
  async function frame(date, box, w, h, withClear) {
    let lk, ck;
    try { lk = await getKey(NL.LIGHT_KEY, 10); if (withClear) ck = await getKey(NL.CLEAR_KEY, 100); }
    catch (e) { return { date, status: 'failed', why: "NASA's key for the picture could not be loaded" }; }
    const [li, ci] = await Promise.all([getImage(wmsUrl(NL.LIGHT, date, box, w, h), w, h), withClear ? getImage(wmsUrl(NL.CLEAR, date, box, w, h), w, h) : null]);
    for (const x of [li, ci]) if (x && x.status !== 'ok') return { date, status: x.status, why: x.why };
    const L = decode(li.img.data, w * h, lk), C = ci ? decode(ci.img.data, w * h, ck) : null;
    if (L.unknown || (C && C.unknown)) return { date, status: 'failed', why: "the picture did not match NASA's published key" };
    return { date, status: 'ok', key: lk, light: L.v, clear: C ? C.v : null, rgba: li.img.data, bytes: li.bytes + (ci ? ci.bytes : 0), blank: L.none === w * h };
  }

  // ---------- 1. the globe layer
  const failText = (f, what) => f.status === 'blocked'
    ? `${what} cannot be shown: this browser blocked reading the picture's values, so missing areas could not be told from dark ones. Nothing is drawn.`
    : `${what} could not be loaded: ${f.why}${f.date ? ' for ' + dayText(f.date) : ''}. Nothing is drawn. Switch it on again to retry.`;
  function paintGlobal(img, w, h, v) {   // the frame as NASA drew it, with every no-data pixel given the no-data checker (never black)
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const d = img.data, a = NL.NODATA[0], b = NL.NODATA[1];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (v[i] >= 0) continue; const p = ((x >> 3) + (y >> 3)) & 1 ? b : a; d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); return c;
  }
  // ---- the picture on the globe and its wording (GPT, 16 Nov: three rounds of findings)
  // The globe library puts a picture on the globe when its load FINISHES, whatever has been asked for since, so an old
  // load can land over a newer picture. Two rules close that, in both directions:
  // 1. A gate on the globe's own material. While this layer has asked for a picture (st.want), no other picture is let
  //    onto the globe; and a night picture of ours that has been retired is never let on, however late it lands.
  // 2. The wording is written at the moment a picture is let through, from that picture: a night picture carries its
  //    own date; anything else gets the wording saved before the layer first touched the line.
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const href = u => { try { return new URL(u, location.href).href; } catch (_) { return String(u); } };
  const note = (list, kind) => { list.push(kind); if (list.length > 40) list.shift(); };
  const nightWording = date => { const dt = dayText(date), full = `Imagery: night lights ${dt} (NASA GIBS, VIIRS ${NL.SAT}) — light measured at night on that UTC date, not live · patterned areas: no data`;
    return { imgdate: `<span class="img-long">${esc(full)}</span><span class="img-short">Night lights ${esc(dt.slice(0, dt.length - 5))}<br>${esc(NL.SAT)} · not live</span>`, full }; };
  function label(date) {   // date: the UTC date of the night picture now on the globe, or null for the earlier picture
    if (!st.saved || st.labelFor === (date || '')) return;
    const a = $('imgdate'), b = $('img-full'), w = date ? nightWording(date) : st.saved;
    if (a) a.innerHTML = w.imgdate; if (b) b.textContent = w.full; st.labelFor = date || '';
    if (typeof ME.zoomImgLabel === 'function') ME.zoomImgLabel();   // the Sky zoom-out view names the picture that is drawn
  }
  function gate(g) {
    if (st.gated) return; const m = g.globeMaterial(); let cur = m.map;
    Object.defineProperty(m, 'map', { configurable: true, enumerable: true, get: () => cur, set: v => {
      const src = v && v.image && v.image.src ? href(v.image.src) : null, ours = !!src && st.nights.has(src);
      if (src && ((ours && src !== st.want) || (st.want && src !== st.want))) {   // a superseded load: it does not go on the globe
        note(st.gate.rejected, ours ? 'night' : 'other'); try { v.dispose(); } catch (_) { }
        if (cur) cur.needsUpdate = true;   // the library has just released the picture in place; have it drawn again
        return;
      }
      cur = v; note(st.gate.accepted, ours ? 'night' : 'other'); landed(src);
    } });
    st.gated = true;
  }
  function landed(src) {   // a picture has just gone on the globe
    if (!src || src !== st.want) return;
    if (st.nights.has(src)) { st.nightOn = src; label(st.nights.get(src)); return; }
    // the earlier picture is back: the wording goes back with it, and the layer lets go of the globe
    label(null); st.want = null; st.nightOn = null; st.restoring = false; st.saved = null; st.labelFor = null; st.blob = null;
    for (const u of st.nights.keys()) { try { URL.revokeObjectURL(u); } catch (_) { } }   // the addresses stay in st.nights, so a late load of one is still refused
  }
  // Switching off. The layer reads off at once; the earlier picture is asked for; the wording changes when it lands.
  function restore() {
    let g = null; try { g = ME.globe && ME.globe(); } catch (_) { }
    if (!st.saved || st.restoring || !g) {
    if (typeof ME.zoomImgLabel === 'function') ME.zoomImgLabel();   // the Sky zoom-out view names the picture that is drawn
      return;
    }
    st.blobUrl = null; st.restoring = true;
    g.globeImageUrl(st.prevUrl); st.want = href(g.globeImageUrl()); st.prevUrl = null;   // from here a night picture still loading is refused when it lands
  }
  async function setOn(on) {
    if (on === st.on) return;
    st.gen++; const gen = st.gen;
    if (!on) { st.on = false; st.status = 'off'; st.why = null; st.date = null; st.arriving = []; restore(); paint(); return; }
    st.on = true; st.why = null; st.status = 'loading'; st.date = null; st.arriving = []; paint();
    const stop = why => { st.status = 'unavailable'; st.why = why; st.on = false; restore(); paint(); };
    if (!ME.globe || !ME.globe()) return stop('Night lights on the globe needs the 3-D globe, which is not available in this browser. Nothing is drawn. The comparison below still works.');
    // Newest first. For each date: a small probe, and only if the probe passes the rule, the full frame. The rule is then
    // applied AGAIN to the full frame, because that is the picture that goes on the globe (GPT round 1, 15 Nov): a date whose
    // displayed frame fails the rule is "still arriving" whatever its probe said, and the next date is tried. A request that
    // fails or is blocked, probe or full frame, stops the search and is reported as that. Each result's `missing` is the
    // share for the last picture read for that date; `probe` keeps the probe's own share.
    const t0 = performance.now(), results = [], [W, H] = NL.GLOBAL; let f = null;
    for (let i = 0; i < NL.CANDIDATES; i++) {
      const date = utcDay(now() - i * 864e5), p = await frame(date, NL.WORLD, NL.PROBE[0], NL.PROBE[1], false);
      if (gen !== st.gen) return;
      if (p.status !== 'ok') { results.push({ date, status: p.status, why: p.why }); break; }
      const r = { date, status: 'ok', probe: bandMissing(p.light, NL.PROBE[0], NL.PROBE[1], NL.BAND), full: null }; r.missing = r.probe; results.push(r);
      if (r.probe > NL.MAX_MISSING) continue;                       // the probe already shows it is still arriving
      const g = await frame(date, NL.WORLD, W, H, false);
      if (gen !== st.gen) return;
      if (g.status !== 'ok') { results[results.length - 1] = { date, status: g.status, why: g.why, probe: r.probe }; break; }
      r.full = bandMissing(g.light, W, H, NL.BAND); r.missing = r.full;   // the rule is judged on the displayed picture
      if (r.full <= NL.MAX_MISSING) { f = g; break; }
    }
    const pick = pickDate(results); st.arriving = pick.arriving; st.probes = results;
    if (pick.fail) return stop(failText(pick.fail, 'Night lights'));
    if (!pick.date || !f) return stop(`No complete night frame yet: ${joinDays(pick.arriving)} ${pick.arriving.length === 1 ? 'is' : 'are'} still arriving. Nothing is drawn.`);
    st.missing = results[results.length - 1].full; st.bytes.global = f.bytes;
    st.keyLight = f.key;   // the key this frame was decoded with; kept for the legend's swatches (never asked for again here)
    const cv = paintGlobal(new ImageData(f.rgba, W, H), W, H, f.light);
    const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
    if (gen !== st.gen) return;
    if (!blob) return stop('Night lights could not be drawn in this browser. Nothing is drawn.');
    const g = ME.globe(), a = $('imgdate'), b = $('img-full'); gate(g);
    if (st.restoring) { st.prevUrl = st.want; st.restoring = false; }   // switched on again before the earlier picture came back: keep its address and the wording saved before; its load is refused if it lands now
    else { st.prevUrl = g.globeImageUrl(); st.saved = { imgdate: a ? a.innerHTML : '', full: b ? b.textContent : '' }; st.labelFor = ''; }
    st.blob = blob; st.blobUrl = URL.createObjectURL(blob);
    const mine = href(st.blobUrl); st.nights.set(mine, pick.date); st.want = mine;
    g.globeImageUrl(st.blobUrl);
    // "ready" only once THIS night picture is the one on the globe; its wording was written as it went on
    const t1 = performance.now(), wait = waitMs();
    while (gen === st.gen && st.nightOn !== mine && performance.now() - t1 < wait) await sleep(30);
    if (gen !== st.gen) return;
    if (st.nightOn !== mine) return stop('Night lights could not be drawn in this browser. Nothing is drawn.');
    st.date = pick.date; st.status = 'ready'; st.timings.readyMs = Math.round(performance.now() - t0);
    paint();
  }

  // ---------- labels for the globe layer
  function scaleHtml() {   // swatches read from NASA's key, so the legend is the published scale
    const key = st.keyLight; if (!key) return '';
    const ents = [...key.entries()].map(([rgb, t]) => ({ rgb, t })).sort((x, y) => x.t - y.t);
    const at = t => { let e = ents[0]; for (const x of ents) if (x.t <= t) e = x; return e.rgb; };
    const sw = (rgb, label) => `<span class="nl-sw-w"><span class="nl-sw" style="background:rgb(${rgb})"></span>${esc(label)}</span>`;
    return `<div><b>Light measured, ${esc(NL.UNITS)}</b></div><div class="nl-scale">` +
      [[0, '0'], [10, '1'], [20, '2'], [50, '5'], [100, '10'], [200, '20'], [NL.TOP_T, '38.2 or more']].map(([t, l]) => sw(at(t), l)).join(' ') + `</div>`;
  }
  const patHtml = () => `<div class="nl-pats"><span class="nl-sw-w"><span class="nl-sw nl-p-nodata"></span>No data: no night pass, or the frame has not arrived</span></div>`;
  function paint() {
    const ready = st.on && st.status === 'ready', dt = st.date ? dayText(st.date) : null;
    const t = $('tgl-nl'); if (t) { t.setAttribute('aria-checked', String(st.on)); t.setAttribute('aria-busy', String(st.status === 'loading')); }
    const s = $('s-nl'); if (s) { s.textContent = ready ? 'on' : st.status === 'loading' ? 'loading' : st.status === 'unavailable' ? 'unavailable' : 'off'; s.className = 'state' + (st.status === 'unavailable' ? ' warn' : ''); }
    const o = $('nl-status');
    if (o) o.innerHTML = st.status === 'loading' ? 'Finding the newest complete night frame…'
      : ready ? `<b>Showing ${esc(dt)} (UTC)</b> · NASA GIBS, VIIRS ${esc(NL.SAT)}` +
          (st.arriving.length ? `<br>${esc(joinDays(st.arriving))} ${st.arriving.length === 1 ? 'is' : 'are'} still arriving. Showing ${esc(dt)}.` : '') + `<br>${esc(NL.R2)}`
      : st.why ? `<b>${esc(st.why)}</b>` : 'Off. Switch on to load the newest complete night frame.';
    const lg = $('nl-legend');
    if (lg) { lg.hidden = !ready; if (ready) lg.innerHTML = `<b>Night lights</b> · NASA GIBS, VIIRS ${esc(NL.SAT)} · ${esc(dt)} (UTC) · light as measured, not live<br>${scaleHtml()}${patHtml()}<div>${esc(NL.R2)}</div>`; }
    if (typeof ME.paintKeyExternal === 'function') ME.paintKeyExternal();
  }

  // ---------- 2. the comparison
  const cmpEl = id => $('nl-' + id);
  function cmpMsg(html, bad) { const m = cmpEl('msg'); if (m) { m.innerHTML = html || ''; m.hidden = !html; m.className = 'hint' + (bad ? ' nl-bad' : ''); } }
  function readForm() {
    const lat = parseFloat(cmpEl('lat').value), lng = parseFloat(cmpEl('lng').value), span = parseFloat(cmpEl('span').value);
    const a = validDay(cmpEl('a').value), b = validDay(cmpEl('b').value), last = utcDay(now());
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return { err: 'Give a latitude from −90 to 90 and a longitude from −180 to 180.' };
    if (!NL.SPANS.includes(span)) return { err: 'Choose a box size from the list.' };
    if (!a || !b || a < NL.FIRST || b < NL.FIRST || a > last || b > last) return { err: `Night lights are held from ${dayText(NL.FIRST)} to ${dayText(last)} (UTC dates). Choose two dates in that range.` };
    if (a === b) return { err: 'Choose two different nights.' };
    const [d1, d2] = a < b ? [a, b] : [b, a], px = spanPx(span);
    return { box: boxFor(lat, lng, span), w: px, h: px, a: d1, b: d2 };
  }
  // The comparison itself. Returns the decoded result (tests read it); draws nothing.
  async function compare(p) {
    const [fa, fb] = await Promise.all([frame(p.a, p.box, p.w, p.h, true), frame(p.b, p.box, p.w, p.h, true)]);
    const res = { box: p.box, w: p.w, h: p.h, a: fa, b: fb, blocked: fa.status === 'blocked' || fb.status === 'blocked', states: null, tally: null };
    if (fa.status === 'ok' && fb.status === 'ok') { res.states = classify(fa.light, fa.clear, fb.light, fb.clear, NL.THRESH_H); res.tally = tally(fa.light, fa.clear, fb.light, fb.clear, NL.THRESH_H); }
    return res;
  }
  function drawPanel(cv, f, states, w, h) {
    const k = Math.max(1, Math.floor(360 / w)), W = w * k, H = h * k; cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) { const sy = (y / k) | 0; for (let x = 0; x < W; x++) {
      const si = sy * w + ((x / k) | 0), s = states[si], o = (y * W + x) * 4; let c;
      if (s === USABLE) c = [f.rgba[si * 4], f.rgba[si * 4 + 1], f.rgba[si * 4 + 2]];
      else if (s === NOREL) c = (x + y) % 6 < 3 ? NL.NOREL[0] : NL.NOREL[1];        // diagonal stripes
      else c = ((x >> 2) + (y >> 2)) & 1 ? NL.NODATA[1] : NL.NODATA[0];             // checker
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; } }
    g.putImageData(img, 0, 0);
  }
  const boxText = b => { const la = v => `${Math.abs(v).toFixed(2)}° ${v < 0 ? 'S' : 'N'}`, lo = v => `${Math.abs(v).toFixed(2)}° ${v < 0 ? 'W' : 'E'}`; return `${la(b.s)} to ${la(b.n)}, ${lo(b.w)} to ${lo(b.e)}`; };
  function readout(i) {
    const c = st.cmp, o = cmpEl('read'); if (!c || !o) return;
    if (i == null) { o.textContent = 'Tap a picture, or focus it and use the arrow keys, to read one pixel.'; return; }
    const x = i % c.w, y = (i / c.w) | 0, lat = c.box.n - (y + 0.5) / c.h * (c.box.n - c.box.s), lng = c.box.w + (x + 0.5) / c.w * (c.box.e - c.box.w);
    const where = `${Math.abs(lat).toFixed(3)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lng).toFixed(3)}° ${lng < 0 ? 'W' : 'E'}`;
    const ok = c.a.status === 'ok' && c.b.status === 'ok';
    if (ok) {
      const s = c.states[i];
      o.textContent = s === USABLE ? `${where} · ${dayText(c.a.date)}: ${lightText(c.a.light[i])} ${NL.UNITS} · ${dayText(c.b.date)}: ${lightText(c.b.light[i])} ${NL.UNITS} · usable on both nights`
        : s === NOREL ? `${where} · No reliable comparison: clear-sky confidence is below 0.95, or absent, on at least one night. No light value is shown.`
        : `${where} · No data on at least one night: no night pass, or the frame has not arrived. No light value is shown.`;
    } else {
      const f = c.a.status === 'ok' ? c.a : c.b, s = c.one[i];
      o.textContent = s === USABLE ? `${where} · ${dayText(f.date)}: ${lightText(f.light[i])} ${NL.UNITS} · readable on this night; the other night could not be loaded, so no comparison is made`
        : s === NOREL ? `${where} · ${dayText(f.date)}: clear-sky confidence is below 0.95 or absent. No light value is shown.` : `${where} · ${dayText(f.date)}: no data. No light value is shown.`;
    }
    for (const id of ['mk-a', 'mk-b']) { const m = cmpEl(id); if (m) { m.hidden = false; m.style.left = ((x + 0.5) / c.w * 100) + '%'; m.style.top = ((y + 0.5) / c.h * 100) + '%'; } }
    st.cur = i;
  }
  function showCompare(res) {
    st.cmp = res; st.cur = null;
    const out = cmpEl('out'); if (!out) return;
    const key = `<div class="nl-key"><div><b>Light measured, ${esc(NL.UNITS)}</b> · the same fixed scale on both pictures · white is 38.2 or more</div>${scaleKeyHtml()}` +
      `<div class="nl-pats"><span class="nl-sw-w"><span class="nl-sw nl-p-norel"></span>No reliable comparison</span> <span class="nl-sw-w"><span class="nl-sw nl-p-nodata"></span>No data</span></div></div>`;
    const cav = `<div class="cav">${esc(NL.THRESH_TEXT)}</div><div class="cav">${esc(NL.R2)} ${esc(NL.LOCAL)}</div>`;
    if (res.blocked) { out.innerHTML = `<div class="hint nl-bad"><b>This browser blocked reading the pictures' values, so nothing can be compared. No shares are shown.</b></div>`; out.hidden = false; return; }
    const okA = res.a.status === 'ok', okB = res.b.status === 'ok';
    if (!okA && !okB) { out.innerHTML = `<div class="hint nl-bad"><b>Neither night could be loaded: ${esc(res.a.why)}. Nothing is drawn.</b> Press Compare to try again.</div>`; out.hidden = false; return; }
    const fig = (id, f, ok) => `<figure class="nl-fig"><figcaption>${esc(dayText(f.date))} (UTC)</figcaption>` + (ok
      ? `<div class="nl-cvw"><canvas id="nl-cv-${id}" class="nl-cv" tabindex="0" role="img" aria-label="Night lights, ${esc(dayText(f.date))}, ${esc(boxText(res.box))}"></canvas><span class="nl-mk" id="nl-mk-${id}" hidden></span></div>`
      : `<div class="hint nl-bad"><b>The ${esc(dayText(f.date))} frame could not be loaded: ${esc(f.why)}.</b> Nothing is drawn for it. Press Compare to try again.</div>`) +
      (ok && f.blank ? `<div class="hint nl-blank">No data for this date.</div>` : '') + `</figure>`;
    let shares;
    if (okA && okB) { const t = res.tally;
      shares = `<div class="nl-shares" id="nl-shares">Readable on ${esc(dayText(res.a.date))}: <b>${pct(t.readA, t.n)}</b> · Readable on ${esc(dayText(res.b.date))}: <b>${pct(t.readB, t.n)}</b> · Usable on both: <b>${pct(t.both, t.n)}</b> — of the area in view</div>`;
    } else { const f = okA ? res.a : res.b, g = okA ? res.b : res.a; res.one = classifyOne(f.light, f.clear, NL.THRESH_H);
      shares = `<div class="nl-shares" id="nl-shares">Readable on ${esc(dayText(f.date))}: <b>${pct(readable(f.light, f.clear, NL.THRESH_H), res.w * res.h)}</b> of the area in view · The ${esc(dayText(g.date))} frame could not be loaded, so no comparison is made.</div>`; }
    const kmPx = (res.box.n - res.box.s) / res.h * 111.2, coarse = (res.box.n - res.box.s) * NL.PX_PER_DEG > res.h;
    out.innerHTML = `<div class="nl-where">${esc(boxText(res.box))} · ${res.w} × ${res.h} pixels` + (coarse ? ` · drawn coarser than the layer's own detail: about ${kmPx.toFixed(1)} km a pixel` : '') + `</div><div class="nl-pair">${fig('a', res.a, okA)}${fig('b', res.b, okB)}</div>${shares}` +
      `<div class="hint" id="nl-read" aria-live="polite"></div>${key}${cav}`;
    out.hidden = false;
    if (okA) drawPanel(cmpEl('cv-a'), res.a, res.states || res.one, res.w, res.h);
    if (okB) drawPanel(cmpEl('cv-b'), res.b, res.states || res.one, res.w, res.h);
    for (const id of ['cv-a', 'cv-b']) { const cv = cmpEl(id); if (!cv) continue;
      cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), x = Math.min(res.w - 1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * res.w))), y = Math.min(res.h - 1, Math.max(0, Math.floor((e.clientY - r.top) / r.height * res.h))); readout(y * res.w + x); });
      cv.addEventListener('keydown', e => { const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!d) return; e.preventDefault();
        const i = st.cur == null ? ((res.h >> 1) * res.w + (res.w >> 1)) : st.cur, step = e.shiftKey ? 10 : 1;
        const x = Math.min(res.w - 1, Math.max(0, i % res.w + d[0] * step)), y = Math.min(res.h - 1, Math.max(0, ((i / res.w) | 0) + d[1] * step)); readout(y * res.w + x); }); }
    readout(null);
  }
  function scaleKeyHtml() { const h = scaleHtml(); return h ? h.replace(/^<div><b>.*?<\/b><\/div>/, '') : ''; }
  async function runCompare() {
    const p = readForm(); const out = cmpEl('out');
    if (p.err) { cmpMsg(`<b>${esc(p.err)}</b>`, true); return null; }
    const gen = ++st.cmpGen; if (out) { out.hidden = true; out.innerHTML = ''; } st.cmp = null;   // nothing stays on screen from an earlier answer
    cmpMsg('Loading the two nights from NASA GIBS…'); const go = cmpEl('go'); if (go) go.setAttribute('aria-busy', 'true');
    const t0 = performance.now(), res = await compare(p);
    if (gen !== st.cmpGen) return null;   // a newer Compare owns the form: this one writes nothing
    // No request and no wait from here to the end (GPT round 3, 16 Nov): the key comes from a frame that loaded, and a
    // failure is shown as it came back. The busy mark stays set until this result is on the page.
    const k = (res.a.status === 'ok' && res.a.key) || (res.b.status === 'ok' && res.b.key); if (k) st.keyLight = k;
    st.timings.compareMs = Math.round(performance.now() - t0); st.bytes.compare = (res.a.bytes || 0) + (res.b.bytes || 0);
    cmpMsg(''); showCompare(res);
    if (go) go.setAttribute('aria-busy', 'false');
    return res;
  }

  // ---------- wiring
  const tgl = $('tgl-nl'); if (tgl) tgl.addEventListener('click', () => setOn(!st.on));
  if (cmpEl('go')) {
    const b = utcDay(now() - 864e5), a = utcDay(now() - 31 * 864e5);   // defaults only; no request is made until Compare is pressed
    cmpEl('a').value = a; cmpEl('b').value = b; for (const id of ['a', 'b']) { cmpEl(id).min = NL.FIRST; cmpEl(id).max = utcDay(now()); }
    const here = () => { try { const c = ME.cameraAt && ME.cameraAt(); if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) { cmpEl('lat').value = c.lat.toFixed(2); cmpEl('lng').value = (((c.lng + 540) % 360) - 180).toFixed(2); return true; } } catch (_) { } return false; };
    if (!here()) { cmpEl('lat').value = '0.00'; cmpEl('lng').value = '0.00'; }
    cmpEl('here').addEventListener('click', () => { if (!here()) cmpMsg('<b>The globe is unavailable in this browser, so there is no view to read. Type a latitude and longitude instead.</b>', true); else cmpMsg(''); });
    cmpEl('form').addEventListener('submit', e => { e.preventDefault(); runCompare(); });
  }
  ME.nightLights = {
    on: () => st.on && st.status === 'ready', setOn, compare, runCompare, logic,
    state: () => ({ on: st.on, status: st.status, why: st.why, date: st.date, arriving: st.arriving.slice(), probes: st.probes ? st.probes.map(p => ({ ...p })) : null, missing: st.missing,
      backdrop: st.saved ? 'night lights' : 'unchanged', restoring: !!st.restoring, pending: st.want ? (st.nights.has(st.want) ? (st.nightOn === st.want ? null : 'night') : 'earlier') : null, gate: { accepted: st.gate.accepted.slice(), rejected: st.gate.rejected.slice() }, requests: st.requests.slice(), bytes: { ...st.bytes }, timings: { ...st.timings },
      compare: st.cmp ? { box: st.cmp.box, w: st.cmp.w, h: st.cmp.h, a: st.cmp.a.status, b: st.cmp.b.status, blocked: st.cmp.blocked, tally: st.cmp.tally ? { ...st.cmp.tally } : null } : null }),
    options: o => Object.assign(st.opts, o || {}),   // test aid: now (ms) pins "today" before a switch-on or a Compare
    result: () => st.cmp,                            // test aid: the decoded comparison last drawn
  };
  paint();
})();
