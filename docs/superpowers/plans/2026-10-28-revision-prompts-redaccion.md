# Revisión de prompts de `/redaccion-v2` (28/10/2026)

Sin cambios aplicados. Esto es sólo el diagnóstico.

## Qué revisé

- **Guía editorial** que vive en KV (`config:editorial`), leída del worker en producción: **441 palabras, 50 viñetas, 6 secciones** (Estilo y tono, Originalidad y reescritura, Estructura periodística, SEO y legibilidad, Manejo de información, Instrucción final). Está activa.
- **Instrucción de sistema** que la envuelve (`construirSystemInstruction`).
- **Los 9 estilos** de `ESTILOS_DESC_V2` y las 3 plantillas de tarea (titulares, reformular, redactar).
- **Una prueba real**: una nota sintética de 4 párrafos enviada al endpoint con dos estilos, midiendo lo que vuelve.

## Veredicto

La guía está **mejor armada que el promedio**: cubre originalidad, estructura, SEO y manejo de información, y tiene una sección antiplagio que muchos prompts no tienen. No está vieja en concepto.

El problema no es la modernidad sino **la coherencia entre capas** y **la falta de criterios medibles**. Hay cuatro instrucciones que se contradicen entre sí y siete cosas que no están definidas, y el modelo resuelve el conflicto como puede.

## Lo que devolvió la prueba

Misma nota, dos estilos, `gemini-3.5-flash-lite`, ~2,2 s:

| Medición | `formal` | `cronica` |
| --- | --- | --- |
| Palabras del cuerpo | 203 | 217 |
| Párrafos | 4 | 4 |
| Asteriscos de negrita (`**`) | 6 | 12 |
| Frases copiadas del original (8 palabras seguidas) | 1 | — |
| Palabras del titular | 8 | 15 |
| Titular con mayúscula inicial | Sí | **No** ("vialidad provincial licitará…") |
| Subtítulos | 0 | 0 |
| Categoría | Sociedad | Sociedad |

La nota en `formal` está bien escrita: pirámide invertida, cierre proyectivo, la cita del funcionario convertida a discurso indirecto. El problema no es la calidad de la prosa.

## Los cuatro conflictos

### 1. La guía pide negrita y el sistema prohíbe el markdown

La guía dice: *"Destacar palabras clave importantes en negrita dentro del cuerpo de la nota"*.
El sistema dice: *"Devolvés únicamente el JSON pedido, sin markdown ni texto adicional"*.

Ganó la guía: **6 y 12 asteriscos por nota**. El cuerpo se muestra con `white-space: pre-wrap` y escapado, así que en pantalla se lee `**ruta 143**`, y el botón "Copiar cuerpo" copia los asteriscos al CMS.

Es el hallazgo más urgente porque ensucia el texto publicado y no se nota hasta que está pegado.

### 2. "Optimizado para clics" contra "sin clickbait"

La guía pide un titular *"optimizado para clics"*. El sistema dice *"sin clickbait ni exageraciones"*. El modelo obedece al sistema, que es la capa de mayor prioridad: el titular sale correcto pero sin gancho. Hay que elegir uno y alinear el otro.

### 3. Pirámide invertida contra los estilos narrativos

La guía impone *"estructura de pirámide invertida"* y *"lo más importante al comienzo"*. Los estilos `cronica` y `redes` piden otra cosa (apertura de escena, cierre que invite a compartir). Como la guía va en el sistema, **siempre gana**: la crónica salió con estructura de noticia dura y un titular de 15 palabras.

### 4. La guía pide subtítulos y la salida no tiene dónde ponerlos

*"Incluir subtítulos cuando la nota lo justifique"*, pero el esquema sólo tiene `titular` y `cuerpo`. Salieron 0 subtítulos en las dos pruebas. La instrucción se pierde.

## Los dos conflictos silenciosos

### 5. "La atribución va aparte" y ese aparte no existe

El prompt de reformular dice: *"No menciones el medio de origen dentro del cuerpo: la atribución va aparte"*. En la app, "aparte" es un badge que muestra `Origen: <medio>`. Pero **no hay campo de atribución en la nota ni en los botones de copiar**: cuando el texto se pega en el CMS, el crédito al medio original desaparece.

