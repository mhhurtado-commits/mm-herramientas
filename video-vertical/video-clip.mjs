import { TITLE_DURATION } from './video-speakers.mjs';

export function buildClipProject(project = {}, clip = {}) {
  const start = Number(clip.start) || 0;
  const end = Number(clip.end) || 0;
  const duration = Math.max(0, end - start);
  const speakers = Array.isArray(project.speakers) ? project.speakers : [];
  const clippedSpeakers = speakers
    .filter(speaker => Number(speaker.start) < end && Number(speaker.start) + TITLE_DURATION > start)
    .map(speaker => ({ ...speaker }));
  return {
    ...project,
    duration,
    speakers: clippedSpeakers,
  };
}

export function isClipWindow(clip = {}) {
  const start = Number(clip.start);
  const end = Number(clip.end);
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

export function clampTrim(range = {}, duration = 0) {
  const total = Math.max(0, Number(duration) || 0);
  const rawStart = Number(range?.start);
  const rawEnd = Number(range?.end);
  let start = Math.min(total, Math.max(0, Number.isFinite(rawStart) ? rawStart : 0));
  let end = Math.min(total, Math.max(0, Number.isFinite(rawEnd) ? rawEnd : 0));
  if (start > end) { const swap = start; start = end; end = swap; }
  return { start, end };
}
