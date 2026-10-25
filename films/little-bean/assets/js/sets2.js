// AGAIN. — sets and props: living room, the park bench through the seasons, hallway,
// sketchbook pages, the red thread and Forgetting.
(function () {
  const { PAL, G, skLine, skRect, skRR, skEll, skShape, rectPts, clamp, lerp, hash, noise1, mulberry, blob, jit, E } = F;
  const { circle, fillOutline } = C;
  const RED = "#e2403f";
  PAL.red2 = RED;

  // ---------- red thread between two points (pinky to pinky)
  function thread(ctx, a, b, alpha = 1, sag = 60, o = {}) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = RED; ctx.lineWidth = o.w || 3.2; ctx.lineCap = "round";
    ctx.shadowColor = RED; ctx.shadowBlur = o.glow ?? 14;
    const mx = (a[0] + b[0]) / 2 + noise1(G.t * 0.7, 3) * 6, my = Math.max(a[1], b[1]) + sag + noise1(G.t * 0.9, 4) * 5;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]);
    if (o.k != null && o.k < 1) { ctx.setLineDash([2000, 2000]); ctx.lineDashOffset = 2000 * (1 - o.k); }
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Forgetting: a pale, faceless figure that covers her eyes
  function forgetPath(ctx, h) {
    const sway = noise1(G.t * 0.5, 15) * 8;
    const wav = (i) => noise1(G.t * 1.1 + i * 2.1, 19) * 10;
    const pts = [
      [-60 + wav(1), 0], [-50, -80], [-46, -160], [-62, -230], [-78, -262], [-40, -284], [-28, -296], [-42, -330], [-36, -372],
      [0, -392], [36, -372], [42, -330], [28, -296], [40, -284], [78, -262], [62, -230], [46, -160], [50, -80], [60 + wav(2), 0],
      [30, 18 + wav(3)], [0, 6], [-30, 18 + wav(4)],
    ].map(([x, y]) => [x + sway * (-y / 392), y * h]);
    blob(ctx, jit(pts, 91, 1.6));
  }
  function drawForget(ctx, x, y, o = {}) {
    const a = o.alpha ?? 1;
    if (a <= 0.001) return;
    ctx.save();
    ctx.translate(x, y); ctx.scale(o.s || 1, o.s || 1);
    ctx.globalAlpha *= a;
    // mist around
    const mg = ctx.createRadialGradient(0, -200, 20, 0, -200, 340);
    mg.addColorStop(0, "rgba(190,200,225,0.22)"); mg.addColorStop(1, "rgba(190,200,225,0)");
    ctx.fillStyle = mg; ctx.fillRect(-360, -560, 720, 640);
    forgetPath(ctx, 1);
    ctx.fillStyle = "rgba(205,212,228,0.16)"; ctx.fill();
    ctx.shadowColor = "#c9d3ee"; ctx.shadowBlur = 22;
    ctx.strokeStyle = "rgba(214,222,240,0.85)"; ctx.lineWidth = 2.6; ctx.setLineDash([14, 9]); ctx.lineDashOffset = -G.t * 12; ctx.stroke();
    ctx.setLineDash([]);
    // arms reaching toward a target (local coords)
    if (o.reach && o.reach.k > 0) {
      const k = o.reach.k;
      for (const sd of [-1, 1]) {
        const sh = [sd * 66, -262];
        const tx = lerp(sh[0] + sd * 40, o.reach.x + sd * 26, k), ty = lerp(-150, o.reach.y, k);
        ctx.beginPath(); ctx.moveTo(sh[0], sh[1]);
        ctx.quadraticCurveTo(sh[0] + sd * 70, (sh[1] + ty) / 2 - 40, tx, ty);
        ctx.lineCap = "round"; ctx.strokeStyle = "rgba(214,222,240,0.7)"; ctx.lineWidth = 14; ctx.stroke();
        ctx.strokeStyle = "rgba(205,212,228,0.25)"; ctx.lineWidth = 10; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(tx, ty, 26, 18, sd * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220,226,242,0.55)"; ctx.fill(); ctx.strokeStyle = "rgba(230,236,250,0.9)"; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    ctx.restore();
  }
  // drifting fog over the whole frame
  function fog(ctx, k) {
    if (k <= 0) return;
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const x = ((i * 260 + G.t * (14 + i * 3)) % 2400) - 240, y = 300 + (i % 4) * 160 + noise1(G.t * 0.2, i) * 40;
      const g = ctx.createRadialGradient(x, y, 20, x, y, 360);
      g.addColorStop(0, `rgba(200,208,226,${0.16 * k})`); g.addColorStop(1, "rgba(200,208,226,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 380, y - 380, 760, 760);
    }
    ctx.restore();
  }

  // ---------- particles for the seasons
  function petals(ctx, n, color, o = {}) {
    const rnd = mulberry(o.seed || 5);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const sx = rnd() * 2400 - 200, sp = 30 + rnd() * 50, ph = rnd() * 100;
      const yy = ((G.t * sp + ph * 20) % 1100) - 50;
      const xx = sx + Math.sin(G.t * 0.8 + ph) * 60 - G.t * (o.wind || 20) % 2400;
      const x = ((xx % 2400) + 2400) % 2400 - 200;
      ctx.save(); ctx.translate(x, yy); ctx.rotate(G.t * (1 + rnd()) + ph);
      ctx.fillStyle = color; ctx.globalAlpha = o.alpha ?? 0.85;
      if (o.snow) { ctx.beginPath(); ctx.arc(0, 0, 2 + rnd() * 3, 0, 7); ctx.fill(); }
      else { ctx.beginPath(); ctx.ellipse(0, 0, 7 + rnd() * 4, 4, 0, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- THE PARK BENCH. season: spring|summer|autumn|winter ; mode: present|past
  const SEASON = {
    spring: { skyA: "#1c2336", skyB: "#4f4a66", leaf: "#c98aa0", ground: "#14151a", line: PAL.line },
    summer: { skyA: "#18263a", skyB: "#3f5a6a", leaf: "#3f6b4f", ground: "#121611", line: PAL.line },
    autumn: { skyA: "#221e2a", skyB: "#6a4a3e", leaf: "#b8693a", ground: "#16120f", line: PAL.line },
    winter: { skyA: "#161b26", skyB: "#3c4556", leaf: null, ground: "#cfd5de", line: "#9aa3b2" },
    past: { skyA: "#e7a76d", skyB: "#f3d3a0", leaf: "#e39aa8", ground: "#6b4a37", line: "#fbe7c8" },
  };
  function park(ctx, o = {}) {
    const S = SEASON[o.mode === "past" ? "past" : o.season || "spring"];
    const L = { color: S.line };
    const FL = 830;
    const sky = ctx.createLinearGradient(0, -200, 0, FL);
    sky.addColorStop(0, S.skyA); sky.addColorStop(1, S.skyB);
    ctx.fillStyle = sky; ctx.fillRect(-400, -400, 2720, FL + 400);
    // low sun or moon
    if (o.mode === "past") {
      const g = ctx.createRadialGradient(1500, 520, 20, 1500, 520, 420);
      g.addColorStop(0, "rgba(255,240,200,0.95)"); g.addColorStop(0.2, "rgba(255,220,160,0.5)"); g.addColorStop(1, "rgba(255,200,140,0)");
      ctx.fillStyle = g; ctx.fillRect(1000, 0, 1000, 1000);
    } else {
      circle(ctx, 1560, 240, 34); ctx.fillStyle = "#e8e6df"; ctx.save(); ctx.shadowColor = "#e8e6df"; ctx.shadowBlur = 30; ctx.fill(); ctx.restore();
    }
    // distant city
    const rnd = mulberry(31);
    let bx = -300;
    ctx.fillStyle = o.mode === "past" ? "rgba(150,90,70,0.45)" : "rgba(10,12,18,0.75)";
    while (bx < 2300) {
      const bw = 40 + rnd() * 70, bh = 60 + rnd() * 180;
      ctx.fillRect(bx, FL - 90 - bh, bw, bh + 90);
      if (o.mode !== "past")
        for (let wy = FL - 80 - bh; wy < FL - 100; wy += 18)
          for (let wx = bx + 8; wx < bx + bw - 8; wx += 14) if (rnd() > 0.86) { ctx.fillStyle = "rgba(255,210,140,0.5)"; ctx.fillRect(wx, wy, 5, 7); ctx.fillStyle = "rgba(10,12,18,0.75)"; }
      bx += bw + 6;
    }
    // ground
    ctx.fillStyle = S.ground; ctx.fillRect(-400, FL, 2720, 700);
    if (o.season === "winter" && o.mode !== "past") {
      ctx.fillStyle = "#e6eaf0"; ctx.fillRect(-400, FL, 2720, 14);
    }
    skLine(ctx, [[-300, FL], [2220, FL]], Object.assign({ seed: 501, w: 3 }, L));
    // tree behind the bench
    const tx = 560;
    skShape(ctx, [[tx - 26, FL], [tx - 18, 520], [tx - 70, 380], [tx - 50, 372], [tx - 4, 470], [tx + 30, 330], [tx + 52, 340], [tx + 22, 520], [tx + 30, FL]],
      o.mode === "past" ? "#7a4f3a" : "#24201e", Object.assign({ seed: 502, w: 3 }, L));
    if (S.leaf) {
      const cpts = [[tx - 330, 420], [tx - 300, 250], [tx - 160, 150], [tx + 30, 120], [tx + 220, 170], [tx + 330, 280], [tx + 300, 420], [tx + 140, 470], [tx - 120, 470]];
      blob(ctx, jit(cpts, 503, 2));
      ctx.fillStyle = S.leaf; ctx.globalAlpha = 0.92; ctx.fill(); ctx.globalAlpha = 1;
      ctx.lineWidth = 3; ctx.strokeStyle = S.line; ctx.stroke();
      // texture blobs
      const r2 = mulberry(504);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(tx - 260 + r2() * 520, 180 + r2() * 260, 18 + r2() * 26, 0, 7); ctx.fill(); }
    } else {
      // bare branches with snow
      for (const [x1, y1, x2, y2] of [[tx, 420, tx - 220, 260], [tx, 380, tx + 200, 230], [tx - 120, 330, tx - 200, 180], [tx + 110, 300, tx + 260, 300], [tx + 10, 360, tx + 40, 150]]) {
        skLine(ctx, [[x1, y1], [x2, y2]], Object.assign({ seed: x2 + y2, w: 5 }, L));
        skLine(ctx, [[x1, y1 - 4], [x2, y2 - 4]], { seed: x2 + y2 + 1, w: 3, color: "#eef2f7" });
      }
    }
    // lamp post
    const lx = 1360;
    skLine(ctx, [[lx, FL], [lx, 420]], Object.assign({ seed: 510, w: 6 }, L));
    skShape(ctx, [[lx - 24, 420], [lx + 24, 420], [lx + 14, 380], [lx - 14, 380]], "#1e2026", Object.assign({ seed: 511 }, L));
    const lampOn = o.lamp ?? (o.mode === "past" ? 0 : 1);
    if (lampOn > 0) {
      ctx.save();
      const g = ctx.createRadialGradient(lx, 410, 5, lx, 600, 420);
      g.addColorStop(0, `rgba(255,214,150,${0.4 * lampOn})`); g.addColorStop(1, "rgba(255,214,150,0)");
      ctx.fillStyle = g; ctx.fillRect(lx - 500, 300, 1000, 640);
      circle(ctx, lx, 404, 9); ctx.fillStyle = "#ffe7b8"; ctx.shadowColor = "#ffd27a"; ctx.shadowBlur = 24; ctx.fill();
      ctx.restore();
    }
    if (o.mode === "past") {
      // warm wash
      ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(255,190,120,0.35)"; ctx.fillRect(-400, -400, 2720, 1880); ctx.restore();
    }
  }
  // bench in two layers so characters can sit between them
  function bench(ctx, layer, o = {}) {
    const S = SEASON[o.mode === "past" ? "past" : o.season || "spring"];
    const L = { color: S.line };
    const x0 = 740, x1 = 1180, seat = 712;
    const wood = o.mode === "past" ? "#8a5a3c" : "#2c2722";
    if (layer === "back") {
      for (let i = 0; i < 2; i++) skRect(ctx, x0, 600 + i * 36, x1 - x0, 24, wood, Object.assign({ seed: 520 + i }, L));
      skLine(ctx, [[x0 + 30, 600], [x0 + 30, seat]], Object.assign({ seed: 523, w: 5 }, L));
      skLine(ctx, [[x1 - 30, 600], [x1 - 30, seat]], Object.assign({ seed: 524, w: 5 }, L));
    } else {
      skRect(ctx, x0 - 10, seat, x1 - x0 + 20, 22, wood, Object.assign({ seed: 525 }, L));
      for (const x of [x0 + 20, x1 - 20]) skLine(ctx, [[x, seat + 22], [x - 8, 830]], Object.assign({ seed: 526 + x, w: 5 }, L));
      if (o.season === "winter" && o.mode !== "past") { ctx.fillStyle = "#eef2f7"; ctx.fillRect(x0 - 10, seat - 6, (x1 - x0 + 20) * (o.snowSeat ?? 1), 7); }
    }
  }

  // ---------- LIVING ROOM (their home)
  function livingRoom(ctx, o = {}) {
    const FL = 830;
    const night = o.night;
    const wg = ctx.createRadialGradient(700, 420, 80, 800, 500, 1200);
    wg.addColorStop(0, night ? "#17181e" : "#24222a"); wg.addColorStop(1, night ? "#0c0d10" : "#121216");
    ctx.fillStyle = wg; ctx.fillRect(-400, -400, 2720, 1880);
    ctx.fillStyle = "#0d0d10"; ctx.fillRect(-400, FL, 2720, 900);
    skLine(ctx, [[-300, FL], [2220, FL]], { seed: 601, w: 3 });
    // wallpaper stripes, faint
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.025)"; ctx.lineWidth = 18;
    for (let x = -300; x < 2200; x += 70) { ctx.beginPath(); ctx.moveTo(x, -300); ctx.lineTo(x, FL); ctx.stroke(); }
    ctx.restore();
    // window with morning light
    Pr.moonWindow(ctx, 380, 230, 330, 300, { seed: 9, moon: !!night, sky: night ? "#151b2a" : "#56607a" });
    if (!night) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(540, 230, 760, 830);
      g.addColorStop(0, "rgba(210,220,255,0.14)"); g.addColorStop(1, "rgba(210,220,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(390, 240); ctx.lineTo(700, 240); ctx.lineTo(1000, 830); ctx.lineTo(560, 830); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for (const sd of [-1, 1]) {
      const cx = sd < 0 ? 350 : 740;
      skShape(ctx, [[cx - 20, 200], [cx + 20, 200], [cx + 26, 560], [cx - 26, 570]], "#3a2c33", { seed: 602 + sd });
    }
    skLine(ctx, [[300, 200], [790, 200]], { seed: 604, w: 4 });
    // plant
    skShape(ctx, [[190, 830], [270, 830], [282, 740], [178, 740]], "#5a4038", { seed: 610 });
    for (let i = 0; i < 6; i++) skLine(ctx, [[230, 740], [160 + i * 28, 600 + (i % 2) * 40]], { seed: 611 + i, color: "#6f8f6a", w: 4 });
    // wedding photo
    weddingPhoto(ctx, 1110, 300, 150, 120, o.photoFade || 0);
    // shelf + books
    skLine(ctx, [[1380, 470], [1680, 470]], { seed: 620, w: 4 });
    skLine(ctx, [[1380, 640], [1680, 640]], { seed: 621, w: 4 });
    const cols = ["#5a3d3d", "#3d4a5a", "#4a5a3d", "#5a523d", "#3d3d5a"];
    for (let i = 0; i < 8; i++) skRect(ctx, 1395 + i * 30, 470 - 70 - (i % 3) * 10, 24, 70 + (i % 3) * 10, cols[i % 5], { seed: 622 + i });
    for (let i = 0; i < 5; i++) skRect(ctx, 1420 + i * 34, 640 - 62, 28, 62, cols[(i + 2) % 5], { seed: 632 + i });
    // door
    skRect(ctx, 1750, 380, 180, 450, "#121318", { seed: 640 });
    circle(ctx, 1778, 610, 6); ctx.fillStyle = PAL.line; ctx.fill();
    // floor lamp near chair
    skLine(ctx, [[1010, 830], [1010, 470]], { seed: 650, w: 3 });
    skShape(ctx, [[960, 470], [1060, 470], [1040, 410], [980, 410]], "#3a3230", { seed: 651 });
    if (o.lamp) {
      ctx.save();
      const g = ctx.createRadialGradient(1010, 480, 10, 1010, 640, 420);
      g.addColorStop(0, `rgba(255,214,150,${0.3 * o.lamp})`); g.addColorStop(1, "rgba(255,214,150,0)");
      ctx.fillStyle = g; ctx.fillRect(500, 300, 1000, 640); ctx.restore();
    }
  }
  function armchair(ctx, x, layer) {
    const c = "#5a3940";
    if (layer === "back") {
      skRR(ctx, x - 120, 500, 240, 230, 40, c, { seed: 660 });
      skRR(ctx, x - 125, 690, 250, 60, 14, "#4d3036", { seed: 661 });
      skLine(ctx, [[x - 100, 750], [x - 104, 830]], { seed: 662, w: 4 });
      skLine(ctx, [[x + 100, 750], [x + 104, 830]], { seed: 663, w: 4 });
    } else {
      skRR(ctx, x - 150, 620, 50, 130, 20, "#64414a", { seed: 664 });
      skRR(ctx, x + 100, 620, 50, 130, 20, "#64414a", { seed: 665 });
    }
  }
  function sideTable(ctx, x, o = {}) {
    skRR(ctx, x - 60, 680, 120, 16, 6, "#3a3028", { seed: 670 });
    skLine(ctx, [[x, 696], [x, 830]], { seed: 671, w: 4 });
    skLine(ctx, [[x - 40, 830], [x + 40, 830]], { seed: 672, w: 4 });
    if (o.book) skRect(ctx, x - 44, 664, 70, 16, "#7b2f2e", { seed: 673, color: "#c7a28d" });
    if (o.cup) teacup(ctx, x + 30, 680, o.steam ?? 1);
  }
  function teacup(ctx, x, y, st = 1) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - 18, y - 30); ctx.lineTo(x + 18, y - 30); ctx.quadraticCurveTo(x + 16, y, x, y); ctx.quadraticCurveTo(x - 16, y, x - 18, y - 30);
    fillOutline(ctx, "#ece5d6", 1, 2.6);
    ctx.beginPath(); ctx.arc(x + 20, y - 18, 8, -1.2, 1.2); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    if (st) Pr.steam(ctx, x, y - 36, st, 2, 60);
  }
  // little doodle wedding photo (bride with veil, groom); fade covers it with grey mist
  function weddingPhoto(ctx, x, y, w, h, fade = 0) {
    skRect(ctx, x, y, w, h, "#d9d2c2", { seed: 680, color: "#a39a86", w: 4 });
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 9, y + 9, w - 18, h - 18); ctx.clip();
    ctx.fillStyle = "#b7a68a"; ctx.fillRect(x + 9, y + 9, w - 18, h - 18);
    const sc = (w - 18) / 110;
    ctx.translate(x + 9, y + 9); ctx.scale(sc, sc);
    // groom
    circle(ctx, 38, 34, 15); fillOutline(ctx, PAL.cream, 0.5);
    ctx.beginPath(); ctx.moveTo(24, 24); ctx.lineTo(30, 16); ctx.lineTo(46, 16); ctx.lineTo(52, 26); ctx.closePath(); ctx.fillStyle = "#2b2624"; ctx.fill();
    ctx.beginPath(); ctx.roundRect(22, 50, 32, 40, 8); fillOutline(ctx, "#2a2c33", 0.5);
    // bride with veil
    ctx.beginPath(); ctx.moveTo(58, 24); ctx.quadraticCurveTo(92, 10, 98, 90); ctx.lineTo(58, 90); ctx.closePath(); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fill();
    circle(ctx, 72, 36, 14); fillOutline(ctx, PAL.cream, 0.5);
    ctx.beginPath(); ctx.roundRect(58, 52, 30, 38, 8); fillOutline(ctx, "#f4f1ea", 0.5);
    ctx.fillStyle = PAL.ink;
    for (const [ex, ey] of [[33, 34], [43, 34], [67, 36], [77, 36]]) { circle(ctx, ex, ey, 1.6); ctx.fill(); }
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(38, 38, 5, 0.3, 2.8); ctx.stroke(); ctx.beginPath(); ctx.arc(72, 40, 5, 0.3, 2.8); ctx.stroke();
    ctx.strokeStyle = RED; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(52, 70); ctx.quadraticCurveTo(56, 80, 60, 70); ctx.stroke();
    ctx.restore();
    if (fade > 0) {
      ctx.save(); ctx.globalAlpha = fade;
      ctx.fillStyle = "#9aa1ae"; ctx.fillRect(x + 9, y + 9, w - 18, h - 18);
      ctx.restore();
    }
  }

  // ---------- HALLWAY at night (the bad day)
  function hallway(ctx, o = {}) {
    const FL = 830;
    ctx.fillStyle = "#0e0f13"; ctx.fillRect(-400, -400, 2720, 1880);
    ctx.fillStyle = "#0a0a0c"; ctx.fillRect(-400, FL, 2720, 900);
    skLine(ctx, [[-300, FL], [2220, FL]], { seed: 701, w: 3 });
    skRect(ctx, 820, 360, 220, 470, "#15161b", { seed: 702 });
    circle(ctx, 1010, 600, 7); ctx.fillStyle = PAL.line; ctx.fill();
    // light under the door
    const lk = o.doorLight ?? 1;
    ctx.save(); ctx.fillStyle = `rgba(255,214,150,${0.8 * lk})`; ctx.shadowColor = "#ffd27a"; ctx.shadowBlur = 20; ctx.fillRect(826, 824, 208, 5);
    const g = ctx.createRadialGradient(930, 830, 4, 930, 830, 260);
    g.addColorStop(0, `rgba(255,214,150,${0.25 * lk})`); g.addColorStop(1, "rgba(255,214,150,0)");
    ctx.fillStyle = g; ctx.fillRect(600, 700, 660, 260); ctx.restore();
    // frames on the wall
    weddingPhoto(ctx, 1180, 420, 110, 90, o.photoFade ?? 0.7);
    skRect(ctx, 560, 440, 90, 110, "#1a1b20", { seed: 703 });
  }

  // ---------- SKETCHBOOK close-up
  // pencil portrait of Leo at an age (young|mid|old|shaky), revealed by k in 0..1
  function portraitStrokes(age) {
    const S = [];
    const ell = (cx, cy, rx, ry, n = 36, a0 = 0, a1 = Math.PI * 2) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; };
    S.push(ell(0, 0, 100, 94));
    // shoulders
    S.push([[-170, 230], [-150, 150], [-90, 110], [-40, 100]]); S.push([[40, 100], [90, 110], [150, 150], [170, 230]]);
    if (age === "young") S.push([[-100, -20], [-96, -70], [-60, -110], [-30, -96], [0, -128], [30, -98], [60, -116], [90, -78], [102, -24]]);
    if (age === "mid") S.push([[-100, -30], [-80, -86], [-20, -104], [40, -100], [90, -70], [100, -26]]);
    if (age === "old" || age === "shaky") { S.push([[-98, -40], [-112, -10], [-104, 20]]); S.push([[98, -40], [112, -10], [104, 20]]); }
    // eyes
    S.push(ell(-34, -4, 9, 12, 12)); S.push(ell(34, -4, 9, 12, 12));
    if (age !== "young") { S.push(ell(-34, -4, 26, 26, 24)); S.push(ell(34, -4, 26, 26, 24)); S.push([[-8, -4], [8, -4]]); }
    if (age === "old" || age === "shaky") S.push([[-40, 38], [-20, 30], [0, 36], [20, 30], [40, 38], [20, 44], [0, 40], [-20, 44], [-40, 38]]);
    S.push(ell(0, 46, 26, 16, 16, 0.2, Math.PI - 0.2));
    return S;
  }
  function pencilPortrait(ctx, cx, cy, sc, age, k = 1, o = {}) {
    const S = portraitStrokes(age);
    const lens = S.map((p) => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0));
    const total = lens.reduce((a, b) => a + b, 0);
    let budget = total * clamp(k, 0, 1);
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(sc, sc);
    ctx.strokeStyle = o.color || "rgba(60,58,66,0.9)"; ctx.lineWidth = (o.w || 3.2); ctx.lineCap = "round"; ctx.lineJoin = "round";
    const shake = age === "shaky" ? 3.5 : 1.1;
    let tip = null;
    S.forEach((p, si) => {
      if (budget <= 0) return;
      ctx.beginPath();
      let used = 0;
      for (let i = 0; i < p.length; i++) {
        const q = [p[i][0] + hash(i, si, 7) * shake, p[i][1] + hash(i, si, 9) * shake];
        if (i === 0) { ctx.moveTo(q[0], q[1]); continue; }
        const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        if (used + d > budget) {
          const f = (budget - used) / d;
          const pq = [lerp(p[i - 1][0], q[0], f), lerp(p[i - 1][1], q[1], f)];
          ctx.lineTo(pq[0], pq[1]); tip = pq; used = budget; break;
        }
        ctx.lineTo(q[0], q[1]); used += d; tip = q;
      }
      ctx.stroke();
      budget -= lens[si];
    });
    ctx.restore();
    return tip ? [cx + tip[0] * sc, cy + tip[1] * sc] : null;
  }
  // open sketchbook spread centered at (cx, cy)
  function sketchbook(ctx, cx, cy, sc, o = {}) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.rotate(o.rot || 0);
    const PW = 520, PH = 660;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
    ctx.fillStyle = "#4a2626"; ctx.beginPath(); ctx.roundRect(-PW - 24, -PH / 2 - 20, PW * 2 + 48, PH + 40, 18); ctx.fill(); ctx.restore();
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(sd < 0 ? -PW : 0, -PH / 2, PW, PH, 8);
      ctx.fillStyle = "#efe7d6"; ctx.fill();
      const g = ctx.createLinearGradient(0, 0, sd * 80, 0);
      g.addColorStop(0, "rgba(0,0,0,0.18)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(sd < 0 ? -80 : 0, -PH / 2, 80, PH);
    }
    // spiral
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(0, -PH / 2 + 30 + i * 46, 14, 8, 0, 0, Math.PI * 2); ctx.strokeStyle = "#8a8a90"; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.restore();
  }
  function pageText(ctx, s, x, y, size, color, rot = -0.03, k = 1) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.font = `600 ${size}px ${F.FONT.hand}`; ctx.fillStyle = color || "rgba(60,58,66,0.9)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(s.slice(0, Math.ceil(s.length * clamp(k, 0, 1))), 0, 0);
    ctx.restore();
  }
  // a hand holding a pencil, tip at (x, y)
  function pencilHand(ctx, x, y, o = {}) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(o.rot ?? -0.5); ctx.scale(o.s || 1, o.s || 1);
    ctx.lineCap = "round";
    // sleeve trailing away from the tip, then pencil, then the hand on top
    ctx.beginPath(); ctx.moveTo(-50, -150); ctx.lineTo(60, -150); ctx.lineTo(110, -460); ctx.lineTo(-90, -460); ctx.closePath(); fillOutline(ctx, o.sleeve || "#8f7aa6", 1.4);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -190); ctx.stroke();
    ctx.strokeStyle = "#e6b84a"; ctx.lineWidth = 12; ctx.stroke();
    ctx.fillStyle = "#e9d6b4"; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(6, -22); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#333"; ctx.beginPath(); ctx.moveTo(-2.5, -8); ctx.lineTo(2.5, -8); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, -110, 48, 54, 0.1, 0, Math.PI * 2); fillOutline(ctx, PAL.cream, 1.4);
    ctx.beginPath(); ctx.ellipse(-26, -72, 18, 14, 0.4, 0, Math.PI * 2); fillOutline(ctx, PAL.cream, 1.4);
    ctx.restore();
  }

  window.S2 = { RED, thread, drawForget, fog, petals, park, bench, livingRoom, armchair, sideTable, teacup, weddingPhoto, hallway, pencilPortrait, sketchbook, pageText, pencilHand, SEASON };
})();
