"""Arts (the Met) — build the fixed catalogue snapshot (Arts release proposal rev 2.1, §4.1–§4.2).

Input : docs/research/p0-recovery/arts/final-view-objects.json   (accepted 7 Nov 2026; sha256 d682cb96…88bc5)
        docs/research/p0-recovery/arts/final-view-results.json   (the accepted counts)
Output: <out>/met-R1-e394878.json   (the complete file that would be uploaded to R2 ref/arts/)
        <out>/BUILD.json             (records_sha256, file_sha256, sizes, generated_at)

Usage : python3 -I phase1/arts/build_arts_snapshot.py <repo root> <out dir> --generated-at 2026-11-09T04:30:00Z
        The same --generated-at reproduces the file byte for byte. A new time gives a new file_sha256 (re-pin needed).

Every check below stops the build (non-zero exit) rather than writing a file that disagrees with the accepted evidence.
"""
import json, sys, hashlib, gzip, re, os, collections

ROOT, OUT = sys.argv[1], sys.argv[2]
GEN = sys.argv[sys.argv.index('--generated-at') + 1] if '--generated-at' in sys.argv else None
if not GEN or not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ', GEN):
    sys.exit('need --generated-at YYYY-MM-DDTHH:MM:SSZ (UTC)')

ART = os.path.join(ROOT, 'docs/research/p0-recovery/arts')
OBJ_PATH, RES_PATH = os.path.join(ART, 'final-view-objects.json'), os.path.join(ART, 'final-view-results.json')
OBJ_SHA = 'd682cb96e34071b6a668e26c9bd2af43ad65d06ce9b5d7e49f8255ac84588bc5'
RECORDS_SHA = '067211d996b6f9a35bf50354a179f77fed076a0c14b98e9dc9c175b22c616cb2'   # §4.2, reproduced by GPT
K = ['object_id', 'object_name', 'culture', 'department', 'met_wording', 'met_country', 'countries', 'tentative_labels', 'link']

def fail(msg): sys.exit('BUILD STOPPED: ' + msg)
def sha(b): return hashlib.sha256(b).hexdigest()

raw = open(OBJ_PATH, 'rb').read()
if sha(raw) != OBJ_SHA: fail('final-view-objects.json is not the accepted file')
objs, res = json.loads(raw), json.load(open(RES_PATH))

# ---- records: the exact §4.2 projection
records = [{k: o[k] for k in K} for o in objs]
rec_bytes = json.dumps(records, separators=(',', ':')).encode('utf-8')
if len(rec_bytes) != 122227 or sha(rec_bytes) != RECORDS_SHA: fail('records projection differs from §4.2')

# ---- checks against the accepted evidence (§7 Data)
CREATED_AT_CERTAIN = {'Made in', 'Minted in', 'Decorated in', 'Printed'}   # validate_v2.py TABLE: created_at + certain
by = collections.Counter()
for r in records:
    if not re.fullmatch(r'\d+', r['object_id']): fail('object_id ' + r['object_id'])
    if len(r['countries']) != 1 or not re.fullmatch(r'[A-Z]{3}', r['countries'][0]): fail('country ' + r['object_id'])
    segs = [s.strip() for s in r['met_wording'].split('|')]
    if not CREATED_AT_CERTAIN & set(segs): fail('placed without a certain created_at wording: ' + r['object_id'])
    if not r['link'].startswith('http://www.metmuseum.org/art/collection/search/' + r['object_id']): fail('link ' + r['object_id'])
    if list(r) != K: fail('unexpected fields ' + r['object_id'])   # no coordinate or media field can be present: the field list is fixed
    by[r['countries'][0]] += 1
