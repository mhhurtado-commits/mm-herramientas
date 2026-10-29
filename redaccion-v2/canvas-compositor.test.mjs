import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularRecorteCover,
  calcularRectLogo,
  detectarZonaLogo,
  calcularNuevoRectLogo,
  ANCHO_CANVAS,
  ALTO_CANVAS,
} from './canvas-compositor.mjs';

test('calcularRecorteCover centra y recorta imagen horizontal más ancha', () => {
  // Imagen de 2400x1000 en canvas de 1200x600 (ratio 2.4 vs 2.0)
  const r = calcularRecorteCover(2400, 1000, 1200, 600);
  assert.equal(r.sh, 1000);
  assert.equal(r.sw, 2000);
  assert.equal(r.sx, 200);
  assert.equal(r.sy, 0);
});

test('calcularRecorteCover centra y recorta imagen vertical', () => {
  // Imagen de 1000x2000 en canvas de 1200x600 (ratio 0.5 vs 2.0)
  const r = calcularRecorteCover(1000, 2000, 1200, 600);
  assert.equal(r.sw, 1000);
  assert.equal(r.sh, 500);
  assert.equal(r.sx, 0);
  assert.equal(r.sy, 750);
});

test('calcularRectLogo ubica el logo abajo a la derecha con margen', () => {
  // Logo de 200x100 en canvas de 1200x630
  const rect = calcularRectLogo(200, 100, 1200, 630, 20, 0.28);
  const esperadoW = Math.round(1200 * 0.28); // 336
  const esperadoH = Math.round(esperadoW * 0.5); // 168
  assert.equal(rect.w, esperadoW);
  assert.equal(rect.h, esperadoH);
  assert.equal(rect.x, 1200 - esperadoW - 20);
  assert.equal(rect.y, 630 - esperadoH - 20);
});

test('detectarZonaLogo detecta esquinas de resize y cuerpo de drag', () => {
  const rect = { x: 100, y: 100, w: 200, h: 100 };
  assert.deepEqual(detectarZonaLogo({ x: 100, y: 100 }, rect), { type: 'resize', corner: 'nw' });
  assert.deepEqual(detectarZonaLogo({ x: 300, y: 100 }, rect), { type: 'resize', corner: 'ne' });
  assert.deepEqual(detectarZonaLogo({ x: 100, y: 200 }, rect), { type: 'resize', corner: 'sw' });
  assert.deepEqual(detectarZonaLogo({ x: 300, y: 200 }, rect), { type: 'resize', corner: 'se' });
  assert.deepEqual(detectarZonaLogo({ x: 200, y: 150 }, rect), { type: 'drag' });
  assert.equal(detectarZonaLogo({ x: 50, y: 50 }, rect), null);
  assert.equal(detectarZonaLogo({ x: 0, y: 0 }, null), null);
});

test('calcularNuevoRectLogo escala manteniendo aspect ratio', () => {
  const s = {
    corner: 'se',
    sx: 300,
    sy: 200,
    sr: { x: 100, y: 100, w: 200, h: 100 },
  };
  const nuevo = calcularNuevoRectLogo(s, { x: 350, y: 225 }, 2);
  assert.equal(nuevo.w, 250);
  assert.equal(nuevo.h, 125);
  assert.equal(nuevo.x, 100);
  assert.equal(nuevo.y, 100);
});
