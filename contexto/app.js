// Contexto — IA real + PNG estilo Placas v2
const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';

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

// Familias (mismo que placas-v2/editorial-core.mjs)
const FAMILIES = {
  general: { color:'#a6ce39', secondary:'#16201b', soft:'#eaf3de', label:'Actualidad' },
  clima: { color:'#367d9c', secondary:'#16303b', soft:'#dcedf3', label:'Clima' },
  policiales: { color:'#ba3f42', secondary:'#421c1e', soft:'#f8dddd', label:'Policiales' },
  sociales: { color:'#b36b27', secondary:'#422715', soft:'#f8ead7', label:'Sociedad' },
  politica: { color:'#5b4c91', secondary:'#251e42', soft:'#e9e4f7', label:'Política' },
  economia: { color:'#507118', secondary:'#213009', soft:'#eaf3de', label:'Economía' },
  deportes: { color:'#16806a', secondary:'#103c33', soft:'#d9f1eb', label:'Deportes' },
};

// Mock fallback si la IA falla / sin conexión
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
    timeline: [
      { label:'2024', value:'$480', sub:'Tarifa' },
      { label:'2025', value:'$650', sub:'Aumento' },
      { label:'2026-01', value:'$750', sub:'Actual' },
      { label:'2026-06', value:'$850', sub:'Tu nota', highlight:true },
    ],
  }
};

let lastData = null;

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

