# Copys WhatsApp + Instagram para /efemerides/ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bajo demanda (botón "COPYS REDES" en `/efemerides/`), generar el copy de WhatsApp (lista de hechos + CTA comunidad + firma) y de Instagram (caption + hashtags + CTA) desde el payload cacheado de la placa, con IA + fallback determinista.

**Architecture:** Nuevo endpoint `GET /placas/v2/efemerides/copys` en `worker/worker.js` que reusa el payload de la placa cacheado en KV (reparando años viejos), llama a Gemini, normaliza con `normalizeWhatsappCopy` + `WA_FIRMA` + `buildCtaComunidad`, y cachea 24h. El cliente (`efemerides/`) pide los copys y los muestra en un panel de 2 bloques con COPIAR por bloque.

**Tech Stack:** HTML/CSS/JS vanilla (sin build), Cloudflare Worker single-file (sin `import`), Node 24 `node --test`, KV.

## Global Constraints

- Worker: archivo único `worker/worker.js`, sin `import`; se despliega pegándolo completo en el dashboard de Cloudflare (no wrangler). No normalices EOL ni reformatees el worker.
- Sin tocar `worker/whatsapp-copy.mjs` (su contraparte inline ya tiene `WA_FIRMA`, `buildCtaComunidad`, `normalizeWhatsappCopy`).
- Copys solo con datos del payload cacheado de la placa; nada inventado; emoji por hecho desde mapa `icono → emoji` (determinista, no lo elige la IA).
- Firma WhatsApp canónica = `buildCtaComunidad(links)` + `WA_FIRMA`; `links` de KV `config:wa_links` con default `https://mediamendoza.pages.dev/grupo` y `.../canal`.
- Cache KV: `placas-v2:efemerides:v5:copys:<fecha>`, TTL `PLACAS_V2_EF_CACHE_TTL` (24h); solo se cachea respuesta exitosa; fallos no se cachean.
- <5 items válidos tras reparo → `jsonError(..., 502)` sin cachear.
- Cliente: timeout 55s, sin auto-reintento (REINTENTAR manual); la placa nunca depende de los copys.
- Copy en español rioplatense; Instagram ≤ 2200 chars con 8–12 hashtags; WhatsApp sin URLs propias ni hashtags.
- Tests: `node --test --test-isolation=none <archivos>` (globs los expande Node, no PowerShell).
- No commitear cambios ajenos preexistentes (`visual-suite/*`, `opencode.json`, `.wrangler/`, docs sueltos): hacé `git add` selectivo.

---

### Task 1: Helpers puros del worker (emoji mapa, prompt, fallback, normalización)

**Files:**
- Modify: `worker/worker.js` (después de `repararAnioEfemerides`, ~línea 8775; y export line ~21)
- Create: `worker/efemerides-copys.test.mjs`

**Interfaces:**
- Consumes: `repararAnioEfemerides(item, date)` (ya existe y está exportada), `WA_FIRMA`, `buildCtaComunidad(links)`, `normalizeWhatsappCopy(mensaje, {tipo,url,links})` (todas inline en worker.js).
- Produces (exportar): `emojiPorIconoEf`, `fechaLargaEf`, `itemsCopysReparados`, `buildEfemeridesCopysPrompt`, `buildEfemeridesCopysFallback`, `normalizarEfemeridesCopys`.

