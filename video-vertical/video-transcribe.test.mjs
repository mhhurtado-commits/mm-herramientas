import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTranscriptChunks } from './video-transcribe.mjs';

test('offsets chunk transcript timings to the original video timeline', () => {
  const chunks = [{ start: 0 }, { start: 60 }];
  const results = [
    { segments: [{ start: 1, end: 2, text: 'uno' }], words: [{ start: 1, end: 2, word: 'uno' }] },
    { segments: [{ start: 3, end: 4, text: 'dos' }], words: [{ start: 3, end: 4, word: 'dos' }] },
  ];
  const merged = mergeTranscriptChunks(chunks, results);
  assert.deepEqual(merged.segments, [
    { start: 1, end: 2, text: 'uno' },
    { start: 63, end: 64, text: 'dos' },
  ]);
  assert.deepEqual(merged.words, [
    { start: 1, end: 2, word: 'uno' },
    { start: 63, end: 64, word: 'dos' },
  ]);
});

test('falls back to the texto field when text is missing', () => {
  const merged = mergeTranscriptChunks([{ start: 0 }], [{ segments: [{ start: 0, end: 5, texto: 'hola' }] }]);
  assert.equal(merged.segments[0].text, 'hola');
});

test('returns empty collections when there is nothing to merge', () => {
  const merged = mergeTranscriptChunks([], []);
  assert.deepEqual(merged.segments, []);
  assert.deepEqual(merged.words, []);
});
