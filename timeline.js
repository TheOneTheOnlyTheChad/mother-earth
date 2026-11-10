/* Mother Earth — Timeline page enhancement (entry proposal rev 2 §5–§6; deep-time build proposal rev 1.1 §2–§4).
 * The entries are already in the HTML (works with JavaScript off). This script:
 *  - draws the deep-time axis from the hub catalogue (/catalogue/timeline) ONLY when the catalogue's sha256 equals the
 *    page's data-catalogue-sha, its revision and build match, and it validates; any other outcome leaves the list
 *    as the only view and says so (§4a). Dates from two revisions are never mixed;
 *  - turns the pre-rendered entry into a detail panel (> 720 px, non-modal) or bottom sheet (≤ 720 px, modal);
 *  - keeps ONE shareable fragment per entry (#e-…); a shortcut's expander lives in history state;
 *  - returns focus to the exact opener (title or shortcut) on Close, Esc, handle or Back;
 *  - direct link: focus the detail heading; explicit Close clears the fragment and focuses the card title
 *    (or the card control last used to switch the open entry);
 *  - a title/shortcut used while the entry is open updates the open history entry; it never adds one.
 * No fetch, no third-party request. Menu and clock behave as on the other pages (this page does not load app.js). */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const PHONE = 720;
const BUILD = '202611201000';   // = the ?v= of this file in timeline.html (build_timeline.py --check enforces it)
const HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const TIMEOUT_MS = 10000;

// ---------- clock + menu (same behaviour as app.js ME.clock / ME.menu)
const clock = $('clock');
if (clock) { const tick = () => { clock.firstChild.textContent = new Date().toISOString().slice(11, 19); }; tick(); setInterval(tick, 1000); }
(() => {
  const btn = $('menu-btn'), list = $('menu-list'); if (!btn || !list) return;
  const items = [...list.querySelectorAll('a')];
  const open = o => { list.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); if (o) items[0].focus(); };
  btn.addEventListener('click', ev => { ev.stopPropagation(); open(!list.classList.contains('open')); });
  btn.addEventListener('keydown', ev => { if (ev.key === 'ArrowDown') { ev.preventDefault(); open(true); } });
  list.addEventListener('keydown', ev => {
    const i = items.indexOf(document.activeElement);
    if (ev.key === 'Escape') { ev.stopPropagation(); open(false); btn.focus(); }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });
  document.addEventListener('click', ev => { if (!list.contains(ev.target) && ev.target !== btn) open(false); });
})();

// ---------- entries and the detail surface
const home = $('entries');
const entries = new Map([...document.querySelectorAll('article.entry')].map(a => [a.id, a]));
if (!home || !entries.size) return;
document.body.classList.add('js');

const detail = document.createElement('div');
detail.id = 'detail'; detail.className = 'detail'; detail.hidden = true;
detail.innerHTML = '<div class="dbar"><button type="button" class="handle" id="d-handle">Close</button>'
  + '<button type="button" class="dclose" id="d-close" aria-label="Close">✕</button></div><div class="dbody" id="d-body"></div>';
document.body.appendChild(detail);
const body = $('d-body');

// expanders: each .xp section's heading becomes a button controlling its body (one action each)
for (const sec of document.querySelectorAll('article.entry section.xp')) {
  const h = sec.querySelector('h4'), b = sec.querySelector('.xb');
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'xbtn'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', b.id);
  btn.innerHTML = h.innerHTML; h.textContent = ''; h.appendChild(btn); b.hidden = true;
  btn.addEventListener('click', () => setX(sec, btn.getAttribute('aria-expanded') !== 'true'));
}
function setX(sec, on) { const btn = sec.querySelector('.xbtn'), b = sec.querySelector('.xb'); btn.setAttribute('aria-expanded', String(on)); b.hidden = !on; }
const xSection = (id, x) => x ? $(`${id}-${x}`) : null;

