# Efemérides: sincronizador TyC Sports con cotejo verificado (prototipo)

## 1. Problema y objetivo

TyC Sports publica (desde ~junio 2025) una efeméride diaria con fuerte foco
argentino («Efemérides del D de mes: qué se conmemora HOY»), que mezcla
acontecimientos deportivos e históricos, con textos redactados y créditos
TELAM. Para Media Mendoza eso es valioso como **señal de selección** (qué vale
realzar ese día), pero no como fuente de verdad (texto ajeno, foco deportivo,
sin verificación cruzada).

Objetivo del prototipo: un script que baja el artículo TyC de uno o varios
días, extrae los hechos en formato determinista, los **coteja** contra el pool
Wikipedia verificado es∩en (que ya construimos) y contra `efemerides-curadas.json`,
y entrega candidatas + informe para que un humano decida qué se agrega al banco.

Fuera de alcance: producción (no toca worker/KV/placa), backfill histórico
completo, automatización por cron.

## 2. Fuentes

- **Artículo TyC**: HTML server-side (sin JS necesario). Hechos en
  `<ul><li>`; formato visible `AÑO - NOMBRE.` + texto libre; los
  conmemorativos del día van sin año y se ignoran. Robots.txt de
  tycsports.com NO bloquea `/interes-general/efemerides/`; solo bloquea
  `/nota/`, `/noticias/`, `/amp/`, `/*_aplicaster`, `/*_popup` y similares.
- **Índice de discovery (AppSync GraphQL público de su propio buscador)**:
  `POST https://xke6pkwdfrhfvirq5lt5br2m4m.appsync-api.us-east-1.amazonaws.com/graphql`
  con key pública (en el JS de su buscador):
  `query { search(hitsPerPage: N, searchAbout: "efemerides") { hits { order_date title url } } }`
  Tope efectivo 100 resultados; `page>0` vacío; cobertura desde ~2025-06-05.
- **Pool verificado y curadas del repo**: `worker/efemerides-verificacion`
  (`parseEfemeridesWikitexto`, `emparejarEsEn`) y
  `efemerides/efemerides-curadas.json`.

## 3. Estructura del módulo

```
tyc-efemerides/
  tyc-sync.mjs       # CLI: --fecha | --desde/--hasta | --url; orquesta
  tyc-parse.mjs      # parser puro: HTML -> { año, titulo, texto }[]
  tyc-cotejo.mjs     # cotejo contra pool y curadas
  tyc-client.mjs     # red: GET artículo + AppSync search (timeout 10s, UA propia)
  tyc-sync.test.mjs  # tests
  fixtures/          # HTML de 2 artículos reales (2024-11-18, 2026-05-29)
  candidatas-ejemplo-18-11-2026.json  # ejemplo commiteado
```

## 4. CLI

- `node tyc-efemerides/tyc-sync.mjs --fecha=2026-11-18`
- `node tyc-efemerides/tyc-sync.mjs --desde=2026-06-01 --hasta=2026-11-18`
- `node tyc-efemerides/tyc-sync.mjs --fecha=2026-11-18 --url=https://…`
- Sin `--fecha` → hoy. Barrido con `--desde/--hasta`: itera solo las fechas
  con artículo en el índice AppSync (aviso explícito si el rango se corta en
  el tope de 100).

## 5. Flujo por día

1. Resolver URL: hit del AppSync con la fecha; si no está → error con
  instrucción `--url` (sin adivinar slugs).
2. GET artículo (UA `MediaMendoza-Efemerides-TycSync/1.0`, timeout 10s).
3. Parse `<li>`: año 4 dígitos + `-`/`—`/`.` + nombre en mayúsculas (mín.
  2 caracteres) + texto; `<li>` sin año → se ignora. Decodificar entidades.
4. Cotejo:
   - Pool es∩en del mismo MM-DD (worker: fetch Wikipedia raw → parse →
     `emparejarEsEn`): mismo año + token compartido ≥4 letras → `cruzado`.
   - `efemerides-curadas.json`: año igual + título/tópico similar (token
     común o alias del nombre) → `en-banco`.
   - Resto → `candidato`.
   - `alcance` por la regex nacional del verificador (argent|mendoza|…).
5. Salidas.

## 6. Salidas

- Salidas: `tyc-efemerides/out/candidatas/<fecha>.json` donde `<fecha>` es
  ISO `YYYY-MM-DD`, y `tyc-efemerides/out/informes/<fecha>.md`.
- `candidatas/YYYY-MM-DD.json`:
  `{ fecha, fuente: "TyC Sports", articulo (URL), obtenido (ISO), items[] }`,
  cada item `{ año, titulo, texto, estado, alcance }`. Estado ∈
  `cruzado | en-banco | candidato`.
- `informes/YYYY-MM-DD.md`: totales, tabla por estado con año/título/estado,
  links de los cruzados al pool (fuenteEs). Nunca se copia texto extenso de TyC
  al informe (solo el año, el nombre y hasta ~120 caracteres del hecho como
  referencia; el resto se lee en la fuente).
- Los archivos de barrido real son gitignored; solo se commitea el ejemplo
  `candidatas-ejemplo-18-11-2026.json`.

## 7. Tests

- Parser contra 2 fixtures reales: 18-11-2024 (id619733) y 29-05-2026
  (id733288) — cantidad de items, años detectados, conmemorativos ignorados.
- Cotejo sintético: 1845 Obligado → `cruzado`; año+token de curada
  existente → `en-banco`; hecho sin match → `candidato`.
- CLI con fetcher inyectado (sin red): barrido con rango en tope de 100,
  salida esperada por día, exit 2 si parse devuelve 0 (posible cambio de
  estructura).

## 8. Riesgos y mitigaciones

- Estructura HTML cambia → tests con fixtures + exit 2 con mensaje claro.
- Límite 100 del índice → aviso; no es archivo histórico confiable.
- Contenido TyC © Clarín: solo metadatos (año, nombre, URL, resumen corto) y
  cotejo propio; jamás copiar redacción. Atribución en salidas.
- Politeness: 1 request por artículo + delay 300ms en barrido; UA propio
  identificable; sin reintentos agresivos.