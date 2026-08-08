# Integración de la Suite Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `/placas-v2` into the main entry point that extracts a news article once and produces coherent plate, carousel, Reel, and social-copy outputs while keeping `/placas` and the current `/carousel` flow operational.

**Architecture:** Add a versioned editorial package contract between extraction, one editorial diagnosis, and independent output adapters. Keep the existing plate, carousel, and Reel renderers separate; `/placas-v2` orchestrates them and `/carousel` consumes the shared package through a compatibility adapter during migration.

**Tech Stack:** Browser ES modules, Cloudflare Worker JavaScript, Canvas renderers, Node.js built-in test runner, existing `placas-v2` and `carousel` modules.

## Global Constraints

- `/placas` must remain without functional modifications.
- `/carousel` must remain operational during migration.
- The first stage unifies data and flow; it does not redesign carousel or Reel aesthetics.
- A URL is extracted once per editorial session.
- The AI interprets the article once; output generators consume the same package.
- Literal quotes and identified people must preserve the verification rules already used by `/placas-v2`.
- Existing contracts remain accepted through adapters until migration is complete.
- Every completed code change must pass tests, be committed, and be pushed to `main`.

---

### Task 1: Define and test the shared editorial package

**Files:**
- Create: `shared/editorial-package.mjs`
- Create: `shared/editorial-package.test.mjs`
- Modify: `placas-v2/editorial-core.mjs`
- Test: `placas-v2/editorial-core.test.mjs`

**Interfaces:**
- Produces `EDITORIAL_PACKAGE_VERSION = 2`.
- Produces `normalizeEditorialPackage(input = {})` returning `{ ok, package, errors }`.
- Produces `packageFromPlate(plate)` returning the shared package shape.
- Produces `packageFromCarouselArticle(article, diagnosis, plan)` returning the shared package shape.
- Produces `packageToCarouselArticle(editorialPackage)` returning the current carousel `article` shape.
- Produces `packageToPlateInput(editorialPackage)` returning the current `/placas-v2` normalization input shape.

- [ ] **Step 1: Write failing contract tests.**

Add tests that assert:

```js
const result = normalizeEditorialPackage({
  tipo: 'noticia_editorial',
  version: 2,
  fuente: { url: 'https://example.com/1', titulo_original: 'Título', cuerpo: 'Texto' },
  editorial: { seccion: 'Tiempo libre', familia: 'general', tipo_noticia: 'noticia' }
});

assert.equal(result.ok, true);
assert.equal(result.package.version, 2);
assert.equal(result.package.fuente.url, 'https://example.com/1');
assert.deepEqual(packageToCarouselArticle(result.package), {
  url: 'https://example.com/1', title: 'Título', category: 'Tiempo libre',
  summary: '', image: '', images: [], content: 'Texto'
});
```

Also test that missing `fuente.url`, missing title, invalid `version`, non-array `datos_clave`, and non-array `personas` return deterministic errors without throwing.

- [ ] **Step 2: Run the new tests and verify failure.**

Run:

```powershell
node --test shared/editorial-package.test.mjs
```

Expected: FAIL because the shared module and normalizer do not exist.

- [ ] **Step 3: Implement the smallest normalizer and adapters.**

Implement the package fields exactly as defined in `docs/superpowers/specs/2026-08-07-editorial-suite-integration-design.md`. Normalize all text with the existing whitespace rules, clamp people focus through `normalizeFocus`, preserve `fuente.imagenes`, and never invent missing content. Adapters must map:

```js
packageToCarouselArticle(pkg).content = pkg.fuente.cuerpo;
packageToCarouselArticle(pkg).summary = pkg.editorial.bajada;
packageToPlateInput(pkg).cuerpo = pkg.fuente.cuerpo;
packageToPlateInput(pkg).titulo = pkg.editorial.titulo;
packageToPlateInput(pkg).bajada = pkg.editorial.bajada;
```

- [ ] **Step 4: Run focused and existing tests.**

Run:

```powershell
node --test shared/editorial-package.test.mjs placas-v2/editorial-core.test.mjs
```

Expected: all tests pass.

- [ ] **Step 5: Commit the contract.**

```powershell
git add shared/editorial-package.mjs shared/editorial-package.test.mjs placas-v2/editorial-core.mjs placas-v2/editorial-core.test.mjs
git commit -m "feat: add shared editorial package contract"
git push origin main
```

