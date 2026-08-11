import test from 'node:test';
import assert from 'node:assert/strict';
import { createReelProject, normalizeReelProject } from './reel-model.mjs';

test('creates a four-scene reel from a package with one horizontal image', () => {
  const project = createReelProject({
    fuente: { url: 'https://mediamendoza.com/nota', imagenes: ['https://img.test/horizontal.jpg'] },
    editorial: { seccion: 'policiales', titulo: 'Titulo de prueba', bajada: 'Bajada', contexto: 'Dato clave' },
  });
  assert.equal(project.format, '9:16');
  assert.ok(project.scenes.length >= 3 && project.scenes.length <= 6);
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
  assert.equal(project.scenes.at(-1).cta, 'Leé la nota completa');
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

test('regenerates Reel copy from the canonical package and keeps the cover image', () => {
  const project = createReelProject({
    fuente: { url: 'https://mediamendoza.com/nota/1', titulo_original: 'Título', imagen: 'cover.jpg', imagenes: ['cover.jpg'] },
    editorial: { seccion: 'Actualidad', titulo: 'Título', bajada: 'Bajada.' },
    salidas: {
      reel: {
        format: 'reel_silent',
        scenes: [
          { order: 1, visual_role: 'hook', visual_source: 'article.image', text: 'Texto de otra nota', subtitle: 'Contenido contaminado.' },
          { order: 2, visual_role: 'cta', layout: 'cta', text: 'Leé la nota completa', subtitle: 'mediamendoza.com' },
        ],
      },
    },
  });

  assert.equal(project.scenes[0].title, 'Título');
  assert.equal(project.scenes[0].image, 'cover.jpg');
  assert.doesNotMatch(JSON.stringify(project), /Texto de otra nota|Contenido contaminado/);
  assert.equal(project.scenes.at(-1).type, 'closure');
});

test('derives Reel scenes from canonical fields when Reel output is absent', () => {
  const project = createReelProject({
    fuente: { titulo_original: 'Nota', imagen: 'cover.jpg' },
    editorial: { titulo: 'Nota', bajada: 'Bajada.', contexto: 'Contexto canónico.' },
    salidas: {
      carrusel: {
        cover: { title: 'Texto del carrusel que no corresponde' },
      },
      reel: null,
    },
  });

  assert.equal(project.scenes[1].title, 'Qué pasó');
  assert.match(project.scenes[1].body, /Contexto canónico/);
  assert.doesNotMatch(JSON.stringify(project), /Texto del carrusel que no corresponde/);
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

test('ignores technical paths and stale stored Reel text', () => {
  const project = createReelProject({
    fuente: { imagen: 'cover.jpg', cuerpo: String.raw`C:\storage\cachefiles\nota.json Las clases presenciales fueron suspendidas en Malargüe por las condiciones climáticas adversas.` },
    editorial: { titulo: 'Suspensión de clases', bajada: 'La medida afecta al turno mañana.' },
    salidas: { reel: { scenes: [
      { visual_role: 'hook', text: 'Texto de otra nota' },
      { visual_role: 'context', text: 'Parte contaminada' },
      { visual_role: 'cta', layout: 'cta', text: 'Leé la nota completa' },
    ] } },
  });

  assert.doesNotMatch(JSON.stringify(project), /C:\\storage\\cachefiles/);
  assert.doesNotMatch(JSON.stringify(project), /Texto de otra nota|Parte contaminada/);
  assert.match(project.scenes[0].body, /La medida afecta/);
});

test('combines subtitle and items from the editorial contract', () => {
  const project = createReelProject({
    fuente: { imagen: 'cover.jpg' },
    editorial: {
      titulo: 'Nota',
      contexto: 'La causa avanzó con nuevas medidas judiciales y el expediente continúa en investigación.',
      datos_clave: ['El acusado sigue detenido mientras se resuelven las próximas etapas del proceso judicial.'],
    },
  });

  assert.match(project.scenes[1].body, /La causa avanzó/);
  assert.match(project.scenes[2].cards[0].text, /sigue detenido/);
});

test('keeps the note context in the Reel closure', () => {
  const project = createReelProject({
    fuente: { url: 'https://mediamendoza.com/nota' },
    editorial: { titulo: 'Título de la nota', bajada: 'Resumen de la nota.' },
    salidas: { reel: { scenes: [
      { visual_role: 'hook', text: 'Portada' },
      { visual_role: 'cta', layout: 'cta', text: 'Leé la nota completa', subtitle: 'mediamendoza.com' },
    ] } },
  });

  assert.equal(project.scenes.at(-1).body, '');
});
