const MIN_DURATION = 20;
const MAX_DURATION = 45;

export function suggestClipWindows({ duration = 0, profile = 'broll', transcript = [] } = {}) {
  const total = Math.max(0, Number(duration) || 0);
  if (total < MIN_DURATION) return [];
  if (Array.isArray(transcript) && transcript.length) return spokenSuggestions(total, transcript);
  return brollSuggestions(total);
}

function spokenSuggestions(total, transcript) {
  const clips = [];
  for (let index = 0; index < transcript.length; index += 1) {
    const first = transcript[index] || {};
    const start = Math.max(0, Number(first.start) || 0);
    let end = start;
    let text = '';
    for (let cursor = index; cursor < transcript.length && end - start < MIN_DURATION; cursor += 1) {
      const segment = transcript[cursor] || {};
      end = Math.min(total, Number(segment.end) || end);
      text = `${text} ${String(segment.text || '').trim()}`.trim();
    }
    end = Math.min(total, Math.min(start + MAX_DURATION, end));
    if (end - start >= MIN_DURATION && !clips.some(clip => clip.end > start)) clips.push({ id: `clip-${clips.length}`, start, end, label: text || 'Fragmento sugerido', reason: 'Idea completa de la transcripción' });
    if (clips.length === 3) break;
  }
  return clips.length ? clips : brollSuggestions(total);
}

function brollSuggestions(total) {
  const count = Math.min(3, Math.max(1, Math.floor(total / MIN_DURATION)));
  const gap = total / count;
  return Array.from({ length: count }, (_, index) => {
    const start = Math.round(index * gap);
    const end = Math.min(total, start + Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(gap * 0.75))));
    return { id: `clip-${index}`, start, end, label: `Clip visual ${index + 1}`, reason: 'Ventana visual para revisar' };
  }).filter(clip => clip.end - clip.start >= MIN_DURATION);
}
