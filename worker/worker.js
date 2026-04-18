// ============================================================
// Media Mendoza — Worker v7
// Cambios respecto a v6:
//   - handleReformular: prompt editorial inyectado correctamente
//   - handleReformular: estilos con instrucciones distintas y concretas
//   - handleTitulares: prompt editorial corregido
//   - handleRedactar: prompt editorial corregido
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const GEMINI_MODEL   = "gemini-2.5-flash-lite";
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const EDITORIAL_KV_KEY = "config:editorial";
const MAX_PROXY_IMAGE_BYTES = 8 * 1024 * 1024;
const WHATSAPP_PREFIX  = "whatsapp:programado:";
const AGENDA_EV_PREFIX = "agenda:evento:";
const AGENDA_EF_PREFIX = "agenda:efemeride:";
const ANGULOS_PREFIX   = "agenda:angulos:";
const ANGULOS_TTL      = 60 * 60 * 24 * 30;

const BROWSER_HEADERS = {
  "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
  "Cache-Control":   "no-cache",
};

// ── Helpers genéricos ──
function esXMLvalido(t){return t.includes("<rss")||t.includes("<feed")||t.includes("<channel")||t.includes("<item")||t.includes("<entry")||(t.trimStart().startsWith("<?xml")&&t.includes("<title"))}
function decodeHtml(text=""){return text.replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'")}
function limpiarEspacios(text=""){return decodeHtml(text).replace(/\s+/g," ").trim()}
function extractMeta(html,...patterns){for(const p of patterns){const m=html.match(p);const v=limpiarEspacios(m?.[1]||"");if(v)return v}return ""}
function normalizarTituloSitio(title=""){return title.replace(/\s+[|\-–—]\s+(Media Mendoza|mediamendoza\.com).*$/i,"").replace(/\s+/g," ").trim()}
function inferirCategoriaDesdeUrl(url){try{const u=new URL(url);const f=u.pathname.split("/").filter(Boolean)[0]||"";return limpiarEspacios(f.replace(/[-_]+/g," "))}catch{return""}}
function generarId(prefix){return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2,8)}`}
function acortarUrlNota(url){try{const u=new URL(url);const p=u.pathname.split("/").filter(Boolean);if(p.length>=2){const n=p[1].match(/^(\d+)/);if(n)return `${u.origin}/${p[0]}/${n[1]}`}return `${u.origin}${u.pathname}`}catch{return url}}
async function listarObjetosKV(env,prefix){const list=await env.KV.list({prefix});const items=[];for(const k of list.keys){const v=await env.KV.get(k.name,"json");if(v)items.push(v)}return items}

function extraerTexto(html){
  html=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<nav[\s\S]*?<\/nav>/gi,'').replace(/<header[\s\S]*?<\/header>/gi,'').replace(/<footer[\s\S]*?<\/footer>/gi,'').replace(/<aside[\s\S]*?<\/aside>/gi,'');
  html=html.replace(/<\/(p|h[1-6]|li|br|div)>/gi,'\n').replace(/<[^>]+>/g,'');
  html=html.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  return html.split('\n').map(l=>l.trim()).filter(l=>l.length>30).slice(0,80).join('\n');
}
async function fetchHtml(url,cacheTtl=300){
  const res=await fetch(url,{headers:BROWSER_HEADERS,redirect:"follow",cf:{cacheTtl,cacheEverything:true}});
  if(!res.ok) throw new Error(`Error ${res.status} al obtener la URL`);
  return {res,html:await res.text()};
}
function extraerDatosNota(html,url){
  const title=normalizarTituloSitio(extractMeta(html,/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,300})["']/i,/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']{1,300})["']/i,/<title[^>]*>([^<]{1,300})<\/title>/i));
  const description=extractMeta(html,/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i,/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i);
  const image=extractMeta(html,/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,1500})["']/i,/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']{1,1500})["']/i);
  const category=extractMeta(html,/<meta[^>]+property=["']article:section["'][^>]+content=["']([^"']{1,120})["']/i,/<meta[^>]+name=["']section["'][^>]+content=["']([^"']{1,120})["']/i)||inferirCategoriaDesdeUrl(url);
  return {title,category,description,body:extraerTexto(html),image,url};
}

// ── Router principal ──
export default {
  async fetch(request, env) {
    if(request.method==="OPTIONS") return new Response(null,{headers:CORS_HEADERS});
    const url=new URL(request.url);
    const path=url.pathname;

    if(path==="/"){
      if(request.method==="GET"&&url.searchParams.has("url"))  return handlePlacasUrl(url);
      if(request.method==="GET"&&url.searchParams.has("image"))return handlePlacasImage(url);
      if(request.method==="POST"&&url.searchParams.get("ai")==="1") return handlePlacasAI(request,env);
    }

    if(request.method==="GET"){
      if(path==="/rss")                      return handleRSS(url);
      if(path==="/verificar")                return handleVerificar(url);
      if(path==="/scrape")                   return handleScrape(url);
      if(path==="/fuentes")                  return handleGetFuentes(env);
      if(path==="/editorial")                return handleGetEditorial(env);
      if(path==="/cubiertas")                return handleGetCubiertas(env);
      if(path==="/notas")                    return handleGetNotas(env);
      if(path==="/whatsapp/programados")     return handleGetWhatsappProgramados(env);
      if(path==="/agenda/eventos")           return handleGetAgendaEventos(url,env);
      if(path==="/agenda/efemerides")        return handleGetAgendaEfemerides(env);
      if(path==="/agenda/angulos/cache")     return handleGetAngulosCache(url,env);
      if(path==="/redactar")                 return jsonError("Usar POST",405);
      return jsonError("Ruta no encontrada",404);
    }

    if(request.method==="DELETE"){
      if(path==="/fuentes")                  return handleDeleteFuente(url,env);
      if(path==="/notas")                    return handleDeleteNota(url,env);
      if(path==="/whatsapp/programado")      return handleDeleteWhatsappProgramado(url,env);
      if(path==="/agenda/evento")            return handleDeleteAgendaEvento(url,env);
      if(path==="/agenda/efemeride")         return handleDeleteAgendaEfemeride(url,env);
      return jsonError("Ruta no encontrada",404);
    }

    if(request.method!=="POST") return jsonError("Metodo no permitido",405);
    let body; try{body=await request.json()}catch{return jsonError("JSON invalido",400)}

    if(path==="/titulares")                  return handleTitulares(body,env);
    if(path==="/reformular")                 return handleReformular(body,env);
    if(path==="/fuentes")                    return handlePostFuente(body,env);
    if(path==="/editorial")                  return handlePostEditorial(body,env);
    if(path==="/cubiertas")                  return handlePostCubierta(body,env);
    if(path==="/redactar")                   return handleRedactar(body,env);
    if(path==="/notas")                      return handlePostNota(body,env);
    if(path==="/whatsapp/generar")           return handleWhatsappGenerar(body,env);
    if(path==="/whatsapp/programar")         return handlePostWhatsappProgramar(body,env);
    if(path==="/whatsapp/marcar-enviado")    return handlePostWhatsappMarcarEnviado(body,env);
    if(path==="/agenda/evento")              return handlePostAgendaEvento(body,env);
    if(path==="/agenda/efemeride")           return handlePostAgendaEfemeride(body,env);
    if(path==="/agenda/angulos")             return handleAgendaAngulos(body,env);

    return jsonError("Ruta no encontrada",404);
  },
};

// ============================================================
// TITULARES / REFORMULAR / REDACTAR
// ============================================================

// Descripciones detalladas de cada estilo — diferencias reales de estructura y tono
const ESTILOS_DESC = {
  formal: `
