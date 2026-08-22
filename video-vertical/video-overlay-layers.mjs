import { TITLE_DURATION } from './video-speakers.mjs';

export function getOverlayLayerPlan(project = {}) {
  const speakers = Array.isArray(project.speakers) ? project.speakers : [];
  return [
    { id: 'fixed', kind: 'fixed', start: 0, duration: null },
    { id: 'title', kind: 'title', start: 0, duration: TITLE_DURATION },
    ...speakers.map(speaker => ({
      id: speaker.id,
      kind: 'speaker',
      start: speaker.start,
      duration: TITLE_DURATION,
      speaker,
    })),
  ];
}