- [ ] **Step 1: Escribir los tests que fallan** — `worker/efemerides-copys.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emojiPorIconoEf, fechaLargaEf, itemsCopysReparados,
  buildEfemeridesCopysPrompt, buildEfemeridesCopysFallback, normalizarEfemeridesCopys,
} from './worker.js';

const FECHA = '2026-11-14';
const LINKS = { grupo: 'https://mediamendoza.pages.dev/grupo', canal: 'https://mediamendoza.pages.dev/canal' };
const ITEM = (año, titulo, resumen, icono = 'historia') => ({ año, anio: año, titulo, resumen, texto_ampliado: '', icono, categoria: 'historia' });

test('emojiPorIconoEf: mapea iconos conocidos y cae en 📜', () => {
  assert.equal(emojiPorIconoEf('futbol'), '⚽');
  assert.equal(emojiPorIconoEf('musica'), '🎵');
  assert.equal(emojiPorIconoEf('otro'), '📜');
});

test('fechaLargaEf: 2026-11-14 → 14 de noviembre', () => {
  assert.equal(fechaLargaEf('2026-11-14'), '14 de noviembre');
});

test('itemsCopysReparados: repara años dañados y descarta sin año verificable', () => {
  const r = itemsCopysReparados([
    ITEM('2026', 'Hecho uno', 'Ocurrió en 1894.'),
    ITEM('2026', 'Sin año', 'Sin año en el texto.'),
    ITEM('1913', 'Hecho dos', 'Arquitecto argentino.'),
  ], FECHA);
  assert.equal(r.length, 2);
  assert.equal(r[0].año, '1894');
  assert.equal(r[1].año, '1913');
});

test('buildEfemeridesCopysPrompt: incluye fecha larga, hechos con emoji y prohibición de inventar', () => {
  const items = itemsCopysReparados([ITEM('2026', 'Hecho', 'Ocurrió en 1900.')], FECHA);
  const p = buildEfemeridesCopysPrompt(items, FECHA, LINKS);
  assert.match(p, /14 de noviembre/);
  assert.match(p, /📜 1900 — Ocurrió en 1900\./);
  assert.match(p, /sin inventar/);
  assert.match(p, /"whatsapp"/);
});

test('buildEfemeridesCopysFallback: lista con emojis, CTA comunidad y firma; sin año de la fecha', () => {
  const items = itemsCopysReparados([
    ITEM('2026', 'Hecho uno', 'Ocurrió en 1894.'), ITEM('2026', 'Hecho dos', 'Sucedió en 1913.'),
    ITEM('2026', 'Hecho tres', 'Pasó en 2002.'), ITEM('2026', 'Hecho cuatro', 'Fue en 1784.'),
    ITEM('2026', 'Hecho cinco', 'Rodó en 2021.'),
  ], FECHA);
  const r = buildEfemeridesCopysFallback(items, FECHA, LINKS);
  assert.match(r.whatsapp, /1894 — Ocurrió en 1894\./);
  assert.doesNotMatch(r.whatsapp, /2026 —/);
  assert.match(r.whatsapp, /¡Sumate a nuestra comunidad!/);
  assert.match(r.whatsapp, /Mediamendoza - Noticias confiables del sur mendocino/);
  assert.match(r.instagram, /#MediaMendoza/);
  assert.doesNotMatch(r.instagram, /2026/);
});

test('normalizarEfemeridesCopys: salida de la IA pasa, quita URLs y agrega firma canónica', () => {
  const items = itemsCopysReparados([ITEM('1894', 'Hecho', 'Nació en 1894.')], FECHA);
  const r = normalizarEfemeridesCopys({
    whatsapp: '📅 Efemérides del 14 de noviembre\n\n⚽ 1894 — Nació.\nhttps://mediamendoza.pages.dev/grupo',
    instagram: '¿Qué pasó un 14 de noviembre?\nhttps://ejemplo.com/x\n#MediaMendoza #Efemerides',
  }, { items, date: FECHA, links: LINKS });
  assert.match(r.whatsapp, /⚽ 1894 — Nació\./);
  assert.doesNotMatch(r.whatsapp, /^https?:\/\/\S+$/m);
  assert.match(r.whatsapp, /\*📰 Mediamendoza - Noticias confiables del sur mendocino\*/);
  assert.doesNotMatch(r.instagram, /https?:\/\//);
});

test('normalizarEfemeridesCopys: IA vacía o rota → fallback determinista', () => {
  const items = itemsCopysReparados([ITEM('2026', 'Hecho', 'Ocurrió en 1894.')], FECHA);
  const r = normalizarEfemeridesCopys({}, { items, date: FECHA, links: LINKS });
  assert.match(r.whatsapp, /1894 — Ocurrió en 1894\./);
  assert.match(r.instagram, /#MediaMendoza/);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `node --test --test-isolation=none worker/efemerides-copys.test.mjs`
Expected: FAIL (las funciones no existen / export faltante).

- [ ] **Step 3: Implementar los helpers** — en `worker/worker.js`, justo después de `repararAnioEfemerides`:

```js
const PLACAS_V2_EF_COPYS_CACHE_PREFIX = 'placas-v2:efemerides:v5:copys:';
const EMOJOS_POR_ICONO_EF = { futbol: '⚽', deportes: '🏆', aviacion: '✈️', musica: '🎵', teatro: '🎭', politica: '🏛️', historia: '📜', sociedad: '🗞️', economia: '💹', mundo: '🌎', canal: '📺' };
const DEFAULT_WA_LINKS_EF = { grupo: 'https://mediamendoza.pages.dev/grupo', canal: 'https://mediamendoza.pages.dev/canal' };

