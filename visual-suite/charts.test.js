const {
  calcularGraficoLayout,
  normalizarTituloGrafico,
  obtenerPreviewAspectRatio,
  obtenerEstiloGrafico
} = require('./charts.js');

const square = calcularGraficoLayout(1600, 1600, 'square');
if (square.chart.x < 0 || square.chart.y < 0) throw new Error('El gráfico cuadrado no debe desbordar por arriba o izquierda');
if (square.chart.x + square.chart.w > 1600 || square.chart.y + square.chart.h > 1600) throw new Error('El gráfico cuadrado no debe desbordar el canvas');
if (square.chart.w < 900 || square.chart.h < 480) throw new Error('El gráfico cuadrado debe conservar una superficie legible');

const portrait = calcularGraficoLayout(1350, 1688, 'portrait');
if (portrait.chart.x + portrait.chart.w > 1350 || portrait.chart.y + portrait.chart.h > 1688) throw new Error('El gráfico vertical no debe desbordar el canvas');

if (obtenerPreviewAspectRatio('square') !== '1 / 1') throw new Error('La preview cuadrada debe conservar proporción 1:1');
if (obtenerPreviewAspectRatio('landscape') !== '16 / 9') throw new Error('La preview horizontal debe conservar proporción 16:9');

const title = normalizarTituloGrafico('Inflación mensual en Argentina (Primer semestre 2026)');
if (title.length > 48 || !title.endsWith('…')) throw new Error('El título de gráficos debe normalizarse como el resto de Visual Suite');

const lineStyle = obtenerEstiloGrafico('line', 6);
if (!lineStyle.fill || lineStyle.borderWidth < 2 || lineStyle.pointRadius < 4) throw new Error('El estilo de líneas debe ser visual y legible');
const barStyle = obtenerEstiloGrafico('bar', 6);
if (barStyle.borderRadius < 6 || barStyle.borderWidth < 2) throw new Error('El estilo de barras debe tener volumen visual');

console.log('charts.test.js: OK');
