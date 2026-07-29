// ============================================================
// Visual Suite — Canvas Helpers Compartidos
// ============================================================

// ── roundRect Polyfill (única copia) ──
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    let r = typeof radii === 'number' ? radii : (radii || 0);
    if (Array.isArray(radii)) r = radii[0] || 0;
    r = Math.min(r, w / 2, h / 2);
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

const VS_CanvasHelpers = {
  // Shared editorial chrome for every exported plate.
  drawPlateBackground(ctx, W, H, options) {
    const o = options || {};
    const dark = !!o.dark;
    const accent = o.accent || VS_Colors.ACCENT;
    const headerRatio = o.headerRatio == null ? 0.16 : o.headerRatio;
    const headerH = Math.round(H * headerRatio);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (dark) {
      grad.addColorStop(0, VS_Colors.INK);
      grad.addColorStop(1, '#26342b');
    } else {
      grad.addColorStop(0, '#f8faf5');
      grad.addColorStop(1, '#e8ece5');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (!dark && typeof VS_Utils !== 'undefined' && VS_Utils.drawDotGrid) {
      VS_Utils.drawDotGrid(ctx, W, H, VS_Utils.hexToRgba(accent, 0.035), Math.round(W * 0.045), 1);
    }

    ctx.fillStyle = dark ? VS_Colors.INK : '#16201b';
    ctx.fillRect(0, 0, W, headerH);
    ctx.fillStyle = accent;
    ctx.fillRect(0, headerH - Math.max(4, Math.round(H * 0.004)), W, Math.max(4, Math.round(H * 0.004)));
  },

  drawPlateHeader(ctx, W, H, label, title, headerH) {
    const hh = headerH || Math.round(H * 0.16);
    const M = Math.round(W * 0.045);
    const baseTL = Math.min(W, H);
    const kicker = 'MEDIAMENDOZA  ·  ' + (label || 'DATOS');

    ctx.fillStyle = VS_Colors.INK;
    ctx.fillRect(0, 0, W, hh);
    ctx.fillStyle = VS_Colors.GOLD;
    ctx.fillRect(0, hh - Math.max(4, Math.round(H * 0.004)), W, Math.max(4, Math.round(H * 0.004)));

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = VS_Colors.GOLD;
    ctx.font = `700 ${Math.round(baseTL * 0.018)}px "Inter", sans-serif`;
    ctx.fillText(kicker, M, hh * 0.36);

    ctx.fillStyle = '#ffffff';
    ctx.font = `400 ${Math.round(baseTL * 0.055)}px "DM Serif Display", serif`;
    let t = title || '';
    const wide = W / H > 1.2;
    const logoLeft = W * (wide ? 0.76 : 0.67);
    const titleMaxW = Math.max(W * 0.34, logoLeft - M * 1.35);
    while (ctx.measureText(t).width > titleMaxW && t.length > 4) t = t.slice(0, -1);
    if (t.length < (title || '').length) t = t.slice(0, -1) + '…';
    ctx.fillText(t, M, hh * 0.84);
    ctx.textBaseline = 'alphabetic';
  },

  drawPlateLogo(ctx, W, H, options) {
    const o = options || {};
    const wide = W / H > 1.2;
    const w = o.w == null ? (wide ? 0.18 : 0.25) : o.w;
    const x = o.x == null ? (wide ? 0.76 : 0.67) : o.x;
    const y = o.y == null ? 0.03 : o.y;
    VS_Utils.dibujarLogo(ctx, W, H, { x, y, w });
  },

  // ── Editorial Footer ──
  drawFooter(ctx, W, H, dark) {
    const M = Math.round(W * 0.05);
    const y = H - Math.round(H * 0.035);
    const fs = Math.min(W, H) * 0.018;
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.15)' : 'rgba(22,32,27,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, y - Math.round(H * 0.02));
    ctx.lineTo(W - M, y - Math.round(H * 0.02));
    ctx.stroke();
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.6)' : VS_Colors.INK2;
    ctx.font = `600 ${fs}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Mediamendoza · Noticias confiables del sur mendocino', M, y);
    ctx.textAlign = 'right';
    ctx.fillText('www.mediamendoza.com', W - M, y);
    ctx.textAlign = 'left';
  },

  // ── Active Selection UI (guides, crosshair, handles) ──
  drawActiveUI(ctx, W, H, el) {
    if (!el) return;
    const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
    const lw = Math.max(2, Math.round(W * 0.0016));
    const hs = Math.max(16, Math.round(W * 0.016));

    ctx.save();

    // Center guides
    ctx.strokeStyle = 'rgba(166,206,57,.85)';
    ctx.lineWidth = Math.max(2, lw * 1.5);
    ctx.setLineDash([Math.round(W * 0.008), Math.round(W * 0.004)]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    // Rule of thirds
    ctx.strokeStyle = 'rgba(166,206,57,.45)';
    ctx.lineWidth = Math.max(1, lw);
    [W / 3, W * 2 / 3].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); });
    [H / 3, H * 2 / 3].forEach(y => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); });

    // Edge guides
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = Math.max(1, lw);
    ctx.beginPath(); ctx.moveTo(el.x, 0); ctx.lineTo(el.x, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(el.x + el.w, 0); ctx.lineTo(el.x + el.w, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, el.y); ctx.lineTo(W, el.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, el.y + el.h); ctx.lineTo(W, el.y + el.h); ctx.stroke();

    ctx.setLineDash([]);

    // Center crosshair
    const cs = Math.round(W * 0.022);
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = Math.max(1, lw);
    ctx.beginPath(); ctx.moveTo(cx - cs, cy); ctx.lineTo(cx + cs, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - cs); ctx.lineTo(cx, cy + cs); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, cy, Math.round(W * 0.004), 0, Math.PI * 2); ctx.fill();

    // Selection border
    ctx.strokeStyle = 'rgba(166,206,57,.9)';
    ctx.lineWidth = lw * 1.5;
    ctx.beginPath();
    const r = Math.min(4, el.w / 4, el.h / 4);
    ctx.moveTo(el.x + r, el.y);
    ctx.lineTo(el.x + el.w - r, el.y);
    ctx.quadraticCurveTo(el.x + el.w, el.y, el.x + el.w, el.y + r);
    ctx.lineTo(el.x + el.w, el.y + el.h - r);
    ctx.quadraticCurveTo(el.x + el.w, el.y + el.h, el.x + el.w - r, el.y + el.h);
    ctx.lineTo(el.x + r, el.y + el.h);
    ctx.quadraticCurveTo(el.x, el.y + el.h, el.x, el.y + el.h - r);
    ctx.lineTo(el.x, el.y + r);
    ctx.quadraticCurveTo(el.x, el.y, el.x + r, el.y);
    ctx.closePath();
    ctx.stroke();

    // Handles
    const handles = [
      { x: el.x, y: el.y }, { x: el.x + el.w, y: el.y },
      { x: el.x, y: el.y + el.h }, { x: el.x + el.w, y: el.y + el.h },
      { x: el.x, y: cy }, { x: el.x + el.w, y: cy }
    ];
    handles.forEach(h => {
      const isCorner = h.x === el.x || h.x === el.x + el.w;
      if (isCorner && (h.y === el.y || h.y === el.y + el.h)) {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = 'rgba(166,206,57,.9)';
        ctx.lineWidth = lw;
        ctx.beginPath(); ctx.arc(h.x, h.y, hs * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = 'rgba(166,206,57,.9)';
        ctx.lineWidth = lw;
        const hw = hs * 0.65, hh = hs * 1.3;
        ctx.beginPath(); ctx.roundRect(h.x - hw / 2, h.y - hh / 2, hw, hh, 4); ctx.fill(); ctx.stroke();
      }
    });

    ctx.restore();
  },

  // ── Editorial Header for Export Plates ──
  drawExportHeader(ctx, W, H, label, title, headerH) {
    this.drawPlateHeader(ctx, W, H, label, title, headerH);
  },

  // ── Icon Chip for Canvas ──
  drawIconChip(ctx, x, y, size, icono, accent) {
    ctx.fillStyle = VS_Utils.hexToRgba(accent || VS_Colors.ACCENT, 0.14);
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, size * 0.28);
    ctx.fill();
    ctx.font = `${size * 0.56}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icono, x + size / 2, y + size / 2);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }
};

window.VS_CanvasHelpers = VS_CanvasHelpers;
