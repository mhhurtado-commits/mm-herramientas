# Efemérides automática — Diseño (spec)

**Fecha:** 2026-11-13
**Estado:** borrador para revisión del usuario
**Alcance:** app nueva `efemerides/` (ruta pública `/efemerides/`). Nada de lo desplegado se toca: `visual-suite/`, `placas-v2/`, `worker/worker.js` y el `index.html` raíz quedan byte-a-byte igual.

## 1. Problema y objetivo

Hoy generar la placa de efemérides exige: elegir fecha → generar prompt con IA → copiarlo y salir de la app → pegarlo en un agente externo → copiar el JSON → volver → pegarlo → cargarlo → recién ahí se genera la placa. Ese viaje desaparece por completo.

**Objetivo:** al abrir `/efemerides/` la placa del día ya está dibujada con datos verificados; el único acto del usuario es exportar (1 clic, PNG). Sin editor, sin JSON, sin prompts, sin publicación automática.

## 2. Decisiones tomadas (brainstorming)

- Superficie: app nueva de primer nivel `efemerides/` (enfoque A). Reusa el endpoint verificado existente `/placas/v2/efemerides?fecha=`. Cero infra nueva, cero cambios al worker.
- Diseño de placa: **Portada editorial v4** (dirección A aprobada en el companion). Nada se conserva del diseño actual de `visual-suite`.
- Formato de export: **1:1, 1080×1080 PNG** únicamente en v1.
- Export: **solo botón "Descargar PNG"**. Sin botón de WhatsApp en v1 (el usuario decide qué hace con la imagen).
- No hay botón "regenerar": el endpoint cachea el día en KV; bypassar el cache exigiría tocar producción.
- El campo `alcance` no se imprime ni se usa para filtrar (viene ruidoso: hoy etiqueta "internacional" a hechos argentinos). La curaduría argentina-first ya viene en el orden del endpoint y se respeta.

## 3. Archivos nuevos (los únicos que se tocan)

| Archivo | Rol |
|---|---|
| `efemerides/index.html` | Página: chrome (logo, título), canvas, controles, estados. Sin lógica. |
| `efemerides/efemerides.mjs` | App: fetch al worker, máquina de estados, dibujo en canvas, export PNG. |
| `efemerides/placa-model.mjs` | Lógica pura: fecha, normalización del payload, vista héroe+filas, etiquetas. Testeable en node. |
| `efemerides/placa-model.test.mjs` | Tests del modelo (`node --test`). |

Patrón: app modular con `.mjs` al lado del HTML (como `placas-v2`, `carousel`, `reels`). Sin build, sin package, sin dependencias.

## 4. Flujo y estados

1. Abrir `/efemerides/` → fecha de hoy en `America/Argentina/Mendoza` (cliente, `Intl`).
2. `GET {WORKER_URL}/placas/v2/efemerides?fecha=YYYY-MM-DD` (URL hardcodeada como en el resto de las apps; timeout 45 s con `AbortController` — la generación en frío del worker puede tardar más de 15 s: Wikipedia 12 s + API 12 s + Gemini + búsqueda de imágenes). Si la respuesta es un error (red, timeout, 4xx/5xx, `ok:false` o <5 items), la app reintenta una vez automáticamente antes de mostrar el estado de error; los fallos del worker no se cachean en KV, así que el reintento puede resolverlo.
3. Modelo normalizado → dibujo en canvas 1080×1080 (logo + fuentes locales cargadas antes del primer dibujo).
4. Estados: `cargando` (indicador según el contrato de spinner de la suite, `shared/spinner-contract.test.mjs`) → `lista` (placa + botón Descargar PNG habilitado) | `error` (mensaje en criollo + botón Reintentar). Nunca pantalla en blanco.
5. Opcional: selector de fecha (`input[type=date]`) → re-fetch y re-render del mismo flujo.

## 5. Contrato de datos

Entrada: payload `{ok, items[], meta}` del endpoint. Campos usados por item: `año`, `titulo`, `resumen` (≤100), `texto_ampliado` (≤240), `categoria`/`icono`, `prioridad`, `fuente`, `url_fuente`, `verificada`. Campos ignorados deliberadamente: `alcance`, `imagen` (la placa es tipográfica; si la fuente trae foto no se usa), `imagen_descripcion`.

