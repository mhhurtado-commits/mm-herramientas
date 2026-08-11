import test from 'node:test';
import assert from 'node:assert/strict';
import { loadReelSession } from './reel-session.mjs';

test('loads a reel session from URL and generates a normalized project', async () => {
  const session = await loadReelSession('https://example.com/nota', {
    extract: async url => ({ url, title: 'Nota de prueba', category: 'Policiales', content: 'Contenido completo', image: 'foto.jpg' }),
    generate: async (note, outputs) => {
      assert.equal(outputs[0], 'reel');
      return {
        paquete: {
          tipo: 'noticia_editorial',
          version: 2,
          fuente: { url: note.url, titulo_original: note.title, categoria: note.category, cuerpo: note.content, imagen: note.image },
          editorial: { seccion: 'Policiales', familia: 'policiales', tipo_noticia: 'noticia', titulo: 'Título', bajada: 'Bajada', contexto: 'Contexto canónico' },
          salidas: { placas: [], carrusel: { cover: { title: 'Texto ajeno del carrusel' } }, reel: null },
        },
      };
    },
  });

  assert.equal(session.package.fuente.url, 'https://example.com/nota');
  assert.equal(session.project.format, '9:16');
  assert.ok(session.project.scenes.length >= 3);
  assert.match(session.project.scenes[1].body, /Contexto canónico/);
  assert.doesNotMatch(JSON.stringify(session.project), /Texto ajeno del carrusel/);
});
