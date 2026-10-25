// Core helpers: deterministic noise, easing, keyed values, sketchy line drawing.
// Everything visible is a pure function of film time.
(function () {
  const W = 1920, H = 1080, BAR = 100;
  const G = { t: 0, boil: 0, frame: 0 };

  function hash(a, b, c) {
    let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return ((h >>> 0) % 100000) / 50000 - 1; // [-1, 1)
  }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // smooth 1D value noise in [-1,1]
  function noise1(x, seed) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return hash(i, seed, 7) * (1 - u) + hash(i + 1, seed, 7) * u;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = {
    lin: (k) => k,
    in2: (k) => k * k,
    out2: (k) => 1 - (1 - k) * (1 - k),
    io2: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
    out3: (k) => 1 - Math.pow(1 - k, 3),
    in3: (k) => k * k * k,
    io3: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out5: (k) => 1 - Math.pow(1 - k, 5),
    sine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
    back: (k) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
    spring: (k) => 1 - Math.exp(-6 * k) * Math.cos(9 * k),
  };
  // 0..1 progress of t over [a, b] with ease
  function prog(t, a, b, ease) {
    const k = clamp((t - a) / (b - a), 0, 1);
    return (ease || E.io2)(k);
  }
  // keyed numeric value: keys [[t, v, ease?], ...]; ease applies to segment arriving at that key
  function key(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e] = keys[i];
      if (t < t1) {
        const [t0, v0] = keys[i - 1];
        const k = (e || E.io2)((t - t0) / (t1 - t0));
        if (typeof v0 === "object") {
          const o = {};
          for (const n in v0) o[n] = lerp(v0[n], v1[n] ?? v0[n], k);
          return o;
        }
        return lerp(v0, v1, k);
      }
    }
    return keys[keys.length - 1][1];
  }
  // discrete keyed state: [[t, "state"], ...]
  function step(t, keys) {
    let v = keys[0][1];
    for (const [tk, s] of keys) if (t >= tk) v = s;
    return v;
  }
  // fade window: in over [a, a+fi], out over [b-fo, b]
  function win(t, a, b, fi = 0.4, fo = 0.4) {
    if (t < a || t > b) return 0;
    return Math.min(fi > 0 ? clamp((t - a) / fi, 0, 1) : 1, fo > 0 ? clamp((b - t) / fo, 0, 1) : 1);
  }

  // ---- sketchy strokes (hand-drawn wobble that boils ~12x/s)
  function wob(i, seed, amp) {
    return hash(i, seed, G.boil) * amp;
  }
  function densify(pts, closed, stepLen) {
    const out = [];
    const n = pts.length;
    const segs = closed ? n : n - 1;
    for (let s = 0; s < segs; s++) {
      const a = pts[s], b = pts[(s + 1) % n];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const k = Math.max(1, Math.round(d / stepLen));
      for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }
  function skPath(ctx, pts, closed, seed = 1, amp = 1.3, stepLen = 28) {
    const p = densify(pts, closed, stepLen);
    ctx.beginPath();
    for (let i = 0; i < p.length; i++) {
      const x = p[i][0] + wob(i, seed, amp), y = p[i][1] + wob(i + 999, seed, amp);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    if (closed) ctx.closePath();
  }
  function skLine(ctx, pts, opt = {}) {
    ctx.save();
    ctx.strokeStyle = opt.color || PAL.line;
    ctx.lineWidth = opt.w || 2.6;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (opt.alpha != null) ctx.globalAlpha *= opt.alpha;
    skPath(ctx, pts, !!opt.closed, opt.seed || 3, opt.amp ?? 1.3, opt.step || 28);
    ctx.stroke();
    ctx.restore();
  }
  function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  function rrPts(x, y, w, h, r, n = 5) {
    const pts = [];
    const corners = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (const [cx, cy, a0] of corners)
      for (let i = 0; i <= n; i++) {
        const a = a0 + (i / n) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    return pts;
  }
  function ellPts(cx, cy, rx, ry, n = 28, a0 = 0, a1 = Math.PI * 2) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return pts;
  }
  // filled shape + sketch outline
  function skShape(ctx, pts, fill, opt = {}) {
    ctx.save();
    if (opt.alpha != null) ctx.globalAlpha *= opt.alpha;
    if (fill) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (opt.line !== false) skLine(ctx, pts, Object.assign({ closed: true }, opt));
  }
  function skRect(ctx, x, y, w, h, fill, opt) { skShape(ctx, rectPts(x, y, w, h), fill, opt); }
  function skRR(ctx, x, y, w, h, r, fill, opt) { skShape(ctx, rrPts(x, y, w, h, r), fill, opt); }
  function skEll(ctx, cx, cy, rx, ry, fill, opt) { skShape(ctx, ellPts(cx, cy, rx, ry), fill, opt); }

  // smooth closed blob through points (catmull-rom), for characters
  function blob(ctx, pts) {
    const n = pts.length;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (i === 0) ctx.moveTo(p1[0], p1[1]);
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    ctx.closePath();
  }
  // jitter points slightly for boiling outlines on characters
  function jit(pts, seed, amp = 1.1) {
    return pts.map((p, i) => [p[0] + wob(i, seed, amp), p[1] + wob(i + 77, seed, amp)]);
  }

  const PAL = {
    bg: "#101115",
    bg2: "#16181d",
    fill: "#1a1c22",
    fill2: "#22252d",
    line: "#8f949e",
    lineDim: "#5d626c",
    ink: "#17181c",
    cream: "#e8e2d2",
    creamShade: "#cfc8b6",
    hoodie: "#3b3f48",
    hoodieDark: "#2c2f36",
    amber: "#ffb13d",
    amberHot: "#ffd27a",
    white: "#f3f1ec",
    grey: "#bfc2c8",
    blue: "#4b8dff",
    red: "#ff3b3b",
    cardigan: "#b4873f",
    tear: "#8fc7ff",
  };

  const FONT = { narr: "'Comic Neue', 'Comic Sans MS', sans-serif", hand: "'Caveat', cursive" };

  window.F = { W, H, BAR, G, hash, mulberry, noise1, clamp, lerp, E, prog, key, step, win, skPath, skLine, skShape, skRect, skRR, skEll, rectPts, rrPts, ellPts, blob, jit, wob, PAL, FONT };
})();
