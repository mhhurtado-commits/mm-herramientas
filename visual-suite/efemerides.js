// ============================================================
// Visual Suite — Módulo de Efemérides
// ============================================================

let efemeridesData = [];
let efeFormato = 'landscape';
let efeBlocks = null;
let efeActiveBlock = null;
let efeDrag = null;
let efeFechaTextoOverride = '';

function getEfeFechaTexto(value) {
  if (!value) return '';
  const d = new Date(value + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '';
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
}

function getEfeFechaCorta(value) {
  if (!value) return '';
  const d = new Date(value + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function syncEfeFechaPreview() {
  const preview = document.getElementById('efeFechaPreview');
  if (!preview) return '';
  const fechaEl = document.getElementById('efeFecha');
  const texto = getEfeFechaCorta(fechaEl && fechaEl.value);
  preview.textContent = texto;
  return texto;
}

function syncEfeFechaLabel(forceText) {
  const lbl = document.getElementById('efeFechaLabel');
  if (!lbl) return '';
  if (typeof forceText === 'string') {
    efeFechaTextoOverride = forceText.trim();
    lbl.textContent = efeFechaTextoOverride;
    return efeFechaTextoOverride;
  }
  if (efeFechaTextoOverride) {
    lbl.textContent = efeFechaTextoOverride;
    return efeFechaTextoOverride;
  }
  const fechaEl = document.getElementById('efeFecha');
  const texto = getEfeFechaTexto(fechaEl && fechaEl.value);
  lbl.textContent = texto;
  return texto;
}

function onEfeFechaInputChange() {
  efeFechaTextoOverride = '';
  syncEfeFechaPreview();
  renderizarEfemerides();
}

function initEfemerides() {
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const el = document.getElementById('efeFecha');
  if (el) el.value = today;
  const fmtEl = document.getElementById('efeFormato');
  efeFormato = 'square';
  if (fmtEl) fmtEl.value = 'square';
  syncEfeFechaPreview();
  syncEfeFechaLabel();
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

  efeFechaTextoOverride = '';
  if (parsed.fecha) syncEfeFechaLabel(parsed.fecha);
  else syncEfeFechaLabel();
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

function drawEfeBackground(ctx, W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f7f8f3');
  grad.addColorStop(0.52, '#f1f3ee');
  grad.addColorStop(1, '#e8ece5');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const bandY = Math.round(H * 0.12);
  const bandH = Math.round(H * 0.28);
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  band.addColorStop(0, 'rgba(166,206,57,0.08)');
  band.addColorStop(1, 'rgba(166,206,57,0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, bandH);
}

function getEfeSectionMeta(label) {
  const text = String(label || '').toLowerCase();
  if (text.includes('destac')) return { icon: '*', title: 'Destacadas', accent: VS_Colors.GOLD };
  if (text.includes('interna') || text.includes('mundo')) return { icon: 'MUNDO', title: 'Internacionales', accent: '#d9534f' };
  if (text.includes('nacional')) return { icon: 'AR', title: 'Nacionales', accent: VS_Colors.ACCENT };
  return { icon: 'HITOS', title: 'Efemerides', accent: VS_Colors.INK2 };
}

function drawEfeSectionHeader(ctx, x, y, w, h, label) {
  const meta = getEfeSectionMeta(label);
  const chipH = Math.max(26, Math.round(h * 0.72));
  const chipW = Math.round(chipH * (meta.icon.length > 2 ? 2.15 : 1.25));

  ctx.fillStyle = VS_Utils.hexToRgba(meta.accent, 0.12);
  ctx.beginPath();
  ctx.roundRect(x, y + Math.round((h - chipH) / 2), chipW, chipH, Math.round(chipH / 2));
  ctx.fill();

  ctx.fillStyle = meta.accent;
  ctx.font = `800 ${Math.round(chipH * 0.38)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.icon, x + chipW / 2, y + h / 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = VS_Colors.INK;
  ctx.font = `800 ${Math.round(h * 0.44)}px Inter, sans-serif`;
  ctx.fillText(meta.title, x + chipW + Math.round(w * 0.018), y + h / 2);

  const lineX = x + chipW + Math.round(w * 0.018) + ctx.measureText(meta.title).width + Math.round(w * 0.018);
  ctx.strokeStyle = 'rgba(22,32,27,0.12)';
  ctx.lineWidth = Math.max(1, Math.round(h * 0.04));
  ctx.beginPath();
  ctx.moveTo(lineX, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
}

function drawEfeLogoPlate(ctx, W, H) {
  if (!efeBlocks || !efeBlocks.logo) return;
  const b = efeBlocks.logo;
  const x = b.x * W;
  const y = b.y * H;
  const w = b.w * W;
  const h = (b.h || (b.w * (window.logoState?.ar || 1))) * H;
  const padX = Math.round(w * 0.12);
  const padY = Math.round(h * 0.22);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = Math.round(W * 0.01);
  ctx.shadowOffsetY = Math.round(H * 0.004);
  const g = ctx.createLinearGradient(0, y - padY, 0, y + h + padY);
  g.addColorStop(0, 'rgba(230,235,224,0.98)');
  g.addColorStop(1, 'rgba(220,226,214,0.96)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x - padX, y - padY, w + padX * 2, h + padY * 2, Math.round(h * 0.35));
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(22,32,27,0.12)';
  ctx.lineWidth = Math.max(1, Math.round(W * 0.001));
  ctx.beginPath();
  ctx.roundRect(x - padX, y - padY, w + padX * 2, h + padY * 2, Math.round(h * 0.35));
  ctx.stroke();
}

// Legacy experimental redesign kept as reference only.
// The active WhatsApp-specific layout is redefined near EOF.
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
  const fechaTexto = syncEfeFechaLabel();
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

  VS_CanvasHelpers.drawFooter(ctx, W, H, false);

  if (efeBlocks && efeBlocks.logo) {
    drawEfeLogoPlate(ctx, W, H);
    VS_Utils.dibujarLogo(ctx, W, H, {
      x: efeBlocks.logo.x,
      y: efeBlocks.logo.y,
      w: efeBlocks.logo.w
    });
  }
}

function drawEfeCards(ctx, W, H, br) {
  const pad = Math.round(W * 0.012);
  const cardW = br.w - pad * 2;
  const innerX = br.x + pad;
  const itemCount = efemeridesData.filter(e => !e._separator).length;
  const sepCount = efemeridesData.filter(e => e._separator).length;
  const availH = br.h - pad * 2;
  const sepRatio = 0.26;
  const itemRatio = 1;
  const totalRatio = itemCount * itemRatio + sepCount * sepRatio;
  const itemH = Math.round(Math.min(availH / Math.max(totalRatio, 1), W * 0.19));
  const sepH = Math.round(itemH * sepRatio);
  let curY = br.y + pad;

  efemeridesData.forEach(e => {
    if (e._separator) {
      if (curY + sepH > br.y + br.h) return;
      drawEfeSectionHeader(ctx, innerX, curY, cardW, sepH, e._separator);
      curY += sepH;
      return;
    }
    if (curY + itemH > br.y + br.h) return;

    const y = curY;
    const isDest = e.destacada;
    const catColor = VS_Colors.CAT_COLORS[e.categoria] || VS_Colors.CAT_DEFAULT;
    const topPad = Math.round(itemH * 0.2);
    const iconSize = Math.round(itemH * 0.62);
    const iconX = innerX + Math.round(cardW * 0.028);
    const iconY = y + Math.round(itemH * 0.17);
    const textX = iconX + iconSize + Math.round(cardW * 0.028);
    const badgePadX = Math.round(itemH * 0.12);
    const badgeText = e.categoria || '';
    ctx.font = `800 ${Math.round(itemH * 0.12)}px Inter, sans-serif`;
    const badgeW = ctx.measureText(badgeText).width + badgePadX * 2;
    const badgeH = Math.round(itemH * 0.2);
    const badgeX = innerX + cardW - badgeW - Math.round(cardW * 0.022);
    const badgeY = y + Math.round(itemH * 0.15);
    const titleStartX = textX + Math.round(itemH * 0.42);
    const titleMaxW = badgeX - titleStartX - Math.round(cardW * 0.02);
    const titleY = y + Math.round(itemH * 0.34);
    const descY = y + Math.round(itemH * 0.62);
    const descLineH = Math.round(itemH * 0.16);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = Math.round(itemH * 0.15);
    ctx.shadowOffsetY = Math.round(itemH * 0.05);
    ctx.fillStyle = isDest ? 'rgba(201,162,39,0.08)' : 'rgba(255,255,255,0.72)';
    ctx.beginPath();
    ctx.roundRect(innerX, y, cardW, itemH - Math.round(W * 0.007), Math.round(itemH * 0.1));
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = isDest ? 'rgba(201,162,39,0.42)' : 'rgba(22,32,27,0.08)';
    ctx.lineWidth = Math.max(1, Math.round(W * 0.001));
    ctx.beginPath();
    ctx.roundRect(innerX, y, cardW, itemH - Math.round(W * 0.007), Math.round(itemH * 0.1));
    ctx.stroke();

    ctx.fillStyle = isDest ? VS_Colors.GOLD : catColor;
    ctx.beginPath();
    ctx.roundRect(innerX, y + Math.round(itemH * 0.12), Math.max(6, Math.round(W * 0.0032)), itemH * 0.72, 3);
    ctx.fill();

    ctx.fillStyle = VS_Utils.hexToRgba(isDest ? VS_Colors.GOLD : catColor, isDest ? 0.16 : 0.14);
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, Math.round(iconSize * 0.3));
    ctx.fill();
    ctx.strokeStyle = VS_Utils.hexToRgba(isDest ? VS_Colors.GOLD : catColor, 0.28);
    ctx.lineWidth = Math.max(1, Math.round(W * 0.0009));
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, Math.round(iconSize * 0.3));
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(iconSize * 0.68)}px sans-serif`;
    ctx.fillText(e.emoji || '•', iconX + iconSize / 2, iconY + iconSize / 2 + Math.round(iconSize * 0.02));

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDest ? VS_Colors.GOLD : catColor;
    ctx.font = `900 ${Math.round(itemH * 0.22)}px Inter, sans-serif`;
    ctx.fillText(e.anio || '', textX, titleY);

    ctx.fillStyle = VS_Utils.hexToRgba(isDest ? VS_Colors.GOLD : catColor, isDest ? 0.18 : 0.16);
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, Math.round(badgeH / 2));
    ctx.fill();
    ctx.fillStyle = isDest ? VS_Colors.GOLD : catColor;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

    ctx.textAlign = 'left';
    ctx.fillStyle = VS_Colors.INK;
    ctx.font = `800 ${Math.round(itemH * 0.19)}px Inter, sans-serif`;
    const titleLines = VS_Utils.wrapText(ctx, e.titulo || '', titleMaxW, 1);
    ctx.fillText(titleLines[0] || '', titleStartX, titleY);

    ctx.fillStyle = isDest ? 'rgba(58,46,18,0.88)' : 'rgba(22,32,27,0.72)';
    ctx.font = `600 ${Math.round(itemH * 0.16)}px Inter, sans-serif`;
    const descLines = VS_Utils.wrapText(ctx, e.descripcion || '', titleMaxW, 2);
    descLines.forEach((line, i) => {
      ctx.fillText(line, textX, descY + i * descLineH);
    });

    if (isDest) {
      ctx.strokeStyle = 'rgba(201,162,39,0.55)';
      ctx.lineWidth = Math.max(2, Math.round(W * 0.0018));
      ctx.beginPath();
      ctx.moveTo(innerX + Math.round(cardW * 0.028), y + itemH - Math.round(itemH * 0.11));
      ctx.lineTo(innerX + cardW - Math.round(cardW * 0.028), y + itemH - Math.round(itemH * 0.11));
      ctx.stroke();
    }

    curY += itemH;
  });

  if (itemCount === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = `600 ${Math.round(W * 0.021)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Selecciona una fecha y genera las efemerides con Chat IA', br.x + br.w / 2, br.y + br.h / 2);
  }
}

function drawEfeTitle(ctx, W, H, tr) {
  const fechaTexto = syncEfeFechaLabel();
  const eyebrowY = tr.y + Math.round(tr.h * 0.18);
  const titleY = tr.y + Math.round(tr.h * 0.5);
  const dateY = tr.y + Math.round(tr.h * 0.82);
  const titleSize = Math.round(Math.min(tr.h * 0.48, W * 0.044));
  const eyebrowSize = Math.round(titleSize * 0.28);
  const dateSize = Math.round(titleSize * 0.42);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(22,32,27,0.52)';
  ctx.font = `800 ${eyebrowSize}px Inter, sans-serif`;
  ctx.fillText('AGENDA DEL DIA', tr.x, eyebrowY);

  ctx.fillStyle = VS_Colors.ACCENT;
  ctx.font = `900 ${titleSize}px Inter, sans-serif`;
  ctx.fillText('EFEMERIDES', tr.x, titleY);

  if (fechaTexto) {
    ctx.fillStyle = VS_Colors.INK;
    ctx.font = `700 ${dateSize}px Inter, sans-serif`;
    ctx.fillText(fechaTexto, tr.x, dateY);
  }

  const lineH = Math.max(3, Math.round(H * 0.0015));
  ctx.fillStyle = VS_Colors.ACCENT;
  ctx.fillRect(tr.x, tr.y + tr.h - lineH, tr.w, lineH);
}

function renderizarEfemerides() {
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return;
  const badge = document.getElementById('efeCount');
  if (badge) badge.textContent = (efemeridesData.filter(e => !e._separator).length) + ' efemerides';
  syncEfeFechaLabel();
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
  drawEfeBackground(ctx, W, H);

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

  const tr = getEfeBlockRect('title', W, H);
  if (tr) drawEfeTitle(ctx, W, H, tr);

  VS_CanvasHelpers.drawFooter(ctx, W, H, false);

  if (efeBlocks && efeBlocks.logo) {
    drawEfeLogoPlate(ctx, W, H);
    VS_Utils.dibujarLogo(ctx, W, H, {
      x: efeBlocks.logo.x,
      y: efeBlocks.logo.y,
      w: efeBlocks.logo.w
    });
  }

  if (efeActiveBlock && efeBlocks && efeBlocks[efeActiveBlock]) {
    const b = efeBlocks[efeActiveBlock];
    VS_CanvasHelpers.drawActiveUI(ctx, W, H, { x: b.x * W, y: b.y * H, w: b.w * W, h: b.h * H });
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function renderizarEfemeridesEnCtx(ctx, W, H) {
  drawEfeBackground(ctx, W, H);

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

  VS_CanvasHelpers.drawFooter(ctx, W, H, false);

  if (efeBlocks && efeBlocks.logo) {
    drawEfeLogoPlate(ctx, W, H);
    VS_Utils.dibujarLogo(ctx, W, H, {
      x: efeBlocks.logo.x,
      y: efeBlocks.logo.y,
      w: efeBlocks.logo.w
    });
  }
}

function ensureEfeWhatsAppFormat() {
  if (efeFormato !== 'square') {
    efeFormato = 'square';
    loadEfeBlocks();
  }
  const fmtEl = document.getElementById('efeFormato');
  if (fmtEl && fmtEl.value !== 'square') fmtEl.value = 'square';
}

function getEfeWhatsAppItems() {
  return efemeridesData.slice();
}

function drawEfeBackground(ctx, W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f5f6ef');
  grad.addColorStop(1, '#e9ece2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#16201b';
  ctx.fillRect(0, 0, W, Math.round(H * 0.18));

  const glow = ctx.createRadialGradient(W * 0.5, H * 0.22, 0, W * 0.5, H * 0.22, W * 0.52);
  glow.addColorStop(0, 'rgba(166,206,57,0.12)');
  glow.addColorStop(1, 'rgba(166,206,57,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

function drawEfeLogoPlate(ctx, W, H) {
  if (!efeBlocks || !efeBlocks.logo) return;
  const b = efeBlocks.logo;
  const x = b.x * W;
  const y = b.y * H;
  const w = b.w * W;
  const h = (b.h || (b.w * (window.logoState?.ar || 1))) * H;
  const padX = Math.round(w * 0.11);
  const padY = Math.round(h * 0.16);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.roundRect(x - padX, y - padY, w + padX * 2, h + padY * 2, Math.round(h * 0.34));
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = Math.max(1, Math.round(W * 0.001));
  ctx.beginPath();
  ctx.roundRect(x - padX, y - padY, w + padX * 2, h + padY * 2, Math.round(h * 0.34));
  ctx.stroke();
}

function drawEfeSectionHeader(ctx, x, y, w, h, label) {
  const meta = getEfeSectionMeta(label);
  const pillH = Math.min(Math.round(h * 0.78), 40);
  const pillY = y + Math.round((h - pillH) / 2);
  const labelSize = Math.max(24, Math.round(h * 0.48));
  const iconW = Math.round(pillH * (meta.icon.length > 2 ? 2.0 : 1.22));

  ctx.fillStyle = VS_Utils.hexToRgba(meta.accent, 0.2);
  ctx.beginPath();
  ctx.roundRect(x, pillY, iconW, pillH, Math.round(pillH / 2));
  ctx.fill();

  if (meta.icon === 'AR') {
    drawEfeArgentinaFlag(ctx, x + Math.round(iconW * 0.16), pillY + Math.round(pillH * 0.2), Math.round(iconW * 0.68), Math.round(pillH * 0.6));
  } else {
    ctx.fillStyle = meta.accent;
    ctx.font = `900 ${Math.round(pillH * 0.34)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(meta.icon, x + iconW / 2, y + h / 2);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = VS_Colors.INK;
  ctx.font = `800 ${labelSize}px Inter, sans-serif`;
  ctx.fillText(meta.title, x + iconW + Math.round(w * 0.018), y + h / 2);
}

function wrapEfeFullText(ctx, value, maxWidth) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach(word => {
    const candidate = line ? line + ' ' + word : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function isEfeArgentinaFlag(value) {
  const text = String(value || '').trim();
  return text === 'AR' || text.toLowerCase() === 'argentina' || text.includes(String.fromCodePoint(0x1f1e6, 0x1f1f7));
}

function drawEfeArgentinaFlag(ctx, x, y, w, h) {
  const r = Math.min(w, h) * 0.16;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  ctx.fillStyle = '#74acdf';
  ctx.fillRect(x, y, w, h / 3);
  ctx.fillRect(x, y + h * 2 / 3, w, h / 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y + h / 3, w, h / 3);
  ctx.fillStyle = '#f6b40e';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) * 0.035));
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

function drawEfeTitle(ctx, W, H, tr) {
  const fechaTexto = syncEfeFechaLabel();
  const eyebrowY = tr.y + Math.round(tr.h * 0.16);
  const titleY = tr.y + Math.round(tr.h * 0.46);
  const dateY = tr.y + Math.round(tr.h * 0.78);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = `800 ${Math.round(H * 0.02)}px Inter, sans-serif`;
  ctx.fillText('AGENDA DEL DIA', tr.x, eyebrowY);

  ctx.fillStyle = VS_Colors.ACCENT;
  ctx.font = `900 ${Math.round(H * 0.05)}px Inter, sans-serif`;
  ctx.fillText('EFEMERIDES', tr.x, titleY);

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(H * 0.028)}px Inter, sans-serif`;
  ctx.fillText(fechaTexto, tr.x, dateY);
}

function drawEfeCards(ctx, W, H, br) {
  const data = getEfeWhatsAppItems();
  const pad = Math.round(W * 0.018);
  const cardW = br.w - pad * 2;
  const innerX = br.x + pad;
  const items = data.filter(e => !e._separator).length;
  const seps = data.filter(e => e._separator).length;
  const availH = br.h - pad * 2;
  const sepRatio = 0.14;
  const itemRatio = 1;
  const totalRatio = items * itemRatio + seps * sepRatio;
  const itemH = Math.round(Math.min(availH / Math.max(totalRatio, 1), W * 0.17));
  const sepH = Math.round(itemH * sepRatio);
  let curY = br.y + pad;

  data.forEach(e => {
    if (e._separator) {
      if (curY + sepH > br.y + br.h) return;
      drawEfeSectionHeader(ctx, innerX, curY, cardW, sepH, e._separator);
      curY += sepH;
      return;
    }
    if (curY + itemH > br.y + br.h) return;

    const y = curY;
    const catColor = VS_Colors.CAT_COLORS[e.categoria] || VS_Colors.CAT_DEFAULT;
    const isDest = !!e.destacada;
    const iconSize = Math.round(itemH * 0.42);
    const iconX = innerX + Math.round(cardW * 0.024);
    const iconY = y + Math.round(itemH * 0.18);
    const textX = iconX + iconSize + Math.round(cardW * 0.028);
    const titleY = y + Math.round(itemH * 0.3);
    const descY = y + Math.round(itemH * 0.54);
    const descLineH = Math.round(itemH * 0.135);
    const yearText = String(e.anio || '');
    const badgeText = e.categoria || '';

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = Math.round(itemH * 0.12);
    ctx.shadowOffsetY = Math.round(itemH * 0.04);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    ctx.roundRect(innerX, y, cardW, itemH - Math.round(W * 0.004), Math.round(itemH * 0.1));
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = isDest ? 'rgba(201,162,39,0.42)' : 'rgba(22,32,27,0.08)';
    ctx.lineWidth = Math.max(1, Math.round(W * 0.001));
    ctx.beginPath();
    ctx.roundRect(innerX, y, cardW, itemH - Math.round(W * 0.004), Math.round(itemH * 0.1));
    ctx.stroke();

    ctx.fillStyle = isDest ? VS_Colors.GOLD : catColor;
    ctx.beginPath();
    ctx.roundRect(innerX, y + Math.round(itemH * 0.12), Math.max(8, Math.round(W * 0.004)), itemH * 0.72, 4);
    ctx.fill();

    ctx.fillStyle = VS_Utils.hexToRgba(isDest ? VS_Colors.GOLD : catColor, 0.14);
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, Math.round(iconSize * 0.28));
    ctx.fill();
    ctx.strokeStyle = VS_Utils.hexToRgba(isDest ? VS_Colors.GOLD : catColor, 0.22);
    ctx.lineWidth = Math.max(1, Math.round(W * 0.0008));
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, Math.round(iconSize * 0.28));
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(iconSize * 0.78)}px sans-serif`;
    ctx.fillText(e.emoji || '•', iconX + iconSize / 2, iconY + iconSize / 2 + Math.round(iconSize * 0.02));

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDest ? VS_Colors.GOLD : catColor;
    ctx.font = `900 ${Math.round(itemH * 0.16)}px Inter, sans-serif`;
    const yearW = ctx.measureText(yearText).width + Math.round(itemH * 0.14);
    ctx.fillText(yearText, textX, titleY);

    ctx.font = `700 ${Math.round(itemH * 0.1)}px Inter, sans-serif`;
    const badgeW = ctx.measureText(badgeText).width + Math.round(itemH * 0.22);
    const badgeH = Math.round(itemH * 0.17);
    const badgeX = innerX + cardW - badgeW - Math.round(cardW * 0.02);
    const badgeY = y + Math.round(itemH * 0.11);
    ctx.fillStyle = VS_Utils.hexToRgba(isDest ? VS_Colors.GOLD : catColor, 0.14);
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, Math.round(badgeH / 2));
    ctx.fill();
    ctx.fillStyle = isDest ? VS_Colors.GOLD : catColor;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

    const titleX = textX + yearW;
    const titleMaxW = badgeX - titleX - Math.round(cardW * 0.02);
    ctx.textAlign = 'left';
    ctx.fillStyle = VS_Colors.INK;
    ctx.font = `800 ${Math.round(itemH * 0.145)}px Inter, sans-serif`;
    const titleLines = VS_Utils.wrapText(ctx, e.titulo || '', titleMaxW, 2);
    const titleLineH = Math.round(itemH * 0.13);
    titleLines.forEach((line, i) => {
      ctx.fillText(line, titleX, titleY + i * titleLineH);
    });

    ctx.fillStyle = isDest ? 'rgba(58,46,18,0.9)' : 'rgba(22,32,27,0.74)';
    ctx.font = `600 ${Math.round(itemH * 0.11)}px Inter, sans-serif`;
    const descLines = VS_Utils.wrapText(ctx, e.descripcion || '', badgeX - textX - Math.round(cardW * 0.02), 3);
    descLines.forEach((line, i) => {
      ctx.fillText(line, textX, descY + i * descLineH);
    });

    curY += itemH;
  });
}

