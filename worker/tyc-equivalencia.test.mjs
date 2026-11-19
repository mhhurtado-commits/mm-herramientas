// Test de equivalencia: las funciones TyC inline en worker/worker.js
// (espejo de tyc-efemerides/tyc-cotejo.mjs) deben comportarse igual que el
// módulo de referencia. Detecta deriva silenciosa entre las copias.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokensTyc, alcanceTyc, cotejarItemsTyc, parsearEfemeridesTyc } from '../worker/worker.js';
import { tokensTyc as tokensRef, alcanceTyc as alcanceRef, cotejarItemsTyc as cotejarRef } from '../tyc-efemerides/tyc-cotejo.mjs';
import { parsearEfemeridesTyc as parseModule } from '../tyc-efemerides/tyc-parse.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = ['18-11-2024.html', '29-05-2026.html', '19-11-2026.html']
  .map(f => readFileSync(path.join(DIR, '..', 'tyc-efemerides', 'fixtures', f), 'utf8'));

const CORPUS = [
  'la Vuelta de Obligado 1845',
  'Fallece el periodista y escritor argentino Pepe Eliaschev',
  'Malvinas 1982',
  'Steamboat Willie se estrena en Hollywood',
  'Nace en la localidad riojana de San Antonio el caudillo federal',
  'Muere en Buenos Aires el publicista',
  'el General San Martín cruza los Andes',
];

test('tokensTyc inline ≡ módulo de referencia', () => {
  for (const t of CORPUS) assert.deepEqual(tokensTyc(t), tokensRef(t), `tokens: ${t}`);
});

test('alcanceTyc inline ≡ módulo de referencia', () => {
  for (const t of CORPUS) assert.equal(alcanceTyc(t), alcanceRef(t), `alcance: ${t}`);
});

test('cotejarItemsTyc inline ≡ módulo de referencia', () => {
  const POOL = [
    { año: '1845', texto: 'Vuelta de Obligado: batalla del Paraná', fuenteEs: 'https://es.wikipedia.org/wiki/Vuelta_de_Obligado' },
    { año: '1958', texto: 'Daniel Brailovsky nace en Buenos Aires', fuenteEs: 'https://es.wikipedia.org/wiki/Daniel_Brailovsky' },
  ];
  const CUR = [{ año: '1845', titulo: 'Vuelta de Obligado' }];
  const TYC = [
    { año: '1845', titulo: 'Obligado', texto: 'Vuelta de Obligado' },
    { año: '2014', titulo: 'Pepe', texto: 'Fallece el periodista argentino Pepe Eliaschev' },
  ];
  assert.deepEqual(cotejarItemsTyc(TYC, POOL, CUR), cotejarRef(TYC, POOL, CUR));
});

test('parsearEfemeridesTyc inline ≡ módulo de referencia (fixtures <li> y <p>)', () => {
  for (const html of FIXTURES) {
    assert.deepEqual(parsearEfemeridesTyc(html), parseModule(html));
  }
});
