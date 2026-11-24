/* Mother Earth — Timeline page enhancement (entry proposal rev 2 §5–§6; deep-time build proposal rev 1.1 §2–§4).
 * The entries are already in the HTML (works with JavaScript off). This script:
 *  - draws the deep-time axis from the hub catalogue (/catalogue/timeline/<its own revision>, hub ≥ 0.6.4) ONLY when the catalogue's sha256 equals the
 *    page's data-catalogue-sha, its revision and build match, and it validates; any other outcome leaves the list
 *    as the only view and says so (§4a). Dates from two revisions are never mixed;
 *  - turns the pre-rendered entry into a detail panel (> 720 px, non-modal) or bottom sheet (≤ 720 px, modal);
 *  - keeps ONE shareable fragment per entry (#e-…); a shortcut's expander lives in history state;
 *  - returns focus to the exact opener (title or shortcut) on Close, Esc, handle or Back;
 *  - direct link: focus the detail heading; explicit Close clears the fragment and focuses the card title
 *    (or the card control last used to switch the open entry);
 *  - a title/shortcut used while the entry is open updates the open history entry; it never adds one;
 *  - "Changed in …" inside an open entry jumps to its record under What changed (TIMELINE-INBOX-AND-CHANGES-PROPOSAL
 *    rev 2.1 §5): on a phone the sheet is closed VISUALLY (the Close handler is not used: it would spend the history
 *    entry Back needs), the record is revealed and focused, and Back reopens the same entry with focus on that link.
 *  - the explorer (TIMELINE-TRAVEL-PROPOSAL rev 2.1 §3): one linear scale per window, pan and zoom by buttons, drag, keys and
 *    (once activated) the wheel; presets; clusters that keep their list at every zoom; intervals clipped at the window edge.
 *    Pan and zoom never add a history entry: the window is merged into the CURRENT entry's state (saveWin). Opening a story
 *    records the window in the entry being left and in the new one, so Close/Back/Forward restore it.
 * One catalogue request at load; none on pan, zoom or selection. Menu and clock behave as on the other pages (this page does not load app.js). */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const PHONE = 720;
const BUILD = '202612250700';   // = the ?v= of this file in timeline.html (build_timeline.py --check enforces it)
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
  + '<button type="button" class="dclose" id="d-close" aria-label="Close">✕</button></div>'
  + '<div class="dnav" id="d-nav" hidden><button type="button" id="d-older" aria-label="Older plotted entry on this view">◀ Older entry</button><button type="button" id="d-newer" aria-label="Newer plotted entry on this view">Newer entry ▶</button>'
  + '<p id="d-navmsg"></p><button type="button" id="d-wide" hidden>Look in the whole timeline</button><p class="sr" id="d-pos" role="status"></p></div>'
  + '<div class="dbody" id="d-body"></div>';
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
// History keys are unique across reloads of this tab (they start from the clock, never below a key already in use), and
// every state we push records p, the key of the entry it was pushed FROM. Direction and return targets are read from
// that stored data (and from the state being left), never inferred from the size of a key or from page memory.
let seq = Math.max(Date.now(), (history.state && history.state.k) || 0);
let at = history.state || null;   // the state of the history entry we are on (survives a reload: it IS history.state)
const put = (st, hash) => { saveWin(); st = withWin(st); history.pushState(st, '', hash); at = st; };   // the entry being left keeps its window; the new one starts with it
const swap = (st, url) => { st = withWin(st); history.replaceState(st, '', url); at = st; };
const openers = new Map();    // history key -> the control that opened it (page memory only)
const isPhone = () => innerWidth <= PHONE;
const cardTitle = id => { const a = document.querySelector(`#card-${CSS.escape(id)} .ctitle a`); return a && a.offsetParent ? a : null; };
// where focus returns when there is no recorded opener: the entry's axis mark, else its cluster button, else its card title
const visible = el => el && el.offsetParent ? el : null;
const backTarget = id => visible(document.querySelector(`#axis a.mk[data-entry="${CSS.escape(id)}"]`)) || visible(document.querySelector(`#axis .ftrack a.fzl[data-entry="${CSS.escape(id)}"]`))
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

// An entry's image is fetched only when its story is first opened: the pre-rendered <img> has no src (a <noscript> copy
// serves readers without JavaScript). One rendition is chosen by the browser from srcset. A failed load leaves the caption
// and the account standing, with one plain line.
function hydrate(art) {
  art.querySelectorAll('img.simg[data-src]').forEach(img => {
    const fig = img.closest('figure'), fail = fig && fig.querySelector('.imgfail');
    img.addEventListener('error', () => { img.hidden = true; if (fig) fig.classList.add('failed'); if (fail) fail.hidden = false; }, { once: true });
    img.sizes = img.dataset.sizes || ''; img.srcset = img.dataset.srcset || ''; img.src = img.dataset.src;
    img.removeAttribute('data-src'); img.removeAttribute('data-srcset'); img.removeAttribute('data-sizes');
  });
  // a sentence's source number opens the sources list and goes to that source: a button, no fragment, no history entry
  art.querySelectorAll('sup.cite[data-src]').forEach(sup => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cite'; b.dataset.src = sup.dataset.src; b.textContent = sup.textContent;
    b.setAttribute('aria-label', `Source ${sup.dataset.n} for this sentence`);
    b.addEventListener('click', () => { const li = $(b.dataset.src), box = li && li.closest('details'); if (!li) return; if (box) box.open = true; li.scrollIntoView({ block: 'nearest' }); li.focus({ preventScroll: true }); });
    sup.replaceWith(b);
  });
}
function show(id, x, reveal) {   // reveal: an explicit open brings the mark into the window; restoring a history entry never moves its saved window
  const art = entries.get(id); if (!art) return false;
  if (body.firstElementChild && body.firstElementChild !== art) home.appendChild(body.firstElementChild);
  body.appendChild(art);
  hydrate(art);
  art.querySelectorAll('section.xp').forEach(s => setX(s, false));
  const sec = xSection(id, x); if (sec && sec.classList.contains('xp')) setX(sec, true);
  detail.hidden = false; applyMode();
  body.scrollTop = 0;
  if (reveal !== false) revealMark(id);
  markSel(); paintNav(); refreshStat();
  return true;
}
function hide(focusEl) {
  const art = body.firstElementChild; if (art) home.appendChild(art);
  detail.hidden = true; document.body.classList.remove('dopen'); applyMode();   // inert and scroll lock removed before focus moves
  cur = null; wide = false; markSel(); paintNav();
  (focusEl || pageHeading()).focus();
  refreshStat();
}
const focusHeading = id => { const h = $(id + '-h'); if (h) h.focus(); };
// the visual half of closing, with no history call and no focus move (used by the "Changed in …" jump)
function closeVisual() {
  const art = body.firstElementChild; if (art) home.appendChild(art);
  detail.hidden = true; document.body.classList.remove('dopen'); applyMode();   // inert and scroll lock released
  cur = null; wide = false; markSel(); paintNav(); refreshStat();
}
function reveal(rec) { rec.scrollIntoView({ block: 'start' }); rec.focus({ preventScroll: true }); }

