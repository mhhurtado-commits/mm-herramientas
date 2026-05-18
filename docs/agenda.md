# Documentación del Módulo de Agenda

## Introducción

El módulo de agenda es una herramienta para gestionar el calendario de cobertura periodística, incluyendo efemérides históricas y eventos importantes. La herramienta permite agregar eventos y ángulos periodísticos con ayuda de inteligencia artificial, facilitando la planificación de contenido editorial.

## Características Principales

### 1. Calendario de Cobertura
- Visualización mensual de eventos importantes
- Marcado de fechas conmemorativas y efemérides
- Planificación de cobertura periodística

### 2. Base de Datos de Efemérides
- Colección de eventos históricos relevantes
- Información detallada sobre fechas importantes
- Relación con acontecimientos regionales y nacionales

### 3. Ángulos Periodísticos con IA
- Generación de ángulos periodísticos para eventos
- Sugerencia de enfoques de cobertura
- Integración con inteligencia artificial para ideas creativas

### 4. Gestión de Eventos
- Adición de eventos personalizados
- Edición y eliminación de eventos existentes
- Notificaciones de eventos próximos

## Interfaz de Usuario

### Secciones Principales
- **Calendario Mensual**: Vista de mes con eventos marcados
- **Detalle de Eventos**: Información detallada sobre cada evento
- **Búsqueda**: Buscador de eventos por fechas o temas
- **Creación de Eventos**: Formulario para agregar nuevos eventos

### Controles de Agenda
- Navegación entre meses
- Botones para agregar y editar eventos
- Filtros por tipo de evento
- Opciones de exportación e impresión

## Funcionalidades Detalladas

### Navegación por Calendario
1. Visualizar el calendario mensual con eventos marcados
2. Hacer clic en una fecha para ver detalles del evento
3. Navegar entre meses con controles de flecha
4. Ir al mes actual con un botón específico

### Visualización de Efemérides
1. Carga de efemérides desde el archivo efemerides.json
2. Mostrar información histórica para cada fecha
3. Destacar eventos relevantes para la región
4. Proporcionar contexto histórico de los eventos

### Creación de Eventos
1. Seleccionar una fecha en el calendario
2. Ingresar detalles del evento (nombre, descripción, categoría)
3. Solicitar ángulos periodísticos con IA
4. Guardar el evento en la agenda

### Generación de Ángulos con IA
1. Seleccionar un evento existente
2. Solicitar ángulos periodísticos con IA
3. Revisar y seleccionar ángulos sugeridos
4. Guardar ángulos para uso futuro

## Integración con Otros Módulos

### Con el Servicio de Worker
- Se comunica con el endpoint `/agenda` del worker
- Utiliza la IA para generar ángulos periodísticos
- Almacena eventos en KV con prefijos específicos

### Con el Módulo de Redacción
- Posibilidad de crear borradores de artículos desde ángulos
- Planificación de cobertura periodística
- Integración con temas editoriales

### Con el Módulo de WhatsApp
- Generación de mensajes conmemorativos
- Difusión de eventos importantes
- Programación de contenido con antelación

## Archivo de Datos

### efemerides.json
- Base de datos local de efemérides
- Formato JSON con estructura específica
- Contiene eventos históricos organizados por fecha

```json
{
  "mes": {
    "dia": [
      {
        "evento": "descripción del evento",
        "categoria": "tipo de evento",
        "anio": "año del evento"
      }
    ]
  }
}
```

## Configuración Técnica

### Variables y Constantes
El módulo se integra con el servicio principal de la suite Media Mendoza y utiliza las mismas configuraciones de autenticación y estilos compartidos.

### Almacenamiento
- Los eventos personalizados se almacenan en el servicio de backend
- Los ángulos periodísticos tienen un TTL (tiempo de vida) de 30 días
- El archivo efemerides.json se carga localmente

## Solución de Problemas

### Problemas Comunes
- **Eventos no se muestran correctamente**: Verificar el formato del archivo efemerides.json
- **Ángulos no se generan**: Confirmar la conexión con el servicio de worker
- **Problemas de fecha**: Asegurarse de que la zona horaria sea correcta

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

1. Modificar el archivo efemerides.json con eventos locales
2. Ajustar las categorías de eventos según el tipo de medio
3. Cambiar los prompts de IA para diferentes tipos de ángulos
4. Adaptar la interfaz a las necesidades específicas del medio