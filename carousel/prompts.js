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
    '- vertical permitido: "policiales", "servicios", "sociales", "espectaculos", "clima", "deportes", "politica", "economia", "general".\n' +
    '- complexity permitido: "brief", "medium", "deep".\n' +
    '- tone permitido: "informative", "explainer", "chronological", "impact", "utility".\n' +
    '- carousel_type permitido: "summary", "explainer", "timeline", "data_points", "service".\n' +
    '- template permitido: "mm_classic", "mm_briefing", "mm_impact".\n' +
    "- La cantidad total de slides puede variar entre 4 y 7, segun el diagnostico.\n" +
    "- Estructuras permitidas segun carousel_type:\n" +
    '  - summary: entre 4 y 5 slides totales\n' +
    '  - explainer: entre 6 y 7 slides totales\n' +
    '  - timeline: entre 6 y 7 slides totales\n' +
    '  - data_points: entre 5 y 6 slides totales\n' +
    '  - service: entre 4 y 5 slides totales\n' +
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
    '    "vertical":"policiales",\n' +
    '    "complexity":"medium",\n' +
    '    "tone":"informative",\n' +
    '    "carousel_type":"summary",\n' +
    '    "template":"mm_impact",\n' +
    '    "slide_count":6,\n' +
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

export function buildInstagramCaptionPrompt(article, plan) {
  const diagnosis = plan && plan.diagnosis ? plan.diagnosis : {};
  const content = [
    "Titulo: " + (article.title || ""),
    "Categoria: " + (article.category || ""),
    "Resumen: " + (article.summary || ""),
    "Contenido: " + (article.content || ""),
    "Tipo de carrusel: " + (diagnosis.carousel_type || ""),
    "Vertical: " + (diagnosis.vertical || "")
  ]
    .filter(Boolean)
    .join("\n");

  return (
    "Genera un texto de acompanamiento para un carrusel de Instagram de Media Mendoza basado en esta noticia.\n\n" +
    content +
    "\n\nREGLAS:\n" +
    "- Tono periodistico, claro y actual.\n" +
    "- Debe funcionar como caption de Instagram.\n" +
    "- Incluir una bajada breve al inicio.\n" +
    "- Incluir cierre con llamada a leer o deslizar.\n" +
    "- Incluir entre 5 y 8 hashtags relevantes.\n" +
    "- No usar emojis.\n" +
    "- No inventar informacion.\n" +
    "- No repetir el titulo textual mas de una vez.\n\n" +
    "Responde SOLO con JSON sin backticks ni markdown.\n" +
    "Formato exacto:\n" +
    "{\n" +
    '  "caption":"",\n' +
    '  "hashtags":["#uno","#dos","#tres"]\n' +
    "}"
  );
}