// "Changed in …" inside an entry -> its record under What changed. The jump gets its own history entry, so Back
// returns to the entry's own entry (still in history) and reopens it.
document.addEventListener('click', ev => {
  const a = ev.target.closest('a[data-change]'); if (!a || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  const rec = $(a.dataset.change); if (!rec) return;   // no such record: the plain link is left to the browser
  ev.preventDefault();
  const from = cur && !detail.hidden ? cur.k : null;
  if (from !== null && isPhone()) closeVisual();
  // the jump's own history entry carries its return target: the entry it left and the link that was used
  put({ change: a.dataset.change, k: ++seq, p: keyOf(at), from: from !== null ? { entryK: from, link: a.id } : null }, '#' + a.dataset.change);
  reveal(rec);
});

// open from a card control (title or shortcut)
document.addEventListener('click', ev => {
  const a = ev.target.closest('a[data-entry]'); if (!a || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  ev.preventDefault();
  const id = a.dataset.entry, x = a.dataset.x || null, opener = a.dataset.opener || 'title';
  if (cur && !detail.hidden && history.state && history.state.entry === cur.id) {
    // already open: switching title/shortcut UPDATES the open history entry (no new entry), keeps its key and
    // direct flag; focus on close then returns to this, the most recently used card control
    switchEntry(id, x, opener, a);
    focusHeading(id);
    return;
  }
  const k = ++seq;
  openers.set(k, a);
  put({ entry: id, x, opener, oid: a.id || null, k, p: keyOf(at) }, '#' + id);
  cur = { id, x, k, direct: false };
  if (show(id, x)) focusHeading(id);
});
// the open panel shows another entry: its history entry is UPDATED (never a new one); a = the control used, if it should take focus on close
function switchEntry(id, x, opener, a) {
  if (a) openers.set(cur.k, a); else openers.delete(cur.k);
  swap({ entry: id, x, opener, oid: (a && a.id) || null, direct: cur.direct, k: cur.k, p: (history.state && history.state.p) || 0 }, '#' + id);
  cur = { id, x, k: cur.k, direct: cur.direct };
  show(id, x);
}

// explicit Close (✕, handle, Esc)
function userClose() {
  if (!cur) return;
  if (!cur.direct && history.state && history.state.entry === cur.id) { history.back(); return; }   // popstate closes and restores focus
  const id = cur.id, k = cur.k;
  swap(null, location.pathname + location.search);   // clears the fragment
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
  const st = ev.state, left = at;                         // left = the state of the entry we came from
  at = st || null;
  clearTimeout(saveT); pending = false;                   // a pending save belongs to the entry we left (its window is in winMem), never to this one
  restoreWin(st);                                         // each history entry restores its own window
  if (st && st.change) {                                  // onto a "Changed in …" jump
    const rec = $(st.change); if (!rec) return;
    if (left && left.entry && left.p === st.k) {          // Back from an entry that was opened FROM this record: close it, focus its opener
      const o = visible(openers.get(left.k)) || visible(left.oid ? $(left.oid) : null);
      hide(o || rec); if (!o) reveal(rec);
    } else {                                              // Forward into the jump (or arriving from further away)
      if (cur && isPhone()) closeVisual();
      reveal(rec);
    }
    return;
  }
  if (st && st.entry && entries.has(st.entry)) {          // Forward (or Back onto an open state): reopen with the stored expander
    cur = { id: st.entry, x: st.x || null, k: st.k, direct: !!st.direct };
    show(st.entry, st.x, !validWin(st.win));   // a saved window wins: the story may be open with its mark outside it
    const l = left && left.change && left.from && left.from.entryK === st.k ? $(left.from.link) : null;   // Back from a jump: the link THAT jump stored
    if (l) {   // focus again after the browser's own fragment handling, which can drop it (as in focusSoon)
      l.focus(); setTimeout(() => { if (cur && cur.k === st.k && !detail.hidden && document.activeElement !== l) l.focus(); }, 0);
    } else focusHeading(st.entry);
    return;
  }
  const leaving = cur;
  if (leaving) hide((visible(openers.get(leaving.k)) ? openers.get(leaving.k) : null) || backTarget(leaving.id));
  if (!st || (!st.entry && !st.change)) fromHash(false);   // a hand-typed or followed entry fragment on this page
});

addEventListener('resize', () => { if (!detail.hidden) applyMode(); });
const keyOf = st => (st && st.k) || 0;
// a plain fragment link (#changes, #dated, …) adds a history entry without pushState: keep `at` on the entry we are really on
addEventListener('hashchange', () => { at = history.state || null; });

// direct link (page loaded at #e-…; also the no-JS section anchors #e-…-conv / #e-…-debate, folded into the one fragment)
// focus again after the browser's own fragment handling (page load or a same-page fragment), which can drop an earlier focus()
const focusSoon = id => {
  const again = () => setTimeout(() => { if (cur && cur.id === id) focusHeading(id); }, 0);
  focusHeading(id);
  if (document.readyState === 'complete') again(); else addEventListener('load', again, { once: true });
};
function direct(id, x) {
  const k = ++seq;
  swap({ entry: id, x, opener: null, direct: true, k, p: 0 }, '#' + id);
  cur = { id, x, k, direct: true };
  if (show(id, x)) focusSoon(id);
}
function fromHash(onLoad) {
  const h = location.hash.slice(1); if (!h) return;
  const st = history.state;
  if (onLoad && st && st.entry && entries.has(st.entry) && h === st.entry) {   // reload of an opened state: opener memory is gone
    cur = { id: st.entry, x: st.x || null, k: st.k, direct: !!st.direct };
    if (show(st.entry, st.x, false)) focusSoon(st.entry); return;   // reload: the stored window is applied when the catalogue arrives (initView)
  }
  if (entries.has(h)) return direct(h, null);
  const m = h.match(/^(.*)-(conv|debate)$/);
  if (m && entries.has(m[1])) return direct(m[1], m[2]);
}
// ---------- deep-time explorer (build proposal rev 1.1 §1–§4; TIMELINE-TRAVEL-PROPOSAL rev 2.1 §3)
const LABELS2 = {
  extinction_interval_approx: 'Approximate extinction interval',
  boundary_age_bound: 'Boundary age: no older than',
  boundary_age_range_modelled: 'Modelled boundary-age range',
  extinction_onset_estimate: 'Estimated extinction onset',
  extinction_horizon_approx: 'Approximate age of the extinction level in the rock record',
  dated_event_age: 'Impact age',
  extinction_placement_tied: 'Extinction placed at the dated impact (synchrony evidence cited)',
  chart_boundary: 'ICS chart boundary (v2026-06)',
  context: 'Context',
};
const LANE_IDS = ['earth-life', 'extinctions', 'relatives', 'history'];
const WHEN = { interval: ['from_ma', 'to_ma'], bound: ['ma'], interval_modelled: ['from_ma', 'to_ma', 'mid_ma'], measured: ['ma', 'pm'],
  approx_point: ['ma'], point: ['ma'], tied: [], boundary_age: ['ma'],
  limit: ['ref_ma', 'ref_pm', 'sigma'], calibrated: ['from_ma', 'to_ma', 'probability', 'datum_ce', 'c14_bp', 'c14_pm'] };
// schema 4: dated finds on the "Humans and human relatives" lane (TIMELINE-HUMAN-RELATIVES-BUILD-PROPOSAL rev 1; GPT 24 Nov 2026).
// One entry is one find or deposit with exactly one axis claim. Nothing joins two finds. The generator carries the same tables.
const FIND_AXIS = { find_context_bracket: 'interval', find_older_than_dated_layer: 'limit', find_direct_date_calibrated: 'calibrated' };
const FIND_LABELS = { find_context_bracket: 'Age bracket of the deposit or layer', find_older_than_dated_layer: 'Older than a dated layer above it',
  find_direct_date_calibrated: 'Direct radiocarbon date, calibrated', dated_material: 'What was dated',
  find_association: 'How the date relates to the find', reported_by: 'Reported by' };
const FIND_BASIS = { anatomy: 'by its anatomy', proteins: 'by its proteins', mitochondrial_dna: 'by its mitochondrial DNA' };
const FIND_UNITS = { ka: 1000, kyr: 1000, 'ka cal BP': 1000 };   // the source's unit -> how many of it make one Ma
const FIND_MAX = 4;             // one sub-row each; a fifth find is refused, not clustered
const FIND_NOTE = 'Marks and ranges show dates or age limits assigned to particular finds or deposits. They do not show how long a group lived. Overlap in date does not establish shared place or contact.';
const MIN_SPAN_FINDS = 0.05;    // Ma: the narrowest window on a page that has finds. Provisional until measured (build proposal §5)
const RECENT = 0.4;             // Ma: the "Last 400,000 years" view
const KA_BELOW = 2;             // Ma: on a page that has finds, a window narrower than this is ticked in thousands of years
const COARSE_ABOVE = 2;         // Ma: in a wider window the finds are not resolved; the lane shows one short explanation and a zoom button instead of its rows (GPT)
const CLUSTER_PX = 16;          // marks closer than this share one cluster control
const CLUSTER_MAX = 32;         // a run of close marks is cut into controls no wider than this, so a dense view is many short lists, not one long one
const TRUE_PX = 4;              // an extent at least this wide is drawn at its true endpoints
let MIN_SPAN = 1;               // Ma: the narrowest window (MIN_SPAN_FINDS on a page that has finds). A provisional interface choice, not a statement about any source's precision
const DRAG_PX = 5;              // a press that moves further than this is a drag, and its release never opens a story
const PAD = 0.15;               // "Zoom to these": room left each side of the cluster's members
const PAN_STEP = 0.25, ZOOM_STEP = 2;
const LABEL_ROWS = 3, LABEL_GAP = 8;
const wrap = $('axis-wrap'), axis = $('axis'), axisOff = $('axis-off');
const axisState = { state: 'pending', reason: null, view: null, wheel: false };
window.TL_AXIS = axisState;     // read-only test/console aid

const isNum = v => typeof v === 'number' && isFinite(v);
// The page says which catalogue schema it was built for (no attribute = schema 2, as released). A catalogue of any other
// schema is refused, so a schema-3 catalogue never draws on a schema-2 page and the reverse (STORY proposal rev 2.1 §4).
// absent attribute = the released schema 2; "3" = schema 3; any other value is not a schema this script knows, and no catalogue matches it
const schemaAttr = wrap ? wrap.dataset.catalogueSchema : undefined;
const pageSchema = schemaAttr === undefined ? 2 : schemaAttr === '3' ? 3 : schemaAttr === '4' ? 4 : NaN;
const STORY_LABELS = { cause_account: 'Attributed account of the cause', disagreement: 'Attributed finding that qualifies or differs' };
const IMAGE_KINDS = ['photograph', 'measured_image'], IMAGE_BYTES_MAX = 300000;
const MEDIA = { 'image/jpeg': /\.jpe?g$/i, 'image/png': /\.png$/i, 'image/webp': /\.webp$/i };
// schema 3: structure only. Ids exist, are unique and resolve; fields are present and well formed; the page carries what
// the catalogue describes. Whether a passage supports a sentence is the reviewer's matrix, not a check a script can make.
function storyBad(e) {
  const str = v => typeof v === 'string' && v.trim() !== '', idre = /^[a-z][a-z0-9-]*$/;
  const cids = e.claims.map((k, n) => k.id || 'c' + n);
  if (cids.some(k => !idre.test(k)) || new Set(cids).size !== cids.length) return 'claim ids';
  if (e.claims.some(k => (k.claim_type in STORY_LABELS) && !(k.id && k.source && k.locator))) return 'account claim';
  if (e.claims.some((k, n) => !$(`${e.id}-${cids[n]}`))) return 'claim not on the page';
  const st = e.story;
  if (st == null) return e.claims.some(k => k.claim_type in STORY_LABELS) ? 'account without story' : null;
  const evs = st.evidence, ops = st.opening;
  if (!Array.isArray(evs) || !Array.isArray(ops) || !ops.length || !str(st.heading)) return 'story shape';
  const ids = [...cids, ...evs.map(v => v && v.id), ...ops.map(o => o && o.id)];
  if (ids.some(k => typeof k !== 'string' || !idre.test(k)) || new Set(ids).size !== ids.length) return 'story ids';
  const known = new Set([...cids, ...evs.map(v => v.id)]);
  for (const v of evs) {
    if (v.type === 'passage') { if (!v.source || !str(v.source.citation) || !str(v.locator)) return 'evidence ' + v.id; }
    else if (v.type === 'collection_record') { if (!str(v.institution) || !str(v.record) || !str(v.url) || v.url.indexOf('https://') !== 0) return 'evidence ' + v.id; }
    else return 'evidence type ' + v.id;
  }
  for (const o of ops) {
    if (!str(o.text) || (o.kind !== 'evidence' && o.kind !== 'structural') || !Array.isArray(o.supports) || o.supports.some(k => !known.has(k))) return 'sentence ' + o.id;
    if (o.kind === 'evidence' && !o.supports.length) return 'unsupported sentence ' + o.id;
    const el = $(`${e.id}-${o.id}`); if (!el || el.textContent !== o.text) return 'sentence not on the page ' + o.id;
  }
  const rv = st.reviewed;
  if (!rv || typeof rv.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rv.date) || !str(rv.scope) || !$(e.id + '-srev')) return 'story review';
  const im = st.image, fig = $(e.id + '-fig');
  if (im == null) return fig ? 'image on the page, none in the catalogue' : null;
  if (IMAGE_KINDS.indexOf(im.kind) < 0) return 'image kind';
  if (['alt', 'caption', 'creator', 'credit', 'licence', 'licence_url', 'source_page'].some(k => !str(im[k]))) return 'image fields';
  if (!Array.isArray(im.supports) || !im.supports.length || im.supports.some(k => !known.has(k))) return 'image support';
  const rs = im.renditions; if (!Array.isArray(rs) || !rs.length) return 'image renditions';
  let total = 0;
  for (const r of rs) {
    if (!r || typeof r.file !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(r.file) || r.file.indexOf('..') >= 0) return 'image file';
    if (!(r.media_type in MEDIA) || !MEDIA[r.media_type].test(r.file)) return 'image media type';
    if (typeof r.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(r.sha256) || !Number.isInteger(r.bytes) || r.bytes <= 0) return 'image record';
    if (!Array.isArray(r.pixels) || r.pixels.length !== 2 || r.pixels.some(v => !Number.isInteger(v) || v <= 0) || !str(r.modification)) return 'image record';
    total += r.bytes;
  }
  if (total > IMAGE_BYTES_MAX) return 'image bytes';
  const img = $(e.id + '-img');
  if (!fig || !img || fig.dataset.kind !== im.kind || img.alt !== im.alt) return 'image not on the page';
  const want = rs.map(r => `assets/timeline/${c_rev}/${r.file}`).sort().join();
  const have = (img.dataset.srcset || img.getAttribute('srcset') || '').split(',').map(x => x.trim().split(' ')[0]).sort().join();
  if (want !== have) return 'image files not the ones on the page';
  return null;
}
// schema 4: every find, checked for meaning and not only for presence. Mirrors check_finds in the generator.
function findsBad(c) {
  const str = v => typeof v === 'string' && v.trim() !== '', O = c.chart.overview.ma;
  const finds = c.entries.filter(e => e.lane === 'relatives');
  if (!finds.length) return 'no find';
  if (finds.length > FIND_MAX) return 'too many finds';
  if (!str(c.axis_convention) || c.find_note !== FIND_NOTE) return 'find note';
  const note = $('finds-note'); if (!note || note.textContent !== FIND_NOTE) return 'find note not on the page';
  for (const e of finds) {
    const f = e.find, at = e.attributed_to, ln = e.links, bad = why => 'find ' + e.id + ': ' + why;
    if (!/^f-[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id) || e.story) return bad('id');
    if (!f || !str(f.site) || !str(f.where) || !str(f.context) || (f.specimen != null && !str(f.specimen))) return bad('find');
    if (!ln || !/^Q[1-9]\d*$/.test(String(ln.group)) || !/^Q[1-9]\d*$/.test(String(ln.site)) || Object.keys(ln).length !== 2) return bad('links');
    if (str(f.specimen) && (/^Q\d+$/.test(f.specimen) || f.specimen === ln.group || f.specimen === ln.site)) return bad('specimen id');
    if (!at || !str(at.name) || !(at.basis in FIND_BASIS) || (at.qualified != null && !str(at.qualified))) return bad('attribution');
    const want = `Attributed to ${at.name} ${FIND_BASIS[at.basis]}.` + (at.qualified ? ' ' + at.qualified : ''), el = $(e.id + '-attr');
    if (!el || el.textContent !== want) return bad('attribution not on the page');
    const ax = e.claims.filter(k => k.axis);
    if (ax.length !== 1 || !(ax[0].claim_type in FIND_AXIS)) return bad('axis claim');
    if (e.claims.some(k => !(k.claim_type in FIND_LABELS) && k.claim_type !== 'context')) return bad('claim type');
    if (e.claims.some(k => !str(k.id) || !str(k.text) || ((k.claim_type in FIND_LABELS) && !(k.source && str(k.locator))))) return bad('claim record');
    for (const need of ['dated_material', 'find_association']) if (e.claims.filter(k => k.claim_type === need).length !== 1) return bad(need);
    const a = ax[0], w = a.when, sv = a.source_values;
    if (!w || w.type !== FIND_AXIS[a.claim_type]) return bad('date kind');
    if (!str(a.source_notation) || !str(a.source_units) || !str(a.confidence) || !str(a.when_text)) return bad('source notation');
    if (!(a.source_units in FIND_UNITS) || !sv || sv.unit !== a.source_units) return bad('source units');
    const per = FIND_UNITS[a.source_units], same = (ma, v) => isNum(v) && Math.abs(ma * per - v) < 1e-9;
    if (w.type === 'interval' || w.type === 'calibrated') {
      if (!isNum(w.from_ma) || !isNum(w.to_ma) || !(O >= w.from_ma && w.from_ma > w.to_ma && w.to_ma >= 0)) return bad('bracket ends');
      if (!same(w.from_ma, sv.from) || !same(w.to_ma, sv.to)) return bad('stored ages differ from the source values');
    }
    if (w.type === 'interval' && Object.keys(w).length !== 3) return bad('bracket fields');
    if (w.type === 'calibrated') {
      if (w.datum_ce !== 1950 || a.source_units !== 'ka cal BP' || w.curve !== 'IntCal20') return bad('calibration');
      if (!isNum(w.probability) || !(w.probability > 0 && w.probability <= 100)) return bad('probability');
      if (!str(w.lab_id) || !isNum(w.c14_bp) || !isNum(w.c14_pm) || !(w.c14_bp > 0 && w.c14_pm > 0)) return bad('laboratory measurement');
      if (a.source_notation.replace(/ /g, '').indexOf(w.probability + '%') < 0) return bad('probability is not the source notation\'s');
    }
    if (w.type === 'limit') {
      if (Object.keys(w).length !== 5 || w.side !== 'older' || (w.sigma !== 1 && w.sigma !== 2)) return bad('limit');
      if (!isNum(w.ref_ma) || !isNum(w.ref_pm) || !(w.ref_pm > 0) || !(O >= w.ref_ma + w.ref_pm && w.ref_ma - w.ref_pm >= 0)) return bad('limit reference');
      if (!same(w.ref_ma, sv.ref) || !same(w.ref_pm, sv.pm)) return bad('stored ages differ from the source values');
    }
    // one selected published result: the stored numbers are the notation's own, at its precision, and the claim's words and its
    // date line give the same numbers (GPT, rehearsal review Q5; the generator also checks the result id against the evidence record)
    if (!/^C\d+\.r\d+$/.test(String(a.result))) return bad('selected result');
    if (notationBad(a.source_notation, w, sv)) return bad('source notation and stored values disagree');
    const y6 = v => Math.round(v * 1e6).toLocaleString('en-US'), say = w.type === 'limit' ? [y6(w.ref_ma), y6(w.ref_pm)] : [y6(w.from_ma), y6(w.to_ma)];
    if (say.some(y => a.text.indexOf(y) < 0 || a.when_text.indexOf(y) < 0)) return bad('the claim does not give the stored numbers');
  }
  return null;
}
function notationBad(n, w, sv) {   // mirror of the generator's notation_bad
  const m = /\((\d+(?:\.\d+)?)\s*%\)/.exec(n), rest = m ? n.slice(0, m.index) + n.slice(m.index + m[0].length) : n, nums = (rest.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (w.type === 'limit') return m || nums.length !== 2 || rest.indexOf('±') < 0 || nums[0] !== sv.ref || nums[1] !== sv.pm;
  if (nums.length !== 2) return true;
  const a = nums.slice().sort((x, y) => x - y), b = [sv.from, sv.to].sort((x, y) => x - y);
  if (a[0] !== b[0] || a[1] !== b[1]) return true;
  if (w.type === 'calibrated') return !m || Number(m[1]) !== w.probability;
  return !!m;
}
let c_rev = '';
function validate(c) {
  if (!c || c.catalogue !== 'timeline' || c.schema !== pageSchema) return 'catalogue identity';
  const LABELS = pageSchema >= 3 ? Object.assign({}, LABELS2, STORY_LABELS, pageSchema === 4 ? FIND_LABELS : {}) : LABELS2;
  c_rev = c.catalogue_revision;
  if (c.catalogue_revision !== wrap.dataset.catalogueRev) return 'revision';
  const ch = c.chart;
  if (!ch || !ch.window || !isNum(ch.window.ma) || !ch.overview || !isNum(ch.overview.ma) || ch.overview.ma <= ch.window.ma) return 'chart bounds';
  if (!Array.isArray(ch.periods) || !ch.periods.length || ch.periods.some(p => !p.begin || !isNum(p.begin.ma) || !p.end || !isNum(p.end.ma))) return 'chart periods';
  if (!Array.isArray(c.lanes) || c.lanes.map(l => l.id).join() !== LANE_IDS.join()) return 'lanes';
  if (!c.claim_labels || Object.keys(LABELS).some(k => c.claim_labels[k] !== LABELS[k]) || Object.keys(c.claim_labels).length !== Object.keys(LABELS).length) return 'claim labels';
  if (!Array.isArray(c.entries) || !c.entries.length) return 'entries';
  for (const e of c.entries) {
    if (!entries.has(e.id) || !(e.lane === 'extinctions' || (pageSchema === 4 && e.lane === 'relatives')) || !Array.isArray(e.claims)) return 'entry ' + e.id;
    for (const k of e.claims) {
      if (!k || !(k.claim_type in LABELS) || k.label !== LABELS[k.claim_type]) return 'claim type ' + e.id;
      if (e.lane === 'extinctions' && ((k.claim_type in FIND_LABELS) || (k.when && (k.when.type === 'limit' || k.when.type === 'calibrated')))) return 'find claim on the extinctions lane ' + e.id;
      if (k.axis) {
        if (!k.when || !(k.when.type in WHEN) || WHEN[k.when.type].some(f => !isNum(k.when[f]))) return 'claim time ' + e.id;
        for (const f of ['ma', 'from_ma', 'to_ma', 'mid_ma']) if (f in k.when && (k.when[f] < 0 || k.when[f] > ch.window.ma)) return 'outside window ' + e.id;
      }
    }
    if (!e.claims.some(k => k.axis)) return 'no axis claim ' + e.id;
  }
  if (!Array.isArray(c.shelf) || c.shelf.some(x => x.axis !== false)) return 'shelf';
  // schema 2: the release, each entry's own review date, and the change records
  const rel = c.release, isDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + 'T00:00:00Z'));
  if (!rel || rel.revision !== c.catalogue_revision || !isDate(rel.release_date)) return 'release';
  if (!Array.isArray(c.releases) || !c.releases.length || c.releases[c.releases.length - 1].revision !== rel.revision
    || c.releases.some(r => !r || typeof r.revision !== 'string' || !isDate(r.release_date) || r.release_date > rel.release_date)) return 'releases';
  const all = [...c.entries, ...c.shelf];
  for (const e of all) {
    if (!entries.has(e.id)) return 'entry ' + e.id;
    if (!e.evidence_reviewed || !isDate(e.evidence_reviewed.date) || e.evidence_reviewed.date > rel.release_date) return 'evidence reviewed ' + e.id;
    if (!Array.isArray(e.revisions)) return 'revisions ' + e.id;
  }
  if (!Array.isArray(c.changes)) return 'changes';
  const known = new Set(c.releases.map(r => r.revision)), seen = new Set();
  for (const ch of c.changes) {
    if (!ch || typeof ch.id !== 'string' || seen.has(ch.id) || !known.has(ch.revision) || ch.id.indexOf(ch.revision + '-') !== 0) return 'change id';
    seen.add(ch.id);
    if (ch.kind !== 'added' && ch.kind !== 'revised') return 'change kind ' + ch.id;
    if (!Array.isArray(ch.entries) || !ch.entries.length || ch.entries.some(i => !entries.has(i))) return 'change entry ' + ch.id;
    if (!$('change-' + ch.id)) return 'change not on the page ' + ch.id;        // the pre-rendered record this catalogue describes
  }
  if (all.some(e => e.revisions.some(r => !seen.has(r)))) return 'unknown revision';
  if (pageSchema >= 3) for (const e of c.entries) { const bad = storyBad(e); if (bad) return 'story ' + e.id + ': ' + bad; }
  else if (c.entries.some(e => e.story || e.claims.some(k => k.id))) return 'story fields in schema 2';
  if (pageSchema === 4) { const bad = findsBad(c); if (bad) return bad; }
  return null;
}