if len(records) != res['objects'] or len(by) != res['countries']: fail('object/country counts')
if [list(x) for x in by.most_common()] != [list(x) for x in res['all_counts']] and dict(by) != dict(map(tuple, res['all_counts'])): fail('per-country counts')
labelled = [r for r in records if r['tentative_labels']]
if len(labelled) != res['objects_with_tentative_labels']: fail('tentative label count')
lab = collections.Counter(l for r in records for l in r['tentative_labels'])
if dict(lab) != res['tentative_label_counts']: fail('tentative label kinds')
dep = collections.Counter(r['department'] for r in records)
if dict(dep) != res['departments']: fail('departments')
if any(o['sensitivity_assessment'] != objs[0]['sensitivity_assessment'] for o in objs): fail('sensitivity wording not uniform')
UNLABELLED = 'no screen hit; this does NOT mean not sensitive'
if any(o['unlabelled_note'] != (None if o['tentative_labels'] else UNLABELLED) for o in objs): fail('unlabelled note: expected on every unlabelled object only')

# List headings: per ISO code, the Met's most frequent country text PAIRED WITH a certain created_at wording among that
# country's objects (ties: alphabetical). Only the placing segment counts — a record's other segments (e.g. 'Excavated in
# Iran' on an object made in China) never name its heading. Every object still shows its own full wording verbatim.
heading_votes = collections.defaultdict(collections.Counter)
for r in records:
    ws, cs = [x.strip() for x in r['met_wording'].split('|')], [x.strip() for x in r['met_country'].split('|')]
    if len(cs) == 1 and len(ws) > 1: cs = cs * len(ws)
    if len(ws) != len(cs): fail('cannot pair wording and country for ' + r['object_id'])
    for w, c in zip(ws, cs):
        if w in CREATED_AT_CERTAIN and c: heading_votes[r['countries'][0]][c] += 1
if set(heading_votes) != set(by): fail('a country has no created_at text for its heading')
heading_text = {iso3: sorted(v.items(), key=lambda x: (-x[1], x[0]))[0][0] for iso3, v in sorted(heading_votes.items())}

