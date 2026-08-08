import { loadReelSession } from './reel-session.mjs';
import { renderReelProject } from './reel-renderer.mjs';
import { parseReelHandoff } from './output-handoff.mjs';
import { createReelProject } from './reel-model.mjs';
import { updateSceneFocus } from './ui.mjs';

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const state = { session: null, sceneIndex: 0, image: null, imageUrl: '', logo: null, loading: false };
const $ = selector => document.querySelector(selector);

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
  state.image = null; state.imageUrl = url || '';
  if (!url) return;
  try {
    const response = await fetch(`${WORKER}?image=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('image');
    const image = new Image();
    image.onload = () => { state.image = image; render(); };
    image.src = URL.createObjectURL(await response.blob());
  } catch { $('#reelStatus').textContent = 'La noticia se cargó, pero su imagen no pudo descargarse.'; }
}

function renderList() {
  const scenes = state.session?.project?.scenes || [];
  $('#sceneList').innerHTML = scenes.map((scene, index) => `<button type="button" class="scene-button ${index === state.sceneIndex ? 'active' : ''}" data-scene="${index}"><strong>${index + 1}. ${scene.type === 'closure' ? 'Cierre' : scene.type.replace('-', ' ')}</strong><small>${scene.title || ''}</small></button>`).join('');
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => { state.sceneIndex = Number(button.dataset.scene); loadCurrentImage(); renderList(); render(); }));
}

async function loadCurrentImage() {
  const scene = state.session?.project?.scenes?.[state.sceneIndex];
  await loadImage(scene?.image || '');
}

function render() {
  const project = state.session?.project;
  if (!project) return;
  const scene = project.scenes[state.sceneIndex];
  renderReelProject($('#reelCanvas'), project, { image: state.image, logo: state.logo }, state.sceneIndex);
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
