import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeServicePlate,
  normalizeAlertPlate,
  resolveServiceType,
  resolveServiceBanner,
  buildServicioCarouselPlan,
  SERVICIO_TIPOS,
  calculatePlateLayout,
} from './editorial-core.mjs';
import { renderNewsPlate } from './renderer.mjs';

test('normaliza servicio de tránsito con tipo, estado y nivel', () => {
  const now = new Date('2026-09-08T10:00:00');
  const plate = normalizeServicePlate({
    tipo: 'transito',
    mensaje: 'Corte total en Ruta 143 por operativo vial.',
    zona: 'Ruta 143',
    fuente: 'Defensa Civil',
    nivel: 'rojo',
    estado: 'corte total',
  }, now);

  assert.equal(plate.tipo_placa, 'servicio');
  assert.equal(plate.servicio.tipo, 'transito');
  assert.equal(plate.servicio.estado, 'corte total');
  assert.equal(plate.servicio.nivel, 'rojo');
  assert.equal(plate.fecha, '2026-09-08');
});

test('resolveServiceType desconocido cae en generico', () => {
  assert.equal(resolveServiceType('inexistente').id, 'generico');
  assert.ok(SERVICIO_TIPOS.transito);
  assert.ok(SERVICIO_TIPOS.agua);
});

test('normalizeAlertPlate sigue como wrapper de tormenta', () => {
  const plate = normalizeAlertPlate({ mensaje: 'Tormenta' }, new Date('2026-09-08T10:00:00'));
  assert.equal(plate.servicio.tipo, 'tormenta');
});

test('layout servicio reusa ramas de alerta', () => {
  const plate = normalizeServicePlate({ tipo: 'agua', mensaje: 'Corte programado' }, new Date('2026-09-08T10:00:00'));
  const layout = calculatePlateLayout('portrait', plate);
  assert.equal(layout.alerta, true);
  assert.ok(layout.severity && layout.message);
});

test('banner servicio usa etiqueta del tipo', () => {
  assert.equal(resolveServiceBanner({ servicio: { tipo: 'agua' }, alerta: null }), 'CORTE DE AGUA');
  assert.equal(resolveServiceBanner({ servicio: null, alerta: { mensaje: 'x' } }), 'ALERTA DE TORMENTAS');
});

test('render servicio muestra banner y banda con estado', () => {
  const calls = [];
  const ctx = {
    canvas: {}, clearRect() {}, fillRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, clip() {}, rect() {}, arcTo() {}, fill() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(value) { return { width: String(value).length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }; },
    fillText(value) { calls.push(String(value)); },
  };
  const plate = normalizeServicePlate({
    tipo: 'transito', mensaje: 'Corte total en Ruta 143.', zona: 'Ruta 143',
    fuente: 'Defensa Civil', nivel: 'rojo', estado: 'corte total',
  }, new Date('2026-09-08T10:00:00'));
  renderNewsPlate(ctx, plate, 'portrait', {});
  assert.ok(calls.includes('CORTE / TRÁNSITO'));
  assert.ok(calls.some((value) => value.includes('CORTE TOTAL')));
});

test('app expone tipo y estado de servicio en formulario y generación', async () => {
  const { readFileSync } = await import('node:fs');
  const app = readFileSync(new URL('./app.mjs', import.meta.url), 'utf8');
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  assert.match(app, /normalizeServicePlate/);
  assert.match(html, /alertaTipo/);
  assert.match(html, /alertaEstado/);
  assert.match(app, /detalles/);
  assert.match(app, /buildServicioCarouselPackage|buildServicioCarouselPlan/);
});

test('construye plan carrusel con un slide por corte', () => {
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: '7 cortes programados en San Rafael.',
    fuente: 'Edemsa',
    detalles: [
      { zona: 'A', horario: '9:00 a 13:00', detalle: 'Sarmiento y Lugones' },
      { zona: 'B', horario: '15:00 a 19:00', detalle: 'Campos y Balcarce' },
    ],
  }, new Date('2026-09-08T10:00:00'));
  const plan = buildServicioCarouselPlan(plate);
  assert.ok(plan);
  assert.ok(plan.slides.length >= 4);
  assert.ok(plan.slides.some((slide) => String(slide.text).includes('Sarmiento')));
});

test('normaliza detalles de cortes programados hasta 7', () => {
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: '7 cortes programados en San Rafael de 8:30 a 19:30.',
    fuente: 'Edemsa',
    nivel: 'amarillo',
    estado: 'corte programado',
    zona: 'San Rafael',
    detalles: [
      { zona: 'Coronel Campos, Balcarce, Venezuela y Segovia', horario: '15:00 a 19:00' },
      { zona: 'Sarmiento, Lugones, Benielli y Ballofet', horario: '9:00 a 13:00' },
      { zona: 'Ruta Nacional N°146, La Llave', horario: '8:30 a 12:30' },
    ],
  }, new Date('2026-09-08T10:00:00'));
  assert.equal(plate.servicio.detalles.length, 3);
  assert.equal(plate.servicio.detalles[0].horario, '15:00 a 19:00');
  assert.match(plate.servicio.detalles[0].zona, /Coronel Campos/);
});

test('render portada con detalles muestra top 3 y CTA deslizá', () => {  const calls = [];
  const ctx = {
    canvas: {}, clearRect() {}, fillRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, clip() {}, rect() {}, arcTo() {}, fill() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(value) { return { width: String(value).length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }; },
    fillText(value) { calls.push(String(value)); },
  };
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: '7 cortes programados en San Rafael de 8:30 a 19:30.',
    fuente: 'Edemsa',
    nivel: 'amarillo',
    estado: 'corte programado',
    zona: 'San Rafael',
    detalles: [
      { zona: 'Coronel Campos y Balcarce', horario: '15:00 a 19:00' },
      { zona: 'Sarmiento y Lugones', horario: '9:00 a 13:00' },
      { zona: 'Ruta 146, La Llave', horario: '8:30 a 12:30' },
      { zona: 'Agua del Toro', horario: '10:00 a 13:45' },
    ],
  }, new Date('2026-09-08T10:00:00'));
  renderNewsPlate(ctx, plate, 'portrait', {});
  const joined = calls.join('\n');
  assert.ok(calls.some((value) => value.includes('15:00 a 19:00')));
  assert.ok(joined.includes('Desliz'));
});
