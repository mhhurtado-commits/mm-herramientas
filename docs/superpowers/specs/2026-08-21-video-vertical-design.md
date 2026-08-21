# Video vertical editorial: diseño

**Estado:** diseño aprobado para planificación; no implementado.

## Objetivo

Crear una herramienta independiente en `/video-vertical/` para convertir videos propios o autorizados en formato horizontal a piezas verticales 9:16 para redes. Debe conservar el plano horizontal completo sin deformarlo, incorporar datos editoriales provenientes de `/placas-v2`, permitir edición antes de exportar y proponer clips publicables para videos largos.

La marca visible debe escribirse exactamente como `mediamendoza`.

## Alcance

- Importar archivos locales MP4 y MOV sobre los que el operador tenga derechos.
- Componer una salida vertical 1080x1920 en MP4 con video horizontal completo, fondo derivado del video y capas editoriales.
- Permitir salida del video completo, clips sugeridos o ambas.
- Ofrecer los perfiles `hablado` y `broll` dentro de la misma herramienta.
- Usar el paquete editorial vigente de `/placas-v2` cuando esté disponible y permitir completar sus campos manualmente cuando no lo esté.
- Conservar, reemplazar o mezclar el audio original con música aportada por el operador.
- Permitir corrección manual de encuadre, texto, cortes, subtítulos y audio antes de cualquier exportación.

## Fuera de alcance

- Descargar, extraer o procesar directamente URLs de YouTube. El ingreso es siempre un archivo local autorizado.
- Publicar automáticamente en redes ni aprobar automáticamente clips sugeridos.
- Alterar `/placas`, el editor abandonado `/video-editor`, ni el renderer actual de `/reels`.
- Crear una infraestructura de procesamiento de video en servidor en esta etapa.
- Reescalar mediante IA o prometer una exportación matemáticamente sin pérdida: toda composición con capas requiere recodificación.

## Decisión de arquitectura

`/video-vertical/` será un producto separado, no una extensión de `/video-editor/` ni de `/reels`.

- `/video-editor` queda sin cambios: su código mezcla UI, estado, cortes, overlays y exportación genérica en un flujo no diseñado para el contrato editorial.
- `/reels` queda sin cambios: su renderer anima escenas canvas y exporta reels gráficos; no procesa un video fuente.
- El producto nuevo puede reutilizar bibliotecas o patrones comprobables de FFmpeg y transcripción, pero no debe importar la UI ni el estado global del editor anterior.
- `/placas-v2` sigue siendo la fuente editorial y técnica; no se crea otro prompt ni contrato equivalente.

La implementación se divide en módulos con una responsabilidad única:

1. `video-session`: archivo fuente, metadatos, selección de perfil y configuración persistible localmente.
2. `package-adapter`: lectura y validación del handoff editorial existente.
3. `framing`: cálculo de composición 9:16, posición del plano y zonas seguras.
4. `lower-third`: modelo y render del zócalo y overlays de apertura.
5. `captions`: importación, edición y posición de subtítulos.
6. `clip-suggestions`: candidatos editables para hablado y b-roll.
7. `audio-mix`: modos original, música y mezcla.
8. `video-export`: composición y exportación local con progreso, sin modificar el archivo fuente.

## Flujo editorial y datos

```text
/placas-v2 genera paquete editorial
             ↓
sessionStorage: mm-editorial-handoff
             ↓
/video-vertical adapta datos al proyecto de video
             ↓
operador sube archivo local y revisa la previsualización
             ↓
operador confirma texto, encuadre, audio, subtítulos y clips
             ↓
exportación local MP4 vertical
```

El adaptador lee, sin cambiar de versión, los datos actuales del paquete:

| Origen | Uso en video vertical |
| --- | --- |
| `editorial.titulo` | titular del zócalo y hook inicial |
| `editorial.bajada` | contexto breve opcional |
| `editorial.seccion` | etiqueta o sección |
| `editorial.datos_clave` | dato puntual opcional |
| `editorial.category_options` y colores | acento y alternativa de categoría |
| `fuente` | atribución y referencia editorial |
| URL de fuente | CTA o referencia, no texto obligatorio en pantalla |

Los valores derivados se pueden editar por proyecto. Sin handoff, se abre el mismo modelo con campos vacíos para que el operador los complete manualmente. La configuración específica de video vive en el proyecto local y no modifica el paquete editorial de origen.

## Experiencia de uso

La pantalla se organiza en tres áreas:

- **Previsualización vertical:** muestra siempre la composición final 9:16, con guías de zona segura y controles de posición del plano.
- **Panel editorial:** perfil, zócalo, hook, fuente, audio, subtítulos y acciones de exportación.
- **Timeline:** duración total, cortes manuales y candidatos de clips; ningún candidato se publica ni exporta automáticamente.

Secuencia:

1. Abrir la herramienta desde el paquete editorial o directamente.
2. Subir un MP4 o MOV local; validar duración, dimensiones, tamaño y disponibilidad de audio.
3. Elegir `hablado` o `broll`; el valor puede cambiarse sin reiniciar el proyecto.
4. Revisar el zócalo precargado, ajustar encuadre y seleccionar el modo de audio.
5. Revisar subtítulos o clips sugeridos, editar tiempos y textos.
6. Exportar el video completo, clips seleccionados o ambas opciones.

