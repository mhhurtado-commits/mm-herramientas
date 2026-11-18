# Copys WhatsApp + Instagram para /efemerides/ — design

Fecha: 2026-11-14 · Estado: aprobado en brainstorming (approach A) · Doc: especificación de diseño.

## 1. Objetivo

Una vez generada la placa del día en `/efemerides/`, el usuario puede generar **bajo demanda** (1 clic) los copys de texto para acompañar esa placa en **WhatsApp** y **Instagram**. Copiar y pegar manual; **sin auto-publicación**, sin cron, sin editor.

Decisiones del brainstorming:
- Entrega: copy-and-paste manual (community manager), no alimenta `/publicar/`.
- Contenido: WhatsApp = lista de hechos del día; Instagram = caption + hashtags + CTA a mediamendoza.com.
- Generación: IA (Gemini) en el worker + fallback determinista (patrón `/whatsapp/generar`).
- UI: panel con 2 bloques (WHATSAPP / INSTAGRAM), cada uno con botón COPIAR propio.

## 2. Flujo y experiencia

1. La app sigue 0-clics: al abrir `/efemerides/`, la placa queda lista como hoy.
2. Botón nuevo **"COPYS REDES"** en `.acciones` (estilo `.secundario`), `disabled` hasta estado `lista`.
3. Clic → botón "GENERANDO…" → `GET /placas/v2/efemerides/copys?fecha=YYYY-MM-DD` (sin edición) o `POST` con `{ fecha, items }` cuando el redactor editó la placa (generación fresca, sin cache ni KV). Fecha de la placa activa; timeout cliente 55s, sin auto-reintento: el usuario reintenta con REINTENTAR).
4. Respuesta OK → panel debajo de la placa con los 2 bloques (Sección 5).
5. Fallo → panel con mensaje en criollo + REINTENTAR. **La placa nunca se toca**: los copys son un añadido, un fallo ahí no la afecta.
6. Recargar no regenera: cache KV 24h del lado del worker (misma política anti-regeneración que la placa).
7. Al cambiar la fecha, el panel se oculta y el botón vuelve a "COPYS REDES".

## 3. Endpoint del worker: `GET /placas/v2/efemerides/copys`

1. Valida fecha con `validEfemeridesDate` (400 si inválida).
2. Lee el **payload cacheado de la placa** (`placas-v2:efemerides:v5:<fecha>`). Si no existe → `jsonError('Esa fecha todavía no tiene placa: cargá la placa primero.', 502)`. No reinventa la placa.
3. **Aplica `repararAnioEfemerides` a los items del cache** antes de usarlos (cubre entradas KV viejas dañadas con año actual, ej. 2026-11-14) y descarta los que queden sin año verificable; si quedan < 5 items válidos → 502 (igual que la placa).
4. Lee cache de copys (`placas-v2:efemerides:v5:copys:<fecha>`, TTL 24h). Hit → `jsonOk({...cached, meta:{...cached.meta, cached:true}})`.
5. Si no: arma prompt (Sección 4) con los items reparados, llama a Gemini (`gemini-3.1-flash-lite` con fallback `gemini-3.5-flash-lite`, deadline 40s, `Promise.race` 45s como `/whatsapp/generar`).
6. Normaliza la respuesta `{whatsapp, instagram}`: strings no vacíos y ≤ límites. Si la IA falla, timeout, JSON inválido o campos vacíos → **fallback determinista** (Sección 4). Solo 502 si ni siquiera el fallback puede construirse (payload inservible) — en ese caso no cachea nada.
7. Cachea el resultado exitoso (IA o fallback) 24h y responde:
   ```json
   { "ok": true, "whatsapp": "…", "instagram": "…", "meta": { "fecha": "2026-11-14", "fuente": "Wikipedia", "cached": false } }
   ```
8. Los copys **solo** usan datos del payload cacheado (años reparados, títulos, resúmenes, iconos); nada inventado.

## 4. Contenido de los copys

### WhatsApp (lista de hechos + firma real)

```
📅 *Efemérides del 14 de noviembre de 2026*

⚽ *1894* — Nacimiento del escritor y dramaturgo Samuel Eichelbaum.
🎭 *1913* — Nacimiento del arquitecto Mario Roberto Álvarez.
🏛️ *2021* — Se cumplen 5 años de las elecciones legislativas donde el peronismo perdió el quórum en el Senado.
💹 *2002* — El default con el Banco Mundial.
📜 *1784* — Nacimiento de Francisco Pérez de Uriondo.

¡Sumate a nuestra comunidad!
📱 Grupo de Noticias: https://mediamendoza.pages.dev/grupo
📣 Canal de Difusión: https://mediamendoza.pages.dev/canal

📰 Mediamendoza - Noticias confiables del sur mendocino
```

- Una línea por hecho (héroe primero, máx 6): `• {año} — {resumen}`; si el resumen no cabe, el título.
- Emoji por hecho: mapa determinista `icono → emoji` (`futbol→⚽ deportes→🏆 aviacion→✈️ musica→🎵 teatro→🎭 politica→🏛️ historia→📜 sociedad→🗞️ economia→💹 mundo→🌎 canal→📺`; desconocido→📜). El emoji lo pone el worker, no la IA: el prompt entrega cada línea ya con su emoji y el normalizador garantiza que cada línea de hecho empiece con emoji.
- **Negritas**: encabezado `*Efemérides del ...*`; cada línea pone el año en `*año*`; la IA pone además 1–2 palabras clave del hecho en `*palabra*` (asterisco simple, como la firma). El worker garantiza determinísticamente que encabezado y año tengan negrita aunque la IA las omita.
- CTA comunidad + firma: **reutiliza** `buildCtaComunidad(links)` y `WA_FIRMA` ya inline en el worker. `links` se lee de KV `config:wa_links` (como `/whatsapp/generar`); default si KV falla: grupo `https://mediamendoza.pages.dev/grupo`, canal `https://mediamendoza.pages.dev/canal`.
- Sin URLs extra ni hashtags en WA; español rioplatense.

