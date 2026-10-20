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

const PATRON_URL_COMUNIDAD = /(https?:\/\/|www\.)?[a-z0-9.\-]*(chat\.whatsapp\.com|whatsapp\.com\/channel|bit\.ly\/mediamendoza|wa\.me)([\/\?#\w\-=&%.\+]*)/gi;

export function buildCtaComunidad(links = {}) {
  const partes = [];
  if (links.grupo) partes.push(`📱 *Grupo de Noticias:* ${links.grupo}`);
  if (links.canal) partes.push(`📣 *Canal de Difusión:* ${links.canal}`);
  return partes.length ? `*¡Sumate a nuestra comunidad!*\n${partes.join('\n')}` : '';
}

export function normalizeWhatsappCopy(mensaje, { tipo = 'grupo', url = '', links = {} } = {}) {
  let texto = String(mensaje || '').trim()
    .split('\n')
    .map(l => l.replace(PATRON_URL_COMUNIDAD, '').replace(/[ \t]+$/, '').trim())
    .filter(Boolean).join('\n');
  texto = texto.replace(/^\s*\*?¡Sumate a nuestra comunidad!?\*?\s*$/gm, '')
    .replace(/^\s*\*?📰 Media Mendoza[^\n]*$/gm, '')
    .replace(/^\s*[📱📣📻]\s*\*?(?:Grupo|Canal)(?:\s+de\s+(?:Noticias|[Dd]ifusión))?\*?\s*:?[^\n]*$/gmu, '');
  texto = texto.replace(/\n{3,}/g, '\n\n').trim();
  texto = desduplicarUrlNota(texto, url);
  if (tipo === 'canal') {
    return `${texto}\n${WA_FIRMA}`.trim();
  }
  const cta = buildCtaComunidad(links);
  return `${texto}\n\n${cta}${cta ? '\n' : ''}${WA_FIRMA}`.trim();
}

function desduplicarUrlNota(texto, url) {
  if (!url) return texto;
  const urlEscapada = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  texto = texto.replace(/https?:\/\/[^\s<>"']+/g, (m) => (new RegExp(`^${urlEscapada}$`, 'i').test(m.trim()) ? m : url));
  if (!texto.includes(url)) {
    if (/🔗/.test(texto)) {
      texto = texto.replace(/^(.*🔗[^\n]*)$/m, (linea) => linea.replace(/[ \t]*$/, '') + `\n👉 ${url}`);
    } else {
      texto += `\n\n🔗 👉 ${url}`;
    }
  }
  return texto;
}
