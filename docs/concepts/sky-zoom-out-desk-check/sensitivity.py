"""Sky zoom-out desk check (source pass, 10 Nov 2026): effect on the calculated sub-points of the Earth-orientation sizes read
in IERS Bulletin A (5 Nov 2026, Vol. XXXIX No. 045; research/sky-zoom-out/2026-11-10-claude/05-iers-bulletin-a.txt):
max |UT1-UTC| 0.26843 s and max pole offset (x, y) = (0.2676", 0.4699") over its predictions to 2027-11-05, plus the bulletin
formula's -0.2961 s at 2027-12-31 (seasonal term omitted). Full ERFA chain c2t06a, committed raw exports only, no requests."""
import os, re, json, math, numpy as np, erfa
H=os.path.dirname(os.path.abspath(__file__)); R=os.path.join(H,'..','..','..','phase1','sky','raw')+'/'
def load(fn):
    b=open(R+fn).read().split('$$SOE')[1].split('$$EOE')[0]
    return [(float(m.group(1)),np.array([float(m.group(i)) for i in (2,3,4)])) for m in re.finditer(r'(\d+\.\d+) = A\.D\. \S+ \S+ \S+\s+X =\s*(\S+) Y =\s*(\S+) Z =\s*(\S+)',b)]
def sep(a,b): a=a/np.linalg.norm(a); b=b/np.linalg.norm(b); return math.degrees(math.atan2(np.linalg.norm(np.cross(a,b)),a@b))
AS=math.pi/180/3600; cases={'dut1_-0.26843s':(-0.26843,0,0),'dut1_-0.30s':(-0.30,0,0),'polar_motion_0.2676_0.4699as':(0,0.2676*AS,0.4699*AS)}
out={}
for k,(du,xp,yp) in cases.items():
    s=[];m=[]
    for (jd,vs),(_,vm) in zip(load('hz-sun-ut-20261110.txt'),load('hz-moon-ut-20261110.txt')):
        t1,t2=erfa.taitt(*erfa.utctai(jd,0.0)); base=erfa.c2t06a(t1,t2,jd,0.0,0.0,0.0); alt=erfa.c2t06a(t1,t2,jd,du/86400,xp,yp)
        s.append(sep(alt@vs,base@vs)); m.append(sep(alt@vm,base@vm))
    out[k]={'sun_max_deg':max(s),'moon_max_deg':max(m)}
print(json.dumps(out,indent=1))
