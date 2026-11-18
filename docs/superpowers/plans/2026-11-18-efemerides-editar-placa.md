# Editar la placa de /efemerides/ (Destacar · Ocultar · Agregar hecho) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:executing-plans (o subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** En `/efemerides/`, que el redactor pueda modificar la placa del día: poner un hecho como destacada con un botón, ocultar hechos irrelevantes (ej. Canal 5 Rosario hoy) y agregar un hecho propio (ej. de Mendoza); los copys WA/IG siguen la edición vía POST al worker.

**Architecture:** Toda la edición vive en memoria del navegador (sin persistencia, a pedido del usuario). El canvas/PNG/COPIAR salen siempre del estado editado. Estado `itemsPlaca[]` en `efemerides.mjs`; vistas derivadas vía puras en `placa-model.mjs`. Copys con edición → POST `/placas/v2/efemerides/copys` (nuevo en el worker, sin KV: generación fresca; GET intacto). La destacada es siempre el primer hecho visible.

**Tech Stack:** HTML/CSS/JS vanilla, módulos `.mjs`, canvas 2D; worker single-file `worker/worker.js` (manual deploy en dashboard de Cloudflare); tests `node:test` sin dependencias.

## Global Constraints

- Sin persistencia: la edición muere al recargar/cambiar la fecha; `cargar()` resetea el editor junto a los copys.
- La destacada = primer hecho visible. Prohibido guardar un `heroIndex`.
- PNG / COPIAR PNG / DESCARGAR salen del canvas → quedan editados solos.
- Copys reflejan la edición (POST). GET queda intacto bit a bit hasta la rama compartida `generarCopysEf`.
- No se toca KV (ni placa v5 ni copys v6). No se edita el texto de hechos existentes. No hay flechas de orden.
- Año de hecho propio: 4 dígitos, 1000–2099, **sin** `repararAnioEfemerides` (2026 es legítimo).
- No tocar: hunk `handleVisualGenerar` en `worker/worker.js`, `visual-suite/*`, `docs/**` ajenos. EOL CRLF de `worker/worker.js` intacta.
- Verificación: `node --test --test-isolation=none <archivo>`; suite completa del repo (comando en AGENTS.md + `efemerides/placa-model.test.mjs`); `node --check worker/worker.js`.
- Commits selectivos en `worker/worker.js` con el staging por hunks (`C:\Users\Miguel\AppData\Local\Temp\opencode\stage-worker-copys.js` descarta el hunk ajeno `handleVisualGenerar`).
- Commit trailer estándar: mensaje en español, prefijo `feat|fix|docs(scope):`.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `efemerides/placa-model.mjs` | Puras: normalizarPayload (+`id`,`icono`, +`items`), `construirModeloPlaca`, `itemsVisiblesCopys`, `validarHechoPropio`, `emojiIconoEf`, `ICONOS_EF` |
| `efemerides/placa-model.test.mjs` | Tests de las puras nuevas |
| `efemerides/efemerides.mjs` | Estado `itemsPlaca`, render del editor, handlers, branching copys GET/POST |
| `efemerides/index.html` | Sección `#editorPlaca` (tarjetas + form AGREGAR) + estilos |
| `worker/worker.js` | `normalizarItemsEditados`, `obtenerLinksWaEf`, `generarTextoGeminiCopys`, `generarCopysEf`, reescritura de `handlePlacasV2EfemeridesCopys`, nueva `handlePlacasV2EfemeridesCopysPost`, ruta POST, exports |
| `worker/efemerides-copys.test.mjs` | Tests puras worker + handler POST (fake env/KV/gemini) + regresión GET 502 |

---
### Task 1: Modelo de edición puro (`placa-model.mjs`)

**Files:**
- Modify: `efemerides/placa-model.mjs`
- Test: `efemerides/placa-model.test.mjs`

**Interfaces produced:**
- `ICONOS_EF: string[]`
- `etiquetaCategoria(item)` (ya existe), `emojiIconoEf(icono) → string`
- `normalizarPayload(raw) → { ok, fecha, fuente, verificada, hero?, rows?, totalMostrados?, total?, items[] }` — `items` conserva `id` e `icono`, array interno de máx 6
- `construirModeloPlaca(items, fecha='') → { ok, fecha, hero, rows, totalMostrados, total, verificada }`
- `itemsVisiblesCopys(items) → [{ id, año, titulo, resumen, texto_ampliado, icono }]` (máx 6, sin ocultos, mismo orden)
- `validarHechoPropio({ año, titulo, resumen, ampliado, icono }) → { ok:true, hecho:{ año, titulo, resumen, ampliado, icono } } | { ok:false, error:string }`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `efemerides/placa-model.test.mjs` (e importar las nuevas puras en la línea 3):

