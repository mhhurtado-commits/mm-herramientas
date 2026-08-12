# Carousel Interior Images Implementation Plan

> **For agentic workers:** Execute inline in this session with tests before implementation.

**Goal:** Make carousel interior images prominent and manually replaceable per slide.

**Architecture:** Keep the existing shared contract and `supportImage` field. Add manual data-image sources through carousel UI state, then let the existing renderer choose a large image layout or full text layout per slide.

**Tech Stack:** Browser ES modules, Canvas 2D, Node test runner.

## Global Constraints

- Do not modify `/placas`, `/placas-v2`, or `/reels`.
- Cover keeps its main image; closure remains image-free.
- Manual image source has priority over contract-derived support images.
- Preserve safe image fitting and focal position behavior.

### Task 1: Model and renderer behavior

**Files:** Modify `carousel/slide-model.js`, `carousel/canvas-renderer.js`, Test `carousel/editorial-carousel.test.mjs`.

- [x] Add failing tests for manual data-image preservation and large internal image bounds.
- [x] Run the focused tests and confirm failure.
- [x] Update normalization/rendering minimally so manual sources survive and internal layouts allocate a protagonist image block.
- [x] Run focused and full carousel tests.

### Task 2: Manual image controls

**Files:** Modify `carousel/ui.js`, `carousel/style.css`, Test `carousel/editorial-carousel.test.mjs` if a pure helper is needed.

- [x] Add per-slide file input for internal scenes, using `FileReader` data URLs.
- [x] Add remove action and preserve focus controls when an image exists.
- [x] Re-render and persist through the existing project state path.
- [x] Run syntax and full carousel tests.

### Task 3: Verification and delivery

- [x] Run all carousel tests and `git diff --check`.
- [x] Confirm `git diff --name-only` contains only carousel files plus this plan.
- [ ] Commit and push the focused change to `main`.
