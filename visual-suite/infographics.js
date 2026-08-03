// ============================================================
// Visual Suite — Módulo de Infografías (Canvas) — Flyer Style
// ============================================================

let templateActual = 'simple';
let formatoActual = 'landscape';

let titleState = { x: null, y: null, w: null, h: null };
let titleAction = null;
let titleActive = false;
let scale = 1;
let infografiaDataOverride = null;
const TITLE_DEF = {
  simple:      { x: 0.05, y: 0.09, w: 0.9,  h: 0.1 },
  listado:     { x: 0.05, y: 0.09, w: 0.9,  h: 0.1 },
  comparativa: { x: 0.05, y: 0.07, w: 0.9,  h: 0.08 },
  destacado:   { x: 0.05, y: 0.07, w: 0.9,  h: 0.1 }
};

const INFO_BLOCK_TYPES = new Set(['dato', 'barra', 'comparacion', 'ranking', 'pasos', 'texto', 'fuente']);
const INFO_TEMPLATE_ALIASES = { simple: 'simple', comparativa: 'comparativa', listado: 'listado', destacado: 'destacado', datos: 'datos', pasos: 'pasos' };
const INFO_DEFAULTS = { color1: '#a6ce39', color2: '#16201b' };

function infoColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
}

function normalizarLinea(linea) {
  const text = String(linea || '').trim();
  if (!text) return { tipo: 'texto', texto: '' };
  const separator = text.indexOf(':');
  if (separator > 0) {
    return { tipo: 'dato', etiqueta: text.slice(0, separator).trim(), valor: text.slice(separator + 1).trim(), icono: '' };
  }
  return { tipo: 'texto', texto: text };
}

function validarBloque(bloque) {
  if (!bloque || typeof bloque !== 'object') return { ok: false, warning: 'Bloque inválido' };
  const tipo = String(bloque.tipo || '').toLowerCase();
  if (!INFO_BLOCK_TYPES.has(tipo)) return { ok: false, warning: `Tipo de bloque no soportado: ${tipo || 'vacío'}` };
  const normalized = { ...bloque, tipo };
  if (tipo === 'barra' || tipo === 'comparacion' || tipo === 'ranking') {
    normalized.items = Array.isArray(bloque.items) ? bloque.items.filter(item => item && String(item.nombre || '').trim()).map(item => ({
      nombre: String(item.nombre).trim(),
      valor: Number.isFinite(Number(item.valor)) ? Number(item.valor) : String(item.valor || '')
    })) : [];
  }
  if (tipo === 'comparacion' && !normalized.items.length) {
    const sides = [bloque.izquierda, bloque.derecha].filter(Boolean);
    normalized.items = sides.map(side => ({
      nombre: String(side.nombre || side.titulo || side.etiqueta || '').trim(),
      valor: Number.isFinite(Number(side.valor)) ? Number(side.valor) : String(side.valor || '')
    })).filter(item => item.nombre || item.valor);
  }
  if (tipo === 'dato') {
    normalized.etiqueta = String(bloque.etiqueta || '').trim();
    normalized.valor = String(bloque.valor ?? '').trim();
    normalized.detalle = String(bloque.detalle || '').trim();
    if (Array.isArray(bloque.items) && bloque.items.length >= 2) {
      normalized.tipo = 'comparacion';
      normalized.items = bloque.items.slice(0, 2).map(item => ({
        nombre: String(item.nombre || item.titulo || item.etiqueta || '').trim(),
        valor: Number.isFinite(Number(item.valor)) ? Number(item.valor) : String(item.valor || '')
      })).filter(item => item.nombre || item.valor);
    }
  }
  if (tipo === 'texto') normalized.texto = String(bloque.texto || bloque.contenido || '').trim();
  if (tipo === 'pasos') normalized.items = Array.isArray(bloque.items) ? bloque.items.map(item => ({ ...item, nombre: String(item.nombre || item.titulo || '').trim(), detalle: String(item.detalle || item.descripcion || '').trim() })).filter(item => item.nombre) : [];
  normalized.icono = String(bloque.icono || '').trim();
  normalized.color = infoColor(bloque.color, '');
  return { ok: true, bloque: normalized };
}

function normalizarInfografia(input) {
  const source = typeof input === 'string' ? { contenido: input } : (input && typeof input === 'object' ? input : {});
  const warnings = [];
  const rawBlocks = Array.isArray(source.bloques)
    ? source.bloques
    : Array.isArray(source.lineas)
      ? source.lineas.map(normalizarLinea)
      : String(source.contenido || source.content || '').split(/\r?\n/).filter(Boolean).map(normalizarLinea);
  const bloques = [];
  rawBlocks.forEach(block => {
    const result = validarBloque(block);
    if (result.ok) bloques.push(result.bloque);
    else warnings.push(result.warning);
  });
  if ((source.color_principal || source.color1) && !/^#[0-9a-f]{6}$/i.test(String(source.color_principal || source.color1))) warnings.push('Color principal inválido: se aplicó la paleta de marca');
  if ((source.color_secundario || source.color2) && !/^#[0-9a-f]{6}$/i.test(String(source.color_secundario || source.color2))) warnings.push('Color secundario inválido: se aplicó la paleta de marca');
  const requestedTemplate = String(source.template_sugerido || source.template || 'simple').toLowerCase();
  return {
    titulo: String(source.titulo || source.title || 'Infografía').trim(),
    bajada: String(source.bajada || source.subtitulo || '').trim(),
    fecha: String(source.fecha || '').trim(),
    fuente: String(source.fuente || 'Fuente no especificada').trim(),
    template: INFO_TEMPLATE_ALIASES[requestedTemplate] || 'simple',
    color1: infoColor(source.color_principal || source.color1, INFO_DEFAULTS.color1),
    color2: infoColor(source.color_secundario || source.color2, INFO_DEFAULTS.color2),
    bloques,
    warnings
  };
}

function resumirTituloInfografia(text, maxChars = 48) {
  const value = String(text || '').trim();
  if (value.length <= maxChars) return value;
  const shortened = value.slice(0, Math.max(1, maxChars - 1)).replace(/\s+\S*$/, '').trim();
  return `${shortened}…`;
}

function ajustarTextoCanvas(ctx, text, maxWidth, maxLines = 3, fontSize = 30) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let size = Math.max(10, Number(fontSize) || 30);
  let lines = [];
  while (size >= 10) {
    ctx.font = `${size}px Inter, sans-serif`;
    lines = [];
    let current = '';
    words.forEach(word => {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) current = candidate;
      else { lines.push(current); current = word; }
    });
    if (current) lines.push(current);
    if (lines.length <= maxLines) break;
    size -= 1;
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines.length - 1;
    while (ctx.measureText(`${lines[last]}…`).width > maxWidth && lines[last].length > 3) lines[last] = lines[last].slice(0, -1);
    lines[last] += '…';
  }
  size = Math.max(10, size);
  return { lines, fontSize: size, height: Math.round(size * 1.2 * lines.length) };
}

