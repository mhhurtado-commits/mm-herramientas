# Carrusel: imágenes interiores protagonistas

## Alcance

Mejorar `/carousel` sin modificar `/placas`, `/placas-v2` ni `/reels`.

## Diseño

- El cover conserva su imagen principal.
- Las escenas internas con `supportImage` muestran la imagen como bloque protagonista, con texto adaptado al espacio restante.
- Las escenas internas sin imagen usan una composición exclusivamente textual de área amplia.
- La UI permite cargar o quitar una imagen manual por escena.
- La imagen manual tiene prioridad sobre la imagen derivada del contrato.
- Las imágenes horizontales usan el tratamiento seguro ya existente: imagen completa o recorte con foco, sin cortes destructivos.
- El cierre continúa sin imagen.

## Implementación focalizada

1. Extender el modelo/UI de escena para carga manual y eliminación.
2. Ajustar la conversión para conservar la selección manual sin pisarla al regenerar.
3. Ajustar el renderer de internas para separar variantes con y sin imagen.
4. Agregar tests de prioridad de imagen manual, render protagonista y fallback textual.

## Verificación

- Tests focalizados y suite existente de `/carousel`.
- `git diff --check`.
- Confirmar que no haya cambios en `/placas`, `/placas-v2` ni `/reels`.