let cur = null;               // {id, x, k, direct} of the open entry
let seq = 0;
const openers = new Map();    // history key -> the control that opened it (page memory only)
const isPhone = () => innerWidth <= PHONE;
const cardTitle = id => { const a = document.querySelector(`#card-${CSS.escape(id)} .ctitle a`); return a && a.offsetParent ? a : null; };
// where focus returns when there is no recorded opener: the entry's axis mark, else its cluster button, else its card title
const visible = el => el && el.offsetParent ? el : null;
const backTarget = id => visible(document.querySelector(`#axis a.mk[data-entry="${CSS.escape(id)}"]`))
  || visible(document.querySelector(`#axis .cl[data-has~="${CSS.escape(id)}"] > button`)) || cardTitle(id);
const pageHeading = () => $('tl-heading');
const others = () => [...document.body.children].filter(n => n !== detail && n.tagName !== 'SCRIPT');

function applyMode() {
  if (detail.hidden) { others().forEach(n => { n.inert = false; }); document.documentElement.classList.remove('locked'); return; }
  const phone = isPhone(), art = body.firstElementChild;
  detail.classList.toggle('tlsheet', phone); detail.classList.toggle('tlpanel', !phone);
  detail.setAttribute('role', phone ? 'dialog' : 'region');
  if (phone) detail.setAttribute('aria-modal', 'true'); else detail.removeAttribute('aria-modal');
  if (art) detail.setAttribute('aria-labelledby', art.id + '-h');
  others().forEach(n => { n.inert = phone; });
  document.documentElement.classList.toggle('locked', phone);
  document.body.classList.toggle('dopen', !phone);
}

function show(id, x) {
  const art = entries.get(id); if (!art) return false;
  if (body.firstElementChild && body.firstElementChild !== art) home.appendChild(body.firstElementChild);
  body.appendChild(art);
  art.querySelectorAll('section.xp').forEach(s => setX(s, false));
  const sec = xSection(id, x); if (sec && sec.classList.contains('xp')) setX(sec, true);
  detail.hidden = false; applyMode();
  body.scrollTop = 0;
  return true;
}
function hide(focusEl) {
  const art = body.firstElementChild; if (art) home.appendChild(art);
  detail.hidden = true; document.body.classList.remove('dopen'); applyMode();   // inert and scroll lock removed before focus moves
  cur = null;
  (focusEl || pageHeading()).focus();
}
const focusHeading = id => { const h = $(id + '-h'); if (h) h.focus(); };

