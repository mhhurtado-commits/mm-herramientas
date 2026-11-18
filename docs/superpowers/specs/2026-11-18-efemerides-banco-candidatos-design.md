# EFEMÉRIDES — Banco de candidatos (previsualizar y armar la placa definitiva)

## 1. Problema

La placa diaria de `/efemerides/` se arma hoy con una llamada a Gemini sobre la página Wikipedia del día, con prioridad argentina pero sin curaduría: hechos relevantes (feriados oficiales, fechas mendocinas) no aparecen — ej. hoy 18/11 el redactor no encontraba lo suyo en la lista pese a ser un día destacado en su agenda. Se agrega un **banco de candidatos**: más opciones de Wikipedia + feriados argentinos oficiales + efemérides mendocinas, para armar la placa a mano. La placa sigue automática por defecto.

## 2. Alcance

**Incluido**
- Banco plegable en `/efemerides/` con candidatos de 3 fuentes, agregables a la placa con un clic.
- La placa definitiva se arma con el editor existente (destacar / ocultar / agregar hecho propio). Nada cambia para quien no abra el banco.
- Sin persistencia: el banco vale solo mientras la ventana está abierta (como el resto de la edición).

**Excluido**
- Edición persistente, nuevos KV, contador/ranking de "importancia", sugerencias IA de reemplazo, candidatos a >7 días, edición inline de hechos ya en la placa.

## 3. Fuentes y contrato

### 3.1 Wikipedia ampliada (sin endpoint nuevo)

- El prompt de `handlePlacasV2Efemerides` (GET, ~línea 8946 de `worker/worker.js`) cambia de "Devolvé entre 5 y 8 opciones" a "Devolvé todas las opciones argentinas e internacionales razonables: entre 8 y 15".
- La placa muestra las 6 mejores como hoy: `normalizarPayload` del cliente sigue devolviendo como `items` los primeros 6 por orden de prioridad; el array completo llega en un campo nuevo `candidatos` en la respuesta JSON del GET (compat: el cliente viejo ignora `candidatos`).
- Cache KV (`placas-v2:efemerides:v5:`, TTL 24h) guarda el array completo; caches ya desplegadas con 5–8 items son válidas (banco solo muestra menos candidatos).
- Se conservan años, iconos e imágenes exactamente como están (no se toca normalización).

### 3.2 Feriados argentinos (endpoint nuevo)

- GET `/placas/v2/efemerides/banco?fecha=YYYY-MM-DD&dias=7` → `{ ok: true, feriados: [...] }`.
- El worker pide `https://api.argentinadatos.com/v1/feriados/{year}` (y el siguiente año si el rango cruza fin de año), filtra los que caen entre `fecha` y `fecha + dias` días inclusive.
- Se devuelven como hechos sin año histórico: `{ id: 'feriado-<fecha>-<slug>', año: '', titulo: nombreOficial, resumen: '<fecha> de <nombreOficial>', texto_ampliado: igual al resumen, icono: 'historia', categoria: 'EFEMÉRIDE ARGENTINA', alcance: 'nacional', feria: true }`.
- `fetcher` inyectable con default `globalThis.fetch` para testeo (mismo patrón que `gemini` en copys).
- Sin KV ni cache propia; respuesta chica; errores → `feriados: []` con `ok: true` (no rompe el banco). Timeout 8s por llamada (AbortController).
- Caso borde 2026 documentado: Día de la Soberanía Nacional = 2026-11-23 (trasladable desde 20/11). El banco lo muestra desde 7 días antes con `feria: true`.

### 3.3 Efemérides mendocinas (archivo estático del repo)

- `efemerides/efemerides-mza.json` servido como estático por Pages; lo pide el navegador directo (no pasa por el worker).
- Formato: `{ "MM-DD": [ { "año": "1861", "titulo": "…", "resumen": "…", "texto_ampliado": "…", "icono": "historia" } ] }`.
- El banco filtra hechos cuyo `MM-DD` cae entre `fecha` y `fecha + dias` (hoy + 7 días).
- Seed inicial (contenido mendocino sólido, todo editable en el JSON):
  - `01-12` 1817 — El Cruce de los Andes (inicio de la campaña libertadora, 1817)
  - `03-02` 1561 — Fundación de Mendoza (Pedro del Castillo)
  - `03-20` 1861 — Terremoto de Mendoza que destruye la ciudad colonial
- Cada entrada puede tener 1..N hechos por fecha. JSON inválido o fetch fallido → Mendoza no aporta candidatos; el banco igual muestra el resto (no fatal).
- Sin año real para feriados: los candidatos Mendoza llevan siempre año completo.

## 4. UI

