# Efemérides automática — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/efemerides/`, a standalone page that renders the day's verified efemérides plate (1080×1080) automatically on open, with a single one-click PNG download — zero user steps, no editor, no JSON, no prompts.

**Architecture:** New top-level vanilla app (`efemerides/`): `placa-model.mjs` (pure, node-testable data normalization) → `efemerides.mjs` (fetch + canvas draw + PNG export) → `index.html` (chrome + states). Data from the existing production endpoint `GET /placas/v2/efemerides?fecha=YYYY-MM-DD` (Wikipedia, KV-cached). Nothing production is modified.

**Tech Stack:** HTML/CSS/JS vanilla ES modules, Canvas 2D, Node built-in tests, Cloudflare Pages (static, no build).

## Global Constraints

- Production untouchable: do NOT modify `visual-suite/`, `placas-v2/`, `worker/worker.js`, or the root `index.html`. No new card anywhere.
- Zero new dependencies, no build step; files are served as-is by Pages.
- Worker URL is hardcoded: `https://mm-herramientas-worker.mhhurtado.workers.dev` (as in `visual-suite/app.js:559`).
- Fixed endpoint: `GET /placas/v2/efemerides?fecha=YYYY-MM-DD`, client timeout 15s via `AbortController`.
- `alcance` is never printed, never used to filter. Order = endpoint order (Argentine-first curation). Hero = `items[0]`. Max 6 items shown; footer shows `M DE N HECHOS DEL DÍA` when capped, else `N HECHOS DEL DÍA`.
- Plate is typographic: no photos ever. Logo = real `/assets/logo.png`, top-left.
- Fonts local: `/assets/BebasNeue-Regular.ttf` (years/labels/date), `/assets/Economica-Regular.ttf` (titles/body).
- Canvas 1080×1080; PNG filename `efemerides-YYYY-MM-DD.png`; ONE button "Descargar PNG"; NO WhatsApp button; NO auto-publish; NO regenerate button.
- Any failure (fetch/400/502/timeout/<5 valid items/assets not loading after 2 tries) → explicit `error` state with "Reintentar". Never a blank page.
- All user-facing copy in Spanish. No `TBD`/`TODO` in code. Verify with `node --check` + `node --test --test-isolation=none efemerides/placa-model.test.mjs`.

## File Structure

| File | Responsibility |
|---|---|
| `efemerides/placa-model.mjs` | Pure logic: `hoyArgentina()`, `etiquetaCategoria()`, `normalizarPayload()` → `{ok, fecha, fuente, verificada, hero, rows, totalMostrados, total}` or `{ok:false, error}`. No DOM/canvas/fetch. |
| `efemerides/placa-model.test.mjs` | `node --test` suite for the model. |
| `efemerides/efemerides.mjs` | App module: fetch, state machine (`cargando`/`lista`/`error`), canvas draw, PNG export, date picker wiring. |
| `efemerides/index.html` | Markup + CSS + states markup. Links root `../style.css` for `.mm-spinner` contract. Loads `efemerides.mjs` as `<script type="module">`. |

---

### Task 1: Model — date + category labels (TDD)

**Files:**
- Create: `efemerides/placa-model.mjs`
- Test: `efemerides/placa-model.test.mjs`

**Interfaces:**
- Produces: `hoyArgentina(): string` (`YYYY-MM-DD`), `etiquetaCategoria(item): string` (uppercase label). Task 2 consumes both.

- [ ] **Step 1: Write the failing tests**

