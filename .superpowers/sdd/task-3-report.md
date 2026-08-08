# Task 3 Report: Canvas editorial modular

## Scope

Changed only the Task 3 Canvas implementation and its focused test suite:

- `carousel/canvas-renderer.js`
- `carousel/editorial-carousel.test.mjs`
- `.superpowers/sdd/task-3-report.md`

No Reel file and no `/placas` file was changed. The pre-existing modification to
`.superpowers/sdd/task-1-report.md` was not staged or edited.

## Implementation

- Kept `renderSlideToCanvas(slide, project)` as the only public Canvas render
  entry point.
- Replaced the legacy variant-global renderer routing with a shared Canvas path
  that resolves `resolveCarouselTheme(project, slide)` and
  `getCarouselLayout(slide.template, 1080, 1350)` once per render.
- Added explicit Canvas renderers for normalized `quote` and `image` templates,
  while retaining legacy `cover`, `text`, `stats`, and `end` template support.
- Added private editorial helpers for the section header, slide progress,
  measured text, context card, safe-cropped image frame, and footer.
- Cover renders an image-first composition with the logo in the layout safe
  zone, a section capsule, title/subtitle, and sequence cue.
- Context, stats, quote, image, and end layouts now have distinct editorial
  treatments: context panel; primary fact plus explanation; literal quote plus
  author/role; safe crop plus caption; and source plus CTA, respectively.
- Text uses measured wrapped lines and never adds ellipses. Each measured block
  retains `fullText`/`fullLines`, records the safe `renderedText`/`renderedLines`,
  and sets `overflow: true` when the full copy cannot fit.
- Text fitting receives the available bottom boundary for each layout. It never
  forces a one-line draw when no complete line fits, and it never draws beyond
  the footer. The Canvas exposes the aggregate state as `canvas.renderState`
  and `canvas.editorialOverflow`, allowing the caller to shorten copy
  explicitly while retaining the full-copy overflow result.
- Legacy `text` and `stats` renderers preserve `content.supportImage` through
  the existing image cache, using contain for context and cover for stats.
- Quote attribution now measures the author block and places the role after
  that measured height, avoiding overlap.
- Existing image-cache asset-ready behavior remains in the Canvas path, so a
  preview and PNG export continue to render from the same entry point.

## Test-first record

The new Canvas tests were added before the renderer changes. The red run had two
expected failures: quote author/role were absent because `quote` fell through to
the text renderer, and the image slide did not use `content.image`. After adding
the template-specific renderers, the focused suite passed.

## Verification

Command run after review:

```powershell
node --test carousel/editorial-carousel.test.mjs
```

Result: 20 tests passed, 0 failed.

The suite covers normalization and layout safety, plus Canvas rendering of:

- `dato` / `stats` with its primary fact;
- `cita` / `quote` with literal content, author, and role;
- `imagen` / `image` using the slide image and its caption; and
- a complete `cover` / `text` / `end` sequence through
  `renderSlideToCanvas`.
- long quote and context content whose recorded content baselines remain before
  `layout.safeZones.footer.y` including each line-height;
- unique tail-marker preservation in `renderState.fullText`, with an explicit
  overflow signal when the marker is not rendered in the safe visible lines;
- preserved `supportImage` drawing for both legacy text and stats templates; and
- literal quote content, author-before-role ordering, plus cover/text/end content
  assertions, not only Canvas dimensions.

`git diff --check` also completed with exit code 0 and no whitespace errors.

## Review notes

- The renderer imports only `getCarouselLayout`, `resolveCarouselTheme`, Canvas,
  image, and text helpers; it does not reference Reel or `/placas` code.
- `carousel/core/image.js` already supplied the safe cover-crop primitive used
  by the new image and cover renderers, so it was intentionally left unchanged.
- The existing JSON template descriptors are inert placeholders and are not
  loaded by the Canvas path. They were left unchanged to preserve legacy
  projects rather than introducing unused schema changes.

## Concerns

- The focused Node suite uses a minimal Canvas/Image harness. Browser preview
  and PNG rendering share the same production entry point, but a visual browser
  snapshot was not run in this environment.
