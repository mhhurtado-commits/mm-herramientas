# Panel «Candidatas TyC» en /efemerides/ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exponer el sincronizador TyC como panel de solo revisión dentro del editor de placa de `/efemerides/`, con endpoint propio en el worker.

**Architecture:** Ruta nueva aditiva `GET /placas/v2/efemerides/tyc` en `worker/worker.js` (inline del módulo de TyC; sin KV; pool Wikipedia es∩en + curadas). Panel HTML/CSS/JS al final de `efemerides/index.html` + `efemerides/efemerides.mjs`, solo lectura.

**Tech Stack:** Node 24 + `node --test`, Cloudflare Worker (archivo único, pegado manual en dashboard), Pages (静态 deploy desde main).

## Global Constraints

- UA propio: `MediaMendoza-Efemerides-TycSync/1.0 (+https://mediamendoza.pages.dev/)` en TODA llamada a TyC.
- Timeouts: 10s artículos TyC/AppSync, 12s Wikipedia, 6s curadas.
- Salidas TyC: NUNCA texto completo; `texto` ≤120 chars; atribución visible con link a tycsports.com en el panel.
- `RE_KW_AR_EF` del worker es la MISMA regex para alcance (no redefinirla).
- Estados: `cruzado | en-banco | candidato`. Sin KV, sin cron, sin botón «usar en placa».
- La página es interna (gate hardcodeado, sin auth backend): la ruta expone metadatos públicos TyC, nada editorial.
- `node --check worker/worker.js` debe pasar (Node 24 detecta ESM).

## File Structure

- Modify `worker/worker.js`: funciones inline TyC (parser/client/cotejo espejo de `tyc-efemerides/tyc-*.mjs`), handler `handlePlacasV2EfemeridesTyc`, registro de ruta GET, exports para tests.
- Create `worker/tyc-equivalencia.test.mjs`: funciones inline ≡ `tyc-efemerides/tyc-cotejo.mjs`.
- Create `worker/tyc-endpoint.test.mjs`: endpoint con fetcherStub (sin red).
- Modify `efemerides/index.html`: CSS + sección `<section id="tycPanel">` al final.
- Modify `efemerides/efemerides.mjs`: refs UI, carga, render, reset en `resetearEditor`.

---

### Task 1: Puerto inline del cotejo en el worker + test de equivalencia

**Files:**
- Modify: `worker/worker.js` — agregar bloque TyC tras `handlePlacasV2EfemeridesBanco` (antes de `handlePlacasV2EfemeridesCopys`, ~línea 9248); agregar `tokensTyc, alcanceTyc, cotejarItemsTyc, handlePlacasV2EfemeridesTyc` (handler stub llamado luego) al `export {}` de la línea 22.
- Create: `worker/tyc-equivalencia.test.mjs`

**Interfaces:**
- Consumes: `RE_KW_AR_EF` (~línea 9035, misma señal de alcance), `cortePalabraEF`, patrón de `tyc-efemerides/tyc-cotejo.mjs`.
- Produces: `tokensTyc(t) -> string[]`, `alcanceTyc(t) -> 'nacional'|'internacional'`, `cotejarItemsTyc(items, pool, curadas) -> items+{estado, alcance, fuenteEs}`; exportadas para Task 2 y tests.

- [ ] **Step 1: escribir el test de equivalencia (falla)**

