**12 unit cubes in a cube of side 2.9315185094797** (displayed 2.93151+), below the previous best known 2.9327717687048653 (H. Lin, July 2026). Every pair of cubes and every wall is at least 1e-6 apart.

- Claim file: `claims/cubincub_n12/cubincub_n12.json` (one `[x, y, z, qw, qx, qy, qz]` pose per cube)
- Check: `python3 verify.py claims/cubincub_n12/cubincub_n12.json` → VALID; `python3 certify_exact.py …` → CERTIFIED (exact rational arithmetic)
- Reproduce: `./scripts/reproduce_n12.sh`
- Paper: `paper/main.pdf` · site: https://yoheinakajima.github.io/soft-to-rigid-packing/

Code, experiments and verification were developed with Claude (Anthropic).
