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

const TAVILY_API_KEY = "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";
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
  // Ordenar el array original para que los índices de eliminación coincidan
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

// ── Carga desde JSON (fuente manual / externa) ──
// ── Normalización GENERAL de JSON ──
// Acepta cualquier esquema. Extrae una fecha ordenable y arma título/descripción
// a partir de los campos presentes, sin importar el tema.
const MESES_IX = {
  enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6, julio:7, agosto:8,
  septiembre:9, octubre:10, noviembre:11, diciembre:12,
  january:1, february:2, march:3, april:4, may:5, june:6, july:7, august:8,
  september:9, october:10, november:11, december:12
};
// Campos que denotan fecha (se ignoran al armar la descripción).
const CLAVES_FECHA = ['fecha','date','fechaISO','fecha_iso','fechaISOString','timestamp','time','periodo','anio','año','year','mes','month','semana','trimestre'];
// Campos que denotan un título explícito.
const CLAVES_TITULO = ['titulo','title','nombre','name','evento','label','concepto','indicador'];
// Campos que denotan una descripción explícita.
const CLAVES_DESC = ['descripcion','desc','detalle','resumen','descripción'];

function capitalizar(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// "ipc_mensual_porcentaje" -> "Ipc mensual porcentaje"
function formatearClave(k) {
  return String(k)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, c => c.toUpperCase());
}

// "2026-01" -> "Ene 2026"
function etiquetaPeriodo(s) {
  const m = String(s).trim().match(/^(\d{4})[-/](\d{1,2})/);
  if (m) {
    const meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mm = parseInt(m[2], 10);
    if (mm >= 1 && mm <= 12) return `${meses[mm]} ${m[1]}`;
  }
  return String(s);
}

