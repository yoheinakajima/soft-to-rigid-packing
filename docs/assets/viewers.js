// Replay viewers for the 2D (squares) and 3D (cubes) runs, plus an in-browser verifier.
// Frame format: {ph, r, L, s, p:[...]}; squares: p = [x, y, theta]*n ; cubes: p = [x, y, z, qw, qx, qy, qz]*n.
(function () {
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function controls(root, onScrub) {
    const btn = root.querySelector('button'), rng = root.querySelector('input[type=range]');
    const st = { t: reduce ? 1 : 0, playing: !reduce };
    btn.textContent = st.playing ? 'Pause' : 'Play';
    btn.onclick = () => { if (st.t >= 1) st.t = 0; st.playing = !st.playing; btn.textContent = st.playing ? 'Pause' : 'Play'; };
    rng.oninput = () => { st.t = rng.value / 1000; st.playing = false; btn.textContent = 'Play'; };
    st.sync = () => { rng.value = Math.round(st.t * 1000); if (st.t >= 1 && st.playing) { st.playing = false; btn.textContent = 'Replay'; } };
    return st;
  }
  function frameAt(F, u, stride, angIdx) {
    const n = F.length - 1, x = Math.max(0, Math.min(n, u * n)), i = Math.min(n - 1, Math.floor(x));
    let w = x - i; const A = F[i], B = F[i + 1] || A;
    if (B.ph !== A.ph && /certified|claim|exact/.test(B.ph)) w = w > 0.5 ? 1 : 0;
    return { A, B, w, ph: w > 0.5 ? B.ph : A.ph, r: A.r + (B.r - A.r) * w, L: A.L + (B.L - A.L) * w };
  }

  // ---------- 2D squares ----------
  function square(el, D) {
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), hud = el.querySelector('.hud');
    const st = controls(el.querySelector('.ctl'));
    let last = performance.now();
    function mix(c1, c2, w) { const h = c => [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16)); const a = h(c1), b = h(c2); return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * w))})`; }
    function draw() {
      const W = cv.width = cv.clientWidth * (devicePixelRatio || 1), H = cv.height = W;
      const f = frameAt(D.frames, st.t), n = D.n, view = Math.max(D.record + 0.45, f.L), pad = W * 0.05, sc = (W - 2 * pad) / view;
      const ox = pad + (view - f.L) / 2 * sc;
      ctx.clearRect(0, 0, W, H);
      const cx = ox + f.L * sc / 2;
      ctx.setLineDash([W / 90, W / 110]); ctx.lineWidth = W / 380; ctx.strokeStyle = css('--ref');
      ctx.strokeRect(cx - D.record * sc / 2, cx - D.record * sc / 2, D.record * sc, D.record * sc); ctx.setLineDash([]);
      ctx.lineWidth = W / 220; ctx.strokeStyle = css('--ink'); ctx.strokeRect(ox, ox, f.L * sc, f.L * sc);
      for (let i = 0; i < n; i++) {
        const a = f.A.p.slice(3 * i, 3 * i + 3), b = f.B.p.slice(3 * i, 3 * i + 3);
        let dt = b[2] - a[2]; dt = Math.atan2(Math.sin(dt), Math.cos(dt));
        const x = a[0] + (b[0] - a[0]) * f.w, y = a[1] + (b[1] - a[1]) * f.w, t = a[2] + dt * f.w;
        let fold = ((t % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2); fold = Math.min(fold, Math.PI / 2 - fold);
        ctx.save(); ctx.translate(ox + x * sc, ox + (f.L - y) * sc); ctx.rotate(-t);
        ctx.beginPath(); ctx.roundRect(-sc / 2, -sc / 2, sc, sc, Math.max(0, f.r) * sc);
        ctx.fillStyle = mix(fold > 0.03 ? css('--tilt') : css('--sq'), css('--blob'), Math.min(1, f.r / 0.25));
        ctx.fill(); ctx.lineWidth = W / 400; ctx.strokeStyle = css('--panel'); ctx.stroke(); ctx.restore();
      }
      hud.innerHTML = `<b>${f.ph}</b> · L = <b>${f.L.toFixed(4)}</b>`;
    }
    function tick(now) { const dt = Math.min(0.1, (now - last) / 1000); last = now; if (st.playing) st.t = Math.min(1, st.t + dt / 12); st.sync(); draw(); requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }

  // ---------- 3D cubes ----------
  function cube(el, D) {
    const stage = el.querySelector('.stage'), hud = el.querySelector('.hud');
    const st = controls(el.querySelector('.ctl'));
    if (!window.THREE) { hud.textContent = 'The 3D viewer could not load.'; return; }
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); stage.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const controlsO = THREE.OrbitControls ? new THREE.OrbitControls(camera, renderer.domElement) : null;
    if (controlsO) { controlsO.enableDamping = true; controlsO.autoRotate = !reduce; controlsO.autoRotateSpeed = 0.7; controlsO.enableZoom = false; }
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const l1 = new THREE.DirectionalLight(0xffffff, 0.75); l1.position.set(4, 7, 5); scene.add(l1);
    const l2 = new THREE.DirectionalLight(0xffffff, 0.25); l2.position.set(-5, -2, -4); scene.add(l2);
    const fit = D.record + 0.7; camera.position.set(fit * 1.5, fit * 1.1, fit * 1.8);
    const g = new THREE.Group(); scene.add(g);
    const geos = new Map();
    function geo(r) {
      const k = Math.round(r * 40) / 40; if (geos.has(k)) return geos.get(k);
      let G;
      if (k >= 0.499) G = new THREE.SphereGeometry(0.5, 24, 16);
      else if (k <= 0.001) G = new THREE.BoxGeometry(1, 1, 1);
      else { G = new THREE.BoxGeometry(1, 1, 1, 8, 8, 8); const p = G.attributes.position, s = 0.5 - k, v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const c = new THREE.Vector3(Math.max(-s, Math.min(s, v.x)), Math.max(-s, Math.min(s, v.y)), Math.max(-s, Math.min(s, v.z))); const d = v.clone().sub(c); if (d.length() > 1e-9) d.setLength(k); c.add(d); p.setXYZ(i, c.x, c.y, c.z); }
        G.computeVertexNormals(); }
      geos.set(k, G); return G;
    }
    const meshes = [];
    for (let i = 0; i < D.n; i++) {
      const m = new THREE.Mesh(geo(0.5), new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: new THREE.Color(css('--panel')) }));
      m.add(e); m.userData.e = e; g.add(m); meshes.push(m);
    }
    const edges = (L, color, dashed) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, L, L)), dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.06 }) : new THREE.LineBasicMaterial({ color })); if (dashed) l.computeLineDistances(); return l; };
    g.add(edges(D.record, new THREE.Color(css('--ref')), true));
    let box = null;
    const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), mtx = new THREE.Matrix4();
    function tilt(q) { mtx.makeRotationFromQuaternion(new THREE.Quaternion(q[1], q[2], q[3], q[0])); const e = mtx.elements; let w = 0; for (let k = 0; k < 3; k++) w = Math.max(w, Math.acos(Math.min(1, Math.max(Math.abs(e[4 * k]), Math.abs(e[4 * k + 1]), Math.abs(e[4 * k + 2]))))); return w; }
    function resize() { const w = stage.clientWidth; renderer.setSize(w, w, false); camera.aspect = 1; camera.updateProjectionMatrix(); }
    resize(); new ResizeObserver(resize).observe(stage);
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(0.1, (now - last) / 1000); last = now; if (st.playing) st.t = Math.min(1, st.t + dt / 12); st.sync();
      const f = frameAt(D.frames, st.t), G = geo(f.r);
      if (box) g.remove(box); box = edges(f.L, new THREE.Color(css('--ink')), false); g.add(box);
      const blob = new THREE.Color(css('--blob')), sq = new THREE.Color(css('--sq')), tl = new THREE.Color(css('--tilt'));
      for (let i = 0; i < D.n; i++) {
        const a = f.A.p.slice(7 * i, 7 * i + 7), b = f.B.p.slice(7 * i, 7 * i + 7), m = meshes[i];
        m.geometry = G;
        // simulation frame (x, y, z) -> three.js (x, z, y): swap y and z
        m.position.set(a[0] + (b[0] - a[0]) * f.w - f.L / 2, a[2] + (b[2] - a[2]) * f.w - f.L / 2, a[1] + (b[1] - a[1]) * f.w - f.L / 2);
        qa.set(-a[4], -a[6], -a[5], a[3]); qb.set(-b[4], -b[6], -b[5], b[3]); m.quaternion.copy(qa).slerp(qb, f.w);
        m.material.color.copy(tilt(b.slice(3)) > 0.026 ? tl : sq).lerp(blob, Math.min(1, f.r / 0.25)); m.userData.e.visible = f.r < 0.02;
      }
      hud.innerHTML = `<b>${f.ph}</b> · L = <b>${f.L.toFixed(4)}</b>`;
      if (controlsO) controlsO.update(); renderer.render(scene, camera); requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------- verifier (same checks as verify.py) ----------
  function verify(d) {
    const s = d.s_full, out = []; let ok = true;
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const cubes = d.pieces.map(p => {
      let [w, x, y, z] = p.slice(3); const nq = Math.hypot(w, x, y, z); w /= nq; x /= nq; y /= nq; z /= nq;
      const R = [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]];
      const ax = [0, 1, 2].map(k => [R[0][k], R[1][k], R[2][k]]), V = [];
      for (const a of [-.5, .5]) for (const b of [-.5, .5]) for (const c of [-.5, .5]) V.push([0, 1, 2].map(i => p[i] + a * ax[0][i] + b * ax[1][i] + c * ax[2][i]));
      return { ax, V };
    });
    let wall = Infinity; for (const c of cubes) for (const v of c.V) for (const t of v) wall = Math.min(wall, t, s - t);
    if (wall < 0) ok = false;
    let pair = Infinity;
    for (let i = 0; i < cubes.length; i++) for (let j = i + 1; j < cubes.length; j++) {
      const A = cubes[i], B = cubes[j], axes = [...A.ax, ...B.ax];
      for (const a of A.ax) for (const b of B.ax) { const c = cross(a, b); if (dot(c, c) > 1e-18) axes.push(c); }
      let gap = -Infinity;
      for (const u0 of axes) { const l = Math.sqrt(dot(u0, u0)), u = u0.map(v => v / l);
        const pa = A.V.map(v => dot(u, v)), pb = B.V.map(v => dot(u, v));
        gap = Math.max(gap, Math.min(...pb) - Math.max(...pa), Math.min(...pa) - Math.max(...pb)); }
      pair = Math.min(pair, gap); if (gap <= 0) ok = false;
    }
    return { n: cubes.length, s, wall, pair, ok };
  }

  window.SiteViewers = { square, cube, verify };
})();
