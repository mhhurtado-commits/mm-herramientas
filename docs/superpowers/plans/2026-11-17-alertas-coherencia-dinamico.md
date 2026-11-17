# Alertas: coherencia con efemérides + layout dinámico — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Las placas de `/alertas/` se ven coherentes con `/efemerides/` (sin ser iguales) y el cuerpo llena la altura restante según la cantidad de contenido.

**Architecture:** Canvas programático único (preview y export del mismo `<canvas>`), sin dependencias ni bundler. El factor de escalado del cuerpo se calcula con una función pura exportada (`calcularFactor`); el renderer la usa internamente y un `ctx` simulado permite testear el render completo. Fuentes locales (`assets/Inter-Variable.woff2`, `assets/Oswald-Variable.woff2`) vía `FontFace`, como en efemérides.

**Tech Stack:** HTML/CSS/JS vanilla + canvas 2D. Node 24 + `node --test` para tests. Sin build.

## Global Constraints

- Alcance: SOLO `/alertas/`. No tocar `/efemerides/`, `index.html` (hub), `/placas-v2/`, `worker/worker.js`, `_headers`, `_redirects`.
- Fondo de placa: `#0F1520` plano. Acento (solo alertas): `#f5c518`. Neutros idénticos a efemérides: crema `#F5F1E6`, atenuado `rgba(245,241,230,.78)`, amplio `rgba(245,241,230,.72)`, regla fina `rgba(245,241,230,.25)`.
- Arial Black desaparece: Oswald 700 (titular) y Oswald 600 (chip ALERTA, etiquetas de zona, columna derecha del footer). Cuerpo e Inter como hoy.
- `FORMATS` exactos: `1:1` 1600×1600, `4:5` 1350×1688, `9:16` 1080×1920.
- Escalado del cuerpo: `factor = clamp(disponible / natural, 0.55, 2.4)` (PISO_ESCALA=0.55, TOPE_ESCALA=2.4). NUNCA se corta un bloque de zona.
- Fuentes locales en ambos archivos `.mjs`/HTML vía FontFace (eliminar `<link>` de Google Fonts y los `@font-face` ya existen en assets).
- Verificación: `node --test --test-isolation=none alertas/*.test.mjs` (17 tests actuales + los nuevos, todos verdes). `node --check` sobre los `.mjs`.
- Commits solo de los archivos del feature; el usuario commiteó sus propios cambios aparte.
- Publicación (commit+push→Pages) SOLO con pedido explícito del usuario.

---

### Task 1: `calcularFactor` puro + tests

**Files:**
- Create: `alertas/renderer.test.mjs`
- Modify: `alertas/renderer.mjs` (agrega constantes y función; no cambia el dibujo aún)

**Interfaces:**
- Produces: `PISO_ESCALA` (0.55), `TOPE_ESCALA` (2.4), `calcularFactor(natural: number, disponible: number): number` — puro, sin DOM.

- [ ] **Step 1: Write the failing test**

Crear `alertas/renderer.test.mjs`:

```js
// alertas/renderer.test.mjs — tests del layout dinámico del cuerpo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORMATS, PISO_ESCALA, TOPE_ESCALA, calcularFactor, renderAlertasPlaca } from './renderer.mjs';

test('FORMATS exactos', () => {
  assert.deepEqual(FORMATS['1:1'], { width: 1600, height: 1600 });
  assert.deepEqual(FORMATS['4:5'], { width: 1350, height: 1688 });
  assert.deepEqual(FORMATS['9:16'], { width: 1080, height: 1920 });
});

test('calcularFactor: sube con disponibilidad, queda en 1 en el punto natural', () => {
  assert.equal(calcularFactor(1000, 1000), 1);
  assert.equal(calcularFactor(1000, 1600), 1.6);
  assert.equal(calcularFactor(1000, 400), PISO_ESCALA);
  assert.equal(calcularFactor(1000, 100000), TOPE_ESCALA);
});

test('calcularFactor: degenerados nunca devuelven NaN', () => {
  assert.equal(calcularFactor(0, 500), TOPE_ESCALA);
  assert.equal(calcularFactor(NaN, 500), TOPE_ESCALA);
  assert.equal(calcularFactor(1000, 0), PISO_ESCALA);
  assert.equal(calcularFactor(1000, -5), PISO_ESCALA);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none alertas/renderer.test.mjs`
Expected: FAIL — `PISO_ESCALA` / `calcularFactor` no existen (export missing).

- [ ] **Step 3: Minimal implementation**

En `alertas/renderer.mjs`, debajo de `FORMATS`, agregar:

```js
// Escalado dinámico del cuerpo: llena la altura restante entre byline y footer.
// 1 celda corta → factor alto (placa llena); 3 celdas largas + ETA → factor bajo (nunca se corta un bloque).
export const PISO_ESCALA = 0.55;
export const TOPE_ESCALA = 2.4;

export function calcularFactor(natural, disponible) {
  if (!Number.isFinite(natural) || natural <= 0) return TOPE_ESCALA;
  if (!Number.isFinite(disponible) || disponible <= 0) return PISO_ESCALA;
  return Math.min(TOPE_ESCALA, Math.max(PISO_ESCALA, disponible / natural));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-isolation=none alertas/renderer.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add alertas/renderer.mjs alertas/renderer.test.mjs
git commit -m "feat(alertas): calcularFactor puro para el escalado dinamico del cuerpo"
```

### Task 2: Renderer — re-skin efemérides + cuerpo dinámico

**Files:**
- Modify: `alertas/renderer.mjs` (reescritura completa del cuerpo del archivo)
- Modify: `alertas/renderer.test.mjs` (agrega tests de integración con ctx simulado)

**Interfaces:**
- Consumes: `PISO_ESCALA`, `TOPE_ESCALA`, `calcularFactor` (Task 1).
- Produces: `renderAlertasPlaca(ctx, data, formatKey = '4:5', logoImg = null)` — misma firma pública. Dibuja siempre todas las celdas con `zonas` no vacías (nunca se corta un bloque).

- [ ] **Step 1: Write the failing integration tests**

Agregar a `alertas/renderer.test.mjs`:

```js
function mockCtx() {
  const texts = [];
  const ctx = {
    font: '10px Inter', fillStyle: '', strokeStyle: '', lineWidth: 1,
    textAlign: 'left', textBaseline: 'alphabetic',
    fillRect() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arcTo() {},
    fill() {}, stroke() {}, drawImage() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(t) {
      const px = Number((this.font.match(/(\d+(?:\.\d+)?)px/) || [])[1]) || 10;
      return { width: String(t).length * px * 0.5 };
    },
    fillText(t) {
      const px = Number((this.font.match(/(\d+(?:\.\d+)?)px/) || [])[1]) || 0;
      texts.push({ text: String(t), size: px });
    },
  };
  return { ctx, texts };
}
const celda = (etiqueta, zonas, detalle, hacia = '') => ({ etiqueta, zonas, detalle, hacia });
const datos = (celdas, extra = {}) => ({
  titular: 'TORMENTAS CON GRANIZO', fuente: 'RADAR SAN RAFAEL-AEMSA', fecha: '17/11', hora: '20:08',
  nivel: 'naranja', direccion: '', celdas, eta: null, ...extra,
});
const GRUESA = (z) => z.split(',')[0]; // primera palabra/zona de cada celda

test('3 celdas largas + ETA: ninguna zona se pierde (nunca se corta un bloque)', () => {
  const { ctx, texts } = mockCtx();
  const d = datos([
    celda('ahora', 'Calle Larga, Atuel Norte y Villa Atuel', 'lluvia fuerte y granizo', 'este'),
    celda('ruta', 'Las Aguaditas y Real del Padre', 'lluvia fuerte con granizo desplazándose al este', 'este'),
    celda('siguiente', 'Ruta 144 a la altura del Desvío, dirección Cañón del Atuel y Valle Grande', 'tormenta con granizo cruzando', 'este'),
  ], { eta: { lugar: 'Valle Grande', detalle: 'llegada al Embalse', minutos: 10 } });
  renderAlertasPlaca(ctx, d, '9:16', null);
  const texto = texts.map((t) => t.text).join(' ');
  for (const c of d.celdas) assert.ok(texto.includes(GRUESA(c.zonas)), `falta celda ${c.etiqueta}`);
  assert.ok(texto.includes('Valle Grande'), 'falta banner ETA');
});

test('1 celda corta en 1:1: el cuerpo se agranda (factor alto)', () => {
  const { ctx, texts } = mockCtx();
  const d = datos([celda('ahora', 'Atuel Norte', 'lluvia', '')]);
  renderAlertasPlaca(ctx, d, '1:1', null);
  const cuerpo = texts.find((t) => t.text.startsWith('Atuel Norte'));
  const base = Math.round(1600 * 0.0245); // 39px
  assert.ok(cuerpo.size >= Math.round(base * 1.5), `cuerpo insuficiente: ${cuerpo.size}px`);
});

test('footer coherente: FUENTE izq, dominio centro, etiqueta der; ETA nula → sin banner', () => {
  const { ctx, texts } = mockCtx();
  const d = datos([celda('ahora', 'Atuel Norte', 'lluvia', '')]);
  renderAlertasPlaca(ctx, d, '4:5', null);
  const texto = texts.map((t) => t.text).join(' | ');
  assert.ok(texto.includes('FUENTE: RADAR SAN RAFAEL-AEMSA'));
  assert.ok(texto.includes('WWW.MEDIAMENDOZA.COM'));
  assert.ok(texto.includes('ALERTA DE TORMENTAS'));
  assert.ok(!texto.includes('llegada en'), 'ETA nula no debe dibujar banner');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test --test-isolation=none alertas/renderer.test.mjs`
