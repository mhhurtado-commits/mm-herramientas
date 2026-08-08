import { CAROUSEL_PLAN_VERSION } from "./parser.js";

export function buildCarouselPrompt(article) {
  const imageSources = listArticleImageSources(article);
  const content = [
    "Titulo: " + (article.title || ""),
    "Categoria: " + (article.category || ""),
    "Resumen: " + (article.summary || ""),
    "Contenido: " + (article.content || ""),
    imageSources.length ? "Imagenes disponibles:\n" + imageSources.join("\n") : ""
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
    "- La cantidad total de slides puede variar entre 4 y 7, segun el diagnostico; si carousel_type es summary, debe tener entre 4 y 5 slides totales, incluyendo cover y end.\n" +
    "- Estructuras permitidas segun carousel_type:\n" +
    '  - summary: entre 4 y 5 slides totales\n' +
    '  - explainer: entre 6 y 7 slides totales\n' +
    '  - timeline: entre 6 y 7 slides totales\n' +
    '  - data_points: entre 5 y 6 slides totales\n' +
    '  - service: entre 4 y 5 slides totales\n' +
    "- Los tipos de slide permitidos son: clave, contexto, dato, cita, imagen, end.\n" +
    "- Tambien se aceptan los aliases legacy: context, facts, impact, cta.\n" +
    "- clave, contexto e impact usan text. dato usa items. end usa source y cta.\n" +
    "- cita usa quote, author y role. imagen usa image y puede usar text como epigrafe.\n" +
    "- Solo incluir una slide cita cuando exista una frase literal verificable en Contenido; en ese caso usar los campos \"quote\", \"author\" y \"role\". Si no existe, no inventar \"quote\" y usar otra familia de slide.\n" +
    "- Para imagen, image debe ser solo article.image o article.images[n] de las URLs disponibles. Si no hay fuente visual, usar una slide textual.\n" +
    "- supportImage es opcional para una imagen de apoyo; no inventar URLs ni atribuciones.\n\n" +
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
    '    "slide_count":5,\n' +
    '    "reason":""\n' +
    "  },\n" +
    '  "cover":{\n' +
    '    "title":"",\n' +
    '    "subtitle":""\n' +
    "  },\n" +
    '  "slides":[\n' +
    '    {\n' +
    '      "type":"contexto",\n' +
    '      "title":"",\n' +
    '      "text":"",\n' +
    '      "supportImage":""\n' +
    "    },\n" +
    '    {\n' +
    '      "type":"dato",\n' +
    '      "title":"",\n' +
    '      "items":["", "", "", ""],\n' +
    '      "supportImage":""\n' +
    "    },\n" +
    '    {\n' +
    '      "type":"clave",\n' +
    '      "title":"",\n' +
    '      "text":"",\n' +
    '      "supportImage":""\n' +
    "    },\n" +
    '    {\n' +
    '      "type":"end",\n' +
    '      "source":"",\n' +
    '      "cta":""\n' +
    "    }\n" +
    "  ]\n" +
    "}"
  );
}

function listArticleImageSources(article = {}) {
  const urls = [];
  const main = String(article.image || "").trim();
  if (main) urls.push("- article.image: " + main);
  const images = Array.isArray(article.images) ? article.images : [];
  for (let i = 0; i < images.length; i++) {
    const url = String(images[i] || "").trim();
    if (url) urls.push("- article.images[" + i + "]: " + url);
  }
  return urls;
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

export function buildReelPrompt(article, diagnosis) {
  const content = [
    "Titulo: " + (article.title || ""),
    "Categoria: " + (article.category || ""),
    "Resumen: " + (article.summary || ""),
    "Contenido: " + (article.content || ""),
    "Imagen principal: " + (article.image || ""),
    "Cantidad de imagenes internas: " + ((article.images && article.images.length) || 0),
    "Vertical: " + ((diagnosis && diagnosis.vertical) || ""),
    "Tono: " + ((diagnosis && diagnosis.tone) || "")
  ]
    .filter(Boolean)
    .join("\n");

  return (
    "Genera un plan editorial para un Reel silencioso de Instagram de Media Mendoza basado en esta noticia.\n\n" +
    content +
    "\n\nREGLAS:\n" +
    "- No inventar informacion.\n" +
    "- No generar locucion ni audio.\n" +
    "- El Reel debe funcionar solo con imagenes y texto en pantalla.\n" +
    "- Incluir subtitulos breves por escena.\n" +
    "- Usar entre 4 y 6 escenas.\n" +
    "- Usar titulos de hasta 7 palabras y subtitulos de hasta 16 palabras.\n" +
    "- Cada escena debe indicar si conviene usar imagen principal, imagen interna o placa de texto.\n" +
    "- Elegir layout segun el contenido: default, list, contact, quote o cta.\n" +
    "- Para listas, pedidos o pasos, usar items separados; no unirlos con guiones dentro de text.\n" +
    "- Para contactos, separar telefono, direccion u horario en items.\n" +
    "- No repetir en subtitle lo que ya aparece en text o items.\n" +
    "- Si no hay imagen adecuada, usar placa de texto.\n" +
    "- Incluir caption para Instagram y hashtags.\n" +
    "- No escribir estilos, coordenadas ni decisiones tecnicas de render.\n\n" +
    "Responde SOLO con JSON sin backticks ni markdown.\n" +
    "Formato exacto:\n" +
    "{\n" +
    '  "format":"reel_silent",\n' +
    '  "hook":"",\n' +
    '  "cover_text":"",\n' +
    '  "caption":"",\n' +
    '  "hashtags":["#uno","#dos","#tres"],\n' +
    '  "scenes":[\n' +
    '    {\n' +
    '      "order":1,\n' +
    '      "duration_ms":2500,\n' +
    '      "visual_type":"cover_image",\n' +
    '      "visual_source":"article.image",\n' +
    '      "visual_role":"hook",\n' +
    '      "layout":"default",\n' +
    '      "text":"",\n' +
    '      "subtitle":"",\n' +
    '      "items":[]\n' +
    "    },\n" +
    '    {\n' +
    '      "order":2,\n' +
    '      "duration_ms":3000,\n' +
    '      "visual_type":"support_image",\n' +
    '      "visual_source":"article.images[0]",\n' +
    '      "visual_role":"context",\n' +
    '      "text":"",\n' +
    '      "subtitle":""\n' +
    "    },\n" +
    '    {\n' +
    '      "order":3,\n' +
    '      "duration_ms":3000,\n' +
    '      "visual_type":"text_card",\n' +
    '      "visual_source":"generated",\n' +
    '      "visual_role":"key_fact",\n' +
    '      "layout":"default",\n' +
    '      "text":"",\n' +
    '      "subtitle":"",\n' +
    '      "items":[]\n' +
    "    }\n" +
    "  ]\n" +
    "}"
  );
}
