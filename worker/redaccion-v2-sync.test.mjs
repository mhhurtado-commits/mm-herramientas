import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const worker = readFileSync(new URL('./worker.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const MODULOS = [
  { nombre: 'redaccion-v2', archivo: new URL('./redaccion-v2.mjs', import.meta.url), inicio: '// >>> REDACCION-V2 INLINE', fin: '// <<< REDACCION-V2 INLINE' },
  { nombre: 'redaccion-fuentes', archivo: new URL('./redaccion-fuentes.mjs', import.meta.url), inicio: '// >>> REDACCION-FUENTES INLINE', fin: '// <<< REDACCION-FUENTES INLINE' },
];

function limpiar(texto) {
  return texto.replace(/^import .*$/gm, '').replace(/^export /gm, '').trim();
}

function bloque(workerTexto, inicio, fin) {
  const i = workerTexto.indexOf(inicio);
  const f = workerTexto.indexOf(fin);
  if (i === -1 || f === -1 || f < i) return '';
  return workerTexto.slice(i + inicio.length, f).trim();
}

for (const modulo of MODULOS) {
  test(`worker.js tiene el bloque inline de ${modulo.nombre}`, () => {
    const esperado = limpiar(readFileSync(modulo.archivo, 'utf8').replace(/\r\n/g, '\n'));
    assert.equal(bloque(worker, modulo.inicio, modulo.fin), esperado);
  });
}

test('worker.js sigue sin imports', () => {
  assert.equal(/^import /m.test(worker), false);
});
