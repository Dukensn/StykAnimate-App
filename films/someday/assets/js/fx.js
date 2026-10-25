// Text, HUD, speech bubbles and the film look (grain, vignette, letterbox).
(function () {
  const { W, H, BAR, PAL, G, clamp, lerp, E, prog, mulberry, hash, FONT } = F;

  function setFont(ctx, size, weight = "700", fam = FONT.narr) { ctx.font = `${weight} ${size}px ${fam}`; }

  // narration: lines reveal word by word (blur + fade), then fade out together
  // lines: [{text, size, weight, color}] ; opts {y, x, align, gap}
  function narr(ctx, lines, t, a, b, o = {}) {
    if (t < a || t > b) return;
    const out = clamp((b - t) / 0.35, 0, 1);
    const cx = o.x ?? W / 2;
    let y = o.y ?? 935;
    const gap = o.gap ?? 1.25;
    const total = lines.reduce((s, l) => s + (l.size || 58) * gap, 0);
    if (o.center) y = (o.cy ?? H / 2) - total / 2 + (lines[0].size || 58) * 0.6;
    let wordIndex = 0;
    ctx.save();
    ctx.textBaseline = "middle";
    for (let li = 0; li < lines.length; li++) {
      const L = lines[li];
      const size = L.size || 58;
      setFont(ctx, size, L.weight || "700");
      const words = L.text.split(" ");
      const space = ctx.measureText(" ").width;
      const widths = words.map((w) => ctx.measureText(w).width);
      const tw = widths.reduce((s, w) => s + w, 0) + space * (words.length - 1);
      let x = o.align === "left" ? cx : cx - tw / 2;
      const la = a + (L.delay || 0);
      for (let wi = 0; wi < words.length; wi++) {
        const wt = la + wi * (L.stagger ?? 0.075);
        const k = clamp((t - wt) / 0.22, 0, 1);
        if (k > 0) {
          ctx.globalAlpha = E.out3(k) * out * (o.alpha ?? 1);
          const bl = (1 - k) * 7;
          ctx.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : "none";
          ctx.fillStyle = L.color || PAL.white;
          ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 12;
          ctx.textAlign = "left";
          ctx.fillText(words[wi], x, y + (1 - E.out3(k)) * 4);
        }
        x += widths[wi] + space;
        wordIndex++;
      }
      y += size * gap;
    }
    ctx.restore();
  }

  // handwritten amber voice of Pride: letters write on, slight float
  function hand(ctx, text, x, y, t, a, b, o = {}) {
    if (t < a || t > b) return;
    const size = o.size || 46;
    const out = clamp((b - t) / 0.5, 0, 1);
    const n = Math.floor((t - a) * (o.cps || 22));
    const shown = text.slice(0, n);
    ctx.save();
    ctx.translate(x, y + Math.sin((t - a) * 1.3) * 3);
    ctx.rotate(o.rot ?? -0.05);
    setFont(ctx, size, o.weight || "600", FONT.hand);
    ctx.textAlign = o.align || "left"; ctx.textBaseline = "middle";
    ctx.globalAlpha = out * (o.alpha ?? 1);
    ctx.shadowColor = o.color || PAL.amber; ctx.shadowBlur = o.glow ?? 16;
    ctx.fillStyle = o.color || PAL.amberHot;
    ctx.fillText(shown, 0, 0);
    ctx.restore();
  }

  // HUD in the top-left: month label + DRAFTS / SENT box
  function hud(ctx, h) {
    if (!h || h.alpha <= 0) return;
    const x = h.x ?? 110, y = h.y ?? 150;
    ctx.save();
    ctx.globalAlpha = h.alpha;
    ctx.textBaseline = "middle";
    setFont(ctx, 36);
    ctx.fillStyle = "#d9dade"; ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 8;
    ctx.fillText(h.label, x, y + 4);
    const lw = ctx.measureText(h.label).width;
    const bx = x + lw + 26, by = y - 44, bw = h.bw ?? 270, bh = 96;
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10);
    ctx.fillStyle = "rgba(10,11,14,0.72)"; ctx.fill();
    ctx.strokeStyle = "rgba(160,165,175,0.55)"; ctx.lineWidth = 2; ctx.stroke();
    setFont(ctx, 26);
    ctx.fillStyle = "#a7abb3";
    ctx.fillText(h.l1 || "DRAFTS", bx + 20, by + 28);
    ctx.fillText(h.l2 || "SENT", bx + 20, by + 68);
    // values with pop
    const pop = (v, f, yy, col) => {
      ctx.save();
      const s = 1 + 0.35 * (f || 0);
      ctx.translate(bx + bw - 24, yy); ctx.scale(s, s);
      setFont(ctx, 32); ctx.textAlign = "right";
      ctx.fillStyle = col;
      if (f > 0) { ctx.shadowColor = col; ctx.shadowBlur = 20 * f; }
      ctx.fillText(v, 0, 0);
      ctx.restore();
    };
    pop(String(h.drafts), h.fD, by + 28, h.dCol || "#f1f1f1");
    pop(String(h.sent), h.fS, by + 68, h.sCol || (h.sent > 0 ? PAL.amberHot : "#f1f1f1"));
    if (h.strikeD > 0) {
      ctx.strokeStyle = PAL.red; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx + bw - 90, by + 28); ctx.lineTo(bx + bw - 90 + 70 * h.strikeD, by + 28); ctx.stroke();
    }
    ctx.restore();
  }

  // speech bubble with tail. tail: [tx, ty] point the tail aims at
  function bubble(ctx, text, x, y, t, a, b, o = {}) {
    if (t < a || t > b) return;
    const k = clamp((t - a) / 0.25, 0, 1), out = clamp((b - t) / 0.25, 0, 1);
    const size = o.size || 44;
    setFont(ctx, size);
    const tw = ctx.measureText(text).width;
    const w = tw + 48, h = size + 34;
    ctx.save();
    ctx.globalAlpha = out * (o.alpha ?? 1);
    ctx.translate(x, y);
    const s = 0.7 + 0.3 * E.back(k);
    ctx.scale(s, s);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 18);
    const tail = o.tail || [0, h];
    ctx.moveTo(-14, h / 2 - 1); ctx.lineTo(tail[0], tail[1]); ctx.lineTo(14, h / 2 - 1);
    ctx.fillStyle = o.fill || "#f6f3ec"; ctx.fill();
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = o.color || "#1b1c20"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text.slice(0, Math.ceil(text.length * clamp((t - a) / (o.typeDur || 0.5), 0, 1))), 0, 1);
    ctx.restore();
  }

  // ---- film look
  let grainTiles = null;
  function makeGrain() {
    grainTiles = [];
    for (let k = 0; k < 6; k++) {
      const c = document.createElement("canvas");
      c.width = 384; c.height = 384;
      const g = c.getContext("2d");
      const img = g.createImageData(384, 384);
      const rnd = mulberry(1234 + k * 99);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.floor(rnd() * 255);
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      grainTiles.push(c);
    }
  }
  function post(ctx, o = {}) {
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(0,0,0,${o.vignette ?? 0.62})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // grain
    if (!grainTiles) makeGrain();
    const tile = grainTiles[G.frame % grainTiles.length];
    ctx.save();
    ctx.globalAlpha = o.grain ?? 0.045;
    ctx.globalCompositeOperation = "overlay";
    const ox = (hash(G.frame, 1, 1) + 1) * 190, oy = (hash(G.frame, 2, 2) + 1) * 190;
    ctx.translate(-ox, -oy);
    ctx.fillStyle = ctx.createPattern(tile, "repeat");
    ctx.fillRect(0, 0, W + 400, H + 400);
    ctx.restore();
    // dip / fade
    if (o.black > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(o.black, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
    // letterbox
    ctx.fillStyle = "#000";
    if (o.bars) { ctx.fillRect(0, 0, W, BAR); ctx.fillRect(0, H - BAR, W, BAR); }
  }

  // sepia + soft wash for the flashback
  function sepia(ctx, k) {
    if (k <= 0) return;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.globalCompositeOperation = "color";
    ctx.fillStyle = "#a08060"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#e8d6b8"; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // flicker
    ctx.save(); ctx.globalAlpha = 0.04 + 0.03 * hash(G.frame, 5, 5);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore();
    // scratches
    ctx.save(); ctx.strokeStyle = "rgba(255,240,220,0.18)"; ctx.lineWidth = 1.5;
    const rnd = mulberry(G.frame * 7 + 1);
    for (let i = 0; i < 2; i++) { const x = rnd() * W; ctx.beginPath(); ctx.moveTo(x, BAR); ctx.lineTo(x + (rnd() - 0.5) * 20, H - BAR); ctx.stroke(); }
    ctx.restore();
  }

  window.X = { narr, hand, hud, bubble, post, sepia, setFont };
})();
