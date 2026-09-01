import { renderNewsPlate } from '../placas-v2/renderer.mjs';
import { FAMILIES } from '../placas-v2/editorial-core.mjs';

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';

// Logo para header/footer placas-v2
const logoImage = new Image();
logoImage.src = '../assets/logo.png';
let logoReady = false;
logoImage.onload = () => { logoReady = true; if (lastData) renderPlacaV2(lastData); };
logoImage.onerror = () => { logoReady = false; };

function initContexto() {
const $ = (s) => document.querySelector(s);
const urlInput = $('#ctxUrl');
const generateBtn = $('#ctxGenerate');
const loading = $('#ctxLoading');
const results = $('#ctxResults');
const empty = $('#ctxEmpty');
const toastEl = $('#ctxToast');

const resultTitle = $('#ctxResultTitle');
const resultUrl = $('#ctxResultUrl');

const paraEl = $('#ctxParaEntender');
const quePasoEl = $('#ctxQuePaso');
const ganchoEl = $('#ctxGancho');
const preguntasEl = $('#ctxPreguntas');
const canvas = $('#ctxTimelineCanvas');

if (!urlInput || !generateBtn || !canvas) {
  console.error('[contexto] elementos no encontrados');
  return;
}

let lastData = null;
window.lastData = null; // for logo onload

// Mock fallback
const MOCKS = {
  colectivo: {
    titulo_corto: 'Aumento del colectivo en Mendoza',
    titulo_placa: 'Colectivo más caro en Mendoza: $850 desde junio',
    categoria: 'general',
    para_entender: 'Para entender: 1) La tarifa actual es de $750 desde enero de 2026. 2) Desde el 10 de junio pasa a $850 (+13%). 3) Afecta a 300.000 usuarios del Gran Mendoza y San Rafael.',
    para_entender_datos: ['Tarifa actual $750 desde enero 2026','Desde el 10 de junio $850 (+13%)','Afecta a 300.000 usuarios del Gran Mendoza'],
    que_paso_antes: [
      {titulo:'Último aumento del boleto a $750',fuente:'Los Andes',fecha:'15/01/26',url:'https://www.losandes.com.ar/mendoza/ultimo-aumento-750/'},
      {titulo:'Reclamo de choferes por subsidios nacionales',fuente:'MDZ',fecha:'10/12/25',url:'https://www.mdzol.com/sociedad/reclamo-choferes-subsidios/'},
      {titulo:'Nuevo cuadro tarifario oficial',fuente:'Gobierno de Mendoza',fecha:'03/06/26',url:'https://www.mendoza.gov.ar/prensa/cuadro-tarifario-junio/'},
    ],
    gancho_whatsapp: 'Desde el 10 de junio el colectivo en Mendoza cuesta $850. Son $100 más que hoy. Te contamos en 3 datos qué cambia, a quién afecta y qué pasó en los últimos aumentos. Leé la nota completa acá.',
    preguntas: ['¿Qué subsidio nacional se recortó y cuánto representa?','¿Habrá tarifa diferenciada para estudiantes/jubilados?','¿Cómo impacta en San Rafael vs Gran Mendoza?','¿Qué dice la audiencia pública del 28/05?','¿Próxima revisión prevista?'],
    url: 'https://www.losandes.com.ar/mendoza/aumento-colectivo-junio-2026/',
    imagen: ''
  },
  plumerillo: {
    titulo_corto: 'El Plumerillo se agranda: 26 millones de dólares',
    titulo_placa: 'El Plumerillo se agranda: 26 millones para vuelos internacionales',
    categoria: 'politica',
    para_entender: 'Para entender: 1) Inversión de 26 millones de dólares. 2) Duplicación del área internacional. 3) Capacidad para 7 aviones simultáneos.',
    para_entender_datos: ['Inversión de 26 millones de dólares','Duplicación del área internacional','Capacidad para 7 aviones simultáneos'],
    que_paso_antes: [
      {titulo:'Remodelación de pista en 2016',fuente:'Los Andes',fecha:'2016',url:'https://www.losandes.com.ar/'},
      {titulo:'Inversión en aeropuerto local en 2024',fuente:'MDZ',fecha:'2024',url:'https://www.mdzol.com/'},
      {titulo:'Inicio del proceso de licitación',fuente:'Gobierno de Mendoza',fecha:'15/09/26',url:'https://www.mendoza.gov.ar/'},
    ],
    gancho_whatsapp: 'El aeropuerto El Plumerillo se agranda con 26 millones de dólares: duplican el área internacional y podrá recibir 7 aviones a la vez. Todos los detalles de la obra acá.',
    preguntas: ['¿Cuándo empieza la obra?','¿Cuánto durará la ampliación?','¿Qué vuelos se suman?','¿Cómo afecta a San Rafael?','¿Quién financia?'],
    url: 'https://www.losandes.com.ar/politica/el-plumerillo-se-agranda/',
    imagen: ''
  }
};

function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2400);
}

