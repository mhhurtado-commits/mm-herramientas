// ============================================================
// Media Mendoza — Reel Editor v3.0
// Export MP4: mp4-muxer + WebCodecs API (sin FFmpeg, sin COOP/COEP)
// Subtítulos TikTok integrados
// ============================================================

// ── Fuente BebasNeue desde /assets ──
(function () {
  if (document.getElementById('reel-bebas-font')) return;
  const s = document.createElement('style');
  s.id = 'reel-bebas-font';
  s.textContent = "@font-face{font-family:'BebasNeue';src:url('/assets/BebasNeue-Regular.ttf') format('truetype');font-weight:400;font-style:normal;}";
  document.head.appendChild(s);
})();

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
    subsActivos: true,
    subsPosY: 0.78,
    subsColorNormal: '#ffffff',
    subsColorResaltado: '#f5c518',
    subsFontSize: 72,
    subsBgOp: 0.55,
  },
  guion: '',
  active: null,
  action: null,
  dragOff: { x: 0, y: 0 },
  resizeStart: null,
  fontLoaded: false,
};

const HR = 20;

// ══════════════════════════════════════════════════
// SUBTÍTULOS
// ══════════════════════════════════════════════════
function contarSilabas(palabra) {
  const p = palabra.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  if (!p) return 1;
  const vocales = p.match(/[aeiouáéíóúü]/g);
  let n = vocales ? vocales.length : 1;
  const diptongos = (p.match(/[aeiou][iuáéíóúü]|[iuáéíóúü][aeiou]/g) || []).length;
  return Math.max(1, n - Math.floor(diptongos * 0.5));
}

function duracionPalabra(p) {
  return contarSilabas(p) * 0.18 + (/[.,;:!?]$/.test(p) ? 0.22 : 0.06);
}

function generarTimestamps(guion, durTotal) {
  const palabras = guion.trim().split(/\s+/).filter(w => w.length > 0);
  if (!palabras.length) return [];
  const durs = palabras.map(duracionPalabra);
  const totalEst = durs.reduce((a, b) => a + b, 0);
  const offset = 0.3;
  const escala = (durTotal - offset) / totalEst;
  let t = offset, grupIdx = 0, palEnGrupo = 0;
  return palabras.map((texto, i) => {
    const dur = durs[i] * escala;
    const item = { texto, inicio: t, fin: t + dur, grupIdx };
    t += dur;
    palEnGrupo++;
    if (palEnGrupo >= 4 || /[.!?]$/.test(texto)) { grupIdx++; palEnGrupo = 0; }
    return item;
  });
}

function getGrupoActivo(timestamps, t) {
  if (!timestamps.length) return null;
  let idx = timestamps.findIndex(p => t >= p.inicio && t < p.fin);
  if (idx === -1) {
    if (t < timestamps[0].inicio) return null;
    idx = timestamps.length - 1;
  }
  const gid = timestamps[idx].grupIdx;
  const grupo = timestamps.filter(p => p.grupIdx === gid);
  return { grupo, idxEnGrupo: grupo.findIndex(p => p === timestamps[idx]) };
}

