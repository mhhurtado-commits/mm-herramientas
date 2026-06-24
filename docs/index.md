# Documentación de la Suite de Herramientas Media Mendoza

Bienvenido a la documentación completa de la Suite de Herramientas Media Mendoza, una colección integral de herramientas para la producción periodística asistida por inteligencia artificial.

## Acerca del Proyecto

La Suite de Herramientas Media Mendoza es un conjunto de aplicaciones web que ayudan a periodistas y editores en la creación, edición y distribución de contenido periodístico. La suite incluye múltiples herramientas especializadas que cubren todo el proceso de producción de contenido, desde la generación de ideas hasta la distribución en redes sociales.

## Módulos Disponibles

### [Editor de Placas](./placas.md)
Herramienta para crear imágenes personalizadas para redes sociales con diferentes plantillas, formatos y estilos.

### [Media Studio](./studio.md)
Plataforma para transcribir audios de WhatsApp o entrevistas, generar subtítulos y convertir contenido multimedia en notas escritas con IA.

### [Redes Sociales](./social.md)
Generador de contenido para Facebook, Instagram y X, con editor de reels y herramientas de gestión.

### [WhatsApp](./whatsapp.md)
Herramienta para generar mensajes personalizados tanto para grupos como para canales de WhatsApp Business, con opciones de programación.

### [Redacción](./redaccion.md)
Sistema para monitorear fuentes RSS, reformular noticias existentes, redactar contenido con IA y mantener la línea editorial.

### [Agenda](./agenda.md)
Calendario de cobertura con efemérides, eventos y ángulos periodísticos generados con IA.

### [Edición por Lotes](./bulk-image.md)
Procesador de múltiples imágenes simultáneamente para redimensionado, ajustes de color y adición de elementos.

### [Servicio de Backend](./worker.md)
Worker de Cloudflare que proporciona todas las funcionalidades de IA, transcripción y procesamiento en segundo plano.

## Características Técnicas

- Interfaz web responsiva
- Integración con inteligencia artificial (Google Gemini)
- Procesamiento en cliente para mayor privacidad
- Diseño adaptable a diferentes dispositivos
- Sistema de autenticación básico

## Requisitos del Sistema

- Navegador web moderno (Chrome, Firefox, Edge)
- Conexión a Internet
- Habilitación de JavaScript
- Para algunas funciones, acceso al micrófono

## Implementación

La suite está diseñada para funcionar como una aplicación web estática y puede alojarse en servicios como GitHub Pages, Netlify, Vercel o Cloudflare Pages.

## Personalización

Para adaptar la suite a otro medio:

1. Reemplaza los logotipos en `/assets/`
2. Actualiza los colores corporativos en `/shared/tokens.css`
3. Cambia el nombre y marca en los archivos HTML
4. Modifica la contraseña en el archivo principal

## Contribuciones

Las contribuciones son bienvenidas. Por favor, crea un fork del repositorio y envía pull requests con tus cambios.

## Licencia

Este proyecto está bajo la licencia MIT.