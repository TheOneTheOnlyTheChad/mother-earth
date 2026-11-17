/* Aircraft positions as plain dots — page suite for aircraft.js (aircraft-dots-rc). Runs the REAL aircraft.js in node with a small
 * stand-in for the document, the canvas and the globe: no browser, no network, no real picture. It checks what the page accepts,
 * refuses, says and removes. It does NOT check how the dots look on the globe (see the review packet).
 * Run: node phase1/aircraft-dots-page.test.cjs      Breaks (each must fail the suite): BREAK=any-fields|keep-old|no-clear|tap|both-on */
const fs = require('fs'), path = require('path'), vm = require('vm');
let src = fs.readFileSync(path.join(__dirname, '..', 'aircraft.js'), 'utf8');
const BREAK = process.env.BREAK || '';
const brk = (a, b) => { if (!src.includes(a)) { console.log('FAIL  break target not found: ' + a.slice(0, 60)); process.exit(1); } src = src.replace(a, b); };
if (BREAK === 'any-fields') brk("if (f.length !== DT.FIELDS.length || f.some((x, i) => x !== DT.FIELDS[i])) return", "if (false) return");
if (BREAK === 'keep-old') brk("dotsDestroy(); built.parent.add(built.mesh); dt.meshes = [built.mesh];", "built.parent.add(built.mesh); dt.meshes = [built.mesh];");
if (BREAK === 'no-clear') brk("const dotsOld = env => ageMs(env) >= env.staleS * 1e3;", "const dotsOld = env => false;");
if (BREAK === 'both-on') brk("    if (st.on) await setOn(false);       // the other half of the same rule", "");
if (BREAK === 'tap') brk("built.mesh.__air = false; built.mesh.__airdots = true;", "built.mesh.__air = false; built.mesh.__airdots = true; built.mesh.raycast = function () { return 1; };");
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log('FAIL  ' + n + (got !== undefined ? '\n      got: ' + JSON.stringify(got).slice(0, 500) : '')); } };

// ---------- stand-ins
const els = {}; const el = id => els[id] || (els[id] = { id, hidden: false, textContent: '', innerHTML: '', className: '', attrs: {}, listeners: {},
  setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; }, addEventListener(t, f) { this.listeners[t] = f; } });
['tgl-air', 's-air', 'o-air', 'air-frame', 'air-extra', 'air-read', 'air-key', 'tgl-airdots', 's-airdots', 'o-airdots', 'airdots-frame', 'airdots-extra'].forEach(el);
Object.keys(els).forEach(k => { const e = els[k]; Object.defineProperty(e, 'innerHTML', { set(v) { this._h = v; this.textContent = String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }, get() { return this._h || ''; } }); });
const canvases = [];
function Canvas() { const c = { width: 0, height: 0, arcs: [], fills: 0, getContext() { return { fillStyle: '', strokeStyle: '', lineWidth: 1, beginPath() { }, moveTo() { }, arc(x, y, r) { c.arcs.push([x, y, r, this.fillStyle]); }, fill() { c.fills++; }, fillRect() { }, strokeRect() { } }; } }; canvases.push(c); return c; }
class Tex { constructor(img) { this.image = img; this.disposed = false; } dispose() { this.disposed = true; } }
class Mat { constructor(o) { Object.assign(this, o); this.disposed = false; } dispose() { this.disposed = true; } }
class SphereGeometry { constructor(R) { this.R = R; this.type = 'SphereGeometry'; this.parameters = {}; this.disposed = false; } dispose() { this.disposed = true; } }
class Mesh { constructor(g, m) { this.geometry = g; this.material = m; this.isMesh = true; this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.parent = null; this.renderOrder = 0; } }
const group = { children: [], add(m) { this.children.push(m); m.parent = this; }, remove(m) { this.children = this.children.filter(x => x !== m); m.parent = null; } };
const gmat = new Mat({ map: new Tex({}) }), gmesh = new Mesh(new SphereGeometry(100), gmat); group.add(gmesh);
const globe = { scene: () => ({ traverse(f) { group.children.forEach(f); } }), globeMaterial: () => gmat, getGlobeRadius: () => 100 };
const doc = { hidden: false, listeners: {}, createElement: t => t === 'canvas' ? Canvas() : {}, addEventListener(t, f) { this.listeners[t] = f; }, getElementById: id => els[id] || null };
let fetched = [];
const ME = { $: id => els[id] || null, esc: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), HUB: 'https://hub.test', globe: () => globe, taps: [] };
const win = { ME };
const ctx = vm.createContext({ window: win, document: doc, console, setInterval: () => 1, clearInterval() { }, setTimeout, Date, Math, JSON, Number, String, Array, Object, Float32Array, Promise, Error, RegExp,
  fetch: async u => { fetched.push(u); throw new Error('this suite never uses the network'); } });
