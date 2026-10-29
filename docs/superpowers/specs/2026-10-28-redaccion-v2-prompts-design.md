# Prompts y estilos de `/redaccion-v2` — diseño

Fecha: 2026-10-28
Alcance: `worker/redaccion-v2.mjs`, su bloque inline en `worker/worker.js`, y la pestaña Config de `redaccion-v2/`.
Fuera de alcance: `/redaccion/` (la app vieja queda intacta), longitud objetivo, atribución en el texto, subtítulos, selector de estilo en Redactar.

## Problema

Hoy hay tres capas de instrucciones que se contradicen:

| Capa | Dónde vive | Prioridad efectiva |
|---|---|---|
| Guía editorial (441 palabras, editable en Config) | KV `config:editorial` | System, gana siempre |
| Reglas fijas (`construirSystemInstruction`) | `worker/redaccion-v2.mjs` | System |
| `ESTILOS_DESC_V2` (9 estilos) | `worker/redaccion-v2.mjs` | Prompt de usuario, pierde |

Consecuencias verificadas en producción el 28/10:

- El cuerpo sale con `**negrita**` (4 marcas en una nota de 1.105 caracteres) porque la guía pide destacar palabras clave y el sistema prohíbe el markdown.
- Los titulares salen en minúscula ("el mendocino gonzalo cairo jugará en los pumitas 7s").
- `cronica` y `redes` salen con pirámide invertida, porque la guía la impone desde el system.
- La categoría es texto libre y no coincide con las familias que usa `/placas-v2`.
- `reformular` no recibe la fecha y copia deícticos del original ("este martes").
- La instrucción "la atribución va aparte" refiere a un chip que no viaja al CMS.

## Decisiones

1. **La guía editable manda en voz y valores.** No define estructura ni formato de salida. Sigue siendo un solo textarea en Config, guardado en KV como hoy.
2. **La estructura la define el estilo**, en código, con una línea de alcance por estilo.
3. **El contrato de salida es fijo y no se edita desde la UI.** Manda sobre cualquier instrucción de formato.
4. **El cuerpo es texto plano.** Se limpia el markdown en el worker, no se confía en el modelo.
5. **Sin longitud objetivo.** El modelo decide la extensión según el material.
6. **Sin atribución en el texto.** El crédito al medio original no viaja al CMS (decisión editorial).
7. **Categoría de lista fija**: las 10 familias de `/placas-v2`.
8. **Nota modelo opcional dentro de la guía.** El usuario pega una nota publicada suya en la sección `NOTA MODELO` del mismo textarea. El system aclara que es referencia de voz, no de estructura ni extensión.

## Arquitectura: tres capas con precedencia explícita

Orden del `systemInstruction`:

1. Contrato de salida (fijo).
2. Alcance de la guía + guía editorial (editable, puede estar vacía o desactivada).
3. En el prompt de usuario: bloque de fuentes y bloque de estilo.

### Contrato de salida

```
CONTRATO DE SALIDA (fijo, gana sobre cualquier otra instrucción de formato)
- Devolvés sólo el JSON del esquema. Nada de markdown, comentarios ni texto extra.
- El cuerpo es texto plano: sin **, sin #, sin tablas, sin subtítulos.
  Párrafos separados por una línea en blanco. Si hay que enumerar, un ítem por
  línea empezando con "- ".
- Titular: mayúscula inicial y nombres propios; el resto en minúscula (siglas
  como UNO, UNSAM o ARCA se respetan).
- No inventes datos, cifras, citas, nombres, medios ni links. Si falta un dato,
  se omite.
- La categoría tiene que ser una de estas diez: Actualidad, Clima, Policiales,
  Sociedad, Política, Economía, Deportes, Vendimia, Alerta meteorológica,
  Servicio.
- Hashtags: entre 3 y 5, con #, sin espacios, en español.
- Ninguna coincidencia de más de 8 palabras seguidas con el texto original.
- No menciones el medio de origen en el cuerpo.
```

### Guía editorial

```
GUÍA EDITORIAL (voz y valores del diario)
Esta guía define cómo escribe Media Mendoza: tono, valores, qué evitar y una
nota de referencia. No define la estructura de la nota ni el formato de salida:
la estructura la fija el estilo elegido y el formato lo fija el contrato.
Si algo de acá choca con el contrato, gana el contrato.

<texto de KV config:editorial.prompt>
```

Si `config:editorial.activo` es falso, se omite la guía y queda contrato + estilo.

### Estilos

Cada bloque abre con: *"Esta estructura manda sobre la guía; la guía define la voz."*

| Estilo | Estructura | Titular |
|---|---|---|
| `formal` | Pirámide invertida: P1 qué/quién/cuándo/dónde, después por importancia, cierre proyectivo | Máx. 10 palabras |
| `directo` | 3 párrafos de 2 oraciones | Máx. 7 |
| `ampliado` | Hecho → antecedentes → datos → perspectivas → cierre | Máx. 10 |
| `breaking` | Presente. Hecho → lo que se sabe → lo que falta | Máx. 8 |
| `cronica` | Apertura de escena → protagonista → hecho → contexto → cierre | Evocador, máx. 12 |
| `deportes` | Resultado → momentos clave → datos → próximo paso | Activo, máx. 10 |
| `espectaculos` | Hecho → contexto → dato curioso → qué sigue | Con gancho, máx. 10 |
| `redes` | 3 párrafos breves, cierre que invite a compartir | Gancho, máx. 8 |
| `institucional` | Hecho → alcance → declaraciones → contacto | Informativo, sin adjetivos |

