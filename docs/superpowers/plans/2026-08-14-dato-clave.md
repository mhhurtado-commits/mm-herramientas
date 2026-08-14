# Dato clave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a clean, saveable `dato-clave` plate with one dominant fact and up to two secondary facts.

**Architecture:** Extend `placa_noticia` with optional `datos_clave`, normalize it centrally, add a deterministic renderer branch and expose the type in `/placas-v2`. Keep old packages, existing types, and `/placas` unchanged.

**Tech Stack:** ES modules, Canvas 2D, Node test runner, Cloudflare Worker.

## Global Constraints

- `dato-clave` is available for every note and section.
- Render only verified supplied facts; never invent numbers.
- Render one to three facts, with the first fact dominant.
- No long bajada or editorial contexto in this model.

### Task 1: Contract tests

**Files:** `placas-v2/editorial-core.test.mjs`, `worker/placas-v2.test.mjs`

- [ ] Add failing tests for `datos_clave` normalization, fallback to `contexto`, third variant, safe layouts, render without bajada/contexto, and Worker prompt/schema.
- [ ] Run `node --test placas-v2/editorial-core.test.mjs worker/placas-v2.test.mjs` and confirm the new assertions fail.

### Task 2: Core contract and layout

**Files:** `placas-v2/editorial-core.mjs`

- [ ] Add `PLATE_TYPES['dato-clave']`.
- [ ] Normalize `datos_clave` from an array of `{label,value,detail}`; retain non-empty values, cap at three, and use `contexto` as a single fallback item.
- [ ] Add `dato-clave` to accepted types and deterministic variants, preserving the existing three synthetic variants.
- [ ] Add a safe layout with title, primary fact, secondary facts, source/date footer, and zero `dek`/`context` heights.

### Task 3: Renderer and UI

**Files:** `placas-v2/renderer.mjs`, `placas-v2/app.mjs`

- [ ] Render title, first fact large, remaining facts in compact cards, and source/date; do not draw `bajada` or `contexto`.
- [ ] Support 4:5, square, Story, and landscape through layout rectangles.
- [ ] Add the type to the selector and show an editor for up to three facts.

### Task 4: Worker and regression

**Files:** `worker/worker.js`, `worker/placas-v2.mjs`, relevant tests

- [ ] Add `datos_clave` to prompts and allowed type lists.
- [ ] Normalize Worker output without changing `titulo`.
- [ ] Run `node --test placas-v2/*.test.mjs worker/*.test.mjs`, syntax checks, and `git diff --check`.

### Task 5: Publish

- [ ] Commit only the spec, plan, implementation, and tests.
- [ ] Push `origin/main` and verify the remote hash.