```js
// worker/tyc-equivalencia.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { tokensTyc, alcanceTyc, cotejarItemsTyc } from '../worker/worker.js';
import { tokensTyc as tokensRef, alcanceTyc as alcanceRef, cotejarItemsTyc as cotejarRef } from '../tyc-efemerides/tyc-cotejo.mjs';

const CORPUS = [
  'la Vuelta de Obligado 1845',
  'Fallece el periodista y escritor argentino Pepe Eliaschev',
  'Malvinas 1982',
  'Steamboat Willie se estrena en Hollywood',
  'Nace en la localidad riojana de San Antonio el caudillo federal',
  'Muere en Buenos Aires el publicista',
  'el General San Martín cruza los Andes',
];

test('tokensTyc inline ≡ módulo de referencia', () => {
  for (const t of CORPUS) assert.deepEqual(tokensTyc(t), tokensRef(t), `tokens: ${t}`);
});
test('alcanceTyc inline ≡ módulo de referencia', () => {
  for (const t of CORPUS) assert.equal(alcanceTyc(t), alcanceRef(t), `alcance: ${t}`);
});
test('cotejarItemsTyc inline ≡ módulo de referencia', () => {
  const POOL = [
    { año: '1845', texto: 'Vuelta de Obligado: batalla del Paraná', fuenteEs: 'https://es.wikipedia.org/wiki/Vuelta_de_Obligado' },
    { año: '1958', texto: 'Daniel Brailovsky nace en Buenos Aires', fuenteEs: 'https://es.wikipedia.org/wiki/Daniel_Brailovsky' },
  ];
  const CUR = [{ año: '1845', titulo: 'Vuelta de Obligado' }];
  const TYC = [
    { año: '1845', titulo: 'Obligado', texto: 'Vuelta de Obligado' },
    { año: '2014', titulo: 'Pepe', texto: 'Fallece el periodista argentino Pepe Eliaschev' },
  ];
  assert.deepEqual(cotejarItemsTyc(TYC, POOL, CUR), cotejarRef(TYC, POOL, CUR));
});
```

- [ ] **Step 2: correr y verlo fallar**

Run: `node --test worker/tyc-equivalencia.test.mjs`
Expected: FAIL — `tokensTyc`/`alcanceTyc`/`cotejarItemsTyc` no están exportados de `worker/worker.js`.

- [ ] **Step 3: implementar bloque inline en worker/worker.js**

Insertar (antes de `async function handlePlacasV2EfemeridesCopys`):

```js
// ═══ Sincronizador TyC Sports — espejo de tyc-efemerides/tyc-cotejo.mjs. Si ese
//     módulo cambia, ACTUALIZAR ESTA COPIA (la prueba de equivalencia lo detecta). ═══
const TYC_STOPWORDS = new Set([
  'para', 'como', 'entre', 'desde', 'sobre', 'este', 'esta', 'esto', 'otro', 'otra',
  'tras', 'ante', 'bajo', 'contra', 'hasta', 'segun', 'según', 'todo', 'toda',
  'todos', 'todas', 'cada', 'mismo', 'misma', 'dentro', 'fuera', 'donde', 'cuando',
  'the', 'and', 'with', 'from', 'that', 'this', 'were', 'was', 'has', 'have', 'into',
  'their', 'after', 'before', 'during', 'about', 'than', 'then', 'also', 'which',
  'nacion', 'nación', 'pais', 'país', 'estado', 'provincia', 'república', 'republica',
  'ciudad', 'america', 'americano', 'americana', 'estadounidense', 'argentino',
  'argentina', 'española', 'espanol', 'ingles', 'inglesa', 'alemana',
  'francesa', 'italiano', 'italiana', 'brasileño', 'brasileno', 'latinoamericano',
  'latina', 'mundial', 'actor', 'actriz', 'escritor', 'escritora', 'piloto', 'atleta',
  'deportista', 'jinete', 'persona', 'presidente', 'gobernador',
]);
function normalizarTyc(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ');
}
function tokensTyc(texto) {
  return normalizarTyc(texto).split(' ').filter(t => t.length >= 4 && /^[a-z]+$/.test(t) && !TYC_STOPWORDS.has(t));
}
function tokensCompartidosTyc(a, b) {
  const ta = new Set(tokensTyc(a));
  return tokensTyc(b).some(t => ta.has(t));
}
function alcanceTyc(texto) { return RE_KW_AR_EF.test(String(texto || '')) ? 'nacional' : 'internacional'; }
function cotejarItemsTyc(items, pool = [], curadasDelDia = []) {
  return items.map(item => {
    const alcance = alcanceTyc(item.texto);
    const enPool = pool.find(p => String(p.año) === String(item.año) && tokensCompartidosTyc(item.texto, p.texto));
    const enBanco = curadasDelDia.find(c => String(c.año) === String(item.año)
      && tokensCompartidosTyc(item.titulo + ' ' + item.texto, String(c.titulo || '')));
    const estado = enPool ? 'cruzado' : (enBanco ? 'en-banco' : 'candidato');
    return { ...item, alcance, estado, fuenteEs: enPool?.fuenteEs || null };
  });
}
```

