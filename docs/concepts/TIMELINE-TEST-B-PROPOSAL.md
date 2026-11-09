# Timeline Test B — one written-history case: PROPOSAL (rev 2, 9 Nov 2026)

**Status: proposal only. Nothing read or searched.** Chad's brief (9 Nov): one written-history case where the relevant source text can be reached and **each field of a timeline entry can be traced to the exact passage, our stated conversion, or a gap left visible.** The question: **what can Mother Earth actually show someone?** The run needs its own go.

**Rev 2 (Chad, after GPT, 9 Nov):**
- the claim is the **reported sighting/notice of the cloud**;
- the Latin edition is pinned, with its date wording kept exact;
- the conversion rule is stated and the result labelled as a conversion of that edition's reading;
- the Roman hour is kept as written, with a modern range only if justified;
- the mock entry separates Pliny's own recollection, what he reports others did or said, and what he says was learned later;
- **the Latin text is the only readability gate**;
- one scholarly date check is capped at 5 min;
- letter 6.20 is out.

**Labels:** [general knowledge, unverified] = background knowledge, to be read in the run; nothing rests on it being right.

## 1. Case and readability
- **Case:** the eruption of Vesuvius as told in Pliny the Younger, *Letters* 6.16 (to Tacitus). **One passage, one mock entry.**
- **Readability: flagged.** No written-history source in this project is yet known to be readable. **The only gate is the Latin text** (§4 step 1). The English translation is not a gate: if it is unavailable, the run carries on with the Latin.
- **Why this case [general knowledge, unverified]:**
  - the letter gives a Roman calendar date and a Roman hour for when the cloud was noticed;
  - it says who noticed it (the writer's mother, telling his uncle);
  - it says the mountain was identified only later;
  - it is not expected to state a year.

  So one passage exercises the source's wording, our conversion, the writer's sourcing, and a visible gap.

## 2. Sources (fixed order; text only)
| Key | Role | Candidate route [unverified] | Use |
|---|---|---|---|
| **S1** | **The source**: a public-domain Latin edition of *Letters* 6.16 | plain-HTML text (e.g. The Latin Library, Latin Wikisource) | **the evidence and the only readability gate**. The edition is **pinned**: editor/edition and year as the page states, plus URL, retrieval time, and page hash or revision. If no edition is named, that is recorded as **"edition not stated by the host"**. Its **date and hour wording is kept exactly**. Passages under 15 words, Mac only |
| S2 | A public-domain English translation | e.g. English Wikisource, Perseus | **display only**, credited (translator, year). **Not evidence**; S1 governs. If unavailable: carry on, and the entry shows Latin only |
| S3 | **One scholarly statement on the date question** | one bounded exact search for open, readable text | **≤ 5 min inside the 45-min cap.** Shown only if readable and on point. **If nothing usable: "date question: not assessed"** |

Text only, no PDF, no images, no login or purchase. One request at a time; site approvals by Chad. **Letter 6.20 is out of scope.**

## 3. Claims (fixed before reading)
| ID | Claim (what the entry would state) | What S1 is expected to give [unverified] | Ours (T3), only under the stated rule |
|---|---|---|---|
| **B1** | **Date of the reported sighting/notice of the cloud**, as the letter reports it. Called "first sighting" or "start of the eruption" **only if the passage says so** | a Roman calendar expression (*a.d.* N *Kal.* [month]), kept **verbatim from the pinned edition** | **Conversion rule:** Roman inclusive counting back from the Kalends of the named month (the Kalends = day 1, counted as day 1 of N), giving a **day and month in the Julian calendar**. Labelled "**conversion of [edition]'s reading**". No proleptic or Gregorian equivalent is given. |
| **B2** | **Year** | **not stated** | **left unset**: "year not stated by this source" |
| **B3** | **Time of day** of the reported notice | a Roman hour expression, **kept as written** ("about the n-th hour") | **a modern clock-time range only if justified.** It would need the converted day (B1), Misenum's latitude, a stated seasonal-hour model (daylight divided into twelve hours from sunrise) and the word "about". **If any of these is not established, no range is given and the gap is shown.** |
| **B4** | **Place**: where the uncle was when the cloud was noticed (Misenum, with his command) | named in the letter | present-day location reference (Bay of Naples, Italy), labelled ours |
| **B5** | **Which mountain** | the source says it was **learned later** that the cloud came from Vesuvius | none: kept as the source's own retrospective statement |

**Dispositions** as in Test A (supported · not stated · contradicted · inaccessible · not checked), matched to the exact passage by letter and section.

**Voice of each statement**, recorded per claim:
- **(a) Pliny's own recollection**;
- **(b) what he reports others did or said**, e.g. his mother pointing the cloud out, his uncle's actions;
- **(c) what he says was learned later**.

## 4. Run shape and caps (45 min total)
1. **Latin readability gate, ≤ 10 min:** reach S1 as text and pin the edition. **If S1 is unreadable: stop, Test B inconclusive** (no switch of case).
2. **S2 translation, inside step 1's or step 3's time:** if not reached, carry on.
3. **Passage tracing, ≤ 20 min:** code B1–B5 against S1 and record the voice of each.
4. **S3 scholarly date check, ≤ 5 min.**
5. **Mock entry and write-up, the remainder (≥ 10 min).**

Mac clock; packet in the Mac folder; the repo gets IDs, routes and dispositions only. The mock entry is **text in the report, not a page**: no page, tab or build work.

## 5. The mock entry: every field traceable
> **Cloud reported over the Bay of Naples, seen from Misenum** · *present-day reference: Bay of Naples, Italy (ours)* · field source: **S1 §[n]**
>
> **When, as the source says:** «[Latin date phrase, exact, pinned edition]» · «[Latin hour phrase, exact]» → **S1 §[n]**
> **When, our conversion:** [day month], Julian calendar: *conversion of [edition]'s reading* by the stated rule → **method note** · **hour:** [modern range, or "no range given: [missing assumption]"] → **method note / gap**
> **Year:** **not stated by this source** → **gap (visible)**
>
> **Who says what:**
> - *Pliny reports others:* [his mother's notice to his uncle; his uncle's actions at Misenum] → **S1 §[n]**
> - *Pliny's own recollection:* [what he says of himself in 6.16, if anything] → **S1 §[n]** or "none in this passage"
> - *Learned later, per Pliny:* the cloud's mountain was Vesuvius → **S1 §[n]**
>
> **Uncertain:** a later written account (T2-r), partly relaying others → **S1 §[n]** · **date question:** [one readable scholarly statement, attributed → **S3**] **or "not assessed"** → **gap**
>
> **Evidence grade:** written account, later recollection (T2-r) · 1 source · no independent corroboration counted
>
> *Display translation:* [translator, year], or "Latin only: no translation reached" → **S2 / gap**

**Rule:** every field ends in one of three things: an **exact passage** (S1 §), **our stated conversion** (method note), or a **visible gap**. Nothing is shown as fact that the source does not state.

## 6. Decisions (rev 2 reflects Chad's direction)
| | Decision | Now |
|---|---|---|
| T1 | Case | Vesuvius, Pliny *Letters* 6.16 |
| T2 | Claims | B1–B5 as above (B1 = reported sighting/notice) |
| T3 | Sources | S1 Latin (evidence; the only gate) + S2 translation (display; optional) |
| T4 | Cap and stop rule | 45 min; stop only if S1 is unreadable (≤ 10 min) |
| T5 | S3 scholarly date check | included, ≤ 5 min; nothing usable → "not assessed" |
| T6 | Letter 6.20 | out |

*This proposal authorises nothing beyond its own writing.*
