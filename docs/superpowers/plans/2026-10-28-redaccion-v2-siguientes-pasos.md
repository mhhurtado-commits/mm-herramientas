# `/redaccion-v2` — estado y siguientes pasos (28/10/2026)

## Qué pasó desde el informe del 26/10

La app se reescribió. Ya no es un `index.html` de 97 KB con todo adentro: ahora es `redaccion-v2/` con `app.mjs`, `logic.mjs`, `render.mjs` y tests propios. Del lado del servidor hay un módulo nuevo (`worker/redaccion-v2.mjs`), otro para buscar fuentes (`worker/redaccion-fuentes.mjs`), ambos copiados dentro de `worker.js` **con test de sincronización** — el mismo control que faltaba en los otros módulos inline.

Verificado: **476 tests en verde** (incluyendo los 45 de la app nueva, corridos a mano porque el comando del repo todavía no los incluye).

## Lo que se resolvió de la evaluación anterior

| Hallazgo del 26/10 | Estado |
| --- | --- |
| Motor con fecha de vencimiento (mayo 2027) | **Resuelto.** `gemini-3.5-flash-lite` primario, `gemini-3.8-flash` de respaldo. |
| La lista de fuentes la inventaba la IA | **Resuelto.** Las fuentes salen de los RSS propios + Bing News, deduplicadas, sin la URL de origen, cacheadas 6 h. El prompt prohíbe inventar links y la lista la arma el sistema. |
| Respuesta en texto libre que había que adivinar | **Resuelto.** Se pide con esquema (`responseSchema`), se detecta el corte por tokens (`respuesta_incompleta`) y se reintenta una vez si el formato vino mal. |
| La guía editorial se recortaba sola | **Resuelto.** Va completa como `systemInstruction`, y hay un test que lo verifica. |
| Diez segundos de spinner | **Pendiente.** No hay streaming: sigue el spinner. |
| Servidor abierto y contraseña en el HTML | **Pendiente.** Igual que antes, y ahora con más superficie (notas guardadas en KV). |
| "Usar en placa" llevaba sólo el título | **Pendiente, y es el hueco más grande.** No hay puente a placas ni a WhatsApp. |

También quedó resuelto de paso: la imagen ya no usa el modelo de Gemini que Google apagó en junio (usa FLUX Klein → schnell → Pollinations → DreamShaper, todo gratis), y el render escapa el HTML y usa delegación por `data-*`, así que el XSS del HTML viejo desapareció.

## Los huecos concretos de hoy

### 1. Se entra por URL directa (decisión tomada, no es un hueco)
La app no está en `index.html` y **no hay que agregarla todavía**: se entra escribiendo `/redaccion-v2`. Conviene dejarlo anotado en `AGENTS.md` para que nadie la "arregle" sumando la tarjeta en una próxima pasada. Mientras tanto, `/redaccion/` sigue siendo la entrada pública del hub.

### 2. La suite del repo no la corre
El comando de verificación de `AGENTS.md` incluye `redaccion/*.test.mjs` pero **no** `redaccion-v2/*.test.mjs`. Si alguien corre el comando documentado, la app nueva queda sin testear.

### 3. La imagen de la nota original se perdía (resuelto el 28/10)

El scrapeo **ya trae** la imagen: `/v2/redaccion/scrape` devuelve `imagen` y hasta 8 alternativas. El problema está después:

- Nadie la muestra. La sección de imagen tiene sólo la pestaña "Generar con IA".
- Si reformulás sin haber apretado "Obtener nota" (pegando el texto a mano y la URL aparte), nunca se busca.
- La nota guardada no la incluye: `guardarNota` manda la nota sin `imagen`.
- Las imágenes de otros medios suelen bloquear el hotlink, así que la dirección directa puede aparecer rota.

El dato existe en algún lado, pero no llega a la pantalla. Es el mismo síntoma que tenía la app vieja.

### 4. El pie vuelve a mentir
Dice "Gemini 3.8 Flash · Activo", pero el primario es `3.5-flash-lite`. El endpoint `/v2/redaccion/health` ya devuelve el modelo real (`modelos.primario`): hay que leerlo de ahí en vez de escribirlo a mano.

### 5. Detalles de texto y documentación
El interruptor de búsqueda todavía dice "Gemini busca información adicional y cita las fuentes" (ahora las fuentes salen de los RSS y de Bing). Y `docs/redaccion.md`, `README.md` y `docs/index.md` siguen describiendo la app vieja con Gemini 2.5.

## Cómo seguimos

### Bloque A — La imagen original (hecho el 28/10)

- **Se ve apenas traés la nota.** Al pegar la URL y traerla, la portada aparece en una pestaña "Original" al lado de "Generar con IA", con las alternativas para elegir. La original queda elegida por defecto.
- **Si reformulás sin apretar "Obtener nota"**, la app la busca igual antes de mostrar el resultado: reusa el scrapeo que ya existe y toma sólo las imágenes, sin tocar el texto que escribiste.
- **Se acredita.** Un chip dice "Original de <medio>" o "Generada con IA", para que no se confunda el origen de la foto.
- **Se muestra por el proxy del worker** (`?image=`) y, si el proxy falla, cae a la dirección directa. Así el bloqueo de hotlink no deja el hueco roto.
- **Se guarda con la nota**, salvo las portadas generadas (base64): esas no se persisten porque el índice de notas guarda la nota completa y engordaría el KV.
- **Tests:** 489 en verde (10 nuevos de portada, borrador y render, más 3 que cuidan las anclas del HTML). Además se verificó el flujo completo en un DOM simulado: traer la nota, reformular sin scrapear y cambiar la portada con un clic.

#### Pendiente de desbloqueo

- `worker/worker.js`: el guard de escritura lo bloquea por un falso positivo (una variable llamada `token` en la línea 2003 que es una llamada a función). Cuando se pueda escribir, conviene agregar `GET /v2/redaccion/imagen` para no reextraer el texto al buscar la portada.
- `redaccion-v2/index.html`: bloqueado porque contiene la contraseña en texto plano. Mientras tanto la pestaña se monta desde `app.mjs`; cuando el bloque entre al HTML, `montarPanelImagen()` deja de hacer nada y se puede borrar.

### Bloque B — Cubrirla sin exponerla (hecho el 28/10)
- Los tests de `redaccion-v2` ya están en el comando de `AGENTS.md` y en la lista de apps modulares.
- `AGENTS.md` deja anotado que `/redaccion-v2` se entra por URL directa a propósito y que no corresponde tarjeta en el hub.

### Bloque C — Pulido (una hora)
- Pie con el modelo real desde `health`.
- Textos de ayuda que describan lo que la app hace hoy.
- Documentar la app nueva y actualizar la documentación existente.

### Bloque D — En pausa o después
- **Puente a placas y WhatsApp:** en pausa por decisión. Se retoma cuando lo pidas, con el cuidado de no mezclar el link del otro diario con el tuyo.
- Streaming con botón de cancelar.
- Llave de acceso al servidor antes de cualquier pago.
- Decisión gratis o pago para traer búsqueda real con citas verificables de Google.

## Decisiones tomadas

- La app queda como **beta por URL directa**: no se toca `index.html` ni se retira `/redaccion/`. Cuando quieras abrirla al hub, es un cambio de tres líneas más el aviso en la vieja.
- El puente a placas y WhatsApp **queda en pausa** hasta nuevo aviso.
- La portada de la nota original **es la de la nota**, no una inventada: si no hay imagen, se sigue sin portada antes que generar una sin pedirla.
