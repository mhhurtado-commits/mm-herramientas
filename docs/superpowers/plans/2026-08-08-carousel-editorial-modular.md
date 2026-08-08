# Carrusel editorial modular Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar las portadas e internas de `/carousel` para que formen una secuencia editorial modular alineada con `/placas-v2`, sin modificar `/placas`.

**Architecture:** El contrato de carrusel seguirá produciendo una secuencia de slides tipados. El renderer de Canvas conservará un único punto de render para preview y PNG, pero separará la composición visual por tipos editoriales (`cover`, `clave`, `contexto`, `dato`, `cita`, `imagen`, `end`). Los tokens visuales se centralizarán en `carousel/core/theme.js` y las reglas de texto en `carousel/core/text.js`.

**Tech Stack:** JavaScript ES modules, HTML/CSS existente, Canvas 2D, Node test runner (`node --test`).

## Global Constraints

- `/placas` debe permanecer sin modificaciones funcionales.
- La nueva estética debe compartir familia visual con `/placas-v2`, pero no ser un calco.
- Preview y PNG deben usar el mismo renderer.
- La IA no puede inventar datos ni citas.
- Portada: titular máximo 3 líneas; bajada máxima 3 líneas.
- Internas: título máximo 2 líneas; cuerpo recomendado entre 2 y 5 líneas.
- Los textos no deben truncarse con puntos suspensivos ni invadir el pie.
- El selector de alternativa, tipo de placa y formato de salida deben seguir siendo independientes.

---

## Mapa de archivos

- Modify `carousel/slide-model.js`: defaults para tipos y contenido de slides editoriales.
- Modify `carousel/core/theme.js`: tokens de color, tipografía, espaciado, paneles y numeración.
- Modify `carousel/core/text.js`: medición y ajuste seguro de títulos, bajadas, cuerpos, datos y citas.
- Modify `carousel/core/layout.js`: zonas seguras y layouts para portada, internas y cierre.
- Modify `carousel/canvas-renderer.js`: composiciones visuales nuevas usando los layouts y tokens compartidos.
- Modify `carousel/templates/cover.json`, `carousel/templates/text.json`, `carousel/templates/stats.json`, `carousel/templates/end.json`: metadatos y contenido editorial compatibles.
- Modify `carousel/slide-model.js`, `carousel/renderer.js`, `carousel/parser.js`: normalización de tipos y fallback de planes existentes.
- Modify `carousel/ui.js`, `carousel/style.css`: etiquetas de tipo, navegación secuencial y estados visuales sin romper exportación.
- Create `carousel/editorial-carousel.test.mjs`: pruebas de contrato, límites de texto y selección de templates.
- Modify `carousel/shared-package-adapter.test.mjs`: conservar integración con el contrato común.
- Modify `shared/editorial-suite.integration.test.mjs`: verificar que Carrusel siga siendo una salida independiente.

## Task 1: Modelar la secuencia editorial tipada

**Files:**
- Modify: `carousel/slide-model.js`
- Modify: `carousel/parser.js`
- Modify: `carousel/renderer.js`
- Test: `carousel/editorial-carousel.test.mjs`

**Interfaces:**
- `normalizeCarouselSlide(slide, index, total)` devuelve un slide con `type`, `template`, `order`, `content` y `style` completos.
- Los tipos válidos son `cover`, `clave`, `contexto`, `dato`, `cita`, `imagen`, `end`.
- Los templates de renderer son `cover`, `text`, `stats`, `quote`, `image`, `end`.

- [ ] **Step 1: Write the failing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCarouselSlide } from "./slide-model.js";

test("normaliza una diapositiva editorial con tipo y numeración", () => {
  const slide = normalizeCarouselSlide({ type: "dato", content: { title: "La cifra", text: "8 empresas" } }, 1, 4);
  assert.equal(slide.type, "dato");
  assert.equal(slide.template, "stats");
  assert.equal(slide.order, 1);
  assert.equal(slide.content.title, "La cifra");
});

