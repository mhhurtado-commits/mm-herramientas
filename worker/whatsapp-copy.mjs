export const WA_FIRMA = '*📰 Media Mendoza - Noticias confiables del sur mendocino*';

export function notaDesdePaquete(paquete, acortar) {
  const f = paquete?.fuente || {};
  const url = f.url || '';
  return {
    titulo: f.titulo_original || f.tituloOriginal || f.titulo || '',
    categoria: f.categoria || 'General',
    descripcion: '',
    body: f.cuerpo || '',
    url,
    urlCorta: url && typeof acortar === 'function' ? acortar(url) : '',
    image: f.imagen || '',
    editorial: paquete?.editorial || {},
  };
}

export function buildEditorialPromptBlock(editorial) {
  if (!editorial || typeof editorial !== 'object') return '';
  const lineas = [];
  const titulo = String(editorial.titulo || '').trim();
  if (titulo) lineas.push(`Título paquete: ${titulo}`);
  const contexto = String(editorial.contexto || '').trim();
  if (contexto) lineas.push(`Contexto: ${contexto}`);
  const datos = Array.isArray(editorial.datos_clave)
    ? editorial.datos_clave.map(d => {
        const value = String(d?.value || '').trim();
        const label = String(d?.label || '').trim();
        return value && label ? `${label}: ${value}` : value || label;
      }).filter(Boolean)
    : [];
  if (datos.length) lineas.push(`Datos clave: ${datos.join(' ; ')}`);
  const pregunta = String(editorial.pregunta_social || '').trim();
  if (pregunta) lineas.push(`Pregunta social: ${pregunta}`);
  return lineas.length ? `EDITORIAL:\n${lineas.join('\n')}` : '';
}

export const WA_PROMPT_SISTEMA = `

REGLAS DE ENLACES:
- NO incluyas ninguna URL ni dirección web: el sistema agrega el enlace de la nota, los links de comunidad y la firma.
- En el mensaje de grupo, la línea que empieza con 🔗 queda sola y el sistema agrega el enlace debajo.
- No escribas la firma de marca: la agrega el sistema.`;

export function buildWhatsappPrompt({ promptBase, nota, links, localidad, contextoExtra }) {
  let bloqueEditorial = '';
  try { bloqueEditorial = buildEditorialPromptBlock(nota && nota.editorial); } catch (e) {}
  const sinCta = String(promptBase || '')
    .split('\n').filter(l => !/\{(LINK_GRUPO|LINK_CANAL)\}/.test(l) && !l.includes('¡Sumate a nuestra comunidad!')).join('\n');
  const sustituido = sinCta
    .replace(/\{URL\}/g, () => 'el sistema agrega el enlace de la nota')
    .replace(/\{TITULO\}/g, () => nota.titulo || 'Sin titulo')
    .replace(/\{CATEGORIA\}/g, () => nota.categoria || 'General')
    .replace(/\{LOCALIDAD\}/g, () => localidad)
    .replace(/\{CONTENIDO\}/g, () => (nota.body || '').substring(0, 1500));
  return `${sustituido}${WA_PROMPT_SISTEMA}

NOTICIA:
Título: ${nota.titulo}
Categoría: ${nota.categoria || 'General'}
Localidad: ${localidad}
Contenido: ${(nota.body || '').substring(0, 1500)}
${contextoExtra ? `Contexto extra: ${contextoExtra}\n` : ''}${bloqueEditorial}
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
  const MARCA_BORRAR = '\u0000BORRA';
  const LINEA_NULA = [
    /^\u0000BORRA$/,
    /^\s*\*?¡Sumate a nuestra comunidad!?[\s\*]*$/,
    /^\s*\*?📰?\s*Media\s?Mendoza.*$/,
    /^\s*[📱📣📻]\s*\*?(?:Grupo|Canal)(?:\s+de\s+(?:Noticias|[Dd]ifusión))?\*?\s*:?.*/u,
    /^\s*(?:🔗|👉)\s*$/,
  ];
  let texto = String(mensaje || '').trim()
    .split('\n')
    .map(l => {
      const sin = l.replace(PATRON_URL_COMUNIDAD, '').replace(/[ \t]+$/, '').trim();
      if (sin) return sin;
      return /^\s*$/.test(l) ? '' : MARCA_BORRAR;
    })
    .filter(l => !LINEA_NULA.some(re => re.test(l)))
    .join('\n');
  texto = texto.replace(/\{ENLACE\}/gi, '').replace(/[ \t]*(?:🔗|👉)\s*$/gm, '');
  texto = texto.replace(/\*?📰?\s*Media\s?Mendoza[^*\n]*\*?/gi, '');
  texto = texto.replace(/\n{3,}/g, '\n\n').trim();
  texto = desduplicarUrlNota(texto, url);
  if (tipo === 'canal') {
    return `${texto}\n\n${WA_FIRMA}`.trim();
  }
  const cta = buildCtaComunidad(links);
  return `${texto}\n\n${cta}${cta ? '\n\n' : ''}${WA_FIRMA}`.trim();
}

function desduplicarUrlNota(texto, url) {
  if (!url) return texto;
  const urlEscapada = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  texto = texto.replace(/https?:\/\/[^\s<>"']+/g, (m) => (new RegExp(`^${urlEscapada}$`, 'i').test(m.trim()) ? m : url));
  if (!texto.includes(url)) {
    if (/🔗/.test(texto)) {
      texto = texto.replace(/^(.*🔗[^\n]*)$/m, (linea) => {
        const base = linea.replace(/[ \t]+$/, '');
        return base.endsWith('👉') ? `${base} ${url}` : `${base} 👉 ${url}`;
      });
    } else {
      texto += `\n\n🔗 👉 ${url}`;
    }
  }
  return texto;
}
