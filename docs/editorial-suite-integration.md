# Integración de la Suite Editorial

La suite comparte un paquete editorial versionado para que una nota se extraiga y sintetice una sola vez y luego alimente distintas salidas.

## Flujo

```text
URL de noticia
    -> worker /placas/v2/paquete
    -> paquete noticia_editorial v2
       -> /placas-v2 (placas y variantes)
       -> /carousel (artículo, diagnóstico y slides)
       -> Reel (draft de escenas y renderer actual)
```

El endpoint acepta `nota` con el contenido extraído y `outputs` opcional:

```json
{
  "nota": {
    "url": "https://mediamendoza.com/seccion/123",
    "titulo": "Título de la nota",
    "bajada": "Resumen",
    "contexto": "Dato clave",
    "cuerpo": "Texto completo",
    "category": "sociedad",
    "image": "https://..."
  },
  "outputs": ["placa", "carrusel", "reel"]
}
```

Ruta: `POST /placas/v2/paquete`.

## Contrato común

El contrato vive en `shared/editorial-package.mjs` y conserva la fuente original en `fuente`. Los textos y decisiones editoriales están en `editorial`; los resultados se agregan en `salidas` y los copys en `redes`.

`/placas-v2` usa `placas` como salida principal. `/carousel` traduce el paquete al artículo y diagnóstico que ya usa su editor. El adaptador de Reel genera un draft de portada, idea principal, contexto y cierre, sin inventar información; el renderer y la generación de guion existentes siguen disponibles.

## Worker manual

Como el worker se despliega desde el dashboard de Cloudflare, copiar el contenido actualizado de `worker/worker.js` y desplegarlo en el servicio `mm-herramientas-worker`. También debe mantenerse sincronizado `worker/worker-dashboard.js` si se usa la variante del dashboard.

La ruta nueva es independiente de `/placas` y no cambia su flujo de producción.

## Verificación

Desde la raíz del proyecto:

```powershell
node --test --test-isolation=none shared/*.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*package-adapter.test.mjs
```

La suite de integración comprueba una extracción y una generación para las tres salidas. La estética de carrusel y Reel queda fuera de esta etapa y puede abordarse sobre estos datos compartidos.

