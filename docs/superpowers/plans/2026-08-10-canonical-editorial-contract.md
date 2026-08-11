# Canonical Editorial Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/placas-v2` the sole content source while `/carousel` and `/reels` independently adapt the same canonical contract.

**Architecture:** Keep extraction and canonical editorial fields in the shared package. Generate each requested visual output from that package; Reel must not import, read, or derive from `salidas.carrusel`.

**Tech Stack:** ES modules, Node test runner, browser Canvas UI.

## Global Constraints

- Extract and interpret the news once in `/placas-v2`.
- `/placas` must not be modified.
- Do not invent data, images, or citations.
- Internal Reel images remain optional and manual.

### Task 1: Add an independent Reel adapter

**Files:**
- Modify: `reels/reel-package-adapter.mjs`
- Test: `reels/reel-package-adapter.test.mjs`

**Interfaces:**
- Consumes: canonical package fields `fuente`, `editorial`, and `salidas.placas`.
- Produces: `createReelOutputFromEditorialPackage(editorialPackage)` returning a Reel plan with `scenes`.

- [ ] Write a failing test proving a Reel uses `editorial.contexto`, `editorial.datos_clave`, and `fuente.imagen`, even when `salidas.carrusel` contains different text.
- [ ] Run `node --test reels/reel-package-adapter.test.mjs` and confirm failure because the independent adapter is absent.
- [ ] Implement the adapter from canonical fields only; preserve the existing cover, optional support-image, text-only internal, and CTA behavior.
- [ ] Run the focused test and confirm pass.
- [ ] Commit as `feat: adapt reels directly from editorial contract`.

### Task 2: Remove Reel-to-Carrusel dependency

**Files:**
- Modify: `placas-v2/editorial-output-generation.mjs`
- Modify: `reels/reel-model.mjs`
- Test: `placas-v2/editorial-output-generation.test.mjs`
- Test: `reels/reel-model.test.mjs`

**Interfaces:**
- Consumes: `createReelOutputFromEditorialPackage` from Task 1.
- Produces: independent `salidas.carrusel` and `salidas.reel` outputs from one package.

- [ ] Add a failing assertion that changing `salidas.carrusel` does not change Reel scenes.
- [ ] Replace all Reel fallback calls to `createReelOutputFromCarouselPlan` with the canonical-package adapter.
- [ ] Keep carousel generation independent and preserve one extraction/package flow.
- [ ] Run `node --test --test-isolation=none placas-v2/editorial-output-generation.test.mjs reels/*.test.mjs` and confirm pass.
- [ ] Commit as `refactor: decouple reels from carousel output`.

### Task 3: Verify direct URL and handoff flows

**Files:**
- Test: `reels/reel-session.test.mjs`
- Test: `shared/editorial-suite.integration.test.mjs` if existing assertions require updating.

- [ ] Test URL-generated Reel and Placas V2 handoff with conflicting carousel output; assert the Reel follows canonical fields.
- [ ] Run the complete relevant test set and `node --check reels/app.mjs`.
- [ ] Confirm `git diff --name-only` contains no `/placas` files.
- [ ] Commit as `test: verify independent editorial output adapters`.

### Task 4: Publish and inspect final state

- [ ] Run `git status --short --branch` and preserve unrelated user files.
- [ ] Push only the three focused commits to `main`.
- [ ] Report test results and the final commit hashes.
