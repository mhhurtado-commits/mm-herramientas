# Efemérides /efemerides/: editar la placa (destacada, ocultar, agregar hecho) — design

Fecha: 2026-11-18 · Estado: aprobado en brainstorming (approach A) · Doc: especificación de diseño.

## 1. Objetivo

El usuario (redacción Media Mendoza) debe poder modificar la placa del día **antes de publicarla**, con tres controles mínimos:

1. **Destacar** un hecho con un botón (pasa a ser la destacada/hero del día).
2. **Ocultar / mostrar** hechos que no convienen (ej. el Canal 5 de Rosario del 18/11 — nacional pero irrelevante para la provincia).
3. **Agregar un hecho propio** escrito a mano (ej. algo de Mendoza), aunque la fuente del día no lo traiga.

Motivación del brainstorming: la destacada del 18/11/2026 es "Canal 5 Rosario 1964" — no tiene que ver con Mendoza ni con la provincia. El usuario no puede corregir el orden ni la relevancia hoy; piden "la forma para que lo pueda hacer".

Decisiones del brainstorming:

- **Sin persistencia**: la edición vive solo en memoria del navegador. Al recargar o cambiar la fecha se pierde y arranca limpio (elección explícita del usuario).
- **La destacada = primer hecho visible** de la lista. No hay un `heroIndex` aparte (evita estados imposibles).
- **Los PNG / COPIAR PNG / DESCARGAR salen siempre del canvas** → quedan editados automáticamente.
- **Los copys (WA/IG) deben reflejar la edición** (destacada elegida + ocultos excluidos + hecho propio incluido) → el cliente postea la lista editada; el worker genera desde ella.
- Fuera de alcance (explícito): no se toca KV (ni placa ni copys), no hay edición de texto de hechos existentes, no hay reordenamiento por flechas (la destacada alcanza como control de orden), no hay editor para Instagram.

## 2. Arquitectura y flujo de datos

- **Estado en memoria** (`efemerides/efemerides.mjs`): `itemsPlaca[]` — lista plana con los hechos de la placa tal como llegaron del worker más los agregados a mano. Cada item: `{ id, icono, año, titulo, resumen, ampliado, oculto }`. Los ids del worker vienen (`fecha-N`); los propios llevan id local (`local-<n>`).
- `normalizarPayload` sigue siendo la puerta del GET (validación ≥5 hechos, reparación de año, slice a 6), pero ahora también **conserva `id`** en cada item normalizado. El modelo interno pasa a ser `{ fecha, items }` con la lista plana completa (incluidos ocultos y propios).
- Cada edición reconstruye la vista: `construirModeloPlaca(items)` (función pura nueva en `placa-model.mjs`): `visibles = items.filter(i => !i.oculto)`; `hero = visibles[0]`; `rows = visibles.slice(1)`; `totalMostrados = visibles.length`; `total = items.length`; pie «N DE M HECHOS DEL DÍA». Con 1 visible: hero solo, 0 filas (sin división por cero en el layout de filas).
- `dibujarPlaca` no cambia de firma (sigue recibiendo `{ hero, rows, verificada, fecha, totalMostrados, total }`).
- Al cambiar la fecha o recargar: `cargar()` resetea el editor junto con los copys → nada se filtra entre días.

## 3. UI: panel «EDITAR LA PLACA»

Dentro de `#placaLista`, bajo las acciones actuales y antes del panel de copys. Visible solo cuando el estado es `lista`.

```
EDITAR LA PLACA — CAMBIOS SOLO EN ESTA VENTANA
┌─ tarjeta por hecho ──────────────────────────────┐
│ ⚽ 1894 — Nacimiento del escritor Samuel Eichelbaum │
│    Resumen en 1 línea atenuado…                     │
│    [★ DESTACADA]  [OCULTAR]                         │
└───────────────────────────────────────────────────┘
… (una tarjeta por hecho, mismo orden de la lista)

AGREGAR UN HECHO
 año [____]  título [_______________________]
 resumen [_________________________________]
 ampliado [________________________________]
 icono [⚽ FÚTBOL ▾ (lista fija de 11)]   [AGREGAR HECHO]

[RESTABLECER PLACA ORIGINAL]  ← visible solo si hubo cambios
```

Comportamiento de tarjetas:

