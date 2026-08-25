import { buildExportCommand, exportEditorialVideo } from './video-export.mjs';
import { exportCloudinaryVideo } from './cloudinary-export.mjs';
import { createFfmpegRuntime, loadFfmpegRuntime } from './ffmpeg-runtime.mjs';
import { parseVideoHandoff, validateVideoFile } from './video-input.mjs';
import { getOverlayLayerPlan } from './video-overlay-layers.mjs';
import { createVideoProject } from './video-project.mjs';
import { drawEditorialLayer, drawVideoPreview } from './video-renderer.mjs';
import { TITLE_DURATION, createSpeakerMarker, normalizeSpeakerMarkers } from './video-speakers.mjs';
import { suggestClipWindows } from './video-suggestions.mjs';
import { buildClipProject, isClipWindow, clampTrim } from './video-clip.mjs';
import { transcribeVideo } from './video-transcribe.mjs';
import { clampTimelineTime, getTimelineRatio, stepTimelineTime } from './video-timeline.mjs';

const $ = selector => document.querySelector(selector);
const WORKER_URL = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const handoff = parseVideoHandoff(sessionStorage.getItem('mm-editorial-handoff'));
const state = { project: createVideoProject(handoff?.package), source: null, music: null, duration: 0, sourceUrl: '', downloadObjectUrl: '', ffmpeg: null, exporting: false, logo: null, transcript: [], transcriptWords: [], selectedClipIndex: null, trim: { start: 0, end: 0 } };
const canvas = $('#previewCanvas');
const ctx = canvas.getContext('2d');
const video = $('#sourceVideo');
const logo = new Image();
logo.onload = () => { state.logo = logo; draw(); };
logo.src = '../assets/logo.png';

hydrate();
initTimelineTrim();
if (handoff) { sessionStorage.removeItem('mm-editorial-handoff'); setStatus('Paquete editorial recibido. Subí el video fuente.'); }

$('#sourceInput').addEventListener('change', event => loadSource(event.target.files?.[0]));
$('#musicInput').addEventListener('change', event => { state.music = event.target.files?.[0] || null; setStatus(state.music ? 'Pista de música cargada.' : 'Elegí una pista para este modo.'); });
$('#profileInput').addEventListener('change', event => { state.project.profile = event.target.value; refreshSuggestions(); });
$('#formatInput').addEventListener('change', event => { state.project.format = event.target.value; setCanvasFormat(); draw(); });
$('#frameInput').addEventListener('change', event => { state.project.framing.mode = event.target.value; draw(); });
$('#audioInput').addEventListener('change', event => { state.project.audioMode = event.target.value; $('#musicWrap').classList.toggle('is-hidden', event.target.value === 'original'); });
$('#qualityInput').addEventListener('change', event => { state.project.exportQuality = event.target.value; });
for (const [id, key] of [['sectionInput', 'section'], ['titleInput', 'title'], ['sourceTextInput', 'source'], ['accentInput', 'accent']]) $("#" + id).addEventListener('input', event => { state.project.lowerThird[key] = event.target.value; $('#previewTitle').textContent = state.project.lowerThird.title || 'Video vertical'; draw(); });
$('#captionInput').addEventListener('input', event => { state.project.captions = event.target.value.trim() ? [{ start: 0, end: state.duration || Infinity, text: event.target.value.trim() }] : []; draw(); });
$('#suggestButton').addEventListener('click', proposeClips);
$('#useSelectionButton').addEventListener('click', useSelection);
$('#playButton').addEventListener('click', () => video.paused ? video.play() : video.pause());
$('#skipBackButton').addEventListener('click', () => seekBy(-5));
$('#skipForwardButton').addEventListener('click', () => seekBy(5));
$('#timelineInput').addEventListener('input', event => seekTo(event.target.value));
$('#addSpeakerButton').addEventListener('click', addSpeaker);
$('#exportButton').addEventListener('click', exportVideo);
video.addEventListener('loadedmetadata', () => { state.duration = video.duration; $('#sourceMeta').textContent = `${Math.round(video.videoWidth)}×${Math.round(video.videoHeight)} · ${formatTime(video.duration)} · el original se mantiene intacto.`; state.trim = { start: 0, end: Math.min(state.duration, 30) }; refreshSuggestions(); renderSuggestionMarkers(); renderTimelineSelection(); updateExportButton(); draw(); updateTimeline(); renderSpeakers(); setSpeakerControlsEnabled(true); $('#playButton').disabled = false; $('#skipBackButton').disabled = false; $('#skipForwardButton').disabled = false; $('#suggestButton').disabled = false; $('#exportButton').disabled = false; });
video.addEventListener('play', () => { $('#playButton').textContent = 'Pausar'; tick(); });
video.addEventListener('pause', () => { $('#playButton').textContent = 'Reproducir'; draw(); updateTimeline(); });
video.addEventListener('timeupdate', () => { draw(); updateTimeline(); });

