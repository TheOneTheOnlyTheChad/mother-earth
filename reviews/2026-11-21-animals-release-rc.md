# Release packet: Animals tab MVP, branch `animals-release-rc` (release candidate for main)

Written 21 Nov 2026 16:56 UTC (clock reading), Animals continued thread. **Not merged, not deployed. The merge needs Chad's own Approve lines (section 6).**

## 0. Authority
Chad, 21 Nov 2026, his own messages: "i think we are ready to release now as MVP"; then, answering Claude's seven numbered points: (1) sensitivity: agreed (Claude's recommendation: every animal shown as recorded or as built, tag or collar number only; corridor Medium and High only); (2) Sources and REGISTER: add GPT's corrections; (3) take out "Private preview"; (4) merge main in: agreed; (5) the performance exception: "accepted as is for now"; (6) phone, Safari, screen reader: "to be tested after MVP release"; (7) on GPT's release review: "he has reviewed what we need for now". **GPT has not seen this release tree.** That is Chad's call as approver; this packet exists so GPT can read it at any time.

## 1. What this is
`animals-release-rc` = the accepted checkpoint `animals-tab-rc` `ebbbe46` (code `4aa5c00`) + current main merged in (docs only on main's side) + the release changes below. Code and data commit: `a46eebc`; tests-only commit after it: `17b4898`; this packet at the head.

## 2. Release changes against the accepted checkpoint (29 files; `git diff ebbbe46`)
- **Wording.** "Private preview" removed from the page (meta description, the top line, five card lines) and from every published record. The top line now reads "Dated archive. Recorded journeys, dated counts and one published corridor. None of it is a live feed."
- **Six manifests rebuilt from their sources, wording fields only.** Each records the release decision in place of "Private preview only … Public release needs a decision". **All six display files are byte-identical to the reviewed ones** (zebra `8d00aa32`, shark `fb6d4079`, whale `7cb4bd44`, albatross `42611030`, penguin unchanged, corridor `1462eae8`). The three lists and the four script pins (`animals-journey.js`, `animals.js`, `animals-census.js`, `animals-corridor.js`) changed with them; version stamps bumped.
- **Sources.** One new section in `sources.html` (`#animals`) covering all six sources and the build-time land map, with GPT's corrections of 20 Nov applied: the whale's population line from NOAA NMFS-PIFSC-150 (as GPT read it; "read by Mother Earth's reviewer"), source span against displayed span, the zebra's time and precision qualification, the archive exception stated narrowly, tag numbers stated as not anonymity, a replay stated as making coordinates easier to inspect. It also states the omitted Low class and the page's known limits (slow close-up drawing, half-second pause, phone and Safari unchecked).
- **REGISTER.** Seven entries appended (zebra, shark, whale, Natural Earth 1:10m, albatross, penguin counts, corridor), each with source hash, terms, what is shipped, modifications and Chad's sensitivity decision. They are filed by the merge.
- **Not changed:** any geometry, journey, count, rule, script logic, or shared Earth-now file. Stale "PRIVATE PREVIEW" remains in five script header comments and one stylesheet comment (comments only, left to keep the reviewed code untouched).
- **Not merged into this branch:** the docs branches `animals-proposal` and `animals-expansion-proposal`. A builder check refuses a repository that contains the albatross tagging-site coordinate, and one review file on `animals-expansion-proposal` quotes it. They stay as branches. (That file is already public on that branch; whether to rewrite it is a separate question for Chad.)

## 3. Sources used for the rebuild
Zebra, shark and whale files: downloaded again by Chad on 21 Nov 2026; size and sha256 equal the values pinned on 19 Nov; now on the Mac in `_source-data/animals-journeys/`. Albatross, penguin and corridor files: from `_source-data/animals-expansion/`. Natural Earth land: fetched again at the pinned commit, same sha256. None of them is in the repository.

## 4. Tests (Claude's runs, software renderer)
- Builders with their real inputs: zebra 22, Argos (shark and whale) 36, Argos rules 17, albatross 69, census 41, corridor 36: all pass. Three checks that pinned "byte-identical to Stage 2 or 3" lists now pin the release lists, and one now also pins the three older display files as unchanged.
- Pages, tree `17b4898`: `animals-corridor-ui` 61 of 61; `animals-tab-ui` 277 of 277. Tree `a46eebc` (identical except two test files): `animals-census-ui` 71 of 71; with `serve-core-on.py`: `bare-earth-ui` 190, `layer-switches-ui` 68, `timeline-ui` 594, `desktop-overflow` 286, `smoke-fixes` 113.
- First run of the release tree failed three checks that expected the old wording or an unchanged Sources page (corridor 1d; combined 13e and 15b). They were rewritten to the release wording; 13e now requires the new section to name all six sources and the omitted Low class.
- Breaks rerun: the corridor's three checksum breaks (list, manifest, display file), all caught. Other breaks not rerun.
- Not run: `mobile-pass`, `key-drawn-ui` (fixtures missing); no `header-tabs` suite exists on this branch. The Mac measurement was not repeated (no drawing code changed).

## 5. Released with these known gaps (Chad's decisions)
- Performance exception: 500 ms task criterion NOT MET on the test Mac (474 to 689 ms, instrumented); about 20 frames a second close over the corridor; the 31 to 36 s following load on the test machine unexplained.
- Real phone, Safari, screen reader, hand drag: unverified, to be tested after release.
- GPT has not reviewed the release tree, the new Sources section or the REGISTER entries.
- Snyder K3(b) not done; enquiries (NOAA, ATAP, penguins, IWC, Cape Vidal) sent by Chad, no reply reported, none of them a condition of these sources' licences.

## 6. To release (each on Chad's own line; not before 21:00 UTC on 21 Nov, when the Earth from Space observations end)
1. `Approve: file the seven Animals entries in REGISTER as written on animals-release-rc`
2. `Approve: merge animals-release-rc into main (Animals tab MVP goes live)`
Then Claude: merges main into the branch once more, reruns the combined suite if anything but docs came in, merges, checks the served files' hashes on the live site against this tree, reads the live page, and records it. Rollback: revert the merge commit on main (its own Approve line).

## 7. File hashes at `17b4898`
    b54715fa3010a49c6a99cfca6accaa5db1088b5ce4fcc9ee9ad38ef9d23f9e92  animals.html
    e2df166a1cd08f36056ab4969c478140310bf39358c144975ba44d815dde3304  animals.js
    b73c3c5fa58e3784b1d9125f1139ba75b81706e9aaf3a581275737dd8a2b0398  animals-journey.js
    1917967f0a8724f9c9ba7bc750a61f292304041794b90af8faf6e3961fbf7dfe  animals-census.js
    bc7b04e364158a46571b5c1a981ffa05fa215bbd5054a16116cba804d5761e77  animals-corridor.js
    06a523d2989436da7d069d4eec97e644c70a8b23e183c378748fa1d2333481b4  animals-globe.js
    a3666d99076f8dce7403ed8d8f6003c645c6f88337d5591c2a33370fb29639ea  style.css
    62480961f1a7357bd31d31aaffd8af6b6263d34700f697757340d4d2992780b6  sources.html
    52ba007feffaaeafca7866e7532f4c582abaf1c8d084ae21fc9e4bd001e93cf4  index.html
    d8068a486813c7e718820357a1c8883fab4579817cab35d1020126f309544094  assets/animals/african-penguin-census-R1.json
    77d93cc11e8f758111ca94481812dfe8d17791be00fcbfcbf971158c2f052c50  assets/animals/african-penguin-census-R1.manifest.json
    47a029f074dc24e93bcc43e19ad065e71a00f70a1ca2084d3f5c04d7cb1174f5  assets/animals/corridors-R1.catalog.json
    7cb4bd447c27ab988e92f5149620a98ea7376d940b1d257a8025cb36f7865c84  assets/animals/false-killer-whale-hawaii-98364-R1.json
    705368a0f36a89e4db4544e143a2cff998796b7fe13247f49ceac80aed9429ea  assets/animals/false-killer-whale-hawaii-R1.manifest.json
    5eb789b10488b68cb5e471309ebc517199b1dbce00e5ac719d84f3b4b42c5452  assets/animals/journeys-R1.catalog.json
    1462eae8dcc554f01b2dd86068d3ed0100e25f2a71a0862e0f77792aaca0ea40  assets/animals/mule-deer-east-walker-corridor-R1.json
    1a8e2d96e8e38a5092076ec5d45d6f68e1e6fae18c70692824dc1d553a1b6132  assets/animals/mule-deer-east-walker-corridor-R1.manifest.json
    ba1ce1e8fc3143d1cd0d2e8ac9b9f8f2d64b3cecd889387b8da9422df4d58d36  assets/animals/populations-R1.catalog.json
    4261103073f5f66c9c59c6ea0251993d745c7aad6523bd393235d2e811b62375  assets/animals/waved-albatross-galapagos-3275-30662-R1.json
    266ebc98153944004b460ae2a03ab71bec9c8d9f5fba2ffb5c8a06f2161a13e4  assets/animals/waved-albatross-galapagos-R1.manifest.json
    fb6d4079f5015270f453f984e316a3e22e04a1cce2d867581cc4ec717e986f71  assets/animals/white-shark-sa-118845-R1.json
    0522ca171b28a4ea329fa4a557c3dc3e700bbfe1ee506c973e0438ec51539564  assets/animals/white-shark-sa-R1.manifest.json
    ddb1cd5d23976615ab72a076b56d2cb026c55f9ba8e9c58efe7fb48686c640b2  assets/animals/zebra-botswana-R1.manifest.json
    8d00aa32dc728dee09f7136835b5b1d32e3cc19469250ad29bf73506a1141bb6  assets/animals/zebra-botswana-Z3866-R1.json
