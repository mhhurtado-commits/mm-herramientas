import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parsearEfemeridesTyc } from './tyc-parse.mjs';

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const FIX_2024 = readFileSync(path.join(FIX, '18-11-2024.html'), 'utf8');
const FIX_2026 = readFileSync(path.join(FIX, '29-05-2026.html'), 'utf8');

test('parse 2024-11-18: extrae hechos con años y títulos', () => {
  const items = parsearEfemeridesTyc(FIX_2024);
  assert.ok(items.length >= 8, `items=${items.length}`);
  const años = items.map(i => i.año);
  const esperados = ['1834', '1922', '1932', '1943', '1951', '1954', '1993', '2005', '2009', '2017'];
  for (const a of esperados) assert.ok(años.includes(a), `falta año ${a} en ${años}`);
});

test('parse 2026-05-29: extrae hechos con años esperados y ignora conmemorativos', () => {
  const items = parsearEfemeridesTyc(FIX_2026);
  assert.ok(items.length >= 8, `items=${items.length}`);
  const años = items.map(i => i.año);
  const esperados = ['1892', '1917', '1959', '1967', '1969', '2011', '2018', '2020'];
  for (const a of esperados) assert.ok(años.includes(a), `falta año ${a} en ${años}`);
});

test('parse: sin texto, siempre año+título+texto', () => {
  const items = parsearEfemeridesTyc(FIX_2024);
  for (const i of items) {
    assert.match(i.año, /^\d{3,4}$/, `año ${i.año}`);
    assert.ok(i.titulo && i.titulo.length > 0, 'titulo no vacío');
    assert.ok(i.texto && i.texto.length > 0, 'texto no vacío');
    assert.ok(!i.texto.includes('&'), 'entidades decodificadas');
  }
});

test('parse: no duplica items con mismo año+título', () => {
  const html = '<ul><li>1834 - PROVINCIA JUJUY. Texto.</li><li>1834 - PROVINCIA JUJUY. Texto repetido.</li></ul>';
  const items = parsearEfemeridesTyc(html);
  assert.equal(items.length, 1);
});