# Modelo `foto-completa` para `/placas-v2`

## Objetivo

Agregar una tercera variante sintética disponible para cualquier nota: foto a sangre, titular sintético superpuesto y logo sobre la imagen. La variante busca maximizar impacto visual sin alterar las placas actuales ni `/placas`.

## Diseño aprobado

- Tipo explícito: `foto-completa`.
- Disponible en el selector para todas las notas y secciones.
- En noticias generales, las variantes quedan: `titular-arriba` recomendada, `titular-abajo` segunda y `foto-completa` tercera.
- Usa `titulo_sintetico`, con fallback compatible a `titulo`.
- La imagen ocupa todo el lienzo y respeta el foco normalizado.
- Un degradado inferior garantiza contraste para el titular.
- El titular se ubica en la zona inferior, en blanco, con máximo de 2–3 líneas.
- El logo se superpone arriba, dentro del área segura.
- No se renderizan etiqueta, bajada ni contexto.
- Se mantienen los formatos 4:5, cuadrado, Story y landscape.

## Contrato y flujo

`placa_noticia.tipo_placa` acepta `foto-completa`. El campo `titulo` continúa siendo editorial; `titulo_sintetico` es el único texto usado por el modelo sintético. Los paquetes antiguos sin ese campo conservan el fallback existente.

El Worker incorpora el tipo al prompt y a la normalización. La interfaz muestra el modelo, permite editar el titular sintético y exporta los metadatos actuales de modelo, formato, sección, longitud y fecha.

## Límites y compatibilidad

No se modifica `/placas`, el renderer de noticia tradicional ni las variantes textual, retrato circular o editorial split. La nueva variante no depende de una validación automática de calidad de imagen: queda disponible para cualquier nota y el CM decide mediante la previsualización y el foco.

## Validación

- Normalización y fallback del nuevo tipo.
- Variante determinística tercera con el mismo `titulo_sintetico`.
- Layout seguro en 4:5, cuadrado, Story y landscape.
- Render sin etiqueta, bajada ni contexto y con imagen a sangre.
- Titular legible en 2–3 líneas.
- Prompt y respuesta del Worker.
- Regresión de todos los tipos y paquetes existentes.

