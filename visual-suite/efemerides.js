// ============================================================
// Visual Suite — Módulo de Efemérides
// ============================================================

let efemeridesData = [];
let efeFormato = 'landscape';
let efeBlocks = null;
let efeActiveBlock = null;
let efeDrag = null;

function initEfemerides() {
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const el = document.getElementById('efeFecha');
  if (el) el.value = today;
  efemeridesData = [];
  loadEfeBlocks();
  initEfeCanvasEvents();
  renderizarEfemerides();
}

function cambiarFormatoEfe() {
  const fmt = document.getElementById('efeFormato').value;
  if (!VS_Formats[fmt]) return;
  efeFormato = fmt;
  const key = 'efeBlocks_' + fmt;
  const saved = localStorage.getItem(key);
  if (saved) { try { efeBlocks = JSON.parse(saved); } catch(e) {} }
  if (!efeBlocks) efeBlocks = getEfeDefaultBlocks();
  const area = document.getElementById('efemeridesArea');
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

  const prompt = `INSTRUCCIÓN CRÍTICA: Usá Google Search para encontrar efemérides REALES de esta fecha. NO inventes eventos ni fechas. Si no encontrás suficientes efemérides verificadas, devolvé las que tengas certeza y explicá que no se encontraron más.

Fecha: ${fechaStr}

Requisitos del JSON:
{
  "fecha": "${fechaStr}",
  "efemerides": [
    {
      "emoji": "🇦🇷",
      "anio": 1965,
      "titulo": "Título corto del evento",
      "descripcion": "Descripción breve (1 a 2 oraciones, máx. 20 palabras)",
      "categoria": "Política | Deportes | Cultura | Ciencia | Internacional | Sociedad | Espectáculos | Religión | Económica",
      "tipo": "nacional" | "internacional",
      "destacada": true,
      "fuente": "fuente donde se verificó el dato"
    }
  ]
}

Reglas estrictas:
- ANTES de generar el JSON, buscá en Google: "efemérides ${fechaStr.replace(/ de /g, ' ')}" y "qué pasó el ${fechaStr}"
- Verificá CADA dato en al menos 2 fuentes (Wikipedia, efemerides.com.ar, historiaantigua.com.ar, etc.)
- Incluí entre 5 y 12 efemérides para esta fecha
- Incluí argentinas (🇦🇷, tipo "nacional") e internacionales relevantes (🌍, tipo "internacional")
- Priorizar una proporción aproximada de 75% nacionales y 25% internacionales. Si no existen suficientes efemérides nacionales relevantes, verificadas y sin duplicados para esa fecha, completar con efemérides internacionales verificadas antes que repetir o inventar acontecimientos.
- El campo "tipo" debe ser EXACTAMENTE "nacional" o "internacional" según corresponda
- Si es una efeméride muy importante o de celebración especial, marcá "destacada": true. Máximo 2 o 3 destacadas.
- Abarcá distintas categorías (política, cultura, deportes, ciencia, sociedad, espectáculos, religión, economía)
- No incluir más de dos efemérides de la misma categoría, salvo que la fecha lo justifique
- Evitar duplicados semánticos: no incluir dos efemérides que hagan referencia al mismo acontecimiento histórico, aunque estén redactadas de forma diferente
- Excluir efemérides de ocasión: no incluir aniversarios, recordatorios periodísticos o efemérides derivadas del mismo hecho histórico
- Ordenar por relevancia histórica para Argentina y luego cronológicamente
- Cada efeméride debe empezar con "Nace", "Fallece", "Se celebra", "Ocurre", "Se funda", "Se descubre", etc.
- La descripción debe ser una o dos oraciones claras y concisas que expliquen el contexto histórico
- Incluí el emoji más representativo para cada una
- Incluí el campo "fuente" con la fuente verificadora
- NUNCA inventes nombres, fechas o eventos. Si no estás seguro, NO lo incluyas
- Respondé SOLO el JSON, sin texto antes ni después, ni bloques de código`;

  const ta = document.getElementById('efePrompt');
  if (ta) {
    ta.value = prompt;
    toast('✅ Prompt generado. Copialo con el botón y pegalo en Gemini Chat.');
  }
}

