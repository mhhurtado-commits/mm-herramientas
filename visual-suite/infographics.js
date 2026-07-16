// ============================================================
// Visual Suite — Módulo de Infografías (Canvas) — Flyer Style
// ============================================================

// Polyfill para roundRect si falta
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

const FORMATOS = {
  landscape: { label: 'Horizontal 16:9', w: 2400, h: 1350, cssAR: '16 / 9' },
  square:    { label: 'Cuadrado 1:1',    w: 1600, h: 1600, cssAR: '1 / 1' },
  portrait:  { label: 'Vertical 4:5',    w: 1350, h: 1688, cssAR: '4 / 5' },
  story:     { label: 'Historia 9:16',   w: 1080, h: 1920, cssAR: '9 / 16' }
};

let templateActual = 'simple';
let formatoActual = 'landscape';

// ── Estado del título arrastrable ──
let titleState = { x: null, y: null, w: null, h: null };
let titleAction = null; // 'drag' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'resize-w' | 'resize-e'
const TITLE_DEF = {
  simple:      { x: 0.05, y: 0.09, w: 0.9,  h: 0.1 },
  listado:     { x: 0.05, y: 0.09, w: 0.9,  h: 0.1 },
  comparativa: { x: 0.05, y: 0.07, w: 0.9,  h: 0.08 },
  destacado:   { x: 0.05, y: 0.07, w: 0.9,  h: 0.1 }
};

function resetTitlePos() {
  const d = TITLE_DEF[templateActual] || TITLE_DEF.simple;
  titleState = { ...d };
}

function cambiarFormatoInfografia() {
  const fmt = document.getElementById('infoFormato').value;
  if (!FORMATOS[fmt]) return;
  formatoActual = fmt;
  const area = document.getElementById('infografiaArea');
  if (area) area.style.aspectRatio = FORMATOS[fmt].cssAR;
  renderizarInfografia();
}

function initInfographics() {
  const area = document.getElementById('infografiaArea');
  if (area) area.style.aspectRatio = FORMATOS[formatoActual].cssAR;
  resetTitlePos();
  renderizarInfografia();

  // Eventos del canvas para título arrastrable
  const canvas = document.getElementById('infografiaCanvas');
  if (canvas) {
    canvas.addEventListener('mousedown', onTitleDown);
    canvas.addEventListener('touchstart', onTitleDown, { passive: false });
  }
}

// ── Eventos del título ──
function getCanvasCoords(e) {
  const canvas = document.getElementById('infografiaCanvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const W = canvas.width;
  const H = canvas.height;
  const sx = W / rect.width;
  const sy = H / rect.height;
  return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy, W, H };
}

function hitTestHandle(px, py, r, W) {
  const hs = Math.max(8, Math.round(W * 0.012));
  const handles = [
    { id: 'nw', x: r.x, y: r.y },
    { id: 'ne', x: r.x + r.w, y: r.y },
    { id: 'sw', x: r.x, y: r.y + r.h },
    { id: 'se', x: r.x + r.w, y: r.y + r.h },
    { id: 'w',  x: r.x, y: r.y + r.h / 2 },
    { id: 'e',  x: r.x + r.w, y: r.y + r.h / 2 }
  ];
  const hitR = hs * 0.7;
  for (const h of handles) {
    if (Math.abs(px - h.x) < hitR && Math.abs(py - h.y) < hitR) return h.id;
  }
  return null;
}

function onTitleDown(e) {
  const c = getCanvasCoords(e);
  if (!c) return;
  const r = getTitleRect(c.W, c.H);
  const handle = hitTestHandle(c.x, c.y, r, c.W);
  if (handle) {
    titleAction = 'resize-' + handle;
    e.preventDefault();
    window.addEventListener('mousemove', onTitleMove);
    window.addEventListener('mouseup', onTitleUp);
    window.addEventListener('touchmove', onTitleMove, { passive: false });
    window.addEventListener('touchend', onTitleUp);
    return;
  }
  // Hit test sobre el bloque del título
  if (c.x >= r.x && c.x <= r.x + r.w && c.y >= r.y && c.y <= r.y + r.h) {
    titleAction = 'drag';
    titleState._startX = titleState.x;
    titleState._startY = titleState.y;
    titleState._offX = c.x - r.x;
    titleState._offY = c.y - r.y;
    titleState._W = c.W;
    titleState._H = c.H;
    e.preventDefault();
    window.addEventListener('mousemove', onTitleMove);
    window.addEventListener('mouseup', onTitleUp);
    window.addEventListener('touchmove', onTitleMove, { passive: false });
    window.addEventListener('touchend', onTitleUp);
  }
}

