import { readFile, writeFile } from 'node:fs/promises';

const WORKER = new URL('./worker.js', import.meta.url);
const MODULOS = [
  { archivo: new URL('./redaccion-v2.mjs', import.meta.url), inicio: '// >>> REDACCION-V2 INLINE', fin: '// <<< REDACCION-V2 INLINE' },
  { archivo: new URL('./redaccion-fuentes.mjs', import.meta.url), inicio: '// >>> REDACCION-FUENTES INLINE', fin: '// <<< REDACCION-FUENTES INLINE' },
];

function limpiar(texto) {
  return texto.replace(/^import .*$/gm, '').replace(/^export /gm, '').trim();
}

// worker.js vive con CRLF en Windows y con LF en el índice: el bloque copiado
// tiene que usar el mismo fin de línea que el archivo para que el inliner sea
// idempotente y no genere un diff de 7.800 líneas.
function alinearEol(texto, eol) {
  return texto.replace(/\r\n/g, '\n').split('\n').join(eol);
}

let worker = await readFile(WORKER, 'utf8');
const eol = worker.includes('\r\n') ? '\r\n' : '\n';

for (const modulo of MODULOS) {
  const codigo = alinearEol(limpiar(await readFile(modulo.archivo, 'utf8')), eol);
  const inicio = worker.indexOf(modulo.inicio);
  const fin = worker.indexOf(modulo.fin);
  if (inicio === -1 || fin === -1 || fin < inicio) throw new Error(`Faltan marcadores: ${modulo.inicio}`);
  const bloque = `${modulo.inicio}${eol}${codigo}${eol}${modulo.fin}`;
  worker = worker.slice(0, inicio) + bloque + worker.slice(fin + modulo.fin.length);
}

await writeFile(WORKER, worker, 'utf8');
console.log('worker.js actualizado con los bloques de redaccion v2');
