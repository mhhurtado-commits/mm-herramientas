import { normalizeNewsPlate } from '../placas-v2/editorial-core.mjs';
export { normalizeSyntheticTitle } from '../placas-v2/editorial-core.mjs';
export { buildEditorialPackage, normalizeRequestedOutputs } from './editorial-package.mjs';

const text = value => String(value || '').replace(/\s+/g, ' ').trim();

export function buildPlateEditorialPrompt(note = {}) {
  const title = text(note.title || note.titulo);
  const category = text(note.category || note.categoria);
  const description = text(note.description || note.descripcion);
  const body = text(note.body || note.texto || note.contenido).slice(0, 12000);
  return `Sos editor de Media Mendoza, diario digital del sur de Mendoza, Argentina.
Modelo comparativa: si la nota presenta contrastes temporales, dos momentos (por ejemplo, viernes y domingo), escenarios o valores verificables, elegí comparativa y devolvé esos dos lados directamente respaldados por la nota. No inventes cifras ni relaciones y dejá el campo vacío si no hay dos lados claros.
Convertí una noticia en una propuesta editorial para una placa de redes.

NOTICIA:
Título original: ${title}
Categoría: ${category}
Descripción: ${description}
Cuerpo:
${body}

REGLAS:
- Leé todo el cuerpo antes de sintetizar.
- NO inventes datos, cifras, citas, nombres ni contexto que no aparezca en la noticia.
- Generá un titular breve, claro y atractivo, sin perder precisión.
- Generá una bajada de una o dos frases y un contexto clave breve sólo si aporta información verificable.
- Si el cuerpo contiene una declaración entrecomillada o atribuida, podés proponer una placa textual, pero la cita debe copiarse literalmente del cuerpo; si no hay cita literal verificable, devolvé una cadena vacía.
- Detectá personas mencionadas sólo cuando la atribución sea clara. Devolvé una persona por círculo, con nombre, cargo y una imagen disponible de la nota cuando exista; la interfaz permitirá subir otra imagen después.
- Generá dos copys para acompañar la placa con foco en engagement: Instagram debe tener 1 o 2 párrafos breves, 2 o 3 emojis pertinentes, una pregunta o invitación a participar y 3 a 5 hashtags relevantes; Facebook debe tener 2 o 3 párrafos breves, 1 o 2 emojis, una pregunta concreta para incentivar comentarios y el enlace editorial al final.
- No inventes datos, citas ni preguntas que atribuyan hechos no presentes en la noticia. No uses [enlace], links completos ni llamados a la acción repetidos: el sistema normaliza el enlace y el CTA.
- Elegí una familia entre: general, clima, policiales, sociales, politica, economia, deportes.
- Elegí un tipo de placa entre: noticia, titular-arriba, titular-abajo, foto-completa, dato-clave, comparativa, textual, retrato-circular, editorial-split, conversacion, actualizacion, que-cambia. Usá comparativa cuando existan dos momentos, escenarios o valores comparables explícitos; foto-completa como alternativa de foto a sangre con titular superpuesto; textual sólo con cita literal verificable y retrato-circular sólo si hay al menos una persona identificable.
- Usá español rioplatense informativo, sin clickbait ni exageraciones.
- No devuelvas markdown ni texto fuera del JSON.
- Genera tambien un titular sintetico idealmente de 6 a 10 palabras para el modelo titular-arriba. Debe conservar sujeto, hecho principal y precision; no agregues contexto secundario ni inventes informacion.
- Para el modelo dato-clave, generá hasta tres datos verificables en el campo datos_clave, con un valor principal y detalles opcionales.
- En datos_clave, usá etiquetas específicas como Zona afectada, Calles afectadas, Causa, Estado o Plazo cuando la noticia lo permita; evitá etiquetas genéricas como Lugar o Contexto.
- Generá pregunta_social como una invitación breve a conversar, basada sólo en la nota y sin atribuir hechos nuevos.
- Para qué cambia, generá hasta tres impactos verificables directamente respaldados por la nota; no infieras consecuencias.
- Usa titular-arriba como propuesta recomendada cuando la noticia pueda resumirse en una sola idea visual; titular-abajo y foto-completa son alternativas sintéticas válidas; conserva noticia para la alternativa con bajada.

Respondé SOLO con este JSON:
{
  "tipo": "placa_noticia",
  "version": 1,
  "tipo_placa": "noticia|titular-arriba|titular-abajo|foto-completa|dato-clave|comparativa|textual|retrato-circular|editorial-split|conversacion|actualizacion|que-cambia",
  "comparativa": { "izquierda": { "etiqueta": "lado A", "valor": "dato verificable", "detalle": "detalle opcional" }, "derecha": { "etiqueta": "lado B", "valor": "dato verificable", "detalle": "detalle opcional" }, "fuente": "fuente si corresponde", "fecha": "fecha del dato", "origen": "nota|manual|externo" },
  "datos_clave": [{ "label": "etiqueta breve", "value": "dato verificable", "detail": "detalle opcional" }],
  "impactos": [{ "label": "a quién o desde cuándo", "value": "consecuencia verificable", "detail": "detalle opcional" }],
  "titulo": "titular para la placa",
  "titulo_sintetico": "titular sintetico de maximo 10 palabras",
  "bajada": "bajada breve",
  "contexto": "dato o contexto clave, o cadena vacía",
  "pregunta_social": "pregunta breve basada en la nota",
  "textual": { "cita": "cita literal o cadena vacía", "autor": "persona", "cargo": "cargo", "verificada": false },
  "personas": [{ "nombre": "persona", "rol": "cargo", "imagen": "URL de imagen de la nota o cadena vacía", "origen": "nota", "foco": { "x": 0.5, "y": 0.5 } }],
  "imagenes_apoyo": [{ "src": "URL de imagen de la nota o cadena vacía", "origen": "nota", "foco": { "x": 0.5, "y": 0.5 } }],
  "redes": {
    "instagram": "copy para Instagram",
    "facebook": "copy para Facebook"
  },
  "etiqueta": "nombre de la sección",
  "template_sugerido": "general|clima|policiales|sociales|politica|economia|deportes",
  "bloques": []
}`;
}

export function normalizeEditorialResponse(response = {}, note = {}) {
  const base = normalizeNewsPlate(note);
  const result = normalizeNewsPlate({
    ...base,
    ...response,
    fuente: base.fuente,
    titulo: text(response.titulo || response.title || base.titulo),
    titulo_sintetico: text(response.titulo_sintetico || base.titulo_sintetico),
    bajada: text(response.bajada || response.descripcion || base.bajada),
    contexto: text(response.contexto || base.contexto),
    tipo_placa: response.tipo_placa || base.tipo_placa,
    textual: response.textual || base.textual,
    personas: response.personas || base.personas,
    category: response.template_sugerido || base.fuente.categoria,
  });
  if (response.etiqueta) result.etiqueta = text(response.etiqueta);
  return result;
}

export function deterministicEditorialResponse(note = {}) {
  const result = normalizeNewsPlate(note);
  return { ...result, warnings: ['ia_no_disponible'] };
}