ESTILO: Periodístico formal (pirámide invertida clásica).
- Primer párrafo: responde qué, quién, cuándo, dónde, por qué en máximo 2 oraciones.
- Cuerpo: desarrolla en orden de importancia descendente.
- Lenguaje neutro, sin adjetivos valorativos, sin opinión.
- Verbos en pasado simple o presente de actualidad ("dijo", "anunció", "es").
- Titular: sustantivo + verbo + dato central, máximo 10 palabras.
- Extensión: 4 párrafos.`,

  directo: `
ESTILO: Directo y conciso — máxima información en mínimas palabras.
- Titular: el dato más impactante, máximo 7 palabras, sin verbo de atribución.
- Cuerpo: máximo 3 párrafos cortos (2-3 oraciones cada uno).
- Sin contexto histórico extenso, sin citas largas.
- Cada oración debe poder eliminarse sin que se pierda la noticia central.
- Lenguaje simple, sin tecnicismos.`,

  ampliado: `
ESTILO: Con contexto ampliado — periodismo de profundidad.
- Titular informativo pero con matiz explicativo.
- Primer párrafo: el hecho central.
- Segundo párrafo: antecedentes y contexto histórico o político relevante.
- Tercer párrafo: datos complementarios, cifras, comparaciones.
- Cuarto párrafo: perspectivas o posibles consecuencias.
- Quinto párrafo (cierre): declaración o dato de cierre que dé perspectiva.
- Extensión: 5 párrafos.`,

  breaking: `
ESTILO: Urgente / breaking news — información en tiempo real.
- Titular: alerta máxima, verbo en presente, máximo 8 palabras. Puede empezar con "URGENTE:" o "ALERTA:".
- Primer párrafo: el hecho en una sola oración, presente o pasado inmediato.
- Segundo párrafo: lo que se sabe hasta ahora.
- Tercer párrafo: lo que falta confirmar o lo que se espera.
- Sin especulación, solo datos verificados.
- Tono: velocidad y precisión sobre elegancia.`,

  cronica: `
