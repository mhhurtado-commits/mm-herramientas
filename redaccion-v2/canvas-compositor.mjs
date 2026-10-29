// Compositor Canvas para portada editorial de Media Mendoza.
// Escala y recorta imágenes a 1200x630 (cover) y estampa el logo con controles de arrastre y escala.

export const ANCHO_CANVAS = 1200;
export const ALTO_CANVAS = 630;

export function calcularRecorteCover(imgWidth, imgHeight, canvasWidth = ANCHO_CANVAS, canvasHeight = ALTO_CANVAS) {
  const w = Number(imgWidth) || 1;
  const h = Number(imgHeight) || 1;
  const cw = Number(canvasWidth) || ANCHO_CANVAS;
  const ch = Number(canvasHeight) || ALTO_CANVAS;
  const ir = w / h;
  const cr = cw / ch;
  let sx, sy, sw, sh;
  if (ir > cr) {
    sh = h;
    sw = sh * cr;
    sx = (w - sw) / 2;
    sy = 0;
  } else {
    sw = w;
    sh = sw / cr;
    sx = 0;
    sy = (h - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

export function calcularRectLogo(logoWidth, logoHeight, canvasWidth = ANCHO_CANVAS, canvasHeight = ALTO_CANVAS, margen = 20, proporcionAncho = 0.28) {
  const lw = Math.round(canvasWidth * proporcionAncho);
  const ratio = (Number(logoHeight) || 1) / (Number(logoWidth) || 1);
  const lh = Math.round(lw * ratio);
  return {
    x: canvasWidth - lw - margen,
    y: canvasHeight - lh - margen,
    w: lw,
    h: lh,
  };
}

export function detectarZonaLogo(punto = {}, rect = {}, margenHit = 12) {
  if (!rect || rect.x == null || rect.y == null) return null;
  const { x = 0, y = 0 } = punto;
  const { x: rx, y: ry, w: rw, h: rh } = rect;
  const corners = [
    { x: rx, y: ry, corner: 'nw' },
    { x: rx + rw, y: ry, corner: 'ne' },
    { x: rx, y: ry + rh, corner: 'sw' },
    { x: rx + rw, y: ry + rh, corner: 'se' },
  ];
  for (const c of corners) {
    if (Math.abs(x - c.x) <= margenHit && Math.abs(y - c.y) <= margenHit) {
      return { type: 'resize', corner: c.corner };
    }
  }
  if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
    return { type: 'drag' };
  }
  return null;
}

export function calcularNuevoRectLogo(s, punto, ratioAspecto = 1, minAncho = 30) {
  const dx = punto.x - s.sx;
  const dy = punto.y - s.sy;
  const sr = s.sr;
  const nuevo = { ...sr };
  const ar = Number(ratioAspecto) || 1;

  if (s.corner === 'se') {
    nuevo.w = Math.max(minAncho, sr.w + dx);
    nuevo.h = nuevo.w / ar;
  } else if (s.corner === 'sw') {
    const nw = Math.max(minAncho, sr.w - dx);
    nuevo.x = sr.x + sr.w - nw;
    nuevo.w = nw;
    nuevo.h = nuevo.w / ar;
  } else if (s.corner === 'ne') {
    nuevo.w = Math.max(minAncho, sr.w + dx);
    nuevo.h = nuevo.w / ar;
    nuevo.y = sr.y + sr.h - nuevo.h;
  } else if (s.corner === 'nw') {
    const nw = Math.max(minAncho, sr.w - dx);
    nuevo.x = sr.x + sr.w - nw;
    nuevo.w = nw;
    nuevo.h = nuevo.w / ar;
    nuevo.y = sr.y + sr.h - nuevo.h;
  }
  return nuevo;
}

export function crearCompositorCanvas({
  canvas,
  logoSrc = '../assets/logo.png',
  ancho = ANCHO_CANVAS,
  alto = ALTO_CANVAS,
  alCambiar,
} = {}) {
  if (!canvas) return null;
  canvas.width = ancho;
  canvas.height = alto;

  let fondoImg = null;
  let logoImg = null;
  let logoRect = { x: null, y: null, w: null, h: null };
  let logoDrag = null;
  let logoSizing = null;
  let logoVisible = true;

  function dibujar() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, ancho, alto);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ancho, alto);

    if (fondoImg) {
      const { sx, sy, sw, sh } = calcularRecorteCover(fondoImg.width, fondoImg.height, ancho, alto);
      ctx.drawImage(fondoImg, sx, sy, sw, sh, 0, 0, ancho, alto);
    }

    if (logoVisible && logoImg) {
      if (logoRect.x === null) {
        logoRect = calcularRectLogo(logoImg.width, logoImg.height, ancho, alto);
      }
      ctx.drawImage(logoImg, logoRect.x, logoRect.y, logoRect.w, logoRect.h);

      if (logoDrag || logoSizing) {
        ctx.strokeStyle = 'rgba(166, 206, 57, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(logoRect.x, logoRect.y, logoRect.w, logoRect.h);
        const hs = 8;
        const corners = [
          [logoRect.x, logoRect.y],
          [logoRect.x + logoRect.w, logoRect.y],
          [logoRect.x, logoRect.y + logoRect.h],
          [logoRect.x + logoRect.w, logoRect.y + logoRect.h],
        ];
        for (const [cx, cy] of corners) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#a6ce39';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, hs, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }

  function cargarLogo(src = logoSrc) {
    if (logoImg) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImg = img;
      dibujar();
    };
    img.src = src;
  }

  function cargarFondo(url) {
    if (!url) return;
    const img = new Image();
    if (!/^data:/i.test(url)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      fondoImg = img;
      cargarLogo();
      dibujar();
      if (typeof alCambiar === 'function') alCambiar({ tieneFondo: true, url });
    };
    img.src = url;
  }

  function getPunto(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const s = ancho / (r.width || 1);
    return {
      x: (t.clientX - r.left) * s,
      y: (t.clientY - r.top) * s,
    };
  }

  function onDown(e) {
    if (e.touches) e.preventDefault();
    const p = getPunto(e);
    const hit = detectarZonaLogo(p, logoRect);
    if (!hit) {
      canvas.style.cursor = 'default';
      return;
    }
    if (hit.type === 'drag') {
      logoDrag = { ox: p.x - logoRect.x, oy: p.y - logoRect.y };
      canvas.style.cursor = 'grabbing';
    } else if (hit.type === 'resize') {
      logoSizing = { corner: hit.corner, sx: p.x, sy: p.y, sr: { ...logoRect } };
      canvas.style.cursor = 'se-resize';
    }
  }

  function onMove(e) {
    if (e.touches) e.preventDefault();
    const p = getPunto(e);
    if (logoDrag) {
      logoRect.x = p.x - logoDrag.ox;
      logoRect.y = p.y - logoDrag.oy;
      dibujar();
      return;
    }
    if (logoSizing && logoImg) {
      const ar = (logoImg.width || 1) / (logoImg.height || 1);
      logoRect = calcularNuevoRectLogo(logoSizing, p, ar);
      dibujar();
      return;
    }
    const hit = detectarZonaLogo(p, logoRect);
    canvas.style.cursor = hit ? (hit.type === 'resize' ? 'se-resize' : 'grab') : 'default';
  }

  function onUp() {
    if (logoDrag || logoSizing) {
      logoDrag = null;
      logoSizing = null;
      dibujar();
    }
    canvas.style.cursor = 'default';
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onUp);
  canvas.addEventListener('mouseleave', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp);

  cargarLogo();

  return {
    cargarFondo,
    dibujar,
    toggleLogo(visible) {
      logoVisible = Boolean(visible);
      dibujar();
    },
    resetearLogo() {
      logoRect = { x: null, y: null, w: null, h: null };
      dibujar();
    },
    descargar({ nombre = `mediamendoza-${Date.now()}.jpg`, calidad = 0.93 } = {}) {
      if (!fondoImg) return false;
      const prevDrag = logoDrag;
      const prevSizing = logoSizing;
      logoDrag = null;
      logoSizing = null;
      dibujar();
      canvas.toBlob(blob => {
        if (!blob) return;
        const u = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = u;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(u);
        }, 1000);
        logoDrag = prevDrag;
        logoSizing = prevSizing;
      }, 'image/jpeg', calidad);
      return true;
    },
    tieneFondo() {
      return Boolean(fondoImg);
    },
  };
}
