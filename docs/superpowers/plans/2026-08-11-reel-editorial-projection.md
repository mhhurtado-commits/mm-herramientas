# Reel Editorial Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate publishable, short-form Reel scenes from the Placas V2 editorial package without duplicating, truncating, or mixing news content.

**Architecture:** Reel keeps an independent package projection that follows the stable Carrusel plan when it exists, but does not import Carrusel code. The projection emits source-bound scene candidates; the Reel adapter selects a cover, context, up to two concise fact scenes, and a branded closure. The renderer fits complete text into role-specific safe areas instead of slicing strings.

**Tech Stack:** ES modules, Node test runner, Canvas 2D renderer.

## Global Constraints

- Do not modify `/placas`.
- Do not change Carrusel behavior or its adapter.
- Reel accepts only data in the Placas V2 package and never raw scraped body text.
- No ellipses, clipped words, file paths, or content from another story in exported scenes.
- Internal images remain optional and manually replaceable; no image is invented.
- Reel remains 9:16, silent, readable, and exportable as PNG scenes.

---

### Task 1: Define the independent editorial projection

**Files:**
- Modify: `reels/reel-shared-package-adapter.mjs`
- Modify: `reels/reel-shared-package-adapter.test.mjs`

**Interfaces:**
- Consumes: `EditorialPackage` with `editorial`, `fuente`, and optional `salidas.carrusel`.
- Produces: `fromEditorialPackage(package)` with `article`, `categoryOptions`, and ordered `storyBlocks`.

- [ ] **Step 1: Write failing tests** for a package where Carrusel has structured slides and stale generic editorial facts; assert that `storyBlocks` contains only the slide-derived context/facts in source order and excludes paths and stale text.

- [ ] **Step 2: Run the focused test**

Run: `node --test reels/reel-shared-package-adapter.test.mjs`

Expected: FAIL because `storyBlocks` is not returned.

- [ ] **Step 3: Implement the projection**

Create one normalized block per useful Carrusel slide (`contexto`, `dato`, `clave`, `impacto`, `timeline`) and use `editorial.contexto` / `editorial.datos_clave` only if the plan is absent. Filter technical paths and exact duplicates before returning blocks.

- [ ] **Step 4: Run the focused test**

Run: `node --test reels/reel-shared-package-adapter.test.mjs`

Expected: PASS.

### Task 2: Compose short, non-repeated Reel scenes

**Files:**
- Modify: `reels/reel-package-adapter.mjs`
- Modify: `reels/reel-package-adapter.test.mjs`
- Modify: `reels/reel-model.mjs`
- Modify: `reels/reel-model.test.mjs`

**Interfaces:**
- Consumes: `fromEditorialPackage(package).storyBlocks`.
- Produces: `createReelOutputFromEditorialPackage(package).scenes` and `createReelProject(package).scenes`.

- [ ] **Step 1: Write failing tests** asserting: complete card wording has no ellipsis; repeated facts are emitted once; a plan with two facts creates distinct fact scenes; stored Reel text cannot override current package content; and closure has a concise domain-led supporting line.

- [ ] **Step 2: Run focused tests**

Run: `node --test reels/reel-package-adapter.test.mjs reels/reel-model.test.mjs`

Expected: FAIL because the current adapter truncates cards and combines stale/fallback facts.

- [ ] **Step 3: Implement the scene composer**

Use the fixed sequence `cover -> context -> up to two fact scenes -> closure`; cap the total at five scenes. Preserve complete selected sentences/cards and skip excess blocks rather than append `...`. Map manual stored images by visual role only; regenerate all editorial text from the current package.

- [ ] **Step 4: Run focused tests**

Run: `node --test reels/reel-package-adapter.test.mjs reels/reel-model.test.mjs`

Expected: PASS.

### Task 3: Render a dense, readable vertical composition

**Files:**
- Modify: `reels/reel-renderer.mjs`
- Modify: `reels/reel-renderer.test.mjs`

**Interfaces:**
- Consumes: normalized Reel scene fields `type`, `title`, `body`, `cards`, `image`, `accent`, `cta`.
- Produces: 1080x1920 Canvas output with all text inside safe areas.

- [ ] **Step 1: Write failing layout tests** for text-only internal scenes, image-assisted internal scenes, and closure; assert that internal content area occupies most of the safe height and that fitted text is never sliced.

- [ ] **Step 2: Run the focused test**

Run: `node --test reels/reel-renderer.test.mjs`

Expected: FAIL because `wrapText` slices to a fixed number of lines and current text-only frames leave most of the canvas empty.

- [ ] **Step 3: Implement the role-based renderer**

Render text-only scenes as a full-height editorial surface with a large heading, structured body or cards, and accent rail. Render optional-image scenes as an upper image band with blur-safe containment and a lower editorial surface. Use a fitting routine that reduces font size within a defined floor and returns all lines; scene selection, not clipping, controls density. Build closure around title, one supporting line, domain, and CTA.

- [ ] **Step 4: Run the focused test**

Run: `node --test reels/reel-renderer.test.mjs`

Expected: PASS.

### Task 4: Verify package boundaries and publish the Reel-only change

**Files:**
- Modify only files listed in Tasks 1–3 plus their tests.

- [ ] **Step 1: Run all Reel and package-generation tests**

Run: `node --test --test-isolation=none reels/*.test.mjs placas-v2/editorial-output-generation.test.mjs`

Expected: all tests pass.

- [ ] **Step 2: Check unaffected scopes**

Run: `git diff -- placas` and `git diff -- carousel`

Expected: no `/placas` changes and no authored Carrusel change.

- [ ] **Step 3: Commit and push scoped files**

Run: `git add reels placas-v2/editorial-output-generation.mjs placas-v2/editorial-output-generation.test.mjs docs/superpowers/plans/2026-08-11-reel-editorial-projection.md && git commit -m "feat: redesign reel editorial projection" && git push origin main`

Expected: commit and push succeed without staging user changes in `carousel/editorial-carousel.test.mjs`.
