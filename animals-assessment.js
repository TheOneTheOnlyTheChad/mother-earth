/* Mother Earth — Animals page, conservation assessment blocks (animals-assessment-rc; ANIMALS-ASSESSMENT-CARD-BUILD-BRIEF rev 1).
 * Five blocks, words only: the GLOBAL IUCN Red List category of the species on each of four journey cards and the penguin
 * census card, with the assessment's own date, publication year, version note, citation and link, the Red List edition, and
 * the date Mother Earth last checked it. A dated record kept by hand, not a feed.
 * What this file does: fetches ONE file from this site (assets/animals/assessments-R1.json), checks it against the checksum
 * pinned below, checks each record's shape, then fills each block from its record. It never contacts the Red List.
 * What it never shows: a trend, criteria, a regional category, a Green Status value, a population number, a colour or a badge.
 * Order of states, strict: (1) the file missing, unreadable or not the pinned file: every block reads "Not available";
 * (2) a record suppressed, missing or malformed: that block reads "Not available" and NO category, whatever its check dates;
 * (3) otherwise the category is shown, and two notices can be added, each on its own and both together: the latest check
 * could not be completed; the check is overdue. Neither notice hides the other. The date of the last SUCCESSFUL check is
 * printed as the record gives it; a failed attempt has its own date.
 * "Overdue" is worked out when the page loads, from the reader's clock in UTC against the record's due date.
 * Every sentence is built here from the record's fields; the page holds no category of its own. It does not load app.js. */