```js
test('normalizarPayload: conserva id, icono y devuelve items normalizados', () => {
  const items = [1, 2, 3, 4, 5].map(n => ({ ...ITEM(n, `Hecho ${n}`), id: `id-${n}`, icono: 'politica' }));
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.items.length, 5);
  assert.deepEqual(r.items.map(i => i.id), ['id-1', 'id-2', 'id-3', 'id-4', 'id-5']);
  assert.equal(r.items[0].icono, 'politica');
});

test('construirModeloPlaca: hero = primer visible, ocultos fuera, etiqueta N DE M', () => {
  const items = [
    { ...ITEM(1, 'A'), oculto: true, verificada: true },
    { ...ITEM(2, 'B'), verificada: true },
    { ...ITEM(3, 'C'), verificada: true },
  ];
  const m = construirModeloPlaca(items, '2026-11-18');
  assert.equal(m.ok, true);
  assert.equal(m.hero.titulo, 'B');
  assert.deepEqual(m.rows.map(i => i.titulo), ['C']);
  assert.equal(m.totalMostrados, 2);
  assert.equal(m.total, 3);
  assert.equal(m.verificada, true);
});

test('construirModeloPlaca: 1 visible → hero solo, 0 filas (sin división por cero)', () => {
  const m = construirModeloPlaca([{ ...ITEM(1, 'Único'), verificada: true }], '2026-11-18');
  assert.equal(m.ok, true);
  assert.equal(m.rows.length, 0);
  assert.equal(m.totalMostrados, 1);
});

test('construirModeloPlaca: 0 visibles → ok:false (la UI impide este estado)', () => {
  const m = construirModeloPlaca([{ ...ITEM(1, 'A'), oculto: true }], '2026-11-18');
  assert.equal(m.ok, false);
});

test('construirModeloPlaca: verificada false si algún visible no lo está', () => {
  const items = [{ ...ITEM(1, 'A'), verificada: true }, { ...ITEM(2, 'B'), verificada: false }];
  assert.equal(construirModeloPlaca(items, '2026-11-18').verificada, false);
});

test('itemsVisiblesCopys: sin ocultos, orden, ampliado→texto_ampliado, tope 6', () => {
  const items = Array.from({ length: 7 }, (_, i) => ({ ...ITEM(i + 1, `H${i + 1}`), id: `x${i + 1}`, icono: 'economia', ampliado: i === 0 ? '' : `Amp ${i + 1}`, oculto: i === 1 }));
  const r = itemsVisiblesCopys(items);
  assert.equal(r.length, 6);
  assert.deepEqual(r.map(i => i.id), ['x1', 'x3', 'x4', 'x5', 'x6', 'x7']);
  assert.equal(r[0].texto_ampliado, 'Resumen del hecho 1.');
  assert.equal(r[1].texto_ampliado, 'Amp 3');
  assert.equal(r[0].icono, 'economia');
});

test('validarHechoPropio: acepta año 2026 y 1000; rechaza 0999, 3000, letras', () => {
  const base = { titulo: 'San Rafael cumple 150 años', resumen: 'La ciudad celebra.', ampliado: '', icono: 'mundo' };
  assert.equal(validarHechoPropio({ ...base, año: '2026' }).ok, true);
  assert.equal(validarHechoPropio({ ...base, año: '1000' }).ok, true);
  assert.equal(validarHechoPropio({ ...base, año: '0999' }).ok, false);
  assert.equal(validarHechoPropio({ ...base, año: '3000' }).ok, false);
  assert.equal(validarHechoPropio({ ...base, año: 'abc' }).ok, false);
});

test('validarHechoPropio: faltan título/resumen o icono inválido → error', () => {
  const base = { año: '2026', resumen: 'r', icono: 'mundo' };
  assert.match(validarHechoPropio({ ...base, titulo: '  ' }).error, /título/i);
  assert.match(validarHechoPropio({ ...base, titulo: 't', resumen: '' }).error, /resumen/i);
  assert.match(validarHechoPropio({ ...base, titulo: 't', resumen: 'r', icono: 'nuclear' }).error, /icono/i);
});

test('validarHechoPropio: ampliado vacío cae al resumen; hecho normalizado', () => {
  const r = validarHechoPropio({ año: '2026', titulo: 'San Rafael 150', resumen: 'Cumple años.', ampliado: '  ', icono: 'mundo' });
  assert.equal(r.ok, true);
  assert.equal(r.hecho.ampliado, 'Cumple años.');
  assert.equal(r.hecho.icono, 'mundo');
});
```

Actualizar la línea 3 del test:

```js
import { hoyArgentina, etiquetaCategoria, normalizarPayload, extraerCopysRespuesta, construirModeloPlaca, itemsVisiblesCopys, validarHechoPropio } from './placa-model.mjs';
```

- [ ] **Step 2: Confirmar que fallan**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: FAIL — `construirModeloPlaca is not a function` (etc.).

- [ ] **Step 3: Implementar en `efemerides/placa-model.mjs`**

(a) Arriba, tras la constante ETIQUETAS:

```js
export const ICONOS_EF = ['futbol', 'deportes', 'aviacion', 'musica', 'teatro', 'politica', 'historia', 'sociedad', 'economia', 'mundo', 'canal'];
const EMOJIS_EF = { futbol: '⚽', deportes: '🏆', aviacion: '✈️', musica: '🎵', teatro: '🎭', politica: '🏛️', historia: '📜', sociedad: '🗞️', economia: '💹', mundo: '🌎', canal: '📺' };
export function emojiIconoEf(icono) {
  return EMOJIS_EF[String(icono || '').trim().toLowerCase()] || '📜';
}
```

(b) `normalizarItem` pasa a:

```js
function normalizarItem(item) {
  const icono = String(item?.icono ?? '').trim().toLowerCase();
  return {
    id: String(item?.id ?? '').trim(),
    año: String(item?.año ?? item?.anio ?? '').trim(),
    titulo: String(item?.titulo ?? '').trim(),
    resumen: String(item?.resumen ?? '').trim(),
    ampliado: String(item?.texto_ampliado ?? item?.resumen ?? '').trim(),
    icono: ICONOS_EF.includes(icono) ? icono : 'historia',
    categoria: etiquetaCategoria(item),
    verificada: item?.verificada === true,
    fuente: String(item?.fuente ?? 'Wikipedia').trim(),
  };
}
```

(c) `normalizarPayload`: agregar `items` al objeto de retorno:

```js
  const [hero, ...rows] = items;
  return {
    ok: true,
    fecha: String(raw?.meta?.fecha ?? '').trim(),
    fuente: items[0].fuente || 'Wikipedia',
    verificada: items.every(i => i.verificada),
    hero, rows, totalMostrados: items.length, total, items,
  };
```

