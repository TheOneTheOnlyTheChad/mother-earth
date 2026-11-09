# Provider enquiries sent by Chad (record)

**Rule:** sending an enquiry grants no permission, and silence grants none. A reply is filed with its date and who read it, next to the provider's published terms. No duplicate enquiry and no follow-up is sent automatically; any follow-up is Chad's decision. Chad's drafts sign off "Ta". An enquiry is marked sent only when Chad confirms it was sent.
Personal contact details (phone, precise home address) that Chad included are **not recorded in this public repository**. The aircraft enquiries describe the receiver site as "Chad's home, Cape Town, facing the airport, roof access"; antenna height is **unmeasured**, and installation approval is **not assumed**.

*Rev 2, 9 Nov 2026 (GPT's corrections relayed by Chad): CNEOS added; adsb.fi recorded as prepared, not sent; OpenSky's acknowledgement recorded as supplied.*
*Rev 3, 9 Nov 2026: OpenSky's substantive reply on ticket #837506 recorded (section below). The earlier acknowledgement and its conditions are unchanged.*

| Sent (as confirmed by Chad) | To | Asked about | Reply |
|---|---|---|---|
| 8 Nov 2026 | USNO, `eopcp@us.navy.mil` (R3 Earth rotation) | commercial reuse; storage, reformatting, redistribution; IERS mirror; attribution; one automated download/day | **pending** (`R3-earth-rotation.md` §9.4a) |
| confirmed 9 Nov 2026 | OpenSky Network, ticket **#837506** (aircraft) | feeder equipment and eligibility; about ten home-connection REST pulls/day; permission to host aggregated snapshots | **acknowledgement supplied** — conditions below; **substantive reply received 9 Nov** (Martin Strohmeier) — antecedent unresolved, see below |
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

**What "That works for us" refers to — UNRESOLVED.**
- The reply answers a message in the ticket thread. The exact text Chad sent on 9 Nov is **not in the saved records**. Searched 9 Nov: this repository, the Project docs and the Mac folder `~/Documents/Mother Earth` (the only OpenSky texts on file are this record's one-line topic summary and the 30 Oct auto-reply in `reviews/round3-opensky-reply.md`, Mac only).
- The topic summary in the table above (feeder equipment and eligibility; about ten home-connection REST pulls/day; hosting aggregated snapshots) is Claude's record of the subjects, **not the enquiry's wording**. The email's subject line ("non-commercial public globe, ~10 REST pulls/day") shows the thread, not which proposal the sentence accepts.
- **No scope conclusion is drawn** until the reply is linked to the exact sent text. If Chad supplies that text, the link is recorded here; that would be Chad's choice, not a follow-up to OpenSky.

**What this reply does not establish:**
- It does **not** waive the feeder condition (the acknowledgement's "the public site must be a feeder" stands).
- It does **not** establish unlimited credits or any change to applicable credits.
- It does **not** grant blanket redistribution permission, or permission for any arrangement not stated in the exact sent enquiry.
- "Normal connections need no whitelisting" is recorded as stated. It does not say cloud servers will be whitelisted, and the earlier "no whitelisting of cloud servers" condition stands; which connections count as "normal" is not defined in the message.

**Aircraft scope (Chad, 9 Nov 2026):** reopened **only** for bounded terms/access and feeder clarification. No building, purchase, receiver installation, prototype or deployment. Branch `aircraft-rc` stays parked; never deploy it as-is.
