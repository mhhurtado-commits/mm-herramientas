import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fetchGemini,
  pedirGemini,
  handleVisualGenerar,
  handleVisualIlustrar,
  clasificarErrorGemini,
  esperaRetryAfterMs,
  jsonErrorIA,
  marcarGeminiEnfriamiento,
  geminiKeyEnfriada,
  reiniciarGeminiEnfriamiento,
  TAREAS,
} from './worker.js';

const KEYS = [
  'clave-Proyecto-A-0001',
  'clave-Proyecto-B-0002',
  'clave-Proyecto-C-0003',
  'clave-Proyecto-D-0004',
  'clave-Proyecto-E-0005',
];

function envGemini(extra = {}) {
  return {
    GEMINI_KEY_1: KEYS[0],
    GEMINI_KEY_2: KEYS[1],
    GEMINI_KEY_3: KEYS[2],
    GEMINI_KEY_4: KEYS[3],
    GEMINI_KEY_5: KEYS[4],
    ...extra,
  };
}

function respuestaTexto(texto) {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text: texto }] } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function respuestaError(status, cuerpo = '{"error":{"status":"RESOURCE_EXHAUSTED"}}') {
  return new Response(cuerpo, { status, headers: { 'Content-Type': 'application/json' } });
}

function keyDe(url) {
  return new URL(String(url)).searchParams.get('key');
}

async function conFetchFalso(handler, fn) {
  const original = globalThis.fetch;
  const llamadas = [];
  globalThis.fetch = async (url, opciones) => {
    llamadas.push({ url: String(url), key: keyDe(url) });
    return handler(url, opciones, llamadas.length);
  };
  try {
    return await fn(llamadas);
  } finally {
    globalThis.fetch = original;
  }
}

test('fetchGemini no encadena 5 keys x 2 modelos cuando todo devuelve 429', async () => {
  reiniciarGeminiEnfriamiento();
  await conFetchFalso(
    async () => respuestaError(429),
    async (llamadas) => {
      const r = await fetchGemini(envGemini(), { contents: [{ parts: [{ text: 'hola' }] }] });
      assert.ok(r.error, 'debe devolver error');
      assert.ok(llamadas.length <= 2, `hizo ${llamadas.length} llamadas; el máximo debe ser 2`);
    },
  );
});

test('fetchGemini cambia de modelo ante un 503 en vez de reintentar la misma key', async () => {
  reiniciarGeminiEnfriamiento();
  await conFetchFalso(
    async (url, opciones, n) => {
      if (n === 1) return respuestaError(503, '{"error":{"status":"UNAVAILABLE"}}');
      return respuestaTexto('{"ok":true}');
    },
    async (llamadas) => {
      const r = await fetchGemini(envGemini(), { contents: [{ parts: [{ text: 'hola' }] }] });
      assert.ok(r.data, 'debe recuperar el JSON');
      assert.equal(llamadas.length, 2);
      assert.notEqual(
        new URL(llamadas[0].url).pathname,
        new URL(llamadas[1].url).pathname,
        'el segundo intento debe usar otro modelo',
      );
    },
  );
});

test('fetchGemini saltea la key que devolvió 429 y usa otra del pool', async () => {
  reiniciarGeminiEnfriamiento();
  await conFetchFalso(
    async (url, opciones, n) => (n === 1 ? respuestaError(429) : respuestaTexto('{"ok":true}')),
    async (llamadas) => {
      const r = await fetchGemini(envGemini(), { contents: [{ parts: [{ text: 'hola' }] }] });
      assert.ok(r.data);
      assert.equal(llamadas.length, 2);
      assert.notEqual(llamadas[0].key, llamadas[1].key, 'el segundo intento debe usar otra key');
      assert.equal(geminiKeyEnfriada(llamadas[0].key), true, 'la key con 429 queda en enfriamiento');
    },
  );
});

