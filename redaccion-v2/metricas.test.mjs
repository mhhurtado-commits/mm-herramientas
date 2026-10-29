import test from 'node:test';
import assert from 'node:assert/strict';
import { palabras, contarAsteriscos, coincidenciasLargas } from './metricas.mjs';

test('palabras cuenta palabras reales', () => {
  assert.equal(palabras('  una dos   tres '), 3);
  assert.equal(palabras(''), 0);
});

test('contarAsteriscos cuenta las marcas de negrita', () => {
  assert.equal(contarAsteriscos('**uno** y **dos**'), 2);
  assert.equal(contarAsteriscos('texto limpio'), 0);
});

test('coincidenciasLargas detecta ocho palabras seguidas', () => {
  const original = 'El funcionario anunció una inversión de 8.500 millones de pesos y un plazo de ejecución de 18 meses.';
  const copia = 'Según el parte, el funcionario anunció una inversión de 8.500 millones de pesos y un plazo de ejecución de 18 meses.';
  assert.equal(coincidenciasLargas(original, copia).length > 0, true);
  assert.deepEqual(coincidenciasLargas(original, 'Una nota completamente distinta sobre otro tema.'), []);
});