function copiarPromptEfemerides() {
  const ta = document.getElementById('efePrompt');
  VS_Utils.copiarAlPortapapeles(ta?.value, '✅ Prompt copiado al portapapeles');
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
  const destacadas = data.filter(e => e.destacada).sort((a, b) => {
    const aNac = (a.tipo || '').toLowerCase() === 'nacional' ? 0 : 1;
    const bNac = (b.tipo || '').toLowerCase() === 'nacional' ? 0 : 1;
    if (aNac !== bNac) return aNac - bNac;
    return (a.anio || 9999) - (b.anio || 9999);
  });
  const nacional = data.filter(e => !e.destacada && (e.tipo || '').toLowerCase() === 'nacional').sort((a, b) => (a.anio || 9999) - (b.anio || 9999));
  const internacional = data.filter(e => !e.destacada && (e.tipo || '').toLowerCase() !== 'nacional').sort((a, b) => (a.anio || 9999) - (b.anio || 9999));
  const result = [];
  if (destacadas.length) result.push({ _separator: '⭐  Destacadas' }, ...destacadas);
  if (nacional.length) result.push({ _separator: '🇦🇷  Nacionales' }, ...nacional);
  if (internacional.length) result.push({ _separator: '🌍  Internacionales' }, ...internacional);
  return result;
}

function cargarArchivoJSONEfe(input) {
  VS_Utils.cargarArchivoJSON(input, 'efeJson', cargarJSONEfemerides);
}

// ── Bloques (logo, title, body) ──
function getEfeDefaultBlocks() {
  const fmt = VS_Formats[efeFormato] || VS_Formats.landscape;
  const W = fmt.w, H = fmt.h;
  const titleH = Math.max(0.04, Math.min(0.12, Math.round(W * 0.055 / H * 100) / 100));
  const ls = window.logoState;
  const ar = ls && ls.img ? ls.img.naturalHeight / ls.img.naturalWidth : 1;
  return {
    logo: { x: 0.75, y: 0.02, w: 0.18, h: 0.18 * ar },
    title: { x: 0.04, y: 0.04, w: 0.92, h: titleH },
    body: { x: 0.04, y: 0.04 + titleH + 0.03, w: 0.92, h: 1 - (0.04 + titleH + 0.03 + 0.05) }
  };
}

function ensureEfeLogoBlock() {
  if (!efeBlocks) loadEfeBlocks();
  if (!efeBlocks || efeBlocks.logo) return;
  const ls = window.logoState;
  const ar = ls && ls.img ? ls.img.naturalHeight / ls.img.naturalWidth : 1;
  efeBlocks.logo = { x: 0.75, y: 0.02, w: 0.18, h: 0.18 * ar };
  saveEfeBlocks();
}

function loadEfeBlocks() {
  const key = 'efeBlocks_' + efeFormato;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.title && parsed.body && parsed.logo
          && typeof parsed.title.x === 'number' && typeof parsed.body.x === 'number'
          && parsed.title.w > 0 && parsed.body.w > 0 && parsed.logo.w > 0
          && parsed.title.h > 0 && parsed.body.h > 0 && parsed.logo.h > 0) {
        efeBlocks = parsed;
        return;
      }
    } catch(e) {}
  }
  efeBlocks = getEfeDefaultBlocks();
  saveEfeBlocks();
}

function saveEfeBlocks() {
  if (!efeBlocks) return;
  ensureEfeLogoBlock();
  localStorage.setItem('efeBlocks_' + efeFormato, JSON.stringify(efeBlocks));
}

function resetEfeBlocks() {
  localStorage.removeItem('efeBlocks_' + efeFormato);
  efeBlocks = getEfeDefaultBlocks();
  saveEfeBlocks();
  renderizarEfemerides();
  toast('Bloques reiniciados');
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
  for (const k of ['title', 'body', 'logo']) {
    const b = efeBlocks[k];
    if (!b) continue;
    if (nx >= b.x && nx <= b.x + b.w && ny >= b.y && ny <= b.y + b.h) return k;
  }
  return null;
}

function getEfeHandleHit(mx, my, W, H) {
  if (!efeActiveBlock || !efeBlocks || !efeBlocks[efeActiveBlock]) return null;
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const sc = rect.width / W;
  const touchPx = window.innerWidth < 768 ? 40 : 20;
  const threshold = touchPx / sc;
  const ns = threshold / W;
  const b = efeBlocks[efeActiveBlock];
  const nx = mx / W, ny = my / H;
  if (Math.abs(nx - b.x) < ns && Math.abs(ny - b.y) < ns) return 'nw';
  if (Math.abs(nx - (b.x + b.w)) < ns && Math.abs(ny - b.y) < ns) return 'ne';
  if (Math.abs(nx - b.x) < ns && Math.abs(ny - (b.y + b.h)) < ns) return 'sw';
  if (Math.abs(nx - (b.x + b.w)) < ns && Math.abs(ny - (b.y + b.h)) < ns) return 'se';
  if (efeActiveBlock !== 'logo') {
    if (Math.abs(nx - b.x) < ns && ny > b.y && ny < b.y + b.h) return 'w';
    if (Math.abs(nx - (b.x + b.w)) < ns && ny > b.y && ny < b.y + b.h) return 'e';
  }
  return null;
}