// one mark per entry: its position and glyph follow the entry's axis claims (§2). ext = the extent the catalogue states
// for it (an approximate interval, a modelled range, a stated ± margin); each kind keeps its own drawing and label.
// a find's mark: its one axis claim. A bracket and a calibrated range keep their two ends; a limit keeps its dated layer's age
// and that layer's own ±, and has no older end at all. key = the finite age its sub-row is ordered by (never the unknown side)
function findMark(e) {
  const k = e.claims.find(q => q.axis), w = k.when, lim_ = w.type === 'limit';
  const ext = lim_ ? { from: w.ref_ma + w.ref_pm, to: w.ref_ma - w.ref_pm } : { from: w.from_ma, to: w.to_ma };
  return { id: e.id, title: e.title, short: e.short, lane: 'relatives', kind: w.type, ma: lim_ ? w.ref_ma : (w.from_ma + w.to_ma) / 2, ext,
    key: lim_ ? w.ref_ma : w.from_ma, shape: lim_ ? 'f-limit' : w.type === 'calibrated' ? 'f-cal' : 'f-bracket',
    cap: (lim_ ? 'older than a dated layer above it; ' : k.label.charAt(0).toLowerCase() + k.label.slice(1) + ': ') + k.when_text,
    label: `${e.title}. Attributed to ${e.attributed_to.name}. ${k.label}: ${k.when_text}.` };
}
function markOf(e) {
  if (e.lane === 'relatives') return findMark(e);
  const ax = e.claims.filter(k => k.axis), by = t => ax.find(k => k.claim_type === t);
  const desc = ax.filter(k => k.claim_type !== 'extinction_placement_tied').map(k => `${k.label}${k.label.endsWith('than') ? '' : ':'} ${k.when_text}`);
  const tied = by('extinction_placement_tied');
  if (tied) desc.push(tied.label);
  let ma, shape, ext = null;
  if (by('extinction_interval_approx')) { const w = by('extinction_interval_approx').when; ma = (w.from_ma + w.to_ma) / 2; ext = { from: w.from_ma, to: w.to_ma }; shape = 'int-approx'; }
  else if (by('boundary_age_range_modelled')) { const w = by('boundary_age_range_modelled').when; ma = w.mid_ma; ext = { from: w.from_ma, to: w.to_ma }; shape = 'modelled'; }   // one mark at the modelled range; the bound is in the panel (GPT, rev 2)
  else if (by('boundary_age_bound')) { ma = by('boundary_age_bound').when.ma; shape = 'bound'; }
  else if (by('extinction_onset_estimate')) { const w = by('extinction_onset_estimate').when; ma = w.ma; if (isNum(w.pm) && w.pm > 0) ext = { from: w.ma + w.pm, to: w.ma - w.pm }; shape = 'measured'; }
  else if (by('extinction_horizon_approx')) { ma = by('extinction_horizon_approx').when.ma; shape = 'approx'; }
  else if (by('dated_event_age')) { ma = by('dated_event_age').when.ma; shape = 'point' + (tied ? ' tied' : ''); }
  else { const w = ax[0].when; ma = w.ma != null ? w.ma : w.mid_ma; shape = 'point'; }
  if (ext && !(ext.from > ext.to)) ext = null;
  return { id: e.id, title: e.title, short: e.short, lane: 'extinctions', ma, ext, shape, label: `${e.title}. ${desc.join('. ')}.` };
}

