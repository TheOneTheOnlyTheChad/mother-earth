# Moon LROC (item 4): source retention and frame closure

26 Nov 2026 · Claude · **docs only: no page build, merge or deployment** · for GPT's recheck, together with proposal rev 2.1 (`docs/concepts/MOON-LROC-REGION-PROPOSAL.md`)

**Chad (26 Nov):**
- gave this session access to his Downloads folder for this work
- accepted D6: at least 2 of 4 valid pixels, and the hatched no-data overlay
- asked for the bounded inputs to be retained with a re-hash and checkpoint per file, the volume RDR SIS to be read, and this report

## 1. Retention: done, one file at a time

**Route, for each file:**
1. the pane saves it to `~/Downloads`
2. size and SHA-256 are checked there
3. it is copied to `~/Documents/Mother Earth/_source-data/moon-lro-science-lroc/` and re-hashed there
4. a retention line is committed and pushed **before the next file is saved**
5. the Downloads copy is moved to `~/Downloads/_to_delete-lroc/`, for Chad to empty

Records: `docs/research/moon-lro-science/lroc/checkpoints.jsonl`, retention lines 1–8 (commits `d738c3e` … `3e6307f`).

| # | File (on the Mac) | Bytes | SHA-256 (re-read on the Mac) | Other check |
|---|---|---|---|---|
| 1 | `LROC_A11_M150368601_50CM_bytes567049840-584334959.bin` | 17,285,120 | `3bd1b862…a2fa` | equals checkpoint 1 |
| 2 | `NAC_DTM_APOLLO11_M150368601_2M.IMG` | 59,023,560 | `73de3c6e…eff8` | MD5 computed on the Mac = label `187f3d1d…7cdf` |
| 3 | `NAC_DTM_APOLLO11_M150368601_50CM_PDS3HEADER_bytes0-16879.bin` | 16,880 | `5bbfe9e3…240a` | HTTP 206, ETag = label MD5 |
| 4 | `NAC_DTM_APOLLO11_M150368601_50CM.xml` (PDS4 label) | 12,523 | `7bd41644…0ae8` | MD5 = ETag |
| 5 | `NAC_DTM_APOLLO11_M150368601_2M.xml` (PDS4 label) | 12,504 | `ac7849d4…7879` | MD5 = ETag |
| 6 | `NAC_DTM_APOLLO11_README.TXT` | 8,641 | `175d0fe1…925d` | MD5 = ETag |
| 7 | `DSMAP.CAT` | 8,119 | `ae6340c1…ccb2` | MD5 = ETag |
| 8 | `RDRSIS.PDF` (volume RDR SIS) | 2,528,722 | `f8f091ba…cfff` | MD5 on the Mac = ETag `d52a5420…5e20` |

**Notes:**
- **Range limit:** file 1 is a range, so the archive's whole-file MD5 cannot check it. Its provenance is HTTP 206 with the exact Content-Range, an ETag equal to the label MD5, and the same SHA-256 on four fetches.
- **File 8 timing:** the retained copy is the one the pane saved at 15:44 UTC, when an earlier navigation to the PDF was reported as refused. A second save at 16:02, from the MD5-checked fetch, is byte-identical (same SHA-256) and was set aside.
- **Size:** about 79 MB in total, not committed. The 944 MB 0.5 m file was never fetched whole.

## 2. Frame and pixel convention: closed (read directly)

The retained volume SIS is the **LROC RDR SIS, version 1.6, 22 August 2020** (updated by M. Henriksen).

- **§5.5:** "The coordinate system used is the mean Earth/polar axis system, using planetocentric latitude and east positive longitude direction". The Moon's ephemeris uses de421.bsp with its Euler angles.
- **§5.3:** NAC DTM orthophotos are stored as 16-bit signed values. Our labels give SCALING_FACTOR 1.0 and OFFSET 0.0, and the README says the orthophotos carry no scale or offset, so the values are display DN.
- **Page 17 table:** NAC_DTM is "Digital Terrain Models (DTM) and orthophotos created from geometric stereo observations".
- **§6.4 label note, also present word for word in both retained PDS3 headers:**
  - the centre of the upper-left pixel is (line, sample) = (1.0, 1.0)
  - the offsets run from it to the projection origin, positive when the origin is right of or below that centre
  - "adopted in November 2011 by the LROC team"
  - For this product that is exactly the k = 1 convention of `lroc_geom.py`. The half-pixel ambiguity in rev 2 §4.1 is **closed by definition**; the bounds test stays as a consistency check.
- **Appendix B** still prints the 2008 equations and the "1734.4 km" typo, as does DSMAP.CAT. The products' own header notes and §6.4 govern.

## 3. Error found and corrected: the 2 m image offset

**The error:**
- The 2 m file's PDS3 header is **two** records long (RECORD_BYTES 4,222, LABEL_RECORDS 2, ^IMAGE 3), so the image starts at byte **8,444**.
- Its PDS4 label gives an array offset of **4,222**. That is a second PDS4 label error, after the upper-left x sign.
- I used 4,222 in the pane (`lroc_pixels.js` versions 1 and 2), so every 2 m figure in rev 2 was read **one line (2 m) early**.
- The "DN 24,407 outlier" was header text read as pixels.

**The proof:** `phase1/moonsci/lroc/lroc_source_check.py` (numpy, on the retained files, output committed; PASS, 0 failures) reproduces each pane 2 m number exactly **only** at the wrong offset:
- census, max 24,407
- area hash `a84a2c59…`
- local maximum at −1.79 m north

**Corrected values:**
- the LM's 2 m local maximum is **0.95 m** from the published position (+0.92 m east, +0.21 m north; DN 268, no ties)
- the shadow is 6.9 m east
- the 2 m valid range is DN 4–502
- the 2 × 2 valid counts are 30,579 / 10 / 1,999 / 10 / 1,022,402, so 30,589 no-data output pixels and 2,009 averaged partial blocks
- the corrected area window hash is `4cd6d42d…`

**Unaffected:** the 0.5 m figures. Its header is one record (^IMAGE 2), both its labels agree on 16,880 B, and the Python check reproduces the pane's 0.5 m crop hash and landmark exactly.

`lroc_pixels.js` version 3 now uses 8,444. Proposal rev 2.1 carries the corrections, marked *(2.1)*.

## 4. State

- **Item 4 decisions:** all made (D1–D6). Build inputs and metadata are retained; the frame is closed.
- **Next:** GPT's recheck of rev 2.1 and this report, then Chad's build go. No page build, merge or deployment until then.
- **For Chad:** empty `~/Downloads/_to_delete-lroc/` when convenient. It holds nine files, about 81 MB of duplicates.
