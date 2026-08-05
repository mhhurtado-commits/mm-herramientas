import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

function inlineModule(source) {
  return source
    .replace(/^import[\s\S]*?;\s*$/m, '')
    .replace(/\bexport\s+(?=(?:async\s+)?function\b|const\b|let\b|var\b|class\b)/g, '');
}

const [football, editorialCore, plates, worker] = await Promise.all([
  read('worker/football-daily.mjs'),
  read('placas-v2/editorial-core.mjs'),
  read('worker/placas-v2.mjs'),
  read('worker/worker.js'),
]);

const workerWithoutImports = worker.replace(/^import[\s\S]*?;\s*$/gm, '');
const bundle = [
  '// Media Mendoza Worker — bundle para pegar en el dashboard de Cloudflare.',
  '// Generado desde worker/worker.js. No editar manualmente este archivo.',
  inlineModule(football),
  inlineModule(editorialCore),
  inlineModule(plates),
  workerWithoutImports,
].join('\n\n');

await writeFile(new URL('worker/worker-dashboard.js', root), bundle);
console.log('Generado worker/worker-dashboard.js');
