// v3.1
const WORKER='https://mm-herramientas-worker.mhhurtado.workers.dev';
const LOGO_B64='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';

const FMTS={
  sq:      {w:1080,h:1080,lbl:'Instagram Cuadrado — 1080×1080'},
  story:   {w:1080,h:1920,lbl:'Historia — 1080×1920'},
  portrait:{w:1080,h:1350,lbl:'Portrait — 1080×1350'},
  fb:      {w:1200,h:628, lbl:'Facebook — 1200×628'},
  tw:      {w:1600,h:900, lbl:'Twitter/X — 1600×900'},
};

let ELS={
  title:{x:null,y:null,w:null,h:null,visible:true},
  cat:  {x:null,y:null,w:null,h:null,visible:true},
  logo: {x:null,y:null,w:null,h:null,visible:true},
  foto: {x:null,y:null,w:null,h:null,visible:true},
  mlogo:{x:null,y:null,w:null,h:null,visible:true},
  header:{x:null,y:null,w:null,h:null,visible:true},
  matches:{x:null,y:null,w:null,h:null,visible:true},
};

let S={
  fmt:'sq', tpl:'normal',
  bgImg:null, iDark:0, iBlur:0, imgX:0, imgY:0,
  ovActive:false, ovCol:'#000000', ovOp:.5,
  title:'', tCol:'#ffffff', tBg:'#000000', tBgOp:.8,
  cat:'',   cCol:'#ffffff', cBg:'#000000', cBgOp:0,
  logoImg:null, lOp:1,
  active:null,
  action:null,
  dragOff:{x:0,y:0},
  resizeStart:null,
  tShadow:false,  // sombra título
  cShadow:false,  // sombra categoría
  mode:'normal',  // 'normal' | 'textual' | 'foto' | 'collage'
  // ── modo textual ──
  quote:'',       // texto de la cita
  quoteAuthor:'', // autor / fuente
  quoteStyle:'verde', // 'verde'|'negro'|'blanco'
  quoteTextCol:'', // '' = automático según estilo, o color custom
  // ── modo foto ──
  fotoImg:null,   // imagen del círculo
  fotoShape:'circle', // 'circle'|'square'|'diamond'
  fotoX:0.72, fotoY:0.18, // posición centro (fracción)
  fotoSize:0.28,  // fracción del ancho
  fotoBorder:'#a6ce39',
  // ── modo textual divisor ──
  quoteSplit:0.5,  // fracción del área de color (0.3–0.7)
  quotePos:'left', // 'left'|'right'|'top'|'bottom'
  // ── modo collage ──
  collageImgs:[null,null,null,null], // hasta 4 imágenes
  collageLayout:'2h',  // layouts: 2h, 2v, 3t, 3b, 3l, 3r, 4
  // ── modo futbol/mundial ──
  mundialTipo:null,    // 'partidos-dia' | 'partido-individual'
  mundialData:null,    // { fecha, partidos[], fuentes[] }
  mundialLogoImg:null, // logo-mundial.png cargado
  wc26BgImg:null,      // mundial-2026.jpg fondo WC26
  grupoPosiciones:'all', // grupo seleccionado para placa posiciones ('all' = todos, 'A','B',...)
  posicionesPage:0,      // página actual en modo multi-grupo (2 grupos por página)
  bracketEtapa:'all',    // etapa seleccionada para placa eliminatorias ('all' = todas)
  // ── toggles de campos a mostrar (Mundial) ──
  showFields: {
    estadio: true,
    ciudad: true,
    arbitro: true,
    goleadores: true,   // Sanity check descarta datos ficticios automáticamente
    eventos: true,       // Sanity check descarta datos ficticios automáticamente
    formaciones: true,
    tarjetas: true,
    hora: true,
    grupo: true,
    estado: true,        // "FINAL", "EN VIVO", etc.
    htScore: true,       // resultado entretiempo
    asistencia: true,
    // Knowledge Graph
    equipoBio: false,    // descripción de equipos
    estadioBio: false,   // descripción de estadio
    ciudadBio: false,    // descripción de ciudad
  },
};

// ── HISTORIAL DESHACER ──
const HISTORY=[];
const HISTORY_MAX=30;
function snapShot(){
  // Guardar copia profunda de S y ELS (sin bgImg ni logoImg para no duplicar memoria)
  const snap={
    S: JSON.parse(JSON.stringify({...S, bgImg:null, logoImg:null,
        active:null, action:null, resizeStart:null})),
    ELS: JSON.parse(JSON.stringify(ELS)),
    bgImg: S.bgImg,
    logoImg: S.logoImg,
  };
  HISTORY.push(snap);
  if(HISTORY.length>HISTORY_MAX) HISTORY.shift();
}
function undo(){
  if(HISTORY.length<2){showToast('Nada para deshacer');return;}
  HISTORY.pop(); // descartar estado actual
  const snap=HISTORY[HISTORY.length-1];
  Object.assign(S, snap.S, {bgImg:snap.bgImg, logoImg:snap.logoImg, active:null, action:null});
  ELS=JSON.parse(JSON.stringify(snap.ELS));
  syncUIFromS();
  render();drawPreviews();
}
function syncUIFromS(){
  // Sincronizar inputs del sidebar con el estado S
  const safe=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
  const safeText=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  safe('titIn',S.title); safe('catIn',S.cat);
  safe('fmtSel',S.fmt);
  Object.keys(RMAP).forEach(k=>{
    safe('r-'+k, Math.round(S[RMAP[k].k]*(k==='iBlur'?1:100)));
    safeText('rv-'+k, RMAP[k].s(Math.round(S[RMAP[k].k]*(k==='iBlur'?1:100))));
  });
  const ovTog=document.getElementById('ovTog');
  if(ovTog) ovTog.checked=S.ovActive;
  ['tShadow','cShadow'].forEach(k=>{
    const el=document.getElementById(k);if(el)el.checked=S[k];
  });
  // sync formato pills
  document.querySelectorAll('[id^="fp-"]').forEach(el=>el.classList.remove('on'));
  const fp=document.getElementById('fp-'+S.fmt);if(fp)fp.classList.add('on');
  const fl=document.getElementById('fmtLbl');if(fl)fl.textContent=FMTS[S.fmt].lbl;
  // sync modo
  if(S.mode)setMode(S.mode);
}

const canvas=document.getElementById('mc');
const ctx=canvas.getContext('2d');
let scale=1;
const HR=16;

// ── ACCORDION ──
function toggleAcc(head){
  const body=head.nextElementSibling;
  const isOpen=head.classList.contains('open');
  // cierra todos
  document.querySelectorAll('.acc-head.open').forEach(h=>{
    h.classList.remove('open');
    h.nextElementSibling.classList.remove('open');
  });
  if(!isOpen){
    head.classList.add('open');
    body.classList.add('open');
  }
}

// ── CANVAS SIZE ──
function resizeCanvas(keepEls){
  const fmt=FMTS[S.fmt];
  const area=document.getElementById('canvasArea');
  const isMobile=window.innerWidth<=700;
  let avW,avH;
  if(isMobile){
    // Valores fijos del CSS — más confiable en iOS/Android que medir el DOM
    const TB=52, EB=58, TABS=48;
    const panH=(typeof _panelOpen!=='undefined'&&_panelOpen)?Math.round(window.innerHeight*.32):0;
    avW=window.innerWidth-16;
    avH=window.innerHeight-TB-EB-TABS-panH-16;
    if(avH<50)avH=window.innerHeight*.5; // fallback de seguridad
  } else {
    avW=area.clientWidth-32;
    avH=area.clientHeight-32;
  }
  const ratio=fmt.w/fmt.h;
  let dw,dh;
  if(ratio>=1){dw=Math.min(avW,fmt.w);dh=dw/ratio;if(dh>avH){dh=avH;dw=dh*ratio;}}
  else{dh=Math.min(avH,fmt.h);dw=dh*ratio;if(dw>avW){dw=avW;dh=dw/ratio;}}
  dw=Math.floor(dw);dh=Math.floor(dh);
  canvas.style.width=dw+'px';canvas.style.height=dh+'px';
  canvas.width=fmt.w;canvas.height=fmt.h;
  scale=fmt.w/dw;
  // Solo resetear posiciones si se pide explícitamente (cambio de formato/plantilla)
  if(!keepEls) resetEls();
}

function resetEls(){
  ELS={
    title:{x:null,y:null,w:null,h:null,visible:true},
    cat:  {x:null,y:null,w:null,h:null,visible:true},
    logo: {x:null,y:null,w:null,h:null,visible:true},
    foto: {x:null,y:null,w:null,h:null,visible:true},
    mlogo:{x:null,y:null,w:null,h:null,visible:true},
    header:{x:null,y:null,w:null,h:null,visible:true},
    matches:{x:null,y:null,w:null,h:null,visible:true},
  };
}

// ── DEFAULT POSITIONS ──
function defaultPos(key){
  const fmt=FMTS[S.fmt];
  const W=fmt.w,H=fmt.h,pad=Math.round(W*.045);
  if(key==='title'){
    const w=Math.round(W*.82),h=Math.round(H*.19);
    const x=Math.round((W-w)/2);
    if(S.tpl==='normal')return{x,y:Math.round((H-h)/2),w,h};
    if(S.tpl==='titular')return{x,y:Math.round((H-h)/2),w,h};
    if(S.tpl==='minimalista')return{x,y:Math.round(H*.73),w,h:Math.round(H*.16)};
    if(S.tpl==='franja')return{x:Math.round(W*.06),y:Math.round(H*.52),w:Math.round(W*.88),h};
    return{x,y:Math.round(H*.52),w,h};
  }
  if(key==='cat'){
    const w=Math.round(W*.36),h=Math.round(H*.072);
    if(S.tpl==='normal')return{x:Math.round((W-w)/2),y:pad,w,h};
    if(S.tpl==='banda'||S.tpl==='verde'){
      return{x:pad,y:H-Math.round(H*.32)+Math.round(H*.01),w,h};
    }
    return{x:pad,y:Math.round(H*.46),w,h};
  }
  if(key==='logo'){
    if(!S.logoImg)return{x:pad,y:pad,w:Math.round(W*.312),h:Math.round(W*.108)};
    const lw=S.mode==='futbol'?Math.round(W*.18):Math.round(W*.312);
    const lh=Math.round(lw*(S.logoImg.height/S.logoImg.width));
    if(S.tpl==='normal'||S.tpl.startsWith('futbol-'))return{x:Math.round((W-lw)/2),y:H-lh-pad,w:lw,h:lh};
    return{x:W-lw-pad,y:pad,w:lw,h:lh};
  }
  if(key==='foto'){
    const fs=Math.round(W*S.fotoSize);
    return{x:Math.round(W*S.fotoX-fs/2),y:Math.round(H*S.fotoY-fs/2),w:fs,h:fs};
  }
  if(key==='mlogo'){
    const w=Math.round(W*0.35);
    const h=S.mundialLogoImg&&S.mundialLogoImg!=='error'?Math.round(w*(S.mundialLogoImg.height/S.mundialLogoImg.width)):Math.round(w*0.35);
    return{x:Math.round((W-w)/2),y:Math.round(H*0.035),w,h};
  }
  if(key==='header'){
    const w=Math.round(W*0.88), h=Math.round(H*0.09);
    return{x:Math.round((W-w)/2),y:Math.round(H*0.16),w,h};
  }
  if(key==='matches'){
    // Dynamic height based on number of matches
    const tipo = S.mundialTipo || 'partidos-dia';
    let count;
    if (S.mundialData && S.mundialData.partidos) {
      if (tipo === 'resultados-dia') {
        // Solo contar partidos finalizados
        count = S.mundialData.partidos.filter(p => p.golesLocal !== null && p.golesLocal !== undefined).length || 1;
      } else {
        count = S.mundialData.partidos.length;
      }
    } else {
      count = 2;
    }
    let h;
    if (tipo === 'bracket' || tipo === 'posiciones' || tipo === 'goleadores') {
      h = Math.round(H * 0.68);
    } else if (tipo === 'partido-individual') {
      h = Math.round(H * 0.38);
    } else if (tipo === 'resultados-dia') {
      h = Math.round(Math.min(H * 0.55, H * 0.09 * count + H * 0.08));
    } else {
      // partidos-dia: ~7% per match + 8% padding, min 18% max 50%
      h = Math.round(Math.min(H * 0.50, Math.max(H * 0.18, H * 0.07 * count + H * 0.08)));
    }
    return{x:Math.round((W - Math.round(W*0.88))/2),y:Math.round(H*0.28),w:Math.round(W*0.88),h};
  }
}
function ensurePos(key){
  const el=ELS[key];
  if(el.x===null){const d=defaultPos(key);el.x=d.x;el.y=d.y;el.w=d.w;el.h=d.h;}
}
function resetElPos(key){
  const d=defaultPos(key);
  ELS[key].x=d.x;ELS[key].y=d.y;ELS[key].w=d.w;ELS[key].h=d.h;
  snapShot();render();
}
function alignEl(key,dir){
  const el=ELS[key];if(!el||el.x===null)return;
  const {w:W,h:H}=FMTS[S.fmt];
  if(dir==='ch') el.x=Math.round((W-el.w)/2);  // centrar horizontal
  if(dir==='cv') el.y=Math.round((H-el.h)/2);  // centrar vertical
  if(dir==='l')  el.x=Math.round(W*.045);       // alinear izquierda
  if(dir==='r')  el.x=Math.round(W*.955-el.w); // alinear derecha
  if(dir==='t')  el.y=Math.round(H*.045);       // alinear arriba
  if(dir==='b')  el.y=Math.round(H*.955-el.h); // alinear abajo
  snapShot();render();
}
function alignActive(dir){
  if(S.active) alignEl(S.active,dir);
  else showToast('Seleccioná un elemento primero');
}

// ── TEMPLATES ──
const TPLS={
  normal(W,H){},
  moderna(W,H){const g=ctx.createLinearGradient(0,H*.38,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.82)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);},
  banda(W,H){const bh=Math.round(H*.32);ctx.fillStyle='rgba(0,0,0,.88)';ctx.fillRect(0,H-bh,W,bh);ctx.fillStyle='#a6ce39';ctx.fillRect(0,H-bh,W,Math.round(H*.018));},
  impacto(W,H){ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#a6ce39';ctx.fillRect(0,0,Math.round(W*.025),H);},
  diagonal(W,H){const g=ctx.createLinearGradient(0,H,W*.7,0);g.addColorStop(0,'rgba(0,0,0,.88)');g.addColorStop(.6,'rgba(0,0,0,.3)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);},
  verde(W,H){const bh=Math.round(H*.32);ctx.fillStyle='#a6ce39';ctx.fillRect(0,H-bh,W,bh);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(0,H-bh,W,2);},
  // Policiales: banda negra inferior + acento rojo (única excepción al corporativo)
  policiales(W,H){const bh=Math.round(H*.34);ctx.fillStyle='rgba(0,0,0,.92)';ctx.fillRect(0,H-bh,W,bh);ctx.fillStyle='#d32f2f';ctx.fillRect(0,H-bh,W,Math.round(H*.022));},
  // Clima: sin filtro, solo banda negra inferior suave para el texto — imagen al 100%
  clima(W,H){const g=ctx.createLinearGradient(0,H*.55,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.78)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#a6ce39';ctx.fillRect(0,H-Math.round(H*.018),W,Math.round(H*.018));},
  // Urgente: banda verde arriba + degradado negro abajo
  urgente(W,H){ctx.fillStyle='#a6ce39';ctx.fillRect(0,0,W,Math.round(H*.055));const g=ctx.createLinearGradient(0,H*.4,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.88)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);},
  // Economía: igual que banda pero con acento verde corporativo más grueso
  economia(W,H){const bh=Math.round(H*.34);ctx.fillStyle='rgba(0,0,0,.90)';ctx.fillRect(0,H-bh,W,bh);ctx.fillStyle='#a6ce39';ctx.fillRect(0,H-bh,W,Math.round(H*.03));},
  // Policiales Rojo — igual a policiales pero acento rojo más grueso
  policialesrojo(W,H){const bh=Math.round(H*.34);ctx.fillStyle='rgba(0,0,0,.92)';ctx.fillRect(0,H-bh,W,bh);ctx.fillStyle='#c62828';ctx.fillRect(0,H-bh,W,Math.round(H*.03));},
  // Franja Rojo — igual a franja pero acento rojo
  franjarojo(W,H){
    const g=ctx.createLinearGradient(0,H*.42,0,H);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.86)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#c62828';ctx.fillRect(0,0,Math.round(W*.038),H);
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(Math.round(W*.038),0,Math.round(W*.004),H);
  },
  // Urgente Rojo — banda roja superior más prominente
  urgenterojo(W,H){
    ctx.fillStyle='#c62828';ctx.fillRect(0,0,W,Math.round(H*.072));
    ctx.fillStyle='rgba(200,0,0,.15)';ctx.fillRect(0,0,W,H);
    const g=ctx.createLinearGradient(0,H*.4,0,H);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.88)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  },
  // Franja — borde izquierdo verde grueso, degradado negro inferior, estilo Reuters/BBC
  franja(W,H){
    const g=ctx.createLinearGradient(0,H*.42,0,H);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.86)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#a6ce39';ctx.fillRect(0,0,Math.round(W*.038),H);
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(Math.round(W*.038),0,Math.round(W*.004),H);
  },
  // Titular — fondo negro sólido sin imagen, texto protagonista, estilo BBC Breaking
  titular(W,H){
    ctx.fillStyle='#111111';ctx.fillRect(0,0,W,H);
    // Franja verde superior fina
    ctx.fillStyle='#a6ce39';ctx.fillRect(0,0,W,Math.round(H*.012));
    // Franja verde inferior fina
    ctx.fillStyle='#a6ce39';ctx.fillRect(0,H-Math.round(H*.012),W,Math.round(H*.012));
  },
  // Minimalista — imagen desaturada suave + bloque blanco nítido en tercio inferior, estilo Guardian
  minimalista(W,H){
    // Desaturar imagen con overlay blanco semitransparente
    ctx.fillStyle='rgba(245,249,232,.18)';ctx.fillRect(0,0,W,H);
    const bh=Math.round(H*.3);
    ctx.fillStyle='rgba(255,255,255,.93)';ctx.fillRect(0,H-bh,W,bh);
    ctx.fillStyle='#a6ce39';ctx.fillRect(0,H-bh,W,Math.round(H*.008));
  },
  // ══ WC 2026 — Fondo oficial FIFA + overlay oscuro ══
  'futbol-wc26'(W,H){
    // 1. Imagen de fondo mundial-2026.jpg o fallback geométrico
    if (S.wc26BgImg && S.wc26BgImg !== 'error') {
      const img = S.wc26BgImg;
      const ir = img.width / img.height, cr = W / H;
      let sx, sy, sw, sh;
      if (ir > cr) { sh = img.height; sw = sh * cr; sx = (img.width - sw) / 2; sy = 0; }
      else { sw = img.width; sh = sw / cr; sx = 0; sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#0a0816';
      ctx.fillRect(0, 0, W, H);
      [{cx:W*0.15,cy:H*0.50,rx:W*0.38,ry:H*0.52,c:'#6B2FA0'},
       {cx:W*0.82,cy:H*0.08,rx:W*0.22,ry:H*0.18,c:'#E61D25'},
       {cx:W*0.42,cy:H*0.48,rx:W*0.22,ry:H*0.28,c:'#8DC63F'},
       {cx:W*0.78,cy:H*0.55,rx:W*0.32,ry:H*0.44,c:'#00853F'}].forEach(s => {
        ctx.fillStyle = s.c; ctx.beginPath();
        ctx.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // 2. Overlay oscuro para legibilidad
    ctx.save();
    ctx.fillStyle = 'rgba(10, 8, 22, 0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // 3. Línea de acento multicolor WC26 superior (4 colores oficiales)
    const barH = Math.max(3, Math.round(H * 0.006));
    const segW = Math.round(W / 4);
    ['#E8564A','#00BFA6','#8E44AD','#8DC63F'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * segW, 0, segW + 1, barH);
    });
  },
};

// ── RENDER ──
// ══════════════════════════════════════════════
// MODOS ESPECIALES
// ══════════════════════════════════════════════

function setMode(m){
  S.mode=m;
  // Botones de modo
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('on'));
  const mb=document.getElementById('mode-'+m);if(mb)mb.classList.add('on');
  // Normal: mostrar acordeones, ocultar paneles especiales
  if(m==='normal'){
    document.querySelectorAll('.normal-only').forEach(el=>el.style.display='');
    document.querySelectorAll('.special-only').forEach(el=>el.style.display='none');
    const wp=document.getElementById('mundial-section');
    if(wp)wp.style.display='none';
    // Limpiar estado de Mundial al volver a Normal
    S.mundialTipo=null;
    S.mundialData=null;
    S.title='';
    S.cat='';
    S.tpl='normal';
    S.tBgOp=.8;
    S.cBgOp=0;
  } else if(m==='futbol'){
    // Futbol: mostrar sección mundial, ocultar el resto
    document.querySelectorAll('.normal-only').forEach(el=>el.style.display='none');
    document.querySelectorAll('[id^="special-panel-"]').forEach(el=>el.style.display='none');
    const wp=document.getElementById('mundial-section');
    if(wp)wp.style.display='block';
  } else {
    // Modo especial: ocultar acordeones, mostrar solo el panel correcto
    document.querySelectorAll('.normal-only').forEach(el=>el.style.display='none');
    const wp=document.getElementById('mundial-section');
    if(wp)wp.style.display='none';
    document.querySelectorAll('[id^="special-panel-"]').forEach(el=>{
      el.style.display=el.id==='special-panel-'+m?'block':'none';
    });
  }
  // Actualizar panel mobile si está abierto
  if(window._panelOpen) renderMobPanel();
  requestAnimationFrame(()=>render());
}
function setQS(el){
  document.querySelectorAll('[id^="qs-"]').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');snapShot();render();
}
function setQP(el){
  document.querySelectorAll('[id^="qp-"]').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');snapShot();
}
function setFS(el){
  document.querySelectorAll('[id^="fs-"]').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');snapShot();render();
}

function setCollageLayout(layout) {
  S.collageLayout = layout;
  // Actualizar UI
  document.querySelectorAll('[id^="fs-"]').forEach(b=>b.classList.remove('on'));
  const el = document.getElementById('fs-' + layout);
  if(el) el.classList.add('on');
  
  // Mostrar u ocultar slots según el layout
  const needs3 = layout === '3t' || layout === '3b' || layout === '3l' || layout === '3r' || layout === '4';
  const needs4 = layout === '4';
  const s2 = document.getElementById('coll-slot-2');
  const s3 = document.getElementById('coll-slot-3');
  const s4 = document.getElementById('coll-slot-4');
  if(s2) s2.style.display = needs3 ? '' : 'none';
  if(s3) s3.style.display = needs3 ? '' : 'none';
  if(s4) s4.style.display = needs4 ? '' : 'none';
  snapShot();render();
}