function renderizarEfemerides() {
  ensureEfeWhatsAppFormat();
  const canvas = document.getElementById('efemeridesCanvas');
  if (!canvas) return;
  const badge = document.getElementById('efeCount');
  if (badge) badge.textContent = (efemeridesData.filter(e => !e._separator).length) + ' efemerides';
  syncEfeFechaLabel();

  const fmt = VS_Formats.square;
  const W = fmt.w, H = fmt.h;
  const cssW = canvas.parentElement.clientWidth || 800;
  const cssH = cssW;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = W;
  canvas.height = H;

  if (!efeBlocks) loadEfeBlocks();
  if (efeBlocks) {
    efeBlocks.title = { x: 0.06, y: 0.055, w: 0.48, h: 0.125 };
    efeBlocks.logo = { x: 0.67, y: 0.04, w: 0.25, h: window.logoState?.ar ? 0.25 * window.logoState.ar : 0.09 };
    efeBlocks.body = { x: 0.05, y: 0.205, w: 0.9, h: 0.735 };
  }

  const ctx = canvas.getContext('2d');
  drawEfeBackground(ctx, W, H);
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
  VS_CanvasHelpers.drawFooter(ctx, W, H, false);
  if (efeBlocks && efeBlocks.logo) {
    drawEfeLogoPlate(ctx, W, H);
    VS_Utils.dibujarLogo(ctx, W, H, { x: efeBlocks.logo.x, y: efeBlocks.logo.y, w: efeBlocks.logo.w });
  }
}

