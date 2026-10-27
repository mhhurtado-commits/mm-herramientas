# AGENTS.md

Suite editorial de Media Mendoza: apps estáticas en HTML/CSS/JS vanilla sobre Cloudflare Pages y un único Cloudflare Worker (`mm-herramientas-worker`) para IA, KV, R2, colas y proxy de imágenes.

## Build y despliegue

- No hay `package.json`, bundler ni paso de compilación, y no hay que agregarlos: Pages sirve los archivos tal cual. `node_modules/` es un resto local ignorado por git.
- Cada carpeta de primer nivel con `index.html` es una ruta pública (`/redaccion/`, `/placas-v2/`, …). Una herramienta nueva = carpeta nueva + tarjeta en los tres listados de `index.html` donde ya aparece `/redaccion/`.
- El worker **no** se despliega con Wrangler: se copia entero `worker/worker.js` y se pega en el dashboard de Cloudflare. Tiene que seguir siendo un solo archivo sin `import` (solo `export`).
- Las rutas del worker se resuelven en el único `fetch` de `worker.js`; no hay router ni framework.
- Varios módulos de `worker/*.mjs` están copiados inline dentro de `worker.js`: `whatsapp-copy`, `placas-v2` y `football-daily`. Si editás el módulo, replicá el cambio en el worker. Solo `whatsapp-copy-sync.test.mjs` verifica la sincronización; los otros dos se desincronizan en silencio.
- `worker/editorial-package.mjs` no es desplegable (importa de `shared/`): del contrato solo está inlinada la guardia de versión.
- La URL del worker (`https://mm-herramientas-worker.mhhurtado.workers.dev`) está hardcodeada en cada app, no en un config central.
- `_headers` y `_redirects` son config de Pages: COOP/COEP solo para `/social/`, `/video-editor/` y `/video-vertical/` (FFmpeg.wasm). Sumar una app con FFmpeg exige agregar sus headers.
- Apps modulares con `.mjs` al lado del HTML: `placas-v2`, `carousel`, `reels`, `publicar`, `video-vertical` (y `whatsapp/handoff.mjs`). Las viejas son un único `index.html` con todo inline; no las partas sin motivo.

## Verificación

Sin dependencias: Node 24 + `node --test`. Los globs los expande Node, no PowerShell.

```powershell
# suite completa, verde (excluye la falla preexistente de integración)
node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs

# un archivo
node --test worker/placas-v2.test.mjs

# smoke de sintaxis del worker
node --check worker/worker.js
```

- Falla preexistente: `shared/editorial-suite.integration.test.mjs` importa `carousel/reel-package-adapter.js`, que ya no existe (se movió a `reels/reel-package-adapter.mjs`). Por eso el comando de `docs/editorial-suite-integration.md` falla; no es una regresión tuya.

## Trampas

- `docs/worker.md` está desactualizado: dice `gemini-2.5-flash-lite` y `wrangler deploy`. La verdad está en `worker/worker.js:508-509` (`gemini-3.1-flash-lite` con fallback `gemini-3.5-flash-lite`).
- `worker/worker.js` pesa ~350 KB / 7.800 líneas: grepeá, no lo leas entero.
- Finales de línea: `core.autocrlf=true`. El índice guarda LF, pero el checkout en Windows tiene CRLF en `worker/worker.js` y en `redaccion/index.html`. No normalices EOL ni reformatees el worker: generás diffs enormes.
- No hay backend de auth: la puerta es una contraseña hardcodeada en el HTML.
