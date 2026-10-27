export const FUENTES_MAX = 3;
export const FUENTES_CANDIDATAS = 6;

const ENTIDADES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  ntilde: 'ñ', uuml: 'ü', ordm: 'º', laquo: '«', raquo: '»',
  hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”',
};

export function decodificarEntidades(texto = '') {
  return String(texto)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, nombre) => ENTIDADES[nombre.toLowerCase()] ?? m);
}

export function limpiarXml(texto = '') {
  return decodificarEntidades(String(texto)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

export function extraerTag(bloque = '', tag = '') {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = String(bloque).match(re);
  return m ? limpiarXml(m[1]) : '';
}

export function extraerLink(bloque = '') {
  const directo = String(bloque).match(/<link[^>]*>\s*([\s\S]*?)\s*<\/link>/i);
  if (directo && directo[1].trim()) return limpiarXml(directo[1]);
  const href = String(bloque).match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return href ? decodificarEntidades(href[1].trim()) : '';
}

export function resolverLinkBing(link = '') {
  try {
    const url = new URL(link);
    if (!/(^|\.)bing\.com$/i.test(url.hostname)) return link;
    const original = url.searchParams.get('url');
    return original ? decodeURIComponent(original) : link;
  } catch { return link; }
}

export function parsearRss(xml = '', medio = '') {
  const bloques = String(xml).match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return bloques.slice(0, 20).map(bloque => {
    const url = resolverLinkBing(extraerLink(bloque));
    const titulo = extraerTag(bloque, 'title');
    const fecha = extraerTag(bloque, 'pubDate') || extraerTag(bloque, 'published') || extraerTag(bloque, 'updated');
    const fuente = extraerTag(bloque, 'News:Source') || extraerTag(bloque, 'source') || medio;
    return { titulo, url, fecha, medio: fuente };
  }).filter(item => item.titulo && /^https?:\/\//i.test(item.url));
}

export function normalizarUrl(valor = '') {
  try {
    const url = new URL(valor);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_|ref$|source$)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString().replace(/\/$/, '');
  } catch { return ''; }
}

export function deduplicarFuentes(items = []) {
  const vistos = new Set();
  const salida = [];
  for (const item of Array.isArray(items) ? items : []) {
    const url = normalizarUrl(item?.url);
    if (!url || vistos.has(url)) continue;
    vistos.add(url);
    salida.push({ ...item, url });
  }
  return salida;
}

export function construirConsultas({ titulo = '', medio = '', localidad = 'San Rafael' } = {}) {
  const base = String(titulo)
    .replace(/\s+[|–—-]\s+.*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  if (!base) return [];
  return [...new Set([base, `${base} ${localidad}`.trim()])].filter(Boolean);
}

export async function verificarFuente(url, fetchImpl = fetch, timeoutMs = 6000) {
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MediaMendoza/1.0)', Range: 'bytes=0-4096' },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return false;
    const tipo = String(res.headers.get('content-type') || '');
    if (tipo && !/text\/html|application\/xhtml|text\/plain/i.test(tipo)) return false;
    const texto = await res.text();
    return /<html|<article|<body|<p[\s>]/i.test(texto.slice(0, 6000));
  } catch { return false; }
}

export async function seleccionarFuentes(candidatos = [], { fetchImpl = fetch, origenUrl = '', max = FUENTES_MAX } = {}) {
  const origen = normalizarUrl(origenUrl);
  const unicos = deduplicarFuentes(candidatos)
    .filter(item => normalizarUrl(item.url) !== origen)
    .slice(0, FUENTES_CANDIDATAS);
  const checks = await Promise.all(unicos.map(async item => ({ item, ok: await verificarFuente(item.url, fetchImpl) })));
  return checks.filter(check => check.ok).map(check => check.item).slice(0, max);
}

export function extraerMedioDeHtml(html = '', url = '') {
  const patrones = [
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
    /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const patron of patrones) {
    const m = String(html).match(patron);
    if (m) return limpiarXml(m[1]).trim();
  }
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

export function extraerFechaDeHtml(html = '') {
  const patrones = [
    /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i,
    /<time[^>]+datetime=["']([^"']+)["']/i,
  ];
  for (const patron of patrones) {
    const m = String(html).match(patron);
    if (m) return m[1].trim();
  }
  return '';
}

export function coincideTema(titulo = '', consulta = '') {
  const palabras = String(consulta).toLowerCase().split(/[^\p{L}\d]+/u).filter(p => p.length > 3);
  if (!palabras.length) return true;
  const texto = String(titulo).toLowerCase();
  return palabras.some(p => texto.includes(p));
}

export function hashClave(texto = '') {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
