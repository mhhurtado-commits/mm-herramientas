# Qué cambia en placas-v2

## Objetivo

Incorporar una placa manualmente seleccionable para explicar consecuencias concretas de una noticia, sin duplicar `Dato clave`, `Actualización` ni `Foto completa`.

## Contrato

Se añade `impactos` como lista de hasta tres objetos `{ label, value, detail }`.

- El Worker sólo completa impactos verificables presentes en la nota.
- El editor permite corregirlos, agregarlos o quitarlos.
- Un contrato sin impactos sigue siendo válido; la placa muestra un fallback seguro de `contexto` y no inventa consecuencias.

## Modelo visual

`qué cambia` se ofrece siempre en el selector manual. Usa fondo claro de la sección, rótulo `QUÉ CAMBIA`, titular breve y dos o tres módulos de impacto. Conserva el logo institucional y el footer de fuente y dominio. No usa foto a sangre para mantenerse visualmente distinto de `Foto completa`.

## Flujo

El Worker devuelve `impactos` junto a los campos editoriales actuales. El normalizador conserva hasta tres entradas no vacías. El renderer consume `impactos`; si no hay, usa sólo `contexto` como módulo único. No se recomienda automáticamente: el tipo que indique el contrato sigue siendo el predeterminado y `qué cambia` queda disponible manualmente.

## Pruebas

- Normalización de hasta tres impactos y fallback sin datos.
- El tipo permanece disponible manualmente y no altera la recomendación contractual.
- Render seguro en los cuatro formatos, con logo y footer dentro del canvas.
- Compatibilidad del prompt y del Worker con `impactos`.
