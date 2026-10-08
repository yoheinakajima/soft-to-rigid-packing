#!/usr/bin/env bash
# Reproduce the n = 12 cube packing from scratch: one ball->cube run (seed 52), exact tightening, exact certificate.
set -euo pipefail
cd "$(dirname "$0")/.."
node -e '
const P=require("./src/cubes/sim3.js");const fs=require("fs");
const r=P.run({n:12,seed:52,mode:"improved",anneal:true,compact:5000,morph:45000,settle:3000,recEvery:1e9});
console.log("raw certified side",r.side);
fs.writeFileSync("/tmp/n12_raw.json",JSON.stringify({C:r.final.C,Q:r.final.Q}));'
python3 - <<'PY'
import json, numpy as np, sys
sys.path.insert(0,'src/cubes')
from exact3 import solve, certify, quat_to_R
d=json.load(open('/tmp/n12_raw.json')); C=np.array(d['C']); R=[quat_to_R(q) for q in d['Q']]
s0,_,C0=certify(C,R); L,C1,R1,_=solve(C0,R,s0); side,_,C2=certify(C1,R1)
print('exact-tightened side',repr(side))
json.dump({'n':12,'side':side,'C':np.asarray(C2).tolist(),'R':[np.asarray(x).tolist() for x in R1]},open('/tmp/n12_tight.json','w'))
PY
python3 src/cubes/certify_exact.py /tmp/n12_tight.json 1e-6