by_country = sorted(by.items(), key=lambda x: (-x[1], x[0]))
ENVELOPE = {
    'kind': 'catalogue_snapshot',
    'layer': 'arts',
    'snapshot_id': RECORDS_SHA,
    'title': 'Met catalogue sample — places of making',
    'evidence_label': 'Catalogued',
    'evidence_label_meaning': 'a record of what an institution states, dated — not an observation and not computed',
    'source': {
        'name': 'The Metropolitan Museum of Art Open Access',
        'file': 'MetObjects.csv',
        'repository': 'https://github.com/metmuseum/openaccess',
        'commit': 'e39487871a5512abaa4e21fd8cfdff7d7e3ee1ea',
        'lfs_sha256': '7adc37e41923f9f8179e8ed30d9312e6148da54c4468f373c162afc89d5cd0fe',
        'source_date': '2026-11-02',
        'licence': 'CC0 1.0 — collection data; commercial use yes; attribution not required (the Met asks users to consider citing)',
        'media': 'excluded — no image or other media is in this file or fetched by the page',
    },
    'credit': 'Collection data: The Metropolitan Museum of Art Open Access (CC0), source CSV of 2 Nov 2026 (commit e394878)',
    'view': {
        'prepared': '2026-11-07',
        'rules': 'v2 created_at (validate_v2.py); certain, aligned, ISO 3166-1 resolved; superseded wording and "Country of Origin" never place an object',
        'final_view_file': 'docs/research/p0-recovery/arts/final-view-objects.json',
        'final_view_sha256': OBJ_SHA,
        'description': res['view'],
        'clearance': 'Phase 0 research-gate clearance accepted 7 Nov 2026 (Chad, after GPT) — not release readiness, not independent verification of every object',
    },
    'published_file_generated_at': GEN,
    'sample': {
        'collection_records': 503073,
        'population': 59137,
        'population_definition': 'records with a Geography Type segment that maps to a relationship and a non-empty Country; five departments (Egyptian Art, Islamic Art, The American Wing, Medieval Art, The Cloisters)',
        'sample_size': 2000,
        'seed': 20261107,
        'method': 'random.seed(20261107); random.sample',
        'retained': len(records),
        'departments_retained': len(dep),
    },
    'counts': {
        'objects': len(records),
        'countries': len(by),
        'by_country': [[c, n] for c, n in by_country],
        'heading_text': heading_text,
        'heading_rule': "the Met's most frequent country text paired with a certain place-of-making wording among that country's objects; each object shows its own full wording",
        'departments': dict(sorted(dep.items(), key=lambda x: -x[1])),
        'top_share': res['top_share'],
        'countries_with_1_object': res['countries_with_1_object'],
        'countries_with_le_3_objects': res['countries_with_le_3_objects'],
        'objects_with_tentative_labels': len(labelled),
        'tentative_label_counts': dict(sorted(lab.items())),
    },
    'verification': {
        'random_page_check': {'drawn': 50, 'seed': 20261108, 'reached': 27, 'disagree': 0, 'error_rate_95_interval': [0.0, 0.125]},
        'not_reached': 23,
        'not_reached_meaning': 'unverified, not passes',
    },
    'sensitivity': {
        'every_object': objs[0]['sensitivity_assessment'],
        'unlabelled': UNLABELLED,
        'unlabelled_applies_to': 'objects with no tentative label',
        'tentative_labels': 'from keyword screens and three page findings; tentative; not comprehensive (the Yup\'ik ceremonial mask 717572 was found only by page check)',
        'handling': 'Included with honest context for this metadata-only scope (Chad, 7 Nov 2026); source restrictions preserved; inclusion is not a claim about ownership legitimacy',
    },
    'limitations': [
        '479 objects retained from a seeded 2,000-record sample of 59,137 Met records with typed geography. This filtered view draws from four departments; it does not represent the Met\'s whole collection or the world\'s art.',
        'Arts of Africa, Oceania and the Americas is an excluded department, not an absence of those regions.',
        'The Met\'s catalogued place of making, mapped to present-day countries — a location reference only, not historical nationality.',
        '"Country of Origin" is its own relationship and is kept outside this view; superseded wording ("Formerly considered made in") never places an object. The Met\'s wording is shown verbatim.',
        'Concentration: United States 239 of 479 (49.9%); 8 countries have one object; 12 have three or fewer.',
        'Random page check: 0 of 27 reached Met pages disagree (95% interval for the error rate 0–12.5%); 23 pages were not reached and are unverified, not passes.',
        'The Met\'s catalogue, not independent historical verification; the Met says cataloguing is ongoing.',
        'Sensitivity not fully assessed: no object was manually assessed; 11 carry tentative labels; an unlabelled object is not established as not sensitive.',
        'A fixed snapshot: the Met updates its CSV weekly; every figure here is tied to the source CSV of 2 Nov 2026 (commit e394878).',
    ],
    'record_fields': K,
}
head = json.dumps(ENVELOPE, separators=(',', ':')).encode('utf-8')
assert head.endswith(b'}')
file_bytes = head[:-1] + b',"records":' + rec_bytes + b'}'
check = json.loads(file_bytes)
if check['records'] != records or json.dumps(check['records'], separators=(',', ':')).encode() != rec_bytes: fail('records not embedded byte-identically')
if not file_bytes.endswith(b',"records":' + rec_bytes + b'}'): fail('records not last')

os.makedirs(OUT, exist_ok=True)
name = 'met-R1-e394878.json'
open(os.path.join(OUT, name), 'wb').write(file_bytes)
build = {
    'file': name,
    'r2_key': 'ref/arts/' + name,
    'published_file_generated_at': GEN,
    'file_bytes': len(file_bytes),
    'file_sha256': sha(file_bytes),
    'records_bytes': len(rec_bytes),
    'records_sha256': sha(rec_bytes),
    'file_gzip9_bytes_python': len(gzip.compress(file_bytes, compresslevel=9, mtime=0)),
    'gzip_tool': 'Python %d.%d.%d gzip.compress(compresslevel=9, mtime=0); not the served transfer size' % sys.version_info[:3],
    'input_final_view_sha256': OBJ_SHA,
}
open(os.path.join(OUT, 'BUILD.json'), 'w').write(json.dumps(build, indent=1) + '\n')
print(json.dumps(build, indent=1))
