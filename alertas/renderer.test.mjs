// alertas/renderer.test.mjs — tests del layout dinámico del cuerpo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORMATS, PISO_ESCALA, TOPE_ESCALA, calcularFactor, renderAlertasPlaca } from './renderer.mjs';

test('FORMATS exactos', () => {
  assert.deepEqual(FORMATS['1:1'], { width: 1600, height: 1600 });
  assert.deepEqual(FORMATS['4:5'], { width: 1350, height: 1688 });
  assert.deepEqual(FORMATS['9:16'], { width: 1080, height: 1920 });
});

test('calcularFactor: sube con disponibilidad, queda en 1 en el punto natural', () => {
  assert.equal(calcularFactor(1000, 1000), 1);
  assert.equal(calcularFactor(1000, 1600), 1.6);
  assert.equal(calcularFactor(1000, 400), PISO_ESCALA);
  assert.equal(calcularFactor(1000, 100000), TOPE_ESCALA);
});

test('calcularFactor: degenerados nunca devuelven NaN', () => {
  assert.equal(calcularFactor(0, 500), TOPE_ESCALA);
  assert.equal(calcularFactor(NaN, 500), TOPE_ESCALA);
  assert.equal(calcularFactor(1000, 0), PISO_ESCALA);
  assert.equal(calcularFactor(1000, -5), PISO_ESCALA);
});

function mockCtx() {
  const texts = [];
  const ctx = {
    font: '10px Inter', fillStyle: '', strokeStyle: '', lineWidth: 1,
    textAlign: 'left', textBaseline: 'alphabetic',
    fillRect() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arcTo() {},
    fill() {}, stroke() {}, drawImage() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(t) {
      const px = Number((this.font.match(/(\d+(?:\.\d+)?)px/) || [])[1]) || 10;
      return { width: String(t).length * px * 0.5 };
    },
    fillText(t) {
      const px = Number((this.font.match(/(\d+(?:\.\d+)?)px/) || [])[1]) || 0;
      texts.push({ text: String(t), size: px });
    },
  };
  return { ctx, texts };
}
const celda = (etiqueta, zonas, detalle, hacia = '') => ({ etiqueta, zonas, detalle, hacia });
const datos = (celdas, extra = {}) => ({
  titular: 'TORMENTAS CON GRANIZO', fuente: 'RADAR SAN RAFAEL-AEMSA', fecha: '17/11', hora: '20:08',
  nivel: 'naranja', direccion: '', celdas, eta: null, ...extra,
});
const GRUESA = (z) => z.split(',')[0]; // primera palabra/zona de cada celda

test('3 celdas largas + ETA: ninguna zona se pierde (nunca se corta un bloque)', () => {
  const { ctx, texts } = mockCtx();
  const d = datos([
    celda('ahora', 'Calle Larga, Atuel Norte y Villa Atuel', 'lluvia fuerte y granizo', 'este'),
    celda('ruta', 'Las Aguaditas y Real del Padre', 'lluvia fuerte con granizo desplazándose al este', 'este'),
    celda('siguiente', 'Ruta 144 a la altura del Desvío, dirección Cañón del Atuel y Valle Grande', 'tormenta con granizo cruzando', 'este'),
  ], { eta: { lugar: 'Valle Grande', detalle: 'llegada al Embalse', minutos: 10 } });
  renderAlertasPlaca(ctx, d, '9:16', null);
  const texto = texts.map((t) => t.text).join(' ');
  for (const c of d.celdas) assert.ok(texto.includes(GRUESA(c.zonas)), `falta celda ${c.etiqueta}`);
  assert.ok(texto.includes('Valle Grande'), 'falta banner ETA');
});

test('1 celda corta en 1:1: el cuerpo se agranda (factor alto)', () => {
  const { ctx, texts } = mockCtx();
  const d = datos([celda('ahora', 'Atuel Norte', 'lluvia', '')]);
  renderAlertasPlaca(ctx, d, '1:1', null);
  const cuerpo = texts.find((t) => t.text.startsWith('Atuel Norte'));
  assert.ok(cuerpo, 'no se dibujó el cuerpo');
  const base = Math.round(1600 * 0.0245); // 39px
  assert.ok(cuerpo.size >= Math.round(base * 1.5), `cuerpo insuficiente: ${cuerpo.size}px`);
});

test('footer coherente: FUENTE izq, dominio centro, etiqueta der; ETA nula → sin banner', () => {
  const { ctx, texts } = mockCtx();
  const d = datos([celda('ahora', 'Atuel Norte', 'lluvia', '')]);
  renderAlertasPlaca(ctx, d, '4:5', null);
  const texto = texts.map((t) => t.text).join(' | ');
  assert.ok(texto.includes('FUENTE: RADAR SAN RAFAEL-AEMSA'));
  assert.ok(texto.includes('WWW.MEDIAMENDOZA.COM'));
  assert.ok(texto.includes('ALERTA DE TORMENTAS'));
  assert.ok(!texto.includes('llegada en'), 'ETA nula no debe dibujar banner');
});

