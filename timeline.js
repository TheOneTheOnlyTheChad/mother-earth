/* Mother Earth — Timeline page enhancement (proposal rev 2, §5–§6).
 * The entries are already in the HTML (works with JavaScript off). This script only:
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
  hide(openers.get(k) || cardTitle(id));   // a card control used after a direct link, else the card title
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
  if (leaving) hide(openers.get(leaving.k) || cardTitle(leaving.id));
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
fromHash(true);
})();