test("degrada tipos desconocidos a contexto sin romper planes existentes", () => {
  const slide = normalizeCarouselSlide({ template: "text", content: { title: "Contexto" } }, 0, 1);
  assert.equal(slide.type, "contexto");
  assert.equal(slide.template, "text");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test carousel/editorial-carousel.test.mjs`

Expected: FAIL because `normalizeCarouselSlide` is not exported.

- [ ] **Step 3: Implement the normalizer**

```js
const TYPE_TO_TEMPLATE = {
  cover: "cover",
  clave: "text",
  contexto: "text",
  dato: "stats",
  cita: "quote",
  imagen: "image",
  end: "end"
};

export function normalizeCarouselSlide(input = {}, index = 0, total = 1) {
  const type = input.type || (input.template === "cover" ? "cover" : input.template === "end" ? "end" : input.template === "stats" ? "dato" : "contexto");
  const template = input.template || TYPE_TO_TEMPLATE[type] || "text";
  return {
    ...input,
    id: input.id || `slide-${index + 1}`,
    type,
    template,
    order: index,
    total,
    content: { title: "", subtitle: "", text: "", items: [], image: "", ...input.content },
    style: { theme: "mm_editorial", background: "paper", accent: "", ...input.style }
  };
}
```

Update `renderer.js` to normalize every slide before image resolution and Canvas rendering.

- [ ] **Step 4: Run focused tests**

Run: `node --test carousel/editorial-carousel.test.mjs carousel/shared-package-adapter.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add carousel/slide-model.js carousel/parser.js carousel/renderer.js carousel/editorial-carousel.test.mjs
git commit -m "feat(carousel): normalize editorial slide types"
git push origin main
```

## Task 2: Centralizar tokens y layouts seguros

**Files:**
- Modify: `carousel/core/theme.js`
- Modify: `carousel/core/layout.js`
- Modify: `carousel/core/text.js`
- Test: `carousel/editorial-carousel.test.mjs`

**Interfaces:**
- `resolveCarouselTheme(project, slide)` returns section colors and typography tokens.
- `getCarouselLayout(kind, width, height)` returns safe zones for `cover`, `internal`, `stats`, `quote`, `image` and `end`.
- `fitText(ctx, text, options)` returns `{ lines, fontSize, height, truncated: false }` or an explicit overflow result that the caller must resolve by shortening copy.

- [ ] **Step 1: Write failing tests for text safety**

```js
test("ajusta un contexto de dos líneas sin truncarlo", () => {
  const result = fitText(null, "El Centro de Recolección funciona en el primer piso del edificio nuevo, todos los días de 7.30 a 21 horas.", {
    maxWidth: 900, maxLines: 2, fontSize: 42, minFontSize: 32
  });
  assert.equal(result.truncated, false);
  assert.ok(result.lines.length <= 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test carousel/editorial-carousel.test.mjs`

Expected: FAIL until `fitText` exposes the safe result.

- [ ] **Step 3: Implement shared tokens and safe layout metrics**

Add `mm_editorial` tokens with the existing Media Mendoza ink, section accent, pale section background, white paper panel, logo safe inset, and footer safe zone. Add explicit layout objects so the internal body region ends before the footer rather than relying on fixed vertical positions.

Implement `fitText` using the existing measurement helpers; it must reduce font size only down to `minFontSize`, then return an overflow result for editorial shortening instead of adding ellipsis.

- [ ] **Step 4: Run focused tests**

Run: `node --test carousel/editorial-carousel.test.mjs shared/editorial-package.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add carousel/core/theme.js carousel/core/layout.js carousel/core/text.js carousel/editorial-carousel.test.mjs
git commit -m "feat(carousel): add editorial tokens and safe text layouts"
git push origin main
```

## Task 3: Rediseñar Canvas por familia editorial

**Files:**
- Modify: `carousel/canvas-renderer.js`
- Modify: `carousel/core/image.js`
- Modify: `carousel/templates/cover.json`
- Modify: `carousel/templates/text.json`
- Modify: `carousel/templates/stats.json`
- Modify: `carousel/templates/end.json`
- Test: `carousel/editorial-carousel.test.mjs`

**Interfaces:**
- `renderSlideToCanvas(slide, project)` remains the only public render entry point.
- `renderCover`, `renderTextSlide`, `renderStatsSlide`, `renderQuoteSlide`, `renderImageSlide`, and `renderEndSlide` all consume normalized slides and `getCarouselLayout`.
- `drawEditorialHeader`, `drawSlideProgress`, `drawContextCard`, and `drawEditorialFooter` are private renderer helpers.

- [ ] **Step 1: Add renderer tests that fail on missing families**

```js
test("renderiza una secuencia con dato, cita e imagen usando el mismo entry point", () => {
  const project = { slides: [
    { type: "dato", template: "stats", order: 1, content: { title: "Dato", items: [{ value: "8", label: "empresas" }] } },
    { type: "cita", template: "quote", order: 2, content: { quote: "Texto literal", author: "Una fuente" } },
    { type: "imagen", template: "image", order: 3, content: { title: "La escena", text: "Una imagen de apoyo" } }
  ] };
  for (const slide of project.slides) assert.ok(renderSlideToCanvas(slide, project));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test carousel/editorial-carousel.test.mjs`

Expected: FAIL because `quote` and `image` are not handled as editorial families.

- [ ] **Step 3: Implement the compositions**

Use the following structure in Canvas:

```js
switch (slide.template) {
  case "cover": renderCover(ctx, slide, project); break;
  case "text": renderTextSlide(ctx, slide, project); break;
  case "stats": renderStatsSlide(ctx, slide, project); break;
  case "quote": renderQuoteSlide(ctx, slide, project); break;
  case "image": renderImageSlide(ctx, slide, project); break;
  case "end": renderEndSlide(ctx, slide, project); break;
  default: renderTextSlide(ctx, slide, project);
}
```

Cover uses the image-first treatment and a small progression cue. Text slides use an eyebrow, title, readable body and a colored context panel. Stats slides prioritize the number or fact with a secondary explanation. Quote slides use a large quotation mark, quote text, author and role. Image slides use a safe crop plus a short caption. End slides contain the source and the appropriate CTA.

All helpers must use measured layout heights and keep footer/logo inside the safe zones returned by `getCarouselLayout`.

- [ ] **Step 4: Render the same examples to preview and PNG**

Run: `node --test carousel/editorial-carousel.test.mjs`; then load `/carousel/` and export one cover, one context, one data, one quote and one image slide. Confirm the Canvas dimensions and visual content are identical between preview and downloaded PNG.

- [ ] **Step 5: Commit**

```bash
git add carousel/canvas-renderer.js carousel/core/image.js carousel/templates carousel/editorial-carousel.test.mjs
git commit -m "feat(carousel): render modular editorial slide families"
git push origin main
```

## Task 4: Integrar navegación y estados de la interfaz

**Files:**
- Modify: `carousel/ui.js`
- Modify: `carousel/style.css`
- Modify: `carousel/slide-model.js`
- Test: `carousel/editorial-carousel.test.mjs`

**Interfaces:**
- `getSlideLabel(item, index)` returns the editorial label and sequence position.
- `renderInPreview()` continues to call `renderCarousel(project)` and must not create a second visual path.
- Existing export buttons and caption panels remain available.

- [ ] **Step 1: Add failing UI-model tests**

```js
test("etiqueta las diapositivas por función editorial", () => {
  assert.equal(getSlideLabel({ slide: { type: "contexto" } }, 1), "Contexto");
  assert.equal(getSlideLabel({ slide: { type: "dato" } }, 2), "Dato");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test carousel/editorial-carousel.test.mjs`

Expected: FAIL until `getSlideLabel` maps the new types.

- [ ] **Step 3: Add labels and navigation styling**

Map `clave`, `contexto`, `dato`, `cita`, `imagen` and `end` to Spanish labels. Keep the active slide navigation and exports unchanged, but show the type beside the slide number and add a visually clear active thumbnail state in `style.css`.

- [ ] **Step 4: Run integration tests**

Run: `node --test carousel/*.test.mjs shared/*.test.mjs`

Expected: PASS with no changes to `/placas` tests or files.

- [ ] **Step 5: Commit**

```bash
git add carousel/ui.js carousel/style.css carousel/slide-model.js carousel/editorial-carousel.test.mjs
git commit -m "feat(carousel): expose editorial slide sequence in UI"
git push origin main
```

## Task 5: Validación editorial y visual final

**Files:**
- Modify: `carousel/editorial-carousel.test.mjs`
- Modify: `shared/editorial-suite.integration.test.mjs` only if a regression is found

- [ ] **Step 1: Add acceptance fixtures**

Use one real editorial package with: a one-line context, a two-line context, a three-line context, one data point, one literal quote and one support image. Add assertions that every slide reports `truncated === false`, has a positive content height, and leaves the footer zone untouched.

- [ ] **Step 2: Run the complete suite**

Run: `node --test carousel/*.test.mjs shared/*.test.mjs`

Expected: PASS.

- [ ] **Step 3: Manually verify exports**

In `/carousel/`, verify cover, context, data, quote, image and closing slides in preview and PNG. Verify the same source package still produces `/placas-v2` output and that `/placas` is unchanged.

- [ ] **Step 4: Commit final verification changes**

```bash
git add carousel/editorial-carousel.test.mjs shared/editorial-suite.integration.test.mjs
git commit -m "test(carousel): cover modular editorial acceptance cases"
git push origin main
```
