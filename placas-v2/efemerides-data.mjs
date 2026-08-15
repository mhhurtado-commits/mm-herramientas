const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();

const SEED = [
  {
    id: 'argentinos-juniors-1904', fecha: '08-15', alcance: 'nacional', categoria: 'deportes', año: '1904',
    titulo: 'Fundación de Argentinos Juniors', resumen: 'Se funda el club en Buenos Aires.', prioridad: 1, verificada: true,
    fuente: 'Argentinos Juniors', url_fuente: 'https://argentinosjuniors.com.ar/el-club/historia/',
  },
  {
    id: 'canal-panama-1914', fecha: '08-15', alcance: 'internacional', categoria: 'mundo', año: '1914',
    titulo: 'Apertura del Canal de Panamá', resumen: 'El canal se abre oficialmente al tránsito.', prioridad: 2, verificada: true,
    fuente: 'Autoridad del Canal de Panamá', url_fuente: 'https://pancanal.com/culminacion-de-la-construccion/',
  },
  {
    id: 'woodstock-1969', fecha: '08-15', alcance: 'internacional', categoria: 'cultura', año: '1969',
    titulo: 'Comienza el festival de Woodstock', resumen: 'El festival musical se inicia en Bethel, Nueva York.', prioridad: 3, verificada: true,
    fuente: 'Woodstock', url_fuente: 'https://www.woodstock.com/woodstock-1969/',
  },
];

function normalizeDateKey(value) {
  const match = String(value ?? '').match(/^(?:\d{4}-)?(\d{2})-(\d{2})$/);
  return match ? `${match[1]}-${match[2]}` : '';
}

export function normalizeEfemeride(item = {}) {
  const normalized = {
    id: clean(item.id), fecha: normalizeDateKey(item.fecha), alcance: clean(item.alcance), categoria: clean(item.categoria), icono: clean(item.icono) || clean(item.categoria),
    año: clean(item.año || item.anio), titulo: clean(item.titulo), resumen: clean(item.resumen), prioridad: Number(item.prioridad) || 99,
    fuente: clean(item.fuente), url_fuente: clean(item.url_fuente || item.urlFuente), verificada: item.verificada === true,
  };
  return normalized.fecha && normalized.titulo && normalized.fuente && normalized.url_fuente && normalized.verificada ? normalized : null;
}

export function getEfemeridesForDate(date, items = SEED) {
  const key = normalizeDateKey(date);
  return items.map(normalizeEfemeride).filter(item => item?.fecha === key).sort((a, b) => a.prioridad - b.prioridad);
}

export function getSeedEfemerides() {
  return SEED.map(normalizeEfemeride).filter(Boolean);
}
