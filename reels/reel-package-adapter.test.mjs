import test from 'node:test';
import assert from 'node:assert/strict';
import { createReelOutputFromEditorialPackage } from './reel-package-adapter.mjs';

test('adapts Reel from the canonical package, ignoring carousel text', () => {
  const output = createReelOutputFromEditorialPackage({
    fuente: {
      titulo_original: 'Título original',
      cuerpo: 'Cuerpo completo de la nota.',
      imagen: 'cover.jpg',
    },
    editorial: {
      titulo: 'Título editorial',
      bajada: 'Bajada editorial.',
      contexto: 'Contexto canónico.',
      datos_clave: ['Dato canónico uno.', 'Dato canónico dos.'],
    },
    salidas: {
      placas: [{ titulo: 'Título de placa', contexto: 'Contexto de placa.' }],
      carrusel: { cover: { title: 'Texto que Reel no debe usar' } },
    },
  });

  assert.equal(output.scenes[0].text, 'Título editorial');
  assert.match(output.scenes[1].subtitle, /Contexto canónico/);
  assert.equal(output.scenes[2].items[0].text, 'Dato canónico uno.');
  assert.doesNotMatch(JSON.stringify(output), /Texto que Reel no debe usar/);
});
