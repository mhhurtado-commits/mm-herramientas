# Gráficos como placa principal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el gráfico en el contenido principal de la placa, reservando header y footer para evitar superposiciones y deformaciones.

**Architecture:** `charts.js` calculará un `chartSafeArea` dentro del canvas final. Chart.js se renderizará en un canvas fuente con las proporciones del área segura y el canvas final compondrá fondo, header, gráfico y footer en ese orden. La preview y la exportación seguirán utilizando el mismo `chartPlateCanvas`.

**Tech Stack:** JavaScript vanilla, Canvas 2D, Chart.js, pruebas Node.js existentes de Visual Suite.

## Global Constraints

- El gráfico debe ocupar íntegramente el cuerpo entre header y footer.
- Header y footer son zonas protegidas y no pueden superponerse con el gráfico.
- La preview debe conservar el aspect ratio seleccionado.
- No agregar dependencias ni alterar otros módulos.
- Mantener la exportación desde `chartPlateCanvas`.

---

### Task 1: Definir contratos geométricos y pruebas de regresión

**Files:**
- Modify: `visual-suite/charts.test.js`
- Modify: `visual-suite/charts.js`

**Interfaces:**
- Produce `calcularGraficoLayout(W, H, formato)` con `chartSafeArea` explícita.
- Produce límites verificables para header, cuerpo y footer.

- [ ] Escribir pruebas que fallen si el área segura invade header/footer o si el gráfico sale del canvas.
- [ ] Ejecutar `node visual-suite\\charts.test.js` y confirmar el fallo inicial.
- [ ] Implementar `chartSafeArea` manteniendo compatibilidad con `layout.chart`.
- [ ] Ejecutar la prueba y confirmar que pasa para square, landscape, portrait y story.

### Task 2: Renderizar el gráfico como contenido principal

**Files:**
- Modify: `visual-suite/charts.js`

**Interfaces:**
- `renderizarPlacaGrafico()` compone exclusivamente fondo, header, gráfico y footer.

- [ ] Agregar una prueba que compruebe que el renderer no utiliza tarjeta intermedia ni etiqueta auxiliar.
- [ ] Ejecutar la prueba y confirmar el fallo inicial.
- [ ] Eliminar la tarjeta blanca y el texto “Visualización de datos”.
- [ ] Dibujar el gráfico directamente dentro de `chartSafeArea` con padding propio.
- [ ] Dibujar el footer después del gráfico, siempre dentro de su franja.
- [ ] Ejecutar las pruebas y confirmar que la composición queda dentro de los límites.

### Task 3: Ajustar Chart.js al área disponible

**Files:**
- Modify: `visual-suite/charts.js`

**Interfaces:**
- El canvas fuente de Chart.js debe tener proporción equivalente a `chartSafeArea`.

- [ ] Agregar una prueba para la proporción del canvas fuente en los cuatro formatos.
- [ ] Ejecutar la prueba y confirmar el fallo inicial.
- [ ] Configurar dimensiones fuente y `maintainAspectRatio` sin estirar el gráfico.
- [ ] Ajustar padding, leyenda y etiquetas para evitar colisiones en el área reducida.
- [ ] Ejecutar pruebas de gráficos y confirmar legibilidad geométrica.

### Task 4: Verificación integral y publicación

**Files:**
- Modify: ninguno adicional salvo correcciones necesarias.

- [ ] Ejecutar `charts`, `timeline`, `infographics`, `climate` y `football` tests.
- [ ] Ejecutar `node --check` sobre `charts.js` y `app.js`.
- [ ] Ejecutar `git diff --check`.
- [ ] Revisar `git status` y committear los cambios.
- [ ] Hacer push a `main`.
