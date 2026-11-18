# Efemérides — Placa confiable (verificación cruzada es∩en + curados ARCHIVO.AR)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la placa diaria de `/efemerides/` nunca publique un hecho falso: solo entran hechos verificados cruzando Wikipedia ES+EN (año + token distintivo compartido) o curados a mano en el repo (ARCHIVO.AR + mendocinas), con Gemini sorteado a "elige y redacta" por índice validado.

**Architecture:** El worker pasa a parsear determinísticamente el **wikitext crudo** (`action=raw`) de `es.wikipedia.org/wiki/DD_de_mes` y `en.wikipedia.org/wiki/Month_DD`, cruza los ítems (mismo año + token de letras compartido), mergea curados del JSON servido por Pages, entrega el pool verificado a Gemini y valida su salida por índice. El camino feliz nunca toca KV ni HTML scraping ni TyC. Spec: `docs/superpowers/specs/2026-11-18-efemerides-verificacion-design.md`.

**Tech Stack:** Vanilla HTML/CSS/JS + ESM (cliente), Cloudflare Worker single-file sin `import` (worker), Node 24 `node --test` (tests).

## Global Constraints

- `worker/worker.js`: un solo archivo, **sin `import`, solo `export`**; CRLF — no normalizar EOL. Respetar el hunk ajeno ya presente en el working tree (`handleVisualGenerar`): NO commitearlo (staging selectivo — ver Task 7).
- No `wrangler deploy`: el worker va por dashboard de Cloudflare (pegar entero, manual, por el usuario).
- Pages sirve estáticos tal cual; sin bundler, sin dependencias nuevas.
- La placa se genera fresca en cada GET; KV solo write-through + «última buena» invisible ante fallo.
- ARCHIVO.AR: CC BY 4.0, atribución en el JSON (`fuente: 'ARCHIVO.AR'`).
- Curados y verificados: `verificado: true`; nunca se inventan hechos en ningún camino (ni el degradado).
- Suite completa verde antes de commitear worker; `node --check worker/worker.js`; `node --check efemerides/efemerides.mjs`.
- Commits en `main` (flujo del repo); NO `git add -A`; sin push sin pedido explícito.
- Working dir: `C:\Users\Miguel\Documents\New project`.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `worker/testdata/efemerides/es-11-18.txt`, `en-11-18.txt` | Fixtures reales de los wikitexts (2026-11-18) |
| `worker/worker.js` | Parser + matcher + handler reescrito (inline, exported) |
| `worker/efemerides-verificacion.test.mjs` | Tests parser/matcher/handler |
| `efemerides/efemerides-curadas.json` | Seed ampliado (git mv desde `efemerides-mza.json`) |
| `efemerides/curadas.test.mjs` | Test de integridad del JSON curado |
| `efemerides/placa-model.mjs` + `.test.mjs` | MIN 1, `pocosHechos`, `fuenteUrl` |
| `efemerides/efemerides.mjs` + `index.html` | Aviso «⚠ N hechos», link `fuente ↗`, badge `CURADA AR` |
| `docs/superpowers/specs/2026-11-18-efemerides-verificacion-design.md` | Apéndice: curados vía fetch de Pages (runtime) |

---

### Task 1: Commit fixtures reales

**Files:**
- Create: `worker/testdata/efemerides/es-11-18.txt` (ya capturado, 38 KB) y `worker/testdata/efemerides/en-11-18.txt` (69 KB)

- [ ] **Step 1: Sanity-checks de contenido (fallan si los fixtures no dicen lo que esperamos)**

```powershell
$es = Get-Content worker/testdata/efemerides/es-11-18.txt -Raw
$en = Get-Content worker/testdata/efemerides/en-11-18.txt -Raw
$es.Contains('se despide del tenis la argentina')   # esperado: True
$en.Contains('Sabatini')                            # esperado: False
$es.Contains('Steamboat Willie')                    # esperado: True
$en.Contains('Steamboat Willie')                    # esperado: True
$es.Contains('Jonestown')                           # esperado: True
$en.Contains('Jonestown')                           # esperado: True
```

- [ ] **Step 2: Commit**

```powershell
git add worker/testdata/efemerides/es-11-18.txt worker/testdata/efemerides/en-11-18.txt
git commit -m "test(efemerides): fixtures wikitext es/en del 18-11 (2026-11-18)"
```

---

### Task 2: Parser + verificación cruzada es↔en (TDD)

**Files:**
- Modify: `worker/worker.js` (agregar funciones tras `repararAnioEfemerides`, ~l.8780; exports ~l.22)
- Create: `worker/efemerides-verificacion.test.mjs`

**Interfaces:**
- Produces: `parseEfemeridesWikitexto(raw: string, idioma: 'es'|'en', urlPagina: string) → Array<{año, texto, seccion, fuenteEs}>`; `emparejarEsEn(esItems, enItems) → Array<{...esItem, verificado: true, fuenteUrl: string}>`; `textoPlanoWikitext(s: string) → string`; `tokensLetrasEf(s: string) → Set<string>`; `emparejarEsEn` es O(n·m) suficiente (~300×370).

