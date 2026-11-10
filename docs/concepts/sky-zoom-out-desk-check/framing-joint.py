"""Sky zoom-out desk check rev 2b (10 Nov 2026): ONE view direction per date for the whole pull-back (Earth -> stop B -> stop C),
so pinch/wheel is a straight dolly (target moves from Earth's centre to each stop's framing centre). For each date: the
direction that minimises the stop-C distance among directions whose stop-B distance is within 1.5x of that date's best stop-B
distance. Same camera, canvas and short-tag label model as framing.py. Committed files only; no requests. Sun drawn at S=200 R."""
import os, sys, json, math, numpy as np
os.environ.setdefault('NDIRS','240'); sys.argv=['x']
H=os.path.dirname(os.path.abspath(__file__)); src=open(os.path.join(H,'framing.py')).read().split("CANV={")[0]
exec(src)
def need_u(bodies,u,W,Hh,fov=50,inset=.06):
    tv=math.tan(math.radians(fov)/2); th=tv*W/Hh; pts=np.array([b[0] for b in bodies]); tgt=(pts.max(0)+pts.min(0))/2
    f=-u; r=np.cross(f,[0,1,0]); r/=np.linalg.norm(r); up=np.cross(r,f)
    def fits(d):
        c=tgt+u*d
        for p,rad in bodies:
            q=p-c; z=q@f
            if z<=rad: return False
            ex=rad/z; lw=LABEL_W/(W/2)*th; lh=LABEL_H/(Hh/2)*tv
            if abs(q@r/z)+ex+lw>th*(1-inset) or abs(q@up/z)+ex+lh>tv*(1-inset): return False
        return True
    lo,hi=1.0,20000.0
    if not fits(hi): return math.inf
    for _ in range(40):
        m=(lo+hi)/2
        if fits(m): hi=m
        else: lo=m
    return hi
S=200; CANV={'phone 390x844':(390,844),'phone 360x640':(360,640),'desktop globe 760x640':(760,640)}; res={}
for name,(W,Hh) in CANV.items():
    wb=wc=0; worst=None
    for i in range(0,len(sp),int(os.environ.get('STEP','7'))):
        m=unit(*sp[i]['moon'])*rm[i]/RE; s=unit(*sp[i]['sun'])*S; E=(np.zeros(3),1.0)
        B=[E,(m,MOON_R)]; C=[E,(m,MOON_R),(s,S*SUN_R_KM/rs[i])]
        dB=[need_u(B,u,W,Hh) for u in D]; best=min(dB)
        cand=[(need_u(C,u,W,Hh),dB[k]) for k,u in enumerate(D) if dB[k]<=1.5*best]
        dc,db=min(cand)
        if dc>wc: wc=dc; worst=sp[i]['date']
        wb=max(wb,db)
    res[name]={'stopB_worst_R':round(wb,1),'stopC_worst_R':round(wc,1),'stopC_worst_date':worst}
print(json.dumps({'sun_scene_distance_R':S,'rule':'single direction per date; stop-B distance within 1.5x of its own best','results':res},indent=1))
