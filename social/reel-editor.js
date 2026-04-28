// ============================================================
// Media Mendoza — Reel Editor v1.0
// Canvas editor + FFmpeg.wasm export
// ============================================================

const RE = {
  // Canvas
  canvas: null,
  ctx: null,
  scale: 1,
  W: 1080, H: 1920,

  // Estado
  bgImg: null,
  logoImg: null,
  audioBlob: null,
  audioDuration: 0,

  // Elementos arrastrables
  els: {
    logo:  { x: null, y: null, w: null, h: null },
    titulo:{ x: null, y: null, w: null, h: null },
  },

  // Estilos
  S: {
    titulo: '',
    tituloColor: '#ffffff',
    tituloBg: '#000000',
    tituloBgOp: 0.75,
    logoOp: 1,
    bgDark: 0.35,
    bgBlur: 0,
    imgX: 0,
    imgY: 0,
    // Barra inferior estilo MM
    barraActiva: true,
    barraColor: '#a6ce39',
  },

  // Interacción
  active: null,
  action: null,
  dragOff: { x: 0, y: 0 },
  resizeStart: null,

  // FFmpeg
  ffmpegLoaded: false,
  ffmpegLoading: false,
};

const HR = 18; // radio handle

// ── INIT ──
function reelEditorInit() {
  RE.canvas = document.getElementById('reelCanvas');
  RE.ctx = RE.canvas.getContext('2d');
  RE.canvas.width  = RE.W;
  RE.canvas.height = RE.H;

  // Cargar logo MM por defecto
  const li = new Image();
  li.onload = () => {
    RE.logoImg = li;
    reelResetEl('logo');
    reelRender();
  };
  li.src = '../assets/logo.png';
  li.onerror = () => { reelRender(); };

  reelResizeCanvas();
  reelBindEvents();
  reelRender();
  window.addEventListener('resize', () => { reelResizeCanvas(); reelRender(); });
}

// ── CANVAS SIZE ──
function reelResizeCanvas() {
  const wrap = document.getElementById('reelCanvasWrap');
  if (!wrap) return;
  const avW = wrap.clientWidth - 8;
  const avH = window.innerHeight * 0.70;
  const ratio = RE.W / RE.H;
  let dw = avW, dh = dw / ratio;
  if (dh > avH) { dh = avH; dw = dh * ratio; }
  dw = Math.floor(dw); dh = Math.floor(dh);
  RE.canvas.style.width  = dw + 'px';
  RE.canvas.style.height = dh + 'px';
  RE.scale = RE.W / dw;
}

// ── DEFAULT POSITIONS ──
function reelDefaultPos(key) {
  const { W, H } = RE;
  const pad = Math.round(W * 0.05);
  if (key === 'logo') {
    const lw = Math.round(W * 0.42);
    let lh = Math.round(lw * 0.34);
    if (RE.logoImg) lh = Math.round(lw * (RE.logoImg.height / RE.logoImg.width));
    return { x: Math.round((W - lw) / 2), y: Math.round(H * 0.06), w: lw, h: lh };
  }
  if (key === 'titulo') {
    const tw = Math.round(W * 0.88);
    const th = Math.round(H * 0.14);
    return { x: Math.round((W - tw) / 2), y: Math.round(H * 0.38), w: tw, h: th };
  }
}
function reelResetEl(key) {
  const d = reelDefaultPos(key);
  RE.els[key] = { ...d };
}
function reelEnsurePos(key) {
  if (RE.els[key].x === null) reelResetEl(key);
}