En el `export {}` (línea 22) sumar: `tokensTyc, alcanceTyc, cotejarItemsTyc`.

- [ ] **Step 4: correr y verlo pasar**

Run: `node --test worker/tyc-equivalencia.test.mjs`
Expected: PASS 3/3

- [ ] **Step 5: smoke + commit**

Run: `node --check worker/worker.js`
```bash
git add worker/worker.js worker/tyc-equivalencia.test.mjs
git commit -m "feat(efemerides): cotejo TyC inline en el worker (espejo de tyc-efemerides)"
```

---

### Task 2: Endpoint `/placas/v2/efemerides/tyc` (cliente inline + handler + ruta + tests)

**Files:**
- Modify: `worker/worker.js` — bloque TyC cliente tras el bloque del Task 1; handler `handlePlacasV2EfemeridesTyc`; export; registro GET tras la línea `if(path==="/placas/v2/efemerides/banco")`.
- Create: `worker/tyc-endpoint.test.mjs`

**Interfaces:**
- Consumes: Task 1 (`cotejarItemsTyc`, `alcanceTyc`, `tokensTyc`), `urlsEfemeridesRaw`, `parseEfemeridesWikitexto`, `emparejarEsEn`, `cortePalabraEF`, `CURADAS_EF_URL`, `validEfemeridesDate`, `jsonError`, `jsonOk`.
- Produces: `GET /placas/v2/efemerides/tyc?fecha=YYYY-MM-DD[&url=…]` → `{ fecha, articulo, obtenido, items[], meta{hechos, cruzados, enBanco, candidatos} }` o 4xx/502.

- [ ] **Step 1: escribir el test del endpoint (falla)**

```js
// worker/tyc-endpoint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePlacasV2EfemeridesTyc } from '../worker/worker.js';

const TYC_HTML = '<html><article><ul>'
  + '<li>1845 - VUELTA DE OBLIGADO. La Confederación derrota al anglo-francés.</li>'
  + '<li>Día de la Tradición (sin año)</li></ul></article></html>';
const WIKI_ES = '== Acontecimientos ==\n* [[1845]]: batalla de la [[Vuelta de Obligado]]\n';
const WIKI_EN = '== Events ==\n* [[1845]]: [[Battle of the Vuelta de Obligado]]\n';
const TYC_URL = 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-18-de-noviembre-test-id999.html';
const ORDER_DATE_18_11 = Math.floor(Date.UTC(2026, 10, 18) / 1000);

function stub({ poolEs = WIKI_ES, poolEn = WIKI_EN, curadas = { '11-18': [{ año: '1845', titulo: 'Vuelta de Obligado', resumen: '', texto_ampliado: '', icono: 'historia', fuente: 'ARCHIVO.AR' }] } } = {}) {
  return async (url) => {
    const u = String(url);
    if (u.includes('tycsports.com')) return { ok: true, status: 200, text: async () => TYC_HTML };
    if (u.includes('xke6pkwdfrhfvirq5lt5br2m4m')) {
      return { ok: true, status: 200, json: async () => ({ data: { search: { hits: [{ order_date: ORDER_DATE_18_11, title: 'Efemérides del 18 de noviembre', url: TYC_URL }] } } }) };
    }
    if (u.includes('es.wikipedia.org')) return { ok: true, status: 200, text: async () => poolEs };
    if (u.includes('en.wikipedia.org')) return { ok: true, status: 200, text: async () => poolEn };
    if (u.includes('efemerides-curadas.json')) return { ok: true, status: 200, json: async () => curadas, text: async () => JSON.stringify(curadas) };
    throw new Error('url no stubbed: ' + u);
  };
}
const req = (u) => new URL(u);

test('sin URL manual y con hit del índice → 200, item cruzado con fuenteEs', async () => {
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18'), {}, stub());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.fecha, '2026-11-18');
  assert.equal(body.articulo, TYC_URL);
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].estado, 'cruzado');
  assert.match(body.items[0].fuenteEs, /Vuelta_de_Obligado/);
  assert.equal(body.meta.hechos, 1);
  assert.equal(body.meta.cruzados, 1);
});

test('URL manual bypass → 200 aunque el índice no cubra', async () => {
  const fetcher = async (u, o) => {
    if (String(u).includes('xke6pkwdfrhfvirq5lt5br2m4m')) throw new Error('AppSync no debe llamarse con url=');
    return stub()(u, o);
  };
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18&url=' + encodeURIComponent(TYC_URL)), {}, fetcher);
  assert.equal(res.status, 200);
});

test('sin índice y sin URL manual → 502 con instrucción de pegar la URL', async () => {
  const fetcher = async (u) => {
    if (String(u).includes('xke6pkwdfrhfvirq5lt5br2m4m')) return { ok: true, status: 200, json: async () => ({ data: { search: { hits: [] } } }) };
    return stub()(u);
  };
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18'), {}, fetcher);
  assert.equal(res.status, 502);
  assert.match(await res.text(), /pegá la URL/i);
});

test('curada del día → en-banco (pool sin match)', async () => {
  const fetcher = stub({ poolEs: '== Acontecimientos ==\n', poolEn: '== Events ==\n' });
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18&url=' + encodeURIComponent(TYC_URL)), {}, fetcher);
  const body = await res.json();
  assert.equal(body.items[0].estado, 'en-banco');
});

test('parser 0 hechos → 502', async () => {
  const vacio = async (u) => String(u).includes('tycsports.com')
    ? { ok: true, status: 200, text: async () => '<html><article><ul><li>sin años</li></ul></article></html>' }
    : stub()(u);
  const res = await handlePlacasV2EfemeridesTyc(req('https://worker.test/placas/v2/efemerides/tyc?fecha=2026-11-18&url=' + encodeURIComponent(TYC_URL)), {}, vacio);
  assert.equal(res.status, 502);
});
```

