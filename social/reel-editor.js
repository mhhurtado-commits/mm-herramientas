// ============================================================
// Media Mendoza — Reel Editor v1.1
// Canvas editor + FFmpeg.wasm export
// ============================================================

const RE = {
  canvas: null,
  ctx: null,
  scale: 1,
  W: 1080, H: 1920,
  bgImg: null,
  logoImg: null,
  audioBlob: null,
  els: {
    logo:   { x: null, y: null, w: null, h: null },
    titulo: { x: null, y: null, w: null, h: null },
  },
  S: {
    titulo: '',
    tituloColor: '#ffffff',
    tituloBg: '#000000',
    tituloBgOp: 0.75,
    logoOp: 1,
    bgDark: 0.35,
    bgBlur: 0,
    barraActiva: true,
    barraColor: '#a6ce39',
  },
  active: null,
  action: null,
  dragOff: { x: 0, y: 0 },
  resizeStart: null,
  fontLoaded: false,
};

const HR = 20; // radio handle en coords canvas

// ── INIT ──
function reelEditorInit() {
  RE.canvas = document.getElementById('reelCanvas');
  RE.ctx    = RE.canvas.getContext('2d');
  RE.canvas.width  = RE.W;
  RE.canvas.height = RE.H;

  // Cargar fuente BebasNeue desde el proyecto
  const font = new FontFace('BebasNeue', 'url(/placas/BebasNeue-Regular.ttf)');
  font.load().then(f => {
    document.fonts.add(f);
    RE.fontLoaded = true;
    reelRender();
  }).catch(() => {
    RE.fontLoaded = true; // continuar igual con fallback
    reelRender();
  });

  // Logo MM por defecto
  const li = new Image();
  li.onload = () => { RE.logoImg = li; reelResetEl('logo'); reelRender(); };
  li.onerror = () => { reelRender(); };
  li.src = '../assets/logo.png';

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
  const avH = window.innerHeight * 0.72;
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
  if (key === 'logo') {
    const lw = Math.round(W * 0.42);
    const lh = RE.logoImg ? Math.round(lw * RE.logoImg.height / RE.logoImg.width) : Math.round(lw * 0.34);
    return { x: Math.round((W - lw) / 2), y: Math.round(H * 0.06), w: lw, h: lh };
  }
  if (key === 'titulo') {
    const tw = Math.round(W * 0.88);
    const th = Math.round(H * 0.14);
    return { x: Math.round((W - tw) / 2), y: Math.round(H * 0.38), w: tw, h: th };
  }
}
function reelResetEl(key) { RE.els[key] = { ...reelDefaultPos(key) }; }
function reelEnsurePos(key) { if (RE.els[key].x === null) reelResetEl(key); }

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
    else         { sw = img.width;  sh = sw / cr; sx = 0; sy = (img.height - sh) / 2; }
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
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1a18'); g.addColorStop(1, '#0e0e0c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(166,206,57,.08)';
    ctx.font = `${Math.round(W * 0.033)}px Inter,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Cargá una imagen de fondo', W / 2, H / 2);
    ctx.textAlign = 'left';
  }

  // Barras MM
  if (S.barraActiva) {
    const bh = Math.round(H * 0.006);
    ctx.fillStyle = S.barraColor;
    ctx.fillRect(0, 0, W, bh);
    ctx.fillRect(0, H - bh, W, bh);
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

  // UI de selección (encima de todo)
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
    ctx.font = `${Math.round(el.h * 0.28)}px Inter,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Título del reel', el.x + el.w / 2, el.y + el.h / 2);
    ctx.textAlign = 'left'; ctx.restore(); return;
  }
  // Fondo
  if (S.tituloBg !== 'transparent' && S.tituloBgOp > 0) {
    const r = hexRgb(S.tituloBg);
    ctx.save(); ctx.globalAlpha = S.tituloBgOp;
    ctx.fillStyle = `rgb(${r.r},${r.g},${r.b})`;
    reelRoundRect(el.x, el.y, el.w, el.h, 8); ctx.fill(); ctx.restore();
  }
  // Texto ajustado al cuadro
  const pad = Math.round(el.w * 0.04);
  const aw = el.w - pad * 2;
  const fontFamily = RE.fontLoaded ? "'BebasNeue',Impact,sans-serif" : "Impact,sans-serif";
  let sz = Math.max(10, Math.round(el.h * 0.28));
  let lines, lh, bh;
  for (let i = 0; i < 25; i++) {
    ctx.font = `700 ${sz}px ${fontFamily}`;
    lines = reelWrap(S.titulo, aw);
    lh = sz * 1.18; bh = lines.length * lh;
    if (bh <= el.h * 0.9 || sz <= 10) break;
    sz = Math.max(10, Math.round(sz * 0.88));
  }
  ctx.save();
  ctx.fillStyle = S.tituloColor;
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  ctx.font = `700 ${sz}px ${fontFamily}`;
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = Math.round(sz * .22);
  const ty = el.y + (el.h - bh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, el.x + el.w / 2, ty + i * lh));
  ctx.restore();
}

