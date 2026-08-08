# Sistema visual para carrusel editorial modular

## Dirección aprobada

La opción A será la base visual del carrusel. El resultado debe pertenecer a la misma familia que `/placas-v2`, pero funcionar como una secuencia editorial: cada diapositiva agrega una capa de información y mantiene continuidad visual.

## Principios

- Una idea principal por diapositiva.
- La portada presenta la noticia; las internas la explican.
- El color de sección identifica la familia sin dominar el contenido.
- La imagen tiene protagonismo, pero nunca compite con el texto esencial.
- Todos los textos deben caber sin truncarse ni invadir el pie.
- La repetición de patrones debe dar continuidad, no sensación de plantilla rígida.

## Estructura

### Portada

- Imagen principal ocupando aproximadamente 55–60% del lienzo.
- Logo de Media Mendoza sobre la imagen, en zona segura.
- Cápsula de sección con el color correspondiente.
- Titular de hasta tres líneas.
- Bajada de hasta tres líneas, con síntesis más breve que la de `/placas-v2`.
- Indicador discreto de secuencia, por ejemplo `1/5` y una invitación a deslizar.

### Diapositivas internas

Cada diapositiva tendrá un tipo editorial explícito:

- `clave`: idea central o consecuencia.
- `contexto`: explicación breve del antecedente.
- `dato`: cifra, fecha, lugar o elemento verificable destacado.
- `cita`: textual literal con autor y cargo, solo si está validada.
- `imagen`: imagen de apoyo con epígrafe breve.

La interfaz y el contrato podrán indicar el tipo, pero el renderer compartirá la misma base visual: etiqueta pequeña, título de la diapositiva, cuerpo corto, color de sección, numeración y marca.

### Cierre

- Síntesis final o consecuencia principal.
- Fuente/web.
- CTA editorial breve: `Leé la nota completa` o `Compartí esta información` según el canal.
- Sin repetir todo el titular ni saturar con hashtags dentro de la placa.

## Recursos visuales

- Fondo claro cálido o variante suave del color de sección.
- Texto oscuro de alta legibilidad.
- Cápsulas y barras de acento coherentes con `/placas-v2`.
- Tarjetas de dato con contraste moderado.
- Imágenes de apoyo con recorte configurable y foco arrastrable.
- Numeración y progresión visual discretas para reforzar el gesto de deslizar.

## Reglas editoriales

- Portada: titular máximo 3 líneas; bajada máxima 3 líneas.
- Internas: título máximo 2 líneas; cuerpo recomendado entre 2 y 5 líneas.
- Datos y citas pueden ocupar más espacio, pero nunca se recortan con puntos suspensivos.
- Si un texto no entra, se reduce su extensión editorial antes que llevar la tipografía a un tamaño ilegible.
- La IA debe elegir el tipo de diapositiva según el contenido disponible y no inventar datos ni citas.

## Integración técnica prevista

- Reutilizar tokens de color, tipografía y marca de `/placas-v2`.
- Extender el contrato compartido con una secuencia de diapositivas tipadas.
- Mantener el mismo renderer para preview y exportación PNG.
- No modificar funcionalmente `/placas`.
- Mantener separados el selector de alternativa, el tipo de placa y el formato de salida.
- Conservar compatibilidad con textos de Instagram y Facebook.

## Primera etapa de implementación

1. Modelar los tipos `clave`, `contexto`, `dato`, `cita`, `imagen` y `cierre`.
2. Rediseñar portada e internas con el sistema modular.
3. Incorporar reglas de ajuste y medición de texto.
4. Verificar una noticia con contexto de una, dos y tres líneas.
5. Comparar preview y PNG exportado.
6. Recién después sumar variantes de reel y tratamientos más experimentales.
