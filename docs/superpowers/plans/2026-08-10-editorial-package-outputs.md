# Editorial Package Outputs Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with verification checkpoints.

**Goal:** Generate reusable carousel and reel outputs when `/placas-v2` receives a note, then render them without re-extraction or re-generation downstream.

**Architecture:** `/placas-v2` enriches the canonical v2 package with `salidas.carrusel` and `salidas.reel`. `/carousel` and `/reels` prefer those outputs and retain direct-URL generation only as fallback.

**Tech Stack:** Browser ES modules, existing `/social/generar` worker endpoint, Node built-in tests.

## Global Constraints

- Do not modify `/placas`.
- Preserve source images and verified editorial text.
- Do not commit existing unrelated worktree changes.
- Commit and push only this stage.

### Task 1: Generate reusable outputs

**Files:** Create `placas-v2/editorial-output-generation.mjs` and test; modify `placas-v2/app.mjs`.

### Task 2: Consume stored outputs

**Files:** Modify `carousel/carousel-engine.js`, `carousel/ui.js`, `carousel/reel-package-adapter.js`, and `reels/reel-model.mjs` with focused tests.

### Task 3: Verify and publish

Run focused tests, syntax checks, inspect `/placas` diff, then commit and push only stage files.
