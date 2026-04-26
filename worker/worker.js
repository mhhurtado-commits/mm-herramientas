// ============================================================
// Media Mendoza — Worker v13
// TTS: Azure Cognitive Services (sin ElevenLabs)
// Voces argentinas por defecto en KV
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const GEMINI_MODEL     = "gemini-2.5-flash-lite";
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
const LOGO_URL         = "https://mediamendoza.pages.dev/assets/logo.png";

// Voces argentinas disponibles en Azure free tier
const VOCES_DEFAULT = [
  { id: "es-AR-TomasNeural",  nombre: "Tomás (Hombre AR)",  keyAlias: "AZURE_TTS_KEY_1", region: "AZURE_TTS_REGION_1" },
  { id: "es-AR-ElenaNeural",  nombre: "Elena (Mujer AR)",   keyAlias: "AZURE_TTS_KEY_1", region: "AZURE_TTS_REGION_1" }
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

// ── Router ──
export default {
  async fetch(request, env) {
    if(request.method==="OPTIONS") return new Response(null,{headers:CORS_HEADERS});
    const url=new URL(request.url);
    const path=url.pathname;

    if(path==="/"){
      if(request.method==="GET"&&url.searchParams.has("url"))   return handlePlacasUrl(url);
      if(request.method==="GET"&&url.searchParams.has("image")) return handlePlacasImage(url);
      if(request.method==="POST"&&url.searchParams.get("ai")==="1") return handlePlacasAI(request,env);
    }

    if(request.method==="GET"){
      if(path==="/rss")                        return handleRSS(url);
      if(path==="/verificar")                  return handleVerificar(url);
      if(path==="/scrape")                     return handleScrape(url);
      if(path==="/fuentes")                    return handleGetFuentes(env);
      if(path==="/editorial")                  return handleGetEditorial(env);
      if(path==="/cubiertas")                  return handleGetCubiertas(env);
      if(path==="/notas")                      return handleGetNotas(env);
      if(path==="/whatsapp/programados")       return handleGetWhatsappProgramados(env);
      if(path==="/whatsapp/config/prompt")     return handleGetWaPrompt(env);
      if(path==="/whatsapp/config/links")      return handleGetWaLinks(env);
      if(path==="/social/prompt")              return handleGetSocialPrompt(url,env);
      if(path==="/social/reel/config")         return handleGetReelConfig(env);
      if(path==="/agenda/eventos")             return handleGetAgendaEventos(url,env);
      if(path==="/agenda/efemerides")          return handleGetAgendaEfemerides(env);
      if(path==="/agenda/angulos/cache")       return handleGetAngulosCache(url,env);
      if(path==="/redactar")                   return jsonError("Usar POST",405);
      return jsonError("Ruta no encontrada",404);
    }

    if(request.method==="DELETE"){
      if(path==="/fuentes")                    return handleDeleteFuente(url,env);
      if(path==="/notas")                      return handleDeleteNota(url,env);
      if(path==="/whatsapp/programado")        return handleDeleteWhatsappProgramado(url,env);
      if(path==="/agenda/evento")              return handleDeleteAgendaEvento(url,env);
      if(path==="/agenda/efemeride")           return handleDeleteAgendaEfemeride(url,env);
      if(path==="/social/reel/borrar")         return handleDeleteReel(url,env);
      return jsonError("Ruta no encontrada",404);
    }

    if(request.method!=="POST") return jsonError("Metodo no permitido",405);
    let body; try{body=await request.json()}catch{return jsonError("JSON invalido",400)}

    if(path==="/titulares")                    return handleTitulares(body,env);
    if(path==="/reformular")                   return handleReformular(body,env);
    if(path==="/fuentes")                      return handlePostFuente(body,env);
    if(path==="/editorial")                    return handlePostEditorial(body,env);
    if(path==="/cubiertas")                    return handlePostCubierta(body,env);
    if(path==="/redactar")                     return handleRedactar(body,env);
    if(path==="/notas")                        return handlePostNota(body,env);
    if(path==="/whatsapp/generar")             return handleWhatsappGenerar(body,env);
    if(path==="/whatsapp/programar")           return handlePostWhatsappProgramar(body,env);
    if(path==="/whatsapp/marcar-enviado")      return handlePostWhatsappMarcarEnviado(body,env);
    if(path==="/whatsapp/config/prompt")       return handlePostWaPrompt(body,env);
    if(path==="/whatsapp/config/links")        return handlePostWaLinks(body,env);
    if(path==="/social/prompt")                return handlePostSocialPrompt(body,env);
    if(path==="/social/generar")               return handleSocialGenerar(body,env);
    if(path==="/social/reel/guion")            return handleReelGuion(body,env);
    if(path==="/social/reel/generar")          return handleReelGenerar(body,env);
    if(path==="/social/reel/config")           return handlePostReelConfig(body,env);
    if(path==="/agenda/evento")                return handlePostAgendaEvento(body,env);
    if(path==="/agenda/efemeride")             return handlePostAgendaEfemeride(body,env);
    if(path==="/agenda/angulos")               return handleAgendaAngulos(body,env);

    return jsonError("Ruta no encontrada",404);
  },
};

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

// ============================================================
// REEL — GUION (Gemini)
// ============================================================
async function handleReelGuion(body,env){
  const articulo = String(body.articulo||"").trim();
  if(!articulo) return jsonError("Falta campo: articulo",400);
  const promptBase = await env.KV.get(REEL_PROMPT_KEY,"text").catch(()=>null) || REEL_PROMPT_DEFAULT;
  const r = await callGemini(promptBase + `\n\nARTÍCULO:\n${articulo.substring(0,3000)}`, env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk({titulo: r.data?.titulo||"", guion: r.data?.guion||""});
}

// ============================================================
// REEL — GENERAR VIDEO (Azure TTS + Creatomate + R2)
// ============================================================
async function handleReelGenerar(body,env){
  const guion     = String(body.guion||"").trim();
  const titulo    = String(body.titulo||"").trim();
  const imagenUrl = String(body.imagenUrl||"").trim();
  const voiceId   = String(body.voiceId||VOCES_DEFAULT[0].id).trim();

  if(!guion)  return jsonError("Falta campo: guion",400);
  if(!titulo) return jsonError("Falta campo: titulo",400);

  // ── 1. Azure TTS ──
  // Buscar la voz en KV para obtener su key y region
  const vocesKV = await env.KV.get(REEL_VOCES_KEY,"json").catch(()=>null) || VOCES_DEFAULT;
  const vozData = vocesKV.find(v => v.id === voiceId) || vocesKV[0];

  // Intentar con la voz elegida; si falla por cuota, probar las demás
  const intentos = [vozData, ...vocesKV.filter(v => v.id !== vozData.id)];

  let audioBuffer = null;
  const ttsErrors = [];

  for(const voz of intentos){
    const keyName    = voz.keyAlias || "AZURE_TTS_KEY_1";
    const regionName = voz.region   || "AZURE_TTS_REGION_1";
    const azureKey    = String(env[keyName]    || "").trim();
    const azureRegion = String(env[regionName] || "").trim();

    if(!azureKey || !azureRegion){
      ttsErrors.push(`${voz.nombre}: secrets "${keyName}" o "${regionName}" no configurados`);
      continue;
    }

    const locale = localeFromVoice(voz.id);
    const ssml = `<speak version="1.0" xml:lang="${locale}"><voice name="${escapeXml(voz.id)}">${escapeXml(guion)}</voice></speak>`;

    try{
      const res = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,{
        method: "POST",
        headers:{
          "Ocp-Apim-Subscription-Key": azureKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
          "User-Agent": "mm-worker"
        },
        body: ssml
      });

      if(res.status === 429){
        ttsErrors.push(`${voz.nombre}: cuota agotada`);
        continue;
      }
      if(!res.ok){
        const errBody = await res.text().catch(()=>"");
        ttsErrors.push(`${voz.nombre}: HTTP ${res.status} → ${errBody.substring(0,200)}`);
        continue;
      }

      const buf = await res.arrayBuffer();
      if(buf.byteLength > 100){ audioBuffer = buf; break; }
      ttsErrors.push(`${voz.nombre}: audio vacío`);

    }catch(e){
      ttsErrors.push(`${voz.nombre}: ${e.message}`);
    }
  }

  if(!audioBuffer) return jsonError(`Azure TTS falló: ${ttsErrors.join(" | ")}`,502);

  // ── 2. R2: guardar audio ──
  if(!env.R2)        return jsonError("Binding R2 no configurado",500);
  if(!env.R2_PUBLIC_ID) return jsonError("R2_PUBLIC_ID no configurado",500);

  const reelId   = generarId("reel_");
  const audioKey = `${reelId}/audio.mp3`;
  const videoKey = `${reelId}/video.mp4`;

  try{
    await env.R2.put(audioKey, audioBuffer,{
      httpMetadata:{ contentType:"audio/mpeg" },
      customMetadata:{ reelId, expira: String(Date.now()+86400000) }
    });
  }catch(err){ return jsonError("Error R2 (audio): "+err.message,500); }

  const audioPublicUrl = `https://pub-${env.R2_PUBLIC_ID}.r2.dev/${audioKey}`;

  // ── 3. Creatomate ──
  const creatomateKeys = [
    env.CREATOMATE_KEY_1, env.CREATOMATE_KEY_2, env.CREATOMATE_KEY_3,
    env.CREATOMATE_KEY_4, env.CREATOMATE_KEY_5
  ].filter(Boolean);

  if(!creatomateKeys.length){
    await env.R2.delete(audioKey).catch(()=>{});
    return jsonError("No hay API keys de Creatomate",500);
  }

  const template = {
    output_format: "mp4",
    width: 1080, height: 1920, frame_rate: 30,
    elements: [
      // Imagen de fondo
      {
        type:"image", track:1, time:0,
        x:"50%", y:"50%", width:"100%", height:"100%",
        x_anchor:"50%", y_anchor:"50%",
        source: imagenUrl || LOGO_URL, fit:"cover"
      },
      // Overlay oscuro
      {
        type:"shape", track:2, time:0, shape:"rectangle",
        x:"50%", y:"50%", width:"100%", height:"100%",
        x_anchor:"50%", y_anchor:"50%",
        fill_color:"rgba(0,0,0,0.45)"
      },
      // Logo
      {
        type:"image", track:3, time:0,
        x:"50%", y:"7%", width:"36%",
        x_anchor:"50%", y_anchor:"50%",
        source: LOGO_URL, fit:"contain"
      },
      // Título: aparece 3 segundos y desaparece
      {
        type:"text", track:4, time:0, duration:3,
        x:"50%", y:"45%", width:"86%",
        x_anchor:"50%", y_anchor:"50%",
        text: titulo,
        font_family:"Montserrat", font_weight:"700",
        font_size:68, fill_color:"#ffffff",
        text_align:"center", line_height:1.15,
        animations:[
          { time:"start", duration:0.5, easing:"ease-out", type:"slide", direction:"up" },
          { time:"end",   duration:0.4, easing:"ease-in",  type:"fade" }
        ]
      },
      // Subtítulos: arrancan en segundo 3
      {
        type:"text", track:5, time:3,
        x:"50%", y:"80%", width:"88%",
        x_anchor:"50%", y_anchor:"50%",
        text: guion,
        font_family:"Montserrat", font_weight:"500",
        font_size:34, fill_color:"#ffffff",
        background_color:"rgba(0,0,0,0.65)",
        background_x_padding:"5%", background_y_padding:"4%",
        text_align:"center", line_height:1.55,
        animations:[{ time:"start", duration:0.4, easing:"ease-out", type:"fade" }]
      },
      // Audio
      {
        type:"audio", track:6, time:0,
        source: audioPublicUrl, audio_fade_out:0.5
      }
    ]
  };

  let renderId = null;
  let creatomateError = "";
  for(const key of creatomateKeys){
    try{
      const res = await fetch("https://api.creatomate.com/v1/renders",{
        method:"POST",
        headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
        body: JSON.stringify({ source: template })
      });
      if(res.status===429){ creatomateError="Límite Creatomate"; continue; }
      if(res.status===401){ creatomateError="Key Creatomate inválida"; continue; }
      if(!res.ok){
        const errBody = await res.text().catch(()=>"");
        creatomateError = `HTTP ${res.status}: ${errBody.substring(0,300)}`;
        continue;
      }
      const data = await res.json();
      renderId = data?.[0]?.id || null;
      if(renderId) break;
      creatomateError = "No se recibió render ID";
    }catch(e){ creatomateError = e.message; continue; }
  }

  if(!renderId){
    await env.R2.delete(audioKey).catch(()=>{});
    return jsonError(`Creatomate: ${creatomateError}`,502);
  }

  // ── 4. Polling ──
  let videoFinalUrl = null;
  const startTime = Date.now();
  while(Date.now()-startTime < 110000){
    await sleep(5000);
    try{
      const poll = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`,{
        headers:{"Authorization":"Bearer "+creatomateKeys[0]}
      });
      const d = await poll.json();
      if(d.status==="succeeded"){ videoFinalUrl = d.url; break; }
      if(d.status==="failed"){
        await env.R2.delete(audioKey).catch(()=>{});
        return jsonError(`Render falló: ${JSON.stringify(d.error||"")}`,502);
      }
    }catch(e){ break; }
  }

  if(!videoFinalUrl){
    await env.R2.delete(audioKey).catch(()=>{});
    return jsonError("Timeout: render tardó más de 110 segundos",504);
  }

  // ── 5. Guardar video en R2 ──
  try{
    const vRes = await fetch(videoFinalUrl);
    if(vRes.ok){
      const vBuf = await vRes.arrayBuffer();
      await env.R2.put(videoKey, vBuf,{
        httpMetadata:{ contentType:"video/mp4" },
        customMetadata:{ reelId, expira: String(Date.now()+86400000) }
      });
    }
  }catch(e){}

  // ── 6. Limpiar audio de R2 ──
  await env.R2.delete(audioKey).catch(()=>{});

  return jsonOk({ reelId, videoKey, videoUrl: videoFinalUrl, titulo, guion });
}

// ============================================================
// REEL — BORRAR de R2
// ============================================================
async function handleDeleteReel(url,env){
  const key = url.searchParams.get("key");
  if(!key) return jsonError("Falta parámetro key",400);
  try{ await env.R2.delete(key); return jsonOk({eliminado:true}); }
  catch(err){ return jsonError("Error R2: "+err.message,500); }
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
  try{new URL(targetUrl)}catch{return jsonError("URL invalida",400)}
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
  try{new URL(targetUrl)}catch{return jsonError("URL invalida",400)}
  try{const{html}=await fetchHtml(targetUrl,300);const data=extraerDatosNota(html,targetUrl);if(!data.title&&!data.body) return jsonError("No se pudo extraer contenido",422);return jsonOk(data)}
  catch(err){return jsonError(`Error: ${err.message}`,502)}
}
async function handlePlacasImage(url){
  const imageUrl=url.searchParams.get("image");if(!imageUrl) return jsonError("image requerida",400);
  try{new URL(imageUrl)}catch{return jsonError("URL invalida",400)}
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
async function handlePlacasAI(request,env){
  let body;try{body=await request.json()}catch{return jsonError("JSON invalido",400)}
  const system=String(body.system||"").trim();const user=String(body.user||"").trim();
  if(!system||!user) return jsonError("Faltan campos",400);
  const r=await callGemini(`${system}\n\nResponde SOLO con JSON sin backticks:\n{"grupo":"...","canal":"..."}\n\n${user}`,env);
  if(r.error) return jsonError(r.error,500);
  const grupo=limpiarEspacios(r.data?.grupo||"");const canal=limpiarEspacios(r.data?.canal||"");
  if(!grupo&&!canal) return jsonError("IA no devolvio mensajes",502);
  return jsonOk({text:JSON.stringify({grupo,canal})});
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

FORMATO "grupo": [emoji] *[LOCALIDAD/CATEGORÍA]:* [titular]\n[2-3 líneas clave con *negritas*] 👇\n🔗 *DETALLES:* 👉 {URL}\n📱 {LINK_GRUPO} 📣 {LINK_CANAL}\n*📰 Media Mendoza*

FORMATO "canal": [emoji] *[CATEGORÍA]:* [titular]\n• [punto 1]\n• [punto 2]\n• [punto 3]\n🔗 👉 {URL}\n*📰 Media Mendoza*

REGLAS: negritas solo en datos clave, NO **, emojis: policiales=🚨 deportes=⚽ política=🏛️ accidente=🚗 salud=🏥 general=📢`;

async function handleWhatsappGenerar(body,env){
  const notaUrl=String(body.notaUrl||"").trim();
  const contextoExtra=String(body.contextoExtra||"").trim();
  let nota={titulo:String(body.titulo||"").trim(),categoria:String(body.categoria||"").trim(),descripcion:"",body:String(body.contenido||"").trim(),url:notaUrl,urlCorta:notaUrl?acortarUrlNota(notaUrl):"",image:""};
  if(notaUrl){
    try{new URL(notaUrl)}catch{return jsonError("URL invalida",400)}
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
  if(!grupo||!canal) return jsonError("IA no devolvio ambos mensajes",502);
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
  try{new URL(feedUrl)}catch{return jsonError("URL invalida",400)}
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
  try{new URL(feedUrl)}catch{return jsonError("URL invalida",400)}
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