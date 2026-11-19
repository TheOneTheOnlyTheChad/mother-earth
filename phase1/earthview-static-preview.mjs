// Earth from Space: builds a STATIC fixture preview that a plain file server can serve (python3 -m http.server), for review on a
// machine without Node. It runs the REAL hub code through a fixed sequence of scenes (via earthview-preview.mjs, started here on
// its own port, nothing on the network), saves the record the hub served after each scene, and writes a copy of the page whose
// only differences are three lines of space.js (listed in the README it writes) and a labelled scene bar.
// Usage: node phase1/earthview-static-preview.mjs <output folder>     Output is not committed to the repository.
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url'; import crypto from 'node:crypto';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..'), out = path.resolve(process.argv[2] || 'earthview-static-preview'), PORT = 8895, B = 'http://127.0.0.1:' + PORT;
const SCENES = [['empty', 'Nothing collected yet.'], ['first-night', 'One verified frame (00:00 UTC, night over Africa). It is the newest the source lists.'], ['newer-day', 'A newer verified frame (11:00 UTC) now exists. A page already showing 00:00 keeps it and offers 11:00.'],
  ['check-failed', 'The hub could not read the source’s list of frames.'], ['no-header', '16:50 is listed, but the service did not confirm which frame it served. Not published.'], ['different-frame', '16:50 is listed, but the service said it served 16:40. Not published.'],
  ['damaged-picture', '16:50 is listed, but the picture received was damaged. Not published.'], ['dusk-published', '16:50 collected and verified (the day–night line crossing Africa).'], ['nothing-newer', 'An hour later the source still lists 16:50.'], ['checks-stopped', 'Forty more minutes with no source check at all.']];