### Instagram (caption + hashtags + CTA)

```
📅 ¿Qué pasó un 14 de noviembre? En 1894 nacía Samuel Eichelbaum…

Un 14 de noviembre: 1913 nace Mario Roberto Álvarez; 2021 Argentina vota su medio término; 2002 entra en default con el Banco Mundial; 1784 nace Francisco Pérez de Uriondo.

La placa completa, más arriba 👆
👉 Leé más en mediamendoza.com
.
#MediaMendoza #Efemerides #HistoriaArgentina #Mendoza #HoyEnLaHistoria #Historia #Argentina #SurMendocino
```

- Primera línea gancho; 3–5 líneas con los mismos hechos (sin agregar datos); `La placa completa, más arriba 👆`; CTA único `👉 Leé más en mediamendoza.com` (sin `http`); 8–12 hashtags en la última línea tras un punto (`#MediaMendoza` y `#Efemerides` siempre, el resto según tema del payload); ≤ 2.200 caracteres, ideal 600–900.

### Fallback determinista

Misma estructura, texto plano construido con los items reparados: encabezado + `• {emoji} {año} — {titulo}` por item + CTA/firma (WA) y gancho fijo + 3 hechos + CTA + hashtags (IG). Nunca vacío.

## 5. UI del panel en la app

Debajo de la placa (hidden hasta primer éxito):

```
COPYS PARA REDES — 14 DE NOVIEMBRE

WHATSAPP
┌──────────────────────────────────────┐  ┌─────────┐
│ textarea[readonly], seleccionable    │  │ COPIAR  │
└──────────────────────────────────────┘  └─────────┘

INSTAGRAM
┌──────────────────────────────────────┐  ┌─────────┐
│ textarea[readonly], seleccionable    │  │ COPIAR  │
└──────────────────────────────────────┘
```

- Cajas `textarea[readonly]` (seleccionable y copiable a mano en mobile) + botón COPIAR por bloque: `navigator.clipboard.writeText(texto)` con guardia y feedback "¡COPIADO!" / "NO SE PUDO COPIAR" (patrón de COPIAR PNG).
- Estados del botón COPYS REDES: `COPYS REDES` → `GENERANDO…` (disabled) → `COPYS REDES` (listo) / `REINTENTAR` (error). Panel de error: mensaje en criollo + "La placa sigue disponible." + REINTENTAR.
- Al cambiar de fecha: panel oculto, botón reseteado.

## 6. Fallos y casos límite

- Gemini cae / JSON inválido / campos vacíos → fallback determinista; nunca copy vacío.
- Cache de placa dañado (años "2026") → reparo aplicado antes de generar (punto 3 de Sección 3).
- Sin placa cacheada / <5 items → 502 con mensaje; cliente lo muestra con REINTENTAR.
- KV corrupto (lectura copys o placa) → try/catch, ignora y regenera.
- Cliente offline / timeout 55s → panel con error + REINTENTAR; placa intacta.
- Icono desconocido → 📜.
- Desfase máximo 24h entre placa regenerada y copys viejos (mismo principio anti-regeneración).

## 7. Archivos

- `worker/worker.js`: `EMOJOS_POR_ICONO`, `buildEfemeridesCopysPrompt`, `normalizarEfemeridesCopys`, `buildEfemeridesCopysFallback`, `handlePlacasV2EfemeridesCopys`, ruta en el fetch único, exports para tests. Reutiliza `repararAnioEfemerides`, `WA_FIRMA`, `buildCtaComunidad`, lectura de `config:wa_links`. No toca `worker/whatsapp-copy.mjs` (sin riesgo de desincronización).
- `efemerides/index.html`: botón + panel + estilos (variables dorado/crema existentes).
- `efemerides/efemerides.mjs`: estado copys, fetch 55s, dibujo del panel, COPIAR por bloque, reset al cambiar fecha.
- `efemerides/placa-model.mjs` + test: `extraerCopysRespuesta(raw)` puro (ok + strings no vacías).
- `worker/efemerides-copys.test.mjs`: tests del worker.
- `docs/superpowers/specs/2026-11-14-efemerides-copys-redes-design.md` (este doc).

## 8. Fuera de scope

Auto-publicación, bot de WhatsApp, cron, tarjeta nueva en `index.html` raíz, regeneración forzada de copys, edición de copys por el usuario.

## 9. Deploy

1. App: push a main → Cloudflare Pages sirve `/efemerides/` sola.
2. Worker: **pegar `worker/worker.js` completo en el dashboard** (manual, como siempre). Sin ese paso el endpoint `/copys` no existe en producción; el botón muestra el error con REINTENTAR y la placa sigue funcionando.

## 10. Verificación

- `node --check worker/worker.js`.
- Tests: 5 del worker (IA OK → normalización; IA rota → fallback; fallback incluye años reales + emojis + firma + CTA y nunca "2026" inventado; prompt incluye fecha + items; reparo sobre cache dañado) + 3 del cliente (payload ok, payload sin copys, error → mensaje visible). Suite completa verde.
- QA manual en navegador: botón habilitado tras placa; clic → panel; COPIAR con feedback; fecha distinta; offline → error + Reintentar; screenshots.
