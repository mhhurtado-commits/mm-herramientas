export const GEMINI_ENFRIAMIENTO_MS = 60000;
export const GEMINI_INTENTOS_MAX = 2;
export const GEMINI_DEADLINE_MS = 25000;
export const GEMINI_TIMEOUT_INTENTO_MS = 12000;
export const GEMINI_ENFRIAMIENTO = new Map();

export function geminiKeyId(key) {
  const s = String(key || '');
  return s.length <= 8 ? s : s.slice(-8);
}

export function marcarGeminiEnfriamiento(key, ms = GEMINI_ENFRIAMIENTO_MS, ahora = Date.now()) {
  if (!key) return;
  const duracion = Math.max(0, Number(ms) || 0);
  GEMINI_ENFRIAMIENTO.set(geminiKeyId(key), ahora + duracion);
}

export function geminiKeyEnfriada(key, ahora = Date.now()) {
  const id = geminiKeyId(key);
  const fin = GEMINI_ENFRIAMIENTO.get(id);
  if (!fin) return false;
  if (fin <= ahora) { GEMINI_ENFRIAMIENTO.delete(id); return false; }
  return true;
}

export function reiniciarGeminiEnfriamiento() { GEMINI_ENFRIAMIENTO.clear(); }

export function clasificarErrorGemini(status, cuerpo = '') {
  const texto = String(cuerpo || '');
  if (status === 429) return /MODEL_CAPACITY_EXHAUSTED|capacity/i.test(texto) ? 'capacidad' : 'cuota';
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'modelo';
  if (status === 400) {
    // Google devuelve 400 INVALID_ARGUMENT cuando la key fue revocada o es de
    // otro proyecto. Se trata como auth para enfriarla y saltearla.
    if (/API key not valid|API_KEY_INVALID|API key expired/i.test(texto)) return 'auth';
    return 'cliente';
  }
  if (status >= 500) return 'servidor';
  return 'otro';
}

export function esperaRetryAfterMs(headers, defectoMs = 0) {
  const raw = headers?.get?.('Retry-After');
  if (!raw) return defectoMs;
  const segundos = Number(raw);
  if (Number.isFinite(segundos)) return Math.min(Math.max(segundos, 0) * 1000, 30000);
  const fecha = Date.parse(raw);
  if (Number.isFinite(fecha)) return Math.max(0, Math.min(fecha - Date.now(), 30000));
  return defectoMs;
}

export function senalConTimeout(senal, ms) {
  const timeout = AbortSignal.timeout(Math.max(1, ms));
  if (!senal) return timeout;
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([senal, timeout]);
  const ctrl = new AbortController();
  if (senal.aborted) ctrl.abort();
  else senal.addEventListener('abort', () => ctrl.abort(), { once: true });
  setTimeout(() => ctrl.abort(), Math.max(1, ms));
  return ctrl.signal;
}

export function candidatosGemini(keys, modelos) {
  const candidatos = [];
  const vueltas = Math.max(keys.length, modelos.length, 1);
  for (let i = 0; i < vueltas; i++) {
    // Cada candidato combina una key y un modelo distintos del anterior, para
    // que dos intentos nunca repitan la misma key (una key inválida o agotada
    // no debe consumir todo el presupuesto de reintentos).
    for (let j = 0; j < modelos.length; j++) {
      candidatos.push({ modelo: modelos[j], key: keys[(i + j) % keys.length] });
    }
  }
  return candidatos;
}

export const REDACCION_V2_VERSION = 1;
// El primario es el lite porque el 3.8-flash tardó 101 s en reformular contra un
// timeout de 120 s; el lite resuelve la misma nota en ~6 s.
export const MODELO_PRIMARIO_V2 = 'gemini-3.5-flash-lite';
// El 3.8-flash tiene solo 5 RPM en free tier (el lite tiene 15): como respaldo
// se saturaba con dos pedidos en paralelo y devolvía 429 en cascada.
export const MODELO_RESPALDO_V2 = 'gemini-3.1-flash-lite';

