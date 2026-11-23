"""Rebuilds the three *-1536-derived.jpg inputs from the real 2,048 px frames beside this file.
The committed files were made with Pillow 12.3.0; with that version this script reproduces them byte for byte (it checks, and says
so). Another Pillow or libjpeg version may give different bytes: the tests do not depend on the exact bytes, only on a 1,536 px
progressive JPEG of the same picture.   python3 phase1/earthview-fixtures/make-1536-derived.py [--check]"""
import hashlib, io, os, sys
from PIL import Image, __version__
HERE = os.path.dirname(os.path.abspath(__file__))
WANT = {'day': '4625662042f293b6585de7939d924900afa1bf56da8296bc3015613ec81b9651', 'night': '335bc3e2a81ea1425047c976b382e1eb729523ded274270019a80386da91928d', 'dusk': 'f219f6ec295fe930ee4a4585753c32a48e354a38955e0271724b39940fbf3364'}
same = True
for n, want in WANT.items():
    buf = io.BytesIO(); Image.open(os.path.join(HERE, n + '.jpg')).resize((1536, 1536), Image.LANCZOS).save(buf, 'JPEG', quality=88, progressive=True, subsampling='4:2:0', optimize=True)
    got = hashlib.sha256(buf.getvalue()).hexdigest(); same &= got == want
    print(n, 'identical to the committed file' if got == want else 'DIFFERENT bytes from the committed file (Pillow ' + __version__ + ')')
    if '--check' not in sys.argv: open(os.path.join(HERE, n + '-1536-derived.jpg'), 'wb').write(buf.getvalue())
sys.exit(0 if same else 1)
