// Parser determinista del HTML del artículo TyC Sports. Acepta los dos
// formatos vistos: <ul><li>AÑO - TÍTULO. Texto</li></ul> (viejo) y
// <p><span style="background-color…"><b>AÑO - TÍTULO</b></span>. Texto</p>
// (actual). Los bloques sin año (días conmemorativos sin fecha) se ignoran.
// Nunca se inventa información: sólo se extrae lo visible.

const ENTIDADES_HTML = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ue: 'ü',
  ntilde: 'ñ', agrave: 'à', egrave: 'è', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
  ccedil: 'ç', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  Ntilde: 'Ñ', iexcl: '¡', iquest: '¿', laquo: '«', raquo: '»',
  ndash: '–', mdash: '—', hellip: '…',
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

const RE_HECHO_TYC = /^\s*(\d{3,4})\s*[-–—.]\s*(.+)$/;

function hechoDesdeBloque(bloque) {
  let texto = htmlATexto(bloque);
  // Formato nuevo: el título completo vive en el <b> resaltado, donde puede
  // haber iniciales con punto («FRANZ P. SCHUBERT») que rompen el corte por
  // «. ».
  if (/background-color/i.test(bloque)) {
    const bm = bloque.match(/<b\b[^>]*>([\s\S]*?)<\/b>/i);
    const bold = bm ? htmlATexto(bm[1]).replace(/\.+$/, '').trim() : '';
    const mb = bold.match(/^(\d{3,4})\s*[-–—.]\s*(.+)$/);
    if (mb) {
      const año = mb[1];
      const titulo = mb[2].trim();
      const idx = texto.indexOf(titulo);
      let detalle = idx >= 0 ? texto.slice(idx + titulo.length) : '';
      detalle = detalle.replace(/^[\s.]+/, '').trim();
      return { año, titulo, texto: (titulo + (detalle ? '. ' + detalle : '')).trim() };
    }
  }
  let m = texto.match(RE_HECHO_TYC);
  if (!m) return null;
  const año = m[1];
  const resto = m[2].trim();
  const corte = resto.indexOf('. ');
  const titulo = (corte > 0 ? resto.slice(0, corte) : resto).trim();
  const detalle = (corte > 0 ? resto.slice(corte + 2) : '').trim();
  return { año, titulo, texto: (titulo + (detalle ? '. ' + detalle : '')).replace(/\.+$/, '') };
}

export function parsearEfemeridesTyc(html) {
  const src = String(html || '');
  // Pasadas separadas: en HTML viejo los hechos son <li>; en el actual, <p>
  // (y el <p> mal anidado puede tragarse <li> anidados, por eso no alcanza con
  // un solo regex). La dedupe por año|título resuelve solapamientos.
  const bloques = [
    ...(src.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || []),
    ...(src.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || []),
  ];
  const items = [];
  const vistos = new Set();
  for (const bloque of bloques) {
    const hecho = hechoDesdeBloque(bloque);
    if (!hecho) continue;
    const clave = hecho.año + '|' + hecho.titulo.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    items.push({
      año: hecho.año,
      titulo: hecho.titulo.slice(0, 90).trim(),
      texto: hecho.texto.trim(),
    });
  }
  return items;
}
