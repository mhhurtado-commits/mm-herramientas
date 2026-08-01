const { calcularTimelineLayout, ajustarLineasTimeline } = require('./timeline.js');

const layout = calcularTimelineLayout(1600, 1600, 6, 'square');
if (layout.columns !== 2 || layout.rows !== 3) throw new Error('El formato cuadrado debe usar dos columnas alternadas');
if (layout.cards.some(card => card.x < 0 || card.y < 0 || card.x + card.w > 1600 || card.y + card.h > 1600)) throw new Error('Las tarjetas cuadradas no deben desbordar el canvas');
if (layout.card.w < 500 || layout.card.h < 180) throw new Error('Las tarjetas cuadradas deben conservar superficie legible');

const fakeCtx = { font: '', measureText: value => ({ width: String(value).length * 10 }) };
const lines = ajustarLineasTimeline(fakeCtx, 'Un texto de evento demasiado largo para una tarjeta', 180, 2, 30);
if (lines.length > 2) throw new Error('El texto de timeline debe respetar el maximo de lineas');

console.log('timeline.test.js: OK');
