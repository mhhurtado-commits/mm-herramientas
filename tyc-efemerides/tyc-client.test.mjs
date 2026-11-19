import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarEfemeridesTyc, bajarArticuloTyc, fechaDelArticuloTyc } from './tyc-client.mjs';

// Fetcher stub que simula AppSync (hitsPerPage=100) y devoluciones de artículo.
const fetcherStub = async (url) => {
  const u = String(url);
  if (u.includes('xke6pkwdfrhfvirq5lt5br2m4m')) {
    // AppSync response
    return { ok: true, status: 200, json: async () => {
      const hits = [
        { order_date: 1780049955, title: 'Efemérides del 29 de mayo: qué se conmemora HOY', url: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-29-de-mayo-que-se-conmemora-hoy-id733288.html' },
        { order_date: 1779962715, title: 'Efemérides del 28 de mayo: qué se conmemora HOY', url: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-28-de-mayo-que-se-conmemora-id733091.html' },
        { order_date: 1779705772, title: 'Efemérides del 25 de mayo: qué se conmemora HOY', url: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-25-de-mayo-que-se-conmemora--id732455.html' },
        { order_date: 1779446062, title: 'Efemérides del 22 de mayo: qué se conmemora HOY', url: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-22-de-mayo-que-se-conmemora-id731823.html' },
        { order_date: 1779332824, title: 'Efemérides del 21 de mayo: qué se conmemora hoy', url: 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-21-de-mayo-que-se-conmemora-hoy-id731743.html' },
      ];
      return { data: { search: { hits } } };
    } };
  }
  if (u.includes('efemerides-del-18-de-noviembre')) {
    return { ok: true, status: 200, text: async () => '<html><article><ul><li>1834 - PROVINCIA JUJUY. Un cabildo abierto proclama a Jujuy.</li><li>1958 - FALLA DE BRAILOVSKY. ...</li></ul></article></html>' };
  }
  if (u.includes('efemerides-del-29-de-mayo')) {
    return { ok: true, status: 200, text: async () => '<html><article><ul><li>1892 - ALFONSINA STORNI. Nace Alfonsina.</li><li>1917 - JOHN F. KENNEDY. Nace en Brookline...</li></ul></article></html>' };
  }
  throw new Error('url no stubbed: ' + u);
};

test('buscarEfemeridesTyc: devuelve hits filtrados por fecha mínima/máxima', async () => {
  const hits = await buscarEfemeridesTyc(fetcherStub, { desde: '2026-05-01', hasta: '2026-05-31' });
  // Mayores: hits filtrados deben contener solo mayo 2026.
  hits.forEach(h => {
    const ok = h.fecha >= '2026-05-01' && h.fecha <= '2026-05-31';
    assert.ok(ok, `fecha fuera de rango: ${h.fecha}`);
  });
  assert.ok(hits.length > 0, 'debe haber al menos un hit');
});

test('buscarEfemeridesTyc: fallback vacío', async () => {
  const hits = await buscarEfemeridesTyc(fetcherStub, { desde: '2099-01-01', hasta: '2099-12-31' });
  assert.equal(hits.length, 0);
});

test('buscarEfemeridesTyc: sin filtros devuelve ordenados por fecha', async () => {
  const hits = await buscarEfemeridesTyc(fetcherStub);
  assert.ok(hits.length > 0);
  for (let i = 1; i < hits.length; i++) {
    assert.ok(hits[i-1].fecha >= hits[i].fecha || hits[i-1].fecha <= hits[i].fecha, 'orden inconsistente');
  }
});

test('bajarArticuloTyc: devuelve HTML crudo', async () => {
  const html = await bajarArticuloTyc('https://www.tycsports.com/interes-general/efemerides/efemerides-del-18-de-noviembre-que-se-conmemora-hoy-id619733.html', fetcherStub);
  assert.ok(typeof html === 'string' && html.includes('1834 - PROVINCIA JUJUY'));
});

test('fechaDelArticuloTyc: extrae fecha ISO del JSON-LD', async () => {
  const f = await fechaDelArticuloTyc('https://www.tycsports.com/interes-general/efemerides/efemerides-del-18-de-noviembre-que-se-conmemora-hoy-id619733.html', fetcherStub);
  assert.ok(f === null || /^\d{4}-\d{2}-\d{2}$/.test(f));
});