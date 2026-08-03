# Climate Social Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a selectable Social design for the Climate module that uses local photographic backgrounds, preserves the existing MediaMendoza identity, and produces readable square, Facebook landscape, Instagram portrait, and Story exports without changing the current Informative design.

**Architecture:** Keep `visual-suite/climate.js` as the source of truth for SMN normalization, icon selection, format state, and legacy rendering. Add pure social configuration helpers to that file for testability, and put the social canvas renderer plus photo loading in `visual-suite/climate-social.js`; the two files communicate through small browser globals. The UI adds a design selector, while both preview and export dispatch to the same selected renderer.

**Tech Stack:** Existing browser Canvas renderer, existing `VS_CanvasHelpers`, local JPEG assets in `assets/clima/social/`, Node-based assertion test `visual-suite/climate.test.js`, no new dependency.

## Global Constraints

- Preserve the existing logo asset and `VS_CanvasHelpers.drawPlateLogo` call; do not replace, move, or redraw the logo.
- Keep the Informative mode and its current data flow unchanged for WhatsApp and notes.
- Social mode must support `square`, `landscape`, `portrait`, and `story`.
- Landscape social output uses Facebook dimensions 2400 × 1260 (1.91:1); other formats retain the existing 1600 × 1600, 1350 × 1688, and 1080 × 1920 dimensions.
- Social mode shows the current day plus the following two forecast days.
- Use local photos only; if a photo cannot load, render a deterministic gradient fallback.
- Use the SMN icon assets already stored under `placas/icons` and the existing day/night code selection.
- Preview and PNG export must call the same renderer with the same selected style and format.
- Do not commit `.superpowers/brainstorm/` session artifacts.

---

### Task 1: Define and test social climate rules

**Files:**
- Modify: `visual-suite/climate.test.js`
- Modify: `visual-suite/climate.js`

**Interfaces:**
- Produces `climateSocialBackgroundKey(actual) -> string`.
- Produces `climateSocialVisibleDays(days) -> Array`.
- Produces `climateSocialFormatConfig(formatKey) -> { label, w, h, cssAR }`.

- [ ] **Step 1: Add failing assertions**

Append these imports and assertions to `visual-suite/climate.test.js`:

```js
const {
  climateSocialBackgroundKey,
  climateSocialVisibleDays,
  climateSocialFormatConfig
} = require('./climate.js');

if (climateSocialBackgroundKey({ type: 'storm', isDay: true }) !== 'tormenta') throw new Error('La tormenta debe usar foto de tormenta');
if (climateSocialBackgroundKey({ type: 'rain', isDay: true }) !== 'lluvia') throw new Error('La lluvia debe usar foto de lluvia');
if (climateSocialBackgroundKey({ type: 'sun-cloud', isDay: true }) !== 'despejado') throw new Error('El estado con sol debe usar foto despejada');
if (climateSocialBackgroundKey({ type: 'cloud', isDay: false }) !== 'noche') throw new Error('La noche debe tener prioridad sobre el estado');
if (climateSocialVisibleDays([1, 2, 3, 4]).length !== 3) throw new Error('La placa social debe mostrar tres días');
if (climateSocialFormatConfig('landscape').w !== 2400 || climateSocialFormatConfig('landscape').h !== 1260) throw new Error('Facebook debe usar proporción 1.91:1');
if (climateSocialFormatConfig('story').h !== 1920) throw new Error('Historia debe conservar 1080x1920');
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node visual-suite/climate.test.js`

Expected: FAIL because the three social helper functions are not exported yet.

- [ ] **Step 3: Implement the pure helpers**

Add the following functions near `climateVisibleDays` in `visual-suite/climate.js`:

```js
function climateSocialBackgroundKey(actual = {}) {
  if (actual.isDay === false) return 'noche';
  if (actual.type === 'storm') return 'tormenta';
  if (['rain', 'rain-light', 'rain-heavy'].includes(actual.type)) return 'lluvia';
  if (actual.type === 'sun' || actual.type === 'sun-cloud') return 'despejado';
  if (actual.type === 'snow') return 'nublado';
  return 'nublado';
}

function climateSocialVisibleDays(days) {
  return (days || []).slice(0, 3);
}

function climateSocialFormatConfig(formatKey = 'square') {
  const format = VS_Formats[formatKey] || VS_Formats.square;
  if (formatKey === 'landscape') return { ...format, label: 'Facebook apaisado 1.91:1', w: 2400, h: 1260, cssAR: '1.91 / 1' };
  return format;
}
```

