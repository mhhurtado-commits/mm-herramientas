// v3.1
const WORKER='https://twilight-river-3072.mhhurtado.workers.dev';
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
    const lw=Math.round(W*.312); // W*.26 * 1.2
    const lh=Math.round(lw*(S.logoImg.height/S.logoImg.width));
    if(S.tpl==='normal')return{x:Math.round((W-lw)/2),y:H-lh-pad,w:lw,h:lh};
    return{x:W-lw-pad,y:pad,w:lw,h:lh};
  }
  if(key==='foto'){
    const fs=Math.round(W*S.fotoSize);
    return{x:Math.round(W*S.fotoX-fs/2),y:Math.round(H*S.fotoY-fs/2),w:fs,h:fs};
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
  } else {
    // Modo especial: ocultar acordeones, mostrar solo el panel correcto
    document.querySelectorAll('.normal-only').forEach(el=>el.style.display='none');
    document.querySelectorAll('[id^="special-panel-"]').forEach(el=>{
      el.style.display=el.id==='special-panel-'+m?'block':'none';
    });
  }
  // Actualizar panel mobile si está abierto
  if(typeof _panelOpen!=='undefined'&&_panelOpen) renderMobPanel();
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
function setCL(el){
  document.querySelectorAll('[id^="cl-"]').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');
  // mostrar/ocultar slots según cuántas imágenes necesita el layout
  const needs4=S.collageLayout==='4';
  const needs3=S.collageLayout.startsWith('3')||needs4;
  const s2=document.getElementById('coll-slot-2');
  const s3=document.getElementById('coll-slot-3');
  if(s2)s2.style.display=needs3?'':'none';
  if(s3)s3.style.display=needs4?'':'none';
  snapShot();render();
}

