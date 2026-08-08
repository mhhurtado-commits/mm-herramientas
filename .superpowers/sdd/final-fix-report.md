# Final overflow-surface fix report

## Scope

- Modified only `carousel/ui.js`, `carousel/style.css`, and `carousel/editorial-carousel.test.mjs`.
- Added this required report. The pre-existing `.superpowers/sdd/task-1-report.md` change was preserved and not staged.
- Did not modify `/placas` or any Reel flow.

## Root cause

The shared canvas renderer already exposed `canvas.renderState.overflow` and `canvas.editorialOverflow`, but carousel preview and PNG exports ignored those signals. This allowed omitted text to be exported silently.

## TDD evidence

1. Added a focused regression test for rendered-slide metadata with overflow.
2. Confirmed RED: the test failed because `getCarouselExportEligibility` was not exported.
3. Implemented the smallest helper and UI/export integration.
4. Confirmed GREEN: the targeted editorial-carousel test passed.

## Implementation

- Preview renders an alert next to its stage metadata when the active canvas reports overflow. The message identifies the slide and overflowing block and directs the user to shorten the text.
- Single-slide PNG export checks the rendered canvas before making a blob/download.
- All-slide PNG export renders every carousel slide first and refuses the entire batch when any canvas reports overflow. The preflight canvases are then used for the normal download path.
- Normal exports remain eligible when no canvas reports overflow.

## Verification

- `node --test carousel/editorial-carousel.test.mjs` — 24 passing
- `node --test carousel/*.test.mjs shared/*.test.mjs` — 33 passing
- `git diff --check` — passing

The Node test runner required elevated permission because sandboxed worker creation failed with `spawn EPERM`.

## Self-review

- Confirmed detection reads both exposed overflow flags.
- Confirmed all-slide preflight and preview use the existing carousel/canvas renderer.
- Confirmed the diff contains no `/placas` or Reel changes.

## Concerns

None identified. The only unrelated working-tree change is the pre-existing `task-1-report.md`, which is intentionally excluded from the commit.
