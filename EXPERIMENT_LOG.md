# Experiment log

Chronological record of every experiment, including the ones that failed. Dates are 2026, Pacific time. "Hit" means the certified side is within 1e-4 of the catalogue side unless noted.

## 7 Oct — Squares, n = 11 (proof of concept)

- Built the 2D blob→square simulator (rounded squares, SAT penetration, inward pressure, certified legalization).
- Short morph, no annealing: best 3.9007, median 4.007 (40 starts).
- Long morph (15k steps): 2/120 hits of Trump's 3.877084.
- Long morph + annealing: **6/160 hits** (side 3.8770845, tilt 40.18°).
- Rigid control, same schedule and noise: 0/120 (best 3.8877, median 4.000).
- Fixed-box squeeze-and-shake polish: changed sides by ≤ 0.009, never changed the arrangement.
- Angle lock-in on the hit run happens only once r < 0.057.

## 7 Oct — Squares, n = 2–30 sweep (standard budget, 48 blob + 24 rigid per n)

- Tilted-record cases matched: n = 5, 10, 11 (rigid: 5, 10). Nothing from n = 17 up.
- Grid cases split by slack: rigid wins with empty cells (6, 7, 12, 13, 20, 21); blob wins for full grids (9, 15, 16, 22–25, 30).
- 3× budget on tilted cases: n = 17 1/24 (Bidwell), n = 18 2/24 (Hämäläinen); 19, 26–29 none.
- Correction received: n = 11 has been proved optimal (Squares Project T-060), so it is a sanity check only.

## 7 Oct — Squares, n = 17 and 19, five setups (3× budget, fixed seeds)

| n | rigid | rigid+anneal | blob | blob+anneal | octagon+anneal |
|---|---|---|---|---|---|
| 17 hits | 0/40 | 0/40 | 3/480 | 7/480 | 0/160 |
| 19 hits | 0/40 | 0/40 | 1/480 | 1/480 | 0/160 |

- Octagon (oriented intermediate shape) ablation: 0/320 vs 4/320 on seeds 1–160, one-sided p ≈ 0.06. Not supported.
- Exact tightening (SLSQP, separating lines) built and validated: reproduces Trump and Bidwell to 1e-12.
- On 119 near-record runs: 12 converge exactly to Bidwell's 4.675530093605; 2 to Wainwright's 4.885618083164; next-best arrangements 4.6776 and 4.886746. No records.

## 7–8 Oct — Squares, n = 26–29 budget scaling (analytic gradients)

- Analytic gradients: identical hits on 480 n = 17 starts, ~4× faster.
- n = 26 exact hits: 2.5% (3×), 6.3% (5×), 10.4% (10×).
- n = 27: 1 exact hit at 3× (pulled from 0.022 away); none at 5× or 10×.
- n = 28 best 5.844498; n = 29 best 5.938996 (170 starts at 10×). No records.
- Overnight 10× batch at n = 37, 38, 40 lost when the cloud machine was reclaimed; stopped in favour of cubes.

## 8 Oct — Cubes

- Built 3D simulator: rounded cubes, quaternions, 15-axis SAT, exact vertex–face/edge–edge distance, analytic gradients (72,000 components checked).
- Built 3D exact tightening (SLSQP, separating planes); reproduces Friedman's s(9) = 2 + 1/√2 to 1e-12.
- Screen at 3× budget (ball→cube + annealing vs rigid control):
  - n = 9: 16/64 vs 5/32 match 2.707107.
  - n = 10: best 2.767767 (≈ 1 + 5√2/4); rigid 2.894428.
  - n = 11: best 2.894427 (= 2 + 2/√5) after tightening; rigid 2.918992.
  - **n = 12: seed 52 → 2.931821 raw → 2.931514578 tightened, below 2.93277.** Seed 83 → 2.931619541 (distinct arrangement, also below). Rigid best 2.992573.
- Certificate: exact rational arithmetic, all 66 pairs strictly separated, container side 2.9315165 after 1e-6 expansion.
- n = 12, seeds 129–192: no further run below the record (2 of 192 total).
- n = 13: 48 starts, best 2.997184 (record 2.956). n = 14: 42 starts, best 3.000000 = trivial (record 2.98995). Rigid controls for 13/14 not run: the cloud machine restarted twice and killed the batches; stopped there.
- Claim file built with 1e-6 clearance (s = 2.9315185094797); verify.py and certify_exact.py pass; repo and site published.
