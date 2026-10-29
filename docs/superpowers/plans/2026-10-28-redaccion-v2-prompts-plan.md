# Prompts y estilos de `/redaccion-v2` — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar las tres capas de instrucciones que hoy se contradicen por un contrato de salida fijo, una guía editorial editable que manda sólo en voz y valores, y estilos que definen la estructura.

**Architecture:** `worker/redaccion-v2.mjs` concentra el contrato, las familias de categoría, los estilos y la normalización de salida. Los validadores existentes aplican la normalización, así el reintento correctivo y la respuesta final ven el mismo texto. `worker/worker.js` recibe el bloque inline regenerado y pasa la fecha a reformular. La pestaña Config suma un recuadro fijo con el contrato; el textarea y el KV no cambian.

**Tech Stack:** JavaScript sin bundler, módulos ES, `node --test`, Cloudflare Worker de un solo archivo, HTML/CSS/JS vanilla.

## Global Constraints

- Sin `package.json`, sin bundler, sin dependencias nuevas.
- `worker/worker.js` no puede tener `import`; el bloque se regenera con `node worker/inline-redaccion-v2.mjs` y `worker/redaccion-v2-sync.test.mjs` lo verifica.
- `worker/worker.js` y `redaccion-v2/index.html` usan CRLF: editar con la herramienta de edición, nunca reescribir el archivo entero.
- No tocar `/redaccion/`, `index.html` raíz ni `_headers`/`_redirects`.
- No modificar el contenido de `config:editorial` en KV sin autorización explícita.
- Textos de UI en español rioplatense.
- Un commit por tarea, con la suite del archivo tocado en verde.
- Suite completa: `node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs redaccion-v2/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs`

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `worker/redaccion-v2.mjs` | Contrato, familias, estilos, prompts y normalización de salida |
| `worker/worker.js` | Bloque inline + handlers que pasan la fecha |
| `worker/redaccion-v2.test.mjs` | Tests del módulo |
| `worker/redaccion-v2-sync.test.mjs` | Verifica que el inline sea igual al módulo |
| `redaccion-v2/index.html` | Recuadro fijo y ayuda en Config |
| `redaccion-v2/contrato-dom.test.mjs` | Anclas del HTML |
| `redaccion-v2/metricas.mjs` | Medición para el piloto (palabras, asteriscos, coincidencias de 8 palabras) |
| `redaccion-v2/metricas.test.mjs` | Tests de la medición |
| `docs/redaccion-v2-guia-propuesta.md` | Texto propuesto para pegar en Config (no toca KV) |

---

### Task 1: Contrato, guía y estilos

**Files:**
- Modify: `worker/redaccion-v2.mjs:1-24` y `worker/redaccion-v2.mjs:65-74`
- Test: `worker/redaccion-v2.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces: `CONTRATO_SALIDA: string`, `FAMILIAS_V2: string[]`, `construirSystemInstruction(guia?: string): string`, `ESTILOS_DESC_V2: Record<string, string>`.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `worker/redaccion-v2.test.mjs`:

```js
test('el system arranca con el contrato de salida y después la guía', () => {
  const system = construirSystemInstruction('Voz cercana. Evitar "en el marco de".');
  assert.match(system, /CONTRATO DE SALIDA/);
  assert.match(system, /texto plano/i);
  assert.match(system, /mayúscula inicial/i);
  assert.match(system, /GUÍA EDITORIAL \(voz y valores del diario\)/);
  assert.ok(system.indexOf('CONTRATO DE SALIDA') < system.indexOf('GUÍA EDITORIAL'));
  assert.ok(system.indexOf('GUÍA EDITORIAL') < system.indexOf('Voz cercana'));
});

test('sin guía queda sólo el contrato', () => {
  const system = construirSystemInstruction('');
  assert.match(system, /CONTRATO DE SALIDA/);
  assert.equal(system.includes('GUÍA EDITORIAL'), false);
});

test('el contrato fija las diez familias y el límite de hashtags', () => {
  assert.equal(FAMILIAS_V2.length, 10);
  for (const familia of FAMILIAS_V2) assert.ok(CONTRATO_SALIDA.includes(familia), `Falta ${familia}`);
  assert.match(CONTRATO_SALIDA, /entre 3 y 5/);
});