function dibujarTextoAjustado(ctx, text, maxWidth, maxLines, fontSize, x, y, lineHeight = 1.2) {
  const fitted = ajustarTextoCanvas(ctx, text, maxWidth, maxLines, fontSize);
  fitted.lines.forEach((line, index) => ctx.fillText(line, x, y + index * fitted.fontSize * lineHeight));
  return fitted;
}

function infografiaBloqueRect(tipo, index, total, W, H, template = 'simple') {
  const margin = W * .055;
  const gap = Math.max(14, W * .018);
  const top = H * .27;
  const bottom = H * .86;
  const story = H > W * 1.1;
  const columns = story ? 1 : (template === 'comparativa' || total > 1 ? 2 : 1);
  const rows = Math.max(1, Math.ceil(Math.max(1, total) / columns));
  const cardW = (W - margin * 2 - gap * (columns - 1)) / columns;
  const cardH = (bottom - top - gap * (rows - 1)) / rows;
  const column = index % columns;
  const row = Math.floor(index / columns);
  return { x: margin + column * (cardW + gap), y: top + row * (cardH + gap), w: cardW, h: cardH };
}

function calcularInfografiaLayout(W, H, data) {
  const total = Math.min(Array.isArray(data?.bloques) ? data.bloques.length : 0, 8);
  const blocks = Array.from({ length: total }, (_, index) => infografiaBloqueRect(data?.bloques?.[index]?.tipo || 'dato', index, total, W, H, data?.template || 'simple'));
  return {
    header: { x: 0, y: 0, w: W, h: H * .23 },
    blocks,
    source: { x: W * .055, y: H * .89, w: W * .89, h: H * .035 },
    footer: { x: W * .055, y: H * .96, w: W * .89, h: H * .025 }
  };
}

function resetTitlePos() {
  const d = TITLE_DEF[templateActual] || TITLE_DEF.simple;
  titleState = { ...d };
}

function cambiarFormatoInfografia() {
  const fmt = document.getElementById('infoFormato').value;
  if (!VS_Formats[fmt]) return;
  formatoActual = fmt;
  const area = document.getElementById('infografiaArea');
  if (area) area.style.aspectRatio = VS_Formats[fmt].cssAR;
  renderizarInfografia();
}

function initInfographics() {
  const area = document.getElementById('infografiaArea');
  if (area) area.style.aspectRatio = VS_Formats[formatoActual].cssAR;
  resetTitlePos();
  renderizarInfografia();

  const canvas = document.getElementById('infografiaCanvas');
  if (canvas && !canvas._vsListenersAdded) {
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas._vsListenersAdded = true;
  }
}

