# Reel Visual Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Reel scenes a more professional editorial composition and add restrained transitions suitable for Instagram and Facebook.

**Architecture:** Keep the existing ReelPlan and Canvas scene renderer. Add visual-family decisions inside `reel-canvas-renderer.js`, then make video export interpolate between rendered scene canvases instead of cutting directly from one scene to the next. Keep all motion optional and safe for existing plans.

**Tech Stack:** Vanilla JavaScript, Canvas 2D, MediaRecorder, ES modules, existing Media Mendoza theme utilities.

## Global Constraints

- Keep the vertical 1080x1920 format.
- Preserve the existing ReelPlan/editorial contract.
- Keep the Media Mendoza palette, logo, rounded cards and safe mobile margins.
- Use subtle fade and short vertical movement; no aggressive zooms, bouncing effects or fast parallax.
- Do not render editor-only labels, scene counters or internal layout names in the final video.
- Missing images must fall back to the correct text-card family.
- Do not modify files outside `/carousel` for the implementation.

---

### Task 1: Establish render-family helpers

**Files:**
- Modify: `carousel/reel-canvas-renderer.js`
- Test: Node module import and synthetic scene render

**Interfaces:**
- Consumes: `scene`, `project`, `resolveSceneImage`, `resolveSceneLayout`.
- Produces: stable scene-family helpers used by every render path.

- [ ] **Step 1: Add explicit scene-family resolution**

Add `resolveReelSceneFamily(scene, project)` returning one of `cover`, `image`, `list`, `contact`, `cta`, `quote`, or `text`. It must classify missing-image scenes as text families before rendering.

- [ ] **Step 2: Route the renderer through the family**

Update `drawBackground`, `drawSceneText`, `drawSceneChrome`, and `drawSceneFooter` to use the same resolved family so a scene cannot receive conflicting layouts.

- [ ] **Step 3: Verify imports and fallback behavior**

Run:

```powershell
@'
import './carousel/reel-canvas-renderer.js';
console.log('renderer import ok');
'@ | node -
```

Expected: exit code `0` and `renderer import ok`.

### Task 2: Refine editorial scene composition

**Files:**
- Modify: `carousel/reel-canvas-renderer.js`
- Test: synthetic cover, text, list, contact and CTA render calls

**Interfaces:**
- Consumes: family returned by Task 1 and existing normalized scene fields `text`, `subtitle`, `items`, `layout`.
- Produces: visually distinct scene canvases with safe text fitting.

- [ ] **Step 1: Make information cards occupy the useful vertical area**

Use the existing `fitReelTextBlock` result to center title/subtitle blocks within the content card, keeping at least 120px from the card edges and preventing long titles from pushing the subtitle outside the card.

- [ ] **Step 2: Keep list/contact layouts structured**

Render list and contact items as compact rounded rows with a green index/label block. Limit rows to the available card height and reduce row typography before allowing overflow.

- [ ] **Step 3: Implement the CTA family as a branded closing card**

Render CTA scenes with:

```text
outer background: light Media Mendoza green
inner card: white with rounded border and green top bar
brand: centered logo near the top
kicker: SEGUIR INFORMADO
body: centered title and explanatory text
bottom band: mediamendoza.com
```

Skip the standard scene footer for CTA scenes to avoid duplicate logos.

- [ ] **Step 4: Verify long and short content**

Run the synthetic render script for a short title, a four-line title, a two-item list, a contact scene and a CTA scene. Expected: no exception and every render returns a canvas with width `1080` and height `1920`.

### Task 3: Add restrained scene transitions to video export

**Files:**
- Modify: `carousel/ui.js`
- Test: browser-side export helper with a mocked `MediaRecorder` or module-level syntax/import check

**Interfaces:**
- Consumes: `renderReelSceneToCanvas(scene, project)`, scene durations, current `MediaRecorder` export path.
- Produces: exported video frames with short crossfades and directional movement.

- [ ] **Step 1: Add transition constants and easing**

Define local constants in the export path:

```javascript
var TRANSITION_MS = 420;
var TRANSITION_FPS = 30;
function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}
```

- [ ] **Step 2: Add a frame compositor**

Create `drawReelTransitionFrame(ctx, currentCanvas, nextCanvas, progress, direction)` that:

1. draws the current scene with opacity `1 - progress`;
2. draws the next scene translated vertically by `direction * (1 - easeOutCubic(progress)) * 28` pixels;
3. draws the next scene with opacity `progress`;
4. uses no transition for the first frame and a calmer transition before the CTA.

- [ ] **Step 3: Replace hard scene cuts**

In `downloadReelVideo`, preload rendered scene canvases once, hold each scene for its readable duration, and insert transition frames between scenes. Keep the current MIME fallback and download behavior unchanged.

- [ ] **Step 4: Verify export timing**

Confirm the exporter still includes every scene in order, adds no editor labels, and produces a playable MediaRecorder stream when supported by the browser.

### Task 4: Mobile and platform-safe review

**Files:**
- Modify: `carousel/style.css` only if preview controls need adjustment
- Test: browser preview at narrow viewport and normal desktop viewport

**Interfaces:**
- Consumes: existing Reel preview canvas and export controls.
- Produces: readable mobile preview without changing the rendered 1080x1920 output.

- [ ] **Step 1: Check preview scaling**

Verify the canvas remains fully visible within the preview container and that buttons do not cover the active scene on narrow screens.

- [ ] **Step 2: Check safe areas**

Verify title, subtitle, logo and CTA band remain inside the 28px outer frame and have sufficient clearance for Instagram/Facebook overlays.

- [ ] **Step 3: Run final checks**

Run:

```powershell
@'
import './carousel/reel-canvas-renderer.js';
import './carousel/ui.js';
console.log('reel modules ok');
'@ | node -
git diff --check
```

Expected: both commands exit `0`.