// ── RENDER TEXTUAL ──
function renderTextual(W,H){
  const sp=S.quoteSplit,pos=S.quotePos,style=S.quoteStyle;
  // Validar parámetros
  if(sp<0.3)sp=0.3;if(sp>0.7)sp=0.7;
  if(!['left','right','top','bottom'].includes(pos))pos='left';
  if(!['verde','negro','blanco'].includes(style))style='verde';

  // Calcular rectángulos base
  const ir={x:0,y:0,w:W,h:H}; // imagen (resto)
  const cr={};                 // panel color (cita)
  if(pos==='left'){
    cr.w=Math.round(W*sp);cr.h=H;cr.x=0;cr.y=0;
    ir.x=cr.w;ir.w=W-cr.w;ir.h=H;ir.y=0;
  } else if(pos==='right'){
    cr.w=Math.round(W*sp);cr.h=H;cr.x=W-cr.w;cr.y=0;
    ir.x=0;ir.w=cr.x;ir.h=H;ir.y=0;
  } else if(pos==='top'){
    cr.w=W;cr.h=Math.round(H*sp);cr.x=0;cr.y=0;
    ir.x=0;ir.w=W;ir.h=H-cr.h;ir.y=cr.h;
  } else if(pos==='bottom'){
    cr.w=W;cr.h=Math.round(H*sp);cr.x=0;cr.y=H-cr.h;
    ir.x=0;ir.w=W;ir.h=cr.y;ir.y=0;
  }

  // ── Dibujar imagen de fondo en ir ──
  if(S.bgImg){
    ctx.save();
    if(S.iBlur>0)ctx.filter=`blur(${S.iBlur}px)`;
    const img=S.bgImg,ir_ratio=img.width/img.height,cr_ratio=ir.w/ir.h;
    let sx,sy,sw,sh;
    if(ir_ratio>cr_ratio){
      sh=img.height;
      sw=sh*cr_ratio;
      sx=(img.width-sw)/2;
      sy=0;
    } else {
      sw=img.width;
      sh=sw/cr_ratio;
      sx=0;
      sy=(img.height-sh)/2;
    }
    const p=S.iBlur*4;
    ctx.drawImage(img,sx,sy,sw,sh,ir.x-p,ir.y-p,ir.w+p*2,ir.h+p*2);
    ctx.filter='none';
    ctx.restore();
    if(S.iDark>0){
      ctx.save();
      ctx.globalAlpha=S.iDark;
      ctx.fillStyle='#000';
      ctx.fillRect(ir.x,ir.y,ir.w,ir.h);
      ctx.restore();
    }
    ctx.restore();
  } else {
    ctx.fillStyle='#2a2a2a';ctx.fillRect(ir.x,ir.y,ir.w,ir.h);
    ctx.fillStyle='rgba(255,255,255,.3)';
    ctx.font=`${Math.round(Math.min(ir.w,ir.h)*.07)}px Montserrat,sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('Foto de fondo',ir.x+ir.w/2,ir.y+ir.h/2);ctx.textAlign='left';
  }

  // ── Dibujar panel de color en cr ──
  const colMap={verde:'#a6ce39',negro:'#111111',blanco:'#f5f9e8'};
  ctx.fillStyle=colMap[style]||'#a6ce39';
  ctx.fillRect(cr.x,cr.y,cr.w,cr.h);
  // Detalle estructural en el borde entre panels
  ctx.fillStyle='rgba(0,0,0,.18)';
  if(pos==='left')  ctx.fillRect(cr.x+cr.w-3,cr.y,3,cr.h);
  if(pos==='right') ctx.fillRect(cr.x,cr.y,3,cr.h);
  if(pos==='top')   ctx.fillRect(cr.x,cr.y+cr.h-3,cr.w,3);
  if(pos==='bottom')ctx.fillRect(cr.x,cr.y,cr.w,3);
  // Acento verde en borde exterior del panel color
  const isVerde=style==='verde',isBlanco=style==='blanco';
  const accentC=isVerde?'rgba(0,0,0,.2)':'#a6ce39';
  ctx.fillStyle=isVerde?'rgba(0,0,0,.12)':'#a6ce39';
  if(pos==='left')  ctx.fillRect(cr.x,cr.y,4,cr.h);
  if(pos==='right') ctx.fillRect(cr.x+cr.w-4,cr.y,4,cr.h);
  if(pos==='top')   ctx.fillRect(cr.x,cr.y,cr.w,4);
  if(pos==='bottom')ctx.fillRect(cr.x,cr.y+cr.h-4,cr.w,4);

  // ── Logo en panel color — usa ELS.logo para ser draggable ──
  const autoTextCol=isVerde||isBlanco?'#111111':'#ffffff';
  const textCol=S.quoteTextCol||autoTextCol;
  if(S.logoImg){
    // Forzar posición del logo dentro del panel color si no fue movido manualmente
    ensurePos('logo');
    const el=ELS.logo;
    if(el._textualInit!==S.quotePos+S.quoteSplit){
      const lw=Math.round(cr.w*.55);
      const lh=Math.round(lw*(S.logoImg.height/S.logoImg.width));
      el.x=cr.x+Math.round(cr.w*.06);el.y=cr.y+Math.round(cr.h*.05);
      el.w=lw;el.h=lh;
      el._textualInit=S.quotePos+S.quoteSplit;
    }
    ctx.save();
    if(style==='verde')ctx.filter='brightness(0) invert(1)';
    else if(style==='blanco')ctx.filter='brightness(0)';
    ctx.globalAlpha=S.lOp;
    ctx.drawImage(S.logoImg,ELS.logo.x,ELS.logo.y,ELS.logo.w,ELS.logo.h);
    ctx.filter='none';ctx.restore();
  }

  // ── Comillas decorativas ──
  const qsz=Math.round(cr.w*.35);
  ctx.save();
  ctx.font=`900 ${qsz}px 'BebasNeue',sans-serif`;
  ctx.fillStyle=isVerde||isBlanco?'rgba(0,0,0,.08)':'rgba(166,206,57,.18)';
  ctx.textBaseline='top';
  ctx.fillText('"',cr.x+Math.round(cr.w*.04),cr.y+Math.round(cr.h*.18));
  ctx.restore();

  // ── Texto de la cita — usando ELS.title como elemento editable ──
  ensurePos('title');
  // Forzar posición dentro del panel color si aún no fue movido
  if(ELS.title._textualInit!==pos+sp){
    const tpad=Math.round(cr.w*.1);
    ELS.title.x=cr.x+tpad;
    ELS.title.y=cr.y+Math.round(cr.h*.32);
    ELS.title.w=cr.w-tpad*2;
    ELS.title.h=Math.round(cr.h*.45);
    ELS.title._textualInit=pos+sp;
  }
  const el=ELS.title;
  const aw=el.w-Math.round(el.w*.05)*2;
  let sz=Math.max(12,Math.round(el.h*.32));
  let lines,lh,bh;
  for(let i=0;i<20;i++){
    ctx.font=`400 ${sz}px 'BebasNeue',sans-serif`;
    lines=wrapText(ctx,S.quote?S.quote.toUpperCase():'ESCRIBÍ LA CITA...',aw);
    lh=sz*1.18;bh=lines.length*lh;
    if(bh<=el.h*.95||sz<=12)break;
    sz=Math.max(12,Math.round(sz*.88));
  }
  ctx.save();
  ctx.textBaseline='top';ctx.textAlign='left';
  ctx.fillStyle=S.quote?textCol:'rgba(0,0,0,.25)';
  ctx.font=`400 ${sz}px 'BebasNeue',sans-serif`;
  const ty=el.y+(el.h-bh)/2;
  lines.forEach((l,i)=>ctx.fillText(l,el.x+Math.round(el.w*.05)*1,ty+i*lh));
  ctx.restore();

  // ── Autor ──
  if(S.quoteAuthor){
    const ay=el.y+el.h+Math.round(cr.h*.03);
    ctx.save();
    ctx.strokeStyle=accentC;ctx.lineWidth=Math.round(cr.w*.005);
    ctx.beginPath();ctx.moveTo(el.x,ay);ctx.lineTo(el.x+Math.round(cr.w*.15),ay);ctx.stroke();
    ctx.font=`700 ${Math.round(cr.w*.055)}px 'Economica',sans-serif`;
    ctx.fillStyle=isVerde||isBlanco?'rgba(0,0,0,.6)':'rgba(255,255,255,.7)';
    ctx.textBaseline='top';
    ctx.fillText('— '+S.quoteAuthor.toUpperCase(),el.x,ay+Math.round(cr.h*.03));
    ctx.restore();
  }
}

// ── RENDER FOTO CÍRCULO / FORMA ──
function drawFotoShape(cx,cy,R,clip){
  // clip=true: solo trazar path. clip=false: dibujar borde
  const sh=S.fotoShape;
  ctx.beginPath();
  if(sh==='circle'){
    ctx.arc(cx,cy,R,0,Math.PI*2);
  } else if(sh==='square'){
    const r=Math.round(R*.12);
    const x=cx-R,y=cy-R,s=R*2;
    ctx.moveTo(x+r,y);ctx.lineTo(x+s-r,y);ctx.quadraticCurveTo(x+s,y,x+s,y+r);
    ctx.lineTo(x+s,y+s-r);ctx.quadraticCurveTo(x+s,y+s,x+s-r,y+s);
    ctx.lineTo(x+r,y+s);ctx.quadraticCurveTo(x,y+s,x,y+s-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  } else if(sh==='diamond'){
    ctx.moveTo(cx,cy-R);ctx.lineTo(cx+R,cy);
    ctx.lineTo(cx,cy+R);ctx.lineTo(cx-R,cy);ctx.closePath();
  } else if(sh==='hexagon'){
    for(let i=0;i<6;i++){
      const a=Math.PI/180*(60*i-30);
      i===0?ctx.moveTo(cx+R*Math.cos(a),cy+R*Math.sin(a))
           :ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));
    }ctx.closePath();
  }
}

function renderFoto(W,H){
  // ── FONDO ──
  if(S.bgImg){
    ctx.save();
    if(S.iBlur>0)ctx.filter=`blur(${S.iBlur}px)`;
    const img=S.bgImg,ir=img.width/img.height,cr=W/H;
    let sx,sy,sw,sh;
    if(ir>cr){sh=img.height;sw=sh*cr;sx=(img.width-sw)/2;sy=0;}
    else{sw=img.width;sh=sw/cr;sx=0;sy=(img.height-sh)/2;}
    const p=S.iBlur*4;
    ctx.drawImage(img,sx,sy,sw,sh,-p,-p,W+p*2,H+p*2);
    ctx.filter='none';ctx.restore();
    if(S.iDark>0){ctx.save();ctx.globalAlpha=S.iDark;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.restore();}
  } else {
    ctx.fillStyle='#dedad3';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#999';ctx.font=`${Math.round(W*.022)}px Montserrat,sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('Cargá la imagen de la noticia',W/2,H/2);ctx.textAlign='left';
  }
  (TPLS[S.tpl]||TPLS.normal)(W,H);
  // ── ELEMENTOS NORMALES ──
  ensurePos('title');ensurePos('cat');ensurePos('logo');
  drawLogo();drawCat();drawTitle();
  // ── FOTO EN FORMA ──
  ensurePos('foto');
  const el=ELS.foto;
  const cx=Math.round(el.x+el.w/2);
  const cy=Math.round(el.y+el.h/2);
  const R=Math.round(el.w/2);
  if(!S.fotoImg){
    ctx.save();
    ctx.strokeStyle='rgba(166,206,57,.7)';ctx.lineWidth=Math.round(R*.06);
    ctx.setLineDash([Math.round(R*.15),Math.round(R*.1)]);
    drawFotoShape(cx,cy,R,true);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(166,206,57,.5)';
    ctx.font=`${Math.round(R*.3)}px Montserrat,sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('+ foto',cx,cy);ctx.textAlign='left';
    ctx.restore();
    return;
  }
  ctx.save();
  // Sombra
  ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=Math.round(R*.2);ctx.shadowOffsetY=Math.round(R*.05);
  // Borde
  drawFotoShape(cx,cy,R+Math.round(R*.07),false);
  ctx.fillStyle=S.fotoBorder;ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  // Clip + imagen
  drawFotoShape(cx,cy,R,true);ctx.clip();
  const fi=S.fotoImg;
  const side=Math.min(fi.width,fi.height);
  ctx.drawImage(fi,(fi.width-side)/2,(fi.height-side)/2,side,side,cx-R,cy-R,R*2,R*2);
  ctx.restore();
}

// ── RENDER COLLAGE ──
// Helper: dibujar imagen en un rect recortado
function drawImgInRect(img,rx,ry,rw,rh,idx){
  ctx.save();
  ctx.beginPath();ctx.rect(rx,ry,rw,rh);ctx.clip();
  if(img){
    const ir=img.width/img.height,cr=rw/rh;
    let sx,sy,sw,sh;
    if(ir>cr){sh=img.height;sw=sh*cr;sx=(img.width-sw)/2;sy=0;}
    else{sw=img.width;sh=sw/cr;sx=0;sy=(img.height-sh)/2;}
    ctx.drawImage(img,sx,sy,sw,sh,rx,ry,rw,rh);
  } else {
    const colors=['#222','#1a1a1a','#252525','#1e1e1e'];
    ctx.fillStyle=colors[idx%4];ctx.fillRect(rx,ry,rw,rh);
    ctx.fillStyle='rgba(166,206,57,.4)';
    ctx.font=`${Math.round(Math.min(rw,rh)*.18)}px Montserrat,sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(`${idx+1}`,rx+rw/2,ry+rh/2);ctx.textAlign='left';
  }
  ctx.restore();
}
// Helper: dibujar divisores verdes entre celdas
function drawCollageDividers(lines){
  const dw=3;
  lines.forEach(([x1,y1,x2,y2])=>{
    ctx.fillStyle='#111';
    if(x1===x2){ctx.fillRect(x1-2,y1,4,y2-y1);}
    else{ctx.fillRect(x1,y1-2,x2-x1,4);}
    ctx.fillStyle='#a6ce39';
    if(x1===x2){ctx.fillRect(x1-1,y1,dw,y2-y1);}
    else{ctx.fillRect(x1,y1-1,x2-x1,dw);}
  });
}

function renderCollage(W,H){
  const imgs=S.collageImgs;
  const L=S.collageLayout;
  const gap=Math.round(W*.008);

  // ── LAYOUTS ──
  if(L==='2h'){
    // Dos horizontales (izq/der)
    const mid=Math.round(W/2);
    drawImgInRect(imgs[0],0,0,mid-gap/2,H,0);
    drawImgInRect(imgs[1],mid+gap/2,0,W-mid-gap/2,H,1);
    drawCollageDividers([[mid,0,mid,H]]);
  }
  else if(L==='2v'){
    // Dos verticales (arriba/abajo)
    const mid=Math.round(H/2);
    drawImgInRect(imgs[0],0,0,W,mid-gap/2,0);
    drawImgInRect(imgs[1],0,mid+gap/2,W,H-mid-gap/2,1);
    drawCollageDividers([[0,mid,W,mid]]);
  }
  else if(L==='3t'){
    // Una grande arriba, dos chicas abajo
    const splitH=Math.round(H*.55);
    const midW=Math.round(W/2);
    drawImgInRect(imgs[0],0,0,W,splitH-gap/2,0);
    drawImgInRect(imgs[1],0,splitH+gap/2,midW-gap/2,H-splitH-gap/2,1);
    drawImgInRect(imgs[2],midW+gap/2,splitH+gap/2,W-midW-gap/2,H-splitH-gap/2,2);
    drawCollageDividers([[0,splitH,W,splitH],[midW,splitH,midW,H]]);
  }
  else if(L==='3b'){
    // Dos chicas arriba, una grande abajo
    const splitH=Math.round(H*.45);
    const midW=Math.round(W/2);
    drawImgInRect(imgs[0],0,0,midW-gap/2,splitH-gap/2,0);
    drawImgInRect(imgs[1],midW+gap/2,0,W-midW-gap/2,splitH-gap/2,1);
    drawImgInRect(imgs[2],0,splitH+gap/2,W,H-splitH-gap/2,2);
    drawCollageDividers([[0,splitH,W,splitH],[midW,0,midW,splitH]]);
  }
  else if(L==='3l'){
    // Una grande izquierda, dos chicas derecha
    const splitW=Math.round(W*.55);
    const midH=Math.round(H/2);
    drawImgInRect(imgs[0],0,0,splitW-gap/2,H,0);
    drawImgInRect(imgs[1],splitW+gap/2,0,W-splitW-gap/2,midH-gap/2,1);
    drawImgInRect(imgs[2],splitW+gap/2,midH+gap/2,W-splitW-gap/2,H-midH-gap/2,2);
    drawCollageDividers([[splitW,0,splitW,H],[splitW,midH,W,midH]]);
  }
  else if(L==='3r'){
    // Dos chicas izquierda, una grande derecha
    const splitW=Math.round(W*.45);
    const midH=Math.round(H/2);
    drawImgInRect(imgs[0],0,0,splitW-gap/2,midH-gap/2,0);
    drawImgInRect(imgs[1],0,midH+gap/2,splitW-gap/2,H-midH-gap/2,1);
    drawImgInRect(imgs[2],splitW+gap/2,0,W-splitW-gap/2,H,2);
    drawCollageDividers([[splitW,0,splitW,H],[0,midH,splitW,midH]]);
  }
  else if(L==='4'){
    // Cuatro iguales
    const mw=Math.round(W/2),mh=Math.round(H/2);
    drawImgInRect(imgs[0],0,0,mw-gap/2,mh-gap/2,0);
    drawImgInRect(imgs[1],mw+gap/2,0,W-mw-gap/2,mh-gap/2,1);
    drawImgInRect(imgs[2],0,mh+gap/2,mw-gap/2,H-mh-gap/2,2);
    drawImgInRect(imgs[3],mw+gap/2,mh+gap/2,W-mw-gap/2,H-mh-gap/2,3);
    drawCollageDividers([[mw,0,mw,H],[0,mh,W,mh]]);
  }

  // ── OVERLAY DEGRADADO + TEXTO ──
  const g=ctx.createLinearGradient(0,H*.5,0,H);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.85)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(ELS.logo.x===null)ensurePos('logo');
  if(ELS.title.x===null)ensurePos('title');
  if(ELS.cat.x===null)ensurePos('cat');
  drawLogo();drawCat();drawTitle();
}

// ══════════════════════════════════════════
// RENDER FÚTBOL / MUNDIAL 2026
// ══════════════════════════════════════════

function renderFutbol(W, H) {
  // 1. Dibujar plantilla de fondo
  const tplFn = TPLS[S.tpl] || TPLS['futbol-mañana'];
  tplFn(W, H);

  // 2. Cargar logo mundial si no está cargado
  if (!S.mundialLogoImg) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { S.mundialLogoImg = img; render(); };
    img.onerror = () => { S.mundialLogoImg = 'error'; render(); };
    img.src = '../assets/logo-mundial.png';
    return; // esperar carga
  }

  // 2b. Cargar fondo WC26 si plantilla activa y no está cargado
  if (S.tpl === 'futbol-wc26' && !S.wc26BgImg) {
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => { S.wc26BgImg = bgImg; render(); };
    bgImg.onerror = () => { S.wc26BgImg = 'error'; render(); };
    bgImg.src = '../assets/mundial-2026.jpg';
    return;
  }

  // 3. Dibujar contenido según tipo
  drawMundialInfo(W, H);
}

// ── Sistema de banderas con CDN (flagcdn.com) ──
const _flagCache = {};
const ISO_MAP = {
  'Argentina':'ar','Brazil':'br','France':'fr','Germany':'de','Spain':'es',
  'England':'gb-eng','Portugal':'pt','Netherlands':'nl','Belgium':'be','Croatia':'hr',
  'Uruguay':'uy','Mexico':'mx','Colombia':'co','Chile':'cl','Peru':'pe',
  'Ecuador':'ec','Paraguay':'py','Venezuela':'ve','Switzerland':'ch','Austria':'at',
  'Denmark':'dk','Sweden':'se','Norway':'no','Japan':'jp','South Korea':'kr',
  'Australia':'au','Morocco':'ma','Egypt':'eg','Nigeria':'ng','Senegal':'sn',
  'Ghana':'gh','Cameroon':'cm','Algeria':'dz','Saudi Arabia':'sa','Iran':'ir',
  'Iraq':'iq','Canada':'ca','United States':'us','Tunisia':'tn','Costa Rica':'cr',
  'Panama':'pa','Honduras':'hn','Jamaica':'jm','Serbia':'rs','Poland':'pl',
  'Czech Republic':'cz','Czechia':'cz','Slovakia':'sk','Ukraine':'ua','Russia':'ru','Turkey':'tr',
  'Wales':'gb-wls','Scotland':'gb-sct','Ivory Coast':'ci','South Africa':'za',
  'Albania':'al','North Macedonia':'mk','Palestine':'ps','Jordan':'jo','Qatar':'qa',
  'United Arab Emirates':'ae','China':'cn','India':'in','Indonesia':'id','Thailand':'th',
  'New Zealand':'nz','Iceland':'is','Finland':'fi','Hungary':'hu','Romania':'ro',
  'Bosnia and Herzegovina':'ba','Bosnia-Herzegovina':'ba','Georgia':'ge','Slovenia':'si','Kosovo':'xk',
  'El Salvador':'sv','Curaçao':'cw','Suriname':'sr','Haiti':'ht','Cuba':'cu',
  'Bolivia':'bo','Trinidad and Tobago':'tt','Congo DR':'cd','DR Congo':'cd','Democratic Republic of Congo':'cd','Cape Verde':'cv',
  'Mali':'ml','Burkina Faso':'bf','Zambia':'zm','Zimbabwe':'zw','Kenya':'ke',
  'Uganda':'ug','Tanzania':'tz','Mozambique':'mz','Angola':'ao','Gabon':'ga',
  'Benin':'bj','Togo':'tg','Libya':'ly','Gambia':'gm','Guinea':'gn',
  'Congo':'cg','Guinea-Bissau':'gw','Sierra Leone':'sl','Liberia':'lr',
  'Namibia':'na','Niger':'ne','Chad':'td','Central African Republic':'cf',
  'Luxembourg':'lu','Latvia':'lv','Lithuania':'lt','Estonia':'ee',
  'Belarus':'by','Cyprus':'cy','Malta':'mt','Armenia':'am','Azerbaijan':'az',
  'Kazakhstan':'kz','Uzbekistan':'uz','Lebanon':'lb','Oman':'om',
  'Bahrain':'bh','Kuwait':'kw','Syria':'sy','Yemen':'ye','Vietnam':'vn',
  'Malaysia':'my','Singapore':'sg','Philippines':'ph','Myanmar':'mm',
  'Cambodia':'kh','Laos':'la','Mongolia':'mn','North Korea':'kp',
  'Tajikistan':'tj','Kyrgyzstan':'kg','Turkmenistan':'tm','Afghanistan':'af',
  'Nepal':'np','Bangladesh':'bd','Sri Lanka':'lk','Pakistan':'pk',
  'Sudan':'sd','Ethiopia':'et','Somalia':'so','Eritrea':'er','Djibouti':'dj',
  'Madagascar':'mg','Malawi':'mw','Rwanda':'rw','Burundi':'bi','Lesotho':'ls',
  'Eswatini':'sz','Botswana':'bw','Equatorial Guinea':'gq','Mauritania':'mr',
  'Comoros':'km','Mauritius':'mu','Seychelles':'sc','Cabo Verde':'cv',
  'São Tomé and Príncipe':'st','Guam':'gu','American Samoa':'as',
  'Puerto Rico':'pr','Dominican Republic':'do','Guatemala':'gt','Nicaragua':'ni',
  'Belize':'bz','Guyana':'gy','Fiji':'fj','Papua New Guinea':'pg',
  'Solomon Islands':'sb','Vanuatu':'vu','New Caledonia':'nc','Tahiti':'pf',
  // ── Spanish name variants (API returns Spanish names) ──
  'Brasil':'br','Francia':'fr','Alemania':'de','España':'es',
  'Inglaterra':'gb-eng','Portugal':'pt','Países Bajos':'nl','Bélgica':'be','Croacia':'hr',
  'Polonia':'pl','Uruguay':'uy','México':'mx','Colombia':'co',
  'Perú':'pe','Suiza':'ch','Austria':'at','Dinamarca':'dk','Suecia':'se',
  'Noruega':'no','Japón':'jp','Corea del Sur':'kr','Arabia Saudita':'sa',
  'Emiratos Árabes':'ae','Irán':'ir','Irak':'iq','Marruecos':'ma','Egipto':'eg',
  'Túnez':'tn','Argelia':'dz','Costa Rica':'cr','Panamá':'pa',
  'Canadá':'ca','Estados Unidos':'us','Chequia':'cz','República Checa':'cz','Eslovaquia':'sk',
  'Ucrania':'ua','Rusia':'ru','Turquía':'tr','Gales':'gb-wls','Escocia':'gb-sct',
  'Costa de Marfil':'ci','Sudáfrica':'za','Hungría':'hu','Rumania':'ro',
  'Serbia':'rs','Bosnia y Herzegovina':'ba','Bosnia':'ba','Eslovenia':'si',
  'El Salvador':'sv','Curazao':'cw','Bolivia':'bo',
  'República Dominicana':'do','Nueva Zelanda':'nz','Islandia':'is','Finlandia':'fi',
  'Grecia':'gr','Israel':'il','China':'cn','Tailandia':'th','Vietnam':'vn',
  'Malasia':'my','Singapur':'sg','Indonesia':'id','Filipinas':'ph',
  'Argentina':'ar','Chile':'cl','Ecuador':'ec','Paraguay':'py','Venezuela':'ve',
  'Honduras':'hn','Jamaica':'jm','Camerún':'cm','Ghana':'gh','Senegal':'sn',
  'Nigeria':'ng','Australia':'au','Uzbekistán':'uz','Uzbekistan':'uz',
  'Jordania':'jo','Cabo Verde':'cv','Catar':'qa','Qatar':'qa',
  'Curazao':'cw','Haití':'ht','Sudáfrica':'za',
  'RD Congo':'cd','Escocia':'gb-sct','Gales':'gb-wls',
  'Irlanda del Norte':'gb-nir','Arabia Saudí':'sa',
  // ── Portuguese/French/other API variants ──
  'Turquie':'tr','Turkiye':'tr','Türkiye':'tr',
  'Marrocos':'ma','Maroc':'ma',
  'Haïti':'ht',
  'Irã':'ir',
  'Estados Unidos da América':'us','États-Unis':'us','United States of America':'us',
  'Suíça':'ch','Schweiz':'ch',
  'Bósnia e Herzegovina':'ba','Bósnia':'ba',
  'Paraguai':'py','Uruguai':'uy','Equador':'ec',
  'Colômbia':'co',
  'Austrália':'au','Nova Zelândia':'nz',
  'Arábia Saudita':'sa','Japão':'jp',
  'Coreia do Sul':'kr','Coreia do Norte':'kp',
  'Escócia':'gb-sct','País de Gales':'gb-wls',
  'Suécia':'se','Finlândia':'fi','Islândia':'is',
  'Polónia':'pl','Croácia':'hr','Sérvia':'rs',
  'Eslováquia':'sk','Eslovénia':'si',
  'Hungria':'hu','Roménia':'ro','Ucrânia':'ua',
  'Áustria':'at','Grécia':'gr',
  'Nigéria':'ng','Camarões':'cm','Argélia':'dz',
  'Tunísia':'tn','Egito':'eg',
  'Costa do Marfim':'ci','África do Sul':'za',
};

function flagIso(pais) { return ISO_MAP[pais] || null; }

function loadFlag(pais) {
  const iso = flagIso(pais);
  if (!iso) return null;
  if (_flagCache[iso]) return _flagCache[iso].complete ? _flagCache[iso] : null;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => { if (window._render) window._render(); };
  img.onerror = () => { _flagCache[iso] = null; };
  img.src = `https://flagcdn.com/w160/${iso}.png`;
  _flagCache[iso] = img;
  return null;
}

function drawFlagRect(ctx, pais, x, y, w, h) {
  const flag = loadFlag(pais);
  if (flag) {
    ctx.save();
    // Sombra sutil para destacar
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.drawImage(flag, x, y, w, h);
    ctx.restore();
    // Borde fino
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);
    return;
  }
  // Fallback: rectángulo de color si no hay imagen
  const fallback = {
    'Argentina':['#75AADB','#fff','#75AADB'], 'Brazil':['#009739','#FEDD00','#002776'],
    'France':['#002395','#fff','#ED2939'], 'Germany':['#000','#D00','#FFCE00'],
    'Spain':['#AA151B','#F1BF00','#AA151B'], 'England':['#fff','#CF081F','#fff'],
    'Portugal':['#006600','#FF0000','#FFCC00'], 'Netherlands':['#AE1C28','#fff','#21468B'],
  };
  const colors = fallback[pais] || ['#555','#888','#555'];
  const stripeW = w / 3;
  ctx.fillStyle = colors[0]; ctx.fillRect(x, y, stripeW, h);
  ctx.fillStyle = colors[1]; ctx.fillRect(x + stripeW, y, stripeW, h);
  ctx.fillStyle = colors[2]; ctx.fillRect(x + stripeW * 2, y, Math.ceil(stripeW), h);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}
