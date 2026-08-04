const {
  footballSocialTitle,
  footballSocialSelectFeaturedMatch,
  footballSocialStateLabel,
  footballSocialLayoutFor
} = require('./football-social.js');

if (footballSocialTitle('Partidos de hoy con toda la agenda argentina y CONMEBOL') !== 'Partidos de hoy') {
  throw new Error('El título social no se ajustó a una longitud editorial segura');
}

const matches = [
  { local: 'Banfield', visitante: 'Sarmiento', destacado: false },
  { local: 'River Plate', visitante: 'Boca Juniors', destacado: true },
  { local: 'Tigre', visitante: 'Nacional', destacado: false }
];
if (footballSocialSelectFeaturedMatch(matches).local !== 'River Plate') {
  throw new Error('No se priorizó el partido destacado');
}
if (footballSocialSelectFeaturedMatch([{ local: 'A', destacado: false }]).local !== 'A') {
  throw new Error('No se usó el primer partido como fallback');
}
if (footballSocialStateLabel('finalizado', '2 - 1') !== 'FINALIZADO · 2 - 1') {
  throw new Error('No se priorizó el resultado en el estado social');
}
if (footballSocialStateLabel('programado', '') !== 'PROGRAMADO') {
  throw new Error('No se normalizó el estado programado');
}
if (footballSocialLayoutFor('square', 1).hero !== true || footballSocialLayoutFor('square', 5).columns !== 2) {
  throw new Error('La composición social no se adaptó a la cantidad de partidos');
}
if (footballSocialLayoutFor('story', 6).columns !== 1) {
  throw new Error('Historia debe usar una sola columna');
}

console.log('football-social.test.js: OK');
