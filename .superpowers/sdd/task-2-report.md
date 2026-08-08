# Task 2 Report: Editorial tokens and safe layouts

## Scope delivered

- Added the `mm_editorial` carousel theme, preserving the Media Mendoza ink (`#111111`), section accent (`#a6ce39` by default), pale editorial background, white paper panel, and explicit logo/footer safe-token values.
- Added `resolveCarouselTheme(project, slide)`. It returns an isolated theme object, chooses the slide theme before project theme, defaults to `mm_editorial`, and accepts a per-slide or project section accent without mutating the shared `MMTheme` object.
- Added `getCarouselLayout(kind, width, height)` for `cover`, `internal`, `stats`, `quote`, `image`, and `end`. Each layout returns explicit `safeZones.logo` and `safeZones.footer` rectangles plus a `content` rectangle whose bottom is before the footer.
- Added `fitText(ctx, text, options)`, which wraps against `maxWidth`, reduces only down to `minFontSize`, returns full text lines and `truncated: true` when `maxLines` still cannot contain them, and never adds ellipses. Oversized individual words are split so measured lines do not exceed the width limit.

## TDD evidence

1. Added the theme, two-line context, overflow-without-ellipsis, and footer-bound tests before implementing their exports.
2. Ran `node --test carousel/editorial-carousel.test.mjs`; it failed at module load because `fitText` was not exported, establishing the expected red state.
3. Implemented the minimal exports and reran the focused suite successfully.
4. During self-review, added the long-word width regression test. It failed with `actual: ['larguisima']`, then passed after character-safe wrapping was added.

## Verification

- `git diff --check` completed with exit code 0.
- `node --test carousel/editorial-carousel.test.mjs shared/editorial-package.test.mjs` completed with 16 passing tests and 0 failures.
- The diff contains only the three Task 2 core modules, the carousel editorial test, and this report. `/placas` was not modified.

## Worktree state

- The worktree already contained an unrelated modification to `.superpowers/sdd/task-1-report.md`. It was not read, edited, staged, or included in the Task 2 commit.

## Important review fix: long word after a prior line

### Root cause

`wrapLines` handled an oversized word only when it was the first item of a line. If a prior line existed, it pushed that line and assigned the next word directly, allowing the next line to exceed `maxWidth`.

### Regression and fix

- Added a deterministic measurement regression for `uno herramientalarga` with 10 pixels per character and `maxWidth: 40`.
- The new test failed before the fix with `actual: ['uno', 'herramientalarga']` instead of the width-safe chunks `['uno', 'herr', 'amie', 'ntal', 'arga']`.
- Updated only the existing-line overflow branch to route an oversized next word through `splitWord` before retaining its last chunk as the active line.

### Test output

```text
$ node --test carousel/editorial-carousel.test.mjs shared/editorial-package.test.mjs
tests 17
pass 17
fail 0
duration_ms 297.4997
```