(d) Al pie (antes de `extraerCopysRespuesta`):

```js
// La destacada es SIEMPRE el primer hecho visible: no hay heroIndex aparte.
// Con 0 visibles devuelve ok:false; la UI deshabilita OCULTAR en el último visible.
export function construirModeloPlaca(items, fecha = '') {
  const lista = Array.isArray(items) ? items : [];
  const visibles = lista.filter(i => i && !i.oculto);
  const [hero, ...rows] = visibles;
  const verificada = visibles.length > 0 && visibles.every(i => i.verificada !== false);
  return { ok: !!hero, fecha, hero: hero || null, rows, totalMostrados: visibles.length, total: lista.length, verificada };
}

export function itemsVisiblesCopys(items) {
  return (Array.isArray(items) ? items : [])
    .filter(i => i && !i.oculto)
    .slice(0, 6)
    .map(i => ({
      id: String(i.id || ''), año: String(i.año || ''),
      titulo: String(i.titulo || ''), resumen: String(i.resumen || ''),
      texto_ampliado: String(i.ampliado || i.resumen || ''),
      icono: ICONOS_EF.includes(String(i.icono || '').toLowerCase()) ? String(i.icono).toLowerCase() : 'historia',
    }));
}

export function validarHechoPropio({ año, titulo, resumen, ampliado, icono } = {}) {
  const a = String(año ?? '').trim();
  if (!/^(1[0-9]{3}|20[0-9]{2})$/.test(a)) return { ok: false, error: 'Año inválido: usá 4 dígitos entre 1000 y 2099.' };
  const t = String(titulo ?? '').trim();
  if (!t) return { ok: false, error: 'Falta el título.' };
  if (t.length > 160) return { ok: false, error: 'Título demasiado largo (máx 160).' };
  const r = String(resumen ?? '').trim();
  if (!r) return { ok: false, error: 'Falta el resumen.' };
  if (r.length > 140) return { ok: false, error: 'Resumen demasiado largo (máx 140).' };
  const am = String(ampliado ?? '').trim();
  if (am.length > 240) return { ok: false, error: 'Texto ampliado demasiado largo (máx 240).' };
  const ic = String(icono ?? '').trim().toLowerCase();
  if (!ICONOS_EF.includes(ic)) return { ok: false, error: 'Elegí un icono válido.' };
  return { ok: true, hecho: { año: a, titulo: t, resumen: r, ampliado: am || r, icono: ic } };
}
```

- [ ] **Step 4: Tests verdes**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add efemerides/placa-model.mjs efemerides/placa-model.test.mjs
git commit -m "feat(efemerides): puras de edición de placa (modelo visible, copys items, hecho propio)"
```


### Task 2: Worker — rama POST en `/placas/v2/efemerides/copys`

**Files:**
- Modify: `worker/worker.js` (sin tocar el hunk `handleVisualGenerar`, ~línea 8416)
- Test: `worker/efemerides-copys.test.mjs`

**Interfaces:**
- Consumes: `validEfemeridesDate`, `itemsCopysReparados`, ` repararAnioEfemerides`, `emojiPorIconoEf`, `EMOJOS_POR_ICONO_EF`, `DEFAULT_WA_LINKS_EF`, `WA_LINKS_KV_KEY`, `buildEfemeridesCopysPrompt`, `normalizarEfemeridesCopys`, `callGemini`, `sleep`, `jsonOk`, `jsonError`, `PLACAS_V2_EF_COPYS_CACHE_PREFIX`, `PLACAS_V2_EF_CACHE_PREFIX`, `PLACAS_V2_EF_CACHE_TTL` (todas ya en worker.js)
- Produces: `normalizarItemsEditados(items) → [{ id, año, titulo, resumen, texto_ampliado, ampliado, icono }]` (0–6, orden, año 1000–2099); `obtenerLinksWaEf(env)`; `generarCopysEf(items, date, links, env, fuente, gemini?)`; `handlePlacasV2EfemeridesCopysPost(body, env, gemini?)`; `handlePlacasV2EfemeridesCopys` ahora exported para tests (comportamiento idéntico)

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `worker/efemerides-copys.test.mjs` (y ampliar el `import { ... } from './worker.js'` de la línea 3):

```js
import {
  emojiPorIconoEf, fechaLargaEf, itemsCopysReparados,
  buildEfemeridesCopysPrompt, buildEfemeridesCopysFallback, normalizarEfemeridesCopys,
  normalizarItemsEditados, handlePlacasV2EfemeridesCopysPost, handlePlacasV2EfemeridesCopys,
} from './worker.js';

test('normalizarItemsEditados: año 2026 aceptado (a diferencia del GET), inválidos descartados', () => {
  const r = normalizarItemsEditados([
    { id: 'a', año: '2026', titulo: 'Mundial 2026', resumen: 'La sede.', texto_ampliado: '', icono: 'futbol' },
    { id: 'b', año: 'texto', titulo: 'Roto', resumen: 'Roto.' },
    { id: 'c', año: '0999', titulo: 'Viejo', resumen: 'Viejo.' },
    { id: 'd', año: '1894', titulo: 'Castagnino', resumen: 'Pintor argentino.' },
  ]);
  assert.deepEqual(r.map(i => i.id), ['a', 'd']);
});

test('normalizarItemsEditados: ampliado vacío cae a resumen; icono desconocido → historia; orden y tope 6', () => {
  const r = normalizarItemsEditados(
    Array.from({ length: 8 }, (_, i) => ({ id: `id${i}`, año: '2001', titulo: `T${i}`, resumen: `R${i}`, ampliado: '', icono: i === 0 ? 'nuclear' : 'canal' })),
  );
  assert.equal(r.length, 6);
  assert.equal(r[0].icono, 'historia');
  assert.equal(r[0].ampliado, 'R0');
  assert.equal(r[0].texto_ampliado, 'R0');
  assert.equal(r[2].icono, 'canal');
});

