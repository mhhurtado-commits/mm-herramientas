export const REEL_VIDEO_DEFAULTS = Object.freeze({ fps: 30, transitionMs: 350 });

export function buildReelTimeline(project = {}, { transitionMs = REEL_VIDEO_DEFAULTS.transitionMs } = {}) {
  const overlap = Math.max(0, Number(transitionMs) || 0);
  let cursor = 0;
  const scenes = Array.isArray(project.scenes) ? project.scenes : [];
  const items = scenes.map((scene, index) => {
    const durationMs = Math.max(500, Number(scene?.duration_ms) || 2500);
    const startMs = cursor;
    const endMs = startMs + durationMs;
    cursor = endMs - (index < scenes.length - 1 ? Math.min(overlap, durationMs / 2) : 0);
    return { index, scene, startMs, endMs, durationMs };
  });
  return { items, transitionMs: overlap, totalMs: items.at(-1)?.endMs || 0 };
}

export function getTransitionState(timeline, timeMs) {
  const items = timeline?.items || [];
  if (!items.length) return null;
  const time = Math.max(0, Number(timeMs) || 0);
  const current = items.find(item => time < item.endMs) || items.at(-1);
  const next = items[current.index + 1];
  if (!next) return { from: current.index, to: current.index, progress: 1 };
  const overlapStart = next.startMs;
  const overlapEnd = current.endMs;
  const progress = time < overlapStart ? 0 : Math.min(1, (time - overlapStart) / Math.max(1, overlapEnd - overlapStart));
  return progress > 0 ? { from: current.index, to: next.index, progress } : { from: current.index, to: next.index, progress: 0 };
}

export function pickVideoMimeType(mediaRecorder = globalThis.MediaRecorder) {
  if (!mediaRecorder?.isTypeSupported) return '';
  return [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ].find(type => mediaRecorder.isTypeSupported(type)) || '';
}

export async function exportReelVideo({
  canvas,
  project,
  renderFrame,
  MediaRecorderClass = globalThis.MediaRecorder,
  fps = REEL_VIDEO_DEFAULTS.fps,
  transitionMs = REEL_VIDEO_DEFAULTS.transitionMs,
  onProgress = () => {},
} = {}) {
  if (!canvas?.captureStream) throw new Error('Este navegador no permite capturar el video del reel.');
  if (!MediaRecorderClass) throw new Error('Este navegador no permite exportar video.');
  if (typeof renderFrame !== 'function') throw new Error('Falta el render de frames del reel.');
  const timeline = buildReelTimeline(project, { transitionMs });
  if (!timeline.totalMs) throw new Error('El reel no tiene escenas exportables.');
  const mimeType = pickVideoMimeType(MediaRecorderClass);
  if (!mimeType) throw new Error('Este navegador no ofrece un formato WebM compatible.');

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorderClass(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = event => reject(event.error || new Error('Falló la grabación del reel.'));
  });
  recorder.start();
  const frameMs = 1000 / Math.max(1, fps);
  for (let time = 0; time < timeline.totalMs; time += frameMs) {
    renderFrame(getTransitionState(timeline, time), time, timeline);
    onProgress(Math.min(1, time / timeline.totalMs));
    await wait(frameMs);
  }
  renderFrame(getTransitionState(timeline, timeline.totalMs), timeline.totalMs, timeline);
  onProgress(1);
  recorder.stop();
  await stopped;
  stream.getTracks?.().forEach(track => track.stop());
  return { blob: new Blob(chunks, { type: mimeType }), mimeType, durationMs: timeline.totalMs };
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