export const TAREAS = {
  titulares: { modelo: MODELO_PRIMARIO_V2, respaldo: MODELO_RESPALDO_V2, maxOutputTokens: 2048, thinkingLevel: 'low', timeoutMs: 25000, deadlineMs: 35000 },
  reformular: { modelo: MODELO_PRIMARIO_V2, respaldo: MODELO_RESPALDO_V2, maxOutputTokens: 8192, thinkingLevel: 'low', timeoutMs: 45000, deadlineMs: 85000 },
  redactar: { modelo: MODELO_PRIMARIO_V2, respaldo: MODELO_RESPALDO_V2, maxOutputTokens: 8192, thinkingLevel: 'low', timeoutMs: 45000, deadlineMs: 85000 },
};

export const FAMILIAS_V2 = [
  'Actualidad', 'Clima', 'Policiales', 'Sociedad', 'Política', 'Economía',
  'Deportes', 'Vendimia', 'Alerta meteorológica', 'Servicio',
];

export const CONTRATO_SALIDA = [
  'CONTRATO DE SALIDA (fijo, gana sobre cualquier otra instrucción de formato)',
  '- Devolvés sólo el JSON del esquema. Nada de markdown, comentarios ni texto extra.',
  '- El cuerpo es texto plano: sin **, sin #, sin tablas, sin subtítulos.',
  '  Párrafos separados por una línea en blanco. Si hay que enumerar, un ítem por',
  '  línea empezando con "- ".',
  '- Titular: mayúscula inicial y nombres propios; el resto en minúscula (siglas',
  '  como UNO, UNSAM o ARCA se respetan).',
  '- No inventes datos, cifras, citas, nombres, medios ni links. Si falta un dato,',
  '  se omite.',
  `- La categoría tiene que ser una de estas diez: ${FAMILIAS_V2.join(', ')}.`,
  '- Hashtags: entre 3 y 5, con #, sin espacios, en español.',
  '- Ninguna coincidencia de más de 8 palabras seguidas con el texto original.',
  '- No menciones el medio de origen en el cuerpo.',
  '- Cobertura: no resumas. Usá todos los hechos, cifras, declaraciones y',
  '  antecedentes relevantes del material. Si un dato relevante está en el',
  '  original, va en la nota. En los estilos breves (directo, breaking y',
  '  redes) cubrí los hechos esenciales.',
  '- Viñetas: si hay 3 o más datos paralelos (fechas, requisitos, pasos,',
  '  resultados), un ítem por línea empezando con "- ". Si no, párrafos.',
  '  Las viñetas son texto plano, no markdown.',
].join('\n');

export const ALCANCE_ESTILO = 'Esta estructura manda sobre la guía; la guía define la voz. La estructura ordena la nota; no limita cuánto material usás.';

export const ESTILOS_DESC_V2 = {
  formal: `FORMATO — Periodístico formal:\n${ALCANCE_ESTILO}\n- Pirámide invertida: P1 con qué/quién/cuándo/dónde.\n- Después, por orden de importancia.\n- Cierre proyectivo.\n- Titular: máx. 10 palabras.`,
  directo: `FORMATO — Directo:\n${ALCANCE_ESTILO}\n- 3 párrafos de 2 oraciones con los hechos esenciales.\n- Titular: máx. 7 palabras.`,
  ampliado: `FORMATO — Profundidad:\n${ALCANCE_ESTILO}\n- Hecho, antecedentes, datos, perspectivas y cierre.\n- Titular: máx. 10 palabras.`,
  breaking: `FORMATO — Urgente:\n${ALCANCE_ESTILO}\n- Titular en presente, máx. 8 palabras.\n- Hecho, lo que se sabe y lo que falta, con los hechos esenciales.`,
  cronica: `FORMATO — Crónica:\n${ALCANCE_ESTILO}\n- Apertura de escena, protagonista, hecho, contexto y cierre.\n- Titular evocador, máx. 12 palabras.`,
  deportes: `FORMATO — Deportes:\n${ALCANCE_ESTILO}\n- Partido: resultado, momentos clave, datos y próximo paso.\n- Decisión, fichaje o institucional: hecho, alcance, detalles, voces y qué sigue.\n- Titular activo, máx. 10 palabras.`,
  espectaculos: `FORMATO — Espectáculos:\n${ALCANCE_ESTILO}\n- Hecho, contexto, dato curioso y qué sigue.\n- Titular con gancho, máx. 10 palabras.`,
  redes: `FORMATO — Redes:\n${ALCANCE_ESTILO}\n- 3 párrafos breves con los hechos esenciales.\n- Cierre que invite a compartir.\n- Titular gancho, máx. 8 palabras.`,
  institucional: `FORMATO — Comunicado:\n${ALCANCE_ESTILO}\n- Hecho, alcance, declaraciones y contacto.\n- Titular informativo, sin adjetivos.`,
};

