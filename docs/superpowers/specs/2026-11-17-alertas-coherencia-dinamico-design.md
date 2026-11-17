# Diseño — Alertas: coherencia con efemérides + layout dinámico (`/alertas/`)

**Fecha:** 2026-11-17
**Estado:** Aprobado en sesión de brainstorming (secciones con el usuario)
**Alcance:** solo `/alertas/`. `/efemerides/`, el hub, `/placas-v2/` y `worker/worker.js` quedan intactos.

## Contexto

La placa de alertas quedó publicada y funciona, pero el formato comprimido se ve vacío: mucho aire en el medio y header/footer chicos. Además, efemérides (`/efemerides/`) y alertas son dos herramientas del mismo medio publicadas juntas y se veían como medios distintos (fondos, acentos, tipografías y footers sin relación). Este spec cubre dos cambios aprobados:

1. **Coherencia editorial** con efemérides (sin que sean iguales).
2. **Layout dinámico** del cuerpo según la cantidad de contenido, para llenar el lienzo.

## Decisiones de unificación (efemérides ↔ alertas)

| Eje | Antes (alertas) | Decisión |
| --- | --- | --- |
| Fondo de placa | gradiente verde-negro `#10130f→#0a0c09` | `#0F1520` plano, idéntico al fondo de efemérides |
| Acento | `#f5c518` | se conserva `#f5c518` (firma de urgencia de alerta). Efemérides conserva su dorado `#C8A24A`. Diferencia deliberada |
| Neutros | `#f5f5ec` / `#a7a896` | crema `#F5F1E6` y atenuado `rgba(245,241,230,.78)` (idénticos a efemérides); regla fina `rgba(245,241,230,.25)` |
| Tipografía display | Arial Black | **Oswald 700** (titular, caps) y **Oswald 600** (chip ALERTA, etiquetas de zona, columna derecha del footer). Cuerpo y byline en Inter. Arial Black desaparece |
| Fuentes | `<link>` Google Fonts (Inter) | Fuentes **locales** (`assets/Inter-Variable.woff2`, `assets/Oswald-Variable.woff2`) cargadas con `FontFace`, como efemérides |
| Borde exterior | borde amarillo redondeado | se conserva (firma de urgencia) |

## Diseño de la placa

Estructura vertical (de arriba hacia abajo), lienzo completo:

1. **Borde exterior** amarillo (sin cambios de valor relativo).
2. **Banda header (fija, más grande que hoy):** chip `ALERTA` relleno amarillo (texto `#141414`, Oswald 600, ~1.3× el tamaño actual) a la izquierda; logo Media Mendoza a la derecha (mismo asset); fecha `17/11 · 20:08` Oswald 600, acento, debajo del logo a la derecha. Debajo de toda la banda, **regla 4px full-width en acento amarillo** (el patrón de efemérides con el acento de alerta).
3. **Titular** (Oswald 700, caps, crema; tamaño base `W * 0.06`).
4. **Byline** fuente/radar (Inter 700, caps, acento) como hoy.
5. **Cuerpo dinámico** (ver algoritmo abajo): bloques de zona (1–3, `AFECTANDO AHORA` / `EN RUTA` / `PRÓXIMO`) + banner ETA rojo si el parte lo trae.
6. **Footer (fijo, más grande que hoy), patrón efemérides de 3 columnas**, entre regla fina 2px arriba:
   - izquierda: `FUENTE: <fuente>` (Inter, atenuado)
   - centro: `WWW.MEDIAMENDOZA.COM` (Oswald 600, crema)
   - derecha: `ALERTA DE TORMENTAS` (Oswald 600, acento)
   - el `MEDIA MENDOZA` de texto desaparece del footer (el logo ya está en el header); la fecha·hora vive en el header y no se repite.

El banner ETA (`#c0392b`, texto blanco) se conserva; es semántica de peligro compartida del medio, no de marca.

## Cuerpo dinámico — algoritmo

El cuerpo llena la altura restante entre el byline y el top del footer.

```
disponible = H - padInferior - y          // y = fin del byline
natural    = Σ alto(celda_i a tamaños base) + Σ gaps + alto_eta (si data.eta)
factor     = clamp(disponible / natural, PISO=0.55, TOPE=2.4)
```

`factor` multiplica uniformemente: tipografía del cuerpo y de las etiquetas, `padV`, `labelH`, alto de línea (`bodyLH`), gaps entre bloques, tamaño y grosor de la barra izquierda, pill `→ ESTE` (tamaño y tipografía) y tipografía/padding del banner ETA.

Propiedades garantizadas:

- **Nunca se corta un bloque**: con 3 celdas largas + ETA, `factor < 1` encoge el cuerpo hasta entrar (hoy el render abandona celdas silenciosamente con `break`; ese camino desaparece).
- **Sin aire muerto**: con 1 celda, `factor > 1` agranda tipografía y paneles hasta llenar; residual de redondeo despreciable.
- **Determinista e independiente de la IA**: depende solo de `data` en el momento del render; funciona igual en los 3 formatos (1:1, 4:5, 9:16).
- Titular y byline quedan anclados bajo la banda; el cuerpo arranca debajo del byline.

## Cambios concretos en código

- `alertas/renderer.mjs`: reemplazo de la paleta de fondo/neutros, `Arial Black` por Oswald, banda header con regla 4px, footer de 3 columnas, y el algoritmo de escalado del cuerpo. `FORMATS` y el orden de dibujo no cambian.
- `alertas/index.html`: se **elimina** el `<link>` a Google Fonts; ambas fuentes se cargan con `FontFace` desde assets locales (mismo mecanismo y rutas que efemérides: `assets/Inter-Variable.woff2`, `assets/Oswald-Variable.woff2`).
- `alertas/app.mjs`: cargar Oswald además de Inter (si se usa FontFace) y re-render cuando las fuentes estén listas (mismo patrón que efemérides).
- Sin cambios al worker, al caption, al formulario ni a la lógica de validación.

## Verificación

- **Tests nuevos** (`renderer` con un `ctx` simulado que registre los `fillText`): con 3 celdas largas + ETA y lienzo chico, ninguna celda queda sin dibujar; con 1 celda, el factor aplicado es > 1.5; el banner ETA escala con el factor. Se corre con `node --test --test-isolation=none alertas/*.test.mjs` (hoy 17 tests; deben sumar los nuevos sin romper los existentes).
- **Visual**: screenshots de los 3 formatos con un parte real (el de granizo) en el navegador antes de publicar.
- **Suite completa** documentada en `AGENTS.md` sigue verde; `node --check` del worker intacto.

## Fuera de alcance

- Cambios a `/efemerides/` (queda exactamente como está).
- Tarjeta en el hub, rediseño de la UI de la página (botones/gate/form).
- Cambios al worker, al caption, al formulario ni a la validación editorial.
- Publicación: requiere pedido explícito del usuario (commit + push aparte, como con el fix anterior).