function wrapText(ctx, text, maxWidth) {
  const words = String(text||'').trim().split(/\s+/).filter(Boolean);
  const lines=[];
  let cur='';
  for (const w of words) {
    const nxt = cur ? cur+' '+w : w;
    if (!cur || ctx.measureText(nxt).width <= maxWidth) cur=nxt;
    else { lines.push(cur); cur=w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function roundedRect(ctx,x,y,w,h,r){
  const rad=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rad,y);
  ctx.arcTo(x+w,y,x+w,y+h,rad);
  ctx.arcTo(x+w,y+h,x,y+h,rad);
  ctx.arcTo(x,y+h,x,y,rad);
  ctx.arcTo(x,y,x+w,y,rad);
  ctx.closePath();
}

// PNG estilo Placas v2 — placa "Para entender"
function renderPlacaContexto(canvas, data) {
  const ctx = canvas.getContext('2d');
  const W = 1350, H = 1688;
  canvas.width = W; canvas.height = H;

  const family = FAMILIES[data.categoria] || FAMILIES.general;
  const datos = Array.isArray(data.para_entender_datos) ? data.para_entender_datos.slice(0,3) : [];
  const titulo = data.titulo_placa || data.titulo_corto || data.titulo || 'Para entender';

  // Fondo degradado blanco -> soft
  ctx.clearRect(0,0,W,H);
  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,'#ffffff');
  grad.addColorStop(1, family.soft);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  const margin = W * 0.055; // 74px

  // Logo MM (texto si no hay imagen)
  ctx.fillStyle = family.secondary;
  ctx.font = `900 22px Inter, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('MEDIAMENDOZA.COM', W - margin, 56);
  ctx.textAlign = 'left';

  // Etiqueta PARA ENTENDER
  const labelText = 'PARA ENTENDER';
  ctx.font = `900 22px Inter, sans-serif`;
  const labelPadX = 18;
  const labelW = ctx.measureText(labelText).width + labelPadX*2;
  const labelH = 40;
  const labelY = 72;
  ctx.fillStyle = family.color;
  roundedRect(ctx, margin, labelY, labelW, labelH, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, margin + labelPadX, labelY + labelH/2 + 1);
  ctx.textBaseline = 'alphabetic';

  // Famila subtítulo
  ctx.fillStyle = family.secondary;
  ctx.font = `700 14px Inter, sans-serif`;
  ctx.fillText(family.label.toUpperCase(), margin + labelW + 14, labelY + labelH/2 + 4);

  // Título
  const titleX = margin;
  const titleY = 150;
  const titleW = W - margin*2;
  const titleMaxH = 240;
  let titleSize = 52;
  let titleLines = [];
  while (titleSize >= 30) {
    ctx.font = `900 ${titleSize}px Inter, sans-serif`;
    titleLines = wrapText(ctx, titulo, titleW);
    const needed = titleLines.length * titleSize * 1.06;
    if (titleLines.length <= 3 && needed <= titleMaxH) break;
    titleSize -= 1;
  }
  ctx.fillStyle = family.secondary;
  ctx.font = `900 ${titleSize}px Inter, sans-serif`;
  let ty = titleY + titleSize;
  const lineH = titleSize * 1.06;
  titleLines.slice(0,3).forEach(line => { ctx.fillText(line, titleX, ty); ty += lineH; });

  // Línea divisoria
  const sepY = titleY + titleMaxH + 18;
  ctx.strokeStyle = 'rgba(22,32,27,.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, sepY);
  ctx.lineTo(W - margin, sepY);
  ctx.stroke();

  // 3 datos — tarjetas blancas
  const cardsY = sepY + 28;
  const cardH = 220;
  const gap = 18;
  const cardW = W - margin*2;

  datos.slice(0,3).forEach((texto, i) => {
    const y = cardsY + i * (cardH + gap);
    // tarjeta
    ctx.fillStyle = '#ffffff';
    roundedRect(ctx, margin, y, cardW, cardH, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(22,32,27,.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // accent izquierda
    ctx.fillStyle = family.color;
    roundedRect(ctx, margin, y, 10, cardH, 6);
    ctx.fill();
    // número
    ctx.fillStyle = family.color;
    ctx.font = `900 42px Inter, sans-serif`;
    const numX = margin + 28;
    ctx.fillText(String(i+1), numX, y + 62);
    // texto del dato
    const textX = numX + 44;
    const textW = cardW - 72 - 44;
    let size = 26;
    let lines = [];
    while (size >= 18) {
      ctx.font = `700 ${size}px Inter, sans-serif`;
      lines = wrapText(ctx, texto, textW);
      if (lines.length <= 3 && lines.length * size * 1.35 <= 140) break;
      size -= 1;
    }
    ctx.fillStyle = family.secondary;
    ctx.font = `700 ${size}px Inter, sans-serif`;
    const lh = size * 1.32;
    let ly = y + 48;
    // centrar verticalmente si 1-2 líneas
    const totalH = lines.slice(0,3).length * lh;
    const offset = Math.max(0, (cardH - 40 - totalH)/2);
    ly += offset;
    lines.slice(0,3).forEach(line => { ctx.fillText(line, textX, ly); ly += lh; });
  });

  // Timeline mini (si hay)
  const timeline = Array.isArray(data.timeline) ? data.timeline.slice(0,4) : [];
  if (timeline.length >= 2) {
    const tlY = cardsY + 3*(cardH+gap) + 28;
    const tlH = 92;
    ctx.fillStyle = 'rgba(255,255,255,.86)';
    roundedRect(ctx, margin, tlY, cardW, tlH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(22,32,27,.06)';
    ctx.stroke();

    // línea
    const left = margin + 28;
    const right = W - margin - 28;
    const midY = tlY + tlH/2 + 8;
    ctx.strokeStyle = 'rgba(22,32,27,.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, midY);
    ctx.lineTo(right, midY);
    ctx.stroke();

    const gapX = (right - left) / (timeline.length - 1);
    timeline.forEach((it, idx) => {
      const x = left + gapX * idx;
      const hi = !!it.highlight;
      ctx.beginPath();
      ctx.arc(x, midY, hi ? 10 : 7, 0, Math.PI*2);
      ctx.fillStyle = hi ? family.color : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = hi ? family.color : 'rgba(22,32,27,.18)';
      ctx.lineWidth = hi ? 3 : 2;
      ctx.stroke();
      if (hi) {
        ctx.beginPath();
        ctx.arc(x, midY, 3.5, 0, Math.PI*2);
        ctx.fillStyle = family.secondary;
        ctx.fill();
      }
      ctx.fillStyle = hi ? family.secondary : '#6b7a6e';
      ctx.font = hi ? `900 11px Inter, sans-serif` : `700 10px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(it.label||''), x, tlY + 22);
      ctx.fillStyle = hi ? family.secondary : '#16201b';
      ctx.font = hi ? `900 14px Inter, sans-serif` : `700 12px Inter, sans-serif`;
      ctx.fillText(String(it.value||''), x, midY + 28);
      ctx.fillStyle = '#6b7a6e';
      ctx.font = `600 9px Inter, sans-serif`;
      ctx.fillText(String(it.sub||''), x, midY + 42);
    });
    ctx.textAlign = 'left';
  }

  // Footer
  const footerY = H - 56;
  ctx.fillStyle = 'rgba(22,32,27,.18)';
  ctx.fillRect(margin, footerY - 14, W - margin*2, 1);
  ctx.fillStyle = '#6b7a6e';
  ctx.font = `700 13px Inter, sans-serif`;
  ctx.fillText('www.mediamendoza.com', margin, footerY + 12);
  ctx.textAlign = 'right';
  ctx.fillStyle = family.color;
  ctx.font = `900 13px Inter, sans-serif`;
  ctx.fillText('MM  •  PARA ENTENDER', W - margin, footerY + 12);
  ctx.textAlign = 'left';

  // Sello verde inferior fino como placas-v2
  ctx.fillStyle = family.color;
  ctx.fillRect(0, H - 4, W, 4);
}

