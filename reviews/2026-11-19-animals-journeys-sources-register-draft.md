# Draft: Sources section and REGISTER entries for the three recorded journeys (not filed)

19 Nov 2026 14:38 UTC (clock reading) · rev 1 · for GPT review · **nothing here is filed or on any page.** `sources.html` and `REGISTER.md` are unchanged on every branch. Filing needs Chad's own lines, given with the release:
- `Approve: file the Animals journey entries in REGISTER (draft reviews/2026-11-19-animals-journeys-sources-register-draft.md rev <n>)`
- the Sources section goes in with the page merge, under that merge's own Approve line.

Facts are taken from the three verified manifests on `animals-journeys-preview-rc` and the audits on `animals-proposal`. Square brackets mark what waits on a decision. The whale's entries assume the open question in `docs/concepts/ANIMALS-RELEASE-ASSESSMENT.md` §5 is settled; if the zebra and shark are released first, the whale's parts are left out and the "three" below become "two".

---

## Part 1. Sources page: proposed section

**Heading:** Animal journeys — recorded positions of tagged animals, replayed (dated archive; optional, on the Animals tab)

**What this is.** Recorded positions of one tagged animal at a time, replayed against the dates they were recorded. Each journey ended years ago. Nothing here shows where any animal is now. This is the one place on Mother Earth that shows a dated archive in place of a live or regularly updated feed, by a decision of 19 Nov 2026.

**What it is not.** Not a route: a line joins two recorded positions only when they are close in time, and is a straight join, not the path taken. Not a population: one animal is one animal. Not a conservation assessment: none is shown.

**Plains zebra, collar Z3866, northern Botswana, 25 Oct 2007 to 22 Oct 2008.**
- Source: Bartlam-Brooks HLA, Harris S. 2013. Data from: In search of greener pastures: using satellite images to predict the effects of environmental change on zebra migration. Movebank Data Repository. https://doi.org/10.5441/001/1.f3550b4f. Licence CC0 1.0.
- Paper: Bartlam-Brooks HLA, Beck PSA, Bohrer G, Harris S (2013), Journal of Geophysical Research: Biogeosciences, doi:10.1002/jgrg.20096 (cited as the repository gives it).
- Method: GPS collar; fixes hourly or every 15 minutes. The dataset gives no location uncertainty.
- Shown: all 13,045 usable recorded fixes of this animal (3 rows without a position left out). One of 7 animals in the study.
- Our rule: fixes more than 3 hours apart are not joined.
- Changes: one animal selected; rows without a position left out; nothing moved, thinned or smoothed.

**White shark, tag 118845, South African coast to southern Mozambique, 9 May 2012 to 29 Sep 2013.**
- Source: Kock, Alison; Lombard, Amanda T; Daly, Ryan; Goodall, Victoria; Meÿer, Michael; Johnson, Ryan; Fischer, Chris; Koen, Pieter; Irion, Dylan; Gennari, Enrico; Towner, Alison; Jewell, Oliver; da Silva, Charlene; Dicken, Matt; Smale, Malcolm; Photopoulou, Theoni (2021). Satellite tracking data of white sharks in the southwest Indian Ocean (2012-2014), version 1.0.0. Zenodo. https://doi.org/10.5281/zenodo.5575189. Licence CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). The credit line is composed by Mother Earth from the record's creators, date, title and version.
- Paper: Kock AA and co-authors (2022), Frontiers in Marine Science 9, doi:10.3389/fmars.2022.811985.
- Method: satellite transmitter on the dorsal fin; positions by Argos when the fin is at the surface. Each fix carries an Argos quality class. Nominal error: under 250 m (class 3), 250 to 500 m (2), 500 to 1,500 m (1), over 1,500 m (0); classes A and B have no estimate. These are nominal estimates, not limits.
- Shown: 755 of the tag's 1,004 recorded fixes. 69% of those shown are classes A or B. One of 34 sharks in the study.
- Changes made to the dataset: one tag selected; 208 fixes left out under Mother Earth's own speed-consistency rule (3 m/s, the study authors' filter value; the rule is experimental and can remove a correct fix); 1 left out as more than 72 hours from any other; 40 left out as on land in Natural Earth's 1:10m map; nothing moved, smoothed or interpolated; the tag number is shown in place of the name in the file.
- Our rule: fixes more than 12 hours apart are not joined, nor any pair whose straight join crosses land in that map (616 of 754 steps are joined).
- This is not the study's modelled track.

