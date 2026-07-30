const { normalizarClimateSMN, climateTypeFromSmnCode, climateForecastLayout, climateLongDate, climateHeaderMeta, climateDayCardMetrics, climateHeroLayout, climateCardPeriods, climateVisibleDays } = require('./climate.js');

const normalized = normalizarClimateSMN({
  ok: true,
  ciudad: 'San Rafael',
  data: {
    weather: {
      temperature: 18.4,
      feels_like: null,
      humidity: 64,
      pressure: 1008,
      visibility: 20,
      wind: { speed: 13, gust: 24, direction: 'Oeste' },
      weather: { id: 1, description: 'Algo nublado' }
    },
    forecast: { forecast: [{ date: '2026-07-30', temp_min: 8, temp_max: 15, morning: { weather: { id: 3 }, temperature: 11, rain_prob_range: [0, 20] }, afternoon: { weather: { id: 61 }, temperature: 15, rain_prob_range: [40, 70] } }] },
    warning_alert: { title: 'Alerta de prueba' },
    sun: { sunrise: '08:12', sunset: '18:44' }
  }
}, 'Mendoza');

if (normalized.ciudad !== 'San Rafael') throw new Error('No se conservó la ciudad SMN');
if (normalized.actual.temp !== 18.4 || normalized.actual.type !== 'sun-cloud') throw new Error('No se normalizó el estado actual');
if (normalized.actual.feelsLike !== null) throw new Error('Un dato faltante no debe convertirse en cero');
if (normalized.periods.length !== 2 || normalized.days[0].max !== 15 || normalized.days[0].rain !== 70) throw new Error('No se normalizó el pronóstico');
if (!Array.isArray(normalized.days[0].segments) || normalized.days[0].segments.length !== 2 || normalized.days[0].segments[0].label !== 'Mañana') throw new Error('No se conservaron los períodos del día');
if (normalized.alerts[0] !== 'Alerta de prueba') throw new Error('No se normalizaron las alertas');
if (normalized.sun.sunrise !== '08:12' || normalized.sun.sunset !== '18:44') throw new Error('No se conservaron salida y puesta del sol');
const squareLayout = climateForecastLayout(1000, 1000, 4, true);
if (squareLayout.columns !== 2 || squareLayout.rows !== 2) throw new Error('El pronÃ³stico cuadrado no usa una grilla legible');
if (climateTypeFromSmnCode(95) !== 'storm' || climateTypeFromSmnCode(71) !== 'snow') throw new Error('No se mapearon códigos SMN');
if (climateLongDate('2026-07-31') !== 'viernes 31') throw new Error('No se formateó la fecha completa del pronóstico');

const meta = climateHeaderMeta('Servicio Meteorológico Nacional', new Date('2026-07-30T17:24:00-03:00'));
if (meta !== 'SMN · Actualizado 05:24 p. m.') throw new Error('La metadata del header no está compacta');
const cardMetrics = climateDayCardMetrics(500, 180);
if (cardMetrics.periodY.some(value => value >= cardMetrics.tempY) || cardMetrics.rainY <= cardMetrics.tempY) throw new Error('La tarjeta de pronóstico tiene posiciones encimadas');
if (cardMetrics.todayLabelSize < 22 || cardMetrics.todayTempSize < 24) throw new Error('La evolución de hoy tiene jerarquía insuficiente');
const heroMetrics = climateHeroLayout(1000, 1000);
if (heroMetrics.statX >= heroMetrics.tempX + heroMetrics.tempMaxW + heroMetrics.gap) throw new Error('El bloque actual no aprovecha bien el espacio horizontal');
if (heroMetrics.statValueSize < 20 || heroMetrics.infoValueSize < 17) throw new Error('Las estadísticas del bloque actual siguen siendo demasiado chicas');
const todayPeriods = climateCardPeriods({ segments: [{ label: 'Tarde' }, { label: 'Noche' }] });
if (todayPeriods.length !== 2 || todayPeriods[0].label !== 'Tarde' || todayPeriods[1].label !== 'Noche') throw new Error('La evolución no conserva sus dos períodos reales');
if (climateVisibleDays([1, 2, 3, 4, 5, 6, 7], true).length !== 5) throw new Error('La grilla cuadrada no limita el pronóstico a cuatro días');

console.log('climate.test.js: OK');
