# Generation family fix report

## Status

Implemented and verified the carousel generation-family path end to end.

## Changes

- Updated the carousel prompt to allow `clave`, `contexto`, `dato`, `cita`, `imagen`, and `end`, while documenting the legacy aliases.
- Changed plan normalization to preserve source order, normalize `context` to `contexto`, `facts` to `dato`, and `cta` to `end`, and retain literal quote and image-related fields.
- Kept legacy `impact` as a text-family type for backward-compatible rendering.
- Exported and extended `convertirPlanASlides` with the editorial template mappings and preservation of `quote`, `author`, `role`, `image`, `supportImage`, and `items`.
- Added integration coverage that normalizes, converts, and renders all seven templates (`cover` plus the six editorial families), together with a legacy alias regression.

## TDD evidence

- Baseline: `node --test carousel/*.test.mjs shared/*.test.mjs` passed 39/39.
- RED: the focused test file passed 30 existing tests and failed the three new regressions for the expected missing prompt, parser, and alias behavior.
- GREEN: `node --test carousel/editorial-carousel.test.mjs` passed 33/33 after the implementation.

## Final verification

- `node --test carousel/*.test.mjs shared/*.test.mjs`: 42 passed, 0 failed.
- `git diff --check`: passed.
- Self-review: requirements and source-order/field-preservation behavior checked against `.superpowers/sdd/generation-family-fix.md`.
- Scope review: no `/placas` or Reel files changed.

## Commit

Commit subject: `fix(carousel): generate editorial slide families end to end`.

## Concerns

- `impact` remains a legacy text family because the plan explicitly specifies normalization for `context`, `facts`, and `cta` only; this preserves existing legacy rendering.
- Independent subagent review was unavailable in this session. The requested self-review was completed.
- The pre-existing modification to `.superpowers/sdd/task-1-report.md` was preserved and excluded from this task.
