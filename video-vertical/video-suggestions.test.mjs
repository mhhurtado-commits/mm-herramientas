import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestClipWindows } from './video-suggestions.mjs';

test('suggests bounded non-overlapping b-roll candidates', () => {
  const clips = suggestClipWindows({ duration: 130, profile: 'broll' });
  assert.ok(clips.length >= 2);
  assert.ok(clips.every(clip => clip.start >= 0 && clip.end <= 130 && clip.end - clip.start >= 15 && clip.end - clip.start <= 75));
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

function denseRun(start, count, step = 0.7, sentenceEvery = 6) {
  const words = [];
  for (let i = 0; i < count; i += 1) {
    const at = start + i * step;
    const text = i > 0 && i % sentenceEvery === 0 ? `frase${i}.` : `palabra${i}`;
    words.push({ word: text, start: at, end: at + 0.35 });
  }
  return words;
}

test('cuts at natural silence boundaries and keeps adaptive lengths', () => {
  const words = [
    ...denseRun(1, 26),
    ...denseRun(25, 28),
    ...denseRun(50, 20),
  ];
  const clips = suggestClipWindows({ duration: 70, profile: 'hablado', transcript: [{ start: 1, end: 65, text: 'x' }], words });
  assert.ok(clips.length >= 2, 'debe sugerir mas de un clip separado por las pausas');
  for (const clip of clips) {
    const startsAtSpeech = clip.start === 0 || words.some(w => Math.abs(w.start - clip.start) < 0.15);
    const endsAtSpeech = clip.end === 70 || words.some(w => Math.abs(w.end - clip.end) < 0.15);
    assert.ok(startsAtSpeech, `el clip ${clip.start}–${clip.end} no arranca en un borde de habla`);
    assert.ok(endsAtSpeech, `el clip ${clip.start}–${clip.end} no termina en un borde de habla`);
  }
  const lengths = clips.map(clip => Math.round(clip.end - clip.start));
  assert.notDeepEqual(lengths, lengths.map(() => lengths[0]), 'las duraciones no deben ser fijas');
});

test('keeps a single uninterrupted monologue as one adaptive clip', () => {
  const words = denseRun(10, 70, 1.0, 99);
  const clips = suggestClipWindows({ duration: 90, profile: 'hablado', transcript: [{ start: 10, end: 80, text: 'x' }], words });
  assert.equal(clips.length, 1);
  assert.ok(clips[0].end - clips[0].start > 40);
});
