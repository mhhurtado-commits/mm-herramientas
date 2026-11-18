# Banco de candidatos para la placa de /efemerides/ — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Agregar a `/efemerides/` un **banco de candidatos** plegable: candidatos extra de Wikipedia (amplio el prompt), feriados argentinos de argentinadatos.com (próximos 7 días, automáticos) y efemérides mendocinas (`efemerides-mza.json` en repo). El redactor agrega hechos al final de la placa con un clic; la destacada sigue siendo el primer hecho visible.

**Architecture:** La placa se sigue armando sola (6 mejores hechos). El GET actual propaga el array completo como `candidatos` (el cliente deriva el banco Wikipedia del mismo payload, sin segunda llamada). Feriados llegan por un endpoint nuevo GET `/placas/v2/efemerides/banco` (sin KV, `fetcher` inyectable). Mendoza es estático y lo pide el navegador directo. Sin persistencia: el banco vale por la sesión.

**Tech Stack:** HTML/CSS/JS vanilla + `.mjs` al lado del HTML; worker single-file `worker/worker.js` (deploy manual); tests `node:test` sin dependencias.

## Global Constraints

- Sin persistencia: el banco y su "ya agregado" viven solo en memoria (misma sesión que el editor existente).
- La destacada = primer hecho visible (no hay `heroIndex`). La placa sigue siendo 6 hechos máx: el botón AGREGAR del banco se deshabilita cuando `itemsPlaca.length >= 6`.
- Año vacío SOLO para feriados (`año: ''`): el modelo dibuja `DD MMM` en la celda grande y `AR` en filas; copys listan feriados sin año (sin `-1`, sin "hace N años").
- Ningún KV nuevo: no se lee ni escribe `placas-v2:efemerides:v5:*` ni `v6:copys:*` desde el banco. Cache v5 ya desplegada con 5–8 items sigue válida.
- EOL CRLF de `worker/worker.js` intacta; no tocar el hunk `handleVisualGenerar` ni `visual-suite/*`.
- Commits selectivos en `worker/worker.js`: `git diff -U0` + staging por hunks si aparece algo ajeno.
- Verificación: `node --test --test-isolation=none <archivo>`; suite completa (comando en AGENTS.md + `efemerides/placa-model.test.mjs`); `node --check worker/worker.js`.
- Mensajes de commit en español, `feat|fix|docs(scope):`.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `efemerides/placa-model.mjs` | `normalizarPayload` devuelve también `candidatos` (array completo, sin slice); `construirModeloPlaca` deriva `añoTexto` (hero, ej. `23 NOV`) y `filaTexto` (`AR`) para items sin año |
| `efemerides/placa-model.test.mjs` | Tests de ambas puras (nuevos) |
| `worker/worker.js` | Prompt Wikipedia ampliado (8–15, "todas las opciones razonables"); `normalizarFeriadosAR(data, desdeISO, dias)` pura exportada; `handlePlacasV2EfemeridesBanco(url, env, fetcher)`; rama GET `/placas/v2/efemerides/banco` |
| `worker/efemerides-copys.test.mjs` | Tests de `normalizarFeriadosAR` + handler banco (fetch falso) + tolerancia a año vacío en prompt/fallback |
| `efemerides/efemerides-mza.json` | Seed: 3 hechos mendocinos (JSON estático) |
| `efemerides/efemerides.mjs` | Sección banco: toggle, fetch perezoso (feriados + Mendoza), render tarjetas, AGREGAR a `itemsPlaca`, dibujo con `añoTexto` / `filaTexto` |
| `efemerides/index.html` | Sección plegable `#bancoPanel` + estilos |

---
### Task 1: Modelo cliente — `candidatos` en `normalizarPayload` + etiquetas sin año en `construirModeloPlaca`

**Files:**
- Modify: `efemerides/placa-model.mjs`
- Test: `efemerides/placa-model.test.mjs`

**Interfaces:**
- Consumes: pin existing tests (`ITEM`, `payloadValido`)
- Produces: `normalizarPayload(raw)` → adds `candidatos: [...]` (todos los válidos, sin slice; `items` sigue cortando a 6). `construirModeloPlaca(items, fecha)` → `hero.añoTexto`, `rows[n].filaTexto` (string, siempre string, ya normalizado): items con año → su año; sin año con `fecha` válida → `DD MMM` para hero (ej. `23 NOV`), `AR` para filas.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `efemerides/placa-model.test.mjs`:

