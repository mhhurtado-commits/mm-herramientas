import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EFEMERIDES_SOURCES, getEfemeridesForDate, getSeedEfemerides, normalizeEfemeride } from './efemerides-data.mjs';

test('prioriza TyC como descubrimiento y conserva fuentes institucionales', () => {
  assert.equal(EFEMERIDES_SOURCES.find(source => source.id === 'tyc-sports')?.rol, 'descubrimiento');
  assert.ok(EFEMERIDES_SOURCES.some(source => source.id === 'archivo-general'));
});

test('normaliza y rechaza efemérides sin fuente verificada', () => {
  assert.equal(normalizeEfemeride({ titulo: 'Dato', fecha: '08-15', verificada: false }), null);
  assert.equal(normalizeEfemeride({ titulo: 'Dato', fecha: '2026-08-15', fuente: 'Archivo', url_fuente: 'https://example.com', verificada: true })?.fecha, '08-15');
});

test('obtiene efemérides verificadas por fecha y prioridad', () => {
  const items = getEfemeridesForDate('2026-08-15');
  assert.equal(items.length, 3);
  assert.deepEqual(items.map(item => item.año), ['1904', '1914', '1969']);
  assert.deepEqual(getEfemeridesForDate('2026-08-16').map(item => item.año), ['1940', '2013', '1792', '1960', '1977', '1896']);
  assert.equal(getEfemeridesForDate('2026-08-17').length, 0);
});

test('la semilla tiene fuentes y no supera tres destacados', () => {
  const items = getSeedEfemerides();
  assert.ok(items.every(item => item.verificada && item.url_fuente.startsWith('https://')));
  assert.ok(getEfemeridesForDate('08-15').length >= 3);
  assert.ok(getEfemeridesForDate('08-16').length >= 5);
});

test('la semilla usa iconos especificos para cada efemeride', () => {
  assert.deepEqual(getEfemeridesForDate('08-15').map(item => item.icono), ['futbol', 'canal', 'musica']);
  assert.deepEqual(getEfemeridesForDate('08-16').slice(0, 3).map(item => item.icono), ['aviacion', 'aviacion', 'teatro']);
});

test('la semilla usa resúmenes concretos y breves', () => {
  const summaries = getEfemeridesForDate('08-15').map(item => item.resumen);
  assert.ok(summaries.every(summary => summary.length <= 72));
  assert.ok(summaries[0].includes('Villa Crespo'));
});

test('normaliza un icono explicito y aplica fallback por categoria', () => {
  assert.equal(normalizeEfemeride({ titulo: 'Dato', fecha: '08-15', categoria: 'deportes', fuente: 'Archivo', url_fuente: 'https://example.com', verificada: true }).icono, 'deportes');
  assert.equal(normalizeEfemeride({ titulo: 'Dato', fecha: '08-15', categoria: 'cultura', icono: 'musica', fuente: 'Archivo', url_fuente: 'https://example.com', verificada: true }).icono, 'musica');
});
