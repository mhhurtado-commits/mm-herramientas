// Lógica pura de la placa de efemérides. Sin DOM, sin canvas, sin fetch.

const ZONA = 'America/Argentina/Mendoza';

const ETIQUETAS = {
  futbol: 'FÚTBOL', deportes: 'DEPORTES', aviacion: 'AVIACIÓN', musica: 'MÚSICA',
  teatro: 'TEATRO', politica: 'POLÍTICA', historia: 'HISTORIA', sociedad: 'SOCIEDAD',
  economia: 'ECONOMÍA', mundo: 'MUNDO', canal: 'CANAL',
};

export const ICONOS_EF = ['futbol', 'deportes', 'aviacion', 'musica', 'teatro', 'politica', 'historia', 'sociedad', 'economia', 'mundo', 'canal'];
const EMOJIS_EF = { futbol: '⚽', deportes: '🏆', aviacion: '✈️', musica: '🎵', teatro: '🎭', politica: '🏛️', historia: '📜', sociedad: '🗞️', economia: '💹', mundo: '🌎', canal: '📺' };
export function emojiIconoEf(icono) {
  return EMOJIS_EF[String(icono || '').trim().toLowerCase()] || '📜';
}

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
const MESES_ABREV_EF = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
function etiquetaFechaHero(fechaIso) {
  const f = String(fechaIso || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return 'AR';
  return String(Number(f.slice(8, 10))) + ' ' + MESES_ABREV_EF[Number(f.slice(5, 7)) - 1];
}

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
  const icono = String(item?.icono ?? '').trim().toLowerCase();
  return {
    id: String(item?.id ?? '').trim(),
    año: String(item?.año ?? item?.anio ?? '').trim(),
    titulo: String(item?.titulo ?? '').trim(),
    resumen: String(item?.resumen ?? '').trim(),
    ampliado: String(item?.texto_ampliado ?? item?.resumen ?? '').trim(),
    icono: ICONOS_EF.includes(icono) ? icono : 'historia',
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
  const reparados = validos.map(i => ({ ...i, año: repararAnio(i, fechaIso) }));
  const items = reparados.slice(0, MAX_ITEMS_PLACA);
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
    items,
    candidatos: reparados,
  };
}

// La destacada es SIEMPRE el primer hecho visible: no hay heroIndex aparte.
// Con 0 visibles devuelve ok:false; la UI deshabilita OCULTAR en el último visible.
export function construirModeloPlaca(items, fecha = '') {
  const lista = Array.isArray(items) ? items : [];
  const visibles = lista.filter(i => i && !i.oculto);
  const hero = visibles[0]
    ? { ...visibles[0], añoTexto: visibles[0].año || etiquetaFechaHero(visibles[0].fecha) }
    : null;
  const rows = visibles.slice(1).map(i => ({ ...i, filaTexto: i.año || 'AR' }));
  const verificada = visibles.length > 0 && visibles.every(i => i.verificada !== false);
  return { ok: !!hero, fecha, hero, rows, totalMostrados: visibles.length, total: lista.length, verificada };
}

export function itemsVisiblesCopys(items) {
  return (Array.isArray(items) ? items : [])
    .filter(i => i && !i.oculto)
    .slice(0, 6)
    .map(i => ({
      id: String(i.id || ''), año: String(i.año || ''),
      titulo: String(i.titulo || ''), resumen: String(i.resumen || ''),
      texto_ampliado: String(i.ampliado || i.resumen || ''),
      icono: ICONOS_EF.includes(String(i.icono || '').toLowerCase()) ? String(i.icono).toLowerCase() : 'historia',
    }));
}

export function validarHechoPropio({ año, titulo, resumen, ampliado, icono } = {}) {
  const a = String(año ?? '').trim();
  if (!/^(1[0-9]{3}|20[0-9]{2})$/.test(a)) return { ok: false, error: 'Año inválido: usá 4 dígitos entre 1000 y 2099.' };
  const t = String(titulo ?? '').trim();
  if (!t) return { ok: false, error: 'Falta el título.' };
  if (t.length > 160) return { ok: false, error: 'Título demasiado largo (máx 160).' };
  const r = String(resumen ?? '').trim();
  if (!r) return { ok: false, error: 'Falta el resumen.' };
  if (r.length > 140) return { ok: false, error: 'Resumen demasiado largo (máx 140).' };
  const am = String(ampliado ?? '').trim();
  if (am.length > 240) return { ok: false, error: 'Texto ampliado demasiado largo (máx 240).' };
  const ic = String(icono ?? '').trim().toLowerCase();
  if (!ICONOS_EF.includes(ic)) return { ok: false, error: 'Elegí un icono válido.' };
  return { ok: true, hecho: { año: a, titulo: t, resumen: r, ampliado: am || r, icono: ic } };
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
