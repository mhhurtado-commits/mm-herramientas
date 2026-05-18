// ============================================================
// Editor de Imágenes por Lotes v2.0
// Con interacción directa en canvas (arrastrar/redimensionar)
// ============================================================

// ============================================================
// FORMATOS Y PLANTILLAS
// ============================================================

const FMTS = {
  sq:      { w: 1080, h: 1080, lbl: 'Cuadrado 1080×1080' },
  story:   { w: 1080, h: 1920, lbl: 'Historia 1080×1920' },
  portrait: { w: 1080, h: 1350, lbl: 'Portrait 1080×1350' },
  fb:      { w: 1200, h: 628,  lbl: 'Facebook 1200×628' },
  tw:      { w: 1600, h: 900,  lbl: 'Twitter 1600×900' }
};

const TPLS = {
  normal(W,H) {},
  moderna(W,H) {
    const ctx = this;
    const g = ctx.createLinearGradient(0, H * 0.38, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.82)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  },
  banda(W,H) {
    const ctx = this;
    const bh = Math.round(H * 0.32);
    ctx.fillStyle = 'rgba(0,0,0,.88)';
    ctx.fillRect(0, H - bh, W, bh);
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, H - bh, W, Math.round(H * 0.018));
  },
  impacto(W,H) {
    const ctx = this;
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 0, Math.round(W * 0.025), H);
  },
  diagonal(W,H) {
    const ctx = this;
    const g = ctx.createLinearGradient(0, H, W * 0.7, 0);
    g.addColorStop(0, 'rgba(0,0,0,.88)');
    g.addColorStop(0.6, 'rgba(0,0,0,.3)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  },
  verde(W,H) {
    const ctx = this;
    const bh = Math.round(H * 0.32);
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, H - bh, W, bh);
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fillRect(0, H - bh, W, 2);
  },
  franja(W,H) {
    const ctx = this;
    const g = ctx.createLinearGradient(0, H * 0.42, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.86)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 0, Math.round(W * 0.038), H);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(Math.round(W * 0.038), 0, Math.round(W * 0.004), H);
  },
  titular(W,H) {
    const ctx = this;
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 0, W, Math.round(H * 0.012));
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, H - Math.round(H * 0.012), W, Math.round(H * 0.012));
  },
  minimalista(W,H) {
    const ctx = this;
    ctx.fillStyle = 'rgba(245,249,232,.18)';
    ctx.fillRect(0, 0, W, H);
    const bh = Math.round(H * 0.3);
    ctx.fillStyle = 'rgba(255,255,255,.93)';
    ctx.fillRect(0, H - bh, W, bh);
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, H - bh, W, Math.round(H * 0.008));
  },
  // Nuevas plantillas de Placas
  collage2(W,H) {
    const ctx = this;
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round(W*0.02), Math.round(H*0.02), Math.round(W*0.96), Math.round(H*0.96));
  },
  collage3(W,H) {
    const ctx = this;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#a6ce39';
    ctx.lineWidth = Math.round(H * 0.008);
    ctx.strokeRect(Math.round(W*0.05), Math.round(H*0.05), Math.round(W*0.9), Math.round(H*0.9));
  },
  collage4(W,H) {
    const ctx = this;
    const gap = Math.round(H * 0.015);
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(gap, gap, Math.round(W/2)-gap*1.5, Math.round(H/2)-gap*1.5);
    ctx.fillRect(Math.round(W/2)+gap/2, gap, Math.round(W/2)-gap*1.5, Math.round(H/2)-gap*1.5);
    ctx.fillRect(gap, Math.round(H/2)+gap/2, Math.round(W/2)-gap*1.5, Math.round(H/2)-gap*1.5);
    ctx.fillRect(Math.round(W/2)+gap/2, Math.round(H/2)+gap/2, Math.round(W/2)-gap*1.5, Math.round(H/2)-gap*1.5);
  },
  circular(W,H) {
    const ctx = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(W/2, H/2, Math.min(W,H)*0.42, 0, Math.PI*2);
    ctx.fillStyle = '#a6ce39';
    ctx.fill();
    ctx.lineWidth = Math.round(H * 0.01);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  },
  textual(W,H) {
    const ctx = this;
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 0, W, Math.round(H*0.15));
    ctx.fillStyle = '#f5f9e8';
    ctx.fillRect(0, Math.round(H*0.15), W, Math.round(H*0.85));
  },
  degradado(W,H) {
    const ctx = this;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(166,206,57,0.9)');
    g.addColorStop(1, 'rgba(166,206,57,0.2)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  },
  borde(W,H) {
    const ctx = this;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#a6ce39';
    ctx.lineWidth = Math.round(H * 0.02);
    ctx.strokeRect(Math.round(W*0.05), Math.round(H*0.05), Math.round(W*0.9), Math.round(H*0.9));
  }
};

const TPL_LABELS = {
  normal: 'Predeterminada',
  moderna: 'Moderna',
  banda: 'Banda',
  impacto: 'Impacto',
  diagonal: 'Diagonal',
  verde: 'Verde',
  franja: 'Franja',
  titular: 'Titular',
  minimalista: 'Minimalista',
  collage2: 'Collage 2',
  collage3: 'Collage 3',
  collage4: 'Collage 4',
  circular: 'Circular',
  textual: 'Textual',
  degradado: 'Degradado',
  borde: 'Borde'
};

// ============================================================
// UTILIDADES
// ============================================================

let currentImages = [];
let currentFmt = 'sq';
let currentTpl = 'normal';
let currentIndex = 0;

// Elementos interactivos
let logoImg = null;
let customLogoImg = null;
let activeElement = null; // 'text' o 'logo'
let action = null;
let dragOffset = { x: 0, y: 0 };
let resizeStart = null;

// Posiciones y tamaños (en porcentaje relativo al canvas)
let textElement = {
  x: 50,      // centro horizontal %
  y: 85,      // posición vertical %
  w: 70,      // ancho %
  h: 12,      // alto %
  visible: true,
  text: 'Media Mendoza',
  color: '#ffffff',
  bgColor: '#000000',
  bgOpacity: 0.6
};

let logoElement = {
  x: 85,      // esquina derecha %
  y: 8,       // desde arriba %
  w: 25,      // ancho %
  h: 0,       // se calcula con ratio
  visible: true,
  opacity: 1
};

// Ajustes de imagen
let imgSettings = {
  dark: 0,
  blur: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0
};

// Overlay
let overlaySettings = {
  active: false,
  color: '#000000',
  opacity: 0.3
};

let previewCanvas = null;
let previewCtx = null;
let currentImgObj = null;
let scale = 1;

// Handles para interacción
const HR = 20;

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function toast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Procesando...';
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

function getCanvasCoords(e) {
  const rect = previewCanvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  const scaleX = previewCanvas.width / rect.width;
  const scaleY = previewCanvas.height / rect.height;
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY
  };
}

