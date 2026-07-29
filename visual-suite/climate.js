// ============================================================
// Visual Suite — Clima SMN: datos oficiales → placa editorial
// ============================================================

const CLIMATE_WORKER_URL = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const CLIMATE_CITIES = ['San Rafael', 'General Alvear', 'Malargüe', 'Mendoza', 'San Juan', 'San Luis', 'Neuquén'];

let climateData = null;
let climateFormat = 'square';
let climateLoading = false;
let climateRequestId = 0;

const CLIMATE_WMO = {
  sun: { label: 'Despejado', glyph: '☀', color: '#ffd166' },
  'sun-cloud': { label: 'Algo nublado', glyph: '◐', color: '#f4c95d' },
  cloud: { label: 'Nublado', glyph: '☁', color: '#b8c7d9' },
  fog: { label: 'Neblina', glyph: '≋', color: '#c8d7df' },
  'rain-light': { label: 'Lluvias débiles', glyph: '☂', color: '#77c5e8' },
  rain: { label: 'Lluvia', glyph: '☂', color: '#61b4df' },
  'rain-heavy': { label: 'Lluvias intensas', glyph: '☂', color: '#5597cf' },
  snow: { label: 'Nieve', glyph: '✣', color: '#d7efff' },
  storm: { label: 'Tormentas', glyph: 'ϟ', color: '#e4c4ff' }
};

function climateTypeFromSmnCode(code, isDay = true) {
  const n = Number(code);
  if ([1, 2].includes(n)) return 'sun-cloud';
  if (n === 3) return 'cloud';
  if ([45, 48].includes(n)) return 'fog';
  if (n >= 51 && n <= 57) return 'rain-light';
  if (n >= 61 && n <= 67) return 'rain';
  if (n >= 71 && n <= 86) return 'snow';
  if (n >= 95) return 'storm';
  return isDay ? 'sun' : 'cloud';
}

function climateNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function climatePeriod(period, fallbackDate = '') {
  if (!period) return null;
  const code = period.weather?.id ?? period.weather?.code ?? 3;
  const type = climateTypeFromSmnCode(code, true);
  const wind = period.wind || {};
  const rain = Array.isArray(period.rain_prob_range) ? period.rain_prob_range[1] : period.rain_prob;
  return {
    label: period.name || period.period || '',
    date: period.date || fallbackDate,
    type,
    code,
    description: period.weather?.description || CLIMATE_WMO[type].label,
    min: climateNumber(period.temperature?.min ?? period.temp_min ?? period.temperature_min),
    max: climateNumber(period.temperature?.max ?? period.temp_max ?? period.temperature_max),
    rain: climateNumber(rain),
    wind: climateNumber(wind.speed ?? wind.speed_range?.[1]),
    windDirection: wind.direction || ''
  };
}

function normalizarClimateSMN(payload, ciudad) {
  const root = payload?.data || payload || {};
  const weather = root.weather || {};
  const wind = weather.wind || {};
  const code = weather.weather?.id ?? weather.weather?.code ?? 3;
  const isDay = weather.is_day !== false;
  const type = climateTypeFromSmnCode(code, isDay);
  const forecastDays = Array.isArray(root.forecast?.forecast) ? root.forecast.forecast : [];
  const periods = forecastDays.flatMap(day => [
    climatePeriod(day.early_morning, day.date),
    climatePeriod(day.morning, day.date),
    climatePeriod(day.afternoon, day.date),
    climatePeriod(day.night, day.date)
  ]).filter(Boolean);

  return {
    ciudad: payload?.ciudad || ciudad || 'San Rafael',
    actualizado: new Date(),
    fuente: 'Servicio Meteorológico Nacional',
    actual: {
      temp: climateNumber(weather.temperature),
      feelsLike: climateNumber(weather.feels_like),
      humidity: climateNumber(weather.humidity),
      pressure: climateNumber(weather.pressure),
      visibility: weather.visibility || '',
      wind: climateNumber(wind.speed),
      gust: climateNumber(wind.gust),
      windDirection: wind.direction || '',
      code,
      type,
      description: weather.weather?.description || CLIMATE_WMO[type].label,
      isDay
    },
    sun: root.sun || payload?.sun || {},
    periods,
    alerts: [root.warning_alert, root.warning_shortterm, root.warning_heat]
      .filter(Boolean)
      .map(alert => alert.title || alert.name || alert.description || alert.text || '')
      .filter(Boolean)
  };
}

function climateFormatConfig() {
  return VS_Formats[climateFormat] || VS_Formats.square;
}

