// LITTLE BEAN. — notes, lunchbox, school, street and car, shoebox and drawer.
(function () {
  const { PAL, G, skLine, skRect, skRR, skEll, skShape, clamp, lerp, hash, noise1, mulberry, E } = F;
  const { circle, fillOutline } = C;
  const YEL = "#ffd54a";

  // ---------- a handwritten note (napkin or sticky). lines revealed by k (0..1)
  function note(ctx, x, y, w, h, rot, lines, o = {}) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.fillStyle = o.paper === "sticky" ? YEL : "#f3eee2";
    ctx.beginPath();
    if (o.paper === "sticky") ctx.rect(-w / 2, -h / 2, w, h);
    else { // napkin: soft scalloped edge
      const n = 18;
      ctx.moveTo(-w / 2, -h / 2);
      for (let i = 0; i <= n; i++) ctx.lineTo(-w / 2 + (w * i) / n, -h / 2 + (i % 2 ? 3 : -2));
      for (let i = 0; i <= n; i++) ctx.lineTo(w / 2 + (i % 2 ? 3 : -2), -h / 2 + (h * i) / n);
      for (let i = 0; i <= n; i++) ctx.lineTo(w / 2 - (w * i) / n, h / 2 + (i % 2 ? 3 : -2));
      for (let i = 0; i <= n; i++) ctx.lineTo(-w / 2 + (i % 2 ? 3 : -2), h / 2 - (h * i) / n);
    }
    ctx.fill(); ctx.restore();
    if (o.crumpled) {
      ctx.save(); ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 2;
      const r = mulberry(o.crumpled);
      for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo((r() - 0.5) * w, (r() - 0.5) * h); ctx.lineTo((r() - 0.5) * w, (r() - 0.5) * h); ctx.stroke(); }
      ctx.restore();
    }
    if (o.paper !== "sticky") {
      // napkin fold lines
      ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
    }
    // text
    const k = o.k ?? 1;
    const total = lines.reduce((s, l) => s + l.length, 0);
    let budget = Math.floor(total * clamp(k, 0, 1));
    const size = o.size || Math.round(h / (lines.length + 1.6));
    ctx.font = `600 ${size}px ${F.FONT.hand}`;
    ctx.fillStyle = o.ink || "#2b3a6b"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const y0 = -((lines.length - 1) * size * 1.05) / 2 - (o.doodle ? size * 0.4 : 0);
    let tipX = 0, tipY = y0;
    lines.forEach((l, i) => {
      if (budget <= 0) return;
      const s = l.slice(0, budget); budget -= l.length;
      ctx.fillText(s, 0, y0 + i * size * 1.05);
      const full = ctx.measureText(l).width, part = ctx.measureText(s).width;
      tipX = -full / 2 + part; tipY = y0 + i * size * 1.05;
    });
    if (o.doodle && k >= 1) doodle(ctx, o.doodle, w * 0.32, h * 0.3, size);
    if (o.heart !== false && k >= 1 && !o.doodle) heart(ctx, w * 0.36, h * 0.32, size * 0.32, "#e2403f");
    ctx.restore();
    // pen tip position in screen space for a hand to follow
    const c = Math.cos(rot || 0), sn = Math.sin(rot || 0);
    return [x + tipX * c - tipY * sn, y + tipX * sn + tipY * c];
  }
  function heart(ctx, x, y, r, col) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, r * 0.9);
    ctx.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.6, -r * 1.3, 0, -r * 0.4);
    ctx.bezierCurveTo(r * 0.6, -r * 1.3, r * 1.6, -r * 0.2, 0, r * 0.9); ctx.fill();
    ctx.restore();
  }
  // tiny ink doodles: a little bean with pigtails, or an old bean with a cap
  function doodle(ctx, kind, x, y, size) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = "#2b3a6b"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    const r = size * 0.55;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.95, 0, 0, Math.PI * 2); ctx.stroke();
    if (kind === "bean") { for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * r * 1.15, -r * 0.1, r * 0.28, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke(); } }
    if (kind === "dad") { ctx.beginPath(); ctx.moveTo(-r, -r * 0.4); ctx.quadraticCurveTo(0, -r * 1.5, r, -r * 0.4); ctx.lineTo(r * 1.5, -r * 0.35); ctx.stroke(); }
    ctx.fillStyle = "#2b3a6b";
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * r * 0.35, -r * 0.05, 2.6, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.32, 0.3, Math.PI - 0.3); ctx.stroke();
    heart(ctx, r * 1.7, -r * 0.6, size * 0.22, "#e2403f");
    ctx.restore();
  }

  // ---------- lunchbox (side view in scenes)
  function lunchbox(ctx, x, y, s, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const col = o.color || "#d9534f";
    if (o.open) {
      ctx.save(); ctx.translate(-60, -60); ctx.rotate(-0.9 * o.open);
      ctx.beginPath(); ctx.roundRect(0, -14, 120, 18, 6); fillOutline(ctx, col, 1);
      ctx.restore();
    }
    ctx.beginPath(); ctx.roundRect(-60, -60, 120, 60, 10); fillOutline(ctx, col, 1);
    if (!o.open) { ctx.beginPath(); ctx.roundRect(-62, -66, 124, 14, 6); fillOutline(ctx, col, 1); }
    ctx.beginPath(); ctx.arc(0, o.open ? -60 : -66, 18, Math.PI, 0); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 5; ctx.stroke();
    if (o.note) { ctx.save(); ctx.translate(18, -66); ctx.rotate(0.2); ctx.fillStyle = "#f3eee2"; ctx.fillRect(-16, -16, 36, 26); ctx.restore(); }
    ctx.restore();
  }

  // ---------- school cafeteria
  function cafeteria(ctx, o = {}) {
    const FL = 830;
    ctx.fillStyle = "#1b1f26"; ctx.fillRect(-400, -400, 2720, 1880);
    const g = ctx.createRadialGradient(960, 300, 100, 960, 400, 1200);
    g.addColorStop(0, "#2f3a44"); g.addColorStop(1, "#151820");
    ctx.fillStyle = g; ctx.fillRect(-400, -400, 2720, FL + 400);
    ctx.fillStyle = "#11141a"; ctx.fillRect(-400, FL, 2720, 900);
    skLine(ctx, [[-300, FL], [2220, FL]], { seed: 801, w: 3 });
    for (let i = 0; i < 4; i++) Pr.moonWindow(ctx, 160 + i * 440, 200, 300, 230, { seed: 40 + i, day: true });
    // long table
    skRect(ctx, 300, 690, 1320, 26, "#3a4048", { seed: 802 });
    for (const x of [360, 1560]) skLine(ctx, [[x, 716], [x, FL]], { seed: 803 + x, w: 4 });
    skRect(ctx, 260, 760, 1400, 16, "#30353c", { seed: 805 });
    // a poster
    skRect(ctx, 1720, 260, 150, 200, "#4a5a6a", { seed: 806 });
  }
  function lockers(ctx, o = {}) {
    const FL = 830;
    ctx.fillStyle = "#14171c"; ctx.fillRect(-400, -400, 2720, 1880);
    const g = ctx.createRadialGradient(960, 360, 80, 960, 400, 1100);
    g.addColorStop(0, "#26303a"); g.addColorStop(1, "#11141a");
    ctx.fillStyle = g; ctx.fillRect(-400, -400, 2720, FL + 400);
    ctx.fillStyle = "#0e1014"; ctx.fillRect(-400, FL, 2720, 900);
    for (let i = 0; i < 16; i++) {
      const x = -100 + i * 140;
      skRect(ctx, x, 300, 130, 530, "#2d4a5e", { seed: 820 + i, color: "#7d93a6" });
      for (let k = 0; k < 4; k++) skLine(ctx, [[x + 40, 330 + k * 12], [x + 90, 330 + k * 12]], { seed: 840 + i * 4 + k, color: "#7d93a6", w: 2 });
      circle(ctx, x + 110, 560, 5); ctx.fillStyle = "#9db0c2"; ctx.fill();
    }
    skLine(ctx, [[-300, FL], [2220, FL]], { seed: 860, w: 3 });
  }
  function trashcan(ctx, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    skShape(ctx, [[-50, -140], [50, -140], [40, 0], [-40, 0]], "#3a3f45", { seed: 870 });
    skLine(ctx, [[-56, -140], [56, -140]], { seed: 871, w: 5 });
    ctx.restore();
  }

  // ---------- the street in front of the house, dawn
  function street(ctx, o = {}) {
    const FL = 830;
    const sky = ctx.createLinearGradient(0, -200, 0, FL);
    sky.addColorStop(0, "#2a2f4a"); sky.addColorStop(0.6, "#8a6a7a"); sky.addColorStop(1, "#e8a77a");
    ctx.fillStyle = sky; ctx.fillRect(-400, -400, 2720, FL + 400);
    // house
    skShape(ctx, [[180, FL], [180, 430], [470, 260], [760, 430], [760, FL]], "#2a2830", { seed: 880 });
    skRect(ctx, 400, 600, 120, 230, "#1a181e", { seed: 881 });
    Pr.moonWindow(ctx, 230, 480, 130, 110, { seed: 50, sky: "#ffd27a", moon: false });
    Pr.moonWindow(ctx, 580, 480, 130, 110, { seed: 51, sky: "#3a3440", moon: false });
    // trees & road
    ctx.fillStyle = "#1a1a20"; ctx.fillRect(-400, FL, 2720, 700);
    skLine(ctx, [[-300, FL], [2220, FL]], { seed: 882, w: 3 });
    for (let x = -200; x < 2200; x += 160) { ctx.fillStyle = "rgba(255,230,180,0.5)"; ctx.fillRect(x, FL + 70, 80, 6); }
    const r = mulberry(5);
    for (let i = 0; i < 5; i++) {
      const x = 1000 + i * 260;
      skLine(ctx, [[x, FL], [x, 560]], { seed: 890 + i, w: 6 });
      ctx.beginPath(); ctx.ellipse(x, 500, 90 + r() * 30, 110, 0, 0, 7); ctx.fillStyle = "#2c3a34"; ctx.fill(); ctx.strokeStyle = PAL.line; ctx.lineWidth = 2.6; ctx.stroke();
    }
  }
  function car(ctx, x, y, s = 1, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const col = o.color || "#5a7a9a";
    ctx.beginPath(); ctx.moveTo(-230, -40); ctx.lineTo(-210, -110); ctx.lineTo(-120, -120); ctx.lineTo(-60, -190); ctx.lineTo(120, -190); ctx.lineTo(190, -120); ctx.lineTo(240, -110); ctx.lineTo(250, -40); ctx.closePath();
    fillOutline(ctx, col, 1.4);
    ctx.beginPath(); ctx.moveTo(-50, -178); ctx.lineTo(40, -178); ctx.lineTo(40, -128); ctx.lineTo(-100, -128); ctx.closePath(); ctx.fillStyle = "#cfe0ee"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(55, -178); ctx.lineTo(115, -178); ctx.lineTo(165, -128); ctx.lineTo(55, -128); ctx.closePath(); ctx.fillStyle = "#cfe0ee"; ctx.fill();
    // boxes on the back seat / roof
    if (o.boxes) { for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.rect(-40 + i * 70, -240 + (i ? 10 : 0), 64, 52); fillOutline(ctx, "#b48a5a", 1.2); } }
    for (const wx of [-140, 160]) { circle(ctx, wx, -36, 40); fillOutline(ctx, "#1a1a1e", 1.4); circle(ctx, wx, -36, 16); ctx.fillStyle = "#8a8a90"; ctx.fill(); }
    if (o.lights) { ctx.save(); ctx.fillStyle = "#ff5a4a"; ctx.shadowColor = "#ff5a4a"; ctx.shadowBlur = 20; ctx.fillRect(-236, -96, 14, 22); ctx.restore(); }
    ctx.restore();
  }

  // ---------- shoebox full of notes (close-up)
  function shoebox(ctx, cx, cy, s, o = {}) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
    ctx.fillStyle = "#c9a37a"; ctx.fillRect(-420, -260, 840, 520); ctx.restore();
    ctx.fillStyle = "#a9835a"; ctx.fillRect(-400, -240, 800, 480);
    // a heap of folded notes
    const r = mulberry(77);
    for (let i = 0; i < (o.count || 70); i++) {
      const x = (r() - 0.5) * 720, y = (r() - 0.5) * 400, rot = (r() - 0.5) * 1.2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = r() > 0.3 ? "#f3eee2" : YEL; ctx.fillRect(-60, -42, 120, 84);
      ctx.strokeStyle = "rgba(43,58,107,0.5)"; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-44, -20 + k * 18); ctx.lineTo(-44 + 60 + r() * 30, -20 + k * 18); ctx.stroke(); }
      if (r() > 0.6) heart(ctx, 38, 26, 7, "#e2403f");
      ctx.restore();
    }
    ctx.restore();
  }
  // kitchen drawer seen from above, notes piling up
  function drawer(ctx, cx, cy, s, n) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.fillStyle = "#3a2c24"; ctx.fillRect(-520, -300, 1040, 600);
    ctx.fillStyle = "#2a1f19"; ctx.fillRect(-490, -270, 980, 540);
    const r = mulberry(91);
    for (let i = 0; i < n; i++) {
      const x = (r() - 0.5) * 820, y = (r() - 0.5) * 420, rot = (r() - 0.5) * 1.0;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = "#f3eee2"; ctx.fillRect(-70, -48, 140, 96);
      ctx.strokeStyle = "rgba(43,58,107,0.55)"; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-50, -22 + k * 20); ctx.lineTo(-50 + 70 + r() * 30, -22 + k * 20); ctx.stroke(); }
      heart(ctx, 46, 30, 8, "#e2403f");
      ctx.restore();
    }
    ctx.restore();
  }
  function jar(ctx, x, y, fill) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x - 40, y - 110, 80, 110, 14); ctx.fillStyle = "rgba(200,220,235,0.18)"; ctx.fill(); ctx.strokeStyle = PAL.line; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#c9a640"; ctx.fillRect(x - 34, y - 6 - 90 * fill, 68, 90 * fill);
    ctx.fillStyle = "#e9e1cf"; ctx.fillRect(x - 30, y - 80, 60, 26);
    ctx.font = `600 18px ${F.FONT.hand}`; ctx.fillStyle = "#2b3a6b"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("LILY", x, y - 67);
    ctx.restore();
  }

  window.S3 = { YEL, note, heart, doodle, lunchbox, cafeteria, lockers, trashcan, street, car, shoebox, drawer, jar };
})();
