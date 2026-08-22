import { buildExportCommand, exportEditorialVideo } from './video-export.mjs';
import { createFfmpegRuntime, loadFfmpegRuntime } from './ffmpeg-runtime.mjs';
import { parseVideoHandoff, validateVideoFile } from './video-input.mjs';
import { createVideoProject } from './video-project.mjs';
import { drawEditorialOverlay, drawVideoPreview } from './video-renderer.mjs';
import { suggestClipWindows } from './video-suggestions.mjs';

const $ = selector => document.querySelector(selector);
const handoff = parseVideoHandoff(sessionStorage.getItem('mm-editorial-handoff'));
const state = { project: createVideoProject(handoff?.package), source: null, music: null, duration: 0, sourceUrl: '', ffmpeg: null, exporting: false, logo: null };
const canvas = $('#previewCanvas');
const ctx = canvas.getContext('2d');
const video = $('#sourceVideo');
const logo = new Image();
logo.onload = () => { state.logo = logo; draw(); };
logo.src = '../assets/logo.png';

hydrate();
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
$('#suggestButton').addEventListener('click', refreshSuggestions);
$('#playButton').addEventListener('click', () => video.paused ? video.play() : video.pause());
$('#exportButton').addEventListener('click', exportVideo);
video.addEventListener('loadedmetadata', () => { state.duration = video.duration; $('#sourceMeta').textContent = `${Math.round(video.videoWidth)}×${Math.round(video.videoHeight)} · ${formatTime(video.duration)} · el original se mantiene intacto.`; refreshSuggestions(); draw(); $('#playButton').disabled = false; $('#suggestButton').disabled = false; $('#exportButton').disabled = false; });
video.addEventListener('play', () => { $('#playButton').textContent = 'Pausar'; tick(); });
video.addEventListener('pause', () => { $('#playButton').textContent = 'Reproducir'; draw(); });
video.addEventListener('timeupdate', draw);

function hydrate() {
  const data = state.project.lowerThird;
  $('#profileInput').value = state.project.profile; $('#formatInput').value = state.project.format; $('#frameInput').value = state.project.framing.mode; $('#audioInput').value = state.project.audioMode; $('#qualityInput').value = state.project.exportQuality;
  $('#sectionInput').value = data.section; $('#titleInput').value = data.title; $('#sourceTextInput').value = data.source; $('#accentInput').value = data.accent; $('#previewTitle').textContent = data.title || 'Video vertical';
}

function loadSource(file) {
  const check = validateVideoFile(file);
  if (!check.ok) return setStatus(check.error);
  if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
  state.source = file; state.sourceUrl = URL.createObjectURL(file); video.src = state.sourceUrl; video.load(); setStatus('Leyendo el video local…');
}

function refreshSuggestions() {
  state.project.clips = suggestClipWindows({ duration: state.duration, profile: state.project.profile, transcript: [] });
  $('#clipList').innerHTML = state.project.clips.length ? state.project.clips.map((clip, index) => `<span class="vv-clip">${index + 1}. ${formatTime(clip.start)}–${formatTime(clip.end)}</span>`).join('') : '<span>El video debe tener al menos 20 segundos para sugerir clips.</span>';
  if (state.project.profile === 'hablado') setStatus('Candidatos iniciales listos. La transcripción se integrará cuando el Worker esté disponible.');
}

function draw() { if (video.readyState >= 2) drawVideoPreview(ctx, video, state.project, { time: video.currentTime, logo: state.logo }); else { ctx.fillStyle = '#101712'; ctx.fillRect(0, 0, canvas.width, canvas.height); } }
function tick() { if (!video.paused) { draw(); requestAnimationFrame(tick); } }

async function exportVideo() {
  if (!state.source || state.exporting) return;
  if (state.project.audioMode !== 'original' && !state.music) return setStatus('Elegí una pista de música o volvé a audio original.');
  state.exporting = true; $('#exportButton').disabled = true;
  try {
    setStatus('Preparando el zócalo…');
    const overlay = await overlayBlob();
    const ffmpeg = await loadFfmpeg();
    setStatus('Exportando MP4 vertical… 0%');
    const result = await exportEditorialVideo({ ffmpeg, source: state.source, overlay, music: state.music, audioMode: state.project.audioMode, width: canvas.width, height: canvas.height, quality: state.project.exportQuality, onStage: stage => setStatus(stage === 'copiando' ? 'Copiando el video a memoria…' : stage === 'componiendo' ? 'Componiendo el video…' : 'Preparando la descarga…'), onProgress: ratio => setStatus(`Componiendo el video… ${Math.round(ratio * 100)}%`) });
    const url = URL.createObjectURL(result); const link = document.createElement('a'); link.href = url; link.download = `mediamendoza-vertical-${Date.now()}.mp4`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); setStatus('MP4 listo para descargar.');
  } catch (error) { setStatus(error.message || 'No se pudo exportar el video.'); }
  finally { state.exporting = false; $('#exportButton').disabled = false; }
}

function overlayBlob() { return new Promise((resolve, reject) => { const overlay = document.createElement('canvas'); overlay.width = canvas.width; overlay.height = canvas.height; drawEditorialOverlay(overlay.getContext('2d'), state.project, { time: video.currentTime, logo: state.logo }); overlay.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo crear el zócalo.')), 'image/png'); }); }

function setCanvasFormat() { canvas.width = 1080; canvas.height = state.project.format === '4:5' ? 1350 : 1920; }

async function loadFfmpeg() {
  if (state.ffmpeg) return state.ffmpeg;
  const runtime = createFfmpegRuntime({ FFmpeg: window.FFmpegWASM?.FFmpeg });
  await loadFfmpegRuntime(runtime); state.ffmpeg = runtime; return runtime;
}

function formatTime(value) { const seconds = Math.max(0, Math.floor(Number(value) || 0)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
function setStatus(value) { $('#status').textContent = value; }

export { buildExportCommand };