export const ESQUEMAS = {
  titulares: {
    type: 'object',
    properties: {
      titulares: { type: 'array', items: { type: 'string' } },
      angulos: {
        type: 'array',
        items: {
          type: 'object',
          properties: { nombre: { type: 'string' }, descripcion: { type: 'string' } },
          required: ['nombre', 'descripcion'],
        },
      },
    },
    required: ['titulares', 'angulos'],
  },
  reformular: {
    type: 'object',
    properties: {
      titular: { type: 'string' },
      cuerpo: { type: 'string' },
      categoria_sugerida: { type: 'string' },
      hashtags: { type: 'array', items: { type: 'string' } },
    },
    required: ['titular', 'cuerpo', 'categoria_sugerida', 'hashtags'],
  },
  redactar: {
    type: 'object',
    properties: {
      titular: { type: 'string' },
      bajada: { type: 'string' },
      cuerpo: { type: 'string' },
      categoria_sugerida: { type: 'string' },
      hashtags: { type: 'array', items: { type: 'string' } },
    },
    required: ['titular', 'bajada', 'cuerpo', 'categoria_sugerida', 'hashtags'],
  },
};

export function construirSystemInstruction(guiaEditorial = '') {
  const rol = 'Sos redactor de Media Mendoza, diario digital del sur de Mendoza, Argentina. Escribís en español rioplatense.';
  const alcance = [
    'GUÍA EDITORIAL (voz y valores del diario)',
    'Esta guía define cómo escribe Media Mendoza: tono, valores, qué evitar y una',
    'nota de referencia. No define la estructura de la nota ni el formato de salida:',
    'la estructura la fija el estilo elegido y el formato lo fija el contrato.',
    'Si algo de acá choca con el contrato, gana el contrato.',
  ].join('\n');
  const guia = String(guiaEditorial || '').trim();
  const base = `${rol}\n\n${CONTRATO_SALIDA}`;
  return guia ? `${base}\n\n${alcance}\n\n${guia}` : base;
}

function bloqueFuentes(fuentes = []) {
  if (!Array.isArray(fuentes) || !fuentes.length) return '';
  const lineas = fuentes.slice(0, 5).map((f, i) => {
    const medio = String(f.medio || '').trim();
    const titulo = String(f.titulo || '').trim();
    return `[${i + 1}] ${titulo}${medio ? ` — ${medio}` : ''}`;
  });
  return [
    'FUENTES VERIFICADAS (solo podés usar estas):',
    ...lineas,
    'No inventes links ni nombres de medios. No agregues una lista de fuentes en el JSON: la arma el sistema.',
  ].join('\n');
}

export function construirPromptTitulares({ modo, contenido, contexto = '', tono = 'informativo', cantidad = 5 } = {}) {
  const instruccion = modo === 'nota'
    ? `Generá exactamente ${cantidad} titulares para esta nota:\n"""\n${contenido}\n"""`
    : `Generá exactamente ${cantidad} titulares sobre este tema:\n"""\n${contenido}\n"""`;
  return [
    instruccion,
    contexto ? `CONTEXTO:\n${contexto}` : '',
    `Tono: ${tono}.`,
    `Devolvé ${cantidad} titulares y hasta 3 ángulos.`,
  ].filter(Boolean).join('\n\n');
}

