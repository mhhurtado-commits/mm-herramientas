# Video Vertical Speaker Markers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add manual, four-second name-and-role markers with playback controls and identical timed overlays in preview, Cloudinary export, and local FFmpeg export.

**Architecture:** Keep temporal rules in a pure `video-speakers.mjs` module. Canvas rendering receives an explicit overlay layer descriptor; the browser turns those descriptors into PNGs. The Worker stores the layer schedule while signing uploads and Cloudinary applies every layer with its own start offset and duration.

**Tech Stack:** Vanilla ES modules, HTML canvas, native video element, FFmpeg.wasm, Cloudflare Worker/KV, Cloudinary eager transformations.

## Global Constraints

- The title is visible from 0 until before 4 seconds; person markers use four seconds.
- A person marker beginning before 4 seconds has effective start `4`.
- Person name is required and at most 48 characters; role is optional and at most 72.
- Visible marker intervals cannot overlap.
- Fast export remains 720p Cloudinary with original audio and source limit of 100 MB.
- `worker/worker.js` remains standalone because it is pasted directly into the Cloudflare dashboard.
- Regenerate `worker/worker-dashboard.js` after every `worker/worker.js` change.
- Do not stage `.superpowers/`, attachments, or unrelated `worker/image-generation-config.mjs` changes.

---

### Task 1: Speaker timeline domain model

**Files:**
- Create: `video-vertical/video-speakers.mjs`
- Create: `video-vertical/video-speakers.test.mjs`
- Modify: `video-vertical/video-project.mjs`
- Modify: `video-vertical/video-project.test.mjs`

**Interfaces:**
- Produces `TITLE_DURATION = 4`, `normalizeSpeakerMarkers(markers, duration)`, `getActiveSpeaker(markers, time)`, `createSpeakerMarker(input, duration)`.
- `normalizeVideoProject(project)` produces `speakers: SpeakerMarker[]`.

- [ ] **Step 1: Write failing model tests**

```js
import { TITLE_DURATION, createSpeakerMarker, getActiveSpeaker, normalizeSpeakerMarkers } from './video-speakers.mjs';

test('moves an opening speaker marker after the title', () => {
  const markers = normalizeSpeakerMarkers([{ id: 'ana', start: 1, name: 'Ana Pérez', role: 'Especialista' }], 30);
  assert.deepEqual(markers[0], { id: 'ana', start: TITLE_DURATION, duration: 4, name: 'Ana Pérez', role: 'Especialista' });
});
test('rejects overlapping visible intervals', () => {
  assert.throws(() => normalizeSpeakerMarkers([{ id: 'a', start: 5, name: 'Ana' }, { id: 'b', start: 7, name: 'Juan' }], 30), /superponen/i);
});
test('finds the current speaker only during its four seconds', () => {
  const marker = createSpeakerMarker({ id: 'ana', start: 8, name: 'Ana Pérez', role: 'Especialista' }, 30);
  assert.equal(getActiveSpeaker([marker], 10).id, 'ana');
  assert.equal(getActiveSpeaker([marker], 12), null);
});
```

- [ ] **Step 2: Run failing tests**

Run: `node --test --test-isolation=none video-vertical/video-speakers.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND` for `video-speakers.mjs`.

- [ ] **Step 3: Implement the bounded model and project persistence**

```js
export const TITLE_DURATION = 4;
export function normalizeSpeakerMarkers(markers = [], duration = Infinity) {
  const normalized = markers.map(marker => ({
    id: String(marker.id || crypto.randomUUID()),
    start: Math.max(TITLE_DURATION, Math.min(Number(duration) || 0, Number(marker.start) || 0)),
    duration: TITLE_DURATION,
    name: clean(marker.name).slice(0, 48),
    role: clean(marker.role).slice(0, 72),
  })).filter(marker => marker.name);
  normalized.sort((a, b) => a.start - b.start);
  for (let index = 1; index < normalized.length; index += 1) if (normalized[index].start < normalized[index - 1].start + TITLE_DURATION) throw new Error('Los rótulos de personas se superponen.');
  return normalized;
}
export const getActiveSpeaker = (markers, time) => markers.find(marker => time >= marker.start && time < marker.start + marker.duration) || null;
```

