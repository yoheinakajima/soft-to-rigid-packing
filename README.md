# soft-to-rigid-packing

Packing unit squares in a square and unit cubes in a cube by **starting with balls and hardening them into cubes** while inward pressure shrinks the container.

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23248094.svg)](https://doi.org/10.5281/zenodo.23248094)

## Headline result

**12 unit cubes fit in a cube of side 2.9315185094797** (Friedman display 2.93151+), with every pair of cubes and every wall at least 10⁻⁶ apart. The previous record is 2.9327717687048653 (Haowei Lin, July 2026; [Hyra-results `cubincub_n12.json`](https://github.com/Tencent-Hunyuan/Hyra-results/blob/main/AI4Science/packing_records/records/cubincub_n12.json)). Improvement: 0.0012533.

The claim lives in [`claims/cubincub_n12/`](claims/cubincub_n12/): the coordinate file (same schema as the record file: one `[x, y, z, qw, qx, qy, qz]` pose per cube), the picture, a note, and the outputs of both checkers.

```bash
python3 verify.py claims/cubincub_n12/cubincub_n12.json         # 30 lines, standard library; exits 1 on failure
# n = 12  s = 2.9315185094796998
# min wall gap = 1.000000000029e-06
# min pair gap = 1.000000000584e-06
# VALID
python3 certify_exact.py claims/cubincub_n12/cubincub_n12.json  # exact rational arithmetic
./scripts/reproduce_n12.sh                                       # rerun the search from seed 52 (~5 min)
```

## Website and paper

`docs/` is a static site built from this repository by `python3 site/build.py`: overview, replays of the n = 11 square and n = 12 cube runs, an in-browser verifier, and the paper as HTML (with a live 3D figure) and PDF. The GitHub Action in `.github/workflows/site.yml` re-verifies the claim, rebuilds the paper and deploys the site on every push, so the published paper is always the latest commit.

## Method in one paragraph

Each object is a *rounded cube*: a cube of half-side ½ − r dilated by radius r. At r = ½ it is a unit ball; at r = 0 a unit cube; every intermediate shape fits inside the final cube. Balls are compressed under inward pressure on the box, then r is lowered linearly to 0 while pressure continues, then rigid cubes settle. Gradients are analytic (separating-axis penetration when overlapping, exact feature distance when apart). Each run is legalized (centres scaled apart until no pair overlaps), and near-record runs are tightened by SLSQP with hard constraints: every corner inside the box and a separating plane for every nearby pair.

## Layout

```
src/squares/   sim.js (2D simulator), exact.py (2D exact tightening)
src/cubes/     sim3.js (3D simulator), exact3.py (3D exact tightening), certify_exact.py (certificate for raw C,R files)
claims/        one folder per record claim: coordinate JSON, picture, note, checker outputs, submission email
verify.py, certify_exact.py   checkers for claim files
site/, docs/   site templates and build script; built site
scripts/       batch runners, figure script, reproduce_n12.sh
results/       summaries of every batch reported in the paper; record coordinates and certificate
paper/         LaTeX draft (main.tex, refs.bib, figures/)
EXPERIMENT_LOG.md   chronological record of every experiment, including dead ends
```

## Requirements

Node ≥ 18 (simulators), Python ≥ 3.10 with NumPy and SciPy (exact tightening and certificates), matplotlib (figures), a LaTeX distribution (paper).

## Status and caveats

- Search results, not optimality proofs.
- Cube catalogue values are read from images on Friedman's page; "2.93277+" is truncated, which does not affect the margin.
- Squares results (validation of the method) rediscover published records; none improves a square record.

## Credit

Yohei Nakajima. Code, experiments and verification were developed with Claude (Anthropic) under the author's direction.

Cite as: Y. Nakajima, *Twelve unit cubes in a cube of side 2.9315: soft-to-rigid packing*, v1.0.0, Zenodo, 2026. doi:[10.5281/zenodo.23248095](https://doi.org/10.5281/zenodo.23248095) (all versions: doi:[10.5281/zenodo.23248094](https://doi.org/10.5281/zenodo.23248094)).

## License

MIT (see `LICENSE`).
