import { CAROUSEL_PLAN_VERSION } from "./parser.js";

export function buildCarouselPrompt(article) {
  const content = [
    "Titulo: " + (article.title || ""),
    "Categoria: " + (article.category || ""),
    "Resumen: " + (article.summary || ""),
    "Contenido: " + (article.content || "")
  ]
    .filter(Boolean)
    .join("\n");

  return (
    "Genera un plan editorial para un carrusel de Instagram basado en esta noticia.\n\n" +
    content +
    "\n\nREGLAS:\n" +
    "- No inventar informacion.\n" +
    "- Utilizar unicamente el contenido de la noticia.\n" +
    "- Cada bloque debe ser breve.\n" +
    "- Pensado para Instagram.\n" +
    "- Lenguaje periodistico.\n" +
    "- Facil lectura.\n" +
    "- Maximo 35 palabras por slide.\n" +
    "- No usar hashtags.\n" +
    "- No usar emojis.\n" +
    "- No escribir introducciones.\n" +
    "- El carrusel final debe tener exactamente 5 slides: 1 cover + 4 slides.\n" +
    '- Los tipos permitidos son solo: "context", "facts", "impact", "cta".\n' +
    "- No agregar estilos, coordenadas, colores ni decisiones de diseno.\n\n" +
    "Responde SOLO con JSON sin backticks ni markdown.\n" +
    "Formato exacto:\n" +
    "{\n" +
    '  "version":"' + CAROUSEL_PLAN_VERSION + '",\n' +
    '  "article":{\n' +
    '    "url":"",\n' +
    '    "title":"",\n' +
    '    "category":"",\n' +
    '    "summary":"",\n' +
    '    "image":""\n' +
    "  },\n" +
    '  "cover":{\n' +
    '    "title":"",\n' +
    '    "subtitle":""\n' +
    "  },\n" +
    '  "slides":[\n' +
    '    {\n' +
    '      "type":"context",\n' +
    '      "title":"",\n' +
    '      "text":""\n' +
    "    },\n" +
    '    {\n' +
    '      "type":"facts",\n' +
    '      "title":"",\n' +
    '      "items":["", "", "", ""]\n' +
    "    },\n" +
    '    {\n' +
    '      "type":"impact",\n' +
    '      "title":"",\n' +
    '      "text":""\n' +
    "    },\n" +
    '    {\n' +
    '      "type":"cta",\n' +
    '      "title":"",\n' +
    '      "text":""\n' +
    "    }\n" +
    "  ]\n" +
    "}"
  );
}
