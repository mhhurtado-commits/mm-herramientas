# Global review fixes report

## Status

Implemented every Important item from `global-review-fixes.md` on branch `carousel-editorial-modular`.

## Changes

- Added a dedicated `key` canvas family for `clave`, with an accent key-point card and distinct thumbnail styling.
- Made canvas text fitting measure with the same weight, style, size, and family used for drawing.
- Bounded section labels/eyebrows, routed their overflow through export eligibility, and recorded semantic roles for rendered text blocks.
- Added awaitable carousel asset preloading for active copy/download and bulk PNG export while preserving preview rerenders on `carousel:asset-ready`.
- Applied the overflow gate to clipboard PNG copy and retained successful normal copies.
- Counted only successful downloads in bulk completion reporting.

## TDD evidence

- RED: the focused carousel test run produced 7 expected failures for the missing `key` family, unweighted measurement, unbounded eyebrow, missing preload, missing clipboard gate, missing batch count, and all-family coverage.
- GREEN: `node --test carousel/editorial-carousel.test.mjs` passed 30 tests with 0 failures.

## Verification

- `node --test carousel/*.test.mjs shared/*.test.mjs`: 39 passed, 0 failed.
- `git diff --check`: exit 0; Git emitted only existing LF-to-CRLF working-copy warnings.
- Self-review checked requirement alignment, export ordering, overflow metadata, batch return values, and changed-path scope.

## Scope protection

- Production/test changes are limited to `carousel/slide-model.js`, `carousel/canvas-renderer.js`, `carousel/ui.js`, `carousel/style.css`, and `carousel/editorial-carousel.test.mjs`.
- This report is the only additional requested artifact.
- No Reel or `/placas` file was modified, and existing Reel selectors, captions, and export paths were not changed.
- The pre-existing unstaged modification to `.superpowers/sdd/task-1-report.md` was preserved and excluded from this work.

## Concerns

- The exact-font fitting helper is local to `carousel/canvas-renderer.js` because `carousel/core/text.js` was outside the authorized file list. This is the smallest safe scoped implementation, but it duplicates the core line-wrapping algorithm and may merit consolidation in a separately approved change.
- An image load failure now stops the affected export instead of silently producing a PNG without that asset; the current user-facing failure message is intentionally generic.

## Commit and push

- Commit message: `fix(carousel): close global review gaps`
- Push target: `origin carousel-editorial-modular`
