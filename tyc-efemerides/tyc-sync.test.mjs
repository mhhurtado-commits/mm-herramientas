import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { procesarDia } from './tyc-sync.mjs';
import { parsearEfemeridesTyc } from './tyc-parse.mjs';

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const html2024 = readFileSync(path.join(FIX, '18-11-2024.html'), 'utf8');
const html2026 = readFileSync(path.join(FIX, '29-05-2026.html'), 'utf8');

const TYC_2024 = 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-18-de-noviembre-que-se-conmemora-hoy-id619733.html';
const TYC_2026 = 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-29-de-mayo-que-se-conmemora-hoy-id733288.html';

const fetcherConSP = (opciones = {}) => {
  const curadasRespuesta = opciones.curadas ?? { '11-18': [{ año: '1834', titulo: 'Jujuy declarado provincia', resumen: '', texto_ampliado: '', icono: 'mapa', fuente: 'ARCHIVO.AR' }] };
  return async (url) => {
    const u = String(url);
    if (u.includes('mediamendoza.pages.dev')) {
      return { ok: true, status: 200, json: async () => curadasRespuesta, text: async () => JSON.stringify(curadasRespuesta) };
    }
    if (u.includes('nytimes') || u.includes('wikipedia.org')) return { ok: false, status: 503, text: async () => '' };
    if (u.includes(TYC_2024)) return { ok: true, status: 200, text: async () => html2024 };
    if (u.includes(TYC_2026)) return { ok: true, status: 200, text: async () => html2026 };
    throw new Error('url no stubbed: ' + u);
  };
};

test('procesarDia: 2024 → decodificado, recortado, estados y markdown', async () => {
  const out = await procesarDia({ fecha: '2024-11-18', url: TYC_2024, fetcher: fetcherConSP() });
  assert.ok(out.items.length > 0);
  assert.equal(out.items[0].año.length, 4);
  assert.ok(out.items[0].texto.length <= 121, `texto ${out.items[0].texto.length}`);
  assert.ok(out.markdown.includes('## Candidatos') || out.markdown.includes('## Cruzados') || out.markdown.includes('## En el Banco'));
  assert.ok(out.markdown.includes('TyC'));
});

test('procesarDia: 2026 → candidatos nacionales al menos', async () => {
  const out = await procesarDia({ fecha: '2026-05-29', url: TYC_2026, fetcher: fetcherConSP({
    curadas: { '05-29': [{ año: '1892', titulo: 'Alfonsina Storni', resumen: '', texto_ampliado: '', icono: 'pluma', fuente: 'ARCHIVO.AR' }] },
  }) });
  const años = out.items.map(i => i.año);
  assert.ok(años.includes('1892'));
  // Alfonsina Storni en CURADAS 05-29 → en-banco o cruzado; A. no verificada tiene candidato
  const alfonsina = out.items.find(i => i.año === '1892');
  assert.ok(['en-banco', 'cruzado'].includes(alfonsina.estado), `estado: ${alfonsina.estado}`);
});

test('procesarDia: URL inválida → error claro y código PARSER_VACIO si aplica', async () => {
  // No encontramos artículo: usamos URL de artículo sin hechos.
  const fetcherCorto = async (url) => {
    if (url.includes('mediamendoza')) return { ok: true, status: 200, json: async () => ({}), text: async () => '{}' };
    if (url.includes('wikipedia')) return { ok: false, status: 503, text: async () => '' };
    if (String(url).endsWith('/tyc-test-vacio')) return { ok: true, status: 200, text: async () => '<html><article><ul><li>sin años</li></ul></article></html>' };
    throw new Error('url no stubbed');
  };
  await assert.rejects(
    () => procesarDia({ fecha: '2030-01-01', url: 'https://media.mendoza/test/tyc-test-vacio', fetcher: fetcherCorto }),
    (e) => e.message.includes('0 hechos') && e.code === 'PARSER_VACIO',
  );
});