// ============================================================
// Media Mendoza — Worker v18 (FINAL CON TODAS LAS FUNCIONALIDADES)
// ============================================================
// @ts-nocheck

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, cache-control",
};

const GEMINI_MODEL     = "gemini-3.1-flash-lite";
const GEMINI_URL       = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const EDITORIAL_KV_KEY = "config:editorial";
const WA_PROMPT_KV_KEY = "config:wa_prompt";
const WA_LINKS_KV_KEY  = "config:wa_links";
const REEL_PROMPT_KEY  = "config:reel:prompt";
const REEL_VOCES_KEY   = "config:reel:voces";
const MAX_PROXY_IMAGE_BYTES = 8 * 1024 * 1024;
const WHATSAPP_PREFIX  = "whatsapp:programado:";
const AGENDA_EV_PREFIX = "agenda:evento:";
const AGENDA_EF_PREFIX = "agenda:efemeride:";
const ANGULOS_PREFIX   = "agenda:angulos:";
const ANGULOS_TTL      = 60 * 60 * 24 * 30;
const STUDIO_PROYECTOS_PREFIX = "studio:proyecto:";

const VOCES_DEFAULT = [
  { id: "es-AR-TomasNeural", nombre: "Tomás (Hombre AR)", keyAlias: "AZURE_TTS_KEY_1", region: "AZURE_TTS_REGION_1" },
  { id: "es-AR-ElenaNeural", nombre: "Elena (Mujer AR)",  keyAlias: "AZURE_TTS_KEY_1", region: "AZURE_TTS_REGION_1" }
];

const REEL_PROMPT_DEFAULT = `Sos locutor de Media Mendoza, diario digital del sur de Mendoza, Argentina.
Escribí un guion para un reel de Instagram/Facebook de máximo 30 segundos (unas 60-80 palabras).
Tono: directo, urgente, informativo. Español rioplatense.
El guion debe ir al dato central desde la primera oración, sin introducción.
No uses signos como guiones, paréntesis ni hashtags. Solo texto fluido para leer en voz alta.
Respondé SOLO con JSON sin backticks:
{"titulo":"título corto para mostrar en el video, máximo 8 palabras","guion":"texto completo para leer en voz alta"}`;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

// ============================================================
// SMN - Servicio Meteorológico Nacional
// ============================================================

const SMN_KV_TOKEN_KEY = "smn:jwt_token";
const SMN_API_BASE = "https://ws1.smn.gob.ar/v1";
const SMN_TOKEN_TTL = 3000; // 50 minutos

// Mapeo de ciudades a IDs de ubicación SMN
const SMN_LOCATION_IDS = {
  "San Rafael": "9553",
  "General Alvear": "9560",
  "Malargüe": "9296",
  "Mendoza": "9378",
  "San Juan": "1425",
  "San Luis": "1712",
  "Neuquén": "9903"
};

// Mapeo de ciudades a áreas de alertas meteorológicas
const SMN_WARNING_AREAS = {
  "San Rafael": "3365",
  "General Alvear": "3365",
  "Malargüe": "3365"
};