const srv = spawn(process.execPath, ['--no-warnings', path.join(HERE, 'earthview-preview.mjs'), String(PORT)], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res, rej) => { srv.stdout.on('data', d => /local preview/.test(String(d)) && res()); setTimeout(() => rej(new Error('preview server did not start')), 15000); });
try {
  fs.mkdirSync(path.join(out, 'preview-scenes'), { recursive: true }); const pics = {}, rows = [];
  for (const [name] of SCENES) { const r = await (await fetch(`${B}/__scene?name=${name}`)).json(), meta = await (await fetch(`${B}/snapshot/earthview/meta`)).json();
    for (const f of [meta.frame, meta.previous]) if (f) { const b = Buffer.from(await (await fetch(B + f.picture.path)).arrayBuffer()), sha = crypto.createHash('sha256').update(b).digest('hex'); if (sha !== f.picture.sha256) throw new Error('picture hash mismatch in ' + name);
      const fx = ['night', 'day', 'dusk'].find(n => crypto.createHash('sha256').update(fs.readFileSync(path.join(HERE, 'earthview-fixtures', n + '.jpg'))).digest('hex') === sha); if (!fx) throw new Error('served picture is not a fixture'); pics[f.source_frame_time] = fx; }
    fs.writeFileSync(path.join(out, 'preview-scenes', name + '.json'), JSON.stringify(meta, null, 1) + '\n'); rows.push(`| ${name} | ${meta.now} | ${meta.frame ? meta.frame.source_frame_time : 'none'} | ${meta.source_check ? (meta.source_check.ok ? 'ok, newest ' + meta.source_check.newest : 'FAILED') : 'none'} | ${meta.collection ? meta.collection.outcome + (meta.collection.reason ? ': ' + meta.collection.reason : '') : 'none'} | ${r.result || ''} |`); }
  const rep = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('expected exactly one: ' + a); return s.replace(a, b); };
  const A1 = "const HUB = 'https://mother-earth.chadoberholzer.workers.dev';", A2 = "fetch(HUB + '/snapshot/earthview/meta', { signal: ctl.signal, cache: 'no-store' })", A3 = "im.src = HUB + frame.picture.path;";
  const B1 = "const HUB = ''; /* FIXTURE PREVIEW: no hub is contacted */", B2 = "fetch('preview-scenes/' + (sessionStorage.getItem('ev-scene') || 'first-night') + '.json', { signal: ctl.signal, cache: 'no-store' }) /* FIXTURE PREVIEW: the record the real hub code produced for this scene */", B3 = `im.src = 'phase1/earthview-fixtures/' + (${JSON.stringify(pics)})[frame.source_frame_time] + '.jpg'; /* FIXTURE PREVIEW: the same bytes the hub stored for this frame (hash checked when this preview was built) */`;
  let js = fs.readFileSync(path.join(ROOT, 'space.js'), 'utf8'); js = rep(rep(rep(js, A1, B1), A2, B2), A3, B3); fs.writeFileSync(path.join(out, 'space-preview.js'), js); new Function(js);   // must still parse
  let html = fs.readFileSync(path.join(ROOT, 'space.html'), 'utf8'); html = rep(html, '<script src="space.js?v=202612191000"></script>', '<script src="space-preview.js"></script>\n<script src="space-preview-bar.js"></script>'); html = rep(html, '<title>Earth from Space · Mother Earth</title>', '<title>FIXTURE PREVIEW · Earth from Space</title>'); fs.writeFileSync(path.join(out, 'space-preview.html'), html);
  fs.writeFileSync(path.join(out, 'space-preview-bar.js'), `/* FIXTURE PREVIEW ONLY: a labelled bar above the page for choosing a scene. Not part of the site. */
(() => { const SCENES = ${JSON.stringify(SCENES)}; const cur = () => sessionStorage.getItem('ev-scene') || 'first-night';
  const bar = document.createElement('div'); bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Fixture preview controls'); bar.style.cssText = 'background:#3a2a00;color:#ffe9b0;border-bottom:2px solid #ffb347;padding:8px 12px;font:13px/1.5 system-ui,sans-serif';
  const draw = () => { bar.innerHTML = '<b>FIXTURE PREVIEW. Not live.</b> Three real EUMETSAT frames from 19 Nov 2026; the records were produced by the real hub code on a test bench. Times and ages follow each scene’s own clock, not today. The clock in the header is your computer’s.<br>Scene: ' + SCENES.map(([n]) => '<button type="button" data-s="' + n + '" style="margin:3px 4px 3px 0;padding:5px 9px;min-height:32px;font:inherit;cursor:pointer;' + (n === cur() ? 'background:#ffb347;color:#000;font-weight:700' : '') + '">' + n + '</button>').join('') + ' <button type="button" data-reload="1" style="margin:3px 0;padding:5px 9px;min-height:32px;font:inherit;cursor:pointer">Reload page in this scene</button><br><span id="pv-say"></span>';
    bar.querySelector('#pv-say').textContent = cur() + ': ' + SCENES.find(s => s[0] === cur())[1] + ' Choosing a scene makes the open page read the hub record again, as it does by itself every minute; it does not reload. Go forward through the scenes in order; to go back, choose the scene and press Reload.'; };
  bar.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.reload) return location.reload(); sessionStorage.setItem('ev-scene', b.dataset.s); draw(); window.dispatchEvent(new Event('pageshow')); });
  draw(); document.body.insertBefore(bar, document.body.firstChild); })();
`);
  const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  fs.writeFileSync(path.join(out, 'PREVIEW-README.md'), `# Earth from Space: static fixture preview

**Fixture preview. Not live. Nothing here contacts EUMETSAT, Cloudflare or the Mother Earth hub.**

Serve this folder and open the preview page:

    python3 -m http.server 8899 --bind 127.0.0.1
    http://127.0.0.1:8899/space-preview.html

The other pages (index.html and so on) are the branch's real files; open any of them to see the new tab in the header. \`space.html\` itself is the real page and, served from here, would ask the production hub, which has no such route yet: use \`space-preview.html\`.

## What is real and what is stand-in
- **Real:** the three pictures (\`phase1/earthview-fixtures/\`, unchanged EUMETSAT frames of 19 Nov 2026 at 00:00, 11:00 and 16:50 UTC); the hub code that produced every record in \`preview-scenes/\` (\`phase1/worker.js\` of this branch, run by \`phase1/earthview-preview.mjs\`); the page's markup, styles and script.
- **Stand-in:** EUMETSAT's service (answered from the fixtures, with the faults named below injected on purpose); the hub's storage (in memory); the hub's clock (set per scene).
- **Changed in the page for this preview, and nothing else:** three lines of \`space.js\`, saved as \`space-preview.js\`:
  1. \`${A1}\` → \`const HUB = '';\`
  2. the read of \`/snapshot/earthview/meta\` → a read of \`preview-scenes/<scene>.json\`
  3. the picture address \`HUB + frame.picture.path\` → the fixture file with the same bytes (hash checked at build)
  and \`space-preview.html\` loads that script and \`space-preview-bar.js\` (the amber bar).

## Scenes, in order (hub records as served)
| Scene | Hub clock (UTC) | Verified frame | Source check | Collection | Hub run log |
|---|---|---|---|---|---|
${rows.join('\n')}

Open the page (scene first-night), then press the scenes in order. A newer frame is offered, never swapped in: after newer-day the picture stays 00:00 until you press "Show it".

## Hashes
- space.js (real) ${sha(path.join(ROOT, 'space.js'))}
- space-preview.js ${sha(path.join(out, 'space-preview.js'))}
- space.html (real) ${sha(path.join(ROOT, 'space.html'))}
- phase1/worker.js ${sha(path.join(HERE, 'worker.js'))}
`);
  console.log('static preview written to ' + out + ': ' + fs.readdirSync(out).join(', ') + '; scenes ' + fs.readdirSync(path.join(out, 'preview-scenes')).length);
} finally { srv.kill(); }
