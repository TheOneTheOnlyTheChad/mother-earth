#!/usr/bin/env python3
"""Local server for the page suites written before Bare Earth (bare-earth-rc).
Serves the repo on 127.0.0.1:8899 exactly as `python3 -m http.server` does, with ONE change: in index.html the constant
`const START_ON = [];` is served as the four core layers, so those suites still see the page they were written for
(earthquakes, fires, ships and forest on at load). Everything else in every file is served byte for byte.
The real default (bare) is tested by phase1/bare-earth-ui.test.cjs, which reads index.html from disk itself.
Run from the repo root:  python3 phase1/serve-core-on.py"""
import http.server, os, sys
BARE = b"const START_ON = [];"
CORE = b"const START_ON = ['usgs', 'firms', 'ships', 'forest'];"
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        if path in ('/', '/index.html'):
            body = open(os.path.join(os.getcwd(), 'index.html'), 'rb').read()
            if body.count(BARE) != 1:
                self.send_error(500, 'index.html does not contain exactly one START_ON = []'); return
            body = body.replace(BARE, CORE)
            self.send_response(200); self.send_header('Content-Type', 'text/html'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body); return
        return super().do_GET()
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8899), H).serve_forever()
