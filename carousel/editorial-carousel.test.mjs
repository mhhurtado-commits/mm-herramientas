import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCarouselSlide } from './slide-model.js';

test('normaliza un slide dato al template stats y completa su contenido', () => {
  const slide = normalizeCarouselSlide({
    type: 'dato',
    content: { title: 'Cifras', items: ['12', '34'] },
  }, 1, 4);

  assert.equal(slide.type, 'dato');
  assert.equal(slide.template, 'stats');
  assert.deepEqual(slide.content, {
    title: 'Cifras',
    subtitle: '',
    text: '',
    items: ['12', '34'],
    image: '',
  });
  assert.deepEqual(slide.style, {
    theme: 'mm_editorial',
    background: 'paper',
    accent: '',
  });
});

test('degrada un slide legacy text a contexto', () => {
  const slide = normalizeCarouselSlide({
    template: 'text',
    content: { title: 'Contexto', text: 'La informacion.' },
  }, 0, 1);

  assert.equal(slide.type, 'contexto');
  assert.equal(slide.template, 'text');
  assert.equal(slide.content.text, 'La informacion.');
});

test('preserva el orden y el total de la secuencia editorial', () => {
  const first = normalizeCarouselSlide({ type: 'cover' }, 0, 3);
  const last = normalizeCarouselSlide({ type: 'end' }, 2, 3);

  assert.equal(first.order, 0);
  assert.equal(first.total, 3);
  assert.equal(last.order, 2);
  assert.equal(last.total, 3);
});