Los estilos aplican a Reformular, que es donde está el selector. Redactar usa guía + contrato.

## Componentes

### `worker/redaccion-v2.mjs`

| Pieza | Responsabilidad | Depende de |
|---|---|---|
| `CONTRATO_SALIDA` | Texto fijo del contrato | nada |
| `FAMILIAS_V2` | Las 10 etiquetas de categoría | nada |
| `construirSystemInstruction(guia)` | Arma contrato + alcance + guía | `CONTRATO_SALIDA` |
| `ESTILOS_DESC_V2` | Estructura por estilo con línea de alcance | nada |
| `limpiarTextoPlano(texto)` | Quita `**`, `__`, `#`, tablas; normaliza espacios y saltos | nada |
| `normalizarTitular(texto)` | Limpia y aplica mayúscula inicial respetando siglas | `limpiarTextoPlano` |
| `normalizarCategoria(valor)` | Match contra `FAMILIAS_V2`; fallback `Actualidad` | `FAMILIAS_V2` |
| `normalizarHashtags(lista)` | 3 a 5, con `#`, sin espacios ni duplicados | nada |
| `normalizarSalida(data, tarea)` | Aplica todo al JSON del modelo | las cuatro anteriores |
| `construirPromptReformular({ …, fecha })` | Suma la fecha; quita "la atribución va aparte" | `ESTILOS_DESC_V2` |

`normalizarSalida` se aplica **dentro** de `validarReformulacion` y `validarRedaccion`, que ya devuelven `data`. Así el reintento correctivo y la respuesta final ven el mismo texto limpio, y los handlers no duplican la limpieza. En `titulares` no aplica (no hay categoría ni cuerpo).

### `worker/worker.js`

- `handleRedaccionV2Reformular`: calcula la fecha con el mismo formato que Redactar (`America/Argentina/Mendoza`) y la pasa al prompt. La normalización la hacen los validadores.
- `handleRedaccionV2Redactar`: sin cambios de normalización; ya pasa por `validarRedaccion`.
- El bloque inline se regenera con `node worker/inline-redaccion-v2.mjs`.

### `redaccion-v2/index.html`

En la pestaña Config, arriba del textarea:

- Recuadro gris, no editable, con el texto del contrato.
- Ayuda de dos líneas: qué va en la guía (voz, valores, qué evitar, nota modelo) y qué no (estructura, formato).

Nada más cambia en la UI. El textarea, el toggle de activo y el guardado siguen igual.

## Errores y casos borde

- **Guía vacía o desactivada**: se usa contrato + estilo. No es un error.
- **Categoría fuera de lista**: se normaliza a `Actualidad`, sin fallar la respuesta.
- **Hashtags vacíos o repetidos**: si vienen más de 5 se recortan; si vienen repetidos se deduplican; si no viene ninguno, el array queda vacío (no se inventan).
- **Titular con siglas**: la mayúscula inicial no altera el resto del texto.
- **Modelo devuelve markdown igual**: el post-proceso lo limpia; el test lo cubre.
- **Respuesta cortada por tokens**: sigue el camino actual (`respuesta_incompleta` + un reintento correctivo).

## Testing

Unitarios (`node --test`):

- `worker/redaccion-v2.test.mjs`
  - el contrato está en el system y la guía va después;
  - la guía vacía no rompe;
  - crónica y redes no mencionan pirámide invertida;
  - `limpiarTextoPlano` saca `**`, `__`, `#` y tablas;
  - `normalizarTitular` pone mayúscula inicial y respeta siglas;
  - `normalizarCategoria` acepta las 10 y cae en `Actualidad`;
  - `normalizarHashtags` deja 3-5 con `#`;
  - el prompt de reformular incluye la fecha y no dice "la atribución va aparte".
- `worker/redaccion-v2-sync.test.mjs`: el inline es igual al módulo.
- `redaccion-v2/contrato-dom.test.mjs`: existen el recuadro y la ayuda en el HTML.
- Detector de coincidencias de 8 palabras: función pura con test propio, para medir en el piloto.

Suite completa del `AGENTS.md` en verde (hoy 509).

## Verificación después del deploy

Con una nota real por estilo (`formal`, `cronica`, `redes`):

| Métrica | Esperado |
|---|---|
| Asteriscos en el cuerpo | 0 |
| Titular con mayúscula inicial | 3 de 3 |
| Categoría dentro de las 10 | 3 de 3 |
| Hashtags con `#`, entre 3 y 5 | 3 de 3 |
| Coincidencias de 8 palabras con el original | 0 |
| Menciones al medio de origen | 0 |
| Crónica y redes sin pirámide invertida | sí |

Piloto: re-correr las 20 notas y comparar contra el CSV parcial del 28/10 (17 filas), que se conserva como `piloto-antes.csv`.

Manual: Config muestra el recuadro, guardar la guía sigue funcionando, y `/redaccion/` responde 200 sin cambios.

## Datos que no se tocan sin autorización

El texto de la guía vive en KV y es contenido editorial. El diseño no lo reescribe. Se va a proponer un texto reescrito (mismos valores, sin los tres bullets que ahora pertenecen a otras capas: pirámide invertida, subtítulos y negrita) para que el usuario lo pegue en Config o autorice el guardado.

## No objetivos

- Cambiar `/redaccion/` o retirarla.
- Agregar tarjeta de `/redaccion-v2` en el hub.
- Longitud objetivo por estilo.
- Línea de atribución en el texto copiado.
- Campo de subtítulos o volanta.
- Selector de estilo en Redactar.
- Streaming.
