#!/usr/bin/env python3
"""Mother Earth review server: serves the folder it is started in on 127.0.0.1 only, and accepts one kind of write:
POST /_save/<name>.json (name: lower-case letters, digits and hyphens; body at most 2 MB) is stored unchanged in ./_results/,
never over an existing file. This is how a measurement run in the browser hands back its complete raw result.
Usage, from the review copy:  python3 reviews/evidence/2026-11-22-animals-satellite-rc/serve-and-save.py 8913"""
import http.server, os, re, sys

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def do_POST(self):
        m = re.fullmatch(r'/_save/([a-z0-9-]{1,80})\.json', self.path)
        n = int(self.headers.get('Content-Length') or 0)
        if not m or n <= 0 or n > 2_000_000:
            self.send_response(400); self.end_headers(); return
        body = self.rfile.read(n); os.makedirs('_results', exist_ok=True)
        k = 0
        while True:
            p = os.path.join('_results', m.group(1) + ('' if k == 0 else '-%d' % k) + '.json')
            try:
                with open(p, 'xb') as f: f.write(body)
                break
            except FileExistsError: k += 1
        out = p.encode(); self.send_response(200); self.send_header('Content-Type', 'text/plain'); self.send_header('Content-Length', str(len(out))); self.end_headers(); self.wfile.write(out)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8913
print('Serving', os.getcwd(), 'on http://127.0.0.1:%d (results are saved to ./_results/)' % port, flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
