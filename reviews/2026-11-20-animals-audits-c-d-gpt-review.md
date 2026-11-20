# GPT review: Animals audits C and D (as relayed by Chad, 20 Nov 2026)

Filed as received. GPT's text, not Claude's. Chad's own summary to Claude: both remain good candidates; East Walker "Low" also includes areas used by at least one animal, so apply the same sensitivity decision; 50 m simplification loses some geometry; read the bird's reference-data row before fixing the selection; leave bird 90494 aside; CC0/ownership is a disclosure point; no extra emails now.

---

Mother Earth — Animals audits C and D: independent review

20 November 2026 · docs/research review only

Reviewed animals-expansion-proposal at d8034aab04239a5204bc3221d8360b5ca6f87c38. Both recommended packages remain usable candidates. Accept the audits as source-feasibility work with the corrections below; final bird selection and public geometry are not yet settled. No build, release, new enquiry or probe action is authorised by this review.

Evidence checked

Read both complete audits from the Mac review copy and verified their supplied SHA-256 hashes:

CORRIDOR-USGS.md: 1751224b2349103dcbdf1dfca69a706455c5117a472e06da5ffe96ef787e0b9b

BIRD-JOURNEY.md: b738ecf8e5c60eaa7e78f8aedf0d4fd7a5f9a816793be08447426350c6ac1d0c

Independently hashed all three source files in Chad's Downloads; all match the supplied hashes. Read the two bird CSVs and selected shapefile geometry and XML directly inside the zip. Confirmed the stated CSV row counts, positioned-row total, bird counts, selected bird fix count, date-line bird totals, geometry sizes/parts/point counts and key class definitions. Did not independently reproduce every audit statistic, Douglas–Peucker count, trial JSON size or path-length calculation.

Read the USGS release's indexed official description, the CC0 deed and the grey-headed paper's methods via its PMC full text. Direct DOI resolution and several repository/catalogue reads failed; do not describe those as successful record reads. Neither bird reference-data CSV was obtained/read in this review. No route shapefile opened.

The enquiries record hash also matches. Its three SENT statuses fairly reflect Chad's confirmation. No inbox checked, messages sent or duplicate enquiries proposed.

1. Do the usable results hold?

Yes, at package/feasibility level. East Walker is a reasonable first corridor candidate, and the waved package is a reasonable first bird candidate. Neither finding approves a final public display. East Walker's small size does not settle class selection or sensitivity, and absence of date-line crossings does not settle bird metadata or quality.

Keep 3275-30662 as the provisional first choice. I confirmed 1,326 positioned fixes, 23 June–15 September 2008, and a maximum positioned-fix gap of approximately 9.004 hours. That is a collection of recorded movements, not necessarily one biological trip. Do not label it a migration or one continuous foraging trip merely because it is rendered as one replay.

2. CC0 versus “retain ownership”

Disclosure point, not an automatic permission blocker. The release's official description marks the product CC0. The local metadata's ownership sentence does not expressly add a permission requirement or noncommercial restriction. Retaining originator status is not itself inconsistent with permitting reuse.

Preserve the source/version and the exact metadata wording, cite USGS and the originators, and identify derived geometry as our processing. CC0 permits copying, modification and commercial reuse without asking permission, subject to its qualifications; avoid implying author endorsement. Citation remains good scientific practice and the project requirement, rather than inventing an attribution condition in CC0.

No USGS or albatross permission email is required merely because the READMEs recommend contact. A later specific ambiguity or sensitivity question can justify a targeted enquiry.

Sources:

https://www.usgs.gov/data/ungulate-migrations-western-united-states-volume-6 (official indexed release description, DOI 10.5066/P1ETBSYE)

https://creativecommons.org/publicdomain/zero/1.0/

3. Important correction: use the class definitions, not the labels

Omitting Sheldon-Hart's “1 individual” class is a reasonable conservative proposal, not a restriction imposed by the licence. It is not proof that all retained classes are insensitive.

The local XML says:

Sheldon-Hart “1 individual”: footprint used by at least one individual.

Sheldon-Hart “Low”: at least two individuals to 5% of the population.

East Walker “Low”: footprint used by at least one individual.

East Walker “Medium”: 10–20% of the sampled population.

East Walker “High”: greater than 20% of the sampled population.

The same low-support issue exists in East Walker under a different name. If the proposed policy is to omit the at-least-one-individual footprint, it must also address East Walker Low. Do not silently declare that class equivalent to Sheldon-Hart Low, or carry thresholds between herds.

Use the actual sampled-animal support definitions in the legend/methods. These classes are not simply a generic low-to-high intensity scale. A union “used by at least one” is also not a claim that every point in it was used by exactly one animal.

