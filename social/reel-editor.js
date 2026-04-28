// ============================================================
// Media Mendoza — Reel Editor v2.0
// Canvas editor + FFmpeg.wasm + Subtítulos estilo TikTok
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
    // Subtítulos
    subsActivos: true,
    subsPosY: 0.78,        // posición vertical (0-1)
    subsColorNormal: '#ffffff',
    subsColorResaltado: '#f5c518', // amarillo TikTok
    subsFontSize: 72,      // px en canvas 1080
    subsBgOp: 0.55,
  },
  // Guion para subtítulos (se setea desde el HTML)
  guion: '',
  active: null,
  action: null,
  dragOff: { x: 0, y: 0 },
  resizeStart: null,
  fontLoaded: false,
  // Preview de subs en el editor
  subsPreview: { palabraIdx: -1, activo: false },
  subsPreviewTimer: null,
};

const HR = 20;

// ══════════════════════════════════════════════════
// SUBTÍTULOS — lógica de timing
// ══════════════════════════════════════════════════

// Cuenta sílabas aproximadas en español
function contarSilabas(palabra) {
  const p = palabra.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  if (!p) return 1;
  const vocales = p.match(/[aeiouáéíóúü]/g);
  let n = vocales ? vocales.length : 1;
  // Diptongos: reducir count
  const diptongos = (p.match(/[aeiou][iuáéíóúü]|[iuáéíóúü][aeiou]/g) || []).length;
  n = Math.max(1, n - Math.floor(diptongos * 0.5));
  return n;
}

// Duración estimada en segundos para una palabra (español)
// Promedio: ~0.18s por sílaba + pausa entre palabras
function duracionPalabra(palabra) {
  const sil = contarSilabas(palabra);
  const base = sil * 0.18;
  // Pausas naturales en signos de puntuación
  const pausa = /[.,;:!?]$/.test(palabra) ? 0.22 : 0.06;
  return base + pausa;
}

// Genera array de palabras con timestamps
// { texto, inicio, fin, grupIdx } — los grupos son bloques de ~4 palabras
function generarTimestamps(guion, duracionTotal) {
  const palabras = guion
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (!palabras.length) return [];

  // Calcular duraciones relativas
  const durs = palabras.map(p => duracionPalabra(p));
  const totalEst = durs.reduce((a, b) => a + b, 0);

  // Escalar para que coincida con la duración real del audio
  // Dejamos 0.3s de silencio al inicio (tiempo de la intro/título)
  const offset = 0.3;
  const escala = (duracionTotal - offset) / totalEst;

  let t = offset;
  const result = [];
  let grupIdx = 0;
  let palEnGrupo = 0;

  for (let i = 0; i < palabras.length; i++) {
    const dur = durs[i] * escala;
    result.push({
      texto: palabras[i],
      inicio: t,
      fin: t + dur,
      grupIdx,
    });
    t += dur;
    palEnGrupo++;
    // Nuevo grupo cada 4 palabras o en puntuación fuerte
    if (palEnGrupo >= 4 || /[.!?]$/.test(palabras[i])) {
      grupIdx++;
      palEnGrupo = 0;
    }
  }

  return result;
}

// Dado un tiempo T, retorna { grupo: [...palabras], activaIdx }
function getGrupoActivo(timestamps, t) {
  if (!timestamps.length) return null;
  // Buscar la palabra activa
  let activaIdx = -1;
  for (let i = 0; i < timestamps.length; i++) {
    if (t >= timestamps[i].inicio && t < timestamps[i].fin) {
      activaIdx = i;
      break;
    }
  }
  if (activaIdx === -1) {
    // Antes del primer o después del último — buscar el grupo más cercano
    if (t < timestamps[0].inicio) return null;
    activaIdx = timestamps.length - 1;
  }
  const grupIdx = timestamps[activaIdx].grupIdx;
  const grupo = timestamps.filter(p => p.grupIdx === grupIdx);
  const idxEnGrupo = grupo.findIndex(p => p === timestamps[activaIdx]);
  return { grupo, idxEnGrupo };
}

