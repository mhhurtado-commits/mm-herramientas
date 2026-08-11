import test from 'node:test';
import assert from 'node:assert/strict';
import { fromEditorialPackage } from './reel-shared-package-adapter.mjs';

test('prioriza bloques del plan editorial y descarta datos genéricos ajenos', () => {
  const adapted = fromEditorialPackage({
    fuente: { titulo_original: 'Suspensión de clases', categoria: 'Clima' },
    editorial: {
      titulo: 'Suspensión de clases',
      contexto: 'Texto genérico de otra nota.',
      datos_clave: [String.raw`C:\storage\cachefiles\otra-nota.json`, 'Dato genérico ajeno.'],
    },
    salidas: {
      carrusel: {
        cover: { title: 'Suspensión de clases', subtitle: 'Por mal tiempo.' },
        slides: [
          { type: 'contexto', title: 'Qué cambió', text: 'La actividad escolar será virtual.' },
          { type: 'dato', title: 'Alcance', items: [{ label: 'Turno mañana', text: 'Las clases presenciales quedan suspendidas.' }] },
        ],
      },
    },
  });

  assert.deepEqual(adapted.storyBlocks, [
    { role: 'context', title: 'Qué cambió', body: 'La actividad escolar será virtual.', items: [] },
    { role: 'fact', title: 'Alcance', body: '', items: [{ label: 'Turno mañana', text: 'Las clases presenciales quedan suspendidas.' }] },
  ]);
  assert.doesNotMatch(JSON.stringify(adapted.storyBlocks), /otra nota|cachefiles|Dato genérico/i);
});

test('usa campos editoriales únicamente cuando el paquete no tiene plan', () => {
  const adapted = fromEditorialPackage({
    editorial: {
      titulo: 'Nota',
      contexto: 'Contexto verificable.',
      datos_clave: ['Primer dato verificable.'],
    },
  });

  assert.deepEqual(adapted.storyBlocks, [
    { role: 'context', title: 'Qué pasó', body: 'Contexto verificable.', items: [] },
    { role: 'fact', title: 'Dato clave', body: '', items: [{ label: 'Dato clave', text: 'Primer dato verificable.' }] },
  ]);
});
