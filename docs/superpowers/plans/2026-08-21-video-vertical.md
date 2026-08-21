# Video vertical editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la primera entrega funcional de `/video-vertical/`: importación local, contrato editorial, encuadre 9:16 sin deformación, zócalo editable, audio configurable, candidatos básicos y exportación MP4 local.

**Architecture:** Módulos ES puros modelan el proyecto, adaptan el paquete editorial, calculan composición y construyen el comando FFmpeg. Una UI separada los enlaza con video/canvas/FFmpeg en navegador. No se modifican `/placas-v2`, `/reels` ni `/video-editor`.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Canvas 2D, FFmpeg WASM, `node:test`, `sessionStorage`.

## Global Constraints

- Crear únicamente `/video-vertical/` y un enlace desde la portada.
- La marca visible usa exactamente `mediamendoza`.
- El video horizontal completo usa `contain`; el recorte vertical es opt-in y manual.
- El paquete de `/placas-v2` se lee de `mm-editorial-handoff` sin cambiarlo ni crear un contrato paralelo.
- El archivo fuente nunca se modifica; la salida es un MP4 nuevo.
- YouTube no se descarga: la entrada es MP4/MOV local autorizado.
- Cada módulo nuevo se implementa con una prueba que haya fallado antes.

---

### Task 1: Modelo, contrato y candidatos seguros

**Files:**
- Create: `video-vertical/video-project.mjs`
- Create: `video-vertical/video-package-adapter.mjs`
- Create: `video-vertical/video-suggestions.mjs`
- Test: `video-vertical/video-project.test.mjs`
- Test: `video-vertical/video-package-adapter.test.mjs`
- Test: `video-vertical/video-suggestions.test.mjs`

**Interfaces:**
- `createVideoProject(package, options)` devuelve `{ format: '9:16', profile, audioMode, lowerThird, framing, clips }`.
- `adaptVideoPackage(package)` devuelve datos editables para el zócalo.
- `suggestClipWindows({ duration, profile, transcript })` devuelve candidatos acotados de 20 a 45 s.

- [ ] Escribir tests que prueben: título/fuente de contrato, fallback manual, perfil válido, audio válido, clip dentro de duración y ausencia de solapamiento.
- [ ] Ejecutar `node --test --test-isolation=none video-vertical/video-project.test.mjs video-vertical/video-package-adapter.test.mjs video-vertical/video-suggestions.test.mjs`; verificar fallo por módulos inexistentes.
- [ ] Implementar normalizadores sin estado externo. El adapter usa `editorial.titulo`, `bajada`, `seccion`, `datos_clave`, `category_options`, `fuente` y la taxonomía compartida; las sugerencias habladas usan límites de segmentos y b-roll distribuye ventanas sin inventar textos.
- [ ] Repetir el comando y verificar pase.
- [ ] Commit: `feat(video): add editorial project model`.

### Task 2: Encadre y renderer de preview

**Files:**
- Create: `video-vertical/video-framing.mjs`
- Create: `video-vertical/video-renderer.mjs`
- Test: `video-vertical/video-framing.test.mjs`
- Test: `video-vertical/video-renderer.test.mjs`

**Interfaces:**
- `getVideoFramePlan({ sourceWidth, sourceHeight, width, height, mode, focus })` devuelve fondo, primer plano, foco acotado y áreas seguras.
- `drawVideoPreview(ctx, video, project, options)` pinta fondo, video, hook, zócalo y subtítulos activos.

- [ ] Escribir tests que demuestren que 1920x1080 conserva un primer plano de 1080x608 aprox. en 1080x1920, que el fondo cubre todo y que las áreas de zócalo/subtítulos no se cruzan.
- [ ] Ejecutar las dos pruebas y verificar fallo por módulos inexistentes.
- [ ] Implementar `contain` por defecto, `cover` manual con foco acotado, fondo ampliado y zonas seguras; el renderer usa Canvas 2D y texto con ajuste a caja.
- [ ] Repetir las pruebas y verificar pase.
- [ ] Commit: `feat(video): render vertical editorial preview`.

### Task 3: Plan de exportación local

**Files:**
- Create: `video-vertical/video-export.mjs`
- Test: `video-vertical/video-export.test.mjs`

**Interfaces:**
- `buildExportCommand({ inputName, overlayName, musicName, audioMode, source, outputName })` devuelve argumentos FFmpeg para MP4 vertical.
- `exportEditorialVideo(deps)` delega al runtime FFmpeg inyectado, escribe fuente/overlay/música, informa progreso y devuelve un `Blob` MP4.

- [ ] Escribir tests para los modos `original`, `musica` y `mezcla`; exigir `scale`, `crop`, `boxblur`, overlay transparente, MP4, 1080x1920 y el mapeo de audio correcto.
- [ ] Ejecutar `node --test --test-isolation=none video-vertical/video-export.test.mjs`; verificar fallo por módulo inexistente.
- [ ] Implementar el grafo FFmpeg con dos ramas de video: fondo cover/desenfocado y plano contain centrado; superponer PNG de Canvas y mapear audio según modo. Rechazar un modo de audio inválido antes de ejecutar.
- [ ] Repetir la prueba y verificar pase.
- [ ] Commit: `feat(video): add local vertical export plan`.

### Task 4: UI independiente y handoff

**Files:**
- Create: `video-vertical/index.html`
- Create: `video-vertical/style.css`
- Create: `video-vertical/app.mjs`
- Modify: `index.html`

**Interfaces:**
- `app.mjs` crea el proyecto desde handoff o campos manuales, maneja video/audio local, previsualiza Canvas y llama al exportador.
- La portada expone `/video-vertical/` como `Video vertical`.

- [ ] Escribir antes pruebas de módulos para los cambios de comportamiento de UI que no dependen de DOM: parseo de handoff, validación de archivo, estado de audio y serialización de exportación.
- [ ] Ejecutar las pruebas y verificar fallo de las nuevas funciones.
- [ ] Crear una UI con preview, carga de fuente, campos del zócalo, perfil, audio, foco, clips candidatos, subtítulos manuales y descarga MP4. Cargar FFmpeg de forma diferida, sin reutilizar `video-editor/editor.js`.
- [ ] Agregar sólo una fila nueva en la portada para acceder a la herramienta.
- [ ] Repetir pruebas y `node --check video-vertical/app.mjs`; verificar pase.
- [ ] Commit: `feat(video): add vertical editorial workspace`.

### Task 5: Verificación integrada

**Files:**
- Test: `video-vertical/*.test.mjs`
- Modify: `docs/superpowers/specs/2026-08-21-video-vertical-design.md` sólo si una decisión implementada difiere del diseño aprobado.

- [ ] Ejecutar `node --test --test-isolation=none video-vertical/*.test.mjs shared/editorial-package.test.mjs` y `node --check` en todos los módulos de `/video-vertical/`.
- [ ] Ejecutar `git diff --check` y revisar que no existan modificaciones en `/placas-v2`, `/reels` o `/video-editor`.
- [ ] Abrir la página localmente sólo si hay un servidor disponible y comprobar carga, preview y estados de error; no afirmar una exportación real sin FFmpeg disponible en el navegador.
- [ ] Commit final de correcciones exclusivamente dentro de `/video-vertical/` y enlace de portada.

## Review

Cobertura: las tareas 1 a 4 cubren la primera entrega incremental aprobada; los análisis automáticos avanzados quedan explícitamente limitados a candidatos locales determinísticos y a transcripción cuando esté disponible. No hay cambios de contrato, servidor ni herramientas existentes. Las interfaces creadas en cada tarea son las consumidas por la siguiente.