```js
test('normalizarPayload: expone candidatos completos (sin slice) además de items de 6', () => {
  const items = Array.from({ length: 9 }, (_, i) => ITEM(i + 1, `Hecho ${i + 1}`));
  const r = normalizarPayload(payloadValido(items));
  assert.equal(r.items.length, 6);
  assert.equal(r.candidatos.length, 9);
});

test('construirModeloPlaca: feriado sin año muestra DD MMM en hero y AR en filas', () => {
  const items = [
    { año: '', fecha: '2026-11-23', titulo: 'Día de la Soberanía Nacional', resumen: 'Feriado nacional.', icono: 'historia', categoria: 'EFEMÉRIDE ARGENTINA', oculto: false },
    { ...ITEM(7, 'Normal'), fecha: '2026-11-23' },
  ];
  const m = construirModeloPlaca(items, '2026-11-18');
  assert.equal(m.hero.añoTexto, '23 NOV');
  assert.equal(m.rows[0].filaTexto, '1999');
});

test('construirModeloPlaca: item sin año en filas muestra AR', () => {
  const items = [
    { ...ITEM(1, 'Primero') },
    { año: '', fecha: '2026-11-23', titulo: 'Feriado', resumen: 'Feriado.', icono: 'historia', oculto: false },
  ];
  const m = construirModeloPlaca(items, '2026-11-18');
  assert.equal(m.rows[0].filaTexto, 'AR');
});

test('construirModeloPlaca: item sin año y sin fecha → hero sin crash (AR)', () => {
  const items = [{ año: '', titulo: 'Feriado raro', resumen: 'Sin fecha.', icono: 'historia', oculto: false }];
  const m = construirModeloPlaca(items, '2026-11-18');
  assert.equal(m.hero.añoTexto, 'AR');
});
```

- [ ] **Step 2: Confirmar que fallan**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: FAIL (`candidatos` undefined, `añoTexto` undefined).

- [ ] **Step 3: Implementar**

En `efemerides/placa-model.mjs`:

(a) Nivel de módulo, tras `const MAX_ITEMS_PLACA = 6;`:

```js
const MESES_ABREV_EF = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
function etiquetaFechaHero(fechaIso) {
  const f = String(fechaIso || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return 'AR';
  return String(Number(f.slice(8, 10))) + ' ' + MESES_ABREV_EF[Number(f.slice(5, 7)) - 1];
}
```

(b) `normalizarPayload`: agregar `candidatos: validos` al objeto de retorno (`items` sigue `slice(0, MAX_ITEMS_PLACA)`):

```js
  return {
    ok: true,
    ...,
    items,
    candidatos: validos,
  };
```

(c) `construirModeloPlaca` pasa a derivar las etiquetas (hero y filas) sobre TODOS los visibles:

```js
export function construirModeloPlaca(items, fecha = '') {
  const lista = Array.isArray(items) ? items : [];
  const visibles = lista.filter(i => i && !i.oculto);
  const hero = visibles[0]
    ? { ...visibles[0], añoTexto: visibles[0].año || etiquetaFechaHero(visibles[0].fecha) }
    : null;
  const rows = visibles.slice(1).map(i => ({ ...i, filaTexto: i.año || 'AR' }));
  const verificada = visibles.length > 0 && visibles.every(i => i.verificada !== false);
  return { ok: !!hero, fecha, hero, rows, totalMostrados: visibles.length, total: lista.length, verificada };
}
```

(Nótese que los items normales reciben `añoTexto = año` y `filaTexto = año`; no cambia nada para ellos.)

- [ ] **Step 4: Tests verdes**

Run: `node --test --test-isolation=none efemerides/placa-model.test.mjs`
Expected: PASS (29 previos + 4 nuevos = 33).

- [ ] **Step 5: Commit**

```bash
git add efemerides/placa-model.mjs efemerides/placa-model.test.mjs
git commit -m "feat(efemerides): candidatos completos y etiquetas DD MMM/AR para items sin año"
```

---

### Task 2: Worker — feriados argentinos (`/placas/v2/efemerides/banco`) + prompt Wikipedia ampliado

**Files:**
- Modify: `worker/worker.js`
- Test: `worker/efemerides-copys.test.mjs`

**Interfaces:**
- Consumes: `validEfemeridesDate`, `jsonOk`, `jsonError`, `fechaLargaEf`
- Produces: `normalizarFeriadosAR(data, desdeISO, dias) → Array<{ id, año:'', fecha, titulo, resumen, texto_ampliado, icono:'historia', categoria:'EFEMÉRIDE ARGENTINA', alcance:'nacional', feria:true }>`; `handlePlacasV2EfemeridesBanco(url, env, fetcher)`; rama GET `/placas/v2/efemerides/banco?fecha=YYYY-MM-DD&dias=7`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `worker/efemerides-copys.test.mjs` (y ampliar el `import { ... } from './worker.js'` de la línea 3 con `normalizarFeriadosAR, handlePlacasV2EfemeridesBanco`):