(() => {
  const ME = window.ME = window.ME || {};
  const A = { FILE: 'assets/animals/assessments-R1.json', SHA256: 'b1c7afa961875ab302eff3556110d78fe60b7422fdd015178214cd9fe5d58265', WAIT_MS: 20000,
    CATEGORIES: ['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Extinct in the Wild', 'Extinct', 'Data Deficient'],
    T: { failed: 'Not available. The assessment record could not be loaded.', unverified: 'Not available. The assessment record could not be verified.',
      none: 'Not available. No assessment record is filed for this card.', malformed: 'Not available. This card’s assessment record could not be verified.',
      trend: 'Population trend: not shown here; see the assessment.' } };
  const blocks = [...document.querySelectorAll('[data-assess]')]; if (!blocks.length) return;
  const st = { status: 'loading', cards: {} };
  const hex = async buf => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(b => b.toString(16).padStart(2, '0')).join('');
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isDay = s => { const m = typeof s === 'string' && ISO.exec(s); return !!m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31; };
  const day = s => { const m = ISO.exec(s); return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`; };   // the date as written; no clock arithmetic
  const isYear = y => Number.isInteger(y) && y >= 1960 && y <= 2100;
  const str = s => typeof s === 'string' && s.trim() !== '';

  /** the shape this page needs before it will print a category; the builder's fuller rules ran when the file was made */
  function wellFormed(r) {
    if (!r || !str(r.card) || !str(r.common_name) || !str(r.scientific_name) || !str(r.citation)) return false;
    const id = /^e\.T([1-9]\d*)A([1-9]\d*)$/.exec(r.assessment_id || ''); if (!id) return false;
    if (r.url !== `https://www.iucnredlist.org/species/${id[1]}/${id[2]}` || !str(r.doi_url) || !r.doi_url.startsWith('https://dx.doi.org/10.2305/IUCN.UK.') || !r.doi_url.includes(`.T${id[1]}A${id[2]}.`)) return false;
    if (r.scope !== 'global' || !A.CATEGORIES.includes(r.category)) return false;
    if (!isDay(r.assessed) || !isYear(r.published_year)) return false;
    const v = r.version_note; if (v !== null && !(v && ((v.kind === 'amended' && isYear(v.of_year)) || (v.kind === 'errata' && isYear(v.year))))) return false;
    if (r.status !== 'usable' && r.status !== 'suppressed') return false;
    if (r.status === 'suppressed') return str(r.suppressed_reason);
    if (!isDay(r.last_successful_check) || !isDay(r.next_check_due) || !/^\d{4}-[1-9]$/.test(r.edition_at_check || '')) return false;
    const la = r.last_attempt; if (!la || !isDay(la.date) || (la.result !== 'ok' && la.result !== 'failed')) return false;
    const s = r.shown; if (!s || !isYear(s.first_year) || !isYear(s.last_year)) return false;
    return s.kind === 'census' || (s.kind === 'journey' && str(s.animal) && str(s.place));
  }
  /** the publication sentence. Publication year and the amended or errata year are separate facts and are worded apart. */
  function published(r) {
    const v = r.version_note;
    if (!v) return `Published ${r.published_year}.`;
    if (v.kind === 'amended') return `This version published ${r.published_year}, an amended version of the ${v.of_year} assessment.`;
    return `Published ${r.published_year}; errata version published in ${v.year}.`;
  }
  function unit(r) {
    const s = r.shown, p = el('p', 'as-unit');
    if (s.kind === 'census') { p.textContent = `The assessment covers the species as a whole at its date. The charts above are counts of occupied nest sites at named colonies, ${s.first_year} to ${s.last_year}, from a different source.`; return p; }
    const years = s.first_year === s.last_year ? `${s.first_year}` : `${s.first_year} to ${s.last_year}`;
    p.append(el('b', '', 'This is not about the animal shown.'), ` The assessment covers the species worldwide; the journey is one ${s.animal} tracked in ${s.place}, ${years}.` + (s.stock_not_verified ? ' No assessment of this animal’s own stock was verified for this card.' : ''));
    return p;
  }
  const na = (box, text, why) => { box.textContent = ''; box.append(el('p', 'an-na', text)); box.dataset.state = 'unavailable'; box.dataset.notices = ''; st.cards[box.dataset.assess] = { shown: false, why }; };
  function fill(box, r, today) {
    if (!r) return na(box, A.T.none, 'no-record');
    if (!wellFormed(r)) return na(box, A.T.malformed, 'malformed');
    if (r.status === 'suppressed') return na(box, 'Not available. ' + r.suppressed_reason, 'suppressed');     // before any check state: a checked date never overrides it
    box.textContent = '';
    const cat = el('p', 'as-cat'); cat.append(el('b', '', 'Extinction-risk category:'), ` ${r.category}. IUCN Red List, global assessment of ${r.common_name} (`, el('i', '', r.scientific_name), `), assessed ${day(r.assessed)}. ${published(r)} Red List edition ${r.edition_at_check}. Checked by Mother Earth on ${day(r.last_successful_check)}.`);
    const cite = el('p', 'as-cite'); const a = el('a', '', r.doi_url); a.href = r.doi_url; a.target = '_blank'; a.rel = 'noopener';
    const pg = el('a', '', 'Assessment page'); pg.href = r.url; pg.target = '_blank'; pg.rel = 'noopener';
    cite.append(`Citation: ${r.citation} `, a, '. ', pg, '.');
    box.append(cat, cite, unit(r), el('p', 'as-trend', A.T.trend));
    const notices = [];
    if (r.last_attempt.result === 'failed') { notices.push('failed'); box.append(el('p', 'as-note as-failed', `The latest check on ${day(r.last_attempt.date)} could not be completed.`)); }
    if (today > r.next_check_due) { notices.push('overdue'); box.append(el('p', 'as-note as-overdue', `This record’s check is overdue. It was due on ${day(r.next_check_due)}.`)); }
    box.dataset.state = 'shown'; box.dataset.notices = notices.join(' '); st.cards[r.card] = { shown: true, notices };
  }
  async function load() {
    const all = (text, why, status) => { blocks.forEach(b => na(b, text, why)); st.status = status; };
    const c = new AbortController(), timer = setTimeout(() => c.abort(), A.WAIT_MS);
    window.addEventListener('pagehide', () => c.abort(), { once: true });
    let buf; try { const r = await fetch(A.FILE, { cache: 'no-store', signal: c.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); buf = await r.arrayBuffer(); } catch (_) { clearTimeout(timer); return all(A.T.failed, 'failed', 'failed'); }
    clearTimeout(timer);
    let d; try { if (await hex(buf) !== A.SHA256) throw 0; d = JSON.parse(new TextDecoder().decode(buf)); if (!d || d.schema !== 1 || d.kind !== 'red-list-assessments' || !Array.isArray(d.records)) throw 0; } catch (_) { return all(A.T.unverified, 'unverified', 'unverified'); }
    const today = new Date().toISOString().slice(0, 10);
    blocks.forEach(b => { const mine = d.records.filter(r => r && r.card === b.dataset.assess); try { fill(b, mine.length === 1 ? mine[0] : null, today); } catch (_) { na(b, A.T.malformed, 'malformed'); } });
    st.status = 'ready';
  }
  ME.animalsAssessment = { A, state: () => JSON.parse(JSON.stringify(st)) };
  load();
})();