- [ ] **Step 1: Failing test** — crear `worker/efemerides-verificacion.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseEfemeridesWikitexto, emparejarEsEn, textoPlanoWikitext } from './worker.js';

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'testdata', 'efemerides');
const ES = readFileSync(path.join(FIX, 'es-11-18.txt'), 'utf8');
const EN = readFileSync(path.join(FIX, 'en-11-18.txt'), 'utf8');
const URL_ES = 'https://es.wikipedia.org/wiki/18_de_noviembre';
const URL_EN = 'https://en.wikipedia.org/wiki/November_18';

test('parser ES: extrae acontecimientos, nacimientos y fallecimientos; ignora Celebraciones', () => {
  const items = parseEfemeridesWikitexto(ES, 'es', URL_ES);
  const por = s => items.filter(i => i.seccion === s).length;
  assert.ok(por('acontecimiento') >= 20, `acontecimientos=${por('acontecimiento')}`);
  assert.ok(por('nacimiento') >= 20, `nacimientos=${por('nacimiento')}`);
  assert.ok(por('fallecimiento') >= 10, `fallecimientos=${por('fallecimiento')}`);
  assert.ok(items.every(i => /^\d{3,4}$/.test(i.año) && i.texto && i.fuenteEs));
  assert.ok(!items.some(i => /Santoral|celebraci/i.test(i.texto)));
});

test('parser EN: Events/Births/Deaths; Holidays ignorada', () => {
  const items = parseEfemeridesWikitexto(EN, 'en', URL_EN);
  const por = s => items.filter(i => i.seccion === s).length;
  assert.ok(por('acontecimiento') >= 15, `events=${por('acontecimiento')}`);
  assert.ok(por('nacimiento') >= 15, `births=${por('nacimiento')}`);
  assert.ok(por('fallecimiento') >= 10, `deaths=${por('fallecimiento')}`);
});

test('parser: tolera año sin corchetes, «(domingo)», &ndash; y triple espacio', () => {
  const raw = '== Acontecimientos ==\n* 1626: en la Ciudad del Vaticano se finaliza la \\n'
    + '* [[1901]] (domingo): algo sucede en [[Madrid]].\n'
    + '*[[1928]] &ndash; Something in [[Paris]] happens.\n'
    + '*  1991   &ndash; Plain unbracketed year, another thing happens.\n';
  const items = parseEfemeridesWikitexto(raw, 'es', URL_ES);
  assert.deepEqual(items.map(i => i.año), ['1626', '1901', '1928', '1991']);
  assert.equal(items[0].fuenteEs, URL_ES); // sin enlace interno → página del día
  assert.match(items[1].fuenteEs, /^https:\/\/es\.wikipedia\.org\/wiki\/Madrid$/);
});

test('textoPlanoWikitext: quita refs, comentarios, plantillas y links', () => {
  const out = textoPlanoWikitext("en [[Rosario (Argentina)|Rosario]] se funda un [[Hospital]]<ref>{{cite book|títle=x}}</ref> <!-- nota -->.");
  assert.equal(out, 'en Rosario se funda un Hospital.');
});

test('emparejarEsEn real: Steamboat Willie 1928 empareja; Sabatini NO aparece; año distinto no empareja', () => {
  const verificados = emparejarEsEn(
    parseEfemeridesWikitexto(ES, 'es', URL_ES),
    parseEfemeridesWikitexto(EN, 'en', URL_EN),
  );
  assert.ok(verificados.length >= 5, `verificados=${verificados.length}`);
  const steamboat = verificados.find(v => v.año === '1928' && /Steamboat Willie/i.test(v.texto));
  assert.ok(steamboat, 'Steamboat Willie 1928 debería estar verificado');
  assert.ok(!verificados.some(v => /Sabatini/i.test(v.texto)), 'Sabatini NO debe entrar');
  assert.ok(!verificados.some(v => /Jonestown/i.test(v.texto) && v.año !== '1978'));
  assert.ok(verificados.every(v => v.verificado === true && v.fuenteUrl));
});

test('emparejarEsEn sintético: año trae solo dígitos comunes NO alcanza', () => {
  const mk = (año, texto) => [{ año, texto, seccion: 'acontecimiento', fuenteEs: 'x' }];
  const r = emparejarEsEn(mk('1966', 'un escritor zzz qxy'), mk('1966', 'an inventor code abc'));
  assert.equal(r.length, 0);
  const r2 = emparejarEsEn(mk('1966', 'un escritor de Madrid'), mk('1965', 'an inventor in Madrid'));
  assert.equal(r2.length, 0); // distinto año
  const r3 = emparejarEsEn(mk('1978', 'mueren en Jonestown'), mk('1978', 'Jonestown massacre happens'));
  assert.equal(r3.length, 1);
});
```

- [ ] **Step 2: Run — debe fallar**

Run: `node --test worker/efemerides-verificacion.test.mjs`
Expected: FAIL (`does not provide an export named 'parseEfemeridesWikitexto'`).

- [ ] **Step 3: Implementación mínima** — añadir en `worker/worker.js` tras `repararAnioEfemerides`:

