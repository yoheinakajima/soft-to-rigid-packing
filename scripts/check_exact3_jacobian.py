"""Check the analytic constraint Jacobian of src/cubes/exact3.solve against central finite differences.

Usage: python scripts/check_exact3_jacobian.py claims/cubincub_n12/cubincub_n12.json
"""
import json, os, sys, time
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'cubes'))
from exact3 import solve, certify, quat_to_R

d = json.load(open(sys.argv[1])); Pc = np.array(d['pieces'])
C = Pc[:, :3]; R = [quat_to_R(q / np.linalg.norm(q)) for q in Pc[:, 3:]]
s0, _, C0 = certify(C, R)
cons, jac, z0, bounds = solve(C0, R, s0, return_funcs=True)
rng = np.random.default_rng(0)
worst = 0.0
for trial in range(3):
    z = z0.copy()
    if trial:  # random point near z0: non-zero rotations and plane tilts
        z = z0 + 0.01 * rng.standard_normal(len(z))
    t = time.time(); Ja = jac(z); ta = time.time() - t
    h = 1e-6; t = time.time()
    Jf = np.stack([(cons(z + h * e) - cons(z - h * e)) / (2 * h) for e in np.eye(len(z))], axis=1); tf = time.time() - t
    err = np.abs(Ja - Jf).max(); worst = max(worst, err)
    print(f'trial {trial}: shape {Ja.shape}, max|J_analytic - J_fd| = {err:.2e}, analytic {ta*1e3:.1f} ms, fd {tf*1e3:.1f} ms')
print('OK' if worst < 1e-6 else 'MISMATCH')
sys.exit(0 if worst < 1e-6 else 1)
