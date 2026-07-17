// ============================================================
// Visual Suite — Módulo de Efemérides
// ============================================================

const EFEMERIDES_FMT = {
  landscape: { label: 'Horizontal 16:9', w: 2400, h: 1350, cssAR: '16 / 9' },
  square:    { label: 'Cuadrado 1:1',    w: 1600, h: 1600, cssAR: '1 / 1' },
  portrait:  { label: 'Vertical 4:5',    w: 1350, h: 1688, cssAR: '4 / 5' },
  story:     { label: 'Historia 9:16',   w: 1080, h: 1920, cssAR: '9 / 16' }
};

let efemeridesData = [];
let efeFormato = 'landscape';
let efeBlocks = null; // { title: {x,y,w,h}, body: {x,y,w,h} }
let efeActiveBlock = null; // 'title' | 'body' | null
let efeDrag = null;

const CAT_COLORS = {
  'Política': '#3b82f6', 'política': '#3b82f6',
  'Deportes': '#22c55e', 'deportes': '#22c55e',
  'Cultura': '#f59e0b', 'cultura': '#f59e0b',
  'Ciencia': '#a855f7', 'ciencia': '#a855f7',
  'Internacional': '#ef4444', 'internacional': '#ef4444',
  'Efeméride': '#8b5cf6', 'efeméride': '#8b5cf6',
  'Espectáculos': '#ec4899', 'espectáculos': '#ec4899',
  'Sociedad': '#14b8a6', 'sociedad': '#14b8a6',
  'Religión': '#f97316', 'religión': '#f97316',
  'Económica': '#a6ce39', 'económica': '#a6ce39'
};
const CAT_DEFAULT = '#6b7280';

function initEfemerides() {
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('efeFecha');
  if (el) { el.value = today; el.max = today; }
  efemeridesData = [];
  loadEfeBlocks();
  initEfeCanvasEvents();
  renderizarEfemerides();
}

function cambiarFormatoEfe() {
  const fmt = document.getElementById('efeFormato').value;
  if (!EFEMERIDES_FMT[fmt]) return;
  efeFormato = fmt;
  const key = 'efeBlocks_' + fmt;
  const saved = localStorage.getItem(key);
  if (saved) { try { efeBlocks = JSON.parse(saved); } catch(e) {} }
  if (!efeBlocks) efeBlocks = getEfeDefaultBlocks();
  const area = document.getElementById('efemeridesArea');
  if (area) area.style.aspectRatio = EFEMERIDES_FMT[fmt].cssAR;
  renderizarEfemerides();
}

