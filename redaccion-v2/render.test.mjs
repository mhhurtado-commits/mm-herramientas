import test from 'node:test';
import assert from 'node:assert/strict';
import { escaparHtml, htmlTitulares, htmlFuentes, htmlNota, htmlNotaGuardada, htmlNoticiaMonitor, htmlPortada, htmlMiniaturas } from './render.mjs';

test('escapa HTML peligroso', () => {
  assert.equal(escaparHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});

test('los titulares se renderizan con boton de copiar y sin onclick inline', () => {
  const html = htmlTitulares(['Un titular <b>malo</b>'], [{ nombre: 'Ángulo', descripcion: 'Desc' }]);
  assert.match(html, /Un titular &lt;b&gt;malo&lt;\/b&gt;/);
  assert.match(html, /data-copiar=/);
  assert.equal(/onclick=/.test(html), false);
});

test('las fuentes solo incluyen links http y abren en otra pestaña', () => {
  const html = htmlFuentes([
    { titulo: 'Buena', url: 'https://uno.com/1', medio: 'UNO' },
    { titulo: 'Mala', url: 'javascript:alert(1)', medio: 'X' },
  ]);
  assert.match(html, /https:\/\/uno\.com\/1/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.equal(html.includes('javascript:'), false);
});

test('la nota renderiza titular, cuerpo y categoria escapados', () => {
  const html = htmlNota({ titular: 'T', cuerpo: 'P1\n\nP2', categoria: 'Policiales', hashtags: ['#Uno'] });
  assert.match(html, /Policiales/);
  assert.match(html, /#Uno/);
  assert.match(html, /white-space:pre-wrap/);
});

test('la tarjeta del monitor no rompe el HTML con titulos ajenos', () => {
  const html = htmlNoticiaMonitor({ nombre: 'UNO', titulo: '<script>alert(1)</script>', link: 'https://uno.com/1', pubDate: '2026-10-27' });
  assert.equal(html.includes('<script>'), false);
  assert.match(html, /&lt;script&gt;/);
});

test('la nota con bajada y el boton de guardar se renderizan', () => {
  const html = htmlNota({ titular: 'T', cuerpo: 'C', bajada: 'Resumen', categoria: 'X' });
  assert.match(html, /Resumen/);
  assert.match(html, /data-guardar-nota/);
});

test('la nota permite copiar titular, cuerpo y todo junto', () => {
  const html = htmlNota({ titular: 'Mi titular', cuerpo: 'P1\n\nP2' });
  const copias = [...html.matchAll(/data-copiar="([^"]*)"/g)].map(m => m[1]);
  assert.ok(copias.includes('Mi titular'), 'falta el titular');
  assert.ok(copias.includes('P1\n\nP2'), 'falta el cuerpo');
  assert.ok(copias.includes('Mi titular\n\nP1\n\nP2'), 'falta el todo');
});

test('la portada ajena se muestra por el proxy y con su credito', () => {
  const html = htmlPortada(
    { url: 'https://otro.com/foto.jpg', origen: 'original' },
    { medio: 'Los Andes', base: 'https://worker.dev' },
  );
  assert.match(html, /src="https:\/\/worker\.dev\/\?image=https%3A%2F%2Fotro\.com%2Ffoto\.jpg"/);
  assert.match(html, /data-directa="https:\/\/otro\.com\/foto\.jpg"/);
  assert.match(html, /Original de Los Andes/);
});

test('la portada generada no pasa por el proxy y avisa que es de IA', () => {
  const html = htmlPortada({ url: 'data:image/jpeg;base64,AAA', origen: 'ia' }, { base: 'https://worker.dev' });
  assert.match(html, /src="data:image\/jpeg;base64,AAA"/);
  assert.match(html, /Generada con IA/);
  assert.equal(html.includes('image='), false);
});

test('la portada vacia no renderiza nada', () => {
  assert.equal(htmlPortada({}), '');
  assert.equal(htmlPortada({ url: 'javascript:alert(1)' }), '');
});

test('las miniaturas solo aparecen cuando hay mas de una imagen', () => {
  assert.equal(htmlMiniaturas(['https://otro.com/a.jpg'], 'https://otro.com/a.jpg'), '');
  const html = htmlMiniaturas(
    ['https://otro.com/a.jpg', 'https://otro.com/b.jpg'],
    'https://otro.com/a.jpg',
    { base: 'https://worker.dev' },
  );
  assert.match(html, /data-portada="https:\/\/otro\.com\/a\.jpg"/);
  assert.match(html, /data-portada="https:\/\/otro\.com\/b\.jpg"/);
  assert.match(html, /class="ref-miniatura activa"/);
});

test('la nota muestra la portada cuando existe', () => {
  const html = htmlNota(
    { titular: 'T', cuerpo: 'C', portada: { url: 'https://otro.com/foto.jpg', origen: 'original' }, origen: { medio: 'UNO' } },
    { base: 'https://worker.dev' },
  );
  assert.match(html, /ref-portada/);
  assert.match(html, /Original de UNO/);
});
test('la nota incluye la bajada en el boton de copiar todo cuando existe', () => {
  const html = htmlNota({ titular: 'Mi titular', bajada: 'Mi bajada', cuerpo: 'P1\n\nP2' });
  const copias = [...html.matchAll(/data-copiar="([^"]*)"/g)].map(m => m[1]);
  assert.ok(copias.includes('Mi titular\n\nMi bajada\n\nP1\n\nP2'), 'falta el todo con bajada');
});

test('la nota guardada incluye el boton de cargar', () => {
  const html = htmlNotaGuardada({ id: 'nota_123', titular: 'Nota guardada', cuerpo: 'Cuerpo' });
  assert.match(html, /data-cargar-nota="nota_123"/);
  assert.match(html, /Cargar/);
});

test('la tarjeta del monitor incluye descripcion, boton titulares y toggle cubierta', () => {
  const html = htmlNoticiaMonitor({
    nombre: 'UNO',
    titulo: 'Título',
    desc: 'Descripción importante',
    link: 'https://uno.com/nota',
    pubDate: '2026-10-28T18:00:00Z',
    cubierta: true,
  });
  assert.match(html, /class="noticia-card cubierta"/);
  assert.match(html, /noticia-desc/);
  assert.match(html, /Descripción importante/);
  assert.match(html, /data-titulares-monitor="https:\/\/uno\.com\/nota"/);
  assert.match(html, /data-toggle-cubierta="https:\/\/uno\.com\/nota"/);
  assert.match(html, /↺ Descubrir/);
});
