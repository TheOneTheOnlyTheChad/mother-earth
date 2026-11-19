# Damaged pictures: what stops each one

Base: the real 11:00 frame (676,253 B, progressive JPEG, 10 scans). A JPEG carries no checksum, so the checks are layered.

| Damage | Structure walk | Scan completeness | Strict decode | Comparison with check image | Outcome |
|---|---|---|---|---|---|
| Cut at 50% | **refused** (scan data runs past the end) | | | | not published |
| End marker missing | **refused** | | | | not published |
| Bytes after the end marker | **refused** | | | | not published |
| First scan only, then a valid end marker | passes | **refused** (192 coefficient positions never delivered) | would pass | would pass (0.936: a blurred picture still correlates) | not published |
| Five of ten scans, then an end marker | passes | **refused** | would pass | would pass | not published |
| 4,000 bytes of scan data replaced | passes | passes | **refused** (invalid huffman sequence) | | not published |
| 40 KB of the first scan zeroed | passes | passes | passes | **refused** (spread 3.6, agreement −0.06) | not published |
| A real JPEG of another size (256 px) | passes | passes | | | **refused** on size |
| XML error document sent as the picture | | | | | **refused** on content type (and has no start marker) |
| Picture of one frame, check image of another | passes | passes | passes | **refused** (0.31 to 0.42) | not published |
| **64 bytes flipped, or 4 KB zeroed, in the middle of a late scan** | passes | passes | passes | **passes** (0.936; the damage is local and faint) | **would be published** |

The last row is the stated limit: damage inside a late refinement scan that still decodes changes a small area slightly and is not caught by anything here. Catching it would need a checksum from the source, which the service does not send.
