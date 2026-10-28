# Actualizar `/redaccion` — evaluación y plan (26/10/2026)

## Respuesta corta

**Sí, se puede, y lo más valioso ya está construido — pero no se puede copiar tal cual.**

`/publicar` tiene una "ficha" ordenada de la noticia que después consumen las placas y WhatsApp. Es exactamente el molde que le falta a `/redaccion`. El problema es que esa ficha asume que la nota **es tuya**: hay una función que convierte cualquier link en `mediamendoza.com/...`. Si `/redaccion` le pasa el link de otro diario, el mensaje de WhatsApp y la placa van a apuntar a **una nota que no existe en tu sitio**.

La solución es chica: separar "de dónde salió la nota" de "dónde la publicaste". Dos casilleros nuevos, no un rediseño. Después de eso, todo el resto se reutiliza.

---

## Cómo está la app hoy

Mejor de lo que suponías. El motor de IA es de mayo de este año (`gemini-3.1-flash-lite`), no el viejo que dice el pie de página ("Gemini 2.5 Flash Lite" quedó desactualizado). Lo que quedó viejo es **la forma en que la app le pide las cosas**: un pedido largo de una sola vez, esperando que la respuesta vuelva bien armada. Si vuelve mal armada, falla.

La app es **un HTML de 97 KB y un archivo de servidor de 7.000 líneas** que atiende toda la suite. No hay base de datos ni usuarios que migrar. Y hay **un solo test** para la pantalla de redacción: por eso los errores aparecen recién cuando los ves vos.

---

## Lo que encontré, en orden de importancia

### 1. El motor de IA tiene fecha de vencimiento: mayo de 2027

Google ya anunció el apagado de `gemini-3.1-flash-lite` para el **7 de mayo de 2027**. No es urgente, pero tiene fecha. El repuesto oficial (`gemini-3.5-flash-lite`) ya está configurado como plan B, así que la mitad del trabajo está hecha.

**Y ya se rompió algo sin que nadie lo notara.** La ilustración con IA del visual-suite usaba un motor que Google apagó el **25 de junio de 2026**. Lleva cuatro meses caída. Nadie se enteró porque la app no anota nada: no hay registro de qué motor respondió, cuánto tardó ni si falló. En `/redaccion`, que usás todos los días, ese punto ciego es más caro.

### 2. La lista de "Fuentes consultadas" la inventa la IA

El hallazgo más serio para un diario. Dos problemas encadenados:

- La búsqueda real en Google **no está disponible en el plan gratuito**. Cuando la app pide buscar y recibe un rechazo, **apaga la búsqueda en silencio y sigue sin buscar**. El interruptor queda encendido, vos creés que buscó, y la nota se escribió sin contexto.
- Aun si buscara, la app **nunca lee las fuentes que devuelve la búsqueda**: el listado de abajo lo escribe el modelo de memoria.

Son citas inventadas con formato de cita. En una nota publicada, es un problema de credibilidad.

### 3. La IA responde en texto libre y la app la fuerza a tener forma

Se le pide "respondé sólo con JSON" y después se intenta leer como ficha. Si la nota es larga (crónica o ampliado), la respuesta se corta a mitad y ves un error. Es la causa más probable de los "la IA no respondió" ocasionales.

### 4. Esperás diez segundos mirando un circulito

No hay forma de ver el texto mientras se escribe, ni de cortarlo cuando ya te convenció. La API ya lo permite. Es lo que más se nota en el uso diario.

### 5. La guía editorial se recorta sola

Antes de mandarla, la app la filtra con una regla que descarta líneas según cómo empiezan (guion, viñeta, emoji). Si mañana editás la guía con otro formato, **parte de la línea editorial se cae sin aviso**.

### 6. Cualquiera con el link puede usar tu cuenta de IA

El servidor no pide ninguna llave y la contraseña de la pantalla está escrita en el HTML. Hoy el riesgo es que te consuman la cuota gratuita; si pasás a pago, es la tarjeta.

---

## `/publicar`: qué sirve y qué no

### Lo que sí sirve

`/publicar` ya arma una ficha ordenada (`noticia_editorial` versión 2) con el título original, la sección, el copete, el contexto, los datos clave, las citas y las fotos. Tiene **validador propio** (si viene incompleta devuelve la lista de errores) y está cubierta con tests. Después se pasa entera a las placas nuevas y a WhatsApp, sin volver a buscar nada.

Eso es lo que le falta a `/redaccion`. Hoy, cuando apretás "Usar en placa ↗", abre el editor viejo y **le pasa sólo el título por el link**: se pierden copete, cuerpo, datos clave y foto.

Ganás tres cosas usando el mismo molde:

1. **Deja de fallar por respuestas mal armadas.** No hay que inventar un formato: se usa el validador que ya existe y, si viene incompleto, se reintenta con la lista de errores como indicación.
2. **Un solo formato en la suite.** Lo que sale de `/redaccion` entra en las placas y en WhatsApp sin traducciones.
3. **"Usar en placa" lleva todo**, no sólo el título. Y suma WhatsApp.

### Lo que no se puede copiar tal cual

Acá está el detalle que hay que corregir, y es el motivo por el que las dos apps no son intercambiables:

