"""Earth orientation for the Sky zoom-out scene: ICRF (GCRS input) -> Earth-fixed, at a UTC instant.

Method (SKY-ZOOM-OUT-PROPOSAL rev 2.2 §3.4): IAU 2006 bias-precession (Fukushima-Williams angles) followed by
Greenwich mean sidereal time (IAU 2006). Stated assumptions, also written into the scene file and Sources:
  - no nutation;
  - polar motion 0;
  - UT1 = UTC (IERS Bulletin A, 5 Nov 2026, predicts |UT1-UTC| <= 0.268 s to 2027-11-05: an estimate);
  - TT = UTC + 69.184 s (TAI-UTC = 37 s, IERS Bulletin C 72; the same leap-second assumption as the exports' UT~ rows);
  - the Earth-centred ICRF axes of the Horizons exports are taken as aligned with the GCRS input.
Agreement with the full IAU chain (ERFA c2t06a) is measured by phase1/sky-scene-build.test.mjs; no accuracy is claimed.

The functions below are transcribed into Python from ERFA (github.com/liberfa/erfa, commit
1a8044cde5b7763295d472a6443387239127c6c8). Source files and sha256 prefixes:
  pfw06.c 085f4986  fw2m.c 480d1ae7  obl06.c 55026087  pmat06.c f8c33e0f  gmst06.c 5adeede2  era00.c 91c092c3
  ir.c 55e3325c  rz.c d4ef2eb4  rx.c b740bba3  anp.c 41f13291
ERFA is a library derived from SOFA, rather than SOFA itself. Every one of those files ends with the notice below
(checked identical across all ten); it is retained here verbatim, as its condition 1 requires, together with
the repository LICENSE text (sha256 b1858f9a..., which carries the same terms with "2013-2021"):

#
#
# Copyright (C) 2013-2023, NumFOCUS Foundation.
# All rights reserved.
#
# This library is derived, with permission, from the International
# Astronomical Union's "Standards of Fundamental Astronomy" library,
# available from http://www.iausofa.org.
#
# The ERFA version is intended to retain identical functionality to
# the SOFA library, but made distinct through different function and
# file names, as set out in the SOFA license conditions.  The SOFA
# original has a role as a reference standard for the IAU and IERS,
# and consequently redistribution is permitted only in its unaltered
# state.  The ERFA version is not subject to this restriction and
# therefore can be included in distributions which do not support the
# concept of "read only" software.
#
# Although the intent is to replicate the SOFA API (other than
# replacement of prefix names) and results (with the exception of
# bugs;  any that are discovered will be fixed), SOFA is not
# responsible for any errors found in this version of the library.
#
# If you wish to acknowledge the SOFA heritage, please acknowledge
# that you are using a library derived from SOFA, rather than SOFA
# itself.
#
#
# TERMS AND CONDITIONS
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
#
# 1 Redistributions of source code must retain the above copyright
#   notice, this list of conditions and the following disclaimer.
#
# 2 Redistributions in binary form must reproduce the above copyright
#   notice, this list of conditions and the following disclaimer in
#   the documentation and/or other materials provided with the
#   distribution.
#
# 3 Neither the name of the Standards Of Fundamental Astronomy Board,
#   the International Astronomical Union nor the names of its
#   contributors may be used to endorse or promote products derived
#   from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
# FOR A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE
# COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
# BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
# LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
# ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.
#
"""
import math

D2PI = 6.283185307179586476925287       # ERFA_D2PI
DAS2R = 4.848136811095359935899141e-6   # ERFA_DAS2R
DJ00 = 2451545.0                        # ERFA_DJ00
DJC = 36525.0                           # ERFA_DJC
TT_MINUS_UTC_S = 37.0 + 32.184          # TAI-UTC (Bulletin C 72) + TT-TAI


def anp(a):                              # eraAnp
    w = math.fmod(a, D2PI)
    if w < 0:
        w += D2PI
    return w


def ir():                                # eraIr
    return [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]