Add `speakers: normalizeSpeakerMarkers(input.speakers)` to `normalizeVideoProject` and pass `options.speakers` from `createVideoProject`.

- [ ] **Step 4: Run focused model and project tests**

Run: `node --test --test-isolation=none video-vertical/video-speakers.test.mjs video-vertical/video-project.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add video-vertical/video-speakers.mjs video-vertical/video-speakers.test.mjs video-vertical/video-project.mjs video-vertical/video-project.test.mjs
git commit -m "feat(video): add manual speaker marker model"
```

### Task 2: Timed canvas overlay layers

**Files:**
- Modify: `video-vertical/video-renderer.mjs`
- Modify: `video-vertical/video-renderer.test.mjs`
- Create: `video-vertical/video-overlay-layers.mjs`
- Create: `video-vertical/video-overlay-layers.test.mjs`

**Interfaces:**
- Consumes `project.speakers` and `TITLE_DURATION`.
- Produces `getOverlayLayerPlan(project)` returning `{ id, kind, start, duration, speaker? }[]` in fixed/title/speaker order.
- Produces `drawEditorialLayer(ctx, project, layer, { logo })`.

- [ ] **Step 1: Write failing layer-plan and renderer tests**

```js
test('builds fixed, title and speaker PNG schedules', () => {
  assert.deepEqual(getOverlayLayerPlan(project), [
    { id: 'fixed', kind: 'fixed', start: 0, duration: null },
    { id: 'title', kind: 'title', start: 0, duration: 4 },
    { id: 'ana', kind: 'speaker', start: 8, duration: 4, speaker: { id: 'ana', start: 8, duration: 4, name: 'Ana Pérez', role: 'Especialista' } },
  ]);
});
test('renders a speaker layer without the title lower third', () => {
  drawEditorialLayer(ctx, project, { kind: 'speaker', speaker: { name: 'Ana Pérez', role: 'Especialista' } });
  assert.ok(calls.includes('ANA PÉREZ'));
  assert.ok(calls.includes('Especialista'));
  assert.ok(!calls.includes(project.lowerThird.title));
});
```

- [ ] **Step 2: Run failing tests**

Run: `node --test --test-isolation=none video-vertical/video-overlay-layers.test.mjs video-vertical/video-renderer.test.mjs`

Expected: missing exports or assertions fail.

- [ ] **Step 3: Implement separate fixed, title and person draw paths**

```js
export function drawEditorialLayer(ctx, project, layer, options = {}) {
  if (layer.kind === 'fixed') { drawBrandLogo(ctx, options.logo, options.layout.safe); drawHook(ctx, project.lowerThird, options.layout.hook); }
  if (layer.kind === 'title') drawLowerThird(ctx, project.lowerThird, options.layout.lowerThird);
  if (layer.kind === 'speaker') drawSpeakerLowerThird(ctx, layer.speaker, project.lowerThird.accent, options.layout.lowerThird);
}
export function drawEditorialOverlay(ctx, project, options = {}) {
  drawEditorialLayer(ctx, project, { kind: 'fixed' }, options);
  if (options.time < 4) drawEditorialLayer(ctx, project, { kind: 'title' }, options);
  const speaker = getActiveSpeaker(project.speakers || [], options.time);
  if (speaker) drawEditorialLayer(ctx, project, { kind: 'speaker', speaker }, options);
  drawCaption(ctx, activeCaption(project.captions, options.time), options.layout.caption);
}
```

- [ ] **Step 4: Run render tests**

Run: `node --test --test-isolation=none video-vertical/video-overlay-layers.test.mjs video-vertical/video-renderer.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add video-vertical/video-renderer.mjs video-vertical/video-renderer.test.mjs video-vertical/video-overlay-layers.mjs video-vertical/video-overlay-layers.test.mjs
git commit -m "feat(video): render timed speaker overlays"
```

### Task 3: Playback and manual marker editor

**Files:**
- Modify: `video-vertical/index.html`
- Modify: `video-vertical/style.css`
- Modify: `video-vertical/app.mjs`
- Create: `video-vertical/video-timeline.mjs`
- Create: `video-vertical/video-timeline.test.mjs`