ESTILO: Crónica narrativa — periodismo literario.
- Titular: evocador, puede ser una imagen o frase memorable, no solo informativo.
- Primer párrafo: escena o detalle concreto que "entra" al lector en la historia (no el dato central).
- Segundo párrafo: quién o qué está en el centro de la historia.
- Tercer párrafo: el hecho noticioso, ahora que el lector ya está enganchado.
- Cuarto párrafo: contexto y consecuencias.
- Cierre: detalle que resuena con la apertura o reflexión breve.
- Uso de descripciones, metáforas breves, ritmo variado.`,

  redes: `
ESTILO: Optimizado para redes sociales — formato digital nativo.
- Titular: gancho inmediato, puede ser pregunta retórica o dato sorprendente.
- Cuerpo: párrafos de máximo 2 oraciones, separados con línea en blanco.
- Incluir datos concretos y cifras si están disponibles (generan más engagement).
- Último párrafo: dato de cierre o pregunta que invite a comentar.
- Lenguaje coloquial pero correcto, sin ser informal en exceso.
- Máximo 3 párrafos en total.`,

  institucional: `
ESTILO: Comunicado institucional — voz oficial.
- Titular: formal, puede empezar con el nombre del organismo o funcionario.
- Estructura: hecho → justificación o contexto normativo → declaración oficial → datos técnicos si aplica.
- Uso de tercera persona siempre.
- Sin opinión editorial, sin adjetivos valorativos propios del periodismo.
- Frases completas, tono solemne pero claro.
- Puede incluir cita textual de declaración oficial como párrafo separado entre comillas.
- Extensión: 4 párrafos.`
};

async function handleTitulares(body, env) {
  const { modo, contenido, contexto = "", tono = "informativo", cantidad = 5 } = body;
  if (!modo || !contenido) return jsonError("Faltan campos: modo y contenido", 400);

  const editorial = await getEditorial(env);
  const bloqueEditorial = editorial
    ? `\nLÍNEA EDITORIAL (seguí estas reglas sin excepción en TODOS los titulares):\n"""\n${editorial}\n"""\n`
    : "";
  const bloqueContexto = contexto ? `\nCONTEXTO ADICIONAL:\n"""\n${contexto}\n"""\n` : "";

  const instruccionContenido = modo === "nota"
    ? `Analizá este texto y generá exactamente ${cantidad} titulares con distintos enfoques.\n\nTEXTO:\n"""\n${contenido}\n"""`
    : `Generá exactamente ${cantidad} titulares sobre:\n"""\n${contenido}\n"""`;

  const prompt = `Sos el editor del diario digital mendocino Media Mendoza.
${bloqueEditorial}
${instruccionContenido}
${bloqueContexto}
Tono: ${tono}. Cada titular debe tener un enfoque diferente.
Respondé SOLO con JSON sin backticks ni explicaciones:
{"titulares":["T1","T2"],"angulos":[{"nombre":"N","descripcion":"D"}]}`;

  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  return jsonOk(r.data);
}

async function handleReformular(body, env) {
  const { titulo, contenido, contexto = "", estilo = "formal" } = body;
  if (!titulo || !contenido) return jsonError("Faltan campos: titulo y contenido", 400);

  const editorial = await getEditorial(env);

  // Bloque editorial: se inyecta con instrucción explícita de cumplimiento
  const bloqueEditorial = editorial
    ? `LÍNEA EDITORIAL — OBLIGATORIO CUMPLIR EN TODA LA NOTA:
Las siguientes reglas definen la voz y el estilo del diario. Respetá cada punto sin excepción.
"""
${editorial}
"""
`
    : "";

  const estiloInstrucciones = ESTILOS_DESC[estilo] || ESTILOS_DESC.formal;
  const bloqueContexto = contexto ? `\nINFORMACIÓN ADICIONAL PARA ENRIQUECER LA NOTA:\n"""\n${contexto}\n"""\n` : "";

  const prompt = `Sos redactor del diario digital mendocino Media Mendoza (sur de Mendoza, Argentina).

${bloqueEditorial}
Reformulá completamente la siguiente nota. No copies frases del original. Reescribí con tus propias palabras.

NOTA ORIGINAL:
Título: "${titulo}"
Cuerpo:
"""
${contenido}
"""
${bloqueContexto}
${estiloInstrucciones}

Generá también 4 o 5 hashtags relevantes en español para redes sociales.

