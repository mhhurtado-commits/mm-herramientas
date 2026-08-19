# Qué cambia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manually selectable `que-cambia` plate with verified editorial impacts.

**Architecture:** Worker and normalizer exchange an optional `impactos` list. The selector always exposes `que-cambia`; its Canvas composition renders the verified entries or a `contexto` fallback.

**Tech Stack:** Browser ES modules, Canvas 2D, Cloudflare Worker, Node test runner.

## Global Constraints

- Do not change `/placas`, `/carousel`, or `/reels`.
- Never invent impacts; retain only source-backed or editor-supplied copy.
- Keep logo, source, and domain inside all formats.
- `que-cambia` is manual-only; the contractual type remains the default.
- Remove `pulso` and map legacy `pulso` input to `foto-completa`.

---

### Task 1: Contract and selector

**Files:**
- Modify: `placas-v2/editorial-core.mjs`
- Modify: `worker/placas-v2.mjs`
- Modify: `worker/worker.js`
- Modify: `placas-v2/app.mjs`
- Test: `placas-v2/editorial-core.test.mjs`

**Interfaces:** Consumes `impactos?: Array<{ label?: string, value?: string, detail?: string }>` and produces normalized `plate.impactos` plus manual type `que-cambia`.

- [ ] **Step 1: Write a failing test**

```js
const plate = normalizeNewsPlate({ ...extracted, impactos: [
  { label: 'Desde cuándo', value: 'Desde septiembre' },
  { label: 'A quién alcanza', value: 'A 12.000 vecinos' },
  { label: 'Extra', value: 'No debe entrar' },
  { label: 'Extra 2', value: 'Tampoco' },
] });
assert.deepEqual(plate.impactos.map(item => item.value), ['Desde septiembre', 'A 12.000 vecinos', 'No debe entrar']);
assert.equal(PLATE_TYPES['que-cambia'].id, 'que-cambia');
```

- [ ] **Step 2: Verify RED**

Run: `node --test --test-isolation=none placas-v2/editorial-core.test.mjs`

Expected: `impactos` and `que-cambia` are missing.

- [ ] **Step 3: Implement minimal normalization and UI**

```js
function normalizeImpacts(value) {
  return (Array.isArray(value) ? value : []).map(item => ({
    label: clean(item?.label), value: clean(item?.value), detail: clean(item?.detail),
  })).filter(item => item.value).slice(0, 3);
}
```

Add `impactos` to the normalized plate, add the type to both Worker prompt enums, require verified consequences in the prompt, and expose three editable impact inputs when selected.

- [ ] **Step 4: Verify GREEN**

Run: `node --test --test-isolation=none placas-v2/editorial-core.test.mjs worker/placas-v2.test.mjs`

Expected: PASS.

### Task 2: Layout and renderer

**Files:**
- Modify: `placas-v2/editorial-core.mjs`
- Modify: `placas-v2/renderer.mjs`
- Test: `placas-v2/editorial-core.test.mjs`

**Interfaces:** Consumes `plate.tipo_placa === 'que-cambia'`, `plate.impactos`, and `plate.contexto`; produces `layout.impacts` and Canvas output labeled `QUÉ CAMBIA`.

- [ ] **Step 1: Write failing layout and render tests**

```js
const layout = calculatePlateLayout('portrait', { tipo_placa: 'que-cambia' });
assert.ok(layout.impacts.y + layout.impacts.h <= layout.footer.y);
assert.ok(calls.includes('QUÉ CAMBIA'));
assert.ok(calls.includes('Fuente: mediamendoza'));
assert.ok(calls.includes('www.mediamendoza.com'));
```

- [ ] **Step 2: Verify RED**

Run: `node --test --test-isolation=none placas-v2/editorial-core.test.mjs`

Expected: no impact layout or renderer exists.

- [ ] **Step 3: Implement the composition**

Return a `queCambia` layout with title, `impacts`, and footer areas. Render section-colored impact modules, using one context module only when no impacts are available. Reuse `drawInstitutionalFooter` and dispatch from `renderNewsPlate`.

- [ ] **Step 4: Verify GREEN**

Run: `node --test --test-isolation=none placas-v2/editorial-core.test.mjs worker/placas-v2.test.mjs shared/editorial-package.test.mjs; node --check placas-v2/editorial-core.mjs; node --check placas-v2/renderer.mjs; node --check placas-v2/app.mjs; git diff --check`

Expected: all focal checks pass.
