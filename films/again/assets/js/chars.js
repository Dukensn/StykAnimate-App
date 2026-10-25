// Characters: Theo, Mom (Rose) and Pride. Bean-style rig drawn on canvas.
(function () {
  const { PAL, G, jit, blob, hash, clamp, lerp, noise1 } = F;
  const OUT = 3.2; // outline width at scale 1

  function tube(ctx, pts, w, fill, s) {
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = w + OUT * 2 * s; ctx.stroke();
    ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke();
    ctx.restore();
  }
  function fillOutline(ctx, fill, s, w = OUT) {
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = w * s; ctx.strokeStyle = PAL.ink; ctx.lineJoin = "round"; ctx.stroke();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }

  // per-character look: clothes, hair and face details
  const LOOKS = {
    theo: { body: PAL.hoodie, pants: "#2a2c33", seed: 17, hr: 68, tH: 102, shW: 48, hipW: 50, detail: "hoodie" },
    mom: { body: PAL.cardigan, pants: "#4a4440", seed: 41, hr: 62, tH: 96, shW: 44, hipW: 52, detail: "buttons", bun: "#9fa1a6", fringe: "#a7a9ae", glasses: true },
    leoYoung: { body: "#4f6a8a", pants: "#2c2f38", seed: 23, hr: 68, tH: 102, shW: 48, hipW: 48, detail: "jacket", hair: "messy", hairC: "#2b2624" },
    leoOld: { body: "#6b5a48", pants: "#3c3a3a", seed: 29, hr: 66, tH: 98, shW: 47, hipW: 50, detail: "buttons", hair: "sides", hairC: "#d6d6d2", mustache: "#d6d6d2", glasses: true, wrinkles: true },
    maeYoung: { body: "#5f8a6e", pants: "#3a3430", seed: 53, hr: 62, tH: 94, shW: 42, hipW: 50, detail: "sweater", hair: "long", hairC: "#2a2422", ribbon: true },
    maeOld: { body: "#8f7aa6", pants: "#4a4450", seed: 59, hr: 62, tH: 94, shW: 42, hipW: 52, detail: "buttons", hair: "long", hairC: "#e6e3dc", ribbon: true, wrinkles: true },
  };
  const LK = (k) => LOOKS[k] || LOOKS.theo;

  // automatic blink: returns 0..1 lid closure, deterministic from time + seed
  function blinkAt(t, seed) {
    const period = 3.6 + (hash(seed, 3, 3) + 1) * 1.2;
    const ph = (t + seed * 1.7) % period;
    if (ph < 0.06) return ph / 0.06;
    if (ph < 0.14) return 1 - (ph - 0.06) / 0.08;
    return 0;
  }

  // ---------- HEAD (used in wide shots and close-ups)
  // e: {eyes, look:[x,y], brow, mouth, tear, blush, blinkSeed, squint, mouthOpen}
  function drawHead(ctx, cx, cy, r, e = {}, o = {}) {
    const s = r / 60;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(o.tilt || 0);
    const seed = o.seed || 11;
    // head shape: slightly squashed bean
    const sq = o.squash || 0;
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      let rx = r * (1.04 + sq), ry = r * (0.97 - sq);
      if (Math.sin(a) > 0) ry *= 1.02; // a little heavier chin
      pts.push([Math.cos(a) * rx, Math.sin(a) * ry]);
    }
    const L = LK(o.kind);
    if (L.hair === "long") {
      // hair falling behind the head and shoulders
      const hp = [[-r * 1.04, -r * 0.2], [-r * 0.92, -r * 0.88], [0, -r * 1.1], [r * 0.92, -r * 0.88], [r * 1.04, -r * 0.2],
        [r * 1.06, r * 0.6], [r * 0.86, r * 1.08], [r * 0.5, r * 0.95], [-r * 0.5, r * 0.95], [-r * 0.86, r * 1.08], [-r * 1.06, r * 0.6]];
      blob(ctx, jit(hp, seed + 9, 1.0 * s));
      fillOutline(ctx, L.hairC, s);
    }
    if (L.bun) {
      circle(ctx, r * 0.15, -r * 1.02, r * 0.36);
      fillOutline(ctx, L.bun, s);
      ctx.beginPath(); ctx.arc(r * 0.15, -r * 1.02, r * 0.2, 0.6, 2.4);
      ctx.strokeStyle = "#7b7d82"; ctx.lineWidth = 2 * s; ctx.stroke();
    }
    if (o.hood) {
      // hood framing the head
      const hp = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        hp.push([Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.22 + r * 0.06]);
      }
      blob(ctx, jit(hp, seed + 5, 0.9 * s));
      fillOutline(ctx, PAL.hoodie, s);
    }
    blob(ctx, jit(pts, seed, 1.0 * s));
    const lit = o.lit || 0; // phone light on face 0..1
    fillOutline(ctx, PAL.cream, s);
    // soft shading on the lower-left
    ctx.save();
    blob(ctx, pts); ctx.clip();
    const g = ctx.createRadialGradient(r * 0.35, -r * 0.45, r * 0.2, 0, 0, r * 1.3);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(80,70,60,0.28)");
    ctx.fillStyle = g; ctx.fillRect(-r * 1.5, -r * 1.5, r * 3, r * 3);
    if (lit > 0) {
      const lg = ctx.createRadialGradient(o.litX || 0, r * 0.9, r * 0.1, 0, r * 0.4, r * 1.6);
      lg.addColorStop(0, `rgba(170,200,255,${0.35 * lit})`);
      lg.addColorStop(1, "rgba(170,200,255,0)");
      ctx.fillStyle = lg; ctx.fillRect(-r * 1.5, -r * 1.5, r * 3, r * 3);
    }
    ctx.restore();
    if (L.hair === "long") {
      ctx.beginPath();
      ctx.moveTo(-r * 1.02, -r * 0.05);
      ctx.bezierCurveTo(-r * 0.95, -r * 1.05, r * 0.85, -r * 1.15, r * 1.03, -r * 0.1);
      ctx.bezierCurveTo(r * 0.75, -r * 0.7, r * 0.2, -r * 0.78, -r * 0.1, -r * 0.6);
      ctx.bezierCurveTo(-r * 0.4, -r * 0.78, -r * 0.85, -r * 0.62, -r * 1.02, -r * 0.05);
      fillOutline(ctx, L.hairC, s, 2.6);
      if (L.ribbon) {
        ctx.save(); ctx.translate(r * 0.72, -r * 0.72); ctx.rotate(0.5);
        for (const sd of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd * r * 0.3, -r * 0.16); ctx.lineTo(sd * r * 0.3, r * 0.16); ctx.closePath();
          fillOutline(ctx, PAL.red2 || "#e2403f", s, 2.4);
        }
        circle(ctx, 0, 0, r * 0.08); fillOutline(ctx, "#c23432", s, 2);
        ctx.restore();
      }
    }
    if (L.hair === "messy") {
      ctx.beginPath();
      ctx.moveTo(-r * 1.0, -r * 0.15);
      const spikes = [[-r * 1.02, -r * 0.75], [-r * 0.7, -r * 0.95], [-r * 0.55, -r * 1.2], [-r * 0.2, -r * 1.02], [r * 0.05, -r * 1.25], [r * 0.3, -r * 1.02], [r * 0.6, -r * 1.15], [r * 0.75, -r * 0.88], [r * 1.05, -r * 0.7]];
      for (const p of spikes) ctx.lineTo(p[0], p[1]);
      ctx.lineTo(r * 1.0, -r * 0.2);
      ctx.bezierCurveTo(r * 0.6, -r * 0.6, -r * 0.5, -r * 0.65, -r * 1.0, -r * 0.15);
      fillOutline(ctx, L.hairC, s, 2.6);
    }
    if (L.hair === "sides") {
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sd * r * 0.98, -r * 0.45);
        ctx.bezierCurveTo(sd * r * 1.25, -r * 0.4, sd * r * 1.2, r * 0.15, sd * r * 0.98, r * 0.18);
        ctx.bezierCurveTo(sd * r * 1.05, -r * 0.1, sd * r * 1.05, -r * 0.3, sd * r * 0.98, -r * 0.45);
        fillOutline(ctx, L.hairC, s, 2.4);
      }
      ctx.save(); ctx.strokeStyle = L.hairC; ctx.lineWidth = 3 * s;
      for (const dx of [-0.2, 0, 0.2]) { ctx.beginPath(); ctx.moveTo(r * dx, -r * 0.96); ctx.quadraticCurveTo(r * (dx + 0.15), -r * 1.18, r * (dx + 0.3), -r * 1.08); ctx.stroke(); }
      ctx.restore();
    }
    if (L.fringe) {
      // hair line fringe
      ctx.beginPath();
      ctx.moveTo(-r * 0.95, -r * 0.25);
      ctx.bezierCurveTo(-r * 0.7, -r * 1.05, r * 0.7, -r * 1.05, r * 0.98, -r * 0.2);
      ctx.bezierCurveTo(r * 0.6, -r * 0.62, -r * 0.4, -r * 0.7, -r * 0.95, -r * 0.25);
      fillOutline(ctx, L.fringe, s, 2.6);
    }
    drawFace(ctx, r, e, o, s);
    ctx.restore();
  }

  function drawFace(ctx, r, e, o, s) {
    const look = e.look || [0, 0];
    const lx = look[0] * r * 0.16, ly = look[1] * r * 0.1;
    const ex = r * 0.34, ey = -r * 0.02 + ly;
    const ink = PAL.ink;
    const blink = e.eyes === "closed" ? 1 : Math.max(e.lid || 0, o.noBlink ? 0 : blinkAt(G.t, e.blinkSeed || o.seed || 1));
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const side of [-1, 1]) {
      const x = side * ex + lx, y = ey;
      ctx.save();
      const kind = e.eyes || "dot";
      if (kind === "happy") {
        ctx.beginPath(); ctx.arc(x, y + r * 0.06, r * 0.11, Math.PI * 1.1, Math.PI * 1.9);
        ctx.strokeStyle = ink; ctx.lineWidth = 4 * s; ctx.stroke();
      } else if (blink > 0.85) {
        ctx.beginPath(); ctx.arc(x, y - r * 0.02, r * 0.1, Math.PI * 0.15, Math.PI * 0.85);
        ctx.strokeStyle = ink; ctx.lineWidth = 3.6 * s; ctx.stroke();
      } else if (kind === "wide" || kind === "teary") {
        const rx = r * 0.17, ry = r * 0.2 * (1 - blink);
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#fbfaf6"; ctx.fill();
        ctx.lineWidth = 2.8 * s; ctx.strokeStyle = ink; ctx.stroke();
        ctx.save(); ctx.clip();
        const px = x + look[0] * rx * 0.35, py = y + look[1] * ry * 0.3 + (kind === "teary" ? r * 0.02 : 0);
        circle(ctx, px, py, r * (kind === "teary" ? 0.11 : 0.085)); ctx.fillStyle = ink; ctx.fill();
        circle(ctx, px - r * 0.035, py - r * 0.04, r * 0.03); ctx.fillStyle = "#fff"; ctx.fill();
        if (kind === "teary") {
          circle(ctx, px + r * 0.03, py + r * 0.035, r * 0.016); ctx.fillStyle = "#fff"; ctx.fill();
          ctx.fillStyle = "rgba(143,199,255,0.45)";
          ctx.fillRect(x - rx, y + ry * 0.45, rx * 2, ry);
        }
        ctx.restore();
      } else {
        // default: dark oval with highlight
        const ry = r * 0.13 * (1 - blink) * (kind === "half" ? 0.55 : 1) * (e.squint ? 0.6 : 1);
        ctx.beginPath(); ctx.ellipse(x, y + (kind === "half" ? r * 0.04 : 0), r * 0.085, Math.max(ry, 0.5), 0, 0, Math.PI * 2);
        ctx.fillStyle = ink; ctx.fill();
        if (ry > r * 0.05) { circle(ctx, x - r * 0.025, y - ry * 0.4, r * 0.025); ctx.fillStyle = "#fff"; ctx.fill(); }
        if (kind === "half") {
          ctx.beginPath(); ctx.moveTo(x - r * 0.13, y - r * 0.02); ctx.lineTo(x + r * 0.13, y - r * 0.02);
          ctx.strokeStyle = ink; ctx.lineWidth = 3 * s; ctx.stroke();
        }
      }
      // brows: e.brow > 0 worried (inner up), < 0 angry (inner down)
      if (e.brow != null) {
        const b = e.brow;
        const by = y - r * 0.27 - (e.browUp || 0) * r * 0.08;
        const inner = side * -1;
        ctx.beginPath();
        ctx.moveTo(x + inner * r * 0.04, by - b * r * 0.09);
        ctx.lineTo(x - inner * r * 0.15, by + b * r * 0.05);
        ctx.strokeStyle = ink; ctx.lineWidth = 4 * s; ctx.stroke();
      }
      ctx.restore();
    }
    const L = LK(o.kind);
    if (L.wrinkles) {
      ctx.save(); ctx.strokeStyle = "rgba(60,50,40,0.45)"; ctx.lineWidth = 2.2 * s; ctx.lineCap = "round";
      for (const side of [-1, 1]) {
        const x = side * (ex + r * 0.2) + lx;
        ctx.beginPath(); ctx.moveTo(x, ey - r * 0.02); ctx.lineTo(x + side * r * 0.08, ey - r * 0.06);
        ctx.moveTo(x, ey + r * 0.03); ctx.lineTo(x + side * r * 0.08, ey + r * 0.06); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-r * 0.25 + lx, -r * 0.5); ctx.lineTo(r * 0.25 + lx, -r * 0.5); ctx.stroke();
      ctx.restore();
    }
    if (L.mustache) {
      ctx.save();
      const my = r * 0.25 + ly * 0.5, mx = lx * 0.8;
      ctx.beginPath(); ctx.moveTo(mx, my - r * 0.03);
      ctx.bezierCurveTo(mx - r * 0.12, my - r * 0.1, mx - r * 0.3, my - r * 0.02, mx - r * 0.28, my + r * 0.08);
      ctx.bezierCurveTo(mx - r * 0.15, my + r * 0.02, mx - r * 0.05, my + r * 0.05, mx, my + r * 0.03);
      ctx.bezierCurveTo(mx + r * 0.05, my + r * 0.05, mx + r * 0.15, my + r * 0.02, mx + r * 0.28, my + r * 0.08);
      ctx.bezierCurveTo(mx + r * 0.3, my - r * 0.02, mx + r * 0.12, my - r * 0.1, mx, my - r * 0.03);
      fillOutline(ctx, L.mustache, s, 2.2);
      ctx.restore();
    }
    if (L.glasses) {
      // round glasses
      ctx.save();
      ctx.lineWidth = 2.6 * s; ctx.strokeStyle = "#3a3a40";
      for (const side of [-1, 1]) { circle(ctx, side * ex + lx * 0.7, ey, r * 0.2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-ex + r * 0.2 + lx * 0.7, ey); ctx.lineTo(ex - r * 0.2 + lx * 0.7, ey); ctx.stroke();
      ctx.restore();
    }
    // blush
    if (e.blush) {
      ctx.save(); ctx.globalAlpha = 0.35 * e.blush; ctx.fillStyle = "#ff8f8f";
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * r * 0.52 + lx, r * 0.24, r * 0.13, r * 0.07, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    // mouth
    const mx = lx * 0.8, my = r * 0.36 + ly * 0.5;
    const m = e.mouth || "flat";
    ctx.save();
    ctx.strokeStyle = ink; ctx.lineWidth = 3.6 * s; ctx.lineCap = "round";
    ctx.beginPath();
    if (m === "flat") { ctx.moveTo(mx - r * 0.1, my); ctx.lineTo(mx + r * 0.1, my); ctx.stroke(); }
    else if (m === "frown") { ctx.arc(mx, my + r * 0.12, r * 0.13, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
    else if (m === "smile") { ctx.arc(mx, my - r * 0.1, r * 0.14, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); }
    else if (m === "small") { ctx.arc(mx, my - r * 0.06, r * 0.08, Math.PI * 0.25, Math.PI * 0.75); ctx.stroke(); }
    else if (m === "wobble") {
      ctx.moveTo(mx - r * 0.14, my + r * 0.02);
      for (let i = 1; i <= 8; i++) ctx.lineTo(mx - r * 0.14 + (i * r * 0.28) / 8, my + (i % 2 ? -1 : 1) * r * 0.025);
      ctx.stroke();
    } else if (m === "oh") {
      ctx.ellipse(mx, my + r * 0.02, r * 0.06, r * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#3a1f22"; ctx.fill(); ctx.lineWidth = 3 * s; ctx.stroke();
    } else if (m === "open" || m === "cry" || m === "grin") {
      const h = m === "cry" ? r * 0.13 : r * 0.12;
      ctx.moveTo(mx - r * 0.16, my - r * 0.03);
      if (m === "cry") ctx.bezierCurveTo(mx - r * 0.1, my - r * 0.12, mx + r * 0.1, my - r * 0.12, mx + r * 0.16, my - r * 0.03);
      else ctx.lineTo(mx + r * 0.16, my - r * 0.03);
      ctx.bezierCurveTo(mx + r * 0.14, my + h, mx - r * 0.14, my + h, mx - r * 0.16, my - r * 0.03);
      ctx.closePath(); ctx.fillStyle = "#3a1f22"; ctx.fill(); ctx.lineWidth = 3 * s; ctx.stroke();
    }
    ctx.restore();
    // tears
    if (e.tear > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(e.tear, 0, 1);
      for (const side of [-1, 1]) {
        const x = side * ex + lx + side * r * 0.02, y0 = ey + r * 0.12;
        const len = r * (0.25 + 0.5 * clamp(e.tear, 0, 1));
        ctx.beginPath(); ctx.moveTo(x - r * 0.025, y0); ctx.lineTo(x + r * 0.025, y0);
        ctx.lineTo(x + r * 0.03, y0 + len); ctx.quadraticCurveTo(x, y0 + len + r * 0.05, x - r * 0.03, y0 + len); ctx.closePath();
        ctx.fillStyle = "rgba(143,199,255,0.85)"; ctx.fill();
        // falling drop
        const ph = ((G.t * 0.9 + (side > 0 ? 0.45 : 0)) % 1);
        if (e.tear > 0.6) {
          const dy = y0 + len + ph * r * 0.6;
          ctx.globalAlpha = (1 - ph) * clamp(e.tear, 0, 1);
          ctx.beginPath(); ctx.ellipse(x, dy, r * 0.028, r * 0.04, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }
    if (e.sweat) {
      ctx.save(); ctx.fillStyle = "rgba(143,199,255,0.9)"; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 2 * s;
      const x = r * 0.78, y = -r * 0.45;
      ctx.beginPath(); ctx.moveTo(x, y - r * 0.1); ctx.quadraticCurveTo(x + r * 0.08, y + r * 0.03, x, y + r * 0.06);
      ctx.quadraticCurveTo(x - r * 0.08, y + r * 0.03, x, y - r * 0.1); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- FULL BODY
  // P: {x,y,s,kind,pose:'stand'|'sit', face:-1..1, lean, tilt, armL:[a1,a2], armR:[a1,a2], legs:[l,r] (sit dir),
  //     e: expression, hood, breathe, phone:{hand:'R'|'L', glow}, seed}
  function drawPerson(ctx, P) {
    const s = P.s || 1;
    const kind = P.kind || "theo";
    const L = LK(kind);
    const body = P.body || L.body;
    const pants = L.pants;
    const seed = P.seed || L.seed;
    const br = Math.sin(G.t * 2.2 + seed) * (P.breathe ?? 1);
    ctx.save();
    ctx.translate(P.x, P.y);
    ctx.scale(s * (P.flip ? -1 : 1), s);
    const lean = P.lean || 0;
    const sit = P.pose === "sit";
    const hipY = sit ? -12 : -92;
    const hip = [0, hipY];
    const legDir = P.legDir ?? (P.face >= 0 ? 1 : -1);
    // legs
    if (sit) {
      const kneeX = legDir * 62, kneeY = hipY - 4;
      for (const off of [-12, 12]) {
        tube(ctx, [[off * 0.6, hipY], [kneeX + off * 0.3, kneeY], [kneeX + off * 0.3 + legDir * 4, kneeY + 74 + (P.legDrop || 0)]], 30, pants, 1);
        ctx.save(); ctx.beginPath(); ctx.ellipse(kneeX + off * 0.3 + legDir * 12, kneeY + 80 + (P.legDrop || 0), 19, 10, 0, 0, Math.PI * 2);
        fillOutline(ctx, "#d9d4c6", 1); ctx.restore();
      }
    } else {
      const step = P.walk ? Math.sin(P.walk * Math.PI * 2) : 0;
      for (const sd of [-1, 1]) {
        const sw = step * sd * 16;
        tube(ctx, [[sd * 16, hipY], [sd * 17 + sw * 0.5, hipY + 46], [sd * 18 + sw, -8]], 30, pants, 1);
        ctx.beginPath(); ctx.ellipse(sd * 18 + sw + 6 * (P.face || 0), -6, 20, 10, 0, 0, Math.PI * 2);
        fillOutline(ctx, "#d9d4c6", 1);
      }
    }
    // torso (rotated by lean around hip)
    ctx.save();
    ctx.translate(hip[0], hip[1]);
    ctx.rotate(lean);
    const tH = L.tH; // torso height
    const shW = L.shW, hipW = L.hipW;
    const brS = br * 1.5;
    const torso = [
      [-hipW, 8], [-hipW + 2, -tH * 0.45], [-shW, -tH + 10 - brS], [-shW * 0.5, -tH - 4 - brS], [0, -tH - 7 - brS],
      [shW * 0.5, -tH - 4 - brS], [shW, -tH + 10 - brS], [hipW - 2, -tH * 0.45], [hipW, 8], [0, 12],
    ];
    const shoulder = (sd) => [sd * (shW - 8), -tH + 16 - brS];
    // back arm first (the one away from the facing direction)
    const arms = [["L", -1], ["R", 1]];
    const armPts = (sd) => {
      const a = P["arm" + (sd < 0 ? "L" : "R")] || [sd * 0.12, sd * 0.05];
      const sh = shoulder(sd);
      const el = [sh[0] + Math.sin(a[0]) * 50, sh[1] + Math.cos(a[0]) * 50];
      const ha = [el[0] + Math.sin(a[0] + a[1]) * 46, el[1] + Math.cos(a[0] + a[1]) * 46];
      return [sh, el, ha];
    };
    const drawArm = (sd) => {
      const [sh, el, ha] = armPts(sd);
      tube(ctx, [sh, el, ha], 26, body, 1);
      circle(ctx, ha[0], ha[1], 14); fillOutline(ctx, PAL.cream, 1, 2.8);
      const m = ctx.getTransform();
      P.out = P.out || {};
      P.out[sd < 0 ? "L" : "R"] = [m.a * ha[0] + m.c * ha[1] + m.e, m.b * ha[0] + m.d * ha[1] + m.f];
      return ha;
    };
    const backSd = (P.face || 0) >= 0 ? -1 : 1;
    let hands = {};
    hands[backSd] = drawArm(backSd);
    blob(ctx, jit(torso, seed + 3, 1));
    fillOutline(ctx, body, 1);
    if (L.detail === "sweater") {
      ctx.save(); ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 2.4;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-hipW + 6, -10 - i * 8); ctx.lineTo(hipW - 6, -10 - i * 8); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, -tH - 4, 16, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.restore();
    } else if (L.detail === "jacket") {
      ctx.save(); ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-16, -tH); ctx.lineTo(0, -tH + 30); ctx.lineTo(16, -tH); ctx.moveTo(0, -tH + 30); ctx.lineTo(0, 8); ctx.stroke();
      ctx.fillStyle = "#e9e4d6"; ctx.beginPath(); ctx.moveTo(-14, -tH - 2); ctx.lineTo(0, -tH + 26); ctx.lineTo(14, -tH - 2); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (L.detail === "hoodie") {
      // hoodie pocket + strings
      ctx.save(); ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-26, -24); ctx.lineTo(26, -24); ctx.lineTo(32, 2); ctx.lineTo(-32, 2); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, -tH + 4); ctx.lineTo(-11, -tH + 34); ctx.moveTo(9, -tH + 4); ctx.lineTo(11, -tH + 34); ctx.stroke();
      ctx.restore();
    } else {
      ctx.save(); ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(0, -tH - 4); ctx.lineTo(0, 8); ctx.stroke();
      for (let i = 0; i < 3; i++) { circle(ctx, 6, -tH + 22 + i * 26, 3); ctx.fillStyle = "#5e4520"; ctx.fill(); }
      ctx.restore();
    }
    if (P.scarf) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -tH + 4, shW * 0.9, 16, 0, 0, Math.PI * 2); fillOutline(ctx, P.scarf, 1);
      ctx.beginPath(); ctx.roundRect(shW * 0.25, -tH + 8, 18, 50, 6); fillOutline(ctx, P.scarf, 1);
      ctx.restore();
    }
    // head
    const hr = L.hr;
    const headY = -tH - hr * 0.78 - brS * 0.6;
    { const m = ctx.getTransform(); const hx = (P.face || 0) * 4; P.out = P.out || {}; P.out.head = [m.a * hx + m.c * headY + m.e, m.b * hx + m.d * headY + m.f, hr * Math.hypot(m.a, m.b)]; }
    drawHead(ctx, (P.face || 0) * 4, headY, hr, P.e || {}, { kind, tilt: P.tilt || 0, hood: P.hood, seed, lit: P.lit, squash: P.squash });
    // front arm
    hands[-backSd] = drawArm(-backSd);
    if (P.cane) {
      const ha = hands[P.cane === "L" ? -1 : 1];
      ctx.save(); ctx.lineCap = "round";
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(ha[0], ha[1]); ctx.lineTo(ha[0] + 6, -hipY + 2 - (sit ? 0 : 0)); ctx.stroke();
      ctx.strokeStyle = "#7a5a3a"; ctx.lineWidth = 6; ctx.stroke();
      ctx.restore();
      circle(ctx, ha[0], ha[1], 14); fillOutline(ctx, PAL.cream, 1, 2.8);
    }
    // phone in hand
    if (P.phone) {
      const ha = hands[P.phone.hand === "L" ? -1 : 1];
      ctx.save();
      ctx.translate(ha[0] + (P.phone.dx || 0), ha[1] - 18 + (P.phone.dy || 0));
      ctx.rotate(P.phone.rot || 0);
      if (P.phone.glow) {
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 140);
        g.addColorStop(0, `rgba(150,185,255,${0.35 * P.phone.glow})`); g.addColorStop(1, "rgba(150,185,255,0)");
        ctx.fillStyle = g; ctx.fillRect(-150, -150, 300, 300);
      }
      ctx.beginPath(); ctx.roundRect(-13, -24, 26, 46, 5);
      ctx.fillStyle = "#0b0c10"; ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = PAL.ink; ctx.stroke();
      if (P.phone.glow) { ctx.fillStyle = `rgba(160,190,255,${0.9 * P.phone.glow})`; ctx.fillRect(-10, -20, 20, 38); }
      // thumb over phone
      circle(ctx, 4, 10, 11); fillOutline(ctx, PAL.cream, 1, 2.6);
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  // ---------- PRIDE: tall shadow with a crown, amber neon edge
  // o: {alpha, s, grin, lean, crown, dissolve, reach:[a1,a2], eyes:'slit'|'open', seed}
  function pridePath(ctx, o) {
    const sway = noise1(G.t * 0.6, 5) * 6;
    const hunch = o.hunch ?? 14;
    // a tall, hunched man-shaped shadow: head, narrow neck, broad shoulders, body trailing into smoke
    const wav = (i) => noise1(G.t * 1.4 + i * 1.7, 9) * 7;
    const pts = [
      [-58 + wav(1), 0], [-52, -60], [-48, -140], [-58, -205], [-84, -248], [-78, -276],
      [-36, -290], [-24, -300], [-40, -330], [-38, -372], [-12, -398], [14 + hunch * 0.3, -398], [40 + hunch * 0.5, -374],
      [44 + hunch * 0.5, -334], [26 + hunch * 0.3, -300], [38, -290], [80, -278], [88, -250], [62, -205], [50, -140], [54, -60], [60 + wav(2), 0],
      [30, 12 + wav(3)], [0, 2], [-30, 12 + wav(4)],
    ].map(([x, y]) => [x + sway * (-y / 398), y]);
    blob(ctx, jit(pts, (o.seed || 70), 1.4));
  }
  function drawPride(ctx, x, y, o = {}) {
    const a = o.alpha ?? 1;
    if (a <= 0.001) return;
    const s = o.s || 1;
    const dis = o.dissolve || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.rotate(o.lean || 0);
    ctx.globalAlpha *= a * (1 - dis * 0.9);
    // floor ring
    ctx.save();
    ctx.shadowColor = PAL.amber; ctx.shadowBlur = 18;
    ctx.strokeStyle = PAL.amber; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 4, 74, 12, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // body
    ctx.save();
    pridePath(ctx, o);
    ctx.fillStyle = "#060608"; ctx.fill();
    ctx.shadowColor = PAL.amber; ctx.shadowBlur = 26;
    ctx.strokeStyle = PAL.amber; ctx.lineWidth = 3.2; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
    // reaching arm (thin, long fingers)
    if (o.reach) {
      const [a1, a2] = o.reach;
      const sh = [62, -262];
      const el = [sh[0] + Math.sin(a1) * 90, sh[1] + Math.cos(a1) * 90];
      const ha = [el[0] + Math.sin(a1 + a2) * 85, el[1] + Math.cos(a1 + a2) * 85];
      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.shadowColor = PAL.amber; ctx.shadowBlur = 16;
      ctx.strokeStyle = PAL.amber; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.moveTo(...sh); ctx.lineTo(...el); ctx.lineTo(...ha); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = "#060608"; ctx.lineWidth = 16; ctx.stroke();
      ctx.restore();
    }
    // crown
    if (o.crown !== false) {
      const cy = -392 - (o.crownLift || 0);
      ctx.save();
      ctx.translate(6, cy);
      ctx.rotate(o.crownRot || 0.1);
      ctx.beginPath();
      ctx.moveTo(-26, 6); ctx.lineTo(-30, -26); ctx.lineTo(-14, -10); ctx.lineTo(0, -34); ctx.lineTo(14, -10); ctx.lineTo(30, -26); ctx.lineTo(26, 6); ctx.closePath();
      ctx.fillStyle = "#060608"; ctx.fill();
      ctx.shadowColor = PAL.amber; ctx.shadowBlur = 14; ctx.strokeStyle = PAL.amberHot; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    // face
    ctx.save();
    ctx.shadowColor = PAL.amber; ctx.shadowBlur = 12;
    ctx.strokeStyle = PAL.amberHot; ctx.fillStyle = PAL.amberHot; ctx.lineCap = "round";
    const look = (o.look || 0) * 0.8 + 6;
    // eyes: sharp slanted slits
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      const ex = look + sd * 17, ey = -356;
      ctx.moveTo(ex - sd * 4, ey + (o.angry ? 6 : 3));
      ctx.lineTo(ex + sd * 15, ey - 6);
      ctx.lineTo(ex + sd * 11, ey + 3);
      ctx.closePath();
      ctx.lineWidth = 3; ctx.stroke(); ctx.fill();
    }
    // grin: a thin crescent with pointed ends
    const g = o.grin ?? 1;
    ctx.beginPath();
    ctx.moveTo(look - 26, -334 - 4 * g);
    ctx.quadraticCurveTo(look, -334 + 22 * g, look + 28, -336 - 6 * g);
    ctx.quadraticCurveTo(look, -334 + 12 * g, look - 26, -334 - 4 * g);
    ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
    // dissolve embers (drawn without the body alpha)
    if (dis > 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      const rnd = F.mulberry(909);
      for (let i = 0; i < 160; i++) {
        const px = (rnd() - 0.5) * 120, py = -rnd() * 350;
        const vx = (rnd() - 0.5) * 260, vy = -80 - rnd() * 260;
        const d = dis;
        const ex = px + vx * d + Math.sin(i + d * 6) * 10, ey = py + vy * d;
        const al = a * clamp(1 - d * (0.8 + rnd() * 0.6), 0, 1);
        if (al <= 0) continue;
        ctx.globalAlpha = al;
        ctx.fillStyle = i % 3 ? PAL.amber : PAL.amberHot;
        ctx.fillRect(ex, ey, 3 + rnd() * 3, 3 + rnd() * 3);
      }
      ctx.restore();
    }
  }

  window.C = { drawHead, drawPerson, drawPride, tube, fillOutline, circle, blinkAt };
})();
