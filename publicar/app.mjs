import { createEditorialHandoff, EDITORIAL_HANDOFF_KEY } from '../placas-v2/output-handoff.mjs';
import {
  ESTADO_KEY,
  construirPayloadPaquete,
  prepararEstado,
  validarEstado,
  serializarEstado,
  deserializarEstado,
  construirResumen,
  leerJson,
} from './logic.mjs';

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const $ = selector => document.querySelector(selector);
const state = { estado: null, guardando: false };

function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800); }
function setLoading(on, message = 'Extrayendo la nota…') { $('#loading').classList.toggle('is-hidden', !on); $('#loadingText').textContent = message; $('#prepararButton').disabled = on; }

async function extractNote(url) {
  const response = await fetch(`${WORKER}?url=${encodeURIComponent(url)}`);
  const data = await leerJson(response);
  if (!response.ok || !data || data.error) throw new Error((data && data.error) || 'No se pudo extraer la noticia.');
  return data;
}

async function prepararNota(event) {
  event.preventDefault();
  if (state.guardando) { toast('Ya se está preparando una nota, esperá a que termine.'); return; }
  const url = $('#notaUrl').value.trim();
  if (!url) { toast('Pegá el link de la nota para continuar.'); return; }
  state.guardando = true;
  setLoading(true, 'Extrayendo la nota…');
  $('#errorBox').classList.add('is-hidden');
  try {
    setLoading(true, 'Armando el paquete editorial…');
    const nota = await extractNote(url);
    const response = await fetch(`${WORKER}/placas/v2/paquete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(construirPayloadPaquete(nota)) });
    const data = await leerJson(response);
    if (!response.ok || !data || !data.ok) throw new Error((data && data.error) || 'No se pudo generar el paquete editorial.');
    aceptarEstado(prepararEstado(data));
    toast('Nota preparada. Elegí la salida.');
  } catch (error) {
    mostrarError([error.message || 'No se pudo preparar la nota.']);
    sessionStorage.removeItem(ESTADO_KEY);
    $('#actions').classList.add('is-hidden');
    $('#resumen').classList.add('is-hidden');
    $('#notaUrl').focus();
  } finally {
    state.guardando = false;
    setLoading(false);
  }
}

function aceptarEstado(estado) {
  if (!validarEstado(estado)) {
    sessionStorage.removeItem(ESTADO_KEY);
    mostrarError(estado.errors.length ? estado.errors : ['El paquete editorial es inválido.']);
    $('#actions').classList.add('is-hidden');
    $('#resumen').classList.add('is-hidden');
    return;
  }
  state.estado = estado;
  sessionStorage.setItem(ESTADO_KEY, serializarEstado(estado));
  renderResumen();
  $('#errorBox').classList.add('is-hidden');
  $('#actions').classList.remove('is-hidden');
  $('#abrirPlacasButton').disabled = false;
  $('#abrirWhatsappButton').disabled = false;
}

function renderResumen() {
  const resumen = construirResumen(state.estado);
  $('#resumenTitulo').textContent = resumen.titulo || '(sin título)';
  $('#resumenSeccion').textContent = resumen.seccion ? `Sección · ${resumen.seccion}` : 'Sección sin definir';
  $('#resumenDatos').textContent = `${resumen.datosClave} dato${resumen.datosClave === 1 ? '' : 's'} clave${resumen.datosClave === 1 ? '' : 's'}`;
  const warnings = resumen.warnings.map(mensaje => (mensaje === 'ia_no_disponible' ? `⚠ IA no disponible${resumen.ia_error ? ` (${resumen.ia_error})` : ''}. Se usó el modo determinístico.` : mensaje));
  $('#resumenWarnings').textContent = warnings.join(' · ');
  $('#resumenWarnings').classList.toggle('is-hidden', !warnings.length);
  $('#resumen').classList.remove('is-hidden');
}

function mostrarError(errors) {
  $('#errorBox').textContent = `No se pudo preparar la nota: ${errors.join(' · ')}`;
  $('#errorBox').classList.remove('is-hidden');
}

function reset() {
  state.estado = null;
  sessionStorage.removeItem(ESTADO_KEY);
  $('#resumen').classList.add('is-hidden');
  $('#actions').classList.add('is-hidden');
  $('#errorBox').classList.add('is-hidden');
  $('#notaUrl').value = '';
  $('#notaUrl').focus();
}

function abrir(out) {
  const estado = state.estado;
  if (!validarEstado(estado)) { toast('Primero prepará una nota válida.'); return; }
  sessionStorage.setItem(EDITORIAL_HANDOFF_KEY, createEditorialHandoff(estado.package, out, 'publicar'));
  window.location.href = out === 'placas' ? '../placas-v2/' : '../whatsapp/';
}

$('#notaForm').addEventListener('submit', prepararNota);
$('#notaUrl').addEventListener('input', () => {
  if (!state.estado) return;
  if ($('#notaUrl').value.trim() !== state.estado.package.fuente.url) reset();
});
$('#resetButton').addEventListener('click', reset);
$('#abrirPlacasButton').addEventListener('click', () => abrir('placas'));
$('#abrirWhatsappButton').addEventListener('click', () => abrir('whatsapp'));

const restaurado = deserializarEstado(sessionStorage.getItem(ESTADO_KEY));
if (validarEstado(restaurado)) {
  state.estado = restaurado;
  $('#notaUrl').value = restaurado.package.fuente.url;
  renderResumen();
  $('#actions').classList.remove('is-hidden');
  $('#abrirPlacasButton').disabled = false;
  $('#abrirWhatsappButton').disabled = false;
} else {
  sessionStorage.removeItem(ESTADO_KEY);
}