function getElementRect(el, W, H) {
  if (el === textElement) {
    const w = W * (textElement.w / 100);
    const h = H * (textElement.h / 100);
    const x = (textElement.x / 100) * W - w / 2;
    const y = (textElement.y / 100) * H - h / 2;
    return { x, y, w, h };
  } else if (el === logoElement && logoImg) {
    const w = W * (logoElement.w / 100);
    const h = w / (logoImg.width / logoImg.height);
    const x = (logoElement.x / 100) * W - w;
    const y = (logoElement.y / 100) * H;
    return { x, y, w, h };
  }
  return null;
}

function getHandles(el, W, H) {
  const rect = getElementRect(el, W, H);
  if (!rect) return [];
  return [
    { x: rect.x, y: rect.y, id: 'nw', cursor: 'nw-resize', type: 'corner' },
    { x: rect.x + rect.w, y: rect.y, id: 'ne', cursor: 'ne-resize', type: 'corner' },
    { x: rect.x, y: rect.y + rect.h, id: 'sw', cursor: 'sw-resize', type: 'corner' },
    { x: rect.x + rect.w, y: rect.y + rect.h, id: 'se', cursor: 'se-resize', type: 'corner' },
    { x: rect.x + rect.w / 2, y: rect.y, id: 'n', cursor: 'n-resize', type: 'side' },
    { x: rect.x + rect.w / 2, y: rect.y + rect.h, id: 's', cursor: 's-resize', type: 'side' },
    { x: rect.x, y: rect.y + rect.h / 2, id: 'w', cursor: 'w-resize', type: 'side' },
    { x: rect.x + rect.w, y: rect.y + rect.h / 2, id: 'e', cursor: 'e-resize', type: 'side' }
  ];
}

function hitTest(pos, el, W, H) {
  const rect = getElementRect(el, W, H);
  if (!rect) return null;
  if (pos.x >= rect.x && pos.x <= rect.x + rect.w && pos.y >= rect.y && pos.y <= rect.y + rect.h) {
    return 'drag';
  }
  const handles = getHandles(el, W, H);
  const hs = Math.max(10, Math.round(HR * (W / 1080)));
  for (const h of handles) {
    if (Math.abs(pos.x - h.x) < hs && Math.abs(pos.y - h.y) < hs) {
      return 'resize-' + h.id;
    }
  }
  return null;
}

function rrCtx(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxW) {
  if (!text || maxW <= 0) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';

  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (cur && ctx.measureText(test).width > maxW) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }

  if (cur.trim()) lines.push(cur);
  return lines;
}

// ============================================================
// DIBUJADO
// ============================================================

