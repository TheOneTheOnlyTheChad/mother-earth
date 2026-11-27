# Mother Earth — Moon LROC release candidate review

27 November 2026 · GPT independent review for Chad and Claude

**PASS for release approval: `moon-lroc-ui` at `40e0f86`.** No blocking finding remains. This is a review verdict, not Chad's approval to merge or deploy.

## Candidate and scope

Claude identifies final head `40e0f86` as tested tree `9436b8e` plus the release packet only. Payload `998df30` follows the fresh-main merge `1b1d30d`; Animals pins are in `9436b8e`. Main records are reported at `d5ecebd`.

I reviewed the supplied Mac evidence at `Documents/Mother Earth/_review/moon-lroc-rc/`, using the project mirror for unchanged files. This review independently verifies supplied file contents and evidence; it does not independently attest remote Git history. The approved boundary is page only: no hub, collector, R2 or Cloudflare deployment.

## Independent checks

- All **84** files named by the review copy's SHA256SUMS.txt match their recorded hashes. The spurious temporary checksum entry is absent.
- All **50** served-file entries match the supplied candidate overlay and unchanged project files. The manifest adds the six LROC files to the Diviner release's 44 entries; only moon.html and sources.html change among those earlier served files. Historical manifests remain separate records.
- The reviewed manifest is `reviews/evidence/2026-11-26-moon-lroc-manifest.json`, SHA-256 **`cdd304f59b50ad221518126bdb7c73c0ac0469dd3eda3cb6698243af8bcb5fe1`**.
- moonlroc.js, moonlroc.css and the four LROC assets remain identical to the previously reviewed preview. The existing toggle now sits in its own `#mg-lroc-ctl` row outside `#mg-ctl`; moonglobe.js is unchanged.
- Independently exercised the candidate in the in-app browser with a local dependency-failure fixture: the globe-library URL alone was replaced by a missing local URL. With the globe unavailable, the detail toggle remained visible; it opened the area picture with “Locator unavailable”, switched to the site picture, then closed the panel without reload. Focus returned to the same toggle. This is a bounded fallback check, not a live-site or hardware performance test.
- Re-ran the independent five-case readiness harness against the unchanged controller: delayed readiness, off before ready, on/off/on, failed globe and deadline all pass, with no remaining readiness poll and no late camera move in cancelled/failed cases.

The earlier raw-source, projection, missing-data and crop reviews remain applicable. This RC introduces no new source acquisition or image processing. The HTML locator remains a position marker rather than a footprint. The accepted area JPEG tolerance remains a display choice, not scientific accuracy.

## Release additions

The new Sources section, shortcut and Details links agree with the assessed products, observation interval, coordinate frame, crop and processing rules, no-data mask, attribution and label-conflict disclosures. The 0.56 m / 0.95 m landmark comparisons are explicitly local agreement, not absolute positional accuracy. The imagery is dated, stretched for display and separate from the globe's current calculated lighting and dated orbit.

The carried height/temperature Sources wording now correctly restores the prior lighting choice; if that choice was “Lit as now”, it returns for the current minute. REGISTER records the release candidate and provenance. Marking it live belongs in the release close-out.

Focused tests J1–J3 cover the requested failure, keyboard, retry, view-switch, close/focus and placement behaviour. The `inctl` break demonstrably catches returning the button to the hidden control block. The Animals and Diviner test maintenance is limited to accommodating and pinning the new section and wording.

## Validation evidence and limits

I inspected the packet and supplied validation evidence; I did not independently rerun the full 31-suite sweep or all mutation runs. The reported LROC 78/0, Animals 296/0, Diviner 178/0 and height 110/0 results are consistent with the recorded scope. The full sweep predates two test-only edits; the four suites that read those files were rerun on final tested tree `9436b8e`, as were all 20 behavioural breaks and two Animals pin controls.

The Tides branch-scope exception is not a product failure. The timeline-mixed-assets and OSMC failures have matching main baselines. The fire-status timing failures and passing isolated rerun are disclosed; the overwritten parallel log limits auditability of that one run, and its captured failure lines are distinguished from the retained rerun. Abandoned/setup runs are not counted as passing validation. Removing the no-op focus break is correctly disclosed rather than counted as fault detection.

Real phone, Safari, screen reader and hardware-renderer checks remain unverified. The browser check above does not close those items. No new broad smoke test is required before Chad's decision on this candidate.

## Chad's approval and release follow-through

Suggested owner line, to be sent by Chad himself:

> Approve: release Moon LROC detailed site from moon-lroc-ui at 40e0f86 to main, page only; no hub deployment.

After approval, Claude should:

1. Confirm the release tree still contains exactly the reviewed served bytes; reconcile any intervening main change explicitly.
2. Verify all **50 live served files against the reviewed manifest above** after Pages publishes. Do not regenerate a new expected baseline from production. If using the pane script, ensure its embedded expected list is exactly the reviewed list.
3. Do a bounded live check of opening, both images, optional pointer and closing; retain the existing globe/lighting/science-layer boundary. Record served verification separately from functional checks and performance claims.
4. Record merge/release evidence, update REGISTER/STATUS/START-HERE/checklist, sync the Mac preserve-first, archive the review copy, and delete only this completed feature branch after successful close-out. Leave other threads' branches alone.

This closes Moon checklist item 4 only after release verification. Continue through the remaining Moon spec items one at a time; Sun/Parker waits for the Moon spec close-out.
