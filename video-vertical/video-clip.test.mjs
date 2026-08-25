import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClipProject, isClipWindow } from './video-clip.mjs';

const SPEAKERS = [
  { id: 's0', start: 5, name: 'A' },
  { id: 's1', start: 10, name: 'B' },
  { id: 's2', start: 50, name: 'C' },
  { id: 's3', start: 90, name: 'D' },
];

test('keeps speakers whose window overlaps the clip and preserves their original timing', () => {
  const clip = { start: 40, end: 60 };
  const project = buildClipProject({ speakers: SPEAKERS, lowerThird: { title: 'T' } }, clip);
  assert.equal(project.duration, 20);
  assert.deepEqual(project.speakers.map(speaker => speaker.id), ['s2']);
  assert.equal(project.speakers[0].start, 50);
  assert.equal(project.lowerThird.title, 'T');
});

test('drops every speaker outside the clip window', () => {
  const project = buildClipProject({ speakers: SPEAKERS }, { start: 100, end: 120 });
  assert.equal(project.speakers.length, 0);
  assert.equal(project.duration, 20);
});

test('isClipWindow validates the window bounds', () => {
  assert.equal(isClipWindow({ start: 10, end: 30 }), true);
  assert.equal(isClipWindow({ start: 30, end: 10 }), false);
  assert.equal(isClipWindow({ start: 10, end: 10 }), false);
  assert.equal(isClipWindow({}), false);
});