test('handlePlacasV2EfemeridesCopysPost: 200 con fuente "placa editada" y SIN tocar KV', async () => {
  const kv = { getCalls: 0, putCalls: 0 };
  const env = { KV: {
    get: async () => { kv.getCalls += 1; return null; },
    put: async () => { kv.putCalls += 1; },
  } };
  const gemini = async () => ({
    data: {
      whatsapp: '📅 Efemérides del 18 de noviembre\n\n⚽ 2026 — Año del hecho editado.',
      instagram: 'Gancho\n\n#MediaMendoza #Efemerides',
    },
  });
  const res = await handlePlacasV2EfemeridesCopysPost({ fecha: FECHA, items: [ITEM('2026', 'Editado', 'En 2026 pasó algo.', 'futbol')] }, env, gemini);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.meta.fuente, 'placa editada');
  assert.equal(body.meta.cached, false);
  assert.match(body.whatsapp, /\*2026\*/);
  assert.equal(kv.getCalls, 0);
  assert.equal(kv.putCalls, 0);
});

test('handlePlacasV2EfemeridesCopysPost: 0 hechos válidos → 400 sin tocar KV ni Gemini', async () => {
  const env = { KV: { get: async () => { throw new Error('no debe llamarse'); }, put: async () => {} } };
  const gemini = async () => { throw new Error('no debe llamarse'); };
  const res = await handlePlacasV2EfemeridesCopysPost({ fecha: FECHA, items: [{ año: 'x', titulo: '', resumen: '' }] }, env, gemini);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.match(body.error, /no es válida/i);
});

test('handlePlacasV2EfemeridesCopysPost: fecha inválida → 400', async () => {
  const res = await handlePlacasV2EfemeridesCopysPost({ fecha: 'no-es-fecha', items: [ITEM('2001', 'T', 'R.')] }, {}, null);
  assert.equal(res.status, 400);
});

test('GET copys: sin placa en KV → 502 (regresión de comportamiento)', async () => {
  const env = { KV: { get: async () => null, put: async () => {} } };
  const res = await handlePlacasV2EfemeridesCopys(new URL(`https://x/?fecha=${FECHA}`), env);
  assert.equal(res.status, 502);
});
```

- [ ] **Step 2: Confirmar que fallan**

Run: `node --test --test-isolation=none worker/efemerides-copys.test.mjs`
Expected: FAIL — `normalizarItemsEditados is not a function`.

- [ ] **Step 3: Implementar en `worker/worker.js`**

Insertar justo DESPUÉS del bloque `function itemsCopysReparados(...) { ... }`:

```js
const ANIO_SIMPLE_EF = /^(1[0-9]{3}|20[0-9]{2})$/;

// Items editados desde el navegador (agregar/destacar/ocultar). A diferencia
// del GET, el año se acepta 1000–2099 SIN reparar: un hecho de 2026 es válido en
// una placa editada a mano. Máximo 6, mismo contrato que la placa.
function normalizarItemsEditados(items) {
  return (Array.isArray(items) ? items : [])
    .map(item => {
      const año = String(item?.año ?? item?.anio ?? '').trim();
      const titulo = String(item?.titulo || '').trim().slice(0, 160);
      const resumen = String(item?.resumen || '').trim().slice(0, 140);
      const amplio = String(item?.texto_ampliado ?? item?.ampliado ?? '').trim().slice(0, 240);
      const iconoCrudo = String(item?.icono || '').trim().toLowerCase();
      const icono = Object.prototype.hasOwnProperty.call(EMOJOS_POR_ICONO_EF, iconoCrudo) ? iconoCrudo : 'historia';
      const texto_ampliado = amplio || resumen;
      return { id: String(item?.id || '').trim(), año, titulo, resumen, texto_ampliado, ampliado: texto_ampliado, icono };
    })
    .filter(item => item.titulo && item.resumen && ANIO_SIMPLE_EF.test(item.año))
    .slice(0, 6);
}

async function obtenerLinksWaEf(env) {
  const links = { ...DEFAULT_WA_LINKS_EF };
  if (env && env.KV) {
    try {
      const l = await env.KV.get(WA_LINKS_KV_KEY, 'json');
      if (l) { if (l.grupo) links.grupo = l.grupo; if (l.canal) links.canal = l.canal; }
    } catch {}
  }
  return links;
}

async function generarTextoGeminiCopys(prompt, env) {
  const ctrl = new AbortController();
  const geminiPromise = callGemini(prompt, env, false, true, null, { signal: ctrl.signal, deadlineMs: 40000 });
  const timeoutPromise = sleep(45000).then(() => {
    ctrl.abort();
    return { error: 'deadline 45s - IA lenta/caída', details: ['timeout global copys 45s'] };
  });
  return Promise.race([geminiPromise, timeoutPromise]);
}

