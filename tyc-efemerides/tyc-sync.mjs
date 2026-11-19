// CLI del sincronizador de efemérides TyC.
// Uso:
//   node tyc-efemerides/tyc-sync.mjs --fecha=2026-11-18
//   node tyc-efemerides/tyc-sync.mjs --desde=2026-06-01 --hasta=2026-11-18
//   node tyc-efemerides/tyc-sync.mjs --url=https://… --fecha=2024-11-18
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearEfemeridesTyc } from './tyc-parse.mjs';
import { cotejarItemsTyc } from './tyc-cotejo.mjs';
import { buscarEfemeridesTyc, bajarArticuloTyc } from './tyc-client.mjs';
import { parseEfemeridesWikitexto, emparejarEsEn, urlsEfemeridesRaw } from '../worker/worker.js';

const TYC_UA = 'MediaMendoza-Efemerides-TycSync/1.0 (+https://mediamendoza.pages.dev/)';
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function arg(nombre) {
  const m = process.argv.find(a => a.startsWith('--' + nombre + '='));
  return m ? m.slice(m.indexOf('=') + 1) : undefined;
}
function hasFlag(nombre) { return process.argv.includes('--' + nombre); }
function isoHoy() { return new Date().toISOString().slice(0, 10); }

// Recorta el hecho visible (~120 chars) para la salida, nunca el texto
// completo de TyC, por respeto a © Clarín.
function recortar(texto, max = 120) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, max).trimEnd() + '…';
}

async function fetchLike(fetcher, url, opts = {}) {
  const res = await fetcher(url, { ...opts, headers: { ...(opts.headers || {}), 'User-Agent': TYC_UA }, signal: AbortSignal.timeout(10000) });
  return {
    ok: res?.ok ?? (res?.status >= 200 && res?.status < 300),
    status: res?.status ?? (res?.ok ? 200 : 0),
    text: async () => (typeof res?.text === 'function' ? res.text() : (res?.text ?? Promise.resolve(''))),
    json: async () => (typeof res?.json === 'function' ? res.json() : (typeof res?.text === 'function' ? JSON.parse(await res.text()) : {})),
  };
}

// Núcleo: procesa un día y devuelve { items, markdown } (sin escribir).
export async function procesarDia({ fecha, url, fetcher = globalThis.fetch, fechaMinima, fechaMaxima }) {
  if (!ISO.test(fecha)) throw new Error('fecha inválida: ' + fecha);
  let urlTyc = url || null;
  if (!urlTyc) {
    const hits = await buscarEfemeridesTyc(fetcher, { desde: fechaMinima, hasta: fechaMaxima });
    // Match exacto por fecha primero; luego cualquiera cuyo slug diga "del <d> de <mes>".
    const mD = Number(fecha.slice(8, 10));
    const esMeses = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const nombreMes = esMeses[Number(fecha.slice(5, 7))];
    const exactos = hits.filter(h => h.fecha === fecha);
    if (exactos.length) urlTyc = exactos[0].url;
    else if (nombreMes) {
      const porSlug = hits.find(h => h.url.includes('del-' + mD + '-de-' + nombreMes));
      if (porSlug) urlTyc = porSlug.url;
    }
    if (!urlTyc) throw new Error('No se encontró artículo TyC para ' + fecha + ' en el índice. Usá --url=…');
  }

  // 1) Artículo TyC.
  const html = await bajarArticuloTyc(urlTyc, fetcher);
  const hechos = parsearEfemeridesTyc(html);
  if (hechos.length === 0) {
    const err = new Error('El parser devolvió 0 hechos para ' + urlTyc + '. Posible cambio de estructura de TyC.');
    err.code = 'PARSER_VACIO';
    throw err;
  }

  // 2) Pool Wikipedia verificado para la fecha (es∩en).
  let pool = [];
  try {
    const { esUrl, enUrl, esWikiUrl, enWikiUrl } = urlsEfemeridesRaw(fecha);
    const [esRes, enRes] = await Promise.all([
      fetchLike(fetcher, esUrl).catch(() => null),
      fetchLike(fetcher, enUrl).catch(() => null),
    ]);
    const esRaw = esRes ? await esRes.text() : '';
    const enRaw = enRes ? await enRes.text() : '';
    if (esRaw && enRaw) {
      pool = emparejarEsEn(parseEfemeridesWikitexto(esRaw, 'es', esWikiUrl), parseEfemeridesWikitexto(enRaw, 'en', enWikiUrl));
    }
  } catch { pool = []; }

  // 3) Curadas del día.
  let curadasDelDia = [];
  const mmdd = fecha.slice(5).replace('-', '-').slice(0, 5); // "11-18"
  const clave = mmdd;
  try {
    const r = await fetchLike(fetcher, 'https://mediamendoza.pages.dev/efemerides/efemerides-curadas.json', { headers: { Accept: 'application/json' } });
    if (r.ok) {
      const data = await r.json();
      curadasDelDia = Array.isArray(data?.[clave]) ? data[clave] : [];
    }
  } catch { curadasDelDia = []; }

  // 4) Cotejo.
  const items = cotejarItemsTyc(hechos, pool, curadasDelDia);
  const conEstado = items.map(i => ({ ...i, texto: recortar(i.texto, 120) }));

  // 5) Informe markdown.
  const cruzados = conEstado.filter(i => i.estado === 'cruzado');
  const enBanco = conEstado.filter(i => i.estado === 'en-banco');
  const candidatos = conEstado.filter(i => i.estado === 'candidato');
  const celda = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
  const thFila = (i) => `| ${i.año} | ${celda(i.titulo)} | ${i.alcance} | ${i.estado} |${i.fuenteEs ? ` [Wikipedia](${i.fuenteEs}) |` : ' — |'}`;
  const tabla = (arr) => [
    '| Año | Título | Alcance | Estado | Enlace |',
    '| --- | --- | --- | --- | --- |',
    ...arr.map(thFila),
  ].join('\n');
  const md = [
    `# TyC → candidatas — ${fecha}`,
    '',
    `- Artículo: ${urlTyc}`,
    `- Hechos detectados: ${conEstado.length}`,
    `  - cruzados (Wikipedia): ${cruzados.length}`,
    `  - en Banco: ${enBanco.length}`,
    `  - candidatos (revisar a mano): ${candidatos.length}`,
    '',
    '## Cruzados (verificados contra Wikipedia es∩en)',
    '',
    cruzados.length ? tabla(cruzados) : '_(ninguno)_',
    '',
    '## En el Banco (ya curados)',
    '',
    enBanco.length ? tabla(enBanco) : '_(ninguno)_',
    '',
    '## Candidatos (requieren tu revisión)',
    '',
    candidatos.length ? tabla(candidatos) : '_(ninguno)_',
    '',
    '> Aviso: `cruzado` se basa en año+token contra Wikipedia es∩en; TyC sólo orienta qué mirar.',
    '> Nunca copies texto de TyC; redactá con tus palabras y verificá con archivo.ar / Wikipedia / elmiserasorio.',
  ].join('\n');

  return { fecha, urlTyc, items: conEstado, markdown: md };
}