```js
const FERIADOS_2026 = [
  { fecha: '2026-11-09', tipo: 'inamovible', nombre: 'Visita del papa León XIV' },
  { fecha: '2026-11-23', tipo: 'trasladable', nombre: 'Día de la Soberanía Nacional (20/11)' },
  { fecha: '2027-01-01', tipo: 'inamovible', nombre: 'Año nuevo' },
];

test('normalizarFeriadosAR: filtra por rango [desde, desde+dias], limpia (dd/mm) y arma items sin año', () => {
  const r = normalizarFeriadosAR(FERIADOS_2026, '2026-11-18', 7);
  assert.deepEqual(r.map(i => i.id), ['feriado-2026-11-23']);
  assert.equal(r[0].titulo, 'Día de la Soberanía Nacional');
  assert.equal(r[0].año, '');
  assert.equal(r[0].feria, true);
  assert.equal(r[0].categoria, 'EFEMÉRIDE ARGENTINA');
  assert.equal(r[0].icono, 'historia');
  assert.match(r[0].resumen, /23 de noviembre/);
});

test('normalizarFeriadosAR: rango cruzando fin de año incluye el año siguiente', () => {
  const r = normalizarFeriadosAR([...FERIADOS_2026, { fecha: '2026-12-30', tipo: 'inamovible', nombre: 'X' }], '2026-12-29', 4);
  assert.deepEqual(r.map(i => i.id), ['feriado-2026-12-30', 'feriado-2027-01-01']);
});

test('handlePlacasV2EfemeridesBanco: 200 ok con feriados mapeados', async () => {
  const fetcher = async (url) => {
    const year = String(url).match(/feriados\/(\d{4})/)?.[1];
    return { ok: true, json: async () => FERIADOS_2026.filter(f => f.fecha.startsWith(year)) };
  };
  const res = await handlePlacasV2EfemeridesBanco(new URL('https://x/?fecha=2026-11-18&dias=7'), {}, fetcher);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.feriados.map(f => f.id), ['feriado-2026-11-23']);
});

test('handlePlacasV2EfemeridesBanco: fetch caído → 200 con feriados: []', async () => {
  const fetcher = async () => { throw new Error('red caída'); };
  const res = await handlePlacasV2EfemeridesBanco(new URL('https://x/?fecha=2026-11-18'), {}, fetcher);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.feriados, []);
});

test('handlePlacasV2EfemeridesBanco: fecha inválida → 400', async () => {
  const res = await handlePlacasV2EfemeridesBanco(new URL('https://x/?fecha=hoy'), {}, async () => { throw new Error('no llamar'); });
  assert.equal(res.status, 400);
});
```

- [ ] **Step 2: Confirmar que fallan**

Run: `node --test --test-isolation=none worker/efemerides-copys.test.mjs`
Expected: FAIL — `normalizarFeriadosAR is not a function`.

- [ ] **Step 3: Implementar en `worker/worker.js`**

(a) Tras `function itemsCopysReparados(...) {...}` (bloque agregado por el trabajo anterior) insertar:

```js
// Feriados argentinos vía api.argentinadatos.com: sin año histórico (la fuente
// no lo trae). Se limpia el sufijo "(dd/mm)" del nombre oficial.
function normalizarFeriadosAR(data, desdeISO, dias = 7) {
  const desde = String(desdeISO || '');
  const diasN = Math.max(0, Math.min(30, Number(dias) || 7));
  const inicio = new Date(desde + 'T12:00:00Z');
  if (Number.isNaN(inicio.getTime())) return [];
  const hasta = new Date(inicio.getTime() + diasN * 86400000);
  const pad = n => String(n).padStart(2, '0');
  const hastaISO = hasta.getUTCFullYear() + '-' + pad(hasta.getUTCMonth() + 1) + '-' + pad(hasta.getUTCDate());
  return (Array.isArray(data) ? data : [])
    .filter(f => f && f.fecha && f.fecha >= desde && f.fecha <= hastaISO)
    .map(f => {
      const nombre = String(f.nombre || '').replace(/\s*\(\d{1,2}\/\d{1,2}\)\s*$/, '').trim();
      const resumen = 'Feriado nacional — ' + fechaLargaEf(f.fecha) + ' de ' + f.fecha.slice(0, 4);
      return { id: 'feriado-' + f.fecha, fecha: f.fecha, año: '', titulo: nombre, resumen, texto_ampliado: resumen, icono: 'historia', categoria: 'EFEMÉRIDE ARGENTINA', alcance: 'nacional', feria: true };
    });
}

async function handlePlacasV2EfemeridesBanco(url, env, fetcher = globalThis.fetch) {
  const date = url.searchParams.get('fecha') || '';
  if (!validEfemeridesDate(date)) return jsonError('Fecha inválida. Usá YYYY-MM-DD.', 400);
  const dias = Math.max(1, Math.min(30, Number(url.searchParams.get('dias')) || 7));
  const inicio = new Date(date + 'T12:00:00Z');
  const hasta = new Date(inicio.getTime() + dias * 86400000);
  const years = inicio.getUTCFullYear() === hasta.getUTCFullYear() ? [inicio.getUTCFullYear()] : [inicio.getUTCFullYear(), hasta.getUTCFullYear()];
  let feriados = [];
  try {
    const respuestas = await Promise.all(years.map(async y => {
      const r = await fetcher('https://api.argentinadatos.com/v1/feriados/' + y, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
      if (!r?.ok) return [];
      const data = await r.json();
      return normalizarFeriadosAR(data, date, dias);
    }));
    feriados = respuestas.flat().filter((f, i, arr) => arr.findIndex(x => x.id === f.id) === i);
  } catch { feriados = []; }
  return jsonOk({ feriados });
}
```

