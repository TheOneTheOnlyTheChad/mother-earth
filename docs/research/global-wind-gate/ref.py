import sys, hashlib, json, numpy as np, eccodes as ec
path, outdir = sys.argv[1], sys.argv[2]
raw = open(path,'rb').read()
# split messages by section 0 total length
off=0; msgs=[]
while off < len(raw):
    assert raw[off:off+4]==b'GRIB', off
    n=int.from_bytes(raw[off+8:off+16],'big'); msgs.append(raw[off:off+n]); off+=n
print('messages', len(msgs), 'bytes', len(raw))
keys=['shortName','typeOfLevel','level','dataDate','dataTime','stepRange','typeOfGeneratingProcess','Ni','Nj','gridType',
 'latitudeOfFirstGridPointInDegrees','longitudeOfFirstGridPointInDegrees','latitudeOfLastGridPointInDegrees','longitudeOfLastGridPointInDegrees',
 'iDirectionIncrementInDegrees','jDirectionIncrementInDegrees','scanningMode','iScansNegatively','jScansPositively','jPointsAreConsecutive','alternativeRowScanning',
 'resolutionAndComponentFlags','uvRelativeToGrid','dataRepresentationTemplateNumber','packingType','bitsPerValue','binaryScaleFactor','decimalScaleFactor','referenceValue',
 'bitMapIndicator','bitmapPresent','numberOfMissing','missingValueManagementUsed','orderOfSpatialDifferencing','numberOfGroupsOfDataValues','units','numberOfValues','shapeOfTheEarth','productDefinitionTemplateNumber','discipline','parameterCategory','parameterNumber','typeOfFirstFixedSurface','scaledValueOfFirstFixedSurface','scaleFactorOfFirstFixedSurface']
meta=[]
for i,m in enumerate(msgs):
    h=ec.codes_new_from_message(m)
    d={'i':i,'bytes':len(m),'sha256':hashlib.sha256(m).hexdigest()}
    for k in keys:
        try: d[k]=ec.codes_get(h,k)
        except Exception as e: d[k]='ERR '+type(e).__name__
    v=ec.codes_get_values(h).astype(np.float64)
    d['min']=float(v.min()); d['max']=float(v.max()); d['mean']=float(v.mean())
    v.astype('<f8').tofile(f'{outdir}/ref{i}.f64')
    open(f'{outdir}/msg{i}.grib2','wb').write(m)
    ec.codes_release(h); meta.append(d)
json.dump(meta,open(f'{outdir}/ref-meta.json','w'),indent=1)
for d in meta: print(json.dumps(d))
print('eccodes', ec.codes_get_api_version())
