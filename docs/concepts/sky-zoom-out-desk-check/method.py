"""Sky zoom-out desk check rev 2 (10 Nov 2026): the PROPOSED method (IAU 2006 bias-precession + GMST 2006; no nutation,
polar motion 0, UT1 = UTC) for BOTH bodies, against the full ERFA chain (c2t06a). Committed raw exports only; no requests.
Uses ERFA's own pmat06/gmst06 as the method, so this measures the METHOD; the build must repeat it on the generator's own
plain-Python output. Writes method-subpoints.json for cmp.mjs (METHOD=1)."""
import os, re, json, math, numpy as np, erfa
H=os.path.dirname(os.path.abspath(__file__)); R=os.path.join(H,'..','..','..','phase1','sky','raw')+'/'
def load(fn):
    b=open(R+fn).read().split('$$SOE')[1].split('$$EOE')[0]
    return [(float(m.group(1)),m.group(2),np.array([float(m.group(i)) for i in (3,4,5)])) for m in re.finditer(r'(\d+\.\d+) = A\.D\. (\S+) \S+ \S+\s+X =\s*(\S+) Y =\s*(\S+) Z =\s*(\S+)',b)]
def ll(v): return [math.degrees(math.asin(v[2]/np.linalg.norm(v))), math.degrees(math.atan2(v[1],v[0]))]
def sep(a,b): a=a/np.linalg.norm(a); b=b/np.linalg.norm(b); return math.degrees(math.atan2(np.linalg.norm(np.cross(a,b)),a@b))
def R3(t): c,s=math.cos(t),math.sin(t); return np.array([[c,s,0],[-s,c,0],[0,0,1]])
out=[]; st={'sun':[], 'moon':[]}
for (jd,d,vs),(_,_,vm) in zip(load('hz-sun-ut-20261110.txt'),load('hz-moon-ut-20261110.txt')):
    t1,t2=erfa.taitt(*erfa.utctai(jd,0.0)); full=erfa.c2t06a(t1,t2,jd,0.0,0.0,0.0); meth=R3(erfa.gmst06(jd,0.0,t1,t2))@erfa.pmat06(t1,t2)
    st['sun'].append(sep(meth@vs,full@vs)); st['moon'].append(sep(meth@vm,full@vm))
    out.append({'jd':jd,'date':d,'sun':ll(meth@vs),'moon':ll(meth@vm)})
json.dump(out,open(os.path.join(H,'method-subpoints.json'),'w'))
print(json.dumps({k:{'n':len(v),'max_deg':max(v),'median_deg':sorted(v)[len(v)//2]} for k,v in st.items()},indent=1))
