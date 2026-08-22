import test from 'node:test';
import assert from 'node:assert/strict';
import { TITLE_DURATION, createSpeakerMarker, getActiveSpeaker, normalizeSpeakerMarkers } from './video-speakers.mjs';

test('moves an opening speaker marker after the title', () => {
  const markers = normalizeSpeakerMarkers([{ id: 'ana', start: 1, name: 'Ana Pérez', role: 'Especialista' }], 30);
  assert.deepEqual(markers[0], { id: 'ana', start: TITLE_DURATION, duration: 4, name: 'Ana Pérez', role: 'Especialista' });
});

test('clamps a speaker marker start to the video duration', () => {
  const marker = createSpeakerMarker({ id: 'ana', start: 90, name: 'Ana Pérez' }, 30);
  assert.equal(marker.start, 30);
  assert.equal(marker.duration, 4);
});

test('normalizes speaker text to the field limits', () => {
  const marker = createSpeakerMarker({
    id: 'ana',
    name: ` ${'A'.repeat(50)} `,
    role: ` ${'R'.repeat(75)} `,
  }, 30);
  assert.equal(marker.name.length, 48);
  assert.equal(marker.role.length, 72);
});

test('rejects overlapping visible intervals', () => {
  assert.throws(() => normalizeSpeakerMarkers([
    { id: 'a', start: 5, name: 'Ana' },
    { id: 'b', start: 7, name: 'Juan' },
  ], 30), /superponen/i);
});

test('finds the current speaker only during its four seconds', () => {
  const marker = createSpeakerMarker({ id: 'ana', start: 8, name: 'Ana Pérez', role: 'Especialista' }, 30);
  assert.equal(getActiveSpeaker([marker], 10).id, 'ana');
  assert.equal(getActiveSpeaker([marker], 12), null);
});

test('requires a non-empty speaker name', () => {
  assert.equal(createSpeakerMarker({ id: 'empty', start: 8, name: '  ' }, 30), null);
});