Expected: FAIL — no exporta nada nuevo aún y el footer viejo no tiene esos textos; con 3 celdas largas se corta una.

- [ ] **Step 3: Reescribir `alertas/renderer.mjs`**

Contenido completo del archivo (reemplaza todo lo existente, conservando `roundRect` y `wrapLines`):

```js
// alertas/renderer.mjs — dibuja la placa en canvas. Sin DOM; ctx se recibe como argumento.
// Lenguaje visual coherente con /efemerides/ (fondo #0F1520, neutros, footer 3 columnas,
// regla de acento bajo la banda) conservando la firma de urgencia (borde amarillo, chip ALERTA).

export const FORMATS = {
  '1:1': { width: 1600, height: 1600 },
  '4:5': { width: 1350, height: 1688 },
  '9:16': { width: 1080, height: 1920 },
};

export const PISO_ESCALA = 0.55;
export const TOPE_ESCALA = 2.4;

export function calcularFactor(natural, disponible) {
  if (!Number.isFinite(natural) || natural <= 0) return TOPE_ESCALA;
  if (!Number.isFinite(disponible) || disponible <= 0) return PISO_ESCALA;
  return Math.min(TOPE_ESCALA, Math.max(PISO_ESCALA, disponible / natural));
}

const CREMA = '#F5F1E6';
const ATENUADO = 'rgba(245,241,230,.78)';
const REGLA = 'rgba(245,241,230,.25)';
const ACENTO = '#f5c518';
const ACENTO_FONDO = 'rgba(245,197,24,.08)';
const FONDO = '#0F1520';
const NEGRO = '#141414';
const ROJO = '#c0392b';

function roundRect(ctx, x, y, w, h, r) { /* igual que hoy */ }
function wrapLines(ctx, text, maxWidth) { /* igual que hoy */ }

const ETIQUETA_LABEL = { ahora: 'AFECTANDO AHORA', ruta: 'EN RUTA', siguiente: 'PRÓXIMO' };
const padOf = (W) => Math.round(W * 0.042);

function metricasCuerpo(W, f) {
  return {
    gap: Math.round(W * 0.016 * f), padV: Math.round(W * 0.0135 * f),
    labelH: Math.round(W * 0.020 * f), bodyFS: Math.round(W * 0.0245 * f),
    bodyLH: Math.round(W * 0.031 * f), labelFS: Math.round(W * 0.0125 * f),
    pillW: Math.round(W * 0.084 * f), pillH: Math.round(W * 0.028 * f),
    pillFS: Math.round(W * 0.0135 * f),
    etaFS: Math.round(W * 0.0175 * f), etaLH: Math.round(W * 0.023 * f),
    etaPadV: Math.round(W * 0.017 * f), etaPadL: Math.round(W * 0.016 * f),
    bar: Math.max(4, Math.round(W * 0.004 * f)),
  };
}

const textoEta = (eta) => `⚡ ${eta.lugar}: llegada en ${eta.minutos} min — ${eta.detalle}`;

function altoNaturalCuerpo(ctx, celdas, eta, W) {
  const pad = padOf(W);
  const m = metricasCuerpo(W, 1);
  let total = 0;
  for (const celda of celdas) {
    if (!celda.zonas) continue;
    const towardPill = celda.hacia ? m.pillW + Math.round(W * 0.014) : 0;
    const bodyMax = Math.max(1, W - pad * 2 - m.padV * 2 - towardPill);
    ctx.font = `500 ${m.bodyFS}px Inter, Arial, sans-serif`;
    const lines = wrapLines(ctx, `${celda.zonas} — ${celda.detalle}`, bodyMax).length || 1;
    total += m.padV * 2 + m.labelH + lines * m.bodyLH + Math.round(W * 0.004) + m.gap;
  }
  if (eta && eta.lugar) {
    ctx.font = `800 ${m.etaFS}px Inter, Arial, sans-serif`;
    const lines = wrapLines(ctx, textoEta(eta), W - pad * 2 - Math.round(W * 0.032)).slice(0, 3).length;
    total += lines * m.etaLH + m.etaPadV + m.gap;
  }
  return total;
}
```

