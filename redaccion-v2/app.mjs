import {
  resolverApiBase, crearEstadoInicial, validarEntradaReformular,
  construirPayloadReformular, fuentesSeguras, mensajeError, etiquetaModelo,
  normalizarSalud, normalizarHashtags, serializarBorrador, deserializarBorrador, CLAVE_BORRADOR,
  imagenesSeguras, elegirPortada,
} from './logic.mjs';
import {
  escaparHtml, htmlTitulares, htmlFuentes, htmlNota,
  htmlNotaGuardada, htmlNoticiaMonitor, htmlPortada, htmlMiniaturas,
} from './render.mjs';

const API_OVERRIDE = new URLSearchParams(window.location.search).get('api');
const API = /^https?:\/\//i.test(API_OVERRIDE || '')
  ? API_OVERRIDE.replace(/\/+$/, '')
  : resolverApiBase(window.location);
const estado = crearEstadoInicial();

const $ = id => document.getElementById(id);

let modoActual = 'redactar';
let fuentes = [];
const fuentesActivas = new Set();
let noticiasCache = [];
let autoInterval = null;
let webSearchActivo = false;
let editorialActivo = false;
let notasGuardadasVisible = false;
let fuentesInicializadas = false;

function showToast(mensaje) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function copiarTexto(texto) {
  navigator.clipboard.writeText(texto)
    .then(() => showToast('✓ Copiado'))
    .catch(() => showToast('No se pudo copiar'));
}

async function api(ruta, opciones = {}) {
  const res = await fetch(API + ruta, opciones);
  const data = await res.json().catch(() => null);
  if (!data) throw new Error('respuesta_no_json');
  return data;
}

async function cargarSalud() {
  try {
    const salud = await api('/v2/redaccion/health');
    estado.salud = salud;
    const vista = normalizarSalud(salud);
    const txt = $('salud-txt');
    const dot = $('salud-dot');
    if (txt) txt.textContent = vista.texto;
    if (dot) dot.style.background = vista.estado === 'ok' ? 'var(--v)' : 'var(--red)';
    if (txt) txt.title = vista.detalle;
  } catch {
    const txt = $('salud-txt');
    if (txt) txt.textContent = 'Sin conexión';
  }
}

function switchTab(tab, el) {
  document.querySelectorAll('.red-tab-content').forEach(c => { c.style.display = 'none'; });
  document.querySelectorAll('.red-tab').forEach(b => b.classList.remove('active'));
  const panel = $('tab-' + tab);
  if (panel) panel.style.display = 'block';
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (tab === 'monitor') cargarFuentes();
  if (tab === 'config') cargarEditorial();
}

function switchSubtab(modo) {
  modoActual = modo;
  $('input-nota').style.display = modo === 'nota' ? 'block' : 'none';
  $('input-tema').style.display = modo === 'tema' ? 'block' : 'none';
  $('input-redactar').style.display = modo === 'redactar' ? 'block' : 'none';
  ['redactar', 'nota', 'tema'].forEach(m => $('subtab-' + m)?.classList.toggle('active', m === modo));
  const boton = $('btn-titulares-text');
  if (boton) boton.textContent = modo === 'redactar' ? 'Redactar nota' : 'Generar titulares';
}

function accionTitulares() {
  if (modoActual === 'redactar') return redactarNota();
  return generarTitulares(modoActual);
}

function setLoading(botonId, spinnerId, textoId, cargando, texto) {
  const boton = $(botonId);
  if (boton) boton.disabled = cargando;
  const spinner = $(spinnerId);
  if (spinner) spinner.style.display = cargando ? 'inline-block' : 'none';
  const txt = $(textoId);
  if (txt) txt.textContent = cargando ? 'Procesando…' : texto;
}

async function generarTitulares(modo = 'tema') {
  const contenido = modo === 'nota'
    ? ($('txt-nota')?.value.trim() || '')
    : ($('txt-tema')?.value.trim() || '');
  if (contenido.length < 20) return showToast('⚠ Escribí al menos 20 caracteres');
  const boton = $('btn-generar');
  boton.disabled = true;
  try {
    const data = await api('/v2/redaccion/titulares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modo,
        contenido,
        contexto: $('txt-contexto-t')?.value.trim() || '',
        tono: $('sel-tono')?.value || 'informativo',
        cantidad: Number($('sel-cantidad')?.value || 5),
      }),
    });
    if (!data.ok) throw new Error(data.error || 'error');
    estado.titulares = data.titulares || [];
    estado.angulos = data.angulos || [];
    $('results-titulares').innerHTML = htmlTitulares(estado.titulares, estado.angulos);
    const badge = $('badge-titulares');
    badge.textContent = `${estado.titulares.length} opciones`;
    badge.style.display = 'inline-block';
    const badgeModelo = $('badge-modelo-titulares');
    if (badgeModelo) {
      badgeModelo.textContent = etiquetaModelo(data);
      badgeModelo.style.display = data.modelo ? 'inline-block' : 'none';
    }
    $('btn-limpiar-t').style.display = 'inline-block';
  } catch (err) {
    showToast('✗ ' + mensajeError(err.message));
  } finally {
    boton.disabled = false;
  }
}