function hydrate() {
  const data = state.project.lowerThird;
  $('#profileInput').value = state.project.profile; $('#formatInput').value = state.project.format; $('#frameInput').value = state.project.framing.mode; $('#audioInput').value = state.project.audioMode; $('#qualityInput').value = state.project.exportQuality;
  $('#sectionInput').value = data.section; $('#titleInput').value = data.title; $('#sourceTextInput').value = data.source; $('#accentInput').value = data.accent; $('#previewTitle').textContent = data.title || 'Video vertical';
  renderSpeakers(); updateTimeline();
}

function loadSource(file) {
  const check = validateVideoFile(file);
  if (!check.ok) return setStatus(check.error);
  clearDownload();
  if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
  state.duration = 0; state.project.speakers = []; clearSpeakerError(); renderSpeakers(); updateTimeline(); setSpeakerControlsEnabled(false);
  state.transcript = []; state.transcriptWords = []; state.selectedClipIndex = null; state.trim = { start: 0, end: 0 };
  state.source = file; state.sourceUrl = URL.createObjectURL(file); video.src = state.sourceUrl; video.load(); setStatus('Leyendo el video local…');
}

function refreshSuggestions() {
  const clips = suggestClipWindows({ duration: state.duration, profile: state.project.profile, transcript: state.transcript, words: state.transcriptWords });
  state.project.clips = clips;
  renderClipList(clips);
  renderSuggestionMarkers();
  if (!state.transcript.length && state.duration >= 20) setStatus('Pulsá "Proponer clips" para sugerir cortes según el contenido del video.');
}

async function proposeClips() {
  if (state.exporting) return;
  if (!state.duration) return setStatus('Cargá un video antes de proponer clips.');
  if (state.duration < 20) { refreshSuggestions(); return setStatus('El video debe tener al menos 20 segundos para sugerir clips.'); }
  const button = $('#suggestButton');
  button.disabled = true;
  try {
    if (!state.transcript.length) {
      setStatus('Transcribiendo el audio para entender el contenido…');
      const result = await transcribeVideo({
        workerUrl: WORKER_URL,
        file: state.source,
        onStage: stage => setStatus(stage === 'extrayendo-audio' ? 'Extrayendo el audio del video…' : 'Transcribiendo el contenido…'),
        onProgress: ratio => setStatus(`Transcribiendo el contenido… ${Math.round(ratio * 100)}%`),
      });
      state.transcript = Array.isArray(result.segments) ? result.segments : [];
      state.transcriptWords = Array.isArray(result.words) ? result.words : [];
    }
    refreshSuggestions();
    if (!state.project.clips.length) setStatus('No se encontraron fragmentos de al menos 20 segundos. Probá con otro perfil.');
    else setStatus(`Se encontraron ${state.project.clips.length} clip(s) sugeridos por contenido. Selecciona uno para previsualizarlo.`);
  } catch (error) {
    setStatus(error.message || 'No se pudo transcribir el video. Se usan ventanas de referencia.');
    refreshSuggestions();
  } finally {
    button.disabled = false;
  }
}

