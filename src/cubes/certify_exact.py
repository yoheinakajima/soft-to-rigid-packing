# Rigorous certificate in exact rational arithmetic for a cube packing.
# Centres are expanded by (1+eps) about their mean so touching pairs get a small positive gap; half-sides are
# inflated by 1e-12 to cover float non-orthonormality of the axes. Every corner is computed exactly from the
# rational centre and axes; containment and pairwise strict separation by an explicit rational plane are checked
# with Fractions only (the LP just proposes each plane).
import json, sys, numpy as np
from fractions import Fraction as Fr
from scipy.optimize import linprog
d = json.load(open(sys.argv[1])); eps = float(sys.argv[2]) if len(sys.argv) > 2 else 1e-6
C = np.array(d['C']); R = [np.array(r) for r in d['R']]; n = d['n']
cen = C.mean(0); C2 = cen + (1 + eps) * (C - cen)
h = Fr(1, 2) * (1 + Fr(1, 10**12))
G = [(a, b, c) for a in (1, -1) for b in (1, -1) for c in (1, -1)]
CF = [[Fr(x) for x in c] for c in C2]; RF = [[[Fr(x) for x in row] for row in r] for r in R]
V = [[[CF[i][k] + h * (g[0] * RF[i][k][0] + g[1] * RF[i][k][1] + g[2] * RF[i][k][2]) for k in range(3)] for g in G] for i in range(n)]
lo = [min(v[k] for Vi in V for v in Vi) for k in range(3)]
V = [[[v[k] - lo[k] for k in range(3)] for v in Vi] for Vi in V]
S = max(max(v[k] for v in Vi for k in range(3)) for Vi in V)
ok = True; worst = None
for i in range(n):
    for j in range(i + 1, n):
        Vi = np.array([[float(x) for x in v] for v in V[i]]); Vj = np.array([[float(x) for x in v] for v in V[j]])
        A = [[*a, -1, 1] for a in Vi] + [[*(-b), 1, 1] for b in Vj]
        res = linprog([0, 0, 0, 0, -1], A_ub=A, b_ub=[0] * 16, bounds=[(-1, 1)] * 3 + [(None, None), (None, 1)], method='highs')
        u = [Fr(x).limit_denominator(10**12) for x in res.x[:3]]
        si = max(sum(u[k] * v[k] for k in range(3)) for v in V[i]); sj = min(sum(u[k] * v[k] for k in range(3)) for v in V[j])
        gap = sj - si
        if worst is None or gap < worst: worst = gap
        if not gap > 0: ok = False; print('pair', i, j, 'not strictly separated', float(gap))
print('exact container side S =', float(S), '(all corners in [0,S]^3 by construction)')
print('all', n * (n - 1) // 2, 'pairs strictly separated by explicit rational planes:', ok, '| smallest gap', float(worst))