async function redactarNota() {
  const ideas = $('txt-redactar')?.value.trim() || '';
  if (ideas.length < 20) return showToast('⚠ Escribí tus ideas o un borrador');
  setLoading('btn-generar', 'spin-titulares', 'btn-titulares-text', true, 'Redactar nota');
  try {
    let fuentesRedactar = [];
    if (webSearchActivo) {
      try {
        const data = await api(`/v2/redaccion/fuentes?titulo=${encodeURIComponent(ideas.slice(0, 160))}`);
        fuentesRedactar = fuentesSeguras(data.fuentes || []);
      } catch { /* sigue sin fuentes */ }
    }
    const data = await api('/v2/redaccion/redactar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideas, fuentes: fuentesRedactar }),
    });
    if (!data.ok) throw new Error(data.error || 'error');
    estado.nota = {
      titular: data.titular,
      bajada: data.bajada,
      cuerpo: data.cuerpo,
      categoria: data.categoria_sugerida,
      hashtags: normalizarHashtags(data.hashtags),
      fuentes: data.fuentes || [],
      origen: null,
      modelo: data.modelo,
    };
    estado.fuentes = fuentesSeguras(data.fuentes || []);
    estado.modelo = data.modelo || '';
    estado.latenciaMs = data.latenciaMs || 0;
    $('results-titulares').innerHTML = htmlNota(estado.nota, { base: API })
      + `<div style="margin-top:10px">${htmlFuentes(estado.fuentes)}</div>`;
    const badge = $('badge-titulares');
    badge.textContent = 'Nota lista';
    badge.style.display = 'inline-block';
    const badgeModelo = $('badge-modelo-titulares');
    if (badgeModelo) {
      badgeModelo.textContent = etiquetaModelo(data);
      badgeModelo.style.display = 'inline-block';
    }
    $('btn-limpiar-t').style.display = 'inline-block';
    const seccionImagen = $('ref-imagen-section');
    if (seccionImagen) seccionImagen.style.display = 'block';
  } catch (err) {
    showToast('✗ ' + mensajeError(err.message));
  } finally {
    setLoading('btn-generar', 'spin-titulares', 'btn-titulares-text', false, 'Redactar nota');
  }
}

