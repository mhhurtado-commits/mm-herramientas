# Foto completa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `foto-completa` to `/placas-v2` as a full-bleed photo plate with overlaid synthetic headline and logo, available for every note.

**Architecture:** Extend the existing `placa_noticia` type contract and deterministic variants. Reuse normalized focus, synthetic-title normalization, typography, metadata, and image helpers; add only a dedicated layout/render branch for the full-bleed composition. Keep `/placas` and traditional renderers unchanged.

**Tech Stack:** ES modules, Canvas 2D renderer, Node built-in test runner, Cloudflare Worker JavaScript.

## Global Constraints

- `foto-completa` is available for every note and section.
- The model uses `titulo_sintetico`, falling back to `titulo` for old packages.
- The image is full bleed; the title is white over a bottom gradient; the logo is overlaid in the top safe area.
- No label, bajada, or contexto is rendered by this model.
- Preserve `/placas`, existing plate types, and old packages.

---

### Task 1: Contract, variants, and layout tests

**Files:**
- Modify: `placas-v2/editorial-core.test.mjs`
- Modify: `worker/placas-v2.test.mjs`

**Interfaces:**
- Test `PLATE_TYPES['foto-completa']`, `normalizeNewsPlate`, `buildEditorialVariants`, and `calculatePlateLayout`.
- Test Worker prompt/schema acceptance for `foto-completa`.

- [ ] **Step 1: Write failing tests**

Add assertions that `foto-completa` normalizes as a valid type, that the third generic variant uses it with the same `titulo_sintetico`, and that its layout has `image` covering the canvas while `title` is inside the bottom safe area and `dek.h === 0` and `context.h === 0`. Assert the Worker prompt contains `foto-completa`.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `node --test placas-v2/editorial-core.test.mjs worker/placas-v2.test.mjs`

Expected: failures because the type, third variant, layout, and prompt are not implemented.

- [ ] **Step 3: Commit the tests**

Run: `git add placas-v2/editorial-core.test.mjs worker/placas-v2.test.mjs; git commit -m "test: specify full-photo plate contract"`

### Task 2: Core contract and layout

**Files:**
- Modify: `placas-v2/editorial-core.mjs`

**Interfaces:**
- Add `PLATE_TYPES['foto-completa']`.
- Allow `foto-completa` in `normalizeNewsPlate`.
- Return it as the third generic variant from `buildEditorialVariants`.
- Extend `calculatePlateLayout` with `syntheticFullBleed: true` and safe `image`, `title`, `footer`, `dek`, and `context` rectangles.

- [ ] **Step 1: Implement the minimal contract**

Use the same normalized `titulo_sintetico` already used by synthetic types. For portrait/square/story, reserve the bottom 37% for copy and keep the image at `{x:0,y:0,w:canvas.w,h:canvas.h}`. For landscape, reserve 32% for copy. Set title width to `canvas.w - margin * 2`, title y to the reserved lower area, and set `dek.h` and `context.h` to zero.

- [ ] **Step 2: Run focused tests**

Run: `node --test placas-v2/editorial-core.test.mjs worker/placas-v2.test.mjs`

Expected: core contract/layout tests pass; renderer tests remain unchanged.

### Task 3: Full-bleed renderer and UI

**Files:**
- Modify: `placas-v2/renderer.mjs`
- Modify: `placas-v2/app.mjs`

**Interfaces:**
- `renderNewsPlate` dispatches `foto-completa` to a dedicated renderer branch.
- UI lists `foto-completa` for every normalized package and shows the existing synthetic-title editor for it.

- [ ] **Step 1: Add renderer regression test**

Extend the renderer test fixture to render `foto-completa` and assert the canvas receives the image draw operation, the synthetic title text, and no `bajada` or `contexto` text.

- [ ] **Step 2: Run the renderer test to verify failure**

Run: `node --test placas-v2/editorial-core.test.mjs`

Expected: the new renderer assertion fails because `foto-completa` currently falls through to the traditional renderer.

- [ ] **Step 3: Implement rendering**

Reuse `adaptiveImage`, `normalizeFocus`, `containImage`, `fitTextToLines`, and `getSyntheticTypography`. Draw the full image first, then a bottom-to-transparent black gradient, then the white synthetic title in the safe copy rectangle, and finally the logo in the top safe area. Do not draw label, dek, or context.

- [ ] **Step 4: Add UI selection**

Include `foto-completa` in `renderTemplates()` and in the synthetic controls visibility condition. Do not alter the existing default recommendation: `titular-arriba` remains first.

- [ ] **Step 5: Run focused tests**

Run: `node --test placas-v2/editorial-core.test.mjs`

Expected: all core and renderer tests pass.

### Task 4: Worker contract and full regression

**Files:**
- Modify: `worker/worker.js`
- Modify: `worker/placas-v2.mjs`

**Interfaces:**
- Worker normalization accepts `foto-completa`.
- Both Worker prompts list the new type and retain the existing synthetic-title rules.

- [ ] **Step 1: Implement Worker updates**

Add `foto-completa` to every allowed type list and instruct the model that it is a valid full-bleed synthetic alternative. Keep `titulo` and `titulo_sintetico` separate.

- [ ] **Step 2: Run full tests and syntax checks**

Run:

```powershell
node --test placas-v2/*.test.mjs worker/*.test.mjs
node --check placas-v2/app.mjs
node --check placas-v2/editorial-core.mjs
node --check placas-v2/renderer.mjs
node --check worker/worker.js
node --check worker/placas-v2.mjs
git diff --check
```

Expected: all tests pass, all checks exit 0, and no changes appear under `/placas`.

- [ ] **Step 3: Commit implementation**

Run: `git add placas-v2/app.mjs placas-v2/editorial-core.mjs placas-v2/editorial-core.test.mjs placas-v2/renderer.mjs worker/placas-v2.mjs worker/worker.js; git commit -m "feat: add full-photo synthetic plate"`

### Task 5: Publish and verify

**Files:**
- No additional files.

- [ ] **Step 1: Push**

Run: `git push origin main`.

- [ ] **Step 2: Verify remote and worktree**

Run: `git status --short; git log -1 --oneline; git ls-remote origin refs/heads/main`.

Expected: remote hash equals the implementation commit; only the pre-existing untracked user attachment directory remains.

