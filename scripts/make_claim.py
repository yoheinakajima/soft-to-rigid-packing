"""Turn a tightened packing (centres C, rotation matrices R) into a claim file with explicit clearance.
Centres are spread about their mean until the minimum pair gap is at least GAP, then the box is fitted
with a wall gap of WALL on every side and s is rounded UP at the 13th decimal."""
import json, math, sys, itertools, subprocess
import numpy as np
src, out, GAP, WALL = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
d = json.load(open(src)); C = np.array(d['C']); R = [np.array(r) for r in d['R']]
def quat(m):
    t = np.trace(m)
    if t > 0: s = math.sqrt(t + 1) * 2; q = [.25 * s, (m[2,1]-m[1,2])/s, (m[0,2]-m[2,0])/s, (m[1,0]-m[0,1])/s]
    elif m[0,0] > m[1,1] and m[0,0] > m[2,2]: s = math.sqrt(1+m[0,0]-m[1,1]-m[2,2])*2; q = [(m[2,1]-m[1,2])/s, .25*s, (m[0,1]+m[1,0])/s, (m[0,2]+m[2,0])/s]
    elif m[1,1] > m[2,2]: s = math.sqrt(1+m[1,1]-m[0,0]-m[2,2])*2; q = [(m[0,2]-m[2,0])/s, (m[0,1]+m[1,0])/s, .25*s, (m[1,2]+m[2,1])/s]
    else: s = math.sqrt(1+m[2,2]-m[0,0]-m[1,1])*2; q = [(m[1,0]-m[0,1])/s, (m[0,2]+m[2,0])/s, (m[1,2]+m[2,1])/s, .25*s]
    q = np.array(q); q /= np.linalg.norm(q); return q if q[0] >= 0 else -q
Q = [quat(r) for r in R]; Rq = []
for q in Q:  # rebuild R from the stored (normalized) quaternion so the file is self-consistent
    w, x, y, z = q
    Rq.append(np.array([[1-2*(y*y+z*z), 2*(x*y-w*z), 2*(x*z+w*y)], [2*(x*y+w*z), 1-2*(x*x+z*z), 2*(y*z-w*x)], [2*(x*z-w*y), 2*(y*z+w*x), 1-2*(x*x+y*y)]]))
G = np.array(list(itertools.product((-.5, .5), repeat=3)))
def min_pair_gap(Cc):
    best = np.inf
    for i, j in itertools.combinations(range(len(Cc)), 2):
        A, B = Rq[i].T, Rq[j].T; VA = Cc[i] + G @ Rq[i].T; VB = Cc[j] + G @ Rq[j].T
        ax = list(A) + list(B) + [np.cross(a, b) for a in A for b in B if np.linalg.norm(np.cross(a, b)) > 1e-9]
        g = max(max((VB @ u).min() - (VA @ u).max(), (VA @ u).min() - (VB @ u).max()) for u in (v / np.linalg.norm(v) for v in ax))
        best = min(best, g)
    return best
cen = C.mean(0); lo, hi = 1.0, 1.0
while min_pair_gap(cen + hi * (C - cen)) < GAP: hi = 1 + (hi - 1) * 2 if hi > 1 else 1 + 1e-8
for _ in range(60):
    m = (lo + hi) / 2
    if min_pair_gap(cen + m * (C - cen)) >= GAP: hi = m
    else: lo = m
C2 = cen + hi * (C - cen)
V = np.concatenate([C2[i] + G @ Rq[i].T for i in range(len(C2))])
C2 = C2 - V.min(0) + WALL
V = np.concatenate([C2[i] + G @ Rq[i].T for i in range(len(C2))])
s = math.ceil((V.max() + WALL) * 1e13) / 1e13
rec = 2.9327717687048653
claim = {
  "problem": "min/cubes_in_cube", "page": "https://erich-friedman.github.io/packing/cubincub/", "n": len(C2), "dimension": 3,
  "s": math.floor(s * 1e5) / 1e5, "s_plus": f"{math.floor(s * 1e5) / 1e5:.5f}+", "s_full": s,
  "previous_record": rec, "previous_record_by": "Haowei Lin, July 2026 (Tencent-Hunyuan/Hyra-results, cubincub_n12.json)",
  "improvement": round(rec - s, 10),
  "found_by": "Yohei Nakajima", "date": "2026-10-08",
  "method": "soft-to-rigid homotopy (balls hardened into cubes under inward pressure), then SLSQP tightening with per-pair separating planes",
  "clearance": {"min_pair_gap_target": GAP, "wall_gap_target": WALL},
  "coords_note": "full-precision coordinates; s_full rounded up at the 13th decimal; reported value truncated to 5dp (x.xxxxx+)",
  "format": "[x, y, z, qw, qx, qy, qz] per piece: unit cube (edge 1) centred at (x, y, z), rotated by the scalar-first unit quaternion q; container [0, s_full]^3",
  "pieces": [[*map(float, C2[i]), *map(float, Q[i])] for i in range(len(C2))]}
json.dump(claim, open(out, 'w'), indent=2)
print('s_full', repr(s), 'improvement', rec - s, 'expansion factor', hi)
