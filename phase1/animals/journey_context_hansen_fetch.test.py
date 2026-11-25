#!/usr/bin/env python3
"""Offline controls for journey_context_hansen_fetch.py (local stand-in server; no network). Run: python3 -I phase1/animals/journey_context_hansen_fetch.test.py phase1/animals/journey_context_hansen_fetch.py"""
import base64, hashlib, http.server, json, os, shutil, socket, subprocess, sys, tempfile, threading
S = sys.argv[1]
blobs = {'a.tif': os.urandom(300000), 'b.tif': os.urandom(200000)}
md5 = lambda b: base64.b64encode(hashlib.md5(b).digest()).decode()
def serve(mode):
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    class H(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a): pass
        def do_GET(self):
            n = self.path.rsplit('/', 1)[-1]; b = blobs.get(n)
            if b is None: self.send_response(404); self.end_headers(); return
            if mode == 'corrupt' and n == 'b.tif': b = b[:-1] + bytes([b[-1] ^ 1])
            if mode == 'long' and n == 'b.tif': b = b + b'x' * 5000
            if mode == 'short' and n == 'b.tif': b = b[:-10]
            self.send_response(200); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    h = http.server.ThreadingHTTPServer(('127.0.0.1', port), H); threading.Thread(target=h.serve_forever, daemon=True).start(); return h, port
res = []
for mode, want in [('ok', 'complete'), ('corrupt', 'invalid'), ('long', 'stopped'), ('short', 'invalid'), ('missing', 'stopped')]:
    home = tempfile.mkdtemp(); os.makedirs(os.path.join(home, 'Documents', 'Mother Earth'))
    h, port = serve(mode)
    files = [['a.tif', len(blobs['a.tif']), md5(blobs['a.tif'])], ['b.tif' if mode != 'missing' else 'zz.tif', len(blobs['b.tif']), md5(blobs['b.tif'])]]
    env = dict(os.environ, HOME=home, ME_HANSEN_TEST_HOST=f'http://127.0.0.1:{port}', ME_HANSEN_TEST_FILES=json.dumps(files))
    p = subprocess.run([sys.executable, '-I', S], env=env, capture_output=True, text=True, timeout=60); h.shutdown()
    d = os.path.join(home, 'Documents', 'Mother Earth', 'research', 'animals-journey-context', 'hansen-GFC-2025-v1.13')
    m = json.load(open(os.path.join(d, 'manifest.json'))); listing = sorted(os.listdir(d))
    ok = m['state'] == want and (p.returncode == 0) == (want == 'complete') and (want != 'complete' or listing == ['a.tif', 'b.tif', 'manifest.json']) and (want == 'complete' or not any(f == 'b.tif' for f in listing))
    print(('PASS' if ok else 'FAIL'), mode, m['state'], p.returncode, listing, m.get('reason')); res.append(ok)
    shutil.rmtree(home)
print(f'{sum(res)} passed, {len(res) - sum(res)} failed'); sys.exit(0 if all(res) else 1)