function renderClipList(clips) {
  const list = $('#clipList');
  list.replaceChildren();
  if (!clips.length) {
    const empty = document.createElement('span');
    empty.textContent = state.duration >= 20 ? 'Sin cortes sugeridos todavía.' : 'El video debe tener al menos 20 segundos para sugerir clips.';
    list.append(empty);
    return;
  }
  clips.forEach((clip, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `vv-clip${index === state.selectedClipIndex ? ' is-selected' : ''}`;
    item.dataset.index = String(index);
    item.innerHTML = `<span class="vv-clip-index">${index + 1}</span><span class="vv-clip-range">${formatTime(clip.start)}–${formatTime(clip.end)}</span><span class="vv-clip-label">${clip.label || 'Fragmento sugerido'}</span>`;
    item.addEventListener('click', () => selectClip(index));
    list.append(item);
  });
}

function selectClip(index) {
  clearDownload();
  state.selectedClipIndex = state.selectedClipIndex === index ? null : index;
  const clip = state.project.clips[state.selectedClipIndex];
  for (const item of $('#clipList').children) item.classList.toggle('is-selected', Number(item.dataset.index) === state.selectedClipIndex);
  for (const marker of $('#suggestionMarkers').children) marker.classList.toggle('is-selected', Number(marker.dataset.index) === state.selectedClipIndex);
  if (clip) {
    state.trim = { start: clip.start, end: clip.end };
    seekTo(clip.start);
    video.pause();
    setStatus(`Clip seleccionado: ${formatTime(clip.start)}–${formatTime(clip.end)}. Ajustá los handles o exportalo como MP4 vertical.`);
  } else {
    state.trim = { start: 0, end: Math.min(state.duration, 30) };
    setStatus(state.project.clips.length ? 'Seleccioná un clip sugerido o ajustá los handles para definir el recorte.' : 'Sin cortes sugeridos.');
  }
  renderTimelineSelection();
  updateExportButton();
}

function getActiveRange() {
  const clip = state.selectedClipIndex !== null ? state.project.clips[state.selectedClipIndex] : null;
  return clip ? { start: clip.start, end: clip.end } : state.trim;
}

function setActiveRange(start, end) {
  const duration = state.duration || 0;
  const ordered = clampTrim({ start, end }, duration);
  if (state.selectedClipIndex !== null && state.project.clips[state.selectedClipIndex]) {
    state.project.clips[state.selectedClipIndex].start = ordered.start;
    state.project.clips[state.selectedClipIndex].end = ordered.end;
  } else {
    state.trim = ordered;
  }
  renderTimelineSelection();
}

function renderTimelineSelection() {
  const duration = state.duration || 0;
  if (!duration) return;
  const range = getActiveRange();
  const startRatio = getTimelineRatio(range.start, duration);
  const endRatio = getTimelineRatio(range.end, duration);
  $('#timelineSelection').style.left = `${startRatio * 100}%`;
  $('#timelineSelection').style.width = `${(endRatio - startRatio) * 100}%`;
  $('#trimHandleStart').style.left = `${startRatio * 100}%`;
  $('#trimHandleEnd').style.left = `${endRatio * 100}%`;
  $('#useSelectionButton').disabled = !state.source;
}

function renderSuggestionMarkers() {
  const markers = $('#suggestionMarkers');
  markers.replaceChildren();
  const duration = state.duration || 0;
  if (!duration) return;
  state.project.clips.forEach((clip, index) => {
    const marker = document.createElement('span');
    marker.className = 'vv-suggestion-marker';
    marker.dataset.index = String(index);
    marker.style.left = `${getTimelineRatio(clip.start, duration) * 100}%`;
    marker.title = `Ir al clip ${index + 1}: ${formatTime(clip.start)}–${formatTime(clip.end)}`;
    marker.addEventListener('click', () => selectClip(index));
    markers.append(marker);
  });
}

function timeFromClientX(clientX) {
  const track = $('#timelineTrack');
  const rect = track.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  return clampTimelineTime(ratio * state.duration, state.duration);
}

