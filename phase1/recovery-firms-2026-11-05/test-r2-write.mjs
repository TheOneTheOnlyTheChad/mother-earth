import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(process.argv[2], 'utf8'), GZ = fs.readFileSync(process.argv[3]);
const b64 = GZ.toString('base64');
function world(store, opts = {}) {
  const calls = [];
  const ok = (b, s = 200) => new Response(JSON.stringify(b), { status: s });
  const fetchMock = async (url, o = {}) => {
    const m = (o.method || 'GET'); calls.push(m + ' ' + url);
    const u = new URL(url, 'https://dash.cloudflare.com');
    if (u.pathname.endsWith('/workers/scripts/mother-earth/settings')) return ok({ result: { bindings: [{ type: 'd1', name: 'DB', id: 'db1' }] } });
    if (u.pathname.endsWith('/lifecycle')) return ok({ result: { rules: [{ id: 'raw', enabled: true, conditions: { prefix: 'raw/' } }, { id: 'snap', enabled: true, conditions: { prefix: 'snapshots/' } }, { id: 'cells', enabled: true, conditions: { prefix: 'cells/' } }] } });
    if (u.pathname.endsWith('/d1/database/db1/query')) { const sql = JSON.parse(o.body).sql; if (!/^SELECT/.test(sql)) throw new Error('non-select D1: ' + sql); return ok({ success: true, result: [{ results: [{ sql, v: opts.d1v || 1 }] }] }); }
    const om = u.pathname.match(/\/r2\/buckets\/mother-earth\/objects\/?(.*)$/);
    if (om) {
      const key = om[1].split('/').map(decodeURIComponent).join('/');
      if (!key && m === 'GET') { const p = u.searchParams.get('prefix'); return ok({ result: Object.entries(store).filter(([k]) => k.startsWith(p)).map(([k, v]) => ({ key: k, size: String(v.length), etag: 'e' + v.length, last_modified: '2026-11-06T09:00:00Z' })) }); }
      if (m === 'GET') return store[key] ? new Response(store[key]) : ok({}, 404);
      if (m === 'PUT') { if (opts.failPut) return ok({ success: false }, 500); store[key] = Buffer.from(await new Response(o.body).arrayBuffer()); return ok({ success: true }); }
      throw new Error('unexpected ' + m + ' ' + key);
    }
    throw new Error('unexpected url ' + url);
  };
  const ctx = vm.createContext({ fetch: fetchMock, crypto, Response, Blob, DecompressionStream, Uint8Array, atob, URL, JSON, Error, Date, Object, Array, Promise, console });
  ctx.window = ctx; ctx.bootstrap = { atok: 'tok' };
  vm.runInContext(SRC, ctx); return { REC: ctx.REC, calls, store };
}
const feed = async (REC, data) => { const s = data.toString('base64'); for (let i = 0, n = 0; i < s.length; i += 150000, n++) REC.addChunk(n, s.slice(i, i + 150000)); return REC.assemble(); };
const KEY = 'archive/recoveries/firms/2026-11-05.json.gz', ORIG = 'archive/checkpoints/firms/2026-11-05.json.gz';
const res = [];
const t = async (name, fn) => { try { res.push([name, await fn()]); } catch (e) { res.push([name, 'THREW: ' + e.message]); } };
// A: absent → written → verify ok → untouched ok; only one PUT, to the key
await t('A absent: write + verify + untouched', async () => { const w = world({ [ORIG]: Buffer.from('orig') }); await w.REC.precheck(); await feed(w.REC, GZ);
  const p = await w.REC.put(), v = await w.REC.verify(), u = await w.REC.untouched();
  const puts = w.calls.filter(c => !c.startsWith('GET') && !c.includes('/d1/'));
  return `${p.result.action} | verify ok=${v.result.ok} | untouched ok=${u.result.ok} | non-GET calls: ${JSON.stringify(puts)} | rules matching dest: ${JSON.stringify((w.REC.log[0].result.rules_matching_destination))}`; });
// B: identical exists → no-op, no PUT
await t('B identical exists → no-op', async () => { const w = world({ [KEY]: GZ, [ORIG]: Buffer.from('orig') }); await w.REC.precheck(); await feed(w.REC, GZ); const p = await w.REC.put(); return `${p.result.action} | PUTs: ${w.calls.filter(c => c.startsWith('PUT')).length}`; });
// C: different exists → stop, no PUT, object unchanged
await t('C different exists → stop', async () => { const other = Buffer.from('different'); const w = world({ [KEY]: other, [ORIG]: Buffer.from('orig') }); await w.REC.precheck(); await feed(w.REC, GZ); const p = await w.REC.put(); return `${p.result.action} | PUTs: ${w.calls.filter(c => c.startsWith('PUT')).length} | unchanged: ${w.store[KEY].equals(other)}`; });
// D: corrupted bytes → assemble refuses, put throws, no PUT
await t('D corrupted bytes → refuse', async () => { const w = world({ [ORIG]: Buffer.from('orig') }); await w.REC.precheck(); const bad = Buffer.from(GZ); bad[1000] ^= 1; const a = await feed(w.REC, bad); let e = 'no throw'; try { await w.REC.put(); } catch (x) { e = x.message; } return `matches_pin=${a.result.matches_pin} | put: ${e} | PUTs: ${w.calls.filter(c => c.startsWith('PUT')).length}`; });
// E: PUT fails → verify reports not found
await t('E PUT fails → verify fails', async () => { const w = world({ [ORIG]: Buffer.from('orig') }, { failPut: true }); await w.REC.precheck(); await feed(w.REC, GZ); const p = await w.REC.put(); const v = await w.REC.verify(); return `${p.result.action} http ${p.result.http} | verify ok=${v.result.ok} (${v.result.reason})`; });
// F: original changed between before and after → untouched fails
await t('F original changed → untouched fails', async () => { const w = world({ [ORIG]: Buffer.from('orig') }); await w.REC.precheck(); w.store[ORIG] = Buffer.from('orig2'); const u = await w.REC.untouched(); return `untouched ok=${u.result.ok} ${JSON.stringify(u.result.same)}`; });
// G: no sign-in
for (const [n, r] of res) console.log(n.padEnd(42), '→', r);
