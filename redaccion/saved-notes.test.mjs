import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./index.html', import.meta.url), 'utf8');

test('las notas guardadas no incrustan el objeto completo en onclick', () => {
  assert.equal(source.includes("onclick='cargarNotaGuardada(\${JSON.stringify(n)})'"), false);
  assert.match(source, /cargarNotaGuardada\(n\)/);
  assert.match(source, /addEventListener\(['"]click['"],\s*\(\)\s*=>\s*cargarNotaGuardada\(n\)/);
});