## Composición visual

El preset inicial es **horizontal completo**:

- El video principal mantiene su relación de aspecto y se ajusta con `contain`; nunca se estira.
- Una copia ampliada, desenfocada y oscurecida del mismo video ocupa el fondo 9:16.
- El operador puede mover el plano principal verticalmente dentro de sus límites. El modo `recorte vertical` existe como alternativa explícita, con ajuste manual de foco; no es el predeterminado.
- El zócalo se ubica en el tercio inferior respetando una zona tranquila para controles de redes. No tapa subtítulos ni el sujeto cuando puede evitarse.
- La apertura puede mostrar un hook editorial breve. El titular completo no permanece fijo sobre todo el video.

El zócalo inicial contiene sección, titular breve, fuente, logo `mediamendoza` y CTA. Cada elemento es editable y se puede ocultar individualmente. La longitud máxima y el tamaño de tipografía se adaptan al área segura; si un texto no entra, la UI debe advertirlo y requerir edición, no reducirlo hasta hacerlo ilegible.

## Perfiles y sugerencias de clips

### Hablado

- Preserva el audio original por defecto.
- Genera o importa una transcripción con marcas de tiempo.
- Muestra subtítulos editables y sincronizados.
- Propone candidatos de 20 a 45 segundos agrupando fragmentos con una idea completa. Cada candidato incluye inicio, fin, titular sugerido y motivo breve.
- El operador verifica contexto, precisión y duración antes de seleccionarlo.

### B-roll

- No requiere transcripción ni subtítulos.
- Propone candidatos con muestreo de miniaturas y cambios visuales de plano; son puntos de partida, no una decisión editorial.
- El operador selecciona duración, titular y si usa audio original o música.

Para ambos perfiles, las sugerencias deben quedar dentro de la duración del archivo fuente, no solaparse de forma accidental dentro de la misma selección y mantener una duración mínima configurable. Ante baja confianza o ausencia de señales suficientes, la herramienta muestra menos candidatos y permite crear uno manualmente; no inventa texto ni fragmentos.

## Audio y exportación

Los modos de audio son:

- `original`: conserva el audio del video.
- `musica`: silencia el original y usa una pista aportada por el operador.
- `mezcla`: combina ambas pistas con controles de volumen separados.

La composición y codificación ocurren localmente con FFmpeg en el navegador. La UI debe informar progreso, estimación de tamaño y advertencias cuando el archivo o el dispositivo pueda comprometer el procesamiento. En videos largos, el proceso se mantiene local y puede tardar; la herramienta no promete velocidad constante ni usa el Worker para subir el archivo de video.

La salida inicial es MP4 vertical 1080x1920 a 30 fps con una configuración de calidad alta. El plano principal no se amplía más allá de su resolución útil sin advertencia. La exportación genera un archivo nuevo y nunca sobrescribe la fuente.

## Errores y límites

- Archivo no compatible, sin dimensiones legibles o sin espacio/memoria suficiente: detener antes de exportar y explicar la causa.
- Sin audio: habilitar perfil b-roll o música y desactivar controles imposibles.
- Sin paquete editorial: usar los campos manuales sin bloquear el flujo.
- Sin transcripción o con baja confianza: permitir subtítulos manuales y no mostrar sugerencias habladas como fiables.
- Texto fuera de zona segura o superpuesto con subtítulos: marcar conflicto y exigir corrección antes de exportar.
- Cancelación de exportación: liberar recursos temporales y conservar la configuración del proyecto.

## Verificación

Pruebas unitarias cubren:

- adaptación del paquete editorial al modelo de zócalo, incluidos fallbacks;
- encuadre `contain`, fondo y límites de movimiento;
- ajuste de textos y cumplimiento de zonas seguras;
- estados de audio y preservación de la elección del operador;
- normalización de subtítulos y validación temporal;
- candidatos de clips dentro de duración, sin solapamientos no deseados y con fallback manual;
- validación de entrada y errores recuperables.

Además, se realizan pruebas manuales de navegador con un video hablado corto, un b-roll corto y un video largo: se verifica previsualización, audio, zócalo, subtítulos, exportación MP4 y que el archivo fuente continúe intacto. Las pruebas de exportación no deben afirmar calidad absoluta: verifican dimensiones, duración, pistas de audio esperadas y capas visibles.

## Entrega incremental

1. Base del producto: carga local, handoff, encuadre horizontal completo, zócalo editable, audio original/música/mezcla y exportación del video completo.
2. Perfil hablado: transcripción, subtítulos editables y candidatos de clips hablados.
3. Perfil b-roll: análisis local de miniaturas/cambios de plano y candidatos visuales.
4. Optimización de videos largos y controles de recuperación según evidencia de uso real.

Cada etapa mantiene la exportación completa funcional; ninguna requiere modificar `/placas`, `/placas-v2`, `/reels` o el editor abandonado salvo una integración explícitamente aprobada después.
