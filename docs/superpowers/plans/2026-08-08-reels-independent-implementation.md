# Reel editorial independiente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `/reels` como herramienta independiente para generar, editar y exportar Reels editoriales 9:16 desde una URL o desde el paquete editorial de `/placas-v2`.

**Architecture:** `/reels` tendrá su propio modelo de escenas, renderer Canvas y UI. Reutilizará únicamente el contrato normalizado de `shared/editorial-package.mjs`, la extracción del worker y el handoff editorial; `carousel` no será una dependencia de ejecución.

**Tech Stack:** JavaScript ES modules, HTML/CSS, Canvas 2D, `node:test`, `sessionStorage`, Cloudflare Pages y el worker existente.

## Global Constraints

- El Reel será siempre vertical 9:16.
- La primera versión generará entre 4 y 6 escenas.
- No se incorporará audio dentro de la herramienta.
- Las imágenes horizontales se conservarán completas con fondo adaptativo.
- `/placas`, `/placas-v2` y `/carousel` no tendrán cambios funcionales.
- Preview y PNG exportado usarán el mismo renderer.

---

### Task 1: Crear el modelo independiente de Reel

**Files:**
- Create: `reels/reel-model.mjs`
- Test: `reels/reel-model.test.mjs`

**Interfaces:**
- Produce `createReelProject(editorialPackage)` y `normalizeReelProject(project)`.
- Produce escenas con `{ id, type, title, body, image, imageMode, focus, accent, cta }`.
- `imageMode` solo admite `cover`, `contain-blur` y `text`.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createReelProject, normalizeReelProject } from './reel-model.mjs';

test('creates a four-scene reel from a package with one horizontal image', () => {
  const project = createReelProject({
    fuente: { url: 'https://mediamendoza.com/nota', imagenes: ['https://img.test/horizontal.jpg'] },
    editorial: { seccion: 'policiales', titulo: 'Título de prueba', bajada: 'Bajada', contexto: 'Dato clave' },
  });
  assert.equal(project.format, '9:16');
  assert.ok(project.scenes.length >= 4 && project.scenes.length <= 6);
  assert.equal(project.scenes[0].imageMode, 'contain-blur');
  assert.deepEqual(project.scenes[0].focus, { x: 0.5, y: 0.5 });
});