// ── Helpers ──
function esXMLvalido(t){return t.includes("<rss")||t.includes("<feed")||t.includes("<channel")||t.includes("<item")||t.includes("<entry")||(t.trimStart().startsWith("<?xml")&&t.includes("<title"))}
function decodeHtml(t=""){return t.replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'")}
function limpiarEspacios(t=""){return decodeHtml(t).replace(/\s+/g," ").trim()}
function extractMeta(html,...patterns){for(const p of patterns){const m=html.match(p);const v=limpiarEspacios(m?.[1]||"");if(v)return v}return ""}
function normalizarTituloSitio(t=""){return t.replace(/\s+[|\-–—]\s+(Media Mendoza|mediamendoza\.com).*$/i,"").replace(/\s+/g," ").trim()}
function inferirCategoriaDesdeUrl(url){try{const u=new URL(url);const f=u.pathname.split("/").filter(Boolean)[0]||"";return limpiarEspacios(f.replace(/[-_]+/g," "))}catch{return""}}
function generarId(p){return `${p}${Date.now()}_${Math.random().toString(36).slice(2,8)}`}
function acortarUrlNota(url){try{const u=new URL(url);const p=u.pathname.split("/").filter(Boolean);if(p.length>=2){const n=p[1].match(/^(\d+)/);if(n)return `${u.origin}/${p[0]}/${n[1]}`}return `${u.origin}${u.pathname}`}catch{return url}}
async function listarObjetosKV(env,prefix){const list=await env.KV.list({prefix});const items=[];for(const k of list.keys){const v=await env.KV.get(k.name,"json");if(v)items.push(v)}return items}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function jsonOk(data){return new Response(JSON.stringify({ok:true,...data}),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}})}
function jsonError(msg,status=400){return new Response(JSON.stringify({ok:false,error:msg}),{status,headers:{...CORS_HEADERS,"Content-Type":"application/json"}})}
function escapeXml(s=""){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
function localeFromVoice(v=""){const m=String(v).match(/^([a-z]{2,3}-[A-Z]{2})-/);return m?m[1]:"es-AR"}
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
function procesarSegmentosAOraciones(segments) {
  if (!segments || !segments.length) return [];
  
  const oraciones = [];
  const MAX_PALABRAS = 15;      // Máximo 15 palabras por oración
  const MAX_CARACTERES = 120;    // Máximo 120 caracteres por oración
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    let texto = seg.text.trim();
    
    // Dividir por signos de puntuación (., !, ?, ;, :) aunque no tengan espacio
    // Usar lookbehind para dividir después del signo
    let frases = [];
    
    // Primero, dividir por puntuación fuerte
    let partes = texto.split(/(?<=[.!?;:])\s*/);
    
    for (let parte of partes) {
      parte = parte.trim();
      if (!parte) continue;
      
      // Verificar si esta parte es demasiado larga
      const palabras = parte.split(/\s+/).length;
      const caracteres = parte.length;
      
      if (palabras <= MAX_PALABRAS && caracteres <= MAX_CARACTERES) {
        frases.push(parte);
      } else {
        // Dividir por palabras
        const palabrasArray = parte.split(/\s+/);
        for (let j = 0; j < palabrasArray.length; j += MAX_PALABRAS) {
          const subFrase = palabrasArray.slice(j, j + MAX_PALABRAS).join(' ');
          if (subFrase.trim()) frases.push(subFrase.trim());
        }
      }
    }
    
    // Si no se generaron frases por puntuación, dividir por longitud
    if (frases.length === 0 && texto.length > MAX_CARACTERES) {
      const palabrasArray = texto.split(/\s+/);
      for (let j = 0; j < palabrasArray.length; j += MAX_PALABRAS) {
        const subFrase = palabrasArray.slice(j, j + MAX_PALABRAS).join(' ');
        if (subFrase.trim()) frases.push(subFrase.trim());
      }
    } else if (frases.length === 0) {
      frases = [texto];
    }
    
    // Distribuir las frases con timestamps proporcionales
    const duracionSegmento = seg.end - seg.start;
    const duracionPorFrase = duracionSegmento / frases.length;
    
    for (let j = 0; j < frases.length; j++) {
      const inicio = seg.start + (j * duracionPorFrase);
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

function extraerTexto(html){
  html=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<nav[\s\S]*?<\/nav>/gi,'').replace(/<header[\s\S]*?<\/header>/gi,'').replace(/<footer[\s\S]*?<\/footer>/gi,'').replace(/<aside[\s\S]*?<\/aside>/gi,'');
  html=html.replace(/<\/(p|h[1-6]|li|br|div)>/gi,'\n').replace(/<[^>]+>/g,'');
  html=html.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  return html.split('\n').map(l=>l.trim()).filter(l=>l.length>30).slice(0,80).join('\n');
}
async function fetchHtml(url,cacheTtl=300){
  const res=await fetch(url,{headers:BROWSER_HEADERS,redirect:"follow",cf:{cacheTtl,cacheEverything:true}});
  if(!res.ok) throw new Error(`Error ${res.status}`);
  return {res,html:await res.text()};
}
function extraerDatosNota(html,url){
  const title=normalizarTituloSitio(extractMeta(html,/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,300})["']/i,/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']{1,300})["']/i,/<title[^>]*>([^<]{1,300})<\/title>/i));
  const description=extractMeta(html,/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i,/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i);
  const image=extractMeta(html,/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,1500})["']/i,/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']{1,1500})["']/i);
  const category=extractMeta(html,/<meta[^>]+property=["']article:section["'][^>]+content=["']([^"']{1,120})["']/i,/<meta[^>]+name=["']section["'][^>]+content=["']([^"']{1,120})["']/i)||inferirCategoriaDesdeUrl(url);
  return {title,category,description,body:extraerTexto(html),image,url};
}

// ============================================================
// RESUMEN DIARIO
// ============================================================

const RESUMEN_PREFIX = "resumen:";

function getTTLHastaManana5AM() {
  const ahora = new Date();
  const manana5AM = new Date(ahora);
  manana5AM.setDate(ahora.getDate() + 1);
  manana5AM.setHours(5, 0, 0, 0);
  const diferenciaMs = manana5AM - ahora;
  const ttlSegundos = Math.floor(diferenciaMs / 1000);
  return Math.max(ttlSegundos, 3600);
}

async function handleResumenAgregar(body, env) {
  const { id, fecha, titulo, url, urlCorta, categoria, imagen, timestamp } = body;
  
  if (!id || !fecha || !titulo) {
    return jsonError('Faltan campos requeridos (id, fecha, titulo)', 400);
  }
  
  const key = `${RESUMEN_PREFIX}${fecha}:${id}`;
  const ttl = getTTLHastaManana5AM();
  
  const item = {
    id,
    fecha,
    titulo,
    url: url || '',
    urlCorta: urlCorta || '',
    categoria: categoria || 'General',
    imagen: imagen || '',
    timestamp: timestamp || Date.now()
  };
  
  try {
    await env.KV.put(key, JSON.stringify(item), { expirationTtl: ttl });
    return jsonOk({ guardado: true, id, expiraEn: ttl });
  } catch (err) {
    console.error('Error guardando resumen:', err);
    return jsonError('Error guardando en KV: ' + err.message, 500);
  }
}

async function handleResumenObtener(url, env) {
  const fecha = url.searchParams.get('fecha');
  if (!fecha) {
    return jsonError('Falta parámetro fecha (YYYY-MM-DD)', 400);
  }
  
  const prefix = `${RESUMEN_PREFIX}${fecha}:`;
  
  try {
    const list = await env.KV.list({ prefix });
    const notas = [];
    
    for (const key of list.keys) {
      const nota = await env.KV.get(key.name, 'json');
      if (nota) notas.push(nota);
    }
    
    notas.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    return jsonOk({ fecha, notas, total: notas.length });
  } catch (err) {
    console.error('Error obteniendo resumen:', err);
    return jsonError('Error obteniendo resumen: ' + err.message, 500);
  }
}

async function handleResumenGenerar(body, env) {
  const { fecha, notas } = body;
  
  if (!notas || !notas.length) {
    return jsonError('No hay notas para generar resumen', 400);
  }
  
  const editorial = await getEditorial(env);
  const editorialText = editorial ? `\n\nLÍNEA EDITORIAL:\n${editorial.substring(0, 500)}` : '';
  
  let notasTexto = '';
  let notasInfo = [];
  for (let i = 0; i < notas.length; i++) {
    const n = notas[i];
    notasTexto += `${i + 1}. ${n.titulo}\n   🔗 ${n.urlCorta || n.url}\n`;
    notasInfo.push({
      titulo: n.titulo,
      url: n.url,
      urlCorta: n.urlCorta || n.url,
      categoria: n.categoria || 'General',
      imagen: n.imagen || ''
    });
  }
  
  const prompt = `Sos editor de Media Mendoza, diario del sur de Mendoza, Argentina.
Generá un resumen diario de noticias para WhatsApp y para redes sociales.

NOTAS DEL DÍA (${fecha || 'hoy'}):
${notasTexto}

INSTRUCCIONES:
1. Para WHATSAPP (grupo o canal):
   - Tono directo, con emojis estratégicos
   - Encabezado llamativo: "📰 RESUMEN DEL DÍA · ${fecha || 'HOY'}"
   - Cada noticia: un emoji según categoría + titular + link corto
   - Al final: "📱 *Media Mendoza* — Noticias confiables del sur mendocino"
   - Máximo 1500 caracteres

2. Para INSTAGRAM/FACEBOOK (post):
   - Tono visual, dinámico, con emojis
   - Frase gancho al inicio
   - Lista de noticias con mini-resumen de 1 línea cada una
   - 5-8 hashtags al final (#Mendoza #Noticias #Resumen)
   - Máximo 2000 caracteres

3. Para GUIDON DE REEL (texto plano para narración):
   - Sin emojis, sin hashtags, sin links, sin negritas
   - Texto fluido, natural, para leer en voz alta
   - Incluir el título de cada nota seguido de un breve resumen
   - Máximo 250 palabras

Respondé SOLO con JSON sin markdown:
{
  "whatsapp": "mensaje completo para WhatsApp con emojis",
  "redes": "texto completo para Instagram/Facebook con emojis",
  "guion_reel": "texto plano para narración del video",
  "sugerencia_hashtags": ["#hashtag1", "#hashtag2"],
  "notas": [
    {
      "titulo": "título de la nota",
      "resumen": "resumen corto de 20-30 palabras para el video",
      "url": "url de la nota",
      "categoria": "categoría"
    }
  ]
}`;

  const r = await callGemini(prompt + editorialText, env);
  if (r.error) return jsonError(r.error, 500);
  
  const notasConImagen = (r.data?.notas || []).map((nota, idx) => ({
    ...nota,
    imagen: notas[idx]?.imagen || '',
    urlCorta: notas[idx]?.urlCorta || nota.url
  }));
  
  return jsonOk({
    whatsapp: r.data?.whatsapp || '',
    redes: r.data?.redes || '',
    guion_reel: r.data?.guion_reel || '',
    hashtags: r.data?.sugerencia_hashtags || [],
    notas: notasConImagen
  });
}

async function handleGenerarGuionReel(body, env) {
  const { texto } = body;
  if (!texto) return jsonError('Falta texto', 400);
  
  const prompt = `Convertí este texto en un guion fluido para narración de video.
  REGLAS:
  - Eliminá emojis, hashtags, links, negritas, asteriscos, guiones
  - Texto natural, en español rioplatense, como si lo leyera un locutor
  - Fluido para leer en voz alta
  - Mantené la información principal

  TEXTO ORIGINAL:
  ${texto.substring(0, 2000)}

  Respondé SOLO con JSON: { "guion": "texto del guion limpio" }`;

  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  
  let guion = r.data?.guion || texto;
  guion = guion.replace(/[#*_`]/g, '').replace(/https?:\/\/[^\s]+/g, '').replace(/[🔗📱📣🎧✅⚠️✗✓★✦▶️⏸️🎬📋🗑✏️🕐📍📅📰💬⚡🔍🎵🎙️]/g, '');
  
  return jsonOk({ guion });
}

async function handleResumenEliminar(body, env) {
  const { id, fecha } = body;
  if (!id || !fecha) {
    return jsonError('Faltan id o fecha', 400);
  }
  const key = `${RESUMEN_PREFIX}${fecha}:${id}`;
  try {
    await env.KV.delete(key);
    return jsonOk({ eliminado: true, id });
  } catch (err) {
    return jsonError('Error eliminando: ' + err.message, 500);
  }
}

// ============================================================
// STUDIO - Transcripción con Cloudflare Whisper (CORREGIDO)
// ============================================================

async function handleStudioTranscribir(request, env) {
  if (!env.AI) {
    return jsonError("Cloudflare AI no está configurado", 500);
  }

  try {
    const formData = await request.formData();
    let audioFile = formData.get('audio');
    if (!audioFile) audioFile = formData.get('file');
    
    if (!audioFile) {
      return jsonError("Falta archivo de audio", 400);
    }

    // 1. Obtener el ArrayBuffer del archivo
    const audioBuffer = await audioFile.arrayBuffer();

    // 2. CONVERSIÓN CRÍTICA: ArrayBuffer a array de números
    const audioArray = [...new Uint8Array(audioBuffer)];

    // 3. Llamar al modelo Whisper
    const response = await env.AI.run('@cf/openai/whisper', {
      audio: audioArray
    });

    // 4. Procesar la respuesta de Whisper
    let texto = '';
    let vtt = '';
    let segments = [];
    let words = [];
    
    if (response) {
      texto = response.text || '';
      vtt = response.vtt || '';
      
      if (response.words && Array.isArray(response.words)) {
        words = response.words;
        const groupSize = 6;
        for (let i = 0; i < words.length; i += groupSize) {
          const group = words.slice(i, i + groupSize);
          segments.push({
            start: group[0].start,
            end: group[group.length - 1].end,
            text: group.map(w => w.word).join(' ')
          });
        }
      } else if (texto) {
        segments = [{ start: 0, end: 30, text: texto }];
      }
    }

    return jsonOk({
      texto: texto,
      word_count: response?.word_count || texto.split(/\s+/).length,
      segments: segments,
      words: words,
      vtt: vtt
    });

  } catch (err) {
    console.error('Error en transcripción:', err);
    return jsonError("Error en transcripción: " + err.message, 500);
  }
}

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
      vtt += `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n\n`;
    });

    return new Response(vtt, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/vtt',
        'Content-Disposition': 'attachment; filename="subtitulos.vtt"'
      }
    });

  } catch (err) {
    return jsonError("Error generando VTT: " + err.message, 500);
  }
}

async function handleStudioGuardarProyecto(body, env) {
  const { id, titulo, transcripcion, segments, createdAt } = body;
  
  if (!id || !titulo) {
    return jsonError("Faltan id o titulo", 400);
  }

  const proyecto = {
    id,
    titulo,
    transcripcion: transcripcion || '',
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

async function handleStudioObtenerProyectos(env) {
  try {
    const list = await env.KV.list({ prefix: STUDIO_PROYECTOS_PREFIX });
    const proyectos = [];
    
    for (const key of list.keys) {
      const proyecto = await env.KV.get(key.name, 'json');
      if (proyecto) proyectos.push(proyecto);
    }
    
    proyectos.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    
    return jsonOk({ proyectos });
  } catch (err) {
    return jsonError("Error obteniendo proyectos: " + err.message, 500);
  }
}

async function handleStudioEliminarProyecto(url, env) {
  const id = url.searchParams.get('id');
  if (!id) return jsonError("Falta id", 400);
  
  try {
    await env.KV.delete(`${STUDIO_PROYECTOS_PREFIX}${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error eliminando: " + err.message, 500);
  }
}

// ============================================================
// VIDEO-EDITOR - Transcripción de audio extraído de video
// ============================================================

async function handleVideoEditorTranscribir(request, env) {
  if (!env.AI) {
    return jsonError("Cloudflare AI no está configurado", 500);
  }

  try {
    const formData = await request.formData();
    let audioFile = formData.get('audio');
    if (!audioFile) audioFile = formData.get('file');
    
    if (!audioFile) {
      return jsonError("Falta archivo de audio", 400);
    }

    console.log('[video-editor] Audio recibido:', audioFile.name, audioFile.size, audioFile.type);

    const audioBuffer = await audioFile.arrayBuffer();
    const audioArray = [...new Uint8Array(audioBuffer)];

    const response = await env.AI.run('@cf/openai/whisper', {
      audio: audioArray
    });

    let texto = '';
    let vtt = '';
    let segments = [];
    let words = [];
    
    if (response) {
      texto = response.text || '';
      vtt = response.vtt || '';
      
      if (response.words && Array.isArray(response.words)) {
        words = response.words;
        const groupSize = 6;
        for (let i = 0; i < words.length; i += groupSize) {
          const group = words.slice(i, i + groupSize);
          const textoAgrupado = group.map(w => w.word).join(' ');
          
          segments.push({
            start: group[0].start,
            end: group[group.length - 1].end,
            text: textoAgrupado,   // Mantiene compatibilidad original
            texto: textoAgrupado   // <--- CORRECCIÓN CLAVE: Para que procesarSegmentosAOraciones no rompa
          });
        }
      } else if (texto) {
        segments = [{ start: 0, end: 30, text: texto, texto: texto }];
      }
    }

    // Convertir segmentos a oraciones completas
    const oraciones = procesarSegmentosAOraciones(segments);

    // ============================================================
    // DETECCIÓN DE PARTICIPANTES (SPEAKERS) con Gemini mejorado
    // ============================================================
    let oracionesConSpeaker = [...oraciones];
    
    if (oraciones.length > 0) {
      try {
        // Construir el prompt mejorado
        const textoParaPrompt = oraciones.map((o, i) => `${i}: ${o.texto}`).join('\n');
        
        const prompt = `Eres un sistema experto en analizar diálogos y transcripciones.
Tu tarea es analizar la siguiente transcripción de un diálogo y asignar una etiqueta de participante a cada línea.

Reglas para la asignación:
1. Analiza el estilo, las palabras y el contexto de CADA línea.
2. Las líneas que tengan un estilo y contenido similar (por ejemplo, todas las preguntas o todas las afirmaciones de una misma persona) deben tener la MISMA etiqueta.
3. Los cambios de participante suelen ocurrir cuando el contenido de una línea es una respuesta directa o un cambio de tema respecto a la línea anterior.
4. Responde ÚNICAMENTE con un array de strings en formato JSON válido, sin ningún otro texto ni explicación. Por ejemplo: ["Invitado", "Anfitrión", "Invitado", "Invitado", "Anfitrión"]

Transcripción:
${textoParaPrompt}`;

        console.log('[video-editor] Llamando a Gemini para detectar participantes...');
        const geminiResult = await callGemini(prompt, env);

        if (geminiResult.data && Array.isArray(geminiResult.data)) {
          const participants = geminiResult.data;
          if (participants.length === oraciones.length) {
            oracionesConSpeaker = oraciones.map((o, i) => ({
              ...o,
              speaker: participants[i] || 'desconocido'
            }));
            console.log('[video-editor] Participantes detectados:', participants);
          } else {
            console.error('[video-editor] Error: cantidad de etiquetas no coincide', participants.length, oraciones.length);
            throw new Error('Cantidad incorrecta');
          }
        } else {
          throw new Error('Gemini no devolvió array');
        }
        
      } catch (err) {
        console.error('[video-editor] Error detectando participantes con Gemini:', err);
        console.log('[video-editor] Usando fallback: asignación por alternancia');
        
        // Fallback: asignación por turno simple (para no dejar la transcripción sin etiquetas)
        let speakerActual = 'Participante A';
        oracionesConSpeaker = oraciones.map((o, i) => {
          if (i > 0) {
            // Regla simple: si la oración es corta o parece pregunta, cambiar de participante
            const esCorta = o.texto.split(' ').length < 10;
            if (esCorta && i % 2 === 0) {
              speakerActual = speakerActual === 'Participante A' ? 'Participante B' : 'Participante A';
            }
          }
          return { ...o, speaker: speakerActual };
        });
      }
    }

    console.log('[video-editor] Transcripción completada, segmentos:', segments.length, 'oraciones:', oracionesConSpeaker.length);
    
    return jsonOk({
      texto: texto,
      word_count: response?.word_count || texto.split(/\s+/).length,
      segments: segments,
      oraciones: oracionesConSpeaker,
      words: words,
      vtt: vtt
    });

  } catch (err) {
    console.error('Error en transcripción de video:', err);
    return jsonError("Error en transcripción de video: " + err.message, 500);
  }
}

// ============================================================
// VIDEO-EDITOR - Sugerir cortes con IA
// ============================================================

async function handleVideoEditorSuggestCuts(body, env) {
  const { transcript, segments } = body;
  if (!transcript) return jsonError("Falta la transcripción", 400);

  const prompt = `Analiza esta transcripción de entrevista y devuelve SOLO los números de segmento (índices) que contienen muletillas (eh, este, em, o sea, digamos, como que), silencios largos, repeticiones o frases incompletas.
  Formato de respuesta: [0, 2, 5]
  NO añadas explicaciones, solo el array.
  
  Transcripción por segmentos (cada línea es un segmento con su índice):
  ${segments.map((s, i) => `${i}: ${s.text}`).join('\n')}`;

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
        if (res.ok) { response = await res.json(); break; }
      } catch (e) { continue; }
    }
    if (!response) throw new Error("No se pudo obtener respuesta de Gemini");

    const raw = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = raw.match(/\[[\d,\s]*\]/);
    let indices = [];
    if (match) {
      indices = JSON.parse(match[0]);
    } else {
      const muletillas = ['eh', 'este', 'em', 'mm', 'ah', 'ehh', 'estee', 'o sea', 'digamos', 'como que'];
      indices = segments.filter((seg, idx) => {
        const text = seg.text.toLowerCase();
        return muletillas.some(m => text.includes(m)) || (seg.end - seg.start) < 1.5;
      }).map((_, idx) => idx);
    }
    return jsonOk({ suggestions: indices.map(i => ({ start: segments[i].start, end: segments[i].end, reason: "sugerido por IA" })), total_suggestions: indices.length });
  } catch (err) {
    console.error('Error en sugerencias de corte:', err);
    return jsonError("Error procesando sugerencias: " + err.message, 500);
  }
}

// ============================================================
// GENERAR TITULAR CON GEMINI VISION (desde imagen)
// ============================================================

async function handleGenerateHeadline(request, env) {
  try {
    const { image } = await request.json();
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Falta configurar GEMINI_API_KEY' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];
    const payload = {
      contents: [{
        parts: [
          { text: "Eres un editor periodístico de Media Mendoza. Mira esta imagen y escribe un titular corto, impactante y en español argentino (máximo 8 palabras). Usa mayúsculas solo en la primera letra y nombres propios. Sin puntos finales." },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]
      }]
    };
    const aiResponse = await fetch(geminiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const aiData = await aiResponse.json();
    const headline = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Titular no disponible";
    return new Response(JSON.stringify({ headline: headline.trim() }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Error Gemini:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
}

// ============================================================
// TEST - Verificar binding AI
// ============================================================

async function handleTestAI(env) {
  const hasAI = !!env.AI;

  return jsonOk({
    ai_disponible: hasAI,
    mensaje: hasAI ? "✅ AI configurado correctamente" : "❌ AI NO está configurado. Agregá binding 'AI' en el dashboard."
  });
}

// ============================================================
// SMN - Servicio Meteorológico Nacional
// ============================================================

async function handleSMNUpdateToken(body, env) {
  const { token } = body;

  if (!token) {
    return jsonError("Falta token", 400);
  }

  try {
    await env.KV.put(SMN_KV_TOKEN_KEY, token, { expirationTtl: SMN_TOKEN_TTL });
    return jsonOk({ guardado: true, expiraEn: SMN_TOKEN_TTL });
  } catch (err) {
    console.error('Error guardando token SMN:', err);
    return jsonError("Error guardando token: " + err.message, 500);
  }
}

// Normaliza la respuesta SMN para que coincida con lo que espera placas/04-clima.js
function smnEsRespuestaValida(payload) {
  return payload && !payload.error && typeof payload === "object";
}

function smnAplanarSol(sunPayload) {
  const nested = sunPayload?.sun || {};
  return {
    sunrise: nested.sunrise || "06:00",
    sunset: nested.sunset || "18:00",
    location_id: sunPayload?.location_id ?? null,
    date: sunPayload?.date ?? null,
  };
}

function smnNormalizarPeriodo(periodo) {
  if (!periodo || periodo.error) return null;

  const wind = periodo.wind || {};
  return {
    ...periodo,
    rain_prob_range: Array.isArray(periodo.rain_prob_range) ? periodo.rain_prob_range : [0, 0],
    gust_range: Array.isArray(periodo.gust_range) ? periodo.gust_range : null,
    rain06h: periodo.rain06h ?? 0,
    visibility: periodo.visibility || "Buena",
    weather: periodo.weather || { id: 3, description: "Nublado" },
    wind: {
      ...wind,
      direction: wind.direction || "",
      deg: wind.deg ?? 0,
      speed_range: Array.isArray(wind.speed_range) ? wind.speed_range : [0, 0],
    },
  };
}

function smnElegirPeriodoRepresentativo(dia) {
  return dia?.afternoon || dia?.morning || dia?.night || dia?.early_morning || null;
}

function smnNormalizarDiaPronostico(dia) {
  const normalizado = {
    ...dia,
    early_morning: smnNormalizarPeriodo(dia.early_morning),
    morning: smnNormalizarPeriodo(dia.morning),
    afternoon: smnNormalizarPeriodo(dia.afternoon),
    night: smnNormalizarPeriodo(dia.night),
  };

  const periodoRef = smnElegirPeriodoRepresentativo(normalizado);
  normalizado.weather = periodoRef?.weather || { id: 3, description: "Nublado" };

  return normalizado;
}

function smnNormalizarPronostico(forecastPayload) {
  if (!smnEsRespuestaValida(forecastPayload)) {
    return { forecast: [] };
  }

  const dias = Array.isArray(forecastPayload.forecast) ? forecastPayload.forecast : [];
  return {
    ...forecastPayload,
    forecast: dias.map(smnNormalizarDiaPronostico),
  };
}

function smnEnriquecerVientoActual(weatherPayload, forecastPayload) {
  if (!smnEsRespuestaValida(weatherPayload)) return null;

  const wind = weatherPayload.wind || {};
  if (wind.gust != null) {
    return { ...weatherPayload, wind: { direction: "", deg: 0, ...wind } };
  }

  const hoy = smnNormalizarPronostico(forecastPayload).forecast?.[0];
  const periodo = smnElegirPeriodoRepresentativo(hoy);
  const rafaga = periodo?.gust_range
    ? Math.round((periodo.gust_range[0] + periodo.gust_range[1]) / 2)
    : null;

  return {
    ...weatherPayload,
    wind: {
      direction: "",
      deg: 0,
      speed: 0,
      ...wind,
      gust: rafaga,
    },
  };
}

async function handleSMNWeather(url, env) {
  const ciudad = url.searchParams.get('ciudad') || 'San Rafael';
  const locationId = SMN_LOCATION_IDS[ciudad];

  if (!locationId) {
    return jsonError(`Ciudad no encontrada: ${ciudad}`, 404);
  }

  try {
    const token = await env.KV.get(SMN_KV_TOKEN_KEY);

    if (!token) {
      return jsonError("Token SMN no disponible. Ejecutá el script de actualización.", 503);
    }

    const endpoints = [
      `georef/location/${locationId}`,
      `weather/location/${locationId}`,
      `forecast/location/${locationId}`,
      `sun/location/${locationId}`,
      `warning/shortterm/location/${locationId}`,
      `warning/alert/location/${locationId}`
    ];

    // Agregar alertas meteorológicas si la ciudad tiene área de alertas
    const warningArea = SMN_WARNING_AREAS[ciudad];
    if (warningArea) {
      endpoints.push(`warning/heat/area/${warningArea}`);
    }

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${SMN_API_BASE}/${endpoint}`, {
          headers: {
            "Authorization": `JWT ${token}`,
            "User-Agent": BROWSER_HEADERS["User-Agent"]
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Usar el primer segmento del endpoint como clave (weather, forecast, sun, warning)
          const key = endpoint.split('/')[0];
          results[key] = data;
        } else {
          const key = endpoint.split('/')[0];
          results[key] = { error: `HTTP ${response.status}` };
        }
      } catch (e) {
        const key = endpoint.split('/')[0];
        results[key] = { error: e.message };
      }
    }

    const weather = smnEnriquecerVientoActual(results.weather, results.forecast);
    if (!weather) {
      return jsonError("No se pudo obtener el clima actual desde SMN", 502);
    }

    const forecast = smnNormalizarPronostico(results.forecast);
    const sunRaw = smnEsRespuestaValida(results.sun) ? results.sun : null;
    const sun = smnAplanarSol(sunRaw);

    return jsonOk({
      ciudad,
      locationId,
      // 04-clima.js lee smnData.sun (raíz) para amanecer/atardecer
      sun,
      data: {
        weather,
        forecast,
        sun: sunRaw,
        warning: smnEsRespuestaValida(results.warning) ? results.warning : null,
      },
    });

  } catch (err) {
    console.error('Error obteniendo clima SMN:', err);
    return jsonError("Error obteniendo clima: " + err.message, 500);
  }
}

// ============================================================
// BLOQUE 1️⃣: CONFIGURACIÓN Y HELPERS DEL MUNDIAL
// ============================================================

const FOOTBALL_DATA_URL = "https://api.football-data.org/v4";

const COUNTRY_FLAGS = {
  "Argentina": "🇦🇷", "Perú": "🇵🇪", "Brasil": "🇧🇷", "Chile": "🇨🇱",
  "Colombia": "🇨🇴", "Ecuador": "🇪🇨", "Paraguay": "🇵🇾", "Uruguay": "🇺🇾",
  "Venezuela": "🇻🇪", "Bolivia": "🇧🇴", "México": "🇲🇽", "Canadá": "🇨🇦",
  "Estados Unidos": "🇺🇸", "Costa Rica": "🇨🇷", "Honduras": "🇭🇳",
  "Francia": "🇫🇷", "España": "🇪🇸", "Alemania": "🇩🇪", "Italia": "🇮🇹",
  "Portugal": "🇵🇹", "Inglaterra": "🇬🇧", "Países Bajos": "🇳🇱",
  "Bélgica": "🇧🇪", "Dinamarca": "🇩🇰", "Suecia": "🇸🇪", "Polonia": "🇵🇱",
  "Japón": "🇯🇵", "Corea del Sur": "🇰🇷", "Australia": "🇦🇺",
  "Nueva Zelanda": "🇳🇿", "Marruecos": "🇲🇦", "Túnez": "🇹🇳",
  "Argelia": "🇩🇿", "Senegal": "🇸🇳", "Nigeria": "🇳🇬", "Ghana": "🇬🇭",
  "Chequia": "🇨🇿", "República Checa": "🇨🇿", "Noruega": "🇳🇴", "Croacia": "🇭🇷",
  "Serbia": "🇷🇸", "Suiza": "🇨🇭", "Austria": "🇦🇹", "Turquía": "🇹🇷",
  "Escocia": "🇬🇧", "Irán": "🇮🇷", "Iraq": "🇮🇶", "Uzbekistán": "🇺🇿",
  "Jordania": "🇯🇴", "Arabia Saudita": "🇸🇦", "Egipto": "🇪🇬", "Sudáfrica": "🇿🇦",
  "Costa de Marfil": "🇨🇮", "Cabo Verde": "🇨🇻", "Catar": "🇶🇦", "Qatar": "🇶🇦",
  "Panamá": "🇵🇦", "Curazao": "🇨🇼", "Haití": "🇭🇹", "Jamaica": "🇯🇲",
  "Bosnia y Herzegovina": "🇧🇦", "RD Congo": "🇨🇩", "Camerún": "🇨🇲",
  "Islandia": "🇮🇸", "Finlandia": "🇫🇮", "Hungría": "🇭🇺", "Rumania": "🇷🇴",
  "Grecia": "🇬🇷", "Ucrania": "🇺🇦", "Rusia": "🇷🇺", "Israel": "🇮🇱",
};

function getFlagPais(nombrePais) {
  const flagMap = {
    "Iran": "🇮🇷", "New Zealand": "🇳🇿", "France": "🇫🇷", 
    "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
    "Argentina": "🇦🇷", "Peru": "🇵🇪", "Brazil": "🇧🇷", "Chile": "🇨🇱",
    "Colombia": "🇨🇴", "Ecuador": "🇪🇨", "Paraguay": "🇵🇾", "Uruguay": "🇺🇾",
    "Venezuela": "🇻🇪", "Bolivia": "🇧🇴", "Mexico": "🇲🇽", "Canada": "🇨🇦",
    "United States": "🇺🇸", "USA": "🇺🇸", "Costa Rica": "🇨🇷", "Honduras": "🇭🇳",
    "Spain": "🇪🇸", "Germany": "🇩🇪", "Italy": "🇮🇹",
    "Portugal": "🇵🇹", "England": "🇬🇧", "Netherlands": "🇳🇱",
    "Belgium": "🇧🇪", "Denmark": "🇩🇰", "Sweden": "🇸🇪", "Poland": "🇵🇱",
    "Japan": "🇯🇵", "South Korea": "🇰🇷", "Australia": "🇦🇺",
    "Morocco": "🇲🇦", "Tunisia": "🇹🇳", "Nigeria": "🇳🇬", "Ghana": "🇬🇭",
    "Croatia": "🇭🇷", "Serbia": "🇷🇸", "Switzerland": "🇨🇭", "Austria": "🇦🇹",
    "Turkey": "🇹🇷", "Greece": "🇬🇷", "Ukraine": "🇺🇦", "Algeria": "🇩🇿",
    "Czech Republic": "🇨🇿", "Czechia": "🇨🇿", "Scotland": "🇬🇧", "Wales": "🇬🇧",
    "Ivory Coast": "🇨🇮", "South Africa": "🇿🇦", "Cameroon": "🇨🇲", "Egypt": "🇪🇬",
    "Saudi Arabia": "🇸🇦", "Qatar": "🇶🇦", "Jordan": "🇯🇴", "Uzbekistan": "🇺🇿",
    "Cape Verde": "🇨🇻", "Curacao": "🇨🇼", "Curaçao": "🇨🇼", "Haiti": "🇭🇹",
    "Bosnia and Herzegovina": "🇧🇦", "Bosnia-Herzegovina": "🇧🇦",
    "Bosnia y Herzegovina": "🇧🇦",
    "Estados Unidos": "🇺🇸", "Corea del Sur": "🇰🇷", "Corea del Norte": "🇰🇵",
    "DR Congo": "🇨🇩", "Democratic Republic of Congo": "🇨🇩",
    "Panama": "🇵🇦", "Jamaica": "🇯🇲", "Iceland": "🇮🇸", "Finland": "🇫🇮",
    "Hungary": "🇭🇺", "Romania": "🇷🇴", "Russia": "🇷🇺", "Israel": "🇮🇱",
    "United Arab Emirates": "🇦🇪", "China": "🇨🇳", "China PR": "🇨🇳",
    "North Korea": "🇰🇵", "India": "🇮🇳", "Thailand": "🇹🇭",
    // Spanish names
    "Sudáfrica": "🇿🇦", "Marruecos": "🇲🇦", "Túnez": "🇹🇳", "Argelia": "🇩🇿",
    "Camerún": "🇨🇲", "Nueva Zelanda": "🇳🇿", "Arabia Saudita": "🇸🇦",
    "Japón": "🇯🇵", "Canadá": "🇨🇦", "México": "🇲🇽", "Chequia": "🇨🇿",
    "Noruega": "🇳🇴", "Suecia": "🇸🇪", "Alemania": "🇩🇪", "Francia": "🇫🇷",
    "España": "🇪🇸", "Inglaterra": "🇬🇧", "Países Bajos": "🇳🇱",
    "Bélgica": "🇧🇪", "Croacia": "🇭🇷", "Serbia": "🇷🇸", "Suiza": "🇨🇭",
    "Austria": "🇦🇹", "Turquía": "🇹🇷", "Grecia": "🇬🇷", "Ucrania": "🇺🇦",
    "Polonia": "🇵🇱", "Hungría": "🇭🇺", "Rumania": "🇷🇴", "Rusia": "🇷🇺",
    "Irán": "🇮🇷", "Irak": "🇮🇶", "Costa de Marfil": "🇨🇮", "Ghana": "🇬🇭",
    "Senegal": "🇸🇳", "Nigeria": "🇳🇬", "Egipto": "🇪🇬", "Brasil": "🇧🇷",
    "Perú": "🇵🇪", "Colombia": "🇨🇴", "Uruguay": "🇺🇾", "Chile": "🇨🇱",
    "Paraguay": "🇵🇾", "Venezuela": "🇻🇪", "Ecuador": "🇪🇨", "Bolivia": "🇧🇴",
    "Panamá": "🇵🇦", "Honduras": "🇭🇳", "Jamaica": "🇯🇲", "Costa Rica": "🇨🇷",
    "Islandia": "🇮🇸", "Finlandia": "🇫🇮", "Dinamarca": "🇩🇰",
    "Eslovaquia": "🇸🇰", "Eslovenia": "🇸🇮", "Escocia": "🇬🇧", "Gales": "🇬🇧",
    "Haití": "🇭🇹", "Catar": "🇶🇦", "Jordania": "🇯🇴",
  };
  return flagMap[nombrePais] || "⚽";
}

function formatearHora(isoString) {
  if (!isoString) return "--:--";
  try {
    const fecha = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(fecha);
  } catch (e) {
    return "--:--";
  }
}

// Madrugada: partidos entre 00:00 y este cutoff (hora Argentina) se agrupan con el día anterior
const MADRUGADA_CUTOFF_GLOBAL = 4;

// Función global para calcular la "fecha de placa" de un partido
// Devuelve { fechaPlaca, esMadrugada }
function calcularFechaPlaca(horaUTC) {
  if (!horaUTC) return { fechaPlaca: null, esMadrugada: false };
  try {
    const fecha = new Date(horaUTC);
    const tiempoAR = new Date(fecha.getTime() - 3 * 60 * 60 * 1000);
    const horaAR = tiempoAR.getUTCHours();
    let diaAR = new Date(tiempoAR);
    let esMadrugada = false;

    if (horaAR < MADRUGADA_CUTOFF_GLOBAL) {
      diaAR = new Date(diaAR.getTime() - 24 * 60 * 60 * 1000);
      esMadrugada = true;
    }

    return {
      fechaPlaca: diaAR.toISOString().split('T')[0],
      esMadrugada,
    };
  } catch(e) {
    return { fechaPlaca: null, esMadrugada: false };
  }
}

// Traducir nombre de grupo del inglés al español
function traducirGrupo(group) {
  if (!group) return null;
  const map = {
    'GROUP_A': 'Grupo A', 'GROUP_B': 'Grupo B', 'GROUP_C': 'Grupo C',
    'GROUP_D': 'Grupo D', 'GROUP_E': 'Grupo E', 'GROUP_F': 'Grupo F',
    'GROUP_G': 'Grupo G', 'GROUP_H': 'Grupo H', 'GROUP_I': 'Grupo I',
    'GROUP_J': 'Grupo J', 'GROUP_K': 'Grupo K', 'GROUP_L': 'Grupo L',
    'Group A': 'Grupo A', 'Group B': 'Grupo B', 'Group C': 'Grupo C',
    'Group D': 'Grupo D', 'Group E': 'Grupo E', 'Group F': 'Grupo F',
    'Group G': 'Grupo G', 'Group H': 'Grupo H', 'Group I': 'Grupo I',
    'Group J': 'Grupo J', 'Group K': 'Grupo K', 'Group L': 'Grupo L',
  };
  return map[group] || group.replace(/GROUP_/i, 'Grupo ').replace(/Group /i, 'Grupo ');
}

// Traducir etapa del torneo del inglés al español
function traducirEtapa(stage) {
  if (!stage) return null;
  const map = {
    'GROUP_STAGE': 'Fase de grupos', 'GROUP_STAGE_1': 'Fase de grupos',
    'ROUND_OF_32': 'Dieciseisavos de final',
    'ROUND_OF_16': 'Octavos de final',
    'QUARTER_FINALS': 'Cuartos de final', 'QUARTER_FINAL': 'Cuartos de final',
    'SEMI_FINALS': 'Semifinal', 'SEMI_FINAL': 'Semifinal',
    'THIRD_PLACE_PLAY_OFF': 'Tercer puesto', 'THIRD_PLACE_PLAYOFF': 'Tercer puesto',
    'FINAL': 'Final',
    'MATCHDAY_1': 'Fecha 1', 'MATCHDAY_2': 'Fecha 2', 'MATCHDAY_3': 'Fecha 3',
  };
  return map[stage] || stage.replace(/_/g, ' ');
}

// Mapa de partidos Mundial 2026: equipo local → estadio/ciudad asignada
// Datos del calendario oficial FIFA 2026 (sede de cada partido)
const MUNDIAL_2026_SEDES = {
  // Fecha 1
  'Mexico_South Africa': { estadio: 'Estadio Azteca', ciudad: 'Ciudad de México' },
  'South Korea_Czechia': { estadio: 'Estadio Akron', ciudad: 'Guadalajara' },
  'South Korea_Czech Republic': { estadio: 'Estadio Akron', ciudad: 'Guadalajara' },
  // Se completará dinámicamente desde Zafronix o se usará como fallback
};

// Resolver estadio/ciudad para un partido usando Zafronix matches
async function resolverSedePartido(env, homeTeam, awayTeam, fecha) {
  // Intentar desde Zafronix matches endpoint
  try {
    const cacheKey = 'mundial:zafronix:matches:2026';
    let allMatches = null;

    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 6 * 60 * 60 * 1000)) {
        allMatches = cached.matches;
      }
    }

    if (!allMatches && env.ZAFRONIX_KEY) {
      const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
        headers: { 'X-API-Key': env.ZAFRONIX_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        allMatches = data.data || [];
        try {
          if (env.KV) {
            await env.KV.put(cacheKey, JSON.stringify({
              matches: allMatches, _cachedAt: Date.now()
            }), { expirationTtl: 21600 });
          }
        } catch(e) {}
      }
    }

    if (allMatches && allMatches.length > 0) {
      // Buscar match por equipos y fecha
      const home = homeTeam.toLowerCase();
      const away = awayTeam.toLowerCase();
      const match = allMatches.find(m => {
        const mHome = (m.homeTeam || '').toLowerCase();
        const mAway = (m.awayTeam || '').toLowerCase();
        const homeMatch = mHome === home || mHome.includes(home) || home.includes(mHome);
        const awayMatch = mAway === away || mAway.includes(away) || away.includes(mAway);
        if (homeMatch && awayMatch) return true;
        // Match cruzado
        if (mHome === away && mAway === home) return true;
        return false;
      });

      if (match) {
        return {
          estadio: match.stadium || '',
          ciudad: match.city || '',
          estadioId: match.stadiumId || null,
        };
      }
    }
  } catch(e) {
    console.error('Error resolviendo sede:', e.message);
  }

  return null;
}

