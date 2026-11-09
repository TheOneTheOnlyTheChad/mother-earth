# Timeline page — UX proposal (rev 1, 9 Nov 2026)

**Status: docs-only proposal, for review. Nothing built; no navigation change.** Chad's brief (9 Nov): a **separate Timeline page reached through the top navigation**, shown with the one accepted Test B entry: how someone finds it, what they see at a glance, and what opens when they select it.

**Requirements:**
- "**24 August (Julian) · year unstated**" visible on the entry;
- a home for **partial-date entries** that is discoverable **without placing the entry at 79 CE**;
- the **exact passage**, **our conversion rule** and the **attributed date dispute** each **one click or tap away**.

**Separate from** the opening-page / Met-placement audit (its own docs track); this proposal changes nothing on the globe page.

**The entry used:** Test B (closed). Pliny, *Letters* 6.16, §4–5, §22; S1 = The Latin Library page (edition not stated by the host).
- Four supported claims (the reported notice's date, its Roman hour, Misenum, Vesuvius identified later) plus one absence finding (**year not stated**).
- 24 August is **our Julian conversion** of the page's reading.
- The date dispute is attributed to S3 (a 2021 conference abstract).
- Modern clock time is unset.

## 1. Principles carried into the page
- **Separate page, same hub:** the globe stays the opening page. The Timeline is its own page; later it reads its entries from the hub (constitution: the page is a client). Docs only here.
- **We force no view:** no lines, arrows or "led to" links between entries; no ordering beyond what each entry's own date supports.
- **A position is a claim:** an entry is placed on the axis **only at a precision the evidence supports**. An entry without a year gets **no year position at all**, not a guessed one and not 79 CE.
- **Every field traces:** to a passage, our stated conversion, or a visible gap (as in the mock entry).

## 2. How someone finds it
**Top navigation**, added to the existing header on every page:

```
┌────────────────────────────────────────────────────────────────────────┐
│ MOTHER EARTH   [ Earth now ]  [ Timeline ]            Sources · Menu ☰ │
└────────────────────────────────────────────────────────────────────────┘
```
- Two tabs: **Earth now** (today's globe, unchanged) and **Timeline**. The current page's tab is marked (`aria-current="page"`).
- **Phone (≤ 720 px):** the two tabs sit as a slim segmented control under the header; "Sources · Menu" stay in the menu.
- **Inside the Timeline:**
  - entries with a year sit on the axis;
  - entries **without a year** sit in a labelled shelf, "**Dates without a year**", with a count;
  - a search box finds entries by place, person or source.

## 3. At a glance: desktop (≥ 1101 px)
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ MOTHER EARTH   [ Earth now ]  [■Timeline ]                    Sources · Menu ☰   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Timeline · what written and physical sources state, with their dates as given    │
│ [ Search place, person, source…          ]   Show: ☑ dated  ☑ dates without a year│
├──────────────────────────────────────────────────────────────────────────────────┤
│ DATED ENTRIES (placed at the precision their sources support)                    │
│ ──┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬── │
│   │              │              │              │              │              │   │
│       (no dated entries yet in this mock)                                        │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ DATES WITHOUT A YEAR  (1)   — shown here, not on the axis, because their         │
│                              source gives a day or month but no year             │
│ ┌──────────────────────────────────────────────┐                                 │
│ │ Cloud reported over the Bay of Naples,       │                                 │
│ │ noticed at Misenum                           │                                 │
│ │ 24 August (Julian) · year unstated           │                                 │
│ │ Misenum · Bay of Naples (present-day ref.)   │                                 │
│ │ ▣ Written account · later recollection · 1 src│                                │
│ │ ⚑ Date debated                                │                                │
│ └──────────────────────────────────────────────┘                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```
- **The card shows "24 August (Julian) · year unstated"** as its date line, verbatim.
- **"(Julian)"** links (hover/focus tooltip, click to open) to the conversion rule.
- **"⚑ Date debated"** is a chip, not a verdict; it opens the attributed dispute.
- **The shelf is ordered by month and day only** (a day-of-year order, labelled as such). Nothing implies a year.

## 4. At a glance: phone (390 px)
```
┌──────────────────────────────┐
│ MOTHER EARTH        Menu ☰   │
│ [ Earth now | ■Timeline ]    │
├──────────────────────────────┤
│ [ Search…                  ] │
│ Dated (0) · No year (1) ▾    │
├──────────────────────────────┤
│ DATES WITHOUT A YEAR (1)     │
│ ┌──────────────────────────┐ │
│ │ Cloud reported over the  │ │
│ │ Bay of Naples, noticed   │ │
│ │ at Misenum               │ │
│ │ 24 August (Julian) ·     │ │
│ │ year unstated            │ │
│ │ ▣ Written · later recoll.│ │
│ │ ⚑ Date debated           │ │
│ └──────────────────────────┘ │
│ DATED (0)                    │
│ (vertical axis when entries  │
│  exist; same rules)          │
└──────────────────────────────┘
```
- On phones the axis runs **vertically**. The "No year" shelf is a section at the top, with its count in the filter line, so it is found without scrolling an axis.

## 5. What opens when the entry is selected
**Desktop:** a right-hand **detail panel** (the axis and shelf stay visible). **Phone:** a **bottom sheet** that expands to full height. Same content and order.

```
┌──────────────────────────────────────────────────────┐
│ Cloud reported over the Bay of Naples,               │
│ noticed at Misenum                              ✕    │
│ 24 August (Julian) · year unstated                   │
├──────────────────────────────────────────────────────┤
│ WHEN — AS THE SOURCE SAYS                            │
│ «Nonum Kal. Septembres hora fere septima»            │
│ Pliny, Letters 6.16 §4 · [Read the passage ›]   (1)  │
│                                                      │
│ WHEN — OUR CONVERSION                                │
│ 24 August, Julian calendar — our conversion of this  │
│ page's reading · [How we converted ›]           (2)  │
│ Hour: "about the seventh hour" (as written) — the    │
│ hour beginning at local midday · clock time not      │
│ given [Why ›]                                        │
│ Year: not stated by this source [Why ›]              │
│                                                      │
│ WHAT PLINY REPORTS                                   │
│ · Pliny reports that his mother pointed out the      │
│   cloud to his uncle, who commanded the fleet at     │
│   Misenum (§4)                                       │
│ · He writes that it was learned later that the cloud │
│   came from Vesuvius (§5)                            │
│ · He says he set down what he witnessed and what he  │
│   heard soon afterwards, without marking which       │
│   detail is which (§22)                              │
│                                                      │
│ UNCERTAIN                                            │
│ ⚑ The date is debated — a 2021 scholarly abstract    │
│   attributes 24 August to the classical reading and  │
│   reports a proposed 24 October · [See the debate ›] │
│                                                 (3)  │
│ · Written after his uncle's death; how long after is │
│   not stated (§1)                                    │
│                                                      │
│ EVIDENCE                                             │
│ Written account · later recollection · 1 source ·    │
│ no independent corroboration                         │
│ Latin only — no translation reached                  │
│ Sources: S1 Latin Library page (edition not stated)  │
│          S3 EGU 2021 abstract (attributed)           │
└──────────────────────────────────────────────────────┘
```

**The three required items, each one click or tap from the open entry:**
| (n) | Control | Opens (inline expander on desktop; the same expander inside the sheet on phone) |
|---|---|---|
| (1) | **Read the passage** | Letter 6.16 §4–5 (and §22) in Latin from the pinned page, with the date and hour phrase **highlighted**, the § numbers, the host, the retrieval date, and the page hash; "edition not stated by the host" |
| (2) | **How we converted** | the rule in one paragraph: "nonum Kal. Septembres" = the ninth day before the Kalends of September, counted inclusively; Kalends = day 1 → day 9 = **24 August**; Julian calendar; **no Gregorian or proleptic date given**; labelled **ours (T3)** |
| (3) | **See the debate** | the S3 statement, **attributed** (authors, 2021, conference abstract, CC BY, where it was read): the classical reading gives 24 August; some scholars propose 24 October; a probable medieval copying error. **"Not adjudicated by Mother Earth."** |

**Gaps are visible, not hidden:** "Why ›" next to the clock time and the year opens a single sentence each. Clock time: daylight at Misenum was not established. Year: no year in the letter (whole-letter check).

## 6. The partial-date rule (how future entries behave)
| Evidence gives | Where it appears |
|---|---|
| year (± range) | on the axis, at that precision (a range shows as a span) |
| day and month, **no year** | the **Dates without a year** shelf only; ordered by day of year; card says "**[day month] ([calendar]) · year unstated**" |
| a year from **another** source (e.g. a scholar's "AD 79") | **not** used to place the entry. It may appear inside the entry as an attributed statement, never as the entry's position |
| no date at all | not a timeline entry (it can live as a source note) |

A later proposal could let a reader **choose** to see "where scholars place it". That would be a separate, attributed layer that the reader turns on; it is not proposed here.

## 7. Behaviour and accessibility (to review, not build)
- **Keyboard:** tabs, search, filters, cards, and the three expanders all reachable. Enter/Space opens. Esc closes the panel or sheet and returns focus to the card.
- **Screen readers:** the card reads as "Cloud reported over the Bay of Naples, noticed at Misenum; 24 August, Julian; year unstated; date debated; button". Expanders carry `aria-expanded`. The shelf has a heading with its count.
- **Phone:** the sheet has a drag handle and a close button. Its content scrolls, not the page. No horizontal scroll at 360 px.
- **No-JS / list fallback:** the shelf and entries render as a plain list.
- **Performance:** text only; no images; nothing loads until the Timeline tab is opened.

## 8. Decisions for review
| | Decision | Proposed |
|---|---|---|
| U1 | Navigation | two top tabs, **Earth now** and **Timeline**, on every page; phone = segmented control under the header |
| U2 | Partial dates | a separate "**Dates without a year**" shelf, never on the axis; ordered by day of year; count shown |
| U3 | Date line on the card | "**24 August (Julian) · year unstated**", verbatim |
| U4 | Detail surface | desktop right panel; phone bottom sheet |
| U5 | The three one-step items | Read the passage · How we converted · See the debate, as inline expanders |
| U6 | Translation | "Latin only — no translation reached" shown until a translation source is cleared |

**Not proposed:** any build, page file, hub endpoint, navigation change on the live site, or change to the globe page. A build would follow review, with its own proposal and approvals.

*This proposal authorises nothing beyond its own writing.*