function onTitleMove(e) {
  if (!titleAction) return;
  if (e.touches) e.preventDefault();
  const c = getCanvasCoords(e);
  if (!c) return;
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  const iW = c.W, iH = c.H;
  if (titleAction === 'drag') {
    if (s._startX == null) { s._startX = s.x; s._startY = s.y; }
    let nx = s._startX + (c.x - s._offX - s._startX * iW) / iW;
    let ny = s._startY + (c.y - s._offY - s._startY * iH) / iH;
    nx = Math.max(0, Math.min(1 - s.w, nx));
    ny = Math.max(0, Math.min(1 - s.h, ny));
    s.x = nx; s.y = ny;
    titleState = s;
  } else {
    const corner = titleAction.replace('resize-', '');
    const minW = 0.08, minH = 0.03, maxW = 0.95, maxH = 0.3;
    let { x, y, w, h } = s;
    const dx = (c.x - s._offX - x * iW) / iW;
    const dy = (c.y - s._offY - y * iH) / iH;
    if (corner === 'se') { w = Math.max(minW, Math.min(maxW, w + dx)); h = Math.max(minH, Math.min(maxH, h + dy)); }
    else if (corner === 'sw') { const nw = Math.max(minW, Math.min(maxW, w - dx)); x = x + w - nw; w = nw; h = Math.max(minH, Math.min(maxH, h + dy)); }
    else if (corner === 'ne') { w = Math.max(minW, Math.min(maxW, w + dx)); const nh = Math.max(minH, Math.min(maxH, h - dy)); y = y + h - nh; h = nh; }
    else if (corner === 'nw') { const nw = Math.max(minW, Math.min(maxW, w - dx)); x = x + w - nw; w = nw; const nh = Math.max(minH, Math.min(maxH, h - dy)); y = y + h - nh; h = nh; }
    else if (corner === 'w') { const nw = Math.max(minW, Math.min(maxW, w - dx)); x = x + w - nw; w = nw; }
    else if (corner === 'e') { w = Math.max(minW, Math.min(maxW, w + dx)); }
    Object.assign(s, { x, y, w, h });
    titleState = s;
  }
  renderizarInfografia();
}

function onTitleUp() {
  titleAction = null;
  window.removeEventListener('mousemove', onTitleMove);
  window.removeEventListener('mouseup', onTitleUp);
  window.removeEventListener('touchmove', onTitleMove);
  window.removeEventListener('touchend', onTitleUp);
  renderizarInfografia();
}

function seleccionarTemplate(template) {
  templateActual = template;
  resetTitlePos();
  document.querySelectorAll('.vs-infografia-template').forEach(el => {
    el.classList.toggle('active', el.dataset.template === template);
  });
  const nombres = { simple: 'Flyer Simple', comparativa: 'Comparativa', listado: 'Listado', destacado: 'Destacado' };
  document.getElementById('infoTemplateBadge').textContent = nombres[template] || 'Flyer Simple';
  renderizarInfografia();
}

function renderizarInfografia() {
  const canvas = document.getElementById('infografiaCanvas');
  const fmt = FORMATOS[formatoActual] || FORMATOS.landscape;
  const dpr = 2;
  const cssW = canvas.parentElement.clientWidth || 800;
  const cssH = cssW * fmt.h / fmt.w;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const color1 = document.getElementById('infoColor1').value;
  const color2 = document.getElementById('infoColor2').value;
  const title = document.getElementById('infoTitle').value || 'Infografía';
  const content = document.getElementById('infoContent').value || '';

  ctx.clearRect(0, 0, W, H);

  switch (templateActual) {
    case 'simple': renderFlyerSimple(ctx, W, H, title, content, color1, color2); break;
    case 'comparativa': renderFlyerComparativa(ctx, W, H, title, content, color1, color2); break;
    case 'listado': renderFlyerListado(ctx, W, H, title, content, color1, color2); break;
    case 'destacado': renderFlyerDestacado(ctx, W, H, title, content, color1, color2); break;
    default: renderFlyerSimple(ctx, W, H, title, content, color1, color2);
  }

  dibujarLogoInfografia(ctx, W, H);

  // Handles y guías del título
  if (titleAction) drawTitleGuides(ctx, W, H);
  drawTitleHandles(ctx, W, H);
}

