export function buildCarouselPrompt(article) {
  const content = [
    "Título: " + (article.title || ""),
    "Categoría: " + (article.category || ""),
    "Resumen: " + (article.summary || ""),
    "Contenido: " + (article.content || "")
  ]
    .filter(Boolean)
    .join("\n");

  return (
    "Generá un plan editorial para un carrusel de Instagram basado en esta noticia.\n\n" +
    content +
    "\n\nREGLAS:\n" +
    "- No inventar información.\n" +
    "- Utilizar únicamente el contenido de la noticia.\n" +
    "- Cada bloque debe ser breve.\n" +
    "- Pensado para Instagram.\n" +
    "- Lenguaje periodístico.\n" +
    "- Fácil lectura.\n" +
    "- Máximo 35 palabras por slide.\n" +
    "- No usar hashtags.\n" +
    "- No usar emojis.\n" +
    "- No escribir introducciones.\n\n" +
    "Respondé SOLO con JSON sin backticks ni markdown.\n" +
    'Formato exacto:\n' +
    '{\n' +
    '  "cover":{\n' +
    '    "title":"",\n' +
    '    "subtitle":""\n' +
    '  },\n' +
    '  "slides":[\n' +
    '    {\n' +
    '      "type":"context",\n' +
    '      "title":"",\n' +
    '      "text":""\n' +
    '    },\n' +
    '    {\n' +
    '      "type":"facts",\n' +
    '      "title":"",\n' +
    '      "items":[]\n' +
    '    },\n' +
    '    {\n' +
    '      "type":"impact",\n' +
    '      "title":"",\n' +
    '      "text":""\n' +
    '    },\n' +
    '    {\n' +
    '      "type":"cta",\n' +
    '      "title":"",\n' +
    '      "text":""\n' +
    '    }\n' +
    '  ]\n' +
    "}"
  );
}
