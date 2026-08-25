const MIN_CLIP = 15;
const SOFT_MIN = 26;
const MAX_CLIP = 75;
const PAUSE = 0.7;
const MAX_SUGGESTIONS = 4;

export function suggestClipWindows({ duration = 0, profile = 'broll', transcript = [], words = [] } = {}) {
  const total = Math.max(0, Number(duration) || 0);
  if (total < MIN_CLIP) return [];
  if (Array.isArray(transcript) && transcript.length) return spokenSuggestions(total, transcript, words);
  return brollSuggestions(total);
}

function spokenSuggestions(total, transcript, words) {
  const points = Array.isArray(words) && words.length ? words : transcript;
  if (!points.length) return brollSuggestions(total);
  const phrases = buildPhrases(points);
  if (!phrases.length) return brollSuggestions(total);
  const clips = mergeShortClips(buildClips(phrases, total));
  const selected = pickBestClips(clips, total);
  return selected.length ? selected : brollSuggestions(total);
}

function buildPhrases(points) {
  const phrases = [];
  let current = null;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index] || {};
    const start = Number(point.start);
    const end = Number(point.end);
    const text = String(point.text ?? point.word ?? '').trim();
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) continue;
    const next = points[index + 1];
    const gap = next ? Number(next.start) - end : 0;
    if (!current) current = { start, end, text };
    else { current.end = end; current.text = `${current.text} ${text}`.trim(); }
    if (gap >= PAUSE || !next) { phrases.push(current); current = null; }
  }
  if (current) phrases.push(current);
  return phrases;
}

function buildClips(phrases, total) {
  const clips = [];
  let current = null;
  const finalize = () => { if (current) clips.push(current); current = null; };
  for (const phrase of phrases) {
    const phraseDuration = phrase.end - phrase.start;
    if (!current) { current = { ...phrase }; continue; }
    const currentDuration = current.end - current.start;
    if (currentDuration >= MIN_CLIP) { finalize(); current = { ...phrase }; }
    else if (currentDuration + phraseDuration > MAX_CLIP) { finalize(); current = { ...phrase }; }
    else { current.end = phrase.end; current.text = `${current.text} ${phrase.text}`.trim(); }
  }
  finalize();
  return clips.map((clip, index) => ({
    id: `clip-${index}`,
    start: Math.max(0, clip.start),
    end: Math.min(total, clip.end),
    label: clip.text || 'Fragmento sugerido',
    reason: 'Recorte en pausa natural de la transcripción',
  }));
}

function mergeShortClips(clips) {
  const merged = [];
  for (const clip of clips) {
    const last = merged[merged.length - 1];
    if (clip.end - clip.start < MIN_CLIP && last) {
      last.end = clip.end;
      last.label = `${last.label} ${clip.label}`.trim();
    } else if (clip.end - clip.start < MIN_CLIP && merged.length === 0) {
      if (clip.end - clip.start > 0) merged.push(clip);
    } else {
      merged.push(clip);
    }
  }
  return merged.filter(clip => clip.end - clip.start >= MIN_CLIP * 0.6);
}

function pickBestClips(clips, total) {
  const scored = clips.map(clip => {
    const duration = clip.end - clip.start;
    const withinRange = duration >= SOFT_MIN && duration <= MAX_CLIP;
    const endsClean = /[.!?][\s"')]*$/.test(clip.label.trim());
    const score = (withinRange ? 100 : 0) + (endsClean ? 25 : 0) - Math.abs(duration - 40) * 0.3;
    return { clip, score };
  });
  scored.sort((left, right) => right.score - left.score);
  return scored.slice(0, MAX_SUGGESTIONS).map(entry => entry.clip);
}

function brollSuggestions(total) {
  const count = Math.min(3, Math.max(1, Math.floor(total / MIN_CLIP)));
  const gap = total / count;
  return Array.from({ length: count }, (_, index) => {
    const start = Math.round(index * gap);
    const end = Math.min(total, start + Math.min(MAX_CLIP, Math.max(MIN_CLIP, Math.round(gap * 0.75))));
    return { id: `clip-${index}`, start, end, label: `Clip visual ${index + 1}`, reason: 'Ventana visual para revisar' };
  }).filter(clip => clip.end - clip.start >= MIN_CLIP);
}
