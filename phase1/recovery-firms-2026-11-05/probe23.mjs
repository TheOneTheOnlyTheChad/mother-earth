import fs from 'node:fs'; const W = await import('./worker-2ee3a62-exports.mjs');
const orig = JSON.parse(fs.readFileSync('in/checkpoint-firms-2026-11-05.json','utf8'));
const p = W.firmsParse(fs.readFileSync('in/2026-11-05T23-45Z.csv','utf8'));
const k = r => JSON.stringify(r); const R = new Map(); p.rows.forEach((r,i)=>{ (R.get(k(r))||R.set(k(r),[]).get(k(r))).push(i); });
const missing = orig.records.filter(r => !R.has(k(r)));
const dups = [...R.entries()].filter(([,v])=>v.length>1);
console.log('missing sample', missing.slice(0,5).map(k));
console.log('missing observed_at/sat', [...new Set(missing.map(r=>r[2]+' '+r[5]))]);
console.log('dup sample', dups.slice(0,5).map(([x,v])=>x+' x'+v.length+' lines '+v.map(i=>i+2).join('/')));
console.log('dup observed_at/sat', [...new Set(dups.map(([x])=>{const r=JSON.parse(x);return r[2]+' '+r[5]}))]);
// nearest match for missing rows by observed_at+sat, rounding lat/lng
const near = missing.slice(0,5).map(r => { const c = p.rows.filter(q => q[2]===r[2] && q[5]===r[5] && Math.abs(q[0]-r[0])<0.01 && Math.abs(q[1]-r[1])<0.01); return [k(r), c.map(k)]; });
console.log('near', JSON.stringify(near,null,1));
const cells = W.firesDaily(orig), cr = W.firesDaily({record_fields:p.fields,records:p.rows});
console.log('fewer', Object.keys(cells).filter(id=>(cr[id]?.n||0)<cells[id].n).map(id=>[id,cells[id].n,cr[id]?.n]));
