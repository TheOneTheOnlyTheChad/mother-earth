/* Mother Earth — Animals page (animals-zebra-preview-rc; ANIMALS-PROPOSAL rev 2.2 §3, §7).
 * Each study card is filled from the same manifest the globe uses, after the same checksum tests (the pinned journey list, then
 * each manifest against the list), so the page and the globe cannot disagree. A card whose manifest cannot be verified says so
 * and shows no figure.
 * Conservation and population are fixed "Not available yet" states: no source has been reviewed, and nothing stands in for
 * them. A count of tagged animals is labelled as a sample size.
 * This file fetches the journey list and one manifest per card: details for the cards, never a journey's coordinates. The globe is
 * animals-globe.js and the replay is animals-journey.js (animals-tab-rc, stage 1; stage 2 adds the bird's card). It does not load app.js. */
(() => {
  const $ = id => document.getElementById(id);
  const A = { CATALOG: 'assets/animals/journeys-R1.catalog.json', CATALOG_SHA256: '5eb789b10488b68cb5e471309ebc517199b1dbce00e5ac719d84f3b4b42c5452', BASE: 'assets/animals/',
    UNVERIFIED: 'Study details could not be verified. No figure is shown.', FAILED: 'Study details could not be loaded. No figure is shown.' };
  // header clock (UTC) and menu, as on the other pages
  const p2 = n => String(n).padStart(2, '0'), clock = $('clock');
  const tickClock = () => { const d = new Date(); if (clock) clock.firstChild.textContent = `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`; };
  tickClock(); setInterval(tickClock, 1000);
  (() => { const btn = $('menu-btn'), list = $('menu-list'); if (!btn || !list) return; const items = [...list.querySelectorAll('a')];
    items.forEach(a => { if (a.dataset.page === 'animals') a.setAttribute('aria-current', 'page'); });
    const open = o => { list.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); if (o) items[0].focus(); };
    btn.addEventListener('click', e => { e.stopPropagation(); open(!list.classList.contains('open')); });
    btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); open(true); } });
    list.addEventListener('keydown', e => { const i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { open(false); btn.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); } });
    document.addEventListener('click', e => { if (!list.contains(e.target)) open(false); }); })();
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const utc = s => { const d = new Date(s * 1000); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} UTC`; };
  const hex = async buf => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
  const n = x => Number(x).toLocaleString('en-GB');
  const cards = [...document.querySelectorAll('.an-study[data-journey]')];
  const F = (card, f) => card.querySelector(`[data-f="${f}"]`);
  const set = (card, f, text) => { F(card, f).textContent = text; };
  const link = (card, f, href, text) => { const a = document.createElement('a'); a.href = href; a.textContent = text; a.rel = 'noopener'; a.target = '_blank'; const e = F(card, f); e.textContent = ''; e.append(a); return e; };
  const hideRow = (card, f) => { F(card, f).closest('tr').hidden = true; };
  /** one study card from its verified manifest */
  function render(card, m, j) {
    set(card, 'title', m.title); set(card, 'place', m.place); set(card, 'species', m.taxon_detail_as_recorded ? `${m.species_as_recorded} (taxon detail as recorded: ${m.taxon_detail_as_recorded})` : m.species_as_recorded); set(card, 'method', m.method);
    set(card, 'animals', m.sample_sentence || `${m.animals_sampled} animals were tracked in this study. This is a sample size, not a population estimate.`);
    set(card, 'period', Number.isInteger(j.record_first_s)                                          // a journey with withheld fixes: the recording period and the displayed fixes are stated apart
      ? `Recording: ${utc(j.record_first_s)} to ${utc(j.record_last_s)}; the replay covers all of it. First displayed fix ${utc(j.first_fix_s)}. Last displayed fix ${utc(j.last_fix_s)}.`
      : `First recorded fix shown ${utc(j.first_fix_s)}. Last recorded fix shown ${utc(j.last_fix_s)}: the replay ends there.`);
    set(card, 'times', m.time_convention);
    if (m.card) {                                                                                  // Argos journeys
      set(card, 'shown', (m.label_line ? m.label_line + ' ' : '') + m.card.shown); set(card, 'notdrawn', m.card.done + (m.withholding ? ' ' + m.withholding.statement : '')); set(card, 'unc', `${m.accuracy_note} ${m.card.not_route}`);
      if (m.card.tagging) set(card, 'place', `${m.place}. ${m.card.tagging}`);
      set(card, 'rule', `${m.card.line} ${m.gap_rule.statement}`); set(card, 'simp', m.card.changes);
      if (m.land_data) set(card, 'land', `${m.land_data.source}. Mother Earth's land test finds land in that map at that scale only; coast detail it lacks is not detected.`); else hideRow(card, 'land');
    } else {
      set(card, 'shown', `${m.animals_shown} animal: ${j.animal}, ${n(j.fixes)} recorded fixes.`);
      set(card, 'notdrawn', `For this animal: ${n(j.rows_without_position)} fix attempts without a position and ${n(j.rows_flagged_by_source)} fixes flagged by the source. In the whole study: ${n(m.study_totals.rows_without_position)} and ${n(m.study_totals.rows_flagged_outlier)}.`);
      set(card, 'unc', `Location uncertainty: ${m.location_uncertainty}.`);
      set(card, 'rule', `The line joins recorded fixes. The path between fixes was not recorded. ${m.gap_rule.statement} Gaps longer than the rule for this animal: ${n(j.gaps_over_rule)}.`);
      set(card, 'simp', m.simplification.charAt(0).toUpperCase() + m.simplification.slice(1) + '.'); hideRow(card, 'land');
    }
    link(card, 'doi', m.dataset_url, m.dataset_doi ? `${m.repository}, doi:${m.dataset_doi}` : `${m.repository}, ${m.dataset_id}`);
    link(card, 'lic', m.licence_url, m.licence).append(m.card ? '' : ' (as stated on the repository record)');
    set(card, 'cite', m.citation_as_given + (m.citation_note ? ' — ' + m.citation_note : '')); set(card, 'paper', m.paper_citation_as_given);
    F(card, 'facts').hidden = false; set(card, 'state', 'Study file verified against its checksum.');
  }
  async function fill() {
    const all = t => cards.forEach(c => set(c, 'state', t));
    let cat; try { const r = await fetch(A.CATALOG, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); const buf = await r.arrayBuffer();
      if (await hex(buf) !== A.CATALOG_SHA256) return all(A.UNVERIFIED); cat = JSON.parse(new TextDecoder().decode(buf)); } catch (_) { return all(A.FAILED); }
    await Promise.all(cards.map(async card => {
      const e = (cat.journeys || []).find(x => x.id === card.dataset.journey); if (!e) return set(card, 'state', A.UNVERIFIED);
      let buf; try { const r = await fetch(A.BASE + e.manifest, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); buf = await r.arrayBuffer(); } catch (_) { return set(card, 'state', A.FAILED); }
      try { if (await hex(buf) !== e.manifest_sha256) throw 0; const m = JSON.parse(new TextDecoder().decode(buf)), j = m.journeys.find(x => x.animal === e.animal); if (!j) throw 0; render(card, m, j); } catch (_) { F(card, 'facts').hidden = true; set(card, 'state', A.UNVERIFIED); }
    }));
  }
  fill();
  (window.ME = window.ME || {}).animalsPage = { A };
})();