function traducirPais(nombre) {
  const traducciones = {
    "United States": "Estados Unidos",
    "USA": "Estados Unidos",
    "Korea Republic": "Corea del Sur",
    "Korea": "Corea del Sur",
    "England": "Inglaterra",
    "France": "Francia",
    "Spain": "España",
    "Germany": "Alemania",
    "Italy": "Italia",
    "Portugal": "Portugal",
    "Netherlands": "Países Bajos",
    "Belgium": "Bélgica",
    "Denmark": "Dinamarca",
    "Sweden": "Suecia",
    "Poland": "Polonia",
    "Czech Republic": "Chequia",
    "Czechia": "Chequia",
    "Hungary": "Hungría",
    "Romania": "Rumania",
    "Turkey": "Turquía",
    "Greece": "Grecia",
    "Ukraine": "Ucrania",
    "Russia": "Rusia",
    "Iran": "Irán",
    "Iraq": "Iraq",
    "Saudi Arabia": "Arabia Saudita",
    "United Arab Emirates": "Emiratos Árabes",
    "Israel": "Israel",
    "Thailand": "Tailandia",
    "Vietnam": "Vietnam",
    "Indonesia": "Indonesia",
    "Malaysia": "Malasia",
    "Singapore": "Singapur",
    "Hong Kong": "Hong Kong",
    "Taiwan": "Taiwán",
    "India": "India",
    "Pakistan": "Pakistán",
    "Bangladesh": "Bangladesh",
    "Sri Lanka": "Sri Lanka",
    "Brazil": "Brasil",
    "Mexico": "México",
    "Canada": "Canadá",
    "Costa Rica": "Costa Rica",
    "Honduras": "Honduras",
    "Argentina": "Argentina",
    "Peru": "Perú",
    "Chile": "Chile",
    "Colombia": "Colombia",
    "Ecuador": "Ecuador",
    "Paraguay": "Paraguay",
    "Uruguay": "Uruguay",
    "Venezuela": "Venezuela",
    "Bolivia": "Bolivia",
    "South Africa": "Sudáfrica",
    "Morocco": "Marruecos",
    "Tunisia": "Túnez",
    "Senegal": "Senegal",
    "Nigeria": "Nigeria",
    "Ghana": "Ghana",
    "Cameroon": "Camerún",
    "Mali": "Mali",
    "Ivory Coast": "Costa de Marfil",
    "Côte d'Ivoire": "Costa de Marfil",
    "Croatia": "Croacia",
    "Serbia": "Serbia",
    "Switzerland": "Suiza",
    "Austria": "Austria",
    "Japan": "Japón",
    "South Korea": "Corea del Sur",
    "Australia": "Australia",
    "New Zealand": "Nueva Zelanda",
    "Norway": "Noruega",
    "Algeria": "Argelia",
    "Uzbekistan": "Uzbekistán",
    "Jordan": "Jordania",
    "Cape Verde": "Cabo Verde",
    "Qatar": "Qatar",
    "Curacao": "Curazao",
    "Curaçao": "Curazao",
    "Haiti": "Haití",
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
    "Azerbaijan": "Azerbaiyán",
    "Kazakhstan": "Kazajistán",
    "Iceland": "Islandia",
    "Ireland": "Irlanda",
    "Finland": "Finlandia",
    "Denmark": "Dinamarca",
    "Poland": "Polonia",
    "Hungary": "Hungría",
    "Romania": "Rumania",
    "Greece": "Grecia",
    "Ukraine": "Ucrania",
    "Serbia": "Serbia",
    "Russia": "Rusia",
    "Israel": "Israel",
    "Bahrain": "Baréin",
    "Oman": "Omán",
    "Kuwait": "Kuwait",
    "Lebanon": "Líbano",
    "Syria": "Siria",
    "Palestine": "Palestina",
    "China PR": "China",
    "China": "China",
    "North Korea": "Corea del Norte",
    "DPR Korea": "Corea del Norte",
    "Korea Republic": "Corea del Sur",
    "Korea": "Corea del Sur",
    "United Arab Emirates": "Emiratos Árabes",
    "UAE": "Emiratos Árabes",
    "Thailand": "Tailandia",
    "Vietnam": "Vietnam",
    "Indonesia": "Indonesia",
    "Malaysia": "Malasia",
    "Singapore": "Singapur",
    "India": "India",
    "Pakistan": "Pakistán",
    "Bangladesh": "Bangladés",
    "Nepal": "Nepal",
    "Sri Lanka": "Sri Lanka",
    "Myanmar": "Myanmar",
    "Philippines": "Filipinas",
    "Cambodia": "Camboya",
    "Laos": "Laos",
    "Tanzania": "Tanzania",
    "Kenya": "Kenia",
    "Uganda": "Uganda",
    "Ethiopia": "Etiopía",
    "Zambia": "Zambia",
    "Zimbabwe": "Zimbabue",
    "Mozambique": "Mozambique",
    "Angola": "Angola",
    "Togo": "Togo",
    "Benin": "Benín",
    "Guinea": "Guinea",
    "Gabon": "Gabón",
    "Congo": "Congo",
    "Madagascar": "Madagascar",
    "Mauritius": "Mauricio",
    "Rwanda": "Ruanda",
    "Burundi": "Burundi",
    "Burkina Faso": "Burkina Faso",
    "Sierra Leone": "Sierra Leona",
    "Equatorial Guinea": "Guinea Ecuatorial",
    "Libya": "Libia",
    "Sudan": "Sudán",
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
    "Peru": "Perú",
    "Venezuela": "Venezuela",
    "Fiji": "Fiji",
    "Papua New Guinea": "Papúa Nueva Guinea",
    "Solomon Islands": "Islas Salomón",
    "Tahiti": "Tahití",
    "New Caledonia": "Nueva Caledonia"
  };
  return traducciones[nombre] || nombre;
}

async function obtenerPartidosMundial(env, competitionId = 2000, fechaSolicitada = null) {
  const apiKey = env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return { error: "API key de football-data no configurada" };
  }

  try {
    // Fecha dinámica en zona horaria Argentina (UTC-3)
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoy = ahoraAR.toISOString().split('T')[0];
    const fechaBase = fechaSolicitada || hoy;

    // ── CACHE KV: toda la competencia (dinámica: 6h normal, 2 min si hay partidos en vivo/recién terminados) ──
    const cacheKey = `mundial:fd:${competitionId}`;
    let allMatches = null;
    try {
      if (env.KV) {
        const raw = await env.KV.get(cacheKey, 'json');
        if (raw && raw.matches && raw.matches.length > 0) {
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          // Detectar si hay partidos en vivo o recién terminados para la fecha solicitada
          const hayEnVivo = raw.matches.some(m => {
            try {
              const mDate = new Date(m.utcDate);
              const arDate = new Date(mDate.getTime() - 3 * 60 * 60 * 1000);
              const mDay = arDate.toISOString().split('T')[0];
              // En vivo o terminados hoy: refrescar cada 2 min para obtener status/goles actualizados
              return mDay === fechaBase && (
                m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === '1H' || m.status === '2H' || m.status === 'HT' ||
                m.status === 'FINISHED' || m.status === 'AET' || m.status === 'PEN'
              );
            } catch(e) { return false; }
          });
          // Cache válido: 2 min si hay partidos en juego o terminados hoy, 6h si no
          const maxAge = hayEnVivo ? 2 * 60 * 1000 : 6 * 60 * 60 * 1000;
          if (cacheAge < maxAge) {
            allMatches = raw.matches;
          }
        }
      }
    } catch (cacheErr) { /* ignorar */ }

    // Si no hay cache, llamar a la API
    if (!allMatches) {
      // Pedir TODOS los partidos de la competencia (sin filtro de fecha)
      const url = `${FOOTBALL_DATA_URL}/competitions/${competitionId}/matches`;
      const res = await fetch(url, { headers: { 'X-Auth-Token': apiKey } });

      if (!res.ok) {
        return { error: `Error API: ${res.status}` };
      }

      const data = await res.json();

      if (!data.matches || data.matches.length === 0) {
        return { partidos: [], fecha: fechaBase, mensaje: 'Sin partidos en la competencia' };
      }

      allMatches = data.matches;

      // Guardar en cache
      try {
        if (env.KV) {
          await env.KV.put(cacheKey, JSON.stringify({
            matches: allMatches,
            _cachedAt: Date.now(),
            _count: allMatches.length
          }), { expirationTtl: 21600 }); // 6 horas
        }
      } catch(e) { /* ignorar */ }
    }

    // ── Procesar y filtrar por fecha ──
    const partidos = allMatches.map(m => ({
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
      estadio: m.venue || '',
      ciudad: '',
      competicion: m.competition?.name || '',
      grupo: traducirGrupo(m.group),
      etapa: traducirEtapa(m.stage),
      jornada: m.matchday || null,
      arbitro: m.referee || null,
      golesLocal: m.score?.fullTime?.home ?? null,
      golesVisitante: m.score?.fullTime?.away ?? null,
      golesHTLocal: m.score?.halfTime?.home ?? null,
      golesHTVisitante: m.score?.halfTime?.away ?? null,
      goleadores: m.goals ? m.goals.map(g => `${g.scorer.name} ${g.minute}'`).slice(0, 5) : []
    }));

    // ── Filtrar por fecha placa con lógica de MADRUGADA (función global) ──
    // Partidos entre 00:00 y 03:59 AM hora Argentina se agrupan con el día ANTERIOR.
    // Ejemplo: Austria vs Jordania a las 01:00 del 17/06 → aparece en la placa del 16/06

    // Asignar metadata de madrugada a cada partido
    partidos.forEach(p => {
      const info = calcularFechaPlaca(p.horaUTC);
      p._fechaPlaca = info.fechaPlaca;
      p._esMadrugada = info.esMadrugada;
    });

    // Filtrar por fecha placa (no fecha calendario estricta)
    const partidosDelDia = partidos.filter(p => p._fechaPlaca === fechaBase);

    // ── ENRIQUECER CON SEDES (estadio/ciudad) desde Zafronix ──
    // Buscar en Zafronix matches los estadios para partidos que no tienen venue
    try {
      if (env.ZAFRONIX_KEY) {
        const cacheKey = 'mundial:zafronix:matches:2026';
        let zMatches = null;
        if (env.KV) {
          const cached = await env.KV.get(cacheKey, 'json');
          if (cached && cached.matches) zMatches = cached.matches;
        }
        if (!zMatches) {
          const zRes = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
            headers: { 'X-API-Key': env.ZAFRONIX_KEY }
          });
          if (zRes.ok) {
            const zData = await zRes.json();
            zMatches = zData.data || [];
            if (env.KV) await env.KV.put(cacheKey, JSON.stringify({ matches: zMatches, _cachedAt: Date.now() }), { expirationTtl: 21600 });
          }
        }
        if (zMatches && zMatches.length > 0) {
          partidosDelDia.forEach(p => {
            const home = normalizeTeamName(p._homeRaw || '');
            const away = normalizeTeamName(p._awayRaw || '');
            if (!home || !away) return;
            const found = zMatches.find(m => {
              const mh = normalizeTeamName(m.homeTeam || '');
              const ma = normalizeTeamName(m.awayTeam || '');
              return (mh === home && ma === away) || (mh === away && ma === home);
            });
            if (found) {
              if (!p.estadio) p.estadio = found.stadium || '';
              if (!p.ciudad) p.ciudad = found.city || '';
            }
          });
        }
      }
    } catch(zErr) { /* silencioso */ }

    // Exponer madugada como campo público y limpiar internos
    partidosDelDia.forEach(p => {
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

// ============================================================
// BLOQUE 1b: API-FOOTBALL (api-sports.io) — FUENTE COMPLEMENTARIA
// ============================================================

const API_FOOTBALL_URL = "https://v3.football.api-sports.io";

// Traducir nombre de equipo de API-Football (puede venir en inglés o español)
function traducirPaisAPIFootball(nombre) {
  // Reutilizar el mismo mapa de traducciones
  return traducirPais(nombre);
}

// Obtener partidos desde API-Football por fecha
async function obtenerPartidosAPIFootball(env, fecha) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return { error: "API-Football key no configurada" };
  }

  try {
    // Fecha dinámica en zona horaria Argentina (UTC-3)
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoy = ahoraAR.toISOString().split('T')[0];
    const fechaBase = fecha || hoy;

    // ── CACHE: toda la temporada en KV (dinámica: 12h normal, 2 min si hay en vivo/recién terminados) ──
    const seasonCacheKey = 'mundial:season:2026';
    let allFixtures = null;
    try {
      if (env.KV) {
        const raw = await env.KV.get(seasonCacheKey, 'json');
        if (raw && raw.fixtures && raw.fixtures.length > 0) {
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          // Detectar partidos en vivo O recién terminados del día
          const hayEnVivo = raw.fixtures.some(f => {
            try {
              const fDate = new Date(f.fixture.date);
              const arDate = new Date(fDate.getTime() - 3 * 60 * 60 * 1000);
              const fDay = arDate.toISOString().split('T')[0];
              const st = f.fixture.status.short;
              // En vivo o recién terminados (FT/AET/PEN) del día actual
              return fDay === fechaBase && (
                st === '1H' || st === '2H' || st === 'HT' || st === 'LIVE' || st === 'ET' || st === 'P' ||
                st === 'FT' || st === 'AET' || st === 'PEN'
              );
            } catch(e) { return false; }
          });
          // Si hay en vivo o terminados hoy: refrescar cada 2 min para obtener status/goles actualizados
          const maxAge = hayEnVivo ? 2 * 60 * 1000 : 12 * 60 * 60 * 1000;
          if (cacheAge < maxAge) {
            allFixtures = raw.fixtures;
          }
        }
      }
    } catch (cacheErr) { /* ignorar */ }

    // Si no hay cache, llamar a la API por TODA la temporada (1 request)
    if (!allFixtures) {
      const url = `${API_FOOTBALL_URL}/fixtures?league=1&season=2026`;
      let res;
      try {
        res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
      } catch (fetchErr) {
        return { error: `Error de conexión API-Football: ${fetchErr.message}`, _debug: { step: 'fetch' } };
      }

      const rawText = await res.text();
      let data;
      try { data = JSON.parse(rawText); } catch(e) {
        return { error: 'Error parseando respuesta', _debug: { step: 'parse', status: res.status, body: rawText.substring(0, 500) } };
      }

      // Debug info que siempre se incluye
      const debugInfo = {
        status: res.status,
        url: url,
        response_count: data.response?.length ?? 'null/undefined',
        results_field: data.results,
        errors_field: data.errors,
        raw_keys: Object.keys(data),
        raw_response_sample: Array.isArray(data.response) ? data.response.slice(0, 1) : data.response,
      };

      if (!res.ok) {
        return { error: `Error API-Football: ${res.status}`, _debug: debugInfo };
      }

      // Detectar rate limit
      if (data.errors && (data.errors.rateLimit || data.errors.Requests)) {
        return { error: 'Rate limit API-Football: esperá unos minutos', _debug: debugInfo };
      }

      if (!data.response || data.response.length === 0) {
        return { partidos: [], fecha: fechaBase, mensaje: 'API-Football no devolvió partidos', _debug: debugInfo };
      }

      // Guardar TODOS los fixtures en cache
      allFixtures = data.response;
      try {
        if (env.KV) {
          await env.KV.put(seasonCacheKey, JSON.stringify({
            fixtures: allFixtures,
            _cachedAt: Date.now(),
            _count: allFixtures.length
          }), { expirationTtl: 43200 }); // 12 horas
        }
      } catch(e) { /* ignorar */ }
    }

    // ── Filtrar localmente por fecha placa (con lógica de madrugada) ──
    const partidosDelDia = allFixtures.filter(f => {
      try {
        const info = calcularFechaPlaca(f.fixture.date);
        return info.fechaPlaca === fechaBase;
      } catch(e) { return false; }
    });

    const partidos = partidosDelDia.map(f => {
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
      estadio: f.fixture.venue?.name || '',
      ciudad: f.fixture.venue?.city || '',
      grupo: traducirGrupo(f.league?.round) || null,
      arbitro: f.fixture.referee || null,
      golesLocal: f.goals?.home ?? null,
      golesVisitante: f.goals?.away ?? null,
      eventos: [],
      estadisticas: [],
      madugada: infoPlaca.esMadrugada,
    };});

    return { partidos, fecha: fechaBase, fuente: 'api-football', totalSeason: allFixtures.length };
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================
// BLOQUE 1c: THESPORTSDB — FUENTE COMPLEMENTARIA (Free tier: 15 eventos/request)
// ============================================================

const THESPORTSDB_URL = 'https://www.thesportsdb.com/api/v1/json';
const THESPORTSDB_LEAGUE_ID = '4429'; // FIFA World Cup

// Mapeo de estados TheSportsDB → estados internos
function traducirEstadoTSDB(status) {
  const mapa = {
    'NS': 'SCHEDULED', 'TBD': 'SCHEDULED',
    '1H': 'IN_PLAY', '2H': 'IN_PLAY', 'HT': 'IN_PLAY', 'ET': 'IN_PLAY', 'P': 'IN_PLAY', 'LIVE': 'IN_PLAY',
    'FT': 'FINISHED', 'AET': 'FINISHED', 'PEN': 'FINISHED',
    'PST': 'POSTPONED', 'CANC': 'CANCELLED',
  };
  return mapa[status] || status || 'SCHEDULED';
}

async function obtenerPartidosTheSportsDB(env, fecha) {
  const apiKey = env.THESPORTSDB_KEY || '3'; // '3' = free public key

  try {
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoy = ahoraAR.toISOString().split('T')[0];
    const fechaBase = fecha || hoy;

    // ── CACHE KV: temporada completa (dinámica: 12h normal, 2 min si hay en vivo) ──
    const cacheKey = 'mundial:tsdb:2026';
    let allEvents = [];
    let cachedIds = new Set();

    try {
      if (env.KV) {
        const raw = await env.KV.get(cacheKey, 'json');
        if (raw && raw.events && raw.events.length > 0) {
          allEvents = raw.events;
          raw.events.forEach(e => cachedIds.add(e.idEvent));
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          // Detectar partidos en vivo
          const hayEnVivo = raw.events.some(ev => {
            try {
              const evDate = new Date(ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z'));
              const arDate = new Date(evDate.getTime() - 3 * 60 * 60 * 1000);
              const evDay = arDate.toISOString().split('T')[0];
              const st = ev.strStatus;
              return evDay === fechaBase && (st === '1H' || st === '2H' || st === 'HT' || st === 'LIVE' || st === 'ET' || st === 'P');
            } catch(e) { return false; }
          });
          const maxAge = hayEnVivo ? 2 * 60 * 1000 : 12 * 60 * 60 * 1000;
          // Si cache tiene menos de maxAge y ya tiene bastantes eventos, usar cache
          if (cacheAge < maxAge && allEvents.length >= 48) {
            return filtrarTSDBPorFecha(allEvents, fechaBase);
          }
        }
      }
    } catch (cacheErr) { /* ignorar */ }

    // ── API CALL: pedir eventos de la temporada ──
    const url = `${THESPORTSDB_URL}/${apiKey}/eventsseason.php?id=${THESPORTSDB_LEAGUE_ID}&s=2026`;
    let res;
    try {
      res = await fetch(url);
    } catch (fetchErr) {
      if (allEvents.length > 0) return filtrarTSDBPorFecha(allEvents, fechaBase);
      return { error: `Error conexión TheSportsDB: ${fetchErr.message}` };
    }

    if (!res.ok) {
      if (allEvents.length > 0) return filtrarTSDBPorFecha(allEvents, fechaBase);
      return { error: `Error TheSportsDB: ${res.status}` };
    }

    const data = await res.json();
    const newEvents = data.events || [];

    // Merge: agregar eventos nuevos al cache (acumular más de 15)
    let added = 0;
    for (const ev of newEvents) {
      if (!cachedIds.has(ev.idEvent)) {
        allEvents.push(ev);
        cachedIds.add(ev.idEvent);
        added++;
      }
    }

    // Guardar en cache (acumulativo)
    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          events: allEvents,
          _cachedAt: Date.now(),
          _count: allEvents.length
        }), { expirationTtl: 43200 }); // 12 horas
      }
    } catch(e) { /* ignorar */ }

    return filtrarTSDBPorFecha(allEvents, fechaBase);
  } catch (err) {
    return { error: err.message };
  }
}