// Dibuja los subtítulos sobre el canvas en tiempo T
function reelDrawSubs(ctx, W, H, timestamps, t, S) {
  if (!timestamps || !timestamps.length) return;
  const info = getGrupoActivo(timestamps, t);
  if (!info) return;

  const { grupo, idxEnGrupo } = info;
  const fontFamily = "'BebasNeue', Impact, sans-serif";
  const sz = Math.round((S.subsFontSize || 72) * (W / 1080));
  ctx.font = `900 ${sz}px ${fontFamily}`;

  // Medir el bloque completo para centrarlo
  const PAD_H = Math.round(sz * 0.45);
  const PAD_V = Math.round(sz * 0.25);
  const GAP   = Math.round(sz * 0.18);

  // Calcular ancho total del bloque (todas las palabras en una línea)
  const textos = grupo.map(p => p.texto.toUpperCase());
  const anchos = textos.map(t => ctx.measureText(t).width);
  const anchoTotal = anchos.reduce((a, b) => a + b, 0) + GAP * (textos.length - 1);
  const maxAncho = W * 0.88;

  // Si no cabe en una línea, partir en dos
  let lineas = [grupo];
  if (anchoTotal > maxAncho && grupo.length > 2) {
    const mid = Math.ceil(grupo.length / 2);
    lineas = [grupo.slice(0, mid), grupo.slice(mid)];
  }

  const alturaLinea = sz * 1.25;
  const alturaBloque = lineas.length * alturaLinea;
  const cy = Math.round(H * (S.subsPosY || 0.78));
  const yInicio = cy - alturaBloque / 2;

  lineas.forEach((linea, li) => {
    const textosL = linea.map(p => p.texto.toUpperCase());
    const anchosL = textosL.map(txt => ctx.measureText(txt).width);
    const anchoL  = anchosL.reduce((a, b) => a + b, 0) + GAP * (textosL.length - 1);
    const xInicio = (W - anchoL) / 2;
    const yL = yInicio + li * alturaLinea;

    // Fondo semitransparente para toda la línea
    if (S.subsBgOp > 0) {
      ctx.save();
      ctx.globalAlpha = S.subsBgOp;
      ctx.fillStyle = '#000000';
      const bgW = anchoL + PAD_H * 2;
      const bgH = sz + PAD_V * 2;
      reelRoundRectCtx(ctx, xInicio - PAD_H, yL - PAD_V, bgW, bgH, Math.round(sz * 0.18));
      ctx.fill();
      ctx.restore();
    }

    // Dibujar cada palabra
    let x = xInicio;
    linea.forEach((pal, pi) => {
      const txt  = pal.texto.toUpperCase();
      const ancho = anchosL[pi];
      // Determinar si esta palabra es la activa
      const esActiva = pal === grupo[idxEnGrupo];

      ctx.save();
      if (esActiva) {
        // Resaltado: texto amarillo con ligero scale up
        ctx.fillStyle = S.subsColorResaltado || '#f5c518';
        ctx.shadowColor = 'rgba(0,0,0,.8)';
        ctx.shadowBlur  = Math.round(sz * 0.15);
        // Escalar ligeramente la palabra activa
        const sc = 1.08;
        ctx.translate(x + ancho / 2, yL + sz / 2);
        ctx.scale(sc, sc);
        ctx.fillText(txt, -ancho / 2, -sz / 2 + sz * 0.85);
      } else {
        ctx.fillStyle = S.subsColorNormal || '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,.9)';
        ctx.shadowBlur  = Math.round(sz * 0.12);
        ctx.fillText(txt, x, yL + sz * 0.85);
      }
      ctx.restore();
      x += ancho + GAP;
    });
  });
}

