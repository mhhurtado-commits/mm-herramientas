import { normalizeNewsPlate } from '../placas-v2/editorial-core.mjs';

const text = value => String(value || '').replace(/\s+/g, ' ').trim();

export function buildPlateEditorialPrompt(note = {}) {
  const title = text(note.title || note.titulo);
  const category = text(note.category || note.categoria);
  const description = text(note.description || note.descripcion);
  const body = text(note.body || note.texto || note.contenido).slice(0, 12000);
  return `Sos editor de Media Mendoza, diario digital del sur de Mendoza, Argentina.
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
- Elegí un tipo de placa entre: noticia, textual, retrato-circular, editorial-split. Usá textual sólo con cita literal verificable y retrato-circular sólo si hay al menos una persona identificable.
- Usá español rioplatense informativo, sin clickbait ni exageraciones.
- No devuelvas markdown ni texto fuera del JSON.

Respondé SOLO con este JSON:
{
  "tipo": "placa_noticia",
  "version": 1,
  "tipo_placa": "noticia|textual|retrato-circular|editorial-split",
  "titulo": "titular para la placa",
  "bajada": "bajada breve",
  "contexto": "dato o contexto clave, o cadena vacía",
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