// ── HANDLES — definición correcta ──
// Esquinas: círculo. Lados: rectángulo alargado.
// La dirección del cursor sigue la posición real del handle.
function reelGetHandles(key) {
  const el = RE.els[key];
  if (!el || el.x === null) return [];
  const { x, y, w, h } = el;
  return [
    { x: x,     y: y,     id: 'nw', cursor: 'nw-resize' },
    { x: x+w,   y: y,     id: 'ne', cursor: 'ne-resize' },
    { x: x,     y: y+h,   id: 'sw', cursor: 'sw-resize' },
    { x: x+w,   y: y+h,   id: 'se', cursor: 'se-resize' },
    { x: x+w/2, y: y,     id: 'n',  cursor: 'n-resize',  side: 'h' },
    { x: x+w/2, y: y+h,   id: 's',  cursor: 's-resize',  side: 'h' },
    { x: x,     y: y+h/2, id: 'w',  cursor: 'w-resize',  side: 'v' },
    { x: x+w,   y: y+h/2, id: 'e',  cursor: 'e-resize',  side: 'v' },
  ];
}

function reelDrawActiveUI() {
  const { ctx, W, H, active } = RE;
  const el = RE.els[active]; if (!el || el.x === null) return;
  const lw  = Math.max(2, Math.round(W * .002));
  const hs  = Math.max(8, Math.round(HR * (W / 1080))); // tamaño handle en canvas px

  ctx.save();

  // Cruz de centrado — líneas punteadas
  ctx.strokeStyle = 'rgba(166,206,57,.55)';
  ctx.lineWidth = lw;
  ctx.setLineDash([Math.round(W * .005), Math.round(W * .003)]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0);     ctx.lineTo(W / 2, H);     ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2);     ctx.lineTo(W, H / 2);     ctx.stroke();
  ctx.setLineDash([]);

  // Borde del elemento
  ctx.strokeStyle = '#a6ce39';
  ctx.lineWidth = lw * 1.5;
  reelRoundRect(el.x, el.y, el.w, el.h, 4); ctx.stroke();

  // Handles
  reelGetHandles(active).forEach(h => {
    ctx.fillStyle   = '#ffffff';
    ctx.strokeStyle = '#a6ce39';
    ctx.lineWidth   = Math.max(2, lw);
    if (h.side === 'v') {
      // Handle lateral: rectángulo vertical
      const hw = hs * .55, hh = hs * 1.3;
      reelRoundRect(h.x - hw / 2, h.y - hh / 2, hw, hh, hw / 2);
    } else if (h.side === 'h') {
      // Handle superior/inferior: rectángulo horizontal
      const hw = hs * 1.3, hh = hs * .55;
      reelRoundRect(h.x - hw / 2, h.y - hh / 2, hw, hh, hh / 2);
    } else {
      // Esquinas: círculo
      ctx.beginPath(); ctx.arc(h.x, h.y, hs * .6, 0, Math.PI * 2);
    }
    ctx.fill(); ctx.stroke();
  });

  ctx.restore();
}

// ── EVENTOS ──
function reelBindEvents() {
  const c = RE.canvas;
  c.addEventListener('mousedown',  reelOnDown);
  c.addEventListener('touchstart', reelOnDown, { passive: false });
  c.addEventListener('mousemove',  reelOnMove);
  c.addEventListener('touchmove',  reelOnMove, { passive: false });
  c.addEventListener('mouseup',    reelOnUp);
  c.addEventListener('touchend',   reelOnUp);
  document.addEventListener('mouseup', reelOnUp);
}

function reelGetPos(e) {
  const rect = RE.canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return {
    x: (t.clientX - rect.left)  * RE.scale,
    y: (t.clientY - rect.top)   * RE.scale,
  };
}

// Retorna el handle bajo el cursor, o null
function reelHandleHit(pos, key) {
  const hs = Math.max(8, Math.round(HR * (RE.W / 1080)));
  for (const h of reelGetHandles(key)) {
    const hw = h.side === 'h' ? hs * 1.6 : hs * 0.9;
    const hh = h.side === 'v' ? hs * 1.6 : hs * 0.9;
    if (Math.abs(pos.x - h.x) <= hw && Math.abs(pos.y - h.y) <= hh) return h;
  }
  return null;
}

