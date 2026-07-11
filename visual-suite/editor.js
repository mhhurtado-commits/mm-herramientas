// ============================================================
// Editor de Mini-Web "Publicación" (diseñable)
// Base automática + editor ligero (mover/redimensionar/agregar
// íconos, ilustraciones, texto y formas) sobre chart/mapa/
// timeline/infografía. Exporta una mini web HTML autónoma.
// Reutiliza recogerDatos(), buildTimeline/buildInfografia(),
// headComun/navYHero/footerComun, PAGE_CSS, INIT_JS de publicacion.js.
// ============================================================

let pubState = null;        // window.pubState — documento editable
let pubBloqueSel = null;    // id del bloque overlay seleccionado
let pubCharts = [];         // Chart.js instanciados en el stage
let pubMaps = [];           // Leaflet instanciados en el stage
let bloqueDrag = null;

/* ---------- Identidad / estado ---------- */
function pubUid() {
  return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function initPubState() {
  if (pubState) return pubState;
  pubState = window.pubState = {
    titulo: 'Publicación Media Mendoza',
    logo: (typeof getLogoDataUri === 'function') ? getLogoDataUri() : '',
    generado: new Date().toISOString(),
    secciones: [],   // {id, tipo, visible, datos, estilo}
    bloques: []      // {id, tipo, x, y, w, h, z, contenido, ...}
  };
  return pubState;
}

/* ---------- Base automática desde los datos actuales ---------- */
function generarBasePublicacion() {
  initPubState();
  const D = (typeof recogerDatos === 'function') ? recogerDatos() : null;
  if (!D) { toast('No hay datos para generar la base'); return false; }
  pubState.titulo = D.titulo || pubState.titulo;
  pubState.logo = D.logo || pubState.logo;
  pubState.generado = new Date().toISOString();
  pubState.secciones = [];
  if (D.chart) pubState.secciones.push({ id: 'sec-chart', tipo: 'chart', visible: true, datos: D.chart, estilo: {} });
  if (D.mapa && D.mapa.length) pubState.secciones.push({ id: 'sec-map', tipo: 'map', visible: true, datos: { mapa: D.mapa }, estilo: {} });
  if (D.timeline && D.timeline.length) pubState.secciones.push({ id: 'sec-timeline', tipo: 'timeline', visible: true, datos: { timeline: D.timeline }, estilo: {} });
  if (D.infografia && D.infografia.lineas && D.infografia.lineas.length) pubState.secciones.push({ id: 'sec-info', tipo: 'infografia', visible: true, datos: D.infografia, estilo: {} });
  if (!pubState.secciones.length) { toast('No hay datos para generar la base. Creá un gráfico, mapa, cronología o infografía.'); return false; }
  return true;
}

function abrirEditor() {
  if (!generarBasePublicacion()) return;
  if (typeof cambiarTab === 'function') cambiarTab('editor');
  renderEditor();
}

/* ---------- Render del Stage ---------- */
function renderEditor() {
  initPubState();
  renderIconGallery();
  const stage = document.getElementById('pubStage');
  if (!stage) return;

  // Limpiar widgets previos para no acumular instancias
  (pubCharts || []).forEach(c => { try { c.destroy(); } catch (e) {} });
  (pubMaps || []).forEach(m => { try { m.remove(); } catch (e) {} });
  pubCharts = []; pubMaps = [];

  stage.innerHTML = '';
  pubState.secciones.forEach(sec => {
    const wrap = document.createElement('div');
    wrap.className = 'pub-sec';
    wrap.dataset.id = sec.id;
    if (!sec.visible) wrap.style.display = 'none';
    stage.appendChild(wrap);
    renderSeccionEnStage(sec, wrap);
  });
  pubState.bloques.forEach(b => stage.appendChild(renderBloque(b)));
  actualizarInspector();
}

function renderSeccionEnStage(sec, wrap) {
  if (sec.tipo === 'chart') return initStageChart(sec, wrap);
  if (sec.tipo === 'map') return initStageMap(sec, wrap);
  if (sec.tipo === 'timeline') { wrap.innerHTML = timelineHTMLApp(sec.datos.timeline || []); return; }
  if (sec.tipo === 'infografia') { wrap.innerHTML = infografiaHTMLApp(sec.datos || {}); return; }
}

function initStageChart(sec, wrap) {
  const box = document.createElement('div');
  box.style.cssText = 'position:relative;height:360px;background:var(--paper2);border:1px solid var(--line2);border-radius:12px;padding:16px';
  const cv = document.createElement('canvas');
  box.appendChild(cv);
  wrap.appendChild(box);
  const d = sec.datos || {};
  const type = d.tipo || 'bar';
  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, title: { display: false } },
    animation: { duration: 400 }
  };
  if (type === 'bar' || type === 'line') {
    opts.scales = {
      x: { grid: { color: 'rgba(0,0,0,.06)' } },
      y: { grid: { color: 'rgba(0,0,0,.06)' }, beginAtZero: true }
    };
  }
  let chart = null;
  try {
    chart = new Chart(cv, {
      type: type,
      data: {
        labels: d.labels || [],
        datasets: (d.datasets || []).map(ds => ({
          label: ds.label, data: ds.data,
          backgroundColor: ds.backgroundColor, borderColor: ds.borderColor,
          borderWidth: ds.borderWidth, fill: ds.fill, tension: 0.3,
          pointBackgroundColor: '#a6ce39', pointBorderColor: '#fff', pointRadius: 3
        }))
      },
      options: opts
    });
  } catch (err) {
    console.error('No se pudo crear el gráfico en el editor:', err);
  }
  if (chart) pubCharts.push(chart);
}

