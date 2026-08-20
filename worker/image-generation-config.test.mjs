import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  IMAGE_GENERATION_SIZE,
  buildFluxKlein4bInput,
  getLocalImageFallbacks,
} from './image-generation-config.mjs';

test('construye el input editorial de Klein 4B a 1200x630', async () => {
  const request = buildFluxKlein4bInput('Editorial scene', 42);
  const form = await new Response(request.multipart.body, {
    headers: { 'content-type': request.multipart.contentType },
  }).formData();

  assert.equal(request.model, '@cf/black-forest-labs/flux-2-klein-4b');
  assert.deepEqual(IMAGE_GENERATION_SIZE, { width: 1200, height: 630 });
  assert.equal(form.get('prompt'), 'Editorial scene');
  assert.equal(form.get('width'), '1200');
  assert.equal(form.get('height'), '630');
  assert.equal(form.get('seed'), '42');
});

test('preserva el orden de fallbacks locales', () => {
  assert.deepEqual(getLocalImageFallbacks(), [
    '@cf/black-forest-labs/flux-1-schnell',
    '@cf/lykon/dreamshaper-8',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  ]);
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
