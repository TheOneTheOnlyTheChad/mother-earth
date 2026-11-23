import fs from 'node:fs'; import crypto from 'node:crypto';
const START='2026-11-20T13:00:00Z', BUILD='b512f2c92211-53f3982760b8', T0=Date.parse(START);
const canon = v => Array.isArray(v) ? '['+v.map(canon).join(',')+']' : v && typeof v==='object' ? '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}' : JSON.stringify(v);
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
function dec(a, vs){ const n=x=>Number(x), iso=ms=>new Date(T0+n(ms)).toISOString(), ft=new Date(T0+n(a[12])*60000).toISOString().replace('.000Z','Z');
 const base={probe:'evprobe',attempt:a[5],isolate:a[6],k:n(a[0]),run:n(a[1]),phase:n(a[2]),size:n(a[3]),ballast_mib:n(a[4]),isolate_run:n(a[7])};
 const out=[{...base,ev:'start',scheduled:iso(a[8]),actual:iso(a[9]),start:START,build:BUILD,late_ms:n(a[10]),overlapping:n(a[11])}];
 if(base.ballast_mib) out.push({...base,ev:'ballast',held_mib:base.ballast_mib});
 out.push({...base,ev:'fetched',picture:{ok:true,header_present:true,sha256:a[13],header_names:ft,bytes:n(a[14])},check:{ok:true,header_present:true,sha256:a[15],header_names:ft,bytes:n(a[16])},header_ok:true,frame_time:ft,actual:iso(a[17]),cache_age_s:a[18]});
 for(const v of vs){ out.push({...base,ev:'validate-begin',i:n(v[0])}); out.push({...base,ev:'validated',ok:true,progressive:true,frame_time:ft,i:n(v[0]),wall_ms:n(v[1]),check_opaque_share:n(v[2]),check_opaque_on_frame_edge:n(v[3]),surround_samples:n(v[4]),surround_share_background:n(v[5]),surround_worst_difference:n(v[6]),disk_samples:n(v[7]),disk_brightness_spread:n(v[8]),agreement:n(v[9]),scans:n(v[10])}); }
 const d={...base,ev:'done',header_ok:true,outcome:'validated',frame_time:ft,wall_ms:n(a[19]),validations:vs.length,refused:0}; if(base.ballast_mib) d.ballast_ok=true; out.push(d); return out; }
const E = fs.readFileSync('enc.txt','utf8').split('\n').filter(Boolean).map(l=>l.split(' '));
const lines = fs.readFileSync('generic.jsonl','utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l)), inv = [];
let cur = null; const flush = () => { if (cur) lines.push(...dec(cur.a, cur.vs)); cur = null; };
for (const f of E) { if (f[0]==='A') { flush(); cur = { a: f.slice(1), vs: [] }; } else if (f[0]==='V') cur.vs.push(f.slice(1)); else if (f[0]==='I') { flush(); inv.push({ scheduled: new Date(T0+Number(f[1])).toISOString(), outcome: f[2], cpu_ms: Number(f[3]), wall_ms: Number(f[4]), logged: new Date(T0+Number(f[5])).toISOString() }); } }
flush();
const linesFile = lines.map(canon).sort().join('\n') + '\n', invFile = canon(inv) + '\n';
fs.writeFileSync('lines.jsonl', linesFile); fs.writeFileSync('invocations.json', invFile);
console.log(lines.length, sha(linesFile), linesFile.length); console.log(inv.length, sha(invFile));
