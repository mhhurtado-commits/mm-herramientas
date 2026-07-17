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
let titleActive = false;
let scale = 1;
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

  const canvas = document.getElementById('infografiaCanvas');
  if (canvas) {
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchend', onUp);
  }
}

// ── Eventos del título (copiado de placas) ──
function getPos(e) {
  const canvas = document.getElementById('infografiaCanvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return { x: (t.clientX - rect.left) * scale, y: (t.clientY - rect.top) * scale };
}

function getHandleHit(pos) {
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  const el = { x: s.x * fmtW(), y: s.y * fmtH(), w: s.w * fmtW(), h: s.h * fmtH() };
  const base = Math.round(16 * (fmtW() / 1080));
  const handles = [
    { id: 'nw', x: el.x, y: el.y, t: 'c' }, { id: 'ne', x: el.x + el.w, y: el.y, t: 'c' },
    { id: 'sw', x: el.x, y: el.y + el.h, t: 'c' }, { id: 'se', x: el.x + el.w, y: el.y + el.h, t: 'c' },
    { id: 'w', x: el.x, y: el.y + el.h / 2, t: 's' }, { id: 'e', x: el.x + el.w, y: el.y + el.h / 2, t: 's' }
  ];
  for (const h of handles) {
    const hitR = h.t === 'c' ? base * 2.5 : base * 2;
    if (Math.abs(pos.x - h.x) < hitR && Math.abs(pos.y - h.y) < hitR) return h.id;
  }
  return null;
}

function fmtW() { return FORMATOS[formatoActual].w; }
function fmtH() { return FORMATOS[formatoActual].h; }

function onDown(e) {
  if (e.touches) e.preventDefault();
  const pos = getPos(e);
  if (!pos) return;
  const W = fmtW(), H = fmtH();
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  const el = { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H };
  const hid = getHandleHit(pos);
  if (hid) {
    titleAction = 'resize-' + hid;
    titleActive = true;
    titleState._offX = pos.x; titleState._offY = pos.y;
    titleState._startS = { x: s.x, y: s.y, w: s.w, h: s.h };
    return;
  }
  if (pos.x >= el.x && pos.x <= el.x + el.w && pos.y >= el.y && pos.y <= el.y + el.h) {
    titleAction = 'drag';
    titleActive = true;
    titleState._offX = pos.x - el.x; titleState._offY = pos.y - el.y;
  } else {
    titleActive = false;
    renderizarInfografia();
  }
}

function onMove(e) {
  if (e.touches) e.preventDefault();
  if (!titleAction) return;
  const pos = getPos(e);
  if (!pos) return;
  const W = fmtW(), H = fmtH();
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  if (titleAction === 'drag') {
    let nx = (pos.x - titleState._offX) / W;
    let ny = (pos.y - titleState._offY) / H;
    nx = Math.max(0, Math.min(1 - s.w, nx));
    ny = Math.max(0, Math.min(1 - s.h, ny));
    const ecx = nx + s.w / 2, ecy = ny + s.h / 2;
    const SNAP = W * 0.014 / W;
    if (Math.abs(ecx - 0.5) < SNAP) nx = 0.5 - s.w / 2;
    if (Math.abs(ecy - 0.5) < SNAP) ny = 0.5 - s.h / 2;
    s.x = nx; s.y = ny;
    titleState = s;
  } else {
    const corner = titleAction.replace('resize-', '');
    const MIN = W * 0.04;
    const SMAX = { x: 1 - MIN / W, y: 1 - MIN / H, w: 1, h: 0.4 };
    let { x, y, w, h } = titleState._startS;
    const dx = pos.x - titleState._offX;
    const dy = pos.y - titleState._offY;
    if (corner === 'se') { w = Math.max(MIN / W, Math.min(SMAX.w, w + dx / W)); h = Math.max(MIN / H, Math.min(SMAX.h, h + dy / H)); }
    else if (corner === 'sw') { const nw = Math.max(MIN / W, Math.min(SMAX.w, w - dx / W)); x = x + w - nw; w = nw; h = Math.max(MIN / H, Math.min(SMAX.h, h + dy / H)); }
    else if (corner === 'ne') { w = Math.max(MIN / W, Math.min(SMAX.w, w + dx / W)); const nh = Math.max(MIN / H, Math.min(SMAX.h, h - dy / H)); y = y + h - nh; h = nh; }
    else if (corner === 'nw') { const nw = Math.max(MIN / W, Math.min(SMAX.w, w - dx / W)); x = x + w - nw; w = nw; const nh = Math.max(MIN / H, Math.min(SMAX.h, h - dy / H)); y = y + h - nh; h = nh; }
    else if (corner === 'w') { const nw = Math.max(MIN / W, Math.min(SMAX.w, w - dx / W)); x = x + w - nw; w = nw; }
    else if (corner === 'e') { w = Math.max(MIN / W, Math.min(SMAX.w, w + dx / W)); }
    Object.assign(s, { x, y, w, h });
    titleState = s;
  }
  renderizarInfografia();
}

function onUp() {
  titleAction = null;
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
  const W = fmt.w, H = fmt.h;
  const cssW = canvas.parentElement.clientWidth || 800;
  const cssH = cssW * H / W;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = W;
  canvas.height = H;
  scale = W / cssW;

  const ctx = canvas.getContext('2d');
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

  if (titleActive) drawActiveUI(ctx, W, H);
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

function drawTitle(ctx, W, H, title, accent, dark, kicker) {
  if (!title) return;
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  const bx = s.x * W, by = s.y * H, bw = s.w * W, bh = s.h * H;
  const pad = Math.round(bw * 0.025);
  const aw = bw - pad * 2;
  if (aw <= 0) return;
  // Kicker
  if (kicker) {
    ctx.textAlign = 'left';
    ctx.fillStyle = accent;
    ctx.font = `700 ${Math.round(bh * 0.18)}px "Inter", sans-serif`;
    ctx.fillText(kicker.toUpperCase(), bx + pad, by + Math.round(bh * 0.12));
  }
  const kickH = kicker ? bh * 0.3 : 0;
  let sz = Math.max(10, Math.round(bh * 0.35));
  let lines, lh;
  for (let i = 0; i < 20; i++) {
    ctx.font = `400 ${sz}px "DM Serif Display", serif`;
    lines = wrapText(ctx, title, aw);
    lh = Math.round(sz * 1.15);
    if (lines.length * lh <= (bh - kickH) * 0.9 || sz <= 10) break;
    sz = Math.max(10, Math.round(sz * 0.88));
  }
  const textH = lines.length * lh;
  const titleAreaH = bh - kickH;
  const sy = by + kickH + Math.round((titleAreaH - textH) / 2);
  const cx = bx + Math.round(bw / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = dark ? '#ffffff' : PLATE_INK;
  ctx.shadowColor = dark ? 'rgba(0,0,0,0.85)' : 'transparent';
  ctx.shadowBlur = dark ? Math.round(sz * 0.18) : 0;
  ctx.shadowOffsetX = dark ? Math.round(sz * 0.04) : 0;
  ctx.shadowOffsetY = dark ? Math.round(sz * 0.04) : 0;
  lines.forEach((l, i) => ctx.fillText(l, cx, sy + i * lh));
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
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

  drawTitle(ctx, W, H, title, c1, isDark, 'RESUMEN');

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
  drawTitle(ctx, W, H, title, c1, true, 'COMPARATIVA');

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

  drawTitle(ctx, W, H, title, c1, isDark, 'LISTADO');

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

  drawTitle(ctx, W, H, title, c1, true, 'DATOS DESTACADOS');

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

// ── getTitleRect — útil para templates ──
function getTitleRect(W, H) {
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  return { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H };
}

// ── drawActiveUI — copiado textual de placas (drawActiveUI + getHandles) ──
function drawActiveUI(ctx, W, H) {
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  const el = { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H };
  const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
  const lw = Math.max(2, Math.round(W * 0.0016));
  const HR = 16;
  const hs = Math.round(HR * (W / 1080));
  ctx.save();
  // Centro H y V
  ctx.strokeStyle = 'rgba(166,206,57,.85)'; ctx.lineWidth = Math.max(2, lw * 1.5);
  ctx.setLineDash([Math.round(W * 0.008), Math.round(W * 0.004)]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  // Tercios verticales
  ctx.strokeStyle = 'rgba(166,206,57,.45)'; ctx.lineWidth = Math.max(1, lw);
  ctx.beginPath(); ctx.moveTo(W / 3, 0); ctx.lineTo(W / 3, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 2 / 3, 0); ctx.lineTo(W * 2 / 3, H); ctx.stroke();
  // Tercios horizontales
  ctx.beginPath(); ctx.moveTo(0, H / 3); ctx.lineTo(W, H / 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H * 2 / 3); ctx.lineTo(W, H * 2 / 3); ctx.stroke();
  // Guías de bordes del elemento activo
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(1, lw);
  ctx.beginPath(); ctx.moveTo(el.x, 0); ctx.lineTo(el.x, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(el.x + el.w, 0); ctx.lineTo(el.x + el.w, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, el.y); ctx.lineTo(W, el.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, el.y + el.h); ctx.lineTo(W, el.y + el.h); ctx.stroke();
  ctx.setLineDash([]);
  // Crosshair centro del elemento
  const cs = Math.round(W * 0.022);
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(1, lw);
  ctx.beginPath(); ctx.moveTo(cx - cs, cy); ctx.lineTo(cx + cs, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - cs); ctx.lineTo(cx, cy + cs); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, Math.round(W * 0.004), 0, Math.PI * 2); ctx.fill();
  // Borde de selección
  ctx.strokeStyle = 'rgba(166,206,57,.9)'; ctx.lineWidth = lw * 1.5;
  ctx.beginPath();
  const r = Math.min(4, el.w / 4, el.h / 4);
  ctx.moveTo(el.x + r, el.y); ctx.lineTo(el.x + el.w - r, el.y);
  ctx.quadraticCurveTo(el.x + el.w, el.y, el.x + el.w, el.y + r);
  ctx.lineTo(el.x + el.w, el.y + el.h - r);
  ctx.quadraticCurveTo(el.x + el.w, el.y + el.h, el.x + el.w - r, el.y + el.h);
  ctx.lineTo(el.x + r, el.y + el.h);
  ctx.quadraticCurveTo(el.x, el.y + el.h, el.x, el.y + el.h - r);
  ctx.lineTo(el.x, el.y + r);
  ctx.quadraticCurveTo(el.x, el.y, el.x + r, el.y);
  ctx.closePath(); ctx.stroke();
  // Handles esquinas (círculos)
  const handles = [
    { x: el.x, y: el.y }, { x: el.x + el.w, y: el.y },
    { x: el.x, y: el.y + el.h }, { x: el.x + el.w, y: el.y + el.h },
    { x: el.x, y: el.y + el.h / 2 }, { x: el.x + el.w, y: el.y + el.h / 2 }
  ];
  handles.forEach(h => {
    const isCorner = h.x === el.x || h.x === el.x + el.w;
    if (isCorner && (h.y === el.y || h.y === el.y + el.h)) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(166,206,57,.9)'; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.arc(h.x, h.y, hs * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(166,206,57,.9)'; ctx.lineWidth = lw;
      const hw = hs * 0.65, hh = hs * 1.3;
      ctx.beginPath(); ctx.roundRect(h.x - hw / 2, h.y - hh / 2, hw, hh, 4); ctx.fill(); ctx.stroke();
    }
  });
  ctx.restore();
}

async function exportarInfografia() {
  await document.fonts.ready;
  const canvas = document.getElementById('infografiaCanvas');
  const ow = canvas.width, oh = canvas.height;
  const s = 3;
  canvas.width = ow * s; canvas.height = oh * s;
  const ctx = canvas.getContext('2d');
  ctx.scale(s, s);
  renderizarInfografiaEnCtx(ctx, ow, oh);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'infografia-flyer-media-mendoza');
    canvas.width = ow; canvas.height = oh;
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

function cargarJSONdeChatInfografia() {
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