### Task 2: Add one worker endpoint for package generation

**Files:**
- Modify: `worker/worker.js`
- Modify: `worker/worker-dashboard.js`
- Modify: `worker/placas-v2.mjs`
- Create: `worker/editorial-package.mjs`
- Create: `worker/editorial-package.test.mjs`

**Interfaces:**
- Add `POST /placas/v2/paquete`.
- Request shape: `{ nota, salidas: ['placa'|'carrusel'|'reel'] }`.
- Response shape: `{ ok: true, paquete, warnings: [] }`.
- Error shape: `{ ok: false, error, code }`.
- `salidas` defaults to `['placa']` and rejects unknown output names.

- [ ] **Step 1: Write failing worker contract tests.**

Test that a valid note and `salidas: ['placa']` returns a package with `tipo: 'noticia_editorial'`, `version: 2`, `fuente`, `editorial`, and `salidas.placas`; test that `['carrusel', 'reel']` produces both requested output keys; test that an unknown output returns `invalid_outputs`.

- [ ] **Step 2: Run focused tests and verify failure.**

```powershell
node --test worker/editorial-package.test.mjs
```

Expected: FAIL because the endpoint builder is absent.

- [ ] **Step 3: Implement package generation in the modular worker source.**

Extract the existing `/placas/v2/generar` normalization into reusable package-building functions. The sequence must be:

```js
const note = normalizeExtractedNote(body.nota);
const editorial = await generateEditorialDiagnosis(note);
const paquete = buildEditorialPackage(note, editorial, requestedOutputs);
return jsonOk({ ok: true, paquete, warnings });
```

For `placa`, map the package into the current plate contract. For `carrusel` and `reel`, return normalized editorial input that the existing clients can adapt; do not move rendering into the worker.

- [ ] **Step 4: Mirror the endpoint in the manually deployed worker copies.**

Apply the same route and helper behavior to `worker/worker.js` and `worker/worker-dashboard.js`. Keep both copies byte-compatible in the new endpoint region so manual Cloudflare deployment does not diverge.

- [ ] **Step 5: Run tests and syntax checks.**

```powershell
node --test worker/editorial-package.test.mjs worker/placas-v2.test.mjs
node --check worker/worker.js
node --check worker/worker-dashboard.js
git diff --check
```

Expected: all tests pass and both worker copies parse successfully.

- [ ] **Step 6: Commit the endpoint.**

```powershell
git add worker/worker.js worker/worker-dashboard.js worker/placas-v2.mjs worker/editorial-package.mjs worker/editorial-package.test.mjs
git commit -m "feat(worker): add shared editorial package endpoint"
git push origin main
```

### Task 3: Make `/placas-v2` the orchestrator without changing its renderer

**Files:**
- Modify: `placas-v2/app.mjs`
- Modify: `placas-v2/index.html`
- Modify: `placas-v2/style.css`
- Create: `placas-v2/editorial-session.mjs`
- Create: `placas-v2/editorial-session.test.mjs`

**Interfaces:**
- `createEditorialSession({ url, outputs })` returns a session state with `note`, `paquete`, `variants`, `selectedOutput`, and `warnings`.
- `loadEditorialSession(url, outputs)` performs one extraction and one package request.
- `getOutputAvailability(package)` returns `{ placas, carrusel, reel }` booleans.

- [ ] **Step 1: Write failing session tests.**

Mock extraction and package requests and assert that `loadEditorialSession` calls extraction once, calls `/placas/v2/paquete` once, preserves the package, and maps `salidas.placas` through `normalizeNewsPlate` and `buildEditorialVariants`. Assert that output selection never causes a second extraction.

- [ ] **Step 2: Run focused tests and verify failure.**

```powershell
node --test placas-v2/editorial-session.test.mjs
```

Expected: FAIL because the session module does not exist.

- [ ] **Step 3: Implement the session module.**

Use the current worker base URL and existing `extractNote`, `normalizeNewsPlate`, and `buildEditorialVariants` behavior. Do not alter `placas-v2/renderer.mjs` in this task.

- [ ] **Step 4: Add the output navigation.**

