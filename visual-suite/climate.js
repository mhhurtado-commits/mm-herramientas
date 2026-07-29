// ============================================================
// Visual Suite — Clima SMN: datos oficiales → placa editorial
// ============================================================

const CLIMATE_WORKER_URL = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const CLIMATE_CITIES = ['San Rafael', 'General Alvear', 'Malargüe', 'Mendoza', 'San Juan', 'San Luis', 'Neuquén'];

let climateData = null;
let climateFormat = 'square';
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
    temp: climateNumber(period.temperature ?? period.temp),
    min: climateNumber(period.temperature?.min ?? period.temp_min ?? period.temperature_min),
    max: climateNumber(period.temperature?.max ?? period.temp_max ?? period.temperature_max),
    rain: climateNumber(rain),
    wind: climateNumber(wind.speed ?? wind.speed_range?.[1]),
    windDirection: wind.direction || ''
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
  const rainValues = periods.map(item => Array.isArray(item.rain_prob_range) ? item.rain_prob_range[1] : null).filter(value => value != null);
  return {
    ...period,
    segments: periods,
    min: climateNumber(day.temp_min ?? day.temperature_min ?? period.min),
    max: climateNumber(day.temp_max ?? day.temperature_max ?? period.max),
    rain: rainValues.length ? Math.max(...rainValues) : period.rain
  };
}

function climateIsDay(weather, sun) {
  if (typeof weather?.is_day === 'boolean') return weather.is_day;
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

function normalizarClimateSMN(payload, ciudad) {
  const root = payload?.data || payload || {};
  const weather = root.weather || {};
  const wind = weather.wind || {};
  const code = weather.weather?.id ?? weather.weather?.code ?? 3;
  const isDay = climateIsDay(weather, root.sun || payload?.sun);
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
      code,
      type,
      description: weather.weather?.description || CLIMATE_WMO[type].label,
      isDay
    },
    sun: root.sun || payload?.sun || {},
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
  const codes = [data.actual?.code, ...(data.days || []).map(day => day.code)].filter(Boolean);
  return Promise.all(codes.map(preloadClimateIcon)).then(() => undefined);
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
  ctx.fillText(icon, x + w * .12, y + w * .2);
  ctx.font = `600 ${Math.max(10, Math.round(w * .075))}px Inter, sans-serif`;
  ctx.fillText(label.toUpperCase(), x + w * .12, y + cardH * .51);
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

function climateDrawDayCard(ctx, x, y, w, h, day, index, dark = true) {
  ctx.fillStyle = index === 0 ? 'rgba(166,206,57,.17)' : 'rgba(255,255,255,.075)';
  ctx.strokeStyle = index === 0 ? VS_Colors.ACCENT : 'rgba(255,255,255,.12)';
  ctx.lineWidth = Math.max(1, w * .006);
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(16, w * .06)); ctx.fill(); ctx.stroke();
  climateDrawText(ctx, climateShortDate(day.date) || '—', x + w / 2, y + h * .16, w * .86, { align: 'center', font: `700 ${Math.max(11, Math.round(w * .075))}px Inter, sans-serif`, color: dark ? '#fff' : VS_Colors.INK, clipX: x, clipY: y, clipW: w, clipH: h });
  ctx.fillStyle = dark ? 'rgba(255,255,255,.62)' : VS_Colors.INK2;
  ctx.font = `600 ${Math.max(9, Math.round(w * .052))}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`${day.min ?? '—'}° / ${day.max ?? '—'}°`, x + w / 2, y + h * .29);

  const allSegments = day.segments || [];
  const segments = index === 0 ? allSegments : allSegments.filter(segment => /mañana|morning|tarde|afternoon/i.test(segment.label || ''));
  const visible = segments.length ? segments : allSegments.slice(0, index === 0 ? 4 : 2);
  const rowTop = y + h * .36;
  const rowH = Math.min(h * .145, (h * .56) / Math.max(visible.length, 1));
  visible.forEach((segment, segmentIndex) => {
    const rowY = rowTop + segmentIndex * rowH;
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    ctx.beginPath(); ctx.roundRect(x + w * .07, rowY, w * .86, rowH * .82, 8); ctx.fill();
    climateDrawIcon(ctx, segment.code, segment.type, x + w * .18, rowY + rowH * .39, rowH * .65);
    ctx.textAlign = 'left';
    ctx.fillStyle = dark ? '#fff' : VS_Colors.INK;
    ctx.font = `700 ${Math.max(9, Math.round(w * .047))}px Inter, sans-serif`;
    ctx.fillText(segment.label || 'Período', x + w * .31, rowY + rowH * .34);
    ctx.fillStyle = dark ? 'rgba(255,255,255,.72)' : VS_Colors.INK2;
    ctx.font = `500 ${Math.max(8, Math.round(w * .043))}px Inter, sans-serif`;
    ctx.fillText(`${segment.temp != null ? `${segment.temp}°` : '—'} · ${segment.rain != null ? `${segment.rain}% lluvia` : segment.description}`, x + w * .31, rowY + rowH * .67);
  });
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
  if (climateData) {
    const updated = climateData.actualizado instanceof Date ? climateData.actualizado : new Date(climateData.actualizado);
    ctx.fillStyle = 'rgba(255,255,255,.66)';
    ctx.font = `600 ${Math.max(11, Math.round(Math.min(W, H) * .011))}px Inter, sans-serif`;
    ctx.fillText(`Fuente: ${climateData.fuente} · Actualizado ${updated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`, M, headerH * .58);
  }

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
  climateDrawIcon(ctx, actual.code, actual.type, M + W * .16, heroY + heroH * .55, heroH * .34);
  ctx.textAlign = 'center';
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
  const metricH = Math.min(metricW * .72, H * .105);
  climateDrawMetric(ctx, M, metricsY, metricW, 'Humedad', actual.humidity != null ? `${actual.humidity}%` : '—', '◌', dark, metricH);
  climateDrawMetric(ctx, M + metricW + metricGap, metricsY, metricW, 'Presión', actual.pressure != null ? `${actual.pressure} hPa` : '—', '⌁', dark, metricH);
  climateDrawMetric(ctx, M + (metricW + metricGap) * 2, metricsY, metricW, 'Ráfagas', actual.gust != null ? `${actual.gust} km/h` : '—', '↗', dark, metricH);
  climateDrawMetric(ctx, M + (metricW + metricGap) * 3, metricsY, metricW, 'Visibilidad', actual.visibility ? `${actual.visibility} km` : '—', '◉', dark, metricH);

  const days = climateData.days.slice(0, format.cssAR === '9 / 16' ? 6 : 4);
  const forecastY = metricsY + metricH + H * .035;
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(14, Math.round(Math.min(W, H) * .018))}px Inter, sans-serif`; ctx.fillText('Pronóstico diario', M, forecastY);
  if (days.length) {
    const gap = W * .014; const cardW = (W - M * 2 - gap * (days.length - 1)) / days.length; const cardH = format.cssAR === '1 / 1' ? H * .19 : H * .17;
    days.forEach((day, index) => climateDrawDayCard(ctx, M + index * (cardW + gap), forecastY + H * .025, cardW, cardH, day, index, dark));
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
  preloadClimateIcons(climateData).then(() => {
    if (document.getElementById('climateCanvas') === canvas) dibujarClimateCanvas(canvas.getContext('2d'), format.w, format.h);
  });
}

async function exportarClimate() {
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