window._render = null; // se asigna en init

// ── Obtener iniciales cortas del país ──
function countryInitials(pais) {
  const map = {
    'Argentina':'ARG','Brazil':'BRA','France':'FRA','Germany':'GER','Spain':'ESP',
    'England':'ENG','Portugal':'POR','Netherlands':'NED','Belgium':'BEL','Croatia':'CRO',
    'Uruguay':'URU','Mexico':'MEX','Colombia':'COL','Chile':'CHI','Peru':'PER',
    'Ecuador':'ECU','Paraguay':'PAR','Venezuela':'VEN','Switzerland':'SUI','Austria':'AUT',
    'Denmark':'DEN','Sweden':'SWE','Norway':'NOR','Japan':'JPN','South Korea':'KOR',
    'Australia':'AUS','Morocco':'MAR','Egypt':'EGY','Nigeria':'NGA','Senegal':'SEN',
    'Ghana':'GHA','Cameroon':'CMR','Algeria':'ALG','Saudi Arabia':'KSA','Iran':'IRN',
    'Iraq':'IRQ','Canada':'CAN','United States':'USA','Tunisia':'TUN','Costa Rica':'CRC',
    'Panama':'PAN','Honduras':'HON','Jamaica':'JAM','Serbia':'SRB','Poland':'POL',
  };
  return map[pais] || pais.substring(0,3).toUpperCase();
}

// ── WC 2026 — Helper functions for the official template ──
const WC26C = {
  coral:     '#E8564A',
  turquoise: '#00BFA6',
  purple:    '#8E44AD',
  lime:      '#8DC63F',
  blue:      '#2A398D',
  red:       '#E61D25',
  darkBg:    'rgba(12, 10, 28, 0.85)',
  barLocal:  '#E63946',
  barScore:  '#00D4AA',
  barVisitor:'#9B59B6',
  barTime:   '#1A1A2E',
  barBlack:  '#0A0A0A',
};

function wc26Font(weight, size) {
  return `${weight || '400'} ${size}px 'FWC2026','BebasNeue',sans-serif`;
}

function wc26Active() {
  return S.tpl === 'futbol-wc26';
}

/**
 * Draws a TV-style scoreboard bar (WC26) for a single match row.
 * @param {number} x - Left position of the row
 * @param {number} y - Top position of the row
 * @param {number} w - Width of the row
 * @param {number} h - Height of the row
 * @param {number} cx - Center X of the matches area
 * @param {object} p - Match object (for IN_PLAY detection)
 */
function drawWC26Bar(x, y, w, h, cx, p) {
  const r = Math.round(h * 0.18);
  const barPad = Math.round(w * 0.01);
  const bx = x + barPad;
  const bw = w - barPad * 2;
  const by = y + Math.round(h * 0.06);
  const bh = h - Math.round(h * 0.12);

  // Marco exterior con gradiente multicolor vivo
  ctx.save();
  const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
  grad.addColorStop(0, WC26C.barLocal);
  grad.addColorStop(0.35, WC26C.barLocal);
  grad.addColorStop(0.42, WC26C.barScore);
  grad.addColorStop(0.58, WC26C.barScore);
  grad.addColorStop(0.65, WC26C.barVisitor);
  grad.addColorStop(1, WC26C.barVisitor);
  ctx.fillStyle = grad;
  roundRect(ctx, bx, by, bw, bh, r);
  ctx.fill();
  ctx.restore();

  // Interior negro (contenido del partido va encima)
  const inset = Math.max(3, Math.round(bh * 0.08));
  ctx.save();
  ctx.fillStyle = WC26C.barBlack;
  roundRect(ctx, bx + inset, by + inset, bw - inset * 2, bh - inset * 2, Math.max(2, r - inset));
  ctx.fill();
  ctx.restore();

  // Status sub-bar (dark pill at bottom center)
  const statusH = Math.round(h * 0.14);
  const statusY = by + bh - Math.round(statusH * 0.5);
  ctx.save();
  ctx.fillStyle = WC26C.barTime;
  roundRect(ctx, cx - Math.round(bw * 0.16), statusY, Math.round(bw * 0.32), statusH, Math.round(statusH * 0.4));
  ctx.fill();
  ctx.restore();
}

function drawMundialInfo(W, H) {
  const tipo = S.mundialTipo || 'partidos-dia';

  // Tipos especiales que no requieren partidos
  if (tipo === 'posiciones') {
    drawMundialPosiciones(W, H);
    return;
  }
  if (tipo === 'goleadores') {
    drawMundialGoleadores(W, H);
    return;
  }
  if (tipo === 'bracket') {
    drawMundialBracket(W, H);
    return;
  }

  if (!S.mundialData || !S.mundialData.partidos || S.mundialData.partidos.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${Math.round(W*0.025)}px 'BebasNeue',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Seleccioná partidos del calendario', W/2, H/2);
    ctx.textAlign = 'left';
    return;
  }

  const partidos = S.mundialData.partidos;

  if (tipo === 'partido-individual') {
    drawMundialPartidoIndividual(W, H, partidos[0]);
  } else if (tipo === 'resultados-dia') {
    drawMundialResultadosDia(W, H, partidos);
  } else {
    drawMundialPartidosDia(W, H, partidos);
  }
}

// ── PLACA PARTIDOS DEL DÍA ──
function drawMundialPartidosDia(W, H, partidos) {
  const pad = Math.round(W * 0.06);
  const count = partidos.length;

  // Asegurar posiciones de elementos arrastrables
  if(ELS.mlogo.x===null) ensurePos('mlogo');
  if(ELS.logo.x===null) ensurePos('logo');
  ensurePos('header');
  ensurePos('matches');

  // ── Logo Mundial (arrastrable vía ELS.mlogo) ──
  if (S.mundialLogoImg && S.mundialLogoImg !== 'error') {
    ctx.drawImage(S.mundialLogoImg, ELS.mlogo.x, ELS.mlogo.y, ELS.mlogo.w, ELS.mlogo.h);
  }

  // ── Bloque Título + Fecha (arrastrable vía ELS.header) ──
  {
    const hdr = ELS.header;
    const hdrDef = defaultPos('header');
    const hdrScaleW = hdr.w / hdrDef.w;
    const hdrScaleH = hdr.h / hdrDef.h;
    const hdrCX = hdr.x + hdr.w / 2;

    // ── Título ──
    const titleY = hdr.y + Math.round(hdr.h * 0.15);
    const titleFont = wc26Active() ? wc26Font('700', Math.round(W*0.062 * hdrScaleH)) : `700 ${Math.round(W*0.062 * hdrScaleH)}px 'BebasNeue',sans-serif`;
    ctx.font = titleFont;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(S.title || `${count} PARTIDO${count>1?'S':''} DEL MUNDIAL`, hdrCX, titleY);

    // ── Línea decorativa bajo título ──
    const lineW = Math.round(hdr.w * 0.33);
    const lineY = titleY + Math.round(hdr.h * 0.55);
    if (wc26Active()) {
      const segW = Math.round(lineW / 4);
      const lx0 = hdrCX - lineW/2;
      [WC26C.coral, WC26C.turquoise, WC26C.purple, WC26C.lime].forEach((c,ci) => {
        ctx.fillStyle = c;
        ctx.fillRect(lx0 + ci * segW, lineY, segW + 1, Math.round(hdr.h*0.04));
      });
    } else {
      ctx.fillStyle = '#a6ce39';
      ctx.fillRect(hdrCX - lineW/2, lineY, lineW, Math.round(hdr.h*0.04));
    }

    // ── Fecha ──
    const fechaY = lineY + Math.round(hdr.h * 0.12);
    ctx.font = `400 ${Math.round(W*0.026 * hdrScaleH)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const fechaStr = S.mundialData.fecha || '';
    if (fechaStr) {
      const [y,m,d] = fechaStr.split('-');
      const meses = ['','ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
      ctx.fillText(`${parseInt(d)} ${meses[parseInt(m)]||''} ${y}`, hdrCX, fechaY);
    }
  }

  // ── Bloque Lista de partidos (arrastrable vía ELS.matches) ──
  {
    const mel = ELS.matches;
    const melDef = defaultPos('matches');
    const melScaleW = mel.w / melDef.w;
    const melScaleH = mel.h / melDef.h;
    const melCX = mel.x + mel.w / 2;
    const mPad = Math.round(mel.w * 0.04);

    const rowH = Math.min(Math.round(mel.h * 0.95 / count), Math.round(H * 0.15 * melScaleH));
    const totalH = rowH * count;
    const startY = mel.y + Math.round((mel.h - totalH) / 2);
    const flagW = Math.round(W * 0.05 * melScaleW);
    const flagH = Math.round(flagW * 0.7);

  partidos.forEach((p, i) => {
    const rowY = startY + i * rowH;

    // ── WC26: TV scoreboard bar ──
    if (wc26Active()) {
      drawWC26Bar(mel.x + mPad, rowY, mel.w - mPad*2, rowH, melCX, p);
    } else {
      // Fondo alternado sutil
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(mel.x + mPad, rowY, mel.w - mPad*2, rowH);
      }
      // Línea separadora
      if (i > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(mel.x + mPad + Math.round(mel.w*0.05), rowY, mel.w - mPad*2 - Math.round(mel.w*0.1), 1);
      }
    }

    const midY = rowY + Math.round(rowH * 0.4);

    // Hora
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.028 * melScaleW)) : `700 ${Math.round(W*0.032 * melScaleW)}px 'Economica',sans-serif`;
    ctx.fillStyle = wc26Active() ? '#FFFFFF' : '#a6ce39';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.hora || '--:--', mel.x + mPad + Math.round(mel.w*(wc26Active()?0.07:0.05)), midY);
    ctx.restore();

    // Equipo local (izq)
    const localX = mel.x + mPad + Math.round(mel.w * 0.13);
    drawFlagRect(ctx, p.local, localX, midY - Math.round(flagH/2), flagW, flagH);
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.032 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const localName = (typeof traducirPais === 'function' ? traducirPais(p.local) : p.local).toUpperCase();
    ctx.fillText(localName, localX + flagW + Math.round(mel.w*0.015), midY);
    ctx.restore();

    // VS o Score centrado
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.032 * melScaleW)) : `700 ${Math.round(W*0.028 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (p.golesLocal !== null && p.golesLocal !== undefined) {
      ctx.fillStyle = wc26Active() ? '#FFFFFF' : '#a6ce39';
      ctx.fillText(`${p.golesLocal} - ${p.golesVisitante}`, melCX, midY);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText('VS', melCX, midY);
    }
    ctx.restore();

    // Estado EN VIVO en partidos del día
    if (p.estado === 'IN_PLAY') {
      ctx.save();
      ctx.font = `700 ${Math.round(W*0.014 * melScaleW)}px 'Economica',sans-serif`;
      ctx.fillStyle = wc26Active() ? WC26C.lime : '#ff6b6b';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('● EN VIVO', melCX, midY - Math.round(rowH * 0.28));
      ctx.restore();
    }

    // HT score en partidos del día (si hay score)
    if (p.golesLocal !== null && p.golesHTLocal !== null && p.golesHTLocal !== undefined) {
      ctx.save();
      ctx.font = `400 ${Math.round(W*0.015 * melScaleW)}px 'Economica',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(`HT: ${p.golesHTLocal}-${p.golesHTVisitante}`, melCX, midY + Math.round(rowH * 0.18));
      ctx.restore();
    }

    // Equipo visitante (der)
    const visX = mel.x + mel.w - mPad - Math.round(mel.w * 0.13) - flagW;
    drawFlagRect(ctx, p.visitante, visX, midY - Math.round(flagH/2), flagW, flagH);
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.032 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const visName = (typeof traducirPais === 'function' ? traducirPais(p.visitante) : p.visitante).toUpperCase();
    ctx.fillText(visName, visX - Math.round(mel.w*0.015), midY);
    ctx.restore();

    // Info extra (grupo, estadio) debajo
    const infoY = midY + Math.round(rowH * 0.28);
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.02 * melScaleW)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const extras = [];
    if (p.grupo) extras.push(String(p.grupo).replace(/GROUP_/i, 'Grupo ').replace(/Group /i, 'Grupo '));
    if (p.estadio && p.estadio !== 'TBD' && p.estadio !== '') extras.push(p.estadio);
    if (extras.length) ctx.fillText(extras.join(' • '), melCX, infoY);
    ctx.restore();

    // Indicador de madrugada (🌙 junto al horario)
    if (p.madrugada) {
      ctx.save();
      ctx.font = `400 ${Math.round(W*0.016 * melScaleW)}px 'Economica',sans-serif`;
      ctx.fillStyle = '#f0c040';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('🌙 Madrugada', melCX, midY - Math.round(rowH * 0.28));
      ctx.restore();
    }
  });
  } // fin bloque matches

  // ── Logo principal MM abajo (arrastrable vía ELS.logo) ──
  if (S.logoImg) {
    ctx.save();
    ctx.globalAlpha = S.lOp || 1;
    ctx.drawImage(S.logoImg, ELS.logo.x, ELS.logo.y, ELS.logo.w, ELS.logo.h);
    ctx.restore();
  }
}

// ── PLACA RESULTADOS DEL DÍA (NOCHE) ──
function drawMundialResultadosDia(W, H, partidos) {
  const pad = Math.round(W * 0.06);
  // Filtrar solo partidos finalizados
  const terminados = partidos.filter(p => p.golesLocal !== null && p.golesLocal !== undefined);
  const count = terminados.length;

  // Asegurar posiciones de elementos arrastrables
  if(ELS.mlogo.x===null) ensurePos('mlogo');
  if(ELS.logo.x===null) ensurePos('logo');
  ensurePos('header');
  ensurePos('matches');

  // ── Logo Mundial (arrastrable vía ELS.mlogo) ──
  if (S.mundialLogoImg && S.mundialLogoImg !== 'error') {
    ctx.drawImage(S.mundialLogoImg, ELS.mlogo.x, ELS.mlogo.y, ELS.mlogo.w, ELS.mlogo.h);
  }

  // ── Bloque Título + Fecha (arrastrable vía ELS.header) ──
  {
    const hdr = ELS.header;
    const hdrDef = defaultPos('header');
    const hdrScaleH = hdr.h / hdrDef.h;
    const hdrCX = hdr.x + hdr.w / 2;

    // ── Título ──
    const titleY = hdr.y + Math.round(hdr.h * 0.15);
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.058 * hdrScaleH)) : `700 ${Math.round(W*0.058 * hdrScaleH)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(S.title || `RESULTADOS DEL MUNDIAL`, hdrCX, titleY);

    // ── Línea decorativa bajo título ──
    const lineW = Math.round(hdr.w * 0.33);
    const lineY = titleY + Math.round(hdr.h * 0.50);
    if (wc26Active()) {
      const segW = Math.round(lineW / 4);
      const lx0 = hdrCX - lineW/2;
      [WC26C.coral, WC26C.turquoise, WC26C.purple, WC26C.lime].forEach((c,ci) => {
        ctx.fillStyle = c;
        ctx.fillRect(lx0 + ci * segW, lineY, segW + 1, Math.round(hdr.h*0.04));
      });
    } else {
      ctx.fillStyle = '#a6ce39';
      ctx.fillRect(hdrCX - lineW/2, lineY, lineW, Math.round(hdr.h*0.04));
    }

    // ── Fecha (formateada igual que partidos del día) ──
    const fechaY = lineY + Math.round(hdr.h * 0.12);
    ctx.font = `400 ${Math.round(W*0.026 * hdrScaleH)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const fechaStrRes = S.mundialData.fecha || '';
    if (fechaStrRes) {
      const [yr,mr,dr] = fechaStrRes.split('-');
      const mesesR = ['','ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
      ctx.fillText(`${parseInt(dr)} ${mesesR[parseInt(mr)]||''} ${yr}`, hdrCX, fechaY);
    }
  }

  if (count === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${Math.round(W*0.028)}px 'BebasNeue',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Sin partidos finalizados aún', W/2, H/2);
    return;
  }

  // ── Bloque Resultados (arrastrable vía ELS.matches) ──
  {
    const mel = ELS.matches;
    const melDef = defaultPos('matches');
    const melScaleW = mel.w / melDef.w;
    const melScaleH = mel.h / melDef.h;
    const melCX = mel.x + mel.w / 2;
    const mPad = Math.round(mel.w * 0.04);

    const rowH = Math.min(Math.round(mel.h * 0.95 / count), Math.round(H * 0.13 * melScaleH));
    const totalH = rowH * count;
    const startY = mel.y + Math.round((mel.h - totalH) / 2);
    const flagW = Math.round(W * 0.065 * melScaleW);
    const flagH = Math.round(flagW * 0.7);

  terminados.forEach((p, i) => {
    const rowY = startY + i * rowH;

    // ── WC26: TV scoreboard bar ──
    if (wc26Active()) {
      drawWC26Bar(mel.x + mPad, rowY, mel.w - mPad*2, rowH, melCX, p);
    } else {
      // Fondo alternado
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(mel.x + mPad, rowY, mel.w - mPad*2, rowH);
      }
      // Línea separadora
      if (i > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(mel.x + mPad + Math.round(mel.w*0.05), rowY, mel.w - mPad*2 - Math.round(mel.w*0.1), 1);
      }
    }

    const midY = rowY + Math.round(rowH * 0.35);

    // Equipo local (izq)
    const localX = mel.x + mPad + Math.round(mel.w * 0.1);
    drawFlagRect(ctx, p.local, localX, midY - Math.round(flagH/2), flagW, flagH);
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.03 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const localName = (typeof traducirPais === 'function' ? traducirPais(p.local) : p.local).toUpperCase();
    ctx.fillText(localName, localX + flagW + Math.round(mel.w*0.015), midY);
    ctx.restore();

    // Score centrado (GRANDE Y DESTACADO)
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.050 * melScaleW)) : `700 ${Math.round(W*0.055 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = wc26Active() ? '#FFFFFF' : '#a6ce39';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${p.golesLocal} - ${p.golesVisitante}`, melCX, midY);
    ctx.restore();

    // "FINAL" / "EN VIVO" badge
    ctx.save();
    ctx.font = `700 ${Math.round(W*0.016 * melScaleW)}px 'Economica',sans-serif`;
    if (p.estado === 'IN_PLAY') {
      ctx.fillStyle = wc26Active() ? WC26C.lime : '#ff6b6b';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('● EN VIVO', melCX, midY + Math.round(rowH*0.15));
    } else {
      ctx.fillStyle = wc26Active() ? WC26C.turquoise + '99' : 'rgba(166,206,57,0.5)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('FINAL', melCX, midY + Math.round(rowH*0.15));
    }
    ctx.restore();

    // Equipo visitante (der)
    const visX = mel.x + mel.w - mPad - Math.round(mel.w * 0.1) - flagW;
    drawFlagRect(ctx, p.visitante, visX, midY - Math.round(flagH/2), flagW, flagH);
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.03 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const visName = (typeof traducirPais === 'function' ? traducirPais(p.visitante) : p.visitante).toUpperCase();
    ctx.fillText(visName, visX - Math.round(mel.w*0.015), midY);
    ctx.restore();

    // Eventos / Goleadores — Respetar toggle
    const hasEventos = S.showFields.eventos && p.eventos && p.eventos.length > 0;
    const hasGoleadores = S.showFields.goleadores && p.goleadores && p.goleadores.length > 0;
    if (hasEventos || hasGoleadores) {
      const infoY2 = midY + Math.round(rowH * 0.35);
      ctx.save();
      ctx.font = `400 ${Math.round(W*0.018 * melScaleW)}px 'Economica',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      let scorers = '';
      if (hasEventos) {
        const goles = p.eventos.filter(ev => ev.tipo === 'goal' || ev.tipo === 'Goal');
        scorers = goles.slice(0, 4).map(g => {
          const min = g.minuto ? `${g.minuto}'` : '';
          const nom = g.jugador ? g.jugador.split(' ').pop() : '';
          return `${nom} ${min}`;
        }).join('  •  ');
      } else if (hasGoleadores) {
        scorers = p.goleadores.slice(0, 4).join('  •  ');
      }
      if (scorers) ctx.fillText(scorers, melCX, infoY2);
      ctx.restore();
    }

    // HT score (entretiempo) si está disponible
    if (S.showFields.htScore && p.golesHTLocal !== null && p.golesHTLocal !== undefined) {
      const htY = midY + Math.round(rowH * 0.35);
      ctx.save();
      ctx.font = `400 ${Math.round(W*0.015 * melScaleW)}px 'Economica',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(`HT: ${p.golesHTLocal}-${p.golesHTVisitante}`, melCX, htY);
      ctx.restore();
    }

    // Estado EN VIVO si está en juego
    if (S.showFields.estado && p.estado === 'IN_PLAY') {
      const vivoY = midY - Math.round(rowH * 0.25);
      ctx.save();
      ctx.font = `700 ${Math.round(W*0.014 * melScaleW)}px 'Economica',sans-serif`;
      ctx.fillStyle = '#ff6b6b';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('● EN VIVO', melCX, vivoY);
      ctx.restore();
    }

    // Grupo / estadio (debajo si hay espacio)
    const extras = [];
    if (S.showFields.grupo && p.grupo) extras.push(String(p.grupo).replace(/GROUP_/i, 'Grupo ').replace(/Group /i, 'Grupo '));
    if (S.showFields.estadio && p.estadio && p.estadio !== 'TBD' && p.estadio !== '') extras.push(p.estadio);
    if (S.showFields.ciudad && p.ciudad) extras.push(p.ciudad);
    if (extras.length && (!p.eventos || p.eventos.length === 0)) {
      const infoY3 = midY + Math.round(rowH * 0.3);
      ctx.save();
      ctx.font = `400 ${Math.round(W*0.018 * melScaleW)}px 'Economica',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(extras.join(' • '), melCX, infoY3);
      ctx.restore();
    }
  });
  } // fin bloque matches

  // ── Logo principal MM abajo (arrastrable vía ELS.logo) ──
  if (S.logoImg) {
    ctx.save();
    ctx.globalAlpha = S.lOp || 1;
    ctx.drawImage(S.logoImg, ELS.logo.x, ELS.logo.y, ELS.logo.w, ELS.logo.h);
    ctx.restore();
  }
}

// ── PLACA PARTIDO INDIVIDUAL ──
function drawMundialPartidoIndividual(W, H, p) {
  if (!p) return;
  const hasScore = p.golesLocal !== null && p.golesLocal !== undefined;

  // Asegurar posiciones de elementos arrastrables
  if(ELS.mlogo.x===null) ensurePos('mlogo');
  if(ELS.logo.x===null) ensurePos('logo');
  ensurePos('header');
  ensurePos('matches');

  // ── Logo Mundial (arrastrable vía ELS.mlogo) ──
  if (S.mundialLogoImg && S.mundialLogoImg !== 'error') {
    ctx.drawImage(S.mundialLogoImg, ELS.mlogo.x, ELS.mlogo.y, ELS.mlogo.w, ELS.mlogo.h);
  }

  // ── Header (arrastrable): Badge superior + MUNDIAL 2026 ──
  const hdr = ELS.header;
  const hdrDef = defaultPos('header');
  const hdrScaleH = hdr.h / hdrDef.h;
  const hdrCX = hdr.x + hdr.w / 2;

  const badgeY = hdr.y + Math.round(hdr.h * 0.25);
  if (p.grupo) {
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.024 * hdrScaleH)) : `700 ${Math.round(W*0.024 * hdrScaleH)}px 'Economica',sans-serif`;
    const groupTxt = (p.grupo || '').replace(/GROUP_/i, 'Grupo ').replace(/Group /i, 'Grupo ').toUpperCase();
    const grpCol = '#a6ce39';
    ctx.fillStyle = grpCol;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(groupTxt).width + Math.round(hdr.w*0.04);
    const th = Math.round(hdr.h*0.32);
    ctx.fillStyle = 'rgba(166,206,57,0.12)';
    roundRect(ctx, hdrCX - tw/2, badgeY - th/2, tw, th, th/2);
    ctx.fill();
    ctx.fillStyle = grpCol;
    ctx.fillText(groupTxt, hdrCX, badgeY);
    ctx.restore();
  }
  const subBadgeY = badgeY + Math.round(hdr.h * 0.35);
  ctx.save();
  ctx.font = wc26Active() ? wc26Font('400', Math.round(W*0.02 * hdrScaleH)) : `400 ${Math.round(W*0.02 * hdrScaleH)}px 'Economica',sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('COPA MUNDIAL DE LA FIFA 2026', hdrCX, subBadgeY);
  ctx.restore();

  // ── WC26: multicolor accent line under subtitle ──
  if (wc26Active()) {
    const accW = Math.round(hdr.w * 0.25);
    const accY = subBadgeY + Math.round(hdr.h * 0.18);
    const segW = Math.round(accW / 4);
    const lx0 = hdrCX - accW/2;
    [WC26C.coral, WC26C.turquoise, WC26C.purple, WC26C.lime].forEach((c,ci) => {
      ctx.fillStyle = c;
      ctx.fillRect(lx0 + ci * segW, accY, segW + 1, Math.round(hdr.h*0.03));
    });
  }

  // ── Matches block (arrastrable): Contenido del partido ──
  const mel = ELS.matches;
  const melDef = defaultPos('matches');
  const melScaleW = mel.w / melDef.w;
  const melScaleH = mel.h / melDef.h;
  const melCX = mel.x + mel.w / 2;
  const mPad = Math.round(mel.w * 0.06);

  const centerY = mel.y + Math.round(mel.h * (wc26Active() ? 0.50 : 0.30));
  const flagW = Math.round(mel.w * 0.16 * melScaleW);
  const flagH = Math.round(flagW * 0.7);
  const nameSz = Math.round(mel.w * 0.055 * melScaleW);

  // ── WC26: TV scoreboard frame behind match ──
  if (wc26Active()) {
    const tvPad = Math.round(mel.w * 0.03);
    const tvX = mel.x + tvPad;
    const tvW = mel.w - tvPad * 2;
    const tvY = centerY - Math.round(mel.h * 0.40);
    const tvH = Math.round(mel.h * 0.72);
    const r = Math.round(tvH * 0.10);
    // Vivid frame gradient
    ctx.save();
    const tvGrad = ctx.createLinearGradient(tvX, tvY, tvX + tvW, tvY);
    tvGrad.addColorStop(0, WC26C.barLocal);
    tvGrad.addColorStop(0.35, WC26C.barLocal);
    tvGrad.addColorStop(0.42, WC26C.barScore);
    tvGrad.addColorStop(0.58, WC26C.barScore);
    tvGrad.addColorStop(0.65, WC26C.barVisitor);
    tvGrad.addColorStop(1, WC26C.barVisitor);
    ctx.fillStyle = tvGrad;
    roundRect(ctx, tvX, tvY, tvW, tvH, r);
    ctx.fill();
    ctx.restore();
    // Black interior
    const tvInset = Math.max(4, Math.round(tvH * 0.05));
    ctx.save();
    ctx.fillStyle = WC26C.barBlack;
    roundRect(ctx, tvX + tvInset, tvY + tvInset, tvW - tvInset * 2, tvH - tvInset * 2, Math.max(3, r - tvInset));
    ctx.fill();
    ctx.restore();
  }

  // ── Equipo Local (izquierda) ──
  const localCx = mel.x + mPad + Math.round(mel.w * 0.22);
  drawFlagRect(ctx, p.local, localCx - flagW/2, centerY - Math.round(mel.h*(wc26Active()?0.30:0.16)), flagW, flagH);
  ctx.save();
  ctx.font = wc26Active() ? wc26Font('700', nameSz) : `700 ${nameSz}px 'BebasNeue',sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const localName = (typeof traducirPais === 'function' ? traducirPais(p.local) : p.local).toUpperCase();
  ctx.fillText(localName, localCx, centerY + Math.round(mel.h*(wc26Active()?0.05:0.04)));
  ctx.restore();

  // ── Score / Hora (centro) ──
  if (hasScore) {
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(mel.w*0.12 * melScaleW)) : `700 ${Math.round(mel.w*0.12 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = wc26Active() ? '#FFFFFF' : '#a6ce39';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${p.golesLocal} - ${p.golesVisitante}`, melCX, centerY - Math.round(mel.h*(wc26Active()?0.12:0.03)));
    ctx.restore();
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.022 * melScaleH)) : `700 ${Math.round(W*0.022 * melScaleH)}px 'Economica',sans-serif`;
    const finalTxt = p.estado === 'IN_PLAY' ? '● EN VIVO' : 'FINAL';
    let finalColor;
    if (wc26Active()) {
      finalColor = p.estado === 'IN_PLAY' ? WC26C.lime : WC26C.turquoise + '99';
    } else {
      finalColor = p.estado === 'IN_PLAY' ? '#ff6b6b' : 'rgba(166,206,57,0.6)';
    }
    ctx.fillStyle = finalColor;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(finalTxt, melCX, centerY + Math.round(mel.h*(wc26Active()?0.14:0.06)));
    ctx.restore();
    if (p.golesHTLocal !== null && p.golesHTLocal !== undefined) {
      ctx.save();
      ctx.font = wc26Active() ? wc26Font('400', Math.round(W*0.02 * melScaleH)) : `400 ${Math.round(W*0.02 * melScaleH)}px 'Economica',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      // WC26: Entretiempo justo debajo del score, arriba de los nombres
      ctx.fillText(`Entretiempo: ${p.golesHTLocal}-${p.golesHTVisitante}`, melCX, centerY + Math.round(mel.h*(wc26Active()?-0.02:0.10)));
      ctx.restore();
    }
  } else {
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(mel.w*0.07 * melScaleW)) : `700 ${Math.round(mel.w*0.07 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.hora || '--:--', melCX, centerY - Math.round(mel.h*(wc26Active()?0.12:0.06)));
    ctx.restore();
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('400', Math.round(W*0.028 * melScaleH)) : `400 ${Math.round(W*0.028 * melScaleH)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('VS.', melCX, centerY + Math.round(mel.h*(wc26Active()?0.06:0.02)));
    ctx.restore();
  }

  // ── Equipo Visitante (derecha) ──
  const visCx = mel.x + mel.w - mPad - Math.round(mel.w * 0.22);
  drawFlagRect(ctx, p.visitante, visCx - flagW/2, centerY - Math.round(mel.h*(wc26Active()?0.30:0.16)), flagW, flagH);
  ctx.save();
  ctx.font = wc26Active() ? wc26Font('700', nameSz) : `700 ${nameSz}px 'BebasNeue',sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const visName = (typeof traducirPais === 'function' ? traducirPais(p.visitante) : p.visitante).toUpperCase();
  ctx.fillText(visName, visCx, centerY + Math.round(mel.h*(wc26Active()?0.05:0.04)));
  ctx.restore();

  // ── Info: Estadio • Ciudad • Hora ──
  const infoY = centerY + Math.round(mel.h * (wc26Active() ? 0.32 : 0.18));
  ctx.save();
  ctx.font = `400 ${Math.round(W*0.024 * melScaleH)}px 'Economica',sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const infoParts = [];
  if (S.showFields.estadio && p.estadio && p.estadio !== 'TBD' && p.estadio !== '') infoParts.push(p.estadio);
  if (S.showFields.ciudad && p.ciudad) infoParts.push(p.ciudad);
  if (infoParts.length) ctx.fillText(infoParts.join(' • '), melCX, infoY);
  ctx.restore();

  // ── Knowledge Graph: Bio de estadio/ciudad ──
  if (S.showFields.estadioBio && p.estadioKG?.description) {
    const kgY = infoY + Math.round(mel.h * (wc26Active() ? 0.06 : 0.06));
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.016 * melScaleH)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(p.estadioKG.description.substring(0, 80), melCX, kgY);
    ctx.restore();
  }
  if (S.showFields.ciudadBio && p.ciudadKG?.description && !(S.showFields.estadioBio && p.estadioKG?.description)) {
    const kgY = infoY + Math.round(mel.h * (wc26Active() ? 0.06 : 0.06));
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.016 * melScaleH)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(p.ciudadKG.description.substring(0, 80), melCX, kgY);
    ctx.restore();
  }

  // ── Fecha y hora (si no hay score) ──
  if (!hasScore && S.mundialData.fecha) {
    const fechaLineY = infoY + Math.round(mel.h*(wc26Active()?0.08:0.05));
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.022 * melScaleH)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';

    // Usar la fecha REAL en Argentina (no la fecha de placa) para madugada
    let fechaMostrar = S.mundialData.fecha;
    if (p.madrugada && p.horaUTC) {
      const realAR = new Date(new Date(p.horaUTC).getTime() - 3 * 60 * 60 * 1000);
      fechaMostrar = realAR.toISOString().split('T')[0];
    }

    const [y,m,d] = fechaMostrar.split('-');
    const meses = ['','ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    ctx.fillText(`${parseInt(d)} ${meses[parseInt(m)]||''} ${y} • ${p.hora || ''}`, melCX, fechaLineY);
    ctx.restore();

    // ── Indicador de madrugada ──
    if (p.madrugada) {
      const madY = fechaLineY + Math.round(mel.h*0.05);
      ctx.save();
      ctx.font = `400 ${Math.round(W*0.018 * melScaleH)}px 'Economica',sans-serif`;
      ctx.fillStyle = '#f0c040';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('🌙 Madrugada', melCX, madY);
      ctx.restore();
    }
  }

  // ── Goleadores en partido individual ──
  // Respetar toggle de goleadores (pueden ser datos ficticios pre-torneo)
  const hasGolesInd = S.showFields.goleadores && (
    (p.goleadores && p.goleadores.length > 0) || 
    (p.eventos && p.eventos.filter(e => e.tipo === 'goal' || e.tipo === 'Goal').length > 0)
  );
  if (hasGolesInd && hasScore) {
    const golesY = infoY + Math.round(mel.h * (wc26Active() ? 0.16 : 0.12));
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.02 * melScaleH)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    let scorerTxt = '';
    if (p.eventos && p.eventos.length > 0) {
      const goles = p.eventos.filter(e => e.tipo === 'goal' || e.tipo === 'Goal');
      scorerTxt = goles.slice(0, 5).map(g => {
        const min = g.minuto ? `${g.minuto}'` : '';
        const nom = g.jugador ? g.jugador.split(' ').pop() : '';
        return `${nom} ${min}`;
      }).join('  •  ');
    } else if (p.goleadores && p.goleadores.length > 0) {
      scorerTxt = p.goleadores.slice(0, 5).join('  •  ');
    }
    if (scorerTxt) ctx.fillText(`⚽ ${scorerTxt}`, melCX, golesY);
    ctx.restore();
  }

  // ── Árbitro ──
  if (S.showFields.arbitro && p.arbitro) {
    const refY = hasScore ? infoY + Math.round(mel.h*(hasGolesInd ? (wc26Active()?0.10:0.18) : (wc26Active()?0.08:0.06))) : infoY + Math.round(mel.h*0.12);
    ctx.save();
    ctx.font = `400 ${Math.round(W*0.02 * melScaleH)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`🏁 ${p.arbitro}`, melCX, refY);
    ctx.restore();
  }

  // ── Etapa / Jornada ──
  const stageParts = [];
  if (p.etapa) {
    const stageMap = {
      'GROUP_STAGE': 'Fase de grupos',
      'ROUND_OF_16': 'Octavos de final',
      'QUARTER_FINALS': 'Cuartos de final',
      'SEMI_FINALS': 'Semifinal',
      'THIRD_PLACE_PLAY_OFF': 'Tercer puesto',
      'FINAL': 'Final',
      'ROUND_OF_32': 'Dieciseisavos de final',
      'ROUND_OF_64': 'Treintaidosavos de final'
    };
    stageParts.push(stageMap[p.etapa] || p.etapa.replace(/_/g, ' '));
  }
  if (p.jornada) stageParts.push(`Fecha ${p.jornada}`);
  if (stageParts.length) {
    let stageOffset = 0.10;
    if (hasScore) {
      if (p.arbitro) stageOffset += 0.06;
      if (hasGolesInd) stageOffset += 0.06;
      if (p.golesHTLocal !== null && p.golesHTLocal !== undefined) stageOffset += 0.04;
    } else {
      stageOffset = 0.16;
    }
    if (wc26Active() && hasScore) stageOffset = Math.max(stageOffset, 0.22);
    const stageY = hasScore ? infoY + Math.round(mel.h*stageOffset) : infoY + Math.round(mel.h*(wc26Active()?0.16:0.16));
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.022 * melScaleH)) : `700 ${Math.round(W*0.022 * melScaleH)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(166,206,57,0.6)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(stageParts.join(' • '), melCX, stageY);
    ctx.restore();
  }

  // ── Logo MM abajo (arrastrable vía ELS.logo) ──
  if (S.logoImg) {
    ctx.save();
    ctx.globalAlpha = S.lOp || 1;
    ctx.drawImage(S.logoImg, ELS.logo.x, ELS.logo.y, ELS.logo.w, ELS.logo.h);
    ctx.restore();
  }
}

