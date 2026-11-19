// Endpoint /placas/v2/efemerides/tyc — con fetcherStub inyectado (sin red).
import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePlacasV2EfemeridesTyc } from '../worker/worker.js';

const TYC_HTML = '<html><article><ul>'
  + '<li>1845 - VUELTA DE OBLIGADO. La Confederación derrota al anglo-francés.</li>'
  + '<li>Día de la Tradición (conmemorativo, sin año)</li>'
  + '</ul></article></html>';

const TYC_HTML_P = '<html><article>'
  + '<p><h2>Efemérides del 19 de noviembre: ¿qué se conmemora?</h2>'
  + '<p><span style="background-color: rgb(255, 255, 0);"><b>1828 - FRANZ P. SCHUBERT.</b></span> Muere en Viena el compositor austríaco.</p>'
  + '<p><b style="background-color: rgb(255, 255, 0);">1882 - CIUDAD LA PLATA</b>. Se funda la ciudad de La Plata.</p>'
  + '<p class="alsoReadLabel">Mirá también</p>'
  + '</article></html>';
const WIKI_ES = '== Acontecimientos ==\n* [[1845]]: batalla de la [[Vuelta de Obligado]]\n';
const WIKI_EN = '== Events ==\n* [[1845]]: [[Battle of the Vuelta de Obligado]]\n';
const TYC_URL = 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-18-de-noviembre-test-id999.html';
const ORDER_DATE_18_11 = Math.floor(Date.UTC(2026, 10, 18) / 1000);
const CURADAS_1845 = { '11-18': [{ año: '1845', titulo: 'Vuelta de Obligado', resumen: '', texto_ampliado: '', icono: 'historia', fuente: 'ARCHIVO.AR' }] };

function stub({ poolEs = WIKI_ES, poolEn = WIKI_EN, curadas = CURADAS_1845 } = {}) {
  return async (url) => {
    const u = String(url);
    if (u.includes('tycsports.com')) return { ok: true, status: 200, text: async () => TYC_HTML };
    if (u.includes('xke6pkwdfrhfvirq5lt5br2m4m')) {
      return {
        ok: true, status: 200,
        json: async () => ({ data: { search: { hits: [{ order_date: ORDER_DATE_18_11, title: 'Efemérides del 18 de noviembre', url: TYC_URL }] } } }),
      };
    }
    if (u.includes('es.wikipedia.org')) return { ok: true, status: 200, text: async () => poolEs };
    if (u.includes('en.wikipedia.org')) return { ok: true, status: 200, text: async () => poolEn };
    if (u.includes('efemerides-curadas.json')) return { ok: true, status: 200, json: async () => curadas, text: async () => JSON.stringify(curadas) };
    throw new Error('url no stubbed: ' + u);
  };
}
const req = (u) => new URL(u);

test('AppSync con hit del índice → 200, cruzado con fuenteEs', async () => {
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18'), {}, stub());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.fecha, '2026-11-18');
  assert.equal(body.articulo, TYC_URL);
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].estado, 'cruzado');
  assert.match(body.items[0].fuenteEs, /Vuelta_de_Obligado/);
  assert.equal(body.meta.hechos, 1);
  assert.equal(body.meta.cruzados, 1);
});

test('URL manual bypass → 200 aunque el índice esté vacío', async () => {
  const fetcher = async (u, o) => {
    if (String(u).includes('xke6pkwdfrhfvirq5lt5br2m4m')) throw new Error('AppSync no debe llamarse con url=');
    return stub()(u, o);
  };
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18&url=' + encodeURIComponent(TYC_URL)), {}, fetcher);
  assert.equal(res.status, 200);
});

test('sin hit en el índice y sin URL manual → 502 con instrucción', async () => {
  const fetcher = async (u) => {
    if (String(u).includes('xke6pkwdfrhfvirq5lt5br2m4m')) {
      return { ok: true, status: 200, json: async () => ({ data: { search: { hits: [] } } }) };
    }
    return stub()(u);
  };
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18'), {}, fetcher);
  assert.equal(res.status, 502);
  assert.match(await res.text(), /pegá la URL/i);
});

test('curada del día → en-banco (pool vacío)', async () => {
  const fetcher = stub({ poolEs: '== Acontecimientos ==\n', poolEn: '== Events ==\n' });
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18&url=' + encodeURIComponent(TYC_URL)), {}, fetcher);
  const body = await res.json();
  assert.equal(body.items[0].estado, 'en-banco');
});

test('sin match → candidato', async () => {
  const fetcher = stub({ poolEs: '== Acontecimientos ==\n', poolEn: '== Events ==\n', curadas: {} });
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18&url=' + encodeURIComponent(TYC_URL)), {}, fetcher);
  const body = await res.json();
  assert.equal(body.items[0].estado, 'candidato');
});

test('parser 0 hechos → 502', async () => {
  const vacio = async (u, o) => {
    if (String(u).includes('tycsports.com')) {
      return { ok: true, status: 200, text: async () => '<html><article><ul><li>sin años</li></ul></article></html>' };
    }
    return stub()(u, o);
  };
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18&url=' + encodeURIComponent(TYC_URL)), {}, vacio);
  assert.equal(res.status, 502);
});

test('formato <p> con <b> resaltado (artículo 2026-11) → 200 con hechos', async () => {
  const base = stub();
  const fetcher = async (u, o) => {
    if (String(u).includes('tycsports.com')) return { ok: true, status: 200, text: async () => TYC_HTML_P };
    return base(u, o);
  };
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18&url=' + encodeURIComponent(TYC_URL)), {}, fetcher);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.meta.hechos, 2);
  assert.equal(body.items[0].año, '1828');
  assert.equal(body.items[0].titulo, 'FRANZ P. SCHUBERT');
  assert.equal(body.items[1].año, '1882');
});
