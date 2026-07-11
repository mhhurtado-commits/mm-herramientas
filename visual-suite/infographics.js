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

let templateActual = 'simple';

function initInfographics() {
  renderizarInfografia();
}

function seleccionarTemplate(template) {
  templateActual = template;
  document.querySelectorAll('.vs-infografia-template').forEach(el => {
    el.classList.toggle('active', el.dataset.template === template);
  });
  const nombres = { simple: 'Flyer Simple', comparativa: 'Comparativa', listado: 'Listado', destacado: 'Destacado' };
  document.getElementById('infoTemplateBadge').textContent = nombres[template] || 'Flyer Simple';
  renderizarInfografia();
}

function renderizarInfografia() {
  const canvas = document.getElementById('infografiaCanvas');
  const rect = canvas.parentElement.getBoundingClientRect();
  // Render a mayor resolución (2x) para exportación e impresión nítida,
  // manteniendo el tamaño visual vía CSS.
  const dpr = 2;
  const cssW = canvas.parentElement.clientWidth || 800;
  const cssH = cssW * 9 / 16;
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
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.15)' : 'rgba(22,32,27,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, y - H * 0.02);
  ctx.lineTo(W - M, y - H * 0.02);
  ctx.stroke();
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.6)' : PLATE_INK2;
  ctx.font = `600 ${H * 0.02}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('MEDIA MENDOZA · mmherramientas.media', M, y);
  ctx.textAlign = 'right';
  ctx.fillText('Generado con Visual Suite', W - M, y);
  ctx.textAlign = 'left';
}

function drawPlateHeader(ctx, W, H, kicker, title, accent, dark) {
  const M = W * 0.05;
  const ink = dark ? '#ffffff' : PLATE_INK;
  ctx.textAlign = 'left';
  if (kicker) {
    ctx.fillStyle = accent;
    ctx.font = `700 ${H * 0.022}px "Inter", sans-serif`;
    ctx.fillText(kicker.toUpperCase(), M, H * 0.075);
  }
  ctx.fillStyle = ink;
  ctx.font = `400 ${H * 0.06}px "DM Serif Display", serif`;
  let t = title;
  while (ctx.measureText(t).width > W * 0.9 && t.length > 4) t = t.slice(0, -1);
  if (t.length < title.length) t = t.slice(0, -1) + '…';
  ctx.fillText(t, M, H * 0.14);
  ctx.fillStyle = accent;
  ctx.fillRect(M, H * 0.155, W * 0.16, Math.max(3, H * 0.004));
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

// ── Template: Flyer Simple ──
function renderFlyerSimple(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(255,255,255,0.82)')) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#f3f5f2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  drawPlateHeader(ctx, W, H, 'RESUMEN', title, c1, false);

  const lines = content.split('\n').filter(l => l.trim());
  const maxCards = Math.min(lines.length, 8);
  const top = H * 0.20;
  const bottom = H - H * 0.07;
  const areaH = bottom - top;
  const cardH = Math.min(areaH / Math.max(maxCards, 1) * 0.86, H * 0.085);
  const gap = maxCards ? (areaH - cardH * maxCards) / maxCards : 0;

  lines.slice(0, maxCards).forEach((line, i) => {
    const y = top + i * (cardH + gap);
    ctx.fillStyle = 'rgba(22,32,27,0.08)';
    ctx.beginPath();
    ctx.roundRect(M + 3, y + 5, W - 2 * M, cardH, 14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(M, y, W - 2 * M, cardH, 14);
    ctx.fill();
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.roundRect(M, y, Math.max(4, W * 0.004), cardH, [14, 0, 0, 14]);
    ctx.fill();

    const chip = cardH * 0.62;
    const chipX = M + W * 0.02;
    const chipY = y + (cardH - chip) / 2;
    drawIconChipPlate(ctx, chipX, chipY, chip, detectarIconoLinea(line), c1);

    const textX = chipX + chip + W * 0.02;
    const { label, value, hasColon } = splitRichLine(line);
    ctx.textAlign = 'left';
    if (hasColon) {
      ctx.fillStyle = PLATE_INK;
      ctx.font = `700 ${cardH * 0.22}px "Inter", sans-serif`;
      ctx.fillText(label, textX, y + cardH * 0.4);
      ctx.fillStyle = c1;
      ctx.font = `800 ${cardH * 0.26}px "Inter", sans-serif`;
      ctx.fillText(value, textX, y + cardH * 0.74);
    } else {
      ctx.fillStyle = PLATE_INK;
      ctx.font = `600 ${cardH * 0.26}px "Inter", sans-serif`;
      ctx.fillText(line, textX, y + cardH * 0.58);
    }
  });

  drawPlateFooter(ctx, W, H, c1, false);
}

// ── Template: Flyer Comparativa ──
function renderFlyerComparativa(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(16,19,31,0.88)')) {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#10131f');
    grad.addColorStop(1, '#1b2236');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Header banda
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, H * 0.13);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${H * 0.026}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('COMPARATIVA', M, H * 0.055);
  ctx.font = `400 ${H * 0.05}px "DM Serif Display", serif`;
  let t = title;
  while (ctx.measureText(t).width > W * 0.9 && t.length > 4) t = t.slice(0, -1);
  if (t.length < title.length) t = t.slice(0, -1) + '…';
  ctx.fillText(t, M, H * 0.105);

  const lines = content.split('\n').filter(l => l.trim());
  const leftItems = lines.filter((_, i) => i % 2 === 0);
  const rightItems = lines.filter((_, i) => i % 2 === 1);
  const midX = W / 2;
  const itemH = H * 0.11;
  const maxN = Math.max(leftItems.length, rightItems.length);
  const totalH = maxN * itemH;
  const startY = (H - totalH) / 2 + H * 0.04;

  // Divisor vertical
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(midX, startY - H * 0.02);
  ctx.lineTo(midX, startY + totalH + H * 0.02);
  ctx.stroke();
  ctx.setLineDash([]);

  // Badge VS
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.arc(midX, startY - H * 0.02, W * 0.022, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${W * 0.02}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', midX, startY - H * 0.02);
  ctx.textBaseline = 'alphabetic';

  leftItems.forEach((item, i) => {
    const cy = startY + i * itemH + itemH * 0.4;
    const chip = itemH * 0.6;
    drawIconChipPlate(ctx, midX - W * 0.42, cy - chip / 2, chip, detectarIconoLinea(item), c1);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${H * 0.026}px "Inter", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(item, midX - W * 0.05 - chip - W * 0.01, cy + itemH * 0.14);
  });

  rightItems.forEach((item, i) => {
    const cy = startY + i * itemH + itemH * 0.4;
    const chip = itemH * 0.6;
    drawIconChipPlate(ctx, midX + W * 0.05, cy - chip / 2, chip, detectarIconoLinea(item), c2);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${H * 0.026}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(item, midX + W * 0.05 + chip + W * 0.01, cy + itemH * 0.14);
  });

  drawPlateFooter(ctx, W, H, c1, true);
}

// ── Template: Flyer Listado ──
function renderFlyerListado(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(255,255,255,0.82)')) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#f3f5f2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  drawPlateHeader(ctx, W, H, 'LISTADO', title, c1, false);

  const items = content.split('\n').filter(l => l.trim());
  const maxN = Math.min(items.length, 10);
  const top = H * 0.20;
  const bottom = H - H * 0.07;
  const areaH = bottom - top;
  const itemH = areaH / Math.max(maxN, 1);
  const numX = M + W * 0.03;
  const spineX = numX + W * 0.03;

  // Espina vertical
  ctx.strokeStyle = hexToRgba(c1, 0.3);
  ctx.lineWidth = Math.max(2, W * 0.0015);
  ctx.beginPath();
  ctx.moveTo(spineX, top);
  ctx.lineTo(spineX, top + areaH - itemH * 0.4);
  ctx.stroke();

  items.slice(0, maxN).forEach((item, i) => {
    const y = top + i * itemH;
    const cy = y + itemH * 0.4;
    // Número
    ctx.fillStyle = hexToRgba(c1, 0.12);
    ctx.font = `900 ${itemH * 0.5}px "Inter", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 1).padStart(2, '0'), numX + W * 0.02, cy + itemH * 0.18);
    // Nodo
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.arc(spineX, cy, W * 0.006, 0, Math.PI * 2);
    ctx.fill();
    // Chip
    const chip = itemH * 0.5;
    const chipX = spineX + W * 0.025;
    drawIconChipPlate(ctx, chipX, cy - chip / 2, chip, detectarIconoLinea(item), c1);
    // Texto
    const textX = chipX + chip + W * 0.02;
    const { label, value, hasColon } = splitRichLine(item);
    ctx.textAlign = 'left';
    if (hasColon) {
      ctx.fillStyle = PLATE_INK;
      ctx.font = `700 ${itemH * 0.2}px "Inter", sans-serif`;
      ctx.fillText(label, textX, cy - itemH * 0.02);
      ctx.fillStyle = c1;
      ctx.font = `800 ${itemH * 0.24}px "Inter", sans-serif`;
      ctx.fillText(value, textX, cy + itemH * 0.22);
    } else {
      ctx.fillStyle = PLATE_INK;
      ctx.font = `600 ${itemH * 0.24}px "Inter", sans-serif`;
      ctx.fillText(item, textX, cy + itemH * 0.1);
    }
  });

  drawPlateFooter(ctx, W, H, c1, false);
}

