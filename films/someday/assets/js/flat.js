// Flat, softly lit sets for SOMEDAY: apartment, list, phone, calendar, fretboard, dad's house, road, beach.
(function () {
  const { G, clamp, lerp, mulberry, noise1, E } = F;
  const { circle, solid, limb, INK } = SIL;
  const FL = 840;
  const UI = "'Inter', sans-serif";

  const rr = (ctx, x, y, w, h, r, fill, stroke) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } };
  const grad = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  function glow(ctx, x, y, r, rgba) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function txt(ctx, s, x, y, size, color, align = "center", weight = 600, font = UI) {
    ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(s, x, y);
  }

  // ---------- window with sky
  function windowSky(ctx, x, y, w, h, night, o = {}) {
    ctx.save();
    rr(ctx, x - 10, y - 10, w + 20, h + 20, 6, night ? "#3a3e48" : "#f4f5f7");
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = night ? grad(ctx, 0, y, 0, y + h, [[0, "#141a2c"], [1, "#2c3550"]]) : grad(ctx, 0, y, 0, y + h, [[0, "#9cc4e8"], [1, "#dcebf6"]]);
    ctx.fillRect(x, y, w, h);
    const r = mulberry(o.seed || 3);
    let bx = x - 20;
    while (bx < x + w) {
      const bw = 40 + r() * 60, bh = 40 + r() * h * 0.45;
      ctx.fillStyle = night ? "#1c2234" : "rgba(150,170,195,0.6)"; ctx.fillRect(bx, y + h - bh, bw, bh);
      if (night) for (let wy = y + h - bh + 10; wy < y + h - 6; wy += 16) for (let wx = bx + 6; wx < bx + bw - 8; wx += 13) if (r() > 0.75) { ctx.fillStyle = "rgba(255,214,150,0.7)"; ctx.fillRect(wx, wy, 5, 7); }
      bx += bw + 6;
    }
    if (!night) { ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.ellipse(x + w * 0.3 + G.t * 3 % w, y + h * 0.25, 60, 16, 0, 0, 7); ctx.fill(); }
    else { circle(ctx, x + w * 0.75, y + h * 0.22, 18); ctx.fillStyle = "#eceae2"; ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = night ? "#3a3e48" : "#f4f5f7";
    ctx.fillRect(x + w / 2 - 5, y, 10, h); ctx.fillRect(x, y + h / 2 - 5, w, 10);
  }

  // ---------- the apartment (living area left, kitchen right)
  function apartment(ctx, o = {}) {
    const n = !!o.night;
    ctx.fillStyle = n ? grad(ctx, 0, -300, 0, FL, [[0, "#1f222b"], [1, "#30343f"]]) : grad(ctx, 0, -300, 0, FL, [[0, "#c6cad1"], [1, "#e6e8ec"]]);
    ctx.fillRect(-400, -400, 2800, FL + 400);
    ctx.fillStyle = n ? "#16181d" : grad(ctx, 0, FL, 0, 1200, [[0, "#9ea3ab"], [1, "#7d828a"]]);
    ctx.fillRect(-400, FL, 2800, 700);
    ctx.fillStyle = n ? "#262930" : "#d9dce1"; ctx.fillRect(-400, FL - 16, 2800, 16);
    // living area
    windowSky(ctx, 260, 230, 380, 300, n, { seed: 4 });
    ctx.fillStyle = n ? "#3b3346" : "#c8cbd6";
    ctx.fillRect(220, 200, 30, 380); ctx.fillRect(650, 200, 30, 380);
    // sofa
    rr(ctx, 280, 620, 560, 120, 26, n ? "#2a3140" : "#7f8ca0");
    rr(ctx, 300, 690, 520, 90, 18, n ? "#323a4c" : "#909db1");
    rr(ctx, 255, 660, 70, 140, 22, n ? "#2a3140" : "#7f8ca0"); rr(ctx, 795, 660, 70, 140, 22, n ? "#2a3140" : "#7f8ca0");
    ctx.fillStyle = n ? "#111" : "#5d6676"; ctx.fillRect(300, 800, 14, 40); ctx.fillRect(806, 800, 14, 40);
    // floor lamp
    ctx.fillStyle = n ? "#444" : "#6a6f78"; ctx.fillRect(960, 470, 6, 370); ctx.fillRect(930, 834, 66, 8);
    ctx.beginPath(); ctx.moveTo(925, 470); ctx.lineTo(1001, 470); ctx.lineTo(985, 420); ctx.lineTo(941, 420); ctx.closePath(); ctx.fillStyle = n ? "#e9d8b0" : "#efe9dc"; ctx.fill();
    if (o.lamp) glow(ctx, 963, 520, 520, `rgba(255,210,150,${0.32 * o.lamp})`);
    // guitar in the corner
    guitar(ctx, 1080, 840, o.dust ?? 0, n);
    // kitchen
    rr(ctx, 1200, 300, 250, 540, 16, n ? "#7c818a" : "#f2f3f5", n ? "#5a5e66" : "#cfd3d9");
    ctx.fillStyle = n ? "#5a5e66" : "#cfd3d9"; ctx.fillRect(1200, 470, 250, 4);
    rr(ctx, 1418, 330, 10, 110, 5, n ? "#9aa0a8" : "#b9bec6"); rr(ctx, 1418, 500, 10, 140, 5, n ? "#9aa0a8" : "#b9bec6");
    // the list on the fridge
    ctx.save(); ctx.translate(1300, 370); ctx.rotate(-0.04);
    ctx.fillStyle = n ? "#b9bbc0" : "#ffffff"; ctx.fillRect(-60, -10, 120, 160);
    ctx.fillStyle = "#c0392b"; circle(ctx, 0, -4, 7); ctx.fill();
    ctx.strokeStyle = "rgba(60,70,100,0.7)"; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-44, 20 + i * 20); ctx.lineTo(-44 + 70 + (i % 3) * 12, 20 + i * 20); ctx.stroke(); }
    if (o.photo) { ctx.fillStyle = "#e9e2d0"; ctx.fillRect(-56, 170, 100, 80); ctx.fillStyle = "#7fb3d9"; ctx.fillRect(-50, 176, 88, 40); ctx.fillStyle = "#e3cf9d"; ctx.fillRect(-50, 216, 88, 28); ctx.fillStyle = INK; circle(ctx, -18, 210, 7); ctx.fill(); circle(ctx, 8, 212, 6); ctx.fill(); }
    ctx.restore();
    // counter + cabinets
    ctx.fillStyle = n ? "#3a3e48" : "#b9bec6"; ctx.fillRect(1460, 640, 760, 200);
    ctx.fillStyle = n ? "#4a4f5a" : "#d7dadf"; ctx.fillRect(1450, 626, 780, 18);
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = n ? "#2a2d34" : "#9ea3ab"; ctx.lineWidth = 3; ctx.strokeRect(1480 + i * 185, 664, 170, 160); ctx.fillStyle = n ? "#6a6f78" : "#7d828a"; ctx.fillRect(1550 + i * 185, 690, 30, 5); }
    ctx.fillStyle = n ? "#2c3038" : "#cfd3d9"; ctx.fillRect(1480, 260, 700, 150);
    windowSky(ctx, 1700, 440, 240, 150, n, { seed: 9 });
    // kettle & mug
    rr(ctx, 1520, 576, 70, 52, 14, n ? "#5a5e66" : "#e9ebee"); rr(ctx, 1620, 594, 34, 34, 6, n ? "#6a6f78" : "#ffffff");
    if (n && o.kitchenLight) glow(ctx, 1700, 560, 520, `rgba(255,215,160,${0.22 * o.kitchenLight})`);
  }
  function guitar(ctx, x, y, dust, n) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.14);
    ctx.fillStyle = n ? "#4a3022" : "#8a5a3a";
    ctx.beginPath(); ctx.ellipse(0, -70, 58, 64, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -150, 44, 46, 0, 0, 7); ctx.fill();
    ctx.fillStyle = n ? "#24160f" : "#3a2418"; circle(ctx, 0, -118, 16); ctx.fill();
    ctx.fillStyle = n ? "#2a1a12" : "#5a3a26"; ctx.fillRect(-8, -330, 16, 180); ctx.fillRect(-14, -364, 28, 40);
    if (dust > 0) { const r = mulberry(8); ctx.fillStyle = `rgba(220,220,215,${0.5 * dust})`; for (let i = 0; i < 60; i++) ctx.fillRect(-50 + r() * 100, -200 + r() * 180, 2, 2); }
    ctx.restore();
  }

  // ---------- the SOMEDAY list (close-up)
  function list(ctx, o = {}) {
    ctx.fillStyle = grad(ctx, 0, 0, 0, 1080, [[0, "#e8eaee"], [1, "#cfd3d9"]]); ctx.fillRect(0, 0, 1920, 1080);
    ctx.fillStyle = "rgba(0,0,0,0.05)"; ctx.fillRect(1540, 0, 18, 1080);
    ctx.save(); ctx.translate(960, 540); ctx.rotate(-0.025);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.fillStyle = "#fffefa"; ctx.fillRect(-380, -440, 760, 880); ctx.restore();
    ctx.fillStyle = "#c0392b"; circle(ctx, 0, -420, 16); ctx.fill();
    ctx.strokeStyle = "rgba(120,150,200,0.25)"; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(-340, -260 + i * 62); ctx.lineTo(340, -260 + i * 62); ctx.stroke(); }
    ctx.font = `700 96px ${F.FONT.hand}`; ctx.fillStyle = "#26324f"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("SOMEDAY", 0, -340);
    ctx.strokeStyle = "#26324f"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-170, -290); ctx.lineTo(170, -290); ctx.stroke();
    const items = o.items || [];
    items.forEach((it, i) => {
      const y = -200 + i * 112;
      const k = clamp(o.reveal != null ? o.reveal * items.length - i : 1, 0, 1);
      if (k <= 0) return;
      ctx.font = `600 72px ${F.FONT.hand}`; ctx.textAlign = "left"; ctx.fillStyle = "#26324f";
      const shown = it.slice(0, Math.ceil(it.length * k));
      ctx.fillText("– " + shown, -300, y);
      const cross = (o.crossed || [])[i] || 0;
      if (cross > 0) {
        const w = ctx.measureText("– " + it).width;
        ctx.strokeStyle = "#2f8f55"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-300, y + 4); ctx.lineTo(-300 + w * clamp(cross * 1.4, 0, 1), y + 4); ctx.stroke();
        if (cross > 0.7) { ctx.beginPath(); ctx.moveTo(-300 + w + 30, y); ctx.lineTo(-300 + w + 48, y + 22); ctx.lineTo(-300 + w + 86, y - 26); ctx.lineWidth = 9; ctx.stroke(); }
      }
    });
    ctx.restore();
  }

  // ---------- phone (close-up). st.mode: 'call' | 'text' | 'active' | 'lock'
  function phone(ctx, cx, cy, sc, rot, st = {}) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0); ctx.scale(sc, sc);
    const W = 520, H = 1020;
    rr(ctx, -W / 2 - 14, -H / 2 - 14, W + 28, H + 28, 64, "#101114");
    ctx.save(); ctx.beginPath(); ctx.roundRect(-W / 2, -H / 2, W, H, 52); ctx.clip();
    ctx.fillStyle = grad(ctx, 0, -H / 2, 0, H / 2, [[0, "#22355a"], [1, "#1a2847"]]); ctx.fillRect(-W / 2, -H / 2, W, H);
    txt(ctx, st.date || "Tue, Mar 4", 0, -330, 34, "#dfe6f2", "center", 500);
    if (st.mode === "call" || st.mode === "active") {
      circle(ctx, 0, -150, 90); ctx.fillStyle = "#3a4d74"; ctx.fill();
      ctx.save(); ctx.translate(0, -150); SIL.head(ctx, 0, 6, 50, { eyes: "open", look: [0, 0], smile: true }, { cap: true, mustache: true, noBlink: true }); ctx.restore();
      txt(ctx, "Dad", 0, 0, 78, "#f4f6fa", "center", 700);
      txt(ctx, st.mode === "active" ? st.timer || "00:01" : "incoming call", 0, 70, 34, "#b9c6dc", "center", 500);
      if (st.mode === "call") {
        circle(ctx, -130, 330, 58); ctx.fillStyle = "#e5484d"; ctx.fill(); txt(ctx, "Decline", -130, 420, 26, "#dfe6f2", "center", 500);
        circle(ctx, 130, 330, 58 * (1 + 0.05 * Math.sin(G.t * 8))); ctx.fillStyle = "#2fbf68"; ctx.fill(); txt(ctx, "Accept", 130, 420, 26, "#dfe6f2", "center", 500);
      } else { circle(ctx, 0, 330, 58); ctx.fillStyle = "#e5484d"; ctx.fill(); }
    } else if (st.mode === "text") {
      txt(ctx, "Dad", 0, -270, 44, "#f4f6fa", "center", 700);
      let y = 140;
      for (const m of (st.msgs || []).slice().reverse()) {
        ctx.font = `500 32px ${UI}`; const w = ctx.measureText(m.text).width + 48;
        const me = m.who === "me";
        rr(ctx, me ? W / 2 - 30 - w : -W / 2 + 30, y - 70, w, 64, 28, me ? "#3b82f6" : "#33456b");
        txt(ctx, m.text, (me ? W / 2 - 30 - w : -W / 2 + 30) + w / 2, y - 38, 32, "#f4f6fa", "center", 500);
        y -= 86;
      }
      rr(ctx, -W / 2 + 24, 190, W - 48, 70, 35, "rgba(255,255,255,0.1)");
      txt(ctx, st.input || "", -W / 2 + 56, 225, 32, "#f4f6fa", "left", 500);
    }
    ctx.restore();
    ctx.restore();
  }
  // black silhouette hand with a pointing thumb at (x, y) in screen space
  function thumb(ctx, x, y, o = {}) {
    ctx.save();
    limb(ctx, [[x + 260, y + 520], [x + 120, y + 250], [x + 12, y + 10]], 46);
    solid(ctx, () => { ctx.beginPath(); ctx.ellipse(x + 150, y + 300, 90, 120, -0.5, 0, 7); }, 3);
    ctx.restore();
  }

  // ---------- calendar with green checks
  function calendar(ctx, checked, o = {}) {
    ctx.fillStyle = grad(ctx, 0, 0, 0, 1080, [[0, "#d8dce2"], [1, "#bfc4cc"]]); ctx.fillRect(0, 0, 1920, 1080);
    ctx.save(); ctx.translate(960, 560); ctx.rotate(0.02);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 30; ctx.fillStyle = "#fbfbf8"; ctx.fillRect(-560, -400, 1120, 820); ctx.restore();
    ctx.fillStyle = "#2f4a78"; ctx.fillRect(-560, -400, 1120, 130);
    txt(ctx, o.title || "ONE THING A DAY", 0, -335, 64, "#ffffff", "center", 800);
    for (let i = 0; i < 28; i++) {
      const cx = -480 + (i % 7) * 160, cy = -200 + Math.floor(i / 7) * 150;
      ctx.strokeStyle = "#c9ced6"; ctx.lineWidth = 2; ctx.strokeRect(cx - 70, cy - 60, 140, 130);
      txt(ctx, String(i + 1), cx - 46, cy - 38, 26, "#6a7383", "center", 600);
      const k = clamp(checked - i, 0, 1);
      if (k > 0) {
        ctx.strokeStyle = "#2f8f55"; ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(cx - 34, cy + 6); ctx.lineTo(cx - 6, cy + 34 * Math.min(1, k * 2)); if (k > 0.5) ctx.lineTo(cx - 6 + 48 * (k - 0.5) * 2, cy + 34 - 70 * (k - 0.5) * 2); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- fretboard close-up: chord shapes as black fingertips
  const CHORDS = { C: [[2, 1], [4, 2], [5, 3]], G: [[5, 2], [6, 3], [1, 3]], Am: [[2, 1], [3, 2], [4, 2]], F: [[1, 1], [2, 1], [3, 2], [4, 3], [5, 3], [6, 1]] };
  function fretboard(ctx, chord, o = {}) {
    ctx.fillStyle = grad(ctx, 0, 0, 0, 1080, [[0, "#2a2426"], [1, "#151215"]]); ctx.fillRect(0, 0, 1920, 1080);
    if (o.lamp) glow(ctx, 900, 300, 900, "rgba(255,210,150,0.25)");
    ctx.save(); ctx.translate(960, 520); ctx.rotate(-0.06);
    ctx.fillStyle = "#3a2418"; ctx.fillRect(-900, -150, 1800, 300);
    for (let f = 0; f < 6; f++) { ctx.fillStyle = "#c9c9c4"; ctx.fillRect(-760 + f * 300, -150, 8, 300); }
    for (let f = 0; f < 5; f++) if (f % 2 === 0 && f) { circle(ctx, -610 + f * 300, 0, 12); ctx.fillStyle = "#d9d2c0"; ctx.fill(); }
    for (let s = 0; s < 6; s++) { ctx.fillStyle = `rgba(230,225,210,${0.6 + s * 0.06})`; ctx.fillRect(-900, -125 + s * 50, 1800, 2 + s * 0.6); }
    const k = o.k ?? 1;
    (CHORDS[chord] || []).forEach(([str, fret], i) => {
      const a = clamp(k * 4 - i, 0, 1); if (a <= 0) return;
      const x = -760 + (fret - 0.5) * 300, y = -125 + (str - 1) * 50;
      ctx.save(); ctx.globalAlpha = a;
      limb(ctx, [[x + 60, y + 300], [x + 14, y + 70], [x, y]], 56);
      ctx.restore();
    });
    ctx.restore();
    txt(ctx, chord, 1640, 220, 120, "#f2f2ee", "center", 300, "'EB Garamond', serif");
    if (o.day) txt(ctx, o.day, 1640, 320, 40, "#bfc4cc", "center", 400, "'EB Garamond', serif");
  }

  // ---------- dad's house, daytime
  function dadHouse(ctx, o = {}) {
    ctx.fillStyle = grad(ctx, 0, -300, 0, FL, [[0, "#8fb9e0"], [1, "#e4eef6"]]); ctx.fillRect(-400, -400, 2800, FL + 400);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse((i * 520 + G.t * 6) % 2600 - 300, 140 + (i % 2) * 60, 120, 26, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = grad(ctx, 0, FL, 0, 1200, [[0, "#86a86a"], [1, "#6d8f55"]]); ctx.fillRect(-400, FL, 2800, 700);
    ctx.fillStyle = "#c9c9c4"; ctx.fillRect(-400, FL + 60, 2800, 40);
    // house
    ctx.fillStyle = "#e8dcc4"; ctx.fillRect(500, 420, 760, 420);
    ctx.fillStyle = "#8a4a3a"; ctx.beginPath(); ctx.moveTo(460, 430); ctx.lineTo(880, 220); ctx.lineTo(1300, 430); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#6a4a3a"; ctx.fillRect(820, 600, 120, 240);
    circle(ctx, 920, 720, 6); ctx.fillStyle = "#d9c08a"; ctx.fill();
    for (const wx of [580, 1060]) { windowSky(ctx, wx, 520, 130, 110, false, { seed: wx }); }
    ctx.fillStyle = "#d9cdb4"; ctx.fillRect(780, 800, 200, 20); ctx.fillRect(760, 820, 240, 20);
    // tree + mailbox
    ctx.fillStyle = "#5a4636"; ctx.fillRect(1500, 520, 30, 320);
    ctx.fillStyle = "#6f9a5a"; for (const [dx, dy, r] of [[0, -40, 120], [-80, 20, 90], [80, 30, 95]]) { circle(ctx, 1515 + dx, 470 + dy, r); ctx.fill(); }
    ctx.fillStyle = "#555"; ctx.fillRect(380, 720, 10, 120); rr(ctx, 350, 680, 70, 44, 10, "#3a6aa0");
    if (o.car) carSide(ctx, 1750, FL + 70, 1.1);
  }
  function carSide(ctx, x, y, s, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = o.color || "#b8452f";
    ctx.beginPath(); ctx.moveTo(-230, -40); ctx.lineTo(-215, -110); ctx.lineTo(-120, -122); ctx.lineTo(-60, -190); ctx.lineTo(120, -190); ctx.lineTo(190, -122); ctx.lineTo(240, -110); ctx.lineTo(250, -40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#cfe0ee"; ctx.beginPath(); ctx.moveTo(-50, -178); ctx.lineTo(40, -178); ctx.lineTo(40, -128); ctx.lineTo(-100, -128); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(55, -178); ctx.lineTo(115, -178); ctx.lineTo(165, -128); ctx.lineTo(55, -128); ctx.closePath(); ctx.fill();
    for (const wx of [-140, 160]) { circle(ctx, wx, -36, 40); ctx.fillStyle = "#1a1a1e"; ctx.fill(); circle(ctx, wx, -36, 16); ctx.fillStyle = "#9a9aa0"; ctx.fill(); }
    if (o.guitar) { ctx.fillStyle = "#8a5a3a"; ctx.beginPath(); ctx.ellipse(-10, -215, 60, 22, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  // ---------- the road at sunset (perspective, from behind the car)
  function road(ctx, t, o = {}) {
    const HZ = 470;
    const sunset = o.mode !== "morning";
    ctx.fillStyle = sunset ? grad(ctx, 0, 0, 0, HZ, [[0, "#3a3466"], [0.6, "#d0707a"], [1, "#f6b26b"]]) : grad(ctx, 0, 0, 0, HZ, [[0, "#7fb2e0"], [1, "#e9f2f8"]]);
    ctx.fillRect(0, 0, 1920, HZ + 2);
    if (sunset) glow(ctx, 960, HZ - 20, 420, "rgba(255,220,160,0.75)");
    ctx.fillStyle = sunset ? "#4a3a5a" : "#7a9aa8";
    ctx.beginPath(); ctx.moveTo(0, HZ); for (let x = 0; x <= 1920; x += 60) ctx.lineTo(x, HZ - 40 - Math.sin(x * 0.006) * 30 - Math.sin(x * 0.017) * 14); ctx.lineTo(1920, HZ); ctx.closePath(); ctx.fill();
    ctx.fillStyle = sunset ? "#2a2430" : "#7f9a6a"; ctx.fillRect(0, HZ, 1920, 1080 - HZ);
    ctx.fillStyle = sunset ? "#1d1a22" : "#55595f";
    ctx.beginPath(); ctx.moveTo(940, HZ); ctx.lineTo(980, HZ); ctx.lineTo(1700, 1080); ctx.lineTo(220, 1080); ctx.closePath(); ctx.fill();
    // dashes rushing toward us
    for (let i = 0; i < 14; i++) {
      const z = ((i / 14 + t * 0.6) % 1);
      const p = z * z;
      const y = HZ + p * (1080 - HZ), y2 = HZ + Math.min(1, (z + 0.03) * (z + 0.03)) * (1080 - HZ);
      const w = 2 + p * 16;
      ctx.fillStyle = sunset ? "rgba(255,225,170,0.8)" : "#f2f2ee"; ctx.fillRect(960 - w / 2, y, w, y2 - y);
    }
    // poles passing on the right
    for (let i = 0; i < 6; i++) {
      const z = ((i / 6 + t * 0.35) % 1), p = z * z;
      const x = 1000 + p * 1100, yb = HZ + p * (1080 - HZ), h = 20 + p * 600;
      ctx.fillStyle = sunset ? "#1a1620" : "#5a5a60"; ctx.fillRect(x, yb - h, 3 + p * 14, h);
    }
    // the car from behind
    if (o.car !== false) {
      const cx = 960 + noise1(t * 0.8, 3) * 6, cy = 900;
      ctx.fillStyle = "#14121a"; rr(ctx, cx - 160, cy - 140, 320, 150, 30, "#14121a");
      rr(ctx, cx - 120, cy - 220, 240, 100, 30, "#1a1822");
      ctx.fillStyle = "rgba(255,200,150,0.25)"; rr(ctx, cx - 100, cy - 205, 200, 70, 16, "rgba(255,200,160,0.18)");
      for (const sd of [-1, 1]) { ctx.save(); ctx.fillStyle = "#ff4a3a"; ctx.shadowColor = "#ff4a3a"; ctx.shadowBlur = 26; ctx.fillRect(cx + sd * 120 - 22, cy - 100, 44, 18); ctx.restore(); }
      // two heads through the rear window
      circle(ctx, cx - 45, cy - 168, 26); ctx.fillStyle = INK; ctx.fill();
      circle(ctx, cx + 48, cy - 166, 25); ctx.fill();
      ctx.fillStyle = "#3b3d44"; ctx.beginPath(); ctx.ellipse(cx + 48, cy - 186, 28, 9, 0, 0, 7); ctx.fill();
    }
  }

  // ---------- the beach
  function beach(ctx, o = {}) {
    const HZ = 460;
    ctx.fillStyle = grad(ctx, 0, -200, 0, HZ, [[0, "#6fa9de"], [1, "#e6f1f8"]]); ctx.fillRect(-400, -400, 2800, HZ + 400);
    glow(ctx, 1500, 150, 360, "rgba(255,250,230,0.85)");
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 5; i++) { const x = ((i * 520 + G.t * 8) % 2800) - 400; ctx.beginPath(); ctx.ellipse(x, 120 + (i % 3) * 70, 150, 30, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 70, 105 + (i % 3) * 70, 90, 30, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = grad(ctx, 0, HZ, 0, 720, [[0, "#3b78ad"], [1, "#6fb0d8"]]); ctx.fillRect(-400, HZ, 2800, 300);
    ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) { const y = HZ + 20 + i * 26 + (i * i) * 2; ctx.beginPath(); for (let x = -400; x < 2400; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.01 + G.t * 1.5 + i) * (2 + i * 0.6)); ctx.stroke(); }
    // shoreline with a breathing wave
    const sw = Math.sin(G.t * 0.9) * 24;
    ctx.fillStyle = grad(ctx, 0, 700, 0, 1200, [[0, "#ecdcb4"], [1, "#d8c291"]]);
    ctx.beginPath(); ctx.moveTo(-400, 730 + sw); for (let x = -400; x <= 2400; x += 40) ctx.lineTo(x, 730 + sw + Math.sin(x * 0.006 + G.t) * 10); ctx.lineTo(2400, 1500); ctx.lineTo(-400, 1500); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 8;
    ctx.beginPath(); for (let x = -400; x <= 2400; x += 40) ctx.lineTo(x, 728 + sw + Math.sin(x * 0.006 + G.t) * 10); ctx.stroke();
    ctx.fillStyle = "rgba(110,170,210,0.35)";
    ctx.beginPath(); ctx.moveTo(-400, 730 + sw); for (let x = -400; x <= 2400; x += 40) ctx.lineTo(x, 730 + sw + Math.sin(x * 0.006 + G.t) * 10 + 30 + Math.sin(x * 0.02 + G.t * 2) * 8); ctx.lineTo(2400, 730); ctx.lineTo(-400, 730); ctx.closePath(); ctx.fill();
    // gulls
    ctx.strokeStyle = "#3a4250"; ctx.lineWidth = 3; ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) { const x = ((G.t * 40 + i * 300) % 2400) - 200, y = 200 + i * 40 + Math.sin(G.t + i) * 10, f = Math.sin(G.t * 6 + i) * 6; ctx.beginPath(); ctx.moveTo(x - 16, y - f); ctx.quadraticCurveTo(x - 6, y - 8, x, y); ctx.quadraticCurveTo(x + 6, y - 8, x + 16, y - f); ctx.stroke(); }
  }

  window.FLAT = { FL, apartment, guitar, list, phone, thumb, calendar, fretboard, CHORDS, dadHouse, carSide, road, beach, glow, txt, grad, rr, windowSky };
})();