vm.runInContext(src, ctx, { filename: 'aircraft.js' });
const A = ME.aircraft, D = A && A.dots;
ok('aircraft.js loads and exposes the dots aids', !!D && typeof D.check === 'function' && typeof D.setOn === 'function');
if (!D) { console.log(`\naircraft-dots-page: ${pass} passed, ${fail} failed`); process.exit(1); }

// ---------- what the page accepts and refuses
const T = '2026-11-17T12:00:00.000Z', NOW = Date.parse(T) + 20 * 60e3; A.opts.now = NOW;
const file = (over = {}) => ({ layer: 'opensky', source_status: 'ok', window_end: T, window_start: T, retrieved_at: T, position_age_cutoff_s: 300, stale_after_s: 10800, position_precision_deg: 0.01,
  record_format: 'rows', record_fields: ['lat', 'lng'], records: [[-33.9, 18.6], [48.86, 2.35], [0, 179.99], [10, -179.99]], cells: {}, ...over });
const c0 = D.check(file());
ok('a lat,lng file is accepted: 4 positions, time, cut-off, precision', c0.ok && c0.env.n === 4 && c0.env.time === T && c0.env.cutS === 300 && c0.env.step === 0.01 && c0.env.staleS === 10800, c0);
ok('the accepted positions are numbers only', c0.ok && c0.env.pts.length === 8 && Math.abs(c0.env.pts[0] + 33.9) < 1e-5);
const refuse = (over, re) => { const r = D.check(file(over)); return !r.ok && re.test(r.why); };
ok('a file with an address field is refused', refuse({ record_fields: ['icao24', 'lat', 'lng'], records: [['aaaaaa', 1, 2]] }, /more than a latitude and a longitude/));
ok('a file with any extra field is refused, even with lat,lng first', refuse({ record_fields: ['lat', 'lng', 'callsign'], records: [[1, 2, 'TEST123']] }, /more than a latitude and a longitude/) && refuse({ record_fields: ['lat', 'lng', 'baro_alt_m'], records: [[1, 2, 3]] }, /more than/));
ok('fields in another order or under other names are refused', refuse({ record_fields: ['lng', 'lat'] }, /more than/) && refuse({ record_fields: ['latitude', 'longitude'] }, /more than/));
ok('a row with a third value, a string or an impossible value is refused', refuse({ records: [[1, 2, 3]] }, /not readable/) && refuse({ records: [['aaaaaa', 2]] }, /not readable/) && refuse({ records: [[91, 2]] }, /not readable/) && refuse({ records: [[1, 181]] }, /not readable/) && refuse({ records: [[null, 2]] }, /not readable/));
ok('a counts-only file says no positions have been collected', (() => { const r = D.check(file({ record_fields: [], records: [] })); return !r.ok && r.none && /counts only: no positions have been collected yet/.test(r.why); })());
ok('the hub holding positions back as expired: nothing drawn, the snapshot time is given', (() => { const r = D.check(file({ positions: 'withheld_expired', positions_max_age_s: 10800, record_fields: [], records: [] })); return !r.ok && r.none && /from 12:00 UTC, 17 Nov 2026, more than 3 hours ago/.test(r.why) && /no longer served/.test(r.why); })());
ok('the hub holding positions back while switched off: nothing drawn, said plainly', (() => { const r = D.check(file({ positions: 'withheld_off', record_fields: [], records: [] })); return !r.ok && r.none && /not being published at the moment/.test(r.why); })());
ok('a file marked withheld is never drawn even if it still carried rows', !D.check(file({ positions: 'withheld_expired' })).ok && !D.check(file({ positions: 'withheld_off' })).ok);
ok('no time, no age limit, wrong layer, a down run: refused', refuse({ window_end: null }, /no readable time/) && refuse({ position_age_cutoff_s: undefined }, /how old a position may be/) && refuse({ layer: 'ships' }, /not the aircraft snapshot/) && (() => { const r = D.check(file({ source_status: 'down' })); return !r.ok && r.down; })());
ok('more positions than the layer draws: refused', refuse({ records: Array.from({ length: D.config.MAX + 1 }, () => [1, 2]) }, /more positions than/));