function initStageMap(sec, wrap) {
  const div = document.createElement('div');
  div.style.cssText = 'height:420px;border-radius:12px;overflow:hidden;border:1px solid var(--line2)';
  wrap.appendChild(div);
  const map = L.map(div, { scrollWheelZoom: false }).setView([-34.6, -68.3], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  const pts = [];
  (sec.datos.mapa || []).forEach(m => {
    const lat = parseFloat(m.lat), lng = parseFloat(m.lng);
    if (isNaN(lat) || isNaN(lng)) return;
    const mk = L.marker([lat, lng]).addTo(map);
    mk.bindPopup('<strong>' + (m.title || '') + '</strong><br>' + (m.desc || ''));
    pts.push([lat, lng]);
  });
  if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
  pubMaps.push(map);
  setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 200);
}

// Vista previa con estilos de la APP (la export usa el CSS pulido de la mini web)
function timelineHTMLApp(events) {
  const items = events.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).map(e => {
    const d = (typeof formatearFecha === 'function') ? formatearFecha(e.date, true) : e.date;
    return '<div class="vs-timeline-item"><div class="vs-timeline-dot"></div>'
      + '<div class="vs-timeline-date">' + escapeHtml(d) + '</div>'
      + '<div class="vs-timeline-title">' + escapeHtml(e.title || '') + '</div>'
      + '<div class="vs-timeline-desc">' + escapeHtml(e.desc || '') + '</div></div>';
  }).join('');
  return '<div class="vs-timeline-container"><div class="vs-timeline-line"></div><div style="position:relative">' + items + '</div></div>';
}

function infografiaHTMLApp(info) {
  const lines = (info.lineas || []).filter(Boolean);
  const cards = lines.map(ln => {
    const s = (typeof splitLinea === 'function') ? splitLinea(ln) : { lbl: '', val: ln };
    return '<div class="vs-card"><div class="vs-label">' + escapeHtml(s.lbl) + '</div>'
      + '<div class="vs-card-title" style="font-family:var(--font-display)">' + escapeHtml(s.val) + '</div></div>';
  }).join('');
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">' + cards + '</div>';
}

/* ---------- Bloques overlay (íconos / ilustraciones / texto / formas) ---------- */
function renderBloque(b) {
  const el = document.createElement('div');
  el.className = 'pub-block pub-' + b.tipo;
  el.dataset.id = b.id;
  el.style.left = (b.x || 0) + '%';
  el.style.top = (b.y || 0) + '%';
  el.style.width = (b.w || 10) + '%';
  el.style.zIndex = b.z || 10;
  if (b.rot) el.style.transform = 'rotate(' + b.rot + 'deg)';

  if (b.tipo === 'icono') {
    el.innerHTML = b.contenido;
  } else if (b.tipo === 'ilustracion') {
    el.innerHTML = '<img src="' + b.contenido + '" style="width:100%;height:auto;display:block" draggable="false">';
  } else if (b.tipo === 'texto') {
    el.style.color = b.color || '#16201b';
    el.style.fontSize = (b.fontSize || 22) + 'px';
    el.style.fontWeight = b.bold ? '700' : '400';
    el.textContent = b.contenido || '';
    el.contentEditable = 'true';
    el.addEventListener('blur', () => { b.contenido = el.textContent; });
  } else if (b.tipo === 'forma') {
    el.style.background = b.color || '#a6ce39';
    el.style.height = (b.h || 30) + '%';
    el.style.borderRadius = (b.radio || 0) + 'px';
    el.style.opacity = (b.opacity != null) ? b.opacity : 1;
  }

  el.addEventListener('mousedown', onBloqueDown);
  el.addEventListener('touchstart', onBloqueDown, { passive: false });

  if (b.id === pubBloqueSel) {
    el.classList.add('selected');
    ['nw', 'ne', 'sw', 'se'].forEach(c => {
      const h = document.createElement('div');
      h.className = 'pub-resize-handle corner-' + c;
      h.dataset.corner = c;
      el.appendChild(h);
    });
  }
  return el;
}

