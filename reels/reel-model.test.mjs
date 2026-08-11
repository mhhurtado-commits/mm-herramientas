import test from 'node:test';
import assert from 'node:assert/strict';
import { createReelProject, normalizeReelProject } from './reel-model.mjs';

test('creates a 9:16 project with a cover image and bounded scene count', () => {
  const project = createReelProject({
    fuente: { url: 'https://mediamendoza.com/nota', imagenes: ['https://img.test/cover.jpg'] },
    editorial: { seccion: 'policiales', titulo: 'Titulo', bajada: 'Bajada.', contexto: 'Contexto.' },
  });
  assert.equal(project.format, '9:16');
  assert.ok(project.scenes.length >= 3 && project.scenes.length <= 5);
  assert.equal(project.scenes[0].imageMode, 'contain-blur');
  assert.deepEqual(project.scenes[0].focus, { x: 0.5, y: 0.5 });
});

test('normalizes scene count and clamps focus', () => {
  const normalized = normalizeReelProject({ format: 'square', scenes: [{ id: 'x', focus: { x: 2, y: -1 } }] });
  assert.equal(normalized.format, '9:16');
  assert.deepEqual(normalized.scenes[0].focus, { x: 1, y: 0 });
});

test('preserves package categories and uses the recommended option', () => {
  const project = createReelProject({
    editorial: {
      titulo: 'Nota',
      category_options: [
        { id: 'policiales', label: 'Policiales', recommended: true, color: '#c7474f' },
        { id: 'actualidad', label: 'Actualidad', color: '#a8d432' },
      ],
    },
  });
  assert.equal(project.selectedCategoryId, 'policiales');
  assert.equal(project.sectionLabel, 'Policiales');
  assert.deepEqual(project.categoryOptions.map(option => option.label), ['Policiales', 'Actualidad']);
});

test('regenerates current text while retaining only the stored manual image', () => {
  const project = createReelProject({
    fuente: { titulo_original: 'Titulo actual', imagen: 'cover.jpg', imagenes: ['cover.jpg'] },
    editorial: { titulo: 'Titulo actual', bajada: 'Bajada actual.' },
    salidas: { reel: { scenes: [
      { visual_role: 'hook', visual_source: 'article.image', text: 'Texto de otra nota' },
      { visual_role: 'context', text: 'Contenido contaminado' },
      { visual_role: 'cta', layout: 'cta', text: 'Cierre viejo' },
    ] } },
  });

  assert.equal(project.scenes[0].title, 'Titulo actual');
  assert.equal(project.scenes[0].image, 'cover.jpg');
  assert.doesNotMatch(JSON.stringify(project), /Texto de otra nota|Contenido contaminado|Cierre viejo/);
});

test('keeps an internal scene text-only when no support image was manually assigned', () => {
  const project = createReelProject({
    fuente: { imagen: 'cover.jpg' }, editorial: { titulo: 'Nota', bajada: 'Bajada.' },
    salidas: { reel: { scenes: [
      { visual_role: 'hook', visual_source: 'article.image', text: 'Portada' },
      { visual_role: 'context', text: 'Que paso', subtitle: 'Contexto' },
      { visual_role: 'cta', layout: 'cta', text: 'Cierre' },
    ] } },
  });
  assert.equal(project.scenes[1].image, '');
  assert.equal(project.scenes[1].imageMode, 'text');
});

test('uses complete non-repeated plan blocks and a concise closure', () => {
  const project = createReelProject({
    fuente: { titulo_original: 'Nota', imagen: 'cover.jpg' },
    editorial: { titulo: 'Nota', bajada: 'Bajada.', datos_clave: ['Dato ajeno.'] },
    salidas: { carrusel: { slides: [
      { type: 'contexto', text: 'Contexto editorial verificable.' },
      { type: 'dato', items: [{ label: 'Alcance', text: 'La primera medida completa debe conservarse sin puntos suspensivos ni cortes.' }] },
      { type: 'clave', text: 'La segunda medida completa tambien debe leerse como una escena independiente.' },
    ] } },
  });

  assert.equal(project.scenes.length, 5);
  assert.match(project.scenes[2].cards[0].text, /sin puntos suspensivos ni cortes/);
  assert.doesNotMatch(JSON.stringify(project), /Dato ajeno|…/);
  assert.match(project.scenes.at(-1).body, /mediamendoza\.com/);
  assert.match(project.scenes.at(-1).cta, /nota completa/);
});