Export them in the existing CommonJS export object:

```js
module.exports = { normalizarClimateSMN, climateTypeFromSmnCode, climateIconCodeForTime, climateForecastLayout, climateLongDate, climateHeaderMeta, climateDayCardMetrics, climateTodayCardMetrics, climateHeroLayout, climateCardPeriods, climateVisibleDays, climateSocialBackgroundKey, climateSocialVisibleDays, climateSocialFormatConfig };
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node visual-suite/climate.test.js`

Expected: `climate.test.js: OK`.

- [ ] **Step 5: Commit the tested rule layer**

```bash
git add docs/superpowers/plans/2026-08-03-climate-social.md visual-suite/climate.test.js visual-suite/climate.js
git commit -m "test: define social climate layout rules"
git push origin main
```

### Task 2: Add the selectable Social style and browser bridge

**Files:**
- Modify: `visual-suite/index.html`
- Modify: `visual-suite/climate.js`

**Interfaces:**
- Browser globals: `cambiarEstiloClimate()`, `renderClimateSocial()`, `exportClimateSocial()`.
- Climate state keeps `climateStyle = 'informativa'` by default.

- [ ] **Step 1: Add the UI selector and social format labels**

Inside `#panel-climate`, add a select with `id="climateStyle"` before the existing format select:

```html
<div>
  <div class="vs-label">Diseño de placa</div>
  <select class="vs-select" id="climateStyle" onchange="cambiarEstiloClimate()">
    <option value="informativa">Informativa · WhatsApp / nota</option>
    <option value="social">Social · redes</option>
  </select>
</div>
```

Set the existing Climate format labels to `Cuadrado 1:1`, `Facebook apaisado 1,91:1`, `Instagram 4:5`, and `Historia IG 9:16`, preserving their values.

- [ ] **Step 2: Add style state and dispatch guards**

Near the existing Climate state in `visual-suite/climate.js`, add:

```js
let climateStyle = 'informativa';
```

Replace `climateFormatConfig()` with:

```js
function climateFormatConfig() {
  if (climateStyle === 'social' && typeof climateSocialFormatConfig === 'function') return climateSocialFormatConfig(climateFormat);
  return VS_Formats[climateFormat] || VS_Formats.square;
}
```

Add:

```js
function cambiarEstiloClimate() {
  climateStyle = document.getElementById('climateStyle')?.value || climateStyle;
  renderClimate();
}
```

At the start of `renderClimate()` and `exportarClimate()`, dispatch when social mode is selected:

```js
if (climateStyle === 'social' && typeof window !== 'undefined' && typeof window.renderClimateSocial === 'function') return window.renderClimateSocial();
```

Use the analogous `window.exportClimateSocial()` guard in `exportarClimate()`.

Expose the bridge state and legacy helpers at the bottom:

```js
window.cambiarEstiloClimate = cambiarEstiloClimate;
window.getClimateData = () => climateData;
window.getClimateFormat = () => climateFormat;
window.getClimateStyle = () => climateStyle;
window.preloadClimateIcons = preloadClimateIcons;
window.climateDrawIcon = climateDrawIcon;
```

In `initClimate()`, synchronize `#climateStyle` with the default before rendering.

- [ ] **Step 3: Run the focused test and all Climate tests**

Run: `node visual-suite/climate.test.js`

Expected: `climate.test.js: OK`.

- [ ] **Step 4: Commit the selector and bridge**

```bash
git add visual-suite/index.html visual-suite/climate.js
git commit -m "feat: add selectable climate social style"
git push origin main
```

### Task 3: Implement the photo-led Social renderer

**Files:**
- Create: `visual-suite/climate-social.js`

