import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getEfemeridesForDate, getSeedEfemerides, normalizeEfemeride } from './efemerides-data.mjs';

test('normaliza y rechaza efemérides sin fuente verificada', () => {
  assert.equal(normalizeEfemeride({ titulo: 'Dato', fecha: '08-15', verificada: false }), null);
  assert.equal(normalizeEfemeride({ titulo: 'Dato', fecha: '2026-08-15', fuente: 'Archivo', url_fuente: 'https://example.com', verificada: true })?.fecha, '08-15');
});

test('obtiene efemérides verificadas por fecha y prioridad', () => {
  const items = getEfemeridesForDate('2026-08-15');
  assert.equal(items.length, 3);
  assert.deepEqual(items.map(item => item.año), ['1904', '1914', '1969']);
  assert.equal(getEfemeridesForDate('2026-08-16').length, 0);
});

test('la semilla tiene fuentes y no supera tres destacados', () => {
  const items = getSeedEfemerides();
  assert.ok(items.every(item => item.verificada && item.url_fuente.startsWith('https://')));
  assert.ok(items.length <= 3);
});
