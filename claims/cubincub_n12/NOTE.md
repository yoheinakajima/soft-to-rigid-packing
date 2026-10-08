# Cubes in cubes, n = 12

| | |
|---|---|
| n | 12 unit cubes (edge 1) |
| Side | **s = 2.9315185094797** (Friedman display: 2.93151+) |
| Beats | 2.9327717687048653, Haowei Lin, July 2026 ([Hyra-results `cubincub_n12.json`](https://github.com/Tencent-Hunyuan/Hyra-results/blob/main/AI4Science/packing_records/records/cubincub_n12.json)) |
| Improvement | 0.0012532592 |
| Date | 8 October 2026 |
| Found by | Yohei Nakajima |
| Clearance | min wall gap 1.000000000e-06, min pair gap 1.000000001e-06 |

**File format.** `cubincub_n12.json` lists one pose per cube, `[x, y, z, qw, qx, qy, qz]`: a unit cube centred at (x, y, z), rotated by the scalar-first unit quaternion q, inside the container [0, s_full]³. Same schema as the Hyra record file.

**Check it.**

```bash
python3 verify.py claims/cubincub_n12/cubincub_n12.json         # 30 lines, standard library only
python3 certify_exact.py claims/cubincub_n12/cubincub_n12.json  # exact rational arithmetic (needs scipy)
```

`verify.py` rotates the eight corners (±½, ±½, ±½) of each cube by its quaternion, translates by the centre, checks all corners lie in [0, s]³, and runs the 15-axis separating-axis test on every pair. It exits nonzero on any overlap or out-of-box corner. Output: [`verify_output.txt`](verify_output.txt).

`certify_exact.py` repeats both checks in exact rational arithmetic, using the exactly orthogonal rotation H(q)/|q|² so no quaternion normalization is assumed, and exhibits a strictly separating plane for each of the 66 pairs. Output: [`certify_output.txt`](certify_output.txt).

**How the side was set.** The packing found by search touches at several contacts (side 2.931514577965). Centres were spread apart by a factor of 1 + 1.0·10⁻⁶ about their mean until every pair is separated by at least 10⁻⁶, a 10⁻⁶ wall gap was added, and s was rounded up at the 13th decimal.

**Picture.** `cubincub_n12.gif`, 216 × 227, same size and type as the current n = 12 picture.
