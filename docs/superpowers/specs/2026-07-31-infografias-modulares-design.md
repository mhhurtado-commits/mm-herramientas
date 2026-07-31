# Diseño: Infografías modulares para Visual Suite

## Objetivo

Evolucionar el módulo de Infografías desde un renderizador basado en líneas de texto hacia un sistema editorial modular. La infografía debe poder combinar datos destacados, comparaciones, barras, porcentajes, rankings, pasos e información de fuente sin perder la identidad visual de Media Mendoza.

La experiencia debe seguir siendo simple para el uso cotidiano: el formato actual de líneas continúa funcionando como entrada rápida y se transforma internamente al nuevo modelo de bloques.

## Alcance

Incluye:

- Nuevo modelo JSON enriquecido por bloques.
- Compatibilidad con el JSON y el texto actuales.
- Validación y normalización de datos antes del render.
- Plantillas visuales adaptadas al tipo de contenido.
- Bloques con jerarquía editorial, iconos, barras, anillos, líneas y elementos decorativos.
- Ajuste automático de texto y prevención de desbordes.
- Fuente visible y diferenciada en la composición.
- Exportación PNG conservando el mismo resultado del editor.
- Edición y movimiento de bloques principales cuando sea viable dentro del canvas actual.

No incluye en esta etapa:

- Editor vectorial libre completo.
- Edición de cada palabra como objeto independiente.
- Generación automática de gráficos desde cualquier tipo de tabla compleja.
- Sustitución del sistema de fondos IA.

## Modelo de datos

El formato recomendado será:

```json
{
  "titulo": "Tráfico en Mendoza",
  "bajada": "Cómo cambió la movilidad durante 2026",
  "fuente": "Dirección de Estadísticas",
  "fecha": "31 de julio de 2026",
  "template_sugerido": "datos",
  "color_principal": "#a6ce39",
  "color_secundario": "#16201b",
  "bloques": [
    {
      "tipo": "dato",
      "icono": "🚗",
      "etiqueta": "Vehículos registrados",
      "valor": "1,2 M",
      "detalle": "+4,8% interanual",
      "color": "#a6ce39"
    },
    {
      "tipo": "barra",
      "etiqueta": "Distribución",
      "items": [
        { "nombre": "Autos", "valor": 62 },
        { "nombre": "Motos", "valor": 24 },
        { "nombre": "Camiones", "valor": 14 }
      ]
    }
  ]
}
```

Tipos iniciales:

- `dato`: número o valor principal con etiqueta, detalle e icono.
- `barra`: distribución horizontal de categorías con valores porcentuales.
- `comparacion`: dos o más valores enfrentados.
- `ranking`: lista ordenada con posición, valor e icono.
- `pasos`: secuencia numerada con líneas de conexión.
- `texto`: bloque editorial breve para contexto o explicación.
- `fuente`: bloque final generado automáticamente a partir de `fuente`.

Los campos desconocidos se ignoran. Los bloques inválidos se omiten con una advertencia visible, sin romper toda la placa.

## Compatibilidad

Se mantendrán tres entradas:

1. Texto libre actual: cada línea se convierte en un bloque `dato` o `texto` según tenga formato `Etiqueta: valor`.
2. JSON actual: `lineas` se normaliza al modelo nuevo y se respeta `template_sugerido`, colores y título.
3. JSON modular: se valida y se renderiza directamente.

La normalización será independiente del canvas para poder probarla sin navegador y evitar que cada plantilla tenga que interpretar formatos diferentes.

## Sistema visual

La identidad común será:

- Header compacto con marca, sección y título.
- Fondo con gradiente, textura geométrica sutil y profundidad mediante transparencias.
- Tarjetas con contraste, bordes suaves y acentos de color.
- Tipografía Inter para datos y DM Serif Display para titulares editoriales.
- Verde Media Mendoza como acento principal y dorado como color auxiliar.
- Iconos grandes, consistentes y con fallback de emoji cuando no exista un icono específico.
- Fuente en un bloque final legible, nunca mezclada con los datos principales.

Plantillas:

- `simple`: composición editorial de bloques heterogéneos, recomendada como plantilla general.
- `datos`: foco en uno o varios datos destacados con barras y porcentajes.
- `comparativa`: dos columnas con valores equivalentes y contraste visual.
- `listado`: ranking o lista vertical con línea guía y numeración.
- `pasos`: secuencia horizontal o vertical según el formato.
- `destacado`: un dato dominante acompañado por contexto y elementos decorativos.

La plantilla sugerida por IA solo cambia la selección inicial; el usuario podrá cambiarla manualmente.

## Flujo de funcionamiento

1. El usuario escribe un tema, carga texto o pega JSON.
2. La aplicación detecta el formato y lo normaliza.
3. Se validan tipos, valores, colores, cantidad de bloques y textos.
4. Se elige la plantilla sugerida o la seleccionada manualmente.
5. El motor calcula una grilla según formato y cantidad de bloques.
6. Cada bloque se dibuja con límites internos, ajuste de texto y fallback visual.
7. La fuente se agrega al pie y se reserva espacio antes de renderizar.
8. El mismo render se usa para vista previa y exportación PNG.

## Manejo de errores

- JSON inválido: mensaje específico sin borrar el contenido anterior.
- JSON válido pero sin bloques: mensaje de estructura incompleta.
- Valores no numéricos en barras: se muestran como texto y no generan geometría inválida.
- Más bloques que el espacio disponible: se limita la cantidad y se informa el criterio.
- Texto demasiado largo: se ajusta a líneas y se reduce la fuente hasta un mínimo legible.
- Color inválido: se usa la paleta de marca.
- Fuente ausente: se muestra `Fuente no especificada` y se marca para revisión.

## Pruebas

Se agregarán pruebas para:

- Normalización del texto actual.
- Normalización del JSON actual.
- Normalización del JSON modular.
- Validación de cada tipo de bloque.
- Fallback de iconos y colores.
- Cálculo de grilla para los cuatro formatos.
- Limitación y ajuste de texto sin desbordes.
- Presencia de fuente en el resultado normalizado.
- Render compartido entre vista previa y exportación.

La verificación visual se hará con al menos un ejemplo de cada plantilla en formato cuadrado y story, que son los formatos más sensibles para redes sociales.

## Criterio de aceptación

El módulo estará listo cuando un JSON modular con al menos tres tipos de bloque pueda cargarse, visualizarse y exportarse sin desbordes; cuando el texto y JSON antiguos sigan funcionando; y cuando la placa tenga una jerarquía visual claramente superior a la versión actual, con iconos, gráficos, líneas y profundidad sin perder legibilidad.
