import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TAREAS, ESQUEMAS, ESTILOS_DESC_V2, construirSystemInstruction,
  construirPromptTitulares, construirPromptReformular, construirPromptRedactar,
  interpretarRespuestaGemini, validarTitulares, validarReformulacion, validarRedaccion,
  pedirGemini, ejecutarTareaIA,
} from './redaccion-v2.mjs';

test('reformular usa el modelo nuevo, sin temperature y con tokens altos', () => {
  assert.equal(TAREAS.reformular.modelo, 'gemini-3.8-flash');
  assert.equal(TAREAS.reformular.respaldo, 'gemini-3.5-flash-lite');
  assert.equal(TAREAS.reformular.maxOutputTokens, 8192);
  assert.equal(TAREAS.titulares.maxOutputTokens, 2048);
  assert.equal(TAREAS.reformular.thinkingLevel, 'low');
  assert.equal(TAREAS.titulares.timeoutMs, 60000);
  assert.equal(TAREAS.reformular.timeoutMs, 120000);
});

test('los esquemas no permiten que el modelo invente fuentes', () => {
  assert.equal('fuentes' in ESQUEMAS.reformular.properties, false);
  assert.equal('fuentes' in ESQUEMAS.redactar.properties, false);
  assert.deepEqual(ESQUEMAS.reformular.required.sort(), ['categoria_sugerida', 'cuerpo', 'hashtags', 'titular'].sort());
});

test('la guía editorial completa llega al systemInstruction', () => {
  const guia = 'Media Mendoza es un diario del sur mendocino.\n- Usar datos verificables.\n- Evitar clickbait.';
  const system = construirSystemInstruction(guia);
  assert.match(system, /Media Mendoza es un diario del sur mendocino/);
  assert.match(system, /Usar datos verificables/);
  assert.match(system, /Evitar clickbait/);
});

test('el parser une todas las partes de texto e ignora el pensamiento', () => {
  const data = {
    candidates: [{
      finishReason: 'STOP',
      content: { parts: [
        { text: '{"titular":"Uno",', thought: true },
        { text: '{"titular":"Uno",' },
        { text: '"cuerpo":"Texto suficiente para pasar la validación."}' },
      ] },
    }],
  };
  const r = interpretarRespuestaGemini(data);
  assert.equal(r.ok, true);
  assert.equal(r.data.titular, 'Uno');
  assert.equal(r.finishReason, 'STOP');
});

test('MAX_TOKENS se informa como respuesta incompleta', () => {
  const data = { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"titular":"Cortado"' }] } }] };
  const r = interpretarRespuestaGemini(data);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'respuesta_incompleta');
});

test('SAFETY se informa como bloqueo', () => {
  const data = { candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }] };
  const r = interpretarRespuestaGemini(data);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'bloqueado_por_seguridad');
});

test('JSON inválido se informa y conserva el raw', () => {
  const data = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'no es json' }] } }] };
  const r = interpretarRespuestaGemini(data);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'json_invalido');
  assert.equal(r.raw, 'no es json');
});

test('reformular exige titular y cuerpo', () => {
  assert.equal(validarReformulacion({ titular: '', cuerpo: '' }).ok, false);
  assert.equal(validarReformulacion({ titular: 'Un título válido', cuerpo: 'x'.repeat(120) }).ok, true);
});

test('el prompt de reformular numera las fuentes y nombra el medio de origen', () => {
  const prompt = construirPromptReformular({
    titulo: 'Título original',
    contenido: 'Cuerpo original',
    estilo: 'formal',
    medioOrigen: 'Los Andes',
    fuentes: [
      { titulo: 'Fuente uno', url: 'https://ejemplo.com/1', medio: 'Los Andes' },
      { titulo: 'Fuente dos', url: 'https://ejemplo.com/2', medio: 'UNO' },
    ],
  });
  assert.match(prompt, /Los Andes/);
  assert.match(prompt, /\[1\] Fuente uno/);
  assert.match(prompt, /\[2\] Fuente dos/);
  assert.match(prompt, /No inventes links/);
});

test('el prompt de redactar incluye la fecha y las fuentes verificadas', () => {
  const prompt = construirPromptRedactar({
    ideas: 'Una idea',
    fecha: '27/10/2026, 09:30',
    fuentes: [{ titulo: 'Fuente', url: 'https://ejemplo.com', medio: 'UNO' }],
  });
  assert.match(prompt, /27\/10\/2026, 09:30/);
  assert.match(prompt, /\[1\] Fuente/);
});

