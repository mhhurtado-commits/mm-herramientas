# Diseño — Alertas de Tormentas (`/alertas/`)

**Fecha:** 2026-11-17
**Estado:** Aprobado en sesión de brainstorming (secciones 1–4 con el usuario)

## Contexto

Media Mendoza necesita generar en segundos una *placa* (imagen cuadrada/vertical) a partir del parte meteorológico que pega el redactor (Radar San Rafael-AEMSA / Marcelo Peña), para enviar por WhatsApp y publicar en Instagram. La herramienta "Alerta" existente dentro de `/placas-v2/` se descarta por su diseño; se construye una herramienta nueva **desde cero**, sin tocar `placas-v2` (que queda en producción tal como está).

Texto de entrada típico (parte pegado por el redactor):

```
Reporte Meteorológico
Informa el Sr. Marcelo Peña de Radar San Rafael-AEMSA:
-La tormenta comienza a afectar con lluvia fuerte y granizo a Calle Larga, Atuel Norte y Villa Atuel. Sigue desplazándose hacia el este, y podría afectar más tarde a Las Aguaditas, Real del Padre y el sector norte de Jaime Prats.
-Otra tormenta con granizo comienza a cruzar la Ruta 144 a la altura del Desvío. Se desplaza al este, con dirección al Cañón del Atuel y Valle Grande.
```

```
-Atención para Valle Grande en 5-10 minutos. Estaría llegando al Embalse una tormenta con precipitación de lluvia fuerte y granizo.
```

## Alcance (lo que incluye)

- App nueva en carpeta **`/alertas/`**, acceso por URL directa (como `/redaccion-v2/`), **sin** tarjeta en el hub por ahora.
- Un único flujo: pegar parte → IA estructura → formulario editable → preview canvas → export PNG + copiar PNG → caption para WhatsApp (también sirve de caption de Instagram).
- Tres tamaños de export: **1:1** (1600×1600), **4:5** (1350×1688), **9:16** (1080×1920), elegidos antes de descargar.
- Extracción vía worker `mm-herramientas-worker` (`POST /social/generar`) — sin cambios al worker.
- Visual: dirección **"A — Alto impacto"** aprobada con mockup (fondo oscuro, borde amarillo, ETA rojo).

## Fuera de alcance

- Tarjeta/link en el `index.html` del hub (se agrega aparte si el usuario lo pide).
- Cambios al worker, a `/placas-v2/`, o a la placa existente.
- Subir imágenes/radar de fondo (una placa tipográfica es suficiente para el caso de uso).
- Forzar nivel fijo para tormentas (el nivel lo *sugiere* la IA y el usuario lo confirma/edita).
- Carrusel, reels, vídeo — una sola placa por parte.
- Tema claro, otros idiomas, publicación directa a Instagram/WhatsApp API.

## Decisiones y respuestas de alcance

| Punto | Decisión |
| --- | --- |
| Ruta / integración | `/alertas/` carpeta nueva, sin tarjeta en hub. `/placas-v2/` intacto. |
| Salida | PNG en 1:1, 4:5 y 9:16 (los tres). |
| Extracción | Worker con IA (`/social/generar` con `systemPrompt` propio). Sin cambio al worker. |
| Edición | Formulario editable tras IA + botón "Actualizar placa". |
| Caption | Se genera texto de WhatsApp (también sirve de caption IG) + botón copiar. |
| Nivel | IA sugiere gris/blanco/azul/verde/amarillo/naranja/rojo/violeta; usuario edita; default naranja si no se infiere. `gris` sin alerta · `blanco` informativo · `azul` vigilancia · `verde` leve · `amarillo` moderada · `naranja` fuerte · `rojo` severa · `violeta` máxima. |
| Estructura | Bloques dinámicos según el parte: 1–3 bloques de zona, dirección `→ ESTE` cuando aplica, banner ETA solo si el parte lo trae. |
| Hora impresa | Ahora del navegador, editable. |
| Marca | Logo blanco `assets/logo.png` + wordmark `MEDIA MENDOZA` + `mediamendoza.com`. |
| Render | **Canvas programático único** (preview y export del mismo `<canvas>`); sin dependencias. |

## Archivos nuevos