```js
// efemerides/placa-model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { hoyArgentina, etiquetaCategoria } from './placa-model.mjs';

test('hoyArgentina devuelve YYYY-MM-DD', () => {
  assert.match(hoyArgentina(), /^\d{4}-\d{2}-\d{2}$/);
});

test('etiquetaCategoria mapea claves conocidas', () => {
  assert.equal(etiquetaCategoria({ icono: 'politica' }), 'POLÍTICA');
  assert.equal(etiquetaCategoria({ icono: 'historia' }), 'HISTORIA');
  assert.equal(etiquetaCategoria({ icono: 'musica' }), 'MÚSICA');
  assert.equal(etiquetaCategoria({ icono: 'economia' }), 'ECONOMÍA');
  assert.equal(etiquetaCategoria({ icono: 'aviacion' }), 'AVIACIÓN');
});

test('etiquetaCategoria usa categoria si icono falta', () => {
  assert.equal(etiquetaCategoria({ categoria: 'sociedad' }), 'SOCIEDAD');
});

test('etiquetaCategoria desconocida queda en mayúsculas, sin inventarse', () => {
  assert.equal(etiquetaCategoria({ icono: 'otro', categoria: 'cocina' }), 'COCINA');
  assert.equal(etiquetaCategoria({}), 'EFEMÉRIDE');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: FAIL — `Cannot find module './placa-model.mjs'`

- [ ] **Step 3: Write minimal implementation**

```js
// efemerides/placa-model.mjs — lógica pura, sin DOM/canvas/fetch

const ZONA = 'America/Argentina/Mendoza';

const ETIQUETAS = {
  futbol: 'FÚTBOL', deportes: 'DEPORTES', aviacion: 'AVIACIÓN', musica: 'MÚSICA',
  teatro: 'TEATRO', politica: 'POLÍTICA', historia: 'HISTORIA', sociedad: 'SOCIEDAD',
  economia: 'ECONOMÍA', mundo: 'MUNDO', canal: 'CANAL',
};

export function hoyArgentina() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export function etiquetaCategoria(item) {
  const clave = String(item?.icono || item?.categoria || '').trim().toLowerCase();
  if (ETIQUETAS[clave]) return ETIQUETAS[clave];
  return String(item?.categoria || 'efeméride').trim().toUpperCase();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add efemerides/placa-model.mjs efemerides/placa-model.test.mjs
git commit -m "feat(efemerides): modelo - fecha Argentina y etiquetas de categoria"
```

---

### Task 2: Model — normalize payload into plate view (TDD)

**Files:**
- Modify: `efemerides/placa-model.mjs`
- Test: `efemerides/placa-model.test.mjs`

**Interfaces:**
- Consumes: `etiquetaCategoria()`, `hoyArgentina()` from Task 1.
- Produces: `normalizarPayload(raw)` → on success `{ ok: true, fecha: string, fuente: 'Wikipedia', verificada: boolean, hero: Item, rows: Item[], totalMostrados: number, total: number }`; on failure `{ ok: false, error: string }`. `Item = { año, titulo, resumen, ampliado, categoria, verificada, fuente }` (note: NO `alcance` — it must not travel into the view). Task 3 consumes `normalizarPayload`.

Rules: validate `raw.ok === true` and `Array.isArray(raw.items)`; per item require non-empty `año`, `titulo`, `resumen`; drop invalid items (never fabricate); `<5` valid ⇒ `{ok:false}`; preserve endpoint order; cap at 6; hero = items[0]; `texto_ampliado` falls back to `resumen`.

- [ ] **Step 1: Write the failing tests** (add to `efemerides/placa-model.test.mjs`)

```js
import { normalizarPayload } from './placa-model.mjs';

const ITEM = (n, titulo, alcance = 'internacional') => ({
  año: String(1800 + n), titulo, resumen: `Resumen del hecho ${n}.`,
  texto_ampliado: `Ampliado del hecho ${n}.`,
  alcance, categoria: 'historia', icono: 'historia', prioridad: n,
  fuente: 'Wikipedia', verificada: true,
});

const payloadValido = (items) => ({ ok: true, items, meta: { fecha: '2026-11-13', fuente: 'https://es.wikipedia.org/wiki/13_de_noviembre' } });

test('normalizarPayload: ok, héroe es el primero, orden preservado, sin alcance', () => {
  const r = normalizarPayload(payloadValido([ITEM(1, 'Primero'), ITEM(2, 'Segundo'), ITEM(3, 'Tercero'), ITEM(4, 'Cuarto'), ITEM(5, 'Quinto')]));
  assert.equal(r.ok, true);
  assert.equal(r.fecha, '2026-11-13');
  assert.equal(r.hero.titulo, 'Primero');
  assert.deepEqual(r.rows.map(i => i.titulo), ['Segundo', 'Tercero', 'Cuarto', 'Quinto']);
  assert.equal(r.totalMostrados, 5);
  assert.equal(r.total, 5);
  assert.equal('alcance' in r.hero, false);
  assert.equal('alcance' in r.rows[0], false);
  assert.equal(r.verificada, true);
});

test('normalizarPayload: recorta a 6 y reporta el total', () => {
  const items = Array.from({ length: 8 }, (_, i) => ITEM(i + 1, `Hecho ${i + 1}`));
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.ok, true);
  assert.equal(r.totalMostrados, 6);
  assert.equal(r.total, 8);
  assert.equal(r.rows.length, 5);
});