// Retorna el elemento bajo el cursor (activo primero)
function reelHitEl(pos) {
  const order = RE.active
    ? [RE.active, ...Object.keys(RE.els).filter(k => k !== RE.active)]
    : Object.keys(RE.els);
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

  // Intentar handle del elemento activo primero
  if (RE.active) {
    const h = reelHandleHit(pos, RE.active);
    if (h) {
      RE.action = 'resize-' + h.id;
      RE.resizeStart = {
        pos: { ...pos },
        rect: { ...RE.els[RE.active] },
        logoAR: (RE.active === 'logo' && RE.logoImg) ? RE.logoImg.width / RE.logoImg.height : null,
      };
      return;
    }
  }

  const k = reelHitEl(pos);
  if (k) {
    RE.active = k;
    RE.action = 'drag';
    RE.dragOff = { x: pos.x - RE.els[k].x, y: pos.y - RE.els[k].y };
  } else {
    RE.active = null;
    RE.action = null;
  }
  reelRender();
}

function reelOnMove(e) {
  if (e.touches) e.preventDefault();
  const pos = reelGetPos(e);
  const { W, H } = RE;
  const SNAP = W * .012;

  if (!RE.action) {
    // Actualizar cursor
    if (RE.active) {
      const h = reelHandleHit(pos, RE.active);
      if (h) { RE.canvas.style.cursor = h.cursor; return; }
    }
    RE.canvas.style.cursor = reelHitEl(pos) ? 'grab' : 'default';
    return;
  }

  const el = RE.els[RE.active];

  if (RE.action === 'drag') {
    let nx = pos.x - RE.dragOff.x;
    let ny = pos.y - RE.dragOff.y;
    // Snap al centro
    if (Math.abs(nx + el.w / 2 - W / 2) < SNAP) nx = W / 2 - el.w / 2;
    if (Math.abs(ny + el.h / 2 - H / 2) < SNAP) ny = H / 2 - el.h / 2;
    el.x = nx; el.y = ny;
    RE.canvas.style.cursor = 'grabbing';
  }

  if (RE.action.startsWith('resize-')) {
    const corner = RE.action.slice(7);
    const rs = RE.resizeStart;
    const dx = pos.x - rs.pos.x;
    const dy = pos.y - rs.pos.y;
    const MIN = W * .04;
    let { x, y, w, h } = rs.rect;

    if (rs.logoAR) {
      // Logo: mantener proporción
      const AR = rs.logoAR;
      if (corner === 'se') { w = Math.max(MIN, w + dx); h = w / AR; }
      else if (corner === 'sw') { const nw = Math.max(MIN, w - dx); x = rs.rect.x + rs.rect.w - nw; w = nw; h = w / AR; }
      else if (corner === 'ne') { w = Math.max(MIN, w + dx); const nh = w / AR; y = rs.rect.y + rs.rect.h - nh; h = nh; }
      else if (corner === 'nw') { const nw = Math.max(MIN, w - dx); x = rs.rect.x + rs.rect.w - nw; w = nw; const nh = w / AR; y = rs.rect.y + rs.rect.h - nh; h = nh; }
      else if (corner === 'e')  { w = Math.max(MIN, w + dx); h = w / AR; }
      else if (corner === 'w')  { const nw = Math.max(MIN, w - dx); x = rs.rect.x + rs.rect.w - nw; w = nw; h = w / AR; }
    } else {
      if (corner === 'se') { w = Math.max(MIN, w + dx); h = Math.max(MIN, h + dy); }
      else if (corner === 'sw') { const nw = Math.max(MIN, w - dx); x = rs.rect.x + rs.rect.w - nw; w = nw; h = Math.max(MIN, h + dy); }
      else if (corner === 'ne') { w = Math.max(MIN, w + dx); const nh = Math.max(MIN, h - dy); y = rs.rect.y + rs.rect.h - nh; h = nh; }
      else if (corner === 'nw') { const nw = Math.max(MIN, w - dx); x = rs.rect.x + rs.rect.w - nw; w = nw; const nh = Math.max(MIN, h - dy); y = rs.rect.y + rs.rect.h - nh; h = nh; }
      else if (corner === 'e')  { w = Math.max(MIN, w + dx); }
      else if (corner === 'w')  { const nw = Math.max(MIN, w - dx); x = rs.rect.x + rs.rect.w - nw; w = nw; }
      else if (corner === 'n')  { const nh = Math.max(MIN, h - dy); y = rs.rect.y + rs.rect.h - nh; h = nh; }
      else if (corner === 's')  { h = Math.max(MIN, h + dy); }
    }
    el.x = x; el.y = y; el.w = w; el.h = h;
  }

  reelRender();
}

function reelOnUp() {
  RE.action = null;
  RE.canvas.style.cursor = RE.active ? 'grab' : 'default';
}

