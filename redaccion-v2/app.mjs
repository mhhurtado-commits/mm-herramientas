import {
  resolverApiBase, crearEstadoInicial, validarEntradaReformular,
  construirPayloadReformular, fuentesSeguras, mensajeError, etiquetaModelo,
  normalizarSalud, serializarBorrador, deserializarBorrador, CLAVE_BORRADOR,
} from './logic.mjs';
import { escaparHtml, htmlTitulares, htmlFuentes, htmlNota } from './render.mjs';

const API = resolverApiBase(window.location);
const estado = crearEstadoInicial();

const $ = id => document.getElementById(id);

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

async function generarTitulares() {
  const contenido = $('txt-redactar')?.value.trim() || '';
  if (contenido.length < 20) return showToast('⚠ Escribí al menos 20 caracteres');
  const boton = $('btn-generar');
  boton.disabled = true;
  try {
    const data = await api('/v2/redaccion/titulares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modo: 'tema',
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
    $('badge-titulares').textContent = `${estado.titulares.length} opciones`;
    $('badge-titulares').style.display = 'inline-block';
    const badge = $('badge-modelo-titulares');
    if (badge) {
      badge.textContent = etiquetaModelo(data);
      badge.style.display = data.modelo ? 'inline-block' : 'none';
    }
  } catch (err) {
    showToast('✗ ' + mensajeError(err.message));
  } finally {
    boton.disabled = false;
  }
}

async function scrapearNota() {
  const url = $('ref-url-input')?.value.trim() || '';
  if (!/^https?:\/\//i.test(url)) return showToast('⚠ Ingresá una URL válida');
  const boton = $('btn-scrape');
  boton.disabled = true;
  try {
    const data = await api('/v2/redaccion/scrape?url=' + encodeURIComponent(url));
    if (!data.ok) throw new Error(data.error || 'error');
    estado.titulo = data.titulo || '';
    estado.contenido = data.texto || '';
    estado.origen = { url: data.url, medio: data.medio, titulo: data.titulo, fecha: data.fecha, imagen: data.imagen };
    $('ref-titulo-input').value = estado.titulo;
    $('ref-cuerpo-input').value = estado.contenido;
    $('char-ref').textContent = `${estado.contenido.length} caracteres`;
    const badge = $('origen-badge');
    if (badge) {
      badge.textContent = `Origen: ${data.medio || 'medio desconocido'}`;
      badge.style.display = 'block';
    }
    await buscarFuentes(data.titulo, data.url);
    showToast('✓ Nota obtenida');
  } catch (err) {
    showToast('✗ ' + mensajeError(err.message));
  } finally {
    boton.disabled = false;
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
  const boton = $('btn-reformular');
  boton.disabled = true;
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
      hashtags: data.hashtags || [],
      fuentes: data.fuentes || estado.fuentes,
      origen: data.origen || estado.origen,
      modelo: data.modelo,
    };
    estado.fuentes = fuentesSeguras(data.fuentes || []);
    estado.modelo = data.modelo || '';
    estado.latenciaMs = data.latenciaMs || 0;
    $('results-reformular').innerHTML = htmlNota(estado.nota);
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
    $('btn-guardar-nota-v2').style.display = 'inline-flex';
    $('badge-reformulada').style.display = 'inline-block';
    $('btn-limpiar-r').style.display = 'inline-block';
  } catch (err) {
    showToast('✗ ' + mensajeError(err.message));
  } finally {
    boton.disabled = false;
  }
}

async function guardarNota() {
  if (!estado.nota) return showToast('⚠ No hay nota para guardar');
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

// Las funciones que usa el HTML copiado se exponen al final (Tarea 14).
