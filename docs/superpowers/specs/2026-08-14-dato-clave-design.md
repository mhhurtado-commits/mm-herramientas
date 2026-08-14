# Modelo `dato-clave` para `/placas-v2`

## Objetivo

Agregar una placa informativa y guardable para cualquier nota, con un dato principal y hasta dos datos secundarios verificables.

## Diseño

- Tipo explícito: `dato-clave`.
- Título breve arriba.
- Dato principal grande y dominante.
- Hasta dos datos secundarios en módulos compactos.
- Fuente y fecha abajo.
- Fondo limpio con color de sección; sin bajada larga ni contexto editorial.
- Disponible en 4:5, cuadrado, Story y landscape.
- El contrato agrega `datos_clave` como arreglo opcional; los paquetes antiguos siguen funcionando.
- Si hay menos de tres datos verificables, se renderizan sólo los disponibles.

## Flujo y compatibilidad

El Worker genera `datos_clave` sin inventar cifras ni modificar `titulo`. La interfaz permite editar los datos. La variante se ofrece para todas las notas y no reemplaza las placas existentes ni `/placas`.

## Validación

- Normalización/fallback del arreglo.
- Variante determinística y selector.
- Layout seguro en todos los formatos.
- Render de uno, dos y tres datos sin bajada/contexto.
- Prompt y respuesta del Worker.
- Regresión de tipos y paquetes existentes.