// ════════════════════════════════════════════════════════════════
// PLACA POSICIONES / GRUPOS
// ════════════════════════════════════════════════════════════════

function drawMundialPosiciones(W, H) {
  const gruposRaw = S.mundialData?.grupos;
  if (!gruposRaw || (typeof gruposRaw === 'object' && !Array.isArray(gruposRaw) && Object.keys(gruposRaw).length === 0) || (Array.isArray(gruposRaw) && gruposRaw.length === 0)) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${Math.round(W*0.025)}px 'BebasNeue',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Sin datos de posiciones', W/2, H/2);
    return;
  }

  // Normalizar grupos: el worker devuelve {A:[...], B:[...]} — convertir a array
  const todosGrupos = Array.isArray(gruposRaw)
    ? gruposRaw
    : Object.entries(gruposRaw).map(([letra, equipos]) => ({
        name: `GRUPO ${letra}`,
        letra,
        teams: equipos
      }));

  // Determinar modo: grupo único o multi-grupo
  const selGrupo = S.grupoPosiciones || 'all';
  const modoSingle = selGrupo !== 'all';
  let grupos;

  if (modoSingle) {
    // Filtrar al grupo seleccionado
    const found = todosGrupos.find(g => (g.letra || (g.name||'').replace('GRUPO ','')) === selGrupo);
    grupos = found ? [found] : todosGrupos.slice(0, 1);
    // Mostrar/ocultar nav
    const nav = document.getElementById('posicionesNav');
    if (nav) nav.style.display = 'none';
  } else {
    // Multi-grupo: 6 por página (3 col x 2 filas)
    const perPage = 6;
    const totalPages = Math.ceil(todosGrupos.length / perPage);
    const page = Math.min(S.posicionesPage || 0, totalPages - 1);
    S.posicionesPage = page;
    grupos = todosGrupos.slice(page * perPage, page * perPage + perPage);
    // Mostrar/ocultar nav
    const nav = document.getElementById('posicionesNav');
    if (nav) nav.style.display = 'flex';
    const lbl = document.getElementById('posicionesPageLabel');
    if (lbl) lbl.textContent = `${page + 1}/${totalPages}`;
  }

  // Asegurar posiciones
  if(ELS.mlogo.x===null) ensurePos('mlogo');
  if(ELS.logo.x===null) ensurePos('logo');
  ensurePos('header');
  ensurePos('matches');

  // Logo Mundial
  if (S.mundialLogoImg && S.mundialLogoImg !== 'error') {
    ctx.drawImage(S.mundialLogoImg, ELS.mlogo.x, ELS.mlogo.y, ELS.mlogo.w, ELS.mlogo.h);
  }

  // ── Header (arrastrable) ──
  const hdr = ELS.header;
  const hdrDef = defaultPos('header');
  const hdrScaleH = hdr.h / hdrDef.h;
  const hdrCX = hdr.x + hdr.w / 2;

  const titleY = hdr.y + Math.round(hdr.h * 0.15);
  ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.055 * hdrScaleH)) : `700 ${Math.round(W*0.055 * hdrScaleH)}px 'BebasNeue',sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(S.title || 'POSICIONES', hdrCX, titleY);

  // Línea decorativa
  const lineW = Math.round(hdr.w * 0.27);
  const lineYPos = titleY + Math.round(hdr.h * 0.55);
  if (wc26Active()) {
    const segW = Math.round(lineW / 4);
    const lx0 = hdrCX - lineW/2;
    [WC26C.coral, WC26C.turquoise, WC26C.purple, WC26C.lime].forEach((c,ci) => {
      ctx.fillStyle = c;
      ctx.fillRect(lx0 + ci * segW, lineYPos, segW + 1, Math.round(hdr.h*0.04));
    });
  } else {
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(hdrCX - lineW/2, lineYPos, lineW, Math.round(hdr.h*0.04));
  }

  // ── Matches block (arrastrable) ──
  const mel = ELS.matches;
  const melDef = defaultPos('matches');
  const melScaleW = mel.w / melDef.w;
  const melScaleH = mel.h / melDef.h;

  // Layout según modo
  const cols = modoSingle ? 1 : 3;
  const rows = modoSingle ? 1 : 2;
  const gridPadX = mel.x + Math.round(mel.w * 0.04);
  const gridW = mel.w - Math.round(mel.w * 0.04) * 2;
  const gridH = mel.h - Math.round(mel.h * 0.04) * 2;
  const cellW = (gridW - (cols - 1) * Math.round(mel.w * 0.03)) / cols;
  const cellH = (gridH - (rows - 1) * Math.round(mel.h * 0.02)) / rows;

  grupos.forEach((grupo, gi) => {
    const col = gi % cols;
    const row = Math.floor(gi / cols);
    const gx = gridPadX + col * (cellW + Math.round(mel.w * 0.03));
    const gy = mel.y + Math.round(mel.h * 0.04) + row * (cellH + Math.round(mel.h * 0.02));

    const equipos = grupo.teams || grupo.equipos || [];
    const maxEquipos = Math.min(equipos.length, 6);

    // ── WC26: Marco degradado tipo TV scoreboard ──
    if (wc26Active()) {
      const frameR = Math.round(cellH * (modoSingle ? 0.03 : 0.04));
      const frameInset = Math.max(3, Math.round(cellH * 0.012));

      // Marco exterior con gradiente multicolor
      ctx.save();
      const grpGrad = ctx.createLinearGradient(gx, gy, gx + cellW, gy);
      grpGrad.addColorStop(0, WC26C.barLocal);
      grpGrad.addColorStop(0.35, WC26C.barLocal);
      grpGrad.addColorStop(0.42, WC26C.barScore);
      grpGrad.addColorStop(0.58, WC26C.barScore);
      grpGrad.addColorStop(0.65, WC26C.barVisitor);
      grpGrad.addColorStop(1, WC26C.barVisitor);
      ctx.fillStyle = grpGrad;
      roundRect(ctx, gx, gy, cellW, cellH, frameR);
      ctx.fill();
      ctx.restore();

      // Interior negro
      ctx.save();
      ctx.fillStyle = WC26C.barBlack;
      roundRect(ctx, gx + frameInset, gy + frameInset, cellW - frameInset * 2, cellH - frameInset * 2, Math.max(2, frameR - frameInset));
      ctx.fill();
      ctx.restore();
    } else {
      // Default: fondo oscuro simple
      ctx.save();
      ctx.fillStyle = 'rgba(10, 8, 22, 0.92)';
      roundRect(ctx, gx, gy, cellW, cellH, 10);
      ctx.fill();
      ctx.restore();
    }

    // ── Nombre del grupo (dentro del marco, arriba) ──
    const groupName = grupo.name || grupo.grupo || `Grupo ${gi + 1}`;
    const grpNameY = gy + Math.round(cellH * 0.04);
    const grpFontSize = modoSingle ? Math.round(W * 0.032 * melScaleW) : Math.round(W * 0.016 * melScaleW);
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', grpFontSize) : `700 ${grpFontSize}px 'Economica',sans-serif`;
    ctx.fillStyle = wc26Active() ? WC26C.turquoise : '#a6ce39';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(groupName.toUpperCase(), gx + Math.round(cellW * 0.05), grpNameY);
    ctx.restore();

    // ── Tabla de equipos ──
    const innerPadX = Math.round(cellW * 0.05);
    const innerPadTop = Math.round(cellH * 0.14); // espacio bajo nombre del grupo
    const innerPadBot = Math.round(cellH * 0.04);
    const tableAreaH = cellH - innerPadTop - innerPadBot;
    const rowH = Math.round(tableAreaH / (maxEquipos + 1)); // +1 para header
    const tableY = gy + innerPadTop;

    // Columnas
    const colPos = modoSingle
      ? { equipo: innerPadX, pj: cellW * 0.50, dg: cellW * 0.70, pts: cellW * 0.90 }
      : { equipo: innerPadX, pj: cellW * 0.55, pts: cellW * 0.85 };

    // Header de columnas
    const hdrFS = modoSingle ? Math.round(W * 0.016 * melScaleW) : Math.round(W * 0.011 * melScaleW);
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('400', hdrFS) : `400 ${hdrFS}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('EQUIPO', gx + colPos.equipo, tableY + Math.round(rowH * 0.5));
    ctx.textAlign = 'center';
    ctx.fillText('PJ', gx + colPos.pj, tableY + Math.round(rowH * 0.5));
    if (modoSingle) ctx.fillText('DG', gx + colPos.dg, tableY + Math.round(rowH * 0.5));
    ctx.fillText('PTS', gx + colPos.pts, tableY + Math.round(rowH * 0.5));
    ctx.restore();

    // Línea separadora bajo header
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(gx + innerPadX, tableY + rowH - 1, cellW - innerPadX * 2, 1);

    // Filas de equipos
    equipos.slice(0, maxEquipos).forEach((eq, ei) => {
      const ey = tableY + (ei + 1) * rowH + Math.round(rowH * 0.5);
      const rowTop = tableY + (ei + 1) * rowH;

      // Fila alternada con fondo sutil
      if (ei % 2 === 0) {
        ctx.save();
        ctx.fillStyle = wc26Active() ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)';
        ctx.fillRect(gx + innerPadX * 0.5, rowTop, cellW - innerPadX, rowH);
        ctx.restore();
      }

      // Bandera
      const flagW2 = Math.round(W * (modoSingle ? 0.038 : 0.018) * melScaleW);
      const flagH2 = Math.round(flagW2 * 0.7);
      const nameE = eq.name || eq.equipo || '';

      drawFlagRect(ctx, nameE, gx + colPos.equipo, ey - Math.round(flagH2 / 2), flagW2, flagH2);

      // Nombre del equipo
      const nameFS = modoSingle ? Math.round(W * 0.028 * melScaleW) : Math.round(W * 0.014 * melScaleW);
      ctx.save();
      ctx.font = wc26Active() ? wc26Font('700', nameFS) : `400 ${nameFS}px 'BebasNeue',sans-serif`;
      ctx.fillStyle = ei < 2 ? '#FFFFFF' : 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const translatedName = (typeof traducirPais === 'function' ? traducirPais(nameE) : nameE).toUpperCase();
      const maxChars = modoSingle ? 18 : 10;
      ctx.fillText(translatedName.substring(0, maxChars), gx + colPos.equipo + flagW2 + Math.round(cellW * 0.02), ey);
      ctx.restore();

      // PJ
      const numFS = modoSingle ? Math.round(W * 0.022 * melScaleW) : Math.round(W * 0.013 * melScaleW);
      ctx.save();
      ctx.font = wc26Active() ? wc26Font('700', numFS) : `400 ${numFS}px 'BebasNeue',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(eq.played ?? eq.jugados ?? eq.pj ?? '-', gx + colPos.pj, ey);

      // DG (solo modo single)
      if (modoSingle) {
        const dg = eq.diferenciaGoles ?? eq.goalDifference ?? null;
        const dgVal = dg !== null ? (dg > 0 ? `+${dg}` : String(dg)) : '-';
        ctx.fillStyle = dg > 0 ? 'rgba(166,206,57,0.7)' : (dg < 0 ? 'rgba(255,100,100,0.6)' : 'rgba(255,255,255,0.5)');
        ctx.fillText(dgVal, gx + colPos.dg, ey);
      }

      // PTS
      const ptsFS = modoSingle ? Math.round(W * 0.028 * melScaleW) : Math.round(W * 0.015 * melScaleW);
      ctx.font = wc26Active() ? wc26Font('700', ptsFS) : `700 ${ptsFS}px 'BebasNeue',sans-serif`;
      ctx.fillStyle = wc26Active() ? WC26C.lime : '#a6ce39';
      ctx.fillText(eq.points ?? eq.puntos ?? eq.pts ?? '-', gx + colPos.pts, ey);
      ctx.restore();

      // Indicador de clasificado (barra lateral verde/turquesa)
      if (eq.clasificado || ei < 2) {
        ctx.fillStyle = wc26Active() ? WC26C.turquoise : '#a6ce39';
        ctx.fillRect(gx + Math.round(cellW * 0.015), rowTop + Math.round(rowH * 0.2), 3, Math.round(rowH * 0.6));
      }
    });
  });

  // Logo MM
  if (S.logoImg) {
    ctx.save();
    ctx.globalAlpha = S.lOp || 1;
    ctx.drawImage(S.logoImg, ELS.logo.x, ELS.logo.y, ELS.logo.w, ELS.logo.h);
    ctx.restore();
  }
}

// ════════════════════════════════════════════════════════════════
// PLACA GOLEADORES
// ════════════════════════════════════════════════════════════════

function drawMundialGoleadores(W, H) {
  const goleadores = S.mundialData?.goleadores;
  if (!goleadores || goleadores.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${Math.round(W*0.025)}px 'BebasNeue',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Sin datos de goleadores', W/2, H/2);
    return;
  }

  if(ELS.mlogo.x===null) ensurePos('mlogo');
  if(ELS.logo.x===null) ensurePos('logo');
  ensurePos('header');
  ensurePos('matches');

  // Logo Mundial
  if (S.mundialLogoImg && S.mundialLogoImg !== 'error') {
    ctx.drawImage(S.mundialLogoImg, ELS.mlogo.x, ELS.mlogo.y, ELS.mlogo.w, ELS.mlogo.h);
  }

  // ── Header (arrastrable) ──
  const hdr = ELS.header;
  const hdrDef = defaultPos('header');
  const hdrScaleH = hdr.h / hdrDef.h;
  const hdrCX = hdr.x + hdr.w / 2;

  const titleY = hdr.y + Math.round(hdr.h * 0.10);
  ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.055 * hdrScaleH)) : `700 ${Math.round(W*0.055 * hdrScaleH)}px 'BebasNeue',sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(S.title || 'GOLEADORES', hdrCX, titleY);

  // Línea decorativa
  const lineW = Math.round(hdr.w * 0.27);
  const lineYGol = titleY + Math.round(hdr.h * 0.45);
  if (wc26Active()) {
    const segW = Math.round(lineW / 4);
    const lx0 = hdrCX - lineW/2;
    [WC26C.coral, WC26C.turquoise, WC26C.purple, WC26C.lime].forEach((c,ci) => {
      ctx.fillStyle = c;
      ctx.fillRect(lx0 + ci * segW, lineYGol, segW + 1, Math.round(hdr.h*0.04));
    });
  } else {
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(hdrCX - lineW/2, lineYGol, lineW, Math.round(hdr.h*0.04));
  }

  // Subtítulo
  const subY = titleY + Math.round(hdr.h * 0.55);
  ctx.font = wc26Active() ? wc26Font('400', Math.round(W*0.022 * hdrScaleH)) : `400 ${Math.round(W*0.022 * hdrScaleH)}px 'Economica',sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('COPA MUNDIAL DE LA FIFA 2026', hdrCX, subY);

  // ── Matches block: Lista de goleadores (arrastrable) ──
  const mel = ELS.matches;
  const melDef = defaultPos('matches');
  const melScaleW = mel.w / melDef.w;
  const melScaleH = mel.h / melDef.h;
  const melCX = mel.x + mel.w / 2;

  const top10 = goleadores.slice(0, 10);
  const rowH = Math.min(Math.round(mel.h * 0.90 / top10.length), Math.round(H * 0.055 * melScaleH));
  const totalH = rowH * top10.length;
  const startY = mel.y + Math.round((mel.h - totalH) / 2);
  const pad = Math.round(mel.w * 0.04);
  const innerPad = Math.round(mel.w * 0.02);

  // ── Fondo oscuro + marco TV scoreboard ──
  const blockX = mel.x + pad;
  const blockY = startY - Math.round(rowH * 0.3);
  const blockW = mel.w - pad * 2;
  const blockH = totalH + Math.round(rowH * 0.6);

  if (wc26Active()) {
    // Marco gradiente multicolor tipo TV
    const frameR = Math.round(blockH * 0.025);
    const frameInset = Math.max(3, Math.round(blockH * 0.008));
    ctx.save();
    const grad = ctx.createLinearGradient(blockX, blockY, blockX + blockW, blockY);
    grad.addColorStop(0, WC26C.barLocal);
    grad.addColorStop(0.35, WC26C.barLocal);
    grad.addColorStop(0.42, WC26C.barScore);
    grad.addColorStop(0.58, WC26C.barScore);
    grad.addColorStop(0.65, WC26C.barVisitor);
    grad.addColorStop(1, WC26C.barVisitor);
    ctx.fillStyle = grad;
    roundRect(ctx, blockX, blockY, blockW, blockH, frameR);
    ctx.fill();
    ctx.restore();
    // Interior negro
    ctx.save();
    ctx.fillStyle = WC26C.barBlack;
    roundRect(ctx, blockX + frameInset, blockY + frameInset, blockW - frameInset * 2, blockH - frameInset * 2, Math.max(2, frameR - frameInset));
    ctx.fill();
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 8, 22, 0.92)';
    roundRect(ctx, blockX, blockY, blockW, blockH, 10);
    ctx.fill();
    ctx.restore();
  }

  // Abreviaturas de país (3 letras)
  const countryAbbr = {
    'ar':'ARG','br':'BRA','fr':'FRA','de':'GER','es':'ESP','gb-eng':'ENG',
    'pt':'POR','nl':'NED','be':'BEL','hr':'CRO','uy':'URU','mx':'MEX',
    'co':'COL','cl':'CHI','pe':'PER','ec':'ECU','py':'PAR','ve':'VEN',
    'ch':'SUI','at':'AUT','dk':'DEN','se':'SWE','no':'NOR','jp':'JPN',
    'kr':'KOR','au':'AUS','ma':'MAR','eg':'EGY','ng':'NGA','sn':'SEN',
    'gh':'GHA','cm':'CMR','dz':'ALG','sa':'KSA','ir':'IRN','iq':'IRQ',
    'ca':'CAN','us':'USA','tn':'TUN','cr':'CRC','pa':'PAN','hn':'HON',
    'jm':'JAM','rs':'SRB','pl':'POL','cz':'CZE','sk':'SVK','ua':'UKR',
    'ru':'RUS','tr':'TUR','gb-wls':'WAL','gb-sct':'SCO','ci':'CIV',
    'za':'RSA','al':'ALB','mk':'MKD','ps':'PLE','jo':'JOR','qa':'QAT',
    'ae':'UAE','cn':'CHN','in':'IND','id':'IDN','th':'THA','nz':'NZL',
    'is':'ISL','fi':'FIN','hu':'HUN','ro':'ROU','ba':'BIH','ge':'GEO',
    'si':'SVN','xk':'KOS','sv':'SLV','cw':'CUW','sr':'SUR','ht':'HAI',
    'cu':'CUB','bo':'BOL','tt':'TRI','cd':'COD','cv':'CPV','gr':'GRE',
    'il':'ISR','gb-nir':'NIR',
  };

  top10.forEach((g, i) => {
    const rowY = startY + i * rowH;
    const midY = rowY + Math.round(rowH * 0.5);

    // Fila alternada con fondo sutil
    if (i % 2 === 0) {
      ctx.save();
      ctx.fillStyle = wc26Active() ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(blockX + innerPad, rowY, blockW - innerPad * 2, rowH);
      ctx.restore();
    }

    // Número de puesto
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.026 * melScaleW)) : `700 ${Math.round(W*0.028 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = wc26Active() ? (i < 3 ? WC26C.turquoise : '#FFFFFF') : (i < 3 ? '#a6ce39' : 'rgba(255,255,255,0.4)');
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}.`, blockX + innerPad + Math.round(blockW*0.01), midY);
    ctx.restore();

    // Bandera del equipo
    const teamName = g.equipo || g.team || '';
    const flagW2 = Math.round(W * 0.035 * melScaleW);
    const flagH2 = Math.round(flagW2 * 0.7);
    const flagX = blockX + innerPad + Math.round(blockW * 0.06);
    drawFlagRect(ctx, teamName, flagX, midY - Math.round(flagH2/2), flagW2, flagH2);

    // Abreviatura del país (3 letras)
    const iso = flagIso(teamName);
    const abbr = iso ? (countryAbbr[iso] || iso.toUpperCase()) : '';
    if (abbr) {
      ctx.save();
      ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.016 * melScaleW)) : `700 ${Math.round(W*0.016 * melScaleW)}px 'BebasNeue',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(abbr, flagX + flagW2 + Math.round(blockW*0.008), midY);
      ctx.restore();
    }

    // Nombre del jugador
    const playerName = g.name || g.nombre || g.jugador || '';
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('400', Math.round(W*0.026 * melScaleW)) : `400 ${Math.round(W*0.028 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const nameX = flagX + flagW2 + Math.round(blockW * (abbr ? 0.06 : 0.015));
    ctx.fillText(playerName.toUpperCase(), nameX, midY);
    ctx.restore();

    // Cantidad de goles (a la derecha)
    const goals = g.goals ?? g.goles ?? 0;
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.035 * melScaleW)) : `700 ${Math.round(W*0.035 * melScaleW)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = wc26Active() ? WC26C.lime : '#a6ce39';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`${goals}`, blockX + blockW - innerPad - Math.round(blockW*0.01), midY);
    ctx.restore();

    // "goles" label
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('400', Math.round(W*0.014 * melScaleW)) : `400 ${Math.round(W*0.015 * melScaleW)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('goles', blockX + blockW - innerPad - Math.round(blockW*0.055), midY);
    ctx.restore();
  });

  // Logo MM
  if (S.logoImg) {
    ctx.save();
    ctx.globalAlpha = S.lOp || 1;
    ctx.drawImage(S.logoImg, ELS.logo.x, ELS.logo.y, ELS.logo.w, ELS.logo.h);
    ctx.restore();
  }
}

// ── BRACKET / ELIMINATORIAS ──
function drawMundialBracket(W, H) {
  const bracket = S.mundialData?.bracket;
  if (!bracket || Object.keys(bracket).length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.025)) : `${Math.round(W*0.025)}px 'BebasNeue',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Bracket no disponible aún', W/2, H/2);
    ctx.textAlign = 'left';
    return;
  }

  // Asegurar posiciones de elementos arrastrables
  if(ELS.mlogo.x===null) ensurePos('mlogo');
  if(ELS.logo.x===null) ensurePos('logo');
  ensurePos('header');
  ensurePos('matches');

  // ── Logo Mundial ──
  if (S.mundialLogoImg && S.mundialLogoImg !== 'error') {
    ctx.drawImage(S.mundialLogoImg, ELS.mlogo.x, ELS.mlogo.y, ELS.mlogo.w, ELS.mlogo.h);
  }

  // ── Bloque Título + Fecha (arrastrable vía ELS.header) ──
  {
    const hdr = ELS.header;
    const hdrDef = defaultPos('header');
    const hdrScaleH = hdr.h / hdrDef.h;
    const hdrCX = hdr.x + hdr.w / 2;

    const titleY = hdr.y + Math.round(hdr.h * 0.15);
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.055 * hdrScaleH)) : `700 ${Math.round(W*0.055 * hdrScaleH)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(S.title || 'ELIMINATORIAS', hdrCX, titleY);

    // Línea decorativa
    const lineW = Math.round(hdr.w * 0.33);
    const lineY = titleY + Math.round(hdr.h * 0.55);
    if (wc26Active()) {
      const segW = Math.round(lineW / 4);
      const lx0 = hdrCX - lineW/2;
      [WC26C.coral, WC26C.turquoise, WC26C.purple, WC26C.lime].forEach((c,ci) => {
        ctx.fillStyle = c;
        ctx.fillRect(lx0 + ci * segW, lineY, segW + 1, Math.round(hdr.h*0.04));
      });
    } else {
      ctx.fillStyle = '#a6ce39';
      ctx.fillRect(hdrCX - lineW/2, lineY, lineW, Math.round(hdr.h*0.04));
    }

    // Fecha
    const fechaY = lineY + Math.round(hdr.h * 0.12);
    ctx.font = `400 ${Math.round(W*0.022)}px 'Economica',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const fechaStr = S.mundialData.fecha || '';
    if (fechaStr) {
      const [y,m,d] = fechaStr.split('-');
      const meses = ['','ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
      ctx.fillText(`${parseInt(d)} ${meses[parseInt(m)]||''} ${y}`, hdrCX, fechaY);
    }
  }

  const mel = ELS.matches;
  const melDef = defaultPos('matches');
  const melCX = mel.x + mel.w / 2;

  // ── Marco TV + fondo ──
  ctx.save();
  if (wc26Active()) {
    const frameR = Math.round(mel.h * 0.015);
    const frameInset = Math.max(3, Math.round(mel.h * 0.005));
    const grad = ctx.createLinearGradient(mel.x, mel.y, mel.x + mel.w, mel.y);
    grad.addColorStop(0, WC26C.barLocal);
    grad.addColorStop(0.35, WC26C.barLocal);
    grad.addColorStop(0.42, WC26C.barScore);
    grad.addColorStop(0.58, WC26C.barScore);
    grad.addColorStop(0.65, WC26C.barVisitor);
    grad.addColorStop(1, WC26C.barVisitor);
    ctx.fillStyle = grad;
    roundRect(ctx, mel.x, mel.y, mel.w, mel.h, frameR);
    ctx.fill();
    ctx.fillStyle = WC26C.barBlack;
    roundRect(ctx, mel.x + frameInset, mel.y + frameInset, mel.w - frameInset * 2, mel.h - frameInset * 2, Math.max(2, frameR - frameInset));
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    roundRect(ctx, mel.x, mel.y, mel.w, mel.h, 12);
    ctx.fill();
  }

  // ── Country abbreviations ──
  const cAbbr = {
    'ar':'ARG','br':'BRA','fr':'FRA','de':'GER','es':'ESP','gb-eng':'ENG',
    'pt':'POR','nl':'NED','be':'BEL','hr':'CRO','uy':'URU','mx':'MEX',
    'co':'COL','cl':'CHI','pe':'PER','ec':'ECU','py':'PAR','ve':'VEN',
    'ch':'SUI','at':'AUT','dk':'DEN','se':'SWE','no':'NOR','jp':'JPN',
    'kr':'KOR','au':'AUS','ma':'MAR','eg':'EGY','ng':'NGA','sn':'SEN',
    'gh':'GHA','cm':'CMR','dz':'ALG','sa':'KSA','ir':'IRN','iq':'IRQ',
    'ca':'CAN','us':'USA','tn':'TUN','cr':'CRC','pa':'PAN','hn':'HON',
    'jm':'JAM','rs':'SRB','pl':'POL','cz':'CZE','sk':'SVK','ua':'UKR',
    'ru':'RUS','tr':'TUR','gb-wls':'WAL','gb-sct':'SCO','ci':'CIV',
    'za':'RSA','al':'ALB','mk':'MKD','ps':'PLE','jo':'JOR','qa':'QAT',
    'ae':'UAE','cn':'CHN','in':'IND','id':'IDN','th':'THA','nz':'NZL',
    'is':'ISL','fi':'FIN','hu':'HUN','ro':'ROU','ba':'BIH','ge':'GEO',
    'si':'SVN','xk':'KOS','sv':'SLV','cw':'CUW','sr':'SUR','ht':'HAI',
    'cu':'CUB','bo':'BOL','tt':'TRI','cd':'COD','cv':'CPV','gr':'GRE',
    'il':'ISR','gb-nir':'NIR',
  };

  const etapas = Object.entries(bracket);
  const selectedEtapa = S.bracketEtapa || 'all';
  const pad = Math.round(W * 0.025);

  // ── Helpers ──
  function resolveTeam(name) {
    if (!name || name === 'TBD') return { display: 'TBD', isTBD: true };
    // W73, L101 = Winner/Loser of match X
    const wMatch = name.match(/^[WL](\d+)$/i);
    if (wMatch) return { display: `${name[0].toUpperCase()}${name.slice(1).toLowerCase()}`, isTBD: true, matchRef: wMatch[1] };
    const translated = (typeof traducirPais === 'function' ? traducirPais(name) : name);
    return { display: translated, isTBD: false };
  }

  function getAbbr(name) {
    const iso = flagIso(name);
    return iso ? (cAbbr[iso] || iso.toUpperCase()) : '';
  }


  // ── SINGLE STAGE VIEW (llave visual 3 columnas) ──
  if (selectedEtapa !== 'all') {
    const stageIdx = etapas.findIndex(([name]) => name === selectedEtapa);
    if (stageIdx === -1) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = `400 ${Math.round(W*0.025)}px 'Economica',sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Etapa no disponible', melCX, mel.y + mel.h/2);
      ctx.restore();
      ctx.textAlign = 'left';
      return;
    }

    const [stageName, stageMatches] = etapas[stageIdx];
    const nextStage = stageIdx + 1 < etapas.length ? etapas[stageIdx + 1] : null;
    const numMatches = stageMatches.length;
    const hasCenter = nextStage && nextStage[1].length > 0 && numMatches >= 4;

    // ── Layout: split matches into left half + right half, center = next stage ──
    const innerPadX = pad;
    const innerPadY = Math.round(mel.h * 0.065);
    const labelH = Math.round(mel.h * 0.055);
    const contentTopY = mel.y + innerPadY + labelH;
    const contentH = mel.h - innerPadY * 2 - labelH;

    // Split: left = first half, right = second half
    const halfCount = Math.ceil(numMatches / 2);
    const leftMatches = stageMatches.slice(0, halfCount);
    const rightMatches = stageMatches.slice(halfCount);

    // Column widths
    const gapW = hasCenter ? Math.round(mel.w * 0.05) : 0;
    let sideW, centerW;
    if (hasCenter) {
      const totalW = mel.w - innerPadX * 2 - gapW * 2;
      sideW = Math.round(totalW * 0.37);
      centerW = totalW - sideW * 2;
    } else {
      // No center: single column
      sideW = Math.round((mel.w - innerPadX * 2) * 0.48);
      centerW = 0;
    }

    const leftX = mel.x + innerPadX;
    const centerX = hasCenter ? leftX + sideW + gapW : 0;
    const rightX = hasCenter ? centerX + centerW + gapW : leftX + sideW + Math.round(mel.w * 0.04);

    // Row height based on number of matches per column
    const rowsPerSide = Math.max(leftMatches.length, rightMatches.length || 1);
    const rowH = Math.round(contentH / rowsPerSide);
    const matchBoxH = Math.round(rowH * 0.9);

    // ── Helper: format date/time ──
    function formatMatchInfo(m) {
      if (!m.horaUTC) return '';
      try {
        const d = new Date(m.horaUTC);
        const day = d.getUTCDate();
        const hour = d.getUTCHours();
        const min = d.getUTCMinutes();
        const meses = ['','ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
        const timeStr = `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
        let info = `${day} ${meses[d.getUTCMonth()+1]||''} • ${timeStr} hs`;
        if (m.estadio && m.estadio !== 'TBD') {
          const shortEstadio = m.estadio.length > 25 ? m.estadio.substring(0, 22) + '...' : m.estadio;
          info += ` • ${shortEstadio}`;
        }
        return info;
      } catch(e) { return ''; }
    }

    // ── Enhanced match box (TV scoreboard style + info line) ──
    function drawMatchBoxEnhanced(x, y, w, h, match, opts = {}) {
      const hasScore = match.golesLocal !== null && match.golesLocal !== undefined;
      const local = resolveTeam(match.local);
      const vis = resolveTeam(match.visitante);
      const localWon = hasScore && match.golesLocal > match.golesVisitante;
      const visWon = hasScore && match.golesVisitante > match.golesLocal;
      const showInfo = opts.showInfo && h > 60;

      // Reserve space for info line
      const infoLineH = showInfo ? Math.round(h * 0.14) : 0;
      const teamsH = h - infoLineH;
      const r = Math.round(h * 0.05);

      // TV scoreboard: gradient border + black interior
      if (wc26Active()) {
        const frameInset = Math.max(2, Math.round(h * 0.008));
        if (opts.isCenter) {
          // Center column: subtle dark card with turquoise accent border
          ctx.save();
          ctx.fillStyle = 'rgba(0,191,166,0.12)';
          roundRect(ctx, x, y, w, teamsH, r);
          ctx.fill();
          ctx.strokeStyle = WC26C.turquoise + '66';
          ctx.lineWidth = Math.max(1, Math.round(h * 0.01));
          roundRect(ctx, x, y, w, teamsH, r);
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.fillStyle = 'rgba(5,15,20,0.9)';
          roundRect(ctx, x + frameInset, y + frameInset, w - frameInset * 2, teamsH - frameInset * 2, Math.max(2, r - frameInset));
          ctx.fill();
          ctx.restore();
        } else {
          ctx.save();
          const grad = ctx.createLinearGradient(x, y, x + w, y);
          grad.addColorStop(0, WC26C.barLocal);
          grad.addColorStop(0.35, WC26C.barLocal);
          grad.addColorStop(0.42, WC26C.barScore);
          grad.addColorStop(0.58, WC26C.barScore);
          grad.addColorStop(0.65, WC26C.barVisitor);
          grad.addColorStop(1, WC26C.barVisitor);
          ctx.fillStyle = grad;
          roundRect(ctx, x, y, w, teamsH, r);
          ctx.fill();
          ctx.restore();
          // Interior negro
          ctx.save();
          ctx.fillStyle = opts.bg || WC26C.barBlack;
          roundRect(ctx, x + frameInset, y + frameInset, w - frameInset * 2, teamsH - frameInset * 2, Math.max(2, r - frameInset));
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Simple card
        ctx.save();
        ctx.fillStyle = opts.bg || 'rgba(255,255,255,0.06)';
        roundRect(ctx, x, y, w, teamsH, r);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, w, teamsH, r);
        ctx.stroke();
        ctx.restore();
      }

      // Info line background (below the TV bar)
      if (showInfo) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y + teamsH, w, infoLineH);
        ctx.restore();
      }

      // Divider between teams
      const midY = y + Math.round(teamsH * 0.5);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + Math.round(w * 0.02), midY);
      ctx.lineTo(x + w - Math.round(w * 0.02), midY);
      ctx.stroke();
      ctx.restore();

      // Layout
      const flagW = Math.round(w * 0.08);
      const flagH = Math.round(flagW * 0.68);
      const flagX = x + Math.round(w * 0.03);
      const nameX = flagX + flagW + Math.round(w * 0.015);
      const scoreX = x + w - Math.round(w * 0.1);
      const nameMaxW = scoreX - nameX - Math.round(w * 0.01);
      const teamAreaH = teamsH * 0.5;
      const fontSize = Math.min(Math.round(teamAreaH * 0.55), Math.round(w * 0.06));
      const abbrFontSize = Math.min(Math.round(teamAreaH * 0.4), Math.round(w * 0.042));

      function drawTeamLine(teamName, rowTop, isWinner, isLoser) {
        const cy = rowTop + Math.round(teamAreaH * 0.5);
        // Flag
        if (!teamName.isTBD) {
          drawFlagRect(ctx, teamName.display, flagX, cy - Math.round(flagH * 0.5), flagW, flagH);
        } else {
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          roundRect(ctx, flagX, cy - Math.round(flagH * 0.5), flagW, flagH, 2);
          ctx.fill();
          ctx.restore();
        }
        // Abbreviation
        const abbr = getAbbr(teamName.display);
        if (abbr) {
          ctx.save();
          ctx.font = wc26Active() ? wc26Font('700', abbrFontSize) : `700 ${abbrFontSize}px 'BebasNeue',sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(abbr, flagX + flagW + Math.round(w * 0.008), cy);
          ctx.restore();
        }
        // Name
        const abbrW = abbr ? Math.round(w * 0.055) : 0;
        ctx.save();
        ctx.font = wc26Active() ? wc26Font('400', fontSize) : `400 ${fontSize}px 'BebasNeue',sans-serif`;
        ctx.fillStyle = teamName.isTBD ? 'rgba(255,255,255,0.4)' : (isWinner ? '#fff' : (isLoser ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)'));
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const nameTextX = nameX + abbrW;
        const availW = nameMaxW - abbrW;
        let dn = teamName.display.toUpperCase();
        while (ctx.measureText(dn).width > availW && dn.length > 3) dn = dn.slice(0, -1);
        ctx.fillText(dn, nameTextX, cy);
        ctx.restore();
        // Score
        if (hasScore) {
          ctx.save();
          ctx.font = wc26Active() ? wc26Font('700', fontSize) : `700 ${fontSize}px 'BebasNeue',sans-serif`;
          ctx.fillStyle = isWinner ? WC26C.lime : 'rgba(255,255,255,0.5)';
          ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          const score = rowTop === y ? match.golesLocal : match.golesVisitante;
          ctx.fillText(String(score), x + w - Math.round(w * 0.03), cy);
          ctx.restore();
        }
      }

      drawTeamLine(local, y, localWon, !localWon && hasScore);
      drawTeamLine(vis, midY, visWon, !visWon && hasScore);

      // Info line (date/time/stadium)
      if (showInfo) {
        const infoText = formatMatchInfo(match);
        if (infoText) {
          ctx.save();
          const infoFontSize = Math.min(Math.round(h * 0.1), Math.round(w * 0.032));
          ctx.font = `400 ${infoFontSize}px 'Economica',sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(infoText, x + w/2, y + teamsH + Math.round(infoLineH * 0.15));
          ctx.restore();
        }
      }
    }

    // ── Stage label (centered, with multicolor underline) ──
    ctx.save();
    ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.022)) : `700 ${Math.round(W*0.022)}px 'BebasNeue',sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(stageName.toUpperCase(), melCX, mel.y + innerPadY);
    // Multicolor underline
    if (wc26Active()) {
      const ulineW = Math.round(W * 0.15);
      const ulineY = mel.y + innerPadY + Math.round(labelH * 0.65);
      const segW = Math.round(ulineW / 4);
      const ulineX = melCX - ulineW/2;
      [WC26C.coral, WC26C.turquoise, WC26C.purple, WC26C.lime].forEach((c, ci) => {
        ctx.fillStyle = c;
        ctx.fillRect(ulineX + ci * segW, ulineY, segW + 1, Math.round(labelH * 0.08));
      });
    }
    ctx.restore();

    // ── Draw left column matches ──
    const leftBoxes = [];
    for (let i = 0; i < leftMatches.length; i++) {
      const my = contentTopY + i * rowH + Math.round((rowH - matchBoxH) / 2);
      leftBoxes.push({ x: leftX, y: my, w: sideW, h: matchBoxH });
      drawMatchBoxEnhanced(leftX, my, sideW, matchBoxH, leftMatches[i], { showInfo: true });
    }

    // ── Draw right column matches ──
    const rightBoxes = [];
    if (rightMatches.length > 0) {
      // Right column label
      if (!hasCenter) {
        ctx.save();
        ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.014)) : `700 ${Math.round(W*0.014)}px 'BebasNeue',sans-serif`;
        ctx.fillStyle = wc26Active() ? WC26C.turquoise + 'AA' : 'rgba(166,206,57,0.6)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(`${stageName.toUpperCase()} (cont.)`, rightX + sideW/2, contentTopY - Math.round(labelH * 0.4));
        ctx.restore();
      }
      for (let i = 0; i < rightMatches.length; i++) {
        const my = contentTopY + i * rowH + Math.round((rowH - matchBoxH) / 2);
        rightBoxes.push({ x: rightX, y: my, w: sideW, h: matchBoxH });
        drawMatchBoxEnhanced(rightX, my, sideW, matchBoxH, rightMatches[i], { showInfo: true });
      }
    }

    // ── Center column (next stage) ──
    if (hasCenter) {
      const [nextName, nextMatches] = nextStage;
      const maxCenter = Math.min(nextMatches.length, Math.floor(leftMatches.length / 2));

      // Center label
      ctx.save();
      ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.015)) : `700 ${Math.round(W*0.015)}px 'BebasNeue',sans-serif`;
      ctx.fillStyle = wc26Active() ? WC26C.turquoise + 'AA' : 'rgba(166,206,57,0.6)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(nextName.toUpperCase(), centerX + centerW/2, contentTopY - Math.round(labelH * 0.4));
      ctx.restore();

      const centerBoxes = [];
      for (let i = 0; i < maxCenter; i++) {
        // Span from top of first match to bottom of second match in the pair
        const li1 = i * 2;
        const li2 = i * 2 + 1;
        let pairTop, pairBottom;
        if (li1 < leftBoxes.length) {
          pairTop = leftBoxes[li1].y;
          pairBottom = (li2 < leftBoxes.length) ? (leftBoxes[li2].y + leftBoxes[li2].h) : (leftBoxes[li1].y + leftBoxes[li1].h);
        } else {
          // Fallback
          pairTop = contentTopY + i * 2 * rowH;
          pairBottom = pairTop + rowH * 2;
        }
        const spanH = pairBottom - pairTop;
        const centerBoxH = Math.round(spanH * 0.88);
        const my = pairTop + Math.round((spanH - centerBoxH) / 2);
        centerBoxes.push({ x: centerX, y: my, w: centerW, h: centerBoxH });
        drawMatchBoxEnhanced(centerX, my, centerW, centerBoxH, nextMatches[i], { isCenter: true, showInfo: false });
      }

      // ── Connecting lines: left pair → center ──
      ctx.save();
      ctx.strokeStyle = wc26Active() ? WC26C.turquoise + '55' : 'rgba(166,206,57,0.3)';
      ctx.lineWidth = Math.max(1, Math.round(W * 0.0015));

      for (let i = 0; i < maxCenter; i++) {
        const li1 = i * 2;
        const li2 = i * 2 + 1;
        const cBox = centerBoxes[i];
        const cMidY = cBox.y + cBox.h * 0.5;

        // Left connectors
        if (li1 < leftBoxes.length) {
          const l = leftBoxes[li1];
          const lMidY = l.y + l.h * 0.5;
          const gapMidX = l.x + l.w + Math.round(gapW * 0.5);
          ctx.beginPath();
          ctx.moveTo(l.x + l.w, lMidY);
          ctx.lineTo(gapMidX, lMidY);
          ctx.lineTo(gapMidX, cMidY - Math.round(cBox.h * 0.15));
          ctx.lineTo(cBox.x, cMidY - Math.round(cBox.h * 0.15));
          ctx.stroke();
        }
        if (li2 < leftBoxes.length) {
          const l = leftBoxes[li2];
          const lMidY = l.y + l.h * 0.5;
          const gapMidX = l.x + l.w + Math.round(gapW * 0.5);
          ctx.beginPath();
          ctx.moveTo(l.x + l.w, lMidY);
          ctx.lineTo(gapMidX, lMidY);
          ctx.lineTo(gapMidX, cMidY + Math.round(cBox.h * 0.15));
          ctx.lineTo(cBox.x, cMidY + Math.round(cBox.h * 0.15));
          ctx.stroke();
        }

        // Right connectors (mirror)
        const ri1 = i * 2;
        const ri2 = i * 2 + 1;
        if (ri1 < rightBoxes.length) {
          const r = rightBoxes[ri1];
          const rMidY = r.y + r.h * 0.5;
          const gapMidX = cBox.x + cBox.w + Math.round(gapW * 0.5);
          ctx.beginPath();
          ctx.moveTo(r.x, rMidY);
          ctx.lineTo(gapMidX, rMidY);
          ctx.lineTo(gapMidX, cMidY - Math.round(cBox.h * 0.15));
          ctx.lineTo(cBox.x + cBox.w, cMidY - Math.round(cBox.h * 0.15));
          ctx.stroke();
        }
        if (ri2 < rightBoxes.length) {
          const r = rightBoxes[ri2];
          const rMidY = r.y + r.h * 0.5;
          const gapMidX = cBox.x + cBox.w + Math.round(gapW * 0.5);
          ctx.beginPath();
          ctx.moveTo(r.x, rMidY);
          ctx.lineTo(gapMidX, rMidY);
          ctx.lineTo(gapMidX, cMidY + Math.round(cBox.h * 0.15));
          ctx.lineTo(cBox.x + cBox.w, cMidY + Math.round(cBox.h * 0.15));
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  } else {
    // ── ALL STAGES VIEW (compacta) ──
    const numStages = etapas.length;
    const innerPadY = Math.round(mel.h * 0.015);
    const stageH = Math.round((mel.h - innerPadY * 2) / numStages);

    etapas.forEach(([stageName, matches], stageIdx) => {
      const sy = mel.y + innerPadY + stageIdx * stageH;

      // Stage label
      ctx.save();
      ctx.font = wc26Active() ? wc26Font('700', Math.round(W*0.018)) : `700 ${Math.round(W*0.018)}px 'BebasNeue',sans-serif`;
      ctx.fillStyle = wc26Active() ? WC26C.turquoise + 'CC' : 'rgba(166,206,57,0.8)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(stageName.toUpperCase(), mel.x + pad, sy);
      ctx.restore();

      if (!matches || matches.length === 0) return;

      const cols = matches.length > 4 ? 2 : 1;
      const rowsPerCol = Math.ceil(matches.length / cols);
      const colW = Math.round((mel.w - pad * 2 - (cols > 1 ? pad : 0)) / cols);
      const matchH = Math.round(Math.min((stageH * 0.78) / rowsPerCol, mel.h * 0.04));
      const matchFontSz = Math.min(Math.round(W * 0.016), Math.round(matchH * 0.6));

      for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        const col = cols > 1 ? Math.floor(i / rowsPerCol) : 0;
        const row = cols > 1 ? (i % rowsPerCol) : i;
        const mx = mel.x + pad + col * (colW + pad);
        const my = sy + Math.round(matchH * 0.5) + row * matchH;
        const hasScore = m.golesLocal !== null && m.golesLocal !== undefined;

        ctx.save();
        ctx.fillStyle = row % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
        roundRect(ctx, mx, my, colW, matchH - 1, 2);
        ctx.fill();
        ctx.restore();

        ctx.font = wc26Active() ? wc26Font('400', matchFontSz) : `400 ${matchFontSz}px 'BebasNeue',sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const textY = my + Math.round(matchH * 0.45);

        const local = resolveTeam(m.local);
        const vis = resolveTeam(m.visitante);
        const localTxt = local.display.toUpperCase();
        const visTxt = vis.display.toUpperCase();

        if (hasScore) {
          const localWon = m.golesLocal > m.golesVisitante;
          const nameW = Math.round(colW * 0.38);
          const scoreW = Math.round(colW * 0.18);
          const scoreX = mx + nameW;
          const visX = scoreX + scoreW;

          ctx.fillStyle = localWon ? '#fff' : 'rgba(255,255,255,0.5)';
          ctx.fillText(localTxt, mx + Math.round(colW * 0.02), textY);

          ctx.fillStyle = WC26C.lime;
          ctx.textAlign = 'center';
          ctx.fillText(`${m.golesLocal}-${m.golesVisitante}`, scoreX + scoreW/2, textY);

          ctx.textAlign = 'left';
          ctx.fillStyle = !localWon ? '#fff' : 'rgba(255,255,255,0.5)';
          ctx.fillText(visTxt, visX + Math.round(colW * 0.02), textY);
        } else {
          ctx.fillStyle = local.isTBD || vis.isTBD ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)';
          const scoreTxt = hasScore ? ` ${m.golesLocal}-${m.golesVisitante} ` : ' vs ';
          ctx.fillText(`${localTxt}${scoreTxt}${visTxt}`, mx + Math.round(colW * 0.02), textY);
        }
      }
    });
  }

  ctx.restore();

  // Logo MM
  if (S.logoImg) {
    ctx.save();
    ctx.globalAlpha = S.lOp || 1;
    ctx.drawImage(S.logoImg, ELS.logo.x, ELS.logo.y, ELS.logo.w, ELS.logo.h);
    ctx.restore();
  }
}

