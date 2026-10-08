"""Exact-contact tightening for unit-square packings.

Minimize the container side L subject to hard constraints:
  - every vertex of every square lies in [0, L] x [0, L]
  - for every nearby pair (i, j) there is a separating line u(phi)·p = c with
    all vertices of i on one side and all vertices of j on the other.
Solved with SLSQP (analytic Jacobians) in outer iterations with a trust region;
the nearby-pair list is rebuilt each outer iteration. The result is then certified
independently: SAT overlap test on every pair, centres scaled apart if needed
(bisection, tolerance 1e-12), tight bounding square measured.
"""
import json, math, sys, time
import numpy as np
from scipy.optimize import minimize

CORN = np.array([[0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]])


def verts(x, y, t):
    c, s = math.cos(t), math.sin(t)
    return [(x + a * c - b * s, y + a * s + b * c) for a, b in CORN]


def sat_depth(vi, vj, ti, tj):
    """>0 penetration depth, <=0 separation lower bound (SAT on 4 axes)."""
    best = math.inf
    for ang in (ti, ti + math.pi / 2, tj, tj + math.pi / 2):
        ux, uy = math.cos(ang), math.sin(ang)
        pi = [ux * p[0] + uy * p[1] for p in vi]
        pj = [ux * p[0] + uy * p[1] for p in vj]
        o = min(max(pi) - min(pj), max(pj) - min(pi))
        best = min(best, o)
    return best


def init_sep(vi, vj, ti, tj):
    """Separating direction phi (normal pointing from i to j) and offset c."""
    best = None
    for ang in (ti, ti + math.pi / 2, tj, tj + math.pi / 2):
        for sgn in (1, -1):
            a = ang if sgn == 1 else ang + math.pi
            ux, uy = math.cos(a), math.sin(a)
            mi = max(ux * p[0] + uy * p[1] for p in vi)
            mj = min(ux * p[0] + uy * p[1] for p in vj)
            g = mj - mi
            if best is None or g > best[0]:
                best = (g, a, (mi + mj) / 2)
    return best[1], best[2]


def certify(X, Y, T):
    n = len(X)
    cx, cy = sum(X) / n, sum(Y) / n

    def ok(k):
        V = [verts(cx + k * (X[i] - cx), cy + k * (Y[i] - cy), T[i]) for i in range(n)]
        for i in range(n):
            for j in range(i + 1, n):
                if (X[i] - X[j]) ** 2 + (Y[i] - Y[j]) ** 2 > 2.0001 / (k * k):
                    continue
                if sat_depth(V[i], V[j], T[i], T[j]) > 1e-12:
                    return False
        return True

    lo = hi = 1.0
    if not ok(1.0):
        hi = 1.0001
        while not ok(hi):
            hi = 1 + (hi - 1) * 2
        for _ in range(70):
            m = (lo + hi) / 2
            if ok(m):
                hi = m
            else:
                lo = m
    k = hi
    xs = [cx + k * (X[i] - cx) for i in range(n)]
    ys = [cy + k * (Y[i] - cy) for i in range(n)]
    allv = [v for i in range(n) for v in verts(xs[i], ys[i], T[i])]
    x0, x1 = min(v[0] for v in allv), max(v[0] for v in allv)
    y0, y1 = min(v[1] for v in allv), max(v[1] for v in allv)
    side = max(x1 - x0, y1 - y0)
    ox, oy = x0 - (side - (x1 - x0)) / 2, y0 - (side - (y1 - y0)) / 2
    return side, k, [v - ox for v in xs], [v - oy for v in ys], list(T)


