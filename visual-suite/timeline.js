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

// ── IA para generar timeline ──
async function generarTimelineIA() {
  const btn = document.querySelector('#panel-timeline .vs-btn-primary + .vs-btn-secondary');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Pensando...'; }

  const prompt = `Generá 5 eventos para una línea de tiempo periodística sobre un tema de actualidad de Mendoza, Argentina.
Cada evento debe tener: fecha (YYYY-MM-DD), título corto y descripción breve.
Respondé SOLO con JSON sin backticks ni markdown:
{"eventos": [{"date": "2026-01-15", "title": "...", "desc": "..."}]}`;

  const result = await apiPost('/visual/generar', { prompt, datos: '' });
  if (btn) { btn.disabled = false; btn.textContent = '🤖 Generar con IA'; }

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