// ── Helpers ──
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawGradientBg(ctx, W, H, c1, c2, diagonal) {
  const grad = ctx.createLinearGradient(diagonal ? 0 : 0, 0, diagonal ? W : 0, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawDecorativeCircles(ctx, W, H, c1) {
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = c1;
    const x = (i * 137 + 50) % W;
    const y = (i * 211 + 30) % H;
    const r = 30 + (i * 17) % 60;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Helpers de placa (estética de infografías; no afectan la app) ──
const PLATE_INK = '#16201b';
const PLATE_INK2 = '#5b665f';

function drawPlateFooter(ctx, W, H, accent, dark) {
  const M = W * 0.05;
  const y = H - H * 0.035;
  const fs = Math.min(W, H) * 0.018;
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.15)' : 'rgba(22,32,27,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, y - H * 0.02);
  ctx.lineTo(W - M, y - H * 0.02);
  ctx.stroke();
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.6)' : PLATE_INK2;
  ctx.font = `600 ${fs}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('MEDIA MENDOZA · mmherramientas.media', M, y);
  ctx.textAlign = 'right';
  ctx.fillText('Generado con Visual Suite', W - M, y);
  ctx.textAlign = 'left';
}

function drawPlateHeader(ctx, W, H, kicker, title, accent, dark) {
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  const bx = s.x * W, by = s.y * H, bw = s.w * W, bh = s.h * H;
  const ink = dark ? '#ffffff' : PLATE_INK;
  const pad = bw * 0.04;
  const titleW = bw - pad * 2;
  ctx.textAlign = 'left';
  const kickH = kicker ? bh * 0.22 : 0;
  if (kicker) {
    ctx.fillStyle = accent;
    ctx.font = `700 ${Math.min(bw, bh) * 0.14}px "Inter", sans-serif`;
    ctx.fillText(kicker.toUpperCase(), bx + pad, by + bh * 0.2);
  }
  ctx.fillStyle = ink;
  let sz = Math.min(bw * 0.07, bh * 0.28);
  let lines, lh;
  for (let i = 0; i < 20; i++) {
    ctx.font = `400 ${sz}px "DM Serif Display", serif`;
    lines = wrapText(ctx, title, titleW);
    lh = sz * 1.2;
    if (lines.length * lh <= bh * 0.6 || sz <= 10) break;
    sz = Math.max(10, Math.round(sz * 0.88));
  }
  const ty = by + kickH + (bh - kickH - lines.length * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, bx + pad, ty + i * lh));
  const barY = ty + lines.length * lh + bh * 0.04;
  ctx.fillStyle = accent;
  ctx.fillRect(bx + pad, barY, bw * 0.18, Math.max(2, bh * 0.02));
}

function drawIconChipPlate(ctx, x, y, size, icono, accent) {
  ctx.fillStyle = hexToRgba(accent, 0.14);
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, size * 0.28);
  ctx.fill();
  ctx.font = `${size * 0.56}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icono, x + size / 2, y + size / 2);
  ctx.textBaseline = 'alphabetic';
}

// Separa "Etiqueta: valor" para resaltar el valor
function splitRichLine(line) {
  const idx = line.indexOf(':');
  if (idx > 0 && idx < line.length - 1) {
    return { label: line.slice(0, idx + 1), value: line.slice(idx + 1).trim(), hasColon: true };
  }
  return { label: '', value: line, hasColon: false };
}

