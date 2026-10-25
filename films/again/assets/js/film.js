// AGAIN. — shot list, timing and the renderAt(t) entry point.
(function () {
  const { W, H, PAL, G, clamp, lerp, E, prog, key, win, noise1 } = F;
  const { drawHead, drawPerson } = C;
  const { narr, hand, hud, bubble, post, sepia } = X;
  const RED = S2.RED;

  const DURATION = 248;

  function cam(ctx, cx, cy, z) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }
  function shake(t, a, b, amp) { const k = win(t, a, b, 0, b - a); return [noise1(t * 40, 1) * amp * k, noise1(t * 40, 2) * amp * k]; }
  const screen = (ctx, f) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); f(); ctx.restore(); };
  // approximate head centre of a seated person (world coords)
  function headPos(P) {
    const L = { maeOld: [94, 62], maeYoung: [94, 62], leoOld: [98, 66], leoYoung: [102, 68] }[P.kind];
    return [P.x + (P.face || 0) * 4 * P.s, P.y + (-12 - L[0] - L[1] * 0.78) * P.s];
  }

  // ---------- HUD timeline: [time, season, firstDates, remembered, visible]
  function hudAt(t) {
    const K = [
      [7.5, "SPRING", 1203, 0, 1], [42.0, "SPRING", 1203, 0, 0], [72.0, "SPRING", 1204, 0, 1], [84.0, "SUMMER", 1290, 0, 1],
      [91.0, "AUTUMN", 1371, 0, 1], [97.0, "AUTUMN", 1402, 0, 1], [104.0, "AUTUMN", 1431, 0, 1], [122.0, "AUTUMN", 1431, 0, 0],
      [140.0, "WINTER", 1459, 0, 1], [157.0, "WINTER", 1459, 0, 0], [167.0, "WINTER", 1459, 0, 1], [185.2, "WINTER", 1460, 1, 1],
      [192.0, "WINTER", 1460, 1, 0], [210.0, "SPRING", 1461, 1, 1], [226.0, "SPRING", 1461, 1, 0],
    ];
    if (t < 7.5) return null;
    let cur = K[0], prev = null;
    for (const k of K) if (t >= k[0]) { prev = cur; cur = k; }
    const since = t - cur[0];
    let n = cur[2], fD = 0, fS = 0;
    if (prev && prev[2] !== cur[2] && since < 1.2 && prev[4] && cur[4]) {
      n = Math.round(lerp(prev[2], cur[2], E.out3(clamp(since / 0.9, 0, 1))));
      fD = Math.max(0, 1 - since / 0.5);
    }
    if (prev && prev[3] !== cur[3] && since < 1.4) fS = Math.max(0, 1 - since / 1.2);
    let alpha = cur[4];
    if (prev && prev[4] !== cur[4]) alpha = cur[4] ? clamp(since / 0.4, 0, 1) : 1 - clamp(since / 0.3, 0, 1);
    return { label: cur[1], drafts: n.toLocaleString("en-US"), sent: cur[3], fD, fS, alpha, l1: "FIRST DATES", l2: "REMEMBERED", bw: 330, sCol: cur[3] > 0 ? RED : "#f1f1f1" };
  }

  const SHOTS = [];
  const shot = (a, b, f, o = {}) => SHOTS.push(Object.assign({ a, b, f }, o));

  // reusable people
  const maeChair = (o = {}) => Object.assign({ kind: "maeOld", x: 600, y: 700, s: 1.05, pose: "sit", face: 0.5, legDir: 1, legDrop: 62, armL: [0.5, 1.4], armR: [-0.5, -1.4], lean: 0.04 }, o);
  function teaInHand(ctx, P, side = "R") { const h = P.out && P.out[side]; if (h) screen(ctx, () => S2.teacup(ctx, h[0] + 4, h[1] - 6, 0.8)); }

  // 0 — COLD OPEN
  shot(0, 7.5, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [
      { text: "Every morning, he met his wife for the first time.", size: 46, weight: "400" },
      { text: "She never remembered him.", size: 60, delay: 2.1 },
    ], t, 0.6, 7.0, { center: true, gap: 1.45 });
  }, { look: { vignette: 0 } });

  // 1 — MORNING: "good morning. i'm Leo."
  shot(7.5, 21.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 820, 600, key(lt, [[0, 1.25], [13.5, 1.38, E.sine]]));
    S2.livingRoom(ctx, { lamp: 0.4 });
    S2.armchair(ctx, 600, "back");
    const mae = maeChair({ e: { eyes: "dot", look: [lt > 3 ? 0.9 : 0.1, -0.1], brow: lt > 7 ? 0.5 : 0.1, mouth: lt > 7 ? "small" : "flat", blinkSeed: 4 }, tilt: lt > 7 ? 0.08 : 0 });
    drawPerson(ctx, mae);
    S2.armchair(ctx, 600, "front");
    S2.sideTable(ctx, 860, { book: true, cup: lt > 6 });
    const walkK = prog(lt, 0.6, 4.0, E.out2);
    const leo = { kind: "leoOld", x: lerp(1500, 1080, walkK), y: 822, s: 1.05, face: -0.6, walk: walkK * 3.5,
      armL: [0.3, 0.2], armR: lt < 5 ? [-1.1, -1.2] : [key(lt, [[5, -1.1], [6, -0.2]]), key(lt, [[5, -1.2], [6, -0.2]])],
      e: { eyes: lt > 10.8 ? "happy" : "dot", look: [-0.9, 0], brow: 0.2, mouth: "smile" }, tilt: -0.04 };
    drawPerson(ctx, leo);
    ctx.restore();
    if (lt < 5.2) teaInHand(ctx, leo, "R");
    bubble(ctx, "good morning. i'm Leo.", 1140, 330, t, 11.5, 14.6, { size: 34, tail: [-40, 70] });
    bubble(ctx, "...do i know you?", 560, 340, t, 14.9, 17.9, { size: 34, tail: [30, 70] });
    bubble(ctx, "not yet.", 1100, 330, t, 18.2, 20.9, { size: 38, tail: [-40, 70] });
  });

  // 2 — his face
  shot(21.0, 28.0, (ctx, lt, t) => {
    ctx.fillStyle = "#0c0c10"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(700, 300, 50, 900, 500, 1100);
    g.addColorStop(0, "rgba(210,220,255,0.18)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(960, 560); const z = 1 + 0.04 * prog(lt, 0, 7, E.sine); ctx.scale(z, z);
    bodyClose(ctx, "#6b5a48");
    drawHead(ctx, 0, -40, 280, { eyes: lt > 2.5 ? "teary" : "dot", look: [-0.4, 0], brow: 0.6, mouth: "small", tear: prog(lt, 3.5, 6.5) * 0.5 }, { kind: "leoOld", seed: 29 });
    ctx.restore();
    narr(ctx, [{ text: "Three years ago, she started to forget." }], t, 22.0, 27.6);
  });

  // 3 — Forgetting covers her eyes
  shot(28.0, 42.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 720, 560, key(lt, [[0, 1.6], [14, 1.72, E.sine]]));
    S2.livingRoom(ctx, { lamp: 0.3, photoFade: prog(lt, 7.5, 11) });
    const mae = maeChair({ e: { eyes: lt > 9 ? "half" : "dot", look: [0.2, 0], brow: 0.3, mouth: "flat" } });
    const hp = headPos(mae);
    S2.drawForget(ctx, 600, 830, { alpha: prog(lt, 0.5, 3), s: 1.15, reach: { k: prog(lt, 4, 9.5, E.io2), x: (hp[0] - 600) / 1.15, y: (hp[1] - 830) / 1.15 } });
    S2.armchair(ctx, 600, "back");
    drawPerson(ctx, mae);
    S2.armchair(ctx, 600, "front");
    // Forgetting's hands over her eyes, in front
    const rk = prog(lt, 4, 9.5, E.io2);
    if (rk > 0.6) {
      ctx.save(); ctx.globalAlpha = (rk - 0.6) / 0.4 * 0.85;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hp[0] + sd * 26, hp[1], 30, 20, sd * 0.3, 0, Math.PI * 2); ctx.fillStyle = "rgba(220,226,242,0.75)"; ctx.fill(); ctx.strokeStyle = "rgba(235,240,252,0.95)"; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.restore();
    }
    S2.sideTable(ctx, 860, { book: true, cup: true, steam: 0.4 });
    ctx.restore();
    S2.fog(ctx, prog(lt, 1, 6) * 0.8);
    narr(ctx, [{ text: "First the names. Then the faces." }], t, 30.0, 34.6);
    narr(ctx, [{ text: "Then him.", size: 52 }], t, 35.6, 40.6);
  });

  // 4a — FLASHBACK: the bench, 1974
  shot(42.0, 52.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 960, 580, key(lt, [[0, 1.12], [10, 1.25, E.sine]]));
    S2.park(ctx, { mode: "past" });
    S2.bench(ctx, "back", { mode: "past" });
    const sitK = prog(lt, 4.2, 5.2);
    drawPerson(ctx, { kind: "maeYoung", x: 830, y: 714, s: 1.05, pose: "sit", face: lt > 6.5 ? 0.6 : 0.2, legDir: 1, legDrop: 48, armL: [0.3, 0.9], armR: [-0.3, -0.9],
      e: { eyes: "dot", look: lt > 6.5 ? [0.8, 0.1] : [0.2, 0.8], brow: 0.1, mouth: lt > 7.5 ? "small" : "flat" } });
    sketchOnLap(ctx, 860, 690, "#e9dcc2");
    const leoX = lt < 4.2 ? lerp(1600, 1090, prog(lt, 0.5, 4.2, E.out2)) : 1090;
    if (lt < 4.4) drawPerson(ctx, { kind: "leoYoung", x: leoX, y: 822, s: 1.08, face: -0.5, walk: lt * 1.1, armL: [0.2, 0.2], armR: [-0.2, -0.1], e: { eyes: "dot", look: [-0.7, 0], mouth: "flat" } });
    else drawPerson(ctx, { kind: "leoYoung", x: 1090, y: lerp(822, 714, sitK), s: 1.08, pose: "sit", face: -0.3, legDir: -1, legDrop: 48, armL: [0.3, 0.3], armR: [-0.3, -0.3],
      e: { eyes: "dot", look: [lt > 7 ? -0.7 : 0.2, 0], brow: lt > 8 ? 0.4 : 0, mouth: "flat" } });
    S2.bench(ctx, "front", { mode: "past" });
    ctx.restore();
    S2.petals(ctx, 26, "rgba(255,210,220,0.9)", { seed: 7 });
    hand(ctx, "spring, 1974", 110, 160, t, 42.6, 51.8, { size: 54, color: "#fff1dc", glow: 0, rot: -0.04 });
  }, { look: { vignette: 0.55, grain: 0.07 } });

  // 4b — she draws him
  shot(52.0, 60.0, (ctx, lt, t) => {
    deskBg(ctx, true);
    S2.sketchbook(ctx, 960, 560, 0.95, { rot: -0.03 });
    const k = prog(lt, 0.4, 5.6, E.lin);
    const tip = S2.pencilPortrait(ctx, 960 - 250, 520, 0.95, "young", k);
    S2.pageText(ctx, "hi, stranger.", 960 - 250, 790, 46, "rgba(60,58,66,0.9)", -0.04, prog(lt, 6.0, 7.4, E.lin));
    const handAt = lt < 5.7 ? tip || [710, 480] : [710 + (lt - 6.0) * 120, 790];
    S2.pencilHand(ctx, handAt[0], handAt[1], { sleeve: "#5f8a6e", rot: -0.45, s: 0.6 });
    sepia(ctx, 0.25);
  }, { look: { vignette: 0.55, grain: 0.07 } });

  // 4c — "is that me?" / the thread appears
  shot(60.0, 72.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 960, 560, key(lt, [[0, 1.55], [12, 1.62, E.sine]]));
    S2.park(ctx, { mode: "past" });
    S2.bench(ctx, "back", { mode: "past" });
    const laugh = lt > 7.6 && lt < 10.5;
    const mae = { kind: "maeYoung", x: 870, y: 714, s: 1.05, pose: "sit", face: 0.7, legDir: 1, legDrop: 48, armL: [0.3, 0.9], armR: [-0.2, -0.3],
      e: { eyes: lt > 4 ? "happy" : "dot", look: [0.9, 0], brow: 0, mouth: lt > 4 ? "smile" : "small", blush: prog(lt, 4, 6) } };
    const leo = { kind: "leoYoung", x: 1050, y: 714, s: 1.08, pose: "sit", face: -0.7, legDir: -1, legDrop: 48, armL: [0.2, 0.3], armR: [-0.3, -0.3],
      lean: laugh ? Math.sin(lt * 10) * 0.02 : 0,
      e: { eyes: laugh ? "happy" : "wide", look: [-0.9, 0.1], brow: 0.3, mouth: laugh ? "grin" : lt < 4 ? "oh" : "smile", blush: prog(lt, 8, 10) * 0.7 } };
    drawPerson(ctx, mae); drawPerson(ctx, leo);
    S2.bench(ctx, "front", { mode: "past" });
    ctx.restore();
    if (mae.out && leo.out) screen(ctx, () => S2.thread(ctx, mae.out.R, leo.out.L, prog(lt, 8.0, 9.5), 50, { k: prog(lt, 8.0, 10.5, E.io2) }));
    S2.petals(ctx, 22, "rgba(255,210,220,0.9)", { seed: 9 });
    bubble(ctx, "is that me?", 1180, 300, t, 60.5, 63.6, { size: 36, tail: [-50, 70] });
    bubble(ctx, "you sat still. you'll do.", 720, 300, t, 64.0, 67.8, { size: 36, tail: [50, 70] });
    narr(ctx, [{ text: "She drew him before she knew his name." }], t, 68.2, 71.8);
  }, { look: { vignette: 0.55, grain: 0.07 } });

  // 5 — present day: back to the bench, arm in arm
  shot(72.0, 84.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 980, 590, key(lt, [[0, 1.1], [12, 1.2, E.sine]]));
    S2.park(ctx, { season: "spring" });
    S2.bench(ctx, "back", { season: "spring" });
    const w = prog(lt, 0, 7.5, E.io2);
    if (lt < 7.6) {
      const x = lerp(1750, 1010, w);
      drawPerson(ctx, { kind: "maeOld", x: x - 70, y: 822, s: 1.0, face: -0.4, walk: lt * 0.8, armL: [0.2, 0.2], armR: [-0.6, -0.4], e: { eyes: "dot", look: [-0.6, 0], mouth: "flat" } });
      drawPerson(ctx, { kind: "leoOld", x: x + 70, y: 822, s: 1.03, face: -0.4, walk: lt * 0.8 + 0.5, armL: [0.7, 0.3], armR: [-0.2, -0.1], cane: "R", e: { eyes: "dot", look: [-0.8, 0], mouth: "smile" } });
    } else {
      const sk = prog(lt, 7.6, 8.6);
      drawPerson(ctx, { kind: "maeOld", x: 870, y: lerp(822, 714, sk), s: 1.0, pose: "sit", face: 0.3, legDir: 1, legDrop: 48, armL: [-0.3, -0.4], armR: [0.3, 0.4], e: { eyes: "dot", look: [0.2, -0.2], mouth: "flat" } });
      drawPerson(ctx, { kind: "leoOld", x: 1060, y: lerp(822, 714, sk), s: 1.03, pose: "sit", face: -0.5, legDir: -1, legDrop: 48, armL: [0.3, 0.3], armR: [-0.3, -0.3], e: { eyes: "dot", look: [-0.9, 0], mouth: "smile" } });
    }
    S2.bench(ctx, "front", { season: "spring" });
    ctx.restore();
    S2.petals(ctx, 18, "rgba(230,170,190,0.8)", { seed: 3 });
    narr(ctx, [{ text: "So every morning, he brought her back to the bench." }], t, 74.0, 80.4);
  });

  // 6 — montage: summer, autumn
  function benchTwo(ctx, lt, season, o = {}) {
    S2.park(ctx, { season });
    S2.bench(ctx, "back", { season });
    const laugh = o.laugh;
    const mae = { kind: "maeOld", x: 870, y: 714, s: 1.0, pose: "sit", face: 0.6, legDir: 1, legDrop: 48, armL: [-0.3, -0.4], armR: [-0.2, -0.3], lean: laugh ? Math.sin(lt * 9) * 0.02 : 0,
      e: { eyes: laugh ? "happy" : "dot", look: [0.9, 0], mouth: laugh ? "grin" : "small", blush: laugh ? 0.6 : 0 } };
    const leo = { kind: "leoOld", x: 1060, y: 714, s: 1.03, pose: "sit", face: -0.6, legDir: -1, legDrop: 48, armL: [0.3, 0.3], armR: [o.talk ? 1.5 + Math.sin(lt * 4) * 0.2 : -0.3, o.talk ? 0.9 : -0.3],
      e: { eyes: o.leoEyes || "dot", look: [-0.9, 0], brow: o.leoBrow ?? 0.2, mouth: o.talk && Math.floor(lt * 7) % 2 ? "open" : "smile" } };
    drawPerson(ctx, mae); drawPerson(ctx, leo);
    S2.bench(ctx, "front", { season });
    return { mae, leo };
  }
  shot(84.0, 91.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 965, 560, key(lt, [[0, 1.5], [7, 1.58, E.sine]]));
    benchTwo(ctx, lt, "summer", { talk: lt < 5.5, laugh: lt > 5.6 });
    ctx.restore();
    bubble(ctx, "...and you said, \"you sat still. you'll do.\"", 1100, 290, t, 84.8, 89.6, { size: 32, tail: [-60, 70] });
  });
  shot(91.0, 97.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 590, key(lt, [[0, 1.2], [6, 1.26, E.sine]]));
    benchTwo(ctx, lt, "autumn", { laugh: lt > 0.6 });
    ctx.restore();
    S2.petals(ctx, 24, "rgba(205,120,60,0.9)", { seed: 11, wind: 60 });
    narr(ctx, [{ text: "She laughed at the same joke every day." }], t, 91.5, 96.6);
  });
  shot(97.0, 104.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 975, 545, key(lt, [[0, 2.1], [7, 2.2, E.sine]]));
    benchTwo(ctx, lt, "autumn", { laugh: true, leoEyes: lt > 2 ? "teary" : "dot", leoBrow: 0.6 });
    ctx.restore();
    S2.petals(ctx, 14, "rgba(205,120,60,0.9)", { seed: 13, wind: 60 });
    narr(ctx, [{ text: "He never got tired of telling it." }], t, 98.0, 103.6);
  });

  // 7 — the bad day
  shot(104.0, 122.0, (ctx, lt, t) => {
    ctx.save();
    const [sx, sy] = shake(lt, 1.4, 2.0, 12);
    cam(ctx, 1020 + sx, 600 + sy, key(lt, [[0, 1.35], [18, 1.5, E.sine]]));
    S2.hallway(ctx, { doorLight: lt < 9 ? 1 : 0.6 });
    S2.drawForget(ctx, 1380, 830, { alpha: prog(lt, 8, 11) * 0.6, s: 1.0 });
    const back = prog(lt, 1.6, 2.6, E.out3), slide = prog(lt, 6, 8.2, E.io2);
    if (lt < 6) drawPerson(ctx, { kind: "leoOld", x: lerp(1000, 1170, back), y: 822, s: 1.05, face: -0.6, armL: lt < 1.6 ? [-1.9, -0.4] : [0.2, 0.2], armR: [-0.2, -0.2],
      e: { eyes: lt > 1.6 ? "wide" : "dot", look: [-0.9, 0], brow: 0.9, mouth: lt > 1.6 ? "oh" : "small" } });
    else drawPerson(ctx, { kind: "leoOld", x: 1170, y: lerp(822, 800, slide), s: 1.05, pose: slide > 0.5 ? "sit" : "stand", face: -0.2, legDir: -1, legDrop: 0, armL: [-0.4, -1.6], armR: [0.4, 1.6],
      e: { eyes: lt > 11 ? "teary" : "half", look: [-0.6, 0.4], brow: 0.8, mouth: "frown", tear: prog(lt, 12, 15) * 0.7 }, tilt: 0.1 });
    ctx.restore();
    bubble(ctx, "who are you?! get out!", 900, 330, t, 105.4, 108.8, { size: 40, fill: "#f6f3ec", tail: [0, 80] });
    narr(ctx, [{ text: "Some days, she was afraid of him." }], t, 112.5, 116.6);
    narr(ctx, [{ text: "He stayed anyway.", size: 50 }], t, 117.5, 121.6);
  });

  // 8 — the sketchbook: forty-eight years of him
  const PAGES = [["young", "1974"], ["mid", "1991"], ["old", "2016"], ["shaky", "2022"], [null, ""]];
  const FLIPS = [126.0, 130.0, 134.0, 136.6];
  shot(122.0, 140.0, (ctx, lt, t) => {
    deskBg(ctx, false);
    const z = 1 + 0.05 * prog(lt, 0, 18, E.sine);
    ctx.save(); ctx.translate(960, 560); ctx.scale(z, z); ctx.translate(-960, -560);
    S2.sketchbook(ctx, 960, 560, 0.95, { rot: 0.02 });
    let idx = 0; for (const f of FLIPS) if (t >= f) idx++;
    const pg = PAGES[idx];
    if (pg[0]) {
      S2.pencilPortrait(ctx, 710, 520, 0.95, pg[0], 1);
      S2.pageText(ctx, pg[1], 710, 800, 44, "rgba(60,58,66,0.85)", -0.04);
      if (pg[0] !== "shaky") S2.pageText(ctx, "Leo", 870, 300, 40, "rgba(60,58,66,0.7)", -0.1);
    }
    // page turn
    for (const f of FLIPS) {
      const k = (t - (f - 0.55)) / 0.55;
      if (k > 0 && k < 1) {
        const w = Math.cos(k * Math.PI) * 494; // right edge sweeps to left
        ctx.save();
        ctx.beginPath(); ctx.moveTo(960, 247); ctx.lineTo(960 + w, 247 - Math.sin(k * Math.PI) * 30); ctx.lineTo(960 + w, 873 + Math.sin(k * Math.PI) * 30); ctx.lineTo(960, 873); ctx.closePath();
        ctx.fillStyle = k < 0.5 ? "#efe7d6" : "#e4dbc7"; ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
    }
    // a teardrop lands on the empty page
    if (t > 138.4) {
      const k = clamp((t - 138.4) / 0.5, 0, 1);
      ctx.save(); ctx.globalAlpha = 0.5 * k; ctx.fillStyle = "rgba(120,140,170,0.6)";
      ctx.beginPath(); ctx.ellipse(700, 560, 26 * E.out3(k), 20 * E.out3(k), 0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // his hand (old, cardigan) resting on the page edge
    ctx.save(); ctx.translate(1380, 900); ctx.rotate(-0.4);
    ctx.beginPath(); ctx.ellipse(0, 0, 60, 46, 0, 0, Math.PI * 2); C.fillOutline(ctx, PAL.cream, 1.4);
    ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(300, 120); ctx.lineTo(260, 260); ctx.lineTo(-40, 60); ctx.closePath(); C.fillOutline(ctx, "#6b5a48", 1.4);
    ctx.restore();
    ctx.restore();
    narr(ctx, [{ text: "She had drawn him for forty-eight years." }], t, 123.4, 128.6, { y: 940 });
    narr(ctx, [{ text: "The last page was empty." }], t, 136.9, 139.9, { y: 940 });
  });

  // 9 — winter: he gets sick
  shot(140.0, 150.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 470, 610, key(lt, [[0, 1.55], [10, 1.68, E.sine]]));
    Pr.theoRoom(ctx, { clock: "6:40", lamp: 0.5, dark: 0.1, rain: false });
    const cough = (lt > 1.2 && lt < 2.0) || (lt > 5.4 && lt < 6.1);
    drawHead(ctx, 250, 680, 62, { eyes: cough ? "closed" : "half", look: [0.3, -0.4], brow: 0.7, mouth: cough ? "open" : "frown" }, { kind: "leoOld", seed: 29, tilt: -0.25 + (cough ? 0.05 * Math.sin(lt * 30) : 0) });
    blanketOld(ctx);
    ctx.restore();
    narr(ctx, [{ text: "That winter, he got sick." }], t, 141.0, 145.0);
    narr(ctx, [{ text: "For the first time in 1,459 days, he couldn't go." }], t, 145.5, 149.8);
  });

  // 10a — she waits alone in the snow
  shot(150.0, 157.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 960, 590, key(lt, [[0, 1.25], [7, 1.35, E.sine]]));
    S2.park(ctx, { season: "winter" });
    S2.bench(ctx, "back", { season: "winter" });
    drawPerson(ctx, { kind: "maeOld", x: 870, y: 714, s: 1.0, pose: "sit", face: lt < 4 ? 0.8 : 0.2, legDir: 1, legDrop: 48, armL: [-0.6, -0.8], armR: [-0.4, -0.6], scarf: "#8a2f35",
      e: { eyes: "dot", look: lt < 4 ? [0.9, 0.1] : [0.1, 0.8], brow: 0.5, mouth: "flat" } });
    sketchOnLap(ctx, 890, 690, "#efe7d6");
    S2.bench(ctx, "front", { season: "winter", snowSeat: 1 });
    ctx.restore();
    S2.petals(ctx, 70, "rgba(240,244,250,0.9)", { snow: true, seed: 21, wind: 10 });
  });

  // 10b — her hands remember
  shot(157.0, 167.0, (ctx, lt, t) => {
    deskBg(ctx, false, true);
    S2.sketchbook(ctx, 960, 540, 0.95, { rot: -0.02 });
    const k = prog(lt, 0.3, 6.5, E.lin);
    const tip = S2.pencilPortrait(ctx, 710, 500, 0.95, "old", k);
    S2.pageText(ctx, "Leo", 710, 780, 64, "rgba(60,58,66,0.95)", -0.05, prog(lt, 7.0, 8.4, E.lin));
    const handAt = lt < 6.6 ? tip || [710, 480] : [650 + (lt - 7.0) * 90, 780];
    S2.pencilHand(ctx, handAt[0], handAt[1], { sleeve: "#8f7aa6", rot: -0.45, s: 0.6 });
    S2.petals(ctx, 40, "rgba(240,244,250,0.85)", { snow: true, seed: 23, wind: 10 });
    narr(ctx, [{ text: "She had forgotten his name 1,459 times." }], t, 158.2, 162.8, { y: 945 });
    narr(ctx, [{ text: "Her hands never had.", size: 50 }], t, 163.6, 166.9, { y: 945 });
  });

  // 10c — Forgetting reaches, and fades; the thread lights up
  shot(167.0, 176.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 900, 560, key(lt, [[0, 1.7], [9, 1.62, E.sine]]));
    S2.park(ctx, { season: "winter" });
    const mae = { kind: "maeOld", x: 870, y: 714, s: 1.0, pose: "sit", face: 0.1, legDir: 1, legDrop: 48, armL: [-0.6, -0.8], armR: [-0.4, -0.6], scarf: "#8a2f35",
      e: { eyes: lt > 6 ? "teary" : "dot", look: [0.1, 0.8], brow: 0.8, mouth: lt > 6 ? "wobble" : "flat" } };
    const hp = headPos(mae);
    const fa = prog(lt, 0.3, 2) * (1 - prog(lt, 4.5, 7.5));
    S2.drawForget(ctx, 870, 830, { alpha: fa, s: 1.1, reach: { k: prog(lt, 1, 4.2, E.io2) * (1 - prog(lt, 4.4, 6)), x: (hp[0] - 870) / 1.1, y: (hp[1] - 830) / 1.1 } });
    S2.bench(ctx, "back", { season: "winter" });
    drawPerson(ctx, mae);
    sketchOnLap(ctx, 890, 690, "#efe7d6", true);
    S2.bench(ctx, "front", { season: "winter" });
    ctx.restore();
    if (mae.out) screen(ctx, () => S2.thread(ctx, mae.out.R, [2100, 760], prog(lt, 5.5, 7.5), 80, { k: prog(lt, 5.5, 8.5, E.io2), w: 4 }));
    S2.petals(ctx, 60, "rgba(240,244,250,0.9)", { snow: true, seed: 25, wind: 10 });
  });

  // 11a — he comes anyway, following the thread
  shot(176.0, 183.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 1100, 590, key(lt, [[0, 1.15], [7, 1.22, E.sine]]));
    S2.park(ctx, { season: "winter" });
    S2.bench(ctx, "back", { season: "winter" });
    const mae = { kind: "maeOld", x: 870, y: 714, s: 1.0, pose: "sit", face: lt > 5.6 ? 0.8 : 0.1, legDir: 1, legDrop: 48, armL: [-0.6, -0.8], armR: [-0.4, -0.6], scarf: "#8a2f35",
      e: { eyes: "dot", look: lt > 5.6 ? [0.9, 0] : [0.1, 0.8], brow: 0.6, mouth: "flat" } };
    drawPerson(ctx, mae);
    sketchOnLap(ctx, 890, 690, "#efe7d6", true);
    S2.bench(ctx, "front", { season: "winter" });
    const wk = prog(lt, 0, 6, E.out2);
    const leo = { kind: "leoOld", x: lerp(1900, 1330, wk), y: 822, s: 1.03, face: -0.6, walk: lt * 0.7, armL: [0.5, 0.3], armR: [-0.2, -0.1], cane: "R", scarf: "#3d4a5a",
      e: { eyes: "dot", look: [-0.9, 0], brow: 0.5, mouth: "flat" }, lean: -0.05 };
    drawPerson(ctx, leo);
    ctx.restore();
    if (mae.out && leo.out) screen(ctx, () => S2.thread(ctx, mae.out.R, leo.out.L, 1, 90, { w: 4 }));
    S2.petals(ctx, 60, "rgba(240,244,250,0.9)", { snow: true, seed: 27, wind: 10 });
  });

  // 11b — "...Leo?"
  shot(183.0, 188.0, (ctx, lt, t) => {
    closeBg(ctx, "#1a2030");
    ctx.save(); ctx.translate(960, 560); const z = 1 + 0.05 * prog(lt, 0, 5, E.sine); ctx.scale(z, z);
    bodyClose(ctx, "#8f7aa6", "#8a2f35");
    drawHead(ctx, 0, -40, 270, { eyes: lt > 0.8 ? "teary" : "wide", look: [0.6, -0.1], brow: 0.7, browUp: 0.6, mouth: lt > 1.0 && lt < 3.5 ? "oh" : "small", tear: prog(lt, 2.5, 4.5) * 0.6, blush: 0.4 }, { kind: "maeOld", seed: 59 });
    ctx.restore();
    S2.petals(ctx, 40, "rgba(240,244,250,0.85)", { snow: true, seed: 29, wind: 10 });
    bubble(ctx, "...Leo?", 1350, 360, t, 184.0, 187.8, { size: 46, tail: [-80, 70] });
  });

  // 11c — his face
  shot(188.0, 192.0, (ctx, lt, t) => {
    closeBg(ctx, "#1a2030");
    ctx.save(); ctx.translate(960, 560); const z = 1 + 0.05 * prog(lt, 0, 4, E.sine); ctx.scale(z, z);
    bodyClose(ctx, "#6b5a48", "#3d4a5a");
    drawHead(ctx, 0, -40, 280, { eyes: "teary", look: [-0.5, 0], brow: 1, browUp: 0.8, mouth: lt > 1.5 ? "cry" : "wobble", tear: prog(lt, 0.3, 2), blush: 0.6 }, { kind: "leoOld", seed: 29, squash: lt > 1.5 ? 0.03 : 0 });
    ctx.restore();
    S2.petals(ctx, 40, "rgba(240,244,250,0.85)", { snow: true, seed: 31, wind: 10 });
  });

  // 12 — together on the bench
  shot(192.0, 210.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 965, 560, key(lt, [[0, 1.75], [8, 1.75], [18, 1.15, E.io2]]));
    S2.park(ctx, { season: "winter" });
    S2.bench(ctx, "back", { season: "winter" });
    const lean = prog(lt, 1.0, 3.0, E.io2);
    const mae = { kind: "maeOld", x: 900, y: 714, s: 1.0, pose: "sit", face: 0.6, legDir: 1, legDrop: 48, armL: [-0.6, -0.8], armR: [-0.2, -0.3], scarf: "#8a2f35", lean: 0.22 * lean, tilt: 0.25 * lean,
      e: { eyes: lt > 3 ? "closed" : "dot", look: [0.9, 0], brow: 0.3, mouth: "smile", blush: 0.5 } };
    const laugh = lt > 5.5 && lt < 8.5;
    const leo = { kind: "leoOld", x: 1040, y: 714, s: 1.03, pose: "sit", face: -0.4, legDir: -1, legDrop: 48, armL: [-0.1, -0.2], armR: [-0.3, -0.3], scarf: "#3d4a5a", cane: "R",
      e: { eyes: laugh ? "happy" : "teary", look: [-0.7, 0.3], brow: 0.6, mouth: laugh ? "grin" : "smile", tear: 0.8, blush: 0.5 }, tilt: -0.08 };
    drawPerson(ctx, leo); drawPerson(ctx, mae);
    S2.bench(ctx, "front", { season: "winter" });
    ctx.restore();
    if (mae.out && leo.out) screen(ctx, () => S2.thread(ctx, mae.out.R, leo.out.L, 1, 30, { w: 4, glow: 20 }));
    S2.petals(ctx, 70, "rgba(240,244,250,0.9)", { snow: true, seed: 33, wind: 10 });
    bubble(ctx, "you're late.", 760, 330, t, 194.0, 197.4, { size: 38, tail: [60, 70] });
    bubble(ctx, "i know. i'm sorry.", 1200, 330, t, 197.8, 201.4, { size: 38, tail: [-60, 70] });
  });

  // 13 — the next morning, again
  shot(210.0, 226.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 820, 600, key(lt, [[0, 1.35], [16, 1.45, E.sine]]));
    S2.livingRoom(ctx, { lamp: 0.4 });
    S2.armchair(ctx, 600, "back");
    const mae = maeChair({ armR: [-0.9, -0.9], e: { eyes: lt > 10.5 ? "happy" : "dot", look: [0.9, -0.1], brow: lt < 10 ? 0.4 : 0.1, mouth: lt > 10 ? "smile" : "small", blush: prog(lt, 10, 12) } });
    drawPerson(ctx, mae);
    S2.armchair(ctx, 600, "front");
    S2.sideTable(ctx, 860, { book: true, cup: true });
    const leo = { kind: "leoOld", x: 1020, y: 822, s: 1.05, face: -0.6, armL: [0.9, 0.4], armR: [-0.2, -0.2],
      e: { eyes: lt > 9 ? "happy" : "dot", look: [-0.9, 0], brow: 0.1, mouth: "smile" } };
    drawPerson(ctx, leo);
    ctx.restore();
    if (mae.out && leo.out) screen(ctx, () => S2.thread(ctx, mae.out.R, leo.out.L, 0.8, 70, { w: 3 }));
    bubble(ctx, "...do i know you?", 560, 330, t, 212.0, 215.2, { size: 34, tail: [30, 70] });
    bubble(ctx, "not yet. i'm Leo.", 1100, 320, t, 215.6, 219.8, { size: 36, tail: [-40, 70] });
  });

  // 14 — walking to the bench, far away
  shot(226.0, 234.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 1000, 600, key(lt, [[0, 0.95], [8, 1.0, E.sine]]));
    S2.park(ctx, { season: "spring" });
    S2.bench(ctx, "back", { season: "spring" });
    S2.bench(ctx, "front", { season: "spring" });
    const x = lerp(1900, 1350, prog(lt, 0, 8, E.lin));
    const mae = { kind: "maeOld", x: x - 55, y: 822, s: 0.8, face: -0.4, walk: lt * 0.8, armL: [0.2, 0.2], armR: [-0.5, -0.3], e: { eyes: "dot", look: [-0.5, 0], mouth: "smile" } };
    const leo = { kind: "leoOld", x: x + 55, y: 822, s: 0.82, face: -0.4, walk: lt * 0.8 + 0.5, armL: [0.6, 0.3], armR: [-0.2, -0.1], cane: "R", e: { eyes: "dot", look: [-0.5, 0], mouth: "smile" } };
    drawPerson(ctx, mae); drawPerson(ctx, leo);
    ctx.restore();
    if (mae.out && leo.out) screen(ctx, () => S2.thread(ctx, mae.out.R, leo.out.L, 1, 18, { w: 3 }));
    S2.petals(ctx, 30, "rgba(230,170,190,0.85)", { seed: 35 });
  });

  // 15 — the line
  shot(234.0, 241.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [
      { text: "Love isn't being remembered.", size: 48, weight: "400" },
      { text: "It's staying when you're not.", size: 62, delay: 1.9 },
    ], t, 234.6, 240.7, { center: true, gap: 1.45 });
  }, { look: { vignette: 0 } });

  // 16 — title
  shot(241.0, 248.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const a = prog(lt, 0.2, 1.0) * (1 - prog(lt, 6.2, 7.0));
    ctx.save(); ctx.globalAlpha = a;
    X.setFont(ctx, 132); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = PAL.white;
    ctx.fillText("AGAIN.", W / 2, 470);
    // the red thread as the underline
    const uw = 380 * prog(lt, 0.8, 1.8, E.out3);
    ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.shadowColor = RED; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(W / 2 - uw / 2, 548); ctx.quadraticCurveTo(W / 2, 548 + 16 * prog(lt, 0.8, 1.8), W / 2 + uw / 2, 548); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = a * prog(lt, 1.6, 2.2);
    X.setFont(ctx, 36, "400"); ctx.fillStyle = "#d8d8d8";
    ctx.fillText("Some people choose you every day.", W / 2, 625);
    ctx.globalAlpha = a * prog(lt, 2.6, 3.2);
    X.setFont(ctx, 32); ctx.fillStyle = "#ff7a76";
    ctx.fillText("Choose them back.", W / 2, 685);
    ctx.restore();
  }, { look: { vignette: 0 } });

  // ---------- helpers
  function bodyClose(ctx, color, scarf) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-600, 520); ctx.bezierCurveTo(-560, 260, -280, 220, 0, 220); ctx.bezierCurveTo(280, 220, 560, 260, 600, 520); ctx.closePath();
    C.fillOutline(ctx, color, 5);
    if (scarf) { ctx.beginPath(); ctx.ellipse(0, 236, 230, 50, 0, 0, Math.PI * 2); C.fillOutline(ctx, scarf, 5); }
    ctx.restore();
  }
  function closeBg(ctx, c) {
    ctx.fillStyle = "#0b0d12"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(960, 480, 60, 960, 540, 1000);
    g.addColorStop(0, c); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function deskBg(ctx, warm, snow) {
    ctx.fillStyle = warm ? "#3a2a20" : "#16141a"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(900, 420, 60, 960, 560, 1100);
    g.addColorStop(0, warm ? "rgba(255,210,150,0.35)" : snow ? "rgba(200,210,230,0.22)" : "rgba(255,210,150,0.22)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 3;
    for (let y = 130; y < 1000; y += 46) { ctx.beginPath(); ctx.moveTo(0, y + Math.sin(y) * 8); ctx.bezierCurveTo(600, y - 10, 1200, y + 14, 1920, y); ctx.stroke(); }
    ctx.restore();
  }
  function sketchOnLap(ctx, x, y, paper, drawn) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.15);
    ctx.fillStyle = "#4a2626"; ctx.fillRect(-48, -30, 96, 60);
    ctx.fillStyle = paper; ctx.fillRect(-44, -27, 88, 54);
    if (drawn) { ctx.strokeStyle = "rgba(60,58,66,0.8)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-14, -4, 12, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(26, 14); ctx.stroke(); }
    ctx.restore();
  }
  function blanketOld(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(190, 728); ctx.bezierCurveTo(300, 700, 420, 690, 560, 700); ctx.bezierCurveTo(680, 706, 740, 712, 762, 730);
    ctx.lineTo(762, 790); ctx.lineTo(160, 790); ctx.closePath();
    ctx.fillStyle = "#3a3048"; ctx.fill();
    F.skPath(ctx, [[190, 728], [400, 692], [600, 702], [762, 730], [762, 790]], false, 300, 1.2);
    ctx.strokeStyle = PAL.line; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.restore();
  }

  function renderAt(ctx, t) {
    t = clamp(t, 0, DURATION - 1 / 60);
    G.t = t; G.frame = Math.round(t * 30); G.boil = Math.floor(t * 12);
    let s = SHOTS[0];
    for (const sh of SHOTS) if (t >= sh.a && t < sh.b) s = sh;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save(); s.f(ctx, t - s.a, t); ctx.restore();
    const h = hudAt(t);
    if (h) hud(ctx, h);
    let black = 0;
    const FADES = [[7.5, 0.8], [42.0, 0.9], [72.0, 0.9], [140.0, 0.6], [150.0, 0.8], [210.0, 1.0], [234.0, 0.6], [104.0, 0.4], [122.0, 0.5]];
    for (const [ft, d] of FADES) if (t >= ft && t < ft + d) black = Math.max(black, 1 - (t - ft) / d);
    const DIPS = [[41.2, 42.0], [71.3, 72.0], [139.4, 140.0], [149.3, 150.0], [209.0, 210.0], [233.0, 234.0], [121.5, 122.0]];
    for (const [a, b] of DIPS) if (t >= a && t < b) black = Math.max(black, (t - a) / (b - a));
    post(ctx, Object.assign({ black }, s.look || {}));
    ctx.restore();
  }

  window.FILM = { renderAt, DURATION, SHOTS, events: () => ({ taps: [] }) };
})();