function render(){
  const fmt=FMTS[S.fmt];const W=fmt.w,H=fmt.h;
  ctx.clearRect(0,0,W,H);
  // Desviar a modos especiales
  if(S.mode==='textual'){renderTextual(W,H);if(S.active)drawActiveUI(W,H);return;}
  if(S.mode==='foto'){renderFoto(W,H);if(S.active)drawActiveUI(W,H);return;}
  if(S.mode==='collage'){renderCollage(W,H);if(S.active)drawActiveUI(W,H);return;}
  if(S.mode==='futbol'){renderFutbol(W,H);if(S.active)drawActiveUI(W,H);return;}
  if(S.mode==='clima'){if(typeof renderClima==='function'){renderClima(W,H);if(S.active)drawActiveUI(W,H);return;}}
  // BG
  if(S.bgImg){
    ctx.save();
    if(S.iBlur>0)ctx.filter=`blur(${S.iBlur}px)`;
    const img=S.bgImg,ir=img.width/img.height,cr=W/H;
    let sx,sy,sw,sh;
    if(ir>cr){sh=img.height;sw=sh*cr;sx=(img.width-sw)/2;sy=0;}
    else{sw=img.width;sh=sw/cr;sx=0;sy=(img.height-sh)/2;}
    const extraX=img.width-sw,extraY=img.height-sh;
    sx=Math.max(0,Math.min(extraX,sx+extraX*S.imgX));
    sy=Math.max(0,Math.min(extraY,sy+extraY*S.imgY));
    const p=S.iBlur*4;
    ctx.drawImage(img,sx,sy,sw,sh,-p,-p,W+p*2,H+p*2);
    ctx.filter='none';ctx.restore();
    if(S.iDark>0){ctx.save();ctx.globalAlpha=S.iDark;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.restore();}
  } else {
    ctx.fillStyle='#dedad3';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#aaa';ctx.font=`${Math.round(W*.022)}px Montserrat,sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('Pegá un link o subí una imagen',W/2,H/2);
    ctx.textAlign='left';
  }
  // Template
  (TPLS[S.tpl]||TPLS.normal)(W,H);
  // Overlay
  if(document.getElementById('ovTog').checked&&S.ovOp>0){
    ctx.save();ctx.globalAlpha=S.ovOp;ctx.fillStyle=S.ovCol;ctx.fillRect(0,0,W,H);ctx.restore();
  }
  // Elementos
  // Ajustar colores de texto según plantilla al resetear posiciones
  if(ELS.title.x===null){
    if(S.tpl==='minimalista'){S.tCol='#111111';S.tBg='transparent';S.tBgOp=0;}
    else if(S.tpl==='titular'){S.tCol='#ffffff';S.tBg='transparent';S.tBgOp=0;}
    else if(S.tpl==='franja'){S.tCol='#ffffff';S.tBg='#000000';S.tBgOp=.7;}
  }
  if(ELS.cat.x===null){
    if(S.tpl==='minimalista'){S.cCol='#111111';S.cBg='#a6ce39';S.cBgOp=1;}
    else{S.cCol='#ffffff';}
  }
  ensurePos('logo'); drawLogo();
  ensurePos('cat');  drawCat();
  ensurePos('title');drawTitle();
  // UI
  if(S.active)drawActiveUI(W,H);
}

