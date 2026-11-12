// Breaks must bite: each deliberate break of the 0.6.10 /status projection must make status-notes-hub.test.mjs FAIL,
// on the named check. Also runs the suite against the live 0.6.9 hub (git 143f531) as the control: it must fail S2.
// Writes modified copies of worker.js to a temp dir; nothing in the repo is changed.
// Usage: node phase1/status-notes-breaks.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync, execFileSync } from 'node:child_process';
const here = path.dirname(new URL(import.meta.url).pathname);
const src = fs.readFileSync(path.join(here, 'worker.js'), 'utf8');
const Q = "'SELECT layer, started_at, status, http_status, records, bytes FROM collector_runs WHERE id IN (SELECT MAX(id) FROM collector_runs GROUP BY layer)'";
const BREAKS = {
  'note-restored': [Q, Q.replace('bytes FROM', 'bytes, note FROM'), ['S2']],
  'drop-http': [Q, Q.replace('http_status, ', ''), ['S3']],
};
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'status-notes-breaks-'));
const run = f => { const r = spawnSync(process.execPath, ['--no-warnings', path.join(here, 'status-notes-hub.test.mjs')], { env: { ...process.env, WORKER: f }, encoding: 'utf8' });
  return { code: r.status, fails: (r.stdout.match(/^FAIL - (S\d+)/gm) || []).map(x => x.slice(7)) }; };
let bad = 0;
for (const [name, [from, to, want]] of Object.entries(BREAKS)) {
  if (src.split(from).length !== 2) { console.log('BAD BREAK (pattern not found exactly once):', name); bad++; continue; }
  const f = path.join(dir, name + '.js'); fs.writeFileSync(f, src.replace(from, to));
  const { code, fails } = run(f); const hit = code !== 0 && want.every(w => fails.includes(w));
  console.log(`${hit ? 'bites ' : 'MISSED'} - ${name}: failed ${fails.join(', ') || 'nothing'} (expected ${want.join(', ')})`); if (!hit) bad++;
}
// control: the live 0.6.9 hub. S2 must fail (it returns the notes); S6 fails on the version pin by design.
const old = path.join(dir, 'worker-0.6.9.js');
fs.writeFileSync(old, execFileSync('git', ['-C', path.join(here, '..'), 'show', '143f531:phase1/worker.js']));
{ const { code, fails } = run(old); const hit = code !== 0 && fails.includes('S2');
  console.log(`${hit ? 'bites ' : 'MISSED'} - control 0.6.9 (143f531): failed ${fails.join(', ') || 'nothing'} (expected S2)`); if (!hit) bad++; }
console.log(bad ? `\n${bad} not caught` : '\nall caught'); process.exit(bad ? 1 : 0);
