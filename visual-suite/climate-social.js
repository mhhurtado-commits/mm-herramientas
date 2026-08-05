// ============================================================
// Visual Suite - Clima Social: photo-led composition for networks
// ============================================================

const CLIMATE_SOCIAL_PHOTO_BASE = '../assets/clima/social/';
const climateSocialPhotoCache = new Map();
let climateSocialRenderId = 0;

function climateSocialData() {
  return typeof window !== 'undefined' && typeof window.getClimateData === 'function'
    ? window.getClimateData()
    : null;
}

function climateSocialFormat() {
  const key = typeof window !== 'undefined' && typeof window.getClimateFormat === 'function'
    ? window.getClimateFormat()
    : 'square';
  return typeof window !== 'undefined' && typeof window.climateSocialFormatConfig === 'function'
    ? window.climateSocialFormatConfig(key)
    : { w: 1600, h: 1600, cssAR: '1 / 1' };
}

function climateSocialPhoto(key) {
  if (climateSocialPhotoCache.has(key)) return Promise.resolve(climateSocialPhotoCache.get(key));
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => { climateSocialPhotoCache.set(key, image); resolve(image); };
    image.onerror = () => { climateSocialPhotoCache.set(key, null); resolve(null); };
    image.src = `${CLIMATE_SOCIAL_PHOTO_BASE}${key}.jpg`;
  });
}

function socialBackgroundKey(actual = {}) {
  if (typeof window !== 'undefined' && typeof window.climateSocialBackgroundKey === 'function') {
    return window.climateSocialBackgroundKey(actual);
  }
  if (actual.type === 'storm') return 'tormenta';
  const suffix = actual.isDay === false ? 'noche' : 'dia';
  if (['rain', 'rain-light', 'rain-heavy'].includes(actual.type)) return `lluvia-${suffix}`;
  if (actual.type === 'sun') return `despejado-${suffix}`;
  if (actual.type === 'sun-cloud') return `parcial-${suffix}`;
  return `nublado-${suffix}`;
}

function socialVisibleDays(days) {
  return (days || []).slice(0, 3);
}

function socialRoundRect(ctx, x, y, w, h, radius, fill, stroke, lineWidth = 1) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke || 'transparent';
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(radius, w / 2, h / 2));
  ctx.fill();
  if (stroke) ctx.stroke();
  ctx.restore();
}

function socialText(ctx, text, x, y, maxWidth, options = {}) {
  const value = String(text == null ? '' : text);
  const size = options.size || 24;
  const weight = options.weight || 600;
  ctx.save();
  ctx.font = `${weight} ${size}px ${options.family || 'Inter, sans-serif'}`;
  ctx.fillStyle = options.color || '#fff';
  ctx.textAlign = options.align || 'left';
  ctx.textBaseline = options.baseline || 'alphabetic';
  let output = value;
  while (ctx.measureText(output).width > maxWidth && output.length > 3) output = `${output.slice(0, -2).trim()}...`;
  ctx.fillText(output, x, y);
  ctx.restore();
}

function socialWrap(ctx, text, x, y, maxWidth, lineHeight, maxLines, options = {}) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  ctx.save();
  ctx.font = `${options.weight || 600} ${options.size || 24}px ${options.family || 'Inter, sans-serif'}`;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  ctx.restore();
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) visible[maxLines - 1] = `${visible[maxLines - 1].replace(/\s+$/, '')}...`;
  visible.forEach((item, index) => socialText(ctx, item, x, y + index * lineHeight, maxWidth, options));
  return visible.length;
}

function socialDrawPhotoCover(ctx, image, W, H) {
  if (!image) return false;
  const sourceRatio = image.width / image.height;
  const targetRatio = W / H;
  let sx = 0, sy = 0, sw = image.width, sh = image.height;
  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, W, H);
  return true;
}

