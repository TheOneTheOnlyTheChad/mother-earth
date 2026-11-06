# 5 Nov 2026 FIRMS recovery — scripts (rev 2)

Review: `reviews/2026-11-06-firms-recovery-5nov.md`. **Data is not committed.** Inputs (`in/`) and outputs (`out/`) are kept on Chad's Mac at `~/Documents/Mother Earth/research/firms-recovery/2026-11-05/`. Rev 1 outputs are kept beside them in `out-rev1/`, superseded.

| file | what |
|---|---|
| `recover.mjs` | Builds the recovery record from the preserved inputs with the hub's own functions (worker.js @ `2ee3a62`). It checks input hashes, computes everything, and checks every figure against pinned, independently verified values. **It writes `out/` only if every check passes**; on any mismatch it writes nothing and exits 1. `out/` must not exist beforehand. |
| `probe23.mjs` | Lists the 23 original records absent from the 23:45 file and the 23 duplicate lines in it. |
| `r2-write.js` | The R2-only write procedure, run in a signed-in `dash.cloudflare.com` pane tab (review §7). Writes one object; everything else is read-only. |
| `test-r2-write.mjs` | Offline test of `r2-write.js` against a mocked dashboard API: absent → one PUT; identical → no-op; different → stop; corrupt bytes → refuse; failed PUT → verify fails; changed original → untouched fails. D1 calls must be SELECT. |

## Reproduce (Node ≥ 22; no network)
```
mkdir rec && cd rec && mkdir in
cp "<Mac folder>"/in/* in/
git -C <repo> show 2ee3a62:phase1/worker.js > w.js            # sha256 70307d5fc2a9afed…
python3 -c "import re;s=open('w.js').read();open('worker-2ee3a62-exports.mjs','w').write(re.sub(r'^export \{ firmsRowProblem,','export { firmsParse, cellId, runRef, firmsRowProblem,',s,count=1,flags=re.M))"   # sha256 46624a3de0e26f91…
cp <repo>/phase1/recovery-firms-2026-11-05/*.mjs .
RECOVERY_CREATED_AT=2026-11-06T08:06:37.000Z node --no-warnings recover.mjs   # prints each output's bytes + sha256 (review §6)
node --no-warnings test-r2-write.mjs <repo>/phase1/recovery-firms-2026-11-05/r2-write.js out/recovery-firms-2026-11-05.json.gz
node --no-warnings probe23.mjs
```
`RECOVERY_CREATED_AT` is the record's creation time (6 Nov 2026 08:06:37 UTC). The same value reproduces the outputs byte for byte on Node 22.23.4 (checked twice). On another Node version, `summary.json` differs because it records the version, and the gzip bytes may differ with zlib. Compare the uncompressed record against `record_json_sha256` in `summary.json` instead.
