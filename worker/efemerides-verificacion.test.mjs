import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseEfemeridesWikitexto, emparejarEsEn, textoPlanoWikitext } from './worker.js';

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'testdata', 'efemerides');
const ES = readFileSync(path.join(FIX, 'es-11-18.txt'), 'utf8');
const EN = readFileSync(path.join(FIX, 'en-11-18.txt'), 'utf8');
const URL_ES = 'https://es.wikipedia.org/wiki/18_de_noviembre';
const URL_EN = 'https://en.wikipedia.org/wiki/November_18';

test('parser ES: extrae acontecimientos, nacimientos y fallecimientos; ignora Celebraciones', () => {
  const items = parseEfemeridesWikitexto(ES, 'es', URL_ES);
  const por = s => items.filter(i => i.seccion === s).length;
  assert.ok(por('acontecimiento') >= 20, `acontecimientos=${por('acontecimiento')}`);
  assert.ok(por('nacimiento') >= 20, `nacimientos=${por('nacimiento')}`);
  assert.ok(por('fallecimiento') >= 10, `fallecimientos=${por('fallecimiento')}`);
  assert.ok(items.every(i => /^\d{3,4}$/.test(i.año) && i.texto && i.fuenteEs));
  assert.ok(!items.some(i => /Santoral|celebraci/i.test(i.texto)));
});

test('parser EN: Events/Births/Deaths; Holidays ignorada', () => {
  const items = parseEfemeridesWikitexto(EN, 'en', URL_EN);
  const por = s => items.filter(i => i.seccion === s).length;
  assert.ok(por('acontecimiento') >= 15, `events=${por('acontecimiento')}`);
  assert.ok(por('nacimiento') >= 15, `births=${por('nacimiento')}`);
  assert.ok(por('fallecimiento') >= 10, `deaths=${por('fallecimiento')}`);
});

test('parser: tolera año sin corchetes, «(domingo)», &ndash; y triple espacio', () => {
  const raw = '== Acontecimientos ==\n* 1626: en la Ciudad del Vaticano se finaliza la obra\n'
    + '* [[1901]] (domingo): algo sucede en [[Madrid]].\n'
    + '*[[1928]] &ndash; Something in [[Paris]] happens.\n'
    + '*  1991   &ndash; Plain unbracketed year, another thing happens.\n';
  const items = parseEfemeridesWikitexto(raw, 'es', URL_ES);
  assert.deepEqual(items.map(i => i.año), ['1626', '1901', '1928', '1991']);
  assert.equal(items[0].fuenteEs, URL_ES); // sin enlace interno → página del día
  assert.match(items[1].fuenteEs, /^https:\/\/es\.wikipedia\.org\/wiki\/Madrid$/);
});

test('textoPlanoWikitext: quita refs, comentarios, plantillas y links', () => {
  const out = textoPlanoWikitext("en [[Rosario (Argentina)|Rosario]] se funda un [[Hospital]]<ref>{{cite book|title=x}}</ref> <!-- nota -->.");
  assert.equal(out, 'en Rosario se funda un Hospital.');
});

test('emparejarEsEn real: Steamboat Willie 1928 empareja; Sabatini NO aparece', () => {
  const verificados = emparejarEsEn(
    parseEfemeridesWikitexto(ES, 'es', URL_ES),
    parseEfemeridesWikitexto(EN, 'en', URL_EN),
  );
  assert.ok(verificados.length >= 5, `verificados=${verificados.length}`);
  const steamboat = verificados.find(v => v.año === '1928' && /Steamboat Willie/i.test(v.texto));
  assert.ok(steamboat, 'Steamboat Willie 1928 debería estar verificado');
  assert.ok(!verificados.some(v => /Sabatini/i.test(v.texto)), 'Sabatini NO debe entrar');
  assert.ok(verificados.every(v => v.verificado === true && v.fuenteUrl));
});

