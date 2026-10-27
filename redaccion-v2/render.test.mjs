import test from 'node:test';
import assert from 'node:assert/strict';
import { escaparHtml, htmlTitulares, htmlFuentes, htmlNota, htmlNoticiaMonitor } from './render.mjs';

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
