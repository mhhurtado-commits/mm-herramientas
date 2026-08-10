import { loadReelSession } from './reel-session.mjs';
import { renderReelProject } from './reel-renderer.mjs';
import { parseReelHandoff } from './output-handoff.mjs';
import { createReelProject } from './reel-model.mjs';
import { updateSceneFocus } from './ui.mjs';
import { resolveCategoryAccent } from '../shared/editorial-taxonomy.mjs';

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const state = { session: null, sceneIndex: 0, image: null, imageUrl: '', imageRequestId: 0, logo: null, loading: false };
const $ = selector => document.querySelector(selector);
const CATEGORY_COLORS = { actualidad: '#a8d432', policiales: '#c7474f', sociales: '#bd7125', sociedad: '#bd7125', politica: '#6650a4', economía: '#187f72', economia: '#187f72', deportes: '#148a78', clima: '#4d8fb8', general: '#a8d432' };

const logo = new Image();
logo.onload = () => { state.logo = logo; render(); };
logo.src = '../assets/logo.png';

async function extract(url) {
  const response = await fetch(`${WORKER}?url=${encodeURIComponent(url)}`);
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'No se pudo extraer la noticia.');
  return data;
}

async function generate(note, outputs) {
  const response = await fetch(`${WORKER}/placas/v2/paquete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nota: note, salidas: outputs }) });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'No se pudo generar el paquete editorial.');
  return data;
}

async function loadImage(url) {
  const requestId = ++state.imageRequestId;
  state.image = null; state.imageUrl = url || '';
  if (!url) return;
  try {
    const response = await fetch(`${WORKER}?image=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('image');
    const image = new Image();
    image.onload = () => {
      if (requestId !== state.imageRequestId || state.imageUrl !== url) return;
      state.image = image;
      render();
    };
    image.src = URL.createObjectURL(await response.blob());
  } catch { $('#reelStatus').textContent = 'La noticia se cargó, pero su imagen no pudo descargarse.'; }
}

function renderList() {
  const scenes = state.session?.project?.scenes || [];
  $('#sceneList').innerHTML = scenes.map((scene, index) => `<button type="button" class="scene-button ${index === state.sceneIndex ? 'active' : ''}" data-scene="${index}"><strong>${index + 1}. ${scene.type === 'closure' ? 'Cierre' : scene.type.replace('-', ' ')}</strong><small>${scene.title || ''}</small></button>`).join('');
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => { state.sceneIndex = Number(button.dataset.scene); loadCurrentImage(); renderList(); render(); }));
  renderCategoryControls();
}

function renderCategoryControls() {
  const control = $('#categoryControls');
  const options = state.session?.project?.categoryOptions || [];
  if (!control) return;
  control.classList.toggle('is-hidden', options.length < 2);
  if (options.length < 2) { control.innerHTML = ''; return; }
  control.innerHTML = `<label for="reelCategory">Categoría editorial</label><select id="reelCategory" class="category-select">${options.map(option => `<option value="${option.id}" ${option.id === state.session.project.selectedCategoryId ? 'selected' : ''}>${option.label}</option>`).join('')}</select>`;
  $('#reelCategory').addEventListener('change', event => selectCategory(event.target.value));
}

function selectCategory(id) {
  const project = state.session?.project;
  const option = project?.categoryOptions?.find(item => item.id === id);
  if (!project || !option) return;
  const key = option.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const accent = resolveCategoryAccent(option);
  project.selectedCategoryId = option.id;
  project.sectionLabel = option.label;
  project.section = key;
  project.accent = accent;
  project.scenes.forEach(scene => { scene.section = option.label; scene.accent = accent; });
  renderList();
  render();
}

async function loadCurrentImage() {
  const scene = state.session?.project?.scenes?.[state.sceneIndex];
  await loadImage(scene?.image || '');
}

function render() {
  const project = state.session?.project;
  if (!project) return;
  const scene = project.scenes[state.sceneIndex];
  renderReelProject($('#reelCanvas'), project, { image: state.image, imageUrl: state.imageUrl, logo: state.logo }, state.sceneIndex);
  $('#sceneTitle').textContent = scene?.title || 'Escena';
  $('#sceneCounter').textContent = `${state.sceneIndex + 1} / ${project.scenes.length}`;
  $('#dragHint').classList.toggle('is-hidden', !state.image || scene?.type === 'closure');
}

$('#reelForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (state.loading) return;
  state.loading = true; $('#reelStatus').textContent = 'Extrayendo y armando el reel…'; $('#downloadButton').disabled = true;
  try { state.session = await loadReelSession($('#reelUrl').value, { extract, generate }); state.sceneIndex = 0; renderList(); await loadCurrentImage(); render(); $('#downloadButton').disabled = false; $('#reelStatus').textContent = 'Elegí una escena. Podés arrastrar la imagen dentro del canvas.'; }
  catch (error) { $('#reelStatus').textContent = error.message || 'No se pudo generar el reel.'; }
  finally { state.loading = false; }
});

$('#reelCanvas').addEventListener('pointerdown', event => {
  const scene = state.session?.project?.scenes?.[state.sceneIndex];
  if (!scene || !state.image || scene.type === 'closure') return;
  event.currentTarget.setPointerCapture(event.pointerId);
  state.drag = { x: event.clientX, y: event.clientY, focus: { ...scene.focus } };
});
$('#reelCanvas').addEventListener('pointermove', event => {
  if (!state.drag) return;
  const canvas = event.currentTarget; const scene = state.session.project.scenes[state.sceneIndex];
  scene.focus = { ...state.drag.focus };
  updateSceneFocus(scene, { x: event.clientX - state.drag.x, y: event.clientY - state.drag.y }, canvas.clientWidth); render();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(type => $('#reelCanvas').addEventListener(type, () => { state.drag = null; }));

$('#downloadButton').addEventListener('click', () => { const canvas = $('#reelCanvas'); const link = document.createElement('a'); link.download = `reel-${state.sceneIndex + 1}.png`; link.href = canvas.toDataURL('image/png'); link.click(); });

const handoff = parseReelHandoff(sessionStorage.getItem('mm-editorial-handoff'));
if (handoff?.package) {
  state.session = { package: handoff.package, project: createReelProject(handoff.package) };
  sessionStorage.removeItem('mm-editorial-handoff');
  renderList(); loadCurrentImage().then(render);
  $('#downloadButton').disabled = false;
  $('#reelStatus').textContent = 'Paquete recibido desde Placas V2. Elegí una escena para editarla.';
}