test('normalizarPayload: descarta items sin título sin inventar relleno', () => {
  const items = [ITEM(1, 'Uno'), ITEM(2, 'Dos'), ITEM(3, ''), ITEM(4, 'Cuatro'), ITEM(5, 'Cinco'), ITEM(6, 'Seis')];
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.ok, true);
  assert.equal(r.total, 5);
  assert.deepEqual(r.rows.map(i => i.titulo), ['Dos', 'Cuatro', 'Cinco', 'Seis']);
});

test('normalizarPayload: con menos de 5 items válidos devuelve error', () => {
  const r = normalizarPayload(payloadValido([ITEM(1, 'Uno'), { titulo: 'sin año ni resumen' }]));
  assert.equal(r.ok, false);
  assert.match(r.error, /hechos verificados/i);
});

test('normalizarPayload: raw inválido o ok:false devuelve error', () => {
  assert.equal(normalizarPayload(null).ok, false);
  assert.equal(normalizarPayload({ ok: false }).ok, false);
  assert.equal(normalizarPayload({ ok: true, items: 'no-array' }).ok, false);
});

test('normalizarPayload: texto_ampliado cae a resumen si falta', () => {
  const items = [1, 2, 3, 4, 5].map(n => ITEM(n, `Hecho ${n}`));
  delete items[0].texto_ampliado;
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.hero.ampliado, r.hero.resumen);
});

test('normalizarPayload: verificada es false si algún item mostrado no lo está', () => {
  const items = [1, 2, 3, 4, 5].map(n => ITEM(n, `Hecho ${n}`));
  items[1].verificada = false;
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.verificada, false);
});
```

Careful: `assert.equal(normalizarPayload(null).ok, false)` — no `.error` access, fine.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: FAIL — `normalizarPayload` is not exported

- [ ] **Step 3: Implement** (append to `efemerides/placa-model.mjs`)

```js
const MIN_ITEMS = 5;
const MAX_ITEMS_PLACA = 6;

function normalizarItem(item) {
  return {
    año: String(item?.año ?? item?.anio ?? '').trim(),
    titulo: String(item?.titulo ?? '').trim(),
    resumen: String(item?.resumen ?? '').trim(),
    ampliado: String(item?.texto_ampliado ?? item?.resumen ?? '').trim(),
    categoria: etiquetaCategoria(item),
    verificada: item?.verificada === true,
    fuente: String(item?.fuente ?? 'Wikipedia').trim(),
  };
}