function socialDrawFallback(ctx, W, H, actual) {
  if (typeof window !== 'undefined' && typeof window.climateDrawAtmosphere === 'function') {
    window.climateDrawAtmosphere(ctx, W, H, actual || { type: 'cloud', isDay: true });
    return;
  }
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, '#18324b');
  gradient.addColorStop(1, '#0d1828');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function socialDrawAtmosphere(ctx, W, H, actual, image) {
  if (!socialDrawPhotoCover(ctx, image, W, H)) socialDrawFallback(ctx, W, H, actual);
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, 'rgba(4,12,22,.50)');
  shade.addColorStop(.48, 'rgba(4,12,22,.30)');
  shade.addColorStop(1, 'rgba(4,12,22,.82)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  const accent = typeof VS_Colors !== 'undefined' ? VS_Colors.ACCENT : '#a6ce39';
  ctx.fillStyle = `${accent}22`;
  ctx.fillRect(0, H * .14, W, H * .003);
  ctx.save();
  ctx.globalAlpha = .16;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1, W * .0008);
  for (let index = 0; index < 7; index++) {
    ctx.beginPath();
    ctx.moveTo(W * (.07 + index * .15), H * .18);
    ctx.lineTo(W * (.22 + index * .15), H * .94);
    ctx.stroke();
  }
  ctx.restore();
}

function socialMetric(ctx, x, y, w, h, label, value, accent) {
  socialRoundRect(ctx, x, y, w, h, Math.min(22, w * .06), 'rgba(7,17,29,.56)', 'rgba(255,255,255,.18)', Math.max(1, w * .002));
  socialText(ctx, label.toUpperCase(), x + w * .1, y + h * .32, w * .8, { size: Math.max(19, Math.round(Math.min(w, h) * .12)), weight: 700, color: 'rgba(255,255,255,.72)' });
  socialText(ctx, value || '--', x + w * .1, y + h * .75, w * .8, { size: Math.max(30, Math.round(Math.min(w, h) * .28)), weight: 800, color: accent || '#fff' });
}

function socialSunMetric(ctx, x, y, w, h, sun) {
  socialRoundRect(ctx, x, y, w, h, Math.min(22, w * .06), 'rgba(7,17,29,.56)', 'rgba(255,255,255,.18)', Math.max(1, w * .002));
  const divider = x + w / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.15)';
  ctx.lineWidth = Math.max(1, w * .0015);
  ctx.beginPath(); ctx.moveTo(divider, y + h * .18); ctx.lineTo(divider, y + h * .86); ctx.stroke();
  ctx.restore();
  socialText(ctx, 'SALIDA', x + w * .25, y + h * .30, w * .38, { size: Math.max(18, Math.round(Math.min(w, h) * .10)), weight: 700, color: 'rgba(255,255,255,.72)', align: 'center' });
  socialText(ctx, 'PUESTA', x + w * .75, y + h * .30, w * .38, { size: Math.max(18, Math.round(Math.min(w, h) * .10)), weight: 700, color: 'rgba(255,255,255,.72)', align: 'center' });
  socialText(ctx, sun?.sunrise || '--', x + w * .25, y + h * .76, w * .38, { size: Math.max(28, Math.round(Math.min(w, h) * .22)), weight: 800, align: 'center' });
  socialText(ctx, sun?.sunset || '--', x + w * .75, y + h * .76, w * .38, { size: Math.max(28, Math.round(Math.min(w, h) * .22)), weight: 800, align: 'center' });
}

