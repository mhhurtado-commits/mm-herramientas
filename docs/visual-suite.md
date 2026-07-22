# Documentación del Módulo Visual Suite

## Introducción

La Visual Suite es un módulo integral de creación de contenido visual para el medio **Media Mendoza**. Integra seis herramientas especializadas —gráficos, mapas, líneas de tiempo, infografías, efemérides y editor de publicaciones— en una única interfaz con diseño unificado, exportación PNG de alta resolución y generación de contenido asistida por IA.

## Arquitectura General

### Estructura de Archivos

```
visual-suite/
├── index.html              # Interfaz principal (6 solapas, CSS embebido)
├── app.js                  # Orquestador central: tabs, logo, exportación, IA, toast
├── charts.js               # Módulo de gráficos (Chart.js)
├── maps.js                 # Módulo de mapas (Leaflet + geocodificación)
├── timeline.js             # Módulo de líneas de tiempo
├── infographics.js         # Módulo de infografías canvas
├── efemerides.js           # Módulo de efemérides del día
├── editor.js               # Módulo editor de publicaciones
├── recursos.js             # Utilidades de recursos y dibujo
├── publicacion.js          # Estado del editor de publicaciones
└── shared/
    ├── colors.js           # Paleta de colores de marca
    ├── formats.js          # Formatos de canvas (landscape, square, portrait, story)
    ├── utils.js            # Utilidades compartidas (wrap, export, logo, clipboard)
    └── canvas-helpers.js   # Helpers de canvas (footer, UI activa, guías)
```

### Capa Compartida (`shared/`)

La capa compartida elimina duplicación entre los seis módulos. Todos los módulos acceden a los objetos globales `VS_Colors`, `VS_Formats`, `VS_Utils` y `VS_CanvasHelpers`.

