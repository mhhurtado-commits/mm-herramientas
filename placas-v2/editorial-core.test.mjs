import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeNewsPlate,
  normalizeAlertPlate,
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
  assert.equal(PLATE_TYPES['foto-completa'].id, 'foto-completa');
  assert.equal(PLATE_TYPES.pulso, undefined);
  assert.equal(PLATE_TYPES.conversacion.id, 'conversacion');
  assert.equal(PLATE_TYPES.actualizacion.id, 'actualizacion');
});

test('normaliza una alerta meteorológica de forma determinística', () => {
  const now = new Date('2026-08-28T14:35:00');
  const plate = normalizeAlertPlate({
    mensaje: 'Continúa la tormenta con precipitaciones de lluvia débil a moderada sobre la Ruta 143.',
    fuente: 'Radar San Rafael · Sr. Marcelo Peña',
  }, now);

  assert.equal(plate.tipo_placa, 'alerta');
  assert.equal(plate.template_sugerido, 'alerta');
  assert.equal(plate.etiqueta, 'Alerta meteorológica');
  assert.equal(plate.alerta.mensaje, 'Continúa la tormenta con precipitaciones de lluvia débil a moderada sobre la Ruta 143.');
  assert.equal(plate.alerta.fuente, 'Radar San Rafael · Sr. Marcelo Peña');
  assert.equal(plate.fecha, '2026-08-28');
  assert.match(plate.alerta.hora, /^\d{2}:\d{2}$/);
  assert.equal(plate.bajada, plate.alerta.mensaje);
});

test('la alerta sin fuente queda con atribución vacía y fecha según now', () => {
  const plate = normalizeAlertPlate({ mensaje: 'Alerta de granizo' }, new Date('2026-01-05T09:00:00'));
  assert.equal(plate.alerta.fuente, '');
  assert.equal(plate.fecha, '2026-01-05');
});

test('calculatePlateLayout define regiones para el tipo alerta', () => {
  const plate = normalizeAlertPlate({ mensaje: 'Tormenta' }, new Date('2026-08-28T14:35:00'));
  const layout = calculatePlateLayout('portrait', plate);
  assert.equal(layout.alerta, true);
  assert.ok(layout.label && layout.timestamp && layout.message && layout.footer);
  assert.equal(layout.image.w, 0);
});

test('normaliza pregunta social y habilita conversación sin alterar la fuente', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    titulo_sintetico: 'Nueva obra para el sur',
    pregunta_social: '¿Cómo impactará la obra en tu zona?',
    datos_clave: [{ label: 'Inicio', value: 'Septiembre' }, { label: 'Inversión', value: '$20 millones' }],
  });

  assert.equal(plate.pregunta_social, '¿Cómo impactará la obra en tu zona?');
  assert.equal(plate.fuente.url, extracted.url);
  const variants = buildEditorialVariants(plate);
  assert.deepEqual(variants.map(variant => variant.tipo_placa), ['noticia', 'conversacion', 'foto-completa']);
  assert.ok(new Set(variants.map(variant => variant.template_sugerido)).size >= 3);
  assert.equal(buildEditorialVariants(plate)[0].recommended, true);

  const contracted = normalizeNewsPlate({ ...plate, tipo_placa: 'conversacion' });
  assert.equal(buildEditorialVariants(contracted).length, 3);
  assert.ok(new Set(buildEditorialVariants(contracted).map(variant => variant.template_sugerido)).size >= 3);
});

test('usa una pregunta neutral cuando falta la pregunta social y no recomienda actualización con un solo dato', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    titulo_sintetico: 'Nueva obra para el sur',
    datos_clave: [{ label: 'Inicio', value: 'Septiembre' }],
  });

  assert.equal(plate.pregunta_social, '¿Qué opinás?');
  assert.equal(buildEditorialVariants(plate).some(variant => variant.tipo_placa === 'actualizacion'), false);
});

