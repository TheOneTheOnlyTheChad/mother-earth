"""Sky zoom-out desk check (10 Nov 2026). Reads only the committed raw Horizons exports (phase1/sky/raw/*-ut-20261110.txt);
makes no request. Reference transform: ERFA c2t06a (IAU 2006/2000A), polar motion 0, UT1 = UTC. Needs pyerfa 2.0.1.5, numpy.
Run: python3 -I desk.py > transform-agreement.json  (also writes subpoints.json for cmp.mjs)."""
import re, sys, json, math, numpy as np, erfa
import os; R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','phase1','sky','raw')+'/'
def load(fn):
    t=open(R+fn).read(); body=t.split('$$SOE')[1].split('$$EOE')[0]
    out=[]
    for m in re.finditer(r'(\d+\.\d+) = A\.D\. (\S+) (\S+) (\S+)\s+X =\s*(\S+) Y =\s*(\S+) Z =\s*(\S+)',body):
        out.append((float(m.group(1)),m.group(2),np.array([float(m.group(i)) for i in (5,6,7)])))
    return out
sun=load('hz-sun-ut-20261110.txt'); moon=load('hz-moon-ut-20261110.txt')
def latlng(v):
    r=np.linalg.norm(v); return math.degrees(math.asin(v[2]/r)), math.degrees(math.atan2(v[1],v[0]))
def sep(a,b):
    a=a/np.linalg.norm(a); b=b/np.linalg.norm(b); return math.degrees(math.atan2(np.linalg.norm(np.cross(a,b)),np.dot(a,b)))
def R3(th):
    c,s=math.cos(th),math.sin(th); return np.array([[c,s,0],[-s,c,0],[0,0,1]])
def mats(jdutc, dut1=0.0):
    # UTC -> TT via TAI; UT1 = UTC + dut1
    tai1,tai2=erfa.utctai(jdutc,0.0); tt1,tt2=erfa.taitt(tai1,tai2)
    ut1=(jdutc, dut1/86400)
    full=erfa.c2t06a(tt1,tt2,ut1[0],ut1[1],0.0,0.0)        # IAU 2006/2000A, polar motion 0
    era=R3(erfa.era00(*ut1))
    gmst=R3(erfa.gmst06(ut1[0],ut1[1],tt1,tt2))
    pmean=erfa.pmat06(tt1,tt2)                              # bias+precession, no nutation
    pn=erfa.pnm06a(tt1,tt2)                                 # bias+precession+nutation
    gast=R3(erfa.gst06a(ut1[0],ut1[1],tt1,tt2))
    return dict(full=full, era_only=era, gmst_only=gmst, prec_gmst=gmst@pmean, pn_gast=gast@pn)
res={k:[] for k in ['era_only','gmst_only','prec_gmst','pn_gast','dut1_0.9s']}
rows={}
for (jd,date,vs),(jd2,d2,vm) in zip(sun,moon):
    assert jd==jd2
    M=mats(jd); full_s=M['full']@vs
    for k in ['era_only','gmst_only','prec_gmst','pn_gast']: res[k].append(sep(M[k]@vs,full_s))
    res['dut1_0.9s'].append(sep(mats(jd,0.9)['full']@vs,full_s))
    if date in ('2026-Nov-10','2026-Dec-21','2027-Mar-20','2026-Jun-21'):
        rows[date]=dict(sun=latlng(full_s), moon=latlng(M['full']@vm), sun_era_only=latlng(M['era_only']@vs), sun_gmst_only=latlng(M['gmst_only']@vs))
summary={k:{'max_deg':max(v),'min_deg':min(v)} for k,v in res.items()}
print(json.dumps({'n':len(sun),'first':sun[0][1],'last':sun[-1][1],'vs_full_c2t06a':summary,'rows':rows},indent=1))
# export full-transform subpoints for node comparison
json.dump([{'jd':jd,'date':d,'sun':latlng(mats(jd)['full']@vs),'moon':latlng(mats(jd)['full']@vm)} for (jd,d,vs),(_,_,vm) in zip(sun,moon)],open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'subpoints.json'),'w'))
