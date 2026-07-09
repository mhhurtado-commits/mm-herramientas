// ============================================================
// Visual Suite — Módulo de Línea de Tiempo
// ============================================================

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

document.addEventListener('DOMContentLoaded', initTimeline);
