// ============================================================
// Visual Suite — Módulo de Línea de Tiempo
// ============================================================

let timelineEvents = [];
let tlFormatoActual = 'landscape';

function cambiarFormatoTimeline() {
  const fmt = document.getElementById('tlFormato').value;
  if (!VS_Formats[fmt]) return;
  tlFormatoActual = fmt;
  toast(`Formato: ${VS_Formats[fmt].label}`);
}

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
  timelineEvents.sort((a, b) => a.date.localeCompare(b.date));

  if (!timelineEvents.length) {
    container.innerHTML = '<p style="font-size:12px;color:var(--dim);padding:20px 0 20px 56px">Agregá eventos para construir la línea de tiempo.</p>';
    document.getElementById('tlCount').textContent = '0 eventos';
    return;
  }

  let html = '';
  timelineEvents.forEach((ev, i) => {
    const fecha = new Date(ev.date + 'T12:00:00');
    const fechaStr = (fecha.getDate() === 1)
      ? fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })
      : fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    html += `
      <div class="vs-timeline-item">
        <div class="vs-timeline-dot"></div>
        <div class="vs-timeline-date">${fechaStr}</div>
        <div class="vs-timeline-title">${VS_Utils.escHtml(ev.title)}</div>
        ${ev.desc ? `<div class="vs-timeline-desc">${VS_Utils.escHtml(ev.desc)}</div>` : ''}
        <div class="vs-timeline-actions">
          <button class="vs-btn vs-btn-danger vs-btn-sm" onclick="eliminarEventoTimeline(${i})">✕</button>
        </div>
      </div>`;
  });

  container.innerHTML = html;
  document.getElementById('tlCount').textContent = `${timelineEvents.length} eventos`;
}

function limpiarTimeline() {
  if (!confirm('¿Limpiar toda la línea de tiempo? Se borrarán los eventos, el tema, el prompt y el JSON.')) return;
  timelineEvents.length = 0;
  document.getElementById('tlTema').value = '';
  document.getElementById('tlPrompt').value = '';
  document.getElementById('tlJson').value = '';
  renderizarTimeline();
  toast('Timeline limpiada');
}

// ── Normalización de JSON ──
const MESES_IX = {
  enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6, julio:7, agosto:8,
  septiembre:9, octubre:10, noviembre:11, diciembre:12,
  january:1, february:2, march:3, april:4, may:5, june:6, july:7, august:8,
  september:9, october:10, november:11, december:12
};
const CLAVES_FECHA = ['fecha','date','fechaISO','fecha_iso','fechaISOString','timestamp','time','periodo','anio','año','year','mes','month','semana','trimestre'];
const CLAVES_TITULO = ['titulo','title','nombre','name','evento','label','concepto','indicador'];
const CLAVES_DESC = ['descripcion','desc','detalle','resumen','descripción'];

function capitalizar(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function formatearClave(k) {
  return String(k)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, c => c.toUpperCase());
}

function etiquetaPeriodo(s) {
  const m = String(s).trim().match(/^(\d{4})[-/](\d{1,2})/);
  if (m) {
    const meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mm = parseInt(m[2], 10);
    if (mm >= 1 && mm <= 12) return `${meses[mm]} ${m[1]}`;
  }
  return String(s);
}

