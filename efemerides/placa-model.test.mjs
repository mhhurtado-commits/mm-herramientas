import test from 'node:test';
import assert from 'node:assert/strict';
import { hoyArgentina, etiquetaCategoria, normalizarPayload, extraerCopysRespuesta, construirModeloPlaca, itemsVisiblesCopys, validarHechoPropio } from './placa-model.mjs';

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

test('normalizarPayload: conserva id, icono y devuelve items normalizados', () => {
  const items = [1, 2, 3, 4, 5].map(n => ({ ...ITEM(n, `Hecho ${n}`), id: `id-${n}`, icono: 'politica' }));
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.items.length, 5);
  assert.deepEqual(r.items.map(i => i.id), ['id-1', 'id-2', 'id-3', 'id-4', 'id-5']);
  assert.equal(r.items[0].icono, 'politica');
});

test('construirModeloPlaca: hero = primer visible, ocultos fuera, etiqueta N DE M', () => {
  const items = [
    { ...ITEM(1, 'A'), oculto: true, verificada: true },
    { ...ITEM(2, 'B'), verificada: true },
    { ...ITEM(3, 'C'), verificada: true },
  ];
  const m = construirModeloPlaca(items, '2026-11-18');
  assert.equal(m.ok, true);
  assert.equal(m.hero.titulo, 'B');
  assert.deepEqual(m.rows.map(i => i.titulo), ['C']);
  assert.equal(m.totalMostrados, 2);
  assert.equal(m.total, 3);
  assert.equal(m.verificada, true);
});

test('construirModeloPlaca: 1 visible → hero solo, 0 filas (sin división por cero)', () => {
  const m = construirModeloPlaca([{ ...ITEM(1, 'Único'), verificada: true }], '2026-11-18');
  assert.equal(m.ok, true);
  assert.equal(m.rows.length, 0);
  assert.equal(m.totalMostrados, 1);
});

test('construirModeloPlaca: 0 visibles → ok:false (la UI impide este estado)', () => {
  const m = construirModeloPlaca([{ ...ITEM(1, 'A'), oculto: true }], '2026-11-18');
  assert.equal(m.ok, false);
});

test('construirModeloPlaca: verificada false si algún visible no lo está', () => {
  const items = [{ ...ITEM(1, 'A'), verificada: true }, { ...ITEM(2, 'B'), verificada: false }];
  assert.equal(construirModeloPlaca(items, '2026-11-18').verificada, false);
});

test('itemsVisiblesCopys: sin ocultos, orden, ampliado→texto_ampliado, tope 6', () => {
  const items = Array.from({ length: 7 }, (_, i) => ({ ...ITEM(i + 1, `H${i + 1}`), id: `x${i + 1}`, icono: 'economia', ampliado: i === 0 ? '' : `Amp ${i + 1}`, oculto: i === 1 }));
  const r = itemsVisiblesCopys(items);
  assert.equal(r.length, 6);
  assert.deepEqual(r.map(i => i.id), ['x1', 'x3', 'x4', 'x5', 'x6', 'x7']);
  assert.equal(r[0].texto_ampliado, 'Resumen del hecho 1.');
  assert.equal(r[1].texto_ampliado, 'Amp 3');
  assert.equal(r[0].icono, 'economia');
});

test('validarHechoPropio: acepta año 2026 y 1000; rechaza 0999, 3000, letras', () => {
  const base = { titulo: 'San Rafael cumple 150 años', resumen: 'La ciudad celebra.', ampliado: '', icono: 'mundo' };
  assert.equal(validarHechoPropio({ ...base, año: '2026' }).ok, true);
  assert.equal(validarHechoPropio({ ...base, año: '1000' }).ok, true);
  assert.equal(validarHechoPropio({ ...base, año: '0999' }).ok, false);
  assert.equal(validarHechoPropio({ ...base, año: '3000' }).ok, false);
  assert.equal(validarHechoPropio({ ...base, año: 'abc' }).ok, false);
});

test('validarHechoPropio: faltan título/resumen o icono inválido → error', () => {
  const base = { año: '2026', resumen: 'r', icono: 'mundo' };
  assert.match(validarHechoPropio({ ...base, titulo: '  ' }).error, /título/i);
  assert.match(validarHechoPropio({ ...base, titulo: 't', resumen: '' }).error, /resumen/i);
  assert.match(validarHechoPropio({ ...base, titulo: 't', resumen: 'r', icono: 'nuclear' }).error, /icono/i);
});

test('validarHechoPropio: ampliado vacío cae al resumen; hecho normalizado', () => {
  const r = validarHechoPropio({ año: '2026', titulo: 'San Rafael 150', resumen: 'Cumple años.', ampliado: '  ', icono: 'mundo' });
  assert.equal(r.ok, true);
  assert.equal(r.hecho.ampliado, 'Cumple años.');
  assert.equal(r.hecho.icono, 'mundo');
});

test('normalizarPayload: expone candidatos completos (sin slice) además de items de 6', () => {
  const items = Array.from({ length: 9 }, (_, i) => ITEM(i + 1, `Hecho ${i + 1}`));
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.items.length, 6);
  assert.equal(r.candidatos.length, 9);
});

test('construirModeloPlaca: feriado sin año muestra DD MMM en hero y AR en filas', () => {
  const items = [
    { año: '', fecha: '2026-11-23', titulo: 'Día de la Soberanía Nacional', resumen: 'Feriado nacional.', icono: 'historia', categoria: 'EFEMÉRIDE ARGENTINA', oculto: false },
    { ...ITEM(7, 'Normal'), fecha: '2026-11-23' },
  ];
  const m = construirModeloPlaca(items, '2026-11-18');
  assert.equal(m.hero.añoTexto, '23 NOV');
  assert.equal(m.rows[0].filaTexto, String(1800 + 7));
});

test('construirModeloPlaca: item sin año en filas muestra AR', () => {
  const items = [
    { ...ITEM(1, 'Primero') },
    { año: '', fecha: '2026-11-23', titulo: 'Feriado', resumen: 'Feriado.', icono: 'historia', oculto: false },
  ];
  const m = construirModeloPlaca(items, '2026-11-18');
  assert.equal(m.rows[0].filaTexto, 'AR');
});

test('construirModeloPlaca: item sin año y sin fecha → hero sin crash (AR)', () => {
  const items = [{ año: '', titulo: 'Feriado raro', resumen: 'Sin fecha.', icono: 'historia', oculto: false }];
  const m = construirModeloPlaca(items, '2026-11-18');
  assert.equal(m.hero.añoTexto, 'AR');
});

