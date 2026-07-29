const {
  normalizarFootballJSON,
  validarFootballData,
  footballAssetKeyFromName,
  esCompeticionFootballPermitida,
  footballDisplayName,
  footballDesignPreset,
  footballPromptConfig
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
if (esCompeticionFootballPermitida('Primera División de Paraguay')) {
  throw new Error('Se permitió una liga nacional extranjera');
}
if (!esCompeticionFootballPermitida('Copa Sudamericana')) {
  throw new Error('Se rechazó una competencia CONMEBOL válida');
}
if (!esCompeticionFootballPermitida('Copa Libertadores')) {
  throw new Error('Se rechazó Copa Libertadores');
}
if (!esCompeticionFootballPermitida('Copa Argentina')) {
  throw new Error('Se rechazó Copa Argentina');
}
if (footballDesignPreset('Competiciones CONMEBOL', 'resultados de la jornada').accent !== '#52c7d8') {
  throw new Error('No se aplicó el preset visual CONMEBOL');
}
if (footballDesignPreset('Fútbol argentino', 'partido destacado').cardFill !== 'rgba(255,255,255,.99)') {
  throw new Error('No se aplicó el preset de partido destacado');
}
const argentinaPrompt = footballPromptConfig('Fútbol argentino', 'partidos del día');
if (argentinaPrompt.jsonScope !== 'Argentina: Liga Profesional + Copa Argentina' || argentinaPrompt.scopeText.includes('INCLUIR Libertadores')) {
  throw new Error('El prompt argentino todavía incluye CONMEBOL');
}
const conmebolPrompt = footballPromptConfig('Competiciones CONMEBOL', 'resultados de la jornada');
if (conmebolPrompt.jsonScope !== 'Torneos CONMEBOL de clubes' || !conmebolPrompt.typeRule.includes('resultado')) {
  throw new Error('El prompt CONMEBOL no refleja alcance y tipo');
}
const assetAliases = {
  'gimnasia-mza': 'gimnasia-y-esgrima',
  'gimnasia-mendoza': 'gimnasia-y-esgrima',
  'racing': 'racing-club',
  'racing-club': 'racing-club',
  'estudiantes-rc': 'estudiantes-de-rio-cuarto'
};
for (const [input, expected] of Object.entries(assetAliases)) {
  if (footballAssetKeyFromName(input) !== expected) throw new Error(`Alias de escudo incorrecto para ${input}`);
}

const displayNames = {
  'Sarmiento de Junín': 'Sarmiento (J)',
  'Gimnasia y Esgrima (Mendoza)': 'Gimnasia (Mza.)',
  'Nacional de Uruguay': 'Nacional (URU)',
  'Argentinos Juniors': 'Argentinos Jrs.',
  'Estudiantes de Río Cuarto': 'Estudiantes (RC)',
  'Universidad Central de Venezuela': 'UCV',
  'Santos FC': 'Santos'
};
for (const [full, expected] of Object.entries(displayNames)) {
  if (footballDisplayName(full) !== expected) throw new Error(`Abreviatura incorrecta para ${full}`);
}

console.log('football.test.js: OK');
