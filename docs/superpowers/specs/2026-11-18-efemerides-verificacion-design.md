# EFEMÉRIDES — Placa confiable: verificación cruzada y efemérides curadas

## 1. Problema

La placa diaria de `/efemerides/` publica datos que pueden ser falsos. Caso real (18/11/2026):

> La página «18 de noviembre» de Wikipedia ES dice «1996: se despide del tenis la argentina Gabriela Sabatini».
> El artículo de Gabriela Sabatini fecha su retiro el **24/10/1996** (anuncio en el Madison Square Garden); el 18/11/1990 fue la final del WTA Tour Championships ante Mónica Seles. La entrada diaria está mal, la placa la publicó como hecho.

Verificación hecha sobre las fuentes actuales: ese hecho no existe en la página de **noviembre 18** en inglés. Además, Gemini puede agregar su propia alucinación sobre lo que la fuente dice (parafrasea, resume, «completa»). El pipeline hoy no tiene ningún guardia entre la fuente y el PNG que publica el diario. Para una audiencia real, «confiable» no puede ser «la IA lo leyó una vez».

## 2. Decisiones tomadas (brainstorming 2026-11-18)

1. **Verificación cruzada programática** (elegida por el redactor, opción «Verificación cruzada programática»): dos fuentes independientes tienen que coincidir en año y hecho; lo que no coincide se descarta.
2. **Solo cruzados + curados entran a la placa** (opción elegida): el es-only se va; días con pool chico muestran placa con menos hechos, nunca rellenada.
3. **Gemini = elige y redacta**: recibe SOLO hechos verificados, los ordena por relevancia (Argentina/LatAm primero) y redacta `resumen`/`texto_ampliado`/`alcance`/`categoria`/`icono`. El año y el hecho vienen del parseo determinístico; Gemini no puede cambiarlos (se pisan por índice + validación).
4. **Pool < 5 → placa con menos hechos + aviso** (opción elegida): 1–4 hechos como máximo 6; nunca se rellena; nunca se sirve una placa sin verificar en el camino feliz.
5. **ARCHIVO.AR como JSON curado ampliado** (aprobado): las ~30 fechas patrias oficiales de `archivo.ar/efemerides` (CC BY 4.0, actualizada 2026-11-11) + las mendocinas existentes, en el JSON curado. Esto resuelve el hueco argentino: la placa del 20/11 sale con **Vuelta de Obligado 1845** (curada, verificada a mano).

### Descartadas

- **byabbe.se / ZenQuotes / ViewBits / oanor («On this day» APIs):** todas son cosechas automáticas de Wikipedia (el yanqui: en; la ES no tiene API estructurada equivalente). No agregan verificación humana, agregan un servidor gratis sin SLA. No entran como dependencia de runtime; sí sirven como referencia externa en tests de humo offline.
- **argentina.gob.ar / capital-humano/cultura/efemerides:** noticias editoriales sueltas, no un almanaque consultable por fecha; no sirve como fuente del día.
- **elhistoriador.com.ar:** editorial serio pero sin API; uso editorial manual, no runtime.
- **Wikidata SPARQL:** estructurado y citable, pero cobertura dispareja para eventos y costo alto (queries lentas, parsing); no aporta más que es∩en para el costo.
- **Britannica «On this day»:** curaduría enciclopédica real, en inglés, sin API; scraping frágil y fuera de alcance. Uso editorial manual eventual.
- **timeanddate.com onthisday:** comercial, orientado a feriados en inglés; no mejora lo que ya tenemos.
- **Feriados AR (argentinadatos.com):** siguen fuera de la placa (ya son candidatos sin año, anclados a fecha histórica, y entran solo por AGREGAR).

## 3. Fuentes

### 3.1 Wikipedia ES — «18 de noviembre» (fuente de texto y de hechos en español)

- URL wikitext: `https://es.wikipedia.org/w/index.php?title=DD_de_MES&action=raw` (mismo patrón que hoy, pero crudo, sin HTML).
- Se parsean las secciones `Acontecimientos`, `Nacimientos`, `Fallecimientos` con regex línea a línea:
  `^\*\s*\[\[(\d{3,4})\]\]\s*[:\-–]\s*(.+)$` (tolera variantes `* [[YYYY]]: texto`, `*[[YYYY]] – texto`, espacios extra).
- Cada ítem queda `{ año, texto, seccion, fuenteEs }`. Se descartan líneas sin año (celebraciones) e ítems vacíos.
- `fuenteEs` = URL del artículo enlazado en el texto (el `[[target]]` principal, decodeURIComponent) si existe; si no, la URL de la página del día. Es el link que el editor abre con un clic.

