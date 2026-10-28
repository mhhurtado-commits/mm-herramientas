import test from 'node:test';
import assert from 'node:assert/strict';
import { textoParaCuerpo, tituloSiFalta, mensajeExtraccion, MAX_IMAGENES } from './fuente-imagen.mjs';

test('el texto extraído se agrega al cuerpo con separador, sin pisar lo escrito', () => {
  assert.equal(textoParaCuerpo('', 'Texto de la imagen'), 'Texto de la imagen');
  assert.equal(textoParaCuerpo('  ', 'Texto'), 'Texto');
  assert.equal(textoParaCuerpo('Lo que ya estaba', 'Texto de la imagen'), 'Lo que ya estaba\n\n---\n\nTexto de la imagen');
  assert.equal(textoParaCuerpo('Lo que ya estaba', '   '), 'Lo que ya estaba');
});

test('el título sugerido sólo se usa si el campo está vacío', () => {
  assert.equal(tituloSiFalta('', 'Título de la IA'), 'Título de la IA');
  assert.equal(tituloSiFalta('Mi título', 'Título de la IA'), 'Mi título');
  assert.equal(tituloSiFalta('', ''), '');
});

test('el mensaje de extracción informa cuántas imágenes se procesaron', () => {
  assert.equal(mensajeExtraccion({ imagenes_procesadas: 1 }), '✓ 1 imagen procesada');
  assert.equal(mensajeExtraccion({ imagenes_procesadas: 3 }), '✓ 3 imágenes procesadas');
  assert.equal(mensajeExtraccion({ imagenes_procesadas: 2, errores: ['x'] }), '✓ 2 imágenes procesadas · 1 con error');
  assert.equal(mensajeExtraccion({}), 'No se pudo extraer texto de las imágenes');
  assert.equal(mensajeExtraccion(null), 'No se pudo extraer texto de las imágenes');
});

test('el tope de imágenes coincide con el que acepta el servidor', () => {
  assert.equal(MAX_IMAGENES, 5);
});