async function generarCopysEf(items, date, links, env, fuente, gemini = generarTextoGeminiCopys) {
  const prompt = buildEfemeridesCopysPrompt(items, date, links);
  const r = await gemini(prompt, env);
  const copys = normalizarEfemeridesCopys(r?.data, { items, date, links });
  return { whatsapp: copys.whatsapp, instagram: copys.instagram, meta: { fecha: date, fuente, cached: false } };
}
```

Reescribir `handlePlacasV2EfemeridesCopys` para compartir la cola (comportamiento GET idéntico, incluida cache) y agregar el POST debajo:

```js
async function handlePlacasV2EfemeridesCopys(url, env) {
  const date = url.searchParams.get('fecha') || '';
  if (!validEfemeridesDate(date)) return jsonError('Fecha inválida. Usá YYYY-MM-DD.', 400);
  const cacheKey = PLACAS_V2_EF_COPYS_CACHE_PREFIX + date;
  if (env.KV) {
    try {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && cached.whatsapp && cached.instagram) {
        return jsonOk({ ...cached, meta: { ...(cached.meta || {}), cached: true } });
      }
    } catch {}
  }
  let placaPayload = null;
  if (env.KV) { try { placaPayload = await env.KV.get(PLACAS_V2_EF_CACHE_PREFIX + date, 'json'); } catch {} }
  const items = itemsCopysReparados(placaPayload?.items, date);
  if (items.length < 5) return jsonError('Esa fecha todavía no tiene placa: cargá la placa primero.', 502);
  const links = await obtenerLinksWaEf(env);
  const payload = await generarCopysEf(items, date, links, env, 'Wikipedia');
  if (env.KV) { try { await env.KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: PLACAS_V2_EF_CACHE_TTL }); } catch {} }
  return jsonOk(payload);
}

async function handlePlacasV2EfemeridesCopysPost(body, env, gemini) {
  const date = String(body?.fecha || '');
  if (!validEfemeridesDate(date)) return jsonError('Fecha inválida. Usá YYYY-MM-DD.', 400);
  const items = normalizarItemsEditados(body?.items);
  if (items.length === 0) return jsonError('La lista de hechos editados no es válida.', 400);
  const links = await obtenerLinksWaEf(env);
  const payload = await generarCopysEf(items, date, links, env, 'placa editada', gemini);
  return jsonOk(payload);
}
```

Ampliar los exports nombrados (la línea que ya exporta `emojiPorIconoEf, fechaLargaEf, itemsCopysReparados, buildEfemeridesCopysPrompt, buildEfemeridesCopysFallback, normalizarEfemeridesCopys`) para que quede:

```js
export { emojiPorIconoEf, fechaLargaEf, itemsCopysReparados, buildEfemeridesCopysPrompt, buildEfemeridesCopysFallback, normalizarEfemeridesCopys, normalizarItemsEditados, handlePlacasV2EfemeridesCopys, handlePlacasV2EfemeridesCopysPost };
```

En la sección POST del router JSON (después de la línea `if(path==="/placas/v2/generar")  return handlePlacasV2Generar(body, env);`):

```js
    if(path==="/placas/v2/efemerides/copys")        return handlePlacasV2EfemeridesCopysPost(body, env);
```

- [ ] **Step 4: Tests verdes + syntax**

Run: `node --check worker/worker.js` → `SYNTAX OK`
Run: `node --test --test-isolation=none worker/efemerides-copys.test.mjs`
Expected: PASS (los 13 originales + 6 nuevos = 19).

- [ ] **Step 5: Commit selectivo del worker**

```powershell
node C:\Users\Miguel\AppData\Local\Temp\opencode\stage-worker-copys.js
git apply --cached C:\Users\Miguel\AppData\Local\Temp\opencode\worker-copys.patch
git add worker/efemerides-copys.test.mjs
git commit -m "feat(worker): POST /placas/v2/efemerides/copys (lista editada, sin cache)"
```

NOTA: `stage-worker-copys.js` preserva los hunks de la zona copys y descarta el hunk ajeno (`handleVisualGenerar`). Verificar con `git status --short worker/` que solo aparece lo esperado antes del commit: `MM worker/worker.js` y `M  worker/efemerides-copys.test.mjs`.


### Task 3: UI «EDITAR LA PLACA» en /efemerides/ (index.html + efemerides.mjs)

**Files:**
- Modify: `efemerides/index.html`
- Modify: `efemerides/efemerides.mjs`

**Interfaces:**
- Consumes: de Task 1: `construirModeloPlaca`, `itemsVisiblesCopys`, `validarHechoPropio`, `emojiIconoEf`, `etiquetaCategoria`; `normalizarPayload(...).items`
- Produces: editor funcional (DOM: `#editorPlaca`, tarjetas `.hecho-card`, form `#formAgregar`, `#btnRestablecer`); copys con edición vía `pedirCopysPost`

- [ ] **Step 1: HTML — insertar la sección antes de `<section id="copysPanel">`**

```html
    <section id="editorPlaca" hidden>
      <div class="editor-header">
        <h2>EDITAR LA PLACA</h2>
        <span id="editorCount" class="editor-count"></span>
        <span class="editor-hint">Cambios solo en esta ventana</span>
      </div>
      <ul id="editorLista" class="editor-lista"></ul>
      <button id="btnRestablecer" type="button" class="secundario chico" hidden>RESTABLECER PLACA ORIGINAL</button>
      <form id="formAgregar" class="alta-hecho" novalidate>
        <h3>AGREGAR UN HECHO</h3>
        <div class="alta-grid">
          <label>Año <input id="altaAño" inputmode="numeric" maxlength="4" placeholder="2026" required></label>
          <label class="ancho">Título <input id="altaTitulo" maxlength="160" placeholder="Ej. San Rafael festeja sus 150 años" required></label>
          <label class="ancho">Resumen <input id="altaResumen" maxlength="140" placeholder="Qué pasó y por qué importa (1 línea)" required></label>
          <label class="ancho">Texto ampliado <span class="opcional">(opcional)</span> <input id="altaAmpliado" maxlength="240" placeholder="Si tu hecho queda destacado, va acá"></label>
          <label>Icono
            <select id="altaIcono">
              <option value="futbol">⚽ Fútbol</option>
              <option value="deportes">🏆 Deportes</option>
              <option value="aviacion">✈️ Aviación</option>
              <option value="musica">🎵 Música</option>
              <option value="teatro">🎭 Teatro</option>
              <option value="politica">🏛️ Política</option>
              <option value="historia" selected>📜 Historia</option>
              <option value="sociedad">🗞️ Sociedad</option>
              <option value="economia">💹 Economía</option>
              <option value="mundo">🌎 Mundo</option>
              <option value="canal">📺 Canal</option>
            </select>
          </label>
          <button type="submit" class="chico">AGREGAR HECHO</button>
        </div>
        <p id="altaError" class="alta-error" hidden></p>
      </form>
    </section>
```