function showResults(data, url) {
  resultTitle.textContent = data.titulo_corto || data.titulo || 'Contexto generado';
  resultUrl.textContent = url;
  // Para entender
  const paraText = data.para_entender || (Array.isArray(data.para_entender_datos) ? 'Para entender: 1) '+data.para_entender_datos.join(' 2) ')+' 3) '+data.para_entender_datos.slice(-1) : '');
  paraEl.innerHTML = paraText ? paraText.replace(/^Para entender:/,'<strong>Para entender:</strong>') : '';
  // Qué pasó antes
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

  // Render placa estilo v2
  renderPlacaContexto(canvas, data);
  lastData = data;

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
  // Intento 1: endpoint dedicado (requiere deploy del worker)
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
    // si 404 o error, cae a fallback
    if (res.status !== 404) {
      const data = await res.clone().json().catch(()=>({}));
      if (data.error) throw new Error(data.error);
    }
  } catch (e) {
    if (e.message && !e.message.includes('404') && !e.message.includes('Failed to fetch') && !e.message.includes('Ruta no encontrada')) throw e;
    // sino fallback
  }

  // Fallback inmediato usando endpoints ya desplegados: /scrape + /visual/generar
  // 1) Scrapear nota
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
- "para_entender_datos": array de 3 strings (cada dato suelto)
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
  // /visual/generar devuelve {texto: "JSON stringificado"}
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
  // Normalizar y agregar imagen del scrape para futura placa
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
    // Fallback mock para que veas algo
    const fallback = MOCKS.colectivo;
    showResults({...fallback, titulo_corto: 'No se pudo leer la nota — ejemplo', titulo_placa: fallback.titulo_placa}, url);
  } finally {
    setLoading(false);
  }
});

// chips
document.querySelectorAll('.ctx-chip').forEach(ch => {
  ch.addEventListener('click', () => {
    urlInput.value = ch.dataset.url;
    generateBtn.click();
  });
});

// copiar
document.querySelectorAll('.ctx-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.copy;
    const map = { paraEntender: paraEl, quePaso: quePasoEl, gancho: ganchoEl, preguntas: preguntasEl };
    const el = map[key];
    if (el) copyHtml(el);
  });
});

// descargar PNG — nombre con fecha
const dlBtn = document.getElementById('ctxDownloadPng');
if (dlBtn) dlBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0,10);
  a.download = `contexto-mediamendoza-${stamp}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  toast('PNG descargado');
});

// enter
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generateBtn.click();
});

// Render inicial vacío con ejemplo para que el canvas no esté vacío si descargan antes
renderPlacaContexto(canvas, MOCKS.colectivo);

} // end init

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContexto);
} else {
  initContexto();
}
