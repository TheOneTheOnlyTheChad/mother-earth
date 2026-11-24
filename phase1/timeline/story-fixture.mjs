/* Test helper: the rehearsal source folder a suite should build from. If the two NASA image files are in
 * phase1/timeline/rehearsal/assets/ that folder is used as it is. If not, a copy is made with FIXTURE images of the same
 * pixel sizes (drawn here with Pillow, labelled as fixtures) and their own hashes, so mechanics can still be tested.
 * A suite that runs on fixtures must say so and must not report real-file checks as passed. */
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { createHash } from 'node:crypto'; import { fileURLToPath } from 'node:url';
const RH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'rehearsal');
export const NASA = { 'PIA03379-fig1-800.jpg': ['8886a64a79c60e6b382c1aed2a417b18f97d439f8892a13105a79140af99351e', 81202], 'PIA03379-fig1-1024.jpg': ['a1ab53fc7f6227e2176da674cfc943b2cae3a5e97209e7050e2d7cef390bb770', 144324] };
export function rehearsalFor(tmp) {
  const real = Object.keys(NASA).every(f => fs.existsSync(path.join(RH, 'assets', f)));
  if (real) return { dir: RH, real };
  const dir = path.join(tmp, 'rehearsal-fixture'); fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  for (const f of ['BUILD.json', 'changes.json']) fs.copyFileSync(path.join(RH, f), path.join(dir, f));
  execFileSync('python3', ['-c', `
from PIL import Image, ImageDraw
import sys
for w,h,n in ((800,454,'PIA03379-fig1-800.jpg'),(1024,581,'PIA03379-fig1-1024.jpg')):
    im=Image.new('RGB',(w,h),(60,120,60)); d=ImageDraw.Draw(im); d.rectangle((0,0,w-1,h-1),outline=(255,255,255)); d.text((20,20),'FIXTURE IMAGE, NOT NASA',fill=(255,255,255)); im.save(sys.argv[1]+'/'+n,quality=80)
`, path.join(dir, 'assets')]);
  const b = JSON.parse(fs.readFileSync(path.join(RH, 'big5.json'), 'utf8'));
  for (const r of b.episodes.find(e => e.story).story.image.renditions) { const by = fs.readFileSync(path.join(dir, 'assets', r.file)); r.sha256 = createHash('sha256').update(by).digest('hex'); r.bytes = by.length; r.modification = 'TEST FIXTURE, not the NASA file'; }
  fs.writeFileSync(path.join(dir, 'big5.json'), JSON.stringify(b, null, 1) + '\n');
  return { dir, real };
}
