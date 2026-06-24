# Documentación del Módulo de Edición por Lotes

## Introducción

El módulo de edición por lotes es una herramienta para procesar múltiples imágenes simultáneamente. Permite a los usuarios realizar operaciones como redimensionado, ajuste de color, adición de texto y logos a hasta 30 imágenes a la vez, ahorrando considerablemente tiempo en la preparación de contenido visual.

## Características Principales

### 1. Procesamiento Masivo
- Capacidad para procesar hasta 30 imágenes simultáneamente
- Operaciones rápidas y eficientes en múltiples archivos
- Preservación de la proporción de aspecto original

### 2. Redimensionado
- Ajuste de dimensiones en píxeles o porcentaje
- Conservación de la relación de aspecto
- Opciones predefinidas para formatos de redes sociales

### 3. Ajustes de Color
- Control de brillo, contraste y saturación
- Ajuste de temperatura de color
- Corrección de exposición y sombras

### 4. Adición de Elementos
- Incorporación de texto personalizado
- Agregar logotipo o marca de agua
- Control de posición y tamaño del logotipo

## Interfaz de Usuario

### Secciones Principales
- **Carga de Imágenes**: Área para subir múltiples archivos
- **Configuración de Procesamiento**: Controles para ajustes
- **Previsualización**: Vista previa de cambios aplicados
- **Descarga**: Opciones para obtener imágenes procesadas

### Controles de Edición
- Controles deslizantes para ajustes de color
- Campos de entrada para dimensiones
- Botones para aplicar ajustes uniformes
- Opciones de descarga en diferentes formatos

## Funcionalidades Detalladas

### Carga de Imágenes
1. Arrastrar y soltar múltiples archivos en el área designada
2. Alternativamente, seleccionar archivos desde el explorador
3. Verificar que no se exceda el límite de 30 imágenes
4. Esperar a que se completen las cargas antes de proceder

### Configuración de Dimensiones
1. Ingresar dimensiones específicas en píxeles
2. O seleccionar un formato predefinido (Instagram, Facebook, etc.)
3. Ajustar la proporción si es necesario
4. Aplicar los cambios a todas las imágenes

### Ajustes de Color
1. Ajustar brillo con control deslizante (-100 a 100)
2. Modificar contraste en el mismo rango
3. Controlar saturación para intensidad del color
4. Aplicar correcciones de temperatura y exposición

### Adición de Texto
1. Ingresar texto que se superpondrá a las imágenes
2. Seleccionar fuente, tamaño y color del texto
3. Ajustar posición y opacidad
4. Verificar legibilidad en todas las imágenes

### Agregar Logotipo
1. Cargar archivo del logotipo o marca
2. Ajustar tamaño como porcentaje del lienzo
3. Seleccionar posición (esquinas o centro)
4. Controlar opacidad para efecto de marca de agua

## Integración con Otros Módulos

### Con el Servicio de Worker
- Se comunica con el endpoint `/proxy/image` del worker
- Procesa imágenes directamente en el navegador
- Utiliza Canvas API para manipulación de imágenes

### Con el Módulo de Placas
- Compatibilidad con formatos de imagen utilizados en placas
- Consistencia visual entre diferentes herramientas
- Uso compartido de logotipos y elementos visuales

## Configuración Técnica

### Variables y Constantes
El módulo se integra con el servicio principal de la suite Media Mendoza y utiliza las mismas configuraciones de autenticación y estilos compartidos.

### Procesamiento en Cliente
- Todo el procesamiento se realiza en el navegador
- No se suben imágenes al servidor para edición
- Uso de Canvas API para manipulación de imágenes
- Límite de 30 imágenes por operación

## Solución de Problemas

### Problemas Comunes
- **Imágenes no se procesan**: Verificar el tamaño y formato de los archivos
- **Rendimiento lento**: Reducir el número de imágenes procesadas simultáneamente
- **Calidad baja después de procesamiento**: Ajustar configuraciones de salida

### Limitaciones
- Límite de 30 imágenes por operación
- Tamaño máximo por imagen dependiendo de la RAM del cliente
- Posible lentitud en dispositivos con recursos limitados

## Seguridad

- Las imágenes se procesan localmente en el navegador
- No se suben imágenes al servidor durante la edición
- No se almacenan imágenes temporales en el servidor
- El usuario mantiene el control total de sus archivos

## Personalización

Para adaptar este módulo a otros usos:

1. Modificar los formatos predefinidos según necesidades específicas
2. Ajustar los controles de edición según los requisitos
3. Cambiar las opciones de descarga de imágenes
4. Adaptar la interfaz para diferentes tipos de contenido visual