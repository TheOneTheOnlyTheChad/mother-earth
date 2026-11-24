# Timeline change-record UI fixture — review of 1d0c6dd

24 November 2026 · Independent GPT review for Chad

**Outcome: PASS for the reviewed test-only change. No page or hub rollback recommended. Two bounded test-maintenance follow-ups are recommended; neither is a hold on the released page.**

## Corrected release identity

Use **19f4e07** as the reported page-release merge, with parents 419ccb4 and efeb145. **ea39975 was a discarded local attempt and must not be used as the rollback target.** This correction changes the release record, not the reviewed served bytes. Any future revert must be prepared against fresh main with the appropriate merge mainline and its own review/approval; this report performs or approves no revert.

The supplied packet reports corrected records on main at 720fa0d. GPT verified local packet content, not remote Git ancestry or every Project copy.

## Answers to the three questions

| Question | Answer |
| --- | --- |
| 1. Is taking the repository Worker as pinned and removing the pin in memory acceptable? | **Yes.** It preserves the suite's intended compatibility matrix. The crucial distinction remains: an unknown revision returns 404 without an R2 read; a known pin whose object is missing returns 503. This is a synthetic fixture, not a claim to reconstruct a complete historical Worker. The older pinned hub fixture remains separate and unchanged. |
| 2. Should the ad hoc case become a permanent break? | **Yes, recommended as a small test-only follow-up.** Name it, for example, unpinned-is-pinned, and deliberately leave the unpinned source equal to the pinned source. Require the specific fixture-guard rejection, not just any nonzero exit. Preserve the documented secondary control: with that guard bypassed in an isolated run, the existing compatibility assertion must detect 503 instead of the required 404. This follow-up is not a release blocker. |
| 3. Is the literal previous revision acceptable, or should it come from BUILD.json? | **The literal R2 is correct for this release and is acceptable in 1d0c6dd. Prefer reading BUILD.previous in the same bounded follow-up.** BUILD.json has a top-level previous field; release.previous is the corresponding catalogue field. Check that both agree, that previous is a distinct nonempty revision and has its required fixture data. Keep REV = R2 fixed: it identifies the historical change record under test and is not the generic previous-release variable. |

The fixture constructor deliberately relies on exact source anchors and stops when their layout changes. That is acceptable here: it fails visibly rather than silently weakening the case. It is not a general parser for arbitrary future Worker layouts.

## Independent verification

Read read/index.html, the packet, exact diff, both test-file copies and all five supplied logs from:

/Users/chadobie/Documents/Mother Earth/_review/timeline-changes-ui-1d0c6dd/

- Verified all **21 SHA256SUMS entries**.
- Applied the supplied diff in memory: it reconstructs the exact after file. That file also matches the current local main mirror.
- Confirmed the after-file SHA256 is 57dbc1f53bbc0b0cd291864b608d73a3a546445a6a0ce047b3f05183a65fbb8b; before is 5d7cc3342fe8d8c1dd6c72ed69b4fe8e7a5fdec8e5e58a1f8053e70b7dc3983b.
- Executed the actual changed fixture-construction block independently. The old block reproduces worker anchors missing on the aligned Worker; the new pinned fixture is byte-identical to the local 0.6.24 Worker. Deliberately retaining the pin in the unpinned fixture triggers the new guard.
- Imported the resulting full Workers from temporary files and exercised their actual catalogue route with an in-memory R2. Pinned + correct R3 object gives 200 and the exact catalogue hash; pinned + missing object gives 503. Unpinned gives 404 and zero R2 reads whether the object exists or not.
- Exercised the fallback constructor on a synthetic earlier-anchor layout, then verified its 200/503 route behaviour. This is not an independent rerun against historical branch efeb145. Its matching 173-check result remains Claude's supplied evidence.

No browser suite ran independently in this review: Playwright is absent from the local module resolution path. The supplied 173/173 results on main and the old-hub branch, all 14 existing breaks, and the guard-bypassed 172/173 result remain **Claude's workspace results**. GPT independently verified the constructor, guard and real Worker route distinction, not the browser interactions.

No network, account, live page or production operation occurred.

## Closeout

The reported test change is confined to fixture setup and leaves the suite's existing assertions and 14 breaks intact. The reported integration miss was that the branch suite had not been run on a tree combining the page release with the aligned hub. For future release preparation, run the affected suite on that actual integrated tree before the release go.

The Timeline thread may now file this review and prepare its handover with corrected release identities. If Chad commissions the recommended follow-up, keep it test-only and provide its exact diff and results; no page/hub change is needed.

Animals owns its three stale baseline comparisons. Other threads retain ownership of their branches. Real-phone, Safari, screen-reader and true 200% browser zoom remain untested. This review does not clear those checks or Earth from Space Stage D.

