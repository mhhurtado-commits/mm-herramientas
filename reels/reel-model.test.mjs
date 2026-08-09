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

test('does not put a non-clickable short URL in the closure CTA', () => {
  const project = createReelProject({ fuente: { url: 'https://mediamendoza.com/policiales/251300-Titulo' }, editorial: { titulo: 'Titulo' } });
  assert.equal(project.scenes.at(-1).cta, 'Leé la nota completa en mediamendoza.com');
});

test('preserves recommended and alternative categories from the package', () => {
  const project = createReelProject({
    fuente: { titulo_original: 'Nota' },
    editorial: {
      seccion: 'Actualidad',
      category_options: [
        { id: 'policiales', label: 'Policiales', recommended: true, color: '#c7474f' },
        { id: 'actualidad', label: 'Actualidad', recommended: false, color: '#a8d432' },
      ],
    },
  });
  assert.equal(project.selectedCategoryId, 'policiales');
  assert.deepEqual(project.categoryOptions.map(option => option.label), ['Policiales', 'Actualidad']);
  assert.equal(project.sectionLabel, 'Policiales');
});