function detectarIconoLinea(linea) {
  const l = linea.toLowerCase();
  if (l.includes('⚽') || l.includes('🏆') || l.includes('🥇') || l.includes('🎯')) return '';
  if (l.includes('$') || l.includes('peso') || l.includes('dólar') || l.includes('inflación') || l.includes('porcentaje') || l.includes('%')) return '💰 ';
  if (l.includes('año') || l.includes('fecha') || l.match(/^\d{4}/)) return '📅 ';
  if (l.includes('persona') || l.includes('habitante') || l.includes('población') || l.includes('gente')) return '👥 ';
  if (l.includes('argentina') || l.includes('mendoza') || l.includes('país') || l.includes('provincia')) return '📍 ';
  if (l.includes('total') || l.includes('suma') || l.includes('acumulado')) return '📊 ';
  if (l.includes('promedio') || l.includes('media')) return '📐 ';
  if (l.includes('récord') || l.includes('máximo') || l.includes('mínimo')) return '🎯 ';
  if (l.includes('n°') || l.includes('número') || l.includes('ranking') || l.includes('puesto')) return '#️⃣ ';
  return '▸ ';
}

function drawDotGrid(ctx, W, H, color, spacing) {
  ctx.fillStyle = color;
  for (let x = spacing; x < W; x += spacing) {
    for (let y = spacing; y < H; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawDataBar(ctx, x, y, w, h, pct, color) {
  const r = h / 2;
  ctx.fillStyle = hexToRgba(color, 0.15);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.fillStyle = hexToRgba(color, 0.85);
  ctx.beginPath();
  ctx.roundRect(x, y, Math.min(w, w * pct), h, r);
  ctx.fill();
}

// ── Template: Flyer Simple ──
function renderFlyerSimple(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  const isDark = false;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(255,255,255,0.85)')) {
    ctx.fillStyle = '#fafbfa';
    ctx.fillRect(0, 0, W, H);
    drawDotGrid(ctx, W, H, hexToRgba(c1, 0.08), Math.round(W * 0.045));
  }

  // Top accent bar
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, Math.round(H * 0.006));

  drawPlateHeader(ctx, W, H, 'RESUMEN', title, c1, isDark);

  const lines = content.split('\n').filter(l => l.trim());
  const maxCards = Math.min(lines.length, 8);
  const tr = getTitleRect(W, H);
  const top = tr.y + tr.h + H * 0.02;
  const bottom = H - H * 0.07;
  const areaH = bottom - top;
  const cardH = Math.min(areaH / Math.max(maxCards, 1) * 0.82, H * 0.09);
  const gap = maxCards ? (areaH - cardH * maxCards) / maxCards : 0;

  lines.slice(0, maxCards).forEach((line, i) => {
    const y = top + i * (cardH + gap);
    const cy = y + cardH / 2;

    // Sombra sutil
    ctx.fillStyle = hexToRgba(c2, 0.06);
    ctx.beginPath();
    ctx.roundRect(M + 2, y + 3, W - 2 * M, cardH, 12);
    ctx.fill();

    // Card bg
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(M, y, W - 2 * M, cardH, 12);
    ctx.fill();

    // Top bar acento
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.roundRect(M, y, W - 2 * M, Math.round(W * 0.005), [12, 12, 0, 0]);
    ctx.fill();

    const chip = cardH * 0.58;
    const chipX = M + W * 0.025;
    const chipY = cy - chip / 2;
    drawIconChipPlate(ctx, chipX, chipY, chip, detectarIconoLinea(line), c1);

    const textX = chipX + chip + W * 0.025;
    const textW = (W - 2 * M) - (textX - M);
    const { label, value, hasColon } = splitRichLine(line);
    ctx.textAlign = 'left';

    if (hasColon) {
      ctx.fillStyle = PLATE_INK;
      ctx.font = `600 ${cardH * 0.2}px "Inter", sans-serif`;
      ctx.fillText(label, textX, y + cardH * 0.38);
      ctx.fillStyle = c1;
      ctx.font = `800 ${cardH * 0.28}px "Inter", sans-serif`;
      let v = value;
      while (ctx.measureText(v).width > textW * 0.5 && v.length > 2) v = v.slice(0, -1);
      ctx.fillText(v, textX, y + cardH * 0.76);
      // Mini data bar
      const valNum = parseFloat(String(value).replace(',', '.'));
      if (!isNaN(valNum) && valNum > 0) {
        const barW = textW * 0.3;
        const barH = Math.round(cardH * 0.06);
        drawDataBar(ctx, textX + ctx.measureText(v).width + W * 0.015, y + cardH * 0.68, barW, barH, Math.min(valNum / 100, 1), c1);
      }
    } else {
      ctx.fillStyle = PLATE_INK;
      ctx.font = `600 ${cardH * 0.24}px "Inter", sans-serif`;
      ctx.fillText(line, textX, cy + cardH * 0.08);
    }
  });

  drawPlateFooter(ctx, W, H, c1, isDark);
}

// ── Template: Flyer Comparativa ──
function renderFlyerComparativa(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  const isDark = true;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(10,12,22,0.9)')) {
    const grad = ctx.createRadialGradient(W * 0.3, H * 0.3, 0, W * 0.3, H * 0.3, W * 0.8);
    grad.addColorStop(0, '#1a1d2e');
    grad.addColorStop(1, '#0c0e18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    drawDotGrid(ctx, W, H, 'rgba(255,255,255,0.03)', Math.round(W * 0.04));
  }

  // Header (fondo del bloque de título)
  const tr = getTitleRect(W, H);
  const headerPad = W * 0.01;
  ctx.fillStyle = hexToRgba(c1, 0.12);
  ctx.fillRect(0, 0, W, tr.y + tr.h + headerPad);
  ctx.fillStyle = c1;
  ctx.fillRect(0, tr.y + tr.h + headerPad - Math.round(H * 0.005), W, Math.round(H * 0.005));
  // Título (usa titleState para posición)
  drawPlateHeader(ctx, W, H, 'COMPARATIVA', title, c1, true);

  const lines = content.split('\n').filter(l => l.trim());
  const leftItems = lines.filter((_, i) => i % 2 === 0);
  const rightItems = lines.filter((_, i) => i % 2 === 1);
  const midX = W / 2;
  const maxN = Math.max(leftItems.length, rightItems.length, 1);
  const headerBot = tr.y + tr.h + headerPad;
  const itemH = Math.min(H * 0.1, (H - headerBot - H * 0.05) / maxN);
  const startY = headerBot + (H - headerBot - itemH * maxN) / 2;

  // VS circle glow
  const vsR = W * 0.028;
  ctx.shadowColor = hexToRgba(c1, 0.5);
  ctx.shadowBlur = 30;
  ctx.fillStyle = hexToRgba(c1, 0.15);
  ctx.beginPath();
  ctx.arc(midX, startY + itemH * 0.3, vsR * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.arc(midX, startY + itemH * 0.3, vsR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${vsR * 0.9}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', midX, startY + itemH * 0.3);
  ctx.textBaseline = 'alphabetic';

  const colW = (midX - M - W * 0.04);

  leftItems.slice(0, maxN).forEach((item, i) => {
    const cy = startY + i * itemH + itemH * 0.6;
    const icono = detectarIconoLinea(item);
    const chip = itemH * 0.45;
    drawIconChipPlate(ctx, M, cy - chip / 2, chip, icono, c1);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${H * 0.022}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(item, M + chip + W * 0.02, cy + itemH * 0.08);

    // Data bar
    const valNum = parseFloat(String(item).replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!isNaN(valNum) && valNum > 0) {
      drawDataBar(ctx, M + chip + W * 0.02, cy + itemH * 0.12, colW * 0.5, Math.round(H * 0.012), Math.min(valNum / 100, 1), c1);
    }
  });

  rightItems.slice(0, maxN).forEach((item, i) => {
    const cy = startY + i * itemH + itemH * 0.6;
    const icono = detectarIconoLinea(item);
    const chip = itemH * 0.45;
    drawIconChipPlate(ctx, midX + W * 0.04, cy - chip / 2, chip, icono, c2);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${H * 0.022}px "Inter", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(item, W - M - chip - W * 0.02, cy + itemH * 0.08);

    const valNum = parseFloat(String(item).replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!isNaN(valNum) && valNum > 0) {
      drawDataBar(ctx, W - M - chip - W * 0.02 - colW * 0.5, cy + itemH * 0.12, colW * 0.5, Math.round(H * 0.012), Math.min(valNum / 100, 1), c2);
    }
  });

  drawPlateFooter(ctx, W, H, c1, isDark);
}

// ── Template: Flyer Listado ──
function renderFlyerListado(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  const isDark = false;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(255,255,255,0.85)')) {
    ctx.fillStyle = '#fafbfa';
    ctx.fillRect(0, 0, W, H);
    drawDotGrid(ctx, W, H, hexToRgba(c1, 0.06), Math.round(W * 0.04));
  }

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, Math.round(H * 0.006));

  drawPlateHeader(ctx, W, H, 'LISTADO', title, c1, isDark);

  const items = content.split('\n').filter(l => l.trim());
  const maxN = Math.min(items.length, 10);
  const tr = getTitleRect(W, H);
  const top = tr.y + tr.h + H * 0.02;
  const bottom = H - H * 0.07;
  const areaH = bottom - top;
  const itemH = areaH / Math.max(maxN, 1);
  const spineX = M + W * 0.045;

  // Spine
  ctx.strokeStyle = hexToRgba(c1, 0.2);
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.beginPath();
  ctx.moveTo(spineX, top);
  ctx.lineTo(spineX, top + areaH - itemH * 0.3);
  ctx.stroke();

  items.slice(0, maxN).forEach((item, i) => {
    const cy = top + i * itemH + itemH * 0.45;
    const numStr = String(i + 1).padStart(2, '0');

    // Giant number bg
    ctx.fillStyle = hexToRgba(c1, 0.04);
    ctx.font = `900 ${itemH * 0.7}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(numStr, M, cy + itemH * 0.18);

    // Node
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.arc(spineX, cy, W * 0.007, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(spineX, cy, W * 0.004, 0, Math.PI * 2);
    ctx.fill();

    const chip = itemH * 0.48;
    const chipX = spineX + W * 0.03;
    drawIconChipPlate(ctx, chipX, cy - chip / 2, chip, detectarIconoLinea(item), c1);

    const textX = chipX + chip + W * 0.025;
    const textW = (W - M - textX);
    const { label, value, hasColon } = splitRichLine(item);
    ctx.textAlign = 'left';

    if (hasColon) {
      ctx.fillStyle = PLATE_INK;
      ctx.font = `600 ${itemH * 0.18}px "Inter", sans-serif`;
      ctx.fillText(label, textX, cy - itemH * 0.04);
      ctx.fillStyle = c1;
      ctx.font = `800 ${itemH * 0.26}px "Inter", sans-serif`;
      ctx.fillText(value, textX, cy + itemH * 0.22);
      // Mini bar
      const valNum = parseFloat(String(value).replace(',', '.'));
      if (!isNaN(valNum) && valNum > 0) {
        drawDataBar(ctx, textX, cy + itemH * 0.32, textW * 0.35, Math.round(H * 0.01), Math.min(valNum / 100, 1), c1);
      }
    } else {
      ctx.fillStyle = PLATE_INK;
      ctx.font = `600 ${itemH * 0.22}px "Inter", sans-serif`;
      ctx.fillText(item, textX, cy + itemH * 0.1);
    }
  });

  drawPlateFooter(ctx, W, H, c1, isDark);
}

// ── Template: Flyer Destacado ──
function renderFlyerDestacado(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  const isDark = true;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(10,12,22,0.9)')) {
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, W * 0.9);
    grad.addColorStop(0, '#16192b');
    grad.addColorStop(1, '#080a12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    drawDotGrid(ctx, W, H, 'rgba(255,255,255,0.025)', Math.round(W * 0.05));
  }

  // Left accent bar
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, Math.round(W * 0.03), H);

  drawPlateHeader(ctx, W, H, 'DATOS DESTACADOS', title, c1, true);

  const lines = content.split('\n').filter(l => l.trim());
  const maxN = Math.min(lines.length, 8);
  const tr = getTitleRect(W, H);
  const top = tr.y + tr.h + H * 0.02;
  const bottom = H - H * 0.07;
  const areaH = bottom - top;
  const cardH = Math.min(areaH / Math.max(maxN, 1) * 0.82, H * 0.1);
  const gap = maxN ? (areaH - cardH * maxN) / maxN : 0;

  lines.slice(0, maxN).forEach((line, i) => {
    const y = top + i * (cardH + gap);
    const cy = y + cardH / 2;

    // Glassmorphism card
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(M, y, W - 2 * M, cardH, 14);
    ctx.fill();
    ctx.stroke();

    // Left accent
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.roundRect(M, y + cardH * 0.12, Math.round(W * 0.005), cardH * 0.76, 4);
    ctx.fill();

    const chip = cardH * 0.55;
    const chipX = M + W * 0.03;
    const chipY = cy - chip / 2;
    drawIconChipPlate(ctx, chipX, chipY, chip, detectarIconoLinea(line), c1);

    const textX = chipX + chip + W * 0.025;
    const textW = (W - 2 * M) - (textX - M);
    const { label, value, hasColon } = splitRichLine(line);
    ctx.textAlign = 'left';

    if (hasColon) {
      ctx.fillStyle = hexToRgba(c1, 0.8);
      ctx.font = `600 ${cardH * 0.18}px "Inter", sans-serif`;
      ctx.fillText(label, textX, y + cardH * 0.35);
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${cardH * 0.3}px "Inter", sans-serif`;
      ctx.fillText(value, textX, y + cardH * 0.76);

      const valNum = parseFloat(String(value).replace(',', '.'));
      if (!isNaN(valNum) && valNum > 0) {
        const barW = textW * 0.35;
        drawDataBar(ctx, textX + ctx.measureText(value).width + W * 0.02, y + cardH * 0.63, barW, Math.round(H * 0.01), Math.min(valNum / 100, 1), c1);
      }
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${cardH * 0.22}px "Inter", sans-serif`;
      ctx.fillText(line, textX, cy + cardH * 0.08);
    }
  });

  // Donut chart decoration for visual interest
  const donutSize = Math.min(W, H) * 0.07;
  const donutX = W - M - donutSize / 2;
  const donutY = H * 0.12;
  ctx.strokeStyle = hexToRgba(c1, 0.15);
  ctx.lineWidth = donutSize * 0.15;
  ctx.beginPath();
  ctx.arc(donutX, donutY, donutSize * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(c1, 0.6);
  ctx.beginPath();
  ctx.arc(donutX, donutY, donutSize * 0.4, -Math.PI / 2, Math.PI * 0.8);
  ctx.stroke();

  drawPlateFooter(ctx, W, H, c1, isDark);
}

function wrapText(ctx, text, maxW) {
  if (!text || maxW <= 0) return [];
  const words = text.split(' ').filter(w => w.length > 0);
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (cur && ctx.measureText(test).width > maxW) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur.trim()) lines.push(cur);
  return lines.filter(l => l.trim().length > 0);
}

function dibujarLogoInfografia(ctx, W, H) {
  const ls = window.logoState;
  if (!ls || !ls.loaded || !ls.visible || !ls.img) return;
  const lx = ls.x * W;
  const ly = ls.y * H;
  const lw = ls.w * W;
  const ar = ls.img.naturalHeight / ls.img.naturalWidth;
  const lh = lw * ar;
  ctx.drawImage(ls.img, lx, ly, lw, lh);
}

// ── Handles y guías del título ──
function getTitleRect(W, H) {
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  return { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H };
}

function drawTitleHandles(ctx, W, H) {
  const r = getTitleRect(W, H);
  const hs = Math.max(8, Math.round(W * 0.012));
  const handles = [
    { id: 'nw', x: r.x, y: r.y },
    { id: 'ne', x: r.x + r.w, y: r.y },
    { id: 'sw', x: r.x, y: r.y + r.h },
    { id: 'se', x: r.x + r.w, y: r.y + r.h },
    { id: 'w',  x: r.x, y: r.y + r.h / 2 },
    { id: 'e',  x: r.x + r.w, y: r.y + r.h / 2 }
  ];
  handles.forEach(h => {
    ctx.fillStyle = 'rgba(166,206,57,0.9)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
    ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
  });
  // Borde del bloque
  ctx.strokeStyle = 'rgba(166,206,57,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.setLineDash([]);
}

function drawTitleGuides(ctx, W, H) {
  // Centro
  ctx.strokeStyle = 'rgba(166,206,57,0.85)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.setLineDash([]);
  // Guías de bordes
  const r = getTitleRect(W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(r.x, 0); ctx.lineTo(r.x, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r.x + r.w, 0); ctx.lineTo(r.x + r.w, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, r.y); ctx.lineTo(W, r.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, r.y + r.h); ctx.lineTo(W, r.y + r.h); ctx.stroke();
  ctx.setLineDash([]);
}

async function exportarInfografia() {
  // Esperar que las fuentes web estén cargadas antes de pintar al canvas
  await document.fonts.ready;
  const canvas = document.getElementById('infografiaCanvas');
  const ow = canvas.width;
  const oh = canvas.height;
  const scale = 3;
  canvas.width = ow * scale;
  canvas.height = oh * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  renderizarInfografiaEnCtx(ctx, canvas.width / scale, canvas.height / scale);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'infografia-flyer-media-mendoza');
    canvas.width = ow;
    canvas.height = oh;
    renderizarInfografia();
  }, 'image/png', 1);
}

function renderizarInfografiaEnCtx(ctx, W, H) {
  const color1 = document.getElementById('infoColor1').value;
  const color2 = document.getElementById('infoColor2').value;
  const title = document.getElementById('infoTitle').value || 'Infografía';
  const content = document.getElementById('infoContent').value || '';

  ctx.clearRect(0, 0, W, H);

  switch (templateActual) {
    case 'simple': renderFlyerSimple(ctx, W, H, title, content, color1, color2); break;
    case 'comparativa': renderFlyerComparativa(ctx, W, H, title, content, color1, color2); break;
    case 'listado': renderFlyerListado(ctx, W, H, title, content, color1, color2); break;
    case 'destacado': renderFlyerDestacado(ctx, W, H, title, content, color1, color2); break;
    default: renderFlyerSimple(ctx, W, H, title, content, color1, color2);
  }

  if (typeof dibujarLogoInfografia === 'function') dibujarLogoInfografia(ctx, W, H);
}

// ── Chat IA ──
const TEMPLATE_NOMBRES = { simple: 'Simple', comparativa: 'Comparativa', listado: 'Listado', destacado: 'Destacado' };

function generarPromptInfografia() {
  const tema = document.getElementById('infoTema').value.trim();
  if (!tema) return toast('Ingresá un tema para generar el prompt');

  const templates = Object.entries(TEMPLATE_NOMBRES).map(([k, v]) => `${k} (${v})`).join(', ');

  const prompt = `Necesito un JSON puro para pegar en un frontend que genera infografías visuales.

Tema: "${tema}"

Formato requerido:
{
  "titulo": "título llamativo para la infografía",
  "lineas": ["Etiqueta: valor numérico", "Subtítulo: más datos"],
  "template_sugerido": "simple | comparativa | listado | destacado",
  "color_principal": "#código hex",
  "color_secundario": "#código hex"
}

Templates disponibles: ${templates}

Reglas:
- Cada línea representa un dato de la infografía (formato: "Etiqueta: valor")
- Usá datos reales según tu conocimiento sobre el tema
- 4 a 10 líneas como máximo
- Incluí cifras, porcentajes y estadísticas concretas
- Elegí colores que combinen bien (modernos, sobrios)
- Elegí el template que mejor represente los datos
- Respondé SOLO el JSON, sin texto antes ni después, ni bloques de código`;

  const ta = document.getElementById('infoPrompt');
  if (ta) {
    ta.value = prompt;
    toast('✅ Prompt generado. Copialo con el botón y pegalo en Gemini Chat.');
  }
}

function copiarPromptInfografia() {
  const ta = document.getElementById('infoPrompt');
  if (!ta || !ta.value.trim()) return toast('No hay prompt para copiar');
  ta.select();
  try { document.execCommand('copy'); } catch (e) { navigator.clipboard?.writeText(ta.value); }
  toast('✅ Prompt copiado al portapapeles');
}

function cargarJSONdeChat() {
  const ta = document.getElementById('infoJson');
  const text = (ta && ta.value || '').trim();
  if (!text) return toast('Pegá el JSON en el cuadro de arriba');

  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { return toast('JSON inválido: ' + e.message); }

  if (parsed.titulo) document.getElementById('infoTitle').value = parsed.titulo;
  if (parsed.lineas && Array.isArray(parsed.lineas)) {
    document.getElementById('infoContent').value = parsed.lineas.join('\n');
  }
  if (parsed.template_sugerido && TEMPLATE_NOMBRES[parsed.template_sugerido]) {
    seleccionarTemplate(parsed.template_sugerido);
  }
  if (parsed.color_principal) document.getElementById('infoColor1').value = parsed.color_principal;
  if (parsed.color_secundario) document.getElementById('infoColor2').value = parsed.color_secundario;
  renderizarInfografia();
  toast('✅ Infografía cargada desde Chat IA');
}

document.addEventListener('DOMContentLoaded', initInfographics);