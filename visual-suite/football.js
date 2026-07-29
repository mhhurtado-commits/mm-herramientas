// ============================================================
// Visual Suite — Fútbol manual: prompt → JSON → placa
// ============================================================

let footballData = { fecha: '', titulo: 'Partidos de hoy', subtitulo: '', partidos: [] };
let footballFormat = 'landscape';
const footballAssets = new Map();
const footballAssetImages = new Map();
let footballRenderToken = 0;
let footballSelectedIndexes = new Set();
let footballDetailData = null;

const ARGENTINE_FOOTBALL_KEYS = new Set([
  'aldosivi', 'argentinos-juniors', 'atletico-platense', 'atletico-tucuman', 'banfield',
  'barracas-central', 'belgrano', 'boca-juniors', 'central-cordoba-se', 'defensa-y-justicia',
  'deportivo-riestra', 'estudiantes-de-la-plata', 'estudiantes-de-rio-cuarto',
  'gimnasia-y-esgrima', 'gimnasia-y-esgrima-lp', 'godoy-cruz', 'huracan', 'independiente',
  'independiente-rivadavia', 'instituto-cordoba', 'lanus', 'newells-old-boys', 'racing-club',
  'river-plate', 'rosario-central', 'san-lorenzo', 'san-martin-sj', 'sarmiento', 'talleres',
  'tigre', 'union', 'velez-sarsfield', 'agropecuario-argentino', 'all-boys', 'almagro',
  'atlanta', 'chaco-for-ever', 'deportivo-madryn', 'deportivo-maipu', 'deportivo-moron',
  'estudiantes-de-buenos-aires', 'gimnasia-de-jujuy', 'gimnasia-y-tiro', 'patronato',
  'quilmes', 'san-miguel', 'san-telmo', 'temperley', 'tristan-suarez'
]);

