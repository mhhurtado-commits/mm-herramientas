// ============================================================
// Visual Suite — Módulo de Línea de Tiempo
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

const timelineEvents = [];

function initTimeline() {
  document.getElementById('tlDate').valueAsDate = new Date();
}

function agregarEventoTimeline() {
  const date = document.getElementById('tlDate').value;
  const title = document.getElementById('tlTitle').value.trim();
  const desc = document.getElementById('tlDesc').value.trim();

  if (!date || !title) return toast('Completá fecha y título');

  timelineEvents.push({ date, title, desc });
  document.getElementById('tlTitle').value = '';
  document.getElementById('tlDesc').value = '';

  renderizarTimeline();
  toast('Evento agregado');
}

function eliminarEventoTimeline(index) {
  timelineEvents.splice(index, 1);
  renderizarTimeline();
}

function renderizarTimeline() {
  const container = document.getElementById('timelineEvents');
  const sorted = [...timelineEvents].sort((a, b) => a.date.localeCompare(b.date));

  if (!sorted.length) {
    container.innerHTML = '<p style="font-size:12px;color:var(--dim);padding:20px 0 20px 56px">Agregá eventos para construir la línea de tiempo.</p>';
    document.getElementById('tlCount').textContent = '0 eventos';
    return;
  }

  let html = '';
  sorted.forEach((ev, i) => {
    const fecha = new Date(ev.date + 'T12:00:00');
    const fechaStr = fecha.toLocaleDateString('es-AR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    html += `
      <div class="vs-timeline-item">
        <div class="vs-timeline-dot"></div>
        <div class="vs-timeline-date">${fechaStr}</div>
        <div class="vs-timeline-title">${escHtml(ev.title)}</div>
        ${ev.desc ? `<div class="vs-timeline-desc">${escHtml(ev.desc)}</div>` : ''}
        <div class="vs-timeline-actions">
          <button class="vs-btn vs-btn-danger vs-btn-sm" onclick="eliminarEventoTimeline(${i})">✕</button>
        </div>
      </div>`;
  });

  container.innerHTML = html;
  document.getElementById('tlCount').textContent = `${sorted.length} eventos`;
}

function limpiarTimeline() {
  timelineEvents.length = 0;
  renderizarTimeline();
  toast('Timeline limpiada');
}

// ── IA con búsqueda web ──
async function generarTimelineWeb() {
  const tema = document.getElementById('tlTema').value.trim();
  const desde = document.getElementById('tlDesde').value;

  if (!tema) return toast('Ingresá un tema para la línea de tiempo');

  const btn = document.getElementById('btnTlWeb');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Buscando...'; }

  const result = await apiPost('/visual/timeline', { tema, desde });

  if (btn) { btn.disabled = false; btn.textContent = '🌐 Buscar en web'; }

  if (result && result.ok) {
    try {
      const parsed = JSON.parse(result.texto);
      if (parsed.eventos && parsed.eventos.length) {
        let count = 0;
        parsed.eventos.forEach(ev => {
          const d = fechaValida(ev.date);
          if (!d) return; // omitir eventos con fecha inválida
          timelineEvents.push({ date: d, title: ev.title || 'Evento', desc: ev.desc || '' });
          count++;
        });
        renderizarTimeline();
        if (count) toast(`${count} eventos generados con datos reales`);
        else toast('Los eventos encontrados tienen fechas inválidas');
      } else {
        toast('No se encontraron eventos');
      }
    } catch (e) {
      toast('Error al interpretar respuesta');
    }
  } else {
    toast('No se pudo generar (modo offline)');
  }
}

// ── IA simple (sin web) ──
async function generarTimelineIA() {
  const tema = document.getElementById('tlTema').value.trim() || 'actualidad de Mendoza';

  const btn = document.getElementById('btnTlIA');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Pensando...'; }

  const prompt = `Generá 5 eventos para una línea de tiempo periodística sobre: "${tema}" (Mendoza, Argentina).
Cada evento debe tener: fecha (YYYY-MM-DD), título corto y descripción breve.
Respondé SOLO con JSON sin backticks ni markdown:
{"eventos": [{"date": "2026-01-15", "title": "...", "desc": "..."}]}`;

  const result = await apiPost('/visual/generar', { prompt, datos: '' });
  if (btn) { btn.disabled = false; btn.textContent = '🤖 Solo IA'; }

  if (result && result.ok) {
    try {
      const parsed = JSON.parse(result.texto);
      if (parsed.eventos && parsed.eventos.length) {
        let count = 0;
        parsed.eventos.forEach(ev => {
          const d = fechaValida(ev.date);
          if (!d) return; // omitir eventos con fecha inválida
          timelineEvents.push({ date: d, title: ev.title || 'Evento', desc: ev.desc || '' });
          count++;
        });
        renderizarTimeline();
        if (count) toast(`${count} eventos generados por IA`);
        else toast('Los eventos encontrados tienen fechas inválidas');
      }
    } catch (e) {
      toast('Error al interpretar respuesta IA');
    }
  } else {
    toast('No se pudo obtener sugerencia (modo offline)');
  }
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Renderizador canvas para exportar timeline como flyer ──
function detectarIconoEvento(title, desc) {
  const t = (title + ' ' + desc).toLowerCase();
  if (t.includes('gol') || t.includes('partido') || t.includes('fútbol') || t.includes('mundial') || t.includes('messi')) return '⚽';
  if (t.includes('inflación') || t.includes('economía') || t.includes('dólar') || t.includes('precio') || t.includes('pbi')) return '📈';
  if (t.includes('elección') || t.includes('presidente') || t.includes('gobierno') || t.includes('ley') || t.includes('decreto')) return '🏛';
  if (t.includes('acuerdo') || t.includes('tratado') || t.includes('paz') || t.includes('cumbre')) return '🤝';
  if (t.includes('terremoto') || t.includes('inundación') || t.includes('clima') || t.includes('temporal') || t.includes('sequía')) return '🌊';
  if (t.includes('copa') || t.includes('título') || t.includes('campeón') || t.includes('medalla')) return '🏆';
  if (t.includes('muerte') || t.includes('falleció') || t.includes('asesinato') || t.includes('tragedia')) return '🕊';
  if (t.includes('vacuna') || t.includes('salud') || t.includes('hospital') || t.includes('pandemia')) return '🏥';
  if (t.includes('cine') || t.includes('música') || t.includes('concierto') || t.includes('show') || t.includes('artista')) return '🎭';
  if (t.includes('premio') || t.includes('reconocimiento') || t.includes('galardón')) return '🎖';
  if (t.includes('mundial') || t.includes('olimpíada') || t.includes('jjoo') || t.includes('deporte')) return '🏅';
  return '📌';
}

// ── Helpers de placa (solo para el flyer, no afectan la app) ──
function hexToRgbaPlate(hex, a) {
  const h = String(hex).replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
// Ajusta un texto en hasta maxLines líneas; recorta la última con "…"
function wrapPlateLines(ctx, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else cur = test;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  const used = lines.join(' ').split(/\s+/).length;
  if (used < words.length && lines.length) {
    let last = lines[lines.length - 1];
    lines[lines.length - 1] = last.length > 3 ? last.slice(0, -1) + '…' : last;
  }
  return lines;
}

function renderTimelineCanvas(events, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Paleta de la placa (independiente de la app) ──
  const INK    = '#16201b';   // tinta casi negra
  const INK2   = '#5b665f';   // texto secundario
  const ACCENT = '#1f9d5b';   // verde esmeralda moderno
  const GOLD   = '#c9a227';   // dorado
  const PAPER  = '#ffffff';
  const M = Math.round(W * 0.045);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const n = Math.max(sorted.length, 1);

  // Fondo papel con leve degrade
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#fdfdfb');
  bgGrad.addColorStop(1, '#f1f4f1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Header editorial ──
  const headerH = Math.round(H * 0.13);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, headerH - 6, W, 6); // barra dorada
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = `700 ${Math.round(headerH * 0.13)}px "Inter", sans-serif`;
  ctx.fillText('MEDIA MENDOZA  ·  CRONOLOGÍA', M, headerH * 0.36);
  ctx.fillStyle = '#ffffff';
  ctx.font = `400 ${Math.round(headerH * 0.5)}px "DM Serif Display", serif`;
  ctx.fillText('Línea de tiempo', M, headerH * 0.84);

  // ── Geometría de eventos ──
  const spineX = M + Math.round(W * 0.02);
  const topPad = headerH + Math.round(H * 0.05);
  const botPad = Math.round(H * 0.07);
  const areaH = H - topPad - botPad;
  const spacing = areaH / n;
  const cardH = Math.min(spacing * 0.84, Math.round(H * 0.16));
  const cardX = spineX + Math.round(W * 0.05);
  const cardW = W - M - cardX;

  // Línea espinal
  ctx.strokeStyle = hexToRgbaPlate(ACCENT, 0.5);
  ctx.lineWidth = Math.max(3, W * 0.0025);
  ctx.beginPath();
  ctx.moveTo(spineX, topPad);
  ctx.lineTo(spineX, topPad + areaH);
  ctx.stroke();

  sorted.forEach((ev, i) => {
    const cy = topPad + spacing * i + spacing / 2;

    // Nodo en la espina
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(spineX, cy, W * 0.009, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(spineX, cy, W * 0.005, 0, Math.PI * 2);
    ctx.fill();

    const cardY = cy - cardH / 2;

    // Sombra suave
    ctx.fillStyle = 'rgba(20,32,27,0.10)';
    ctx.beginPath();
    ctx.roundRect(cardX + 4, cardY + 8, cardW, cardH, 18);
    ctx.fill();
    // Tarjeta
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 18);
    ctx.fill();
    // Barra de acento izquierda
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, Math.round(W * 0.006), cardH, [18, 0, 0, 18]);
    ctx.fill();

    // Chip de icono
    const chip = cardH * 0.62;
    const chipX = cardX + Math.round(W * 0.02);
    const chipY = cy - chip / 2;
    ctx.fillStyle = hexToRgbaPlate(ACCENT, 0.12);
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chip, chip, 14);
    ctx.fill();
    ctx.font = `${Math.round(chip * 0.58)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(detectarIconoEvento(ev.title, ev.desc), chipX + chip / 2, chipY + chip / 2);
    ctx.textBaseline = 'alphabetic';

    const textX = chipX + chip + Math.round(W * 0.025);
    const textW = (cardX + cardW - Math.round(W * 0.02)) - textX;

    // Fecha
    const fecha = new Date(ev.date + 'T12:00:00');
    const fechaStr = fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillStyle = ACCENT;
    ctx.font = `700 ${Math.round(cardH * 0.15)}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(fechaStr.toUpperCase(), textX, cardY + cardH * 0.27);

    // Título (envuelto)
    ctx.fillStyle = INK;
    ctx.font = `700 ${Math.round(cardH * 0.21)}px "Inter", sans-serif`;
    wrapPlateLines(ctx, ev.title, textW, 2).forEach((ln, k) =>
      ctx.fillText(ln, textX, cardY + cardH * 0.5 + k * Math.round(cardH * 0.23)));

    // Descripción (envuelta)
    if (ev.desc) {
      ctx.fillStyle = INK2;
      ctx.font = `400 ${Math.round(cardH * 0.155)}px "Inter", sans-serif`;
      wrapPlateLines(ctx, ev.desc, textW, 2).forEach((ln, k) =>
        ctx.fillText(ln, textX, cardY + cardH * 0.74 + k * Math.round(cardH * 0.2)));
    }

    // Índice (gran numeral tenue)
    ctx.fillStyle = hexToRgbaPlate(INK, 0.05);
    ctx.font = `900 ${Math.round(cardH * 0.9)}px "Inter", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 1).padStart(2, '0'), cardX + cardW - Math.round(W * 0.015), cy + cardH * 0.34);
  });
  ctx.textAlign = 'left';

  // ── Footer ──
  const footerY = H - Math.round(H * 0.035);
  ctx.strokeStyle = hexToRgbaPlate(INK, 0.12);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, footerY - Math.round(H * 0.02));
  ctx.lineTo(W - M, footerY - Math.round(H * 0.02));
  ctx.stroke();
  ctx.fillStyle = INK2;
  ctx.font = `600 ${Math.round(H * 0.016)}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('MEDIA MENDOZA · mmherramientas.media', M, footerY);
  ctx.textAlign = 'right';
  ctx.fillText('Generado con Visual Suite', W - M, footerY);

  // Logo de marca (overlay del usuario)
  if (typeof dibujarLogo === 'function') dibujarLogo(ctx, W, H);

  return canvas;
}

async function exportarTimelineComoFlyer() {
  const sorted = [...timelineEvents].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return toast('No hay eventos para exportar');
  // Esperar que las fuentes web estén cargadas antes de pintar al canvas
  await document.fonts.ready;

  const W = 2400;
  const H = Math.max(1200, sorted.length * 240 + 300);
  const canvas = renderTimelineCanvas(sorted, W, H);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'timeline-flyer-media-mendoza');
  }, 'image/png', 1);
}

document.addEventListener('DOMContentLoaded', initTimeline);
