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
