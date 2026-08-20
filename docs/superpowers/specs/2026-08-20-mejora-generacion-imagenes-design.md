# Mejora de generación de imágenes IA

## Objetivo

Recuperar calidad editorial en las imágenes generadas por Redacción y Fondo IA sin introducir servicios pagos ni modificar `/placas`.

## Alcance

- Cambiar el motor primario de `/generar-imagen` a `@cf/black-forest-labs/flux-2-klein-4b` mediante Workers AI.
- Enviar siempre `width=1200` y `height=630`, formato horizontal de la salida editorial actual.
- Conservar `flux-1-schnell`, DreamShaper y SDXL como fallbacks en ese orden después del primario, únicamente si el primario no devuelve una imagen válida.
- Exponer en la respuesta el modelo y motor ya usados, sin alterar el contrato de clientes existente.
- Añadir pruebas unitarias del selector/configuración de motores, sin llamadas externas.

## Restricciones

- Sin nuevas claves, dependencias ni proveedor pago.
- Workers AI sigue sujeto a su asignación gratuita diaria; no se promete uso ilimitado.
- Mantener los prompts, la edición existente y el formato de respuesta de Redacción y Visual Suite.
- No modificar `/placas`, `/placas-v2`, `/carousel` ni `/reels`.

## Diseño

Se extraerá una configuración pequeña y testeable para declarar el tamaño editorial y el orden de fallback. El primer intento usará Klein 4B mediante `FormData`, que es el protocolo requerido por Workers AI para ese modelo. La respuesta se validará como bytes de imagen antes de continuar.

Si no devuelve una imagen, se probarán los motores locales ya presentes. Pollinations se mantiene como fallback externo de baja confianza únicamente en el punto que hoy ocupa, sin promocionarlo a modelo recomendado ni depender de sus modelos pagos. El cliente seguirá leyendo `modelo` y `motor`; se hará visible el resultado real para distinguir una generación primaria de un fallback.

## Verificación

Las pruebas deben demostrar que Klein 4B es el primer intento y que usa 1200×630; una segunda prueba debe demostrar que los fallbacks conservan el orden actual. Se ejecutarán las pruebas focalizadas y una verificación sintáctica de `worker/worker.js`.
