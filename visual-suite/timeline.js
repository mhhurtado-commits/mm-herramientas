// ============================================================
// Visual Suite — Módulo de Línea de Tiempo
// ============================================================

let timelineEvents = [];
let tlFormatoActual = 'landscape';
let tlTituloActual = '';
const TIMELINE_DEFAULT_TITLE = '\u004c\u00ednea de tiempo';
const TIMELINE_SECTION_LABEL = 'CRONOLOG\u00cdA';

function normalizarTituloTimeline(value) {
  const title = String(value || '').replace(/\s+/g, ' ').trim();
  if (!title) return TIMELINE_DEFAULT_TITLE;
  if (title.length <= 48) return title;
  const shortened = title.slice(0, 47).replace(/\s+\S*$/, '').trim();
  return `${shortened}…`;
}

function obtenerTituloTimeline() {
  const input = document.getElementById('tlTema');
  return normalizarTituloTimeline(input?.value || tlTituloActual);
}

function cambiarFormatoTimeline() {
  const fmt = document.getElementById('tlFormato').value;
  if (!VS_Formats[fmt]) return;
  tlFormatoActual = fmt;
  renderizarTimelinePreview();
  toast(`Formato: ${VS_Formats[fmt].label}`);
}

function initTimeline() {
  document.getElementById('tlDate').valueAsDate = new Date();
  renderizarTimelinePreview();
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
    renderizarTimelinePreview();
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
  renderizarTimelinePreview();
}

function calcularTimelineCanvasSize(formato, cantidad) {
  const fmt = VS_Formats[formato] || VS_Formats.landscape;
  const count = Math.max(1, cantidad);
  return {
    width: fmt.w,
    height: formato === 'square' ? fmt.h : Math.max(fmt.h, count * fmt.cardH + 300)
  };
}

function renderizarTimelinePreview() {
  const canvas = document.getElementById('timelineCanvas');
  if (!canvas || typeof renderTimelineCanvas !== 'function') return;

  const size = calcularTimelineCanvasSize(tlFormatoActual, timelineEvents.length);
  const titulo = obtenerTituloTimeline();
  const events = [...timelineEvents].sort((a, b) => a.date.localeCompare(b.date));
  const rendered = renderTimelineCanvas(events, size.width, size.height, titulo);
  canvas.width = rendered.width;
  canvas.height = rendered.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(rendered, 0, 0);
}

function limpiarTimeline() {
  if (!confirm('¿Limpiar toda la línea de tiempo? Se borrarán los eventos, el tema, el prompt y el JSON.')) return;
  timelineEvents.length = 0;
  tlTituloActual = '';
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
  const tituloJSON = data.titulo || data.title || data.tema || data.topic;
  if (tituloJSON) {
    tlTituloActual = normalizarTituloTimeline(tituloJSON);
    const temaInput = document.getElementById('tlTema');
    if (temaInput) temaInput.value = tlTituloActual;
  }
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

Formato exacto:
{
  "titulo": "Título breve de la línea de tiempo (máximo 48 caracteres)",
  "eventos": [
    { "fecha": "YYYY-MM-DD", "titulo": "...", "descripcion": "..." }
  ]
}

Pasos:
1. Buscá en Google los eventos reales del tema
2. Armá el JSON con los datos encontrados
3. Incluí la fuente al final de cada descripción entre paréntesis
4. El campo "titulo" debe resumir el tema en no más de 48 caracteres incluyendo espacios
5. La interfaz puede reducir el tamaño del título hasta un 82% del tamaño base; mantenelo breve para evitar truncamientos
6. Cada "descripcion" debe ser una síntesis completa de entre 100 y 140 caracteres: conservar qué ocurrió, dónde o a quién afecta y el dato clave; no uses puntos suspensivos

Reglas:
- Cada evento es una entrada individual
- Orden cronológico estricto
- Usá datos verificados, no inventes
- Si no encontrás info para un campo, dejalo vacío
- No devuelvas texto fuera del JSON
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
function calcularTimelineLayout(W, H, count, format = 'landscape') {
  const n = Math.max(Number(count) || 0, 1);
  const M = Math.round(W * 0.045);
  const headerH = typeof VS_CanvasHelpers !== 'undefined' ? VS_CanvasHelpers.plateHeaderHeight(W, H) : Math.round(H * 0.15);
  const top = headerH + Math.round(H * (format === 'square' ? 0.07 : 0.05));
  const bottom = Math.round(H * 0.08);
  const areaH = Math.max(1, H - top - bottom);
  if (format === 'square') {
    const columns = 2;
    const rows = Math.ceil(n / columns);
    const spineGap = Math.round(W * 0.045);
    const cardW = (W - M * 2 - spineGap) / 2;
    const spacing = areaH / rows;
    const cardH = Math.min(spacing * 0.82, H * 0.205);
    return {
      format, columns, rows, headerH, top, bottom, areaH, spineX: W / 2,
      card: { w: cardW, h: cardH },
      cards: Array.from({ length: n }, (_, index) => {
        const row = Math.floor(index / columns);
        const side = index % columns;
        const x = side === 0 ? M : W / 2 + spineGap / 2;
        return { index, row, side, x, y: top + row * spacing + (spacing - cardH) / 2, w: cardW, h: cardH };
      })
    };
  }
  const spineX = M + Math.round(W * 0.02);
  const cardX = spineX + Math.round(W * 0.05);
  const spacing = areaH / n;
  const cardH = Math.min(spacing * 0.84, Math.round(H * 0.16));
  return {
    format, columns: 1, rows: n, headerH, top, bottom, areaH, spineX,
    card: { w: W - M - cardX, h: cardH },
    cards: Array.from({ length: n }, (_, index) => ({ index, row: index, side: 1, x: cardX, y: top + spacing * index + (spacing - cardH) / 2, w: W - M - cardX, h: cardH }))
  };
}

function ajustarLineasTimeline(ctx, text, maxWidth, maxLines = 2, fontSize = 30) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let size = Math.max(10, Number(fontSize) || 30);
  let lines = [];
  while (size >= 10) {
    ctx.font = `${size}px Inter, sans-serif`;
    lines = [];
    let current = '';
    words.forEach(word => {
      const candidate = current ? `${current} ${word}` : word;
      if (!current || ctx.measureText(candidate).width <= maxWidth) current = candidate;
      else { lines.push(current); current = word; }
    });
    if (current) lines.push(current);
    if (lines.length <= maxLines) break;
    size -= 1;
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines.length - 1;
    while (ctx.measureText(`${lines[last]}…`).width > maxWidth && lines[last].length > 3) lines[last] = lines[last].slice(0, -1);
    lines[last] += '…';
  }
  return { lines, fontSize: size };
}

