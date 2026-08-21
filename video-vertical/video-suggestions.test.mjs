import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestClipWindows } from './video-suggestions.mjs';

test('suggests bounded non-overlapping b-roll candidates', () => {
  const clips = suggestClipWindows({ duration: 130, profile: 'broll' });
  assert.ok(clips.length >= 2);
  assert.ok(clips.every(clip => clip.start >= 0 && clip.end <= 130 && clip.end - clip.start >= 20 && clip.end - clip.start <= 45));
  assert.ok(clips.every((clip, index) => index === 0 || clips[index - 1].end <= clip.start));
});

test('uses transcript segments for a spoken candidate and keeps its wording', () => {
  const clips = suggestClipWindows({ duration: 80, profile: 'hablado', transcript: [
    { start: 4, end: 16, text: 'La primera definicion importante de la entrevista.' },
    { start: 16, end: 31, text: 'El segundo dato completa la idea sin perder contexto.' },
  ] });
  assert.equal(clips[0].start, 4);
  assert.equal(clips[0].end, 31);
  assert.match(clips[0].label, /primera definicion/i);
});
