# Timeline page — UX proposal (rev 2, 9 Nov 2026)

**ACCEPTED as design direction (rev 2, 9 Nov 2026, GPT and Chad).** The partial-date shelf, the one-action evidence controls and the no-JavaScript fallback are all specified. **Carry forward into the build proposal:**
1. **"Read the passage" goes straight to the source** while inline quotation awaits clearance. **The retrieval hash identifies the copy we checked; the live source link may serve a different copy later.** The build shows the checked copy's retrieval date and hash beside the link, worded so a changed page is not presented as what we checked.
2. **Test Back and keyboard focus both ways:**
   - opening from a card returns focus, on close, to the title or shortcut that opened it;
   - **arriving through a direct entry link** (`#e-…`) needs its own close and focus behaviour: with no opener on the page, focus goes to the entry's card on the shelf (or the page heading if it is not rendered), and Back leaves or returns as the browser history dictates;
   - both paths are tested on desktop and phone.

The build proposal covers **one Timeline entry**. **Implementation and the live navigation change each need their own approval.** The opening-page / Met audit stays separate.

**Status: docs-only proposal. Nothing built; no navigation change.**

**Rev 2 (review relayed by Chad, 9 Nov).** The core UX is kept: a separate page, an easy-to-find "Dates without a year" shelf, and "24 August (Julian) · year unstated" on the card. Three points are tightened before any build proposal:
1. **The interaction is explicit** (§5a): the **title opens the entry**; the three evidence items are each one action from there; card shortcuts are separate controls; closing returns focus to the opening control.
2. **The plain-list fallback is specified** (§7a): the Timeline URL shows the entry and usable evidence links with JavaScript off.
3. **Source access is separated from inline quotation** (§5b): a direct source link is the default; inline text appears only once cleared; the evidence is labelled "**one historical account**", kept apart from the scholarly date note.

The build and the live navigation change each need their own approval. The opening-page / Met audit stays on its separate track. Chad's brief (9 Nov): a **separate Timeline page reached through the top navigation**, shown with the one accepted Test B entry: how someone finds it, what they see at a glance, and what opens when they select it.

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
│ │ ▣ One historical account · later recollection │                                │
│ │ ⚑ Date debated                                │                                │
│ └──────────────────────────────────────────────┘                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```
- **The card shows "24 August (Julian) · year unstated"** as its date line, verbatim.
- **The title is the control that opens the entry** (a link to the entry's own address, e.g. `timeline.html#e-pliny-ep-6-16`). The card as a whole is **not** one big click target.
- **Card shortcuts are separate controls**, each its own button next to the date line or chip:
  - **"(Julian)"** opens the entry with **How we converted** already expanded;
  - **"⚑ Date debated"** opens it with **See the debate** already expanded.
  - Neither is a verdict, and neither replaces the title as the way in.
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
│ │ ▣ One historical account │ │
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
│ Pliny, Letters 6.16 §4: a Roman calendar date and    │
│ "about the seventh hour" · [Read the passage ›] (1)  │
│ (inline Latin wording only once cleared — §5b)       │
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
│ · Written after his uncle's death; how long after is │
│   not stated (§1)                                    │
│                                                      │
│ SCHOLARLY NOTE ON THE DATE (separate, attributed)    │
│ ⚑ A 2021 conference abstract reports that the        │
│   classical reading gives 24 August and that some    │
│   scholars propose 24 October · [See the debate ›](3)│
│                                                      │
│ EVIDENCE                                             │
│ One historical account (Pliny, Letters 6.16) ·       │
│ later recollection · no independent corroboration    │
│ Latin only — no translation reached                  │
│ Source link: Latin Library page, Book 6 (edition not │
│   stated by the host) ↗                              │
└──────────────────────────────────────────────────────┘
```

**The three required items, each one click or tap from the open entry:**
| (n) | Control | Opens (inline expander on desktop; the same expander inside the sheet on phone) |
|---|---|---|
| (1) | **Read the passage** | **Default (public build): a direct source link** to the pinned page (Letters Book 6, letter 16, §4–5 and §22), with the § numbers, the host, the retrieval date, the page hash and "edition not stated by the host". **Inline Latin** with the phrase highlighted appears **only once cleared** (§5b) |
| (2) | **How we converted** | the rule in one paragraph: "nonum Kal. Septembres" = the ninth day before the Kalends of September, counted inclusively; Kalends = day 1 → day 9 = **24 August**; Julian calendar; **no Gregorian or proleptic date given**; labelled **ours (T3)** |
| (3) | **See the debate** (scholarly note; kept apart from the historical account) | the S3 statement, **attributed** (authors, 2021, conference abstract, CC BY, where it was read): the classical reading gives 24 August; some scholars propose 24 October; a probable medieval copying error. **"Not adjudicated by Mother Earth."** |

## 5a. Interaction, step by step (desktop and phone)
| Step | Desktop | Phone |
|---|---|---|
| Open the entry | activate the **card title** (click, or Enter on focus) → right panel opens; the shelf and axis stay visible | tap the **card title** → bottom sheet opens at full height |
| Shortcut (optional) | "(Julian)" or "⚑ Date debated" → the same panel, with that expander already open | the same, in the sheet |
| Read the passage / How we converted / See the debate | **one action each** from the open panel | **one tap each** in the sheet |
| Close | ✕, Esc, or selecting another entry | ✕, the drag handle, or the system back gesture |
| **Focus after closing** | **returns to the control that opened it** (the title, or the shortcut used) | **returns to the control that opened the sheet** (the title, or the shortcut used) |

- The entry's address updates when it opens (`#e-pliny-ep-6-16`), so it can be linked and reopened.
- The browser Back button closes the panel or sheet first.

