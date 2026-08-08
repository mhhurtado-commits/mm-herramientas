# Integración editorial de `/placas-v2`, `/carousel` y Reel

## Objetivo

Convertir `/placas-v2` en la entrada principal para crear salidas editoriales a partir de una URL de noticia: placas, carruseles y Reels. La noticia debe extraerse e interpretarse una sola vez, mientras que cada salida conserva su editor, renderer y exportador específicos.

`/placas` permanece sin modificaciones funcionales. `/carousel` continúa operativo durante toda la migración.

## Decisiones aprobadas

- `/placas-v2` será el orquestador de la experiencia editorial.
- La extracción y el diagnóstico editorial serán únicos por noticia.
- El paquete editorial común será la fuente de datos para placas, carrusel, Reel y copys.
- Los renderers no se fusionarán en un componente monolítico.
- La primera etapa unificará datos y flujo, no la estética de carrusel ni Reel.
- La migración de `/carousel` será progresiva mediante adaptadores.

## Arquitectura

```text
URL de noticia
      ↓
Extracción única
      ↓
Diagnóstico y paquete editorial
      ├── Placas
      ├── Carrusel
      └── Reel
```

La interfaz de `/placas-v2` tendrá tres niveles conceptuales:

1. Noticia: URL, fuente original, cuerpo e imágenes.
2. Paquete editorial: interpretación, textos, datos y elementos identificados.
3. Salidas: placa, carrusel y Reel.

La pantalla tendrá navegación entre módulos, pero cada módulo conservará sus controles específicos. No se mostrarán todos los controles de las tres salidas simultáneamente.

## Contrato editorial común

```js
{
  tipo: "noticia_editorial",
  version: 2,
  fuente: {
    url: "",
    titulo_original: "",
    categoria: "",
    cuerpo: "",
    imagen: "",
    imagenes: []
  },
  editorial: {
    seccion: "",
    familia: "",
    tipo_noticia: "",
    complejidad: "",
    tono: "",
    titulo: "",
    bajada: "",
    contexto: "",
    datos_clave: [],
    textual: [],
    personas: []
  },
  salidas: {
    placas: [],
    carrusel: null,
    reel: null
  },
  redes: {
    instagram: "",
    facebook: ""
  }
}
```

La separación entre `seccion`, `familia`, `tipo_noticia` y `salida` es obligatoria. Permite que una noticia de `Tiempo libre` use la familia visual `Actualidad`, sea de tipo `noticia` y se produzca como `textual`, sin mezclar esas decisiones.

## Generación

Se incorporará un endpoint versionado para generar el paquete editorial:

```text
POST /placas/v2/paquete
```

El cliente podrá solicitar salidas concretas:

```json
{ "salidas": ["placa"] }
```

o el paquete completo:

```json
{ "salidas": ["placa", "carrusel", "reel"] }
```

La IA interpretará la noticia una vez. Cada salida recibirá el mismo paquete y aplicará su estructura propia. No se deben duplicar prompts ni reinterpretar el cuerpo de la nota innecesariamente.

## Compatibilidad

Durante la migración:

- `/placas-v2` aceptará su contrato actual y el nuevo contrato común.
- `/carousel` conservará su contrato `article`, `diagnosis` y `slides` mediante un adaptador.
- El contrato actual de placas se adaptará hacia `editorial` y `salidas.placas`.
- `/placas` no se modifica.
- `/carousel` seguirá funcionando aunque todavía no se acceda desde `/placas-v2`.

La primera integración debe demostrar equivalencia entre el carrusel generado desde `/carousel` y el generado desde el nuevo flujo antes de reemplazar la ruta existente.

## Flujo de usuario

1. Ingresar la URL.
2. Extraer la noticia una sola vez.
3. Mostrar sección, tipo, complejidad y formatos recomendados.
4. Generar el paquete editorial.
5. Elegir Placa, Carrusel o Reel.
6. Abrir el editor específico de la salida.
7. Editar y exportar.
8. Copiar los textos para redes.

Controles por salida:

- Placas: propuesta, plantilla, formato, imagen, foco y textos.
- Carrusel: cantidad, orden, imágenes, texto por slide y exportación.
- Reel: escenas, duración, imágenes, transiciones y exportación.

## Alcance de la primera etapa

Incluye:

- contrato editorial común;
- adaptadores desde y hacia los contratos actuales;
- extracción única;
- diagnóstico único;
- generación de paquete versionado;
- navegación desde `/placas-v2` hacia las tres salidas;
- preservación del editor actual de carrusel y Reel;
- pruebas de coherencia entre salidas.

No incluye:

- rediseño visual del carrusel;
- rediseño visual del Reel;
- eliminación inmediata de `/carousel`;
- cambios funcionales en `/placas`;
- nuevos tipos de placas o nuevas familias visuales.

## Criterios de aceptación

- Una URL se extrae una sola vez.
- Placa, carrusel y Reel comparten fuente, categoría, titular y datos verificados.
- Los copys de Instagram y Facebook son coherentes con las salidas.
- Se puede solicitar una salida sin generar las otras.
- `/carousel` continúa funcionando durante la migración.
- `/placas` no presenta modificaciones funcionales.
- Una nota sin datos suficientes activa fallback determinístico.
- Las citas y personas mantienen las mismas reglas de verificación que `/placas-v2`.
- La equivalencia entre el carrusel antiguo y el nuevo flujo queda cubierta por pruebas.

## Siguiente etapa

Una vez aprobada e implementada la integración, se evaluará la estética del carrusel y del Reel con noticias reales. Esa etapa incluirá ritmo visual, portadas, jerarquía tipográfica, variedad de composiciones, movimiento, zona segura y exportación para redes.
