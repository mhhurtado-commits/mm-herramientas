// alertas/renderer.test.mjs — tests del layout dinámico del cuerpo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORMATS, PISO_ESCALA, TOPE_ESCALA, calcularFactor, renderAlertasPlaca } from './renderer.mjs';

test('FORMATS exactos', () => {
  assert.deepEqual(FORMATS['1:1'], { width: 1600, height: 1600 });
  assert.deepEqual(FORMATS['4:5'], { width: 1350, height: 1688 });
  assert.deepEqual(FORMATS['9:16'], { width: 1080, height: 1920 });
});

test('calcularFactor: sube con disponibilidad, queda en 1 en el punto natural', () => {
  assert.equal(calcularFactor(1000, 1000), 1);
  assert.equal(calcularFactor(1000, 1600), 1.6);
  assert.equal(calcularFactor(1000, 400), PISO_ESCALA);
  assert.equal(calcularFactor(1000, 100000), TOPE_ESCALA);
});

test('calcularFactor: degenerados nunca devuelven NaN', () => {
  assert.equal(calcularFactor(0, 500), TOPE_ESCALA);
  assert.equal(calcularFactor(NaN, 500), TOPE_ESCALA);
  assert.equal(calcularFactor(1000, 0), PISO_ESCALA);
  assert.equal(calcularFactor(1000, -5), PISO_ESCALA);
});