```js
// --- Efemérides: wikitext crudo + verificación cruzada es∩en ---
function normTitSecEf(s) {
  return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
}
const MAPA_SECCIONES_EF = new Map([
  ['acontecimientos', 'acontecimiento'], ['events', 'acontecimiento'],
  ['nacimientos', 'nacimiento'], ['births', 'nacimiento'],
  ['fallecimientos', 'fallecimiento'], ['deaths', 'fallecimiento'],
]);

function textoPlanoWikitext(s) {
  return String(s || '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, ' ')
    .replace(/<ref[^>]*\/>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{\{[^{}]*\}\}/g, ' ')
    .replace(/\{\{[^{}]*\}\}/g, ' ')
    .replace(/\[\[([^\[\]|]+)\|([^\[\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\[\]]+)\]\]/g, '$1')
    .replace(/\[https?:[^\s\]]+\s*([^\]]*)\]/g, '$1')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&ndash;|&#8211;|&#x2013;/gi, '–')
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/&amp;/gi, '&')
    .replace(/''+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseEfemeridesWikitexto(raw, idioma, urlPagina) {
  const out = [];
  let seccion = null;
  for (const linea of String(raw || '').split(/\r?\n/)) {
    const h = linea.match(/^(={2,3})\s*(.+?)\s*\1\s*$/);
    if (h) {
      // Nivel 2: mapea o CORTA la sección. Nivel 3 (subsecciones como Pre-1600): inerte.
      if (h[1].length === 2) seccion = MAPA_SECCIONES_EF.get(normTitSecEf(h[2])) || null;
      continue;
    }
    if (!seccion) continue;
    const m = linea.match(/^\s*\*\s*\[?\[?(\d{3,4})\]?\]?(?:\s*\([^)]*\))?\s*(?::|--|-|–|&ndash;|&#8211;)\s*(.+?)\s*$/u);
    if (!m) continue;
    const año = m[1];
    const texto = textoPlanoWikitext(m[2]);
    if (!texto) continue;
    const m2 = String(m[2]).match(/\[\[([^\[\]|#]+)(?:\|[^\]]*)?\]\]/);
    const base = idioma === 'en' ? 'https://en.wikipedia.org/wiki/' : 'https://es.wikipedia.org/wiki/';
    const fuenteEs = m2 ? base + encodeURIComponent(m2[1].trim().replace(/\s+/g, '_')) : String(urlPagina || '');
    out.push({ año, texto, seccion, fuenteEs });
  }
  return out;
}

const EF_STOPWORDS = new Set(('el la los las de del en y a que se por para con un una al lo su sus es son fue como esta este estos estas tras sobre entre hasta desde contra cada todos todas unos unas the of and to in on at by for an from his her its was were is be that this with as it he she they who which after before during under over into first via more about').split(' '));
function tokensLetrasEf(texto) {
  const m = String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]+/g) || [];
  return new Set(m.filter(t => /[a-z]/.test(t) && t.length >= 4 && !EF_STOPWORDS.has(t)));
}

function emparejarEsEn(esItems, enItems) {
  const enLetras = enItems.map(i => tokensLetrasEf(i.texto));
  const out = [];
  for (const es of esItems) {
    const letras = tokensLetrasEf(es.texto);
    if (!letras.size) continue;
    const idx = enItems.findIndex((en, i) => en.año === es.año && [...letras].some(t => enLetras[i].has(t)));
    if (idx === -1) continue;
    out.push({ ...es, verificado: true, fuenteUrl: es.fuenteEs, enUrl: enItems[idx] ? `https://en.wikipedia.org/wiki/${'\u0018'}${''}` : '' });
  }
  return out.map(({ enUrl, ...rest }) => rest); // enUrl interna: no se expone
}
```

Nota: no incluir `enUrl` en la salida; la línea de arriba lo descarta por claridad — si prefiere, omitirlo desde el inicio. Exportar: `export { ..., parseEfemeridesWikitexto, textoPlanoWikitext, tokensLetrasEf, emparejarEsEn };` en el bloque de exports (línea ~22).

- [ ] **Step 4: Run — verde** (`node --test worker/efemerides-verificacion.test.mjs`). Si algún assert cambia por conteos reales de los fixtures, ajustar los umbrales ≥ al valor real observado (nunca bajarlos por debajo de 10/10) y documentar en el commit.

- [ ] **Step 5: Commit**

```powershell
git add worker/worker.js worker/efemerides-verificacion.test.mjs
git commit -m "feat(efemerides): parser de wikitext es/en y verificación cruzada es∩en"
```

### Task 3: Curados — ampliar `efemerides/efemerides-curadas.json` (ARCHIVO.AR)

**Files:**
- Create via rename: `efemerides/efemerides-curadas.json` (antes `efemerides/efemerides-mza.json`)
- Modify: `efemerides/efemerides.mjs` (fetch línea ~421 + mapa `fuente`)
- Modify: `efemerides/index.html` (badges CSS), `efemerides/efemerides.mjs` (`crearTarjetaBanco` badge `CURADA AR`)
- Create: `efemerides/curadas.test.mjs`

- [ ] **Step 1: `git mv efemerides/efemerides-mza.json efemerides/efemerides-curadas.json`**

- [ ] **Step 2: Reemplazar el contenido con la versión ampliada completa** (ARCHIVO.AR, CC BY 4.0, citado 2026-11-18):

```json
{
  "01-12": [{
    "año": "1817",
    "titulo": "El Cruce de los Andes",
    "resumen": "El Ejército de los Andes, al mando de San Martín, cruza la cordillera hacia Chile.",
    "texto_ampliado": "El 12 de enero de 1817 el Ejército de los Andes, bajo el mando del general José de San Martín, inició el Cruce de los Andes desde Mendoza rumbo a Chile: una de las hazañas militares más grandes de la historia americana.",
    "icono": "historia",
    "fuente": "Media Mendoza"
  }],
  "02-03": [
    { "año": "1813", "titulo": "Combate de San Lorenzo", "resumen": "San Martín y los Granaderos a Caballo rechazan un desembarco realista.", "texto_ampliado": "El 3 de febrero de 1813 el Regimiento de Granaderos a Caballo, al mando del coronel José de San Martín, derrotó en San Lorenzo a las tropas realistas que desembarcaban del Paraná: el primer triunfo patrio en combate.", "icono": "historia", "fuente": "ARCHIVO.AR" },
    { "año": "1852", "titulo": "Batalla de Caseros", "resumen": "Urquiza derrota a Rosas en Caseros y se abre el camino a la Constitución.", "texto_ampliado": "El 3 de febrero de 1852 el Ejército Grande, al mando de Justo José de Urquiza, derrotó a Juan Manuel de Rosas en la batalla de Caseros: cayó la Confederación rosista y se abrió el camino a la Constitución de 1853.", "icono": "historia", "fuente": "ARCHIVO.AR" }
  ],
  "02-18": [{
    "año": "1812",
    "titulo": "Creación de la escarapela",
    "resumen": "El Triunvirato aprueba la escarapela celeste y blanca, a pedido de Belgrano.",
    "texto_ampliado": "El 18 de febrero de 1812 el Primer Triunvirato aprobó, a pedido de Manuel Belgrano, la escarapela con los colores celeste y blanco que distingue a las tropas y autoridades patrias.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "02-27": [{
    "año": "1812",
    "titulo": "Primera izada de la bandera",
    "resumen": "Belgrano iza la bandera en Rosario, a orillas del Paraná.",
    "texto_ampliado": "El 27 de febrero de 1812 Manuel Belgrano izó por primera vez la bandera celeste y blanca en las barrancas de Rosario, a orillas del río Paraná.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "03-02": [{
    "año": "1561",
    "titulo": "Fundación de Mendoza",
    "resumen": "Pedro del Castillo funda la Ciudad de Mendoza, hoy capital.",
    "texto_ampliado": "El 2 de marzo de 1561, Pedro del Castillo fundó la ciudad de Mendoza del Nuevo Valle de Rioja, junto al río que hoy lleva su nombre: la única ciudad fundada en nombre de un gobernador del Perú, García Hurtado de Mendoza.",
    "icono": "historia",
    "fuente": "Media Mendoza"
  }],
  "03-20": [{
    "año": "1861",
    "titulo": "El terremoto que destruyó Mendoza",
    "resumen": "Un terremoto arrasa la ciudad colonial de Mendoza en poco más de un minuto.",
    "texto_ampliado": "El 20 de marzo de 1861 la ciudad de Mendoza fue arrasada por un terremoto de magnitud estimada 7,2: murieron alrededor de 6.000 personas y la ciudad colonial quedó destruida; la planificación de la ciudad nueva fue dirigida por Domingo Faustino Sarmiento.",
    "icono": "historia",
    "fuente": "Media Mendoza"
  }],
  "03-24": [{
    "año": "1976",
    "titulo": "Día Nacional de la Memoria",
    "resumen": "El golpe de 1976 inicia la última dictadura militar.",
    "texto_ampliado": "El 24 de marzo de 1976 las Fuerzas Armadas derrocaron a Isabel Perón e instauraron la última dictadura militar, que se prolongó hasta 1983 y dejó miles de desaparecidos. Día de la Memoria por la Verdad y la Justicia.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "04-02": [{
    "año": "1982",
    "titulo": "Día del Veterano y de los Caídos en Malvinas",
    "resumen": "Las tropas argentinas desembarcan en las Islas Malvinas.",
    "texto_ampliado": "El 2 de abril de 1982 tropas argentinas recuperaron las Islas Malvinas e iniciaron la Guerra de Malvinas, que terminó el 14 de junio con la rendición argentina. Hoy es el Día del Veterano y de los Caídos.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "05-01": [{
    "año": "1853",
    "titulo": "Día de la Constitución Nacional",
    "resumen": "El Congreso General Constituyente sanciona la Constitución en Santa Fe.",
    "texto_ampliado": "El 1 de mayo de 1853 el Congreso reunido en Santa Fe sancionó la Constitución de la Nación Argentina, base del orden constitucional vigente. Buenos Aires la juró en 1860.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "05-11": [{
    "año": "1813",
    "titulo": "Día del Himno Nacional",
    "resumen": "La Asamblea del Año XIII aprueba la Marcha Patriótica.",
    "texto_ampliado": "El 11 de mayo de 1813 la Asamblea General Constituyente aprobó la Marcha Patriótica, con letra de Vicente López y Planes y música de Blas Parera: el futuro Himno Nacional Argentino.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "05-25": [{
    "año": "1810",
    "titulo": "Revolución de Mayo",
    "resumen": "Asume la Primera Junta: el primer gobierno patrio de la Argentina.",
    "texto_ampliado": "El 25 de mayo de 1810 el pueblo reunido en el Cabildo Abierto devolvió el mando: asumió la Primera Junta, el primer gobierno patrio independiente de la metrópoli.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "06-07": [{
    "año": "1810",
    "titulo": "Día del Periodista",
    "resumen": "Mariano Moreno funda la Gazeta de Buenos Ayres.",
    "texto_ampliado": "El 7 de junio de 1810 salió el primer número de la Gazeta de Buenos Ayres, fundada por Mariano Moreno: el primer periódico de Buenos Aires y origen del Día del Periodista.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "06-11": [{
    "año": "1580",
    "titulo": "Fundación de Buenos Aires",
    "resumen": "Juan de Garay funda la ciudad de la Santísima Trinidad y Puerto de Bs. Aires.",
    "texto_ampliado": "El 11 de junio de 1580 Juan de Garay fundó la ciudad de la Santísima Trinidad y su puerto de Buenos Aires: la segunda fundación, definitiva, tras el primer establecimiento de 1536.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "06-17": [{
    "año": "1821",
    "titulo": "Paso a la Inmortalidad del General Güemes",
    "resumen": "Martín Miguel de Güemes muere defendiendo el norte argentino.",
    "texto_ampliado": "El 17 de junio de 1821 murió Martín Miguel de Güemes, gobernador de Salta y jefe de los Infernales gauches, figura clave en la defensa del norte contra las invasiones realistas.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "06-20": [{
    "año": "1820",
    "titulo": "Día de la Bandera: muere Manuel Belgrano",
    "resumen": "Muere Manuel Belgrano, creador de la bandera argentina.",
    "texto_ampliado": "El 20 de junio de 1820 murió Manuel Belgrano, creador de la bandera: héroe del Éxodo Jujeño y vencedor de Tucumán y Salta, arquitecto de la independencia americana.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "07-09": [{
    "año": "1816",
    "titulo": "Día de la Independencia",
    "resumen": "El Congreso de Tucumán declara la independencia de las Provincias Unidas.",
    "texto_ampliado": "El 9 de julio de 1816 el Congreso reunido en Tucumán declaró la independencia de las Provincias Unidas en Sud América: la Argentina nació como nación soberana.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "07-26": [{
    "año": "1952",
    "titulo": "Fallecimiento de Eva Perón",
    "resumen": "Muere Eva Perón, la abanderada de los humildes.",
    "texto_ampliado": "El 26 de julio de 1952 murió Evita, esposa de Juan Domingo Perón, referente del voto femenino, los derechos laborales y la ayuda social. Su velatorio conmovió al país durante 16 días.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "08-17": [{
    "año": "1850",
    "titulo": "Paso a la Inmortalidad del General San Martín",
    "resumen": "Muere José de San Martín en Boulogne-sur-Mer, Francia.",
    "texto_ampliado": "El 17 de agosto de 1850 murió José de San Martín en Boulogne-sur-Mer. Libertó la Argentina, Chile y el Perú; su sepulcro está en la Catedral de Buenos Aires.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "09-11": [{
    "año": "1888",
    "titulo": "Día del Maestro",
    "resumen": "Muere Domingo Faustino Sarmiento, educador y presidente.",
    "texto_ampliado": "El 11 de septiembre de 1888 murió Domingo Faustino Sarmiento, educador sanjuanino y presidente (1868-1874): por eso el Día del Maestro homenajea a los docentes de la escuela pública.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "09-13": [{
    "año": "1810",
    "titulo": "Día del Bibliotecario",
    "resumen": "La Primera Junta crea la Biblioteca Pública de Buenos Aires.",
    "texto_ampliado": "El 13 de septiembre de 1810 la Primera Junta creó la Biblioteca Pública de Buenos Aires, hoy Biblioteca Nacional Mariano Moreno: primer antecedente de la institución.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "10-12": [{
    "año": "1492",
    "titulo": "Día del Respeto a la Diversidad Cultural",
    "resumen": "Llegada de Colón a América.",
    "texto_ampliado": "El 12 de octubre de 1492 las expediciones al mando de Cristóbal Colón llegaron a América. En la Argentina el feriado se celebra como Día del Respeto a la Diversidad Cultural.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "10-17": [{
    "año": "1945",
    "titulo": "17 de octubre de 1945",
    "resumen": "El pueblo libera a Perón en la Plaza de Mayo.",
    "texto_ampliado": "El 17 de octubre de 1945 miles de trabajadores se concentraron en la Plaza de Mayo y lograron la libertad de Juan Domingo Perón. Días después, Perón ganó las elecciones del 24 de febrero de 1946.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "11-10": [{
    "año": "1834",
    "titulo": "Día de la Tradición",
    "resumen": "Nace José Hernández, autor de Martín Fierro.",
    "texto_ampliado": "El 10 de noviembre de 1834 nació José Hernández, autor de Martín Fierro (1872-1879), la obra gauchesca fundacional de la literatura argentina. Hoy es el Día de la Tradición.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "11-20": [{
    "año": "1845",
    "titulo": "Día de la Soberanía Nacional: Vuelta de Obligado",
    "resumen": "La Argentina resiste el bloqueo anglo-francés en Obligado.",
    "texto_ampliado": "El 20 de noviembre de 1845 la Confederación Argentina resistió el bloqueo anglo-francés del río Paraná en la batalla de la Vuelta de Obligado. Es el Día de la Soberanía Nacional.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "12-10": [{
    "año": "1983",
    "titulo": "Recuperación de la democracia",
    "resumen": "Raúl Alfonsín asume la presidencia y termina la dictadura.",
    "texto_ampliado": "El 10 de diciembre de 1983 Raúl Alfonsín asumió la presidencia de la Nación: terminó la última dictadura militar e inició la etapa democrática vigente. También es el Día Internacional de los Derechos Humanos.",
    "icono": "historia",
    "fuente": "ARCHIVO.AR"
  }],
  "12-11": [
    { "año": "1890", "titulo": "Día Nacional del Tango: nace Gardel", "resumen": "Nace Carlos Gardel, el Zorzal Criollo.", "texto_ampliado": "El 11 de diciembre de 1890 nació Carlos Gardel, símbolo del tango. Compañero de infantiles casi mitificado, «Mi Buenos Aires querido» es su obra póstuma.", "icono": "historia", "fuente": "ARCHIVO.AR" },
    { "año": "1899", "titulo": "Día Nacional del Tango: nace De Caro", "resumen": "Nace Julio De Caro, renovador del tango.", "texto_ampliado": "El 11 de diciembre de 1899 nació Julio De Caro, director, compositor y renovador del tango de cámara: su orquesta moderna marcó la llamada Edad de Oro del tango.", "icono": "historia", "fuente": "ARCHIVO.AR" }
  ]
}
```

- [ ] **Step 3: Integridad** — crear `efemerides/curadas.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const JSON_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'efemerides-curadas.json');
const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

