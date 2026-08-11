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

test('consumes the reel output already stored in the editorial package', () => {
  const project = createReelProject({
    fuente: { url: 'https://mediamendoza.com/nota/1', titulo_original: 'Título', imagen: 'cover.jpg', imagenes: ['cover.jpg'] },
    editorial: { seccion: 'Actualidad', titulo: 'Título', bajada: 'Bajada.' },
    salidas: {
      reel: {
        format: 'reel_silent',
        scenes: [
          { order: 1, visual_role: 'hook', visual_source: 'article.image', text: 'Hook guardado', subtitle: 'Bajada guardada.' },
          { order: 2, visual_role: 'cta', layout: 'cta', text: 'Leé la nota completa', subtitle: 'mediamendoza.com' },
        ],
      },
    },
  });

  assert.equal(project.scenes[0].title, 'Hook guardado');
  assert.equal(project.scenes.at(-1).type, 'closure');
});

test('keeps stored internal scenes text-only when no image is assigned', () => {
  const project = createReelProject({
    fuente: { imagen: 'cover.jpg' },
    editorial: { titulo: 'Nota', bajada: 'Bajada.' },
    salidas: { reel: { scenes: [
      { order: 1, visual_role: 'hook', text: 'Portada' },
      { order: 2, visual_role: 'context', text: 'Qué pasó', subtitle: 'Contexto' },
      { order: 3, visual_role: 'cta', layout: 'cta', text: 'Leé la nota' },
    ] } },
  });

  assert.equal(project.scenes[1].image, '');
  assert.equal(project.scenes[1].imageMode, 'text');
  assert.equal(project.scenes.at(-1).image, '');
});

test('combines subtitle and items from the editorial contract', () => {
  const project = createReelProject({
    fuente: { imagen: 'cover.jpg' },
    editorial: { titulo: 'Nota', contexto: 'Contexto general' },
    salidas: { reel: { scenes: [
      { visual_role: 'context', text: 'Qué pasó', subtitle: 'La causa avanzó.', items: [{ text: 'El acusado sigue detenido.' }] },
      { visual_role: 'cta', layout: 'cta', text: 'Leé la nota' },
    ] } },
  });

  assert.match(project.scenes[0].body, /La causa avanzó/);
  assert.match(project.scenes[0].body, /sigue detenido/);
});