// Filtrar eventos TheSportsDB por fecha placa (con lógica de madrugada)
function filtrarTSDBPorFecha(events, fechaBase) {
  const partidosDelDia = events.filter(ev => {
    if (!ev.strTimestamp && !ev.dateEvent) return false;
    try {
      const utcDate = new Date(ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z'));
      const info = calcularFechaPlaca(utcDate.toISOString());
      return info.fechaPlaca === fechaBase;
    } catch(e) { return false; }
  });

  const partidos = partidosDelDia.map(ev => {
    const utcDate = new Date(ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z'));
    const infoPlaca = calcularFechaPlaca(utcDate.toISOString());
    return {
    id: ev.idEvent,
    local: traducirPais(ev.strHomeTeam),
    visitante: traducirPais(ev.strAwayTeam),
    banderaLocal: getFlagPais(ev.strHomeTeam),
    banderaVisitante: getFlagPais(ev.strAwayTeam),
    hora: formatearHora(ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z')),
    horaUTC: ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00')),
    estado: traducirEstadoTSDB(ev.strStatus),
    estadio: ev.strVenue || '',
    ciudad: ev.strCountry || '',
    competicion: ev.strLeague || '',
    grupo: null,
    etapa: ev.strCircuit || null,
    jornada: null,
    arbitro: null,
    golesLocal: ev.intHomeScore !== null && ev.intHomeScore !== undefined ? parseInt(ev.intHomeScore) : null,
    golesVisitante: ev.intAwayScore !== null && ev.intAwayScore !== undefined ? parseInt(ev.intAwayScore) : null,
    golesHTLocal: null,
    golesHTVisitante: null,
    goleadores: [],
    eventos: [],
    estadisticas: [],
    // Extras de TheSportsDB
    badgeLocal: ev.strHomeTeamBadge || null,
    badgeVisitante: ev.strAwayTeamBadge || null,
    poster: ev.strPoster || null,
    madugada: infoPlaca.esMadrugada,
  };});

  return { partidos, fecha: fechaBase, fuente: 'thesportsdb', totalSeason: events.length };
}

// ============================================================
// BLOQUE 1d: ZAFRONIX WC API — ENRIQUECIMIENTO MUNDIAL
// ============================================================

const ZAFRONIX_URL = 'https://api.zafronix.com/fifa/worldcup/v1';
const KG_URL = 'https://kgsearch.googleapis.com/v1/entities:search';

// Obtener tabla de posiciones del Mundial 2026 vía Zafronix
async function obtenerPosicionesZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null; // silently skip if no key

  try {
    // Cache KV: 10 min durante torneo, 1h fuera de torneo
    const cacheKey = 'mundial:zafronix:standings:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 10 * 60 * 1000)) {
        return cached;
      }
    }

    const res = await fetch(`${ZAFRONIX_URL}/standings?year=2026`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.groups) return null;

    const grupos = {};
    Object.entries(data.groups).forEach(([letra, equipos]) => {
      grupos[letra] = equipos.map(eq => ({
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
        clasificado: eq.advanced || false,
      }));
    });

    const resultado = { grupos, fuente: 'zafronix' };

    // Guardar cache
    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 3600 });
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix standings error:', err.message);
    return null;
  }
}

// Obtener goleadores del Mundial 2026 agregando goles desde partidos terminados (Zafronix)
async function obtenerGoleadoresZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;

  try {
    const cacheKey = 'mundial:zafronix:topscorers:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 30 * 60 * 1000)) {
        return cached;
      }
    }

    // Obtener todos los partidos desde Zafronix
    const matchesCacheKey = 'mundial:zafronix:matches:2026';
    let zMatches = null;

    if (env.KV) {
      const cached = await env.KV.get(matchesCacheKey, 'json');
      if (cached && cached.matches) zMatches = cached.matches;
    }

    if (!zMatches) {
      const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
        headers: { 'X-API-Key': apiKey }
      });
      if (!res.ok) return null;
      const data = await res.json();
      // Intentar múltiples formatos de respuesta
      if (Array.isArray(data)) zMatches = data;
      else if (data.matches && Array.isArray(data.matches)) zMatches = data.matches;
      else if (data.data && Array.isArray(data.data)) zMatches = data.data;
      else if (data.results && Array.isArray(data.results)) zMatches = data.results;
      else if (data.fixtures && Array.isArray(data.fixtures)) zMatches = data.fixtures;
    }

    if (!zMatches || !Array.isArray(zMatches)) return null;

    // Filtrar solo partidos terminados (Zafronix usa "finished" en minúsculas)
    const finished = zMatches.filter(m => {
      const status = (m.status || m.state || '').toString().toLowerCase();
      return ['ft', 'finished', 'aet', 'pen', 'ended', 'complete', 'completed', 'final'].includes(status);
    });

    if (finished.length === 0) return null;

    // Agregar goles por jugador
    const golesPorJugador = {};

    for (const match of finished) {
      // Zafronix puede devolver homeTeam como string o como objeto
      const homeTeam = typeof match.homeTeam === 'string' ? match.homeTeam : (match.homeTeam?.name || match.home || '');
      const awayTeam = typeof match.awayTeam === 'string' ? match.awayTeam : (match.awayTeam?.name || match.away || '');

      // Procesar goles (Zafronix usa array `goals` con {player, team:"home"/"away", minute})
      const goals = match.goals || [];

      for (const goal of goals) {
        // Limpiar nombre: quitar minutos y detalles (ej: "Havertz 45+5' pen" → "Havertz")
        let player = (goal.player || goal.scorer || goal.name || '').toString();
        player = player.replace(/\s+\d+[\+\d]*'\s*(pen|og|agg)?$/i, '').trim();

        // team puede ser "home"/"away" → resolver al nombre real
        const teamRaw = (goal.team || '').toString().toLowerCase();
        const team = teamRaw === 'home' ? homeTeam : (teamRaw === 'away' ? awayTeam : goal.team || '');

        if (!player) continue;

        const key = `${player}|||${team}`;
        if (!golesPorJugador[key]) {
          const equipoTraducido = traducirPais(team);
          golesPorJugador[key] = {
            nombre: player,
            equipo: equipoTraducido,
            bandera: getFlagPais(equipoTraducido) || getFlagPais(team),
            goles: 0,
            asistencias: 0,
            partidos: 0,
          };
        }
        golesPorJugador[key].goles++;
      }
    }

    // Convertir a array y ordenar por goles descendente
    const goleadores = Object.values(golesPorJugador)
      .sort((a, b) => b.goles - a.goles)
      .slice(0, 10);

    if (golesPorJugador.length === 0) return null;

    const resultado = { goleadores, fuente: 'zafronix-aggregated' };

    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 3600 });
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix aggregated topscorers error:', err.message);
    return null;
  }
}

// Obtener bracket de eliminación directa vía Zafronix
async function obtenerBracketZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;

  try {
    const cacheKey = 'mundial:zafronix:bracket:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 10 * 60 * 1000)) {
        return cached;
      }
    }

    const res = await fetch(`${ZAFRONIX_URL}/bracket?year=2026`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.stages) return null;

    const etapas = {};
    const stageNames = {
      'round_of_32': 'Ronda de 32',
      'round_of_16': 'Octavos de Final',
      'quarter_final': 'Cuartos de Final',
      'semi_final': 'Semifinales',
      'third_place': 'Tercer Puesto',
      'final': 'Final'
    };

    Object.entries(data.stages).forEach(([stage, matches]) => {
      etapas[stageNames[stage] || stage] = matches.map(m => ({
        id: m.matchId,
        local: m.home ? traducirPais(m.home) : (m.homeRef || 'TBD'),
        visitante: m.away ? traducirPais(m.away) : (m.awayRef || 'TBD'),
        golesLocal: m.homeScore,
        golesVisitante: m.awayScore,
        estadio: m.stadium || '',
        ciudad: m.city || '',
        horaUTC: m.kickoffUtc || null,
        ganador: m.winner ? traducirPais(m.winner) : null,
      }));
    });

    const resultado = { etapas, fuente: 'zafronix' };

    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 3600 });
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix bracket error:', err.message);
    return null;
  }
}

// Obtener planteles del Mundial 2026 vía Zafronix
async function obtenerPlantelesZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;

  try {
    const cacheKey = 'mundial:zafronix:teams:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 6 * 60 * 60 * 1000)) {
        return cached;
      }
    }

    const res = await fetch(`${ZAFRONIX_URL}/teams?tournament=2026`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const equipos = {};
    data.forEach(team => {
      const nombre = traducirPais(team.name);
      equipos[nombre] = {
        nombre,
        bandera: getFlagPais(team.name),
        grupo: team.group || null,
        jugadores: (team.roster || []).map(j => ({
          numero: j.jersey,
          nombre: j.name,
          posicion: j.position,
          club: j.club?.name || '',
          goles: j.goals || 0,
          capitan: j.captain || false,
        })),
      };
    });

    const resultado = { equipos, fuente: 'zafronix' };

    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 21600 }); // 6 horas
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix teams error:', err.message);
    return null;
  }
}

// Obtener estadios del Mundial 2026 vía Zafronix
async function obtenerEstadiosZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;

  try {
    const cacheKey = 'mundial:zafronix:stadiums:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached) return cached; // Estadios no cambian
    }

    const res = await fetch(`${ZAFRONIX_URL}/stadiums?tournament=2026`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.data) return null;

    const estadios = data.data.map(s => ({
      id: s.id,
      nombre: s.name,
      nombreFIFA: s.fifaNames?.['2026'] || s.name,
      ciudad: s.city,
      pais: s.country,
      capacidad: s.capacity,
      coordenadas: s.coords || null,
      altitud: s.elevationM || null,
    }));

    const resultado = { estadios, fuente: 'zafronix' };

    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 86400 }); // 24 horas
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix stadiums error:', err.message);
    return null;
  }
}

// Enriquecer partidos con datos de estadios Zafronix
async function enriquecerConEstadios(env, partidos) {
  const estadiosData = await obtenerEstadiosZafronix(env);
  if (!estadiosData || !estadiosData.estadios) return partidos;

  // Crear mapa por nombre de estadio (búsqueda flexible)
  const estadioMap = {};
  estadiosData.estadios.forEach(e => {
    estadioMap[e.nombre.toLowerCase()] = e;
    if (e.nombreFIFA !== e.nombre) estadioMap[e.nombreFIFA.toLowerCase()] = e;
  });

  return partidos.map(p => {
    if (p.estadio && p.estadio !== 'TBD') {
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

// ============================================================
// BLOQUE 1e: GOOGLE KNOWLEDGE GRAPH — EQUIPOS/ESTADIOS/CIUDADES
// ============================================================

// Buscar entidad en Knowledge Graph
async function buscarKG(env, query, types = []) {
  if (!env.KG_KEY) return null;
  const cacheKey = `kg:${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  try {
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 24 * 60 * 60 * 1000)) {
        return cached.data;
      }
    }

    const params = new URLSearchParams({
      query,
      key: env.KG_KEY,
      limit: '1',
      indent: 'true'
    });
    if (types.length > 0) params.append('types', types.join(','));

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
      type: item['@type'] || [],
    };

    if (env.KV) {
      await env.KV.put(cacheKey, JSON.stringify({
        data: result, _cachedAt: Date.now()
      }), { expirationTtl: 86400 }); // 24h cache for static data
    }

    return result;
  } catch (e) {
    return null;
  }
}

// Enriquecer partidos con datos de Knowledge Graph (equipos, estadios, ciudades)
async function enriquecerConKnowledgeGraph(env, partidos) {
  if (!env.KG_KEY) return partidos;

  for (const p of partidos) {
    // Enriquecer equipo local
    if (p.local && !p.localKG) {
      const query = `${p.local} national football team`;
      const kgData = await buscarKG(env, query, ['SportsTeam']);
      if (kgData) p.localKG = kgData;
    }

    // Enriquecer equipo visitante
    if (p.visitante && !p.visitanteKG) {
      const query = `${p.visitante} national football team`;
      const kgData = await buscarKG(env, query, ['SportsTeam']);
      if (kgData) p.visitanteKG = kgData;
    }

    // Enriquecer estadio
    if (p.estadio && p.estadio !== 'TBD' && !p.estadioKG) {
      const kgData = await buscarKG(env, p.estadio, ['Stadium', 'Place']);
      if (kgData) p.estadioKG = kgData;
    }

    // Enriquecer ciudad
    if (p.ciudad && !p.ciudadKG) {
      const kgData = await buscarKG(env, `${p.ciudad} Mexico`, ['City', 'Place']);
      if (kgData) p.ciudadKG = kgData;
    }
  }

  return partidos;
}

// ============================================================
// BLOQUE 1d: ZAFRONIX ENRICHMENT — GOLES/EVENTOS/LINEUPS/CARDS
// ============================================================

// Enriquecer partidos con datos completos de Zafronix (reemplaza API-Football para WC2026)
async function enriquecerConZafronix(env, partidos) {
  if (!env.ZAFRONIX_KEY) return partidos;

  // Fetch all WC2026 matches from Zafronix
  let zMatches = null;
  const cacheKey = 'mundial:zafronix:matches:2026';

  try {
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && cached.matches && (Date.now() - (cached._cachedAt || 0) < 5 * 60 * 1000)) {
        zMatches = cached.matches;
      }
    }

    if (!zMatches) {
      const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
        headers: { 'X-API-Key': env.ZAFRONIX_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        zMatches = data.data || [];
        if (env.KV && zMatches.length > 0) {
          await env.KV.put(cacheKey, JSON.stringify({
            matches: zMatches, _cachedAt: Date.now()
          }), { expirationTtl: 300 }); // 5 min cache for live data
        }
      }
    }
  } catch(e) { return partidos; }

  if (!zMatches || zMatches.length === 0) return partidos;

  // Match and enrich each partido (list endpoint - basic info)
  partidos.forEach(p => {
    const pHome = normalizeTeamName(p._homeRaw || p.local || '');
    const pAway = normalizeTeamName(p._awayRaw || p.visitante || '');
    if (!pHome || !pAway) return;

    const found = zMatches.find(m => {
      const mh = normalizeTeamName(m.homeTeam || '');
      const ma = normalizeTeamName(m.awayTeam || '');
      return (mh === pHome && ma === pAway) || (mh === pAway && ma === pHome);
    });

    if (!found) return;

    // Guardar ID de Zafronix para llamada de detalle
    p._zafronixId = found.id;

    // Basic info (stadium, city, referee)
    if (found.stadium && !p.estadio) p.estadio = found.stadium;
    if (found.city && !p.ciudad) p.ciudad = found.city;
    if (found.referee) {
      p.arbitro = typeof found.referee === 'object' ? (found.referee.name || '') : found.referee;
    }
    if (found.attendance) p.asistencia = found.attendance;

    // Status mapping
    if (found.status === 'finished' || found.status === 'full_time' || found.status === 'aet' || found.status === 'penalties' ||
        (found.homeScore !== null && found.homeScore !== undefined && found.awayScore !== null && found.awayScore !== undefined && !found.liveMinute)) {
      if (p.estado === 'TIMED' || p.estado === 'SCHEDULED') {
        p.estado = 'FINISHED';
      }
    } else if (found.status === 'in_play' || found.status === 'live' || found.liveMinute) {
      if (p.estado === 'TIMED' || p.estado === 'SCHEDULED') {
        p.estado = 'IN_PLAY';
      }
      p.minutoLive = found.liveMinute || null;
    }

    // Scores
    if (found.homeScore !== null && found.homeScore !== undefined) {
      p.golesLocal = found.homeScore;
    }
    if (found.awayScore !== null && found.awayScore !== undefined) {
      p.golesVisitante = found.awayScore;
    }

    // Goals/Goalscorers from list endpoint (usually null for 2026)
    if (found.goals && Array.isArray(found.goals) && found.goals.length > 0) {
      p._zafronixHasGoals = true;
      p.goleadores = found.goals.map(g => {
        const player = g.player || g.name || g.scorer || '';
        const minute = g.minute || g.time || '';
        return `${player} ${minute}'`;
      }).slice(0, 8);

      if (!p.eventos) p.eventos = [];
      found.goals.forEach(g => {
        p.eventos.push({
          tipo: 'Goal',
          minuto: g.minute || g.time || null,
          jugador: g.player || g.name || g.scorer || '',
          equipo: g.team || '',
          detalle: g.type || null,
        });
      });
    }

    // Cards
    if (found.cards && Array.isArray(found.cards) && found.cards.length > 0) {
      if (!p.eventos) p.eventos = [];
      found.cards.forEach(c => {
        p.eventos.push({
          tipo: 'Card',
          minuto: c.minute || c.time || null,
          jugador: c.player || c.name || '',
          equipo: c.team || '',
          detalle: c.card || c.type || null,
        });
      });
    }

    // Substitutions
    if (found.substitutions && Array.isArray(found.substitutions) && found.substitutions.length > 0) {
      if (!p.eventos) p.eventos = [];
      found.substitutions.forEach(s => {
        p.eventos.push({
          tipo: 'subst',
          minuto: s.minute || s.time || null,
          jugador: s.playerIn || s.in || '',
          equipo: s.team || '',
          detalle: `Sale: ${s.playerOut || s.out || ''}`,
        });
      });
    }

    // Lineups and formations
    if (found.lineups) {
      if (found.lineups.home && Array.isArray(found.lineups.home) && found.lineups.home.length > 0) {
        p.formacionLocal = {
          formacion: found.formations?.home || null,
          jugadores: found.lineups.home.map(pl => pl.name || pl.player || pl).slice(0, 11),
        };
      }
      if (found.lineups.away && Array.isArray(found.lineups.away) && found.lineups.away.length > 0) {
        p.formacionVisitante = {
          formacion: found.formations?.away || null,
          jugadores: found.lineups.away.map(pl => pl.name || pl.player || pl).slice(0, 11),
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

  // ── DETAIL CALLS: Fetch per-match enrichment (goals, events) for finished/live matches ──
  const needDetail = partidos.filter(p =>
    p._zafronixId && !p._zafronixHasGoals &&
    (p.estado === 'FINISHED' || p.estado === 'IN_PLAY' || p.estado === 'FT' || p.estado === 'AET' || p.estado === 'PEN')
  );

  for (const p of needDetail) {
    try {
      const detailCacheKey = `zafronix:match:${p._zafronixId}`;
      let detail = null;

      // Check cache first
      if (env.KV) {
        const cached = await env.KV.get(detailCacheKey, 'json');
        const ttl = (p.estado === 'FINISHED' || p.estado === 'FT') ? 3600 : 120;
        if (cached && (Date.now() - (cached._cachedAt || 0) < ttl * 1000)) {
          detail = cached;
        }
      }

      if (!detail) {
        const detRes = await fetch(`${ZAFRONIX_URL}/matches/${p._zafronixId}`, {
          headers: { 'X-API-Key': env.ZAFRONIX_KEY }
        });
        if (detRes.ok) {
          detail = await detRes.json();
          if (env.KV && detail) {
            const ttl = (p.estado === 'FINISHED' || p.estado === 'FT') ? 3600 : 120;
            await env.KV.put(detailCacheKey, JSON.stringify({
              ...detail, _cachedAt: Date.now()
            }), { expirationTtl: ttl });
          }
        }
      }

      if (detail) {
        // Goals from detail endpoint
        if (detail.goals && Array.isArray(detail.goals) && detail.goals.length > 0) {
          p.goleadores = detail.goals.map(g => {
            const player = g.player || g.name || g.scorer || '';
            const minute = g.minute || g.time || '';
            return `${player} ${minute}'`;
          }).slice(0, 8);

          if (!p.eventos) p.eventos = [];
          detail.goals.forEach(g => {
            p.eventos.push({
              tipo: 'Goal',
              minuto: g.minute || g.time || null,
              jugador: g.player || g.name || g.scorer || '',
              equipo: g.team || '',
              detalle: g.type || g.bodyPart || null,
            });
          });
        }

        // Cards from detail
        if (detail.cards && Array.isArray(detail.cards) && detail.cards.length > 0) {
          if (!p.eventos) p.eventos = [];
          detail.cards.forEach(c => {
            p.eventos.push({
              tipo: 'Card', minuto: c.minute || c.time || null,
              jugador: c.player || c.name || '', equipo: c.team || '',
              detalle: c.card || c.type || null,
            });
          });
        }

        // Substitutions from detail
        if (detail.substitutions && Array.isArray(detail.substitutions) && detail.substitutions.length > 0) {
          if (!p.eventos) p.eventos = [];
          detail.substitutions.forEach(s => {
            p.eventos.push({
              tipo: 'subst', minuto: s.minute || s.time || null,
              jugador: s.playerIn || s.in || '', equipo: s.team || '',
              detalle: `Sale: ${s.playerOut || s.out || ''}`,
            });
          });
        }

        // Lineups from detail
        if (detail.lineups) {
          if (detail.lineups.home && Array.isArray(detail.lineups.home) && detail.lineups.home.length > 0) {
            p.formacionLocal = {
              formacion: detail.formations?.home || null,
              jugadores: detail.lineups.home.map(pl => pl.name || pl.player || pl).slice(0, 11),
            };
          }
          if (detail.lineups.away && Array.isArray(detail.lineups.away) && detail.lineups.away.length > 0) {
            p.formacionVisitante = {
              formacion: detail.formations?.away || null,
              jugadores: detail.lineups.away.map(pl => pl.name || pl.player || pl).slice(0, 11),
            };
          }
        }

        // Weather
        if (detail.weather) p.weather = detail.weather;
        // Captains
        if (detail.captains) p.capitanes = detail.captains;
      }

      // Small delay between detail calls
      await sleep(80);
    } catch(e) {
      console.error(`Error fetching Zafronix detail for ${p._zafronixId}:`, e.message);
    }
  }

  // ── SANITY CHECK: Validate goleadores count vs actual score ──
  partidos.forEach(p => {
    if (p.goleadores && p.goleadores.length > 0 && p.golesLocal !== null && p.golesVisitante !== null) {
      const totalGoals = (p.golesLocal || 0) + (p.golesVisitante || 0);
      if (p.goleadores.length > totalGoals && totalGoals >= 0) {
        // Goleadores count exceeds actual score — likely fake data, discard
        p._goleadoresOriginales = p.goleadores;
        p.goleadores = [];
        p._goleadoresDescartados = true;
      }
    }
  });

  return partidos;
}

// ============================================================
// BLOQUE 1e: API-FOOTBALL DETAIL CACHE — EVENTOS/FORMACIONES
// ============================================================

// Obtener eventos y formaciones de partidos terminados (batch, con cache)
async function enriquecerEventosAPIFootball(env, partidos) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return partidos;

  // Solo enriquecer partidos terminados o en vivo
  const elegibles = partidos.filter(p => {
    const estado = p.estado;
    return estado === 'FINISHED' || estado === 'IN_PLAY' || estado === 'FT' || estado === 'AET' || estado === 'PEN';
  });

  if (elegibles.length === 0) return partidos;

  // Limitar a 4 partidos por batch para no quemar requests (4 partidos × 1 req = 4 requests)
  const batch = elegibles.slice(0, 4);

  for (const partido of batch) {
    // Usar afFixtureId (ID de API-Football) si existe, sino intentar con el ID genérico
    const fixtureId = partido.afFixtureId || partido.id;
    if (!fixtureId) continue;

    try {
      // Cache KV para eventos por fixture
      const cacheKey = `mundial:af:detail:${fixtureId}`;
      if (env.KV) {
        const cached = await env.KV.get(cacheKey, 'json');
        if (cached && cached.eventos) {
          partido.eventos = cached.eventos;
          partido.formacionLocal = cached.formacionLocal || null;
          partido.formacionVisitante = cached.formacionVisitante || null;
          partido.estadisticas = cached.estadisticas || [];
          partido.goleadores = cached.goleadores || partido.goleadores || [];
          continue;
        }
      }

      // Llamar al endpoint de detalle (1 request = eventos + formaciones + stats)
      const detalle = await obtenerDetallePartidoAPIFootball(env, fixtureId);
      if (detalle && !detalle.error) {
        partido.eventos = detalle.eventos || [];
        partido.formacionLocal = detalle.formacionLocal || null;
        partido.formacionVisitante = detalle.formacionVisitante || null;
        partido.estadisticas = detalle.estadisticas || [];

        // Extraer goleadores de eventos de tipo "Goal"
        if (detalle.eventos && detalle.eventos.length > 0) {
          partido.goleadores = detalle.eventos
            .filter(e => e.tipo === 'Goal')
            .map(e => `${e.jugador} ${e.minuto}'`)
            .slice(0, 5);
        }

        // Cache por 2 horas (partidos terminados no cambian)
        try {
          if (env.KV) {
            const ttl = (partido.estado === 'FINISHED' || partido.estado === 'FT') ? 7200 : 120;
            await env.KV.put(cacheKey, JSON.stringify({
              eventos: partido.eventos,
              formacionLocal: partido.formacionLocal,
              formacionVisitante: partido.formacionVisitante,
              estadisticas: partido.estadisticas,
              goleadores: partido.goleadores,
              _cachedAt: Date.now(),
            }), { expirationTtl: ttl });
          }
        } catch(e) { /* ignorar */ }
      }

      // Pequeña pausa para no saturar la API
      await sleep(100);
    } catch(e) {
      console.error(`Error enriqueciendo partido ${fixtureId}:`, e.message);
    }
  }

  return partidos;
}

// Obtener detalle enriquecido de un partido (eventos, formaciones, stats)
async function obtenerDetallePartidoAPIFootball(env, fixtureId) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada" };

  try {
    const [eventsRes, lineupsRes, statsRes] = await Promise.all([
      fetch(`${API_FOOTBALL_URL}/fixtures/events?fixture=${fixtureId}`, { headers: { 'x-apisports-key': apiKey } }),
      fetch(`${API_FOOTBALL_URL}/fixtures/lineups?fixture=${fixtureId}`, { headers: { 'x-apisports-key': apiKey } }),
      fetch(`${API_FOOTBALL_URL}/fixtures/statistics?fixture=${fixtureId}`, { headers: { 'x-apisports-key': apiKey } }),
    ]);

    const resultado = { eventos: [], formacionLocal: null, formacionVisitante: null, estadisticas: [] };

    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      if (eventsData.response) {
        resultado.eventos = eventsData.response.map(e => ({
          tipo: e.type,           // Goal, Card, subst
          minuto: e.time?.elapsed,
          equipo: e.team?.name,
          jugador: e.player?.name,
          asistio: e.assist?.name || null,
          detalle: e.detail || null,
        }));
      }
    }

    if (lineupsRes.ok) {
      const lineupsData = await lineupsRes.json();
      if (lineupsData.response && lineupsData.response.length >= 2) {
        resultado.formacionLocal = {
          formacion: lineupsData.response[0].formation,
          jugadores: lineupsData.response[0].startXI?.map(p => p.player?.name) || [],
        };
        resultado.formacionVisitante = {
          formacion: lineupsData.response[1].formation,
          jugadores: lineupsData.response[1].startXI?.map(p => p.player?.name) || [],
        };
      }
    }

    if (statsRes.ok) {
      const statsData = await statsRes.json();
      if (statsData.response) {
        resultado.estadisticas = statsData.response.map(s => ({
          equipo: s.team?.name,
          stats: s.statistics?.map(st => ({ tipo: st.type, valor: st.value })) || [],
        }));
      }
    }

    return resultado;
  } catch (err) {
    return { error: err.message };
  }
}

// Obtener posiciones de grupos del Mundial
async function obtenerPosicionesGrupos(env) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada" };

  try {
    const url = `${API_FOOTBALL_URL}/standings?league=1&season=2026`;
    const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });

    if (!res.ok) return { error: `Error API-Football: ${res.status}` };

    const data = await res.json();
    if (!data.response || data.response.length === 0) return { grupos: [] };

    const grupos = {};
    data.response[0].league.standings.forEach(grupo => {
      const letra = grupo[0]?.group?.replace('Group ', '') || '?';
      grupos[letra] = grupo.map(eq => ({
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
        diferenciaGoles: eq.goalsDiff,
      }));
    });

    return { grupos };
  } catch (err) {
    return { error: err.message };
  }
}

