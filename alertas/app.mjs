const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
import { ALERTAS_SYSTEM_PROMPT, normalizeAlertReport, validarEnFuente, buildWhatsAppCaption, emptyReport, normalizeNivel } from './alertas-core.mjs';
import { FORMATS, renderAlertasPlaca } from './renderer.mjs';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const toastEl = $('#toast');
const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(() => toastEl.classList.remove('show'), 2600); };

const hoyCorto = () => new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
const horaCorta = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };

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
  actualizarCaption(d);
}

function recolectarFormulario() {
  const d = { titular: getField('titularInput'), fuente: getField('fuenteInput'), fecha: getField('fechaInput'), hora: getField('horaInput'), nivel: normalizeNivel(getField('nivelSelect')), direccion: getField('direccionInput').toLowerCase(), celdas: [], eta: null };
  for (const [etiqueta, prefix] of Object.entries(ETIQUETA_ID)) {
    const zonas = getField(`${prefix}-zonas`);
    if (zonas) d.celdas.push({ etiqueta, zonas, detalle: getField(`${prefix}-detalle`), hacia: getField(`${prefix}-hacia`).toLowerCase() });
  }
  const lugar = getField('eta-lugar');
  const minutos = Number(getField('eta-minutos'));
  // Sin minutos válidos no se inventa un ETA: la línea/banner se omite (regla editorial).
  if (lugar && Number.isFinite(minutos) && minutos > 0) d.eta = { lugar, detalle: getField('eta-detalle'), minutos };
  return d;
}

// Reescribe el caption solo si sigue intacto el último generado por la app;
// si el redactor lo editó a mano, su edición se respeta.
let lastCaption = '';
function actualizarCaption(d) {
  const captionEl = document.getElementById('captionText');
  if (!captionEl) return;
  const next = buildWhatsAppCaption(d || state.data);
  if (captionEl.value === '' || captionEl.value === lastCaption) captionEl.value = next;
  lastCaption = next;
}

// ─── Render + export ─────────────────────────────────────────
// La resolución del canvas es fija (la del formato exportado). En pantalla lo
// mostramos limitado por el ancho del panel y por 78vh de alto, manteniendo
// SIEMPRE la proporción exacta — nunca se estira.
function fitCanvasToPanel() {
  const canvas = document.getElementById('plateCanvas');
  if (!canvas) return;
  const panel = canvas.parentElement;
  if (!panel) return;
  const cs = getComputedStyle(panel);
  const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  const maxW = Math.max(1, panel.clientWidth - padX);
  const maxH = Math.max(1, Math.floor(window.innerHeight * 0.78));
  const ratio = canvas.width / canvas.height;
  let w = maxW;
  let h = Math.round(w / ratio);
  if (h > maxH) { h = maxH; w = Math.round(h * ratio); }
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

function render() {
  const canvas = document.getElementById('plateCanvas');
  if (!canvas) return;
  const cfg = FORMATS[state.format];
  canvas.width = cfg.width; canvas.height = cfg.height;
  const ctx = canvas.getContext('2d');
  renderAlertasPlaca(ctx, state.data, state.format, state.logoImg);
  fitCanvasToPanel();
  actualizarCaption(state.data);
}

function descargarPng() {
  const canvas = document.getElementById('plateCanvas');
  canvas.toBlob((blob) => {
    if (!blob) return toast('No se pudo generar el PNG.');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `alerta-tormentas-${stamp()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
  if (!payload) throw new Error('El worker no devolvió JSON.');
  if (!resp.ok || payload?.ok === false) throw new Error(payload?.error || 'El worker rechazó el parte.');
  let result = payload.result;
  if (result === null || result === undefined) throw new Error('El worker no devolvió datos.');
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
    // El form no conserva datos rancios de un parte anterior bajo el banner de error.
    const limpio = { ...emptyReport(), fecha: hoyCorto(), hora: horaCorta() };
    state.data = limpio;
    poblarFormulario(limpio);
    render();
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
const initial = { ...emptyReport(), fecha: hoyCorto(), hora: horaCorta() };
state.data = initial;
poblarFormulario(initial);
cargarLogo();
render();
window.addEventListener('resize', fitCanvasToPanel);
// Re-render cuando Inter termine de cargar (la primera pintura puede caer en fallback Arial).
if (document.fonts?.ready) document.fonts.ready.then(() => render());
document.getElementById('generarBtn').disabled = true;
