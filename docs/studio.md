# Documentación del Módulo de Media Studio

## Introducción

Media Studio es una herramienta integral para la transcripción de audio y video, especialmente útil para periodistas y creadores de contenido. Permite transcribir grabaciones de entrevistas, reuniones o cualquier contenido de audio/video, y convertirlo en texto utilizable, con funcionalidades adicionales como generación de subtítulos y gestión de proyectos.

## Características Principales

### 1. Transcripción de Audio
- Utiliza el servicio Cloudflare Whisper para transcripción precisa
- Compatible con múltiples formatos de audio (MP3, WAV, WebM, etc.)
- Límite de 10MB por archivo
- Devolución de segmentos y palabras individuales

### 2. Grabación Directa
- Grabación desde el micrófono del dispositivo
- Temporizador en vivo durante la grabación
- Visualización de estado de grabación

### 3. Generación de Subtítulos
- Exportación en formatos VTT y SRT
- Edición manual de tiempos y texto de segmentos
- Control preciso sobre los tiempos de inicio y finalización

### 4. Gestión de Proyectos
- Guardado y recuperación de transcripciones
- Organización por nombre y fecha
- Listado de proyectos guardados

### 5. Integración con Redacción
- Generación de notas periodísticas a partir de transcripciones
- Envío a la herramienta de redacción para edición posterior

## Interfaz de Usuario

### Pestañas
- **Transcripción**: Área principal para subir archivos o grabar
- **Proyectos**: Lista de transcripciones guardadas previamente

### Controles de Transcripción
- Botón de subida de archivos de audio
- Botón de grabación con micrófono
- Botones para copiar texto, guardar proyecto, crear nota periodística
- Botones para exportar subtítulos en VTT/SRT

### Controles de Grabación
- Botón para iniciar la grabación
- Botón para detener la grabación
- Temporizador en vivo

## Funcionalidades Detalladas

### Transcripción de Archivos
1. Arrastrar y soltar un archivo de audio en el área designada
2. Alternativamente, hacer clic en el área para seleccionar un archivo
3. El sistema procesará el archivo con IA y mostrará el texto transcrito
4. Se muestran detalles como número de palabras y caracteres

### Grabación Directa
1. Hacer clic en el botón de micrófono para comenzar a grabar
2. El temporizador mostrará el tiempo de grabación
3. Hacer clic en el botón de detener para finalizar
4. La grabación se enviará automáticamente para transcripción

### Edición de Segmentos
1. Hacer clic en "Editar segmentos" para abrir el editor
2. Ajustar tiempos de inicio y finalización de cada segmento
3. Modificar el texto de cada segmento según sea necesario
4. Guardar los cambios realizados

### Exportación de Subtítulos
- **Formato VTT**: Compatible con HTML5 video y plataformas web
- **Formato SRT**: Compatible con la mayoría de reproductores de video
- Ambos formatos se pueden descargar directamente como archivos

## Integración con Otros Módulos

### Con Redacción
- La función "Crear nota periodística" envía la transcripción al módulo de redacción
- Utiliza la IA para reformular y estructurar el contenido
- Abre automáticamente la herramienta de redacción en una nueva pestaña

### Con el Servicio de Worker
- Se comunica con el endpoint `/studio/transcribir` del worker
- Utiliza el servicio Cloudflare Whisper para la transcripción
- Envía archivos como form-data para procesamiento

## Configuración Técnica

### Variables y Constantes
```javascript
const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
```

### Estado Principal
```javascript
let currentTranscription = {
  texto: '',        // Texto transcrito completo
  segments: [],     // Array de segmentos con tiempos
  words: [],        // Array de palabras con tiempos (si disponible)
  proyectoId: null  // ID del proyecto si está guardado
};
```

## Solución de Problemas

### Problemas Comunes
- **Archivo muy grande**: El límite es de 10MB por archivo
- **Formato no compatible**: Asegúrese de que el archivo sea de audio
- **Permiso de micrófono denegado**: Revise la configuración del navegador
- **Transcripción imprecisa**: Pruebe con archivos de mejor calidad o volumen

### Errores de API
- Verifique la conectividad con el servicio de worker
- Confirme que el endpoint de transcripción esté disponible
- Revise el estado del servicio Cloudflare Whisper

## Seguridad

- El módulo no almacena archivos de audio localmente
- La transcripción se realiza en el servicio de backend
- Los proyectos se guardan en el servicio de backend con identificadores únicos
- Los permisos de micrófono se solicitan solo cuando es necesario

## Personalización

Para adaptar este módulo a otros usos:

1. Modificar las constantes de conexión al worker
2. Ajustar los límites de tamaño de archivo
3. Cambiar el texto de las notificaciones y mensajes
4. Adaptar la integración con el módulo de redacción