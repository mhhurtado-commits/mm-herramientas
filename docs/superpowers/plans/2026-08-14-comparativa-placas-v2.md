# Comparativa `/placas-v2` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a note-first `comparativa` plate model to `/placas-v2` without reusing `/visual-suite` or changing `/placas`.

**Architecture:** Extend the existing `placa_noticia` normalization with a validated `comparativa` object, add a dedicated renderer/layout branch, and expose manual controls in the `/placas-v2` editor. The Worker will accept and return the new field while only proposing comparisons supported by the note. Existing models keep their current behavior.

**Tech Stack:** ES modules, browser Canvas renderer, Cloudflare Worker JavaScript, Node built-in test runner, existing `/placas-v2` CSS/UI.

## Global Constraints

- Do not modify `/placas`.
- Do not reuse code or data flow from `/visual-suite`.
- Keep `titulo` as the general editorial title and `titulo_sintetico` as the short plate title.
- Preserve compatibility with packages that do not contain `comparativa`.
- Manual or external comparison data must preserve `fuente`, `fecha` and `origen`.
- Production code follows red-green-refactor: each behavior starts with a failing test.

---

### Task 1: Normalize the comparison contract

**Files:**
- Modify: `placas-v2/editorial-core.mjs`
- Test: `placas-v2/editorial-core.test.mjs`
- Modify: `shared/editorial-package.mjs` only if the shared package validator rejects the new optional field
- Test: `shared/editorial-package.test.mjs` only if that validator changes

**Interfaces:**
- Add `normalizeComparison(value, fallbackSource, fallbackDate)` returning either `null` or `{ izquierda, derecha, fuente, fecha, origen }`.
- Each side returns `{ etiqueta, valor, detalle }` and requires a non-empty `valor`.
- Accept aliases `left/right`, `antes/ahora`, `izquierda/derecha`.
- Accept `origen` values `nota`, `manual`, `externo`; unknown values normalize to `manual`.
- Add `comparativa` to `PLATE_TYPES` and accepted `tipo_placa` values.

- [ ] **Step 1: Write failing tests** for type registration, two-side normalization, aliases, incomplete-side warning/fallback, and preservation of source metadata.
- [ ] **Step 2: Run the focused core test** with `node --test placas-v2/editorial-core.test.mjs`; expected failure because `comparativa` is not yet normalized.
- [ ] **Step 3: Implement the minimal normalizer and contract integration.** Do not alter existing `datos_clave` behavior.
- [ ] **Step 4: Run the focused core and shared tests** with `node --test placas-v2/editorial-core.test.mjs shared/editorial-package.test.mjs`.
- [ ] **Step 5: Commit** with `feat: add comparativa plate contract`.

### Task 2: Add the comparativa layout and renderer

**Files:**
- Modify: `placas-v2/editorial-core.mjs`
- Modify: `placas-v2/renderer.mjs`
- Test: `placas-v2/editorial-core.test.mjs`

**Interfaces:**
- Extend `calculatePlateLayout(format, plate)` with a `comparison` layout containing `header`, `leftCard`, `rightCard`, `title`, `image`, and `footer` rectangles.
- Add `renderComparisonPlate(ctx, plate, format, options, family, layout)` and route `tipo_placa === 'comparativa'` before generic news rendering.
- Render a readable two-card comparison, title above it, optional note image, source/date footer, and no long bajada/context block.

- [ ] **Step 1: Write failing layout/render-contract tests** asserting two cards, safe rectangles for portrait/square/story, title fallback, and no `bajada` block in the comparison branch.
- [ ] **Step 2: Run `node --test placas-v2/editorial-core.test.mjs`;** expected failure because the new layout and renderer branch do not exist.
- [ ] **Step 3: Implement the smallest layout and renderer branch**, using existing typography, family colors, logo and image helpers.
- [ ] **Step 4: Run the focused core tests and the complete `/placas-v2` tests** with `node --test placas-v2/*.test.mjs`.
- [ ] **Step 5: Commit** with `feat: render comparativa plate model`.

### Task 3: Expose manual comparison controls in `/placas-v2`

**Files:**
- Modify: `placas-v2/index.html`
- Modify: `placas-v2/app.mjs`
- Modify: `placas-v2/style.css` only for the new controls' existing visual language
- Test: `placas-v2/editorial-session.test.mjs` or a focused app contract test if the current test structure supports DOM-free state checks

**Interfaces:**
- Add a hidden `comparisonControls` section with fields for both sides, detail, source, date and origin.
- Show it only for `comparativa`; keep `dataControls` exclusive to `dato-clave`.
- Update the active variant in place on input and rerender without changing other variants.
- Keep the synthetic title control available for `comparativa`.

- [ ] **Step 1: Write a failing DOM-free/state test** for visibility selection and persistence of both sides, or extend the existing session contract if DOM tests are unavailable.
- [ ] **Step 2: Run the focused test and confirm the expected failure.**
- [ ] **Step 3: Add the controls and event wiring using the existing `renderDataControls` pattern.**
- [ ] **Step 4: Run all `/placas-v2` tests and perform a syntax check** with `node --check placas-v2/app.mjs`.
- [ ] **Step 5: Commit** with `feat: add comparativa editor controls`.

### Task 4: Extend Worker prompt and response normalization

**Files:**
- Modify: `worker/placas-v2.mjs`
- Test: `worker/placas-v2.test.mjs`
- Modify: `worker/worker.js` only if the deployed inline handler has a separate prompt/normalizer that must stay in sync

**Interfaces:**
- Add `comparativa` to the Worker JSON schema and `tipo_placa` enum.
- Instruct the model to return two directly supported sides only; no invented figures or external facts.
- Normalize the response through the same optional-field rules and preserve `fuente`, `fecha`, `origen`.
- Keep old responses without `comparativa` valid.

- [ ] **Step 1: Write failing Worker tests** for prompt inclusion, valid two-side response, incomplete comparison fallback, and old response compatibility.
- [ ] **Step 2: Run `node --test worker/placas-v2.test.mjs`;** expected failure on the new assertions.
- [ ] **Step 3: Implement prompt/schema/normalization changes in the source Worker module and mirror them in `worker/worker.js` if required by the current deployment flow.
- [ ] **Step 4: Run Worker tests and syntax checks** for both files.
- [ ] **Step 5: Commit** with `feat: support comparativa in placas v2 worker`.

### Task 5: Full regression and real-content visual check

**Files:**
- Modify: none unless a regression is found
- Test: existing `/placas-v2`, `worker`, and `shared` test files

- [ ] **Step 1: Run** `node --test placas-v2/*.test.mjs worker/placas-v2.test.mjs shared/*.test.mjs`.
- [ ] **Step 2: Verify no `/placas` files changed with `git diff --name-only`.
- [ ] **Step 3: Manually render one comparison for politics, one for economy and one for sports, checking 4:5, square and Story legibility.
- [ ] **Step 4: Review the final diff and report any environment limitation separately from verified results.
- [ ] **Step 5: Commit any test-only correction with a focused message.
