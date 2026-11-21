# GPT focused review: Animals East Walker corridor proposal rev 2.1 (as relayed by Chad, 21 Nov 2026)

Filed as received (the attached file, unchanged below the line). GPT's text, not Claude's. Not Chad's approval of anything. Chad's message also carried GPT's short summary: the phone-reveal hold is closed and the clarifications accepted; one geometry correction remains in section 5.4 (one inside point per component cannot establish disjointness or containment; two counterexamples); no implementation, merge, deployment or release clearance.

---

Animals — East Walker corridor proposal rev 2.1: focused GPT review

21 November 2026. Docs only.

Supplied commit: 3f755e32459e023fa1f3dc8798ad3840e7edc0be, animals-expansion-proposal.
Independently verified proposal text SHA256: 4fe1f672de0cbdd22cc4dece55850b19a592211469b52f2936b5b71c968bd071.
Read the proposal and separately read the full §§5.4–6.4 after the initial output was truncated. Local exported text verified; commit identity supplied by Claude, not independently established from Git metadata.

Verdict: phone-reveal hold CLOSED. Clarifications accepted. One geometry hold remains in §5.4. Proposal is not yet clear for Chad's build decisions. Recommendations and design are unchanged. No implementation, merge, deployment or release clearance.

Closed

§6.1 and K17/K22 now separate press-time document scrolling from current-action camera intent. No asynchronous answer scrolls the page; stale answers do nothing; picture answers never move the camera. Retry, held success/failure, scroll-away and reduced-motion cases are specified.

The scale-during-motion rule, source/rounded area scopes, total image-request cap and explicit retry, geometry-failure cleanup, bounded view-status wording, fixture provenance and public-branch disclosure answer the rev 2 clarifications. These remain proposed behavior to verify in the eventual candidate.

Remaining geometry hold: a component's inside point does not establish its relation

Checks 19–21 now catch the earlier proper-crossing rectangles. However, zero proper segment crossings plus one inside point per component is still insufficient. The phrase “That is, the two filled interiors are disjoint” does not follow from the preceding test.

Counterexample 1: collinear shared edges with positive-area overlap

Coordinates in metres:

Medium rectangle: x[0,400], y[0,200]; choose its legal inside point (100,100).

High rectangle: x[200,600], y[0,200]; choose its legal inside point (500,100).

Independent integer-arithmetic check: zero proper crossings under §19's definition; both chosen points outside the other fill; 400 m of shared boundary; 40,000 m² of overlapping interior. Both chosen points are 100 m from the other's nearest boundary, so §24's unresolved-point rule does not stop it. §21 can call this bands. Shared boundary is recorded but not used to disambiguate the filled relation. Boundary contacts at segment endpoints also need treatment; strict proper crossings alone do not cover every way boundaries can pass through each other.

Counterexample 2: a High polygon covers a Medium hole

Medium outer square: x[0,1000], y[0,1000], with a square hole x[400,600], y[400,600].

High square: x[300,700], y[300,700].

Legal inside points: Medium (100,100); High (350,350).

There are no boundary crossings or contacts. The High point is in Medium's fill; the Medium point is outside High. Both are well away from the other boundary. §21 labels nested, although High includes all 40,000 m² of Medium's hole and is therefore not contained in Medium's filled area. Testing a single point per outer-with-holes component misses the enclosed hole. Both examples use valid individual class geometry; same-class validity checks do not prevent them.

Focused correction

Specify relations over the complete filled areas:

bands: their filled interiors are disjoint;

nested: every High filled component is wholly contained in Medium's filled area, under an explicit cross-class boundary-contact policy;

mixed: partial overlap, partial containment, reverse containment, or any other inconsistent relation; unresolved stops.

The implementation may use exact polygon operations, a boundary arrangement, or another complete method. A representative point is sufficient only after proving the relevant region cannot change membership; holes and all cross-class boundary contacts must participate in that proof. Simply choosing different points or adding tolerances does not establish it.

For shared edges, endpoint contacts and coincident boundaries, either classify the filled relation with complete evidence or explicitly stop unresolved and report. Recording shared length alone is not sufficient. No source repair is requested.

Carry §23's source/output stop rule over the complete relation evidence, including the contact/overlap distinctions used to decide it. Add both examples above to K1: neither may pass as bands/nested respectively; mixed or a documented unresolved stop is acceptable.

No new source audit, geometry library requirement, feature or broader redesign is requested. Once this one contract is sound, bring the proposal back for closure; do not rebuild the passed Animals stages.

Recommendations carried forward

C-D0 yes; C-D1 A independent switch; C-D2 A Medium/High only; C-D3 A retain vertices with rounding/validity checks; C-D4 A regional imagery with tested fallback B; C-D5 A Stage 4 on animals-tab-rc. These are GPT's recommendations, not Chad's decisions.

Nothing built, merged, deployed or sent. No production or Earthview observation was touched.

