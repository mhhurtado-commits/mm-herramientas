// ============================================================
// Visual Suite — Media Mendoza — App Principal
// ============================================================

// Valida que un string sea una fecha parseable (YYYY-MM-DD). Devuelve el
// string limpio o null si es inválido/vacío, para no inventar fechas.
function fechaValida(d) {
  if (!d || typeof d !== 'string') return null;
  const s = d.trim();
  if (!s) return null;
  const fecha = new Date(s + 'T12:00:00');
  if (isNaN(fecha.getTime())) return null;
  return s;
}

let tabActual = 'charts';

const logoState = window.logoState = {
  visible: true,
  x: 0.02,
  y: 0.02,
  w: 0.15,
  img: null,
  loaded: false,
  ar: 1
};

const LOGO_PATH = '../assets/logo.png';

// ── Fondo IA para placas híbridas (IA genera fondo editorial, canvas pinta datos) ──
const fondoIA = window.fondoIA = {
  img: null,         // Image object (cargado)
  dataUrl: null,     // data:image/jpeg;base64,...
  imgTempId: null,   // para refinado con /editar-imagen
  loading: false
};

// Genera un fondo editorial con IA usando /generar-imagen (estilo infografia, prompt negativo)
// No usa el modelo de Gemini de la suite; usa los motores de difusión (FLUX/SDXL/Pollinations).
async function generarFondoIA(titulo, contenido, onReady) {
  if (fondoIA.loading) return toast('Ya hay un fondo en generación…');
  if (!titulo) return toast('Faltan datos para generar el fondo');
  fondoIA.loading = true;
  try {
    const res = await fetch(`${WORKER_URL}/generar-imagen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: titulo,
        contenido: contenido || titulo,
        estilo: 'infografia',
        contexto_extra: 'Media Mendoza newspaper editorial background, professional, clean, no text'
      })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Error del generador');
    fondoIA.dataUrl = 'data:image/jpeg;base64,' + data.imagen;
    fondoIA.imgTempId = data.imgTempId || null;
    const img = new Image();
    img.onload = () => {
      fondoIA.img = img;
      fondoIA.loading = false;
      toast('✓ Fondo editorial generado');
      if (typeof onReady === 'function') onReady(img);
    };
    img.onerror = () => {
      fondoIA.loading = false;
      toast('Error al cargar la imagen generada');
    };
    img.src = fondoIA.dataUrl;
  } catch (err) {
    fondoIA.loading = false;
    toast('✗ ' + err.message);
  }
}

// Refinar el fondo IA existente con una instrucción (usa /editar-imagen del worker)
async function refinarFondoIA(instruccion, onReady) {
  if (!fondoIA.imgTempId) return toast('Generá un fondo primero');
  try {
    const res = await fetch(`${WORKER_URL}/editar-imagen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imgTempId: fondoIA.imgTempId, instruccion })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Error al refinar');
    fondoIA.dataUrl = 'data:image/jpeg;base64,' + data.imagen;
    fondoIA.imgTempId = data.imgTempId || fondoIA.imgTempId;
    const img = new Image();
    img.onload = () => {
      fondoIA.img = img;
      toast('✓ Fondo refinado');
      if (typeof onReady === 'function') onReady(img);
    };
    img.onerror = () => toast('Error al cargar el fondo refinado');
    img.src = fondoIA.dataUrl;
  } catch (err) {
    toast('✗ ' + err.message);
  }
}

// Limpia el fondo IA (vuelve al fondo por defecto del canvas)
function limpiarFondoIA() {
  fondoIA.img = null;
  fondoIA.dataUrl = null;
  fondoIA.imgTempId = null;
  fondoIA.loading = false;
}

