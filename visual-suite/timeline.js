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

// ── IA desde URL específica ──
async function generarTimelineDesdeUrl() {
  const url = document.getElementById('tlUrl').value.trim();
  const tema = document.getElementById('tlTema').value.trim() || url;

  if (!url) return toast('Ingresá una URL de un artículo');

  const btn = document.querySelector('button[onclick="generarTimelineDesdeUrl()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Extrayendo...'; }

  const result = await apiPost('/visual/timeline', { url, tema });

  if (btn) { btn.disabled = false; btn.textContent = '📄 Extraer desde URL'; }

  if (result?.error) return toast(result.error);

  if (result && result.ok) {
    try {
      const parsed = JSON.parse(result.texto);
      if (parsed.eventos && parsed.eventos.length) {
        parsed.eventos.forEach(ev => {
          timelineEvents.push({
            date: ev.date || '2026-01-01',
            title: ev.title || 'Evento',
            desc: ev.desc || ''
          });
        });
        renderizarTimeline();
        toast(`${parsed.eventos.length} eventos extraídos del artículo`);
      } else {
        toast('No se encontraron eventos en el artículo');
      }
    } catch (e) {
      toast('Error al interpretar respuesta');
    }
  } else {
    toast('Error al procesar');
  }
}

// ── IA con búsqueda web ──
async function generarTimelineWeb() {
  const tema = document.getElementById('tlTema').value.trim();
  const desde = document.getElementById('tlDesde').value;

  if (!tema) return toast('Ingresá un tema para la línea de tiempo');

  const btn = document.querySelector('#panel-timeline .vs-btn-primary + .vs-btn-secondary');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Buscando...'; }

  const result = await apiPost('/visual/timeline', { tema, desde });

  if (btn) { btn.disabled = false; btn.textContent = '🌐 Generar con IA (web)'; }

  if (result && result.ok) {
    try {
      const parsed = JSON.parse(result.texto);
      if (parsed.eventos && parsed.eventos.length) {
        parsed.eventos.forEach(ev => {
          timelineEvents.push({
            date: ev.date || '2026-01-01',
            title: ev.title || 'Evento',
            desc: ev.desc || ''
          });
        });
        renderizarTimeline();
        toast(`${parsed.eventos.length} eventos generados con datos reales`);
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

  const btn = document.querySelector('#panel-timeline .vs-btn-primary + .vs-btn-secondary');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Pensando...'; }

  const prompt = `Generá 5 eventos para una línea de tiempo periodística sobre: "${tema}" (Mendoza, Argentina).
Cada evento debe tener: fecha (YYYY-MM-DD), título corto y descripción breve.
Respondé SOLO con JSON sin backticks ni markdown:
{"eventos": [{"date": "2026-01-15", "title": "...", "desc": "..."}]}`;

  const result = await apiPost('/visual/generar', { prompt, datos: '' });
  if (btn) { btn.disabled = false; btn.textContent = '🌐 Generar con IA (web)'; }

  if (result && result.ok) {
    try {
      const parsed = JSON.parse(result.texto);
      if (parsed.eventos && parsed.eventos.length) {
        parsed.eventos.forEach(ev => {
          timelineEvents.push({
            date: ev.date || '2026-01-01',
            title: ev.title || 'Evento',
            desc: ev.desc || ''
          });
        });
        renderizarTimeline();
        toast(`${parsed.eventos.length} eventos generados por IA`);
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

function renderTimelineCanvas(events, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const isDark = document.body.classList.contains('dark-theme');
  const bg = isDark ? '#0f1110' : '#f8f9f7';
  const cardBg = isDark ? '#1a1c1a' : '#ffffff';
  const accent = '#a6ce39';
  const textColor = isDark ? '#e8e8e0' : '#1a1a1a';
  const dimText = isDark ? '#888' : '#888';
  const lineColor = isDark ? '#2a2c2a' : '#e0e0e0';

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  // Fondo
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Header bar
  const headerH = H * 0.1;
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = '#1a2a00';
  ctx.font = `900 ${headerH * 0.36}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('📅 LÍNEA DE TIEMPO', W / 2, headerH * 0.62);
  ctx.font = `${headerH * 0.2}px "Inter", sans-serif`;
  ctx.fillStyle = '#2a4a00';
  ctx.fillText('Media Mendoza', W / 2, headerH * 0.88);

  // Línea vertical central
  const centerX = W * 0.15;
  const startY = headerH + H * 0.04;
  const eventSpacing = (H - headerH - H * 0.12) / Math.max(sorted.length, 1);
  const usableH = H - headerH - H * 0.08;

  // Dibujar línea vertical
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(centerX, startY);
  ctx.lineTo(centerX, startY + usableH * 0.95);
  ctx.stroke();

  // Footer
  const footerY = H - H * 0.04;
  ctx.fillStyle = dimText;
  ctx.font = `${H * 0.018}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Media Mendoza · mmherramientas.media', W / 2, footerY);

  // Eventos
  sorted.forEach((ev, i) => {
    const y = startY + i * eventSpacing;
    const fecha = new Date(ev.date + 'T12:00:00');
    const fechaStr = fecha.toLocaleDateString('es-AR', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    // Círculo en la línea
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(centerX, y, W * 0.012, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bg;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, y, W * 0.018, 0, Math.PI * 2);
    ctx.stroke();

    // Card de evento
    const cardX = centerX + W * 0.04;
    const cardW = W * 0.78;
    const cardH = eventSpacing * 0.75;
    const cardY = y - cardH / 2;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.beginPath();
    ctx.roundRect(cardX + 2, cardY + 2, cardW, cardH, 8);
    ctx.fill();

    // Card bg
    ctx.fillStyle = cardBg;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();

    // Borde izquierdo
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, 4, cardH, [2, 0, 0, 2]);
    ctx.fill();

    // Icono
    const icono = detectarIconoEvento(ev.title, ev.desc);
    ctx.font = `${cardH * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(icono, cardX + W * 0.045, cardY + cardH * 0.55);

    // Fecha
    ctx.fillStyle = accent;
    ctx.font = `700 ${cardH * 0.18}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(fechaStr, cardX + W * 0.075, cardY + cardH * 0.35);

    // Título
    ctx.fillStyle = textColor;
    ctx.font = `700 ${cardH * 0.22}px "Inter", sans-serif`;
    ctx.fillText(ev.title.substring(0, 80), cardX + W * 0.075, cardY + cardH * 0.62);

    // Descripción
    if (ev.desc) {
      ctx.fillStyle = dimText;
      ctx.font = `${cardH * 0.17}px "Inter", sans-serif`;
      const descText = ev.desc.length > 120 ? ev.desc.substring(0, 117) + '...' : ev.desc;
      ctx.fillText(descText, cardX + W * 0.075, cardY + cardH * 0.85);
    }
  });

  return canvas;
}

function exportarTimelineComoFlyer() {
  const sorted = [...timelineEvents].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return toast('No hay eventos para exportar');

  const W = 1200;
  const H = Math.max(600, sorted.length * 120 + 150);
  const canvas = renderTimelineCanvas(sorted, W, H);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'timeline-flyer-media-mendoza');
  }, 'image/png', 1);
}

document.addEventListener('DOMContentLoaded', initTimeline);