function initEfeCanvasEvents() {
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas || canvas._vsListenersAdded) return;
  canvas.addEventListener('mousedown', onEfeDown);
  canvas.addEventListener('touchstart', onEfeDown, { passive: false });
  canvas._vsListenersAdded = true;
}

function onEfeDown(e) {
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return;
  if (e.touches) e.preventDefault();
  ensureEfeLogoBlock();
  const pos = getEfeCanvasPos(e);
  const W = canvas.width, H = canvas.height;
  if (efeActiveBlock) {
    const hid = getEfeHandleHit(pos.x, pos.y, W, H);
    if (hid) {
      efeDrag = { type: 'resize-' + hid, key: efeActiveBlock, startNx: pos.x / W, startNy: pos.y / H, orig: {...efeBlocks[efeActiveBlock]} };
      efeDrag._isTouch = !!e.touches;
      if (e.touches) {
        document.addEventListener('touchmove', onEfeMove, { passive: false });
        document.addEventListener('touchend', onEfeUp);
        document.addEventListener('touchcancel', onEfeUp);
      } else {
        document.addEventListener('mousemove', onEfeMove);
        document.addEventListener('mouseup', onEfeUp);
      }
      return;
    }
  }
  const hit = getEfeBlockHit(pos.x, pos.y, W, H);
  if (hit) {
    efeActiveBlock = hit;
    efeDrag = { type: 'drag', key: hit, offX: pos.x / W - efeBlocks[hit].x, offY: pos.y / H - efeBlocks[hit].y };
    efeDrag._isTouch = !!e.touches;
    if (e.touches) {
      document.addEventListener('touchmove', onEfeMove, { passive: false });
      document.addEventListener('touchend', onEfeUp);
      document.addEventListener('touchcancel', onEfeUp);
    } else {
      document.addEventListener('mousemove', onEfeMove);
      document.addEventListener('mouseup', onEfeUp);
    }
  } else {
    efeActiveBlock = null;
    efeDrag = null;
  }
  renderizarEfemerides();
}

function onEfeMove(e) {
  if (e.touches) e.preventDefault();
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
    const SNAP = 0.014;
    const ecx = b.x + b.w / 2, ecy = b.y + b.h / 2;
    if (Math.abs(ecx - 0.5) < SNAP) b.x = 0.5 - b.w / 2;
    if (Math.abs(ecy - 0.5) < SNAP) b.y = 0.5 - b.h / 2;
  } else if (efeDrag.type.startsWith('resize-')) {
    const c = efeDrag.type.split('-')[1];
    const o = efeDrag.orig;
    let dx = nx - efeDrag.startNx, dy = ny - efeDrag.startNy;
    if (!o) return;
    if (efeDrag.key === 'logo') {
      const ls = window.logoState;
      const ar = ls && ls.img ? ls.img.naturalHeight / ls.img.naturalWidth : 1;
      if (c === 'se') { const nw = Math.max(MIN, o.w + dx); b.w = nw; b.h = nw * ar; }
      else if (c === 'sw') { const nw = Math.max(MIN, o.w - dx); b.x = o.x + o.w - nw; b.w = nw; b.h = nw * ar; }
      else if (c === 'ne') { const nw = Math.max(MIN, o.w + dx); b.w = nw; b.h = nw * ar; b.y = o.y + o.h - b.h; }
      else if (c === 'nw') { const nw = Math.max(MIN, o.w - dx); b.x = o.x + o.w - nw; b.w = nw; b.h = nw * ar; b.y = o.y + o.h - b.h; }
    } else {
      if (c === 'se') { b.w = Math.max(MIN, o.w + dx); b.h = Math.max(MIN, o.h + dy); }
      else if (c === 'sw') { const nw = Math.max(MIN, o.w - dx); b.x = o.x + o.w - nw; b.w = nw; b.h = Math.max(MIN, o.h + dy); }
      else if (c === 'ne') { b.w = Math.max(MIN, o.w + dx); const nh = Math.max(MIN, o.h - dy); b.y = o.y + o.h - nh; b.h = nh; }
      else if (c === 'nw') { const nw = Math.max(MIN, o.w - dx); b.x = o.x + o.w - nw; b.w = nw; const nh = Math.max(MIN, o.h - dy); b.y = o.y + o.h - nh; b.h = nh; }
      else if (c === 'e') { b.w = Math.max(MIN, o.w + dx); }
      else if (c === 'w') { const nw = Math.max(MIN, o.w - dx); b.x = o.x + o.w - nw; b.w = nw; }
    }
  }
  renderizarEfemerides();
}