- Sección plegable **BANCO DE CANDIDATOS** debajo del panel AGREGAR UN HECHO, plegada por defecto; el encabezado lleva el contador (`N CANDIDATOS`).
- Al expandir por primera vez, se hace fetch perezoso: (a) `candidatos` de la respuesta GET ya en memoria, (b) feriados (worker), (c) `efemerides-mza.json`. Los errores parciales no tapan sección: cada fuente que falla simplemente no aporta.
- Tarjeta: badge de fuente (`WIKIPEDIA` / `EFEMÉRIDE AR` / `MENDOZA`), año grande (o `DD MMM` en dorado para feriados, ej. `23 NOV`), título, resumen de 1 línea, botón `+ AGREGAR`.
- Al agregar: el candidato entra al final de `itemsPlaca` (con id nuevo `local-…` si viene de feriados/Mendoza; mantiene su id si viene de Wikipedia), se marca de inmediato y el botón pasa a `✓ EN LA PLACA` con mismo estilo que RESTABLECER. Reabrir/cerrar el banco no duplica (se recuerdan los ids ya agregados en la sesión).
- El editor existente (destacar/ocultar/contador/restablecer) y la destacada=primera visible funcionan sin cambios.
- La placa dibujada: hecho con `año:''` → celda grande muestra `DD MMM` (ej. `23 NOV`) en dorado; en filas, la columna de año muestra `AR`; en el pie, sin cambios.
- Copys: si el banco agregó un feriado sin año, el prompt recibe ese ítem con `año:''` — `buildEfemeridesCopysPrompt` y `garantizarNegritasEf` deben tolerar año vacío (línea sin año, no romper: ya existe el fallback por año ausente).

## 5. Arquitectura y archivos

| Archivo | Cambio |
|---|---|
| `worker/worker.js` | Prompt Wikipedia ampliado (8–15, "todas las opciones razonables"); GET propaga `candidatos` (array completo); nuevo `handlePlacasV2EfemeridesBanco` + rama GET `/placas/v2/efemerides/banco`; pura `normalizarFeriadosAR(data, desdeISO, dias)` (exportada, testeable) |
| `efemerides/efemerides-mza.json` | Seed (3 hechos) |
| `efemerides/placa-model.mjs` | `construirModeloPlaca` tolera `año:''` (sin cambios de forma); las filas reciben `año:'AR'` prearmado cuando falta (se arma en cliente, no en canvas); nada más |
| `efemerides/efemerides.mjs` | Sección banco: expand/collapse, fetch feriados + Mendoza, render, agregar a placa, ids agregados |
| `efemerides/index.html` | Sección plegable + estilos (badges, tarjetas compactas, `details/summary` o botón propio) |
| `worker/efemerides-copys.test.mjs` | Tests de `normalizarFeriadosAR` (filtra, traslada, fechas cruzan fin de año, año vacío) |
| `efemerides/placa-model.test.mjs` | (sin cambios si el año vacío se resuelve en cliente; si hace falta pura, acá) |

**Sin persistencia, sin KV nuevos.** El banco no escribe ni lee `placas-v2:efemerides:v5:*` ni `v6:copys:*`.

## 6. Casos borde

- Feriados API caída/lenta/no JSON → `feriados: []`, banco igual funciona.
- Mendoza JSON con fecha no presente / malformado → sin candidatos Mendoza.
- Rango del banco cruza 31/12 → se piden los dos años de feriados.
- Candidato Wikipedia ya elegido manualmente antes (mismos ids) vs agregado desde el banco → sin duplicado por ids recordados en la sesión.
- Fecha sin nada en ninguna fuente → sección muestra "Sin candidatos extra para esta fecha".
- Agregar todos los disponibles → sin tope adicional a los 6 de la placa: al superar 6 visibles/totales, AGREGAR se deshabilita con el tooltip "La placa ya tiene 6 hechos" (la placa no puede dibujar más de 6).
- Año vacío en la placa: PNG/copys salen igual (sin año para ese ítem, nunca `-1`).

## 7. Criterios de aceptación

1. Con edición sin tocar nada, el flujo es idéntico al actual (mismos 6 hechos, misma placa, mismos copys).
2. Abrir el banco muestra ≥ 3 fuentes posibles según la fecha; feriados muestran el oficial del año actual.
3. Agregar un feriado con año vacío a la placa → el PNG lo muestra con `23 NOV` grande, sin año numérico, fuente WIKIPEDIA intacta para el resto.
4. Copys con un feriado sin año en la edición → sin crash, sin `-1`, sin "hace N años".
5. `node --check worker/worker.js` verde; suites `worker/efemerides-copys.test.mjs` y `efemerides/placa-model.test.mjs` verdes; suite completa del repo verde.
6. Deploy manual del worker (usuario) activa `/banco` y el prompt ampliado para uso real; la edición/PNG/agregado desde la sesión actual no depende del deploy hasta que el redactor lo use.

## 8. Notas de implementación

- Hunks del worker a tocar: (a) prompt inline ~8946, (b) export + `handlePlacasV2EfemeridesBanco` junto a los copys, (c) rama GET en el router junto a las otras rutas de efemérides, (d) `normalizarFeriadosAR` + `export { …normalizarFeriadosAR… }`. Mismo ritual de commits selectivos (`stage-worker-copys.js` no aplica acá: este trabajo toca solo hunks de efemérides; verificar con `git diff -U0` y commit por hunks si aparece algo ajeno).
- EOL CRLF de `worker/worker.js` — no normalizar.
- Specs relacionados: 2026-11-14 (copys redes, actualizado con POST), 2026-11-18 (editar la placa) — este spec extiende el banco, no reemplaza nada.
- QA final: servidor local + navegador, como se hizo para la edición de placa.
