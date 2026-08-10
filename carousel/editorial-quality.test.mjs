import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCarouselPlan } from './parser.js';

test('degrada imagenes repetidas y normaliza CTA generico', () => {
  const article = {
    url: 'https://mediamendoza.com/nota/1',
    title: 'Caso verificable',
    category: 'Policiales',
    summary: 'Resumen verificable.',
    image: 'https://img.test/cover.jpg',
    images: ['https://img.test/cover.jpg'],
  };
  const result = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'breaking', vertical: 'policiales', complexity: 'medium', tone: 'impact',
      carousel_type: 'summary', template: 'mm_impact',
    },
    cover: { title: 'Caso verificable', subtitle: 'Resumen verificable.' },
    slides: [
      { type: 'imagen', title: 'Imagen', image: article.image, text: 'Descripción verificable.' },
      { type: 'clave', title: 'La clave', text: 'Dato verificable.' },
      { type: 'end', source: article.url, cta: 'Leé la nota en nuestro sitio web' },
    ],
  }, article);

  assert.equal(result.ok, true);
  assert.equal(result.plan.slides.some(slide => slide.type === 'imagen'), false);
  assert.equal(result.plan.slides[0].type, 'contexto');
  assert.equal(result.plan.slides.at(-1).cta, 'Leé la nota completa en mediamendoza.com');
});