export function normalizarPayload(raw) {
  if (!raw || raw.ok !== true || !Array.isArray(raw.items)) {
    return { ok: false, error: 'La respuesta del servicio no es válida.' };
  }
  const validos = raw.items.map(normalizarItem).filter(i => i.año && i.titulo && i.resumen);
  if (validos.length < MIN_ITEMS) {
    return { ok: false, error: 'No alcanzaron hechos verificados para esa fecha.' };
  }
  const total = validos.length;
  const items = validos.slice(0, MAX_ITEMS_PLACA);
  const [hero, ...rows] = items;
  return {
    ok: true,
    fecha: String(raw?.meta?.fecha ?? '').trim(),
    fuente: items[0].fuente || 'Wikipedia',
    verificada: items.every(i => i.verificada),
    hero,
    rows,
    totalMostrados: items.length,
    total,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add efemerides/placa-model.mjs efemerides/placa-model.test.mjs
git commit -m "feat(efemerides): modelo - normalizacion del payload y vista hero+filas"
```

---

### Task 3: App — página + módulo (fetch, estados, canvas, export)

**Files:**
- Create: `efemerides/index.html`
- Create: `efemerides/efemerides.mjs`

**Interfaces:**
- Consumes: `hoyArgentina()`, `normalizarPayload()` from `placa-model.mjs`; DOM ids `estadoCargando`, `estadoError`, `placaLista`, `mensajeError`, `btnReintentar`, `btnDescargar`, `fechaInput`, `placa`; shared spinner classes `.mm-spinner.is-active` from root `style.css`.
- Produces: working page at `/efemerides/` (no other module imports it).

- [ ] **Step 1: Create the page**

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Efemérides · Media Mendoza</title>
<link rel="stylesheet" href="../style.css">
<style>
  :root { --fondo:#0F1520; --dorado:#C8A24A; --crema:#F5F1E6; --atenuado:rgba(245,241,230,.78); }
  * { box-sizing:border-box; }
  [hidden] { display:none !important; }
  body { margin:0; background:var(--fondo); color:var(--crema); font-family:Economica, Georgia, serif; }
  header { display:flex; align-items:center; gap:14px; padding:16px 24px; border-bottom:1px solid rgba(245,241,230,.15); }
  header img { height:34px; }
  header h1 { font-family:BebasNeue, sans-serif; font-weight:400; font-size:22px; letter-spacing:3px; color:var(--dorado); margin:0; }
  main { max-width:640px; margin:0 auto; padding:24px 16px 40px; }
  #placa { width:100%; height:auto; display:block; border-radius:6px; }
  .estado { display:flex; flex-direction:column; align-items:center; gap:14px; padding:60px 0; text-align:center; }
  .estado p { margin:0; color:var(--atenuado); }
  #estadoError p { color:#e8b4a8; }
  .controles { display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; margin-top:16px; }
  label { display:flex; align-items:center; gap:8px; color:var(--atenuado); font-size:15px; }
  input[type="date"] { background:#141b2b; color:var(--crema); border:1px solid rgba(245,241,230,.25); border-radius:4px; padding:8px 10px; font:inherit; }
  button { background:var(--dorado); color:#10151f; border:0; border-radius:4px; padding:12px 22px; font:inherit; font-weight:700; letter-spacing:1px; cursor:pointer; }
  button:disabled { opacity:.45; cursor:not-allowed; }
  footer { text-align:center; padding:18px; color:var(--atenuado); font-size:13px; letter-spacing:1px; }
  @font-face { font-family:'BebasNeue'; src:url('../assets/BebasNeue-Regular.ttf') format('truetype'); }
  @font-face { font-family:'Economica'; src:url('../assets/Economica-Regular.ttf') format('truetype'); }
</style>
</head>
<body>
<header>
  <img src="../assets/logo.png" alt="Media Mendoza">
  <h1>EFEMÉRIDES</h1>
</header>
<main>
  <section id="estadoCargando" class="estado" hidden>
    <div class="mm-spinner is-active" role="status" aria-label="Cargando"></div>
    <p>Cargando la placa del día…</p>
  </section>
  <section id="estadoError" class="estado" hidden>
    <p id="mensajeError"></p>
    <button id="btnReintentar" type="button">REINTENTAR</button>
  </section>
  <section id="placaLista" hidden>
    <canvas id="placa" width="1080" height="1080"></canvas>
    <div class="controles">
      <label>Ver otro día <input type="date" id="fechaInput"></label>
      <button id="btnDescargar" type="button" disabled>DESCARGAR PNG</button>
    </div>
  </section>
</main>
<footer>Datos verificados · Fuente: Wikipedia</footer>
<script type="module" src="./efemerides.mjs"></script>
</body>
</html>
```

Note: `[hidden]{display:none !important;}` is required — `.estado{display:flex}` would otherwise override the `hidden` attribute.

- [ ] **Step 2: Create the app module**

```js
// efemerides/efemerides.mjs — fetch + estados + canvas + export PNG
import { hoyArgentina, normalizarPayload } from './placa-model.mjs';

const WORKER_URL = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const ANCHO = 1080;
const ALTO = 1080;
const COLOR = {
  fondo: '#0F1520', dorado: '#C8A24A', crema: '#F5F1E6',
  regla: 'rgba(245,241,230,.25)', atenuado: 'rgba(245,241,230,.78)', ampliado: 'rgba(245,241,230,.72)',
};
const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

const $ = (id) => document.getElementById(id);
const ui = {
  cargando: $('estadoCargando'), error: $('estadoError'), lista: $('placaLista'),
  msgError: $('mensajeError'), reintentar: $('btnReintentar'), descargar: $('btnDescargar'),
  fecha: $('fechaInput'), canvas: $('placa'),
};

let fechaActual = hoyArgentina();
let logoImg = null;

const asset = (ruta) => new URL(ruta, import.meta.url).href;

const etiquetaFecha = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return (y && m && d) ? `${d} DE ${MESES[m - 1]} DE ${y}` : '';
};

function mostrar(cual, mensaje) {
  ui.cargando.hidden = cual !== 'cargando';
  ui.error.hidden = cual !== 'error';
  ui.lista.hidden = cual !== 'lista';
  if (mensaje) ui.msgError.textContent = mensaje;
  ui.descargar.disabled = cual !== 'lista';
}

function cargarFuentes() {
  return Promise.all([['BebasNeue', '../assets/BebasNeue-Regular.ttf'], ['Economica', '../assets/Economica-Regular.ttf']]
    .map(async ([nombre, ruta]) => {
      const face = new FontFace(nombre, `url(${asset(ruta)})`);
      await face.load();
      document.fonts.add(face);
    }));
}

function cargarLogo() {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => { logoImg = img; resolver(); };
    img.onerror = () => rechazar(new Error('No se pudo cargar el logo'));
    img.src = asset('../assets/logo.png');
  });
}

async function garantizarAssets() {
  if (logoImg && document.fonts.check('20px BebasNeue') && document.fonts.check('20px Economica')) return;
  let ultimoError = null;
  for (let intento = 0; intento < 2; intento += 1) {
    try { await Promise.all([cargarFuentes(), cargarLogo()]); return; }
    catch (err) { ultimoError = err; }
  }
  throw ultimoError || new Error('No se pudieron cargar los recursos');
}

function envolver(ctx, texto, maxAncho) {
  const lineas = [];
  let linea = '';
  for (const p of String(texto).split(/\s+/).filter(Boolean)) {
    const prueba = linea ? `${linea} ${p}` : p;
    if (ctx.measureText(prueba).width <= maxAncho) linea = prueba;
    else { if (linea) lineas.push(linea); linea = p; }
  }
  if (linea) lineas.push(linea);
  return lineas;
}

function unaLinea(ctx, texto, maxAncho) {
  if (ctx.measureText(texto).width <= maxAncho) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxAncho) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function chip(ctx, texto, x, y) {
  ctx.font = '22px BebasNeue';
  const w = Math.ceil(ctx.measureText(texto).width) + 40;
  ctx.strokeStyle = COLOR.dorado;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, 38);
  ctx.fillStyle = COLOR.dorado;
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, x + 20, y + 21);
  ctx.textBaseline = 'top';
  return 38;
}

function dibujarPlaca(modelo) {
  const ctx = ui.canvas.getContext('2d');
  ctx.fillStyle = COLOR.fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const logoH = 64;
  const logoW = Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight));
  ctx.drawImage(logoImg, 64, 44, logoW, logoH);
  ctx.fillStyle = COLOR.dorado;
  ctx.font = '52px BebasNeue';
  ctx.textAlign = 'right';
  ctx.fillText(etiquetaFecha(modelo.fecha || fechaActual), ANCHO - 64, 62);
  ctx.textAlign = 'left';

  ctx.fillStyle = COLOR.dorado;
  ctx.fillRect(64, 140, ANCHO - 128, 4);

  let y = 160;
  ctx.fillStyle = COLOR.dorado;
  ctx.font = '150px BebasNeue';
  ctx.fillText(modelo.hero.año, 64, y);
  y += 108;
  ctx.fillStyle = COLOR.crema;
  ctx.font = '44px Economica';
  for (const linea of envolver(ctx, modelo.hero.titulo, ANCHO - 128)) { ctx.fillText(linea, 64, y); y += 44; }
  y += 2;
  ctx.fillStyle = COLOR.atenuado;
  ctx.font = '30px Economica';
  for (const linea of envolver(ctx, modelo.hero.resumen, ANCHO - 128)) { ctx.fillText(linea, 64, y); y += 34; }
  y += 4;
  ctx.font = '24px Economica';
  ctx.fillStyle = COLOR.ampliado;
  for (const linea of envolver(ctx, modelo.hero.ampliado, ANCHO - 128).slice(0, 4)) { ctx.fillText(linea, 64, y); y += 30; }
  y += 8;
  y += chip(ctx, modelo.hero.categoria, 64, y) + 10;

  ctx.fillStyle = COLOR.regla;
  ctx.fillRect(64, y, ANCHO - 128, 2);
  y += 14;

  const yPie = ALTO - 84;
  const filas = modelo.rows.slice(0, 5);
  const altoFila = Math.min(96, Math.floor((yPie - y) / filas.length));
  const conResumen = altoFila >= 76;
  for (const fila of filas) {
    ctx.fillStyle = COLOR.dorado;
    ctx.font = `${Math.min(44, Math.round(altoFila * 0.62))}px BebasNeue`;
    ctx.fillText(fila.año, 64, y + 4);
    const xTexto = 200;
    ctx.fillStyle = COLOR.crema;
    ctx.font = '27px Economica';
    ctx.fillText(unaLinea(ctx, fila.titulo, ANCHO - xTexto - 128), xTexto, y + 4);
    if (conResumen) {
      ctx.fillStyle = COLOR.atenuado;
      ctx.font = '21px Economica';
      ctx.fillText(unaLinea(ctx, fila.resumen, ANCHO - xTexto - 128), xTexto, y + 38);
    }
    ctx.fillStyle = COLOR.dorado;
    ctx.font = '17px BebasNeue';
    ctx.fillText(fila.categoria, xTexto, y + (conResumen ? 60 : 34));
    y += altoFila;
  }

  ctx.fillStyle = COLOR.regla;
  ctx.fillRect(64, yPie + 10, ANCHO - 128, 2);
  ctx.fillStyle = COLOR.atenuado;
  ctx.font = '19px Economica';
  ctx.fillText(modelo.verificada ? 'FUENTE: WIKIPEDIA · VERIFICADA' : 'FUENTE: WIKIPEDIA', 64, yPie + 26);
  const etiqueta = modelo.total > modelo.totalMostrados
    ? `${modelo.totalMostrados} DE ${modelo.total} HECHOS DEL DÍA`
    : `${modelo.totalMostrados} HECHOS DEL DÍA`;
  ctx.fillStyle = COLOR.dorado;
  ctx.font = '22px BebasNeue';
  ctx.textAlign = 'right';
  ctx.fillText(etiqueta, ANCHO - 64, yPie + 24);
  ctx.textAlign = 'left';
}

function exportarPNG() {
  ui.canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `efemerides-${fechaActual}.png`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}

async function cargar(fecha) {
  mostrar('cargando');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${WORKER_URL}/placas/v2/efemerides?fecha=${encodeURIComponent(fecha)}`, { signal: ctrl.signal });
    const raw = await res.json().catch(() => null);
    const modelo = normalizarPayload(raw);
    if (!modelo.ok) throw new Error(modelo.error);
    await garantizarAssets();
    dibujarPlaca(modelo);
    ui.fecha.value = fecha;
    mostrar('lista');
  } catch (err) {
    const msg = err?.name === 'AbortError'
      ? 'La respuesta tardó demasiado. Reintentá.'
      : (err?.message || 'No se pudieron cargar las efemérides.');
    mostrar('error', msg);
  } finally {
    clearTimeout(timer);
  }
}

