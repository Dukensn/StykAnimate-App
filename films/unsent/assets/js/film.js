// UNSENT. — shot list, timing and the renderAt(t) entry point.
(function () {
  const { W, H, BAR, PAL, G, clamp, lerp, E, prog, key, step, win, noise1, hash } = F;
  const { drawHead, drawPerson, drawPride } = C;
  const { narr, hand, hud, bubble, post, sepia } = X;

  const DURATION = 246;

  // ---------- typing simulation
  // ops: [t, 'type', text, cps] | [t, 'del', count|'all', cps] | [t, 'set', text]
  function typer(t, ops) {
    let text = "", pressed = "", last = -1;
    for (const op of ops) {
      const [t0, kind] = op;
      if (t < t0) break;
      if (kind === "set") { text = op[2]; continue; }
      if (kind === "type") {
        const s = op[2], cps = op[3] || 9;
        // slightly uneven rhythm
        let tt = t0, n = 0;
        for (let i = 0; i < s.length; i++) {
          const dt = (1 / cps) * (0.7 + 0.6 * (hash(i, Math.floor(t0 * 10), 3) + 1) / 2);
          if (t >= tt) { n = i + 1; last = tt; } else break;
          tt += dt;
        }
        text += s.slice(0, n);
        if (n > 0 && t - last < 0.09) pressed = s[n - 1].toLowerCase();
      }
      if (kind === "del") {
        const cps = op[3] || 18;
        const total = op[2] === "all" ? text.length : op[2];
        const n = Math.min(total, Math.floor((t - t0) * cps) + 1);
        text = text.slice(0, Math.max(0, text.length - n));
        if (n < total || t - t0 - total / cps < 0.1) pressed = "⌫";
      }
    }
    return { text, pressed };
  }
  const KB = (() => {
    // key centers in phone space (must mirror Pr.phone keyboard layout)
    const PH = 1080, kbH = 330, ky = PH / 2 - kbH;
    const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    const m = {};
    rows.forEach((r, ri) => {
      const rw = r.length * 54 - 8;
      [...r].forEach((ch, i) => (m[ch] = [-rw / 2 + i * 54 + 23, ky + 24 + ri * 70 + 29]));
    });
    m[" "] = [0, ky + 24 + 3 * 70 + 29];
    m["⌫"] = [232, ky + 24 + 2 * 70 + 29];
    m["send"] = [224, PH / 2 - kbH - 68];
    return m;
  })();
  function thumbFor(t, ty, rest) {
    const p = ty.pressed;
    if (p && KB[p]) return { x: KB[p][0], y: KB[p][1] + 6, press: 1 };
    if (p && /[^a-z]/.test(p)) return { x: KB[" "][0] + 40, y: KB[" "][1], press: 1 };
    return rest || { x: 150 + noise1(t * 0.8, 3) * 20, y: 300 + noise1(t * 0.7, 4) * 14, press: 0 };
  }

  // chat history shown above all drafts
  const HIST = [
    { who: "me", text: "stop telling me what i can't do.", ts: "Mar 13" },
    { who: "mom", text: "you don't have to call. just tell me you ate.", ts: "Mar 14" },
  ];

  // ---------- camera helper
  function cam(ctx, cx, cy, z, rot = 0) {
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.rotate(rot);
    ctx.translate(-cx, -cy);
  }
  function shake(t, a, b, amp) {
    const k = win(t, a, b, 0, b - a);
    return [noise1(t * 40, 1) * amp * k, noise1(t * 40, 2) * amp * k];
  }

  // generic phone close-up shot
  function phoneShot(ctx, t, o) {
    // dim room behind, blurred bokeh
    ctx.fillStyle = "#0b0c10"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(o.px ?? 1100, 560, 50, o.px ?? 1100, 560, 900);
    g.addColorStop(0, "#1a1d27"); g.addColorStop(1, "#08090c");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 7; i++) {
      const x = 200 + i * 230 + noise1(t * 0.1, i) * 30, y = 300 + (i % 3) * 170;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 60 + (i % 3) * 20);
      rg.addColorStop(0, i % 2 ? "rgba(255,190,120,0.18)" : "rgba(130,160,220,0.14)"); rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg; ctx.fillRect(x - 100, y - 100, 200, 200);
    }
    ctx.restore();
    const px = o.px ?? 1060, py = o.py ?? 560, sc = o.sc ?? 1.0, rot = o.rot ?? -0.05;
    const dz = o.push ? o.push(t) : 0;
    ctx.save();
    ctx.translate(px, py); ctx.scale(1 + dz, 1 + dz); ctx.translate(-px, -py);
    const dr = noise1(t * 0.35, 9) * 0.008;
    if (o.hand !== false) Pr.phoneHand(ctx, px, py, sc, rot + dr, o.thumb, "back");
    Pr.phone(ctx, px, py, sc, rot + dr, o.st);
    if (o.hand !== false) Pr.phoneHand(ctx, px, py, sc, rot + dr, o.thumb, "front");
    ctx.restore();
  }

  // ---------- HUD timeline (label, drafts, sent)
  function hudAt(t) {
    // [time, label, drafts, sent, visible]
    const K = [
      [7.0, "APRIL", 0, 0, 1], [26.8, "APRIL", 1, 0, 1], [45.0, "APRIL", 1, 0, 0], [58.5, "APRIL", 1, 0, 1],
      [70.0, "MAY", 22, 0, 1], [76.6, "MAY", 23, 0, 1], [77.0, "JULY", 60, 0, 1], [82.8, "JULY", 61, 0, 1],
      [83.0, "JULY", 61, 0, 1], [90.0, "AUGUST", 139, 0, 1], [97.7, "AUGUST", 140, 0, 1],
      [101.0, "OCTOBER", 213, 0, 1], [131.0, "OCTOBER", 213, 0, 0], [146.0, "OCTOBER", 213, 0, 1],
      [152.0, "OCTOBER", 213, 0, 0], [172.0, "OCTOBER", 213, 0, 1], [173.2, "OCTOBER", 213, 1, 1],
      [193.0, "OCTOBER", 213, 1, 0], [216.0, "SUNDAY", 213, 1, 1], [221.0, "SUNDAY", 0, 1, 1], [230.0, "SUNDAY", 0, 1, 0],
    ];
    let cur = K[0], prev = null;
    for (const k of K) { if (t >= k[0]) { prev = cur; cur = k; } }
    if (t < 7.0) return null;
    const since = t - cur[0];
    let drafts = cur[2];
    let fD = 0, fS = 0;
    if (prev && prev[2] !== cur[2] && since < 1.2 && prev[1] === cur[1]) {
      // roll the number
      const k = E.out3(clamp(since / 0.9, 0, 1));
      drafts = Math.round(lerp(prev[2], cur[2], k));
      fD = Math.max(0, 1 - since / 0.5);
    }
    if (prev && prev[3] !== cur[3] && since < 1) fS = Math.max(0, 1 - since / 0.7);
    // visibility fades
    let vis = cur[4];
    let alpha = vis;
    if (prev && prev[4] !== cur[4]) alpha = vis ? clamp(since / 0.4, 0, 1) : 1 - clamp(since / 0.3, 0, 1);
    return { label: cur[1], drafts, sent: cur[3], fD, fS, alpha };
  }

  // =====================================================================
  // SHOTS. each: [start, end, draw(ctx, lt, t)] ; lt = local time
  const SHOTS = [];
  const shot = (a, b, f, o = {}) => SHOTS.push(Object.assign({ a, b, f }, o));

  // 0 — COLD OPEN
  shot(0, 7.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [
      { text: "He wrote his mom a message every night.", size: 46, weight: "400" },
      { text: "He never sent one.", size: 60, delay: 1.9 },
    ], t, 0.6, 6.4, { center: true, gap: 1.45 });
  }, { look: { vignette: 0 } });

  // 1 — ROOM WIDE, phone glow
  shot(7.0, 17.0, (ctx, lt, t) => {
    ctx.save();
    const z = key(lt, [[0, 1.22], [10, 1.34, E.sine]]);
    cam(ctx, 700 + lt * 3, 580, z);
    Pr.theoRoom(ctx, { clock: lt < 6 ? "11:52" : "11:53", lamp: 0.8 });
    drawPerson(ctx, {
      x: 560, y: 702, s: 1.1, pose: "sit", face: 0.6, legDir: 1, legDrop: 64,
      armL: [0.9, 1.6], armR: [-0.6, -1.7], lean: 0.12, tilt: 0.12,
      e: { eyes: "dot", look: [0.3, 0.7], brow: 0.5, mouth: "flat" }, lit: 0.8,
      phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 },
    });
    ctx.restore();
    narr(ctx, [{ text: "They hadn't spoken since March." }], t, 10.6, 15.6);
  });

  // 2 — PHONE: first draft
  const OPS2 = [[18.2, "type", "hey mom", 7], [21.0, "type", " i'm sorry about what i", 10], [25.0, "del", "all", 18]];
  shot(17.0, 31.0, (ctx, lt, t) => {
    const ty = typer(t, OPS2);
    phoneShot(ctx, t, {
      st: { msgs: HIST, header: "Mom", status: "last seen yesterday", input: ty.text, caret: true, kb: true, pressed: ty.pressed, clock: "11:53" },
      thumb: thumbFor(t, ty, t > 27 ? { x: 160, y: 360 + (t - 27) * 40, press: 0 } : null),
      push: (tt) => 0.05 * prog(tt, 17, 31, E.sine),
    });
  });

  // 3 — PRIDE appears behind him
  shot(31.0, 45.0, (ctx, lt, t) => {
    ctx.save();
    const z = key(lt, [[0, 1.55], [14, 1.68, E.sine]]);
    cam(ctx, 690, 560, z);
    Pr.theoRoom(ctx, { clock: "11:58", lamp: key(lt, [[0, 0.8], [11.2, 0.8], [11.5, 0, E.lin]]) });
    const pa = prog(lt, 0.6, 2.4, E.out2);
    drawPride(ctx, 380, 830, { alpha: pa, s: key(lt, [[0, 0.9], [2.4, 1.0, E.out3]]), grin: key(lt, [[2, 0.4], [3, 1.1]]), look: 6, reach: lt > 5.5 ? [key(lt, [[5.5, 0.3], [6.5, 0.95]]), -0.15] : null });
    const angry = prog(lt, 6.8, 7.4);
    drawPerson(ctx, {
      x: 560, y: 702, s: 1.1, pose: "sit", face: 0.6, legDir: 1, legDrop: 64,
      armL: [0.9, 1.6], armR: lt < 9.6 ? [-0.6, -1.7] : [key(lt, [[9.6, -0.6], [10.4, 0.2]]), key(lt, [[9.6, -1.7], [10.4, -0.6]])],
      lean: 0.12, tilt: lerp(0.12, 0.0, angry),
      e: { eyes: "dot", look: [lerp(0.3, -0.2, angry), lerp(0.7, 0.2, angry)], brow: lerp(0.5, -0.6, angry), mouth: angry > 0.5 ? "frown" : "flat" },
      lit: lt < 10.4 ? 0.8 : 0, phone: lt < 10.4 ? { hand: "R", glow: 1, rot: 0.3, dx: -6 } : null,
    });
    ctx.restore();
    hand(ctx, "she said you'd never make it.", 170, 250, t, 32.6, 37.0, { size: 50 });
    hand(ctx, "let her text first.", 1000, 300, t, 37.3, 42.5, { size: 60, rot: -0.06 });
  });

  // 4 — FLASHBACK: the night he left
  shot(45.0, 58.5, (ctx, lt, t) => {
    ctx.save();
    const [sx, sy] = shake(lt, 8.2, 8.8, 14);
    cam(ctx, 940 + sx, 560 + sy, key(lt, [[0, 1.08], [13.5, 1.0, E.sine]]));
    Pr.kitchen(ctx, { mode: "past" });
    // mom (younger, angry-sad), theo with a bag heading to the door
    const go = prog(lt, 6.2, 8.2, E.io2);
    drawPerson(ctx, {
      kind: "mom", x: 760, y: 820, s: 1.1, face: 0.5,
      armL: [0.2, 0.3], armR: lt > 2 && lt < 5 ? [-2.0, -0.6] : [-0.3, -0.3],
      e: { eyes: "dot", look: [0.5, 0], brow: lt < 5 ? -0.5 : 0.7, mouth: lt < 5 ? "open" : "frown" },
    });
    drawPerson(ctx, {
      kind: "theo", x: lerp(1080, 1500, go), y: 820, s: 1.1, face: go > 0 ? 1 : -0.5, walk: go * 3,
      armL: [0.1, 0.2], armR: [-0.15, -0.1],
      e: { eyes: "dot", look: [go > 0 ? 1 : -0.6, 0], brow: -0.7, mouth: "frown" },
    });
    // the bag
    ctx.fillStyle = "#3d3a33"; ctx.beginPath(); ctx.roundRect(lerp(1080, 1500, go) - 70, 690, 60, 70, 10); ctx.fill();
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    bubble(ctx, "you'll never make it out there.", 760, 440, t, 47.0, 51.4, { size: 34 });
    sepia(ctx, 1);
    narr(ctx, [{ text: "Six words. He could still hear every one." }], t, 52.2, 57.8);
  }, { look: { vignette: 0.8, grain: 0.09 } });

  // 5 — lying awake
  shot(58.5, 70.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 520, 600, key(lt, [[0, 1.6], [11.5, 1.75, E.sine]]));
    Pr.theoRoom(ctx, { clock: "2:14", lamp: 0, dark: 0.15 });
    drawHead(ctx, 250, 680, 64, { eyes: "dot", look: [0.2, -0.6], brow: 0.6, mouth: "flat", blinkSeed: 5 }, { tilt: -0.25, seed: 17 });
    blanket(ctx, 0);
    ctx.restore();
    narr(ctx, [{ text: "So every night, he wrote one." }, { text: "And every night, he let it go.", delay: 1.6 }], t, 60.2, 69.4, { y: 870 });
  });

  // 6 — MONTAGE a (MAY)
  const OPS6 = [[71.0, "type", "i got the job. the one you said i'd never get.", 13], [75.2, "del", "all", 32]];
  shot(70.0, 77.0, (ctx, lt, t) => {
    const ty = typer(t, OPS6);
    phoneShot(ctx, t, {
      px: 1150, rot: -0.03,
      st: { msgs: HIST, header: "Mom", status: "last seen 2h ago", input: ty.text, caret: true, kb: true, pressed: ty.pressed, clock: "1:06" },
      thumb: thumbFor(t, ty), push: (tt) => 0.04 * prog(tt, 70, 77, E.sine),
    });
    prideEdge(ctx, t, 0.6);
    hand(ctx, "make her ask first.", 160, 420, t, 73.4, 76.8, { size: 54 });
  });

  // 7 — MONTAGE b (JULY)
  const OPS7 = [[77.6, "type", "do you still make the soup on sundays", 10], [81.8, "del", "all", 30]];
  shot(77.0, 83.0, (ctx, lt, t) => {
    const ty = typer(t, OPS7);
    phoneShot(ctx, t, {
      px: 1000, rot: -0.07,
      st: { msgs: HIST, header: "Mom", status: "", input: ty.text, caret: true, kb: true, pressed: ty.pressed, clock: "11:40" },
      thumb: thumbFor(t, ty),
    });
  });

  // 8 — noodles at the desk
  shot(83.0, 90.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 1330 - lt * 4, 590, key(lt, [[0, 1.45], [7, 1.52, E.sine]]));
    Pr.theoRoom(ctx, { clock: "9:41", lamp: 0.6, noodles: 1, photoGlow: key(lt, [[0, 0], [3, 0], [5, 1]]) });
    drawPerson(ctx, {
      x: 1300, y: 740, s: 1.05, pose: "sit", face: 0.3, legDir: -1, legDrop: 18,
      armL: [-2.3, 0.4], armR: [key(lt, [[0, -2.2], [1, -1.9], [2, -2.2], [3, -1.9], [4, -2.2]]), 0.5],
      e: { eyes: "half", look: [lt > 3 ? 0.4 : -0.2, lt > 3 ? -0.8 : 0.3], brow: 0.4, mouth: "flat" }, tilt: lt > 3 ? -0.08 : 0.05,
    });
    ctx.restore();
    narr(ctx, [{ text: "He got good at writing them." }], t, 84.4, 89.6);
  });

  // 9 — birthday draft
  const OPS9 = [[91.0, "type", "happy birthday mom", 8], [96.8, "del", "all", 20]];
  shot(90.0, 101.0, (ctx, lt, t) => {
    const ty = typer(t, OPS9);
    const hover = t > 93.4 && t < 96.6;
    phoneShot(ctx, t, {
      px: 1130, rot: -0.04,
      st: { msgs: HIST, header: "Mom", status: "", input: ty.text, caret: true, kb: true, pressed: ty.pressed, clock: "12:00",
        sendHot: hover ? 0.6 + 0.4 * Math.sin((t - 93.4) * 5) : 0 },
      thumb: hover ? { x: KB.send[0] - 30 + noise1(t * 3, 1) * 8, y: KB.send[1] + 70 + noise1(t * 3, 2) * 8, press: 0 } : thumbFor(t, ty),
      push: (tt) => 0.08 * prog(tt, 90, 97, E.sine),
    });
    prideEdge(ctx, t, prog(t, 93.6, 94.6));
    hand(ctx, "she didn't call on yours.", 130, 430, t, 94.4, 98.4, { size: 58 });
    narr(ctx, [{ text: "He got better at deleting them." }], t, 97.9, 100.8);
  });

  // 10 — 3:17 AM, in bed with the phone
  shot(101.0, 106.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 600, 600, key(lt, [[0, 1.3], [5, 1.38, E.sine]]));
    Pr.theoRoom(ctx, { clock: "3:17", lamp: 0, dark: 0.2 });
    drawHead(ctx, 250, 680, 64, { eyes: "half", look: [0.4, -0.3], brow: 0.3, mouth: "flat" }, { tilt: -0.25, seed: 17, lit: 1 });
    blanket(ctx, 1);
    ctx.restore();
  });

  // 11/13 — the typing dots (visible 107.5 → 118.5 = eleven seconds)
  const dotsOn = (t) => (t >= 107.5 && t < 118.5 ? clamp((t - 107.5) / 0.2, 0, 1) * clamp((118.5 - t) / 0.12, 0, 1) : 0);
  shot(106.0, 112.0, (ctx, lt, t) => {
    phoneShot(ctx, t, {
      px: 1000, py: 215, rot: 0.02, sc: 1.15, hand: true,
      st: { msgs: HIST, header: "Mom", status: t > 107.5 ? "typing…" : "online", input: "", caret: false, kb: false, typing: dotsOn(t), clock: "3:17" },
      thumb: { x: 235, y: 520, press: 0 }, push: (tt) => 0.1 * prog(tt, 107.3, 112, E.out3),
    });
    narr(ctx, [{ text: "At 3:17 AM," }, { text: "she was typing.", delay: 0.5 }], t, 108.6, 111.8, { x: 1530, center: true, cy: 520 });
  });
  // 12 — his face, lit by the screen
  shot(112.0, 117.0, (ctx, lt, t) => {
    ctx.fillStyle = "#07080b"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(960, 900, 50, 960, 700, 900);
    g.addColorStop(0, "rgba(120,150,220,0.35)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const z = 1 + 0.04 * prog(lt, 0, 5, E.sine);
    ctx.save(); ctx.translate(960, 560); ctx.scale(z, z);
    closeBody(ctx);
    drawHead(ctx, 0, -40, 290, { eyes: "wide", look: [0, 0.75], brow: 0.8, browUp: 1, mouth: "oh", blinkSeed: 2 }, { seed: 17, lit: 1, litX: 0, noBlink: lt < 3 });
    ctx.restore();
  });
  shot(117.0, 121.0, (ctx, lt, t) => {
    phoneShot(ctx, t, {
      px: 1000, py: 200, rot: 0.02, sc: 1.2,
      st: { msgs: HIST, header: "Mom", status: t < 118.5 ? "typing…" : "online", input: "", caret: false, kb: false, typing: dotsOn(t), clock: "3:17" },
      thumb: { x: 235, y: 520, press: 0 },
    });
    narr(ctx, [{ text: "Eleven seconds." }, { text: "Then nothing.", delay: 1.2 }], t, 118.0, 120.9, { x: 1530, center: true, cy: 520 });
  });

  // 14 — Pride: "see? she doesn't care." / realization
  shot(121.0, 131.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, lerp(560, 900, prog(lt, 4.5, 7.5)), 560, key(lt, [[0, 1.5], [4.5, 1.5], [7.5, 1.6]]));
    Pr.theoRoom(ctx, { clock: "3:18", lamp: 0, dark: 0.1, photoGlow: prog(lt, 4.8, 7) });
    drawPride(ctx, 360, 830, { alpha: 1, s: 1.05, grin: 1.2, look: 8 });
    const turn = prog(lt, 4.2, 5.2);
    drawPerson(ctx, {
      x: 560, y: 702, s: 1.1, pose: "sit", face: lerp(0.6, 1, turn), legDir: 1, legDrop: 64,
      armL: [0.9, 1.6], armR: [-0.6, -1.7], lean: 0.08,
      e: { eyes: "dot", look: [lerp(-0.8, 1, turn), lerp(0, -0.6, turn)], brow: lerp(0.2, 0.9, turn), mouth: "flat" }, lit: 0.8,
      phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 },
    });
    ctx.restore();
    hand(ctx, "see? she doesn't care.", 240, 340, t, 121.6, 125.4, { size: 56 });
    narr(ctx, [{ text: "Or maybe..." , weight: "400"}, { text: "she had drafts too.", delay: 2.1, size: 50 }], t, 126.0, 130.8, { y: 860 });
  });

  // 15 — SPLIT SCREEN: two rooms, two phones
  shot(131.0, 146.0, (ctx, lt, t) => {
    const open = E.io3(clamp(lt / 1.4, 0, 1));
    const mid = W / 2;
    // left: theo
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, lerp(W, mid - 3, open), H); ctx.clip();
    cam(ctx, 560 + lerp(0, 160, open), 610, 1.55 + lt * 0.006);
    Pr.theoRoom(ctx, { clock: "3:19", lamp: 0, dark: 0.15 });
    drawPerson(ctx, { x: 560, y: 702, s: 1.1, pose: "sit", face: 0.6, legDir: 1, legDrop: 64, armL: [0.9, 1.6], armR: [-0.6, -1.7], lean: 0.12, tilt: 0.12,
      e: { eyes: "dot", look: [0.3, 0.7], brow: 0.7, mouth: "flat" }, lit: 0.8, phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 } });
    ctx.restore();
    // right: mom
    if (open > 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(lerp(W, mid + 3, open), 0, W, H); ctx.clip();
      ctx.translate(lerp(W * 0.5, 0, open), 0);
      ctx.translate(mid, 0);
      ctx.translate(-W / 2, 0);
      cam(ctx, 900 - 240, 610, 1.4 + lt * 0.006);
      Pr.kitchen(ctx, { mode: "night", lamp: 0.7 });
      drawPride(ctx, 1060, 830, { alpha: prog(lt, 4, 6) * 0.9, s: 0.75, grin: 0.8, look: -8 });
      drawPerson(ctx, { kind: "mom", x: 760, y: 702, s: 1.05, pose: "sit", face: 0.4, legDir: 1, legDrop: 70, armL: [0.9, 1.6], armR: [-0.6, -1.7], lean: 0.1, tilt: 0.1,
        e: { eyes: "dot", look: [0.2, 0.7], brow: 0.8, mouth: "flat" }, lit: 0.8, phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 } });
      Pr.table(ctx, { mode: "night" });
      ctx.restore();
      // divider
      ctx.fillStyle = "#000"; ctx.fillRect(lerp(W, mid, open) - 3, 0, 6, H);
    }
    // two HUDs
    hud(ctx, { label: "HIM", drafts: 213, sent: 0, alpha: prog(lt, 2, 2.5) });
    hud(ctx, { label: "HER", drafts: lt > 6 ? Math.round(lerp(0, 241, E.out3(clamp((lt - 6) / 1.4, 0, 1)))) : 0, sent: 0, alpha: prog(lt, 5.5, 6), x: mid + 90 });
    narr(ctx, [{ text: "Both waiting for the other to go first." }], t, 138.0, 145.6);
  });

  // 16 — he types "hi mom"
  const OPS16 = [[147.4, "type", "hi mom", 4.5]];
  shot(146.0, 152.0, (ctx, lt, t) => {
    const ty = typer(t, OPS16);
    phoneShot(ctx, t, {
      px: 1080, rot: -0.04,
      st: { msgs: HIST, header: "Mom", status: "", input: ty.text, caret: true, kb: true, pressed: ty.pressed, clock: "3:21" },
      thumb: t > 149.2 ? { x: KB.send[0] - 40, y: KB.send[1] + 90, press: 0 } : thumbFor(t, ty), push: (tt) => 0.05 * prog(tt, 146, 152, E.sine),
    });
  });

  // 17 — Pride grows; the whispers
  const WHISPERS = [
    ["she should say sorry first.", 300, 300, 153.0, -0.06], ["you'll look weak.", 1320, 270, 154.2, 0.05], ["not tonight.", 1500, 560, 155.3, -0.04],
    ["make her ask.", 210, 620, 156.2, 0.04], ["she said you'd never make it.", 760, 210, 157.0, -0.03], ["what if she doesn't answer?", 1180, 760, 158.0, 0.03],
    ["delete it.", 420, 820, 158.8, -0.05], ["delete it.", 1560, 380, 159.4, 0.06], ["DELETE IT.", 900, 900, 160.2, 0.0],
  ];
  shot(152.0, 166.0, (ctx, lt, t) => {
    ctx.save();
    const [sx, sy] = shake(lt, 6, 14, 3 * prog(lt, 6, 13));
    cam(ctx, 600 + sx, 600 + sy, key(lt, [[0, 1.3], [14, 1.85, E.in2]]));
    Pr.theoRoom(ctx, { clock: "3:21", lamp: 0, dark: 0.2 + 0.3 * prog(lt, 2, 12) });
    const grow = key(lt, [[0, 1.0], [12, 2.3, E.io2]]);
    drawPride(ctx, 400, 830, { alpha: 1, s: grow, grin: 1.3, look: 10 });
    drawPerson(ctx, { x: 560, y: 702, s: 1.1, pose: "sit", face: 0.6, legDir: 1, legDrop: 64, armL: [0.9, 1.6], armR: [-0.6, -1.7], lean: 0.12 + 0.06 * prog(lt, 4, 12), tilt: 0.12,
      e: { eyes: lt > 9 ? "wide" : "dot", look: [0.3, 0.8], brow: 0.9, mouth: lt > 9 ? "wobble" : "flat", sweat: lt > 6 }, lit: 0.9, phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 } });
    ctx.restore();
    // amber wash
    ctx.save(); ctx.globalAlpha = 0.16 * prog(lt, 4, 13); ctx.fillStyle = PAL.amber; ctx.globalCompositeOperation = "overlay"; ctx.fillRect(0, 0, W, H); ctx.restore();
    for (const [txt, x, y, a, r] of WHISPERS) hand(ctx, txt, x, y, t, a, 166.0, { size: txt === "DELETE IT." ? 76 : 50, rot: r, align: "center" });
  });

  // 18 — the thumb over SEND; silence
  shot(166.0, 172.5, (ctx, lt, t) => {
    const press = prog(t, 171.25, 171.4, E.in2) * (1 - prog(t, 171.5, 171.8));
    const sent = t >= 171.45;
    phoneShot(ctx, t, {
      px: 1060, py: 470, sc: 1.25, rot: -0.04,
      st: { msgs: sent ? HIST.concat([{ who: "me", text: "hi mom", pop: clamp((t - 171.45) / 0.35, 0, 1) }]) : HIST, header: "Mom", status: "",
        input: sent ? "" : "hi mom", caret: !sent, kb: true, clock: "3:22", sendHot: sent ? 0 : 0.5 + 0.5 * Math.sin(lt * 3) },
      thumb: { x: KB.send[0] + noise1(t * 6, 1) * 6 * (1 - prog(t, 168, 171)), y: KB.send[1] + 14 + lerp(70, 0, prog(t, 166.5, 171.2, E.io2)) + noise1(t * 6, 2) * 6, press },
    });
    // a fading echo of the whispers
    hand(ctx, "delete it.", 300, 420, t, 166.0, 167.6, { size: 50, alpha: 0.5 });
  }, { look: { vignette: 0.75 } });

  // 19 — Pride breaks apart
  shot(172.5, 176.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 620, 560, key(lt, [[0, 1.45], [3.5, 1.35, E.out3]]));
    Pr.theoRoom(ctx, { clock: "3:22", lamp: 0, dark: 0.1 });
    drawPride(ctx, 400, 830, { alpha: 1, s: 1.8, grin: -0.6, look: 10, angry: true, dissolve: prog(lt, 0.15, 3.2, E.out2), crownLift: key(lt, [[0, 0], [1.2, 40, E.out2]]), crownRot: lt * 0.8 });
    drawPerson(ctx, { x: 560, y: 702, s: 1.1, pose: "sit", face: 0.6, legDir: 1, legDrop: 64, armL: [0.9, 1.6], armR: [-0.6, -1.7], lean: 0.1, tilt: 0.05,
      e: { eyes: "dot", look: [0.3, 0.8], brow: 0.6, mouth: "flat" }, lit: 0.9, phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 } });
    ctx.restore();
  });

  // 20 — Delivered… Seen… typing… "hi baby"
  shot(176.0, 193.0, (ctx, lt, t) => {
    const msgs = HIST.concat([{ who: "me", text: "hi mom" }]);
    const reply = t >= 190.5;
    if (reply) msgs.push({ who: "mom", text: "hi baby", pop: clamp((t - 190.5) / 0.4, 0, 1) });
    const receipt = reply ? "" : t >= 182.0 ? "Seen 3:22 AM" : t >= 176.6 ? "Delivered" : "";
    phoneShot(ctx, t, {
      px: 1000, py: 215, sc: 1.15, rot: 0.0,
      st: { msgs, header: "Mom", status: t > 185 && !reply ? "typing…" : t > 182 ? "online" : "", input: "", caret: false, kb: false, receipt,
        typing: t >= 185.0 && !reply ? clamp((t - 185) / 0.2, 0, 1) : 0, clock: "3:22" },
      thumb: { x: 235, y: 520, press: 0 }, push: (tt) => 0.12 * prog(tt, 176, 193, E.sine),
    });
  });

  // 21 — his face breaks
  shot(193.0, 199.0, (ctx, lt, t) => {
    ctx.fillStyle = "#07080b"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(960, 900, 50, 960, 700, 900);
    g.addColorStop(0, "rgba(120,150,220,0.35)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const z = 1.0 + 0.05 * prog(lt, 0, 6, E.sine);
    ctx.save(); ctx.translate(960, 560); ctx.scale(z, z);
    const k = prog(lt, 0.4, 1.4);
    closeBody(ctx);
    drawHead(ctx, 0, -40, 290, { eyes: lt > 0.5 ? "teary" : "wide", look: [0, 0.6], brow: 1, browUp: 0.6, mouth: lt > 1.6 ? "cry" : "wobble", tear: prog(lt, 0.8, 3), blush: k }, { seed: 17, lit: 1, squash: lt > 1.6 ? 0.03 : 0 });
    ctx.restore();
  });

  // 22 — more messages, then the call
  shot(199.0, 207.0, (ctx, lt, t) => {
    const msgs = HIST.concat([{ who: "me", text: "hi mom" }, { who: "mom", text: "hi baby" }]);
    if (t >= 199.8) msgs.push({ who: "mom", text: "i wrote you 241 messages.", pop: clamp((t - 199.8) / 0.4, 0, 1) });
    if (t >= 202.8) msgs.push({ who: "mom", text: "i never sent one either.", pop: clamp((t - 202.8) / 0.4, 0, 1) });
    phoneShot(ctx, t, {
      px: 1000, py: 215, sc: 1.15, rot: 0.0,
      st: { msgs, header: "Mom", status: "online", input: "", kb: false, typing: t > 201.2 && t < 202.8 ? 1 : 0, clock: "3:23",
        call: t >= 205.4 ? clamp((t - 205.4) / 0.3, 0, 1) : 0 },
      thumb: { x: 235, y: 520, press: 0 },
    });
  });

  // 23 — on the phone with her
  shot(207.0, 216.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 600, 560, key(lt, [[0, 1.7], [9, 1.85, E.sine]]));
    Pr.theoRoom(ctx, { clock: "3:24", lamp: key(lt, [[0, 0], [1.2, 0.9]]), dark: 0 });
    const laugh = lt > 4.6;
    drawPerson(ctx, { x: 560, y: 702, s: 1.1, pose: "sit", face: 0.2, legDir: 1, legDrop: 64,
      armL: [0.3, 0.3], armR: [2.5, 0.6], lean: 0.05 + (laugh ? Math.sin(lt * 9) * 0.015 : 0), tilt: -0.12,
      e: { eyes: laugh ? "happy" : "teary", look: [-0.2, -0.1], brow: 0.8, mouth: laugh ? "grin" : "wobble", tear: 1, blush: 1 },
      phone: { hand: "R", glow: 0.4, rot: -0.3, dx: 6, dy: 4 } });
    ctx.restore();
    bubble(ctx, "are you eating?", 540, 330, t, 208.4, 212.2, { size: 36, fill: "#e9edf7", tail: [80, 70] });
    bubble(ctx, "i'm eating, mom.", 1080, 380, t, 211.8, 215.6, { size: 36, tail: [-90, 70] });
  });

  // 24 — SUNDAY
  shot(216.0, 232.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 900, 590, key(lt, [[0, 1.35], [16, 1.12, E.sine]]));
    Pr.kitchen(ctx, { mode: "day", steam: 1, lamp: 0.3 });
    const ladle = prog(lt, 3, 5.5);
    drawPerson(ctx, { kind: "mom", x: 720, y: 702, s: 1.05, pose: "sit", face: 0.6, legDir: -1, legDrop: 70,
      armL: [-0.4, -0.3], armR: [lerp(-0.4, -1.6, ladle), lerp(-0.6, -0.9, ladle)], lean: 0.15 * ladle,
      e: { eyes: lt > 6 ? "happy" : "dot", look: [0.8, 0.2], brow: 0.3, mouth: "smile", blush: 0.6 } });
    drawPerson(ctx, { kind: "theo", x: 1080, y: 702, s: 1.1, pose: "sit", face: -0.6, legDir: 1, legDrop: 64,
      armL: [-1.3, -0.6], armR: [0.3, 0.3],
      e: { eyes: lt > 7 ? "happy" : "dot", look: [-0.8, 0.3], brow: 0.2, mouth: lt > 7 ? "grin" : "smile", blush: 0.5 } });
    Pr.table(ctx, { mode: "day" });
    Pr.bowl(ctx, 800, 640, "day", 0.8);
    Pr.bowl(ctx, 1000, 640, "day", 0.8);
    photoOnTable(ctx);
    ctx.restore();
  }, { look: { vignette: 0.45 } });

  // 25 — the line
  shot(232.0, 239.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [
      { text: "Pride waits for the perfect words.", size: 48, weight: "400" },
      { text: "Love just says hi.", size: 62, delay: 1.8 },
    ], t, 232.6, 238.7, { center: true, gap: 1.45 });
  }, { look: { vignette: 0 } });

  // 26 — title card
  shot(239.0, 246.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const a = prog(lt, 0.2, 1.0) * (1 - prog(lt, 6.2, 7.0));
    ctx.save(); ctx.globalAlpha = a;
    X.setFont(ctx, 132); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = PAL.white;
    ctx.fillText("UNSENT.", W / 2, 470);
    const uw = 420 * prog(lt, 0.8, 1.6, E.out3);
    ctx.strokeStyle = PAL.amber; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.shadowColor = PAL.amber; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(W / 2 - uw / 2, 548); ctx.lineTo(W / 2 + uw / 2, 548); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = a * prog(lt, 1.6, 2.2);
    X.setFont(ctx, 36, "400"); ctx.fillStyle = "#d8d8d8";
    ctx.fillText("Someone is waiting for your hi.", W / 2, 620);
    ctx.globalAlpha = a * prog(lt, 2.6, 3.2);
    X.setFont(ctx, 30); ctx.fillStyle = PAL.amberHot;
    ctx.fillText("Text them tonight.", W / 2, 680);
    ctx.restore();
  }, { look: { vignette: 0 } });

  // ---------- small helpers used by shots
  function blanket(ctx, lit) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(190, 728); ctx.bezierCurveTo(300, 700, 420, 690, 560, 700); ctx.bezierCurveTo(680, 706, 740, 712, 762, 730);
    ctx.lineTo(762, 790); ctx.lineTo(160, 790); ctx.closePath();
    ctx.fillStyle = "#2a3142"; ctx.fill();
    F.skPath(ctx, [[190, 728], [400, 692], [600, 702], [762, 730], [762, 790]], false, 300, 1.2);
    ctx.strokeStyle = PAL.line; ctx.lineWidth = 2.6; ctx.stroke();
    // fold lines
    F.skLine(ctx, [[330, 740], [420, 760]], { seed: 301, color: PAL.lineDim });
    F.skLine(ctx, [[520, 735], [640, 750]], { seed: 302, color: PAL.lineDim });
    if (lit) {
      // phone glow from under the blanket edge near his face
      const g = ctx.createRadialGradient(330, 690, 5, 330, 690, 180);
      g.addColorStop(0, `rgba(150,185,255,${0.45 * lit})`); g.addColorStop(1, "rgba(150,185,255,0)");
      ctx.fillStyle = g; ctx.fillRect(130, 500, 400, 400);
      ctx.save(); ctx.translate(335, 708); ctx.rotate(-0.5);
      ctx.fillStyle = "#0b0c10"; ctx.fillRect(-16, -26, 32, 52);
      ctx.fillStyle = "rgba(170,200,255,0.95)"; ctx.fillRect(-13, -22, 26, 44);
      ctx.restore();
      C.circle(ctx, 352, 722, 14); C.fillOutline(ctx, PAL.cream, 1, 2.8);
    }
    ctx.restore();
  }
  function closeBody(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-600, 520); ctx.bezierCurveTo(-560, 260, -280, 220, 0, 220); ctx.bezierCurveTo(280, 220, 560, 260, 600, 520); ctx.closePath();
    C.fillOutline(ctx, PAL.hoodie, 5);
    ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-60, 250); ctx.lineTo(-70, 420); ctx.moveTo(60, 250); ctx.lineTo(70, 420); ctx.stroke();
    // the phone glowing at the bottom edge, held in both hands
    ctx.fillStyle = "#0a0a0d"; ctx.beginPath(); ctx.roundRect(-150, 330, 300, 200, 30); ctx.fill();
    const g = ctx.createRadialGradient(0, 340, 10, 0, 340, 260);
    g.addColorStop(0, "rgba(170,200,255,0.55)"); g.addColorStop(1, "rgba(170,200,255,0)");
    ctx.fillStyle = g; ctx.fillRect(-300, 200, 600, 400);
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 165, 380, 60, 50, 0, 0, Math.PI * 2); C.fillOutline(ctx, PAL.cream, 5); }
    ctx.restore();
  }
  function prideEdge(ctx, t, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    drawPride(ctx, 120, 1150, { alpha: 1, s: 2.6, grin: 1.2, look: 14, crown: true });
    ctx.restore();
  }
  function photoOnTable(ctx) {
    ctx.save(); ctx.translate(900, 600); ctx.rotate(-0.04);
    Pr.photoFrame(ctx, -40, -30, 70, 58, 0, { frameColor: "#5a4636" });
    ctx.restore();
  }

  // ---------- entry point
  function renderAt(ctx, t) {
    t = clamp(t, 0, DURATION - 1 / 60);
    G.t = t; G.frame = Math.round(t * 30); G.boil = Math.floor(t * 12);
    let s = SHOTS[0];
    for (const sh of SHOTS) if (t >= sh.a && t < sh.b) s = sh;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save();
    s.f(ctx, t - s.a, t);
    ctx.restore();
    const h = hudAt(t);
    if (h && !(t >= 131 && t < 146)) hud(ctx, h);
    // fades: in from black at the start of chosen shots, out at film end
    let black = 0;
    const FADES = [[7.0, 0.8, "in"], [45.0, 0.5, "in"], [58.5, 0.6, "in"], [216.0, 1.2, "in"], [232.0, 0.6, "in"], [131.0, 0.4, "in"]];
    for (const [ft, d] of FADES) if (t >= ft && t < ft + d) black = Math.max(black, 1 - (t - ft) / d);
    // dip before the flashback and before Sunday
    const DIPS = [[44.6, 45.0], [215.2, 216.0], [57.9, 58.5], [231.4, 232.0]];
    for (const [a, b] of DIPS) if (t >= a && t < b) black = Math.max(black, (t - a) / (b - a));
    post(ctx, Object.assign({ black }, s.look || {}));
    ctx.restore();
  }

  function events() {
    const taps = [];
    for (const ops of [OPS2, OPS6, OPS7, OPS9, OPS16]) {
      let prev = typer(ops[0][0] - 0.01, ops).text.length;
      const end = ops[ops.length - 1][0] + 4;
      for (let tt = ops[0][0]; tt < end; tt += 1 / 240) {
        const n = typer(tt, ops).text.length;
        if (n !== prev) { taps.push([+tt.toFixed(3), n > prev ? "key" : "del"]); prev = n; }
      }
    }
    return { taps };
  }
  window.FILM = { renderAt, DURATION, SHOTS, events };
})();
