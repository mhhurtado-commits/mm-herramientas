# Documentación del Módulo de Redacción

## Introducción

El módulo de redacción es una herramienta integral para periodistas que permite monitorear fuentes RSS, reformular noticias existentes, redactar contenido con ayuda de IA y mantener la coherencia con la línea editorial del medio. Esta herramienta facilita la creación de contenido periodístico de calidad.

## Características Principales

### 1. Monitor RSS
- Seguimiento automático de fuentes de noticias
- Filtrado y clasificación de artículos relevantes
- Alertas sobre contenido nuevo en fuentes configuradas

### 2. Reformulación de Contenido
- Mejora del texto de noticias existentes
- Adaptación del estilo al tono del medio
- Corrección gramatical y estilística asistida por IA

### 3. Redacción Asistida con IA
- Generación de artículos desde cero
- Sugerencia de ángulos periodísticos
- Integración con la línea editorial del medio

### 4. Línea Editorial
- Mantenimiento de coherencia en el estilo
- Guías temáticas y de tono
- Referencias a políticas de redacción

## Interfaz de Usuario

### Secciones Principales
- **Monitor RSS**: Visualización de fuentes y artículos
- **Reformulador**: Herramienta para mejorar textos existentes
- **Redactor IA**: Generación de contenido desde cero
- **Línea Editorial**: Consulta de pautas y estilo del medio

### Controles de Redacción
- Campo de texto para ingresar artículos existentes
- Selector de tono y estilo
- Botones para generar, reformular o mejorar contenido
- Opciones de vista previa y exportación

## Funcionalidades Detalladas

### Monitor RSS
1. Configurar fuentes RSS de interés
2. Monitorear contenido en tiempo real
3. Filtrar artículos por temas o palabras clave
4. Marcar artículos como leídos o relevantes
5. Exportar artículos para trabajo offline

### Reformulación de Contenido
1. Pegar el texto del artículo a reformular
2. Seleccionar el tono y estilo deseado
3. Solicitar reformulación con IA
4. Comparar versiones original y reformulada
5. Aceptar o ajustar la versión reformulada

### Redacción Asistida
1. Ingresar el tema o punto de partida
2. Seleccionar categoría o sección
3. Especificar el tono y estilo requerido
4. Generar artículo con IA
5. Revisar y editar el contenido generado

### Línea Editorial
1. Consultar guías de estilo
2. Revisar vocabulario específico del medio
3. Ver ejemplos de tratamiento de temas sensibles
4. Acceder a referencias de estilo periodístico

## Integración con Otros Módulos

### Con el Servicio de Worker
- Se comunica con el endpoint `/reformular` del worker
- Utiliza la IA para generar y mejorar contenido
- Accede a configuraciones almacenadas en KV

### Con el Módulo de WhatsApp
- Posibilidad de enviar resúmenes de artículos a WhatsApp
- Generación de contenido para redes sociales desde artículos completos
- Compatibilidad con el sistema de programación

### Con el Módulo de Agenda
- Integración con eventos y efemérides
- Sugerencia de coberturas relacionadas
- Identificación de ángulos periodísticos

## Configuración Técnica

### Variables y Constantes
El módulo se integra con el servicio principal de la suite Media Mendoza y utiliza las mismas configuraciones de autenticación y estilos compartidos.

### Configuración Editorial
- Las pautas editoriales se almacenan en KV como `config:editorial`
- Se pueden personalizar según las necesidades del medio
- El sistema utiliza Gemini 2.5 Flash Lite para generación de contenido

## Solución de Problemas

### Problemas Comunes
- **Artículos no se reformulan correctamente**: Verificar la conexión con el servicio de worker
- **Problemas con fuentes RSS**: Confirmar que las URLs estén accesibles
- **Contenido no deseado**: Ajustar las preferencias editoriales

### Errores de API
- Verificar la conectividad con el servicio de worker
- Confirmar que la clave de API esté correctamente configurada
- Revisar los límites de uso del servicio de IA

## Seguridad

- Las credenciales de acceso se almacenan de forma segura
- Se utilizan tokens de autenticación con caducidad
- La comunicación con el servicio de backend se realiza mediante conexiones seguras

## Personalización

Para adaptar este módulo a otros usos:

1. Modificar las fuentes RSS para diferentes temas
2. Ajustar las pautas editoriales según el tipo de medio
3. Cambiar los prompts de IA para diferentes estilos de redacción
4. Adaptar las categorías y secciones al tipo de contenido específico