async function scrapearNota() {
  const url = $('ref-url-input')?.value.trim() || '';
  if (!/^https?:\/\//i.test(url)) return showToast('⚠ Ingresá una URL válida');
  const status = $('scrape-status');
  if (status) { status.className = 'verify-status'; status.textContent = ''; }
  setLoading('btn-scrape', 'spin-scrape', 'btn-scrape-text', true, 'Obtener nota');
  try {
    const data = await api('/v2/redaccion/scrape?url=' + encodeURIComponent(url));
    if (!data.ok) throw new Error(data.error || 'error');
    estado.titulo = data.titulo || '';
    estado.contenido = data.texto || '';
    estado.origen = {
      url: data.url,
      medio: data.medio,
      titulo: data.titulo,
      fecha: data.fecha,
      imagen: data.imagen || '',
      imagenes: imagenesSeguras([data.imagen, ...(data.imagenes || [])]),
    };
    estado.portadaEleccion = '';
    $('ref-titulo-input').value = estado.titulo;
    $('ref-cuerpo-input').value = estado.contenido;
    $('char-ref').textContent = `${estado.contenido.length} caracteres`;
    const badge = $('origen-badge');
    if (badge) {
      badge.textContent = `Origen: ${data.medio || 'medio desconocido'}`;
      badge.style.display = 'block';
    }
    await buscarFuentes(data.titulo, data.url);
    const seccionImagen = $('ref-imagen-section');
    if (seccionImagen) seccionImagen.style.display = 'block';
    switchImgTab('original');
    renderPortada();
    if (status) {
      status.className = 'verify-status ok';
      status.textContent = `✓ ${data.medio || 'Medio'} · ${estado.contenido.length} caracteres`;
    }
    showToast('✓ Nota obtenida');
  } catch (err) {
    if (status) { status.className = 'verify-status err'; status.textContent = '✗ ' + mensajeError(err.message); }
    showToast('✗ ' + mensajeError(err.message));
  } finally {
    setLoading('btn-scrape', 'spin-scrape', 'btn-scrape-text', false, 'Obtener nota');
  }
}

async function buscarFuentes(titulo, origenUrl) {
  try {
    const data = await api(`/v2/redaccion/fuentes?titulo=${encodeURIComponent(titulo || '')}&origenUrl=${encodeURIComponent(origenUrl || '')}`);
    estado.fuentes = fuentesSeguras(data.fuentes || []);
    const contenedor = $('fuentes-verificadas');
    if (contenedor) {
      contenedor.innerHTML = htmlFuentes(estado.fuentes);
      contenedor.style.display = estado.fuentes.length ? 'block' : 'none';
    }
    if (!estado.fuentes.length) showToast('⚠ Sin fuentes verificadas para esta nota');
  } catch {
    estado.fuentes = [];
  }
}

async function reformularNota() {
  const entrada = {
    titulo: $('ref-titulo-input')?.value.trim() || '',
    contenido: $('ref-cuerpo-input')?.value.trim() || '',
  };
  const validacion = validarEntradaReformular(entrada);
  if (!validacion.ok) return showToast('⚠ Completá título y cuerpo (mínimo 80 caracteres)');
  estado.titulo = entrada.titulo;
  estado.contenido = entrada.contenido;
  estado.contexto = $('txt-contexto-r')?.value.trim() || '';
  estado.estilo = $('ref-estilo')?.value || 'formal';
  if (!estado.origen?.url) {
    estado.origen = { url: $('ref-url-input')?.value.trim() || '', medio: '', titulo: entrada.titulo };
  }
  await asegurarImagenOriginal();
  const boton = $('btn-reformular');
  boton.disabled = true;
  setLoading('btn-reformular', 'spin-reformular', 'btn-reformular-text', true, 'Reformular para Media Mendoza');
  try {
    const data = await api('/v2/redaccion/reformular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(construirPayloadReformular(estado)),
    });
    if (!data.ok) throw new Error(data.error || 'error');
    estado.nota = {
      titular: data.titular,
      cuerpo: data.cuerpo,
      categoria: data.categoria_sugerida,
      hashtags: normalizarHashtags(data.hashtags),
      fuentes: data.fuentes || estado.fuentes,
      origen: data.origen || estado.origen,
      modelo: data.modelo,
    };
    estado.nota.portada = portadaActual();
    estado.nota.imagen = estado.nota.portada.url || '';
    estado.fuentes = fuentesSeguras(data.fuentes || []);
    estado.modelo = data.modelo || '';
    estado.latenciaMs = data.latenciaMs || 0;
    renderPortada();
    const contenedorFuentes = $('fuentes-verificadas');
    if (contenedorFuentes) {
      contenedorFuentes.innerHTML = htmlFuentes(estado.fuentes);
      contenedorFuentes.style.display = estado.fuentes.length ? 'block' : 'none';
    }
    const origenBadge = $('origen-badge');
    if (origenBadge) {
      origenBadge.textContent = estado.origen?.medio ? `Origen: ${estado.origen.medio}` : '';
      origenBadge.style.display = estado.origen?.medio ? 'block' : 'none';
    }
    const badge = $('badge-modelo-v2');
    if (badge) {
      badge.textContent = etiquetaModelo(data);
      badge.style.display = 'inline-block';
    }
    $('badge-reformulada').style.display = 'inline-block';
    $('btn-limpiar-r').style.display = 'inline-block';
    const seccionImagen = $('ref-imagen-section');
    if (seccionImagen) seccionImagen.style.display = 'block';
  } catch (err) {
    showToast('✗ ' + mensajeError(err.message));
  } finally {
    boton.disabled = false;
    setLoading('btn-reformular', 'spin-reformular', 'btn-reformular-text', false, 'Reformular para Media Mendoza');
  }
}

async function guardarNota() {
  if (!estado.nota) return showToast('⚠ No hay nota para guardar');
  const portada = portadaActual();
  estado.nota.portada = portada;
  // El índice de notas guarda la nota completa: una portada generada (base64)
  // engordaría el índice y puede pasar el límite de KV. Se guarda sólo si es una URL.
  estado.nota.imagen = /^data:/i.test(portada.url) ? '' : (portada.url || '');
  try {
    const data = await api('/v2/redaccion/notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(estado.nota),
    });
    if (!data.ok) throw new Error(data.error || 'error');
    showToast('✓ Nota guardada');
  } catch (err) {
    showToast('✗ ' + mensajeError(err.message));
  }
}

// ============================================================
// MONITOR
// ============================================================

async function cargarFuentes() {
  try {
    const data = await api('/fuentes');
    if (!data.ok) return;
    fuentes = data.fuentes || [];
    if (!fuentesInicializadas) {
      fuentes.forEach(f => fuentesActivas.add(f.id));
      fuentesInicializadas = true;
    }
    renderFuentes();
    actualizarFiltroFuentes();
  } catch {
    const lista = $('fuentes-list');
    if (lista) lista.innerHTML = '<span style="font-size:12px;color:var(--red)">Error cargando fuentes</span>';
  }
}

function renderFuentes() {
  const lista = $('fuentes-list');
  const count = $('fuentes-count');
  if (!lista) return;
  if (!fuentes.length) {
    lista.innerHTML = '<span style="font-size:12px;color:var(--dim)">Sin fuentes. Agregá una con el botón +</span>';
    if (count) count.textContent = '';
    return;
  }
  if (count) count.textContent = `${fuentes.length} fuente${fuentes.length === 1 ? '' : 's'}`;
  lista.innerHTML = fuentes.map(f => `
    <div class="fuente-row">
      <div style="flex:1;min-width:0">
        <div class="fuente-row-name">${escaparHtml(f.nombre)}</div>
        <div class="fuente-row-url">${escaparHtml(f.url)}</div>
      </div>
      <div class="fuente-row-actions">
        <button class="mm-btn mm-btn-sm" data-toggle-fuente="${escaparHtml(f.id)}">${fuentesActivas.has(f.id) ? 'Activa' : 'Inactiva'}</button>
        <button class="mm-btn mm-btn-sm mm-btn-danger" data-borrar-fuente="${escaparHtml(f.id)}">Eliminar</button>
      </div>
    </div>`).join('');
}

