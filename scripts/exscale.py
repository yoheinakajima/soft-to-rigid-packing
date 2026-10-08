# usage: python3 exscale.py <dir> <part> <nparts> <threshold>
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from exact import solve, certify
d, part, np_, th = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4])
CAT = json.load(open('catalog.json'))
rows = []
for f in sorted(os.listdir(d)):
    if f.endswith('.jsonl') and not f.startswith('ex_'):
        rows += [json.loads(l) for l in open(os.path.join(d, f)) if l.strip()]
done = set()
outp = os.path.join(d, f'ex_{part}.jsonl')
if os.path.exists(outp):
    done = {(r['n'], r.get('B'), r['seed']) for r in (json.loads(l) for l in open(outp) if l.strip())}
cands = sorted([r for r in rows if r['side'] - CAT[str(r['n'])] < th], key=lambda r: (r['n'], r.get('B', 0), r['seed']))
out = open(outp, 'a')
for idx, r in enumerate(cands):
    if idx % np_ != part or (r['n'], r.get('B'), r['seed']) in done: continue
    t0 = time.time()
    s0, _, X0, Y0, T0 = certify(r['X'], r['Y'], r['T'])
    L, X, Y, T, hist = solve(X0, Y0, T0, s0)
    side, k, X, Y, T = certify(X, Y, T)
    out.write(json.dumps(dict(n=r['n'], B=r.get('B'), seed=r['seed'], start=s0, side=side, gap=side - CAT[str(r['n'])],
                              secs=round(time.time() - t0, 1), X=X, Y=Y, T=T)) + '\n'); out.flush()