// ── LOAD BG / LOGO ──
function reelLoadBg(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = e => {
    const img = new Image();
    img.onload = () => { RE.bgImg = img; reelRender(); };
    img.src = e.target.result;
  };
  rd.readAsDataURL(file);
}
function reelLoadLogo(file) {
  if (!file) return;
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

  const btn     = document.getElementById('btnExportVideo');
  const prog    = document.getElementById('reelExportProgress');
  const progTxt = document.getElementById('reelExportProgressTxt');
  btn.disabled = true;
  prog.style.display = 'flex';

  try {
    // Verificar soporte SharedArrayBuffer (necesario para FFmpeg.wasm)
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error('SharedArrayBuffer no disponible. Verificá que el archivo _headers esté desplegado en Cloudflare Pages (COOP/COEP).');
    }

    progTxt.textContent = 'Preparando imagen...';
    RE.active = null;
    reelRender();
    await new Promise(r => setTimeout(r, 80)); // esperar que canvas termine

    const audioDur = await reelGetAudioDuration(RE.audioBlob);

    progTxt.textContent = 'Cargando FFmpeg.wasm (primera vez ~30MB)...';

    // Importar FFmpeg desde CDN con crossorigin
    const { FFmpeg }    = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js');
    const { fetchFile, toBlobURL } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js');

    const ffmpeg = new FFmpeg();
    ffmpeg.on('progress', ({ progress }) => {
      const pct = Math.min(99, Math.round(progress * 100));
      progTxt.textContent = `Renderizando... ${pct}%`;
    });

    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    progTxt.textContent = 'Procesando imagen...';
    const imgBlob = await new Promise(res => RE.canvas.toBlob(res, 'image/png'));
    await ffmpeg.writeFile('frame.png', await fetchFile(imgBlob));

    const audioExt = RE.audioBlob.type.includes('webm') ? 'webm'
                   : RE.audioBlob.type.includes('ogg')  ? 'ogg'
                   : RE.audioBlob.type.includes('wav')  ? 'wav' : 'mp3';
    await ffmpeg.writeFile('audio.' + audioExt, await fetchFile(RE.audioBlob));

    progTxt.textContent = 'Generando MP4...';
    const dur = String(Math.ceil(audioDur + 0.5));
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
      '-t', dur,
      '-movflags', '+faststart',
      'output.mp4'
    ]);

    progTxt.textContent = 'Finalizando...';
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url  = URL.createObjectURL(blob);

    const video = document.getElementById('reelVideoPreview');
    const dl    = document.getElementById('reelVideoDownload');
    video.src = url;
    dl.href   = url;
    dl.download = `reel-mediamendoza-${Date.now()}.mp4`;
    document.getElementById('reelVideoResult').style.display = 'block';
    video.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    reelToast('✅ MP4 generado correctamente');

  } catch (err) {
    console.error('[reelExport]', err);
    reelToast('Error: ' + err.message);
    document.getElementById('reelExportProgressTxt').textContent = 'Error: ' + err.message;
  }

  btn.disabled = false;
  prog.style.display = 'none';
}

function reelGetAudioDuration(blob) {
  return new Promise(resolve => {
    const au  = new Audio();
    au.onloadedmetadata = () => resolve(isFinite(au.duration) && au.duration > 0 ? au.duration : 30);
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
  return lines.length ? lines : [text];
}
function reelRoundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  RE.ctx.beginPath();
  RE.ctx.moveTo(x + r, y); RE.ctx.lineTo(x + w - r, y); RE.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  RE.ctx.lineTo(x + w, y + h - r); RE.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  RE.ctx.lineTo(x + r, y + h); RE.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  RE.ctx.lineTo(x, y + r); RE.ctx.quadraticCurveTo(x, y, x + r, y); RE.ctx.closePath();
}
function hexRgb(hex) {
  if (!hex || hex === 'transparent') return { r: 0, g: 0, b: 0 };
  return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) };
}
function reelToast(msg) {
  const t = document.getElementById('toast');
  if (!t) { console.warn(msg); return; }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── ALINEAR ──
function reelAlign(key, dir) {
  const el = RE.els[key]; if (!el || el.x === null) return;
  const W = RE.W, H = RE.H;
  const pad = Math.round(W * .04);
  if (dir === 'l')  el.x = pad;
  if (dir === 'r')  el.x = W - el.w - pad;
  if (dir === 'ch') el.x = Math.round((W - el.w) / 2);
  if (dir === 't')  el.y = pad;
  if (dir === 'b')  el.y = H - el.h - pad;
  if (dir === 'cv') el.y = Math.round((H - el.h) / 2);
  reelRender();
}

window.RE              = RE;
window.reelEditorInit  = reelEditorInit;
window.reelResizeCanvas= reelResizeCanvas;
window.reelRender      = reelRender;
window.reelResetEl     = reelResetEl;
window.reelLoadBg      = reelLoadBg;
window.reelLoadLogo    = reelLoadLogo;
window.reelExportVideo = reelExportVideo;
window.reelAlign       = reelAlign;