(b) Prompt Wikipedia (la línea que hoy dice "Devolvé entre 5 y 8 opciones, priorizando hechos argentinos."):

```
Devolvé todas las opciones argentinas e internacionales razonables: entre 8 y 15 opciones, priorizando hechos argentinos.
```

(c) Router GET (junto a las otras rutas de efemérides, tras la línea `if(path==="/placas/v2/efemerides/copys") return handlePlacasV2EfemeridesCopys(url, env);`):

```js
      if(path==="/placas/v2/efemerides/banco")          return handlePlacasV2EfemeridesBanco(url, env);
```

(d) Exports: agregar `normalizarFeriadosAR, handlePlacasV2EfemeridesBanco` a la línea de `export { ... }` que hoy exporta `normalizarItemsEditados, handlePlacasV2EfemeridesCopys, handlePlacasV2EfemeridesCopysPost`.

- [ ] **Step 4: Syntax + tests verdes + suite copys**

Run: `node --check worker/worker.js` → silencioso.
Run: `node --test --test-isolation=none worker/efemerides-copys.test.mjs`
Expected: PASS (19 previos + 5 nuevos = 24).

- [ ] **Step 5: Commit selectivo**

```powershell
git diff -U0 worker/worker.js   # verificar que solo aparecen hunks de efemérides/banco
node C:\Users\Miguel\AppData\Local\Temp\opencode\stage-worker-copys.js
# stage-worker-copys.js conserva nuestros hunks y descarta el ajeno (handleVisualGenerar); genera worker-copys.patch
git apply --cached C:\Users\Miguel\AppData\Local\Temp\opencode\worker-copys.patch
git add worker/efemerides-copys.test.mjs
git status --short worker/
# esperado: MM worker/worker.js  y  M  worker/efemerides-copys.test.mjs
git commit -m "feat(worker): /placas/v2/efemerides/banco con feriados argentinos + prompt Wikipedia ampliado"
```

---

### Task 3: Worker copys toleran año vacío (hechos sin año histórico)

**Files:**
- Modify: `worker/worker.js`
- Test: `worker/efemerides-copys.test.mjs`

**Interfaces:**
- Consumes: `emojiPorIconoEf(icono)`, `buildEfemeridesCopysPrompt(items, date, links)`, `buildEfemeridesCopysFallback(items, date, links)`, `garantizarNegritasEf`, `buildCtaComunidad`, `WA_FIRMA`
- Produces: las dos funciones de copys emiten líneas **sin año** para items con `año:''` (nunca `-1` ni `undefined`)

- [ ] **Step 1: Tests que fallan**

Agregar al final de `worker/efemerides-copys.test.mjs`:

```js
const FERIADO_ITEM = { id: 'feriado-2026-11-23', año: '', icono: 'historia', resumen: 'Feriado nacional — 23 de noviembre de 2026', titulo: 'Día de la Soberanía Nacional' };

test('buildEfemeridesCopysPrompt: ítem sin año → línea sin año, sin " -" roto', () => {
  const p = buildEfemeridesCopysPrompt([FERIADO_ITEM], FECHA, LINKS);
  assert.ok(p.includes('Día de la Soberanía Nacional') || p.includes('Feriado nacional'));
  assert.ok(!p.includes('undefined'));
  assert.ok(!/ \s—|\*\*|:\*\*$/.test(p), 'sin dobles guiones raros');
});

test('buildEfemeridesCopysFallback: ítem sin año no rompe ni imprime -1/undefined', () => {
  const { whatsapp, instagram } = buildEfemeridesCopysFallback([FERIADO_ITEM], FECHA, LINKS);
  assert.ok(whatsapp.includes('23 de noviembre de 2026'));
  assert.ok(!whatsapp.includes('undefined') && !whatsapp.includes('-1'));
  assert.ok(!instagram.includes('undefined') && !instagram.includes('-1'));
});
```

- [ ] **Step 2: Confirmar que fallan**

