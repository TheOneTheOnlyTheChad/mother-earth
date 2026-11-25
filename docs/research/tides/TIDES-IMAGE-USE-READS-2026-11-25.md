# Tides: image-use reads for the two reference images

**25 Nov 2026, 14:27 UTC (clock reading at writing). Docs only.** Read directly by Claude in the browser pane on Chad's Mac, about 14:30–14:40 UTC the same day. These are the "gate" reads of `docs/concepts/TIDES-EXPLORER-PROPOSAL.md` rev 2, section 2. **No image has been fetched or kept.** REGISTER is not changed by this note; its lines are for the release, on Chad's own Approve.

## Earth: NASA GIBS frame kept as a dated reference

1. **GIBS API documentation, "Data Use Guidance and Acknowledgements"** — https://nasa-gibs.github.io/gibs-api-docs/#data-use-guidance-and-acknowledgements . It says NASA promotes full and open sharing of data and asks users of GIBS to add this acknowledgment: "We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)." It links to the Earthdata policy page below.
2. **NASA Earthdata, "Data Use and Citation Guidance"** — https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance (page says last updated 23 Nov 2026; reached from the policies page https://www.earthdata.nasa.gov/engage/open-data-services-software-policies ). What it states, in our words unless quoted:
   - ESDIS content, including images and texture maps, is generally not copyrighted and may be used for educational or informational purposes, including computer graphical simulations and web pages, personal ones included.
   - Unless content is marked with a use restriction or licence, data from a NASA-led mission are licensed CC0.
   - "If not copyrighted, NASA material may be reproduced and distributed without further permission from NASA."
   - Conditions: no suggestion of NASA endorsement; no false claim of rights in the material; NASA accepts no liability; NASA should be acknowledged as the source.
   - Non-NASA data available through ESDIS follows its own sponsor's licence.

**How it applies.** The layer is `VIIRS_NOAA21_CorrectedReflectance_TrueColor`: NASA processing of data from NOAA-21, a NOAA satellite carrying VIIRS. Whether "a NASA-led mission" covers it is **not settled by this read**, so CC0 is not claimed. The general permission above (not copyrighted, may be reproduced and distributed for informational use, with acknowledgment) does not depend on that point and covers keeping one frame in the repository and serving it. No use-restriction mark on the layer has been looked for yet: **to check on the layer's own GIBS/Earthdata product page when the frame is chosen.** Credit to carry: the GIBS acknowledgment sentence above, beside the existing LANCE sentence.

## Sun: one SDO HMI continuum picture kept as a dated, wrapped reference

**SDO, "Data Rights and Rules for Data Use"** — https://sdo.gsfc.nasa.gov/data/rules.php . Read again in full.
- Copyright paragraph: SDO images are not copyrighted unless explicitly noted; non-commercial use and public education and information use "is strongly encouraged and requires no expressed authorization"; requested credit: "Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams."
- Rules of the Road (addressed to the science data user community): browse products are not for science analysis or publication without the PI's consent; users who make "value-added data products" must notify the PI and label the product as different from the original.

**How each provision applies (our reading, the same reading already on file in REGISTER for `sun.html`).**
- The use is a credited, non-commercial, informational display: inside the copyright paragraph's encouragement.
- The picture is reprojected onto a sphere and masked. On the page it is a **modified display texture** in a teaching scene, labelled as wrapped by us, with the unseen side plain. Nothing is measured from it, nothing is published as a result, and it is not offered for download as data. On that reading it is not science analysis, not a publication and not a value-added data product, so the notify-the-PI rule is not triggered.
- The difference from `sun.html`: the picture would be kept and served past three hours, as a dated reference. The rules page sets no time limit on displaying an image; the three-hour rule is ours.
- **Residual, unchanged from 14 Nov:** the PI has not been notified, and whether a public reprojected display counts as a value-added product is our reading, not SDO's statement. A courtesy note to SDO remains Chad's to send if he wants certainty. No enquiry is sent by this work.

## Result

Both gates are read and recorded. Neither read found a term that stops a dated reference copy. Two things stay open and are named above: the layer-level restriction check for the Earth frame, and the standing SDO reading. Asset records (`SOURCE.json` with hashes, time labels, transform parameters) are made when the images are prepared, after Chad's go.