function parseFechaArg(argv) {
  const p = arg('fecha');
  if (p) return { fecha: p, modo: 'dia' };
  const d = arg('desde'), h = arg('hasta');
  if (d && h) return { desde: d, hasta: h, modo: 'barrido' };
  return { fecha: isoHoy(), modo: 'dia' };
}

async function main() {
  const { fecha, desde, hasta, modo } = parseFechaArg();
  const outRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'out');
  const cDir = path.join(outRoot, 'candidatas');
  const iDir = path.join(outRoot, 'informes');
  mkdirSync(cDir, { recursive: true });
  mkdirSync(iDir, { recursive: true });

  if (modo === 'dia') {
    const fechaArg = fecha;
    try {
      const { items, markdown, urlTyc } = await procesarDia({ fecha: fechaArg, url: arg('url'), fechaMinima: arg('desde'), fechaMaxima: arg('hasta') });
      const outPath = path.join(cDir, fecha + '.json');
      writeFileSync(outPath, JSON.stringify({ fecha, fuente: 'TyC Sports', articulo: urlTyc, obtenido: new Date().toISOString(), items }, null, 2), 'utf8');
      writeFileSync(path.join(iDir, fecha + '.md'), markdown, 'utf8');
      console.log('Salidas:\n  - ' + outPath + '\n  - ' + path.join(iDir, fecha + '.md'));
    } catch (e) {
      // Estructura de TyC rota (parser=0) → exit 2, según spec §7.
      if (e?.code === 'PARSER_VACIO') { console.error(e.message); process.exit(2); }
      throw e;
    }
  } else {
    const hits = await buscarEfemeridesTyc(globalThis.fetch, { desde, hasta });
    if (!hits.length) { console.error('Sin artículos TyC en el rango', desde, '→', hasta); process.exit(2); }
    console.log('Barrido:', hits.length, 'artículos', desde, '→', hasta);
    for (const { fecha: f, url } of hits) {
      process.stdout.write('\n▸ ' + f + ' ');
      try {
        const { items, markdown, urlTyc } = await procesarDia({ fecha: f, url, fechaMinima: desde, fechaMaxima: hasta });
        writeFileSync(path.join(cDir, f + '.json'), JSON.stringify({ fecha: f, fuente: 'TyC Sports', articulo: urlTyc, obtenido: new Date().toISOString(), items }, null, 2), 'utf8');
        writeFileSync(path.join(iDir, f + '.md'), markdown, 'utf8');
        process.stdout.write('ok\n');
      } catch (e) {
        console.error('Error en', f, ':', e?.message || e);
      }
      await new Promise(r => setTimeout(r, 300)); // polite delay
    }
  }
}

if (process.argv[1] && path.normalize(process.argv[1]) === path.normalize(fileURLToPath(import.meta.url))) {
  main().catch(e => { console.error(e); process.exit(1); });
}