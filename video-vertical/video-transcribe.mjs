const CHUNK_DURATION = 60;
const TARGET_SAMPLE_RATE = 16000;

export async function transcribeVideo({ workerUrl, file, onProgress = () => {}, onStage = () => {}, fetch: fetchFn = fetch, AudioContext, OfflineAudioContext } = {}) {
  const root = String(workerUrl || '').replace(/\/$/, '');
  if (!root) throw new Error('No está disponible el servicio de transcripción.');
  onStage('extrayendo-audio');
  const chunks = await extractAudioChunks(file, { AudioContext, OfflineAudioContext, fetch: fetchFn });
  const results = [];
  for (let index = 0; index < chunks.length; index += 1) {
    onProgress(chunks.length === 1 ? 0.5 : index / chunks.length);
    onStage('transcribiendo');
    const formData = new FormData();
    formData.append('audio', chunks[index].blob, `chunk_${index}.wav`);
    const response = await fetchFn(`${root}/video-editor/transcribir`, { method: 'POST', body: formData });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.error || `Error al transcribir el fragmento ${index + 1}.`);
    results.push(result);
  }
  onProgress(1);
  return mergeTranscriptChunks(chunks, results);
}

export function mergeTranscriptChunks(chunks = [], results = []) {
  const words = [];
  const segments = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const offset = Number(chunks[index]?.start) || 0;
    const result = results[index] || {};
    if (Array.isArray(result.words)) {
      for (const word of result.words) {
        words.push({ ...word, start: Number(word.start) + offset, end: Number(word.end) + offset });
      }
    }
    if (Array.isArray(result.segments)) {
      for (const segment of result.segments) {
        segments.push({ start: Number(segment.start) + offset, end: Number(segment.end) + offset, text: String(segment.text ?? segment.texto ?? '').trim() });
      }
    }
  }
  return { words, segments };
}

export async function extractAudioChunks(file, { chunkDuration = CHUNK_DURATION, sampleRate = TARGET_SAMPLE_RATE, AudioContext, OfflineAudioContext, fetch: fetchFn = fetch } = {}) {
  const AC = AudioContext || globalThis.AudioContext || globalThis.webkitAudioContext;
  const OC = OfflineAudioContext || globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!AC || !OC) throw new Error('Este navegador no soporta la extracción de audio del video.');
  const audioContext = new AC();
  const response = await fetchFn(URL.createObjectURL(file));
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const chunks = [];
  let start = 0;
  while (start < audioBuffer.duration) {
    const end = Math.min(start + chunkDuration, audioBuffer.duration);
    const duration = end - start;
    const offline = new OC(1, Math.max(1, Math.ceil(duration * sampleRate)), sampleRate);
    const source = offline.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offline.destination);
    source.start(0, start);
    const rendered = await offline.startRendering();
    chunks.push({ blob: await audioBufferToWav(rendered, sampleRate), start });
    start = end;
  }
  await audioContext.close();
  return chunks;
}

function audioBufferToWav(audioBuffer, sampleRate) {
  const samples = audioBuffer.getChannelData(0);
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeString = (target, offset, string) => { for (let i = 0; i < string.length; i += 1) target.setUint8(offset + i, string.charCodeAt(i)); };
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  new Int16Array(buffer, 44).set(pcm);
  return new Blob([view], { type: 'audio/wav' });
}
