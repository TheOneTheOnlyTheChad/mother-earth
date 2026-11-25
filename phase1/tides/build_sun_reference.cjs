/* Tides: build the pinned Sun reference texture from one picture our hub already fetched.
 * It runs the Sun page's OWN functions (sunB0, fitDisc, buildTexture, taken as text from sunglobe.js, not re-typed) in a
 * browser, so the projection, the 0.97 mask and the plain far side are exactly what sun.html draws from the same picture.
 *   NODE_PATH=/opt/npm-tools/node_modules node phase1/tides/build_sun_reference.cjs <source.jpg> <file_updated ISO> <out.jpg> [--check <rgba sha256>]
 * Prints JSON: the fit, B0, the sha256 of the wrapped RGBA pixels (before JPEG coding) and of the written file.
 * No network. The picture's time is SDO's file-updated time as the hub recorded it; it is not an observation time. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
(async () => {
  const [src, fileUpdated, out] = process.argv.slice(2), ci = process.argv.indexOf('--check');
  if (!src || !fileUpdated || !out || !Number.isFinite(Date.parse(fileUpdated))) { console.error('usage: build_sun_reference.cjs <source.jpg> <file_updated ISO> <out.jpg> [--check <rgba sha256>]'); process.exit(2); }
  const js = fs.readFileSync(path.join(__dirname, '..', '..', 'sunglobe.js'), 'utf8');
  const a = js.indexOf('// ---------- pure parts'), b = js.indexOf('window.SunGlobe = {');
  const consts = js.split('\n').filter(l => /^\s*const (TICK_MS|PLAIN) = /.test(l)).join('\n');
  if (a < 0 || b < a || !/MASK_RHO/.test(consts) || !/HATCH/.test(consts)) { console.error('sunglobe.js no longer has the expected pure block'); process.exit(3); }
  const pure = consts + '\n' + js.slice(a, b) + '\nreturn { sunB0, fitDisc, buildTexture, MASK_RHO, TW, TH };';
  const bytes = fs.readFileSync(src);
  const browser = await chromium.launch(), page = await browser.newPage();
  const r = await page.evaluate(async ({ pure, b64, ms }) => {
    const F = new Function(pure)();
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const bm = await createImageBitmap(new Blob([bin], { type: 'image/jpeg' }));
    const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bm, 0, 0);
    const px = g.getImageData(0, 0, c.width, c.height).data, geom = F.fitDisc(px, c.width, c.height);
    if (!geom) return { error: 'no clean disc found in the picture' };
    const b0 = F.sunB0(ms), tex = F.buildTexture(px, c.width, c.height, geom, b0);
    const o = document.createElement('canvas'); o.width = F.TW; o.height = F.TH; o.getContext('2d').putImageData(new ImageData(tex, F.TW, F.TH), 0, 0);
    return { w: c.width, h: c.height, geom, b0, mask_rho: F.MASK_RHO, tw: F.TW, th: F.TH, rgba: (() => { let t = ''; for (let i = 0; i < tex.length; i += 32768) t += String.fromCharCode.apply(null, tex.subarray(i, i + 32768)); return btoa(t); })(), jpeg: o.toDataURL('image/jpeg', 0.9).split(',')[1] };
  }, { pure, b64: bytes.toString('base64'), ms: Date.parse(fileUpdated) });
  await browser.close();
  if (r.error) { console.error(r.error); process.exit(4); }
  const jpeg = Buffer.from(r.jpeg, 'base64'); delete r.jpeg;
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  r.rgba_sha256 = sha(Buffer.from(r.rgba, 'base64')); delete r.rgba;   // hashed here: a blank page has no crypto.subtle
  r.source_sha256 = sha(bytes); r.source_bytes = bytes.length;
  if (ci > 0) { const want = process.argv[ci + 1]; const ok = r.rgba_sha256 === want; console.log(JSON.stringify({ check: ok ? 'same' : 'DIFFERENT', rgba_sha256: r.rgba_sha256, want })); process.exit(ok ? 0 : 1); }
  fs.writeFileSync(out, jpeg); r.out_bytes = jpeg.length; r.out_sha256 = sha(jpeg);
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