function reelDrawSubs(ctx, W, H, timestamps, t, S) {
  if (!timestamps?.length) return;
  const info = getGrupoActivo(timestamps, t);
  if (!info) return;
  const { grupo, idxEnGrupo } = info;
  const ff = RE.fontLoaded ? "'BebasNeue', Impact, sans-serif" : "Impact, sans-serif";
  const sz = Math.round((S.subsFontSize || 72) * (W / 1080));
  ctx.font = `900 ${sz}px ${ff}`;
  const GAP = Math.round(sz * 0.18);
  const PAD_H = Math.round(sz * 0.45), PAD_V = Math.round(sz * 0.25);

  const textos = grupo.map(p => p.texto.toUpperCase());
  const anchos = textos.map(tx => ctx.measureText(tx).width);
  const anchoTotal = anchos.reduce((a, b) => a + b, 0) + GAP * (textos.length - 1);

  let lineas = [grupo];
  if (anchoTotal > W * 0.88 && grupo.length > 2) {
    const mid = Math.ceil(grupo.length / 2);
    lineas = [grupo.slice(0, mid), grupo.slice(mid)];
  }

  const altL = sz * 1.25;
  const yIni = Math.round(H * (S.subsPosY || 0.78)) - (lineas.length * altL) / 2;

  lineas.forEach((linea, li) => {
    const txts = linea.map(p => p.texto.toUpperCase());
    const achs = txts.map(tx => ctx.measureText(tx).width);
    const aw = achs.reduce((a, b) => a + b, 0) + GAP * (txts.length - 1);
    const x0 = (W - aw) / 2;
    const yL = yIni + li * altL;

    if (S.subsBgOp > 0) {
      ctx.save();
      ctx.globalAlpha = S.subsBgOp;
      ctx.fillStyle = '#000';
      rrCtx(ctx, x0 - PAD_H, yL - PAD_V, aw + PAD_H * 2, sz + PAD_V * 2, Math.round(sz * 0.18));
      ctx.fill();
      ctx.restore();
    }

    let x = x0;
    linea.forEach((pal, pi) => {
      const txt = txts[pi], ach = achs[pi];
      const activa = pal === grupo[idxEnGrupo];
      ctx.save();
      if (activa) {
        ctx.fillStyle = S.subsColorResaltado || '#f5c518';
        ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = Math.round(sz * 0.15);
        ctx.translate(x + ach / 2, yL + sz / 2); ctx.scale(1.08, 1.08);
        ctx.fillText(txt, -ach / 2, -sz / 2 + sz * 0.85);
      } else {
        ctx.fillStyle = S.subsColorNormal || '#fff';
        ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = Math.round(sz * 0.12);
        ctx.fillText(txt, x, yL + sz * 0.85);
      }
      ctx.restore();
      x += ach + GAP;
    });
  });
}

