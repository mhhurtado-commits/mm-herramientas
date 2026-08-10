import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCategoryOptions,
  getRecommendedCategory,
  resolveCategoryAccent,
} from './editorial-taxonomy.mjs';

test('preserves contract categories and recommended option', () => {
  const options = normalizeCategoryOptions([
    { id: 'policiales', label: 'Policiales', recommended: true, color: '#ba3f42' },
    { id: 'general', label: 'Actualidad', color: '#a6ce39' },
  ]);

  assert.deepEqual(options.map(option => option.id), ['policiales', 'general']);
  assert.equal(getRecommendedCategory(options).id, 'policiales');
  assert.equal(resolveCategoryAccent(options[0]), '#ba3f42');
});

test('uses a neutral fallback when the contract has no color', () => {
  const option = normalizeCategoryOptions([{ id: 'custom', label: 'Comunidad' }])[0];
  assert.equal(resolveCategoryAccent(option), '#a6ce39');
  assert.equal(resolveCategoryAccent(null), '#a6ce39');
});
