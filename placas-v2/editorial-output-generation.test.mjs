import test from 'node:test';
import assert from 'node:assert/strict';
import { generateEditorialOutputs } from './editorial-output-generation.mjs';

test('genera carrusel y reel una sola vez dentro del paquete editorial', async () => {
  const calls = [];
  const basePackage = {
    tipo: 'noticia_editorial',
    version: 2,
    fuente: {
      url: 'https://mediamendoza.com/nota/1',
      titulo_original: 'Título verificable',
      categoria: 'Actualidad',
      cuerpo: 'Contenido verificable de la noticia.',
      imagen: 'https://img.test/1.jpg',
      imagenes: ['https://img.test/1.jpg'],
    },
    editorial: {
      seccion: 'Actualidad',
      titulo: 'Título verificable',
      bajada: 'Bajada verificable.',
      contexto: 'Contexto verificable.',
    },
    salidas: { placas: [], carrusel: null, reel: null },
    redes: { instagram: '', facebook: '' },
  };

  const result = await generateEditorialOutputs(basePackage, ['carrusel', 'reel'], {
    generateJson: async (prompt, userMsg) => {
      calls.push(userMsg);
      if (userMsg.includes('carrusel')) {
        return {
          version: '1.0',
          diagnosis: { news_type: 'evergreen', vertical: 'general', complexity: 'brief', tone: 'informative', carousel_type: 'summary', template: 'mm_classic' },
          cover: { title: 'Título verificable', subtitle: 'Bajada verificable.' },
          slides: [
            { type: 'contexto', title: 'Contexto', text: 'Contexto verificable.' },
            { type: 'clave', title: 'La clave', text: 'El dato principal de la noticia.' },
            { type: 'end', source: 'Título verificable', cta: 'Leé la nota completa' },
          ],
        };
      }
      return { format: 'reel_silent', hook: 'Título verificable', scenes: [{ visual_role: 'hook', text: 'Título verificable' }] };
    },
  });

  assert.equal(calls.length, 2);
  assert.ok(result.package.salidas.carrusel);
  assert.ok(result.package.salidas.reel);
  assert.equal(result.package.fuente.url, basePackage.fuente.url);
});
