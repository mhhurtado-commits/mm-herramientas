// ============================================================
// Visual Suite — Módulo de Infografías (Canvas)
// ============================================================

let templateActual = 'simple';

function initInfographics() {
  renderizarInfografia();
}

function seleccionarTemplate(template) {
  templateActual = template;
  document.querySelectorAll('.vs-infografia-template').forEach(el => {
    el.classList.toggle('active', el.dataset.template === template);
  });
  const nombres = { simple: 'Simple', comparativa: 'Comparativa', listado: 'Listado', destacado: 'Destacado' };
  document.getElementById('infoTemplateBadge').textContent = nombres[template] || 'Simple';
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

  dibujarLogoInfografia(ctx, W, H);

  switch (templateActual) {
    case 'simple': renderSimple(ctx, W, H, title, content, color1, color2); break;
    case 'comparativa': renderComparativa(ctx, W, H, title, content, color1, color2); break;
    case 'listado': renderListado(ctx, W, H, title, content, color1, color2); break;
    case 'destacado': renderDestacado(ctx, W, H, title, content, color1, color2); break;
    default: renderSimple(ctx, W, H, title, content, color1, color2);
  }
}

// ── Template: Simple ──
function renderSimple(ctx, W, H, title, content, c1, c2) {
  const isDark = document.body.classList.contains('dark-theme');
  const bg = isDark ? '#161810' : '#ffffff';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, H * 0.08);

  ctx.fillStyle = c2;
  ctx.font = `bold ${W * 0.05}px "BebasNeue", sans-serif`;
  ctx.fillText(title.toUpperCase(), W * 0.05, H * 0.05);

  ctx.fillStyle = isDark ? '#e8e8e0' : '#1a1a1a';
  ctx.font = `${W * 0.025}px "Inter", sans-serif`;
  const lines = wrapText(ctx, content, W * 0.9);
  lines.forEach((line, i) => {
    ctx.fillText(line, W * 0.05, H * 0.2 + i * (W * 0.035));
  });
}

// ── Template: Comparativa ──
function renderComparativa(ctx, W, H, title, content, c1, c2) {
  const isDark = document.body.classList.contains('dark-theme');
  const bg = isDark ? '#161810' : '#ffffff';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, H * 0.08);

  ctx.fillStyle = c2;
  ctx.font = `bold ${W * 0.04}px "BebasNeue", sans-serif`;
  ctx.fillText(title.toUpperCase(), W * 0.05, H * 0.05);

  const midX = W / 2;
  ctx.strokeStyle = c1;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(midX, H * 0.15);
  ctx.lineTo(midX, H * 0.9);
  ctx.stroke();

  const lines = content.split('\n').filter(l => l.trim());
  const leftItems = lines.filter((_, i) => i % 2 === 0);
  const rightItems = lines.filter((_, i) => i % 2 === 1);

  ctx.fillStyle = isDark ? '#e8e8e0' : '#1a1a1a';
  ctx.font = `${W * 0.022}px "Inter", sans-serif`;
  ctx.textAlign = 'right';
  leftItems.forEach((item, i) => {
    const y = H * 0.2 + i * (H * 0.12);
    ctx.fillText(item, midX - 15, y);
  });
  ctx.textAlign = 'left';
  rightItems.forEach((item, i) => {
    const y = H * 0.2 + i * (H * 0.12);
    ctx.fillText(item, midX + 15, y);
  });
  ctx.textAlign = 'start';
}

// ── Template: Listado ──
function renderListado(ctx, W, H, title, content, c1, c2) {
  const isDark = document.body.classList.contains('dark-theme');
  const bg = isDark ? '#161810' : '#ffffff';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, H * 0.08);

  ctx.fillStyle = c2;
  ctx.font = `bold ${W * 0.04}px "BebasNeue", sans-serif`;
  ctx.fillText(title.toUpperCase(), W * 0.05, H * 0.05);

  const items = content.split('\n').filter(l => l.trim());
  ctx.fillStyle = isDark ? '#e8e8e0' : '#1a1a1a';
  ctx.font = `${W * 0.022}px "Inter", sans-serif`;

  items.forEach((item, i) => {
    const y = H * 0.18 + i * (H * 0.08);
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.arc(W * 0.06, y - W * 0.006, W * 0.012, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isDark ? '#e8e8e0' : '#1a1a1a';
    ctx.fillText(item, W * 0.1, y);
  });
}

// ── Template: Destacado ──
function renderDestacado(ctx, W, H, title, content, c1, c2) {
  const isDark = document.body.classList.contains('dark-theme');
  const bg = isDark ? '#161810' : '#ffffff';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = c2;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W * 0.06, H);

  ctx.fillStyle = isDark ? '#e8e8e0' : '#1a1a1a';
  ctx.font = `bold ${W * 0.055}px "BebasNeue", sans-serif`;
  ctx.fillText(title.toUpperCase(), W * 0.1, H * 0.15);

  const lines = content.split('\n').filter(l => l.trim());
  ctx.fillStyle = isDark ? '#e8e8e0' : '#1a1a1a';
  ctx.font = `bold ${W * 0.035}px "Inter", sans-serif`;
  lines.forEach((line, i) => {
    ctx.fillText(line, W * 0.1, H * 0.35 + i * (H * 0.1));
  });
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
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'infografia-media-mendoza');
  }, 'image/png');
}

document.addEventListener('DOMContentLoaded', initInfographics);