- [ ] **Step 2: HTML — estilos (al final del `<style>`, antes de `@font-face`)**

```css
  #editorPlaca { margin-top:20px; padding-top:18px; border-top:1px solid rgba(245,241,230,.15); display:flex; flex-direction:column; gap:12px; }
  .editor-header { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
  .editor-header h2 { font-family:Oswald, sans-serif; font-weight:600; font-size:18px; letter-spacing:2px; color:var(--dorado); margin:0; }
  .editor-count { color:var(--crema); font-size:13px; letter-spacing:1px; }
  .editor-hint { color:var(--atenuado); font-size:12px; }
  .editor-lista { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
  .hecho-card { display:flex; justify-content:space-between; align-items:center; gap:12px; border:1px solid rgba(245,241,230,.18); border-radius:6px; padding:10px 12px; }
  .hecho-card.oculto { opacity:.45; }
  .hecho-info { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .hecho-linea { font-weight:600; font-size:14px; }
  .hecho-linea .anio { color:var(--dorado); font-family:Oswald, sans-serif; margin:0 6px; }
  .hecho-resumen { color:var(--atenuado); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hecho-acciones { display:flex; gap:8px; align-items:center; flex-shrink:0; }
  button.chico { padding:8px 14px; font-size:12px; }
  .badge { font-size:11px; letter-spacing:1px; border-radius:3px; padding:4px 8px; font-family:Oswald, sans-serif; }
  .badge-destacada { background:var(--dorado); color:#10151f; font-weight:700; }
  .badge-oculto { border:1px solid var(--dorado); color:var(--dorado); }
  .alta-hecho { display:flex; flex-direction:column; gap:10px; border:1px dashed rgba(245,241,230,.25); border-radius:6px; padding:12px; }
  .alta-hecho h3 { margin:0; font-family:Oswald, sans-serif; font-size:13px; letter-spacing:2px; color:var(--atenuado); font-weight:600; }
  .alta-grid { display:flex; flex-wrap:wrap; gap:10px; }
  .alta-grid label { font-size:12px; display:flex; flex-direction:column; gap:6px; flex:1 1 180px; }
  .alta-grid label.ancho { flex:1 1 100%; }
  .alta-grid input, .alta-grid select { width:100%; background:#141b2b; color:var(--crema); border:1px solid rgba(245,241,230,.25); border-radius:4px; padding:9px 10px; font:inherit; font-size:14px; }
  .opcional { color:var(--atenuado); font-size:10px; }
  .alta-error { margin:0; color:#e8b4a8; font-size:13px; }
```

- [ ] **Step 3: `efemerides/efemerides.mjs` — imports, estado y helpers del editor**

Import (línea 2):
```js
import { hoyArgentina, normalizarPayload, extraerCopysRespuesta, construirModeloPlaca, itemsVisiblesCopys, validarHechoPropio, emojiIconoEf, etiquetaCategoria } from './placa-model.mjs';
```

`ui` — completar con:
```js
  editor: $('editorPlaca'), editorLista: $('editorLista'), editorCount: $('editorCount'),
  restablecer: $('btnRestablecer'), formAgregar: $('formAgregar'),
  altaAño: $('altaAño'), altaTitulo: $('altaTitulo'), altaResumen: $('altaResumen'),
  altaAmpliado: $('altaAmpliado'), altaIcono: $('altaIcono'), altaError: $('altaError'),
```

Estado nuevo junto a `let fechaActual = …`:
```js
let itemsPlaca = [];      // hechos visibles/ocultos + propios; la destacada es itemsPlaca.find(visible)[0]
let itemsOriginales = []; // snapshot del servidor para RESTABLECER
let editado = false;
let localSeq = 0;
const nuevoIdLocal = () => { localSeq += 1; return `local-${Date.now().toString(36)}-${localSeq}`; };
```

