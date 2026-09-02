import { renderNewsPlate } from '../placas-v2/renderer.mjs';
import { FAMILIES } from '../placas-v2/editorial-core.mjs';

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';

const logoImage = new Image();
logoImage.src = '../assets/logo.png';
let logoReady = false;
logoImage.onload = () => { logoReady = true; if (lastData) renderAll(lastData); };
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
  const plate = buildPlacaContexto(data);
  try {
    const ctx = mainCanvas.getContext('2d');
    renderNewsPlate(ctx, plate, 'portrait', { image: null, focus:{x:0.5,y:0.5}, logo: logoReady ? logoImage : null, personImages:{}, supportImage:null, supportFocus:{x:0.5,y:0.5}, forceCover:true });
  } catch (e) {
    console.error('[contexto] render placa v2 falló', e);
  }
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

// Chart placa con estilo Placas v2
function renderChartPlaca(canvas, chart, family, titulo) {
  const ctx = canvas.getContext('2d');
  const W = 1350, H = 1688;
  canvas.width = W; canvas.height = H;
  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,'#ffffff');
  grad.addColorStop(1, family.soft);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);
  const margin = W * 0.055;
  // Logo
  if (logoReady) {
    const logoW = W * 0.28;
    const logoH = H * 0.06;
    const iw = logoImage.naturalWidth, ih = logoImage.naturalHeight;
    const scale = Math.min(logoW/iw, logoH/ih);
    const dw = iw*scale, dh = ih*scale;
    ctx.drawImage(logoImage, W - margin - dw, 28, dw, dh);
  } else {
    ctx.fillStyle = family.secondary;
    ctx.font = `900 16px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('mediamendoza.com', W - margin, 48);
    ctx.textAlign = 'left';
  }
  // Etiqueta
  const labelText = 'GRÁFICO';
  ctx.font = `900 20px Inter, sans-serif`;
  const labelPadX = 16;
  const labelW = ctx.measureText(labelText).width + labelPadX*2;
  const labelH = 36;
  const labelY = 72;
  ctx.fillStyle = family.color;
  roundedRect(ctx, margin, labelY, labelW, labelH, 7);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = `900 14px Inter, sans-serif`;
  ctx.fillText(labelText, margin + labelPadX, labelY + labelH/2 + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = family.secondary;
  ctx.font = `700 11px Inter, sans-serif`;
  ctx.fillText(family.label.toUpperCase(), margin + labelW + 12, labelY + labelH/2 + 4);

  // Título
  const titleW = W - margin*2;
  let tSize = 46;
  let tLines = [];
  while (tSize >= 28) {
    ctx.font = `900 ${tSize}px Inter, sans-serif`;
    tLines = wrapText(ctx, titulo, titleW);
    if (tLines.length <= 2 && tLines.length * tSize * 1.1 <= 110) break;
    tSize -= 1;
  }
  ctx.fillStyle = family.secondary;
  ctx.font = `900 ${tSize}px Inter, sans-serif`;
  let ty = 150 + tSize;
  tLines.slice(0,2).forEach(l=>{ ctx.fillText(l, margin, ty); ty+= tSize*1.1; });
  // Chart título
  if (chart.titulo) {
    ctx.fillStyle = '#526058';
    ctx.font = `700 16px Inter, sans-serif`;
    ctx.fillText(chart.titulo, margin, ty + 18);
    ty += 36;
  } else ty += 18;
  // Área gráfico
  const chartX = margin;
  const chartY = ty + 10;
  const chartW = W - margin*2;
  const chartH = 620;
  // fondo chart
  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, chartX, chartY, chartW, chartH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(22,32,27,.08)';
  ctx.stroke();

  const datos = chart.datos || [];
  const maxVal = Math.max(...datos.map(d=>d.value), 1);
  const tipo = chart.tipo || 'bar';

  if (tipo === 'pie' || tipo === 'doughnut') {
    // Pie chart simple
    const cx = chartX + chartW/2;
    const cy = chartY + chartH/2 + 10;
    const radius = Math.min(220, chartW*0.28);
    let start = -Math.PI/2;
    const colors = [family.color, family.secondary, '#367d9c', '#b36b27', '#5b4c91', '#16806a'];
    datos.forEach((d,i)=>{
      const slice = (d.value / datos.reduce((a,b)=>a+b.value,0)) * Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,radius,start,start+slice);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      start += slice;
    });
    // leyenda
    let ly = chartY + chartH - 18;
    ctx.font = `600 12px Inter, sans-serif`;
    datos.forEach((d,i)=>{
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(chartX + 18 + (i%3)* (chartW/3), ly - 28 - Math.floor(i/3)*22, 10,10);
      ctx.fillStyle = '#16201b';
      ctx.fillText(`${d.label}: ${d.value}`, chartX + 32 + (i%3)*(chartW/3), ly - 20 - Math.floor(i/3)*22);
    });
  } else {
    // Bar / line
    const padL = 70, padR = 24, padT = 24, padB = 60;
    const innerX = chartX + padL;
    const innerY = chartY + padT;
    const innerW = chartW - padL - padR;
    const innerH = chartH - padT - padB;
    // grid
    ctx.strokeStyle = 'rgba(22,32,27,.08)';
    ctx.lineWidth = 1;
    for (let i=0;i<=4;i++){
      const y = innerY + (innerH/4)*i;
      ctx.beginPath(); ctx.moveTo(innerX, y); ctx.lineTo(innerX+innerW, y); ctx.stroke();
      ctx.fillStyle = '#6b7a6e';
      ctx.font = `600 11px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal - (maxVal/4)*i)), innerX - 10, y + 4);
      ctx.textAlign = 'left';
    }
    const barW = (innerW / datos.length) * 0.62;
    const gap = (innerW / datos.length) * 0.38;
    datos.forEach((d,i)=>{
      const h = (d.value / maxVal) * innerH;
      const x = innerX + (innerW/datos.length)*i + gap/2;
      const y = innerY + innerH - h;
      // barra degradada familia
      const grd = ctx.createLinearGradient(x, y, x, y+h);
      grd.addColorStop(0, family.color);
      grd.addColorStop(1, family.secondary);
      ctx.fillStyle = grd;
      roundedRect(ctx, x, y, barW, h, 6);
      ctx.fill();
      // valor arriba
      ctx.fillStyle = family.secondary;
      ctx.font = `800 13px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(d.value), x + barW/2, y - 8);
      // label abajo
      ctx.fillStyle = '#16201b';
      ctx.font = `600 11px Inter, sans-serif`;
      const labLines = wrapText(ctx, d.label, barW + gap);
      let lyy = innerY + innerH + 16;
      labLines.slice(0,2).forEach(ll=>{ ctx.fillText(ll, x+barW/2, lyy); lyy+=12; });
      ctx.textAlign = 'left';
    });
    if (tipo === 'line') {
      // línea por encima de barras
      ctx.strokeStyle = family.secondary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      datos.forEach((d,i)=>{
        const x = innerX + (innerW/datos.length)*i + gap/2 + barW/2;
        const y = innerY + innerH - (d.value/maxVal)*innerH;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.stroke();
      datos.forEach((d,i)=>{
        const x = innerX + (innerW/datos.length)*i + gap/2 + barW/2;
        const y = innerY + innerH - (d.value/maxVal)*innerH;
        ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill(); ctx.strokeStyle=family.secondary; ctx.lineWidth=2; ctx.stroke();
      });
    }
  }

  // Footer
  const footerY = H - 56;
  ctx.fillStyle = 'rgba(22,32,27,.14)';
  ctx.fillRect(margin, footerY - 12, W - margin*2, 1);
  ctx.fillStyle = '#6b7a6e';
  ctx.font = `700 12px Inter, sans-serif`;
  ctx.fillText('www.mediamendoza.com', margin, footerY + 10);
  ctx.textAlign = 'right';
  ctx.fillStyle = family.color;
  ctx.font = `900 12px Inter, sans-serif`;
  ctx.fillText('mediamendoza  •  GRÁFICO', W - margin, footerY + 10);
  ctx.textAlign = 'left';
  ctx.fillStyle = family.color;
  ctx.fillRect(0, H - 4, W, 4);
}

// Timeline placa estilo Placas v2
function renderTimelinePlaca(canvas, timeline, family, titulo) {
  const ctx = canvas.getContext('2d');
  const W = 1350, H = 1688;
  canvas.width = W; canvas.height = H;
  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,'#ffffff');
  grad.addColorStop(1, family.soft);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);
  const margin = W*0.055;
  if (logoReady) {
    const logoW = W*0.28; const logoH=H*0.06;
    const scale = Math.min(logoW/logoImage.naturalWidth, logoH/logoImage.naturalHeight);
    ctx.drawImage(logoImage, W-margin - logoImage.naturalWidth*scale, 28, logoImage.naturalWidth*scale, logoImage.naturalHeight*scale);
  } else {
    ctx.fillStyle = family.secondary; ctx.font=`900 16px Inter, sans-serif`; ctx.textAlign='right'; ctx.fillText('mediamendoza.com', W-margin,48); ctx.textAlign='left';
  }
  const labelText='LÍNEA DE TIEMPO';
  ctx.font=`900 20px Inter, sans-serif`; const padX=16; const lw=ctx.measureText(labelText).width+padX*2; const lh=36, ly=72;
  ctx.fillStyle=family.color; roundedRect(ctx,margin,ly,lw,lh,7); ctx.fill();
  ctx.fillStyle='#fff'; ctx.textBaseline='middle'; ctx.font=`900 14px Inter, sans-serif`; ctx.fillText(labelText, margin+padX, ly+lh/2+1); ctx.textBaseline='alphabetic';
  ctx.fillStyle=family.secondary; ctx.font=`700 11px Inter, sans-serif`; ctx.fillText(family.label.toUpperCase(), margin+lw+12, ly+lh/2+4);
  let tSize=46; let tLines=[];
  const tW=W-margin*2;
  while(tSize>=28){ ctx.font=`900 ${tSize}px Inter, sans-serif`; tLines=wrapText(ctx,titulo,tW); if(tLines.length<=2 && tLines.length*tSize*1.1<=110) break; tSize-=1; }
  ctx.fillStyle=family.secondary; ctx.font=`900 ${tSize}px Inter, sans-serif`; let ty=150+tSize; tLines.slice(0,2).forEach(l=>{ctx.fillText(l,margin,ty); ty+=tSize*1.1;});
  // Línea vertical timeline
  const tlX = margin + 36;
  const tlY = 300;
  const tlH = H - 420;
  ctx.strokeStyle='rgba(22,32,27,.12)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(tlX, tlY); ctx.lineTo(tlX, tlY+tlH); ctx.stroke();
  const n = timeline.length;
  const step = tlH / Math.max(1, n-1);
  timeline.forEach((it,i)=>{
    const y = tlY + step*i;
    const hi = !!it.highlight;
    ctx.beginPath(); ctx.arc(tlX, y, hi?14:9, 0, Math.PI*2); ctx.fillStyle= hi? family.color : '#ffffff'; ctx.fill(); ctx.strokeStyle= hi? family.color : 'rgba(22,32,27,.2)'; ctx.lineWidth= hi?3:2; ctx.stroke();
    if (hi){ ctx.beginPath(); ctx.arc(tlX,y,5,0,Math.PI*2); ctx.fillStyle=family.secondary; ctx.fill(); }
    // tarjeta
    const cardX = tlX + 28;
    const cardW = W - cardX - margin;
    const cardH = 148;
    const cardY = y - 46;
    ctx.fillStyle = hi ? '#ffffff' : 'rgba(255,255,255,.92)';
    roundedRect(ctx, cardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.strokeStyle='rgba(22,32,27,.08)'; ctx.stroke();
    ctx.fillStyle=family.color; roundedRect(ctx,cardX,cardY,6,cardH,3); ctx.fill();
    ctx.fillStyle=family.secondary; ctx.font=`800 13px Inter, sans-serif`; ctx.fillText(String(it.label||''), cardX+18, cardY+28);
    ctx.fillStyle='#16201b'; ctx.font=`900 20px Inter, sans-serif`; ctx.fillText(String(it.value||''), cardX+18, cardY+58);
    ctx.fillStyle='#526058'; ctx.font=`600 12px Inter, sans-serif`; const subLines=wrapText(ctx, String(it.sub||''), cardW-36); ctx.fillText(subLines[0]||'', cardX+18, cardY+82);
    if (subLines[1]) ctx.fillText(subLines[1], cardX+18, cardY+98);
  });
  const footerY=H-56; ctx.fillStyle='rgba(22,32,27,.14)'; ctx.fillRect(margin,footerY-12,W-margin*2,1); ctx.fillStyle='#6b7a6e'; ctx.font=`700 12px Inter, sans-serif`; ctx.fillText('www.mediamendoza.com', margin, footerY+10); ctx.textAlign='right'; ctx.fillStyle=family.color; ctx.font=`900 12px Inter, sans-serif`; ctx.fillText('mediamendoza  •  LÍNEA DE TIEMPO', W-margin, footerY+10); ctx.textAlign='left'; ctx.fillStyle=family.color; ctx.fillRect(0,H-4,W,4);
}

// Infografía placa
function renderInfografiaPlaca(canvas, infografia, family, titulo) {
  const ctx = canvas.getContext('2d');
  const W=1350,H=1688; canvas.width=W; canvas.height=H;
  const grad=ctx.createLinearGradient(0,0,W,H); grad.addColorStop(0,'#ffffff'); grad.addColorStop(1,family.soft); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  const margin=W*0.055;
  if (logoReady){ const lw=W*0.28, lh=H*0.06; const sc=Math.min(lw/logoImage.naturalWidth,lh/logoImage.naturalHeight); ctx.drawImage(logoImage, W-margin - logoImage.naturalWidth*sc,28, logoImage.naturalWidth*sc, logoImage.naturalHeight*sc);} else { ctx.fillStyle=family.secondary; ctx.font=`900 16px Inter, sans-serif`; ctx.textAlign='right'; ctx.fillText('mediamendoza.com',W-margin,48); ctx.textAlign='left';}
  const labelText='INFOGRAFÍA'; ctx.font=`900 20px Inter, sans-serif`; const padX=16; const lw=ctx.measureText(labelText).width+padX*2; const lh=36, ly=72; ctx.fillStyle=family.color; roundedRect(ctx,margin,ly,lw,lh,7); ctx.fill(); ctx.fillStyle='#fff'; ctx.textBaseline='middle'; ctx.font=`900 14px Inter, sans-serif`; ctx.fillText(labelText,margin+padX,ly+lh/2+1); ctx.textBaseline='alphabetic'; ctx.fillStyle=family.secondary; ctx.font=`700 11px Inter, sans-serif`; ctx.fillText(family.label.toUpperCase(),margin+lw+12,ly+lh/2+4);
  let tSize=46; let tLines=[]; const tW=W-margin*2; while(tSize>=28){ ctx.font=`900 ${tSize}px Inter, sans-serif`; tLines=wrapText(ctx, infografia.titulo || titulo, tW); if(tLines.length<=2) break; tSize-=1; } ctx.fillStyle=family.secondary; ctx.font=`900 ${tSize}px Inter, sans-serif`; let ty=150+tSize; tLines.slice(0,2).forEach(l=>{ctx.fillText(l,margin,ty); ty+=tSize*1.1;});
  const listY = ty + 36;
  const lineas = infografia.lineas || [];
  const cardH = Math.min(150, (H - listY - 100)/Math.max(1,lineas.length) - 14);
  lineas.forEach((linea,i)=>{
    const y = listY + i*(cardH+14);
    ctx.fillStyle='#ffffff'; roundedRect(ctx,margin,y,W-margin*2,cardH,14); ctx.fill(); ctx.strokeStyle='rgba(22,32,27,.08)'; ctx.stroke();
    ctx.fillStyle=family.color; ctx.beginPath(); ctx.arc(margin+28, y+cardH/2, 18,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font=`900 16px Inter, sans-serif`; ctx.textAlign='center'; ctx.fillText(String(i+1), margin+28, y+cardH/2+5); ctx.textAlign='left';
    ctx.fillStyle='#16201b'; let s=20; let lines=[]; while(s>=14){ ctx.font=`700 ${s}px Inter, sans-serif`; lines=wrapText(ctx, linea, W-margin*2 - 72); if(lines.length<=2) break; s-=1; } ctx.font=`700 ${s}px Inter, sans-serif`; let lyy=y+ cardH/2 - (lines.length* s*1.2)/2 + s*0.8; lines.slice(0,2).forEach(ll=>{ctx.fillText(ll, margin+56, lyy); lyy+=s*1.2;});
  });
  const footerY=H-56; ctx.fillStyle='rgba(22,32,27,.14)'; ctx.fillRect(margin,footerY-12,W-margin*2,1); ctx.fillStyle='#6b7a6e'; ctx.font=`700 12px Inter, sans-serif`; ctx.fillText('www.mediamendoza.com', margin, footerY+10); ctx.textAlign='right'; ctx.fillStyle=family.color; ctx.font=`900 12px Inter, sans-serif`; ctx.fillText('mediamendoza  •  INFOGRAFÍA', W-margin, footerY+10); ctx.textAlign='left'; ctx.fillStyle=family.color; ctx.fillRect(0,H-4,W,4);
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
  results.scrollIntoView({ behavior:'smooth', block:'start' });
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
