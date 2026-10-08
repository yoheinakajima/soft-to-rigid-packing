// Soft→rigid square packer for n=11.
// Shape model: "rounded square" = square of half-side s=0.5-r, dilated by radius r.
//   r=0.5 → disk of diameter 1 (the "blob");  r=0 → rigid unit square.
//   Every intermediate shape is contained in the unit square, so morphing only grows shapes.
// Energy: E = Σ_pairs overlap² + Σ wall-violation² + μ·L   (μ = inward pressure on the container)
(function (root) {
  let N = 11;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    let u = 0; while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }

  // ---------- geometry ----------
  function verts(x, y, t, s, out) {
    const c = Math.cos(t) * s, d = Math.sin(t) * s;
    out[0] = x + c - d; out[1] = y + d + c;
    out[2] = x - c - d; out[3] = y - d + c;
    out[4] = x - c + d; out[5] = y - d - c;
    out[6] = x + c + d; out[7] = y + d - c;
  }
  function segDist2(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    let u = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    const qx = ax + u * dx - px, qy = ay + u * dy - py;
    return qx * qx + qy * qy;
  }
  const VA = new Float64Array(8), VB = new Float64Array(8), AX = new Float64Array(8);
  // Signed distance between two equal squares (half-side s). Negative = SAT penetration depth.
  function sdSquares(x1, y1, t1, x2, y2, t2, s) {
    if (s <= 0) return Math.hypot(x2 - x1, y2 - y1);
    verts(x1, y1, t1, s, VA); verts(x2, y2, t2, s, VB);
    AX[0] = Math.cos(t1); AX[1] = Math.sin(t1); AX[2] = -AX[1]; AX[3] = AX[0];
    AX[4] = Math.cos(t2); AX[5] = Math.sin(t2); AX[6] = -AX[5]; AX[7] = AX[4];
    let minO = Infinity, sep = false;
    for (let k = 0; k < 8; k += 2) {
      const ux = AX[k], uy = AX[k + 1];
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (let m = 0; m < 8; m += 2) {
        const pa = VA[m] * ux + VA[m + 1] * uy, pb = VB[m] * ux + VB[m + 1] * uy;
        if (pa < a0) a0 = pa; if (pa > a1) a1 = pa;
        if (pb < b0) b0 = pb; if (pb > b1) b1 = pb;
      }
      const o = Math.min(a1 - b0, b1 - a0);
      if (o < 0) { sep = true; break; }
      if (o < minO) minO = o;
    }
    if (!sep) return -minO;
    let d2 = Infinity;
    for (let m = 0; m < 8; m += 2) for (let e = 0; e < 8; e += 2) {
      const f = (e + 2) & 7;
      let q = segDist2(VA[m], VA[m + 1], VB[e], VB[e + 1], VB[f], VB[f + 1]); if (q < d2) d2 = q;
      q = segDist2(VB[m], VB[m + 1], VA[e], VA[e + 1], VA[f], VA[f + 1]); if (q < d2) d2 = q;
    }
    return Math.sqrt(d2);
  }
  // ---- oriented shape: chamfered square (corners cut by c). c = 0.29289 is the regular octagon
  // inscribed in the unit square; c = 0 is the unit square. Every member fits inside the unit square.
  let SHAPE = 'round', CHAM = 0;
  const C_OCT = 0.5 - 0.5 / (1 + Math.SQRT2) * 1; // = (1 - 1/(1+√2))/2 ≈ 0.29289
  const LV = new Float64Array(16);
  function localVerts(c) {
    const h = 0.5, k = 0.5 - c;
    const v = [h, -k, h, k, k, h, -k, h, -h, k, -h, -k, -k, -h, k, -h];
    for (let i = 0; i < 16; i++) LV[i] = v[i];
  }
  const PA = new Float64Array(16), PB = new Float64Array(16), PAX = new Float64Array(16);
  function placePoly(x, y, t, out) {
    const ct = Math.cos(t), st = Math.sin(t);
    for (let i = 0; i < 16; i += 2) { out[i] = x + LV[i] * ct - LV[i + 1] * st; out[i + 1] = y + LV[i] * st + LV[i + 1] * ct; }
  }
  // signed distance between two chamfered squares (negative = SAT penetration depth)
  function sdOct(x1, y1, t1, x2, y2, t2) {
    placePoly(x1, y1, t1, PA); placePoly(x2, y2, t2, PB);
    const a = [t1, t1 + Math.PI / 2, t1 + Math.PI / 4, t1 + 3 * Math.PI / 4, t2, t2 + Math.PI / 2, t2 + Math.PI / 4, t2 + 3 * Math.PI / 4];
    let minO = Infinity, sep = false;
    for (let q = 0; q < 8; q++) {
      const ux = Math.cos(a[q]), uy = Math.sin(a[q]);
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (let m = 0; m < 16; m += 2) {
        const pa = PA[m] * ux + PA[m + 1] * uy, pb = PB[m] * ux + PB[m + 1] * uy;
        if (pa < a0) a0 = pa; if (pa > a1) a1 = pa; if (pb < b0) b0 = pb; if (pb > b1) b1 = pb;
      }
      const o = Math.min(a1 - b0, b1 - a0);
      if (o < 0) { sep = true; break; }
      if (o < minO) minO = o;
    }
    if (!sep) return -minO;
    let d2 = Infinity;
    for (let m = 0; m < 16; m += 2) for (let e = 0; e < 16; e += 2) {
      const f = (e + 2) & 15;
      let q = segDist2(PA[m], PA[m + 1], PB[e], PB[e + 1], PB[f], PB[f + 1]); if (q < d2) d2 = q;
      q = segDist2(PB[m], PB[m + 1], PA[e], PA[e + 1], PA[f], PA[f + 1]); if (q < d2) d2 = q;
    }
    return Math.sqrt(d2);
  }
  function setShape(shape, c) { SHAPE = shape; CHAM = c; if (shape === 'oct') localVerts(c); }

  // Signed distance between squares A=(x1,y1,t1), B=(x2,y2,t2) of half-side s, and its gradient
  // w.r.t. (x1,y1,t1,x2,y2,t2) written into G. Same value as sdSquares.
  const G = new Float64Array(6);
  function sdSquaresG(x1, y1, t1, x2, y2, t2, s) {
    if (s <= 0) {
      const dx = x1 - x2, dy = y1 - y2, d = Math.hypot(dx, dy) || 1e-300;
      G[0] = dx / d; G[1] = dy / d; G[2] = 0; G[3] = -dx / d; G[4] = -dy / d; G[5] = 0;
      return Math.hypot(dx, dy);
    }
    verts(x1, y1, t1, s, VA); verts(x2, y2, t2, s, VB);
    AX[0] = Math.cos(t1); AX[1] = Math.sin(t1); AX[2] = -AX[1]; AX[3] = AX[0];
    AX[4] = Math.cos(t2); AX[5] = Math.sin(t2); AX[6] = -AX[5]; AX[7] = AX[4];
    let minO = Infinity, sep = false, bk = -1, bmA = -1, bmB = -1, bcase = 0;
    for (let k = 0; k < 8; k += 2) {
      const ux = AX[k], uy = AX[k + 1];
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity, ia0 = 0, ia1 = 0, ib0 = 0, ib1 = 0;
      for (let m = 0; m < 8; m += 2) {
        const pa = VA[m] * ux + VA[m + 1] * uy, pb = VB[m] * ux + VB[m + 1] * uy;
        if (pa < a0) { a0 = pa; ia0 = m; } if (pa > a1) { a1 = pa; ia1 = m; }
        if (pb < b0) { b0 = pb; ib0 = m; } if (pb > b1) { b1 = pb; ib1 = m; }
      }
      const oA = a1 - b0, oB = b1 - a0, o = Math.min(oA, oB);
      if (o < 0) { sep = true; break; }
      if (o < minO) { minO = o; bk = k; if (oA <= oB) { bcase = 1; bmA = ia1; bmB = ib0; } else { bcase = -1; bmA = ia0; bmB = ib1; } }
    }
    if (!sep) {
      // sd = -o, o = bcase*(u·VA[bmA] - u·VB[bmB]); u belongs to body (bk<4 ? A : B)
      const ux = AX[bk], uy = AX[bk + 1];
      const pax = VA[bmA], pay = VA[bmA + 1], pbx = VB[bmB], pby = VB[bmB + 1];
      // do = bcase * [ du·(PA-PB) + u·(dPA - dPB) ];  dPA = dC1 + dt1*perp(PA-C1), perp(v)=(-vy,vx)
      const g0 = bcase * ux, g1 = bcase * uy;
      let g2 = bcase * (ux * (-(pay - y1)) + uy * (pax - x1));
      let g5 = -bcase * (ux * (-(pby - y2)) + uy * (pbx - x2));
      const duDot = bcase * ((-uy) * (pax - pbx) + ux * (pay - pby)); // du = perp(u) dt_owner
      if (bk < 4) g2 += duDot; else g5 += duDot;
      G[0] = -g0; G[1] = -g1; G[2] = -g2; G[3] = g0; G[4] = g1; G[5] = -g5;
      return -minO;
    }
    // separated: closest features (vertex of one to edge of the other)
    let d2 = Infinity, qx = 0, qy = 0, px = 0, py = 0, onA = true;
    for (let m = 0; m < 8; m += 2) for (let e = 0; e < 8; e += 2) {
      const f = (e + 2) & 7;
      // vertex of A vs edge of B
      let ax = VB[e], ay = VB[e + 1], bx = VB[f], by = VB[f + 1], vx = VA[m], vy = VA[m + 1];
      let dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy, u = L2 > 0 ? ((vx - ax) * dx + (vy - ay) * dy) / L2 : 0;
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      let cx = ax + u * dx, cy = ay + u * dy, q = (vx - cx) * (vx - cx) + (vy - cy) * (vy - cy);
      if (q < d2) { d2 = q; px = vx; py = vy; qx = cx; qy = cy; onA = true; }
      // vertex of B vs edge of A
      ax = VA[e]; ay = VA[e + 1]; bx = VA[f]; by = VA[f + 1]; vx = VB[m]; vy = VB[m + 1];
      dx = bx - ax; dy = by - ay; L2 = dx * dx + dy * dy; u = L2 > 0 ? ((vx - ax) * dx + (vy - ay) * dy) / L2 : 0;
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      cx = ax + u * dx; cy = ay + u * dy; q = (vx - cx) * (vx - cx) + (vy - cy) * (vy - cy);
      if (q < d2) { d2 = q; px = cx; py = cy; qx = vx; qy = vy; onA = false; }
    }
    // closest points: on A (pA) and on B (pB)
    let pAx, pAy, pBx, pBy;
    if (onA) { pAx = px; pAy = py; pBx = qx; pBy = qy; } else { pAx = px; pAy = py; pBx = qx; pBy = qy; }
    const d = Math.sqrt(d2) || 1e-300, nx = (pAx - pBx) / d, ny = (pAy - pBy) / d;
    G[0] = nx; G[1] = ny; G[2] = nx * (-(pAy - y1)) + ny * (pAx - x1);
    G[3] = -nx; G[4] = -ny; G[5] = -(nx * (-(pBy - y2)) + ny * (pBx - x2));
    return Math.sqrt(d2);
  }

  function pairOverlap(x1, y1, t1, x2, y2, t2, r) {
    if (SHAPE === 'oct') {
      const dx = x2 - x1, dy = y2 - y1;
      if (dx * dx + dy * dy > 2.0001) return 0;
      const ov = -sdOct(x1, y1, t1, x2, y2, t2);
      return ov > 0 ? ov : 0;
    }
    const dx = x2 - x1, dy = y2 - y1;
    if (dx * dx + dy * dy > 2.0001) return 0; // circumradius of a unit square is √2/2
    const ov = 2 * r - sdSquares(x1, y1, t1, x2, y2, t2, 0.5 - r);
    return ov > 0 ? ov : 0;
  }
  function halfExtent(t, r) {
    if (SHAPE === 'oct') { const ct = Math.cos(t), st = Math.sin(t); let m = 0; for (let i = 0; i < 16; i += 2) { const v = Math.abs(LV[i] * ct - LV[i + 1] * st); if (v > m) m = v; } return m; }
    return (0.5 - r) * (Math.abs(Math.cos(t)) + Math.abs(Math.sin(t))) + r; }

  // ---------- state ----------
  function makeState(seed, L0) {
    const rng = mulberry32(seed * 7919 + 13);
    const st = {
      rng, L: L0, vL: 0, r: 0.5, mu: 0, phase: 'init', step: 0,
      X: new Float64Array(N), Y: new Float64Array(N), T: new Float64Array(N),
      VX: new Float64Array(N), VY: new Float64Array(N), VT: new Float64Array(N), frames: [], log: [],
    };
    for (let i = 0; i < N; i++) {
      st.X[i] = 0.7 + rng() * (L0 - 1.4); st.Y[i] = 0.7 + rng() * (L0 - 1.4); st.T[i] = rng() * Math.PI / 2;
    }
    return st;
  }
  function shapeE(st, i, x, y, t, r) {
    let e = 0;
    const nb = NB[i], m = NBC[i];
    for (let q = 0; q < m; q++) {
      const j = nb[q];
      const o = pairOverlap(x, y, t, st.X[j], st.Y[j], st.T[j], r); e += o * o;
    }
    const w = halfExtent(t, r), L = st.L; let q;
    q = w - x; if (q > 0) e += q * q;
    q = x + w - L; if (q > 0) e += q * q;
    q = w - y; if (q > 0) e += q * q;
    q = y + w - L; if (q > 0) e += q * q;
    return e;
  }
  function overlapEnergy(st, r) {
    let e = 0, maxO = 0;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const o = pairOverlap(st.X[i], st.Y[i], st.T[i], st.X[j], st.Y[j], st.T[j], r);
      e += o * o; if (o > maxO) maxO = o;
    }
    for (let i = 0; i < N; i++) {
      const w = halfExtent(st.T[i], r);
      for (const q of [w - st.X[i], st.X[i] + w - st.L, w - st.Y[i], st.Y[i] + w - st.L]) if (q > 0) { e += q * q; if (q > maxO) maxO = q; }
    }
    return { e, maxO };
  }

  const GX = new Float64Array(128), GY = new Float64Array(128), GT = new Float64Array(128);
  // neighbour lists, rebuilt every step (pairs whose centres are within √2 + margin)
  const NB = Array.from({ length: 128 }, () => new Int32Array(128)), NBC = new Int32Array(128);
  function buildNB(st) {
    NBC.fill(0);
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const dx = st.X[i] - st.X[j], dy = st.Y[i] - st.Y[j];
      if (dx * dx + dy * dy < 2.01) { NB[i][NBC[i]++] = j; NB[j][NBC[j]++] = i; }
    }
    // keep ascending order so sums match the all-pairs loop exactly
    for (let i = 0; i < N; i++) NB[i].subarray(0, NBC[i]).sort();
  }
  // One momentum-gradient step. If moveL, the container side L is a dynamic variable under pressure mu.
  function dyn(st, r, mu, noise, moveL, lr) {
    const h = 1e-6, beta = 0.85, cap = 0.03;
    lr = lr || 0.04;
    buildNB(st);
    if (SHAPE === 'oct') {
      for (let i = 0; i < N; i++) {
        const x = st.X[i], y = st.Y[i], t = st.T[i];
        GX[i] = (shapeE(st, i, x + h, y, t, r) - shapeE(st, i, x - h, y, t, r)) / (2 * h);
        GY[i] = (shapeE(st, i, x, y + h, t, r) - shapeE(st, i, x, y - h, t, r)) / (2 * h);
        GT[i] = r >= 0.4999 ? 0 : (shapeE(st, i, x, y, t + h, r) - shapeE(st, i, x, y, t - h, r)) / (2 * h);
      }
    } else analyticGrad(st, r);
    for (let i = 0; i < N; i++) {
      st.VX[i] = beta * st.VX[i] - lr * GX[i];
      st.VY[i] = beta * st.VY[i] - lr * GY[i];
      st.VT[i] = beta * st.VT[i] - lr * GT[i];
      const vm = Math.hypot(st.VX[i], st.VY[i]);
      if (vm > cap) { st.VX[i] *= cap / vm; st.VY[i] *= cap / vm; }
      if (Math.abs(st.VT[i]) > cap) st.VT[i] = Math.sign(st.VT[i]) * cap;
      st.X[i] += st.VX[i]; st.Y[i] += st.VY[i]; st.T[i] += st.VT[i];
      if (noise > 0) {
        st.X[i] += noise * gauss(st.rng); st.Y[i] += noise * gauss(st.rng);
        st.T[i] += noise * 1.5 * gauss(st.rng);
      }
    }
    if (moveL) {
      // dE/dL = mu - 2Σ(wall overshoot on the far walls). Container also re-centres so near walls press too.
      let gL = mu;
      for (let i = 0; i < N; i++) {
        const w = halfExtent(st.T[i], r);
        let q = st.X[i] + w - st.L; if (q > 0) gL -= 2 * q;
        q = st.Y[i] + w - st.L; if (q > 0) gL -= 2 * q;
        q = w - st.X[i]; if (q > 0) gL -= 2 * q;
        q = w - st.Y[i]; if (q > 0) gL -= 2 * q;
      }
      st.vL = beta * st.vL - 0.02 * gL;
      if (Math.abs(st.vL) > cap) st.vL = Math.sign(st.vL) * cap;
      // apply as a symmetric resize about the box centre (keeps pressure from all four walls)
      const d = st.vL / 2;
      for (let i = 0; i < N; i++) { st.X[i] += d; st.Y[i] += d; }
      st.L += st.vL;
    }
    st.r = r; st.mu = mu; st.step++;
  }

  // Analytic gradient of E = Σ_pairs (2r - sd)_+² + Σ wall violations²  (rounded squares)
  function analyticGrad(st, r) {
    GX.fill(0, 0, N); GY.fill(0, 0, N); GT.fill(0, 0, N);
    const s = 0.5 - r, X = st.X, Y = st.Y, T = st.T;
    for (let i = 0; i < N; i++) {
      const nb = NB[i], m = NBC[i];
      for (let q = 0; q < m; q++) {
        const j = nb[q]; if (j < i) continue;
        const dx = X[j] - X[i], dy = Y[j] - Y[i];
        if (dx * dx + dy * dy > 2.0001) continue;
        const sd = sdSquaresG(X[i], Y[i], T[i], X[j], Y[j], T[j], s);
        const o = 2 * r - sd; if (o <= 0) continue;
        const c = -2 * o; // dE/dsd
        GX[i] += c * G[0]; GY[i] += c * G[1]; GT[i] += c * G[2];
        GX[j] += c * G[3]; GY[j] += c * G[4]; GT[j] += c * G[5];
      }
      // walls
      const t = T[i], ct = Math.cos(t), sn = Math.sin(t);
      const w = s * (Math.abs(ct) + Math.abs(sn)) + r;
      const dw = s * (-Math.sign(ct) * sn + Math.sign(sn) * ct);
      let qq;
      qq = w - X[i]; if (qq > 0) { GX[i] -= 2 * qq; GT[i] += 2 * qq * dw; }
      qq = X[i] + w - st.L; if (qq > 0) { GX[i] += 2 * qq; GT[i] += 2 * qq * dw; }
      qq = w - Y[i]; if (qq > 0) { GY[i] -= 2 * qq; GT[i] += 2 * qq * dw; }
      qq = Y[i] + w - st.L; if (qq > 0) { GY[i] += 2 * qq; GT[i] += 2 * qq * dw; }
    }
    if (r >= 0.4999) GT.fill(0, 0, N);
  }

  function snap(st, note) {
    const f = { ph: st.phase, r: +st.r.toFixed(4), L: +st.L.toFixed(5), s: st.step, p: [] };
    if (note) f.note = note;
    for (let i = 0; i < N; i++) f.p.push(+st.X[i].toFixed(4), +st.Y[i].toFixed(4), +st.T[i].toFixed(4));
    st.frames.push(f);
  }
  function save(st) { return { X: Float64Array.from(st.X), Y: Float64Array.from(st.Y), T: Float64Array.from(st.T), L: st.L }; }
  function load(st, s) { st.X.set(s.X); st.Y.set(s.Y); st.T.set(s.T); st.L = s.L; st.VX.fill(0); st.VY.fill(0); st.VT.fill(0); st.vL = 0; }

  // Relax at fixed L, zero pressure. Returns final max violation.
  function relaxFixed(st, r, iters, lr) {
    st.VX.fill(0); st.VY.fill(0); st.VT.fill(0);
    let m = overlapEnergy(st, r);
    for (let k = 0; k < iters; k++) {
      dyn(st, r, 0, 0, false, lr);
      if ((k & 15) === 15) { m = overlapEnergy(st, r); if (m.maxO < 2e-7) break; }
    }
    return overlapEnergy(st, r).maxO;
  }
  function scaleAbout(st, k) {
    const c = st.L / 2;
    for (let i = 0; i < N; i++) { st.X[i] = c + k * (st.X[i] - c); st.Y[i] = c + k * (st.Y[i] - c); }
    st.L *= k;
  }

  // ---------- exact final measurement ----------
  // Rigid squares: uniformly scale centres apart until no pair overlaps (bisection to 1e-12),
  // then take the tight axis-aligned bounding square. This is a certified-legal packing side.
  function legalize(X, Y, T) {
    let cx = 0, cy = 0; for (let i = 0; i < N; i++) { cx += X[i]; cy += Y[i]; } cx /= N; cy /= N;
    const ok = (k) => {
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const sd = sdSquares(cx + k * (X[i] - cx), cy + k * (Y[i] - cy), T[i], cx + k * (X[j] - cx), cy + k * (Y[j] - cy), T[j], 0.5);
        if (sd < -1e-12) return false;
      }
      return true;
    };
    let lo = 1, hi = 1;
    if (!ok(1)) { hi = 1.0001; while (!ok(hi)) hi = 1 + (hi - 1) * 2; for (let it = 0; it < 70; it++) { const m = (lo + hi) / 2; if (ok(m)) hi = m; else lo = m; } }
    const k = hi, x = [], y = [];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < N; i++) {
      x.push(cx + k * (X[i] - cx)); y.push(cy + k * (Y[i] - cy));
      const w = halfExtent(T[i], 0);
      x0 = Math.min(x0, x[i] - w); x1 = Math.max(x1, x[i] + w); y0 = Math.min(y0, y[i] - w); y1 = Math.max(y1, y[i] + w);
    }
    const side = Math.max(x1 - x0, y1 - y0);
    const ox = x0 - (side - (x1 - x0)) / 2, oy = y0 - (side - (y1 - y0)) / 2;
    return { side, k, X: x.map(v => v - ox), Y: y.map(v => v - oy), T: Array.from(T) };
  }

  function squeezeLoop(st, iters) {
      // first make it strictly feasible
      for (let g = 0; g < 40 && relaxFixed(st, 0, 600) > 2e-7; g++) scaleAbout(st, 1.002);
      snap(st, 'feasible');
      let delta = 0.01, best = save(st), fails = 0;
      for (let it = 0; it < iters; it++) {
        const prev = save(st);
        if (fails >= 3) {
          // shake: kick a random subset (position + angle), then relax at the CURRENT L
          const kk = 1 + Math.floor(st.rng() * 3);
          for (let m = 0; m < kk; m++) {
            const i = Math.floor(st.rng() * N);
            st.X[i] += 0.15 * gauss(st.rng); st.Y[i] += 0.15 * gauss(st.rng); st.T[i] += 0.3 * gauss(st.rng);
          }
          if (relaxFixed(st, 0, 1500) < 2e-7) { best = save(st); fails = 0; delta = Math.max(delta, 0.002); snap(st, 'shake ok'); }
          else { load(st, prev); fails = 0; delta = 0.004; }
          continue;
        }
        scaleAbout(st, 1 - delta);
        if (relaxFixed(st, 0, 800) < 2e-7) { best = save(st); snap(st); delta = Math.min(delta * 1.3, 0.02); }
        else { load(st, prev); delta *= 0.5; if (delta < 1e-5) { fails++; delta = 0.003; } }
      }
      load(st, best);
  }

  // Tighten a saved rigid packing: fixed-box squeeze + shake, then certified legalization.
  function polishFrom(conf, iters, seed) {
    N = conf.X.length; setShape('round', 0);
    const st = makeState(seed || 1, conf.side);
    st.X.set(conf.X); st.Y.set(conf.Y); st.T.set(conf.T); st.L = conf.side; st.phase = 'polish';
    squeezeLoop(st, iters);
    const leg = legalize(st.X, st.Y, st.T);
    return { side: leg.side, final: leg };
  }

  // ---------- the experiment ----------
  // cfg.mode: 'rigid'  – control: rigid squares from the start, same pressure schedule
  //           'naive'  – the proposed method: blob → morph → rigid, pressure decays, container free
  //           'improved' – adds: disk pre-compaction, rotational annealing during morph,
  //                        and a fixed-L squeeze+shake phase (pressure without tolerated overlap)
  function run(cfg) {
    const c = Object.assign({ seed: 1, n: 11, mode: 'naive', L0: 0, compact: 2500, morph: 5000, settle: 1500,
      mu: 0.02, squeeze: 0, recEvery: 40 }, cfg);
    N = c.n; if (!c.L0) c.L0 = Math.max(3, 1.8 * Math.sqrt(N));
    if (c.anneal === undefined) c.anneal = c.mode === 'improved';
    const st = makeState(c.seed, c.L0);
    const rigid = c.mode === 'rigid', oct = c.mode === 'octagon';
    setShape('round', 0);
    const rec = () => { if (st.step % c.recEvery === 0) snap(st); };
    snap(st);

    // Phase A: compaction (disks unless rigid control)
    st.phase = rigid ? 'compress (rigid)' : oct ? 'compress octagons' : 'compress blobs';
    const rA = rigid || oct ? 0 : 0.5;
    if (oct) setShape('oct', C_OCT);
    for (let k = 0; k < c.compact; k++) {
      const u = k / c.compact;
      const noise = c.anneal ? 0.015 * (1 - u) : 0.008 * (1 - u);
      dyn(st, rA, c.mu * 3, noise, true); if (oct) st.r = CHAM; rec();
    }
    st.log.push({ phase: st.phase, L: st.L });

    // Phase B: morph blob → square, container free under pressure
    st.phase = rigid ? 'hold (rigid)' : oct ? 'morph octagon→square' : 'morph blob→square';
    for (let k = 0; k < c.morph; k++) {
      const u = k / c.morph;
      const r = rigid || oct ? 0 : 0.5 * (1 - u);
      if (oct) setShape('oct', C_OCT * (1 - u));
      const noise = c.anneal ? 0.004 * (1 - u) : 0.0;
      dyn(st, r, c.mu, noise, true); if (oct) st.r = CHAM; rec();
    }
    st.log.push({ phase: st.phase, L: st.L });

    // Phase C: rigid settle — pressure decays so penalty overlaps go to ~0
    setShape('round', 0);
    st.phase = 'rigid settle';
    for (let k = 0; k < c.settle; k++) {
      const mu = c.mu * Math.pow(1e-4, k / c.settle);
      dyn(st, 0, mu, 0, true); rec();
    }
    st.log.push({ phase: st.phase, L: st.L });

    // Phase D (improved): squeeze & shake at fixed L — pressure that never tolerates overlap
    if (c.squeeze > 0) {
      st.phase = 'squeeze + shake';
      squeezeLoop(st, c.squeeze);
      st.log.push({ phase: st.phase, L: st.L });
    }

    st.phase = 'final'; snap(st);
    const leg = legalize(st.X, st.Y, st.T);
    st.frames.push({ ph: 'certified', r: 0, L: +leg.side.toFixed(6), s: st.step, p: leg.X.flatMap((x, i) => [+x.toFixed(5), +leg.Y[i].toFixed(5), +leg.T[i].toFixed(5)]) });
    return { cfg: c, side: leg.side, Lsoft: st.L, scale: leg.k, frames: st.frames, log: st.log, final: leg };
  }

  const api = { get N() { return N; }, sdSquaresG, G, analyticGrad, polishFrom, setShape, sdOct, C_OCT, run, legalize, sdSquares, halfExtent, pairOverlap };
  if (typeof module !== 'undefined') module.exports = api; else root.Packer = api;
})(this);