Motor de redibujado + render de tarjetas (agregar antes de `ui.reintentar...`):
```js
function redibujarPlaca() {
  const modelo = construirModeloPlaca(itemsPlaca, fechaActual);
  if (modelo.ok) dibujarPlaca(modelo);
}

function crearBoton(texto, clase, onClick) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = clase; b.textContent = texto;
  b.addEventListener('click', onClick);
  return b;
}
function crearBadge(texto, clase) {
  const s = document.createElement('span');
  s.className = `badge ${clase}`; s.textContent = texto;
  return s;
}

function renderEditor() {
  ui.editorLista.replaceChildren();
  const visibles = itemsPlaca.filter(i => !i.oculto);
  const hero = visibles[0];
  const ocultos = itemsPlaca.length - visibles.length;
  for (const item of itemsPlaca) {
    const li = document.createElement('li');
    li.className = 'hecho-card' + (item.oculto ? ' oculto' : '');
    const info = document.createElement('div');
    info.className = 'hecho-info';
    const linea = document.createElement('span');
    linea.className = 'hecho-linea';
    linea.append(document.createTextNode(`${emojiIconoEf(item.icono)}`));
    const anio = document.createElement('span');
    anio.className = 'anio'; anio.textContent = item.año;
    linea.append(anio, document.createTextNode(item.titulo));
    const resumen = document.createElement('span');
    resumen.className = 'hecho-resumen'; resumen.textContent = item.resumen;
    info.append(linea, resumen);
    const acciones = document.createElement('div');
    acciones.className = 'hecho-acciones';
    if (item.oculto) {
      acciones.append(crearBadge('OCULTO', 'badge-oculto'), crearBoton('MOSTRAR', 'secundario chico', () => onToggleOcultar(item.id)));
    } else {
      if (hero === item) acciones.append(crearBadge('★ DESTACADA', 'badge-destacada'));
      else acciones.append(crearBoton('★ DESTACAR', 'secundario chico', () => onDestacar(item.id)));
      if (visibles.length === 1) {
        const b = crearBoton('OCULTAR', 'chico', () => {}); b.disabled = true; b.title = 'La placa necesita al menos un hecho'; acciones.append(b);
      } else {
        acciones.append(crearBoton('OCULTAR', 'chico', () => onToggleOcultar(item.id)));
      }
    }
    li.append(info, acciones);
    ui.editorLista.append(li);
  }
  ui.editorCount.textContent = `${itemsPlaca.length} HECHOS${ocultos ? ` · ${ocultos} OCULTO${ocultos > 1 ? 'S' : ''}` : ''}`;
  ui.restablecer.hidden = !editado;
}

function onDestacar(id) {
  const i = itemsPlaca.findIndex(x => x.id === id);
  if (i <= 0) return;
  const [item] = itemsPlaca.splice(i, 1);
  itemsPlaca.unshift(item);
  editado = true;
  redibujarPlaca();
  renderEditor();
}
function onToggleOcultar(id) {
  const item = itemsPlaca.find(x => x.id === id);
  if (!item) return;
  const visibles = itemsPlaca.filter(x => !x.oculto);
  if (!item.oculto && visibles.length === 1) return; // guarda: la placa necesita ≥1
  item.oculto = !item.oculto;
  editado = true;
  redibujarPlaca();
  renderEditor();
}
function onRestablecer() {
  itemsPlaca = itemsOriginales.map(i => ({ ...i, oculto: false }));
  editado = false;
  ui.formAgregar.reset();
  ui.altaError.hidden = true;
  redibujarPlaca();
  renderEditor();
}
function resetearEditor() {
  itemsPlaca = []; itemsOriginales = []; editado = false;
  ui.editorLista.replaceChildren();
  ui.editorCount.textContent = '';
  ui.restablecer.hidden = true;
  ui.editorPlaca.hidden = true;
  ui.formAgregar.reset();
  ui.altaError.hidden = true;
}
```

- [ ] **Step 4: `efemerides.mjs` — cablear en `cargar()`, `cargarCopys()` y al pie**

En `cargar(fecha)`: primer línea tras `resetearCopys();` agregar `resetearEditor();`. En el camino feliz, reemplazar el bloque `const modelo = await pedir(fecha); await garantizarAssets(); dibujarPlaca(modelo); ui.fecha.value = fecha; mostrar('lista'); return;` por:

```js
      const modelo = await pedir(fecha);
      itemsOriginales = modelo.items.map(i => ({ ...i, oculto: false }));
      itemsPlaca = itemsOriginales.map(i => ({ ...i }));
      editado = false;
      await garantizarAssets();
      redibujarPlaca();
      ui.editorPlaca.hidden = false;
      renderEditor();
      ui.fecha.value = fecha;
      mostrar('lista');
      return;
```

Copys: agregar debajo de `pedirCopys` (copia del patrón existente, POST en vez de GET):

```js
async function pedirCopysPost(fecha) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_COPYS_MS);
  try {
    const res = await fetch(`${WORKER_URL}/placas/v2/efemerides/copys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({ fecha, items: itemsVisiblesCopys(itemsPlaca) }),
    });
    const raw = await res.json().catch(() => null);
    const modelo = extraerCopysRespuesta(raw);
    if (!modelo.ok) throw new Error(modelo.error);
    return modelo;
  } finally {
    clearTimeout(timer);
  }
}
```

En `cargarCopys()` cambiar la línea `const copys = await pedirCopys(fechaActual);` por:

```js
    const copys = editado ? await pedirCopysPost(fechaActual) : await pedirCopys(fechaActual);
```

Al pie, junto a los demás listeners:
```js
ui.restablecer.addEventListener('click', onRestablecer);
ui.formAgregar.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const r = validarHechoPropio({ año: ui.altaAño.value, titulo: ui.altaTitulo.value, resumen: ui.altaResumen.value, ampliado: ui.altaAmpliado.value, icono: ui.altaIcono.value });
  if (!r.ok) { ui.altaError.textContent = r.error; ui.altaError.hidden = false; return; }
  ui.altaError.hidden = true;
  itemsPlaca.push({
    id: nuevoIdLocal(), ...r.hecho,
    categoria: etiquetaCategoria({ icono: r.hecho.icono }),
    verificada: false, fuente: 'Media Mendoza', oculto: false,
  });
  ui.formAgregar.reset();
  ui.altaIcono.value = 'historia';
  editado = true;
  redibujarPlaca();
  renderEditor();
});
```

- [ ] **Step 5: Verificación mínima local**

Run: `node --check efemerides/efemerides.mjs` → debe imprimir nada y salir 0 (puede ser `&& echo OK`).
Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs` → PASS (sin cambios nuevos).

- [ ] **Step 6: Commit**

```bash
git add efemerides/index.html efemerides/efemerides.mjs
git commit -m "feat(efemerides): editor de placa (destacar/ocultar/agregar) + copys POST con la edición"
```


### Task 4: Integración — suite completa, push y spec actualizado

**Files:**
- Test run only (sin archivos nuevos)
- Modify: `docs/superpowers/specs/2026-11-14-efemerides-copys-redes-design.md` (una línea)

