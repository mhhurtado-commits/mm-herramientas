import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fuente = await readFile(new URL('./index.html', import.meta.url), 'utf8');

// La pestaña "Original" se monta desde app.mjs mientras el HTML no la traiga.
// Estas anclas son el contrato: si cambian de nombre, el montaje se rompe sin avisar.
test('el HTML conserva las anclas que usa el montaje de la pestaña Original', () => {
  for (const ancla of ['ref-imagen-section', 'red-subtabs', 'img-content-ia', 'img-tab-ia']) {
    assert.match(fuente, new RegExp(`id="${ancla}"|class="${ancla}"`), `Falta el ancla ${ancla}`);
  }
});

test('la sección de imagen arranca oculta y la pestaña de IA es la activa por defecto', () => {
  assert.match(fuente, /id="ref-imagen-section"[^>]*style="display:none/);
  assert.match(fuente, /id="img-tab-ia"[^>]*class="red-subtab active"|class="red-subtab active"[^>]*id="img-tab-ia"/);
});

test('la app no incrusta la imagen generada en el índice de notas guardadas', () => {
  // El índice de KV guarda la nota completa: una portada base64 lo haría crecer de más.
  assert.equal(fuente.includes('data:image/jpeg;base64'), false);
});

test('app.mjs importa urlProxyImagen de logic.mjs para la carga del compositor y portadas', async () => {
  const appSrc = await readFile(new URL('./app.mjs', import.meta.url), 'utf8');
  assert.match(appSrc, /import\s*\{[^}]*urlProxyImagen[^}]*\}\s*from\s*['"]\.\/logic\.mjs['"]/);
});

test('la pestaña Config muestra las reglas fijas de salida', () => {
  assert.match(fuente, /id="contrato-salida"/);
  assert.match(fuente, /Texto plano/);
  assert.match(fuente, /diez familias/);
});

test('la ayuda de la guía separa voz de estructura y menciona la nota modelo', () => {
  assert.match(fuente, /id="guia-ayuda"/);
  assert.match(fuente, /voz y valores/i);
  assert.match(fuente, /NOTA MODELO/);
});