- Badge dorado **★ DESTACADA** en el primer visible; ahí no hay botón DESTACAR.
- **DESTACAR** (contorno dorado) en el resto: intercambia al tope → se redibuja la placa.
- **OCULTAR / MOSTRAR** (botón sólido dorado / toggle): la tarjeta oculta queda atenuada con badge **OCULTO**; sale de la placa y de los copys. **No se puede ocultar el último hecho visible** (botón deshabilitado) → nunca queda una placa sin destacada.
- Si ocultás la destacada, la siguiente visible hereda el hero (derivación pura: no hay código extra).
- Hechos propios: mismos controles; badge **TUYO** opcional para distinguirlos. El icono del form fija la etiqueta de categoría de la placa (mapa `ETIQUETAS` existente).
- Validación del form: `año` 1000–2099 (3–4 dígitos), `titulo` ≤ 160 y `resumen` ≤ 140 no vacíos, `ampliado` ≤ 240 (vacío → usa resumen). Error inline bajo el form; no rompe la placa.
- **RESTABLECER PLACA ORIGINAL** (contorno): limpia ocultos y agregados, restaura el orden del servidor y redibuja. Oculto mientras no haya cambios.
- Estilo: tipografía Oswald/Inter, paleta existente (fondo oscuro, dorado `#C8A24A`, crema `#F5F1E6`); acciones a la derecha; respetando el ancho del canvas.

## 4. Worker: rama POST en `/placas/v2/efemerides/copys`

Solo la ruta `/placas/v2/efemerides/copys` cambia; ni el endpoint de la placa ni el KV.

Handler unificado `handlePlacasV2EfemeridesCopys(request, url, env)`:

1. **POST** (`Content-Type: application/json`, body `{ fecha, items }`):
   - `fecha` válida (`validEfemeridesDate`) → 400 si no.
   - `items` normalizados con **`normalizarItemsEditados(items)`** (función pura nueva):
     - corta a 6, conserva orden;
     - exige `titulo` y `resumen` no vacíos (resumen ≤ 140, ampliado ≤ 240, título ≤ 160);
     - **`año` se acepta sin `repararAnioEfemerides`**: 3–4 dígitos `1000–2099`; inválidos descartados (a propósito distinto del GET, que sospecha del año igual al de la fecha y acota 1500–2025 — rompería un hecho de 2026);
     - `ampliado` vacío → `resumen`; `icono` desconocido → `historia` (📜);
     - 0 válidos → **400 `La lista de hechos editados no es válida.`**
   - **No lee ni escribe KV** (ni cache de copys ni placa): generación fresca siempre, sin servir copys viejos aunque KV tenga entradas.
2. **GET** (sin cambios): llama cache v6 → placa KV v5 → `itemsCopysReparados` → <5 válidos → 502; o hit de cache.
3. Convergencia con el flujo de siempre: `obtenerLinksWaEf(env)` (helper extraído del bloque actual de links KV: `WA_LINKS_KV_KEY` con defaults grupo/canal) → `buildEfemeridesCopysPrompt` → Gemini con deadline 45s (misma carrera actual) → `normalizarEfemeridesCopys` (años absolutos, patrón anti-antigüedad → fallback, negritas garantizadas en encabezado/año) → `jsonOk({ whatsapp, instagram, meta: { fecha, fuente: 'Wikipedia' | 'placa editada', cached: false } })`.
   - POST nunca guarda cache (la edición es efímera por diseño).
4. Encabezado `📅 *Efemérides del <fecha>*`, una línea por hecho con emoji (`emojiPorIconoEf`), CTA/firma canónicos de siempre.

Si el deploy del worker aún no está hecho (queda pendiente el deploy manual actual), el POST cae al handler viejo: responde GET (copys desde KV sin editar) — nunca rompe; los PNG ya funcionan igual. Requiere el deploy para que los copys reflejen la edición.

## 5. Client → copys con edición activa

- `cargarCopys()`: si `editado === false` → GET igual que hoy. Si `true` → **POST** con `{ fecha, items: itemsVisiblesCopys(itemsPlaca) }` — helper en `placa-model.mjs` que filtra `oculto`, conserva orden y emite `{ id, año, titulo, resumen, texto_ampliado, icono }`.
- Éxito/error del panel (GENERANDO…, REINTENTAR, «La placa sigue disponible.») igual que hoy. Opcional y descartable: mostrar `meta.fuente === 'placa editada'` como señal extra en el panel.
- Nota: con edición activa el cache se ignora igualmente del lado servidor; el botón no cambia de UX.

## 6. Archivos afectados

