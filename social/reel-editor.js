// ============================================================
// Media Mendoza — Reel Editor v3.2 (CORREGIDO)
// Solo cambios: audio corregido + centrado forzado en cambio de formato
// ============================================================

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
  audioUrl: null,
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
// SUBTÍTULOS (completo, sin cambios)
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
  const escala = Math.max(0.5, Math.min(2, (durTotal - offset) / totalEst));
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

  let lineas = [grupo];
  const anchos = grupo.map(p => ctx.measureText(p.texto.toUpperCase()).width);
  const anchoTotal = anchos.reduce((a, b) => a + b, 0) + GAP * (grupo.length - 1);
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
// FORMATOS Y CENTRADO (CORREGIDO)
// ══════════════════════════════════════════════════
const REEL_FMTS = {
  '9x16': { w: 1080, h: 1920 },
  '1x1':  { w: 1080, h: 1080 },
  '4x5':  { w: 1080, h: 1350 },
};
function reelSetFmt(key, el) {
  document.querySelectorAll('.rfpill').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
  const fmt = REEL_FMTS[key];
  RE.W = fmt.w; RE.H = fmt.h;
  RE.canvas.width = RE.W; RE.canvas.height = RE.H;
  // 🔁 FORZAR RECÁLCULO DE POSICIONES (esto soluciona el centrado)
  reelResetEl('logo');
  reelResetEl('titulo');
  reelResizeCanvas();
  reelRender();
}

function reelAlign(key, dir) {
  const el = RE.els[key]; if (!el || el.x === null) return;
  const W = RE.W, H = RE.H, pad = Math.round(W * .04);
  if (dir==='l') el.x=pad;
  if (dir==='r') el.x=W-el.w-pad;
  if (dir==='ch') el.x=Math.round((W-el.w)/2);
  if (dir==='t') el.y=pad;
  if (dir==='b') el.y=H-el.h-pad;
  if (dir==='cv') el.y=Math.round((H-el.h)/2);
  reelRender();
}

// ══════════════════════════════════════════════════
// EXPORT MP4 — VERSIÓN CORREGIDA (audio sin distorsión)
// ══════════════════════════════════════════════════

async function addAudioToMuxer(muxer, audioBlob) {
  try {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    let channelData = [];
    if (audioBuffer.numberOfChannels >= 2) {
      channelData = [audioBuffer.getChannelData(0), audioBuffer.getChannelData(1)];
    } else {
      const mono = audioBuffer.getChannelData(0);
      channelData = [mono, mono];
    }
    
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const targetSampleRate = 44100;
    let left = channelData[0];
    let right = channelData[1];
    
    // Resample solo si es necesario, usando interpolación lineal suave
    if (sampleRate !== targetSampleRate) {
      const ratio = targetSampleRate / sampleRate;
      const newLen = Math.floor(length * ratio);
      left = resampleLinear(left, ratio, newLen);
      right = resampleLinear(right, ratio, newLen);
    }
    
    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => console.warn('AudioEncoder error:', e)
    });
    audioEncoder.configure({
      codec: 'mp4a.40.2',
      sampleRate: targetSampleRate,
      numberOfChannels: 2,
      bitrate: 128000
    });
    
    const chunkSize = 4096;
    for (let offset = 0; offset < left.length; offset += chunkSize) {
      const frames = Math.min(chunkSize, left.length - offset);
      const planar = new Float32Array(frames * 2);
      for (let i = 0; i < frames; i++) {
        planar[i] = left[offset + i];
        planar[i + frames] = right[offset + i];
      }
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: targetSampleRate,
        numberOfFrames: frames,
        numberOfChannels: 2,
        timestamp: Math.round(offset / targetSampleRate * 1_000_000),
        data: planar
      });
      audioEncoder.encode(audioData);
      audioData.close();
    }
    await audioEncoder.flush();
    audioEncoder.close();
    await audioContext.close();
  } catch (err) {
    console.warn('Error agregando audio (seguirá sin audio):', err);
  }
}

function resampleLinear(source, ratio, newLength) {
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIdx = i / ratio;
    const srcFloor = Math.floor(srcIdx);
    const srcFrac = srcIdx - srcFloor;
    const s0 = source[Math.min(srcFloor, source.length - 1)];
    const s1 = source[Math.min(srcFloor + 1, source.length - 1)];
    result[i] = s0 * (1 - srcFrac) + s1 * srcFrac;
  }
  return result;
}

