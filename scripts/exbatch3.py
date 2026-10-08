# usage: python3 exbatch3.py <part> <nparts> <threshold> [n-filter comma list]
# Exact-tightens every cube run within <threshold> of its catalogue side; saves full configs.
import json, os, sys, time, glob
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from exact3 import solve, certify, quat_to_R

CAT = {9: 2.70710678118654, 10: 2.70710678118654, 11: 2.88295, 12: 2.93277, 13: 2.956, 14: 2.98994949366117, 15: 3, 16: 3, 17: 3}
part, np_, th = int(sys.argv[1]), int(sys.argv[2]), float(sys.argv[3])
only = set(int(x) for x in sys.argv[4].split(',')) if len(sys.argv) > 4 else None
rows = [json.loads(l) for f in sorted(glob.glob('cube/[0-9]*_*.jsonl')) for l in open(f) if l.strip()]
cands = sorted([r for r in rows if r['side'] - CAT[r['n']] < th and (only is None or r['n'] in only)],
               key=lambda r: (r['side'] - CAT[r['n']]))
outp = f'cube/ex3_{part}.jsonl'
done = set()
for f in glob.glob('cube/ex3_*.jsonl'):
    for l in open(f):
        if l.strip():
            e = json.loads(l); done.add((e['n'], e['arm'], e.get('B', 3), e['seed']))
out = open(outp, 'a')
for idx, r in enumerate(cands):
    key = (r['n'], r['arm'], r.get('B', 3), r['seed'])
    if idx % np_ != part or key in done: continue
    t0 = time.time()
    C = np.array(r['C']); R = [quat_to_R(q) for q in r['Q']]
    s0, _, C0 = certify(C, R)
    L, C1, R1, hist = solve(C0, R, s0)
    side, k, C2 = certify(C1, R1)
    out.write(json.dumps(dict(n=r['n'], arm=r['arm'], B=r.get('B', 3), seed=r['seed'], start=s0, side=side,
                              gap=side - CAT[r['n']], secs=round(time.time() - t0, 1),
                              C=np.asarray(C2).tolist(), R=[np.asarray(x).tolist() for x in R1])) + '\n')
    out.flush()