function socialDrawHero(ctx, data, x, y, w, h, format) {
  const actual = data?.actual || { type: 'cloud', isDay: true, description: 'Sin datos' };
  const degree = String.fromCharCode(176);
  const accent = typeof VS_Colors !== 'undefined' ? VS_Colors.ACCENT : '#a6ce39';
  socialRoundRect(ctx, x, y, w, h, Math.min(34, w * .035), 'rgba(4,15,27,.60)', `${accent}cc`, Math.max(2, w * .002));
  socialText(ctx, 'AHORA', x + w * .06, y + h * .14, w * .30, { size: Math.max(20, Math.round(Math.min(w, h) * .07)), weight: 800, color: accent });
  const narrow = format.cssAR === '9 / 16';
  const mainW = narrow ? w : w * .52;
  const iconCode = typeof window !== 'undefined' && typeof window.climateIconCodeForTime === 'function'
    ? window.climateIconCodeForTime(actual.code, actual.isDay)
    : actual.code;
  const iconSize = Math.min(mainW * .34, h * (narrow ? .26 : .42));
  const mainCX = x + mainW * .5;
  const iconX = mainCX - mainW * .2;
  const mainY = y + h * (narrow ? .34 : .56);
  if (typeof window !== 'undefined' && typeof window.climateDrawIcon === 'function') window.climateDrawIcon(ctx, iconCode, actual.type, iconX, mainY, iconSize);
  socialText(ctx, actual.temp != null ? `${actual.temp}${degree}` : '--', mainCX + mainW * .08, y + h * (narrow ? .47 : .58), mainW * .55, { size: Math.max(60, Math.round(Math.min(mainW, h) * .23)), weight: 800, align: 'center' });
  socialWrap(ctx, actual.description || 'Estado no informado', mainCX + mainW * .08, y + h * (narrow ? .58 : .76), mainW * .55, Math.max(22, h * .06), 2, { size: Math.max(20, Math.round(Math.min(mainW, h) * .075)), weight: 700, align: 'center', color: 'rgba(255,255,255,.82)' });

  const statX = x + (narrow ? w * .08 : w * .56);
  const statW = narrow ? w * .84 : w * .38;
  const gap = Math.max(10, w * .018);
  const statH = narrow ? h * .16 : h * .25;
  const statY = narrow ? y + h * .65 : y + h * .16;
  const colW = (statW - gap) / 2;
  socialMetric(ctx, statX, statY, colW, statH, 'Sensación', actual.feelsLike != null ? `${actual.feelsLike}${degree}` : '--');
  socialMetric(ctx, statX + colW + gap, statY, colW, statH, 'Humedad', actual.humidity != null ? `${actual.humidity}%` : '--');
  socialMetric(ctx, statX, statY + statH + gap, colW, statH, 'Viento', actual.wind != null ? `${actual.wind} km/h` : '--');
  socialSunMetric(ctx, statX + colW + gap, statY + statH + gap, colW, statH, data?.sun || {});
}

function socialPeriod(day) {
  const segments = (day?.segments || []).filter(Boolean);
  return segments.slice(0, 2);
}

function socialForecastCard(ctx, x, y, w, h, day, index, highlight) {
  const accent = typeof VS_Colors !== 'undefined' ? VS_Colors.ACCENT : '#a6ce39';
  const degree = String.fromCharCode(176);
  socialRoundRect(ctx, x, y, w, h, Math.min(28, w * .05), highlight ? 'rgba(166,206,57,.22)' : 'rgba(5,16,29,.54)', highlight ? accent : 'rgba(255,255,255,.18)', Math.max(2, w * .002));
  const title = index === 0 ? 'Hoy' : (typeof window !== 'undefined' && typeof window.climateLongDate === 'function' ? window.climateLongDate(day?.date) : day?.date || '--');
  socialText(ctx, title, x + w / 2, y + h * .18, w * .86, { size: Math.max(30, Math.round(Math.min(w, h) * .115)), weight: 800, align: 'center' });
  const periods = socialPeriod(day);
  const cellW = w / Math.max(1, periods.length || 2);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = Math.max(1, w * .0015);
  if (periods.length > 1) { ctx.beginPath(); ctx.moveTo(x + cellW, y + h * .28); ctx.lineTo(x + cellW, y + h * .93); ctx.stroke(); }
  ctx.restore();
  const labels = ['Mañana', 'Tarde'];
  (periods.length ? periods : [null, null]).forEach((period, periodIndex) => {
    const cx = x + cellW * periodIndex + cellW / 2;
    socialText(ctx, period?.label || labels[periodIndex], cx, y + h * .37, cellW * .82, { size: Math.max(24, Math.round(Math.min(cellW, h) * .12)), weight: 700, align: 'center', color: 'rgba(255,255,255,.82)' });
    if (!period) { socialText(ctx, '--', cx, y + h * .67, cellW * .7, { size: Math.max(30, Math.round(Math.min(cellW, h) * .18)), weight: 800, align: 'center' }); return; }
    const iconCode = period.code;
    if (typeof window !== 'undefined' && typeof window.climateDrawIcon === 'function') window.climateDrawIcon(ctx, iconCode, period.type, cx, y + h * .56, Math.min(cellW * .28, h * .24));
    socialText(ctx, period.temp != null ? `${period.temp}${degree}` : '--', cx, y + h * .77, cellW * .8, { size: Math.max(32, Math.round(Math.min(cellW, h) * .18)), weight: 800, align: 'center' });
    socialText(ctx, period.rain != null ? `${period.rain}% lluvia` : '--', cx, y + h * .92, cellW * .8, { size: Math.max(19, Math.round(Math.min(cellW, h) * .085)), weight: 700, align: 'center', color: 'rgba(255,255,255,.82)' });
  });
}

