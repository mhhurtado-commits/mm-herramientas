// ============================================================
// Visual Suite — Media Mendoza — App Principal
// ============================================================

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
  setTimeout(() => {
    if (tab === 'maps' && mapInstance) mapInstance.invalidateSize();
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

function exportarGrafico() {
  const canvas = document.getElementById('chartCanvas');
  if (!canvas) return toast('No hay gráfico para exportar');
  // Capturar a alta resolución forzando el canvas
  const ow = canvas.width;
  const oh = canvas.height;
  const scale = 4;
  canvas.width = ow * scale;
  canvas.height = oh * scale;
  canvas.style.width = ow + 'px';
  canvas.style.height = oh + 'px';
  if (chartInstance) {
    chartInstance.resize();
  }
  // Esperar render y capturar
  setTimeout(() => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      mostrarExportPreview(url, nombreBase);
      // Restaurar
      canvas.width = ow;
      canvas.height = oh;
      canvas.style.width = '';
      canvas.style.height = '';
      if (chartInstance) chartInstance.resize();
    }, 'image/png', 1);
  }, 200);
}

function exportarMapa() {
  const elemento = document.getElementById('mapContainer');
  if (!elemento) return toast('No hay mapa para exportar');
  const isDark = document.body.classList.contains('dark-theme');
  html2canvas(elemento, {
    scale: 4,
    backgroundColor: isDark ? '#161810' : '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true
  }).then(canvas => {
    canvas.toBlob(blob => {
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

function toggleLogo() {
  logoState.visible = !logoState.visible;
  document.getElementById('logoTrack').classList.toggle('on', logoState.visible);
  actualizarLogoOverlay();
  if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
}

function actualizarLogoOverlay() {
  if (!logoState.loaded) return;
  ['logoOverlayCharts', 'logoOverlayMaps', 'logoOverlayTimeline'].forEach(id => {
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
  ['logoOverlayCharts', 'logoOverlayMaps', 'logoOverlayTimeline'].forEach(id => {
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

function onLogoUp() {
  dragAction = null;
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
  cambiarTipoGrafico();

  // Maps
  if (typeof limpiarMarcadores === 'function') limpiarMarcadores();
  document.getElementById('mapSearchInput').value = '';
  document.getElementById('markerTitle').value = '';
  document.getElementById('markerDesc').value = '';

  // Timeline
  if (typeof limpiarTimeline === 'function') limpiarTimeline();

  // Infografia
  document.getElementById('infoTitle').value = 'Título de la infografía';
  document.getElementById('infoContent').value = 'Dato clave 1\nDato clave 2\nCifra relevante 3';
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
    for (const ev of result.timeline.eventos) {
      timelineEvents.push({
        date: ev.date || '2026-01-01',
        title: ev.title || 'Evento',
        desc: ev.desc || ''
      });
    }
    renderizarTimeline();
    toast(`📅 ${result.timeline.eventos.length} eventos agregados a la línea de tiempo`);
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