function onBloqueDown(e) {
  const el = this;
  const id = el.dataset.id;
  pubBloqueSel = id;
  const b = pubState.bloques.find(x => x.id === id);
  if (!b) return;
  const stage = document.getElementById('pubStage');
  const rect = stage.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  e.stopPropagation();
  e.preventDefault();
  const handle = e.target.closest('.pub-resize-handle');
  if (handle) {
    bloqueDrag = { type: 'resize', corner: handle.dataset.corner, b, startX: clientX, startY: clientY, w0: b.w, h0: b.h || 30, rect, el };
  } else {
    bloqueDrag = { type: 'drag', b, startX: clientX, startY: clientY, x0: b.x, y0: b.y, rect, el };
  }
  document.addEventListener('mousemove', onBloqueMove);
  document.addEventListener('mouseup', onBloqueUp);
  document.addEventListener('touchmove', onBloqueMove, { passive: false });
  document.addEventListener('touchend', onBloqueUp);
  actualizarInspector();
}

function onBloqueMove(e) {
  if (!bloqueDrag) return;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const dx = clientX - bloqueDrag.startX;
  const dy = clientY - bloqueDrag.startY;
  const dw = (dx / bloqueDrag.rect.width) * 100;
  const dh = (dy / bloqueDrag.rect.height) * 100;

  if (bloqueDrag.type === 'drag') {
    const nx = Math.max(0, Math.min(92, bloqueDrag.x0 + dw));
    const ny = Math.max(0, Math.min(92, bloqueDrag.y0 + dh));
    bloqueDrag.b.x = nx; bloqueDrag.b.y = ny;
    bloqueDrag.el.style.left = nx + '%';
    bloqueDrag.el.style.top = ny + '%';
  } else {
    const c = bloqueDrag.corner;
    let nw = bloqueDrag.w0;
    if (c === 'se' || c === 'ne') nw = bloqueDrag.w0 + dw;
    if (c === 'sw' || c === 'nw') nw = bloqueDrag.w0 - dw;
    nw = Math.max(4, Math.min(92, nw));
    bloqueDrag.b.w = nw;
    bloqueDrag.el.style.width = nw + '%';
    if (bloqueDrag.b.tipo === 'forma' || bloqueDrag.b.tipo === 'texto') {
      let nh = Math.max(4, Math.min(92, bloqueDrag.h0 + dh));
      bloqueDrag.b.h = nh;
      bloqueDrag.el.style.height = nh + '%';
    }
  }
  if (e.touches) e.preventDefault();
}

function onBloqueUp() {
  bloqueDrag = null;
  document.removeEventListener('mousemove', onBloqueMove);
  document.removeEventListener('mouseup', onBloqueUp);
  document.removeEventListener('touchmove', onBloqueMove);
  document.removeEventListener('touchend', onBloqueUp);
  actualizarInspector();
}

/* ---------- Alta de bloques ---------- */
function addBloque(b) {
  initPubState();
  b.id = pubUid();
  b.z = b.z || (pubState.bloques.length + 10);
  pubState.bloques.push(b);
  pubBloqueSel = b.id;
  renderEditor();
}

function addIcono(glyph) {
  addBloque({ tipo: 'icono', x: 6, y: 6, w: 9, contenido: iconoSvg(glyph) });
}

function addTexto() {
  addBloque({ tipo: 'texto', x: 12, y: 12, w: 45, contenido: 'Texto destacado', color: '#16201b', fontSize: 24, bold: true });
}