Read the selected herd's report/methods section before locking class interpretation. This is a bounded source follow-up, not a demand to audit all herds. Stopover and winter-range disclosure/sensitivity still need their own judgement.

4. Simplification wording needs correction

Audit C's “50 m keeps the features” is too strong. Its own table reports dropped rings. A shapefile feature may contain many outer components and holes; keeping its attribute row does not mean retaining every patch.

My separate ordinary segment-distance Douglas–Peucker trial at 50 m retained 1,268 / 1,071 / 591 points for East Walker corridors / stopovers / winter range, respectively. It collapsed one outer ring in each of stopovers and winter range, each about 5,980 square metres. This was an independent implementation, not a reproduction of Claude's unavailable scratch script; its counts differ slightly from Claude's. It confirms why a preservation claim is unwarranted.

Replace with: “50 m greatly reduces vertex count, but some rings collapse; spatial and topological preservation has not been established.”

Before a build fixes a tolerance, specify the algorithm and dropped-component policy, retain holes with their parent polygons, and validate self-intersections, hole containment and relationships among class layers. Show original/derived comparisons and report component/area changes as well as vertex counts. Independent ring simplification can change topology even when no ring disappears. Do not use the trial bytes-per-point assumption as measured payload or a cost estimate.

Also change “Stopover: the 10% of the corridor used most.” The XML describes the highest 10% of use from the mean population-level utilisation distribution; that is not necessarily 10% of corridor land area. Prefer “High-use stopover areas derived from the population-level movement model,” with the source's precise definition in methods.

Add the winter layer's own sample: East Walker winter range is 190 winter sequences from 94 animals, versus 267 migration sequences from 91 animals for corridors/stopovers. Do not label every panel with the migration sample.

5. Grey-headed bird 90494

Set aside; do not repair by guessing. I confirmed the ISO-formatted source timestamps span 11 January–11 December 2013; the largest gap is approximately 720.1 hours. This is not a locale-parsing mistake introduced by Claude. A day/month mix-up is only a hypothesis.

There is no need to chase that bird before choosing the waved candidate or testing date-line geometry. Record the exclusion; use a different, otherwise checked crossing bird. If 90494 is ever proposed for display, seek an authoritative correction first.

The audit's general October–December / 8–22-day statement needs an explicit exception for 90494. Six birds lacking crossings are six candidates without that particular obstacle, not six fully qualified journeys.

6. Read the reference data before fixing the bird

Yes. The neutral label is not a substitute. Read the selected bird's matched deployment/reference row before final selection. Check tag/animal identifiers, deployment interval, duty cycle, attachment or manipulation comments, deployment site and any recorded limitations. Sex or breeding stage may remain unknown if absent; do not invent them.

Reference-data deployment coordinates are research context, not automatically public-display fields. Keep colony-side precision and any omissions/generalisation as explicit decisions; no blanket safety claim follows from old dates or CC0.

For grey-headed context I independently read Torres et al. (2017), methods: Campbell Island, adult incubation foraging trips, five-minute GPS schedule, colony-near fixes removed. This establishes study-level context, not a repair of 90494 or an individual deployment check. Claude may record this as GPT's reading, not its own.
https://pmc.ncbi.nlm.nih.gov/articles/PMC5207689/

Read the selected waved package's reference row and relevant paper context before naming its trip type. No need to read every bird's biography before a provisional package recommendation.

7. Bird wording and build inputs

Replace “clean GPS file” with a bounded statement: structural checks passed and invalid-position rows were identified. A tag-reported accuracy estimate is not independently measured positional error or an automatic quality pass.

Replace “11 birds barely move … they are not journeys” with “11 records have less than 10 km displacement from their first positioned fix; reasons not established.” Short duration, local movement, deployment effects and tag behaviour cannot be distinguished by displacement alone.

At build planning, define missing-fix and gap handling, time convention, rounding and the retained quality fields. Blank-position rows must not become zeros or interpolated measurements. The measured trial encoding omits accuracy; if displaying an accuracy claim per fix, preserve its association through processing. Set a gap policy from this study's schedule and intended portrayal, not the zebra rule.

Next step for Claude

Correct the audit wording and class comparison, then complete the narrow selected-herd and selected-bird metadata reads. East Walker and 3275-30662 remain preferred provisional candidates. Bring the resulting selection and processing decisions into the build proposal; no need to restart the broad source hunt or send extra emails now.

All three expansion enquiries remain SENT, awaiting replies as reported by Chad. NOAA and ATAP unchanged. Animals implementation remains parked and the Earth from Space probe is untouched.

