import gzip, json, sys, collections
d = json.load(gzip.open(sys.argv[1])); ev = d['traceEvents'] if isinstance(d, dict) else d
m = json.load(open(sys.argv[2])); mk = m['marks']; pid = m['pid']
tn = {(e['pid'], e['tid']): e['args']['name'] for e in ev if e.get('ph') == 'M' and e.get('name') == 'thread_name'}
pn = {e['pid']: e['args']['name'] for e in ev if e.get('ph') == 'M' and e.get('name') == 'process_name'}
W = {'visible': (mk['S0T2-visible-end'] - 10_000_000, mk['S0T2-visible-end']), 'hidden': (mk['S0T2-hidden-end'] - 10_000_000, mk['S0T2-hidden-end'])}
def self_times(evs, a, b):
    # complete events on one thread, compute self time per name, clipped to window
    xs = sorted([e for e in evs if e.get('ph') == 'X' and 'dur' in e and e['ts'] < b and e['ts'] + e['dur'] > a], key=lambda e: (e['ts'], -e['dur']))
    st = collections.Counter(); stack = []; busy = 0
    for e in xs:
        s, t = max(e['ts'], a), min(e['ts'] + e['dur'], b)
        while stack and stack[-1][1] <= e['ts']: stack.pop()
        if stack: st[stack[-1][2]] -= (t - s)
        else: busy += t - s
        st[e['name']] += t - s; stack.append((e['ts'], e['ts'] + e['dur'], e['name']))
    return busy, st
by = collections.defaultdict(list)
for e in ev:
    if e.get('ph') == 'X': by[(e['pid'], e['tid'])].append(e)
out = {}
for wn, (a, b) in W.items():
    res = {}
    for key, evs in by.items():
        name = tn.get(key, '?')
        if not (key[0] == pid and name == 'CrRendererMain') and not ('Gpu' in name or 'Viz' in name or 'VizCompositor' in name) and not (key[0] == pid and name == 'Compositor'): continue
        busy, st = self_times(evs, a, b)
        if busy == 0: continue
        res[pn.get(key[0], key[0]).__str__() + '/' + name] = {'busy_ms': round(busy / 1000, 1), 'top_self_ms': [(k, round(v / 1000, 1)) for k, v in st.most_common(8)]}
    # frames: FireAnimationFrame on main
    fa = [e['dur'] / 1000 for e in by[(pid, m['main'][0][1])] if e.get('name') == 'FireAnimationFrame' and a <= e['ts'] < b]
    fa.sort(); res['FireAnimationFrame'] = {'n': len(fa), 'med_ms': round(fa[len(fa)//2], 1) if fa else None, 'sum_ms': round(sum(fa), 1)}
    gc = [e for e in by[(pid, m['main'][0][1])] if a <= e['ts'] < b and ('GC' in e.get('name', '') or e.get('name', '') in ('MinorGC', 'MajorGC', 'V8.GC_SCAVENGER', 'BlinkGC.AtomicPhase'))]
    res['GC_on_main'] = {'n': len(gc), 'sum_ms': round(sum(e['dur'] for e in gc) / 1000, 1), 'names': sorted(set(e['name'] for e in gc))[:6]}
    out[wn] = res
print(json.dumps(out, indent=1))
