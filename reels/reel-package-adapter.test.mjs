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

test('deduplicates body-derived cards and assigns useful labels', () => {
  const output = createReelOutputFromEditorialPackage({
    fuente: {
      titulo_original: 'Caso Collado',
      cuerpo: 'Caso Collado: la familia busca un juicio por jurados. Caso Collado: la familia busca un juicio por jurados. La pericia oficial considera imputable al acusado.',
    },
    editorial: {
      titulo: 'Caso Collado',
      bajada: 'La familia busca una estrategia judicial.',
      contexto: 'La causa continúa.',
    },
  });

  const cards = output.scenes.find(scene => scene.visual_role === 'key_fact')?.items || [];
  assert.equal(new Set(cards.map(card => card.text)).size, cards.length);
  assert.ok(cards.every(card => card.label && card.label !== 'Información'));
});

test('limits key-fact cards to two concise source excerpts for a short Reel', () => {
  const output = createReelOutputFromEditorialPackage({
    editorial: {
      titulo: 'Nota',
      bajada: 'Resumen.',
      datos_clave: [
        'La primera información extensa debe conservar su origen, pero no ocupar toda la escena del video.',
        'La segunda información también debe ser breve para poder leerse durante una pieza de quince segundos.',
        'Este tercer dato queda fuera de la escena breve.',
      ],
    },
  });

  const cards = output.scenes.find(scene => scene.visual_role === 'key_fact')?.items || [];
  assert.equal(cards.length, 2);
  assert.ok(cards.every(card => card.text.split(/\s+/).length <= 15));
});

test('does not import raw body text into extra Reel scenes', () => {
  const output = createReelOutputFromEditorialPackage({
    fuente: {
      titulo_original: 'Suspensión de clases',
      cuerpo: 'Para este martes están suspendidas las clases presenciales en Malargüe, y zonas de Tupungato y Tunuyán. La medida se debe a nevadas, lluvias y temperaturas bajo cero. En el resto de la provincia el servicio educativo se brinda con normalidad.',
    },
    editorial: {
      titulo: 'Suspensión de clases presenciales por mal tiempo',
      bajada: 'La medida afecta al turno mañana en zonas específicas.',
      contexto: 'La actividad escolar será virtual.',
    },
  });

  assert.equal(output.scenes.length, 3);
  assert.doesNotMatch(JSON.stringify(output), /Malargüe|Tupungato|Tunuyán/);
  assert.equal(output.scenes.at(-1).subtitle, '');
});
