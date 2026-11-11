import gzip, json, sys, collections
d = json.load(gzip.open(sys.argv[1]))
ev = d['traceEvents'] if isinstance(d, dict) else d
print('events', len(ev))
# thread names
tn = {}
for e in ev:
    if e.get('ph') == 'M' and e.get('name') == 'thread_name': tn[(e['pid'], e['tid'])] = e['args']['name']
marks = {}
for e in ev:
    n = e.get('name', '')
    if n.startswith('S0T2-') and e.get('ph') in ('R', 'I', 'n', 'b', 'e'):
        marks.setdefault(n, e['ts'])
print('marks', {k: v for k, v in sorted(marks.items(), key=lambda x: x[1])})
# renderer main pid/tid: the thread with the marks
mk = [e for e in ev if e.get('name', '').startswith('S0T2-')]
pid = mk[0]['pid'] if mk else None
main = [k for k, v in tn.items() if v == 'CrRendererMain' and k[0] == pid]
print('pid', pid, 'main', main, 'threads in pid', sorted(set(v for k, v in tn.items() if k[0] == pid)))
json.dump({'marks': marks, 'pid': pid, 'main': main}, open(sys.argv[2], 'w'))