function emojiPorIconoEf(icono) {
  return EMOJOS_POR_ICONO_EF[String(icono || '').trim().toLowerCase()] || '📜';
}

function fechaLargaEf(date) {
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const parts = String(date).split('-');
  const dia = Number(parts[2]);
  const mes = MESES[Number(parts[1]) - 1] || '';
  return dia && mes ? `${dia} de ${mes}` : '';
}

function itemsCopysReparados(items, date) {
  return (Array.isArray(items) ? items : [])
    .map(item => ({ ...item, año: repararAnioEfemerides(item, date) }))
    .filter(item => item.titulo && item.año && item.resumen)
    .slice(0, 6);
}

function buildEfemeridesCopysPrompt(items, date, links) {
  const hechos = items.map(i => `${emojiPorIconoEf(i.icono)} ${i.año} — ${i.resumen || i.titulo}`).join('\n');
  return `Sos community manager de Media Mendoza, diario digital del sur de Mendoza, Argentina.
Escribí los copys para acompañar la placa de efemérides del ${fechaLargaEf(date)}. Usá SOLO estos hechos, en este orden, sin inventar nada:

${hechos}

REGLAS:
- Español rioplatense, tono didáctico, sin inventar datos ni años.
- "whatsapp": encabezado "📅 Efemérides del ${fechaLargaEf(date)}" y una línea por hecho con el emoji provisto. NO agregues firma, CTA, enlaces ni hashtags: el sistema los agrega.
- "instagram": primera línea gancho con el hecho principal; 3 a 5 líneas con los hechos; cierre con "La placa completa, más arriba 👆" y "👉 Leé más en mediamendoza.com"; última línea con un punto y 8 a 12 hashtags empezando por #MediaMendoza #Efemerides.
- Máximo 2200 caracteres por copy.

Respondé SOLO JSON válido: {"whatsapp":"...","instagram":"..."}`;
}

function buildEfemeridesCopysFallback(items, date, links) {
  const lineas = items.map(i => `${emojiPorIconoEf(i.icono)} ${i.año} — ${i.resumen || i.titulo}`).join('\n');
  const cuerpoIg = items.slice(0, 3).map(i => `${i.año}: ${i.resumen || i.titulo}`).join('; ');
  const cta = buildCtaComunidad(links);
  const whatsapp = `📅 Efemérides del ${fechaLargaEf(date)}\n\n${lineas}\n\n${cta}${cta ? '\n\n' : ''}${WA_FIRMA}`.trim();
  const instagram = `📅 ¿Qué pasó un ${fechaLargaEf(date)}? ${cuerpoIg}.\n\nLa placa completa, más arriba 👆\n👉 Leé más en mediamendoza.com\n.\n#MediaMendoza #Efemerides #HistoriaArgentina #Mendoza #HoyEnLaHistoria #Historia #Argentina #SurMendocino`;
  return { whatsapp, instagram };
}

