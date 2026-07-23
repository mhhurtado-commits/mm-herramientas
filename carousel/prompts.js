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
    "Genera un diagnostico editorial y luego un plan editorial para un carrusel de Instagram basado en esta noticia.\n\n" +
    content +
    "\n\nREGLAS:\n" +
    "- No inventar informacion.\n" +
    "- Utilizar unicamente el contenido de la noticia.\n" +
    "- Pensado para Instagram.\n" +
    "- Lenguaje periodistico.\n" +
    "- Facil lectura.\n" +
    "- Maximo 35 palabras por slide de texto.\n" +
    "- No usar hashtags.\n" +
    "- No usar emojis.\n" +
    "- No escribir estilos, colores, coordenadas ni decisiones de diseno.\n" +
    "- Elegir SOLO una opcion valida para cada campo de diagnostico.\n" +
    '- news_type permitido: "breaking", "service", "institutional", "analysis", "data", "evergreen".\n' +
    '- complexity permitido: "brief", "medium", "deep".\n' +
    '- tone permitido: "informative", "explainer", "chronological", "impact", "utility".\n' +
    '- carousel_type permitido: "summary", "explainer", "timeline", "data_points", "service".\n' +
    '- template permitido: "mm_classic".\n' +
    "- Estructuras permitidas segun carousel_type:\n" +
    '  - summary: cover + context + facts + impact + cta\n' +
    '  - explainer: cover + context + impact + facts + impact + cta\n' +
    '  - timeline: cover + context + impact + impact + facts + cta\n' +
    '  - data_points: cover + context + facts + facts + cta\n' +
    '  - service: cover + context + impact + facts + cta\n' +
    "- Los tipos de slide permitidos son solo: context, facts, impact, cta.\n" +
    "- facts usa items. context, impact y cta usan text.\n\n" +
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
    '  "diagnosis":{\n' +
    '    "news_type":"breaking",\n' +
    '    "complexity":"medium",\n' +
    '    "tone":"informative",\n' +
    '    "carousel_type":"summary",\n' +
    '    "template":"mm_classic",\n' +
    '    "slide_count":5,\n' +
    '    "reason":""\n' +
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