- La ficha guarda el link de la nota en `fuente.url`, y **hay una función que reescribe cualquier dirección a `mediamendoza.com/<lo que sea>`**. Con un link de otro diario, termina inventando una dirección tuya que no existe. Ese link es el que después va en el mensaje de WhatsApp y en el botón de la placa.
- Además, WhatsApp **compara ese link con el que pegaste** para decidir si el paquete sirve. Con una nota de tercero, nunca coincide.
- Y la ficha no distingue **nota propia** de **nota de tercero**, que es justo la razón de ser de `/redaccion`.

### Los casilleros que hay que agregar

| Casillero | Por qué |
| --- | --- |
| **Origen: medio y link del otro diario** | Para trazabilidad y para acreditar. Hoy no hay dónde poner "según Los Andes". |
| **Link de tu nota ya publicada** | Es el que va en la placa y en WhatsApp. Antes de publicar está vacío: se pide después, nunca se inventa. |
| **Cuerpo reescrito, hashtags y fuentes** | La ficha guarda el cuerpo *original*; no hay lugar para lo que escribió la IA. Tampoco hay campo de hashtags ni de fuentes. |

Todos son opcionales y no rompen lo que ya funciona. Un detalle fino: el validador **descarta en silencio todo lo que no esté declarado**. Si alguien manda hashtags sin tocar el validador, desaparecen sin error. Por eso el cambio va en el mismo lugar donde se valida, con su test.

---

## Plan propuesto

### Paso 0 — Que la app anote lo que pasa (medio día, no cambia nada visible)
Registro de qué motor respondió, cuánto tardó y si falló. Un chequeo de estado. Y revivir la ilustración caída.

*Listo cuando:* veas una línea por cada llamada con su tiempo, y la ilustración vuelva a funcionar.

### Paso 1 — Un molde propio para notas de terceros (el cambio grande)
Reutilizar la ficha de `/publicar` agregando los casilleros de origen y de publicación, para que nunca se confunda un link ajeno con uno propio. El pedido a la IA deja de ser texto libre: se pide la ficha, se valida, y si viene incompleta se reintenta con los errores.

*Listo cuando:* 50 corridas seguidas sin un error de formato, las notas mantienen tu tono, y **ningún link de tercero aparece como si fuera de `mediamendoza.com`**.

### Paso 2 — Cambiar el motor
La misma nota con el motor actual y con el nuevo (`gemini-3.5-flash-lite` para el día a día, `gemini-3.8-flash` para notas largas), a ciegas. Límite de tiempo realista y botón de cancelar.

*Listo cuando:* la comparación no empeore el texto y la demora esté medida, no supuesta.

### Paso 3 — "Usar en placa" que lleve todo
Para notas ya publicadas: se pega el link de tu diario y la ficha entera va al editor nuevo de placas y a WhatsApp, con título, copete, cuerpo, datos clave y foto.

*Listo cuando:* desde una nota reformulada y publicada puedas abrir la placa con todo cargado y el link correcto.

### Paso 4 — Ver la nota escribirse
El texto aparece en pantalla mientras la IA escribe, con botón para cortar. Si algo falla, vuelve al modo actual.

*Listo cuando:* las primeras palabras aparezcan en menos de dos segundos y cancelar no deje nada colgado.

### Paso 5 — Fuentes de verdad *(requiere pasar a pago)*
Que las fuentes salgan de la búsqueda real y se puedan abrir, separando "verificada" de "sugerida por el modelo".

*Listo cuando:* toda nota con el interruptor encendido muestre al menos un link que existe y corresponde al tema.

### Paso 6 — Poner llave antes de pagar
Acceso al servidor y alerta de gasto **antes** de activar el pago.

---

## Gratis o pago

| | Seguir gratis | Pasar a pago |
| --- | --- | --- |
| Motor nuevo, molde ordenado, streaming, placas con todo | **Sí** | Sí |
| Búsqueda real y fuentes verificables | **No** | Sí |
| Memoria de tu guía editorial entre pedidos | No | Sí |
| Tus borradores usados para entrenar la IA de Google | **Sí** | No |
| Costo | $0 | Del orden de US$10-25 por mes a 20 notas diarias; bastante menos con el motor económico |

Los pasos 0 a 4 se hacen **sin gastar un peso**. Lo que se compra con el pago no es velocidad: es que las fuentes sean reales y que tus notas sin publicar no terminen entrenando a Google.

---

## Riesgos y cómo se vuelve atrás

- **Que un link ajeno se publique como propio:** es el riesgo del paso 1, y se cubre con un test específico.
- **Que cambie el estilo:** se prueba contra notas reales antes de tocar el motor. Volver atrás es cambiar una línea.
- **Que el streaming rompa la pantalla:** va apagado por defecto hasta validarlo.
- **Que se dispare el gasto:** llave y alerta de presupuesto antes del pago.

---

## Recomendación

**Pasos 0, 1 y 2 juntos** (unas 5 o 6 horas). Se validan entre sí: el molde elimina los errores de formato, el motor nuevo mejora el texto, y las notas de prueba dicen si valió la pena. El paso 3 es el que más vas a disfrutar. Los pasos 5 y 6 esperan tu decisión sobre gratis o pago.