// ── RENDER TEXTUAL ──
function renderTextual(W,H){
  const style=S.quoteStyle;
  const pos=S.quotePos;   // 'left'|'right'|'top'|'bottom'
  const sp=S.quoteSplit;  // fracción del panel de color
  const pad=Math.round(W*.05);

  // ── Calcular rects: imgRect y colorRect ──
  let ir={x:0,y:0,w:W,h:H}, cr={x:0,y:0,w:W,h:H};
  if(pos==='left'){
    cr={x:0,y:0,w:Math.round(W*sp),h:H};
    ir={x:Math.round(W*sp),y:0,w:W-Math.round(W*sp),h:H};
  } else if(pos==='right'){
    ir={x:0,y:0,w:Math.round(W*(1-sp)),h:H};
    cr={x:Math.round(W*(1-sp)),y:0,w:W-Math.round(W*(1-sp)),h:H};
  } else if(pos==='top'){
    cr={x:0,y:0,w:W,h:Math.round(H*sp)};
    ir={x:0,y:Math.round(H*sp),w:W,h:H-Math.round(H*sp)};
  } else { // bottom
    ir={x:0,y:0,w:W,h:Math.round(H*(1-sp))};
    cr={x:0,y:Math.round(H*(1-sp)),w:W,h:H-Math.round(H*(1-sp))};
  }

  // ── Dibujar imagen nítida en ir ──
  if(S.bgImg){
    ctx.save();ctx.beginPath();ctx.rect(ir.x,ir.y,ir.w,ir.h);ctx.clip();
    const img=S.bgImg,ira=img.width/img.height,cra=ir.w/ir.h;
    let sx,sy,sw,sh;
    if(ira>cra){sh=img.height;sw=sh*cra;sx=(img.width-sw)/2;sy=0;}
    else{sw=img.width;sh=sw/cra;sx=0;sy=(img.height-sh)/2;}
    ctx.drawImage(img,sx,sy,sw,sh,ir.x,ir.y,ir.w,ir.h);
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

function render(){
  const fmt=FMTS[S.fmt];const W=fmt.w,H=fmt.h;
  ctx.clearRect(0,0,W,H);
  // Desviar a modos especiales
  if(S.mode==='textual'){renderTextual(W,H);if(S.active)drawActiveUI(W,H);return;}
  if(S.mode==='foto'){renderFoto(W,H);if(S.active)drawActiveUI(W,H);return;}
  if(S.mode==='collage'){renderCollage(W,H);if(S.active)drawActiveUI(W,H);return;}
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
  if(key!=='logo'&&key!=='foto'){
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
  const base=S.mode==='foto'?['foto','title','cat','logo']:['title','cat','logo'];
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
        logoAR:S.active==='logo'&&S.logoImg?S.logoImg.width/S.logoImg.height:null,
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
  S.tpl=t;resetEls();
  document.querySelectorAll('.tpl-btn').forEach(b=>b.classList.remove('on'));
  const btn=document.getElementById('tpl-'+t);if(btn)btn.classList.add('on');
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
    S._waDesc=data.description||'';
    S._waBody=data.body||'';
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
  noticia: ()=>`
    <div class="mode-bar" style="margin-bottom:10px">
      <div class="mode-btn ${S.mode==='normal'?'on':''}"   onclick="setMode('normal')"  >📰 Normal</div>
      <div class="mode-btn ${S.mode==='textual'?'on':''}"  onclick="setMode('textual')" >💬 Textual</div>
      <div class="mode-btn ${S.mode==='foto'?'on':''}"     onclick="setMode('foto')"    >👤 Foto</div>
      <div class="mode-btn ${S.mode==='collage'?'on':''}"  onclick="setMode('collage')" >🖼 Collage</div>
    </div>
    ${S.mode==='textual'?`
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
      <div class="rrow"><input type="range" min="30" max="70" value="${Math.round(S.quoteSplit*100)}"
        oninput="S.quoteSplit=this.value/100;ELS.title._textualInit=null;document.getElementById('m-rv-qsplit').textContent=this.value+'%';render()"></div>
      <label class="uplbl" for="m-textualBgUp" style="margin-top:6px">📁 Foto de fondo (opcional)</label>
      <input type="file" id="m-textualBgUp" accept="image/*">
      <button class="btn-reset" onclick="S.bgImg=null;render()" style="margin-top:4px;width:100%;text-align:center">✕ Quitar foto</button>
      <label class="fl" style="margin-top:8px">Color del texto</label>
      <div class="swatches">
        <input type="color" value="${S.quoteTextCol||'#111111'}" oninput="S.quoteTextCol=this.value;render()">
        <div class="sw on" style="background:linear-gradient(135deg,#111 50%,#fff 50%);border-color:#ccc" onclick="S.quoteTextCol='';render()" title="Auto"></div>
        <div class="sw" style="background:#fff;border-color:#ccc" onclick="S.quoteTextCol='#ffffff';render()"></div>
        <div class="sw" style="background:#111" onclick="S.quoteTextCol='#111111';render()"></div>
        <div class="sw" style="background:#a6ce39" onclick="S.quoteTextCol='#a6ce39';render()"></div>
      </div>
    `:''}
    ${S.mode==='foto'?`
      <label class="uplbl" for="m-bgUp2">📁 Imagen de fondo (noticia)</label>
      <input type="file" id="m-bgUp2" accept="image/*">
      <label class="uplbl" for="m-fotoUp" style="margin-top:6px">📁 Foto persona (círculo)</label>
      <input type="file" id="m-fotoUp" accept="image/*">
      <div style="background:var(--g10);border-radius:5px;padding:6px 8px;margin:6px 0;font-size:.74rem;color:var(--g70)">
        👆 Arrastrá y redimensionás la foto sobre el canvas.
      </div>
      <label class="fl" style="margin-top:4px">Forma del contenedor</label>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:4px 0 6px">
        <div class="tpl-btn ${S.fotoShape==='circle' ?'on':''}" onclick="S.fotoShape='circle'; render();renderMobPanel()" style="padding:5px;font-size:.85rem">⬤</div>
        <div class="tpl-btn ${S.fotoShape==='square' ?'on':''}" onclick="S.fotoShape='square'; render();renderMobPanel()" style="padding:5px;font-size:.85rem">⬛</div>
        <div class="tpl-btn ${S.fotoShape==='diamond'?'on':''}" onclick="S.fotoShape='diamond';render();renderMobPanel()" style="padding:5px;font-size:.85rem">◆</div>
        <div class="tpl-btn ${S.fotoShape==='hexagon'?'on':''}" onclick="S.fotoShape='hexagon';render();renderMobPanel()" style="padding:5px;font-size:.85rem">⬡</div>
      </div>
    `:''}
    ${S.mode==='collage'?`
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:6px 0 10px">
        <div class="tpl-btn ${S.collageLayout==='2h'?'on':''}" onclick="S.collageLayout='2h';render();renderMobPanel()" style="padding:5px 2px;font-size:.68rem">⬜⬜</div>
        <div class="tpl-btn ${S.collageLayout==='2v'?'on':''}" onclick="S.collageLayout='2v';render();renderMobPanel()" style="padding:5px 2px;font-size:.68rem">🔲</div>
        <div class="tpl-btn ${S.collageLayout==='3t'?'on':''}" onclick="S.collageLayout='3t';render();renderMobPanel()" style="padding:5px 2px;font-size:.62rem">1↑2↓</div>
        <div class="tpl-btn ${S.collageLayout==='3b'?'on':''}" onclick="S.collageLayout='3b';render();renderMobPanel()" style="padding:5px 2px;font-size:.62rem">2↑1↓</div>
        <div class="tpl-btn ${S.collageLayout==='3l'?'on':''}" onclick="S.collageLayout='3l';render();renderMobPanel()" style="padding:5px 2px;font-size:.62rem">1←2→</div>
        <div class="tpl-btn ${S.collageLayout==='3r'?'on':''}" onclick="S.collageLayout='3r';render();renderMobPanel()" style="padding:5px 2px;font-size:.62rem">2←1→</div>
        <div class="tpl-btn ${S.collageLayout==='4' ?'on':''}" onclick="S.collageLayout='4'; render();renderMobPanel()" style="padding:5px 2px;font-size:.68rem">⊞</div>
      </div>
      <div class="collage-slots">
        <label class="collage-slot" for="m-coll0"><div>🖼</div><div style="font-size:.7rem">Img 1</div><input type="file" id="m-coll0" accept="image/*" style="display:none"></label>
        <label class="collage-slot" for="m-coll1"><div>🖼</div><div style="font-size:.7rem">Img 2</div><input type="file" id="m-coll1" accept="image/*" style="display:none"></label>
        ${S.collageLayout.startsWith('3')||S.collageLayout==='4'?`<label class="collage-slot" for="m-coll2"><div>🖼</div><div style="font-size:.7rem">Img 3</div><input type="file" id="m-coll2" accept="image/*" style="display:none"></label>`:''}
        ${S.collageLayout==='4'?`<label class="collage-slot" for="m-coll3"><div>🖼</div><div style="font-size:.7rem">Img 4</div><input type="file" id="m-coll3" accept="image/*" style="display:none"></label>`:''}
      </div>
    `:''}
    <label class="fl" style="margin-top:4px">Formato</label>
    <select onchange="setFmt(this.value);this.blur()" style="margin-bottom:8px">
      ${['sq','story','portrait','fb','tw'].map(f=>`<option value="${f}" ${S.fmt===f?'selected':''}>${{sq:'Instagram Cuadrado (1080×1080)',story:'Historia (1080×1920)',portrait:'Portrait (1080×1350)',fb:'Facebook (1200×628)',tw:'Twitter / X (1600×900)'}[f]}</option>`).join('')}
    </select>
    <div class="urlrow">
      <input type="url" id="m-urlIn" placeholder="https://mediamendoza.com/..." value="${document.getElementById('urlIn').value}">
      <button class="urlbtn" onclick="mobFetch()">→</button>
    </div>
    <button class="btn btn-wa" onclick="openWAModal()" style="width:100%;margin:6px 0 2px;padding:9px;border-radius:7px;font-size:.82rem;font-weight:700;border:none;cursor:pointer;background:#25d366;color:#fff">💬 Generar mensaje WhatsApp</button>
    <label class="fl">Título</label>
    <textarea id="m-titIn" rows="2">${S.title}</textarea>
    <label class="fl">Categoría</label>
    <input type="text" id="m-catIn" value="${S.cat}" placeholder="Ej: Mendoza...">
    <label class="uplbl" for="m-imgUp">📁 Subir imagen</label>
    <input type="file" id="m-imgUp" accept="image/*">`,

  plantilla: ()=>`
    <div class="tpl-grid">
      ${['normal','moderna','banda','impacto','diagonal','verde','policiales','clima','urgente','economia','franja','titular','minimalista','policialesrojo','franjarojo','urgenterojo'].map(k=>`
        <div class="tpl-btn ${S.tpl===k?'on':''}" onclick="setTpl('${k}');renderMobPanel()">
          <canvas class="tpl-prev" id="mtp-${k}"></canvas>
          <div class="tpl-name">${{normal:'Normal',moderna:'Moderna',banda:'Banda',impacto:'Impacto',diagonal:'Diagonal',verde:'Verde MM',policiales:'Policiales',clima:'Clima',urgente:'Urgente',economia:'Economía',franja:'Franja',titular:'Titular',minimalista:'Minimalista',policialesrojo:'Policiales 🔴',franjarojo:'Franja 🔴',urgenterojo:'Urgente 🔴'}[k]}</div>
        </div>`).join('')}
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

  logo: ()=>`
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
    <label class="uplbl" for="m-logoUp">📁 Cambiar logo</label>
    <input type="file" id="m-logoUp" accept="image/*">
    <label class="fl">Opacidad <span class="rval" id="m-rv-lOp">${Math.round(S.lOp*100)}%</span></label>
    <div class="rrow"><input type="range" min="10" max="100" value="${Math.round(S.lOp*100)}" oninput="S.lOp=this.value/100;document.getElementById('m-rv-lOp').textContent=this.value+'%';syncSlider('lOp',this.value);render()"></div>`,
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

function mobTab(key, tabEl){
  const panel = document.getElementById('mobPanel');
  const canvasArea = document.getElementById('canvasArea');
  if(_activeTab === key && _panelOpen){
    // cerrar con animación
    panel.classList.add('closing');
    canvasArea.classList.remove('panel-open'); // canvas crece durante animación
    document.querySelectorAll('.mob-tab').forEach(t=>t.classList.remove('on'));
    _panelOpen = false;
    setTimeout(()=>{
      panel.classList.remove('open');
      panel.classList.remove('closing');
      resizeCanvas(true); render(); // redibujar manteniendo posiciones
    }, 260);
    return;
  }
  _activeTab = key;
  _panelOpen = true;
  document.querySelectorAll('.mob-tab').forEach(t=>t.classList.remove('on'));
  tabEl.classList.add('on');
  renderMobPanel();
  panel.classList.remove('closing');
  panel.classList.add('open');
  canvasArea.classList.add('panel-open');
  // redibujar tras la transición (doble para iOS/Android)
  setTimeout(()=>{ resizeCanvas(true); render(); }, 280);
  setTimeout(()=>{ resizeCanvas(true); render(); }, 350);
}

function renderMobPanel(){
  const inner = document.getElementById('mobPanelInner');
  if(!inner) return;
  inner.innerHTML = MOB_PANELS[_activeTab]?MOB_PANELS[_activeTab]():'';
  // bind events
  bindMobEvents();
  // draw previews in plantilla panel
  if(_activeTab==='plantilla'){
    requestAnimationFrame(()=>{
      ['normal','moderna','banda','impacto','diagonal','verde','policiales','clima','urgente','economia','franja','titular','minimalista','policialesrojo','franjarojo','urgenterojo'].forEach(k=>{
        const c=document.getElementById('mtp-'+k);if(!c)return;
        drawPreviewOnCanvas(c,k);
      });
    });
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

// ══════════════════════════════════════════
// GENERADOR DE MENSAJES WHATSAPP
// ══════════════════════════════════════════

const WA_PROMPT = `Sos el Editor de Redes Sociales de Media Mendoza, un diario digital del sur mendocino (San Rafael, General Alvear y Malargüe). Tu objetivo es convertir notas periodísticas en mensajes atractivos, claros y optimizados para WhatsApp.

TONO: Cordial, informativo, profesional pero cercano al vecino mendocino. Español rioplatense (usá "vos", "tenés", "leé").

REGLAS DE ORO:
1. No inventar datos. No completar información que no esté en el texto de entrada.
2. Solo incluir el link si el usuario lo proporciona. Prohibido inventar URLs.
3. CIUDAD: Media Mendoza cubre el sur mendocino. La ciudad por defecto es SAN RAFAEL. Usá "GENERAL ALVEAR" o "MALARGÜE" solo si la nota lo menciona explícitamente. Nunca usar solo "MENDOZA" — siempre la ciudad específica del sur.
4. CATEGORÍA: Es clave para el tono y los emojis. Policiales → tono urgente, emoji 🚨. Política → 🏛️. Economía → 💰. Deportes → ⚽. Cultura → 🎭. Salud → 🏥. Clima/Tiempo → 🌦️. Turismo → 🏔️. Sociedad/Comunidad → 👥. Usá la categoría para elegir el emoji del encabezado y para darle el tono correcto al mensaje.
5. URL CORTA: Si la URL tiene la forma https://mediamendoza.com/categoria/123456-texto-largo, acortarla a https://mediamendoza.com/categoria/123456 — solo dominio + categoría + número de nota, sin el slug de texto.
6. Para el mensaje de GRUPO: crear un gancho que genere tensión/curiosidad sin revelar el desenlace. Máximo 3 líneas antes del link.
7. Longitud máxima: Grupo = 8 líneas totales. Canal = 12 líneas totales.

FORMATO DE SALIDA — MUY IMPORTANTE: responder ÚNICAMENTE con el siguiente JSON, sin ningún texto antes ni después, sin backticks, sin markdown:
{"grupo":"mensaje completo aquí","canal":"mensaje completo aquí"}

Si el mensaje incluye comillas dobles dentro del texto, reemplazarlas por comillas simples.
No usar saltos de línea dentro de los valores JSON — usar el caracter \n como texto.

ESTRUCTURA GRUPO (Estilo Alerta):
- Encabezado: [emoji categoría] *CIUDAD: TITULAR GANCHO EN MAYÚSCULAS*
- Bajada: 2-3 líneas con el dato más impactante, SIN revelar el desenlace
- CTA: 🔗 *LEÉ LA NOTA COMPLETA:* 👉 [URL corta]
- Cierre: *¡Sumate!* 📱 https://bit.ly/mediamendoza-grupo 📣 https://bit.ly/mediamendoza-canal
- Firma: *📰 Media Mendoza - Noticias confiables del sur mendocino*

ESTRUCTURA CANAL (Estilo Resumen):
- Encabezado: [emoji] *CIUDAD: TITULAR EN MAYÚSCULAS*
- Bullets con: • Qué pasó • Quiénes intervienen • Dónde/Cuándo • Situación actual
- CTA: 🔗 *MÁS DETALLES:* 👉 [URL corta]
- Firma: *📰 Media Mendoza - Noticias confiables del sur mendocino*`;

let _waTab = 'grupo';
let _waMessages = {grupo:'', canal:''};
let _waGenerating = false;

function openWAModal(){
  if(!S.title){showToast('Primero cargá una nota con título');return;}
  document.getElementById('waModalBg').classList.add('open');
  waGenerate();
}
function closeWAModal(){
  document.getElementById('waModalBg').classList.remove('open');
}
function waSetTab(tab){
  _waTab=tab;
  document.querySelectorAll('.wa-tab').forEach(t=>t.classList.remove('on'));
  document.getElementById('wa-tab-'+tab).classList.add('on');
  const msg=document.getElementById('waMsg');
  if(_waMessages[tab]){
    msg.classList.remove('loading');
    msg.textContent=_waMessages[tab];
  } else {
    msg.classList.add('loading');
    msg.textContent='Generando...';
  }
}
function waCopy(){
  const text=_waMessages[_waTab];
  if(!text){showToast('Esperá que termine de generar');return;}
  navigator.clipboard.writeText(text).then(()=>{
    showToast('✅ Mensaje copiado al portapapeles');
  }).catch(()=>{
    // fallback
    const ta=document.createElement('textarea');
    ta.value=text;document.body.appendChild(ta);ta.select();
    document.execCommand('copy');document.body.removeChild(ta);
    showToast('✅ Mensaje copiado');
  });
}
async function waGenerate(){
  if(_waGenerating)return;
  _waGenerating=true;
  _waMessages={grupo:'',canal:''};
  const msg=document.getElementById('waMsg');
  msg.classList.add('loading');
  msg.textContent='Generando mensajes con IA...';

  const urlRaw=document.getElementById('urlIn').value.trim();
  // Acortar URL: quedarse solo con dominio/categoria/número-de-nota
  let url=urlRaw;
  if(url){
    try{
      const u=new URL(url);
      const parts=u.pathname.split('/').filter(Boolean);
      // parts[0]=categoria, parts[1]=123456-slug → tomar solo los dígitos iniciales
      if(parts.length>=2){
        const numMatch=parts[1].match(/^(\d+)/);
        if(numMatch) url=u.origin+'/'+parts[0]+'/'+numMatch[1];
      }
    }catch(e){}
  }
  const titulo=S.title||'';
  const categoria=S.cat||'';
  const extra=document.getElementById('waExtraInput')?.value.trim()||'';

  const desc=S._waDesc||'';
  const body=S._waBody||'';
  const entrada=`Título: ${titulo}
Categoría: ${categoria}${desc?'\nDescripción: '+desc:''}${body?'\nContenido de la nota: '+body:''}${url?'\nURL: '+url:''}${extra?'\nContexto adicional: '+extra:''}`;

  try{
    // El Worker hace de proxy para evitar CORS con la API de Anthropic
    const res=await fetch(WORKER+'?ai=1',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        system:WA_PROMPT,
        user:'Generá los dos mensajes para esta nota:\n\n'+entrada
      })
    });
    if(!res.ok){
      const errText=await res.text();
      throw new Error('Worker error '+res.status+': '+errText);
    }
    const data=await res.json();
    if(data.error) throw new Error(data.error);
    const raw=typeof data==='string'?data:(data.text||data.content||'');
    if(!raw) throw new Error('Respuesta vacía del modelo');

    // Estrategia 1: intentar parsear JSON
    let parsed=null;
    try{
      let clean=raw.replace(/```json/gi,'').replace(/```/g,'').trim();
      const jsonMatch=clean.match(/\{[\s\S]*\}/);
      if(jsonMatch) parsed=JSON.parse(jsonMatch[0]);
    }catch(e){}

    // Estrategia 2: buscar delimitadores ===GRUPO=== y ===CANAL===
    if(!parsed){
      const gMatch=raw.match(/===GRUPO===[\s\S]*?\n([\s\S]*?)(?===CANAL===|$)/i);
      const cMatch=raw.match(/===CANAL===[\s\S]*?\n([\s\S]*?)$/i);
      if(gMatch||cMatch){
        parsed={
          grupo:(gMatch?gMatch[1].trim():''),
          canal:(cMatch?cMatch[1].trim():'')
        };
      }
    }

    // Estrategia 3: usar toda la respuesta como grupo, indicar que faltó el canal
    if(!parsed){
      parsed={grupo:raw.trim(), canal:'(Regenerá para obtener versión canal)'};
    }

    _waMessages.grupo=parsed.grupo||'No se pudo generar el mensaje de grupo.';
    _waMessages.canal=parsed.canal||'No se pudo generar el mensaje de canal.';
  }catch(e){
    console.error('WA generate error:',e);
    _waMessages.grupo='Error: '+e.message;
    _waMessages.canal=_waMessages.grupo;
  }

  _waGenerating=false;
  msg.classList.remove('loading');
  msg.textContent=_waMessages[_waTab];
}

// ── INIT ──
function init(){
  const img=new Image();
  img.onload=()=>{S.logoImg=img;render();drawPreviews();};
  img.src='data:image/png;base64,'+LOGO_B64;
  document.getElementById('hLogo').src='data:image/png;base64,'+LOGO_B64;
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
