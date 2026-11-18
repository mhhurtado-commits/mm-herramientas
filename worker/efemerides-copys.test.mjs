import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emojiPorIconoEf, fechaLargaEf, itemsCopysReparados,
  buildEfemeridesCopysPrompt, buildEfemeridesCopysFallback, normalizarEfemeridesCopys,
  normalizarItemsEditados, handlePlacasV2EfemeridesCopysPost, handlePlacasV2EfemeridesCopys,
  normalizarFeriadosAR, handlePlacasV2EfemeridesBanco,
} from './worker.js';

const FECHA = '2026-11-14';
const LINKS = { grupo: 'https://mediamendoza.pages.dev/grupo', canal: 'https://mediamendoza.pages.dev/canal' };
const ITEM = (año, titulo, resumen, icono = 'historia') => ({ año, anio: año, titulo, resumen, texto_ampliado: '', icono, categoria: 'historia' });

test('emojiPorIconoEf: mapea iconos conocidos y cae en 📜', () => {
  assert.equal(emojiPorIconoEf('futbol'), '⚽');
  assert.equal(emojiPorIconoEf('musica'), '🎵');
  assert.equal(emojiPorIconoEf('otro'), '📜');
});

test('fechaLargaEf: 2026-11-14 → 14 de noviembre', () => {
  assert.equal(fechaLargaEf('2026-11-14'), '14 de noviembre');
});

test('itemsCopysReparados: repara años dañados y descarta sin año verificable', () => {
  const r = itemsCopysReparados([
    ITEM('2026', 'Hecho uno', 'Ocurrió en 1894.'),
    ITEM('2026', 'Sin año', 'Sin año en el texto.'),
    ITEM('1913', 'Hecho dos', 'Arquitecto argentino.'),
  ], FECHA);
  assert.equal(r.length, 2);
  assert.equal(r[0].año, '1894');
  assert.equal(r[1].año, '1913');
});

test('buildEfemeridesCopysPrompt: incluye fecha larga, hechos con emoji y prohibición de inventar', () => {
  const items = itemsCopysReparados([ITEM('2026', 'Hecho', 'Ocurrió en 1900.')], FECHA);
  const p = buildEfemeridesCopysPrompt(items, FECHA, LINKS);
  assert.match(p, /14 de noviembre/);
  assert.match(p, /📜 1900 — Ocurrió en 1900\./);
  assert.match(p, /sin inventar/);
  assert.match(p, /"whatsapp"/);
});