// ---------- drawing
const cv = D.compose(c0.env);
ok('one dot per position (dark edge pass, then dot pass)', cv.__airdots.drawn === 4 && cv.fills === 2 && cv.width === D.config.W && cv.height === D.config.H, cv.__airdots);
ok('a dot on the 180° seam is drawn on both edges', cv.arcs.filter(a => a[3] === D.config.FILL).length === 6, cv.arcs.length);
const dotAt = cv.arcs.find(a => a[3] === D.config.FILL && Math.abs(a[1] - (90 + 33.9) / 180 * D.config.H) < 0.01);
ok('a position lands where its latitude and longitude put it', dotAt && Math.abs(dotAt[0] - (18.6 + 180) / 360 * D.config.W) < 0.01, dotAt);

(async () => {
  // ---------- on, labels, replace, clear, off
  let served = file(); D.opts.source = async () => served;
  ok('off on load, nothing in the scene, nothing requested', D.state().on === false && D.state().meshes === 0 && /Off\. Switch on/.test(D.state().off) && fetched.length === 0, D.state());
  await D.setOn(true);
  let s = D.state();
  ok('switched on: one sheet in the scene, state "loaded"', s.on && s.meshes === 1 && s.inScene === 1 && s.stateWord === 'loaded' && s.n === 4, s);
  ok('label gives the snapshot time, its age and the number of positions', /OpenSky snapshot of 12:00 UTC, 17 Nov 2026/.test(s.label) && /20 min ago/.test(s.label) && /4 aircraft positions/.test(s.label), s.label);
  ok('the note says what a dot is and is not', /where an aircraft last reported a position, no more than 5 minutes before the snapshot time, rounded to 0\.01°/.test(s.extra) && /not a live view/.test(s.extra) && /cannot be tapped/.test(s.extra) && /not followed from one snapshot to the next/.test(s.extra) && /Cleared when the snapshot is 3 hours old/.test(s.extra), s.extra);
  const m1 = group.children.find(m => m.__airdots);
  ok('the dots sheet is not a pick target and sits above the counts sheet', m1 && m1.raycast() === undefined && m1.renderOrder === D.config.ORDER && m1.renderOrder > -1 && m1.geometry.R > 100 * (1 + A.config.ALT), m1 && m1.renderOrder);
  ok('the page registers no tap reader for dots (only the counts reader)', ME.taps.length === 1);
  const T2 = '2026-11-17T14:24:00.000Z'; served = file({ window_end: T2, window_start: T2, records: [[1, 2]] }); A.opts.now = Date.parse(T2) + 60e3;
  await D.refresh(); s = D.state();
  ok('a newer snapshot replaces the dots: still ONE sheet, the earlier one removed and disposed', s.meshes === 1 && s.inScene === 1 && s.n === 1 && s.time === T2 && group.children.filter(m => m.__airdots).length === 1 && m1.parent === null && m1.geometry.disposed && m1.material.disposed && m1.material.map.disposed, { s, kids: group.children.length });
  served = file(); await D.refresh(); s = D.state();
  ok('an older file never replaces a newer one', s.time === T2 && s.n === 1, s);
  served = file({ window_end: T2, record_fields: ['icao24', 'lat', 'lng'], records: [['aaaaaa', 1, 2]] }); await D.refresh(); s = D.state();
  ok('a refresh that brings an address field clears the dots and draws nothing', s.meshes === 0 && group.children.filter(m => m.__airdots).length === 0 && s.stateWord === 'unknown' && /could not be shown/.test(s.off) && /Nothing is drawn/.test(s.off) && !/aaaaaa/.test(JSON.stringify(s)), s);
  served = file({ window_end: T2, window_start: T2 }); await D.refresh();
  A.opts.now = Date.parse(T2) + 3 * 3600e3 - 1000; D.ageTick(); s = D.state();
  ok('just under three hours old: still drawn', s.meshes === 1, s);
  A.opts.now = Date.parse(T2) + 3 * 3600e3; D.ageTick(); s = D.state();
  ok('at three hours old the dots are cleared, and the page says so', s.meshes === 0 && group.children.filter(m => m.__airdots).length === 0 && /more than 3 hours ago, and have been cleared/.test(s.off), s);
  served = file({ window_end: T2, window_start: T2 }); await D.refresh(); s = D.state();
  ok('a snapshot already three hours old is never drawn', s.meshes === 0 && /more than 3 hours ago/.test(s.off) && /no positions are drawn/.test(s.off), s);
  A.opts.now = Date.parse(T2) + 60e3; await D.setOn(false); await D.setOn(true); s = D.state();
  ok('off then on again draws the snapshot', s.meshes === 1 && s.n === 4, s);
  await D.setOn(false); s = D.state();
  ok('switched off: nothing in the scene, state "off"', s.on === false && s.meshes === 0 && group.children.filter(m => m.__airdots).length === 0 && s.stateWord === 'off', s);
  ok('the counts layer was never switched on or requested by any of this', A.state().on === false && A.state().requests.length === 0 && fetched.length === 0, A.state().requests);
  D.opts.source = null; await D.setOn(true); s = D.state();
  ok('without a supplied file the page asks the hub for /snapshot/opensky and nothing else', fetched.length === 1 && fetched[0] === 'https://hub.test/snapshot/opensky' && s.requests.join() === '/snapshot/opensky' && s.meshes === 0 && /could not be loaded/.test(s.off), [fetched, s.off]);
  // ---------- counts and positions are exclusive (rev 3)
  await D.setOn(false); D.opts.source = async () => file({ window_end: T2, window_start: T2 }); A.opts.now = Date.parse(T2) + 60e3;
  await A.setOn(true);
  ok('rev3. counts switched on (the hub is not reachable here, so it reads unknown): on, positions off', A.state().on === true && D.state().on === false);
  await D.setOn(true);
  ok('rev3. positions switched on: the counts switch goes off, its sheet is gone, only the dots sheet is in the scene', D.state().on === true && D.state().meshes === 1 && A.state().on === false && A.state().meshes === 0 && els['tgl-air'].attrs['aria-checked'] === 'false' && els['tgl-airdots'].attrs['aria-checked'] === 'true' && els['s-air'].textContent === 'off' && group.children.filter(m => m.__air || m.__airdots).length === 1, [A.state().on, D.state().on]);
  await A.setOn(true);
  ok('rev3. counts switched on again: the positions switch goes off and its dots are removed', A.state().on === true && D.state().on === false && D.state().meshes === 0 && group.children.filter(m => m.__airdots).length === 0 && els['tgl-airdots'].attrs['aria-checked'] === 'false' && els['s-airdots'].textContent === 'off', [A.state().on, D.state().on]);
  await A.setOn(false);
  ok('rev3. both can be off', A.state().on === false && D.state().on === false && group.children.filter(m => m.__air || m.__airdots).length === 0);
  ok('rev3. dot radius is the small size Chad chose', D.config.R_PX === 1.6);
  console.log(`\naircraft-dots-page${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