```
alertas/
  index.html            estructura + estilo inline (tema oscuro suite) + gate de contraseña
  alertas-core.mjs      modelo, SYSTEM_PROMPT, validadores, builder de caption (puro, sin DOM)
  renderer.mjs          dibujo canvas por formato (recibe ctx)
  app.mjs               wiring: fetch worker, estado, formulario, export/clipboard/toast
  alertas-core.test.mjs tests con node --test
```

No se crea `style.css` dentro de `alertas/`; se usa `../style.css` (variables globales de la suite) + bloque `<style>` inline propio. Recursos externos: `Inter` (ya cargada por `style.css`), `Arial Black`/`Arial` (titulares, del sistema).

## Modelo de datos (normalizado)

`alertas-core.mjs` normaliza lo que devuelve la IA a:

```js
{
  titular: string,                       // ej. "TORMENTAS CON GRANIZO AL ESTE"
  fuente: string,                         // ej. "Radar San Rafael-AEMSA · Marcelo Peña"
  hora: string,                           // "11:00" (hora del parte; si no, hora del navegador al montar el formulario)
  fecha: string,                          // "17/11"
  nivel: 'gris' | 'blanco' | 'azul' | 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'violeta',  // default naranja
  direccion: string,                      // "este" | "oeste" | "norte" | "sur" | ""
  celdas: [                               // 1 a 3, derivados de las viñetas del parte
    { etiqueta: 'ahora' | 'ruta' | 'siguiente',
      zonas: string,                      // "Calle Larga, Atuel Norte y Villa Atuel"
      detalle: string,                    // "lluvia fuerte y granizo"
      hacia: string },                    // "este" | ""
    ...
  ],
  eta: { lugar: string,                   // "Valle Grande · Embalse"
         detalle: string,                 // "llegada en 5–10 min · lluvia fuerte y granizo"
         minutos: number } | null,        // null si el parte no la trae
}
```

**Regla de honestidad editorial:** la IA extrae/reescribe, nunca inventa. Si el parte no trae dirección/ETA/nivel, esos campos quedan vacíos/`null`/naranja; el banner "Llegada en … min" no se dibuja. Lo que la IA no extraiga, el usuario lo completa a mano en el formulario.

## Extracción (SYSTEM_PROMPT, `alertas-core.mjs`)

Sin tocar el worker: se llama `POST /social/generar` con `{ systemPrompt, userMsg }` (mismo contrato que `placas-v2`). El prompt le indica al modelo:

- Devolver **SOLO** JSON válido sin backticks: `{ titular, fuente, hora, nivel, direccion, celdas: [{etiqueta, zonas, detalle, hacia}], eta }`.
- `titular`: 2–5 palabras en mayúsculas, hecho principal, sin punto final.
- `fuente`: organismo/persona que emite; si no aparece, `Mediamendoza`.
- `hora`: hora de emisión del parte en `HH:MM`; si no aparece, `""`.
- `nivel`: uno de `gris|blanco|azul|verde|amarillo|naranja|rojo|violeta` (`gris` sin alerta · `blanco` informativo · `azul` vigilancia · `verde` leve · `amarillo` moderada · `naranja` fuerte · `rojo` severa · `violeta` máxima); si no se puede inferir, `naranja`.
- `direccion`: `este|oeste|norte|sur` cuando el parte la marca; si no, `""`. Se extrae y valida pero **no se imprime** en la placa ni va al caption (los pills de dirección usan `celda.hacia`); se conserva como campo editable para uso futuro.
- `celdas`: **UN ítem por viñeta** del parte (máx. 3):
  `{ etiqueta: 'ahora'|'ruta'|'siguiente' }` según si el parte dice "comienza a afectar/ya está" (ahora), "cruza/desplaza hacia" (ruta) o "más tarde/podría/next" (siguiente).
  `zonas` = localidades/calles afectadas **copy-pasteadas** del parte (sin inventar), `detalle` = qué ocurre (lluvia fuerte / granizo / lluvia) y `hacia` = dirección que menciona.
- `eta`: **solo si el parte anuncia llegada en minutos** a un lugar (ej. "5-10 minutos", "llegando al Embalse"): `{ lugar, detalle, minutos }`. Si no, `eta: null`.
- Prohibido inventar calles, mezclar datos entre viñetas o crear ETA/dirección que el texto no tenga.