let CAT = null, MARKS = [], MAIN = [], FINDS = [];   // MAIN: the marks that share the first lane's track; FINDS: one sub-row each
let lim = null;                 // { O: the whole span, W: the landing window's older edge } in Ma
let view = null;                // { a, b } in Ma, a older than b: the window on screen
let laneW = 1;
let periodsOpen = false, wheelOn = false, wide = false;
let saveT = 0;
let E = null;                   // the explorer's own elements (built once; only their contents are redrawn)
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const r6 = v => Math.round(v * 1e6) / 1e6;

// ----- the window: validation, clamping, history
const validWin = w => !!lim && Array.isArray(w) && w.length === 2 && isNum(w[0]) && isNum(w[1])
  && w[1] >= 0 && w[0] <= lim.O && w[0] - w[1] >= MIN_SPAN - 1e-9;
function clampWin(a, b) {
  const s = Math.min(Math.max(a - b, MIN_SPAN), lim.O);
  const o = Math.min(Math.max(a, s), lim.O);
  return { a: r6(o), b: r6(o - s) };
}
const withWin = st => view ? { ...(st || {}), win: [view.a, view.b] } : st;
// the window is merged into the state of the history entry we are on; nothing else in that state is touched. A state
// with no key gets one, so the newest window of every entry can also be held in page memory (winMem): wheel and key
// input save 200 ms later, and a Back or Forward inside that interval must still find the window it left.
const winMem = new Map();
let pending = false;            // a deferred save is waiting
function saveWin() {
  clearTimeout(saveT); pending = false;
  if (!view) return;
  const st = history.state;
  if (st && st.k && Array.isArray(st.win) && st.win[0] === view.a && st.win[1] === view.b) return;
  const k = (st && st.k) || ++seq;
  winMem.set(k, [view.a, view.b]);
  try { history.replaceState({ ...(st || {}), k, win: [view.a, view.b] }, '', location.href); at = history.state; } catch (err) { /* a browser's replaceState rate limit: the next save carries the window */ }
}
const saveSoon = () => { clearTimeout(saveT); const k = history.state && history.state.k; if (!k) return saveWin(); winMem.set(k, [view.a, view.b]); pending = true; saveT = setTimeout(saveWin, 200); };
function setView(a, b, save) {
  if (!lim || !isNum(a) || !isNum(b)) return false;
  const v = clampWin(a, b);
  if (view && v.a === view.a && v.b === view.b) return false;
  view = v;
  if (E) render();
  if (save === 'soon') saveSoon(); else if (save !== false) saveWin();
  return true;
}
// arriving on a history entry: its newest window (page memory if it is ahead of the stored state), written back at once
function restoreWin(st) {
  if (!view || !st) return;
  const m = st.k ? winMem.get(st.k) : null, w = validWin(m) ? m : validWin(st.win) ? st.win : null;
  if (!w) return;
  setView(w[0], w[1], false);
  if (!Array.isArray(st.win) || st.win[0] !== view.a || st.win[1] !== view.b) saveWin();
}
// a reload or leaving inside the deferred-save interval: beforeunload is the one a reload honours; pagehide covers the rest
const saveNow = () => { if (pending) saveWin(); };
addEventListener('beforeunload', saveNow);
addEventListener('pagehide', saveNow);
const zoomAt = (f, at_, save) => { const s = view.a - view.b, s2 = Math.min(Math.max(s * f, MIN_SPAN), lim.O), a = at_ + (view.a - at_) * (s2 / s); return setView(a, a - s2, save); };
const pan = (d, save) => setView(view.a + d, view.b + d, save);
const landing = () => ({ a: lim.W, b: 0 });
function initView() {
  const st = history.state;
  view = st && validWin(st.win) ? clampWin(st.win[0], st.win[1]) : landing();
  // a direct link with no stored window: the landing window if its mark is inside, otherwise the whole span
  if (cur && !(st && validWin(st.win))) { const m = MARKS.find(x => x.id === cur.id);
    if (m && m.lane === 'relatives') view = findWin(m, RECENT);   // a find: the recent view if it is inside, else a window framed on its finite extent
    else if (m && (m.ma > view.a || m.ma < view.b)) view = { a: lim.O, b: 0 }; }
}