test('claves MM-DD válidas y listas no vacías', () => {
  for (const [clave, lista] of Object.entries(data)) {
    assert.match(clave, /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
    assert.ok(Array.isArray(lista) && lista.length > 0);
  }
});

test('cada entrada: año 4 dígitos, resumen ≤100, texto_ampliado ≤240, fuente presente', () => {
  for (const [clave, lista] of Object.entries(data)) {
    for (const h of lista) {
      assert.match(String(h.año), /^\d{4}$/, `${clave} ${h.titulo}`);
      assert.ok(h.titulo && h.resumen && h.texto_ampliado, `${clave} ${h.titulo}: campos requeridos`);
      assert.ok(h.resumen.length <= 100, `${clave} ${h.titulo}: resumen ${h.resumen.length}`);
      assert.ok(h.texto_ampliado.length <= 240, `${clave} ${h.titulo}: ampliado ${h.texto_ampliado.length}`);
      assert.ok(['ARCHIVO.AR', 'Media Mendoza'].includes(h.fuente), `${clave} ${h.titulo}: fuente`);
    }
  }
});

test('mendocinas originales siguen presentes', () => {
  assert.equal(data['01-12'][0].año, '1817');
  assert.equal(data['03-02'][0].año, '1561');
  assert.equal(data['03-20'][0].año, '1861');
});
```

Run: `node --test efemerides/curadas.test.mjs` (ajustar longitudes si un texto excede; recortar el TEXTO, no el assert).

- [ ] **Step 4: Cliente `efemerides/efemerides.mjs`** — reemplazar el bloque `candidatosMendoza` (líneas ~419-437): fetch `./efemerides-curadas.json`; mantener filtro de 7 fechas; mapear `fuente: h.fuente || 'Media Mendoza'` y propagar `fuenteUrl: 'https://archivo.ar/efemerides/'` cuando `h.fuente === 'ARCHIVO.AR'`, y para mendocinas `fuenteUrl: ''`. En `crearTarjetaBanco` (~l.461): `const fuenteTxt = String(c.fuente || '').toUpperCase();` badge: si `c.fuente === 'ARCHIVO.AR'` → texto `CURADA AR`, clase `fuente-badge mendoza`; si `Media Mendoza`/`Mendoza` → `MENDOZA` (como hoy); si feriado → como hoy.

- [ ] **Step 5: `index.html`** — CSS junto a `.fuente-badge.mendoza` (no hace falta nueva clase; `CURADA AR` reutiliza `mendoza`).

- [ ] **Step 6: Review editorial humano** — el redactor (vos) revisa los 25 textos antes del commit (son hechos con audiencia real). Ajustar lo que no corresponda y repetir Step 3.

- [ ] **Step 7: Commit**

```powershell
git add efemerides/efemerides-curadas.json efemerides/efemerides-mza.json efemerides/curadas.test.mjs efemerides/efemerides.mjs efemerides/index.html
git commit -m "feat(efemerides): curados ARCHIVO.AR + mendocinas; badge CURADA AR"
```

(El `git mv` registra el rename con la suma de adiciones en este commit.)

### Task 4: Worker — reescribir `handlePlacasV2Efemerides` (fetch raw + es∩en + Gemini «elige y redacta» + fallback determinístico)

**Files:**
- Modify: `worker/worker.js` (`handlePlacasV2Efemerides`, ~l.8927; exports ~l.22; `handlePlacasV2EfemeridesCopys`, ~l.9060: `items.length < 5` → `< 1`)
- Modify: `worker/efemerides-verificacion.test.mjs` (handler tests)

**Interfaces:**
- Consumes: `parseEfemeridesWikitexto`, `emparejarEsEn` (Task 2); `validEfemeridesDate`, `jsonOk/jsonError`, `PLACAS_V2_EF_CACHE_PREFIX/TTL`, `obtenerUltimaBuenaEfemerides`, `itemsCopysReparados` (sin cambios).
- Produces: `handlePlacasV2Efemerides(url, env, fetcher = globalThis.fetch, gemini = null)` — `gemini` inyectable para tests; si es `null`, usa `callGemini(prompt, env)`.

- [ ] **Step 1: Handler tests (failing)** — append a `worker/efemerides-verificacion.test.mjs`:

```js
import { handlePlacasV2Efemerides } from './worker.js';

const FECHA = '2026-11-18';
const fetcherStub = ({ es = ES, en = EN, curadas = null, esStatus = 200, enStatus = 200 } = {}) => async (url) => {
  const u = String(url);
  const mk = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => body, json: async () => JSON.parse(body) });
  if (u.includes('es.wikipedia.org')) return mk(esStatus, es);
  if (u.includes('en.wikipedia.org')) return mk(enStatus, en);
  if (u.includes('efemerides-curadas.json')) return curadas ? mk(200, JSON.stringify(curadas)) : mk(404, '{}');
  throw new Error('url no stubbed: ' + u);
};
const req = (fecha = FECHA) => new Request('https://x/placas/v2/efemerides?fecha=' + fecha);
const envSinKV = {};
const KV_OK = { KV: { _m: new Map(), async get(k){ return this._m.get(k) ?? null; }, async put(k, v){ this._m.set(k, JSON.parse(v)); } } };

