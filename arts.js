/* Mother Earth — Met catalogue sample card (Arts release proposal rev 2.1; D1 scoped card only).
 * Off on load: nothing is fetched until the switch is turned on. Nothing is drawn on the globe.
 * Reads only the hub's /snapshot/arts (a fixed catalogue snapshot). Byte-level integrity is the hub's job (it serves
 * the file only if the complete stored bytes match its pin); this page checks consistency: snapshot_id = the pinned
 * records hash, 479 records, per-country sums. Any failure → "unavailable — <reason>", never a zero or an empty list.
 * Dates shown are the source CSV date and the view's preparation date — never the time it was fetched.
 */
(() => {
  const ME = window.ME, $ = id => document.getElementById(id), esc = ME.esc;
  const EXPECT = { records: '067211d996b6f9a35bf50354a179f77fed076a0c14b98e9dc9c175b22c616cb2', objects: 479, countries: 25 };
  const LABELS = { potential_sacred_ritual_association: 'potential sacred/ritual association', potential_funerary_association: 'potential funerary association',
    potential_indigenous_source_community: 'potential Indigenous source community', potential_human_remains: 'potential human remains' };
  const st = { on: false, status: 'off', reason: null, file: null, token: 0 };

  function consistency(j) {
    if (!j || j.kind !== 'catalogue_snapshot' || j.layer !== 'arts' || !Array.isArray(j.records) || !j.counts) return 'invalid';
    if (j.snapshot_id !== EXPECT.records) return 'snapshot mismatch';
    if (j.records.length !== EXPECT.objects || j.counts.objects !== EXPECT.objects || j.counts.countries !== EXPECT.countries) return 'count mismatch';
    const by = {}; for (const r of j.records) { if (!Array.isArray(r.countries) || r.countries.length !== 1) return 'invalid'; by[r.countries[0]] = (by[r.countries[0]] || 0) + 1; }
    const bc = j.counts.by_country || [];
    if (bc.length !== EXPECT.countries || bc.some(([c, n]) => by[c] !== n) || bc.reduce((a, x) => a + x[1], 0) !== EXPECT.objects) return 'count mismatch';
    return null;
  }

  function objRow(r, sens) {
    const labs = r.tentative_labels.map(l => LABELS[l] || l);
    return `<li class="arts-o"><div class="arts-on"><b>${esc(r.object_name)}</b>${r.culture ? ' · ' + esc(r.culture) : ''} · ${esc(r.department)}</div>`
      + `<div class="arts-met">The Met: <span class="v">${esc(r.met_wording)}</span> — <span class="v">${esc(r.met_country)}</span></div>`
      + (labs.length ? `<div class="arts-lab">Tentative label${labs.length > 1 ? 's' : ''}: ${labs.map(esc).join('; ')}</div>` : '')
      + `<div class="arts-warn">Sensitivity not fully assessed${labs.length ? '' : ' — ' + esc(sens.unlabelled)}</div>`
      + `<a class="arts-link" href="${esc(r.link)}" target="_blank" rel="noopener">Met object page ${esc(r.object_id)} ↗</a></li>`;
  }

  function render(j) {
    const groups = {}; for (const r of j.records) (groups[r.countries[0]] = groups[r.countries[0]] || []).push(r);
    const sens = j.sensitivity || {};
    const name = c => (j.counts.heading_text || {})[c] || c;
    $('arts-list').innerHTML = `<div class="arts-sum">${j.counts.objects} objects · ${j.counts.countries} present-day countries — headed by the Met's own country text, with its ISO code</div>`
      + j.counts.by_country.map(([c, n]) => `<div class="arts-c"><button type="button" class="arts-row" id="arts-b-${esc(c)}" aria-expanded="false" aria-controls="arts-l-${esc(c)}">`
        + `<span class="nm">${esc(name(c))} <span class="iso">${esc(c)}</span></span><span class="n">${n}</span></button>`
        + `<ul class="arts-objs" id="arts-l-${esc(c)}" hidden>${groups[c].map(r => objRow(r, sens)).join('')}</ul></div>`).join('');
    $('arts-list').hidden = false;
    $('v-arts').textContent = `${j.counts.objects} objects · ${j.counts.countries} present-day countries`;
  }

  function setStatus(s, reason) {
    st.status = s; st.reason = reason || null;
    $('o-arts').textContent = s === 'off' ? 'off — switch on to load the list'
      : s === 'loading' ? 'loading…'
      : s === 'ok' ? `loaded — source CSV of 2 Nov 2026 (commit e394878) · view prepared 7 Nov 2026`
      : `unavailable — ${reason}`;
    $('o-arts').classList.toggle('bad', s === 'unavailable');
  }

  function clear() { $('arts-list').innerHTML = ''; $('arts-list').hidden = true; $('v-arts').textContent = '–'; st.file = null; }

  async function setOn(on) {
    st.on = on; const t = ++st.token;
    $('tgl-arts').setAttribute('aria-checked', String(on));
    clear();
    if (!on) { setStatus('off'); return; }
    setStatus('loading');
    let j = null, reason = null;
    try {
      const r = await fetch(ME.HUB + '/snapshot/arts', { cache: 'no-store' });
      if (!r.ok) { let b = null; try { b = await r.json(); } catch (e) {} reason = (b && b.reason) ? `the hub reports ${b.reason}` : `the hub answered ${r.status}`; }
      else { try { j = await r.json(); } catch (e) { reason = 'invalid'; } }
    } catch (e) { reason = 'the hub could not be reached'; }
    if (t !== st.token) return;   // switched off (or again) while loading
    if (!reason) reason = consistency(j);
    if (reason) { setStatus('unavailable', reason); return; }
    st.file = j; render(j); setStatus('ok');
  }

  $('tgl-arts').addEventListener('click', () => setOn(!st.on));
  $('arts-list').addEventListener('click', e => {
    const b = e.target.closest('.arts-row'); if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    $(b.getAttribute('aria-controls')).hidden = !open;
  });
  ME.arts = { state: () => ({ on: st.on, status: st.status, reason: st.reason, objects: st.file ? st.file.records.length : 0 }), setOn, consistency, EXPECT };
})();
