# Efemérides: candidatos TyC en el panel interno (/efemerides/)

## 1. Problema y objetivo

Media Mendoza usa `/efemerides/` como herramienta interna de armado de la placa
diaria (pool Wikipedia es∩en + curadas → editor de hechos → placa → copys). El
sincronizador TyC (`tyc-efemerides/`, commit `5a867f2`) permite detectar qué
hechos del día vale la pena realzar según TyC Sports, pero hoy sólo corre en
local. Objetivo: exponerlo dentro de ese panel como herramienta de **revisión
sola lectura** — sin KV, sin placa, sin copys — para que el operador vea las
candidatas junto a la placa que está armando.

Fuera de alcance: cron, KV nuevo, página pública, botón "usar en placa",
integración con copys, backfill histórico. TyC sólo orienta qué mirar; ningún
hecho entra a la placa sin pasar por el pool verificado es∩en/curadas con
alta manual del operador.

## 2. Alcance

- Nueva sección **«Candidatas TyC — revisión»** al final de `/efemerides/`
  (debajo del editor/banco/copys), misma página y mismo gate actual.
- Boton «VER CANDIDATAS TYC» que llama al nuevo endpoint del worker con la
  fecha seleccionada en el editor.
- Tabla read-only: Año | Título | Alcance | Estado | Enlace (Wikipedia) cuando
  hay match `cruzado`. Badges `cruzado | en banco | candidato` con los mismos
  colores que los identificadores existentes en la página.
- Campo **URL del artículo TyC** (visible siempre): bypass manual del índice,
  como `--url` del CLI. Text box con placeholder del slug.
- Filtro simple por estado (Todas / Cruzados / En banco / Candidatos).
- Pie obligatorio: **«Contenido © Grupo Clarín — sólo metadatos y resumen
  corto; la redacción está en tycsports.com ↗»** + link al artículo.
- Totales en el header (`meta`): total hechos · cruzados · en banco ·
  candidatos.
- Sin persistencia: nada se guarda en KV/CLIENTE/edición; al recargar, el
  panel se vacía.
- Estilos copiados de los componentes existentes (`.copys-bloque`,
  `.hecho-card`, `.badge`); no toca el editor, las copys ni la placa.

## 3. Endpoint del worker

```
GET /placas/v2/efemerides/tyc?fecha=YYYY-MM-DD[&url=https://www.tycsports.com/…]
```

- `fecha` obligatoria, validada con `validEfemeridesDate` → 400 si inválida.
- Si viene `url`: se usa directamente (bypass, patrón `--url`). Sin validación
  de host (la haría frágil ante redirecciones); se acepta cualquier URL
  http(s). Si el fetch falla → 502 con mensaje claro.
- Sin `url`: AppSync (`hitsPerPage: 100`, `searchAbout: "efemerides"`), filtro
  por `order_date` == fecha; sin hit → **502** con
  `«No hay artículo TyC para esa fecha en el índice; pegá la URL manualmente»`.
- Respuesta **200**:

```json
{
  "fecha": "2026-11-11",
  "articulo": "https://www.tycsports.com/interes-general/efemerides/efemerides-del-11-de-noviembre-que-se-conmemora-hoy-id771003.html",
  "obtenido": "2026-11-18T…Z",
  "items": [{ "año": "1788", "titulo": "FACUNDO QUIROGA", "texto": "…≤120 chars…", "alcance": "nacional|internacional", "estado": "cruzado|en-banco|candidato", "fuenteEs": "https://es.wikipedia.org/wiki/…|null" }],
  "meta": { "hechos": 10, "cruzados": 0, "enBanco": 0, "candidatos": 10 }
}
```

- Sin KV, sin reintentos agresivos, UA `MediaMendoza-Efemerides-TycSync/1.0
  (+https://mediamendoza.pages.dev/)`, timeout 10s.
- La construcción del pool es idéntica a `handlePlacasV2Efemerides`: Wikipedia
  raw es∩en → `emparejarEsEn(parseEfemeridesWikitexto(…))` + curadas del
  `CURADAS_EF_URL`. Estado por año + token compartido ≥4 letras (stopwords
  ES+EN como en `tyc-cotejo.mjs`); alcance por `RE_KW_AR_EF` (misma regex que
  usa la placa en producción).
- Si el parser devuelve 0 hechos → 502 con
  `«El parser no detectó hechos (posible cambio de estructura de TyC)»`.

## 4. Worker: implementación

`worker/worker.js` es un archivo único sin `import` (pegado completo en
Cloudflare). Se **inlinean** las piezas nuevas, con comentario «espejo de
tyc-efemerides/tyc-{client,parse,cotejo}.mjs; si cambian allá, actualizar
acá»:

- `buscarEfemeridesTycWorker(fetcher)` — AppSync search.
- `bajarArticuloTycWorker(url, fetcher)` — GET artículo.
- `parsearEfemeridesTyc(html)` — parser `<li>` `AÑO - NOMBRE.` (idéntica).
- `tokensTyc`, `alcanceTyc`, `cotejarItemsTyc` — idénticas (stopwords +
  `RE_KW_AR_EF`).
