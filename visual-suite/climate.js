// ============================================================
// Visual Suite — Clima SMN: datos oficiales → placa editorial
// ============================================================

const CLIMATE_WORKER_URL = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const CLIMATE_CITIES = ['San Rafael', 'General Alvear', 'Malargüe', 'Mendoza', 'San Juan', 'San Luis', 'Neuquén'];

let climateData = null;
let climateFormat = 'square';
let climateStyle = 'informativa';
let climateLoading = false;
let climateRequestId = 0;
const climateIconCache = new Map();
const climateIconPromises = new Map();

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
  // El worker devuelve los códigos nativos del SMN, no códigos WMO.
  if ([0, 1, 3, 4].includes(n)) return 'sun';
  if ([5, 6, 13, 19, 25].includes(n)) return 'sun-cloud';
  if ([7, 8, 37, 43].includes(n)) return 'cloud';
  if ([45, 48].includes(n)) return 'fog';
  if ([51, 53, 55].includes(n)) return n === 55 ? 'rain' : 'rain-light';
  if ([61, 63, 65, 74].includes(n)) return n === 65 ? 'rain-heavy' : 'rain';
  if (n >= 71 && n <= 79) return 'snow';
  if (n >= 95) return 'storm';
  return isDay ? 'sun' : 'cloud';
}

// El SMN publica pares de recursos distintos para día y noche. El estado
// semántico puede ser el mismo, pero el archivo del escudo meteorológico no.
function climateIconCodeForTime(code, isDay = true) {
  const n = Number(code);
  const pairs = { 3: 5, 5: 3, 13: 14, 14: 13, 19: 20, 20: 19, 25: 26, 26: 25, 37: 38, 38: 37 };
  if (!Number.isFinite(n)) return String(code || '');
  if (n === 3 || n === 5) return isDay ? '3' : '5';
  if (isDay && [14, 20, 26, 38].includes(n)) return String(pairs[n]);
  if (!isDay && [13, 19, 25, 37].includes(n)) return String(pairs[n]);
  return String(n);
}

function climateNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function climatePeriod(period, fallbackDate = '') {
  if (!period) return null;
  const code = period.weather?.id ?? period.weather?.code ?? 3;
  const type = climateTypeFromSmnCode(code, true);
  const wind = period.wind || {};
  const rainRange = Array.isArray(period.rain_prob_range) ? period.rain_prob_range : null;
  const gustRange = Array.isArray(period.gust_range) ? period.gust_range : null;
  const visibility = period.visibility?.value ?? period.visibility ?? '';
  return {
    label: period.name || period.period || '',
    date: period.date || fallbackDate,
    type,
    code,
    description: period.weather?.description || CLIMATE_WMO[type].label,
    temp: climateNumber(period.temperature ?? period.temp),
    min: climateNumber(period.temperature?.min ?? period.temp_min ?? period.temperature_min),
    max: climateNumber(period.temperature?.max ?? period.temp_max ?? period.temperature_max),
    rain: climateNumber(rainRange?.[1] ?? period.rain_prob),
    rainRange,
    rain06h: climateNumber(period.rain06h),
    wind: climateNumber(wind.speed ?? wind.speed_range?.[1]),
    windDirection: wind.direction || '',
    gust: climateNumber(wind.gust ?? gustRange?.[1]),
    visibility
  };
}

function climateDay(day) {
  if (!day) return null;
  const namedPeriods = [
    ['Madrugada', day.early_morning],
    ['Mañana', day.morning],
    ['Tarde', day.afternoon],
    ['Noche', day.night]
  ].filter(([, period]) => period);
  const representative = day.afternoon || day.morning || day.night || day.early_morning;
  const period = climatePeriod(representative, day.date);
  if (!period) return null;
  const periods = namedPeriods.map(([label, item]) => ({ ...climatePeriod(item, day.date), label }));
  const rainValues = periods.map(item => item.rain).filter(value => value != null);
  return {
    ...period,
    segments: periods,
    min: climateNumber(day.temp_min ?? day.temperature_min ?? period.min),
    max: climateNumber(day.temp_max ?? day.temperature_max ?? period.max),
    rain: rainValues.length ? Math.max(...rainValues) : period.rain
  };
}

