import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('binds format changes only inside the format controls', () => {
  const app = readFileSync(new URL('./app.mjs', import.meta.url), 'utf8');
  assert.match(app, /querySelectorAll\('#formatList \[data-format\]'\)/);
});
