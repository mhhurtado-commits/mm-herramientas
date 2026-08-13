import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeNewsPlate,
  classifyNewsFamily,
  buildEditorialVariants,
  calculatePlateLayout,
  fitTextToLines,
  normalizeFocus,
  PLATE_TYPES,
  buildPlateExportMetadata,
  normalizeSyntheticTitle,
} from './editorial-core.mjs';

test('normaliza un titular sintético separado del titular editorial', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    titulo: 'Titular editorial completo para la nota',
    titulo_sintetico: 'Una decisión cambia el escenario',
  });

  assert.equal(plate.titulo, 'Titular editorial completo para la nota');
  assert.equal(plate.titulo_sintetico, 'Una decisión cambia el escenario');
  assert.equal(PLATE_TYPES['titular-arriba'].id, 'titular-arriba');
});

test('acorta solo el titular sintético y conserva el dato central', () => {
  const longTitle = 'García Salazar respondió al ranking que ubica a Mendoza última en salarios docentes';

  assert.equal(normalizeSyntheticTitle('García Salazar respondió al ranking salarial docente'), 'García Salazar respondió al ranking salarial docente');
  assert.equal(normalizeSyntheticTitle(longTitle), 'García Salazar respondió al ranking salarial docente');
});

test('recomienda titular arriba y conserva noticia como alternativa visual', () => {
  const plate = normalizeNewsPlate({ ...extracted, titulo_sintetico: 'Una decisión cambia el escenario' });
  const variants = buildEditorialVariants(plate);

  assert.equal(variants[0].tipo_placa, 'titular-arriba');
  assert.equal(variants[0].recommended, true);
  assert.equal(variants[0].titulo_sintetico, 'Una decisión cambia el escenario');
  assert.equal(variants.some(variant => variant.tipo_placa === 'noticia'), true);
});

test('ofrece titular abajo como segunda variante sintética con el mismo título', () => {
  const plate = normalizeNewsPlate({ ...extracted, titulo_sintetico: 'Una decisión cambia el escenario' });
  const variants = buildEditorialVariants(plate);

  assert.equal(variants[0].tipo_placa, 'titular-arriba');
  assert.equal(variants[1].tipo_placa, 'titular-abajo');
  assert.equal(variants[1].titulo_sintetico, variants[0].titulo_sintetico);
  assert.equal(variants[1].recommended, false);
});

test('calcula layout sintético con titular arriba e imagen debajo', () => {
  const plate = normalizeNewsPlate({ ...extracted, tipo_placa: 'titular-arriba' });
  const layout = calculatePlateLayout('portrait', plate);

  assert.equal(layout.synthetic, true);
  assert.ok(layout.title.y < layout.image.y);
  assert.ok(layout.title.y + layout.title.h <= layout.image.y);
  assert.equal(layout.dek.h, 0);
  assert.equal(layout.context.h, 0);
});

test('calcula layout sintético con imagen arriba y titular abajo', () => {
  const plate = normalizeNewsPlate({ ...extracted, tipo_placa: 'titular-abajo' });
  const layout = calculatePlateLayout('portrait', plate);

  assert.equal(layout.synthetic, true);
  assert.ok(layout.image.y < layout.title.y);
  assert.ok(layout.image.y + layout.image.h <= layout.title.y);
  assert.equal(layout.dek.h, 0);
  assert.equal(layout.context.h, 0);
});

test('genera metadatos mínimos para registrar el experimento', () => {
  const plate = normalizeNewsPlate({ ...extracted, tipo_placa: 'titular-arriba', titulo_sintetico: 'Titular breve' });
  const metadata = buildPlateExportMetadata(plate, 'portrait', new Date('2026-08-13T15:30:00.000Z'));

  assert.deepEqual(metadata, {
    modelo: 'titular-arriba',
    formato: 'portrait',
    seccion: 'politica',
    longitud_titular: 13,
    fecha: '2026-08-13',
  });
});
import { getContextTypography, getSyntheticTypography, renderNewsPlate } from './renderer.mjs';

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
  assert.deepEqual(variants.map(variant => variant.id), ['politica-titular-arriba', 'politica-titular-abajo', 'general-editorial']);
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

test('renderiza solo el titular sintético y no la bajada en titular arriba', () => {
  const calls = [];
  const ctx = {
    canvas: {},
    clearRect() {}, fillRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, clip() {}, rect() {}, arcTo() {}, fill() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(value) { return { width: String(value).length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }; },
    fillText(value) { calls.push(String(value)); },
  };
  const plate = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'titular-arriba',
    titulo: 'Titular editorial completo',
    titulo_sintetico: 'Titular breve',
    bajada: 'Esta bajada no debe aparecer en la placa sintética.',
    contexto: 'Este contexto tampoco debe aparecer.',
  });

  renderNewsPlate(ctx, plate, 'portrait', {});

  assert.ok(calls.includes('Titular breve'));
  assert.equal(calls.includes(plate.bajada), false);
  assert.equal(calls.includes(plate.contexto), false);
});

test('da al titular sintético una escala dominante en 4:5', () => {
  const typography = getSyntheticTypography('portrait');

  assert.ok(typography.startRatio >= 0.075);
  assert.ok(typography.minRatio >= 0.03);
  assert.equal(typography.maxLines, 3);
});
