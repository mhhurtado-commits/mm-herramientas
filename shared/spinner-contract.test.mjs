import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');

test('shared spinner contract starts hidden and exposes an active state', () => {
  const css = read('style.css');
  assert.match(css, /\.mm-spinner\s*\{[^}]*display:\s*none\s*;/s);
  assert.match(css, /\.mm-spinner\.is-active[^}]*display:\s*inline-block/s);
});

test('placas-v2 uses the shared spinner contract', () => {
    const html = read('placas-v2/index.html');
    const css = read('placas-v2/root-alignment.css');
    assert.match(html, /classList\.replace\('spinner', 'mm-spinner'\)/);
    assert.match(css, /\.mm-spinner/);
    assert.doesNotMatch(css, /\.spinner\s*\{/);
});
