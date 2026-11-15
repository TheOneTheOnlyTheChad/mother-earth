// Breaks must bite: /place answers a down layer as down (0.6.15; docs/concepts/HUB-PLACE-DOWN-FIX-PROPOSAL.md rev 2 §7).
// Each break undoes one part of the change in a temp copy of worker.js and runs the suite that covers it; the named cases
// must FAIL and nothing else may. (With H1a alone undone, a down envelope whose records exist is still caught by H1b / H1c on
// the re-read, so H1a's own cases are the ones with no records file and with every scan slot taken.) Nothing in the repo is changed.
// Usage: node phase1/place-down-breaks.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const here = path.dirname(new URL(import.meta.url).pathname);
const src = fs.readFileSync(path.join(here, 'worker.js'), 'utf8');
const BREAKS = [
  ['H1a first read tested the 0.6.14 way (&& !cells.cells)', "if (cells.source_status === 'down') return placeDown(layer, cells);\n", "if (cells.source_status === 'down' && !cells.cells) return placeDown(layer, cells);\n", { 'history-hub': ['PD5'], 'firms-v2': ['PDL4'] }],
  ['H1b ordinary path: final counts not tested after the re-read', "    if (cells.source_status === 'down') return placeDown(layer, cells);   // the FINAL counts are down: say so, before any pairing answer\n", '', { 'history-hub': ['PD2', 'PD2'] }],
  ['H1c lines/1 path: final counts not tested after the re-read', "    if (cells.source_status === 'down') return placeDown('firms', cells);   // the FINAL counts are down: no pairing answer, no second record scan\n", '', { 'firms-v2': ['PDL2'] }],
];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'place-down-breaks-')); let bad = 0;
for (const [name, from, to, want] of BREAKS) {
  if (src.split(from).length !== 2) { console.log('BAD BREAK (pattern not found exactly once):', name); bad++; continue; }
  const f = path.join(dir, name.replace(/\W+/g, '-') + '.js'); fs.writeFileSync(f, src.replace(from, to));
  for (const [suite, cases] of Object.entries(want)) {
    const r = spawnSync(process.execPath, ['--no-warnings', path.join(here, suite + '.test.mjs')], { env: { ...process.env, WORKER: f }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 600e3 });
    const fails = (r.stdout.match(/^FAIL - (\w+)\./gm) || []).map(x => x.slice(7, -1));
    const good = r.status !== 0 && JSON.stringify(fails) === JSON.stringify(cases);
    if (!good) bad++; console.log(`${good ? 'bites ' : 'WRONG '} - ${name} · ${suite}: failed ${fails.join(', ') || 'nothing'} (expected exactly ${cases.join(', ')})`);
  }
}
console.log(bad ? `\nplace-down-breaks: ${bad} problem(s)` : '\nplace-down-breaks: every break bites, in the expected cases only'); process.exit(bad ? 1 : 0);
