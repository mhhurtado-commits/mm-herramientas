import { adaptVideoPackage } from './video-package-adapter.mjs';
import { normalizeSpeakerMarkers } from './video-speakers.mjs';

const PROFILES = new Set(['hablado', 'broll']);
const AUDIO_MODES = new Set(['original', 'musica', 'mezcla']);

export function createVideoProject(editorialPackage = {}, options = {}) {
  const editorial = adaptVideoPackage(editorialPackage);
  return normalizeVideoProject({
    profile: options.profile,
    audioMode: options.audioMode,
    lowerThird: editorial,
    framing: options.framing,
    clips: options.clips,
    speakers: options.speakers,
  });
}

export function normalizeVideoProject(project = {}) {
  const input = object(project);
  const lowerThird = object(input.lowerThird);
  const framing = object(input.framing);
  const duration = Number.isFinite(Number(input.duration)) ? input.duration : Infinity;
  return {
    format: input.format === '4:5' ? '4:5' : '9:16',
    profile: PROFILES.has(input.profile) ? input.profile : 'hablado',
    audioMode: AUDIO_MODES.has(input.audioMode) ? input.audioMode : 'original',
    exportQuality: input.exportQuality === 'alta' ? 'alta' : 'rapido',
    lowerThird: {
      title: clean(lowerThird.title), summary: clean(lowerThird.summary), section: clean(lowerThird.section) || 'Actualidad',
      accent: clean(lowerThird.accent) || '#a6ce39', source: clean(lowerThird.source) || 'mediamendoza',
      sourceUrl: clean(lowerThird.sourceUrl), fact: clean(lowerThird.fact), image: clean(lowerThird.image), cta: clean(lowerThird.cta) || 'Más información en mediamendoza.com',
    },
    framing: { mode: framing.mode === 'cover' ? 'cover' : 'contain', focus: clampFocus(framing.focus) },
    clips: Array.isArray(input.clips) ? input.clips.map(clip => ({ ...clip })) : [],
    captions: Array.isArray(input.captions) ? input.captions.map(caption => ({ ...caption })) : [],
    speakers: normalizeSpeakerMarkers(input.speakers, duration),
  };
}

export function clampFocus(focus = {}) {
  return { x: clamp(focus.x, 0.5), y: clamp(focus.y, 0.5) };
}

function clamp(value, fallback) { return Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : fallback)); }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
