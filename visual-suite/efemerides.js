// ============================================================
// Visual Suite — Módulo de Efemérides
// ============================================================

const EFEMERIDES_FMT = {
  landscape: { label: 'Horizontal 16:9', w: 2400, h: 1350, cssAR: '16 / 9' },
  square:    { label: 'Cuadrado 1:1',    w: 1600, h: 1600, cssAR: '1 / 1' },
  portrait:  { label: 'Vertical 4:5',    w: 1350, h: 1688, cssAR: '4 / 5' },
  story:     { label: 'Historia 9:16',   w: 1080, h: 1920, cssAR: '9 / 16' }
};

let efemeridesData = [];
let efeFormato = 'landscape';

const CAT_COLORS = {
  'Política': '#3b82f6', 'política': '#3b82f6',
  'Deportes': '#22c55e', 'deportes': '#22c55e',
  'Cultura': '#f59e0b', 'cultura': '#f59e0b',
  'Ciencia': '#a855f7', 'ciencia': '#a855f7',
  'Internacional': '#ef4444', 'internacional': '#ef4444',
  'Efeméride': '#8b5cf6', 'efeméride': '#8b5cf6',
  'Espectáculos': '#ec4899', 'espectáculos': '#ec4899',
  'Sociedad': '#14b8a6', 'sociedad': '#14b8a6',
  'Religión': '#f97316', 'religión': '#f97316',
  'Económica': '#a6ce39', 'económica': '#a6ce39'
};
const CAT_DEFAULT = '#6b7280';

function initEfemerides() {
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('efeFecha');
  if (el) { el.value = today; el.max = today; }
  efemeridesData = [];
  renderizarEfemerides();
}

function cambiarFormatoEfe() {
  const fmt = document.getElementById('efeFormato').value;
  if (!EFEMERIDES_FMT[fmt]) return;
  efeFormato = fmt;
  const area = document.getElementById('efemeridesArea');
  if (area) area.style.aspectRatio = EFEMERIDES_FMT[fmt].cssAR;
  renderizarEfemerides();
}

