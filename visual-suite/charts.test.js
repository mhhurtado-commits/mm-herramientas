const { calcularGraficoLayout } = require('./charts.js');

const square = calcularGraficoLayout(1600, 1600, 'square');
if (square.chart.x < 0 || square.chart.y < 0) throw new Error('El gráfico cuadrado no debe desbordar por arriba o izquierda');
if (square.chart.x + square.chart.w > 1600 || square.chart.y + square.chart.h > 1600) throw new Error('El gráfico cuadrado no debe desbordar el canvas');
if (square.chart.w < 900 || square.chart.h < 480) throw new Error('El gráfico cuadrado debe conservar una superficie legible');

const portrait = calcularGraficoLayout(1350, 1688, 'portrait');
if (portrait.chart.x + portrait.chart.w > 1350 || portrait.chart.y + portrait.chart.h > 1688) throw new Error('El gráfico vertical no debe desbordar el canvas');

console.log('charts.test.js: OK');
