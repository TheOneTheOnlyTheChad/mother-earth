# Orbital benchmark, 3 Nov 2026 (kept for reference; not a page)

Copied from branch `bench-orbital` (head `594aae2`) on 6 Nov 2026, so the branch can be deleted.

| file | what |
|---|---|
| `results-2026-11-03.json` | Benchmark results of 3 Nov (bench-orbital 1.1, valid, C1–C5 pass). Written up in `docs/STATUS-ARCHIVE.md` (3 Nov). |
| `unquote.test.mjs` | Regression test: Space-Track quotes every CSV field; the classifier must see every row (1.0 classified 0 of 32,517). Fails when commas inside fields stop being converted (checked 6 Nov). Run: `node phase1/bench-orbital/unquote.test.mjs` |
| `bench-orbital.html.txt` | The benchmark page's source, **stored as text** so GitHub Pages serves it as plain text, not as a working page. The test reads its functions from it. To run the bench itself, save a copy as `.html` locally. |