test('normalizes scene count and clamps focus', () => {
  const normalized = normalizeReelProject({ format: 'square', scenes: [{ id: 'x', focus: { x: 2, y: -1 } }] });
  assert.equal(normalized.format, '9:16');
  assert.equal(normalized.scenes[0].focus.x, 1);
  assert.equal(normalized.scenes[0].focus.y, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test reels/reel-model.test.mjs`
Expected: FAIL because `reels/reel-model.mjs` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement `createReelProject` with these deterministic scene rules: cover, `que-paso`, `dato-clave` when context/data exists, and closure. Add `normalizeReelProject` to force `format: '9:16'`, clamp focus to `[0,1]`, remove empty scenes, preserve at most 6 scenes, and use the package section color as `accent`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test reels/reel-model.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add reels/reel-model.mjs reels/reel-model.test.mjs
git commit -m "feat(reels): add independent scene model"
```

### Task 2: Implement adaptive image layout

**Files:**
- Create: `reels/reel-image-layout.mjs`
- Test: `reels/reel-image-layout.test.mjs`

**Interfaces:**
- Produce `chooseImageMode({ width, height, hasText })`.
- Produce `clampFocus(focus)`.
- Produce `getImageDrawPlan({ sourceWidth, sourceHeight, canvasWidth, canvasHeight, mode, focus })`.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseImageMode, getImageDrawPlan } from './reel-image-layout.mjs';

test('uses complete-image mode for horizontal photos in vertical reels', () => {
  assert.equal(chooseImageMode({ width: 1600, height: 900, hasText: true }), 'contain-blur');
  const plan = getImageDrawPlan({ sourceWidth: 1600, sourceHeight: 900, canvasWidth: 1080, canvasHeight: 1920, mode: 'contain-blur', focus: { x: 0.5, y: 0.5 } });
  assert.equal(plan.foreground.width, 1080);
  assert.ok(plan.background.scale > 1);
  assert.equal(plan.foreground.crop, false);
});

test('keeps manual focus bounded for crop mode', () => {
  const plan = getImageDrawPlan({ sourceWidth: 900, sourceHeight: 1600, canvasWidth: 1080, canvasHeight: 1920, mode: 'cover', focus: { x: 4, y: -2 } });
  assert.equal(plan.focus.x, 1);
  assert.equal(plan.focus.y, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test reels/reel-image-layout.test.mjs`
Expected: FAIL because the layout module does not exist.

- [ ] **Step 3: Write minimal implementation**

For `contain-blur`, calculate a foreground image that fits completely within the vertical canvas and a background fill that covers the canvas. For `cover`, calculate a crop whose origin follows the clamped focus. Return explicit `foreground`, `background`, `focus`, and `crop` values so the renderer and drag editor share the same geometry.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test reels/reel-image-layout.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add reels/reel-image-layout.mjs reels/reel-image-layout.test.mjs
git commit -m "feat(reels): add adaptive vertical image layout"
```

### Task 3: Add the independent Canvas renderer

**Files:**
- Create: `reels/reel-renderer.mjs`
- Test: `reels/reel-renderer.test.mjs`

**Interfaces:**
- Produce `renderReelScene(ctx, scene, assets, options)`.
- Produce `renderReelProject(canvas, project, assets, sceneIndex)`.
- Use `reel-image-layout.mjs` for every image draw.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneLayout } from './reel-renderer.mjs';

test('reserves safe zones and closure space in the 9:16 layout', () => {
  const layout = sceneLayout({ width: 1080, height: 1920, type: 'closure' });
  assert.ok(layout.safe.top > 0);
  assert.ok(layout.safe.bottom > 0);
  assert.ok(layout.cta.y < layout.safe.bottom);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test reels/reel-renderer.test.mjs`
Expected: FAIL because the renderer does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement a pure layout helper and Canvas drawing for cover, information, fact, context and closure scenes. Use one dominant section accent, high-contrast text, stable logo placement, no opaque logo box, adaptive horizontal-image background, and a useful closure with the story fact, CTA and `www.mediamendoza.com`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test reels/reel-renderer.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add reels/reel-renderer.mjs reels/reel-renderer.test.mjs
git commit -m "feat(reels): add standalone editorial renderer"
```

### Task 4: Build URL loading and `/placas-v2` handoff

**Files:**
- Create: `reels/reel-session.mjs`
- Create: `reels/output-handoff.mjs`
- Modify: `placas-v2/output-handoff.mjs`
- Test: `reels/reel-session.test.mjs`
- Test: `reels/output-handoff.test.mjs`

**Interfaces:**
- `loadReelSession(url, dependencies)` extracts and requests `['reel']` from the existing worker endpoint.
- `parseReelHandoff(value)` accepts the shared handoff key and output `reel`.
- `createReelHandoff(editorialPackage)` serializes only the normalized package.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadReelSession } from './reel-session.mjs';

test('loads a direct URL through the existing editorial worker flow', async () => {
  const session = await loadReelSession('https://mediamendoza.com/nota', {
    extract: async url => ({ url, title: 'Título', content: 'Contenido', images: ['img'] }),
    generate: async (note, outputs) => ({ paquete: { tipo: 'noticia_editorial', version: 2, fuente: { url: note.url, titulo_original: note.title, imagenes: note.images }, editorial: { seccion: 'sociales', titulo: 'Título', bajada: 'Bajada', contexto: 'Contexto' }, salidas: {}, redes: {} }, outputs }),
  });
  assert.equal(session.project.format, '9:16');
  assert.equal(session.project.scenes.length >= 4, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test reels/reel-session.test.mjs reels/output-handoff.test.mjs`
Expected: FAIL because the session and handoff modules do not exist.

- [ ] **Step 3: Write minimal implementation**

Reuse `normalizeEditorialPackage` and `createEditorialHandoff` semantics without importing carousel modules. Update `placas-v2/output-handoff.mjs` only to allow a dedicated `/reels/` consumer while retaining the existing key and output value.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test reels/reel-session.test.mjs reels/output-handoff.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add reels/reel-session.mjs reels/output-handoff.mjs reels/reel-session.test.mjs reels/output-handoff.test.mjs placas-v2/output-handoff.mjs
git commit -m "feat(reels): support URL and placas handoff inputs"
```

### Task 5: Create the `/reels` editor UI

**Files:**
- Create: `reels/index.html`
- Create: `reels/app.mjs`
- Create: `reels/style.css`
- Create: `reels/ui.mjs`

**Interfaces:**
- UI state contains `{ session, project, activeScene, selectedImage, drag }`.
- URL submit invokes `loadReelSession`.
- Handoff load invokes `parseReelHandoff(sessionStorage.getItem('mm-editorial-handoff'))`.
- Canvas pointer events update only the active scene focus.

- [ ] **Step 1: Write the failing UI behavior test**

Create `reels/ui.test.mjs` with a DOM-free state helper test asserting that dragging an image updates `scene.focus` and does not change scene text or block positions.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test reels/ui.test.mjs`
Expected: FAIL because the UI state helper does not exist.

- [ ] **Step 3: Write minimal implementation**

Create a focused two-column editor using the root `style.css` tokens as visual reference: URL input, scene strip, canvas preview, scene text controls, image thumbnails, “Abrir desde Placas V2”, “Descargar escenas” and “Descargar paquete”. Use drag directly over the canvas for focus, with pointer capture and normalized coordinates.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test reels/ui.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add reels/index.html reels/app.mjs reels/style.css reels/ui.mjs reels/ui.test.mjs
git commit -m "feat(reels): add standalone editor interface"
```

### Task 6: Add export, validation and regression coverage

**Files:**
- Create: `reels/reel-export.mjs`
- Test: `reels/reel-export.test.mjs`
- Modify: `shared/editorial-suite.integration.test.mjs`
- Test: `reels/visual-regression.test.mjs`

**Interfaces:**
- `validateReelProject(project)` returns `{ ok, errors }`.
- `exportReelScenes(project, assets)` returns PNG blobs or data URLs using `reel-renderer.mjs`.
- `buildReelPackage(project)` returns the normalized package with `salidas.reel` populated.

- [ ] **Step 1: Write the failing tests**

Cover validation for 9:16, 4–6 scenes, no empty scene text, safe closure CTA/web, and one horizontal image with `contain-blur`. Add an integration assertion that existing package normalization still exposes `salidas.carrusel` unchanged and accepts `salidas.reel`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test reels/reel-export.test.mjs reels/visual-regression.test.mjs shared/editorial-suite.integration.test.mjs`
Expected: FAIL because validation/export modules and `/reels` integration do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement validation before export, render every scene through the same Canvas path used by preview, and preserve source URL, editorial text, section family, image references and focus values in `salidas.reel`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test reels/*.test.mjs shared/*.test.mjs placas-v2/*.test.mjs carousel/reel-package-adapter.test.mjs`
Expected: all existing and new tests PASS.

- [ ] **Step 5: Commit**

```bash
git add reels shared/editorial-suite.integration.test.mjs
git commit -m "test(reels): validate export and preserve suite compatibility"
```

### Task 7: Register the new route and verify deployment assets

**Files:**
- Modify: `index.html`
- Modify: `docs/index.md`
- Test: `reels/route-smoke.test.mjs`

- [ ] **Step 1: Write the failing smoke test**

Assert that the suite index contains `/reels/` and that `reels/index.html` references `./app.mjs`, `./style.css` and `../assets/logo.png`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test reels/route-smoke.test.mjs`
Expected: FAIL because the suite route is not registered.

- [ ] **Step 3: Write minimal implementation**

Add `/reels/` as a separate tool in the suite index and document the URL/handoff workflow. Do not remove or rename the carousel route.

- [ ] **Step 4: Run the full verification**

Run: `node --test reels/*.test.mjs shared/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs`
Expected: all tests PASS with no new warnings.

- [ ] **Step 5: Commit and push**

```bash
git add index.html docs/index.md reels/route-smoke.test.mjs
git commit -m "feat(reels): register independent reel tool"
git push origin main
```

## Self-review checklist

- The plan keeps Reel independent from Carousel at runtime.
- URL and `/placas-v2` handoff use one normalized editorial contract.
- Horizontal image behavior is isolated and testable before renderer work.
- Preview/export parity is explicitly tested.
- Existing `/placas`, `/placas-v2` and `/carousel` behavior is covered by regression tests.
- No audio generation or rights management is introduced.
