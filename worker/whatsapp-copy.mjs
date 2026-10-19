export const WA_FIRMA = '*📰 Media Mendoza - Noticias confiables del sur mendocino*';

export const WA_PROMPT_SISTEMA = `

REGLAS DE ENLACES:
- NO incluyas ninguna URL ni dirección web: el sistema agrega el enlace de la nota, los links de comunidad y la firma.
- En el mensaje de grupo, la línea que empieza con 🔗 queda sola y el sistema agrega el enlace debajo.
- No escribas la firma de marca: la agrega el sistema.`;

export function buildWhatsappPrompt({ promptBase, nota, links, localidad, contextoExtra }) {
  const sinCta = String(promptBase || '')
    .split('\n').filter(l => !/\{(LINK_GRUPO|LINK_CANAL)\}/.test(l) && !l.includes('¡Sumate a nuestra comunidad!')).join('\n');
  const sustituido = sinCta
    .replace(/\{URL\}/g, '{ENLACE}')
    .replace(/\{TITULO\}/g, nota.titulo || 'Sin titulo')
    .replace(/\{CATEGORIA\}/g, nota.categoria || 'General')
    .replace(/\{LOCALIDAD\}/g, localidad)
    .replace(/\{CONTENIDO\}/g, (nota.body || '').substring(0, 1500));
  return `${sustituido}${WA_PROMPT_SISTEMA}

NOTICIA:
Título: ${nota.titulo}
Categoría: ${nota.categoria || 'General'}
Localidad: ${localidad}
Contenido: ${(nota.body || '').substring(0, 1500)}
${contextoExtra ? `Contexto extra: ${contextoExtra}\n` : ''}
Respondé SOLO con JSON sin backticks: {"grupo":"...","canal":"..."}`;
}
