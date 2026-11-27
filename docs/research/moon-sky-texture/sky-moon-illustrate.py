"""Moon item 10a assessment (docs only): what the SAME picture moon.html uses would look like on the Sky zoom-out Moon at stop B,
at the measured size, orientation and viewing direction. An OFFLINE estimate (supersampled, box-averaged: close to a mipmapped,
evenly lit, emissive texture), not a render by the page. Beside it, the real crop of today's plain grey Moon from the current page.
Run: python3 -I sky-moon-illustrate.py <repo> <shot-json> <crop-png> <out-png> <label>
"""
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw
repo, shotj, crop, outp, label = sys.argv[1:6]
D = math.pi / 180
def vec(lat, lng): return np.array([math.cos(lat*D)*math.cos(lng*D), math.cos(lat*D)*math.sin(lng*D), math.sin(lat*D)])
def nrm(a): return a / np.linalg.norm(a)
def triad(p, q):
    t1 = nrm(p); t2 = nrm(np.cross(p, q)); return np.array([t1, t2, np.cross(t1, t2)])
sc = json.load(open(f'{repo}/phase1/sky/catalogue/sky-scene-2026-11-R1.json'))
ml = json.load(open(f'{repo}/assets/moon/moon-light-2026-06-R1.json'))
row = json.load(open(shotj))[0]; date = row['date']; B = row['stops']['B']
m = next(r for r in sc['bodies']['moon']['rows'] if r[0] == date); s = next(r for r in sc['bodies']['sun']['rows'] if r[0] == date)
moonP = vec(m[1], m[2]) * m[3]; sunP = vec(s[1], s[2]) * s[3]
eS = nrm(-moonP); sS = nrm(sunP - moonP)
i = round((np.datetime64(date + 'T00:00:00') - np.datetime64('2026-06-01T00:00:00')) / np.timedelta64(6, 'h'))
eM = vec(ml['earth_lon_lat_deg'][2*i+1], ml['earth_lon_lat_deg'][2*i]); sM = vec(ml['sun_lon_lat_deg'][2*i+1], ml['sun_lon_lat_deg'][2*i])
R = triad(eS, sS).T @ triad(eM, sM)           # Moon-fixed -> Earth-fixed (scene)
three2ecef = lambda v: np.array([v[2], v[0], v[1]])
cb = B['cam_basis_three']; right, up, _ = (three2ecef(np.array(cb[k])) for k in ('right', 'up', 'back'))
# the visible hemisphere is centred on the Moon->camera direction (the Moon is off the camera axis); screen axes from the camera
back = nrm(-three2ecef(np.array(B['cam_to_moon_three']))); right = nrm(right - (right @ back) * back); up = np.cross(back, right)
tex = np.asarray(Image.open(f'{repo}/assets/moon/lroc_color_2k.jpg').convert('RGB'), dtype=np.float64)
H, W = tex.shape[:2]
def render(r_dev, ss=16):
    n = int(math.ceil(r_dev)) * 2 + 2; N = n * ss
    c = (np.arange(N) + 0.5) / ss - n / 2
    u, v = np.meshgrid(c / r_dev, -c / r_dev)
    rr = u*u + v*v; inside = rr < 1; w = np.sqrt(np.clip(1 - rr, 0, 1))
    P = u[..., None]*right + v[..., None]*up + w[..., None]*back
    q = P @ R                                  # R^T P, row-vector form
    lat = np.arcsin(np.clip(q[..., 2], -1, 1)) / D; lon = np.arctan2(q[..., 1], q[..., 0]) / D
    col = ((lon + 180) / 360 * W).astype(int) % W; rowi = np.clip(((90 - lat) / 180 * H).astype(int), 0, H - 1)
    img = np.where(inside[..., None], tex[rowi, col], 0.0)
    flat = np.where(inside[..., None], np.array([0x9a]*3, float), 0.0)
    box = lambda a: a.reshape(n, ss, n, ss, 3).mean(axis=(1, 3))
    nearfrac = float((np.einsum('...k,k->...', P, eS)[inside] > 0).mean())
    return box(img), box(flat), nearfrac
r_dev = B['moon_rpx_page'] * B['renderer_pixel_ratio']
img, flat, nearfrac = render(r_dev)
big, _, _ = render(60, ss=2)
Z = 10
up_ = lambda a, z: Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((a.shape[1]*z, a.shape[0]*z), Image.NEAREST)
realc = Image.open(crop).convert('RGB'); k = realc.size[0]; dpr = k / 48          # crop is 48 CSS px at the context's device scale
side = img.shape[0] / B['renderer_pixel_ratio'] * dpr                              # same CSS extent as the estimate tiles
c0 = (k - side) / 2; realc = realc.crop((round(c0), round(c0), round(c0 + side), round(c0 + side)))
real_up = realc.resize((img.shape[1]*Z, img.shape[0]*Z), Image.NEAREST)
tiles = [('today, plain grey (real crop)', real_up), ('flat grey 0x9a9a9a, est.', up_(flat, Z)), ('same picture, est.', up_(img, Z)), ('face seen (enlarged, r=60)', up_(big, 2))]
Wd = sum(t.size[0] for _, t in tiles) + 20 * (len(tiles) + 1); Hd = max(t.size[1] for _, t in tiles) + 70
out = Image.new('RGB', (Wd, Hd), (5, 7, 11)); d = ImageDraw.Draw(out); x = 20
d.text((20, 6), f'{label}: stop B, {date}, Moon radius {B["moon_rpx_page"]} CSS px x renderer ratio {B["renderer_pixel_ratio"]} = {r_dev:.2f} device px; '
       f'view {B["view_vs_earthline_deg"]} deg from the Earth-Moon line; {nearfrac*100:.0f}% of the visible disc is near side', fill=(220, 220, 220))
for name, t in tiles:
    out.paste(t, (x, 50)); d.text((x, 30), name, fill=(200, 200, 200)); x += t.size[0] + 20
out.save(outp)
print(json.dumps({'tex_mean_rgb': [round(x,1) for x in tex.reshape(-1,3).mean(0)], 'disc_mean_est': [round(x,1) for x in img[img.sum(-1)>0].mean(0)], 'date': date, 'r_dev': round(r_dev, 2), 'near_side_fraction_of_visible_disc': round(nearfrac, 3), 'out': outp}))