Respondé SOLO con JSON sin backticks ni explicaciones:
{"titular":"...","cuerpo":"Párrafo 1...\n\nPárrafo 2...\n\nPárrafo 3...","categoria_sugerida":"...","hashtags":["#h1","#h2"]}`;

  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  return jsonOk(r.data);
}

async function handleRedactar(body, env) {
  const { ideas, buscarWeb = false } = body;
  if (!ideas) return jsonError("Falta campo: ideas", 400);

  const editorial = await getEditorial(env);

  const bloqueEditorial = editorial
    ? `LÍNEA EDITORIAL — OBLIGATORIO CUMPLIR EN TODA LA NOTA:
"""
${editorial}
"""
`
    : "Redactor profesional del diario digital Media Mendoza, sur de Mendoza (San Rafael, Argentina). Estilo formal periodístico, pirámide invertida, no inventar datos, SEO natural.";

  const instruccionBusqueda = buscarWeb
    ? "Buscá contexto adicional en la web para enriquecer la nota con datos actuales."
    : "Redactá solo con la información provista, sin inventar datos.";

  const schema = '{"titular":"","bajada":"","cuerpo":"Párrafo 1...\n\nPárrafo 2...","categoria_sugerida":"","hashtags":[],"fuentes":[]}';

  const prompt = `${bloqueEditorial}

CONTENIDO A REDACTAR:
${ideas}

${instruccionBusqueda}

Generá una nota periodística completa con titular, bajada, cuerpo (mínimo 3 párrafos separados por línea en blanco), categoría sugerida y hashtags.

Respondé SOLO con JSON sin backticks. En el campo "cuerpo" usá \\n\\n entre párrafos. Sin prefijos P1, P2:
${schema}`;

  const fn = buscarWeb ? callGeminiConBusqueda : callGemini;
  const r = await fn(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  return jsonOk(r.data);
}

// ============================================================
// AGENDA — EFEMÉRIDES KV
// ============================================================

async function handleGetAgendaEfemerides(env){
  try{
    const efemerides=await listarObjetosKV(env,AGENDA_EF_PREFIX);
    efemerides.sort((a,b)=>a.mes-b.mes||a.dia-b.dia);
    return jsonOk({efemerides});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}

async function handlePostAgendaEfemeride(body,env){
  const titulo=String(body.titulo||"").trim();
  const dia   =parseInt(body.dia)||0;
  const mes   =parseInt(body.mes)||0;
  if(!titulo||!dia||!mes||dia<1||dia>31||mes<1||mes>12)
    return jsonError("Faltan campos válidos: titulo, dia, mes",400);

  const efemeride={
    id:          body.id||generarId("ef_"),
    titulo,
    tituloBase:  body.tituloBase||titulo,
    dia,
    mes,
    tipo:        String(body.tipo||"efemeride").trim(),
    alcance:     String(body.alcance||"local").trim(),
    descripcion: String(body.descripcion||"").trim(),
    creado:      body.creado||Date.now(),
  };
  try{
    await env.KV.put(`${AGENDA_EF_PREFIX}${efemeride.id}`, JSON.stringify(efemeride));
    return jsonOk({guardado:true,id:efemeride.id,efemeride});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}

async function handleDeleteAgendaEfemeride(url,env){
  const id=url.searchParams.get("id");
  if(!id) return jsonError("Falta id",400);
  try{
    await env.KV.delete(`${AGENDA_EF_PREFIX}${id}`);
    return jsonOk({eliminado:true});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// AGENDA — ÁNGULOS IA
// ============================================================

async function handleGetAngulosCache(url,env){
  const key=String(url.searchParams.get("key")||"").trim();
  if(!key) return jsonError("Falta parametro key",400);
  try{
    const val=await env.KV.get(ANGULOS_PREFIX+key,"json");
    return jsonOk({data:val||null});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}

async function handleAgendaAngulos(body,env){
  const titulo=String(body.titulo||"").trim();
  if(!titulo) return jsonError("Falta campo: titulo",400);
  const kvKey=String(body.kvKey||"").trim();

  if(kvKey){
    try{const cached=await env.KV.get(ANGULOS_PREFIX+kvKey,"json");if(cached) return jsonOk({...cached,fromCache:true})}catch(e){}
  }

  const prompt=`Sos editor de agenda y cobertura del diario digital mendocino Media Mendoza.
Analiza este evento y propone ideas utiles para cobertura periodistica.

EVENTO:
Titulo: ${titulo}
Descripcion: ${String(body.descripcion||"").trim()}
Fecha: ${String(body.fecha||"").trim()}
Tipo: ${String(body.tipo||"").trim()}