test('emparejarEsEn sintético: mismo año NO alcanza; año distinto NO; token compartido SÍ', () => {
  const mk = (año, texto) => [{ año, texto, seccion: 'acontecimiento', fuenteEs: 'x' }];
  assert.equal(emparejarEsEn(mk('1966', 'un escritor zzz qxy'), mk('1966', 'an inventor code abc')).length, 0);
  assert.equal(emparejarEsEn(mk('1966', 'un escritor de Madrid'), mk('1965', 'an inventor in Madrid')).length, 0);
  assert.equal(emparejarEsEn(mk('1978', 'mueren en Jonestown'), mk('1978', 'Jonestown massacre happens')).length, 1);
});

import { handlePlacasV2Efemerides, itemPlacaDesdePool } from './worker.js';

const FECHA = '2026-11-18';
const fetcherStub = ({ es = ES, en = EN, curadas = null, esStatus = 200, enStatus = 200 } = {}) => async (url) => {
  const u = String(url);
  const mk = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => body, json: async () => JSON.parse(body) });
  if (u.includes('es.wikipedia.org')) return mk(esStatus, es);
  if (u.includes('en.wikipedia.org')) return mk(enStatus, en);
  if (u.includes('efemerides-curadas.json')) return curadas ? mk(200, JSON.stringify(curadas)) : mk(404, '{}');
  throw new Error('url no stubbed: ' + u);
};
const req = (fecha = FECHA) => new URL('https://x/placas/v2/efemerides?fecha=' + fecha);
const envSinKV = {};
const KV_OK = { KV: { _m: new Map(), async get(k){ return this._m.get(k) ?? null; }, async put(k, v){ this._m.set(k, JSON.parse(v)); } } };

test('handler: solo verificados + curados; Sabatini fuera', async () => {
  const curadas = { '11-18': [{ año: '1845', titulo: 'Vuelta de Obligado', resumen: 'r', texto_ampliado: 'a', icono: 'historia', fuente: 'ARCHIVO.AR' }] };
  const gemini = async () => ({ data: { items: [{ indice: 0, alcance: 'nacional', categoria: 'historia', icono: 'historia', resumen: 'curado', texto_ampliado: 'curado' }] } });
  const res = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub({ curadas }), gemini);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(!data.items.some(i => /Sabatini/i.test(i.titulo + ' ' + i.resumen)));
  assert.ok(data.items.every(i => i.verificada === true));
  const obligado = data.items.find(i => i.año === '1845');
  assert.ok(obligado && obligado.fuente === 'ARCHIVO.AR');
});

test('handler: si EN cae -> ultima buena o 502 (nunca placa sin verificar)', async () => {
  const sinCache = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub({ enStatus: 500 }), async () => ({ data: { items: [] } }));
  assert.equal(sinCache.status, 502);
  KV_OK.KV._m.set('placas-v2:efemerides:v5:' + FECHA, { items: [{ titulo: 'vieja', resumen: 'x', texto_ampliado: 'y', año: '1900', icono: 'historia' }], meta: { fecha: FECHA } });
  const conCache = await handlePlacasV2Efemerides(req(), KV_OK, fetcherStub({ enStatus: 500 }), async () => ({ data: { items: [] } }));
  const data = await conCache.json();
  assert.equal(data.meta.fallback, true);
});

test('handler: Gemini roto -> seleccion deterministica con verificados', async () => {
  const geminiRoto = async () => ({ error: 'sin respuesta' });
  const res = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub(), geminiRoto);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.items.length >= 1);
  assert.ok(data.items.every(i => i.verificada === true));
});

test('handler: curados de Pages caidos no tumban la placa', async () => {
  const res = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub(), async () => ({ data: { items: [{ indice: 0, alcance: 'nacional', categoria: 'historia', icono: 'historia', resumen: 'ok', texto_ampliado: 'ok' }] } }));
  assert.equal(res.status, 200);
});

const RE_TEST = /argent|mendoza|patria|obligado|malvin|sarmiento|belgrano|guemes|san mart|tucum|rosas|urquiza|moreno/i;