function normalizarEfemeridesCopys(data, { items, date, links }) {
  const fb = () => buildEfemeridesCopysFallback(items, date, links);
  let whatsapp = String(data?.whatsapp || '').trim().slice(0, 1500);
  whatsapp = whatsapp.replace(/^https?:\/\/\S+$/gm, '').replace(/^www\.\S+$/gm, '').trim();
  let instagram = String(data?.instagram || '').trim().replace(/\n{3,}/g, '\n\n').slice(0, 2200);
  if (!whatsapp || !instagram) return fb();
  try { whatsapp = normalizeWhatsappCopy(whatsapp, { tipo: 'grupo', url: '', links }); } catch { return fb(); }
  instagram = instagram.replace(/https?:\/\/\S+/g, '').replace(/www\.\S+/g, '').replace(/\n{3,}/g, '\n\n').trim();
  if (!/(^|\s)#\S+/.test(instagram)) instagram += '\n\n#MediaMendoza #Efemerides #HistoriaArgentina #Mendoza #HoyEnLaHistoria #Historia #Argentina #SurMendocino';
  return { whatsapp, instagram };
}
```

Notas: `WA_FIRMA`, `buildCtaComunidad`, `normalizeWhatsappCopy` ya existen inline en worker.js (líneas ~6056/~6124/~6131). `normalizeWhatsappCopy` con `url:''` no agrega enlaces (`desduplicarUrlNota` corta con url vacía) y elimina líneas de comunidad/firma para reemplazarlas por las canónicas.

- [ ] **Step 4: Agregar el export** — después de `export { repararAnioEfemerides };` (línea ~21):

```js
export { emojiPorIconoEf, fechaLargaEf, itemsCopysReparados, buildEfemeridesCopysPrompt, buildEfemeridesCopysFallback, normalizarEfemeridesCopys };
```

- [ ] **Step 5: Correr los tests**

Run: `node --test --test-isolation=none worker/efemerides-copys.test.mjs`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add worker/worker.js worker/efemerides-copys.test.mjs
git commit -m "feat(worker): helpers puros de copys efemerides (emoji mapa, prompt, fallback, normalizacion)"
```

### Task 2: Handler `/placas/v2/efemerides/copys` + ruta

**Files:**
- Modify: `worker/worker.js` (handler nuevo después de `handlePlacasV2Efemerides`, ~línea 8840 tras Task 1; ruta en el fetch único ~línea 7619)

**Interfaces:**
- Consumes: Task 1 (`itemsCopysReparados`, `buildEfemeridesCopysPrompt`, `normalizarEfemeridesCopys`, `PLACAS_V2_EF_COPYS_CACHE_PREFIX`, `DEFAULT_WA_LINKS_EF`); ya existentes: `validEfemeridesDate`, `PLACAS_V2_EF_CACHE_PREFIX`, `PLACAS_V2_EF_CACHE_TTL`, `WA_LINKS_KV_KEY`, `callGemini`, `sleep`, `jsonOk`, `jsonError`.
- Produces: `GET /placas/v2/efemerides/copys?fecha=YYYY-MM-DD` → `{ok:true, whatsapp, instagram, meta:{fecha, fuente, cached}}` o `{ok:false, error}` con status 400/502.

- [ ] **Step 1: Agregar el handler** — después del cierre de `handlePlacasV2Efemerides`:

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
  const links = { ...DEFAULT_WA_LINKS_EF };
  try {
    const l = await env.KV.get(WA_LINKS_KV_KEY, 'json');
    if (l) { if (l.grupo) links.grupo = l.grupo; if (l.canal) links.canal = l.canal; }
  } catch {}
  const prompt = buildEfemeridesCopysPrompt(items, date, links);
  const ctrl = new AbortController();
  const geminiPromise = callGemini(prompt, env, false, true, null, { signal: ctrl.signal, deadlineMs: 40000 });
  const timeoutPromise = sleep(45000).then(() => { ctrl.abort(); return ({ error: 'deadline 45s - IA lenta/caída', details: ['timeout global copys 45s'] }); });
  const r = await Promise.race([geminiPromise, timeoutPromise]);
  const copys = normalizarEfemeridesCopys(r?.data, { items, date, links });
  const payload = { whatsapp: copys.whatsapp, instagram: copys.instagram, meta: { fecha: date, fuente: 'Wikipedia', cached: false } };
  if (env.KV) { try { await env.KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: PLACAS_V2_EF_CACHE_TTL }); } catch {} }
  return jsonOk(payload);
}
```

- [ ] **Step 2: Agregar la ruta** — en el fetch único, inmediatamente después de la línea `if(path==="/placas/v2/efemerides") ...`:

```js
      if(path==="/placas/v2/efemerides/copys")      return handlePlacasV2EfemeridesCopys(url, env);
