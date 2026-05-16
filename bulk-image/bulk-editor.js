// ============================================================
// Editor de Imágenes por Lotes v1.0
// Procesamiento de múltiples imágenes con ajustes profesionales
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
  }
};

// ============================================================
// UTILIDADES
// ============================================================

let currentImages = [];        // Array de objetos { file, previewUrl, processedBlob }
let currentFmt = 'sq';
let currentTpl = 'normal';
let currentIndex = 0;
let logoImg = null;

// Ajustes
let settings = {
  dark: 0,
  blur: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  textActive: false,
  textContent: 'Media Mendoza',
  textSize: 48,
  textBgOp: 60,
  textX: 50,
  textY: 85,
  textColor: '#ffffff',
  textBgColor: '#000000',
  logoActive: false,
  logoSize: 15,
  logoOpacity: 100,
  logoX: 85,
  logoY: 8,
  overlayActive: false,
  overlayColor: '#000000',
  overlayOpacity: 30
};

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

// ============================================================
// DIBUJADO DE PREVIEW
// ============================================================

function applyFilters(ctx, img, W, H) {
  // Oscurecer
  if (settings.dark > 0) {
    ctx.globalAlpha = settings.dark / 100;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  
  // Brillo y contraste
  if (settings.brightness !== 0 || settings.contrast !== 0 || settings.saturation !== 0) {
    const brightness = settings.brightness / 100;
    const contrast = settings.contrast / 100;
    const saturation = settings.saturation / 100;
    ctx.filter = `brightness(${1 + brightness}) contrast(${1 + contrast}) saturate(${1 + saturation})`;
  }
}

function applyTemplate(ctx, W, H) {
  const tplFn = TPLS[currentTpl];
  if (tplFn) tplFn.call(ctx, W, H);
}

function drawText(ctx, W, H) {
  if (!settings.textActive || !settings.textContent.trim()) return;
  
  const fontSize = Math.round(settings.textSize * (W / 1080));
  const xPos = (settings.textX / 100) * W;
  const yPos = (settings.textY / 100) * H;
  
  ctx.font = `700 ${fontSize}px 'BebasNeue', 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const text = settings.textContent.toUpperCase();
  const metrics = ctx.measureText(text);
  const padding = fontSize * 0.4;
  const bgOpacity = settings.textBgOp / 100;
  
  if (settings.textBgColor !== 'transparent' && bgOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = bgOpacity;
    ctx.fillStyle = settings.textBgColor;
    const rectW = metrics.width + padding * 2;
    const rectH = fontSize + padding;
    ctx.fillRect(xPos - rectW / 2, yPos - rectH / 2, rectW, rectH);
    ctx.restore();
  }
  
  ctx.fillStyle = settings.textColor;
  ctx.shadowColor = 'rgba(0,0,0,.7)';
  ctx.shadowBlur = Math.round(fontSize * 0.15);
  ctx.fillText(text, xPos, yPos);
  ctx.shadowColor = 'transparent';
}

function drawLogo(ctx, W, H) {
  if (!settings.logoActive || !logoImg) return;
  
  const logoW = W * (settings.logoSize / 100);
  const logoH = logoW / (logoImg.width / logoImg.height);
  const xPos = (settings.logoX / 100) * W - logoW;
  const yPos = (settings.logoY / 100) * H;
  
  ctx.save();
  ctx.globalAlpha = settings.logoOpacity / 100;
  ctx.drawImage(logoImg, xPos, yPos, logoW, logoH);
  ctx.restore();
}

function drawOverlay(ctx, W, H) {
  if (!settings.overlayActive || settings.overlayOpacity === 0) return;
  
  ctx.globalAlpha = settings.overlayOpacity / 100;
  ctx.fillStyle = settings.overlayColor;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

async function renderImage(img, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  
  // Dibujar imagen
  const imgW = img.width, imgH = img.height;
  const scale = Math.max(W / imgW, H / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = (W - drawW) / 2;
  const drawY = (H - drawH) / 2;
  
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  
  // Aplicar filtros
  applyFilters(ctx, img, W, H);
  ctx.filter = 'none';
  
  // Aplicar plantilla
  applyTemplate(ctx, W, H);
  
  // Aplicar overlay
  drawOverlay(ctx, W, H);
  
  // Dibujar logo
  drawLogo(ctx, W, H);
  
  // Dibujar texto
  drawText(ctx, W, H);
  
  return canvas;
}

async function updatePreview() {
  if (!currentImages.length || currentIndex >= currentImages.length) return;
  
  const img = await loadImage(currentImages[currentIndex].file);
  const fmt = FMTS[currentFmt];
  const canvas = await renderImage(img, fmt.w, fmt.h);
  
  const previewCanvas = document.getElementById('previewCanvas');
  previewCanvas.width = fmt.w;
  previewCanvas.height = fmt.h;
  const previewCtx = previewCanvas.getContext('2d');
  previewCtx.drawImage(canvas, 0, 0);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ============================================================
// PROCESAMIENTO POR LOTE
// ============================================================

async function processAllImages() {
  if (!currentImages.length) {
    toast('⚠ No hay imágenes cargadas');
    return;
  }
  
  const fmt = FMTS[currentFmt];
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  progressBar.classList.add('active');
  
  for (let i = 0; i < currentImages.length; i++) {
    const percent = Math.round((i / currentImages.length) * 100);
    progressFill.style.width = percent + '%';
    
    const img = await loadImage(currentImages[i].file);
    const canvas = await renderImage(img, fmt.w, fmt.h);
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    currentImages[i].processedBlob = blob;
    currentImages[i].processedUrl = URL.createObjectURL(blob);
    
    // Actualizar thumbnail si es la primera
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
  
  // Verificar que todas tengan processedBlob
  const needProcess = currentImages.some(img => !img.processedBlob);
  if (needProcess) {
    toast('⚠ Primero hacé clic en "Aplicar ajustes a todas"');
    return;
  }
  
  showLoading('Generando ZIP...');
  
  try {
    const JSZip = window.JSZip;
    if (!JSZip) {
      // Cargar librería JSZip
      await loadJSZip();
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
    console.error('Error al crear ZIP:', err);
    toast('✗ Error al crear ZIP: ' + err.message);
  } finally {
    hideLoading();
  }
}

function loadJSZip() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
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
    thumb.onclick = () => {
      currentIndex = idx;
      updateThumbnails();
      updatePreview();
    };
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
  if (currentImages.length && currentIndex === 0) updatePreview();
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
  currentIndex = 0;
  updateThumbnails();
  
  const previewCanvas = document.getElementById('previewCanvas');
  const ctx = previewCanvas.getContext('2d');
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  toast('✓ Todas las imágenes eliminadas');
}

// ============================================================
// EVENTOS Y SINCRONIZACIÓN
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
    btn.innerHTML = `<div class="tpl-name">${tpl.charAt(0).toUpperCase() + tpl.slice(1)}</div>`;
    btn.onclick = () => {
      document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      currentTpl = tpl;
      updatePreview();
    };
    tplGrid.appendChild(btn);
  });
  
  // Sliders
  document.getElementById('darkSlider').oninput = (e) => {
    settings.dark = parseInt(e.target.value);
    document.getElementById('rv-dark').textContent = settings.dark + '%';
    updatePreview();
  };
  document.getElementById('blurSlider').oninput = (e) => {
    settings.blur = parseInt(e.target.value);
    document.getElementById('rv-blur').textContent = settings.blur + 'px';
    updatePreview();
  };
  document.getElementById('brightnessSlider').oninput = (e) => {
    settings.brightness = parseInt(e.target.value);
    document.getElementById('rv-brightness').textContent = settings.brightness + '%';
    updatePreview();
  };
  document.getElementById('contrastSlider').oninput = (e) => {
    settings.contrast = parseInt(e.target.value);
    document.getElementById('rv-contrast').textContent = settings.contrast + '%';
    updatePreview();
  };
  document.getElementById('saturationSlider').oninput = (e) => {
    settings.saturation = parseInt(e.target.value);
    document.getElementById('rv-saturation').textContent = settings.saturation + '%';
    updatePreview();
  };
  
  // Texto
  document.getElementById('textActive').onchange = (e) => {
    settings.textActive = e.target.checked;
    document.getElementById('textControls').style.display = settings.textActive ? 'block' : 'none';
    updatePreview();
  };
  document.getElementById('textContent').oninput = (e) => {
    settings.textContent = e.target.value;
    updatePreview();
  };
  document.getElementById('textSize').oninput = (e) => {
    settings.textSize = parseInt(e.target.value);
    updatePreview();
  };
  document.getElementById('textBgOp').oninput = (e) => {
    settings.textBgOp = parseInt(e.target.value);
    updatePreview();
  };
  document.getElementById('textX').oninput = (e) => {
    settings.textX = parseInt(e.target.value);
    updatePreview();
  };
  document.getElementById('textY').oninput = (e) => {
    settings.textY = parseInt(e.target.value);
    updatePreview();
  };
  document.getElementById('textColor').oninput = (e) => {
    settings.textColor = e.target.value;
    updatePreview();
  };
  document.getElementById('textBgColor').oninput = (e) => {
    settings.textBgColor = e.target.value;
    updatePreview();
  };
  
  // Logo
  document.getElementById('logoActive').onchange = (e) => {
    settings.logoActive = e.target.checked;
    document.getElementById('logoControls').style.display = settings.logoActive ? 'block' : 'none';
    updatePreview();
  };
  document.getElementById('logoSize').oninput = (e) => {
    settings.logoSize = parseInt(e.target.value);
    document.getElementById('logoSizeVal').textContent = settings.logoSize + '%';
    updatePreview();
  };
  document.getElementById('logoOpacity').oninput = (e) => {
    settings.logoOpacity = parseInt(e.target.value);
    document.getElementById('logoOpacityVal').textContent = settings.logoOpacity + '%';
    updatePreview();
  };
  document.getElementById('logoX').oninput = (e) => {
    settings.logoX = parseInt(e.target.value);
    updatePreview();
  };
  document.getElementById('logoY').oninput = (e) => {
    settings.logoY = parseInt(e.target.value);
    updatePreview();
  };
  document.getElementById('logoUpload').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        logoImg = img;
        updatePreview();
        toast('✓ Logo cargado');
      };
      img.src = URL.createObjectURL(file);
    }
  };
  
  // Overlay
  document.getElementById('overlayActive').onchange = (e) => {
    settings.overlayActive = e.target.checked;
    document.getElementById('overlayControls').style.display = settings.overlayActive ? 'block' : 'none';
    updatePreview();
  };
  document.getElementById('overlayColor').oninput = (e) => {
    settings.overlayColor = e.target.value;
    updatePreview();
  };
  document.getElementById('overlayOpacity').oninput = (e) => {
    settings.overlayOpacity = parseInt(e.target.value);
    document.getElementById('overlayOpVal').textContent = settings.overlayOpacity + '%';
    updatePreview();
  };
  
  // Botones principales
  document.getElementById('applyToAllBtn').onclick = processAllImages;
  document.getElementById('downloadZipBtn').onclick = downloadZip;
  document.getElementById('clearImagesBtn').onclick = clearAllImages;
  
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
}

function setTextColor(color) {
  settings.textColor = color;
  document.getElementById('textColor').value = color;
  updatePreview();
}

function setTextBgColor(color) {
  settings.textBgColor = color;
  document.getElementById('textBgColor').value = color === 'transparent' ? '#000000' : color;
  updatePreview();
}

function setOverlayColor(color) {
  settings.overlayColor = color;
  document.getElementById('overlayColor').value = color;
  updatePreview();
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

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  
  const savedTheme = localStorage.getItem('mm-theme');
  savedTheme === 'dark' ? setTheme('dark') : setTheme('light');
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Logo por defecto de Media Mendoza
  const defaultLogo = new Image();
  defaultLogo.onload = () => {
    logoImg = defaultLogo;
    if (settings.logoActive) updatePreview();
  };
  defaultLogo.src = '../assets/logo.png';
});