Render (resumen de cambios exactos dentro `renderAlertasPlaca`):

1. Fondo plano: `ctx.fillStyle = FONDO; ctx.fillRect(0, 0, W, H);` (sin gradiente).
2. Borde exterior: igual, `ACENTO`.
3. Banda header: `chipW = round(W*0.19)`, `chipH = round(W*0.047)`; texto chip `600 ${round(W*0.026)}px Oswald`; logo igual (`logoH = chipH*1.32`); fecha `600 ${round(W*0.0175)}px Oswald` en ACENTO bajo el logo.
4. Regla acento: `ruleH = max(3, round(W*0.0035))`; `ruleY = chipY + chipH + W*0.038`; `fillRect(pad, ruleY, W-2*pad, ruleH)`.
5. Titular: `700 ${round(W*0.06)}px Oswald`; `y = ruleY + W*0.075`; interlineado `W*0.061`; CREMA.
6. Byline: igual (Inter 700 caps ACENTO).
7. Cuerpo: `bottomLimit = H - round(pad*1.6) - round(W*0.021)`; `disponible = max(0, bottomLimit - y)`; `natural = altoNaturalCuerpo(...)`; `f = calcularFactor(natural, disponible)`; `m = metricasCuerpo(W, f)`. Loop de celdas SIEMPRE dibuja todo (sin `break`); bloque: fondo `ACENTO_FONDO`, barra izquierda `m.bar` en `ACENTO`, etiqueta `600 ${m.labelFS}px Oswald` ACENTO, cuerpo `500 ${m.bodyFS}px Inter` CREMA, pill `→ X` `600 ${m.pillFS}px Oswald` NEGRO sobre ACENTO.
8. ETA banner: `800 ${m.etaFS}px Inter`, líneas `slice(0,3)`, alto `lines*m.etaLH + m.etaPadV`, fondo ROJO, texto `#ffffff`. Se dibuja anclado a `y` (tras la última celda); `y += etaH + m.gap`.
9. Footer 3 columnas: regla fina (`REGLA`, `lineWidth max(1, round(W*0.0012))`) en `footRuleY = H - round(pad*0.92)`; `footY = H - round(pad*0.45)`; izq `FUENTE: <fuente caps>` `500 round(W*0.0135)px Inter` ATENUADO; centro `WWW.MEDIAMENDOZA.COM` `600 round(W*0.0155)px Oswald` CREMA; der `ALERTA DE TORMENTAS` `600 round(W*0.016)px Oswald` ACENTO. Sin `MEDIA MENDOZA` de texto ni fecha.

Código completo final = el intermedio exactamente con estas fórmulas (mismos nombres que la versión actual; `roundRect`/`wrapLines` sin cambios).

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test --test-isolation=none alertas/renderer.test.mjs`
Expected: PASS (todos, incl. integración).

- [ ] **Step 5: Commit**

```bash
git add alertas/renderer.mjs alertas/renderer.test.mjs
git commit -m "feat(alertas): lenguaje visual coherente con efemerides y cuerpo dinamico (factor 0.55-2.4)"
```

### Task 3: Fuentes locales (Inter + Oswald) en la página y el canvas

**Files:**
- Modify: `alertas/index.html` (eliminar `<link>` Google Fonts; agregar `@font-face` locales)
- Modify: `alertas/app.mjs` (cargar FontFace antes del primer render)

**Interfaces:**
- Consumes: nada de tasks anteriores (independiente), pero verificar después de Task 2.

- [ ] **Step 1: Reemplazar el `<link>` en `index.html`**

Hoy línea 7: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`. Eliminarlo y dentro del `<style>` inline agregar (idéntico a efemerides):

```css
  @font-face { font-family:'Inter'; font-style:normal; font-weight:100 900; font-display:swap; src:url('../assets/Inter-Variable.woff2') format('woff2'); }
  @font-face { font-family:'Oswald'; font-style:normal; font-weight:200 700; font-display:swap; src:url('../assets/Oswald-Variable.woff2') format('woff2'); }
```

- [ ] **Step 2: Cargar las caras en `app.mjs`**

Luego del bloque `// ─── Render + export`, agregar:

