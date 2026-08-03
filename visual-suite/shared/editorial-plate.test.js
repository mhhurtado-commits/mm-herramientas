const assert = require('assert');
const {
  EDITORIAL_FORMATS,
  fitEditorialTitle,
  getEditorialLayout,
  buildForecastSlots,
  buildChartGeometry,
  render
} = require('./editorial-plate.js');

// The social formats are physical output sizes, not CSS-scaled previews.
assert.deepStrictEqual(EDITORIAL_FORMATS.square, { width: 1600, height: 1600, ratio: '1 / 1' });
assert.deepStrictEqual(EDITORIAL_FORMATS.portrait, { width: 1350, height: 1688, ratio: '4 / 5' });

const title = fitEditorialTitle('Reconstrucción de la Ruta Nacional 143 entre Pareditas y San Rafael', 'square');
assert.ok(title.text.length <= 42, 'long editorial titles must be shortened before layout');
assert.ok(title.fontSize >= 54, 'title must never become unreadable');

for (const format of ['square', 'portrait']) {
  const layout = getEditorialLayout(format);
  assert.ok(layout.content.top > layout.header.bottom, 'content must start below header');
  assert.ok(layout.content.bottom < layout.footer.top, 'content must finish before footer');
}

const forecast = buildForecastSlots([{ label: 'Mañana' }, { label: 'Tarde' }, { label: 'Noche' }], 'square');
assert.strictEqual(forecast.length, 3);
assert.ok(forecast.every(slot => slot.width > 200), 'forecast slots need a readable mobile width');

const chart = buildChartGeometry(['Ene', 'Feb', 'Mar', 'Abr'], [2.9, 2.9, 3.4, 2.6], 'square');
assert.strictEqual(chart.points.length, 4);
assert.ok(chart.labels.bottom < chart.plot.y, 'chart values need their own annotation band');

const plate = render({
  format: 'square', section: 'GRÁFICOS', title: 'Inflación mensual en Argentina',
  source: 'INDEC', type: 'chart', chartType: 'bar', labels: ['Ene', 'Feb'], values: [2.9, 3.4]
});
assert.ok(plate.startsWith('<svg'), 'preview and export must share a standalone SVG');
assert.ok(!plate.includes('<foreignObject'), 'editorial art must not rely on browser-specific HTML capture');
assert.ok(!/(?:href|src)="https?:\/\//.test(plate), 'exported SVG must not depend on remote visual assets');

console.log('editorial-plate tests: OK');