function actualizarFiltroFuentes() {
  const select = $('filter-fuente');
  if (!select) return;
  const actual = select.value;
  select.innerHTML = '<option value="">Todas las fuentes</option>'
    + fuentes.map(f => `<option value="${escaparHtml(f.id)}">${escaparHtml(f.nombre)}</option>`).join('');
  select.value = actual;
}

async function buscarNoticias() {
  const activas = fuentes.filter(f => fuentesActivas.has(f.id));
  if (!activas.length) return showToast('⚠ Activá al menos una fuente');
  const err = $('monitor-error');
  if (err) err.style.display = 'none';
  setLoading('btn-buscar', 'spin-monitor', 'btn-buscar-text', true, 'Buscar ahora');
  const resultados = [];
  const errores = [];
  await Promise.all(activas.map(async fuente => {
    try {
      const res = await fetch(`${API}/rss?url=${encodeURIComponent(fuente.url)}`);
      if (!res.ok) return errores.push(fuente.nombre);
      const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
      xml.querySelectorAll('item, entry').forEach(item => {
        const titulo = (item.querySelector('title')?.textContent || '').replace(/<[^>]*>/g, '').trim();
        const desc = (item.querySelector('description, summary, content')?.textContent || '').replace(/<[^>]*>/g, '').trim();
        const link = item.querySelector('link')?.textContent?.trim() || item.querySelector('link')?.getAttribute('href') || '';
        if (titulo) resultados.push({ fuente: fuente.id, nombre: fuente.nombre, clase: fuente.clase || 'custom', titulo, desc, link, pubDate: item.querySelector('pubDate, published, updated')?.textContent || '', cubierta: false });
      });
    } catch { errores.push(fuente.nombre); }
  }));
  resultados.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  noticiasCache = resultados;
  try {
    const cubiertas = await api('/cubiertas');
    if (cubiertas.ok && Array.isArray(cubiertas.links)) {
      const set = new Set(cubiertas.links);
      noticiasCache.forEach(n => { if (set.has(n.link)) n.cubierta = true; });
    }
  } catch { /* sin registro de cubiertas */ }
  if (errores.length && err) {
    err.style.display = 'block';
    err.textContent = `⚠ No se pudieron cargar: ${errores.join(', ')}`;
  }
  actualizarFiltroFuentes();
  aplicarFiltros();
  const info = $('monitor-update-info');
  if (info) {
    info.style.display = 'block';
    info.textContent = `Última actualización: ${new Date().toLocaleTimeString('es-AR')} · ${resultados.length} noticias totales`;
  }
  setLoading('btn-buscar', 'spin-monitor', 'btn-buscar-text', false, 'Buscar ahora');
}

function aplicarFiltros() {
  const keyword = ($('filter-keyword')?.value || '').trim().toLowerCase();
  const fuente = $('filter-fuente')?.value || '';
  const estadoFiltro = $('filter-estado')?.value || '';
  const orden = $('filter-orden')?.value || 'fecha';
  let items = noticiasCache.filter(n => {
    if (fuente && n.fuente !== fuente) return false;
    if (estadoFiltro === 'pendiente' && n.cubierta) return false;
    if (estadoFiltro === 'cubierta' && !n.cubierta) return false;
    if (keyword && !(`${n.titulo} ${n.desc}`.toLowerCase().includes(keyword))) return false;
    return true;
  });
  if (orden === 'titulo') items.sort((a, b) => a.titulo.localeCompare(b.titulo));
  else if (orden === 'fuente') items.sort((a, b) => a.nombre.localeCompare(b.nombre));
  else items.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  const contenedor = $('monitor-results');
  if (!contenedor) return;
  if (!items.length) {
    contenedor.innerHTML = '<div class="monitor-empty"><span style="font-size:2rem">📡</span><p>No hay noticias con esos filtros.</p></div>';
  } else {
    contenedor.innerHTML = `<div class="noticias-grid">${items.map(htmlNoticiaMonitor).join('')}</div>`;
  }
  const stats = $('monitor-stats');
  if (stats) {
    if (!noticiasCache.length) {
      stats.style.display = 'none';
      stats.innerHTML = '';
    } else {
      const cubiertas = noticiasCache.filter(n => n.cubierta).length;
      stats.style.display = 'flex';
      stats.innerHTML = `<span class="stat-chip">${items.length} noticias</span>`
        + `<span class="stat-chip">${cubiertas} cubiertas</span>`
        + `<span class="stat-chip">${noticiasCache.length - cubiertas} pendientes</span>`;
    }
  }
}