Run esperado del test nuevo: FAIL — `handlePlacasV2EfemeridesTyc` no existe.

- [ ] **Step 2: correr y verlo fallar**

Run: `node --test worker/tyc-endpoint.test.mjs`
Expected: FAIL (función no exportada)

- [ ] **Step 3: implementar bloque cliente inline**

Agregar tras el bloque del Task 1:

```js
const TYC_APPSYNC_URL = 'https://xke6pkwdfrhfvirq5lt5br2m4m.appsync-api.us-east-1.amazonaws.com/graphql';
const TYC_APPSYNC_KEY = 'da2-qlssafeqdzdrldlwnzqblraswu';
const TYC_UA = { 'User-Agent': 'MediaMendoza-Efemerides-TycSync/1.0 (+https://mediamendoza.pages.dev/)' };
const ENTIDADES_HTML = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ', aacute:'á', eacute:'é', iacute:'í', oacute:'ó', uacute:'ú', uuml:'ü', ntilde:'ñ', ccedil:'ç', Aacute:'Á', Eacute:'É', Iacute:'Í', Oacute:'Ó', Uacute:'Ú', Ntilde:'Ñ', iexcl:'¡', iquest:'¿', laquo:'«', raquo:'»', ndash:'–', mdash:'—', hellip:'…' };
function decodificarEntidadesTyc(html) {
  return String(html || '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTIDADES_HTML[name] ?? m);
}
function htmlATextoTyc(html) {
  return decodificarEntidadesTyc(String(html || '')
    .replace(/<br\s*\/?>/gi, '. ').replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, '. ').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}
function parsearEfemeridesTyc(html) {
  const items = []; const lis = String(html || '').match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || []; const vistos = new Set();
  for (const li of lis) {
    const texto = htmlATextoTyc(li);
    const m = texto.match(/^\s*(\d{3,4})\s*[-–—.]\s*(.+?)\s*$/);
    if (!m) continue;
    const año = m[1]; const resto = m[2].trim(); const corte = resto.indexOf('. ');
    const titulo = (corte > 0 ? resto.slice(0, corte) : resto).trim();
    const detalle = (corte > 0 ? resto.slice(corte + 2) : '').trim();
    const full = (titulo + (detalle ? '. ' + detalle : '')).replace(/\.+$/, '');
    const clave = año + '|' + titulo.toLowerCase();
    if (vistos.has(clave)) continue; vistos.add(clave);
    items.push({ año, titulo: titulo.slice(0, 90).trim(), texto: full.trim() });
  }
  return items;
}
function resumirTyc(texto, max = 120) {
  if (!texto) return '';
  const t = String(texto).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return cortePalabraEF(t, max);
}
async function buscarEfemeridesTycWorker(fetcher = globalThis.fetch) {
  const res = await fetcher(TYC_APPSYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': TYC_APPSYNC_KEY, ...TYC_UA },
    body: JSON.stringify({ query: 'query { search(hitsPerPage: 100, searchAbout: "efemerides") { hits { order_date title url } } }' }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res?.ok) return [];
  const data = await res.json().catch(() => null);
  const hits = data?.data?.search?.hits || [];
  return hits.filter(h => typeof h.url === 'string' && h.url.includes('/efemerides/') && /efem[eé]rides/i.test(String(h.title || '')))
    .map(h => ({ fecha: new Date(h.order_date * 1000).toISOString().slice(0, 10), url: h.url }));
}
async function bajarArticuloTycWorker(url, fetcher = globalThis.fetch) {
  const res = await fetcher(url, { headers: { ...TYC_UA }, signal: AbortSignal.timeout(10000) });
  if (!res?.ok) throw new Error('TyC respondió ' + (res?.status ?? 0));
  return res.text();
}

async function handlePlacasV2EfemeridesTyc(url, env, fetcher = globalThis.fetch) {
  const date = url.searchParams.get('fecha') || '';
  if (!validEfemeridesDate(date)) return jsonError('Fecha inválida. Usá YYYY-MM-DD.', 400);
  const urlManual = (url.searchParams.get('url') || '').trim();
  let articulo = null;
  if (urlManual) articulo = urlManual;
  else {
    let hits = [];
    try { hits = await buscarEfemeridesTycWorker(fetcher); } catch { return jsonError('No se pudo consultar el índice de TyC. Reintentá o pegá la URL manualmente.', 502); }
    articulo = hits.find(h => h.fecha === date)?.url || null;
    if (!articulo) return jsonError('No hay artículo TyC para esa fecha en el índice; pegá la URL manualmente.', 502);
  }
  let html = '';
  try { html = await bajarArticuloTycWorker(articulo, fetcher); } catch (e) {
    return jsonError('No se pudo bajar el artículo de TyC (' + (e?.message || 'error') + ').', 502);
  }
  const { esUrl, enUrl, esWikiUrl, enWikiUrl } = urlsEfemeridesRaw(date);
  const UA = { 'User-Agent': 'MediaMendoza-Efemerides/1.0 (+https://mediamendoza.pages.dev/)' };
  let pool = [];
  try {
    const [esRes, enRes] = await Promise.all([
      fetcher(esUrl, { headers: UA, signal: AbortSignal.timeout(12000) }),
      fetcher(enUrl, { headers: UA, signal: AbortSignal.timeout(12000) }),
    ]);
    const esRaw = esRes?.ok ? await esRes.text() : '';
    const enRaw = enRes?.ok ? await enRes.text() : '';
    if (esRaw && enRaw) pool = emparejarEsEn(parseEfemeridesWikitexto(esRaw, 'es', esWikiUrl), parseEfemeridesWikitexto(enRaw, 'en', enWikiUrl));
  } catch {}
  let curadasDelDia = [];
  try {
    const r = await fetcher(CURADAS_EF_URL, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (r?.ok) { const data = await r.json(); curadasDelDia = Array.isArray(data?.[date.slice(5)]) ? data[date.slice(5)] : []; }
  } catch {}
  const hechos = parsearEfemeridesTyc(html);
  if (hechos.length === 0) return jsonError('El parser no detectó hechos (posible cambio de estructura de TyC).', 502);
  const items = cotejarItemsTyc(hechos, pool, curadasDelDia).map(i => ({ ...i, texto: resumirTyc(i.texto, 120) }));
  const meta = { hechos: items.length, cruzados: items.filter(i => i.estado === 'cruzado').length, enBanco: items.filter(i => i.estado === 'en-banco').length, candidatos: items.filter(i => i.estado === 'candidato').length };
  return jsonOk({ fecha: date, articulo, obtenido: new Date().toISOString(), items, meta });
}
```