`validarEnFuente(data, textoOriginal)` descarta/limpia zonas, direcciones y ETA que no aparezcan en el texto original (misma filosofía que `validarDetallesContraFuente` de `placas-v2`). Para ETA, el `lugar` se verifica **por tokens** (`Valle Grande · Embalse` → `Valle Grande` + `Embalse` deben aparecer ambos); así un lugar compuesto legítimo se conserva y uno solo con algún componente ausente se descarta.

## UI y flujo de interacción (`index.html` + `app.mjs`)

1. Pantalla inicial: `textarea` grande "Pegá el reporte meteorológico tal cual llegó" + botón **Generar alerta** (deshabilitado con el campo vacío).
2. Spinner/estado "Recibí del parte, estructurando…" en la zona de resultado.
3. Respuesta: se normaliza y se pintan a la derecha un `<canvas>` con la placa (selector de tamaño arriba del canvas: `1:1 | 4:5 | 9:16`) + debajo el formulario a dos columnas con todos los campos editables (`titular`, `fuente`, `hora`, `fecha`, `nivel`, `direccion`, hasta 3 `celdas` [etiqueta, zonas, detalle, hacia], `eta` opcional (lugar, detalle, minutos) y caption; botón **Actualizar placa**).
4. Caption de WhatsApp: textarea de solo lectura + botón **Copiar caption**.
5. Botones **Descargar PNG** y **Copiar PNG** (clipboard API con fallback a descarga + toast si falla). Nombre de archivo: `alerta-tormentas-YYYYMMDD-HHMM.png`.
6. Estados de error: banner rojo/inline "La IA no pudo estructurar el parte; completá a mano" (formulario siempre disponible, nunca bloqueado); si el fetch no responde o el JSON no valida, mismo banner con el formulario vacío pre-rellenable.
7. Al cargar, hora/fecha toman `now()` del navegador (editables). Si el parte trae hora, se usa la del parte.
8. Canvas render en `renderer.mjs` con parámetros de formato; escala única basada en `block = canvas.width / 1350`.
9. Gate de contraseña idéntico a la suite (misma constante `PASSWORD`, `verificarPassword()`, `verificarSesion()`, `mm-auth` en localStorage, modal login idéntico).
10. `toast()` idéntico al de la suite.

## Diseño visual — Opción A "Alto impacto"

Canvas `W×H` según formato. Fondo vertical `#10130f → #0a0c09`. Borde exterior redondeado `#f5c518` (≈4px a escala), interior on dark. Orden vertical:

1. **Header**: izquierda, chip `ALERTA` (bloque sólido `#f5c518`, texto `#141414`, tracking alto, peso 900); derecha, logo blanco pequeño (`new Image()`, `../assets/logo.png`) + `fecha · hora` en small caps gris.
2. **Titular** (Inter/Arial Black, peso 800–900, `#f5f5ec`, 2 líneas): el `titular` de la IA. Espaciado controlado, mayúsculas.
3. **Byline**: `fuente` en small caps `#f5c518` tracking (ej. `RADAR SAN RAFAEL-AEMSA · MARCELO PEÑA`).
4. **Bloques dinámicos** (1–3): panel translúcido `rgba(245,197,24,.08)`, barra izquierda `#f5c518` 3px. Cada bloque: etiqueta uppercase (`AFECTANDO AHORA` / `EN RUTA` / `PRÓXIMO`), cuerpo `zonas — detalle` (`#f5f5ec`), y pill `→ ESTE` (amarilla, texto `#141414`) a la derecha cuando `hacia` está.
5. **Banner ETA** (solo si `eta != null`): bloque sólido `#c0392b`, ícono `⚡` + texto blanco `Valle Grande: llegada en 5–10 min · Embalse — lluvia fuerte y granizo`.
6. **Footer**: línea fina `rgba(255,255,255,.12)`; izquierda wordmark texto `MEDIA MENDOZA`; derecha `mediamendoza.com · 17/11 · 11:00` en `#a7a896`. (El logo blanco va solo en el header; sin duplicidad de marca.)

Regla de adaptabilidad por formato:
- `1:1`: titular ~72px, bloques compactos (gap 14px), footer ajustado.
- `4:5`: titular ~84px, bloques con más padding (gap 18px).
- `9:16`: titular ~96px, bloques altos (gap 24px), ETA con padding extra, márgenes laterales 56px.

Tipografía: `Arial Black` (titulares), `Inter` (cuerpo y labels, ya cargada con la suite). Logo con fallback de texto `MM` si `img.onerror`.

