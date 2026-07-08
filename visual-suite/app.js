// ============================================================
// Visual Suite — Media Mendoza — App Principal
// ============================================================

let tabActual = 'charts';

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
}

// ── Exportar visual activa ──
function exportarVisual() {
  let elemento;
  const nombreBase = 'visual-media-mendoza';

  switch (tabActual) {
    case 'charts':
      elemento = document.querySelector('.vs-chart-container canvas');
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
}
