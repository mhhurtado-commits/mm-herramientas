import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlateEditorialPrompt,
  normalizeEditorialResponse,
  deterministicEditorialResponse,
  normalizeSyntheticTitle,
} from './placas-v2.mjs';

const note = {
  title: 'El Gobierno anunció una nueva obra para el sur de Mendoza',
  category: 'politica',
  description: 'La inversión mejorará la conexión de varias localidades.',
  body: 'La obra comenzará durante el mes próximo y contempla nuevos servicios para la región.',
  image: 'https://example.com/cover.jpg',
  images: ['https://example.com/cover.jpg', 'https://example.com/second.jpg'],
  url: 'https://mediamendoza.com/politica/123',
};

test('construye un prompt editorial con reglas y contrato exacto', () => {
  const prompt = buildPlateEditorialPrompt(note);

  assert.match(prompt, /placa_noticia/);
  assert.match(prompt, /NO inventes/);
  assert.match(prompt, /titulo/);
  assert.match(prompt, /bloques/);
  assert.match(prompt, /Instagram/);
  assert.match(prompt, /Facebook/);
  assert.match(prompt, /El Gobierno anunció/);
});

test('normaliza una respuesta parcial de IA con valores seguros', () => {
  const result = normalizeEditorialResponse({ titulo: 'Nueva obra para el sur' }, note);

  assert.equal(result.titulo, 'Nueva obra para el sur');
  assert.equal(result.bajada, note.description);
  assert.equal(result.template_sugerido, 'politica');
  assert.equal(result.fuente.url, note.url);
  assert.ok(result.redes.instagram);
  assert.ok(result.redes.facebook);
  assert.match(result.redes.facebook, /comentarios/i);
  assert.match(result.redes.facebook, /https:\/\/mediamendoza\.com\/politica\/123$/);
  assert.ok(result.bloques.some(block => block.tipo === 'titular'));
});

test('permite que la IA ajuste la familia sin perder la fuente original', () => {
  const result = normalizeEditorialResponse({ template_sugerido: 'policiales', etiqueta: 'Policiales' }, note);

  assert.equal(result.template_sugerido, 'policiales');
  assert.equal(result.etiqueta, 'Policiales');
  assert.equal(result.fuente.categoria, note.category);
});

test('normaliza copys de redes con CTA, emojis y enlace editorial', () => {
  const longNote = { ...note, url: 'https://mediamendoza.com/policiales/251300-Le-hurtaron-la-billetera-tras-un-descuido?utm_source=facebook' };
  const result = normalizeEditorialResponse({
    redes: {
      instagram: '🚨 Novedad policial. #SanRafael',
      facebook: '🚨 La Policía investiga el hecho. 🔗 Leé la nota completa: https://mediamendoza.com/policiales/251300-Le-hurtaron-la-billetera-tras-un-descuido\n\n🔗 Leé la nota completa: [enlace]',
    },
  }, longNote);

  assert.match(result.redes.instagram, /🚨/);
  assert.match(result.redes.instagram, /¿Qué opinás\?/);
  assert.ok((result.redes.instagram.match(/#[\p{L}\d_]+/gu) || []).length >= 3);
  assert.match(result.redes.facebook, /comentarios/i);
  assert.doesNotMatch(result.redes.facebook, /\[enlace\]/i);
  assert.match(result.redes.facebook, /https:\/\/mediamendoza\.com\/policiales\/251300$/);
  assert.equal((result.redes.facebook.match(/Leé la nota completa/gi) || []).length, 1);
});

test('produce una propuesta determinística cuando la IA no está disponible', () => {
  const result = deterministicEditorialResponse(note);

  assert.equal(result.version, 1);
  assert.equal(result.titulo, note.title);
  assert.equal(result.bajada, note.description);
  assert.equal(result.fuente.imagen, note.image);
  assert.equal(result.warnings.includes('ia_no_disponible'), true);
});

test('el prompt exige citas literales y personas con imagen por círculo', () => {
  const prompt = buildPlateEditorialPrompt({ ...note, body: 'La medida, dijo Ana Pérez, mejorará la situación.' });
  assert.match(prompt, /literal/i);
  assert.match(prompt, /textual/);
  assert.match(prompt, /personas/);
  assert.match(prompt, /retrato-circular/);
  assert.match(prompt, /editorial-split/);
});

test('normaliza una respuesta textual verificable del worker', () => {
  const result = normalizeEditorialResponse({
    tipo_placa: 'textual',
    textual: { cita: 'La obra comenzará durante el mes próximo', autor: 'Ana Pérez', cargo: 'Funcionaria' },
    personas: [{ nombre: 'Ana Pérez', rol: 'Funcionaria', imagen: 'https://example.com/ana.jpg' }],
  }, { ...note, body: 'La obra comenzará durante el mes próximo. Ana Pérez anunció la medida.' });
  assert.equal(result.tipo_placa, 'textual');
  assert.equal(result.textual.verificada, true);
  assert.equal(result.personas.length, 1);
});

test('el prompt solicita un titular sintético separado y el nuevo tipo de placa', () => {
  const prompt = buildPlateEditorialPrompt(note);

  assert.match(prompt, /titular\s+sint/i);
  assert.match(prompt, /titulo_sintetico/);
  assert.match(prompt, /titular-arriba/);
  assert.match(prompt, /foto-completa/);
  assert.match(prompt, /datos_clave/);
  assert.match(prompt, /dato-clave/);
});

test('normaliza titulo_sintetico sin reemplazar titulo', () => {
  const result = normalizeEditorialResponse({
    titulo: 'Titular editorial completo',
    titulo_sintetico: 'Titular breve',
    tipo_placa: 'titular-arriba',
  }, note);

  assert.equal(result.titulo, 'Titular editorial completo');
  assert.equal(result.titulo_sintetico, 'Titular breve');
  assert.equal(result.tipo_placa, 'titular-arriba');
});

test('reduce respuestas largas solo en titulo_sintetico', () => {
  const result = normalizeEditorialResponse({
    titulo: 'Titular editorial completo que no debe cambiar',
    titulo_sintetico: 'García Salazar respondió al ranking que ubica a Mendoza última en salarios docentes',
    tipo_placa: 'titular-arriba',
  }, note);

  assert.equal(result.titulo, 'Titular editorial completo que no debe cambiar');
  assert.equal(result.titulo_sintetico, 'García Salazar respondió al ranking salarial docente');
  assert.equal(normalizeSyntheticTitle(result.titulo_sintetico).split(/\s+/).length <= 10, true);
});

test('el prompt y la respuesta del worker soportan comparativa con fuente', () => {
  const prompt = buildPlateEditorialPrompt(note);
  assert.match(prompt, /comparativa/);
  assert.match(prompt, /dos lados/i);
  assert.match(prompt, /contrastes temporales/i);
  assert.match(prompt, /dos momentos/i);
  assert.match(prompt, /no invent/i);

  const result = normalizeEditorialResponse({
    tipo_placa: 'comparativa',
    titulo_sintetico: 'Antes y ahora',
    comparativa: {
      izquierda: { etiqueta: 'Antes', valor: '42%' },
      derecha: { etiqueta: 'Ahora', valor: '58%' },
      fuente: 'Informe oficial',
      fecha: '2026-08-14',
      origen: 'externo',
    },
  }, note);

  assert.equal(result.tipo_placa, 'comparativa');
  assert.equal(result.comparativa.fuente, 'Informe oficial');
  assert.equal(result.comparativa.origen, 'externo');
});