test('cada estilo declara que manda sobre la guía en estructura', () => {
  for (const [nombre, bloque] of Object.entries(ESTILOS_DESC_V2)) {
    assert.match(bloque, /manda sobre la guía/, `El estilo ${nombre} no declara alcance`);
  }
});

test('crónica y redes no piden pirámide invertida', () => {
  assert.equal(/pirámide/i.test(ESTILOS_DESC_V2.cronica), false);
  assert.equal(/pirámide/i.test(ESTILOS_DESC_V2.redes), false);
  assert.match(ESTILOS_DESC_V2.formal, /pirámide/i);
});
```

Y sumar `FAMILIAS_V2` y `CONTRATO_SALIDA` al import existente de `./redaccion-v2.mjs` (línea 3-11).

- [ ] **Step 2: Correr y ver que falla**

```powershell
node --test worker/redaccion-v2.test.mjs
```

Esperado: FAIL porque `FAMILIAS_V2` y `CONTRATO_SALIDA` no existen.

- [ ] **Step 3: Implementar**

Reemplazar `worker/redaccion-v2.mjs:1-24` por:

```js
export const REDACCION_V2_VERSION = 1;
// El primario es el lite porque el 3.8-flash tardó 101 s en reformular contra un
// timeout de 120 s; el lite resuelve la misma nota en ~6 s. El 3.8 queda de
// respaldo para cuando el lite falle o devuelva un formato inválido.
export const MODELO_PRIMARIO_V2 = 'gemini-3.5-flash-lite';
export const MODELO_RESPALDO_V2 = 'gemini-3.8-flash';

export const TAREAS = {
  titulares: { modelo: MODELO_PRIMARIO_V2, respaldo: MODELO_RESPALDO_V2, maxOutputTokens: 2048, thinkingLevel: 'low', timeoutMs: 60000 },
  reformular: { modelo: MODELO_PRIMARIO_V2, respaldo: MODELO_RESPALDO_V2, maxOutputTokens: 8192, thinkingLevel: 'low', timeoutMs: 120000 },
  redactar: { modelo: MODELO_PRIMARIO_V2, respaldo: MODELO_RESPALDO_V2, maxOutputTokens: 8192, thinkingLevel: 'low', timeoutMs: 120000 },
};

export const FAMILIAS_V2 = [
  'Actualidad', 'Clima', 'Policiales', 'Sociedad', 'Política', 'Economía',
  'Deportes', 'Vendimia', 'Alerta meteorológica', 'Servicio',
];

export const CONTRATO_SALIDA = [
  'CONTRATO DE SALIDA (fijo, gana sobre cualquier otra instrucción de formato)',
  '- Devolvés sólo el JSON del esquema. Nada de markdown, comentarios ni texto extra.',
  '- El cuerpo es texto plano: sin **, sin #, sin tablas, sin subtítulos.',
  '  Párrafos separados por una línea en blanco. Si hay que enumerar, un ítem por',
  '  línea empezando con "- ".',
  '- Titular: mayúscula inicial y nombres propios; el resto en minúscula (siglas',
  '  como UNO, UNSAM o ARCA se respetan).',
  '- No inventes datos, cifras, citas, nombres, medios ni links. Si falta un dato,',
  '  se omite.',
  `- La categoría tiene que ser una de estas diez: ${FAMILIAS_V2.join(', ')}.`,
  '- Hashtags: entre 3 y 5, con #, sin espacios, en español.',
  '- Ninguna coincidencia de más de 8 palabras seguidas con el texto original.',
  '- No menciones el medio de origen en el cuerpo.',
].join('\n');

const ALCANCE_ESTILO = 'Esta estructura manda sobre la guía; la guía define la voz.';

