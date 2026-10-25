// SOMEDAY. — shot list, timing and the renderAt(t) entry point.
(function () {
  const { W, H, G, clamp, lerp, E, prog, key, noise1 } = F;
  const { sil, close } = SIL;
  const { post } = X;
  const SERIF = "'EB Garamond', Georgia, serif";
  const COMIC = "'Comic Neue', sans-serif";
  const DURATION = 248;

  function cam(ctx, cx, cy, z) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }
  const screen = (ctx, f) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); f(); ctx.restore(); };

  // italic serif interstitial on black
  function card(ctx, lines, t, a, b, o = {}) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    if (t < a || t > b) return;
    const out = clamp((b - t) / 0.6, 0, 1);
    lines.forEach((l, i) => {
      const la = a + (i * (o.stagger ?? 1.6));
      const k = clamp((t - la) / 0.9, 0, 1);
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha = E.out2(k) * out;
      ctx.font = `italic 400 ${o.size || 66}px ${SERIF}`; ctx.fillStyle = "#e9e9e4"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * (o.size || 66) * 1.35);
      ctx.restore();
    });
  }
  // floating dialogue, white comic type over a soft dark band
  function speak(ctx, text, x, y, t, a, b, o = {}) {
    if (t < a || t > b) return;
    const k = clamp((t - a) / 0.25, 0, 1), out = clamp((b - t) / 0.3, 0, 1);
    const size = o.size || 56;
    ctx.save();
    ctx.globalAlpha = k * out;
    ctx.font = `700 ${size}px ${COMIC}`;
    const w = ctx.measureText(text).width;
    ctx.filter = "blur(18px)"; ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(x, y, w / 2 + 50, size * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.filter = "none";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 7; ctx.strokeStyle = "rgba(10,10,14,0.9)"; ctx.lineJoin = "round"; ctx.strokeText(text, x, y + (1 - k) * 6);
    ctx.fillStyle = o.color || "#ffffff"; ctx.fillText(text, x, y + (1 - k) * 6);
    ctx.restore();
  }
  function bokehBg(ctx, warm) {
    ctx.fillStyle = FLAT.grad(ctx, 0, 0, 0, H, [[0, warm ? "#3a3438" : "#2a2e38"], [1, warm ? "#1c181c" : "#15171d"]]); ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) FLAT.glow(ctx, 180 + i * 230, 260 + (i % 3) * 200, 120, warm ? "rgba(255,200,140,0.12)" : "rgba(160,180,230,0.10)");
  }

  const SHOTS = [];
  const shot = (a, b, f, o = {}) => SHOTS.push(Object.assign({ a, b, f }, o));
  const ITEMS = ["learn guitar", "write a book", "call dad more", "take dad to the ocean"];

  // 0
  shot(0, 7.0, (ctx, lt, t) => card(ctx, ["Someday is the most comfortable word we have."], t, 0.6, 6.6, { size: 64 }), { look: { vignette: 0 } });

  // 1 — pinning the list
  shot(7.0, 15.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 1240, 560, key(lt, [[0, 1.35], [8, 1.45, E.sine]]));
    FLAT.apartment(ctx, { dust: 0.2 });
    const reach = prog(lt, 1.0, 2.2, E.out3) * (1 - prog(lt, 5.2, 6.2));
    sil(ctx, { kind: "noah", x: 1130, y: 840, s: 1.1, face: 0.6, armL: [0.1, 0.1], armR: [lerp(-0.2, 2.9, reach), lerp(-0.1, 0.4, reach)],
      e: { eyes: "open", look: [0.8, -0.5], brow: 0.1 } });
    ctx.restore();
  });
  // 2 — the list
  shot(15.0, 24.0, (ctx, lt, t) => { FLAT.list(ctx, { items: ITEMS, reveal: prog(lt, 0.6, 6.0, E.lin) }); });

  // 3 — the guitar gathers dust
  shot(24.0, 28.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 1060, 640, key(lt, [[0, 2.2], [4, 2.35, E.sine]]));
    FLAT.apartment(ctx, { dust: 1 });
    ctx.restore();
    speak(ctx, "someday.", 1300, 300, t, 24.8, 27.6);
  });
  // 4 — declined calls
  function callShot(ctx, t, a, date, declineAt) {
    bokehBg(ctx, false);
    FLAT.phone(ctx, 1000, 560, 0.86, -0.04, { mode: "call", date });
    const tap = prog(t, declineAt - 0.5, declineAt, E.io2);
    FLAT.thumb(ctx, lerp(1040, 900, tap), lerp(960, 850, tap));
  }
  shot(28.0, 31.5, (ctx, lt, t) => callShot(ctx, t, 28, "Tue, Mar 4", 30.8));
  shot(31.5, 36.0, (ctx, lt, t) => {
    bokehBg(ctx, false);
    const msg = "busy. call you later.";
    const n = Math.floor(clamp((t - 32.0) * 9, 0, msg.length));
    const sent = t > 34.6;
    FLAT.phone(ctx, 1000, 560, 0.86, -0.04, { mode: "text", date: "Tue, Mar 4", input: sent ? "" : msg.slice(0, n), msgs: sent ? [{ who: "me", text: msg }] : [] });
  });
  shot(36.0, 39.0, (ctx, lt, t) => callShot(ctx, t, 36, "Fri, Mar 14", 37.9));
  shot(39.0, 42.0, (ctx, lt, t) => callShot(ctx, t, 39, "Sun, Apr 6", 40.6));

  // 5
  shot(42.0, 48.0, (ctx, lt, t) => card(ctx, ["Later felt like a promise."], t, 42.5, 47.6), { look: { vignette: 0 } });

  // 6 — dad's visit
  shot(48.0, 76.0, (ctx, lt, t) => {
    const cx = key(lt, [[0, 800], [9.5, 800], [11, 880], [26, 850, E.sine]]);
    ctx.save(); cam(ctx, cx, 640, key(lt, [[0, 1.6], [28, 1.75, E.sine]]));
    FLAT.apartment(ctx, { dust: 1 });
    const dadTalk = (lt > 2.5 && lt < 10) || (lt > 15 && lt < 23.5);
    sil(ctx, { kind: "dad", x: 560, y: 712, s: 1.05, pose: "sit", face: 0.6, legDir: 1, legDrop: 116, armL: [0.3, 0.2], armR: [-0.4, -0.3],
      e: { eyes: lt > 19 && lt < 24 ? "happy" : "open", look: [lt < 6 ? 1 : 0.8, lt < 6 ? -0.5 : -0.1], brow: lt > 15 ? 0.6 : 0.2 }, tilt: dadTalk ? Math.sin(lt * 3) * 0.03 : 0 });
    const frozen = lt > 19;
    sil(ctx, { kind: "noah", x: 1120, y: 840, s: 1.1, face: -0.6, armL: [0.1, 0.1], armR: [-0.1, -0.1],
      e: { eyes: frozen ? "wide" : "open", look: [-0.9, 0.1], brow: frozen ? 0.9 : 0.1 } });
    ctx.restore();
    speak(ctx, "the ocean, huh?", 600, 300, t, 50.5, 53.6);
    speak(ctx, "we always said we'd go.", 600, 300, t, 54.0, 58.0);
    speak(ctx, "someday, dad. when work calms down.", 1180, 300, t, 58.5, 62.6);
    speak(ctx, "i'm seventy-eight, kid.", 600, 300, t, 63.0, 66.6);
    speak(ctx, "my somedays are running out.", 640, 300, t, 67.0, 71.8);
  });

  // 7
  shot(76.0, 82.0, (ctx, lt, t) => card(ctx, ["We all think we have more time."], t, 76.5, 81.6), { look: { vignette: 0 } });

  // 8 — night, on the floor
  shot(82.0, 96.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 1000, 640, key(lt, [[0, 1.3], [14, 1.5, E.sine]]));
    FLAT.apartment(ctx, { night: true, lamp: 1, dust: 1 });
    sil(ctx, { kind: "noah", x: 900, y: 830, s: 1.05, pose: "sit", face: 0.5, legDir: 1, legDrop: 0, armL: [0.9, -1.4], armR: [-0.9, 1.4],
      e: { eyes: lt > 9 ? "half" : "open", look: [0.9, -0.6], brow: 0.8 }, tilt: 0.05 });
    ctx.restore();
    speak(ctx, "it's too far. too much.", 960, 260, t, 85.5, 89.6);
    speak(ctx, "i can't do all of it.", 960, 260, t, 90.2, 94.6);
  });

  // 9 — one call
  shot(96.0, 104.0, (ctx, lt, t) => {
    bokehBg(ctx, true);
    const secs = Math.max(1, Math.floor(lt * 1.0));
    FLAT.phone(ctx, 1000, 560, 0.86, -0.04, { mode: "active", date: "Sun, Apr 6", timer: "00:" + String(secs).padStart(2, "0") });
    speak(ctx, "hi dad. just wanted to say goodnight.", 960, 900, t, 97.0, 101.6);
    speak(ctx, "...goodnight, kid.", 960, 900, t, 101.9, 104.0, { color: "#e6dcc4" });
  });

  // 10
  shot(104.0, 110.0, (ctx, lt, t) => card(ctx, ["He couldn't do it all at once.", "So he did one thing a day."], t, 104.4, 109.7, { stagger: 2.0 }), { look: { vignette: 0 } });

  // 11 — one thing a day
  shot(110.0, 116.0, (ctx, lt, t) => FLAT.fretboard(ctx, "C", { k: prog(lt, 0.5, 2.5), day: "day 1", lamp: true }));
  shot(116.0, 120.0, (ctx, lt, t) => FLAT.calendar(ctx, lerp(1, 6, prog(lt, 0.3, 3.6, E.lin))));
  shot(120.0, 124.0, (ctx, lt, t) => FLAT.fretboard(ctx, "G", { k: prog(lt, 0.3, 2.0), day: "day 9", lamp: true }));
  shot(124.0, 128.0, (ctx, lt, t) => {
    bokehBg(ctx, false);
    FLAT.phone(ctx, 1000, 560, 0.86, -0.04, { mode: "active", date: "Thu, Apr 24", timer: "01:" + String(10 + Math.floor(lt)).padStart(2, "0") });
    speak(ctx, "you called again.", 960, 900, t, 124.8, 127.8, { color: "#e6dcc4" });
  });
  shot(128.0, 132.0, (ctx, lt, t) => FLAT.fretboard(ctx, "Am", { k: prog(lt, 0.3, 2.0), day: "day 17", lamp: true }));
  shot(132.0, 136.0, (ctx, lt, t) => FLAT.calendar(ctx, lerp(6, 24, prog(lt, 0.2, 3.6, E.lin))));
  shot(136.0, 140.0, (ctx, lt, t) => FLAT.fretboard(ctx, "F", { k: prog(lt, 0.3, 2.4), day: "day 30", lamp: true }));

  // 12 — he picks dad up
  shot(140.0, 166.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, key(lt, [[0, 1100], [10, 980, E.io2]]), 600, key(lt, [[0, 1.1], [26, 1.3, E.sine]]));
    FLAT.dadHouse(ctx, { car: true });
    const walk = prog(lt, 0.5, 8.5, E.io2);
    sil(ctx, { kind: "noah", x: lerp(1560, 1050, walk), y: 840, s: 1.05, face: lt < 8.5 ? -0.6 : -0.4, walk: walk * 6, armL: [0.1, 0.1], armR: [-0.2, -0.1],
      e: { eyes: lt > 20 ? "happy" : "open", look: [-0.8, 0], brow: 0.1, smile: lt > 20 } });
    const open = prog(lt, 9.0, 10.0);
    if (open > 0) sil(ctx, { kind: "dad", x: 880, y: 800, s: 1.0, face: 0.5, alpha: open, cane: "R", armL: [0.2, 0.2], armR: [-0.3, -0.3],
      e: { eyes: lt > 22 ? "teary" : lt > 12 ? "wide" : "open", look: [0.8, 0], brow: lt > 17 ? 0.6 : 0.2, smile: lt > 22, tear: prog(lt, 23, 25) * 0.5 } });
    ctx.restore();
    speak(ctx, "what's all this?", 760, 300, t, 154.0, 157.2);
    speak(ctx, "you said your somedays were running out.", 1060, 300, t, 157.5, 161.6);
    speak(ctx, "so let's use one.", 1060, 300, t, 162.0, 165.6);
  });

  // 13 — the road
  shot(166.0, 180.0, (ctx, lt, t) => { FLAT.road(ctx, lt * 0.9, {}); }, { look: { vignette: 0.55 } });
  shot(180.0, 186.0, (ctx, lt, t) => { FLAT.road(ctx, lt * 0.9, { mode: "morning" }); }, { look: { vignette: 0.45 } });

  // 14 — the ocean
  shot(186.0, 196.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 560, key(lt, [[0, 1.0], [10, 1.12, E.sine]]));
    FLAT.beach(ctx);
    const w = prog(lt, 0, 6.5, E.out2);
    sil(ctx, { kind: "noah", x: lerp(300, 840, w), y: 900, s: 0.8, face: 0.5, walk: w * 5, armL: [0.1, 0.1], armR: [-0.9, -0.4], e: { eyes: "open", look: [0.6, -0.3] } });
    sil(ctx, { kind: "dad", x: lerp(390, 930, w), y: 900, s: 0.78, face: 0.4, walk: w * 5, cane: "R", armL: [0.6, 0.3], armR: [-0.3, -0.3], e: { eyes: lt > 7 ? "wide" : "open", look: [0.3, -0.5] } });
    ctx.restore();
  }, { look: { vignette: 0.35 } });
  shot(196.0, 204.0, (ctx, lt, t) => {
    FLAT.beach(ctx);
    ctx.save(); ctx.filter = "blur(2px)"; ctx.restore();
    close(ctx, 960, 560, 230, { eyes: "teary", look: [0.2, -0.4], brow: 0.7, browUp: 0.6, smile: true, tear: prog(lt, 1.5, 4) }, { cap: true, mustache: true, seed: 5 });
    speak(ctx, "it's bigger than i thought.", 960, 960, t, 198.0, 202.4);
  }, { look: { vignette: 0.35 } });
  shot(204.0, 216.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 920, 720, key(lt, [[0, 1.85], [12, 1.7, E.sine]]));
    FLAT.beach(ctx);
    const strum = Math.sin(lt * 7.5) * 0.25;
    // guitar on noah's lap
    sil(ctx, { kind: "dad", x: 700, y: 862, s: 1.0, pose: "sit", face: 0.5, legDir: 1, legDrop: 20, armL: [0.6, 0.6], armR: [-0.4, -0.4], tilt: Math.sin(lt * 1.4) * 0.06,
      e: { eyes: "closed", look: [0.3, 0], brow: 0.2, smile: true } });
    sil(ctx, { kind: "noah", x: 1120, y: 862, s: 1.05, pose: "sit", face: -0.4, legDir: -1, legDrop: 20, armL: [-1.75, 0.15], armR: [-0.3 + strum, -1.1],
      e: { eyes: lt > 4 ? "happy" : "open", look: [-0.6, 0.3], smile: true } });
    ctx.save(); ctx.translate(1110, 815); ctx.rotate(0.42);
    ctx.fillStyle = "#5a3a26"; ctx.fillRect(-200, -7, 120, 14); ctx.fillRect(-218, -12, 24, 24);
    ctx.fillStyle = "#8a5a3a"; ctx.beginPath(); ctx.ellipse(0, 0, 56, 44, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(-64, 0, 40, 34, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#3a2418"; ctx.beginPath(); ctx.arc(-30, 0, 13, 0, 7); ctx.fill();
    ctx.restore();
    // notes floating up
    for (let i = 0; i < 4; i++) {
      const ph = (lt * 0.4 + i / 4) % 1;
      ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.7; ctx.fillStyle = "#ffffff";
      ctx.font = `700 ${40 + i * 4}px serif`; ctx.fillText(i % 2 ? "♪" : "♫", 960 + Math.sin(ph * 6 + i) * 80, 700 - ph * 300);
      ctx.restore();
    }
    ctx.restore();
  }, { look: { vignette: 0.35 } });

  // 15 — the list, months later, and the call
  shot(216.0, 222.0, (ctx, lt, t) => FLAT.list(ctx, { items: ITEMS, crossed: [1, 0, 1, prog(lt, 0.8, 2.6)] }));
  shot(222.0, 230.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 1240, 560, key(lt, [[0, 1.4], [8, 1.5, E.sine]]));
    FLAT.apartment(ctx, { dust: 0, photo: true });
    const up = prog(lt, 0.8, 1.6, E.out3);
    sil(ctx, { kind: "noah", x: 1130, y: 840, s: 1.1, face: 0.2, armL: [0.1, 0.1], armR: [lerp(-0.2, -2.6, up), lerp(-0.1, -0.6, up)],
      e: { eyes: lt > 3 ? "happy" : "open", look: [0.2, -0.2], smile: true } });
    ctx.restore();
    speak(ctx, "hi dad.", 1100, 280, t, 224.6, 227.0);
    speak(ctx, "same time tomorrow?", 1100, 280, t, 227.3, 229.8, { color: "#e6dcc4" });
  });

  // 16
  shot(230.0, 240.0, (ctx, lt, t) => card(ctx, ["Someday isn't a day of the week.", "Pick one thing. Do it today."], t, 230.5, 239.6, { stagger: 2.4 }), { look: { vignette: 0 } });

  // 17 — title
  shot(240.0, 248.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const a = prog(lt, 0.3, 1.4) * (1 - prog(lt, 7.0, 8.0));
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `400 120px ${SERIF}`; ctx.fillStyle = "#f2f2ee"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.letterSpacing = "26px"; ctx.fillText("SOMEDAY", W / 2 + 13, 490); ctx.letterSpacing = "0px";
    ctx.globalAlpha = a * prog(lt, 1.6, 2.6);
    ctx.font = `italic 400 46px ${SERIF}`; ctx.fillStyle = "#d9d9d4";
    ctx.fillText("Don't wait for it.", W / 2, 600);
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
    let black = 0;
    const FADES = [[7.0, 0.8], [48.0, 0.8], [82.0, 0.8], [110.0, 0.6], [140.0, 0.8], [166.0, 0.6], [186.0, 0.8], [216.0, 0.6]];
    for (const [ft, d] of FADES) if (t >= ft && t < ft + d) black = Math.max(black, 1 - (t - ft) / d);
    const DIPS = [[41.4, 42.0], [75.4, 76.0], [103.4, 104.0], [229.4, 230.0], [179.4, 180.0], [185.2, 186.0]];
    for (const [a, b] of DIPS) if (t >= a && t < b) black = Math.max(black, (t - a) / (b - a));
    post(ctx, Object.assign({ black, vignette: 0.5, grain: 0.035 }, s.look || {}));
    ctx.restore();
  }

  window.FILM = { renderAt, DURATION, SHOTS, events: () => ({ taps: [] }) };
})();
