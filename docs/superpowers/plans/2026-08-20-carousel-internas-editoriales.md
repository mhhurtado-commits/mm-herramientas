# Carousel Internal Editorial Slides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar las tarjetas internas básicas de Carrusel por cinco composiciones editoriales densas y adaptativas, conservando el contrato actual.

**Architecture:** `slide-model.js` será la única fuente para inferir o validar `style.composition`. `canvas-renderer.js` despachará las internas a cinco composiciones sobre los helpers y zonas seguras existentes; `ui.js` permitirá anular manualmente la inferencia sin cambiar el contenido.

**Tech Stack:** JavaScript ESM, Canvas 2D, Node test runner, DOM nativo.

## Global Constraints

- No modificar Worker, `/placas`, `/placas-v2` ni el contrato editorial.
- Mantener portada, cierre, clima, foco de imágenes y bloqueo por desborde.
- No inventar ni truncar silenciosamente contenido.
- No agregar dependencias.

---

### Task 1: Composición normalizada

**Files:**
- Modify: `carousel/slide-model.js`
- Test: `carousel/editorial-carousel.test.mjs`

**Interfaces:**
- Produces: `resolveInternalComposition(slide): "focus" | "comparison" | "conversation" | "update" | "changes" | ""`.
- Produces: `normalizeCarouselSlide(...).style.composition` para slides internos.

- [ ] **Step 1: Write the failing tests**

Agregar casos que verifiquen `clave → focus`, `cita → conversation`, `impact → changes`, contexto interrogativo → `conversation`, dato comparativo → `comparison`, contexto común → `update` y prioridad de `style.composition` explícito.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test --test-isolation=none carousel/editorial-carousel.test.mjs`

Expected: FAIL porque `resolveInternalComposition` y `style.composition` todavía no existen.

- [ ] **Step 3: Implement the resolver**

Definir el conjunto permitido, normalizar aliases editoriales y aplicar reglas deterministas basadas en tipo, título, pregunta y cantidad de elementos. Preservar `style.variant === "climate"`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test --test-isolation=none carousel/editorial-carousel.test.mjs`

Expected: PASS.

### Task 2: Cinco renderers internos

**Files:**
- Modify: `carousel/canvas-renderer.js`
- Test: `carousel/editorial-carousel.test.mjs`

**Interfaces:**
- Consumes: `slide.style.composition` normalizado.
- Produces: renderers `focus`, `comparison`, `conversation`, `update` y `changes` que conservan `renderState`.

- [ ] **Step 1: Write the failing renderer tests**

Agregar un caso por composición que compruebe etiqueta editorial, contenido completo, tarjetas de gran formato, imagen cuando corresponda y líneas dentro del pie seguro.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test --test-isolation=none carousel/editorial-carousel.test.mjs`

Expected: FAIL porque el dispatcher aún usa `drawText`, `drawKey`, `drawStats`, `drawQuote` y `drawImage` genéricos.

- [ ] **Step 3: Implement the internal dispatcher and renderers**

Agregar un dispatcher anterior al `switch` legacy, excepto para `cover`, `end` y `style.variant === "climate"`. Reutilizar `drawEditorialHeader`, `drawMeasuredText`, `drawSupportImage`, `fillRoundRect` y `drawEditorialFooter`; registrar roles de contenido y respetar `layout.safeZones.footer.y`.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `node --test --test-isolation=none carousel/editorial-carousel.test.mjs`

Expected: PASS sin pérdida de contenido ni nuevos desbordes en los fixtures breves.

### Task 3: Selector manual y regresión completa

**Files:**
- Modify: `carousel/ui.js`
- Modify: `carousel/style.css`
- Test: `carousel/editorial-carousel.test.mjs`

**Interfaces:**
- Produces: `updateCarouselSlideComposition(project, slideId, composition): project`.
- Consumes: opciones `focus`, `comparison`, `conversation`, `update`, `changes`.

- [ ] **Step 1: Write the failing UI state test**

Probar que cambiar la composición actualiza sólo `slide.style.composition`, conserva una copia profunda de `slide.content` y guarda el proyecto.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none carousel/editorial-carousel.test.mjs`

Expected: FAIL porque el actualizador no existe.

- [ ] **Step 3: Implement the selector**

Añadir “Diseño interno” a `createStageControls`, cinco chips con estado activo y un actualizador exportado que valida la opción antes de renderizar nuevamente.

- [ ] **Step 4: Run focused and complete verification**

Run: `node --test --test-isolation=none carousel/editorial-carousel.test.mjs carousel/adaptive-layout.test.mjs carousel/climate-adapter.test.mjs carousel/shared-package-adapter.test.mjs`

Expected: todas las pruebas pasan con cero fallos.

- [ ] **Step 5: Review scope and commit**

Run: `git diff --check` y `git status --short`.

Expected: sólo documentación y archivos de `/carousel` pertenecientes a esta tarea; los cambios preexistentes del Worker permanecen fuera del commit.
