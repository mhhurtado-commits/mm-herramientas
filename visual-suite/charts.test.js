const {
  calcularGraficoLayout,
  normalizarTituloGrafico,
  obtenerPreviewAspectRatio,
  obtenerEstiloGrafico,
  construirPromptGrafico
} = require('./charts.js');
const fs = require('fs');
const rendererSource = fs.readFileSync(require.resolve('./charts.js'), 'utf8');

const square = calcularGraficoLayout(1600, 1600, 'square');
if (square.chart.x < 0 || square.chart.y < 0) throw new Error('El gráfico cuadrado no debe desbordar por arriba o izquierda');
if (square.chart.x + square.chart.w > 1600 || square.chart.y + square.chart.h > 1600) throw new Error('El gráfico cuadrado no debe desbordar el canvas');
if (square.chart.w < 900 || square.chart.h < 480) throw new Error('El gráfico cuadrado debe conservar una superficie legible');
if (square.card.h <= 1100) throw new Error('La placa debe aprovechar mejor el espacio vertical disponible');
if (!square.chartSafeArea) throw new Error('El layout debe exponer un área segura para el gráfico');
if (square.chartSafeArea.x < square.card.x || square.chartSafeArea.y < square.headerH) throw new Error('El área segura no puede invadir el header');
if (square.chartSafeArea.y + square.chartSafeArea.h > 1600 - square.footerH - 80) throw new Error('El área segura no puede invadir el footer');
if (square.chartSafeArea.w / square.chartSafeArea.h <= 0) throw new Error('El área segura debe tener proporción válida');
if (rendererSource.includes('Visualización de datos')) throw new Error('El renderer no debe superponer una etiqueta auxiliar al gráfico');
if (rendererSource.includes('roundRect(layout.card')) throw new Error('El gráfico no debe renderizarse dentro de una tarjeta intermedia');

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

const prompt = construirPromptGrafico('Inflación mensual argentina 2026');
if (!prompt.includes('42 caracteres') || !prompt.includes('tratamiento_visual')) throw new Error('El prompt debe guiar título y tratamiento visual');
if (!prompt.includes('NO uses puntos suspensivos')) throw new Error('El prompt debe evitar títulos truncados');

console.log('charts.test.js: OK');
