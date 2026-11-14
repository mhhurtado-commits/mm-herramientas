import test from 'node:test';
import assert from 'node:assert/strict';
import { hoyArgentina, etiquetaCategoria, normalizarPayload } from './placa-model.mjs';

test('hoyArgentina devuelve YYYY-MM-DD', () => {
  assert.match(hoyArgentina(), /^\d{4}-\d{2}-\d{2}$/);
});

test('etiquetaCategoria mapea claves conocidas', () => {
  assert.equal(etiquetaCategoria({ icono: 'politica' }), 'POLÍTICA');
  assert.equal(etiquetaCategoria({ icono: 'historia' }), 'HISTORIA');
  assert.equal(etiquetaCategoria({ icono: 'musica' }), 'MÚSICA');
  assert.equal(etiquetaCategoria({ icono: 'economia' }), 'ECONOMÍA');
  assert.equal(etiquetaCategoria({ icono: 'aviacion' }), 'AVIACIÓN');
});

test('etiquetaCategoria usa categoria si icono falta', () => {
  assert.equal(etiquetaCategoria({ categoria: 'sociedad' }), 'SOCIEDAD');
});

test('etiquetaCategoria desconocida queda en mayúsculas, sin inventarse', () => {
  assert.equal(etiquetaCategoria({ icono: 'otro', categoria: 'cocina' }), 'COCINA');
  assert.equal(etiquetaCategoria({}), 'EFEMÉRIDE');
});

const ITEM = (n, titulo, alcance = 'internacional') => ({
  año: String(1800 + n), titulo, resumen: `Resumen del hecho ${n}.`,
  texto_ampliado: `Ampliado del hecho ${n}.`,
  alcance, categoria: 'historia', icono: 'historia', prioridad: n,
  fuente: 'Wikipedia', verificada: true,
});

const payloadValido = (items) => ({ ok: true, items, meta: { fecha: '2026-11-13', fuente: 'https://es.wikipedia.org/wiki/13_de_noviembre' } });

test('normalizarPayload: ok, héroe es el primero, orden preservado, sin alcance', () => {
  const r = normalizarPayload(payloadValido([ITEM(1, 'Primero'), ITEM(2, 'Segundo'), ITEM(3, 'Tercero'), ITEM(4, 'Cuarto'), ITEM(5, 'Quinto')]));
  assert.equal(r.ok, true);
  assert.equal(r.fecha, '2026-11-13');
  assert.equal(r.hero.titulo, 'Primero');
  assert.deepEqual(r.rows.map(i => i.titulo), ['Segundo', 'Tercero', 'Cuarto', 'Quinto']);
  assert.equal(r.totalMostrados, 5);
  assert.equal(r.total, 5);
  assert.equal('alcance' in r.hero, false);
  assert.equal('alcance' in r.rows[0], false);
  assert.equal(r.verificada, true);
});

test('normalizarPayload: recorta a 6 y reporta el total', () => {
  const items = Array.from({ length: 8 }, (_, i) => ITEM(i + 1, `Hecho ${i + 1}`));
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.ok, true);
  assert.equal(r.totalMostrados, 6);
  assert.equal(r.total, 8);
  assert.equal(r.rows.length, 5);
});

test('normalizarPayload: descarta items sin título sin inventar relleno', () => {
  const items = [ITEM(1, 'Uno'), ITEM(2, 'Dos'), ITEM(3, ''), ITEM(4, 'Cuatro'), ITEM(5, 'Cinco'), ITEM(6, 'Seis')];
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.ok, true);
  assert.equal(r.total, 5);
  assert.deepEqual(r.rows.map(i => i.titulo), ['Dos', 'Cuatro', 'Cinco', 'Seis']);
});

test('normalizarPayload: con menos de 5 items válidos devuelve error', () => {
  const r = normalizarPayload(payloadValido([ITEM(1, 'Uno'), { titulo: 'sin año ni resumen' }]));
  assert.equal(r.ok, false);
  assert.match(r.error, /hechos verificados/i);
});

test('normalizarPayload: raw inválido o ok:false devuelve error', () => {
  assert.equal(normalizarPayload(null).ok, false);
  assert.equal(normalizarPayload({ ok: false }).ok, false);
  assert.equal(normalizarPayload({ ok: true, items: 'no-array' }).ok, false);
});

test('normalizarPayload: texto_ampliado cae a resumen si falta', () => {
  const items = [1, 2, 3, 4, 5].map(n => ITEM(n, `Hecho ${n}`));
  delete items[0].texto_ampliado;
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.hero.ampliado, r.hero.resumen);
});

test('normalizarPayload: verificada es false si algún item mostrado no lo está', () => {
  const items = [1, 2, 3, 4, 5].map(n => ITEM(n, `Hecho ${n}`));
  items[1].verificada = false;
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.verificada, false);
});