```

(La comparación es de string exacto: no colisiona con `/placas/v2/efemerides`.)

- [ ] **Step 3: Verificar sintaxis y suite**

Run: `node --check worker/worker.js` → sin salida (OK).
Run: `node --test --test-isolation=none worker/efemerides-copys.test.mjs` → PASS (7 tests).
Nota: el handler aún no se puede llamar end-to-end desde el test (requiere KV + Gemini); su lógica vive en los helpers ya testeados. El QA real es el navegador + deploy (Task 6).

- [ ] **Step 4: Commit**

```bash
git add worker/worker.js
git commit -m "feat(worker): GET /placas/v2/efemerides/copys (lee payload cacheado, IA + fallback, cache 24h)"
```

### Task 3: `extraerCopysRespuesta` en el modelo cliente

**Files:**
- Modify: `efemerides/placa-model.mjs` (export nuevo al final del archivo)
- Test: `efemerides/placa-model.test.mjs` (3 tests nuevos al final)

**Interfaces:**
- Consumes: nada (función pura).
- Produces: `extraerCopysRespuesta(raw)` → `{ ok: true, whatsapp, instagram }` | `{ ok: false, error }`.

- [ ] **Step 1: Escribir los tests que fallan** — al final de `efemerides/placa-model.test.mjs`:

```js
import { extraerCopysRespuesta } from './placa-model.mjs'; // agregar al import existente arriba

test('extraerCopysRespuesta: ok con ambos textos recortados', () => {
  const r = extraerCopysRespuesta({ ok: true, whatsapp: '  📅 WA  ', instagram: '  IG  ', meta: { fecha: '2026-11-14' } });
  assert.equal(r.ok, true);
  assert.equal(r.whatsapp, '📅 WA');
  assert.equal(r.instagram, 'IG');
});

test('extraerCopysRespuesta: error del servidor se pasa tal cual', () => {
  const r = extraerCopysRespuesta({ ok: false, error: 'Esa fecha todavía no tiene placa' });
  assert.equal(r.ok, false);
  assert.match(r.error, /todavía no tiene placa/);
});

test('extraerCopysRespuesta: copys vacíos o sin meta → error legible', () => {
  assert.equal(extraerCopysRespuesta({ ok: true, whatsapp: '', instagram: 'x' }).ok, false);
  assert.equal(extraerCopysRespuesta(null).ok, false);
});
```

- [ ] **Step 2: Correr y verificar que falle**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: FAIL (extraerCopysRespuesta no existe).

- [ ] **Step 3: Implementar** — al final de `efemerides/placa-model.mjs`:

```js
export function extraerCopysRespuesta(raw) {
  if (!raw || raw.ok !== true) {
    const delServidor = String(raw?.error || '').trim();
    return { ok: false, error: delServidor || 'La respuesta del servicio no es válida.' };
  }
  const whatsapp = String(raw.whatsapp || '').trim();
  const instagram = String(raw.instagram || '').trim();
  if (!whatsapp || !instagram) return { ok: false, error: 'El servicio no devolvió los copys.' };
  return { ok: true, whatsapp, instagram };
}
```

- [ ] **Step 4: Correr y verificar que pase**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: PASS (20 tests: 17 existentes + 3 nuevos).

- [ ] **Step 5: Commit**

```bash
git add efemerides/placa-model.mjs efemerides/placa-model.test.mjs
git commit -m "feat(efemerides): extraerCopysRespuesta (modelo puro del panel de copys)"
```

### Task 4: HTML — botón "COPYS REDES" + panel

**Files:**
- Modify: `efemerides/index.html`

**Interfaces:**
- Consumes: nada.
- Produces (ids que usa Task 5): `btnCopys`, `copysPanel`, `copysTitulo`, `copysWhats`, `copysIg`, `btnCopiarWhats`, `btnCopiarIg`, `copysError`, `btnCopysReintentar`.

- [ ] **Step 1: Botón** — en `.acciones` (línea ~55), después de `btnDescargar`:

```html
        <button id="btnCopys" type="button" class="secundario" disabled>COPYS REDES</button>