ui.reintentar.addEventListener('click', () => cargar(fechaActual));
ui.fecha.addEventListener('change', () => {
  const v = ui.fecha.value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { fechaActual = v; cargar(v); }
});
ui.descargar.addEventListener('click', exportarPNG);
cargar(fechaActual);
```

Layout notes: vertical budget is dynamic (hero can wrap 1–4 lines). If rows lose `conResumen` the plate is still correct (hero never truncates). If `y` reaches `yPie` before rows end, shrink constants by ±10% (e.g. `y = 150`, `año 140px`, `ampliado 22px`) — do not change the region logic or the degradation rule. The screenshot in Task 4 is the arbiter.

- [ ] **Step 3: Syntax check**

Run: `node --check efemerides/efemerides.mjs; node --check efemerides/placa-model.mjs`
Expected: no output, exit 0

- [ ] **Step 4: Smoke in browser**

Serve repo root on 8790 (ad-hoc, no deps):

```bash
node -e "const http=require('http'),fs=require('fs'),path=require('path');const tipos={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.ttf':'font/ttf','.jpg':'image/jpeg'};http.createServer((req,res)=>{const p=path.join(process.cwd(),decodeURIComponent(req.url.split('?')[0]));const f=fs.existsSync(p)?(fs.statSync(p).isDirectory()?path.join(p,'index.html'):p):p;fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('404');return;}res.writeHead(200,{'Content-Type':tipos[path.extname(f).toLowerCase()]||'application/octet-stream'});res.end(d);});}).listen(8790);"
```

Then open http://localhost:8790/efemerides/. Expected: plate renders without any clicks (or an explicit error box with REINTENTAR — never blank), console clean.

- [ ] **Step 5: Commit**

```bash
git add efemerides/index.html efemerides/efemerides.mjs
git commit -m "feat(efemerides): pagina y modulo 100% automaticos (placa del dia + export PNG)"
```

---

### Task 4: Verificación final

**Files:** none new — verification only.

- [ ] **Step 1: Model tests green**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: `pass 11` (or all listed tests PASS), 0 failures

- [ ] **Step 2: No regression in the rest of the suite**

Run:
```bash
node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs redaccion-v2/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs efemerides/placa-model.test.mjs
```
Expected: all PASS. (The pre-existing failure of `shared/editorial-suite.integration.test.mjs` is out of scope — it imports a moved adapter; do not fix it here.)

- [ ] **Step 3: Manual QA in browser** (server on 8790 from Task 3 still running)

1. http://localhost:8790/efemerides/ — plate renders with zero clicks; visually compare against mockup v4 (`.superpowers/brainstorm/1440-1794605700/content/portada-v4.html`): navy bg, gold accents, logo top-left, category label on all 5 events, footer "FUENTE: WIKIPEDIA · VERIFICADA".
2. Click DESCARGAR PNG → file `efemerides-YYYY-MM-DD.png`, opens, exactly 1080×1080.
3. Change date to `2026-11-05` → plate re-renders for that day.
4. DevTools → Network → Offline → REINTENTAR → explicit error box, no blank page; back online → REINTENTAR → plate returns.
5. Console: zero errors.

- [ ] **Step 4: Production untouched proof**

Run: `git status --short; git diff --stat HEAD~4` (adjust range to your commits)
Expected: only `efemerides/*` (and docs). Nothing under `visual-suite/`, `placas-v2/`, `worker/`, root `index.html`.

- [ ] **Step 5: Commit (if QA produced fixes)**

```bash
git add efemerides/
git commit -m "fix(efemerides): ajustes de QA visual y de estado"
```

**Deploy note:** pushing to `main` publishes `/efemerides/` automatically via Pages. There is intentionally no card in the root `index.html` (spec §10) — the route is direct, like `redaccion-v2`.

---

## Spec coverage map

- Spec §2 decisions → Tasks 1–3 (endpoint reuse, A v4 design, 1:1 PNG only, no WhatsApp/regenerate).
- Spec §4 flow/states → Task 3 (`mostrar()` state machine, picker, retry, timeout).
- Spec §5 data contract → Tasks 1–2 (normalization, cap 6, no `alcance`, category labels).
- Spec §6 visual → Task 3 `dibujarPlaca` (logo top-left, Bebas/Economica local, category on all events, verified footer, hero never truncates, rows degrade).
- Spec §7 export → Task 3 `exportarPNG`.
- Spec §8 errors → Tasks 2–3 (`{ok:false}` paths, asset retry ×2, explicit error state).
- Spec §9 testing → Tasks 1–2 (node tests) + Task 4 (suite + manual QA).
- Spec §10 non-goals → Global Constraints + Task 4 Step 4 proof.