// Obtener goleadores del Mundial
async function obtenerGoleadores(env) {
  // ── Prioridad 1: Zafronix (fuente oficial WC2026) ──
  const zafronix = await obtenerGoleadoresZafronix(env);
  if (zafronix && zafronix.goleadores && zafronix.goleadores.length > 0) {
    return zafronix;
  }

  // ── Prioridad 2: API-Football (fallback) ──
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada y Zafronix sin datos" };

  try {
    const url = `${API_FOOTBALL_URL}/players/topscorers?league=1&season=2026`;
    const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });

    if (!res.ok) return { error: `Error API-Football: ${res.status}` };

    const data = await res.json();
    if (!data.response) return { goleadores: [] };

    const goleadores = data.response.slice(0, 10).map(g => ({
      nombre: g.player?.name,
      equipo: traducirPais(g.statistics?.[0]?.team?.name),
      bandera: getFlagPais(g.statistics?.[0]?.team?.name),
      goles: g.statistics?.[0]?.goals?.total || 0,
      asistencias: g.statistics?.[0]?.goals?.assists || 0,
      partidos: g.statistics?.[0]?.games?.appearences || 0,
    }));

    return { goleadores, fuente: 'api-football' };
  } catch (err) {
    return { error: err.message };
  }
}

// Traducir estado de API-Football al formato football-data
function traducirEstadoAPIFootball(status) {
  const mapa = {
    'TBD': 'SCHEDULED', 'NS': 'SCHEDULED', 'PND': 'SCHEDULED',
    '1H': 'IN_PLAY', '2H': 'IN_PLAY', 'HT': 'IN_PLAY',
    'ET': 'IN_PLAY', 'BT': 'IN_PLAY', 'P': 'IN_PLAY',
    'SUSP': 'SUSPENDED', 'INT': 'SUSPENDED',
    'FT': 'FINISHED', 'AET': 'FINISHED', 'PEN': 'FINISHED',
    'PST': 'POSTPONED', 'CANC': 'CANCELLED', 'ABD': 'CANCELLED',
    'AWD': 'AWARDED', 'WO': 'AWARDED', 'LIVE': 'IN_PLAY',
  };
  return mapa[status] || status;
}

// Combinar datos de ambas APIs para un partido dado
function combinarDatosPartido(partidoFD, partidoAF) {
  if (!partidoFD && !partidoAF) return null;
  if (!partidoFD) return partidoAF;
  if (!partidoAF) return partidoFD;

  // Usar football-data como base y enriquecer con API-Football
  return {
    ...partidoFD,
    // ID de API-Football para enriquecer con detalle después
    afFixtureId: partidoAF.id || null,
    // Estadio: preferir API-Football si football-data no tiene
    estadio: (partidoFD.estadio && partidoFD.estadio !== 'TBD' && partidoFD.estadio !== '')
      ? partidoFD.estadio
      : (partidoAF.estadio && partidoAF.estadio !== 'TBD' ? partidoAF.estadio : partidoFD.estadio),
    // Campos enriquecidos solo de API-Football
    ciudad: partidoAF.ciudad || null,
    arbitro: partidoAF.arbitro || null,
    formacionLocal: partidoAF.formacionLocal,
    formacionVisitante: partidoAF.formacionVisitante,
    eventos: partidoAF.eventos || [],
    estadisticas: partidoAF.estadisticas || [],
    // Si API-Football tiene grupo mejor formateado, usarlo
    grupo: partidoAF.grupo || partidoFD.grupo,
  };
}

// Obtener partidos combinados de las 3 APIs (football-data + API-Football + TheSportsDB)
async function obtenerPartidosCombinados(env, fecha) {
  const resultados = { partidos: [], fecha: fecha || null, fuentes: [], enriquecido: false };

  // 1) football-data.org (primary - mejor cobertura Mundial 2026)
  const fdResult = await obtenerPartidosMundial(env, 2000, fecha);
  let fdPartidos = [];
  if (!fdResult.error && fdResult.partidos) {
    fdPartidos = fdResult.partidos;
    resultados.fuentes.push('football-data');
    resultados.fecha = fdResult.fecha;
  }

  // 2) API-Football (secundaria - enriquece con eventos/ciudad/arbitro)
  const afResult = await obtenerPartidosAPIFootball(env, fecha);
  let afPartidos = [];
  if (!afResult.error && afResult.partidos) {
    afPartidos = afResult.partidos;
    resultados.fuentes.push('api-football');
    if (!resultados.fecha) resultados.fecha = afResult.fecha;
  }

  // 3) TheSportsDB (terciaria - aporta badges/poster)
  const tsdbResult = await obtenerPartidosTheSportsDB(env, fecha);
  let tsdbPartidos = [];
  if (!tsdbResult.error && tsdbResult.partidos) {
    tsdbPartidos = tsdbResult.partidos;
    resultados.fuentes.push('thesportsdb');
    if (!resultados.fecha) resultados.fecha = tsdbResult.fecha;
  }

  // Si no hay datos de ninguna API
  if (fdPartidos.length === 0 && afPartidos.length === 0 && tsdbPartidos.length === 0) {
    return { ...resultados, mensaje: "Sin partidos para esta fecha" };
  }
  // Si solo hay datos de una API
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

  // Combinar: football-data como base, enriquecer con API-Football y TheSportsDB
  const partidosCombinados = fdPartidos.map(fd => {
    const af = afPartidos.find(a => matchPartidos(a, fd));
    const tsdb = tsdbPartidos.find(t => matchPartidos(t, fd));
    const combined = combinarDatosPartido(fd, af);
    // Enriquecer con TheSportsDB (badges, poster, estadio real)
    if (tsdb) {
      if (tsdb.badgeLocal && !combined.badgeLocal) combined.badgeLocal = tsdb.badgeLocal;
      if (tsdb.badgeVisitante && !combined.badgeVisitante) combined.badgeVisitante = tsdb.badgeVisitante;
      if (tsdb.poster && !combined.poster) combined.poster = tsdb.poster;
      // Preferir estadio real de TheSportsDB sobre nombres genéricos
      if (tsdb.estadio && tsdb.estadio !== 'TBD' && tsdb.estadio !== '') {
        // Solo usar TSDB si el actual es vacío, genérico o viene de Zafronix
        if (!combined.estadio || combined.estadio === '' || combined.estadio === 'TBD' ||
            /stadium/i.test(combined.estadio)) {
          combined.estadio = tsdb.estadio;
        }
      }
    }
    // Preservar _homeRaw/_awayRaw para enriquecimiento Zafronix
    delete combined._localRaw;
    delete combined._visitanteRaw;
    delete combined._fechaPlaca;
    // Exponer madugada como campo público
    combined.madrugada = combined._esMadrugada || false;
    delete combined._esMadrugada;
    return combined;
  });

  // Agregar partidos de API-Football que no estén en football-data (usando matchPartidos con normalización)
  afPartidos.forEach(af => {
    const yaExiste = partidosCombinados.some(p => matchPartidos(p, af));
    if (!yaExiste) {
      // Asegurar madugada flag (ya viene calculada por la API, pero por seguridad)
      if (af.madrugada === undefined && af.horaUTC) {
        af.madrugada = calcularFechaPlaca(af.horaUTC).esMadrugada;
      }
      partidosCombinados.push(af);
    }
  });

  // Agregar partidos de TheSportsDB que no estén en los anteriores (usando matchPartidos con normalización)
  tsdbPartidos.forEach(tsdb => {
    const yaExiste = partidosCombinados.some(p => matchPartidos(p, tsdb));
    if (!yaExiste) {
      if (tsdb.madrugada === undefined && tsdb.horaUTC) {
        tsdb.madrugada = calcularFechaPlaca(tsdb.horaUTC).esMadrugada;
      }
      partidosCombinados.push(tsdb);
    }
  });

  // ── ENRIQUECIMIENTO AVANZADO ──
  // 4) Enriquecer con Zafronix (goles, eventos, lineups, cards, status en vivo)
  await enriquecerConZafronix(env, partidosCombinados);
  if (env.ZAFRONIX_KEY) resultados.fuentes.push('zafronix-events');

  // 5) Enriquecer con eventos/formaciones de API-Football (fallback si Zafronix no tiene datos)
  await enriquecerEventosAPIFootball(env, partidosCombinados);

  // 6) Enriquecer con datos de estadios de Zafronix
  await enriquecerConEstadios(env, partidosCombinados);
  if (env.ZAFRONIX_KEY) resultados.fuentes.push('zafronix');

  // 7) Enriquecer con Google Knowledge Graph (equipos, estadios, ciudades)
  await enriquecerConKnowledgeGraph(env, partidosCombinados);
  if (env.KG_KEY) resultados.fuentes.push('knowledge-graph');

  // Limpiar campos internos después del enriquecimiento
  partidosCombinados.forEach(p => {
    delete p._homeRaw;
    delete p._awayRaw;
  });

  resultados.enriquecido = true;

  // Debug info detallado
  const matched = partidosCombinados.filter(p => p.ciudad || p.arbitro || (p.eventos && p.eventos.length > 0)).length;
  const conEventos = partidosCombinados.filter(p => p.eventos && p.eventos.length > 0).length;
  const conFormacion = partidosCombinados.filter(p => p.formacionLocal || p.formacionVisitante).length;
  resultados.debug = {
    fd_count: fdPartidos.length,
    af_count: afPartidos.length,
    tsdb_count: tsdbPartidos.length,
    matched_count: matched,
    total_combined: partidosCombinados.length,
    con_eventos: conEventos,
    con_formacion: conFormacion,
    // Detalle por partido para diagnóstico
    partidos_detalle: partidosCombinados.map(p => ({
      local: p.local,
      visitante: p.visitante,
      estado: p.estado,
      afFixtureId: p.afFixtureId || null,
      estadio: p.estadio || '(vacío)',
      ciudad: p.ciudad || null,
      arbitro: p.arbitro || null,
      golesLocal: p.golesLocal,
      golesVisitante: p.golesVisitante,
      goleadores: p.goleadores || [],
      eventos_count: (p.eventos || []).length,
      formacionLocal: p.formacionLocal ? true : false,
      formacionVisitante: p.formacionVisitante ? true : false,
    })),
  };

  return { ...resultados, partidos: partidosCombinados };
}

// Helper: normalizar nombres de equipos para comparar entre APIs
function normalizeTeamName(name) {
  if (!name) return '';
  const map = {
    'czech republic': 'czechia', 'czechia': 'czechia', 'cze': 'czechia',
    'south korea': 'south korea', 'korea republic': 'south korea', 'korea': 'south korea', 'south korea': 'south korea', 'kor': 'south korea',
    'united states': 'united states', 'usa': 'united states', 'united states of america': 'united states', 'us': 'united states',
    'ivory coast': 'ivory coast', "côte d'ivoire": 'ivory coast', 'cote divoire': 'ivory coast',
    'democratic republic of congo': 'dr congo', 'dr congo': 'dr congo', 'congo dr': 'dr congo',
    'republic of congo': 'congo', 'congo': 'congo',
    'new zealand': 'new zealand', 'nz': 'new zealand',
    'costa rica': 'costa rica', 'crc': 'costa rica',
    'saudi arabia': 'saudi arabia', 'ksa': 'saudi arabia',
    'south africa': 'south africa', 'rsa': 'south africa',
    'north korea': 'north korea', "dpr korea": 'north korea', 'prk': 'north korea',
    'bosnia and herzegovina': 'bosnia', 'bosnia': 'bosnia', 'bih': 'bosnia',
    'trinidad and tobago': 'trinidad', 'trinidad': 'trinidad', 'tri': 'trinidad',
    'united arab emirates': 'uae', 'uae': 'uae',
    'equatorial guinea': 'equatorial guinea', 'eqg': 'equatorial guinea',
    'cape verde': 'cape verde', 'cpv': 'cape verde',
    'sierra leone': 'sierra leone', 'sle': 'sierra leone',
    'burkina faso': 'burkina faso', 'bfa': 'burkina faso',
  };
  const lower = name.toLowerCase().trim();
  return map[lower] || lower;
}

// Helper: matchear partidos entre APIs por nombre normalizado y hora
function matchPartidos(a, b) {
  const aLocal = normalizeTeamName(a.local || a._localRaw);
  const bLocal = normalizeTeamName(b.local || b._localRaw);
  const aVis = normalizeTeamName(a.visitante || a._visitanteRaw);
  const bVis = normalizeTeamName(b.visitante || b._visitanteRaw);
  // Match por nombres normalizados
  if (aLocal && bLocal && aVis && bVis) {
    if (aLocal === bLocal && aVis === bVis) return true;
    if (aLocal === bVis && aVis === bLocal) return true;
  }
  // Fallback: match exacto original
  if (a.local === b.local && a.visitante === b.visitante) return true;
  if (a.local === b.visitante && a.visitante === b.local) return true;
  // Match por hora cercana (misma fecha, <90min) + al menos un equipo similar
  try {
    const tA = new Date(a.horaUTC).getTime();
    const tB = new Date(b.horaUTC).getTime();
    if (Math.abs(tA - tB) < 90 * 60 * 1000) {
      // Si la hora es cercana Y al menos un equipo coincide normalizado
      if (aLocal && bLocal && (aLocal === bLocal || aVis === bVis)) return true;
    }
  } catch(e) {}
  return false;
}

// ============================================================
// BLOQUE 2️⃣: FUNCIÓN PLACA MAÑANA
// ============================================================

