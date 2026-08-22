import test from 'node:test';
import assert from 'node:assert/strict';
import { getOverlayLayerPlan } from './video-overlay-layers.mjs';

test('builds fixed title and speaker PNG schedules in draw order', () => {
  const speaker = { id: 'ana', start: 8, duration: 4, name: 'Ana Pérez', role: 'Especialista' };
  assert.deepEqual(getOverlayLayerPlan({ speakers: [speaker] }), [
    { id: 'fixed', kind: 'fixed', start: 0, duration: null },
    { id: 'title', kind: 'title', start: 0, duration: 4 },
    { id: 'ana', kind: 'speaker', start: 8, duration: 4, speaker },
  ]);
});
