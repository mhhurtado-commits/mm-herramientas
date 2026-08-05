import { buildEditorialVariants, normalizeNewsPlate, normalizeFocus, FORMATS } from './editorial-core.mjs';
import { renderNewsPlate } from './renderer.mjs';

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const state = { plate: null, variants: [], selectedVariant: 0, format: 'square', imageIndex: 0, image: null, imageUrl: '' };
const $ = selector => document.querySelector(selector);

function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800); }
function setLoading(on, message = 'Analizando la noticia…') { $('#loading').classList.toggle('is-hidden', !on); $('#loadingText').textContent = message; }
function activeVariant() { return state.variants[state.selectedVariant] || state.plate; }
function activeFocus() { return normalizeFocus(activeVariant()?.bloques?.find(block => block.tipo === 'imagen')?.foco); }
function setFocus(axis, value) { const variant = activeVariant(); const imageBlock = variant?.bloques?.find(block => block.tipo === 'imagen'); if (!imageBlock) return; imageBlock.foco = { ...activeFocus(), [axis]: Number(value) / 100 }; renderFocus(); render(); }
function setActiveText(key, value) { const current = activeVariant(); if (!current) return; current[key] = value; state.plate[key] = value; state.variants.forEach(variant => { if (variant[key] === current[key] || variant === current) variant[key] = value; }); render(); }

async function extractNote(url) {
  const response = await fetch(`${WORKER}?url=${encodeURIComponent(url)}`);
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'No se pudo extraer la noticia.');
  return data;
}

async function generateEditorial(note) {
  const response = await fetch(`${WORKER}/placas/v2/generar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nota: note }) });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'No se pudo generar la propuesta.');
  return data;
}

async function loadImage(url) {
  state.image = null; state.imageUrl = url || '';
  if (!url) return;
  try {
    const response = await fetch(`${WORKER}?image=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('image');
    const objectUrl = URL.createObjectURL(await response.blob());
    const image = new Image();
    image.onload = () => { state.image = image; render(); };
    image.src = objectUrl;
  } catch { toast('No se pudo cargar esta imagen; se usa una composición alternativa.'); }
}

function renderVariants() {
  $('#variantList').innerHTML = state.variants.map((variant, index) => `<button class="variant ${index === state.selectedVariant ? 'active' : ''}" data-index="${index}" type="button"><span class="variant-dot" style="background:${variant.color_principal}">${index === 0 ? '★' : index + 1}</span><span><strong>${index === 0 ? 'Propuesta recomendada' : `Alternativa ${index}`}</strong><small>${variant.etiqueta} · ${variant.template_sugerido}</small></span>${index === 0 ? '<span class="recommended">Sugerida</span>' : ''}</button>`).join('');
  document.querySelectorAll('.variant').forEach(button => button.addEventListener('click', () => { state.selectedVariant = Number(button.dataset.index); syncEditor(); render(); }));
}

function renderFormats() {
  $('#formatList').innerHTML = Object.entries(FORMATS).map(([key, format]) => `<button class="format ${state.format === key ? 'active' : ''}" type="button" data-format="${key}">${format.label}</button>`).join('');
  document.querySelectorAll('.format').forEach(button => button.addEventListener('click', () => { state.format = button.dataset.format; renderFormats(); render(); }));
}

function renderImages() {
  const images = state.plate?.fuente?.imagenes || [];
  $('#imageList').innerHTML = images.length ? images.map((image, index) => `<button class="image-option ${index === state.imageIndex ? 'active' : ''}" type="button" data-image="${index}" title="Imagen ${index + 1}"><img src="${image}" alt=""></button>`).join('') : '<span class="image-empty">La noticia no tiene imágenes disponibles.</span>';
  $('#focusControls').classList.toggle('is-hidden', !images.length);
  renderFocus();
  document.querySelectorAll('.image-option').forEach(button => button.addEventListener('click', () => { state.imageIndex = Number(button.dataset.image); renderImages(); loadImage(images[state.imageIndex]); }));
}

function renderFocus() { const focus = activeFocus(); $('#focusX').value = Math.round(focus.x * 100); $('#focusY').value = Math.round(focus.y * 100); $('#focusXValue').textContent = `${Math.round(focus.x * 100)}%`; $('#focusYValue').textContent = `${Math.round(focus.y * 100)}%`; }
function syncEditor() { const variant = activeVariant(); if (!variant) return; $('#titleInput').value = variant.titulo || ''; $('#dekInput').value = variant.bajada || ''; renderFocus(); }

function render() {
  const variant = activeVariant();
  if (!variant) return;
  const canvas = $('#plateCanvas');
  renderNewsPlate(canvas.getContext('2d'), variant, state.format, { image: state.image, focus: activeFocus() });
  canvas.classList.remove('is-hidden'); $('.empty-state').classList.add('is-hidden');
  $('#previewTitle').textContent = variant.titulo || 'Placa editorial';
  $('#familyBadge').textContent = `${variant.etiqueta} · ${FORMATS[state.format].label}`;
  $('#sourceLabel').textContent = variant.fuente?.url ? `Fuente · ${variant.fuente.url}` : 'Media Mendoza · Placas V2';
  $('#downloadButton').disabled = false; $('#copyButton').disabled = false;
}

async function generate(event) {
  event.preventDefault();
  const url = $('#newsUrl').value.trim(); if (!url) return;
  setLoading(true, 'Extrayendo la noticia…');
  $('#editorControls').classList.add('is-hidden');
  try {
    const note = await extractNote(url);
    setLoading(true, 'Armando la propuesta editorial…');
    const result = await generateEditorial(note);
    state.plate = normalizeNewsPlate(result.placa || note);
    state.variants = buildEditorialVariants(state.plate);
    state.selectedVariant = 0; state.imageIndex = 0;
    $('#editorControls').classList.remove('is-hidden');
    renderVariants(); renderFormats(); renderImages(); syncEditor();
    if (result.warnings?.length) { $('#warning').textContent = 'La propuesta se generó con fallback automático. Revisá la redacción antes de exportar.'; $('#warning').classList.remove('is-hidden'); } else $('#warning').classList.add('is-hidden');
    await loadImage(state.plate.fuente?.imagenes?.[0]);
    render();
  } catch (error) { toast(error.message || 'No se pudo generar la placa.'); } finally { setLoading(false); }
}

function download() { $('#plateCanvas').toBlob(blob => { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `placa-mediamendoza-${Date.now()}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }, 'image/png'); }
async function copy() { try { const blob = await new Promise(resolve => $('#plateCanvas').toBlob(resolve, 'image/png')); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); toast('PNG copiado al portapapeles.'); } catch { toast('Tu navegador no permite copiar la imagen; usá Descargar PNG.'); } }

$('#newsForm').addEventListener('submit', generate);
$('#titleInput').addEventListener('input', event => setActiveText('titulo', event.target.value));
$('#dekInput').addEventListener('input', event => setActiveText('bajada', event.target.value));
$('#focusX').addEventListener('input', event => setFocus('x', event.target.value));
$('#focusY').addEventListener('input', event => setFocus('y', event.target.value));
$('#downloadButton').addEventListener('click', download); $('#copyButton').addEventListener('click', copy);