### 3.2 Wikipedia EN — «November 18» (verificación)

- URL wikitext: `https://en.wikipedia.org/w/index.php?title=Month_DD&action=raw`.
- Mismo parser con tolerancia a los formatos en (`* [[YYYY]] &ndash; texto`, `*  1963   &ndash; texto` con triple espacio, `&[#]?\d+;|–|-`).
- Secciones equivalentes: `Events` (subdividida `===`), `Births`, `Deaths`. `Holidays`/`Observances` se ignoran.
- Fetch de ambas páginas en paralelo, header `User-Agent: MediaMendoza-Efemerides/1.0 (+https://mediamendoza.pages.dev/)`, timeout 10s c/u. Si EN no responde → verificación imposible → ver §6.

### 3.3 Match es↔en (el corazón)

- Normalización: minúsculas, sin acentos/diacríticos, sin puntuación, tokenización por `/[^a-z0-9áéíóúñ]+/u`, stopwords ES+EN embebidas (`el|la|los|de|del|en|y|a|que|se|por|para|con|un|una|the|of|and|to|in|on|at|by|for|an|from|his|her|its|was|were|is|be|that|this|with|as|it|he|she|they|who|which|after|before|during`…), tokens de ≥4 letras o números de ≥2 dígitos.
- **Match** si (a) mismo `año` (exacto) Y (b) al menos un token distintivo compartido (longitud ≥4 no-stopword, o propiedad/nombre propio Capitalizado en el texto original ES/EN).
- Cualquier match (es ↔ en) → `verificado: true`. Sin match → descartado (regla dura del §2.2).
- Tokens compartidos de solo números de 4 dígitos (el año) NO alcanzan; tiene que haber además al menos un token de letras.

Ejemplo: «1996: se despide del tenis la argentina Gabriela Sabatini» (ES) vs EN 11/18 → no hay "Sabatini" en toda la página EN → **sin match → fuera**. «1928: Se estrena Steamboat Willie…» ↔ EN «1928 – Release of … Steamboat Willie…» → comparten `1928` y `steamboat`/`willie` → **match**.

### 3.4 Curados (JSON del repo, confianza humana)

- `efemerides/efemerides-mza.json` → **se renombra** `efemerides/efemerides-curadas.json` (`git mv`) y se amplía con las efemérides patrias de ARCHIVO.AR (CC BY 4.0; cada entrada con `fuente: 'ARCHIVO.AR'`), además de las mendocinas ya curadas.
- Contenido objetivo, transcripto y verificado contra `archivo.ar/efemerides/` el 2026-11-18 (la página dice «actualizada el 11 de noviembre de 2026»). 25 entradas:

| MM-DD | año | Título |
|---|---|---|
| 02-03 | 1813 | Combate de San Lorenzo |
| 02-03 | 1852 | Batalla de Caseros |
| 02-18 | 1812 | Creación de la escarapela |
| 02-27 | 1812 | Primera izada de la bandera |
| 03-24 | 1976 | Día Nacional de la Memoria |
| 04-02 | 1982 | Día del Veterano y de los Caídos en Malvinas |
| 05-01 | 1853 | Día de la Constitución Nacional |
| 05-11 | 1813 | Día del Himno Nacional |
| 05-25 | 1810 | Revolución de Mayo |
| 06-07 | 1810 | Día del Periodista |
| 06-11 | 1580 | Fundación de Buenos Aires |
| 06-17 | 1821 | Paso a la Inmortalidad del General Güemes |
| 06-20 | 1820 | Día de la Bandera (Manuel Belgrano) |
| 07-09 | 1816 | Día de la Independencia |
| 07-26 | 1952 | Fallecimiento de Eva Perón |
| 08-17 | 1850 | Paso a la Inmortalidad del General San Martín |
| 09-11 | 1888 | Día del Maestro |
| 09-13 | 1810 | Día del Bibliotecario |
| 10-12 | 1492 | Día del Respeto a la Diversidad Cultural |
| 10-17 | 1945 | 17 de octubre de 1945 |
| 11-10 | 1834 | Día de la Tradición |
| 11-20 | 1845 | Día de la Soberanía Nacional (Vuelta de Obligado) |
| 12-10 | 1983 | Recuperación de la democracia |
| 12-11 | 1890 | Día Nacional del Tango (nace Carlos Gardel) |
| 12-11 | 1899 | Día Nacional del Tango (nace Julio De Caro) |

