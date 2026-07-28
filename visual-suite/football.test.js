const {
  normalizarFootballJSON,
  validarFootballData,
  footballAssetKeyFromName
} = require('./football.js');

const valido = normalizarFootballJSON({
  fecha: 'martes 28 de julio de 2026',
  titulo: 'Partidos de hoy',
  partidos: [{
    hora: '19:00',
    competicion: 'Liga Profesional',
    local: 'Equipo A',
    visitante: 'Equipo B',
    estado: 'programado'
  }]
});

if (!validarFootballData(valido).ok) throw new Error('El JSON válido fue rechazado');
if (validarFootballData({}).ok) throw new Error('Un JSON vacío fue aceptado');
if (normalizarFootballJSON({ partidos: [{ local: 'A' }] }).partidos[0].visitante !== 'Por confirmar') {
  throw new Error('Los valores faltantes no fueron normalizados');
}
if (footballAssetKeyFromName('Gimnasia y Esgrima (Mendoza)') !== 'gimnasia-y-esgrima') {
  throw new Error('No se resolvió la clave de Gimnasia Mendoza');
}
if (footballAssetKeyFromName('Estudiantes de Río Cuarto') !== 'estudiantes-de-rio-cuarto') {
  throw new Error('No se normalizaron acentos en el nombre del equipo');
}

console.log('football.test.js: OK');
