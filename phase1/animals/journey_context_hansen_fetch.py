#!/usr/bin/env python3
"""Download the six Hansen/UMD GFC v1.13 files for the zebra's cells (stage C1a). Run once by Chad in Terminal.

Accepted by Chad on 25 Nov 2026: whole files, about 976.6 MB in all, kept private on the Mac (never committed or served).
Each file is checked against the byte length and MD5 that Google Cloud Storage published for it (HEAD, 25 Nov 2026 03:43 UTC):
reading stops the moment a file would pass its expected length; at the end the length and MD5 must match exactly; only
then is the .part file renamed. One attempt per file, no retries; the first failure stops the run. A manifest with state
"complete", "stopped" or "invalid" is written on every exit. Standard library only; no key or account is involved.
"""
import base64, hashlib, json, os, sys, time, urllib.request
from datetime import datetime, timezone

TEST_HOST = os.environ.get('ME_HANSEN_TEST_HOST')
BASE = (TEST_HOST or 'https://storage.googleapis.com') + '/earthenginepartners-hansen/GFC-2025-v1.13/'
ROOT = os.path.expanduser('~/Documents/Mother Earth')
FILES = [  # name, bytes, md5 (base64, as Google publishes it)
    ('Hansen_GFC-2025-v1.13_lossyear_10S_020E.tif', 77493920, '4eVKa2utpOlpmwxCjej6Pw=='),
    ('Hansen_GFC-2025-v1.13_treecover2000_10S_020E.tif', 644699457, 'yAZuhwrezkZkmHpMwyMloQ=='),
    ('Hansen_GFC-2025-v1.13_datamask_10S_020E.tif', 15405829, '31HG1wCLOtfmFGVGB8KByg=='),
    ('Hansen_GFC-2025-v1.13_lossyear_20S_020E.tif', 16557717, 'NsZ6wiflYx7Jb/PHHU9FiQ=='),
    ('Hansen_GFC-2025-v1.13_treecover2000_20S_020E.tif', 208210521, 'pTFf7SmoFd0eAzraDXTwaQ=='),
    ('Hansen_GFC-2025-v1.13_datamask_20S_020E.tif', 14248179, 'vqDhzJfp3AjSrqOSCIZc0w=='),
]
if TEST_HOST and os.environ.get('ME_HANSEN_TEST_FILES'): FILES = [tuple(x) for x in json.loads(os.environ['ME_HANSEN_TEST_FILES'])]
UA = 'MotherEarth-AnimalsContext/1 (https://github.com/TheOneTheOnlyTheChad/mother-earth)'

def main():
    out = os.path.join(ROOT, 'research', 'animals-journey-context', 'hansen-GFC-2025-v1.13')
    os.makedirs(out, exist_ok=False)
    m = {'what': 'Hansen/UMD GFC v1.13, six files for zebra cells 17_50 and 17_51', 'release': 'GFC-2025-v1.13',
         'licence': 'CC BY 4.0', 'credit': 'Source: Hansen/UMD/Google/USGS/NASA',
         'script_sha256': hashlib.sha256(open(__file__, 'rb').read()).hexdigest(),
         'started_utc': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'state': 'running', 'files': []}
    try:
        for name, size, md5 in FILES:
            rec = {'file': name, 'expected_bytes': size, 'expected_md5_b64': md5}; m['files'].append(rec)
            part = os.path.join(out, name + '.part'); t0 = time.monotonic(); got = 0
            h_md5, h_sha = hashlib.md5(), hashlib.sha256()
            print(f'{name}: downloading {size / 1e6:.1f} MB …', flush=True)
            try:
                with urllib.request.urlopen(urllib.request.Request(BASE + name, headers={'User-Agent': UA}), timeout=120) as r, open(part, 'wb') as f:
                    rec['status'] = r.status
                    while True:
                        chunk = r.read(1 << 20)
                        if not chunk: break
                        got += len(chunk)
                        if got > size: raise RuntimeError(f'more bytes than the expected {size}; stopped reading')
                        h_md5.update(chunk); h_sha.update(chunk); f.write(chunk)
            except Exception as e:
                rec['bytes'] = got; rec['error'] = (type(e).__name__ + ': ' + str(e))[:300]
                raise SystemExit(('stopped', f'{name}: {rec["error"]}'))
            rec['bytes'] = got; rec['seconds'] = round(time.monotonic() - t0, 1)
            rec['md5_b64'] = base64.b64encode(h_md5.digest()).decode(); rec['sha256'] = h_sha.hexdigest()
            if got != size: raise SystemExit(('invalid', f'{name}: {got} bytes, expected {size}'))
            if rec['md5_b64'] != md5: raise SystemExit(('invalid', f'{name}: MD5 does not match the published value'))
            os.rename(part, os.path.join(out, name))
            print(f'{name}: ok ({rec["seconds"]} s)', flush=True)
        m['state'] = 'complete'; m['reason'] = 'all six files match their published length and MD5'
    except SystemExit as e:
        m['state'], m['reason'] = e.code if isinstance(e.code, tuple) else ('stopped', str(e.code))
    except Exception as e:
        m['state'], m['reason'] = 'invalid', f'unexpected error: {type(e).__name__}: {e}'[:300]
    finally:
        for f in os.listdir(out):
            if f.endswith('.part'): os.rename(os.path.join(out, f), os.path.join(out, f + '.incomplete'))
        m['finished_utc'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        with open(os.path.join(out, 'manifest.json'), 'w') as f: json.dump(m, f, indent=1)
    where = out.replace(os.path.expanduser('~'), '~')
    if m['state'] == 'complete': print(f'COMPLETE: six files, {sum(x["bytes"] for x in m["files"]) / 1e6:.1f} MB, in {where}'); return 0
    print(f"{m['state'].upper()}: {m['reason']}. Manifest in {where}. Nothing here is complete; do not build from it."); return 1

if __name__ == '__main__':
    sys.exit(main())
