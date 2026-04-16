// ============================================================
// Media Mendoza — Worker v4
// POST /titulares, POST /reformular
// GET  /rss?url=..., GET /verificar?url=...
// GET  /scrape?url=...     → extrae texto de una nota
// GET  /fuentes, POST /fuentes, DELETE /fuentes?id=
// GET  /editorial          → leer prompt editorial desde KV
// POST /editorial          → guardar prompt editorial en KV
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_SEARCH_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const EDITORIAL_KV_KEY = "config:editorial";
const MAX_PROXY_IMAGE_BYTES = 8 * 1024 * 1024;
const WHATSAPP_PREFIX = "whatsapp:programado:";
const AGENDA_PREFIX = "agenda:evento:";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

function esXMLvalido(t) {
  return t.includes("<rss")||t.includes("<feed")||t.includes("<channel")||t.includes("<item")||t.includes("<entry")||(t.trimStart().startsWith("<?xml")&&t.includes("<title"));
}

function decodeHtml(text = "") {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function limpiarEspacios(text = "") {
  return decodeHtml(text).replace(/\s+/g, " ").trim();
}

function extractMeta(html, ...patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = limpiarEspacios(match?.[1] || "");
    if (value) return value;
  }
  return "";
}

function normalizarTituloSitio(title = "") {
  return title
    .replace(/\s+[|\-–—]\s+(Media Mendoza|mediamendoza\.com).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferirCategoriaDesdeUrl(targetUrl) {
  try {
    const u = new URL(targetUrl);
    const first = u.pathname.split("/").filter(Boolean)[0] || "";
    return limpiarEspacios(first.replace(/[-_]+/g, " "));
  } catch {
    return "";
  }
}

function generarId(prefix) {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function acortarUrlNota(targetUrl) {
  try {
    const u = new URL(targetUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const numMatch = parts[1].match(/^(\d+)/);
      if (numMatch) return `${u.origin}/${parts[0]}/${numMatch[1]}`;
    }
    return `${u.origin}${u.pathname}`;
  } catch {
    return targetUrl;
  }
}

async function listarObjetosKV(env, prefix) {
  const list = await env.KV.list({ prefix });
  const items = [];
  for (const key of list.keys) {
    const val = await env.KV.get(key.name, "json");
    if (val) items.push(val);
  }
  return items;
}

// Extrae texto limpio de HTML
function extraerTexto(html) {
  // Eliminar scripts, styles, nav, header, footer, aside
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
             .replace(/<style[\s\S]*?<\/style>/gi, '')
             .replace(/<nav[\s\S]*?<\/nav>/gi, '')
             .replace(/<header[\s\S]*?<\/header>/gi, '')
             .replace(/<footer[\s\S]*?<\/footer>/gi, '')
             .replace(/<aside[\s\S]*?<\/aside>/gi, '');
  // Convertir párrafos y headings a saltos de línea
  html = html.replace(/<\/(p|h[1-6]|li|br|div)>/gi, '\n');
  // Eliminar todas las etiquetas restantes
  html = html.replace(/<[^>]+>/g, '');
  // Limpiar entidades HTML comunes
  html = html.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  // Limpiar espacios y líneas vacías múltiples
  return html.split('\n').map(l=>l.trim()).filter(l=>l.length>30).slice(0,80).join('\n');
}

async function fetchHtml(targetUrl, cacheTtl = 300) {
  const res = await fetch(targetUrl, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
    cf: { cacheTtl, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`Error ${res.status} al obtener la URL`);
  return { res, html: await res.text() };
}

function extraerDatosNotaParaPlacas(html, targetUrl) {
  const title = normalizarTituloSitio(extractMeta(
    html,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,300})["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']{1,300})["']/i,
    /<title[^>]*>([^<]{1,300})<\/title>/i
  ));

  const description = extractMeta(
    html,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i,
    /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']{1,500})["']/i
  );

  const image = extractMeta(
    html,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,1500})["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']{1,1500})["']/i
  );

  const category = extractMeta(
    html,
    /<meta[^>]+property=["']article:section["'][^>]+content=["']([^"']{1,120})["']/i,
    /<meta[^>]+name=["']section["'][^>]+content=["']([^"']{1,120})["']/i,
    /<meta[^>]+name=["']category["'][^>]+content=["']([^"']{1,120})["']/i
  ) || inferirCategoriaDesdeUrl(targetUrl);

  return {
    title,
    category,
    description,
    body: extraerTexto(html),
    image,
    url: targetUrl,
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/") {
      if (request.method === "GET" && url.searchParams.has("url")) return handlePlacasUrl(url);
      if (request.method === "GET" && url.searchParams.has("image")) return handlePlacasImage(url);
      if (request.method === "POST" && url.searchParams.get("ai") === "1") return handlePlacasAI(request, env);
    }

    if (request.method === "GET") {
      if (path === "/rss") return handleRSS(url);
      if (path === "/verificar") return handleVerificar(url);
      if (path === "/scrape") return handleScrape(url);
      if (path === "/fuentes") return handleGetFuentes(env);
      if (path === "/editorial") return handleGetEditorial(env);
      if (path === "/cubiertas") return handleGetCubiertas(env);
      if (path === "/whatsapp/programados") return handleGetWhatsappProgramados(env);
      if (path === "/agenda/eventos") return handleGetAgendaEventos(url, env);
      if (path === "/redactar") return jsonError("Usar POST", 405);
      if (path === "/notas") return handleGetNotas(env);
      return jsonError("Ruta no encontrada", 404);
    }

    if (request.method === "DELETE") {
      if (path === "/fuentes") return handleDeleteFuente(url, env);
      if (path === "/notas") return handleDeleteNota(url, env);
      if (path === "/whatsapp/programado") return handleDeleteWhatsappProgramado(url, env);
      if (path === "/agenda/evento") return handleDeleteAgendaEvento(url, env);
      return jsonError("Ruta no encontrada", 404);
    }

    if (request.method !== "POST") return jsonError("Metodo no permitido", 405);

    let body;
    try { body = await request.json(); }
    catch { return jsonError("JSON invalido", 400); }

    if (path === "/titulares") return handleTitulares(body, env);
    if (path === "/reformular") return handleReformular(body, env);
    if (path === "/fuentes") return handlePostFuente(body, env);
    if (path === "/editorial") return handlePostEditorial(body, env);
    if (path === "/cubiertas") return handlePostCubierta(body, env);
    if (path === "/redactar") return handleRedactar(body, env);
    if (path === "/notas") return handlePostNota(body, env);
    if (path === "/whatsapp/generar") return handleWhatsappGenerar(body, env);
    if (path === "/whatsapp/programar") return handlePostWhatsappProgramar(body, env);
    if (path === "/whatsapp/marcar-enviado") return handlePostWhatsappMarcarEnviado(body, env);
    if (path === "/agenda/evento") return handlePostAgendaEvento(body, env);
    if (path === "/agenda/angulos") return handleAgendaAngulos(body, env);

    return jsonError("Ruta no encontrada", 404);
  },
};

// ------------------------------------------------------------
// SCRAPING — GET /scrape?url=https://...
// ------------------------------------------------------------
async function handleScrape(url) {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) return jsonError("Parametro url requerido", 400);
  try { new URL(targetUrl); } catch { return jsonError("URL invalida", 400); }

  try {
    const { html } = await fetchHtml(targetUrl, 300);

    // Intentar extraer título de og:title o <title>
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i);
    const titleTag = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    const titulo = (ogTitle?.[1] || titleTag?.[1] || '').replace(/\s+/g,' ').trim();
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i)
                 || html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:image["']/i);
    const imagen = ogImage?.[1] || '';

    const texto = extraerTexto(html);

    if (!texto || texto.length < 100) return jsonError("No se pudo extraer contenido de la nota", 422);

    return jsonOk({ titulo, texto, imagen, url: targetUrl });
  } catch (err) {
    return jsonError(`Error scrapeando: ${err.message}`, 502);
  }
}

// ------------------------------------------------------------
// COMPATIBILIDAD PLACAS
// GET /?url=https://...
// GET /?image=https://...
// POST /?ai=1
// ------------------------------------------------------------
async function handlePlacasUrl(url) {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) return jsonError("Parametro url requerido", 400);
  try { new URL(targetUrl); } catch { return jsonError("URL invalida", 400); }

  try {
    const { html } = await fetchHtml(targetUrl, 300);
    const data = extraerDatosNotaParaPlacas(html, targetUrl);
    if (!data.title && !data.body) return jsonError("No se pudo extraer contenido de la nota", 422);
    return jsonOk(data);
  } catch (err) {
    return jsonError(`Error obteniendo nota: ${err.message}`, 502);
  }
}

async function handlePlacasImage(url) {
  const imageUrl = url.searchParams.get("image");
  if (!imageUrl) return jsonError("Parametro image requerido", 400);
  try { new URL(imageUrl); } catch { return jsonError("URL invalida", 400); }

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": BROWSER_HEADERS["User-Agent"],
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": BROWSER_HEADERS["Accept-Language"],
      },
      redirect: "follow",
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!res.ok) return jsonError(`Error ${res.status} al obtener la imagen`, 502);

    const contentType = res.headers.get("Content-Type") || "application/octet-stream";
    if (!contentType.startsWith("image/")) return jsonError("La URL no devolvio una imagen", 422);

    const contentLength = Number(res.headers.get("Content-Length") || "0");
    if (contentLength && contentLength > MAX_PROXY_IMAGE_BYTES) {
      return jsonError("La imagen es demasiado pesada para proxy", 413);
    }

    return new Response(res.body, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return jsonError(`Error obteniendo imagen: ${err.message}`, 502);
  }
}

async function handlePlacasAI(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return jsonError("JSON invalido", 400); }

  const system = String(body.system || "").trim();
  const user = String(body.user || "").trim();
  if (!system || !user) return jsonError("Faltan campos: system y user", 400);

  const prompt = `${system}

Responde SOLO con JSON sin backticks con esta forma exacta:
{"grupo":"mensaje para grupo","canal":"mensaje para canal"}

${user}`;

  const resultado = await callGemini(prompt, env);
  if (resultado.error) return jsonError(resultado.error, 500);

  const grupo = limpiarEspacios(resultado.data?.grupo || "");
  const canal = limpiarEspacios(resultado.data?.canal || "");
  if (!grupo && !canal) return jsonError("La IA no devolvio mensajes validos", 502);

  return jsonOk({
    text: JSON.stringify({ grupo, canal }),
  });
}