- `handlePlacasV2EfemeridesTyc(url, env, fetcher)` — orquestación
  (validación, by / AppSync, fuentes, cotejo, respuesta).
- Ruta registrada donde corresponden las de `/placas/v2/efemerides/*`
  (GET; el bloque POST no la necesita).
- Todo aditivo: cero archivos borrados, cero rutas existentes modificadas.

Tests:

- `worker/tyc-endpoint.test.mjs` — con `fetcherStub` inyectado: (a) fecha sin
  índice → 502 con mensaje de URL manual; (b) `url=` bypass → 200 con items;
  (c) pool Wikipedia stubbed es∩en con match → `cruzado` + `fuenteEs`;
  (d) curada del día → `en-banco`; (e) resto → `candidato`; (f) parser 0 →
  502. Patrón de `worker/efemerides-verificacion.test.mjs`.
- `worker/tyc-equivalencia.test.mjs` — compara comportamiento de las funciones
  inline contra `tyc-efemerides/tyc-cotejo.mjs` en un set de entradas fijas
  (tokens, alcance, estado de cotejo). Detecta deriva silenciosa entre las
  copias.
- `node --check worker/worker.js` como smoke de sintaxis.

## 5. UI: página /efemerides/

En `efemerides/index.html` + `efemerides/efemerides.mjs`:

- Nuevo bloque `<section id="tycPanel" class="copys-bloque">` **al final** del
  flujo (después de copys / banco). `hidden` hasta apretar el botón.
- Header: `CANDIDATAS TYC — REVISIÓN` · `editor-hint` "TyC sólo orienta qué
  mirar; verificá con Wikipedia/Archivo.ar antes de agregar al banco" · badge
  atribución `Fuente: TyC Sports ↗` (link al `articulo` en `meta`).
- Botón `VER CANDIDATAS TYC` (dorado, estilo `.copys-bloque button`), con
  estado "CARGANDO…" deshabilitado durante la petición.
- Input `URL del artículo TyC` siempre visible, `placeholder`:
  `https://www.tycsports.com/…/efemerides-del-…-idXXXX.html`. Se envía como
  `url=` sólo si tiene contenido.
- Totales: línea breve bajo el header cuando hay respuesta (`meta`).
- Tabla read-only (Año | Título | Alcance | Estado | Enlace). Enlace a
  Wikipedia si `cruzado` (con `fuenteEs`); `—` si no.
- Filtro: tres badges clickeables `Todas | Cruzados | En banco | Candidatos`
  (toggle simple con `display:none` en filas).
- Errores: el bloque muestra el mensaje del worker (p.ej. índice sin fecha);
  nunca interrumpe el editor, las copys ni la placa.
- El título del botón incluye la fecha del selector `#fecha` (la misma con la
  que trabaja el resto de la página).

## 6. Despliegue y verificación

1. Commit + push a `main`. Pages despliega `efemerides/` solo.
2. Respaldo del estado previo de `worker/worker.js` (git tag previo o
   `git checkout HEAD~1 -- worker/worker.js` como rollback).
3. **Deploy manual del worker**: el usuario pega el archivo completo en el
   dashboard de Cloudflare (`mm-herramientas-worker`). No hay CI para el
   worker.
4. Checklist en vivo en `https://mediamendoza.pages.dev/efemerides/`:
   - fecha 2026-11-11 + «VER CANDIDATAS TYC» → tabla con 10 hechos, badges,
     atribución (sin URL manual, AppSync no cubre nov-2026 → mostrará aviso
     salvo que pegue la URL conocida `…id771003.html`);
   - URL manual pegada → 10 hechos, 0 `cruzado` (pool es∩en no contiene
     esos hechos; resultados esperados, no bug);
   - fecha 2026-11-18 sin URL → aviso del worker con instrucción;
   - editar/ocultar hechos de la placa con el panel abierto → el editor
     sigue funcionando igual.
5. Si algo falla en el worker: rollback pegando la versión anterior en el
   dashboard; la página sigue funcional (panel muestra error, no rompe).

## 7. Riesgos y mitigaciones

- **© Clarín**: solo metadatos + ≤120 chars + atribución con link; nunca texto
  completo. Badge y footer fijos en el panel.
- **Pegar worker roto**: cambio aditivo; diff revisable antes del deploy;
  rollback trivial.
- **Admin sin auth real**: la ruta expone sólo metadatos públicos de TyC
  (mismo nivel que las rutas `/placas/v2/efemerides*` ya públicas). No agrega
  datos editoriales internos.
- **Etiqueta "sin verificar"** en todo el panel: evita que el operador asuma
  que una candidata es un hecho publicable.
- **Latencia** 3–6 s (4 fuentes): aceptable para herramienta on-demand;
  botón deshabilitado mientras carga.
- **Deriva de copias inline** (tyc-*.mjs vs worker): test de equivalencia
  (punto 4).
- **Índice congelado** en 2026-05-29: URL manual como solución operativa
  permanente hasta que TyC publique índice navegable para fechas recientes.