- **05-18 Día de la Escarapela** — fuera de este cambio: ARCHIVO.AR no le pone año («fecha del calendario oficial»); sin año no entra a la placa con el patrón actual. Se retoma aparte si el redactor decide incluirla.
- Mendocinas existentes (`01-12` 1817, `03-02` 1561, `03-20` 1861) pasan con `fuente: 'Media Mendoza'`.
- Cada entrada con los campos actuales (`año`, `titulo`, `resumen`, `texto_ampliado`, `icono`, + `fuente`). `texto_ampliado` escrito a mano por el redactor o revisión antes del commit — son 28 textos: es edición de contenido, no solo código.
- Los curados SIEMPRE son elegibles para la placa y para el banco; se marcan `curado: true`, `verificado: true`, y su `fuente` se propaga al PNG/pie tal cual.
- Badge del banco: `CURADA AR` para ARCHIVO.AR (dorado), `MENDOZA` para Media Mendoza (ya existe). Pie del PNG: fuente por hecho → ARCHIVO.AR/Media Mendoza/Wikipedia.

## 4. Pipeline del GET `/placas/v2/efemerides?fecha=…`

1. Fetch paralelo ES-raw + EN-raw (cache de 10s? no: siempre fresco; el KV ya no se sirve en camino feliz).
2. Parseo de ambas → `esItems`, `enItems`.
3. `verificados = cruzar(esItems, enItems)` — ver §3.3.
4. `curados = curadosDelDia(fecha)` se mergean en el pool (año presente requerido; los curados de nacimiento/evento entran igual que hoy por el banco/placa).
5. Si pool vacío → ver §6 (última buena o 502).
6. **Gemini «elige y redacta»** sobre la lista verificada: recibe `{ índice, año, hecho_texto }` y debe devolver `{ items: [{ índice, alcance, categoria, icono, resumen (≤100), texto_ampliado (≤240) }] }`, máximo 15, orden de mayor a menor relevancia para audiencia argentina (Argentina > LatAm > hispanohablante > mundo; hechos > fallecimientos/nacimientos simbólicos).
   - **Validación en el worker**: índice fuera de rango o repetido → descartado; `año` final = el parseado (Gemini no puede cambiarlo); `resumen` truncado a 140; faltantes (`icono`) → default `historia`.
7. Si Gemini falla o devuelve < 3 válidos: **selección determinística** — se puntúa por keywords (`argentin|mendoza|san martín|buenos aires|malvinas|mayo|obligado|patria|tucumán|güemes|sarmiento|bello|artigas` +1 c/u) y se ordenan Acontecimientos > Fallecimientos > Nacimientos; `resumen`/`texto_ampliado` = el texto fuente, truncado. Cero invención también en el camino degradado.
8. La respuesta del GET sigue siendo `{ ok:true, items, meta, candidatos }`, pero cada item ahora trae `verificado: true|false` (`verificado:false` solo para última buena), `fuente: 'Wikipedia'|'ARCHIVO.AR'|'Media Mendoza'`, y `fuenteUrl` (§3.1). `meta` agrega `verificados: n` y `solicitado: fecha`.
9. El KV escribe la placa fresca (write-through, sin servir en camino feliz) — sin cambios de namespace (`placas-v2:efemerides:v5:`).

## 5. Contrato cliente y UI

### Placa-model (`efemerides/placa-model.mjs`)

- `normalizarPayload`: pasa a exigir **≥ 1 hecho** (hoy exige 5) y expone `pocosHechos: validos.length < 5`; `verificada` lee `verificado || verificada`; `fuente` se propaga de cada item; `fuenteUrl` pasa al modelo.
- `construirModeloPlaca`: sin cambios de forma (ya dibuja 1–5 filas, el canvas reparte `altoFila`).

### Editor (`efemerides/efemerides.mjs` + `index.html`)

- Encabezado de «EDITAR LA PLACA»: si `pocosHechos`, badge ámbar `⚠ SOLO N HECHOS VERIFICADOS PARA ESTA FECHA`; la placa igual se dibuja.
- Cada fila del editor muestra link pequeño `fuente ↗` (abre `fuenteUrl` del hecho; "verificar antes de publicar"). Para curados abre archivo.ar/efemerides.
- Hechos curados se dibujan idénticos (mismo icono).

### PNG/canvas

- Sin cambios de layout. `DD MMM` solo para hechos sin año (feriado del banco) — sin regresión.

### Copys

- Sin cambios (toleran ya datos iguales o menores que hoy).

## 6. Fallos y última buena