// ------------------------------------------------------------
// EDITORIAL — KV
// ------------------------------------------------------------
async function handleGetEditorial(env) {
  try {
    const val = await env.KV.get(EDITORIAL_KV_KEY, "json");
    return jsonOk({ editorial: val || { prompt: "", activo: false } });
  } catch (err) {
    return jsonError("Error leyendo KV: " + err.message, 500);
  }
}

async function handlePostEditorial(body, env) {
  const { prompt, activo } = body;
  if (typeof prompt === "undefined") return jsonError("Falta campo: prompt", 400);
  try {
    await env.KV.put(EDITORIAL_KV_KEY, JSON.stringify({ prompt: prompt.trim(), activo: !!activo }));
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error guardando en KV: " + err.message, 500);
  }
}

// ------------------------------------------------------------
// FUENTES — KV
// ------------------------------------------------------------
async function handleGetFuentes(env) {
  try {
    const list = await env.KV.list({ prefix: "fuente:" });
    const fuentes = [];
    for (const key of list.keys) {
      const val = await env.KV.get(key.name, "json");
      if (val) fuentes.push(val);
    }
    fuentes.sort((a, b) => (a.nombre||'').localeCompare(b.nombre||''));
    return jsonOk({ fuentes });
  } catch (err) {
    return jsonError("Error leyendo KV: " + err.message, 500);
  }
}