function onEfeUp(e) {
  if (efeDrag && efeBlocks) saveEfeBlocks();
  const wasTouch = efeDrag && efeDrag._isTouch;
  efeDrag = null;
  if (wasTouch) {
    document.removeEventListener('touchmove', onEfeMove);
    document.removeEventListener('touchend', onEfeUp);
    document.removeEventListener('touchcancel', onEfeUp);
  } else {
    document.removeEventListener('mousemove', onEfeMove);
    document.removeEventListener('mouseup', onEfeUp);
  }
  const canvas = document.getElementById('efemeridesCanvas');
  if (canvas) canvas.style.cursor = efeActiveBlock ? 'grab' : 'default';
}

// ── Render ──
function calcEfeRequiredHeight(W) {
  const itemCount = efemeridesData.filter(e => !e._separator).length;
  const sepCount = efemeridesData.filter(e => e._separator).length;
  const idealItemH = Math.round(W * 0.14);
  const idealSepH = Math.round(idealItemH * 0.35);
  return itemCount * idealItemH + sepCount * idealSepH + Math.round(W * 0.02);
}

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
  const fmt = VS_Formats[efeFormato] || VS_Formats.landscape;
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
  grad.addColorStop(0, VS_Colors.DARK_BG);
  grad.addColorStop(1, VS_Colors.DARK_BG2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  VS_Utils.drawDotGrid(ctx, W, H, 'rgba(255,255,255,0.02)', Math.round(W * 0.03), 1);

  // 2. Body block - auto-expand to fit all efemerides (sin guardar en localStorage)
  const br = getEfeBlockRect('body', W, H);
  if (br) {
    const requiredH = calcEfeRequiredHeight(W);
    if (requiredH > br.h) {
      br.h = Math.min(requiredH, H - br.y - Math.round(H * 0.06));
    }
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
  VS_CanvasHelpers.drawFooter(ctx, W, H, true);

  // 5. Logo
  if (efeBlocks && efeBlocks.logo) {
    VS_Utils.dibujarLogo(ctx, W, H, {
      x: efeBlocks.logo.x,
      y: efeBlocks.logo.y,
      w: efeBlocks.logo.w
    });
  }

  // 6. Active UI (solo dibujar guías, no guardar posición)
  if (efeActiveBlock && efeBlocks && efeBlocks[efeActiveBlock]) {
    const b = efeBlocks[efeActiveBlock];
    VS_CanvasHelpers.drawActiveUI(ctx, W, H, { x: b.x * W, y: b.y * H, w: b.w * W, h: b.h * H });
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 2) { currentLine = currentLine + '…'; break; }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && lines.length < 2) lines.push(currentLine);
  return lines;
}