// a window for a find: span s if its finite extent fits there from today, else centred on that extent with room each side.
// A limit contributes its dated layer's age ± only; its unknown older side never widens or moves the window
function findWin(m, s) {
  const e = m.ext, need = (e.from - e.to) * (1 + 2 * PAD);
  if (e.from <= s && need <= s) return clampWin(s, 0);
  const s2 = Math.max(s, need), mid = (e.from + e.to) / 2;
  return clampWin(mid + s2 / 2, mid - s2 / 2);
}
// ----- geometry of one mark in a window a–b (null = not drawn)
function geomAt(m, a, b) {
  const s = a - b, px = v => (a - v) / s * laneW;
  const e = m.ext;
  if (e && (e.from - e.to) / s * laneW >= TRUE_PX && e.from > b && e.to < a) {   // wide enough and intersecting: drawn at its true ends, clipped to the window
    const f = Math.min(e.from, a), t = Math.max(e.to, b);
    return { m, x: (px(f) + px(t)) / 2, w: Math.max(px(t) - px(f), 2), tw: true, clipL: e.from > a, clipR: e.to < b };
  }
  if (m.ma > a || m.ma < b) return null;
  return { m, x: px(m.ma), w: 0, tw: false, clipL: false, clipR: false };
}
const geom = m => geomAt(m, view.a, view.b);
const inView = m => !!view && !!geom(m);
// what a window would show: marks in order, and the controls they share. Clusters: neighbours closer than CLUSTER_PX share
// one control, cut at CLUSTER_MAX; positions are never moved to make room. The same rule serves the screen and "Zoom to these"
function groupsAt(a, b) {
  const gs = MAIN.map(m => geomAt(m, a, b)).filter(Boolean).sort((x, y) => x.x - y.x || (x.m.id < y.m.id ? -1 : 1)), groups = [];
  for (const g of gs) { const last = groups[groups.length - 1]; if (last && g.x - last.x1 < CLUSTER_PX && g.x - last.x0 < CLUSTER_MAX) { last.items.push(g); last.x1 = g.x; } else groups.push({ x0: g.x, x1: g.x, items: [g] }); }
  return { gs, groups };
}
// "Zoom to these": the window that frames a cluster's members, offered only if in THAT window, under the same rule, every
// member stands alone. Members at one age, or too close for the narrowest window, never qualify; their list stays the control
function zoomTarget(items) {
  const ages = items.map(x => x.m.ma), hi = Math.max(...ages), lo = Math.min(...ages), sep = hi - lo;
  if (!(sep > 0)) return null;
  const s = Math.max(sep * (1 + 2 * PAD), MIN_SPAN), tgt = clampWin((hi + lo) / 2 + s / 2, (hi + lo) / 2 - s / 2);
  if (tgt.a === view.a && tgt.b === view.b) return null;
  const ids = new Set(items.map(x => x.m.id)), alone = groupsAt(tgt.a, tgt.b).groups.filter(q => q.items.length === 1 && ids.has(q.items[0].m.id)).length;
  return alone === ids.size ? tgt : null;
}

const fmt = (v, s) => String(+v.toFixed(s >= 100 ? 1 : s >= 10 ? 2 : 3));
const TICK_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
const KA_STEPS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1];   // Ma: 1,000 to 1,000,000 years

function build() {
  const c = CAT;
  lim = { O: c.chart.overview.ma, W: c.chart.window.ma };
  MARKS = c.entries.map(markOf).sort((x, y) => y.ma - x.ma || (x.id < y.id ? -1 : 1));
  MAIN = MARKS.filter(m => m.lane !== 'relatives');
  FINDS = MARKS.filter(m => m.lane === 'relatives').sort((x, y) => y.key - x.key || (x.id < y.id ? -1 : 1));
  MIN_SPAN = FINDS.length ? MIN_SPAN_FINDS : 1;
  const edge = x => `${x.approximate ? '~' : ''}${x.ma_text || x.ma}${x.margin != null ? ' ± ' + (x.margin_text || x.margin) : ''}`;   // as the chart writes them
  const periods = `<div class="plist"><button type="button" id="periods-btn" aria-expanded="${periodsOpen}" aria-controls="periods-list">Periods on the chart (${c.chart.periods.length})</button>`
    + `<ul id="periods-list"${periodsOpen ? '' : ' hidden'}>${c.chart.periods.map(p => `<li><i style="background:${esc(p.colour)}" aria-hidden="true"></i>${esc(p.name)} <span class="pc">(${esc(p.code)})</span> · ${edge(p.begin)} to ${edge(p.end)} Ma</li>`).join('')}</ul></div>`;
  const key = [['measured', 'dated, uncertainty stated'], ['point', 'dated, uncertainty not stated'], ['point mk-tied', 'placed at a dated event'], ['approx', 'approximate'],
    ['int-approx', 'approximate interval'], ['modelled', 'modelled range']]
    .map(([k, t]) => `<span class="mk mk-${k}" aria-hidden="true"><span class="g"></span></span>${t}`).join(' · ');
  const act = c.lanes.filter(l => l.status === 'active'), rest = c.lanes.filter(l => l.status !== 'active');
  const lane = l => l.status === 'active'
    ? (l.id === 'relatives'
      ? `<div class="lr act fl" role="group" aria-label="${esc(l.label)} (${FINDS.length} finds)"><span class="ln">${esc(l.label)}</span><p class="fnote">${esc(c.find_note)}</p><div class="ftrack"></div></div>`
      : `<div class="lr act" role="group" aria-label="${esc(l.label)} (${MAIN.length} entries)"><span class="ln">${esc(l.label)}</span><div class="track"></div></div>`)
    : `<div class="lr empty"><span class="ln">${esc(l.label)}</span> · <span class="ls">${esc(l.status)}</span></div>`;
  // coverage plans: lanes with nothing on the axis yet, in the catalogue's own words. Plain text: not controls, no Tab stop
  const plans = `<span class="plans">Not on the timeline yet: ${rest.filter(l => l.id === 'relatives' || l.id === 'history').map(l => `${esc(l.label)} (${esc(l.status.charAt(0).toLowerCase() + l.status.slice(1))})`).join(' · ')}</span>`;
  axis.innerHTML =
    `<div class="tbar" role="group" aria-label="Move through time">`
    + `<button type="button" data-act="older">◀ Older</button><button type="button" data-act="newer">Newer ▶</button>`
    + `<button type="button" data-act="in">＋ Zoom in</button><button type="button" data-act="out">− Zoom out</button>`
    + `<span class="presets" role="group" aria-label="Scale"><button type="button" data-preset="earth" aria-pressed="false">Whole Earth</button>`
    + `<button type="button" data-preset="complex" aria-pressed="false">Complex life</button>`
    + (FINDS.length ? `<button type="button" data-preset="recent" aria-pressed="false">Last 400,000 years</button>` : '') + `</span>`
    + `<button type="button" data-act="reset">Reset view</button><a class="tlist" href="#dated">List</a>${plans}</div>`
    + `<div class="ov" aria-label="Overview: Earth's whole span, ${lim.O} million years ago to today. The marked part is the window shown below.">`
    + `<span class="ovl">Overview</span><div class="ovbar"><span class="ovms" aria-hidden="true">${MARKS.map(m => `<i style="left:${((lim.O - m.ma) / lim.O * 100).toFixed(3)}%"></i>`).join('')}</span><span class="ovwin"></span></div>`
    + `<span class="ove"><span>${lim.O} Ma</span><span>today</span></span></div>`
    + `<p class="win" id="tl-win"></p>`
    + `<div class="xpl${FINDS.length ? ' hasf' : ''}" id="xpl" tabindex="0" role="group" aria-label="Time explorer" aria-describedby="tl-win tl-whint">`
    + `<div class="bands" aria-hidden="true"></div>` + act.map(lane).join('') + `<div class="scale" aria-hidden="true"></div></div>`
    + `<p class="whint" id="tl-whint"></p><p class="sr" id="tl-xstat" role="status"></p>`
    + periods
    + `<div class="empties">${rest.map(lane).join('')}</div>`
    + `<p class="key">Key: ${key}. A bar or whisker drawn to scale shows the stated range; ‹ or › means it continues beyond this view. Lines in the period bar: ICS chart boundaries.`
    + (FINDS.length ? ` Finds: a capped bar is the age bracket of a deposit or layer; a filled bar or diamond is a direct calibrated date; an upright tick with an open ‹ is a find older than a dated layer, and the dashed band around the tick is that layer's own ±, not the find's age.` : '') + `</p>`;
  E = { xpl: $('xpl'), bands: axis.querySelector('.bands'), track: axis.querySelector('.track'), ftrack: axis.querySelector('.ftrack'), scale: axis.querySelector('.scale'),
    win: $('tl-win'), hint: $('tl-whint'), stat: $('tl-xstat'), ovwin: axis.querySelector('.ovwin') };
  wireExplorer();
  setWheel(false);
}