// ── Template: Flyer Destacado ──
function renderFlyerDestacado(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(26,26,46,0.88)')) {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, c2);
    grad.addColorStop(1, '#0a0d12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Barra lateral de acento
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W * 0.035, H);

  // Kicker + título serif
  ctx.fillStyle = c1;
  ctx.font = `700 ${H * 0.024}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('DATOS DESTACADOS', M, H * 0.09);
  ctx.fillStyle = '#ffffff';
  ctx.font = `400 ${H * 0.062}px "DM Serif Display", serif`;
  let t = title;
  while (ctx.measureText(t).width > W * 0.85 && t.length > 4) t = t.slice(0, -1);
  if (t.length < title.length) t = t.slice(0, -1) + '…';
  ctx.fillText(t, M, H * 0.155);
  ctx.fillStyle = hexToRgba(c1, 0.7);
  ctx.fillRect(M, H * 0.17, W * 0.16, Math.max(3, H * 0.004));

  const lines = content.split('\n').filter(l => l.trim());
  const maxN = Math.min(lines.length, 8);
  const top = H * 0.22;
  const bottom = H - H * 0.07;
  const areaH = bottom - top;
  const cardH = Math.min(areaH / Math.max(maxN, 1) * 0.86, H * 0.095);
  const gap = maxN ? (areaH - cardH * maxN) / maxN : 0;

  lines.slice(0, maxN).forEach((line, i) => {
    const y = top + i * (cardH + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(M, y, W - 2 * M, cardH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.roundRect(M, y, Math.max(4, W * 0.004), cardH, [12, 0, 0, 12]);
    ctx.fill();

    const chip = cardH * 0.6;
    const chipX = M + W * 0.02;
    const chipY = y + (cardH - chip) / 2;
    drawIconChipPlate(ctx, chipX, chipY, chip, detectarIconoLinea(line), c1);

    const textX = chipX + chip + W * 0.02;
    const { label, value, hasColon } = splitRichLine(line);
    ctx.textAlign = 'left';
    if (hasColon) {
      ctx.fillStyle = hexToRgba(c1, 0.85);
      ctx.font = `700 ${cardH * 0.2}px "Inter", sans-serif`;
      ctx.fillText(label, textX, y + cardH * 0.38);
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${cardH * 0.26}px "Inter", sans-serif`;
      ctx.fillText(value, textX, y + cardH * 0.74);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${cardH * 0.24}px "Inter", sans-serif`;
      ctx.fillText(line, textX, y + cardH * 0.58);
    }
  });

  drawPlateFooter(ctx, W, H, c1, true);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split('\n');
  const lines = [];
  for (const word of words) {
    const wrapped = word.match(new RegExp(`.{1,${Math.floor(maxWidth / (ctx.measureText('A').width || 8))}}`, 'g'));
    if (wrapped) lines.push(...wrapped);
    else lines.push(word);
  }
  return lines;
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

document.addEventListener('DOMContentLoaded', initInfographics);