**Interfaces:**
- `timeFromTimelinePosition({ clientX, left, width, duration })` returns a clamped seconds value.
- `markerPercent(marker, duration)` returns the position percentage for marker rendering.
- UI calls `createSpeakerMarker({ start: video.currentTime, name, role }, state.duration)` and assigns `state.project.speakers` through `normalizeSpeakerMarkers`.

- [ ] **Step 1: Write failing timeline math tests**

```js
test('converts clicks and drags to bounded video time', () => {
  assert.equal(timeFromTimelinePosition({ clientX: 150, left: 100, width: 200, duration: 80 }), 20);
  assert.equal(timeFromTimelinePosition({ clientX: 500, left: 100, width: 200, duration: 80 }), 80);
});
test('places a marker at its percentage of duration', () => assert.equal(markerPercent({ start: 20 }, 80), 25));
```

- [ ] **Step 2: Run failing timeline test**

Run: `node --test --test-isolation=none video-vertical/video-timeline.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND` for `video-timeline.mjs`.

- [ ] **Step 3: Implement controls and editor**

Add to `index.html` below the canvas: play/pause, `-5 s`, `+5 s`, current time, range input, marker track, name/cargo inputs, add-marker button and editable marker list. Add CSS for visible progress, marker pins and selected marker cards. In `app.mjs`, synchronize `video.currentTime`, the range input and canvas redraw; pause before adding a marker; clear speakers on loading another source; disable add-marker until metadata is available.

```js
function addSpeakerMarker() {
  video.pause();
  state.project.speakers = normalizeSpeakerMarkers([...state.project.speakers, createSpeakerMarker({ start: video.currentTime, name: $('#speakerNameInput').value, role: $('#speakerRoleInput').value }, state.duration)], state.duration);
  renderSpeakerMarkers(); draw();
}
```

- [ ] **Step 4: Run tests and syntax check**

Run: `node --test --test-isolation=none video-vertical/video-timeline.test.mjs video-vertical/video-project.test.mjs video-vertical/video-renderer.test.mjs && node --check video-vertical/app.mjs`

Expected: all tests pass and `node --check` exits 0.

- [ ] **Step 5: Commit**

```bash
git add video-vertical/index.html video-vertical/style.css video-vertical/app.mjs video-vertical/video-timeline.mjs video-vertical/video-timeline.test.mjs
git commit -m "feat(video): add manual speaker timeline controls"
```

### Task 4: Timed local FFmpeg export

**Files:**
- Modify: `video-vertical/video-export.mjs`
- Modify: `video-vertical/video-export.test.mjs`
- Modify: `video-vertical/app.mjs`

**Interfaces:**
- `exportEditorialVideo({ ffmpeg, source, layers, ... })` accepts PNG blobs with `{ blob, start, duration }`.
- `buildExportCommand({ layers, ... })` creates `enable='between(t,start,end)'` overlay filters for every timed layer.

- [ ] **Step 1: Write failing FFmpeg filter tests**

```js
test('applies the title and a speaker PNG only in their scheduled windows', () => {
  const joined = buildExportCommand({ layers: [{ name: 'fixed.png' }, { name: 'title.png', start: 0, duration: 4 }, { name: 'ana.png', start: 8, duration: 4 }] }).join(' ');
  assert.match(joined, /enable='between\(t,0,4\)'/);
  assert.match(joined, /enable='between\(t,8,12\)'/);
});
```

- [ ] **Step 2: Run failing FFmpeg test**

Run: `node --test --test-isolation=none video-vertical/video-export.test.mjs`

Expected: timed filter assertion fails.

- [ ] **Step 3: Build layer blobs and chain FFmpeg overlays**

Write every scheduled PNG with `ffmpeg.writeFile`. Keep the existing video framing graph, then append one scaled overlay filter per layer. Fixed layer omits `enable`; all other layers use `enable='between(t,start,start + duration)'`. Preserve audio selection behavior and output options.

- [ ] **Step 4: Run local export tests**

Run: `node --test --test-isolation=none video-vertical/video-export.test.mjs video-vertical/video-overlay-layers.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add video-vertical/video-export.mjs video-vertical/video-export.test.mjs video-vertical/app.mjs
git commit -m "feat(video): time local speaker overlays"
```

### Task 5: Timed Cloudinary layer schedule

