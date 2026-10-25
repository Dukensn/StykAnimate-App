// Silhouette characters: solid black figures, white eyes, soft rim light, coloured sneakers.
(function () {
  const { G, clamp, lerp, hash, noise1 } = F;
  const INK = "#0c0c0f";
  const RIM = "rgba(215,222,235,0.32)";

  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  // rim first, fill after: only the outer half of the stroke survives
  function solid(ctx, pathFn, rim = 3) {
    pathFn(); ctx.lineWidth = rim; ctx.strokeStyle = RIM; ctx.lineJoin = "round"; ctx.stroke();
    pathFn(); ctx.fillStyle = INK; ctx.fill();
  }
  function limb(ctx, pts, w) {
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
    const path = () => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); };
    path(); ctx.strokeStyle = RIM; ctx.lineWidth = w + 3; ctx.stroke();
    path(); ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.stroke();
    ctx.restore();
  }
  function blinkAt(t, seed) {
    const period = 3.4 + (hash(seed, 3, 3) + 1) * 1.3;
    const ph = (t + seed * 1.7) % period;
    if (ph < 0.07) return ph / 0.07;
    if (ph < 0.15) return 1 - (ph - 0.07) / 0.08;
    return 0;
  }

  // face drawn on a head of radius r centred at 0,0
  function face(ctx, r, e = {}, o = {}) {
    const look = e.look || [0, 0];
    const lx = look[0] * r * 0.22, ly = look[1] * r * 0.14;
    const ex = r * 0.3, ey = r * 0.02 + ly;
    const blink = e.eyes === "closed" ? 1 : Math.max(e.lid || 0, o.noBlink ? 0 : blinkAt(G.t, o.seed || 1));
    const kind = e.eyes || "open";
    ctx.save();
    for (const sd of [-1, 1]) {
      const x = sd * ex + lx, y = ey;
      if (kind === "happy") {
        ctx.beginPath(); ctx.arc(x, y + r * 0.06, r * 0.13, Math.PI * 1.15, Math.PI * 1.85);
        ctx.strokeStyle = "#f2f2ee"; ctx.lineWidth = r * 0.06; ctx.lineCap = "round"; ctx.stroke();
      } else if (blink > 0.8) {
        ctx.beginPath(); ctx.arc(x, y - r * 0.02, r * 0.12, Math.PI * 0.15, Math.PI * 0.85);
        ctx.strokeStyle = "#e6e6e2"; ctx.lineWidth = r * 0.05; ctx.lineCap = "round"; ctx.stroke();
      } else {
        const big = kind === "wide" ? 1.3 : 1;
        const rx = r * 0.11 * big, ry = r * 0.15 * big * (1 - blink) * (kind === "half" ? 0.55 : 1);
        ctx.beginPath(); ctx.ellipse(x, y + (kind === "half" ? r * 0.04 : 0), rx, Math.max(ry, 0.6), 0, 0, Math.PI * 2);
        ctx.fillStyle = "#f4f4f0"; ctx.fill();
        if (kind === "teary") { ctx.fillStyle = "rgba(160,200,255,0.55)"; ctx.fillRect(x - rx, y + ry * 0.2, rx * 2, ry); }
        if (kind === "half") { ctx.fillStyle = INK; ctx.fillRect(x - rx - 1, y - ry - r * 0.06, rx * 2 + 2, r * 0.07); }
      }
      // brows: e.brow > 0 worried, < 0 angry
      if (e.brow != null) {
        const b = e.brow, by = y - r * 0.27 - (e.browUp || 0) * r * 0.06;
        const inner = -sd;
        ctx.beginPath();
        ctx.moveTo(x + inner * r * 0.03, by - b * r * 0.08);
        ctx.lineTo(x - inner * r * 0.17, by + b * r * 0.05);
        ctx.strokeStyle = "#a6abb5"; ctx.lineWidth = r * 0.055; ctx.lineCap = "round"; ctx.stroke();
      }
    }
    if (o.mustache) {
      ctx.beginPath(); ctx.ellipse(lx, r * 0.38 + ly * 0.5, r * 0.24, r * 0.07, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#b9bcc2"; ctx.fill();
    }
    if (e.smile) {
      ctx.beginPath(); ctx.arc(lx, r * 0.3 + ly * 0.5, r * 0.16, Math.PI * 0.2, Math.PI * 0.8);
      ctx.strokeStyle = "#cfd2d8"; ctx.lineWidth = r * 0.045; ctx.lineCap = "round"; ctx.stroke();
    }
    if (e.mouth === "oh") { ctx.beginPath(); ctx.ellipse(lx, r * 0.42, r * 0.06, r * 0.08, 0, 0, 7); ctx.fillStyle = "#cfd2d8"; ctx.fill(); }
    if (e.tear > 0) {
      ctx.globalAlpha = clamp(e.tear, 0, 1);
      for (const sd of [-1, 1]) {
        const x = sd * ex + lx, y0 = ey + r * 0.14;
        ctx.fillStyle = "rgba(170,205,255,0.85)";
        ctx.fillRect(x - r * 0.022, y0, r * 0.044, r * (0.2 + 0.4 * e.tear));
      }
    }
    ctx.restore();
  }

  function head(ctx, x, y, r, e, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.tilt || 0);
    solid(ctx, () => circle(ctx, 0, 0, r), 3);
    if (o.cap) {
      ctx.beginPath(); ctx.moveTo(-r * 1.0, -r * 0.25); ctx.quadraticCurveTo(-r * 0.9, -r * 1.12, r * 0.25, -r * 1.05);
      ctx.quadraticCurveTo(r * 0.95, -r * 0.95, r * 1.0, -r * 0.35); ctx.lineTo(r * 1.45, -r * 0.3); ctx.lineTo(r * 1.4, -r * 0.18); ctx.lineTo(-r * 1.0, -r * 0.2); ctx.closePath();
      ctx.fillStyle = "#3b3d44"; ctx.fill(); ctx.strokeStyle = RIM; ctx.lineWidth = 2; ctx.stroke();
    }
    if (o.band) { ctx.fillStyle = "#e9e9e4"; ctx.beginPath(); ctx.roundRect(-r * 0.98, -r * 0.62, r * 1.96, r * 0.26, r * 0.1); ctx.fill(); }
    face(ctx, r, e, o);
    ctx.restore();
  }

  // P: {x,y,s,kind:'noah'|'dad', pose:'stand'|'sit', face, walk, lean, tilt, armL, armR, e, cane, hold, shoes, alpha}
  function sil(ctx, P) {
    const s = P.s || 1;
    const dad = P.kind === "dad";
    const hr = dad ? 44 : 46;
    const bodyW = dad ? 78 : 70, bodyH = dad ? 104 : 112, legL = dad ? 88 : 96;
    const seed = dad ? 5 : 2;
    const br = Math.sin(G.t * 2.1 + seed) * 1.4;
    ctx.save();
    ctx.translate(P.x, P.y); ctx.scale(s, s);
    if (P.alpha != null) ctx.globalAlpha *= P.alpha;
    const sit = P.pose === "sit";
    // ground shadow
    if (!P.noShadow && !sit) { ctx.beginPath(); ctx.ellipse(0, 4, 56, 9, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fill(); }
    const hipY = sit ? -8 : -legL;
    const face0 = P.face || 0;
    // legs + shoes
    const shoe = P.shoes || (dad ? "#8a7a6a" : "#a9c3e0");
    const drawShoe = (x, y, dir) => {
      ctx.beginPath(); ctx.ellipse(x + dir * 6, y - 5, 19, 9, 0, 0, Math.PI * 2); ctx.fillStyle = shoe; ctx.fill();
      ctx.fillStyle = "#f2f2f0"; ctx.fillRect(x + dir * 6 - 18, y - 2, 36, 4);
    };
    if (sit) {
      const dir = P.legDir ?? (face0 >= 0 ? 1 : -1);
      for (const off of [-10, 10]) {
        limb(ctx, [[off * 0.6, hipY], [dir * 58 + off * 0.3, hipY - 2], [dir * 62 + off * 0.3, hipY + (P.legDrop ?? 80)]], 18);
        drawShoe(dir * 62 + off * 0.3, hipY + (P.legDrop ?? 80) + 6, dir);
      }
    } else {
      const st = P.walk ? Math.sin(P.walk * Math.PI * 2) : 0;
      for (const sd of [-1, 1]) {
        const sw = st * sd * 16;
        limb(ctx, [[sd * 14, hipY], [sd * 15 + sw, -6]], 18);
        drawShoe(sd * 15 + sw, 0, face0 >= 0 ? 1 : -1);
      }
    }
    // torso
    ctx.save();
    ctx.translate(0, hipY + (P.walk ? Math.abs(Math.sin(P.walk * Math.PI * 2)) * -3 : 0));
    ctx.rotate(P.lean || (dad ? 0.06 : 0));
    const top = -bodyH - br;
    const torso = () => {
      ctx.beginPath();
      if (dad) { ctx.moveTo(-bodyW / 2 + 6, top + 8); ctx.quadraticCurveTo(0, top - 6, bodyW / 2 - 6, top + 8); ctx.lineTo(bodyW / 2 + 4, 6); ctx.lineTo(-bodyW / 2 - 4, 6); ctx.closePath(); }
      else ctx.roundRect(-bodyW / 2, top, bodyW, bodyH + 6, [22, 22, 8, 8]);
    };
    const shoulder = (sd) => [sd * (bodyW / 2 - 8), top + 16];
    const arm = (sd) => {
      const a = P["arm" + (sd < 0 ? "L" : "R")] || [sd * 0.1, sd * 0.05];
      const sh = shoulder(sd);
      const el = [sh[0] + Math.sin(a[0]) * 50, sh[1] + Math.cos(a[0]) * 50];
      const ha = [el[0] + Math.sin(a[0] + a[1]) * 48, el[1] + Math.cos(a[0] + a[1]) * 48];
      limb(ctx, [sh, el, ha], 13);
      solid(ctx, () => circle(ctx, ha[0], ha[1], 9), 2);
      const m = ctx.getTransform(); P.out = P.out || {};
      P.out[sd < 0 ? "L" : "R"] = [m.a * ha[0] + m.c * ha[1] + m.e, m.b * ha[0] + m.d * ha[1] + m.f];
      return ha;
    };
    const backSd = face0 >= 0 ? -1 : 1;
    arm(backSd);
    solid(ctx, torso, 3);
    // head
    const hy = top - hr * 0.9;
    { const m = ctx.getTransform(); P.out = P.out || {}; P.out.head = [m.a * face0 * 5 + m.c * hy + m.e, m.b * face0 * 5 + m.d * hy + m.f]; }
    head(ctx, face0 * 5, hy, hr, P.e || {}, { tilt: P.tilt || 0, cap: dad, mustache: dad, seed, noBlink: P.noBlink, band: P.band });
    const ha = arm(-backSd);
    if (P.cane) {
      const h = P.out[P.cane];
      // cane in local coords from the front hand to the ground
      ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = "#5a4636"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(ha[0], ha[1]); ctx.lineTo(ha[0] + 8, -hipY); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  // big head for close-ups, with shoulders
  function close(ctx, x, y, r, e, o = {}) {
    ctx.save(); ctx.translate(x, y);
    solid(ctx, () => { ctx.beginPath(); ctx.moveTo(-r * 2.2, r * 3); ctx.bezierCurveTo(-r * 2.1, r * 1.3, -r * 1.2, r * 1.05, 0, r * 1.05); ctx.bezierCurveTo(r * 1.2, r * 1.05, r * 2.1, r * 1.3, r * 2.2, r * 3); ctx.closePath(); }, 4);
    head(ctx, 0, 0, r, e, Object.assign({ seed: 2 }, o));
    ctx.restore();
  }

  window.SIL = { sil, close, head, face, solid, limb, circle, INK, RIM };
})();