Registro GET (tras `if(path==="/placas/v2/efemerides/banco")…`, línea ~7621):
```js
      if(path==="/placas/v2/efemerides/tyc")         return handlePlacasV2EfemeridesTyc(url, env);
```
Exports (línea 22) sumar tras el Task 1: `handlePlacasV2EfemeridesTyc`.

- [ ] **Step 4: correr y verlo pasar**

Run: `node --test worker/tyc-endpoint.test.mjs worker/tyc-equivalencia.test.mjs`
Expected: PASS

- [ ] **Step 5: smoke + commit**

Run: `node --check worker/worker.js`
```bash
git add worker/worker.js worker/tyc-endpoint.test.mjs
git commit -m "feat(efemerides): ruta /placas/v2/efemerides/tyc (cotejo vivo, solo revisión)"
```

---

### Task 3: Panel HTML/CSS/JS en /efemerides/

**Files:**
- Modify: `efemerides/index.html` — CSS nuevo en el `<style>` + `<section id="tycPanel">` tras `#copysPanel` (antes de `</section>` main).
- Modify: `efemerides/efemerides.mjs` — refs `uiTyc`, estado `tycItems`/`tycFiltro`, `cargarTyc()`, `renderTyc()`, `crearFilaTyc()`, listeners, reset dentro de `resetearEditor`.