test('calcula áreas seguras para conversación y actualización en los cuatro formatos', () => {
  for (const type of ['conversacion', 'actualizacion']) {
    for (const format of ['landscape', 'square', 'portrait', 'story']) {
      const layout = calculatePlateLayout(format, {
        tipo_placa: type,
        datos_clave: [{ value: 'Uno' }, { value: 'Dos' }],
      });
      const area = layout[type === 'conversacion' ? 'question' : 'update'];
      assert.ok(area);
      assert.ok(area.x >= 0 && area.y >= 0, `${type}/${format}: origen seguro`);
      assert.ok(area.x + area.w <= layout.canvas.w, `${type}/${format}: ancho seguro`);
      assert.ok(area.y + area.h <= layout.footer.y, `${type}/${format}: alto seguro`);
    }
  }
});

test('prioriza el tipo indicado por el contrato sobre las variantes sociales', () => {
  const plate = normalizeNewsPlate({ ...extracted, tipo_placa: 'actualizacion', titulo_sintetico: 'Nueva obra para el sur', pregunta_social: '¿Cómo impacta en tu zona?' });
  const variants = buildEditorialVariants(plate);
  assert.equal(variants[0].tipo_placa, 'actualizacion');
  assert.equal(variants[0].recommended, true);
});

test('acorta solo el titular sintético y conserva el dato central', () => {
  const longTitle = 'García Salazar respondió al ranking que ubica a Mendoza última en salarios docentes';

  assert.equal(normalizeSyntheticTitle('García Salazar respondió al ranking salarial docente'), 'García Salazar respondió al ranking salarial docente');
  assert.equal(normalizeSyntheticTitle(longTitle), 'García Salazar respondió al ranking salarial docente');
});

test('no recomienda Pulso cuando hay foto y titular sintético', () => {
  const plate = normalizeNewsPlate({ ...extracted, titulo_sintetico: 'Una decisión cambia el escenario' });
  const variants = buildEditorialVariants(plate);

  assert.notEqual(variants[0].tipo_placa, 'pulso');
  assert.equal(variants[0].recommended, true);
  assert.equal(variants[0].titulo_sintetico, 'Una decisión cambia el escenario');
  assert.equal(variants[0].titulo_sintetico, 'Una decisión cambia el escenario');
});

test('no agrega una variante social si no hay pregunta', () => {
  const plate = normalizeNewsPlate({ ...extracted, titulo_sintetico: 'Una decisión cambia el escenario' });
  const variants = buildEditorialVariants(plate);

  assert.equal(variants.some(variant => variant.tipo_placa === 'pulso'), false);
});

test('convierte contratos heredados de Pulso a Foto completa', () => {
  const plate = normalizeNewsPlate({ ...extracted, tipo_placa: 'pulso' });
  assert.equal(plate.tipo_placa, 'foto-completa');
});

test('normaliza hasta tres impactos verificables para Qué cambia', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    impactos: [
      { label: 'Desde cuándo', value: 'Desde septiembre' },
      { label: 'Alcance', value: 'A 12.000 vecinos', detail: 'en el sur' },
      { label: 'Estado', value: 'Obra terminada' },
      { label: 'Extra', value: 'No debe entrar' },
    ],
  });

  assert.equal(PLATE_TYPES['que-cambia'].id, 'que-cambia');
  assert.deepEqual(plate.impactos, [
    { label: 'Desde cuándo', value: 'Desde septiembre', detail: '' },
    { label: 'Alcance', value: 'A 12.000 vecinos', detail: 'en el sur' },
    { label: 'Estado', value: 'Obra terminada', detail: '' },
  ]);
  assert.equal(plate.bloques.filter(block => block.tipo === 'impacto').length, 3);
});

test('calcula áreas seguras de Qué cambia en los cuatro formatos', () => {
  for (const format of ['landscape', 'square', 'portrait', 'story']) {
    const layout = calculatePlateLayout(format, { tipo_placa: 'que-cambia' });
    assert.ok(layout.impacts.x >= 0 && layout.impacts.y >= 0, format);
    assert.ok(layout.impacts.x + layout.impacts.w <= layout.canvas.w, format);
    assert.ok(layout.impacts.y + layout.impacts.h <= layout.footer.y, format);
  }
});

