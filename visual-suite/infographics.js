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
  canvas.width = canvas.parentElement.clientWidth || 800;
  canvas.height = canvas.width * 9 / 16;

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

function drawFooter(ctx, W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.font = `${H * 0.02}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Media Mendoza · mmherramientas.media', W / 2, H - H * 0.025);
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
  drawGradientBg(ctx, W, H, c1, c2, true);
  drawDecorativeCircles(ctx, W, H, '#ffffff');

  // Barra semi-transparente superior
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, W, H * 0.13);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${H * 0.055}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), W * 0.05, H * 0.092);

  // Línea decorativa
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(W * 0.05, H * 0.11, W * 0.3, 3);

  // Contenido en tarjetas
  const lines = content.split('\n').filter(l => l.trim());
  const cardH = H * 0.08;
  const gap = H * 0.02;
  const startY = H * 0.18;
  const maxCards = Math.min(lines.length, 8);

  lines.slice(0, maxCards).forEach((line, i) => {
    const y = startY + i * (cardH + gap);
    const icono = detectarIconoLinea(line);

    // Card semi-transparente
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(W * 0.05, y, W * 0.9, cardH, 6);
    ctx.fill();

    // Borde izquierdo
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.roundRect(W * 0.05, y, 3, cardH, [3, 0, 0, 3]);
    ctx.fill();

    // Texto
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${H * 0.028}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(icono + line, W * 0.08, y + cardH * 0.6);
  });

  drawFooter(ctx, W, H);
}

// ── Template: Flyer Comparativa ──
function renderFlyerComparativa(ctx, W, H, title, content, c1, c2) {
  // Fondo oscuro con gradiente
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(1, '#16213e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, H * 0.12);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${H * 0.05}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('📊 ' + title.toUpperCase(), W / 2, H * 0.082);

  const lines = content.split('\n').filter(l => l.trim());
  const midX = W / 2;
  const leftItems = lines.filter((_, i) => i % 2 === 0);
  const rightItems = lines.filter((_, i) => i % 2 === 1);

  // Línea divisoria vertical
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(midX, H * 0.18);
  ctx.lineTo(midX, H * 0.88);
  ctx.stroke();
  ctx.setLineDash([]);

  // Etiquetas VS
  ctx.fillStyle = c1;
  ctx.font = `900 ${H * 0.04}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('VS', midX, H * 0.16);

  // Items izquierda
  const itemH = H * 0.1;
  const maxItems = Math.max(leftItems.length, rightItems.length);
  const totalH = maxItems * itemH;
  const startY2 = (H - totalH) / 2 + H * 0.1;

  leftItems.forEach((item, i) => {
    const y = startY2 + i * itemH;
    // Círculo decorativo
    ctx.fillStyle = hexToRgba(c1, 0.15);
    ctx.beginPath();
    ctx.arc(midX - W * 0.2, y + itemH * 0.35, W * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c1;
    ctx.font = `700 ${H * 0.026}px "Inter", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('◀ ' + item, midX - W * 0.04, y + itemH * 0.4);
  });

  // Items derecha
  rightItems.forEach((item, i) => {
    const y = startY2 + i * itemH;
    ctx.fillStyle = hexToRgba(c2, 0.15);
    ctx.beginPath();
    ctx.arc(midX + W * 0.2, y + itemH * 0.35, W * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${H * 0.026}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(item + ' ▶', midX + W * 0.04, y + itemH * 0.4);
  });

  drawFooter(ctx, W, H);
}

// ── Template: Flyer Listado ──
function renderFlyerListado(ctx, W, H, title, content, c1, c2) {
  // Fondo
  drawGradientBg(ctx, W, H, c1, '#ffffff', false);
  // Overlay oscuro para legibilidad
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  ctx.fillRect(0, 0, W, H);

  // Header con acento
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, H * 0.11);
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${H * 0.05}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('📋 ' + title.toUpperCase(), W * 0.05, H * 0.078);

  const items = content.split('\n').filter(l => l.trim());
  const itemH = H * 0.09;
  const startY3 = H * 0.16;
  const maxItems2 = Math.min(items.length, 10);

  items.slice(0, maxItems2).forEach((item, i) => {
    const y = startY3 + i * itemH;
    const icono = detectarIconoLinea(item);

    // Número de ítem decorativo
    ctx.fillStyle = hexToRgba(c1, 0.15);
    ctx.font = `900 ${H * 0.045}px "Inter", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 1).padStart(2, '0'), W * 0.1, y + itemH * 0.55);

    // Línea conectora al número
    if (i < maxItems2 - 1) {
      ctx.strokeStyle = hexToRgba(c1, 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.09, y + itemH * 0.55);
      ctx.lineTo(W * 0.09, y + itemH * 0.95);
      ctx.stroke();
    }

    // Círculo conector
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.arc(W * 0.09, y + itemH * 0.55, 4, 0, Math.PI * 2);
    ctx.fill();

    // Texto del item
    const textColor = document.body.classList.contains('dark-theme') ? '#e8e8e0' : '#1a1a1a';
    ctx.fillStyle = textColor;
    ctx.font = `600 ${H * 0.028}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(icono + item, W * 0.15, y + itemH * 0.55);
  });

  drawFooter(ctx, W, H);
}

// ── Template: Flyer Destacado ──
function renderFlyerDestacado(ctx, W, H, title, content, c1, c2) {
  // Fondo con gradiente dramático
  drawGradientBg(ctx, W, H, c2, '#000000', false);

  // Círculos decorativos grandes
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#ffffff';
    const x = W * (0.1 + i * 0.2);
    const y = H * (0.2 + (i % 3) * 0.25);
    ctx.beginPath();
    ctx.arc(x, y, 80 + i * 20, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Barra lateral de acento
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W * 0.07, H);

  // Título grande
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${H * 0.07}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), W * 0.12, H * 0.15);

  // Subtítulo decorativo
  ctx.fillStyle = hexToRgba(c1, 0.6);
  ctx.font = `${H * 0.025}px "Inter", sans-serif`;
  ctx.fillText('DATOS DESTACADOS', W * 0.12, H * 0.19);

  // Línea decorativa
  ctx.fillStyle = hexToRgba(c1, 0.4);
  ctx.fillRect(W * 0.12, H * 0.205, W * 0.4, 2);

  const lines = content.split('\n').filter(l => l.trim());
  const cardW = W * 0.75;
  const cardH2 = H * 0.09;
  const gap2 = H * 0.025;
  const startY4 = H * 0.26;

  lines.slice(0, 8).forEach((line, i) => {
    const y = startY4 + i * (cardH2 + gap2);
    const icono = detectarIconoLinea(line);

    // Card oscuro con borde
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(W * 0.12, y, cardW, cardH2, 8);
    ctx.fill();
    ctx.stroke();

    // Indicador de acento en cada card
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.roundRect(W * 0.12, y, 3, cardH2, [4, 0, 0, 4]);
    ctx.fill();

    // Texto
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${H * 0.028}px "Inter", sans-serif`;
    ctx.textAlign = 'left';

    // Si la línea tiene dos puntos, separar
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const label = line.substring(0, colonIdx + 1);
      const value = line.substring(colonIdx + 1).trim();
      ctx.fillStyle = hexToRgba(c1, 0.8);
      ctx.fillText(icono + label, W * 0.17, y + cardH2 * 0.42);
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${H * 0.034}px "Inter", sans-serif`;
      ctx.fillText(value, W * 0.17, y + cardH2 * 0.78);
      ctx.font = `700 ${H * 0.028}px "Inter", sans-serif`;
    } else {
      ctx.fillText(icono + line, W * 0.17, y + cardH2 * 0.6);
    }
  });

  drawFooter(ctx, W, H);
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

function exportarInfografia() {
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