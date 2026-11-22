// mother-earth-alarmtest: a throwaway Worker for the alarm tests of 22 Nov 2026
// (reviews/2026-11-22-earth-from-space-alarm-assessment.md rev 2, section 5). No bindings, no routes. Deleted after the tests.
export default {
  async fetch(req) {
    const p = new URL(req.url).pathname;
    if (p === '/cpu') { let x = 0; for (;;) { x += Math.sqrt(x + 1); } }
    if (p === '/mem') { const a = []; for (;;) { a.push(new Uint8Array(8 * 1024 * 1024).fill(1)); } }
    return new Response('mother-earth-alarmtest: nothing to see', { status: 200 });
  },
  async scheduled() { let x = 0; for (;;) { x += Math.sqrt(x + 1); } },
};
