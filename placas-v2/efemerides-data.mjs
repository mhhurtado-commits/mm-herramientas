const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();

export const EFEMERIDES_SOURCES = [
  { id: 'tyc-sports', nombre: 'TyC Sports Efemérides', rol: 'descubrimiento', url: 'https://www.tycsports.com/efemerides.html' },
  { id: 'argentina-gob', nombre: 'Argentina.gob.ar', rol: 'verificación institucional', url: 'https://www.argentina.gob.ar/' },
  { id: 'archivo-general', nombre: 'Archivo General de la Nación', rol: 'verificación histórica', url: 'https://www.argentina.gob.ar/interior/archivo-general' },
  { id: 'biblioteca-nacional', nombre: 'Biblioteca Nacional Mariano Moreno', rol: 'verificación cultural', url: 'https://www.bn.gov.ar/' },
  { id: 'afa', nombre: 'Asociación del Fútbol Argentino', rol: 'verificación deportiva', url: 'https://www.afa.com.ar/' },
];

const SEED = [
  // Agosto: primera tanda argentina priorizada. TyC funciona como fuente de descubrimiento
  // y cada registro conserva el enlace de la nota para revisión editorial antes de publicar.
  {
    id: 'virreinato-rio-plata-1776', fecha: '08-01', alcance: 'nacional', categoria: 'historia', año: '1776',
    titulo: 'Se crea el Virreinato del Río de la Plata', resumen: 'La Corona española organiza el nuevo virreinato con capital en Buenos Aires.', icono: 'historia', prioridad: 1, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-de-este-1-de-agosto-que-paso-un-dia-como-hoy-id677090.html',
  },
  {
    id: 'san-martin-1816', fecha: '08-01', alcance: 'nacional', categoria: 'historia', año: '1816',
    titulo: 'San Martín asume el mando del Ejército de los Andes', resumen: 'El general prepara la campaña libertadora desde Cuyo.', icono: 'historia', prioridad: 2, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-de-este-1-de-agosto-que-paso-un-dia-como-hoy-id677090.html',
  },
  {
    id: 'river-boca-1948', fecha: '08-01', alcance: 'nacional', categoria: 'deportes', año: '1948',
    titulo: 'River logra su primera victoria en la Bombonera', resumen: 'El equipo millonario vence a Boca como visitante.', icono: 'futbol', prioridad: 3, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-de-este-1-de-agosto-que-paso-un-dia-como-hoy-id677090.html',
  },
  {
    id: 'boca-intercontinental-1978', fecha: '08-01', alcance: 'nacional', categoria: 'deportes', año: '1978',
    titulo: 'Boca gana su primera Copa Intercontinental', resumen: 'El club argentino obtiene el título mundial ante Borussia Mönchengladbach.', icono: 'futbol', prioridad: 4, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-de-este-1-de-agosto-que-paso-un-dia-como-hoy-id677090.html',
  },
  {
    id: 'florentina-gomez-miranda-2011', fecha: '08-01', alcance: 'nacional', categoria: 'politica', año: '2011',
    titulo: 'Muere Florentina Gómez Miranda', resumen: 'La abogada y legisladora deja una trayectoria ligada a los derechos de las mujeres.', icono: 'politica', prioridad: 5, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-de-este-1-de-agosto-que-paso-un-dia-como-hoy-id677090.html',
  },
  {
    id: 'primer-superclasico-1908', fecha: '08-02', alcance: 'nacional', categoria: 'deportes', año: '1908',
    titulo: 'Se juega el primer Boca-River', resumen: 'Los dos grandes clubes disputan su primer partido registrado.', icono: 'futbol', prioridad: 1, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-2-de-agosto-que-se-conmemora-hoy-id599464.html',
  },
  {
    id: 'estacion-retiro-1915', fecha: '08-02', alcance: 'nacional', categoria: 'historia', año: '1915',
    titulo: 'Se inaugura la estación Retiro', resumen: 'La terminal ferroviaria porteña comienza a funcionar en Buenos Aires.', icono: 'historia', prioridad: 2, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-2-de-agosto-que-se-conmemora-hoy-id599464.html',
  },
  {
    id: 'delfo-cabrera-1981', fecha: '08-02', alcance: 'nacional', categoria: 'deportes', año: '1981',
    titulo: 'Muere Delfo Cabrera', resumen: 'El atleta argentino, campeón olímpico de maratón, fallece en un accidente.', icono: 'deportes', prioridad: 3, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-2-de-agosto-que-se-conmemora-hoy-id599464.html',
  },
  {
    id: 'pastoriza-2004', fecha: '08-02', alcance: 'nacional', categoria: 'deportes', año: '2004',
    titulo: 'Muere José Omar Pastoriza', resumen: 'El exfutbolista y entrenador argentino fallece a los 62 años.', icono: 'futbol', prioridad: 4, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-2-de-agosto-que-se-conmemora-hoy-id599464.html',
  },
  {
    id: 'messi-seleccion-2005', fecha: '08-02', alcance: 'nacional', categoria: 'deportes', año: '2005',
    titulo: 'Messi recibe su primera convocatoria a la Selección', resumen: 'El delantero es citado por primera vez para jugar con Argentina.', icono: 'futbol', prioridad: 5, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-2-de-agosto-que-se-conmemora-hoy-id599464.html',
  },
  {
    id: 'remedios-escalada-1823', fecha: '08-03', alcance: 'nacional', categoria: 'historia', año: '1823',
    titulo: 'Muere Remedios de Escalada', resumen: 'Fallece en Buenos Aires la esposa del general José de San Martín.', icono: 'historia', prioridad: 1, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-3-de-agosto-que-se-conmemora-id454393.html',
  },
  {
    id: 'charro-moreno-1916', fecha: '08-03', alcance: 'nacional', categoria: 'deportes', año: '1916',
    titulo: 'Nace José Manuel Moreno', resumen: 'El Charro, figura histórica del fútbol argentino, nace en Buenos Aires.', icono: 'futbol', prioridad: 2, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-3-de-agosto-que-se-conmemora-id454393.html',
  },
  {
    id: 'nito-mestre-1952', fecha: '08-03', alcance: 'nacional', categoria: 'cultura', año: '1952',
    titulo: 'Nace Nito Mestre', resumen: 'El músico argentino, integrante de Sui Generis, celebra su nacimiento.', icono: 'musica', prioridad: 3, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-3-de-agosto-que-se-conmemora-id454393.html',
  },
  {
    id: 'mascherano-debut-2003', fecha: '08-03', alcance: 'nacional', categoria: 'deportes', año: '2003',
    titulo: 'Debuta Javier Mascherano en la Selección', resumen: 'El mediocampista juega su primer partido con Argentina.', icono: 'futbol', prioridad: 4, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-3-de-agosto-que-se-conmemora-id454393.html',
  },
  {
    id: 'dia-pescador-deportivo', fecha: '08-03', alcance: 'nacional', categoria: 'sociedad', año: '1903',
    titulo: 'Día del Pescador Deportivo', resumen: 'La fecha reconoce a quienes practican esta actividad en el país.', icono: 'sociedad', prioridad: 5, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-3-de-agosto-que-se-conmemora-id454393.html',
  },
  {
    id: 'arturo-illia-1900', fecha: '08-04', alcance: 'nacional', categoria: 'politica', año: '1900',
    titulo: 'Nace Arturo Illia', resumen: 'El médico y expresidente argentino nace en Pergamino.', icono: 'politica', prioridad: 1, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-4-de-agosto-que-se-conmemora-hoy-id677807.html',
  },
  {
    id: 'estudiantes-1905', fecha: '08-04', alcance: 'nacional', categoria: 'deportes', año: '1905',
    titulo: 'Se funda Estudiantes de La Plata', resumen: 'Nace uno de los clubes históricos del fútbol argentino.', icono: 'futbol', prioridad: 2, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-4-de-agosto-que-se-conmemora-hoy-id677807.html',
  },
  {
    id: 'fangio-1957', fecha: '08-04', alcance: 'nacional', categoria: 'deportes', año: '1957',
    titulo: 'Fangio logra su quinto título de Fórmula 1', resumen: 'El piloto argentino vuelve a consagrarse campeón mundial.', icono: 'deportes', prioridad: 3, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-4-de-agosto-que-se-conmemora-hoy-id677807.html',
  },
  {
    id: 'angelelli-1976', fecha: '08-04', alcance: 'nacional', categoria: 'historia', año: '1976',
    titulo: 'Muere Enrique Angelelli', resumen: 'El obispo de La Rioja fallece durante la última dictadura militar.', icono: 'historia', prioridad: 4, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-4-de-agosto-que-se-conmemora-hoy-id677807.html',
  },
  {
    id: 'dia-panadero-1887', fecha: '08-04', alcance: 'nacional', categoria: 'sociedad', año: '1887',
    titulo: 'Día Nacional del Panadero', resumen: 'La jornada reconoce a los trabajadores de la elaboración del pan.', icono: 'sociedad', prioridad: 5, verificada: true,
    fuente: 'TyC Sports', url_fuente: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-4-de-agosto-que-se-conmemora-hoy-id677807.html',
  },
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
  {
    id: 'curtiss-hawk-1940', fecha: '08-16', alcance: 'nacional', categoria: 'argentina', año: '1940',
    titulo: 'Primer vuelo del Curtiss Hawk argentino', resumen: 'Eduardo Correa prueba el caza metálico fabricado bajo licencia en el país.', icono: 'aviacion', prioridad: 1, verificada: true,
    fuente: 'Argentina.gob.ar', url_fuente: 'https://www.argentina.gob.ar/node/418752',
  },
  {
    id: 'grob-g120tp-2013', fecha: '08-16', alcance: 'nacional', categoria: 'argentina', año: '2013',
    titulo: 'Presentan el entrenador Grob G-120TP', resumen: 'La Fuerza Aérea Argentina incorpora un nuevo entrenador para sus aviadores.', icono: 'aviacion', prioridad: 2, verificada: true,
    fuente: 'Argentina.gob.ar', url_fuente: 'https://www.argentina.gob.ar/node/418752',
  },
  {
    id: 'incendio-rancheria-1792', fecha: '08-16', alcance: 'nacional', categoria: 'cultura', año: '1792',
    titulo: 'Se incendia el teatro La Ranchería', resumen: 'El primer teatro estable de Buenos Aires queda destruido por un incendio.', icono: 'teatro', prioridad: 3, verificada: true,
    fuente: 'Buenos Aires Ciudad', url_fuente: 'https://buenosaires.gob.ar/gcaba_historico/laciudad/calendario-historico/agosto',
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
  return items.map(normalizeEfemeride).filter(item => item?.fecha === key).sort((a, b) => (a.alcance === 'nacional' ? 0 : 1) - (b.alcance === 'nacional' ? 0 : 1) || a.prioridad - b.prioridad);
}

export function getSeedEfemerides() {
  return SEED.map(normalizeEfemeride).filter(Boolean);
}
