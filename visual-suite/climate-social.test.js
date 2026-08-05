const { resetClimateSocialCanvas } = require('./climate-social.js');

const calls = [];
const ctx = {
  globalAlpha: 0.22,
  globalCompositeOperation: 'multiply',
  setTransform(...args) { calls.push(['setTransform', ...args]); },
  clearRect(...args) { calls.push(['clearRect', ...args]); }
};

resetClimateSocialCanvas(ctx, 1600, 1600);

if (ctx.globalAlpha !== 1) throw new Error('El render social debe restablecer la opacidad');
if (ctx.globalCompositeOperation !== 'source-over') throw new Error('El render social debe restablecer la composición');
if (calls[0]?.join(',') !== 'setTransform,1,0,0,1,0,0') throw new Error('El render social debe restablecer la transformación');
if (calls[1]?.join(',') !== 'clearRect,0,0,1600,1600') throw new Error('El render social debe limpiar el canvas');

console.log('climate-social.test.js: OK');
