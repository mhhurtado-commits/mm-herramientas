import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = file => readFile(new URL(file, import.meta.url), 'utf8');

test('WhatsApp no deja un polling infinito de programados', async () => {
  const source = await read('../whatsapp/index.html');

  assert.doesNotMatch(source, /setInterval\(checkRecordatorios\s*,\s*60000\)/);
  assert.match(source, /let programadosRequest\s*=\s*null/);
  assert.match(source, /if\s*\(programadosRequest\)\s*return programadosRequest/);
});

test('Agenda carga eventos del año una sola vez al iniciar', async () => {
  const source = await read('../agenda/index.html');

  assert.match(source, /function eventosDelMesActual\(\)[\s\S]*EVENTOS_ALL\.filter/);
  assert.doesNotMatch(source, /Promise\.all\(\[cargarEfemeridesKV\(\), cargarEventosKV\(\), cargarEventosAll\(\)\]\)/);
  assert.doesNotMatch(source, /cargarEventosKV\(\)\.then\(\{?\s*renderVista/);
});

test('los índices vacíos se persisten y evitan repetir KV.list', async () => {
  const source = await read('./worker.js');

  assert.doesNotMatch(source, /if\(f\.length\) await env\.KV\.put\("fuentes_index"/);
  assert.doesNotMatch(source, /if\(n\.length\) await env\.KV\.put\("notas_index"/);
  assert.doesNotMatch(source, /if\(c\.length\) await env\.KV\.put\("cubiertas_index"/);
  assert.match(source, /await env\.KV\.put\("fuentes_index",JSON\.stringify\(f\)\)/);
  assert.match(source, /await env\.KV\.put\("notas_index",JSON\.stringify\(n\)\)/);
  assert.match(source, /await env\.KV\.put\("cubiertas_index",JSON\.stringify\(c\)\)/);
});

test('las rutas públicas de índices conservan sus contratos', async () => {
  const source = await read('./worker.js');

  assert.match(source, /return jsonOk\(\{fuentes\}\)/);
  assert.match(source, /return jsonOk\(\{notas\}\)/);
  assert.match(source, /return jsonOk\(\{links\}\)/);
});
