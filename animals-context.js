/* Mother Earth — Animals page, historical regional land context for a recorded journey (C1a, zebra; ANIMALS-JOURNEY-CONTEXT
 * build brief rev 1.2 §3). One pinned context file per block: fetched only when the block comes on screen, checked against the
 * sha256 pinned here, then checked for structure and arithmetic before anything is written. A file that fails any check shows
 * no figure. Every value is written as text (textContent), never as markup.
 * What the block says: fire detections and mapped tree-cover loss in the 4° grid cells the journey's fixes fall in. It does not
 * say where the animal went, what it met or how it was affected; the closing sentence is required and checked.
 * This file does not touch the globe, the replay or the other cards, and loads nothing else. */
(() => {
  const C = {
    FILES: { 'zebra-botswana-Z3866': { file: 'assets/animals/zebra-botswana-Z3866-context-R1.json', sha256: '6b67818b4fb2c334bce958f1b50a3a8d3e66fd69269357dee35650ffe922a21e', id: 'zebra-botswana-Z3866-context-R1' } },
    HEADING: 'Historical regional land context',
    CLOSING: 'These are regional observations. They do not show where the zebra went, what it encountered or how it was affected.',
    MISMATCH: 'Mapped tree-cover loss in the calendar years 2007 and 2008; these years extend beyond the recorded journey.',
    UNVERIFIED: 'The regional context could not be verified. No figure is shown.',
    FAILED: 'The regional context could not be loaded. No figure is shown.',
    LOADING: 'Checking the regional context file…',
    WAIT_MS: 20000,
    LANCE: "We acknowledge the use of data and/or imagery from NASA's Land, Atmosphere Near real-time Capability for Earth observations (LANCE) (https://earthdata.nasa.gov/lance), part of NASA's Earth Science Data and Information System (ESDIS).",
    FIRMS_URL: 'https://firms.modaps.eosdis.nasa.gov/',
    HANSEN_URL: 'https://storage.googleapis.com/earthenginepartners-hansen/GFC-2025-v1.13/download.html',
    CCBY_URL: 'https://creativecommons.org/licenses/by/4.0/',
  };
  class Unverified extends Error { }
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const hex = async buf => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
  const nf = x => Number(x).toLocaleString('en-GB');
  const nf1 = x => Number(x).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const a = (href, text) => { const e = el('a', '', text); e.href = href; e.rel = 'noopener'; e.target = '_blank'; return e; };
  const ISO_MIN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})Z$/, ISO_S = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;
  const isInt = x => Number.isInteger(x) && x >= 0, isNum = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;
  const need = (c, why) => { if (!c) throw new Unverified(why); };
  const minute = s => { const m = ISO_MIN.exec(s); need(m, 'a time is not a UTC minute'); return `${+m[3]} ${MON[+m[2] - 1]} ${m[1]} ${m[4]}:${m[5]}`; };
  const day = s => { const m = ISO_S.exec(s); need(m, 'a fix time is not a UTC second'); return `${+m[3]} ${MONTH[+m[2] - 1]} ${m[1]}`; };

  /** structure and arithmetic: anything else in the file is refused before a word is written */
  function validate(d, want) {
    need(d && d.schema === 1 && d.id === want.id && d.heading === C.HEADING, 'the file is not this block\'s context file');
    need(d.closing === C.CLOSING, 'the required closing sentence is missing or changed');
    const j = d.journey, r = d.region, f = d.fires, l = d.loss;
    need(j && ISO_S.test(j.first_fix_utc) && ISO_S.test(j.last_fix_utc) && j.first_fix_utc < j.last_fix_utc, 'the journey period is malformed');
    need(r && Array.isArray(r.cells) && r.cells.length > 0 && r.bounds && isNum(r.area_km2_hub_grid), 'the region is malformed');
    need(f && f.interval_utc && ISO_MIN.test(f.interval_utc.from) && ISO_MIN.test(f.interval_utc.to), 'the fire interval is malformed');
    need(f.interval_utc.from === j.first_fix_utc.slice(0, 16) + 'Z' && f.interval_utc.to === j.last_fix_utc.slice(0, 16) + 'Z', 'the fire interval is not the journey rounded down to whole minutes');
    need(f.coverage && ['complete', 'unknown', 'incomplete'].includes(f.coverage.state) && Array.isArray(f.coverage.gap_days_listed_in_interval), 'the coverage state is malformed');
    need(Array.isArray(f.versions_in_file) && f.versions_in_file.every(v => typeof v === 'string'), 'the file versions are malformed');
    const mo = f.by_month; need(Array.isArray(mo) && mo.length > 0, 'the monthly rows are missing');
    mo.forEach((m, i) => need(m && typeof m.label === 'string' && ISO_MIN.test(m.from_utc) && ISO_MIN.test(m.to_utc) && typeof m.part_month === 'boolean' && (m.count === null || isInt(m.count)), `monthly row ${i + 1} is malformed`));
    need(mo[0].from_utc === f.interval_utc.from && mo[mo.length - 1].to_utc === f.interval_utc.to, 'the monthly rows do not span the interval');
    need(mo[0].part_month && mo[mo.length - 1].part_month && mo.slice(1, -1).every(m => !m.part_month), 'the part-months are not the first and last rows');
    if (f.coverage.state === 'incomplete') { need(f.count === null, 'an incomplete record carries a total'); }
    else {
      need(isInt(f.count) && mo.every(m => isInt(m.count)), 'a count is missing');
      need(mo.reduce((s, m) => s + m.count, 0) === f.count, 'the monthly rows do not sum to the total');
      need(f.by_cell && r.cells.every(c => isInt(f.by_cell[c])) && r.cells.reduce((s, c) => s + f.by_cell[c], 0) === f.count, 'the per-cell counts do not sum to the total');
      need(f.by_satellite && Object.values(f.by_satellite).every(isInt) && Object.values(f.by_satellite).reduce((s, x) => s + x, 0) === f.count, 'the per-satellite counts do not sum to the total');
    }
    need(f.excluded && isInt(f.excluded.outside_interval) && isInt(f.excluded.outside_union) && isInt(f.excluded.identical_rows_dropped) && Object.values(f.excluded.other_types || {}).every(isInt), 'the exclusions are malformed');
    need(l && Array.isArray(l.years) && l.years.length > 0 && l.mismatch === C.MISMATCH && typeof l.threshold === 'string', 'the loss record is malformed or lacks the calendar-year wording');
    const u = l.union; need(u && isNum(u.land_km2) && isNum(u.water_km2) && isNum(u.nodata_km2) && isNum(u.treecover2000_ge30_km2) && l.years.every(y => isNum(u.loss_ha[y])), 'the loss totals are malformed');
    need(r.cells.every(c => l.by_cell && l.by_cell[c] && l.years.every(y => isNum(l.by_cell[c].loss_ha[y])) && isNum(l.by_cell[c].nodata_km2) && isInt(l.by_cell[c].loss_2007_2008_pixels_not_counted)), 'the per-cell loss is malformed');
    l.years.forEach(y => need(Math.abs(r.cells.reduce((s, c) => s + l.by_cell[c].loss_ha[y], 0) - u.loss_ha[y]) <= 0.1 + 1e-9, `the per-cell loss for ${y} does not add up to the total`));
    need(Array.isArray(l.cautions) && l.cautions.length > 0 && l.cautions.every(x => typeof x === 'string'), 'the loss cautions are missing');
    need(l.provenance && l.provenance.credit === 'Source: Hansen/UMD/Google/USGS/NASA' && l.provenance.licence === 'CC BY 4.0', 'the loss credit or licence is missing');
  }

  const cellName = (d, c) => { const i = d.region.cells.indexOf(c), w = d.region.bounds.west + 4 * i; return `${w}–${w + 4}° E`; };

  /** the block, from a verified file */
  function write(body, d) {
    const f = d.fires, l = d.loss, r = d.region, b = r.bounds, mo = f.by_month, cov = f.coverage, out = [];
    const p = (lead, ...rest) => { const e = el('p', 'an-ctx-line'); if (lead) e.append(el('strong', '', lead + ' ')); rest.forEach(x => e.append(x)); out.push(e); return e; };
    p('Recorded journey:', `${day(d.journey.first_fix_utc)} to ${day(d.journey.last_fix_utc)} (UTC).`);
    p('Area used for this context:', `${r.cells.length === 2 ? 'two' : nf(r.cells.length)} 4° grid cells, ${b.west}–${b.east}° E, ${-b.north}–${-b.south}° S, about ${nf(Math.round(r.area_km2_hub_grid / 100) * 100)} km². This is far larger than the area the zebra used.`);
    const ver = f.versions_in_file.join(', ');
    const fl = p(`Presumed vegetation-fire detections (NASA FIRMS; MODIS Collection 6 standard processing, file version ${ver}):`);
    const span = `from ${minute(f.interval_utc.from)} to ${minute(f.interval_utc.to)} UTC in that area, Terra and Aqua, all confidence levels.`;
    if (cov.state === 'incomplete') fl.append(`Incomplete: the fire record for this period could not be fully read, so no total is shown (${span.replace(/\.$/, '')}).`);
    else if (f.count === 0) fl.append(`no detections in the record ${span}`);
    else { const n = el('span', 'an-ctx-n', nf(f.count)); n.dataset.c = 'fires'; fl.append(n, ' ' + span); }
    fl.append(' A detection marks a satellite pixel with an active fire; it is not a count of fires, and cloud hides some. ');
    const cl = el('span', 'an-ctx-cov'); cl.dataset.c = 'coverage';
    if (cov.state === 'unknown') cl.textContent = 'Coverage unknown: the provider\'s missing-data table could not be read for this period.';
    else if (cov.state === 'incomplete') cl.textContent = '';
    else if (!cov.gap_days_listed_in_interval.length) cl.textContent = "No dates are listed in the provider's missing-data table for this period.";
    else cl.textContent = `The provider's missing-data table lists ${cov.gap_days_listed_in_interval.length === 1 ? 'one date' : nf(cov.gap_days_listed_in_interval.length) + ' dates'} in this period (${cov.gap_days_listed_in_interval.join(', ')}); detections on ${cov.gap_days_listed_in_interval.length === 1 ? 'it' : 'them'} may be missing.`;
    fl.append(cl);
    if (cov.state !== 'incomplete') {                                                                  // the monthly table: closed by default
      const det = el('details', 'an-ctx-months'); det.dataset.c = 'months'; det.append(el('summary', '', `By month (${mo.length} rows)`));
      const t = el('table', 'an-facts an-ctx-table'), th = el('thead'), hr = el('tr'); hr.append(el('th', '', 'Period (UTC)'), el('th', '', 'Detections')); hr.children[0].scope = 'col'; hr.children[1].scope = 'col'; th.append(hr);
      const tb = el('tbody'), gaps = cov.gap_days_listed_in_interval;
      mo.forEach((m, i) => {
        const tr = el('tr'), h = el('th', '', m.label + (m.part_month ? (i === 0 ? `, part-month from ${m.from_utc.slice(11, 16)}` : `, part-month to ${m.to_utc.slice(11, 16)}`) : '')); h.scope = 'row';
        const inMonth = gaps.filter(g => g >= m.from_utc.slice(0, 10) && g <= m.to_utc.slice(0, 10)).length;
        tr.append(h, el('td', '', nf(m.count) + (inMonth ? ` (includes ${inMonth === 1 ? 'a date' : nf(inMonth) + ' dates'} listed as missing)` : ''))); tb.append(tr);
      });
      const tf = el('tfoot'), fr = el('tr'), fh = el('th', '', 'Total'); fh.scope = 'row'; fr.append(fh, el('td', '', nf(f.count))); tf.append(fr);
      t.append(th, tb, tf); det.append(t, el('p', 'small', `The first and last rows are part-months. They start at ${minute(f.interval_utc.from)} and end at ${minute(f.interval_utc.to)} UTC: the first and last recorded fixes, rounded down to whole minutes, because fire times are given in whole minutes. The rows sum to the total.`));
      out.push(det);
    }
    const ha = l.years.reduce((s, y) => s + l.union.loss_ha[y], 0);
    const ll = p('Mapped tree-cover loss (Hansen/UMD/Google/USGS/NASA, v1.13):');
    const lv = el('span', 'an-ctx-n', `about ${nf1(ha)} ha`); lv.dataset.c = 'loss';
    ll.append(lv, ` (${l.years.map(y => `${y}: ${nf1(l.union.loss_ha[y])} ha`).join('; ')}), where tree cover in 2000 was at least 30 %. `);
    const mm = el('span', 'an-ctx-mismatch', C.MISMATCH); mm.dataset.c = 'mismatch'; ll.append(mm, ' A relative indicator, not a measured total; years before 2011 use an older method.');
    if (l.union.nodata_km2 > 0) ll.append(` No data for about ${nf1(l.union.nodata_km2)} km² of the area; it is not counted as zero loss.`);
    const how = el('details', 'an-ctx-how'); how.dataset.c = 'how'; how.append(el('summary', '', 'How these figures were made'));
    const ul = el('ul', 'small'), li = t => { const e = el('li', '', t); ul.append(e); return e; };
    const ot = Object.entries(f.excluded.other_types || {}), otn = ot.reduce((s, [, n]) => s + n, 0);
    li(`Fire detections: ${f.what_is_counted}. Each detection is counted in the cell that contains it; the line at ${b.west + 4}° E belongs to the eastern cell. ` + (cov.state === 'incomplete' ? '' : `By cell: ${r.cells.map(c => `${cellName(d, c)} ${nf(f.by_cell[c])}`).join(', ')}. By satellite: ${Object.entries(f.by_satellite).map(([s, n]) => `${s} ${nf(n)}`).join(', ')}.`));
    li(`Left out: ${nf(otn)} detection${otn === 1 ? '' : 's'} of other types${otn ? ' (' + ot.map(([k, n]) => `type ${k}: ${nf(n)}`).join(', ') + ')' : ''}, ${nf(f.excluded.outside_interval)} outside the period, ${nf(f.excluded.outside_union)} outside the two cells; identical rows dropped: ${nf(f.excluded.identical_rows_dropped)}.`);
    li(`Coverage: ${cov.limitation || 'cloud and unobserved times hide detections'}.`);
    li(`Tree-cover loss: ${l.what_is_counted}. Land ${nf1(l.union.land_km2)} km², water ${nf1(l.union.water_km2)} km², no data ${nf1(l.union.nodata_km2)} km²; tree cover in 2000 at least 30 % on ${nf1(l.union.treecover2000_ge30_km2)} km². By cell: ${r.cells.map(c => `${cellName(d, c)} ${l.years.map(y => `${y} ${nf1(l.by_cell[c].loss_ha[y])} ha`).join(', ')}`).join('; ')}.`);
    li(`Pixels mapped with loss in ${l.years.join(' or ')} but left out because tree cover in 2000 was under 30 % or the pixel was not land: ${r.cells.map(c => `${nf(l.by_cell[c].loss_2007_2008_pixels_not_counted)} in ${cellName(d, c)}`).join(', ')}.`);
    if (l.method && l.method.mask_conservation) { const mc = Object.values(l.method.mask_conservation)[0];
      if (mc && isNum(mc.cell_area_km2)) li(`Areas for the loss figures use the WGS84 ellipsoid (each cell ${nf1(mc.cell_area_km2)} km²). The area of the cells given above uses Mother Earth's grid sphere (${nf(Math.round(r.area_km2_hub_grid / r.cells.length))} km² each).`); }
    l.cautions.forEach(x => li(x));
    const pv = f.provenance || {};
    if (pv.retrieved_utc) li(`Fire records read from NASA FIRMS on ${pv.retrieved_utc.slice(6, 8).replace(/^0/, '')} ${MON[+pv.retrieved_utc.slice(4, 6) - 1]} ${pv.retrieved_utc.slice(0, 4)} (${nf(pv.requests || 0)} requests); tree-cover files ${l.provenance.release}. Only these totals are published here; the source files are not.`);
    how.append(ul); out.push(how);
    const src = el('p', 'small an-ctx-src'); src.dataset.c = 'sources';
    src.append('Sources: fire detections ', a(C.FIRMS_URL, 'NASA FIRMS (MODIS)'), '. ' + C.LANCE + ' Tree-cover loss: ', a(C.HANSEN_URL, 'Hansen/UMD/Google/USGS/NASA Global Forest Change 2000–2025, v1.13'), ` (${l.provenance.credit}), `, a(C.CCBY_URL, 'CC BY 4.0'), '. Not for local-scale or tactical decisions.');
    out.push(src);
    const close = el('p', 'an-ctx-close', d.closing); close.dataset.c = 'closing'; out.push(close);
    body.replaceChildren(...out);
  }

  async function load(box) {
    const want = C.FILES[box.dataset.context], st = box.querySelector('[data-c="state"]'), body = box.querySelector('[data-c="body"]');
    if (!want) { st.textContent = C.UNVERIFIED; return; }
    st.textContent = C.LOADING; const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), C.WAIT_MS);
    let buf; try { const r = await fetch(want.file, { cache: 'no-store', signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); buf = await r.arrayBuffer(); }
    catch (_) { clearTimeout(timer); body.hidden = true; st.textContent = C.FAILED; return; }
    clearTimeout(timer);
    try {
      if (await hex(buf) !== want.sha256) throw new Unverified('the file does not match its pinned checksum');
      let d; try { d = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (_) { throw new Unverified('the file is not JSON'); }
      validate(d, want); write(body, d); body.hidden = false; st.textContent = 'Context file verified against its checksum.'; box.dataset.state = 'verified';
    } catch (e) { body.replaceChildren(); body.hidden = true; st.textContent = C.UNVERIFIED; box.dataset.state = 'unverified'; box.dataset.why = e instanceof Unverified ? e.message : 'unexpected'; }
  }

  const boxes = [...document.querySelectorAll('.an-ctx[data-context]')];
  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }), { rootMargin: '200px 0px' });
    boxes.forEach(b => io.observe(b));
  } else boxes.forEach(load);
  (window.ME = window.ME || {}).animalsContext = { C, validate };
})();