def solve(X, Y, T, L, outer=40, trust=0.03, verbose=False):
    n = len(X)
    X, Y, T = np.array(X, float), np.array(Y, float), np.array(T, float)
    hist = []
    for it in range(outer):
        # pair list
        pairs = [(i, j) for i in range(n) for j in range(i + 1, n)
                 if (X[i] - X[j]) ** 2 + (Y[i] - Y[j]) ** 2 < (1.414214 + 3 * trust + 0.05) ** 2]
        P = len(pairs)
        V = [verts(X[i], Y[i], T[i]) for i in range(n)]
        phi0, c0 = [], []
        for i, j in pairs:
            a, c = init_sep(V[i], V[j], T[i], T[j])
            phi0.append(a); c0.append(c)
        z0 = np.concatenate([X, Y, T, [L], phi0, c0])
        nv = 3 * n + 1 + 2 * P
        iL = 3 * n

        def unpack(z):
            return z[:n], z[n:2 * n], z[2 * n:3 * n], z[iL], z[iL + 1:iL + 1 + P], z[iL + 1 + P:]

        A = CORN[:, 0][None, :]; B = CORN[:, 1][None, :]

        def vert_arrays(x, y, t):
            ct, st = np.cos(t)[:, None], np.sin(t)[:, None]
            vx = x[:, None] + A * ct - B * st
            vy = y[:, None] + A * st + B * ct
            dvx_dt = -A * st - B * ct
            dvy_dt = A * ct - B * st
            return vx, vy, dvx_dt, dvy_dt

        pi_idx = np.array([p[0] for p in pairs], int); pj_idx = np.array([p[1] for p in pairs], int)

        def cons(z):
            x, y, t, Lz, ph, c = unpack(z)
            vx, vy, _, _ = vert_arrays(x, y, t)
            g = [vx.ravel(), (Lz - vx).ravel(), vy.ravel(), (Lz - vy).ravel()]
            if P:
                ux, uy = np.cos(ph)[:, None], np.sin(ph)[:, None]
                si = ux * vx[pi_idx] + uy * vy[pi_idx]
                sj = ux * vx[pj_idx] + uy * vy[pj_idx]
                g.append((c[:, None] - si).ravel()); g.append((sj - c[:, None]).ravel())
            return np.concatenate(g)

        def jac(z):
            x, y, t, Lz, ph, c = unpack(z)
            vx, vy, dxt, dyt = vert_arrays(x, y, t)
            rows = []
            # containment
            for kind in range(4):
                J = np.zeros((4 * n, nv))
                for i in range(n):
                    for k in range(4):
                        r = 4 * i + k
                        if kind in (0, 1):
                            sgn = 1 if kind == 0 else -1
                            J[r, i] = sgn; J[r, 2 * n + i] = sgn * dxt[i, k]
                            if kind == 1: J[r, iL] = 1
                        else:
                            sgn = 1 if kind == 2 else -1
                            J[r, n + i] = sgn; J[r, 2 * n + i] = sgn * dyt[i, k]
                            if kind == 3: J[r, iL] = 1
                rows.append(J)
            if P:
                Ji = np.zeros((4 * P, nv)); Jj = np.zeros((4 * P, nv))
                for p, (i, j) in enumerate(pairs):
                    ux, uy = math.cos(ph[p]), math.sin(ph[p])
                    for k in range(4):
                        r = 4 * p + k
                        # c - u·v_i
                        Ji[r, i] = -ux; Ji[r, n + i] = -uy; Ji[r, 2 * n + i] = -(ux * dxt[i, k] + uy * dyt[i, k])
                        Ji[r, iL + 1 + p] = -(-uy * vx[i, k] + ux * vy[i, k]); Ji[r, iL + 1 + P + p] = 1
                        # u·v_j - c
                        Jj[r, j] = ux; Jj[r, n + j] = uy; Jj[r, 2 * n + j] = ux * dxt[j, k] + uy * dyt[j, k]
                        Jj[r, iL + 1 + p] = -uy * vx[j, k] + ux * vy[j, k]; Jj[r, iL + 1 + P + p] = -1
                rows += [Ji, Jj]
            return np.vstack(rows)

        f = lambda z: z[iL]
        gf = lambda z: np.eye(nv)[iL]
        bounds = ([(v - trust, v + trust) for v in X] + [(v - trust, v + trust) for v in Y] +
                  [(v - 3 * trust, v + 3 * trust) for v in T] + [(L - 0.2, L + 0.01)] +
                  [(None, None)] * (2 * P))
        res = minimize(f, z0, jac=gf, method='SLSQP', bounds=bounds,
                       constraints=[{'type': 'ineq', 'fun': cons, 'jac': jac}],
                       options={'maxiter': 400, 'ftol': 1e-15})
        x, y, t, Lz, _, _ = unpack(res.x)
        viol = -min(0.0, cons(res.x).min())
        # accept only if the certified side improves
        side, k, cx, cy, ct = certify(list(x), list(y), list(t))
        hist.append((it, float(Lz), side, viol, P, res.status))
        if verbose:
            print(f"  it {it} L {Lz:.12f} certified {side:.12f} viol {viol:.1e} pairs {P} status {res.status}", flush=True)
        if side < L - 1e-13:
            improve = L - side
            X, Y, T, L = np.array(cx), np.array(cy), np.array(ct), side
            if improve < 1e-12:
                break
        else:
            trust *= 0.5
            if trust < 1e-4:
                break
    return float(L), list(map(float, X)), list(map(float, Y)), list(map(float, T)), hist


if __name__ == '__main__':
    src = sys.argv[1]
    conf = json.load(open(src))
    t0 = time.time()
    side0, *_ = certify(conf['X'], conf['Y'], conf['T'])
    L, X, Y, T, hist = solve(conf['X'], conf['Y'], conf['T'], side0, verbose=True)
    print(f"start {side0:.12f} -> {L:.12f}  ({time.time() - t0:.1f}s)")
