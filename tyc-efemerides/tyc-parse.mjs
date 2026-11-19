// Parser determinista del HTML del artículo TyC Sports: hechos = <li> con
// «AÑO - NOMBRE.» + texto. Los <li> sin año (días conmemorativos sin fecha)
// se ignoran. Nunca se inventa información: sólo se extrae lo visible.

const ENTIDADES_HTML = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ue: 'ü',
  ntilde: 'ñ', agrave: 'à', egrave: 'è', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
  ccedil: 'ç', agrave: 'à', egrave: 'è', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
  ccedil: 'ç', agrave: 'à', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  Ntilde: 'Ñ', iexcl: '¡', iquest: '¿', laquo: '«', raquo: '»',
  ndash: '–', mdash: '—', hellip: '…', iexcl: '¡', iquest: '¿',
  amp: '&',
};

export function decodificarEntidades(html) {
  return String(html || '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTIDADES_HTML[name] ?? m);
}

function htmlATexto(html) {
  return decodificarEntidades(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '. ')
      .replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, '. ')
      .replace(/<[^>]*>/g, ' '),
  ).replace(/\s+/g, ' ').trim();
}

export function parsearEfemeridesTyc(html) {
  const items = [];
  const lis = String(html || '').match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || [];
  const vistos = new Set();
  for (const li of lis) {
    const texto = htmlATexto(li);
    const m = texto.match(/^\s*(\d{3,4})\s*[-–—.]\s*(.+?)\s*$/);
    if (!m) continue;
    const año = m[1];
    const resto = m[2].trim();
    const corte = resto.indexOf('. ');
    const titulo = (corte > 0 ? resto.slice(0, corte) : resto).trim();
    const detalle = (corte > 0 ? resto.slice(corte + 2) : '').trim();
    const full = (titulo + (detalle ? '. ' + detalle : '')).replace(/\.+$/, '');
    const clave = año + '|' + titulo.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    items.push({ año, titulo: titulo.slice(0, 90).trim(), texto: full.trim() });
  }
  return items;
}