function addForma(tipo) {
  addBloque({
    tipo: 'forma', x: 12, y: 12, w: 30, h: 30,
    color: tipo === 'circulo' ? '#a6ce39' : '#c9a227',
    radio: tipo === 'circulo' ? 50 : 12, opacity: 0.9
  });
}

function addIlustracionLocal() {
  if (!window.recursos || !recursos.generarIlustracionesPNG) { toast('No hay generador de ilustraciones'); return; }
  const D = (typeof recogerDatos === 'function') ? recogerDatos() : null;
  const pngs = recursos.generarIlustracionesPNG(D || { infografia: (pubState.secciones.find(s => s.tipo === 'infografia') || {}).datos }, '');
  if (!pngs || !pngs.length) { toast('No hay datos suficientes para ilustrar'); return; }
  addBloque({ tipo: 'ilustracion', x: 18, y: 18, w: 50, contenido: pngs[0].dataUrl });
}

async function addIlustracionIA() {
  const prompt = (document.getElementById('pubIAPrompt') || {}).value || '';
  if (!prompt) { toast('Escribí un prompt para la ilustración'); return; }
  toast('Generando ilustración con IA…');
  try {
    const r = await apiPost('/visual/ilustrar', { prompt });
    if (!r || !r.ok || !r.imagen) { toast(r && r.error ? r.error : 'No se pudo generar la ilustración'); return; }
    addBloque({ tipo: 'ilustracion', x: 18, y: 18, w: 50, contenido: r.imagen });
  } catch (err) {
    toast('Error al generar la ilustración');
  }
}

/* ---------- Inspector y orden de secciones ---------- */
function actualizarInspector() {
  const secs = document.getElementById('pubSections');
  if (secs) {
    const nombres = { chart: 'Gráfico', map: 'Mapa', timeline: 'Línea de tiempo', infografia: 'Infografía' };
    secs.innerHTML = (pubState ? pubState.secciones : []).map(s =>
      '<div class="pub-section-row"><input type="checkbox" ' + (s.visible ? 'checked' : '') + ' onchange="toggleSeccion(\'' + s.id + '\')">'
      + '<span class="nm">' + (nombres[s.tipo] || s.tipo) + '</span>'
      + '<button class="vs-btn vs-btn-secondary vs-btn-sm" onclick="reordenarSeccion(\'' + s.id + '\',-1)">↑</button>'
      + '<button class="vs-btn vs-btn-secondary vs-btn-sm" onclick="reordenarSeccion(\'' + s.id + '\',1)">↓</button></div>'
    ).join('');
  }

  const insp = document.getElementById('pubInspector');
  if (!insp) return;
  const b = pubState && pubBloqueSel ? pubState.bloques.find(x => x.id === pubBloqueSel) : null;
  if (!b) { insp.innerHTML = 'Seleccioná un elemento del lienzo para editarlo.'; return; }

  let html = '<div style="margin-bottom:8px"><b style="color:var(--text);text-transform:capitalize">' + b.tipo + '</b></div>';
  html += '<div class="vs-row" style="margin-bottom:8px">'
    + '<button class="vs-btn vs-btn-secondary vs-btn-sm" onclick="bloqueZ(' + (b.z + 1) + ')">⬆ Frente</button>'
    + '<button class="vs-btn vs-btn-secondary vs-btn-sm" onclick="bloqueZ(' + (b.z - 1) + ')">⬇ Atrás</button>'
    + '<button class="vs-btn vs-btn-danger vs-btn-sm" onclick="eliminarBloque()">🗑</button></div>';

  if (b.tipo === 'texto') {
    html += '<div class="vs-label">Color</div><input type="color" class="vs-color-input" value="' + (b.color || '#16201b') + '" oninput="editarBloque(\'color\',this.value)">';
    html += '<div class="vs-label" style="margin-top:6px">Tamaño</div><input type="number" class="vs-input" style="width:80px" value="' + (b.fontSize || 22) + '" oninput="editarBloque(\'fontSize\',+this.value)">';
    html += '<label class="vs-logo-toggle" style="margin-top:6px"><input type="checkbox" ' + (b.bold ? 'checked' : '') + ' onchange="editarBloque(\'bold\',this.checked)"> Negrita</label>';
  } else if (b.tipo === 'forma') {
    html += '<div class="vs-label">Color</div><input type="color" class="vs-color-input" value="' + (b.color || '#a6ce39') + '" oninput="editarBloque(\'color\',this.value)">';
    html += '<div class="vs-label" style="margin-top:6px">Opacidad</div><input type="range" min="0" max="1" step="0.05" value="' + (b.opacity != null ? b.opacity : 1) + '" oninput="editarBloque(\'opacity\',+this.value)">';
  }
  insp.innerHTML = html;
}

