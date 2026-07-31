# Infografías Modulares Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Visual Suite Infografías into a validated modular renderer while preserving the current text and legacy JSON workflows.

**Architecture:** Keep `infographics.js` as the module entry point, but separate input normalization, validation, layout calculation, and canvas rendering into focused pure helpers inside the same existing module to minimize integration risk. Preview and PNG export will call the same normalized render path.

**Tech Stack:** Vanilla JavaScript, HTML Canvas, existing Visual Suite shared helpers, Node-based assertion tests.

## Global Constraints

- Preserve text input and legacy `lineas` JSON compatibility.
- Use the existing Media Mendoza palette, Inter, DM Serif Display, and shared canvas helpers.
- Keep PNG export and preview on the same render path.
- Prevent text and blocks from overflowing any supported format.
- Do not add runtime dependencies.

---

### Task 1: Add normalization and validation layer

**Files:**
- Modify: `visual-suite/infographics.js`
- Create: `visual-suite/infographics.test.js`

**Interfaces:**
- Produces `normalizarInfografia(input)` returning `{ titulo, bajada, fecha, fuente, template, color1, color2, bloques, warnings }`.
- Produces `validarBloque(bloque)` returning `{ ok, bloque, warning }`.
- Produces `normalizarLinea(linea)` returning a `dato` block for `Etiqueta: valor` and a `texto` block otherwise.

- [ ] **Step 1: Write failing tests** for text input, legacy `lineas`, modular `bloques`, invalid colors, and invalid block types.
- [ ] **Step 2: Run `node visual-suite/infographics.test.js` and confirm failure because the helpers do not exist.**
- [ ] **Step 3: Implement pure normalization helpers without canvas or DOM access.**
- [ ] **Step 4: Run the test and confirm all normalization assertions pass.**
- [ ] **Step 5: Commit with `git commit -m "feat: add modular infographic normalization"`.**

### Task 2: Add modular layout calculations and safe text utilities

**Files:**
- Modify: `visual-suite/infographics.js`
- Modify: `visual-suite/infographics.test.js`

**Interfaces:**
- Produces `calcularInfografiaLayout(W, H, data)` returning bounded rectangles for header, blocks, source, and footer.
- Produces `infografiaBloqueRect(tipo, index, total, W, H, template)` returning `{ x, y, w, h }`.
- Produces `ajustarTextoCanvas(ctx, text, maxWidth, maxLines, fontSize)` returning `{ lines, fontSize, height }`.

- [ ] **Step 1: Add failing tests for square, portrait, and story layouts, including six blocks and long text.**
- [ ] **Step 2: Run `node visual-suite/infographics.test.js` and verify the new layout assertions fail.**
- [ ] **Step 3: Implement bounded grid calculations with reserved source/footer space and a minimum font size.**
- [ ] **Step 4: Run tests and verify no rectangle exceeds canvas bounds.**
- [ ] **Step 5: Commit with `git commit -m "feat: add safe infographic layouts"`.**

### Task 3: Render modular blocks with richer visual language

**Files:**
- Modify: `visual-suite/infographics.js`
- Modify: `visual-suite/index.html`

**Interfaces:**
- Adds `renderInfografiaModular(ctx, W, H, data)` as the shared modular render entry point.
- Adds `drawInfografiaBlock(ctx, rect, bloque, data, dark)` dispatching `dato`, `barra`, `comparacion`, `ranking`, `pasos`, and `texto`.
- Adds `drawInfografiaSource(ctx, W, H, fuente, dark)` for the source line.

- [ ] **Step 1: Add a modular sample JSON to the Infografías panel for manual testing.**
- [ ] **Step 2: Implement card depth, accent rules, icon/emoji chips, progress bars, comparison columns, ranking numbers, and step connectors using Canvas primitives.**
- [ ] **Step 3: Make the current template selector choose between modular compositions while retaining the four legacy names as aliases.**
- [ ] **Step 4: Render the title, bajada, date, source, logo, and footer through the shared layout.**
- [ ] **Step 5: Verify the sample visually in square, portrait, and story formats.**
- [ ] **Step 6: Commit with `git commit -m "feat: render modular infographic blocks"`.**

### Task 4: Integrate loading, prompt, preview, and export

**Files:**
- Modify: `visual-suite/infographics.js`
- Modify: `visual-suite/index.html`
- Modify: `docs/visual-suite.md`

**Interfaces:**
- `cargarJSONdeChatInfografia()` accepts both `lineas` and `bloques`.
- `renderizarInfografia()` and `renderizarInfografiaEnCtx()` both call the same normalizer and renderer.
- The IA prompt documents the modular JSON schema and requests explicit icon, block type, and source fields.

- [ ] **Step 1: Add failing integration assertions for legacy JSON and modular JSON loading.**
- [ ] **Step 2: Update JSON loading to preserve the previous canvas content when parsing fails and show warnings for omitted blocks.**
- [ ] **Step 3: Update the IA prompt with the modular schema and source rules.**
- [ ] **Step 4: Connect preview and export to the same render function.**
- [ ] **Step 5: Update documentation with the new schema and supported block types.**
- [ ] **Step 6: Run `node visual-suite/infographics.test.js`, `node --check visual-suite/infographics.js`, and `git diff --check`.**
- [ ] **Step 7: Commit with `git commit -m "feat: integrate modular infographic workflow"`.**

## Final verification

- Load the old line-based example and verify it renders unchanged in principle.
- Load legacy JSON with `lineas` and verify title, colors, and template are applied.
- Load modular JSON with at least `dato`, `barra`, and `ranking` blocks.
- Check square and story previews for overflow.
- Export PNG and confirm it uses the same data and layout as the preview.
- Push the final commits to `origin main`.