- ES o EN no responden / HTML inesperado → verificación imposible → se sirve **última buena** (`fallback: true`, como ya está implementado) si existe; si no, 502 «No se pudo verificar la placa para esa fecha». **Nunca se genera una placa sin verificar.**
- Gemini falla → degradación determinística (§4.7), placa igual se publica con lo verificado (menos hechos si hace falta).
- `meta.fallback: true` se muestra como aviso ámbar en el editor: «PLACA DE RESPALDO — NADA CAMBIÓ, PERO VERIFICÁ ANTES DE PUBLICAR».

## 7. Tests

- Fixtures commiteados: `worker/testdata/efemerides/es-11-18.txt`, `en-11-18.txt` (las páginas reales de hoy, ~120 KB total).
- `worker/efemerides-verificacion.test.mjs`:
  - parser extrae ≥ 20 acontecimientos de ES y ≥ 15 de EN (conteos exactos contra los fixtures);
  - **matcher: Steamboat Willie 1928 empareja; «se despide del tenis … Sabatini» NO empareja (excluido); año distinto no empareja**;
  - stopwords y tokens distintivos; ítems sin año descartados;
  - handler completo con fetchers falsos: pool mixto → solo verificados; EN caído → última buena; Gemini inválido → selección determinística;
  - placa < 5 → payload con `pocosHechos: true` en el modelo cliente.
- `efemerides/placa-model.test.mjs`: nuevo caso `MIN 1` (3 hechos válidos → `ok:true`, `pocosHechos:true`); enlaces pasan al modelo.
- Suite completa verde; `node --check worker/worker.js` y `efemerides.mjs` verdes.

## 8. Alcance

**Incluido:** worker (parser, matcher, Gemini reshaped, handler, exports), fixtures, tests nuevos, cliente (normalizarPayload, aviso, link `fuente ↗`), `git mv` del JSON curado + ampliación ARCHIVO.AR + referencias (`efemerides.mjs` L421, badges, docs de producto), spec.

**Excluido:** byabbe/oanor/ZenQuotes como runtime; Wikidata; Britannica; verificación triple; copys; CRLF del worker (no normalizar); KV nuevo; persistencia de edición; ampliar curadas a otras provincias (content follow-up con el redactor).

## 9. Riesgos honestos

- Placa con **2–4 hechos** en muchas fechas (es∩en es chico). Precio ineludible de «cero hechos falsos»; el redactor puede sumar curados del banco y su wording manual.
- Wikipedia EN también puede tener errores compartidos con ES (raro pero posible, p. ej. cifras de muertos heredadas). La verificación es suficiente para el 99% de los erráticos (el caso Sabatini queda fuera), no es auditoría historiadora.
- ARCHIVO.AR es CC BY 4.0: atribución en el JSON (`fuente`) y uso editorial con cita — conforme.
- `efemerides-curadas.json` es edición manual: un error ahí es responsabilidad del redactor; la revisión del commit es el gate.

## Apéndice (2026-11-18, tras el plan)

- Los curados llegan al worker en runtime: el worker hace fetch de
  `https://mediamendoza.pages.dev/efemerides/efemerides-curadas.json`
  (mismo static que sirve Pages). Si Pages cae, el worker sigue con los
  verificados de Wikipedia; no se rompe nada. No hay JSON inlinedado ni KV.
- `discoverTyCEfemeridesUrl`, `stripHtmlForEfemerides`, `wikipediaDateUrl` y
  `discoverWikipediaDateUrl` quedan sin uso en el handler pero NO se borran en
  este cambio (hunk mínimo; borrarlas es un follow-up aparte).
- `efemerides-mza.json` → `efemerides-curadas.json` (git mv): llegan los 25
  hechos ARCHIVO.AR verificados a mano (cita: ARCHIVO.AR, Efemérides
  argentinas, archivo.ar/efemerides/, actualizada 11/11/2026, CC BY 4.0).
- Gemini «elige y redacta»: la lista del pool se arma con
  `{indice, anio, hecho, fuente}`; `normalizarItemsGeminiEF` rechaza índices
  inválidos/repetidos y `itemPlacaDesdePool` pisa año/texto con los parseados.
  Si Gemini devuelve <3 ítems, gana `seleccionDeterministicaEF` (score:
  keywords AR +3, acontecimiento +2, fallecimiento +1).
- KV (`PLACAS_V2_EF_CACHE_PREFIX`) se sigue escribiendo pero YA NO se sirve en
  el camino feliz: solo como «última buena» con `meta.fallback: true`.
- Mínimo de la placa: 1 hecho (`MIN_ITEMS`); el panel avisa «SOLO N HECHOS
  VERIFICADOS» y, si viene de respaldo, «PLACA DE RESPALDO — VERIFICÁ ANTES DE
  PUBLICAR».
