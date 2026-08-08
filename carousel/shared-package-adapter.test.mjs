import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fromEditorialPackage,
  attachEditorialPackage,
  openCarouselFromEditorialPackage,
} from './shared-package-adapter.js';

const editorialPackage = {
  tipo: 'noticia_editorial',
  version: 2,
  fuente: {
    url: 'https://mediamendoza.com/politica/123',
    titulo_original: 'Una nueva obra para el sur',
    categoria: 'Política',
    cuerpo: 'La obra comenzará durante el mes próximo.',
    imagen: 'https://example.com/cover.jpg',
    imagenes: ['https://example.com/cover.jpg', 'https://example.com/second.jpg'],
  },
  editorial: {
    seccion: 'Política',
    familia: 'politica',
    tipo_noticia: 'analysis',
    complejidad: 'deep',
    tono: 'explainer',
    titulo: 'Una nueva obra para el sur',
    bajada: 'La inversión mejorará los servicios.',
    contexto: 'La obra comenzará durante el mes próximo.',
    datos_clave: ['El proyecto tendrá dos etapas.'],
    textual: [],
    personas: [],
  },
  salidas: { placas: [], carrusel: null, reel: null },
  redes: { instagram: '', facebook: '' },
};

test('adapta el paquete común al artículo y diagnóstico actuales del carrusel', () => {
  const result = fromEditorialPackage(editorialPackage);

  assert.equal(result.article.url, editorialPackage.fuente.url);
  assert.equal(result.article.title, editorialPackage.editorial.titulo);
  assert.equal(result.article.summary, editorialPackage.editorial.bajada);
  assert.equal(result.article.content, editorialPackage.fuente.cuerpo);
  assert.equal(result.diagnosis.vertical, 'politica');
  assert.equal(result.diagnosis.news_type, 'analysis');
  assert.equal(result.diagnosis.complexity, 'deep');
  assert.equal(result.diagnosis.tone, 'explainer');
});

test('adjunta el paquete sin perder el estado del proyecto existente', () => {
  const project = { article: { title: 'Anterior' }, slides: [{ id: 'slide-1' }] };
  const result = attachEditorialPackage(project, editorialPackage);

  assert.notEqual(result, project);
  assert.equal(result.article.title, editorialPackage.editorial.titulo);
  assert.equal(result.slides[0].id, 'slide-1');
  assert.equal(result.editorialPackage, editorialPackage);
});

test('abre un proyecto de carrusel desde el paquete sin depender del DOM', () => {
  const project = openCarouselFromEditorialPackage(editorialPackage);

  assert.equal(project.article.url, editorialPackage.fuente.url);
  assert.equal(project.article.images.length, 2);
  assert.equal(project.editorialPackage, editorialPackage);
  assert.equal(project.slides.length, 0);
});

test('preserva las alternativas de categoria para elegirlas en carrusel', () => {
  const packageWithCategories = {
    ...editorialPackage,
    editorial: {
      ...editorialPackage.editorial,
      category_options: [
        { id: 'policiales-principal', label: 'Policiales', vertical: 'policiales', recommended: true },
        { id: 'general-editorial', label: 'Actualidad', vertical: 'general' },
      ],
    },
  };

  const project = openCarouselFromEditorialPackage(packageWithCategories);

  assert.deepEqual(project.categoryOptions, [
    { id: 'policiales-principal', label: 'Policiales', vertical: 'policiales', recommended: true, color: '' },
    { id: 'general-editorial', label: 'Actualidad', vertical: 'general', recommended: false, color: '' },
  ]);
  assert.equal(project.selectedCategoryId, 'policiales-principal');
});