```

- [ ] **Step 2: Panel** — dentro de `#placaLista`, después del cierre de `.controles` (antes de `</section>`):

```html
    <section id="copysPanel" hidden>
      <h2 id="copysTitulo">COPYS PARA REDES</h2>
      <div class="copys-grid" id="copysGrid">
        <div class="copys-bloque">
          <h3>WHATSAPP</h3>
          <textarea id="copysWhats" readonly rows="12" aria-label="Copy de WhatsApp"></textarea>
          <button id="btnCopiarWhats" type="button" class="secundario">COPIAR</button>
        </div>
        <div class="copys-bloque">
          <h3>INSTAGRAM</h3>
          <textarea id="copysIg" readonly rows="12" aria-label="Copy de Instagram"></textarea>
          <button id="btnCopiarIg" type="button" class="secundario">COPIAR</button>
        </div>
      </div>
      <p id="copysError" class="copys-error" hidden></p>
      <button id="btnCopysReintentar" type="button" class="secundario" hidden>REINTENTAR</button>
    </section>
```

- [ ] **Step 3: Estilos** — antes de `@font-face` en el `<style>`:

```css
  #copysPanel { margin-top:24px; display:flex; flex-direction:column; gap:12px; }
  #copysPanel h2 { font-family:Oswald, sans-serif; font-weight:600; font-size:18px; letter-spacing:2px; color:var(--dorado); margin:0; }
  .copys-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width:820px) { .copys-grid { grid-template-columns:1fr; } }
  .copys-bloque { display:flex; flex-direction:column; gap:8px; }
  .copys-bloque h3 { margin:0; font-family:Oswald, sans-serif; font-weight:600; font-size:13px; letter-spacing:2px; color:var(--atenuado); }
  .copys-bloque textarea { background:#141b2b; color:var(--crema); border:1px solid rgba(245,241,230,.25); border-radius:4px; padding:10px; font:inherit; font-size:14px; line-height:1.5; min-height:160px; resize:vertical; }
  .copys-error { color:#e8b4a8; margin:0; font-size:14px; }
```

- [ ] **Step 4: Commit**

```bash
git add efemerides/index.html
git commit -m "feat(efemerides): boton COPYS REDES y panel de dos bloques (WA + IG)"
```

### Task 5: Wiring cliente en `efemerides.mjs`

**Files:**
- Modify: `efemerides/efemerides.mjs`

**Interfaces:**
- Consumes: `extraerCopysRespuesta` (Task 3), ids del HTML (Task 4), `etiquetaFecha` (ya existe).
- Produce: flujo completo botón → panel → COPIAR; reset al cambiar fecha.

- [ ] **Step 1: Import** — línea 2:

```js
import { hoyArgentina, normalizarPayload, extraerCopysRespuesta } from './placa-model.mjs';
```

- [ ] **Step 2: Estado + timeout** — agregar constante y extender `ui`:

```js
const TIMEOUT_COPYS_MS = 55000;
```

```js
const ui = {
  cargando: $('estadoCargando'), error: $('estadoError'), lista: $('placaLista'),
  msgError: $('mensajeError'), reintentar: $('btnReintentar'), descargar: $('btnDescargar'),
  copiar: $('btnCopiar'), fecha: $('fechaInput'), canvas: $('placa'),
  copys: $('btnCopys'), copysPanel: $('copysPanel'), copysTitulo: $('copysTitulo'),
  copysGrid: $('copysGrid'),
  copysWhats: $('copysWhats'), copysIg: $('copysIg'),
  copiarWhats: $('btnCopiarWhats'), copiarIg: $('btnCopiarIg'),
  copysError: $('copysError'), copysReintentar: $('btnCopysReintentar'),
};
```