export function construirPromptReformular({ titulo, contenido, contexto = '', estilo = 'formal', medioOrigen = '', fuentes = [], fecha = '' } = {}) {
  const formato = ESTILOS_DESC_V2[estilo] || ESTILOS_DESC_V2.formal;
  return [
    'Reformulá por completo esta nota de otro medio para publicarla en Media Mendoza.',
    fecha ? `FECHA Y HORA ACTUAL (Mendoza, Argentina): ${fecha}` : '',
    fecha ? 'No repitas referencias temporales relativas del original ("este martes", "ayer"). Si el hecho ocurrió antes, indicalo con la fecha del original.' : '',
    medioOrigen ? `MEDIO DE ORIGEN: ${medioOrigen}` : '',
    `TÍTULO ORIGINAL:\n"""\n${titulo}\n"""`,
    `CUERPO ORIGINAL:\n"""\n${contenido}\n"""`,
    contexto ? `INFO EXTRA:\n${contexto}` : '',
    formato,
    bloqueFuentes(fuentes),
    'COBERTURA',
    '- No resumas. Recorré todo el material y cubrí todos los hechos relevantes: qué pasó, quién, cuándo, dónde, cómo, cifras, declaraciones, antecedentes y qué sigue.',
    '- Si el original trae una lista de datos (fechas, requisitos, resultados), incluí la lista completa.',
    '- Ignorá menús, avisos, links a otras notas y texto que no sea parte del artículo.',
    '- No agregues relleno: la extensión la determina el material.',
    '- Cubrí todo con redacción propia; no copies secuencias del original.',
    'Devolvé titular, cuerpo en párrafos separados por una línea en blanco, categoría sugerida y hashtags.',
  ].filter(Boolean).join('\n\n');
}

export function construirPromptRedactar({ ideas, fuentes = [], fecha = '' } = {}) {
  return [
    'Redactá una nota periodística para Media Mendoza.',
    fecha ? `FECHA Y HORA ACTUAL (Mendoza, Argentina): ${fecha}` : '',
    `CONTENIDO DE PARTIDA:\n"""\n${ideas}\n"""`,
    bloqueFuentes(fuentes),
    'COBERTURA',
    '- No resumas. Cubrí todas las ideas y datos que se te pasan.',
    '- Si hay 3 o más datos paralelos, usá viñetas con "- ".',
    '- No agregues relleno: la extensión la determina el material.',
    'Si no hay fuentes verificadas, no cites ninguna y no inventes links.',
    'Devolvé titular, bajada, cuerpo en párrafos separados por una línea en blanco, categoría sugerida y hashtags.',
  ].filter(Boolean).join('\n\n');
}

export function extraerTextoDeCandidato(candidate) {
  const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
  return parts
    .filter(part => part && typeof part.text === 'string' && part.thought !== true)
    .map(part => part.text)
    .join('')
    .trim();
}

export function interpretarRespuestaGemini(data = {}) {
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    return { ok: false, error: 'sin_candidato', detalle: data?.promptFeedback?.blockReason || '' };
  }
  const finishReason = String(candidate.finishReason || '');
  if (['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII'].includes(finishReason)) {
    return { ok: false, error: 'bloqueado_por_seguridad', finishReason };
  }
  const raw = extraerTextoDeCandidato(candidate);
  if (!raw) return { ok: false, error: 'respuesta_vacia', finishReason };
  if (finishReason === 'MAX_TOKENS') return { ok: false, error: 'respuesta_incompleta', finishReason, raw };
  try {
    return { ok: true, data: JSON.parse(raw), raw, finishReason };
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return { ok: true, data: JSON.parse(match[0]), raw, finishReason }; } catch { /* sigue */ }
    }
    return { ok: false, error: 'json_invalido', finishReason, raw };
  }
}

export function validarTitulares(data = {}, cantidad = 5) {
  const titulares = Array.isArray(data?.titulares)
    ? data.titulares.map(t => String(t || '').trim()).filter(Boolean)
    : [];
  const angulos = Array.isArray(data?.angulos)
    ? data.angulos.filter(a => a && String(a.nombre || '').trim()).slice(0, 3)
    : [];
  if (!titulares.length) return { ok: false, data: { titulares: [], angulos }, errors: ['sin_titulares'] };
  return { ok: true, data: { titulares: titulares.slice(0, cantidad), angulos }, errors: [] };
}