export const ESTILOS_DESC_V2 = {
  formal: `FORMATO — Periodístico formal:\n${ALCANCE_ESTILO}\n- Pirámide invertida: P1 con qué/quién/cuándo/dónde.\n- Después, por orden de importancia.\n- Cierre proyectivo.\n- Titular: máx. 10 palabras.`,
  directo: `FORMATO — Directo:\n${ALCANCE_ESTILO}\n- 3 párrafos de 2 oraciones.\n- Titular: máx. 7 palabras.`,
  ampliado: `FORMATO — Profundidad:\n${ALCANCE_ESTILO}\n- Hecho, antecedentes, datos, perspectivas y cierre.\n- Titular: máx. 10 palabras.`,
  breaking: `FORMATO — Urgente:\n${ALCANCE_ESTILO}\n- Titular en presente, máx. 8 palabras.\n- Hecho, lo que se sabe y lo que falta.`,
  cronica: `FORMATO — Crónica:\n${ALCANCE_ESTILO}\n- Apertura de escena, protagonista, hecho, contexto y cierre.\n- Titular evocador, máx. 12 palabras.`,
  deportes: `FORMATO — Deportes:\n${ALCANCE_ESTILO}\n- Resultado, momentos clave, datos y próximo paso.\n- Titular activo, máx. 10 palabras.`,
  espectaculos: `FORMATO — Espectáculos:\n${ALCANCE_ESTILO}\n- Hecho, contexto, dato curioso y qué sigue.\n- Titular con gancho, máx. 10 palabras.`,
  redes: `FORMATO — Redes:\n${ALCANCE_ESTILO}\n- 3 párrafos breves.\n- Cierre que invite a compartir.\n- Titular gancho, máx. 8 palabras.`,
  institucional: `FORMATO — Comunicado:\n${ALCANCE_ESTILO}\n- Hecho, alcance, declaraciones y contacto.\n- Titular informativo, sin adjetivos.`,
};
```

Reemplazar `worker/redaccion-v2.mjs:65-74` por:

```js
export function construirSystemInstruction(guiaEditorial = '') {
  const rol = 'Sos redactor de Media Mendoza, diario digital del sur de Mendoza, Argentina. Escribís en español rioplatense.';
  const alcance = [
    'GUÍA EDITORIAL (voz y valores del diario)',
    'Esta guía define cómo escribe Media Mendoza: tono, valores, qué evitar y una',
    'nota de referencia. No define la estructura de la nota ni el formato de salida:',
    'la estructura la fija el estilo elegido y el formato lo fija el contrato.',
    'Si algo de acá choca con el contrato, gana el contrato.',
  ].join('\n');
  const guia = String(guiaEditorial || '').trim();
  const base = `${rol}\n\n${CONTRATO_SALIDA}`;
  return guia ? `${base}\n\n${alcance}\n\n${guia}` : base;
}
```

- [ ] **Step 4: Correr y ver que pasa**

```powershell
node --test worker/redaccion-v2.test.mjs
```

Esperado: PASS. El test viejo de "la guía editorial completa llega al systemInstruction" sigue pasando porque busca el texto de la guía, que ahora va al final.

- [ ] **Step 5: Commit**

```powershell
git add worker/redaccion-v2.mjs worker/redaccion-v2.test.mjs
git commit -m "feat(redaccion-v2): contrato de salida, guia por alcance y estilos con estructura propia"
```

---

### Task 2: Normalización de salida

**Files:**
- Modify: `worker/redaccion-v2.mjs` (nuevas funciones antes de `validarReformulacion`, y los dos validadores)
- Test: `worker/redaccion-v2.test.mjs`

**Interfaces:**
- Consumes: `FAMILIAS_V2` de Task 1.
- Produces: `limpiarTextoPlano(texto?: string): string`, `normalizarTitular(texto?: string): string`, `normalizarCategoria(valor?: string): string`, `normalizarHashtags(valor?: string[]): string[]`, `normalizarSalida(data?: object): object`.

- [ ] **Step 1: Escribir los tests que fallan**

```js
test('limpiarTextoPlano saca negritas, títulos y tablas', () => {
  const entrada = 'P1 con **dato clave** y __otro__.\n\n## Subtítulo\n\n| a | b |\n| --- | --- |\n\n- item';
  const salida = limpiarTextoPlano(entrada);
  assert.equal(salida.includes('**'), false);
  assert.equal(salida.includes('__'), false);
  assert.equal(salida.includes('##'), false);
  assert.equal(salida.includes('|'), false);
  assert.match(salida, /dato clave/);
  assert.match(salida, /- item/);
});

test('normalizarTitular pone mayúscula inicial y respeta siglas', () => {
  assert.equal(normalizarTitular('el mendocino jugará'), 'El mendocino jugará');
  assert.equal(normalizarTitular('UNO confirmó la noticia'), 'UNO confirmó la noticia');
  assert.equal(normalizarTitular('**Detienen** a un sospechoso'), 'Detienen a un sospechoso');
});