// Dibuja el fondo IA en un canvas, con overlay para legibilidad.
// Devuelve true si dibujó algo, false si no hay fondo.
function dibujarFondoIA(ctx, W, H, overlayColor) {
  if (!fondoIA.img || !fondoIA.img.complete || !fondoIA.img.naturalWidth) return false;
  // Cover: llenar todo el canvas manteniendo aspect ratio
  const iw = fondoIA.img.naturalWidth, ih = fondoIA.img.naturalHeight;
  const scale = Math.max(W / iw, H / ih);
  const sw = iw * scale, sh = ih * scale;
  const sx = (W - sw) / 2, sy = (H - sh) / 2;
  ctx.drawImage(fondoIA.img, sx, sy, sw, sh);
  // Overlay semitransparente para que el texto sea legible encima
  ctx.fillStyle = overlayColor || 'rgba(255,255,255,0.78)';
  ctx.fillRect(0, 0, W, H);
  return true;
}

// ── Tabs ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.vs-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      cambiarTab(tab.dataset.tab);
    });
  });
  initApp();
});

function cambiarTab(tab) {
  tabActual = tab;
  document.querySelectorAll('.vs-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.vs-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));
  actualizarLogoOverlay();
  if (tab === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
  if (tab === 'editor' && typeof renderEditor === 'function') {
    if (!window.pubState || !window.pubState.secciones.length) generarBasePublicacion();
    renderEditor();
  }
  setTimeout(() => {
    if (tab === 'maps' && mapInstance) mapInstance.invalidateSize();
    if (tab === 'editor' && typeof renderEditor === 'function') renderEditor();
  }, 200);
}

// ── Exportar visual activa ──
function exportarVisual() {
  const nombreBase = 'visual-media-mendoza';

  switch (tabActual) {
    case 'charts':
      exportarGrafico();
      break;
    case 'maps':
      exportarMapa();
      break;
    case 'timeline':
      exportarTimeline();
      break;
    case 'infographics':
      exportarInfografia();
      break;
  }
}

async function exportarGrafico() {
  const nombreBase = 'visual-media-mendoza';
  const src = document.getElementById('chartCanvas');
  if (!src) return toast('No hay gráfico para exportar');
  if (!chartInstance) return toast('No hay gráfico para exportar');
  await document.fonts.ready;

  // Capturar el gráfico ya renderizado (evita pelear con el resize responsivo)
  const dataURL = chartInstance.toBase64Image();
  if (!dataURL) return toast('Error al exportar gráfico');

  const img = new Image();
  img.onload = () => {
    const cw = img.naturalWidth, ch = img.naturalHeight;
    if (!cw || !ch) { toast('Error al exportar gráfico'); return; }
    // ── Marco editorial de la placa (colores solo de la placa) ──
    const M = Math.round(cw * 0.06);
    const headerH = Math.round(ch * 0.18);
    const footerH = Math.round(ch * 0.12);
    const frame = document.createElement('canvas');
    frame.width = cw + M * 2;
    frame.height = ch + headerH + footerH;
    const ctx = frame.getContext('2d');

    // Fondo: IA editorial o papel por defecto
    if (!dibujarFondoIA(ctx, frame.width, frame.height, 'rgba(255,255,255,0.85)')) {
      const g = ctx.createLinearGradient(0, 0, 0, frame.height);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#f3f5f2');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, frame.width, frame.height);
    }

    // Header tinta + regla dorada
    ctx.fillStyle = '#16201b';
    ctx.fillRect(0, 0, frame.width, headerH);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(0, headerH - 6, frame.width, 6);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c9a227';
    ctx.font = `700 ${headerH * 0.13}px "Inter", sans-serif`;
    ctx.fillText('MEDIA MENDOZA · DATOS', M, headerH * 0.36);
    const tEl = document.getElementById('chartTitle');
    const title = (tEl && tEl.value) ? tEl.value : 'Gráfico';
    ctx.fillStyle = '#ffffff';
    ctx.font = `400 ${headerH * 0.5}px "DM Serif Display", serif`;
    let t = title;
    while (ctx.measureText(t).width > frame.width - 2 * M && t.length > 4) t = t.slice(0, -1);
    if (t.length < title.length) t = t.slice(0, -1) + '…';
    ctx.fillText(t, M, headerH * 0.84);

    // Gráfico
    ctx.drawImage(img, M, headerH + M * 0.5, cw, ch);

    // Footer
    const fy = frame.height - footerH * 0.4;
    ctx.strokeStyle = 'rgba(22,32,27,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, fy - footerH * 0.18);
    ctx.lineTo(frame.width - M, fy - footerH * 0.18);
    ctx.stroke();
    ctx.fillStyle = '#5b665f';
    ctx.font = `600 ${footerH * 0.18}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('MEDIA MENDOZA · mmherramientas.media', M, fy);
    ctx.textAlign = 'right';
    ctx.fillText('Generado con Visual Suite', frame.width - M, fy);

    // Logo de marca
    if (typeof dibujarLogo === 'function') dibujarLogo(ctx, frame.width, frame.height);

    frame.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      mostrarExportPreview(url, nombreBase);
    }, 'image/png', 1);
  };
  img.onerror = () => toast('Error al exportar gráfico');
  img.src = dataURL;
}

function exportarMapa() {
  const nombreBase = 'visual-media-mendoza';
  const elemento = document.getElementById('mapContainer');
  if (!elemento) return toast('No hay mapa para exportar');
  const isDark = document.body.classList.contains('dark-theme');
  html2canvas(elemento, {
    scale: 4,
    backgroundColor: isDark ? '#161810' : '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true
  }).then(mapCanvas => {
    // ── Marco editorial de la placa (colores solo de la placa) ──
    const M = Math.round(mapCanvas.width * 0.04);
    const headerH = Math.round(mapCanvas.height * 0.16);
    const footerH = Math.round(mapCanvas.height * 0.10);
    const frame = document.createElement('canvas');
    frame.width = mapCanvas.width + M * 2;
    frame.height = mapCanvas.height + headerH + footerH;
    const ctx = frame.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, frame.height);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#f3f5f2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, frame.width, frame.height);

    // Header tinta + regla dorada
    ctx.fillStyle = '#16201b';
    ctx.fillRect(0, 0, frame.width, headerH);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(0, headerH - 6, frame.width, 6);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c9a227';
    ctx.font = `700 ${headerH * 0.13}px "Inter", sans-serif`;
    ctx.fillText('MEDIA MENDOZA · MAPA', M, headerH * 0.36);
    ctx.fillStyle = '#ffffff';
    ctx.font = `400 ${headerH * 0.5}px "DM Serif Display", serif`;
    let mt = 'Mapa interactivo';
    while (ctx.measureText(mt).width > frame.width - 2 * M && mt.length > 4) mt = mt.slice(0, -1);
    ctx.fillText(mt, M, headerH * 0.84);

    // Mapa
    ctx.drawImage(mapCanvas, M, headerH + M * 0.5, mapCanvas.width, mapCanvas.height);

    // Footer
    const fy = frame.height - footerH * 0.4;
    ctx.strokeStyle = 'rgba(22,32,27,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, fy - footerH * 0.18);
    ctx.lineTo(frame.width - M, fy - footerH * 0.18);
    ctx.stroke();
    ctx.fillStyle = '#5b665f';
    ctx.font = `600 ${footerH * 0.18}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('MEDIA MENDOZA · mmherramientas.media', M, fy);
    ctx.textAlign = 'right';
    ctx.fillText('Generado con Visual Suite', frame.width - M, fy);

    // Logo de marca
    if (typeof dibujarLogo === 'function') dibujarLogo(ctx, frame.width, frame.height);

    frame.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      mostrarExportPreview(url, nombreBase);
    });
  }).catch(() => toast('Error al exportar mapa'));
}

