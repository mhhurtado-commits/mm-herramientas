import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeServicePlate,
  normalizeAlertPlate,
  resolveServiceType,
  resolveServiceBanner,
  buildServicioPlacas,
  parseServicioDetalles,
  validarDetallesContraFuente,
  textoDetalleConZona,
  SERVICIO_TIPOS,
  calculatePlateLayout,
} from './editorial-core.mjs';
import { renderNewsPlate } from './renderer.mjs';

const EDEMSA_PARTE = `San Rafael
– En calle Josefa Rosco, entre Rufino Ortega y Escuela; La Llave. De 9.00 a 13.00 h.
– En calle Josefa Rosco, entre Capitán Montoya y Diaz; La Llave. De 9.00 a 13.00 h.
– Entre calles Los Filtros, La Yesera, Hipólito Yrigoyen y Pedro Vega; Capitán Montoya. De 8.30 a 12.30 h.
– Entre calles Moreno, Matienzo, Edison y Sardi. De 15.00 a 19.00 h.
– En la intersección de calle Alto del Algarrobal y Ruta Nacional N°146; Colonia Elena. De 12.30 a 14.20 h.
– En calle Subayudante Barroso, hacia el norte de Ruta Nacional N°146; Colonia Elena. De 10.00 a 11.30 h.
– En calle Apiolazza, entre El Noruego y Orellana; Colonia Elena. De 14.40 a 16.40 h.`;

test('parsea cada viñeta del parte Edemsa en orden sin resumir', () => {
  const detalles = parseServicioDetalles(EDEMSA_PARTE);
  assert.equal(detalles.length, 7);
  assert.deepEqual(detalles[0], { zona: 'La Llave', horario: '9:00 a 13:00', detalle: 'En calle Josefa Rosco, entre Rufino Ortega y Escuela' });
  assert.deepEqual(detalles[3], { zona: 'San Rafael', horario: '15:00 a 19:00', detalle: 'Entre calles Moreno, Matienzo, Edison y Sardi' });
  assert.deepEqual(detalles[6], { zona: 'Colonia Elena', horario: '14:40 a 16:40', detalle: 'En calle Apiolazza, entre El Noruego y Orellana' });
});

test('el parser no trae calles de otros partes', () => {
  const detalles = parseServicioDetalles(EDEMSA_PARTE);
  const joined = detalles.map((item) => `${item.zona} ${item.detalle}`).join(' ');
  assert.ok(!joined.includes('Barrera'));
  assert.ok(!joined.includes('Diamante'));
  assert.ok(!joined.includes('López'));
});

test('sin viñetas con horario el parser devuelve vacío', () => {
  assert.deepEqual(parseServicioDetalles('Corte total en Ruta 143 por operativo vial.'), []);
  assert.deepEqual(parseServicioDetalles(''), []);
});

test('la validación descarta detalles alucinados fuera de la fuente', () => {
  const detalles = validarDetallesContraFuente([
    { zona: 'La Llave', horario: '9:00 a 13:00', detalle: 'En calle Josefa Rosco, entre Rufino Ortega y Escuela' },
    { zona: 'Ruta 143', horario: '15:00 a 19:00', detalle: 'Entre Ramón Barrera y Longi' },
    { zona: 'San Rafael', horario: '', detalle: 'Corte programado' },
  ], EDEMSA_PARTE);
  assert.equal(detalles.length, 1);
  assert.match(detalles[0].detalle, /Josefa Rosco/);
});

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

test('app pagina alertas sin salida carrusel auto', async () => {
  const { readFileSync } = await import('node:fs');
  const app = readFileSync(new URL('./app.mjs', import.meta.url), 'utf8');
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  assert.match(app, /normalizeServicePlate/);
  assert.match(html, /alertaTipo/);
  assert.match(html, /alertaEstado/);
  assert.match(app, /detalles/);
  assert.match(app, /buildServicioPlacas/);
  assert.doesNotMatch(app, /buildServicioCarouselPackage/);
});

test('pagina detalles de a 4 por defecto', () => {
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: '7 cortes programados en San Rafael.',
    fuente: 'Edemsa',
    detalles: [
      { zona: 'A', horario: '9:00 a 13:00', detalle: 'Sarmiento y Lugones' },
      { zona: 'B', horario: '15:00 a 19:00', detalle: 'Campos y Balcarce' },
      { zona: 'C', horario: '8:30 a 12:30', detalle: 'Ruta 146, La Llave' },
      { zona: 'D', horario: '10:00 a 13:45', detalle: 'Agua del Toro' },
      { zona: 'E', horario: '12:30 a 14:20', detalle: 'Colonia Elena norte' },
      { zona: 'F', horario: '14:40 a 16:40', detalle: 'Colonia Elena sur' },
      { zona: 'G', horario: '16:00 a 18:00', detalle: 'Villa 25 de Mayo' },
    ],
  }, new Date('2026-09-08T10:00:00'));
  const pages = buildServicioPlacas(plate);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].servicio.detalles.length, 4);
  assert.equal(pages[1].servicio.detalles.length, 3);
});

