# Provider enquiries sent by Chad (record)

**Rule:** sending an enquiry grants no permission, and silence grants none. A reply is filed with its date and who read it, next to the provider's published terms. No duplicate enquiry and no follow-up is sent automatically; any follow-up is Chad's decision. Chad's drafts sign off "Ta". An enquiry is marked sent only when Chad confirms it was sent.
Personal contact details (phone, precise home address) that Chad included are **not recorded in this public repository**. The aircraft enquiries describe the receiver site as "Chad's home, Cape Town, facing the airport, roof access"; antenna height is **unmeasured**, and installation approval is **not assumed**.

*Rev 2, 9 Nov 2026 (GPT's corrections relayed by Chad): CNEOS added; adsb.fi recorded as prepared, not sent; OpenSky's acknowledgement recorded as supplied.*
*Rev 3, 9 Nov 2026: OpenSky's substantive reply on ticket #837506 recorded (section below). The earlier acknowledgement and its conditions are unchanged.*
*Rev 4, 9 Nov 2026: Chad supplied his exact sent enquiry; the reply is now linked to it, with a bounded reading (section below). Personal details in that email are not reproduced.*
*Rev 5, 9 Nov 2026 (GPT's direct review of rev 4): the Q2 rationale corrected (Q3 is also a yes/no question; Q2 stays a plausible contextual interpretation, not a uniquely established answer); the closing-line reading labelled as contextual interpretation. Rev 3's acceptance as an evidence record stands; rev 4 was not accepted verbatim.*

| Sent (as confirmed by Chad) | To | Asked about | Reply |
|---|---|---|---|
| 8 Nov 2026 | USNO, `eopcp@us.navy.mil` (R3 Earth rotation) | commercial reuse; storage, reformatting, redistribution; IERS mirror; attribution; one automated download/day | **pending** (`R3-earth-rotation.md` §9.4a) |
| confirmed 9 Nov 2026 | OpenSky Network, ticket **#837506** (aircraft) | feeder equipment and eligibility; about ten home-connection REST pulls/day; permission to host aggregated snapshots | **acknowledgement supplied** — conditions below; **substantive reply received 9 Nov** (Martin Strohmeier) — linked to the sent enquiry (rev 4), bounded reading below |
| confirmed 9 Nov 2026 | adsb.lol (aircraft) | contributing receiver coverage from Cape Town; recommended equipment; whole-network access; historical alternatives; operational limits; ODbL obligations | **pending** |
| confirmed 9 Nov 2026 | NASA Ozone Watch (R6 ozone) | reuse of the two daily files (area, minimum); public/API redistribution; commercial use; attribution; once-daily retrieval | **pending** (`R6-ozone.md` §9.4a) |
| confirmed 9 Nov 2026 | CNEOS, `contact-cneos@jpl.nasa.gov` (R2 fireballs) | (as sent by Chad; text not in this repo) | **pending** (`R2-terms-access.md`) |
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

**Aircraft scope (Chad, 9 Nov 2026):** reopened **only** for bounded terms/access and feeder clarification. No building, purchase, receiver installation, prototype or deployment. Branch `aircraft-rc` stays parked; never deploy it as-is.
