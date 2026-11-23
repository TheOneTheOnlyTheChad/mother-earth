// Breaks must bite: each deliberate weakening of the Earth from Space health code (hub 0.6.23) must make
// earthview-health.test.mjs FAIL. Runs the suite once per break against a modified copy of worker.js in a temp dir.
// Nothing in the repo is changed. Usage: node phase1/earthview-health-breaks.mjs
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), suite = path.join(here, 'earthview-health.test.mjs');
const src = fs.readFileSync(suite, 'utf8'), block = src.slice(src.indexOf('export const BREAKS = {'), src.indexOf('\n};', src.indexOf('export const BREAKS = {')));
const names = [...block.matchAll(/^  '([a-z0-9-]+)': \[/gm)].map(m => m[1]);
let bit = 0; const missed = [];
for (const name of names) {
  const r = spawnSync(process.execPath, ['--no-warnings', suite], { env: { ...process.env, BREAK: name }, encoding: 'utf8' });
  const fails = (r.stdout.match(/^FAIL - ([A-Z]\d+\w*)/gm) || []).map(x => x.slice(7));
  if (r.status === 1 && fails.length) { bit++; console.log(`bites  - ${name}: ${fails.join(', ')}`); }
  else { missed.push(name); console.log(`MISSED - ${name} (exit ${r.status}) ${r.stdout.split('\n').slice(-3).join(' ').slice(0, 160)}`); }
}
console.log(`\n${bit} of ${names.length} breaks caught`); process.exit(missed.length ? 1 : 0);
