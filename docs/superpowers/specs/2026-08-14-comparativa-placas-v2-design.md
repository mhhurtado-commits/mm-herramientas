# Comparativa para `/placas-v2`

## Objetivo

Agregar un modelo `comparativa` para cualquier nota, con una composición visual sintética que permita contrastar dos lados sin modificar los modelos existentes ni `/placas`.

## Alcance

- Nuevo tipo explícito `comparativa` en el contrato y selector de `/placas-v2`.
- Formato principal 4:5, con adaptación a cuadrado y Story mediante áreas seguras.
- Título sintético independiente de `titulo`.
- Dos bloques comparables, cada uno con `etiqueta`, `valor` y `detalle` opcional.
- Carga manual desde el editor.
- Propuesta opcional del Worker sólo cuando la nota contiene ambos lados de la comparación.
- Metadatos de modelo, formato, sección, longitud del título y fecha.
- Fuente y fecha visibles o registradas cuando los datos sean manuales o externos.
- Compatibilidad con paquetes antiguos: si no existe la información comparativa, no se rompe el resto del paquete.

## Contrato propuesto

```js
{
  tipo: 'comparativa',
  titulo: 'Titular editorial general',
  titulo_sintetico: 'Antes y ahora: qué cambió',
  comparativa: {
    izquierda: { etiqueta: 'Antes', valor: '42%', detalle: '2025' },
    derecha: { etiqueta: 'Ahora', valor: '58%', detalle: '2026' },
    fuente: 'Media Mendoza',
    fecha: '2026-08-14',
    origen: 'nota'
  }
}
```

`origen` admite `nota`, `manual` o `externo`. Los datos manuales o externos no se presentarán como hechos de la nota sin conservar su fuente.

## Render

- Encabezado con etiqueta de sección, marca y título sintético.
- Dos tarjetas de igual jerarquía separadas por un indicador visual de contraste.
- Sin bajada editorial extensa.
- Valores grandes y legibles; detalles secundarios con menor peso.
- Fuente y fecha sólo cuando existan y sin competir con los valores.
- Fallback seguro a `titulo` si falta `titulo_sintetico`.

## Flujo de datos

1. El editor selecciona `comparativa`.
2. Puede completar los dos lados manualmente.
3. El Worker puede proponer los lados a partir de la nota, pero no inventa cifras ni relaciones.
4. La normalización valida ambos lados y conserva fuente, fecha y origen.
5. El renderer produce la placa y exporta metadatos junto con el modelo.

## Pruebas

- Normalización de ambos lados y fallback de título.
- Rechazo o advertencia ante lados incompletos.
- Conservación de `fuente`, `fecha` y `origen`.
- Render de dos tarjetas y ausencia de bajada extensa.
- Layout 4:5, cuadrado y Story.
- Regresión de todos los tipos actuales y paquetes antiguos.
- Prompt del Worker: sólo datos verificables presentes en la nota.

## Fuera de alcance

- Reutilizar código de `/visual-suite`.
- Modificar `/placas`.
- Crear una plataforma de analítica.
- Obtener automáticamente datos externos sin fuente explícita.