function rrCtx(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

// ══════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════
function reelEditorInit() {
  RE.canvas = document.getElementById('reelCanvas');
  RE.ctx    = RE.canvas.getContext('2d');
  RE.canvas.width  = RE.W;
  RE.canvas.height = RE.H;

  document.fonts.load("900 72px 'BebasNeue'").then(() => {
    RE.fontLoaded = true; reelRender();
  }).catch(() => { RE.fontLoaded = true; reelRender(); });

  const li = new Image();
  li.onload  = () => { RE.logoImg = li; reelResetEl('logo'); reelRender(); };
  li.onerror = () => reelRender();
  li.src = '../assets/logo.png';

  reelResizeCanvas();
  reelBindEvents();
  reelRender();
  window.addEventListener('resize', () => { reelResizeCanvas(); reelRender(); });
}

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

function reelDefaultPos(key) {
  const { W, H } = RE;
  if (key === 'logo') {
    const lw = Math.round(W * 0.42);
    const lh = RE.logoImg ? Math.round(lw * RE.logoImg.height / RE.logoImg.width) : Math.round(lw * 0.34);
    return { x: Math.round((W - lw) / 2), y: Math.round(H * 0.06), w: lw, h: lh };
  }
  const tw = Math.round(W * 0.88), th = Math.round(H * 0.14);
  return { x: Math.round((W - tw) / 2), y: Math.round(H * 0.38), w: tw, h: th };
}
function reelResetEl(key) { RE.els[key] = { ...reelDefaultPos(key) }; }
function reelEnsurePos(key) {
  if (RE.els[key].x === null) { const d = reelDefaultPos(key); Object.assign(RE.els[key], d); }
}

// ── RENDER BASE ──
function reelRenderBase(ctx, W, H, S, bgImg, logoImg, els) {
  ctx.clearRect(0, 0, W, H);

  if (bgImg) {
    ctx.save();
    if (S.bgBlur > 0) ctx.filter = `blur(${S.bgBlur}px)`;
    const ir = bgImg.width / bgImg.height, cr = W / H;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = bgImg.height; sw = sh * cr; sx = (bgImg.width - sw) / 2; sy = 0; }
    else         { sw = bgImg.width;  sh = sw / cr; sx = 0; sy = (bgImg.height - sh) / 2; }
    const p = S.bgBlur * 4;
    ctx.drawImage(bgImg, sx, sy, sw, sh, -p, -p, W + p * 2, H + p * 2);
    ctx.filter = 'none'; ctx.restore();
    if (S.bgDark > 0) {
      ctx.save(); ctx.globalAlpha = S.bgDark;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
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

  if (S.barraActiva) {
    const bh = Math.round(H * 0.006);
    ctx.fillStyle = S.barraColor;
    ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
  }

  // Logo
  const eL = els.logo;
  if (eL.x === null) Object.assign(eL, reelDefaultPos('logo'));
  if (logoImg) {
    ctx.save(); ctx.globalAlpha = S.logoOp;
    ctx.drawImage(logoImg, eL.x, eL.y, eL.w, eL.h);
    ctx.restore();
  }

  // Título
  const eT = els.titulo;
  if (eT.x === null) Object.assign(eT, reelDefaultPos('titulo'));
  drawTituloCtx(ctx, W, H, S, eT);
}

function drawTituloCtx(ctx, W, H, S, el) {
  if (!S.titulo) {
    ctx.save();
    ctx.strokeStyle = 'rgba(166,206,57,.4)'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]);
    ctx.strokeRect(el.x, el.y, el.w, el.h); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(166,206,57,.35)';
    ctx.font = `${Math.round(el.h * 0.28)}px Inter,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Título del reel', el.x + el.w / 2, el.y + el.h / 2);
    ctx.textAlign = 'left'; ctx.restore(); return;
  }
  if (S.tituloBg !== 'transparent' && S.tituloBgOp > 0) {
    const r = hexRgb(S.tituloBg);
    ctx.save(); ctx.globalAlpha = S.tituloBgOp;
    ctx.fillStyle = `rgb(${r.r},${r.g},${r.b})`;
    rrCtx(ctx, el.x, el.y, el.w, el.h, 8); ctx.fill(); ctx.restore();
  }
  const ff = RE.fontLoaded ? "'BebasNeue', Impact, sans-serif" : "Impact, sans-serif";
  const pad = Math.round(el.w * 0.04), aw = el.w - pad * 2;
  let sz = Math.max(10, Math.round(el.h * 0.28)), lines, lh, bh;
  for (let i = 0; i < 25; i++) {
    ctx.font = `700 ${sz}px ${ff}`;
    lines = wrapText(ctx, S.titulo, aw); lh = sz * 1.18; bh = lines.length * lh;
    if (bh <= el.h * 0.9 || sz <= 10) break;
    sz = Math.max(10, Math.round(sz * 0.88));
  }
  ctx.save();
  ctx.fillStyle = S.tituloColor; ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  ctx.font = `700 ${sz}px ${ff}`;
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = Math.round(sz * .22);
  const ty = el.y + (el.h - bh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, el.x + el.w / 2, ty + i * lh));
  ctx.restore();
}

function reelRender() {
  reelEnsurePos('logo'); reelEnsurePos('titulo');
  reelRenderBase(RE.ctx, RE.W, RE.H, RE.S, RE.bgImg, RE.logoImg, RE.els);
  if (RE.S.subsActivos && RE.guion?.trim()) {
    const ts = generarTimestamps(RE.guion, 30);
    reelDrawSubs(RE.ctx, RE.W, RE.H, ts, 1.5, RE.S);
  }
  if (RE.active) reelDrawActiveUI();
}

// ── HANDLES ──
function reelGetHandles(key) {
  const el = RE.els[key]; if (!el || el.x === null) return [];
  const { x, y, w, h } = el;
  return [
    { x, y, id: 'nw', cursor: 'nw-resize' }, { x: x+w, y, id: 'ne', cursor: 'ne-resize' },
    { x, y: y+h, id: 'sw', cursor: 'sw-resize' }, { x: x+w, y: y+h, id: 'se', cursor: 'se-resize' },
    { x: x+w/2, y, id: 'n', cursor: 'n-resize', side: 'h' }, { x: x+w/2, y: y+h, id: 's', cursor: 's-resize', side: 'h' },
    { x, y: y+h/2, id: 'w', cursor: 'w-resize', side: 'v' }, { x: x+w, y: y+h/2, id: 'e', cursor: 'e-resize', side: 'v' },
  ];
}

function reelDrawActiveUI() {
  const { ctx, W, H, active } = RE;
  const el = RE.els[active]; if (!el || el.x === null) return;
  const lw = Math.max(2, Math.round(W * .002));
  const hs = Math.max(8, Math.round(HR * (W / 1080)));
  ctx.save();
  ctx.strokeStyle = 'rgba(166,206,57,.55)'; ctx.lineWidth = lw;
  ctx.setLineDash([Math.round(W * .005), Math.round(W * .003)]);
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#a6ce39'; ctx.lineWidth = lw * 1.5;
  rrCtx(ctx, el.x, el.y, el.w, el.h, 4); ctx.stroke();
  reelGetHandles(active).forEach(h => {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#a6ce39'; ctx.lineWidth = Math.max(2, lw);
    if (h.side === 'v') { rrCtx(ctx, h.x - hs*.55/2, h.y - hs*.65, hs*.55, hs*1.3, hs*.27); }
    else if (h.side === 'h') { rrCtx(ctx, h.x - hs*.65, h.y - hs*.55/2, hs*1.3, hs*.55, hs*.27); }
    else { ctx.beginPath(); ctx.arc(h.x, h.y, hs*.6, 0, Math.PI*2); }
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
  return { x: (t.clientX - rect.left) * RE.scale, y: (t.clientY - rect.top) * RE.scale };
}

function reelHandleHit(pos, key) {
  const hs = Math.max(8, Math.round(HR * (RE.W / 1080)));
  for (const h of reelGetHandles(key)) {
    const hw = h.side === 'h' ? hs * 1.6 : hs * 0.9;
    const hh = h.side === 'v' ? hs * 1.6 : hs * 0.9;
    if (Math.abs(pos.x - h.x) <= hw && Math.abs(pos.y - h.y) <= hh) return h;
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
    const h = reelHandleHit(pos, RE.active);
    if (h) { RE.action = 'resize-' + h.id; RE.resizeStart = { pos: {...pos}, rect: {...RE.els[RE.active]}, logoAR: RE.active === 'logo' && RE.logoImg ? RE.logoImg.width / RE.logoImg.height : null }; return; }
  }
  const k = reelHitEl(pos);
  if (k) { RE.active = k; RE.action = 'drag'; RE.dragOff = { x: pos.x - RE.els[k].x, y: pos.y - RE.els[k].y }; }
  else   { RE.active = null; RE.action = null; }
  reelRender();
}

function reelOnMove(e) {
  if (e.touches) e.preventDefault();
  const pos = reelGetPos(e);
  const { W, H } = RE, SNAP = W * .012;
  if (!RE.action) {
    if (RE.active) { const h = reelHandleHit(pos, RE.active); if (h) { RE.canvas.style.cursor = h.cursor; return; } }
    RE.canvas.style.cursor = reelHitEl(pos) ? 'grab' : 'default'; return;
  }
  const el = RE.els[RE.active];
  if (RE.action === 'drag') {
    let nx = pos.x - RE.dragOff.x, ny = pos.y - RE.dragOff.y;
    if (Math.abs(nx + el.w/2 - W/2) < SNAP) nx = W/2 - el.w/2;
    if (Math.abs(ny + el.h/2 - H/2) < SNAP) ny = H/2 - el.h/2;
    el.x = nx; el.y = ny; RE.canvas.style.cursor = 'grabbing';
  }
  if (RE.action.startsWith('resize-')) {
    const corner = RE.action.slice(7), rs = RE.resizeStart;
    const dx = pos.x - rs.pos.x, dy = pos.y - rs.pos.y, MIN = W * .04;
    let { x, y, w, h } = rs.rect;
    if (rs.logoAR) {
      const AR = rs.logoAR;
      if(corner==='se'){w=Math.max(MIN,w+dx);h=w/AR} else if(corner==='sw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;h=w/AR}
      else if(corner==='ne'){w=Math.max(MIN,w+dx);const nh=w/AR;y=rs.rect.y+rs.rect.h-nh;h=nh} else if(corner==='nw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;const nh=w/AR;y=rs.rect.y+rs.rect.h-nh;h=nh}
      else if(corner==='e'){w=Math.max(MIN,w+dx);h=w/AR} else if(corner==='w'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;h=w/AR}
    } else {
      if(corner==='se'){w=Math.max(MIN,w+dx);h=Math.max(MIN,h+dy)} else if(corner==='sw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;h=Math.max(MIN,h+dy)}
      else if(corner==='ne'){w=Math.max(MIN,w+dx);const nh=Math.max(MIN,h-dy);y=rs.rect.y+rs.rect.h-nh;h=nh} else if(corner==='nw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;const nh=Math.max(MIN,h-dy);y=rs.rect.y+rs.rect.h-nh;h=nh}
      else if(corner==='e'){w=Math.max(MIN,w+dx)} else if(corner==='w'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw}
      else if(corner==='n'){const nh=Math.max(MIN,h-dy);y=rs.rect.y+rs.rect.h-nh;h=nh} else if(corner==='s'){h=Math.max(MIN,h+dy)}
    }
    el.x=x; el.y=y; el.w=w; el.h=h;
  }
  reelRender();
}

function reelOnUp() { RE.action = null; RE.canvas.style.cursor = RE.active ? 'grab' : 'default'; }

function reelLoadBg(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = e => { const img = new Image(); img.onload = () => { RE.bgImg = img; reelRender(); }; img.src = e.target.result; };
  rd.readAsDataURL(file);
}
function reelLoadLogo(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = e => { const img = new Image(); img.onload = () => { RE.logoImg = img; reelResetEl('logo'); reelRender(); }; img.src = e.target.result; };
  rd.readAsDataURL(file);
}

// ══════════════════════════════════════════════════
// EXPORT MP4 — mp4-muxer + WebCodecs API
// Sin FFmpeg, sin WASM externo, sin COOP/COEP
// ══════════════════════════════════════════════════
async function reelExportVideo() {
  if (!RE.audioBlob) { reelToast('Primero generá o cargá el audio'); return; }

  const btn     = document.getElementById('btnExportVideo');
  const prog    = document.getElementById('reelExportProgress');
  const progTxt = document.getElementById('reelExportProgressTxt');
  btn.disabled = true;
  prog.style.display = 'flex';

  try {
    // ── Verificar soporte de WebCodecs ──
    if (typeof VideoEncoder === 'undefined') {
      throw new Error('Tu navegador no soporta WebCodecs API. Usá Chrome 94+ o Edge 94+.');
    }

    progTxt.textContent = 'Cargando mp4-muxer...';

    // ── Importar mp4-muxer (puro JS, sin WASM) ──
    const { Muxer, ArrayBufferTarget } = await import(
      'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.mjs'
    );

    const audioDur    = await reelGetAudioDuration(RE.audioBlob);
    const FPS         = usaSubs ? 15 : 30;
    const TOTAL_US    = Math.ceil(audioDur * 1_000_000); // microsegundos
    const totalFrames = Math.ceil(audioDur * FPS);
    const guion       = RE.guion || '';
    const usaSubs     = RE.S.subsActivos && guion.trim().length > 0;
    const timestamps  = usaSubs ? generarTimestamps(guion, audioDur) : [];

    // Dimensiones para export — escalar a max 720px ancho manteniendo aspecto
    // Esto garantiza compatibilidad con todos los niveles AVC y es suficiente para redes sociales
    const MAX_DIM = 720;
    const scaleFactor = RE.W > MAX_DIM ? MAX_DIM / RE.W : 1;
    const VW = Math.floor(RE.W * scaleFactor / 2) * 2;  // múltiplo de 2
    const VH = Math.floor(RE.H * scaleFactor / 2) * 2;  // múltiplo de 2

    // ── Crear muxer ──
    const target = new ArrayBufferTarget();
    const muxer  = new Muxer({
      target,
      video: { codec: 'avc', width: VW, height: VH },
      audio: { codec: 'aac', sampleRate: 44100, numberOfChannels: 1 },
      fastStart: 'in-memory',
    });

    // ── Configurar VideoEncoder ──
    let encodedFrames = 0;
    // Verificar soporte del codec
    const codecSupport = await VideoEncoder.isConfigSupported({
      codec: 'avc1.640029', width: VW, height: VH,
    });
    if (!codecSupport.supported) {
      throw new Error(`Resolución ${VW}x${VH} no soportada por este navegador para H.264.`);
    }

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { throw new Error('VideoEncoder: ' + e.message); },
    });
    videoEncoder.configure({
      codec: 'avc1.640029',
      width: VW,
      height: VH,
      bitrate: VW <= 720 ? 2_000_000 : 4_000_000,
      framerate: typeof FPS === 'number' ? FPS : 15,
    });

    // ── Canvas offscreen para los frames ──
    const offCanvas = document.createElement('canvas');
    offCanvas.width  = VW;
    offCanvas.height = VH;
    const offCtx = offCanvas.getContext('2d');

    // Pre-renderizar fondo base
    RE.active = null;
    reelEnsurePos('logo'); reelEnsurePos('titulo');
    reelRenderBase(offCtx, VW, VH, RE.S, RE.bgImg, RE.logoImg, RE.els);
    const bgData = offCtx.getImageData(0, 0, VW, VH);

    progTxt.textContent = 'Codificando video...';

    // ── Encodear frames ──
    for (let fi = 0; fi < totalFrames; fi++) {
      const t = fi / FPS;
      offCtx.putImageData(bgData, 0, 0);
      if (usaSubs) reelDrawSubs(offCtx, VW, VH, timestamps, t, RE.S);

      // Crear ImageBitmap a partir del canvas
      const bitmap = await createImageBitmap(offCanvas);
      const frame  = new VideoFrame(bitmap, {
        timestamp:  Math.round(t * 1_000_000),
        duration:   Math.round(1_000_000 / FPS),
      });
      videoEncoder.encode(frame, { keyFrame: fi % (FPS * 2) === 0 });
      frame.close();
      bitmap.close();

      // Yield al browser cada frame para no congelar la UI
      if (fi % 5 === 0) {
        progTxt.textContent = `Codificando video... ${Math.round((fi / totalFrames) * 80)}%`;
        await new Promise(r => setTimeout(r, 0));
      }
    }

    await videoEncoder.flush();
    videoEncoder.close();

    // ── Encodear audio con AudioEncoder ──
    progTxt.textContent = 'Procesando audio...';

    if (typeof AudioEncoder !== 'undefined') {
      try {
        await encodeAudioWebCodecs(muxer, RE.audioBlob, TOTAL_US);
      } catch(audioErr) {
        console.warn('Audio encoding falló:', audioErr.message);
        reelToast('⚠️ Video sin audio (limitación del navegador)');
      }
    } else {
      console.warn('AudioEncoder no disponible en este navegador');
      reelToast('⚠️ Video sin audio — usá Chrome o Edge para incluir audio');
    }

    progTxt.textContent = 'Finalizando MP4...';
    muxer.finalize();

    const buffer = target.buffer;
    const blob   = new Blob([buffer], { type: 'video/mp4' });
    const url    = URL.createObjectURL(blob);

    const video = document.getElementById('reelVideoPreview');
    const dl    = document.getElementById('reelVideoDownload');
    video.src = url; dl.href = url;
    dl.download = `reel-mediamendoza-${Date.now()}.mp4`;
    document.getElementById('reelVideoResult').style.display = 'block';
    video.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const sizeMB = (blob.size / 1024 / 1024).toFixed(1);
    reelToast(`✅ MP4 generado — ${sizeMB} MB`);
    reelRender();

  } catch (err) {
    console.error('[reelExport]', err);
    reelToast('Error: ' + (err.message || String(err)));
    document.getElementById('reelExportProgressTxt').textContent = '✕ ' + (err.message || err);
    reelRender();
  }

  btn.disabled = false;
  prog.style.display = 'none';
}

// Encodear audio con AudioEncoder WebCodecs
async function encodeAudioWebCodecs(muxer, audioBlob, totalUS) {
  const audioCtx  = new AudioContext({ sampleRate: 44100 });
  const arrayBuf  = await audioBlob.arrayBuffer();
  const audioData = await audioCtx.decodeAudioData(arrayBuf);

  const encoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error:  (e) => console.warn('AudioEncoder:', e),
  });
  encoder.configure({
    codec: 'mp4a.40.2',
    sampleRate: 44100,
    numberOfChannels: audioData.numberOfChannels,
    bitrate: 128_000,
  });

  const chunkSize = 4096;
  const samples   = audioData.length;
  for (let offset = 0; offset < samples; offset += chunkSize) {
    const len = Math.min(chunkSize, samples - offset);
    const frame = new AudioData({
      format: 'f32-planar',
      sampleRate: audioData.sampleRate,
      numberOfFrames: len,
      numberOfChannels: audioData.numberOfChannels,
      timestamp: Math.round(offset / audioData.sampleRate * 1_000_000),
      data: (() => {
        // Construir buffer planar
        const total = len * audioData.numberOfChannels;
        const buf = new Float32Array(total);
        for (let ch = 0; ch < audioData.numberOfChannels; ch++) {
          const chData = audioData.getChannelData(ch);
          buf.set(chData.subarray(offset, offset + len), ch * len);
        }
        return buf;
      })(),
    });
    encoder.encode(frame);
    frame.close();
  }
  await encoder.flush();
  encoder.close();
  audioCtx.close();
}

// Fallback: copiar audio directamente si AudioEncoder no está disponible
async function encodeAudioFallback(muxer, audioBlob) {
  // Fallback para Firefox que aún no soporta AudioEncoder
  // Decodificar con Web Audio y encodear manualmente como PCM plano
  console.warn('AudioEncoder no disponible — el video puede no tener audio en este navegador');
  // No hay nada más que hacer en este camino sin AudioEncoder
}

function reelGetAudioDuration(blob) {
  return new Promise(resolve => {
    const au = new Audio();
    au.onloadedmetadata = () => resolve(isFinite(au.duration) && au.duration > 0 ? au.duration : 30);
    au.onerror = () => resolve(30);
    au.src = URL.createObjectURL(blob);
  });
}

// ── PREVIEW SUBTÍTULOS ──
let _subsRAF = null, _subsStart = null;

function reelPreviewSubs() {
  if (!RE.guion?.trim()) { reelToast('Escribí el guion primero'); return; }
  reelStopPreview();
  const ts = generarTimestamps(RE.guion, 30);
  _subsStart = performance.now();
  const step = (now) => {
    const t = (now - _subsStart) / 1000;
    if (t > 31) { reelStopPreview(); return; }
    RE.active = null;
    reelRenderBase(RE.ctx, RE.W, RE.H, RE.S, RE.bgImg, RE.logoImg, RE.els);
    reelDrawSubs(RE.ctx, RE.W, RE.H, ts, t, RE.S);
    _subsRAF = requestAnimationFrame(step);
  };
  _subsRAF = requestAnimationFrame(step);
}
function reelStopPreview() {
  if (_subsRAF) { cancelAnimationFrame(_subsRAF); _subsRAF = null; }
  _subsStart = null; reelRender();
}

// ── HELPERS ──
function wrapText(ctx, text, maxW) {
  if (!text || maxW <= 0) return [text || ''];
  const words = text.split(' ').filter(w => w.length > 0);
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (cur && ctx.measureText(test).width > maxW) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur.trim()) lines.push(cur);
  return lines.length ? lines : [text];
}
function reelWrap(text, maxW) { return wrapText(RE.ctx, text, maxW); }
function reelRoundRect(x, y, w, h, r) { rrCtx(RE.ctx, x, y, w, h, r); }
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
function reelAlign(key, dir) {
  const el = RE.els[key]; if (!el || el.x === null) return;
  const W = RE.W, H = RE.H, pad = Math.round(W * .04);
  if (dir==='l') el.x=pad; if (dir==='r') el.x=W-el.w-pad;
  if (dir==='ch') el.x=Math.round((W-el.w)/2);
  if (dir==='t') el.y=pad; if (dir==='b') el.y=H-el.h-pad;
  if (dir==='cv') el.y=Math.round((H-el.h)/2);
  reelRender();
}

// ── EXPORTS GLOBALES ──
window.RE               = RE;
window.reelEditorInit   = reelEditorInit;
window.reelResizeCanvas = reelResizeCanvas;
window.reelRender       = reelRender;
window.reelResetEl      = reelResetEl;
window.reelLoadBg       = reelLoadBg;
window.reelLoadLogo     = reelLoadLogo;
window.reelExportVideo  = reelExportVideo;
window.reelAlign        = reelAlign;
window.reelPreviewSubs  = reelPreviewSubs;
window.reelStopPreview  = reelStopPreview;
window.generarTimestamps = generarTimestamps;
window.reelDrawSubs     = reelDrawSubs;
window.reelRenderBase   = reelRenderBase;