**Interfaces:**
- Consumes: endpoint del Task 2 (`GET /placas/v2/efemerides/tyc?fecha&url?` → `{ articulo, items[{año, titulo, alcance, estado, fuenteEs}], meta }`); `WORKER_URL` existente; `fechaActual`; patrón `.banco-*`/`.copys-*`.
- Produces: panel visible solo tras «VER CANDIDATAS TYC»; nada entra a la placa desde acá.

- [ ] **Step 1: agregar HTML**

Dentro de `efemerides/index.html`, tras `</section>` de `#copysPanel` y antes de `</section>` de main:

```html
    <section id="tycPanel" hidden>
      <div class="tyc-encabezado">
        <h2>CANDIDATAS TYC — REVISIÓN</h2>
        <span class="editor-hint">TyC sólo orienta qué mirar; verificá con Wikipedia/Archivo.ar antes de agregar al banco</span>
      </div>
      <p class="tyc-atribucion"><a id="tycFuenteLink" href="#" target="_blank" rel="noopener">Fuente: TyC Sports ↗</a> · <span id="tycMeta"></span></p>
      <div class="tyc-controles">
        <input id="tycUrl" type="url" placeholder="https://www.tycsports.com/…/efemerides-del-…-idXXXX.html" aria-label="URL del artículo TyC (opcional)">
        <button id="btnTyc" type="button">VER CANDIDATAS TYC</button>
      </div>
      <p class="tyc-aviso">Contenido © Grupo Clarín — sólo metadatos y resumen corto; la redacción está en tycsports.com</p>
      <div class="tyc-filtros" id="tycFiltros" role="group" aria-label="Filtrar por estado">
        <button class="badge tyc-filtro activo" data-f="todas" type="button">TODAS</button>
        <button class="badge tyc-filtro" data-f="cruzado" type="button">CRUZADAS</button>
        <button class="badge tyc-filtro" data-f="en-banco" type="button">EN BANCO</button>
        <button class="badge tyc-filtro" data-f="candidato" type="button">CANDIDATAS</button>
      </div>
      <ul id="tycLista" class="banco-lista"></ul>
      <p id="tycVacio" class="banco-vacio" hidden>Sin candidatas: pegá la URL del artículo TyC y reintentá.</p>
      <p id="tycError" class="copys-error" hidden></p>
    </section>
```

- [ ] **Step 2: agregar CSS** (en el mismo `<style>`, p.ej. tras las reglas `.banco-*`):

