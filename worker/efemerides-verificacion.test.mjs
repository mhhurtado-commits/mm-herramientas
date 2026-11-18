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
