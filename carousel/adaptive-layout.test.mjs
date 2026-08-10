import test from 'node:test';
import assert from 'node:assert/strict';
import { getBalancedContentY } from './canvas-renderer.js';
import { resolveCarouselTheme } from './core/theme.js';

test('centra el contenido disponible sin invadir encabezado ni pie', () => {
  assert.equal(getBalancedContentY(420, 1250, 240), 715);
  assert.equal(getBalancedContentY(900, 1250, 500), 900);
});

test('elige CTA legible para colores de categoría claros y oscuros', () => {
  assert.equal(resolveCarouselTheme({ editorialDiagnosis: { vertical: 'policiales' } }).colors.endCtaText, '#ffffff');
  assert.equal(resolveCarouselTheme({ editorialDiagnosis: { vertical: 'general' } }).colors.endCtaText, '#1b1e22');
});