test('normaliza hasta tres datos clave y conserva un fallback de contexto', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    datos_clave: [
      { label: 'Aumento', value: '35%', detail: 'desde agosto' },
      { label: 'Beneficiarios', value: '12.000' },
      { label: 'Duración', value: '6 meses' },
      { label: 'Extra', value: 'no debe entrar' },
    ],
  });

  assert.equal(plate.datos_clave.length, 3);
  assert.deepEqual(plate.datos_clave[0], { label: 'Aumento', value: '35%', detail: 'desde agosto' });

  const fallback = normalizeNewsPlate({ ...extracted, contexto: 'La medida empieza en agosto.' });
  assert.deepEqual(fallback.datos_clave, [{ label: '', value: 'La medida empieza en agosto.', detail: '' }]);
});

test('normaliza una comparativa con dos lados y conserva su procedencia', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'comparativa',
    titulo_sintetico: 'Antes y ahora del salario docente',
    comparativa: {
      izquierda: { etiqueta: 'Antes', valor: '42%', detalle: '2025' },
      derecha: { etiqueta: 'Ahora', valor: '58%', detalle: '2026' },
      fuente: 'Informe oficial',
      fecha: '2026-08-14',
      origen: 'externo',
    },
  });

  assert.equal(PLATE_TYPES.comparativa.id, 'comparativa');
  assert.equal(plate.tipo_placa, 'comparativa');
  assert.deepEqual(plate.comparativa, {
    izquierda: { etiqueta: 'Antes', valor: '42%', detalle: '2025' },
    derecha: { etiqueta: 'Ahora', valor: '58%', detalle: '2026' },
    fuente: 'Informe oficial',
    fecha: '2026-08-14',
    origen: 'externo',
  });
});

test('acepta alias antes/ahora y no crea comparativa con un solo lado', () => {
  const aliases = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'comparativa',
    comparativa: { antes: { nombre: '2025', valor: '42' }, ahora: { nombre: '2026', valor: '58' } },
  });
  assert.deepEqual(aliases.comparativa.izquierda, { etiqueta: '2025', valor: '42', detalle: '' });
  assert.deepEqual(aliases.comparativa.derecha, { etiqueta: '2026', valor: '58', detalle: '' });
  assert.equal(aliases.comparativa.origen, 'manual');

  const incomplete = normalizeNewsPlate({ ...extracted, tipo_placa: 'comparativa', comparativa: { izquierda: { valor: '42' } } });
  assert.equal(incomplete.comparativa, null);
  assert.notEqual(incomplete.tipo_placa, 'comparativa');
});

test('ofrece comparativa como variante disponible para una nota con datos', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    comparativa: { izquierda: { etiqueta: 'Antes', valor: '42' }, derecha: { etiqueta: 'Ahora', valor: '58' } },
  });
  assert.equal(buildEditorialVariants(plate).some(variant => variant.tipo_placa === 'comparativa'), true);
});

test('no ofrece comparativa automática cuando la nota no tiene dos lados', () => {
  const plate = normalizeNewsPlate(extracted);
  const variants = buildEditorialVariants(plate);
  assert.equal(variants.some(variant => variant.tipo_placa === 'comparativa'), false);
});

test('calcula layout comparativo seguro en portrait, square y story', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'comparativa',
    comparativa: { izquierda: { etiqueta: 'Antes', valor: '42' }, derecha: { etiqueta: 'Ahora', valor: '58' } },
  });
  for (const format of ['portrait', 'square', 'story']) {
    const layout = calculatePlateLayout(format, plate);
    assert.equal(layout.comparison, true);
    assert.ok(layout.image.h >= layout.canvas.h * 0.18);
    assert.ok(layout.title.y + layout.title.h <= layout.leftCard.y);
    assert.ok(layout.leftCard.x + layout.leftCard.w <= layout.canvas.w + 0.001);
    assert.ok(layout.rightCard.x + layout.rightCard.w <= layout.canvas.w + 0.001);
    assert.ok(layout.rightCard.y + layout.rightCard.h <= layout.footer.y);
    assert.equal(layout.dek.h, 0);
    assert.equal(layout.context.h, 0);
  }
});

