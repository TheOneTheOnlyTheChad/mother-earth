"""Sky zoom-out desk check rev 2 (10 Nov 2026): can stops B and C frame their bodies on phone and desktop canvases?
Reads subpoints.json (from desk.py; directions from the full ERFA chain) and the committed raw exports (ranges). No requests.
Camera model = what the page has: three.js PerspectiveCamera, vertical fov 50 deg (three.js default; globe.gl does not change it),
up = +y (north), looking at a chosen target. Units: Earth radii (R = 6378.137 km; globe radius 100 scene units = 1 R).
For each date, 400 candidate view directions; the smallest camera distance at which every drawn disc AND its label box
fits inside the canvas with a 6% inset. Reports the worst date (largest required distance) per canvas, stop and Sun scene distance."""
import json, math, os, re, numpy as np
H=os.path.dirname(os.path.abspath(__file__)); RAW=os.path.join(H,'..','..','..','phase1','sky','raw')
sp=json.load(open(os.path.join(H,'subpoints.json')))
def ranges(fn):
    t=open(os.path.join(RAW,fn)).read().split('$$SOE')[1].split('$$EOE')[0]; return [float(x) for x in re.findall(r'RG=\s*(\S+)',t)]
RE=6378.137; MOON_R=1737.4/RE; SUN_R_KM=695700.0     # radii [GK] until the source pass
rm=ranges('hz-moon-ut-20261110.txt'); rs=ranges('hz-sun-ut-20261110.txt')
def unit(lat,lng):
    a,b=math.radians(lat),math.radians(lng); e=np.array([math.cos(a)*math.cos(b),math.cos(a)*math.sin(b),math.sin(a)])  # ECEF
    return np.array([e[1],e[2],e[0]])   # three.js axes per globe.gl polar2Cartesian: x=ECEF.y, y=ECEF.z(north), z=ECEF.x
def dirs(n=int(os.environ.get('NDIRS','400'))):
    out=[]; g=math.pi*(3-math.sqrt(5))
    for i in range(n):
        y=1-2*(i+.5)/n; r=math.sqrt(1-y*y); t=g*i; v=np.array([math.cos(t)*r,y,math.sin(t)*r])
        if abs(y)<0.97: out.append(v)
    return out
D=dirs()
import sys
LABEL_W,LABEL_H=(150,34) if 'full-labels' in sys.argv else (56,18)   # px: full two-line label beside each body, or a short name tag (full text in a strip); estimates, measured in the build
def need(bodies, W, Hh, fov=50, inset=.06):
    tv=math.tan(math.radians(fov)/2); th=tv*W/Hh
    pts=np.array([b[0] for b in bodies]); tgt=(pts.max(0)+pts.min(0))/2
    best=None
    for u in D:
        f=-u; r=np.cross(f,[0,1,0]); r/=np.linalg.norm(r); up=np.cross(r,f)
        lo,hi=1.0,20000.0
        def fits(d):
            c=tgt+u*d
            for p,rad in bodies:
                q=p-c; z=q@f
                if z<=rad: return False
                x,y=q@r,q@up
                # disc radius in NDC-ish units at depth z, plus a label box to the right of the disc (pixels -> NDC)
                ex=rad/z; lw=LABEL_W/(W/2)*th; lh=LABEL_H/(Hh/2)*tv
                if abs(x/z)+ex+lw>th*(1-inset) or abs(y/z)+ex+lh>tv*(1-inset): return False
            return True
        if not fits(hi): continue
        for _ in range(40):
            m=(lo+hi)/2
            if fits(m): hi=m
            else: lo=m
        if best is None or hi<best[0]: best=(hi,u)
    return best
CANV={'phone 390x844 (sheet collapsed)':(390,844),'phone 360x640':(360,640),'desktop globe 760x640':(760,640)}
out={}
step=int(os.environ.get('STEP','7'))   # 7 = every 7th date (83 dates); STEP=1 = all 579
idx=list(range(0,len(sp),step))
for S in [int(x) for x in os.environ.get('SUNS','400,200,120').split(',')]:
    for name,(W,Hh) in CANV.items():
        worstB=worstC=(0,None); px=[]
        for i in idx:
            m=unit(*sp[i]['moon'])*rm[i]/RE; s=unit(*sp[i]['sun'])*S; sr=S*SUN_R_KM/rs[i]
            E=(np.zeros(3),1.0)
            dB,_=need([E,(m,MOON_R)],W,Hh); dC,_=need([E,(m,MOON_R),(s,sr)],W,Hh)
            # moon disc diameter in px at stop B framing distance (approx: distance from camera to moon ~ dB)
            tv=math.tan(math.radians(25)); px.append(2*MOON_R/dB/tv*(Hh/2))
            if dB>worstB[0]: worstB=(dB,sp[i]['date'])
            if dC>worstC[0]: worstC=(dC,sp[i]['date'])
        out[f'S={S} | {name}']={'stopB_worst_cam_dist_R':round(worstB[0],1),'stopB_worst_date':worstB[1],'stopC_worst_cam_dist_R':round(worstC[0],1),'stopC_worst_date':worstC[1],'moon_disc_px_at_stopB_min':round(min(px),2),'moon_disc_px_at_stopB_max':round(max(px),2)}
# Moon–Sun angle as seen from Earth's centre (0 = same side, 180 = opposite), all dates
ang=[math.degrees(math.acos(max(-1,min(1,unit(*a['moon'])@unit(*a['sun']))))) for a in sp]
print(json.dumps({'labels':'full beside body' if 'full-labels' in sys.argv else 'short tag beside body, full text in a strip','camera':'three.js PerspectiveCamera fov 50 (vertical), up +y','label_box_px':[LABEL_W,LABEL_H],'inset':0.06,'dates_sampled':len(idx),
 'moon_sun_angle_from_earth_deg':{'min':round(min(ang),2),'max':round(max(ang),2),'max_date':sp[ang.index(max(ang))]['date']},'results':out},indent=1))