function limpiarFiltros() {
  ['filter-keyword', 'filter-fuente', 'filter-estado'].forEach(id => { if ($(id)) $(id).value = ''; });
  if ($('filter-orden')) $('filter-orden').value = 'fecha';
  aplicarFiltros();
}

function toggleAuto() {
  const track = $('auto-track');
  const label = $('auto-label');
  if (autoInterval) {
    clearInterval(autoInterval);
    autoInterval = null;
    track?.classList.remove('on');
    if (label) label.textContent = 'Auto 5min';
  } else {
    buscarNoticias();
    autoInterval = setInterval(buscarNoticias, 5 * 60 * 1000);
    track?.classList.add('on');
    if (label) label.textContent = 'Auto: ON';
  }
}

function abrirModalFuentes() {
  $('modal-fuentes')?.classList.add('open');
  cargarFuentes();
}

function cerrarModalFuentes() {
  $('modal-fuentes')?.classList.remove('open');
  resetAddForm();
}

function toggleAddForm() {
  const form = $('add-fuente-form');
  if (!form) return;
  form.classList.toggle('open');
  if (!form.classList.contains('open')) resetAddForm();
}

function resetAddForm() {
  if ($('nueva-fuente-nombre')) $('nueva-fuente-nombre').value = '';
  if ($('nueva-fuente-url')) $('nueva-fuente-url').value = '';
  resetVerify();
}

function resetVerify() {
  const status = $('verify-status');
  if (status) { status.className = 'verify-status'; status.textContent = ''; }
  if ($('btn-agregar-ok')) $('btn-agregar-ok').disabled = true;
}

async function verificarFeed() {
  const url = $('nueva-fuente-url')?.value.trim() || '';
  if (!url) return showToast('⚠ Ingresá la URL del feed');
  const status = $('verify-status');
  try {
    const data = await api(`/verificar?url=${encodeURIComponent(url)}`);
    if (!data.ok) throw new Error(data.error || 'Feed inválido');
    status.className = 'verify-status ok';
    status.textContent = `✓ Feed válido · "${data.nombre}" · ${data.items} noticias`;
    $('btn-agregar-ok').disabled = false;
    if (!$('nueva-fuente-nombre').value) $('nueva-fuente-nombre').value = data.nombre || '';
  } catch (err) {
    status.className = 'verify-status err';
    status.textContent = '✗ ' + (err.message || 'No es un feed válido');
  }
}

async function agregarFuente() {
  const nombre = $('nueva-fuente-nombre')?.value.trim() || 'Feed RSS';
  const url = $('nueva-fuente-url')?.value.trim() || '';
  if (!url) return showToast('⚠ Verificá el feed primero');
  try {
    const data = await api('/fuentes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'f_' + Date.now(), nombre, url, clase: 'custom' }),
    });
    if (!data.ok) throw new Error(data.error || 'error');
    toggleAddForm();
    await cargarFuentes();
    showToast('✓ Fuente agregada');
  } catch (err) { showToast('✗ ' + err.message); }
}

async function toggleFuente(id) {
  if (fuentesActivas.has(id)) {
    if (fuentesActivas.size === 1) return showToast('⚠ Dejá al menos una fuente activa');
    fuentesActivas.delete(id);
  } else {
    fuentesActivas.add(id);
  }
  renderFuentes();
}

async function eliminarFuente(id) {
  if (!confirm('¿Eliminar esta fuente del monitor?')) return;
  try {
    await api('/fuentes?id=' + encodeURIComponent(id), { method: 'DELETE' });
    fuentes = fuentes.filter(f => f.id !== id);
    fuentesActivas.delete(id);
    renderFuentes();
    actualizarFiltroFuentes();
  } catch { showToast('✗ Error eliminando fuente'); }
}

// ============================================================
// IMAGEN
// ============================================================

function toggleWebSearch() {
  webSearchActivo = !webSearchActivo;
  const track = $('web-search-track');
  const thumb = $('web-search-thumb');
  if (track) track.style.background = webSearchActivo ? 'var(--v)' : 'var(--line2)';
  if (thumb) thumb.style.transform = webSearchActivo ? 'translateX(14px)' : 'translateX(0)';
}

function portadaActual() {
  return elegirPortada({
    origen: estado.origen || {},
    generada: estado.imagen || '',
    eleccion: estado.portadaEleccion || '',
  });
}

// Pinta la portada en el panel de imagen y, si hay nota, también arriba del texto.
function renderPortada() {
  const portada = portadaActual();
  const caja = $('ref-img-original');
  const alternativas = $('ref-img-alternativas');
  if (caja) {
    caja.innerHTML = portada.url && portada.origen === 'original'
      ? htmlPortada(portada, { medio: estado.origen?.medio, base: API })
      : '<span style="font-size:11px;color:var(--muted)">Sin imagen original</span>';
  }
  if (alternativas) {
    alternativas.innerHTML = portada.origen === 'original'
      ? htmlMiniaturas(estado.origen?.imagenes || [], portada.url, { base: API })
      : '';
  }
  if (estado.nota) {
    estado.nota.portada = portada;
    estado.nota.imagen = portada.url || '';
    if ($('results-reformular')) $('results-reformular').innerHTML = htmlNota(estado.nota, { base: API });
  }
}