function climateIsDay(weather, sun) {
  if (weather?.is_day === true || weather?.is_day === 1 || weather?.is_day === '1') return true;
  if (weather?.is_day === false || weather?.is_day === 0 || weather?.is_day === '0') return false;
  const rawSun = sun?.sun || sun || {};
  const toMinutes = value => {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const sunrise = toMinutes(rawSun.sunrise);
  const sunset = toMinutes(rawSun.sunset);
  if (sunrise == null || sunset == null) return true;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= sunrise && minutes < sunset;
}

function climateSunData(root, payload) {
  const candidates = [root?.sun, payload?.sun, root?.data?.sun, payload?.data?.sun];
  for (const candidate of candidates) {
    const sun = candidate?.sun || candidate;
    if (sun?.sunrise || sun?.sunset) return sun;
  }
  return {};
}

function normalizarClimateSMN(payload, ciudad) {
  const root = payload?.data || payload || {};
  const weather = root.weather || {};
  const wind = weather.wind || {};
  const code = weather.weather?.id ?? weather.weather?.code ?? 3;
  const sun = climateSunData(root, payload);
  const isDay = climateIsDay(weather, sun);
  const type = climateTypeFromSmnCode(code, isDay);
  const forecastDays = Array.isArray(root.forecast?.forecast) ? root.forecast.forecast : [];
  const periods = forecastDays.flatMap(day => [
    climatePeriod(day.early_morning, day.date),
    climatePeriod(day.morning, day.date),
    climatePeriod(day.afternoon, day.date),
    climatePeriod(day.night, day.date)
  ]).filter(Boolean);

  const days = forecastDays.map(climateDay).filter(Boolean);
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
      rain: climateNumber(weather.rain),
      visibility: weather.visibility?.value ?? weather.visibility ?? '',
      code,
      type,
      description: weather.weather?.description || CLIMATE_WMO[type].label,
      isDay
    },
    sun,
    georef: root.georef || payload?.georef || null,
    periods,
    days,
    alerts: [root.warning_alert, root.warning_shortterm, root.warning_heat]
      .filter(Boolean)
      .map(alert => alert.title || alert.name || alert.description || alert.text || '')
      .filter(Boolean)
  };
}

function preloadClimateIcon(code) {
  const key = String(code || '');
  if (!key) return Promise.resolve(null);
  if (climateIconCache.has(key)) return Promise.resolve(climateIconCache.get(key));
  if (climateIconPromises.has(key)) return climateIconPromises.get(key);
  const promise = new Promise(resolve => {
    const img = new Image();
    let triedWebp = false;
    img.onload = () => { climateIconCache.set(key, img); resolve(img); };
    img.onerror = () => {
      if (!triedWebp) {
        triedWebp = true;
        img.src = `../placas/icons/${key}.webp`;
      } else {
        climateIconCache.set(key, null); resolve(null);
      }
    };
    img.src = `../placas/icons/${key}.png`;
  });
  climateIconPromises.set(key, promise);
  return promise;
}

function preloadClimateIcons(data) {
  if (!data) return Promise.resolve();
  const actualCode = data.actual ? climateIconCodeForTime(data.actual.code, data.actual.isDay) : null;
  const segmentCodes = (data.days || []).flatMap(day => (day.segments || []).map(segment => segment.code));
  const codes = [actualCode, ...(data.days || []).map(day => day.code), ...segmentCodes].filter(Boolean);
  return Promise.all(codes.map(preloadClimateIcon)).then(() => undefined);
}

function climateFormatConfig() {
  if (climateStyle === 'social') return climateSocialFormatConfig(climateFormat);
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

function cambiarEstiloClimate() {
  climateStyle = document.getElementById('climateStyle')?.value || climateStyle;
  renderClimate();
}

function climateShortDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' }).replace('.', '');
}

function climateLongDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit' }).replace(/^./, char => char.toLowerCase());
}

