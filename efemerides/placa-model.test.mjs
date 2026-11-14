import test from 'node:test';
import assert from 'node:assert/strict';
import { hoyArgentina, etiquetaCategoria, normalizarPayload, extraerCopysRespuesta } from './placa-model.mjs';

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

test('normalizarPayload: ok:false pasa el mensaje del servicio si lo trae', () => {
  const r = normalizarPayload({ ok: false, error: 'La fuente devolvió menos de cinco opciones utilizables.' });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'La fuente devolvió menos de cinco opciones utilizables.');
});

test('normalizarPayload: ok:false sin mensaje usa el genérico', () => {
  const r = normalizarPayload({ ok: false });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'La respuesta del servicio no es válida.');
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

test('normalizarPayload: repara año igual al de la fecha cuando el texto trae el real', () => {
  const items = [1, 2, 3, 4, 5].map(n => ITEM(n, `Hecho ${n}`));
  items[0].año = '2026';
  items[0].texto_ampliado = 'El 14 de noviembre de 1894 nació en Argentina.';
  items[1].año = '2026';
  items[1].resumen = 'Se recuerda el default ocurrido en 2002.';
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.hero.año, '1894');
  assert.equal(r.rows[0].año, '2002');
});

test('normalizarPayload: no repara cuando el año ya difiere del de la fecha', () => {
  const items = [1, 2, 3, 4, 5].map(n => ITEM(n, `Hecho ${n}`));
  items[0].texto_ampliado = 'Ocurrió en 1998 según el texto.';
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.hero.año, '1801');
});

test('normalizarPayload: conserva el año de la fecha si el texto no trae otro', () => {
  const items = [1, 2, 3, 4, 5].map(n => ITEM(n, `Hecho ${n}`));
  items[0].año = '2026';
  items[0].texto_ampliado = 'Sucedió hoy, sin año en el texto.';
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.hero.año, '2026');
});

test('extraerCopysRespuesta: ok con ambos textos recortados', () => {
  const r = extraerCopysRespuesta({ ok: true, whatsapp: '  📅 WA  ', instagram: '  IG  ', meta: { fecha: '2026-11-14' } });
  assert.equal(r.ok, true);
  assert.equal(r.whatsapp, '📅 WA');
  assert.equal(r.instagram, 'IG');
});

test('extraerCopysRespuesta: error del servidor se pasa tal cual', () => {
  const r = extraerCopysRespuesta({ ok: false, error: 'Esa fecha todavía no tiene placa' });
  assert.equal(r.ok, false);
  assert.match(r.error, /todavía no tiene placa/);
});

test('extraerCopysRespuesta: copys vacíos o sin meta → error legible', () => {
  assert.equal(extraerCopysRespuesta({ ok: true, whatsapp: '', instagram: 'x' }).ok, false);
  assert.equal(extraerCopysRespuesta(null).ok, false);
});

test('normalizarPayload: ampliado gana sobre resumen para el año reparado', () => {
  const items = [1, 2, 3, 4, 5].map(n => ITEM(n, `Hecho ${n}`));
  items[0].año = '2026';
  items[0].texto_ampliado = 'Nacido el 14 de noviembre de 1913.';
  items[0].resumen = 'Aniversario del hecho de 2002.';
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.hero.año, '1913');
});