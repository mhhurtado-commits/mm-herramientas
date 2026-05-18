# Documentación del Módulo de WhatsApp

## Introducción

El módulo de WhatsApp es una herramienta para generar mensajes personalizados tanto para grupos como para canales de WhatsApp Business. Permite a los periodistas y editores crear contenido atractivo para estas plataformas, con opciones de programación y recordatorios automáticos.

## Características Principales

### 1. Generación de Mensajes
- Creación de mensajes para grupos de WhatsApp
- Generación de contenido para canales de WhatsApp Business
- Adaptación del contenido según el tipo de audiencia
- Integración con inteligencia artificial para mejorar la redacción

### 2. Programación de Envíos
- Sistema de programación de mensajes para envíos automáticos
- Opciones de frecuencia y horarios personalizados
- Recordatorios automáticos para contenido importante

### 3. Personalización del Contenido
- Selección de tono y estilo del mensaje
- Adaptación al público objetivo
- Integración con la línea editorial del medio

## Interfaz de Usuario

### Secciones Principales
- **Mensaje para Grupo**: Generación de contenido informal para grupos
- **Mensaje para Canal**: Contenido formal para canales de difusión
- **Programación**: Configuración de horarios y frecuencia de envíos
- **Historial**: Registro de mensajes enviados y programados

### Controles de Mensaje
- Campo de texto para ingresar la noticia o tema
- Selector de tipo de mensaje (grupo o canal)
- Botones para generar mensaje con IA
- Opciones de personalización de tono y estilo

## Funcionalidades Detalladas

### Generación de Mensajes para Grupos
1. Ingresar el tema o artículo que se desea compartir
2. Seleccionar "mensaje para grupo"
3. Personalizar el tono informal y amigable
4. Generar el mensaje con IA
5. Revisar y ajustar el contenido
6. Programar o enviar inmediatamente

### Generación de Mensajes para Canales
1. Ingresar el artículo o noticia principal
2. Seleccionar "mensaje para canal"
3. Personalizar el tono formal e informativo
4. Generar el mensaje con IA
5. Revisar y ajustar el contenido
6. Programar o enviar inmediatamente

### Programación de Mensajes
1. Seleccionar el mensaje a programar
2. Elegir la fecha y hora de envío
3. Configurar la frecuencia (diaria, semanal, etc.)
4. Establecer recordatorios si es necesario
5. Confirmar la programación

## Integración con Otros Módulos

### Con el Servicio de Worker
- Se comunica con el endpoint `/whatsapp` del worker
- Utiliza la IA para generar contenido específico
- Accede a configuraciones almacenadas en KV

### Con el Módulo de Redacción
- Posibilidad de usar artículos generados en redacción
- Integración con el contenido de la línea editorial
- Uso de fuentes y ángulos periodísticos

## Configuración Técnica

### Variables y Constantes
El módulo se integra con el servicio principal de la suite Media Mendoza y utiliza las mismas configuraciones de autenticación y estilos compartidos.

### Configuración de Prompts
- El prompt para generar mensajes se almacena en KV como `config:wa_prompt`
- Se puede personalizar según las necesidades editoriales
- El sistema utiliza Gemini 2.5 Flash Lite para generación de contenido

## Solución de Problemas

### Problemas Comunes
- **Mensajes no se generan correctamente**: Verificar la conexión con el servicio de worker
- **Problemas con la programación**: Asegurarse de tener los permisos adecuados
- **Contenido no deseado**: Ajustar los prompts y configuraciones editoriales

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

1. Modificar los prompts de IA para diferentes estilos de contenido
2. Ajustar la programación de mensajes según necesidades específicas
3. Cambiar las integraciones con otros sistemas de mensajería
4. Adaptar los templates de mensaje a otros tipos de contenido