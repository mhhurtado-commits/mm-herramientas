# Documentación de la Estructura de la Aplicación

## Introducción

Esta suite de herramientas está diseñada para ayudar a periodistas y editores de medios a producir contenido de calidad con la ayuda de inteligencia artificial. La aplicación está construida principalmente con tecnologías web estándar (HTML, CSS, JavaScript) y está organizada en diferentes módulos temáticos.

## Arquitectura General

La aplicación sigue un patrón de diseño modular donde cada herramienta reside en su propio directorio con sus recursos específicos, mientras comparte recursos comunes a través de directorios como `shared/` y `assets/`.

```
proyecto/
├── assets/                 # Imágenes, logotipos, tipografías locales
├── shared/                 # Estilos y componentes compartidos
├── [modulo]/               # Cada herramienta en su directorio
│   ├── index.html          # Interfaz de usuario específica
│   ├── app.js              # Lógica del módulo
│   └── style.css           # Estilos específicos del módulo
└── index.html              # Interfaz principal de la suite
```

## Componentes Compartidos

### Recursos Comunes (shared/)

El directorio `shared/` contiene componentes que se utilizan en múltiples partes de la aplicación:

- `tokens.css`: Define variables CSS compartidas como colores corporativos, tipografías y estilos base.

### Recursos de Assets

Directorio `assets/` contiene recursos multimedia compartidos:

- Logotipos en diferentes formatos
- Tipografías locales
- Otros recursos gráficos

## Módulos Individuales

### Editor de Placas

Directorio: `/placas`

Este módulo permite crear imágenes personalizadas para redes sociales con diferentes plantillas y estilos. Tiene funcionalidades avanzadas como:

- Edición visual en tiempo real
- Diferentes formatos para distintas redes sociales
- Modos especiales (texto, collage, foto circular)
- Personalización de elementos (títulos, categorías, logotipos)

### WhatsApp

Directorio: `/whatsapp`

Generador de mensajes para grupos y canales de WhatsApp Business con programación y recordatorios automáticos.

### Contenido Social

Directorio: `/social`

Crea contenido adaptado para diferentes plataformas sociales (Facebook, Instagram, X) con herramientas específicas para cada plataforma.

### Redacción

Directorio: `/redaccion`

Herramienta de monitoreo de fuentes RSS, reformulación de contenido y redacción asistida con IA.

### Media Studio

Directorio: `/studio`

Permite transcribir audios, generar subtítulos y convertir contenido multimedia en notas escritas con la ayuda de IA.

### Resumen

Directorio: `/resumen`

Compila información diaria de diferentes fuentes y genera resúmenes personalizados para distribuir en diferentes canales.

### Agenda

Directorio: `/agenda`

Calendario con efemérides y eventos importantes con sugerencias de cobertura periodística.

### Editor por Lotes

Directorio: `/bulk-image`

Procesa múltiples imágenes simultáneamente con ajustes de tamaño, color, texto y logotipos.

## Seguridad

La aplicación implementa una capa básica de seguridad con autenticación por contraseña almacenada en localStorage. La contraseña predeterminada se puede cambiar modificando el código fuente.

## Personalización

Para personalizar la suite para otro medio:

1. Reemplaza los logotipos en `/assets/`
2. Actualiza los colores corporativos en `/shared/tokens.css`
3. Cambia el nombre y marca en los archivos HTML
4. Modifica la contraseña en el archivo principal

## Despliegue

La aplicación está diseñada para funcionar como una aplicación web estática y puede alojarse en servicios como:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages (como se menciona en el código)

## Tecnologías Utilizadas

- HTML5
- CSS3 (con variables personalizadas)
- JavaScript moderno (ES6+)
- Canvas API para manipulación de imágenes
- Web Workers para procesamiento en segundo plano
- APIs de Google Gemini para funcionalidades de IA