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
- Elegí una familia entre: general, clima, policiales, sociales, politica, economia, deportes.
- Usá español rioplatense informativo, sin clickbait ni exageraciones.
- No devuelvas markdown ni texto fuera del JSON.

Respondé SOLO con este JSON:
{
  "tipo": "placa_noticia",
  "version": 1,
  "titulo": "titular para la placa",
  "bajada": "bajada breve",
  "contexto": "dato o contexto clave, o cadena vacía",
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
    category: response.template_sugerido || base.fuente.categoria,
  });
  if (response.etiqueta) result.etiqueta = text(response.etiqueta);
  return result;
}

export function deterministicEditorialResponse(note = {}) {
  const result = normalizeNewsPlate(note);
  return { ...result, warnings: ['ia_no_disponible'] };
}
