import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeNewsPlate,
  classifyNewsFamily,
  buildEditorialVariants,
  calculatePlateLayout,
  fitTextToLines,
  normalizeFocus,
} from './editorial-core.mjs';

const extracted = {
  title: 'El Gobierno anunció una nueva obra de infraestructura para el sur de Mendoza',
  category: 'politica',
  description: 'La inversión mejorará la conexión y los servicios de varias localidades.',
  body: 'La obra comenzará durante el mes próximo y contempla nuevos servicios para la región. La inversión fue anunciada este martes por las autoridades provinciales.',
  image: 'https://example.com/cover.jpg',
  images: ['https://example.com/cover.jpg', 'https://example.com/second.jpg'],
  url: 'https://mediamendoza.com/politica/123',
};

test('normaliza la respuesta actual del worker al contrato placa_noticia', () => {
  const plate = normalizeNewsPlate(extracted);

  assert.equal(plate.tipo, 'placa_noticia');
  assert.equal(plate.version, 1);
  assert.equal(plate.fuente.url, extracted.url);
  assert.equal(plate.fuente.titulo_original, extracted.title);
  assert.equal(plate.titulo, extracted.title);
  assert.equal(plate.bajada, extracted.description);
  assert.equal(plate.etiqueta, 'Política');
  assert.equal(plate.template_sugerido, 'politica');
  assert.equal(plate.bloques.some(block => block.tipo === 'imagen'), true);
  assert.equal(plate.fuente.imagenes.length, 2);
});

test('usa fallback general cuando la categoría no es conocida', () => {
  const plate = normalizeNewsPlate({ ...extracted, category: 'otra-seccion' });

  assert.equal(plate.template_sugerido, 'general');
  assert.equal(plate.etiqueta, 'Actualidad');
  assert.equal(plate.color_principal, '#a6ce39');
});

test('clasifica familias por reglas de sección sin depender de IA', () => {
  assert.equal(classifyNewsFamily('policiales').id, 'policiales');
  assert.equal(classifyNewsFamily('sociedad').id, 'sociales');
  assert.equal(classifyNewsFamily('clima').id, 'clima');
  assert.equal(classifyNewsFamily('economia').id, 'economia');
  assert.equal(classifyNewsFamily('desconocida').id, 'general');
});

test('genera una propuesta recomendada y dos alternativas determinísticas', () => {
  const plate = normalizeNewsPlate(extracted);
  const variants = buildEditorialVariants(plate);

  assert.equal(variants.length, 3);
  assert.equal(variants[0].recommended, true);
  assert.deepEqual(variants.map(variant => variant.id), ['politica-principal', 'politica-datos', 'general-editorial']);
  assert.equal(variants.every(variant => variant.bloques.length > 0), true);
});

test('calcula layouts sin salir del canvas en los cuatro formatos', () => {
  const plate = normalizeNewsPlate(extracted);
  for (const format of ['landscape', 'square', 'portrait', 'story']) {
    const layout = calculatePlateLayout(format, plate);
    for (const rect of Object.values(layout).filter(value => value && typeof value.x === 'number')) {
      assert.ok(rect.x >= 0 && rect.y >= 0);
      assert.ok(rect.x + rect.w <= layout.canvas.w + 0.001, `${format}: ancho fuera de límites`);
      assert.ok(rect.y + rect.h <= layout.canvas.h + 0.001, `${format}: alto fuera de límites`);
    }
  }
});

test('usa una composición más compacta para historias', () => {
  const plate = normalizeNewsPlate(extracted);
  const story = calculatePlateLayout('story', plate);
  const portrait = calculatePlateLayout('portrait', plate);

  assert.equal(story.header.h, 0);
  assert.equal(portrait.header.h, 0);
  assert.ok(story.image.h / story.canvas.h < portrait.image.h / portrait.canvas.h);
  assert.ok(story.footer.h < portrait.footer.h);
  assert.ok(story.context.y / story.canvas.h < portrait.context.y / portrait.canvas.h);
  assert.ok((story.dek.y - story.label.y) / (story.canvas.h - story.label.y - story.footer.h) < 0.4);
  assert.ok((story.context.y - story.label.y) / (story.canvas.h - story.label.y - story.footer.h) > 0.55);
});

test('usa foto a sangre y elimina el header en todos los formatos', () => {
  const plate = normalizeNewsPlate(extracted);
  for (const format of ['landscape', 'square', 'portrait', 'story']) {
    const layout = calculatePlateLayout(format, plate);
    assert.equal(layout.header.h, 0);
    assert.equal(layout.image.y, 0);
    assert.ok(layout.image.h > layout.canvas.h * 0.35);
  }
});

test('ajusta textos largos a un máximo de líneas con truncado legible', () => {
  const result = fitTextToLines('Una noticia muy larga que debe entrar en una placa sin desbordarse del bloque visual', 22, 2);

  assert.equal(result.lines.length, 2);
  assert.equal(result.truncated, true);
  assert.match(result.lines.at(-1), /…$/);
});

test('normaliza el foco de recorte dentro del área segura', () => {
  assert.deepEqual(normalizeFocus({ x: 2, y: -1 }), { x: 1, y: 0 });
  assert.deepEqual(normalizeFocus({ x: '0.25', y: '0.75' }), { x: 0.25, y: 0.75 });
  assert.deepEqual(normalizeFocus(), { x: 0.5, y: 0.5 });
});