function renderizarEfemeridesEnCtx(ctx, W, H) {
  ensureEfeWhatsAppFormat();
  if (efeBlocks) {
    efeBlocks.title = { x: 0.06, y: 0.055, w: 0.48, h: 0.125 };
    efeBlocks.logo = { x: 0.67, y: 0.04, w: 0.25, h: window.logoState?.ar ? 0.25 * window.logoState.ar : 0.09 };
    efeBlocks.body = { x: 0.05, y: 0.205, w: 0.9, h: 0.735 };
  }
  drawEfeBackground(ctx, W, H);
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
  VS_CanvasHelpers.drawFooter(ctx, W, H, false);
  if (efeBlocks && efeBlocks.logo) {
    drawEfeLogoPlate(ctx, W, H);
    VS_Utils.dibujarLogo(ctx, W, H, { x: efeBlocks.logo.x, y: efeBlocks.logo.y, w: efeBlocks.logo.w });
  }
}

// Final WhatsApp composition: large type, two-column secondary sections, and
// solid emoji chips so the source emoji survives downscaling and PNG export.
function drawEfeCards(ctx, W, H, br) {
  const data = getEfeWhatsAppItems();
  const pad = Math.round(W * 0.016);
  const gap = Math.round(W * 0.009);
  const sectionGap = Math.round(W * 0.006);
  const headerH = Math.round(W * 0.035);
  const innerX = br.x + pad;
  const innerW = br.w - pad * 2;
  let sectionCount = 0;
  let featuredCount = 0;
  let regularItems = 0;
  let currentRegularItems = 0;
  let currentFeatured = false;
  data.forEach(e => {
    if (e._separator) {
      if (currentRegularItems) regularItems += Math.ceil(currentRegularItems / 2);
      currentRegularItems = 0;
      sectionCount++;
      currentFeatured = String(e._separator).toLowerCase().includes('destac');
    } else if (currentFeatured) {
      featuredCount++;
    } else {
      currentRegularItems++;
    }
  });
  if (currentRegularItems) regularItems += Math.ceil(currentRegularItems / 2);
  const desiredFeatureH = Math.round(W * 0.104);
  const desiredRegularH = Math.round(W * 0.135);
  const fixedH = sectionCount * (headerH + sectionGap);
  const desiredCardsH = featuredCount * desiredFeatureH + regularItems * desiredRegularH;
  const cardBudget = Math.max(1, br.h - pad * 2 - fixedH);
  const cardScale = desiredCardsH ? Math.min(1, cardBudget / desiredCardsH) : 1;
  const featureH = Math.round(desiredFeatureH * cardScale);
  const regularH = Math.round(desiredRegularH * cardScale);
  let curY = br.y + pad;
  let section = null;

  const drawCard = (e, x, y, cardW, cardH, featured) => {
    const catColor = VS_Colors.CAT_COLORS[e.categoria] || VS_Colors.CAT_DEFAULT;
    const accent = featured ? VS_Colors.GOLD : catColor;
    const boxH = cardH - gap;
    const radius = Math.round(boxH * 0.12);
    const iconSize = Math.round(boxH * (featured ? 0.58 : 0.48));
    const badgeFs = Math.round(W * (featured ? 0.014 : 0.0125));
    const categoryH = Math.round(W * 0.023);
    const iconX = x + Math.round(cardW * 0.025);
    const iconY = y + categoryH + Math.round(boxH * 0.04);
    const textX = iconX + iconSize + Math.round(cardW * 0.035);
    const badgeText = e.categoria || '';

    ctx.save();
    ctx.shadowColor = 'rgba(22,32,27,0.14)';
    ctx.shadowBlur = Math.round(boxH * 0.12);
    ctx.shadowOffsetY = Math.round(boxH * 0.05);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, boxH, radius);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = featured ? 'rgba(201,162,39,0.58)' : 'rgba(22,32,27,0.13)';
    ctx.lineWidth = Math.max(2, Math.round(W * 0.0012));
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, boxH, radius);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(x, y + Math.round(boxH * 0.12), Math.max(10, Math.round(W * 0.006)), boxH * 0.72, 5);
    ctx.fill();

    ctx.fillStyle = '#183128';
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, Math.round(iconSize * 0.25));
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(2, Math.round(W * 0.0015));
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, Math.round(iconSize * 0.25));
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(iconSize * 0.72)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.fillStyle = '#ffffff';
    if (isEfeArgentinaFlag(e.emoji)) {
      drawEfeArgentinaFlag(ctx, iconX + Math.round(iconSize * 0.1), iconY + Math.round(iconSize * 0.23), Math.round(iconSize * 0.8), Math.round(iconSize * 0.54));
    } else {
      ctx.fillText(e.emoji || '•', iconX + iconSize / 2, iconY + iconSize / 2);
    }

    ctx.font = `800 ${badgeFs}px Inter, sans-serif`;
    const badgeW = ctx.measureText(badgeText).width + Math.round(W * 0.018);
    const badgeH = categoryH;
    const badgeX = Math.max(x + 8, Math.min(x + cardW - badgeW - 8, iconX + iconSize / 2 - badgeW / 2));
    const badgeY = y + Math.round(boxH * 0.04);
    ctx.fillStyle = VS_Utils.hexToRgba(accent, 0.17);
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, Math.round(badgeH / 2));
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

    const yearText = String(e.anio || '');
    const yearFs = Math.round(W * (featured ? 0.025 : 0.022));
    let titleFs = Math.round(W * (featured ? 0.025 : 0.021));
    const titleY = y + Math.round(boxH * (featured ? 0.46 : 0.4));

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.font = `900 ${yearFs}px Inter, sans-serif`;
    const yearW = ctx.measureText(yearText).width + Math.round(W * 0.014);
    ctx.fillText(yearText, textX, titleY);

    const titleX = textX + yearW;
    const textRight = x + cardW - Math.round(cardW * 0.026);
    const titleMaxW = Math.max(120, textRight - titleX);
    ctx.fillStyle = VS_Colors.INK;
    let titleLines = [];
    do {
      ctx.font = `800 ${titleFs}px Inter, sans-serif`;
      titleLines = wrapEfeFullText(ctx, e.titulo || '', titleMaxW);
      if (titleLines.length <= 2 || titleFs <= Math.round(W * 0.015)) break;
      titleFs -= 2;
    } while (titleFs > 0);
    const titleLineH = Math.round(titleFs * 1.12);
    titleLines.forEach((line, i) => ctx.fillText(line, titleX, titleY + i * titleLineH));

    const descY = titleY + Math.max(0, titleLines.length - 1) * titleLineH
      + Math.round(boxH * (featured ? 0.27 : 0.2));
    let descFs = Math.round(W * (featured ? 0.018 : 0.016));
    let descLines = [];
    let descLineH = 0;
    ctx.fillStyle = featured ? 'rgba(58,46,18,0.9)' : 'rgba(22,32,27,0.78)';
    do {
      ctx.font = `600 ${descFs}px Inter, sans-serif`;
      descLines = wrapEfeFullText(ctx, e.descripcion || '', textRight - textX);
      descLineH = Math.round(descFs * 1.2);
      const lastBaseline = descY + Math.max(0, descLines.length - 1) * descLineH;
      if (lastBaseline <= y + boxH - Math.round(boxH * 0.08) || descFs <= Math.round(W * 0.012)) break;
      descFs -= 1;
    } while (descFs > 0);
    descLines.forEach((line, i) => ctx.fillText(line, textX, descY + i * descLineH));
  };

  const flushSection = () => {
    if (!section) return;
    const featured = section.label.toLowerCase().includes('destac');
    const cardH = featured ? featureH : regularH;
    drawEfeSectionHeader(ctx, innerX, curY, innerW, headerH, section.label);
    curY += headerH;
    if (featured) {
      section.items.forEach(e => {
        drawCard(e, innerX, curY, innerW, cardH, true);
        curY += cardH;
      });
    } else {
      const cardW = Math.floor((innerW - gap) / 2);
      for (let i = 0; i < section.items.length; i += 2) {
        const row = section.items.slice(i, i + 2);
        row.forEach((e, j) => drawCard(e, innerX + j * (cardW + gap), curY, cardW, cardH, false));
        curY += cardH;
      }
    }
    curY += sectionGap;
  };

  data.forEach(e => {
    if (e._separator) {
      flushSection();
      section = { label: e._separator, items: [] };
    } else if (section) {
      section.items.push(e);
    }
  });
  flushSection();
}

document.addEventListener('DOMContentLoaded', initEfemerides);