function climateSetStatus(message, error = false) {
  const status = document.getElementById('climateStatus');
  if (status) {
    status.textContent = message;
    status.style.color = error ? 'var(--red)' : 'var(--muted)';
  }
}

async function obtenerClimaVisual(ciudad) {
  const selected = ciudad || document.getElementById('climateCity')?.value || 'San Rafael';
  const requestId = ++climateRequestId;
  climateLoading = true;
  const button = document.getElementById('climateRefresh');
  if (button) { button.disabled = true; button.textContent = '⏳ Actualizando…'; }
  climateSetStatus('Consultando datos oficiales del SMN…');
  try {
    const response = await fetch(`${CLIMATE_WORKER_URL}/smn/weather?ciudad=${encodeURIComponent(selected)}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || `Worker HTTP ${response.status}`);
    if (requestId !== climateRequestId) return;
    climateData = normalizarClimateSMN(payload, selected);
    renderClimate();
    climateSetStatus(`Actualizado ${climateData.actualizado.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · ${climateData.fuente}`);
  } catch (error) {
    if (requestId === climateRequestId) climateSetStatus(`No se pudo actualizar: ${error.message}`, true);
  } finally {
    if (requestId === climateRequestId) {
      climateLoading = false;
      if (button) { button.disabled = false; button.textContent = '↻ Actualizar'; }
    }
  }
}

function cambiarFormatoClimate() {
  climateFormat = document.getElementById('climateFormat')?.value || climateFormat;
  renderClimate();
}

function climateShortDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' }).replace('.', '');
}

function climateDrawText(ctx, text, x, y, maxWidth, options = {}) {
  const value = String(text || '');
  ctx.save();
  ctx.font = options.font || '500 20px Inter, sans-serif';
  ctx.fillStyle = options.color || '#fff';
  ctx.textAlign = options.align || 'left';
  ctx.beginPath();
  ctx.rect(options.clipX ?? 0, options.clipY ?? 0, options.clipW ?? 99999, options.clipH ?? 99999);
  ctx.clip();
  let fitted = value;
  while (ctx.measureText(fitted).width > maxWidth && fitted.length > 4) fitted = fitted.slice(0, -2) + '…';
  ctx.fillText(fitted, x, y);
  ctx.restore();
}

function climateDrawAtmosphere(ctx, W, H, actual) {
  const config = CLIMATE_WMO[actual?.type] || CLIMATE_WMO.cloud;
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, '#101b32');
  gradient.addColorStop(.46, actual?.type === 'storm' ? '#242446' : '#17485c');
  gradient.addColorStop(1, '#0b202d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * .78, H * .22, 0, W * .78, H * .22, W * .58);
  glow.addColorStop(0, `${config.color}35`);
  glow.addColorStop(1, `${config.color}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const seed = `${actual?.code || 3}-${actual?.temp || 0}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const rand = index => ((seed * (index + 17) * 9301 + 49297) % 233280) / 233280;
  ctx.save();
  ctx.globalAlpha = .16;
  ctx.strokeStyle = config.color;
  ctx.lineWidth = Math.max(1, W * .001);
  for (let i = 0; i < 12; i++) {
    const x = rand(i) * W;
    ctx.beginPath(); ctx.moveTo(x, H * .18); ctx.lineTo(x + W * .06, H * .86); ctx.stroke();
  }
  ctx.restore();
}

function climateDrawMetric(ctx, x, y, w, label, value, icon, dark = true) {
  ctx.fillStyle = dark ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.72)';
  ctx.strokeStyle = dark ? 'rgba(255,255,255,.14)' : 'rgba(22,32,27,.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, w * .72, Math.min(16, w * .08)); ctx.fill(); ctx.stroke();
  ctx.fillStyle = dark ? 'rgba(255,255,255,.64)' : VS_Colors.INK2;
  ctx.font = `700 ${Math.max(11, Math.round(w * .075))}px Inter, sans-serif`;
  ctx.fillText(icon, x + w * .12, y + w * .2);
  ctx.font = `600 ${Math.max(10, Math.round(w * .075))}px Inter, sans-serif`;
  ctx.fillText(label.toUpperCase(), x + w * .12, y + w * .43);
  ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
  ctx.font = `700 ${Math.max(16, Math.round(w * .13))}px Inter, sans-serif`;
  ctx.fillText(value || '—', x + w * .12, y + w * .67);
}

function climateDrawPeriod(ctx, x, y, w, h, period, index, dark = true) {
  const config = CLIMATE_WMO[period.type] || CLIMATE_WMO.cloud;
  ctx.fillStyle = index === 0 ? 'rgba(166,206,57,.17)' : 'rgba(255,255,255,.075)';
  ctx.strokeStyle = index === 0 ? VS_Colors.ACCENT : 'rgba(255,255,255,.12)';
  ctx.lineWidth = Math.max(1, w * .006);
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(16, w * .06)); ctx.fill(); ctx.stroke();
  climateDrawText(ctx, climateShortDate(period.date) || period.label || '—', x + w / 2, y + h * .2, w * .86, { align: 'center', font: `700 ${Math.max(11, Math.round(w * .09))}px Inter, sans-serif`, color: dark ? '#fff' : VS_Colors.INK, clipX: x, clipY: y, clipW: w, clipH: h });
  ctx.fillStyle = config.color;
  ctx.font = `${Math.max(25, Math.round(Math.min(w, h) * .25))}px sans-serif`;
  ctx.textAlign = 'center'; ctx.fillText(config.glyph, x + w / 2, y + h * .57);
  ctx.fillStyle = dark ? 'rgba(255,255,255,.78)' : VS_Colors.INK2;
  ctx.font = `600 ${Math.max(10, Math.round(w * .075))}px Inter, sans-serif`;
  ctx.fillText(`${period.min ?? '—'}° / ${period.max ?? '—'}°`, x + w / 2, y + h * .79);
  ctx.font = `500 ${Math.max(9, Math.round(w * .06))}px Inter, sans-serif`;
  ctx.fillText(period.rain != null ? `Lluvia ${period.rain}%` : period.description, x + w / 2, y + h * .93);
  ctx.textAlign = 'left';
}

function dibujarClimateCanvas(ctx, W, H) {
  const format = climateFormatConfig();
  const dark = true;
  const headerH = Math.round(H * .18);
  const M = W * .055;
  const actual = climateData?.actual || { type: 'cloud', description: 'Esperando datos' };
  climateDrawAtmosphere(ctx, W, H, actual);
  VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'CLIMA', climateData?.ciudad || 'El tiempo ahora', headerH, { accent: VS_Colors.ACCENT });
  VS_CanvasHelpers.drawPlateLogo(ctx, W, H, { w: W / H > 1.2 ? .18 : .24 });

  if (!climateData) {
    ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.round(Math.min(W, H) * .035)}px Inter, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('Seleccioná una ciudad para consultar el SMN', W / 2, H * .48); ctx.textAlign = 'left';
    VS_CanvasHelpers.drawFooter(ctx, W, H, dark, { onField: true });
    return;
  }

  const bodyTop = headerH + H * .06;
  const heroY = bodyTop + H * .07;
  const heroH = H * (format.cssAR === '1 / 1' ? .285 : .245);
  const config = CLIMATE_WMO[actual.type] || CLIMATE_WMO.cloud;
  ctx.fillStyle = 'rgba(8,17,30,.56)'; ctx.strokeStyle = `${config.color}99`; ctx.lineWidth = Math.max(2, W * .0015);
  ctx.beginPath(); ctx.roundRect(M, heroY, W - M * 2, heroH, Math.min(24, W * .025)); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `700 ${Math.max(12, Math.round(Math.min(W, H) * .014))}px Inter, sans-serif`;
  ctx.fillText('AHORA', M + W * .035, heroY + heroH * .17);
  ctx.fillStyle = config.color; ctx.font = `${Math.round(heroH * .43)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(config.glyph, M + W * .16, heroY + heroH * .66);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(Math.min(W, H) * .092)}px Inter, sans-serif`; ctx.fillText(actual.temp != null ? `${actual.temp}°` : '—', M + W * .36, heroY + heroH * .63);
  ctx.fillStyle = 'rgba(255,255,255,.76)'; ctx.font = `600 ${Math.max(14, Math.round(Math.min(W, H) * .018))}px Inter, sans-serif`; ctx.fillText(actual.description, M + W * .36, heroY + heroH * .82);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `500 ${Math.max(12, Math.round(Math.min(W, H) * .013))}px Inter, sans-serif`;
  ctx.fillText(`Sensación ${actual.feelsLike != null ? `${actual.feelsLike}°` : '—'}`, M + W * .58, heroY + heroH * .32);
  ctx.fillText(`Humedad ${actual.humidity != null ? `${actual.humidity}%` : '—'}`, M + W * .58, heroY + heroH * .51);
  ctx.fillText(`Viento ${actual.wind != null ? `${actual.wind} km/h` : '—'}`, M + W * .58, heroY + heroH * .70);
  ctx.fillText(actual.windDirection ? `Dirección ${actual.windDirection}` : 'Datos oficiales SMN', M + W * .58, heroY + heroH * .89);

  const metricsY = heroY + heroH + H * .035;
  const metricGap = W * .018;
  const metricW = (W - M * 2 - metricGap * 3) / 4;
  climateDrawMetric(ctx, M, metricsY, metricW, 'Humedad', actual.humidity != null ? `${actual.humidity}%` : '—', '◌');
  climateDrawMetric(ctx, M + metricW + metricGap, metricsY, metricW, 'Presión', actual.pressure != null ? `${actual.pressure}` : '—', '⌁');
  climateDrawMetric(ctx, M + (metricW + metricGap) * 2, metricsY, metricW, 'Ráfagas', actual.gust != null ? `${actual.gust}` : '—', '↗');
  climateDrawMetric(ctx, M + (metricW + metricGap) * 3, metricsY, metricW, 'Visibilidad', actual.visibility || '—', '◉');

  const periods = climateData.periods.slice(0, format.cssAR === '9 / 16' ? 8 : 6);
  const forecastY = metricsY + metricW * .72 + H * .04;
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(14, Math.round(Math.min(W, H) * .018))}px Inter, sans-serif`; ctx.fillText('Evolución prevista', M, forecastY);
  if (periods.length) {
    const gap = W * .014; const cardW = (W - M * 2 - gap * (periods.length - 1)) / periods.length; const cardH = H * .17;
    periods.forEach((period, index) => climateDrawPeriod(ctx, M + index * (cardW + gap), forecastY + H * .025, cardW, cardH, period, index, dark));
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `500 ${Math.max(12, Math.round(Math.min(W, H) * .014))}px Inter, sans-serif`; ctx.fillText('El SMN no devolvió períodos de pronóstico para esta consulta.', M, forecastY + H * .06);
  }

  if (climateData.alerts.length) {
    const alertY = H - H * .13;
    ctx.fillStyle = 'rgba(255,190,80,.16)'; ctx.strokeStyle = 'rgba(255,210,110,.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(M, alertY, W - M * 2, H * .055, 12); ctx.fill(); ctx.stroke();
    climateDrawText(ctx, `⚠ ${climateData.alerts[0]}`, M + W * .025, alertY + H * .035, W - M * 2 - W * .05, { font: `600 ${Math.max(11, Math.round(Math.min(W, H) * .012))}px Inter, sans-serif`, color: '#ffe5a8', clipX: M, clipY: alertY, clipW: W - M * 2, clipH: H * .055 });
  }
  VS_CanvasHelpers.drawFooter(ctx, W, H, dark, { onField: true });
}

function renderClimate() {
  const canvas = document.getElementById('climateCanvas');
  const area = document.getElementById('climateArea');
  if (!canvas || !area) return;
  const format = climateFormatConfig();
  const ratio = format.w / format.h;
  const width = Math.max(280, area.clientWidth || 700);
  canvas.width = format.w; canvas.height = format.h; canvas.style.width = '100%'; canvas.style.height = `${Math.round(width / ratio)}px`;
  dibujarClimateCanvas(canvas.getContext('2d'), format.w, format.h);
}

async function exportarClimate() {
  const format = climateFormatConfig();
  const canvas = document.createElement('canvas'); canvas.width = format.w; canvas.height = format.h;
  dibujarClimateCanvas(canvas.getContext('2d'), format.w, format.h);
  canvas.toBlob(blob => {
    if (!blob) return toast('No se pudo exportar la placa de clima');
    const url = URL.createObjectURL(blob); mostrarExportPreview(url, 'clima-mediamendoza');
  }, 'image/png', 1);
}

function initClimate() {
  const city = document.getElementById('climateCity');
  if (city && !city.options.length) CLIMATE_CITIES.forEach(name => city.add(new Option(name, name)));
  const format = document.getElementById('climateFormat');
  if (format) format.value = climateFormat;
  renderClimate();
  if (!climateData && !climateLoading) obtenerClimaVisual(city?.value || 'San Rafael');
}

if (typeof window !== 'undefined') {
  window.initClimate = initClimate;
  window.obtenerClimaVisual = obtenerClimaVisual;
  window.cambiarFormatoClimate = cambiarFormatoClimate;
  window.renderClimate = renderClimate;
  window.exportarClimate = exportarClimate;
  window.normalizarClimateSMN = normalizarClimateSMN;
}

if (typeof module !== 'undefined') module.exports = { normalizarClimateSMN, climateTypeFromSmnCode };
