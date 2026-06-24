# Documentación del Módulo de Worker

## Introducción

El módulo de worker es un componente fundamental de la suite Media Mendoza que maneja procesamiento en segundo plano y operaciones de inteligencia artificial. Está construido como un servicio Cloudflare Worker y proporciona múltiples funcionalidades como síntesis de voz, transcripción y procesamiento de IA.

## Características Principales

### 1. Síntesis de Voz (TTS)
- Utiliza Azure Cognitive Services para generar audio de alta calidad
- Compatible con voces en español argentino
- Soporta múltiples voces configurables (hombres y mujeres)

### 2. Procesamiento de IA
- Usa el modelo Gemini 2.5 Flash Lite de Google para generación de contenido
- Funcionalidades de redacción asistida con IA
- Generación de guiones para reels de redes sociales

### 3. Transcripción de Audio
- Utiliza Cloudflare Whisper para transcripción precisa
- Compatible con el módulo Media Studio

### 4. Almacenamiento y Caché
- Utiliza Cloudflare KV para almacenar configuraciones
- Soporta TTL (tiempo de vida) para diferentes tipos de datos
- Gestión de datos temporales y persistentes

## Configuración

### Variables de Entorno
El worker requiere varias variables de entorno para funcionar:

- `GEMINI_API_KEY`: Clave API para el modelo Gemini
- `AZURE_TTS_KEY_*`: Claves API para servicios de síntesis de voz de Azure
- `AZURE_TTS_REGION_*`: Regiones para servicios de Azure
- `CF_ACCOUNT_ID`: ID de cuenta de Cloudflare
- `CF_API_TOKEN`: Token de API de Cloudflare

### Constantes del Sistema
```javascript
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const MAX_PROXY_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
```

## Endpoints Principales

### 1. `/gemini/`
Endpoint para generación de contenido con IA, admite varios tipos de solicitudes:
- Redacción de noticias
- Generación de ángulos periodísticos
- Análisis de contenido

### 2. `/tts/`
Endpoint para síntesis de texto a voz:
- Convierte texto en archivos de audio
- Soporta diferentes voces configuradas
- Devuelve archivos de audio directamente

### 3. `/whatsapp/`
Endpoint para generación de contenido de WhatsApp:
- Creación de mensajes para grupos y canales
- Programación de envíos
- Recordatorios automáticos

### 4. `/studio/transcribe`
Endpoint para transcripción de archivos de audio/video:
- Utiliza Cloudflare Whisper
- Compatible con múltiples formatos
- Genera subtítulos y resúmenes

### 5. `/proxy/image`
Endpoint para proxy de imágenes:
- Evita problemas de CORS
- Limita el tamaño a 8MB
- Añade headers de navegador

## Funcionalidades Específicas

### Agenda y Efemérides
- Almacena eventos y efemérides en KV
- Genera ángulos periodísticos con IA
- Soporta TTL de 30 días para datos temporales

### Reel Editor
- Genera guiones para videos de redes sociales
- Configurable mediante prompt almacenado en KV
- Devuelve JSON con título y guion

### WhatsApp Business
- Genera mensajes personalizados
- Sistema de programación de envíos
- Prompt configurable para tono y estilo

## Seguridad

### CORS
El worker implementa cabeceras CORS para permitir acceso desde diferentes dominios:
```javascript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
```

### Validación de Datos
- Validación de XML para feeds RSS
- Control de tamaño de imágenes
- Autenticación opcional para ciertas operaciones

## Despliegue

Para desplegar este worker, necesitas:

1. Una cuenta en Cloudflare
2. Instalar Wrangler CLI
3. Configurar las variables de entorno
4. Ejecutar `wrangler deploy`

## Solución de Problemas

### Problemas Comunes
- Verificar que las claves API estén correctamente configuradas
- Confirmar que el límite de tamaño para imágenes se respeta
- Asegurarse de que los endpoints de Azure están accesibles

### Depuración
- Utilizar wrangler tail para observar logs en tiempo real
- Verificar las cabeceras de respuesta para CORS
- Monitorear el uso de KV para asegurar almacenamiento correcto