import test from 'node:test';
import assert from 'node:assert/strict';
import { createEditorialHandoff, parseEditorialHandoff } from './output-handoff.mjs';

test('crea y recupera un handoff de salida editorial', () => {
  const editorialPackage = { tipo: 'noticia_editorial', version: 2, fuente: { url: 'https://example.com' } };
  const handoff = parseEditorialHandoff(createEditorialHandoff(editorialPackage, 'reel'));
  assert.equal(handoff.output, 'reel');
  assert.deepEqual(handoff.package, editorialPackage);
});

test('preserva el destino video para el editor vertical', () => {
  const handoff = parseEditorialHandoff(createEditorialHandoff({ tipo: 'noticia_editorial' }, 'video'));
  assert.equal(handoff.output, 'video');
});

test('rechaza handoffs incompletos o inválidos', () => {
  assert.equal(parseEditorialHandoff('{"output":"placa","package":{}}'), null);
  assert.equal(parseEditorialHandoff('no-json'), null);
});

test("createEditorialHandoff admite output 'whatsapp'", () => {
  const handoff = createEditorialHandoff({ tipo: 'noticia_editorial', version: 2 }, 'whatsapp');
  assert.equal(JSON.parse(handoff).output, 'whatsapp');
});

test("createEditorialHandoff admite output 'placas'", () => {
  const handoff = createEditorialHandoff({ tipo: 'noticia_editorial', version: 2 }, 'placas');
  assert.equal(JSON.parse(handoff).output, 'placas');
});

test("createEditorialHandoff admite origen 'publicar' y parseEditorialHandoff lo conserva", () => {
  const parsed = parseEditorialHandoff(createEditorialHandoff({ tipo: 'noticia_editorial', version: 2 }, 'whatsapp', 'publicar'));
  assert.equal(parsed.origen, 'publicar');
});

test('output inválido sigue rechazado', () => {
  assert.equal(parseEditorialHandoff(JSON.stringify({ output: 'otro', package: { tipo: 'noticia_editorial', version: 2 } })), null);
});

test('output ausente + origen válido sigue funcionando como hoy', () => {
  const parsed = parseEditorialHandoff(createEditorialHandoff({ tipo: 'noticia_editorial', version: 2 }));
  assert.equal(parsed.output, 'carrusel');
});