// redraw the window's contents. Bands, ticks, marks and clusters all come from the same { a, b } and the same measured width
function render() {
  const c = CAT, { a, b } = view, s = a - b;
  laneW = Math.max(1, E.track.clientWidth);
  const px = v => (a - v) / s * laneW, pc = x => (x / laneW * 100).toFixed(3);
  // remember which entry had focus inside the redrawn part
  const dyn = el => !!el && (E.track.contains(el) || (!!E.ftrack && E.ftrack.contains(el)));
  const actEl = document.activeElement, inDyn = dyn(actEl);
  const had = inDyn ? (actEl.dataset.entry || ((actEl.closest('.cl') || { dataset: {} }).dataset.has || '').split(' ')[0] || null) : null;

  const { gs, groups } = groupsAt(a, b);
  const sel = id => !!cur && !detail.hidden && cur.id === id;
  const mk = (g, inCluster) => {
    const m = g.m, drawn = !inCluster && g.tw;
    const cont = drawn && (g.clipL || g.clipR) ? ` Continues beyond this view on ${g.clipL && g.clipR ? 'both sides' : g.clipL ? 'the older side' : 'the newer side'}.` : '';
    return `<a class="mk mk-${m.shape.replace(/ /g, ' mk-')}${drawn ? ' mk-true' : ''}${drawn && g.clipL ? ' clipl' : ''}${drawn && g.clipR ? ' clipr' : ''}${sel(m.id) ? ' sel' : ''}" href="#${esc(m.id)}" data-entry="${esc(m.id)}" data-opener="mark"`
      + (sel(m.id) ? ' aria-current="true"' : '')
      + (inCluster ? '' : ` data-px="${g.x.toFixed(2)}" style="left:${pc(g.x)}%${drawn ? `;--w:${g.w.toFixed(2)}px` : ''}"`) + ` aria-label="${esc(m.label + cont)}"><span class="gw" aria-hidden="true"><span class="g"></span></span>`
      + (inCluster ? `<span class="cn">${esc(m.title)}</span>` : `<span class="ml" aria-hidden="true"><span class="mlf">${esc(m.title)}</span><span class="mls">${esc(m.short)}</span></span>`) + `</a>`;
  };
  const cluster = (g, i) => {
    const tgt = zoomTarget(g.items);
    const zoom = tgt ? `<li class="clz"><button type="button" data-zoomto="${tgt.a},${tgt.b}">Zoom to these</button></li>` : '';
    return `<div class="cl" data-has="${esc(g.items.map(x => x.m.id).join(' '))}" style="left:${pc((g.items[0].x + g.items[g.items.length - 1].x) / 2)}%">`
      + `<button type="button" aria-expanded="false" aria-controls="cl-${i}" aria-label="${g.items.length} entries close together: ${esc(g.items.map(x => x.m.title).join(', '))}">${g.items.length}</button>`
      + `<ul id="cl-${i}" hidden>${g.items.map(x => `<li>${mk(x, true)}</li>`).join('')}${zoom}</ul></div>`;
  };
  E.track.innerHTML = gs.length
    ? groups.map((g, i) => g.items.length === 1 ? mk(g.items[0], false) : cluster(g, i)).join('')
    : `<p class="nomk">${FINDS.length ? 'No entries on this lane in this range.' : 'No reviewed entries in this range.'} <button type="button" data-act="nearest">Go to the nearest entries</button></p>`;
  // finds: one sub-row each, in a fixed order, each with its own caption in words. Nothing is drawn between two finds. A limit's
  // band is its dated layer's ±; its open ‹ has a fixed length in pixels and no older end. A find outside the window says so
  // wider than COARSE_ABOVE the finds are not resolved: no row is drawn and no mark is shifted to stay in view. The lane says so,
  // offers the 400,000-year view and keeps one link per find, which opens its entry (and so brings its finite reference into view)
  const coarse = FINDS.length > 0 && s > COARSE_ABOVE + 1e-9;
  if (E.ftrack) E.ftrack.classList.toggle('coarse', coarse);
  if (E.ftrack && coarse) E.ftrack.innerHTML = `<div class="fcz"><p class="fczt">Not resolved at this scale. These finds are drawn, one row each, in a window of 2 million years or less.</p>`
    + `<p class="fczl"><button type="button" class="fzb" data-find-recent>Show the last 400,000 years</button> <span class="fzo">Open a find:</span> `
    + FINDS.map(m => `<a class="fzl${sel(m.id) ? ' sel' : ''}" href="#${esc(m.id)}" data-entry="${esc(m.id)}" data-opener="find-list"${sel(m.id) ? ' aria-current="true"' : ''}>${esc(m.short)}</a>`).join(' · ') + `</p></div>`;
  else if (E.ftrack) E.ftrack.innerHTML = FINDS.map(m => {
    const g = geomAt(m, a, b), lim_ = m.kind === 'limit';
    let link = '', offv = '';
    if (g) {
      const drawn = g.tw, cont = drawn && (g.clipL || g.clipR) ? ` Continues beyond this view on ${g.clipL && g.clipR ? 'both sides' : g.clipL ? 'the older side' : 'the newer side'}.` : '';
      const tick = lim_ && m.ma <= a && m.ma >= b ? `<i class="ftk" style="--tx:${(px(m.ma) - g.x).toFixed(2)}px"></i>` : '';
      const chev = lim_ && !(drawn && g.clipL) ? `<i class="fch"></i>` : '';
      link = `<a class="mk fmk mk-${m.shape}${drawn ? ' mk-true' : ''}${drawn && g.clipL ? ' clipl' : ''}${drawn && g.clipR ? ' clipr' : ''}${sel(m.id) ? ' sel' : ''}" href="#${esc(m.id)}" data-entry="${esc(m.id)}" data-opener="mark"`
        + (sel(m.id) ? ' aria-current="true"' : '') + ` data-px="${g.x.toFixed(2)}" style="left:${pc(g.x)}%;--w:${(drawn ? g.w : 0).toFixed(2)}px" aria-label="${esc(m.label + cont)}">`
        + `<span class="gw" aria-hidden="true"><span class="g"></span>${tick}${chev}</span></a>`;
    } else {
      const older = m.ma > a;
      offv = `<span class="foff">${lim_ ? (older ? 'Its dated layer is older than this view.' : 'Its dated layer is newer than this view; the find is older than that layer, by an unknown amount.') : (older ? 'Older than this view.' : 'Newer than this view.')}</span>`
        + ` <button type="button" class="fgo" data-find-go="${esc(m.id)}" aria-label="Bring ${esc(m.short)} into view">Bring into view</button>`;
    }
    return `<div class="frow" data-find="${esc(m.id)}"><p class="fcap"><span class="ft">${esc(m.short)}</span> · ${esc(m.cap)}${offv ? ' ' + offv : ''}</p><div class="fline">${link}</div></div>`;
  }).join('');

  // period bands to scale, clipped to the window; older than the chart's first band the release has none, and says so
  const bands = c.chart.periods.filter(p => p.begin.ma > b && p.end.ma < a).map(p => { const l = px(Math.min(p.begin.ma, a)), r = px(Math.max(p.end.ma, b));
    return `<span class="band" style="left:${pc(l)}%;width:${pc(r - l)}%;--c:${esc(p.colour)}"><i></i><b data-c="${esc(p.code)}">${esc(p.name)}</b></span>`; }).join('');
  const none = a > lim.W ? `<span class="noband" style="left:0;width:${pc(px(lim.W))}%"><b>No period bands in this release</b></span>` : '';
  const cbs = c.entries.map(e => e.claims.find(k => k.claim_type === 'chart_boundary')).filter(k => k && k.when.ma <= a && k.when.ma >= b)
    .map(k => `<span class="cb" style="left:${pc(px(k.when.ma))}%" title="${esc(k.label + ': ' + k.when_text)}"></span>`).join('');
  E.bands.innerHTML = none + bands + cbs;

  // on a page that has finds, a window narrower than KA_BELOW is ticked in thousands of years, with finer steps; the stored
  // coordinates stay in Ma. The unit is written once, under the scale, and the sentence above the explorer says the same
  const ka = FINDS.length > 0 && s < KA_BELOW, yrs = v => Math.round(v * 1e6).toLocaleString('en-US');
  const step = (ka ? KA_STEPS : TICK_STEPS).find(t => s / t <= Math.max(2, Math.floor(laneW / (ka ? 90 : 80)))) || 1000, dec = step < 1 ? 1 : 0;
  const ticks = [];
  for (let k = Math.ceil(b / step - 1e-9); k * step <= a + 1e-9; k++) { const t = k * step, x = px(t);
    ticks.push(`<span class="tk" data-x="${x.toFixed(2)}" style="left:${pc(x)}%">${ka ? (Math.round(t * 1000) + 0).toLocaleString('en-US') : t.toFixed(dec)}${ticks.length || ka ? '' : '<span class="unit"> Ma</span>'}</span>`); }   // the unit rides on the newest tick
  E.scale.innerHTML = ticks.join('') + (ka ? '<span class="tku">thousand years ago</span>' : '');
  E.scale.classList.toggle('ka', ka);
  // a label that would cross either end of the scale is aligned to start (or end) at its tick instead of centred on it; the tick line
  // stays at its coordinate and the text is inset from the explorer's border
  for (const el of E.scale.querySelectorAll('.tk')) { const x = +el.dataset.x, w = el.getBoundingClientRect().width;
    const first = x - w / 2 < 4, last = !first && x + w / 2 > laneW - 4; el.classList.toggle('first', first); el.classList.toggle('last', last); }

  fitBands(); layoutLabels();

  E.ovwin.style.left = ((lim.O - a) / lim.O * 100).toFixed(3) + '%';
  E.ovwin.style.width = (s / lim.O * 100).toFixed(3) + '%';
  E.win.textContent = (ka ? `Showing ${yrs(a)} to ${yrs(b)} years ago. Span ${yrs(s)} years. Older on the left.`
    : `Showing ${fmt(a, s)} to ${fmt(b, s)} Ma (million years ago). Span ${fmt(s, s)} million years. Older on the left.`)
    + (a > lim.W ? ` Older than ${c.chart.window.approximate ? '~' : ''}${c.chart.window.ma_text || lim.W} Ma this release has no period bands and no reviewed entries.` : '');
  const dis = (sel_, on) => axis.querySelector(sel_).setAttribute('aria-disabled', String(on));
  dis('[data-act="older"]', a >= lim.O); dis('[data-act="newer"]', b <= 0); dis('[data-act="in"]', s <= MIN_SPAN + 1e-9); dis('[data-act="out"]', s >= lim.O);
  axis.querySelector('[data-preset="earth"]').setAttribute('aria-pressed', String(a === lim.O && b === 0));
  axis.querySelector('[data-preset="complex"]').setAttribute('aria-pressed', String(a === lim.W && b === 0));
  const rec = axis.querySelector('[data-preset="recent"]'); if (rec) rec.setAttribute('aria-pressed', String(a === RECENT && b === 0));
  axisState.view = [a, b];

  if (inDyn) {   // the focused mark was replaced: its new control (mark or cluster), else the explorer itself, named in the status line
    const t = had ? backTarget(had) : null;
    if (t && dyn(t)) t.focus({ preventScroll: true });
    else { E.xpl.focus({ preventScroll: true }); lostId = had; }
  }
  paintNav(); refreshStat();
}
// the status line says a focused mark left the view only while that is so: it is cleared when the mark is back in the window
// or focus has moved off the explorer (another story, Reset, any other control)
let lostId = null;
function refreshStat() {
  if (!E) return;
  const m = lostId ? MARKS.find(x => x.id === lostId) : null;
  if (!m || inView(m) || document.activeElement !== E.xpl) lostId = null;
  const txt = lostId ? `${m.title} is outside this view.` : '';
  if (E.stat.textContent !== txt) E.stat.textContent = txt;
}
// a band shows its name where the name fits, else its code, else nothing (names and ages are always in the period list)
function fitBands() {
  let bs = [...E.bands.querySelectorAll('b')].filter(x => x.scrollWidth > x.clientWidth + 1);
  for (const x of bs) x.textContent = x.dataset.c || '';
  bs = bs.filter(x => x.scrollWidth > x.clientWidth + 1);
  for (const x of bs) x.textContent = '';
}
// titles sit under their marks on up to LABEL_ROWS rows, joined by a plain leader. A label may move sideways and down;
// the mark never moves. Where the full title cannot be placed the short code is tried; hover or focus shows the full title
function layoutLabels() {
  const info = [...E.track.querySelectorAll(':scope > a.mk')].map(el => ({ el, x: parseFloat(el.dataset.px),
    wf: el.querySelector('.mlf').getBoundingClientRect().width, ws: el.querySelector('.mls').getBoundingClientRect().width }));
  const leftOf = (x, w) => Math.min(Math.max(x - w / 2, 0), Math.max(0, laneW - w));
  // one kind of label for the whole view: every full title if they all fit, otherwise every short code (those that fit)
  const place = key => { const right = new Array(LABEL_ROWS).fill(-1e9);
    return info.map(o => { const l = leftOf(o.x, o[key]), r = right.findIndex(v => l >= v + LABEL_GAP); if (r < 0) return null; right[r] = l + o[key]; return { r, dx: l + o[key] / 2 - o.x }; }); };
  let use = 'f', pos = place('wf');
  if (pos.some(p => !p)) { use = 's'; pos = place('ws'); }
  info.forEach((o, i) => {
    o.el.classList.add('lab-' + (pos[i] ? use : 'n'));
    o.el.style.setProperty('--r', String(pos[i] ? pos[i].r : 0));
    o.el.style.setProperty('--dx', (pos[i] ? pos[i].dx : 0).toFixed(1) + 'px');
    o.el.style.setProperty('--dxf', (leftOf(o.x, o.wf) + o.wf / 2 - o.x).toFixed(1) + 'px');
  });
}
function markSel() {
  if (!E) return;
  for (const el of axis.querySelectorAll('.track a.mk, .ftrack a.mk, .ftrack a.fzl')) { const on = !!cur && !detail.hidden && el.dataset.entry === cur.id;
    el.classList.toggle('sel', on); if (on) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); }
}
// an opened story's mark is brought into the window without changing the scale; an entry with no axis age changes nothing
function revealMark(id) {
  if (!view || !E) return;
  const m = MARKS.find(x => x.id === id), s = view.a - view.b;
  // a find in a window too wide to draw it (the compact lane) is brought into a drawn view: the recent view if it is inside, else its finite extent
  if (m && m.lane === 'relatives' && s > COARSE_ABOVE + 1e-9) { const w = findWin(m, RECENT); setView(w.a, w.b); return; }
  if (!m || inView(m)) return;
  if (m.lane === 'relatives') { const w = findWin(m, s); setView(w.a, w.b); return; }
  setView(m.ma + s / 2, m.ma - s / 2);
}
function setWheel(on) {
  wheelOn = on; axisState.wheel = on;
  E.xpl.classList.toggle('wheel', on);
  E.hint.textContent = on ? 'Wheel zoom is on while the pointer is over the timeline. Press Esc, or click or Tab somewhere else, to turn it off.'
    : 'Drag to move. Click the timeline, or press Enter on it, to zoom with the mouse wheel; arrow keys move and + or − zoom while it has focus.';
}
function doAct(act, save) {   // save 'soon' for input that can repeat quickly (a held key)
  const s = view.a - view.b, mid = (view.a + view.b) / 2;
  if (act === 'older') pan(s * PAN_STEP, save);
  else if (act === 'newer') pan(-s * PAN_STEP, save);
  else if (act === 'in') zoomAt(1 / ZOOM_STEP, mid, save);
  else if (act === 'out') zoomAt(ZOOM_STEP, mid, save);
  else if (act === 'reset') setView(lim.W, 0);
  else if (act === 'nearest') { const m = MARKS.slice().sort((x, y) => Math.abs(x.ma - mid) - Math.abs(y.ma - mid))[0]; if (m) setView(m.ma + s / 2, m.ma - s / 2); }
}

