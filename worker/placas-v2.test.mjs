import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlateEditorialPrompt,
  normalizeEditorialResponse,
  deterministicEditorialResponse,
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
  const result = normalizeEditorialResponse({
    redes: {
      instagram: '🚨 Novedad policial. #SanRafael',
      facebook: '🚨 La Policía investiga el hecho. Más detalles: [enlace]',
    },
  }, note);

  assert.match(result.redes.instagram, /🚨/);
  assert.match(result.redes.facebook, /comentarios/i);
  assert.doesNotMatch(result.redes.facebook, /\[enlace\]/i);
  assert.match(result.redes.facebook, /https:\/\/mediamendoza\.com\/politica\/123$/);
});

test('produce una propuesta determinística cuando la IA no está disponible', () => {
  const result = deterministicEditorialResponse(note);

  assert.equal(result.version, 1);
  assert.equal(result.titulo, note.title);
  assert.equal(result.bajada, note.description);
  assert.equal(result.fuente.imagen, note.image);
  assert.equal(result.warnings.includes('ia_no_disponible'), true);
});