function climateHeaderMeta(source, date) {
  const label = /servicio meteorol[oó]gico nacional|\bsmn\b/i.test(String(source || '')) ? 'SMN' : String(source || 'Fuente');
  const value = date instanceof Date ? date : new Date(date);
  const time = Number.isNaN(value.getTime()) ? '--:--' : value.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${label} · Actualizado ${time}`;
}

function climateDayCardMetrics(w, h) {
  const base = Math.min(w, h);
  return {
    titleY: h * .18,
    dividerY: h * .29,
    periodY: [h * .36, h * .36],
    iconY: h * .53,
    tempY: h * .72,
    rainY: h * .87,
    todayLabelSize: Math.max(22, Math.round(base * .13)),
    todayTempSize: Math.max(24, Math.round(base * .16))
  };
}

function climateTodayCardMetrics(w, h) {
  const base = Math.min(w, h);
  const iconSize = Math.min(h * .16, (w / 4) * .18);
  return {
    titleY: h * .2,
    periodY: h * .47,
    iconY: h * .61,
    iconSize,
    iconBottom: h * .61 + iconSize / 2,
    tempY: h * .8,
    rainY: h * .94,
    labelSize: Math.max(12, Math.round(base * .14)),
    tempSize: Math.max(15, Math.round(base * .16)),
    rainSize: Math.max(10, Math.round(base * .1))
  };
}

function climateHeroLayout(W, H) {
  const M = W * .055;
  const statX = M + W * .47;
  const tempX = M + W * .32;
  const tempMaxW = W * .19;
  const gap = W * .018;
  return {
    statX,
    tempX,
    tempMaxW,
    gap,
    statValueSize: Math.max(20, Math.round(Math.min(W * .04, H * .026))),
    infoValueSize: Math.max(18, Math.round(Math.min(W * .03, H * .02)))
  };
}

function climateCardPeriods(day, limit = 2) {
  return (day?.segments || []).slice(0, limit);
}

function climateVisibleDays(days, square) {
  return (days || []).slice(0, square ? 5 : 7);
}

function climateSocialBackgroundKey(actual = {}) {
  if (actual.type === 'storm') return 'tormenta';
  const suffix = actual.isDay === false ? 'noche' : 'dia';
  if (['rain', 'rain-light', 'rain-heavy'].includes(actual.type)) return `lluvia-${suffix}`;
  if (actual.type === 'sun') return `despejado-${suffix}`;
  if (actual.type === 'sun-cloud') return `parcial-${suffix}`;
  if (actual.type === 'snow' || actual.type === 'fog') return `nublado-${suffix}`;
  return `nublado-${suffix}`;
}

function climateSocialVisibleDays(days) {
  return (days || []).slice(0, 3);
}

function climateSocialFormatConfig(formatKey = 'square') {
  const formats = typeof VS_Formats !== 'undefined' ? VS_Formats : {
    square: { label: 'Cuadrado 1:1', w: 1600, h: 1600, cssAR: '1 / 1' },
    portrait: { label: 'Instagram 4:5', w: 1350, h: 1688, cssAR: '4 / 5' },
    story: { label: 'Historia IG 9:16', w: 1080, h: 1920, cssAR: '9 / 16' },
    landscape: { label: 'Facebook apaisado 1.91:1', w: 2400, h: 1260, cssAR: '1.91 / 1' }
  };
  const format = formats[formatKey] || formats.square;
  if (formatKey === 'landscape') return { ...format, label: 'Facebook apaisado 1.91:1', w: 2400, h: 1260, cssAR: '1.91 / 1' };
  return format;
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
  if (!actual?.isDay) {
    gradient.addColorStop(0, '#070b1c');
    gradient.addColorStop(.46, actual?.type === 'storm' ? '#211d3d' : '#152644');
    gradient.addColorStop(1, '#050b16');
  } else if (actual?.type === 'storm' || actual?.type === 'rain-heavy') {
    gradient.addColorStop(0, '#1a304b');
    gradient.addColorStop(.46, '#25465b');
    gradient.addColorStop(1, '#0b202d');
  } else {
    gradient.addColorStop(0, '#102847');
    gradient.addColorStop(.46, '#176078');
    gradient.addColorStop(1, '#0b202d');
  }
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
  ctx.globalAlpha = actual?.type === 'rain' || actual?.type === 'rain-light' || actual?.type === 'rain-heavy' || actual?.type === 'storm' ? .25 : .16;
  ctx.strokeStyle = config.color;
  ctx.lineWidth = Math.max(1, W * .001);
  for (let i = 0; i < 12; i++) {
    const x = rand(i) * W;
    ctx.beginPath(); ctx.moveTo(x, H * .18); ctx.lineTo(x + W * .06, H * .86); ctx.stroke();
  }
  if (actual?.type === 'rain' || actual?.type === 'rain-light' || actual?.type === 'rain-heavy' || actual?.type === 'storm') {
    ctx.globalAlpha = .2;
    for (let i = 0; i < 34; i++) {
      const x = rand(i + 30) * W;
      const y = H * .18 + rand(i + 40) * H * .72;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - W * .012, y + H * .045); ctx.stroke();
    }
  }
  if (!actual?.isDay) {
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    for (let i = 0; i < 28; i++) {
      ctx.beginPath(); ctx.arc(rand(i + 80) * W, H * .12 + rand(i + 90) * H * .48, Math.max(1, W * .0012), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function climateDrawIcon(ctx, code, type, x, y, size) {
  const image = climateIconCache.get(String(code || ''));
  if (image) {
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    return;
  }
  const config = CLIMATE_WMO[type] || CLIMATE_WMO.cloud;
  ctx.fillStyle = config.color;
  ctx.font = `${Math.round(size * .75)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.fillText(config.glyph, x, y + size * .25); ctx.textAlign = 'left';
}

function climateDrawMetric(ctx, x, y, w, label, value, icon, dark = true, height = null) {
  const cardH = height || w * .72;
  ctx.fillStyle = dark ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.72)';
  ctx.strokeStyle = dark ? 'rgba(255,255,255,.14)' : 'rgba(22,32,27,.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, cardH, Math.min(16, w * .08)); ctx.fill(); ctx.stroke();
  ctx.fillStyle = dark ? 'rgba(255,255,255,.64)' : VS_Colors.INK2;
  ctx.font = `700 ${Math.max(11, Math.round(w * .075))}px Inter, sans-serif`;
  ctx.fillText(icon, x + w * .12, y + cardH * .2);
  ctx.font = `600 ${Math.max(10, Math.round(w * .075))}px Inter, sans-serif`;
  ctx.fillText(label.toUpperCase(), x + w * .12, y + cardH * .55);
  ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
  const valueText = value || '—';
  let valueSize = Math.max(15, Math.round(w * .13));
  ctx.font = `700 ${valueSize}px Inter, sans-serif`;
  while (ctx.measureText(valueText).width > w * .78 && valueSize > 12) {
    valueSize -= 1;
    ctx.font = `700 ${valueSize}px Inter, sans-serif`;
  }
  ctx.fillText(valueText, x + w * .12, y + cardH * .84);
}