Responde SOLO con JSON sin backticks:
{"angulos":["a1","a2","a3"],"preguntas":["p1","p2","p3"],"fuentes_sugeridas":["f1","f2","f3"],"consejo":"..."}`;

  const resultado=await callGemini(prompt,env);
  if(resultado.error) return jsonError(resultado.error,500);

  const data={
    angulos:          Array.isArray(resultado.data?.angulos)?resultado.data.angulos:[],
    preguntas:        Array.isArray(resultado.data?.preguntas)?resultado.data.preguntas:[],
    fuentes_sugeridas:Array.isArray(resultado.data?.fuentes_sugeridas)?resultado.data.fuentes_sugeridas:[],
    consejo:          String(resultado.data?.consejo||"").trim(),
  };

  if(kvKey){
    try{await env.KV.put(ANGULOS_PREFIX+kvKey,JSON.stringify(data),{expirationTtl:ANGULOS_TTL})}catch(e){}
  }
  return jsonOk(data);
}

// ============================================================
// AGENDA — EVENTOS KV
// ============================================================

async function handleGetAgendaEventos(url,env){
  try{
    const mes=String(url.searchParams.get("mes")||"").trim();
    let eventos=await listarObjetosKV(env,AGENDA_EV_PREFIX);
    if(mes) eventos=eventos.filter(e=>String(e.fecha||"").startsWith(mes));
    eventos.sort((a,b)=>String(a.fecha||"").localeCompare(String(b.fecha||""))||String(a.hora||"").localeCompare(String(b.hora||"")));
    return jsonOk({eventos});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}

async function handlePostAgendaEvento(body,env){
  const titulo=String(body.titulo||"").trim();
  const fecha =String(body.fecha||"").trim();
  if(!titulo||!fecha) return jsonError("Faltan campos: titulo y fecha",400);
  const evento={
    id:          body.id||generarId("ag_"),
    titulo,fecha,
    hora:        String(body.hora||"").trim(),
    tipo:        String(body.tipo||"evento").trim(),
    alcance:     String(body.alcance||"local").trim(),
    descripcion: String(body.descripcion||"").trim(),
    periodista:  String(body.periodista||"").trim(),
    creado:      body.creado||Date.now(),
  };
  try{
    await env.KV.put(`${AGENDA_EV_PREFIX}${evento.id}`,JSON.stringify(evento));
    return jsonOk({guardado:true,id:evento.id,evento});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}

async function handleDeleteAgendaEvento(url,env){
  const id=url.searchParams.get("id");
  if(!id) return jsonError("Falta id",400);
  try{await env.KV.delete(`${AGENDA_EV_PREFIX}${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// SCRAPING
// ============================================================
async function handleScrape(url){
  const targetUrl=url.searchParams.get("url");
  if(!targetUrl) return jsonError("Parametro url requerido",400);
  try{new URL(targetUrl)}catch{return jsonError("URL invalida",400)}
  try{
    const {html}=await fetchHtml(targetUrl,300);
    const ogTitle=html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i);
    const titleTag=html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    const titulo=(ogTitle?.[1]||titleTag?.[1]||'').replace(/\s+/g,' ').trim();
    const ogImg=html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i)||html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:image["']/i);
    const imagen=ogImg?.[1]||'';
    const texto=extraerTexto(html);
    if(!texto||texto.length<100) return jsonError("No se pudo extraer contenido de la nota",422);
    return jsonOk({titulo,texto,imagen,url:targetUrl});
  }catch(err){return jsonError(`Error scrapeando: ${err.message}`,502)}
}

// ============================================================
// COMPATIBILIDAD PLACAS
// ============================================================
async function handlePlacasUrl(url){
  const targetUrl=url.searchParams.get("url");
  if(!targetUrl) return jsonError("Parametro url requerido",400);
  try{new URL(targetUrl)}catch{return jsonError("URL invalida",400)}
  try{
    const {html}=await fetchHtml(targetUrl,300);
    const data=extraerDatosNota(html,targetUrl);
    if(!data.title&&!data.body) return jsonError("No se pudo extraer contenido",422);
    return jsonOk(data);
  }catch(err){return jsonError(`Error: ${err.message}`,502)}
}
async function handlePlacasImage(url){
  const imageUrl=url.searchParams.get("image");
  if(!imageUrl) return jsonError("Parametro image requerido",400);
  try{new URL(imageUrl)}catch{return jsonError("URL invalida",400)}
  try{
    const res=await fetch(imageUrl,{headers:{"User-Agent":BROWSER_HEADERS["User-Agent"],"Accept":"image/*,*/*;q=0.8"},redirect:"follow",cf:{cacheTtl:3600,cacheEverything:true}});
    if(!res.ok) return jsonError(`Error ${res.status}`,502);
    const ct=res.headers.get("Content-Type")||"application/octet-stream";
    if(!ct.startsWith("image/")) return jsonError("La URL no devolvio una imagen",422);
    const cl=Number(res.headers.get("Content-Length")||"0");
    if(cl&&cl>MAX_PROXY_IMAGE_BYTES) return jsonError("La imagen es demasiado pesada",413);
    return new Response(res.body,{headers:{...CORS_HEADERS,"Content-Type":ct,"Cache-Control":"public, max-age=3600"}});
  }catch(err){return jsonError(`Error obteniendo imagen: ${err.message}`,502)}
}
async function handlePlacasAI(request,env){
  let body; try{body=await request.json()}catch{return jsonError("JSON invalido",400)}
  const system=String(body.system||"").trim(); const user=String(body.user||"").trim();
  if(!system||!user) return jsonError("Faltan campos: system y user",400);
  const prompt=`${system}\n\nResponde SOLO con JSON sin backticks:\n{"grupo":"...","canal":"..."}\n\n${user}`;
  const resultado=await callGemini(prompt,env);
  if(resultado.error) return jsonError(resultado.error,500);
  const grupo=limpiarEspacios(resultado.data?.grupo||""); const canal=limpiarEspacios(resultado.data?.canal||"");
  if(!grupo&&!canal) return jsonError("La IA no devolvio mensajes validos",502);
  return jsonOk({text:JSON.stringify({grupo,canal})});
}