// ── RENDER ──
function reelRender() {
  const { W, H, ctx, S } = RE;
  ctx.clearRect(0, 0, W, H);

  // Fondo
  if (RE.bgImg) {
    ctx.save();
    if (S.bgBlur > 0) ctx.filter = `blur(${S.bgBlur}px)`;
    const img = RE.bgImg;
    const ir = img.width / img.height, cr = W / H;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = img.height; sw = sh * cr; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / cr; sx = 0; sy = (img.height - sh) / 2; }
    const ex = img.width - sw, ey = img.height - sh;
    sx = Math.max(0, Math.min(ex, sx + ex * S.imgX));
    sy = Math.max(0, Math.min(ey, sy + ey * S.imgY));
    const p = S.bgBlur * 4;
    ctx.drawImage(img, sx, sy, sw, sh, -p, -p, W + p * 2, H + p * 2);
    ctx.filter = 'none';
    ctx.restore();
    if (S.bgDark > 0) {
      ctx.save(); ctx.globalAlpha = S.bgDark;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  } else {
    // Fondo placeholder degradado
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1a18'); g.addColorStop(1, '#0e0e0c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(166,206,57,.08)';
    ctx.font = `${Math.round(W * 0.035)}px Montserrat,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Cargá una imagen de fondo', W / 2, H / 2);
    ctx.textAlign = 'left';
  }

  // Barra inferior verde MM
  if (S.barraActiva) {
    const bh = Math.round(H * 0.006);
    ctx.fillStyle = S.barraColor;
    ctx.fillRect(0, H - bh, W, bh);
    // también arriba
    ctx.fillRect(0, 0, W, bh);
  }

  // Logo
  reelEnsurePos('logo');
  if (RE.logoImg) {
    const el = RE.els.logo;
    ctx.save(); ctx.globalAlpha = S.logoOp;
    ctx.drawImage(RE.logoImg, el.x, el.y, el.w, el.h);
    ctx.restore();
  }

  // Título
  reelEnsurePos('titulo');
  reelDrawTitulo();

  // UI activo
  if (RE.active) reelDrawActiveUI();
}

function reelDrawTitulo() {
  const { ctx, S, W } = RE;
  const el = RE.els.titulo;
  if (!S.titulo) {
    ctx.save();
    ctx.strokeStyle = 'rgba(166,206,57,.4)';
    ctx.lineWidth = 3; ctx.setLineDash([12, 8]);
    ctx.strokeRect(el.x, el.y, el.w, el.h);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(166,206,57,.35)';
    ctx.font = `${Math.round(el.h * 0.28)}px Montserrat,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Título del reel', el.x + el.w / 2, el.y + el.h / 2);
    ctx.textAlign = 'left';
    ctx.restore(); return;
  }
  // Fondo
  if (S.tituloBg !== 'transparent' && S.tituloBgOp > 0) {
    const r = hexRgb(S.tituloBg);
    ctx.save(); ctx.globalAlpha = S.tituloBgOp;
    ctx.fillStyle = `rgb(${r.r},${r.g},${r.b})`;
    reelRoundRect(el.x, el.y, el.w, el.h, 8);
    ctx.fill(); ctx.restore();
  }
  // Texto
  const pad = Math.round(el.w * 0.04);
  const aw = el.w - pad * 2;
  let sz = Math.max(10, Math.round(el.h * 0.28));
  let lines, lh, bh;
  for (let i = 0; i < 20; i++) {
    ctx.font = `700 ${sz}px 'BebasNeue',Montserrat,sans-serif`;
    lines = reelWrap(S.titulo, aw);
    lh = sz * 1.18; bh = lines.length * lh;
    if (bh <= el.h * 0.9 || sz <= 10) break;
    sz = Math.max(10, Math.round(sz * 0.88));
  }
  ctx.save();
  ctx.fillStyle = S.tituloColor;
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  ctx.font = `700 ${sz}px 'BebasNeue',Montserrat,sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = Math.round(sz * .2);
  const ty = el.y + (el.h - bh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, el.x + el.w / 2, ty + i * lh));
  ctx.restore();
}

// ── HANDLES ──
function reelGetHandles(key) {
  const el = RE.els[key];
  if (!el || el.x === null) return [];
  return [
    { x: el.x,       y: el.y,       id: 'nw' },
    { x: el.x+el.w,  y: el.y,       id: 'ne' },
    { x: el.x,       y: el.y+el.h,  id: 'sw' },
    { x: el.x+el.w,  y: el.y+el.h,  id: 'se' },
    { x: el.x,       y: el.y+el.h/2,id: 'w',  side: true },
    { x: el.x+el.w,  y: el.y+el.h/2,id: 'e',  side: true },
  ];
}

function reelDrawActiveUI() {
  const { ctx, W, H, active } = RE;
  const el = RE.els[active]; if (!el || el.x === null) return;
  const lw = Math.max(2, Math.round(W * .002));
  const hs = Math.round(HR * (W / 1080));
  ctx.save();
  // Guías
  ctx.strokeStyle = 'rgba(166,206,57,.7)'; ctx.lineWidth = lw;
  ctx.setLineDash([Math.round(W*.006), Math.round(W*.003)]);
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
  ctx.setLineDash([]);
  // Borde elemento
  ctx.strokeStyle = 'rgba(166,206,57,.9)'; ctx.lineWidth = lw * 1.5;
  reelRoundRect(el.x, el.y, el.w, el.h, 4); ctx.stroke();
  // Handles
  reelGetHandles(active).forEach(h => {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#a6ce39'; ctx.lineWidth = Math.max(2, lw);
    if (h.side) {
      const hw = hs * .6, hh = hs * 1.2;
      reelRoundRect(h.x - hw/2, h.y - hh/2, hw, hh, hw/2);
    } else {
      ctx.beginPath(); ctx.arc(h.x, h.y, hs * .55, 0, Math.PI*2);
    }
    ctx.fill(); ctx.stroke();
  });
  ctx.restore();
}

// ── EVENTS ──
function reelBindEvents() {
  const c = RE.canvas;
  c.addEventListener('mousedown',  reelOnDown);
  c.addEventListener('touchstart', reelOnDown, { passive: false });
  c.addEventListener('mousemove',  reelOnMove);
  c.addEventListener('touchmove',  reelOnMove, { passive: false });
  c.addEventListener('mouseup',    reelOnUp);
  c.addEventListener('touchend',   reelOnUp);
}

function reelGetPos(e) {
  const rect = RE.canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return { x: (t.clientX - rect.left) * RE.scale, y: (t.clientY - rect.top) * RE.scale };
}

function reelHandleHit(pos, key) {
  const base = Math.round(HR * (RE.W / 1080));
  for (const h of reelGetHandles(key)) {
    const hs = h.side ? base * 2 : base * 2.5;
    if (Math.abs(pos.x - h.x) < hs && Math.abs(pos.y - h.y) < hs) return h.id;
  }
  return null;
}

function reelHitEl(pos) {
  const order = RE.active ? [RE.active, ...Object.keys(RE.els).filter(k => k !== RE.active)] : Object.keys(RE.els);
  for (const k of order) {
    const el = RE.els[k];
    if (!el || el.x === null) continue;
    if (pos.x >= el.x && pos.x <= el.x + el.w && pos.y >= el.y && pos.y <= el.y + el.h) return k;
  }
  return null;
}

function reelOnDown(e) {
  if (e.touches) e.preventDefault();
  const pos = reelGetPos(e);
  if (RE.active) {
    const hid = reelHandleHit(pos, RE.active);
    if (hid) {
      RE.action = 'resize-' + hid;
      RE.resizeStart = { pos: { ...pos }, rect: { ...RE.els[RE.active] },
        logoAR: RE.active === 'logo' && RE.logoImg ? RE.logoImg.width / RE.logoImg.height : null };
      return;
    }
  }
  const k = reelHitEl(pos);
  if (k) { RE.active = k; RE.action = 'drag'; RE.dragOff = { x: pos.x - RE.els[k].x, y: pos.y - RE.els[k].y }; }
  else    { RE.active = null; RE.action = null; }
  reelRender();
}

function reelOnMove(e) {
  if (e.touches) e.preventDefault();
  const pos = reelGetPos(e);
  const { W, H } = RE;
  const SNAP = W * .012;
  if (!RE.action) {
    if (RE.active && reelHandleHit(pos, RE.active)) { RE.canvas.style.cursor = 'nwse-resize'; return; }
    RE.canvas.style.cursor = reelHitEl(pos) ? 'grab' : 'default'; return;
  }
  const el = RE.els[RE.active];
  if (RE.action === 'drag') {
    let nx = pos.x - RE.dragOff.x, ny = pos.y - RE.dragOff.y;
    if (Math.abs(nx + el.w/2 - W/2) < SNAP) nx = W/2 - el.w/2;
    if (Math.abs(ny + el.h/2 - H/2) < SNAP) ny = H/2 - el.h/2;
    el.x = nx; el.y = ny;
  }
  if (RE.action.startsWith('resize-')) {
    const corner = RE.action.slice(7), rs = RE.resizeStart;
    const dx = pos.x - rs.pos.x, dy = pos.y - rs.pos.y;
    const MIN = W * .04;
    let { x, y, w, h } = rs.rect;
    if (rs.logoAR) {
      const AR = rs.logoAR;
      if (corner==='se') { w=Math.max(MIN,w+dx); h=w/AR; }
      else if(corner==='sw') { const nw=Math.max(MIN,w-dx); x=rs.rect.x+rs.rect.w-nw; w=nw; h=w/AR; }
      else if(corner==='ne') { w=Math.max(MIN,w+dx); const nh=w/AR; y=rs.rect.y+rs.rect.h-nh; h=nh; }
      else if(corner==='nw') { const nw=Math.max(MIN,w-dx); x=rs.rect.x+rs.rect.w-nw; w=nw; const nh=w/AR; y=rs.rect.y+rs.rect.h-nh; h=nh; }
    } else {
      if(corner==='se') { w=Math.max(MIN,w+dx); h=Math.max(MIN,h+dy); }
      else if(corner==='sw') { const nw=Math.max(MIN,w-dx); x=rs.rect.x+rs.rect.w-nw; w=nw; h=Math.max(MIN,h+dy); }
      else if(corner==='ne') { w=Math.max(MIN,w+dx); const nh=Math.max(MIN,h-dy); y=rs.rect.y+rs.rect.h-nh; h=nh; }
      else if(corner==='nw') { const nw=Math.max(MIN,w-dx); x=rs.rect.x+rs.rect.w-nw; w=nw; const nh=Math.max(MIN,h-dy); y=rs.rect.y+rs.rect.h-nh; h=nh; }
      else if(corner==='e') { w=Math.max(MIN,w+dx); }
      else if(corner==='w') { const nw=Math.max(MIN,w-dx); x=rs.rect.x+rs.rect.w-nw; w=nw; }
    }
    el.x=x; el.y=y; el.w=w; el.h=h;
  }
  reelRender();
}
function reelOnUp() { RE.action = null; RE.canvas.style.cursor = RE.active ? 'grab' : 'default'; }

// ── LOAD BG ──
function reelLoadBg(file) {
  const rd = new FileReader();
  rd.onload = e => {
    const img = new Image();
    img.onload = () => { RE.bgImg = img; reelRender(); };
    img.src = e.target.result;
  };
  rd.readAsDataURL(file);
}

// ── LOAD LOGO ──
function reelLoadLogo(file) {
  const rd = new FileReader();
  rd.onload = e => {
    const img = new Image();
    img.onload = () => { RE.logoImg = img; reelResetEl('logo'); reelRender(); };
    img.src = e.target.result;
  };
  rd.readAsDataURL(file);
}

// ── EXPORT VIDEO con FFmpeg.wasm ──
async function reelExportVideo() {
  if (!RE.audioBlob) { reelToast('Primero generá o cargá el audio'); return; }
  const btn = document.getElementById('btnExportVideo');
  const prog = document.getElementById('reelExportProgress');
  const progTxt = document.getElementById('reelExportProgressTxt');
  btn.disabled = true;
  prog.style.display = 'flex';

  try {
    progTxt.textContent = 'Preparando canvas...';
    // 1. Capturar frame del canvas (sin UI)
    RE.active = null;
    reelRender();

    // Obtener duración del audio
    const audioDur = await reelGetAudioDuration(RE.audioBlob);

    progTxt.textContent = 'Cargando FFmpeg.wasm...';
    const { FFmpeg } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js');
    const { fetchFile, toBlobURL } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js');

    const ffmpeg = new FFmpeg();
    ffmpeg.on('progress', ({ progress }) => {
      progTxt.textContent = `Renderizando video... ${Math.round(progress * 100)}%`;
    });
    ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message));

    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    progTxt.textContent = 'Procesando imagen...';
    // 2. Canvas → PNG blob
    const imgBlob = await new Promise(res => RE.canvas.toBlob(res, 'image/png'));
    await ffmpeg.writeFile('frame.png', await fetchFile(imgBlob));

    // 3. Audio → archivo
    const audioExt = RE.audioBlob.type.includes('webm') ? 'webm' :
                     RE.audioBlob.type.includes('ogg')  ? 'ogg'  : 'mp3';
    await ffmpeg.writeFile('audio.' + audioExt, await fetchFile(RE.audioBlob));

    progTxt.textContent = 'Generando MP4...';
    // 4. FFmpeg: imagen estática + audio → MP4
    // -loop 1: imagen en bucle, -t: duración del audio
    await ffmpeg.exec([
      '-loop', '1',
      '-i', 'frame.png',
      '-i', 'audio.' + audioExt,
      '-c:v', 'libx264',
      '-tune', 'stillimage',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      '-shortest',
      '-t', String(Math.ceil(audioDur + 0.5)),
      '-movflags', '+faststart',
      'output.mp4'
    ]);

    progTxt.textContent = 'Finalizando...';
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url  = URL.createObjectURL(blob);

    // Preview
    const video = document.getElementById('reelVideoPreview');
    const dl    = document.getElementById('reelVideoDownload');
    video.src = url;
    dl.href   = url;
    dl.download = `reel-mediamendoza-${Date.now()}.mp4`;
    document.getElementById('reelVideoResult').style.display = 'block';
    video.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    reelToast('✅ Video generado correctamente');

  } catch (err) {
    console.error(err);
    reelToast('Error: ' + err.message);
  }

  btn.disabled = false;
  prog.style.display = 'none';
}

function reelGetAudioDuration(blob) {
  return new Promise(resolve => {
    const au = new Audio();
    au.onloadedmetadata = () => resolve(isFinite(au.duration) ? au.duration : 30);
    au.onerror = () => resolve(30);
    au.src = URL.createObjectURL(blob);
  });
}

// ── HELPERS ──
function reelWrap(text, maxW) {
  if (!text || maxW <= 0) return [];
  const words = text.split(' ').filter(w => w.length > 0);
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (cur && RE.ctx.measureText(test).width > maxW) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur.trim()) lines.push(cur);
  return lines;
}
function reelRoundRect(x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  RE.ctx.beginPath();
  RE.ctx.moveTo(x+r,y); RE.ctx.lineTo(x+w-r,y); RE.ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  RE.ctx.lineTo(x+w,y+h-r); RE.ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  RE.ctx.lineTo(x+r,y+h); RE.ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  RE.ctx.lineTo(x,y+r); RE.ctx.quadraticCurveTo(x,y,x+r,y); RE.ctx.closePath();
}
function hexRgb(hex) {
  if (!hex || hex === 'transparent') return { r:0,g:0,b:0 };
  return { r:parseInt(hex.slice(1,3),16), g:parseInt(hex.slice(3,5),16), b:parseInt(hex.slice(5,7),16) };
}
function reelToast(msg) {
  const t = document.getElementById('toast');
  if (!t) { alert(msg); return; }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── SINCRONIZAR controles ──
function reelSyncControls() {
  const s = RE.S;
  const id = (i, v) => { const el=document.getElementById(i); if(el) el.value=v; };
  const txt = (i, v) => { const el=document.getElementById(i); if(el) el.textContent=v; };
  id('re-tituloInput',   s.titulo);
  id('re-tituloColor',   s.tituloColor);
  id('re-tituloBg',      s.tituloBg);
  id('re-tituloBgOp',    Math.round(s.tituloBgOp*100));
  txt('re-tituloBgOpV',  Math.round(s.tituloBgOp*100)+'%');
  id('re-bgDark',        Math.round(s.bgDark*100));
  txt('re-bgDarkV',      Math.round(s.bgDark*100)+'%');
  id('re-bgBlur',        s.bgBlur);
  txt('re-bgBlurV',      s.bgBlur+'px');
  id('re-logoOp',        Math.round(s.logoOp*100));
  txt('re-logoOpV',      Math.round(s.logoOp*100)+'%');
}

window.RE = RE;
window.reelEditorInit     = reelEditorInit;
window.reelLoadBg         = reelLoadBg;
window.reelLoadLogo       = reelLoadLogo;
window.reelExportVideo    = reelExportVideo;
window.reelResizeCanvas   = reelResizeCanvas;
window.reelRender         = reelRender;
window.reelResetEl        = reelResetEl;
window.reelSyncControls   = reelSyncControls;