Run: `node --test --test-isolation=none worker/efemerides-copys.test.mjs`
Expected: PASS plausible para el primero, FAIL en el fallback por línea `${emoji} *${i.año}* —` con año vacío → emite `* —` y el test `!whatsapp.includes('-1')` … verificar y ajustar: el test debe fallar o la implementación debe no romper; en cualquier caso escribir el test primero y ver rojo.

- [ ] **Step 3: Implementar**

En `buildEfemeridesCopysPrompt`, reemplazar la línea de `const hechos = ...` por:

```js
const hechos = items.map(i => {
  const texto = i.resumen || i.titulo;
  return i.año ? `${emojiPorIconoEf(i.icono)} ${i.año} — ${texto}` : `${emojiPorIconoEf(i.icono)} ${texto}`;
}).join('\n');
```

En `buildEfemeridesCopysFallback`, reemplazar `const lineas = ...` e `const cuerpoIg = ...` por:

```js
const lineas = items.map(i => {
  const texto = i.resumen || i.titulo;
  return i.año ? `${emojiPorIconoEf(i.icono)} *${i.año}* — ${texto}` : `${emojiPorIconoEf(i.icono)} ${texto}`;
}).join('\n');
const cuerpoIg = items.slice(0, 3).map(i => i.año ? `${i.año}: ${i.resumen || i.titulo}` : `${i.resumen || i.titulo}`).join('; ');
```

`garantizarNegritasEf` no cambia (las líneas sin año no matchean `(\d{3,4})(\s+—\s+)`).

- [ ] **Step 4: Tests verdes**

Run: `node --check worker/worker.js && node --test --test-isolation=none worker/efemerides-copys.test.mjs`
Expected: PASS (24 previos + 2 nuevos = 26). La línea de prompt de feriados nunca calcula antigüedad (no hay año de referencia distinto del actual), pero el guard global sigue activo vía `normalizarEfemeridesCopys` (sin cambios).

- [ ] **Step 5: Commit**

```powershell
node C:\Users\Miguel\AppData\Local\Temp\opencode\stage-worker-copys.js
git apply --cached C:\Users\Miguel\AppData\Local\Temp\opencode\worker-copys.patch
git add worker/efemerides-copys.test.mjs
git status --short worker/
git commit -m "feat(worker): copys efemerides toleran items sin año historico"
```

---

### Task 4: UI del banco — sección plegable, fetch perezoso, AGREGAR desde candidatos

**Files:**
- Create: `efemerides/efemerides-mza.json` (seed)
- Modify: `efemerides/index.html` (sección + estilos)
- Modify: `efemerides/efemerides.mjs` (estado, refs, render, dibujo)

**Interfaces:**
- Consumes: Task 1 (`construirModeloPlaca` con `añoTexto`/`filaTexto`), Task 2 (GET banco), Task 3 (copys sanos); `modelo.candidatos` de `normalizarPayload`
- Produces: sección BANCO DE CANDIDATOS funcional con dedup por sesión y AGREGAR deshabilitado en 6 hechos

- [ ] **Step 1: Seed `efemerides/efemerides-mza.json`** (contenido editorial de Mendoza — todo editable en este archivo):

```json
{
  "01-12": [
    {
      "año": "1817",
      "titulo": "El Cruce de los Andes",
      "resumen": "El Ejército de los Andes, al mando de José de San Martín, cruza la cordillera hacia Chile.",
      "texto_ampliado": "El 12 de enero de 1817 el Ejército de los Andes, bajo el mando del General José de San Martín, inició el Cruce de los Andes desde Mendoza rumbo a Chile: una de las hazañas militares más grandes de la historia americana.",
      "icono": "historia"
    }
  ],
  "03-02": [
    {
      "año": "1561",
      "titulo": "Fundación de Mendoza",
      "resumen": "Pedro del Castillo funda la Ciudad de Mendoza, en honor al gobernador García Hurtado de Mendoza.",
      "texto_ampliado": "El 2 de marzo de 1561, Pedro del Castillo fundó la ciudad de Mendoza del Nuevo Valle de Rioja, junto al río que hoy lleva su nombre: la primera y única ciudad fundada en nombre de un gobernador del Perú, García Hurtado de Mendoza.",
      "icono": "historia"
    }
  ],
  "03-20": [
    {
      "año": "1861",
      "titulo": "El terremoto que destruyó Mendoza",
      "resumen": "Un devastador terremoto destruye la ciudad colonial de Mendoza en un minuto 27 segundos.",
      "texto_ampliado": "El 20 de marzo de 1861 la ciudad de Mendoza fue arrasada por un terremoto de magnitud estimada 7,2: en poco más de un minuto murieron alrededor de 6.000 personas y la ciudad colonial quedó destruida; la planificación de la ciudad nueva fue dirigida por Domingo Faustino Sarmiento.",
      "icono": "historia"
    }
  ]
}
```