test('handler: solo verificados + curados; Sabatini fuera', async () => {
  const curadas = { '11-18': [{ año: '1845', titulo: 'Vuelta de Obligado', resumen: 'r', texto_ampliado: 'a', icono: 'historia', fuente: 'ARCHIVO.AR' }] };
  const gemini = async () => ({ data: { items: [{ indice: 0, alcance: 'nacional', categoria: 'historia', icono: 'historia', resumen: 'curado', texto_ampliado: 'curado' }] } });
  const res = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub({ curadas }), gemini);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(!data.items.some(i => /Sabatini/i.test(i.titulo + ' ' + i.resumen)));
  assert.ok(data.items.every(i => i.verificada === true));
  const obligado = data.items.find(i => i.año === '1845');
  assert.ok(obligado && obligado.fuente === 'ARCHIVO.AR');
});

test('handler: si EN cae → última buena o 502 (nunca placa sin verificar)', async () => {
  const sinCache = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub({ enStatus: 500 }), async () => ({ data: { items: [] } }));
  assert.equal(sinCache.status, 502);
  KV_OK.KV._m.set('placas-v2:efemerides:v5:' + FECHA, { items: [{ titulo: 'vieja', resumen: 'x', texto_ampliado: 'y', año: '1900', icono: 'historia' }], meta: { fecha: FECHA } });
  const conCache = await handlePlacasV2Efemerides(req(), KV_OK, fetcherStub({ enStatus: 500 }), async () => ({ data: { items: [] } }));
  const data = await conCache.json();
  assert.equal(data.meta.fallback, true);
});

test('handler: Gemini roto → selección determinística con verificados', async () => {
  const geminiRoto = async () => ({ error: 'sin respuesta' });
  const res = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub(), geminiRoto);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.items.length >= 1);
  assert.ok(data.items.every(i => i.verificada === true));
});

