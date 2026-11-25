#!/usr/bin/env node
/*
 * Local preview of the Timeline REHEARSAL revision (docs/concepts/TIMELINE-STORY-PROPOSAL.md rev 2.1 §9).
 *
 *   node phase1/timeline/preview.mjs                 build into a new temporary folder and serve on http://127.0.0.1:8787/
 *   node phase1/timeline/preview.mjs --port 8790     another port
 *   node phase1/timeline/preview.mjs --out <dir>     build into <dir> (must be outside the repository and empty or absent)
 *   node phase1/timeline/preview.mjs --build-only    build, print the report, do not serve
 *   node phase1/timeline/preview.mjs --src <dir>     another rehearsal source folder (e.g. phase1/timeline/rehearsal-finds)
 *
 * What it does. For each of four states it runs the REAL generator (build_timeline.py --src … --page …) on the rehearsal
 * sources (phase1/timeline/rehearsal/) and copies the REAL timeline.js and style.css beside the result:
 *   with-image · no-image · image-fails · catalogue-refused
 * It changes exactly two things in the served copies, each of which must match exactly once or the helper stops:
 *   1. timeline.js: the hub address constant, so the catalogue is fetched from this helper and never from the live hub;
 *   2. timeline.html: one banner line after <body>, "Rehearsal <revision>: not published".
 * Nothing else is substituted: style.css, the catalogue and the image files are served as the bytes on disk.
 *
 * Isolation. Binds to 127.0.0.1 only. GET only. Serves only files under its own build folder; any path that leaves it, any
 * other method and any unknown path is refused and logged. This program makes NO network request of its own: it has no
 * client code at all. Requests a preview page may make, enforced by the Content-Security-Policy header it sends:
 *   this helper (pages, script, stylesheet, catalogue, images); fonts.googleapis.com and fonts.gstatic.com (the page's
 *   own web fonts, kept so the preview looks like the page). Nothing else: not the live Worker, not R2, not NASA.
 *
 * A rehearsal revision is never uploaded or pinned. Nothing this helper writes belongs in the repository.
 * What the preview proves: the real generator, validator and page. What it does not: the Worker's pin check, the R2
 * object, cross-origin headers, the Pages origin.
 */
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TL = path.join(ROOT, 'phase1/timeline'), RH = path.join(TL, 'rehearsal');
export const STATES = ['with-image', 'no-image', 'image-fails', 'catalogue-refused'];
const HUB_LINE = "const HUB = 'https://mother-earth.chadoberholzer.workers.dev';";
const BODY_TAG = '<body class="doc tl">';
const sha = b => createHash('sha256').update(b).digest('hex');
const once = (text, needle, what) => { const n = text.split(needle).length - 1; if (n !== 1) throw new Error(`${what}: expected exactly one match, found ${n}`); };