test('los estilos mantienen las claves que usa la UI', () => {
  assert.ok(ESTILOS_DESC_V2.formal);
  assert.ok(ESTILOS_DESC_V2.breaking);
  assert.ok(ESTILOS_DESC_V2.cronica);
});

const CUERPO_VALIDO = 'Texto suficiente para pasar la validación de la reformulación, con más de ochenta caracteres para no fallar por cuerpo corto.';

function respuestaOk(texto = JSON.stringify({ titular: 'Titular válido', cuerpo: CUERPO_VALIDO })) {
  return new Response(JSON.stringify({
    candidates: [{ finishReason: 'STOP', content: { parts: [{ text: texto }] } }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('pedirGemini rota de key ante 429 y devuelve datos', async () => {
  let llamadas = 0;
  const fetchFalso = async () => {
    llamadas += 1;
    return llamadas === 1 ? new Response('rate', { status: 429 }) : respuestaOk();
  };
  const r = await pedirGemini({
    payload: { contents: [{ role: 'user', parts: [{ text: 'x' }] }] },
    keys: ['k1', 'k2'],
    fetchImpl: fetchFalso,
  });
  assert.equal(r.ok, true);
  assert.equal(llamadas, 2);
  assert.equal(r.data.titular, 'Titular válido');
  assert.equal(r.usage.totalTokenCount, 30);
});

test('pedirGemini pide pensamiento bajo y no envía temperature', async () => {
  let body = null;
  const fetchFalso = async (url, opciones) => {
    body = JSON.parse(opciones.body);
    return respuestaOk();
  };
  await pedirGemini({
    payload: { contents: [{ role: 'user', parts: [{ text: 'x' }] }] },
    keys: ['k1'],
    fetchImpl: fetchFalso,
  });
  assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'low');
  assert.equal('temperature' in body.generationConfig, false);
});

test('pedirGemini cae al respaldo si el primario no existe', async () => {
  const urls = [];
  const fetchFalso = async (url) => {
    urls.push(url);
    if (url.includes('gemini-3.8-flash')) return new Response('not found', { status: 404 });
    return respuestaOk('{"ok":true}');
  };
  const r = await pedirGemini({
    payload: { contents: [{ role: 'user', parts: [{ text: 'x' }] }] },
    keys: ['k1'],
    fetchImpl: fetchFalso,
  });
  assert.equal(r.ok, true);
  assert.equal(r.modelo, 'gemini-3.5-flash-lite');
  assert.ok(urls.some(u => u.includes('gemini-3.5-flash-lite')));
});

test('pedirGemini no reintenta si la respuesta se cortó por tokens', async () => {
  let llamadas = 0;
  const fetchFalso = async () => {
    llamadas += 1;
    return new Response(JSON.stringify({
      candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"titular":"Cortado"' }] } }],
    }), { status: 200 });
  };
  const r = await pedirGemini({
    payload: { contents: [{ role: 'user', parts: [{ text: 'x' }] }] },
    keys: ['k1'],
    fetchImpl: fetchFalso,
  });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'respuesta_incompleta');
  assert.equal(llamadas, 1);
});

test('ejecutarTareaIA reintenta una vez si el JSON fue inválido', async () => {
  let llamadas = 0;
  const fetchFalso = async () => {
    llamadas += 1;
    // Los dos modelos (primario y respaldo) devuelven texto inválido; el tercer
    // llamado ya es el reintento correctivo de ejecutarTareaIA.
    return llamadas <= 2 ? respuestaOk('no es json') : respuestaOk();
  };
  const r = await ejecutarTareaIA({
    payload: { contents: [{ role: 'user', parts: [{ text: 'x' }] }] },
    keys: ['k1'],
    fetchImpl: fetchFalso,
    validar: validarReformulacion,
  });
  assert.equal(r.ok, true);
  assert.equal(llamadas, 3);
  assert.equal(r.data.titular, 'Titular válido');
});

test('ejecutarTareaIA informa validación sin reintentar', async () => {
  let llamadas = 0;
  const fetchFalso = async () => {
    llamadas += 1;
    return respuestaOk('{"titular":"","cuerpo":""}');
  };
  const r = await ejecutarTareaIA({
    payload: { contents: [{ role: 'user', parts: [{ text: 'x' }] }] },
    keys: ['k1'],
    fetchImpl: fetchFalso,
    validar: validarReformulacion,
  });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'validacion');
  assert.equal(llamadas, 1);
});
