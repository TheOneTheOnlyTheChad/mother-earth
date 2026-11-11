import gzip, json, sys, collections
d = json.load(gzip.open(sys.argv[1])); ev = d['traceEvents'] if isinstance(d, dict) else d
m = json.load(open(sys.argv[2])); mk = m['marks']; pid = m['pid']
W = {'visible': (mk['S0T2-visible-end'] - 10_000_000, mk['S0T2-visible-end']), 'hidden': (mk['S0T2-hidden-end'] - 10_000_000, mk['S0T2-hidden-end'])}
nodes = {}; samples = []
prof = {}
for e in ev:
    if e.get('name') == 'Profile' and e.get('pid') == pid: prof[e['id']] = e['args']['data'].get('startTime')
for e in ev:
    if e.get('name') != 'ProfileChunk' or e.get('pid') != pid: continue
    pid_ = e['id']; dat = e['args']['data']; cp = dat.get('cpuProfile', {})
    for n in cp.get('nodes', []):
        cf = n['callFrame']; nodes[(pid_, n['id'])] = (cf.get('functionName') or '(anon)', cf.get('url', '').split('/')[-1][:40], n.get('parent'))
    st = prof.get(pid_, 0); ts = st
    # timeDeltas accumulate across chunks per profile
    prof.setdefault('_t_' + pid_, st)
    t = prof['_t_' + pid_]
    for sid, dt in zip(cp.get('samples', []), dat.get('timeDeltas', [])):
        t += dt; samples.append((t, (pid_, sid)))
    prof['_t_' + pid_] = t
for wn, (a, b) in W.items():
    ss = [s for t, s in samples if a <= t < b]
    selfc = collections.Counter(nodes.get(s, ('?', '?', None))[:2] for s in ss)
    # inclusive by script file
    files = collections.Counter()
    for s in ss:
        seen = set(); k = s
        while k in nodes:
            f = nodes[k][1]
            if f and f not in seen: seen.add(f); files[f] += 1
            p = nodes[k][2]; k = (k[0], p) if p else None
    tot = len(ss)
    print(wn, 'samples', tot)
    print('  self top:', [(f'{fn} @{u}', round(100 * c / tot, 1)) for (fn, u), c in selfc.most_common(14)])
    print('  inclusive by file %:', [(f, round(100 * c / tot, 1)) for f, c in files.most_common(10)])