// Devuelve una fecha YYYY-MM-DD normalizada o null. Soporta muchos formatos.
function extraerFecha(item) {
  // Fecha explícita / ISO / epoch
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
  // Periodo mensual "YYYY-MM"
  if (item.periodo) {
    const m = String(item.periodo).trim().match(/^(\d{4})[-/](\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-01`;
  }
  // Año + mes (numérico o nombre)
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

// Título contextual para casos comunes (deportes/partidos). Null si no aplica.
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

// Normaliza un item cualquiera a {f, title, desc} legibles para la placa.
function normalizarEventoJSON(item) {
  const f = extraerFecha(item);
  const entradas = Object.entries(item).filter(([k, v]) => v !== null && v !== undefined && v !== '');

  // 1) Título
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

  // 2) Descripción: usa la explícita si existe; si no, arma "Clave: valor" con el resto.
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

// Parsea el JSON del textarea (#tlJson) y carga los eventos en la timeline.
// Acepta: array directo, o {eventos|data|timeline|items|resultados:[...]}.
// El JSON reemplaza al dataset actual (es el dataset completo).
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

  const btn = document.getElementById('btnTlJson');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Cargando...'; }

  timelineEvents.length = 0; // el JSON es el dataset completo
  let count = 0;
  items.forEach(it => {
    const { f, title, desc } = normalizarEventoJSON(it);
    const d = fechaValida(f);
    if (!d) return; // omitir eventos con fecha inválida
    timelineEvents.push({ date: d, title, desc, meta: it });
    count++;
  });

  if (btn) { btn.disabled = false; btn.textContent = '📋 Cargar JSON'; }
  renderizarTimeline();
  if (count) toast(`${count} eventos cargados desde JSON`);
  else toast('Ningún evento tenía una fecha válida');
}

// Lee un archivo .json seleccionado y dispara la carga.
function cargarArchivoJSON(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const ta = document.getElementById('tlJson');
    if (ta) ta.value = e.target.result;
    cargarTimelineDesdeJSON();
  };
  reader.onerror = () => toast('No se pudo leer el archivo');
  reader.readAsText(file);
}

// ── Búsqueda directa a Gemini desde el navegador (bypass IP Cloudflare) ──
let _geminiApiKeys = null;

async function obtenerApiKeysGemini() {
  if (_geminiApiKeys) return _geminiApiKeys;
  const res = await apiPost('/visual/key', {});
  if (res && res.ok && Array.isArray(res.keys) && res.keys.length) {
    _geminiApiKeys = res.keys;
    return _geminiApiKeys;
  }
  return [];
}

async function buscarEnGeminiDesdeNavegador(prompt) {
  // ── Paso A: Buscar en la web con Tavily ──
  console.log('🔍 Buscando en web con Tavily...');
  let context = '';
  try {
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: prompt,
        search_depth: 'basic',
        max_results: 5
      })
    });
    if (tavilyRes.ok) {
      const searchData = await tavilyRes.json();
      const results = searchData?.results || [];
      if (results.length) {
        context = results.map(r => `- ${r.title}: ${r.content} (Fuente: ${r.url})`).join('\n');
        console.log(`✅ Tavily devolvió ${results.length} resultados`);
      } else {
        console.warn('⚠️ Tavily no encontró resultados');
      }
    } else {
      console.warn(`⚠️ Tavily error HTTP ${tavilyRes.status}`);
    }
  } catch (e) {
    console.warn('⚠️ Error llamando a Tavily:', e.message);
  }

  // ── Paso B: Consultar a Gemini con el contexto de Tavily (sin googleSearch) ──
  const promptGemini = context
    ? `Usá la siguiente información real obtenida de la web para responder con la mayor precisión posible.\n\nInformación de contexto:\n${context}\n\nPregunta/Instrucción original: ${prompt}`
    : prompt;

  const keys = await obtenerApiKeysGemini();
  if (!keys || !keys.length) return { error: 'No hay API keys de Gemini disponibles' };

  for (let i = 0; i < keys.length; i++) {
    const keyActual = keys[i];
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${keyActual}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptGemini }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 8000 }
        })
      });

      let data = null;
      try { 
        data = await res.json(); 
      } catch (jsonErr) {}

      const esLímiteCuota = (res.status === 429) || (data?.error?.code === 429) || (data?.error?.status === "RESOURCE_EXHAUSTED");
      if (esLímiteCuota) {
        console.warn(`⚠️ Key ${i + 1} agotada (429). Rotando a Key ${i + 2}...`);
        continue;
      }
      if (!res.ok) {
        const msgError = data?.error?.message || `HTTP ${res.status}`;
        console.warn(`⚠️ Key ${i + 1} falló: ${msgError}. Rotando a Key ${i + 2}...`);
        continue; 
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        console.warn(`⚠️ Key ${i + 1} no devolvió texto. Rotando a Key ${i + 2}...`);
        continue;
      }
      console.log(`✅ Gemini respondió con la Key ${i + 1}`);
      return { data: text };
    } catch (e) {
      console.warn(`⚠️ Key ${i + 1} - Error de red: ${e.message}. Rotando a Key ${i + 2}...`);
    }
  }

  return { error: '429_todas_las_keys' };
}

async function procesarResultadoTimeline(result) {
  if (!result || !result.ok) return toast('No se pudo generar (modo offline)');
  try {
    const parsed = JSON.parse(result.texto);
    const items = Array.isArray(parsed) ? parsed : (parsed.eventos || parsed.data || parsed.timeline || parsed.items || []);
    if (items && items.length) {
      let count = 0, omit = 0;
      items.forEach(it => {
        const n = normalizarEventoJSON(it);
        const d = fechaValida(n.f);
        if (!d) { omit++; return; }
        timelineEvents.push({ date: d, title: n.title, desc: n.desc, meta: it });
        count++;
      });
      renderizarTimeline();
      if (count) toast(`${count} eventos generados${omit ? ` (${omit} sin fecha)` : ''}`);
      else toast('Los eventos encontrados tienen fechas inválidas');
    } else {
      toast('No se encontraron eventos');
    }
  } catch (e) {
    toast('Error al interpretar respuesta');
  }
}

// ── IA con búsqueda web (desde navegador → worker) ──
async function generarTimelineWeb() {
  const tema = document.getElementById('tlTema').value.trim();
  const desde = document.getElementById('tlDesde').value;

  if (!tema) return toast('Ingresá un tema para la línea de tiempo');

  const btn = document.getElementById('btnTlWeb');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Buscando en web...'; }

  // Paso 1: buscar desde el navegador (IP residencial, evita 429 de Cloudflare)
  const promptBusqueda = `Buscá la información más actualizada y detallada sobre: "${tema}" ${desde ? `desde la fecha ${desde}` : ""}.
Recopilá TODOS los eventos, hitos, partidos o datos clave. Listalos de forma cronológica con el mayor detalle posible (fechas exactas, resultados, etc). Es CRÍTICO que la información sea actual y basada en resultados de la web.

IMPORTANTE: Si el tema se refiere a un evento FUTURO (ej: Mundial 2026, elecciones futuras, etc), buscá información sobre:
- Fechas programadas del evento
- Previsiones, predicciones o expectativas
- Datos históricos relacionados que sirvan de contexto
- NO inventes resultados que aún no han ocurrido`;

  const busqueda = await buscarEnGeminiDesdeNavegador(promptBusqueda);

  if (busqueda.error && busqueda.error === '429_todas_las_keys') {
    // Todas las keys agotadas por cuota → fallback a conocimiento interno del Worker
    if (btn) btn.textContent = '⏳ Usando conocimiento interno...';
    const result = await apiPost('/visual/timeline', { tema, desde });
    if (btn) { btn.disabled = false; btn.textContent = '🌐 Buscar en web'; }
    return procesarResultadoTimeline(result);
  }

  if (busqueda.error) {
    // Fallback directo al Worker
    if (btn) btn.textContent = '⏳ Enviando al servidor...';
    const result = await apiPost('/visual/timeline', { tema, desde });
    if (btn) { btn.disabled = false; btn.textContent = '🌐 Buscar en web'; }
    return procesarResultadoTimeline(result);
  }

  // Paso 2: enviar texto buscado al Worker para formatear
  if (btn) btn.textContent = '⏳ Formateando datos...';
  const result = await apiPost('/visual/timeline', { tema, desde, textoBusquedaCliente: busqueda.data });
  if (btn) { btn.disabled = false; btn.textContent = '🌐 Buscar en web'; }
  return procesarResultadoTimeline(result);
}

// ── IA con búsqueda web (fundamentada, desde navegador → worker) ──
async function generarTimelineIA() {
  const tema = document.getElementById('tlTema').value.trim() || 'actualidad de Mendoza';

  const btn = document.getElementById('btnTlIA');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Buscando en web...'; }

  // Paso 1: buscar desde el navegador (IP residencial)
  const promptBusqueda = `Buscá la información más actualizada y detallada sobre: "${tema}".
Recopilá TODOS los eventos, hitos, partidos o datos clave. Listalos de forma cronológica con el mayor detalle posible (fechas exactas, resultados, etc). Es CRÍTICO que la información sea actual y basada en resultados de la web.

IMPORTANTE: Si el tema se refiere a un evento FUTURO (ej: Mundial 2026, elecciones futuras, etc), buscá información sobre:
- Fechas programadas del evento
- Previsiones, predicciones o expectativas
- Datos históricos relacionados que sirvan de contexto
- NO inventes resultados que aún no han ocurrido`;

  const busqueda = await buscarEnGeminiDesdeNavegador(promptBusqueda);

  if (busqueda.error && busqueda.error === '429_todas_las_keys') {
    // Todas las keys agotadas → fallback a conocimiento interno del Worker
    if (btn) btn.textContent = '⏳ Usando conocimiento interno...';
    const result = await apiPost('/visual/timeline', { tema, desde: '' });
    if (btn) { btn.disabled = false; btn.textContent = '🤖 IA + Web'; }
    return procesarResultadoTimeline(result);
  }

  if (busqueda.error) {
    // Fallback directo al Worker
    if (btn) btn.textContent = '⏳ Enviando al servidor...';
    const result = await apiPost('/visual/timeline', { tema, desde: '' });
    if (btn) { btn.disabled = false; btn.textContent = '🤖 IA + Web'; }
    return procesarResultadoTimeline(result);
  }

  // Paso 2: enviar al Worker para formatear
  if (btn) btn.textContent = '⏳ Formateando datos...';
  const result = await apiPost('/visual/timeline', { tema, desde: '', textoBusquedaCliente: busqueda.data });
  if (btn) { btn.disabled = false; btn.textContent = '🤖 IA + Web'; }
  return procesarResultadoTimeline(result);
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
  if (t.includes('inflación') || t.includes('inflacion') || t.includes('ipc') || t.includes('economía') || t.includes('dólar') || t.includes('precio') || t.includes('pbi')) return '📈';
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

  // Fondo: IA editorial o papel por defecto
  if (!dibujarFondoIA(ctx, W, H, 'rgba(253,253,251,0.85)')) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#fdfdfb');
    bgGrad.addColorStop(1, '#f1f4f1');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
  }

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
    const fechaStr = (fecha.getDate() === 1)
      ? fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' }).toUpperCase()
      : fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
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
