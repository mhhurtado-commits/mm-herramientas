const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
import { ALERTAS_SYSTEM_PROMPT, normalizeAlertReport, validarEnFuente, buildWhatsAppCaption, emptyReport, normalizeNivel } from './alertas-core.mjs';
import { FORMATS, renderAlertasPlaca } from './renderer.mjs';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const toastEl = $('#toast');
const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(() => toastEl.classList.remove('show'), 2600); };

const hoyCorto = () => new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
const horaCorta = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').slice(0, 12);

const state = { data: emptyReport(), format: '4:5', logoImg: null };

// ─── Logo Media Mendoza ──────────────────────────────────────
function cargarLogo() {
  const img = new Image();
  img.onload = () => { state.logoImg = img; render(); };
  img.onerror = () => { state.logoImg = null; };
  img.src = '../assets/logo.png';
}

// ─── Formulario ⇄ modelo ─────────────────────────────────────
function setField(id, value) { const el = document.getElementById(id); if (el) el.value = value ?? ''; }
function getField(id) { return (document.getElementById(id)?.value || '').trim(); }
const ETIQUETA_ID = { ahora: 'celda-ahora', ruta: 'celda-ruta', siguiente: 'celda-siguiente' };

function poblarFormulario(d) {
  setField('titularInput', d.titular); setField('fuenteInput', d.fuente); setField('fechaInput', d.fecha); setField('horaInput', d.hora);
  const sel = document.getElementById('nivelSelect'); if (sel) sel.value = normalizeNivel(d.nivel);
  setField('direccionInput', d.direccion);
  for (const [etiqueta, prefix] of Object.entries(ETIQUETA_ID)) {
    const c = (d.celdas || []).find((x) => x.etiqueta === etiqueta) || { zonas: '', detalle: '', hacia: '' };
    setField(`${prefix}-zonas`, c.zonas); setField(`${prefix}-detalle`, c.detalle); setField(`${prefix}-hacia`, c.hacia);
  }
  setField('eta-lugar', d.eta?.lugar || ''); setField('eta-detalle', d.eta?.detalle || ''); setField('eta-minutos', d.eta?.minutos ?? '');
  actualizarCaption();
}

function recolectarFormulario() {
  const d = { titular: getField('titularInput'), fuente: getField('fuenteInput'), fecha: getField('fechaInput'), hora: getField('horaInput'), nivel: normalizeNivel(getField('nivelSelect')), direccion: getField('direccionInput').toLowerCase(), celdas: [], eta: null };
  for (const [etiqueta, prefix] of Object.entries(ETIQUETA_ID)) {
    const zonas = getField(`${prefix}-zonas`);
    if (zonas) d.celdas.push({ etiqueta, zonas, detalle: getField(`${prefix}-detalle`), hacia: getField(`${prefix}-hacia`).toLowerCase() });
  }
  const lugar = getField('eta-lugar');
  const minutos = Number(getField('eta-minutos'));
  if (lugar) d.eta = { lugar, detalle: getField('eta-detalle'), minutos: Number.isFinite(minutos) && minutos > 0 ? minutos : 10 };
  return d;
}

function actualizarCaption() {
  const captionEl = document.getElementById('captionText');
  if (captionEl) captionEl.value = buildWhatsAppCaption(state.data);
}

// ─── Render + export ─────────────────────────────────────────
function render() {
  const canvas = document.getElementById('plateCanvas');
  if (!canvas) return;
  const cfg = FORMATS[state.format];
  canvas.width = cfg.width; canvas.height = cfg.height;
  const ctx = canvas.getContext('2d');
  renderAlertasPlaca(ctx, state.data, state.format, state.logoImg);
  actualizarCaption();
}

function descargarPng() {
  const canvas = document.getElementById('plateCanvas');
  canvas.toBlob((blob) => {
    if (!blob) return toast('No se pudo generar el PNG.');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `alerta-tormentas-${stamp()}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}

async function copiarPng() {
  const canvas = document.getElementById('plateCanvas');
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast('PNG copiado.');
  } catch { toast('No se pudo copiar; descargá el PNG.'); }
}

function mostrarError(msg) {
  const el = document.getElementById('errorBanner');
  if (!el) return;
  el.hidden = false;
  el.textContent = msg;
}

// ─── Llamada al worker ───────────────────────────────────────
async function solicitarEstructura(texto) {
  const resp = await fetch(`${WORKER}/social/generar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt: ALERTAS_SYSTEM_PROMPT, userMsg: texto }),
  });
  const payload = await resp.json().catch(() => null);
  if (!resp.ok || payload?.ok === false) throw new Error(payload?.error || 'El worker rechazó el parte.');
  let result = payload?.result ?? {};
  if (typeof result === 'string') {
    try { result = JSON.parse(result); } catch { throw new Error('La IA no devolvió JSON válido.'); }
  }
  return result;
}

async function generar() {
  const texto = document.getElementById('reporteText').value.trim();
  if (!texto) { toast('Pegá el reporte primero.'); return; }
  const btn = document.getElementById('generarBtn');
  btn.disabled = true;
  document.getElementById('loading').hidden = false;
  document.getElementById('errorBanner').hidden = true;
  try {
    const raw = await solicitarEstructura(texto);
    let data = normalizeAlertReport(raw);
    data = validarEnFuente(data, texto);
    if (!data.fecha) data.fecha = hoyCorto();
    if (!data.hora) data.hora = horaCorta();
    state.data = data;
    poblarFormulario(data);
    render();
  } catch (err) {
    mostrarError(`No se pudo estructurar el parte con IA (${err.message}). Completá a mano y generá igual.`);
  } finally {
    document.getElementById('loading').hidden = true;
    btn.disabled = false;
  }
}

// ─── Wiring ──────────────────────────────────────────────────
function syncFromForm() {
  state.data = recolectarFormulario();
  render();
}

document.getElementById('generarBtn').addEventListener('click', generar);
document.getElementById('actualizarBtn').addEventListener('click', syncFromForm);
document.getElementById('descargarPngBtn').addEventListener('click', descargarPng);
document.getElementById('copiarPngBtn').addEventListener('click', copiarPng);
document.getElementById('copiarCaptionBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(document.getElementById('captionText').value); toast('Caption copiado.'); } catch { toast('No se pudo copiar el caption.'); }
});
$$('#formatoToggle [data-formato]').forEach((btn) => btn.addEventListener('click', () => {
  state.format = btn.dataset.formato;
  $$('#formatoToggle [data-formato]').forEach((b) => b.classList.toggle('active', b === btn));
  render();
}));
$$('#alertasForm input, #alertasForm select').forEach((el) => el.addEventListener('input', syncFromForm));

// ─── Init ────────────────────────────────────────────────────
document.getElementById('reporteText').addEventListener('input', (e) => {
  document.getElementById('generarBtn').disabled = !e.target.value.trim();
});
setField('fechaInput', hoyCorto()); setField('horaInput', horaCorta());
poblarFormulario(emptyReport());
cargarLogo();
render();
document.getElementById('generarBtn').disabled = true;
