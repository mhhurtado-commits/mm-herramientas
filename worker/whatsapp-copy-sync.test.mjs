import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const worker = readFileSync(new URL('./worker.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const modulo = readFileSync(new URL('./whatsapp-copy.mjs', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const shared = readFileSync(new URL('../shared/editorial-package.mjs', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('worker.js es autocontenido: sin imports y con el módulo whatsapp-copy inlined', () => {
  assert.ok(!/^import /m.test(worker), 'worker.js no debe tener imports');
  const lineas = modulo
    .replace(/^export /gm, '')
    .split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('//'));
  const faltantes = lineas.filter(l => !worker.includes(l.trimEnd()));
  assert.deepEqual(faltantes, [], `worker.js desincronizado con whatsapp-copy.mjs (líneas faltantes: ${faltantes.length}): ${faltantes[0]}`);
});

test('worker.js inlina el validar del contrato noticia_editorial v2', () => {
  assert.equal(worker.includes('function normalizeEditorialPackage(input = {})'), true);
  assert.equal(worker.includes('const EDITORIAL_PACKAGE_VERSION = 2;'), true);
  const guardiaVersion = 'if (Number(source.version) !== EDITORIAL_PACKAGE_VERSION) errors.push(\'version inválida\')';
  if (!worker.includes(guardiaVersion)) {
    const guardiaShared = shared.includes(guardiaVersion);
    if (guardiaShared) assert.fail('worker.js desincronizado con shared/editorial-package.mjs (guardia de versión)');
  }
});
