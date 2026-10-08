# Explore Science review (8 Oct 2026): what changed

| # | Point | Action |
|---|---|---|
| B1 | Berthold et al. (March 2026, n = 11) has no reference | Cited Friedman's catalogue as the source; noted it gives no coordinate file |
| C1 | Rigid control uses a schedule tuned for soft shapes | Stated in Method: the control is a within-schedule ablation, not a tuned rigid optimizer |
| C2 | Unequal restart budgets (192 vs 32; 960 vs 80) | Added the equal-budget comparison at n = 12 (seeds 1–32: 13/32 ball vs 1/32 rigid below side 3, one-sided Fisher p < 0.001) and n = 17 (1/40 vs 0/40); disclosed that ball starts were extended to 192 after seed 52; abstract now says "at equal budgets" |
| C3 | Energy is not C¹ at core contact | Said so in Method; "search heuristic rather than a smooth homotopy"; gradient check described as sampled away from contact |
| C4 | Plane scale in SLSQP | Stated \|u\| = 1 with tangent-plane parameterization (matches `exact3.py`) |
| C5 | Noise is near zero when orientations lock in | Added as limitation (v) |
| C6 | No external benchmark | Added as limitation (iv) |
| D1 | n = 25 comparison is marginal | Added one-sided Fisher p ≈ 0.05 (recomputed: 0.0500), "suggestive only" |
| D2 | Octagon ablation overclaimed | Abstract: "showed no benefit"; Section 5: "no evidence it helps", octagons also change boundary geometry |
| E1 | n = 26 percentages without counts | Replaced with 4/160, 10/160, 10/96 |

Not done: equal-budget reruns of the rigid control at 192 and 960 starts, a rigid-specific schedule, and an external benchmark. Each is new compute and would lengthen the paper; the equal-budget subset answers C2 for the headline result.

Reviewer error, not acted on: #C1 says the rigid best 2.99257 is "worse than the trivial 3.0 grid". It is below 3.0.

Also fixed: a duplicated sentence ("We have not derived it.") in Section 3. Page count unchanged (6).