function exportarTimeline() {
  exportarTimelineComoFlyer();
}

function mostrarExportPreview(url, nombre) {
  const area = document.getElementById('exportPreview');
  document.getElementById('exportPreviewImg').src = url;
  const link = document.getElementById('exportDownloadLink');
  link.href = url;
  link.download = `${nombre}-${Date.now()}.png`;
  area.classList.add('show');
}

function cerrarExportPreview() {
  document.getElementById('exportPreview').classList.remove('show');
}

// ── Logo ──
function initLogo() {
  logoState.img = new Image();
  logoState.img.crossOrigin = 'anonymous';
  logoState.img.onload = () => {
    logoState.ar = logoState.img.naturalHeight / logoState.img.naturalWidth;
    logoState.loaded = true;
    actualizarLogoOverlay();
    initLogoDrag();
    if (typeof renderizarInfografia === 'function') renderizarInfografia();
  };
  logoState.img.src = LOGO_PATH;
}

// Pinta el logo sobre un canvas de exportación (charts, timeline), respetando
// visibilidad, posición (x,y), ancho (w) y relación de aspecto (ar).
function dibujarLogo(ctx, W, H) {
  const ls = window.logoState;
  if (!ls || !ls.loaded || !ls.visible || !ls.img) return;
  const lw = ls.w * W;
  const lh = lw * (ls.ar || (ls.img.naturalHeight / ls.img.naturalWidth));
  ctx.drawImage(ls.img, ls.x * W, ls.y * H, lw, lh);
}