```css
  #tycPanel { margin-top:20px; padding-top:18px; border-top:1px solid rgba(245,241,230,.15); display:flex; flex-direction:column; gap:10px; }
  .tyc-encabezado { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
  .tyc-encabezado h2 { margin:0; font-family:Oswald, sans-serif; font-weight:600; font-size:18px; letter-spacing:2px; color:var(--dorado); }
  .tyc-atribucion { margin:0; font-size:12px; color:var(--atenuado); }
  .tyc-atribucion a { color:var(--dorado); text-decoration:none; }
  .tyc-controles { display:flex; gap:10px; flex-wrap:wrap; }
  .tyc-controles input[type=url] { flex:1 1 320px; min-width:0; background:#141b2b; color:var(--crema); border:1px solid rgba(245,241,230,.25); border-radius:4px; padding:10px; font:inherit; font-size:13px; }
  .tyc-aviso { margin:0; font-size:11px; color:var(--atenuado); letter-spacing:.3px; }
  .tyc-filtros { display:flex; gap:8px; flex-wrap:wrap; }
  .tyc-filtro { background:transparent; border:1px solid var(--dorado); color:var(--dorado); cursor:pointer; font-family:Oswald, sans-serif; }
  .tyc-filtro.activo { background:var(--dorado); color:#10151f; }
  .tyc-fila { display:grid; grid-template-columns:60px 1fr auto auto; gap:10px; align-items:center; border:1px solid rgba(245,241,230,.14); border-radius:6px; padding:8px 12px; }
  .tyc-anio { font-family:Oswald, sans-serif; font-weight:700; font-size:18px; color:var(--crema); }
  .tyc-info { min-width:0; display:flex; flex-direction:column; gap:2px; }
  .tyc-titulo { font-weight:600; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tyc-alcance { font-size:11px; letter-spacing:1px; color:var(--atenuado); }
  .tyc-estado { font-size:10px; letter-spacing:1px; border-radius:3px; padding:4px 8px; font-family:Oswald, sans-serif; white-space:nowrap; justify-self:end; }
  .tyc-estado.cruzado { background:var(--dorado); color:#10151f; font-weight:700; }
  .tyc-estado.en-banco { border:1px solid rgba(245,241,230,.4); color:var(--crema); }
  .tyc-estado.candidato { border:1px solid var(--dorado); color:var(--dorado); }
  .tyc-enlace { font-size:11px; color:var(--dorado); text-decoration:none; white-space:nowrap; }
```

- [ ] **Step 3: JS en efemerides/efemerides.mjs**

Agregar dentro del objeto `ui`: `tycPanel: $('tycPanel'), btnTyc: $('btnTyc'), tycUrl: $('tycUrl'), tycLista: $('tycLista'), tycVacio: $('tycVacio'), tycError: $('tycError'), tycMeta: $('tycMeta'), tycFuenteLink: $('tycFuenteLink'), tycFiltros: document.querySelectorAll('.tyc-filtro'),`