Add a compact output switcher with `data-output="placas|carrusel|reel"`. The plate editor remains the default and all current plate controls remain available. Disabled outputs must explain why they are unavailable instead of silently failing.

- [ ] **Step 5: Run the full frontend test set.**

```powershell
node --test --test-isolation=none placas-v2/editorial-session.test.mjs placas-v2/editorial-core.test.mjs worker/placas-v2.test.mjs
```

Expected: all tests pass.

- [ ] **Step 6: Commit the orchestrator.**

```powershell
git add placas-v2/app.mjs placas-v2/index.html placas-v2/style.css placas-v2/editorial-session.mjs placas-v2/editorial-session.test.mjs
git commit -m "feat(placas-v2): orchestrate editorial outputs"
git push origin main
```

### Task 4: Adapt the existing carousel editor to the shared package

**Files:**
- Modify: `carousel/carousel-engine.js`
- Modify: `carousel/ui.js`
- Modify: `carousel/models.js`
- Modify: `carousel/editorial-contract.js`
- Create: `carousel/shared-package-adapter.js`
- Create: `carousel/shared-package-adapter.test.mjs`

**Interfaces:**
- `fromEditorialPackage(package)` returns the current carousel project article and diagnosis input.
- `attachEditorialPackage(project, package)` stores the source package without changing existing slide rendering.
- `openCarouselFromEditorialPackage(package)` initializes the existing carousel workspace.

- [ ] **Step 1: Write failing adapter tests.**

Assert that a package containing `fuente`, `editorial`, and images becomes the current carousel article shape; assert that diagnosis maps `editorial.tipo_noticia`, `editorial.familia`, `editorial.complejidad`, and `editorial.tono` to the existing allowed values; assert that missing fields trigger the same fallback behavior as `normalizeCarouselPlan`.

- [ ] **Step 2: Run focused tests and verify failure.**

```powershell
node --test carousel/shared-package-adapter.test.mjs
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the adapter without changing renderers.**

Keep `carousel/parser.js`, `carousel/canvas-renderer.js`, and `carousel/reel-canvas-renderer.js` behavior unchanged. The adapter only translates data and preserves `project.editorialPackage` for future edits.

- [ ] **Step 4: Wire the output switcher from `/placas-v2`.**

When the user selects Carrusel, pass the existing package to the carousel initializer rather than scraping the URL again. Keep the current standalone `/carousel` URL flow as a compatibility path.

- [ ] **Step 5: Run carousel tests and smoke checks.**

```powershell
node --test carousel/shared-package-adapter.test.mjs
node --check carousel/carousel-engine.js
node --check carousel/ui.js
```

Expected: adapter tests pass and both browser modules parse.

- [ ] **Step 6: Commit the carousel adapter.**

```powershell
git add carousel/carousel-engine.js carousel/ui.js carousel/models.js carousel/editorial-contract.js carousel/shared-package-adapter.js carousel/shared-package-adapter.test.mjs
git commit -m "feat(carousel): consume shared editorial package"
git push origin main
```

### Task 5: Adapt the existing Reel generation and editor

**Files:**
- Modify: `carousel/ui.js`
- Modify: `carousel/prompts.js`
- Modify: `carousel/editorial-contract.js`
- Create: `carousel/reel-package-adapter.js`
- Create: `carousel/reel-package-adapter.test.mjs`

**Interfaces:**
- `buildReelInputFromPackage(package)` returns the existing Reel prompt input.
- `normalizeReelOutputForPackage(reel)` returns the shared `salidas.reel` shape.
- `attachReelToEditorialPackage(package, reel)` returns a new package without mutating the source article.

- [ ] **Step 1: Write failing Reel adapter tests.**

Test that the Reel prompt receives the shared title, summary, body, images, vertical, and tone; test that scenes, hook, cover text, caption, and hashtags survive normalization; test that an empty Reel result produces a deterministic empty output and warning.

- [ ] **Step 2: Run focused tests and verify failure.**

```powershell
node --test carousel/reel-package-adapter.test.mjs
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the adapter and reuse the existing Reel renderer.**

Do not redesign transitions, typography, or scene layouts. Use the package as the only source of article data and preserve the current `reelPlan` editor state.

- [ ] **Step 4: Wire Reel selection from `/placas-v2`.**

Selecting Reel must use the already loaded package and must not call `/scrape` or the editorial diagnosis a second time.