test('render 4 detalles sin encimado en una sola placa', () => {
  const calls = [];
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: 'Cortes programados.',
    fuente: 'Edemsa',
    nivel: 'amarillo',
    estado: 'corte programado',
    zona: 'San Rafael',
    detalles: [
      { zona: 'La Llave Norte', horario: '9:00 a 13:00', detalle: 'En calle Josefa Rosco, entre Rufino Ortega y Escuela' },
      { zona: 'La Llave Sur', horario: '9:00 a 13:00', detalle: 'En calle Josefa Rosco, entre Capitán Montoya y Diaz' },
      { zona: 'Capitán Montoya', horario: '8:30 a 12:30', detalle: 'Entre calles Los Filtros, La Yesera, Hipólito Yrigoyen y Pedro Vega' },
      { zona: 'Colonia Elena', horario: '10:00 a 11:30', detalle: 'En calle Subayudante Barroso, hacia el norte de Ruta Nacional N°146' },
    ],
  }, new Date('2026-09-08T10:00:00'));
  renderNewsPlate(mockServiceCtx(calls), plate, 'portrait', {});
  for (const horario of ['9:00 a 13:00', '8:30 a 12:30', '10:00 a 11:30']) {
    assert.ok(calls.some((item) => item.text.includes(horario)));
  }
  const timeCalls = calls.filter((item) => /\d{1,2}:\d{2} a \d{1,2}:\d{2}/.test(item.text));
  assert.equal(timeCalls.length, 4);
  const content = calls.filter((item) => (Number.parseFloat(item.font.split(' ')[1]) || 0) <= 200 && !item.text.startsWith('Fuente:') && !item.text.startsWith('www.'));
  const sorted = [...content].sort((a, b) => a.y - b.y);
  for (let index = 1; index < sorted.length; index += 1) {
    const prevSize = Number.parseFloat(sorted[index - 1].font.split(' ')[1]) || 0;
    assert.ok(sorted[index].y - sorted[index - 1].y >= prevSize * 0.5, `encimado entre "${sorted[index - 1].text.slice(0, 30)}" y "${sorted[index].text.slice(0, 30)}"`);
  }
});
test('pagina detalles de a 3 con numeración', () => {
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: '7 cortes programados en San Rafael.',
    fuente: 'Edemsa',
    detalles: [
      { zona: 'A', horario: '9:00 a 13:00', detalle: 'Sarmiento y Lugones' },
      { zona: 'B', horario: '15:00 a 19:00', detalle: 'Campos y Balcarce' },
      { zona: 'C', horario: '8:30 a 12:30', detalle: 'Ruta 146, La Llave' },
      { zona: 'D', horario: '10:00 a 13:45', detalle: 'Agua del Toro' },
    ],
  }, new Date('2026-09-08T10:00:00'));
  const pages = buildServicioPlacas(plate, 3);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].servicio.detalles.length, 3);
  assert.equal(pages[1].servicio.detalles.length, 1);
  assert.equal(pages[0].servicio.pagina, 1);
  assert.equal(pages[0].servicio.paginas, 2);
  assert.equal(pages[1].servicio.pagina, 2);
});

test('no pagina cuando entran en una placa', () => {
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: '2 cortes programados.',
    fuente: 'Edemsa',
    detalles: [
      { zona: 'A', horario: '9:00 a 13:00', detalle: 'Sarmiento y Lugones' },
      { zona: 'B', horario: '15:00 a 19:00', detalle: 'Campos y Balcarce' },
    ],
  }, new Date('2026-09-08T10:00:00'));
  const pages = buildServicioPlacas(plate, 3);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].servicio.paginas, 1);
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

function mockServiceCtx(calls) {
  return {
    canvas: {}, clearRect() {}, fillRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, clip() {}, rect() {}, arcTo() {}, fill() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(value) { return { width: String(value).length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }; },
    fillText(value, x, y) { calls.push({ font: this.font || '', text: String(value), x, y }); },
  };
}

function fontSizeOf(calls, snippet) {
  const call = calls.find((item) => item.text.includes(snippet));
  return Number.parseFloat(call?.font.split(' ')[1]) || 0;
}

