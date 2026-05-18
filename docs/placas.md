# Documentación del Módulo de Placas

## Introducción

El módulo de placas es una herramienta poderosa para crear imágenes personalizadas para redes sociales. Permite a los usuarios generar contenido visual atractivo con diferentes plantillas, formatos y estilos sin necesidad de conocimientos avanzados de diseño gráfico.

## Características Principales

### 1. Formatos Soportados
- Instagram Cuadrado (1080×1080)
- Historia (1080×1920)
- Portrait (1080×1350)
- Facebook (1200×628)
- Twitter / X (1600×900)

### 2. Plantillas Disponibles
- Normal
- Moderna
- Banda
- Impacto
- Diagonal
- Verde MM
- Policiales
- Policiales Rojo
- Franja
- Franja Rojo
- Urgente
- Urgente Rojo
- Clima
- Economía
- Titular
- Minimalista

### 3. Modos Especiales
#### Modo Textual
- Para crear citas o frases destacadas
- Opciones de color y posición del panel
- Personalización del texto y autor

#### Modo Foto
- Incluye imagen circular o con otras formas
- Soporte para círculo, cuadrado, diamante y hexágono
- Personalización del borde

#### Modo Collage
- Distribución en múltiples layouts
- Soporte para 2, 3 o 4 imágenes
- Ajuste automático de composición

## Funcionalidades Avanzadas

### Control de Imagen de Fondo
- Oscurecimiento (0-100%)
- Efecto blur (0-20px)
- Control de posición horizontal y vertical

### Control de Elementos
- Posición ajustable de título, categoría y logo
- Alineación rápida (izquierda, centro, derecha, arriba, centro, abajo)
- Control de opacidad y color

### Historial y Deshacer
- Sistema de historial con capacidad para 30 estados
- Función de deshacer para revertir cambios

## Estructura del Código

### Archivos Principales
- `index.html`: Interfaz de usuario principal
- `app.js`: Lógica principal de la aplicación
- `style.css`: Estilos específicos del módulo

### Objetos Clave en app.js

#### Objeto `S` (Estado)
Contiene toda la configuración actual de la placa:
```javascript
S = {
  fmt: 'sq',           // Formato actual
  tpl: 'normal',       // Plantilla actual
  bgImg: null,         // Imagen de fondo
  title: '',           // Texto del título
  cat: '',             // Categoría
  mode: 'normal',      // Modo actual
  // ... más propiedades
}
```

#### Objeto `ELS` (Elementos)
Contiene información sobre la posición y dimensiones de los elementos visuales:
```javascript
ELS = {
  title: {x: null, y: null, w: null, h: null, visible: true},
  cat:   {x: null, y: null, w: null, h: null, visible: true},
  logo:  {x: null, y: null, w: null, h: null, visible: true},
  foto:  {x: null, y: null, w: null, h: null, visible: true}
}
```

### Funciones Importantes

#### `render()`
Función principal que redibuja la imagen completa basándose en el estado actual.

#### `setMode(mode)`
Cambia entre los modos normales y especiales (textual, foto, collage).

#### `resizeCanvas()`
Ajusta el tamaño del canvas manteniendo la proporción correcta para el formato seleccionado.

#### `defaultPos(key)`
Calcula las posiciones predeterminadas para los elementos según el formato y la plantilla.

## Personalización

### Añadir Nuevas Plantillas
Para añadir una nueva plantilla, debes agregarla al objeto `TPLS` en `app.js`:

```javascript
TPLS.nombreDeNuevaPlantilla = function(W, H) {
  // Tu código de dibujo aquí
  ctx.fillStyle = '#color';
  ctx.fillRect(0, 0, W, H);
  // Más operaciones de dibujo...
}
```

### Añadir Nuevos Formatos
Agrega nuevas entradas al objeto `FMTS`:

```javascript
const FMTS = {
  // ... formatos existentes ...
  nuevoFormato: {w: ancho, h: altura, lbl: 'Nombre del Formato'}
};
```

## Compatibilidad

El módulo de placas es compatible con navegadores modernos que soporten:
- Canvas API
- FileReader API
- Drag and drop
- CSS Grid y Flexbox
- CSS variables

## Solución de Problemas

### Las imágenes no se cargan correctamente
- Verifica que las imágenes no excedan el tamaño máximo permitido
- Asegúrate de que el tipo de archivo sea compatible (JPEG, PNG, GIF)

### El rendimiento es lento
- Reduce el nivel de blur aplicado a las imágenes de fondo
- Cierra otras pestañas del navegador si estás trabajando con muchas imágenes grandes

### Las posiciones no se guardan
- El estado se guarda temporalmente en objetos JavaScript, no persiste entre recargas
- Considera implementar almacenamiento local si necesitas persistencia