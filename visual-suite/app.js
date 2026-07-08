// ============================================================
// Visual Suite — Media Mendoza — App Principal
// ============================================================

let tabActual = 'charts';

const logoState = window.logoState = {
  visible: true,
  x: 2,
  y: 2,
  w: 80,
  img: null,
  loaded: false
};

const LOGO_PATH = '../assets/logo-cuadrado.png';

// ── Tabs ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.vs-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      cambiarTab(target);
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
}

function actualizarLogoPosicion() {
  logoState.x = parseInt(document.getElementById('logoX').value);
  logoState.y = parseInt(document.getElementById('logoY').value);
  document.getElementById('logoXVal').textContent = logoState.x + '%';
  document.getElementById('logoYVal').textContent = logoState.y + '%';
  actualizarLogoOverlayHTML();
  if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
}

function actualizarLogoTamano() {
  logoState.w = parseInt(document.getElementById('logoW').value);
  document.getElementById('logoWVal').textContent = logoState.w + 'px';
  actualizarLogoOverlayHTML();
  if (tabActual === 'infographics' && typeof renderizarInfografia === 'function') renderizarInfografia();
}

function actualizarLogoOverlay() {
  actualizarLogoOverlayHTML();
}

function actualizarLogoOverlayHTML() {
  const overlayIds = ['logoOverlayCharts', 'logoOverlayMaps', 'logoOverlayTimeline'];
  overlayIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!logoState.loaded || !logoState.visible) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    el.style.left = logoState.x + '%';
    el.style.top = logoState.y + '%';
    el.style.width = logoState.w + 'px';
    el.style.height = 'auto';
    el.innerHTML = `<img src="${LOGO_PATH}" alt="Media Mendoza" draggable="false"><div class="logo-resize-handle"></div>`;
  });
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}

async function apiGet(path) {
  try {
    const res = await fetch(`${WORKER_URL}${path}`);
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}

// ── Init ──
function initApp() {
  initLogo();
}