function toggleLogo() {
  logoState.visible = !logoState.visible;
  document.getElementById('logoTrack').classList.toggle('on', logoState.visible);
  actualizarLogoOverlay();
  if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
}

function actualizarLogoOverlay() {
  if (!logoState.loaded) return;
  ['logoOverlayCharts', 'logoOverlayMaps', 'logoOverlayTimeline', 'logoOverlayInfografia'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!logoState.visible) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.left = (logoState.x * 100) + '%';
    el.style.top = (logoState.y * 100) + '%';
    el.style.width = (logoState.w * 100) + '%';
    el.style.height = 'auto';
    el.innerHTML = `<img src="${LOGO_PATH}" alt="Media Mendoza" draggable="false">
<div class="logo-resize-handle corner-nw" data-corner="nw"></div>
<div class="logo-resize-handle corner-ne" data-corner="ne"></div>
<div class="logo-resize-handle corner-sw" data-corner="sw"></div>
<div class="logo-resize-handle corner-se" data-corner="se"></div>`;
  });
}

// ── Drag & Resize directo sobre el logo overlay (estilo placas) ──
function initLogoDrag() {
  ['logoOverlayCharts', 'logoOverlayMaps', 'logoOverlayTimeline', 'logoOverlayInfografia'].forEach(id => {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.addEventListener('mousedown', onLogoDown);
    overlay.addEventListener('touchstart', onLogoDown, { passive: false });
  });
}

let dragAction = null;

function onLogoDown(e) {
  const target = e.target;
  const handle = target.closest('.logo-resize-handle');
  const rect = this.parentElement.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  e.stopPropagation();
  e.preventDefault();

  if (handle) {
    dragAction = {
      type: 'resize',
      corner: handle.dataset.corner,
      startX: clientX,
      startY: clientY,
      startW: logoState.w,
      startXpos: logoState.x,
      startYpos: logoState.y,
      rect
    };
  } else {
    dragAction = {
      type: 'drag',
      startX: clientX,
      startY: clientY,
      startL: logoState.x,
      startT: logoState.y,
      rect
    };
  }

  mostrarGuiasCentrado(this.parentElement);

  document.addEventListener('mousemove', onLogoMove);
  document.addEventListener('mouseup', onLogoUp);
  document.addEventListener('touchmove', onLogoMove, { passive: false });
  document.addEventListener('touchend', onLogoUp);
}

