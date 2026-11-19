/* Mother Earth — Layers: one list of every map-layer switch, and the first-view line (bare-earth-rc; Bare Earth proposal rev 2).
 * The page starts with no data layer drawn. This file adds nothing to the globe and fetches nothing. It:
 *   - shows "Choose layers to explore." over the globe while no layer is on;
 *   - keeps a Layers button (with the number switched on) on the globe at every width;
 *   - opens a panel listing every map-layer switch in one place, grouped by the page's evidence labels.
 * Rules this file keeps:
 *   - A row in the panel is a remote control, never a second source of truth: it presses the layer's own switch on its card and
 *     shows that switch's state. Nothing here sets a layer's state directly.
 *   - Nothing is saved: the page starts bare each time (Chad, 17 Nov 2026).
 *   - "Switch everything off" presses every switch that is on; it changes nothing else.
 */
(() => {
  const $ = id => document.getElementById(id);
  const panel = $('layers-panel'), list = $('layers-list'), btn = $('layers-btn'), hint = $('bare-hint');
  if (!panel || !list || !btn) return;
  const GROUPS = [
    ['Observed', [['Earthquakes', '#tgl-usgs'], ['Fire detections', '#tgl-firms'], ['Ships', '#tgl-ships'], ['Forest disturbance', '#tgl-forest'], ['Drifting buoys', '#tgl-drifters'],
      ['Microplastic samples — dated', '#tgl-plastic'], ['Aircraft — count per area', '#tgl-air'], ['Aircraft — positions', '#tgl-airdots'], ['Night lights', '#tgl-nl'], ['Dust RGB imagery', '#tgl-dustrgb'], ['Animal journey — dated replay', '#tgl-journey']]],
    ['Analysed and modelled', [['Ocean heat', '#tgl-oh'], ['Wind by height', '#tgl-wind']]],
    ['Computed', [['Day/night', '#tgl-night'], ['Orbital objects — payloads', '#orb-tgls [data-g="payload"]'], ['Orbital objects — rocket bodies', '#orb-tgls [data-g="rocket_body"]'], ['Orbital objects — debris', '#orb-tgls [data-g="debris"]']]],
  ];
  const ROWS = GROUPS.flatMap(g => g[1]);
  const target = sel => document.querySelector(sel);
  const isOn = sel => { const t = target(sel); return !!t && t.getAttribute('aria-checked') === 'true'; };
  list.innerHTML = GROUPS.map(([g, rows]) => `<div class="lp-g">${g}</div>` + rows.map(([label, sel]) =>
    `<button class="ovl-tgl" type="button" role="switch" aria-checked="false" data-for="${sel.replace(/"/g, '&quot;')}"><span class="box" aria-hidden="true"></span><span class="t">${label}</span></button>`).join('')).join('');
  const rowEls = [...list.querySelectorAll('[data-for]')];
  let opener = null;
  function sync() {
    let n = 0;
    for (const r of rowEls) { const t = target(r.dataset.for), c = !!t && t.getAttribute('aria-checked') === 'true'; if (c) n++;
      if (r.getAttribute('aria-checked') !== String(c)) r.setAttribute('aria-checked', String(c));
      const dis = !t || t.disabled || t.getAttribute('aria-busy') === 'true';
      if (dis) r.setAttribute('aria-disabled', 'true'); else r.removeAttribute('aria-disabled'); }
    const word = n === 0 ? 'none on' : n + ' on';
    if ($('layers-n').textContent !== word) $('layers-n').textContent = word;
    if (hint && hint.hidden !== (n > 0)) hint.hidden = n > 0;
    return n;
  }
  list.addEventListener('click', e => { const r = e.target.closest('[data-for]'); if (!r) return; const t = target(r.dataset.for);
    if (!t || t.disabled || t.getAttribute('aria-busy') === 'true') return; t.click(); sync(); });
  function open(from) { opener = from || btn; panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); sync(); const f = rowEls[0]; if (f) f.focus(); }
  function close(refocus) { if (panel.hidden) return; panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (refocus && opener && opener.isConnected && !opener.hidden && opener.offsetParent !== null) opener.focus(); else if (refocus) btn.focus(); }
  btn.addEventListener('click', () => panel.hidden ? open(btn) : close(true));
  if ($('layers-open-hint')) $('layers-open-hint').addEventListener('click', () => open(btn));
  $('layers-close').addEventListener('click', () => close(true));
  $('layers-off').addEventListener('click', () => { for (const [, sel] of ROWS) { const t = target(sel); if (t && t.getAttribute('aria-checked') === 'true' && !t.disabled) t.click(); } sync(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); close(true); } }, true);
  // every switch on the page reports its own state through aria-checked; orbital rows are rebuilt by the page, so watch the tree too
  let queued = false; const later = () => { if (queued) return; queued = true; Promise.resolve().then(() => { queued = false; sync(); }); };
  new MutationObserver(later).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['aria-checked', 'aria-busy', 'disabled'], childList: true });
  sync();
  // read-only aids for tests and the console
  (window.ME = window.ME || {}).layers = { state: () => ({ open: !panel.hidden, on: ROWS.filter(([, s]) => isOn(s)).map(([l]) => l), n: sync(), hint: hint ? !hint.hidden : null, label: btn.textContent.trim(),
    rows: rowEls.map(r => [r.querySelector('.t').textContent, r.getAttribute('aria-checked'), r.getAttribute('aria-disabled') || null]) }), open: () => open(btn), close: () => close(false), rows: ROWS.map(r => r.slice()) };
})();
