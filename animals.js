/* Mother Earth — Animals page (animals-zebra-preview-rc; ANIMALS-PROPOSAL rev 2.2 §3, §7). PRIVATE PREVIEW.
 * The study card is filled from the same manifest the globe uses, after the same checksum test, so the page and the globe
 * cannot disagree. If the manifest cannot be verified the card says so and shows no figure.
 * Conservation and population are fixed "Not available yet" states: no source has been reviewed, and nothing stands in for
 * them. A count of tagged animals is labelled as a sample size.
 * This file fetches one file (the manifest). It does not load the journey, the globe library or app.js. */
(() => {
  const $ = id => document.getElementById(id);
  const A = { MANIFEST: 'assets/animals/zebra-botswana-R1.manifest.json', MANIFEST_SHA256: 'f337cdd078f7210db25aa55788d5b7a6f6007840f3f62ceb17320bc4125373d0', ANIMAL: 'Z3866',
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
  const set = (id, text) => { $(id).textContent = text; };
  const link = (id, href, text) => { const a = document.createElement('a'); a.href = href; a.textContent = text; a.rel = 'noopener'; a.target = '_blank'; $(id).textContent = ''; $(id).append(a); return a; };
  async function fill() {
    let buf; try { const r = await fetch(A.MANIFEST, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); buf = await r.arrayBuffer(); } catch (_) { return set('an-state', A.FAILED); }
    const sha = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
    let m, j; try { if (sha !== A.MANIFEST_SHA256) throw 0; m = JSON.parse(new TextDecoder().decode(buf)); j = m.journeys.find(x => x.animal === A.ANIMAL); if (!j) throw 0; } catch (_) { return set('an-state', A.UNVERIFIED); }
    const n = x => Number(x).toLocaleString('en-GB');
    set('an-title', m.title); set('an-place', m.place); set('an-species', `${m.species_as_recorded} (taxon detail as recorded: ${m.taxon_detail_as_recorded})`); set('an-method', m.method);
    set('an-animals', `${m.animals_sampled} animals were tracked in this study. This is a sample size, not a population estimate.`);
    set('an-shown', `${m.animals_shown} animal: ${j.animal}, ${n(j.fixes)} recorded fixes.`);
    set('an-period', `First recorded fix ${utc(j.first_fix_s)}. Last recorded fix ${utc(j.last_fix_s)}: the tracking record ends there.`);
    set('an-notdrawn', `For this animal: ${n(j.rows_without_position)} fix attempts without a position and ${n(j.rows_flagged_by_source)} fixes flagged by the source. In the whole study: ${n(m.study_totals.rows_without_position)} and ${n(m.study_totals.rows_flagged_outlier)}.`);
    set('an-times', m.time_convention); set('an-unc', `Location uncertainty: ${m.location_uncertainty}.`);
    set('an-rule', `The line joins recorded fixes. The path between fixes was not recorded. ${m.gap_rule.statement} Gaps longer than the rule for this animal: ${n(j.gaps_over_rule)}.`);
    set('an-simp', m.simplification.charAt(0).toUpperCase() + m.simplification.slice(1) + '.');
    link('an-doi', m.dataset_url, `${m.repository}, doi:${m.dataset_doi}`); link('an-lic', m.licence_url, m.licence); $('an-lic').append(' (as stated on the repository record)');
    set('an-cite', m.citation_as_given); set('an-paper', m.paper_citation_as_given);
    set('an-sample', `${m.animals_sampled} animals were tracked in this study. This is a sample size, not a population estimate.`);
    $('an-facts').hidden = false; set('an-state', 'Study file verified against its checksum.');
  }
  fill();
  (window.ME = window.ME || {}).animalsPage = { A };
})();
