import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEditorialPackage,
  normalizeRequestedOutputs,
} from './editorial-package.mjs';

const note = {
  url: 'https://mediamendoza.com/politica/123',
  title: 'Una nueva obra para el sur',
  category: 'politica',
  description: 'La inversión mejorará los servicios.',
  body: 'La obra comenzará durante el mes próximo.',
  image: 'https://example.com/cover.jpg',
  images: ['https://example.com/cover.jpg', 'https://example.com/second.jpg'],
};

const plate = {
  tipo: 'placa_noticia',
  version: 1,
  fuente: {
    url: note.url,
    titulo_original: note.title,
    categoria: note.category,
    texto: note.body,
    imagen: note.image,
    imagenes: note.images,
  },
  titulo: note.title,
  bajada: note.description,
  contexto: 'La obra comenzará durante el mes próximo.',
  etiqueta: 'Política',
  template_sugerido: 'politica',
  tipo_placa: 'noticia',
  textual: { cita: '', autor: '', cargo: '', verificada: false },
  personas: [],
};

test('normaliza las salidas solicitadas y usa placa por defecto', () => {
  assert.deepEqual(normalizeRequestedOutputs(), ['placa']);
  assert.deepEqual(normalizeRequestedOutputs(['carrusel', 'reel', 'placa', 'otro']), ['carrusel', 'reel', 'placa']);
});

test('construye un paquete con la placa y los slots de salida solicitados', () => {
  const result = buildEditorialPackage(note, plate, ['placa', 'carrusel', 'reel']);

  assert.equal(result.ok, true);
  assert.equal(result.package.tipo, 'noticia_editorial');
  assert.equal(result.package.version, 2);
  assert.equal(result.package.fuente.url, note.url);
  assert.equal(result.package.editorial.titulo, note.title);
  assert.deepEqual(result.package.salidas.placas, [plate]);
  assert.equal(result.package.salidas.carrusel, null);
  assert.equal(result.package.salidas.reel, null);
  assert.deepEqual(result.requestedOutputs, ['placa', 'carrusel', 'reel']);
});

test('prioriza las imágenes de la nota actual sobre imágenes heredadas de la placa', () => {
  const currentNote = {
    ...note,
    image: 'https://example.com/current.jpg',
    images: ['https://example.com/current.jpg', 'https://example.com/current-detail.jpg'],
  };
  const stalePlate = {
    ...plate,
    fuente: {
      ...plate.fuente,
      imagen: 'https://example.com/old.jpg',
      imagenes: ['https://example.com/old.jpg', 'https://example.com/old-detail.jpg'],
    },
  };

  const result = buildEditorialPackage(currentNote, stalePlate, ['reel']);

  assert.equal(result.package.fuente.imagen, currentNote.image);
  assert.deepEqual(result.package.fuente.imagenes, currentNote.images);
});

test('rechaza una nota sin datos suficientes sin lanzar una excepción', () => {
  const result = buildEditorialPackage({}, {}, ['placa']);

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('fuente.url faltante'));
  assert.ok(result.errors.includes('fuente.titulo_original faltante'));
});