def rz(psi, r):                          # eraRz (in place, as in ERFA)
    s, c = math.sin(psi), math.cos(psi)
    a0 = [c * r[0][j] + s * r[1][j] for j in range(3)]
    a1 = [-s * r[0][j] + c * r[1][j] for j in range(3)]
    r[0], r[1] = a0, a1


def rx(phi, r):                          # eraRx
    s, c = math.sin(phi), math.cos(phi)
    a1 = [c * r[1][j] + s * r[2][j] for j in range(3)]
    a2 = [-s * r[1][j] + c * r[2][j] for j in range(3)]
    r[1], r[2] = a1, a2


def obl06(date1, date2):                 # eraObl06: mean obliquity, IAU 2006
    t = ((date1 - DJ00) + date2) / DJC
    return (84381.406 + (-46.836769 + (-0.0001831 + (0.00200340 + (-0.000000576 + (-0.0000000434) * t) * t) * t) * t) * t) * DAS2R


def pfw06(date1, date2):                 # eraPfw06: bias-precession F-W angles, IAU 2006
    t = ((date1 - DJ00) + date2) / DJC
    gamb = (-0.052928 + (10.556378 + (0.4932044 + (-0.00031238 + (-0.000002788 + (0.0000000260) * t) * t) * t) * t) * t) * DAS2R
    phib = (84381.412819 + (-46.811016 + (0.0511268 + (0.00053289 + (-0.000000440 + (-0.0000000176) * t) * t) * t) * t) * t) * DAS2R
    psib = (-0.041775 + (5038.481484 + (1.5584175 + (-0.00018522 + (-0.000026452 + (-0.0000000148) * t) * t) * t) * t) * t) * DAS2R
    return gamb, phib, psib, obl06(date1, date2)


def fw2m(gamb, phib, psi, eps):          # eraFw2m
    r = ir()
    rz(gamb, r)
    rx(phib, r)
    rz(-psi, r)
    rx(-eps, r)
    return r


def pmat06(date1, date2):                # eraPmat06: bias-precession matrix, V(date) = rbp * V(GCRS)
    return fw2m(*pfw06(date1, date2))


def era00(dj1, dj2):                     # eraEra00: Earth rotation angle, IAU 2000 (UT1)
    d1, d2 = (dj1, dj2) if dj1 < dj2 else (dj2, dj1)
    t = d1 + (d2 - DJ00)
    f = math.fmod(d1, 1.0) + math.fmod(d2, 1.0)
    return anp(D2PI * (f + 0.7790572732640 + 0.00273781191135448 * t))


def gmst06(uta, utb, tta, ttb):          # eraGmst06: Greenwich mean sidereal time, IAU 2006
    t = ((tta - DJ00) + ttb) / DJC
    return anp(era00(uta, utb) + (0.014506 + (4612.156534 + (1.3915817 + (-0.00000044 + (-0.000029956 + (-0.0000000368) * t) * t) * t) * t) * t) * DAS2R)


# ---- ours (not ERFA): the scene's transform and the point beneath a body

def icrf_to_earth_fixed(v, jd_utc):
    """Rotate an Earth-centred ICRF vector to Earth-fixed axes at the UTC instant jd_utc (2-part: whole JD + 0)."""
    tt2 = TT_MINUS_UTC_S / 86400.0
    m = pmat06(jd_utc, tt2)
    p = [sum(m[i][k] * v[k] for k in range(3)) for i in range(3)]
    g = gmst06(jd_utc, 0.0, jd_utc, tt2)            # UT1 = UTC
    c, s = math.cos(g), math.sin(g)
    return [c * p[0] + s * p[1], -s * p[0] + c * p[1], p[2]]


def beneath(v):
    """Calculated point directly beneath a body: geocentric latitude/longitude (deg) of an Earth-fixed vector."""
    r = math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
    return math.degrees(math.asin(v[2] / r)), math.degrees(math.atan2(v[1], v[0]))
