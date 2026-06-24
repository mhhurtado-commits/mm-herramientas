var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/worker.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, cache-control"
};
var GEMINI_MODEL = "gemini-2.5-flash-lite";
var GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
var EDITORIAL_KV_KEY = "config:editorial";
var WA_PROMPT_KV_KEY = "config:wa_prompt";
var WA_LINKS_KV_KEY = "config:wa_links";
var REEL_PROMPT_KEY = "config:reel:prompt";
var REEL_VOCES_KEY = "config:reel:voces";
var MAX_PROXY_IMAGE_BYTES = 8 * 1024 * 1024;
var WHATSAPP_PREFIX = "whatsapp:programado:";
var AGENDA_EV_PREFIX = "agenda:evento:";
var AGENDA_EF_PREFIX = "agenda:efemeride:";
var ANGULOS_PREFIX = "agenda:angulos:";
var ANGULOS_TTL = 60 * 60 * 24 * 30;
var STUDIO_PROYECTOS_PREFIX = "studio:proyecto:";
var VOCES_DEFAULT = [
  { id: "es-AR-TomasNeural", nombre: "Tom\xE1s (Hombre AR)", keyAlias: "AZURE_TTS_KEY_1", region: "AZURE_TTS_REGION_1" },
  { id: "es-AR-ElenaNeural", nombre: "Elena (Mujer AR)", keyAlias: "AZURE_TTS_KEY_1", region: "AZURE_TTS_REGION_1" }
];
var REEL_PROMPT_DEFAULT = `Sos locutor de Media Mendoza, diario digital del sur de Mendoza, Argentina.
Escrib\xED un guion para un reel de Instagram/Facebook de m\xE1ximo 30 segundos (unas 60-80 palabras).
Tono: directo, urgente, informativo. Espa\xF1ol rioplatense.
El guion debe ir al dato central desde la primera oraci\xF3n, sin introducci\xF3n.
No uses signos como guiones, par\xE9ntesis ni hashtags. Solo texto fluido para leer en voz alta.
Respond\xE9 SOLO con JSON sin backticks:
{"titulo":"t\xEDtulo corto para mostrar en el video, m\xE1ximo 8 palabras","guion":"texto completo para leer en voz alta"}`;
var BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache"
};
function esXMLvalido(t) {
  return t.includes("<rss") || t.includes("<feed") || t.includes("<channel") || t.includes("<item") || t.includes("<entry") || t.trimStart().startsWith("<?xml") && t.includes("<title");
}
__name(esXMLvalido, "esXMLvalido");
function decodeHtml(t = "") {
  return t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
__name(decodeHtml, "decodeHtml");
function limpiarEspacios(t = "") {
  return decodeHtml(t).replace(/\s+/g, " ").trim();
}
__name(limpiarEspacios, "limpiarEspacios");
function extractMeta(html, ...patterns) {
  for (const p of patterns) {
    const m = html.match(p);
    const v = limpiarEspacios(m?.[1] || "");
    if (v) return v;
  }
  return "";
}
__name(extractMeta, "extractMeta");
function normalizarTituloSitio(t = "") {
  return t.replace(/\s+[|\-–—]\s+(Media Mendoza|mediamendoza\.com).*$/i, "").replace(/\s+/g, " ").trim();
}
__name(normalizarTituloSitio, "normalizarTituloSitio");
function inferirCategoriaDesdeUrl(url) {
  try {
    const u = new URL(url);
    const f = u.pathname.split("/").filter(Boolean)[0] || "";
    return limpiarEspacios(f.replace(/[-_]+/g, " "));
  } catch {
    return "";
  }
}
__name(inferirCategoriaDesdeUrl, "inferirCategoriaDesdeUrl");
function generarId(p) {
  return `${p}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
__name(generarId, "generarId");
function acortarUrlNota(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.split("/").filter(Boolean);
    if (p.length >= 2) {
      const n = p[1].match(/^(\d+)/);
      if (n) return `${u.origin}/${p[0]}/${n[1]}`;
    }
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}
__name(acortarUrlNota, "acortarUrlNota");
async function listarObjetosKV(env, prefix) {
  const list = await env.KV.list({ prefix });
  const items = [];
  for (const k of list.keys) {
    const v = await env.KV.get(k.name, "json");
    if (v) items.push(v);
  }
  return items;
}
__name(listarObjetosKV, "listarObjetosKV");
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
__name(sleep, "sleep");
function jsonOk(data) {
  return new Response(JSON.stringify({ ok: true, ...data }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}
__name(jsonOk, "jsonOk");
function jsonError(msg, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}
__name(jsonError, "jsonError");
function escapeXml(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
__name(escapeXml, "escapeXml");
function localeFromVoice(v = "") {
  const m = String(v).match(/^([a-z]{2,3}-[A-Z]{2})-/);
  return m ? m[1] : "es-AR";
}
__name(localeFromVoice, "localeFromVoice");
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor(seconds % 1 * 1e3);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}
__name(formatTimestamp, "formatTimestamp");
function procesarSegmentosAOraciones(segments) {
  if (!segments || !segments.length) return [];
  const oraciones = [];
  const MAX_PALABRAS = 15;
  const MAX_CARACTERES = 120;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    let texto = seg.text.trim();
    let frases = [];
    let partes = texto.split(/(?<=[.!?;:])\s*/);
    for (let parte of partes) {
      parte = parte.trim();
      if (!parte) continue;
      const palabras = parte.split(/\s+/).length;
      const caracteres = parte.length;
      if (palabras <= MAX_PALABRAS && caracteres <= MAX_CARACTERES) {
        frases.push(parte);
      } else {
        const palabrasArray = parte.split(/\s+/);
        for (let j = 0; j < palabrasArray.length; j += MAX_PALABRAS) {
          const subFrase = palabrasArray.slice(j, j + MAX_PALABRAS).join(" ");
          if (subFrase.trim()) frases.push(subFrase.trim());
        }
      }
    }
    if (frases.length === 0 && texto.length > MAX_CARACTERES) {
      const palabrasArray = texto.split(/\s+/);
      for (let j = 0; j < palabrasArray.length; j += MAX_PALABRAS) {
        const subFrase = palabrasArray.slice(j, j + MAX_PALABRAS).join(" ");
        if (subFrase.trim()) frases.push(subFrase.trim());
      }
    } else if (frases.length === 0) {
      frases = [texto];
    }
    const duracionSegmento = seg.end - seg.start;
    const duracionPorFrase = duracionSegmento / frases.length;
    for (let j = 0; j < frases.length; j++) {
      const inicio = seg.start + j * duracionPorFrase;
      const fin = inicio + duracionPorFrase;
      oraciones.push({
        texto: frases[j],
        start: parseFloat(inicio.toFixed(2)),
        end: parseFloat(fin.toFixed(2)),
        duration: parseFloat(duracionPorFrase.toFixed(2)),
        removed: false
      });
    }
  }
  return oraciones;
}
__name(procesarSegmentosAOraciones, "procesarSegmentosAOraciones");
function extraerTexto(html) {
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<nav[\s\S]*?<\/nav>/gi, "").replace(/<header[\s\S]*?<\/header>/gi, "").replace(/<footer[\s\S]*?<\/footer>/gi, "").replace(/<aside[\s\S]*?<\/aside>/gi, "");
  html = html.replace(/<\/(p|h[1-6]|li|br|div)>/gi, "\n").replace(/<[^>]+>/g, "");
  html = html.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return html.split("\n").map((l) => l.trim()).filter((l) => l.length > 30).slice(0, 80).join("\n");
}
__name(extraerTexto, "extraerTexto");
async function fetchHtml(url, cacheTtl = 300) {
  const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: "follow", cf: { cacheTtl, cacheEverything: true } });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return { res, html: await res.text() };
}
__name(fetchHtml, "fetchHtml");
function extraerDatosNota(html, url) {
  const title = normalizarTituloSitio(extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,300})["']/i, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']{1,300})["']/i, /<title[^>]*>([^<]{1,300})<\/title>/i));
  const description = extractMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i);
  const image = extractMeta(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,1500})["']/i, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']{1,1500})["']/i);
  const category = extractMeta(html, /<meta[^>]+property=["']article:section["'][^>]+content=["']([^"']{1,120})["']/i, /<meta[^>]+name=["']section["'][^>]+content=["']([^"']{1,120})["']/i) || inferirCategoriaDesdeUrl(url);
  return { title, category, description, body: extraerTexto(html), image, url };
}
__name(extraerDatosNota, "extraerDatosNota");
var RESUMEN_PREFIX = "resumen:";
function getTTLHastaManana5AM() {
  const ahora = /* @__PURE__ */ new Date();
  const manana5AM = new Date(ahora);
  manana5AM.setDate(ahora.getDate() + 1);
  manana5AM.setHours(5, 0, 0, 0);
  const diferenciaMs = manana5AM - ahora;
  const ttlSegundos = Math.floor(diferenciaMs / 1e3);
  return Math.max(ttlSegundos, 3600);
}
__name(getTTLHastaManana5AM, "getTTLHastaManana5AM");
async function handleResumenAgregar(body, env) {
  const { id, fecha, titulo, url, urlCorta, categoria, imagen, timestamp } = body;
  if (!id || !fecha || !titulo) {
    return jsonError("Faltan campos requeridos (id, fecha, titulo)", 400);
  }
  const key = `${RESUMEN_PREFIX}${fecha}:${id}`;
  const ttl = getTTLHastaManana5AM();
  const item = {
    id,
    fecha,
    titulo,
    url: url || "",
    urlCorta: urlCorta || "",
    categoria: categoria || "General",
    imagen: imagen || "",
    timestamp: timestamp || Date.now()
  };
  try {
    await env.KV.put(key, JSON.stringify(item), { expirationTtl: ttl });
    return jsonOk({ guardado: true, id, expiraEn: ttl });
  } catch (err) {
    console.error("Error guardando resumen:", err);
    return jsonError("Error guardando en KV: " + err.message, 500);
  }
}
__name(handleResumenAgregar, "handleResumenAgregar");
async function handleResumenObtener(url, env) {
  const fecha = url.searchParams.get("fecha");
  if (!fecha) {
    return jsonError("Falta par\xE1metro fecha (YYYY-MM-DD)", 400);
  }
  const prefix = `${RESUMEN_PREFIX}${fecha}:`;
  try {
    const list = await env.KV.list({ prefix });
    const notas = [];
    for (const key of list.keys) {
      const nota = await env.KV.get(key.name, "json");
      if (nota) notas.push(nota);
    }
    notas.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return jsonOk({ fecha, notas, total: notas.length });
  } catch (err) {
    console.error("Error obteniendo resumen:", err);
    return jsonError("Error obteniendo resumen: " + err.message, 500);
  }
}
__name(handleResumenObtener, "handleResumenObtener");
async function handleResumenGenerar(body, env) {
  const { fecha, notas } = body;
  if (!notas || !notas.length) {
    return jsonError("No hay notas para generar resumen", 400);
  }
  const editorial = await getEditorial(env);
  const editorialText = editorial ? `

L\xCDNEA EDITORIAL:
${editorial.substring(0, 500)}` : "";
  let notasTexto = "";
  let notasInfo = [];
  for (let i = 0; i < notas.length; i++) {
    const n = notas[i];
    notasTexto += `${i + 1}. ${n.titulo}
   \u{1F517} ${n.urlCorta || n.url}
`;
    notasInfo.push({
      titulo: n.titulo,
      url: n.url,
      urlCorta: n.urlCorta || n.url,
      categoria: n.categoria || "General",
      imagen: n.imagen || ""
    });
  }
  const prompt = `Sos editor de Media Mendoza, diario del sur de Mendoza, Argentina.
Gener\xE1 un resumen diario de noticias para WhatsApp y para redes sociales.

NOTAS DEL D\xCDA (${fecha || "hoy"}):
${notasTexto}

INSTRUCCIONES:
1. Para WHATSAPP (grupo o canal):
   - Tono directo, con emojis estrat\xE9gicos
   - Encabezado llamativo: "\u{1F4F0} RESUMEN DEL D\xCDA \xB7 ${fecha || "HOY"}"
   - Cada noticia: un emoji seg\xFAn categor\xEDa + titular + link corto
   - Al final: "\u{1F4F1} *Media Mendoza* \u2014 Noticias confiables del sur mendocino"
   - M\xE1ximo 1500 caracteres

2. Para INSTAGRAM/FACEBOOK (post):
   - Tono visual, din\xE1mico, con emojis
   - Frase gancho al inicio
   - Lista de noticias con mini-resumen de 1 l\xEDnea cada una
   - 5-8 hashtags al final (#Mendoza #Noticias #Resumen)
   - M\xE1ximo 2000 caracteres

3. Para GUIDON DE REEL (texto plano para narraci\xF3n):
   - Sin emojis, sin hashtags, sin links, sin negritas
   - Texto fluido, natural, para leer en voz alta
   - Incluir el t\xEDtulo de cada nota seguido de un breve resumen
   - M\xE1ximo 250 palabras

Respond\xE9 SOLO con JSON sin markdown:
{
  "whatsapp": "mensaje completo para WhatsApp con emojis",
  "redes": "texto completo para Instagram/Facebook con emojis",
  "guion_reel": "texto plano para narraci\xF3n del video",
  "sugerencia_hashtags": ["#hashtag1", "#hashtag2"],
  "notas": [
    {
      "titulo": "t\xEDtulo de la nota",
      "resumen": "resumen corto de 20-30 palabras para el video",
      "url": "url de la nota",
      "categoria": "categor\xEDa"
    }
  ]
}`;
  const r = await callGemini(prompt + editorialText, env);
  if (r.error) return jsonError(r.error, 500);
  const notasConImagen = (r.data?.notas || []).map((nota, idx) => ({
    ...nota,
    imagen: notas[idx]?.imagen || "",
    urlCorta: notas[idx]?.urlCorta || nota.url
  }));
  return jsonOk({
    whatsapp: r.data?.whatsapp || "",
    redes: r.data?.redes || "",
    guion_reel: r.data?.guion_reel || "",
    hashtags: r.data?.sugerencia_hashtags || [],
    notas: notasConImagen
  });
}
__name(handleResumenGenerar, "handleResumenGenerar");
async function handleGenerarGuionReel(body, env) {
  const { texto } = body;
  if (!texto) return jsonError("Falta texto", 400);
  const prompt = `Convert\xED este texto en un guion fluido para narraci\xF3n de video.
  REGLAS:
  - Elimin\xE1 emojis, hashtags, links, negritas, asteriscos, guiones
  - Texto natural, en espa\xF1ol rioplatense, como si lo leyera un locutor
  - Fluido para leer en voz alta
  - Manten\xE9 la informaci\xF3n principal

  TEXTO ORIGINAL:
  ${texto.substring(0, 2e3)}

  Respond\xE9 SOLO con JSON: { "guion": "texto del guion limpio" }`;
  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  let guion = r.data?.guion || texto;
  guion = guion.replace(/[#*_`]/g, "").replace(/https?:\/\/[^\s]+/g, "").replace(/[🔗📱📣🎧✅⚠️✗✓★✦▶️⏸️🎬📋🗑✏️🕐📍📅📰💬⚡🔍🎵🎙️]/g, "");
  return jsonOk({ guion });
}
__name(handleGenerarGuionReel, "handleGenerarGuionReel");
async function handleResumenEliminar(body, env) {
  const { id, fecha } = body;
  if (!id || !fecha) {
    return jsonError("Faltan id o fecha", 400);
  }
  const key = `${RESUMEN_PREFIX}${fecha}:${id}`;
  try {
    await env.KV.delete(key);
    return jsonOk({ eliminado: true, id });
  } catch (err) {
    return jsonError("Error eliminando: " + err.message, 500);
  }
}
__name(handleResumenEliminar, "handleResumenEliminar");
async function handleStudioTranscribir(request, env) {
  if (!env.AI) {
    return jsonError("Cloudflare AI no est\xE1 configurado", 500);
  }
  try {
    const formData = await request.formData();
    let audioFile = formData.get("audio");
    if (!audioFile) audioFile = formData.get("file");
    if (!audioFile) {
      return jsonError("Falta archivo de audio", 400);
    }
    const audioBuffer = await audioFile.arrayBuffer();
    const audioArray = [...new Uint8Array(audioBuffer)];
    const response = await env.AI.run("@cf/openai/whisper", {
      audio: audioArray
    });
    let texto = "";
    let vtt = "";
    let segments = [];
    let words = [];
    if (response) {
      texto = response.text || "";
      vtt = response.vtt || "";
      if (response.words && Array.isArray(response.words)) {
        words = response.words;
        const groupSize = 6;
        for (let i = 0; i < words.length; i += groupSize) {
          const group = words.slice(i, i + groupSize);
          segments.push({
            start: group[0].start,
            end: group[group.length - 1].end,
            text: group.map((w) => w.word).join(" ")
          });
        }
      } else if (texto) {
        segments = [{ start: 0, end: 30, text: texto }];
      }
    }
    return jsonOk({
      texto,
      word_count: response?.word_count || texto.split(/\s+/).length,
      segments,
      words,
      vtt
    });
  } catch (err) {
    console.error("Error en transcripci\xF3n:", err);
    return jsonError("Error en transcripci\xF3n: " + err.message, 500);
  }
}
__name(handleStudioTranscribir, "handleStudioTranscribir");
async function handleStudioGenerarVTT(request, env) {
  try {
    const { segments } = await request.json();
    if (!segments || !segments.length) {
      return jsonError("Faltan segments", 400);
    }
    let vtt = "WEBVTT\n\n";
    segments.forEach((seg, i) => {
      const start = formatTimestamp(seg.start);
      const end = formatTimestamp(seg.end);
      vtt += `${i + 1}
${start} --> ${end}
${seg.text.trim()}

`;
    });
    return new Response(vtt, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/vtt",
        "Content-Disposition": 'attachment; filename="subtitulos.vtt"'
      }
    });
  } catch (err) {
    return jsonError("Error generando VTT: " + err.message, 500);
  }
}
__name(handleStudioGenerarVTT, "handleStudioGenerarVTT");
async function handleStudioGuardarProyecto(body, env) {
  const { id, titulo, transcripcion, segments, createdAt } = body;
  if (!id || !titulo) {
    return jsonError("Faltan id o titulo", 400);
  }
  const proyecto = {
    id,
    titulo,
    transcripcion: transcripcion || "",
    segments: segments || [],
    createdAt: createdAt || Date.now(),
    updatedAt: Date.now()
  };
  try {
    await env.KV.put(`${STUDIO_PROYECTOS_PREFIX}${id}`, JSON.stringify(proyecto));
    return jsonOk({ guardado: true, id });
  } catch (err) {
    return jsonError("Error guardando proyecto: " + err.message, 500);
  }
}
__name(handleStudioGuardarProyecto, "handleStudioGuardarProyecto");
async function handleStudioObtenerProyectos(env) {
  try {
    const list = await env.KV.list({ prefix: STUDIO_PROYECTOS_PREFIX });
    const proyectos = [];
    for (const key of list.keys) {
      const proyecto = await env.KV.get(key.name, "json");
      if (proyecto) proyectos.push(proyecto);
    }
    proyectos.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return jsonOk({ proyectos });
  } catch (err) {
    return jsonError("Error obteniendo proyectos: " + err.message, 500);
  }
}
__name(handleStudioObtenerProyectos, "handleStudioObtenerProyectos");
async function handleStudioEliminarProyecto(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("Falta id", 400);
  try {
    await env.KV.delete(`${STUDIO_PROYECTOS_PREFIX}${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error eliminando: " + err.message, 500);
  }
}
__name(handleStudioEliminarProyecto, "handleStudioEliminarProyecto");
async function handleVideoEditorTranscribir(request, env) {
  if (!env.AI) {
    return jsonError("Cloudflare AI no est\xE1 configurado", 500);
  }
  try {
    const formData = await request.formData();
    let audioFile = formData.get("audio");
    if (!audioFile) audioFile = formData.get("file");
    if (!audioFile) {
      return jsonError("Falta archivo de audio", 400);
    }
    console.log("[video-editor] Audio recibido:", audioFile.name, audioFile.size, audioFile.type);
    const audioBuffer = await audioFile.arrayBuffer();
    const audioArray = [...new Uint8Array(audioBuffer)];
    const response = await env.AI.run("@cf/openai/whisper", {
      audio: audioArray
    });
    let texto = "";
    let vtt = "";
    let segments = [];
    let words = [];
    if (response) {
      texto = response.text || "";
      vtt = response.vtt || "";
      if (response.words && Array.isArray(response.words)) {
        words = response.words;
        const groupSize = 6;
        for (let i = 0; i < words.length; i += groupSize) {
          const group = words.slice(i, i + groupSize);
          const textoAgrupado = group.map((w) => w.word).join(" ");
          segments.push({
            start: group[0].start,
            end: group[group.length - 1].end,
            text: textoAgrupado,
            // Mantiene compatibilidad original
            texto: textoAgrupado
            // <--- CORRECCIÓN CLAVE: Para que procesarSegmentosAOraciones no rompa
          });
        }
      } else if (texto) {
        segments = [{ start: 0, end: 30, text: texto, texto }];
      }
    }
    const oraciones = procesarSegmentosAOraciones(segments);
    let oracionesConSpeaker = [...oraciones];
    if (oraciones.length > 0) {
      try {
        const textoParaPrompt = oraciones.map((o, i) => `${i}: ${o.texto}`).join("\n");
        const prompt = `Eres un sistema experto en analizar di\xE1logos y transcripciones.
Tu tarea es analizar la siguiente transcripci\xF3n de un di\xE1logo y asignar una etiqueta de participante a cada l\xEDnea.

Reglas para la asignaci\xF3n:
1. Analiza el estilo, las palabras y el contexto de CADA l\xEDnea.
2. Las l\xEDneas que tengan un estilo y contenido similar (por ejemplo, todas las preguntas o todas las afirmaciones de una misma persona) deben tener la MISMA etiqueta.
3. Los cambios de participante suelen ocurrir cuando el contenido de una l\xEDnea es una respuesta directa o un cambio de tema respecto a la l\xEDnea anterior.
4. Responde \xDANICAMENTE con un array de strings en formato JSON v\xE1lido, sin ning\xFAn otro texto ni explicaci\xF3n. Por ejemplo: ["Invitado", "Anfitri\xF3n", "Invitado", "Invitado", "Anfitri\xF3n"]

Transcripci\xF3n:
${textoParaPrompt}`;
        console.log("[video-editor] Llamando a Gemini para detectar participantes...");
        const geminiResult = await callGemini(prompt, env);
        if (geminiResult.data && Array.isArray(geminiResult.data)) {
          const participants = geminiResult.data;
          if (participants.length === oraciones.length) {
            oracionesConSpeaker = oraciones.map((o, i) => ({
              ...o,
              speaker: participants[i] || "desconocido"
            }));
            console.log("[video-editor] Participantes detectados:", participants);
          } else {
            console.error("[video-editor] Error: cantidad de etiquetas no coincide", participants.length, oraciones.length);
            throw new Error("Cantidad incorrecta");
          }
        } else {
          throw new Error("Gemini no devolvi\xF3 array");
        }
      } catch (err) {
        console.error("[video-editor] Error detectando participantes con Gemini:", err);
        console.log("[video-editor] Usando fallback: asignaci\xF3n por alternancia");
        let speakerActual = "Participante A";
        oracionesConSpeaker = oraciones.map((o, i) => {
          if (i > 0) {
            const esCorta = o.texto.split(" ").length < 10;
            if (esCorta && i % 2 === 0) {
              speakerActual = speakerActual === "Participante A" ? "Participante B" : "Participante A";
            }
          }
          return { ...o, speaker: speakerActual };
        });
      }
    }
    console.log("[video-editor] Transcripci\xF3n completada, segmentos:", segments.length, "oraciones:", oracionesConSpeaker.length);
    return jsonOk({
      texto,
      word_count: response?.word_count || texto.split(/\s+/).length,
      segments,
      oraciones: oracionesConSpeaker,
      words,
      vtt
    });
  } catch (err) {
    console.error("Error en transcripci\xF3n de video:", err);
    return jsonError("Error en transcripci\xF3n de video: " + err.message, 500);
  }
}
__name(handleVideoEditorTranscribir, "handleVideoEditorTranscribir");
async function handleVideoEditorSuggestCuts(body, env) {
  const { transcript, segments } = body;
  if (!transcript) return jsonError("Falta la transcripci\xF3n", 400);
  const prompt = `Analiza esta transcripci\xF3n de entrevista y devuelve SOLO los n\xFAmeros de segmento (\xEDndices) que contienen muletillas (eh, este, em, o sea, digamos, como que), silencios largos, repeticiones o frases incompletas.
  Formato de respuesta: [0, 2, 5]
  NO a\xF1adas explicaciones, solo el array.
  
  Transcripci\xF3n por segmentos (cada l\xEDnea es un segmento con su \xEDndice):
  ${segments.map((s, i) => `${i}: ${s.text}`).join("\n")}`;
  try {
    const keys = [env.GEMINI_KEY_1, env.GEMINI_KEY_2, env.GEMINI_KEY_3, env.GEMINI_KEY_4, env.GEMINI_KEY_5].filter(Boolean);
    if (!keys.length) throw new Error("No hay API keys de Gemini configuradas");
    let response;
    for (let i = 0; i < keys.length; i++) {
      try {
        const res = await fetch(`${GEMINI_URL}?key=${keys[i]}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 200 } })
        });
        if (res.ok) {
          response = await res.json();
          break;
        }
      } catch (e) {
        continue;
      }
    }
    if (!response) throw new Error("No se pudo obtener respuesta de Gemini");
    const raw = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = raw.match(/\[[\d,\s]*\]/);
    let indices = [];
    if (match) {
      indices = JSON.parse(match[0]);
    } else {
      const muletillas = ["eh", "este", "em", "mm", "ah", "ehh", "estee", "o sea", "digamos", "como que"];
      indices = segments.filter((seg, idx) => {
        const text = seg.text.toLowerCase();
        return muletillas.some((m) => text.includes(m)) || seg.end - seg.start < 1.5;
      }).map((_, idx) => idx);
    }
    return jsonOk({ suggestions: indices.map((i) => ({ start: segments[i].start, end: segments[i].end, reason: "sugerido por IA" })), total_suggestions: indices.length });
  } catch (err) {
    console.error("Error en sugerencias de corte:", err);
    return jsonError("Error procesando sugerencias: " + err.message, 500);
  }
}
__name(handleVideoEditorSuggestCuts, "handleVideoEditorSuggestCuts");
async function handleGenerateHeadline(request, env) {
  try {
    const { image } = await request.json();
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Falta configurar GEMINI_API_KEY" }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];
    const payload = {
      contents: [{
        parts: [
          { text: "Eres un editor period\xEDstico de Media Mendoza. Mira esta imagen y escribe un titular corto, impactante y en espa\xF1ol argentino (m\xE1ximo 8 palabras). Usa may\xFAsculas solo en la primera letra y nombres propios. Sin puntos finales." },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]
      }]
    };
    const aiResponse = await fetch(geminiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const aiData = await aiResponse.json();
    const headline = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Titular no disponible";
    return new Response(JSON.stringify({ headline: headline.trim() }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error Gemini:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
}
__name(handleGenerateHeadline, "handleGenerateHeadline");
async function handleTestAI(env) {
  const hasAI = !!env.AI;
  return jsonOk({
    ai_disponible: hasAI,
    mensaje: hasAI ? "\u2705 AI configurado correctamente" : "\u274C AI NO est\xE1 configurado. Agreg\xE1 binding 'AI' en el dashboard."
  });
}
__name(handleTestAI, "handleTestAI");
var FOOTBALL_DATA_URL = "https://api.football-data.org/v4";
function getFlagPais(nombrePais) {
  const flagMap = {
    "Iran": "\u{1F1EE}\u{1F1F7}",
    "New Zealand": "\u{1F1F3}\u{1F1FF}",
    "France": "\u{1F1EB}\u{1F1F7}",
    "Senegal": "\u{1F1F8}\u{1F1F3}",
    "Iraq": "\u{1F1EE}\u{1F1F6}",
    "Norway": "\u{1F1F3}\u{1F1F4}",
    "Argentina": "\u{1F1E6}\u{1F1F7}",
    "Peru": "\u{1F1F5}\u{1F1EA}",
    "Brazil": "\u{1F1E7}\u{1F1F7}",
    "Chile": "\u{1F1E8}\u{1F1F1}",
    "Colombia": "\u{1F1E8}\u{1F1F4}",
    "Ecuador": "\u{1F1EA}\u{1F1E8}",
    "Paraguay": "\u{1F1F5}\u{1F1FE}",
    "Uruguay": "\u{1F1FA}\u{1F1FE}",
    "Venezuela": "\u{1F1FB}\u{1F1EA}",
    "Bolivia": "\u{1F1E7}\u{1F1F4}",
    "Mexico": "\u{1F1F2}\u{1F1FD}",
    "Canada": "\u{1F1E8}\u{1F1E6}",
    "United States": "\u{1F1FA}\u{1F1F8}",
    "Costa Rica": "\u{1F1E8}\u{1F1F7}",
    "Honduras": "\u{1F1ED}\u{1F1F3}",
    "Spain": "\u{1F1EA}\u{1F1F8}",
    "Germany": "\u{1F1E9}\u{1F1EA}",
    "Italy": "\u{1F1EE}\u{1F1F9}",
    "Portugal": "\u{1F1F5}\u{1F1F9}",
    "England": "\u{1F1EC}\u{1F1E7}",
    "Netherlands": "\u{1F1F3}\u{1F1F1}",
    "Belgium": "\u{1F1E7}\u{1F1EA}",
    "Denmark": "\u{1F1E9}\u{1F1F0}",
    "Sweden": "\u{1F1F8}\u{1F1EA}",
    "Poland": "\u{1F1F5}\u{1F1F1}",
    "Japan": "\u{1F1EF}\u{1F1F5}",
    "South Korea": "\u{1F1F0}\u{1F1F7}",
    "Australia": "\u{1F1E6}\u{1F1FA}",
    "Morocco": "\u{1F1F2}\u{1F1E6}",
    "Tunisia": "\u{1F1F9}\u{1F1F3}",
    "Nigeria": "\u{1F1F3}\u{1F1EC}",
    "Ghana": "\u{1F1EC}\u{1F1ED}",
    "Croatia": "\u{1F1ED}\u{1F1F7}",
    "Serbia": "\u{1F1F7}\u{1F1F8}",
    "Switzerland": "\u{1F1E8}\u{1F1ED}",
    "Austria": "\u{1F1E6}\u{1F1F9}",
    "Turkey": "\u{1F1F9}\u{1F1F7}",
    "Greece": "\u{1F1EC}\u{1F1F7}",
    "Ukraine": "\u{1F1FA}\u{1F1E6}",
    "Algeria": "\u{1F1E9}\u{1F1FF}",
    "Czech Republic": "\u{1F1E8}\u{1F1FF}",
    "Czechia": "\u{1F1E8}\u{1F1FF}",
    "Scotland": "\u{1F1EC}\u{1F1E7}",
    "Wales": "\u{1F1EC}\u{1F1E7}",
    "Ivory Coast": "\u{1F1E8}\u{1F1EE}",
    "South Africa": "\u{1F1FF}\u{1F1E6}",
    "Cameroon": "\u{1F1E8}\u{1F1F2}",
    "Egypt": "\u{1F1EA}\u{1F1EC}",
    "Saudi Arabia": "\u{1F1F8}\u{1F1E6}",
    "Qatar": "\u{1F1F6}\u{1F1E6}",
    "Jordan": "\u{1F1EF}\u{1F1F4}",
    "Uzbekistan": "\u{1F1FA}\u{1F1FF}",
    "Cape Verde": "\u{1F1E8}\u{1F1FB}",
    "Curacao": "\u{1F1E8}\u{1F1FC}",
    "Cura\xE7ao": "\u{1F1E8}\u{1F1FC}",
    "Haiti": "\u{1F1ED}\u{1F1F9}",
    "Bosnia and Herzegovina": "\u{1F1E7}\u{1F1E6}",
    "Bosnia-Herzegovina": "\u{1F1E7}\u{1F1E6}",
    "DR Congo": "\u{1F1E8}\u{1F1E9}",
    "Democratic Republic of Congo": "\u{1F1E8}\u{1F1E9}",
    "Panama": "\u{1F1F5}\u{1F1E6}",
    "Jamaica": "\u{1F1EF}\u{1F1F2}",
    "Iceland": "\u{1F1EE}\u{1F1F8}",
    "Finland": "\u{1F1EB}\u{1F1EE}",
    "Hungary": "\u{1F1ED}\u{1F1FA}",
    "Romania": "\u{1F1F7}\u{1F1F4}",
    "Russia": "\u{1F1F7}\u{1F1FA}",
    "Israel": "\u{1F1EE}\u{1F1F1}",
    "United Arab Emirates": "\u{1F1E6}\u{1F1EA}",
    "China": "\u{1F1E8}\u{1F1F3}",
    "China PR": "\u{1F1E8}\u{1F1F3}",
    "North Korea": "\u{1F1F0}\u{1F1F5}",
    "India": "\u{1F1EE}\u{1F1F3}",
    "Thailand": "\u{1F1F9}\u{1F1ED}"
  };
  return flagMap[nombrePais] || "\u26BD";
}
__name(getFlagPais, "getFlagPais");
function formatearHora(isoString) {
  if (!isoString) return "--:--";
  try {
    const fecha = new Date(isoString);
    const formatter = new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    return formatter.format(fecha);
  } catch (e) {
    return "--:--";
  }
}
__name(formatearHora, "formatearHora");
var MADRUGADA_CUTOFF_GLOBAL = 4;
function calcularFechaPlaca(horaUTC) {
  if (!horaUTC) return { fechaPlaca: null, esMadrugada: false };
  try {
    const fecha = new Date(horaUTC);
    const tiempoAR = new Date(fecha.getTime() - 3 * 60 * 60 * 1e3);
    const horaAR = tiempoAR.getUTCHours();
    let diaAR = new Date(tiempoAR);
    let esMadrugada = false;
    if (horaAR < MADRUGADA_CUTOFF_GLOBAL) {
      diaAR = new Date(diaAR.getTime() - 24 * 60 * 60 * 1e3);
      esMadrugada = true;
    }
    return {
      fechaPlaca: diaAR.toISOString().split("T")[0],
      esMadrugada
    };
  } catch (e) {
    return { fechaPlaca: null, esMadrugada: false };
  }
}
__name(calcularFechaPlaca, "calcularFechaPlaca");
function traducirGrupo(group) {
  if (!group) return null;
  const map = {
    "GROUP_A": "Grupo A",
    "GROUP_B": "Grupo B",
    "GROUP_C": "Grupo C",
    "GROUP_D": "Grupo D",
    "GROUP_E": "Grupo E",
    "GROUP_F": "Grupo F",
    "GROUP_G": "Grupo G",
    "GROUP_H": "Grupo H",
    "GROUP_I": "Grupo I",
    "GROUP_J": "Grupo J",
    "GROUP_K": "Grupo K",
    "GROUP_L": "Grupo L",
    "Group A": "Grupo A",
    "Group B": "Grupo B",
    "Group C": "Grupo C",
    "Group D": "Grupo D",
    "Group E": "Grupo E",
    "Group F": "Grupo F",
    "Group G": "Grupo G",
    "Group H": "Grupo H",
    "Group I": "Grupo I",
    "Group J": "Grupo J",
    "Group K": "Grupo K",
    "Group L": "Grupo L"
  };
  return map[group] || group.replace(/GROUP_/i, "Grupo ").replace(/Group /i, "Grupo ");
}
__name(traducirGrupo, "traducirGrupo");
function traducirEtapa(stage) {
  if (!stage) return null;
  const map = {
    "GROUP_STAGE": "Fase de grupos",
    "GROUP_STAGE_1": "Fase de grupos",
    "ROUND_OF_32": "Dieciseisavos de final",
    "ROUND_OF_16": "Octavos de final",
    "QUARTER_FINALS": "Cuartos de final",
    "QUARTER_FINAL": "Cuartos de final",
    "SEMI_FINALS": "Semifinal",
    "SEMI_FINAL": "Semifinal",
    "THIRD_PLACE_PLAY_OFF": "Tercer puesto",
    "THIRD_PLACE_PLAYOFF": "Tercer puesto",
    "FINAL": "Final",
    "MATCHDAY_1": "Fecha 1",
    "MATCHDAY_2": "Fecha 2",
    "MATCHDAY_3": "Fecha 3"
  };
  return map[stage] || stage.replace(/_/g, " ");
}
__name(traducirEtapa, "traducirEtapa");
function traducirPais(nombre) {
  const traducciones = {
    "United States": "Estados Unidos",
    "England": "Inglaterra",
    "France": "Francia",
    "Spain": "Espa\xF1a",
    "Germany": "Alemania",
    "Italy": "Italia",
    "Portugal": "Portugal",
    "Netherlands": "Pa\xEDses Bajos",
    "Belgium": "B\xE9lgica",
    "Denmark": "Dinamarca",
    "Sweden": "Suecia",
    "Poland": "Polonia",
    "Czech Republic": "Chequia",
    "Czechia": "Chequia",
    "Hungary": "Hungr\xEDa",
    "Romania": "Rumania",
    "Turkey": "Turqu\xEDa",
    "Greece": "Grecia",
    "Ukraine": "Ucrania",
    "Russia": "Rusia",
    "Iran": "Ir\xE1n",
    "Iraq": "Iraq",
    "Saudi Arabia": "Arabia Saudita",
    "United Arab Emirates": "Emiratos \xC1rabes",
    "Israel": "Israel",
    "Thailand": "Tailandia",
    "Vietnam": "Vietnam",
    "Indonesia": "Indonesia",
    "Malaysia": "Malasia",
    "Singapore": "Singapur",
    "Hong Kong": "Hong Kong",
    "Taiwan": "Taiw\xE1n",
    "India": "India",
    "Pakistan": "Pakist\xE1n",
    "Bangladesh": "Bangladesh",
    "Sri Lanka": "Sri Lanka",
    "Brazil": "Brasil",
    "Mexico": "M\xE9xico",
    "Canada": "Canad\xE1",
    "Costa Rica": "Costa Rica",
    "Honduras": "Honduras",
    "Argentina": "Argentina",
    "Peru": "Per\xFA",
    "Chile": "Chile",
    "Colombia": "Colombia",
    "Ecuador": "Ecuador",
    "Paraguay": "Paraguay",
    "Uruguay": "Uruguay",
    "Venezuela": "Venezuela",
    "Bolivia": "Bolivia",
    "South Africa": "Sud\xE1frica",
    "Morocco": "Marruecos",
    "Tunisia": "T\xFAnez",
    "Senegal": "Senegal",
    "Nigeria": "Nigeria",
    "Ghana": "Ghana",
    "Cameroon": "Camer\xFAn",
    "Mali": "Mali",
    "Ivory Coast": "Costa de Marfil",
    "C\xF4te d'Ivoire": "Costa de Marfil",
    "Croatia": "Croacia",
    "Serbia": "Serbia",
    "Switzerland": "Suiza",
    "Austria": "Austria",
    "Japan": "Jap\xF3n",
    "South Korea": "Corea del Sur",
    "Australia": "Australia",
    "New Zealand": "Nueva Zelanda",
    "Norway": "Noruega",
    "Algeria": "Argelia",
    "Uzbekistan": "Uzbekist\xE1n",
    "Jordan": "Jordania",
    "Cape Verde": "Cabo Verde",
    "Qatar": "Qatar",
    "Curacao": "Curazao",
    "Cura\xE7ao": "Curazao",
    "Haiti": "Hait\xED",
    "Bosnia and Herzegovina": "Bosnia y Herzegovina",
    "Bosnia-Herzegovina": "Bosnia y Herzegovina",
    "DR Congo": "RD Congo",
    "Democratic Republic of Congo": "RD Congo",
    "Congo DR": "RD Congo",
    "Scotland": "Escocia",
    "Wales": "Gales",
    "Northern Ireland": "Irlanda del Norte",
    "Slovakia": "Eslovaquia",
    "Slovenia": "Eslovenia",
    "North Macedonia": "Macedonia del Norte",
    "Kosovo": "Kosovo",
    "Montenegro": "Montenegro",
    "Albania": "Albania",
    "Georgia": "Georgia",
    "Armenia": "Armenia",
    "Azerbaijan": "Azerbaiy\xE1n",
    "Kazakhstan": "Kazajist\xE1n",
    "Iceland": "Islandia",
    "Ireland": "Irlanda",
    "Finland": "Finlandia",
    "Denmark": "Dinamarca",
    "Poland": "Polonia",
    "Hungary": "Hungr\xEDa",
    "Romania": "Rumania",
    "Greece": "Grecia",
    "Ukraine": "Ucrania",
    "Serbia": "Serbia",
    "Russia": "Rusia",
    "Israel": "Israel",
    "Bahrain": "Bar\xE9in",
    "Oman": "Om\xE1n",
    "Kuwait": "Kuwait",
    "Lebanon": "L\xEDbano",
    "Syria": "Siria",
    "Palestine": "Palestina",
    "China PR": "China",
    "China": "China",
    "North Korea": "Corea del Norte",
    "DPR Korea": "Corea del Norte",
    "Korea Republic": "Corea del Sur",
    "Korea": "Corea del Sur",
    "United Arab Emirates": "Emiratos \xC1rabes",
    "UAE": "Emiratos \xC1rabes",
    "Thailand": "Tailandia",
    "Vietnam": "Vietnam",
    "Indonesia": "Indonesia",
    "Malaysia": "Malasia",
    "Singapore": "Singapur",
    "India": "India",
    "Pakistan": "Pakist\xE1n",
    "Bangladesh": "Banglad\xE9s",
    "Nepal": "Nepal",
    "Sri Lanka": "Sri Lanka",
    "Myanmar": "Myanmar",
    "Philippines": "Filipinas",
    "Cambodia": "Camboya",
    "Laos": "Laos",
    "Tanzania": "Tanzania",
    "Kenya": "Kenia",
    "Uganda": "Uganda",
    "Ethiopia": "Etiop\xEDa",
    "Zambia": "Zambia",
    "Zimbabwe": "Zimbabue",
    "Mozambique": "Mozambique",
    "Angola": "Angola",
    "Togo": "Togo",
    "Benin": "Ben\xEDn",
    "Guinea": "Guinea",
    "Gabon": "Gab\xF3n",
    "Congo": "Congo",
    "Madagascar": "Madagascar",
    "Mauritius": "Mauricio",
    "Rwanda": "Ruanda",
    "Burundi": "Burundi",
    "Burkina Faso": "Burkina Faso",
    "Sierra Leone": "Sierra Leona",
    "Equatorial Guinea": "Guinea Ecuatorial",
    "Libya": "Libia",
    "Sudan": "Sud\xE1n",
    "Namibia": "Namibia",
    "Botswana": "Botsuana",
    "Cuba": "Cuba",
    "Dominican Republic": "Rep. Dominicana",
    "Guatemala": "Guatemala",
    "El Salvador": "El Salvador",
    "Nicaragua": "Nicaragua",
    "Jamaica": "Jamaica",
    "Trinidad and Tobago": "Trinidad y Tobago",
    "Suriname": "Surinam",
    "Guyana": "Guyana",
    "Bolivia": "Bolivia",
    "Chile": "Chile",
    "Peru": "Per\xFA",
    "Venezuela": "Venezuela",
    "Fiji": "Fiji",
    "Papua New Guinea": "Pap\xFAa Nueva Guinea",
    "Solomon Islands": "Islas Salom\xF3n",
    "Tahiti": "Tahit\xED",
    "New Caledonia": "Nueva Caledonia"
  };
  return traducciones[nombre] || nombre;
}
__name(traducirPais, "traducirPais");
async function obtenerPartidosMundial(env, competitionId = 2e3, fechaSolicitada = null) {
  const apiKey = env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return { error: "API key de football-data no configurada" };
  }
  try {
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1e3);
    const hoy = ahoraAR.toISOString().split("T")[0];
    const fechaBase = fechaSolicitada || hoy;
    const cacheKey = `mundial:fd:${competitionId}`;
    let allMatches = null;
    try {
      if (env.KV) {
        const raw = await env.KV.get(cacheKey, "json");
        if (raw && raw.matches && raw.matches.length > 0) {
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          const hayEnVivo = raw.matches.some((m) => {
            try {
              const mDate = new Date(m.utcDate);
              const arDate = new Date(mDate.getTime() - 3 * 60 * 60 * 1e3);
              const mDay = arDate.toISOString().split("T")[0];
              return mDay === fechaBase && (m.status === "IN_PLAY" || m.status === "LIVE" || m.status === "1H" || m.status === "2H" || m.status === "HT" || m.status === "FINISHED" || m.status === "AET" || m.status === "PEN");
            } catch (e) {
              return false;
            }
          });
          const maxAge = hayEnVivo ? 2 * 60 * 1e3 : 6 * 60 * 60 * 1e3;
          if (cacheAge < maxAge) {
            allMatches = raw.matches;
          }
        }
      }
    } catch (cacheErr) {
    }
    if (!allMatches) {
      const url = `${FOOTBALL_DATA_URL}/competitions/${competitionId}/matches`;
      const res = await fetch(url, { headers: { "X-Auth-Token": apiKey } });
      if (!res.ok) {
        return { error: `Error API: ${res.status}` };
      }
      const data = await res.json();
      if (!data.matches || data.matches.length === 0) {
        return { partidos: [], fecha: fechaBase, mensaje: "Sin partidos en la competencia" };
      }
      allMatches = data.matches;
      try {
        if (env.KV) {
          await env.KV.put(cacheKey, JSON.stringify({
            matches: allMatches,
            _cachedAt: Date.now(),
            _count: allMatches.length
          }), { expirationTtl: 21600 });
        }
      } catch (e) {
      }
    }
    const partidos = allMatches.map((m) => ({
      id: m.id,
      local: traducirPais(m.homeTeam.name),
      visitante: traducirPais(m.awayTeam.name),
      _homeRaw: m.homeTeam.name,
      _awayRaw: m.awayTeam.name,
      banderaLocal: getFlagPais(m.homeTeam.name),
      banderaVisitante: getFlagPais(m.awayTeam.name),
      hora: formatearHora(m.utcDate),
      horaUTC: m.utcDate,
      estado: m.status,
      estadio: m.venue || "",
      ciudad: "",
      competicion: m.competition?.name || "",
      grupo: traducirGrupo(m.group),
      etapa: traducirEtapa(m.stage),
      jornada: m.matchday || null,
      arbitro: m.referee || null,
      golesLocal: m.score?.fullTime?.home ?? null,
      golesVisitante: m.score?.fullTime?.away ?? null,
      golesHTLocal: m.score?.halfTime?.home ?? null,
      golesHTVisitante: m.score?.halfTime?.away ?? null,
      goleadores: m.goals ? m.goals.map((g) => `${g.scorer.name} ${g.minute}'`).slice(0, 5) : []
    }));
    partidos.forEach((p) => {
      const info = calcularFechaPlaca(p.horaUTC);
      p._fechaPlaca = info.fechaPlaca;
      p._esMadrugada = info.esMadrugada;
    });
    const partidosDelDia = partidos.filter((p) => p._fechaPlaca === fechaBase);
    try {
      if (env.ZAFRONIX_KEY) {
        const cacheKey2 = "mundial:zafronix:matches:2026";
        let zMatches = null;
        if (env.KV) {
          const cached = await env.KV.get(cacheKey2, "json");
          if (cached && cached.matches) zMatches = cached.matches;
        }
        if (!zMatches) {
          const zRes = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
            headers: { "X-API-Key": env.ZAFRONIX_KEY }
          });
          if (zRes.ok) {
            const zData = await zRes.json();
            zMatches = zData.data || [];
            if (env.KV) await env.KV.put(cacheKey2, JSON.stringify({ matches: zMatches, _cachedAt: Date.now() }), { expirationTtl: 21600 });
          }
        }
        if (zMatches && zMatches.length > 0) {
          partidosDelDia.forEach((p) => {
            const home = normalizeTeamName(p._homeRaw || "");
            const away = normalizeTeamName(p._awayRaw || "");
            if (!home || !away) return;
            const found = zMatches.find((m) => {
              const mh = normalizeTeamName(m.homeTeam || "");
              const ma = normalizeTeamName(m.awayTeam || "");
              return mh === home && ma === away || mh === away && ma === home;
            });
            if (found) {
              if (!p.estadio) p.estadio = found.stadium || "";
              if (!p.ciudad) p.ciudad = found.city || "";
            }
          });
        }
      }
    } catch (zErr) {
    }
    partidosDelDia.forEach((p) => {
      p.madrugada = p._esMadrugada || false;
      delete p._esMadrugada;
      delete p._fechaPlaca;
      delete p._homeRaw;
      delete p._awayRaw;
    });
    return { partidos: partidosDelDia, fecha: fechaBase, totalSeason: allMatches.length };
  } catch (err) {
    return { error: err.message };
  }
}
__name(obtenerPartidosMundial, "obtenerPartidosMundial");
var API_FOOTBALL_URL = "https://v3.football.api-sports.io";
async function obtenerPartidosAPIFootball(env, fecha) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return { error: "API-Football key no configurada" };
  }
  try {
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1e3);
    const hoy = ahoraAR.toISOString().split("T")[0];
    const fechaBase = fecha || hoy;
    const seasonCacheKey = "mundial:season:2026";
    let allFixtures = null;
    try {
      if (env.KV) {
        const raw = await env.KV.get(seasonCacheKey, "json");
        if (raw && raw.fixtures && raw.fixtures.length > 0) {
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          const hayEnVivo = raw.fixtures.some((f) => {
            try {
              const fDate = new Date(f.fixture.date);
              const arDate = new Date(fDate.getTime() - 3 * 60 * 60 * 1e3);
              const fDay = arDate.toISOString().split("T")[0];
              const st = f.fixture.status.short;
              return fDay === fechaBase && (st === "1H" || st === "2H" || st === "HT" || st === "LIVE" || st === "ET" || st === "P" || st === "FT" || st === "AET" || st === "PEN");
            } catch (e) {
              return false;
            }
          });
          const maxAge = hayEnVivo ? 2 * 60 * 1e3 : 12 * 60 * 60 * 1e3;
          if (cacheAge < maxAge) {
            allFixtures = raw.fixtures;
          }
        }
      }
    } catch (cacheErr) {
    }
    if (!allFixtures) {
      const url = `${API_FOOTBALL_URL}/fixtures?league=1&season=2026`;
      let res;
      try {
        res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
      } catch (fetchErr) {
        return { error: `Error de conexi\xF3n API-Football: ${fetchErr.message}`, _debug: { step: "fetch" } };
      }
      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        return { error: "Error parseando respuesta", _debug: { step: "parse", status: res.status, body: rawText.substring(0, 500) } };
      }
      const debugInfo = {
        status: res.status,
        url,
        response_count: data.response?.length ?? "null/undefined",
        results_field: data.results,
        errors_field: data.errors,
        raw_keys: Object.keys(data),
        raw_response_sample: Array.isArray(data.response) ? data.response.slice(0, 1) : data.response
      };
      if (!res.ok) {
        return { error: `Error API-Football: ${res.status}`, _debug: debugInfo };
      }
      if (data.errors && (data.errors.rateLimit || data.errors.Requests)) {
        return { error: "Rate limit API-Football: esper\xE1 unos minutos", _debug: debugInfo };
      }
      if (!data.response || data.response.length === 0) {
        return { partidos: [], fecha: fechaBase, mensaje: "API-Football no devolvi\xF3 partidos", _debug: debugInfo };
      }
      allFixtures = data.response;
      try {
        if (env.KV) {
          await env.KV.put(seasonCacheKey, JSON.stringify({
            fixtures: allFixtures,
            _cachedAt: Date.now(),
            _count: allFixtures.length
          }), { expirationTtl: 43200 });
        }
      } catch (e) {
      }
    }
    const partidosDelDia = allFixtures.filter((f) => {
      try {
        const info = calcularFechaPlaca(f.fixture.date);
        return info.fechaPlaca === fechaBase;
      } catch (e) {
        return false;
      }
    });
    const partidos = partidosDelDia.map((f) => {
      const infoPlaca = calcularFechaPlaca(f.fixture.date);
      return {
        id: f.fixture.id,
        local: traducirPais(f.teams.home.name),
        visitante: traducirPais(f.teams.away.name),
        banderaLocal: getFlagPais(f.teams.home.name),
        banderaVisitante: getFlagPais(f.teams.away.name),
        hora: formatearHora(f.fixture.date),
        horaUTC: f.fixture.date,
        estado: traducirEstadoAPIFootball(f.fixture.status.short),
        estadio: f.fixture.venue?.name || "",
        ciudad: f.fixture.venue?.city || "",
        grupo: traducirGrupo(f.league?.round) || null,
        arbitro: f.fixture.referee || null,
        golesLocal: f.goals?.home ?? null,
        golesVisitante: f.goals?.away ?? null,
        eventos: [],
        estadisticas: [],
        madugada: infoPlaca.esMadrugada
      };
    });
    return { partidos, fecha: fechaBase, fuente: "api-football", totalSeason: allFixtures.length };
  } catch (err) {
    return { error: err.message };
  }
}
__name(obtenerPartidosAPIFootball, "obtenerPartidosAPIFootball");
var THESPORTSDB_URL = "https://www.thesportsdb.com/api/v1/json";
var THESPORTSDB_LEAGUE_ID = "4429";
function traducirEstadoTSDB(status) {
  const mapa = {
    "NS": "SCHEDULED",
    "TBD": "SCHEDULED",
    "1H": "IN_PLAY",
    "2H": "IN_PLAY",
    "HT": "IN_PLAY",
    "ET": "IN_PLAY",
    "P": "IN_PLAY",
    "LIVE": "IN_PLAY",
    "FT": "FINISHED",
    "AET": "FINISHED",
    "PEN": "FINISHED",
    "PST": "POSTPONED",
    "CANC": "CANCELLED"
  };
  return mapa[status] || status || "SCHEDULED";
}
__name(traducirEstadoTSDB, "traducirEstadoTSDB");
async function obtenerPartidosTheSportsDB(env, fecha) {
  const apiKey = env.THESPORTSDB_KEY || "3";
  try {
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1e3);
    const hoy = ahoraAR.toISOString().split("T")[0];
    const fechaBase = fecha || hoy;
    const cacheKey = "mundial:tsdb:2026";
    let allEvents = [];
    let cachedIds = /* @__PURE__ */ new Set();
    try {
      if (env.KV) {
        const raw = await env.KV.get(cacheKey, "json");
        if (raw && raw.events && raw.events.length > 0) {
          allEvents = raw.events;
          raw.events.forEach((e) => cachedIds.add(e.idEvent));
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          const hayEnVivo = raw.events.some((ev) => {
            try {
              const evDate = new Date(ev.strTimestamp || ev.dateEvent + "T" + (ev.strTime || "00:00:00") + "Z");
              const arDate = new Date(evDate.getTime() - 3 * 60 * 60 * 1e3);
              const evDay = arDate.toISOString().split("T")[0];
              const st = ev.strStatus;
              return evDay === fechaBase && (st === "1H" || st === "2H" || st === "HT" || st === "LIVE" || st === "ET" || st === "P");
            } catch (e) {
              return false;
            }
          });
          const maxAge = hayEnVivo ? 2 * 60 * 1e3 : 12 * 60 * 60 * 1e3;
          if (cacheAge < maxAge && allEvents.length >= 48) {
            return filtrarTSDBPorFecha(allEvents, fechaBase);
          }
        }
      }
    } catch (cacheErr) {
    }
    const url = `${THESPORTSDB_URL}/${apiKey}/eventsseason.php?id=${THESPORTSDB_LEAGUE_ID}&s=2026`;
    let res;
    try {
      res = await fetch(url);
    } catch (fetchErr) {
      if (allEvents.length > 0) return filtrarTSDBPorFecha(allEvents, fechaBase);
      return { error: `Error conexi\xF3n TheSportsDB: ${fetchErr.message}` };
    }
    if (!res.ok) {
      if (allEvents.length > 0) return filtrarTSDBPorFecha(allEvents, fechaBase);
      return { error: `Error TheSportsDB: ${res.status}` };
    }
    const data = await res.json();
    const newEvents = data.events || [];
    let added = 0;
    for (const ev of newEvents) {
      if (!cachedIds.has(ev.idEvent)) {
        allEvents.push(ev);
        cachedIds.add(ev.idEvent);
        added++;
      }
    }
    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          events: allEvents,
          _cachedAt: Date.now(),
          _count: allEvents.length
        }), { expirationTtl: 43200 });
      }
    } catch (e) {
    }
    return filtrarTSDBPorFecha(allEvents, fechaBase);
  } catch (err) {
    return { error: err.message };
  }
}
__name(obtenerPartidosTheSportsDB, "obtenerPartidosTheSportsDB");
function filtrarTSDBPorFecha(events, fechaBase) {
  const partidosDelDia = events.filter((ev) => {
    if (!ev.strTimestamp && !ev.dateEvent) return false;
    try {
      const utcDate = new Date(ev.strTimestamp || ev.dateEvent + "T" + (ev.strTime || "00:00:00") + "Z");
      const info = calcularFechaPlaca(utcDate.toISOString());
      return info.fechaPlaca === fechaBase;
    } catch (e) {
      return false;
    }
  });
  const partidos = partidosDelDia.map((ev) => {
    const utcDate = new Date(ev.strTimestamp || ev.dateEvent + "T" + (ev.strTime || "00:00:00") + "Z");
    const infoPlaca = calcularFechaPlaca(utcDate.toISOString());
    return {
      id: ev.idEvent,
      local: traducirPais(ev.strHomeTeam),
      visitante: traducirPais(ev.strAwayTeam),
      banderaLocal: getFlagPais(ev.strHomeTeam),
      banderaVisitante: getFlagPais(ev.strAwayTeam),
      hora: formatearHora(ev.strTimestamp || ev.dateEvent + "T" + (ev.strTime || "00:00:00") + "Z"),
      horaUTC: ev.strTimestamp || ev.dateEvent + "T" + (ev.strTime || "00:00:00"),
      estado: traducirEstadoTSDB(ev.strStatus),
      estadio: ev.strVenue || "",
      ciudad: ev.strCountry || "",
      competicion: ev.strLeague || "",
      grupo: null,
      etapa: ev.strCircuit || null,
      jornada: null,
      arbitro: null,
      golesLocal: ev.intHomeScore !== null && ev.intHomeScore !== void 0 ? parseInt(ev.intHomeScore) : null,
      golesVisitante: ev.intAwayScore !== null && ev.intAwayScore !== void 0 ? parseInt(ev.intAwayScore) : null,
      golesHTLocal: null,
      golesHTVisitante: null,
      goleadores: [],
      eventos: [],
      estadisticas: [],
      // Extras de TheSportsDB
      badgeLocal: ev.strHomeTeamBadge || null,
      badgeVisitante: ev.strAwayTeamBadge || null,
      poster: ev.strPoster || null,
      madugada: infoPlaca.esMadrugada
    };
  });
  return { partidos, fecha: fechaBase, fuente: "thesportsdb", totalSeason: events.length };
}
__name(filtrarTSDBPorFecha, "filtrarTSDBPorFecha");
var ZAFRONIX_URL = "https://api.zafronix.com/fifa/worldcup/v1";
var KG_URL = "https://kgsearch.googleapis.com/v1/entities:search";
async function obtenerPosicionesZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;
  try {
    const cacheKey = "mundial:zafronix:standings:2026";
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, "json");
      if (cached && Date.now() - (cached._cachedAt || 0) < 10 * 60 * 1e3) {
        return cached;
      }
    }
    const res = await fetch(`${ZAFRONIX_URL}/standings?year=2026`, {
      headers: { "X-API-Key": apiKey }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.groups) return null;
    const grupos = {};
    Object.entries(data.groups).forEach(([letra, equipos]) => {
      grupos[letra] = equipos.map((eq) => ({
        posicion: eq.position,
        equipo: traducirPais(eq.team),
        bandera: getFlagPais(eq.team),
        puntos: eq.points,
        jugados: eq.played,
        ganados: eq.won,
        empatados: eq.drawn,
        perdidos: eq.lost,
        golesFavor: eq.goalsFor,
        golesContra: eq.goalsAgainst,
        diferenciaGoles: eq.goalDifference,
        clasificado: eq.advanced || false
      }));
    });
    const resultado = { grupos, fuente: "zafronix" };
    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado,
          _cachedAt: Date.now()
        }), { expirationTtl: 3600 });
      }
    } catch (e) {
    }
    return resultado;
  } catch (err) {
    console.error("Zafronix standings error:", err.message);
    return null;
  }
}
__name(obtenerPosicionesZafronix, "obtenerPosicionesZafronix");
async function obtenerGoleadoresZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;
  try {
    const cacheKey = "mundial:zafronix:topscorers:2026";
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, "json");
      if (cached && Date.now() - (cached._cachedAt || 0) < 30 * 60 * 1e3) {
        return cached;
      }
    }
    const matchesCacheKey = "mundial:zafronix:matches:2026";
    let zMatches = null;
    if (env.KV) {
      const cached = await env.KV.get(matchesCacheKey, "json");
      if (cached && cached.matches) zMatches = cached.matches;
    }
    if (!zMatches) {
      const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
        headers: { "X-API-Key": apiKey }
      });
      if (!res.ok) return null;
      const data = await res.json();
      zMatches = data.matches || data;
    }
    if (!zMatches || !Array.isArray(zMatches)) return null;
    const finished = zMatches.filter((m) => {
      const status = m.status || m.state || "";
      return ["FT", "FINISHED", "AET", "PEN"].includes(status);
    });
    if (finished.length === 0) return null;
    const golesPorJugador = {};
    for (const match of finished) {
      const homeTeam = match.homeTeam?.name || match.home || "";
      const awayTeam = match.awayTeam?.name || match.away || "";
      const goals = match.events?.filter((e) => e.type === "Goal" || e.event === "Goal") || match.goals || [];
      for (const goal of goals) {
        const player = goal.player || goal.scorer || goal.name || "";
        const team = goal.team || (goal.side === "home" ? homeTeam : awayTeam);
        if (!player) continue;
        const key = `${player}|||${team}`;
        if (!golesPorJugador[key]) {
          golesPorJugador[key] = {
            nombre: player,
            equipo: traducirPais(team),
            bandera: getFlagPais(team),
            goles: 0,
            asistencias: 0,
            partidos: 0
          };
        }
        golesPorJugador[key].goles++;
      }
    }
    const goleadores = Object.values(golesPorJugador).sort((a, b) => b.goles - a.goles).slice(0, 10);
    if (golesPorJugador.length === 0) return null;
    const resultado = { goleadores, fuente: "zafronix-aggregated" };
    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado,
          _cachedAt: Date.now()
        }), { expirationTtl: 3600 });
      }
    } catch (e) {
    }
    return resultado;
  } catch (err) {
    console.error("Zafronix aggregated topscorers error:", err.message);
    return null;
  }
}
__name(obtenerGoleadoresZafronix, "obtenerGoleadoresZafronix");
async function obtenerBracketZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;
  try {
    const cacheKey = "mundial:zafronix:bracket:2026";
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, "json");
      if (cached && Date.now() - (cached._cachedAt || 0) < 10 * 60 * 1e3) {
        return cached;
      }
    }
    const res = await fetch(`${ZAFRONIX_URL}/bracket?year=2026`, {
      headers: { "X-API-Key": apiKey }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.stages) return null;
    const etapas = {};
    const stageNames = {
      "round_of_32": "Ronda de 32",
      "round_of_16": "Octavos de Final",
      "quarter_final": "Cuartos de Final",
      "semi_final": "Semifinales",
      "third_place": "Tercer Puesto",
      "final": "Final"
    };
    Object.entries(data.stages).forEach(([stage, matches]) => {
      etapas[stageNames[stage] || stage] = matches.map((m) => ({
        id: m.matchId,
        local: m.home ? traducirPais(m.home) : m.homeRef || "TBD",
        visitante: m.away ? traducirPais(m.away) : m.awayRef || "TBD",
        golesLocal: m.homeScore,
        golesVisitante: m.awayScore,
        estadio: m.stadium || "",
        ciudad: m.city || "",
        horaUTC: m.kickoffUtc || null,
        ganador: m.winner ? traducirPais(m.winner) : null
      }));
    });
    const resultado = { etapas, fuente: "zafronix" };
    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado,
          _cachedAt: Date.now()
        }), { expirationTtl: 3600 });
      }
    } catch (e) {
    }
    return resultado;
  } catch (err) {
    console.error("Zafronix bracket error:", err.message);
    return null;
  }
}
__name(obtenerBracketZafronix, "obtenerBracketZafronix");
async function obtenerPlantelesZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;
  try {
    const cacheKey = "mundial:zafronix:teams:2026";
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, "json");
      if (cached && Date.now() - (cached._cachedAt || 0) < 6 * 60 * 60 * 1e3) {
        return cached;
      }
    }
    const res = await fetch(`${ZAFRONIX_URL}/teams?tournament=2026`, {
      headers: { "X-API-Key": apiKey }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const equipos = {};
    data.forEach((team) => {
      const nombre = traducirPais(team.name);
      equipos[nombre] = {
        nombre,
        bandera: getFlagPais(team.name),
        grupo: team.group || null,
        jugadores: (team.roster || []).map((j) => ({
          numero: j.jersey,
          nombre: j.name,
          posicion: j.position,
          club: j.club?.name || "",
          goles: j.goals || 0,
          capitan: j.captain || false
        }))
      };
    });
    const resultado = { equipos, fuente: "zafronix" };
    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado,
          _cachedAt: Date.now()
        }), { expirationTtl: 21600 });
      }
    } catch (e) {
    }
    return resultado;
  } catch (err) {
    console.error("Zafronix teams error:", err.message);
    return null;
  }
}
__name(obtenerPlantelesZafronix, "obtenerPlantelesZafronix");
async function obtenerEstadiosZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;
  try {
    const cacheKey = "mundial:zafronix:stadiums:2026";
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, "json");
      if (cached) return cached;
    }
    const res = await fetch(`${ZAFRONIX_URL}/stadiums?tournament=2026`, {
      headers: { "X-API-Key": apiKey }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data) return null;
    const estadios = data.data.map((s) => ({
      id: s.id,
      nombre: s.name,
      nombreFIFA: s.fifaNames?.["2026"] || s.name,
      ciudad: s.city,
      pais: s.country,
      capacidad: s.capacity,
      coordenadas: s.coords || null,
      altitud: s.elevationM || null
    }));
    const resultado = { estadios, fuente: "zafronix" };
    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado,
          _cachedAt: Date.now()
        }), { expirationTtl: 86400 });
      }
    } catch (e) {
    }
    return resultado;
  } catch (err) {
    console.error("Zafronix stadiums error:", err.message);
    return null;
  }
}
__name(obtenerEstadiosZafronix, "obtenerEstadiosZafronix");
async function enriquecerConEstadios(env, partidos) {
  const estadiosData = await obtenerEstadiosZafronix(env);
  if (!estadiosData || !estadiosData.estadios) return partidos;
  const estadioMap = {};
  estadiosData.estadios.forEach((e) => {
    estadioMap[e.nombre.toLowerCase()] = e;
    if (e.nombreFIFA !== e.nombre) estadioMap[e.nombreFIFA.toLowerCase()] = e;
  });
  return partidos.map((p) => {
    if (p.estadio && p.estadio !== "TBD") {
      const key = p.estadio.toLowerCase();
      const estadio = estadioMap[key];
      if (estadio) {
        p.estadioInfo = estadio;
        if (!p.ciudad) p.ciudad = estadio.ciudad;
      }
    }
    return p;
  });
}
__name(enriquecerConEstadios, "enriquecerConEstadios");
async function buscarKG(env, query, types = []) {
  if (!env.KG_KEY) return null;
  const cacheKey = `kg:${query.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  try {
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, "json");
      if (cached && Date.now() - (cached._cachedAt || 0) < 24 * 60 * 60 * 1e3) {
        return cached.data;
      }
    }
    const params = new URLSearchParams({
      query,
      key: env.KG_KEY,
      limit: "1",
      indent: "true"
    });
    if (types.length > 0) params.append("types", types.join(","));
    const res = await fetch(`${KG_URL}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.itemListElement?.[0]?.result;
    if (!item) return null;
    const result = {
      name: item.name || null,
      description: item.description || null,
      detailedDescription: item.detailedDescription?.articleBody || null,
      url: item.detailedDescription?.url || null,
      image: item.image?.contentUrl || null,
      type: item["@type"] || []
    };
    if (env.KV) {
      await env.KV.put(cacheKey, JSON.stringify({
        data: result,
        _cachedAt: Date.now()
      }), { expirationTtl: 86400 });
    }
    return result;
  } catch (e) {
    return null;
  }
}
__name(buscarKG, "buscarKG");
async function enriquecerConKnowledgeGraph(env, partidos) {
  if (!env.KG_KEY) return partidos;
  for (const p of partidos) {
    if (p.local && !p.localKG) {
      const query = `${p.local} national football team`;
      const kgData = await buscarKG(env, query, ["SportsTeam"]);
      if (kgData) p.localKG = kgData;
    }
    if (p.visitante && !p.visitanteKG) {
      const query = `${p.visitante} national football team`;
      const kgData = await buscarKG(env, query, ["SportsTeam"]);
      if (kgData) p.visitanteKG = kgData;
    }
    if (p.estadio && p.estadio !== "TBD" && !p.estadioKG) {
      const kgData = await buscarKG(env, p.estadio, ["Stadium", "Place"]);
      if (kgData) p.estadioKG = kgData;
    }
    if (p.ciudad && !p.ciudadKG) {
      const kgData = await buscarKG(env, `${p.ciudad} Mexico`, ["City", "Place"]);
      if (kgData) p.ciudadKG = kgData;
    }
  }
  return partidos;
}
__name(enriquecerConKnowledgeGraph, "enriquecerConKnowledgeGraph");
async function enriquecerConZafronix(env, partidos) {
  if (!env.ZAFRONIX_KEY) return partidos;
  let zMatches = null;
  const cacheKey = "mundial:zafronix:matches:2026";
  try {
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, "json");
      if (cached && cached.matches && Date.now() - (cached._cachedAt || 0) < 5 * 60 * 1e3) {
        zMatches = cached.matches;
      }
    }
    if (!zMatches) {
      const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
        headers: { "X-API-Key": env.ZAFRONIX_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        zMatches = data.data || [];
        if (env.KV && zMatches.length > 0) {
          await env.KV.put(cacheKey, JSON.stringify({
            matches: zMatches,
            _cachedAt: Date.now()
          }), { expirationTtl: 300 });
        }
      }
    }
  } catch (e) {
    return partidos;
  }
  if (!zMatches || zMatches.length === 0) return partidos;
  partidos.forEach((p) => {
    const pHome = normalizeTeamName(p._homeRaw || p.local || "");
    const pAway = normalizeTeamName(p._awayRaw || p.visitante || "");
    if (!pHome || !pAway) return;
    const found = zMatches.find((m) => {
      const mh = normalizeTeamName(m.homeTeam || "");
      const ma = normalizeTeamName(m.awayTeam || "");
      return mh === pHome && ma === pAway || mh === pAway && ma === pHome;
    });
    if (!found) return;
    p._zafronixId = found.id;
    if (found.stadium && !p.estadio) p.estadio = found.stadium;
    if (found.city && !p.ciudad) p.ciudad = found.city;
    if (found.referee) {
      p.arbitro = typeof found.referee === "object" ? found.referee.name || "" : found.referee;
    }
    if (found.attendance) p.asistencia = found.attendance;
    if (found.status === "finished" || found.status === "full_time" || found.status === "aet" || found.status === "penalties" || found.homeScore !== null && found.homeScore !== void 0 && found.awayScore !== null && found.awayScore !== void 0 && !found.liveMinute) {
      if (p.estado === "TIMED" || p.estado === "SCHEDULED") {
        p.estado = "FINISHED";
      }
    } else if (found.status === "in_play" || found.status === "live" || found.liveMinute) {
      if (p.estado === "TIMED" || p.estado === "SCHEDULED") {
        p.estado = "IN_PLAY";
      }
      p.minutoLive = found.liveMinute || null;
    }
    if (found.homeScore !== null && found.homeScore !== void 0) {
      p.golesLocal = found.homeScore;
    }
    if (found.awayScore !== null && found.awayScore !== void 0) {
      p.golesVisitante = found.awayScore;
    }
    if (found.goals && Array.isArray(found.goals) && found.goals.length > 0) {
      p._zafronixHasGoals = true;
      p.goleadores = found.goals.map((g) => {
        const player = g.player || g.name || g.scorer || "";
        const minute = g.minute || g.time || "";
        return `${player} ${minute}'`;
      }).slice(0, 8);
      if (!p.eventos) p.eventos = [];
      found.goals.forEach((g) => {
        p.eventos.push({
          tipo: "Goal",
          minuto: g.minute || g.time || null,
          jugador: g.player || g.name || g.scorer || "",
          equipo: g.team || "",
          detalle: g.type || null
        });
      });
    }
    if (found.cards && Array.isArray(found.cards) && found.cards.length > 0) {
      if (!p.eventos) p.eventos = [];
      found.cards.forEach((c) => {
        p.eventos.push({
          tipo: "Card",
          minuto: c.minute || c.time || null,
          jugador: c.player || c.name || "",
          equipo: c.team || "",
          detalle: c.card || c.type || null
        });
      });
    }
    if (found.substitutions && Array.isArray(found.substitutions) && found.substitutions.length > 0) {
      if (!p.eventos) p.eventos = [];
      found.substitutions.forEach((s) => {
        p.eventos.push({
          tipo: "subst",
          minuto: s.minute || s.time || null,
          jugador: s.playerIn || s.in || "",
          equipo: s.team || "",
          detalle: `Sale: ${s.playerOut || s.out || ""}`
        });
      });
    }
    if (found.lineups) {
      if (found.lineups.home && Array.isArray(found.lineups.home) && found.lineups.home.length > 0) {
        p.formacionLocal = {
          formacion: found.formations?.home || null,
          jugadores: found.lineups.home.map((pl) => pl.name || pl.player || pl).slice(0, 11)
        };
      }
      if (found.lineups.away && Array.isArray(found.lineups.away) && found.lineups.away.length > 0) {
        p.formacionVisitante = {
          formacion: found.formations?.away || null,
          jugadores: found.lineups.away.map((pl) => pl.name || pl.player || pl).slice(0, 11)
        };
      }
    } else if (found.formations) {
      if (found.formations.home) {
        p.formacionLocal = { formacion: found.formations.home, jugadores: [] };
      }
      if (found.formations.away) {
        p.formacionVisitante = { formacion: found.formations.away, jugadores: [] };
      }
    }
  });
  const needDetail = partidos.filter(
    (p) => p._zafronixId && !p._zafronixHasGoals && (p.estado === "FINISHED" || p.estado === "IN_PLAY" || p.estado === "FT" || p.estado === "AET" || p.estado === "PEN")
  );
  for (const p of needDetail) {
    try {
      const detailCacheKey = `zafronix:match:${p._zafronixId}`;
      let detail = null;
      if (env.KV) {
        const cached = await env.KV.get(detailCacheKey, "json");
        const ttl = p.estado === "FINISHED" || p.estado === "FT" ? 3600 : 120;
        if (cached && Date.now() - (cached._cachedAt || 0) < ttl * 1e3) {
          detail = cached;
        }
      }
      if (!detail) {
        const detRes = await fetch(`${ZAFRONIX_URL}/matches/${p._zafronixId}`, {
          headers: { "X-API-Key": env.ZAFRONIX_KEY }
        });
        if (detRes.ok) {
          detail = await detRes.json();
          if (env.KV && detail) {
            const ttl = p.estado === "FINISHED" || p.estado === "FT" ? 3600 : 120;
            await env.KV.put(detailCacheKey, JSON.stringify({
              ...detail,
              _cachedAt: Date.now()
            }), { expirationTtl: ttl });
          }
        }
      }
      if (detail) {
        if (detail.goals && Array.isArray(detail.goals) && detail.goals.length > 0) {
          p.goleadores = detail.goals.map((g) => {
            const player = g.player || g.name || g.scorer || "";
            const minute = g.minute || g.time || "";
            return `${player} ${minute}'`;
          }).slice(0, 8);
          if (!p.eventos) p.eventos = [];
          detail.goals.forEach((g) => {
            p.eventos.push({
              tipo: "Goal",
              minuto: g.minute || g.time || null,
              jugador: g.player || g.name || g.scorer || "",
              equipo: g.team || "",
              detalle: g.type || g.bodyPart || null
            });
          });
        }
        if (detail.cards && Array.isArray(detail.cards) && detail.cards.length > 0) {
          if (!p.eventos) p.eventos = [];
          detail.cards.forEach((c) => {
            p.eventos.push({
              tipo: "Card",
              minuto: c.minute || c.time || null,
              jugador: c.player || c.name || "",
              equipo: c.team || "",
              detalle: c.card || c.type || null
            });
          });
        }
        if (detail.substitutions && Array.isArray(detail.substitutions) && detail.substitutions.length > 0) {
          if (!p.eventos) p.eventos = [];
          detail.substitutions.forEach((s) => {
            p.eventos.push({
              tipo: "subst",
              minuto: s.minute || s.time || null,
              jugador: s.playerIn || s.in || "",
              equipo: s.team || "",
              detalle: `Sale: ${s.playerOut || s.out || ""}`
            });
          });
        }
        if (detail.lineups) {
          if (detail.lineups.home && Array.isArray(detail.lineups.home) && detail.lineups.home.length > 0) {
            p.formacionLocal = {
              formacion: detail.formations?.home || null,
              jugadores: detail.lineups.home.map((pl) => pl.name || pl.player || pl).slice(0, 11)
            };
          }
          if (detail.lineups.away && Array.isArray(detail.lineups.away) && detail.lineups.away.length > 0) {
            p.formacionVisitante = {
              formacion: detail.formations?.away || null,
              jugadores: detail.lineups.away.map((pl) => pl.name || pl.player || pl).slice(0, 11)
            };
          }
        }
        if (detail.weather) p.weather = detail.weather;
        if (detail.captains) p.capitanes = detail.captains;
      }
      await sleep(80);
    } catch (e) {
      console.error(`Error fetching Zafronix detail for ${p._zafronixId}:`, e.message);
    }
  }
  partidos.forEach((p) => {
    if (p.goleadores && p.goleadores.length > 0 && p.golesLocal !== null && p.golesVisitante !== null) {
      const totalGoals = (p.golesLocal || 0) + (p.golesVisitante || 0);
      if (p.goleadores.length > totalGoals && totalGoals >= 0) {
        p._goleadoresOriginales = p.goleadores;
        p.goleadores = [];
        p._goleadoresDescartados = true;
      }
    }
  });
  return partidos;
}
__name(enriquecerConZafronix, "enriquecerConZafronix");
async function enriquecerEventosAPIFootball(env, partidos) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return partidos;
  const elegibles = partidos.filter((p) => {
    const estado = p.estado;
    return estado === "FINISHED" || estado === "IN_PLAY" || estado === "FT" || estado === "AET" || estado === "PEN";
  });
  if (elegibles.length === 0) return partidos;
  const batch = elegibles.slice(0, 4);
  for (const partido of batch) {
    const fixtureId = partido.afFixtureId || partido.id;
    if (!fixtureId) continue;
    try {
      const cacheKey = `mundial:af:detail:${fixtureId}`;
      if (env.KV) {
        const cached = await env.KV.get(cacheKey, "json");
        if (cached && cached.eventos) {
          partido.eventos = cached.eventos;
          partido.formacionLocal = cached.formacionLocal || null;
          partido.formacionVisitante = cached.formacionVisitante || null;
          partido.estadisticas = cached.estadisticas || [];
          partido.goleadores = cached.goleadores || partido.goleadores || [];
          continue;
        }
      }
      const detalle = await obtenerDetallePartidoAPIFootball(env, fixtureId);
      if (detalle && !detalle.error) {
        partido.eventos = detalle.eventos || [];
        partido.formacionLocal = detalle.formacionLocal || null;
        partido.formacionVisitante = detalle.formacionVisitante || null;
        partido.estadisticas = detalle.estadisticas || [];
        if (detalle.eventos && detalle.eventos.length > 0) {
          partido.goleadores = detalle.eventos.filter((e) => e.tipo === "Goal").map((e) => `${e.jugador} ${e.minuto}'`).slice(0, 5);
        }
        try {
          if (env.KV) {
            const ttl = partido.estado === "FINISHED" || partido.estado === "FT" ? 7200 : 120;
            await env.KV.put(cacheKey, JSON.stringify({
              eventos: partido.eventos,
              formacionLocal: partido.formacionLocal,
              formacionVisitante: partido.formacionVisitante,
              estadisticas: partido.estadisticas,
              goleadores: partido.goleadores,
              _cachedAt: Date.now()
            }), { expirationTtl: ttl });
          }
        } catch (e) {
        }
      }
      await sleep(100);
    } catch (e) {
      console.error(`Error enriqueciendo partido ${fixtureId}:`, e.message);
    }
  }
  return partidos;
}
__name(enriquecerEventosAPIFootball, "enriquecerEventosAPIFootball");
async function obtenerDetallePartidoAPIFootball(env, fixtureId) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada" };
  try {
    const [eventsRes, lineupsRes, statsRes] = await Promise.all([
      fetch(`${API_FOOTBALL_URL}/fixtures/events?fixture=${fixtureId}`, { headers: { "x-apisports-key": apiKey } }),
      fetch(`${API_FOOTBALL_URL}/fixtures/lineups?fixture=${fixtureId}`, { headers: { "x-apisports-key": apiKey } }),
      fetch(`${API_FOOTBALL_URL}/fixtures/statistics?fixture=${fixtureId}`, { headers: { "x-apisports-key": apiKey } })
    ]);
    const resultado = { eventos: [], formacionLocal: null, formacionVisitante: null, estadisticas: [] };
    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      if (eventsData.response) {
        resultado.eventos = eventsData.response.map((e) => ({
          tipo: e.type,
          // Goal, Card, subst
          minuto: e.time?.elapsed,
          equipo: e.team?.name,
          jugador: e.player?.name,
          asistio: e.assist?.name || null,
          detalle: e.detail || null
        }));
      }
    }
    if (lineupsRes.ok) {
      const lineupsData = await lineupsRes.json();
      if (lineupsData.response && lineupsData.response.length >= 2) {
        resultado.formacionLocal = {
          formacion: lineupsData.response[0].formation,
          jugadores: lineupsData.response[0].startXI?.map((p) => p.player?.name) || []
        };
        resultado.formacionVisitante = {
          formacion: lineupsData.response[1].formation,
          jugadores: lineupsData.response[1].startXI?.map((p) => p.player?.name) || []
        };
      }
    }
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      if (statsData.response) {
        resultado.estadisticas = statsData.response.map((s) => ({
          equipo: s.team?.name,
          stats: s.statistics?.map((st) => ({ tipo: st.type, valor: st.value })) || []
        }));
      }
    }
    return resultado;
  } catch (err) {
    return { error: err.message };
  }
}
__name(obtenerDetallePartidoAPIFootball, "obtenerDetallePartidoAPIFootball");
async function obtenerPosicionesGrupos(env) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada" };
  try {
    const url = `${API_FOOTBALL_URL}/standings?league=1&season=2026`;
    const res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
    if (!res.ok) return { error: `Error API-Football: ${res.status}` };
    const data = await res.json();
    if (!data.response || data.response.length === 0) return { grupos: [] };
    const grupos = {};
    data.response[0].league.standings.forEach((grupo) => {
      const letra = grupo[0]?.group?.replace("Group ", "") || "?";
      grupos[letra] = grupo.map((eq) => ({
        posicion: eq.rank,
        equipo: traducirPais(eq.team?.name),
        bandera: getFlagPais(eq.team?.name),
        puntos: eq.points,
        jugados: eq.all?.played,
        ganados: eq.all?.win,
        empatados: eq.all?.draw,
        perdidos: eq.all?.lose,
        golesFavor: eq.all?.goals?.for,
        golesContra: eq.all?.goals?.against,
        diferenciaGoles: eq.goalsDiff
      }));
    });
    return { grupos };
  } catch (err) {
    return { error: err.message };
  }
}
__name(obtenerPosicionesGrupos, "obtenerPosicionesGrupos");
async function obtenerGoleadores(env) {
  const zafronix = await obtenerGoleadoresZafronix(env);
  if (zafronix && zafronix.goleadores && zafronix.goleadores.length > 0) {
    return zafronix;
  }
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada y Zafronix sin datos" };
  try {
    const url = `${API_FOOTBALL_URL}/players/topscorers?league=1&season=2026`;
    const res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
    if (!res.ok) return { error: `Error API-Football: ${res.status}` };
    const data = await res.json();
    if (!data.response) return { goleadores: [] };
    const goleadores = data.response.slice(0, 10).map((g) => ({
      nombre: g.player?.name,
      equipo: traducirPais(g.statistics?.[0]?.team?.name),
      bandera: getFlagPais(g.statistics?.[0]?.team?.name),
      goles: g.statistics?.[0]?.goals?.total || 0,
      asistencias: g.statistics?.[0]?.goals?.assists || 0,
      partidos: g.statistics?.[0]?.games?.appearences || 0
    }));
    return { goleadores, fuente: "api-football" };
  } catch (err) {
    return { error: err.message };
  }
}
__name(obtenerGoleadores, "obtenerGoleadores");
function traducirEstadoAPIFootball(status) {
  const mapa = {
    "TBD": "SCHEDULED",
    "NS": "SCHEDULED",
    "PND": "SCHEDULED",
    "1H": "IN_PLAY",
    "2H": "IN_PLAY",
    "HT": "IN_PLAY",
    "ET": "IN_PLAY",
    "BT": "IN_PLAY",
    "P": "IN_PLAY",
    "SUSP": "SUSPENDED",
    "INT": "SUSPENDED",
    "FT": "FINISHED",
    "AET": "FINISHED",
    "PEN": "FINISHED",
    "PST": "POSTPONED",
    "CANC": "CANCELLED",
    "ABD": "CANCELLED",
    "AWD": "AWARDED",
    "WO": "AWARDED",
    "LIVE": "IN_PLAY"
  };
  return mapa[status] || status;
}
__name(traducirEstadoAPIFootball, "traducirEstadoAPIFootball");
function combinarDatosPartido(partidoFD, partidoAF) {
  if (!partidoFD && !partidoAF) return null;
  if (!partidoFD) return partidoAF;
  if (!partidoAF) return partidoFD;
  return {
    ...partidoFD,
    // ID de API-Football para enriquecer con detalle después
    afFixtureId: partidoAF.id || null,
    // Estadio: preferir API-Football si football-data no tiene
    estadio: partidoFD.estadio && partidoFD.estadio !== "TBD" && partidoFD.estadio !== "" ? partidoFD.estadio : partidoAF.estadio && partidoAF.estadio !== "TBD" ? partidoAF.estadio : partidoFD.estadio,
    // Campos enriquecidos solo de API-Football
    ciudad: partidoAF.ciudad || null,
    arbitro: partidoAF.arbitro || null,
    formacionLocal: partidoAF.formacionLocal,
    formacionVisitante: partidoAF.formacionVisitante,
    eventos: partidoAF.eventos || [],
    estadisticas: partidoAF.estadisticas || [],
    // Si API-Football tiene grupo mejor formateado, usarlo
    grupo: partidoAF.grupo || partidoFD.grupo
  };
}
__name(combinarDatosPartido, "combinarDatosPartido");
async function obtenerPartidosCombinados(env, fecha) {
  const resultados = { partidos: [], fecha: fecha || null, fuentes: [], enriquecido: false };
  const fdResult = await obtenerPartidosMundial(env, 2e3, fecha);
  let fdPartidos = [];
  if (!fdResult.error && fdResult.partidos) {
    fdPartidos = fdResult.partidos;
    resultados.fuentes.push("football-data");
    resultados.fecha = fdResult.fecha;
  }
  const afResult = await obtenerPartidosAPIFootball(env, fecha);
  let afPartidos = [];
  if (!afResult.error && afResult.partidos) {
    afPartidos = afResult.partidos;
    resultados.fuentes.push("api-football");
    if (!resultados.fecha) resultados.fecha = afResult.fecha;
  }
  const tsdbResult = await obtenerPartidosTheSportsDB(env, fecha);
  let tsdbPartidos = [];
  if (!tsdbResult.error && tsdbResult.partidos) {
    tsdbPartidos = tsdbResult.partidos;
    resultados.fuentes.push("thesportsdb");
    if (!resultados.fecha) resultados.fecha = tsdbResult.fecha;
  }
  if (fdPartidos.length === 0 && afPartidos.length === 0 && tsdbPartidos.length === 0) {
    return { ...resultados, mensaje: "Sin partidos para esta fecha" };
  }
  if (fdPartidos.length === 0 && afPartidos.length === 0) {
    let partidos = tsdbPartidos;
    partidos = await enriquecerEventosAPIFootball(env, partidos);
    partidos = await enriquecerConEstadios(env, partidos);
    resultados.enriquecido = true;
    return { ...resultados, partidos };
  }
  if (afPartidos.length === 0 && tsdbPartidos.length === 0) {
    let partidos = fdPartidos;
    partidos = await enriquecerEventosAPIFootball(env, partidos);
    partidos = await enriquecerConEstadios(env, partidos);
    resultados.enriquecido = true;
    return { ...resultados, partidos };
  }
  if (fdPartidos.length === 0 && tsdbPartidos.length === 0) {
    let partidos = afPartidos;
    partidos = await enriquecerEventosAPIFootball(env, partidos);
    partidos = await enriquecerConEstadios(env, partidos);
    resultados.enriquecido = true;
    return { ...resultados, partidos };
  }
  const partidosCombinados = fdPartidos.map((fd) => {
    const af = afPartidos.find((a) => matchPartidos(a, fd));
    const tsdb = tsdbPartidos.find((t) => matchPartidos(t, fd));
    const combined = combinarDatosPartido(fd, af);
    if (tsdb) {
      if (tsdb.badgeLocal && !combined.badgeLocal) combined.badgeLocal = tsdb.badgeLocal;
      if (tsdb.badgeVisitante && !combined.badgeVisitante) combined.badgeVisitante = tsdb.badgeVisitante;
      if (tsdb.poster && !combined.poster) combined.poster = tsdb.poster;
      if (tsdb.estadio && tsdb.estadio !== "TBD" && tsdb.estadio !== "") {
        if (!combined.estadio || combined.estadio === "" || combined.estadio === "TBD" || /stadium/i.test(combined.estadio)) {
          combined.estadio = tsdb.estadio;
        }
      }
    }
    delete combined._localRaw;
    delete combined._visitanteRaw;
    delete combined._fechaPlaca;
    combined.madrugada = combined._esMadrugada || false;
    delete combined._esMadrugada;
    return combined;
  });
  afPartidos.forEach((af) => {
    const yaExiste = partidosCombinados.some((p) => matchPartidos(p, af));
    if (!yaExiste) {
      if (af.madrugada === void 0 && af.horaUTC) {
        af.madrugada = calcularFechaPlaca(af.horaUTC).esMadrugada;
      }
      partidosCombinados.push(af);
    }
  });
  tsdbPartidos.forEach((tsdb) => {
    const yaExiste = partidosCombinados.some((p) => matchPartidos(p, tsdb));
    if (!yaExiste) {
      if (tsdb.madrugada === void 0 && tsdb.horaUTC) {
        tsdb.madrugada = calcularFechaPlaca(tsdb.horaUTC).esMadrugada;
      }
      partidosCombinados.push(tsdb);
    }
  });
  await enriquecerConZafronix(env, partidosCombinados);
  if (env.ZAFRONIX_KEY) resultados.fuentes.push("zafronix-events");
  await enriquecerEventosAPIFootball(env, partidosCombinados);
  await enriquecerConEstadios(env, partidosCombinados);
  if (env.ZAFRONIX_KEY) resultados.fuentes.push("zafronix");
  await enriquecerConKnowledgeGraph(env, partidosCombinados);
  if (env.KG_KEY) resultados.fuentes.push("knowledge-graph");
  partidosCombinados.forEach((p) => {
    delete p._homeRaw;
    delete p._awayRaw;
  });
  resultados.enriquecido = true;
  const matched = partidosCombinados.filter((p) => p.ciudad || p.arbitro || p.eventos && p.eventos.length > 0).length;
  const conEventos = partidosCombinados.filter((p) => p.eventos && p.eventos.length > 0).length;
  const conFormacion = partidosCombinados.filter((p) => p.formacionLocal || p.formacionVisitante).length;
  resultados.debug = {
    fd_count: fdPartidos.length,
    af_count: afPartidos.length,
    tsdb_count: tsdbPartidos.length,
    matched_count: matched,
    total_combined: partidosCombinados.length,
    con_eventos: conEventos,
    con_formacion: conFormacion,
    // Detalle por partido para diagnóstico
    partidos_detalle: partidosCombinados.map((p) => ({
      local: p.local,
      visitante: p.visitante,
      estado: p.estado,
      afFixtureId: p.afFixtureId || null,
      estadio: p.estadio || "(vac\xEDo)",
      ciudad: p.ciudad || null,
      arbitro: p.arbitro || null,
      golesLocal: p.golesLocal,
      golesVisitante: p.golesVisitante,
      goleadores: p.goleadores || [],
      eventos_count: (p.eventos || []).length,
      formacionLocal: p.formacionLocal ? true : false,
      formacionVisitante: p.formacionVisitante ? true : false
    }))
  };
  return { ...resultados, partidos: partidosCombinados };
}
__name(obtenerPartidosCombinados, "obtenerPartidosCombinados");
function normalizeTeamName(name) {
  if (!name) return "";
  const map = {
    "czech republic": "czechia",
    "czechia": "czechia",
    "cze": "czechia",
    "south korea": "south korea",
    "korea republic": "south korea",
    "korea": "south korea",
    "south korea": "south korea",
    "kor": "south korea",
    "united states": "united states",
    "usa": "united states",
    "united states of america": "united states",
    "us": "united states",
    "ivory coast": "ivory coast",
    "c\xF4te d'ivoire": "ivory coast",
    "cote divoire": "ivory coast",
    "democratic republic of congo": "dr congo",
    "dr congo": "dr congo",
    "congo dr": "dr congo",
    "republic of congo": "congo",
    "congo": "congo",
    "new zealand": "new zealand",
    "nz": "new zealand",
    "costa rica": "costa rica",
    "crc": "costa rica",
    "saudi arabia": "saudi arabia",
    "ksa": "saudi arabia",
    "south africa": "south africa",
    "rsa": "south africa",
    "north korea": "north korea",
    "dpr korea": "north korea",
    "prk": "north korea",
    "bosnia and herzegovina": "bosnia",
    "bosnia": "bosnia",
    "bih": "bosnia",
    "trinidad and tobago": "trinidad",
    "trinidad": "trinidad",
    "tri": "trinidad",
    "united arab emirates": "uae",
    "uae": "uae",
    "equatorial guinea": "equatorial guinea",
    "eqg": "equatorial guinea",
    "cape verde": "cape verde",
    "cpv": "cape verde",
    "sierra leone": "sierra leone",
    "sle": "sierra leone",
    "burkina faso": "burkina faso",
    "bfa": "burkina faso"
  };
  const lower = name.toLowerCase().trim();
  return map[lower] || lower;
}
__name(normalizeTeamName, "normalizeTeamName");
function matchPartidos(a, b) {
  const aLocal = normalizeTeamName(a.local || a._localRaw);
  const bLocal = normalizeTeamName(b.local || b._localRaw);
  const aVis = normalizeTeamName(a.visitante || a._visitanteRaw);
  const bVis = normalizeTeamName(b.visitante || b._visitanteRaw);
  if (aLocal && bLocal && aVis && bVis) {
    if (aLocal === bLocal && aVis === bVis) return true;
    if (aLocal === bVis && aVis === bLocal) return true;
  }
  if (a.local === b.local && a.visitante === b.visitante) return true;
  if (a.local === b.visitante && a.visitante === b.local) return true;
  try {
    const tA = new Date(a.horaUTC).getTime();
    const tB = new Date(b.horaUTC).getTime();
    if (Math.abs(tA - tB) < 90 * 60 * 1e3) {
      if (aLocal && bLocal && (aLocal === bLocal || aVis === bVis)) return true;
    }
  } catch (e) {
  }
  return false;
}
__name(matchPartidos, "matchPartidos");
async function handleMundialManana(env) {
  try {
    const resultado = await obtenerPartidosMundial(env, 2e3);
    if (resultado.error) {
      return new Response(JSON.stringify({ ok: false, error: resultado.error }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }
    if (!resultado.partidos || resultado.partidos.length === 0) {
      return new Response(JSON.stringify({
        ok: true,
        tipo: "ma\xF1ana",
        fecha: resultado.fecha,
        partidos: [],
        mensaje: "No hay partidos hoy",
        titular: "Sin partidos programados",
        bajada: "Vuelva a consultar m\xE1s tarde"
      }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }
    let detallePartidos = "";
    resultado.partidos.forEach((p, i) => {
      detallePartidos += `${i + 1}. ${p.banderaLocal} ${p.local} vs ${p.visitante} ${p.banderaVisitante} a las ${p.hora} hs (${p.estadio})
`;
    });
    const prompt = `Sos redactor de Media Mendoza.
Gener\xE1 un titular y bajada para una PLACA MATUTINA del Mundial de F\xFAtbol 2026.

PARTIDOS DE HOY:
${detallePartidos}

INSTRUCCIONES:
- Titular: m\xE1x 10 palabras, llamativo
- Bajada: m\xE1x 15 palabras, tono urgente
- Emojis: m\xE1x 2

Respond\xE9 SOLO con JSON sin backticks:
{"titular":"...","bajada":"..."}`;
    const geminiResult = await callGemini(prompt, env);
    const respuesta = {
      ok: true,
      tipo: "ma\xF1ana",
      fecha: resultado.fecha,
      partidos: resultado.partidos,
      titular: geminiResult.error ? `Hoy ${resultado.partidos.length} partido${resultado.partidos.length > 1 ? "s" : ""}` : geminiResult.data?.titular || "Partidos del Mundial",
      bajada: geminiResult.error ? `No te pierdas la acci\xF3n a partir de las ${resultado.partidos[0].hora}` : geminiResult.data?.bajada || "Segu\xED toda la acci\xF3n"
    };
    return new Response(JSON.stringify(respuesta), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
}
__name(handleMundialManana, "handleMundialManana");
async function handleMundialNoche(env) {
  try {
    const resultado = await obtenerPartidosMundial(env, 2e3);
    if (resultado.error) {
      return new Response(JSON.stringify({ ok: false, error: resultado.error }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }
    const resultados = (resultado.partidos || []).filter(
      (p) => p.estado === "FINISHED" && p.golesLocal !== null && p.golesVisitante !== null
    );
    if (resultados.length === 0) {
      return new Response(JSON.stringify({
        ok: true,
        tipo: "noche",
        fecha: resultado.fecha,
        resultados: [],
        mensaje: "No hay resultados a\xFAn",
        titular: "Esperando resultados...",
        bajada: "Los partidos a\xFAn no han terminado"
      }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }
    let detalleResultados = "";
    resultados.forEach((r, i) => {
      const resumen = `${r.banderaLocal} ${r.local} ${r.golesLocal} - ${r.golesVisitante} ${r.visitante} ${r.banderaVisitante}`;
      const goles = r.goleadores.length > 0 ? ` (${r.goleadores.join(", ")})` : "";
      detalleResultados += `${i + 1}. ${resumen}${goles}
`;
    });
    const prompt = `Sos redactor de Media Mendoza.
Gener\xE1 un titular y bajada para una PLACA NOCTURNA de resultados del Mundial 2026.

RESULTADOS DE HOY:
${detalleResultados}

INSTRUCCIONES:
- Titular: m\xE1x 10 palabras
- Bajada: m\xE1x 15 palabras
- Emojis: m\xE1x 2

Respond\xE9 SOLO con JSON sin backticks:
{"titular":"...","bajada":"..."}`;
    const geminiResult = await callGemini(prompt, env);
    const respuesta = {
      ok: true,
      tipo: "noche",
      fecha: resultado.fecha,
      resultados,
      titular: geminiResult.error ? `${resultados.length} resultado${resultados.length > 1 ? "s" : ""}` : geminiResult.data?.titular || "Resultados del Mundial",
      bajada: geminiResult.error ? "Conoc\xE9 todos los goles y lo mejor de la jornada" : geminiResult.data?.bajada || "Segu\xED toda la acci\xF3n"
    };
    return new Response(JSON.stringify(respuesta), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
}
__name(handleMundialNoche, "handleMundialNoche");
async function handleGetReelConfig(env) {
  try {
    const prompt = await env.KV.get(REEL_PROMPT_KEY, "text");
    const voces = await env.KV.get(REEL_VOCES_KEY, "json");
    return jsonOk({
      prompt: prompt || REEL_PROMPT_DEFAULT,
      voces: voces || VOCES_DEFAULT
    });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetReelConfig, "handleGetReelConfig");
async function handlePostReelConfig(body, env) {
  try {
    if (body.prompt !== void 0) {
      await env.KV.put(REEL_PROMPT_KEY, String(body.prompt || "").trim() || REEL_PROMPT_DEFAULT);
    }
    if (body.voces !== void 0) {
      if (!Array.isArray(body.voces)) return jsonError("voces debe ser array", 400);
      await env.KV.put(REEL_VOCES_KEY, JSON.stringify(body.voces));
    }
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostReelConfig, "handlePostReelConfig");
async function handleResetVoces(env) {
  try {
    await env.KV.delete(REEL_VOCES_KEY);
    return jsonOk({ reseteado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleResetVoces, "handleResetVoces");
async function handleReelGuion(body, env) {
  const articulo = String(body.articulo || "").trim();
  if (!articulo) return jsonError("Falta campo: articulo", 400);
  const promptBase = await env.KV.get(REEL_PROMPT_KEY, "text").catch(() => null) || REEL_PROMPT_DEFAULT;
  const r = await callGemini(promptBase + `

ART\xCDCULO:
${articulo.substring(0, 3e3)}`, env);
  if (r.error) return jsonError(r.error, 500);
  return jsonOk({ titulo: r.data?.titulo || "", guion: r.data?.guion || "" });
}
__name(handleReelGuion, "handleReelGuion");
async function handleReelAudio(body, env) {
  const titulo = String(body.titulo || "").trim();
  const guion = String(body.guion || "").trim();
  const voiceId = String(body.voiceId || "es-AR-TomasNeural").trim();
  if (!guion) return jsonError("Falta campo: guion", 400);
  const textoCompleto = titulo ? `${titulo}. ${guion}` : guion;
  const vocesKV = await env.KV.get(REEL_VOCES_KEY, "json").catch(() => null) || VOCES_DEFAULT;
  const vozData = vocesKV.find((v) => v.id === voiceId) || vocesKV[0] || VOCES_DEFAULT[0];
  const intentos = [vozData, ...vocesKV.filter((v) => v.id !== vozData.id)];
  const errores = [];
  for (const voz of intentos) {
    const keyName = voz.keyAlias || "AZURE_TTS_KEY_1";
    const regionName = voz.region || "AZURE_TTS_REGION_1";
    const azureKey = String(env[keyName] || "").trim();
    const azureRegion = String(env[regionName] || "").trim();
    if (!azureKey || !azureRegion) {
      errores.push(`${voz.nombre || voz.id}: secrets "${keyName}"/"${regionName}" no configurados`);
      continue;
    }
    const locale = localeFromVoice(voz.id);
    const ssml = titulo ? `<speak version="1.0" xml:lang="${locale}">
           <voice name="${escapeXml(voz.id)}">
             <prosody rate="medium">
               ${escapeXml(titulo)}
               <break time="600ms"/>
               ${escapeXml(guion)}
             </prosody>
           </voice>
         </speak>` : `<speak version="1.0" xml:lang="${locale}">
           <voice name="${escapeXml(voz.id)}">${escapeXml(guion)}</voice>
         </speak>`;
    try {
      const res = await fetch(
        `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": azureKey,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
            "User-Agent": "mm-worker"
          },
          body: ssml
        }
      );
      if (res.status === 429) {
        errores.push(`${voz.nombre || voz.id}: cuota agotada`);
        continue;
      }
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        errores.push(`${voz.nombre || voz.id}: HTTP ${res.status} \u2192 ${errBody.substring(0, 200)}`);
        continue;
      }
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 100) {
        errores.push(`${voz.nombre || voz.id}: audio vac\xEDo`);
        continue;
      }
      return new Response(buf, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "audio/mpeg",
          "Content-Length": String(buf.byteLength),
          "Cache-Control": "no-store"
        }
      });
    } catch (e) {
      errores.push(`${voz.nombre || voz.id}: ${e.message}`);
    }
  }
  return jsonError(`Azure TTS fall\xF3: ${errores.join(" | ")}`, 502);
}
__name(handleReelAudio, "handleReelAudio");
async function handleGetSocialPrompt(url, env) {
  const net = url.searchParams.get("net");
  if (!net) return jsonError("Falta par\xE1metro net", 400);
  try {
    const v = await env.KV.get("social:prompt:" + net, "text");
    return jsonOk({ prompt: v || null });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetSocialPrompt, "handleGetSocialPrompt");
async function handlePostSocialPrompt(body, env) {
  const net = String(body.net || "").trim();
  const prompt = String(body.prompt || "").trim();
  if (!net || !prompt) return jsonError("Faltan campos", 400);
  try {
    await env.KV.put("social:prompt:" + net, prompt);
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostSocialPrompt, "handlePostSocialPrompt");
async function handleSocialGenerar(body, env) {
  const systemPrompt = String(body.systemPrompt || "").trim();
  const userMsg = String(body.userMsg || "").trim();
  if (!systemPrompt || !userMsg) return jsonError("Faltan campos", 400);
  const r = await callGemini(`${systemPrompt}

Responde SOLO con JSON sin backticks ni markdown.

${userMsg}`, env);
  if (r.error) return jsonError(r.error, 500);
  return jsonOk({ result: r.data });
}
__name(handleSocialGenerar, "handleSocialGenerar");
async function handleGetWaPrompt(env) {
  try {
    const v = await env.KV.get(WA_PROMPT_KV_KEY, "text");
    return jsonOk({ prompt: v || null });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetWaPrompt, "handleGetWaPrompt");
async function handlePostWaPrompt(body, env) {
  const prompt = String(body.prompt || "").trim();
  if (!prompt) return jsonError("Falta prompt", 400);
  try {
    await env.KV.put(WA_PROMPT_KV_KEY, prompt);
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostWaPrompt, "handlePostWaPrompt");
async function handleGetWaLinks(env) {
  try {
    const v = await env.KV.get(WA_LINKS_KV_KEY, "json");
    return jsonOk({ links: v || { grupo: "", canal: "" } });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetWaLinks, "handleGetWaLinks");
async function handlePostWaLinks(body, env) {
  const links = { grupo: String(body.links?.grupo || "").trim(), canal: String(body.links?.canal || "").trim() };
  try {
    await env.KV.put(WA_LINKS_KV_KEY, JSON.stringify(links));
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostWaLinks, "handlePostWaLinks");
var ESTILOS_DESC = {
  formal: `FORMATO \u2014 Period\xEDstico formal:
- Titular: sujeto+verbo+dato, m\xE1x 10 palabras.
- P1: qu\xE9/qui\xE9n/cu\xE1ndo/d\xF3nde/c\xF3mo.
- P2-4: orden de importancia.
- Cierre: dato proyectivo.`,
  directo: `FORMATO \u2014 Directo:
- Titular: m\xE1x 7 palabras.
- 3 p\xE1rrafos de 2 oraciones.`,
  ampliado: `FORMATO \u2014 Profundidad:
- P1 hecho, P2 antecedentes, P3 datos, P4 perspectivas, P5 cierre.`,
  breaking: `FORMATO \u2014 Urgente:
- Titular en presente, m\xE1x 8 palabras.
- P1 hecho, P2 lo que se sabe, P3 lo que falta.`,
  cronica: `FORMATO \u2014 Cr\xF3nica:
- Titular evocador, apertura escena, protagonista, hecho, contexto, cierre.`,
  deportes: `FORMATO \u2014 Deportes:
- Titular activo. Resultado, momentos clave, datos, pr\xF3ximo paso.`,
  espectaculos: `FORMATO \u2014 Espect\xE1culos:
- Titular llamativo. Hecho, contexto, dato curioso, qu\xE9 sigue.`,
  redes: `FORMATO \u2014 Redes:
- Titular gancho. 3 p\xE1rrafos breves. Cierre que invite a compartir.`,
  institucional: `FORMATO \u2014 Comunicado:
- Titular formal. Hecho\u2192justificaci\xF3n\u2192declaraci\xF3n\u2192datos. 4 p\xE1rrafos.`
};
function comprimirEditorial(texto) {
  if (!texto) return null;
  const lineas = texto.split("\n").map((l) => l.trim()).filter((l) => l.length > 5).filter((l) => !l.match(/^(Actuá como|Media Mendoza es|El enfoque|📰|🧭|✍️|🧱|📍|🚨)/)).filter((l) => l.startsWith("-") || l.startsWith("\u2022") || l.match(/^(No |Usar |Incluir |Evitar |Redactar )/i)).slice(0, 20);
  if (!lineas.length) return texto.split("\n").map((l) => l.trim()).filter((l) => l.length > 10).slice(0, 15).join("\n");
  return lineas.join("\n");
}
__name(comprimirEditorial, "comprimirEditorial");
async function handleTitulares(body, env) {
  const { modo, contenido, contexto = "", tono = "informativo", cantidad = 5 } = body;
  if (!modo || !contenido) return jsonError("Faltan campos", 400);
  const ed = comprimirEditorial(await getEditorial(env));
  const instr = modo === "nota" ? `Gener\xE1 exactamente ${cantidad} titulares de este texto:
"""
${contenido}
"""` : `Gener\xE1 exactamente ${cantidad} titulares sobre:
"""
${contenido}
"""`;
  const prompt = `Sos editor de Media Mendoza.
${instr}
${contexto ? `
CONTEXTO:
${contexto}
` : ""}
Tono: ${tono}.
${ed ? `REGLAS:
${ed}
` : ""}
Respond\xE9 SOLO con JSON sin backticks:
{"titulares":["T1"],"angulos":[{"nombre":"N","descripcion":"D"}]}`;
  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  return jsonOk(r.data);
}
__name(handleTitulares, "handleTitulares");
async function handleReformular(body, env) {
  const { titulo, contenido, contexto = "", estilo = "formal" } = body;
  if (!titulo || !contenido) return jsonError("Faltan campos", 400);
  const ed = comprimirEditorial(await getEditorial(env));
  const prompt = `Sos redactor de Media Mendoza.
Reformul\xE1 completamente esta nota.

T\xEDtulo original: "${titulo}"
Cuerpo:
"""
${contenido}
"""
${contexto ? `
INFO EXTRA:
${contexto}
` : ""}
${ESTILOS_DESC[estilo] || ESTILOS_DESC.formal}
${ed ? `
REGLAS:
${ed}
` : ""}
Respond\xE9 SOLO con JSON sin backticks:
{"titular":"","cuerpo":"P1...

P2...","categoria_sugerida":"","hashtags":[]}`;
  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  return jsonOk(r.data);
}
__name(handleReformular, "handleReformular");
async function handleRedactar(body, env) {
  const { ideas, buscarWeb = false } = body;
  if (!ideas) return jsonError("Falta campo: ideas", 400);
  const ed = comprimirEditorial(await getEditorial(env));
  const prompt = `Sos redactor de Media Mendoza.
Redact\xE1 una nota period\xEDstica.

CONTENIDO:
${ideas}

${buscarWeb ? "Busc\xE1 contexto en la web." : "Solo us\xE1 la info provista."}
${ed ? `
REGLAS:
${ed}
` : ""}
Respond\xE9 SOLO con JSON sin backticks:
{"titular":"","bajada":"","cuerpo":"P1...

P2...","categoria_sugerida":"","hashtags":[],"fuentes":[]}`;
  const fn = buscarWeb ? callGeminiConBusqueda : callGemini;
  const r = await fn(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  return jsonOk(r.data);
}
__name(handleRedactar, "handleRedactar");
async function handleGetAgendaEfemerides(env) {
  try {
    const e = await listarObjetosKV(env, AGENDA_EF_PREFIX);
    e.sort((a, b) => a.mes - b.mes || a.dia - b.dia);
    return jsonOk({ efemerides: e });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetAgendaEfemerides, "handleGetAgendaEfemerides");
async function handlePostAgendaEfemeride(body, env) {
  const titulo = String(body.titulo || "").trim();
  const dia = parseInt(body.dia) || 0;
  const mes = parseInt(body.mes) || 0;
  if (!titulo || !dia || !mes || dia < 1 || dia > 31 || mes < 1 || mes > 12) return jsonError("Faltan campos v\xE1lidos", 400);
  const ef = { id: body.id || generarId("ef_"), titulo, tituloBase: body.tituloBase || titulo, dia, mes, tipo: String(body.tipo || "efemeride").trim(), alcance: String(body.alcance || "local").trim(), descripcion: String(body.descripcion || "").trim(), creado: body.creado || Date.now() };
  try {
    await env.KV.put(`${AGENDA_EF_PREFIX}${ef.id}`, JSON.stringify(ef));
    return jsonOk({ guardado: true, id: ef.id, efemeride: ef });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostAgendaEfemeride, "handlePostAgendaEfemeride");
async function handleDeleteAgendaEfemeride(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("Falta id", 400);
  try {
    await env.KV.delete(`${AGENDA_EF_PREFIX}${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleDeleteAgendaEfemeride, "handleDeleteAgendaEfemeride");
async function handleGetAngulosCache(url, env) {
  const key = String(url.searchParams.get("key") || "").trim();
  if (!key) return jsonError("Falta key", 400);
  try {
    const v = await env.KV.get(ANGULOS_PREFIX + key, "json");
    return jsonOk({ data: v || null });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetAngulosCache, "handleGetAngulosCache");
async function handleAgendaAngulos(body, env) {
  const titulo = String(body.titulo || "").trim();
  if (!titulo) return jsonError("Falta titulo", 400);
  const kvKey = String(body.kvKey || "").trim();
  if (kvKey) {
    try {
      const c = await env.KV.get(ANGULOS_PREFIX + kvKey, "json");
      if (c) return jsonOk({ ...c, fromCache: true });
    } catch (e) {
    }
  }
  const prompt = `Sos editor de agenda de Media Mendoza.
EVENTO:
Titulo: ${titulo}
Descripcion: ${String(body.descripcion || "").trim()}
Fecha: ${String(body.fecha || "").trim()}
Tipo: ${String(body.tipo || "").trim()}

Responde SOLO con JSON sin backticks:
{"angulos":["a1"],"preguntas":["p1"],"fuentes_sugeridas":["f1"],"consejo":""}`;
  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  const data = { angulos: Array.isArray(r.data?.angulos) ? r.data.angulos : [], preguntas: Array.isArray(r.data?.preguntas) ? r.data.preguntas : [], fuentes_sugeridas: Array.isArray(r.data?.fuentes_sugeridas) ? r.data.fuentes_sugeridas : [], consejo: String(r.data?.consejo || "").trim() };
  if (kvKey) {
    try {
      await env.KV.put(ANGULOS_PREFIX + kvKey, JSON.stringify(data), { expirationTtl: ANGULOS_TTL });
    } catch (e) {
    }
  }
  return jsonOk(data);
}
__name(handleAgendaAngulos, "handleAgendaAngulos");
async function handleGetAgendaEventos(url, env) {
  try {
    const mes = String(url.searchParams.get("mes") || "").trim();
    let ev = await listarObjetosKV(env, AGENDA_EV_PREFIX);
    if (mes) ev = ev.filter((e) => String(e.fecha || "").startsWith(mes));
    ev.sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")) || String(a.hora || "").localeCompare(String(b.hora || "")));
    return jsonOk({ eventos: ev });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetAgendaEventos, "handleGetAgendaEventos");
async function handlePostAgendaEvento(body, env) {
  const titulo = String(body.titulo || "").trim();
  const fecha = String(body.fecha || "").trim();
  if (!titulo || !fecha) return jsonError("Faltan campos", 400);
  const ev = { id: body.id || generarId("ag_"), titulo, fecha, hora: String(body.hora || "").trim(), tipo: String(body.tipo || "evento").trim(), alcance: String(body.alcance || "local").trim(), descripcion: String(body.descripcion || "").trim(), periodista: String(body.periodista || "").trim(), creado: body.creado || Date.now() };
  try {
    await env.KV.put(`${AGENDA_EV_PREFIX}${ev.id}`, JSON.stringify(ev));
    return jsonOk({ guardado: true, id: ev.id, evento: ev });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostAgendaEvento, "handlePostAgendaEvento");
async function handleDeleteAgendaEvento(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("Falta id", 400);
  try {
    await env.KV.delete(`${AGENDA_EV_PREFIX}${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleDeleteAgendaEvento, "handleDeleteAgendaEvento");
async function handleScrape(url) {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) return jsonError("url requerida", 400);
  try {
    new URL(targetUrl);
  } catch {
    return jsonError("URL inv\xE1lida", 400);
  }
  try {
    const { html } = await fetchHtml(targetUrl, 300);
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i);
    const titleTag = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    const titulo = (ogTitle?.[1] || titleTag?.[1] || "").replace(/\s+/g, " ").trim();
    const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i) || html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:image["']/i);
    const texto = extraerTexto(html);
    if (!texto || texto.length < 100) return jsonError("No se pudo extraer contenido", 422);
    return jsonOk({ titulo, texto, imagen: ogImg?.[1] || "", url: targetUrl });
  } catch (err) {
    return jsonError(`Error scrapeando: ${err.message}`, 502);
  }
}
__name(handleScrape, "handleScrape");
async function handlePlacasUrl(url) {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) return jsonError("url requerida", 400);
  try {
    new URL(targetUrl);
  } catch {
    return jsonError("URL inv\xE1lida", 400);
  }
  try {
    const { html } = await fetchHtml(targetUrl, 300);
    const data = extraerDatosNota(html, targetUrl);
    if (!data.title && !data.body) return jsonError("No se pudo extraer contenido", 422);
    return jsonOk(data);
  } catch (err) {
    return jsonError(`Error: ${err.message}`, 502);
  }
}
__name(handlePlacasUrl, "handlePlacasUrl");
async function handlePlacasImage(url) {
  const imageUrl = url.searchParams.get("image");
  if (!imageUrl) return jsonError("image requerida", 400);
  try {
    new URL(imageUrl);
  } catch {
    return jsonError("URL inv\xE1lida", 400);
  }
  try {
    const res = await fetch(imageUrl, { headers: { "User-Agent": BROWSER_HEADERS["User-Agent"], "Accept": "image/*" }, redirect: "follow", cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!res.ok) return jsonError(`Error ${res.status}`, 502);
    const ct = res.headers.get("Content-Type") || "application/octet-stream";
    if (!ct.startsWith("image/")) return jsonError("No es imagen", 422);
    const cl = Number(res.headers.get("Content-Length") || "0");
    if (cl && cl > MAX_PROXY_IMAGE_BYTES) return jsonError("Imagen muy pesada", 413);
    return new Response(res.body, { headers: { ...CORS_HEADERS, "Content-Type": ct, "Cache-Control": "public, max-age=3600" } });
  } catch (err) {
    return jsonError(`Error: ${err.message}`, 502);
  }
}
__name(handlePlacasImage, "handlePlacasImage");
async function handlePlacasAI(request, env, body) {
  const system = String(body.system || "").trim();
  const user = String(body.user || "").trim();
  if (!system || !user) return jsonError("Faltan campos", 400);
  const r = await callGemini(`${system}

Responde SOLO con JSON sin backticks:
{"grupo":"...","canal":"..."}

${user}`, env);
  if (r.error) return jsonError(r.error, 500);
  const grupo = limpiarEspacios(r.data?.grupo || "");
  const canal = limpiarEspacios(r.data?.canal || "");
  if (!grupo && !canal) return jsonError("IA no devolvi\xF3 mensajes", 502);
  return jsonOk({ text: JSON.stringify({ grupo, canal }) });
}
__name(handlePlacasAI, "handlePlacasAI");
async function handleGetEditorial(env) {
  try {
    const v = await env.KV.get(EDITORIAL_KV_KEY, "json");
    return jsonOk({ editorial: v || { prompt: "", activo: false } });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetEditorial, "handleGetEditorial");
async function handlePostEditorial(body, env) {
  if (typeof body.prompt === "undefined") return jsonError("Falta prompt", 400);
  try {
    await env.KV.put(EDITORIAL_KV_KEY, JSON.stringify({ prompt: body.prompt.trim(), activo: !!body.activo }));
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostEditorial, "handlePostEditorial");
async function handleGetFuentes(env) {
  try {
    const list = await env.KV.list({ prefix: "fuente:" });
    const fuentes = [];
    for (const k of list.keys) {
      const v = await env.KV.get(k.name, "json");
      if (v) fuentes.push(v);
    }
    fuentes.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
    return jsonOk({ fuentes });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetFuentes, "handleGetFuentes");
async function handlePostFuente(body, env) {
  const { id, nombre, url, clase } = body;
  if (!id || !nombre || !url) return jsonError("Faltan campos", 400);
  try {
    await env.KV.put(`fuente:${id}`, JSON.stringify({ id, nombre, url, clase: clase || "custom" }));
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostFuente, "handlePostFuente");
async function handleDeleteFuente(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("id requerido", 400);
  try {
    await env.KV.delete(`fuente:${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleDeleteFuente, "handleDeleteFuente");
async function handleGetNotas(env) {
  try {
    const list = await env.KV.list({ prefix: "nota:" });
    const notas = [];
    for (const k of list.keys) {
      const v = await env.KV.get(k.name, "json");
      if (v) notas.push(v);
    }
    notas.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
    return jsonOk({ notas });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetNotas, "handleGetNotas");
async function handlePostNota(body, env) {
  const { id, titular, cuerpo, categoria, hashtags, imagen, fecha } = body;
  if (!id || !titular) return jsonError("Faltan campos", 400);
  try {
    await env.KV.put(`nota:${id}`, JSON.stringify({ id, titular, cuerpo, categoria, hashtags, imagen: imagen || "", fecha: fecha || Date.now() }));
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostNota, "handlePostNota");
async function handleDeleteNota(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("id requerido", 400);
  try {
    await env.KV.delete(`nota:${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleDeleteNota, "handleDeleteNota");
async function handleGetCubiertas(env) {
  try {
    const list = await env.KV.list({ prefix: "cubierta:" });
    return jsonOk({ links: list.keys.map((k) => k.name.replace("cubierta:", "")) });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetCubiertas, "handleGetCubiertas");
async function handlePostCubierta(body, env) {
  const { link, cubierta } = body;
  if (!link) return jsonError("Falta link", 400);
  try {
    const key = "cubierta:" + link.substring(0, 400);
    if (cubierta) await env.KV.put(key, "1", { expirationTtl: 60 * 60 * 24 * 30 });
    else await env.KV.delete(key);
    return jsonOk({ guardado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostCubierta, "handlePostCubierta");
var WA_PROMPT_DEFECTO = `Sos editor de redes sociales de Media Mendoza, diario digital del sur de Mendoza, Argentina.
Transform\xE1 esta noticia en dos mensajes de WhatsApp. Espa\xF1ol rioplatense. Emojis estrat\xE9gicos.

FORMATO "grupo": [emoji] *[LOCALIDAD/CATEGOR\xCDA]:* [titular]
[2-3 l\xEDneas clave con *negritas*] \u{1F447}
\u{1F517} *DETALLES:* \u{1F449} {URL}
\u{1F4F1} {LINK_GRUPO} \u{1F4E3} {LINK_CANAL}
*\u{1F4F0} Media Mendoza*

FORMATO "canal": [emoji] *[CATEGOR\xCDA]:* [titular]
\u2022 [punto 1]
\u2022 [punto 2]
\u2022 [punto 3]
\u{1F517} \u{1F449} {URL}
*\u{1F4F0} Media Mendoza*

REGLAS: negritas solo en datos clave, NO **, emojis: policiales=\u{1F6A8} deportes=\u26BD pol\xEDtica=\u{1F3DB}\uFE0F accidente=\u{1F697} salud=\u{1F3E5} general=\u{1F4E2}`;
async function handleWhatsappGenerar(body, env) {
  const notaUrl = String(body.notaUrl || "").trim();
  const contextoExtra = String(body.contextoExtra || "").trim();
  let nota = { titulo: String(body.titulo || "").trim(), categoria: String(body.categoria || "").trim(), descripcion: "", body: String(body.contenido || "").trim(), url: notaUrl, urlCorta: notaUrl ? acortarUrlNota(notaUrl) : "", image: "" };
  if (notaUrl) {
    try {
      new URL(notaUrl);
    } catch {
      return jsonError("URL inv\xE1lida", 400);
    }
    try {
      const { html } = await fetchHtml(notaUrl, 300);
      const s = extraerDatosNota(html, notaUrl);
      nota = { titulo: s.title || nota.titulo, categoria: s.category || nota.categoria, descripcion: s.description || "", body: s.body || nota.body, url: notaUrl, urlCorta: acortarUrlNota(notaUrl), image: s.image || "" };
    } catch (err) {
      return jsonError(`No se pudo obtener la nota: ${err.message}`, 502);
    }
  }
  if (!nota.titulo && !nota.body) return jsonError("Falta notaUrl o contenido", 400);
  let pt = WA_PROMPT_DEFECTO;
  try {
    const p = await env.KV.get(WA_PROMPT_KV_KEY, "text");
    if (p) pt = p;
  } catch (e) {
  }
  let links = { grupo: "https://bit.ly/mediamendoza-grupo", canal: "https://bit.ly/mediamendoza-canal" };
  try {
    const l = await env.KV.get(WA_LINKS_KV_KEY, "json");
    if (l) {
      if (l.grupo) links.grupo = l.grupo;
      if (l.canal) links.canal = l.canal;
    }
  } catch (e) {
  }
  const localidades = ["San Rafael", "General Alvear", "Malarg\xFCe", "Alvear"];
  const localidad = localidades.find((l) => (nota.titulo + nota.body).includes(l)) || "San Rafael";
  const urlFinal = nota.urlCorta || nota.url || "";
  const pf = pt.replace(/\{URL\}/g, urlFinal).replace(/\{LINK_GRUPO\}/g, links.grupo).replace(/\{LINK_CANAL\}/g, links.canal).replace(/\{TITULO\}/g, nota.titulo || "Sin titulo").replace(/\{CATEGORIA\}/g, nota.categoria || "General").replace(/\{LOCALIDAD\}/g, localidad).replace(/\{CONTENIDO\}/g, (nota.body || "").substring(0, 1500));
  const nd = pt.includes("{CONTENIDO}") ? "" : `

NOTICIA:
T\xEDtulo: ${nota.titulo}
Categor\xEDa: ${nota.categoria || "General"}
Localidad: ${localidad}
Contenido: ${(nota.body || "").substring(0, 1500)}
URL: ${urlFinal}`;
  const prompt = `${pf}${nd}${contextoExtra ? `
Contexto extra: ${contextoExtra}` : ""}

Respond\xE9 SOLO con JSON sin backticks: {"grupo":"...","canal":"..."}`;
  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  const grupo = (r.data?.grupo || "").trim();
  const canal = (r.data?.canal || "").trim();
  if (!grupo || !canal) return jsonError("IA no devolvi\xF3 ambos mensajes", 502);
  return jsonOk({ nota: { titulo: nota.titulo || "Sin titulo", url: nota.url || "", urlCorta: urlFinal, imagen: nota.image || "" }, categoria: nota.categoria || "General", grupo, canal });
}
__name(handleWhatsappGenerar, "handleWhatsappGenerar");
async function handlePostWhatsappProgramar(body, env) {
  if (!body?.fecha) return jsonError("Falta fecha", 400);
  const item = { id: body.id || generarId("wp_"), fecha: Number(body.fecha), fechaLegible: body.fechaLegible || "", tituloNota: String(body.tituloNota || "").trim(), urlCorta: String(body.urlCorta || "").trim(), canales: Array.isArray(body.canales) ? body.canales.filter(Boolean) : [], textoGrupo: String(body.textoGrupo || "").trim(), textoCanal: String(body.textoCanal || "").trim(), categoria: String(body.categoria || "General").trim(), enviado: !!body.enviado, creado: body.creado || Date.now() };
  if (!item.canales.length) return jsonError("Falta canal", 400);
  try {
    await env.KV.put(`${WHATSAPP_PREFIX}${item.id}`, JSON.stringify(item));
    return jsonOk({ guardado: true, id: item.id });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostWhatsappProgramar, "handlePostWhatsappProgramar");
async function handleGetWhatsappProgramados(env) {
  try {
    const p = await listarObjetosKV(env, WHATSAPP_PREFIX);
    p.sort((a, b) => (a.fecha || 0) - (b.fecha || 0));
    return jsonOk({ programados: p });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleGetWhatsappProgramados, "handleGetWhatsappProgramados");
async function handlePostWhatsappMarcarEnviado(body, env) {
  const id = String(body.id || "").trim();
  if (!id) return jsonError("Falta id", 400);
  try {
    const key = `${WHATSAPP_PREFIX}${id}`;
    const actual = await env.KV.get(key, "json");
    if (!actual) return jsonError("Mensaje no encontrado", 404);
    await env.KV.put(key, JSON.stringify({ ...actual, estado: "enviado", enviado: true }));
    return jsonOk({ guardado: true, id });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handlePostWhatsappMarcarEnviado, "handlePostWhatsappMarcarEnviado");
async function handleDeleteWhatsappProgramado(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return jsonError("id requerido", 400);
  try {
    await env.KV.delete(`${WHATSAPP_PREFIX}${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error KV: " + err.message, 500);
  }
}
__name(handleDeleteWhatsappProgramado, "handleDeleteWhatsappProgramado");
async function handleRSS(url) {
  const feedUrl = url.searchParams.get("url");
  if (!feedUrl) return jsonError("url requerida", 400);
  try {
    new URL(feedUrl);
  } catch {
    return jsonError("URL inv\xE1lida", 400);
  }
  try {
    const res = await fetch(feedUrl, { headers: { ...BROWSER_HEADERS, "Accept-Encoding": "identity" }, redirect: "follow", cf: { cacheTtl: 180, cacheEverything: true } });
    if (!res.ok) return jsonError(`Feed error ${res.status}`, 502);
    const text = await res.text();
    if (!esXMLvalido(text)) return jsonError("No es feed RSS v\xE1lido", 422);
    return new Response(text, { headers: { ...CORS_HEADERS, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=180" } });
  } catch (err) {
    return jsonError(`Error feed: ${err.message}`, 502);
  }
}
__name(handleRSS, "handleRSS");
async function handleVerificar(url) {
  const feedUrl = url.searchParams.get("url");
  if (!feedUrl) return jsonError("url requerida", 400);
  try {
    new URL(feedUrl);
  } catch {
    return jsonError("URL inv\xE1lida", 400);
  }
  try {
    const res = await fetch(feedUrl, { headers: { ...BROWSER_HEADERS, "Accept-Encoding": "identity" }, redirect: "follow" });
    if (!res.ok) return jsonError(`Feed error ${res.status}`, 502);
    const text = await res.text();
    if (!esXMLvalido(text)) return jsonError("No es feed RSS v\xE1lido", 422);
    const tm = text.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const nombre = tm ? tm[1].replace(/\s+/g, " ").trim().substring(0, 80) : "Feed RSS";
    const itemCount = (text.match(/<item[\s>]/g) || []).length + (text.match(/<entry[\s>]/g) || []).length;
    return jsonOk({ valido: true, nombre, items: itemCount });
  } catch (err) {
    return jsonError(`Error: ${err.message}`, 502);
  }
}
__name(handleVerificar, "handleVerificar");
async function getEditorial(env) {
  try {
    const v = await env.KV.get(EDITORIAL_KV_KEY, "json");
    if (v && v.activo && v.prompt) return v.prompt;
  } catch (e) {
  }
  return null;
}
__name(getEditorial, "getEditorial");
async function callGeminiConBusqueda(prompt, env) {
  const fuentes = await buscarDuckDuckGo(prompt.substring(0, 200));
  let ctx = "";
  const fv = [];
  for (const f of fuentes.slice(0, 3)) {
    try {
      const res = await fetch(f.url, { headers: BROWSER_HEADERS, redirect: "follow", signal: AbortSignal.timeout(5e3) });
      if (!res.ok) continue;
      const html = await res.text();
      const texto = extraerTexto(html).substring(0, 800);
      if (texto.length < 100) continue;
      const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i);
      ctx += "\nFUENTE: " + f.titulo + " (" + f.url + ")\n" + texto + "\n---";
      fv.push({ titulo: f.titulo, url: f.url, imagen: ogImg?.[1] || "" });
    } catch (e) {
      continue;
    }
  }
  const r = await callGemini(prompt + (ctx ? "\n\nCONTENIDO WEB:\n" + ctx : ""), env);
  if (r.error) return r;
  if (fv.length) r.data.fuentes = fv;
  return r;
}
__name(callGeminiConBusqueda, "callGeminiConBusqueda");
async function buscarDuckDuckGo(query) {
  try {
    const res = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query) + "&kl=es-ar", { headers: { "User-Agent": BROWSER_HEADERS["User-Agent"], "Accept": "text/html" }, redirect: "follow" });
    if (!res.ok) return [];
    const html = await res.text();
    const resultados = [];
    const linkRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)</g;
    let match;
    while ((match = linkRegex.exec(html)) !== null && resultados.length < 5) {
      let u = match[1];
      const t = match[2].trim();
      if (u.includes("uddg=")) {
        const d = decodeURIComponent(u.split("uddg=")[1]?.split("&")[0] || "");
        if (d.startsWith("http")) u = d;
      }
      if (u.startsWith("http") && t) resultados.push({ url: u, titulo: t });
    }
    return resultados;
  } catch (e) {
    return [];
  }
}
__name(buscarDuckDuckGo, "buscarDuckDuckGo");
async function callGemini(prompt, env) {
  const keys = [env.GEMINI_KEY_1, env.GEMINI_KEY_2, env.GEMINI_KEY_3, env.GEMINI_KEY_4, env.GEMINI_KEY_5].filter(Boolean);
  if (!keys.length) return { error: "No hay API keys de Gemini configuradas" };
  for (let i = 0; i < keys.length; i++) {
    for (let intento = 1; intento <= 2; intento++) {
      try {
        const res = await fetch(`${GEMINI_URL}?key=${keys[i]}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 2e3 } }) });
        if (res.status === 429) {
          if (intento < 2) {
            await sleep(3e3);
            continue;
          } else break;
        }
        if (res.status === 500 || res.status === 503) {
          if (intento < 2) {
            await sleep(3e3);
            continue;
          } else break;
        }
        if (!res.ok) break;
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) break;
        let parsed;
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          break;
        }
        return { data: parsed };
      } catch (err) {
        if (intento < 2) await sleep(3e3);
      }
    }
  }
  return { error: "Todas las API keys de Gemini est\xE1n agotadas." };
}
__name(callGemini, "callGemini");
async function handleMusicSearch(url, env) {
  const query = url.searchParams.get("q") || "";
  const page = parseInt(url.searchParams.get("page")) || 1;
  const perPage = parseInt(url.searchParams.get("per_page")) || 12;
  const apiKey = env.FREESOUND_API_KEY;
  if (!apiKey) {
    return jsonError("API key de Freesound no configurada", 500);
  }
  const apiUrl = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&page=${page}&page_size=${perPage}&fields=id,name,username,previews,duration&token=${apiKey}`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (!data.results) {
      return jsonError("Error en b\xFAsqueda de Freesound", 500);
    }
    const tracks = data.results.map((track) => {
      const previewUrl = track.previews?.["preview-hq-mp3"] || track.previews?.["preview-lq-mp3"];
      if (!previewUrl) {
        return null;
      }
      return {
        id: track.id,
        title: track.name || "Sin t\xEDtulo",
        duration: track.duration || 30,
        artist: track.username || "Artista Freesound",
        preview_url: previewUrl,
        audio_url: previewUrl,
        attribution: `\u{1F3B5} Sonido: "${track.name || "Sin t\xEDtulo"}" por ${track.username || "Artista Freesound"} (Freesound.org)`
      };
    }).filter((t) => t !== null);
    return jsonOk({ tracks, total: data.count || 0 });
  } catch (err) {
    console.error("Error en handleMusicSearch:", err);
    return jsonError(`Error: ${err.message}`, 500);
  }
}
__name(handleMusicSearch, "handleMusicSearch");
async function handleMusicPreview(url, env) {
  const audioUrl = url.searchParams.get("url");
  if (!audioUrl) {
    return jsonError("Falta par\xE1metro url", 400);
  }
  try {
    const res = await fetch(audioUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*",
        "Referer": "https://freesound.org/",
        "Origin": "https://freesound.org"
      }
    });
    if (!res.ok) {
      return jsonError(`Error en proxy: ${res.status}`, 502);
    }
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    console.error("Error en handleMusicPreview:", err);
    return jsonError(`Error: ${err.message}`, 500);
  }
}
__name(handleMusicPreview, "handleMusicPreview");
async function handleVideoEditorEstado(url, env) {
  const jobId = url.searchParams.get("id");
  if (!jobId) {
    return jsonError("Falta par\xE1metro id", 400);
  }
  try {
    const data = await env.KV.get(`transc:${jobId}`, "json");
    if (!data) {
      return jsonError("Job no encontrado", 404);
    }
    return jsonOk(data);
  } catch (err) {
    return jsonError("Error obteniendo estado: " + err.message, 500);
  }
}
__name(handleVideoEditorEstado, "handleVideoEditorEstado");
async function queue(batch, env) {
  console.log(`\u{1F4E6} Procesando lote de ${batch.messages.length} mensajes`);
  for (const msg of batch.messages) {
    const { jobId, r2Key } = msg.body;
    console.log(`\u{1F3AF} Procesando job: ${jobId}, r2Key: ${r2Key}`);
    try {
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: "procesando",
        progreso: 10,
        mensaje: "Descargando audio..."
      }), { expirationTtl: 3600 });
      const audioObject = await env.R2.get(r2Key);
      if (!audioObject) throw new Error("Audio no encontrado en R2");
      const audioBuffer = await audioObject.arrayBuffer();
      console.log(`\u{1F4CA} [${jobId}] Audio recuperado: ${audioBuffer.byteLength} bytes`);
      if (audioBuffer.byteLength < 1e3) {
        throw new Error(`Audio demasiado peque\xF1o: ${audioBuffer.byteLength} bytes`);
      }
      const audioArray = [...new Uint8Array(audioBuffer)];
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: "procesando",
        progreso: 30,
        mensaje: "Transcribiendo con IA..."
      }), { expirationTtl: 3600 });
      console.log(`\u{1F7E1} [${jobId}] Llamando a Whisper...`);
      const response = await env.AI.run("@cf/openai/whisper", {
        audio: audioArray
      });
      console.log(`\u2705 [${jobId}] Whisper respondi\xF3`);
      let texto = response.text || "";
      let segments = [];
      let words = [];
      if (response.words && Array.isArray(response.words)) {
        words = response.words;
        const groupSize = 6;
        for (let i = 0; i < words.length; i += groupSize) {
          const group = words.slice(i, i + groupSize);
          segments.push({
            start: group[0].start,
            end: group[group.length - 1].end,
            text: group.map((w) => w.word).join(" ")
          });
        }
      } else if (texto) {
        segments = [{ start: 0, end: 30, text: texto }];
      }
      const oraciones = procesarSegmentosAOraciones(segments);
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: "completado",
        progreso: 100,
        texto,
        segments,
        oraciones,
        word_count: words.length || texto.split(/\s+/).length
      }), { expirationTtl: 3600 });
      await env.R2.delete(r2Key);
      console.log(`\u2705 Job ${jobId} completado`);
      msg.ack();
    } catch (err) {
      console.error(`\u274C Error en job ${jobId}:`, err);
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: "error",
        error: err.message
      }), { expirationTtl: 3600 });
      if (msg.attempts < 3) {
        console.log(`\u{1F504} Reintentando job ${jobId}, intento ${msg.attempts + 1}`);
        msg.retry();
      } else {
        console.log(`\u274C Job ${jobId} descartado despu\xE9s de ${msg.attempts} intentos`);
        msg.ack();
      }
    }
  }
}
__name(queue, "queue");
async function handleDiagnostico(env) {
  const hasAI = !!env.AI;
  const hasKV = !!env.KV;
  const hasR2 = !!env.R2;
  const hasQueue = !!env.transcription_queue;
  let aiStatus = "no disponible";
  let whisperTest = null;
  if (hasAI) {
    aiStatus = "binding AI presente";
    try {
      const testAudio = new Uint8Array(16e3 * 2);
      const result = await env.AI.run("@cf/openai/whisper", {
        audio: [...testAudio]
      });
      whisperTest = "funciona correctamente";
    } catch (e) {
      whisperTest = `error: ${e.message}`;
    }
  }
  return jsonOk({
    ai_disponible: hasAI,
    kv_disponible: hasKV,
    r2_disponible: hasR2,
    queue_disponible: hasQueue,
    ai_status: aiStatus,
    whisper_test: whisperTest,
    football_data_key: !!env.FOOTBALL_DATA_API_KEY,
    api_football_key: !!env.API_FOOTBALL_KEY,
    mensaje: hasAI ? "\u2705 AI configurado correctamente" : "\u274C AI NO est\xE1 configurado en este worker"
  });
}
__name(handleDiagnostico, "handleDiagnostico");
async function handleMundialIDs(env) {
  const apiKey = env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: "Sin API key" }), { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
  try {
    const res = await fetch("https://api.football-data.org/v4/competitions", {
      headers: { "X-Auth-Token": apiKey }
    });
    const data = await res.json();
    const mundiales = data.competitions.filter((c) => c.name.toLowerCase().includes("world") || c.name.toLowerCase().includes("fifa")).map((c) => ({
      id: c.id,
      nombre: c.name,
      inicio: c.currentSeason?.startDate,
      fin: c.currentSeason?.endDate
    }));
    return new Response(JSON.stringify({ ok: true, mundiales }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
}
__name(handleMundialIDs, "handleMundialIDs");
var worker_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET") {
      if (path === "/" && url.searchParams.has("url")) return handlePlacasUrl(url);
      if (path === "/" && url.searchParams.has("image")) return handlePlacasImage(url);
      if (path === "/rss") return handleRSS(url);
      if (path === "/verificar") return handleVerificar(url);
      if (path === "/scrape") return handleScrape(url);
      if (path === "/fuentes") return handleGetFuentes(env);
      if (path === "/editorial") return handleGetEditorial(env);
      if (path === "/cubiertas") return handleGetCubiertas(env);
      if (path === "/notas") return handleGetNotas(env);
      if (path === "/whatsapp/programados") return handleGetWhatsappProgramados(env);
      if (path === "/whatsapp/config/prompt") return handleGetWaPrompt(env);
      if (path === "/whatsapp/config/links") return handleGetWaLinks(env);
      if (path === "/social/prompt") return handleGetSocialPrompt(url, env);
      if (path === "/social/reel/config") return handleGetReelConfig(env);
      if (path === "/social/reel/reset-voces") return handleResetVoces(env);
      if (path === "/agenda/eventos") return handleGetAgendaEventos(url, env);
      if (path === "/agenda/efemerides") return handleGetAgendaEfemerides(env);
      if (path === "/agenda/angulos/cache") return handleGetAngulosCache(url, env);
      if (path === "/resumen/obtener") return handleResumenObtener(url, env);
      if (path === "/studio/proyectos") return handleStudioObtenerProyectos(env);
      if (path === "/music/search") return handleMusicSearch(url, env);
      if (path === "/music/preview") return handleMusicPreview(url, env);
      if (path === "/test-ai") return handleTestAI(env);
      if (path === "/mundo/placa-manana") return handleMundialManana(env);
      if (path === "/mundo/placa-noche") return handleMundialNoche(env);
      if (path === "/mundo/partidos") {
        const fecha = url.searchParams.get("fecha");
        const purge = url.searchParams.get("purge");
        const modo = url.searchParams.get("modo") || "combinado";
        if (purge === "1" && env.KV) {
          try {
            await env.KV.delete("mundial:fd:2000");
          } catch (e) {
          }
          try {
            await env.KV.delete("mundial:season:2026");
          } catch (e) {
          }
          try {
            await env.KV.delete("mundial:tsdb:2026");
          } catch (e) {
          }
          const keys = [
            "mundial:zafronix:standings:2026",
            "mundial:zafronix:bracket:2026",
            "mundial:zafronix:stadiums:2026",
            "mundial:zafronix:matches:2026"
          ];
          for (const k of keys) {
            try {
              await env.KV.delete(k);
            } catch (e) {
            }
          }
        }
        if (modo === "combinado") {
          const resultado2 = await obtenerPartidosCombinados(env, fecha || null);
          return new Response(JSON.stringify({
            ok: true,
            fecha: resultado2.fecha,
            partidos: resultado2.partidos || [],
            total: (resultado2.partidos || []).length,
            fuentes: resultado2.fuentes,
            enriquecido: resultado2.enriquecido,
            debug: resultado2.debug || null,
            totalSeason: null
          }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
        }
        let resultado = await obtenerPartidosMundial(env, 2e3, fecha || null);
        let fuente = "football-data";
        if (resultado.error || (resultado.partidos || []).length === 0) {
          const tsdb = await obtenerPartidosTheSportsDB(env, fecha || null);
          if (!tsdb.error) {
            resultado = tsdb;
            fuente = "thesportsdb";
          } else if (resultado.error) {
            const af = await obtenerPartidosAPIFootball(env, fecha || null);
            if (!af.error) {
              resultado = af;
              fuente = "api-football";
            } else {
              return new Response(
                JSON.stringify({ ok: false, error: resultado.error, fallback_errors: { tsdb: tsdb.error, af: af.error } }),
                { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
              );
            }
          }
        }
        const partidos = resultado.partidos || [];
        return new Response(JSON.stringify({
          ok: true,
          fecha: resultado.fecha,
          partidos,
          total: partidos.length,
          fuente,
          totalSeason: resultado.totalSeason || null
        }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
      }
      if (path === "/video-editor/estado") return handleVideoEditorEstado(url, env);
      if (path === "/diagnostico") return handleDiagnostico(env);
      if (path === "/debug/mundial-ids") return handleMundialIDs(env);
      if (path === "/mundo/partidos-combinados") {
        const fecha = url.searchParams.get("fecha");
        const resultado = await obtenerPartidosCombinados(env, fecha || null);
        return new Response(JSON.stringify({
          ok: true,
          ...resultado
        }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
      }
      if (path === "/mundo/detalle-partido") {
        const fixtureId = url.searchParams.get("fixtureId");
        if (!fixtureId) {
          return new Response(
            JSON.stringify({ ok: false, error: "Par\xE1metro fixtureId requerido" }),
            { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
        const resultado = await obtenerDetallePartidoAPIFootball(env, fixtureId);
        if (resultado.error) {
          return new Response(
            JSON.stringify({ ok: false, error: resultado.error }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ ok: true, ...resultado }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      if (path === "/mundo/posiciones") {
        const zafronixData = await obtenerPosicionesZafronix(env);
        if (zafronixData && zafronixData.grupos && Object.keys(zafronixData.grupos).length > 0) {
          return new Response(
            JSON.stringify({ ok: true, ...zafronixData }),
            { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
        const resultado = await obtenerPosicionesGrupos(env);
        if (resultado.error) {
          return new Response(
            JSON.stringify({ ok: false, error: resultado.error }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ ok: true, ...resultado }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      if (path === "/mundo/bracket") {
        const resultado = await obtenerBracketZafronix(env);
        if (!resultado) {
          return new Response(
            JSON.stringify({ ok: false, error: "Bracket no disponible (Zafronix API key requerida)" }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ ok: true, ...resultado }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      if (path === "/mundo/planteles") {
        const resultado = await obtenerPlantelesZafronix(env);
        if (!resultado) {
          return new Response(
            JSON.stringify({ ok: false, error: "Planteles no disponibles (Zafronix API key requerida)" }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ ok: true, ...resultado }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      if (path === "/mundo/estadios") {
        const resultado = await obtenerEstadiosZafronix(env);
        if (!resultado) {
          return new Response(
            JSON.stringify({ ok: false, error: "Estadios no disponibles (Zafronix API key requerida)" }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ ok: true, ...resultado }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      if (path === "/mundo/goleadores") {
        const resultado = await obtenerGoleadores(env);
        if (resultado.error) {
          return new Response(
            JSON.stringify({ ok: false, error: resultado.error }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ ok: true, ...resultado }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      if (path === "/mundo/test-apis") {
        const fecha = url.searchParams.get("fecha");
        const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1e3);
        const hoy = ahoraAR.toISOString().split("T")[0];
        const fechaBase = fecha || hoy;
        const report = { fecha: fechaBase, timestamp: (/* @__PURE__ */ new Date()).toISOString(), apis: {} };
        try {
          const fd = await obtenerPartidosMundial(env, 2e3, fechaBase);
          report.apis["football-data"] = {
            ok: !fd.error,
            count: (fd.partidos || []).length,
            error: fd.error || null,
            partidos: (fd.partidos || []).map((p) => ({
              local: p.local,
              visitante: p.visitante,
              estado: p.estado,
              golesLocal: p.golesLocal,
              golesVisitante: p.golesVisitante,
              goleadores: p.goleadores || []
            }))
          };
        } catch (e) {
          report.apis["football-data"] = { ok: false, error: e.message };
        }
        try {
          const af = await obtenerPartidosAPIFootball(env, fechaBase);
          report.apis["api-football"] = {
            ok: !af.error,
            count: (af.partidos || []).length,
            error: af.error || null,
            totalSeason: af.totalSeason || null,
            _debug: af._debug || null,
            partidos: (af.partidos || []).map((p) => ({
              id: p.id,
              local: p.local,
              visitante: p.visitante,
              estado: p.estado,
              estadio: p.estadio || "(vac\xEDo)",
              arbitro: p.arbitro || null,
              golesLocal: p.golesLocal,
              golesVisitante: p.golesVisitante
            }))
          };
        } catch (e) {
          report.apis["api-football"] = { ok: false, error: e.message };
        }
        try {
          const afUrl = `${API_FOOTBALL_URL}/fixtures?league=1&season=2026`;
          const afRaw = await fetch(afUrl, { headers: { "x-apisports-key": env.API_FOOTBALL_KEY } });
          const afData = await afRaw.json();
          const allCount = afData.response?.length || 0;
          const fixturesForDate = (afData.response || []).filter((f) => {
            try {
              const info = calcularFechaPlaca(f.fixture.date);
              return info.fechaPlaca === fechaBase;
            } catch (e) {
              return false;
            }
          });
          report.apis["api-football-raw"] = {
            status: afRaw.status,
            total_fixtures_season: allCount,
            fixtures_for_date: fixturesForDate.length,
            sample_fixture: fixturesForDate[0] ? {
              id: fixturesForDate[0].fixture.id,
              date: fixturesForDate[0].fixture.date,
              status: fixturesForDate[0].fixture.status.short,
              home: fixturesForDate[0].teams.home.name,
              away: fixturesForDate[0].teams.away.name
            } : null,
            date_filter_used: fechaBase
          };
        } catch (e) {
          report.apis["api-football-raw"] = { ok: false, error: e.message };
        }
        try {
          const tsdb = await obtenerPartidosTheSportsDB(env, fechaBase);
          report.apis["thesportsdb"] = {
            ok: !tsdb.error,
            count: (tsdb.partidos || []).length,
            error: tsdb.error || null,
            partidos: (tsdb.partidos || []).map((p) => ({
              local: p.local,
              visitante: p.visitante,
              estadio: p.estadio || "(vac\xEDo)"
            }))
          };
        } catch (e) {
          report.apis["thesportsdb"] = { ok: false, error: e.message };
        }
        try {
          if (env.ZAFRONIX_KEY) {
            const zRes = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
              headers: { "X-API-Key": env.ZAFRONIX_KEY }
            });
            if (zRes.ok) {
              const zData = await zRes.json();
              const zMatches = zData.data || [];
              const zForDate = zMatches.filter((m) => {
                try {
                  const mDate = new Date(m.date || m.kickOff || m.datetime);
                  const arDate = new Date(mDate.getTime() - 3 * 60 * 60 * 1e3);
                  return arDate.toISOString().split("T")[0] === fechaBase;
                } catch (e) {
                  return false;
                }
              });
              report.apis["zafronix-raw"] = {
                ok: true,
                total_matches: zMatches.length,
                matches_for_date: zForDate.length,
                sample: zForDate[0] || null,
                // Mostrar goals/lineups/cards de TODOS los matches de la fecha
                all_matches_detail: zForDate.map((m) => ({
                  id: m.id,
                  home: m.homeTeam,
                  away: m.awayTeam,
                  status: m.status,
                  homeScore: m.homeScore,
                  awayScore: m.awayScore,
                  goals: m.goals || null,
                  cards: m.cards || null,
                  lineups: m.lineups ? "present" : null,
                  formations: m.formations || null,
                  referee: m.referee || null,
                  liveMinute: m.liveMinute || null
                })),
                all_fields_sample: zMatches[0] ? Object.keys(zMatches[0]) : []
              };
            } else {
              report.apis["zafronix-raw"] = { ok: false, status: zRes.status };
            }
          } else {
            report.apis["zafronix-raw"] = { ok: false, error: "ZAFRONIX_KEY not configured" };
          }
        } catch (e) {
          report.apis["zafronix-raw"] = { ok: false, error: e.message };
        }
        try {
          const comb = await obtenerPartidosCombinados(env, fechaBase);
          report.apis["combinado"] = {
            ok: true,
            count: (comb.partidos || []).length,
            debug: comb.debug || null,
            partidos: (comb.partidos || []).map((p) => ({
              local: p.local,
              visitante: p.visitante,
              estado: p.estado,
              afFixtureId: p.afFixtureId || null,
              estadio: p.estadio || "(vac\xEDo)",
              ciudad: p.ciudad || null,
              arbitro: p.arbitro || null,
              golesLocal: p.golesLocal,
              golesVisitante: p.golesVisitante,
              goleadores: p.goleadores || [],
              eventos_count: (p.eventos || []).length,
              formacionLocal: p.formacionLocal ? true : false
            }))
          };
        } catch (e) {
          report.apis["combinado"] = { ok: false, error: e.message };
        }
        return new Response(
          JSON.stringify(report, null, 2),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      return jsonError("Ruta no encontrada", 404);
    }
    if (request.method === "DELETE") {
      if (path === "/fuentes") return handleDeleteFuente(url, env);
      if (path === "/notas") return handleDeleteNota(url, env);
      if (path === "/whatsapp/programado") return handleDeleteWhatsappProgramado(url, env);
      if (path === "/agenda/evento") return handleDeleteAgendaEvento(url, env);
      if (path === "/agenda/efemeride") return handleDeleteAgendaEfemeride(url, env);
      if (path === "/studio/proyecto") return handleStudioEliminarProyecto(url, env);
      return jsonError("Ruta no encontrada", 404);
    }
    if (request.method !== "POST") return jsonError("M\xE9todo no permitido", 405);
    if (path === "/studio/transcribir") {
      return handleStudioTranscribir(request, env);
    }
    if (path === "/video-editor/transcribir") {
      return handleVideoEditorTranscribir(request, env);
    }
    if (path === "/api/transcribe") {
      return handleStudioTranscribir(request, env);
    }
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonError("JSON inv\xE1lido", 400);
    }
    if (path === "/" && url.searchParams.get("ai") === "1") return handlePlacasAI(request, env, body);
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
    if (path === "/whatsapp/config/prompt") return handlePostWaPrompt(body, env);
    if (path === "/whatsapp/config/links") return handlePostWaLinks(body, env);
    if (path === "/social/prompt") return handlePostSocialPrompt(body, env);
    if (path === "/social/generar") return handleSocialGenerar(body, env);
    if (path === "/social/reel/guion") return handleReelGuion(body, env);
    if (path === "/social/reel/audio") return handleReelAudio(body, env);
    if (path === "/social/reel/config") return handlePostReelConfig(body, env);
    if (path === "/agenda/evento") return handlePostAgendaEvento(body, env);
    if (path === "/agenda/efemeride") return handlePostAgendaEfemeride(body, env);
    if (path === "/agenda/angulos") return handleAgendaAngulos(body, env);
    if (path === "/resumen/generar") return handleResumenGenerar(body, env);
    if (path === "/resumen/agregar") return handleResumenAgregar(body, env);
    if (path === "/resumen/eliminar") return handleResumenEliminar(body, env);
    if (path === "/resumen/generar-guion-reel") return handleGenerarGuionReel(body, env);
    if (path === "/studio/generar-vtt") return handleStudioGenerarVTT(request, env);
    if (path === "/studio/proyecto") return handleStudioGuardarProyecto(body, env);
    if (path === "/api/suggest-cuts") return handleVideoEditorSuggestCuts(body, env);
    if (path === "/api/generate-headline") return handleGenerateHeadline(request, env);
    return jsonError("Ruta no encontrada", 404);
  },
  // Handler para la cola
  async queue(batch, env) {
    return queue(batch, env);
  }
};

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError2;

// .wrangler/tmp/bundle-sT9B4f/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-sT9B4f/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
