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
let dragActive = null;

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
  let elemento;
  const nombreBase = 'visual-media-mendoza';

  switch (tabActual) {
    case 'charts':
      elemento = document.getElementById('chartContainer');
      if (!elemento) return toast('No hay gráfico para exportar');
      break;
    case 'maps':
      elemento = document.getElementById('mapContainer');
      if (!elemento) return toast('No hay mapa para exportar');
      break;
    case 'timeline':
      elemento = document.getElementById('timelineContainer');
      if (!elemento) return toast('No hay timeline para exportar');
      break;
    case 'infographics':
      elemento = document.getElementById('infografiaArea');
      if (!elemento) return toast('No hay infografía para exportar');
      break;
    default: return;
  }

  html2canvas(elemento, {
    scale: 2,
    backgroundColor: getComputedStyle(document.body).getPropertyValue('--surface').trim() || '#ffffff',
    logging: false,
    useCORS: true
  }).then(canvas => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      mostrarExportPreview(url, nombreBase);
    }, 'image/png');
  }).catch(err => {
    console.error('Export error:', err);
    toast('Error al exportar');
  });
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
  const overlayIds = ['logoOverlayCharts', 'logoOverlayMaps', 'logoOverlayTimeline'];
  overlayIds.forEach(id => {
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

// ── Drag & Resize ──
document.addEventListener('mousedown', e => {
  const handle = e.target.closest('.logo-resize-handle');
  if (handle) {
    const overlay = handle.closest('.vs-logo-overlay');
    if (!overlay || overlay.style.display === 'none') return;
    e.preventDefault();
    dragActive = {
      type: 'resize',
      corner: handle.dataset.corner,
      overlay,
      startX: e.clientX,
      startY: e.clientY,
      startW: logoState.w,
      startXpos: logoState.x,
      startYpos: logoState.y,
      cw: overlay.parentElement.clientWidth,
      ch: overlay.parentElement.clientHeight
    };
    return;
  }
  const overlay = e.target.closest('.vs-logo-overlay');
  if (overlay && overlay.style.display !== 'none') {
    e.preventDefault();
    dragActive = { type: 'drag', overlay, startX: e.clientX, startY: e.clientY, startL: logoState.x, startT: logoState.y, cw: overlay.parentElement.clientWidth, ch: overlay.parentElement.clientHeight };
  }
});

document.addEventListener('mousemove', e => {
  if (!dragActive) return;
  const dx = e.clientX - dragActive.startX;
  const dy = e.clientY - dragActive.startY;
  if (dragActive.type === 'drag') {
    logoState.x = dragActive.startL + dx / dragActive.cw;
    logoState.y = dragActive.startT + dy / dragActive.ch;
    actualizarLogoOverlay();
    if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
  } else {
    const ar = logoState.ar;
    const minW = 0.03;
    const maxW = 0.9;
    const corner = dragActive.corner;
    let newW = dragActive.startW;
    let newX = dragActive.startXpos;
    let newY = dragActive.startYpos;
    if (corner === 'se') {
      newW = Math.max(minW, Math.min(maxW, dragActive.startW + dx / dragActive.cw));
    } else if (corner === 'sw') {
      newW = Math.max(minW, Math.min(maxW, dragActive.startW - dx / dragActive.cw));
      newX = dragActive.startXpos + (dragActive.startW - newW);
    } else if (corner === 'ne') {
      newW = Math.max(minW, Math.min(maxW, dragActive.startW + dx / dragActive.cw));
      newY = dragActive.startYpos + (dragActive.startW - newW) * ar;
    } else if (corner === 'nw') {
      newW = Math.max(minW, Math.min(maxW, dragActive.startW - dx / dragActive.cw));
      newX = dragActive.startXpos + (dragActive.startW - newW);
      newY = dragActive.startYpos + (dragActive.startW - newW) * ar;
    }
    logoState.w = newW;
    logoState.x = newX;
    logoState.y = newY;
    actualizarLogoOverlay();
    if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
  }
});

document.addEventListener('mouseup', () => { dragActive = null; });

document.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target) return;
  const handle = target.closest('.logo-resize-handle');
  if (handle) {
    const overlay = handle.closest('.vs-logo-overlay');
    if (!overlay || overlay.style.display === 'none') return;
    e.preventDefault();
    dragActive = {
      type: 'resize', corner: handle.dataset.corner, overlay,
      startX: touch.clientX, startY: touch.clientY,
      startW: logoState.w, startXpos: logoState.x, startYpos: logoState.y,
      cw: overlay.parentElement.clientWidth, ch: overlay.parentElement.clientHeight
    };
    return;
  }
  const overlay = target.closest('.vs-logo-overlay');
  if (overlay && overlay.style.display !== 'none') {
    e.preventDefault();
    dragActive = { type: 'drag', overlay, startX: touch.clientX, startY: touch.clientY, startL: logoState.x, startT: logoState.y, cw: overlay.parentElement.clientWidth, ch: overlay.parentElement.clientHeight };
  }
}, { passive: false });

document.addEventListener('touchmove', e => {
  if (!dragActive) return;
  e.preventDefault();
  const touch = e.touches[0];
  const dx = touch.clientX - dragActive.startX;
  const dy = touch.clientY - dragActive.startY;
  if (dragActive.type === 'drag') {
    logoState.x = dragActive.startL + dx / dragActive.cw;
    logoState.y = dragActive.startT + dy / dragActive.ch;
    actualizarLogoOverlay();
    if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
  } else {
    const ar = logoState.ar;
    const minW = 0.03;
    const maxW = 0.9;
    const corner = dragActive.corner;
    let newW = dragActive.startW;
    let newX = dragActive.startXpos;
    let newY = dragActive.startYpos;
    if (corner === 'se') {
      newW = Math.max(minW, Math.min(maxW, dragActive.startW + dx / dragActive.cw));
    } else if (corner === 'sw') {
      newW = Math.max(minW, Math.min(maxW, dragActive.startW - dx / dragActive.cw));
      newX = dragActive.startXpos + (dragActive.startW - newW);
    } else if (corner === 'ne') {
      newW = Math.max(minW, Math.min(maxW, dragActive.startW + dx / dragActive.cw));
      newY = dragActive.startYpos + (dragActive.startW - newW) * ar;
    } else if (corner === 'nw') {
      newW = Math.max(minW, Math.min(maxW, dragActive.startW - dx / dragActive.cw));
      newX = dragActive.startXpos + (dragActive.startW - newW);
      newY = dragActive.startYpos + (dragActive.startW - newW) * ar;
    }
    logoState.w = newW;
    logoState.x = newX;
    logoState.y = newY;
    actualizarLogoOverlay();
    if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
  }
}, { passive: false });

document.addEventListener('touchend', () => { dragActive = null; });

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

function initApp() {
  initLogo();
}