/** Build the four states under `out`. `opts.rehearsal` = another rehearsal source folder (tests). Returns the report. */
export function build(out, port, opts = {}) {
  const rh = opts.rehearsal || RH;
  out = path.resolve(out);
  if (out === ROOT || out.startsWith(ROOT + path.sep)) throw new Error('the build folder must be outside the repository');
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw new Error('the build folder must be empty or absent');
  const rev = JSON.parse(fs.readFileSync(path.join(rh, 'BUILD.json'), 'utf8')).catalogue_revision;
  if (!/^tl-\d{4}-\d{2}-T\d+$/.test(rev)) throw new Error(`"${rev}" is not a rehearsal revision id (tl-YYYY-MM-T<n>)`);
  const js0 = fs.readFileSync(path.join(ROOT, 'timeline.js'), 'utf8'), css0 = fs.readFileSync(path.join(ROOT, 'style.css'));
  once(js0, HUB_LINE, 'hub address in timeline.js');
  const report = { revision: rev, out, committed: { 'timeline.js': sha(Buffer.from(js0)), 'style.css': sha(css0) }, states: {} };
  for (const st of STATES) {
    const dir = path.join(out, st), src = path.join(dir, '_src');
    fs.mkdirSync(path.join(src, 'catalogue'), { recursive: true }); fs.mkdirSync(path.join(src, 'assets'), { recursive: true });
    for (const f of ['chart-v2026-06.5.json', 'entry-pliny-ep-6-16.json']) fs.copyFileSync(path.join(TL, f), path.join(src, f));
    for (const f of fs.readdirSync(path.join(TL, 'catalogue'))) fs.copyFileSync(path.join(TL, 'catalogue', f), path.join(src, 'catalogue', f));
    // a rehearsal folder may hold only what differs from the released sources: a file it lacks is the released one (BUILD.json is always its own)
    const from = f => fs.existsSync(path.join(rh, f)) ? path.join(rh, f) : path.join(TL, f);
    fs.copyFileSync(path.join(rh, 'BUILD.json'), path.join(src, 'BUILD.json'));
    for (const f of ['big5.json', 'changes.json']) fs.copyFileSync(from(f), path.join(src, f));
    if (fs.existsSync(path.join(rh, 'finds.json'))) fs.copyFileSync(path.join(rh, 'finds.json'), path.join(src, 'finds.json'));
    for (const f of fs.readdirSync(from('assets'))) fs.copyFileSync(path.join(from('assets'), f), path.join(src, 'assets', f));
    if (st === 'no-image') {     // the same account with no image: a different catalogue, built by the same generator
      const b = JSON.parse(fs.readFileSync(path.join(src, 'big5.json'), 'utf8'));
      for (const ep of b.episodes) if (ep.story) delete ep.story.image;
      fs.writeFileSync(path.join(src, 'big5.json'), JSON.stringify(b, null, 1) + '\n');
    }
    fs.copyFileSync(path.join(ROOT, 'timeline.html'), path.join(dir, 'timeline.html'));
    execFileSync('python3', [path.join(TL, 'build_timeline.py'), '--src', src, '--page', path.join(dir, 'timeline.html')], { stdio: ['ignore', 'pipe', 'pipe'] });
    execFileSync('python3', [path.join(TL, 'build_timeline.py'), '--src', src, '--page', path.join(dir, 'timeline.html'), '--check'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const generated = fs.readFileSync(path.join(dir, 'timeline.html'), 'utf8');
    once(generated, BODY_TAG, 'body tag in timeline.html');
    const banner = `${BODY_TAG}\n<p id="rehearsal-banner" role="note" style="margin:0;padding:8px 12px;background:#5a2a00;color:#fff;font:600 13px/1.4 system-ui,sans-serif">Rehearsal ${rev}: not published · preview state: ${st}</p>`;
    fs.writeFileSync(path.join(dir, 'timeline.html'), generated.replace(BODY_TAG, banner));
    const hub = `http://127.0.0.1:${port}/${st}/hub`;
    const js = js0.replace(HUB_LINE, `const HUB = '${hub}';`);
    fs.writeFileSync(path.join(dir, 'timeline.js'), js); fs.writeFileSync(path.join(dir, 'style.css'), css0);
    const adir = path.join(dir, 'assets/timeline', rev); fs.mkdirSync(adir, { recursive: true });
    const images = {};
    for (const f of fs.readdirSync(path.join(src, 'assets'))) if (/\.(jpe?g|png|webp)$/i.test(f)) { fs.copyFileSync(path.join(src, 'assets', f), path.join(adir, f)); images[f] = sha(fs.readFileSync(path.join(adir, f))); }
    const cat = fs.readFileSync(path.join(src, 'catalogue', rev + '.json'));
    report.states[st] = { page_generated_sha256: sha(Buffer.from(generated)), served_js_sha256: sha(Buffer.from(js)), hub, catalogue_sha256: sha(cat), catalogue_bytes: cat.length,
      style_equal_to_committed: sha(fs.readFileSync(path.join(dir, 'style.css'))) === report.committed['style.css'], images };
  }
  report.js_diff = [`- ${HUB_LINE}`, `+ const HUB = 'http://127.0.0.1:${port}/<state>/hub';`];
  return report;
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'";

/** Serve a built folder. Returns the http.Server (listening on 127.0.0.1 only). `log` receives one line per request. */
export function serve(out, port, report, log = console.log) {
  out = path.resolve(out); const rev = report.revision;
  const server = createServer((req, res) => {
    const send = (code, body, type = 'text/plain; charset=utf-8', extra = {}) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff', ...extra }); res.end(body); log(`${code} ${req.method} ${req.url}`); };
    if (req.method !== 'GET') return send(405, 'GET only\n', undefined, { Allow: 'GET' });
    let p; try { p = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); } catch { return send(400, 'bad path\n'); }
    if (p === '/') return send(200, `<!doctype html><meta charset="utf-8"><title>Timeline rehearsal ${rev}</title><h1>Timeline rehearsal ${rev}: not published</h1><ul>` + STATES.map(s => `<li><a href="/${s}/timeline.html">${s}</a></li>`).join('') + '</ul>', TYPES['.html']);
    const m = /^\/([a-z-]+)\/(.*)$/.exec(p);
    if (!m || !STATES.includes(m[1]) || p.includes('..') || p.includes('\\') || p.includes('\0')) return send(404, 'refused: not a preview path\n');
    const [, st, rest] = m, dir = path.join(out, st);
    if (rest === `hub/catalogue/timeline/${rev}`) {
      let b = fs.readFileSync(path.join(dir, '_src/catalogue', rev + '.json'));
      if (st === 'catalogue-refused') { b = Buffer.from(b); const i = b.indexOf('"coverage":"') + 12; b[i] = b[i] === 0x54 ? 0x74 : 0x54; }   // one byte changed: the page must refuse it
      return send(200, b, TYPES['.json']);
    }
    if (rest.startsWith('hub/') || rest.startsWith('_src')) return send(404, 'refused: not a preview path\n');
    if (st === 'image-fails' && rest.startsWith('assets/')) return send(404, 'refused on purpose: this state shows the story when its image does not load\n');
    const file = path.resolve(dir, rest);
    if (!file.startsWith(dir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile() || !TYPES[path.extname(file).toLowerCase()]) return send(404, 'refused: not a preview file\n');
    return send(200, fs.readFileSync(file), TYPES[path.extname(file).toLowerCase()]);
  });
  server.listen(port, '127.0.0.1');
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const port = Number(arg('--port') || 8787);
  const out = arg('--out') || fs.mkdtempSync(path.join(os.tmpdir(), 'me-timeline-rehearsal-'));
  let report;
  try { report = build(out, port, arg('--src') ? { rehearsal: path.resolve(arg('--src')) } : {}); } catch (e) { console.error('preview stopped: ' + (e.stderr ? String(e.stderr).trim() || e.message : e.message)); process.exit(1); }
  console.log(`Rehearsal ${report.revision}: not published. Built in ${report.out}`);
  console.log(`timeline.js   committed sha256 ${report.committed['timeline.js']}`);
  for (const l of report.js_diff) console.log('  ' + l);
  for (const [st, r] of Object.entries(report.states)) {
    console.log(`${st}: served timeline.js sha256 ${r.served_js_sha256}; style.css equal to committed: ${r.style_equal_to_committed}; catalogue ${r.catalogue_bytes} B sha256 ${r.catalogue_sha256}`);
    for (const [f, h] of Object.entries(r.images)) console.log(`  image ${f} sha256 ${h}`);
  }
  if (process.argv.includes('--build-only')) process.exit(0);
  serve(out, port, report);
  console.log(`\nOpen http://127.0.0.1:${port}/   (127.0.0.1 only; stop with Ctrl+C)`);
}