test('calcula layout social de efemérides con hasta tres tarjetas', () => {
  const plate = { tipo_placa: 'efemerides-social', efemerides: [{}, {}, {}] };
  const layout = calculatePlateLayout('portrait', plate);

  assert.equal(PLATE_TYPES['efemerides-social'].id, 'efemerides-social');
  assert.equal(layout.efemerides, true);
  assert.equal(layout.cards.length, 3);
  assert.ok(layout.cards.every(card => card.y + card.h <= layout.footer.y));
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

test('calcula layout de foto completa con texto superpuesto y sin bajada', () => {
  const plate = normalizeNewsPlate({ ...extracted, tipo_placa: 'foto-completa' });
  const layout = calculatePlateLayout('portrait', plate);

  assert.equal(layout.syntheticFullBleed, true);
  assert.equal(layout.image.x, 0);
  assert.equal(layout.image.y, 0);
  assert.equal(layout.image.w, layout.canvas.w);
  assert.equal(layout.image.h, layout.canvas.h);
  assert.ok(layout.title.y > layout.canvas.h * 0.55);
  assert.ok(layout.title.y + layout.title.h < layout.footer.y);
  assert.equal(layout.dek.h, 0);
  assert.equal(layout.context.h, 0);
});

test('calcula layout de dato clave con módulos seguros y sin bajada', () => {
  const plate = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'dato-clave',
    datos_clave: [{ label: 'Aumento', value: '35%' }, { label: 'Plazo', value: '6 meses' }],
  });
  const layout = calculatePlateLayout('portrait', plate);

  assert.equal(layout.dataCard, true);
  assert.ok(layout.title.y < layout.primaryFact.y);
  assert.ok(layout.primaryFact.y + layout.primaryFact.h <= layout.footer.y);
  assert.equal(layout.dek.h, 0);
  assert.equal(layout.context.h, 0);
});

test('reduce la tarjeta secundaria cuando sólo hay un dato secundario', () => {
  const single = calculatePlateLayout('portrait', normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'dato-clave',
    datos_clave: [{ label: 'Zona', value: 'Las Vírgenes' }, { label: 'Causa', value: 'Obras' }],
  }));
  const double = calculatePlateLayout('portrait', normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'dato-clave',
    datos_clave: [{ label: 'Zona', value: 'Las Vírgenes' }, { label: 'Causa', value: 'Obras' }, { label: 'Estado', value: 'Desvío' }],
  }));

  assert.ok(single.secondaryFacts.h < double.secondaryFacts.h);
  assert.ok(single.secondaryFacts.y > single.primaryFact.y);
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

import { getContextTypography, getFullBleedBranding, getFullBleedTypography, getSyntheticTypography, renderNewsPlate } from './renderer.mjs';

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
  assert.deepEqual(variants.map(variant => variant.id), ['politica-titular-arriba', 'politica-titular-abajo', 'general-foto-completa']);
  assert.equal(variants.every(variant => variant.bloques.length > 0), true);
});

test('no repite la sección en una tercera alternativa', () => {
  const plate = normalizeNewsPlate({ ...extracted, category: 'clima' });
  const variants = buildEditorialVariants(plate);
  assert.deepEqual(variants.map(variant => variant.tipo_placa), ['titular-arriba', 'titular-abajo', 'foto-completa']);
  assert.deepEqual(variants.map(variant => variant.etiqueta), ['Clima', 'Clima', 'Actualidad']);
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
  assert.deepEqual(variants.map(variant => variant.tipo_placa), ['textual', 'titular-arriba', 'foto-completa', 'dato-clave']);
  assert.equal(variants[0].recommended, true);
  assert.ok(variants[1].personas.length);
  assert.ok(variants[3].bloques.some(block => block.tipo === 'dato-clave'));
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
  assert.deepEqual(buildEditorialVariants(plate).map(variant => variant.tipo_placa), ['noticia', 'titular-abajo', 'foto-completa', 'dato-clave']);
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
  assert.deepEqual(variants.map(variant => variant.tipo_placa), ['editorial-split', 'titular-arriba', 'foto-completa', 'dato-clave']);
  assert.equal(variants[0].etiqueta, plate.etiqueta);
  assert.deepEqual(variants.slice(1).map(variant => variant.etiqueta), ['Actualidad', 'Sociedad', 'Economía']);
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
    moveTo() {}, lineTo() {}, stroke() {}, clip() {}, rect() {}, arcTo() {}, arc() {}, fill() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(value) { const size = Number.parseInt(this.font, 10) || 16; return { width: String(value).length * size / 10, actualBoundingBoxAscent: size, actualBoundingBoxDescent: 3 }; },
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

test('renderiza foto completa sin etiqueta, bajada ni contexto', () => {
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
    tipo_placa: 'foto-completa',
    titulo: 'Titular editorial completo',
    titulo_sintetico: 'Titular breve',
    etiqueta: 'Política',
    bajada: 'Esta bajada no debe aparecer.',
    contexto: 'Este contexto tampoco debe aparecer.',
  });

  renderNewsPlate(ctx, plate, 'portrait', {});

  assert.ok(calls.includes('Titular breve'));
  assert.equal(calls.includes('POLÍTICA'), false);
  assert.equal(calls.includes(plate.bajada), false);
  assert.equal(calls.includes(plate.contexto), false);
});

