import { buildEditorialVariants, normalizeNewsPlate, normalizeFocus, calculatePlateLayout, FORMATS, PLATE_TYPES } from './editorial-core.mjs';
import { renderNewsPlate } from './renderer.mjs';

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const state = { plate: null, variants: [], selectedVariant: 0, selectedTemplate: 'noticia', format: 'square', imageIndex: 0, image: null, imageUrl: '', logo: null, personImages: {}, supportImage: null, supportImageUrl: '', supportFocus: { x: 0.5, y: 0.5 }, imagePositioned: true, drag: null };
const $ = selector => document.querySelector(selector);

const logoImage = new Image();
logoImage.onload = () => { state.logo = logoImage; if (state.plate) render(); };
logoImage.src = '../assets/logo.png';

function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800); }
function setLoading(on, message = 'Analizando la noticia…') { $('#loading').classList.toggle('is-hidden', !on); $('#loadingText').textContent = message; }
function activeVariant() { return state.variants[state.selectedVariant] || state.plate; }
function effectiveVariant() { const variant = activeVariant(); return variant ? { ...variant, tipo_placa: state.selectedTemplate || variant.tipo_placa || 'noticia' } : null; }
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

async function loadSupportImage(url) {
  state.supportImage = null;
  if (!url) return;
  try {
    let source = url;
    if (!/^blob:|^data:/i.test(url)) {
      const response = await fetch(`${WORKER}?image=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('image');
      source = URL.createObjectURL(await response.blob());
    }
    const image = new Image();
    image.onload = () => { state.supportImage = image; render(); };
    image.src = source;
  } catch { toast('No se pudo cargar la imagen de apoyo.'); }
}

function renderVariants() {
  $('#variantList').innerHTML = state.variants.map((variant, index) => `<button class="variant ${index === state.selectedVariant ? 'active' : ''}" data-index="${index}" type="button"><span class="variant-dot" style="background:${variant.color_principal}">${index === 0 ? '★' : index + 1}</span><span><strong>${index === 0 ? 'Propuesta recomendada' : `Alternativa ${index}`}</strong><small>${variant.etiqueta} · ${variant.template_sugerido}</small></span>${index === 0 ? '<span class="recommended">Sugerida</span>' : ''}</button>`).join('');
  document.querySelectorAll('.variant').forEach(button => button.addEventListener('click', () => { state.selectedVariant = Number(button.dataset.index); syncEditor(); render(); }));
  renderTemplates();
}

function renderFormats() {
  $('#formatList').innerHTML = Object.entries(FORMATS).map(([key, format]) => `<button class="format ${state.format === key ? 'active' : ''}" type="button" data-format="${key}">${format.label}</button>`).join('');
  document.querySelectorAll('.format').forEach(button => button.addEventListener('click', () => { state.format = button.dataset.format; renderFormats(); render(); }));
}

function renderTemplates() {
  const source = activeVariant();
  const types = Object.values(PLATE_TYPES).filter(type => type.id === 'noticia' || (type.id === 'textual' && source?.textual?.verificada) || type.id === 'retrato-circular' || type.id === 'editorial-split');
  const current = state.selectedTemplate || source?.tipo_placa || 'noticia';
  $('#templateList').innerHTML = types.map(type => `<button type="button" class="template-option ${current === type.id ? 'active' : ''}" data-template="${type.id}">${type.label}</button>`).join('');
  document.querySelectorAll('.template-option').forEach(button => button.addEventListener('click', () => { state.selectedTemplate = button.dataset.template; syncEditor(); renderTemplates(); render(); }));
}

function renderImages() {
  const images = state.plate?.fuente?.imagenes || [];
  $('#imageList').innerHTML = images.length ? images.map((image, index) => `<button class="image-option ${index === state.imageIndex ? 'active' : ''}" type="button" data-image="${index}" title="Imagen ${index + 1}"><img src="${image}" alt=""></button>`).join('') : '<span class="image-empty">La noticia no tiene imágenes disponibles.</span>';
  $('#focusControls').classList.toggle('is-hidden', !images.length);
  renderFocus();
  document.querySelectorAll('.image-option').forEach(button => button.addEventListener('click', () => { state.imageIndex = Number(button.dataset.image); state.imagePositioned = true; renderImages(); loadImage(images[state.imageIndex]); }));
}

function renderFocus() { const focus = activeFocus(); $('#focusX').value = Math.round(focus.x * 100); $('#focusY').value = Math.round(focus.y * 100); $('#focusXValue').textContent = `${Math.round(focus.x * 100)}%`; $('#focusYValue').textContent = `${Math.round(focus.y * 100)}%`; }
function renderPeople() {
  const variant = effectiveVariant();
  const people = variant?.personas || [];
  $('#specialControls').classList.toggle('is-hidden', !['textual', 'retrato-circular', 'editorial-split'].includes(variant?.tipo_placa));
  $('#quoteInput').value = variant?.textual?.cita || '';
  $('#quoteAuthorInput').value = variant?.textual?.autor || '';
  $('#quoteRoleInput').value = variant?.textual?.cargo || '';
  $('#peopleList').innerHTML = people.length ? people.map(person => `<div class="person-row"><span class="person-dot" style="background:${variant.color_principal}"></span><div><input class="person-name" data-person="${person.id}" value="${person.nombre}" aria-label="Nombre de la persona"><input class="person-role" data-person="${person.id}" value="${person.rol || ''}" placeholder="Cargo o rol" aria-label="Cargo o rol"><small>${person.origen === 'subida' ? 'imagen subida' : 'imagen de la nota'}</small></div></div>`).join('') : '<small class="image-empty">No hay personas detectadas. Agregá una persona y subí su imagen.</small>';
  document.querySelectorAll('[data-person]').forEach(input => input.addEventListener('input', event => { const person = variant.personas.find(item => item.id === event.target.dataset.person); if (!person) return; if (event.target.classList.contains('person-name')) person.nombre = event.target.value; else person.rol = event.target.value; render(); }));
}
function renderSupportImages() {
  const source = activeVariant();
  const visible = state.selectedTemplate === 'editorial-split';
  $('#supportControls').classList.toggle('is-hidden', !visible);
  if (!visible) return;
  const current = source?.imagenes_apoyo || [];
  const options = [...current, ...(state.plate?.fuente?.imagenes || []).slice(1).filter(url => !current.some(item => item.src === url)).map((src, index) => ({ id: `nota-apoyo-${index + 1}`, src, origen: 'nota', foco: { x: 0.5, y: 0.5 } }))];
  $('#supportImageList').innerHTML = options.length ? options.map((item, index) => `<button type="button" class="support-image-option ${state.supportImageUrl === item.src ? 'active' : ''}" data-support-index="${index}" title="Imagen de apoyo ${index + 1}"><img src="${item.src}" alt=""></button>`).join('') : '<small class="image-empty">No hay otra imagen en la nota. Agregá una desde tu equipo.</small>';
  document.querySelectorAll('.support-image-option').forEach(button => button.addEventListener('click', async () => { const item = options[Number(button.dataset.supportIndex)]; source.imagenes_apoyo = [item]; state.supportImageUrl = item.src; state.supportFocus = item.foco; renderSupportImages(); await loadSupportImage(item.src); }));
}
function syncSocialCopies() { const variant = activeVariant(); const copies = variant?.redes || {}; const visible = Boolean(copies.instagram || copies.facebook); $('#socialCopies').classList.toggle('is-hidden', !visible); $('#instagramCopy').value = copies.instagram || ''; $('#facebookCopy').value = copies.facebook || ''; }
function syncEditor() { const variant = activeVariant(); if (!variant) return; $('#titleInput').value = variant.titulo || ''; $('#dekInput').value = variant.bajada || ''; syncSocialCopies(); renderFocus(); renderPeople(); renderSupportImages(); renderTemplates(); }
function setSocialText(network, value) { const current = activeVariant(); if (!current) return; current.redes = { ...(current.redes || {}), [network]: value }; if (state.plate === current) state.plate.redes = current.redes; }
async function copySocial(network) { const value = $(`#${network}Copy`).value.trim(); if (!value) return; try { await navigator.clipboard.writeText(value); toast(`Texto de ${network === 'instagram' ? 'Instagram' : 'Facebook'} copiado.`); } catch { toast('No se pudo copiar el texto.'); } }

function render() {
  const variant = effectiveVariant();
  if (!variant) return;
  const canvas = $('#plateCanvas');
  renderNewsPlate(canvas.getContext('2d'), variant, state.format, { image: state.image, focus: activeFocus(), logo: state.logo, personImages: state.personImages, supportImage: state.supportImage, supportFocus: state.supportFocus, forceCover: state.imagePositioned });
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
    state.selectedVariant = 0; state.selectedTemplate = state.plate.tipo_placa || 'noticia'; state.imageIndex = 0; state.personImages = {}; state.supportImage = null; state.supportImageUrl = ''; state.imagePositioned = true;
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
$('#quoteInput').addEventListener('input', event => { const variant = activeVariant(); if (!variant) return; variant.textual = { ...(variant.textual || {}), cita: event.target.value, verificada: Boolean(event.target.value.trim()) }; render(); });
$('#quoteAuthorInput').addEventListener('input', event => { const variant = activeVariant(); if (!variant) return; variant.textual = { ...(variant.textual || {}), autor: event.target.value }; render(); });
$('#quoteRoleInput').addEventListener('input', event => { const variant = activeVariant(); if (!variant) return; variant.textual = { ...(variant.textual || {}), cargo: event.target.value }; render(); });
$('#instagramCopy').addEventListener('input', event => setSocialText('instagram', event.target.value));
$('#facebookCopy').addEventListener('input', event => setSocialText('facebook', event.target.value));
document.querySelectorAll('.copy-social').forEach(button => button.addEventListener('click', () => copySocial(button.dataset.network)));
$('#focusX').addEventListener('input', event => setFocus('x', event.target.value));
$('#focusY').addEventListener('input', event => setFocus('y', event.target.value));
$('#downloadButton').addEventListener('click', download); $('#copyButton').addEventListener('click', copy);
$('#peopleUpload').addEventListener('change', event => {
  const variant = activeVariant();
  if (!variant) return;
  [...event.target.files].forEach((file, index) => {
    const person = variant.personas?.[index];
    if (!person) return;
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { state.personImages[person.id] = image; person.imagen = objectUrl; person.origen = 'subida'; renderPeople(); render(); };
    image.src = objectUrl;
  });
});
$('#addPersonButton').addEventListener('click', () => {
  const variant = activeVariant();
  if (!variant) return;
  const people = [...(variant.personas || []), { id: `persona-${(variant.personas || []).length + 1}`, nombre: 'Nueva persona', rol: '', imagen: '', origen: 'subida', foco: { x: 0.5, y: 0.5 } }];
  state.variants.forEach(item => { item.personas = people; });
  state.plate.personas = people;
  renderPeople();
  render();
});
$('#supportUpload').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  const variant = activeVariant();
  if (!file || !variant) return;
  const url = URL.createObjectURL(file);
  variant.imagenes_apoyo = [{ id: 'imagen-apoyo-subida', src: url, origen: 'subida', foco: { x: 0.5, y: 0.5 } }];
  state.supportImageUrl = url;
  state.supportFocus = { x: 0.5, y: 0.5 };
  renderSupportImages();
  await loadSupportImage(url);
});

const plateCanvas = $('#plateCanvas');
plateCanvas.title = 'Arrastrá la foto para ajustar el encuadre';
plateCanvas.addEventListener('pointerdown', event => {
  if (!activeVariant()) return;
  const bounds = plateCanvas.getBoundingClientRect();
  const point = {
    x: (event.clientX - bounds.left) * plateCanvas.width / bounds.width,
    y: (event.clientY - bounds.top) * plateCanvas.height / bounds.height,
  };
  const variant = effectiveVariant();
  if (variant.tipo_placa === 'retrato-circular' && variant.personas?.length) {
    const area = calculatePlateLayout(state.format, variant).portraits;
    const radius = Math.min(area.h * 0.48, plateCanvas.width * 0.105);
    const gap = radius * 2.12;
    const startX = area.x + area.w - radius - gap * (variant.personas.length - 1);
    const index = variant.personas.findIndex((person, personIndex) => {
      const cx = startX + gap * personIndex;
      const cy = area.y + area.h * 0.5;
      return Math.hypot(point.x - cx, point.y - cy) <= radius * 1.25;
    });
    if (index >= 0) {
      state.drag = { kind: 'person', person: variant.personas[index], clientX: event.clientX, clientY: event.clientY, focus: normalizeFocus(variant.personas[index].foco) };
      plateCanvas.setPointerCapture(event.pointerId);
      plateCanvas.classList.add('is-dragging');
      return;
    }
  }
  if (variant.tipo_placa === 'editorial-split' && state.supportImage && variant.imagenes_apoyo?.length) {
    const rect = calculatePlateLayout(state.format, variant).splitImage;
    if (point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h) {
      state.drag = { kind: 'support', clientX: event.clientX, clientY: event.clientY, focus: normalizeFocus(state.supportFocus) };
      plateCanvas.setPointerCapture(event.pointerId);
      plateCanvas.classList.add('is-dragging');
      return;
    }
  }
  const imageRect = calculatePlateLayout(state.format, variant).image;
  if (point.y < imageRect.y || point.y > imageRect.y + imageRect.h) return;
  state.drag = { clientX: event.clientX, clientY: event.clientY, focus: activeFocus() };
  state.imagePositioned = true;
  plateCanvas.setPointerCapture(event.pointerId);
  plateCanvas.classList.add('is-dragging');
});
plateCanvas.addEventListener('pointermove', event => {
  if (!state.drag) return;
  const bounds = plateCanvas.getBoundingClientRect();
  const dx = (event.clientX - state.drag.clientX) / bounds.width;
  const dy = (event.clientY - state.drag.clientY) / bounds.height;
  const variant = activeVariant();
  if (state.drag.kind === 'person') {
    state.drag.person.foco = normalizeFocus({ x: state.drag.focus.x - dx * 1.25, y: state.drag.focus.y - dy * 1.25 });
    render();
    return;
  }
  if (state.drag.kind === 'support') {
    state.supportFocus = normalizeFocus({ x: state.drag.focus.x - dx * 1.25, y: state.drag.focus.y - dy * 1.25 });
    const support = variant.imagenes_apoyo?.[0];
    if (support) support.foco = state.supportFocus;
    render();
    return;
  }
  const imageBlock = variant?.bloques?.find(block => block.tipo === 'imagen');
  if (!imageBlock) return;
  imageBlock.foco = normalizeFocus({ x: state.drag.focus.x - dx * 1.25, y: state.drag.focus.y - dy * 1.25 });
  render();
});
const stopDragging = () => { state.drag = null; plateCanvas.classList.remove('is-dragging'); };
plateCanvas.addEventListener('pointerup', stopDragging);
plateCanvas.addEventListener('pointercancel', stopDragging);