function socialDrawFooter(ctx, W, H) {
  if (typeof VS_CanvasHelpers !== 'undefined' && VS_CanvasHelpers.drawFooter) VS_CanvasHelpers.drawFooter(ctx, W, H, true, { onField: true });
}

function drawClimateSocial(ctx, W, H, data, image, formatOverride) {
  const format = formatOverride || climateSocialFormat();
  const narrow = format.cssAR === '9 / 16';
  const wide = format.cssAR === '1.91 / 1';
  const M = W * (wide ? .045 : .055);
  const headerH = Math.round(H * (wide ? .18 : narrow ? .14 : .16));
  const actual = data?.actual || { type: 'cloud', isDay: true, description: 'Esperando datos' };
  socialDrawAtmosphere(ctx, W, H, actual, image);
  if (typeof VS_CanvasHelpers !== 'undefined') {
    VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'CLIMA', data?.ciudad || 'El clima de hoy', headerH, { accent: VS_Colors.ACCENT, titleMaxChars: wide ? 22 : 18, titleMinScale: .78 });
    VS_CanvasHelpers.drawPlateLogo(ctx, W, H, { w: wide ? .18 : .24 });
  }
  if (!data) {
    socialText(ctx, 'Seleccioná una ciudad para consultar el SMN', W / 2, H * .5, W * .8, { size: Math.max(24, Math.round(Math.min(W, H) * .035)), weight: 700, align: 'center' });
    socialDrawFooter(ctx, W, H);
    return;
  }
  const bodyTop = headerH + H * .04;
  const footerReserve = H * .075;
  if (wide) {
    const heroX = M;
    const heroY = bodyTop;
    const heroW = W * .51;
    const heroH = H - bodyTop - footerReserve - H * .035;
    socialDrawHero(ctx, data, heroX, heroY, heroW, heroH, format);
    const forecastX = heroX + heroW + W * .025;
    const forecastW = W - forecastX - M;
    socialText(ctx, 'PRÓXIMOS DÍAS', forecastX, heroY + H * .035, forecastW, { size: Math.max(20, Math.round(Math.min(W, H) * .025)), weight: 800, color: '#fff' });
    const days = socialVisibleDays(data.days);
    const cardGap = H * .018;
    const cardsTop = heroY + H * .065;
    const cardH = (heroH - H * .065 - cardGap * Math.max(0, days.length - 1)) / Math.max(1, days.length);
    days.forEach((day, index) => socialForecastCard(ctx, forecastX, cardsTop + index * (cardH + cardGap), forecastW, cardH, day, index, index === 0));
  } else {
    const heroY = bodyTop;
    const heroH = H * (narrow ? .29 : .29);
    socialDrawHero(ctx, data, M, heroY, W - M * 2, heroH, format);
    const titleY = heroY + heroH + H * .045;
    socialText(ctx, 'PRONÓSTICO BREVE', M, titleY, W - M * 2, { size: Math.max(22, Math.round(Math.min(W, H) * .025)), weight: 800, color: '#fff' });
    const days = socialVisibleDays(data.days);
    const cardsTop = titleY + H * .025;
    const gap = W * .018;
    const cols = narrow ? 1 : 3;
    const rows = Math.ceil(days.length / cols);
    const cardW = (W - M * 2 - gap * (cols - 1)) / cols;
    const availableH = H - cardsTop - footerReserve - gap * Math.max(0, rows - 1);
    const cardH = Math.min(narrow ? H * .18 : H * .25, availableH / Math.max(1, rows));
    days.forEach((day, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      socialForecastCard(ctx, M + col * (cardW + gap), cardsTop + row * (cardH + gap), cardW, cardH, day, index, index === 0);
    });
  }
  const updated = data.actualizado instanceof Date ? data.actualizado : new Date(data.actualizado);
  const meta = typeof window !== 'undefined' && typeof window.climateHeaderMeta === 'function'
    ? window.climateHeaderMeta(data.fuente, updated)
    : 'SMN';
  socialText(ctx, meta, M, H - footerReserve * .86, W - M * 2, { size: Math.max(14, Math.round(Math.min(W, H) * .014)), weight: 700, color: 'rgba(255,255,255,.78)' });
  socialDrawFooter(ctx, W, H);
}