async function handlePostFuente(body, env) {
  const { id, nombre, url, clase } = body;
  if (!id || !nombre || !url) return jsonError("Faltan campos: id, nombre, url", 400);
  try {
    await env.KV.put(`fuente:${id}`, JSON.stringify({ id, nombre, url, clase: clase||"custom" }));
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error guardando en KV: " + err.message, 500);
  }
}

async function handleDeleteFuente(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("Parametro id requerido", 400);
  try {
    await env.KV.delete(`fuente:${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error eliminando de KV: " + err.message, 500);
  }
}

// ------------------------------------------------------------
// NOTAS GUARDADAS — KV
// ------------------------------------------------------------
async function handleGetNotas(env) {
  try {
    const list = await env.KV.list({ prefix: "nota:" });
    const notas = [];
    for (const key of list.keys) {
      const val = await env.KV.get(key.name, "json");
      if (val) notas.push(val);
    }
    notas.sort((a, b) => (b.fecha||0) - (a.fecha||0));
    return jsonOk({ notas });
  } catch (err) { return jsonError("Error KV: " + err.message, 500); }
}

async function handlePostNota(body, env) {
  const { id, titular, cuerpo, categoria, hashtags, imagen, fecha } = body;
  if (!id || !titular) return jsonError("Faltan campos", 400);
  try {
    await env.KV.put(`nota:${id}`, JSON.stringify({ id, titular, cuerpo, categoria, hashtags, imagen: imagen||'', fecha: fecha || Date.now() }));
    return jsonOk({ guardado: true });
  } catch (err) { return jsonError("Error KV: " + err.message, 500); }
}

async function handleDeleteNota(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("Falta id", 400);
  try { await env.KV.delete(`nota:${id}`); return jsonOk({ eliminado: true }); }
  catch (err) { return jsonError("Error KV: " + err.message, 500); }
}

// ------------------------------------------------------------
// CUBIERTAS — KV
// Guarda los links de noticias marcadas como cubiertas
// ------------------------------------------------------------
async function handleWhatsappGenerar(body, env) {
  const notaUrl = String(body.notaUrl || "").trim();
  const contextoExtra = String(body.contextoExtra || "").trim();
  const contenido = String(body.contenido || "").trim();
  const tituloManual = String(body.titulo || "").trim();
  const categoriaManual = String(body.categoria || "").trim();

  let nota = {
    titulo: tituloManual,
    categoria: categoriaManual,
    descripcion: "",
    body: contenido,
    url: notaUrl,
    urlCorta: notaUrl ? acortarUrlNota(notaUrl) : "",
    image: "",
  };

  if (notaUrl) {
    try { new URL(notaUrl); } catch { return jsonError("URL invalida", 400); }
    try {
      const { html } = await fetchHtml(notaUrl, 300);
      const scraped = extraerDatosNotaParaPlacas(html, notaUrl);
      nota = {
        titulo: scraped.title || nota.titulo,
        categoria: scraped.category || nota.categoria,
        descripcion: scraped.description || "",
        body: scraped.body || nota.body,
        url: notaUrl,
        urlCorta: acortarUrlNota(notaUrl),
        image: scraped.image || "",
      };
    } catch (err) {
      return jsonError(`No se pudo obtener la nota: ${err.message}`, 502);
    }
  }

  if (!nota.titulo && !nota.body) {
    return jsonError("Falta notaUrl o contenido para generar el mensaje", 400);
  }

const prompt = `Sos editor de WhatsApp del diario digital Media Mendoza (sur de Mendoza, Argentina).

Tu tarea es generar mensajes listos para copiar y pegar en WhatsApp.

DATOS:
Titulo: ${nota.titulo || "Sin titulo"}
Categoria: ${nota.categoria || "General"}
Descripcion: ${nota.descripcion || ""}
Contenido: ${(nota.body || "").substring(0, 2000)}
URL: ${nota.urlCorta || nota.url || ""}
${contextoExtra ? `Contexto adicional: ${contextoExtra}` : ""}

REGLAS OBLIGATORIAS:
- NO inventar información
- Español argentino
- USAR \\n para cada salto de línea (OBLIGATORIO)
- NO escribir en un solo párrafo
- Usar negrita SOLO con asteriscos simples: *palabra*
- No usar **doble asterisco**
- SI NO RESPETÁS LOS \\n Y LAS NEGRITAS, LA RESPUESTA ES INCORRECTA

FORMATO GRUPO (ESTRUCTURA FIJA):

🚨 [EMOJIS] *${nota.categoria?.toUpperCase() || "GENERAL"}*: frase corta\\n
\\n
Bajada no muy breve con alguna palabra en *negrita* EMOJIS👇\\n
\\n👉 *MÁS INFORMACIÓN:* ${nota.urlCorta || nota.url || ""}\\n
\\n
*📱 Grupo de Noticias:* https://bit.ly/mediamendoza-grupo\\n
*📣 Canal de Difusión:* https://bit.ly/mediamendoza-canal\\n
\\n
*📰 Media Mendoza - Noticias confiables del sur mendocino*

FORMATO CANAL:
- Igual estructura pero:
- Menos emojis
- Más limpio
- Mantener negritas

IMPORTANTE:
- NO agregues texto fuera del JSON
- NO expliques nada
- SOLO responder JSON válido

RESPUESTA:
{"grupo":"texto con \\n","canal":"texto con \\n"}`;

  const resultado = await callGemini(prompt, env);
  if (resultado.error) return jsonError(resultado.error, 500);

  const grupo = (resultado.data?.grupo || "").trim();
  const canal = (resultado.data?.canal || "").trim();
  if (!grupo || !canal) return jsonError("La IA no devolvio ambos mensajes", 502);

  return jsonOk({
    nota: {
      titulo: nota.titulo || "Sin titulo",
      url: nota.url || "",
      urlCorta: nota.urlCorta || nota.url || "",
      imagen: nota.image || "",
    },
    categoria: nota.categoria || "General",
    grupo,
    canal,
  });
}

async function handlePostWhatsappProgramar(body, env) {
  if (!body || typeof body !== "object") return jsonError("Body invalido", 400);
  if (!body.fecha) return jsonError("Falta campo: fecha", 400);

  const item = {
    id: body.id || generarId("wp_"),
    fecha: Number(body.fecha),
    fechaLegible: body.fechaLegible || "",
    tituloNota: String(body.tituloNota || "").trim(),
    urlCorta: String(body.urlCorta || "").trim(),
    canales: Array.isArray(body.canales) ? body.canales.filter(Boolean) : [],
    textoGrupo: String(body.textoGrupo || "").trim(),
    textoCanal: String(body.textoCanal || "").trim(),
    categoria: String(body.categoria || "General").trim(),
    enviado: !!body.enviado,
    creado: body.creado || Date.now(),
  };

  if (!item.canales.length) return jsonError("Falta al menos un canal", 400);

  try {
    await env.KV.put(`${WHATSAPP_PREFIX}${item.id}`, JSON.stringify(item));
    return jsonOk({ guardado: true, id: item.id });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}

async function handleGetWhatsappProgramados(env) {
  try {
    const programados = await listarObjetosKV(env, WHATSAPP_PREFIX);
    programados.sort((a, b) => (a.fecha || 0) - (b.fecha || 0));
    return jsonOk({ programados });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}

async function handlePostWhatsappMarcarEnviado(body, env) {
  const id = String(body.id || "").trim();
  if (!id) return jsonError("Falta campo: id", 400);

  try {
    const key = `${WHATSAPP_PREFIX}${id}`;
    const actual = await env.KV.get(key, "json");
    if (!actual) return jsonError("Mensaje no encontrado", 404);

    const actualizado = {
      ...actual,
      estado: "enviado",
      enviado: true,
    };

    await env.KV.put(key, JSON.stringify(actualizado));
    return jsonOk({ guardado: true, id, programado: actualizado });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}

async function handleDeleteWhatsappProgramado(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("Falta id", 400);
  try {
    await env.KV.delete(`${WHATSAPP_PREFIX}${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}

async function handleGetAgendaEventos(url, env) {
  try {
    const mes = String(url.searchParams.get("mes") || "").trim();
    let eventos = await listarObjetosKV(env, AGENDA_PREFIX);
    if (mes) eventos = eventos.filter(e => String(e.fecha || "").startsWith(mes));
    eventos.sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")) || String(a.hora || "").localeCompare(String(b.hora || "")));
    return jsonOk({ eventos });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}

async function handlePostAgendaEvento(body, env) {
  const titulo = String(body.titulo || "").trim();
  const fecha = String(body.fecha || "").trim();
  if (!titulo || !fecha) return jsonError("Faltan campos: titulo y fecha", 400);

  const evento = {
    id: body.id || generarId("ag_"),
    titulo,
    fecha,
    hora: String(body.hora || "").trim(),
    tipo: String(body.tipo || "evento").trim(),
    alcance: String(body.alcance || "local").trim(),
    descripcion: String(body.descripcion || "").trim(),
    periodista: String(body.periodista || "").trim(),
    creado: body.creado || Date.now(),
  };

  try {
    await env.KV.put(`${AGENDA_PREFIX}${evento.id}`, JSON.stringify(evento));
    return jsonOk({ guardado: true, id: evento.id, evento });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}

async function handleDeleteAgendaEvento(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("Falta id", 400);
  try {
    await env.KV.delete(`${AGENDA_PREFIX}${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}

async function handleAgendaAngulos(body, env) {
  const titulo = String(body.titulo || "").trim();
  if (!titulo) return jsonError("Falta campo: titulo", 400);

  const prompt = `Sos editor de agenda y cobertura del diario digital mendocino Media Mendoza.
Analiza este evento y propone ideas utiles para cobertura periodistica.

EVENTO:
Titulo: ${titulo}
Descripcion: ${String(body.descripcion || "").trim()}
Fecha: ${String(body.fecha || "").trim()}
Tipo: ${String(body.tipo || "").trim()}

Responde SOLO con JSON sin backticks:
{"angulos":["a1","a2","a3"],"preguntas":["p1","p2","p3"],"fuentes_sugeridas":["f1","f2","f3"],"consejo":"..."}`;

  const resultado = await callGemini(prompt, env);
  if (resultado.error) return jsonError(resultado.error, 500);

  return jsonOk({
    angulos: Array.isArray(resultado.data?.angulos) ? resultado.data.angulos : [],
    preguntas: Array.isArray(resultado.data?.preguntas) ? resultado.data.preguntas : [],
    fuentes_sugeridas: Array.isArray(resultado.data?.fuentes_sugeridas) ? resultado.data.fuentes_sugeridas : [],
    consejo: String(resultado.data?.consejo || "").trim(),
  });
}

async function handleGetCubiertas(env) {
  try {
    const list = await env.KV.list({ prefix: "cubierta:" });
    const links = list.keys.map(k => k.name.replace("cubierta:", ""));
    return jsonOk({ links });
  } catch (err) {
    return jsonError("Error leyendo KV: " + err.message, 500);
  }
}

async function handlePostCubierta(body, env) {
  const { link, cubierta } = body;
  if (!link) return jsonError("Falta campo: link", 400);
  try {
    const key = "cubierta:" + link.substring(0, 400);
    if (cubierta) {
      // TTL de 30 días — se limpia solo
      await env.KV.put(key, "1", { expirationTtl: 60 * 60 * 24 * 30 });
    } else {
      await env.KV.delete(key);
    }
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error en KV: " + err.message, 500);
  }
}

// ------------------------------------------------------------
// RSS PROXY
// ------------------------------------------------------------
async function handleRSS(url) {
  const feedUrl = url.searchParams.get("url");
  if (!feedUrl) return jsonError("Parametro url requerido", 400);
  try { new URL(feedUrl); } catch { return jsonError("URL invalida", 400); }
  try {
    const res = await fetch(feedUrl, { headers: { ...BROWSER_HEADERS, 'Accept-Encoding': 'identity' }, redirect: "follow", cf: { cacheTtl: 180, cacheEverything: true } });
    if (!res.ok) return jsonError(`Feed error ${res.status}`, 502);
    const text = await res.text();
    if (!esXMLvalido(text)) return jsonError("La URL no es un feed RSS valido", 422);
    return new Response(text, { headers: { ...CORS_HEADERS, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=180" } });
  } catch (err) {
    return jsonError(`Error obteniendo feed: ${err.message}`, 502);
  }
}

// ------------------------------------------------------------
// VERIFICAR RSS
// ------------------------------------------------------------
async function handleVerificar(url) {
  const feedUrl = url.searchParams.get("url");
  if (!feedUrl) return jsonError("Parametro url requerido", 400);
  try { new URL(feedUrl); } catch { return jsonError("URL invalida", 400); }
  try {
    const res = await fetch(feedUrl, { headers: { ...BROWSER_HEADERS, 'Accept-Encoding': 'identity' }, redirect: "follow" });
    if (!res.ok) return jsonError(`Feed error ${res.status}`, 502);
    const text = await res.text();
    if (!esXMLvalido(text)) return jsonError("La URL no es un feed RSS valido", 422);
    const titleMatch = text.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const nombre = titleMatch ? titleMatch[1].replace(/\s+/g,' ').trim().substring(0,80) : 'Feed RSS';
    const itemCount = (text.match(/<item[\s>]/g)||[]).length + (text.match(/<entry[\s>]/g)||[]).length;
    return jsonOk({ valido: true, nombre, items: itemCount });
  } catch (err) {
    return jsonError(`No se pudo acceder: ${err.message}`, 502);
  }
}

// ------------------------------------------------------------
// TITULARES
// ------------------------------------------------------------
async function handleTitulares(body, env) {
  const { modo, contenido, contexto="", tono="informativo", cantidad=5 } = body;
  if (!modo || !contenido) return jsonError("Faltan campos: modo y contenido", 400);

  const editorial = await getEditorial(env);
  const estiloEditorial = editorial ? `\nLINEA EDITORIAL DE MEDIA MENDOZA:\n"""\n${editorial}\n"""\n` : "";
  const contextoExtra = contexto ? `\nCONTEXTO ADICIONAL:\n"""\n${contexto}\n"""\n` : "";
  const esNota = modo === "nota";

  const prompt = `Sos el editor del diario digital mendocino Media Mendoza (mediamendoza.com).
${estiloEditorial}
${esNota ? `Analizá este texto y generá exactamente ${cantidad} titulares periodísticos.\n\nTEXTO:\n"""\n${contenido}\n"""` : `Generá exactamente ${cantidad} titulares sobre este tema.\n\nTEMA:\n"""\n${contenido}\n"""`}
${contextoExtra}
- Tono: ${tono}. Exactamente ${cantidad} titulares con distintos enfoques. Identificá 2-3 ángulos.

Responde SOLO con JSON sin backticks:
{"titulares":["T1","T2"],"angulos":[{"nombre":"N","descripcion":"D"}]}`;

  const resultado = await callGemini(prompt, env);
  if (resultado.error) return jsonError(resultado.error, 500);
  return jsonOk(resultado.data);
}

// ------------------------------------------------------------
// REFORMULAR
// ------------------------------------------------------------
async function handleReformular(body, env) {
  const { titulo, contenido, contexto="", estilo="formal" } = body;
  if (!titulo || !contenido) return jsonError("Faltan campos: titulo y contenido", 400);

  const editorial = await getEditorial(env);
  const estiloEditorial = editorial ? `\nLINEA EDITORIAL DE MEDIA MENDOZA:\n"""\n${editorial}\n"""\n` : "";
  const estiloDesc = {
    formal: "periodistico formal, prosa cuidada, piramide invertida",
    directo: "directo y conciso, oraciones cortas, sin rodeos, datos primero",
    ampliado: "con contexto ampliado, antecedentes y relevancia para Mendoza",
    breaking: "urgente, tono de breaking news, muy conciso, dato principal en el primer parrafo, titular con verbo en presente",
    cronica: "cronica narrativa, estilo literary journalism, detalle descriptivo, construye tension, humaniza la historia",
    redes: "optimizado para redes sociales, lenguaje coloquial pero informativo, titular gancho, parrafos cortos de 2-3 lineas maximo",
    institucional: "formal institucional, lenguaje neutro y oficial, sin opinion, estructura de comunicado de prensa",
  }[estilo] || "periodistico formal";
  const contextoExtra = contexto ? `\nCONTEXTO ADICIONAL:\n"""\n${contexto}\n"""\n` : "";

  const prompt = `Sos redactor del diario digital mendocino Media Mendoza (mediamendoza.com).
${estiloEditorial}
Reformulá completamente esta nota para publicarla en Media Mendoza.

NOTA ORIGINAL:
Titulo: "${titulo}"
Cuerpo:
"""
${contenido}
"""
${contextoExtra}
- Estilo: ${estiloDesc}
- Reescribí completamente sin copiar frases. Titular nuevo y atractivo.
- 3-5 párrafos bien desarrollados con todos los datos concretos (números, nombres, fechas, lugares).
- No menciones al medio original. 4-5 hashtags para redes sociales.

Responde SOLO con JSON sin backticks:
{"titular":"...","cuerpo":"P1...\n\nP2...\n\nP3...","categoria_sugerida":"Politica|Economia|Sociedad|Policiales|Deportes|Cultura|Tecnologia","hashtags":["#h1","#h2","#h3","#h4"]}`;

  const resultado = await callGemini(prompt, env);
  if (resultado.error) return jsonError(resultado.error, 500);
  return jsonOk(resultado.data);
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
async function getEditorial(env) {
  try {
    const val = await env.KV.get(EDITORIAL_KV_KEY, "json");
    if (val && val.activo && val.prompt) return val.prompt;
  } catch(e) {}
  return null;
}

async function handleRedactar(body, env) {
  const { ideas, buscarWeb = false } = body;
  if (!ideas) return jsonError("Falta campo: ideas", 400);

  const editorial = await getEditorial(env);
  const base = editorial || "Actua como redactor profesional del diario digital Media Mendoza. Medio cercano al sur de Mendoza (San Rafael). Estilo formal periodistico, piramide invertida, no inventar datos, SEO natural.";

  const jsonSchema = '{"titular":"","bajada":"","cuerpo":"P1...\n\nP2...","categoria_sugerida":"","hashtags":[],"fuentes":[]}';
  const instruccionBusqueda = buscarWeb
    ? "Busca contexto en la web y cita las fuentes al final."
    : "Redacta solo con la informacion provista.";

  const prompt = base
    + "\n\nCONTENIDO:\n" + ideas
    + "\n\n" + instruccionBusqueda
    + "\n\nResponde SOLO con JSON sin backticks. En el campo cuerpo usa parrafos separados por \\n\\n, SIN prefijos P1: P2: P3:: " + jsonSchema;

  const fn = buscarWeb ? callGeminiConBusqueda : callGemini;
  const resultado = await fn(prompt, env);
  if (resultado.error) return jsonError(resultado.error, 500);
  return jsonOk(resultado.data);
}

async function callGeminiConBusqueda(prompt, env) {
  const keys = [env.GEMINI_KEY_1,env.GEMINI_KEY_2,env.GEMINI_KEY_3,
                env.GEMINI_KEY_4,env.GEMINI_KEY_5].filter(Boolean);
  if (!keys.length) return { error: "No hay API keys configuradas" };

  const ideasTexto = prompt.split("\n\nCONTENIDO:\n")[1]?.split("\n\n")[0] || prompt.substring(0, 200);

  // PASO 1: Buscar URLs reales con DuckDuckGo
  const fuentesReales = await buscarDuckDuckGo(ideasTexto);

  // PASO 2: Scrapear contenido de las primeras 3 URLs
  let contextoWeb = "";
  const fuentesVerificadas = [];
  for (const fuente of fuentesReales.slice(0, 3)) {
    try {
      const res = await fetch(fuente.url, { headers: BROWSER_HEADERS, redirect: "follow", signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const html = await res.text();
      const texto = extraerTexto(html).substring(0, 800);
      if (texto.length < 100) continue;
      const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i)
                 || html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:image["']/i);
      const imagen = ogImg?.[1] || '';
      contextoWeb += "\nFUENTE: " + fuente.titulo + " (" + fuente.url + ")\n" + texto + "\n---";
      fuentesVerificadas.push({ titulo: fuente.titulo, url: fuente.url, imagen });
    } catch(e) { continue; }
  }

  // PASO 3: Redactar con contexto real
  const promptFinal = prompt + (contextoWeb ? "\n\nCONTENIDO REAL ENCONTRADO EN LA WEB:\n" + contextoWeb : "");
  const resultado = await callGemini(promptFinal, env);
  if (resultado.error) return resultado;
  if (fuentesVerificadas.length) resultado.data.fuentes = fuentesVerificadas;
  return resultado;
}

async function buscarDuckDuckGo(query) {
  try {
    // DuckDuckGo HTML search — sin API key
    const url = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query) + "&kl=es-ar";
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_HEADERS["User-Agent"],
        "Accept": "text/html",
        "Accept-Language": "es-AR,es;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Extraer resultados — DuckDuckGo HTML usa clase .result__a
    const resultados = [];
    const linkRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)</g;
    let match;
    while ((match = linkRegex.exec(html)) !== null && resultados.length < 5) {
      let url = match[1];
      const titulo = match[2].trim();
      // DuckDuckGo a veces usa redirect, extraer URL real
      if (url.includes("uddg=")) {
        const decoded = decodeURIComponent(url.split("uddg=")[1]?.split("&")[0] || "");
        if (decoded.startsWith("http")) url = decoded;
      }
      if (url.startsWith("http") && titulo) {
        resultados.push({ url, titulo });
      }
    }
    console.log("DuckDuckGo encontró:", resultados.length, "resultados");
    return resultados;
  } catch(e) {
    console.log("DuckDuckGo error:", e.message);
    return [];
  }
}


async function callGemini(prompt, env) {
  const keys = [env.GEMINI_KEY_1, env.GEMINI_KEY_2, env.GEMINI_KEY_3, env.GEMINI_KEY_4, env.GEMINI_KEY_5].filter(Boolean);
  if (keys.length === 0) return { error: "No hay API keys configuradas" };

  for (let i = 0; i < keys.length; i++) {
    for (let intento = 1; intento <= 2; intento++) {
      try {
        const res = await fetch(`${GEMINI_URL}?key=${keys[i]}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7,maxOutputTokens:2000} }),
        });
        console.log(`Key ${i+1}, intento ${intento}: ${res.status}`);
        if (res.status === 429) { if (intento<2){await sleep(3000);continue;} else break; }
        if (res.status===500||res.status===503) { if (intento<2){await sleep(3000);continue;} else break; }
        if (!res.ok) break;
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) break;
        let parsed; try { parsed = JSON.parse(match[0]); } catch { break; }
        return { data: parsed };
      } catch (err) { if (intento<2) await sleep(3000); }
    }
  }
  return { error: "Todas las API keys estan agotadas. Intentalo en unos minutos." };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function jsonOk(data) { return new Response(JSON.stringify({ok:true,...data}), { headers:{...CORS_HEADERS,"Content-Type":"application/json"} }); }
function jsonError(message, status=400) { return new Response(JSON.stringify({ok:false,error:message}), { status, headers:{...CORS_HEADERS,"Content-Type":"application/json"} }); }
