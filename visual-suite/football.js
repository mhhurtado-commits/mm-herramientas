// ============================================================
// Visual Suite — Fútbol manual: prompt → JSON → placa
// ============================================================

let footballData = { fecha: '', titulo: 'Partidos de hoy', subtitulo: '', partidos: [] };
let footballFormat = 'landscape';
const footballAssets = new Map();
const footballAssetImages = new Map();
let footballRenderToken = 0;

function footballAssetKeyFromName(value) {
  const raw = String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const aliases = {
    'gimnasia y esgrima (mendoza)': 'gimnasia-y-esgrima',
    'gimnasia de mendoza': 'gimnasia-y-esgrima',
    'gimnasia (mza.)': 'gimnasia-y-esgrima',
    'estudiantes (rio cuarto)': 'estudiantes-de-rio-cuarto',
    'estudiantes de rio cuarto': 'estudiantes-de-rio-cuarto',
    'nacional': 'nacional-uru',
    'nacional de uruguay': 'nacional-uru',
    'ucv': 'universidad-central-venezuela',
    'universidad central': 'universidad-central-venezuela',
    'santos fc': 'santos',
    'santos futebol clube': 'santos',
    'independiente medellin': 'independiente-medellin',
    'independiente santa fe': 'santa-fe',
    'o’higgins': 'ohiggins',
    "o'higgins": 'ohiggins'
  };
  if (aliases[raw]) return aliases[raw];
  return raw.replace(/\b(fc|fbc|club|club de futbol)\b/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function footballCompetitionKey(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('sudamericana')) return 'copa-sudamericana';
  if (raw.includes('liga') || raw.includes('clausura') || raw.includes('profesional')) return 'liga-profesional';
  return footballAssetKeyFromName(value);
}

function footballAssetUrl(type, key, ext) {
  if (!key) return '';
  return `../assets/futbol/${type}/${key}.${ext || 'png'}`;
}

function loadFootballAsset(type, key) {
  const cacheKey = `${type}:${key}`;
  if (!key) return Promise.resolve(null);
  if (footballAssets.has(cacheKey)) return footballAssets.get(cacheKey);
  const promise = new Promise(resolve => {
    const img = new Image();
    img.onload = () => { footballAssetImages.set(cacheKey, img); resolve(img); };
    img.onerror = () => resolve(null);
    img.src = footballAssetUrl(type, key, type === 'competencias' && key === 'copa-sudamericana' ? 'svg' : 'png');
  });
  footballAssets.set(cacheKey, promise);
  return promise;
}

function getFootballImage(type, key) {
  return footballAssetImages.get(`${type}:${key}`) || null;
}

function drawFootballImageContain(ctx, img, x, y, w, h) {
  if (!img || !img.naturalWidth) return false;
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  return true;
}

function drawFootballBadge(ctx, key, label, x, y, size, dark) {
  const img = getFootballImage('equipos', key);
  if (drawFootballImageContain(ctx, img, x, y, size, size)) return;
  const initials = String(label || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '?';
  ctx.fillStyle = dark ? 'rgba(255,255,255,.14)' : 'rgba(22,32,27,.08)';
  ctx.strokeStyle = '#a6ce39';
  ctx.lineWidth = Math.max(2, size * .025);
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size * .42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
  ctx.font = `700 ${Math.max(14, size * .2)}px "Inter", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(initials, x + size / 2, y + size / 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function footballAssetKeyForMatch(match, side) {
  const explicit = side === 'local' ? match.escudoLocal : match.escudoVisitante;
  return footballAssetKeyFromName(explicit || (side === 'local' ? match.local : match.visitante));
}

async function preloadFootballAssets(data) {
  const jobs = [];
  (data.partidos || []).forEach(match => {
    jobs.push(loadFootballAsset('equipos', footballAssetKeyForMatch(match, 'local')));
    jobs.push(loadFootballAsset('equipos', footballAssetKeyForMatch(match, 'visitante')));
    jobs.push(loadFootballAsset('competencias', footballCompetitionKey(match.competicion)));
  });
  await Promise.all(jobs);
}

function normalizarFootballJSON(input) {
  const data = input && typeof input === 'object' ? input : {};
  const partidos = Array.isArray(data.partidos) ? data.partidos : [];
  return {
    fecha: String(data.fecha || '').trim(),
    titulo: String(data.titulo || 'Partidos de hoy').trim(),
    subtitulo: String(data.subtitulo || '').trim(),
    fuente: String(data.fuente || '').trim(),
    partidos: partidos.map(p => ({
      hora: String(p?.hora || 'A confirmar').trim(),
      competicion: String(p?.competicion || 'Fútbol').trim(),
      pais: String(p?.pais || '').trim(),
      local: String(p?.local || 'Por confirmar').trim(),
      visitante: String(p?.visitante || 'Por confirmar').trim(),
      estadio: String(p?.estadio || '').trim(),
      estado: String(p?.estado || 'programado').trim().toLowerCase(),
      resultado: String(p?.resultado || '').trim(),
      destacado: Boolean(p?.destacado),
      escudoLocal: String(p?.escudoLocal || '').trim(),
      escudoVisitante: String(p?.escudoVisitante || '').trim(),
      logoCompetencia: String(p?.logoCompetencia || '').trim()
    }))
  };
}

function validarFootballData(data) {
  const d = normalizarFootballJSON(data);
  const errores = [];
  if (!d.fecha) errores.push('Falta la fecha');
  if (!d.partidos.length) errores.push('No hay partidos');
  d.partidos.forEach((p, i) => {
    if (!p.local || !p.visitante) errores.push(`Partido ${i + 1}: faltan equipos`);
  });
  return { ok: errores.length === 0, errores, data: d };
}

function footballDateLabel(value) {
  if (!value) return 'la fecha seleccionada';
  const date = new Date(value + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function initFootball() {
  const date = document.getElementById('footballFecha');
  if (date && !date.value) {
    const now = new Date();
    date.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const format = document.getElementById('footballFormato');
  footballFormat = format?.value || 'landscape';
  renderFootball();
}

function generarPromptFootball() {
  const fecha = document.getElementById('footballFecha')?.value || '';
  const alcance = document.getElementById('footballAlcance')?.value || 'Argentina y CONMEBOL';
  const tipo = document.getElementById('footballTipo')?.value || 'partidos del día';
  const extra = document.getElementById('footballTema')?.value?.trim() || '';
  if (!fecha) return toast('Seleccioná una fecha para generar el prompt');

  const prompt = `Buscá en internet información REAL y actualizada sobre ${tipo} del ${footballDateLabel(fecha)}. Alcance: ${alcance}. ${extra}

Verificá cada partido en fuentes confiables. No inventes partidos, horarios, competencias ni resultados. Si no encontrás datos suficientes, devolvé únicamente los partidos confirmados y aclaralo en el campo "fuente".

Respondé SOLO JSON válido, sin markdown ni explicaciones, con esta estructura exacta:
{
  "fecha": "${footballDateLabel(fecha)}",
  "titulo": "Partidos de hoy",
  "subtitulo": "Argentina y CONMEBOL",
  "fuente": "Fuentes consultadas",
  "partidos": [
    {
      "hora": "19:00",
      "competicion": "Liga Profesional",
      "pais": "Argentina",
      "local": "Equipo local",
      "escudoLocal": "clave-del-equipo-local",
      "visitante": "Equipo visitante",
      "escudoVisitante": "clave-del-equipo-visitante",
      "estadio": "Estadio",
      "estado": "programado",
      "resultado": "",
      "logoCompetencia": "liga-profesional",
      "destacado": false
    }
  ]
}

Reglas: usar horario de Argentina; incluir todas las competiciones encontradas sin duplicados; estado permitido: programado, en vivo, finalizado, suspendido o cancelado; si es un resultado, completar "resultado"; no rellenar con suposiciones. Para los campos de recursos usar claves simples, no URLs: liga-profesional, copa-sudamericana, racing-club, tigre, nacional-uru, etc.`;
  const field = document.getElementById('footballPrompt');
  if (field) field.value = prompt;
  toast('✅ Prompt de fútbol generado');
}

function copiarPromptFootball() {
  VS_Utils.copiarAlPortapapeles(document.getElementById('footballPrompt')?.value, '✅ Prompt copiado al portapapeles');
}

function cargarJSONFootball() {
  const field = document.getElementById('footballJson');
  const text = (field?.value || '').trim();
  if (!text) return toast('Pegá el JSON en el cuadro de entrada');
  let parsed;
  try { parsed = JSON.parse(text); } catch (e) { return toast('JSON inválido: ' + e.message); }
  const result = validarFootballData(parsed);
  if (!result.ok) return toast('JSON incompleto: ' + result.errores.join(' · '));
  footballData = result.data;
  renderFootball();
  toast(`✅ ${footballData.partidos.length} partidos cargados`);
}

function cargarArchivoJSONFootball(input) {
  VS_Utils.cargarArchivoJSON(input, 'footballJson', cargarJSONFootball);
}

function cambiarFormatoFootball() {
  footballFormat = document.getElementById('footballFormato')?.value || 'landscape';
  renderFootball();
}

function dibujarFootballCanvas(ctx, W, H) {
  const d = footballData;
  const format = VS_Formats[footballFormat] || VS_Formats.landscape;
  const headerH = Math.round(H * 0.18);
  const dark = footballFormat === 'story';
  if (!dibujarFondoIA(ctx, W, H, dark ? 'rgba(16,27,21,.78)' : 'rgba(255,255,255,.82)')) {
    VS_CanvasHelpers.drawPlateBackground(ctx, W, H, { dark, accent: '#a6ce39', headerRatio: headerH / H });
  }
  VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'FÚTBOL', d.titulo || 'Partidos de hoy', headerH);

  const M = W * 0.055;
  const bodyTop = headerH + H * 0.055;
  ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
  ctx.font = `700 ${Math.max(22, Math.round(Math.min(W, H) * 0.026))}px "Inter", sans-serif`;
  ctx.fillText(d.fecha || 'Fecha sin especificar', M, bodyTop);
  if (d.subtitulo) {
    ctx.fillStyle = dark ? 'rgba(255,255,255,.7)' : VS_Colors.INK2;
    ctx.font = `500 ${Math.max(15, Math.round(Math.min(W, H) * 0.017))}px "Inter", sans-serif`;
    ctx.fillText(d.subtitulo, M, bodyTop + H * 0.035);
  }

  const columns = format.cssAR === '9 / 16' ? 1 : 2;
  const gap = W * 0.025;
  const cardW = (W - M * 2 - gap * (columns - 1)) / columns;
  const cardH = Math.min(H * 0.17, Math.max(110, (H - bodyTop - H * 0.16) / Math.ceil(Math.max(d.partidos.length, 1) / columns) - H * 0.02));
  const startY = bodyTop + H * 0.075;
  d.partidos.forEach((p, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = M + col * (cardW + gap);
    const y = startY + row * (cardH + H * 0.02);
    ctx.fillStyle = dark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.86)';
    ctx.strokeStyle = dark ? 'rgba(166,206,57,.55)' : 'rgba(22,32,27,.15)';
    ctx.lineWidth = Math.max(2, W * 0.0012);
    ctx.beginPath(); ctx.roundRect(x, y, cardW, cardH, Math.min(18, cardW * .025)); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a6ce39';
    ctx.font = `700 ${Math.max(18, Math.round(Math.min(W, H) * 0.022))}px "Inter", sans-serif`;
    ctx.fillText(p.hora, x + cardW * .045, y + cardH * .25);
    const localKey = footballAssetKeyForMatch(p, 'local');
    const visitanteKey = footballAssetKeyForMatch(p, 'visitante');
    const badgeSize = Math.min(cardW * .18, cardH * .38);
    drawFootballBadge(ctx, localKey, p.local, x + cardW * .08, y + cardH * .34, badgeSize, dark);
    drawFootballBadge(ctx, visitanteKey, p.visitante, x + cardW * .74, y + cardH * .34, badgeSize, dark);
    const competitionKey = p.logoCompetencia || footballCompetitionKey(p.competicion);
    const competitionImg = getFootballImage('competencias', competitionKey);
    if (competitionImg) drawFootballImageContain(ctx, competitionImg, x + cardW * .79, y + cardH * .04, cardW * .16, cardH * .15);
    ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
    ctx.font = `700 ${Math.max(16, Math.round(Math.min(W, H) * 0.021))}px "Inter", sans-serif`;
    const mid = x + cardW * .5;
    ctx.textAlign = 'center';
    ctx.fillText(p.local, x + cardW * .25, y + cardH * .82);
    ctx.fillStyle = dark ? 'rgba(255,255,255,.65)' : VS_Colors.INK2;
    ctx.font = `500 ${Math.max(12, Math.round(Math.min(W, H) * 0.014))}px "Inter", sans-serif`;
    ctx.fillText(p.resultado || 'vs', mid, y + cardH * .58);
    ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
    ctx.font = `700 ${Math.max(16, Math.round(Math.min(W, H) * 0.021))}px "Inter", sans-serif`;
    ctx.fillText(p.visitante, x + cardW * .75, y + cardH * .82);
    ctx.textAlign = 'left';
    ctx.fillStyle = dark ? 'rgba(255,255,255,.58)' : VS_Colors.INK2;
    ctx.font = `600 ${Math.max(10, Math.round(Math.min(W, H) * 0.011))}px "Inter", sans-serif`;
    ctx.fillText(`${p.competicion}${p.estado ? ' · ' + p.estado : ''}`, x + cardW * .045, y + cardH * .12);
  });
  if (d.fuente) {
    ctx.fillStyle = dark ? 'rgba(255,255,255,.5)' : VS_Colors.INK2;
    ctx.font = `500 ${Math.max(10, Math.round(Math.min(W, H) * 0.01))}px "Inter", sans-serif`;
    ctx.fillText('Fuente: ' + d.fuente, M, H - H * 0.07);
  }
  VS_CanvasHelpers.drawFooter(ctx, W, H, dark);
  VS_CanvasHelpers.drawPlateLogo(ctx, W, H);
}

function renderFootball() {
  const canvas = document.getElementById('footballCanvas');
  const area = document.getElementById('footballArea');
  if (!canvas || !area) return;
  const format = VS_Formats[footballFormat] || VS_Formats.landscape;
  const width = Math.max(320, Math.min(area.clientWidth || 760, 900));
  const ratio = format.w / format.h;
  canvas.width = format.w;
  canvas.height = format.h;
  canvas.style.width = width + 'px';
  canvas.style.height = Math.round(width / ratio) + 'px';
  const token = ++footballRenderToken;
  dibujarFootballCanvas(canvas.getContext('2d'), format.w, format.h);
  preloadFootballAssets(footballData).then(() => {
    if (token === footballRenderToken) dibujarFootballCanvas(canvas.getContext('2d'), format.w, format.h);
  });
  const count = document.getElementById('footballCount');
  if (count) count.textContent = `${footballData.partidos.length} partido${footballData.partidos.length === 1 ? '' : 's'}`;
}

async function exportarFootball() {
  const format = VS_Formats[footballFormat] || VS_Formats.landscape;
  await preloadFootballAssets(footballData);
  const canvas = document.createElement('canvas');
  canvas.width = format.w; canvas.height = format.h;
  dibujarFootballCanvas(canvas.getContext('2d'), format.w, format.h);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'futbol-media-mendoza');
  }, 'image/png', 1);
}

function limpiarFootball() {
  footballData = { fecha: '', titulo: 'Partidos de hoy', subtitulo: '', partidos: [] };
  const json = document.getElementById('footballJson');
  if (json) json.value = '';
  renderFootball();
}

if (typeof window !== 'undefined') {
  window.normalizarFootballJSON = normalizarFootballJSON;
  window.validarFootballData = validarFootballData;
  window.footballAssetKeyFromName = footballAssetKeyFromName;
  window.initFootball = initFootball;
  window.generarPromptFootball = generarPromptFootball;
  window.copiarPromptFootball = copiarPromptFootball;
  window.cargarJSONFootball = cargarJSONFootball;
  window.cargarArchivoJSONFootball = cargarArchivoJSONFootball;
  window.cambiarFormatoFootball = cambiarFormatoFootball;
  window.exportarFootball = exportarFootball;
  window.limpiarFootball = limpiarFootball;
}

if (typeof module !== 'undefined') module.exports = { normalizarFootballJSON, validarFootballData, footballAssetKeyFromName };