async function reelExportVideo() {
  if (!RE.audioBlob) { reelToast('Primero generá o cargá el audio'); return; }
  const btn = document.getElementById('btnExportVideo');
  const prog = document.getElementById('reelExportProgress');
  const progTxt = document.getElementById('reelExportProgressTxt');
  btn.disabled = true; prog.style.display = 'flex';
  try {
    if (typeof VideoEncoder === 'undefined') throw new Error('WebCodecs no soportado. Usá Chrome/Edge.');
    progTxt.textContent = 'Cargando librerías...';
    const { Muxer, ArrayBufferTarget } = await import('https://unpkg.com/mp4-muxer@5.2.2/build/mp4-muxer.mjs');
    const audioDur = await reelGetAudioDuration(RE.audioBlob);
    const guion = RE.guion || '';
    const usaSubs = RE.S.subsActivos && guion.trim().length > 0;
    const FPS = 30;
    const totalFrames = Math.ceil(audioDur * FPS);
    const timestamps = usaSubs ? generarTimestamps(guion, audioDur) : [];
    const MAX_DIM = 720;
    const scaleFactor = RE.W > MAX_DIM ? MAX_DIM / RE.W : 1;
    const VW = Math.floor(RE.W * scaleFactor / 2) * 2;
    const VH = Math.floor(RE.H * scaleFactor / 2) * 2;
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({ target, video: { codec: 'avc', width: VW, height: VH, expectedFramerate: FPS }, audio: { codec: 'aac', sampleRate: 44100, numberOfChannels: 2 }, fastStart: 'in-memory' });
    const videoEncoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { throw new Error('VideoEncoder: ' + e.message); } });
    videoEncoder.configure({ codec: 'avc1.420029', width: VW, height: VH, bitrate: 2_500_000, framerate: FPS });
    const offCanvas = document.createElement('canvas'); offCanvas.width = VW; offCanvas.height = VH;
    const offCtx = offCanvas.getContext('2d');
    RE.active = null;
    reelEnsurePos('logo'); reelEnsurePos('titulo');
    reelRenderBase(offCtx, VW, VH, RE.S, RE.bgImg, RE.logoImg, RE.els);
    const bgData = offCtx.getImageData(0, 0, VW, VH);
    progTxt.textContent = 'Codificando video...';
    for (let fi = 0; fi < totalFrames; fi++) {
      const t = fi / FPS;
      offCtx.putImageData(bgData, 0, 0);
      if (usaSubs && timestamps.length) reelDrawSubs(offCtx, VW, VH, timestamps, t, RE.S);
      const bitmap = await createImageBitmap(offCanvas);
      const frame = new VideoFrame(bitmap, { timestamp: Math.round(t * 1_000_000), duration: Math.round(1_000_000 / FPS) });
      videoEncoder.encode(frame, { keyFrame: fi % (FPS * 2) === 0 });
      frame.close(); bitmap.close();
      if (fi % 15 === 0) { progTxt.textContent = `Codificando video... ${Math.round((fi / totalFrames) * 70)}%`; await new Promise(r => setTimeout(r, 0)); }
    }
    await videoEncoder.flush(); videoEncoder.close();
    progTxt.textContent = 'Agregando audio... 80%';
    await addAudioToMuxer(muxer, RE.audioBlob);
    progTxt.textContent = 'Finalizando MP4... 95%';
    muxer.finalize();
    const blob = new Blob([target.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const video = document.getElementById('reelVideoPreview');
    const dl = document.getElementById('reelVideoDownload');
    video.src = url; dl.href = url;
    dl.download = `reel-${Date.now()}.mp4`;
    document.getElementById('reelVideoResult').style.display = 'block';
    reelToast(`✅ MP4 generado — ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
  } catch (err) {
    console.error(err);
    reelToast('Error: ' + (err.message || 'Error desconocido'));
    progTxt.textContent = '✕ ' + err.message;
  } finally {
    btn.disabled = false;
    setTimeout(() => { prog.style.display = 'none'; }, 2000);
  }
}

function reelGetAudioDuration(blob) {
  return new Promise(resolve => {
    const audio = new Audio();
    audio.onloadedmetadata = () => resolve(isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 30);
    audio.onerror = () => resolve(30);
    audio.src = URL.createObjectURL(blob);
  });
}

// ══════════════════════════════════════════════════
// PREVIEW SUBTÍTULOS
// ══════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════
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
  let toast = document.getElementById('reelToast');
  if (!toast) {
    toast = document.createElement('div'); toast.id = 'reelToast';
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1a1a18;border:1px solid #a6ce39;color:#a6ce39;padding:10px 20px;border-radius:4px;font-family:Inter,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;z-index:2000;opacity:0;transition:opacity .2s;pointer-events:none';
    document.body.appendChild(toast);
  }
  toast.textContent = msg; toast.style.opacity = '1';
  setTimeout(() => toast.style.opacity = '0', 3000);
}

// ══════════════════════════════════════════════════
// VOCES Y CONFIGURACIÓN (AGREGADAS - faltaban)
// ══════════════════════════════════════════════════
let reelVoces = [];

function renderVocesSelect() {
  const sel = document.getElementById('re-voiceSelect');
  if (!sel) return;
  sel.innerHTML = '';
  reelVoces.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id; opt.textContent = v.nombre;
    sel.appendChild(opt);
  });
  if (!reelVoces.length) {
    const opt = document.createElement('option');
    opt.value = 'es-AR-TomasNeural'; opt.textContent = 'Tomás (por defecto)';
    sel.appendChild(opt);
  }
}

function renderVocesList() {
  const lista = document.getElementById('reelVocesList'); if (!lista) return;
  lista.innerHTML = '';
  if (!reelVoces.length) {
    lista.innerHTML = '<div style="font-size:10px;color:var(--dim);padding:4px 0">Sin voces guardadas.</div>'; return;
  }
  reelVoces.forEach((v, i) => {
    const row = document.createElement('div');
    row.className = 're-voice-row';
    row.innerHTML = `<span class="re-voice-name">${v.nombre}</span>
      <span class="re-voice-badge">${(v.id||'').substring(0,18)}</span>
      <button class="re-voice-del" onclick="reelEliminarVoz(${i})">✕</button>`;
    lista.appendChild(row);
  });
}

async function reelAgregarVoz() {
  const nombre   = document.getElementById('re-vozNombre')?.value.trim() || '';
  const id       = document.getElementById('re-vozId')?.value.trim() || '';
  const keyAlias = document.getElementById('re-vozKey')?.value || 'AZURE_TTS_KEY_1';
  const region   = document.getElementById('re-vozRegion')?.value || 'AZURE_TTS_REGION_1';
  if (!nombre || !id) { reelToast('Completá nombre e ID de voz'); return; }
  reelVoces.push({ id, nombre, keyAlias, region });
  await guardarVoces();
  if (document.getElementById('re-vozNombre')) document.getElementById('re-vozNombre').value = '';
  if (document.getElementById('re-vozId')) document.getElementById('re-vozId').value = '';
  renderVocesSelect(); renderVocesList();
}

async function reelEliminarVoz(i) {
  if (reelVoces.length <= 1) { reelToast('Dejá al menos una voz'); return; }
  reelVoces.splice(i, 1);
  await guardarVoces();
  renderVocesSelect(); renderVocesList();
}

async function guardarVoces() {
  try {
    await fetch(`${WORKER || 'https://mm-herramientas-worker.mhhurtado.workers.dev'}/social/reel/config`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ voces: reelVoces })
    });
  } catch(e) { reelToast('Error guardando voces: '+e.message); }
}

async function loadReelConfig() {
  try {
    const r = await fetch(`${WORKER || 'https://mm-herramientas-worker.mhhurtado.workers.dev'}/social/reel/config`);
    const d = await r.json();
    if (!d.ok) return;
    if (d.prompt && document.getElementById('reelPromptTA')) document.getElementById('reelPromptTA').value = d.prompt;
    reelVoces = d.voces || [];
    renderVocesSelect();
    renderVocesList();
  } catch(e) { console.error(e); }
}

async function guardarPromptReel() {
  const prompt = document.getElementById('reelPromptTA')?.value.trim() || '';
  try {
    const r = await fetch(`${WORKER || 'https://mm-herramientas-worker.mhhurtado.workers.dev'}/social/reel/config`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ prompt })
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    const badge = document.getElementById('savedPromptReel');
    if (badge) { badge.classList.add('show'); setTimeout(() => badge.classList.remove('show'), 2500); }
  } catch(e) { reelToast('Error: '+e.message); }
}

// ══════════════════════════════════════════════════
// EXPOSICIÓN GLOBAL
// ══════════════════════════════════════════════════
window.RE = RE;
window.reelEditorInit = reelEditorInit;
window.reelResizeCanvas = reelResizeCanvas;
window.reelRender = reelRender;
window.reelResetEl = reelResetEl;
window.reelLoadBg = reelLoadBg;
window.reelLoadLogo = reelLoadLogo;
window.reelExportVideo = reelExportVideo;
window.reelAlign = reelAlign;
window.reelPreviewSubs = reelPreviewSubs;
window.reelStopPreview = reelStopPreview;
window.generarTimestamps = generarTimestamps;
window.reelDrawSubs = reelDrawSubs;
window.reelRenderBase = reelRenderBase;
window.reelSetFmt = reelSetFmt;
window.reelAgregarVoz = reelAgregarVoz;
window.reelEliminarVoz = reelEliminarVoz;
window.loadReelConfig = loadReelConfig;
window.guardarPromptReel = guardarPromptReel;
window.renderVocesSelect = renderVocesSelect;
window.renderVocesList = renderVocesList;