function startHandleDrag(which) {
  return event => {
    event.preventDefault();
    const move = moveEvent => {
      const time = timeFromClientX(moveEvent.clientX);
      const range = getActiveRange();
      if (which === 'start') setActiveRange(Math.min(time, range.end - 0.5), range.end);
      else setActiveRange(range.start, Math.max(time, range.start + 0.5));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
}

function initTimelineTrim() {
  $('#trimHandleStart').addEventListener('pointerdown', startHandleDrag('start'));
  $('#trimHandleEnd').addEventListener('pointerdown', startHandleDrag('end'));
}

function useSelection() {
  const range = getActiveRange();
  if (range.end - range.start < 1) return setStatus('Seleccioná un rango válido (al menos 1 segundo) para el clip.');
  const start = range.start;
  const end = range.end;
  let index = state.project.clips.findIndex(clip => Math.abs(clip.start - start) < 0.5 && Math.abs(clip.end - end) < 0.5);
  if (index === -1) {
    index = state.project.clips.length;
    state.project.clips.push({ id: `clip-${index}`, start, end, label: `Clip ${index + 1} (manual)`, reason: 'Selección manual en la timeline' });
  }
  state.selectedClipIndex = index;
  state.trim = { start, end };
  renderClipList(state.project.clips);
  renderSuggestionMarkers();
  renderTimelineSelection();
  updateExportButton();
  setStatus(`Clip ${index + 1} listo (${formatTime(start)}–${formatTime(end)}). Exportalo como MP4 vertical.`);
}

function updateExportButton() {
  const button = $('#exportButton');
  if (!button) return;
  if (state.selectedClipIndex !== null && isClipWindow(state.project.clips[state.selectedClipIndex])) {
    button.textContent = `Exportar clip ${state.selectedClipIndex + 1}`;
  } else {
    button.textContent = 'Exportar MP4';
  }
}

function draw() { if (video.readyState >= 2) drawVideoPreview(ctx, video, state.project, { time: video.currentTime, logo: state.logo }); else { ctx.fillStyle = '#101712'; ctx.fillRect(0, 0, canvas.width, canvas.height); } }
function tick() { if (!video.paused) { draw(); updateTimeline(); requestAnimationFrame(tick); } }

function seekBy(seconds) { seekTo(stepTimelineTime(video.currentTime, seconds, state.duration)); }
function seekTo(time) { if (!state.duration) return; video.currentTime = clampTimelineTime(time, state.duration); draw(); updateTimeline(); }

function updateTimeline() {
  const duration = Math.max(0, Number(state.duration) || 0);
  const current = clampTimelineTime(video.currentTime, duration);
  const ratio = getTimelineRatio(current, duration);
  const timeline = $('#timelineInput');
  timeline.max = duration; timeline.value = current; timeline.setAttribute('aria-valuemax', String(duration)); timeline.setAttribute('aria-valuenow', String(current));
  $('#timelineProgress').style.width = `${ratio * 100}%`;
  $('#timeDisplay').textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  for (const pin of $('#speakerPins').children) pin.classList.toggle('is-active', current >= Number(pin.dataset.start) && current < Number(pin.dataset.start) + Number(pin.dataset.duration));
}

function setSpeakerControlsEnabled(enabled) {
  for (const id of ['speakerNameInput', 'speakerRoleInput', 'addSpeakerButton', 'timelineInput']) $(`#${id}`).disabled = !enabled;
}

function addSpeaker() {
  clearSpeakerError();
  if (!state.source || !state.duration) return setSpeakerError('Cargá un video antes de agregar una persona.');
  if (!video.paused) return setSpeakerError('Pausá el video en el momento en que querés mostrar el rótulo.');
  const name = $('#speakerNameInput').value.trim();
  if (!name) return setSpeakerError('Ingresá el nombre de la persona.');
  try {
    const marker = createSpeakerMarker({ start: video.currentTime, name, role: $('#speakerRoleInput').value }, state.duration);
    state.project.speakers = normalizeSpeakerMarkers([...state.project.speakers, marker], state.duration);
    $('#speakerNameInput').value = ''; $('#speakerRoleInput').value = ''; renderSpeakers(); draw(); updateTimeline();
  } catch (error) { setSpeakerError(error.message || 'No se pudo agregar la persona.'); }
}

function renderSpeakers() {
  const list = $('#speakerList'); list.replaceChildren();
  if (!state.project.speakers.length) { const empty = document.createElement('li'); empty.className = 'vv-empty-speakers'; empty.textContent = state.source ? 'Todavía no agregaste personas.' : 'Cargá un video para agregar personas.'; list.append(empty); renderSpeakerPins(); return; }
  for (const marker of state.project.speakers) {
    const item = document.createElement('li'); item.className = 'vv-speaker-item';
    const name = speakerField('Nombre', 'text', marker.name, 48); const role = speakerField('Rol', 'text', marker.role, 72); const start = speakerField('Inicio', 'number', marker.start, null);
    start.input.min = String(TITLE_DURATION); start.input.max = String(state.duration); start.input.step = '0.01'; start.field.classList.add('vv-speaker-time');
    for (const input of [name.input, role.input, start.input]) input.addEventListener('change', () => updateSpeaker(marker.id, { name: name.input.value, role: role.input.value, start: start.input.value }));
    const remove = document.createElement('button'); remove.className = 'mm-btn mm-btn-sm vv-speaker-delete'; remove.type = 'button'; remove.textContent = 'Eliminar'; remove.addEventListener('click', () => { state.project.speakers = state.project.speakers.filter(speaker => speaker.id !== marker.id); clearSpeakerError(); renderSpeakers(); draw(); updateTimeline(); });
    item.append(name.field, role.field, start.field, remove); list.append(item);
  }
  renderSpeakerPins();
}

function speakerField(label, type, value, maxLength) {
  const field = document.createElement('div'); field.className = 'vv-speaker-field'; const caption = document.createElement('label'); caption.textContent = label; const input = document.createElement('input'); input.className = 'mm-input'; input.type = type; input.value = value; if (maxLength) input.maxLength = maxLength; field.append(caption, input); return { field, input };
}

function updateSpeaker(id, changes) {
  clearSpeakerError();
  const current = state.project.speakers.find(marker => marker.id === id);
  if (!current) return;
  if (!String(changes.name || '').trim()) return setSpeakerError('El nombre de la persona es obligatorio.');
  try {
    const marker = createSpeakerMarker({ ...current, ...changes }, state.duration);
    state.project.speakers = normalizeSpeakerMarkers(state.project.speakers.map(item => item.id === id ? marker : item), state.duration);
    renderSpeakers(); draw(); updateTimeline();
  } catch (error) { setSpeakerError(error.message || 'No se pudo actualizar la persona.'); renderSpeakers(); }
}

function renderSpeakerPins() {
  const pins = $('#speakerPins'); pins.replaceChildren();
  for (const marker of state.project.speakers) { const pin = document.createElement('span'); pin.className = 'vv-speaker-pin'; pin.dataset.start = marker.start; pin.dataset.duration = marker.duration; pin.style.left = `${getTimelineRatio(marker.start, state.duration) * 100}%`; pins.append(pin); }
}

function setSpeakerError(message) { $('#speakerError').textContent = message; }
function clearSpeakerError() { setSpeakerError(''); }

async function exportVideo() {
  if (!state.source || state.exporting) return;
  if (state.project.audioMode !== 'original' && !state.music) return setStatus('Elegí una pista de música o volvé a audio original.');
  const clip = state.selectedClipIndex !== null ? state.project.clips[state.selectedClipIndex] : null;
  const useClip = clip && isClipWindow(clip);
  clearDownload(); state.exporting = true; $('#exportButton').disabled = true;
  try {
    setStatus('Preparando las capas editoriales…');
    const layers = await overlayLayers(useClip ? buildClipProject(state.project, clip) : state.project);
    if (!useClip && state.project.exportQuality === 'rapido') {
      if (state.project.audioMode !== 'original') throw new Error('La exportación rápida remota conserva el audio original. Para música o mezcla usá Alta calidad.');
      const result = await exportCloudinaryVideo({
        workerUrl: WORKER_URL,
        source: state.source,
        layers,
        format: state.project.format,
        framingMode: state.project.framing.mode,
        onStage: stage => setStatus(remoteExportStatus(stage)),
      });
      showDownload(result.downloadUrl); setStatus('MP4 listo. Usá el botón Descargar MP4.');
      return;
    }
    const ffmpeg = await loadFfmpeg();
    const quality = state.project.exportQuality === 'rapido' ? 'rapido' : 'alta';
    setStatus(useClip ? `Exportando clip ${state.selectedClipIndex + 1}… 0%` : 'Exportando MP4 vertical… 0%');
    const result = await exportEditorialVideo({
      ffmpeg,
      source: state.source,
      layers,
      music: state.music,
      audioMode: state.project.audioMode,
      width: canvas.width,
      height: canvas.height,
      quality,
      trim: useClip ? { start: clip.start, end: clip.end } : null,
      onStage: stage => setStatus(stage === 'copiando' ? 'Copiando el video a memoria…' : stage === 'componiendo' ? (useClip ? 'Recortando y componiendo el clip…' : 'Componiendo el video…') : 'Preparando la descarga…'),
      onProgress: ratio => setStatus(`Componiendo el video… ${Math.round(ratio * 100)}%`),
    });
    showDownload(URL.createObjectURL(result), { objectUrl: true, nameSuffix: useClip ? `-clip${state.selectedClipIndex + 1}` : '' });
    setStatus(useClip ? `Clip ${state.selectedClipIndex + 1} listo. Usá el botón Descargar MP4.` : 'MP4 listo. Usá el botón Descargar MP4.');
  } catch (error) { setStatus(error.message || 'No se pudo exportar el video.'); }
  finally { state.exporting = false; $('#exportButton').disabled = false; }
}

async function overlayLayers(project = state.project) {
  return Promise.all(getOverlayLayerPlan(project).map(async layer => ({ ...layer, blob: await layerBlob(layer) })));
}

function layerBlob(layer) {
  return new Promise((resolve, reject) => {
    const overlay = document.createElement('canvas');
    overlay.width = canvas.width; overlay.height = canvas.height;
    drawEditorialLayer(overlay.getContext('2d'), state.project, layer, { logo: state.logo });
    overlay.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo crear una capa editorial.')), 'image/png');
  });
}

function setCanvasFormat() { canvas.width = 1080; canvas.height = state.project.format === '4:5' ? 1350 : 1920; }

async function loadFfmpeg() {
  if (state.ffmpeg) return state.ffmpeg;
  const runtime = createFfmpegRuntime({ FFmpeg: window.FFmpegWASM?.FFmpeg });
  await loadFfmpegRuntime(runtime); state.ffmpeg = runtime; return runtime;
}

function formatTime(value) { const seconds = Math.max(0, Math.floor(Number(value) || 0)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
function setStatus(value) { $('#status').textContent = value; }
function remoteExportStatus(stage) { return ({ preparando: 'Preparando la exportación remota…', 'subiendo-video': 'Subiendo el video…', 'subiendo-capas': 'Subiendo las capas editoriales…', renderizando: 'Generando MP4 en Cloudinary…', esperando: 'Generando MP4 en Cloudinary…' })[stage] || 'Generando MP4…'; }
function showDownload(url, { objectUrl = false, nameSuffix = '' } = {}) { const link = $('#downloadLink'); link.href = url; link.download = `mediamendoza-vertical${nameSuffix}-${Date.now()}.mp4`; state.downloadObjectUrl = objectUrl ? url : ''; link.classList.remove('is-hidden'); }
function clearDownload() { const link = $('#downloadLink'); if (state.downloadObjectUrl) URL.revokeObjectURL(state.downloadObjectUrl); state.downloadObjectUrl = ''; link.removeAttribute('href'); link.classList.add('is-hidden'); }

export { buildExportCommand };
