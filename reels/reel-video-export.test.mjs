import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReelTimeline, getTransitionState, pickVideoMimeType } from './reel-video-export.mjs';

test('builds a timeline from scene durations with transition overlap', () => {
  const timeline = buildReelTimeline({ scenes: [
    { duration_ms: 3600 },
    { duration_ms: 2800 },
    { duration_ms: 3000 },
  ] }, { transitionMs: 300 });

  assert.deepEqual(timeline.items.map(item => [item.startMs, item.endMs]), [
    [0, 3600],
    [3300, 6100],
    [5800, 8800],
  ]);
  assert.equal(timeline.totalMs, 8800);
});

test('returns a crossfade state only during scene overlap', () => {
  const timeline = buildReelTimeline({ scenes: [{ duration_ms: 3600 }, { duration_ms: 2800 }] }, { transitionMs: 300 });
  assert.deepEqual(getTransitionState(timeline, 3000), { from: 0, to: 1, progress: 0 });
  assert.deepEqual(getTransitionState(timeline, 3300), { from: 0, to: 1, progress: 0 });
  assert.deepEqual(getTransitionState(timeline, 3450), { from: 0, to: 1, progress: 0.5 });
  assert.deepEqual(getTransitionState(timeline, 3600), { from: 1, to: 1, progress: 1 });
});

test('selects a supported silent WebM MIME type', () => {
  const recorder = { isTypeSupported: value => value === 'video/webm;codecs=vp8' };
  assert.equal(pickVideoMimeType(recorder), 'video/webm;codecs=vp8');
  assert.equal(pickVideoMimeType({ isTypeSupported: () => false }), '');
});