test('handler: backstop — Gemini internacional no deja sin Argentina; nacionales primero', async () => {
  const curadas = { '11-18': [{ año: '1845', titulo: 'Vuelta de Obligado', resumen: 'r', texto_ampliado: 'a', icono: 'historia', fuente: 'ARCHIVO.AR' }] };
  const verificados = emparejarEsEn(parseEfemeridesWikitexto(ES, 'es', URL_ES), parseEfemeridesWikitexto(EN, 'en', URL_EN));
  // Simula exactamente lo que pasó en producción: Gemini eligiendo SOLO internacionales.
  const intlIndices = verificados
    .map((v, i) => ({ v, idx: i + 1 }))
    .filter(({ v }) => !RE_TEST.test(v.texto))
    .slice(0, 6)
    .map(({ idx }) => ({ indice: idx, alcance: 'internacional', categoria: 'mundo', icono: 'mundo', resumen: 'r', texto_ampliado: 'a' }));
  const gemini = async () => ({ data: { items: intlIndices } });
  const res = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub({ curadas }), gemini);
  assert.equal(res.status, 200);
  const data = await res.json();
  const nacionales = data.items.filter(i => i.alcance === 'nacional');
  assert.ok(nacionales.length >= 2, `nacionales=${nacionales.length}`);
  assert.equal(data.items[0].alcance, 'nacional', 'los hechos argentinos van primero');
  assert.equal(data.items[0].año, '1845', 'Obligado (curado) encabeza');
  const marcas = data.items.map(i => i.alcance !== 'nacional');
  const primerInter = marcas.indexOf(true);
  const ultimoNac = marcas.lastIndexOf(false);
  assert.ok(primerInter === -1 || ultimoNac < primerInter, 'nacionales van antes que internacionales');
});

test('handler: alcance lo computa el worker, no Gemini', async () => {
  const curadas = { '11-18': [{ año: '1845', titulo: 'Vuelta de Obligado', resumen: 'r', texto_ampliado: 'a', icono: 'historia', fuente: 'ARCHIVO.AR' }] };
  const verificados = emparejarEsEn(parseEfemeridesWikitexto(ES, 'es', URL_ES), parseEfemeridesWikitexto(EN, 'en', URL_EN));
  const intlIdx = verificados.findIndex(v => !RE_TEST.test(v.texto)) + 1; // +1: pool[0] es el curado
  const intlIdx2 = verificados.findIndex((v, i) => i > intlIdx - 1 && !RE_TEST.test(v.texto)) + 1;
  const intlIdx3 = verificados.findIndex((v, i) => i > intlIdx2 - 1 && !RE_TEST.test(v.texto)) + 1;
  const gemini = async () => ({ data: { items: [
    { indice: 0, alcance: 'internacional', categoria: 'historia', icono: 'historia', resumen: 'curado', texto_ampliado: 'curado' },
    { indice: intlIdx, alcance: 'nacional', categoria: 'mundo', icono: 'mundo', resumen: 'intl', texto_ampliado: 'intl' },
    { indice: intlIdx2, alcance: 'internacional', categoria: 'mundo', icono: 'mundo', resumen: 'i2', texto_ampliado: 'i2' },
    { indice: intlIdx3, alcance: 'internacional', categoria: 'mundo', icono: 'mundo', resumen: 'i3', texto_ampliado: 'i3' },
  ] } });
  const res = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub({ curadas }), gemini);
  const data = await res.json();
  const obligado = data.items.find(i => i.año === '1845');
  assert.equal(obligado.alcance, 'nacional', 'curado AR es nacional aunque Gemini diga lo contrario');
  const intl = data.items.find(i => i.categoria === 'mundo');
  assert.equal(intl.alcance, 'internacional', 'hecho no-argentino no es nacional aunque Gemini diga lo contrario');
});

test('itemPlacaDesdePool: título se corta en frontera de palabra ≤160, nunca a mitad de palabra', async () => {
  const largo = 'en ' + 'palabra '.repeat(40) + 'final';
  const it = itemPlacaDesdePool({ año: '1990', texto: largo, seccion: 'acontecimiento', fuente: 'Wikipedia', fuenteUrl: 'x' }, 0);
  assert.ok(it.titulo.endsWith('…'), `titulo=${it.titulo}`);
  assert.ok(it.titulo.length <= 161, `length=${it.titulo.length}`);
  assert.doesNotMatch(it.titulo.slice(0, -1), /\s[a-záéíóúñ]{1,3}$/i, 'no debe quedar colgando un fragmento de ≤3 letras');
});