test('normalizarCategoria acepta las diez y cae en Actualidad', () => {
  assert.equal(normalizarCategoria('policiales'), 'Policiales');
  assert.equal(normalizarCategoria('Política'), 'Política');
  assert.equal(normalizarCategoria('Alerta meteorologica'), 'Alerta meteorológica');
  assert.equal(normalizarCategoria('Deportes y algo más'), 'Actualidad');
  assert.equal(normalizarCategoria(''), 'Actualidad');
});

test('normalizarHashtags deja hasta cinco, con numeral y sin repetir', () => {
  assert.deepEqual(
    normalizarHashtags(['Policiales', '#policiales', 'Justicia', 'Mendoza', 'San Rafael', 'Extra', 'Sexto']),
    ['#Policiales', '#Justicia', '#Mendoza', '#SanRafael', '#Extra'],
  );
  assert.deepEqual(normalizarHashtags([]), []);
});

test('los validadores devuelven el texto ya normalizado', () => {
  const cuerpo = '**Uno** dice que el hecho ocurrió esta mañana en Guaymallén y que dos personas resultaron heridas leves. '.repeat(2);
  const r = validarReformulacion({
    titular: 'el caso del **juez**',
    cuerpo,
    categoria_sugerida: 'policiales',
    hashtags: ['policiales', 'justicia'],
  });
  assert.equal(r.ok, true);
  assert.equal(r.data.titular, 'El caso del juez');
  assert.equal(r.data.cuerpo.includes('**'), false);
  assert.equal(r.data.categoria_sugerida, 'Policiales');
  assert.deepEqual(r.data.hashtags, ['#policiales', '#justicia']);
});
```

Sumar los cinco nombres al import de `./redaccion-v2.mjs`.

- [ ] **Step 2: Correr y ver que falla**

```powershell
node --test worker/redaccion-v2.test.mjs
```

Esperado: FAIL, `limpiarTextoPlano is not a function`.

- [ ] **Step 3: Implementar las funciones**

Insertar antes de `export function validarReformulacion` en `worker/redaccion-v2.mjs`:

```js
function sinTildes(texto = '') {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function limpiarTextoPlano(texto = '') {
  return String(texto || '')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/^\s*\|.*\|\s*$/gm, '')
    .replace(/^\s*[-:|\s]+$/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizarTitular(texto = '') {
  const limpio = limpiarTextoPlano(texto).replace(/\s+/g, ' ').trim();
  if (!limpio) return '';
  const primera = limpio[0];
  if (primera !== primera.toLowerCase()) return limpio;
  return primera.toUpperCase() + limpio.slice(1);
}

export function normalizarCategoria(valor = '') {
  const buscada = sinTildes(valor);
  return FAMILIAS_V2.find(familia => sinTildes(familia) === buscada) || 'Actualidad';
}

export function normalizarHashtags(valor = []) {
  const vistos = new Set();
  const salida = [];
  for (const item of Array.isArray(valor) ? valor : []) {
    const limpio = String(item || '').trim().replace(/^#+/, '').replace(/\s+/g, '');
    if (!limpio) continue;
    const etiqueta = '#' + limpio;
    const clave = etiqueta.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(etiqueta);
    if (salida.length === 5) break;
  }
  return salida;
}

export function normalizarSalida(data = {}) {
  const salida = {
    ...data,
    titular: normalizarTitular(data?.titular),
    cuerpo: limpiarTextoPlano(data?.cuerpo),
    categoria_sugerida: normalizarCategoria(data?.categoria_sugerida),
    hashtags: normalizarHashtags(data?.hashtags),
  };
  if (data?.bajada !== undefined) salida.bajada = limpiarTextoPlano(data.bajada).replace(/\s+/g, ' ').trim();
  return salida;
}
```

- [ ] **Step 4: Aplicarla en los validadores**

Reemplazar `validarReformulacion` y `validarRedaccion` por:

```js
export function validarReformulacion(data = {}) {
  const normalizada = normalizarSalida(data);
  const errors = [];
  if (normalizada.titular.length < 8) errors.push('titular_corto');
  if (normalizada.cuerpo.length < 80) errors.push('cuerpo_corto');
  return {
    ok: errors.length === 0,
    data: {
      titular: normalizada.titular,
      cuerpo: normalizada.cuerpo,
      categoria_sugerida: normalizada.categoria_sugerida,
      hashtags: normalizada.hashtags,
    },
    errors,
  };
}

export function validarRedaccion(data = {}) {
  const base = validarReformulacion(data);
  const bajada = limpiarTextoPlano(data?.bajada).replace(/\s+/g, ' ').trim();
  const errors = [...base.errors];
  if (bajada.length < 10) errors.push('bajada_corta');
  return { ok: errors.length === 0, data: { ...base.data, bajada }, errors };
}
```

- [ ] **Step 5: Correr y ver que pasa**

```powershell
node --test worker/redaccion-v2.test.mjs
```

Esperado: PASS.

- [ ] **Step 6: Commit**

```powershell
git add worker/redaccion-v2.mjs worker/redaccion-v2.test.mjs
git commit -m "feat(redaccion-v2): normalizacion de titular, cuerpo, categoria y hashtags"
```

---

### Task 3: Fecha en reformular y limpieza del prompt

**Files:**
- Modify: `worker/redaccion-v2.mjs:102-116`
- Test: `worker/redaccion-v2.test.mjs`

**Interfaces:**
- Consumes: `ESTILOS_DESC_V2` de Task 1.
- Produces: `construirPromptReformular({ titulo, contenido, contexto?, estilo?, medioOrigen?, fuentes?, fecha? })`.

- [ ] **Step 1: Escribir el test que falla**

```js
test('el prompt de reformular incluye la fecha y no habla de atribución aparte', () => {
  const prompt = construirPromptReformular({ titulo: 'Título', contenido: 'Cuerpo', fecha: '28/10/2026, 21:30' });
  assert.match(prompt, /FECHA Y HORA ACTUAL/);
  assert.match(prompt, /28\/10\/2026/);
  assert.match(prompt, /referencias temporales relativas/i);
  assert.equal(/atribución va aparte/i.test(prompt), false);
});

test('sin fecha el prompt sigue siendo válido', () => {
  const prompt = construirPromptReformular({ titulo: 'Título', contenido: 'Cuerpo' });
  assert.equal(prompt.includes('FECHA Y HORA ACTUAL'), false);
  assert.match(prompt, /FORMATO/);
});
```

- [ ] **Step 2: Correr y ver que falla**

```powershell
node --test worker/redaccion-v2.test.mjs
```

Esperado: FAIL, no aparece `FECHA Y HORA ACTUAL`.

- [ ] **Step 3: Implementar**

Reemplazar `construirPromptReformular` por:

```js
export function construirPromptReformular({ titulo, contenido, contexto = '', estilo = 'formal', medioOrigen = '', fuentes = [], fecha = '' } = {}) {
  const formato = ESTILOS_DESC_V2[estilo] || ESTILOS_DESC_V2.formal;
  return [
    'Reformulá por completo esta nota de otro medio para publicarla en Media Mendoza.',
    fecha ? `FECHA Y HORA ACTUAL (Mendoza, Argentina): ${fecha}` : '',
    fecha ? 'No repitas referencias temporales relativas del original ("este martes", "ayer"). Si el hecho ocurrió antes, indicalo con la fecha del original.' : '',
    medioOrigen ? `MEDIO DE ORIGEN: ${medioOrigen}` : '',
    `TÍTULO ORIGINAL:\n"""\n${titulo}\n"""`,
    `CUERPO ORIGINAL:\n"""\n${contenido}\n"""`,
    contexto ? `INFO EXTRA:\n${contexto}` : '',
    formato,
    bloqueFuentes(fuentes),
    'Conservá los hechos, las cifras y las citas del original. No agregues información que no esté en el texto.',
    'Devolvé titular, cuerpo en párrafos separados por una línea en blanco, categoría sugerida y hashtags.',
  ].filter(Boolean).join('\n\n');
}
```

- [ ] **Step 4: Correr y ver que pasa**

```powershell
node --test worker/redaccion-v2.test.mjs
```

Esperado: PASS.

- [ ] **Step 5: Commit**

```powershell
git add worker/redaccion-v2.mjs worker/redaccion-v2.test.mjs
git commit -m "feat(redaccion-v2): fecha en reformular y prompt sin atribucion aparte"
```

---

### Task 4: Handlers del worker y bloque inline

**Files:**
- Modify: `worker/worker.js:7025-7059`
- Regenerate: `worker/worker.js` (bloque `// >>> REDACCION-V2 INLINE`)
- Test: `worker/redaccion-v2-sync.test.mjs`

**Interfaces:**
- Consumes: `construirPromptReformular({ …, fecha })` de Task 3.
- Produces: la ruta `/v2/redaccion/reformular` responde con el texto ya normalizado (por los validadores de Task 2).

- [ ] **Step 1: Modificar el handler**

En `handleRedaccionV2Reformular`, antes de `const guia = await getEditorial(env);`, agregar:

```js
  const fecha = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Mendoza',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
```

Y cambiar la llamada al prompt para que reciba `fecha`:

```js
      parts: [{ text: construirPromptReformular({ titulo, contenido, contexto: body?.contexto, estilo, medioOrigen: fuenteMedio, fuentes, fecha }) }],
```

- [ ] **Step 2: Regenerar el bloque inline**

```powershell
node worker/inline-redaccion-v2.mjs
node --check worker/worker.js
```

Esperado: `worker.js actualizado con los bloques de redaccion v2` y `CHECK` sin salida de error.

- [ ] **Step 3: Verificar el diff**

```powershell
git diff --numstat worker/worker.js
```

Esperado: pocas líneas (el bloque inline completo, no miles). Si aparecen miles de líneas, el inliner rompió los fines de línea: revertir con `git checkout -- worker/worker.js` y revisar.

- [ ] **Step 4: Correr los tests del worker**

```powershell
node --test worker/redaccion-v2.test.mjs worker/redaccion-v2-sync.test.mjs
```

Esperado: PASS, incluido el test de sincronización.

- [ ] **Step 5: Commit**

```powershell
git add worker/worker.js
git commit -m "feat(redaccion-v2): el worker pasa la fecha a reformular y normaliza la salida"
```

---

### Task 5: Recuadro de reglas fijas en Config

**Files:**
- Modify: `redaccion-v2/index.html:461-463`
- Test: `redaccion-v2/contrato-dom.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces: anclas `id="contrato-salida"` y `id="guia-ayuda"` en el HTML.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar a `redaccion-v2/contrato-dom.test.mjs`:

```js
test('la pestaña Config muestra las reglas fijas de salida', () => {
  assert.match(fuente, /id="contrato-salida"/);
  assert.match(fuente, /Texto plano/);
  assert.match(fuente, /diez familias/);
});

test('la ayuda de la guía separa voz de estructura y menciona la nota modelo', () => {
  assert.match(fuente, /id="guia-ayuda"/);
  assert.match(fuente, /voz y valores/i);
  assert.match(fuente, /NOTA MODELO/);
});
```

- [ ] **Step 2: Correr y ver que falla**

```powershell
node --test redaccion-v2/contrato-dom.test.mjs
```

Esperado: FAIL, no encuentra `contrato-salida`.

- [ ] **Step 3: Editar el HTML**

Reemplazar el párrafo de ayuda (`redaccion-v2/index.html:461`) por:

```html
      <div class="text-muted" id="guia-ayuda" style="font-size:12px;margin-bottom:16px;line-height:1.7">Escribí acá la <strong>voz y los valores</strong> del diario: tono, qué evitar, criterios editoriales y una <strong>NOTA MODELO</strong> opcional (una nota publicada tuya, como referencia de voz). La estructura de cada estilo y el formato de salida no se definen acá: los fija el sistema.</div>
      <div class="mm-field"><label class="mm-label">Reglas fijas de salida (no editables)</label>
        <div id="contrato-salida" class="text-muted" style="font-size:11px;line-height:1.7;background:var(--surface2);border:1px solid var(--line2);border-radius:8px;padding:10px 12px">Texto plano (sin negrita ni markdown) · titular con mayúscula inicial · categoría entre las diez familias · 3 a 5 hashtags con # · no se inventan datos ni fuentes · no se menciona el medio de origen.</div>
      </div>
```

El textarea, el toggle y el botón de guardar quedan como están.

- [ ] **Step 4: Correr y ver que pasa**

```powershell
node --test redaccion-v2/contrato-dom.test.mjs
```

Esperado: PASS.

- [ ] **Step 5: Verificar en el navegador local**

Levantar el preview y abrir Config; comprobar que el recuadro se ve arriba del textarea y que guardar la guía sigue funcionando.

- [ ] **Step 6: Commit**

```powershell
git add redaccion-v2/index.html redaccion-v2/contrato-dom.test.mjs
git commit -m "feat(redaccion-v2): reglas fijas de salida visibles en Config"
```

---

### Task 6: Métricas para el piloto

**Files:**
- Create: `redaccion-v2/metricas.mjs`
- Test: `redaccion-v2/metricas.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces: `palabras(texto?: string): number`, `contarAsteriscos(texto?: string): number`, `coincidenciasLargas(original?: string, salida?: string, n?: number): string[]`.

- [ ] **Step 1: Escribir los tests que fallan**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { palabras, contarAsteriscos, coincidenciasLargas } from './metricas.mjs';

test('palabras cuenta palabras reales', () => {
  assert.equal(palabras('  una dos   tres '), 3);
  assert.equal(palabras(''), 0);
});

test('contarAsteriscos cuenta las marcas de negrita', () => {
  assert.equal(contarAsteriscos('**uno** y **dos**'), 2);
  assert.equal(contarAsteriscos('texto limpio'), 0);
});

test('coincidenciasLargas detecta ocho palabras seguidas', () => {
  const original = 'El funcionario anunció una inversión de 8.500 millones de pesos y un plazo de ejecución de 18 meses.';
  const copia = 'Según el parte, el funcionario anunció una inversión de 8.500 millones de pesos y un plazo de ejecución de 18 meses.';
  assert.equal(coincidenciasLargas(original, copia).length > 0, true);
  assert.deepEqual(coincidenciasLargas(original, 'Una nota completamente distinta sobre otro tema.'), []);
});
```

- [ ] **Step 2: Correr y ver que falla**

```powershell
node --test redaccion-v2/metricas.test.mjs
```

Esperado: FAIL, no existe `metricas.mjs`.

- [ ] **Step 3: Implementar**

```js
export function palabras(texto = '') {
  return String(texto || '').trim().split(/\s+/).filter(Boolean).length;
}

export function contarAsteriscos(texto = '') {
  return (String(texto || '').match(/\*\*/g) || []).length;
}

function normalizarParaComparar(texto = '') {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function coincidenciasLargas(original = '', salida = '', n = 8) {
  const a = normalizarParaComparar(original).split(' ').filter(Boolean);
  const b = normalizarParaComparar(salida).split(' ').filter(Boolean);
  if (a.length < n || b.length < n) return [];
  const vistos = new Set();
  const encontradas = [];
  for (let i = 0; i + n <= b.length; i++) {
    const ventana = b.slice(i, i + n).join(' ');
    if (vistos.has(ventana)) continue;
    vistos.add(ventana);
    for (let j = 0; j + n <= a.length; j++) {
      if (a.slice(j, j + n).join(' ') === ventana) {
        encontradas.push(ventana);
        break;
      }
    }
  }
  return encontradas;
}
```

- [ ] **Step 4: Correr y ver que pasa**

```powershell
node --test redaccion-v2/metricas.test.mjs
```

Esperado: PASS.

- [ ] **Step 5: Commit**

```powershell
git add redaccion-v2/metricas.mjs redaccion-v2/metricas.test.mjs
git commit -m "test(redaccion-v2): metricas de palabras, asteriscos y copia de ocho palabras"
```

---

### Task 7: Propuesta de guía reescrita

**Files:**
- Create: `docs/redaccion-v2-guia-propuesta.md`

**Interfaces:**
- Consumes: nada.
- Produces: texto listo para pegar en Config. **No se guarda en KV.**

- [ ] **Step 1: Escribir el documento**

```markdown
# Guía editorial propuesta para `/redaccion-v2`

Para pegar en Config → Guía editorial. Mantiene tus secciones y tu tono; saca
las tres reglas que ahora pertenecen al sistema (pirámide invertida, subtítulos
y negrita) y agrega un lugar para la nota modelo.

```text
Redactar una nota periodística original en español rioplatense.

ESTILO Y TONO
* Escribir en español rioplatense, usando "vos" en lugar de "tú"
* Mantener tono periodístico profesional, claro y natural
* No editorializar ni opinar
* No exagerar ni usar adjetivos innecesarios
* No usar lenguaje sensacionalista
* Evitar expresiones como: "en el marco de", "llevó a cabo", "manifestó",
  "cabe destacar", "por otra parte"
* Priorizar una redacción dinámica y moderna
* Pensar la nota para un diario digital del sur mendocino

ORIGINALIDAD Y REESCRITURA
* Utilizar la nota fuente únicamente como referencia factual
* Extraer los hechos centrales y reconstruir la noticia desde cero
* No copiar frases, estructuras ni secuencias narrativas del texto original
* No reutilizar títulos, bajadas ni subtítulos del medio fuente
* No seguir el mismo orden de párrafos de la nota original
* Reinterpretar y reorganizar la información con estructura propia
* Evitar el parafraseo superficial o el simple reemplazo de sinónimos
* La nota final debe leerse como una producción periodística independiente

SEO Y LEGIBILIDAD
* Redactar pensando en SEO sin forzar palabras clave
* Incluir palabras clave relevantes de forma natural
* Priorizar claridad, escaneabilidad y lectura rápida en celular

MANEJO DE INFORMACIÓN
* No inventar datos bajo ningún concepto
* Si faltan datos relevantes, redactar únicamente con la información disponible
* Incluir citas textuales solo si están confirmadas o claramente identificadas
* Si no hay citas reales disponibles, no inventarlas
* Priorizar contexto de San Rafael y sur mendocino cuando sea pertinente

NOTA MODELO
[Pegá acá una nota publicada de Media Mendoza que represente la voz del diario.
Es referencia de voz, no de estructura ni de extensión.]
```

## Qué se sacó y por qué

| Regla que se fue | Ahora vive en |
|---|---|
| "Utilizar estructura de pirámide invertida" | Estilo `formal` (y sus variantes) |
| "Incluir subtítulos cuando la nota lo justifique" | Contrato: el cuerpo es texto plano, sin subtítulos |
| "Destacar palabras clave en negrita" | Contrato: texto plano, sin markdown |
```

- [ ] **Step 2: Commit**

```powershell
git add docs/redaccion-v2-guia-propuesta.md
git commit -m "docs(redaccion-v2): propuesta de guia editorial sin reglas de estructura"
```

---

### Task 8: Verificación final y publicación

**Files:**
- Ninguno.

- [ ] **Step 1: Suite completa**

```powershell
node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs redaccion-v2/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs
```

Esperado: 0 fail. La cifra sube desde 509 por los tests nuevos.

- [ ] **Step 2: Smoke de sintaxis**

```powershell
node --check worker/worker.js
node --check redaccion-v2/app.mjs
```

Esperado: sin salida.

- [ ] **Step 3: Confirmar que la app vieja no cambió**

```powershell
git diff --stat origin/main -- redaccion/ index.html
```

Esperado: vacío.

- [ ] **Step 4: Push**

```powershell
git push origin main
```

- [ ] **Step 5: Deploy manual (lo hace Miguel)**

Pegar `worker/worker.js` en el dashboard de Cloudflare. Sin esto, la app nueva
sigue usando el worker viejo y los cambios de prompt no se ven.

- [ ] **Step 6: Verificación después del deploy**

```powershell
curl.exe -s "https://mm-herramientas-worker.mhhurtado.workers.dev/v2/redaccion/health"
```

Esperado: `primario: gemini-3.5-flash-lite`, `respaldo: gemini-3.8-flash`.

Después, con una nota real, correr `formal`, `cronica` y `redes` y medir:

| Métrica | Esperado |
|---|---|
| Asteriscos en el cuerpo (`contarAsteriscos`) | 0 |
| Titular con mayúscula inicial | 3 de 3 |
| Categoría dentro de las 10 | 3 de 3 |
| Hashtags con `#`, entre 3 y 5 | 3 de 3 |
| Coincidencias de 8 palabras (`coincidenciasLargas`) | 0 |
| Menciones al medio de origen | 0 |
| Crónica y redes sin pirámide invertida | sí |

- [ ] **Step 7: Piloto**

Guardar el CSV actual como `piloto-antes.csv` y re-correr las 20 notas con la
config nueva. Comparar latencia, asteriscos, categorías y copia de 8 palabras.

- [ ] **Step 8: Confirmar la app vieja**

```powershell
curl.exe -s -o NUL -w "%{http_code}" "https://mediamendoza.pages.dev/redaccion/"
```

Esperado: `200`.
