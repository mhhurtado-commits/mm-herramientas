# Contrato editorial canónico para placas-v2, carrusel y reels

## Objetivo

Extraer e interpretar una noticia una sola vez en `/placas-v2`. El resultado es un contrato editorial completo que puede alimentar placas, carrusel o Reel sin que una salida dependa de otra.

## Arquitectura

```text
URL noticia
  -> extracción única
  -> contrato editorial canónico
      -> adaptador placas-v2
      -> adaptador carrusel
      -> adaptador reels
```

`salidas.carrusel` y `salidas.reel` son representaciones derivadas, no fuentes de verdad. El adaptador de Reel no debe importar ni consumir el plan del carrusel.

## Datos canónicos

El contrato conserva fuente, título, bajada, cuerpo, contexto, datos clave, textual, personas, citas verificadas, imágenes y opciones de categoría. Cada adaptador puede seleccionar y ordenar esos datos según su formato, pero no inventarlos ni extraerlos nuevamente.

## Reglas de generación

- Si se solicitan carrusel y Reel, cada salida se genera desde el mismo contrato.
- La generación editorial puede usar una llamada independiente por formato, pero nunca una extracción independiente.
- Si se recibe un paquete ya generado, cada módulo prioriza su salida almacenada y usa el contrato como respaldo.
- `/placas` queda fuera de este cambio.

## Verificación

Se agregan pruebas que comprueben que Reel no usa `salidas.carrusel`, que conserva datos del contrato y que una extracción produce un único paquete compartido.