test('handler: curados de Pages caídos no tumban la placa', async () => {
  const res = await handlePlacasV2Efemerides(req(), envSinKV, fetcherStub(), async () => ({ data: { items: [{ indice: 0, alcance: 'nacional', categoria: 'historia', icono: 'historia', resumen: 'ok', texto_ampliado: 'ok' }] } }));
  assert.equal(res.status, 200);
});
```

- [ ] **Step 2: Run — FAIL** (handler no acepta fetcher/gemini ni devuelve fuente/verificada esperadas).

- [ ] **Step 3: Reescribir el handler** en `worker/worker.js`. Reemplazar todo el cuerpo entre `async function handlePlacasV2Efemerides` y la línea `// Feriados argentinos` por:

```js
// URL cruda wikitext (sin HTML) para una fecha YYYY-MM-DD.
function urlsEfemeridesRaw(date) {
  const mesesEs = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mesesEn = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const m = Number(String(date).slice(5, 7));
  const d = Number(String(date).slice(8, 10));
  if (!mesesEs[m]) return { esUrl: '', enUrl: '' };
  return {
    esUrl: 'https://es.wikipedia.org/w/index.php?title=' + d + '_de_' + mesesEs[m] + '&action=raw',
    enUrl: 'https://en.wikipedia.org/w/index.php?title=' + mesesEn[m] + '_' + d + '&action=raw',
    esWikiUrl: 'https://es.wikipedia.org/wiki/' + d + '_de_' + mesesEs[m],
    enWikiUrl: 'https://en.wikipedia.org/wiki/' + mesesEn[m] + '_' + d,
  };
}

const CURADAS_EF_URL = 'https://mediamendoza.pages.dev/efemerides/efemerides-curadas.json';
const RE_KW_AR_EF = /argent|mendoza|patria|obligado|malvin|sarmiento|belgrano|guemes|san mart|tucum|rosas|urquiza|moreno/i;

function puntuarPlacaEF(item) {
  let p = 0;
  if (RE_KW_AR_EF.test(item.texto)) p += 3;
  if (item.seccion === 'acontecimiento') p += 2;
  else if (item.seccion === 'fallecimiento') p += 1;
  return p;
}

function itemPlacaDesdePool(item, index, extra = {}) {
  const texto = String(item.texto || '').trim();
  const resumen = extra.resumen || item.resumenCurado || texto;
  const ampliado = extra.texto_ampliado || item.ampliadoCurado || resumen;
  const iconoPref = extra.icono || item.iconoCurado;
  return {
    id: 'ef-' + index,
    fecha: '',
    año: String(item.año || '').trim(),
    titulo: texto.slice(0, 160),
    resumen: String(resumen).slice(0, 140),
    texto_ampliado: String(ampliado).slice(0, 240),
    alcance: extra.alcance === 'nacional' ? 'nacional' : 'internacional',
    categoria: String(extra.categoria || 'historia').slice(0, 60),
    icono: Object.prototype.hasOwnProperty.call(EMOJOS_POR_ICONO_EF, iconoPref) ? iconoPref : 'historia',
    icono_descripcion: String(extra.icono || iconoPref || 'historia').slice(0, 100),
    imagen_descripcion: '',
    imagen: '',
    imagen_fuente: '',
    prioridad: index + 1,
    fuente: item.fuente || 'Wikipedia',
    url_fuente: item.fuenteUrl || '',
    verificada: true,
    nivel_verificacion: item.curado ? 'curada' : 'cruzada',
    fuente_descubrimiento: item.fuenteUrl || '',
    curado: !!item.curado,
  };
}

function seleccionDeterministicaEF(pool, max = 12) {
  return [...pool]
    .map(item => ({ item, p: puntuarPlacaEF(item) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, max)
    .map(x => x.item);
}

function normalizarItemsGeminiEF(data, pool) {
  const pedidos = Array.isArray(data?.items) ? data.items : [];
  const usados = new Set();
  const out = [];
  for (const it of pedidos) {
    const indice = Number(it?.indice);
    if (!Number.isInteger(indice) || indice < 0 || indice >= pool.length || usados.has(indice)) continue;
    usados.add(indice);
    out.push(itemPlacaDesdePool(pool[indice], out.length, it));
    if (out.length >= 15) break;
  }
  return out;
}

async function handlePlacasV2Efemerides(url, env, fetcher = globalThis.fetch, gemini = null) {
  const date = url.searchParams.get('fecha') || '';
  if (!validEfemeridesDate(date)) return jsonError('Fecha inválida. Usá YYYY-MM-DD.', 400);
  const cacheKey = PLACAS_V2_EF_CACHE_PREFIX + date;
  const servirUltimaBuena = async () => {
    const cached = await obtenerUltimaBuenaEfemerides(env, date);
    return cached ? jsonOk({ ...cached, meta: { ...(cached.meta || {}), cached: true, fallback: true } }) : null;
  };
  const geminiFn = gemini || (prompt => callGemini(prompt, env));
  const { esUrl, enUrl, esWikiUrl, enWikiUrl } = urlsEfemeridesRaw(date);
  const UA = { 'User-Agent': 'MediaMendoza-Efemerides/1.0 (+https://mediamendoza.pages.dev/)' };
  let esRaw = '', enRaw = '';
  try {
    const [esRes, enRes] = await Promise.all([
      fetcher(esUrl, { headers: UA, signal: AbortSignal.timeout(12000) }),
      fetcher(enUrl, { headers: UA, signal: AbortSignal.timeout(12000) }),
    ]);
    if (esRes?.ok) esRaw = await esRes.text();
    if (enRes?.ok) enRaw = await enRes.text();
  } catch {}
  if (!esRaw || !enRaw) return (await servirUltimaBuena()) || jsonError('No se pudo verificar la placa para esa fecha.', 502);
  const verificados = emparejarEsEn(
    parseEfemeridesWikitexto(esRaw, 'es', esWikiUrl),
    parseEfemeridesWikitexto(enRaw, 'en', enWikiUrl),
  );
  // Curados del repo (JSON servido por Pages): confianza humana, siempre válidos.
  let curados = [];
  try {
    const r = await fetcher(CURADAS_EF_URL, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (r?.ok) {
      const data = await r.json();
      const clave = String(date).slice(5); // MM-DD
      curados = (Array.isArray(data?.[clave]) ? data[clave] : []).map(h => ({
        año: String(h.año || ''),
        texto: String(h.titulo || ''),
        seccion: 'acontecimiento',
        fuente: h.fuente || 'Media Mendoza',
        fuenteUrl: h.fuente === 'ARCHIVO.AR' ? 'https://archivo.ar/efemerides/' : '',
        curado: true, verificado: true,
        resumenCurado: h.resumen, ampliadoCurado: h.texto_ampliado, iconoCurado: h.icono,
      }));
    }
  } catch {}
  const pool = [...curados, ...verificados];
  if (!pool.length) return (await servirUltimaBuena()) || jsonError('No se encontraron hechos verificados para esa fecha.', 502);
  // Gemini «elige y redacta»: SOLO ve el pool verificado; no puede cambiar años ni inventar.
  const lista = pool.map((item, i) => ({ indice: i, anio: item.año, hecho: String(item.texto).slice(0, 240), fuente: item.fuente || 'Wikipedia' }));
  const prompt = 'Sos documentalista de Media Mendoza. Recibís SOLO hechos VERIFICADOS para el ' + date + '.'
    + ' Devolvé entre 8 y 15 ítems (o todos si son menos), priorizando Argentina > América Latina > hispanohablantes > mundo; acontecimientos por sobre nacimientos y fallecimientos simbólicos.'
    + ' Para cada ítem devolvé: "indice" (el mismo de la lista; NUNCA inventes índices ni hechos), "alcance" ("nacional" para argentino/latinoamericano, si no "internacional"), "categoria", "icono" (uno de: futbol, deportes, aviacion, musica, teatro, politica, historia, sociedad, economia, mundo, canal), "resumen" (máx 100 caracteres), "texto_ampliado" (máx 240).'
    + ' No calcules antigüedades ni cambies años. Respondé SOLO JSON válido con {"items":[...]}.\nLista:\n' + JSON.stringify(lista);
  const result = await geminiFn(prompt);
  let items = normalizarItemsGeminiEF(result?.data, pool);
  if (items.length < 3) items = seleccionDeterministicaEF(pool, 12).map((item, i) => itemPlacaDesdePool(item, i));
  items = items.map((it, i) => ({ ...it, fecha: date, prioridad: i + 1 }));
  const payload = { items, meta: { fecha: date, fuente: esUrl, nivel_verificacion: 'cruzada', generatedAt: new Date().toISOString(), cached: false, verificados: verificados.length } };
  if (env.KV) { try { await env.KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: PLACAS_V2_EF_CACHE_TTL }); } catch {} }
  return jsonOk(payload);
}
```