**Files:**
- Modify: `video-vertical/cloudinary-export.mjs`
- Modify: `video-vertical/cloudinary-export.test.mjs`
- Modify: `worker/worker.js`
- Modify: `worker/cloudinary-video.test.mjs`
- Modify: `worker/cloudinary-video-router.test.mjs`
- Regenerate: `worker/worker-dashboard.js`

**Interfaces:**
- Browser calls `exportCloudinaryVideo({ source, layers, format, framingMode })` where each layer is `{ blob, id, kind, start, duration }`.
- Worker persists `job.layers` with a signed `publicId` per uploaded PNG.
- `buildCloudinaryEagerTransform({ layers, width, height, framingMode })` applies fixed first, then every timed `l_<publicId>/.../fl_layer_apply,g_center,so_<start>,du_<duration>` chain.

- [ ] **Step 1: Write failing browser and Worker tests**

```js
test('requests and uploads one signed PNG per scheduled layer', async () => {
  await exportCloudinaryVideo({ source, layers: [{ id: 'fixed', blob }, { id: 'title', blob, start: 0, duration: 4 }, { id: 'ana', blob, start: 8, duration: 4 }], workerUrl, fetcher, wait });
  assert.equal(calls.filter(([url]) => url.includes('/upload/')).length, 4);
  assert.deepEqual(JSON.parse(calls[0][1].body).layers.map(layer => layer.id), ['fixed', 'title', 'ana']);
});
test('creates timed Cloudinary layers after the fixed layer', () => {
  assert.match(buildCloudinaryEagerTransform(job), /so_8,du_4/);
});
```

- [ ] **Step 2: Run failing Cloudinary tests**

Run: `node --test --test-isolation=none video-vertical/cloudinary-export.test.mjs worker/cloudinary-video.test.mjs worker/cloudinary-video-router.test.mjs`

Expected: payload and transformation assertions fail.

- [ ] **Step 3: Implement layer signatures, uploads and transformation chaining**

In `handleCloudinaryVideoCreate`, validate a maximum of 26 layer descriptors, require one `fixed` layer, validate non-fixed `start >= 0` and `duration === 4`, assign `mm-video-vertical/overlay-<job-id>-<layer-id>` public IDs and return `overlayUploads[]`. In browser code, upload source plus every PNG in order. In `buildCloudinaryEagerTransform`, retain current `c_pad`/`c_fill` framing then append the fixed layer and timed title/speaker layers with `so_`/`du_` at `fl_layer_apply`.

- [ ] **Step 4: Regenerate dashboard bundle and run all focused tests**

Run: `node worker/build-dashboard.mjs && node --check worker/worker.js && node --check worker/worker-dashboard.js && node --test --test-isolation=none video-vertical/cloudinary-export.test.mjs worker/cloudinary-video.test.mjs worker/cloudinary-video-router.test.mjs`

Expected: bundle generated; syntax checks exit 0; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add video-vertical/cloudinary-export.mjs video-vertical/cloudinary-export.test.mjs worker/worker.js worker/cloudinary-video.test.mjs worker/cloudinary-video-router.test.mjs worker/worker-dashboard.js
git commit -m "feat(video): export timed speaker layers remotely"
```

### Task 6: End-to-end verification and handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-08-22-video-vertical-speaker-markers-design.md` only if behavior differs from this plan.

- [ ] **Step 1: Run full video vertical suite**

Run: `node --test --test-isolation=none video-vertical/*.test.mjs worker/cloudinary-video.test.mjs worker/cloudinary-video-router.test.mjs`

Expected: all tests pass.

- [ ] **Step 2: Inspect the staged scope**

Run: `git status --short && git diff --check && git diff --stat HEAD`

Expected: only video-vertical, worker Cloudinary files, regenerated dashboard bundle and approved documentation; no `.superpowers/`, attachments or `worker/image-generation-config.mjs`.

- [ ] **Step 3: Push the verified commits**

```bash
git push origin main
```

- [ ] **Step 4: Verify deployment and communicate Worker step**

Confirm that `https://mediamendoza.pages.dev/video-vertical/` serves the timeline UI. Tell the user to paste the latest standalone `worker/worker.js` into the Cloudflare dashboard and deploy it before testing fast export. Verify a real two-person video after the Worker deployment.