- [ ] **Step 5: Run checks.**

```powershell
node --test carousel/reel-package-adapter.test.mjs carousel/shared-package-adapter.test.mjs
node --check carousel/reel-package-adapter.js
```

- [ ] **Step 6: Commit the Reel adapter.**

```powershell
git add carousel/ui.js carousel/prompts.js carousel/editorial-contract.js carousel/reel-package-adapter.js carousel/reel-package-adapter.test.mjs
git commit -m "feat(reel): consume shared editorial package"
git push origin main
```

### Task 6: Add cross-output coherence and compatibility tests

**Files:**
- Create: `shared/editorial-integration.test.mjs`
- Modify: `placas-v2/editorial-core.test.mjs`
- Modify: `worker/placas-v2.test.mjs`
- Modify: `carousel/shared-package-adapter.test.mjs`
- Modify: `carousel/reel-package-adapter.test.mjs`

**Interfaces:**
- Tests consume only public normalizers and adapters from Tasks 1–5.

- [ ] **Step 1: Add a complete real-shaped article fixture.**

Use a fixture with URL, section, title, summary, body, primary image, secondary images, verified quote, and identified person. Keep the fixture synthetic or repository-local; do not depend on a live website in automated tests.

- [ ] **Step 2: Test shared values across all outputs.**

Assert that plate, carousel, and Reel adapters receive the same URL, original title, section, primary image, and verified editorial data. Assert that social copy references the same story and link.

- [ ] **Step 3: Test fallback behavior.**

Cover inaccessible/empty article fields, unavailable AI response, no quote, no people, no secondary images, and an unsupported requested output. Each case must return a user-visible warning and a deterministic usable output where possible.

- [ ] **Step 4: Test `/placas` isolation.**

Assert through `git diff --name-only` during review and the existing route/file inventory that no `/placas` implementation file is modified by the integration.

- [ ] **Step 5: Run the full suite.**

```powershell
node --test --test-isolation=none shared/*.test.mjs placas-v2/*.test.mjs worker/*.test.mjs carousel/*.test.mjs
node --check placas-v2/app.mjs
node --check carousel/ui.js
git diff --check
```

Expected: all tests pass, all browser and worker entry modules parse, and no `/placas` file appears in the diff.

- [ ] **Step 6: Commit the integration tests.**

```powershell
git add shared/editorial-integration.test.mjs placas-v2/editorial-core.test.mjs worker/placas-v2.test.mjs carousel/shared-package-adapter.test.mjs carousel/reel-package-adapter.test.mjs
git commit -m "test: verify editorial output coherence"
git push origin main
```

### Task 7: Document deployment and handoff

**Files:**
- Create: `docs/editorial-suite.md`
- Modify: `docs/index.md`
- Modify: `README.md`

**Interfaces:**
- Documents the endpoint request/response, migration behavior, manual Cloudflare worker deployment, and standalone `/carousel` compatibility.

- [ ] **Step 1: Document the operator flow.**

Explain that `/placas-v2` is the main entry, how to choose each output, and that the worker must be copied/deployed manually in Cloudflare when worker files change.

- [ ] **Step 2: Document compatibility and rollback.**

State that `/carousel` remains available and that the new orchestrator can be disabled without changing `/placas`.

- [ ] **Step 3: Add the documentation index links.**

Link the new guide from `docs/index.md` and the project README without changing application behavior.

- [ ] **Step 4: Review and commit documentation.**

```powershell
git diff --check
git add docs/editorial-suite.md docs/index.md README.md
git commit -m "docs: document editorial suite migration"
git push origin main
```

## Final verification

Run from `C:\Users\Miguel\Documents\New project`:

```powershell
node --test --test-isolation=none shared/*.test.mjs placas-v2/*.test.mjs worker/*.test.mjs carousel/*.test.mjs
node --check worker/worker.js
node --check worker/worker-dashboard.js
node --check placas-v2/app.mjs
node --check carousel/ui.js
git diff --check
git status --short
```

Expected:

- all tests pass;
- all entry modules parse;
- no `/placas` file is modified;
- only intentional untracked environment attachments remain uncommitted;
- the final commit is pushed to `main`.

After this plan is implemented and accepted, begin the separate visual stage for carousel and Reel aesthetics using real news fixtures.
