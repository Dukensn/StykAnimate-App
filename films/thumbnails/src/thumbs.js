// Thumbnail renderer: extreme close-ups, big expressive faces, dramatic light, one story object, 2-word titles.
(function () {
  const OUT = "#121212";
  const TAU = Math.PI * 2;
  const C = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };
  const lg = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rg = (ctx, x, y, r0, r1, st, x1, y1) => { const g = ctx.createRadialGradient(x, y, r0, x1 ?? x, y1 ?? y, r1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  function glow(ctx, x, y, r, col) { ctx.fillStyle = rg(ctx, x, y, 0, r, [[0, col], [1, "rgba(0,0,0,0)"]]); ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function stroke(ctx, w, col = OUT) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); }

  // ---------- big shaded head
  // o: {kind, eyes:'wide'|'teary'|'blank'|'closed'|'happy', look:[x,y], brow, mouth, tears, sweat, blush, key:{x,y,col,amt}, rim:{col, side:-1|1}, tilt}
  function hero(ctx, x, y, R, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.tilt || 0);
    const kind = o.kind || "theo";
    const headPath = () => { ctx.beginPath(); ctx.ellipse(0, 0, R * 1.04, R * 0.98, 0, 0, TAU); };
    // back hair
    if (kind === "mae") {
      ctx.beginPath(); ctx.moveTo(-R * 1.1, -R * 0.1); ctx.bezierCurveTo(-R * 1.2, -R * 1.25, R * 1.2, -R * 1.25, R * 1.1, -R * 0.1);
      ctx.bezierCurveTo(R * 1.25, R * 0.7, R * 1.0, R * 1.3, R * 0.6, R * 1.25); ctx.lineTo(-R * 0.6, R * 1.25); ctx.bezierCurveTo(-R * 1.0, R * 1.3, -R * 1.25, R * 0.7, -R * 1.1, -R * 0.1);
      ctx.fillStyle = lg(ctx, 0, -R, 0, R, [[0, "#f4f2ec"], [1, "#c9c6be"]]); ctx.fill(); stroke(ctx, R * 0.03);
    }
    // base + shading
    headPath(); ctx.fillStyle = "#ece4d0"; ctx.fill();
    ctx.save(); headPath(); ctx.clip();
    ctx.fillStyle = rg(ctx, -R * 0.35, -R * 0.45, R * 0.1, R * 1.5, [[0, "rgba(255,255,250,0.55)"], [0.5, "rgba(255,255,255,0)"], [1, "rgba(70,55,45,0.45)"]]); ctx.fillRect(-R * 2, -R * 2, R * 4, R * 4);
    if (o.key) { const k = o.key; ctx.globalCompositeOperation = "screen"; ctx.fillStyle = rg(ctx, k.x * R, k.y * R, 0, R * 1.6, [[0, k.col], [1, "rgba(0,0,0,0)"]]); ctx.fillRect(-R * 2, -R * 2, R * 4, R * 4); ctx.globalCompositeOperation = "source-over"; }
    if (o.dark) { ctx.fillStyle = `rgba(20,20,35,${o.dark})`; ctx.fillRect(-R * 2, -R * 2, R * 4, R * 4); }
    ctx.restore();
    if (o.rim) {
      ctx.save(); headPath(); ctx.clip();
      ctx.shadowColor = o.rim.col; ctx.shadowBlur = R * 0.25;
      ctx.beginPath(); ctx.ellipse(0, 0, R * 1.04, R * 0.98, 0, o.rim.side > 0 ? -1.2 : Math.PI - 0.6, o.rim.side > 0 ? 0.9 : Math.PI + 1.6);
      ctx.lineWidth = R * 0.07; ctx.strokeStyle = o.rim.col; ctx.stroke(); ctx.restore();
    }
    headPath(); stroke(ctx, R * 0.035);
    // hair front
    if (kind === "mae") {
      ctx.beginPath(); ctx.moveTo(-R * 1.05, -R * 0.05); ctx.bezierCurveTo(-R * 0.95, -R * 1.1, R * 0.9, -R * 1.15, R * 1.05, -R * 0.05);
      ctx.bezierCurveTo(R * 0.7, -R * 0.62, R * 0.15, -R * 0.68, -R * 0.05, -R * 0.5); ctx.bezierCurveTo(-R * 0.35, -R * 0.66, -R * 0.85, -R * 0.55, -R * 1.05, -R * 0.05);
      ctx.fillStyle = lg(ctx, 0, -R, 0, -R * 0.3, [[0, "#ffffff"], [1, "#d8d5ce"]]); ctx.fill(); stroke(ctx, R * 0.03);
      ctx.save(); ctx.translate(R * 0.72, -R * 0.75); ctx.rotate(0.45);
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd * R * 0.32, -R * 0.17); ctx.lineTo(sd * R * 0.32, R * 0.17); ctx.closePath(); ctx.fillStyle = "#e2403f"; ctx.fill(); stroke(ctx, R * 0.025); }
      C(ctx, 0, 0, R * 0.08); ctx.fillStyle = "#b8302f"; ctx.fill(); stroke(ctx, R * 0.02); ctx.restore();
    }
    if (kind === "leo") {
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * R * 1.0, -R * 0.45); ctx.bezierCurveTo(sd * R * 1.3, -R * 0.4, sd * R * 1.25, R * 0.2, sd * R * 1.0, R * 0.2); ctx.closePath(); ctx.fillStyle = "#e8e8e4"; ctx.fill(); stroke(ctx, R * 0.025); }
      ctx.strokeStyle = "#e8e8e4"; ctx.lineWidth = R * 0.03; for (const dx of [-0.2, 0, 0.2]) { ctx.beginPath(); ctx.moveTo(R * dx, -R * 0.97); ctx.quadraticCurveTo(R * (dx + 0.12), -R * 1.18, R * (dx + 0.28), -R * 1.06); ctx.stroke(); }
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(-R * 0.35, -R * 0.7, R * 0.25, R * 0.1, -0.4, 0, TAU); ctx.fill();
    }
    if (kind === "dad") {
      ctx.beginPath(); ctx.moveTo(-R * 1.02, -R * 0.2);
      const sp = [[-R * 1.05, -R * 0.8], [-R * 0.7, -R * 0.95], [-R * 0.55, -R * 1.22], [-R * 0.2, -R * 1.02], [R * 0.05, -R * 1.26], [R * 0.32, -R * 1.02], [R * 0.6, -R * 1.18], [R * 0.78, -R * 0.9], [R * 1.07, -R * 0.75]];
      sp.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(R * 1.02, -R * 0.25); ctx.bezierCurveTo(R * 0.6, -R * 0.62, -R * 0.5, -R * 0.66, -R * 1.02, -R * 0.2);
      ctx.fillStyle = lg(ctx, 0, -R * 1.2, 0, -R * 0.4, [[0, "#8a8784"], [1, "#5e5b58"]]); ctx.fill(); stroke(ctx, R * 0.03);
      ctx.fillStyle = "rgba(60,50,45,0.35)"; for (let i = 0; i < 70; i++) { const a = Math.PI * (0.15 + 0.7 * ((i * 37) % 70) / 70), d = R * (0.6 + ((i * 13) % 10) / 30); C(ctx, Math.cos(a) * d, Math.sin(a) * d * 0.95, R * 0.012); ctx.fill(); }
    }
    // eyes
    const look = o.look || [0, 0];
    const ex = R * 0.36, ey = R * 0.02;
    for (const sd of [-1, 1]) {
      const cx = sd * ex + look[0] * R * 0.05, cy = ey;
      if (o.eyes === "closed" || o.eyes === "happy") {
        ctx.beginPath(); ctx.arc(cx, cy + (o.eyes === "happy" ? R * 0.06 : 0), R * 0.14, o.eyes === "happy" ? Math.PI * 1.15 : Math.PI * 0.15, o.eyes === "happy" ? Math.PI * 1.85 : Math.PI * 0.85);
        stroke(ctx, R * 0.045); continue;
      }
      const rx = R * 0.2, ry = R * 0.23;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = "rgba(160,170,190,0.25)"; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 0.4);
      const blank = o.eyes === "blank";
      const pr = blank ? R * 0.07 : o.eyes === "teary" ? R * 0.12 : R * 0.08;
      const px = cx + look[0] * rx * 0.45, py = cy + look[1] * ry * 0.4;
      C(ctx, px, py, pr); ctx.fillStyle = blank ? "#5a5f6a" : "#141414"; ctx.fill();
      if (!blank) { C(ctx, px - pr * 0.35, py - pr * 0.4, pr * 0.38); ctx.fillStyle = "#fff"; ctx.fill(); C(ctx, px + pr * 0.35, py + pr * 0.35, pr * 0.16); ctx.fill(); }
      if (o.eyes === "teary") { ctx.fillStyle = "rgba(120,180,255,0.45)"; ctx.fillRect(cx - rx, cy + ry * 0.35, rx * 2, ry); ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = R * 0.015; ctx.beginPath(); ctx.moveTo(cx - rx * 0.7, cy + ry * 0.4); ctx.quadraticCurveTo(cx, cy + ry * 0.3, cx + rx * 0.7, cy + ry * 0.4); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); stroke(ctx, R * 0.035);
      // brow
      if (o.brow != null) {
        const by = cy - ry - R * 0.1, b = o.brow, inner = -sd;
        ctx.beginPath(); ctx.moveTo(cx + inner * R * 0.05, by - b * R * 0.11); ctx.quadraticCurveTo(cx - inner * R * 0.05, by - R * 0.04, cx - inner * R * 0.2, by + b * R * 0.06);
        stroke(ctx, R * 0.06);
      }
    }
    if (kind === "leo") {
      for (const sd of [-1, 1]) { const cx = sd * ex + look[0] * R * 0.05; C(ctx, cx, ey, R * 0.29); ctx.lineWidth = R * 0.035; ctx.strokeStyle = "#3a3a40"; ctx.stroke(); ctx.save(); C(ctx, cx, ey, R * 0.27); ctx.clip(); ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.moveTo(cx - R * 0.3, ey - R * 0.1); ctx.lineTo(cx - R * 0.05, ey - R * 0.35); ctx.lineTo(cx + R * 0.05, ey - R * 0.3); ctx.lineTo(cx - R * 0.22, ey); ctx.fill(); ctx.restore(); }
      ctx.beginPath(); ctx.moveTo(-ex + R * 0.29, ey); ctx.lineTo(ex - R * 0.29, ey); ctx.lineWidth = R * 0.03; ctx.strokeStyle = "#3a3a40"; ctx.stroke();
    }
    if (o.blush) { ctx.save(); ctx.globalAlpha = 0.4 * o.blush; ctx.fillStyle = "#ff7d7d"; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * R * 0.6, R * 0.35, R * 0.16, R * 0.09, 0, 0, TAU); ctx.fill(); } ctx.restore(); }
    // mouth
    const my = R * 0.52;
    if (kind === "leo") { ctx.beginPath(); ctx.ellipse(0, my - R * 0.12, R * 0.3, R * 0.08, 0, 0, TAU); ctx.fillStyle = "#e8e8e4"; ctx.fill(); stroke(ctx, R * 0.02); }
    if (o.mouth === "wobble" || o.mouth === "cry") {
      ctx.beginPath(); ctx.moveTo(-R * 0.2, my);
      for (let i = 1; i <= 8; i++) ctx.lineTo(-R * 0.2 + (i * R * 0.4) / 8, my + (i % 2 ? -1 : 1) * R * 0.035 - Math.sin((i / 8) * Math.PI) * R * 0.05);
      if (o.mouth === "cry") { ctx.quadraticCurveTo(0, my + R * 0.25, -R * 0.2, my); ctx.fillStyle = "#3a1c20"; ctx.fill(); }
      stroke(ctx, R * 0.035);
    } else if (o.mouth === "gasp") {
      ctx.beginPath(); ctx.ellipse(0, my, R * 0.11, R * 0.15, 0, 0, TAU); ctx.fillStyle = "#3a1c20"; ctx.fill(); stroke(ctx, R * 0.03);
      ctx.beginPath(); ctx.ellipse(0, my + R * 0.08, R * 0.06, R * 0.04, 0, 0, TAU); ctx.fillStyle = "#c95a63"; ctx.fill();
    } else if (o.mouth === "smile") { ctx.beginPath(); ctx.arc(0, my - R * 0.1, R * 0.2, 0.25 * Math.PI, 0.75 * Math.PI); stroke(ctx, R * 0.035); }
    else if (o.mouth === "flat") { ctx.beginPath(); ctx.moveTo(-R * 0.12, my); ctx.lineTo(R * 0.12, my); stroke(ctx, R * 0.035); }
    // tears
    if (o.tears) for (const sd of [-1, 1]) {
      const cx = sd * ex + sd * R * 0.04, y0 = ey + R * 0.2, len = R * (0.4 + 0.6 * o.tears);
      ctx.beginPath(); ctx.moveTo(cx - R * 0.05, y0); ctx.bezierCurveTo(cx - R * 0.07, y0 + len * 0.5, cx - R * 0.04, y0 + len, cx, y0 + len + R * 0.05);
      ctx.bezierCurveTo(cx + R * 0.05, y0 + len, cx + R * 0.07, y0 + len * 0.5, cx + R * 0.05, y0); ctx.closePath();
      ctx.fillStyle = lg(ctx, cx - R * 0.05, 0, cx + R * 0.05, 0, [[0, "rgba(110,170,250,0.95)"], [1, "rgba(170,215,255,0.95)"]]); ctx.fill(); stroke(ctx, R * 0.015, "rgba(20,40,80,0.6)");
      ctx.beginPath(); ctx.moveTo(cx - R * 0.015, y0 + R * 0.05); ctx.lineTo(cx - R * 0.02, y0 + len * 0.8); ctx.lineWidth = R * 0.015; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
    }
    if (o.sweat) {
      const sx = R * 0.85, sy = -R * 0.55;
      ctx.beginPath(); ctx.moveTo(sx, sy - R * 0.18); ctx.bezierCurveTo(sx + R * 0.14, sy + R * 0.02, sx + R * 0.08, sy + R * 0.12, sx, sy + R * 0.12); ctx.bezierCurveTo(sx - R * 0.08, sy + R * 0.12, sx - R * 0.14, sy + R * 0.02, sx, sy - R * 0.18);
      ctx.fillStyle = "rgba(140,195,255,0.95)"; ctx.fill(); stroke(ctx, R * 0.02);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(sx - R * 0.03, sy, R * 0.02, R * 0.05, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // shoulders / hoodie under a hero head
  function torso(ctx, x, y, R, col, o = {}) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.moveTo(-R * 1.9, R * 2.6); ctx.bezierCurveTo(-R * 1.8, R * 1.3, -R * 1.1, R * 0.9, 0, R * 0.9); ctx.bezierCurveTo(R * 1.1, R * 0.9, R * 1.8, R * 1.3, R * 1.9, R * 2.6); ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, R * 0.9, 0, R * 2.4, [[0, col], [1, "#0e0f12"]]); ctx.fill(); stroke(ctx, R * 0.035);
    if (o.scarf) { ctx.beginPath(); ctx.ellipse(0, R * 0.98, R * 0.85, R * 0.2, 0, 0, TAU); ctx.fillStyle = o.scarf; ctx.fill(); stroke(ctx, R * 0.03); }
    ctx.restore();
  }
  function hand(ctx, x, y, s, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.roundRect(-60 + i * 30, -70 + Math.abs(i - 1.5) * 8, 30, 70, 15); ctx.fillStyle = "#e8e0cc"; ctx.fill(); stroke(ctx, 5); }
    ctx.beginPath(); ctx.roundRect(-66, -20, 132, 90, 30); ctx.fillStyle = "#e3dac6"; ctx.fill(); stroke(ctx, 5);
    ctx.restore();
  }
  // a hand gripping an edge: thumb in front, fingertips peeking from behind on the other side
  function grip(ctx, x, y, s, rot = 0, side = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * side, s);
    // palm going off-frame below
    ctx.beginPath(); ctx.moveTo(-70, 60); ctx.bezierCurveTo(-80, 160, -40, 260, 40, 300); ctx.lineTo(160, 300); ctx.bezierCurveTo(120, 200, 80, 120, 40, 60); ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, 60, 0, 300, [[0, "#e6dcc6"], [1, "#b9ae98"]]); ctx.fill(); stroke(ctx, 6);
    // thumb on top of the object
    ctx.beginPath(); ctx.roundRect(-38, -60, 64, 150, 32); ctx.fillStyle = "#ece3cf"; ctx.fill(); stroke(ctx, 6);
    ctx.beginPath(); ctx.roundRect(-24, -50, 36, 34, 12); ctx.fillStyle = "#f7f1e4"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.stroke();
    ctx.restore();
  }
  // title: segments [{t, c}] per line
  function title(ctx, lines, x, y, size, o = {}) {
    ctx.save();
    ctx.font = `400 ${size}px 'Lilita One'`; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
    lines.forEach((segs, li) => {
      let cx = x;
      const yy = y + li * size * 1.0;
      for (const sg of segs) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 0; ctx.shadowOffsetY = size * 0.07;
        ctx.lineWidth = size * 0.16; ctx.strokeStyle = "#0b0b0b"; ctx.strokeText(sg.t, cx, yy);
        ctx.restore();
        ctx.fillStyle = sg.c || "#ffffff"; ctx.fillText(sg.t, cx, yy);
        if (sg.strike) { const w = ctx.measureText(sg.t).width; ctx.strokeStyle = sg.strike; ctx.lineWidth = size * 0.08; ctx.beginPath(); ctx.moveTo(cx - 6, yy - size * 0.33); ctx.lineTo(cx + w + 6, yy - size * 0.38); ctx.stroke(); }
        cx += ctx.measureText(sg.t).width;
      }
    });
    ctx.restore();
  }
  function blurLayer(ctx, w, h, px, draw) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"));
    ctx.save(); ctx.filter = `blur(${px}px)`; ctx.drawImage(c, 0, 0); ctx.restore();
  }
  window.TH = { hero, torso, hand, grip, title, glow, blurLayer, lg, rg, C, stroke };
})();