```js
// Fuentes locales (mismo mecanismo que /efemerides/): necesarias para que el canvas pinte Oswald/Inter.
const CARAS = [
  ['Inter', '../assets/Inter-Variable.woff2', '100 900'],
  ['Oswald', '../assets/Oswald-Variable.woff2', '200 700'],
];

function cargarFuentes() {
  return Promise.all(CARAS.map(async ([nombre, ruta, peso]) => {
    const face = new FontFace(nombre, `url(${new URL(ruta, import.meta.url).href}) format('woff2')`, { weight: peso });
    await face.load();
    document.fonts.add(face);
  }));
}
```

Y en el bloque `// ─── Init`, reemplazar la línea final:

```js
if (document.fonts?.ready) document.fonts.ready.then(() => render());
```

por:

```js
cargarFuentes().then(() => render()).catch(() => {});
if (document.fonts?.ready) document.fonts.ready.then(() => render());
```

- [ ] **Step 3: Verificar en navegador**

Levantar `python -m http.server 8123` (background), abrir `http://localhost:8123/alertas/`, pegar un parte de ejemplo, **Generar**, y confirma en consola: `document.fonts.check('700 20px Oswald')` → `true`. Detener el servidor.

- [ ] **Step 4: Commit**

```bash
git add alertas/index.html alertas/app.mjs
git commit -m "feat(alertas): fuentes locales Inter+Oswald (FontFace), se elimina Google Fonts"
```

### Task 4: Verificación final (E2E visual + suite) y publicación

**Files:** ninguno permanente; los screenshots van a `C:\Users\Miguel\AppData\Local\Temp\opencode\`.

- [ ] **Step 1: Suite y sintaxis**

Run:
```powershell
node --check alertas/renderer.mjs; node --check alertas/app.mjs
node --test --test-isolation=none alertas/*.test.mjs
```
Expected: sin errores; todos los tests verdes (17 existentes + 6 nuevos ≈ 23).

- [ ] **Step 2: E2E en navegador con parte real**

Levantar servidor local, abrir `/alertas/`, pegar:
```
Reporte Meteorológico
Informa el Sr. Marcelo Peña de Radar San Rafael-AEMSA:
-La tormenta comienza a afectar con lluvia fuerte y granizo a Calle Larga, Atuel Norte y Villa Atuel. Sigue desplazándose hacia el este, y podría afectar más tarde a Las Aguaditas, Real del Padre y el sector norte de Jaime Prats.
-Otra tormenta con granizo comienza a cruzar la Ruta 144 a la altura del Desvío. Se desplaza al este, con dirección al Cañón del Atuel y Valle Grande.
```
Generar → screenshot de 1:1, 4:5 y 9:16. Verificar: ninguna zona cortada, ETA (si aplica) con banner, header con regla amarilla, footer 3 columnas, y que con 2–3 celdas el cuerpo llena el lienzo (sin aire vacío como en la captura previa del usuario).

- [ ] **Step 3: Detener el servidor y reportar**

`taskkill /PID <pid> /F`. Reportar al usuario con las capturas; **NO** hacer push sin pedido explícito. Si el usuario autoriza, push a `origin/main` (Pages despliega) y verificar que `mediamendoza.pages.dev/alertas/` sirva la versión nueva.

## Self-review contra el spec

| Requisito del spec | Tarea |
| --- | --- |
| Fondo `#0F1520`, acento `#f5c518`, neutros idénticos a efemérides | Task 2 (paleta) |
| Oswald 700/600; Inter cuerpo; fin de Arial Black; fuentes locales FontFace | Task 2 (strings) + Task 3 (index/app) |
| Banda header: chip más grande, logo der, fecha Oswald acento, regla 4px amarilla | Task 2 (banda) |
| Titular Oswald 700 `W*0.06` | Task 2 (titular) |
| Cuerpo dinámico `factor = clamp(disponible/natural, 0.55, 2.4)`, sin bloques cortados | Task 1 (función) + Task 2 (integración) |
| Footer 3 columnas (FUENTE izq · WWW.MEDIAMENDOZA.COM centro · ALERTA DE TORMENTAS der), más grande, regla 2px | Task 2 (footer) |
| Verificación: tests con ctx simulado; E2E en navegador; suite verde | Task 1, 2, 4 |
| Fuera de alcance respetado | Todas (solo `/alertas/`) |

Sin gaps de spec. Tipos/nombres consistentes: `calcularFactor(natural, disponible)` usado igual en Task 1 y 2; `metricasCuerpo`/`altoNaturalCuerpo` solo internas a Task 2.

## Execution

Plan completo y guardado en `docs/superpowers/plans/2026-11-17-alertas-coherencia-dinamico.md`.