// ── Chat IA ──
function generarPromptEfemerides() {
  const fechaEl = document.getElementById('efeFecha');
  if (!fechaEl || !fechaEl.value) return toast('Seleccioná una fecha del calendario');
  const fecha = new Date(fechaEl.value + 'T12:00:00');
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fechaStr = `${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
  const fechaCorta = `${fecha.getDate()} de ${meses[fecha.getMonth()]}`;

  const prompt = `Necesito un JSON puro para pegar en un frontend que genera una placa visual de efemérides.

Fecha: ${fechaStr}

Requisitos del JSON:
{
  "fecha": "${fechaStr}",
  "efemerides": [
    {
      "emoji": "🇦🇷",
      "anio": 1965,
      "titulo": "Título corto del evento",
      "descripcion": "Descripción breve (máximo 15 palabras)",
      "categoria": "Política | Deportes | Cultura | Ciencia | Internacional | Sociedad | Espectáculos | Religión | Económica",
      "tipo": "nacional" | "internacional"
    }
  ]
}

Reglas estrictas:
- Incluí entre 5 y 12 efemérides para esta fecha
- Incluí argentinas (🇦🇷, tipo "nacional") e internacionales relevantes (🌍, tipo "internacional")
- El campo "tipo" debe ser EXACTAMENTE "nacional" o "internacional" según corresponda
- Abarcá distintas categorías (política, cultura, deportes, ciencia, sociedad, espectáculos, religión, economía)
- Cada efeméride debe empezar con "Nace", "Fallece", "Se celebra", "Ocurre", "Se funda", "Se descubre", etc.
- Incluí el emoji más representativo para cada una
- VERIFICÁ cada dato antes de incluirlo — son datos chequeables
- Respondé SOLO el JSON, sin texto antes ni después, ni bloques de código`;

  const ta = document.getElementById('efePrompt');
  if (ta) {
    ta.value = prompt;
    toast('✅ Prompt generado. Copialo con el botón y pegalo en Gemini Chat.');
  }
}

function copiarPromptEfemerides() {
  const ta = document.getElementById('efePrompt');
  if (!ta || !ta.value.trim()) return toast('No hay prompt para copiar');
  ta.select();
  try { document.execCommand('copy'); } catch (e) { navigator.clipboard?.writeText(ta.value); }
  toast('✅ Prompt copiado al portapapeles');
}

function cargarJSONEfemerides() {
  const ta = document.getElementById('efeJson');
  const text = (ta && ta.value || '').trim();
  if (!text) return toast('Pegá el JSON en el cuadro de arriba');

  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { return toast('JSON inválido: ' + e.message); }

  if (parsed.fecha) document.getElementById('efeFechaLabel').textContent = parsed.fecha;
  if (parsed.efemerides && Array.isArray(parsed.efemerides)) {
    efemeridesData = ordenarEfemerides(parsed.efemerides);
    renderizarEfemerides();
    toast(`✅ ${parsed.efemerides.length} efemérides cargadas`);
  } else {
    toast('El JSON no contiene efemérides');
  }
}

function ordenarEfemerides(data) {
  const nacional = data.filter(e => (e.tipo || '').toLowerCase() === 'nacional').sort((a, b) => (a.anio || 9999) - (b.anio || 9999));
  const internacional = data.filter(e => (e.tipo || '').toLowerCase() !== 'nacional').sort((a, b) => (a.anio || 9999) - (b.anio || 9999));
  const result = [];
  if (nacional.length) result.push({ _separator: '🇦🇷  Nacionales' }, ...nacional);
  if (internacional.length) result.push({ _separator: '🌍  Internacionales' }, ...internacional);
  return result;
}

// ── Bloques (title, body) ──
function getEfeDefaultBlocks() {
  const fmt = EFEMERIDES_FMT[efeFormato] || EFEMERIDES_FMT.landscape;
  const W = fmt.w, H = fmt.h;
  const titleH = Math.max(0.04, Math.min(0.12, Math.round(W * 0.055 / H * 100) / 100));
  return {
    title: { x: 0.04, y: 0.04, w: 0.92, h: titleH },
    body: { x: 0.04, y: 0.04 + titleH + 0.03, w: 0.92, h: 1 - (0.04 + titleH + 0.03 + 0.05) }
  };
}

function loadEfeBlocks() {
  const key = 'efeBlocks_' + efeFormato;
  const saved = localStorage.getItem(key);
  if (saved) { try { efeBlocks = JSON.parse(saved); return; } catch(e) {} }
  efeBlocks = getEfeDefaultBlocks();
}

function saveEfeBlocks() {
  if (!efeBlocks) return;
  localStorage.setItem('efeBlocks_' + efeFormato, JSON.stringify(efeBlocks));
}

function getEfeBlockRect(name, W, H) {
  if (!efeBlocks || !efeBlocks[name]) return null;
  const b = efeBlocks[name];
  return { x: Math.round(b.x * W), y: Math.round(b.y * H), w: Math.round(b.w * W), h: Math.round(b.h * H) };
}

function getEfeCanvasPos(e) {
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
}

function getEfeBlockHit(mx, my, W, H) {
  if (!efeBlocks) return null;
  const nx = mx / W, ny = my / H;
  const keys = ['title', 'body'];
  for (const k of keys) {
    const b = efeBlocks[k];
    if (!b) continue;
    if (nx >= b.x && nx <= b.x + b.w && ny >= b.y && ny <= b.y + b.h) return k;
  }
  return null;
}

function getEfeHandleHit(mx, my, W, H) {
  if (!efeActiveBlock || !efeBlocks || !efeBlocks[efeActiveBlock]) return null;
  const b = efeBlocks[efeActiveBlock];
  const nx = mx / W, ny = my / H;
  const hs = Math.max(0.006, 8 / W);
  if (Math.abs(nx - b.x) < hs && Math.abs(ny - b.y) < hs) return 'nw';
  if (Math.abs(nx - (b.x + b.w)) < hs && Math.abs(ny - b.y) < hs) return 'ne';
  if (Math.abs(nx - b.x) < hs && Math.abs(ny - (b.y + b.h)) < hs) return 'sw';
  if (Math.abs(nx - (b.x + b.w)) < hs && Math.abs(ny - (b.y + b.h)) < hs) return 'se';
  if (Math.abs(nx - b.x) < hs && ny > b.y && ny < b.y + b.h) return 'w';
  if (Math.abs(nx - (b.x + b.w)) < hs && ny > b.y && ny < b.y + b.h) return 'e';
  return null;
}

function initEfeCanvasEvents() {
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return;
  canvas.addEventListener('mousedown', onEfeDown);
  canvas.addEventListener('touchstart', onEfeDown, { passive: false });
  canvas.addEventListener('mousemove', onEfeMove);
  canvas.addEventListener('touchmove', onEfeMove, { passive: false });
  canvas.addEventListener('mouseup', onEfeUp);
  canvas.addEventListener('touchend', onEfeUp);
}

function onEfeDown(e) {
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return;
  if (e.touches) e.preventDefault();
  const pos = getEfeCanvasPos(e);
  const W = canvas.width, H = canvas.height;
  if (efeActiveBlock) {
    const hid = getEfeHandleHit(pos.x, pos.y, W, H);
    if (hid) {
      efeDrag = { type: 'resize-' + hid, key: efeActiveBlock, startNx: pos.x / W, startNy: pos.y / H, orig: {...efeBlocks[efeActiveBlock]} };
      return;
    }
  }
  const hit = getEfeBlockHit(pos.x, pos.y, W, H);
  if (hit) {
    efeActiveBlock = hit;
    efeDrag = { type: 'drag', key: hit, offX: pos.x / W - efeBlocks[hit].x, offY: pos.y / H - efeBlocks[hit].y };
  } else {
    efeActiveBlock = null;
    efeDrag = null;
  }
  renderizarEfemerides();
}

function onEfeMove(e) {
  if (!efeDrag || !efeBlocks) return;
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return;
  const pos = getEfeCanvasPos(e);
  const W = canvas.width, H = canvas.height;
  const nx = pos.x / W, ny = pos.y / H;
  const b = efeBlocks[efeDrag.key];
  if (!b) return;
  const MIN = 0.04;
  if (efeDrag.type === 'drag') {
    b.x = Math.max(0, Math.min(1 - b.w, nx - efeDrag.offX));
    b.y = Math.max(0, Math.min(1 - b.h, ny - efeDrag.offY));
  } else if (efeDrag.type.startsWith('resize-')) {
    const c = efeDrag.type.split('-')[1];
    const o = efeDrag.orig;
    let dx = nx - efeDrag.startNx, dy = ny - efeDrag.startNy;
    if (!o) return;
    if (c === 'se') { b.w = Math.max(MIN, o.w + dx); b.h = Math.max(MIN, o.h + dy); }
    else if (c === 'sw') { const nw = Math.max(MIN, o.w - dx); b.x = o.x + o.w - nw; b.w = nw; b.h = Math.max(MIN, o.h + dy); }
    else if (c === 'ne') { b.w = Math.max(MIN, o.w + dx); const nh = Math.max(MIN, o.h - dy); b.y = o.y + o.h - nh; b.h = nh; }
    else if (c === 'nw') { const nw = Math.max(MIN, o.w - dx); b.x = o.x + o.w - nw; b.w = nw; const nh = Math.max(MIN, o.h - dy); b.y = o.y + o.h - nh; b.h = nh; }
    else if (c === 'e') { b.w = Math.max(MIN, o.w + dx); }
    else if (c === 'w') { const nw = Math.max(MIN, o.w - dx); b.x = o.x + o.w - nw; b.w = nw; }
  }
  saveEfeBlocks();
  renderizarEfemerides();
}

function onEfeUp() {
  efeDrag = null;
  document.getElementById('efemeridesCanvas').style.cursor = efeActiveBlock ? 'grab' : 'default';
}

// ── Render ──
function renderizarEfemerides() {
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return;
  const badge = document.getElementById('efeCount');
  if (badge) badge.textContent = (efemeridesData.filter(e => !e._separator).length) + ' efemérides';
  const lbl = document.getElementById('efeFechaLabel');
  if (lbl && !lbl.textContent) {
    const fechaEl = document.getElementById('efeFecha');
    if (fechaEl && fechaEl.value) {
      const d = new Date(fechaEl.value + 'T12:00:00');
      const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      lbl.textContent = `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
    }
  }
  const fmt = EFEMERIDES_FMT[efeFormato] || EFEMERIDES_FMT.landscape;
  const W = fmt.w, H = fmt.h;
  const cssW = canvas.parentElement.clientWidth || 800;
  const cssH = cssW * H / W;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = W;
  canvas.height = H;

  if (!efeBlocks) loadEfeBlocks();

  const ctx = canvas.getContext('2d');

  // 1. Fondo
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0f111a');
  grad.addColorStop(1, '#1a1d2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  drawDotGridEfe(ctx, W, H, 'rgba(255,255,255,0.02)', Math.round(W * 0.03));

  // 2. Body block (cards + separadores)
  const br = getEfeBlockRect('body', W, H);
  if (br) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(br.x, br.y, br.w, br.h);
    ctx.clip();
    drawEfeCards(ctx, W, H, br);
    ctx.restore();
  }

  // 3. Title block
  const tr = getEfeBlockRect('title', W, H);
  if (tr) drawEfeTitle(ctx, W, H, tr);

  // 4. Footer
  drawEfeFooter(ctx, W, H);

  // 5. Logo
  dibujarLogoEfemerides(ctx, W, H);

  // 6. Active UI
  if (efeActiveBlock) drawEfeActiveUI(ctx, W, H);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawEfeCards(ctx, W, H, br) {
  const pad = Math.round(W * 0.01);
  const cardW = br.w - pad * 2;
  const itemH = Math.round(Math.min(br.h * 0.11, W * 0.11));
  const sepH = Math.round(W * 0.05);
  const innerX = br.x + pad;
  const cardCount = efemeridesData.filter(e => !e._separator).length;
  let curY = br.y + pad;

  efemeridesData.forEach(e => {
    if (e._separator) {
      if (curY + sepH > br.y + br.h) return;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `700 ${Math.round(W * 0.016)}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(e._separator, innerX, curY + sepH / 2);
      curY += sepH;
      return;
    }
    if (curY + itemH > br.y + br.h) return;
    const y = curY;
    const cy = y + itemH / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(innerX, y, cardW, itemH - Math.round(W * 0.008), 10);
    ctx.fill();

    const catColor = CAT_COLORS[e.categoria] || CAT_DEFAULT;
    ctx.fillStyle = catColor;
    ctx.beginPath();
    ctx.roundRect(innerX, y + Math.round(itemH * 0.1), 4, itemH * 0.8, 2);
    ctx.fill();

    ctx.font = `${Math.round(itemH * 0.45)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.emoji || '📌', innerX + Math.round(W * 0.05), cy);

    const yearX = innerX + Math.round(W * 0.09);
    ctx.fillStyle = catColor;
    ctx.font = `900 ${Math.round(itemH * 0.24)}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.anio || '', yearX, cy - Math.round(itemH * 0.14));

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(itemH * 0.22)}px Inter, sans-serif`;
    ctx.fillText(e.titulo || '', yearX, cy + Math.round(itemH * 0.16));

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `500 ${Math.round(itemH * 0.16)}px Inter, sans-serif`;
    const descW = cardW - (yearX - innerX) - Math.round(W * 0.14);
    const desc = e.descripcion || '';
    let descDisplay = desc;
    while (descDisplay && ctx.measureText(descDisplay).width > descW) {
      descDisplay = descDisplay.slice(0, -1);
    }
    if (descDisplay.length < desc.length) descDisplay = descDisplay.slice(0, -1) + '…';
    ctx.fillText(descDisplay, yearX, cy + Math.round(itemH * 0.40));

    ctx.fillStyle = hexToRgbaEfe(catColor, 0.15);
    ctx.beginPath();
    const badgeW = ctx.measureText(e.categoria || '').width + Math.round(W * 0.02);
    const badgeH = Math.round(itemH * 0.22);
    const bX = br.x + br.w - pad - badgeW - Math.round(W * 0.02);
    const bY = cy - badgeH / 2;
    ctx.roundRect(bX, bY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.fillStyle = catColor;
    ctx.font = `600 ${Math.round(itemH * 0.13)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.categoria || '', bX + badgeW / 2, bY + badgeH / 2);
    curY += itemH;
  });

  if (cardCount === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = `500 ${Math.round(W * 0.02)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Seleccioná una fecha y generá las efemérides con Chat IA', br.x + br.w / 2, br.y + br.h / 2);
  }
}

function drawEfeTitle(ctx, W, H, tr) {
  const fechaLabel = document.getElementById('efeFechaLabel');
  const fechaTexto = fechaLabel ? fechaLabel.textContent : '';
  const sz = Math.round(Math.min(tr.h * 0.42, W * 0.04));
  const cx = tr.x + tr.w / 2;

  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#a6ce39';
  ctx.fillRect(tr.x, tr.y + tr.h - 2, tr.w, 2);

  ctx.font = `700 ${sz}px Inter, sans-serif`;
  const leftText = '📆  EFEMÉRIDES';
  const sepText = '  ·  ';
  const fullText = leftText + (fechaTexto ? sepText + fechaTexto : '');
  const totalW = ctx.measureText(fullText).width;
  const leftW = ctx.measureText(leftText).width;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#a6ce39';
  ctx.fillText(leftText, cx - totalW / 2, tr.y + tr.h / 2);
  if (fechaTexto) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(sepText + fechaTexto, cx - totalW / 2 + leftW, tr.y + tr.h / 2);
  }
}

function drawEfeFooter(ctx, W, H) {
  const M = Math.round(W * 0.04);
  const footerH = Math.round(W * 0.06);
  const footerY = H - Math.round(footerH * 0.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, footerY - Math.round(W * 0.015));
  ctx.lineTo(W - M, footerY - Math.round(W * 0.015));
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `600 ${Math.round(W * 0.014)}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MEDIA MENDOZA · mmherramientas.media', M, footerY);
  ctx.textAlign = 'right';
  ctx.fillText('Generado con Visual Suite', W - M, footerY);
}

function drawDotGridEfe(ctx, W, H, color, spacing) {
  ctx.fillStyle = color;
  for (let x = spacing; x < W; x += spacing) {
    for (let y = spacing; y < H; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function hexToRgbaEfe(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function dibujarLogoEfemerides(ctx, W, H) {
  const ls = window.logoState;
  if (!ls || !ls.loaded || !ls.visible || !ls.img) return;
  const lx = ls.x * W;
  const ly = ls.y * H;
  const lw = ls.w * W;
  const ar = ls.img.naturalHeight / ls.img.naturalWidth;
  const lh = lw * ar;
  ctx.drawImage(ls.img, lx, ly, lw, lh);
}

function drawEfeActiveUI(ctx, W, H) {
  if (!efeActiveBlock || !efeBlocks || !efeBlocks[efeActiveBlock]) return;
  const b = efeBlocks[efeActiveBlock];
  const bx = b.x * W, by = b.y * H, bw = b.w * W, bh = b.h * H;
  const cx = bx + bw / 2, cy2 = by + bh / 2;
  const hs = Math.max(8, Math.round(W * 0.008));
  const lw2 = Math.max(1, Math.round(W * 0.0015));

  // Center guides
  ctx.strokeStyle = 'rgba(166,206,57,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

  // Rule of thirds
  ctx.strokeStyle = 'rgba(166,206,57,0.25)';
  [W / 3, W * 2 / 3].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); });
  [H / 3, H * 2 / 3].forEach(y => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); });

  // Edge guides
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + bw, 0); ctx.lineTo(bx + bw, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(W, by); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, by + bh); ctx.lineTo(W, by + bh); ctx.stroke();

  ctx.setLineDash([]);

  // Center crosshair
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  const ch = hs * 0.4;
  ctx.beginPath(); ctx.moveTo(cx - ch, cy2); ctx.lineTo(cx + ch, cy2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy2 - ch); ctx.lineTo(cx, cy2 + ch); ctx.stroke();

  // Selection border
  ctx.strokeStyle = '#a6ce39';
  ctx.lineWidth = lw2;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4);
  ctx.stroke();

  // Handles
  const handles = [
    { x: bx, y: by, id: 'nw' }, { x: bx + bw, y: by, id: 'ne' },
    { x: bx, y: by + bh, id: 'sw' }, { x: bx + bw, y: by + bh, id: 'se' },
    { x: bx, y: cy2, id: 'w' }, { x: bx + bw, y: cy2, id: 'e' }
  ];
  handles.forEach(h => {
    ctx.beginPath();
    if (h.id === 'w' || h.id === 'e') {
      const pw = Math.round(hs * 0.35), ph = Math.round(hs * 0.7);
      ctx.roundRect(h.x - pw / 2, h.y - ph / 2, pw, ph, 2);
    } else {
      ctx.arc(h.x, h.y, hs * 0.45, 0, Math.PI * 2);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#a6ce39';
    ctx.lineWidth = lw2;
    ctx.stroke();
  });
}

// ── Export ──
async function exportarEfemerides() {
  await document.fonts.ready;
  const canvas = document.getElementById('efemeridesCanvas');
  const ow = canvas.width, oh = canvas.height;
  const s = 3;
  canvas.width = ow * s; canvas.height = oh * s;
  const ctx = canvas.getContext('2d');
  ctx.scale(s, s);
  renderizarEfemeridesEnCtx(ctx, ow, oh);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'efemerides-media-mendoza');
    canvas.width = ow; canvas.height = oh;
    renderizarEfemerides();
  }, 'image/png', 1);
}

function renderizarEfemeridesEnCtx(ctx, W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0f111a');
  grad.addColorStop(1, '#1a1d2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  drawDotGridEfe(ctx, W, H, 'rgba(255,255,255,0.02)', Math.round(W * 0.03));

  const br = getEfeBlockRect('body', W, H);
  if (br) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(br.x, br.y, br.w, br.h);
    ctx.clip();
    drawEfeCards(ctx, W, H, br);
    ctx.restore();
  }

  const tr = getEfeBlockRect('title', W, H);
  if (tr) drawEfeTitle(ctx, W, H, tr);

  drawEfeFooter(ctx, W, H);
  dibujarLogoEfemerides(ctx, W, H);
}

function cargarArchivoJSONEfe(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const ta = document.getElementById('efeJson');
    if (ta) ta.value = e.target.result;
    cargarJSONEfemerides();
  };
  reader.onerror = () => toast('No se pudo leer el archivo');
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', initEfemerides);
