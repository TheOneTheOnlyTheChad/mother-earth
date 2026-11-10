# Provider enquiries sent by Chad (record)

**Rule:** sending an enquiry grants no permission, and silence grants none. A reply is filed with its date and who read it, next to the provider's published terms. No duplicate enquiry and no follow-up is sent automatically; any follow-up is Chad's decision. Chad's drafts sign off "Ta". An enquiry is marked sent only when Chad confirms it was sent.
Personal contact details (phone, precise home address) that Chad included are **not recorded in this public repository**. The aircraft enquiries describe the receiver site as "Chad's home, Cape Town, facing the airport, roof access"; antenna height is **unmeasured**, and installation approval is **not assumed**.

*Rev 2, 9 Nov 2026 (GPT's corrections relayed by Chad): CNEOS added; adsb.fi recorded as prepared, not sent; OpenSky's acknowledgement recorded as supplied.*
*Rev 3, 9 Nov 2026: OpenSky's substantive reply on ticket #837506 recorded (section below). The earlier acknowledgement and its conditions are unchanged.*
*Rev 4, 9 Nov 2026: Chad supplied his exact sent enquiry; the reply is now linked to it, with a bounded reading (section below). Personal details in that email are not reproduced.*
*Rev 5, 9 Nov 2026 (GPT's direct review of rev 4): the Q2 rationale corrected (Q3 is also a yes/no question; Q2 stays a plausible contextual interpretation, not a uniquely established answer); the closing-line reading labelled as contextual interpretation. Rev 3's acceptance as an evidence record stands; rev 4 was not accepted verbatim.*
*Rev 7 ACCEPTED by GPT (9 Nov 2026) as the bounded evidence/linking record: "3. Yes" confirms the specific public aggregate-hosting arrangement (counts per area, no aircraft identifiers or individual tracks) within the standing hobbyist, feeder, credit and attribution conditions; the automatic account link is conditional on feeding for 30%+ of the preceding month, with measurement, window and receiver association unspecified; feeder qualification only partly addressed. No REGISTER change, purchase, installation, aircraft build or production approval.*
*Rev 7, 9 Nov 2026: Chad supplied his exact sent follow-up (screenshot). The second reply is now linked: "3. Yes" answers follow-up Q3 (hosting aggregated snapshots), recorded as affirmative for that specific arrangement within the standing conditions. Q3 and Q1c resolved as below; Q1b partly. Rev 6 text kept as written.*
*Rev 8, 10 Nov 2026 (Chad's go, docs only): replies from **NASA Ozone Watch** (R6) and **CNEOS** (R2) recorded and linked to Chad's exact sent enquiries (sections below). Chad supplied the reply and sent texts as pasted email text plus two screenshots; the screenshots, email addresses, phone numbers and office address are **not** in this repository. Gmail's "Summarize this email" feature was not used. No REGISTER change.*
*Rev 6, 9 Nov 2026: OpenSky's second reply on ticket #837506 recorded verbatim (section below). Its link to the sent follow-up is PENDING: the exact sent follow-up is not yet on record. Earlier correspondence and readings unchanged.*
*Rev 5 ACCEPTED by GPT (9 Nov 2026) as a bounded evidence/interpretation record: Q1b, Q1c and Q3 remain unresolved; Q2 remains a contextual reading, not an explicit answer; the existing feeder, credit and cloud conditions stand. No aircraft clearance and no REGISTER change.*

| Sent (as confirmed by Chad) | To | Asked about | Reply |
|---|---|---|---|
| 8 Nov 2026 | USNO, `eopcp@us.navy.mil` (R3 Earth rotation) | commercial reuse; storage, reformatting, redistribution; IERS mirror; attribution; one automated download/day | **pending** (`R3-earth-rotation.md` §9.4a) |
| confirmed 9 Nov 2026 | OpenSky Network, ticket **#837506** (aircraft) | feeder equipment and eligibility; about ten home-connection REST pulls/day; permission to host aggregated snapshots | **acknowledgement supplied** — conditions below; **substantive reply received 9 Nov** (Martin Strohmeier) — linked to the sent enquiry (rev 4), bounded reading below; **second reply 9 Nov ("…30%+ of the preceeding month" / "3. Yes") recorded rev 6; linked to Chad's sent follow-up rev 7: follow-up Q3 (aggregated snapshots, no identifiers/tracks) = YES within the standing conditions; Q2 account link automatic at 30%+ feeding** |
| confirmed 9 Nov 2026 | adsb.lol (aircraft) | contributing receiver coverage from Cape Town; recommended equipment; whole-network access; historical alternatives; operational limits; ODbL obligations | **pending** |
| confirmed 9 Nov 2026 (the quoted header in the reply shows Sunday 8 Nov 2026, 10:36 PM, as displayed) | NASA Ozone Watch (R6 ozone) | reuse of the two daily files (area, minimum); public/API redistribution; commercial use; attribution; once-daily retrieval | **REPLY RECEIVED** (Gmail-displayed 9 Nov, 10:45 PM): public domain for the two named 2026 files; no licence or permission applies; suggested credit; one automated retrieval per file per day fine; no bulk pulls; best-effort availability — section below (rev 8) |
| confirmed 9 Nov 2026 (the quoted header in the reply shows Sunday 8 Nov 2026, 7:39 PM, as displayed) | CNEOS, `contact-cneos@jpl.nasa.gov` (R2 fireballs) | scope of the SSD public-domain statement across the fireball API catalogue and the lightcurve index/reports; storing, reformatting, public redistribution via website and shared API, non-commercial or commercial; lightcurve retrieval guidance | **PARTLY ANSWERED** (Gmail-displayed 9 Nov, 10:43 PM): "free to use the data for this purpose with the citation"; API cadence preference under 1 request per 10 minutes. Commercial use, lightcurve scope and lightcurve retrieval guidance **open** — section below (rev 8) |
| **not sent** | adsb.fi (aircraft) | prepared; sending not confirmed | — |

## OpenSky ticket #837506 — acknowledgement (as relayed by Chad, 9 Nov 2026)
Stated conditions for the hobbyist / public-site case, recorded alongside the published terms (REGISTER "OpenSky Network" entry):
- no commercial entity and no payments involved;
- the public site must be a **feeder** to the network;
- applicable API **credits** apply;
- **no further written confirmation** is needed for those cases;
- **no whitelisting of cloud servers**.

This is a summary relayed by Chad (via GPT's review packet); the verbatim text is not in this repository. **It is not blanket permission for every redistribution arrangement.** Whether it answers the 9 Nov questions beyond those stated cases (hosting aggregated snapshots; ~10 home-connection pulls/day) is not recorded here; treat them as open unless the acknowledgement's text says otherwise.

## OpenSky ticket #837506 — substantive reply (9 Nov 2026)
**Source and reader:** Chad supplied a screenshot of the message in his Gmail; Claude read the message body from it. Gmail's AI overview was **not** used. The header shows sender "Martin Strohmeier via Opensky", subject "RE: Written agreement request — non-commercial public globe, ~10 REST pulls/day [Ticket#837506]", received "9:02 AM" as Gmail displays it in Chad's local time (not converted; not a measured UTC reading). Signed "Martin — The OpenSky Network".

**Operative sentences (verbatim):** "That works for us. Normal connections need no whitelisting."

**Rest of the message (summary; provider advice, not verified project findings):**
- The standard setup is a Raspberry Pi 3B or 4 with an RTL-SDR stick, which he describes as very affordable.
- Even a basic antenna does quite well placed with a good outdoor view; he linked a product page for one (AliExpress; availability in South Africa not assessed).
- An active antenna is, in OpenSky's experience, a worthy investment that doubles the range. He links one and states explicitly that he **cannot vouch for that product**.
- He recommends the adsb.im image as easy and fully integrated, and says a feeder can be running in about 10 minutes with these things.
- Range, setup time and suitability are **unverified**. No purchase, installation or account is implied or approved.

**The sent enquiry (supplied by Chad, 9 Nov, as a screenshot of his Gmail; read by Claude).**
- Sent from Chad's account to OpenSky, "5:30 AM" as Gmail displays it in Chad's local time (not converted), as a reply in the ticket thread. Subject: "Re: Thanks for your inquiry (Written agreement request — non-commercial public globe, ~10 REST pulls/day) [Ticket#837506]". It quotes OpenSky's 30 Oct 3:48 PM auto-reply, which matches `reviews/round3-opensky-reply.md` (30 Oct, 15:48 SAST).
- **Context Chad gave (summarised; personal details omitted from this public repo):** he understands the hobbyist conditions in OpenSky's acknowledgement and is assessing the feeder route; home in Cape Town facing the airport; roof access, so a rooftop antenna can be investigated **subject to the necessary approvals**; photographs available; antenna height not yet measured.
- **His questions, verbatim:**
  - Q1: "What receiver and antenna setup would you recommend? What contribution and uptime qualify someone as a feeder, and how is feeder status linked to the API account?"
  - Q2: "Would approximately ten REST requests daily from my home connection be acceptable for a public aircraft-distribution globe?"
  - Q3: "Does that allowance include hosting the resulting aggregated snapshots ourselves, without aircraft identifiers or individual tracking?"
  - Closing line: "I'm asking about collection from my own connection, not cloud-server whitelisting."

**Linking the reply to the enquiry (Claude's reading, for GPT and Chad; not a terms finding).**
| Enquiry point | Reply | Reading |
|---|---|---|
| Q1a — recommended receiver and antenna | Pi 3B/4 + RTL-SDR; basic outdoor antenna; active antenna (product not vouched for); adsb.im image | **Answered** (provider advice, unverified) |
| Q1b — contribution and uptime that qualify a feeder | — | **Not answered** |
| Q1c — how feeder status links to the API account | — | **Not answered** |
| Q2 — ~10 REST requests/day from the home connection for a public aircraft-distribution globe | "That works for us." | **Plausible contextual interpretation only.** The sentence opens a reply to a message whose Q2 and Q3 are both yes/no questions; Q2 is a reasonable reading of what "that" accepts, but the reply does **not** state which question it answers, so this is **not an explicit or uniquely established answer**. Read within the conditions Chad's own message cites (the hobbyist acknowledgement and the feeder route), not as replacing them. |
| Q3 — whether that allowance includes hosting aggregated snapshots ourselves, without identifiers or individual tracking | not addressed separately | **Unresolved.** "That works for us" may or may not extend to Q3; the reply does not say. Not read as permission to host or redistribute. |
| Closing line — own connection, not cloud-server whitelisting | "Normal connections need no whitelisting." | **Contextual interpretation:** read against Chad's closing line, it most plausibly means collection from his own home connection needs no whitelisting. Martin did **not** define "normal", so applying it to the home connection is our reading, not his statement. The earlier conditions are unchanged: no whitelisting of cloud servers, the public site must be a feeder, and applicable credits apply. |

**Open after this reply:** Q1b, Q1c and Q3. Whether to ask again is Chad's decision; nothing is sent automatically.

**What this reply does not establish:**
- It does **not** waive the feeder condition (the acknowledgement's "the public site must be a feeder" stands).
- It does **not** establish unlimited credits or any change to applicable credits.
- It does **not** grant blanket redistribution permission, or permission for any arrangement not stated in the exact sent enquiry.
- "Normal connections need no whitelisting" is recorded as stated. It does not say cloud servers will be whitelisted, and the earlier "no whitelisting of cloud servers" condition stands; "normal" is read against Chad's closing line (his own connection); the message does not define it further.

## OpenSky ticket #837506 — second reply (9 Nov 2026) — rev 6
**Source and reader:** Chad supplied a screenshot of the message in his Gmail; Claude read the message body from it. **Gmail's AI overview (Gemini) shown above the message was not used.**
- Sender "Martin Strohmeier via Opensky", to Chad.
- Subject "RE: Written agreement request — non-commercial public globe, ~10 REST pulls/day [Ticket#837506]".
- The header displays **"11:35 AM (1 hour ago)"** on 9 Nov, as Gmail shows it in Chad's local time. Not converted to UTC; not a measured reading.

**Body, verbatim** (including the sender's spelling "preceeding"):
> It's automatic on our side, if you've been feeding for 30%+ of the preceeding month.
> 3. Yes
>
> Best,
> Martin
> --
> The OpenSky Network
> https://opensky-network.org

**What it states (recorded, not extended):**
- **"It's automatic on our side, if you've been feeding for 30%+ of the preceeding month."** This is OpenSky's statement of an automatic, provider-side mechanism, with the criterion **feeding for 30%+ of the preceding month**.
  - The reply does not say what "it" is. It most plausibly refers to feeder status or its link to the API account, which the follow-up was meant to ask about (Q1b, Q1c). **Which question it answers is not verified** until the sent follow-up is on record.
  - **Not inferred:** that Chad's account already qualifies (he does not feed today; no receiver exists); how "30%" is measured (uptime, share of time, messages); how feeding is linked to an account; or what "automatic" grants.
- **"3. Yes"** answers question 3 of the message Martin was replying to.

**Linkage status: PENDING (cannot be verified from the records).**
- The follow-up was drafted for Chad to send. **Its exact sent text, and so its numbering, are not in any saved record.** The rev 4/5 records hold the *original* enquiry's Q3 verbatim: "Does that allowance include hosting the resulting aggregated snapshots ourselves, without aircraft identifiers or individual tracking?" That is the same topic the follow-up was to re-ask.
- **Until Chad supplies the exact sent follow-up** (a screenshot, as for rev 4), "3. Yes" stays **unlinked**, and the earlier status of Q3 (unresolved) is **not changed**.
- **If** the sent follow-up's question 3 is the aggregated-snapshot hosting question, this will be recorded as an **affirmative answer for that specific arrangement** (hosting our aggregated snapshots, without aircraft identifiers or individual tracking), **within the standing hobbyist, feeder and credit conditions**. That is not a blanket redistribution permission, and the feeder condition is not waived.

**Unchanged:** the acknowledgement's conditions (the public site must be a feeder; no whitelisting of cloud servers; applicable credits), the rev 3–5 readings, and the aircraft scope (terms/access and feeder clarification only). No REGISTER filing or status change. No purchase, installation, build or deployment.

## OpenSky ticket #837506 — the sent follow-up and the linked second reply (rev 7)
**The sent follow-up (supplied by Chad, 9 Nov, as a screenshot of his Gmail Sent folder; read by Claude).**
- From Chad to Martin, in the ticket thread. Subject "Re: Written agreement request — non-commercial public globe, ~10 REST pulls/day [Ticket#837506]". Displayed "10:22 AM (2 hours ago)" in Chad's local time (not converted). It quotes Martin's reply of "Mon, Nov 9, 2026 at 9:02 AM" ("That works for us. Normal connections need no whitelisting." …), which matches rev 3.
- Chad's email address appears in the screenshot; it is not reproduced here.
- **Numbered questions, verbatim:**
  1. "What contribution and uptime qualify someone as a feeder?"
  2. "How is feeder status linked to the API account? Is it automatic once the receiver is feeding, or is there a step on our side?"
  3. "Does the ~10 requests/day arrangement also cover hosting the resulting aggregated snapshots on our public site ourselves (counts per area, no aircraft identifiers or individual tracks)?"
- Also: "Links to existing docs are welcome if these are already covered." Signed "Ta, Chad". The opening line ("Sorry to bother you again, last one today I promise") is recorded only as context.

**Linking Martin's second reply (11:35 AM displayed) to it:**
| Follow-up question | Reply | Reading |
|---|---|---|
| **3** — does the ~10 requests/day arrangement cover hosting the resulting aggregated snapshots on our public site ourselves (counts per area, no aircraft identifiers or individual tracks)? | "3. Yes" | **Answered: YES, explicitly numbered.** An affirmative answer for **that specific arrangement only**: aggregated snapshots (counts per area), hosted on our own public site, from the ~10 requests/day arrangement, with **no aircraft identifiers and no individual tracks**. It stands **within the standing conditions**: hobbyist use, the public site must be a feeder, applicable credits, and the OpenSky credit/attribution conditions. **Not** blanket redistribution permission; it does **not** cover identifiers, tracks, raw data or any other arrangement. |
| **2** — how feeder status links to the API account; automatic once feeding, or a step on our side? | "It's automatic on our side, if you've been feeding for 30%+ of the preceeding month." | **Answered (wording matches the question's own "automatic"):** the link is automatic on OpenSky's side, conditional on feeding for **30%+ of the preceding month**. **Not stated:** how the 30% is measured (time, days, messages), which month counts (calendar or rolling), or how a receiver is associated with the account. None of this is inferred. **Chad's account does not qualify now:** no receiver exists, and nothing is fed. |
| **1** — what contribution and uptime qualify someone as a feeder? | not answered separately | **Partly addressed, by contextual reading only:** "feeding for 30%+ of the preceding month" is the only stated criterion. It plausibly states the uptime threshold, but it is phrased as the condition for the automatic account link. **Any other contribution requirement is not stated.** |

**Status after rev 7:**
- Q3 (hosting aggregated snapshots, no identifiers or tracks): **affirmative for that arrangement, within the conditions**. Supersedes the rev 4/5 "unresolved" for this arrangement.
- Q1c (account link): **answered as above.**
- Q1b (feeder qualification): **partly**; the 30%+-of-preceding-month criterion is stated, everything else is unspecified.
- **Unchanged:**
  - the feeder condition is **not waived**;
  - there is no whitelisting of cloud servers;
  - applicable credits apply;
  - Q2's "That works for us" stays a contextual reading (rev 5).
- **Nothing filed in REGISTER. Aircraft scope unchanged:** terms/access and feeder clarification only; no purchase, installation, build or deployment.

**Aircraft scope (Chad, 9 Nov 2026):** reopened **only** for bounded terms/access and feeder clarification. No building, purchase, receiver installation, prototype or deployment. Branch `aircraft-rc` stays parked; never deploy it as-is.

## NASA Ozone Watch — reply (rev 8, recorded 10 Nov 2026)
**Source and reader:** Chad supplied the reply as pasted email text plus a screenshot of the signature block; Claude read both. Gmail's "Summarize this email" feature was **not** used. Received **9 Nov, 10:45 PM as Gmail displays it** (supplied by Chad; Gmail-displayed time, no timezone assigned, not converted).

**Sender:** Leslie R. Lait. Affiliation as the signature shows it: **NASA, ARC-SG, Code 614, Goddard Space Flight Center**. Leslie sent the reply; **Paul A. Newman was copied** (as stated by Chad; the copy line is not in the supplied screenshot). Email addresses, phone number and office address in the signature are not recorded here.

**The sent enquiry (verbatim questions; from the copy quoted in the reply).** Addressed "Hello Dr. Lait and Dr. Newman". Quoted header: Sunday, November 8, 2026 at 10:36 PM (as displayed; not converted). The subject line as sent consisted of an email address (omitted here). Chad's phone number and email address are omitted.
- Files named: `to3areas_2026_toms+omi+omps.txt` and `to3mins_2026_toms+omi+omps.txt`, both published under `https://ozonewatch.gsfc.nasa.gov/meteorology/figures/ozone/`.
- Intended use, as stated: "downloading, storing and reformatting their values, displaying dated charts or readings, and supplying the displayed numerical data through our shared API. We would credit NASA Ozone Watch, link the source and identify our transformations."
- Q1: "What licence or permission applies to these derived files, including public redistribution and commercial use?"
- Q2: "Do any third-party rights or additional conditions apply?"
- Q3: "What credit wording and modification notices are required?"
- Q4: "Would one automated retrieval per file per day be acceptable? Are there preferred access methods or operational limits?"
- Also stated: daily statistics would be distinguished from forecasts; missing values and source limitations preserved.

**Reply, operative text (verbatim, including the sender's wording "United State Government"):**
> 1. […] As products of the United State Government, these data are in the public domain. There are no licenses or permissions that apply, aside from the general ethical standards of the scientific community regarding proper credit, transparency, etc., with which (judging from your email) you seem already to be familiar.
> 2. […] No third-party rights or additional conditions apply.
> 3. […] Something along the lines of "Data are courtesy of the NASA Ozone Watch website ( https://ozonewatch.gsfc.nasa.gov)" should be sufficient.
> 4. […] One automated retrieval per file per day would be fine. You may use any tool you wish (web browsers, curl, wget, custom python scripts, etc.) to access our site. We would request that people not attempt to transfer large portions of the site's files all at once, since our small server can easily be overwhelmed by large-scale accesses running simultaneously. (People are free to "sip" our data all they like, but they should not "chugalug" it.) The two files that you mentioned should present no problem.
>
> Please be advised, however, that this website is presented on an as-is, best-effort basis with no guarantees of availability. If the U.S. Government should undergo another shutdown in December, for example, our website may not be updated in a timely manner, or it may even be shut down.

(`[…]` marks where the reply restates Chad's question before answering.)

**Linking the reply to the enquiry:**
| Question | Reply | Recorded as |
|---|---|---|
| Q1 — licence/permission, incl. public redistribution and commercial use | public domain as U.S. Government products; no licences or permissions apply, aside from scientific-community ethical standards (credit, transparency) | **Answered, explicitly:** the provider states the data are public domain and that no licence or permission applies. Q1 named public redistribution and commercial use, and the answer carries no exception for either. Scope: **the two named 2026 files** (below). |
| Q2 — third-party rights or additional conditions | "No third-party rights or additional conditions apply." | **Answered, explicitly.** |
| Q3 — credit wording and modification notices | suggested credit line (above), "should be sufficient" | **Credit answered** (a suggested wording, "along the lines of"). **Modification notices not addressed separately**; identifying our transformations remains our stated intention (and the scientific "transparency" standard the reply mentions), not a provider-specified form. |
| Q4 — one automated retrieval per file per day; methods; limits | "would be fine"; any tool; no large-scale simultaneous transfers ("sip", not "chugalug"); the two files "should present no problem" | **Answered, explicitly** for one retrieval per file per day. **Carried forward as conditions:** no bulk or simultaneous large-scale transfers. No numerical limit beyond that is stated. |
| (unasked) availability | as-is, best-effort, no availability guarantee; a U.S. Government shutdown (December given as an example) could delay updates or take the site down | **Carried forward as a source limitation** for any later use. |

**Bounds (what this reply does not establish):**
- It names and answers for **the two 2026 files** asked about. Other Ozone Watch files, other years' files and the site's images/maps are not covered by this reply.
- It is a statement by one NASA staff member answering on the project's behalf; it is recorded as the provider's reply, not as a legal opinion.
- **It does not clear R6 for building.** R6's technical gates stay open (`R6-ozone.md` §8, §9). No REGISTER filing or status change: the updated draft (`R6-ozone.md` §9.6) awaits GPT's review and then Chad's separate approval.

## CNEOS — reply (rev 8, recorded 10 Nov 2026)
**Source and reader:** Chad supplied the reply as pasted email text plus a screenshot of the message; Claude read both. Gmail's "Summarize this email" feature was **not** used. Received **Mon 9 Nov, 10:43 PM as Gmail displays it** (visible in the screenshot; Gmail-displayed time, no timezone assigned, not converted).

**Sender:** Shantanu P. Naidu, JPL (display label "US 324H" as shown), to Chad with the CNEOS mailbox copied. Signed "Shantanu". Subject "Re: [EXTERNAL] Fireball API and lightcurve files — scope of SSD public-domain statement". His email address is not recorded here.

**The sent enquiry (verbatim; from the copy quoted in the reply).** Quoted header: Sunday, November 8, 2026 at 7:39 PM (as displayed; not converted). Subject "[EXTERNAL] Fireball API and lightcurve files — scope of SSD public-domain statement" (the "[EXTERNAL]" tag as quoted). Chad's phone number and email address are omitted.
> I've read the SSD FAQ's statement that site data are considered public domain, the API fair-use policy, and the CNEOS fireball and lightcurve guidance. My question concerns the statement's scope across these two routes:
> - Fireball catalogue: https://ssd-api.jpl.nasa.gov/fireball.api
> - Lightcurve index and downloadable report files: https://cneos.jpl.nasa.gov/fireballs/lc/
>
> Does the SSD public-domain statement apply to both, including storing, reformatting and publicly redistributing their numerical data through a website and shared API, for non-commercial or commercial use? If the lightcurve files have separate conditions, please identify them.
> We would cite SSD/CNEOS with retrieval date, page title and URL, identify transformations, avoid implied endorsement, and retain the warnings about government-sensor provenance, revisions and lack of independent verification.
> For automated access, we would follow the API fair-use policy. Is there separate guidance for retrieving the lightcurve index and reports, including preferred cadence, caching or load limits?

**Reply body (verbatim):**
> Hi Chad,
>
> You are free to use the data for this purpose with the citation.
>
> For API query cadence, we would prefer that you keep the requests under 1 every 10 minutes. As guidance, the fireball database changes around once a month, so it doesn't make sense to query it too frequently.
>
> Best,
> Shantanu

**Linking the reply to the enquiry:**
| Enquiry point | Reply | Recorded as |
|---|---|---|
| Use of the data for the stated purpose (storing, reformatting, public redistribution via website and shared API) | "You are free to use the data for this purpose with the citation." | **Answered, preserved verbatim.** Permission for "this purpose", conditional on "the citation". *Contextual reading:* "the citation" most plausibly refers to the citation the enquiry described (SSD/CNEOS with retrieval date, page title and URL); the reply does not define it. |
| Non-commercial **or** commercial use | not addressed separately | **Open.** The enquiry put the two as alternatives; "this purpose" does not say which is covered. **Explicit commercial-use confirmation is not established.** |
| Whether the SSD statement covers both routes; separate conditions for the lightcurve files | not addressed separately | **Open.** "the data" is not tied to a route. **Lightcurve reuse scope (S2) is not established.** |
| API cadence (implicit in "we would follow the API fair-use policy") | "we would prefer that you keep the requests under 1 every 10 minutes"; the fireball database changes around once a month | **Recorded as a stated preference** of fewer than one API request every 10 minutes, with the catalogue changing roughly monthly. It sits beside the published fair-use conditions, not in place of them. |
| Lightcurve index and report retrieval guidance (cadence, caching, load) | not addressed | **Open.** The API cadence preference is not extended to the lightcurve files. |

**Open after this reply, pending the follow-up:** explicit commercial-use confirmation; lightcurve reuse scope; automated lightcurve retrieval guidance. Whether and when to follow up is Chad's decision; nothing is sent automatically. No REGISTER filing or status change: the updated draft (`R2-terms-access.md` §4) awaits GPT's review and then Chad's separate approval. R2's identity and validation gates stay open.
