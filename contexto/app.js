const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';

const logoImage = new Image();
logoImage.src = '../assets/logo.png';
let logoReady = false;
let lastData = null;
logoImage.onload = () => { logoReady = true; };
logoImage.onerror = () => { logoReady = false; };

const FORMATS = {
  landscape: { w: 2400, h: 1350, label: 'Horizontal 16:9' },
  square: { w: 1600, h: 1600, label: 'Cuadrado 1:1' },
  portrait: { w: 1350, h: 1688, label: 'Vertical 4:5' },
  story: { w: 1080, h: 1920, label: 'Historia 9:16' },
};

function calculatePlateLayout(format, plate = {}) {
  const canvas = FORMATS[format] || FORMATS.portrait;
  const margin = canvas.w * 0.055;
  const isStory = format === 'story';
  const footerY = canvas.h * 0.90;
  const footerH = canvas.h - footerY - canvas.h * 0.025;
  // Simplified layout like Que cambia for portrait
  const headerH = canvas.h * 0.08;
  const labelH = canvas.h * 0.045;
  const titleH = canvas.h * 0.15;
  const gap = canvas.h * 0.018;
  return {
    canvas,
    header: { x: 0, y: 0, w: canvas.w, h: headerH },
    label: { x: margin, y: canvas.h * 0.08, w: canvas.w - margin*2, h: labelH },
    title: { x: margin, y: canvas.h * 0.14, w: canvas.w - margin*2, h: titleH },
    impacts: { x: margin, y: canvas.h * 0.35, w: canvas.w - margin*2, h: footerY - canvas.h * 0.39 },
    footer: { x: margin, y: footerY, w: canvas.w - margin*2, h: footerH }
  };
}

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

const mainCanvas = $('#ctxTimelineCanvas');
const chartCanvas = $('#ctxChartCanvas');
const timelineCanvas = $('#ctxTimelineFullCanvas');
const infografiaCanvas = $('#ctxInfografiaCanvas');

const chartCard = $('#ctxChartCard');
const timelineCard = $('#ctxTimelineCard');
const infografiaCard = $('#ctxInfografiaCard');

if (!urlInput || !generateBtn || !mainCanvas) {
  console.error('[contexto] elementos no encontrados');
  return;
}

