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

test('separa una narracion larga de las tarjetas metricas', () => {
  const result = adaptClimatePlan({ diagnosis: { vertical: 'clima' }, slides: [{ type: 'end' }] }, {
    editorialVertical: 'clima',
    editorialFacts: [
      { label: 'Panorama', value: 'El Sur de Mendoza atraviesa una jornada extensa de lluvias, nubosidad y viento durante gran parte del dia.' },
      { label: 'Maxima', value: '8 C' },
      { label: 'Viento', value: '40 km/h' },
    ],
  });
  const data = result.slides.find((slide) => slide.type === 'dato');
  assert.equal(data.variant, 'climate');
  assert.deepEqual(data.items.map((item) => item.value), ['8 C', '40 km/h']);
  assert.match(result.slides.find((slide) => slide.type === 'contexto').text, /Sur de Mendoza/);
});

test('no modifica el plan general', () => {
  const plan = {
    diagnosis: { vertical: 'policiales' },
    cover: { title: 'Caso', subtitle: 'Resumen' },
    slides: [{ type: 'contexto', title: 'Contexto', text: 'Texto' }, { type: 'end', cta: 'Leer' }],
  };

  assert.deepEqual(adaptClimatePlan(plan, { editorialFacts: [] }), plan);
});

test('adapta un plan guardado aunque su diagnóstico viejo diga general', () => {
  const plan = {
    diagnosis: { vertical: 'general' },
    cover: { title: 'Clima', subtitle: 'Resumen' },
    slides: [{ type: 'contexto', title: 'Condiciones actuales', text: 'Texto anterior' }, { type: 'end', cta: 'Leer' }],
  };
  const result = adaptClimatePlan(plan, {
    editorialVertical: 'clima',
    editorialContext: 'Lluvias durante la jornada.',
    editorialFacts: [{ label: 'Máxima', value: '8°C', detail: 'en el Sur' }],
  });

  assert.equal(result.diagnosis.vertical, 'clima');
  assert.equal(result.slides.find((slide) => slide.type === 'dato').items[0].value, '8°C');
});

test('conserva una escena informativa previa cuando falta textual en el contrato', () => {
  const result = adaptClimatePlan({
    diagnosis: { vertical: 'clima' },
    slides: [{ type: 'contexto', text: 'La mejora continuara durante la tarde.' }, { type: 'end' }],
  }, {
    editorialVertical: 'clima',
    editorialContext: 'Lluvias durante la jornada.',
    editorialFacts: [{ label: 'Maxima', value: '8 C' }],
  });
  assert.equal(result.slides.filter((slide) => slide.type !== 'end').length, 3);
  assert.equal(result.slides[2].text, 'La mejora continuara durante la tarde.');
});

test('usa el cuerpo de la nota para completar la secuencia climatica', () => {
  const result = adaptClimatePlan({
    diagnosis: { vertical: 'clima' },
    slides: [{ type: 'end' }],
  }, {
    editorialVertical: 'clima',
    editorialContext: 'Lluvias durante la jornada.',
    editorialFacts: [{ label: 'Maxima', value: '8 C' }],
    content: 'La mejora continuara durante la tarde. El viento disminuira durante la noche.',
  });

  assert.equal(result.slides.filter((slide) => slide.type !== 'end').length, 3);
  assert.match(result.slides[2].text, /La mejora continuara/);
});

test('elimina frases repetidas al completar la secuencia climatica', () => {
  const result = adaptClimatePlan({
    diagnosis: { vertical: 'clima' },
    slides: [{ type: 'end' }],
  }, {
    editorialVertical: 'clima',
    editorialContext: 'Jornada inestable durante el feriado.',
    editorialFacts: [{ label: 'Maxima', value: '3 grados' }],
    editorialTextual: [
      'Lluvias y frio marcan este lunes feriado en el Sur de Mendoza.',
      'Lluvias y frio marcan este lunes feriado en el Sur de Mendoza.',
      'El Sur de Mendoza atraviesa una jornada marcada por el frio, la nubosidad y las precipitaciones.',
    ],
  });

  assert.equal(
    result.slides[2].text,
    'Lluvias y frio marcan este lunes feriado en el Sur de Mendoza. El Sur de Mendoza atraviesa una jornada marcada por el frio, la nubosidad y las precipitaciones.',
  );
});

test('asigna una señal visual según el dato climático', () => {
  const result = adaptClimatePlan({ diagnosis: { vertical: 'clima' }, slides: [{ type: 'end' }] }, {
    editorialVertical: 'clima',
    editorialContext: 'Jornada inestable.',
    editorialFacts: [
      { label: 'Lluvias', value: '20 mm' },
      { label: 'Viento', value: '40 km/h' },
      { label: 'Temperatura', value: '8°C' },
    ],
  });

  assert.deepEqual(result.slides.find((slide) => slide.type === 'dato').items.map((item) => item.icon), ['rain', 'wind', 'temperature']);
});