// Helper roundRect con ctx explícito (para usar fuera de RE.ctx)
function reelRoundRectCtx(ctx, x, y, w, h, r) {
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

  const font = new FontFace('BebasNeue', 'url(/placas/BebasNeue-Regular.ttf)');
  font.load().then(f => {
    document.fonts.add(f);
    RE.fontLoaded = true;
    reelRender();
  }).catch(() => { RE.fontLoaded = true; reelRender(); });

  const li = new Image();
  li.onload  = () => { RE.logoImg = li; reelResetEl('logo'); reelRender(); };
  li.onerror = () => { reelRender(); };
  li.src = '../assets/logo.png';

  reelResizeCanvas();
  reelBindEvents();
  reelRender();
  window.addEventListener('resize', () => { reelResizeCanvas(); reelRender(); });
}

// ══════════════════════════════════════════════════
// CANVAS SIZE
// ══════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════
// DEFAULT POSITIONS
// ══════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════
// RENDER BASE (sin subs, para editor interactivo)
// ══════════════════════════════════════════════════
function reelRenderBase(ctx, W, H, S, bgImg, logoImg, els) {
  ctx.clearRect(0, 0, W, H);

  // Fondo
  if (bgImg) {
    ctx.save();
    if (S.bgBlur > 0) ctx.filter = `blur(${S.bgBlur}px)`;
    const ir = bgImg.width / bgImg.height, cr = W / H;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = bgImg.height; sw = sh * cr; sx = (bgImg.width - sw) / 2; sy = 0; }
    else         { sw = bgImg.width;  sh = sw / cr; sx = 0; sy = (bgImg.height - sh) / 2; }
    const p = S.bgBlur * 4;
    ctx.drawImage(bgImg, sx, sy, sw, sh, -p, -p, W + p * 2, H + p * 2);
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
  if (els.logo.x !== null && logoImg) {
    const el = els.logo;
    ctx.save(); ctx.globalAlpha = S.logoOp;
    ctx.drawImage(logoImg, el.x, el.y, el.w, el.h);
    ctx.restore();
  }

  // Título
  if (els.titulo.x !== null) {
    drawTituloCtx(ctx, W, H, S, els.titulo);
  }
}