// ============================================================
// EDITORIAL
// ============================================================
async function handleGetEditorial(env){
  try{const val=await env.KV.get(EDITORIAL_KV_KEY,"json");return jsonOk({editorial:val||{prompt:"",activo:false}})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostEditorial(body,env){
  if(typeof body.prompt==="undefined") return jsonError("Falta campo: prompt",400);
  try{await env.KV.put(EDITORIAL_KV_KEY,JSON.stringify({prompt:body.prompt.trim(),activo:!!body.activo}));return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// FUENTES
// ============================================================
async function handleGetFuentes(env){
  try{
    const list=await env.KV.list({prefix:"fuente:"});const fuentes=[];
    for(const k of list.keys){const v=await env.KV.get(k.name,"json");if(v)fuentes.push(v)}
    fuentes.sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));
    return jsonOk({fuentes});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostFuente(body,env){
  const {id,nombre,url,clase}=body;
  if(!id||!nombre||!url) return jsonError("Faltan campos: id, nombre, url",400);
  try{await env.KV.put(`fuente:${id}`,JSON.stringify({id,nombre,url,clase:clase||"custom"}));return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteFuente(url,env){
  const id=url.searchParams.get("id");
  if(!id) return jsonError("Parametro id requerido",400);
  try{await env.KV.delete(`fuente:${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// NOTAS
// ============================================================
async function handleGetNotas(env){
  try{
    const list=await env.KV.list({prefix:"nota:"});const notas=[];
    for(const k of list.keys){const v=await env.KV.get(k.name,"json");if(v)notas.push(v)}
    notas.sort((a,b)=>(b.fecha||0)-(a.fecha||0));return jsonOk({notas});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostNota(body,env){
  const {id,titular,cuerpo,categoria,hashtags,imagen,fecha}=body;
  if(!id||!titular) return jsonError("Faltan campos",400);
  try{await env.KV.put(`nota:${id}`,JSON.stringify({id,titular,cuerpo,categoria,hashtags,imagen:imagen||'',fecha:fecha||Date.now()}));return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteNota(url,env){
  const id=url.searchParams.get("id"); if(!id) return jsonError("Falta id",400);
  try{await env.KV.delete(`nota:${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// CUBIERTAS
// ============================================================
async function handleGetCubiertas(env){
  try{const list=await env.KV.list({prefix:"cubierta:"});return jsonOk({links:list.keys.map(k=>k.name.replace("cubierta:",""))})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostCubierta(body,env){
  const {link,cubierta}=body; if(!link) return jsonError("Falta campo: link",400);
  try{
    const key="cubierta:"+link.substring(0,400);
    if(cubierta) await env.KV.put(key,"1",{expirationTtl:60*60*24*30});
    else await env.KV.delete(key);
    return jsonOk({guardado:true});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// WHATSAPP
// ============================================================
async function handleWhatsappGenerar(body,env){
  const notaUrl=String(body.notaUrl||"").trim(); const contenido=String(body.contenido||"").trim();
  const tituloM=String(body.titulo||"").trim(); const categoriaM=String(body.categoria||"").trim();
  const contextoExtra=String(body.contextoExtra||"").trim();
  let nota={titulo:tituloM,categoria:categoriaM,descripcion:"",body:contenido,url:notaUrl,urlCorta:notaUrl?acortarUrlNota(notaUrl):"",image:""};
  if(notaUrl){
    try{new URL(notaUrl)}catch{return jsonError("URL invalida",400)}
    try{const {html}=await fetchHtml(notaUrl,300);const s=extraerDatosNota(html,notaUrl);nota={titulo:s.title||nota.titulo,categoria:s.category||nota.categoria,descripcion:s.description||"",body:s.body||nota.body,url:notaUrl,urlCorta:acortarUrlNota(notaUrl),image:s.image||""}}
    catch(err){return jsonError(`No se pudo obtener la nota: ${err.message}`,502)}
  }
  if(!nota.titulo&&!nota.body) return jsonError("Falta notaUrl o contenido",400);
  const prompt=`Sos editor de WhatsApp del diario digital Media Mendoza (sur de Mendoza, Argentina).
DATOS:
Titulo: ${nota.titulo||"Sin titulo"}
Categoria: ${nota.categoria||"General"}
Contenido: ${(nota.body||"").substring(0,2000)}
URL: ${nota.urlCorta||nota.url||""}
${contextoExtra?`Contexto adicional: ${contextoExtra}`:""}
REGLAS: NO inventar, español argentino, usar \\n para saltos, negritas con *asterisco simple*, NO doble asterisco.
FORMATO GRUPO: 🚨 *CATEGORIA*: frase corta\\n\\nBajada con *negrita*👇\\n👉 *MÁS INFORMACIÓN:* ${nota.urlCorta||nota.url||""}\\n\\n*📱 Grupo:* https://bit.ly/mediamendoza-grupo\\n*📣 Canal:* https://bit.ly/mediamendoza-canal\\n\\n*📰 Media Mendoza - Noticias confiables del sur mendocino*
FORMATO CANAL: igual pero menos emojis, más limpio.
Responde SOLO con JSON: {"grupo":"...","canal":"..."}`;
  const resultado=await callGemini(prompt,env);
  if(resultado.error) return jsonError(resultado.error,500);
  const grupo=(resultado.data?.grupo||"").trim(); const canal=(resultado.data?.canal||"").trim();
  if(!grupo||!canal) return jsonError("La IA no devolvio ambos mensajes",502);
  return jsonOk({nota:{titulo:nota.titulo||"Sin titulo",url:nota.url||"",urlCorta:nota.urlCorta||nota.url||"",imagen:nota.image||""},categoria:nota.categoria||"General",grupo,canal});
}
async function handlePostWhatsappProgramar(body,env){
  if(!body?.fecha) return jsonError("Falta campo: fecha",400);
  const item={id:body.id||generarId("wp_"),fecha:Number(body.fecha),fechaLegible:body.fechaLegible||"",tituloNota:String(body.tituloNota||"").trim(),urlCorta:String(body.urlCorta||"").trim(),canales:Array.isArray(body.canales)?body.canales.filter(Boolean):[],textoGrupo:String(body.textoGrupo||"").trim(),textoCanal:String(body.textoCanal||"").trim(),categoria:String(body.categoria||"General").trim(),enviado:!!body.enviado,creado:body.creado||Date.now()};
  if(!item.canales.length) return jsonError("Falta al menos un canal",400);
  try{await env.KV.put(`${WHATSAPP_PREFIX}${item.id}`,JSON.stringify(item));return jsonOk({guardado:true,id:item.id})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetWhatsappProgramados(env){
  try{const p=await listarObjetosKV(env,WHATSAPP_PREFIX);p.sort((a,b)=>(a.fecha||0)-(b.fecha||0));return jsonOk({programados:p})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostWhatsappMarcarEnviado(body,env){
  const id=String(body.id||"").trim(); if(!id) return jsonError("Falta campo: id",400);
  try{
    const key=`${WHATSAPP_PREFIX}${id}`;const actual=await env.KV.get(key,"json");
    if(!actual) return jsonError("Mensaje no encontrado",404);
    const act={...actual,estado:"enviado",enviado:true};
    await env.KV.put(key,JSON.stringify(act));return jsonOk({guardado:true,id,programado:act});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteWhatsappProgramado(url,env){
  const id=url.searchParams.get("id"); if(!id) return jsonError("Falta id",400);
  try{await env.KV.delete(`${WHATSAPP_PREFIX}${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// RSS / VERIFICAR
// ============================================================
async function handleRSS(url){
  const feedUrl=url.searchParams.get("url"); if(!feedUrl) return jsonError("Parametro url requerido",400);
  try{new URL(feedUrl)}catch{return jsonError("URL invalida",400)}
  try{
    const res=await fetch(feedUrl,{headers:{...BROWSER_HEADERS,'Accept-Encoding':'identity'},redirect:"follow",cf:{cacheTtl:180,cacheEverything:true}});
    if(!res.ok) return jsonError(`Feed error ${res.status}`,502);
    const text=await res.text();
    if(!esXMLvalido(text)) return jsonError("La URL no es un feed RSS valido",422);
    return new Response(text,{headers:{...CORS_HEADERS,"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=180"}});
  }catch(err){return jsonError(`Error obteniendo feed: ${err.message}`,502)}
}
async function handleVerificar(url){
  const feedUrl=url.searchParams.get("url"); if(!feedUrl) return jsonError("Parametro url requerido",400);
  try{new URL(feedUrl)}catch{return jsonError("URL invalida",400)}
  try{
    const res=await fetch(feedUrl,{headers:{...BROWSER_HEADERS,'Accept-Encoding':'identity'},redirect:"follow"});
    if(!res.ok) return jsonError(`Feed error ${res.status}`,502);
    const text=await res.text();
    if(!esXMLvalido(text)) return jsonError("La URL no es un feed RSS valido",422);
    const tm=text.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const nombre=tm?tm[1].replace(/\s+/g,' ').trim().substring(0,80):'Feed RSS';
    const itemCount=(text.match(/<item[\s>]/g)||[]).length+(text.match(/<entry[\s>]/g)||[]).length;
    return jsonOk({valido:true,nombre,items:itemCount});
  }catch(err){return jsonError(`No se pudo acceder: ${err.message}`,502)}
}

// ============================================================
// GEMINI
// ============================================================
async function getEditorial(env){
  try{
    const v=await env.KV.get(EDITORIAL_KV_KEY,"json");
    if(v && v.activo && v.prompt) return v.prompt;
  }catch(e){}
  return null;
}

async function callGeminiConBusqueda(prompt,env){
  const ideasTexto=prompt.split("\n\nCONTENIDO A REDACTAR:\n")[1]?.split("\n\n")[0]||prompt.substring(0,200);
  const fuentesReales=await buscarDuckDuckGo(ideasTexto);
  let contextoWeb=""; const fuentesVerificadas=[];
  for(const fuente of fuentesReales.slice(0,3)){
    try{
      const res=await fetch(fuente.url,{headers:BROWSER_HEADERS,redirect:"follow",signal:AbortSignal.timeout(5000)});
      if(!res.ok) continue;
      const html=await res.text(); const texto=extraerTexto(html).substring(0,800);
      if(texto.length<100) continue;
      const ogImg=html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i);
      contextoWeb+="\nFUENTE: "+fuente.titulo+" ("+fuente.url+")\n"+texto+"\n---";
      fuentesVerificadas.push({titulo:fuente.titulo,url:fuente.url,imagen:ogImg?.[1]||''});
    }catch(e){continue}
  }
  const promptFinal=prompt+(contextoWeb?"\n\nCONTENIDO WEB ENCONTRADO:\n"+contextoWeb:"");
  const resultado=await callGemini(promptFinal,env);
  if(resultado.error) return resultado;
  if(fuentesVerificadas.length) resultado.data.fuentes=fuentesVerificadas;
  return resultado;
}

async function buscarDuckDuckGo(query){
  try{
    const url="https://html.duckduckgo.com/html/?q="+encodeURIComponent(query)+"&kl=es-ar";
    const res=await fetch(url,{headers:{"User-Agent":BROWSER_HEADERS["User-Agent"],"Accept":"text/html","Accept-Language":"es-AR,es;q=0.9"},redirect:"follow"});
    if(!res.ok) return [];
    const html=await res.text(); const resultados=[];
    const linkRegex=/class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)</g; let match;
    while((match=linkRegex.exec(html))!==null&&resultados.length<5){
      let u=match[1]; const t=match[2].trim();
      if(u.includes("uddg=")){const d=decodeURIComponent(u.split("uddg=")[1]?.split("&")[0]||"");if(d.startsWith("http"))u=d}
      if(u.startsWith("http")&&t) resultados.push({url:u,titulo:t});
    }
    return resultados;
  }catch(e){return []}
}

async function callGemini(prompt,env){
  const keys=[env.GEMINI_KEY_1,env.GEMINI_KEY_2,env.GEMINI_KEY_3,env.GEMINI_KEY_4,env.GEMINI_KEY_5].filter(Boolean);
  if(!keys.length) return {error:"No hay API keys configuradas"};
  for(let i=0;i<keys.length;i++){
    for(let intento=1;intento<=2;intento++){
      try{
        const res=await fetch(`${GEMINI_URL}?key=${keys[i]}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:2000}})});
        if(res.status===429){if(intento<2){await sleep(3000);continue}else break}
        if(res.status===500||res.status===503){if(intento<2){await sleep(3000);continue}else break}
        if(!res.ok) break;
        const data=await res.json();
        const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text||"";
        const match=raw.match(/\{[\s\S]*\}/); if(!match) break;
        let parsed; try{parsed=JSON.parse(match[0])}catch{break}
        return {data:parsed};
      }catch(err){if(intento<2)await sleep(3000)}
    }
  }
  return {error:"Todas las API keys estan agotadas. Intentalo en unos minutos."};
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function jsonOk(data){return new Response(JSON.stringify({ok:true,...data}),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}})}
function jsonError(message,status=400){return new Response(JSON.stringify({ok:false,error:message}),{status,headers:{...CORS_HEADERS,"Content-Type":"application/json"}})}