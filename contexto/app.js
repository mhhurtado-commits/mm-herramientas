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

// Chart placa — rediseñada para ocupar todo el espacio y tipografía Placas v2
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
  // Header: logo + etiqueta
  if (logoReady) {
    const logoW = W * 0.30;
    const logoH = H * 0.065;
    const iw = logoImage.naturalWidth, ih = logoImage.naturalHeight;
    const scale = Math.min(logoW/iw, logoH/ih);
    const dw = iw*scale, dh = ih*scale;
    ctx.drawImage(logoImage, W - margin - dw, 30, dw, dh);
  } else {
    ctx.fillStyle = family.secondary;
    ctx.font = `900 17px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('mediamendoza.com', W - margin, 52);
    ctx.textAlign = 'left';
  }
  const labelText = 'GRÁFICO';
  ctx.font = `900 20px Inter, sans-serif`;
  const labelPadX = 18;
  const labelW = ctx.measureText(labelText).width + labelPadX*2;
  const labelH = 38;
  const labelY = 74;
  ctx.fillStyle = family.color;
  roundedRect(ctx, margin, labelY, labelW, labelH, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = `900 15px Inter, sans-serif`;
  ctx.fillText(labelText, margin + labelPadX, labelY + labelH/2 + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = family.secondary;
  ctx.font = `800 12px Inter, sans-serif`;
  ctx.fillText(family.label.toUpperCase(), margin + labelW + 14, labelY + labelH/2 + 4);

  // Título principal — grande y legible
  const titleW = W - margin*2;
  let tSize = 54;
  let tLines = [];
  while (tSize >= 30) {
    ctx.font = `900 ${tSize}px Inter, sans-serif`;
    tLines = wrapText(ctx, titulo, titleW);
    if (tLines.length <= 2 && tLines.length * tSize * 1.08 <= 130) break;
    tSize -= 1;
  }
  ctx.fillStyle = family.secondary;
  ctx.font = `900 ${tSize}px Inter, sans-serif`;
  let ty = 158 + tSize;
  tLines.slice(0,2).forEach(l=>{ ctx.fillText(l, margin, ty); ty+= tSize*1.08; });
  // Subtítulo chart con acento
  if (chart.titulo) {
    ctx.fillStyle = family.color;
    ctx.fillRect(margin, ty + 10, 36, 4);
    ctx.fillStyle = '#526058';
    ctx.font = `700 18px Inter, sans-serif`;
    ctx.fillText(chart.titulo, margin, ty + 38);
    ty += 52;
  } else ty += 22;
  // Área gráfico — ocupa casi todo el alto restante
  const chartX = margin;
  const chartY = ty + 10;
  const chartW = W - margin*2;
  const chartH = H - chartY - 96; // deja solo footer
  // fondo chart con sombra sutil
  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, chartX, chartY, chartW, chartH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(22,32,27,.07)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // sombra interior
  ctx.fillStyle = 'rgba(22,32,27,.02)';
  roundedRect(ctx, chartX, chartY, chartW, 14, 18);
  ctx.fill();

  const datos = chart.datos || [];
  const maxVal = Math.max(...datos.map(d=>d.value), 1);
  const total = datos.reduce((a,b)=>a+b.value,0);
  const tipo = chart.tipo || 'bar';

  if (tipo === 'pie' || tipo === 'doughnut') {
    // Pie grande y centrado, con porcentajes grandes dentro
    const cx = chartX + chartW/2;
    const cy = chartY + chartH*0.46;
    const radius = Math.min(320, Math.min(chartW, chartH)*0.34);
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
      // borde blanco entre porciones
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();
      // porcentaje grande dentro de la porción
      const mid = (start+end)/2;
      const rMid = hole ? (radius+hole)/2 : radius*0.62;
      const lx = cx + Math.cos(mid)*rMid;
      const ly = cy + Math.sin(mid)*rMid;
      const pct = Math.round((d.value/total)*100);
      if (slice > 0.22) { // solo si porción no muy chica
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 32px Inter, sans-serif`;
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
      ctx.fillStyle=family.secondary; ctx.font=`900 22px Inter, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('TOTAL', cx, cy-10); ctx.font=`900 36px Inter, sans-serif`; ctx.fillText(String(total), cx, cy+18);
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    }
    // Leyenda grande como pills
    const legendY = chartY + chartH - 78;
    const pillH = 36;
    const gap = 14;
    let lx = chartX + 18;
    let ly = legendY;
    ctx.font = `700 15px Inter, sans-serif`;
    datos.forEach((d,i)=>{
      const label = `${d.label}: ${d.value.toLocaleString('es-AR')} (${Math.round(d.value/total*100)}%)`;
      const w = ctx.measureText(label).width + 36;
      if (lx + w > chartX + chartW - 18) { lx = chartX + 18; ly += pillH + 10; }
      ctx.fillStyle = i===0 ? family.color : i===1 ? family.secondary : '#eef2ea';
      if (i>=2) ctx.fillStyle = '#f2f4f0';
      roundedRect(ctx, lx, ly, w, pillH, pillH/2);
      ctx.fill();
      if (i>=2) { ctx.strokeStyle='rgba(22,32,27,.1)'; ctx.stroke(); }
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath(); ctx.arc(lx+14, ly+pillH/2, 7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = i>=2 ? '#16201b' : (i===0 ? '#16201b' : '#ffffff');
      if (i===0) ctx.fillStyle = '#16201b';
      else if (i===1) ctx.fillStyle = '#ffffff';
      else ctx.fillStyle = '#16201b';
      ctx.fillText(label, lx+26, ly+23);
      lx += w + gap;
    });
  } else {
    // Bar / line
    const padL = 80, padR = 28, padT = 28, padB = 72;
    const innerX = chartX + padL;
    const innerY = chartY + padT;
    const innerW = chartW - padL - padR;
    const innerH = chartH - padT - padB;
    // grid sutil
    ctx.strokeStyle = 'rgba(22,32,27,.07)';
    ctx.lineWidth = 1;
    for (let i=0;i<=4;i++){
      const y = innerY + (innerH/4)*i;
      ctx.beginPath(); ctx.moveTo(innerX, y); ctx.lineTo(innerX+innerW, y); ctx.stroke();
      ctx.fillStyle = '#6b7a6e';
      ctx.font = `700 13px Inter, sans-serif`;
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
      // barra degradada familia con sombra
      ctx.shadowColor = 'rgba(22,32,27,.12)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      const grd = ctx.createLinearGradient(x, y, x, y+h);
      grd.addColorStop(0, family.color);
      grd.addColorStop(1, family.secondary);
      ctx.fillStyle = grd;
      roundedRect(ctx, x, y, barW, h, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      // valor grande arriba
      ctx.fillStyle = family.secondary;
      ctx.font = `900 20px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(d.value.toLocaleString('es-AR'), x + barW/2, y - 14);
      // label abajo — más grande y legible
      ctx.fillStyle = '#16201b';
      ctx.font = `700 14px Inter, sans-serif`;
      const labLines = wrapText(ctx, d.label, barW + gap + 12);
      let lyy = innerY + innerH + 22;
      labLines.slice(0,2).forEach(ll=>{ ctx.fillText(ll, x+barW/2, lyy); lyy+=16; });
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

// Timeline placa — rediseñada, ocupa espacio, tipografía grande y glifos
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
    const logoW = W*0.32; const logoH=H*0.07;
    const scale = Math.min(logoW/logoImage.naturalWidth, logoH/logoImage.naturalHeight);
    ctx.drawImage(logoImage, W-margin - logoImage.naturalWidth*scale, 28, logoImage.naturalWidth*scale, logoImage.naturalHeight*scale);
  } else {
    ctx.fillStyle = family.secondary; ctx.font=`900 17px Inter, sans-serif`; ctx.textAlign='right'; ctx.fillText('mediamendoza.com', W-margin,52); ctx.textAlign='left';
  }
  const labelText='LÍNEA DE TIEMPO';
  ctx.font=`900 20px Inter, sans-serif`; const padX=18; const lw=ctx.measureText(labelText).width+padX*2; const lh=38, ly=74;
  ctx.fillStyle=family.color; roundedRect(ctx,margin,ly,lw,lh,8); ctx.fill();
  ctx.fillStyle='#fff'; ctx.textBaseline='middle'; ctx.font=`900 15px Inter, sans-serif`; ctx.fillText(labelText, margin+padX, ly+lh/2+1); ctx.textBaseline='alphabetic';
  ctx.fillStyle=family.secondary; ctx.font=`800 12px Inter, sans-serif`; ctx.fillText(family.label.toUpperCase(), margin+lw+14, ly+lh/2+4);
  let tSize=54; let tLines=[];
  const tW=W-margin*2;
  while(tSize>=30){ ctx.font=`900 ${tSize}px Inter, sans-serif`; tLines=wrapText(ctx,titulo,tW); if(tLines.length<=2 && tLines.length*tSize*1.08<=125) break; tSize-=1; }
  ctx.fillStyle=family.secondary; ctx.font=`900 ${tSize}px Inter, sans-serif`; let ty=158+tSize; tLines.slice(0,2).forEach(l=>{ctx.fillText(l,margin,ty); ty+=tSize*1.08;});
  // Subrayado acento
  ctx.fillStyle=family.color; ctx.fillRect(margin, ty+8, 44, 4);
  // Línea vertical — más gruesa y con sombra
  const tlX = margin + 44;
  const tlY = ty + 42;
  const tlH = H - tlY - 96;
  ctx.strokeStyle='rgba(22,32,27,.10)'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(tlX, tlY); ctx.lineTo(tlX, tlY+tlH); ctx.stroke();
  const n = timeline.length;
  const step = tlH / Math.max(1, n-1);
  // Glifos para timeline
  const glyphs = ['◈','⬢','⬣','★','◆'];
  timeline.forEach((it,i)=>{
    const y = tlY + step*i;
    const hi = !!it.highlight;
    // punto con anillo
    ctx.shadowColor='rgba(22,32,27,.14)'; ctx.shadowBlur=8; ctx.shadowOffsetY=3;
    ctx.beginPath(); ctx.arc(tlX, y, hi?18:13, 0, Math.PI*2); ctx.fillStyle= hi? family.color : '#ffffff'; ctx.fill();
    ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    ctx.strokeStyle= hi? family.color : family.secondary; ctx.lineWidth= hi?4:3; ctx.stroke();
    if (hi){ ctx.beginPath(); ctx.arc(tlX,y,6,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill(); }
    else {
      ctx.fillStyle=family.secondary; ctx.font=`900 10px Inter, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(glyphs[i % glyphs.length], tlX, y+1);
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    }
    // tarjeta — más grande, con sombra y tipografía Placas v2
    const cardX = tlX + 36;
    const cardW = W - cardX - margin;
    const cardH = 188;
    const cardY = y - 58;
    ctx.shadowColor='rgba(22,32,27,.08)'; ctx.shadowBlur=12; ctx.shadowOffsetY=6;
    ctx.fillStyle = hi ? '#ffffff' : '#ffffff';
    roundedRect(ctx, cardX, cardY, cardW, cardH, 14);
    ctx.fill();
    ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    ctx.strokeStyle= hi ? family.color : 'rgba(22,32,27,.08)'; ctx.lineWidth= hi?2:1; ctx.stroke();
    // accent lateral grueso
    ctx.fillStyle= hi ? family.color : family.secondary;
    roundedRect(ctx,cardX,cardY,8,cardH,4); ctx.fill();
    // año/label — grande
    ctx.fillStyle= hi ? family.color : '#6b7a6e';
    ctx.font=`800 13px Inter, sans-serif`;
    let label = String(it.label||'').toUpperCase();
    // glifo + label
    ctx.fillText(glyphs[i % glyphs.length] + '  ' + label, cardX+22, cardY+32);
    // valor — muy grande
    ctx.fillStyle= hi ? family.secondary : '#16201b';
    ctx.font=`900 26px Inter, sans-serif`;
    // envolver valor si es largo
    const valLines = wrapText(ctx, String(it.value||''), cardW-44);
    ctx.fillText(valLines[0]||'', cardX+22, cardY+66);
    if (valLines[1]) { ctx.font=`900 20px Inter, sans-serif`; ctx.fillText(valLines[1], cardX+22, cardY+90); }
    // sub — más grande y legible
    ctx.fillStyle='#526058'; ctx.font=`600 14px Inter, sans-serif`;
    const sub = String(it.sub||'').trim();
    if (sub) {
      const subLines=wrapText(ctx, sub, cardW-44);
      ctx.fillText(subLines[0]||'', cardX+22, cardY+108);
      if (subLines[1]) ctx.fillText(subLines[1], cardX+22, cardY+126);
    }
    // fecha pequeña en esquina si existe
    if (hi) {
      ctx.fillStyle='#ffffff'; ctx.font=`700 10px Inter, sans-serif`;
      const badge = 'AHORA';
      const bw = ctx.measureText(badge).width + 16;
      ctx.fillStyle=family.color; roundedRect(ctx, cardX+cardW - bw - 12, cardY+14, bw, 20, 10); ctx.fill();
      ctx.fillStyle='#fff'; ctx.fillText(badge, cardX+cardW - bw -4, cardY+28);
    }
  });
  const footerY=H-56; ctx.fillStyle='rgba(22,32,27,.12)'; ctx.fillRect(margin,footerY-12,W-margin*2,1); ctx.fillStyle='#6b7a6e'; ctx.font=`700 12px Inter, sans-serif`; ctx.fillText('www.mediamendoza.com', margin, footerY+10); ctx.textAlign='right'; ctx.fillStyle=family.color; ctx.font=`900 12px Inter, sans-serif`; ctx.fillText('mediamendoza  •  LÍNEA DE TIEMPO', W-margin, footerY+10); ctx.textAlign='left'; ctx.fillStyle=family.color; ctx.fillRect(0,H-4,W,4);
}

// Infografía — rediseñada como infografía real con glifos, no tarjetas repetidas
function renderInfografiaPlaca(canvas, infografia, family, titulo) {
  const ctx = canvas.getContext('2d');
  const W=1350,H=1688; canvas.width=W; canvas.height=H;
  const grad=ctx.createLinearGradient(0,0,W,H); grad.addColorStop(0,'#ffffff'); grad.addColorStop(1,family.soft); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  const margin=W*0.055;
  // Header
  if (logoReady){ const lw=W*0.32, lh=H*0.07; const sc=Math.min(lw/logoImage.naturalWidth,lh/logoImage.naturalHeight); ctx.drawImage(logoImage, W-margin - logoImage.naturalWidth*sc,28, logoImage.naturalWidth*sc, logoImage.naturalHeight*sc);} else { ctx.fillStyle=family.secondary; ctx.font=`900 17px Inter, sans-serif`; ctx.textAlign='right'; ctx.fillText('mediamendoza.com',W-margin,52); ctx.textAlign='left';}
  const labelText='INFOGRAFÍA'; ctx.font=`900 20px Inter, sans-serif`; const padX=18; const lw=ctx.measureText(labelText).width+padX*2; const lh=38, ly=74; ctx.fillStyle=family.color; roundedRect(ctx,margin,ly,lw,lh,8); ctx.fill(); ctx.fillStyle='#fff'; ctx.textBaseline='middle'; ctx.font=`900 15px Inter, sans-serif`; ctx.fillText(labelText,margin+padX,ly+lh/2+1); ctx.textBaseline='alphabetic'; ctx.fillStyle=family.secondary; ctx.font=`800 12px Inter, sans-serif`; ctx.fillText(family.label.toUpperCase(),margin+lw+14,ly+lh/2+4);
  // Título — grande
  let tSize=52; let tLines=[]; const tW=W-margin*2; const rawTitle = infografia.titulo || titulo;
  while(tSize>=30){ ctx.font=`900 ${tSize}px Inter, sans-serif`; tLines=wrapText(ctx, rawTitle, tW); if(tLines.length<=2 && tLines.length*tSize*1.08<=125) break; tSize-=1; }
  ctx.fillStyle=family.secondary; ctx.font=`900 ${tSize}px Inter, sans-serif`; let ty=158+tSize; tLines.slice(0,2).forEach(l=>{ctx.fillText(l,margin,ty); ty+=tSize*1.08;});
  ctx.fillStyle=family.color; ctx.fillRect(margin, ty+10, 48, 4);
  // Glifos por contenido — elige icono según palabras clave
  function pickGlyph(text, idx){
    const t = String(text).toLowerCase();
    if (t.includes('crédito') || t.includes('credito') || t.includes('15.000')) return '◈';
    if (t.includes('familia') || t.includes('mora') || t.includes('5.000')) return '⚑';
    if (t.includes('solucion') || t.includes('2.600') || t.includes('ejecución')) return '⬢';
    if (t.includes('2027') || t.includes('agosto') || t.includes('fecha')) return '⬣';
    if (t.includes('invers') || t.includes('millon')) return '◆';
    if (t.includes('avion') || t.includes('area')) return '✦';
    return ['◈','⬢','⬣','◆'][idx % 4];
  }
  const lineas = infografia.lineas || [];
  const n = lineas.length;
  // Layout: si son 4, usamos 2x2 grid para aprovechar espacio; si son 3, vertical grande
  if (n === 4) {
    const gap = 18;
    const cardW = (W - margin*2 - gap)/2;
    const cardH = 360;
    const startY = ty + 34;
    lineas.forEach((linea,i)=>{
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col*(cardW+gap);
      const y = startY + row*(cardH+gap);
      // tarjeta con fondo blanco y borde sutil + sombra
      ctx.shadowColor='rgba(22,32,27,.08)'; ctx.shadowBlur=12; ctx.shadowOffsetY=6;
      ctx.fillStyle='#ffffff'; roundedRect(ctx,x,y,cardW,cardH,18); ctx.fill();
      ctx.shadowBlur=0; ctx.shadowOffsetY=0;
      ctx.strokeStyle='rgba(22,32,27,.07)'; ctx.stroke();
      // accent top
      ctx.fillStyle=family.color; roundedRect(ctx,x,y,cardW,6,6); ctx.fill();
      // glifo grande
      const glyph = pickGlyph(linea,i);
      ctx.fillStyle=family.soft; ctx.beginPath(); ctx.arc(x+32, y+42, 28,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=family.color; ctx.font=`900 22px Inter, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(glyph, x+32, y+42);
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      // extraer número grande si existe
      const numMatch = String(linea).match(/(\d[\d\.\,]*)/);
      const num = numMatch ? numMatch[1] : String(i+1);
      const rest = String(linea).replace(numMatch? numMatch[0] : '', '').replace(/^\s*[\-\—\:]?\s*/,'').trim() || linea;
      // número gigante
      ctx.fillStyle=family.secondary; ctx.font=`900 36px Inter, sans-serif`;
      // si es número, mostrarlo grande
      if (numMatch) {
        ctx.fillText(num, x+72, y+62);
        // unidad pequeña
        const afterNum = String(linea).slice(String(linea).indexOf(num)+num.length).trim().split(' ')[0] || '';
        if (afterNum && afterNum.length < 10) {
          ctx.fillStyle='#6b7a6e'; ctx.font=`700 13px Inter, sans-serif`; ctx.fillText(afterNum, x+72+ctx.measureText(num).width+8, y+62);
          ctx.fillStyle=family.secondary;
        }
        // descripción
        ctx.fillStyle='#16201b'; ctx.font=`700 16px Inter, sans-serif`;
        const descLines = wrapText(ctx, rest, cardW-36);
        let lyy = y+92;
        descLines.slice(0,3).forEach(ll=>{ ctx.fillText(ll, x+18, lyy); lyy+=20; });
      } else {
        ctx.fillStyle='#16201b'; ctx.font=`700 18px Inter, sans-serif`;
        const descLines = wrapText(ctx, linea, cardW-36);
        let lyy = y+92;
        descLines.slice(0,4).forEach(ll=>{ ctx.fillText(ll, x+18, lyy); lyy+=22; });
      }
      // número pequeño esquina
      ctx.fillStyle='rgba(22,32,27,.08)'; ctx.font=`900 42px Inter, sans-serif`; ctx.textAlign='right';
      ctx.fillText(String(i+1), x+cardW-18, y+cardH-18);
      ctx.textAlign='left';
    });
  } else {
    // 2-3 líneas: vertical grande con iconos
    const listY = ty + 34;
    const cardH = Math.floor((H - listY - 96) / Math.max(1,n)) - 14;
    lineas.forEach((linea,i)=>{
      const y = listY + i*(cardH+14);
      ctx.shadowColor='rgba(22,32,27,.07)'; ctx.shadowBlur=10; ctx.shadowOffsetY=4;
      ctx.fillStyle='#ffffff'; roundedRect(ctx,margin,y,W-margin*2,cardH,16); ctx.fill();
      ctx.shadowBlur=0; ctx.shadowOffsetY=0;
      ctx.strokeStyle='rgba(22,32,27,.07)'; ctx.stroke();
      // barra lateral
      ctx.fillStyle=family.color; roundedRect(ctx,margin,y,8,cardH,4); ctx.fill();
      // glifo círculo grande
      const glyph = pickGlyph(linea,i);
      const cx = margin + 52; const cy = y + cardH/2;
      ctx.fillStyle=family.soft; ctx.beginPath(); ctx.arc(cx, cy, 36,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=family.color; ctx.beginPath(); ctx.arc(cx, cy, 34,0,Math.PI*2); ctx.strokeStyle=family.color; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle=family.color; ctx.font=`900 24px Inter, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(glyph, cx, cy);
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      // extraer número
      const numMatch = String(linea).match(/(\d[\d\.\,]*\s*[a-zA-Z]*)/);
      const fullNum = numMatch ? numMatch[1].trim() : '';
      const rest = fullNum ? String(linea).replace(fullNum,'').trim().replace(/^[\-\—\:]?\s*/,'') : linea;
      // número y texto
      if (fullNum) {
        ctx.fillStyle=family.secondary; ctx.font=`900 28px Inter, sans-serif`;
        ctx.fillText(fullNum, margin+98, y+52);
        ctx.fillStyle='#16201b'; ctx.font=`600 15px Inter, sans-serif`;
        const descLines = wrapText(ctx, rest, W-margin*2 - 130);
        let lyy = y+78;
        descLines.slice(0,2).forEach(ll=>{ ctx.fillText(ll, margin+98, lyy); lyy+=18; });
      } else {
        ctx.fillStyle='#16201b'; ctx.font=`700 20px Inter, sans-serif`;
        const lines = wrapText(ctx, linea, W-margin*2 - 110);
        let lyy = y+ cardH/2 - (lines.length*20)/2 + 7;
        lines.slice(0,2).forEach(ll=>{ ctx.fillText(ll, margin+98, lyy); lyy+=22; });
      }
      // índice sutil
      ctx.fillStyle='rgba(22,32,27,.06)'; ctx.font=`900 56px Inter, sans-serif`; ctx.textAlign='right';
      ctx.fillText(String(i+1), W-margin-18, y+cardH-18);
      ctx.textAlign='left';
    });
  }
  const footerY=H-56; ctx.fillStyle='rgba(22,32,27,.12)'; ctx.fillRect(margin,footerY-12,W-margin*2,1); ctx.fillStyle='#6b7a6e'; ctx.font=`700 12px Inter, sans-serif`; ctx.fillText('www.mediamendoza.com', margin, footerY+10); ctx.textAlign='right'; ctx.fillStyle=family.color; ctx.font=`900 12px Inter, sans-serif`; ctx.fillText('mediamendoza  •  INFOGRAFÍA', W-margin, footerY+10); ctx.textAlign='left'; ctx.fillStyle=family.color; ctx.fillRect(0,H-4,W,4);
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