- [ ] **Step 3: Botón deshabilitado fuera de `lista`** — en `mostrar()`:

```js
  ui.copys.disabled = cual !== 'lista';
```

- [ ] **Step 4: Funciones** — después de `copiarPNG`:

```js
function ocultarCopysError() {
  ui.copysError.hidden = true;
  ui.copysReintentar.hidden = true;
  ui.copysGrid.hidden = false;
}

function resetearCopys() {
  ui.copysPanel.hidden = true;
  ocultarCopysError();
  ui.copys.textContent = 'COPYS REDES';
  ui.copysWhats.value = '';
  ui.copysIg.value = '';
}

async function pedirCopys(fecha) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_COPYS_MS);
  try {
    const res = await fetch(`${WORKER_URL}/placas/v2/efemerides/copys?fecha=${encodeURIComponent(fecha)}`, { signal: ctrl.signal });
    const raw = await res.json().catch(() => null);
    const modelo = extraerCopysRespuesta(raw);
    if (!modelo.ok) throw new Error(modelo.error);
    return modelo;
  } finally {
    clearTimeout(timer);
  }
}

let feedbackCopiosTimer = null;
function feedbackCopiarBoton(boton, texto) {
  boton.textContent = texto;
  clearTimeout(feedbackCopiosTimer);
  feedbackCopiosTimer = setTimeout(() => { boton.textContent = 'COPIAR'; }, 2000);
}

async function copiarTexto(boton, texto) {
  try {
    if (!navigator.clipboard?.write) { feedbackCopiarBoton(boton, 'COPIAR NO DISPONIBLE'); return; }
    await navigator.clipboard.writeText(texto);
    feedbackCopiarBoton(boton, '¡COPIADO!');
  } catch {
    feedbackCopiarBoton(boton, 'NO SE PUDO COPIAR');
  }
}

async function cargarCopys() {
  ocultarCopysError();
  ui.copys.disabled = true;
  ui.copys.textContent = 'GENERANDO…';
  try {
    const copys = await pedirCopys(fechaActual);
    ui.copysWhats.value = copys.whatsapp;
    ui.copysIg.value = copys.instagram;
    ui.copysTitulo.textContent = `COPYS PARA REDES — ${etiquetaFecha(fechaActual)}`;
    ui.copysGrid.hidden = false;
    ocultarCopysError();
    ui.copysPanel.hidden = false;
    ui.copys.textContent = 'COPYS REDES';
    ui.copys.disabled = false;
  } catch (err) {
    const msg = err?.name === 'AbortError'
      ? 'La respuesta tardó demasiado. Reintentá.'
      : (err?.name === 'TypeError' || err?.message === 'Failed to fetch'
          ? 'No se pudo conectar con el servicio. Reintentá.'
          : (err?.message || 'No se pudieron generar los copys.'));
    ui.copys.textContent = 'REINTENTAR';
    ui.copys.disabled = false;
    ui.copysGrid.hidden = true;
    ui.copysError.textContent = `${msg} La placa sigue disponible.`;
    ui.copysError.hidden = false;
    ui.copysReintentar.hidden = false;
    ui.copysPanel.hidden = false;
  }
}
```

- [ ] **Step 5: Reset al cargar placa** — primer línea de `cargar(fecha)`:

```js
async function cargar(fecha) {
  resetearCopys();
  mostrar('cargando');
```

- [ ] **Step 6: Listeners** — junto a los existentes:

```js
ui.copys.addEventListener('click', cargarCopys);
ui.copysReintentar.addEventListener('click', cargarCopys);
ui.copiarWhats.addEventListener('click', () => copiarTexto(ui.copiarWhats, ui.copysWhats.value));
ui.copiarIg.addEventListener('click', () => copiarTexto(ui.copiarIg, ui.copysIg.value));
```

- [ ] **Step 7: Sintaxis + tests**