async function handleMundialManana(env) {
  try {
    const resultado = await obtenerPartidosMundial(env, 2000);
    
    if (resultado.error) {
      return new Response(JSON.stringify({ok:false,error:resultado.error}),{status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }

    if (!resultado.partidos || resultado.partidos.length === 0) {
      return new Response(JSON.stringify({
        ok:true,
        tipo:"mañana",
        fecha:resultado.fecha,
        partidos:[],
        mensaje:"No hay partidos hoy",
        titular:"Sin partidos programados",
        bajada:"Vuelva a consultar más tarde"
      }),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }

    let detallePartidos = "";
    resultado.partidos.forEach((p, i) => {
      detallePartidos += `${i + 1}. ${p.banderaLocal} ${p.local} vs ${p.visitante} ${p.banderaVisitante} a las ${p.hora} hs (${p.estadio})\n`;
    });

    const prompt = `Sos redactor de Media Mendoza.
Generá un titular y bajada para una PLACA MATUTINA del Mundial de Fútbol 2026.

PARTIDOS DE HOY:
${detallePartidos}

INSTRUCCIONES:
- Titular: máx 10 palabras, llamativo
- Bajada: máx 15 palabras, tono urgente
- Emojis: máx 2

Respondé SOLO con JSON sin backticks:
{"titular":"...","bajada":"..."}`;

    const geminiResult = await callGemini(prompt, env);
    
    const respuesta = {
      ok:true,
      tipo:"mañana",
      fecha:resultado.fecha,
      partidos:resultado.partidos,
      titular:geminiResult.error ? `Hoy ${resultado.partidos.length} partido${resultado.partidos.length > 1 ? 's' : ''}` : (geminiResult.data?.titular || "Partidos del Mundial"),
      bajada:geminiResult.error ? `No te pierdas la acción a partir de las ${resultado.partidos[0].hora}` : (geminiResult.data?.bajada || "Seguí toda la acción")
    };

    return new Response(JSON.stringify(respuesta),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}});

  } catch (err) {
    return new Response(JSON.stringify({ok:false,error:err.message}),{status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  }
}

// ============================================================
// BLOQUE 3️⃣: FUNCIÓN PLACA NOCHE
// ============================================================

async function handleMundialNoche(env) {
  try {
    const resultado = await obtenerPartidosMundial(env, 2000);
    
    if (resultado.error) {
      return new Response(JSON.stringify({ok:false,error:resultado.error}),{status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }

    const resultados = (resultado.partidos || []).filter(p => 
      p.estado === "FINISHED" && p.golesLocal !== null && p.golesVisitante !== null
    );

    if (resultados.length === 0) {
      return new Response(JSON.stringify({
        ok:true,
        tipo:"noche",
        fecha:resultado.fecha,
        resultados:[],
        mensaje:"No hay resultados aún",
        titular:"Esperando resultados...",
        bajada:"Los partidos aún no han terminado"
      }),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }

    let detalleResultados = "";
    resultados.forEach((r, i) => {
      const resumen = `${r.banderaLocal} ${r.local} ${r.golesLocal} - ${r.golesVisitante} ${r.visitante} ${r.banderaVisitante}`;
      const goles = r.goleadores.length > 0 ? ` (${r.goleadores.join(', ')})` : "";
      detalleResultados += `${i + 1}. ${resumen}${goles}\n`;
    });

    const prompt = `Sos redactor de Media Mendoza.
Generá un titular y bajada para una PLACA NOCTURNA de resultados del Mundial 2026.

RESULTADOS DE HOY:
${detalleResultados}

INSTRUCCIONES:
- Titular: máx 10 palabras
- Bajada: máx 15 palabras
- Emojis: máx 2

Respondé SOLO con JSON sin backticks:
{"titular":"...","bajada":"..."}`;

    const geminiResult = await callGemini(prompt, env);
    
    const respuesta = {
      ok:true,
      tipo:"noche",
      fecha:resultado.fecha,
      resultados:resultados,
      titular:geminiResult.error ? `${resultados.length} resultado${resultados.length > 1 ? 's' : ''}` : (geminiResult.data?.titular || "Resultados del Mundial"),
      bajada:geminiResult.error ? "Conocé todos los goles y lo mejor de la jornada" : (geminiResult.data?.bajada || "Seguí toda la acción")
    };

    return new Response(JSON.stringify(respuesta),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}});

  } catch (err) {
    return new Response(JSON.stringify({ok:false,error:err.message}),{status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  }
}

// ============================================================
// REEL — CONFIG
// ============================================================

async function handleGetReelConfig(env){
  try{
    const prompt = await env.KV.get(REEL_PROMPT_KEY,"text");
    const voces  = await env.KV.get(REEL_VOCES_KEY,"json");
    return jsonOk({
      prompt: prompt || REEL_PROMPT_DEFAULT,
      voces:  voces  || VOCES_DEFAULT
    });
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostReelConfig(body,env){
  try{
    if(body.prompt !== undefined){
      await env.KV.put(REEL_PROMPT_KEY, String(body.prompt||"").trim() || REEL_PROMPT_DEFAULT);
    }
    if(body.voces !== undefined){
      if(!Array.isArray(body.voces)) return jsonError("voces debe ser array",400);
      await env.KV.put(REEL_VOCES_KEY, JSON.stringify(body.voces));
    }
    return jsonOk({guardado:true});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleResetVoces(env){
  try{
    await env.KV.delete(REEL_VOCES_KEY);
    return jsonOk({reseteado:true});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}

async function handleReelGuion(body,env){
  const articulo = String(body.articulo||"").trim();
  if(!articulo) return jsonError("Falta campo: articulo",400);
  const promptBase = await env.KV.get(REEL_PROMPT_KEY,"text").catch(()=>null) || REEL_PROMPT_DEFAULT;
  const r = await callGemini(promptBase + `\n\nARTÍCULO:\n${articulo.substring(0,3000)}`, env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk({titulo: r.data?.titulo||"", guion: r.data?.guion||""});
}

async function handleReelAudio(body, env) {
  const titulo  = String(body.titulo  || '').trim();
  const guion   = String(body.guion   || '').trim();
  const voiceId = String(body.voiceId || 'es-AR-TomasNeural').trim();

  if (!guion) return jsonError('Falta campo: guion', 400);

  const textoCompleto = titulo ? `${titulo}. ${guion}` : guion;

  const vocesKV = await env.KV.get(REEL_VOCES_KEY, 'json').catch(() => null) || VOCES_DEFAULT;
  const vozData = vocesKV.find(v => v.id === voiceId) || vocesKV[0] || VOCES_DEFAULT[0];
  const intentos = [vozData, ...vocesKV.filter(v => v.id !== vozData.id)];
  const errores  = [];

  for (const voz of intentos) {
    const keyName    = voz.keyAlias || 'AZURE_TTS_KEY_1';
    const regionName = voz.region   || 'AZURE_TTS_REGION_1';
    const azureKey    = String(env[keyName]    || '').trim();
    const azureRegion = String(env[regionName] || '').trim();

    if (!azureKey || !azureRegion) {
      errores.push(`${voz.nombre || voz.id}: secrets "${keyName}"/"${regionName}" no configurados`);
      continue;
    }

    const locale = localeFromVoice(voz.id);

    const ssml = titulo
      ? `<speak version="1.0" xml:lang="${locale}">
           <voice name="${escapeXml(voz.id)}">
             <prosody rate="medium">
               ${escapeXml(titulo)}
               <break time="600ms"/>
               ${escapeXml(guion)}
             </prosody>
           </voice>
         </speak>`
      : `<speak version="1.0" xml:lang="${locale}">
           <voice name="${escapeXml(voz.id)}">${escapeXml(guion)}</voice>
         </speak>`;

    try {
      const res = await fetch(
        `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
            'User-Agent': 'mm-worker',
          },
          body: ssml,
        }
      );

      if (res.status === 429) { errores.push(`${voz.nombre || voz.id}: cuota agotada`); continue; }
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        errores.push(`${voz.nombre || voz.id}: HTTP ${res.status} → ${errBody.substring(0, 200)}`);
        continue;
      }

      const buf = await res.arrayBuffer();
      if (buf.byteLength < 100) { errores.push(`${voz.nombre || voz.id}: audio vacío`); continue; }

      return new Response(buf, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(buf.byteLength),
          'Cache-Control': 'no-store',
        },
      });

    } catch (e) {
      errores.push(`${voz.nombre || voz.id}: ${e.message}`);
    }
  }

  return jsonError(`Azure TTS falló: ${errores.join(' | ')}`, 502);
}

// ============================================================
// SOCIAL — PROMPTS Y GENERACIÓN
// ============================================================

async function handleGetSocialPrompt(url,env){
  const net=url.searchParams.get("net");
  if(!net) return jsonError("Falta parámetro net",400);
  try{ const v=await env.KV.get("social:prompt:"+net,"text"); return jsonOk({prompt:v||null}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handlePostSocialPrompt(body,env){
  const net=String(body.net||"").trim();
  const prompt=String(body.prompt||"").trim();
  if(!net||!prompt) return jsonError("Faltan campos",400);
  try{ await env.KV.put("social:prompt:"+net,prompt); return jsonOk({guardado:true}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handleSocialGenerar(body,env){
  const systemPrompt=String(body.systemPrompt||"").trim();
  const userMsg=String(body.userMsg||"").trim();
  if(!systemPrompt||!userMsg) return jsonError("Faltan campos",400);
  const r=await callGemini(`${systemPrompt}\n\nResponde SOLO con JSON sin backticks ni markdown.\n\n${userMsg}`,env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk({result:r.data});
}

// ============================================================
// CONFIG WA
// ============================================================

async function handleGetWaPrompt(env){
  try{ const v=await env.KV.get(WA_PROMPT_KV_KEY,"text"); return jsonOk({prompt:v||null}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handlePostWaPrompt(body,env){
  const prompt=String(body.prompt||"").trim();
  if(!prompt) return jsonError("Falta prompt",400);
  try{ await env.KV.put(WA_PROMPT_KV_KEY,prompt); return jsonOk({guardado:true}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handleGetWaLinks(env){
  try{ const v=await env.KV.get(WA_LINKS_KV_KEY,"json"); return jsonOk({links:v||{grupo:"",canal:""}}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handlePostWaLinks(body,env){
  const links={grupo:String(body.links?.grupo||"").trim(),canal:String(body.links?.canal||"").trim()};
  try{ await env.KV.put(WA_LINKS_KV_KEY,JSON.stringify(links)); return jsonOk({guardado:true}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}

// ============================================================
// TITULARES / REFORMULAR / REDACTAR
// ============================================================

const ESTILOS_DESC={
  formal:`FORMATO — Periodístico formal:\n- Titular: sujeto+verbo+dato, máx 10 palabras.\n- P1: qué/quién/cuándo/dónde/cómo.\n- P2-4: orden de importancia.\n- Cierre: dato proyectivo.`,
  directo:`FORMATO — Directo:\n- Titular: máx 7 palabras.\n- 3 párrafos de 2 oraciones.`,
  ampliado:`FORMATO — Profundidad:\n- P1 hecho, P2 antecedentes, P3 datos, P4 perspectivas, P5 cierre.`,
  breaking:`FORMATO — Urgente:\n- Titular en presente, máx 8 palabras.\n- P1 hecho, P2 lo que se sabe, P3 lo que falta.`,
  cronica:`FORMATO — Crónica:\n- Titular evocador, apertura escena, protagonista, hecho, contexto, cierre.`,
  deportes:`FORMATO — Deportes:\n- Titular activo. Resultado, momentos clave, datos, próximo paso.`,
  espectaculos:`FORMATO — Espectáculos:\n- Titular llamativo. Hecho, contexto, dato curioso, qué sigue.`,
  redes:`FORMATO — Redes:\n- Titular gancho. 3 párrafos breves. Cierre que invite a compartir.`,
  institucional:`FORMATO — Comunicado:\n- Titular formal. Hecho→justificación→declaración→datos. 4 párrafos.`
};

function comprimirEditorial(texto){
  if(!texto) return null;
  const lineas=texto.split('\n').map(l=>l.trim()).filter(l=>l.length>5)
    .filter(l=>!l.match(/^(Actuá como|Media Mendoza es|El enfoque|📰|🧭|✍️|🧱|📍|🚨)/))
    .filter(l=>l.startsWith('-')||l.startsWith('•')||l.match(/^(No |Usar |Incluir |Evitar |Redactar )/i))
    .slice(0,20);
  if(!lineas.length) return texto.split('\n').map(l=>l.trim()).filter(l=>l.length>10).slice(0,15).join('\n');
  return lineas.join('\n');
}

async function handleTitulares(body,env){
  const{modo,contenido,contexto="",tono="informativo",cantidad=5}=body;
  if(!modo||!contenido) return jsonError("Faltan campos",400);
  const ed=comprimirEditorial(await getEditorial(env));
  const instr=modo==="nota"?`Generá exactamente ${cantidad} titulares de este texto:\n"""\n${contenido}\n"""`:`Generá exactamente ${cantidad} titulares sobre:\n"""\n${contenido}\n"""`;
  const prompt=`Sos editor de Media Mendoza.\n${instr}\n${contexto?`\nCONTEXTO:\n${contexto}\n`:""}\nTono: ${tono}.\n${ed?`REGLAS:\n${ed}\n`:""}\nRespondé SOLO con JSON sin backticks:\n{"titulares":["T1"],"angulos":[{"nombre":"N","descripcion":"D"}]}`;
  const r=await callGemini(prompt,env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk(r.data);
}
async function handleReformular(body,env){
  const{titulo,contenido,contexto="",estilo="formal"}=body;
  if(!titulo||!contenido) return jsonError("Faltan campos",400);
  const ed=comprimirEditorial(await getEditorial(env));
  const prompt=`Sos redactor de Media Mendoza.\nReformulá completamente esta nota.\n\nTítulo original: "${titulo}"\nCuerpo:\n"""\n${contenido}\n"""\n${contexto?`\nINFO EXTRA:\n${contexto}\n`:""}\n${ESTILOS_DESC[estilo]||ESTILOS_DESC.formal}\n${ed?`\nREGLAS:\n${ed}\n`:""}\nRespondé SOLO con JSON sin backticks:\n{"titular":"","cuerpo":"P1...\n\nP2...","categoria_sugerida":"","hashtags":[]}`;
  const r=await callGemini(prompt,env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk(r.data);
}
async function handleRedactar(body,env){
  const{ideas,buscarWeb=false}=body;
  if(!ideas) return jsonError("Falta campo: ideas",400);
  const ed=comprimirEditorial(await getEditorial(env));
  const prompt=`Sos redactor de Media Mendoza.\nRedactá una nota periodística.\n\nCONTENIDO:\n${ideas}\n\n${buscarWeb?"Buscá contexto en la web.":"Solo usá la info provista."}\n${ed?`\nREGLAS:\n${ed}\n`:""}\nRespondé SOLO con JSON sin backticks:\n{"titular":"","bajada":"","cuerpo":"P1...\n\nP2...","categoria_sugerida":"","hashtags":[],"fuentes":[]}`;
  const fn=buscarWeb?callGeminiConBusqueda:callGemini;
  const r=await fn(prompt,env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk(r.data);
}

// ============================================================
// AGENDA
// ============================================================

async function handleGetAgendaEfemerides(env){
  try{const e=await listarObjetosKV(env,AGENDA_EF_PREFIX);e.sort((a,b)=>a.mes-b.mes||a.dia-b.dia);return jsonOk({efemerides:e})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostAgendaEfemeride(body,env){
  const titulo=String(body.titulo||"").trim();const dia=parseInt(body.dia)||0;const mes=parseInt(body.mes)||0;
  if(!titulo||!dia||!mes||dia<1||dia>31||mes<1||mes>12) return jsonError("Faltan campos válidos",400);
  const ef={id:body.id||generarId("ef_"),titulo,tituloBase:body.tituloBase||titulo,dia,mes,tipo:String(body.tipo||"efemeride").trim(),alcance:String(body.alcance||"local").trim(),descripcion:String(body.descripcion||"").trim(),creado:body.creado||Date.now()};
  try{await env.KV.put(`${AGENDA_EF_PREFIX}${ef.id}`,JSON.stringify(ef));return jsonOk({guardado:true,id:ef.id,efemeride:ef})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteAgendaEfemeride(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("Falta id",400);
  try{await env.KV.delete(`${AGENDA_EF_PREFIX}${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetAngulosCache(url,env){
  const key=String(url.searchParams.get("key")||"").trim();if(!key) return jsonError("Falta key",400);
  try{const v=await env.KV.get(ANGULOS_PREFIX+key,"json");return jsonOk({data:v||null})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleAgendaAngulos(body,env){
  const titulo=String(body.titulo||"").trim();if(!titulo) return jsonError("Falta titulo",400);
  const kvKey=String(body.kvKey||"").trim();
  if(kvKey){try{const c=await env.KV.get(ANGULOS_PREFIX+kvKey,"json");if(c) return jsonOk({...c,fromCache:true})}catch(e){}}
  const prompt=`Sos editor de agenda de Media Mendoza.\nEVENTO:\nTitulo: ${titulo}\nDescripcion: ${String(body.descripcion||"").trim()}\nFecha: ${String(body.fecha||"").trim()}\nTipo: ${String(body.tipo||"").trim()}\n\nResponde SOLO con JSON sin backticks:\n{"angulos":["a1"],"preguntas":["p1"],"fuentes_sugeridas":["f1"],"consejo":""}`;
  const r=await callGemini(prompt,env);if(r.error) return jsonError(r.error,500);
  const data={angulos:Array.isArray(r.data?.angulos)?r.data.angulos:[],preguntas:Array.isArray(r.data?.preguntas)?r.data.preguntas:[],fuentes_sugeridas:Array.isArray(r.data?.fuentes_sugeridas)?r.data.fuentes_sugeridas:[],consejo:String(r.data?.consejo||"").trim()};
  if(kvKey){try{await env.KV.put(ANGULOS_PREFIX+kvKey,JSON.stringify(data),{expirationTtl:ANGULOS_TTL})}catch(e){}}
  return jsonOk(data);
}
async function handleGetAgendaEventos(url,env){
  try{const mes=String(url.searchParams.get("mes")||"").trim();let ev=await listarObjetosKV(env,AGENDA_EV_PREFIX);if(mes)ev=ev.filter(e=>String(e.fecha||"").startsWith(mes));ev.sort((a,b)=>String(a.fecha||"").localeCompare(String(b.fecha||""))||String(a.hora||"").localeCompare(String(b.hora||"")));return jsonOk({eventos:ev})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostAgendaEvento(body,env){
  const titulo=String(body.titulo||"").trim();const fecha=String(body.fecha||"").trim();
  if(!titulo||!fecha) return jsonError("Faltan campos",400);
  const ev={id:body.id||generarId("ag_"),titulo,fecha,hora:String(body.hora||"").trim(),tipo:String(body.tipo||"evento").trim(),alcance:String(body.alcance||"local").trim(),descripcion:String(body.descripcion||"").trim(),periodista:String(body.periodista||"").trim(),creado:body.creado||Date.now()};
  try{await env.KV.put(`${AGENDA_EV_PREFIX}${ev.id}`,JSON.stringify(ev));return jsonOk({guardado:true,id:ev.id,evento:ev})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteAgendaEvento(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("Falta id",400);
  try{await env.KV.delete(`${AGENDA_EV_PREFIX}${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// SCRAPING / PLACAS
// ============================================================

async function handleScrape(url){
  const targetUrl=url.searchParams.get("url");if(!targetUrl) return jsonError("url requerida",400);
  try{new URL(targetUrl)}catch{return jsonError("URL inválida",400)}
  try{
    const{html}=await fetchHtml(targetUrl,300);
    const ogTitle=html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i);
    const titleTag=html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    const titulo=(ogTitle?.[1]||titleTag?.[1]||'').replace(/\s+/g,' ').trim();
    const ogImg=html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i)||html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:image["']/i);
    const texto=extraerTexto(html);
    if(!texto||texto.length<100) return jsonError("No se pudo extraer contenido",422);
    return jsonOk({titulo,texto,imagen:ogImg?.[1]||'',url:targetUrl});
  }catch(err){return jsonError(`Error scrapeando: ${err.message}`,502)}
}
async function handlePlacasUrl(url){
  const targetUrl=url.searchParams.get("url");if(!targetUrl) return jsonError("url requerida",400);
  try{new URL(targetUrl)}catch{return jsonError("URL inválida",400)}
  try{const{html}=await fetchHtml(targetUrl,300);const data=extraerDatosNota(html,targetUrl);if(!data.title&&!data.body) return jsonError("No se pudo extraer contenido",422);return jsonOk(data)}
  catch(err){return jsonError(`Error: ${err.message}`,502)}
}
async function handlePlacasImage(url){
  const imageUrl=url.searchParams.get("image");if(!imageUrl) return jsonError("image requerida",400);
  try{new URL(imageUrl)}catch{return jsonError("URL inválida",400)}
  try{
    const res=await fetch(imageUrl,{headers:{"User-Agent":BROWSER_HEADERS["User-Agent"],"Accept":"image/*"},redirect:"follow",cf:{cacheTtl:3600,cacheEverything:true}});
    if(!res.ok) return jsonError(`Error ${res.status}`,502);
    const ct=res.headers.get("Content-Type")||"application/octet-stream";
    if(!ct.startsWith("image/")) return jsonError("No es imagen",422);
    const cl=Number(res.headers.get("Content-Length")||"0");
    if(cl&&cl>MAX_PROXY_IMAGE_BYTES) return jsonError("Imagen muy pesada",413);
    return new Response(res.body,{headers:{...CORS_HEADERS,"Content-Type":ct,"Cache-Control":"public, max-age=3600"}});
  }catch(err){return jsonError(`Error: ${err.message}`,502)}
}
async function handlePlacasAI(request,env,body){
  const system=String(body.system||"").trim();const user=String(body.user||"").trim();
  if(!system||!user) return jsonError("Faltan campos",400);
  const r=await callGemini(`${system}\n\nResponde SOLO con JSON sin backticks:\n{"grupo":"...","canal":"..."}\n\n${user}`,env);
  if(r.error) return jsonError(r.error,500);
  const grupo=limpiarEspacios(r.data?.grupo||"");const canal=limpiarEspacios(r.data?.canal||"");
  if(!grupo&&!canal) return jsonError("IA no devolvió mensajes",502);
  return jsonOk({text:JSON.stringify({grupo,canal})});
}

// ============================================================
// PROCESAR IMÁGENES (placas, banners, flyers) con Gemini Vision
// ============================================================

async function handleProcesarImagenes(request, env) {
  try {
    const formData = await request.formData();
    const imageFiles = [];
    for (const [, value] of formData.entries()) {
      if (value instanceof File && value.type && value.type.startsWith('image/')) {
        imageFiles.push(value);
      }
    }
    if (imageFiles.length === 0) {
      return jsonError("No se recibieron imágenes", 400);
    }
    const VISION_MODELS = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.0-flash-lite"
    ];
    const keys = [env.GEMINI_KEY_1, env.GEMINI_KEY_2, env.GEMINI_KEY_3, env.GEMINI_KEY_4, env.GEMINI_KEY_5].filter(Boolean);
    if (!keys.length) return jsonError("No hay API keys de Gemini configuradas", 500);
    const maxImages = Math.min(imageFiles.length, 5);
    const results = [];
    const errores = [];
    for (let i = 0; i < maxImages; i++) {
      const file = imageFiles[i];
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mimeType = file.type;
      const prompt = `Extraé TODO el texto e información visible de esta imagen periodística (placa, banner, flyer, afiche).
Respondé SOLO con JSON sin backticks:
{"texto_extraido": "todo el texto que se ve en la imagen", "descripcion": "qué tipo de imagen es y qué información contiene"}`;
      let procesado = false;
      for (const model of VISION_MODELS) {
        for (const key of keys) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 1024 } }) });
            if (res.ok) {
              const data = await res.json();
              const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const match = raw.match(/\{[\s\S]*\}/);
              if (match) { try { const p = JSON.parse(match[0]); results.push(p); } catch(e) { results.push({ texto_extraido: raw.substring(0, 2000), descripcion: '' }); } }
              else { results.push({ texto_extraido: raw.substring(0, 2000), descripcion: '' }); }
              procesado = true;
              break;
            } else if (res.status === 429) { await sleep(2000); continue; }
            else {
              const errText = await res.text().catch(() => '');
              errores.push(`${model}: HTTP ${res.status} ${errText.substring(0, 200)}`);
              continue;
            }
          } catch(e) { errores.push(`${model}: ${e.message}`); continue; }
        }
        if (procesado) break;
      }
      if (!procesado) {
        errores.push(`No se pudo procesar imagen ${i+1} con ningún modelo`);
      }
    }
    const textos = results.map(r => r.texto_extraido).filter(Boolean);
    const descripciones = results.map(r => r.descripcion).filter(Boolean);
    let textoCombinado = textos.join('\n\n---\n\n');
    let tituloSugerido = '';
    if (textoCombinado.length > 30) {
      const tPrompt = `Basado en este texto extraído de una imagen, generá un título corto para nota periodística (máx 10 palabras):\n"""\n${textoCombinado.substring(0, 600)}\n"""\nRespondé SOLO con el título, sin comillas ni JSON.`;
      for (const key of keys) {
        try {
          const res = await fetch(`${GEMINI_URL}?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: tPrompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 50 } }) });
          if (res.ok) { const d = await res.json(); tituloSugerido = (d?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().replace(/^["']|["']$/g, ''); break; }
        } catch(e) { continue; }
      }
    }
    const response = { imagenes_procesadas: results.length, total_imagenes: imageFiles.length, titulo: tituloSugerido, texto: textoCombinado, descripcion: descripciones.join('; ') };
    if (errores.length) response.errores = errores.slice(0, 5);
    return jsonOk(response);
  } catch (err) {
    return jsonError("Error procesando imágenes: " + err.message, 500);
  }
}

// ============================================================
// EDITORIAL / FUENTES / NOTAS / CUBIERTAS
// ============================================================

async function handleGetEditorial(env){
  try{const v=await env.KV.get(EDITORIAL_KV_KEY,"json");return jsonOk({editorial:v||{prompt:"",activo:false}})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostEditorial(body,env){
  if(typeof body.prompt==="undefined") return jsonError("Falta prompt",400);
  try{await env.KV.put(EDITORIAL_KV_KEY,JSON.stringify({prompt:body.prompt.trim(),activo:!!body.activo}));return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetFuentes(env){
  try{const list=await env.KV.list({prefix:"fuente:"});const fuentes=[];for(const k of list.keys){const v=await env.KV.get(k.name,"json");if(v)fuentes.push(v)}fuentes.sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));return jsonOk({fuentes})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostFuente(body,env){
  const{id,nombre,url,clase}=body;if(!id||!nombre||!url) return jsonError("Faltan campos",400);
  try{await env.KV.put(`fuente:${id}`,JSON.stringify({id,nombre,url,clase:clase||"custom"}));return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteFuente(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("id requerido",400);
  try{await env.KV.delete(`fuente:${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetNotas(env){
  try{const list=await env.KV.list({prefix:"nota:"});const notas=[];for(const k of list.keys){const v=await env.KV.get(k.name,"json");if(v)notas.push(v)}notas.sort((a,b)=>(b.fecha||0)-(a.fecha||0));return jsonOk({notas})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostNota(body,env){
  const{id,titular,cuerpo,categoria,hashtags,imagen,fecha}=body;if(!id||!titular) return jsonError("Faltan campos",400);
  try{await env.KV.put(`nota:${id}`,JSON.stringify({id,titular,cuerpo,categoria,hashtags,imagen:imagen||'',fecha:fecha||Date.now()}));return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteNota(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("id requerido",400);
  try{await env.KV.delete(`nota:${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetCubiertas(env){
  try{const list=await env.KV.list({prefix:"cubierta:"});return jsonOk({links:list.keys.map(k=>k.name.replace("cubierta:",""))})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostCubierta(body,env){
  const{link,cubierta}=body;if(!link) return jsonError("Falta link",400);
  try{const key="cubierta:"+link.substring(0,400);if(cubierta)await env.KV.put(key,"1",{expirationTtl:60*60*24*30});else await env.KV.delete(key);return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// WHATSAPP
// ============================================================

const WA_PROMPT_DEFECTO=`Sos editor de redes sociales de Media Mendoza, diario digital del sur de Mendoza, Argentina.
Transformá esta noticia en dos mensajes de WhatsApp. Español rioplatense. Emojis estratégicos.

FORMATO "grupo": [emoji] *[LOCALIDAD/CATEGORÍA]:* [titular]
[2-3 líneas clave con *negritas*] 👇
🔗 *DETALLES:* 👉 {URL}
📱 {LINK_GRUPO} 📣 {LINK_CANAL}
*📰 Media Mendoza*

FORMATO "canal": [emoji] *[CATEGORÍA]:* [titular]
• [punto 1]
• [punto 2]
• [punto 3]
🔗 👉 {URL}
*📰 Media Mendoza*

REGLAS: negritas solo en datos clave, NO **, emojis: policiales=🚨 deportes=⚽ política=🏛️ accidente=🚗 salud=🏥 general=📢`;

async function handleWhatsappGenerar(body,env){
  const notaUrl=String(body.notaUrl||"").trim();
  const contextoExtra=String(body.contextoExtra||"").trim();
  let nota={titulo:String(body.titulo||"").trim(),categoria:String(body.categoria||"").trim(),descripcion:"",body:String(body.contenido||"").trim(),url:notaUrl,urlCorta:notaUrl?acortarUrlNota(notaUrl):"",image:""};
  if(notaUrl){
    try{new URL(notaUrl)}catch{return jsonError("URL inválida",400)}
    try{
      const{html}=await fetchHtml(notaUrl,300);
      const s=extraerDatosNota(html,notaUrl);
      nota={titulo:s.title||nota.titulo,categoria:s.category||nota.categoria,descripcion:s.description||"",body:s.body||nota.body,url:notaUrl,urlCorta:acortarUrlNota(notaUrl),image:s.image||""};
    }catch(err){return jsonError(`No se pudo obtener la nota: ${err.message}`,502)}
  }
  if(!nota.titulo&&!nota.body) return jsonError("Falta notaUrl o contenido",400);
  let pt=WA_PROMPT_DEFECTO;
  try{const p=await env.KV.get(WA_PROMPT_KV_KEY,"text");if(p)pt=p}catch(e){}
  let links={grupo:"https://bit.ly/mediamendoza-grupo",canal:"https://bit.ly/mediamendoza-canal"};
  try{const l=await env.KV.get(WA_LINKS_KV_KEY,"json");if(l){if(l.grupo)links.grupo=l.grupo;if(l.canal)links.canal=l.canal}}catch(e){}
  const localidades=["San Rafael","General Alvear","Malargüe","Alvear"];
  const localidad=localidades.find(l=>(nota.titulo+nota.body).includes(l))||"San Rafael";
  const urlFinal=nota.urlCorta||nota.url||"";
  const pf=pt.replace(/\{URL\}/g,urlFinal).replace(/\{LINK_GRUPO\}/g,links.grupo).replace(/\{LINK_CANAL\}/g,links.canal).replace(/\{TITULO\}/g,nota.titulo||"Sin titulo").replace(/\{CATEGORIA\}/g,nota.categoria||"General").replace(/\{LOCALIDAD\}/g,localidad).replace(/\{CONTENIDO\}/g,(nota.body||"").substring(0,1500));
  const nd=pt.includes("{CONTENIDO}")?"" :`\n\nNOTICIA:\nTítulo: ${nota.titulo}\nCategoría: ${nota.categoria||"General"}\nLocalidad: ${localidad}\nContenido: ${(nota.body||"").substring(0,1500)}\nURL: ${urlFinal}`;
  const prompt=`${pf}${nd}${contextoExtra?`\nContexto extra: ${contextoExtra}`:""}\n\nRespondé SOLO con JSON sin backticks: {"grupo":"...","canal":"..."}`;
  const r=await callGemini(prompt,env);
  if(r.error) return jsonError(r.error,500);
  const grupo=(r.data?.grupo||"").trim();const canal=(r.data?.canal||"").trim();
  if(!grupo||!canal) return jsonError("IA no devolvió ambos mensajes",502);
  return jsonOk({nota:{titulo:nota.titulo||"Sin titulo",url:nota.url||"",urlCorta:urlFinal,imagen:nota.image||""},categoria:nota.categoria||"General",grupo,canal});
}
async function handlePostWhatsappProgramar(body,env){
  if(!body?.fecha) return jsonError("Falta fecha",400);
  const item={id:body.id||generarId("wp_"),fecha:Number(body.fecha),fechaLegible:body.fechaLegible||"",tituloNota:String(body.tituloNota||"").trim(),urlCorta:String(body.urlCorta||"").trim(),canales:Array.isArray(body.canales)?body.canales.filter(Boolean):[],textoGrupo:String(body.textoGrupo||"").trim(),textoCanal:String(body.textoCanal||"").trim(),categoria:String(body.categoria||"General").trim(),enviado:!!body.enviado,creado:body.creado||Date.now()};
  if(!item.canales.length) return jsonError("Falta canal",400);
  try{await env.KV.put(`${WHATSAPP_PREFIX}${item.id}`,JSON.stringify(item));return jsonOk({guardado:true,id:item.id})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetWhatsappProgramados(env){
  try{const p=await listarObjetosKV(env,WHATSAPP_PREFIX);p.sort((a,b)=>(a.fecha||0)-(b.fecha||0));return jsonOk({programados:p})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostWhatsappMarcarEnviado(body,env){
  const id=String(body.id||"").trim();if(!id) return jsonError("Falta id",400);
  try{
    const key=`${WHATSAPP_PREFIX}${id}`;const actual=await env.KV.get(key,"json");
    if(!actual) return jsonError("Mensaje no encontrado",404);
    await env.KV.put(key,JSON.stringify({...actual,estado:"enviado",enviado:true}));
    return jsonOk({guardado:true,id});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteWhatsappProgramado(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("id requerido",400);
  try{await env.KV.delete(`${WHATSAPP_PREFIX}${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// RSS / VERIFICAR
// ============================================================

async function handleRSS(url){
  const feedUrl=url.searchParams.get("url");if(!feedUrl) return jsonError("url requerida",400);
  try{new URL(feedUrl)}catch{return jsonError("URL inválida",400)}
  try{
    const res=await fetch(feedUrl,{headers:{...BROWSER_HEADERS,'Accept-Encoding':'identity'},redirect:"follow",cf:{cacheTtl:180,cacheEverything:true}});
    if(!res.ok) return jsonError(`Feed error ${res.status}`,502);
    const text=await res.text();
    if(!esXMLvalido(text)) return jsonError("No es feed RSS válido",422);
    return new Response(text,{headers:{...CORS_HEADERS,"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=180"}});
  }catch(err){return jsonError(`Error feed: ${err.message}`,502)}
}
async function handleVerificar(url){
  const feedUrl=url.searchParams.get("url");if(!feedUrl) return jsonError("url requerida",400);
  try{new URL(feedUrl)}catch{return jsonError("URL inválida",400)}
  try{
    const res=await fetch(feedUrl,{headers:{...BROWSER_HEADERS,'Accept-Encoding':'identity'},redirect:"follow"});
    if(!res.ok) return jsonError(`Feed error ${res.status}`,502);
    const text=await res.text();
    if(!esXMLvalido(text)) return jsonError("No es feed RSS válido",422);
    const tm=text.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const nombre=tm?tm[1].replace(/\s+/g,' ').trim().substring(0,80):'Feed RSS';
    const itemCount=(text.match(/<item[\s>]/g)||[]).length+(text.match(/<entry[\s>]/g)||[]).length;
    return jsonOk({valido:true,nombre,items:itemCount});
  }catch(err){return jsonError(`Error: ${err.message}`,502)}
}

// ============================================================
// GEMINI
// ============================================================

async function getEditorial(env){
  try{const v=await env.KV.get(EDITORIAL_KV_KEY,"json");if(v&&v.activo&&v.prompt) return v.prompt}catch(e){}
  return null;
}
async function callGeminiConBusqueda(prompt,env){
  const fuentes=await buscarDuckDuckGo(prompt.substring(0,200));
  let ctx="";const fv=[];
  for(const f of fuentes.slice(0,3)){
    try{
      const res=await fetch(f.url,{headers:BROWSER_HEADERS,redirect:"follow",signal:AbortSignal.timeout(5000)});
      if(!res.ok) continue;
      const html=await res.text();const texto=extraerTexto(html).substring(0,800);
      if(texto.length<100) continue;
      const ogImg=html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i);
      ctx+="\nFUENTE: "+f.titulo+" ("+f.url+")\n"+texto+"\n---";
      fv.push({titulo:f.titulo,url:f.url,imagen:ogImg?.[1]||''});
    }catch(e){continue}
  }
  const r=await callGemini(prompt+(ctx?"\n\nCONTENIDO WEB:\n"+ctx:""),env);
  if(r.error) return r;
  if(fv.length) r.data.fuentes=fv;
  return r;
}
async function buscarDuckDuckGo(query){
  try{
    const res=await fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent(query)+"&kl=es-ar",{headers:{"User-Agent":BROWSER_HEADERS["User-Agent"],"Accept":"text/html"},redirect:"follow"});
    if(!res.ok) return [];
    const html=await res.text();const resultados=[];
    const linkRegex=/class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)</g;let match;
    while((match=linkRegex.exec(html))!==null&&resultados.length<5){
      let u=match[1];const t=match[2].trim();
      if(u.includes("uddg=")){const d=decodeURIComponent(u.split("uddg=")[1]?.split("&")[0]||"");if(d.startsWith("http"))u=d}
      if(u.startsWith("http")&&t) resultados.push({url:u,titulo:t});
    }
    return resultados;
  }catch(e){return []}
}
async function callGemini(prompt,env){
  const keys=[env.GEMINI_KEY_1,env.GEMINI_KEY_2,env.GEMINI_KEY_3,env.GEMINI_KEY_4,env.GEMINI_KEY_5].filter(Boolean);
  if(!keys.length) return {error:"No hay API keys de Gemini configuradas"};
  for(let i=0;i<keys.length;i++){
    for(let intento=1;intento<=2;intento++){
      try{
        const res=await fetch(`${GEMINI_URL}?key=${keys[i]}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:2000}})});
        if(res.status===429){if(intento<2){await sleep(3000);continue}else break}
        if(res.status===500||res.status===503){if(intento<2){await sleep(3000);continue}else break}
        if(!res.ok) break;
        const data=await res.json();
        const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text||"";
        const match=raw.match(/\{[\s\S]*\}/);if(!match) break;
        let parsed;try{parsed=JSON.parse(match[0])}catch{break}
        return {data:parsed};
      }catch(err){if(intento<2) await sleep(3000)}
    }
  }
  return {error:"Todas las API keys de Gemini están agotadas."};
}

// ============================================================
// MÚSICA DE FONDO - FREESOUND API
// ============================================================

async function handleMusicSearch(url, env) {
  const query = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page')) || 1;
  const perPage = parseInt(url.searchParams.get('per_page')) || 12;
  const apiKey = env.FREESOUND_API_KEY;

  if (!apiKey) {
    return jsonError('API key de Freesound no configurada', 500);
  }

  const apiUrl = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&page=${page}&page_size=${perPage}&fields=id,name,username,previews,duration&token=${apiKey}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data.results) {
      return jsonError('Error en búsqueda de Freesound', 500);
    }

    const tracks = data.results.map(track => {
      const previewUrl = track.previews?.["preview-hq-mp3"] || 
                         track.previews?.["preview-lq-mp3"];
      
      if (!previewUrl) {
        return null;
      }
      
      return {
        id: track.id,
        title: track.name || 'Sin título',
        duration: track.duration || 30,
        artist: track.username || 'Artista Freesound',
        preview_url: previewUrl,
        audio_url: previewUrl,
        attribution: `🎵 Sonido: "${track.name || 'Sin título'}" por ${track.username || 'Artista Freesound'} (Freesound.org)`
      };
    }).filter(t => t !== null);

    return jsonOk({ tracks, total: data.count || 0 });
  } catch (err) {
    console.error('Error en handleMusicSearch:', err);
    return jsonError(`Error: ${err.message}`, 500);
  }
}

async function handleMusicPreview(url, env) {
  const audioUrl = url.searchParams.get('url');
  if (!audioUrl) {
    return jsonError('Falta parámetro url', 400);
  }

  try {
    const res = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': 'https://freesound.org/',
        'Origin': 'https://freesound.org'
      }
    });
    
    if (!res.ok) {
      return jsonError(`Error en proxy: ${res.status}`, 502);
    }
    
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('Error en handleMusicPreview:', err);
    return jsonError(`Error: ${err.message}`, 500);
  }
}
// ============================================================
// VIDEO EDITOR - PROCESAMIENTO ASÍNCRONO CON COLA (QUEUE)
// ============================================================

async function handleVideoEditorTranscribirAsync(request, env) {
  if (!env.AI) {
    return jsonError("Cloudflare AI no está configurado", 500);
  }

  try {
    const formData = await request.formData();
    let audioFile = formData.get('audio');
    if (!audioFile) audioFile = formData.get('file');
    
    if (!audioFile) {
      return jsonError("Falta archivo de audio", 400);
    }

    console.log('[async] Audio recibido:', audioFile.name, audioFile.size);
    
    // Limitar tamaño a 25MB (límite de R2 free tier)
    if (audioFile.size > 25 * 1024 * 1024) {
      return jsonError("El audio es demasiado grande. Máximo 25MB.", 400);
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const jobId = generarId('transc');
    const r2Key = `audio-transcripcion/${jobId}.wav`;
    
    // Guardar en R2
    await env.R2.put(r2Key, audioBuffer, {
      httpMetadata: { contentType: 'audio/wav' }
    });
    
    console.log(`[async] Audio guardado en R2: ${r2Key}`);
    
    // Enviar mensaje a la cola (en lugar de ejecutar procesarAudioAsync)
    await env.transcription_queue.send({
      jobId: jobId,
      r2Key: r2Key
    });
    console.log(`📤 Mensaje enviado a la cola para job: ${jobId}`);
    
    return jsonOk({ 
      jobId: jobId, 
      estado: 'procesando',
      mensaje: 'La transcripción se está procesando'
    });
    
  } catch (err) {
    console.error('Error al iniciar transcripción:', err);
    return jsonError("Error al iniciar: " + err.message, 500);
  }
}

async function handleVideoEditorEstado(url, env) {
  const jobId = url.searchParams.get('id');
  if (!jobId) {
    return jsonError("Falta parámetro id", 400);
  }
  
  try {
    const data = await env.KV.get(`transc:${jobId}`, 'json');
    if (!data) {
      return jsonError("Job no encontrado", 404);
    }
    return jsonOk(data);
  } catch (err) {
    return jsonError("Error obteniendo estado: " + err.message, 500);
  }
}

// ============================================================
// CONSUMIDOR DE LA COLA (transcription-queue)
// ============================================================

async function queue(batch, env) {
  console.log(`📦 Procesando lote de ${batch.messages.length} mensajes`);
  
  for (const msg of batch.messages) {
    const { jobId, r2Key } = msg.body;
    console.log(`🎯 Procesando job: ${jobId}, r2Key: ${r2Key}`);
    
    try {
      // Actualizar estado: procesando
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: 'procesando',
        progreso: 10,
        mensaje: 'Descargando audio...'
      }), { expirationTtl: 3600 });
      
      // Obtener audio de R2
      const audioObject = await env.R2.get(r2Key);
      if (!audioObject) throw new Error('Audio no encontrado en R2');
      
      const audioBuffer = await audioObject.arrayBuffer();
      console.log(`📊 [${jobId}] Audio recuperado: ${audioBuffer.byteLength} bytes`);
      
      if (audioBuffer.byteLength < 1000) {
        throw new Error(`Audio demasiado pequeño: ${audioBuffer.byteLength} bytes`);
      }
      
      const audioArray = [...new Uint8Array(audioBuffer)];
      
      // Actualizar estado: transcribiendo
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: 'procesando',
        progreso: 30,
        mensaje: 'Transcribiendo con IA...'
      }), { expirationTtl: 3600 });
      
      console.log(`🟡 [${jobId}] Llamando a Whisper...`);
      
      const response = await env.AI.run('@cf/openai/whisper', {
        audio: audioArray
      });
      
      console.log(`✅ [${jobId}] Whisper respondió`);
      
      let texto = response.text || '';
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
            text: group.map(w => w.word).join(' ')
          });
        }
      } else if (texto) {
        segments = [{ start: 0, end: 30, text: texto }];
      }
      
      const oraciones = procesarSegmentosAOraciones(segments);
      
      // Guardar resultado en KV
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: 'completado',
        progreso: 100,
        texto: texto,
        segments: segments,
        oraciones: oraciones,
        word_count: words.length || texto.split(/\s+/).length
      }), { expirationTtl: 3600 });
      
      // Limpiar R2
      await env.R2.delete(r2Key);
      
      console.log(`✅ Job ${jobId} completado`);
      
      // Marcar mensaje como exitoso
      msg.ack();
      
    } catch (err) {
      console.error(`❌ Error en job ${jobId}:`, err);
      
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: 'error',
        error: err.message
      }), { expirationTtl: 3600 });
      
      // Reintentar el mensaje (hasta 3 veces)
      if (msg.attempts < 3) {
        console.log(`🔄 Reintentando job ${jobId}, intento ${msg.attempts + 1}`);
        msg.retry();
      } else {
        console.log(`❌ Job ${jobId} descartado después de ${msg.attempts} intentos`);
        msg.ack(); // Descartar después de 3 intentos
      }
    }
  }
}
// ============================================================
// DIAGNÓSTICO - Verificar bindings del worker
// ============================================================

async function handleDiagnostico(env) {
  const hasAI = !!env.AI;
  const hasKV = !!env.KV;
  const hasR2 = !!env.R2;
  const hasQueue = !!env.transcription_queue;
  
  let aiStatus = 'no disponible';
  let whisperTest = null;
  
  if (hasAI) {
    aiStatus = 'binding AI presente';
    // Probar Whisper con un audio de prueba mínimo
    try {
      // Crear un audio de prueba (1 segundo de silencio)
      const testAudio = new Uint8Array(16000 * 2); // 1 segundo a 16kHz, 16-bit
      const result = await env.AI.run('@cf/openai/whisper', {
        audio: [...testAudio]
      });
      whisperTest = 'funciona correctamente';
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
    mensaje: hasAI ? "✅ AI configurado correctamente" : "❌ AI NO está configurado en este worker"
  });
}

async function handleMundialIDs(env) {
  const apiKey = env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ok:false,error:"Sin API key"}), {status:400,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  }
  
  try {
    const res = await fetch("https://api.football-data.org/v4/competitions", {
      headers: { 'X-Auth-Token': apiKey }
    });
    
    const data = await res.json();
    
    const mundiales = data.competitions
      .filter(c => c.name.toLowerCase().includes('world') || c.name.toLowerCase().includes('fifa'))
      .map(c => ({
        id: c.id,
        nombre: c.name,
        inicio: c.currentSeason?.startDate,
        fin: c.currentSeason?.endDate
      }));
    
    return new Response(JSON.stringify({ok:true,mundiales}), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  } catch (err) {
    return new Response(JSON.stringify({ok:false,error:err.message}), {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  }
}


// ============================================================
// ROUTER PRINCIPAL
// ============================================================

export default {
  async fetch(request, env) {
    if(request.method==="OPTIONS") return new Response(null,{headers:CORS_HEADERS});
    const url=new URL(request.url);
    const path=url.pathname;

    // ── GET ──
    if(request.method==="GET"){
      if(path==="/"&&url.searchParams.has("url"))    return handlePlacasUrl(url);
      if(path==="/"&&url.searchParams.has("image"))  return handlePlacasImage(url);
      if(path==="/rss")                              return handleRSS(url);
      if(path==="/verificar")                        return handleVerificar(url);
      if(path==="/scrape")                           return handleScrape(url);
      if(path==="/fuentes")                          return handleGetFuentes(env);
      if(path==="/editorial")                        return handleGetEditorial(env);
      if(path==="/cubiertas")                        return handleGetCubiertas(env);
      if(path==="/notas")                            return handleGetNotas(env);
      if(path==="/whatsapp/programados")             return handleGetWhatsappProgramados(env);
      if(path==="/whatsapp/config/prompt")           return handleGetWaPrompt(env);
      if(path==="/whatsapp/config/links")            return handleGetWaLinks(env);
      if(path==="/social/prompt")                    return handleGetSocialPrompt(url,env);
      if(path==="/social/reel/config")               return handleGetReelConfig(env);
      if(path==="/social/reel/reset-voces")          return handleResetVoces(env);
      if(path==="/agenda/eventos")                   return handleGetAgendaEventos(url,env);
      if(path==="/agenda/efemerides")                return handleGetAgendaEfemerides(env);
      if(path==="/agenda/angulos/cache")             return handleGetAngulosCache(url,env);
      if(path==="/resumen/obtener")                  return handleResumenObtener(url, env);
      if(path==="/studio/proyectos")                 return handleStudioObtenerProyectos(env);
      if(path==="/music/search")                     return handleMusicSearch(url, env);
      if(path==="/music/preview")                    return handleMusicPreview(url, env);
      if(path==="/test-ai")                          return handleTestAI(env);
      if(path==="/smn/weather")                      return handleSMNWeather(url, env);
      if(path==="/mundo/placa-manana")               return handleMundialManana(env);
      if(path==="/mundo/placa-noche")                return handleMundialNoche(env);
      if(path==="/mundo/partidos") {
      const fecha = url.searchParams.get("fecha");
      const purge = url.searchParams.get("purge");
      const modo = url.searchParams.get("modo") || 'combinado';
      // Si purge=1, limpiar cache antes de consultar
      if (purge === '1' && env.KV) {
        try { await env.KV.delete('mundial:fd:2000'); } catch(e) {}
        try { await env.KV.delete('mundial:season:2026'); } catch(e) {}
        try { await env.KV.delete('mundial:tsdb:2026'); } catch(e) {}
        // Limpiar también caches de Zafronix, eventos y detalles
        const keys = [
          'mundial:zafronix:standings:2026', 'mundial:zafronix:bracket:2026', 'mundial:zafronix:stadiums:2026',
          'mundial:zafronix:matches:2026'
        ];
        for (const k of keys) { try { await env.KV.delete(k); } catch(e) {} }
      }

      // MODO COMBINADO: Todas las APIs + enriquecimiento (default)
      if (modo === 'combinado') {
        const resultado = await obtenerPartidosCombinados(env, fecha || null);
        return new Response(JSON.stringify({
          ok: true,
          fecha: resultado.fecha,
          partidos: resultado.partidos || [],
          total: (resultado.partidos || []).length,
          fuentes: resultado.fuentes,
          enriquecido: resultado.enriquecido,
          debug: resultado.debug || null,
          totalSeason: null
        }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      // MODO SIMPLE: Solo football-data (rápido, sin enriquecimiento)
      let resultado = await obtenerPartidosMundial(env, 2000, fecha || null);
      let fuente = 'football-data';

      if (resultado.error || (resultado.partidos || []).length === 0) {
        const tsdb = await obtenerPartidosTheSportsDB(env, fecha || null);
        if (!tsdb.error) {
          resultado = tsdb;
          fuente = 'thesportsdb';
        } else if (resultado.error) {
          const af = await obtenerPartidosAPIFootball(env, fecha || null);
          if (!af.error) {
            resultado = af;
            fuente = 'api-football';
          } else {
            return new Response(JSON.stringify({ok:false,error:resultado.error,fallback_errors:{tsdb:tsdb.error,af:af.error}}),
              {status:400,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
          }
        }
      }

      const partidos = resultado.partidos || [];
      return new Response(JSON.stringify({
        ok: true,
        fecha: resultado.fecha,
        partidos: partidos,
        total: partidos.length,
        fuente: fuente,
        totalSeason: resultado.totalSeason || null
      }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }
      if(path==="/video-editor/estado")              return handleVideoEditorEstado(url, env);
      if(path==="/diagnostico")                      return handleDiagnostico(env);
      if(path==="/debug/mundial-ids")                return handleMundialIDs(env);

      // ── Endpoints API-Football (complementario) ──
      if(path==="/mundo/partidos-combinados") {
        const fecha = url.searchParams.get("fecha");
        const resultado = await obtenerPartidosCombinados(env, fecha || null);
        return new Response(JSON.stringify({
          ok: true,
          ...resultado
        }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/mundo/detalle-partido") {
        const fixtureId = url.searchParams.get("fixtureId");
        if (!fixtureId) {
          return new Response(JSON.stringify({ok:false,error:"Parámetro fixtureId requerido"}),
            {status:400,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        const resultado = await obtenerDetallePartidoAPIFootball(env, fixtureId);
        if (resultado.error) {
          return new Response(JSON.stringify({ok:false,error:resultado.error}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/mundo/posiciones") {
        // Intentar Zafronix primero (mejor data: tiebreakers FIFA, clasificados)
        const zafronixData = await obtenerPosicionesZafronix(env);
        if (zafronixData && zafronixData.grupos && Object.keys(zafronixData.grupos).length > 0) {
          return new Response(JSON.stringify({ok:true,...zafronixData}),
            {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        // Fallback: API-Football
        const resultado = await obtenerPosicionesGrupos(env);
        if (resultado.error) {
          return new Response(JSON.stringify({ok:false,error:resultado.error}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      // ── Nuevos endpoints Zafronix ──
      if(path==="/mundo/bracket") {
        const resultado = await obtenerBracketZafronix(env);
        if (!resultado) {
          return new Response(JSON.stringify({ok:false,error:"Bracket no disponible (Zafronix API key requerida)"}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/mundo/planteles") {
        const resultado = await obtenerPlantelesZafronix(env);
        if (!resultado) {
          return new Response(JSON.stringify({ok:false,error:"Planteles no disponibles (Zafronix API key requerida)"}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/mundo/estadios") {
        const resultado = await obtenerEstadiosZafronix(env);
        if (!resultado) {
          return new Response(JSON.stringify({ok:false,error:"Estadios no disponibles (Zafronix API key requerida)"}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/mundo/goleadores") {
        const resultado = await obtenerGoleadores(env);
        if (resultado.error) {
          return new Response(JSON.stringify({ok:false,error:resultado.error}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      // ── Diagnóstico de goleadores (verifica datos de Zafronix) ──
      if(path==="/mundo/test-goleadores") {
        const apiKey = env.ZAFRONIX_KEY;
        if (!apiKey) return new Response(JSON.stringify({ok:false,error:"ZAFRONIX_KEY no configurada"}),
          {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});

        try {
          // 1) Obtener partidos de Zafronix
          const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, { headers: { 'X-API-Key': apiKey } });
          if (!res.ok) return new Response(JSON.stringify({ok:false,error:`Zafronix matches: HTTP ${res.status}`}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});

          const data = await res.json();

          // Mostrar estructura real de la respuesta
          const keys = Object.keys(data);
          const isArray = Array.isArray(data);
          const hasMatches = !!data.matches;
          const matchesIsArray = Array.isArray(data.matches);

          // Intentar encontrar el array de partidos
          let zMatches = null;
          if (Array.isArray(data)) {
            zMatches = data;
          } else if (data.matches && Array.isArray(data.matches)) {
            zMatches = data.matches;
          } else if (data.data && Array.isArray(data.data)) {
            zMatches = data.data;
          } else if (data.results && Array.isArray(data.results)) {
            zMatches = data.results;
          } else if (data.fixtures && Array.isArray(data.fixtures)) {
            zMatches = data.fixtures;
          }

          if (!zMatches) {
            return new Response(JSON.stringify({
              ok: false,
              error: "No se encontró array de partidos",
              debug: {
                responseKeys: keys,
                isArray: isArray,
                hasMatches: hasMatches,
                matchesIsArray: matchesIsArray,
                sampleKeys: keys.slice(0, 5),
                sampleData: typeof data === 'object' ? Object.fromEntries(keys.slice(0, 3).map(k => [k, typeof data[k] === 'object' ? 'object' : data[k]])) : null
              }
            }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
          }

          // 2) Analizar todos los status presentes
          const statusCount = {};
          zMatches.forEach(m => {
            const s = m.status || m.state || m.matchStatus || m.statusCode || 'unknown';
            statusCount[s] = (statusCount[s] || 0) + 1;
          });

          // Muestra de 3 partidos para ver estructura
          const matchSamples = zMatches.slice(0, 3).map(m => ({
            id: m.id,
            home: m.homeTeam?.name || m.home,
            away: m.awayTeam?.name || m.away,
            allKeys: Object.keys(m).slice(0, 15),
            status: m.status,
            state: m.state,
            matchStatus: m.matchStatus,
            statusCode: m.statusCode,
            score: m.score,
            homeScore: m.homeScore ?? m.homeTeam?.score,
            awayScore: m.awayScore ?? m.awayTeam?.score,
          }));

          // 3) Filtrar terminados con lógica ampliada (Zafronix usa "finished" minúscula)
          const finished = zMatches.filter(m => {
            const status = (m.status || m.state || m.matchStatus || m.statusCode || '').toString().toLowerCase();
            return ['ft', 'finished', 'aet', 'pen', 'ended', 'complete', 'completed', 'final', '3'].includes(status);
          });

          // 4) Muestra de goles de partidos terminados
          const samples = finished.slice(0, 3).map(m => {
            const hTeam = typeof m.homeTeam === 'string' ? m.homeTeam : (m.homeTeam?.name || m.home || '');
            const aTeam = typeof m.awayTeam === 'string' ? m.awayTeam : (m.awayTeam?.name || m.away || '');
            return {
              id: m.id,
              home: hTeam,
              away: aTeam,
              status: m.status || m.state,
              score: `${m.homeScore ?? '?'}-${m.awayScore ?? '?'}`,
              hasGoals: !!(m.goals && m.goals.length > 0),
              goalsCount: m.goals?.length || 0,
              sampleGoals: (m.goals || []).slice(0, 3).map(g => {
                let pName = (g.player || g.scorer || g.name || '').toString();
                pName = pName.replace(/\s+\d+[\+\d]*'\s*(pen|og|agg)?$/i, '').trim();
                const tRaw = (g.team || '').toString().toLowerCase();
                const resolvedTeam = tRaw === 'home' ? hTeam : (tRaw === 'away' ? aTeam : g.team);
                return {
                  player: pName,
                  teamRaw: g.team,
                  teamResolved: resolvedTeam,
                  minute: g.minute || g.time
                };
              })
            };
          });

          // 5) Intentar agregación (con opción de forzar refresh)
          const forceRefresh = url.searchParams.get('refresh') === '1';
          if (forceRefresh && env.KV) {
            await env.KV.delete('mundial:zafronix:topscorers:2026');
          }
          const resultado = await obtenerGoleadoresZafronix(env);

          return new Response(JSON.stringify({
            ok: true,
            totalMatches: zMatches.length,
            statusCount: statusCount,
            matchSamples: matchSamples,
            finishedMatches: finished.length,
            samples: samples,
            aggregatedResult: resultado ? {
              fuente: resultado.fuente,
              count: resultado.goleadores?.length || 0,
              top3: resultado.goleadores?.slice(0, 3) || []
            } : null
          }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        } catch(e) {
          return new Response(JSON.stringify({ok:false,error:e.message}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
      }

      // ── Endpoint de diagnóstico para APIs Mundial ──
      if(path==="/mundo/test-apis") {
        const fecha = url.searchParams.get("fecha");
        const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const hoy = ahoraAR.toISOString().split('T')[0];
        const fechaBase = fecha || hoy;
        const report = { fecha: fechaBase, timestamp: new Date().toISOString(), apis: {} };

        // 1) football-data
        try {
          const fd = await obtenerPartidosMundial(env, 2000, fechaBase);
          report.apis['football-data'] = {
            ok: !fd.error,
            count: (fd.partidos || []).length,
            error: fd.error || null,
            partidos: (fd.partidos || []).map(p => ({
              local: p.local, visitante: p.visitante, estado: p.estado,
              golesLocal: p.golesLocal, golesVisitante: p.golesVisitante,
              goleadores: p.goleadores || [],
            })),
          };
        } catch(e) {
          report.apis['football-data'] = { ok: false, error: e.message };
        }

        // 2) API-Football
        try {
          const af = await obtenerPartidosAPIFootball(env, fechaBase);
          report.apis['api-football'] = {
            ok: !af.error,
            count: (af.partidos || []).length,
            error: af.error || null,
            totalSeason: af.totalSeason || null,
            _debug: af._debug || null,
            partidos: (af.partidos || []).map(p => ({
              id: p.id, local: p.local, visitante: p.visitante, estado: p.estado,
              estadio: p.estadio || '(vacío)', arbitro: p.arbitro || null,
              golesLocal: p.golesLocal, golesVisitante: p.golesVisitante,
            })),
          };
        } catch(e) {
          report.apis['api-football'] = { ok: false, error: e.message };
        }

        // 2b) API-Football RAW (llamada directa sin procesar)
        try {
          const afUrl = `${API_FOOTBALL_URL}/fixtures?league=1&season=2026`;
          const afRaw = await fetch(afUrl, { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } });
          const afData = await afRaw.json();
          const allCount = afData.response?.length || 0;
          // Contar cuántos fixtures hay para la fecha solicitada
          const fixturesForDate = (afData.response || []).filter(f => {
            try {
              const info = calcularFechaPlaca(f.fixture.date);
              return info.fechaPlaca === fechaBase;
            } catch(e) { return false; }
          });
          report.apis['api-football-raw'] = {
            status: afRaw.status,
            total_fixtures_season: allCount,
            fixtures_for_date: fixturesForDate.length,
            sample_fixture: fixturesForDate[0] ? {
              id: fixturesForDate[0].fixture.id,
              date: fixturesForDate[0].fixture.date,
              status: fixturesForDate[0].fixture.status.short,
              home: fixturesForDate[0].teams.home.name,
              away: fixturesForDate[0].teams.away.name,
            } : null,
            date_filter_used: fechaBase,
          };
        } catch(e) {
          report.apis['api-football-raw'] = { ok: false, error: e.message };
        }

        // 3) TheSportsDB
        try {
          const tsdb = await obtenerPartidosTheSportsDB(env, fechaBase);
          report.apis['thesportsdb'] = {
            ok: !tsdb.error,
            count: (tsdb.partidos || []).length,
            error: tsdb.error || null,
            partidos: (tsdb.partidos || []).map(p => ({
              local: p.local, visitante: p.visitante,
              estadio: p.estadio || '(vacío)',
            })),
          };
        } catch(e) {
          report.apis['thesportsdb'] = { ok: false, error: e.message };
        }

        // 3b) Zafronix (RAW - para ver qué datos tiene)
        try {
          if (env.ZAFRONIX_KEY) {
            const zRes = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
              headers: { 'X-API-Key': env.ZAFRONIX_KEY }
            });
            if (zRes.ok) {
              const zData = await zRes.json();
              const zMatches = zData.data || [];
              // Filtrar por fecha (formato YYYY-MM-DD)
              const zForDate = zMatches.filter(m => {
                try {
                  const mDate = new Date(m.date || m.kickOff || m.datetime);
                  const arDate = new Date(mDate.getTime() - 3 * 60 * 60 * 1000);
                  return arDate.toISOString().split('T')[0] === fechaBase;
                } catch(e) { return false; }
              });
              report.apis['zafronix-raw'] = {
                ok: true,
                total_matches: zMatches.length,
                matches_for_date: zForDate.length,
                sample: zForDate[0] || null,
                // Mostrar goals/lineups/cards de TODOS los matches de la fecha
                all_matches_detail: zForDate.map(m => ({
                  id: m.id,
                  home: m.homeTeam,
                  away: m.awayTeam,
                  status: m.status,
                  homeScore: m.homeScore,
                  awayScore: m.awayScore,
                  goals: m.goals || null,
                  cards: m.cards || null,
                  lineups: m.lineups ? 'present' : null,
                  formations: m.formations || null,
                  referee: m.referee || null,
                  liveMinute: m.liveMinute || null,
                })),
                all_fields_sample: zMatches[0] ? Object.keys(zMatches[0]) : [],
              };
            } else {
              report.apis['zafronix-raw'] = { ok: false, status: zRes.status };
            }
          } else {
            report.apis['zafronix-raw'] = { ok: false, error: 'ZAFRONIX_KEY not configured' };
          }
        } catch(e) {
          report.apis['zafronix-raw'] = { ok: false, error: e.message };
        }

        // 4) Combinado (para ver si el enriquecimiento funciona)
        try {
          const comb = await obtenerPartidosCombinados(env, fechaBase);
          report.apis['combinado'] = {
            ok: true,
            count: (comb.partidos || []).length,
            debug: comb.debug || null,
            partidos: (comb.partidos || []).map(p => ({
              local: p.local, visitante: p.visitante, estado: p.estado,
              afFixtureId: p.afFixtureId || null,
              estadio: p.estadio || '(vacío)',
              ciudad: p.ciudad || null, arbitro: p.arbitro || null,
              golesLocal: p.golesLocal, golesVisitante: p.golesVisitante,
              goleadores: p.goleadores || [],
              eventos_count: (p.eventos || []).length,
              formacionLocal: p.formacionLocal ? true : false,
            })),
          };
        } catch(e) {
          report.apis['combinado'] = { ok: false, error: e.message };
        }

        return new Response(JSON.stringify(report, null, 2),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      return jsonError("Ruta no encontrada",404);
    }

    // ── DELETE ──
    if(request.method==="DELETE"){
      if(path==="/fuentes")                          return handleDeleteFuente(url,env);
      if(path==="/notas")                            return handleDeleteNota(url,env);
      if(path==="/whatsapp/programado")              return handleDeleteWhatsappProgramado(url,env);
      if(path==="/agenda/evento")                    return handleDeleteAgendaEvento(url,env);
      if(path==="/agenda/efemeride")                 return handleDeleteAgendaEfemeride(url,env);
      if(path==="/studio/proyecto")                  return handleStudioEliminarProyecto(url, env);
      return jsonError("Ruta no encontrada",404);
    }

    if(request.method!=="POST") return jsonError("Método no permitido",405);

        // ============================================================
    // PRIMERO: rutas que NO usan JSON (FormData)
    // ============================================================
    if (path === "/studio/transcribir") {
      return handleStudioTranscribir(request, env);
    }
   if (path === "/video-editor/transcribir") {
      return handleVideoEditorTranscribir(request, env);
    }
    if (path === "/api/transcribe") {
      return handleStudioTranscribir(request, env);
    }
    if (path === "/procesar-imagenes") {
      return handleProcesarImagenes(request, env);
    }

    // ============================================================
    // DESPUÉS: rutas que usan JSON
    // ============================================================
    let body; 
    try {
      body = await request.json();
    } catch(e) {
      return jsonError("JSON inválido", 400);
    }

    // ── POST con JSON ──
    if(path==="/"&&url.searchParams.get("ai")==="1") return handlePlacasAI(request,env,body);
    if(path==="/titulares")                          return handleTitulares(body,env);
    if(path==="/reformular")                         return handleReformular(body,env);
    if(path==="/fuentes")                            return handlePostFuente(body,env);
    if(path==="/editorial")                          return handlePostEditorial(body,env);
    if(path==="/cubiertas")                          return handlePostCubierta(body,env);
    if(path==="/redactar")                           return handleRedactar(body,env);
    if(path==="/notas")                              return handlePostNota(body,env);
    if(path==="/whatsapp/generar")                   return handleWhatsappGenerar(body,env);
    if(path==="/whatsapp/programar")                 return handlePostWhatsappProgramar(body,env);
    if(path==="/whatsapp/marcar-enviado")            return handlePostWhatsappMarcarEnviado(body,env);
    if(path==="/whatsapp/config/prompt")             return handlePostWaPrompt(body,env);
    if(path==="/whatsapp/config/links")              return handlePostWaLinks(body,env);
    if(path==="/social/prompt")                      return handlePostSocialPrompt(body,env);
    if(path==="/social/generar")                     return handleSocialGenerar(body,env);
    if(path==="/social/reel/guion")                  return handleReelGuion(body,env);
    if(path==="/social/reel/audio")                  return handleReelAudio(body,env);
    if(path==="/social/reel/config")                 return handlePostReelConfig(body,env);
    if(path==="/agenda/evento")                      return handlePostAgendaEvento(body,env);
    if(path==="/agenda/efemeride")                   return handlePostAgendaEfemeride(body,env);
    if(path==="/agenda/angulos")                     return handleAgendaAngulos(body,env);
    if(path==="/resumen/generar")                    return handleResumenGenerar(body, env);
    if(path==="/resumen/agregar")                    return handleResumenAgregar(body, env);
    if(path==="/resumen/eliminar")                   return handleResumenEliminar(body, env);
    if(path==="/resumen/generar-guion-reel")         return handleGenerarGuionReel(body, env);
    if(path==="/studio/generar-vtt")                 return handleStudioGenerarVTT(request, env);
    if(path==="/studio/proyecto")                    return handleStudioGuardarProyecto(body, env);
    if(path==="/api/suggest-cuts")                   return handleVideoEditorSuggestCuts(body, env);
    if(path==="/api/generate-headline")              return handleGenerateHeadline(request, env);
    if(path==="/smn/update-token")                   return handleSMNUpdateToken(body, env);

    return jsonError("Ruta no encontrada",404);
  },
  // Handler para la cola
  async queue(batch, env) {
    return queue(batch, env);
  }
};