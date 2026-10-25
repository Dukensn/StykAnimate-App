// LITTLE BEAN. — shot list, timing and the renderAt(t) entry point.
(function () {
  const { W, H, PAL, G, clamp, lerp, E, prog, key, win, noise1 } = F;
  const { drawHead, drawPerson } = C;
  const { narr, hand, hud, bubble, post, sepia } = X;
  const YEL = S3.YEL;

  const DURATION = 244;

  function cam(ctx, cx, cy, z) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }
  function shake(t, a, b, amp) { const k = win(t, a, b, 0, b - a); return [noise1(t * 40, 1) * amp * k, noise1(t * 40, 2) * amp * k]; }
  const screen = (ctx, f) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); f(); ctx.restore(); };

  // ---------- HUD: [time, label, notes, replies, visible]
  function hudAt(t) {
    const K = [
      [7.5, "AGE 6", 211, 0, 1], [42.0, "AGE 13", 2616, 0, 1], [60.0, "AGE 15", 3305, 0, 1], [70.0, "AGE 16", 3712, 0, 1],
      [82.0, "AGE 16", 3713, 0, 1], [90.0, "AGE 18", 4380, 0, 1], [112.0, "SEPTEMBER", 4392, 0, 1], [118.0, "OCTOBER", 4440, 0, 1],
      [124.0, "NOVEMBER", 4512, 0, 1], [132.0, "NOVEMBER", 4512, 0, 0], [170.0, "NOVEMBER", 4512, 0, 1], [187.0, "NOVEMBER", 4512, 1, 1],
      [212.0, "NOVEMBER", 4512, 1, 0],
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
    return { label: cur[1], drafts: n.toLocaleString("en-US"), sent: cur[3], fD, fS, alpha, l1: "NOTES", l2: "REPLIES", bw: 290, sCol: cur[3] > 0 ? YEL : "#f1f1f1" };
  }

  const SHOTS = [];
  const shot = (a, b, f, o = {}) => SHOTS.push(Object.assign({ a, b, f }, o));

  function tableBg(ctx, warm) {
    ctx.fillStyle = warm ? "#2c221c" : "#18161a"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(880, 380, 60, 960, 560, 1100);
    g.addColorStop(0, warm ? "rgba(255,210,150,0.4)" : "rgba(200,210,240,0.2)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.035)"; ctx.lineWidth = 3;
    for (let y = 40; y < 1080; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(600, y - 12, 1200, y + 14, 1920, y); ctx.stroke(); }
    ctx.restore();
  }
  function bodyClose(ctx, color) {
    ctx.save(); ctx.beginPath();
    ctx.moveTo(-600, 520); ctx.bezierCurveTo(-560, 260, -280, 220, 0, 220); ctx.bezierCurveTo(280, 220, 560, 260, 600, 520); ctx.closePath();
    C.fillOutline(ctx, color, 5); ctx.restore();
  }
  // dad at the kitchen table writing, 5 AM
  function dadWriting(ctx, lt, o = {}) {
    const write = Math.sin(lt * 9) * 0.06;
    drawPerson(ctx, { kind: o.kind || "dad", x: 590, y: 702, s: 1.05, pose: "sit", face: 0.7, legDir: 1, legDrop: 62,
      armL: [1.15, 0.35], armR: [o.armR ?? 1.3 + write, 0.3], lean: 0.16, tilt: 0.08,
      e: { eyes: o.eyes || "half", look: [0.7, 0.8], brow: o.brow ?? 0.3, mouth: o.mouth || "small" } });
  }

  // 0 — COLD OPEN
  shot(0, 7.5, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [
      { text: "Every morning, he left a note in her lunchbox.", size: 60, weight: "400" },
      { text: "She never wrote back.", size: 78, delay: 2.0 },
    ], t, 0.6, 7.0, { center: true, gap: 1.4 });
  }, { look: { vignette: 0 } });

  // 1 — 5:12 AM, the kitchen
  shot(7.5, 20.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 880, 590, key(lt, [[0, 1.3], [12.5, 1.45, E.sine]]));
    Pr.kitchen(ctx, { mode: "night", lamp: 1 });
    dadWriting(ctx, lt);
    Pr.table(ctx, { mode: "night" });
    S3.lunchbox(ctx, 1000, 640, 0.9, { open: 1 });
    S3.jar(ctx, 1110, 640, 0.25);
    ctx.save(); ctx.translate(890, 632); ctx.rotate(-0.05); ctx.fillStyle = "#f3eee2"; ctx.fillRect(-34, -8, 68, 12); ctx.restore();
    ctx.restore();
    narr(ctx, [{ text: "He left for work at 5 AM," }, { text: "before she woke up.", delay: 1.4 }], t, 11.0, 19.6, { y: 880 });
  });

  // 2 — the first note we read
  shot(20.0, 30.0, (ctx, lt, t) => {
    tableBg(ctx, true);
    const slide = prog(lt, 8.4, 9.6, E.in2);
    const tip = S3.note(ctx, 960, 520 + slide * 700, 980, 600, -0.03, ["have a great day,", "little bean!", "— dad"], { k: prog(lt, 0.8, 6.8, E.lin), doodle: "bean", size: 96 });
    if (lt < 7.4) S2.pencilHand(ctx, tip[0] + 4, tip[1] + 34, { sleeve: "#3e4f66", rot: 2.4, s: 0.75 });
  });

  // 3 — at six, she showed everyone
  shot(30.0, 42.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 940, 600, key(lt, [[0, 1.35], [12, 1.45, E.sine]]));
    S3.cafeteria(ctx);
    S3.lunchbox(ctx, 1020, 690, 0.8, { open: 1 });
    const up = prog(lt, 1.2, 2.0, E.out3);
    const lily = { kind: "lilyKid", x: 900, y: 770, s: 1.0, pose: "sit", face: 0.3, legDir: 1, legDrop: 18,
      armL: [0.2, 0.3], armR: [lerp(-0.3, -2.7, up), lerp(-0.3, 0.2, up)],
      e: { eyes: up > 0.5 ? "happy" : "dot", look: [0.2, -0.4], brow: 0, mouth: up > 0.5 ? "grin" : "small", blush: up * 0.6 } };
    drawPerson(ctx, lily);
    drawPerson(ctx, { kind: "lilyKid", body: "#7aa0c8", x: 1180, y: 770, s: 1.0, pose: "sit", face: -0.5, legDir: -1, legDrop: 18, armL: [0.2, 0.3], armR: [-0.2, -0.3],
      e: { eyes: lt > 4 ? "wide" : "dot", look: [-0.8, -0.3], mouth: lt > 4 ? "oh" : "small" } });
    ctx.restore();
    if (lily.out && up > 0.3) screen(ctx, () => S3.note(ctx, lily.out.R[0], lily.out.R[1] - 50, 150, 100, 0.1, ["little bean"], { size: 30, heart: true }));
    bubble(ctx, "my dad writes me one every day!", 820, 300, t, 32.6, 36.6, { tail: [40, 80] });
    narr(ctx, [{ text: "At six, she showed everyone." }], t, 37.0, 41.8);
  });

  // 4 — at thirteen, she threw them away
  shot(42.0, 60.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 960, 590, key(lt, [[0, 1.3], [18, 1.4, E.sine]]));
    S3.lockers(ctx);
    S3.trashcan(ctx, 1420, 830, 1.0);
    const laugh = lt > 2.2 && lt < 8.5;
    for (const [x, f, c] of [[640, 0.6, "#8a6a9a"], [1180, -0.6, "#6a8a7a"]])
      drawPerson(ctx, { kind: "lilyTeen", body: c, x, y: 822, s: 1.0, face: f, armL: [0.2, 0.2], armR: [-0.2, -0.2], lean: laugh ? Math.sin(lt * 10 + x) * 0.03 : 0,
        e: { eyes: laugh ? "happy" : "dot", look: [f > 0 ? 0.9 : -0.9, 0], mouth: laugh ? "grin" : "small" } });
    const crumple = prog(lt, 8.6, 9.4), toss = prog(lt, 9.6, 10.6, E.in2);
    const walk = prog(lt, 11, 15, E.io2);
    const lily = { kind: "lilyTeen", x: lerp(910, 700, walk), y: 822, s: 1.03, face: walk > 0 ? -0.6 : 0.1, walk: walk * 3,
      armL: [0.2, 0.2], armR: lt < 9.6 ? [-2.2, 0.2] : lt < 10.6 ? [lerp(-2.2, 1.6, toss), 0.2] : [-0.2, -0.2],
      e: { eyes: lt > 8 ? "half" : "dot", look: [lt < 9.6 ? 0.2 : 0.8, lt < 8.6 ? -0.5 : 0.4], brow: lt > 5 ? 0.8 : 0, mouth: lt > 5 ? "frown" : "small", blush: prog(lt, 4, 6) } };
    drawPerson(ctx, lily);
    ctx.restore();
    if (lily.out && lt < 9.6) screen(ctx, () => {
      const s = 1 - crumple * 0.75;
      S3.note(ctx, lily.out.R[0], lily.out.R[1] - 40 * s, 150 * s, 100 * s, 0.1, s > 0.6 ? ["little bean"] : [""], { size: 30, heart: s > 0.6, crumpled: crumple > 0 ? 3 : 0 });
    });
    if (lt >= 9.6 && lt < 10.6) {
      // crumpled ball arcing into the bin (screen coords approx)
      const x = lerp(1010, 1440, toss), y = lerp(520, 660, toss) - Math.sin(toss * Math.PI) * 140;
      screen(ctx, () => { C.circle(ctx, x, y, 16); C.fillOutline(ctx, "#f3eee2", 1, 2.4); });
    }
    bubble(ctx, "\"little bean\"?! omg.", 560, 300, t, 44.2, 47.6, { tail: [40, 80] });
    bubble(ctx, "that's so cute lol", 1320, 300, t, 47.6, 50.4, { tail: [-40, 80] });
    narr(ctx, [{ text: "At thirteen, she threw them away." }], t, 53.6, 59.6);
  });

  // 5 — two jobs, every note
  shot(60.0, 70.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 940, 560, key(lt, [[0, 1.7], [10, 1.8, E.sine]]));
    Pr.kitchen(ctx, { mode: "night", lamp: 1 });
    const coin = lt < 3.5;
    dadWriting(ctx, lt, { armR: coin ? key(lt, [[0, 1.3], [1.2, 1.9], [2.4, 1.3]]) : undefined, eyes: "half", brow: 0.5 });
    Pr.table(ctx, { mode: "night" });
    S3.lunchbox(ctx, 1000, 640, 0.9, { open: 1 });
    S3.jar(ctx, 1110, 640, lerp(0.45, 0.55, prog(lt, 1.0, 1.6)));
    ctx.restore();
    narr(ctx, [{ text: "He worked two jobs for her college." }], t, 61.0, 65.6);
    narr(ctx, [{ text: "He never missed a note." }], t, 66.0, 69.7);
  });

  // 6 — sixteen: the door
  shot(70.0, 82.0, (ctx, lt, t) => {
    ctx.save();
    const [sx, sy] = shake(lt, 5.0, 5.6, 12);
    cam(ctx, 1000 + sx, 600 + sy, key(lt, [[0, 1.35], [12, 1.45, E.sine]]));
    S2.hallway(ctx, { doorLight: lt > 5 ? 1 : 0.2, photoFade: 0 });
    if (lt < 5.0) drawPerson(ctx, { kind: "lilyTeen", x: 900, y: 822, s: 1.03, face: 0.7, armL: [0.2, 0.3], armR: lt < 4 ? [-0.6, -0.9] : [-0.2, -0.2],
      e: { eyes: "dot", look: [0.9, 0], brow: -0.8, mouth: lt < 4 ? "open" : "frown" } });
    drawPerson(ctx, { kind: "dad", x: 1200, y: 822, s: 1.05, face: -0.6, armL: lt < 5 ? [0.6, 0.5] : [0.2, 0.2], armR: [-0.2, -0.2],
      e: { eyes: lt > 5 ? "half" : "wide", look: [-0.9, 0], brow: 0.7, mouth: lt > 5 ? "frown" : "oh" } });
    ctx.restore();
    bubble(ctx, "stop treating me like a kid!", 820, 320, t, 71.0, 74.4, { tail: [30, 80], size: 48 });
    narr(ctx, [{ text: "At sixteen, they barely spoke." }], t, 76.5, 81.6);
  });

  // 7 — the next morning's note
  shot(82.0, 90.0, (ctx, lt, t) => {
    tableBg(ctx, true);
    const tip = S3.note(ctx, 960, 540, 820, 680, 0.03, ["i'm proud of you.", "even when you", "slam doors.", "— dad"], { paper: "sticky", k: prog(lt, 0.6, 5.4, E.lin), size: 86 });
    if (lt < 5.9) S2.pencilHand(ctx, tip[0] + 4, tip[1] + 34, { sleeve: "#3e4f66", rot: 2.4, s: 0.75 });
  });

  // 8 — eighteen: the car
  shot(90.0, 112.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 960, 600, key(lt, [[0, 1.15], [22, 1.22, E.sine]]));
    S3.street(ctx);
    const drive = prog(lt, 13, 18.5, E.in2);
    S3.car(ctx, lerp(1420, 2600, drive), 830, 1.0, { boxes: true, lights: true });
    const inCar = lt > 11.2;
    const hugK = prog(lt, 4.0, 5.0) * (1 - prog(lt, 8.5, 9.5));
    if (!inCar) {
      const lx = lt < 9.5 ? lerp(1010, 980, hugK) : lerp(1010, 1300, prog(lt, 9.5, 11.2));
      drawPerson(ctx, { kind: "lily", x: lx, y: 822, s: 1.03, face: lt < 9.5 ? -0.6 : 0.8, walk: lt > 9.5 ? lt * 1.5 : 0, lean: -0.1 * hugK,
        armL: hugK > 0.5 ? [-1.3, -0.4] : [0.2, 0.2], armR: [-0.2, -0.2],
        e: { eyes: hugK > 0.5 ? "closed" : "dot", look: [-0.9, 0], brow: 0.4, mouth: "small" } });
      // her bag
      ctx.save(); ctx.fillStyle = "#6a4a3a"; ctx.beginPath(); ctx.roundRect(lx + 30, 720, 60, 70, 10); ctx.fill(); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }
    const wave = lt > 12.5;
    drawPerson(ctx, { kind: "dad", x: lerp(880, 900, hugK), y: 822, s: 1.05, face: 0.6, lean: 0.1 * hugK,
      armL: [0.2, 0.2], armR: lt > 1.6 && lt < 3.2 ? [-1.1, -0.4] : hugK > 0.5 ? [1.3 + Math.sin(lt * 8) * 0.1, 0.5] : wave ? [2.6, 0.3 + Math.sin(lt * 6) * 0.35] : [-0.2, -0.2],
      e: { eyes: wave ? "teary" : "dot", look: [0.9, 0], brow: 0.6, mouth: wave ? "wobble" : "smile", tear: prog(lt, 15, 19) * 0.6 } });
    ctx.restore();
    narr(ctx, [{ text: "At eighteen, she left for college." }], t, 95.2, 99.6);
    narr(ctx, [{ text: "He waved until the car was gone." }], t, 105.6, 111.6);
  });

  // 9 — the empty kitchen
  shot(112.0, 124.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 900, 590, key(lt, [[0, 1.4], [12, 1.5, E.sine]]));
    Pr.kitchen(ctx, { mode: "night", lamp: 0.8 });
    const stop = lt > 4;
    dadWriting(ctx, lt, { eyes: stop ? "dot" : "half", brow: stop ? 0.9 : 0.3, armR: stop ? 0.9 : undefined, mouth: stop ? "flat" : "small" });
    Pr.table(ctx, { mode: "night" });
    S3.jar(ctx, 1110, 640, 1.0);
    ctx.restore();
    narr(ctx, [{ text: "He kept writing them anyway." }], t, 113.0, 117.6);
    narr(ctx, [{ text: "He just had nowhere to put them." }], t, 118.5, 123.7);
  });

  // 10 — the drawer fills up
  shot(124.0, 132.0, (ctx, lt, t) => {
    tableBg(ctx, false);
    S3.drawer(ctx, 960, 560, 1.0, Math.floor(lerp(18, 110, prog(lt, 0, 7.5, E.lin))));
  });

  // 11 — the dorm: the note in her bag
  shot(132.0, 138.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 560, 600, key(lt, [[0, 1.5], [6, 1.6, E.sine]]));
    Pr.theoRoom(ctx, { clock: "11:48", lamp: 0.9, dark: 0.05 });
    const up = prog(lt, 1.5, 2.5, E.out3);
    const lily = { kind: "lily", x: 560, y: 702, s: 1.05, pose: "sit", face: 0.4, legDir: 1, legDrop: 64,
      armL: [lerp(0.4, -1.6, up), lerp(0.3, -1.0, up)], armR: [lerp(-0.4, -1.4, up), lerp(-0.3, -1.2, up)],
      e: { eyes: lt > 3.5 ? "teary" : "dot", look: [0.1, 0.6], brow: 0.6, mouth: lt > 3.5 ? "smile" : "small", tear: prog(lt, 4, 6) * 0.5 } };
    drawPerson(ctx, lily);
    ctx.restore();
    if (lily.out && up > 0.5) screen(ctx, () => S3.note(ctx, (lily.out.L[0] + lily.out.R[0]) / 2, Math.min(lily.out.L[1], lily.out.R[1]) - 30, 180, 120, -0.05, [""], { heart: true }));
  });
  shot(138.0, 146.0, (ctx, lt, t) => {
    tableBg(ctx, false);
    S3.note(ctx, 960, 520, 900, 640, -0.02, ["eat something green.", "i miss you already.", "— dad"], { size: 88 });
    if (lt > 5.2) { const k = clamp((lt - 5.2) / 0.5, 0, 1); ctx.save(); ctx.globalAlpha = 0.45 * k; ctx.fillStyle = "rgba(90,110,150,0.6)"; ctx.beginPath(); ctx.ellipse(700, 720, 34 * E.out3(k), 26 * E.out3(k), 0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  });

  // 12 — the shoebox
  shot(146.0, 150.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 560, 640, key(lt, [[0, 1.7], [4, 1.8, E.sine]]));
    Pr.theoRoom(ctx, { clock: "11:51", lamp: 0.9, dark: 0.05 });
    const lily = { kind: "lily", x: 560, y: 702, s: 1.05, pose: "sit", face: 0.2, legDir: 1, legDrop: 64, armL: [0.6, -0.9], armR: [-0.6, 0.9],
      e: { eyes: "teary", look: [0, 0.8], brow: 0.6, mouth: "small", tear: 0.4 } };
    drawPerson(ctx, lily);
    ctx.save(); ctx.translate(590, 690); ctx.fillStyle = "#c9a37a"; ctx.fillRect(-80, -40, 160, 54); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3; ctx.strokeRect(-80, -40, 160, 54); ctx.restore();
    ctx.restore();
  });
  shot(150.0, 158.0, (ctx, lt, t) => {
    tableBg(ctx, false);
    const z = 1 + 0.06 * prog(lt, 0, 8, E.sine);
    ctx.save(); ctx.translate(960, 540); ctx.scale(z, z); ctx.translate(-960, -540);
    S3.shoebox(ctx, 960, 520, 1.0, { count: 80 });
    S3.note(ctx, 1000, 470, 360, 240, -0.12, ["have a great day,", "little bean!"], { size: 46, crumpled: 3, heart: true });
    ctx.restore();
    narr(ctx, [{ text: "She never wrote back." }], t, 150.6, 153.8);
    narr(ctx, [{ text: "But she kept every single one.", size: 64 }], t, 154.0, 157.8);
  });

  // 13 — she drives home through the night
  shot(158.0, 164.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 560, 600, key(lt, [[0, 1.5], [6, 1.55, E.sine]]));
    Pr.theoRoom(ctx, { clock: "11:58", lamp: 0.9, dark: 0.05 });
    const st = prog(lt, 0.6, 1.8, E.io2);
    drawPerson(ctx, { kind: "lily", x: lerp(560, 760, prog(lt, 2.2, 5.5)), y: lerp(702, 822, st), s: 1.05, pose: st > 0.5 ? "stand" : "sit", face: 0.6, legDir: 1, legDrop: 64,
      walk: lt > 2.2 ? lt * 1.4 : 0, armL: [-0.8, -1.0], armR: [0.8, 1.0], e: { eyes: "dot", look: [0.9, 0], brow: -0.2, mouth: "smile" } });
    ctx.restore();
  });
  shot(164.0, 170.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 960, 600, 1.1);
    S3.street(ctx);
    ctx.fillStyle = "rgba(5,8,25,0.72)"; ctx.fillRect(-400, -400, 2720, 1880);
    const x = lerp(-300, 2300, prog(lt, 0, 6, E.lin));
    S3.car(ctx, x, 830, 0.9, { color: "#c79a3a" });
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(x + 260, 790, 5, x + 420, 800, 260);
    g.addColorStop(0, "rgba(255,240,200,0.6)"); g.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = g; ctx.fillRect(x, 560, 700, 400); ctx.restore();
    ctx.restore();
  });

  // 14 — 5:12 AM: something on the table
  shot(170.0, 186.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 920, 590, key(lt, [[0, 1.3], [16, 1.5, E.sine]]));
    const lamp = prog(lt, 3.0, 3.3, E.lin);
    Pr.kitchen(ctx, { mode: "night", lamp });
    const walkK = prog(lt, 0.2, 2.8, E.out2);
    const sitK = prog(lt, 7.5, 8.6);
    if (lt < 7.5) drawPerson(ctx, { kind: "dadGrey", x: lerp(1650, 1240, walkK), y: 822, s: 1.05, face: -0.6, walk: walkK * 3, armL: lt > 2.8 && lt < 3.4 ? [-2.4, 0] : [0.2, 0.2], armR: [-0.2, -0.2],
      e: { eyes: lt > 4.2 ? "wide" : "half", look: [-0.9, 0.4], brow: lt > 4.2 ? 0.6 : 0.2, mouth: lt > 4.2 ? "oh" : "flat" } });
    else drawPerson(ctx, { kind: "dadGrey", x: 590, y: lerp(822, 702, sitK), s: 1.05, pose: sitK > 0.5 ? "sit" : "stand", face: 0.7, legDir: 1, legDrop: 62, armL: [1.15, 0.35], armR: [1.3, 0.3], lean: 0.12,
      e: { eyes: "dot", look: [0.8, 0.8], brow: 0.6, mouth: "small" } });
    Pr.table(ctx, { mode: "night" });
    S3.lunchbox(ctx, 980, 640, 0.9, { note: true });
    ctx.restore();
  });

  // 15 — her note
  shot(186.0, 196.0, (ctx, lt, t) => {
    tableBg(ctx, true);
    const unfold = E.out3(clamp(lt / 0.9, 0, 1));
    ctx.save(); ctx.translate(1000, 570); ctx.scale(1, 0.15 + 0.85 * unfold); ctx.translate(-1000, -570);
    S3.note(ctx, 1000, 570, 960, 700, 0.02, ["have a great day,", "old bean.", "i kept every single one.", "— your little bean"], { size: 80, ink: "#5a3a8a", doodle: "dad" });
    ctx.restore();
  });

  // 16 — his face
  shot(196.0, 202.0, (ctx, lt, t) => {
    ctx.fillStyle = "#120f0e"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(900, 300, 50, 960, 500, 1000);
    g.addColorStop(0, "rgba(255,210,150,0.3)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(960, 560); const z = 1 + 0.05 * prog(lt, 0, 6, E.sine); ctx.scale(z, z);
    bodyClose(ctx, "#3e4f66");
    drawHead(ctx, 0, -40, 280, { eyes: "teary", look: [0, 0.6], brow: 1, browUp: 0.7, mouth: lt > 1.6 ? "cry" : "wobble", tear: prog(lt, 0.3, 2.5), blush: 0.5 }, { kind: "dadGrey", seed: 31, squash: lt > 1.6 ? 0.03 : 0 });
    ctx.restore();
  });

  // 17 — "hi, dad."
  shot(202.0, 216.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 1000, 560, key(lt, [[0, 1.45], [14, 1.7, E.sine]]));
    Pr.kitchen(ctx, { mode: "night", lamp: 1 });
    const stand = prog(lt, 3.6, 4.4);
    const hug = prog(lt, 5.0, 6.2, E.io2);
    const dx = lerp(700, 930, hug);
    if (stand < 0.5) dadWriting(ctx, lt, { kind: "dadGrey", eyes: "teary", brow: 0.9, armR: 0.9, mouth: "wobble" });
    else drawPerson(ctx, { kind: "dadGrey", x: dx, y: 822, s: 1.05, face: 0.6, lean: 0.12 * hug, tilt: 0.15 * hug, armL: [0.2, 0.2], armR: hug > 0.5 ? [1.35, 0.5] : [-0.2, -0.2],
      e: { eyes: hug > 0.5 ? "closed" : "teary", look: [0.9, 0], brow: 0.8, mouth: hug > 0.5 ? "smile" : "wobble", tear: 1, blush: 0.6 } });
    Pr.table(ctx, { mode: "night" });
    const lx = lerp(1450, 1150, prog(lt, 0, 1.6, E.out2)) - 110 * hug;
    drawPerson(ctx, { kind: "lily", x: lx, y: 822, s: 1.03, face: -0.6, walk: lt < 1.6 ? lt * 2 : 0, lean: -0.12 * hug, tilt: -0.15 * hug,
      armL: hug > 0.5 ? [-1.35, -0.5] : [-1.2, -1.2], armR: [-0.2, -0.2],
      e: { eyes: hug > 0.5 ? "closed" : "teary", look: [-0.9, 0], brow: 0.5, mouth: "smile", tear: 0.8, blush: 0.6 } });
    ctx.restore();
    bubble(ctx, "hi, dad.", 1260, 330, t, 203.4, 206.8, { tail: [-40, 80], size: 52 });
  });

  // 18 — sunrise: reading them together
  shot(216.0, 228.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 900, 590, key(lt, [[0, 1.45], [12, 1.25, E.sine]]));
    Pr.kitchen(ctx, { mode: "day", steam: 1, lamp: 0.2 });
    const laugh = lt > 3 && lt < 7;
    drawPerson(ctx, { kind: "dadGrey", x: 590, y: 702, s: 1.05, pose: "sit", face: 0.6, legDir: 1, legDrop: 62, armL: [1.1, 0.4], armR: [1.3, 0.3],
      e: { eyes: laugh ? "happy" : "dot", look: [0.8, 0.3], mouth: laugh ? "grin" : "smile", blush: 0.5 } });
    drawPerson(ctx, { kind: "lily", x: 1210, y: 702, s: 1.03, pose: "sit", face: -0.6, legDir: -1, legDrop: 64, armL: [-1.3, -0.3], armR: [-1.1, -0.4], lean: laugh ? Math.sin(lt * 9) * 0.02 : 0,
      e: { eyes: laugh ? "happy" : "dot", look: [-0.6, 0.6], mouth: laugh ? "grin" : "smile", blush: 0.5 } });
    Pr.table(ctx, { mode: "day" });
    for (let i = 0; i < 9; i++) { ctx.save(); ctx.translate(780 + i * 32, 632 - (i % 3) * 4); ctx.rotate((i % 4 - 1.5) * 0.3); ctx.fillStyle = i % 3 ? "#f3eee2" : YEL; ctx.fillRect(-20, -8, 40, 14); ctx.restore(); }
    ctx.save(); ctx.translate(1000, 630); ctx.fillStyle = "#c9a37a"; ctx.fillRect(-60, -34, 120, 40); ctx.strokeStyle = "#5a4636"; ctx.lineWidth = 3; ctx.strokeRect(-60, -34, 120, 40); ctx.restore();
    ctx.restore();
  }, { look: { vignette: 0.45 } });

  // 19 — the line
  shot(228.0, 236.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [
      { text: "He never said it out loud.", size: 62, weight: "400" },
      { text: "He wrote it 4,512 times.", size: 80, delay: 2.0 },
    ], t, 228.6, 235.7, { center: true, gap: 1.4 });
  }, { look: { vignette: 0 } });

  // 20 — title
  shot(236.0, 244.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const a = prog(lt, 0.2, 1.0) * (1 - prog(lt, 7.2, 8.0));
    ctx.save(); ctx.globalAlpha = a;
    X.setFont(ctx, 150); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = PAL.white;
    ctx.fillText("LITTLE BEAN.", W / 2, 460);
    const uw = 620 * prog(lt, 0.8, 1.8, E.out3);
    ctx.strokeStyle = YEL; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.shadowColor = YEL; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(W / 2 - uw / 2, 548); ctx.lineTo(W / 2 + uw / 2, 548); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = a * prog(lt, 1.6, 2.2);
    X.setFont(ctx, 46, "400"); ctx.fillStyle = "#d8d8d8";
    ctx.fillText("Write it down for someone you love.", W / 2, 635);
    ctx.globalAlpha = a * prog(lt, 2.6, 3.2);
    X.setFont(ctx, 44); ctx.fillStyle = YEL;
    ctx.fillText("Today.", W / 2, 705);
    ctx.restore();
  }, { look: { vignette: 0 } });

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
    const FADES = [[7.5, 0.8], [42.0, 0.5], [60.0, 0.5], [90.0, 0.8], [112.0, 0.8], [132.0, 0.8], [170.0, 0.8], [216.0, 1.0], [228.0, 0.6]];
    for (const [ft, d] of FADES) if (t >= ft && t < ft + d) black = Math.max(black, 1 - (t - ft) / d);
    const DIPS = [[41.6, 42.0], [59.6, 60.0], [89.3, 90.0], [111.3, 112.0], [131.3, 132.0], [169.3, 170.0], [215.0, 216.0], [227.4, 228.0]];
    for (const [a, b] of DIPS) if (t >= a && t < b) black = Math.max(black, (t - a) / (b - a));
    post(ctx, Object.assign({ black }, s.look || {}));
    ctx.restore();
  }

  window.FILM = { renderAt, DURATION, SHOTS, events: () => ({ taps: [] }) };
})();
