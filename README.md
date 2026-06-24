# Suite de Herramientas Media Mendoza

Este es un conjunto integral de herramientas desarrolladas para facilitar la producción periodística con inteligencia artificial. La suite incluye múltiples herramientas para generar contenido, editar imágenes y gestionar publicaciones en redes sociales.

## Estructura del Proyecto

```
proyecto/
├── assets/                 # Recursos comunes (logos, tipografías, etc.)
├── shared/                 # Recursos compartidos entre herramientas
│   └── tokens.css          # Variables CSS compartidas
├── placas/                 # Editor visual de placas para redes sociales
│   ├── index.html
│   ├── app.js              # Lógica del editor de placas
│   └── style.css
├── whatsapp/               # Generador de mensajes de WhatsApp
│   └── index.html
├── social/                 # Contenido para redes sociales
│   ├── index.html
│   └── reel-editor.js
├── redaccion/              # Herramientas de redacción
│   └── index.html
├── studio/                 # Transcripción y edición de audio/video
│   ├── index.html
│   └── studio.js
├── resumen/                # Generador de resúmenes
│   ├── index.html
│   └── reel-editor.js
├── agenda/                 # Calendario de eventos y efemérides
│   ├── index.html
│   └── efemerides.json
├── bulk-image/             # Editor de imágenes por lotes
│   ├── index.html
│   └── bulk-editor.js
├── video-editor/           # Editor de entrevistas con IA
│   ├── index.html
│   └── editor.js
├── worker/                 # Servicio de procesamiento en segundo plano
│   └── worker.js
├── docs/                   # Documentación detallada de la suite
│   ├── index.md            # Índice de la documentación
│   ├── estructura-app.md   # Documentación de la estructura de la aplicación
│   ├── placas.md           # Documentación del módulo de placas
│   ├── studio.md           # Documentación del módulo de Media Studio
│   ├── social.md           # Documentación del módulo de redes sociales
│   ├── whatsapp.md         # Documentación del módulo de WhatsApp
│   ├── redaccion.md        # Documentación del módulo de redacción
│   ├── agenda.md           # Documentación del módulo de agenda
│   ├── bulk-image.md       # Documentación del módulo de edición por lotes
│   ├── resumen.md          # Documentación del módulo de resumen
│   ├── video-editor.md     # Documentación del módulo de editor de video
│   └── worker.md           # Documentación del módulo de worker
└── index.html              # Página principal de la suite
```

## Características Principales

### Editor de Entrevistas IA (`/video-editor`)
- Edición de videos de entrevistas directamente en el navegador
- Transcripción automática de audio
- Herramientas de corte y edición precisas
- Generación de subtítulos automáticos
- Exportación de videos optimizados para redes sociales

### Editor de Placas (`/placas`)
- Editor visual para crear imágenes para redes sociales
- 16 plantillas diferentes disponibles
- Modo collage para combinar múltiples imágenes
- Modo textual para citas y frases
- Modo foto con imagen circular

### Mensajes de WhatsApp (`/whatsapp`)
- Generador de mensajes para grupos y canales de WhatsApp
- Programación de envíos con recordatorios automáticos

### Contenido Social (`/social`)
- Generador de contenido para Facebook, Instagram y X (Twitter)
- Editor de reels con subtítulos y música

### Redacción (`/redaccion`)
- Monitor RSS para seguimiento de fuentes
- Reformulación de notas
- Redacción asistida con IA
- Integración con línea editorial

### Media Studio (`/studio`)
- Transcripción de audios de WhatsApp o entrevistas
- Generación de subtítulos
- Creación de notas con IA

### Resumen Diario (`/resumen`)
- Compilación diaria de noticias
- Generación de contenido para WhatsApp y redes sociales

### Agenda (`/agenda`)
- Calendario de eventos
- Efemérides históricas
- Ángulos periodísticos sugeridos por IA

### Editor por Lotes (`/bulk-image`)
- Procesamiento de hasta 30 imágenes simultáneamente
- Redimensionado, ajuste de color, texto y logotipos

## Documentación

Para información más detallada sobre cada módulo y su funcionamiento, consulta nuestra [documentación completa](./docs/index.md).

## Tecnologías Utilizadas

- HTML5
- CSS3 (con variables personalizadas)
- JavaScript (ES6+)
- Google Gemini AI API
- Service Workers
- Canvas API para manipulación de imágenes
- FFmpeg.wasm para procesamiento de video

## Instalación y Uso

Simplemente abre el archivo [index.html](file:///c%3A/Users/Miguel/Documents/New%20project/index.html) en tu navegador web moderno. No requiere instalación adicional ni servidor local.

La aplicación utiliza un sistema de autenticación simple basado en contraseña almacenada localmente en el navegador.

## Personalización

Para personalizar la suite:

1. Cambia la contraseña predeterminada en el archivo principal [index.html](file:///c%3A/Users/Miguel/Documents/New%20project/index.html)
2. Modifica los tokens de diseño en [/shared/tokens.css](file:///c%3A/Users/Miguel/Documents/New%20project/shared/tokens.css)
3. Añade tus propios logotipos en [/assets/](file:///c%3A/Users/Miguel/Documents/New%20project/assets/)
4. Personaliza las plantillas en [/placas/app.js](file:///c%3A/Users/Miguel/Documents/New%20project/placas/app.js)

## Seguridad

- El acceso está protegido por una contraseña simple
- Los datos sensibles se almacenan localmente en el navegador
- Se recomienda usar detrás de autenticación adicional en entornos de producción

## Contribuciones

Las contribuciones son bienvenidas. Por favor, crea un fork del repositorio y envía pull requests con tus cambios.

## Licencia

Este proyecto está bajo la licencia MIT.