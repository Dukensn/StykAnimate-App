// Sets and props: line-art rooms, clocks, the phone UI.
(function () {
  const { PAL, G, skLine, skRect, skRR, skEll, skShape, rectPts, rrPts, ellPts, clamp, lerp, hash, noise1, mulberry } = F;
  const { circle, fillOutline } = C;

  // ---------- seven-segment clock digits
  const SEG = { 0: "abcfed", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
  function sevenSeg(ctx, str, x, y, h, color, glow = 1) {
    const w = h * 0.52, t = h * 0.13, gap = h * 0.16;
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 14 * glow;
    let cx = x;
    for (const ch of str) {
      if (ch === ":") {
        ctx.fillRect(cx + t * 0.2, y + h * 0.28, t, t); ctx.fillRect(cx + t * 0.2, y + h * 0.64, t, t);
        cx += t * 2.2; continue;
      }
      const on = SEG[ch] || "";
      const seg = {
        a: [cx + t, y, w - 2 * t, t], d: [cx + t, y + h - t, w - 2 * t, t], g: [cx + t, y + h / 2 - t / 2, w - 2 * t, t],
        f: [cx, y + t * 0.6, t, h / 2 - t], b: [cx + w - t, y + t * 0.6, t, h / 2 - t],
        e: [cx, y + h / 2 + t * 0.4, t, h / 2 - t], c: [cx + w - t, y + h / 2 + t * 0.4, t, h / 2 - t],
      };
      for (const k of "abcdefg") {
        ctx.globalAlpha = on.includes(k) ? 1 : 0.07;
        ctx.fillRect(...seg[k]);
      }
      ctx.globalAlpha = 1;
      cx += w + gap;
    }
    ctx.restore();
  }

  function moonWindow(ctx, x, y, w, h, o = {}) {
    // night sky
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.clip();
    ctx.fillStyle = o.sky || "#1a2030"; ctx.fillRect(x, y, w, h);
    if (o.day) {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, "#f2c98a"); g.addColorStop(1, "#f7e3b8");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    }
    // distant buildings
    const rnd = mulberry(o.seed || 4);
    ctx.fillStyle = o.day ? "rgba(150,110,80,0.35)" : "#141824";
    let bx = x - 10;
    while (bx < x + w) {
      const bw = 30 + rnd() * 50, bh = 30 + rnd() * h * 0.35;
      ctx.fillRect(bx, y + h - bh, bw, bh);
      if (!o.day) {
        for (let wy = y + h - bh + 10; wy < y + h - 8; wy += 16)
          for (let wx = bx + 6; wx < bx + bw - 8; wx += 12)
            if (rnd() > 0.82) { ctx.fillStyle = "rgba(255,210,140,0.55)"; ctx.fillRect(wx, wy, 5, 7); ctx.fillStyle = "#141824"; }
      }
      bx += bw + 4;
    }
    if (!o.day && o.moon !== false) {
      circle(ctx, x + w * 0.72, y + h * 0.28, Math.min(w, h) * 0.12);
      ctx.fillStyle = "#e8e6df"; ctx.shadowColor = "#e8e6df"; ctx.shadowBlur = 30; ctx.fill();
    }
    if (o.rain) {
      ctx.strokeStyle = "rgba(170,190,220,0.35)"; ctx.lineWidth = 1.5;
      const r2 = mulberry(Math.floor(G.t * 24));
      for (let i = 0; i < 40; i++) {
        const rx = x + r2() * w, ry = y + r2() * h;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 18); ctx.stroke();
      }
    }
    ctx.restore();
    skRR(ctx, x, y, w, h, null, 14, { w: 3, seed: 21 });
    skLine(ctx, [[x + w / 2, y], [x + w / 2, y + h]], { seed: 22 });
    skLine(ctx, [[x, y + h / 2], [x + w, y + h / 2]], { seed: 23 });
    skLine(ctx, [[x - 14, y + h + 8], [x + w + 14, y + h + 8]], { seed: 24, w: 3 });
  }

  // ---------- THEO'S ROOM
  function theoRoom(ctx, o = {}) {
    const dark = o.dark || 0;
    ctx.fillStyle = PAL.bg; ctx.fillRect(-400, -400, 2720, 1880);
    const FL = 830;
    // wall tone
    const wg = ctx.createRadialGradient(960, 420, 100, 960, 500, 1100);
    wg.addColorStop(0, "#1b1d24"); wg.addColorStop(1, "#0e0f13");
    ctx.fillStyle = wg; ctx.fillRect(-400, -400, 2720, FL + 400);
    ctx.fillStyle = "#0c0d10"; ctx.fillRect(-400, FL, 2720, 900);
    skLine(ctx, [[-200, FL], [2120, FL]], { seed: 1, w: 3 });
    moonWindow(ctx, 330, 230, 300, 270, { seed: 7, rain: o.rain });
    // framed photo (mom + little theo) above desk
    photoFrame(ctx, 1330, 330, 120, 100, o.photoGlow || 0);
    // bed
    const bx = 120, by = 700;
    skRect(ctx, bx, by + 70, 640, 26, PAL.fill2, { seed: 30 });
    skLine(ctx, [[bx + 20, by + 96], [bx + 20, FL]], { seed: 31, w: 3 });
    skLine(ctx, [[bx + 620, by + 96], [bx + 620, FL]], { seed: 32, w: 3 });
    skRR(ctx, bx - 10, by - 80, 26, 270, 8, PAL.fill2, { seed: 33 }); // headboard
    skRR(ctx, bx, by, 640, 72, 12, "#1f232c", { seed: 34 }); // mattress
    if (o.pillow !== false) skRR(ctx, bx + 26, by - 30, 150, 40, 18, "#2a2e38", { seed: 35 });
    // nightstand
    const nx = 800;
    skRect(ctx, nx, 720, 130, 110, PAL.fill, { seed: 40 });
    skLine(ctx, [[nx + 10, 775], [nx + 120, 775]], { seed: 41 });
    circle(ctx, nx + 65, 750, 4); ctx.fillStyle = PAL.line; ctx.fill();
    // clock
    skRR(ctx, nx + 12, 662, 106, 58, 8, "#0d0e12", { seed: 42 });
    sevenSeg(ctx, o.clock || "11:52", nx + 22, 674, 32, PAL.red, 0.8);
    // lamp
    if (o.lamp !== undefined) lamp(ctx, nx + 112, 662, o.lamp);
    // desk
    const dx = 1180;
    skLine(ctx, [[dx, 690], [dx + 440, 690]], { seed: 50, w: 4 });
    skLine(ctx, [[dx + 20, 690], [dx + 20, FL]], { seed: 51, w: 3 });
    skLine(ctx, [[dx + 420, 690], [dx + 420, FL]], { seed: 52, w: 3 });
    // laptop closed + books
    skRect(ctx, dx + 260, 676, 140, 12, PAL.fill2, { seed: 53 });
    skRect(ctx, dx + 40, 660, 110, 14, "#2c3a33", { seed: 54, color: "#7f8f86" });
    skRect(ctx, dx + 48, 646, 96, 14, "#3a2e2c", { seed: 55, color: "#8f807c" });
    if (o.noodles) noodleCup(ctx, dx + 190, 690, o.noodles);
    // chair
    skLine(ctx, [[dx + 120, 520], [dx + 120, 740], [dx + 230, 740], [dx + 230, FL]], { seed: 56, w: 3 });
    skLine(ctx, [[dx + 120, 740], [dx + 120, FL]], { seed: 57, w: 3 });
    // door
    skRect(ctx, 1700, 380, 190, 450, "#121318", { seed: 60 });
    circle(ctx, 1730, 610, 6); ctx.fillStyle = PAL.line; ctx.fill();
    if (dark > 0) {
      ctx.fillStyle = `rgba(0,0,0,${dark})`;
      ctx.fillRect(-400, -400, 2720, 1880);
    }
  }
  function lamp(ctx, x, y, on) {
    skLine(ctx, [[x, y], [x, y - 70], [x - 26, y - 100]], { seed: 70, w: 3 });
    skShape(ctx, [[x - 50, y - 92], [x - 18, y - 128], [x + 2, y - 104], [x - 26, y - 72]], PAL.fill2, { seed: 71 });
    if (on > 0) {
      ctx.save();
      const g = ctx.createRadialGradient(x - 40, y - 70, 10, x - 40, y + 40, 360);
      g.addColorStop(0, `rgba(255,214,150,${0.32 * on})`); g.addColorStop(1, "rgba(255,214,150,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 500, y - 400, 1000, 800);
      ctx.restore();
    }
  }
  function noodleCup(ctx, x, y, k) {
    skShape(ctx, [[x - 26, y - 56], [x + 26, y - 56], [x + 18, y], [x - 18, y]], "#d8d1bf", { seed: 80, color: "#9a9384" });
    ctx.fillStyle = "#b03a2e"; ctx.fillRect(x - 22, y - 38, 44, 10);
    skLine(ctx, [[x + 4, y - 56], [x + 30, y - 110]], { seed: 81, color: "#c9b48a", w: 3 });
    skLine(ctx, [[x + 12, y - 56], [x + 36, y - 106]], { seed: 82, color: "#c9b48a", w: 3 });
    steam(ctx, x, y - 64, 0.5 * k, 3);
  }
  function steam(ctx, x, y, a, n = 3, h = 90) {
    ctx.save();
    ctx.strokeStyle = `rgba(230,225,215,${0.28 * a})`; ctx.lineWidth = 4; ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      const ox = (i - (n - 1) / 2) * 18;
      for (let k = 0; k <= 12; k++) {
        const yy = y - (k / 12) * h;
        const xx = x + ox + Math.sin(k * 0.7 + G.t * 2.4 + i * 2) * 7 * (k / 12 + 0.2);
        k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  // tiny doodle photo: mom holding a small kid
  function photoFrame(ctx, x, y, w, h, glow = 0, o = {}) {
    skRect(ctx, x, y, w, h, o.fill || "#d9d2c2", { seed: 90, color: o.frameColor || "#9a9384", w: 4 });
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 8, y + 8, w - 16, h - 16); ctx.clip();
    ctx.fillStyle = o.photoBg || "#c9b28d"; ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
    const sc = (w - 16) / 104;
    ctx.translate(x + 8, y + 8); ctx.scale(sc, sc);
    // mom
    circle(ctx, 40, 40, 17); fillOutline(ctx, PAL.cream, 0.5);
    circle(ctx, 43, 22, 7); fillOutline(ctx, "#9fa1a6", 0.5);
    ctx.beginPath(); ctx.roundRect(22, 56, 36, 40, 10); fillOutline(ctx, PAL.cardigan, 0.5);
    // kid
    circle(ctx, 68, 56, 12); fillOutline(ctx, PAL.cream, 0.5);
    ctx.beginPath(); ctx.roundRect(58, 68, 22, 24, 8); fillOutline(ctx, "#5a7fa8", 0.5);
    ctx.fillStyle = PAL.ink;
    for (const [ex, ey, r] of [[35, 40, 1.8], [45, 40, 1.8], [64, 56, 1.5], [72, 56, 1.5]]) { circle(ctx, ex, ey, r); ctx.fill(); }
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(40, 45, 5, 0.3, 2.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(68, 60, 4, 0.3, 2.8); ctx.stroke();
    ctx.restore();
    if (glow > 0) {
      ctx.save(); ctx.globalAlpha = glow * 0.4;
      const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w);
      g.addColorStop(0, "rgba(255,220,160,1)"); g.addColorStop(1, "rgba(255,220,160,0)");
      ctx.fillStyle = g; ctx.fillRect(x - w, y - h, w * 3, h * 3); ctx.restore();
    }
  }

  // ---------- MOM'S KITCHEN. mode: 'night' | 'past' | 'day'
  function kitchen(ctx, o = {}) {
    const mode = o.mode || "night";
    const FL = 830;
    const wallA = mode === "day" ? "#5a4636" : mode === "past" ? "#2a2722" : "#191a1f";
    const wallB = mode === "day" ? "#3a2c22" : mode === "past" ? "#16140f" : "#0e0f12";
    const lineC = mode === "day" ? "#e0c9a8" : mode === "past" ? "#a39a88" : PAL.line;
    const fillC = mode === "day" ? "#4a3a2e" : mode === "past" ? "#24211c" : PAL.fill;
    const L = { color: lineC };
    ctx.fillStyle = wallB; ctx.fillRect(-400, -400, 2720, 1880);
    const wg = ctx.createRadialGradient(900, 360, 80, 900, 460, 1100);
    wg.addColorStop(0, wallA); wg.addColorStop(1, wallB);
    ctx.fillStyle = wg; ctx.fillRect(-400, -400, 2720, FL + 400);
    ctx.fillStyle = mode === "day" ? "#2c2119" : "#0b0b0d"; ctx.fillRect(-400, FL, 2720, 900);
    skLine(ctx, [[-200, FL], [2120, FL]], Object.assign({ seed: 101, w: 3 }, L));
    // window with curtains
    moonWindow(ctx, 760, 220, 300, 250, { seed: 12, day: mode === "day", sky: mode === "past" ? "#2b2a26" : undefined, moon: mode === "night" });
    for (const sd of [-1, 1]) {
      const cx = sd < 0 ? 730 : 1060;
      skShape(ctx, [[cx, 200], [cx + 40 * -sd * -1, 200], [cx + 30 * sd * -1 + 10 * sd, 480], [cx, 490]].map(([x, y]) => [x, y]),
        mode === "day" ? "#9b5b45" : mode === "past" ? "#5b4a3c" : "#2b2730", Object.assign({ seed: 102 + sd }, L));
    }
    skLine(ctx, [[700, 200], [1100, 200]], Object.assign({ seed: 104, w: 4 }, L));
    // counter + stove (right)
    skRect(ctx, 1240, 640, 560, 190, fillC, Object.assign({ seed: 110 }, L));
    skLine(ctx, [[1240, 660], [1800, 660]], Object.assign({ seed: 111 }, L));
    for (let i = 0; i < 3; i++) skRect(ctx, 1270 + i * 180, 690, 150, 120, null, Object.assign({ seed: 112 + i }, L));
    // pot
    skShape(ctx, [[1430, 590], [1550, 590], [1540, 640], [1440, 640]], mode === "day" ? "#7d8a8f" : "#3a3f45", Object.assign({ seed: 120 }, L));
    skLine(ctx, [[1420, 592], [1560, 592]], Object.assign({ seed: 121, w: 4 }, L));
    if (o.steam) steam(ctx, 1490, 580, o.steam, 3, 120);
    // upper cabinets
    skRect(ctx, 1260, 220, 520, 170, fillC, Object.assign({ seed: 130 }, L));
    skLine(ctx, [[1520, 220], [1520, 390]], Object.assign({ seed: 131 }, L));
    // fridge (left) with a child's drawing
    skRR(ctx, 120, 300, 230, 530, 14, fillC, Object.assign({ seed: 140 }, L));
    skLine(ctx, [[120, 480], [350, 480]], Object.assign({ seed: 141 }, L));
    skLine(ctx, [[320, 340], [320, 440]], Object.assign({ seed: 142, w: 4 }, L));
    skLine(ctx, [[320, 520], [320, 640]], Object.assign({ seed: 143, w: 4 }, L));
    // kid drawing on fridge
    ctx.save(); ctx.translate(170, 330); ctx.rotate(-0.06);
    ctx.fillStyle = mode === "day" ? "#efe6d2" : mode === "past" ? "#9c937f" : "#8a8678"; ctx.fillRect(0, 0, 100, 80);
    ctx.strokeStyle = mode === "day" ? "#d2603f" : "#6e4a3a"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(30, 32, 10, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(66, 40, 8, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(30, 42); ctx.lineTo(30, 66); ctx.moveTo(66, 48); ctx.lineTo(66, 66); ctx.stroke();
    ctx.strokeStyle = mode === "day" ? "#e0a020" : "#7a6a30"; ctx.beginPath(); ctx.arc(84, 14, 8, 0, 7); ctx.stroke();
    ctx.restore();
    // wall clock
    skEll(ctx, 560, 300, 42, 42, fillC, Object.assign({ seed: 150 }, L));
    skLine(ctx, [[560, 300], [560, 272]], Object.assign({ seed: 151, w: 3 }, L));
    skLine(ctx, [[560, 300], [578, 310]], Object.assign({ seed: 152, w: 3 }, L));
    // hanging lamp
    skLine(ctx, [[900, -200], [900, 300 - 40]], Object.assign({ seed: 160 }, L));
    skShape(ctx, [[860, 300 - 40], [940, 300 - 40], [970, 320 - 20], [830, 320 - 20]], fillC, Object.assign({ seed: 161 }, L));
    const lampOn = o.lamp ?? (mode === "night" ? 1 : mode === "past" ? 1 : 0.4);
    if (lampOn > 0) {
      ctx.save();
      const g = ctx.createRadialGradient(900, 310, 10, 900, 600, 520);
      const col = mode === "day" ? "255,220,160" : "255,205,140";
      g.addColorStop(0, `rgba(${col},${0.3 * lampOn})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.fillRect(300, 280, 1200, 700);
      ctx.restore();
    }
    // table + chairs
    const T = o.table !== false;
    if (T) {
      for (const cx of [700, 1100]) {
        skLine(ctx, [[cx, 560], [cx, 720], [cx + (cx < 900 ? -70 : 70), 720], [cx + (cx < 900 ? -70 : 70), FL]], Object.assign({ seed: 170 + cx }, L, { w: 3 }));
        skLine(ctx, [[cx, 720], [cx, FL]], Object.assign({ seed: 171 + cx }, L, { w: 3 }));
      }
    }
    if (mode === "day") {
      // light shafts from the window
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(900, 220, 1100, 900);
      g.addColorStop(0, "rgba(255,200,120,0.16)"); g.addColorStop(1, "rgba(255,200,120,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(770, 230); ctx.lineTo(1050, 230); ctx.lineTo(1400, 900); ctx.lineTo(900, 900); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  function table(ctx, o = {}) {
    const mode = o.mode || "night";
    const lineC = mode === "day" ? "#e0c9a8" : mode === "past" ? "#a39a88" : PAL.line;
    const top = mode === "day" ? "#6a4f3a" : mode === "past" ? "#2e2a23" : "#1f2128";
    skRect(ctx, 640, 640, 520, 22, top, { seed: 180, color: lineC, w: 3 });
    skLine(ctx, [[670, 662], [670, 830]], { seed: 181, color: lineC, w: 3 });
    skLine(ctx, [[1130, 662], [1130, 830]], { seed: 182, color: lineC, w: 3 });
  }
  function bowl(ctx, x, y, mode, steamA) {
    const lineC = mode === "day" ? "#5a4636" : PAL.ink;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - 46, y - 30); ctx.quadraticCurveTo(x, y + 26, x + 46, y - 30); ctx.closePath();
    ctx.fillStyle = "#e9e1cf"; ctx.fill(); ctx.strokeStyle = lineC; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - 30, 46, 8, 0, 0, Math.PI * 2); ctx.fillStyle = "#c9873e"; ctx.fill(); ctx.stroke();
    ctx.restore();
    if (steamA) steam(ctx, x, y - 40, steamA, 2, 70);
  }

  // ---------- PHONE (close-up)
  // st: {msgs:[{who:'mom'|'me', text, ts}], header, status, input, caret, typing(0..1 visible), dots, kb, sendHot,
  //      receipt, call:0..1, screenOn, lockTime, notif}
  function phone(ctx, cx, cy, sc, rot, st = {}) {
    const PW = 560, PH = 1080;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot || 0); ctx.scale(sc, sc);
    // glow on surroundings
    const on = st.screenOn ?? 1;
    if (on > 0) {
      const g = ctx.createRadialGradient(0, 0, 100, 0, 0, 900);
      g.addColorStop(0, `rgba(120,150,220,${0.18 * on})`); g.addColorStop(1, "rgba(120,150,220,0)");
      ctx.fillStyle = g; ctx.fillRect(-1000, -1000, 2000, 2000);
    }
    // body
    ctx.beginPath(); ctx.roundRect(-PW / 2 - 16, -PH / 2 - 16, PW + 32, PH + 32, 70);
    ctx.fillStyle = "#0a0a0d"; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = "#3a3d45"; ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(-PW / 2, -PH / 2, PW, PH, 56); ctx.clip();
    ctx.fillStyle = "#0e1016"; ctx.fillRect(-PW / 2, -PH / 2, PW, PH);
    if (st.call > 0) callScreen(ctx, PW, PH, st);
    else if (st.lock) lockScreen(ctx, PW, PH, st);
    else chatScreen(ctx, PW, PH, st);
    if (on < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - on})`; ctx.fillRect(-PW / 2, -PH / 2, PW, PH); }
    ctx.restore();
    // notch
    ctx.beginPath(); ctx.roundRect(-70, -PH / 2 + 14, 140, 34, 17); ctx.fillStyle = "#000"; ctx.fill();
    ctx.restore();
  }
  function txt(ctx, s, x, y, size, color, align = "left", weight = "700", font) {
    ctx.font = `${weight} ${size}px ${font || F.FONT.narr}`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.fillText(s, x, y);
  }
  function wrap(ctx, s, maxW, size) {
    ctx.font = `700 ${size}px ${F.FONT.narr}`;
    const words = s.split(" "); const lines = []; let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function chatScreen(ctx, PW, PH, st) {
    const L = -PW / 2, T = -PH / 2;
    // status bar
    txt(ctx, st.clock || "11:52", L + 50, T + 32, 22, "#d8dbe2");
    // header
    ctx.fillStyle = "#151821"; ctx.fillRect(L, T + 60, PW, 110);
    txt(ctx, "‹", L + 30, T + 115, 52, "#6aa0ff", "left", "400");
    circle(ctx, L + 105, T + 115, 30); ctx.fillStyle = "#c9b28d"; ctx.fill();
    // mini mom avatar
    circle(ctx, L + 105, T + 120, 17); ctx.fillStyle = PAL.cream; ctx.fill();
    circle(ctx, L + 108, T + 100, 8); ctx.fillStyle = "#9fa1a6"; ctx.fill();
    txt(ctx, st.header || "Mom", L + 150, T + 103, 30, "#f1f2f5");
    if (st.header !== undefined || true) { ctx.fillStyle = "#e86f8a"; txt(ctx, "♥", L + 150 + ctx.measureText(st.header || "Mom").width + 12, T + 103, 24, "#e86f8a", "left", "700", "sans-serif"); }
    txt(ctx, st.status || "", L + 150, T + 136, 20, st.status === "online" ? "#58d68d" : "#8b909a", "left", "400");
    // messages, laid out bottom-up above the input area
    const kbH = st.kb ? 330 : 0;
    const inputY = PH / 2 - kbH - 70;
    let y = inputY - 40 - (st.typing > 0 ? 80 * Math.min(1, st.typing * 3) : 0);
    const msgs = (st.msgs || []).slice().reverse();
    ctx.save();
    ctx.beginPath(); ctx.rect(L, T + 170, PW, inputY - 30 - (T + 170)); ctx.clip();
    if (st.receipt) { txt(ctx, st.receipt, PW / 2 - 40, y, 19, "#9aa0ab", "right", "400"); y -= 34; }
    for (const m of msgs) {
      const size = 27;
      const lines = wrap(ctx, m.text, PW * 0.6, size);
      ctx.font = `700 ${size}px ${F.FONT.narr}`;
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44;
      const h = lines.length * 36 + 26;
      const me = m.who === "me";
      const bx = me ? PW / 2 - 30 - w : L + 30;
      const pop = m.pop ?? 1;
      ctx.save();
      ctx.globalAlpha *= clamp(pop * 1.5, 0, 1);
      const pcx = me ? bx + w : bx, pcy = y;
      ctx.translate(pcx, pcy); ctx.scale(0.6 + 0.4 * F.E.back(clamp(pop, 0, 1)), 0.6 + 0.4 * F.E.back(clamp(pop, 0, 1))); ctx.translate(-pcx, -pcy);
      ctx.beginPath(); ctx.roundRect(bx, y - h, w, h, 24);
      ctx.fillStyle = me ? PAL.blue : "#2a2e39"; ctx.fill();
      lines.forEach((l, i) => txt(ctx, l, bx + 22, y - h + 30 + i * 36, size, "#f4f5f8"));
      ctx.restore();
      y -= h + 14;
      if (m.ts) { txt(ctx, m.ts, 0, y - 6, 18, "#7e8490", "center", "400"); y -= 40; }
    }
    // typing dots bubble (mom)
    ctx.restore();
    if (st.typing > 0) {
      const yy = inputY - 40 - (st.typingOffset || 0);
      ctx.save(); ctx.globalAlpha *= st.typing;
      ctx.beginPath(); ctx.roundRect(L + 30, yy - 62, 110, 62, 26); ctx.fillStyle = "#2a2e39"; ctx.fill();
      for (let i = 0; i < 3; i++) {
        const ph = Math.max(0, Math.sin(G.t * 6 - i * 0.9));
        circle(ctx, L + 58 + i * 27, yy - 31 - ph * 6, 8); ctx.fillStyle = `rgba(200,205,215,${0.45 + 0.5 * ph})`; ctx.fill();
      }
      ctx.restore();
    }
    // input bar
    ctx.beginPath(); ctx.roundRect(L + 24, inputY - 30, PW - 120, 64, 32);
    ctx.fillStyle = "#1a1d26"; ctx.fill(); ctx.strokeStyle = "#343846"; ctx.lineWidth = 2; ctx.stroke();
    const input = st.input || "";
    ctx.save(); ctx.beginPath(); ctx.rect(L + 40, inputY - 30, PW - 150, 64); ctx.clip();
    txt(ctx, input || (st.placeholder ?? "Message"), L + 48, inputY + 2, 27, input ? "#f2f3f6" : "#5c6270", "left", input ? "700" : "400");
    ctx.font = `700 27px ${F.FONT.narr}`;
    const cw = input ? ctx.measureText(input).width : 0;
    if (st.caret && Math.floor(G.t * 2) % 2 === 0) { ctx.fillStyle = "#6aa0ff"; ctx.fillRect(L + 50 + cw, inputY - 16, 3, 34); }
    ctx.restore();
    // send button
    const hot = st.sendHot || 0;
    circle(ctx, PW / 2 - 56, inputY + 2, 28);
    ctx.fillStyle = input ? PAL.blue : "#2a2e39"; ctx.fill();
    if (hot > 0) { ctx.save(); ctx.shadowColor = PAL.blue; ctx.shadowBlur = 40 * hot; ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(PW / 2 - 56, inputY + 14); ctx.lineTo(PW / 2 - 56, inputY - 10);
    ctx.moveTo(PW / 2 - 66, inputY); ctx.lineTo(PW / 2 - 56, inputY - 10); ctx.lineTo(PW / 2 - 46, inputY); ctx.stroke();
    // keyboard
    if (st.kb) {
      const ky = PH / 2 - kbH;
      ctx.fillStyle = "#16181f"; ctx.fillRect(L, ky, PW, kbH);
      const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
      const pressed = st.pressed || "";
      rows.forEach((r, ri) => {
        const kw = 46, gap = 8;
        const rw = r.length * (kw + gap) - gap;
        let x0 = -rw / 2;
        for (const ch of r) {
          const kyy = ky + 24 + ri * 70;
          const isP = pressed === ch;
          ctx.beginPath(); ctx.roundRect(x0, kyy, kw, 58, 8);
          ctx.fillStyle = isP ? "#5a5f6e" : "#2c303b"; ctx.fill();
          txt(ctx, ch, x0 + kw / 2, kyy + 29, 24, "#d5d8de", "center", "400");
          x0 += kw + gap;
        }
      });
      ctx.beginPath(); ctx.roundRect(-150, ky + 24 + 3 * 70, 300, 58, 8); ctx.fillStyle = pressed === " " ? "#5a5f6e" : "#2c303b"; ctx.fill();
      ctx.beginPath(); ctx.roundRect(198, ky + 24 + 2 * 70, 68, 58, 8); ctx.fillStyle = pressed === "⌫" ? "#5a5f6e" : "#3a3f4c"; ctx.fill();
      txt(ctx, "⌫", 232, ky + 24 + 2 * 70 + 29, 26, "#d5d8de", "center", "400", "sans-serif");
    }
  }
  function lockScreen(ctx, PW, PH, st) {
    const g = ctx.createLinearGradient(0, -PH / 2, 0, PH / 2);
    g.addColorStop(0, "#1b2238"); g.addColorStop(1, "#2a2440");
    ctx.fillStyle = g; ctx.fillRect(-PW / 2, -PH / 2, PW, PH);
    txt(ctx, st.lockDate || "Tuesday, October 14", 0, -PH / 2 + 150, 26, "#cfd3e0", "center", "400");
    txt(ctx, st.lockTime || "3:17", 0, -PH / 2 + 240, 110, "#eef0f6", "center", "700");
    if (st.notif > 0) {
      ctx.save(); ctx.globalAlpha *= st.notif;
      const y = -PH / 2 + 380 + (1 - st.notif) * -30;
      ctx.beginPath(); ctx.roundRect(-PW / 2 + 26, y, PW - 52, 120, 26); ctx.fillStyle = "rgba(60,64,80,0.85)"; ctx.fill();
      circle(ctx, -PW / 2 + 80, y + 60, 28); ctx.fillStyle = "#c9b28d"; ctx.fill();
      txt(ctx, st.notifTitle || "Mom", -PW / 2 + 126, y + 40, 26, "#f1f2f5");
      txt(ctx, st.notifText || "", -PW / 2 + 126, y + 80, 24, "#d5d8e0", "left", "400");
      ctx.restore();
    }
  }
  function callScreen(ctx, PW, PH, st) {
    ctx.save(); ctx.globalAlpha *= st.call;
    const g = ctx.createLinearGradient(0, -PH / 2, 0, PH / 2);
    g.addColorStop(0, "#2a3348"); g.addColorStop(1, "#141824");
    ctx.fillStyle = g; ctx.fillRect(-PW / 2, -PH / 2, PW, PH);
    // avatar with pulsing rings
    for (let i = 0; i < 3; i++) {
      const ph = (G.t * 0.8 + i / 3) % 1;
      circle(ctx, 0, -180, 90 + ph * 120); ctx.strokeStyle = `rgba(255,255,255,${0.25 * (1 - ph)})`; ctx.lineWidth = 3; ctx.stroke();
    }
    circle(ctx, 0, -180, 90); ctx.fillStyle = "#c9b28d"; ctx.fill();
    circle(ctx, 0, -170, 52); ctx.fillStyle = PAL.cream; ctx.fill();
    circle(ctx, 8, -228, 22); ctx.fillStyle = "#9fa1a6"; ctx.fill();
    txt(ctx, "Mom", 0, 0, 52, "#f4f5f8", "center");
    txt(ctx, st.callLabel || "incoming call…", 0, 54, 26, "#aab0bf", "center", "400");
    // buttons
    circle(ctx, -140, 330, 50); ctx.fillStyle = "#e5484d"; ctx.fill();
    circle(ctx, 140, 330, 50 * (1 + 0.06 * Math.sin(G.t * 8))); ctx.fillStyle = "#30c46b"; ctx.fill();
    ctx.restore();
  }
  // a hand holding the phone from below-left (thumb free) — drawn in phone space
  function phoneHand(ctx, cx, cy, sc, rot, thumb = { x: 120, y: 330, press: 0 }, layer = "front") {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot || 0); ctx.scale(sc, sc);
    if (layer === "back") {
      // palm behind the phone, sleeve at the bottom-left
      ctx.beginPath();
      ctx.moveTo(-250, 110); ctx.bezierCurveTo(-360, 120, -420, 300, -430, 520);
      ctx.lineTo(-470, 900); ctx.lineTo(60, 900); ctx.lineTo(0, 560); ctx.bezierCurveTo(-80, 420, -160, 200, -250, 110);
      fillOutline(ctx, PAL.creamShade, 1.4);
      ctx.beginPath(); ctx.moveTo(-500, 700); ctx.bezierCurveTo(-300, 660, -100, 690, 90, 740); ctx.lineTo(120, 1000); ctx.lineTo(-520, 1000); ctx.closePath();
      fillOutline(ctx, PAL.hoodie, 1.4);
      ctx.restore();
      return;
    }
    // fingertips curling over the left edge
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.roundRect(-322, 130 + i * 76, 52, 60, 26);
      fillOutline(ctx, PAL.cream, 1.4);
    }
    const bx = -40, by = 640;
    const tx = thumb.x, ty = thumb.y + (thumb.press || 0) * 10;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo((bx + tx) / 2 + 40, (by + ty) / 2 + 70, tx, ty);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 84; ctx.stroke();
    ctx.strokeStyle = PAL.cream; ctx.lineWidth = 76; ctx.stroke();
    ctx.save(); ctx.translate(tx, ty);
    ctx.rotate(Math.atan2(ty - by, tx - bx) + Math.PI / 2);
    ctx.beginPath(); ctx.roundRect(-16, -26, 32, 30, 10); ctx.fillStyle = "#f3eee2"; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  window.Pr = { sevenSeg, moonWindow, theoRoom, lamp, steam, photoFrame, kitchen, table, bowl, phone, phoneHand, txt, wrap, noodleCup };
})();
