# Video vertical: controles y marcadores manuales de personas

## Objetivo

Extender `/video-vertical` para editar intervenciones de una o más personas sin transcripción automática. La previsualización y el MP4 remoto deben coincidir.

## Experiencia de edición

- Controles debajo de la previsualización: reproducir/pausar, salto de 5 segundos hacia atrás/adelante, tiempo actual/duración y una barra clickeable/arrastrable.
- La barra muestra marcadores manuales de personas. Cada marcador se crea en el tiempo de reproducción actual mediante nombre y cargo.
- El panel lista los marcadores para editar nombre, cargo y segundo de inicio, o eliminarlos.
- No se solicita un fin de tramo: cada marcador dura 4 segundos por defecto.

## Composición editorial

- Categoría y logo se mantienen fijos arriba.
- El titular editorial aparece desde 0 hasta antes de 4 segundos.
- Un marcador de persona muestra `NOMBRE` y `Cargo` durante 4 segundos.
- Si un marcador comienza dentro de los primeros 4 segundos, se desplaza a los 4 segundos para no competir con el titular.
- Una nueva intervención de la misma persona se agrega como otro marcador manual.
- El rótulo de persona reemplaza al bloque de titular inferior; no se superponen.

## Modelo de datos

`project.speakers` será una lista ordenable de objetos:

```js
{ id: 'speaker-...', start: 82.2, duration: 4, name: 'Ana Pérez', role: 'Especialista ambiental' }
```

Los valores de inicio se restringen a la duración del video. Nombre es obligatorio y admite hasta 48 caracteres; cargo es opcional y admite hasta 72. El intervalo visible es desde `max(start, 4)` hasta ese valor más `duration`; se rechazan marcadores cuyos intervalos visibles se superpongan.

## Render y exportación

- El renderizador canvas separa: placa fija (logo/categoría), placa de titular y una placa por marcador de persona.
- La previsualización determina la placa activa según el tiempo del video.
- En exportación rápida, el navegador sube cada placa PNG firmada a Cloudinary junto al video. El Worker genera una transformación eager: placa fija durante todo el video, titular de 0 a 4 segundos y cada placa de persona con su `so` y `du`.
- En alta local, FFmpeg recibe las mismas placas temporizadas mediante filtros de overlay, para mantener paridad funcional.

## Controles y estados

- Cargar una nueva fuente limpia marcadores y la descarga anterior.
- Agregar un marcador requiere video cargado; se usa el tiempo actual y se pausa el video.
- La exportación se bloquea si existen marcadores inválidos o superpuestos, mostrando el error específico.
- La descarga se mantiene como acción explícita al finalizar la exportación remota.

## Verificación

- Pruebas de normalización del proyecto, intervalos y reglas de prioridad titular/persona.
- Pruebas de render para rótulo activo, titular inicial y placa fija.
- Pruebas del payload de exportación Cloudinary, incluidos tiempos y capas de varios marcadores.
- Pruebas de comandos FFmpeg para la alternativa local.