function getPos(e) {
  const canvas = document.getElementById('infografiaCanvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return { x: (t.clientX - rect.left) * scale, y: (t.clientY - rect.top) * scale };
}

function getHandleHit(pos) {
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  const el = { x: s.x * fmtW(), y: s.y * fmtH(), w: s.w * fmtW(), h: s.h * fmtH() };
  const base = Math.round(16 * (fmtW() / 1080));
  const handles = [
    { id: 'nw', x: el.x, y: el.y, t: 'c' }, { id: 'ne', x: el.x + el.w, y: el.y, t: 'c' },
    { id: 'sw', x: el.x, y: el.y + el.h, t: 'c' }, { id: 'se', x: el.x + el.w, y: el.y + el.h, t: 'c' },
    { id: 'w', x: el.x, y: el.y + el.h / 2, t: 's' }, { id: 'e', x: el.x + el.w, y: el.y + el.h / 2, t: 's' }
  ];
  for (const h of handles) {
    const hitR = h.t === 'c' ? base * 2.5 : base * 2;
    if (Math.abs(pos.x - h.x) < hitR && Math.abs(pos.y - h.y) < hitR) return h.id;
  }
  return null;
}

function fmtW() { return VS_Formats[formatoActual].w; }
function fmtH() { return VS_Formats[formatoActual].h; }

function onDown(e) {
  if (e.touches) e.preventDefault();
  const pos = getPos(e);
  if (!pos) return;
  const W = fmtW(), H = fmtH();
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  const el = { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H };
  const hid = getHandleHit(pos);
  if (hid) {
    titleAction = 'resize-' + hid;
    titleActive = true;
    titleState._offX = pos.x; titleState._offY = pos.y;
    titleState._startS = { x: s.x, y: s.y, w: s.w, h: s.h };
  } else if (pos.x >= el.x && pos.x <= el.x + el.w && pos.y >= el.y && pos.y <= el.y + el.h) {
    titleAction = 'drag';
    titleActive = true;
    titleState._offX = pos.x - el.x; titleState._offY = pos.y - el.y;
  } else {
    titleActive = false;
    renderizarInfografia();
  }
  if (e.touches && titleAction) {
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    document.addEventListener('touchcancel', onUp);
  }
}

function onMove(e) {
  if (e.touches) e.preventDefault();
  if (!titleAction) return;
  const pos = getPos(e);
  if (!pos) return;
  const W = fmtW(), H = fmtH();
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  if (titleAction === 'drag') {
    let nx = (pos.x - titleState._offX) / W;
    let ny = (pos.y - titleState._offY) / H;
    nx = Math.max(0, Math.min(1 - s.w, nx));
    ny = Math.max(0, Math.min(1 - s.h, ny));
    const ecx = nx + s.w / 2, ecy = ny + s.h / 2;
    const SNAP = W * 0.014 / W;
    if (Math.abs(ecx - 0.5) < SNAP) nx = 0.5 - s.w / 2;
    if (Math.abs(ecy - 0.5) < SNAP) ny = 0.5 - s.h / 2;
    s.x = nx; s.y = ny;
    titleState = s;
  } else {
    const corner = titleAction.replace('resize-', '');
    const MIN = W * 0.04;
    const SMAX = { x: 1 - MIN / W, y: 1 - MIN / H, w: 1, h: 0.4 };
    let { x, y, w, h } = titleState._startS;
    const dx = pos.x - titleState._offX;
    const dy = pos.y - titleState._offY;
    if (corner === 'se') { w = Math.max(MIN / W, Math.min(SMAX.w, w + dx / W)); h = Math.max(MIN / H, Math.min(SMAX.h, h + dy / H)); }
    else if (corner === 'sw') { const nw = Math.max(MIN / W, Math.min(SMAX.w, w - dx / W)); x = x + w - nw; w = nw; h = Math.max(MIN / H, Math.min(SMAX.h, h + dy / H)); }
    else if (corner === 'ne') { w = Math.max(MIN / W, Math.min(SMAX.w, w + dx / W)); const nh = Math.max(MIN / H, Math.min(SMAX.h, h - dy / H)); y = y + h - nh; h = nh; }
    else if (corner === 'nw') { const nw = Math.max(MIN / W, Math.min(SMAX.w, w - dx / W)); x = x + w - nw; w = nw; const nh = Math.max(MIN / H, Math.min(SMAX.h, h - dy / H)); y = y + h - nh; h = nh; }
    else if (corner === 'w') { const nw = Math.max(MIN / W, Math.min(SMAX.w, w - dx / W)); x = x + w - nw; w = nw; }
    else if (corner === 'e') { w = Math.max(MIN / W, Math.min(SMAX.w, w + dx / W)); }
    Object.assign(s, { x, y, w, h });
    titleState = s;
  }
  renderizarInfografia();
}

function onUp() {
  titleAction = null;
  document.removeEventListener('touchmove', onMove);
  document.removeEventListener('touchend', onUp);
  document.removeEventListener('touchcancel', onUp);
  renderizarInfografia();
}

function seleccionarTemplate(template) {
  templateActual = template;
  resetTitlePos();
  document.querySelectorAll('.vs-infografia-template').forEach(el => {
    el.classList.toggle('active', el.dataset.template === template);
  });
  const nombres = { simple: 'Flyer Simple', comparativa: 'Comparativa', listado: 'Listado', destacado: 'Destacado', datos: 'Datos', pasos: 'Pasos' };
  document.getElementById('infoTemplateBadge').textContent = nombres[template] || 'Flyer Simple';
  renderizarInfografia();
}

function drawInfografiaSource(ctx, W, H, fuente, dark = true) {
  const M = W * .055;
  ctx.fillStyle = dark ? 'rgba(255,255,255,.68)' : VS_Colors.INK2;
  ctx.font = `500 ${Math.max(18, Math.round(H * .014))}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`Fuente: ${fuente || 'Fuente no especificada'}`, M, H * .945);
}

function drawInfoCard(ctx, rect, color, dark = true) {
  ctx.fillStyle = dark ? 'rgba(255,255,255,.075)' : 'rgba(255,255,255,.78)';
  ctx.strokeStyle = dark ? 'rgba(255,255,255,.16)' : 'rgba(22,32,27,.12)';
  ctx.lineWidth = Math.max(2, rect.w * .0015);
  ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.w, rect.h, Math.min(22, rect.w * .025)); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(rect.x, rect.y, Math.max(8, rect.w * .012), rect.h, Math.min(22, rect.w * .025)); ctx.fill();
}

function drawInfografiaBlockLegacy(ctx, rect, bloque, data, dark = true) {
  const color = bloque.color || data.color1;
  const ink = dark ? '#fff' : VS_Colors.INK;
  const muted = dark ? 'rgba(255,255,255,.7)' : VS_Colors.INK2;
  drawInfoCard(ctx, rect, color, dark);
  const pad = rect.w * .06;
  const innerX = rect.x + pad;
  const innerW = rect.w - pad * 2;
  if (bloque.tipo === 'dato') {
    const chip = Math.min(rect.h * .45, rect.w * .18);
    VS_CanvasHelpers.drawIconChip(ctx, innerX, rect.y + rect.h * .2, chip, bloque.icono || VS_Utils.detectarEmoji(`${bloque.etiqueta} ${bloque.valor}`), color);
    const textX = innerX + chip + pad * .45;
    const textW = rect.x + rect.w - pad - textX;
    ctx.fillStyle = muted; ctx.font = `700 ${Math.max(18, rect.h * .12)}px Inter, sans-serif`; dibujarTextoAjustado(ctx, bloque.etiqueta || 'Dato', textW, 2, Math.max(18, rect.h * .12), textX, rect.y + rect.h * .34, 1.05);
    ctx.fillStyle = ink; ctx.font = `800 ${Math.max(28, rect.h * .27)}px Inter, sans-serif`; ctx.fillText(bloque.valor || '—', innerX + chip + pad * .45, rect.y + rect.h * .67);
    if (bloque.detalle) { ctx.fillStyle = color; ctx.font = `600 ${Math.max(16, rect.h * .1)}px Inter, sans-serif`; dibujarTextoAjustado(ctx, bloque.detalle, textW, 2, Math.max(16, rect.h * .1), textX, rect.y + rect.h * .84, 1.05); }
    return;
  }
  if (bloque.tipo === 'texto') {
    ctx.fillStyle = ink; ctx.font = `600 ${Math.max(18, rect.h * .13)}px Inter, sans-serif`;
    const fitted = ajustarTextoCanvas(ctx, bloque.texto, innerW, 5, Math.max(18, rect.h * .13));
    fitted.lines.forEach((line, index) => ctx.fillText(line, innerX, rect.y + rect.h * .32 + index * fitted.fontSize * 1.22));
    return;
  }
  if (bloque.tipo === 'barra') {
    ctx.fillStyle = ink; ctx.font = `700 ${Math.max(18, rect.h * .13)}px Inter, sans-serif`; ctx.fillText(bloque.etiqueta || 'Distribución', innerX, rect.y + rect.h * .23);
    const items = bloque.items || []; const rowH = rect.h * .55 / Math.max(items.length, 1);
    items.slice(0, 6).forEach((item, index) => {
      const y = rect.y + rect.h * .36 + index * rowH;
      const pct = Math.max(0, Math.min(100, Number(item.valor) || 0));
      ctx.fillStyle = muted; ctx.font = `600 ${Math.max(14, rowH * .35)}px Inter, sans-serif`; dibujarTextoAjustado(ctx, item.nombre, innerW * .7, 1, Math.max(14, rowH * .35), innerX, y);
      ctx.textAlign = 'right'; ctx.fillText(`${item.valor}%`, rect.x + rect.w - pad, y); ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.roundRect(innerX, y + rowH * .18, innerW, Math.max(6, rowH * .16), 8); ctx.fill();
      ctx.fillStyle = color; ctx.roundRect(innerX, y + rowH * .18, innerW * pct / 100, Math.max(6, rowH * .16), 8); ctx.fill();
    });
    return;
  }
  if (bloque.tipo === 'ranking') {
    ctx.fillStyle = ink; ctx.font = `700 ${Math.max(18, rect.h * .13)}px Inter, sans-serif`; ctx.fillText(bloque.etiqueta || 'Ranking', innerX, rect.y + rect.h * .22);
    const items = bloque.items || []; const rowH = rect.h * .65 / Math.max(items.length, 1);
    items.slice(0, 6).forEach((item, index) => {
      const y = rect.y + rect.h * .38 + index * rowH;
      ctx.fillStyle = color; ctx.font = `800 ${Math.max(18, rowH * .46)}px Inter, sans-serif`; ctx.fillText(String(index + 1).padStart(2, '0'), innerX, y);
      ctx.fillStyle = ink; ctx.font = `600 ${Math.max(16, rowH * .34)}px Inter, sans-serif`; dibujarTextoAjustado(ctx, item.nombre, innerW * .63, 1, Math.max(16, rowH * .34), innerX + rect.w * .12, y);
      ctx.textAlign = 'right'; ctx.fillStyle = muted; ctx.fillText(String(item.valor ?? ''), rect.x + rect.w - pad, y); ctx.textAlign = 'left';
    });
    return;
  }
  if (bloque.tipo === 'comparacion') {
    const items = bloque.items || []; const mid = rect.x + rect.w / 2;
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.moveTo(mid, rect.y + rect.h * .2); ctx.lineTo(mid, rect.y + rect.h * .86); ctx.stroke();
    items.slice(0, 2).forEach((item, index) => {
      const cx = rect.x + rect.w * (index ? .72 : .28); ctx.textAlign = 'center'; ctx.fillStyle = muted; ctx.font = `700 ${Math.max(16, rect.h * .12)}px Inter, sans-serif`; ctx.fillText(item.nombre, cx, rect.y + rect.h * .32);
      ctx.fillStyle = ink; ctx.font = `800 ${Math.max(28, rect.h * .28)}px Inter, sans-serif`; ctx.fillText(String(item.valor ?? '—'), cx, rect.y + rect.h * .62);
    }); ctx.textAlign = 'left'; return;
  }
  if (bloque.tipo === 'pasos') {
    const items = bloque.items || []; const rowH = rect.h * .7 / Math.max(items.length, 1);
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(3, rect.w * .004); ctx.beginPath(); ctx.moveTo(innerX + rect.w * .04, rect.y + rect.h * .28); ctx.lineTo(innerX + rect.w * .04, rect.y + rect.h * .28 + rowH * Math.max(items.length - 1, 0)); ctx.stroke();
    items.slice(0, 6).forEach((item, index) => {
      const cy = rect.y + rect.h * .28 + index * rowH; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(innerX + rect.w * .04, cy, Math.max(10, rect.w * .018), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ink; ctx.font = `700 ${Math.max(16, rowH * .28)}px Inter, sans-serif`; ctx.fillText(item.nombre, innerX + rect.w * .1, cy + rowH * .08);
      if (item.detalle) { ctx.fillStyle = muted; ctx.font = `500 ${Math.max(13, rowH * .2)}px Inter, sans-serif`; ctx.fillText(item.detalle, innerX + rect.w * .1, cy + rowH * .34); }
    }); return;
  }
  ctx.fillStyle = ink; ctx.font = `700 ${Math.max(18, rect.h * .13)}px Inter, sans-serif`; ctx.fillText(bloque.etiqueta || 'Información', innerX, rect.y + rect.h * .3);
}

// Safe replacement for the first renderer: every text field is constrained to its card.
function drawInfografiaBlock(ctx, rect, bloque, data, dark = true) {
  const color = bloque.color || data.color1;
  const ink = dark ? '#fff' : VS_Colors.INK;
  const muted = dark ? 'rgba(255,255,255,.72)' : VS_Colors.INK2;
  drawInfoCard(ctx, rect, color, dark);
  const pad = rect.w * .06;
  const innerX = rect.x + pad;
  const innerW = rect.w - pad * 2;
  const base = Math.max(14, rect.h * .1);
  const text = (value, width, lines, size, x, y, colorValue = ink, align = 'left') => {
    ctx.fillStyle = colorValue;
    ctx.font = `600 ${size}px Inter, sans-serif`;
    ctx.textAlign = align;
    dibujarTextoAjustado(ctx, value, width, lines, size, x, y, 1.05);
    ctx.textAlign = 'left';
  };

  if (bloque.tipo === 'dato') {
    const chip = Math.min(rect.h * .4, rect.w * .16);
    const textX = innerX + chip + pad * .45;
    const textW = Math.max(40, rect.x + rect.w - pad - textX);
    VS_CanvasHelpers.drawIconChip(ctx, innerX, rect.y + rect.h * .2, chip, bloque.icono || VS_Utils.detectarEmoji(`${bloque.etiqueta} ${bloque.valor}`), color);
    text(bloque.etiqueta || 'Dato', textW, 2, Math.max(18, rect.h * .105), textX, rect.y + rect.h * .34, muted);
    text(bloque.valor || '--', textW, 1, Math.max(28, rect.h * .24), textX, rect.y + rect.h * .65, ink);
    if (bloque.detalle) text(bloque.detalle, textW, 2, Math.max(15, rect.h * .085), textX, rect.y + rect.h * .83, color);
    return;
  }
  if (bloque.tipo === 'texto') {
    text(bloque.texto, innerW, 5, Math.max(18, rect.h * .12), innerX, rect.y + rect.h * .3, ink);
    return;
  }
  if (bloque.tipo === 'barra') {
    text(bloque.etiqueta || 'Distribucion', innerW, 2, Math.max(18, rect.h * .11), innerX, rect.y + rect.h * .2, ink);
    const items = (bloque.items || []).slice(0, 6);
    const rowH = rect.h * .58 / Math.max(items.length, 1);
    items.forEach((item, index) => {
      const y = rect.y + rect.h * .35 + index * rowH;
      const pct = Math.max(0, Math.min(100, Number(item.valor) || 0));
      text(item.nombre, innerW * .68, 1, Math.max(14, rowH * .3), innerX, y, muted);
      text(`${item.valor}%`, innerW * .25, 1, Math.max(14, rowH * .3), rect.x + rect.w - pad, y, muted, 'right');
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.roundRect(innerX, y + rowH * .18, innerW, Math.max(6, rowH * .14), 8); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(innerX, y + rowH * .18, innerW * pct / 100, Math.max(6, rowH * .14), 8); ctx.fill();
    });
    return;
  }
  if (bloque.tipo === 'ranking') {
    text(bloque.etiqueta || 'Ranking', innerW, 2, Math.max(18, rect.h * .11), innerX, rect.y + rect.h * .2, ink);
    const items = (bloque.items || []).slice(0, 6);
    const rowH = rect.h * .62 / Math.max(items.length, 1);
    items.forEach((item, index) => {
      const y = rect.y + rect.h * .36 + index * rowH;
      text(String(index + 1).padStart(2, '0'), innerW * .1, 1, Math.max(16, rowH * .4), innerX, y, color);
      text(item.nombre, innerW * .58, 1, Math.max(15, rowH * .3), innerX + rect.w * .12, y, ink);
      text(String(item.valor ?? ''), innerW * .22, 1, Math.max(15, rowH * .3), rect.x + rect.w - pad, y, muted, 'right');
    });
    return;
  }
  if (bloque.tipo === 'comparacion') {
    const items = (bloque.items || []).slice(0, 2);
    const mid = rect.x + rect.w / 2;
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.moveTo(mid, rect.y + rect.h * .18); ctx.lineTo(mid, rect.y + rect.h * .86); ctx.stroke();
    items.forEach((item, index) => {
      const cx = rect.x + rect.w * (index ? .72 : .28);
      text(item.nombre, rect.w * .42, 2, Math.max(20, rect.h * .14), cx, rect.y + rect.h * .3, muted, 'center');
      text(String(item.valor ?? '--'), rect.w * .42, 1, Math.max(34, rect.h * .31), cx, rect.y + rect.h * .62, ink, 'center');
    });
    return;
  }
  if (bloque.tipo === 'pasos') {
    const items = (bloque.items || []).slice(0, 6);
    const rowH = rect.h * .68 / Math.max(items.length, 1);
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(3, rect.w * .004); ctx.beginPath(); ctx.moveTo(innerX + rect.w * .04, rect.y + rect.h * .27); ctx.lineTo(innerX + rect.w * .04, rect.y + rect.h * .27 + rowH * Math.max(items.length - 1, 0)); ctx.stroke();
    items.forEach((item, index) => {
      const cy = rect.y + rect.h * .27 + index * rowH;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(innerX + rect.w * .04, cy, Math.max(10, rect.w * .018), 0, Math.PI * 2); ctx.fill();
      text(item.nombre, innerW * .82, 1, Math.max(24, rowH * .42), innerX + rect.w * .1, cy + rowH * .04, ink);
      if (item.detalle) text(item.detalle, innerW * .82, 2, Math.max(17, rowH * .27), innerX + rect.w * .1, cy + rowH * .32, muted);
    });
    return;
  }
  text(bloque.etiqueta || 'Informacion', innerW, 2, base, innerX, rect.y + rect.h * .3, ink);
}

function renderInfografiaModular(ctx, W, H, data) {
  const dark = data.template !== 'simple' && data.template !== 'datos';
  VS_CanvasHelpers.drawPlateBackground(ctx, W, H, { dark, accent: data.color1 });
  VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'INFOGRAFÍA', '', VS_CanvasHelpers.plateHeaderHeight(W, H));
  ctx.fillStyle = data.color1; ctx.fillRect(0, 0, W, Math.max(8, H * .006));
  const titleX = W * .055;
  const titleW = W * .89;
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.max(34, H * .055)}px DM Serif Display, serif`;
  const displayTitle = resumirTituloInfografia(data.titulo);
  const titleFit = ajustarTextoCanvas(ctx, displayTitle, titleW, 1, Math.max(34, H * .055));
  const titleSize = Math.max(Math.round(H * .045), titleFit.fontSize);
  dibujarTextoAjustado(ctx, displayTitle, titleW, 1, titleSize, titleX, H * .14, 1.05);
  if (data.bajada) { ctx.fillStyle = dark ? 'rgba(255,255,255,.72)' : VS_Colors.INK2; ctx.font = `500 ${Math.max(18, H * .022)}px Inter, sans-serif`; dibujarTextoAjustado(ctx, data.bajada, titleW, 2, Math.max(18, H * .022), titleX, H * .2, 1.05); }
  const layout = calcularInfografiaLayout(W, H, data);
  data.bloques.slice(0, layout.blocks.length).forEach((bloque, index) => drawInfografiaBlock(ctx, layout.blocks[index], bloque, data, dark));
  drawInfografiaSource(ctx, W, H, data.fuente, dark);
  VS_CanvasHelpers.drawFooter(ctx, W, H, dark);
}

function renderizarInfografia() {
  const canvas = document.getElementById('infografiaCanvas');
  const fmt = VS_Formats[formatoActual] || VS_Formats.landscape;
  const W = fmt.w, H = fmt.h;
  const cssW = canvas.parentElement.clientWidth || 800;
  const cssH = cssW * H / W;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = W;
  canvas.height = H;
  scale = W / cssW;

  const ctx = canvas.getContext('2d');
  const color1 = document.getElementById('infoColor1').value;
  const color2 = document.getElementById('infoColor2').value;
  const title = document.getElementById('infoTitle').value || 'Infografía';
  const content = document.getElementById('infoContent').value || '';

  ctx.clearRect(0, 0, W, H);

  const data = normalizarInfografia({ ...(infografiaDataOverride || {}), titulo: title, contenido: infografiaDataOverride ? undefined : content, fuente: infografiaDataOverride?.fuente || 'Media Mendoza', template: templateActual, color1, color2 });
  renderInfografiaModular(ctx, W, H, data);

  VS_CanvasHelpers.drawPlateLogo(ctx, W, H);

}

function drawGradientBg(ctx, W, H, c1, c2, diagonal) {
  const grad = ctx.createLinearGradient(diagonal ? 0 : 0, 0, diagonal ? W : 0, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawDecorativeCircles(ctx, W, H, c1) {
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = c1;
    const x = (i * 137 + 50) % W;
    const y = (i * 211 + 30) % H;
    const r = 30 + (i * 17) % 60;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, W, H, title, accent, dark, kicker) {
  if (!title) return;
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  const bx = s.x * W, by = s.y * H, bw = s.w * W, bh = s.h * H;
  const pad = Math.round(bw * 0.025);
  const aw = bw - pad * 2;
  if (aw <= 0) return;
  if (kicker) {
    ctx.textAlign = 'left';
    ctx.fillStyle = accent;
    ctx.font = `700 ${Math.round(bh * 0.18)}px "Inter", sans-serif`;
    ctx.fillText(kicker.toUpperCase(), bx + pad, by + Math.round(bh * 0.12));
  }
  const kickH = kicker ? bh * 0.3 : 0;
  let sz = Math.max(10, Math.round(bh * 0.35));
  let lines, lh;
  for (let i = 0; i < 20; i++) {
    ctx.font = `400 ${sz}px "DM Serif Display", serif`;
    lines = VS_Utils.wrapText(ctx, title, aw);
    lh = Math.round(sz * 1.15);
    if (lines.length * lh <= (bh - kickH) * 0.9 || sz <= 10) break;
    sz = Math.max(10, Math.round(sz * 0.88));
  }
  const textH = lines.length * lh;
  const titleAreaH = bh - kickH;
  const sy = by + kickH + Math.round((titleAreaH - textH) / 2);
  const cx = bx + Math.round(bw / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = dark ? '#ffffff' : VS_Colors.INK;
  ctx.shadowColor = dark ? 'rgba(0,0,0,0.85)' : 'transparent';
  ctx.shadowBlur = dark ? Math.round(sz * 0.18) : 0;
  ctx.shadowOffsetX = dark ? Math.round(sz * 0.04) : 0;
  ctx.shadowOffsetY = dark ? Math.round(sz * 0.04) : 0;
  lines.forEach((l, i) => ctx.fillText(l, cx, sy + i * lh));
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function getTitleRect(W, H) {
  const s = titleState.x != null ? titleState : TITLE_DEF[templateActual] || TITLE_DEF.simple;
  return { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H };
}

// ── Template: Flyer Simple ──
function renderFlyerSimple(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(255,255,255,0.85)')) {
    VS_CanvasHelpers.drawPlateBackground(ctx, W, H, { accent: c1 });
  }
    VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'RESUMEN', '', VS_CanvasHelpers.plateHeaderHeight(W, H));

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, Math.round(H * 0.006));

  drawTitle(ctx, W, H, title, c1, true, null);

  const lines = content.split('\n').filter(l => l.trim());
  const maxCards = Math.min(lines.length, 8);
  const tr = getTitleRect(W, H);
  const top = tr.y + tr.h + H * 0.02;
  const bottom = H - H * 0.07;
  const areaH = bottom - top;
  const cardH = Math.min(areaH / Math.max(maxCards, 1) * 0.82, H * 0.09);
  const gap = maxCards ? (areaH - cardH * maxCards) / maxCards : 0;

  lines.slice(0, maxCards).forEach((line, i) => {
    const y = top + i * (cardH + gap);
    const cy = y + cardH / 2;

    ctx.fillStyle = VS_Utils.hexToRgba(c2, 0.06);
    ctx.beginPath();
    ctx.roundRect(M + 2, y + 3, W - 2 * M, cardH, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(M, y, W - 2 * M, cardH, 12);
    ctx.fill();

    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.roundRect(M, y, W - 2 * M, Math.round(W * 0.005), [12, 12, 0, 0]);
    ctx.fill();

    const chip = cardH * 0.58;
    const chipX = M + W * 0.025;
    const chipY = cy - chip / 2;
    VS_CanvasHelpers.drawIconChip(ctx, chipX, chipY, chip, VS_Utils.detectarEmoji(line), c1);

    const textX = chipX + chip + W * 0.025;
    const textW = (W - 2 * M) - (textX - M);
    const { label, value, hasColon } = VS_Utils.splitLinea(line);
    ctx.textAlign = 'left';

    if (hasColon) {
      ctx.fillStyle = VS_Colors.INK;
      ctx.font = `600 ${cardH * 0.2}px "Inter", sans-serif`;
      ctx.fillText(label, textX, y + cardH * 0.38);
      ctx.fillStyle = c1;
      ctx.font = `800 ${cardH * 0.28}px "Inter", sans-serif`;
      let v = value;
      while (ctx.measureText(v).width > textW * 0.5 && v.length > 2) v = v.slice(0, -1);
      ctx.fillText(v, textX, y + cardH * 0.76);
      const valNum = parseFloat(String(value).replace(',', '.'));
      if (!isNaN(valNum) && valNum > 0) {
        const barW = textW * 0.3;
        const barH = Math.round(cardH * 0.06);
        VS_Utils.drawDataBar(ctx, textX + ctx.measureText(v).width + W * 0.015, y + cardH * 0.68, barW, barH, Math.min(valNum / 100, 1), c1);
      }
    } else {
      ctx.fillStyle = VS_Colors.INK;
      ctx.font = `600 ${cardH * 0.24}px "Inter", sans-serif`;
      ctx.fillText(line, textX, cy + cardH * 0.08);
    }
  });

  VS_CanvasHelpers.drawFooter(ctx, W, H, false);
}

// ── Template: Flyer Comparativa ──
function renderFlyerComparativa(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(10,12,22,0.9)')) {
    VS_CanvasHelpers.drawPlateBackground(ctx, W, H, { dark: true, accent: c1 });
  }
    VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'COMPARATIVA', '', VS_CanvasHelpers.plateHeaderHeight(W, H));

  const tr = getTitleRect(W, H);
  const headerPad = W * 0.01;
  ctx.fillStyle = VS_Utils.hexToRgba(c1, 0.12);
  ctx.fillRect(0, 0, W, tr.y + tr.h + headerPad);
  ctx.fillStyle = c1;
  ctx.fillRect(0, tr.y + tr.h + headerPad - Math.round(H * 0.005), W, Math.round(H * 0.005));
  drawTitle(ctx, W, H, title, c1, true, null);

  const lines = content.split('\n').filter(l => l.trim());
  const leftItems = lines.filter((_, i) => i % 2 === 0);
  const rightItems = lines.filter((_, i) => i % 2 === 1);
  const midX = W / 2;
  const maxN = Math.max(leftItems.length, rightItems.length, 1);
  const headerBot = tr.y + tr.h + headerPad;
  const itemH = Math.min(H * 0.1, (H - headerBot - H * 0.05) / maxN);
  const startY = headerBot + (H - headerBot - itemH * maxN) / 2;

  const vsR = W * 0.028;
  ctx.shadowColor = VS_Utils.hexToRgba(c1, 0.5);
  ctx.shadowBlur = 30;
  ctx.fillStyle = VS_Utils.hexToRgba(c1, 0.15);
  ctx.beginPath();
  ctx.arc(midX, startY + itemH * 0.3, vsR * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.arc(midX, startY + itemH * 0.3, vsR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${vsR * 0.9}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', midX, startY + itemH * 0.3);
  ctx.textBaseline = 'alphabetic';

  const colW = (midX - M - W * 0.04);

  leftItems.slice(0, maxN).forEach((item, i) => {
    const cy = startY + i * itemH + itemH * 0.6;
    const chip = itemH * 0.45;
    VS_CanvasHelpers.drawIconChip(ctx, M, cy - chip / 2, chip, VS_Utils.detectarEmoji(item), c1);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${H * 0.022}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(item, M + chip + W * 0.02, cy + itemH * 0.08);

    const valNum = parseFloat(String(item).replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!isNaN(valNum) && valNum > 0) {
      VS_Utils.drawDataBar(ctx, M + chip + W * 0.02, cy + itemH * 0.12, colW * 0.5, Math.round(H * 0.012), Math.min(valNum / 100, 1), c1);
    }
  });

  rightItems.slice(0, maxN).forEach((item, i) => {
    const cy = startY + i * itemH + itemH * 0.6;
    const chip = itemH * 0.45;
    VS_CanvasHelpers.drawIconChip(ctx, midX + W * 0.04, cy - chip / 2, chip, VS_Utils.detectarEmoji(item), c2);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${H * 0.022}px "Inter", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(item, W - M - chip - W * 0.02, cy + itemH * 0.08);

    const valNum = parseFloat(String(item).replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!isNaN(valNum) && valNum > 0) {
      VS_Utils.drawDataBar(ctx, W - M - chip - W * 0.02 - colW * 0.5, cy + itemH * 0.12, colW * 0.5, Math.round(H * 0.012), Math.min(valNum / 100, 1), c2);
    }
  });

  VS_CanvasHelpers.drawFooter(ctx, W, H, true);
}

// ── Template: Flyer Listado ──
function renderFlyerListado(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(255,255,255,0.85)')) {
    VS_CanvasHelpers.drawPlateBackground(ctx, W, H, { accent: c1 });
  }
    VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'LISTADO', '', VS_CanvasHelpers.plateHeaderHeight(W, H));

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, Math.round(H * 0.006));

  drawTitle(ctx, W, H, title, c1, true, null);

  const items = content.split('\n').filter(l => l.trim());
  const maxN = Math.min(items.length, 10);
  const tr = getTitleRect(W, H);
  const top = tr.y + tr.h + H * 0.02;
  const bottom = H - H * 0.07;
  const areaH = bottom - top;
  const itemH = areaH / Math.max(maxN, 1);
  const spineX = M + W * 0.045;

  ctx.strokeStyle = VS_Utils.hexToRgba(c1, 0.2);
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.beginPath();
  ctx.moveTo(spineX, top);
  ctx.lineTo(spineX, top + areaH - itemH * 0.3);
  ctx.stroke();

  items.slice(0, maxN).forEach((item, i) => {
    const cy = top + i * itemH + itemH * 0.45;
    const numStr = String(i + 1).padStart(2, '0');

    ctx.fillStyle = VS_Utils.hexToRgba(c1, 0.04);
    ctx.font = `900 ${itemH * 0.7}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(numStr, M, cy + itemH * 0.18);

    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.arc(spineX, cy, W * 0.007, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(spineX, cy, W * 0.004, 0, Math.PI * 2);
    ctx.fill();

    const chip = itemH * 0.48;
    const chipX = spineX + W * 0.03;
    VS_CanvasHelpers.drawIconChip(ctx, chipX, cy - chip / 2, chip, VS_Utils.detectarEmoji(item), c1);

    const textX = chipX + chip + W * 0.025;
    const textW = (W - M - textX);
    const { label, value, hasColon } = VS_Utils.splitLinea(item);
    ctx.textAlign = 'left';

    if (hasColon) {
      ctx.fillStyle = VS_Colors.INK;
      ctx.font = `600 ${itemH * 0.18}px "Inter", sans-serif`;
      ctx.fillText(label, textX, cy - itemH * 0.04);
      ctx.fillStyle = c1;
      ctx.font = `800 ${itemH * 0.26}px "Inter", sans-serif`;
      ctx.fillText(value, textX, cy + itemH * 0.22);
      const valNum = parseFloat(String(value).replace(',', '.'));
      if (!isNaN(valNum) && valNum > 0) {
        VS_Utils.drawDataBar(ctx, textX, cy + itemH * 0.32, textW * 0.35, Math.round(H * 0.01), Math.min(valNum / 100, 1), c1);
      }
    } else {
      ctx.fillStyle = VS_Colors.INK;
      ctx.font = `600 ${itemH * 0.22}px "Inter", sans-serif`;
      ctx.fillText(item, textX, cy + itemH * 0.1);
    }
  });

  VS_CanvasHelpers.drawFooter(ctx, W, H, false);
}

// ── Template: Flyer Destacado ──
function renderFlyerDestacado(ctx, W, H, title, content, c1, c2) {
  const M = W * 0.05;
  if (!dibujarFondoIA(ctx, W, H, 'rgba(10,12,22,0.9)')) {
    VS_CanvasHelpers.drawPlateBackground(ctx, W, H, { dark: true, accent: c1 });
  }
    VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'DATOS DESTACADOS', '', VS_CanvasHelpers.plateHeaderHeight(W, H));

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, Math.round(W * 0.03), H);

  drawTitle(ctx, W, H, title, c1, true, null);

  const lines = content.split('\n').filter(l => l.trim());
  const maxN = Math.min(lines.length, 8);
  const tr = getTitleRect(W, H);
  const top = tr.y + tr.h + H * 0.02;
  const bottom = H - H * 0.07;
  const areaH = bottom - top;
  const cardH = Math.min(areaH / Math.max(maxN, 1) * 0.82, H * 0.1);
  const gap = maxN ? (areaH - cardH * maxN) / maxN : 0;

  lines.slice(0, maxN).forEach((line, i) => {
    const y = top + i * (cardH + gap);
    const cy = y + cardH / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(M, y, W - 2 * M, cardH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.roundRect(M, y + cardH * 0.12, Math.round(W * 0.005), cardH * 0.76, 4);
    ctx.fill();

    const chip = cardH * 0.55;
    const chipX = M + W * 0.03;
    const chipY = cy - chip / 2;
    VS_CanvasHelpers.drawIconChip(ctx, chipX, chipY, chip, VS_Utils.detectarEmoji(line), c1);

    const textX = chipX + chip + W * 0.025;
    const textW = (W - 2 * M) - (textX - M);
    const { label, value, hasColon } = VS_Utils.splitLinea(line);
    ctx.textAlign = 'left';

    if (hasColon) {
      ctx.fillStyle = VS_Utils.hexToRgba(c1, 0.8);
      ctx.font = `600 ${cardH * 0.18}px "Inter", sans-serif`;
      ctx.fillText(label, textX, y + cardH * 0.35);
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${cardH * 0.3}px "Inter", sans-serif`;
      ctx.fillText(value, textX, y + cardH * 0.76);

      const valNum = parseFloat(String(value).replace(',', '.'));
      if (!isNaN(valNum) && valNum > 0) {
        const barW = textW * 0.35;
        VS_Utils.drawDataBar(ctx, textX + ctx.measureText(value).width + W * 0.02, y + cardH * 0.63, barW, Math.round(H * 0.01), Math.min(valNum / 100, 1), c1);
      }
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${cardH * 0.22}px "Inter", sans-serif`;
      ctx.fillText(line, textX, cy + cardH * 0.08);
    }
  });

  const donutSize = Math.min(W, H) * 0.07;
  const donutX = W - M - donutSize / 2;
  const donutY = H * 0.12;
  ctx.strokeStyle = VS_Utils.hexToRgba(c1, 0.15);
  ctx.lineWidth = donutSize * 0.15;
  ctx.beginPath();
  ctx.arc(donutX, donutY, donutSize * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = VS_Utils.hexToRgba(c1, 0.6);
  ctx.beginPath();
  ctx.arc(donutX, donutY, donutSize * 0.4, -Math.PI / 2, Math.PI * 0.8);
  ctx.stroke();

  VS_CanvasHelpers.drawFooter(ctx, W, H, true);
}

async function exportarInfografia() {
  const canvas = document.getElementById('infografiaCanvas');
  await VS_Utils.exportCanvasToPNG(canvas, renderizarInfografiaEnCtx, 'infografia-flyer-media-mendoza', 3);
  renderizarInfografia();
}

function renderizarInfografiaEnCtx(ctx, W, H) {
  const color1 = document.getElementById('infoColor1').value;
  const color2 = document.getElementById('infoColor2').value;
  const title = document.getElementById('infoTitle').value || 'Infografía';
  const content = document.getElementById('infoContent').value || '';

  ctx.clearRect(0, 0, W, H);

  const data = normalizarInfografia({ ...(infografiaDataOverride || {}), titulo: title, contenido: infografiaDataOverride ? undefined : content, fuente: infografiaDataOverride?.fuente || 'Media Mendoza', template: templateActual, color1, color2 });
  renderInfografiaModular(ctx, W, H, data);
  VS_CanvasHelpers.drawPlateLogo(ctx, W, H);

}

// ── Chat IA ──
const TEMPLATE_NOMBRES = { simple: 'Simple', comparativa: 'Comparativa', listado: 'Listado', destacado: 'Destacado', datos: 'Datos', pasos: 'Pasos' };

function generarPromptInfografia() {
  const tema = document.getElementById('infoTema').value.trim();
  if (!tema) return toast('Ingresá un tema para generar el prompt');

  const templates = Object.entries(TEMPLATE_NOMBRES).map(([k, v]) => `${k} (${v})`).join(', ');

  const prompt = `INSTRUCCIÓN CRÍTICA: Usá Google Search para encontrar datos reales y actualizados. NO inventes cifras, porcentajes ni estadísticas. Si no encontrás datos verificados para el tema, indicá que no hay datos disponibles en vez de inventar.

Necesito un JSON puro para pegar en un frontend que genera infografías visuales.

Tema: "${tema}"

Formato requerido:
{
  "titulo": "título llamativo para la infografía",
  "lineas": ["Etiqueta: valor numérico", "Subtítulo: más datos"],
  "template_sugerido": "simple | comparativa | listado | destacado",
  "color_principal": "#código hex",
  "color_secundario": "#código hex",
  "fuente": "nombre de la fuente oficial de donde sacaste los datos"
}

Templates disponibles: ${templates}

Reglas estrictas:
- ANTES de generar el JSON, buscá en Google los datos reales del tema
- Usá SOLO datos de fuentes oficiales: INDEC, Banco Mundial, FMI, ministerios, organismos públicos, medios periodísticos reconocidos
- Cada línea representa un dato de la infografía (formato: "Etiqueta: valor")
- Incluí el campo "fuente" con el nombre de la fuente consultada
- 4 a 10 líneas como máximo
- Incluí cifras, porcentajes y estadísticas concretas Y VERIFICADAS
- Si el tema es argentino, buscá en INDEC (indec.gob.ar) o fuentes oficiales argentinas
- Si no encontrás datos verificados, devolvé: {"error": "No se encontraron datos verificados para este tema"}
- NUNCA inventes porcentajes, cifras o estadísticas
- Elegí colores que combinen bien (modernos, sobrios)
- Elegí el template que mejor represente los datos
- Respondé SOLO el JSON, sin texto antes ni después, ni bloques de código`;

  const modularPrompt = `Buscá en internet datos reales y verificables sobre el tema: "${tema}".

Respondé SOLO JSON válido, sin markdown, usando esta estructura:
{
  "titulo": "Título editorial",
  "bajada": "Contexto breve",
  "fecha": "Fecha de los datos",
  "fuente": "Fuente oficial consultada",
  "template_sugerido": "simple | datos | comparativa | listado | pasos | destacado",
  "color_principal": "#a6ce39",
  "color_secundario": "#16201b",
  "bloques": [
    { "tipo": "dato", "icono": "emoji", "etiqueta": "Nombre", "valor": "Valor", "detalle": "Variación" },
    { "tipo": "barra", "etiqueta": "Distribución", "items": [{ "nombre": "Categoría", "valor": 50 }] },
    { "tipo": "ranking", "etiqueta": "Ranking", "items": [{ "nombre": "Elemento", "valor": 1 }] },
    { "tipo": "comparacion", "items": [{ "nombre": "A", "valor": "Valor" }, { "nombre": "B", "valor": "Valor" }] },
    { "tipo": "pasos", "items": [{ "nombre": "Paso 1", "detalle": "Descripción breve" }] }
  ]
}

Reglas: verificá cada dato en fuentes confiables, no inventes cifras, usá entre 2 y 8 bloques, incluí la fuente y elegí el tipo de bloque que mejor explique la información.`;
  const editorialRules = `

REGLAS EDITORIALES OBLIGATORIAS PARA EL TITULO:
- El campo titulo debe tener como maximo 48 caracteres contando espacios.
- Priorizá un titulo breve, claro y periodistico; no agregues bajadas ni contexto dentro de titulo.
- Si el titulo original es mas largo, resumilo antes de devolver el JSON.
- La interfaz solo puede reducir el tamano del titulo hasta un 82% del tamano base; no uses titulos extensos para forzar una reduccion mayor.
- La bajada debe contener el contexto adicional.
`;
  const ta = document.getElementById('infoPrompt');
  if (ta) {
    ta.value = modularPrompt + editorialRules;
    toast('✅ Prompt generado. Copialo con el botón y pegalo en Gemini Chat.');
  }
}

function copiarPromptInfografia() {
  const ta = document.getElementById('infoPrompt');
  VS_Utils.copiarAlPortapapeles(ta?.value, '✅ Prompt copiado al portapapeles');
}

function cargarJSONdeChatInfografia() {
  const ta = document.getElementById('infoJson');
  const text = (ta && ta.value || '').trim();
  if (!text) return toast('Pegá el JSON en el cuadro de arriba');

  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { return toast('JSON inválido: ' + e.message); }

  if (parsed.error) return toast(String(parsed.error));
  infografiaDataOverride = parsed;
  if (parsed.titulo) document.getElementById('infoTitle').value = parsed.titulo;
  if (parsed.lineas && Array.isArray(parsed.lineas)) {
    document.getElementById('infoContent').value = parsed.lineas.join('\n');
  }
  if (parsed.bloques && Array.isArray(parsed.bloques)) {
    document.getElementById('infoContent').value = parsed.bajada || 'Contenido modular cargado desde JSON';
  }
  if (parsed.template_sugerido && TEMPLATE_NOMBRES[parsed.template_sugerido]) {
    seleccionarTemplate(parsed.template_sugerido);
  }
  if (parsed.color_principal) document.getElementById('infoColor1').value = parsed.color_principal;
  if (parsed.color_secundario) document.getElementById('infoColor2').value = parsed.color_secundario;
  renderizarInfografia();
  toast('✅ Infografía cargada desde Chat IA');
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', initInfographics);

if (typeof module !== 'undefined') module.exports = { normalizarInfografia, validarBloque, normalizarLinea, calcularInfografiaLayout, infografiaBloqueRect, ajustarTextoCanvas, dibujarTextoAjustado, resumirTituloInfografia };
