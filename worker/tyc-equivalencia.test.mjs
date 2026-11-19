// Test de equivalencia: las funciones TyC inline en worker/worker.js
// (espejo de tyc-efemerides/tyc-cotejo.mjs) deben comportarse igual que el
// módulo de referencia. Detecta deriva silenciosa entre las copias.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tokensTyc, alcanceTyc, cotejarItemsTyc } from '../worker/worker.js';
import { tokensTyc as tokensRef, alcanceTyc as alcanceRef, cotejarItemsTyc as cotejarRef } from '../tyc-efemerides/tyc-cotejo.mjs';

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
