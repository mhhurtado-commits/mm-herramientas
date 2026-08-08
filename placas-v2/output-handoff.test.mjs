import test from 'node:test';
import assert from 'node:assert/strict';
import { createEditorialHandoff, parseEditorialHandoff } from './output-handoff.mjs';

test('crea y recupera un handoff de salida editorial', () => {
  const editorialPackage = { tipo: 'noticia_editorial', version: 2, fuente: { url: 'https://example.com' } };
  const handoff = parseEditorialHandoff(createEditorialHandoff(editorialPackage, 'reel'));
  assert.equal(handoff.output, 'reel');
  assert.deepEqual(handoff.package, editorialPackage);
});

test('rechaza handoffs incompletos o inválidos', () => {
  assert.equal(parseEditorialHandoff('{"output":"placa","package":{}}'), null);
  assert.equal(parseEditorialHandoff('no-json'), null);
});