function applyImageFilters(ctx, W, H) {
  // Aplicar filtros de imagen usando filter property
  let filters = [];
  
  if (imgSettings.brightness !== 0) {
    const brightness = 1 + (imgSettings.brightness / 100);
    filters.push(`brightness(${brightness})`);
  }
  
  if (imgSettings.contrast !== 0) {
    const contrast = 1 + (imgSettings.contrast / 100);
    filters.push(`contrast(${contrast})`);
  }
  
  if (imgSettings.saturation !== 0) {
    const saturation = 1 + (imgSettings.saturation / 100);
    filters.push(`saturate(${saturation})`);
  }
  
  if (imgSettings.blur > 0) {
    filters.push(`blur(${imgSettings.blur}px)`);
  }
  
  if (filters.length > 0) {
    ctx.filter = filters.join(' ');
  }
  
  // Oscurecer (se aplica después de los filtros)
  if (imgSettings.dark > 0) {
    ctx.globalAlpha = imgSettings.dark / 100;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function drawLogo(ctx, W, H) {
  if (!logoElement.visible || !logoImg) return;
  
  const rect = getElementRect(logoElement, W, H);
  if (!rect) return;
  
  ctx.save();
  ctx.globalAlpha = logoElement.opacity;
  ctx.drawImage(logoImg, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawText(ctx, W, H) {
  if (!textElement.visible || !textElement.text.trim()) return;
  
  const rect = getElementRect(textElement, W, H);
  if (!rect) return;
  
  const rawText = textElement.text.toUpperCase();
  const padding = Math.max(8, Math.round(rect.h * 0.08));
  let fontSize = Math.min(rect.h * 0.75, rect.w * 0.14);
  let lines = [];
  let lineHeight = 0;

  for (let i = 0; i < 25; i++) {
    ctx.font = `700 ${fontSize}px 'BebasNeue', 'Inter', sans-serif`;
    lines = wrapText(ctx, rawText, rect.w - padding * 2);
    lineHeight = Math.max(1, fontSize * 1.1);
    const blockHeight = lines.length * lineHeight;
    const maxLineWidth = Math.max(0, ...lines.map(l => ctx.measureText(l).width));

    if ((blockHeight <= rect.h - padding * 2 && maxLineWidth <= rect.w - padding * 2) || fontSize <= 10) break;
    fontSize = Math.max(10, Math.round(fontSize * 0.88));
  }

  const blockHeight = lines.length * lineHeight;
  const blockWidth = Math.min(rect.w, Math.max(0, ...lines.map(l => ctx.measureText(l).width)) + padding * 2);
  const textX = rect.x + rect.w / 2;
  const textY = rect.y + Math.max(0, (rect.h - blockHeight) / 2);

  if (textElement.bgColor !== 'transparent' && textElement.bgOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = textElement.bgOpacity;
    ctx.fillStyle = textElement.bgColor;
    const rectH = blockHeight + padding;
    ctx.fillRect(rect.x + (rect.w - blockWidth) / 2, rect.y + (rect.h - rectH) / 2, blockWidth, rectH);
    ctx.restore();
  }

  ctx.fillStyle = textElement.color;
  ctx.shadowColor = 'rgba(0,0,0,.7)';
  ctx.shadowBlur = Math.round(fontSize * 0.12);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, textY + index * lineHeight);
  });

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function drawOverlay(ctx, W, H) {
  if (!overlaySettings.active || overlaySettings.opacity === 0) return;
  
  ctx.globalAlpha = overlaySettings.opacity;
  ctx.fillStyle = overlaySettings.color;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

function drawActiveUI(ctx, W, H) {
  if (!activeElement) return;
  
  const el = activeElement === 'text' ? textElement : logoElement;
  const rect = getElementRect(el, W, H);
  if (!rect) return;
  
  const lw = Math.max(2, Math.round(W * 0.0016));
  const hs = Math.max(10, Math.round(HR * (W / 1080)));
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  ctx.save();
  ctx.strokeStyle = 'rgba(166,206,57,.85)';
  ctx.lineWidth = Math.max(2, lw * 1.5);
  ctx.setLineDash([Math.round(W * 0.008), Math.round(W * 0.004)]);
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(166,206,57,.45)';
  ctx.lineWidth = Math.max(1, lw);
  ctx.beginPath();
  ctx.moveTo(W / 3, 0);
  ctx.lineTo(W / 3, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((W * 2) / 3, 0);
  ctx.lineTo((W * 2) / 3, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, H / 3);
  ctx.lineTo(W, H / 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, (H * 2) / 3);
  ctx.lineTo(W, (H * 2) / 3);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = Math.max(1, lw);
  ctx.beginPath();
  ctx.moveTo(rect.x, 0);
  ctx.lineTo(rect.x, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w, 0);
  ctx.lineTo(rect.x + rect.w, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, rect.y);
  ctx.lineTo(W, rect.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, rect.y + rect.h);
  ctx.lineTo(W, rect.y + rect.h);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.lineWidth = Math.max(2, Math.round(W * 0.002));
  const cs = Math.round(W * 0.022);
  ctx.beginPath();
  ctx.moveTo(cx - cs, cy);
  ctx.lineTo(cx + cs, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - cs);
  ctx.lineTo(cx, cy + cs);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, Math.round(W * 0.004), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(166,206,57,.9)';
  ctx.lineWidth = lw * 1.5;
  ctx.setLineDash([]);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  const handles = getHandles(el, W, H);
  handles.forEach(h => {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#a6ce39';
    ctx.lineWidth = Math.max(2, Math.round(W * 0.002));
    if (h.type === 'side') {
      const hw = hs * 0.6;
      const hh = hs * 1.4;
      rrCtx(ctx, h.x - hw / 2, h.y - hh / 2, hw, hh, hw / 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(h.x, h.y, hs * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  });
}

async function renderPreview() {
  if (!currentImages.length || !currentImgObj) return;
  
  const fmt = FMTS[currentFmt];
  const W = fmt.w;
  const H = fmt.h;
  
  previewCanvas.width = W;
  previewCanvas.height = H;
  previewCtx.clearRect(0, 0, W, H);
  
  // Aplicar filtros ANTES de dibujar (brillo, contraste, saturación, blur)
  let filters = [];
  if (imgSettings.brightness !== 0) filters.push(`brightness(${1 + (imgSettings.brightness / 100)})`);
  if (imgSettings.contrast !== 0) filters.push(`contrast(${1 + (imgSettings.contrast / 100)})`);
  if (imgSettings.saturation !== 0) filters.push(`saturate(${1 + (imgSettings.saturation / 100)})`);
  if (imgSettings.blur > 0) filters.push(`blur(${imgSettings.blur}px)`);
  
  if (filters.length > 0) {
    previewCtx.filter = filters.join(' ');
  }
  
  // Dibujar imagen CON los filtros aplicados
  const imgW = currentImgObj.width;
  const imgH = currentImgObj.height;
  const scaleDraw = Math.max(W / imgW, H / imgH);
  const drawW = imgW * scaleDraw;
  const drawH = imgH * scaleDraw;
  const drawX = (W - drawW) / 2;
  const drawY = (H - drawH) / 2;
  
  previewCtx.drawImage(currentImgObj, drawX, drawY, drawW, drawH);
  
  // Oscurecer
  if (imgSettings.dark > 0) {
    previewCtx.globalAlpha = imgSettings.dark / 100;
    previewCtx.fillStyle = '#000';
    previewCtx.fillRect(0, 0, W, H);
    previewCtx.globalAlpha = 1;
  }
  
  previewCtx.filter = 'none';
  
  // Plantilla
  const tplFn = TPLS[currentTpl];
  if (tplFn) tplFn.call(previewCtx, W, H);
  
  // Overlay
  if (overlaySettings.active && overlaySettings.opacity > 0) {
    previewCtx.globalAlpha = overlaySettings.opacity;
    previewCtx.fillStyle = overlaySettings.color;
    previewCtx.fillRect(0, 0, W, H);
    previewCtx.globalAlpha = 1;
  }
  
  // Logo
  drawLogo(previewCtx, W, H);
  
  // Texto
  drawText(previewCtx, W, H);
  
  // UI activa
  drawActiveUI(previewCtx, W, H);
}

function updatePreview() {
  renderPreview();
}

async function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function setCurrentImage(index) {
  if (!currentImages.length || index >= currentImages.length) return;
  currentIndex = index;
  currentImgObj = await loadImage(currentImages[currentIndex].file);
  updatePreview();
  updateThumbnails();
}

// ============================================================
// INTERACCIÓN CON EL CANVAS
// ============================================================

function onCanvasDown(e) {
  e.preventDefault();
  const pos = getCanvasCoords(e);
  const W = previewCanvas.width;
  const H = previewCanvas.height;
  
  // Verificar logo primero si está visible
  if (logoElement.visible && logoImg) {
    const logoHit = hitTest(pos, logoElement, W, H);
    if (logoHit) {
      activeElement = 'logo';
      if (logoHit === 'drag') {
        action = 'drag';
        const rect = getElementRect(logoElement, W, H);
        dragOffset = { x: pos.x - rect.x, y: pos.y - rect.y };
      } else {
        action = logoHit;
        resizeStart = { pos: { ...pos }, rect: getElementRect(logoElement, W, H), isLogo: true };
      }
      updatePreview();
      return;
    }
  }
  
  // Verificar texto
  if (textElement.visible) {
    const textHit = hitTest(pos, textElement, W, H);
    if (textHit) {
      activeElement = 'text';
      if (textHit === 'drag') {
        action = 'drag';
        const rect = getElementRect(textElement, W, H);
        dragOffset = { x: pos.x - rect.x, y: pos.y - rect.y };
      } else {
        action = textHit;
        resizeStart = { pos: { ...pos }, rect: getElementRect(textElement, W, H), isText: true };
      }
      updatePreview();
      return;
    }
  }
  
  activeElement = null;
  action = null;
  updatePreview();
}

function onCanvasMove(e) {
  if (!activeElement) return;
  e.preventDefault();

  const pos = getCanvasCoords(e);
  const W = previewCanvas.width;
  const H = previewCanvas.height;
  const SNAP = Math.max(10, Math.round(W * 0.014));

  const el = activeElement === 'text' ? textElement : logoElement;
  
  if (action === 'drag') {
    let newX = pos.x - dragOffset.x;
    let newY = pos.y - dragOffset.y;
    const rect = getElementRect(el, W, H);
    if (!rect) return;

    const centerX = newX + rect.w / 2;
    const centerY = newY + rect.h / 2;
    if (Math.abs(centerX - W / 2) < SNAP) {
      newX = W / 2 - rect.w / 2;
    }
    if (Math.abs(centerY - H / 2) < SNAP) {
      newY = H / 2 - rect.h / 2;
    }

    if (activeElement === 'text') {
      textElement.x = (newX + rect.w / 2) / W * 100;
      textElement.y = (newY + rect.h / 2) / H * 100;
      textElement.x = Math.min(95, Math.max(5, textElement.x));
      textElement.y = Math.min(95, Math.max(5, textElement.y));
    } else if (activeElement === 'logo') {
      const logoX = newX + rect.w;
      const logoY = newY;
      logoElement.x = (logoX / W) * 100;
      logoElement.y = (logoY / H) * 100;
      logoElement.x = Math.min(98, Math.max(2, logoElement.x));
      logoElement.y = Math.min(95, Math.max(2, logoElement.y));
    }
  }
  
  if (action.startsWith('resize-')) {
    const corner = action.slice(7);
    const dx = pos.x - resizeStart.pos.x;
    const dy = pos.y - resizeStart.pos.y;
    const MIN_W = W * 0.05;
    const MIN_H = H * 0.05;
    
    let { x, y, w, h } = resizeStart.rect;
    
    if (activeElement === 'text') {
      if (corner === 'se') { w = Math.max(MIN_W, w + dx); h = Math.max(MIN_H, h + dy); }
      else if (corner === 'sw') { const nw = Math.max(MIN_W, w - dx); x = resizeStart.rect.x + resizeStart.rect.w - nw; w = nw; h = Math.max(MIN_H, h + dy); }
      else if (corner === 'ne') { w = Math.max(MIN_W, w + dx); const nh = Math.max(MIN_H, h - dy); y = resizeStart.rect.y + resizeStart.rect.h - nh; h = nh; }
      else if (corner === 'nw') { const nw = Math.max(MIN_W, w - dx); x = resizeStart.rect.x + resizeStart.rect.w - nw; w = nw; const nh = Math.max(MIN_H, h - dy); y = resizeStart.rect.y + resizeStart.rect.h - nh; h = nh; }
      else if (corner === 'e') { w = Math.max(MIN_W, w + dx); }
      else if (corner === 'w') { const nw = Math.max(MIN_W, w - dx); x = resizeStart.rect.x + resizeStart.rect.w - nw; w = nw; }
      else if (corner === 's') { h = Math.max(MIN_H, h + dy); }
      else if (corner === 'n') { const nh = Math.max(MIN_H, h - dy); y = resizeStart.rect.y + resizeStart.rect.h - nh; h = nh; }
      
      textElement.w = (w / W) * 100;
      textElement.h = (h / H) * 100;
      textElement.w = Math.min(90, Math.max(10, textElement.w));
      textElement.h = Math.min(20, Math.max(5, textElement.h));
    } else if (activeElement === 'logo') {
      if (corner === 'se') { w = Math.max(MIN_W, w + dx); h = w / (logoImg.width / logoImg.height); }
      else if (corner === 'sw') { const nw = Math.max(MIN_W, w - dx); x = resizeStart.rect.x + resizeStart.rect.w - nw; w = nw; h = w / (logoImg.width / logoImg.height); }
      else if (corner === 'ne') { w = Math.max(MIN_W, w + dx); const nh = w / (logoImg.width / logoImg.height); y = resizeStart.rect.y + resizeStart.rect.h - nh; h = nh; }
      else if (corner === 'nw') { const nw = Math.max(MIN_W, w - dx); x = resizeStart.rect.x + resizeStart.rect.w - nw; w = nw; const nh = w / (logoImg.width / logoImg.height); y = resizeStart.rect.y + resizeStart.rect.h - nh; h = nh; }
      else if (corner === 'e') { w = Math.max(MIN_W, w + dx); h = w / (logoImg.width / logoImg.height); }
      else if (corner === 'w') { const nw = Math.max(MIN_W, w - dx); x = resizeStart.rect.x + resizeStart.rect.w - nw; w = nw; h = w / (logoImg.width / logoImg.height); }
      
      logoElement.w = (w / W) * 100;
      logoElement.w = Math.min(40, Math.max(8, logoElement.w));
    }
  }
  
  updatePreview();
}

function onCanvasUp() {
  action = null;
  updatePreview();
}

// ============================================================
// PROCESAMIENTO POR LOTE
// ============================================================

async function renderImageToCanvas(img, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  
  // Aplicar filtros ANTES de dibujar la imagen (brillo, contraste, saturación, blur)
  let filters = [];
  if (imgSettings.brightness !== 0) filters.push(`brightness(${1 + (imgSettings.brightness / 100)})`);
  if (imgSettings.contrast !== 0) filters.push(`contrast(${1 + (imgSettings.contrast / 100)})`);
  if (imgSettings.saturation !== 0) filters.push(`saturate(${1 + (imgSettings.saturation / 100)})`);
  if (imgSettings.blur > 0) filters.push(`blur(${imgSettings.blur}px)`);
  
  if (filters.length > 0) {
    ctx.filter = filters.join(' ');
  }
  
  // Dibujar imagen de fondo CON los filtros aplicados
  const imgW = img.width;
  const imgH = img.height;
  const scaleDraw = Math.max(W / imgW, H / imgH);
  const drawW = imgW * scaleDraw;
  const drawH = imgH * scaleDraw;
  const drawX = (W - drawW) / 2;
  const drawY = (H - drawH) / 2;
  
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  
  // Oscurecer (se aplica como overlay)
  if (imgSettings.dark > 0) {
    ctx.globalAlpha = imgSettings.dark / 100;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  
  // Reset filter para los elementos superpuestos
  ctx.filter = 'none';
  
  // Plantilla
  const tplFn = TPLS[currentTpl];
  if (tplFn) tplFn.call(ctx, W, H);
  
  // Overlay de color
  if (overlaySettings.active && overlaySettings.opacity > 0) {
    ctx.globalAlpha = overlaySettings.opacity;
    ctx.fillStyle = overlaySettings.color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  
  // Logo
  if (logoElement.visible && logoImg) {
    const logoRect = getElementRect(logoElement, W, H);
    if (logoRect) {
      ctx.globalAlpha = logoElement.opacity;
      ctx.drawImage(logoImg, logoRect.x, logoRect.y, logoRect.w, logoRect.h);
      ctx.globalAlpha = 1;
    }
  }
  
  // Texto
  if (textElement.visible && textElement.text.trim()) {
    const textRect = getElementRect(textElement, W, H);
    if (textRect) {
      const fontSize = Math.min(textRect.h * 0.7, textRect.w * 0.15);
      ctx.font = `700 ${fontSize}px 'BebasNeue', 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const text = textElement.text.toUpperCase();
      const metrics = ctx.measureText(text);
      const padding = fontSize * 0.3;
      
      if (textElement.bgColor !== 'transparent' && textElement.bgOpacity > 0) {
        ctx.globalAlpha = textElement.bgOpacity;
        ctx.fillStyle = textElement.bgColor;
        const rectW = Math.min(metrics.width + padding * 2, textRect.w);
        const rectH = fontSize + padding;
        ctx.fillRect(textRect.x + (textRect.w - rectW) / 2, textRect.y + (textRect.h - rectH) / 2, rectW, rectH);
        ctx.globalAlpha = 1;
      }
      
      ctx.fillStyle = textElement.color;
      ctx.shadowColor = 'rgba(0,0,0,.7)';
      ctx.shadowBlur = Math.round(fontSize * 0.12);
      ctx.fillText(text, textRect.x + textRect.w / 2, textRect.y + textRect.h / 2);
      ctx.shadowColor = 'transparent';
    }
  }
  
  return canvas;
}

async function processAllImages() {
  if (!currentImages.length) {
    toast('⚠ No hay imágenes cargadas');
    return;
  }
  
  const fmt = FMTS[currentFmt];
  const W = fmt.w;
  const H = fmt.h;
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  progressBar.classList.add('active');
  
  for (let i = 0; i < currentImages.length; i++) {
    const percent = Math.round((i / currentImages.length) * 100);
    progressFill.style.width = percent + '%';
    
    const img = await loadImage(currentImages[i].file);
    const canvas = await renderImageToCanvas(img, W, H);
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    currentImages[i].processedBlob = blob;
    currentImages[i].processedUrl = URL.createObjectURL(blob);
    
    if (i === 0) updateThumbnails();
  }
  
  progressFill.style.width = '100%';
  setTimeout(() => progressBar.classList.remove('active'), 1000);
  toast(`✅ ${currentImages.length} imágenes procesadas`);
}

async function downloadZip() {
  if (!currentImages.length) {
    toast('⚠ No hay imágenes para descargar');
    return;
  }
  
  const needProcess = currentImages.some(img => !img.processedBlob);
  if (needProcess) {
    toast('⚠ Primero hacé clic en "Aplicar ajustes a todas"');
    return;
  }
  
  showLoading('Generando ZIP...');
  
  try {
    if (!window.JSZip) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    const zip = new JSZip();
    
    for (let i = 0; i < currentImages.length; i++) {
      const img = currentImages[i];
      const ext = img.file.name.split('.').pop() || 'jpg';
      const fileName = `imagen_${String(i + 1).padStart(2, '0')}.${ext}`;
      zip.file(fileName, img.processedBlob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imagenes_procesadas_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast('✓ ZIP descargado');
  } catch (err) {
    console.error(err);
    toast('✗ Error al crear ZIP');
  } finally {
    hideLoading();
  }
}

// ============================================================
// THUMBNAILS Y MANEJO DE IMÁGENES
// ============================================================

function updateThumbnails() {
  const container = document.getElementById('previewContainer');
  const stats = document.getElementById('batchStats');
  const statsText = document.getElementById('statsText');
  
  if (!currentImages.length) {
    container.innerHTML = '';
    stats.style.display = 'none';
    return;
  }
  
  stats.style.display = 'flex';
  statsText.textContent = `${currentImages.length} imágenes cargadas`;
  
  container.innerHTML = '';
  currentImages.forEach((img, idx) => {
    const thumb = document.createElement('img');
    thumb.className = 'preview-thumb';
    if (idx === currentIndex) thumb.classList.add('active');
    thumb.src = img.previewUrl;
    thumb.onclick = () => setCurrentImage(idx);
    container.appendChild(thumb);
  });
}

async function addImages(files) {
  const newImages = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > 10 * 1024 * 1024) {
      toast(`⚠ ${file.name} es muy grande (máx 10MB)`);
      continue;
    }
    const previewUrl = URL.createObjectURL(file);
    newImages.push({ file, previewUrl, processedBlob: null, processedUrl: null });
  }
  
  if (currentImages.length + newImages.length > 30) {
    toast('⚠ Máximo 30 imágenes por lote');
    return;
  }
  
  currentImages.push(...newImages);
  if (currentImages.length && !currentImgObj) {
    await setCurrentImage(0);
  }
  updateThumbnails();
  toast(`${newImages.length} imágenes agregadas`);
}

function clearAllImages() {
  if (!currentImages.length) return;
  
  currentImages.forEach(img => {
    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
  });
  currentImages = [];
  currentImgObj = null;
  currentIndex = 0;
  updateThumbnails();
  
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  toast('✓ Todas las imágenes eliminadas');
}

// ============================================================
// CONTROLES DE COLOR DE TEXTO
// ============================================================

function setTextColor(color) {
  textElement.color = color;
  document.getElementById('textColor').value = color;
  updatePreview();
}

function setTextBgColor(color) {
  textElement.bgColor = color;
  document.getElementById('textBgColor').value = color;
  updatePreview();
}

// ============================================================
// EVENTOS DE UI
// ============================================================

function setupEventListeners() {
  // Formatos
  document.querySelectorAll('.fmt-pill').forEach(pill => {
    pill.onclick = () => {
      document.querySelectorAll('.fmt-pill').forEach(p => p.classList.remove('on'));
      pill.classList.add('on');
      currentFmt = pill.dataset.fmt;
      updatePreview();
    };
  });
  
  // Plantillas
  const tplGrid = document.getElementById('tplGrid');
  Object.keys(TPLS).forEach(tpl => {
    const btn = document.createElement('div');
    btn.className = 'tpl-btn' + (currentTpl === tpl ? ' on' : '');
    
    // Miniatura visual para cada plantilla
    let previewSvg = '';
    if (tpl === 'normal') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#333"/></svg>';
    else if (tpl === 'moderna') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#555"/><rect y="15" width="40" height="25" fill="rgba(0,0,0,0.8)"/></svg>';
    else if (tpl === 'banda') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#666"/><rect y="27" width="40" height="13" fill="rgba(0,0,0,0.9)"/><rect y="27" width="40" height="1" fill="#a6ce39"/></svg>';
    else if (tpl === 'impacto') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#555"/><rect width="1" height="40" fill="#a6ce39"/></svg>';
    else if (tpl === 'diagonal') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><defs><linearGradient id="g'+tpl+'" x1="0%" y1="100%" x2="70%" y2="0%"><stop offset="0%" style="stop-color:#000;stop-opacity:0.9"/><stop offset="60%" style="stop-color:#000;stop-opacity:0.3"/><stop offset="100%" style="stop-color:#000;stop-opacity:0"/></linearGradient></defs><rect width="40" height="40" fill="#555"/><rect width="40" height="40" fill="url(#g'+tpl+')"/></svg>';
    else if (tpl === 'verde') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#666"/><rect y="27" width="40" height="13" fill="#a6ce39"/><rect y="27" width="40" height="0.5" fill="rgba(255,255,255,0.2)"/></svg>';
    else if (tpl === 'franja') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#555"/><rect x="1.5" width="0.2" height="40" fill="#a6ce39"/><rect x="1.7" width="0.15" height="40" fill="rgba(0,0,0,0.5)"/></svg>';
    else if (tpl === 'titular') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#111"/><rect width="40" height="0.5" fill="#a6ce39"/><rect y="39.5" width="40" height="0.5" fill="#a6ce39"/></svg>';
    else if (tpl === 'minimalista') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="rgba(245,249,232,0.2)"/><rect y="28" width="40" height="12" fill="rgba(255,255,255,0.9)"/><rect y="28" width="40" height="0.3" fill="#a6ce39"/></svg>';
    else if (tpl === 'collage2') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#a6ce39"/><rect x="0.8" y="0.8" width="38.4" height="38.4" fill="#fff"/></svg>';
    else if (tpl === 'collage3') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#111"/><rect x="2" y="2" width="36" height="36" fill="none" stroke="#a6ce39" stroke-width="0.3"/></svg>';
    else if (tpl === 'collage4') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#a6ce39"/><rect x="0.6" y="0.6" width="18.8" height="18.8" fill="#fff"/><rect x="20.6" y="0.6" width="18.8" height="18.8" fill="#fff"/><rect x="0.6" y="20.6" width="18.8" height="18.8" fill="#fff"/><rect x="20.6" y="20.6" width="18.8" height="18.8" fill="#fff"/></svg>';
    else if (tpl === 'circular') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#000"/><circle cx="20" cy="20" r="8.4" fill="#a6ce39" stroke="#fff" stroke-width="0.4"/></svg>';
    else if (tpl === 'textual') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="6" fill="#a6ce39"/><rect y="6" width="40" height="34" fill="#f5f9e8"/></svg>';
    else if (tpl === 'degradado') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><defs><linearGradient id="gd'+tpl+'" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#a6ce39;stop-opacity:0.9"/><stop offset="100%" style="stop-color:#a6ce39;stop-opacity:0.2"/></linearGradient></defs><rect width="40" height="40" fill="url(#gd'+tpl+')"/></svg>';
    else if (tpl === 'borde') previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#fff"/><rect x="2" y="2" width="36" height="36" fill="none" stroke="#a6ce39" stroke-width="0.8"/></svg>';
    else previewSvg = '<svg viewBox="0 0 40 40" style="width:100%;height:100%"><rect width="40" height="40" fill="#333"/></svg>';
    
    const tplName = TPL_LABELS[tpl] || tpl.charAt(0).toUpperCase() + tpl.slice(1);
    btn.innerHTML = `<div class="tpl-prev">${previewSvg}</div><div class="tpl-name">${tplName}</div>`;
    btn.onclick = () => {
      document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      currentTpl = tpl;
      updatePreview();
    };
    tplGrid.appendChild(btn);
  });
  
  // Sliders de imagen
  document.getElementById('darkSlider').oninput = (e) => {
    imgSettings.dark = parseInt(e.target.value);
    document.getElementById('rv-dark').textContent = imgSettings.dark + '%';
    updatePreview();
  };
  document.getElementById('blurSlider').oninput = (e) => {
    imgSettings.blur = parseInt(e.target.value);
    document.getElementById('rv-blur').textContent = imgSettings.blur + 'px';
    updatePreview();
  };
  document.getElementById('brightnessSlider').oninput = (e) => {
    imgSettings.brightness = parseInt(e.target.value);
    document.getElementById('rv-brightness').textContent = imgSettings.brightness + '%';
    updatePreview();
  };
  document.getElementById('contrastSlider').oninput = (e) => {
    imgSettings.contrast = parseInt(e.target.value);
    document.getElementById('rv-contrast').textContent = imgSettings.contrast + '%';
    updatePreview();
  };
  document.getElementById('saturationSlider').oninput = (e) => {
    imgSettings.saturation = parseInt(e.target.value);
    document.getElementById('rv-saturation').textContent = imgSettings.saturation + '%';
    updatePreview();
  };
  
  // Texto
  document.getElementById('textActive').onchange = (e) => {
    textElement.visible = e.target.checked;
    document.getElementById('textControls').style.display = textElement.visible ? 'block' : 'none';
    updatePreview();
  };
  document.getElementById('textContent').oninput = (e) => {
    textElement.text = e.target.value;
    updatePreview();
  };
  document.getElementById('textColor').oninput = (e) => {
    textElement.color = e.target.value;
    updatePreview();
  };
  document.getElementById('textBgColor').oninput = (e) => {
    textElement.bgColor = e.target.value;
    updatePreview();
  };
  document.getElementById('textBgOp').oninput = (e) => {
    textElement.bgOpacity = parseInt(e.target.value) / 100;
    updatePreview();
  };
  
  // Logo
  document.getElementById('logoActive').onchange = (e) => {
    logoElement.visible = e.target.checked;
    document.getElementById('logoControls').style.display = logoElement.visible ? 'block' : 'none';
    updatePreview();
  };
  document.getElementById('logoOpacity').oninput = (e) => {
    logoElement.opacity = parseInt(e.target.value) / 100;
    document.getElementById('logoOpacityVal').textContent = e.target.value + '%';
    updatePreview();
  };
  document.getElementById('logoUpload').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        logoImg = img;
        customLogoImg = img;
        updatePreview();
        toast('✓ Logo personalizado cargado');
      };
      img.src = URL.createObjectURL(file);
    }
  };
  
  // Overlay
  document.getElementById('overlayActive').onchange = (e) => {
    overlaySettings.active = e.target.checked;
    document.getElementById('overlayControls').style.display = overlaySettings.active ? 'block' : 'none';
    updatePreview();
  };
  document.getElementById('overlayColor').oninput = (e) => {
    overlaySettings.color = e.target.value;
    updatePreview();
  };
  document.getElementById('overlayOpacity').oninput = (e) => {
    overlaySettings.opacity = parseInt(e.target.value) / 100;
    document.getElementById('overlayOpVal').textContent = e.target.value + '%';
    updatePreview();
  };
  
  // Botones principales
  document.getElementById('applyToAllBtn').onclick = processAllImages;
  document.getElementById('downloadZipBtn').onclick = downloadZip;
  document.getElementById('clearImagesBtn').onclick = clearAllImages;

  const actionButtons = document.querySelector('.action-buttons');
  if (actionButtons && !document.getElementById('aiGenerateBtn')) {
    const aiBtn = document.createElement('button');
    aiBtn.className = 'mm-btn';
    aiBtn.id = 'aiGenerateBtn';
    aiBtn.textContent = '🤖 Generar IA';
    aiBtn.onclick = generateAIText;
    actionButtons.insertBefore(aiBtn, document.getElementById('downloadZipBtn'));
  }
  
  // Upload
  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');
  uploadArea.onclick = () => imageInput.click();
  imageInput.onchange = (e) => addImages(Array.from(e.target.files));
  uploadArea.ondragover = (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--v)'; };
  uploadArea.ondragleave = () => { uploadArea.style.borderColor = ''; };
  uploadArea.ondrop = (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };
  
  // Interacción canvas
  previewCanvas = document.getElementById('previewCanvas');
  previewCtx = previewCanvas.getContext('2d');
  previewCanvas.addEventListener('mousedown', onCanvasDown);
  previewCanvas.addEventListener('mousemove', onCanvasMove);
  previewCanvas.addEventListener('mouseup', onCanvasUp);
  previewCanvas.addEventListener('touchstart', onCanvasDown, { passive: false });
  previewCanvas.addEventListener('touchmove', onCanvasMove, { passive: false });
  previewCanvas.addEventListener('touchend', onCanvasUp);
}

function generateAIText() {
  const promptText = prompt('Describe el tema o mensaje para generar el texto con IA:', textElement.text || 'Noticias de Mendoza');
  if (!promptText) return;

  const templates = [
    `Últimas noticias: ${promptText}`,
    `Especial sobre ${promptText}`,
    `Descubrí todo sobre ${promptText}`,
    `Actualización rápida: ${promptText}`,
    `Novedades de ${promptText}`
  ];
  const generated = templates[Math.floor(Math.random() * templates.length)];

  textElement.text = generated;
  document.getElementById('textContent').value = generated;
  if (!textElement.visible) {
    textElement.visible = true;
    document.getElementById('textActive').checked = true;
    document.getElementById('textControls').style.display = 'block';
  }
  updatePreview();
  toast('🤖 Texto generado con IA');
}

function toggleSection(head) {
  const body = head.nextElementSibling;
  const isOpen = head.classList.contains('open');
  head.classList.toggle('open', !isOpen);
  if (body) body.classList.toggle('open', !isOpen);
}

// ============================================================
// TEMA CLARO/OSCURO
// ============================================================

function setTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark-theme');
    document.getElementById('themeIcon').textContent = '☀️';
    document.getElementById('themeLabel').textContent = 'Modo claro';
  } else {
    body.classList.remove('dark-theme');
    document.getElementById('themeIcon').textContent = '🌙';
    document.getElementById('themeLabel').textContent = 'Modo oscuro';
  }
  localStorage.setItem('mm-theme', theme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-theme');
  setTheme(isDark ? 'light' : 'dark');
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Cargar logo por defecto
  const defaultLogo = new Image();
  defaultLogo.onload = () => {
    logoImg = defaultLogo;
    if (logoElement.visible) updatePreview();
  };
  defaultLogo.src = '../assets/logo.png';
  
  setupEventListeners();
  
  const savedTheme = localStorage.getItem('mm-theme');
  savedTheme === 'dark' ? setTheme('dark') : setTheme('light');
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
});