function drawTituloCtx(ctx, W, H, S, el) {
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
  if (S.tituloBg !== 'transparent' && S.tituloBgOp > 0) {
    const r = hexRgb(S.tituloBg);
    ctx.save(); ctx.globalAlpha = S.tituloBgOp;
    ctx.fillStyle = `rgb(${r.r},${r.g},${r.b})`;
    reelRoundRectCtx(ctx, el.x, el.y, el.w, el.h, 8); ctx.fill(); ctx.restore();
  }
  const pad = Math.round(el.w * 0.04);
  const aw  = el.w - pad * 2;
  const fontFamily = "'BebasNeue', Impact, sans-serif";
  let sz = Math.max(10, Math.round(el.h * 0.28));
  let lines, lh, bh;
  for (let i = 0; i < 25; i++) {
    ctx.font = `700 ${sz}px ${fontFamily}`;
    lines = wrapText(ctx, S.titulo, aw);
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

// Render del canvas del editor (con UI y preview de subs)
function reelRender() {
  const { W, H, ctx, S, bgImg, logoImg, els, active } = RE;
  reelRenderBase(ctx, W, H, S, bgImg, logoImg, els);

  // Preview de subtítulos en el editor (muestra estado actual)
  if (S.subsActivos && RE.guion) {
    const previewT = RE.subsPreview.activo ? RE.subsPreview.t || 1.5 : 1.5;
    const dur = 30; // duración placeholder para preview
    const ts  = generarTimestamps(RE.guion, dur);
    reelDrawSubs(ctx, W, H, ts, previewT, S);
  }

  if (active) reelDrawActiveUI();
}

// ── HANDLES ──
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
  const lw = Math.max(2, Math.round(W * .002));
  const hs = Math.max(8, Math.round(HR * (W / 1080)));
  ctx.save();
  ctx.strokeStyle = 'rgba(166,206,57,.55)';
  ctx.lineWidth = lw;
  ctx.setLineDash([Math.round(W * .005), Math.round(W * .003)]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#a6ce39';
  ctx.lineWidth = lw * 1.5;
  reelRoundRectCtx(ctx, el.x, el.y, el.w, el.h, 4); ctx.stroke();
  reelGetHandles(active).forEach(h => {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#a6ce39'; ctx.lineWidth = Math.max(2, lw);
    if (h.side === 'v') {
      const hw = hs * .55, hh = hs * 1.3;
      reelRoundRectCtx(ctx, h.x - hw/2, h.y - hh/2, hw, hh, hw/2);
    } else if (h.side === 'h') {
      const hw = hs * 1.3, hh = hs * .55;
      reelRoundRectCtx(ctx, h.x - hw/2, h.y - hh/2, hw, hh, hh/2);
    } else {
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
  if (RE.active) {
    const h = reelHandleHit(pos, RE.active);
    if (h) {
      RE.action = 'resize-' + h.id;
      RE.resizeStart = {
        pos: { ...pos }, rect: { ...RE.els[RE.active] },
        logoAR: (RE.active === 'logo' && RE.logoImg) ? RE.logoImg.width / RE.logoImg.height : null,
      };
      return;
    }
  }
  const k = reelHitEl(pos);
  if (k) { RE.active = k; RE.action = 'drag'; RE.dragOff = { x: pos.x - RE.els[k].x, y: pos.y - RE.els[k].y }; }
  else   { RE.active = null; RE.action = null; }
  reelRender();
}

function reelOnMove(e) {
  if (e.touches) e.preventDefault();
  const pos = reelGetPos(e);
  const { W, H } = RE;
  const SNAP = W * .012;
  if (!RE.action) {
    if (RE.active) { const h = reelHandleHit(pos, RE.active); if (h) { RE.canvas.style.cursor = h.cursor; return; } }
    RE.canvas.style.cursor = reelHitEl(pos) ? 'grab' : 'default'; return;
  }
  const el = RE.els[RE.active];
  if (RE.action === 'drag') {
    let nx = pos.x - RE.dragOff.x, ny = pos.y - RE.dragOff.y;
    if (Math.abs(nx + el.w/2 - W/2) < SNAP) nx = W/2 - el.w/2;
    if (Math.abs(ny + el.h/2 - H/2) < SNAP) ny = H/2 - el.h/2;
    el.x = nx; el.y = ny;
    RE.canvas.style.cursor = 'grabbing';
  }
  if (RE.action.startsWith('resize-')) {
    const corner = RE.action.slice(7), rs = RE.resizeStart;
    const dx = pos.x - rs.pos.x, dy = pos.y - rs.pos.y;
    const MIN = W * .04;
    let { x, y, w, h } = rs.rect;
    if (rs.logoAR) {
      const AR = rs.logoAR;
      if (corner==='se'){w=Math.max(MIN,w+dx);h=w/AR}
      else if(corner==='sw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;h=w/AR}
      else if(corner==='ne'){w=Math.max(MIN,w+dx);const nh=w/AR;y=rs.rect.y+rs.rect.h-nh;h=nh}
      else if(corner==='nw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;const nh=w/AR;y=rs.rect.y+rs.rect.h-nh;h=nh}
      else if(corner==='e'){w=Math.max(MIN,w+dx);h=w/AR}
      else if(corner==='w'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;h=w/AR}
    } else {
      if(corner==='se'){w=Math.max(MIN,w+dx);h=Math.max(MIN,h+dy)}
      else if(corner==='sw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;h=Math.max(MIN,h+dy)}
      else if(corner==='ne'){w=Math.max(MIN,w+dx);const nh=Math.max(MIN,h-dy);y=rs.rect.y+rs.rect.h-nh;h=nh}
      else if(corner==='nw'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw;const nh=Math.max(MIN,h-dy);y=rs.rect.y+rs.rect.h-nh;h=nh}
      else if(corner==='e'){w=Math.max(MIN,w+dx)}
      else if(corner==='w'){const nw=Math.max(MIN,w-dx);x=rs.rect.x+rs.rect.w-nw;w=nw}
      else if(corner==='n'){const nh=Math.max(MIN,h-dy);y=rs.rect.y+rs.rect.h-nh;h=nh}
      else if(corner==='s'){h=Math.max(MIN,h+dy)}
    }
    el.x=x;el.y=y;el.w=w;el.h=h;
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
// EXPORT MP4 CON SUBTÍTULOS
// La estrategia: generar frames del canvas a 10fps,
// cada frame tiene los subs dibujados para ese instante.
// Luego FFmpeg une frames + audio → MP4.
// ══════════════════════════════════════════════════
async function reelExportVideo() {
  if (!RE.audioBlob) { reelToast('Primero generá o cargá el audio'); return; }

  const btn     = document.getElementById('btnExportVideo');
  const prog    = document.getElementById('reelExportProgress');
  const progTxt = document.getElementById('reelExportProgressTxt');
  btn.disabled = true;
  prog.style.display = 'flex';

  try {
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error('Falta configuración de headers COOP/COEP. Verificá que _headers esté desplegado en Cloudflare Pages.');
    }

    const audioDur = await reelGetAudioDuration(RE.audioBlob);
    const FPS      = 10;  // 10fps es suficiente para imagen + subs, mucho menos pesado que 30fps
    const totalFrames = Math.ceil(audioDur * FPS) + 2;
    const guion    = RE.guion || '';
    const usaSubs  = RE.S.subsActivos && guion.length > 0;
    const timestamps = usaSubs ? generarTimestamps(guion, audioDur) : [];

    progTxt.textContent = 'Cargando FFmpeg.wasm (primera vez ~30MB)...';

    const { FFmpeg }    = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js');
    const { fetchFile, toBlobURL } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js');

    const ffmpeg = new FFmpeg();
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    // Desactivar la UI del editor durante la captura
    RE.active = null;

    if (!usaSubs) {
      // Sin subtítulos: imagen estática (más rápido)
      progTxt.textContent = 'Procesando imagen...';
      reelRenderBase(RE.ctx, RE.W, RE.H, RE.S, RE.bgImg, RE.logoImg, RE.els);
      const imgBlob = await new Promise(res => RE.canvas.toBlob(res, 'image/png'));
      await ffmpeg.writeFile('frame.png', await fetchFile(imgBlob));

      const audioExt = getAudioExt(RE.audioBlob);
      await ffmpeg.writeFile('audio.' + audioExt, await fetchFile(RE.audioBlob));

      progTxt.textContent = 'Generando MP4...';
      ffmpeg.on('progress', ({ progress }) => {
        progTxt.textContent = `Generando MP4... ${Math.min(99, Math.round(progress * 100))}%`;
      });

      await ffmpeg.exec([
        '-loop', '1', '-i', 'frame.png',
        '-i', 'audio.' + audioExt,
        '-c:v', 'libx264', '-tune', 'stillimage',
        '-c:a', 'aac', '-b:a', '192k',
        '-pix_fmt', 'yuv420p', '-shortest',
        '-t', String(Math.ceil(audioDur + 0.5)),
        '-movflags', '+faststart', 'output.mp4'
      ]);

    } else {
      // Con subtítulos: generar frames
      // Usamos un canvas offscreen para no interferir con el editor
      const offCanvas = document.createElement('canvas');
      offCanvas.width  = RE.W;
      offCanvas.height = RE.H;
      const offCtx = offCanvas.getContext('2d');

      // Pre-renderizar el fondo base (sin subs) una sola vez
      reelRenderBase(offCtx, RE.W, RE.H, RE.S, RE.bgImg, RE.logoImg, RE.els);
      // Guardar como ImageData para reusar (evita re-renderizar el fondo cada frame)
      const bgImageData = offCtx.getImageData(0, 0, RE.W, RE.H);

      progTxt.textContent = `Generando ${totalFrames} frames con subtítulos...`;

      for (let fi = 0; fi < totalFrames; fi++) {
        const t = fi / FPS;

        // Restaurar fondo
        offCtx.putImageData(bgImageData, 0, 0);

        // Dibujar subs para este frame
        reelDrawSubs(offCtx, RE.W, RE.H, timestamps, t, RE.S);

        // Guardar frame como JPEG (más rápido que PNG para muchos frames)
        const frameBlob = await new Promise(res => offCanvas.toBlob(res, 'image/jpeg', 0.88));
        const frameData = await fetchFile(frameBlob);
        const frameName = `frame_${String(fi).padStart(5, '0')}.jpg`;
        await ffmpeg.writeFile(frameName, frameData);

        if (fi % 5 === 0) {
          progTxt.textContent = `Preparando frames... ${fi}/${totalFrames}`;
        }
      }

      const audioExt = getAudioExt(RE.audioBlob);
      await ffmpeg.writeFile('audio.' + audioExt, await fetchFile(RE.audioBlob));

      progTxt.textContent = 'Codificando video...';
      ffmpeg.on('progress', ({ progress }) => {
        progTxt.textContent = `Codificando MP4... ${Math.min(99, Math.round(progress * 100))}%`;
      });

      // frame_rate = FPS, input = secuencia de jpgs
      await ffmpeg.exec([
        '-framerate', String(FPS),
        '-i', 'frame_%05d.jpg',
        '-i', 'audio.' + audioExt,
        '-c:v', 'libx264',
        '-c:a', 'aac', '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-movflags', '+faststart',
        'output.mp4'
      ]);
    }

    progTxt.textContent = 'Finalizando...';
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url  = URL.createObjectURL(blob);

    const video = document.getElementById('reelVideoPreview');
    const dl    = document.getElementById('reelVideoDownload');
    video.src = url; dl.href = url;
    dl.download = `reel-mediamendoza-${Date.now()}.mp4`;
    document.getElementById('reelVideoResult').style.display = 'block';
    video.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    reelToast('✅ MP4 generado correctamente');
    reelRender(); // restaurar canvas del editor

  } catch (err) {
    console.error('[reelExport]', err);
    reelToast('Error: ' + err.message);
    progTxt.textContent = '✕ Error: ' + err.message;
    reelRender();
  }

  btn.disabled = false;
  prog.style.display = 'none';
}

function getAudioExt(blob) {
  return blob.type.includes('webm') ? 'webm'
       : blob.type.includes('ogg')  ? 'ogg'
       : blob.type.includes('wav')  ? 'wav' : 'mp3';
}

function reelGetAudioDuration(blob) {
  return new Promise(resolve => {
    const au = new Audio();
    au.onloadedmetadata = () => resolve(isFinite(au.duration) && au.duration > 0 ? au.duration : 30);
    au.onerror = () => resolve(30);
    au.src = URL.createObjectURL(blob);
  });
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
// Alias para compatibilidad con drawTituloCtx dentro de reelRender
function reelWrap(text, maxW) { return wrapText(RE.ctx, text, maxW); }

function reelRoundRect(x, y, w, h, r) { reelRoundRectCtx(RE.ctx, x, y, w, h, r); }

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
  if (dir==='l')  el.x = pad;
  if (dir==='r')  el.x = W - el.w - pad;
  if (dir==='ch') el.x = Math.round((W - el.w) / 2);
  if (dir==='t')  el.y = pad;
  if (dir==='b')  el.y = H - el.h - pad;
  if (dir==='cv') el.y = Math.round((H - el.h) / 2);
  reelRender();
}

// ══════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════
window.RE               = RE;
window.reelEditorInit   = reelEditorInit;
window.reelResizeCanvas = reelResizeCanvas;
window.reelRender       = reelRender;
window.reelResetEl      = reelResetEl;
window.reelLoadBg       = reelLoadBg;
window.reelLoadLogo     = reelLoadLogo;
window.reelExportVideo  = reelExportVideo;
window.reelAlign        = reelAlign;
window.generarTimestamps = generarTimestamps;
window.reelDrawSubs     = reelDrawSubs;