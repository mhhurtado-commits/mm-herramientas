import test from 'node:test';
import assert from 'node:assert/strict';
import { createReelOutputFromEditorialPackage } from './reel-package-adapter.mjs';

test('uses canonical title and context when no structured plan exists', () => {
  const output = createReelOutputFromEditorialPackage({
    fuente: { titulo_original: 'Titulo original', imagen: 'cover.jpg' },
    editorial: { titulo: 'Titulo editorial', bajada: 'Bajada.', contexto: 'Contexto canonico.' },
    salidas: { carrusel: { cover: { title: 'Titulo alternativo' } } },
  });
  assert.equal(output.scenes[0].text, 'Titulo editorial');
  assert.match(output.scenes[1].subtitle, /Contexto canonico/);
});

test('creates distinct scenes from the current plan without generic stale content', () => {
  const output = createReelOutputFromEditorialPackage({
    fuente: { titulo_original: 'Suspension de clases', imagen: 'cover.jpg' },
    editorial: { titulo: 'Suspension de clases', bajada: 'Por mal tiempo.', contexto: 'Texto ajeno.', datos_clave: ['Dato ajeno.'] },
    salidas: { carrusel: { slides: [
      { type: 'contexto', title: 'Que cambio', text: 'La actividad escolar sera virtual.' },
      { type: 'dato', title: 'Alcance', items: [{ label: 'Turno manana', text: 'Las clases presenciales quedan suspendidas en Malargue.' }] },
      { type: 'clave', title: 'Resto', text: 'El servicio educativo continua con normalidad.' },
    ] } },
  });

  assert.deepEqual(output.scenes.map(scene => scene.visual_role), ['hook', 'context', 'key_fact', 'key_fact', 'cta']);
  assert.match(output.scenes[1].subtitle, /actividad escolar sera virtual/);
  assert.equal(output.scenes[2].items[0].text, 'Las clases presenciales quedan suspendidas en Malargue.');
  assert.match(output.scenes[3].subtitle, /servicio educativo continua/);
  assert.doesNotMatch(JSON.stringify(output), /Texto ajeno|Dato ajeno|…/);
});

test('keeps complete fact wording and limits a fact scene to two cards', () => {
  const output = createReelOutputFromEditorialPackage({
    editorial: { titulo: 'Nota', bajada: 'Resumen.', datos_clave: [
      'La primera informacion extensa debe conservar su origen y no ocupar toda la escena del video.',
      'La segunda informacion tambien debe conservarse sin un corte artificial.',
      'El tercer dato queda fuera de la escena breve.',
    ] },
  });
  const cards = output.scenes.find(scene => scene.visual_role === 'key_fact')?.items || [];
  assert.equal(cards.length, 2);
  assert.match(cards[0].text, /ocupar toda la escena del video/);
  assert.ok(cards.every(card => !card.text.includes('…')));
});

test('does not use raw body text as a Reel source', () => {
  const output = createReelOutputFromEditorialPackage({
    fuente: { titulo_original: 'Suspension', cuerpo: 'Texto crudo que no debe aparecer.' },
    editorial: { titulo: 'Suspension', bajada: 'La medida afecta el turno manana.', contexto: 'La actividad escolar sera virtual.' },
  });
  assert.equal(output.scenes.length, 3);
  assert.doesNotMatch(JSON.stringify(output), /Texto crudo/);
  assert.match(output.scenes.at(-1).subtitle, /mediamendoza\.com/);
});
