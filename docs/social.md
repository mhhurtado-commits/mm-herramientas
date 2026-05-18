# Documentación del Módulo de Redes Sociales

## Introducción

El módulo de redes sociales es una herramienta integral para crear contenido optimizado para distintas plataformas sociales como Facebook, Instagram y X (Twitter). Incluye funcionalidades para generar publicaciones atractivas y un editor de reels con subtítulos y música.

## Características Principales

### 1. Generación de Contenido
- Creación de publicaciones para Facebook, Instagram y X
- Adaptación automática del contenido según la plataforma
- Optimización del texto para cada red social

### 2. Editor de Reels
- Herramienta para crear reels con subtítulos
- Selección de música para acompañar el video
- Opciones de estilo y apariencia de los subtítulos

### 3. Personalización del Contenido
- Selección de tono y estilo del mensaje
- Adaptación al público objetivo
- Integración con inteligencia artificial para generar variaciones

## Interfaz de Usuario

### Secciones Principales
- **Contenido Social**: Generación de posts para redes sociales
- **Editor de Reels**: Herramienta para crear videos con subtítulos
- **Configuración de Música**: Selección de banda sonora para los reels

### Controles de Publicación
- Selección de plataforma (Facebook, Instagram, X)
- Previsualización del contenido
- Opciones de programación de publicación
- Integración con las APIs de cada plataforma

## Funcionalidades Detalladas

### Generación de Contenido para Redes
1. Ingresar el tema o artículo que se desea compartir
2. Seleccionar la plataforma objetivo
3. Personalizar el tono y estilo del mensaje
4. Generar la publicación con IA
5. Previsualizar y ajustar el contenido
6. Programar o publicar directamente

### Editor de Reels
1. Cargar un video o seleccionar uno existente
2. Activar el modo de subtítulos
3. Generar subtítulos automáticamente o ingresarlos manualmente
4. Seleccionar música de la biblioteca disponible
5. Ajustar sincronización entre audio y subtítulos
6. Previsualizar y descargar el reel final

### Selección de Música
- Biblioteca de música libre de derechos
- Categorías de música según el tono del contenido
- Sincronización automática con la duración del video

## Integración con Otros Módulos

### Con el Servicio de Worker
- Se comunica con el endpoint `/tts` para generar audio
- Utiliza la IA para crear subtítulos y guiones
- Envía archivos de video y audio al servicio de backend

### Con el Módulo de Placas
- Posibilidad de generar imágenes para acompañar los posts
- Consistencia visual entre diferentes tipos de contenido
- Uso compartido de elementos gráficos y logotipos

## Configuración Técnica

### Variables y Constantes
El módulo se integra con el servicio principal de la suite Media Mendoza y utiliza las mismas configuraciones de autenticación y estilos compartidos.

### Estado Principal
El estado se mantiene en el cliente durante la sesión activa, con posibilidad de guardar borradores en el servicio backend.

## Solución de Problemas

### Problemas Comunes
- **Errores de carga de videos**: Verificar el tamaño y formato del archivo
- **Problemas de sincronización de subtítulos**: Ajustar manualmente los tiempos
- **Problemas de autenticación con redes sociales**: Revisar credenciales y permisos

### Errores de API
- Verificar la conectividad con el servicio de worker
- Confirmar que las credenciales de las redes sociales estén actualizadas
- Revisar los límites de uso de las APIs externas

## Seguridad

- Las credenciales de las redes sociales se almacenan de forma segura
- Se utilizan tokens de acceso con caducidad
- La comunicación con APIs externas se realiza mediante conexiones seguras

## Personalización

Para adaptar este módulo a otros usos:

1. Modificar las plantillas de contenido para diferentes estilos
2. Ajustar las integraciones con redes sociales según sea necesario
3. Cambiar la biblioteca de música por otra colección
4. Adaptar los formatos de salida para diferentes plataformas