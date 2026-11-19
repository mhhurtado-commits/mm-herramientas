// Guarda los fixtures reales (solo el <article>…</article>) de los dos artículos
// que usan los tests. Ejecución única; no se vuelve a correr.
import { readFileSync, writeFileSync } from 'node:fs';

const URL_2024 = 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-18-de-noviembre-que-se-conmemora-hoy-id619733.html';
const URL_2026 = 'https://www.tycsports.com/interes-general/efemerides/efemerides-del-29-de-mayo-que-se-conmemora-hoy-id733288.html';

const UA = { 'User-Agent': 'MediaMendoza-Efemerides-TycSync/1.0 (+https://mediamendoza.pages.dev/)' };

async function capturar(url, destino) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(url + ' → ' + res.status);
  const html = await res.text();
  // Recortamos al <article> para que el fixture sea chico y enfocado.
  const m = html.match(/<article[\s\S]*<\/article>/i) || html.match(/<main[\s\S]*<\/main>/i);
  const recorte = m ? m[0] : html;
  writeFileSync(destino, recorte, 'utf8');
  console.log(destino, '| bytes:', recorte.length, '| li:', (recorte.match(/<li\b/gi) || []).length);
}

await capturar(URL_2024, 'tyc-efemerides/fixtures/18-11-2024.html');
await capturar(URL_2026, 'tyc-efemerides/fixtures/29-05-2026.html');
console.log('fixtures listos');