export function validarReformulacion(data = {}) {
  const normalizada = normalizarSalida(data);
  const errors = [];
  if (normalizada.titular.length < 8) errors.push('titular_corto');
  if (normalizada.cuerpo.length < 80) errors.push('cuerpo_corto');
  return {
    ok: errors.length === 0,
    data: {
      titular: normalizada.titular,
      cuerpo: normalizada.cuerpo,
      categoria_sugerida: normalizada.categoria_sugerida,
      hashtags: normalizada.hashtags,
    },
    errors,
  };
}

function sinTildes(texto = '') {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function limpiarTextoPlano(texto = '') {
  return String(texto || '')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/^\s*\|.*\|\s*$/gm, '')
    .replace(/^\s*[-:|\s]+$/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizarTitular(texto = '') {
  const limpio = limpiarTextoPlano(texto).replace(/\s+/g, ' ').trim();
  if (!limpio) return '';
  const primera = limpio[0];
  if (primera !== primera.toLowerCase()) return limpio;
  return primera.toUpperCase() + limpio.slice(1);
}

export function normalizarCategoria(valor = '') {
  const buscada = sinTildes(valor);
  return FAMILIAS_V2.find(familia => sinTildes(familia) === buscada) || 'Actualidad';
}

export function normalizarHashtags(valor = []) {
  const vistos = new Set();
  const salida = [];
  for (const item of Array.isArray(valor) ? valor : []) {
    const limpio = String(item || '').trim().replace(/^#+/, '').replace(/\s+/g, '');
    if (!limpio) continue;
    const etiqueta = '#' + limpio;
    const clave = etiqueta.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(etiqueta);
    if (salida.length === 5) break;
  }
  return salida;
}

export function normalizarSalida(data = {}) {
  const salida = {
    ...data,
    titular: normalizarTitular(data?.titular),
    cuerpo: limpiarTextoPlano(data?.cuerpo),
    categoria_sugerida: normalizarCategoria(data?.categoria_sugerida),
    hashtags: normalizarHashtags(data?.hashtags),
  };
  if (data?.bajada !== undefined) salida.bajada = limpiarTextoPlano(data.bajada).replace(/\s+/g, ' ').trim();
  return salida;
}

export function validarRedaccion(data = {}) {
  const base = validarReformulacion(data);
  const bajada = limpiarTextoPlano(data?.bajada).replace(/\s+/g, ' ').trim();
  const errors = [...base.errors];
  if (bajada.length < 10) errors.push('bajada_corta');
  return { ok: errors.length === 0, data: { ...base.data, bajada }, errors };
}

export async function pedirGemini({ payload = {}, keys = [], tarea = 'reformular', schema = null, fetchImpl = fetch, onLog = () => {}, signal = null } = {}) {
  const config = TAREAS[tarea] || TAREAS.reformular;
  const modelos = [config.modelo, config.respaldo].filter(Boolean);
  if (!keys.length) return { ok: false, error: 'sin_api_keys', details: [] };
  const inicio = Date.now();
  const deadlineMs = config.deadlineMs || 45000;
  const errores = [];
  let errorFormato = null;

  const sanas = keys.filter(k => !geminiKeyEnfriada(k));
  const pool = sanas.length ? sanas : keys.slice();
  const arranque = Math.floor(Math.random() * pool.length);
  const orden = [...pool.slice(arranque), ...pool.slice(0, arranque)];
  let intentos = 0;

  for (const cand of candidatosGemini(orden, modelos)) {
    if (intentos >= GEMINI_INTENTOS_MAX) break;
    const restante = deadlineMs - (Date.now() - inicio);
    if (restante <= 0) { errores.push('deadline global agotado'); break; }
    if (geminiKeyEnfriada(cand.key) && keys.some(k => !geminiKeyEnfriada(k))) continue;
    intentos += 1;
    const modelo = cand.modelo;
    const key = cand.key;
    try {
      const body = {
        ...payload,
        generationConfig: {
          responseMimeType: 'application/json',
          ...(schema ? { responseSchema: schema } : {}),
          ...(config.thinkingLevel ? { thinkingConfig: { thinkingLevel: config.thinkingLevel } } : {}),
          maxOutputTokens: config.maxOutputTokens,
        },
      };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: senalConTimeout(signal, Math.min(config.timeoutMs || 45000, restante)),
      });

      if (res.status === 429) {
        const texto = await res.text().catch(() => '');
        const clase = clasificarErrorGemini(429, texto);
        errores.push(`${modelo}:429:${clase}`);
        onLog({ tarea, modelo, evento: clase === 'capacidad' ? 'capacidad' : 'rate_limit' });
        marcarGeminiEnfriamiento(key, esperaRetryAfterMs(res.headers, GEMINI_ENFRIAMIENTO_MS));
        continue;
      }
      if (!res.ok) {
        const texto = await res.text().catch(() => '');
        const clase = clasificarErrorGemini(res.status, texto);
        errores.push(`${modelo}:${res.status}:${clase}:${texto.slice(0, 180)}`);
        onLog({ tarea, modelo, evento: 'http_error', status: res.status, clase });
        if (clase === 'auth') marcarGeminiEnfriamiento(key, GEMINI_ENFRIAMIENTO_MS * 5);
        continue;
      }

      const data = await res.json();
      const interpretado = interpretarRespuestaGemini(data);
      const latenciaMs = Date.now() - inicio;
      if (!interpretado.ok) {
        errores.push(`${modelo}:${interpretado.error}`);
        onLog({ tarea, modelo, evento: interpretado.error, finishReason: interpretado.finishReason, latenciaMs });
        if (interpretado.error === 'respuesta_incompleta') {
          return { ok: false, error: 'respuesta_incompleta', modelo, latenciaMs, raw: interpretado.raw || '', details: errores };
        }
        if (interpretado.error === 'json_invalido' || interpretado.error === 'respuesta_vacia') {
          errorFormato = { error: interpretado.error, raw: interpretado.raw || '', modelo, latenciaMs };
        }
        continue;
      }

      GEMINI_ENFRIAMIENTO.delete(geminiKeyId(key));

      onLog({ tarea, modelo, evento: 'ok', finishReason: interpretado.finishReason, latenciaMs, usage: data?.usageMetadata || null });
      return {
        ok: true,
        data: interpretado.data,
        raw: interpretado.raw,
        modelo,
        finishReason: interpretado.finishReason,
        usage: data?.usageMetadata || null,
        latenciaMs,
      };
    } catch (err) {
      errores.push(`${modelo}:${err?.name || 'error'}:${err?.message || ''}`);
      onLog({ tarea, modelo, evento: 'exception', detalle: String(err?.message || err).slice(0, 180) });
    }
  }

  onLog({ tarea, evento: 'modelo_no_disponible', details: errores.slice(0, 6) });
  if (errorFormato) {
    return {
      ok: false,
      error: errorFormato.error,
      raw: errorFormato.raw,
      modelo: errorFormato.modelo,
      latenciaMs: Date.now() - inicio,
      details: errores,
    };
  }
  return { ok: false, error: 'modelo_no_disponible', details: errores, latenciaMs: Date.now() - inicio };
}

export async function ejecutarTareaIA({ payload = {}, keys = [], tarea = 'reformular', schema = null, validar = () => ({ ok: true, data: null }), fetchImpl = fetch, onLog = () => {} } = {}) {
  const primero = await pedirGemini({ payload, keys, tarea, schema, fetchImpl, onLog });
  if (primero.ok) {
    const validado = validar(primero.data);
    if (validado.ok) return { ...primero, data: validado.data };
    return { ...primero, ok: false, error: 'validacion', details: validado.errors };
  }

  if (primero.error === 'json_invalido' || primero.error === 'respuesta_vacia') {
    const reintento = await pedirGemini({
      payload: {
        ...payload,
        contents: [
          ...(payload.contents || []),
          { role: 'model', parts: [{ text: primero.raw || '(vacío)' }] },
          { role: 'user', parts: [{ text: 'La respuesta anterior no fue JSON válido. Devolvé solo el JSON del esquema, sin markdown.' }] },
        ],
      },
      keys,
      tarea,
      schema,
      fetchImpl,
      onLog,
    });
    if (reintento.ok) {
      const validado = validar(reintento.data);
      if (validado.ok) return { ...reintento, data: validado.data };
    }
  }

  return primero;
}

export const NEGATIVE_IMAGEN_V2 = 'text, words, letters, watermarks, logos, signatures, blurry, low quality, distorted, deformed hands, extra fingers, cartoonish';

const PLANTILLAS_IMAGEN = {
  realista: 'Editorial news photograph, realistic, natural light, 35mm lens, shallow depth of field, no text, no letters, no logos. Scene: {escena}. Setting: {contexto}.',
  ilustracion: 'Editorial illustration, flat vector style, limited palette, clean shapes, no text, no letters, no logos. Scene: {escena}. Setting: {contexto}.',
  documental: 'Documentary photograph, candid, available light, grainy 400 ISO, no text, no letters, no logos. Scene: {escena}. Setting: {contexto}.',
};

export function construirPromptImagenV2({ titulo = '', contenido = '', contexto = '', estilo = 'realista' } = {}) {
  const plantilla = PLANTILLAS_IMAGEN[estilo] || PLANTILLAS_IMAGEN.realista;
  const escena = `${String(titulo).trim()}. ${String(contenido).trim().slice(0, 280)}`.trim();
  const lugar = String(contexto || 'Mendoza, Argentina').trim();
  return plantilla.replace('{escena}', escena).replace('{contexto}', lugar);
}

export function permitirSolicitud(buckets, ip = 'local', ahora = Date.now(), limite = 40, ventanaMs = 60000) {
  const clave = String(ip || 'local');
  let bucket = buckets.get(clave);
  if (!bucket || ahora - bucket.inicio > ventanaMs) {
    bucket = { inicio: ahora, cuenta: 0 };
    buckets.set(clave, bucket);
  }
  bucket.cuenta += 1;
  if (buckets.size > 500) {
    for (const [k, v] of buckets) {
      if (ahora - v.inicio > ventanaMs) buckets.delete(k);
    }
  }
  return bucket.cuenta <= limite;
}

export function normalizarNotaV2(nota = {}) {
  const titular = String(nota?.titular || '').trim();
  const cuerpo = String(nota?.cuerpo || '').trim();
  const errors = [];
  if (titular.length < 8) errors.push('titular_corto');
  if (cuerpo.length < 80) errors.push('cuerpo_corto');
  const fuentes = Array.isArray(nota?.fuentes)
    ? nota.fuentes
      .filter(f => f && /^https?:\/\//i.test(String(f.url || '')))
      .slice(0, 3)
      .map(f => ({
        titulo: String(f.titulo || '').trim(),
        url: String(f.url).trim(),
        medio: String(f.medio || '').trim(),
      }))
    : [];
  const origen = nota?.origen && /^https?:\/\//i.test(String(nota.origen.url || ''))
    ? {
      url: String(nota.origen.url).trim(),
      medio: String(nota.origen.medio || '').trim(),
      titulo: String(nota.origen.titulo || '').trim(),
    }
    : null;
  const data = {
    id: String(nota?.id || '').trim() || `r2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    titular,
    bajada: String(nota?.bajada || '').trim(),
    cuerpo,
    categoria: String(nota?.categoria || '').trim(),
    hashtags: Array.isArray(nota?.hashtags)
      ? nota.hashtags.map(h => String(h || '').trim()).filter(Boolean)
      : [],
    imagen: String(nota?.imagen || '').trim(),
    fuentes,
    origen,
    modelo: String(nota?.modelo || '').trim(),
    estado: String(nota?.estado || 'borrador').trim(),
    fecha: Number(nota?.fecha) || Date.now(),
    actualizado: Date.now(),
    version: 2,
  };
  return { ok: errors.length === 0, data, errors };
}
