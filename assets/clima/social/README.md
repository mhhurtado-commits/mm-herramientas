# Fondos de cielo para Clima Social

Fondos fotográficos locales para la variante social de las placas de Clima.
Son cielos sin ciudades, edificios, personas ni referencias geográficas, para
que la imagen acompañe el estado meteorológico sin atribuir el pronóstico a un
paisaje que no corresponde a la ciudad elegida.

## Archivos y estados

| Archivo | Estado SMN normalizado |
| --- | --- |
| `despejado-dia.jpg` | Despejado, de día |
| `despejado-noche.jpg` | Despejado, de noche |
| `parcial-dia.jpg` | Parcialmente nublado, de día |
| `parcial-noche.jpg` | Parcialmente nublado, de noche |
| `nublado-dia.jpg` | Nublado, de día |
| `nublado-noche.jpg` | Nublado, de noche |
| `lluvia-dia.jpg` | Lluvia, de día |
| `lluvia-noche.jpg` | Lluvia, de noche |
| `tormenta.jpg` | Tormenta eléctrica, cualquier horario |

La selección se realiza con el `type` meteorológico normalizado y `isDay` que
entrega la integración del SMN. La descripción textual no se usa para elegir
la fotografía porque puede ser ambigua o no coincidir con el código del estado.

## Compatibilidad

Se conservan `despejado.jpg`, `nublado.jpg`, `lluvia.jpg` y `noche.jpg` como
alias para integraciones antiguas. Los nuevos renderizados usan las variantes
explícitas de día y noche. `atardecer.jpg` queda disponible para futuras
variantes, pero no se utiliza como fondo automático.

Las imágenes fueron generadas como recursos editoriales locales y se exportan
en JPG para que preview y PNG no dependan de una URL externa. El logo de
MediaMendoza no forma parte de estos fondos y se mantiene sin modificaciones.