let lastData = null;
const FAMILIES = {
  general: { color:'#a6ce39', secondary:'#16201b', soft:'#eaf3de', label:'Actualidad' },
  clima: { color:'#367d9c', secondary:'#16303b', soft:'#dcedf3', label:'Clima' },
  policiales: { color:'#ba3f42', secondary:'#421c1e', soft:'#f8dddd', label:'Policiales' },
  sociales: { color:'#b36b27', secondary:'#422715', soft:'#f8ead7', label:'Sociedad' },
  politica: { color:'#5b4c91', secondary:'#251e42', soft:'#e9e4f7', label:'Política' },
  economia: { color:'#507118', secondary:'#213009', soft:'#eaf3de', label:'Economía' },
  deportes: { color:'#16806a', secondary:'#103c33', soft:'#d9f1eb', label:'Deportes' },
};
  // Re-render cuando el logo termina de cargar (para que header sea visible)
  logoImage.onload = () => {
    logoReady = true;
    if (lastData) {
      renderPlacaV2(lastData);
      const fam = FAMILIES[(lastData.categoria||'general').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')] || FAMILIES.general;
      const titulo = lastData.titulo_placa || lastData.titulo_corto || '';
      if (lastData.chart) renderChartPlaca(chartCanvas, lastData.chart, fam, titulo);
      if (lastData.timeline) renderTimelinePlaca(timelineCanvas, lastData.timeline, fam, titulo);
      if (lastData.infografia) renderInfografiaPlaca(infografiaCanvas, lastData.infografia, fam, titulo);
    }
  };
  logoImage.onerror = () => { logoReady = false; };

// Mocks con todos los recursos para preview
const MOCKS = {
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
    timeline: [
      {label:'2016', value:'Cierre', sub:'Remodelación de pista', highlight:false},
      {label:'2024', value:'San Rafael', sub:'Inversión local', highlight:false},
      {label:'15/09/26', value:'Licitación', sub:'Inicio del proceso', highlight:false},
      {label:'2026', value:'26M USD', sub:'Ampliación de terminal', highlight:true},
    ],
    chart: {
      titulo: 'Inversión por etapa',
      tipo: 'bar',
      datos: [
        {label:'Pista 2016', value: 8},
        {label:'San Rafael 2024', value: 5},
        {label:'Plumerillo 2026', value: 26},
      ]
    },
    infografia: {
      titulo: 'El Plumerillo en números',
      lineas: ['26 millones de dólares de inversión','7 aviones simultáneos','Doble de superficie internacional','15/09/26 licitación']
    },
    url: 'https://www.losandes.com.ar/politica/el-plumerillo-se-agranda/',
    imagen: ''
  },
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
    chart: null,
    infografia: null,
    url: 'https://www.losandes.com.ar/mendoza/aumento-colectivo-junio-2026/',
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
  let impactos = datos.map(d => ({ label:'', value:d, detail:'' }));
  if (!impactos.length && data.para_entender) {
    const parts = String(data.para_entender).replace(/^Para entender:\s*/i,'').split(/\s*\d\)\s*/).filter(s=>s.trim());
    impactos = parts.slice(0,3).map(p=>({label:'', value:p.trim(), detail:''}));
  }
  while (impactos.length < 3) impactos.push({label:'', value:'', detail:''});
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
    fuente: { url: data.url || '', nombre: 'mediamendoza', titulo_original: titulo, texto: '' },
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
  const rawCat = String(data.categoria||'general').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const family = FAMILIES[rawCat] || FAMILIES.general;
  const titulo = String(data.titulo_placa || data.titulo_corto || data.titulo || 'Para entender').trim();
  const datos = Array.isArray(data.para_entender_datos) ? data.para_entender_datos.slice(0,3).map(s=>String(s).trim()).filter(Boolean) : [];
  const ctx = mainCanvas.getContext('2d');
  const W = 1350, H = 1688;
  mainCanvas.width = W; mainCanvas.height = H;
  // Fondo como Que cambia
  ctx.fillStyle = family.soft;
  ctx.fillRect(0,0,W,H);
  const margin = W * 0.055;
  const headerH = 86;
  if (logoReady && logoImage.complete && logoImage.naturalWidth) {
    const iw = logoImage.naturalWidth, ih = logoImage.naturalHeight;
    const logoW = W * 0.22;
    const logoH = H * 0.07;
    const scale = Math.min(logoW/iw, logoH/ih);
    const dw = iw*scale, dh = ih*scale;
    ctx.drawImage(logoImage, W - margin - dw, H * 0.035, dw, dh);
  }
  // Etiqueta
  const labelText = 'PARA ENTENDER';
  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(20, W * 0.024)}px Inter, sans-serif`;
  const labelX = margin;
  const labelY = H * 0.08;
  const labelH = H * 0.045;
  ctx.fillText(labelText, labelX, labelY + labelH * 0.74);
  // Título
  const titleW = W - margin*2;
  let tSize = 56;
  let tLines = [];
  while (tSize >= 32) {
    ctx.font = `900 ${tSize}px Inter, sans-serif`;
    tLines = wrapText(ctx, titulo, titleW);
    if (tLines.length <= 2 && tLines.length * tSize * 1.08 <= 120) break;
    tSize -= 1;
  }
  ctx.fillStyle = family.secondary;
  ctx.font = `900 ${tSize}px Inter, sans-serif`;
  let ty = H * 0.14 + tSize;
  tLines.slice(0,2).forEach(l=>{ ctx.fillText(l, margin, ty); ty+= tSize*1.08; });
  // 3 impactos como Que cambia
  const footerY = H * 0.90;
  const impactsY = H * 0.35;
  const impactsH = footerY - H * 0.39;
  const gap = H * 0.018;
  const cardH = (impactsH - gap*2)/3;
  datos.slice(0,3).forEach((val, i)=>{
    const cardY = impactsY + i*(cardH+gap);
    const cardW = W - margin*2;
    ctx.fillStyle = '#ffffff';
    roundedRect(ctx, margin, cardY, cardW, cardH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(22,32,27,.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = family.color;
    roundedRect(ctx, margin, cardY, Math.max(8, W*0.010), cardH, 8);
    ctx.fill();
    const vSize = Math.max(26, W*0.034);
    ctx.fillStyle = family.secondary;
    ctx.font = `900 ${vSize}px Inter, sans-serif`;
    const lines = wrapText(ctx, val, cardW*0.86);
    let ly = cardY + vSize*1.1;
    // Centrar verticalmente si 1 línea
    const totalH = Math.min(lines.length,2) * vSize*1.05;
    const off = Math.max(0, (cardH - totalH)/2 - vSize*0.3);
    ly += off;
    lines.slice(0,2).forEach(l=>{ ctx.fillText(l, margin + cardW*0.07, ly); ly+= vSize*1.05; });
  });
  // Footer
  ctx.strokeStyle = 'rgba(22,32,27,.18)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(margin, footerY); ctx.lineTo(W-margin, footerY); ctx.stroke();
  ctx.fillStyle = '#526058';
  ctx.font = `700 ${Math.max(11, W*0.011)}px Inter, sans-serif`;
  ctx.fillText('Fuente: mediamendoza', margin, footerY + 22);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#526058';
  ctx.font = `700 ${Math.max(11, W*0.011)}px Inter, sans-serif`;
  ctx.fillText('www.mediamendoza.com', W-margin, footerY+22);
  ctx.textAlign = 'left';
}

// Helpers comunes placas-v2
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
function drawLogo(ctx, rect, darkColor) {
  if (!logoReady || !logoImage.complete || !logoImage.naturalWidth) return false;
  try {
    const w = Math.max(1, Math.round(rect.w));
    const h = Math.max(1, Math.round(rect.h));
    const surface = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w,h) : Object.assign(document.createElement('canvas'), {width:w, height:h});
    const sctx = surface.getContext('2d');
    if (!sctx || !sctx.getImageData) {
      const iw = logoImage.naturalWidth, ih = logoImage.naturalHeight;
      const scale = Math.min(w/iw, h/ih);
      const dw = iw*scale, dh = ih*scale;
      ctx.drawImage(logoImage, rect.x + (w-dw)/2, rect.y + (h-dh)/2, dw, dh);
      return true;
    }
    const iw = logoImage.naturalWidth, ih = logoImage.naturalHeight;
    const scale = Math.min(w/iw, h/ih);
    const dw = iw*scale, dh = ih*scale;
    sctx.clearRect(0,0,w,h);
    sctx.drawImage(logoImage, (w-dw)/2, (h-dh)/2, dw, dh);
    const imgData = sctx.getImageData(0,0,w,h);
    const d = imgData.data;
    const rgb = darkColor.match(/[a-f\d]{2}/gi)?.map(v=>parseInt(v,16)) || [22,32,27];
    for (let i=0;i<d.length;i+=4){
      if (d[i+3]>10 && d[i]>200 && d[i+1]>200 && d[i+2]>200){
        d[i]=rgb[0]; d[i+1]=rgb[1]; d[i+2]=rgb[2];
      }
    }
    sctx.putImageData(imgData,0,0);
    ctx.drawImage(surface, rect.x, rect.y, w, h);
    return true;
  } catch {
    return false;
  }
}

// Chart placa — ocupa todo el alto, pie grande, tipografía normalizada como Que cambia
function renderChartPlaca(canvas, chart, family, titulo) {
  const ctx = canvas.getContext('2d');
  const W = 1350, H = 1688;
  // Usar layout de Que cambia para header/footer y tarjetas
  const plate = {
    tipo: 'placa_noticia',
    version: 1,
    titulo: titulo,
    titulo_sintetico: titulo,
    bajada: chart.titulo || '',
    etiqueta: 'GRÁFICO',
    impactos: [],
    template_sugerido: family.id,
    tipo_placa: 'que-cambia',
    color_principal: family.color,
    color_secundario: family.secondary,
    fuente: { url: '', nombre: 'mediamendoza' }
  };
  const layout = calculatePlateLayout('portrait', plate);
  const margin = W * 0.055;
  // Fondo
  ctx.canvas.width = W; ctx.canvas.height = H;
  ctx.fillStyle = family.soft;
  ctx.fillRect(0,0,W,H);
  // Header como Que cambia — logo sin modificar
  const logoW = W * 0.22;
  const logoH = H * 0.07;
  if (logoReady && logoImage.complete && logoImage.naturalWidth) {
    const iw = logoImage.naturalWidth, ih = logoImage.naturalHeight;
    const scale = Math.min(logoW/iw, logoH/ih);
    const dw = iw*scale, dh = ih*scale;
    ctx.drawImage(logoImage, W - margin - dw, 28, dw, dh);
  }
  // Etiqueta GRÁFICO como Que cambia (QUÉ CAMBIA)
  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(20, W * 0.024)}px Inter, sans-serif`;
  ctx.fillText('GRÁFICO', layout.label.x, layout.label.y + layout.label.h*0.74);
  // Título
  const titleW = layout.title.w;
  let tSize = 56;
  let tLines = [];
  while (tSize >= 32) {
    ctx.font = `900 ${tSize}px Inter, sans-serif`;
    tLines = wrapText(ctx, titulo, titleW);
    if (tLines.length <= 2 && tLines.length * tSize*1.08 <= layout.title.h) break;
    tSize -= 1;
  }
  ctx.fillStyle = family.secondary;
  ctx.font = `900 ${tSize}px Inter, sans-serif`;
  let ty = layout.title.y + tSize;
  tLines.slice(0,2).forEach(l=>{ ctx.fillText(l, layout.title.x, ty); ty+= tSize*1.08; });
  // Subtítulo chart.titulo con barra
  if (chart.titulo) {
    ctx.fillStyle = family.color;
    ctx.fillRect(layout.title.x, ty+12, 56, 5);
    ctx.fillStyle = '#16201b';
    ctx.font = `700 20px Inter, sans-serif`;
    const subLines = wrapText(ctx, chart.titulo, titleW);
    let syy = ty+28;
    subLines.slice(0,1).forEach(l=>{ ctx.fillText(l, layout.title.x, syy); syy+=18; });
  }
  // Área gráfico — usar layout.impacts como contenedor (como Que cambia)
  const chartX = layout.impacts.x;
  const chartY = layout.impacts.y;
  const chartW = layout.impacts.w;
  const chartH = layout.impacts.h;
  // Fondo blanco para gráfico
  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, chartX, chartY, chartW, chartH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(22,32,27,.08)';
  ctx.stroke();
  const datos = chart.datos || [];
  const total = datos.reduce((a,b)=>a+b.value,0) || 1;
  const tipo = chart.tipo || 'bar';
  if (tipo === 'pie' || tipo === 'doughnut') {
    const cx = chartX + chartW/2;
    const cy = chartY + chartH*0.44;
    const radius = Math.min(340, Math.min(chartW*0.42, chartH*0.42));
    const hole = tipo === 'doughnut' ? radius*0.52 : 0;
    let start = -Math.PI/2;
    const colors = [family.color, family.secondary, '#7a9e1f', '#367d9c', '#b36b27', '#5b4c91'];
    datos.forEach((d,i)=>{
      const slice = (d.value / total) * Math.PI*2;
      const end = start + slice;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,radius,start,end);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();
      const mid = (start+end)/2;
      const rMid = hole ? (radius+hole)/2 : radius*0.64;
      const lx = cx + Math.cos(mid)*rMid;
      const ly = cy + Math.sin(mid)*rMid;
      const pct = Math.round((d.value/total)*100);
      if (slice > 0.25) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 38px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pct+'%', lx, ly);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      start = end;
    });
    if (tipo === 'doughnut') {
      ctx.beginPath(); ctx.arc(cx,cy,hole,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
      ctx.fillStyle=family.secondary; ctx.font=`800 14px Inter, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('TOTAL', cx, cy-10); ctx.font=`900 28px Inter, sans-serif`; ctx.fillText(String(total.toLocaleString('es-AR')), cx, cy+16);
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    }
    // Leyenda pills grandes
    const legendY = chartY + chartH - 76;
    const pillH = 42;
    let lx = chartX + 16;
    let ly = legendY;
    datos.forEach((d,i)=>{
      const label = `${d.label}: ${d.value.toLocaleString('es-AR')} (${Math.round(d.value/total*100)}%)`;
      ctx.font = `700 15px Inter, sans-serif`;
      const w = ctx.measureText(label).width + 40;
      if (lx + w > chartX + chartW - 16) { lx = chartX + 16; ly += pillH + 8; }
      ctx.fillStyle = i===0 ? family.color : i===1 ? family.secondary : '#f2f4f0';
      roundedRect(ctx, lx, ly, w, pillH, pillH/2);
      ctx.fill();
      if (i>=2) { ctx.strokeStyle='rgba(22,32,27,.1)'; ctx.stroke(); }
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath(); ctx.arc(lx+14, ly+pillH/2, 7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = i===1 ? '#ffffff' : '#16201b';
      if (i===0) ctx.fillStyle = '#ffffff';
      ctx.font = `700 15px Inter, sans-serif`;
      ctx.fillText(label, lx+26, ly+23);
      lx += w + 12;
    });
  } else {
    const padL = 64, padR = 20, padT = 20, padB = 56;
    const innerX = chartX + padL;
    const innerY = chartY + padT;
    const innerW = chartW - padL - padR;
    const innerH = chartH - padT - padB;
    const maxVal = Math.max(...datos.map(d=>d.value), 1);
    ctx.strokeStyle = 'rgba(22,32,27,.07)';
    ctx.lineWidth = 1;
    for (let i=0;i<=4;i++){
      const y = innerY + (innerH/4)*i;
      ctx.beginPath(); ctx.moveTo(innerX, y); ctx.lineTo(innerX+innerW, y); ctx.stroke();
      ctx.fillStyle = '#6b7a6e';
      ctx.font = `700 14px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal - (maxVal/4)*i).toLocaleString('es-AR')), innerX - 10, y + 4);
      ctx.textAlign = 'left';
    }
    const barW = (innerW / datos.length) * 0.62;
    const gap = (innerW / datos.length) * 0.44;
    datos.forEach((d,i)=>{
      const h = (d.value / maxVal) * innerH;
      const x = innerX + (innerW/datos.length)*i + gap/2;
      const y = innerY + innerH - h;
      const grd = ctx.createLinearGradient(x, y, x, y+h);
      grd.addColorStop(0, family.color);
      grd.addColorStop(1, family.secondary);
      ctx.fillStyle = grd;
      roundedRect(ctx, x, y, barW, h, 8);
      ctx.fill();
      ctx.fillStyle = family.secondary;
      ctx.font = `900 24px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(d.value.toLocaleString('es-AR'), x + barW/2, y - 10);
      ctx.fillStyle = '#16201b';
      ctx.font = `700 14px Inter, sans-serif`;
      const labLines = wrapText(ctx, d.label, barW + gap);
      let lyy = innerY + innerH + 18;
      labLines.slice(0,2).forEach(ll=>{ ctx.fillText(ll, x+barW/2, lyy); lyy+=13; });
      ctx.textAlign = 'left';
    });
  }
  // Footer como Que cambia
  const footerY = layout.footer.y; // footer at 0.90*H from layout
  ctx.strokeStyle = 'rgba(22,32,27,.18)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(layout.footer.x, footerY); ctx.lineTo(W - layout.footer.x, footerY); ctx.stroke();
  ctx.fillStyle = '#526058';
  ctx.font = `700 14px Inter, sans-serif`;
  ctx.fillText('Fuente: mediamendoza', layout.footer.x, footerY + 22);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#526058';
  ctx.font = `700 14px Inter, sans-serif`;
  ctx.fillText('www.mediamendoza.com', W - layout.footer.x, footerY + 22);
  ctx.textAlign = 'left';
}


function renderTimelinePlaca(canvas, timeline, family, titulo) {
  const ctx = canvas.getContext('2d');
  const W = 1350, H = 1688;
  const plate = {
    tipo: 'placa_noticia',
    version: 1,
    titulo: titulo,
    titulo_sintetico: titulo,
    bajada: '',
    etiqueta: 'LÍNEA DE TIEMPO',
    impactos: timeline.map(t => ({ label: t.label, value: `${t.value} — ${t.sub}`, detail: '' })),
    template_sugerido: family.id,
    tipo_placa: 'que-cambia',
    color_principal: family.color,
    color_secundario: family.secondary,
    fuente: { url: '', nombre: 'mediamendoza' }
  };
  const layout = calculatePlateLayout('portrait', plate);
  // Usar el mismo fondo y header que Que cambia pero dibujado manual para timeline vertical
  ctx.canvas.width = W; ctx.canvas.height = H;
  ctx.fillStyle = family.soft;
  ctx.fillRect(0,0,W,H);
  const margin = W * 0.055;
  // Header
  const logoW = W * 0.22; const logoH = H * 0.07;
  if (logoReady && logoImage.complete && logoImage.naturalWidth) {
    const iw = logoImage.naturalWidth, ih = logoImage.naturalHeight;
    const scale = Math.min(logoW/iw, logoH/ih);
    const dw = iw*scale, dh = ih*scale;
    ctx.drawImage(logoImage, W - margin - dw, 28, dw, dh);
  }
  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(20, W * 0.024)}px Inter, sans-serif`;
  ctx.fillText('LÍNEA DE TIEMPO', layout.label.x, layout.label.y + layout.label.h*0.74);
  // Título
  const titleW = layout.title.w;
  let tSize = 56;
  let tLines = [];
  while (tSize >= 32) {
    ctx.font = `900 ${tSize}px Inter, sans-serif`;
    tLines = wrapText(ctx, titulo, titleW);
    if (tLines.length <= 2 && tLines.length * tSize*1.08 <= layout.title.h) break;
    tSize -= 1;
  }
  ctx.fillStyle = family.secondary;
  ctx.font = `900 ${tSize}px Inter, sans-serif`;
  let ty = layout.title.y + tSize;
  tLines.slice(0,2).forEach(l=>{ ctx.fillText(l, layout.title.x, ty); ty+= tSize*1.08; });
  // Timeline vertical — usa layout.impacts como área
  const tlX = layout.impacts.x + 28;
  const tlY = layout.impacts.y;
  const tlH = layout.impacts.h;
  ctx.strokeStyle='rgba(22,32,27,.12)'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(tlX, tlY); ctx.lineTo(tlX, tlY+tlH); ctx.stroke();
  const n = timeline.length;
  const usableH = tlH - 40;
  const step = n>1 ? usableH / (n-1) : 0;
  const glyphs = ['◈','⬢','⬣','★','◆'];
  timeline.forEach((it,i)=>{
    const y = tlY + 20 + step*i;
    const hi = !!it.highlight;
    ctx.shadowColor='rgba(22,32,27,.14)'; ctx.shadowBlur=8; ctx.shadowOffsetY=3;
    ctx.beginPath(); ctx.arc(tlX, y, hi?16:12, 0, Math.PI*2); ctx.fillStyle= hi? family.color : '#ffffff'; ctx.fill();
    ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    ctx.strokeStyle= hi? family.color : family.secondary; ctx.lineWidth= hi?4:3; ctx.stroke();
    if (hi){ ctx.beginPath(); ctx.arc(tlX,y,5,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill(); }
    const cardX = tlX + 32;
    const cardW = layout.impacts.w - 32;
    const cardH = n===2 ? 200 : n===3 ? 170 : 150;
    const cardY = y - cardH/2;
    const clampedY = Math.max(tlY, Math.min(cardY, tlY+tlH - cardH));
    ctx.shadowColor='rgba(22,32,27,.08)'; ctx.shadowBlur=10; ctx.shadowOffsetY=4;
    ctx.fillStyle = '#ffffff';
    // Usar roundedRect del layout
    ctx.beginPath();
    ctx.moveTo(cardX+12, clampedY);
    ctx.arcTo(cardX+cardW, clampedY, cardX+cardW, clampedY+cardH, 12);
    ctx.arcTo(cardX+cardW, clampedY+cardH, cardX, clampedY+cardH, 12);
    ctx.arcTo(cardX, clampedY+cardH, cardX, clampedY, 12);
    ctx.arcTo(cardX, clampedY, cardX+cardW, clampedY, 12);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    ctx.strokeStyle= hi ? family.color : 'rgba(22,32,27,.08)'; ctx.lineWidth= hi?2:1; ctx.stroke();
    ctx.fillStyle= hi ? family.color : family.secondary;
    ctx.fillRect(cardX, clampedY, 7, cardH);
    ctx.fillStyle= hi ? family.color : '#6b7a6e';
    ctx.font=`800 12px Inter, sans-serif`;
    ctx.fillText(glyphs[i % glyphs.length] + '  ' + String(it.label||'').toUpperCase(), cardX+20, clampedY+28);
    ctx.fillStyle= hi ? family.secondary : '#16201b';
    ctx.font=`900 20px Inter, sans-serif`;
    ctx.fillText(String(it.value||''), cardX+20, clampedY+56);
    ctx.fillStyle='#526058'; ctx.font=`600 13px Inter, sans-serif`;
    const sub = String(it.sub||'').trim();
    if (sub) {
      const subLines=wrapText(ctx, sub, cardW-40);
      ctx.fillText(subLines[0]||'', cardX+20, clampedY+80);
      if (subLines[1]) ctx.fillText(subLines[1], cardX+20, clampedY+96);
    }
    if (hi) {
      ctx.fillStyle=family.color; ctx.font=`700 10px Inter, sans-serif`;
      const badge = 'AHORA';
      const bw = ctx.measureText(badge).width + 16;
      ctx.beginPath();
      ctx.moveTo(cardX+cardW - bw - 14 + 10, clampedY+14);
      ctx.arcTo(cardX+cardW - 14, clampedY+14, cardX+cardW -14, clampedY+14+20, 10);
      ctx.arcTo(cardX+cardW -14, clampedY+14+20, cardX+cardW - bw -14, clampedY+14+20, 10);
      ctx.arcTo(cardX+cardW - bw -14, clampedY+14+20, cardX+cardW - bw -14, clampedY+14, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle='#fff'; ctx.fillText(badge, cardX+cardW - bw -6, clampedY+28);
    }
  });
  // Footer como Que cambia
  const footerY = layout.footer.y; // footer at 0.90*H from layout
  ctx.strokeStyle = 'rgba(22,32,27,.18)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(layout.footer.x, footerY); ctx.lineTo(W - layout.footer.x, footerY); ctx.stroke();
  ctx.fillStyle = '#526058';
  ctx.font = `700 14px Inter, sans-serif`;
  ctx.fillText('Fuente: mediamendoza', layout.footer.x, footerY + 22);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#526058';
  ctx.font = `700 14px Inter, sans-serif`;
  ctx.fillText('www.mediamendoza.com', W - layout.footer.x, footerY + 22);
  ctx.textAlign = 'left';
}


function renderInfografiaPlaca(canvas, infografia, family, titulo) {
  const ctx = canvas.getContext('2d');
  const W=1350,H=1688;
  const plate = {
    tipo: 'placa_noticia',
    version: 1,
    titulo: infografia.titulo || titulo,
    titulo_sintetico: infografia.titulo || titulo,
    bajada: '',
    etiqueta: 'INFOGRAFÍA',
    impactos: (infografia.lineas || []).map(l => ({ label:'', value:l, detail:'' })),
    template_sugerido: family.id,
    tipo_placa: 'que-cambia',
    color_principal: family.color,
    color_secundario: family.secondary,
    fuente: { url: '', nombre: 'mediamendoza' }
  };
  const layout = calculatePlateLayout('portrait', plate);
  ctx.canvas.width = W; ctx.canvas.height = H;
  ctx.fillStyle = family.soft;
  ctx.fillRect(0,0,W,H);
  const margin = W*0.055;
  // Header
  const logoW = W * 0.22; const logoH = H * 0.07;
  if (logoReady && logoImage.complete && logoImage.naturalWidth) {
    const iw = logoImage.naturalWidth, ih = logoImage.naturalHeight;
    const scale = Math.min(logoW/iw, logoH/ih);
    const dw = iw*scale, dh = ih*scale;
    ctx.drawImage(logoImage, W - margin - dw, 28, dw, dh);
  }
  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(20, W*0.024)}px Inter, sans-serif`;
  ctx.fillText('INFOGRAFÍA', layout.label.x, layout.label.y + layout.label.h*0.74);
  // Título
  const titleW = layout.title.w;
  let tSize = 56; let tLines=[];
  while(tSize>=28){ ctx.font=`900 ${tSize}px Inter, sans-serif`; tLines=wrapText(ctx, infografia.titulo || titulo, titleW); if(tLines.length<=2 && tLines.length*tSize*1.08<=layout.title.h) break; tSize-=1; }
  ctx.fillStyle=family.secondary; ctx.font=`900 ${tSize}px Inter, sans-serif`; let ty=layout.title.y + tSize; tLines.slice(0,2).forEach(l=>{ctx.fillText(l, layout.title.x, ty); ty+= tSize*1.08;});
  // Grid 2x2 — rediseñada para ocupar todo el alto sin huecos, con glifos prominentes
  const lineas = infografia.lineas || [];
  const n = lineas.length;
  // Usar espacio desde debajo del título hasta antes del footer, no el área fija de impacts
  const gridTop = ty + 32;
  const gridBottom = H - 88;
  const availableH = gridBottom - gridTop;
  const areaX = margin;
  const areaW = W - margin*2;
  function pickGlyph(text, idx){
    const t = String(text).toLowerCase();
    if (t.includes('crédito') || t.includes('credito')) return '◈';
    if (t.includes('familia') || t.includes('mora')) return '⬢';
    if (t.includes('solucion') || t.includes('ejecución')) return '⬣';
    if (t.includes('2027') || t.includes('agosto') || t.includes('fecha')) return '◆';
    if (t.includes('descuento') || t.includes('%')) return '★';
    return ['◈','⬢','⬣','◆'][idx % 4];
  }
  if (n === 4) {
    const gap = 16;
    const cardW = (areaW - gap)/2;
    const cardH = (availableH - gap)/2;
    lineas.forEach((linea,i)=>{
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = areaX + col*(cardW+gap);
      const y = gridTop + row*(cardH+gap);
      ctx.fillStyle='#ffffff';
      ctx.beginPath();
      ctx.moveTo(x+12, y);
      ctx.arcTo(x+cardW, y, x+cardW, y+cardH, 14);
      ctx.arcTo(x+cardW, y+cardH, x, y+cardH, 14);
      ctx.arcTo(x, y+cardH, x, y, 14);
      ctx.arcTo(x, y, x+cardW, y, 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle='rgba(22,32,27,.07)'; ctx.stroke();
      ctx.fillStyle=family.color; ctx.fillRect(x, y, cardW, 6);
      const glyph = pickGlyph(linea,i);
      // Glifo grande arriba
      ctx.fillStyle=family.soft; ctx.beginPath(); ctx.arc(x+32, y+44, 28,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=family.color; ctx.font=`900 22px Inter, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(glyph, x+32, y+44);
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      const numMatch = String(linea).match(/(\d[\d\.\,]*\s*%?)/);
      const num = numMatch ? numMatch[1].trim() : '';
      const rest = num ? String(linea).replace(num, '').trim().replace(/^[\-\—\:]?\s*/,'') : linea;
      // Contenido centrado verticalmente en la tarjeta
      const contentH = num ? 92 : 60;
      const centerY = y + cardH/2;
      if (num) {
        // Número gigante centrado
        ctx.fillStyle=family.secondary; ctx.font=`900 48px Inter, sans-serif`;
        ctx.textAlign='center';
        ctx.fillText(num, x+cardW/2, centerY - 8);
        ctx.fillStyle='#16201b'; ctx.font=`700 15px Inter, sans-serif`;
        const descLines = wrapText(ctx, rest, cardW-48);
        let lyy = centerY + 28;
        descLines.slice(0,2).forEach(ll=>{
          const w = ctx.measureText(ll).width;
          ctx.fillText(ll, x+cardW/2 - w/2, lyy);
          lyy+=18;
        });
        ctx.textAlign='left';
      } else {
        ctx.fillStyle='#16201b'; ctx.font=`700 18px Inter, sans-serif`;
        const descLines = wrapText(ctx, linea, cardW-40);
        let lyy = y+ 78;
        descLines.slice(0,3).forEach(ll=>{ ctx.fillText(ll, x+16, lyy); lyy+=18; });
      }
      ctx.fillStyle='rgba(22,32,27,.06)'; ctx.font=`900 24px Inter, sans-serif`; ctx.textAlign='right';
      ctx.fillText(String(i+1), x+cardW-14, y+cardH-14);
      ctx.textAlign='left';
    });
  } else {
    const gap = 14;
    const cardH = (availableH - gap*(n-1))/n;
    lineas.forEach((linea,i)=>{
      const y = gridTop + i*(cardH+gap);
      ctx.fillStyle='#ffffff';
      ctx.beginPath();
      ctx.moveTo(areaX+12, y);
      ctx.arcTo(areaX+areaW, y, areaX+areaW, y+cardH, 14);
      ctx.arcTo(areaX+areaW, y+cardH, areaX, y+cardH, 14);
      ctx.arcTo(areaX, y+cardH, areaX, y, 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle='rgba(22,32,27,.07)'; ctx.stroke();
      ctx.fillStyle=family.color; ctx.fillRect(areaX, y, 8, cardH);
      const glyph = pickGlyph(linea,i);
      const cx = areaX + 48; const cy = y + cardH/2;
      ctx.fillStyle=family.soft; ctx.beginPath(); ctx.arc(cx, cy, 28,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=family.color; ctx.font=`900 18px Inter, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(glyph, cx, cy);
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      const numMatch = String(linea).match(/(\d[\d\.\,]*\s*%?)/);
      const fullNum = numMatch ? numMatch[1].trim() : '';
      const rest = fullNum ? String(linea).replace(fullNum,'').trim().replace(/^[\-\—\:]?\s*/,'') : linea;
      if (fullNum) {
        ctx.fillStyle=family.secondary; ctx.font=`900 24px Inter, sans-serif`;
        ctx.fillText(fullNum, areaX+88, y+ cardH/2 - 6);
        ctx.fillStyle='#16201b'; ctx.font=`600 13px Inter, sans-serif`;
        const descLines = wrapText(ctx, rest, areaW - 120);
        let lyy = y+ cardH/2 + 14;
        descLines.slice(0,2).forEach(ll=>{ ctx.fillText(ll, areaX+88, lyy); lyy+=15; });
      } else {
        ctx.fillStyle='#16201b'; ctx.font=`700 16px Inter, sans-serif`;
        const lines = wrapText(ctx, linea, areaW - 110);
        let lyy = y+ cardH/2 - (lines.length*16)/2 + 6;
        lines.slice(0,2).forEach(ll=>{ ctx.fillText(ll, areaX+88, lyy); lyy+=18; });
      }
    });
  }
  // Footer como Que cambia
  const footerY = layout.footer.y; // footer at 0.90*H from layout
  ctx.strokeStyle = 'rgba(22,32,27,.18)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(layout.footer.x, footerY); ctx.lineTo(W - layout.footer.x, footerY); ctx.stroke();
  ctx.fillStyle = '#526058';
  ctx.font = `700 14px Inter, sans-serif`;
  ctx.fillText('Fuente: mediamendoza', layout.footer.x, footerY + 22);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#526058';
  ctx.font = `700 14px Inter, sans-serif`;
  ctx.fillText('www.mediamendoza.com', W - layout.footer.x, footerY + 22);
  ctx.textAlign = 'left';
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

  // Render principal
  renderPlacaV2(data);

  // Chart condicional
  const famRaw = String(data.categoria||'general').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const fam = FAMILIES[famRaw] || FAMILIES.general;
  const tituloPlaca = data.titulo_placa || data.titulo_corto || '';

  if (data.chart && data.chart.datos && data.chart.datos.length >=2) {
    chartCard.classList.remove('is-hidden');
    document.getElementById('ctxChartDesc').textContent = data.chart.titulo || 'Datos comparados';
    renderChartPlaca(chartCanvas, data.chart, fam, tituloPlaca);
  } else {
    chartCard.classList.add('is-hidden');
  }

  if (Array.isArray(data.timeline) && data.timeline.length >=2) {
    timelineCard.classList.remove('is-hidden');
    renderTimelinePlaca(timelineCanvas, data.timeline, fam, tituloPlaca);
  } else {
    timelineCard.classList.add('is-hidden');
  }

  if (data.infografia && Array.isArray(data.infografia.lineas) && data.infografia.lineas.length >=2) {
    infografiaCard.classList.remove('is-hidden');
    renderInfografiaPlaca(infografiaCanvas, data.infografia, fam, tituloPlaca);
  } else {
    infografiaCard.classList.add('is-hidden');
  }

  results.classList.remove('is-hidden');
  empty.style.display = 'none';
  try { results.scrollIntoView({ behavior:'smooth', block:'start' }); } catch {}
}

function setLoading(on) {
  loading.classList.toggle('is-hidden', !on);
  generateBtn.disabled = on;
  generateBtn.textContent = on ? 'Generando…' : 'Generar contexto →';
}

async function generarReal(url) {
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
  const scrapeRes = await fetch(WORKER + '/scrape?url=' + encodeURIComponent(url));
  const scrapeData = await scrapeRes.json().catch(()=> ({}));
  if (!scrapeRes.ok || scrapeData.error) throw new Error(scrapeData.error || 'No se pudo leer la nota. Probá con otra URL.');
  const titulo = scrapeData.titulo || '';
  const categoria = scrapeData.categoria || 'general';
  const texto = (scrapeData.texto || '').substring(0, 8000);
  if (!texto || texto.length < 80) throw new Error('Contenido muy corto para generar contexto.');
  const prompt = `Sos editor de Media Mendoza, diario del sur mendocino (San Rafael, Mendoza, Argentina). Analizá esta nota y generá CONTEXTO y RECURSOS VISUALES.

NOTA ORIGINAL:
Título: ${titulo || "(sin título)"}
Categoría: ${categoria}
URL: ${url}
Cuerpo:
${texto}

INSTRUCCIONES:
- Respondé SOLO con JSON válido sin markdown, sin backticks.
- "para_entender": "Para entender: 1) ... 2) ... 3) ..."
- "para_entender_datos": ["dato1","dato2","dato3"]
- "que_paso_antes": [{"titulo":"...","fuente":"...","fecha":"DD/MM/AA","url":"https://..."}, ...3]
- "gancho_whatsapp": 55-65 palabras
- "preguntas": 5 preguntas
- "timeline": array 4 hitos o null si no hay evolución temporal
- "chart": {"titulo":"...","tipo":"bar|line|pie","datos":[{"label":"...","value":123},...]} o null si no hay datos numéricos comparables
- "infografia": {"titulo":"...","lineas":["...","...","..."]} o null si no hay datos de alto impacto
- "categoria": general|clima|policiales|sociales|politica|economia|deportes
- "titulo_corto": 60ch
- "titulo_placa": 75ch

Formato JSON exacto:
{"titulo_corto":"...","titulo_placa":"...","categoria":"...","para_entender":"Para entender: 1) ... 2) ... 3) ...","para_entender_datos":["dato1","dato2","dato3"],"que_paso_antes":[{"titulo":"...","fuente":"...","fecha":"...","url":"..."},{"titulo":"...","fuente":"...","fecha":"...","url":"..."},{"titulo":"...","fuente":"...","fecha":"...","url":"..."}],"gancho_whatsapp":"...","preguntas":["...","...","...","...","..."],"timeline":null,"chart":null,"infografia":null}`;
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

function setupDownload(btnId, canvas) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,10);
    const slug = (lastData?.titulo_corto || 'contexto').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,30);
    const suffix = btnId.replace('ctxDownload','').toLowerCase() || 'placa';
    a.download = `contexto-${slug}-${suffix}-${stamp}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    toast('PNG descargado');
  });
}
setupDownload('ctxDownloadPng', mainCanvas);
setupDownload('ctxDownloadChart', chartCanvas);
setupDownload('ctxDownloadTimeline', timelineCanvas);
setupDownload('ctxDownloadInfografia', infografiaCanvas);

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generateBtn.click();
});

// Preview inicial
const preview = MOCKS.plumerillo;
showResults(preview, preview.url);
setTimeout(()=> { results.classList.add('is-hidden'); empty.style.display=''; }, 80);

} // end init

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContexto);
} else {
  initContexto();
}