function onLogoMove(e) {
  if (!dragAction) return;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const dx = clientX - dragAction.startX;
  const dy = clientY - dragAction.startY;

  if (dragAction.type === 'drag') {
    logoState.x = Math.max(0, Math.min(1 - logoState.w, dragAction.startL + dx / dragAction.rect.width));
    logoState.y = Math.max(0, Math.min(1 - logoState.w * logoState.ar, dragAction.startT + dy / dragAction.rect.height));
    actualizarLogoOverlay();
    if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
  } else {
    const corner = dragAction.corner;
    const minW = 0.03;
    const maxW = 0.9;
    let newW = dragAction.startW;
    let newX = dragAction.startXpos;
    let newY = dragAction.startYpos;

    if (corner === 'se') {
      newW = Math.max(minW, Math.min(maxW, dragAction.startW + dx / dragAction.rect.width));
    } else if (corner === 'sw') {
      newW = Math.max(minW, Math.min(maxW, dragAction.startW - dx / dragAction.rect.width));
      newX = dragAction.startXpos + (dragAction.startW - newW);
    } else if (corner === 'ne') {
      newW = Math.max(minW, Math.min(maxW, dragAction.startW + dx / dragAction.rect.width));
      newY = dragAction.startYpos + (dragAction.startW - newW) * logoState.ar;
    } else if (corner === 'nw') {
      newW = Math.max(minW, Math.min(maxW, dragAction.startW - dx / dragAction.rect.width));
      newX = dragAction.startXpos + (dragAction.startW - newW);
      newY = dragAction.startYpos + (dragAction.startW - newW) * logoState.ar;
    }
    logoState.w = newW;
    logoState.x = newX;
    logoState.y = newY;
    actualizarLogoOverlay();
    if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
  }

  if (e.touches) e.preventDefault();
}

// ── Center guides for logo alignment ──
function mostrarGuiasCentrado(container) {
  ocultarGuiasCentrado();
  ['vs-guide-h', 'vs-guide-v'].forEach(id => {
    const el = document.createElement('div');
    el.id = id;
    container.appendChild(el);
  });
  const h = document.getElementById('vs-guide-h');
  const v = document.getElementById('vs-guide-v');
  const rect = container.getBoundingClientRect();
  Object.assign(h.style, {
    position: 'absolute', left: '0', right: '0', top: '50%', height: '1px',
    background: 'rgba(166,206,57,0.5)', borderTop: '1px dashed rgba(166,206,57,0.3)',
    zIndex: '999', pointerEvents: 'none'
  });
  Object.assign(v.style, {
    position: 'absolute', top: '0', bottom: '0', left: '50%', width: '1px',
    background: 'rgba(166,206,57,0.5)', borderLeft: '1px dashed rgba(166,206,57,0.3)',
    zIndex: '999', pointerEvents: 'none'
  });
}

function ocultarGuiasCentrado() {
  ['vs-guide-h', 'vs-guide-v'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

function onLogoUp() {
  dragAction = null;
  ocultarGuiasCentrado();
  document.removeEventListener('mousemove', onLogoMove);
  document.removeEventListener('mouseup', onLogoUp);
  document.removeEventListener('touchmove', onLogoMove);
  document.removeEventListener('touchend', onLogoUp);
}

// ── Toast ──
function toast(msg) {
  const existing = document.querySelector('.vs-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'vs-toast';
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
    background: 'var(--text)', color: 'var(--bg)', padding: '10px 20px',
    borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    zIndex: '9999', boxShadow: '0 4px 12px rgba(0,0,0,.2)',
    transition: 'opacity .2s, transform .2s'
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 200);
  }, 2500);
}

// ── Worker API helper ──
const WORKER_URL = 'https://mm-herramientas-worker.mhhurtado.workers.dev';