function climateDrawHeroStat(ctx, x, y, w, h, label, value, detail = '') {
  ctx.fillStyle = 'rgba(255,255,255,.075)';
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(12, w * .04)); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.62)';
  ctx.font = `700 ${Math.max(15, Math.round(Math.min(w * .08, h * .27)))}px Inter, sans-serif`;
  ctx.fillText(label.toUpperCase(), x + w * .09, y + h * .3);
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.max(24, Math.round(Math.min(w * .16, h * .48)))}px Inter, sans-serif`;
  ctx.fillText(value || '—', x + w * .09, y + h * .72);
  if (detail) {
    ctx.fillStyle = 'rgba(255,255,255,.58)';
    ctx.font = `500 ${Math.max(12, Math.round(Math.min(w * .07, h * .2)))}px Inter, sans-serif`;
    ctx.fillText(detail, x + w * .56, y + h * .72);
  }
}

function climateDrawSunCard(ctx, x, y, w, h, sun, dark = true) {
  ctx.fillStyle = 'rgba(255,255,255,.075)';
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(12, w * .025)); ctx.fill(); ctx.stroke();
  const divider = x + w / 2;
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.beginPath(); ctx.moveTo(divider, y + h * .22); ctx.lineTo(divider, y + h * .88); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = dark ? 'rgba(255,255,255,.68)' : VS_Colors.INK2;
  ctx.font = `700 ${Math.max(12, Math.round(Math.min(w / 2, h) * .2))}px Inter, sans-serif`;
  ctx.fillText('SALIDA DEL SOL', x + w * .25, y + h * .32);
  ctx.fillText('PUESTA DEL SOL', x + w * .75, y + h * .32);
  ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
  ctx.font = `700 ${Math.max(18, Math.round(Math.min(w / 2, h) * .34))}px Inter, sans-serif`;
  ctx.fillText(sun?.sunrise || '—', x + w * .25, y + h * .76);
  ctx.fillText(sun?.sunset || '—', x + w * .75, y + h * .76);
  ctx.textAlign = 'left';
}

function climateForecastLayout(W, H, count, square) {
  const columns = square ? Math.min(2, Math.max(1, count)) : Math.max(1, count);
  return { columns, rows: Math.ceil(Math.max(0, count) / columns) };
}

function climateDrawDayCard(ctx, x, y, w, h, day, index, dark = true, today = false) {
  const base = Math.min(w, h);
  const metrics = climateDayCardMetrics(w, h);
  ctx.fillStyle = today ? 'rgba(166,206,57,.17)' : 'rgba(255,255,255,.075)';
  ctx.strokeStyle = today ? VS_Colors.ACCENT : 'rgba(255,255,255,.12)';
  ctx.lineWidth = Math.max(1, w * .006);
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(16, w * .06)); ctx.fill(); ctx.stroke();
  climateDrawText(ctx, today ? 'Hoy' : (climateLongDate(day.date) || '—'), x + w / 2, y + metrics.titleY, w * .86, { align: 'center', font: `700 ${Math.max(16, Math.round(base * .18))}px Inter, sans-serif`, color: dark ? '#fff' : VS_Colors.INK, clipX: x, clipY: y, clipW: w, clipH: h });
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y + metrics.dividerY); ctx.lineTo(x + w / 2, y + h * .94); ctx.stroke();

  const segments = climateCardPeriods(day);
  const periods = segments;
  periods.forEach((segment, column) => {
    const cx = x + w * (column ? .75 : .25);
    const cellW = w * .42;
    const label = column ? 'Tarde' : 'Mañana';
    ctx.textAlign = 'center';
    ctx.fillStyle = dark ? 'rgba(255,255,255,.82)' : VS_Colors.INK2;
    ctx.font = `700 ${Math.max(12, Math.round(base * .12))}px Inter, sans-serif`;
    const displayLabel = segment?.label || label;
    ctx.fillText(displayLabel, cx, y + metrics.periodY[column]);
    if (segment) {
      climateDrawIcon(ctx, segment.code, segment.type, cx, y + metrics.iconY, Math.min(h * .22, cellW * .21));
      ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
      ctx.font = `700 ${Math.max(14, Math.round(base * .14))}px Inter, sans-serif`;
      ctx.fillText(segment.temp != null ? `${segment.temp}°` : '—', cx, y + metrics.tempY);
      ctx.fillStyle = dark ? 'rgba(255,255,255,.72)' : VS_Colors.INK2;
      ctx.font = `500 ${Math.max(10, Math.round(base * .1))}px Inter, sans-serif`;
      ctx.fillText(segment.rain != null ? `${segment.rain}% lluvia` : '—', cx, y + metrics.rainY);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.52)';
      ctx.font = `500 ${Math.max(11, Math.round(base * .11))}px Inter, sans-serif`;
      ctx.fillText('—', cx, y + h * .62);
    }
  });
  ctx.textAlign = 'left';
}

function climateDrawTodayCardLegacy(ctx, x, y, w, h, day, dark = true) {
  return climateDrawDayCard(ctx, x, y, w, h, day, 0, dark, true);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(16, w * .025)); ctx.fill(); ctx.stroke();
  const segments = (day?.segments || []).slice(0, 4);
  const metrics = climateDayCardMetrics(w, h);
  const titleSize = metrics.todayLabelSize;
  const leftW = w * .24;
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${titleSize}px Inter, sans-serif`;
  ctx.fillText('Hoy', x + w * .035, y + h * .3);
  ctx.fillStyle = 'rgba(255,255,255,.62)';
  ctx.font = `700 ${metrics.todayTempSize}px Inter, sans-serif`;
  ctx.fillText(`${day?.min ?? '—'}° / ${day?.max ?? '—'}°`, x + w * .035, y + h * .7);
  if (!segments.length) return;
  const startX = x + leftW;
  const cellW = (w * .71) / segments.length;
  segments.forEach((segment, index) => {
    const cx = startX + cellW * index + cellW / 2;
    climateDrawIcon(ctx, segment.code, segment.type, cx, y + h * .37, Math.min(h * .42, cellW * .24));
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.max(11, Math.round(Math.min(cellW, h) * .16))}px Inter, sans-serif`;
    ctx.fillText(segment.label || 'Período', cx, y + h * .68);
    ctx.fillStyle = 'rgba(255,255,255,.68)';
    ctx.font = `500 ${Math.max(10, Math.round(Math.min(cellW, h) * .12))}px Inter, sans-serif`;
    ctx.fillText(segment.rain != null ? `${segment.rain}% lluvia` : segment.description, cx, y + h * .86);
  });
  ctx.textAlign = 'left';
}

function climateDrawTodayCard(ctx, x, y, w, h, day, dark = true) {
  const segments = climateCardPeriods(day, 4);
  const metrics = climateTodayCardMetrics(w, h);
  ctx.fillStyle = 'rgba(166,206,57,.17)';
  ctx.strokeStyle = VS_Colors.ACCENT;
  ctx.lineWidth = Math.max(1, w * .004);
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(16, w * .025)); ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
  ctx.font = `700 ${Math.max(22, Math.round(Math.min(w, h) * .13))}px Inter, sans-serif`;
  ctx.fillText('Hoy', x + w / 2, y + metrics.titleY);
  if (!segments.length) { ctx.textAlign = 'left'; return; }
  const cellW = w / segments.length;
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 1;
  for (let index = 1; index < segments.length; index++) {
    const dividerX = x + cellW * index;
    ctx.beginPath(); ctx.moveTo(dividerX, y + h * .31); ctx.lineTo(dividerX, y + h * .92); ctx.stroke();
  }
  return climateDrawTodaySegments(ctx, x, y, w, h, segments, metrics, dark);
  segments.forEach((segment, index) => {
    const cx = x + cellW * index + cellW / 2;
    ctx.fillStyle = dark ? 'rgba(255,255,255,.82)' : VS_Colors.INK2;
    ctx.font = `700 ${Math.max(12, Math.round(Math.min(cellW, h) * .14))}px Inter, sans-serif`;
    ctx.fillText(segment.label || 'PerÃ­odo', cx, y + h * .54);
    climateDrawIcon(ctx, segment.code, segment.type, cx, y + metrics.iconY, metrics.iconSize);
    ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
    ctx.font = `700 ${Math.max(15, Math.round(Math.min(cellW, h) * .16))}px Inter, sans-serif`;
    ctx.fillText(segment.temp != null ? `${segment.temp}Â°` : 'â€”', cx, y + h * .82);
    ctx.fillStyle = dark ? 'rgba(255,255,255,.72)' : VS_Colors.INK2;
    ctx.font = `500 ${Math.max(10, Math.round(Math.min(cellW, h) * .1))}px Inter, sans-serif`;
    ctx.fillText(segment.rain != null ? `${segment.rain}% lluvia` : 'â€”', cx, y + h * .94);
  });
  ctx.textAlign = 'left';
}

function climateDrawTodaySegments(ctx, x, y, w, h, segments, metrics, dark = true) {
  const degree = String.fromCharCode(176);
  const dash = String.fromCharCode(8212);
  const cellW = w / segments.length;
  segments.forEach((segment, index) => {
    const cx = x + cellW * index + cellW / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = dark ? 'rgba(255,255,255,.82)' : VS_Colors.INK2;
    ctx.font = `700 ${metrics.labelSize}px Inter, sans-serif`;
    ctx.fillText(segment.label || 'Periodo', cx, y + metrics.periodY);
    climateDrawIcon(ctx, segment.code, segment.type, cx, y + metrics.iconY, metrics.iconSize);
    ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
    ctx.font = `700 ${metrics.tempSize}px Inter, sans-serif`;
    ctx.fillText(segment.temp != null ? `${segment.temp}${degree}` : dash, cx, y + metrics.tempY);
    ctx.fillStyle = dark ? 'rgba(255,255,255,.72)' : VS_Colors.INK2;
    ctx.font = `500 ${metrics.rainSize}px Inter, sans-serif`;
    ctx.fillText(segment.rain != null ? `${segment.rain}% lluvia` : dash, cx, y + metrics.rainY);
  });
  ctx.textAlign = 'left';
}

function dibujarClimateCanvas(ctx, W, H) {
  const format = climateFormatConfig();
  const dark = true;
  const headerH = VS_CanvasHelpers.plateHeaderHeight(W, H);
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

  const updatedHeader = climateData.actualizado instanceof Date ? climateData.actualizado : new Date(climateData.actualizado);
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.font = `600 ${Math.max(11, Math.round(Math.min(W, H) * .012))}px Inter, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(climateHeaderMeta(climateData.fuente, updatedHeader), W - M, headerH * .82);
  ctx.textAlign = 'left';

  const bodyTop = headerH + H * .04;
  const heroY = bodyTop + H * .01;
  const square = format.cssAR === '1 / 1';
  const heroH = H * (square ? .255 : .245);
  const config = CLIMATE_WMO[actual.type] || CLIMATE_WMO.cloud;
  ctx.fillStyle = 'rgba(8,17,30,.56)'; ctx.strokeStyle = `${config.color}99`; ctx.lineWidth = Math.max(2, W * .0015);
  ctx.beginPath(); ctx.roundRect(M, heroY, W - M * 2, heroH, Math.min(24, W * .025)); ctx.fill(); ctx.stroke();
  const heroLayout = climateHeroLayout(W, H);
  const actualIconCode = climateIconCodeForTime(actual.code, actual.isDay);
  climateDrawIcon(ctx, actualIconCode, actual.type, M + W * .14, heroY + heroH * .52, heroH * .5);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(Math.min(W, H) * .095)}px Inter, sans-serif`; ctx.fillText(actual.temp != null ? `${actual.temp}°` : '—', heroLayout.tempX, heroY + heroH * .62);
  ctx.fillStyle = 'rgba(255,255,255,.76)'; ctx.font = `600 ${Math.max(14, Math.round(Math.min(W, H) * .018))}px Inter, sans-serif`; ctx.fillText(actual.description, heroLayout.tempX, heroY + heroH * .79);
  ctx.textAlign = 'left';
  const statX = heroLayout.statX;
  const statY = heroY + heroH * .16;
  const statGap = W * .014;
  const statAreaW = W - M - statX;
  const statW = (statAreaW - statGap) / 2;
  const statH = heroH * .235;
  climateDrawHeroStat(ctx, statX, statY, statW, statH, 'Sensación', actual.feelsLike != null ? `${actual.feelsLike}°` : '—');
  climateDrawHeroStat(ctx, statX + statW + statGap, statY, statW, statH, 'Humedad', actual.humidity != null ? `${actual.humidity}%` : '—');
  climateDrawHeroStat(ctx, statX, statY + statH + statGap, statW, statH, 'Viento', actual.wind != null ? `${actual.wind}` : '—', actual.windDirection || '');
  climateDrawHeroStat(ctx, statX + statW + statGap, statY + statH + statGap, statW, statH, 'Visibilidad', actual.visibility ? `${actual.visibility}` : '—', 'km');
  const sun = climateData.sun || {};
  const infoY = heroY + heroH * .70;
  const infoGap = W * .014;
  const infoAreaW = W - M - statX;
  const infoW = infoAreaW * .3;
  climateDrawHeroStat(ctx, statX, infoY, infoW, heroH * .235, 'Presión', actual.pressure != null ? `${actual.pressure}` : '—', 'hPa');
  climateDrawSunCard(ctx, statX + infoW + infoGap, infoY, W - M - statX - infoW - infoGap, heroH * .235, sun, dark);

  const evolutionTitleY = heroY + heroH + H * .035;
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(14, Math.round(Math.min(W, H) * .018))}px Inter, sans-serif`; ctx.fillText('Evolución de hoy', M, evolutionTitleY);

  const evolutionY = evolutionTitleY + H * .018;
  const evolutionH = square ? H * .13 : H * .12;
  if (climateData.days[0]) climateDrawTodayCard(ctx, M, evolutionY, W - M * 2, evolutionH, climateData.days[0], dark);

  const days = climateData.days.slice(1, square ? 5 : 7);
  const forecastY = evolutionY + evolutionH + H * .035;
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(14, Math.round(Math.min(W, H) * .018))}px Inter, sans-serif`; ctx.fillText('Pronóstico diario', M, forecastY);
  if (days.length) {
    const layout = climateForecastLayout(W, H, days.length, square);
    const gap = W * .014;
    const rowGap = H * .014;
    const cardW = (W - M * 2 - gap * (layout.columns - 1)) / layout.columns;
    const cardY = forecastY + H * .012;
    const footerReserve = H * .075;
    const desiredCardH = square ? H * .18 : H * .17;
    const cardH = Math.min(desiredCardH, Math.max(H * .12, (H - cardY - footerReserve - rowGap * (layout.rows - 1)) / layout.rows));
    days.forEach((day, index) => {
      const column = index % layout.columns;
      const row = Math.floor(index / layout.columns);
      climateDrawDayCard(ctx, M + column * (cardW + gap), cardY + row * (cardH + rowGap), cardW, cardH, day, index, dark, false);
    });
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `500 ${Math.max(12, Math.round(Math.min(W, H) * .014))}px Inter, sans-serif`; ctx.fillText('El SMN no devolvió períodos de pronóstico para esta consulta.', M, forecastY + H * .06);
  }

  if (climateData.alerts.length) {
    const alertY = H - H * .17;
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
  if (climateStyle === 'social' && typeof window !== 'undefined' && typeof window.renderClimateSocial === 'function') return window.renderClimateSocial();
  const format = climateFormatConfig();
  const ratio = format.w / format.h;
  const width = Math.max(280, area.clientWidth || 700);
  canvas.width = format.w; canvas.height = format.h; canvas.style.width = '100%'; canvas.style.height = `${Math.round(width / ratio)}px`;
  dibujarClimateCanvas(canvas.getContext('2d'), format.w, format.h);
  preloadClimateIcons(climateData).then(() => {
    if (document.getElementById('climateCanvas') === canvas) dibujarClimateCanvas(canvas.getContext('2d'), format.w, format.h);
  });
}

async function exportarClimate() {
  if (climateStyle === 'social' && typeof window !== 'undefined' && typeof window.exportClimateSocial === 'function') return window.exportClimateSocial();
  const format = climateFormatConfig();
  await preloadClimateIcons(climateData);
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
  const style = document.getElementById('climateStyle');
  if (style) style.value = climateStyle;
  renderClimate();
  if (!climateData && !climateLoading) obtenerClimaVisual(city?.value || 'San Rafael');
}

if (typeof window !== 'undefined') {
  window.initClimate = initClimate;
  window.obtenerClimaVisual = obtenerClimaVisual;
  window.cambiarFormatoClimate = cambiarFormatoClimate;
  window.cambiarEstiloClimate = cambiarEstiloClimate;
  window.renderClimate = renderClimate;
  window.exportarClimate = exportarClimate;
  window.normalizarClimateSMN = normalizarClimateSMN;
  window.getClimateData = () => climateData;
  window.getClimateFormat = () => climateFormat;
  window.getClimateStyle = () => climateStyle;
  window.preloadClimateIcons = preloadClimateIcons;
  window.climateDrawIcon = climateDrawIcon;
  window.climateDrawAtmosphere = climateDrawAtmosphere;
  window.climateIconCodeForTime = climateIconCodeForTime;
  window.climateLongDate = climateLongDate;
  window.climateHeaderMeta = climateHeaderMeta;
  window.climateSocialBackgroundKey = climateSocialBackgroundKey;
  window.climateSocialVisibleDays = climateSocialVisibleDays;
  window.climateSocialFormatConfig = climateSocialFormatConfig;
}

if (typeof module !== 'undefined') module.exports = { normalizarClimateSMN, climateTypeFromSmnCode, climateIconCodeForTime, climateForecastLayout, climateLongDate, climateHeaderMeta, climateDayCardMetrics, climateTodayCardMetrics, climateHeroLayout, climateCardPeriods, climateVisibleDays, climateSocialBackgroundKey, climateSocialVisibleDays, climateSocialFormatConfig };
