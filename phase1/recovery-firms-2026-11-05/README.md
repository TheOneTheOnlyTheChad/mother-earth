# 5 Nov 2026 FIRMS recovery — scripts (workspace only; writes nothing to the hub)
Review: `reviews/2026-11-06-firms-recovery-5nov.md`. Data (inputs + outputs) is not committed; it is on Chad's Mac at `~/Documents/Mother Earth/research/firms-recovery/2026-11-05/` (`in/`, `out/`).

Reproduce (Node ≥ 22):
```
mkdir rec && cd rec && mkdir in out
cp <Mac folder>/in/* in/
git -C <repo> show 2ee3a62:phase1/worker.js > w.js
python3 -c "import re;s=open('w.js').read();open('worker-2ee3a62-exports.mjs','w').write(re.sub(r'^export \{ firmsRowProblem,','export { firmsParse, cellId, runRef, firmsRowProblem,',s,count=1,flags=re.M))"
cp <repo>/phase1/recovery-firms-2026-11-05/*.mjs .
node --no-warnings recover.mjs     # → out/summary.json etc.; hashes in the review §6
node --no-warnings probe23.mjs     # the 23 removed / 23 duplicate rows
```
