To: erichfriedman68@gmail.com
Subject: Cubes in cubes, n=12, s=2.93151+

Hi Erich,

Twelve unit cubes fit in a cube of side 2.9315185094797 (2.93151+), improving the current n = 12 entry, 2.9327717687048653 (Haowei Lin, July 2026), by 0.00125. Every pair of cubes is separated by at least 1.0e-6 and every corner is at least 1.0e-6 inside the container.

Attached: cubincub_n12.gif (216 × 227, matching the current picture) and cubincub_n12.json (one [x, y, z, qw, qx, qy, qz] pose per cube, same format as the current record file).

Repository, pinned commit: https://github.com/yoheinakajima/soft-to-rigid-packing/tree/b78a44b18c2f2d0cd7da6bba1c088eabe7ffa95c/claims/cubincub_n12
Raw JSON: https://raw.githubusercontent.com/yoheinakajima/soft-to-rigid-packing/b78a44b18c2f2d0cd7da6bba1c088eabe7ffa95c/claims/cubincub_n12/cubincub_n12.json
A 30-line checker (verify.py) and an exact rational-arithmetic certificate are in the repository.

Method: unit-diameter balls are compressed in a shrinking box and deformed through rounded cubes into rigid cubes under continued inward pressure; the best configuration is then tightened by SLSQP with a separating plane per nearby pair.

Name for attribution: Yohei Nakajima

Thanks,
Yohei
