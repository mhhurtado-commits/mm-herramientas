# Editor de Entrevistas IA (`/video-editor`)

## Descripción

El Editor de Entrevistas IA es una herramienta avanzada para la edición y procesamiento de videos de entrevistas directamente en el navegador. Permite a los periodistas transcribir, editar, agregar subtítulos y exportar videos optimizados para redes sociales, todo sin enviar los archivos a servidores externos.

## Funcionalidades Principales

### Procesamiento Local
- Edición de videos completamente en el navegador
- Sin envío de archivos a servidores externos
- Uso de FFmpeg en cliente para procesamiento de video

### Transcripción Automática
- Transcripción de audio integrada
- Visualización de transcripciones en tiempo real
- Panel colapsable para revisión de texto

### Edición Avanzada
- Timeline visual para corte de segmentos
- Canvas para visualización de subtítulos
- Panel de controles para edición precisa

### Exportación
- Vista previa del video editado
- Descarga directa en formato MP4
- Optimización para plataformas sociales

## Integración con Worker

El módulo se integra con Cloudflare Workers AI para procesamiento de transcripciones y análisis de contenido. Utiliza tecnologías de vanguardia para realizar tareas de IA directamente en el navegador o con servicios de backend según sea necesario.

## Interfaz de Usuario

- Diseño responsive con panel principal y barra lateral
- Controladores de video con soporte para subtítulos
- Panel de cortes con vista previa de segmentos
- Indicadores visuales de procesamiento

## Tecnologías Utilizadas

- HTML5 Video API
- FFmpeg.wasm para procesamiento de video
- Canvas API para renderizado de subtítulos
- Web Workers para operaciones asíncronas
- CSS Grid y Flexbox para diseño responsive