Colores: fondo `#10130f/#0a0c09`, panel `#1a1f18`, yellow `#f5c518`, red `#c0392b`, text `#f5f5ec`, dim `#a7a896`.

## Caption WhatsApp (`buildWhatsAppCaption`)

Plantilla (editable por el usuario en un textarea; copia con botón **Copiar caption**):

```
⚡ ALERTA | Media Mendoza
{titular en minúsculas capitalizadas o tal cual}
• Ahora: {zonas} — {detalle}
• En ruta: {zonas} → {hacia}
• {lugar}: llegada en {minutos} min — {detalle}
Fuente: {fuente} · mediamendoza.com
```

- Mapeo de viñetas: `ahora → "• Ahora: …"`, `ruta → "• En ruta: …"`, `siguiente → "• Próximo: …"`.
- Solo se incluyen las viñetas/ETA presentes; si no hay `eta`, no se imprime la línea.
- Si no hay `celdas`, la sección de viñetas se omite por completo (solo encabezado + titular + fuente).
- La cabecera `⚡ ALERTA | Media Mendoza` es fija.
- Si la IA devuelve un titular vacío, no se imprime ninguna línea de titular (solo encabezado fijo + viñetas reales + fuente); nunca se sustituye por un rótulo inventado (`TORMENTAS EN LA ZONA` eliminado).
- `zonas` no verificables contra el texto original quedan en `''` y la viñeta se omite.

## Manejo de errores

| Caso | Resolución |
| --- | --- |
| Textarea vacío | Botón deshabilitado, hint inline. |
| `fetch` falla / worker fuera / `{ok:false}` | Banner "No se pudo generar… completá a mano", formulario en blanco. |
| IA devuelve JSON inválido | `normalizeAlertReport` atrapa, retorna objeto vacío; banner + formulario vacío. |
| Campos faltantes en JSON | Los vacíos quedan con placeholder neutro ("—"); nunca valores inventados. |
| `ClipboardItem` no soportado | Toast "No se pudo copiar; descargá el PNG" y se habilita descarga. |
| Logo no cargó | Fallback wordmark de texto (`MEDIA MENDOZA`), la placa se genera igual. |
| Parte sin tormentas/celdas | `celdas: []`, `eta: null`; banner ETA no se dibuja; caption sin viñetas; nivel editable manual. |

## Testing y verificación

`node --test alertas/alertas-core.test.mjs` con casos:

1. Parte del Radar San Rafael-AEMSA (partes 1 y 2) → 2 celdas en orden, `direccion: 'este'`, `eta` = `{lugar: 'Valle Grande · Embalse', minutos: 10}` (detectada de "5-10 minutos").
2. Parte sin ETA (solo viñetas 1–2) → `eta === null`, sin banner.
3. JSON con `nivel: 'huracán'` → se normaliza a `'naranja'`.
4. `zonas` con calles inventadas (no en el texto original) → `validarEnFuente` las deja como cadena vacía (`''`); nunca `'Mendoza'` ni un placeholder inventado. El caption y el renderer omiten las celdas sin zonas.
5. `buildWhatsAppCaption` sin `eta` → no imprime la línea del Embalse; con `celdas: []` → sin bullets.
6. `titular` con punto final → se elimina.
7. `hora` ausente en el parte → `''` (la UI la rellena con `now()` al montar el formulario).
8. Texto vacío → `normalizeAlertReport('')` retorna un objeto vacío estable (sin throw).

Verificación de la sesión completa:

```powershell
node --check alertas/alertas-core.mjs
node --check alertas/app.mjs
node --check alertas/renderer.mjs
node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs redaccion-v2/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs alertas/*.test.mjs
node --check worker/worker.js          # sin cambios en el worker
```

## Notas de plataforma

- Sin build, sin bundler; Pages sirve los archivos tal cual; `alertas/` es una ruta pública (`/alertas/`) al desplegar.
- El worker no se modifica. Si algo en `/social/generar` cambiara contrato, la app lo señala como error (principio del contrato).
- `_headers`/`_redirects` sin cambios (la app no usa FFmpeg).
- No se agrega tarjeta al hub por decisión explícita; agregarla más adelante es solo 1 bloque de 3 en `index.html`.

## Preguntas abiertas para la implementación

Ninguna pendiente de diseño; las decisiones están congeladas en este documento.