function renderTimelineCanvasLegacy(events, W, H, titulo) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const M = Math.round(W * 0.045);
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const n = Math.max(sorted.length, 1);
    const headerH = VS_CanvasHelpers.plateHeaderHeight(W, H);

  // Fondo
  if (!dibujarFondoIA(ctx, W, H, 'rgba(253,253,251,0.85)')) {
    VS_CanvasHelpers.drawPlateBackground(ctx, W, H, { headerRatio: headerH / H });
  }

  // Header editorial
  VS_CanvasHelpers.drawExportHeader(ctx, W, H, 'CRONOLOGÍA', titulo || 'Línea de tiempo', headerH);

  // Geometría de eventos
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
  VS_CanvasHelpers.drawPlateLogo(ctx, W, H);

  return canvas;
}

function renderTimelineCanvas(events, W, H, titulo) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const format = Math.abs(W - H) < 2 ? 'square' : (W / H > 1.2 ? 'landscape' : 'portrait');
  const layout = calcularTimelineLayout(W, H, events.length, format);
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  VS_CanvasHelpers.drawPlateBackground(ctx, W, H, { headerRatio: layout.headerH / H });
  VS_CanvasHelpers.drawExportHeader(ctx, W, H, TIMELINE_SECTION_LABEL, normalizarTituloTimeline(titulo), layout.headerH, { titleMaxChars: 48, titleMinScale: 0.82, titleMaxWidth: W * 0.89 });

  ctx.strokeStyle = VS_Utils.hexToRgba(VS_Colors.ACCENT, 0.55);
  ctx.lineWidth = Math.max(3, W * 0.0025);
  ctx.beginPath(); ctx.moveTo(layout.spineX, layout.top); ctx.lineTo(layout.spineX, layout.top + layout.areaH); ctx.stroke();

  sorted.forEach((ev, i) => {
    const slot = layout.cards[i];
    const cy = slot.y + slot.h / 2;
    const connectorEnd = slot.side === 0 ? slot.x + slot.w : slot.x;
    ctx.strokeStyle = VS_Utils.hexToRgba(VS_Colors.ACCENT, 0.55);
    ctx.lineWidth = Math.max(3, W * 0.0025);
    ctx.beginPath(); ctx.moveTo(layout.spineX, cy); ctx.lineTo(connectorEnd, cy); ctx.stroke();
    ctx.fillStyle = VS_Colors.ACCENT;
    ctx.beginPath(); ctx.arc(layout.spineX, cy, Math.max(9, W * 0.009), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = VS_Colors.PAPER;
    ctx.beginPath(); ctx.arc(layout.spineX, cy, Math.max(5, W * 0.005), 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(20,32,27,0.10)'; ctx.beginPath(); ctx.roundRect(slot.x + 4, slot.y + 8, slot.w, slot.h, 18); ctx.fill();
    ctx.fillStyle = VS_Colors.PAPER; ctx.beginPath(); ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 18); ctx.fill();
    ctx.fillStyle = VS_Colors.ACCENT; ctx.beginPath(); ctx.roundRect(slot.x, slot.y, Math.round(W * 0.006), slot.h, [18, 0, 0, 18]); ctx.fill();

    const chip = Math.min(slot.h * (format === 'square' ? .38 : .62), slot.w * .18);
    const chipX = format === 'square' ? slot.x + slot.w * .06 : slot.x + W * .02;
    const chipY = cy - chip / 2;
    VS_CanvasHelpers.drawIconChip(ctx, chipX, chipY, chip, VS_Utils.detectarEmoji(`${ev.title} ${ev.desc}`), VS_Colors.ACCENT);
    const textX = chipX + chip + (format === 'square' ? slot.w * .045 : W * .025);
    const textW = slot.x + slot.w - (format === 'square' ? slot.w * .05 : W * .02) - textX;
    const fecha = new Date(ev.date + 'T12:00:00');
    const fechaStr = fecha.getDate() === 1
      ? fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })
      : fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.textAlign = 'left';
    const dateSize = Math.max(16, slot.h * (format === 'square' ? .105 : .15));
    ctx.fillStyle = VS_Colors.ACCENT; ctx.font = `700 ${dateSize}px Inter, sans-serif`;
    ctx.fillText(fechaStr.toUpperCase(), textX, slot.y + slot.h * .25);

    const titleSize = Math.max(20, slot.h * (format === 'square' ? .18 : .21));
    const titleFit = ajustarLineasTimeline(ctx, ev.title, textW, format === 'square' ? 2 : 2, titleSize);
    ctx.fillStyle = VS_Colors.INK; ctx.font = `700 ${titleFit.fontSize}px Inter, sans-serif`;
    titleFit.lines.forEach((line, k) => ctx.fillText(line, textX, slot.y + slot.h * .47 + k * titleFit.fontSize * 1.08));

    if (ev.desc) {
      const descY = slot.y + slot.h * .70;
      ctx.fillStyle = VS_Utils.hexToRgba(VS_Colors.ACCENT, 0.07);
      ctx.beginPath(); ctx.roundRect(textX - slot.w * .015, descY - slot.h * .07, textW + slot.w * .015, slot.h * .28, 10); ctx.fill();
      const descSize = Math.max(28, slot.h * (format === 'square' ? .17 : .18));
      const descFit = ajustarLineasTimeline(ctx, ev.desc, textW, format === 'square' ? 3 : 2, descSize);
      ctx.fillStyle = VS_Colors.INK2; ctx.font = `400 ${descFit.fontSize}px Inter, sans-serif`;
      descFit.lines.forEach((line, k) => ctx.fillText(line, textX, descY + k * descFit.fontSize * 1.08));
    }
    ctx.fillStyle = VS_Utils.hexToRgba(VS_Colors.INK, 0.06);
    ctx.font = `900 ${Math.max(28, slot.h * .55)}px Inter, sans-serif`;
    ctx.textAlign = 'right'; ctx.fillText(String(i + 1).padStart(2, '0'), slot.x + slot.w - W * .02, slot.y + slot.h * .82);
  });
  ctx.textAlign = 'left';
  VS_CanvasHelpers.drawFooter(ctx, W, H, false);
  VS_CanvasHelpers.drawPlateLogo(ctx, W, H);
  return canvas;
}

async function exportarTimelineComoFlyer() {
  const sorted = [...timelineEvents].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return toast('No hay eventos para exportar');
  await document.fonts.ready;

  const fmt = VS_Formats[tlFormatoActual] || VS_Formats.landscape;
  const W = fmt.w;
  const H = calcularTimelineCanvasSize(tlFormatoActual, sorted.length).height;
  const titulo = obtenerTituloTimeline();
  const canvas = renderTimelineCanvas(sorted, W, H, titulo);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'timeline-flyer-media-mendoza');
  }, 'image/png', 1);
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', initTimeline);
if (typeof module !== 'undefined') module.exports = { calcularTimelineLayout, ajustarLineasTimeline, normalizarTituloTimeline };