- `efemerides/placa-model.mjs`: `normalizeItem`/`normalizarPayload` conservan `id`; nuevas puras `construirModeloPlaca`, `itemsVisiblesCopys`, `validarHechoPropio`, `validarIcono`; exports para test.
- `efemerides/placa-model.test.mjs`: tests de las puras nuevas (ver Sección 7).
- `efemerides/efemerides.mjs`: estado `itemsPlaca`, `editado`, render del editor (tarjetas), handlers DESTACAR/OCULTAR/MOSTRAR/AGREGAR/RESTABLECER, `resetearEditor()` en `cargar()`, branching GET/POST en `cargarCopys()`. Canvas y exports sin cambios de firma.
- `efemerides/index.html`: sección `#editorPlaca` (lista + form + RESTABLECER) dentro de `#placaLista`; estilos (puede añadirse al `<style>` existente del archivo).
- `worker/worker.js`: `normalizarItemsEditados` (pura), extraer `obtenerLinksWaEf`, reescribir `handlePlacasV2EfemeridesCopys` a (request, url, env) con rama POST; el GET no cambia; la ruta copys pasa a método-agnóstico (GET y POST).
- `worker/efemerides-copys.test.mjs`: tests de `normalizarItemsEditados` y del handler POST con fake env.

## 7. Tests

Cliente (`efemerides/placa-model.test.mjs`):
- `construirModeloPlaca`: hero = primer visible; rows = resto; ocultos fuera; «N DE M»; 1 visible → hero solo, 0 filas (sin div/0); todos propios.
- `itemsVisiblesCopys`: excluye ocultos, conserva orden, mapea ampliado→texto_ampliado, omite ocultos agregados.
- `validarHechoPropio`: año 1000/2026 válidos, 999/2100 inválidos; título/resumen vacíos inválidos; longitudes cortadas; `icono` inválido → error.

Worker (`worker/efemerides-copys.test.mjs`):
- `normalizarItemsEditados`: acepta año 2026 (no lo repara); descarta inválidos/vacíos; corta 6; orden; ampliado vacío→resumen; icono desconocido→historia.
- Handler POST con env fake: body válido → 200, `meta.fuente === 'placa editada'`, y `KV.get/put` **no** llamados para copys (span). Body con 0 válidos → 400. GET sin placa KV → 502 (regresión).
- Suite completa verde + `node --check worker/worker.js`.

## 8. Casos borde y errores

- Ocultar el último visible → OCULTAR deshabilitado.
- Ocultar la destacada → la siguiente hereda hero (derivación pura).
- Hecho propio sin ampliado → resumen como ampliado (copys y placa).
- Inputs enormes → `maxlength` en form + truncado en normalizadores (mismo patrón actual).
- Cambio de fecha/recarga → editor reset (edits nunca cruzan días).
- Gemini caído en POST → fallback determinista actual (misma red de seguridad ya existente).
- Worker viejo pegado (deploy pendiente) → PNG editado funciona igual (100% cliente); copys salen sin editar por GET. Deploy requerido para copys fieles.
- `items` con >6 en POST → se cortan a 6 (compat. con prompt actual).
- Destacar × destacar consecutivo → idempotente (intercambia al tope siempre).

## 9. Criterios de aceptación

1. Abrir /efemerides/ un día cualquiera: placa 0-clics, panel EDITAR visible con una tarjeta por hecho.
2. Clic en DESTACAR en un hecho cualquiera → la placa se redibuja con ese hecho de destacada (PNG/copys coherentes).
3. OCULTAR deja la placa con un hecho menos; RESTABLECER vuelve todo a la placa del servidor.
4. AGREGAR HECHO con año 2026 funciona; se puede destacar/ocultar como cualquiera.
5. COPYS REDES tras una edición: el WA/IG reflejan la edición (destacada distinta / ocultos ausentes / hecho propio incluido); sin edición → igual que hoy.
6. Suite completa verde, syntax OK, QA navegador (stub fetch), deploy manual del worker como último paso.

## 10. Notas de implementación

- Mantener intactos: `handleVisualGenerar` (hunk ajeno), `visual-suite/*`, `docs/**` ajenos, EOL CRLF de `worker/worker.js`.
- Commit(s) selectivo(s) con staging por hunks del worker (script `stage-worker-copys.js` ya existente para descartar el hunk ajeno).
- Spec de copys redes (2026-11-14) queda desactualizada respecto de este flujo solo en `GET/POST método` — actualizar su bullet de endpoint al implementar (una línea).