function toggleSeccion(id) {
  const s = pubState.secciones.find(x => x.id === id);
  if (s) { s.visible = !s.visible; renderEditor(); }
}

function reordenarSeccion(id, dir) {
  const i = pubState.secciones.findIndex(s => s.id === id);
  if (i < 0) return;
  const j = i + dir;
  if (j < 0 || j >= pubState.secciones.length) return;
  const tmp = pubState.secciones[i];
  pubState.secciones[i] = pubState.secciones[j];
  pubState.secciones[j] = tmp;
  renderEditor();
}

function bloqueZ(z) {
  const b = pubState.bloques.find(x => x.id === pubBloqueSel);
  if (b) { b.z = z; renderEditor(); }
}

function editarBloque(prop, val) {
  const b = pubState.bloques.find(x => x.id === pubBloqueSel);
  if (!b) return;
  b[prop] = val;
  const el = document.querySelector('.pub-block[data-id="' + b.id + '"]');
  if (el) {
    if (prop === 'color') { if (b.tipo === 'texto') el.style.color = val; else if (b.tipo === 'forma') el.style.background = val; }
    if (prop === 'fontSize') el.style.fontSize = val + 'px';
    if (prop === 'bold') el.style.fontWeight = val ? '700' : '400';
    if (prop === 'opacity') el.style.opacity = val;
  }
}

function eliminarBloque() {
  pubState.bloques = pubState.bloques.filter(x => x.id !== pubBloqueSel);
  pubBloqueSel = null;
  renderEditor();
}

/* ---------- Paleta de íconos ---------- */
const PUB_ICONOS = [
  { g: '📈', l: 'Economía' }, { g: '⚽', l: 'Deportes' }, { g: '🗳️', l: 'Política' }, { g: '👥', l: 'Sociedad' },
  { g: '🎭', l: 'Cultura' }, { g: '🔬', l: 'Ciencia' }, { g: '💡', l: 'Idea' }, { g: '📍', l: 'Ubicación' },
  { g: '📅', l: 'Fecha' }, { g: '🎨', l: 'Arte' }, { g: '⭐', l: 'Destacado' }, { g: '✅', l: 'Check' }
];

function iconoSvg(glyph, color) {
  color = color || '#a6ce39';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">'
    + '<circle cx="24" cy="24" r="22" fill="' + color + '"></circle>'
    + '<text x="24" y="33" text-anchor="middle" font-size="22" font-family="Inter,Arial,sans-serif" font-weight="700" fill="#16201b">' + escapeHtml(glyph) + '</text></svg>';
}

function renderIconGallery() {
  const g = document.getElementById('pubIconGallery');
  if (!g) return;
  g.innerHTML = PUB_ICONOS.map(ic => '<div class="pi" title="' + ic.l + '">' + iconoSvg(ic.g) + '</div>').join('');
  g.querySelectorAll('.pi').forEach((el, i) => el.addEventListener('click', () => addIcono(PUB_ICONOS[i].g)));
}

/* ---------- Export: mini web HTML autónoma ---------- */
function construirHTMLEditor(pub) {
  initPubState();
  const p = pub || pubState;
  const chartS = p.secciones.find(s => s.tipo === 'chart');
  const mapS = p.secciones.find(s => s.tipo === 'map');
  const tlS = p.secciones.find(s => s.tipo === 'timeline');
  const infoS = p.secciones.find(s => s.tipo === 'infografia');
  const D = {
    titulo: p.titulo,
    logo: p.logo,
    generado: p.generado,
    chart: (chartS && chartS.visible) ? chartS.datos : null,
    mapa: (mapS && mapS.visible) ? (mapS.datos.mapa || null) : null,
    timeline: (tlS && tlS.visible) ? (tlS.datos.timeline || null) : null,
    infografia: (infoS && infoS.visible) ? infoS.datos : null,
    bloques: p.bloques
  };
  const safeJson = JSON.stringify(D).replace(/</g, '\\u003c');

  let seccionesHTML = '';
  p.secciones.forEach(sec => { if (sec.visible) seccionesHTML += seccionEditorHTML(sec); });
  const bloquesHTML = (p.bloques || []).map(bloqueEditorHTML).join('');

  const extraCss = '\n.pub-stage{position:relative}\n.mmw-block{position:absolute}\n'
    + '.mmw-block.texto{font-family:"DM Serif Display",Georgia,serif;line-height:1.2}\n'
    + '.mmw-block.forma{box-shadow:0 8px 30px rgba(20,30,25,.08)}';

  return headComun(p.titulo)
    + '<style>' + extraCss + '</style>'
    + navYHero(D)
    + '<div class="pub-stage">' + seccionesHTML + bloquesHTML + '</div>'
    + footerComun(D)
    + '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"><\/script>'
    + '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>'
    + '<script>window.MM_DATA=' + safeJson + ';<\/script>'
    + '<script>' + INIT_JS + '<\/script>'
    + '</body></html>';
}

