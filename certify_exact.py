#!/usr/bin/env python3
"""Exact-arithmetic certificate for a cubes-in-cube claim file. Usage: python3 certify_exact.py file.json

Every float in the file is converted to an exact rational. Each quaternion q (not assumed unit) gives the exact
rotation R = H(q)/|q|^2, where H is the homogeneous quaternion matrix; this is exactly orthogonal for any q != 0.
Corners c + R g, g in {±1/2}^3, are then exact rationals. The script checks, with no rounding:
  (1) every corner lies in [0, s_full]^3;
  (2) every pair of cubes is strictly separated by an explicit rational plane u·p = t
      (a linear program proposes u; the check max_A u·p < min_B u·p is exact).
Exits 0 only if both hold. Requires scipy (only to propose planes)."""
import json, sys, itertools
from fractions import Fraction as Fr
from scipy.optimize import linprog
d = json.load(open(sys.argv[1])); s = Fr(d['s_full'])
def H(q):
    w, x, y, z = (Fr(v) for v in q); n = w*w + x*x + y*y + z*z
    M = [[w*w+x*x-y*y-z*z, 2*(x*y-w*z), 2*(x*z+w*y)], [2*(x*y+w*z), w*w-x*x+y*y-z*z, 2*(y*z-w*x)], [2*(x*z-w*y), 2*(y*z+w*x), w*w-x*x-y*y+z*z]]
    return [[e / n for e in row] for row in M]
V = []
for p in d['pieces']:
    c = [Fr(v) for v in p[:3]]; R = H(p[3:])
    V.append([[c[i] + sum(R[i][k] * g[k] for k in range(3)) for i in range(3)] for g in itertools.product((Fr(-1, 2), Fr(1, 2)), repeat=3)])
wall = min(min(v[i], s - v[i]) for Vi in V for v in Vi for i in range(3))
ok = wall > 0; worst = None
for i, j in itertools.combinations(range(len(V)), 2):
    fa = [[float(x) for x in v] for v in V[i]]; fb = [[float(x) for x in v] for v in V[j]]
    A = [[*a, -1, 1] for a in fa] + [[-b[0], -b[1], -b[2], 1, 1] for b in fb]
    res = linprog([0, 0, 0, 0, -1], A_ub=A, b_ub=[0] * 16, bounds=[(-1, 1)] * 3 + [(None, None), (None, 1)], method='highs')
    u = [Fr(x).limit_denominator(10**14) for x in res.x[:3]]
    gap = min(sum(u[k] * v[k] for k in range(3)) for v in V[j]) - max(sum(u[k] * v[k] for k in range(3)) for v in V[i])
    worst = gap if worst is None or gap < worst else worst
    if gap <= 0: ok = False; print(f'pair {i},{j}: no strictly separating plane found')
print(f"s_full = {d['s_full']!r}\nexact min wall gap = {float(wall):.12e}\nmin plane margin over {len(V)*(len(V)-1)//2} pairs (|u|_inf <= 1) = {float(worst):.12e}")
print('CERTIFIED' if ok else 'NOT CERTIFIED'); sys.exit(0 if ok else 1)