**False killer whale, tag 98364, Hawaiian Islands and the North Pacific to the east, 23 Oct 2013 to 12 Feb 2014.** [Included only once its population is established.]
- Source: Baird, Robin; Hanson, M. Bradley; Schorr, Gregory S.; Webster, Daniel L.; McSweeney, Daniel J.; Gorgone, Annie M.; Mahaffy, Sabre D.; Holzer, Damon; Oleson, Erin M.; Andrews, Russel D.; Anderson, David; Bradford, Amanda L. (2025). False killer whale (Pseudorca crassidens) location data from a satellite telemetry tag (ptt id 98364) deployed in the North Pacific Ocean from 2013-10-23 to 2014-02-23, deployment id 573c6646d76c5c52816a4b92. [Dataset]. US Integrated Ocean Observing System (IOOS) Animal Telemetry Network (ATN). CC0 1.0 on the data.gov and OBIS records.
- A false killer whale is a dolphin (family Delphinidae). [One sentence naming its population, with the source.]
- Method: satellite tag; positions by Argos, with the same quality classes as above.
- Shown: 661 of the file's 824 rows. 54% of those shown are classes 0, A or B.
- Left out: the tagging row; 129 rows that did not pass the data centre's time, location and speed checks; 1 fix the satellite system marks invalid; 30 under Mother Earth's speed-consistency rule (20 km/h, the tagging group's stated value for this species; experimental); 2 more than 72 hours from any other. The file's last fixes, to 22 Feb 2014, stand alone in time and are left out, so the replay ends 12 Feb 2014.
- Our rule: fixes more than 6 hours apart are not joined, nor any pair whose straight join crosses land (554 of 660 steps are joined).

**Land map used for the two sea journeys.** Natural Earth 1:10m land polygons (public domain). Used only to leave out fixes that fall on land and to refuse lines that would cross it. A coarse map: it is a display test, not a statement about where the animal was.

**Marks.** The position marks are drawn large so they can be seen with the whole journey in view. Their size does not show uncertainty.

**Not available yet.** Conservation status and population trend for these species: not shown. A count of tags or of fixes is not a population figure.

---

## Part 2. REGISTER: proposed entries

### Entry 1
**Movebank Data Repository — "Migratory Burchell's zebra (Equus burchellii) in northern Botswana", doi `10.5441/001/1.f3550b4f` — recorded journey of one animal — [shown on the Animals tab once released]**
- **Filed:** [date, on Chad's line].
- **Source file:** `Migratory Burchell's zebra (Equus burchellii) in northern Botswana.csv`, 15,651,785 bytes, sha256 `c91054627d7d60d50cd9cb59b3d52609df5d17e6985d147742bcf9a6da488824`, retrieved 19 Nov 2026 02:29:17 UTC from the repository. Not kept in the repo or on the Mac.
- **Request method:** none at run time. Fetched once to build the display file. No refresh: a closed archive.
- **Reuse terms:** CC0 1.0 Universal, on the repository record. Citation shown as the repository gives it.
- **What we ship:** `assets/animals/zebra-botswana-Z3866-R1.json` (sha256 `8d00aa32…1bb6`) and its manifest (`f337cdd0…73d0`), built by `phase1/animals/build_journey.py`, which rebuilds both byte for byte from the source file.
- **Our modifications:** one animal of seven selected; 3 rows without a position left out; nothing else changed.
- **Our rules:** fixes more than 3 hours apart are not joined (Mother Earth's display rule, provisional).
- **Sensitivity decision:** [Chad, date: release as recorded, at the dataset's own precision, no delay. Considered: species; places; an 18-year-old completed track; open at this precision under CC0 since 2013; the display adds no place or time the open file does not give. Not a finding that the data expose no sensitive site.]
- **Why an archive is here:** Chad's decision of 19 Nov 2026: recorded animal journeys are allowed on the Animals tab as a dated archive feature; all other layers keep the live-feed rule.
- **Commercial use:** CC0 sets no condition.

### Entry 2
**Zenodo — "Satellite tracking data of white sharks in the southwest Indian Ocean (2012-2014)", version 1.0.0, doi `10.5281/zenodo.5575189` — recorded journey of one animal — [shown on the Animals tab once released]**
- **Filed:** [date, on Chad's line].
- **Source file:** `south_african_white_shark_ARGOS_tracks.csv`, 1,830,322 bytes, sha256 `156b1ee2d72b20244ad378020abd7da30e8c006fc58c7e72e6864f1f23a0029d`, retrieved 19 Nov 2026 08:53:07 UTC through the record's file link. Not kept in the repo or on the Mac.
- **Request method:** none at run time. No refresh: a closed archive.
- **Reuse terms:** CC BY 4.0. Requires credit, a link to the licence and a statement of changes; all three are on the card and in Sources. The record names a South African government research permit and states no further condition.
- **What we ship:** `assets/animals/white-shark-sa-118845-R1.json` (`fb6d4079…6f71`) and its manifest (`bf8cc595…e160`), built by `phase1/animals/build_argos_journey.py` with `white-shark-sa.json`; `--check` compares both against a fresh build.
- **Our modifications:** one tag of 34 selected; 1,004 rows → 755 shown (208 by the speed-consistency rule, 1 isolated by more than 72 hours, 40 on land). Nothing moved, smoothed or interpolated.
- **Our rules (experimental; ours, not the study's):** speed consistency at 3 m/s with classes 3, 2, 1 as anchors; 72-hour isolation; land test against Natural Earth 1:10m; join limit 12 hours; no join where the drawn chord crosses land. Proposal: `docs/concepts/ANIMALS-QUALITY-RULE-WHITE-SHARKS.md` rev 2 (GPT: provisional).
- **Identity:** tag number shown; the file's given names are not.
- **Sensitivity decision:** [Chad, date: release as recorded, tag number only, no delay. Considered: a protected, high-profile species; named, publicly known tagging areas; a 13-year-old record; Argos precision; the display shows fewer fixes than the open file and adds no place or time.]
- **No enquiry sent to the authors.** Not required by the licence.
- **Commercial use:** CC BY 4.0 allows it with the same credit.

### Entry 3 [filed only once the population question is settled]
**US IOOS Animal Telemetry Network — false killer whale, ptt id 98364, deployment `573c6646d76c5c52816a4b92` — recorded journey of one animal — [shown on the Animals tab once released]**
- **Filed:** [date, on Chad's line].
- **Source file:** `atn_98364_false-killer-whale_trajectory_20131023-20140223.nc`, 319,596 bytes, sha256 `9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6`, retrieved 19 Nov 2026 08:31:51 UTC from ATN's staging folder for NCEI; MD5 equal to that folder's own list. Not verified byte for byte against NCEI's archived copy. Not kept in the repo or on the Mac.
- **Request method:** none at run time. No refresh.
- **Reuse terms:** CC0 1.0 on the data.gov and OBIS records for this deployment. The file's own text: free to use and redistribute; not for legal use; acknowledge ATN or the citation; contact with the authors "strongly encouraged" (not required).
- **What we ship:** `assets/animals/false-killer-whale-hawaii-98364-R1.json` (`7cb4bd44…5c84`) and its manifest (`9d7fd4fc…c4e5`), same builder with `false-killer-whale-hawaii.json`.
- **Our modifications:** 824 rows → 661 shown (stages as in Sources). Nothing moved, smoothed or interpolated.
- **Our rules (experimental):** rows passing the data centre's checks; speed consistency at 20 km/h with classes 3 and 2 as anchors; 72-hour isolation; land test; join limit 6 hours. Proposal: `docs/concepts/ANIMALS-QUALITY-RULE-FKW-98364.md` rev 2 (GPT: provisional).
- **Identity:** tag number shown; the catalogue id in the file is not.
- **Population:** [as established, with its source].
- **Sensitivity decision:** [Chad, date.]
- **Commercial use:** CC0 sets no condition.

### Entry 4
**Natural Earth — 1:10m land polygons — land test for the two sea journeys; build-time only; not drawn**
- **Source:** `ne_10m_land.geojson` from github.com/nvkelso/natural-earth-vector at commit `ca96624a56bd078437bca8184e78163e5039ad19` (VERSION 5.2.0-pre), sha256 `1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416`.
- **Request method:** none at run time; read once at build. The file is not shipped.
- **Reuse terms:** public domain, as the existing Natural Earth entry (1:50m coastline). A different file and a different version from that entry: 1:10m land at an unreleased commit, pinned by hash.
- **Use:** fixes on land are left out; a line is refused where its drawn chord crosses land. A display test at a coarse scale.

---

## Part 3. What GPT is asked to check
1. Every number against the three manifests.
2. That the Sources wording meets CC BY 4.0 for the shark (credit, licence link, changes).
3. That nothing in Part 1 or 2 reads as a route, a population figure or a conservation statement.
4. Whether Entry 4 should be its own entry or an extension of the existing Natural Earth entry.
