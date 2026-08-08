# Reel editorial independiente — Diseño

## Objetivo

Crear `/reels` como una herramienta independiente para producir Reels editoriales verticales 9:16 a partir de una URL o de un paquete editorial generado por `/placas-v2`, sin reutilizar la composición ni el renderer heredado de `/carousel`.

## Alcance aprobado

- Entrada por URL directa o handoff desde `/placas-v2`.
- Uso del mismo contrato editorial, extracción, imágenes, alternativas, colores de sección y textos normalizados de la suite.
- Generación de un único Reel vertical por vez, con una secuencia variable de 4 a 6 escenas.
- Renderer y editor propios para Reel.
- Exportación de escenas PNG y del paquete completo.
- Sin audio integrado: el usuario agregará música nativa de Instagram al publicar.
- `/placas`, `/placas-v2` y `/carousel` deben continuar funcionando sin cambios funcionales.

## Dirección visual

El sistema usará una familia editorial dinámica: ritmo de escenas, movimiento suave, tipografía de alto contraste y color dominante por sección.

- Policiales: rojo como color editorial principal; el verde corporativo queda limitado al logo y detalles mínimos.
- Sociales, política, deportes, clima, economía y general conservarán sus colores de sección.
- El logo tendrá una ubicación estable dentro de la zona segura y no usará recuadros o fondos decorativos que reduzcan su nitidez.
- La barra de progreso será mínima o se reemplazará por una señal de avance más discreta.

## Escenas

La secuencia se arma según el contenido real de la nota, no con una plantilla fija:

1. **Cover:** imagen principal, etiqueta de sección y gancho de 8–10 palabras como máximo.
2. **Qué pasó:** explicación breve y factual.
3. **Dato clave:** cifra, lugar, persona, horario o consecuencia relevante.
4. **Qué se sabe:** contexto o estado de la investigación, cuando exista.
5. **Escena complementaria:** solo si hay información e imagen que aporten algo nuevo.
6. **Cierre:** dato útil, CTA y `www.mediamendoza.com`.

Las escenas informativas deben expresar una sola idea. Si un texto no entra, se divide en otra escena; nunca se trunca.

## Imágenes y formatos difíciles

El Reel trabaja siempre en 9:16, pero no fuerza todas las imágenes a cubrir la pantalla.

- Las imágenes horizontales se muestran completas dentro de una ventana vertical.
- Detrás se usa una ampliación de la misma imagen, desenfocada, oscurecida y tonalizada con el color editorial.
- El usuario puede ajustar el foco arrastrando la imagen sobre el canvas.
- Si hay varias imágenes, se priorizan imágenes distintas por escena.
- Se descartan imágenes de baja calidad cuando existe una alternativa válida.
- Si solo hay una imagen, se permiten variaciones de recorte, escala y desplazamiento sutil, sin inventar contenido visual.
- La imagen nunca debe ocultar información relevante ni quedar tapada por el logo o los textos.

## Contrato y flujo de datos

`/placas-v2` y la entrada por URL producen un paquete editorial común con fuente, título, bajada, contexto, etiqueta, categoría, imágenes, colores y fuente. `/reels` lo normaliza a un modelo de escenas propio, manteniendo referencias a la imagen original y al foco.

El flujo será:

1. Recibir URL o paquete editorial.
2. Extraer y normalizar la noticia si llega una URL.
3. Evaluar calidad, orientación y disponibilidad de las imágenes.
4. Generar de 4 a 6 escenas según la información disponible.
5. Renderizar preview con el mismo renderer usado para exportar.
6. Permitir ajustes acotados de texto, imagen, foco y orden.
7. Validar la composición.
8. Exportar escenas y paquete final.

## Editor

El usuario podrá editar:

- escena activa y orden;
- imagen de cada escena;
- foco y posición arrastrando sobre el canvas;
- titular, dato y CTA dentro de límites seguros;
- color editorial de sección, sin modificar libremente la identidad de marca.

No habrá movimiento libre de bloques ni controles deslizantes como mecanismo principal de encuadre.

## Validaciones

Antes de exportar se debe verificar:

- canvas 9:16;
- elementos críticos dentro de la zona segura de Instagram;
- contraste suficiente entre texto y fondo;
- ausencia de textos truncados o desbordados;
- ausencia de invasión del cierre;
- imágenes cargadas y utilizables;
- no repetición innecesaria de imágenes deficientes;
- una sola familia cromática dominante;
- CTA y web presentes en el cierre;
- igualdad visual entre preview y exportación.

## Casos de prueba

- URL válida y paquete recibido desde `/placas-v2`.
- Nota con una imagen horizontal.
- Nota con varias imágenes horizontales y verticales.
- Nota sin imágenes.
- Imágenes pequeñas, ausentes o de baja calidad.
- Titular, bajada y datos largos.
- Noticias policiales, sociales, políticas, deportivas y generales.
- Ajuste manual de foco sobre una imagen horizontal.
- Secuencias de 4, 5 y 6 escenas.
- Preview y PNG con el mismo resultado visual.
- Conservación funcional de `/placas`, `/placas-v2` y `/carousel`.
