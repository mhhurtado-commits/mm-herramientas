import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('el Worker de Dashboard no depende de módulos locales', async () => {
  const source = await readFile(new URL('./worker.js', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /from '\.\/image-generation-config\.mjs'/);
  assert.match(source, /function buildFluxKlein4bInput\(prompt,seed\)/);
  assert.match(source, /form\.append\("width","1200"\)/);
  assert.match(source, /form\.append\("height","630"\)/);
});

test('el Worker prueba Klein 4B antes de FLUX 1 Schnell', async () => {
  const source = await readFile(new URL('./worker.js', import.meta.url), 'utf8');

  assert.match(source, /buildFluxKlein4bInput/);
  assert.ok(source.indexOf('flux-2-klein-4b') < source.indexOf('flux-1-schnell'));
});

test('Redacción etiqueta Klein 4B', async () => {
  const source = await readFile(new URL('../redaccion/index.html', import.meta.url), 'utf8');

  assert.match(source, /"flux-2-klein-4b":"FLUX\.2 Klein 4B"/);
});