- [ ] **Step 2: HTML — sección plegable después de `#editorPlaca` y antes de `#copysPanel`**:

```html
    <section id="bancoPanel" hidden>
      <button id="btnBanco" type="button" class="secundario chico banco-toggle">BANCO DE CANDIDATOS <span id="bancoCount" class="banco-count"></span></button>
      <div id="bancoListaWrap" class="banco-lista-wrap" hidden>
        <p class="editor-hint">Agregá a la placa lo que hoy quedó afuera. Los marcados con ✓ ya están.</p>
        <ul id="bancoLista" class="banco-lista"></ul>
        <p id="bancoVacio" class="banco-vacio" hidden>Sin candidatos extra para esta fecha.</p>
      </div>
    </section>
```

Y al final del `<style>` (antes de `@font-face`):

```css
  #bancoPanel { margin-top:4px; display:flex; flex-direction:column; gap:10px; }
  .banco-toggle { align-self:flex-start; }
  .banco-count { color:var(--atenuado); font-size:12px; }
  .banco-lista-wrap { border:1px dashed rgba(245,241,230,.25); border-radius:6px; padding:12px; display:flex; flex-direction:column; gap:10px; }
  .banco-lista { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
  .banco-card { display:flex; align-items:center; gap:12px; border:1px solid rgba(245,241,230,.14); border-radius:6px; padding:8px 12px; }
  .fuente-badge { flex-shrink:0; font-size:10px; letter-spacing:1px; border-radius:3px; padding:4px 8px; font-family:Oswald, sans-serif; border:1px solid var(--dorado); color:var(--dorado); }
  .fuente-badge.mendoza { background:var(--dorado); color:#10151f; font-weight:700; border-color:var(--dorado); }
  .banco-anio { flex-shrink:0; width:72px; text-align:center; font-family:Oswald, sans-serif; font-weight:700; font-size:22px; color:var(--crema); }
  .banco-info { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:2px; }
  .banco-titulo { font-weight:600; font-size:13px; color:var(--crema); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .banco-resumen { color:var(--atenuado); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .banco-vacio { margin:0; color:var(--atenuado); font-size:13px; }
```

- [ ] **Step 3: `efemerides/efemerides.mjs` — dibujarPlaca usa etiquetas**

Reemplazar las dos líneas que dibujan años (con `medida` donde aplica):
- `ctx.fillText(modelo.hero.año, 64, y);` → `ctx.fillText(modelo.hero.añoTexto || modelo.hero.año, 64, y);`
- `const cajaAño = ctx.measureText(modelo.hero.año);` → `const cajaAño = ctx.measureText(modelo.hero.añoTexto || modelo.hero.año);`
- `ctx.fillText(fila.año, 64, y + 2);` → `ctx.fillText(fila.filaTexto || fila.año, 64, y + 2);`

- [ ] **Step 4: `efemerides/efemerides.mjs` — banco completo**

Refs en `ui`:

```js
  banco: $('bancoPanel'), btnBanco: $('btnBanco'), bancoCount: $('bancoCount'),
  bancoListaWrap: $('bancoListaWrap'), bancoLista: $('bancoLista'), bancoVacio: $('bancoVacio'),
```

Estado junto a `let itemsOriginales = [];`:

```js
let candidatosWikipedia = []; // extras del GET más allá de los 6 de la placa
let idsBancoAgregados = new Set();
let bancoPool = [];
let bancoListLoaded = false;
```

Agregar `limpiarBanco()` y llamarla dentro de `resetearEditor()` como última línea:

```js
function limpiarBanco() {
  candidatosWikipedia = [];
  idsBancoAgregados = new Set();
  bancoPool = [];
  bancoListLoaded = false;
  ui.bancoLista.replaceChildren();
  ui.bancoVacio.hidden = true;
  ui.bancoCount.textContent = '';
  ui.bancoListaWrap.hidden = true;
  ui.bancoPanel.hidden = true;
}
```

En `cargar(fecha)`, junto a `ui.editor.hidden = false;` agregar:

```js
      ui.bancoPanel.hidden = false;
      cargarCandidatosWikipedia(modelo.candidatos || []);
```

Funciones (poner ANTES de `redibujarPlaca`):