// Si hay URL de origen pero todavía no hay imagen, la pide antes de mostrar la nota.
// Usa el scrapeo que ya existe y aprovecha sólo las imágenes: el texto editado no se toca.
async function asegurarImagenOriginal() {
  const url = String(estado.origen?.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return;
  const yaHay = imagenesSeguras([estado.origen?.imagen, ...(estado.origen?.imagenes || [])]);
  if (yaHay.length) return;
  try {
    const data = await api('/v2/redaccion/scrape?url=' + encodeURIComponent(url));
    if (!data || !data.ok) return;
    estado.origen = {
      ...(estado.origen || {}),
      url,
      medio: estado.origen?.medio || data.medio || '',
      imagen: String(data.imagen || '').trim(),
      imagenes: imagenesSeguras([data.imagen, ...(data.imagenes || [])]),
    };
    renderPortada();
  } catch { /* la imagen es opcional: si falla, se sigue sin portada */ }
}

// La pestaña "Original" se arma acá mientras el HTML no la tenga.
// Si mañana se agrega al HTML, esta función no hace nada.
function montarPanelImagen() {
  if ($('img-content-original')) return;
  const pestanas = document.querySelector('#ref-imagen-section .red-subtabs');
  const panelIa = $('img-content-ia');
  if (!pestanas || !panelIa || !panelIa.parentNode) return;

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'red-subtab active';
  boton.id = 'img-tab-original';
  boton.textContent = '🖼 Original';
  boton.addEventListener('click', () => switchImgTab('original'));
  pestanas.insertBefore(boton, pestanas.firstChild);

  const panel = document.createElement('div');
  panel.id = 'img-content-original';
  const caja = document.createElement('div');
  caja.id = 'ref-img-original';
  caja.style.cssText = 'border-radius:6px;overflow:hidden;border:1px solid var(--line2);min-height:80px;display:flex;align-items:center;justify-content:center;background:var(--surface2)';
  caja.innerHTML = '<span style="font-size:11px;color:var(--muted)">Sin imagen original</span>';
  const alternativas = document.createElement('div');
  alternativas.id = 'ref-img-alternativas';
  panel.append(caja, alternativas);
  panelIa.parentNode.insertBefore(panel, panelIa);

  panelIa.style.display = 'none';
  $('img-tab-ia')?.classList.remove('active');
}

function switchImgTab(tab) {
  const esIa = tab === 'ia';
  const original = $('img-content-original');
  const ia = $('img-content-ia');
  if (original) original.style.display = esIa ? 'none' : 'block';
  if (ia) ia.style.display = esIa ? 'block' : 'none';
  $('img-tab-original')?.classList.toggle('active', !esIa);
  $('img-tab-ia')?.classList.toggle('active', esIa);
}

async function generarImagenIA() {
  const titulo = estado.nota?.titular || $('ref-titulo-input')?.value.trim() || '';
  const contenido = estado.nota?.cuerpo || $('ref-cuerpo-input')?.value.trim() || '';
  if (!titulo || !contenido) return showToast('⚠ Primero generá o cargá una nota');
  const boton = $('btn-gen-img');
  boton.disabled = true;
  $('spin-gen-img').style.display = 'inline-block';
  try {
    const data = await api('/v2/redaccion/ilustrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo,
        contenido,
        contexto: $('img-contexto-extra')?.value.trim() || '',
        estilo: $('img-estilo')?.value || 'realista',
      }),
    });
    if (!data.ok) throw new Error(data.error || 'error');
    const url = `data:image/jpeg;base64,${data.imagen}`;
    estado.imagen = url;
    estado.portadaEleccion = url;
    $('ref-img-preview').innerHTML = `<img src="${url}" alt="Imagen generada" style="width:100%;display:block;border-radius:6px">`;
    renderPortada();
    showToast(`✓ Imagen generada (${data.modelo || data.motor || 'IA'})`);
  } catch (err) {
    showToast('✗ ' + (err.message || 'No se pudo generar la imagen'));
  } finally {
    boton.disabled = false;
    $('spin-gen-img').style.display = 'none';
  }
}

function switchRefFuente(modo) {
  const url = $('ref-fuente-url-section');
  if (url) url.style.display = 'block';
  $('ref-fuente-url')?.classList.add('active');
}

// ============================================================
// NOTAS GUARDADAS Y CONFIGURACIÓN
// ============================================================

function toggleNotasGuardadas() {
  notasGuardadasVisible = !notasGuardadasVisible;
  const seccion = $('notas-guardadas-section');
  if (seccion) seccion.style.display = notasGuardadasVisible ? 'block' : 'none';
  if (notasGuardadasVisible) cargarNotasGuardadas();
}

