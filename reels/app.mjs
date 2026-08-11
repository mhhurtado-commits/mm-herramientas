import { loadReelSession } from './reel-session.mjs';
import { renderReelProject } from './reel-renderer.mjs';
import { exportReelVideo } from './reel-video-export.mjs';
import { parseReelHandoff } from './output-handoff.mjs';
import { createReelProject } from './reel-model.mjs';
import { updateSceneFocus } from './ui.mjs';
import { resolveCategoryAccent } from '../shared/editorial-taxonomy.mjs';
import { generateEditorialOutputs } from '../placas-v2/editorial-output-generation.mjs';

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const state = { session: null, sceneIndex: 0, image: null, imageUrl: '', imageRequestId: 0, logo: null, loading: false, exporting: false };
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
  const enriched = await generateEditorialOutputs(data.paquete, outputs, { generateJson: generateSocialJson });
  return {
    ...data,
    paquete: enriched.package,
    warnings: [...(Array.isArray(data.warnings) ? data.warnings : []), ...enriched.warnings],
  };
}

async function loadImage(url) {
  const requestId = ++state.imageRequestId;
  state.image = null; state.imageUrl = url || '';
  if (!url) return;
  if (/^(data:|blob:)/i.test(url)) {
    const image = new Image();
    image.onload = () => {
      if (requestId !== state.imageRequestId || state.imageUrl !== url) return;
      state.image = image;
      render();
    };
    image.src = url;
    return;
  }
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

function renderSceneImageControls() {
  const control = $('#sceneImageControls');
  const scene = state.session?.project?.scenes?.[state.sceneIndex];
  if (!control) return;
  const enabled = Boolean(scene && scene.type !== 'closure' && scene.type !== 'cover');
  control.classList.toggle('is-hidden', !enabled);
  if (!enabled) { control.innerHTML = ''; return; }
  control.innerHTML = '<label for="sceneImageInput">Imagen de apoyo</label><div class="scene-image-actions"><input id="sceneImageInput" type="file" accept="image/*"><button id="clearSceneImage" type="button" class="secondary">Quitar</button></div><small>Opcional para esta escena interna.</small>';
  $('#sceneImageInput').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      scene.image = String(reader.result || '');
      scene.imageMode = 'contain-blur';
      scene.focus = { x: 0.5, y: 0.5 };
      await loadImage(scene.image);
      renderList();
      render();
    };
    reader.readAsDataURL(file);
  });
  $('#clearSceneImage').addEventListener('click', async () => {
    scene.image = '';
    scene.imageMode = 'text';
    await loadImage('');
    renderList();
    render();
  });
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
  renderSceneImageControls();
  renderReelProject($('#reelCanvas'), project, { image: state.image, imageUrl: state.imageUrl, logo: state.logo }, state.sceneIndex);
  $('#sceneTitle').textContent = scene?.title || 'Escena';
  $('#sceneCounter').textContent = `${state.sceneIndex + 1} / ${project.scenes.length}`;
  $('#dragHint').classList.toggle('is-hidden', !state.image || scene?.type === 'closure');
}

$('#reelForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (state.loading) return;
  state.loading = true; $('#reelStatus').textContent = 'Extrayendo y armando el reel…'; setExportButtons(true);
  try { state.session = await loadReelSession($('#reelUrl').value, { extract, generate }); state.sceneIndex = 0; renderList(); await loadCurrentImage(); render(); $('#downloadButton').disabled = false; $('#reelStatus').textContent = 'Elegí una escena. Podés arrastrar la imagen dentro del canvas.'; }
  catch (error) { $('#reelStatus').textContent = error.message || 'No se pudo generar el reel.'; }
  finally { state.loading = false; setExportButtons(false); }
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

$('#downloadVideoButton').addEventListener('click', async () => {
  if (!state.session?.project || state.exporting) return;
  state.exporting = true;
  setExportButtons(true);
  $('#reelStatus').textContent = 'Renderizando Reel sin audio...';
  try {
    const project = state.session.project;
    const sceneCanvases = await prepareSceneCanvases(project);
    const canvas = $('#reelCanvas');
    const result = await exportReelVideo({
      canvas,
      project,
      renderFrame: transition => drawVideoFrame(canvas, sceneCanvases, transition),
      onProgress: progress => { $('#reelStatus').textContent = `Renderizando Reel sin audio... ${Math.round(progress * 100)}%`; },
    });
    const link = document.createElement('a');
    link.download = `reel-mediamendoza-${Date.now()}.webm`;
    link.href = URL.createObjectURL(result.blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    $('#reelStatus').textContent = `Reel descargado en WebM, ${Math.round(result.durationMs / 100) / 10}s, sin audio.`;
  } catch (error) {
    $('#reelStatus').textContent = error.message || 'No se pudo exportar el Reel.';
  } finally {
    state.exporting = false;
    setExportButtons(false);
  }
});

function setExportButtons(exporting) {
  const hasProject = Boolean(state.session?.project);
  $('#downloadButton').disabled = exporting || !hasProject;
  $('#downloadVideoButton').disabled = exporting || !hasProject;
}

async function prepareSceneCanvases(project) {
  const canvases = [];
  for (let index = 0; index < project.scenes.length; index += 1) {
    const scene = project.scenes[index];
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1920;
    const image = await loadImageForVideo(scene.image);
    renderReelProject(canvas, project, { image, imageUrl: scene.image, logo: state.logo }, index);
    canvases.push(canvas);
  }
  return canvases;
}

async function loadImageForVideo(url) {
  if (!url) return null;
  try {
    const image = new Image();
    if (/^(data:|blob:)/i.test(url)) {
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      return image;
    }
    const response = await fetch(`${WORKER}?image=${encodeURIComponent(url)}`);
    if (!response.ok) return null;
    image.src = URL.createObjectURL(await response.blob());
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
    return image;
  } catch { return null; }
}

function drawVideoFrame(canvas, sceneCanvases, transition) {
  const ctx = canvas.getContext('2d');
  const from = sceneCanvases[transition?.from] || sceneCanvases[0];
  const to = sceneCanvases[transition?.to] || from;
  if (!from) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!transition || transition.from === transition.to || transition.progress <= 0) {
    ctx.drawImage(from, 0, 0);
    return;
  }
  const progress = transition.progress;
  ctx.save(); ctx.globalAlpha = 1; ctx.drawImage(from, 0, -Math.round(progress * 18)); ctx.restore();
  ctx.save(); ctx.globalAlpha = progress; ctx.drawImage(to, 0, Math.round((1 - progress) * 18)); ctx.restore();
}

const handoff = parseReelHandoff(sessionStorage.getItem('mm-editorial-handoff'));
if (handoff?.package) {
  state.session = { package: handoff.package, project: createReelProject(handoff.package) };
  sessionStorage.removeItem('mm-editorial-handoff');
  renderList(); loadCurrentImage().then(render);
  setExportButtons(false);
  $('#reelStatus').textContent = 'Paquete recibido desde Placas V2. Elegí una escena para editarla.';
}
