// Cliente TyC: búsqueda en su índice AppSync (que usa su propio buscador) y
// descarga del HTML del artículo. No reescribe la URL, sólo la pasa.

export const TYC_APPSYNC_URL = 'https://xke6pkwdfrhfvirq5lt5br2m4m.appsync-api.us-east-1.amazonaws.com/graphql';
export const TYC_APPSYNC_KEY = 'da2-qlssafeqdzdrldlwnzqblraswu';
export const TYC_UA = 'MediaMendoza-Efemerides-TycSync/1.0 (+https://mediamendoza.pages.dev/)';

// Una sola query: hitos recientes de efemerides (tope real 100 en su backend).
// Devuelve { fecha, url, titulo }[] ordenado por fecha (asc).
export async function buscarEfemeridesTyc(fetcher = globalThis.fetch, { desde, hasta } = {}) {
  const res = await fetcher(TYC_APPSYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': TYC_APPSYNC_KEY, 'User-Agent': TYC_UA },
    body: JSON.stringify({
      query: 'query { search(hitsPerPage: 100, searchAbout: "efemerides") { hits { order_date title url } } }',
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('AppSync TyC respondió ' + res.status);
  const data = await res.json();
  const hits = data?.data?.search?.hits || [];
  const urls = hits
    .filter(h => typeof h.url === 'string' && h.url.includes('/efemerides/'))
    .filter(h => typeof h.title === 'string' && /efem[eé]rides/i.test(h.title))
    .map(h => ({ fecha: new Date(h.order_date * 1000).toISOString().slice(0, 10), url: h.url, titulo: h.title }))
    .filter(h => (!desde || h.fecha >= desde) && (!hasta || h.fecha <= hasta))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  return urls;
}

// Descarga el HTML del artículo. devuelve texto crudo (sin parsear).
export async function bajarArticuloTyc(url, fetcher = globalThis.fetch) {
  const res = await fetcher(url, { headers: { 'User-Agent': TYC_UA }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error('TyC respondió ' + res.status + ' para ' + url);
  return res.text();
}

// Extrae la fecha declarada por el JSON-LD del artículo (NewsArticle.datePublished).
// Formato ISO; si falla, devuelve null (el parser usa el orden del índice).
export async function fechaDelArticuloTyc(url, fetcher = globalThis.fetch) {
  const html = await bajarArticuloTyc(url, fetcher);
  const m = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
  if (!m) return null;
  const fecha = m[1].slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null;
}