async function apiPost(path, data) {
  try {
    const res = await fetch(`${WORKER_URL}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (e) { return null; }
}

async function apiGet(path) {
  try {
    const res = await fetch(`${WORKER_URL}${path}`);
    return await res.json();
  } catch (e) { return null; }
}

// ── Limpiar todo ──
function limpiarTodo() {
  if (!confirm('¿Limpiar todos los módulos? Se borrarán los datos de gráficos, mapa, timeline e infografía.')) return;

  // URL
  document.getElementById('urlInput').value = '';

  // Charts
  document.getElementById('chartData').value = 'Enero, 45\nFebrero, 62\nMarzo, 38\nAbril, 55\nMayo, 70';
  document.getElementById('chartTitle').value = 'Título del gráfico';
  document.getElementById('chartType').value = 'bar';
  document.getElementById('chartTema').value = '';
  document.getElementById('chartPrompt').value = '';
  document.getElementById('chartJson').value = '';
  cambiarTipoGrafico();

  // Maps
  if (typeof limpiarMarcadores === 'function') limpiarMarcadores();
  document.getElementById('mapSearchInput').value = '';
  document.getElementById('markerTitle').value = '';
  document.getElementById('markerDesc').value = '';

  // Timeline
  if (typeof limpiarTimeline === 'function') limpiarTimeline();
  document.getElementById('tlTema').value = '';
  document.getElementById('tlPrompt').value = '';
  document.getElementById('tlJson').value = '';

  // Infografia
  document.getElementById('infoTitle').value = 'Título de la infografía';
  document.getElementById('infoContent').value = 'Dato clave 1\nDato clave 2\nCifra relevante 3';
  document.getElementById('infoTema').value = '';
  document.getElementById('infoPrompt').value = '';
  document.getElementById('infoJson').value = '';
  seleccionarTemplate('destacado');
  renderizarInfografia();

  toast('🗑 Todos los módulos limpiados');
}

// ── Extraer todo desde una URL ──
async function extraerDeUrl() {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) return toast('Pegá un link de un artículo');

  const btn = document.getElementById('btnExtraerUrl');
  btn.disabled = true;
  btn.textContent = '⏳ Extrayendo...';

  const result = await apiPost('/visual/extraer', { url });

  btn.disabled = false;
  btn.textContent = '🔍 Extraer de URL';

  if (!result || !result.ok) {
    return toast(result?.error || 'Error al extraer');
  }

  toast('Datos extraídos. Revisá cada solapa para editar.');

  // ── CHARTS ──
  if (result.chart && result.chart.datos && result.chart.datos.length > 0) {
    const lines = result.chart.datos.map(d => `${d.label}, ${d.value}`).join('\n');
    document.getElementById('chartData').value = lines;
    if (result.chart.titulo) document.getElementById('chartTitle').value = result.chart.titulo;
    if (result.chart.tipo && ['bar','line','pie','doughnut','radar','polarArea'].includes(result.chart.tipo)) {
      document.getElementById('chartType').value = result.chart.tipo;
      cambiarTipoGrafico();
    }
    actualizarGrafico();
  }

  // ── MAPA ──
  if (result.mapa && result.mapa.lugares && result.mapa.lugares.length > 0) {
    limpiarMarcadores();
    for (const lugar of result.mapa.lugares) {
      if (lugar.direccion) {
        document.getElementById('mapSearchInput').value = lugar.direccion + ', Mendoza, Argentina';
        // No geocodificamos automáticamente para evitar rate limits, el usuario puede buscar
      }
      if (lugar.nombre) {
        document.getElementById('markerTitle').value = lugar.nombre;
        document.getElementById('markerDesc').value = lugar.descripcion || '';
      }
    }
    toast(`📍 ${result.mapa.lugares.length} lugar(es) detectado(s). Usá "Buscar ubicación" en la solapa Mapas.`);
  }

  // ── TIMELINE ──
  if (result.timeline && result.timeline.eventos && result.timeline.eventos.length > 0) {
    let count = 0;
    for (const ev of result.timeline.eventos) {
      const d = fechaValida(ev.date);
      if (!d) continue; // omitir eventos con fecha inválida
      timelineEvents.push({ date: d, title: ev.title || 'Evento', desc: ev.desc || '' });
      count++;
    }
    renderizarTimeline();
    if (count > 0) toast(`📅 ${count} eventos agregados a la línea de tiempo`);
  }

  // ── INFOGRAFÍA ──
  if (result.infografia) {
    if (result.infografia.titulo) document.getElementById('infoTitle').value = result.infografia.titulo;
    if (result.infografia.lineas && result.infografia.lineas.length > 0) {
      document.getElementById('infoContent').value = result.infografia.lineas.join('\n');
    }
    seleccionarTemplate('destacado');
    renderizarInfografia();
    toast(`🎨 Datos cargados en infografía`);
  }
}

function initApp() {
  initLogo();
  // Enter en URL input
  document.getElementById('urlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') extraerDeUrl();
  });
}