async function cargarNotasGuardadas() {
  const lista = $('notas-lista');
  if (!lista) return;
  lista.innerHTML = '<span class="text-muted" style="font-size:12px">Cargando…</span>';
  try {
    const data = await api('/v2/redaccion/notas');
    if (!data.ok) throw new Error(data.error || 'error');
    lista.innerHTML = data.notas.length
      ? data.notas.map(htmlNotaGuardada).join('')
      : '<span class="text-muted" style="font-size:12px">No hay notas guardadas.</span>';
  } catch {
    lista.innerHTML = '<span class="text-muted" style="font-size:12px;color:var(--red)">Error cargando notas</span>';
  }
}

async function eliminarNotaGuardada(id) {
  try {
    await api('/v2/redaccion/notas?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (notasGuardadasVisible) cargarNotasGuardadas();
    showToast('Nota eliminada');
  } catch { showToast('✗ Error eliminando'); }
}

async function cargarEditorial() {
  try {
    const data = await api('/editorial');
    if (!data.ok || !data.editorial) return;
    $('editorial-prompt').value = data.editorial.prompt || '';
    editorialActivo = !!data.editorial.activo;
    $('editorial-activo').checked = editorialActivo;
  } catch { /* sin config */ }
}

async function guardarEditorial() {
  const prompt = $('editorial-prompt')?.value.trim() || '';
  try {
    const data = await api('/editorial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, activo: !!$('editorial-activo')?.checked }),
    });
    if (!data.ok) throw new Error(data.error || 'error');
    const saved = $('config-saved');
    if (saved) { saved.style.opacity = '1'; setTimeout(() => { saved.style.opacity = '0'; }, 2500); }
  } catch (err) { showToast('✗ ' + err.message); }
}

function toggleEditorial() {
  editorialActivo = !!$('editorial-activo')?.checked;
}

// ============================================================
// LIMPIEZA
// ============================================================

function pedirLimpiarReformular() {
  if (estado.nota) $('modal-limpiar')?.classList.add('open');
  else limpiarReformular();
}

async function guardarYLimpiar() {
  $('modal-limpiar')?.classList.remove('open');
  await guardarNota();
  limpiarReformular();
}

function soloLimpiar() {
  $('modal-limpiar')?.classList.remove('open');
  limpiarReformular();
}

function limpiarReformular() {
  ['ref-titulo-input', 'ref-cuerpo-input', 'txt-contexto-r', 'ref-url-input'].forEach(id => { if ($(id)) $(id).value = ''; });
  if ($('char-ref')) $('char-ref').textContent = '0 caracteres';
  if ($('results-reformular')) $('results-reformular').innerHTML = '<div class="monitor-empty"><span style="font-size:2rem">📄</span><p>La nota reformulada<br>aparecerá aquí.</p></div>';
  ['badge-reformulada', 'btn-limpiar-r', 'origen-badge', 'fuentes-verificadas', 'badge-modelo-v2'].forEach(id => { if ($(id)) $(id).style.display = 'none'; });
  if ($('ref-imagen-section')) $('ref-imagen-section').style.display = 'none';
  if ($('ref-img-preview')) $('ref-img-preview').innerHTML = '<span style="font-size:11px;color:var(--muted)">Generá una imagen con IA</span>';
  estado.nota = null;
  estado.origen = null;
  estado.fuentes = [];
  estado.imagen = '';
  estado.portadaEleccion = '';
  if ($('ref-img-original')) $('ref-img-original').innerHTML = '<span style="font-size:11px;color:var(--muted)">Sin imagen original</span>';
  if ($('ref-img-alternativas')) $('ref-img-alternativas').innerHTML = '';
  switchImgTab('original');
  localStorage.removeItem(CLAVE_BORRADOR);
}

function limpiarTitulares() {
  ['txt-nota', 'txt-tema', 'txt-contexto-t', 'txt-redactar'].forEach(id => { if ($(id)) $(id).value = ''; });
  ['char-nota', 'char-tema', 'char-redactar'].forEach(id => { if ($(id)) $(id).textContent = '0 caracteres'; });
  if ($('results-titulares')) $('results-titulares').innerHTML = '<div class="monitor-empty"><span style="font-size:2rem">📝</span><p>La nota o los titulares<br>aparecerán aquí.</p></div>';
  ['badge-titulares', 'btn-limpiar-t', 'badge-modelo-titulares'].forEach(id => { if ($(id)) $(id).style.display = 'none'; });
  estado.titulares = [];
  estado.angulos = [];
  estado.nota = null;
  estado.imagen = '';
}

// ============================================================
// EVENTOS, BORRADOR E INIT
// ============================================================

document.addEventListener('click', (event) => {
  const copiar = event.target.closest('[data-copiar]');
  if (copiar) return copiarTexto(copiar.getAttribute('data-copiar'));
  const guardar = event.target.closest('[data-guardar-nota]');
  if (guardar) return guardarNota();
  const reformular = event.target.closest('[data-reformular-url]');
  if (reformular) return reformularDesdeMonitor(reformular.getAttribute('data-reformular-url'));
  const borrarNota = event.target.closest('[data-borrar-nota]');
  if (borrarNota) return eliminarNotaGuardada(borrarNota.getAttribute('data-borrar-nota'));
  const toggleFuenteBtn = event.target.closest('[data-toggle-fuente]');
  if (toggleFuenteBtn) return toggleFuente(toggleFuenteBtn.getAttribute('data-toggle-fuente'));
  const borrarFuente = event.target.closest('[data-borrar-fuente]');
  if (borrarFuente) return eliminarFuente(borrarFuente.getAttribute('data-borrar-fuente'));
  const portada = event.target.closest('[data-portada]');
  if (portada) {
    estado.portadaEleccion = portada.getAttribute('data-portada') || '';
    renderPortada();
    return;
  }
});