## 5b. Source access vs inline quotation (public build)
- **Default: a direct source link.** The panel names the passage (work, letter, §) and links straight to the pinned host page, with its retrieval date and page hash. That is enough to trace every field.
- **Inline quotation is conditional on clearance.** The test kept excerpts in the private Mac packet. Before a public page quotes the Latin inline, the host's text terms are recorded in REGISTER (e.g. The Latin Library: no terms seen; Perseus: CC BY-SA 3.0 US, which would need attribution and share-alike). **Until cleared:** no inline excerpt; the link only.
- **Our own words are always allowed:** the card date line, the conversion rule and the "what Pliny reports" summaries are our paraphrase and computation, labelled as such.
- **Evidence labels:**
  - the account itself = "**one historical account**";
  - the date dispute = "**scholarly note on the date**" (attributed, separate section);
  - the two are never merged into one count.

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
- **No-JS / list fallback:** see §7a.
- **Performance:** text only; no images. The Timeline's data loads **when someone opens the Timeline page**, and nothing loads on the globe page.

## 7a. Plain-list fallback (JavaScript off)
The Timeline URL works with JavaScript off. The page ships its entries **already in the HTML**, generated at release from the same entry data. Script then enhances them into the axis, shelf and panel. With JavaScript off, a reader sees:

```
Timeline
Dates without a year (1)
  Cloud reported over the Bay of Naples, noticed at Misenum
  24 August (Julian) · year unstated
  Misenum · Bay of Naples (present-day reference)
  One historical account: Pliny, Letters 6.16 — read at the source ↗ (§4–5, §22)
  How we converted (anchor: the rule, in plain text below)
  Scholarly note on the date (anchor: attributed, in plain text below)
  Year not stated by this source · clock time not given (why, in plain text)
Dated entries (0)
```
- Each entry is a heading with its own anchor (`#e-pliny-ep-6-16`).
- **Evidence links work without script:** the source link goes to the host; "How we converted" and "Scholarly note" are in-page anchors to plain sections.
- No content is hidden behind script. Script only changes the layout and adds the panel/sheet.

## 8. Decisions for review
| | Decision | Proposed |
|---|---|---|
| U1 | Navigation | two top tabs, **Earth now** and **Timeline**, on every page; phone = segmented control under the header |
| U2 | Partial dates | a separate "**Dates without a year**" shelf, never on the axis; ordered by day of year; count shown |
| U3 | Date line on the card | "**24 August (Julian) · year unstated**", verbatim |
| U4 | Detail surface | desktop right panel; phone bottom sheet |
| U5 | The three one-step items | Read the passage · How we converted · See the debate, one action each from the opened entry; the **title opens the entry**; shortcuts are separate controls; focus returns to the opener |
| U7 | Source access | **direct source link by default**; inline quotation only after clearance in REGISTER; evidence labelled "one historical account", with the scholarly date note separate |
| U8 | No-JS | entries pre-rendered in the Timeline page's HTML with working links and anchors; data loads only on the Timeline page |
| U6 | Translation | "Latin only — no translation reached" shown until a translation source is cleared |

**Not proposed:** any build, page file, hub endpoint, navigation change on the live site, or change to the globe page. **The build and the live navigation change each need their own approval**, after a separate build proposal. The opening-page / Met audit stays on its own track.

*This proposal authorises nothing beyond its own writing.*
