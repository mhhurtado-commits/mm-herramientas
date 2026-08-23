# Task 2: timed canvas overlay layers

## RED

Command:

```powershell
node --test --test-isolation=none video-vertical/video-overlay-layers.test.mjs video-vertical/video-renderer.test.mjs
```

Observed expected failures before implementation:

- `ERR_MODULE_NOT_FOUND` for `video-overlay-layers.mjs`.
- `video-renderer.mjs` did not export `drawEditorialLayer`.

## GREEN

Implemented `getOverlayLayerPlan()` with fixed, title, then speaker schedules. Split editorial rendering into fixed, title and speaker layers. Preview uses the fixed layer at every time, title only while `time < 4`, and the active speaker marker in its four-second window.

Fresh verification:

```powershell
node --test --test-isolation=none video-vertical/video-overlay-layers.test.mjs video-vertical/video-renderer.test.mjs video-vertical/video-speakers.test.mjs video-vertical/video-project.test.mjs
node --check video-vertical/video-renderer.mjs
node --check video-vertical/video-overlay-layers.mjs
git diff --check
```

Result: 17 passing tests; both syntax checks and whitespace check exited 0.

## Boundary follow-up

Reviewer found that the title condition accepted negative timestamps. RED test verified that `time: -1` still drew the title. The title gate is now `time >= 0 && time < TITLE_DURATION`.

Focused GREEN verification:

```powershell
node --test --test-isolation=none video-vertical/video-overlay-layers.test.mjs video-vertical/video-renderer.test.mjs
```

Result: 5 passing tests. The test verifies `-1`, `3.999`, and `4`; it also verifies the fixed logo layer remains present at each instant.
