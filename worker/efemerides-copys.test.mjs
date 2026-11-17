import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emojiPorIconoEf, fechaLargaEf, itemsCopysReparados,
  buildEfemeridesCopysPrompt, buildEfemeridesCopysFallback, normalizarEfemeridesCopys,
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
  assert.match(r.whatsapp, /1894 — Ocurrió en 1894\./);
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
  assert.match(r.whatsapp, /⚽ 1894 — Nació\./);
  assert.doesNotMatch(r.whatsapp, /^https?:\/\/\S+$/m);
  assert.match(r.whatsapp, /\*📰 Mediamendoza - Noticias confiables del sur mendocino\*/);
  assert.doesNotMatch(r.instagram, /https?:\/\//);
});

test('normalizarEfemeridesCopys: IA vacía o rota → fallback determinista', () => {
  const items = itemsCopysReparados([ITEM('2026', 'Hecho', 'Ocurrió en 1894.')], FECHA);
  const r = normalizarEfemeridesCopys({}, { items, date: FECHA, links: LINKS });
  assert.match(r.whatsapp, /1894 — Ocurrió en 1894\./);
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