```js
let tycItems = [];
let tycFiltro = 'todas';
const crearFilaTyc = (i) => {
  const li = document.createElement('li');
  li.className = 'tyc-fila'; li.dataset.estado = i.estado;
  const anio = document.createElement('span'); anio.className = 'tyc-anio'; anio.textContent = i.año;
  const info = document.createElement('div'); info.className = 'tyc-info';
  const titulo = document.createElement('span'); titulo.className = 'tyc-titulo'; titulo.textContent = i.titulo; titulo.title = i.texto || i.titulo;
  const alcance = document.createElement('span'); alcance.className = 'tyc-alcance'; alcance.textContent = String(i.alcance || '').toUpperCase();
  info.append(titulo, alcance);
  const estado = document.createElement('span'); estado.className = 'tyc-estado ' + i.estado; estado.textContent = i.estado === 'en-banco' ? 'EN BANCO' : i.estado.toUpperCase();
  const enlace = document.createElement('a'); enlace.className = 'tyc-enlace';
  if (i.fuenteEs) { enlace.href = i.fuenteEs; enlace.target = '_blank'; enlace.rel = 'noopener'; enlace.textContent = 'Wikipedia ↗'; } else { enlace.textContent = '—'; enlace.removeAttribute('href'); }
  li.append(anio, info, estado, enlace);
  return li;
};
const renderTyc = () => {
  ui.tycLista.replaceChildren();
  const vistos = tycItems.filter(i => tycFiltro === 'todas' || i.estado === tycFiltro);
  ui.tycVacio.hidden = tycItems.length > 0;
  for (const i of vistos) ui.tycLista.append(crearFilaTyc(i));
  ui.tycFiltros.forEach(b => b.classList.toggle('activo', b.dataset.f === tycFiltro));
};
async function cargarTyc() {
  ui.tycError.hidden = true; ui.tycVacio.hidden = true; ui.tycLista.replaceChildren();
  ui.btnTyc.disabled = true; ui.btnTyc.textContent = 'CARGANDO…';
  try {
    const urlExtra = ui.tycUrl.value.trim();
    const qs = '?fecha=' + encodeURIComponent(fechaActual) + (urlExtra ? '&url=' + encodeURIComponent(urlExtra) : '');
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 30000);
    const res = await fetch(WORKER_URL + '/placas/v2/efemerides/tyc' + qs, { signal: ctrl.signal });
    clearTimeout(timer);
    const raw = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = raw?.error || raw?.message || ('Error ' + res.status);
      throw new Error(typeof msg === 'string' ? msg : 'Error ' + res.status);
    }
    ui.tycFuenteLink.href = raw.articulo;
    ui.tycMeta.textContent = `${raw.meta.hechos} hechos · ${raw.meta.cruzados} cruzados · ${raw.meta.enBanco} en banco · ${raw.meta.candidatos} candidatos`;
    tycItems = raw.items || []; renderTyc(); ui.tycPanel.hidden = false;
  } catch (err) {
    ui.tycPanel.hidden = false;
    ui.tycError.textContent = err?.name === 'AbortError' ? 'La respuesta tardó demasiado. Reintentá.' : (err?.message || 'No se pudieron traer candidatas de TyC.');
    ui.tycError.hidden = false;
  } finally { ui.btnTyc.disabled = false; ui.btnTyc.textContent = 'VER CANDIDATAS TYC'; }
}
function resetearTyc() {
  tycItems = []; tycFiltro = 'todas';
  ui.tycLista.replaceChildren(); ui.tycError.hidden = true; ui.tycVacio.hidden = true;
  ui.tycUrl.value = ''; ui.tycMeta.textContent = ''; ui.tycPanel.hidden = true;
}
```

Listeners (junto a los demás, al final):
```js
ui.btnTyc.addEventListener('click', cargarTyc);
ui.tycFiltros.forEach(b => b.addEventListener('click', () => { tycFiltro = b.dataset.f; renderTyc(); }));
```

Y dentro de `resetearEditor()` (para que cambie la fecha → panel limpio): llamada a `resetearTyc()`.

- [ ] **Step 4: verificación sintaxis ESM**

```bash
node --check efemerides/efemerides.mjs && echo OK-ESM
node --check efemerides/placa-model.mjs && echo OK-MODEL
```
Expected: `OK-ESM` y `OK-MODEL`.

- [ ] **Step 5: commit**

```bash
git add efemerides/index.html efemerides/efemerides.mjs
git commit -m "feat(efemerides): panel Candidatas TyC de solo revisión en el editor"
```

---

### Task 4: Verificación completa y cierre de deploy

- [ ] **Step 1: suite completa verde**

```bash
node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs redaccion-v2/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs tyc-efemerides/*.test.mjs
```
Expected: `ℹ pass 620+` fail 0 (incluye los 2 archivos nuevos).

- [ ] **Step 2: handoff de deploy (acciones del usuario, no de la máquina)**

1. `git push origin main` (Pages despliega `efemerides/` solo).
2. Pegar el `worker/worker.js` nuevo en el dashboard de Cloudflare (`mm-herramientas-worker`). Rollback si falla: pegar el `worker/worker.js` del commit anterior.
3. Checklist en `https://mediamendoza.pages.dev/efemerides/`:
   - fecha 2026-11-11 + botón → aviso «no hay artículo en el índice»; pegar URL `https://www.tycsports.com/interes-general/efemerides/efemerides-del-11-de-noviembre-que-se-conmemora-hoy-id771003.html` → tabla con 10 hechos y atribución;
   - fecha sin cobertura ni URL → aviso claro; placa/copys intactos;
   - cambiar el selector de fecha → panel se limpia.

- [ ] **Step 3: commit final si quedó algo suelto + push**

```bash
git push origin main
```