// Si el proxy no puede traer la imagen, se intenta la dirección directa una vez.
document.addEventListener('error', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  const directa = img.getAttribute('data-directa');
  if (directa && img.src !== directa) {
    img.removeAttribute('data-directa');
    img.src = directa;
  }
}, true);

async function reformularDesdeMonitor(url) {
  if (!url) return;
  switchTab('reformular', document.querySelectorAll('.red-tab')[1]);
  $('ref-url-input').value = url;
  await scrapearNota();
}

function sincronizarEstadoDesdeDom() {
  if ($('ref-titulo-input')) estado.titulo = $('ref-titulo-input').value;
  if ($('ref-cuerpo-input')) estado.contenido = $('ref-cuerpo-input').value;
  if ($('txt-contexto-r')) estado.contexto = $('txt-contexto-r').value;
  if ($('ref-estilo')) estado.estilo = $('ref-estilo').value;
}

function guardarBorrador() {
  try {
    sincronizarEstadoDesdeDom();
    localStorage.setItem(CLAVE_BORRADOR, serializarBorrador(estado));
  } catch { /* storage lleno */ }
}

function cargarBorrador() {
  const borrador = deserializarBorrador(localStorage.getItem(CLAVE_BORRADOR));
  if (!borrador) return;
  estado.titulo = borrador.titulo || '';
  estado.contenido = borrador.contenido || '';
  estado.contexto = borrador.contexto || '';
  estado.estilo = borrador.estilo || 'formal';
  estado.origen = borrador.origen || null;
  estado.portadaEleccion = borrador.portadaEleccion || '';
  estado.fuentes = fuentesSeguras(borrador.fuentes || []);
  estado.nota = borrador.nota || null;
  if ($('ref-titulo-input')) $('ref-titulo-input').value = estado.titulo;
  if ($('ref-cuerpo-input')) $('ref-cuerpo-input').value = estado.contenido;
  if ($('char-ref')) $('char-ref').textContent = `${estado.contenido.length} caracteres`;
  if ($('txt-contexto-r')) $('txt-contexto-r').value = estado.contexto;
  if ($('ref-estilo')) $('ref-estilo').value = estado.estilo;
  if (estado.nota) {
    $('results-reformular').innerHTML = htmlNota(estado.nota);
    const contenedor = $('fuentes-verificadas');
    if (contenedor) {
      contenedor.innerHTML = htmlFuentes(estado.fuentes);
      contenedor.style.display = estado.fuentes.length ? 'block' : 'none';
    }
    if ($('badge-reformulada')) $('badge-reformulada').style.display = 'inline-block';
    if ($('btn-limpiar-r')) $('btn-limpiar-r').style.display = 'inline-block';
    if ($('ref-imagen-section')) $('ref-imagen-section').style.display = 'block';
    renderPortada();
  }
}

function init() {
  montarPanelImagen();
  cargarBorrador();
  cargarSalud();
  cargarFuentes();
  cargarEditorial();
  ['txt-nota', 'txt-tema', 'ref-cuerpo-input', 'txt-redactar'].forEach(id => {
    $(id)?.addEventListener('input', function () {
      const mapa = { 'txt-nota': 'char-nota', 'txt-tema': 'char-tema', 'ref-cuerpo-input': 'char-ref', 'txt-redactar': 'char-redactar' };
      const contador = $(mapa[id]);
      if (contador) contador.textContent = `${this.value.length} caracteres`;
      guardarBorrador();
    });
  });
  $('ref-titulo-input')?.addEventListener('input', guardarBorrador);
  $('txt-contexto-r')?.addEventListener('input', guardarBorrador);
  $('ref-estilo')?.addEventListener('change', guardarBorrador);
  setInterval(cargarSalud, 5 * 60 * 1000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

// Puente para el HTML copiado de la app vieja.
Object.assign(window, {
  switchTab, switchSubtab, accionTitulares, generarTitulares, redactarNota,
  buscarNoticias, aplicarFiltros, limpiarFiltros, toggleAuto,
  abrirModalFuentes, cerrarModalFuentes, toggleAddForm, resetVerify, verificarFeed, agregarFuente,
  scrapearNota, buscarFuentes, reformularNota, guardarNota, switchRefFuente,
  generarImagenIA, switchImgTab, toggleWebSearch,
  toggleNotasGuardadas, pedirLimpiarReformular, guardarYLimpiar, soloLimpiar, limpiarReformular,
  limpiarTitulares, cargarEditorial, guardarEditorial, toggleEditorial, copiarTexto,
});