// ── HELPERS ──
function toTitleCase(str){
  return str.replace(/\w\S*/g,t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase());
}
function wrapText(ctx,text,maxW){
  if(!text||maxW<=0)return[];
  const words=text.split(' ').filter(w=>w.length>0);
  const lines=[];let cur='';
  for(const w of words){
    const test=cur?cur+' '+w:w;
    if(cur&&ctx.measureText(test).width>maxW){lines.push(cur);cur=w;}
    else cur=test;
  }
  if(cur.trim())lines.push(cur);
  return lines.filter(l=>l.trim().length>0);
}
function roundRect(ctx,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}
function hexRgb(hex){
  if(!hex||hex==='transparent')return{r:0,g:0,b:0};
  return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)};
}
function resetImgSliders(){
  ['imgX','imgY'].forEach(k=>{
    const el=document.getElementById('r-'+k);if(el)el.value=0;
    const rv=document.getElementById('rv-'+k);if(rv)rv.textContent='Centro';
  });
  S.imgX=0;S.imgY=0;
}

function drawPreviewOnCanvas(c,k){
  const tc=c.getContext('2d');const W=c.width,H=c.height;
  tc.clearRect(0,0,W,H);
  if(S.bgImg){
    const img=S.bgImg,ir=img.width/img.height,cr=W/H;
    let sx,sy,sw,sh;
    if(ir>cr){sh=img.height;sw=sh*cr;sx=(img.width-sw)/2;sy=0;}
    else{sw=img.width;sh=sw/cr;sx=0;sy=(img.height-sh)/2;}
    tc.drawImage(img,sx,sy,sw,sh,0,0,W,H);
  }else{tc.fillStyle='#d5d2cb';tc.fillRect(0,0,W,H);}
  const ov={
    normal:()=>{},
    moderna:()=>{const g=tc.createLinearGradient(0,H*.35,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.8)');tc.fillStyle=g;tc.fillRect(0,0,W,H);},
    banda:()=>{tc.fillStyle='rgba(0,0,0,.85)';tc.fillRect(0,H*.62,W,H*.38);tc.fillStyle='#a6ce39';tc.fillRect(0,H*.62,W,H*.03);},
    impacto:()=>{tc.fillStyle='rgba(0,0,0,.52)';tc.fillRect(0,0,W,H);tc.fillStyle='#a6ce39';tc.fillRect(0,0,W*.07,H);},
    diagonal:()=>{const g=tc.createLinearGradient(0,H,W*.7,0);g.addColorStop(0,'rgba(0,0,0,.88)');g.addColorStop(.6,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');tc.fillStyle=g;tc.fillRect(0,0,W,H);},
    verde:()=>{tc.fillStyle='#a6ce39';tc.fillRect(0,H*.62,W,H*.38);},
    policiales:()=>{tc.fillStyle='rgba(0,0,0,.92)';tc.fillRect(0,H*.66,W,H*.34);tc.fillStyle='#d32f2f';tc.fillRect(0,H*.66,W,H*.03);},
    clima:()=>{const g=tc.createLinearGradient(0,H*.55,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.78)');tc.fillStyle=g;tc.fillRect(0,0,W,H);tc.fillStyle='#a6ce39';tc.fillRect(0,H*.982,W,H*.018);},
    urgente:()=>{tc.fillStyle='#a6ce39';tc.fillRect(0,0,W,H*.07);const g=tc.createLinearGradient(0,H*.4,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.88)');tc.fillStyle=g;tc.fillRect(0,0,W,H);},
    economia:()=>{tc.fillStyle='rgba(0,0,0,.90)';tc.fillRect(0,H*.66,W,H*.34);tc.fillStyle='#a6ce39';tc.fillRect(0,H*.66,W,H*.04);},
    franja:()=>{
      const g=tc.createLinearGradient(0,H*.42,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.86)');
      tc.fillStyle=g;tc.fillRect(0,0,W,H);
      tc.fillStyle='#a6ce39';tc.fillRect(0,0,W*.04,H);
      tc.fillStyle='rgba(0,0,0,.55)';tc.fillRect(W*.04,0,W*.004,H);
    },
    titular:()=>{
      tc.fillStyle='#111111';tc.fillRect(0,0,W,H);
      tc.fillStyle='#a6ce39';tc.fillRect(0,0,W,H*.015);
      tc.fillStyle='#a6ce39';tc.fillRect(0,H-H*.015,W,H*.015);
    },
    minimalista:()=>{
      tc.fillStyle='rgba(245,249,232,.18)';tc.fillRect(0,0,W,H);
      tc.fillStyle='rgba(255,255,255,.93)';tc.fillRect(0,H*.7,W,H*.3);
      tc.fillStyle='#a6ce39';tc.fillRect(0,H*.7,W,H*.009);
    },
    policialesrojo:()=>{tc.fillStyle='rgba(0,0,0,.92)';tc.fillRect(0,H*.66,W,H*.34);tc.fillStyle='#c62828';tc.fillRect(0,H*.66,W,H*.04);},
    franjarojo:()=>{
      const g=tc.createLinearGradient(0,H*.42,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.86)');
      tc.fillStyle=g;tc.fillRect(0,0,W,H);
      tc.fillStyle='#c62828';tc.fillRect(0,0,W*.04,H);
    },
    urgenterojo:()=>{
      tc.fillStyle='#c62828';tc.fillRect(0,0,W,H*.08);
      const g=tc.createLinearGradient(0,H*.4,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.88)');
      tc.fillStyle=g;tc.fillRect(0,0,W,H);
    },
    'futbol-mañana':()=>{
      tc.fillStyle='#0a0a0a';tc.fillRect(0,0,W,H);
      const bh=Math.round(H*.28);const g=tc.createLinearGradient(0,H-bh,0,H);
      g.addColorStop(0,'rgba(166,206,57,.15)');g.addColorStop(1,'rgba(166,206,57,.85)');
      tc.fillStyle=g;tc.fillRect(0,H-bh,W,bh);
      tc.fillStyle='#a6ce39';tc.fillRect(0,H-bh,W,Math.round(H*.025));
    },
    'futbol-noche':()=>{
      tc.fillStyle='#000';tc.fillRect(0,0,W,H);
      tc.fillStyle='#a6ce39';tc.fillRect(0,0,W,Math.round(H*.015));
      tc.fillStyle='#a6ce39';tc.fillRect(W-Math.round(W*.015),0,Math.round(W*.015),H);
    },
    'futbol-minimalista':()=>{
      tc.fillStyle='#f5f9e8';tc.fillRect(0,0,W,H);
      tc.fillStyle='#111';tc.fillRect(W*.1,H*.2,W*.8,H*.6);
      tc.fillStyle='#a6ce39';tc.fillRect(W*.1,H*.2,W*.8,Math.round(H*.02));
      tc.fillStyle='#a6ce39';tc.fillRect(W*.1,H*.8-Math.round(H*.02),W*.8,Math.round(H*.02));
    },
    'futbol-fifa':()=>{
      const g=tc.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0b1d3a');g.addColorStop(1,'#071428');
      tc.fillStyle=g;tc.fillRect(0,0,W,H);
      tc.fillStyle='#c9a84c';tc.fillRect(0,0,W,Math.round(H*.012));
      tc.fillRect(0,H-Math.round(H*.02),W,Math.round(H*.02));
    },
    'futbol-cancha':()=>{
      const g=tc.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a5c2a');g.addColorStop(1,'#0f3d1e');
      tc.fillStyle=g;tc.fillRect(0,0,W,H);
      const ov=tc.createLinearGradient(0,0,0,H);ov.addColorStop(0,'rgba(0,0,0,.3)');ov.addColorStop(0.5,'rgba(0,0,0,.05)');ov.addColorStop(1,'rgba(0,0,0,.35)');
      tc.fillStyle=ov;tc.fillRect(0,0,W,H);
    },
    'futbol-atardecer':()=>{
      const g=tc.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a0a2e');g.addColorStop(0.4,'#6b2d5b');g.addColorStop(0.7,'#b5453a');g.addColorStop(1,'#e8a84c');
      tc.fillStyle=g;tc.fillRect(0,0,W,H);
      tc.fillStyle='rgba(0,0,0,.2)';tc.fillRect(0,0,W,H);
    },
    'futbol-celeste':()=>{
      const g=tc.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a3a6b');g.addColorStop(0.5,'#4a8bc9');g.addColorStop(1,'#1a3a6b');
      tc.fillStyle=g;tc.fillRect(0,0,W,H);
      tc.fillStyle='rgba(255,255,255,.06)';tc.fillRect(0,H*.38,W,H*.24);
      tc.fillStyle='rgba(0,0,0,.15)';tc.fillRect(0,0,W,H);
    },
    'futbol-premium':()=>{
      const g=tc.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0d0221');g.addColorStop(0.5,'#1a0a3e');g.addColorStop(1,'#0a0118');
      tc.fillStyle=g;tc.fillRect(0,0,W,H);
      tc.fillStyle='#b8860b';tc.fillRect(0,0,W,Math.round(H*.01));
      tc.fillRect(0,H-Math.round(H*.01),W,Math.round(H*.01));
    },
    'futbol-wc26':()=>{
      if(S.wc26BgImg&&S.wc26BgImg!=='error'){tc.drawImage(S.wc26BgImg,0,0,W,H);}else{
        tc.fillStyle='#0a0816';tc.fillRect(0,0,W,H);
        [{cx:W*.15,cy:H*.5,rx:W*.35,ry:H*.48,c:'#6B2FA055'},{cx:W*.8,cy:H*.1,rx:W*.18,ry:H*.15,c:'#E61D2555'},{cx:W*.45,cy:H*.48,rx:W*.18,ry:H*.24,c:'#8DC63F44'},{cx:W*.78,cy:H*.6,rx:W*.28,ry:H*.4,c:'#00853F44'}].forEach(s=>{tc.fillStyle=s.c;tc.beginPath();tc.ellipse(s.cx,s.cy,s.rx,s.ry,0,0,Math.PI*2);tc.fill();});
      }
      tc.fillStyle='rgba(10,8,22,0.45)';tc.fillRect(0,0,W,H);
      const bh2=Math.max(2,Math.round(H*.008));const sw2=Math.round(W/4);
      ['#E8564A','#00BFA6','#8E44AD','#8DC63F'].forEach((c2,i2)=>{tc.fillStyle=c2;tc.fillRect(i2*sw2,0,sw2+1,bh2);});
    },
  };
  if(ov[k])ov[k]();
  tc.fillStyle='#fff';tc.font=`bold ${Math.round(H*.1)}px BebasNeue,sans-serif`;
  tc.textBaseline='bottom';tc.textAlign='left';
  tc.fillText('TÍTULO',W*.07,H*.93);
}

// ── DRAW FUNCTIONS ──
function drawLogo(){
  const el=ELS.logo;
  if(!el.visible||!S.logoImg)return;
  ctx.save();ctx.globalAlpha=S.lOp;
  ctx.drawImage(S.logoImg,el.x,el.y,el.w,el.h);
  ctx.restore();
}

function drawCat(){
  const el=ELS.cat;
  if(!el.visible||!S.cat)return;
  ctx.save();
  const pad=Math.round(el.w*.04);
  const aw=el.w-pad*2;
  if(aw<=0){ctx.restore();return;}
  let sz=Math.max(8,Math.round(el.h*.58));
  let lines, lh, bh;
  for(let i=0;i<20;i++){
    ctx.font=`700 ${sz}px 'Economica',sans-serif`;
    lines=wrapText(ctx,toTitleCase(S.cat),aw);
    lh=sz*1.15;
    bh=lines.length*lh;
    if(bh<=el.h*0.95||sz<=8)break;
    sz=Math.max(8,Math.round(sz*0.88));
  }
  ctx.textBaseline='top';
  const sy=el.y+(el.h-bh)/2;
  // Medir ancho real del texto para ajustar el recuadro
  const textPad=Math.round(sz*.55);
  const maxLineW=Math.max(...lines.map(l=>ctx.measureText(l).width));
  const boxW=Math.min(maxLineW+textPad*2, el.w); // nunca superar el ancho del elemento
  const boxX=el.x+(el.w-boxW)/2; // centrado dentro del elemento
  const cx=boxX+boxW/2;
  const r=hexRgb(S.cBg);
  ctx.fillStyle=`rgba(${r.r},${r.g},${r.b},${S.cBgOp})`;
  roundRect(ctx,boxX,el.y,boxW,el.h,5);ctx.fill();
  if(S.cShadow){
    ctx.shadowColor='rgba(0,0,0,.85)';
    ctx.shadowBlur=Math.round(sz*.18);
    ctx.shadowOffsetX=Math.round(sz*.04);
    ctx.shadowOffsetY=Math.round(sz*.04);
  }
  ctx.fillStyle=S.cCol;ctx.textAlign='center';
  lines.forEach((l,i)=>ctx.fillText(l,cx,sy+i*lh));
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.restore();
}

function drawTitle(){
  const el=ELS.title;
  if(!el.visible||!S.title)return;
  ctx.save();
  const pad=Math.round(el.w*.025);
  const aw=el.w-pad*2;
  if(aw<=0){ctx.restore();return;}
  let sz=Math.max(10,Math.round(el.h*.38));
  let lines, lh, bh;
  // Reducir sz hasta que el bloque de texto quepa dentro de el.h
  for(let i=0;i<20;i++){
    ctx.font=`400 ${sz}px 'BebasNeue',sans-serif`;
    lines=wrapText(ctx,S.title,aw);
    lh=sz*1.15;
    bh=lines.length*lh;
    if(bh<=el.h*0.95||sz<=10)break;
    sz=Math.max(10,Math.round(sz*0.88));
  }
  ctx.textBaseline='top';
  const sy=el.y+(el.h-bh)/2;
  const cx=el.x+el.w/2;
  if(S.tBg!=='transparent'&&S.tBgOp>0){
    const r=hexRgb(S.tBg);
    ctx.fillStyle=`rgba(${r.r},${r.g},${r.b},${S.tBgOp})`;
    roundRect(ctx,el.x,el.y,el.w,el.h,6);ctx.fill();
  }
  if(S.tShadow){
    ctx.shadowColor='rgba(0,0,0,.85)';
    ctx.shadowBlur=Math.round(sz*.18);
    ctx.shadowOffsetX=Math.round(sz*.04);
    ctx.shadowOffsetY=Math.round(sz*.04);
  }
  ctx.fillStyle=S.tCol;ctx.textAlign='center';
  lines.forEach((l,i)=>ctx.fillText(l,cx,sy+i*lh));
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.restore();
}

// ── HANDLES & HIT ──
function getHandles(key){
  const el=ELS[key];if(!el||el.x===null)return[];
  const H=[
    {x:el.x,       y:el.y,        id:'nw',type:'corner'},
    {x:el.x+el.w,  y:el.y,        id:'ne',type:'corner'},
    {x:el.x,       y:el.y+el.h,   id:'sw',type:'corner'},
    {x:el.x+el.w,  y:el.y+el.h,   id:'se',type:'corner'},
  ];
  if(key!=='logo'&&key!=='foto'&&key!=='header'&&key!=='matches'){
    H.push({x:el.x,      y:el.y+el.h/2, id:'w', type:'side'});
    H.push({x:el.x+el.w, y:el.y+el.h/2, id:'e', type:'side'});
  }
  return H;
}

function drawActiveUI(W,H){
  const el=ELS[S.active];if(!el||el.x===null)return;
  const cx=el.x+el.w/2,cy=el.y+el.h/2;
  const lw=Math.max(2,Math.round(W*.0016));
  const hs=Math.round(HR*(W/1080));
  ctx.save();
  ctx.strokeStyle='rgba(166,206,57,.85)';ctx.lineWidth=Math.max(2,lw*1.5);
  ctx.setLineDash([Math.round(W*.008),Math.round(W*.004)]);
  // Centro H y V
  ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
  // Tercios verticales
  ctx.strokeStyle='rgba(166,206,57,.45)';ctx.lineWidth=Math.max(1,lw);
  ctx.beginPath();ctx.moveTo(W/3,0);ctx.lineTo(W/3,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(W*2/3,0);ctx.lineTo(W*2/3,H);ctx.stroke();
  // Tercios horizontales
  ctx.beginPath();ctx.moveTo(0,H/3);ctx.lineTo(W,H/3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,H*2/3);ctx.lineTo(W,H*2/3);ctx.stroke();
  // Bordes del elemento activo extendidos
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=Math.max(1,lw);
  ctx.beginPath();ctx.moveTo(el.x,0);ctx.lineTo(el.x,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(el.x+el.w,0);ctx.lineTo(el.x+el.w,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,el.y);ctx.lineTo(W,el.y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,el.y+el.h);ctx.lineTo(W,el.y+el.h);ctx.stroke();
  ctx.setLineDash([]);ctx.restore();
  const cs=Math.round(W*.022);
  ctx.save();
  ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=Math.max(2,Math.round(W*.002));
  ctx.beginPath();ctx.moveTo(cx-cs,cy);ctx.lineTo(cx+cs,cy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx,cy-cs);ctx.lineTo(cx,cy+cs);ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,Math.round(W*.004),0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.save();ctx.strokeStyle='rgba(166,206,57,.9)';ctx.lineWidth=lw*1.5;
  roundRect(ctx,el.x,el.y,el.w,el.h,4);ctx.stroke();ctx.restore();
  getHandles(S.active).forEach(hd=>{
    ctx.save();
    ctx.fillStyle='#fff';ctx.strokeStyle='#a6ce39';ctx.lineWidth=Math.max(2,Math.round(W*.002));
    if(hd.type==='side'){
      const hw=hs*.65,hh=hs*1.3;
      roundRect(ctx,hd.x-hw/2,hd.y-hh/2,hw,hh,hw/2);
    }else{
      ctx.beginPath();ctx.arc(hd.x,hd.y,hs*.55,0,Math.PI*2);
    }
    ctx.fill();ctx.stroke();ctx.restore();
  });
}

// ── INTERACTION ──
function getPos(e){
  const rect=canvas.getBoundingClientRect();
  const t=e.touches?e.touches[0]:e;
  return{x:(t.clientX-rect.left)*scale,y:(t.clientY-rect.top)*scale};
}
function getHandleHit(pos,key){
  const base=Math.round(HR*(FMTS[S.fmt].w/1080));
  for(const h of getHandles(key)){
    const hs=h.type==='corner'?base*2.5:base*2;
    if(Math.abs(pos.x-h.x)<hs&&Math.abs(pos.y-h.y)<hs)return h.id;
  }
  return null;
}
function hitEl(pos){
  const base=S.mode==='foto'?['foto','title','cat','logo']:S.mode==='futbol'?['header','matches','mlogo','logo']:S.mode==='clima'?['logo']:['title','cat','logo'];
  const order=S.active?[S.active,...base.filter(k=>k!==S.active)]:base;
  for(const k of order){
    const el=ELS[k];
    if(!el||el.x===null||!el.visible)continue;
    if(pos.x>=el.x&&pos.x<=el.x+el.w&&pos.y>=el.y&&pos.y<=el.y+el.h)return k;
  }
  return null;
}

// Calcula cuántas líneas tiene el texto con un ancho dado y un sz dado

// Calcula el alto mínimo para contener N líneas de sz dado

canvas.addEventListener('mousedown',onDown);
canvas.addEventListener('touchstart',onDown,{passive:false});
canvas.addEventListener('mousemove',onMove);
canvas.addEventListener('touchmove',onMove,{passive:false});
canvas.addEventListener('mouseup',onUp);
canvas.addEventListener('touchend',onUp);

function onDown(e){
  if(e.touches)e.preventDefault();
  const pos=getPos(e);
  if(S.active){
    const hid=getHandleHit(pos,S.active);
    if(hid){
      S.action='resize-'+hid;
      S.resizeStart={pos:{...pos},rect:{...ELS[S.active]},
        logoAR:S.active==='logo'&&S.logoImg?S.logoImg.width/S.logoImg.height:S.active==='mlogo'&&S.mundialLogoImg&&S.mundialLogoImg!=='error'?S.mundialLogoImg.width/S.mundialLogoImg.height:null,
        fotoSquare:S.active==='foto'};
      return;
    }
  }
  const k=hitEl(pos);
  if(k){S.active=k;S.action='drag';S.dragOff={x:pos.x-ELS[k].x,y:pos.y-ELS[k].y};}
  else{S.active=null;S.action=null;}
  render();
}

function onMove(e){
  if(e.touches)e.preventDefault();
  const pos=getPos(e);
  const{w:W,h:H}=FMTS[S.fmt];
  const SNAP=W*.014;
  if(!S.action){
    if(S.active){
      const hid=getHandleHit(pos,S.active);
      if(hid){const cur={nw:'nw-resize',ne:'ne-resize',sw:'sw-resize',se:'se-resize',w:'ew-resize',e:'ew-resize'};canvas.style.cursor=cur[hid]||'crosshair';return;}
    }
    canvas.style.cursor=hitEl(pos)?'grab':'default';return;
  }
  const el=ELS[S.active];
  if(S.action==='drag'){
    let nx=pos.x-S.dragOff.x,ny=pos.y-S.dragOff.y;
    const ecx=nx+el.w/2,ecy=ny+el.h/2;
    if(Math.abs(ecx-W/2)<SNAP)nx=W/2-el.w/2;
    if(Math.abs(ecy-H/2)<SNAP)ny=H/2-el.h/2;
    el.x=nx;el.y=ny;
  }
  if(S.action.startsWith('resize-')){
    const corner=S.action.slice(7),rs=S.resizeStart;
    const dx=pos.x-rs.pos.x,dy=pos.y-rs.pos.y;
    const MIN=W*.04;
    let{x,y,w,h}=rs.rect;
    if(rs.logoAR||rs.fotoSquare){
      // Logo (proporcional) o Foto (siempre cuadrada)
      const AR=rs.logoAR||1;
      if(corner==='se'){w=Math.max(MIN,w+dx);h=w/AR;}
      else if(corner==='sw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;h=w/AR;}
      else if(corner==='ne'){w=Math.max(MIN,w+dx);const nh=w/AR;y=rs.rect.y+rs.rect.h-nh;h=nh;}
      else if(corner==='nw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;const nh=w/AR;y=rs.rect.y+rs.rect.h-nh;h=nh;}
    } else {
      if(corner==='se'){w=Math.max(MIN,w+dx);h=Math.max(MIN,h+dy);}
      else if(corner==='sw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;h=Math.max(MIN,h+dy);}
      else if(corner==='ne'){w=Math.max(MIN,w+dx);const nh=Math.max(MIN,h-dy);y=rs.rect.y+rs.rect.h-nh;h=nh;}
      else if(corner==='nw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;const nh=Math.max(MIN,h-dy);y=rs.rect.y+rs.rect.h-nh;h=nh;}
      else if(corner==='e'){w=Math.max(MIN,w+dx);}
      else if(corner==='w'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;}
    }
    el.x=x;el.y=y;el.w=w;el.h=h;
  }
  render();
}
function onUp(){if(S.action&&S.action!==null)snapShot();S.action=null;canvas.style.cursor=S.active?'grab':'default';}
function setFmt(f){
  S.fmt=f;resetEls();
  document.querySelectorAll('[id^="fp-"]').forEach(el=>el.classList.remove('on'));
  const el=document.getElementById('fp-'+f);if(el)el.classList.add('on');
  document.querySelectorAll('select[id="fmtSel"],select[onchange*="setFmt"]').forEach(s=>{s.value=f;});
  document.getElementById('fmtLbl').textContent=FMTS[f].lbl;
  resizeCanvas();render();drawPreviews();
}
function setTpl(t){
  S.tpl=t;
  if(S.mode!=='futbol') resetEls();
  document.querySelectorAll('.tpl-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.mundial-tpl-btn').forEach(b=>b.classList.remove('on'));
  const btn=document.getElementById('tpl-'+t)||document.getElementById('mundial-tpl-'+t);
  if(btn)btn.classList.add('on');
  render();drawPreviews();
}

// ── CONTROLS ──
const RMAP={
  iDark:{k:'iDark',fn:v=>v/100,s:v=>v+'%'},
  iBlur:{k:'iBlur',fn:v=>v,s:v=>v+'px'},
  imgX: {k:'imgX', fn:v=>v/100,s:v=>v==0?'Centro':v<0?'← '+Math.abs(v)+'%':'→ '+v+'%'},
  imgY: {k:'imgY', fn:v=>v/100,s:v=>v==0?'Centro':v<0?'↑ '+Math.abs(v)+'%':'↓ '+v+'%'},
  ovOp: {k:'ovOp', fn:v=>v/100,s:v=>v+'%'},
  tBgOp:{k:'tBgOp',fn:v=>v/100,s:v=>v+'%'},
  cBgOp:{k:'cBgOp',fn:v=>v/100,s:v=>v+'%'},
  lOp:  {k:'lOp',  fn:v=>v/100,s:v=>v+'%'},
};
function updR(key,el){
  const m=RMAP[key];if(!m)return;
  S[m.k]=m.fn(+el.value);
  document.getElementById('rv-'+key).textContent=m.s(+el.value);
  snapShot();render();
}
function setSw(inputId,val,el){
  document.getElementById(inputId).value=val==='transparent'?'#000000':val;
  const map={tCol:'tCol',tBg:'tBg',cCol:'cCol',cBg:'cBg',ovCol:'ovCol'};
  if(map[inputId])S[map[inputId]]=val;
  el.closest('.swatches').querySelectorAll('.sw').forEach(s=>s.classList.remove('on'));
  el.classList.add('on');render();
}
['titIn','catIn'].forEach(id=>{
  let _snapTimer=null;
  document.getElementById(id).addEventListener('input',e=>{
    if(id==='titIn')S.title=e.target.value;else S.cat=e.target.value;render();
    clearTimeout(_snapTimer);
    _snapTimer=setTimeout(snapShot,800); // snapshot 800ms después de dejar de escribir
  });
});

// ── FETCH ──
async function fetchUrl(){
  const url=document.getElementById('urlIn').value.trim();if(!url)return;
  showLoading(true);
  try{
    const res=await fetch(`${WORKER}?url=${encodeURIComponent(url)}`);
    if(!res.ok)throw new Error('Error '+res.status);
    const data=await res.json();
    if(data.error)throw new Error(data.error);
    document.getElementById('titIn').value=data.title||'';S.title=data.title||'';
    const cat=(data.category||'').replace(/_/g,' ');
    document.getElementById('catIn').value=cat;S.cat=cat;
    // Guardar descripción y cuerpo para el generador WA
        ELS.title={x:null,y:null,w:null,h:null,visible:true};
    ELS.cat={x:null,y:null,w:null,h:null,visible:true};
    if(data.image)await loadRemoteImg(data.image);
    else showToast('Sin imagen. Subí una manualmente.');
    resizeCanvas(true);render();drawPreviews();
    if(_panelOpen)renderMobPanel();
    setTimeout(()=>{resizeCanvas(true);render();},150);
    setTimeout(()=>{resizeCanvas(true);render();},400);
  }catch(er){showToast('Error: '+er.message);}
  showLoading(false);
}
async function loadRemoteImg(imgUrl){
  try{
    const res=await fetch(`${WORKER}?image=${encodeURIComponent(imgUrl)}`);
    if(!res.ok)throw new Error();
    const blob=await res.blob();
    const bu=URL.createObjectURL(blob);
    return new Promise(r=>{
      const img=new Image();
      img.onload=()=>{
  S.bgImg=img;resetImgSliders();resizeCanvas(true);render();drawPreviews();snapShot();
  // guardar en caché como blob→dataURL
  try{
    const cc=document.createElement('canvas');cc.width=img.width;cc.height=img.height;
    cc.getContext('2d').drawImage(img,0,0);
    const du=cc.toDataURL('image/jpeg',.82);
    localStorage.setItem('mm_lastImg',du);
    localStorage.setItem('mm_lastImg_ts',Date.now());
  }catch(er){}
  setTimeout(()=>{resizeCanvas(true);render();},300);r();};
      img.onerror=()=>{showToast('No se pudo cargar la imagen.');r();};
      img.src=bu;
    });
  }catch{
    return new Promise(r=>{
      const img=new Image();img.crossOrigin='anonymous';
      img.onload=()=>{S.bgImg=img;resetImgSliders();resizeCanvas(true);render();drawPreviews();snapShot();setTimeout(()=>{resizeCanvas(true);render();},300);r();};
      img.onerror=()=>{showToast('Subí la imagen manualmente.');r();};
      img.src=imgUrl;
    });
  }
}
function loadLocalImg(ev){
  const f=ev.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      S.bgImg=img;resetImgSliders();render();drawPreviews();snapShot();
      try{localStorage.setItem('mm_lastImg',e.target.result);
          localStorage.setItem('mm_lastImg_ts',Date.now());}catch(er){}
    };
    img.src=e.target.result;
  };
  rd.readAsDataURL(f);
}
function loadFotoImg(ev){
  const f=ev.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=e=>{
    const img=new Image();
    img.onload=()=>{S.fotoImg=img;render();};
    img.src=e.target.result;
  };
  rd.readAsDataURL(f);
}
function loadCollageImg(ev,idx){
  const f=ev.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=e=>{
    const img=new Image();
    img.onload=()=>{S.collageImgs[idx]=img;render();};
    img.src=e.target.result;
  };
  rd.readAsDataURL(f);
}
function loadLogo(ev){
  const f=ev.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=e=>{
    const img=new Image();
    img.onload=()=>{S.logoImg=img;ELS.logo={x:null,y:null,w:null,h:null,visible:true};render();};
    img.src=e.target.result;
  };
  rd.readAsDataURL(f);
}

// ── TEMPLATE PREVIEWS ──
function drawPreviews(){
  ['normal','moderna','banda','impacto','diagonal','verde','policiales','clima','urgente','economia','franja','titular','minimalista','policialesrojo','franjarojo','urgenterojo'].forEach(k=>{
    const c=document.getElementById('tp-'+k);
    if(c) drawPreviewOnCanvas(c,k);
  });
}

// ── EXPORT ──
// Renderizar sin UI al canvas, devuelve Promise<blob>
function renderClean(){
  return new Promise(resolve=>{
    const prev=S.active;
    S.active=null;
    render(); // render sin handles
    // Esperar un frame para que el canvas esté actualizado
    requestAnimationFrame(()=>{
      canvas.toBlob(blob=>{
        S.active=prev;
        render(); // restaurar con handles
        resolve(blob);
      },'image/jpeg',.93);
    });
  });
}

function clearAll(){
  if(!confirm('¿Borrar la placa actual? Se perderán todos los cambios.'))return;
  S.title=''; S.cat=''; S.bgImg=null;
  S.iDark=0; S.iBlur=0; S.imgX=0; S.imgY=0;
  S.ovActive=false; S.ovCol='#000000'; S.ovOp=0.5;
  S.tCol='#ffffff'; S.tBg='#000000'; S.tBgOp=0.8; S.tShadow=false;
  S.cCol='#ffffff'; S.cBg='#000000'; S.cBgOp=0; S.cShadow=false;
  try{localStorage.removeItem('mm_lastImg');localStorage.removeItem('mm_lastImg_ts');}catch(er){}
  resetEls();
  // Reset UI inputs
  document.getElementById('titIn').value='';
  document.getElementById('catIn').value='';
  document.getElementById('urlIn').value='';
  // Reset sliders desktop
  ['iDark','iBlur','imgX','imgY','tBgOp','cBgOp'].forEach(k=>{
    const el=document.getElementById('r-'+k);
    if(el){
      const defaults={iDark:0,iBlur:0,imgX:0,imgY:0,tBgOp:80,cBgOp:0};
      el.value=defaults[k]||0;
      const rv=document.getElementById('rv-'+k);
      if(rv&&RMAP[k])rv.textContent=RMAP[k].s(+(defaults[k]||0));
    }
  });
  const ovTog=document.getElementById('ovTog');
  if(ovTog)ovTog.checked=false;
  S.mode='normal'; S.quote=''; S.quoteAuthor=''; S.quoteStyle='verde';
  S.fotoImg=null; S.fotoSize=0.28; S.fotoX=0.72; S.fotoY=0.18; S.fotoBorder='#a6ce39'; S.fotoShape='circle';
  S.quoteSplit=0.5; S.quotePos='left'; S.quoteTextCol='';
  S.collageImgs=[null,null,null,null]; S.collageLayout='2h';
  S.mundialTipo=null; S.mundialData=null;
  // Volver a plantilla normal + formato portrait
  S.tpl='normal'; S.fmt='portrait';
  setMode('normal');
  document.querySelectorAll('.tpl-btn').forEach(b=>b.classList.remove('on'));
  const nb=document.getElementById('tpl-normal');if(nb)nb.classList.add('on');
  document.querySelectorAll('[id^="fp-"]').forEach(el=>el.classList.remove('on'));
  const fp=document.getElementById('fp-portrait');if(fp)fp.classList.add('on');
  const fl=document.getElementById('fmtLbl');if(fl)fl.textContent=FMTS['portrait'].lbl;
  resizeCanvas(); render(); drawPreviews();
  if(_panelOpen) renderMobPanel();
  showToast('✅ Placa reiniciada');
}

async function exportImg(mode){
  const blob=await renderClean();
  if(mode==='download'){
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;
    a.download=`mediamendoza-${S.fmt}-${Date.now()}.jpg`;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
    showToast('✅ Imagen descargada');
  } else {
    // Copiar: usar blob PNG limpio (sin UI) ya generado por renderClean
    const pngBlob = await new Promise(res => {
      const prev = S.active;
      S.active = null;
      render();
      requestAnimationFrame(() => {
        canvas.toBlob(b => {
          S.active = prev;
          render();
          res(b);
        }, 'image/png');
      });
    });
    try{
      await navigator.clipboard.write([new ClipboardItem({'image/png': pngBlob})]);
      showToast('✅ Copiado al portapapeles');
    }catch{
      const url = URL.createObjectURL(pngBlob);
      window.open(url,'_blank');
      showToast('Abrí en nueva pestaña → clic derecho → Copiar imagen');
    }
  }
}

async function exportAllFormats(){
  if(!S.bgImg){showToast('Primero cargá una imagen');return;}
  const fmts=Object.keys(FMTS);
  const origFmt=S.fmt;
  const origELS=JSON.parse(JSON.stringify(ELS));
  showLoading(true);
  showToast('Generando '+fmts.length+' formatos...');
  for(const f of fmts){
    S.fmt=f; resetEls(); resizeCanvas();
    await new Promise(r=>setTimeout(r,100));
    render();
    await new Promise(r=>setTimeout(r,80));
    const blob=await renderClean();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`mediamendoza-${f}-${Date.now()}.jpg`;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},1500);
    await new Promise(r=>setTimeout(r,400));
  }
  S.fmt=origFmt; ELS=origELS; resizeCanvas(true); render();
  showLoading(false);
  showToast('✅ '+fmts.length+' formatos descargados');
}

function showLoading(v){document.getElementById('lov').style.display=v?'flex':'none';}
function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}


// ── MOBILE TAB SYSTEM ──
const MOB_PANELS = {
  noticia: () => `
    <div class="mode-bar" style="margin-bottom:10px">
      <div class="mode-btn ${S.mode==='normal'?'on':''}"   onclick="setMode('normal')"  >📰 Normal</div>
      <div class="mode-btn ${S.mode==='textual'?'on':''}"  onclick="setMode('textual')" >💬 Textual</div>
      <div class="mode-btn ${S.mode==='foto'?'on':''}"     onclick="setMode('foto')"    >👤 Foto</div>
      <div class="mode-btn ${S.mode==='collage'?'on':''}"  onclick="setMode('collage')" >🖼 Collage</div>
      <div class="mode-btn ${S.mode==='futbol'?'on':''}"   onclick="setMode('futbol')"  >⚽ Mundial</div>
      <div class="mode-btn ${S.mode==='clima'?'on':''}"    onclick="setMode('clima')"   >🌤️ Clima</div>
    </div>
    ${S.mode==='textual' ? `
      <label class="fl">Texto de la cita</label>
      <textarea id="m-quoteIn" rows="3" placeholder="Textual...">${S.quote}</textarea>
      <label class="fl">Autor / Fuente</label>
      <input type="text" id="m-quoteAuthorIn" placeholder="Nombre, cargo..." value="${S.quoteAuthor}">
      <label class="fl" style="margin-top:8px">Color del panel</label>
      <div style="display:flex;gap:4px;margin:4px 0 6px">
        <div class="tpl-btn ${S.quoteStyle==='verde'?'on':''}"  onclick="S.quoteStyle='verde'; render();renderMobPanel()" style="flex:1;font-size:.7rem;padding:5px">Verde MM</div>
        <div class="tpl-btn ${S.quoteStyle==='negro'?'on':''}"  onclick="S.quoteStyle='negro'; render();renderMobPanel()" style="flex:1;font-size:.7rem;padding:5px">Negro</div>
        <div class="tpl-btn ${S.quoteStyle==='blanco'?'on':''}" onclick="S.quoteStyle='blanco';render();renderMobPanel()" style="flex:1;font-size:.7rem;padding:5px">Blanco</div>
      </div>
      <label class="fl">Posición del panel</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:4px 0 6px">
        <div class="tpl-btn ${S.quotePos==='left'?'on':''}"   onclick="S.quotePos='left';  ELS.title._textualInit=null;render();renderMobPanel()" style="padding:5px;font-size:.7rem">◀ Izq</div>
        <div class="tpl-btn ${S.quotePos==='right'?'on':''}"  onclick="S.quotePos='right'; ELS.title._textualInit=null;render();renderMobPanel()" style="padding:5px;font-size:.7rem">Der ▶</div>
        <div class="tpl-btn ${S.quotePos==='top'?'on':''}"    onclick="S.quotePos='top';   ELS.title._textualInit=null;render();renderMobPanel()" style="padding:5px;font-size:.7rem">▲ Arriba</div>
        <div class="tpl-btn ${S.quotePos==='bottom'?'on':''}" onclick="S.quotePos='bottom';ELS.title._textualInit=null;render();renderMobPanel()" style="padding:5px;font-size:.7rem">Abajo ▼</div>
      </div>
      <label class="fl">Tamaño del panel <span class="rval" id="m-rv-qsplit">${Math.round(S.quoteSplit*100)}%</span></label>
      <div class="rrow"><input type="range" min="30" max="70" value="${Math.round(S.quoteSplit*100)}" oninput="S.quoteSplit=this.value/100;ELS.title._textualInit=null;document.getElementById('m-rv-qsplit').textContent=this.value+'%';render()"></div>
      <label class="fl">Color del texto</label>
      <div class="swatches">
        <input type="color" value="${S.quoteTextCol||'#111111'}" oninput="S.quoteTextCol=this.value;render()">
        <div class="sw on" style="background:linear-gradient(135deg,#111 50%,#fff 50%);border-color:#ccc" onclick="S.quoteTextCol='';render()" title="Auto"></div>
        <div class="sw" style="background:#fff;border-color:#ccc" onclick="S.quoteTextCol='#ffffff';render()"></div>
        <div class="sw" style="background:#111" onclick="S.quoteTextCol='#111111';render()"></div>
        <div class="sw" style="background:#a6ce39" onclick="S.quoteTextCol='#a6ce39';render()"></div>
      </div>
    ` : ''}
    ${S.mode==='foto' ? `
      <label class="fl">Imagen de fondo (noticia)</label>
      <label class="uplbl" for="m-bgUp2" style="margin-top:4px">📁 Subir imagen</label>
      <input type="file" id="m-bgUp2" accept="image/*" style="display:none">
      <label class="fl" style="margin-top:8px">Foto persona</label>
      <label class="uplbl" for="m-fotoUp">📁 Subir foto</label>
      <input type="file" id="m-fotoUp" accept="image/*" style="display:none">
      <div style="background:var(--surface2);border-radius:5px;padding:6px 8px;margin:6px 0;font-size:.74rem;color:var(--muted)">
        👆 Arrastrá y redimensionás la foto sobre el canvas.
      </div>
      <label class="fl">Forma</label>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:4px 0 6px">
        <div class="tpl-btn ${S.fotoShape==='circle'?'on':''}" onclick="S.fotoShape='circle'; render();renderMobPanel()" style="padding:5px;font-size:.85rem">⬤</div>
        <div class="tpl-btn ${S.fotoShape==='square'?'on':''}" onclick="S.fotoShape='square'; render();renderMobPanel()" style="padding:5px;font-size:.85rem">⬛</div>
        <div class="tpl-btn ${S.fotoShape==='diamond'?'on':''}" onclick="S.fotoShape='diamond';render();renderMobPanel()" style="padding:5px;font-size:.85rem">◆</div>
        <div class="tpl-btn ${S.fotoShape==='hexagon'?'on':''}" onclick="S.fotoShape='hexagon';render();renderMobPanel()" style="padding:5px;font-size:.85rem">⬡</div>
      </div>
      <label class="fl">Color del borde</label>
      <div class="swatches">
        <input type="color" value="${S.fotoBorder}" oninput="S.fotoBorder=this.value;render()">
        <div class="sw" style="background:#a6ce39" onclick="S.fotoBorder='#a6ce39';render()"></div>
        <div class="sw" style="background:#fff;border-color:#ccc" onclick="S.fotoBorder='#ffffff';render()"></div>
        <div class="sw" style="background:#111" onclick="S.fotoBorder='#111111';render()"></div>
      </div>
    ` : ''}
    ${S.mode==='collage' ? `
      <label class="fl">Distribución</label>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:4px 0 10px">
        <div class="tpl-btn ${S.collageLayout==='2h'?'on':''}" onclick="S.collageLayout='2h';render();renderMobPanel()" style="padding:5px 2px;font-size:.68rem">⬜⬜</div>
        <div class="tpl-btn ${S.collageLayout==='2v'?'on':''}" onclick="S.collageLayout='2v';render();renderMobPanel()" style="padding:5px 2px;font-size:.68rem">🔲</div>
        <div class="tpl-btn ${S.collageLayout==='3t'?'on':''}" onclick="S.collageLayout='3t';render();renderMobPanel()" style="padding:5px 2px;font-size:.62rem">1↑2↓</div>
        <div class="tpl-btn ${S.collageLayout==='3b'?'on':''}" onclick="S.collageLayout='3b';render();renderMobPanel()" style="padding:5px 2px;font-size:.62rem">2↑1↓</div>
        <div class="tpl-btn ${S.collageLayout==='3l'?'on':''}" onclick="S.collageLayout='3l';render();renderMobPanel()" style="padding:5px 2px;font-size:.62rem">1←2→</div>
        <div class="tpl-btn ${S.collageLayout==='3r'?'on':''}" onclick="S.collageLayout='3r';render();renderMobPanel()" style="padding:5px 2px;font-size:.62rem">2←1→</div>
        <div class="tpl-btn ${S.collageLayout==='4'?'on':''}" onclick="S.collageLayout='4';render();renderMobPanel()" style="padding:5px 2px;font-size:.68rem">⊞</div>
      </div>
      <div class="collage-slots" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <label class="collage-slot" for="m-coll0" style="border:2px dashed var(--line2);border-radius:var(--radius);padding:10px 6px;text-align:center;font-size:.7rem;cursor:pointer">🖼 Img 1</label>
        <label class="collage-slot" for="m-coll1" style="border:2px dashed var(--line2);border-radius:var(--radius);padding:10px 6px;text-align:center;font-size:.7rem;cursor:pointer">🖼 Img 2</label>
        ${S.collageLayout.startsWith('3')||S.collageLayout==='4' ? `<label class="collage-slot" for="m-coll2" style="border:2px dashed var(--line2);border-radius:var(--radius);padding:10px 6px;text-align:center;font-size:.7rem;cursor:pointer">🖼 Img 3</label>` : ''}
        ${S.collageLayout==='4' ? `<label class="collage-slot" for="m-coll3" style="border:2px dashed var(--line2);border-radius:var(--radius);padding:10px 6px;text-align:center;font-size:.7rem;cursor:pointer">🖼 Img 4</label>` : ''}
      </div>
      <input type="file" id="m-coll0" accept="image/*" style="display:none" onchange="loadCollageImg(event,0)">
      <input type="file" id="m-coll1" accept="image/*" style="display:none" onchange="loadCollageImg(event,1)">
      <input type="file" id="m-coll2" accept="image/*" style="display:none" onchange="loadCollageImg(event,2)">
      <input type="file" id="m-coll3" accept="image/*" style="display:none" onchange="loadCollageImg(event,3)">
    ` : ''}
    ${S.mode==='clima' ? `
      <label class="fl">Ciudad</label>
      <select id="m-selClimaCiudad" onchange="window.climaCiudad=this.value" style="margin-bottom:8px">
        <option value="San Rafael" ${window.climaCiudad==='San Rafael'?'selected':''}>San Rafael</option>
        <option value="General Alvear" ${window.climaCiudad==='General Alvear'?'selected':''}>General Alvear</option>
        <option value="Malargüe" ${window.climaCiudad==='Malargüe'?'selected':''}>Malargüe</option>
        <option value="Mendoza" ${window.climaCiudad==='Mendoza'?'selected':''}>Mendoza</option>
        <option value="San Juan" ${window.climaCiudad==='San Juan'?'selected':''}>San Juan</option>
        <option value="San Luis" ${window.climaCiudad==='San Luis'?'selected':''}>San Luis</option>
        <option value="Neuquén" ${window.climaCiudad==='Neuquén'?'selected':''}>Neuquén</option>
      </select>
      <button onclick="if(typeof window.obtenerClima==='function')window.obtenerClima(window.climaCiudad)" style="width:100%;padding:10px;background:var(--v);color:var(--bg);border:none;border-radius:var(--radius);font-size:.8rem;font-weight:600;cursor:pointer">
        🔄 Actualizar clima
      </button>
    ` : ''}
    ${S.mode==='normal' ? `
      <label class="fl" style="margin-top:4px">Formato</label>
      <select onchange="setFmt(this.value);this.blur()" style="margin-bottom:8px">
        ${['sq','story','portrait','fb','tw'].map(f=>`<option value="${f}" ${S.fmt===f?'selected':''}>${{sq:'Instagram Cuadrado (1080×1080)',story:'Historia (1080×1920)',portrait:'Portrait (1080×1350)',fb:'Facebook (1200×628)',tw:'Twitter / X (1600×900)'}[f]}</option>`).join('')}
      </select>
      <div class="urlrow">
        <input type="url" id="m-urlIn" placeholder="https://mediamendoza.com/..." value="${document.getElementById('urlIn').value}">
        <button class="urlbtn" onclick="mobFetch()">→</button>
      </div>
      <label class="fl">Título</label>
      <textarea id="m-titIn" rows="2">${S.title}</textarea>
      <label class="fl">Categoría</label>
      <input type="text" id="m-catIn" value="${S.cat}" placeholder="Ej: Mendoza...">
      <label class="uplbl" for="m-imgUp">📁 Subir imagen</label>
      <input type="file" id="m-imgUp" accept="image/*">
    ` : ''}
  `,

  plantilla: ()=>`
    <div class="tpl-grid">
      ${S.mode==='futbol' ? `
        ${['futbol-mañana','futbol-noche','futbol-minimalista','futbol-fifa','futbol-cancha','futbol-atardecer','futbol-celeste','futbol-premium','futbol-wc26'].map(k=>`
          <div class="tpl-btn ${S.tpl===k?'on':''}" onclick="setTpl('${k}');renderMobPanel()">
            <canvas class="tpl-prev" id="mtp-${k}"></canvas>
            <div class="tpl-name">${{'futbol-mañana':'Mañana','futbol-noche':'Noche','futbol-minimalista':'Minimal','futbol-fifa':'FIFA','futbol-cancha':'Cancha','futbol-atardecer':'Atardecer','futbol-celeste':'Celeste','futbol-premium':'Premium','futbol-wc26':'WC 2026'}[k]}</div>
          </div>`).join('')}
      ` : `
        ${['normal','moderna','banda','impacto','diagonal','verde','policiales','clima','urgente','economia','franja','titular','minimalista','policialesrojo','franjarojo','urgenterojo'].map(k=>`
          <div class="tpl-btn ${S.tpl===k?'on':''}" onclick="setTpl('${k}');renderMobPanel()">
            <canvas class="tpl-prev" id="mtp-${k}"></canvas>
            <div class="tpl-name">${{normal:'Normal',moderna:'Moderna',banda:'Banda',impacto:'Impacto',diagonal:'Diagonal',verde:'Verde MM',policiales:'Policiales',clima:'Clima',urgente:'Urgente',economia:'Economía',franja:'Franja',titular:'Titular',minimalista:'Minimalista',policialesrojo:'Policiales 🔴',franjarojo:'Franja 🔴',urgenterojo:'Urgente 🔴'}[k]}</div>
          </div>`).join('')}
      `}
    </div>`,

  imagen: ()=>`
    <label class="fl" style="margin-top:4px">Oscurecer <span class="rval" id="m-rv-iDark">${Math.round(S.iDark*100)}%</span></label>
    <div class="rrow"><input type="range" min="0" max="100" value="${Math.round(S.iDark*100)}" oninput="S.iDark=this.value/100;document.getElementById('m-rv-iDark').textContent=this.value+'%';syncSlider('iDark',this.value);render()"></div>
    <label class="fl">Blur <span class="rval" id="m-rv-iBlur">${S.iBlur}px</span></label>
    <div class="rrow"><input type="range" min="0" max="20" value="${S.iBlur}" oninput="S.iBlur=+this.value;document.getElementById('m-rv-iBlur').textContent=this.value+'px';syncSlider('iBlur',this.value);render()"></div>
    <label class="fl">Posición horizontal <span class="rval" id="m-rv-imgX">${S.imgX==0?'Centro':S.imgX<0?'← '+Math.abs(Math.round(S.imgX*100))+'%':'→ '+Math.round(S.imgX*100)+'%'}</span></label>
    <div class="rrow"><input type="range" min="-100" max="100" value="${Math.round(S.imgX*100)}" oninput="S.imgX=this.value/100;document.getElementById('m-rv-imgX').textContent=(+this.value==0?'Centro':this.value<0?'← '+Math.abs(this.value)+'%':'→ '+this.value+'%');syncSlider('imgX',this.value);render()"></div>
    <label class="fl">Posición vertical <span class="rval" id="m-rv-imgY">${S.imgY==0?'Centro':S.imgY<0?'↑ '+Math.abs(Math.round(S.imgY*100))+'%':'↓ '+Math.round(S.imgY*100)+'%'}</span></label>
    <div class="rrow"><input type="range" min="-100" max="100" value="${Math.round(S.imgY*100)}" oninput="S.imgY=this.value/100;document.getElementById('m-rv-imgY').textContent=(+this.value==0?'Centro':this.value<0?'↑ '+Math.abs(this.value)+'%':'↓ '+this.value+'%');syncSlider('imgY',this.value);render()"></div>`,

  titulo: ()=>`
    <div class="el-actions">
      <span style="font-size:.75rem;color:var(--g60)">Posición del título</span>
      <button class="btn-reset" onclick="resetElPos('title')">↺ Reset</button>
    </div>
    <div class="align-bar">
      <button onclick="alignEl('title','l')">⇤</button>
      <button onclick="alignEl('title','ch')">↔</button>
      <button onclick="alignEl('title','r')">⇥</button>
      <button onclick="alignEl('title','t')">⇡</button>
      <button onclick="alignEl('title','cv')">↕</button>
      <button onclick="alignEl('title','b')">⇣</button>
    </div>
    <label class="fl" style="margin-top:4px">Color de texto</label>
    <div class="swatches">
      <input type="color" value="${S.tCol}" oninput="S.tCol=this.value;render()">
      ${['#ffffff','#111111','#a6ce39','#f5c518'].map(c=>`<div class="sw ${S.tCol===c?'on':''}" style="background:${c};${c==='#ffffff'?'border-color:#ccc':''}" onclick="S.tCol='${c}';render();renderMobPanel()"></div>`).join('')}
    </div>
    <label class="fl">Fondo del recuadro</label>
    <div class="swatches">
      <input type="color" value="${S.tBg==='transparent'?'#000000':S.tBg}" oninput="S.tBg=this.value;render()">
      ${['#000000','#a6ce39','#8fb82d','transparent'].map(c=>`<div class="sw ${S.tBg===c?'on':''} ${c==='transparent'?'sw-transp':''}" style="${c!=='transparent'?'background:'+c:''}" onclick="S.tBg='${c}';render();renderMobPanel()" title="${c==='transparent'?'Sin fondo':''}"></div>`).join('')}
    </div>
    <label class="fl">Opacidad del fondo <span class="rval" id="m-rv-tBgOp">${Math.round(S.tBgOp*100)}%</span></label>
    <div class="rrow"><input type="range" min="0" max="100" value="${Math.round(S.tBgOp*100)}" oninput="S.tBgOp=this.value/100;document.getElementById('m-rv-tBgOp').textContent=this.value+'%';syncSlider('tBgOp',this.value);render()"></div>
    <div class="togrow" style="margin-top:8px">
      <span style="font-size:.8rem;color:var(--g80)">Sombra en texto</span>
      <label class="toggle"><input type="checkbox" id="m-tShadow" ${S.tShadow?'checked':''} onchange="S.tShadow=this.checked;const d=document.getElementById('tShadow');if(d)d.checked=this.checked;snapShot();render()"><span class="togslide"></span></label>
    </div>`,

  categoria: ()=>`
    <div class="el-actions">
      <span style="font-size:.75rem;color:var(--g60)">Posición de categoría</span>
      <button class="btn-reset" onclick="resetElPos('cat')">↺ Reset</button>
    </div>
    <div class="align-bar">
      <button onclick="alignEl('cat','l')">⇤</button>
      <button onclick="alignEl('cat','ch')">↔</button>
      <button onclick="alignEl('cat','r')">⇥</button>
      <button onclick="alignEl('cat','t')">⇡</button>
      <button onclick="alignEl('cat','cv')">↕</button>
      <button onclick="alignEl('cat','b')">⇣</button>
    </div>
    <label class="fl" style="margin-top:4px">Color de texto</label>
    <div class="swatches">
      <input type="color" value="${S.cCol}" oninput="S.cCol=this.value;render()">
      ${['#111111','#ffffff','#a6ce39'].map(c=>`<div class="sw ${S.cCol===c?'on':''}" style="background:${c};${c==='#ffffff'?'border-color:#ccc':''}" onclick="S.cCol='${c}';render();renderMobPanel()"></div>`).join('')}
    </div>
    <label class="fl">Color de fondo</label>
    <div class="swatches">
      <input type="color" value="${S.cBg}" oninput="S.cBg=this.value;render()">
      ${['#a6ce39','#8fb82d','#ffffff','#111111'].map(c=>`<div class="sw ${S.cBg===c?'on':''}" style="background:${c};${c==='#ffffff'?'border-color:#ccc':''}" onclick="S.cBg='${c}';render();renderMobPanel()"></div>`).join('')}
    </div>
    <label class="fl">Opacidad del fondo <span class="rval" id="m-rv-cBgOp">${Math.round(S.cBgOp*100)}%</span></label>
    <div class="rrow"><input type="range" min="0" max="100" value="${Math.round(S.cBgOp*100)}" oninput="S.cBgOp=this.value/100;document.getElementById('m-rv-cBgOp').textContent=this.value+'%';syncSlider('cBgOp',this.value);render()"></div>
    <div class="togrow" style="margin-top:8px">
      <span style="font-size:.8rem;color:var(--g80)">Sombra en texto</span>
      <label class="toggle"><input type="checkbox" id="m-cShadow" ${S.cShadow?'checked':''} onchange="S.cShadow=this.checked;const d=document.getElementById('cShadow');if(d)d.checked=this.checked;snapShot();render()"><span class="togslide"></span></label>
    </div>`,

  capa: ()=>`
    <div class="togrow" style="margin-top:4px">
      <span style="font-size:.8rem;color:var(--g80)">Activar capa de color</span>
      <label class="toggle"><input type="checkbox" id="m-ovTog" ${document.getElementById('ovTog').checked?'checked':''} onchange="document.getElementById('ovTog').checked=this.checked;render()"><span class="togslide"></span></label>
    </div>
    <label class="fl">Color</label>
    <div class="swatches">
      <input type="color" value="${S.ovCol}" oninput="S.ovCol=this.value;render()">
      ${['#000000','#1a1a1a','#a6ce39','#ffffff'].map(c=>`<div class="sw ${S.ovCol===c?'on':''}" style="background:${c};${c==='#ffffff'?'border-color:#ccc':''}" onclick="S.ovCol='${c}';render();renderMobPanel()"></div>`).join('')}
    </div>
    <label class="fl">Opacidad <span class="rval" id="m-rv-ovOp">${Math.round(S.ovOp*100)}%</span></label>
    <div class="rrow"><input type="range" min="0" max="100" value="${Math.round(S.ovOp*100)}" oninput="S.ovOp=this.value/100;document.getElementById('m-rv-ovOp').textContent=this.value+'%';syncSlider('ovOp',this.value);render()"></div>`,

  logo: () => `
  <div class="el-actions">
    <span style="font-size:.75rem;color:var(--g60)">Posición del logo</span>
    <button class="btn-reset" onclick="resetElPos('logo')">↺ Reset</button>
  </div>
  <div class="align-bar">
    <button onclick="alignEl('logo','l')">⇤</button>
    <button onclick="alignEl('logo','ch')">↔</button>
    <button onclick="alignEl('logo','r')">⇥</button>
    <button onclick="alignEl('logo','t')">⇡</button>
    <button onclick="alignEl('logo','cv')">↕</button>
    <button onclick="alignEl('logo','b')">⇣</button>
  </div>
  <div class="mm-field" style="margin-top: 8px;">
    <label class="mm-label" style="font-size:9px;letter-spacing:2px">Logo predefinido</label>
    <select id="selectPredefinedLogoMob" class="mm-select" style="font-size:11px;padding:8px" onchange="cambiarLogoPredefinido(this.value)">
      <option value="logo.png" ${localStorage.getItem('mm_logo_predefinido_placas') === 'logo.png' ? 'selected' : ''}>Media Mendoza (por defecto)</option>
      <option value="logo-patrio.png" ${localStorage.getItem('mm_logo_predefinido_placas') === 'logo-patrio.png' ? 'selected' : ''}>Media Mendoza - Versión Patria</option>
    </select>
  </div>
  <label class="uplbl" for="m-logoUp">📁 Cambiar logo</label>
  <input type="file" id="m-logoUp" accept="image/*">
  <label class="fl">Opacidad <span class="rval" id="m-rv-lOp">${Math.round(S.lOp*100)}%</span></label>
  <div class="rrow"><input type="range" min="10" max="100" value="${Math.round(S.lOp*100)}" oninput="S.lOp=this.value/100;document.getElementById('m-rv-lOp').textContent=this.value+'%';syncSlider('lOp',this.value);render()"></div>
`,

  mundial: () => `
    <div class="mundial-calendario-content" id="mobMundialCalendario" style="margin-bottom:10px">
      <div style="color:var(--muted);font-size:.8rem;text-align:center;padding:20px 0">
        Cargando calendario...
      </div>
    </div>
    <button class="urlbtn" onclick="generarPlacaDelDia()" style="width:100%;padding:10px;margin-top:4px;background:var(--v);color:var(--bg);font-size:.85rem">
      ☀️ Generar placa "Partidos del día"
    </button>
    <button class="urlbtn" onclick="generarResultadosDelDia()" style="width:100%;padding:10px;margin-top:6px;background:#1a3a5c;color:#fff;font-size:.85rem">
      🌙 Generar placa "Resultados del día"
    </button>
    <button class="urlbtn" onclick="generarPlacaPosiciones()" style="width:100%;padding:10px;margin-top:6px;background:#0b3d0b;color:#fff;font-size:.85rem">
      📊 Generar placa "Posiciones"
    </button>
    <button class="urlbtn" onclick="generarPlacaGoleadores()" style="width:100%;padding:10px;margin-top:6px;background:#5c3a1a;color:#fff;font-size:.85rem">
      ⚽ Generar placa "Goleadores"
    </button>
  `,
};

let _activeTab = 'noticia';
let _panelOpen = false;

// iOS Safari fix: registrar touchstart en los tabs
function initTabTouchEvents(){
  document.querySelectorAll('.mob-tab').forEach(btn=>{
    btn.addEventListener('touchend', function(e){
      e.preventDefault();
      mobTab(this.dataset.key, this);
    }, {passive:false});
  });
}

function renderMobPanel(){
  const inner = document.getElementById('mobPanelInner');
  if(!inner) return;
  
  // Usar la variable global establecida por el script del HTML
  let activeKey = window._activeTab || 'noticia';
  
  // Si estamos en modo especial (textual, foto, collage), forzar 'noticia'
  // Pero permitir modo futbol y su tab 'mundial'
  if (S.mode !== 'normal' && S.mode !== 'futbol') {
    activeKey = 'noticia';
  }
  if (S.mode === 'futbol' && activeKey === 'noticia') {
    activeKey = 'mundial';
  }
  
  const panelContent = MOB_PANELS[activeKey];
  if (panelContent) {
    inner.innerHTML = panelContent();
  } else {
    inner.innerHTML = '<div class="empty-state">Error: panel no encontrado</div>';
  }
  
  bindMobEvents();
  
  // Renderizar previews de plantilla si es necesario
  if (activeKey === 'plantilla') {
    requestAnimationFrame(() => {
      const plantillas = S.mode === 'futbol'
        ? ['futbol-mañana','futbol-noche','futbol-minimalista','futbol-fifa','futbol-cancha','futbol-atardecer','futbol-celeste','futbol-premium']
        : ['normal','moderna','banda','impacto','diagonal','verde','policiales','clima','urgente','economia','franja','titular','minimalista','policialesrojo','franjarojo','urgenterojo'];
      plantillas.forEach(k => {
        const c = document.getElementById('mtp-'+k);
        if(c && typeof drawPreviewOnCanvas === 'function') drawPreviewOnCanvas(c, k);
      });
    });
  }
  // Refresh calendar in mobile panel
  if (activeKey === 'mundial' && window._calendario) {
    setTimeout(() => window._calendario.refrescar(), 50);
  }
}

function bindMobEvents(){
  const mi=document.getElementById('m-imgUp');
  if(mi) mi.addEventListener('change',loadLocalImg);
  const mbg2=document.getElementById('m-bgUp2');if(mbg2)mbg2.addEventListener('change',loadLocalImg);
  const mtbg=document.getElementById('m-textualBgUp');if(mtbg)mtbg.addEventListener('change',loadLocalImg);
  const mf=document.getElementById('m-fotoUp');if(mf)mf.addEventListener('change',loadFotoImg);
  const mc0=document.getElementById('m-coll0');if(mc0)mc0.addEventListener('change',e=>loadCollageImg(e,0));
  const mc1=document.getElementById('m-coll1');if(mc1)mc1.addEventListener('change',e=>loadCollageImg(e,1));
  const mc2=document.getElementById('m-coll2');if(mc2)mc2.addEventListener('change',e=>loadCollageImg(e,2));
  const mc3=document.getElementById('m-coll3');if(mc3)mc3.addEventListener('change',e=>loadCollageImg(e,3));
  const mq=document.getElementById('m-quoteIn');
  if(mq) mq.addEventListener('input',e=>{S.quote=e.target.value;render();});
  const mqa=document.getElementById('m-quoteAuthorIn');
  if(mqa) mqa.addEventListener('input',e=>{S.quoteAuthor=e.target.value;render();});
  const ml=document.getElementById('m-logoUp');
  if(ml) ml.addEventListener('change',loadLogo);
  const mt=document.getElementById('m-titIn');
  if(mt) mt.addEventListener('input',e=>{S.title=e.target.value;document.getElementById('titIn').value=e.target.value;render();});
  const mc=document.getElementById('m-catIn');
  if(mc) mc.addEventListener('input',e=>{S.cat=e.target.value;document.getElementById('catIn').value=e.target.value;render();});
}

function mobFetch(){
  const u=document.getElementById('m-urlIn');
  if(u){document.getElementById('urlIn').value=u.value;}
  fetchUrl();
}

function syncSlider(key, val){
  // sincronizar con el slider del sidebar desktop
  const el=document.getElementById('r-'+key);
  if(el) el.value=val;
  const rv=document.getElementById('rv-'+key);
  if(rv&&RMAP[key]) rv.textContent=RMAP[key].s(+val);
}

function cargarLogoPredefinido(nombreArchivo) {
  const img = new Image();
  img.onload = () => {
    S.logoImg = img;
    if (ELS.logo) ELS.logo = { x: null, y: null, w: null, h: null, visible: true };
    localStorage.setItem('mm_logo_predefinido_placas', nombreArchivo);
    render();
  };
  img.src = '../assets/' + nombreArchivo;
}

function cambiarLogoPredefinido(valor) {
  cargarLogoPredefinido(valor);
}

function cargarLogoInicialPlacas() {
  const guardado = localStorage.getItem('mm_logo_predefinido_placas') || 'logo.png';
  cargarLogoPredefinido(guardado);
  const select = document.getElementById('selectPredefinedLogo');
  if (select) select.value = guardado;
}

// ── INIT ──
function init(){
  cargarLogoInicialPlacas();
  // Asignar render global para que las banderas CDN puedan refrescar al cargar
  window._render = render;
  // Inicializar variables globales si no existen
  if (window._activeTab === undefined) window._activeTab = 'noticia';
  if (window._panelOpen === undefined) window._panelOpen = false;
  
  // Recuperar última imagen del caché (máx 2 horas)
  try{
    const cached=localStorage.getItem('mm_lastImg');
    const ts=parseInt(localStorage.getItem('mm_lastImg_ts')||'0');
    if(cached && Date.now()-ts < 2*60*60*1000){
      const ci=new Image();
      ci.onload=()=>{S.bgImg=ci;render();drawPreviews();showToast('🖼 Imagen anterior restaurada');};
      ci.src=cached;
    }
  }catch(er){}
  // Esperar un frame para que el DOM mobile tenga dimensiones correctas
  // Doble rAF: iOS Safari necesita dos frames para tener dimensiones correctas
  // Desktop: abrir primer acordeón
  if(window.innerWidth>700){
    const firstHead=document.querySelector('.acc-head');
    if(firstHead&&!firstHead.classList.contains('open'))toggleAcc(firstHead);
  }
  // Mobile: canvas arranca grande, sin panel abierto
  if(window.innerWidth<=700) initTabTouchEvents();
  // Inicializar calendario mundial si existe
  if(typeof inicializarCalendarioMundial === 'function') {
    inicializarCalendarioMundial();
  }
  // Precargar logo mundial
  const mundialLogo = new Image();
  mundialLogo.crossOrigin = 'anonymous';
  mundialLogo.onload = () => { S.mundialLogoImg = mundialLogo; };
  mundialLogo.onerror = () => { S.mundialLogoImg = 'error'; };
  mundialLogo.src = '../assets/logo-mundial.png';
  // Primer render: doble rAF + timeout para garantizar layout completo en todos los browsers
  function doFirstRender(){resizeCanvas();render();drawPreviews();}
  requestAnimationFrame(()=>requestAnimationFrame(doFirstRender));
  setTimeout(doFirstRender, 200);
}
window.addEventListener('resize',()=>{resizeCanvas(true);render();});
window.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo();}
});
window.addEventListener('load',init);
// Asegurar que renderMobPanel esté disponible globalmente
window.renderMobPanel = renderMobPanel;