function wireExplorer() {
  const xpl = E.xpl;
  let drag = null, suppress = false, raf = 0, want = null;
  const flush = () => { raf = 0; if (want) { const w = want; want = null; setView(w[0], w[1], w[2]); } };
  const later = (a, b, save) => { want = [a, b, save]; if (!raf) raf = requestAnimationFrame(flush); };
  const endDrag = moved => { if (!drag) return; drag = null; xpl.classList.remove('dragging'); if (raf) { cancelAnimationFrame(raf); flush(); } if (moved) saveWin(); };
  xpl.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    if (ev.target.closest('.cl ul, .nomk')) return;                     // an open list and the empty-range message are not drag handles
    drag = { id: ev.pointerId, x: ev.clientX, a: view.a, b: view.b, moved: false };
  });
  xpl.addEventListener('pointermove', ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    const dx = ev.clientX - drag.x;
    if (!drag.moved) { if (Math.abs(dx) <= DRAG_PX) return; drag.moved = true; suppress = true; xpl.classList.add('dragging'); try { xpl.setPointerCapture(drag.id); } catch (err) { /* capture is a convenience only */ } }
    const d = dx / laneW * (drag.a - drag.b);                           // dragging right brings older time into view
    later(drag.a + d, drag.b + d, false);
  });
  const up = ev => { if (!drag || ev.pointerId !== drag.id) return; const moved = drag.moved; endDrag(moved); if (moved) setTimeout(() => { suppress = false; }, 0); };
  xpl.addEventListener('pointerup', up);
  xpl.addEventListener('pointercancel', up);
  xpl.addEventListener('lostpointercapture', ev => { if (ev.target === xpl) up(ev); });   // a touch's implicit capture on the pressed child ends when the explorer takes it: that is not the end of the drag
  xpl.addEventListener('dragstart', ev => ev.preventDefault());       // a mark is a link: its native drag would cancel the pan
  xpl.addEventListener('pointerleave', ev => { if (drag && !drag.moved && ev.pointerId === drag.id) drag = null; });
  addEventListener('pointerup', ev => { if (drag && !drag.moved && ev.pointerId === drag.id) drag = null; });
  // the click that ends a drag opens nothing; a plain click on the timeline itself (not on a mark or control) turns wheel zoom on
  xpl.addEventListener('click', ev => {
    if (suppress) { suppress = false; ev.preventDefault(); ev.stopPropagation(); return; }
    if (!ev.target.closest('a, button')) setWheel(true);
  }, true);
  xpl.addEventListener('wheel', ev => {
    if (!wheelOn) return;                                               // not activated: the page scrolls as usual
    if (!xpl.contains(document.activeElement)) { setWheel(false); return; }   // focus is no longer here (and no focusout was delivered, e.g. the window was in the background): released, the page scrolls
    ev.preventDefault();
    const k = ev.deltaMode === 1 ? 16 : 1, r = E.track.getBoundingClientRect(), s = view.a - view.b;
    if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) pan(-ev.deltaX * k / laneW * s, 'soon');
    else zoomAt(Math.exp(ev.deltaY * k * 0.002), view.a - Math.min(Math.max(ev.clientX - r.left, 0), laneW) / laneW * s, 'soon');
  }, { passive: false });
  xpl.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && wheelOn) { ev.preventDefault(); ev.stopPropagation(); setWheel(false); return; }   // releases the wheel and does nothing else
    if (ev.target !== xpl || ev.metaKey || ev.ctrlKey || ev.altKey) return;   // marks and buttons keep their own native keys
    const act = { ArrowLeft: 'older', ArrowRight: 'newer', '+': 'in', '=': 'in', '-': 'out', '−': 'out' }[ev.key];
    if (ev.key === 'Enter') { ev.preventDefault(); setWheel(!wheelOn); }
    else if (act) { ev.preventDefault(); doAct(act, 'soon'); }
  });
  // wheel zoom follows keyboard focus, not the pointer: it ends when focus leaves the explorer. A pointer that merely moves away
  // changes nothing (the wheel then scrolls whatever it is over, and zooms again when it comes back)
  xpl.addEventListener('focusout', ev => { if (wheelOn && !xpl.contains(ev.relatedTarget)) setWheel(false); if (ev.relatedTarget !== xpl) { lostId = null; refreshStat(); } });
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { if (axisState.state === 'on' && view && Math.abs(E.track.clientWidth - laneW) >= 1) render(); }).observe(axis);
  else addEventListener('resize', () => { if (axisState.state === 'on' && view) render(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (axisState.state === 'on' && view) render(); });
}
// toolbar, presets, cluster control and period list: each is one native control with one action; Esc closes a cluster
axis.addEventListener('click', ev => {
  const t = ev.target;
  const ab = t.closest('[data-act]'); if (ab) { if (ab.getAttribute('aria-disabled') !== 'true') doAct(ab.dataset.act); return; }
  const pb0 = t.closest('[data-preset]'); if (pb0) { if (pb0.dataset.preset === 'earth') setView(lim.O, 0); else if (pb0.dataset.preset === 'recent') setView(RECENT, 0); else setView(lim.W, 0); return; }
  const fr = t.closest('[data-find-recent]'); if (fr) { setView(RECENT, 0); const el = axis.querySelector('.ftrack a.mk'); if (el) el.focus({ preventScroll: true }); return; }
  const fg = t.closest('[data-find-go]'); if (fg) { const m = FINDS.find(x => x.id === fg.dataset.findGo); if (m) { const w = findWin(m, view.a - view.b); setView(w.a, w.b);
    const el = axis.querySelector(`.ftrack a.mk[data-entry="${CSS.escape(m.id)}"]`); if (el) el.focus({ preventScroll: true }); } return; }
  const zb = t.closest('[data-zoomto]'); if (zb) { const [a, b] = zb.dataset.zoomto.split(',').map(Number); setView(a, b); return; }
  const pb = t.closest('#periods-btn');
  if (pb) { periodsOpen = pb.getAttribute('aria-expanded') !== 'true'; pb.setAttribute('aria-expanded', String(periodsOpen)); $('periods-list').hidden = !periodsOpen; return; }
  const b = t.closest('.cl > button'); if (!b) return;
  const on = b.getAttribute('aria-expanded') !== 'true', ul = $(b.getAttribute('aria-controls'));
  b.setAttribute('aria-expanded', String(on)); ul.hidden = !on;
  if (on) {   // the list stays inside the explorer's width
    ul.style.marginLeft = '0px';
    const r = ul.getBoundingClientRect(), x = E.xpl.getBoundingClientRect();
    ul.style.marginLeft = (r.left < x.left ? x.left - r.left : r.right > x.right ? x.right - r.right : 0) + 'px';
    const first = ul.querySelector('a'); if (first) first.focus();
  }
});
axis.addEventListener('keydown', ev => {
  if (ev.key !== 'Escape') return;
  const cl = ev.target.closest('.cl'); if (!cl || !detail.hidden) return;
  const b = cl.querySelector('button'); b.setAttribute('aria-expanded', 'false'); cl.querySelector('ul').hidden = true; b.focus();
});