test('renderiza dato clave sin bajada ni contexto', () => {
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
    tipo_placa: 'dato-clave',
    titulo: 'Titular editorial completo',
    datos_clave: [{ label: 'Aumento', value: '35%', detail: 'desde agosto' }, { label: 'Plazo', value: '6 meses' }],
    bajada: 'No debe aparecer.',
    contexto: 'Tampoco debe aparecer.',
  });

  renderNewsPlate(ctx, plate, 'portrait', {});

  assert.ok(calls.includes('35%'));
  assert.ok(calls.includes('6 meses'));
  assert.ok(calls.includes('Fuente: Mediamendoza'));
  assert.ok(calls.includes('www.mediamendoza.com'));
  assert.equal(calls.includes('Fuente: Media Mendoza'), false);
  assert.equal(calls.includes(plate.bajada), false);
  assert.equal(calls.includes(plate.contexto), false);
});

test('renderiza comparativa con dos valores y sin bajada ni contexto', () => {
  const calls = [];
  const fills = [];
  const ctx = {
    canvas: {},
    clearRect() {}, fillRect(x, y, w, h) { fills.push({ style: this.fillStyle, x, y, w, h }); }, save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, clip() {}, rect() {}, arcTo() {}, arc() {}, fill() { fills.push({ style: this.fillStyle }); },
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(value) { return { width: String(value).length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }; },
    fillText(value) { calls.push(String(value)); }, drawImage() {},
  };
  const plate = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'comparativa',
    titulo_sintetico: 'Antes y ahora',
    bajada: 'Esta bajada no debe aparecer.',
    contexto: 'Este contexto tampoco debe aparecer.',
    comparativa: {
      izquierda: { etiqueta: 'Antes', valor: '42%', detalle: '2025' },
      derecha: { etiqueta: 'Ahora', valor: '58%', detalle: '2026' },
    },
  });

  renderNewsPlate(ctx, plate, 'portrait', { logo: { complete: true, naturalWidth: 120, naturalHeight: 40 } });

  assert.ok(calls.includes('Antes y ahora'));
  assert.ok(calls.includes('42%'));
  assert.ok(calls.includes('58%'));
  assert.equal(calls.includes(plate.bajada), false);
  assert.equal(calls.includes(plate.contexto), false);
  assert.equal(fills.some(fill => fill.style === '#251e42'), false);
});

test('ajusta datos largos y muestra el logo en dato clave', () => {
  const calls = [];
  let imageCalls = 0;
  const ctx = {
    canvas: {},
    clearRect() {}, fillRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, clip() {}, rect() {}, arcTo() {}, fill() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(value) { const size = Number.parseInt(this.font, 10) || 16; return { width: String(value).length * size / 10, actualBoundingBoxAscent: size, actualBoundingBoxDescent: 3 }; },
    fillText(value) { calls.push(String(value)); },
    drawImage() { imageCalls += 1; },
  };
  const longValue = 'Las Vírgenes y su intersección permanecen con tránsito restringido';
  const plate = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'dato-clave',
    datos_clave: [{ label: 'Lugar', value: longValue, detail: 'Intersección del siniestro' }],
  });

  renderNewsPlate(ctx, plate, 'portrait', { logo: { complete: true, naturalWidth: 120, naturalHeight: 40 } });

  assert.equal(calls.includes(longValue), false);
  assert.ok(calls.some(value => value.includes('Las Vírgenes')));
  assert.equal(imageCalls, 1);
});