// open from a card control (title or shortcut)
document.addEventListener('click', ev => {
  const a = ev.target.closest('a[data-entry]'); if (!a || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  ev.preventDefault();
  const id = a.dataset.entry, x = a.dataset.x || null, opener = a.dataset.opener || 'title';
  if (cur && !detail.hidden && history.state && history.state.entry === cur.id) {
    // already open: switching title/shortcut UPDATES the open history entry (no new entry), keeps its key and
    // direct flag; focus on close then returns to this, the most recently used card control
    openers.set(cur.k, a);
    history.replaceState({ entry: id, x, opener, direct: cur.direct, k: cur.k }, '', '#' + id);
    cur = { id, x, k: cur.k, direct: cur.direct };
    if (show(id, x)) focusHeading(id);
    return;
  }
  const k = ++seq;
  openers.set(k, a);
  history.pushState({ entry: id, x, opener, k }, '', '#' + id);
  cur = { id, x, k, direct: false };
  if (show(id, x)) focusHeading(id);
});

// explicit Close (✕, handle, Esc)
function userClose() {
  if (!cur) return;
  if (!cur.direct && history.state && history.state.entry === cur.id) { history.back(); return; }   // popstate closes and restores focus
  const id = cur.id, k = cur.k;
  history.replaceState(null, '', location.pathname + location.search);   // clears the fragment
  hide(openers.get(k) || backTarget(id));   // a control used after a direct link, else the mark / cluster / card title
}
$('d-close').addEventListener('click', userClose);
$('d-handle').addEventListener('click', userClose);

document.addEventListener('keydown', ev => {
  if (detail.hidden) return;
  if (ev.key === 'Escape' && (isPhone() || detail.contains(document.activeElement))) { ev.preventDefault(); userClose(); return; }
  if (ev.key === 'Tab' && isPhone()) {   // focus stays inside the sheet
    const f = [...detail.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')].filter(n => n.offsetParent || n === document.activeElement);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); }
    else if (!ev.shiftKey && (i === f.length - 1 || i === -1)) { ev.preventDefault(); f[0].focus(); }
  }
});

// Back / Forward
addEventListener('popstate', ev => {
  const st = ev.state;
  if (st && st.entry && entries.has(st.entry)) {          // Forward (or Back onto an open state): reopen with the stored expander
    cur = { id: st.entry, x: st.x || null, k: st.k, direct: !!st.direct };
    show(st.entry, st.x); focusHeading(st.entry); return;
  }
  const leaving = cur;
  if (leaving) hide((visible(openers.get(leaving.k)) ? openers.get(leaving.k) : null) || backTarget(leaving.id));
  if (!st) fromHash(false);   // a hand-typed or followed entry fragment on this page
});

addEventListener('resize', () => { if (!detail.hidden) applyMode(); });

// direct link (page loaded at #e-…; also the no-JS section anchors #e-…-conv / #e-…-debate, folded into the one fragment)
// focus again after the browser's own fragment handling (page load or a same-page fragment), which can drop an earlier focus()
const focusSoon = id => {
  const again = () => setTimeout(() => { if (cur && cur.id === id) focusHeading(id); }, 0);
  focusHeading(id);
  if (document.readyState === 'complete') again(); else addEventListener('load', again, { once: true });
};
function direct(id, x) {
  const k = ++seq;
  history.replaceState({ entry: id, x, opener: null, direct: true, k }, '', '#' + id);
  cur = { id, x, k, direct: true };
  if (show(id, x)) focusSoon(id);
}
function fromHash(onLoad) {
  const h = location.hash.slice(1); if (!h) return;
  const st = history.state;
  if (onLoad && st && st.entry && entries.has(st.entry) && h === st.entry) {   // reload of an opened state: opener memory is gone
    cur = { id: st.entry, x: st.x || null, k: st.k, direct: !!st.direct };
    if (show(st.entry, st.x)) focusSoon(st.entry); return;
  }
  if (entries.has(h)) return direct(h, null);
  const m = h.match(/^(.*)-(conv|debate)$/);
  if (m && entries.has(m[1])) return direct(m[1], m[2]);
}
// ---------- deep-time axis (build proposal rev 1.1 §1–§4)
const LABELS = {
  extinction_interval_approx: 'Approximate extinction interval',
  boundary_age_bound: 'Boundary age: no older than',
  boundary_age_range_modelled: 'Modelled boundary-age range',
  extinction_onset_estimate: 'Estimated extinction onset',
  extinction_horizon_approx: 'Approximate age of the extinction horizon',
  dated_event_age: 'Impact age',
  extinction_placement_tied: 'Extinction placed at the dated impact (synchrony evidence cited)',
  chart_boundary: 'ICS chart boundary (v2026-06)',
  context: 'Context',
};
const LANE_IDS = ['earth-life', 'extinctions', 'relatives', 'history'];
const WHEN = { interval: ['from_ma', 'to_ma'], bound: ['ma'], interval_modelled: ['from_ma', 'to_ma', 'mid_ma'], measured: ['ma', 'pm'],
  approx_point: ['ma'], point: ['ma'], tied: [], boundary_age: ['ma'] };
const CLUSTER_PX = 16;          // marks closer than this share one cluster control
const TRUE_PX = 4;              // an interval at least this wide is drawn at its true endpoints
const wrap = $('axis-wrap'), axis = $('axis'), axisOff = $('axis-off');
const axisState = { state: 'pending', reason: null };
window.TL_AXIS = axisState;     // read-only test/console aid

const isNum = v => typeof v === 'number' && isFinite(v);
function validate(c) {
  if (!c || c.catalogue !== 'timeline' || c.schema !== 1) return 'catalogue identity';
  if (c.catalogue_revision !== wrap.dataset.catalogueRev) return 'revision';
  const ch = c.chart;
  if (!ch || !ch.window || !isNum(ch.window.ma) || !ch.overview || !isNum(ch.overview.ma) || ch.overview.ma <= ch.window.ma) return 'chart bounds';
  if (!Array.isArray(ch.periods) || !ch.periods.length || ch.periods.some(p => !p.begin || !isNum(p.begin.ma) || !p.end || !isNum(p.end.ma))) return 'chart periods';
  if (!Array.isArray(c.lanes) || c.lanes.map(l => l.id).join() !== LANE_IDS.join()) return 'lanes';
  if (!c.claim_labels || Object.keys(LABELS).some(k => c.claim_labels[k] !== LABELS[k]) || Object.keys(c.claim_labels).length !== Object.keys(LABELS).length) return 'claim labels';
  if (!Array.isArray(c.entries) || !c.entries.length) return 'entries';
  for (const e of c.entries) {
    if (!entries.has(e.id) || e.lane !== 'extinctions' || !Array.isArray(e.claims)) return 'entry ' + e.id;
    for (const k of e.claims) {
      if (!(k.claim_type in LABELS) || k.label !== LABELS[k.claim_type]) return 'claim type ' + e.id;
      if (k.axis) {
        if (!k.when || !(k.when.type in WHEN) || WHEN[k.when.type].some(f => !isNum(k.when[f]))) return 'claim time ' + e.id;
        for (const f of ['ma', 'from_ma', 'to_ma', 'mid_ma']) if (f in k.when && (k.when[f] < 0 || k.when[f] > ch.window.ma)) return 'outside window ' + e.id;
      }
    }
    if (!e.claims.some(k => k.axis)) return 'no axis claim ' + e.id;
  }
  if (!Array.isArray(c.shelf) || c.shelf.some(x => x.axis !== false)) return 'shelf';
  return null;
}

// one mark per entry: its position and glyph follow the entry's axis claims (§2)
function markOf(e) {
  const ax = e.claims.filter(k => k.axis), by = t => ax.find(k => k.claim_type === t);
  const desc = ax.filter(k => k.claim_type !== 'extinction_placement_tied').map(k => `${k.label}${k.label.endsWith('than') ? '' : ':'} ${k.when_text}`);
  const tied = by('extinction_placement_tied');
  if (tied) desc.push(tied.label);
  let ma, shape;
  let span = 0;
  if (by('extinction_interval_approx')) { const w = by('extinction_interval_approx').when; ma = (w.from_ma + w.to_ma) / 2; span = w.from_ma - w.to_ma; shape = 'int-approx'; }
  else if (by('boundary_age_range_modelled')) { ma = by('boundary_age_range_modelled').when.mid_ma; shape = 'modelled'; }   // one mark at the modelled range; the bound is in the panel (GPT, rev 2)
  else if (by('boundary_age_bound')) { ma = by('boundary_age_bound').when.ma; shape = 'bound'; }
  else if (by('extinction_onset_estimate')) { ma = by('extinction_onset_estimate').when.ma; shape = 'measured'; }
  else if (by('extinction_horizon_approx')) { ma = by('extinction_horizon_approx').when.ma; shape = 'approx'; }
  else if (by('dated_event_age')) { ma = by('dated_event_age').when.ma; shape = 'point' + (tied ? ' tied' : ''); }
  else { const w = ax[0].when; ma = w.ma != null ? w.ma : w.mid_ma; shape = 'point'; }
  return { id: e.id, title: e.title, short: e.short, ma, span, shape, label: `${e.title}. ${desc.join('. ')}.` };
}

let CAT = null;
let periodsOpen = false;
const pct = (ma, W) => (W - ma) / W * 100;   // older on the left
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function draw() {
  const c = CAT, W = c.chart.window.ma, O = c.chart.overview.ma;
  const marks = c.entries.map(markOf).sort((a, b) => b.ma - a.ma);
  const laneW = Math.max(1, axis.clientWidth || wrap.clientWidth);
  // clusters: neighbours closer than CLUSTER_PX share one control; positions are never moved to make room
  const groups = [];
  for (const m of marks) {
    const x = pct(m.ma, W) / 100 * laneW, g = groups[groups.length - 1];
    if (g && x - g.x1 < CLUSTER_PX) { g.items.push(m); g.x1 = x; } else groups.push({ x0: x, x1: x, items: [m] });
  }
  // an interval is drawn at its true endpoints once it is at least TRUE_PX wide; below that, a compact symbol (GPT, rev 2)
  const trueW = m => m.span ? m.span / W * laneW : 0;
  const mk = (m, inCluster) => `<a class="mk mk-${m.shape.replace(/ /g, ' mk-')}${!inCluster && trueW(m) >= TRUE_PX ? ' mk-true' : ''}" href="#${esc(m.id)}" data-entry="${esc(m.id)}" data-opener="mark"`
    + (inCluster ? '' : ` style="left:${pct(m.ma, W).toFixed(3)}%${trueW(m) >= TRUE_PX ? `;--w:${trueW(m).toFixed(2)}px` : ''}"`) + ` aria-label="${esc(m.label)}"><span class="gw" aria-hidden="true"><span class="g"></span></span>`
    + `<span class="ml" aria-hidden="true">${esc(m.short)}</span>${inCluster ? `<span class="cn">${esc(m.title)}</span>` : ''}</a>`;
  const markHtml = groups.map((g, i) => g.items.length === 1 ? mk(g.items[0], false)
    : `<div class="cl" data-has="${esc(g.items.map(m => m.id).join(' '))}" style="left:${pct((g.items[0].ma + g.items[g.items.length - 1].ma) / 2, W).toFixed(3)}%">`
      + `<button type="button" aria-expanded="false" aria-controls="cl-${i}" aria-label="${g.items.length} entries close together: ${esc(g.items.map(m => m.title).join(', '))}">${g.items.length}</button>`
      + `<ul id="cl-${i}" hidden>${g.items.map(m => `<li>${mk(m, true)}</li>`).join('')}</ul></div>`).join('');
  // bands to scale; a code is written only where it fits (names and ages are in the period list, reachable by tap and keyboard)
  const bands = c.chart.periods.map(p => { const wpx = (p.begin.ma - p.end.ma) / W * laneW;
    return `<span class="band" style="left:${pct(p.begin.ma, W).toFixed(3)}%;width:${(pct(p.end.ma, W) - pct(p.begin.ma, W)).toFixed(3)}%"><i style="background:${esc(p.colour)}"></i><b>${wpx >= 16 ? esc(p.code) : ''}</b></span>`; }).join('');
  const edge = x => `${x.approximate ? '~' : ''}${x.ma_text || x.ma}${x.margin != null ? ' ± ' + (x.margin_text || x.margin) : ''}`;   // as the chart writes them
  const periods = `<div class="plist"><button type="button" id="periods-btn" aria-expanded="${periodsOpen}" aria-controls="periods-list">Periods on the chart (${c.chart.periods.length})</button>`
    + `<ul id="periods-list"${periodsOpen ? '' : ' hidden'}>${c.chart.periods.map(p => `<li><i style="background:${esc(p.colour)}" aria-hidden="true"></i>${esc(p.name)} <span class="pc">(${esc(p.code)})</span> · ${edge(p.begin)} to ${edge(p.end)} Ma</li>`).join('')}</ul></div>`;
  const ticks = [500, 400, 300, 200, 100, 0].map(t => `<span class="tk${t === 0 ? ' last' : ''}" style="left:${pct(t, W).toFixed(3)}%">${t}</span>`).join('');
  const key = [['measured', 'dated, uncertainty stated'], ['point', 'dated, uncertainty not stated'], ['point mk-tied', 'placed at a dated event'], ['approx', 'approximate'],
    ['int-approx', 'approximate interval'], ['modelled', 'modelled range']]
    .map(([k, t]) => `<span class="mk mk-${k}" aria-hidden="true"><span class="g"></span></span>${t}`).join(' · ');
  const boundaryTicks = c.entries.map(e => e.claims.find(k => k.claim_type === 'chart_boundary')).filter(Boolean)
    .map(k => `<span class="cb" style="left:${pct(k.when.ma, W).toFixed(3)}%" title="${esc(k.label + ': ' + k.when_text)}"></span>`).join('');
  const lane = l => l.status === 'active'
    ? `<div class="lr act" role="group" aria-label="${esc(l.label)} (${marks.length} entries)"><span class="ln">${esc(l.label)}</span><div class="track">${markHtml}</div></div>`
    : `<div class="lr empty"><span class="ln">${esc(l.label)}</span> · <span class="ls">${esc(l.status)}</span></div>`;
  axis.innerHTML =
    `<div class="ov" aria-label="Overview: Earth's whole span, ${O} million years ago to today. The marked part is what this release lets you explore.">`
    + `<span class="ovl">Overview</span><div class="ovbar"><span class="ovwin" style="left:${(100 - W / O * 100).toFixed(3)}%;width:${(W / O * 100).toFixed(3)}%"></span></div>`
    + `<span class="ove"><span>${O} Ma</span><span>today</span></span></div>`
    + `<p class="win">This release: the last ${c.chart.window.approximate ? '~' : ''}${W} million years. Older on the left.</p>`
    + `<div class="bands" aria-hidden="true">${bands}${boundaryTicks}</div>` + periods
    + c.lanes.filter(l => l.status === 'active').map(lane).join('')
    + `<div class="scale" aria-hidden="true">${ticks}<span class="unit">Ma</span></div>`
    + `<div class="empties">${c.lanes.filter(l => l.status !== 'active').map(lane).join('')}</div>`
    + `<p class="key">Key: ${key}. Lines in the period bar: ICS chart boundaries.</p>`;
}
function layoutKey() { const w = axis.clientWidth; return CAT ? CAT.entries.length + ':' + Math.round(w / 8) : ''; }
let lastKey = '';
addEventListener('resize', () => {
  if (axisState.state !== 'on') return;
  const k = layoutKey(); if (k === lastKey) return;
  const had = document.activeElement && axis.contains(document.activeElement) ? document.activeElement.dataset.entry : null;
  draw(); lastKey = k;
  if (had) { const t = backTarget(had); if (t) t.focus(); }
});
// cluster control and period list: each opens in place (one action), Esc closes a cluster
axis.addEventListener('click', ev => {
  const pb = ev.target.closest('#periods-btn');
  if (pb) { periodsOpen = pb.getAttribute('aria-expanded') !== 'true'; pb.setAttribute('aria-expanded', String(periodsOpen)); $('periods-list').hidden = !periodsOpen; return; }
  const b = ev.target.closest('.cl > button'); if (!b) return;
  const on = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(on)); $(b.getAttribute('aria-controls')).hidden = !on;
  if (on) { const first = $(b.getAttribute('aria-controls')).querySelector('a'); if (first) first.focus(); }
});
axis.addEventListener('keydown', ev => {
  if (ev.key !== 'Escape') return;
  const cl = ev.target.closest('.cl'); if (!cl || !detail.hidden) return;
  const b = cl.querySelector('button'); b.setAttribute('aria-expanded', 'false'); cl.querySelector('ul').hidden = true; b.focus();
});

function off(reason) {
  axisState.state = 'off'; axisState.reason = reason;
  axis.hidden = true; axis.innerHTML = ''; axisOff.hidden = false;
  wrap.classList.remove('on');
}
async function loadAxis() {
  if (!wrap || !axis || !axisOff) return;
  if (wrap.dataset.build !== BUILD) return off('build');                     // HTML and script from different builds
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let buf;
  try {
    const r = await fetch(HUB + '/catalogue/timeline', { cache: 'no-store', signal: ctl.signal });
    if (!r.ok) return off('http ' + r.status);
    buf = await r.arrayBuffer();
  } catch (err) { return off(ctl.signal.aborted ? 'timeout' : 'network'); }
  finally { clearTimeout(t); }
  let sha;
  try { sha = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join(''); }
  catch (err) { return off('hash unavailable'); }
  if (sha !== wrap.dataset.catalogueSha) return off('revision mismatch');
  let c;
  try { c = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buf)); } catch (err) { return off('parse'); }
  let bad;
  try { bad = validate(c); } catch (err) { bad = 'malformed'; }   // a nested null or wrong type never escapes the fallback (GPT, rev 2)
  if (bad) return off('validation: ' + bad);
  CAT = c;
  try { axis.hidden = false; draw(); lastKey = layoutKey(); } catch (err) { CAT = null; return off('draw'); }
  axisOff.hidden = true; wrap.classList.add('on');
  axisState.state = 'on'; axisState.reason = null;
}
loadAxis();

fromHash(true);
})();