- Exportar en el bloque de exports (línea ~22): agregar `parseEfemeridesWikitexto, textoPlanoWikitext, tokensLetrasEf, emparejarEsEn, urlsEfemeridesRaw, itemPlacaDesdePool, seleccionDeterministicaEF, normalizarItemsGeminiEF` a la línea que ya exporta `normalizarFeriadosAR, handlePlacasV2EfemeridesBanco…` (o en una línea `export { … }` nueva).
- Uso de funciones viejas en este handler: `discoverTyCEfemeridesUrl`, `stripHtmlForEfemerides`, búsqueda de imágenes y `BROWSER_HEADERS` ya NO se usan desde acá. Verificar con Select-String; si no quedan otros usos en worker.js tres archivos, **no borrarlas en este cambio** (hunk mínimo), dejar una nota en el spec.
- **Copys GET (~l.9061):** `if (items.length < 5)` → `if (items.length < 1)`; mensaje sin cambios.

- [ ] **Step 4: Run** — `node --test worker/efemerides-verificacion.test.mjs` verde; `node --test worker/efemerides-copys.test.mjs` verde (sigue verde sin tocar nada); `node --check worker/worker.js`.

- [ ] **Step 5: Commit**

```powershell
git add worker/worker.js worker/efemerides-verificacion.test.mjs
git commit -m "feat(efemerides): placa con verificación cruzada es∩en + curados; Gemini validado por índice; copys toleran <5 hechos"
```

### Task 5: `placa-model.mjs` — mínimo 1 hecho, `pocosHechos`, `fuenteUrl`

**Files:**
- Modify: `efemerides/placa-model.mjs` (constante `MIN_ITEMS` línea ~28; `normalizarItem` y `normalizarPayload` ~l.60-83; `construirModeloPlaca` ~l.97-109)
- Modify: `efemerides/placa-model.test.mjs`

- [ ] **Step 1: Test nuevo (failing)** — agregar en `efemerides/placa-model.test.mjs`:

```js
test('normalizarPayload: acepta 1-4 hechos y expone pocosHechos', () => {
  const rawMenos5 = {
    ok: true,
    items: [1, 2, 3].map(n => ({
      año: '191' + n, titulo: 'Hecho ' + n, resumen: 'Resumen ' + n,
      texto_ampliado: 'Ampliado ' + n, icono: 'historia', verificada: true, fuente: 'Wikipedia', url_fuente: 'https://es.wikipedia.org/wiki/X',
    })),
    meta: { fecha: '2026-11-18', fallback: true },
  };
  const r = normalizarPayload(rawMenos5);
  assert.equal(r.ok, true);
  assert.equal(r.totalMostrados, 3);
  assert.equal(r.pocosHechos, true);
  assert.equal(r.items[0].fuenteUrl, 'https://es.wikipedia.org/wiki/X');
  assert.equal(r.fallback, true); // rawMenos5 trae meta.fallback abajo
  const r6 = normalizarPayload({ ...rawMenos5, meta: { fecha: '2026-11-18' }, items: [1, 2, 3, 4, 5, 6].map(n => ({
    año: '190' + n, titulo: 'H' + n, resumen: 'R' + n, texto_ampliado: 'A' + n, icono: 'historia', verificada: true,
  })) });
  assert.equal(r6.pocosHechos, false);
  const r0 = normalizarPayload({ ok: true, items: [], meta: { fecha: '2026-11-18' } });
  assert.equal(r0.ok, false);
});
```

- [ ] **Step 2: Run — FAIL** (`pocosHechos` undefined; con <5 ítems da ok:false).

- [ ] **Step 3: Cambios en `placa-model.mjs`**:

```js
const MIN_ITEMS = 1;
```

`normalizarItem`: agregar
```js
    fuenteUrl: String(item?.url_fuente ?? item?.fuenteUrl ?? '').trim(),
```
y en `verificada`: `verificada: item?.verificada === true || item?.verificado === true,`

`normalizarPayload`: reemplazar el bloque `if (validos.length < MIN_ITEMS) { ... 'No alcanzaron hechos verificados para esa fecha.' }` mantenido (sigue siendo el mensaje para 0) y agregar tras `const total = validos.length;`:
```js
  const pocosHechos = validos.length < 5;
```
y en el return: `pocosHechos, fallback: raw?.meta?.fallback === true,` junto a los demás campos.

`construirModeloPlaca`: en el return agregar `pocosHechos: visibles.length > 0 && visibles.length < 5,`

- [ ] **Step 4: Run — verde** (`node --test efemerides/placa-model.test.mjs`) y revisar el test existente que exigía ≥5 válidos/ok:false: si lo hay, actualizarlo al contrato nuevo (ese test reflejaba el mínimo viejo a propósito).

- [ ] **Step 5: Commit**

```powershell
git add efemerides/placa-model.mjs efemerides/placa-model.test.mjs
git commit -m "feat(efemerides): placa-model acepta ≥1 hecho; expone pocosHechos y fuenteUrl"
```

### Task 6: Editor — aviso «⚠ N HECHOS …», link `fuente ↗`, sin regresión en copys

**Files:**
- Modify: `efemerides/index.html` (nuevo `<span id="pocosHechos" class="badge badge-pocos" hidden></span>` y `<span id="respaldo" class="badge badge-pocos" hidden></span>` junto a `#editorCount` + CSS `.badge-pocos { background:#b45309; color:#fff; }` y `.fuente-link { font-size:11px; letter-spacing:.5px; color:var(--dorado); text-decoration:none; margin-left:8px; } .fuente-link:hover { text-decoration:underline; }`)
- Modify: `efemerides/efemerides.mjs` (elementos `ui.pocosHechos` + `ui.respaldo`, `renderEditor`, `crearTarjetaBanco`, `agregarDesdeBanco`, `cargarCandidatosWikipedia`, `cargar`)

