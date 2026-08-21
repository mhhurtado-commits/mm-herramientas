import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptVideoPackage } from './video-package-adapter.mjs';

test('adapts the editorial contract into an editable lower third', () => {
  const adapted = adaptVideoPackage({
    fuente: { titulo_original: 'Titulo fuente', url: 'https://mediamendoza.com/nota', imagen: 'cover.jpg' },
    editorial: {
      titulo: 'Titulo editorial', bajada: 'Bajada breve', seccion: 'Deportes',
      category_options: [{ id: 'deportes', label: 'Deportes', color: '#148a78', recommended: true }],
      datos_clave: [{ label: 'Hora', value: '20:00' }],
    },
  });
  assert.equal(adapted.title, 'Titulo editorial');
  assert.equal(adapted.section, 'Deportes');
  assert.equal(adapted.source, 'mediamendoza.com');
  assert.equal(adapted.accent, '#148a78');
  assert.equal(adapted.fact, 'Hora: 20:00');
});

test('keeps manual fields usable when the package is absent', () => {
  const adapted = adaptVideoPackage();
  assert.equal(adapted.title, '');
  assert.equal(adapted.section, 'Actualidad');
  assert.equal(adapted.source, 'mediamendoza');
});
