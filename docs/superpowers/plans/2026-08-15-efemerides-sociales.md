# Efemérides sociales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a curated, source-backed efemérides dataset and a first social summary output inside `/placas-v2`, without changing `/visual-suite` or the existing news flow.

**Architecture:** Keep efemérides as a separate data contract and deterministic local seed. The first output is a compact 4:5 social card with up to three approved events; no AI lookup or automatic web sourcing is introduced. Existing article plates continue through the current URL flow.

**Tech Stack:** Browser ES modules, Canvas renderer, Node built-in tests, JSON data.

## Global Constraints

- Do not modify `/placas` or `/visual-suite`.
- Do not publish an event unless it has a source URL and `verificada: true`.
- Preserve existing news plate contracts and downloads.
- Keep the first iteration local and deterministic; no new dependency or external API.

---

### Task 1: Define and validate the efemérides contract

**Files:**
- Create: `placas-v2/efemerides-data.mjs`
- Create: `placas-v2/efemerides-data.test.mjs`

- [ ] Add `normalizeEfemeride(item)` and `getEfemeridesForDate(date, items)` with required `fecha`, `titulo`, `fuente`, `url_fuente`, and `verificada` fields.
- [ ] Seed three verified records for `2026-08-15`, using source URLs and concise summaries.
- [ ] Return only verified records matching the requested month-day, ordered by `prioridad`.
- [ ] Test normalization, filtering, ordering, and rejection of records without a source or verification.

### Task 2: Add the social efemérides layout and renderer

**Files:**
- Modify: `placas-v2/editorial-core.mjs`
- Modify: `placas-v2/renderer.mjs`
- Modify: `placas-v2/editorial-core.test.mjs`

- [ ] Add `efemerides-social` to the explicit plate types and layout contract.
- [ ] Create a 4:5 layout with a large date/title area and three compact event cards; omit long summaries from the social card.
- [ ] Render event year and short title with category color, logo, footer, and no article context/bajada.
- [ ] Test safe bounds, maximum three events, and readable card hierarchy.

### Task 3: Add a minimal efemérides mode to `/placas-v2`

**Files:**
- Modify: `placas-v2/index.html`
- Modify: `placas-v2/app.mjs`
- Modify: `placas-v2/style.css`

- [ ] Add a mode switch between `Nota` and `Efemérides` without changing the existing URL form behavior.
- [ ] In efemérides mode, show date input, verified event list, and editable title/summary fields for up to three events.
- [ ] Render the selected events in `efemérides-social` and keep the existing PNG-only download.
- [ ] Test the module syntax and manually validate the seeded `2026-08-15` output.

### Task 4: Regression and delivery

- [ ] Run the complete existing test suite plus efemérides tests.
- [ ] Run `node --check` on changed modules and `git diff --check`.
- [ ] Commit only the efemérides files and push `main`.
