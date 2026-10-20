import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

function inlineModule(source) {
  return source
    .replace(/^import[\s\S]*?;\s*$/m, '')
    .replace(/\bexport\s+(?=(?:async\s+)?function\b|const\b|let\b|var\b|class\b)/g, '');
}

const [football, editorialCore, plates, imageGenerationConfig, sharedEditorialPackage, whatsappCopy, worker] = await Promise.all([
  read('worker/football-daily.mjs'),
  read('placas-v2/editorial-core.mjs'),
  read('worker/placas-v2.mjs'),
  read('worker/image-generation-config.mjs'),
  read('shared/editorial-package.mjs'),
  read('worker/whatsapp-copy.mjs'),
  read('worker/worker.js'),
]);

// shared/editorial-package.mjs se inlina dentro de un IIFE con namespace: sus helpers
// internos (clean, normalizeKeyFacts, etc.) colisionan con los de worker.js/editorial-core,
// y sólo exponemos normalizeEditorialPackage para el branch paquete de /whatsapp/generar.
function inlineModuleNamespaced(source, names) {
  const body = source
    .replace(/^import[\s\S]*?;\s*$/m, '')
    .replace(/\bexport\s+(?=(?:async\s+)?function\b|const\b|let\b|var\b|class\b)/g, '');
  return `const { ${names.join(', ')} } = (() => {\n${body}\nreturn { ${names.join(', ')} };\n})();`;
}

const workerWithoutImports = worker.replace(/^import[\s\S]*?;\s*$/gm, '');
const bundle = [
  '// Media Mendoza Worker — bundle para pegar en el dashboard de Cloudflare.',
  '// Generado desde worker/worker.js. No editar manualmente este archivo.',
  inlineModule(football),
  inlineModule(editorialCore),
  inlineModule(plates),
  inlineModule(imageGenerationConfig),
  inlineModule(whatsappCopy),
  inlineModuleNamespaced(sharedEditorialPackage, ['normalizeEditorialPackage']),
  workerWithoutImports,
].join('\n\n');

await writeFile(new URL('worker/worker-dashboard.js', root), bundle);
console.log('Generado worker/worker-dashboard.js');
