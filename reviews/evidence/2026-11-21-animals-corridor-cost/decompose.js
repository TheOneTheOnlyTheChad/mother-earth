/* Mother Earth — Animals corridor: EXPERIMENT to find what the switch-on task is made of. Not a clean measurement.
 * Run in the console of animals.html, Chrome, window visible. It changes the globe's polygon settings in this tab only;
 * reload the page afterwards. Result: window.__ME_DECOMP.
 * Method: switch the corridor on with the page's own switch, take the very polygon data the page gave the library
 * (g.polygonsData()), then for each variant: empty the layer, set the variant's public library options, give the same data
 * back and read the browser's own 'longtask' and 'long-animation-frame' records for the next 900 ms. The library's pointer
 * hit-testing is switched off for the whole experiment so that only building and first drawing are in the records.
 * Variants: as the page draws it; without the outline (stroke); without side walls; without both; as the page draws it again.
 * A fixed arithmetic loop is timed first so that two machines can be compared. */
(async () => {
  const OUT = window.__ME_DECOMP = { done: false, started: new Date().toISOString(), ua: navigator.userAgent, visibility: document.visibilityState, focus: document.hasFocus(), variants: [] };
  try {
    const sleep = ms => new Promise(r => setTimeout(r, ms)), g = ME.animalsGlobe.raw(), sw = document.getElementById('cor-tgl'), C = ME.corridor.C;
    const bench = () => { const t = performance.now(); let s = 0; for (let i = 1; i < 3e7; i++) s += Math.sqrt(i) * Math.sin(i); return Math.round(performance.now() - t); };
    OUT.bench_ms = [bench(), bench(), bench()];
    const LT = [];
    new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push({ type: 'longtask', s: e.startTime, d: e.duration }); }).observe({ type: 'longtask' });
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push({ type: 'loaf', s: e.startTime, d: e.duration, scripts: (e.scripts || []).map(x => [Math.round(x.duration), String(x.invoker || '').split(':')[0].slice(0, 24)]) }); }).observe({ type: 'long-animation-frame' }); } catch (_) { }
    if (!ME.corridor.state().on) { sw.click(); } const t = performance.now(); while (ME.corridor.state().status !== 'shown') { if (performance.now() - t > 30000) throw new Error('not shown'); await sleep(50); } await sleep(1500);
    const data = g.polygonsData(); OUT.features = data.map(d => [d.key, d.geometry.coordinates.length, d.geometry.coordinates.reduce((n, p) => n + p.reduce((m, r) => m + r.length, 0), 0)]);
    g.enablePointerInteraction(false);
    const V = [['as drawn', true, true], ['no outline', false, true], ['no side walls', true, false], ['no outline, no side walls', false, false], ['as drawn (again)', true, true]];
    for (const [label, stroke, sides] of V) { const reps = [];
      for (let i = 0; i < 3; i++) { g.polygonsData([]); await sleep(700);
        g.polygonStrokeColor(stroke ? d => C.STROKE[d.key] : () => null).polygonSideColor(sides ? () => 'rgba(0,0,0,0)' : () => null);
        const t0 = performance.now(); g.polygonsData(data); await sleep(900); await sleep(200);
        const e = LT.filter(x => x.s + x.d > t0 && x.s < t0 + 900), tasks = e.filter(x => x.type === 'longtask').map(x => Math.round(x.d)), fr = e.filter(x => x.type === 'loaf');
        reps.push({ tasks, longest: Math.max(0, ...tasks), frame_scripts: fr.map(f => f.scripts) }); }
      OUT.variants.push({ label, longest: reps.map(r => r.longest), tasks: reps.map(r => r.tasks), scripts: reps[0].frame_scripts }); }
    OUT.bench_end_ms = bench(); OUT.ended = new Date().toISOString(); OUT.note = 'Reload the page: the polygon options of this tab were changed.';
  } catch (e) { OUT.error = String(e && e.stack || e).slice(0, 400); }
  OUT.done = true;
})();
