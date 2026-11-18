import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const JSON_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'efemerides-curadas.json');
const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

test('claves MM-DD válidas y listas no vacías', () => {
  for (const [clave, lista] of Object.entries(data)) {
    assert.match(clave, /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, `clave ${clave}`);
    assert.ok(Array.isArray(lista) && lista.length > 0, `lista ${clave}`);
  }
});

test('cada entrada: año 4 dígitos, resumen ≤100, texto_ampliado ≤240, fuente presente', () => {
  for (const [clave, lista] of Object.entries(data)) {
    for (const h of lista) {
      assert.match(String(h.año), /^\d{4}$/, `${clave} ${h.titulo}`);
      assert.ok(h.titulo && h.resumen && h.texto_ampliado, `${clave} ${h.titulo}: campos requeridos`);
      assert.ok(h.resumen.length <= 100, `${clave} ${h.titulo}: resumen ${h.resumen.length}`);
      assert.ok(h.texto_ampliado.length <= 240, `${clave} ${h.titulo}: ampliado ${h.texto_ampliado.length}`);
      assert.ok(['ARCHIVO.AR', 'Media Mendoza'].includes(h.fuente), `${clave} ${h.titulo}: fuente`);
    }
  }
});

test('mendocinas originales siguen presentes', () => {
  assert.equal(data['01-12'][0].año, '1817');
  assert.equal(data['03-02'][0].año, '1561');
  assert.equal(data['03-20'][0].año, '1861');
});
