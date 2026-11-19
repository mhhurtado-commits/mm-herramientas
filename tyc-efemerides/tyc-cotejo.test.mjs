import test from 'node:test';
import assert from 'node:assert/strict';
import { tokensTyc, alcanceTyc, cotejarItemsTyc } from './tyc-cotejo.mjs';

test('tokensTyc: devuelve solo palabras >=4 letras, sin stopwords y sin dígitos', () => {
  const t = tokensTyc('la Vuelta de Obligado 1845');
  assert.ok(t.includes('vuelta'));
  assert.ok(t.includes('obligado'));
  assert.ok(!t.includes('la'));
  assert.ok(!t.includes('de'));
  assert.ok(!t.includes('1845'), `tokens: ${t}`);
});

test('alcanceTyc: detecta nacional por regex AR', () => {
  assert.equal(alcanceTyc('en Buenos Aires, Argentina'), 'nacional');
  assert.equal(alcanceTyc('el general San Martín cruza los Andes'), 'nacional');
  assert.equal(alcanceTyc('Malvinas 1982'), 'nacional');
  assert.equal(alcanceTyc('Steamboat Willie se estrena en Hollywood'), 'internacional');
});

const POOL_EJEMPLO = [
  { año: '1845', texto: 'Vuelta de Obligado: batalla del Paraná', fuenteEs: 'https://es.wikipedia.org/wiki/Vuelta_de_Obligado' },
  { año: '1958', texto: 'Daniel Brailovsky nace en Buenos Aires', fuenteEs: 'https://es.wikipedia.org/wiki/Daniel_Brailovsky' },
  { año: '1978', texto: 'Mueren 900 en Jonestown', fuenteEs: 'https://es.wikipedia.org/wiki/Jonestown' },
];

const CURADAS_11_18 = [
  { año: '1845', titulo: 'Vuelta de Obligado', resumen: '', texto_ampliado: '', icono: 'historia', fuente: 'ARCHIVO.AR' },
  { año: '1903', titulo: 'Algo internacional', resumen: '', texto_ampliado: '', icono: 'historia', fuente: 'ARCHIVO.AR' },
];

test('cotejarItemsTyc: cruzado si año+token en pool', () => {
  const tyc = [{ año: '1845', titulo: 'Obligado', texto: 'Vuelta de Obligado en el Paraná' }];
  const out = cotejarItemsTyc(tyc, POOL_EJEMPLO, []);
  assert.equal(out[0].estado, 'cruzado');
  assert.ok(out[0].fuenteEs?.includes('Vuelta_de_Obligado'));
  assert.equal(out[0].alcance, 'nacional');
});

test('cotejarItemsTyc: en-banco si año+token en curadas del día', () => {
  const tyc = [{ año: '1845', titulo: 'Obligado', texto: 'La Vuelta de Obligado ocurrió en el Paraná' }];
  const out = cotejarItemsTyc(tyc, [], CURADAS_11_18);
  assert.equal(out[0].estado, 'en-banco');
});

test('cotejarItemsTyc: candidato si no hay match', () => {
  const tyc = [{ año: '2014', titulo: 'Pepe Eliaschev', texto: 'Fallece el periodista y escritor argentino Pepe Eliaschev' }];
  const out = cotejarItemsTyc(tyc, POOL_EJEMPLO, CURADAS_11_18);
  assert.equal(out[0].estado, 'candidato');
  assert.equal(out[0].alcance, 'nacional');
});

test('cotejarItemsTyc: internacional si no es AR', () => {
  const tyc = [{ año: '1928', titulo: 'Steamboat Willie', texto: 'Se estrena Steamboat Willie con Mickey Mouse' }];
  const out = cotejarItemsTyc(tyc, POOL_EJEMPLO, []);
  assert.equal(out[0].alcance, 'internacional');
});

test('cotejarItemsTyc: no muta el array original', () => {
  const tyc = [{ año: '1845', titulo: 'Obligado', texto: 'Vuelta de Obligado' }];
  const antes = tyc[0].estado;
  cotejarItemsTyc(tyc, POOL_EJEMPLO, []);
  assert.equal(tyc[0].estado, antes, 'array original no mutado');
});