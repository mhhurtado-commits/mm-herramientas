const {
  normalizarInfografia,
  validarBloque,
  normalizarLinea
} = require('./infographics.js');

const textData = normalizarInfografia({
  titulo: 'Movilidad',
  lineas: ['Vehículos: 1,2 M', 'Dato editorial sin valor'],
  fuente: 'Fuente oficial'
});
if (textData.bloques.length !== 2) throw new Error('No se normalizaron todas las líneas');
if (textData.bloques[0].tipo !== 'dato' || textData.bloques[0].etiqueta !== 'Vehículos' || textData.bloques[0].valor !== '1,2 M') throw new Error('No se normalizó una línea etiqueta/valor');
if (textData.bloques[1].tipo !== 'texto') throw new Error('Una línea libre debe convertirse en texto');
if (textData.fuente !== 'Fuente oficial') throw new Error('No se conservó la fuente');

const modularData = normalizarInfografia({
  titulo: 'Tráfico',
  bajada: 'Resumen',
  template_sugerido: 'datos',
  color_principal: '#a6ce39',
  color_secundario: '#16201b',
  bloques: [
    { tipo: 'dato', icono: '🚗', etiqueta: 'Vehículos', valor: '1,2 M', detalle: '+4,8%' },
    { tipo: 'barra', etiqueta: 'Distribución', items: [{ nombre: 'Autos', valor: 62 }, { nombre: 'Motos', valor: 38 }] },
    { tipo: 'ranking', etiqueta: 'Ranking', items: [{ nombre: 'Centro', valor: 1 }] }
  ]
});
if (modularData.template !== 'datos' || modularData.bloques.length !== 3) throw new Error('No se normalizó el JSON modular');
if (modularData.bloques[1].items[0].valor !== 62) throw new Error('No se conservaron los items de una barra');

const invalid = validarBloque({ tipo: 'inexistente', etiqueta: 'No válido' });
if (invalid.ok || !invalid.warning) throw new Error('Un tipo de bloque desconocido debe generar advertencia');
const badColor = normalizarInfografia({ color_principal: 'rojo', bloques: [{ tipo: 'dato', valor: '10' }] });
if (badColor.color1 !== '#a6ce39' || !badColor.warnings.length) throw new Error('No se aplicó fallback para color inválido');

const line = normalizarLinea('Población: 230.000');
if (line.tipo !== 'dato' || line.valor !== '230.000') throw new Error('normalizarLinea no separa etiqueta y valor');

console.log('infographics.test.js: OK');
