# Gráficos como placa principal

## Objetivo

Rediseñar el renderer de Gráficos de Visual Suite para que el gráfico sea el contenido principal de la placa. El header y el footer deben funcionar como zonas protegidas, sin superponer texto sobre el gráfico ni deformar su proporción.

## Diseño aprobado

- El canvas final conserva el formato elegido: cuadrado, horizontal, vertical o story.
- El header ocupa una franja superior fija y contiene únicamente sección, título y logo.
- El footer ocupa una franja inferior fija y contiene únicamente fuente, marca y sitio.
- El cuerpo restante se calcula como `chartSafeArea` y pertenece íntegramente al gráfico.
- Chart.js se renderiza en un canvas fuera de pantalla con las mismas proporciones que `chartSafeArea`.
- El renderer final copia ese gráfico directamente dentro de `chartSafeArea`, sin tarjeta blanca intermedia ni etiqueta adicional de “Visualización de datos”.
- El gráfico debe conservar sus etiquetas, valores, leyenda y jerarquía visual dentro de sus propios límites.

## Flujo de datos

1. El usuario selecciona formato, tipo y datos.
2. Chart.js genera el gráfico con dimensiones del área segura.
3. El renderer calcula header, cuerpo y footer.
4. Se dibuja el fondo y header.
5. Se dibuja el gráfico dentro del cuerpo, con padding propio.
6. Se dibuja el footer en su franja reservada.
7. La exportación utiliza el mismo canvas final que la preview.

## Reglas de seguridad visual

- Ningún elemento del header puede invadir `chartSafeArea`.
- Ningún elemento del gráfico puede superar sus límites.
- Ningún elemento del footer puede invadir el cuerpo.
- No se deben usar alturas CSS que deformen el canvas final.
- La preview debe respetar el aspect ratio del formato seleccionado.

## Validación

- Pruebas unitarias para los cuatro formatos y límites del área segura.
- Prueba de que la tarjeta intermedia y la etiqueta auxiliar no se renderizan.
- Prueba de exportación desde el canvas final.
- Verificación de sintaxis y regresión de Gráficos, Fútbol, Clima, Infografías y Cronología.