```js
function cargarCandidatosWikipedia(candidatos) {
  const enPlaca = new Set(itemsPlaca.map(i => i.id));
  candidatosWikipedia = (Array.isArray(candidatos) ? candidatos : [])
    .filter(c => c && !enPlaca.has(c.id))
    .map(c => ({
      id: String(c.id || nuevoIdLocal()),
      año: String(c.año || ''), fecha: '',
      titulo: String(c.titulo || ''), resumen: String(c.resumen || ''),
      ampliado: String(c.ampliado || c.resumen || ''),
      icono: c.icono || 'historia', categoria: String(c.categoria || 'HISTORIA'),
      fuente: 'Wikipedia', feria: false,
    }));
}

async function candidatosMendoza(desdeISO) {
  try {
    const res = await fetch(new URL('./efemerides-mza.json', import.meta.url).href, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const [y, mo, d] = String(desdeISO).split('-').map(Number);
    const inicio = Date.UTC(y, mo - 1, d);
    const fechas = new Set();
    for (let i = 0; i <= 7; i += 1) {
      const dia = new Date(inicio + i * 86400000);
      fechas.add(String(dia.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dia.getUTCDate()).padStart(2, '0'));
    }
    return Object.entries(data || {})
      .filter(([clave, lista]) => fechas.has(clave) && Array.isArray(lista))
      .flatMap(([, lista]) => lista
        .filter(h => h && h.titulo && h.resumen && h.año)
        .map(h => ({ id: 'mza-' + h.año + '-' + String(h.titulo), año: String(h.año), fecha: '', titulo: h.titulo, resumen: h.resumen, ampliado: h.texto_ampliado || h.resumen, icono: h.icono || 'historia', categoria: 'MENDOZA', fuente: 'Mendoza', feria: false })));
  } catch { return []; }
}

async function candidatosFeriados(desdeISO) {
  try {
    const res = await fetch(WORKER_URL + '/placas/v2/efemerides/banco?fecha=' + encodeURIComponent(desdeISO) + '&dias=7');
    const raw = await res.json().catch(() => null);
    return Array.isArray(raw?.feriados) ? raw.feriados : [];
  } catch { return []; }
}

async function abrirBanco() {
  ui.bancoListaWrap.hidden = false;
  if (bancoListLoaded) { renderBancoPool(); return; }
  bancoListLoaded = true;
  ui.bancoCount.textContent = '…';
  const [feriados, mendoza] = await Promise.all([candidatosFeriados(fechaActual), candidatosMendoza(fechaActual)]);
  bancoPool = [...candidatosWikipedia, ...feriados, ...mendoza];
  renderBancoPool();
}

function renderBancoPool() {
  ui.bancoLista.replaceChildren();
  ui.bancoVacio.hidden = bancoPool.length > 0;
  ui.bancoCount.textContent = bancoPool.length ? `(${bancoPool.length})` : '';
  for (const c of bancoPool) ui.bancoLista.append(crearTarjetaBanco(c));
}

function crearTarjetaBanco(c) {
  const li = document.createElement('li');
  li.className = 'banco-card';
  const fuente = String(c.fuente || 'Wikipedia').toUpperCase();
  const badge = document.createElement('span');
  badge.className = 'fuente-badge' + (fuente === 'MENDOZA' ? ' mendoza' : '');
  badge.textContent = fuente === 'ARGENTINADATOS.COM' || c.feria ? 'EFEMÉRIDE AR' : fuente;
  const anio = document.createElement('span');
  anio.className = 'banco-anio';
  if (c.año) anio.textContent = c.año;
  else {
    const f = String(c.fecha || '');
    anio.textContent = String(Number(f.slice(8, 10))) + ' ' + (['', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][Number(f.slice(5, 7)) - 1] || '');
  }
  const info = document.createElement('div');
  info.className = 'banco-info';
  const titulo = document.createElement('span');
  titulo.className = 'banco-titulo'; titulo.textContent = c.titulo;
  const resumen = document.createElement('span');
  resumen.className = 'banco-resumen'; resumen.textContent = c.resumen;
  info.append(titulo, resumen);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chico' + (idsBancoAgregados.has(c.id) ? ' secundario' : '');
  btn.textContent = idsBancoAgregados.has(c.id) ? '✓ EN LA PLACA' : '+ AGREGAR';
  btn.disabled = idsBancoAgregados.has(c.id) || itemsPlaca.length >= 6;
  if (btn.disabled && !idsBancoAgregados.has(c.id)) btn.title = 'La placa ya tiene 6 hechos';
  btn.addEventListener('click', () => agregarDesdeBanco(c));
  li.append(badge, anio, info, btn);
  return li;
}

function agregarDesdeBanco(c) {
  if (itemsPlaca.length >= 6 || idsBancoAgregados.has(c.id)) return;
  const hecho = {
    id: 'banco-' + (c.id || nuevoIdLocal()),
    año: String(c.año || ''), fecha: String(c.fecha || ''), titulo: String(c.titulo),
    resumen: String(c.resumen), ampliado: String(c.ampliado || c.resumen),
    icono: String(c.icono || 'historia'), categoria: String(c.categoria || 'EFEMÉRIDE ARGENTINA'),
    oculto: false, verificada: false,
    fuente: c.feria ? 'argentinadatos.com' : (String(c.fuente || '').toLowerCase() === 'mendoza' ? 'Media Mendoza' : 'Wikipedia'),
  };
  itemsPlaca.push(hecho);
  idsBancoAgregados.add(c.id);
  editado = true;
  redibujarPlaca();
  renderEditor();
  renderBancoPool();
}
```