**Interfaces:**
- `window.renderClimateSocial()` draws the selected social format into `#climateCanvas`.
- `window.exportClimateSocial()` renders the same canvas and calls `mostrarExportPreview`.

- [ ] **Step 1: Create the renderer with local photo loading and fallback**

Implement `visual-suite/climate-social.js` with these concrete rules:

```js
const CLIMATE_SOCIAL_PHOTO_BASE = '../assets/clima/social/';
const climateSocialPhotoCache = new Map();

function climateSocialPhoto(key) {
  if (climateSocialPhotoCache.has(key)) return Promise.resolve(climateSocialPhotoCache.get(key));
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => { climateSocialPhotoCache.set(key, image); resolve(image); };
    image.onerror = () => { climateSocialPhotoCache.set(key, null); resolve(null); };
    image.src = `${CLIMATE_SOCIAL_PHOTO_BASE}${key}.jpg`;
  });
}
```

The renderer must:

1. Read `window.getClimateData()`, `window.getClimateFormat()`, and the pure helpers from `window`/module-independent globals.
2. Set the canvas to `climateSocialFormatConfig(formatKey).w/h` and set CSS height from the preview width and the exact ratio.
3. Draw the selected photo full bleed using `cover`, then a dark translucent overlay and a thin accent frame; if the photo is unavailable, use the existing atmospheric gradient helper through `window.climateDrawAtmosphere` only as fallback.
4. Call `VS_CanvasHelpers.drawPlateHeader` and `VS_CanvasHelpers.drawPlateLogo` exactly once, preserving the current logo resource and identity.
5. Draw a large “AHORA” panel with SMN icon code selected through `climateIconCodeForTime(actual.code, actual.isDay)`, temperature, description, humidity, wind, and sun times. Missing values render `--`.
6. Draw `climateSocialVisibleDays(data.days)` as three forecast cards. The first is “Hoy”; the next cards use full Spanish date labels. Each card contains only the most useful period values and rain probability, with a large icon and no duplicated min/max block.
7. Reserve footer space before placing cards and use `VS_CanvasHelpers.drawFooter` exactly once.
8. Use a 3-column forecast row for square/portrait/landscape and a single-column stack for Story. For landscape, place the large current panel on the left and the three forecast cards on the right so the wide format is intentionally composed rather than proportionally squashed.

The renderer must use `ctx.save()/restore()`, clip long text to its own card, and never write outside each card’s bounds.

- [ ] **Step 2: Include the renderer after `climate.js`**

Add this script immediately after `climate.js` in `visual-suite/index.html`:

```html
<script src="climate-social.js"></script>
```

- [ ] **Step 3: Run syntax and regression tests**

Run: `node --check visual-suite/climate-social.js; node visual-suite/climate.test.js`

Expected: both commands succeed and Climate tests print `climate.test.js: OK`.

- [ ] **Step 4: Commit the renderer**

```bash
git add visual-suite/climate-social.js visual-suite/index.html
git commit -m "feat: add photo-led social climate renderer"
git push origin main
```

### Task 4: Verify preview and export in all formats

**Files:**
- Modify: `visual-suite/climate-social.js` only if a verification finds a concrete layout issue.

- [ ] **Step 1: Run every JavaScript regression test**

Run: `Get-ChildItem visual-suite -Filter '*.test.js' | ForEach-Object { node $_.FullName }`

Expected: every test exits with code 0.

- [ ] **Step 2: Inspect the browser preview**

Open the local Visual Suite page, select Clima, choose `Social · redes`, and inspect each format in the preview: square, Facebook apaisado, Instagram 4:5, and Historia IG. Confirm that the same photo-led composition is visible before export, the logo is unchanged, and no metric or forecast card crosses the canvas edge.

- [ ] **Step 3: Inspect a PNG export**

Export the square and Story variants and compare them with their previews. Confirm the PNG uses the same selected photo, dimensions, header, logo, footer, current weather, and three visible days.

- [ ] **Step 4: Commit verification-only fixes, if any**

```bash
git add visual-suite/climate-social.js
git commit -m "fix: polish social climate layout verification"
git push origin main
```