async function copyHtml(el) {
  const text = el.innerText.trim();
  try {
    await navigator.clipboard.writeText(text);
    toast('Copiado');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('Copiado');
  }
}

function buildPlacaContexto(data) {
  const rawCat = String(data.categoria||'general').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const family = FAMILIES[rawCat] || FAMILIES.general;
  const titulo = String(data.titulo_placa || data.titulo_corto || data.titulo || 'Para entender').trim();
  const datos = Array.isArray(data.para_entender_datos) ? data.para_entender_datos.slice(0,3).map(s=>String(s).trim()).filter(Boolean) : [];
  // Fallback si datos vienen como para_entender string
  let impactos = datos.map(d => ({ label:'', value:d, detail:'' }));
  if (!impactos.length && data.para_entender) {
    const parts = String(data.para_entender).replace(/^Para entender:\s*/i,'').split(/\s*\d\)\s*/).filter(s=>s.trim());
    impactos = parts.slice(0,3).map(p=>({label:'', value:p.trim(), detail:''}));
  }
  if (impactos.length < 3) {
    while (impactos.length < 3) impactos.push({label:'', value:'', detail:''});
  }
  return {
    tipo: 'placa_noticia',
    version: 1,
    titulo: titulo,
    titulo_sintetico: titulo,
    bajada: '',
    etiqueta: 'Para entender',
    contexto: '',
    impactos: impactos,
    datos_clave: [],
    comparativa: null,
    template_sugerido: family.id,
    tipo_placa: 'que-cambia',
    color_principal: family.color,
    color_secundario: family.secondary,
    fuente: { url: data.url || '', nombre: 'Media Mendoza', titulo_original: titulo, texto: '' },
    bloques: [],
    textual: { cita:'', autor:'', cargo:'', verificada:false },
    personas: [],
    imagenes_apoyo: [],
    pregunta_social: '',
    alerta: null,
    fecha: new Date().toISOString().slice(0,10)
  };
}

function renderPlacaV2(data) {
  lastData = data;
  window.lastData = data;
  const plate = buildPlacaContexto(data);
  try {
    const ctx = canvas.getContext('2d');
    // renderNewsPlate espera formato y options con logo
    renderNewsPlate(ctx, plate, 'portrait', { image: null, focus:{x:0.5,y:0.5}, logo: logoReady ? logoImage : null, personImages:{}, supportImage:null, supportFocus:{x:0.5,y:0.5}, forceCover:true });
  } catch (e) {
    console.error('[contexto] render placa v2 falló', e);
    toast('Error al renderizar la placa');
  }
}