// ----- older / newer plotted entry, inside an open story. The order is where the marks are plotted (ties by id): it is
// navigation on this view, not a statement that one event is proven to come before another
function navScope() {
  if (axisState.state !== 'on' || !cur || !view || !MARKS.some(m => m.id === cur.id)) return null;
  return wide ? MARKS : MARKS.filter(m => m.id === cur.id || inView(m));
}
function paintNav() {
  const nav = $('d-nav'); if (!nav) return;
  const l = navScope();
  if (!l || detail.hidden) { nav.hidden = true; return; }
  nav.hidden = false;
  const i = l.findIndex(m => m.id === cur.id), older = l[i - 1] || null, newer = l[i + 1] || null;
  const set = (id, m) => { const b = $(id); b.setAttribute('aria-disabled', String(!m)); b.dataset.go = m ? m.id : ''; };
  set('d-older', older); set('d-newer', newer);
  const more = !wide && l.length < MARKS.length;
  $('d-navmsg').textContent = older && newer ? '' : `No ${!older && !newer ? 'other' : !older ? 'older' : 'newer'} plotted entries ${wide || l.length === MARKS.length ? 'on the timeline' : 'in this view'}.`;
  $('d-wide').hidden = !(more && (!older || !newer));
}
detail.addEventListener('click', ev => {
  const b = ev.target.closest('#d-older, #d-newer, #d-wide'); if (!b || !cur) return;
  if (b.id === 'd-wide') { wide = true; paintNav(); ($('d-older').dataset.go ? $('d-older') : $('d-newer')).focus(); return; }
  const id = b.dataset.go; if (!id || b.getAttribute('aria-disabled') === 'true' || !entries.has(id)) return;
  switchEntry(id, null, 'nav', null);
  const m = MARKS.find(x => x.id === id); $('d-pos').textContent = m ? `Now showing: ${m.title}` : '';
  (b.getAttribute('aria-disabled') === 'true' ? ($('d-older').dataset.go ? $('d-older') : $('d-newer')) : b).focus();
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
    const r = await fetch(HUB + '/catalogue/timeline/' + encodeURIComponent(wrap.dataset.catalogueRev || ''), { cache: 'no-store', signal: ctl.signal });   // its OWN revision (hub ≥ 0.6.4)
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
  let styled = true;
  try {
    axis.hidden = false; wrap.classList.add('on'); build();
    styled = getComputedStyle(E.xpl).touchAction === 'pan-y';   // this build's stylesheet is the one in force (a rule only it has)
    if (styled) { initView(); render(); }
  } catch (err) { styled = null; }
  if (!styled) { CAT = null; view = null; E = null; wrap.classList.remove('on'); return off(styled === null ? 'draw' : 'stylesheet'); }   // page, script and stylesheet from different builds: the list stays the only view
  axisOff.hidden = true;
  axisState.state = 'on'; axisState.reason = null;
  paintNav();
}
loadAxis();

fromHash(true);
})();