function drawEfeCards(ctx, W, H, br) {
  const pad = Math.round(W * 0.01);
  const cardW = br.w - pad * 2;
  const innerX = br.x + pad;
  const itemCount = efemeridesData.filter(e => !e._separator).length;
  const sepCount = efemeridesData.filter(e => e._separator).length;
  const totalItems = itemCount + sepCount;
  const availH = br.h - pad * 2;
  const sepRatio = 0.35;
  const itemRatio = 1;
  const totalRatio = itemCount * itemRatio + sepCount * sepRatio;
  const itemH = Math.round(Math.min(availH / totalRatio, W * 0.16));
  const sepH = Math.round(itemH * sepRatio);
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
    const isDest = e.destacada;

    ctx.fillStyle = isDest ? 'rgba(255,215,0,0.07)' : 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(innerX, y, cardW, itemH - Math.round(W * 0.008), 10);
    ctx.fill();

    const catColor = VS_Colors.CAT_COLORS[e.categoria] || VS_Colors.CAT_DEFAULT;
    ctx.fillStyle = isDest ? '#ffd700' : catColor;
    ctx.beginPath();
    ctx.roundRect(innerX, y + Math.round(itemH * 0.1), 4, itemH * 0.8, 2);
    ctx.fill();

    ctx.font = `${Math.round(itemH * 0.35)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.emoji || '📌', innerX + Math.round(W * 0.05), cy - Math.round(itemH * 0.06));

    const yearX = innerX + Math.round(W * 0.09);
    ctx.fillStyle = isDest ? '#ffd700' : catColor;
    ctx.font = `900 ${Math.round(itemH * 0.18)}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.anio || '', yearX, cy - Math.round(itemH * 0.26));

    ctx.fillStyle = isDest ? '#fffbe6' : '#ffffff';
    ctx.font = `700 ${Math.round(itemH * 0.17)}px Inter, sans-serif`;
    ctx.fillText(e.titulo || '', yearX, cy - Math.round(itemH * 0.08));

    ctx.fillStyle = isDest ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.6)';
    ctx.font = `500 ${Math.round(itemH * 0.12)}px Inter, sans-serif`;
    const descW = cardW - (yearX - innerX) - Math.round(W * 0.14);
    const desc = e.descripcion || '';
    const lines = wrapText(ctx, desc, descW);
    const lineH = Math.round(itemH * 0.14);
    lines.forEach((line, i) => {
      ctx.fillText(line, yearX, cy + Math.round(itemH * 0.08) + i * lineH);
    });

    ctx.fillStyle = VS_Utils.hexToRgba(isDest ? '#ffd700' : catColor, isDest ? 0.2 : 0.15);
    ctx.beginPath();
    const badgeW = ctx.measureText(e.categoria || '').width + Math.round(W * 0.02);
    const badgeH = Math.round(itemH * 0.18);
    const bX = br.x + br.w - pad - badgeW - Math.round(W * 0.02);
    const bY = cy - badgeH / 2 - Math.round(itemH * 0.06);
    ctx.roundRect(bX, bY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.fillStyle = isDest ? '#ffd700' : catColor;
    ctx.font = `600 ${Math.round(itemH * 0.11)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.categoria || '', bX + badgeW / 2, bY + badgeH / 2);
    curY += itemH;
  });

  if (itemCount === 0) {
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

  ctx.fillStyle = VS_Colors.ACCENT;
  ctx.fillRect(tr.x, tr.y + tr.h - 2, tr.w, 2);

  ctx.font = `700 ${sz}px Inter, sans-serif`;
  const leftText = '📆  EFEMÉRIDES';
  const sepText = '  ·  ';
  const fullText = leftText + (fechaTexto ? sepText + fechaTexto : '');
  const totalW = ctx.measureText(fullText).width;
  const leftW = ctx.measureText(leftText).width;

  ctx.textAlign = 'left';
  ctx.fillStyle = VS_Colors.ACCENT;
  ctx.fillText(leftText, cx - totalW / 2, tr.y + tr.h / 2);
  if (fechaTexto) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(sepText + fechaTexto, cx - totalW / 2 + leftW, tr.y + tr.h / 2);
  }
}

async function exportarEfemerides() {
  const canvas = document.getElementById('efemeridesCanvas');
  await VS_Utils.exportCanvasToPNG(canvas, renderizarEfemeridesEnCtx, 'efemerides-media-mendoza', 3);
  renderizarEfemerides();
}

function renderizarEfemeridesEnCtx(ctx, W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, VS_Colors.DARK_BG);
  grad.addColorStop(1, VS_Colors.DARK_BG2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  VS_Utils.drawDotGrid(ctx, W, H, 'rgba(255,255,255,0.02)', Math.round(W * 0.03), 1);

  const br = getEfeBlockRect('body', W, H);
  if (br) {
    const requiredH = calcEfeRequiredHeight(W);
    if (requiredH > br.h) br.h = Math.min(requiredH, H - br.y - Math.round(H * 0.06));
    ctx.save();
    ctx.beginPath();
    ctx.rect(br.x, br.y, br.w, br.h);
    ctx.clip();
    drawEfeCards(ctx, W, H, br);
    ctx.restore();
  }

  const tr = getEfeBlockRect('title', W, H);
  if (tr) drawEfeTitle(ctx, W, H, tr);

  VS_CanvasHelpers.drawFooter(ctx, W, H, true);

  if (efeBlocks && efeBlocks.logo) {
    VS_Utils.dibujarLogo(ctx, W, H, {
      x: efeBlocks.logo.x,
      y: efeBlocks.logo.y,
      w: efeBlocks.logo.w
    });
  }
}

document.addEventListener('DOMContentLoaded', initEfemerides);