function showResults(data, url) {
  resultTitle.textContent = data.titulo_corto || data.titulo || 'Contexto generado';
  resultUrl.textContent = url;
  const paraText = data.para_entender || (Array.isArray(data.para_entender_datos) ? 'Para entender: 1) '+data.para_entender_datos.join(' 2) ') : '');
  paraEl.innerHTML = paraText ? paraText.replace(/^Para entender:/,'<strong>Para entender:</strong>') : '';
  const qp = Array.isArray(data.que_paso_antes) ? data.que_paso_antes : [];
  if (qp.length) {
    quePasoEl.innerHTML = qp.map(it => {
      const t = String(it.titulo||'').trim();
      const f = String(it.fuente||'').trim();
      const fe = String(it.fecha||'').trim();
      const u = String(it.url||'').trim();
      return `<div>• <strong>${fe ? fe+' — '+f+':' : f+':'}</strong> ${t} <br><span>${u}</span></div>`;
    }).join('');
  } else {
    quePasoEl.innerHTML = '<div><span>Sin antecedentes</span></div>';
  }
  ganchoEl.textContent = data.gancho_whatsapp || '';
  const preg = Array.isArray(data.preguntas) ? data.preguntas : [];
  preguntasEl.innerHTML = preg.map((p,i)=> `${i+1}) ${p}`).join('<br>');
  renderPlacaV2(data);
  results.classList.remove('is-hidden');
  empty.style.display = 'none';
  results.scrollIntoView({ behavior:'smooth', block:'start' });
}

function setLoading(on) {
  loading.classList.toggle('is-hidden', !on);
  generateBtn.disabled = on;
  generateBtn.textContent = on ? 'Generando…' : 'Generar contexto →';
}

async function generarReal(url) {
  // Intento endpoint dedicado
  try {
    const res = await fetch(WORKER + '/contexto/generar', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ url })
    });
    if (res.ok) {
      const data = await res.json().catch(()=> ({}));
      if (!data.error && (data.para_entender || data.para_entender_datos)) return data;
      if (!data.error && data.data && (data.data.para_entender || data.data.para_entender_datos)) return data.data;
    }
    if (res.status !== 404) {
      const data = await res.clone().json().catch(()=>({}));
      if (data.error) throw new Error(data.error);
    }
  } catch (e) {
    if (e.message && !e.message.includes('404') && !e.message.includes('Failed to fetch') && !e.message.includes('Ruta no encontrada')) throw e;
  }
  // Fallback con /scrape + /visual/generar
  const scrapeRes = await fetch(WORKER + '/scrape?url=' + encodeURIComponent(url));
  const scrapeData = await scrapeRes.json().catch(()=> ({}));
  if (!scrapeRes.ok || scrapeData.error) throw new Error(scrapeData.error || 'No se pudo leer la nota. Probá con otra URL.');
  const titulo = scrapeData.titulo || '';
  const categoria = scrapeData.categoria || 'general';
  const texto = (scrapeData.texto || '').substring(0, 8000);
  if (!texto || texto.length < 80) throw new Error('Contenido muy corto para generar contexto.');
  const prompt = `Sos editor de Media Mendoza, diario del sur mendocino (San Rafael, Mendoza, Argentina). Analizá esta nota y generá CONTEXTO y ANTECEDENTES para que cualquier lector la entienda en 10 segundos.

NOTA ORIGINAL:
Título: ${titulo || "(sin título)"}
Categoría: ${categoria}
URL: ${url}
Cuerpo:
${texto}

INSTRUCCIONES:
- Respondé SOLO con JSON válido sin markdown, sin backticks.
- "para_entender": string único con formato "Para entender: 1) ... 2) ... 3) ..." cada dato máximo 28 palabras, verificable en el cuerpo.
- "para_entender_datos": array de 3 strings (cada dato suelto, sin numeración)
- "que_paso_antes": array de exactamente 3 objetos {"titulo":"...","fuente":"Los Andes|MDZ|Infobae|Gobierno de Mendoza","fecha":"DD/MM/AA","url":"https://..."}
- "gancho_whatsapp": string 55-65 palabras, tono rioplatense directo, sin hashtags
- "preguntas": array de 5 preguntas periodísticas concretas
- "timeline": array de 4 hitos [{"label":"2024","value":"$480","sub":"Tarifa"}, ...] el último con "highlight": true
- "categoria": una de general, clima, policiales, sociales, politica, economia, deportes
- "titulo_corto": título reescrito máximo 60 caracteres
- "titulo_placa": título para placa máximo 75 caracteres

Formato JSON exacto:
{"titulo_corto":"...","titulo_placa":"...","categoria":"...","para_entender":"Para entender: 1) ... 2) ... 3) ...","para_entender_datos":["dato1","dato2","dato3"],"que_paso_antes":[{"titulo":"...","fuente":"...","fecha":"...","url":"..."},{"titulo":"...","fuente":"...","fecha":"...","url":"..."},{"titulo":"...","fuente":"...","fecha":"...","url":"..."}],"gancho_whatsapp":"...","preguntas":["...","...","...","...","..."],"timeline":[{"label":"...","value":"...","sub":"..."},{"label":"...","value":"...","sub":"..."},{"label":"...","value":"...","sub":"..."},{"label":"...","value":"...","sub":"...","highlight":true}]}`;
  const genRes = await fetch(WORKER + '/visual/generar', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ prompt })
  });
  const genData = await genRes.json().catch(()=> ({}));
  if (!genRes.ok || genData.error) throw new Error(genData.error || 'La IA no respondió. Probá de nuevo.');
  let parsed = null;
  if (genData.texto) {
    try { parsed = JSON.parse(genData.texto); } catch {
      const m = String(genData.texto).match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch {}
    }
  } else if (genData.para_entender) {
    parsed = genData;
  }
  if (!parsed || (!parsed.para_entender && !parsed.para_entender_datos)) throw new Error('La IA no generó contexto válido.');
  parsed.imagen = scrapeData.imagen || '';
  parsed.url = url;
  if (!parsed.titulo_corto) parsed.titulo_corto = titulo.slice(0,60);
  if (!parsed.titulo_placa) parsed.titulo_placa = parsed.titulo_corto;
  if (!parsed.categoria) parsed.categoria = categoria || 'general';
  return parsed;
}

generateBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) { toast('Pegá un link primero'); urlInput.focus(); return; }
  try { new URL(url); } catch { toast('URL inválida'); return; }
  setLoading(true);
  results.classList.add('is-hidden');
  try {
    const data = await generarReal(url);
    showResults(data, url);
    toast('Contexto generado');
  } catch (err) {
    console.error(err);
    toast(err.message || 'No se pudo generar. Probá con otro link.');
    const fallback = MOCKS.plumerillo.titulo_placa.includes('Plumerillo') && url.toLowerCase().includes('plumerillo') ? MOCKS.plumerillo : MOCKS.colectivo;
    // Si la URL es de Plumerillo, usa mock plumerillo para no confundir
    if (url.toLowerCase().includes('plumerillo')) showResults(MOCKS.plumerillo, url);
  } finally {
    setLoading(false);
  }
});

document.querySelectorAll('.ctx-chip').forEach(ch => {
  ch.addEventListener('click', () => {
    urlInput.value = ch.dataset.url;
    generateBtn.click();
  });
});

document.querySelectorAll('.ctx-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.copy;
    const map = { paraEntender: paraEl, quePaso: quePasoEl, gancho: ganchoEl, preguntas: preguntasEl };
    const el = map[key];
    if (el) copyHtml(el);
  });
});

const dlBtn = document.getElementById('ctxDownloadPng');
if (dlBtn) dlBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0,10);
  // Nombre incluye slug del titulo para identificar
  const slug = (lastData?.titulo_corto || 'contexto').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,30);
  a.download = `contexto-${slug}-${stamp}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  toast('PNG descargado');
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generateBtn.click();
});

// Render inicial con plumerillo para preview
renderPlacaV2(MOCKS.plumerillo);

} // end init

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContexto);
} else {
  initContexto();
}
