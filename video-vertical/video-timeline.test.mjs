import assert from 'node:assert/strict';
import test from 'node:test';
import { clampTimelineTime, getTimelinePointerTime, getTimelineRatio, stepTimelineTime } from './video-timeline.mjs';

test('clamps timeline time to the playable duration', () => {
  assert.equal(clampTimelineTime(-2, 30), 0);
  assert.equal(clampTimelineTime(12.5, 30), 12.5);
  assert.equal(clampTimelineTime(80, 30), 30);
});

test('converts a pointer position to a bounded timeline time', () => {
  assert.equal(getTimelinePointerTime({ clientX: 150, left: 100, width: 200, duration: 40 }), 10);
  assert.equal(getTimelinePointerTime({ clientX: 50, left: 100, width: 200, duration: 40 }), 0);
  assert.equal(getTimelinePointerTime({ clientX: 400, left: 100, width: 200, duration: 40 }), 40);
});

test('computes safe progress ratios and five-second steps', () => {
  assert.equal(getTimelineRatio(15, 60), 0.25);
  assert.equal(getTimelineRatio(4, 0), 0);
  assert.equal(stepTimelineTime(3, -5, 20), 0);
  assert.equal(stepTimelineTime(18, 5, 20), 20);
});
