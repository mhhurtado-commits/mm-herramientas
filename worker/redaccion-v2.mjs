export const REDACCION_V2_VERSION = 1;
export const MODELO_PRIMARIO_V2 = 'gemini-3.8-flash';
export const MODELO_RESPALDO_V2 = 'gemini-3.5-flash-lite';

export const TAREAS = {
  titulares: { modelo: MODELO_PRIMARIO_V2, respaldo: MODELO_RESPALDO_V2, maxOutputTokens: 2048, thinkingLevel: 'low', timeoutMs: 60000 },
  reformular: { modelo: MODELO_PRIMARIO_V2, respaldo: MODELO_RESPALDO_V2, maxOutputTokens: 8192, thinkingLevel: 'low', timeoutMs: 120000 },
  redactar: { modelo: MODELO_PRIMARIO_V2, respaldo: MODELO_RESPALDO_V2, maxOutputTokens: 8192, thinkingLevel: 'low', timeoutMs: 120000 },
};

export const ESTILOS_DESC_V2 = {
  formal: 'FORMATO — Periodístico formal:\n- Titular: sujeto+verbo+dato, máx 10 palabras.\n- P1: qué/quién/cuándo/dónde/cómo.\n- P2-4: orden de importancia.\n- Cierre: dato proyectivo.',
  directo: 'FORMATO — Directo:\n- Titular: máx 7 palabras.\n- 3 párrafos de 2 oraciones.',
  ampliado: 'FORMATO — Profundidad:\n- P1 hecho, P2 antecedentes, P3 datos, P4 perspectivas, P5 cierre.',
  breaking: 'FORMATO — Urgente:\n- Titular en presente, máx 8 palabras.\n- P1 hecho, P2 lo que se sabe, P3 lo que falta.',
  cronica: 'FORMATO — Crónica:\n- Titular evocador, apertura escena, protagonista, hecho, contexto, cierre.',
  deportes: 'FORMATO — Deportes:\n- Titular activo. Resultado, momentos clave, datos, próximo paso.',
  espectaculos: 'FORMATO — Espectáculos:\n- Titular llamativo. Hecho, contexto, dato curioso, qué sigue.',
  redes: 'FORMATO — Redes:\n- Titular gancho. 3 párrafos breves. Cierre que invite a compartir.',
  institucional: 'FORMATO — Comunicado:\n- Titular informativo, sin adjetivos. Hecho, alcance, declaraciones, contacto.',
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
  const base = [
    'Sos redactor de Media Mendoza, diario digital del sur de Mendoza, Argentina.',
    'Escribís en español rioplatense, tono informativo, sin clickbait ni exageraciones.',
    'No inventes datos, cifras, citas, nombres, medios ni links.',
    'Devolvés únicamente el JSON pedido, sin markdown ni texto adicional.',
  ].join('\n');
  const guia = String(guiaEditorial || '').trim();
  return guia ? `${base}\n\nLÍNEA EDITORIAL (obligatoria):\n${guia}` : base;
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

export function construirPromptReformular({ titulo, contenido, contexto = '', estilo = 'formal', medioOrigen = '', fuentes = [] } = {}) {
  const formato = ESTILOS_DESC_V2[estilo] || ESTILOS_DESC_V2.formal;
  return [
    'Reformulá por completo esta nota de otro medio para publicarla en Media Mendoza.',
    medioOrigen ? `MEDIO DE ORIGEN: ${medioOrigen}` : '',
    `TÍTULO ORIGINAL:\n"""\n${titulo}\n"""`,
    `CUERPO ORIGINAL:\n"""\n${contenido}\n"""`,
    contexto ? `INFO EXTRA:\n${contexto}` : '',
    formato,
    bloqueFuentes(fuentes),
    'Conservá los hechos, las cifras y las citas del original. No agregues información que no esté en el texto.',
    'No menciones el medio de origen dentro del cuerpo: la atribución va aparte.',
    'Devolvé titular, cuerpo en párrafos separados por una línea en blanco, categoría sugerida y hashtags.',
  ].filter(Boolean).join('\n\n');
}

export function construirPromptRedactar({ ideas, fuentes = [], fecha = '' } = {}) {
  return [
    'Redactá una nota periodística para Media Mendoza.',
    fecha ? `FECHA Y HORA ACTUAL (Mendoza, Argentina): ${fecha}` : '',
    `CONTENIDO DE PARTIDA:\n"""\n${ideas}\n"""`,
    bloqueFuentes(fuentes),
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
  const titular = String(data?.titular || '').trim();
  const cuerpo = String(data?.cuerpo || '').trim();
  const categoria_sugerida = String(data?.categoria_sugerida || '').trim();
  const hashtags = Array.isArray(data?.hashtags) ? data.hashtags.map(h => String(h || '').trim()).filter(Boolean) : [];
  const errors = [];
  if (titular.length < 8) errors.push('titular_corto');
  if (cuerpo.length < 80) errors.push('cuerpo_corto');
  return { ok: errors.length === 0, data: { titular, cuerpo, categoria_sugerida, hashtags }, errors };
}

export function validarRedaccion(data = {}) {
  const base = validarReformulacion(data);
  const bajada = String(data?.bajada || '').trim();
  const errors = [...base.errors];
  if (bajada.length < 10) errors.push('bajada_corta');
  return { ok: errors.length === 0, data: { ...base.data, bajada }, errors };
}