function extraerFecha(item) {
  for (const k of ['fecha', 'date', 'fechaISO', 'fecha_iso', 'fechaISOString', 'timestamp', 'time']) {
    if (item[k] == null) continue;
    const s = String(item[k]).trim();
    if (/^\d{10,13}$/.test(s)) {
      const dt = new Date(Number(s) * (s.length === 10 ? 1000 : 1));
      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
    const dt = new Date(s.length <= 10 ? s + 'T12:00:00' : s);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  if (item.periodo) {
    const m = String(item.periodo).trim().match(/^(\d{4})[-/](\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-01`;
  }
  const anio = item.año || item.anio || item.year;
  const mes = item.mes || item.month;
  if (anio != null && mes != null) {
    const y = String(anio).trim();
    let mm;
    if (/^\d+$/.test(String(mes).trim())) mm = String(mes).padStart(2, '0');
    else { const mi = MESES_IX[String(mes).trim().toLowerCase()]; if (mi) mm = String(mi).padStart(2, '0'); }
    if (/^\d{4}$/.test(y) && mm) return `${y}-${mm}-01`;
  }
  return null;
}

function tituloContextual(item) {
  const rival = item.rival || item.equipo || item.oponente || item.contrincante;
  const fase = item.fase || item.etapa || item.torneo || item.grupo;
  const esDeporte = rival || item.marcador || item.minuto || item.tipo;
  if (!esDeporte) return null;
  const esGol = item.minuto || (item.tipo && /gol/i.test(String(item.tipo)));
  const noun = esGol ? 'Gol' : (rival ? 'Partido' : 'Evento');
  const pref = (item.id != null && item.id !== '') ? `${noun} #${item.id}` : noun;
  const parts = [];
  if (fase) parts.push(fase);
  if (rival) parts.push('vs ' + rival);
  return parts.length ? `${pref} · ${parts.join(' · ')}` : pref;
}

function normalizarEventoJSON(item) {
  const f = extraerFecha(item);
  const entradas = Object.entries(item).filter(([k, v]) => v !== null && v !== undefined && v !== '');

  let title = '';
  const tk = CLAVES_TITULO.find(k => item[k] != null && String(item[k]).trim() !== '');
  if (tk) {
    title = String(item[tk]).trim();
  } else {
    const ctx = tituloContextual(item);
    if (ctx) title = ctx;
    else if (item.mes && (item.año || item.anio || item.year)) title = `${capitalizar(String(item.mes))} ${item.año || item.anio || item.year}`;
    else if (item.periodo) title = etiquetaPeriodo(String(item.periodo));
    else if (f) { const dt = new Date(f + 'T12:00:00'); title = dt.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }); }
    else {
      const txt = entradas.find(([k, v]) => typeof v === 'string' && !CLAVES_FECHA.includes(k) && v.length > 2 && v.length < 70);
      title = txt ? txt[1] : 'Evento';
    }
  }

  const dk = CLAVES_DESC.find(k => item[k] != null && String(item[k]).trim() !== '');
  let desc = dk ? String(item[dk]).trim() : '';
  if (!desc) {
    const ignorar = new Set([tk, dk, ...CLAVES_FECHA, 'id', 'meta', 'extra', '_', 'tipo_dato']);
    const partes = [];
    for (const [k, v] of entradas) {
      if (ignorar.has(k)) continue;
      if (typeof v === 'object') continue;
      partes.push(`${formatearClave(k)}: ${v}`);
    }
    if (item.tipo_dato) partes.push(`Fuente: ${item.tipo_dato}`);
    desc = partes.join(' · ');
  }

  return { f, title, desc };
}

async function cargarTimelineDesdeJSON() {
  const ta = document.getElementById('tlJson');
  const text = (ta && ta.value || '').trim();
  if (!text) return toast('Pegá el JSON de eventos en el cuadro de arriba');

  let data;
  try { data = JSON.parse(text); }
  catch (e) { return toast('JSON inválido: ' + e.message); }

  let items = Array.isArray(data) ? data
    : (data.eventos || data.data || data.timeline || data.items || data.resultados || []);
  if (!Array.isArray(items) || !items.length) return toast('No se encontraron eventos en el JSON');

  timelineEvents.length = 0;
  let count = 0;
  items.forEach(it => {
    const { f, title, desc } = normalizarEventoJSON(it);
    const d = fechaValida(f);
    if (!d) return;
    timelineEvents.push({ date: d, title, desc, meta: it });
    count++;
  });

  renderizarTimeline();
  if (count) toast(`${count} eventos cargados desde JSON`);
  else toast('Ningún evento tenía una fecha válida');
}

function cargarArchivoJSONTimeline(input) {
  VS_Utils.cargarArchivoJSON(input, 'tlJson', cargarTimelineDesdeJSON);
}

// ── Generar prompt para Chat IA ──
function generarPromptChat() {
  const tema = document.getElementById('tlTema').value.trim();
  if (!tema) return toast('Ingresá un tema para generar el prompt');

  const prompt = `Necesito un JSON para pegar en un frontend que renderiza una línea de tiempo.

Tema: "${tema}"

Formato:
{ "eventos": [ { "fecha": "YYYY-MM-DD", "titulo": "...", "descripcion": "..." } ] }

Pasos:
1. Buscá en Google los eventos reales del tema
2. Armá el JSON con los datos encontrados
3. Incluí la fuente al final de cada descripción entre paréntesis

Reglas:
- Cada evento es una entrada individual
- Orden cronológico estricto
- Usá datos verificados, no inventes
- Si no encontrás info para un campo, dejalo vacío
- Respondé SOLO el JSON`;

  const ta = document.getElementById('tlPrompt');
  if (ta) {
    ta.value = prompt;
    toast('✅ Prompt generado. Copialo con el botón Copiar o Ctrl+C y pegalo en Gemini Chat.');
  }
}

function copiarPrompt() {
  const ta = document.getElementById('tlPrompt');
  VS_Utils.copiarAlPortapapeles(ta?.value, '✅ Prompt copiado al portapapeles');
}

// ── Canvas export ──
function renderTimelineCanvas(events, W, H, titulo) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const M = Math.round(W * 0.045);
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const n = Math.max(sorted.length, 1);

  // Fondo
  if (!dibujarFondoIA(ctx, W, H, 'rgba(253,253,251,0.85)')) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#fdfdfb');
    bgGrad.addColorStop(1, '#f1f4f1');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
  }

  // Header editorial
  VS_CanvasHelpers.drawExportHeader(ctx, W, H, 'CRONOLOGÍA', titulo || 'Línea de tiempo');

  // Geometría de eventos
  const headerH = Math.round(H * 0.13);
  const spineX = M + Math.round(W * 0.02);
  const topPad = headerH + Math.round(H * 0.05);
  const botPad = Math.round(H * 0.07);
  const areaH = H - topPad - botPad;
  const spacing = areaH / n;
  const cardH = Math.min(spacing * 0.84, Math.round(H * 0.16));
  const cardX = spineX + Math.round(W * 0.05);
  const cardW = W - M - cardX;

  // Línea espinal
  ctx.strokeStyle = VS_Utils.hexToRgba(VS_Colors.ACCENT, 0.5);
  ctx.lineWidth = Math.max(3, W * 0.0025);
  ctx.beginPath();
  ctx.moveTo(spineX, topPad);
  ctx.lineTo(spineX, topPad + areaH);
  ctx.stroke();

  sorted.forEach((ev, i) => {
    const cy = topPad + spacing * i + spacing / 2;

    // Nodo en la espina
    ctx.fillStyle = VS_Colors.ACCENT;
    ctx.beginPath();
    ctx.arc(spineX, cy, W * 0.009, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = VS_Colors.PAPER;
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
    ctx.fillStyle = VS_Colors.PAPER;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 18);
    ctx.fill();
    // Barra de acento izquierda
    ctx.fillStyle = VS_Colors.ACCENT;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, Math.round(W * 0.006), cardH, [18, 0, 0, 18]);
    ctx.fill();

    // Chip de icono
    const chip = cardH * 0.62;
    const chipX = cardX + Math.round(W * 0.02);
    const chipY = cy - chip / 2;
    VS_CanvasHelpers.drawIconChip(ctx, chipX, chipY, chip, VS_Utils.detectarEmoji(ev.title + ' ' + ev.desc), VS_Colors.ACCENT);

    const textX = chipX + chip + Math.round(W * 0.025);
    const textW = (cardX + cardW - Math.round(W * 0.02)) - textX;

    // Fecha
    const fecha = new Date(ev.date + 'T12:00:00');
    const fechaStr = (fecha.getDate() === 1)
      ? fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' }).toUpperCase()
      : fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
    ctx.fillStyle = VS_Colors.ACCENT;
    ctx.font = `700 ${Math.round(cardH * 0.15)}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(fechaStr.toUpperCase(), textX, cardY + cardH * 0.27);

    // Título (envuelto)
    ctx.fillStyle = VS_Colors.INK;
    ctx.font = `700 ${Math.round(cardH * 0.21)}px "Inter", sans-serif`;
    VS_Utils.wrapText(ctx, ev.title, textW, 2).forEach((ln, k) =>
      ctx.fillText(ln, textX, cardY + cardH * 0.5 + k * Math.round(cardH * 0.23)));

    // Descripción (envuelta)
    if (ev.desc) {
      ctx.fillStyle = VS_Colors.INK2;
      ctx.font = `400 ${Math.round(cardH * 0.155)}px "Inter", sans-serif`;
      VS_Utils.wrapText(ctx, ev.desc, textW, 2).forEach((ln, k) =>
        ctx.fillText(ln, textX, cardY + cardH * 0.74 + k * Math.round(cardH * 0.2)));
    }

    // Índice
    ctx.fillStyle = VS_Utils.hexToRgba(VS_Colors.INK, 0.05);
    ctx.font = `900 ${Math.round(cardH * 0.9)}px "Inter", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 1).padStart(2, '0'), cardX + cardW - Math.round(W * 0.015), cy + cardH * 0.34);
  });
  ctx.textAlign = 'left';

  // Footer
  VS_CanvasHelpers.drawFooter(ctx, W, H, false);

  // Logo
  VS_Utils.dibujarLogo(ctx, W, H);

  return canvas;
}

async function exportarTimelineComoFlyer() {
  const sorted = [...timelineEvents].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return toast('No hay eventos para exportar');
  await document.fonts.ready;

  const fmt = VS_Formats[tlFormatoActual] || VS_Formats.landscape;
  const W = fmt.w;
  const H = Math.max(fmt.h, sorted.length * fmt.cardH + 300);
  const titulo = document.getElementById('tlTema').value.trim() || 'Línea de tiempo';
  const canvas = renderTimelineCanvas(sorted, W, H, titulo);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'timeline-flyer-media-mendoza');
  }, 'image/png', 1);
}

document.addEventListener('DOMContentLoaded', initTimeline);
