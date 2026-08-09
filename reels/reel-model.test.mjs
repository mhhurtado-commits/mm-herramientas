import test from 'node:test';
import assert from 'node:assert/strict';
import { createReelProject, normalizeReelProject } from './reel-model.mjs';

test('creates a four-scene reel from a package with one horizontal image', () => {
  const project = createReelProject({
    fuente: { url: 'https://mediamendoza.com/nota', imagenes: ['https://img.test/horizontal.jpg'] },
    editorial: { seccion: 'policiales', titulo: 'Titulo de prueba', bajada: 'Bajada', contexto: 'Dato clave' },
  });
  assert.equal(project.format, '9:16');
  assert.ok(project.scenes.length >= 4 && project.scenes.length <= 6);
  assert.equal(project.scenes[0].imageMode, 'contain-blur');
  assert.deepEqual(project.scenes[0].focus, { x: 0.5, y: 0.5 });
});

test('normalizes scene count and clamps focus', () => {
  const normalized = normalizeReelProject({ format: 'square', scenes: [{ id: 'x', focus: { x: 2, y: -1 } }] });
  assert.equal(normalized.format, '9:16');
  assert.equal(normalized.scenes[0].focus.x, 1);
  assert.equal(normalized.scenes[0].focus.y, 0);
});

test('uses the short article URL in the closure CTA', () => {
  const project = createReelProject({
    fuente: {
      url: 'https://mediamendoza.com/policiales/251300-Le-hurtaron-la-billetera',
      imagenes: [],
    },
    editorial: { titulo: 'Titulo', bajada: 'Bajada', contexto: 'Contexto' },
  });
  assert.equal(project.scenes.at(-1).cta, 'Leé la nota completa: https://mediamendoza.com/policiales/251300');
});
