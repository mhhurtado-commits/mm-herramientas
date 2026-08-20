# Internas editoriales de Carrusel

## Objetivo

Rediseñar las diapositivas internas de `/carousel` como una familia visual propia, con la densidad, jerarquía y riqueza editorial de `/placas-v2`, sin copiar literalmente sus placas ni modificar el contenido que entrega el contrato actual.

## Alcance

- Mantener sin cambios visuales la portada y el cierre.
- Mantener intactos Worker, `/placas`, `/placas-v2`, el paquete editorial y la selección actual de imágenes.
- Rediseñar las internas sobre el canvas actual de 1080 × 1350, conservando logo, progreso, pie seguro, foco de imagen y bloqueo de exportación por desborde.
- Seleccionar automáticamente una composición según el contenido y permitir una corrección manual por slide.

## Sistema visual

Todas las internas comparten fondo editorial, etiqueta superior, tipografía de alta jerarquía, acento de la familia, tarjetas amplias y pie consistente. El contenido debe ocupar el área útil; no deben quedar tarjetas pequeñas aisladas en grandes vacíos.

Las cinco composiciones son:

1. **Foco:** una afirmación o cifra dominante, seguida por contexto o apoyos secundarios.
2. **Comparación:** dos bloques equivalentes enfrentados, con una separación visual clara y sus etiquetas completas.
3. **Conversación:** pregunta o cita como centro de la escena, con atribución o contexto breve.
4. **Actualización:** imagen editorial cuando existe, título y contexto jerarquizados como una unidad narrativa.
5. **Qué cambia:** entre dos y cuatro consecuencias en tarjetas apiladas de ancho completo.

## Selección automática

La composición explícita en `slide.style.composition` tiene prioridad. Sin selección manual:

- `clave` usa `focus`.
- `dato` usa `comparison` cuando el título expresa contraste y existen al menos dos elementos; en los demás casos usa `focus`.
- `cita` usa `conversation`.
- `impact` y los contextos titulados como consecuencias usan `changes`.
- Preguntas editoriales usan `conversation`.
- `contexto` e `imagen` usan `update` por defecto.
- La variante climática conserva sus renderers especializados actuales.

## Edición manual

Cada slide interno tendrá un control “Diseño interno” con las cinco opciones. El cambio actualiza solamente `slide.style.composition`, vuelve a renderizar el carrusel y no altera su contenido.

## Compatibilidad y calidad

- Los tipos, textos, pares `value/label`, imágenes y focos actuales se conservan.
- El renderer no inventa datos ni descarta elementos para hacerlos caber.
- Si el contenido completo no entra, se mantiene `renderState.overflow = true` y se bloquea la exportación como hoy.
- Los carruseles legacy sin composición explícita reciben una composición automática al normalizarse.
- No se agregan dependencias ni llamadas externas.

## Verificación

- Pruebas unitarias de inferencia y prioridad manual.
- Pruebas de renderer para las cinco composiciones, contenido estructurado y zona segura.
- Prueba del cambio manual de composición sin mutar contenido.
- Suite completa de Carrusel con `node --test --test-isolation=none carousel/*.test.mjs` o su equivalente explícito compatible con PowerShell.
