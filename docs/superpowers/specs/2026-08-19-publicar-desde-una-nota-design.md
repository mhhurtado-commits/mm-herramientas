# Publicar desde una nota

## Objetivo

Incorporar `/publicar/` como puerta editorial independiente, accesible de forma destacada desde el hub raíz, sin reemplazarlo. La persona pega una URL una vez; el sistema extrae una vez y conserva un único contrato editorial reutilizable para abrir `/placas-v2/` o `/whatsapp/`.

```text
URL -> extracción única -> paquete noticia_editorial v2
                         -> Placas V2 (placa, carrusel o reel)
                         -> WhatsApp (grupo y canal)
```

`/placas` de producción no participa ni se modifica.

## Experiencia y handoff

- El hub mantiene su función amplia y suma una entrada prioritaria: **Publicar desde una nota**.
- `/publicar/` muestra sólo URL, estado de preparación y dos rutas: **Abrir Placas V2** y **Abrir WhatsApp**. No duplica los editores de destino.
- La puerta crea y normaliza `noticia_editorial` versión 2 antes de habilitar ambas rutas. Guarda el paquete completo en un handoff de misma procedencia, con `origen: "publicar"` y destino declarado; cada destino valida versión y usa ese paquete.
- Al llegar con un handoff válido, Placas V2 y WhatsApp no llaman a sus extractores ni aceptan la URL como razón para reextraer. Si el handoff falta, vence o no valida, cada herramienta conserva su flujo manual actual y avisa que debe preparar la nota.
- El paquete canónico sigue siendo fuente de verdad: `fuente`, `editorial`, imágenes y salidas derivadas. Se incorpora `salidas.whatsapp` para mensajes ya generados, pero no como fuente de hechos.

## WhatsApp

- Genera grupo y canal desde el mismo contrato; el prompt recibe título, sección, cuerpo, contexto, datos clave y URL ya extraídos.
- La CTA editorial contextual se genera con IA sólo a partir de evidencia disponible y queda editable. Debe invitar a leer o seguir el tema sin atribuir datos nuevos.
- Ambos mensajes incluyen siempre la firma/slogan de marca y CTAs persistentes, separados de la CTA contextual, para unirse al grupo y seguir el canal. Los links se resuelven desde la configuración existente de WhatsApp/KV; si falta uno, se omite sólo su enlace, no se inventa una URL.
- El mensaje de grupo y el de canal conservan su formato y programación actual; la puerta no envía ni programa automáticamente.

## Elegibilidad editorial

- Citas o `textual` sólo con texto atribuible y verificable en el contrato.
- Entrevista sólo con interlocutor identificado y evidencia de formato/preguntas-respuestas; urgencia sólo con fuente que la sostenga; persona/retrato/foto sólo con identidad y relación editorial verificadas.
- Datos numéricos, nombres, lugares y temporalidad se reproducen sólo si están en la evidencia extraída. Las salidas no completan vacíos con IA.
- Si no hay evidencia suficiente para una variante, se oculta esa opción y se usa la salida `general`/noticia: titular, bajada o contexto disponible, enlace y CTAs de marca. Este fallback siempre debe poder generarse.

## Límites y módulos probablemente afectados

- Nuevo: `/publicar/` (interfaz mínima y controlador del ciclo extracción-paquete-handoff).
- Hub: `index.html` para el acceso destacado; conservar todas las demás herramientas.
- Contrato y Worker: `shared/editorial-package.mjs`, `worker/editorial-package.mjs`, `worker/worker.js` y sus pruebas, para el paquete/handoff y la salida WhatsApp sin extracción.
- Destinos: `placas-v2/editorial-session.mjs`, `placas-v2/output-handoff.mjs`, `placas-v2/app.mjs` y `whatsapp/index.html`; adaptar el consumo de paquete, no los flujos manuales ni `/placas`.

## Validación requerida

- Una URL produce una extracción y el mismo paquete llega idéntico a ambos destinos.
- Con handoff válido, WhatsApp no ejecuta `fetchHtml`/scrape y Placas V2 no vuelve a extraer.
- Rechazo de handoff inválido o versión distinta con recuperación al flujo manual.
- Matriz de evidencia: cita, entrevista, urgencia, persona/foto bloqueadas sin evidencia; fallback general disponible.
- Mensajes de grupo y canal contienen CTA contextual editable, slogan y CTAs de crecimiento configurados; no inventan links ni hechos.