function seccionEditorHTML(sec) {
  if (sec.tipo === 'chart') {
    const d = sec.datos || {};
    return '<section class="mmw-sec" id="sec-chart"><div class="mmw-wrap">'
      + '<h2 class="mmw-reveal">' + escapeHtml(d.titulo || 'Gráfico') + '</h2>'
      + '<p class="sub mmw-reveal">Visualización interactiva de los datos.</p>'
      + '<div class="mmw-chart-box mmw-reveal"><div style="position:relative;height:380px"><canvas id="mmwChart"></canvas></div></div></div></section>';
  }
  if (sec.tipo === 'map') {
    return '<section class="mmw-sec" id="sec-map"><div class="mmw-wrap">'
      + '<h2 class="mmw-reveal">Mapa</h2>'
      + '<p class="sub mmw-reveal">Ubicaciones relacionadas con la nota.</p>'
      + '<div id="map" class="mmw-reveal"></div></div></section>';
  }
  if (sec.tipo === 'timeline') return buildTimeline(sec.datos.timeline);
  if (sec.tipo === 'infografia') return buildInfografia(sec.datos);
  return '';
}

function bloqueEditorHTML(b) {
  const style = 'left:' + (b.x || 0) + '%;top:' + (b.y || 0) + '%;width:' + (b.w || 10) + '%;z-index:' + (b.z || 10);
  if (b.tipo === 'icono') return '<div class="mmw-block mmw-block-icono" style="' + style + '">' + b.contenido + '</div>';
  if (b.tipo === 'ilustracion') return '<div class="mmw-block mmw-block-ilustracion" style="' + style + '"><img src="' + b.contenido + '" style="width:100%;height:auto;display:block"></div>';
  if (b.tipo === 'texto') return '<div class="mmw-block texto" style="' + style + ';color:' + (b.color || '#16201b') + ';font-size:' + (b.fontSize || 22) + 'px;font-weight:' + (b.bold ? '700' : '400') + '">' + escapeHtml(b.contenido || '') + '</div>';
  if (b.tipo === 'forma') return '<div class="mmw-block forma" style="' + style + ';height:' + (b.h || 30) + '%;background:' + (b.color || '#a6ce39') + ';border-radius:' + (b.radio || 0) + 'px;opacity:' + (b.opacity != null ? b.opacity : 1) + '"></div>';
  return '';
}

function exportarMiniWeb() {
  if (!pubState || !pubState.secciones.length) {
    if (!generarBasePublicacion()) return;
  }
  const html = construirHTMLEditor(pubState);
  window.ultimoWebHTML = html; // reutiliza la descarga del modal de publicación
  const modal = document.getElementById('webPreview');
  const frame = document.getElementById('webPreviewFrame');
  if (frame) frame.srcdoc = html;
  if (modal) modal.classList.add('show');
}

async function exportarEditorPNG() {
  const stage = document.getElementById('pubStage');
  if (!stage) return toast('No hay lienzo para exportar');
  await document.fonts.ready;
  if (typeof html2canvas !== 'function') return toast('html2canvas no disponible');
  html2canvas(stage, { scale: 2, backgroundColor: '#ffffff', useCORS: true, allowTaint: true })
    .then(canvas => {
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        mostrarExportPreview(url, 'publicacion-media-mendoza');
      });
    })
    .catch(() => toast('Error al exportar el PNG (el mapa interactivo puede no capturarse)'));
}