// ── Chat IA ──
function generarPromptEfemerides() {
  const fechaEl = document.getElementById('efeFecha');
  if (!fechaEl || !fechaEl.value) return toast('Seleccioná una fecha del calendario');
  const fecha = new Date(fechaEl.value + 'T12:00:00');
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fechaStr = `${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
  const fechaCorta = `${fecha.getDate()} de ${meses[fecha.getMonth()]}`;

  const prompt = `Necesito un JSON puro para pegar en un frontend que genera una placa visual de efemérides.

Fecha: ${fechaStr} (${fechaCorta})

Requisitos del JSON:
{
  "fecha": "${fechaCorta}",
  "efemerides": [
    {
      "emoji": "🇦🇷",
      "anio": 1965,
      "titulo": "Título corto del evento",
      "descripcion": "Descripción breve (máximo 15 palabras)",
      "categoria": "Política | Deportes | Cultura | Ciencia | Internacional | Sociedad | Espectáculos | Religión | Económica"
    }
  ]
}

Reglas estrictas:
- Incluí entre 5 y 12 efemérides para esta fecha
- Mezclá argentinas (🇦🇷) e internacionales relevantes (🌍)
- Abarcá distintas categorías (política, cultura, deportes, ciencia, sociedad, espectáculos, religión, economía)
- Cada efeméride debe empezar con "Nace", "Fallece", "Se celebra", "Ocurre", "Se funda", "Se descubre", etc.
- Incluí el emoji más representativo para cada una
- VERIFICÁ cada dato antes de incluirlo — son datos chequeables
- Respondé SOLO el JSON, sin texto antes ni después, ni bloques de código`;

  const ta = document.getElementById('efePrompt');
  if (ta) {
    ta.value = prompt;
    toast('✅ Prompt generado. Copialo con el botón y pegalo en Gemini Chat.');
  }
}

function copiarPromptEfemerides() {
  const ta = document.getElementById('efePrompt');
  if (!ta || !ta.value.trim()) return toast('No hay prompt para copiar');
  ta.select();
  try { document.execCommand('copy'); } catch (e) { navigator.clipboard?.writeText(ta.value); }
  toast('✅ Prompt copiado al portapapeles');
}

function cargarJSONEfemerides() {
  const ta = document.getElementById('efeJson');
  const text = (ta && ta.value || '').trim();
  if (!text) return toast('Pegá el JSON en el cuadro de arriba');

  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { return toast('JSON inválido: ' + e.message); }

  if (parsed.fecha) document.getElementById('efeFechaLabel').textContent = parsed.fecha;
  if (parsed.efemerides && Array.isArray(parsed.efemerides)) {
    efemeridesData = parsed.efemerides;
    renderizarEfemerides();
    toast(`✅ ${efemeridesData.length} efemérides cargadas`);
  } else {
    toast('El JSON no contiene efemérides');
  }
}

// ── Render ──
function renderizarEfemerides() {
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return;
  const badge = document.getElementById('efeCount');
  if (badge) badge.textContent = efemeridesData.length + ' efemérides';
  const lbl = document.getElementById('efeFechaLabel');
  if (lbl && !lbl.textContent) {
    const fechaEl = document.getElementById('efeFecha');
    if (fechaEl && fechaEl.value) {
      const d = new Date(fechaEl.value + 'T12:00:00');
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      lbl.textContent = d.getDate() + ' de ' + meses[d.getMonth()];
    }
  }
  const fmt = EFEMERIDES_FMT[efeFormato] || EFEMERIDES_FMT.landscape;
  const W = fmt.w;
  const itemH = Math.round(W * 0.11);
  const headerH = Math.round(W * 0.12);
  const footerH = Math.round(W * 0.06);
  const totalH = headerH + Math.max(efemeridesData.length, 1) * itemH + footerH + W * 0.02;
  const cssW = canvas.parentElement.clientWidth || 800;
  const cssH = cssW * totalH / W;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = W;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d');

  // Fondo
  const grad = ctx.createLinearGradient(0, 0, 0, totalH);
  grad.addColorStop(0, '#0f111a');
  grad.addColorStop(1, '#1a1d2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, totalH);

  // Dot grid sutil
  drawDotGridEfe(ctx, W, totalH, 'rgba(255,255,255,0.02)', Math.round(W * 0.03));

  // Header
  ctx.fillStyle = 'rgba(166,206,57,0.08)';
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = '#a6ce39';
  ctx.fillRect(0, headerH - 3, W, 3);

  ctx.textAlign = 'left';
  const fechaLabel = document.getElementById('efeFechaLabel');
  const fechaTexto = fechaLabel ? fechaLabel.textContent : 'Efemérides';
  ctx.fillStyle = '#a6ce39';
  ctx.font = `700 ${Math.round(W * 0.015)}px Inter, sans-serif`;
  ctx.fillText('📆  EFEMÉRIDES', Math.round(W * 0.04), Math.round(headerH * 0.38));
  ctx.fillStyle = '#ffffff';
  ctx.font = `400 ${Math.round(W * 0.045)}px "DM Serif Display", serif`;
  ctx.fillText(fechaTexto, Math.round(W * 0.04), Math.round(headerH * 0.78));

  // Items
  const M = Math.round(W * 0.04);
  const cardW = W - M * 2;

  efemeridesData.forEach((e, i) => {
    const y = headerH + i * itemH + Math.round(W * 0.01);
    const cy = y + itemH / 2;

    // Card bg
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(M, y, cardW, itemH - Math.round(W * 0.008), 10);
    ctx.fill();

    // Left accent
    const catColor = CAT_COLORS[e.categoria] || CAT_DEFAULT;
    ctx.fillStyle = catColor;
    ctx.beginPath();
    ctx.roundRect(M, y + Math.round(itemH * 0.1), 4, itemH * 0.8, 2);
    ctx.fill();

    // Emoji
    ctx.font = `${Math.round(itemH * 0.45)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.emoji || '📌', M + Math.round(W * 0.05), cy);

    // Año
    const yearX = M + Math.round(W * 0.09);
    ctx.fillStyle = catColor;
    ctx.font = `900 ${Math.round(itemH * 0.24)}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.anio || '', yearX, cy - Math.round(itemH * 0.14));

    // Título
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(itemH * 0.22)}px Inter, sans-serif`;
    ctx.fillText(e.titulo || '', yearX, cy + Math.round(itemH * 0.16));

    // Descripción
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `500 ${Math.round(itemH * 0.16)}px Inter, sans-serif`;
    const descW = cardW - (yearX - M) - Math.round(W * 0.14);
    const desc = e.descripcion || '';
    let descDisplay = desc;
    while (descDisplay && ctx.measureText(descDisplay).width > descW) {
      descDisplay = descDisplay.slice(0, -1);
    }
    if (descDisplay.length < desc.length) descDisplay = descDisplay.slice(0, -1) + '…';
    ctx.fillText(descDisplay, yearX, cy + Math.round(itemH * 0.40));

    // Categoria badge
    ctx.fillStyle = hexToRgbaEfe(catColor, 0.15);
    ctx.beginPath();
    const badgeW = ctx.measureText(e.categoria || '').width + Math.round(W * 0.02);
    const badgeH = Math.round(itemH * 0.22);
    const badgeX = W - M - badgeW - Math.round(W * 0.02);
    const badgeY = cy - badgeH / 2;
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.fillStyle = catColor;
    ctx.font = `600 ${Math.round(itemH * 0.13)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.categoria || '', badgeX + badgeW / 2, badgeY + badgeH / 2);
  });

  // Si no hay datos
  if (efemeridesData.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = `500 ${Math.round(W * 0.022)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Seleccioná una fecha y generá las efemérides con Chat IA', W / 2, headerH + (totalH - headerH - footerH) / 2);
  }

  // Footer
  const footerY = totalH - Math.round(footerH * 0.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, footerY - Math.round(W * 0.015));
  ctx.lineTo(W - M, footerY - Math.round(W * 0.015));
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `600 ${Math.round(W * 0.014)}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('MEDIA MENDOZA · mmherramientas.media', M, footerY);
  ctx.textAlign = 'right';
  ctx.fillText('Generado con Visual Suite', W - M, footerY);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  dibujarLogoEfemerides(ctx, W, totalH);
}

function drawDotGridEfe(ctx, W, H, color, spacing) {
  ctx.fillStyle = color;
  for (let x = spacing; x < W; x += spacing) {
    for (let y = spacing; y < H; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function hexToRgbaEfe(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function dibujarLogoEfemerides(ctx, W, H) {
  const ls = window.logoState;
  if (!ls || !ls.loaded || !ls.visible || !ls.img) return;
  const lx = ls.x * W;
  const ly = ls.y * H;
  const lw = ls.w * W;
  const ar = ls.img.naturalHeight / ls.img.naturalWidth;
  const lh = lw * ar;
  ctx.drawImage(ls.img, lx, ly, lw, lh);
}

// ── Export ──
async function exportarEfemerides() {
  await document.fonts.ready;
  const canvas = document.getElementById('efemeridesCanvas');
  const ow = canvas.width, oh = canvas.height;
  const s = 3;
  canvas.width = ow * s; canvas.height = oh * s;
  const ctx = canvas.getContext('2d');
  ctx.scale(s, s);
  renderizarEfemeridesEnCtx(ctx, ow, oh);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'efemerides-media-mendoza');
    canvas.width = ow; canvas.height = oh;
    renderizarEfemerides();
  }, 'image/png', 1);
}

function renderizarEfemeridesEnCtx(ctx, W, H) {
  const itemH = Math.round(W * 0.11);
  const headerH = Math.round(W * 0.12);
  const footerH = Math.round(W * 0.06);
  const M = Math.round(W * 0.04);
  const cardW = W - M * 2;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0f111a');
  grad.addColorStop(1, '#1a1d2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  drawDotGridEfe(ctx, W, H, 'rgba(255,255,255,0.02)', Math.round(W * 0.03));

  ctx.fillStyle = 'rgba(166,206,57,0.08)';
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = '#a6ce39';
  ctx.fillRect(0, headerH - 3, W, 3);

  ctx.textAlign = 'left';
  const fechaLabel = document.getElementById('efeFechaLabel');
  const fechaTexto = fechaLabel ? fechaLabel.textContent : 'Efemérides';
  ctx.fillStyle = '#a6ce39';
  ctx.font = `700 ${Math.round(W * 0.015)}px Inter, sans-serif`;
  ctx.fillText('📆  EFEMÉRIDES', Math.round(W * 0.04), Math.round(headerH * 0.38));
  ctx.fillStyle = '#ffffff';
  ctx.font = `400 ${Math.round(W * 0.045)}px "DM Serif Display", serif`;
  ctx.fillText(fechaTexto, Math.round(W * 0.04), Math.round(headerH * 0.78));

  efemeridesData.forEach((e, i) => {
    const y = headerH + i * itemH + Math.round(W * 0.01);
    const cy = y + itemH / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(M, y, cardW, itemH - Math.round(W * 0.008), 10);
    ctx.fill();

    const catColor = CAT_COLORS[e.categoria] || CAT_DEFAULT;
    ctx.fillStyle = catColor;
    ctx.beginPath();
    ctx.roundRect(M, y + Math.round(itemH * 0.1), 4, itemH * 0.8, 2);
    ctx.fill();

    ctx.font = `${Math.round(itemH * 0.45)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.emoji || '📌', M + Math.round(W * 0.05), cy);

    const yearX = M + Math.round(W * 0.09);
    ctx.fillStyle = catColor;
    ctx.font = `900 ${Math.round(itemH * 0.24)}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.anio || '', yearX, cy - Math.round(itemH * 0.14));

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(itemH * 0.22)}px Inter, sans-serif`;
    ctx.fillText(e.titulo || '', yearX, cy + Math.round(itemH * 0.16));

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `500 ${Math.round(itemH * 0.16)}px Inter, sans-serif`;
    const descW = cardW - (yearX - M) - Math.round(W * 0.14);
    const desc = e.descripcion || '';
    let descDisplay = desc;
    while (descDisplay && ctx.measureText(descDisplay).width > descW) {
      descDisplay = descDisplay.slice(0, -1);
    }
    if (descDisplay.length < desc.length) descDisplay = descDisplay.slice(0, -1) + '…';
    ctx.fillText(descDisplay, yearX, cy + Math.round(itemH * 0.40));

    ctx.fillStyle = hexToRgbaEfe(catColor, 0.15);
    ctx.beginPath();
    const badgeW = ctx.measureText(e.categoria || '').width + Math.round(W * 0.02);
    const badgeH = Math.round(itemH * 0.22);
    const badgeX = W - M - badgeW - Math.round(W * 0.02);
    const badgeY = cy - badgeH / 2;
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.fillStyle = catColor;
    ctx.font = `600 ${Math.round(itemH * 0.13)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.categoria || '', badgeX + badgeW / 2, badgeY + badgeH / 2);
  });

  if (efemeridesData.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = `500 ${Math.round(W * 0.022)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Seleccioná una fecha y generá las efemérides con Chat IA', W / 2, headerH + (H - headerH - footerH) / 2);
  }

  const footerY = H - Math.round(footerH * 0.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, footerY - Math.round(W * 0.015));
  ctx.lineTo(W - M, footerY - Math.round(W * 0.015));
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `600 ${Math.round(W * 0.014)}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('MEDIA MENDOZA · mmherramientas.media', M, footerY);
  ctx.textAlign = 'right';
  ctx.fillText('Generado con Visual Suite', W - M, footerY);

  dibujarLogoEfemerides(ctx, W, H);
}

function cargarArchivoJSONEfe(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const ta = document.getElementById('efeJson');
    if (ta) ta.value = e.target.result;
    cargarJSONEfemerides();
  };
  reader.onerror = () => toast('No se pudo leer el archivo');
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', initEfemerides);
