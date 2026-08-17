import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEditorialPackage } from '../shared/editorial-package.mjs';
import { adaptClimatePlan } from './climate-adapter.js';

test('conserva los datos estructurados del contrato para clima', () => {
  const result = normalizeEditorialPackage({
    tipo: 'noticia_editorial',
    version: 2,
    fuente: { url: 'https://example.com/clima', titulo_original: 'Pronóstico', categoria: 'Clima' },
    editorial: {
      seccion: 'Clima',
      titulo: 'Pronóstico',
      datos_clave: [
        { label: 'Máxima', value: '8°C', detail: 'en el Sur' },
      ],
    },
  });

  assert.deepEqual(result.package.editorial.datos_clave, [
    { label: 'Máxima', value: '8°C', detail: 'en el Sur' },
  ]);
});

test('arma una secuencia climática con tarjetas y elimina datos repetidos', () => {
  const article = {
    title: 'Feriado bajo lluvia',
    summary: 'Jornada fría e inestable en el Sur.',
    editorialContext: 'Se esperan lluvias durante gran parte del día.',
    editorialFacts: [
      { label: 'Máxima', value: '8°C', detail: 'en el Sur' },
      { label: 'Viento', value: '40 km/h', detail: 'ráfagas del Sur' },
      { label: 'Máxima', value: '8°C', detail: 'en el Sur' },
      { label: 'Mañana', value: '15°C', detail: 'cielo despejado' },
    ],
  };
  const plan = {
    diagnosis: { vertical: 'clima', carousel_type: 'service', template: 'mm_briefing' },
    cover: { title: article.title, subtitle: article.summary },
    slides: [{ type: 'end', title: 'Seguí la nota', cta: 'Leé la nota completa' }],
  };

  const result = adaptClimatePlan(plan, article);
  const factSlides = result.slides.filter((slide) => slide.type === 'dato');
  const cardValues = factSlides.flatMap((slide) => slide.items.map((item) => item.value));

  assert.equal(result.slides.at(-1).type, 'end');
  assert.ok(factSlides.length >= 1);
  assert.deepEqual(cardValues, ['8°C', '40 km/h', '15°C']);
  assert.ok(result.slides.every((slide) => slide.type !== 'contexto' || slide.text !== article.summary));
});

test('no modifica el plan general', () => {
  const plan = {
    diagnosis: { vertical: 'policiales' },
    cover: { title: 'Caso', subtitle: 'Resumen' },
    slides: [{ type: 'contexto', title: 'Contexto', text: 'Texto' }, { type: 'end', cta: 'Leer' }],
  };

  assert.deepEqual(adaptClimatePlan(plan, { editorialFacts: [] }), plan);
});