- [ ] **Step 1: Suite completa**

```powershell
node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs redaccion-v2/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs efemerides/placa-model.test.mjs
```
Expected: todo verde (hoy 589 → mañana más, +15 aprox.); la falla preexistente de `shared/editorial-suite.integration.test.mjs` NO se corre aquí (a propósito).

- [ ] **Step 2: Worker — node --check + estado del staging**

Run: `node --check worker/worker.js` → sin salida, exit 0.
Run: `git status --short worker/` → `MM worker/worker.js` (el hunk ajeno) — nada staged sin querer.

- [ ] **Step 3: Sincronizar spec de copys (una línea)**

En `docs/superpowers/specs/2026-11-14-efemerides-copys-redes-design.md`, Sección 3, ítem 1: cambiar «`GET /placas/v2/efemerides/copys?fecha=YYYY-MM-DD`» a «`GET` (sin edición) o `POST` con `{ fecha, items }` (placa editada, generado fresco, sin cache)». Commitear:

```bash
git add docs/superpowers/specs/2026-11-14-efemerides-copys-redes-design.md
git commit -m "docs(efemerides): spec copys anota rama POST con placa editada"
```

- [ ] **Step 4: Push**

```bash
git push origin main
```

---

### Task 5: QA navegador (stub fetch) + recordatorio de deploy

**Files:** ninguno (solo verificación manual en el navegador)

**Contexto:** la app vive en `/efemerides/` (Pages). Para probar sin pegar el worker en producción se puede abrir con el worker actual o usar el stub de fetch en la consola (la app ya tolera que copys falle — «Ruta no encontrada» es un estado conocido).

- [ ] **Step 1: Levantar un servidor local** (la página usa `import.meta.url` + wasm-less assets; conviene servir desde la raíz del repo):

```powershell
# En C:\Users\Miguel\Documents\New project
npx serve -l 8899 .
```
Abrir `http://localhost:8899/efemerides/`.

- [ ] **Step 2: QA de edición** (con DevTools → Network → Stub/Override o inyección de `fetch` via consola antes de recargar):

Payload de ejemplo para el stub del GET: `{ "ok": true, "items": [ …5-6 hechos… ], "meta": { "fecha": "2026-11-18", "fuente": "wikipedia" } }`.

Checks (en orden):
1. Carga → la placa dibuja; la sección «EDITAR LA PLACA» visible; 6 tarjetas; la primera lleva badge ★ DESTACADA; "6 HECHOS".
2. Clic ★ DESTACAR en la fila 3 → esa placa se redrawka con el nuevo héroe; badge se mueve; pie «6 HECHOS DEL DÍA».
3. OCULTAR en el héroe actual → el siguiente visible hereda destacada; badge OCULTO; contador «5 HECHOS · 1 OCULTO»; el pie de la placa dice «5 DE 6 HECHOS DEL DÍA».
4. Ocultar hasta dejar 1 visible → el botón OCULTAR del último queda deshabilitado.
5. Completar form AGREGAR (año 2026, título/resumen propios, ampliado) → AGREGAR HECHO → tarjeta nueva con DESTACAR/OCULTAR; dibuja como destacada si se pulsa ★ DESTACAR en ella.
6. Validación: año vacío → error inline visible, la placa no se rompe.
7. OCULTAR ocultos → RESTABLECER PLACA ORIGINAL visible solo con cambios → clic → vuelve todo al estado servidor.
8. Cambio de fecha → editor desaparece; fecha nueva carga limpia.
9. COPYS REDES con edición activa → en Network se ve POST a `/placas/v2/efemerides/copys` con `{ fecha, items }` (sin ocultos, con el agregado). Con stub de POST → panel muestra copys de la edición. Sin edición → GET como hoy.
10. Error POST simulado (p.ej. 500) → «La placa sigue disponible.» + REINTENTAR; la placa editada sigue intacta.

- [ ] **Step 3: Recordatorio al usuario (obligatorio)**

Avisar: pegar `worker/worker.js` completo en el dashboard de Cloudflare Workers (`mm-herramientas-worker` → Edit → Deploy). Sin ese deploy, la edición visual funciona igual (PNG/canvas), pero los copys salen de la placa KV sin editar por GET. Con deploy, quedan el fix de antigüedades, las negritas y la rama POST de copys.

---

## Self-review contra el spec

- Alcance (destscar/ocultar/agregar, sin persistencia, copys POST): Tasks 1–3 ✓
- UI spec sección 3 (tarjetas, destacada=primera visible, guarda último visible, RESTABLECER, cambio de fecha resetea): Task 3 ✓
- Arquitectura sección 2 (modelo interno { fecha, items }, sin heroIndex, N DE M, 0-visible ok:false): Task 1 ✓
- Worker sección 4 (POST sin KV, `normalizarItemsEditados` sin reparar años, `obtenerLinksWaEf`, `generarCopysEf` con fallback preservado, GET intacto): Task 2 ✓
- Tests sección 7: Task 1 + Task 2 ✓ (spec pedía "KV.get/put no llamados" en POST → cubierto por espías)
- Casos borde sección 8 (último visible, ocultar la destacada→hereda, ampliado→resumen, fecha reset, 2026): Tasks 1–3 ✓
- Criterios de aceptación sección 9: Task 5 verifica 1–5 y 8–10 ✓; punto 6 (suite/verde/deploy manual): Tasks 2–5 ✓

## Convenciones de commit del repo

- Mensajes: español, `feat|fix|docs(scope): descripción`.
- Nunca `git add -A` / `git add worker/worker.js` a secas: worker va por hunks con `stage-worker-copys.js` / `git apply --cached`.
- `visual-suite/*`, `docs/**` ajenos, `.wrangler/*`, `opencode.json`: intactos.

