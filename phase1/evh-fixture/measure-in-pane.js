// Earth from Space, alert test plan rev 1.2 section 7.3: the measurement requests for ONE row set.
// Run in the browser pane ON THE MEASUREMENT WORKER'S OWN ADDRESS (open https://<its workers.dev address>/health/runs/earthview
// first, so these are same-origin requests and the headers are readable). It only makes GET and HEAD requests to the two health
// paths of that Worker. It sends nothing else anywhere. Paste the returned JSON into the result's evidence file for that set.
// 20 requests for each of: runs GET, runs HEAD, trial GET, trial HEAD = 80 requests, one after another.
(async () => {
  const N = 20, out = { origin: location.origin, started_at: new Date().toISOString(), requests: [] };
  for (const p of ['/health/runs/earthview', '/health/trial/earthview']) for (const method of ['GET', 'HEAD']) for (let i = 0; i < N; i++) {
    const t = performance.now(), res = await fetch(p, { method, cache: 'no-store' }), text = method === 'GET' ? await res.text() : '';
    let state = null, returned = null; try { const b = JSON.parse(text); state = b.facts && b.facts.state; returned = b.facts && b.facts.rows_read; } catch (_) {}
    const h = k => res.headers.get(k);
    out.requests.push({ path: p, method, i, status: res.status, x_health: h('X-Health'), wall_ms: Math.round((performance.now() - t) * 10) / 10,
      d1_rows_read: h('X-Evd1-Rows-Read'), d1_rows_written: h('X-Evd1-Rows-Written'), rows_returned: h('X-Evd1-Rows-Returned'), d1_sql_duration_ms: h('X-Evd1-Sql-Duration-Ms'),
      queries: h('X-Evd1-Queries'), d1_meta: h('X-Evd1-Meta'), state, body_rows_returned: returned });
  }
  out.finished_at = new Date().toISOString();
  return JSON.stringify(out);
})();
