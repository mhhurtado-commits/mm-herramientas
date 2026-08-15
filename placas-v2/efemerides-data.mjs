const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();

export const EFEMERIDES_SOURCES = [
  { id: 'tyc-sports', nombre: 'TyC Sports Efemérides', rol: 'descubrimiento', url: 'https://www.tycsports.com/efemerides.html' },
  { id: 'argentina-gob', nombre: 'Argentina.gob.ar', rol: 'verificación institucional', url: 'https://www.argentina.gob.ar/' },
  { id: 'archivo-general', nombre: 'Archivo General de la Nación', rol: 'verificación histórica', url: 'https://www.argentina.gob.ar/interior/archivo-general' },
  { id: 'biblioteca-nacional', nombre: 'Biblioteca Nacional Mariano Moreno', rol: 'verificación cultural', url: 'https://www.bn.gov.ar/' },
  { id: 'afa', nombre: 'Asociación del Fútbol Argentino', rol: 'verificación deportiva', url: 'https://www.afa.com.ar/' },
];

const SEED = [
  {
    id: 'argentinos-juniors-1904', fecha: '08-15', alcance: 'nacional', categoria: 'deportes', año: '1904',
    titulo: 'Fundación de Argentinos Juniors', resumen: 'Nace en Villa Crespo, en una obra en construcción.', icono: 'futbol', prioridad: 1, verificada: true,
    fuente: 'Argentinos Juniors', url_fuente: 'https://argentinosjuniors.com.ar/el-club/historia/',
  },
  {
    id: 'canal-panama-1914', fecha: '08-15', alcance: 'internacional', categoria: 'mundo', año: '1914',
    titulo: 'Apertura del Canal de Panamá', resumen: 'La vía interoceánica conecta el Atlántico y el Pacífico.', icono: 'canal', prioridad: 2, verificada: true,
    fuente: 'Autoridad del Canal de Panamá', url_fuente: 'https://pancanal.com/culminacion-de-la-construccion/',
  },
  {
    id: 'woodstock-1969', fecha: '08-15', alcance: 'internacional', categoria: 'cultura', año: '1969',
    titulo: 'Comienza el festival de Woodstock', resumen: 'Tres días de música reúnen a miles en Bethel, Nueva York.', icono: 'musica', prioridad: 3, verificada: true,
    fuente: 'Woodstock', url_fuente: 'https://www.woodstock.com/woodstock-1969/',
  },
  {
    id: 'chipre-independencia-1960', fecha: '08-16', alcance: 'internacional', categoria: 'mundo', año: '1960',
    titulo: 'Chipre se independiza', resumen: 'La República de Chipre nace tras el fin del dominio británico.', icono: 'mundo', prioridad: 1, verificada: true,
    fuente: 'Office of the Historian', url_fuente: 'https://history.state.gov/countries/cyprus',
  },
  {
    id: 'elvis-presley-1977', fecha: '08-16', alcance: 'internacional', categoria: 'cultura', año: '1977',
    titulo: 'Muere Elvis Presley', resumen: 'El cantante fallece a los 42 años en Graceland, Memphis.', icono: 'musica', prioridad: 2, verificada: true,
    fuente: 'Graceland', url_fuente: 'https://www.graceland.com/1974---1977',
  },
  {
    id: 'oro-klondike-1896', fecha: '08-16', alcance: 'internacional', categoria: 'economia', año: '1896',
    titulo: 'Descubren oro en el Klondike', resumen: 'El hallazgo en Canadá dispara una de las grandes fiebres del oro.', icono: 'mundo', prioridad: 3, verificada: true,
    fuente: 'Parks Canada', url_fuente: 'https://parks.canada.ca/lhn-nhs/yt/klondike/culture/lhn-hns-disc',
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
