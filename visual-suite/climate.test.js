const { normalizarClimateSMN, climateTypeFromSmnCode } = require('./climate.js');

const normalized = normalizarClimateSMN({
  ok: true,
  ciudad: 'San Rafael',
  data: {
    weather: {
      temperature: 18.4,
      feels_like: 17.1,
      humidity: 64,
      pressure: 1008,
      visibility: 'Buena',
      wind: { speed: 13, gust: 24, direction: 'Oeste' },
      weather: { id: 1, description: 'Algo nublado' }
    },
    forecast: { forecast: [{ date: '2026-07-30', afternoon: { weather: { id: 61 }, temperature: { min: 8, max: 15 }, rain_prob_range: [40, 70] } }] },
    warning_alert: { title: 'Alerta de prueba' }
  }
}, 'Mendoza');

if (normalized.ciudad !== 'San Rafael') throw new Error('No se conservó la ciudad SMN');
if (normalized.actual.temp !== 18.4 || normalized.actual.type !== 'sun-cloud') throw new Error('No se normalizó el estado actual');
if (normalized.periods.length !== 1 || normalized.periods[0].max !== 15 || normalized.periods[0].rain !== 70) throw new Error('No se normalizó el pronóstico');
if (normalized.alerts[0] !== 'Alerta de prueba') throw new Error('No se normalizaron las alertas');
if (climateTypeFromSmnCode(95) !== 'storm' || climateTypeFromSmnCode(71) !== 'snow') throw new Error('No se mapearon códigos SMN');

console.log('climate.test.js: OK');
