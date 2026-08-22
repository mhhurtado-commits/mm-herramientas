export const TITLE_DURATION = 4;

export function normalizeSpeakerMarkers(markers = [], duration = Infinity) {
  if (!Array.isArray(markers)) return [];
  const total = normalizeDuration(duration);
  const normalized = markers.map(marker => normalizeMarker(marker, total)).filter(Boolean);
  normalized.sort((left, right) => left.start - right.start);
  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index].start < normalized[index - 1].start + TITLE_DURATION) {
      throw new Error('Los rótulos de personas se superponen.');
    }
  }
  return normalized;
}

export function createSpeakerMarker(input = {}, duration = Infinity) {
  return normalizeMarker(input, normalizeDuration(duration));
}

export function getActiveSpeaker(markers = [], time = 0) {
  const current = Number(time);
  if (!Number.isFinite(current)) return null;
  return (Array.isArray(markers) ? markers : []).find(marker => (
    current >= Number(marker.start) && current < Number(marker.start) + TITLE_DURATION
  )) || null;
}

function normalizeMarker(marker, total) {
  const input = marker && typeof marker === 'object' ? marker : {};
  const name = clean(input.name).slice(0, 48);
  if (!name) return null;
  const requestedStart = finiteNumber(input.start, 0);
  const start = Math.min(total, Math.max(TITLE_DURATION, requestedStart));
  return {
    id: clean(input.id) || createId(),
    start,
    duration: TITLE_DURATION,
    name,
    role: clean(input.role).slice(0, 72),
  };
}

function normalizeDuration(value) {
  const duration = Number(value);
  return Number.isFinite(duration) ? Math.max(0, duration) : Infinity;
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `speaker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