Run: `node --check efemerides/efemerides.mjs` → sin salida.
Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs` → PASS (20 tests).

- [ ] **Step 8: Commit**

```bash
git add efemerides/efemerides.mjs
git commit -m "feat(efemerides): panel de copys WA+IG bajo demanda (fetch 55s, COPIAR por bloque, reset por fecha)"
```

### Task 6: Verificación completa + QA en navegador

**Files:** ninguno (solo verificación y commits finales).

- [ ] **Step 1: Sintaxis del worker**

Run: `node --check worker/worker.js` → sin salida.

- [ ] **Step 2: Suite completa**

Run (PowerShell, globs de Node):

```powershell
node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs redaccion-v2/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs efemerides/placa-model.test.mjs
```

Expected: PASS (hoy 573 tests; con Task 1 suman 7 y con Task 3 suman 3 → 583).

- [ ] **Step 3: QA en navegador**

1. Abrir `http://127.0.0.1:8790/efemerides/` (servidor local sigue vivo en el puerto 8790; si no, servir la raíz del repo y usar `/efemerides/`).
2. Placa lista (0 clics) → botón **COPYS REDES** habilitado.
3. Clic COPYS REDES → botón "GENERANDO…" → aparece el panel debajo de la placa con fecha larga en el título.
4. Bloque WHATSAPP: líneas `📅 Efemérides del …`, una línea por hecho con emoji y año real, CTA comunidad (`¡Sumate a nuestra comunidad!`) y firma `📰 Mediamendoza - Noticias confiables del sur mendocino`.
5. Bloque INSTAGRAM: gancho + hechos + `👉 Leé más en mediamendoza.com` + hashtags al final.
6. COPIAR de cada bloque → feedback "¡COPIADO!" (si el permiso de portapapeles está denegado en el harness, verificar con stub como en sesiones previas).
7. Cambiar la fecha en el selector → el panel se oculta, el botón vuelve a "COPYS REDES".
8. Bloquear la red (DevTools offline o matar el server) → COPYS REDES muestra error + REINTENTAR; la placa sigue dibujada.
9. Screenshots para evidencia.

Nota: hasta el deploy del worker, el endpoint `/copys` no existe en producción → el botón muestra "No se pudo conectar con el servicio…" / mensaje 404/502 del worker. Es esperable; la placa queda intacta. Para probar el flujo completo antes del deploy, levantá un mock local (stub de `fetch` en el navegador) o hacé primero el deploy del worker (Step 5) y después el QA vivo.

- [ ] **Step 4: Commit final si quedó algo suelto**

`git status --short` → solo archivos commiteados en Tasks 1–5 + cambios ajenos intactos.

- [ ] **Step 5: Push + aviso de deploy manual**

```bash
git push origin main
```

Push a main → Pages sirve la app. **Importante:** el endpoint `/copys` solo existe cuando pegues `worker/worker.js` completo en el dashboard de Cloudflare (Workers → mm-herramientas-worker → Editar → pegar → Deploy). Sin ese paso el botón muestra error con REINTENTAR y la placa sigue funcionando.

- [ ] **Step 6: Checklist de salida**

- [ ] `node --check worker/worker.js` OK
- [ ] Suite completa verde
- [ ] QA navegador: botón habilitado, panel con 2 bloques, COPIAR con feedback, reset por fecha, error offline con REINTENTAR
- [ ] Worker pegado en dashboard (paso del usuario; pedirlo al final y recordarlo)
- [ ] Spec actualizada si hubo desviaciones (editar `docs/superpowers/specs/2026-11-14-efemerides-copys-redes-design.md`)

## Spec coverage

- §2 Flujo/UX → Tasks 4-5 · §3 Endpoint → Tasks 1-2 · §4 Contenido → Task 1 · §5 UI → Tasks 4-5 · §6 Fallos → Tasks 1-5 (normalizador, fallback, REINTENTAR, 502 sin placa) · §7 Archivos → Tasks 1-6 · §8 Fuera de scope → no se implementa nada de eso · §9 Deploy → Task 6 Step 5 · §10 Verificación → Task 6.