test('fetchGemini no usa keys en enfriamiento mientras haya una sana', async () => {
  reiniciarGeminiEnfriamiento();
  marcarGeminiEnfriamiento(KEYS[0], 60000);
  await conFetchFalso(
    async () => respuestaTexto('{"ok":true}'),
    async (llamadas) => {
      const r = await fetchGemini(envGemini(), { contents: [{ parts: [{ text: 'hola' }] }] });
      assert.ok(r.data);
      assert.equal(llamadas.length, 1);
      assert.notEqual(llamadas[0].key, KEYS[0]);
    },
  );
});

test('pedirGemini no encadena 5 keys x 2 modelos cuando todo devuelve 429', async () => {
  reiniciarGeminiEnfriamiento();
  let llamadas = 0;
  const r = await pedirGemini({
    payload: { contents: [{ parts: [{ text: 'hola' }] }] },
    keys: KEYS,
    tarea: 'titulares',
    fetchImpl: async () => {
      llamadas += 1;
      return respuestaError(429);
    },
  });
  assert.equal(r.ok, false);
  assert.ok(llamadas <= 2, `hizo ${llamadas} llamadas; el máximo debe ser 2`);
});

test('redaccion-v2 usa 3.1 como respaldo porque 3.8 tiene solo 5 RPM', () => {
  assert.equal(TAREAS.reformular.respaldo, 'gemini-3.1-flash-lite');
  assert.equal(TAREAS.titulares.respaldo, 'gemini-3.1-flash-lite');
});

test('clasifica 429 de cuota distinto de 429 de capacidad', () => {
  assert.equal(clasificarErrorGemini(429, '{"status":"RESOURCE_EXHAUSTED"}'), 'cuota');
  assert.equal(clasificarErrorGemini(429, '{"reason":"MODEL_CAPACITY_EXHAUSTED"}'), 'capacidad');
  assert.equal(clasificarErrorGemini(503), 'servidor');
  assert.equal(clasificarErrorGemini(401), 'auth');
  assert.equal(clasificarErrorGemini(404), 'modelo');
});

test('respeta Retry-After en segundos y lo acota', () => {
  const headers = new Headers({ 'Retry-After': '7' });
  assert.equal(esperaRetryAfterMs(headers), 7000);
  const exagerado = new Headers({ 'Retry-After': '9999' });
  assert.equal(esperaRetryAfterMs(exagerado), 30000);
  assert.equal(esperaRetryAfterMs(new Headers()), 0);
});

test('jsonErrorIA devuelve 503 con Retry-After ante saturación de IA', async () => {
  const res = jsonErrorIA({ error: 'Todas las keys de Gemini fallaron (429 Rate Limit)' });
  assert.equal(res.status, 503);
  assert.equal(res.headers.get('Retry-After'), '60');
  const resConfig = jsonErrorIA({ error: 'No hay API keys de Gemini configuradas' });
  assert.equal(resConfig.status, 500);
});

test('handleVisualGenerar acepta texto plano sin intentar parsearlo como JSON', async () => {
  reiniciarGeminiEnfriamiento();
  await conFetchFalso(
    async () => respuestaTexto('ok'),
    async () => {
      const res = await handleVisualGenerar({ prompt: 'Responde solo con la palabra ok' }, envGemini());
      const cuerpo = await res.json();
      assert.equal(res.status, 200);
      assert.equal(cuerpo.ok, true);
      assert.equal(cuerpo.texto, 'ok');
    },
  );
});

test('handleVisualIlustrar usa Cloudflare FLUX sin tocar la cuota de imagen de Gemini', async () => {
  reiniciarGeminiEnfriamiento();
  let llamadasGemini = 0;
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    llamadasGemini += 1;
    return respuestaError(429);
  };
  try {
    const env = envGemini({
      AI: { run: async () => ({ image: btoa('x'.repeat(256)) }) },
    });
    const res = await handleVisualIlustrar({ prompt: 'tormenta sobre un viñedo' }, env);
    const cuerpo = await res.json();
    assert.equal(res.status, 200);
    assert.equal(cuerpo.ok, true);
    assert.match(cuerpo.imagen, /^data:image\//);
    assert.equal(llamadasGemini, 0, 'no debe llamar al modelo de imagen de Gemini');
  } finally {
    globalThis.fetch = original;
  }
});