test('buildEfemeridesCopysFallback: lista con emojis, CTA comunidad y firma; sin año de la fecha', () => {
  const items = itemsCopysReparados([
    ITEM('2026', 'Hecho uno', 'Ocurrió en 1894.'), ITEM('2026', 'Hecho dos', 'Sucedió en 1913.'),
    ITEM('2026', 'Hecho tres', 'Pasó en 2002.'), ITEM('2026', 'Hecho cuatro', 'Fue en 1784.'),
    ITEM('2026', 'Hecho cinco', 'Rodó en 2021.'),
  ], FECHA);
  const r = buildEfemeridesCopysFallback(items, FECHA, LINKS);
  assert.match(r.whatsapp, /\*1894\* — Ocurrió en 1894\./);
  assert.doesNotMatch(r.whatsapp, /2026 —/);
  assert.match(r.whatsapp, /¡Sumate a nuestra comunidad!/);
  assert.match(r.whatsapp, /Mediamendoza - Noticias confiables del sur mendocino/);
  assert.match(r.instagram, /#MediaMendoza/);
  assert.doesNotMatch(r.instagram, /2026/);
});

test('normalizarEfemeridesCopys: salida de la IA pasa, quita URLs y agrega firma canónica', () => {
  const items = itemsCopysReparados([ITEM('1894', 'Hecho', 'Nació en 1894.')], FECHA);
  const r = normalizarEfemeridesCopys({
    whatsapp: '📅 Efemérides del 14 de noviembre\n\n⚽ 1894 — Nació.\nhttps://mediamendoza.pages.dev/grupo',
    instagram: '¿Qué pasó un 14 de noviembre?\nhttps://ejemplo.com/x\n#MediaMendoza #Efemerides',
  }, { items, date: FECHA, links: LINKS });
  assert.match(r.whatsapp, /⚽ \*1894\* — Nació\./);
  assert.doesNotMatch(r.whatsapp, /^https?:\/\/\S+$/m);
  assert.match(r.whatsapp, /\*📰 Mediamendoza - Noticias confiables del sur mendocino\*/);
  assert.doesNotMatch(r.instagram, /https?:\/\//);
});

test('normalizarEfemeridesCopys: IA vacía o rota → fallback determinista', () => {
  const items = itemsCopysReparados([ITEM('2026', 'Hecho', 'Ocurrió en 1894.')], FECHA);
  const r = normalizarEfemeridesCopys({}, { items, date: FECHA, links: LINKS });
  assert.match(r.whatsapp, /\*1894\* — Ocurrió en 1894\./);
  assert.match(r.instagram, /#MediaMendoza/);
});

test('buildEfemeridesCopysPrompt: fija el año actual y prohíbe calcular antigüedades', () => {
  const items = itemsCopysReparados([ITEM('2026', 'Hecho', 'Ocurrió en 1900.')], FECHA);
  const p = buildEfemeridesCopysPrompt(items, FECHA, LINKS);
  assert.match(p, /2026/);
  assert.match(p, /NUNCA.*hace/);
});

test('normalizarEfemeridesCopys: gancho con antigüedad calculada ("hace siete años") → fallback', () => {
  const items = itemsCopysReparados([ITEM('2026', 'ARA San Juan', 'Desapareció en 2017.')], FECHA);
  const r = normalizarEfemeridesCopys({
    whatsapp: '📅 Efemérides del 14 de noviembre\n\n📜 2017 — Desapareció el ARA San Juan.',
    instagram: 'Un día como hoy, hace siete años, el ARA San Juan desaparecía.\n\nHechos.\n\n#MediaMendoza #Efemerides',
  }, { items, date: FECHA, links: LINKS });
  assert.doesNotMatch(r.instagram, /hace \w+ años/i);
  assert.match(r.instagram, /2017/);
  assert.match(r.instagram, /#MediaMendoza/);
});

test('buildEfemeridesCopysFallback: WhatsApp con encabezado y años en negrita', () => {
  const items = itemsCopysReparados([
    ITEM('2026', 'Hecho uno', 'Ocurrió en 1894.'), ITEM('2026', 'Hecho dos', 'Sucedió en 1913.'),
    ITEM('2026', 'Hecho tres', 'Pasó en 2002.'), ITEM('2026', 'Hecho cuatro', 'Fue en 1784.'),
    ITEM('2026', 'Hecho cinco', 'Rodó en 2021.'),
  ], FECHA);
  const r = buildEfemeridesCopysFallback(items, FECHA, LINKS);
  assert.match(r.whatsapp, /📅 \*Efemérides del 14 de noviembre\*/);
  assert.match(r.whatsapp, /\*1894\* — /);
});

test('buildEfemeridesCopysPrompt: pide palabras clave en negrita para WhatsApp', () => {
  const items = itemsCopysReparados([ITEM('2026', 'Hecho', 'Ocurrió en 1900.')], FECHA);
  const p = buildEfemeridesCopysPrompt(items, FECHA, LINKS);
  assert.match(p, /negrita/);
  assert.match(p, /\*Efemérides del/);
});

test('normalizarEfemeridesCopys: si la IA no puso negritas, las agrega en encabezado y años', () => {
  const items = itemsCopysReparados([ITEM('2026', 'Hecho', 'Ocurrió en 1894.')], FECHA);
  const r = normalizarEfemeridesCopys({
    whatsapp: '📅 Efemérides del 14 de noviembre\n\n⚽ 1894 — Nació Samuel Eichelbaum.\n🎭 1913 — Nació un arquitecto.',
    instagram: 'Gancho sin negritas\n\n#MediaMendoza #Efemerides',
  }, { items, date: FECHA, links: LINKS });
  assert.match(r.whatsapp, /📅 \*Efemérides del 14 de noviembre\*/);
  assert.match(r.whatsapp, /⚽ \*1894\* — Nació Samuel Eichelbaum\./);
  assert.match(r.whatsapp, /🎭 \*1913\* — Nació un arquitecto\./);
});

test('normalizarEfemeridesCopys: respeta las negritas que ya puso la IA', () => {
  const items = itemsCopysReparados([ITEM('2026', 'Hecho', 'Ocurrió en 1894.')], FECHA);
  const r = normalizarEfemeridesCopys({
    whatsapp: '📅 *Efemérides del 14 de noviembre*\n\n⚽ 1894 — Nació *Samuel Eichelbaum*.',
    instagram: 'Gancho\n\n#MediaMendoza #Efemerides',
  }, { items, date: FECHA, links: LINKS });
  assert.match(r.whatsapp, /Nació \*Samuel Eichelbaum\*/);
  assert.match(r.whatsapp, /📅 \*Efemérides del 14 de noviembre\*/);
});

test('normalizarItemsEditados: año 2026 aceptado (a diferencia del GET), inválidos descartados', () => {
  const r = normalizarItemsEditados([
    { id: 'a', año: '2026', titulo: 'Mundial 2026', resumen: 'La sede.', texto_ampliado: '', icono: 'futbol' },
    { id: 'b', año: 'texto', titulo: 'Roto', resumen: 'Roto.' },
    { id: 'c', año: '0999', titulo: 'Viejo', resumen: 'Viejo.' },
    { id: 'd', año: '1894', titulo: 'Castagnino', resumen: 'Pintor argentino.' },
  ]);
  assert.deepEqual(r.map(i => i.id), ['a', 'd']);
});

test('normalizarItemsEditados: ampliado vacío cae a resumen; icono desconocido → historia; orden y tope 6', () => {
  const r = normalizarItemsEditados(
    Array.from({ length: 8 }, (_, i) => ({ id: `id${i}`, año: '2001', titulo: `T${i}`, resumen: `R${i}`, ampliado: '', icono: i === 0 ? 'nuclear' : 'canal' })),
  );
  assert.equal(r.length, 6);
  assert.equal(r[0].icono, 'historia');
  assert.equal(r[0].ampliado, 'R0');
  assert.equal(r[0].texto_ampliado, 'R0');
  assert.equal(r[2].icono, 'canal');
});

test('handlePlacasV2EfemeridesCopysPost: 200 con fuente "placa editada"; KV solo lee config:wa_links y nunca escribe', async () => {
  const kv = { keys: [], putCalls: 0 };
  const env = { KV: {
    get: async (k) => { kv.keys.push(String(k)); return null; },
    put: async () => { kv.putCalls += 1; },
  } };
  const gemini = async () => ({
    data: {
      whatsapp: '📅 Efemérides del 18 de noviembre\n\n⚽ 2026 — Año del hecho editado.',
      instagram: 'Gancho\n\n#MediaMendoza #Efemerides',
    },
  });
  const res = await handlePlacasV2EfemeridesCopysPost({ fecha: FECHA, items: [ITEM('2026', 'Editado', 'En 2026 pasó algo.', 'futbol')] }, env, gemini);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.meta.fuente, 'placa editada');
  assert.equal(body.meta.cached, false);
  assert.match(body.whatsapp, /\*2026\*/);
  // Nunca lee/escribe el cache ni la placa: solo la config pública de links (CTA).
  assert.ok(kv.keys.every(k => !k.startsWith('placas-v2:')), `claves KV inesperadas: ${kv.keys}`);
  assert.deepEqual(kv.keys, ['config:wa_links']);
  assert.equal(kv.putCalls, 0);
});

test('handlePlacasV2EfemeridesCopysPost: 0 hechos válidos → 400 sin tocar KV ni Gemini', async () => {
  const env = { KV: { get: async () => { throw new Error('no debe llamarse'); }, put: async () => {} } };
  const gemini = async () => { throw new Error('no debe llamarse'); };
  const res = await handlePlacasV2EfemeridesCopysPost({ fecha: FECHA, items: [{ año: 'x', titulo: '', resumen: '' }] }, env, gemini);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.match(body.error, /no es válida/i);
});

test('handlePlacasV2EfemeridesCopysPost: fecha inválida → 400', async () => {
  const res = await handlePlacasV2EfemeridesCopysPost({ fecha: 'no-es-fecha', items: [ITEM('2001', 'T', 'R.')] }, {}, null);
  assert.equal(res.status, 400);
});

test('GET copys: sin placa en KV → 502 (regresión de comportamiento)', async () => {
  const env = { KV: { get: async () => null, put: async () => {} } };
  const res = await handlePlacasV2EfemeridesCopys(new URL(`https://x/?fecha=${FECHA}`), env);
  assert.equal(res.status, 502);
});


const FERIADOS_2026 = [
  { fecha: '2026-11-09', tipo: 'inamovible', nombre: 'Visita del papa León XIV' },
  { fecha: '2026-11-23', tipo: 'trasladable', nombre: 'Día de la Soberanía Nacional (20/11)' },
  { fecha: '2027-01-01', tipo: 'inamovible', nombre: 'Año nuevo' },
];

test('normalizarFeriadosAR: feriado trasladado se ancla a la fecha histórica (20/11), no al día no laborable (23/11)', () => {
  const r = normalizarFeriadosAR(FERIADOS_2026, '2026-11-18', 7);
  assert.deepEqual(r.map(i => i.id), ['feriado-2026-11-20']);
  assert.equal(r[0].fecha, '2026-11-20');
  assert.equal(r[0].titulo, 'Día de la Soberanía Nacional');
  assert.equal(r[0].año, '');
  assert.equal(r[0].feria, true);
  assert.equal(r[0].categoria, 'EFEMÉRIDE ARGENTINA');
  assert.equal(r[0].icono, 'historia');
  assert.match(r[0].resumen, /20 de noviembre/);
});

test('normalizarFeriadosAR: no lista el feriado en el día no laborable observado', () => {
  const r = normalizarFeriadosAR([FERIADOS_2026[1]], '2026-11-23', 7);
  assert.deepEqual(r, []);
});

test('normalizarFeriadosAR: inamovible sin (dd/mm) se mantiene en su fecha oficial', () => {
  const r = normalizarFeriadosAR([FERIADOS_2026[0], FERIADOS_2026[2]], '2026-11-05', 10);
  assert.deepEqual(r.map(i => i.id), ['feriado-2026-11-09']);
  assert.equal(r[0].titulo, 'Visita del papa León XIV');
});

test('normalizarFeriadosAR: rango cruzando fin de año incluye el año siguiente', () => {
  const r = normalizarFeriadosAR([...FERIADOS_2026, { fecha: '2026-12-30', tipo: 'inamovible', nombre: 'X' }], '2026-12-29', 4);
  assert.deepEqual(r.map(i => i.id), ['feriado-2026-12-30', 'feriado-2027-01-01']);
});

test('handlePlacasV2EfemeridesBanco: 200 ok con feriados mapeados', async () => {
  const fetcher = async (url) => {
    const year = String(url).match(/feriados\/(\d{4})/)?.[1];
    return { ok: true, json: async () => FERIADOS_2026.filter(f => f.fecha.startsWith(year)) };
  };
  const res = await handlePlacasV2EfemeridesBanco(new URL('https://x/?fecha=2026-11-18&dias=7'), {}, fetcher);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.feriados.map(f => f.id), ['feriado-2026-11-20']);
});

test('handlePlacasV2EfemeridesBanco: fetch caído → 200 con feriados: []', async () => {
  const fetcher = async () => { throw new Error('red caída'); };
  const res = await handlePlacasV2EfemeridesBanco(new URL('https://x/?fecha=2026-11-18'), {}, fetcher);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.feriados, []);
});

test('handlePlacasV2EfemeridesBanco: fecha inválida → 400', async () => {
  const res = await handlePlacasV2EfemeridesBanco(new URL('https://x/?fecha=hoy'), {}, async () => { throw new Error('no llamar'); });
  assert.equal(res.status, 400);
});



const FERIADO_ITEM = { id: 'feriado-2026-11-23', año: '', icono: 'historia', resumen: 'Feriado nacional — 23 de noviembre de 2026', titulo: 'Día de la Soberanía Nacional' };

test('buildEfemeridesCopysPrompt: ítem sin año no emite año vacío ni hueco roto', () => {
  const p = buildEfemeridesCopysPrompt([FERIADO_ITEM], FECHA, LINKS);
  assert.ok(p.includes('Feriado nacional — 23 de noviembre de 2026'));
  assert.ok(!p.includes('📜  —'), 'sin doble espacio antes del guion');
  assert.ok(!p.includes('undefined') && !p.includes('NaN'));
});

test('buildEfemeridesCopysFallback: ítem sin año no rompe ni emite ** ni -1', () => {
  const { whatsapp, instagram } = buildEfemeridesCopysFallback([FERIADO_ITEM], FECHA, LINKS);
  assert.ok(whatsapp.includes('23 de noviembre de 2026'));
  assert.ok(!whatsapp.includes('**'), 'sin pareja de asteriscos vacía');
  assert.ok(!whatsapp.includes('undefined') && !whatsapp.includes('-1'));
  assert.ok(!instagram.includes('undefined') && !instagram.includes('-1') && !instagram.includes(': Feriado'));
});