function footballAssetKeyFromName(value) {
  const raw = String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const aliases = {
    'gimnasia y esgrima (mendoza)': 'gimnasia-y-esgrima',
    'gimnasia y esgrima la plata': 'gimnasia-y-esgrima-lp',
    'gimnasia y esgrima (la plata)': 'gimnasia-y-esgrima-lp',
    'gimnasia y esgrima (lp)': 'gimnasia-y-esgrima-lp',
    'gimnasia la plata': 'gimnasia-y-esgrima-lp',
    'gimnasia-la-plata': 'gimnasia-y-esgrima-lp',
    'gimnasia lp': 'gimnasia-y-esgrima-lp',
    'gimnasia-lp': 'gimnasia-y-esgrima-lp',
    'gimnasia-y-esgrima-lp': 'gimnasia-y-esgrima-lp',
    'gimnasia y esgrima (mza.)': 'gimnasia-y-esgrima',
    'gimnasia y esgrima (mza)': 'gimnasia-y-esgrima',
    'gimnasia y esgrima mendoza': 'gimnasia-y-esgrima',
    'gimnasia mendoza': 'gimnasia-y-esgrima',
    'gimnasia de mendoza': 'gimnasia-y-esgrima',
    'gimnasia (mza.)': 'gimnasia-y-esgrima',
    'gimnasia-mza': 'gimnasia-y-esgrima',
    'gimnasia-mza.': 'gimnasia-y-esgrima',
    'gimnasia-mendoza': 'gimnasia-y-esgrima',
    'gimnasia-mendoza-fc': 'gimnasia-y-esgrima',
    'gimnasia mza': 'gimnasia-y-esgrima',
    'estudiantes (rio cuarto)': 'estudiantes-de-rio-cuarto',
    'estudiantes de rio cuarto': 'estudiantes-de-rio-cuarto',
    'estudiantes (rc)': 'estudiantes-de-rio-cuarto',
    'estudiantes rc': 'estudiantes-de-rio-cuarto',
    'estudiantes-rc': 'estudiantes-de-rio-cuarto',
    'estudiantes-rio-cuarto': 'estudiantes-de-rio-cuarto',
    'racing': 'racing-club',
    'racing club': 'racing-club',
    'racing-club': 'racing-club',
    'racing club de avellaneda': 'racing-club',
    'racing de avellaneda': 'racing-club',
    'instituto': 'instituto-cordoba',
    'instituto cordoba': 'instituto-cordoba',
    'instituto atletico central cordoba': 'instituto-cordoba',
    'platense': 'atletico-platense',
    'club atletico platense': 'atletico-platense',
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

function esEquipoFootballArgentino(value, pais) {
  if (String(pais || '').toLowerCase().includes('argentina')) return true;
  return ARGENTINE_FOOTBALL_KEYS.has(footballAssetKeyFromName(value));
}

function footballMatchIncludesArgentine(match) {
  return esEquipoFootballArgentino(match.local, match.pais) || esEquipoFootballArgentino(match.visitante, match.pais);
}

function getSelectedFootballMatches() {
  return footballData.partidos.filter((_, index) => footballSelectedIndexes.has(index));
}

function getSelectedFootballData() {
  return { ...footballData, partidos: getSelectedFootballMatches() };
}

function renderFootballSelection() {
  const panel = document.getElementById('footballSelectionPanel');
  const list = document.getElementById('footballSelectionList');
  if (!panel || !list) return;
  panel.hidden = !footballData.partidos.length;
  footballDetailPanelRefresh();
  list.innerHTML = '';
  footballData.partidos.forEach((match, index) => {
    const label = document.createElement('label');
    label.className = 'vs-football-selection-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = footballSelectedIndexes.has(index);
    checkbox.addEventListener('change', () => actualizarSeleccionFootball(index, checkbox.checked));
    const text = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = `${footballDisplayName(match.local)} vs ${footballDisplayName(match.visitante)}`;
    const meta = document.createElement('small');
    meta.textContent = `${match.hora} · ${match.competicion}${footballMatchIncludesArgentine(match) ? ' · incluye equipo argentino' : ''}`;
    text.append(title, meta);
    label.append(checkbox, text);
    list.appendChild(label);
  });
}

function actualizarSeleccionFootball(index, selected) {
  if (selected) footballSelectedIndexes.add(index);
  else footballSelectedIndexes.delete(index);
  if (getSelectedFootballMatches().length !== 1) footballDetailData = null;
  renderFootballSelection();
  renderFootball();
}

function seleccionarTodosFootball() {
  footballSelectedIndexes = new Set(footballData.partidos.map((_, index) => index));
  footballDetailData = null;
  renderFootballSelection();
  renderFootball();
}

function seleccionarArgentinosFootball() {
  footballSelectedIndexes = new Set(footballData.partidos
    .map((match, index) => footballMatchIncludesArgentine(match) ? index : null)
    .filter(index => index !== null));
  footballDetailData = null;
  renderFootballSelection();
  renderFootball();
}

function deseleccionarTodosFootball() {
  footballSelectedIndexes.clear();
  footballDetailData = null;
  renderFootballSelection();
  renderFootball();
}

function getSingleSelectedFootballMatch() {
  const selected = getSelectedFootballMatches();
  return selected.length === 1 ? selected[0] : null;
}

function footballDetailPanelRefresh() {
  const panel = document.getElementById('footballDetailPanel');
  if (panel) panel.hidden = !footballData.partidos.length;
}

function generarPromptFootballDetalle(showToast = true) {
  const match = getSingleSelectedFootballMatch();
  if (!match) return toast('Seleccioná exactamente un partido para pedir el detalle');
  const fecha = document.getElementById('footballFecha')?.value || footballData.fecha;
  const prompt = `Buscá en internet información REAL, actualizada y verificable sobre este partido de fútbol del ${fecha}: ${match.local} vs ${match.visitante}, ${match.competicion}, horario ${match.hora}. Consultá fuentes deportivas confiables y priorizá fuentes oficiales de la competencia o los clubes.

Respondé SOLO JSON válido, sin markdown ni explicaciones. No inventes datos: si un dato no está confirmado, devolvé una cadena vacía, una lista vacía o null según corresponda.

{
  "fecha": "${footballData.fecha}",
  "partido": {
    "hora": "${match.hora}",
    "competicion": "${match.competicion}",
    "local": "${match.local}",
    "escudoLocal": "${match.escudoLocal || footballAssetKeyFromName(match.local)}",
    "visitante": "${match.visitante}",
    "escudoVisitante": "${match.escudoVisitante || footballAssetKeyFromName(match.visitante)}",
    "estadio": "",
    "arbitro": { "principal": "", "asistentes": [], "cuartoArbitro": "", "var": "" },
    "probablesFormaciones": {
      "local": { "formacion": "", "jugadores": [] },
      "visitante": { "formacion": "", "jugadores": [] }
    },
    "claves": [],
    "fuentesDetalle": []
  }
}

Reglas: informar estadio, árbitro y probables formaciones solo si están confirmados o publicados por fuentes confiables; distinguir probable de confirmado; usar nombres completos; mantener horario de Argentina; no completar con suposiciones.`;
  const field = document.getElementById('footballDetailPrompt');
  if (field) field.value = prompt;
  if (showToast) toast('✅ Prompt detallado generado');
}

function normalizarFootballDetalle(input) {
  const raw = input && typeof input === 'object' ? input : {};
  const p = raw.partido && typeof raw.partido === 'object' ? raw.partido : raw;
  const formaciones = p.probablesFormaciones && typeof p.probablesFormaciones === 'object' ? p.probablesFormaciones : {};
  return {
    ...p,
    estadio: String(p.estadio || '').trim(),
    arbitro: {
      principal: String(p.arbitro?.principal || '').trim(),
      asistentes: Array.isArray(p.arbitro?.asistentes) ? p.arbitro.asistentes.map(String) : [],
      cuartoArbitro: String(p.arbitro?.cuartoArbitro || '').trim(),
      var: String(p.arbitro?.var || '').trim()
    },
    probablesFormaciones: {
      local: {
        formacion: String(formaciones.local?.formacion || '').trim(),
        jugadores: Array.isArray(formaciones.local?.jugadores) ? formaciones.local.jugadores.map(String) : []
      },
      visitante: {
        formacion: String(formaciones.visitante?.formacion || '').trim(),
        jugadores: Array.isArray(formaciones.visitante?.jugadores) ? formaciones.visitante.jugadores.map(String) : []
      }
    },
    claves: Array.isArray(p.claves) ? p.claves.map(String) : [],
    fuentesDetalle: Array.isArray(p.fuentesDetalle) ? p.fuentesDetalle.map(String) : []
  };
}

function cargarJSONFootballDetalle() {
  if (!getSingleSelectedFootballMatch()) return toast('Seleccioná exactamente un partido antes de cargar el detalle');
  const field = document.getElementById('footballDetailJson');
  const text = (field?.value || '').trim();
  if (!text) return toast('Pegá el JSON detallado en el cuadro de entrada');
  try {
    footballDetailData = {
      ...getSingleSelectedFootballMatch(),
      ...normalizarFootballDetalle(JSON.parse(text))
    };
  } catch (error) {
    return toast('JSON detallado inválido: ' + error.message);
  }
  renderFootball();
  toast('✅ Detalle cargado en la placa');
}

function copiarPromptFootballDetalle() {
  VS_Utils.copiarAlPortapapeles(document.getElementById('footballDetailPrompt')?.value, '✅ Prompt detallado copiado');
}

function limpiarFootballDetalle() {
  footballDetailData = null;
  const prompt = document.getElementById('footballDetailPrompt');
  const json = document.getElementById('footballDetailJson');
  if (prompt) prompt.value = '';
  if (json) json.value = '';
  renderFootball();
}

function footballDisplayName(value) {
  const raw = String(value || '').trim();
  const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const aliases = {
    'sarmiento de junin': 'Sarmiento (J)',
    'sarmiento (j)': 'Sarmiento (J)',
    'gimnasia y esgrima (mendoza)': 'Gimnasia (Mza.)',
    'gimnasia y esgrima (mza.)': 'Gimnasia (Mza.)',
    'gimnasia y esgrima (mza)': 'Gimnasia (Mza.)',
    'gimnasia de mendoza': 'Gimnasia (Mza.)',
    'gimnasia (mza.)': 'Gimnasia (Mza.)',
    'nacional de uruguay': 'Nacional (URU)',
    'nacional (uru)': 'Nacional (URU)',
    'argentinos juniors': 'Argentinos Jrs.',
    'argentinos jrs.': 'Argentinos Jrs.',
    'estudiantes de rio cuarto': 'Estudiantes (RC)',
    'estudiantes (rio cuarto)': 'Estudiantes (RC)',
    'universidad central de venezuela': 'UCV',
    'universidad central de venezuela fc': 'UCV',
    'ucv': 'UCV',
    'santos fc': 'Santos',
    'santos-fc': 'Santos',
    'santos futebol clube': 'Santos'
  };
  return aliases[normalized] || raw;
}

function drawFootballTeamName(ctx, value, centerX, baselineY, maxWidth, dark) {
  const label = footballDisplayName(value);
  const words = label.split(/\s+/);
  let fontSize = Math.max(14, Math.round(Math.min(maxWidth, 240) * 0.105));
  const minFont = Math.max(11, Math.round(fontSize * 0.72));
  const family = '"Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
  ctx.font = `700 ${fontSize}px ${family}`;
  while (ctx.measureText(label).width > maxWidth && fontSize > minFont) {
    fontSize -= 1;
    ctx.font = `700 ${fontSize}px ${family}`;
  }
  if (ctx.measureText(label).width <= maxWidth) {
    ctx.fillText(label, centerX, baselineY);
  } else {
    const lines = [];
    let line = '';
    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    const visible = lines.slice(0, 2);
    const lineHeight = fontSize * 1.08;
    const firstY = baselineY - (visible.length - 1) * lineHeight * .5;
    visible.forEach((text, i) => ctx.fillText(text, centerX, firstY + i * lineHeight));
  }
  ctx.textAlign = 'left';
}

function footballCompetitionKey(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('libertadores')) return 'copa-libertadores';
  if (raw.includes('copa argentina')) return 'copa-argentina';
  if (raw.includes('sudamericana')) return 'copa-sudamericana';
  if (raw.includes('liga') || raw.includes('clausura') || raw.includes('profesional')) return 'liga-profesional';
  return footballAssetKeyFromName(value);
}

function esCompeticionFootballPermitida(value) {
  const competition = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const countryLeague = /(paraguay|brasil|brazil|uruguay|chile|colombia|peru|ecuador|bolivia|venezuela|mexico|usa|espana|italia|inglaterra|alemania)/;
  if (countryLeague.test(competition)) return false;
  return /(liga profesional|torneo clausura|torneo apertura|copa argentina|primera division argentina|copa libertadores|libertadores|copa sudamericana|sudamericana|recopa sudamericana)/.test(competition);
}

function footballAssetUrl(type, key, ext) {
  if (!key) return '';
  return `../assets/futbol/${type}/${key}.${ext || 'png'}`;
}

function loadFootballAsset(type, key) {
  const cacheKey = `${type}:${key}`;
  if (!key) return Promise.resolve(null);
  if (footballAssets.has(cacheKey)) return footballAssets.get(cacheKey);
  const extensions = type === 'competencias' && ['copa-sudamericana', 'copa-libertadores', 'copa-argentina'].includes(key)
    ? ['svg', 'png']
    : ['png'];
  const promise = new Promise(resolve => {
    const tryLoad = index => {
      if (index >= extensions.length) return resolve(null);
      const img = new Image();
      img.onload = () => { footballAssetImages.set(cacheKey, img); resolve(img); };
      img.onerror = () => tryLoad(index + 1);
      img.src = footballAssetUrl(type, key, extensions[index]);
    };
    tryLoad(0);
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
    if (p.competicion && !esCompeticionFootballPermitida(p.competicion)) {
      errores.push(`Partido ${i + 1}: competencia fuera del alcance (${p.competicion})`);
    }
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

function footballPromptConfig(alcance, tipo) {
  const scope = String(alcance || 'Argentina y CONMEBOL');
  const kind = String(tipo || 'partidos del día');
  const config = {
    scopeText: 'INCLUIR Liga Profesional, Copa Argentina y torneos CONMEBOL de clubes: Libertadores, Sudamericana y Recopa',
    jsonScope: 'Argentina: Liga Profesional + Copa Argentina + torneos CONMEBOL de clubes',
    subtitle: 'Argentina y CONMEBOL',
    competitionRule: 'incluir todas las competiciones permitidas encontradas',
    typeRule: 'listar los partidos programados, en vivo o finalizados de ese día'
  };
  if (scope === 'Fútbol argentino') {
    config.scopeText = 'INCLUIR SOLO Liga Profesional, Torneo Apertura/Clausura y Copa Argentina; EXCLUIR Libertadores, Sudamericana, Recopa y toda competencia extranjera';
    config.jsonScope = 'Argentina: Liga Profesional + Copa Argentina';
    config.subtitle = 'Fútbol argentino';
    config.competitionRule = 'incluir solo Liga Profesional, Torneo Apertura/Clausura y Copa Argentina';
  } else if (scope === 'Competiciones CONMEBOL') {
    config.scopeText = 'INCLUIR SOLO torneos CONMEBOL de clubes: Libertadores, Sudamericana y Recopa; EXCLUIR Liga Profesional, Copa Argentina y ligas nacionales';
    config.jsonScope = 'Torneos CONMEBOL de clubes';
    config.subtitle = 'CONMEBOL';
    config.competitionRule = 'incluir solo Libertadores, Sudamericana y Recopa';
  } else if (scope === 'Internacional') {
    config.scopeText = 'INCLUIR torneos internacionales de clubes, priorizando CONMEBOL; EXCLUIR ligas nacionales extranjeras salvo que sean necesarias para completar la agenda';
    config.jsonScope = 'Fútbol internacional de clubes';
    config.subtitle = 'Fútbol internacional';
    config.competitionRule = 'incluir las competiciones internacionales encontradas, sin ligas nacionales extranjeras';
  }
  if (kind === 'resultados de la jornada') config.typeRule = 'priorizar partidos finalizados y completar el resultado; incluir también los que sigan en vivo o estén programados';
  if (kind === 'partido destacado') config.typeRule = 'incluir los partidos del día y marcar como destacado el cruce de mayor relevancia, sin inventar prioridades';
  if (kind === 'agenda del torneo') config.typeRule = 'listar la agenda programada del torneo para ese día, agrupada por competencia';
  return config;
}

function generarPromptFootball(showToast = true) {
  const fecha = document.getElementById('footballFecha')?.value || '';
  const alcanceBase = document.getElementById('footballAlcance')?.value || 'Argentina y CONMEBOL';
  const tipo = document.getElementById('footballTipo')?.value || 'partidos del día';
  const config = footballPromptConfig(alcanceBase, tipo);
  const alcance = `${alcanceBase}. ${config.scopeText}. EXCLUIR ligas nacionales extranjeras: Liga Paraguaya, Brasileirao, Liga Uruguaya, Liga Chilena, Liga Colombiana, Liga Peruana, Liga Ecuatoriana, Liga Boliviana y Liga Venezolana`;
  const extra = document.getElementById('footballTema')?.value?.trim() || '';
  if (!fecha) return toast('Seleccioná una fecha para generar el prompt');

  const prompt = `Buscá en internet información REAL y actualizada sobre ${tipo} del ${footballDateLabel(fecha)}. Alcance: ${alcance}. ${config.typeRule}. ${extra}

Verificá cada partido en fuentes confiables. No inventes partidos, horarios, competencias ni resultados. Si no encontrás datos suficientes, devolvé únicamente los partidos confirmados y aclaralo en el campo "fuente".

Respondé SOLO JSON válido, sin markdown ni explicaciones, con esta estructura exacta:
{
  "fecha": "${footballDateLabel(fecha)}",
  "alcance": "${config.jsonScope}",
  "titulo": "Partidos de hoy",
  "subtitulo": "${config.subtitle}",
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

Reglas: usar horario de Argentina; ${config.competitionRule}; ${config.typeRule}; incluir todas las competiciones sin duplicados; estado permitido: programado, en vivo, finalizado, suspendido o cancelado; si es un resultado, completar "resultado"; no rellenar con suposiciones. Para los campos de recursos usar únicamente claves simples y canónicas, no URLs. Ejemplos obligatorios: Gimnasia y Esgrima (Mendoza) = gimnasia-y-esgrima; Racing Club = racing-club; Estudiantes de Río Cuarto = estudiantes-de-rio-cuarto; Santos FC = santos; Universidad Central de Venezuela = universidad-central-venezuela; Nacional de Uruguay = nacional-uru; Liga Profesional = liga-profesional; Copa Argentina = copa-argentina; Copa Libertadores = copa-libertadores; Copa Sudamericana = copa-sudamericana. No usar variantes como gimnasia-mendoza, racing, estudiantes-rio-cuarto o nombres largos.`;
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
  footballSelectedIndexes = new Set(footballData.partidos.map((_, index) => index));
  footballDetailData = null;
  renderFootballSelection();
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

function footballDesignPreset(alcance, tipo) {
  const scope = String(alcance || 'Argentina y CONMEBOL');
  const kind = String(tipo || 'partidos del día');
  const preset = {
    accent: '#a6ce39',
    fieldTop: '#1b5c39',
    fieldMid: '#247047',
    fieldBottom: '#15482f',
    lineAlpha: 0.06,
    cardFill: 'rgba(250,253,248,.97)',
    cardStroke: 'rgba(22,32,27,.18)',
    resultColor: '#5d6b63'
  };
  if (scope === 'Fútbol argentino') {
    Object.assign(preset, { accent: '#59c4d5', fieldTop: '#174f3a', fieldMid: '#216b49', fieldBottom: '#123d31', lineAlpha: 0.055 });
  } else if (scope === 'Competiciones CONMEBOL') {
    Object.assign(preset, { accent: '#52c7d8', fieldTop: '#102f42', fieldMid: '#164b57', fieldBottom: '#0b2836', lineAlpha: 0.045, cardFill: 'rgba(246,251,250,.97)' });
  } else if (scope === 'Internacional') {
    Object.assign(preset, { accent: '#d8b34a', fieldTop: '#192b3c', fieldMid: '#29455a', fieldBottom: '#111f2e', lineAlpha: 0.04, cardFill: 'rgba(248,250,252,.97)' });
  }
  if (kind === 'resultados de la jornada') preset.resultColor = preset.accent;
  if (kind === 'partido destacado') preset.cardFill = 'rgba(255,255,255,.99)';
  if (kind === 'agenda del torneo') preset.cardFill = 'rgba(244,249,243,.94)';
  return { ...preset, tipo: kind };
}

function actualizarConfiguracionFootball() {
  renderFootball();
  if (document.getElementById('footballFecha')?.value) generarPromptFootball(false);
}

function dibujarFondoCanchaFootball(ctx, W, H, dark, design) {
  const style = design || footballDesignPreset();
  const field = ctx.createLinearGradient(0, 0, 0, H);
  field.addColorStop(0, dark ? '#0b2b20' : style.fieldTop);
  field.addColorStop(0.48, dark ? '#0d3828' : style.fieldMid);
  field.addColorStop(1, dark ? '#061c15' : style.fieldBottom);
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, W, H);

  const stripeW = W / 12;
  for (let i = 0; i < 12; i += 1) {
    if (i % 2 === 0) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,.014)' : 'rgba(255,255,255,.022)';
      ctx.fillRect(i * stripeW, 0, stripeW, H);
    }
  }

  ctx.save();
  ctx.strokeStyle = dark ? 'rgba(255,255,255,.045)' : `rgba(255,255,255,${style.lineAlpha})`;
  ctx.lineWidth = Math.max(2, W * 0.0022);
  const left = W * 0.055, right = W * 0.945, top = H * 0.19, bottom = H * 0.91;
  const midY = (top + bottom) / 2;
  ctx.beginPath();
  ctx.moveTo(left, midY); ctx.lineTo(right, midY);
  ctx.moveTo(W / 2, top); ctx.lineTo(W / 2, bottom);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, midY, Math.min(W, H) * 0.105, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(W * 0.055, midY - H * 0.14, W * 0.12, H * 0.28);
  ctx.strokeRect(W * 0.825, midY - H * 0.14, W * 0.12, H * 0.28);
  ctx.restore();

  const veil = ctx.createLinearGradient(0, 0, 0, H);
  veil.addColorStop(0, 'rgba(0,0,0,.16)');
  veil.addColorStop(0.25, 'rgba(0,0,0,.015)');
  veil.addColorStop(0.78, 'rgba(0,0,0,.015)');
  veil.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, W, H);
}

function drawFootballDetailBody(ctx, W, H, bodyTop, dark, design) {
  const p = footballDetailData || {};
  const M = W * 0.055;
  const narrow = W / H < 1.2;
  const heroY = bodyTop + H * 0.075;
  const heroH = narrow ? H * 0.235 : H * 0.28;
  const fill = dark ? 'rgba(255,255,255,.1)' : design.cardFill;
  ctx.fillStyle = fill;
  ctx.strokeStyle = dark ? 'rgba(166,206,57,.55)' : design.accent;
  ctx.lineWidth = Math.max(2, W * 0.0015);
  ctx.beginPath(); ctx.roundRect(M, heroY, W - M * 2, heroH, Math.min(20, W * .025)); ctx.fill(); ctx.stroke();

  const badgeSize = Math.min(W * (narrow ? .2 : .13), heroH * .42);
  drawFootballBadge(ctx, footballAssetKeyFromName(p.escudoLocal || p.local), p.local, M + W * .1, heroY + heroH * .22, badgeSize, dark);
  drawFootballBadge(ctx, footballAssetKeyFromName(p.escudoVisitante || p.visitante), p.visitante, W - M - W * .1 - badgeSize, heroY + heroH * .22, badgeSize, dark);
  ctx.fillStyle = design.accent;
  ctx.font = `700 ${Math.max(18, Math.round(Math.min(W, H) * .028))}px "Inter", sans-serif`;
  ctx.textAlign = 'center'; ctx.fillText(p.hora || 'A confirmar', W / 2, heroY + heroH * .24);
  ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
  ctx.font = `700 ${Math.max(17, Math.round(Math.min(W, H) * .022))}px "Inter", sans-serif`;
  ctx.fillText(footballDisplayName(p.local), M + W * .2, heroY + heroH * .78);
  ctx.fillText(footballDisplayName(p.visitante), W - M - W * .2, heroY + heroH * .78);
  ctx.fillStyle = dark ? 'rgba(255,255,255,.7)' : VS_Colors.INK2;
  ctx.font = `600 ${Math.max(11, Math.round(Math.min(W, H) * .012))}px "Inter", sans-serif`;
  ctx.fillText(p.competicion || 'Partido destacado', W / 2, heroY + heroH * .48);
  ctx.font = `500 ${Math.max(11, Math.round(Math.min(W, H) * .011))}px "Inter", sans-serif`;
  ctx.fillText('vs', W / 2, heroY + heroH * .75);

  const infoY = heroY + heroH + H * .035;
  ctx.textAlign = 'left';
  ctx.fillStyle = dark ? 'rgba(255,255,255,.82)' : '#eef7eb';
  ctx.font = `600 ${Math.max(12, Math.round(Math.min(W, H) * .014))}px "Inter", sans-serif`;
  const referee = p.arbitro?.principal || 'No informado';
  ctx.fillText(`Estadio: ${p.estadio || 'No informado'}`, M, infoY);
  ctx.fillText(`Árbitro: ${referee}`, M, infoY + H * .027);
  if (p.arbitro?.var) ctx.fillText(`VAR: ${p.arbitro.var}`, M, infoY + H * .054);

  const lineY = infoY + H * .095;
  // Las formaciones son dos tarjetas hermanas: una debajo de cada escudo.
  // Mantenerlas en dos columnas evita que la segunda se vaya fuera del lienzo
  // en formatos cuadrados o verticales.
  const cols = 2;
  const colW = (W - M * 2 - W * .025) / cols;
  const lineups = [
    { title: footballDisplayName(p.local), data: p.probablesFormaciones?.local || {} },
    { title: footballDisplayName(p.visitante), data: p.probablesFormaciones?.visitante || {} }
  ];
  const maxPlayers = Math.max(...lineups.map(lineup => (lineup.data.jugadores || []).length), 0);
  const lineupCardH = maxPlayers ? Math.min(H * .245, Math.max(H * .18, H * (.09 + maxPlayers * .014))) : H * .115;
  lineups.forEach((lineup, index) => {
    const x = M + (index % cols) * (colW + W * .025);
    const y = lineY;
    ctx.fillStyle = dark ? 'rgba(255,255,255,.1)' : 'rgba(250,253,248,.96)';
    ctx.strokeStyle = dark ? 'rgba(166,206,57,.4)' : 'rgba(22,32,27,.15)';
    ctx.beginPath(); ctx.roundRect(x, y, colW, lineupCardH, Math.min(14, colW * .025)); ctx.fill(); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, colW, lineupCardH, Math.min(14, colW * .025)); ctx.clip();
    ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.max(12, Math.round(Math.min(W, H) * .014))}px "Inter", sans-serif`;
    ctx.fillText(lineup.title, x + colW / 2, y + H * .038);
    ctx.fillStyle = design.accent;
    ctx.font = `700 ${Math.max(11, Math.round(Math.min(W, H) * .012))}px "Inter", sans-serif`;
    ctx.fillText(lineup.data.formacion ? `Formación ${lineup.data.formacion}` : 'Formación no informada', x + colW / 2, y + H * .068);
    const players = (lineup.data.jugadores || []).slice(0, 11);
    if (players.length) {
      const playerCols = colW >= W * .28 ? 2 : 1;
      const playersPerCol = Math.ceil(players.length / playerCols);
      const playerAreaH = lineupCardH - H * .082;
      const playerLineH = Math.min(H * .023, playerAreaH / playersPerCol);
      const playerColW = colW / playerCols;
      ctx.fillStyle = dark ? 'rgba(255,255,255,.82)' : VS_Colors.INK2;
      ctx.font = `500 ${Math.max(11, Math.round(Math.min(W, H) * .012))}px "Inter", sans-serif`;
      players.forEach((player, playerIndex) => {
        const label = `${playerIndex + 1}. ${player}`;
        const col = Math.floor(playerIndex / playersPerCol);
        const row = playerIndex % playersPerCol;
        const textX = x + col * playerColW + playerColW / 2;
        const lines = VS_Utils.wrapText(ctx, label, playerColW * .86, 1);
        ctx.fillText(lines[0] || label, textX, y + H * .094 + row * playerLineH);
      });
    } else {
      ctx.fillStyle = dark ? 'rgba(255,255,255,.6)' : VS_Colors.INK2;
      ctx.font = `500 ${Math.max(10, Math.round(Math.min(W, H) * .0105))}px "Inter", sans-serif`;
      ctx.fillText('Sin jugadores informados', x + colW / 2, y + H * .103);
    }
    ctx.restore();
  });
  ctx.textAlign = 'left';
}

function dibujarFootballCanvas(ctx, W, H) {
  const d = footballData;
  const format = VS_Formats[footballFormat] || VS_Formats.landscape;
  const headerH = Math.round(H * 0.18);
  const dark = footballFormat === 'story';
  const alcance = document.getElementById('footballAlcance')?.value || 'Argentina y CONMEBOL';
  const tipo = document.getElementById('footballTipo')?.value || 'partidos del día';
  const design = footballDesignPreset(alcance, tipo);
  const partidos = getSelectedFootballMatches();
  dibujarFondoCanchaFootball(ctx, W, H, dark, design);
  VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'FÚTBOL', d.titulo || 'Partidos de hoy', headerH, { accent: design.accent });

  const M = W * 0.055;
  const bodyTop = headerH + H * 0.055;
  ctx.fillStyle = dark ? '#fff' : '#f2f7ed';
  ctx.font = `700 ${Math.max(22, Math.round(Math.min(W, H) * 0.026))}px "Inter", sans-serif`;
  ctx.fillText(d.fecha || 'Fecha sin especificar', M, bodyTop);
  if (d.subtitulo) {
    ctx.fillStyle = dark ? 'rgba(255,255,255,.7)' : 'rgba(239,247,234,.82)';
    ctx.font = `500 ${Math.max(15, Math.round(Math.min(W, H) * 0.017))}px "Inter", sans-serif`;
    ctx.fillText(d.subtitulo, M, bodyTop + H * 0.035);
  }
  if (footballDetailData) {
    drawFootballDetailBody(ctx, W, H, bodyTop, dark, design);
    VS_CanvasHelpers.drawFooter(ctx, W, H, dark, { onField: !dark });
    VS_CanvasHelpers.drawPlateLogo(ctx, W, H);
    return;
  }

  const columns = format.cssAR === '9 / 16' ? 1 : 2;
  const gap = W * 0.025;
  const cardW = (W - M * 2 - gap * (columns - 1)) / columns;
  const cardH = Math.min(H * 0.17, Math.max(110, (H - bodyTop - H * 0.16) / Math.ceil(Math.max(partidos.length, 1) / columns) - H * 0.02));
  const startY = bodyTop + H * 0.075;
  partidos.forEach((p, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = M + col * (cardW + gap);
    const y = startY + row * (cardH + H * 0.02);
    const destacado = tipo === 'partido destacado' && (p.destacado || i === 0);
    ctx.fillStyle = dark ? 'rgba(255,255,255,.1)' : (destacado ? 'rgba(255,255,255,.99)' : design.cardFill);
    ctx.strokeStyle = dark ? 'rgba(166,206,57,.55)' : (destacado ? design.accent : design.cardStroke);
    ctx.lineWidth = Math.max(2, W * 0.0012);
    ctx.beginPath(); ctx.roundRect(x, y, cardW, cardH, Math.min(18, cardW * .025)); ctx.fill(); ctx.stroke();
    ctx.fillStyle = design.accent;
    ctx.font = `700 ${Math.max(18, Math.round(Math.min(W, H) * 0.022))}px "Inter", sans-serif`;
    ctx.fillText(p.hora, x + cardW * .045, y + cardH * .25);
    const localKey = footballAssetKeyForMatch(p, 'local');
    const visitanteKey = footballAssetKeyForMatch(p, 'visitante');
    const badgeSize = Math.min(cardW * .18, cardH * .38);
    drawFootballBadge(ctx, localKey, p.local, x + cardW * .08, y + cardH * .34, badgeSize, dark);
    drawFootballBadge(ctx, visitanteKey, p.visitante, x + cardW * .74, y + cardH * .34, badgeSize, dark);
    const competitionKey = p.logoCompetencia || footballCompetitionKey(p.competicion);
    const competitionImg = getFootballImage('competencias', competitionKey);
    if (competitionImg) {
      drawFootballImageContain(
        ctx,
        competitionImg,
        x + cardW * .72,
        y + cardH * .025,
        cardW * .24,
        cardH * .27
      );
    }
    ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
    const mid = x + cardW * .5;
    drawFootballTeamName(ctx, p.local, x + cardW * .25, y + cardH * .82, cardW * .40, dark);
    ctx.fillStyle = dark ? 'rgba(255,255,255,.65)' : design.resultColor;
    ctx.font = `500 ${Math.max(12, Math.round(Math.min(W, H) * 0.014))}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(p.resultado || 'vs', mid, y + cardH * .58);
    drawFootballTeamName(ctx, p.visitante, x + cardW * .75, y + cardH * .82, cardW * .40, dark);
    ctx.textAlign = 'left';
    ctx.fillStyle = dark ? 'rgba(255,255,255,.58)' : VS_Colors.INK2;
    ctx.font = `600 ${Math.max(10, Math.round(Math.min(W, H) * 0.011))}px "Inter", sans-serif`;
    ctx.fillText(`${p.competicion}${p.estado ? ' · ' + p.estado : ''}`, x + cardW * .045, y + cardH * .12);
  });
  if (!partidos.length) {
    ctx.fillStyle = 'rgba(239,247,234,.86)';
    ctx.font = `600 ${Math.max(16, Math.round(Math.min(W, H) * 0.018))}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Seleccioná al menos un partido para generar la placa', W / 2, bodyTop + H * 0.19);
    ctx.textAlign = 'left';
  }
  if (d.fuente) {
    ctx.fillStyle = dark ? 'rgba(255,255,255,.5)' : 'rgba(239,247,234,.78)';
    ctx.font = `500 ${Math.max(10, Math.round(Math.min(W, H) * 0.01))}px "Inter", sans-serif`;
    ctx.fillText('Fuente: ' + d.fuente, M, H - H * 0.07);
  }
  VS_CanvasHelpers.drawFooter(ctx, W, H, dark, { onField: !dark });
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
  const selectedData = footballDetailData
    ? { ...footballData, partidos: [footballDetailData] }
    : getSelectedFootballData();
  preloadFootballAssets(selectedData).then(() => {
    if (token === footballRenderToken) dibujarFootballCanvas(canvas.getContext('2d'), format.w, format.h);
  });
  const count = document.getElementById('footballCount');
  if (count) count.textContent = `${getSelectedFootballMatches().length} de ${footballData.partidos.length} partidos`;
}

async function exportarFootball() {
  const format = VS_Formats[footballFormat] || VS_Formats.landscape;
  const exportData = footballDetailData
    ? { ...footballData, partidos: [footballDetailData] }
    : getSelectedFootballData();
  await preloadFootballAssets(exportData);
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
  footballSelectedIndexes.clear();
  footballDetailData = null;
  const json = document.getElementById('footballJson');
  if (json) json.value = '';
  renderFootballSelection();
  renderFootball();
}

if (typeof window !== 'undefined') {
  window.normalizarFootballJSON = normalizarFootballJSON;
  window.validarFootballData = validarFootballData;
  window.esCompeticionFootballPermitida = esCompeticionFootballPermitida;
  window.footballAssetKeyFromName = footballAssetKeyFromName;
  window.footballDisplayName = footballDisplayName;
  window.esEquipoFootballArgentino = esEquipoFootballArgentino;
  window.seleccionarTodosFootball = seleccionarTodosFootball;
  window.seleccionarArgentinosFootball = seleccionarArgentinosFootball;
  window.deseleccionarTodosFootball = deseleccionarTodosFootball;
  window.actualizarSeleccionFootball = actualizarSeleccionFootball;
  window.generarPromptFootballDetalle = generarPromptFootballDetalle;
  window.normalizarFootballDetalle = normalizarFootballDetalle;
  window.cargarJSONFootballDetalle = cargarJSONFootballDetalle;
  window.copiarPromptFootballDetalle = copiarPromptFootballDetalle;
  window.limpiarFootballDetalle = limpiarFootballDetalle;
  window.initFootball = initFootball;
  window.generarPromptFootball = generarPromptFootball;
  window.copiarPromptFootball = copiarPromptFootball;
  window.cargarJSONFootball = cargarJSONFootball;
  window.cargarArchivoJSONFootball = cargarArchivoJSONFootball;
  window.cambiarFormatoFootball = cambiarFormatoFootball;
  window.actualizarConfiguracionFootball = actualizarConfiguracionFootball;
  window.exportarFootball = exportarFootball;
  window.limpiarFootball = limpiarFootball;
}

if (typeof module !== 'undefined') module.exports = { normalizarFootballJSON, validarFootballData, footballAssetKeyFromName, footballDisplayName, esCompeticionFootballPermitida, footballDesignPreset, footballPromptConfig, esEquipoFootballArgentino, normalizarFootballDetalle };
