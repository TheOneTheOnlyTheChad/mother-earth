// TEMPORARY RESEARCH TOOL (GIBS stage-1 bench, 8 Nov 2026). Same decoder as the pane bench. Not project code.
import {readFileSync} from 'node:fs';
const decodePng=async(b,W,H,cap=2_000_000)=>{
 if(b.length>cap) throw new Error('over byte cap');
 const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);
 if([...b.slice(0,8)].join(',')!=='137,80,78,71,13,10,26,10') throw new Error('not png');
 let p=8,w,h,bd,ct,il;const idat=[];
 while(p<b.length){const len=dv.getUint32(p);const typ=String.fromCharCode(b[p+4],b[p+5],b[p+6],b[p+7]);const d=b.subarray(p+8,p+8+len);
  if(typ==='IHDR'){w=dv.getUint32(p+8);h=dv.getUint32(p+12);bd=b[p+16];ct=b[p+17];il=b[p+20];}
  else if(typ==='IDAT')idat.push(d);else if(typ==='IEND')break;p+=12+len;}
 if(w!==W||h!==H||bd!==8||ct!==6||il!==0) throw new Error('unexpected IHDR');
 const ch=4,stride=w*ch,expected=(stride+1)*h;
 const ds=new Blob(idat).stream().pipeThrough(new DecompressionStream('deflate'));
 const raw=new Uint8Array(expected);let off=0;const rd=ds.getReader();
 for(;;){const {done,value}=await rd.read();if(done)break;if(off+value.length>expected) throw new Error('decompressed over cap');raw.set(value,off);off+=value.length;}
 if(off!==expected) throw new Error('short');
 const out=new Uint8Array(stride*h);
 for(let y=0;y<h;y++){const f=raw[y*(stride+1)];const si=y*(stride+1)+1,di=y*stride,pi=di-stride;
  for(let x=0;x<stride;x++){const a=x>=ch?out[di+x-ch]:0,bb=y>0?out[pi+x]:0,c=(x>=ch&&y>0)?out[pi+x-ch]:0;let v=raw[si+x];
   if(f===1)v+=a;else if(f===2)v+=bb;else if(f===3)v+=(a+bb)>>1;else if(f===4){const pp=a+bb-c,pa=Math.abs(pp-a),pb=Math.abs(pp-bb),pc=Math.abs(pp-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?bb:c);}else if(f!==0)throw new Error('bad filter');
   out[di+x]=v&255;}}
 return out;};
const count=(px,W,H)=>{let band=0,nb=0,nd=0;for(let y=0;y<H;y++){const lat=90-(y+0.5)*180/H;if(Math.abs(lat)>66.5)continue;for(let x=0;x<W;x++){const i=(y*W+x)*4;band++;if(px[i+3]===0){nd++;continue;}if(px[i]<12&&px[i+1]<12&&px[i+2]<12)nb++;}}return {band,nb,nd};};
const b=new Uint8Array(readFileSync(process.argv[2]));
const first=count(await decodePng(b,512,256),512,256);
const wall=[],cpu=[];
for(let i=0;i<60;i++){const c0=process.cpuUsage(),t0=performance.now();const px=await decodePng(b,512,256);count(px,512,256);const c1=process.cpuUsage(c0);wall.push(performance.now()-t0);cpu.push((c1.user+c1.system)/1000);}
const st=a=>{const s=[...a].sort((x,y)=>x-y);return {min:+s[0].toFixed(2),median:+s[30].toFixed(2),p90:+s[54].toFixed(2),max:+s[59].toFixed(2)}};
console.log(JSON.stringify({node:process.version,counts:first,n:60,wall_ms:st(wall),cpu_ms_process:st(cpu),first_run_wall_ms:+wall[0].toFixed(2)}));
