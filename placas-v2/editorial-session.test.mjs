import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEditorialSession, getOutputAvailability } from './editorial-session.mjs';

const note = {
  url: 'https://mediamendoza.com/politica/123',
  title: 'Una nueva obra para el sur',
  category: 'politica',
  description: 'La inversión mejorará los servicios.',
  body: 'La obra comenzará durante el mes próximo.',
  image: 'https://example.com/cover.jpg',
  images: ['https://example.com/cover.jpg'],
};

const packageResponse = {
  ok: true,
  warnings: [],
  requestedOutputs: ['placa'],
  paquete: {
    tipo: 'noticia_editorial',
    version: 2,
    fuente: {
      url: note.url,
      titulo_original: note.title,
      categoria: note.category,
      cuerpo: note.body,
      imagen: note.image,
      imagenes: note.images,
    },
    editorial: {
      seccion: 'politica',
      familia: 'politica',
      tipo_noticia: 'noticia',
      titulo: note.title,
      bajada: note.description,
      contexto: 'La obra comenzará durante el mes próximo.',
      textual: [],
      personas: [],
    },
    salidas: { placas: [], carrusel: null, reel: null },
    redes: { instagram: 'Instagram', facebook: 'Facebook' },
  },
};

test('carga una sesión con una sola extracción y una sola generación', async () => {
  let extractionCalls = 0;
  let generationCalls = 0;
  const session = await loadEditorialSession('https://example.com/news', ['placa'], {
    extract: async () => { extractionCalls += 1; return note; },
    generate: async (extracted, outputs) => {
      generationCalls += 1;
      assert.equal(extracted, note);
      assert.deepEqual(outputs, ['placa']);
      return packageResponse;
    },
  });

  assert.equal(extractionCalls, 1);
  assert.equal(generationCalls, 1);
  assert.equal(session.package.version, 2);
  assert.equal(session.plate.titulo, note.title);
  assert.equal(session.variants.length, 4);
  assert.equal(session.warnings.length, 0);
});

test('la disponibilidad se obtiene del paquete sin volver a extraer', () => {
  assert.deepEqual(getOutputAvailability({ requestedOutputs: ['placa', 'carrusel'] }), {
    placas: true,
    carrusel: true,
    reel: false,
  });
  assert.deepEqual(getOutputAvailability({}), { placas: false, carrusel: false, reel: false });
});