#### `colors.js` — Paleta de Marca
- `VS_Colors.ACCENT` (#a6ce39) — verde Media Mendoza
- `VS_Colors.INK` (#16201b) — tinta editorial oscura
- `VS_Colors.GOLD` (#c9a227) — dorado de acento
- `VS_Colors.DARK_BG` / `DARK_BG2` — fondos oscuros para placas
- `VS_Colors.CAT_COLORS` — mapa de colores por categoría (Política, Deportes, Cultura, etc.)

#### `formats.js` — Formatos de Canvas
```javascript
VS_Formats = {
  landscape: { w: 2400, h: 1350, label: 'Horizontal 16:9' },
  square:    { w: 1600, h: 1600, label: 'Cuadrado 1:1' },
  portrait:  { w: 1350, h: 1688, label: 'Vertical 4:5' },
  story:     { w: 1080, h: 1920, label: 'Historia 9:16' }
}
```

#### `utils.js` — Utilidades Compartidas
- `escHtml(str)` — Escapa HTML para inserción segura
- `hexToRgba(hex, alpha)` — Convierte HEX a RGBA
- `copiarAlPortapapeles(texto, msg)` — Copia con fallback y toast
- `wrapText(ctx, text, maxW, maxLines)` — ajuste de texto con truncado inteligente
- `drawDotGrid(ctx, W, H, color, spacing, r)` — Cuadrícula de puntos decorativa
- `drawDataBar(ctx, x, y, w, h, pct, color)` — Barra de progreso estilizada
- `splitLinea(line)` — Divide "Etiqueta: Valor"
- `dibujarLogo(ctx, W, H, overrides)` — Dibuja logo de marca en canvas
- `exportCanvasToPNG(canvas, renderFn, name, scale)` — Exporta canvas a PNG 3x con preview
- `detectarEmoji(texto)` — Detecta emoji representativo por contenido
- `cargarArchivoJSON(input, textareaId, parseFn)` — Carga archivo JSON en textarea

#### `canvas-helpers.js` — Helpers de Canvas
- `drawFooter(ctx, W, H, dark)` — Dibuja footer "Mediamendoza · Noticias confiables del sur mendocino"
- `drawActiveUI(ctx, W, H, rect)` — Dibuja borde punteado + handles de resize para bloques activos

## Módulos

### 1. Gráficos (`charts.js`)

Herramienta de visualización de datos con Chart.js.

#### Funcionalidades
- Tipos: bar, line, pie, doughnut, radar, polarArea
- Ingreso de datos: texto libre ("Etiqueta, Valor"), JSON o extracción desde URL
- Generación con Chat IA: el usuario ingresa un tema y la IA genera datos y configuración
- Fondo IA: genera imagen editorial de fondo para la placa
- Exportación PNG con marco editorial (header tinta + regla dorada + footer Media Mendoza)

#### Funciones Principales
- `actualizarGrafico()` — Redibuja el gráfico con los datos actuales
- `cambiarTipoGrafico()` — Cambia el tipo de gráfico
- `generarPromptChart()` — Genera prompt para IA
- `cargarJSONdeChat()` — Parsea JSON de la IA y aplica al gráfico
- `exportarGrafico()` — Exporta PNG con marco editorial

### 2. Mapas (`maps.js`)

Mapa interactivo con Leaflet para geolocalización de puntos de interés.

#### Funcionalidades
- Búsqueda de ubicaciones con geocodificación (Nominatim)
- Marcadores con título y descripción
- Capa de OpenStreetMap
- Exportación PNG con html2canvas + marco editorial

#### Funciones Principales
- `buscarUbicacion()` — Geocodifica dirección y agrega marcador
- `agregarMarcador()` — Agrega marcador con datos personalizados
- `limpiarMarcadores()` — Elimina todos los marcadores
- `exportarMapa()` — Exporta PNG con marco editorial

### 3. Línea de Tiempo (`timeline.js`)

Genera líneas de tiempo visuales a partir de eventos cronológicos.

#### Funcionalidades
- Ingreso de eventos: texto libre o JSON
- Generación con Chat IA: la IA genera eventos estructurados
- Formato de fecha flexible con validación (`fechaValida()`)
- Estilo editorial oscuro con colores por evento
- Touch: eventos arrastrables en mobile
- Exportación PNG con marco editorial

#### Funciones Principales
- `renderizarTimeline()` — Redibuja la línea de tiempo
- `agregarEvento()` — Agrega evento individual
- `generarPromptTimeline()` — Genera prompt para IA
- `exportarTimelineComoFlyer()` — Exporta PNG con marco

### 4. Infografías (`infographics.js`)

Genera infografías canvas con múltiples plantillas.

#### Funcionalidades
- Plantillas: destacado, lista, comparativa, pasos, datos, general
- Ingreso de datos: texto libre o JSON
- Generación con Chat IA
- Fondo IA para placas híbridas
- Canvas con aspect-ratio responsivo
- Touch: elementos arrastrables (se elevan al tocar)
- Resize dinámico: el canvas recalcula alto según contenido
- Exportación PNG de alta resolución

#### Funciones Principales
- `renderizarInfografia()` — Redibuja la infografía con la plantilla activa
- `seleccionarTemplate(tpl)` — Cambia plantilla
- `generarPromptInfografia()` — Genera prompt para IA
- `cargarJSONInfografia()` — Parsea JSON de la IA
- `exportarInfografia()` — Exporta PNG

### 5. Efemérides (`efemerides.js`)

Genera placas de efemérides del día con contenido histórico verificado.

#### Funcionalidades
- Selector de fecha
- Generación con Chat IA: busca efemérides reales verificadas
- Prompt con reglas estrictas: 75% nacionales / 25% internacionales, sin duplicados semánticos, sin efemérides de ocasión
- Máximo 2 efemérides por categoría
- Ordenamiento: relevancia para Argentina → cronológico
- Categorías: Política, Deportes, Cultura, Ciencia, Internacional, Sociedad, Espectáculos, Religión, Económica
- Bloques arrastrables y redimensionables (logo, título, body)
- Auto-expand: el bloque body se adapta al contenido sin necesidad de scroll
- Exportación PNG de alta resolución

#### Estructura de Bloques
```javascript
efeBlocks = {
  logo:  { x, y, w, h },  // Logo de marca (esquina superior derecha)
  title: { x, y, w, h },  // Título "📆 EFEMÉRIDES · fecha"
  body:  { x, y, w, h }   // Bloque de cards con efemérides
}
```

#### Persistencia
- Los bloques se guardan en `localStorage` con key `efeBlocks_{formato}`
- `loadEfeBlocks()` valida integridad antes de cargar
- `resetEfeBlocks()` limpia localStorage y restaura defaults
- `saveEfeBlocks()` solo se ejecuta al soltar el mouse/touch (no durante drag)

#### Funciones Principales
- `generarPromptEfemerides()` — Genera prompt detallado con reglas de calidad
- `cargarJSONEfemerides()` — Parsea JSON y ordena efemérides
- `ordenarEfemerides(data)` — Separa destacadas, nacionales, internacionales
- `renderizarEfemerides()` — Renderiza canvas con bloques
- `drawEfeCards(ctx, W, H, br)` — Dibuja cards individuales con wrapText
- `drawEfeTitle(ctx, W, H, tr)` — Dibuja título con fecha
- `calcEfeRequiredHeight(W)` — Calcula alto necesario para el contenido
- `exportarEfemerides()` — Exporta PNG de alta resolución

### 6. Editor de Publicaciones (`editor.js`)

Editor WYSIWYG para composiciones de publicaciones con múltiples secciones.

#### Funcionalidades
- Secciones arrastrables y reordenables
- Tipos de sección: titular, imagen, texto, cita, galería
- Exportación PNG de la composición completa

## Funcionalidades Transversales

### Exportación PNG
Todas las herramientas exportan PNG de alta resolución (3x) con:
- Fondo editorial (gradiente o imagen IA)
- Header con tinta oscura + regla dorada
- Título descriptivo
- Footer "Media Mendoza · mmherramientas.media"
- Logo de marca posicionable

### Chat IA Integrado
Cada módulo tiene una sección colapsable de Chat IA con:
- Generación de prompt estructurado
- Botón para copiar prompt al portapapeles
- Carga de JSON generado por la IA
- Validación de JSON antes de aplicar

### Fondo IA
Sistema de generación de fondos editoriales con IA:
- `generarFondoIA(titulo, contenido)` — Genera fondo con FLUX/SDXL/Pollinations
- `refinarFondoIA(instruccion)` — Refina fondo existente
- `dibujarFondoIA(ctx, W, H, overlay)` — Dibuja fondo con overlay semitransparente
- Endpoint: `/generar-imagen` y `/editar-imagen` del worker

### Logo de Marca
- Carga automática desde `../assets/logo.png`
- Arrastrable y redimensionable en todos los módulos
- Se dibuja en exports con posición y tamaño configurables
- Persiste estado (posición, tamaño, visibilidad) en `window.logoState`

### Extracción desde URL
- Endpoint: `/visual/extraer` del worker
- Extrae datos estructurados de artículos web
- Popula automáticamente gráficos, mapas, timeline e infografía

## Interfaz de Usuario

### Diseño Unificado
Cada solapa tiene:
- **Header de herramienta** (`.vs-tab-header`): Título + botones Exportar PNG / Fondo IA / Limpiar
- **Panel de controls**: Inputs, selectores, textareas para configuración
- **Chat IA colapsable** (`.vs-chat-toggle` / `.vs-chat-body`): Sección de IA con prompt + carga JSON
- **Canvas o mapa**: Área de visualización principal

### Responsive
- Grid de 2 columnas en desktop (`960px+`)
- 1 columna en mobile
- Canvas se redimensiona proporcionalmente
- Touch events delegados a `document` para drag outside canvas
- Listener `resize` recalcula canvas al rotar dispositivo

### Telemetría
- `localStorage` para bloques de efemérides y configuración de logo
- No se envían datos personales al servidor

## Endpoints del Worker

| Endpoint | Método | Descripción |
|---|---|---|
| `/visual/extraer` | POST | Extrae datos estructurados de una URL |
| `/generar-imagen` | POST | Genera imagen con FLUX/SDXL/Pollinations |
| `/editar-imagen` | POST | Refina imagen existente con instrucción |

Worker URL: `https://mm-herramientas-worker.mhhurtado.workers.dev`

## Dependencias Externas

- **Chart.js** 4.4.7 — Gráficos interactivos
- **Leaflet** 1.9.4 — Mapas interactivos
- **html2canvas** 1.4.1 — Captura de elementos DOM
- **Google Fonts** — Inter (UI) + DM Serif Display (títulos)

## Solución de Problemas

### El canvas no se renderiza
- Verificar que las fuentes estén cargadas (`document.fonts.ready`)
- Comprobar que el canvas tenga dimensiones mayores a 0

### La exportación PNG sale en blanco
- Asegurar que `exportCanvasToPNG` reciba una función de renderizado válida
- Verificar que el canvas no esté en modo `display: none`

### Los bloques de efemérides no se ven
- Ejecutar `resetEfeBlocks()` desde la consola para limpiar localStorage
- Verificar que `efeBlocks` tenga las tres claves: `title`, `body`, `logo`

### El mapa no carga
- Verificar conexión a internet (Leaflet carga tiles de OpenStreetMap)
- Comprobar que html2canvas esté cargado para exportación

### La IA no genera contenido
- Verificar que el endpoint del worker esté disponible
- Revisar la consola del navegador para errores de red
- Copiar el prompt manualmente y pegarlo en Gemini Chat
