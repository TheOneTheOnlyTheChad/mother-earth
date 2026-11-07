"""Country-name rules and ISO 3166 lookup, extracted verbatim from arts_recovery.py (R1) so later steps reuse them unchanged."""
import re
import pycountry

# Documented name rules (applied in this order). Anything not matched stays UNRESOLVED; nothing is guessed.
ALIAS = {'Turkey': 'TUR'}   # ISO 3166-1 renamed TUR "Türkiye" (2022); same alpha-3.
HEDGE_NAME = re.compile(r'^(probably|possibly|perhaps|likely)\s+|\s+(probably|possibly)$', re.I)
def iso(name):
    n = name.strip().rstrip('?').strip()
    if not n:
        return None, 'empty', False
    hedged = bool(HEDGE_NAME.search(n))
    n = HEDGE_NAME.sub('', n).strip()
    if re.search(r'\bor\b|\band\b|/', n):
        return None, 'unresolved-multiple', hedged
    how = 'iso3166-1'
    if n.lower().startswith('present-day '):
        n, how = n[12:].strip(), 'iso3166-1 (Met "present-day")'
    if n in ALIAS:
        return ALIAS[n], 'alias (ISO rename)', hedged
    try:
        return pycountry.countries.lookup(n).alpha_3, how, hedged
    except LookupError:
        pass
    try:
        sd = [x for x in pycountry.subdivisions if x.name == n and x.type in ('Country', 'Nation', 'Province')]
        if len(sd) == 1:
            return pycountry.countries.get(alpha_2=sd[0].country_code).alpha_3, 'iso3166-2 subdivision', hedged
    except Exception:
        pass
    try:
        h = pycountry.historic_countries.lookup(n)
        return 'H:' + h.alpha_4, 'iso3166-3 (historic)', hedged
    except LookupError:
        return None, 'unresolved-name', hedged