test('render detalles con lugar primero y más grande que el horario', () => {
  const calls = [];
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
    ],
  }, new Date('2026-09-08T10:00:00'));
  renderNewsPlate(mockServiceCtx(calls), plate, 'portrait', {});
  const texts = calls.map((item) => item.text);
  assert.ok(texts.findIndex((text) => text.includes('Coronel Campos')) < texts.findIndex((text) => text.includes('15:00 a 19:00')));
  assert.ok(fontSizeOf(calls, 'Coronel Campos') > fontSizeOf(calls, '15:00 a 19:00'));
});

test('paginación como número fantasma de fondo sin formato N/M', () => {  const calls = [];
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
  const [first] = buildServicioPlacas(plate, 3);
  renderNewsPlate(mockServiceCtx(calls), first, 'portrait', {});
  const joined = calls.map((item) => item.text).join('\n');
  assert.ok(!/\d\/\d/.test(joined));
  assert.ok(calls.some((item) => item.text === '1' && (Number.parseFloat(item.font.split(' ')[1]) || 0) > 200));
  assert.ok(joined.includes('●'));
});

test('la tarjeta muestra la localidad del corte', () => {
  const calls = [];
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: 'Cortes programados.',
    fuente: 'Edemsa',
    detalles: [{ zona: 'Colonia Elena', horario: '10:00 a 11:30', detalle: 'En calle Subayudante Barroso' }],
  }, new Date('2026-09-08T10:00:00'));
  renderNewsPlate(mockServiceCtx(calls), plate, 'portrait', {});
  const joined = calls.map((item) => item.text).join('\n');
  assert.ok(joined.includes('Colonia Elena'));
});

test('textoDetalleConZona agrega localidad solo si aporta', () => {
  assert.ok(textoDetalleConZona({ detalle: 'En calle X', zona: 'Colonia Elena' }).includes('Colonia Elena'));
  assert.ok(!textoDetalleConZona({ detalle: 'En calle X', zona: 'San Rafael' }).includes('San Rafael'));
  assert.ok(!textoDetalleConZona({ detalle: 'En La Llave, calle X', zona: 'La Llave' }).match(/La Llave.*La Llave/));
  assert.equal(textoDetalleConZona({ detalle: '', zona: 'La Llave' }), 'La Llave');
});
test('el horario no se encima con la zona aunque ocupe dos líneas', () => {
  const calls = [];
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: 'Cortes programados.',
    fuente: 'Edemsa',
    nivel: 'amarillo',
    estado: 'corte programado',
    zona: 'San Rafael',
    detalles: [
      { zona: 'La Llave', horario: '9:00 a 13:00', detalle: 'En calle Josefa Rosco, entre Rufino Ortega y Escuela Nacional de la zona norte de La Llave, continuación hacia el este y áreas adyacentes' },
    ],
  }, new Date('2026-09-08T10:00:00'));
  renderNewsPlate(mockServiceCtx(calls), plate, 'portrait', {});
  const zoneCalls = calls.filter((item) => item.text.includes('Josefa Rosco') || item.text.includes('adyacentes') || item.text.includes('Escuela Nacional'));
  const timeCall = calls.find((item) => item.text.includes('9:00 a 13:00'));
  assert.ok(zoneCalls.length >= 2);
  assert.ok(timeCall);
  const lastZone = zoneCalls.at(-1);
  const zoneSize = Number.parseFloat(lastZone.font.split(' ')[1]) || 0;
  assert.ok(timeCall.y - lastZone.y >= zoneSize * 0.9);
});

test('sin línea de conteo de zonas en la placa', () => {
  const calls = [];
  const plate = normalizeServicePlate({
    tipo: 'luz',
    mensaje: 'Cortes programados.',
    fuente: 'Edemsa',
    detalles: [{ zona: 'La Llave', horario: '9:00 a 13:00', detalle: 'En calle Josefa Rosco' }],
  }, new Date('2026-09-08T10:00:00'));
  renderNewsPlate(mockServiceCtx(calls), plate, 'portrait', {});
  const joined = calls.map((item) => item.text).join('\n');
  assert.ok(!joined.includes('ZONAS EN ESTA PLACA'));
  assert.ok(!joined.includes('ZONA EN ESTA PLACA'));
});

test('layout con detalles colapsa la fila de zona y sube la tarjeta', () => {
  const base = { tipo: 'luz', mensaje: 'Cortes.', fuente: 'Edemsa', zona: 'San Rafael' };
  const now = new Date('2026-09-08T10:00:00');
  const simple = normalizeServicePlate(base, now);
  const detailed = normalizeServicePlate({ ...base, detalles: [{ zona: 'La Llave', horario: '9:00 a 13:00', detalle: 'En calle Josefa Rosco' }] }, now);
  const simpleLayout = calculatePlateLayout('portrait', simple);
  const detailedLayout = calculatePlateLayout('portrait', detailed);
  assert.equal(detailedLayout.zona.h, 0);
  assert.ok(detailedLayout.message.y < simpleLayout.message.y);
});
