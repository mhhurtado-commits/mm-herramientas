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
import { getContextTypography } from './renderer.mjs';

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

test('normaliza una cita literal y no inventa una cita inexistente', () => {
  const quote = 'La obra comenzará durante el mes próximo';
  const plate = normalizeNewsPlate({
    ...extracted,
    textual: { cita: quote, autor: 'La autoridad', cargo: 'Funcionaria' },
  });
  assert.equal(plate.tipo_placa, 'textual');
  assert.equal(plate.textual.cita, quote);
  assert.equal(plate.textual.verificada, true);
  assert.equal(plate.textual.autor, 'La autoridad');
  assert.equal(plate.textual.cargo, 'Funcionaria');

  const invalid = normalizeNewsPlate({ ...extracted, textual: { cita: 'Una frase inventada' } });
  assert.equal(invalid.textual.cita, '');
  assert.equal(invalid.textual.verificada, false);
  assert.notEqual(invalid.tipo_placa, 'textual');
});

test('habilita una textual cuando la cita literal está en el título de la nota', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    title: 'Inquietantes posteos de Luck Ra: “Me estoy apagando”',
    textual: { cita: 'Me estoy apagando', autor: 'Luck Ra' },
  });

  assert.equal(plate.tipo_placa, 'textual');
  assert.equal(plate.textual.verificada, true);
  assert.equal(plate.textual.cita, 'Me estoy apagando');
});

test('normaliza personas con imagen de nota o imagen cargada y foco seguro', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'retrato-circular',
    personas: [
      { nombre: 'Ana Pérez', rol: 'Intendenta', imagen: 'https://example.com/persona.jpg', origen: 'subida', foco: { x: 2, y: -1 } },
      { nombre: 'Juan López', imagen: extracted.image, origen: 'nota' },
    ],
  });
  assert.equal(plate.tipo_placa, 'retrato-circular');
  assert.equal(plate.personas.length, 2);
  assert.equal(plate.personas[0].origen, 'subida');
  assert.deepEqual(plate.personas[0].foco, { x: 1, y: 0 });
  assert.equal(plate.personas[1].origen, 'nota');
  assert.ok(plate.bloques.some(block => block.tipo === 'retrato'));
});

test('ofrece tres composiciones editoriales cuando hay cita o personas', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    textual: { cita: 'La obra comenzará durante el mes próximo', autor: 'La autoridad' },
    personas: [{ nombre: 'Ana Pérez', imagen: extracted.image }],
  });
  const variants = buildEditorialVariants(plate);
  assert.deepEqual(variants.map(variant => variant.tipo_placa), ['textual', 'noticia', 'noticia']);
  assert.equal(variants[0].recommended, true);
  assert.ok(variants[1].personas.length);
  assert.ok(variants[2].bloques.some(block => block.tipo === 'dato-clave'));
});

test('calcula áreas seguras para cita, retratos y composición dividida', () => {
  for (const type of ['textual', 'retrato-circular', 'editorial-split']) {
    const layout = calculatePlateLayout('portrait', { tipo_placa: type });
    const area = layout[type === 'textual' ? 'quote' : type === 'retrato-circular' ? 'portraits' : 'split'];
    assert.ok(area);
    assert.ok(area.x >= 0 && area.y >= 0);
    assert.ok(area.x + area.w <= layout.canvas.w);
    assert.ok(area.y + area.h <= layout.canvas.h);
  }
});

test('sin cita literal no ofrece una textual como propuesta', () => {
  const plate = normalizeNewsPlate({ ...extracted, personas: [{ nombre: 'Ana Pérez', imagen: extracted.image }] });
  assert.deepEqual(buildEditorialVariants(plate).map(variant => variant.tipo_placa), ['noticia', 'noticia', 'noticia']);
});

test('normaliza imágenes de apoyo para editorial split', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'editorial-split',
    imagenes_apoyo: [{ src: 'https://example.com/support.jpg', origen: 'subida', foco: { x: 2, y: -1 } }],
  });
  assert.equal(plate.imagenes_apoyo.length, 1);
  assert.equal(plate.imagenes_apoyo[0].origen, 'subida');
  assert.deepEqual(plate.imagenes_apoyo[0].foco, { x: 1, y: 0 });
  assert.ok(plate.bloques.some(block => block.tipo === 'imagen-apoyo'));
  const layout = calculatePlateLayout('portrait', plate);
  assert.ok(layout.splitImage);
  assert.ok(layout.splitImage.x >= layout.split.x);
  assert.ok(layout.splitImage.x + layout.splitImage.w <= layout.split.x + layout.split.w);
  const leftGap = layout.splitImage.x - layout.splitPanel.x;
  const rightGap = layout.splitPanel.x + layout.splitPanel.w - (layout.splitImage.x + layout.splitImage.w);
  assert.ok(Math.abs(leftGap - rightGap) < 0.001);
});

test('mantiene tres tipos distintos cuando la sugerida es editorial split', () => {
  const plate = normalizeNewsPlate({ ...extracted, tipo_placa: 'editorial-split' });
  const variants = buildEditorialVariants(plate);
  assert.deepEqual(variants.map(variant => variant.tipo_placa), ['editorial-split', 'noticia', 'noticia']);
  assert.equal(variants[0].etiqueta, plate.etiqueta);
  assert.deepEqual(variants.slice(1).map(variant => variant.etiqueta), ['Actualidad', 'Sociedad']);
});

test('usa tipografías de contexto específicas para formato y tipo', () => {
  const normalPortrait = getContextTypography('portrait', 'noticia');
  const splitPortrait = getContextTypography('portrait', 'editorial-split');
  const textualStory = getContextTypography('story', 'textual');

  assert.ok(normalPortrait.startRatio > splitPortrait.startRatio);
  assert.ok(normalPortrait.minRatio >= splitPortrait.minRatio);
  assert.ok(textualStory.startRatio > getContextTypography('story', 'editorial-split').startRatio);
  assert.equal(normalPortrait.maxLines, 3);
  assert.equal(normalPortrait.reserveLines, 1);
});
