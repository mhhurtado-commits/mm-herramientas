# Documentación del Módulo de Resumen

## Introducción

El módulo de resumen es una herramienta para crear resúmenes diarios de noticias destinados a ser distribuidos por WhatsApp y redes sociales. Permite a los periodistas seleccionar noticias relevantes y generar contenido atractivo y conciso para diferentes canales de distribución.

## Características Principales

### 1. Compilación de Noticias
- Selección de artículos de diferentes fuentes
- Organización por categorías y relevancia
- Creación de resúmenes personalizados

### 2. Generación Automática
- Creación de resúmenes con inteligencia artificial
- Adaptación del contenido a diferentes formatos
- Sugerencia de titulares y descripciones

### 3. Distribución Multiplataforma
- Adaptación para WhatsApp
- Formato optimizado para redes sociales (Instagram, Facebook)
- Opciones de personalización según plataforma

### 4. Editor de Reels
- Creación de videos con subtítulos
- Efectos visuales y estilos personalizados
- Sincronización de texto con audio

## Interfaz de Usuario

### Secciones Principales
- **Selección de Noticias**: Lista de artículos para incluir en el resumen
- **Editor de Contenido**: Área para editar y personalizar los resúmenes
- **Previsualización**: Vista previa del contenido en diferentes formatos
- **Opciones de Distribución**: Configuración para diferentes plataformas

### Controles de Edición
- Botones para seleccionar noticias
- Campos de texto para personalizar resúmenes
- Opciones de formato y estilo
- Herramientas de edición de subtítulos para reels

## Funcionalidades Detalladas

### Selección de Noticias
1. Importar noticias desde diferentes fuentes
2. Filtrar por categorías o palabras clave
3. Seleccionar artículos para el resumen diario
4. Priorizar noticias según relevancia

### Personalización del Contenido
1. Editar titulares y resúmenes
2. Ajustar el tono y estilo del contenido
3. Agregar comentarios o contexto adicional
4. Verificar la coherencia con la línea editorial

### Generación de Contenido para WhatsApp
1. Seleccionar noticias para el resumen de WhatsApp
2. Adaptar el formato al estilo de conversación
3. Incluir enlaces a artículos completos
4. Programar envío si se desea

### Editor de Reels
1. Importar audio o video base
2. Generar subtítulos automáticamente o ingresar manualmente
3. Personalizar apariencia de texto y fondos
4. Ajustar sincronización entre audio y texto
5. Exportar video finalizado

## Integración con Otros Módulos

### Con el Servicio de Worker
- Se comunica con el endpoint `/gemini` del worker para generación de contenido
- Utiliza la IA para crear resúmenes y sugerencias
- Accede a configuraciones almacenadas en KV

### Con el Módulo de Redacción
- Importar artículos generados en el módulo de redacción
- Mantener consistencia con la línea editorial
- Reutilizar ángulos periodísticos

### Con el Módulo de WhatsApp
- Distribución directa de resúmenes a grupos o canales
- Formateo específico para el estilo de WhatsApp
- Programación de envíos

## Configuración Técnica

### Variables y Constantes
El módulo se integra con el servicio principal de la suite Media Mendoza y utiliza las mismas configuraciones de autenticación y estilos compartidos.

### Editor de Reels
- Utiliza la librería de subtítulos TikTok real para efectos de texto
- Soporta importación/exportación en formatos VTT/SRT
- Integración con fuentes personalizadas (BebasNeue)

## Solución de Problemas

### Problemas Comunes
- **Resúmenes no se generan correctamente**: Verificar la conexión con el servicio de worker
- **Problemas con subtítulos en Reels**: Confirmar que los archivos de audio sean compatibles
- **Formato incorrecto para WhatsApp**: Revisar las directrices de contenido

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

1. Modificar las fuentes de noticias según necesidades específicas
2. Ajustar los parámetros de IA para diferentes estilos de resumen
3. Cambiar los formatos de salida para otras plataformas
4. Adaptar las opciones de distribución a otros canales de comunicación