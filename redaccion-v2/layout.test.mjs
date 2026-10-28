import test from 'node:test';
import assert from 'node:assert/strict';
import { AJUSTES_VISUALES, aplicarAjustesVisuales } from './layout.mjs';

function documentoFalso() {
  const creados = [];
  return {
    creados,
    head: { appendChild: el => creados.push(el) },
    createElement: () => ({ id: '', textContent: '' }),
    getElementById: id => creados.find(el => el.id === id) || null,
  };
}

test('los ajustes visuales se aplican una sola vez', () => {
  const documento = documentoFalso();
  assert.equal(aplicarAjustesVisuales(documento), true);
  assert.equal(documento.creados.length, 1);
  assert.equal(documento.creados[0].id, 'mm-ajustes-redaccion-v2');
  assert.equal(aplicarAjustesVisuales(documento), false);
  assert.equal(documento.creados.length, 1);
});

test('la grilla queda 50/50 como en /redaccion, sin proporciones propias', () => {
  assert.equal(/grid-template-columns/.test(AJUSTES_VISUALES), false);
});

test('las imágenes se achican sin tocar la tipografía del contenido', () => {
  assert.match(AJUSTES_VISUALES, /max-height:\s*170px/);
  assert.match(AJUSTES_VISUALES, /#ref-img-original \.ref-portada img \{ max-height: 140px; \}/);
  const tamanos = [...AJUSTES_VISUALES.matchAll(/font-size:\s*([^;]+);/g)].map(m => m[1].trim());
  assert.deepEqual(tamanos, ['9px'], 'sólo el chip de crédito define tamaño de fuente');
  assert.equal(/\.ref-cuerpo|\.ref-titulo|\.mm-input|\.mm-textarea/.test(AJUSTES_VISUALES), false);
});

test('la portada trae marco y recorte: sin eso la imagen sale a tamaño natural', () => {
  assert.match(AJUSTES_VISUALES, /\.ref-portada \{ position: relative;/);
  assert.match(AJUSTES_VISUALES, /object-fit: cover/);
  assert.match(AJUSTES_VISUALES, /\.ref-portada-chip \{ position: absolute;/);
});
