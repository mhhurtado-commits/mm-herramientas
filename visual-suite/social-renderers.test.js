const fs = require('node:fs');
const vm = require('node:vm');

const context = {
  console,
  window: {},
  document: {},
  Image: function Image() {}
};
vm.createContext(context);

vm.runInContext(fs.readFileSync(`${__dirname}/climate-social.js`, 'utf8'), context, { filename: 'climate-social.js' });
const climateText = context.socialText;
const climateRoundRect = context.socialRoundRect;

vm.runInContext(fs.readFileSync(`${__dirname}/football-social.js`, 'utf8'), context, { filename: 'football-social.js' });

if (context.socialText !== climateText) throw new Error('Fútbol no debe reemplazar el helper socialText de Clima');
if (context.socialRoundRect !== climateRoundRect) throw new Error('Fútbol no debe reemplazar el helper socialRoundRect de Clima');

console.log('social-renderers.test.js: OK');
