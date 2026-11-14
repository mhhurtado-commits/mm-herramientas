import test from 'node:test';
import assert from 'node:assert/strict';
import { hoyArgentina, etiquetaCategoria } from './placa-model.mjs';

test('hoyArgentina devuelve YYYY-MM-DD', () => {
  assert.match(hoyArgentina(), /^\d{4}-\d{2}-\d{2}$/);
});

test('etiquetaCategoria mapea claves conocidas', () => {
  assert.equal(etiquetaCategoria({ icono: 'politica' }), 'POLÍTICA');
  assert.equal(etiquetaCategoria({ icono: 'historia' }), 'HISTORIA');
  assert.equal(etiquetaCategoria({ icono: 'musica' }), 'MÚSICA');
  assert.equal(etiquetaCategoria({ icono: 'economia' }), 'ECONOMÍA');
  assert.equal(etiquetaCategoria({ icono: 'aviacion' }), 'AVIACIÓN');
});

test('etiquetaCategoria usa categoria si icono falta', () => {
  assert.equal(etiquetaCategoria({ categoria: 'sociedad' }), 'SOCIEDAD');
});

test('etiquetaCategoria desconocida queda en mayúsculas, sin inventarse', () => {
  assert.equal(etiquetaCategoria({ icono: 'otro', categoria: 'cocina' }), 'COCINA');
  assert.equal(etiquetaCategoria({}), 'EFEMÉRIDE');
});