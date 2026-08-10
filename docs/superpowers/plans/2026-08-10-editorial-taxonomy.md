# Editorial Taxonomy Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with verification checkpoints.

**Goal:** Make `/carousel` and `/reels` consume one shared category taxonomy from the editorial package.

**Architecture:** Add a small shared ESM module that normalizes category options and resolves accent colors only from contract data, with a safe general fallback. Both tools import it; `/placas` remains unchanged.

**Tech Stack:** Browser ES modules, Node built-in tests.

## Global Constraints

- Do not modify `/placas`.
- Categories and alternatives come from the contract.
- Do not invent images, facts, or citations.
- Keep changes small and independently verifiable.

### Task 1: Shared taxonomy

**Files:** Create `shared/editorial-taxonomy.mjs` and `shared/editorial-taxonomy.test.mjs`; modify `carousel/shared-package-adapter.js` and `reels/reel-model.mjs`.

- [ ] Write tests for preserving contract options, recommended selection, contract color precedence, and general fallback.
- [ ] Run the focused test and confirm it fails before implementation.
- [ ] Implement the shared normalizer/resolver and wire both consumers.
- [ ] Run focused tests and the affected adapter/model tests.
- [ ] Verify `/placas` has no diff; commit only stage files and push `main`.