Para una nota reescrita de otro diario, es una decisión editorial que conviene tomar explícita, no por omisión.

### 6. "Sin mayúsculas innecesarias" se lee como "todo en minúscula"

El titular de `formal` salió bien ("Vialidad repavimentará…"). El de `cronica` salió entero en minúscula. La instrucción no distingue "no usar mayúsculas de más" de "no usar mayúsculas".

## Los siete huecos

1. **No hay ninguna nota modelo.** 441 palabras de reglas y cero ejemplos. Un ejemplo bien elegido hace más por la voz del medio que veinte adjetivos.
2. **No hay longitud objetivo.** Salió 203 palabras. Si el diario publica 400-600, el modelo está escribiendo la mitad.
3. **La categoría es texto libre.** Devolvió "Sociedad". El contrato editorial ya admite `category_options` (hasta 6), pero el prompt no las recibe.
4. **Hashtags sin regla.** Devolvió `SanRafael` sin numeral y el código lo arregla después; no hay límite ni criterio en el prompt.
5. **El antiplagio no es medible.** "No copiar frases" es una intención. En la prueba copió una frase de 14 palabras ("una inversión de 8.500 millones de pesos y un plazo de ejecución de 18 meses"). Una regla verificable —"ninguna coincidencia de más de 8 palabras seguidas"— se puede testear automáticamente.
6. **`reformular` no recibe la fecha.** `redactar` sí. El modelo escribió "este martes" copiándolo del original: si la nota fuente es de la semana pasada, la referencia queda mal.
7. **No hay regla de nombres, cargos ni números.** Primera mención con nombre completo y cargo, cifras en dígitos, unidades: nada de eso está definido.

## ¿Avanzó algo en el oficio desde que empezaste a usarlos?

Sí, pero no donde se suele mirar. Lo grande ya lo tienen:

- Instrucción de sistema separada del contenido del usuario.
- Salida estructurada con esquema, en vez de "respondé sólo JSON".
- Control de razonamiento (`thinkingLevel`) y de presupuesto de tokens.
- Fallback de modelo y detección de respuesta cortada.

Eso es estado del arte 2026. Lo que se impuso después y acá falta es otra cosa:

- **Ejemplos por encima de adjetivos.** "Tono profesional, claro y natural" no le dice nada al modelo; una nota de referencia, sí.
- **Criterios medibles** en lugar de intenciones ("no copiar" → "ninguna coincidencia de 8 palabras").
- **Evaluar con un set fijo de notas** y comparar métricas, en vez de leer una salida y decidir que está bien.
- **Prompts más cortos y con menos prohibiciones.** La guía tiene 9 viñetas que empiezan con "No" sobre 50. Las prohibiciones sirven para el antiplagio; para la voz, traban.
- **No pedir markdown si el destino es texto plano.** Es una regla de higiene que hoy se está violando por diseño.

## Cómo lo probaría antes de tocar nada

1. Elegir 6 notas reales: una de política, una policial, una de deportes, una de sociales, una breve y una larga.
2. Correr cada una con `formal`, `cronica` y `redes`.
3. Medir siempre lo mismo: palabras, párrafos, asteriscos, coincidencias de 8 palabras contra el original, categoría, y si el titular empieza en mayúscula.
4. Recién ahí cambiar una cosa por vez y volver a medir.

Las cinco métricas se calculan solas, así que esto puede vivir como test y correr en cada cambio de prompt.

## Recomendación, en orden

1. **Decidir la negrita**: o se permite y se limpia al mostrar y al copiar, o se saca de la guía. Hoy está en un punto intermedio que ensucia el texto.
2. **Hacer que la estructura dependa del estilo**: la pirámide invertida vale para noticia dura, no para crónica ni redes.
3. **Fijar longitud objetivo** por estilo.
4. **Agregar una nota modelo** por registro (una dura, una narrativa).
5. **Volver medible el antiplagio** y dejarlo como test.
6. **Pasar la lista de secciones** para que la categoría no sea libre.
7. **Pasar la fecha también a `reformular`.**
8. **Definir la atribución**: en el cuerpo con una fórmula fija, o en un campo propio que viaje con la nota.

Nada de esto está aplicado.