async function renderClimateSocial(parentRenderId) {
  const socialRenderId = ++climateSocialRenderId;
  const canvas = document.getElementById('climateCanvas');
  const area = document.getElementById('climateArea');
  if (!canvas || !area) return;
  const format = climateSocialFormat();
  const ratio = format.w / format.h;
  const width = Math.max(280, area.clientWidth || 700);
  canvas.width = format.w;
  canvas.height = format.h;
  canvas.style.width = '100%';
  canvas.style.height = `${Math.round(width / ratio)}px`;
  const data = climateSocialData();
  const key = socialBackgroundKey(data?.actual);
  const image = await climateSocialPhoto(key);
  if (typeof window !== 'undefined' && typeof window.preloadClimateIcons === 'function') await window.preloadClimateIcons(data);
  if (socialRenderId !== climateSocialRenderId) return;
  if (parentRenderId != null && typeof window !== 'undefined' && typeof window.isClimateRenderCurrent === 'function' && !window.isClimateRenderCurrent(parentRenderId)) return;
  if (typeof window !== 'undefined' && typeof window.getClimateStyle === 'function' && window.getClimateStyle() !== 'social') return;
  if (document.getElementById('climateCanvas') !== canvas) return;
  drawClimateSocial(canvas.getContext('2d'), format.w, format.h, data, image, format);
}

async function exportClimateSocial() {
  const format = climateSocialFormat();
  const data = climateSocialData();
  const key = socialBackgroundKey(data?.actual);
  const image = await climateSocialPhoto(key);
  if (typeof window !== 'undefined' && typeof window.preloadClimateIcons === 'function') await window.preloadClimateIcons(data);
  const canvas = document.createElement('canvas');
  canvas.width = format.w;
  canvas.height = format.h;
  drawClimateSocial(canvas.getContext('2d'), format.w, format.h, data, image, format);
  canvas.toBlob(blob => {
    if (!blob) return toast('No se pudo exportar la placa social de clima');
    const url = URL.createObjectURL(blob);
    mostrarExportPreview(url, 'clima-social-mediamendoza');
  }, 'image/png', 1);
}

if (typeof window !== 'undefined') {
  window.renderClimateSocial = renderClimateSocial;
  window.exportClimateSocial = exportClimateSocial;
}