test('da al titular sintético una escala dominante en 4:5', () => {
  const typography = getSyntheticTypography('portrait');

  assert.ok(typography.startRatio >= 0.075);
  assert.ok(typography.minRatio >= 0.03);
  assert.equal(typography.maxLines, 3);
});

test('refuerza jerarquía de foto completa específicamente en Story', () => {
  const normal = getSyntheticTypography('story');
  const story = getFullBleedTypography('story');
  const branding = getFullBleedBranding('story');

  assert.ok(story.startRatio > normal.startRatio);
  assert.ok(story.minRatio > normal.minRatio);
  assert.equal(branding.logoRatio > getFullBleedBranding('portrait').logoRatio, true);
  assert.equal(branding.gradientStartRatio < getFullBleedBranding('portrait').gradientStartRatio, true);
});

test('renderiza las señales y footer institucional de Conversación y Actualización', () => {
  for (const [type, signal] of [['conversacion', 'CONVERSACIÓN'], ['actualizacion', 'ACTUALIZACIÓN']]) {
    const calls = [];
    let imageCalls = 0;
    const ctx = {
      canvas: {}, clearRect() {}, fillRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {},
      moveTo() {}, lineTo() {}, stroke() {}, clip() {}, rect() {}, arcTo() {}, arc() {}, fill() {},
      createLinearGradient() { return { addColorStop() {} }; },
      measureText(value) { return { width: String(value).length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }; },
      fillText(value) { calls.push(String(value)); }, drawImage() { imageCalls += 1; },
    };
    const plate = normalizeNewsPlate({
      ...extracted, tipo_placa: type, titulo_sintetico: 'Una noticia para compartir',
      pregunta_social: '¿Cómo impacta esta obra en tu zona?',
      datos_clave: [{ label: 'Inicio', value: 'Septiembre' }, { label: 'Inversión', value: '$20 millones' }],
      bajada: 'Esta bajada no debe aparecer.',
    });
    renderNewsPlate(ctx, plate, 'portrait', { logo: { complete: true, naturalWidth: 120, naturalHeight: 40 } });
    assert.ok(calls.includes(signal), type);
    assert.equal(calls.includes(plate.bajada), false, type);
    assert.equal(imageCalls, 1, `${type}: logo institucional`);
    assert.ok(calls.includes('Fuente: mediamendoza'), `${type}: fuente institucional`);
    assert.ok(calls.includes('www.mediamendoza.com'), `${type}: dominio institucional`);
  }
});

test('renderiza Qué cambia con impactos, logo y footer institucional', () => {
  const calls = [];
  let imageCalls = 0;
  const ctx = {
    canvas: {}, clearRect() {}, fillRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, clip() {}, rect() {}, arcTo() {}, arc() {}, fill() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(value) { return { width: String(value).length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }; },
    fillText(value) { calls.push(String(value)); }, drawImage() { imageCalls += 1; },
  };
  const plate = normalizeNewsPlate({
    ...extracted,
    tipo_placa: 'que-cambia',
    impactos: [{ label: 'Desde cuándo', value: 'Desde septiembre' }, { label: 'Alcance', value: 'A 12.000 vecinos' }],
  });
  const layout = calculatePlateLayout('portrait', plate);
  renderNewsPlate(ctx, plate, 'portrait', { logo: { complete: true, naturalWidth: 120, naturalHeight: 40 } });

  assert.ok(layout.impacts.y + layout.impacts.h <= layout.footer.y);
  assert.ok(calls.includes('QUÉ CAMBIA'));
  assert.ok(calls.includes('Fuente: mediamendoza'));
  assert.ok(calls.includes('www.mediamendoza.com'));
  assert.equal(imageCalls, 1);
});
