const {
  normalizarInfografia,
  validarBloque,
  normalizarLinea,
  calcularInfografiaLayout,
  infografiaBloqueRect,
  ajustarTextoCanvas,
  dibujarTextoAjustado
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

const comparisonData = normalizarInfografia({ bloques: [
  { tipo: 'comparacion', izquierda: { titulo: 'Vehiculos 2025', valor: '2.928' }, derecha: { titulo: 'Vehiculos 2026', valor: '6.077' } }
] });
if (comparisonData.bloques[0].tipo !== 'comparacion' || comparisonData.bloques[0].items.length !== 2) throw new Error('Left/right comparison must become two columns');

const layout = calcularInfografiaLayout(1600, 1600, { bloques: modularData.bloques, template: 'datos' });
if (!layout.blocks.length || layout.blocks.some(rect => rect.x < 0 || rect.y < 0 || rect.x + rect.w > 1600 || rect.y + rect.h > 1600)) throw new Error('El layout cuadrado desborda el canvas');
const storyRect = infografiaBloqueRect('dato', 5, 6, 1080, 1920, 'simple');
if (storyRect.x < 0 || storyRect.y < 0 || storyRect.x + storyRect.w > 1080 || storyRect.y + storyRect.h > 1920) throw new Error('El layout story desborda el canvas');
const fakeCtx = { font: '', measureText: value => ({ width: String(value).length * 20 }) };
const fitted = ajustarTextoCanvas(fakeCtx, 'Este texto debe ajustarse', 100, 2, 30);
if (fitted.lines.length > 2 || fitted.fontSize < 10) throw new Error('El ajuste de texto no respeta límites');

const drawCalls = [];
const drawCtx = {
  font: '',
  measureText: value => ({ width: String(value).length * 10 }),
  fillText: (text, x, y) => drawCalls.push({ text, x, y })
};
dibujarTextoAjustado(drawCtx, 'Controles vehiculares y siniestralidad vial', 180, 2, 30, 14, 10, 20);
if (drawCalls.length > 2) throw new Error('Long text must respect available lines');
if (drawCalls.some(call => call.x > 194)) throw new Error('Adjusted text must stay within its area');

console.log('infographics.test.js: OK');