- [ ] **Step 1:** En el mapa `ui`: `pocosHechos: document.getElementById('pocosHechos'),` y `respaldo: document.getElementById('respaldo'),`

- [ ] **Step 2:** Wiring de respaldo — en módulo-scope cerca de `let candidatosWikipedia = [];` (l.40): `let placaEnRespaldo = false;` En `cargar()`, justo después de `const modelo = await pedir(fecha);`: `placaEnRespaldo = modelo.fallback === true;` En `renderEditor()` (tras `const visibles = …`):

```js
  const poco = visibles.length > 0 && visibles.length < 5;
  ui.pocosHechos.hidden = !poco;
  ui.pocosHechos.textContent = poco ? `⚠ SOLO ${visibles.length} HECHO${visibles.length > 1 ? 'S' : ''} VERIFICADO${visibles.length > 1 ? 'S' : ''} PARA ESTA FECHA` : '';
  ui.respaldo.hidden = !placaEnRespaldo;
  ui.respaldo.textContent = placaEnRespaldo ? '⚠ PLACA DE RESPALDO — VERIFICÁ ANTES DE PUBLICAR' : '';
```

- [ ] **Step 3:** En `renderEditor()`, tras `info.append(linea, resumen)` y antes de `const acciones`:

```js
    const fuenteUrl = String(item.fuenteUrl || '').trim();
    if (fuenteUrl) {
      const a = document.createElement('a');
      a.className = 'fuente-link';
      a.href = fuenteUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = 'Abrir la fuente para verificar antes de publicar';
      a.textContent = 'fuente ↗';
      info.append(a);
    }
```

- [ ] **Step 4:** `cargarCandidatosWikipedia` (~l.405): en el `.map()` — pasar `fuente: c.fuente || 'Wikipedia'` (antes hardcodeado), `fuenteUrl: c.url_fuente || c.fuenteUrl || ''`, `verificada: c.verificada === true`; en `agregarDesdeBanco` (~l.504): mismo pase: `verificada: c.verificada === true,` y `fuenteUrl: c.fuenteUrl || '',` (reemplazan `verificada: false` y falta de fuenteUrl). En `crearTarjetaBanco`: como en Task 3 Step 4 para badge `CURADA AR`. Verificar guardado en copys POST: `itemsVisiblesCopys` ya tolera <6 y strings vacíos — sin cambios.

- [ ] **Step 5:** `node --check efemerides/efemerides.mjs`; abrir la página `file:///` no vale (fetch CORS) — revisar visualmente con el servidor local del repo (`npx http-server` no está: usar `node --experimental-...`? **No**: abrir la app ya desplegada NO sirve. La verificación visual queda para después del deploy — documentarlo en el commit y en el recordatorio final.)

- [ ] **Step 6: Commit**

```powershell
git add efemerides/index.html efemerides/efemerides.mjs
git commit -m "feat(efemerides): aviso de pocos hechos verificados y link fuente ↗ en el editor"
```

### Task 7: Verificación completa + staging selectivo del worker + spec appendix + docs

- [ ] **Step 1: Suite completa** (copiar de AGENTS.md + placa-model):

```powershell
node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs redaccion-v2/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs efemerides/placa-model.test.mjs efemerides/curadas.test.mjs
node --check worker/worker.js; node --check efemerides/efemerides.mjs
```
Expected: todo verde (la única falla tolerada es `shared/editorial-suite.integration.test.mjs`, preexistente).

- [ ] **Step 2: Staging selectivo del worker** — `git diff worker/worker.js` para confirmar que NO incluye el hunk ajeno `handleVisualGenerar`. Si lo incluye (p. ej. la sesión anterior hizo más ediciones al archivo), adaptar `C:\Users\Miguel\AppData\Local\Temp\opencode\stage-worker-copys.js` → `stage-worker-verificacion.js` (mismo patrón: `git diff --no-color worker/worker.js`, filtra hunks por línea tatuada `handleVisualGenerar`/`handlePlacasV2Gen` y aplica con `git apply --cached`). Si el diff contiene SOLO hunks nuestros, el `git add worker/worker.js` de las Tasks 2 y 4 alcanza.

- [ ] **Step 3: Spec — apéndice honesto** — agregar al final de `docs/superpowers/specs/2026-11-18-efemerides-verificacion-design.md`:

```markdown
## Apéndice (2026-11-18, tras el plan)

- Los curados llegan al worker en runtime: el worker hace fetch de
  `https://mediamendoza.pages.dev/efemerides/efemerides-curadas.json`
  (mismo static que sirve Pages). Si Pages cae, el worker sigue con los
  verificados de Wikipedia; no se rompe nada. No hay JSON inlinedado ni KV.
- `discoverTyCEfemeridesUrl` y `stripHtmlForEfemerides` quedan sin uso en el
  handler pero NO se borran en este cambio (hunk mínimo; borrarlos es un
  follow-up aparte).
```

```powershell
git add docs/superpowers/specs/2026-11-18-efemerides-verificacion-design.md
git commit -m "docs(efemerides): apéndice (curados vía Pages; TyC untouched)"
```

- [ ] **Step 4: Diff final completo** — `git log --oneline -6` y `git status`; revisar que no haya stray files (`.superpowers/sdd/progress.md`, `.wrangler/`, `visual-suite/*`) en ningún commit.

### Task 8: Recordatorio de deploy (lo hace el usuario, no el agente)

- El worker sigue siendo pegar `worker/worker.js` → `mm-herramientas-worker` → Edit → Deploy en el dashboard de Cloudflare. Sin este deploy, TODO lo anterior (banco, fresco, copys, verificación cruzada, curados, anclaje histórico y este rediseño) está en `main` pero NO en producción.
- Tras el deploy: probar en producción `/efemerides/` → fecha 2026-11-20 → la placa sale con «Vuelta de Obligado 1845» (curado) + cruzados; revisar pie y link `fuente ↗`.

## Self-Review del plan

- [x] Spec §3.1–3.3 → Task 2. §3.4 → Task 3. §4 → Task 4. §5 → Tasks 5 y 6. §6 → Task 4 (502/última buena) + Task 6 (badge «PLACA DE RESPALDO» vía `meta.fallback → normalizarPayload.fallback → placaEnRespaldo`).
- [x] Sin placeholders; rutas exactas; tests con datos reales.
- [x] Consistencia: `fuenteUrl` (modelo) ↔ `url_fuente` (worker) ↔ `fuenteUrl` (item banco) en todos los Tasks; `pocosHechos` expuesto en Task 5 y consumido en Task 6.
- [x] Orden: Task 2 (parser) → 3 (JSON) → 4 (handler, depende de 2 y 3) → 5 → 6 → 7.