Normalización (`placa-model.mjs`):
- Valida `ok`, `items` array, y por item strings no vacíos de `año`, `titulo`, `resumen`. Descarta items inválidos sin inventar relleno.
- Si quedan < 5 items → estado error ("No alcanzaron hechos verificados para esa fecha").
- Conserva el orden del endpoint (curado argentino-first). Héroe = `items[0]`; filas = siguientes hasta 5 (máx 6 eventos en placa). Si el payload trae más, el pie dice "M DE N HECHOS DEL DÍA" (M mostrados, N totales) — nada se pierde silenciosamente.
- `etiquetaCategoria(icono|categoria)`: futbol→FÚTBOL, deportes→DEPORTES, aviacion→AVIACIÓN, musica→MÚSICA, teatro→TEATRO, politica→POLÍTICA, historia→HISTORIA, sociedad→SOCIEDAD, economia→ECONOMÍA, mundo→MUNDO, canal→CANAL; desconocido→`String(categoria).toUpperCase()`.

## 6. Diseño visual (aprobado en companion)

Canvas 1080×1080. Paleta: fondo `#0F1520`, dorado `#C8A24A`, crema `#F5F1E6`, reglas rgba(245,241,230,.25). Tipografía local: **Bebas Neue** (`/assets/BebasNeue-Regular.ttf`) para años, etiquetas y fecha; **Economica** (`/assets/Economica-Regular.ttf`) para títulos y cuerpos. Logo real `/assets/logo.png` arriba a la izquierda.

Layout (de arriba a abajo):
1. Header: logo (altura ~64 px, aspecto real) izquierda; fecha "13 DE NOVIEMBRE" Bebas ~56 px dorada derecha.
2. Regla dorada 4 px.
3. Héroe (~42% del alto): año Bebas ~200 px dorado; título Economica ~52 px crema; resumen completo ~34 px; texto ampliado completo ~30 px (opacidad .75, máx 4 líneas); chip de categoría (borde dorado, Bebas, mayúsculas).
4. Regla 2 px.
5. Filas: año Bebas ~56 px dorado + título Economica ~34 px crema + resumen ~28 px + etiqueta de categoría dorada. **En todas las filas** (decisión del usuario).
6. Pie: izquierda "FUENTE: WIKIPEDIA · VERIFICADA"; derecha "N HECHOS DEL DÍA" (o "M DE N" si hay recorte).

Reglas de texto anti-error: wrap por palabras con `measureText`; el héroe nunca se trunca (el texto ampliado cabe completo); si una fila no alcanza para su resumen (muchos eventos), la fila degrada a año+título+categoría — nunca se corta el héroe ni se inventa texto.

## 7. Export

Botón único "Descargar PNG": `canvas.toBlob` → download `efemerides-YYYY-MM-DD.png` (fecha de la placa). Botón deshabilitado hasta estado `lista`. El canvas se escala por CSS en pantallas chicas; el PNG siempre sale a 1080×1080. Sin auto-publicación, sin WhatsApp en v1.

## 8. Errores

- Fetch fallido / 400 / 502 / timeout 45 s / `ok:false` / <5 items válidos → un reintento automático (backoff de 1,5 s) y, si persiste, estado `error` con mensaje en criollo + Reintentar. Si el servicio trae `error` propio (p.ej. "La fuente devolvió menos de cinco opciones utilizables."), se muestra ese mensaje tal cual.
- Logo o fuentes que no cargan tras 2 intentos → estado `error` ("No se pudo cargar el logo/las tipografías") + Reintentar. La placa nunca se exporta rota ni sin marca.

## 9. Testing

- `node --test --test-isolation=none efemerides/placa-model.test.mjs`: fixture con forma real de payload de hoy; cubre orden preservado, héroe = items[0], descarte de item sin título/año/resumen, recorte a 6 con total correcto, etiquetas conocida/desconocida, formato de `hoyArgentina()`, payload `{ok:false}` → error, items<5 → error, y que `alcance` no viaja al modelo.
- `node --check efemerides/efemerides.mjs efemerides/placa-model.mjs`.
- QA manual en navegador (servidor local): abrir `/efemerides/`, placa lista sin clics, screenshot comparado contra la maqueta v4 aprobada, Descargar PNG abre archivo válido 1080×1080, selector de fecha re-renderiza, modo offline muestra error con Reintentar, consola limpia.

## 10. No objetivos (v1)

Editor de bloques, colores/formatos elegibles, fotos en la placa, botón WhatsApp, publicación automática, cron, bindings nuevos en el worker, tarjeta en el `index.html` raíz (la ruta es directa, patrón `redaccion-v2`; se evalúa tarjeta después de verla viva).

## 11. Verificación final

`node --test --test-isolation=none efemerides/placa-model.test.mjs` verde; `node --check` de los dos `.mjs`; QA manual completa; `git status` muestra solo `efemerides/` + docs (nada de `visual-suite/`, `worker/`, `placas-v2/`, `index.html` raíz).
