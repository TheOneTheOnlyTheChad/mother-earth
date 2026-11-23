Timeline story — rev 4 focused recheck

23 November 2026. Point 4 (inert citation numbers) is closed. No remaining code hold from this bounded branch-preview review. This does not approve a merge, catalogue upload, Worker deployment or release.

Reviewed Mac tree: /Users/chadobie/Documents/Mother Earth/_review/timeline-story-rc/, identified by Chad as branch timeline-story-rc head c6fa359, code at 61a9160. I checked the local bytes, not the GitHub commit independently. Read BUILD-RECORD revs 4b, 4a and 4 and inspected the relevant code, generator and test sections.

Identity

All supplied hashes match:

File

SHA256

read/BUILD-RECORD.txt

9f6a47bd41cb31612c401d30befa2c047395ea10d6819364824d4d6d6ae3018c

timeline.js

7fb808ff0c9d1c78326c9773c570f210280f4c3d2e238aed2f9b8cedafd74fa5

style.css

6b6115b2eaeef6d2e882dee888372d10e660fa48bb9ae267dea83688eff12956

phase1/timeline/build_timeline.py

94e8f328ea7ca2f268df4f295dcd5a20d478ea6c749f2e537c67cd3a1363a0c3

phase1/timeline/preview.mjs

161c5a62b148e60346e075e7c5daf6aabb04af02006462d20bd390366da26f44 (unchanged)

The stale-copy explanation is now labelled as probable rather than established. Keeping earlier records and verifying copied hashes is appropriate; this review establishes the present bytes, not the historical transfer mechanism.

Focused rulings

Citations: accepted. Hydration replaces the source marks with native buttons, each carrying a spoken source name. A click opens the native disclosure, scrolls the target source into view and focuses its tabindex target. It sets no fragment and calls no history API. Hydration is idempotent because the replaced sup elements no longer match. The generator retains text marks and an ordinary disclosure without JavaScript. The stylesheet supplies keyboard focus indicators.

Own Chrome extension checks against the running local helper: mouse activation of source 7 focused O'Connor's Fig. 1 source; Enter activation of source 1 focused its introduction source. The entry fragment stayed unchanged. One Back closed the story and returned focus to its timeline mark; Forward reopened it with focus on its heading. At 390 × 844, I closed the disclosure and used Space on a source 6 button: the disclosure reopened and focused Renne's abstract source. No horizontal overflow was present. Back and Forward again closed/reopened the sheet with the expected focus. Temporary viewport override reset afterwards. These are desktop Chrome interactions at normal and simulated phone widths, not a physical phone or Safari test. The browser scope did not expose history length, so I verified the relevant behaviour by Back/Forward rather than claiming a numerical length measurement.

Unknown page schema: accepted by code inspection. An absent attribute selects legacy schema 2; literal 3 selects 3; every other attribute value becomes NaN and fails catalogue identity. This does not negotiate future schemas. The UI suite includes 4, empty and three, checking refusal with the list retained. I inspected those tests but did not independently run the browser suite or inject a mutated schema into the running browser.

Both wording changes: accepted. The image failure line now says its caption and account remain available. The public change record says the earlier entry presented timing claims without a cause account. These accurately describe the behaviour and earlier entry.

Scoped review note: accepted as written. “Account and image reviewed: 23 Nov 2026. This covers the added sentences, their sources and the image record. It is not a review of the entry as a whole; the earlier timing claims keep their own dates.” It usefully identifies this review's scope without advancing the unchanged entry-wide date of 10 Nov 2026. Both lines were present in the preview.

One nonblocking record correction

Rev 4 item 4 says the generator and page refuse a scoped review dated after release. The generator does, through is_date and comparison with the release day. The page's storyBad check currently requires the YYYY-MM-DD shape, nonempty scope and the note element's existence; it does not compare this scoped date with release day or verify the note's rendered wording against the catalogue. Its test covers a missing scoped review, not a future one. Correct that record claim to describe the implemented boundary. This does not invalidate the current, valid date or the accepted note, and is not a new code hold for this preview. If equal page enforcement is desired, make that a focused change with corresponding refusal tests before claiming it.

Independent runs and limits

node phase1/timeline-story-build.test.mjs: 93 pass, 0 fail; now completes without Pillow, including real NASA byte checks and the aggregate-budget refusal fixture.

node phase1/timeline-changes-build.test.mjs: 45 pass, 0 fail.

Inspected run-log-rev4.txt: nine suite results and all five deliberate breaks remain Claude's runs. I did not rerun those browser suites or breaks.

No fresh source research was needed or performed: the frozen snapshot's scientific wording is unchanged. Earlier release work remains: asset-version bump, production packaging and served-file comparison, agreed hub route, REGISTER and Chad's own action lines. The earlier real-device, Safari, screen-reader and actual browser-zoom limits remain. No live page, hub, account or repository was changed.