Al pie, junto a los otros listeners:

```js
ui.btnBanco.addEventListener('click', () => {
  if (ui.bancoListaWrap.hidden) abrirBanco(); else ui.bancoListaWrap.hidden = true;
});
```

- [ ] **Step 5: Sintaxis + navegador local**

Run: `node --check efemerides/efemerides.mjs` → limpio.
Run: `python -m http.server 8899` (background) y abrir `http://localhost:8899/efemerides/`.

- [ ] **Step 6: Commit**

```bash
git add efemerides/efemerides-mza.json efemerides/index.html efemerides/efemerides.mjs
git commit -m "feat(efemerides): banco de candidatos (wikipedia, feriados AR, mendoza JSON)"
```

---

### Task 5: Integración — suite completa + push

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Suite completa** (comando de AGENTS.md + `efemerides/placa-model.test.mjs` incluido). Expected: todo verde (604 base + nuevos 11 aprox.).
- [ ] **Step 2: `node --check worker/worker.js` y `node --check efemerides/efemerides.mjs`** → limpios.
- [ ] **Step 3: Push**

```bash
git push origin main
```

---

### Task 6: QA en el navegador + recordatorio de deploy

**Contexto:** feriados y Wikipedia ampliada viven en el worker → requieren deploy manual para brillar en prod. La parte cliente (Mendoza JSON, UI) funciona ya con el GET actual (los `candidatos` son los extras de lo cacheado si la cache v5 los trae; con cache viejo de 5–8 items puede no haber extras).

- [ ] **Step 1:** Servidor local + `http://localhost:8899/efemerides/`.
- [ ] **Step 2: Checks**
1. La placa arranca idéntica a hoy (6 o 5 hechos como hasta ahora, sin cambios visuales).
2. Botón **BANCO DE CANDIDATOS** visible al pie del editor.
3. Abrir banco → feriados del rango: el 18/11, el rango alcanza el 25 → debe aparecer «23 NOV — Día de la Soberanía Nacional» con badge EFEMÉRIDE AR.
4. Sin feriados en el rango → «Sin candidatos extra para esta fecha.» o solo Wikipedia/Mendoza.
5. «+ AGREGAR» en un feriado → entra a la placa; el PNG dibuja `23 NOV` grande y `AR` en filas. Contador pasa a 6 y el botón del banco queda deshabilitado con tooltip.
6. Mendoza: cambiando la fecha a 2026-01-12 aparecen candidatos Mendoza (Cruce de los Andes) con badge dorado.
7. «✓ EN LA PLACA» tras agregar (no duplica). El feriado agregado se oculta/destaca como cualquier hecho.
8. RESTABLECER devuelve la placa original (el feriado agregado desaparece). Cambiar la fecha resetea banco y editor.
9. Sin abrir el banco, la placa se comporta exactamente como antes.
- [ ] **Step 3: Recordatorio al usuario (obligatorio)**

Pegar `worker/worker.js` en el dashboard (Cloudflare Workers → `mm-herramientas-worker` → Edit → Deploy). Con eso llegan: el fix de antigüedades/negritas, la rama POST de copys y este endpoint `/banco` + prompt Wikipedia ampliado. Sin deploy, el banco responde `feriados: []` (el cliente lo tolera) y Wikipedia seguiría con la cache vieja.

---

## Self-review contra el spec

- Objetivo banco + editor intacto: Task 4 ✓ (estado/restore, destacada=1ª visible intactos)
- Wikipedia ampliada + extras sin 2da llamada: Task 2 (prompt) + Task 1 (`candidatos` en payload) ✓
- Feriado API sin año, 7 días, limpia (dd/mm), sin KV: Task 2 ✓
- Mendoza JSON seed editable, rango 7 días: Task 4 Step 1 + Step 4 ✓
- Dibujo DD MMM / filas AR: Task 1 (modelo) + Task 4 Step 3 ✓
- Copys toleran año vacío: Task 3 ✓
- Tope 6 hechos en banco AGREGAR + dedup sesión: Task 4 Step 4 ✓
- Criterios de aceptación del spec sección 7: Task 5 (suite) + Task 6 (QA) ✓
- Fuera de alcance respetado: sin persistencia, sin KV nuevos ✓

## Convenciones de commit

- `feat|fix|docs(scope):` en español. Nunca `git add -A`. Worker: staging por hunks hasta que el hunk ajeno `handleVisualGenerar` se resuelva.
- `visual-suite/*`, `.wrangler/`, `opencode.json`, hunk ajeno: intactos.

