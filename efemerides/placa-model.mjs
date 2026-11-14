// Lógica pura de la placa de efemérides. Sin DOM, sin canvas, sin fetch.

const ZONA = 'America/Argentina/Mendoza';

const ETIQUETAS = {
  futbol: 'FÚTBOL', deportes: 'DEPORTES', aviacion: 'AVIACIÓN', musica: 'MÚSICA',
  teatro: 'TEATRO', politica: 'POLÍTICA', historia: 'HISTORIA', sociedad: 'SOCIEDAD',
  economia: 'ECONOMÍA', mundo: 'MUNDO', canal: 'CANAL',
};

export function hoyArgentina() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export function etiquetaCategoria(item) {
  const clave = String(item?.icono || item?.categoria || '').trim().toLowerCase();
  if (ETIQUETAS[clave]) return ETIQUETAS[clave];
  return String(item?.categoria || 'efeméride').trim().toUpperCase();
}

const MIN_ITEMS = 5;
const MAX_ITEMS_PLACA = 6;

// El worker a veces cachea el año actual como "año" de todos los items. Si el
// item lo trae igual al año de la fecha pedida y el texto dice "de|en AAAA"
// (1500-2025), ese es el año real del hecho.
const ANIO_EN_TEXTO = /(?:de|en) (1[5-9]\d{2}|20[0-1]\d|202[0-5])\b/;

function repararAnio(item, fechaIso) {
  if (item.año !== String(fechaIso).slice(0, 4)) return item.año;
  const m = `${item.ampliado} ${item.resumen} ${item.titulo}`.match(ANIO_EN_TEXTO);
  return m ? m[1] : item.año;
}

function normalizarItem(item) {
  return {
    año: String(item?.año ?? item?.anio ?? '').trim(),
    titulo: String(item?.titulo ?? '').trim(),
    resumen: String(item?.resumen ?? '').trim(),
    ampliado: String(item?.texto_ampliado ?? item?.resumen ?? '').trim(),
    categoria: etiquetaCategoria(item),
    verificada: item?.verificada === true,
    fuente: String(item?.fuente ?? 'Wikipedia').trim(),
  };
}

export function normalizarPayload(raw) {
  if (!raw || raw.ok !== true || !Array.isArray(raw.items)) {
    const delServidor = String(raw?.error || '').trim();
    return { ok: false, error: delServidor || 'La respuesta del servicio no es válida.' };
  }
  const fechaIso = String(raw?.meta?.fecha ?? '').trim();
  const validos = raw.items.map(normalizarItem).filter(i => i.año && i.titulo && i.resumen);
  if (validos.length < MIN_ITEMS) {
    return { ok: false, error: 'No alcanzaron hechos verificados para esa fecha.' };
  }
  const total = validos.length;
  const items = validos.slice(0, MAX_ITEMS_PLACA).map(i => ({ ...i, año: repararAnio(i, fechaIso) }));
  const [hero, ...rows] = items;
  return {
    ok: true,
    fecha: String(raw?.meta?.fecha ?? '').trim(),
    fuente: items[0].fuente || 'Wikipedia',
    verificada: items.every(i => i.verificada),
    hero,
    rows,
    totalMostrados: items.length,
    total,
  };
}

export function extraerCopysRespuesta(raw) {
  if (!raw || raw.ok !== true) {
    const delServidor = String(raw?.error || '').trim();
    return { ok: false, error: delServidor || 'La respuesta del servicio no es válida.' };
  }
  const whatsapp = String(raw.whatsapp || '').trim();
  const instagram = String(raw.instagram || '').trim();
  if (!whatsapp || !instagram) return { ok: false, error: 'El servicio no devolvió los copys.' };
  return { ok: true, whatsapp, instagram };
}
