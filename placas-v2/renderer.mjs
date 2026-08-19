import { FAMILIES, calculatePlateLayout, fitTextToLines, normalizeFocus } from './editorial-core.mjs';

const fontFamily = 'Inter, Arial, sans-serif';

const CONTEXT_TYPOGRAPHY = {
  landscape: {
    noticia: { startRatio: 0.021, minRatio: 0.013, maxLines: 2 },
    textual: { startRatio: 0.023, minRatio: 0.014, maxLines: 2 },
    'retrato-circular': { startRatio: 0.021, minRatio: 0.013, maxLines: 2 },
    'editorial-split': { startRatio: 0.018, minRatio: 0.011, maxLines: 2 },
  },
  square: {
    noticia: { startRatio: 0.024, minRatio: 0.014, maxLines: 2 },
    textual: { startRatio: 0.027, minRatio: 0.015, maxLines: 2 },
    'retrato-circular': { startRatio: 0.024, minRatio: 0.014, maxLines: 2 },
    'editorial-split': { startRatio: 0.020, minRatio: 0.012, maxLines: 2 },
  },
  portrait: {
    noticia: { startRatio: 0.038, minRatio: 0.018, maxLines: 3 },
    textual: { startRatio: 0.042, minRatio: 0.019, maxLines: 3 },
    'retrato-circular': { startRatio: 0.036, minRatio: 0.018, maxLines: 3 },
    'editorial-split': { startRatio: 0.030, minRatio: 0.014, maxLines: 3 },
  },
  story: {
    noticia: { startRatio: 0.034, minRatio: 0.018, maxLines: 3 },
    textual: { startRatio: 0.040, minRatio: 0.019, maxLines: 3 },
    'retrato-circular': { startRatio: 0.034, minRatio: 0.018, maxLines: 3 },
    'editorial-split': { startRatio: 0.028, minRatio: 0.014, maxLines: 3 },
  },
};

const SYNTHETIC_TYPOGRAPHY = {
  landscape: { startRatio: 0.072, minRatio: 0.032, maxLines: 3 },
  square: { startRatio: 0.080, minRatio: 0.032, maxLines: 3 },
  portrait: { startRatio: 0.085, minRatio: 0.032, maxLines: 3 },
  story: { startRatio: 0.078, minRatio: 0.030, maxLines: 3 },
};

export function getContextTypography(format, plateType = 'noticia') {
  const byFormat = CONTEXT_TYPOGRAPHY[format] || CONTEXT_TYPOGRAPHY.square;
  return { reserveLines: 1, ...(byFormat[plateType] || byFormat.noticia) };
}

export function getSyntheticTypography(format = 'portrait') {
  return SYNTHETIC_TYPOGRAPHY[format] || SYNTHETIC_TYPOGRAPHY.portrait;
}

export function getFullBleedTypography(format = 'portrait') {
  const base = getSyntheticTypography(format);
  return format === 'story' ? { ...base, startRatio: 0.095, minRatio: 0.038 } : base;
}

export function getFullBleedBranding(format = 'portrait') {
  return format === 'story'
    ? { logoRatio: 0.38, logoHeightRatio: 0.13, gradientStartRatio: 0.38, gradientAlpha: 0.88 }
    : { logoRatio: 0.30, logoHeightRatio: 0.10, gradientStartRatio: 0.46, gradientAlpha: 0.82 };
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function coverImage(ctx, image, rect, focus = { x: 0.5, y: 0.5 }) {
  if (!image || !image.complete || !image.naturalWidth) return false;
  const scale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const normalized = normalizeFocus(focus);
  ctx.drawImage(image, rect.x + (rect.w - dw) * normalized.x, rect.y + (rect.h - dh) * normalized.y, dw, dh);
  return true;
}

function containImage(ctx, image, rect) {
  if (!image || !image.complete || !image.naturalWidth) return false;
  const scale = Math.min(rect.w / image.naturalWidth, rect.h / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, rect.x + (rect.w - w) / 2, rect.y + (rect.h - h) / 2, w, h);
  return true;
}

function containLightLogo(ctx, image, rect, darkColor) {
  if (!image || !image.complete || !image.naturalWidth) return false;
  const width = Math.max(1, Math.round(rect.w));
  const height = Math.max(1, Math.round(rect.h));
  try {
    const surface = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : typeof document !== 'undefined'
        ? Object.assign(document.createElement('canvas'), { width, height })
        : null;
    const surfaceCtx = surface?.getContext('2d');
    if (!surfaceCtx?.getImageData) return containImage(ctx, image, rect);
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    surfaceCtx.drawImage(image, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
    const pixels = surfaceCtx.getImageData(0, 0, width, height);
    const color = darkColor.match(/[a-f\d]{2}/gi)?.map(value => Number.parseInt(value, 16)) || [22, 32, 27];
    for (let index = 0; index < pixels.data.length; index += 4) {
      if (pixels.data[index + 3] > 0 && pixels.data[index] > 220 && pixels.data[index + 1] > 220 && pixels.data[index + 2] > 220) {
        pixels.data[index] = color[0];
        pixels.data[index + 1] = color[1];
        pixels.data[index + 2] = color[2];
      }
    }
    surfaceCtx.putImageData(pixels, 0, 0);
    ctx.drawImage(surface, rect.x, rect.y, width, height);
    return true;
  } catch {
    return containImage(ctx, image, rect);
  }
}

function adaptiveImage(ctx, image, rect, focus = { x: 0.5, y: 0.5 }, forceCover = false) {
  if (!image || !image.complete || !image.naturalWidth) return false;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const frameRatio = rect.w / rect.h;
  const ratioDelta = Math.max(imageRatio / frameRatio, frameRatio / imageRatio);

  /* A mild ratio difference can use a crop; extreme differences keep the full photo. */
  if (forceCover || ratioDelta < 1.28) return coverImage(ctx, image, rect, focus);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.filter = 'blur(22px)';
  coverImage(ctx, image, { x: rect.x - 28, y: rect.y - 28, w: rect.w + 56, h: rect.h + 56 }, focus);
  ctx.restore();

  ctx.save();
  containImage(ctx, image, rect);
  ctx.restore();
  return true;
}

function textLines(ctx, text, x, y, maxWidth, lineHeight, maxLines, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  const maxChars = Math.max(10, Math.floor(maxWidth / Math.max(1, ctx.measureText('M').width) * 1.7));
  const fit = fitTextToLines(text, maxChars, maxLines);
  fit.lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return fit;
}

function wrapMeasuredText(ctx, text, maxWidth) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (!current || ctx.measureText(next).width <= maxWidth) current = next;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}

function fittedText(ctx, text, x, y, maxWidth, startSize, minSize, maxLines, weight, color, lineHeightFactor = 1.08, maxHeight = Infinity) {
  let size = startSize;
  let lines = [];
  while (size >= minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    lines = wrapMeasuredText(ctx, text, maxWidth);
    if (lines.length <= maxLines && lines.length * size * lineHeightFactor <= maxHeight) break;
    size -= 1;
  }
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.…]+$/, '').slice(0, Math.max(1, Math.floor(lines[maxLines - 1].length * 0.94))).trim()}…`;
  }
  ctx.fillStyle = color;
  const lineHeight = size * lineHeightFactor;
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return { lines, size, lineHeight };
}

function drawCircularImage(ctx, image, cx, cy, radius, focus = { x: 0.5, y: 0.5 }) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#d9dfd8';
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  coverImage(ctx, image, { x: cx - radius, y: cy - radius, w: radius * 2, h: radius * 2 }, focus);
  ctx.restore();
}

function drawPortraits(ctx, layout, plate, family, options = {}) {
  const people = Array.isArray(plate.personas) ? plate.personas.slice(0, 3) : [];
  if (!people.length) return;
  const area = layout.portraits;
  const radius = Math.min(area.h * 0.48, layout.canvas.w * 0.105);
  const gap = radius * 2.12;
  const startX = area.x + area.w - radius - gap * (people.length - 1);
  const cy = area.y + area.h * 0.5;
  people.forEach((person, index) => {
    const cx = startX + gap * index;
    const image = options.personImages?.[person.id] || (person.origen === 'nota' ? options.image : null);
    ctx.fillStyle = 'rgba(255,255,255,.96)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + layout.canvas.w * 0.012, 0, Math.PI * 2);
    ctx.fill();
    drawCircularImage(ctx, image, cx, cy, radius, person.foco);
    ctx.strokeStyle = family.color;
    ctx.lineWidth = Math.max(5, layout.canvas.w * 0.006);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    if (person.nombre) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.max(18, layout.canvas.w * 0.015)}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText(person.nombre, cx, cy + radius + layout.canvas.w * 0.035);
      ctx.textAlign = 'left';
    }
  });
}

function drawSupportImage(ctx, layout, family, options = {}) {
  const rect = layout.splitImage;
  ctx.save();
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, layout.canvas.w * 0.012);
  ctx.clip();
  if (!adaptiveImage(ctx, options.supportImage, rect, options.supportFocus, true)) {
    ctx.fillStyle = family.soft;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.fillStyle = 'rgba(22,30,27,.14)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function renderSyntheticPlate(ctx, plate, format, options, family, layout) {
  const { canvas } = layout;
  const titleBelow = plate.tipo_placa === 'titular-abajo';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.w, canvas.h);

  const drawImage = () => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(layout.image.x, layout.image.y, layout.image.w, layout.image.h);
    ctx.clip();
    if (!adaptiveImage(ctx, options.image, layout.image, options.focus, options.forceCover)) {
      const fallback = ctx.createLinearGradient(0, layout.image.y, canvas.w, layout.image.y + layout.image.h);
      fallback.addColorStop(0, family.secondary);
      fallback.addColorStop(1, family.color);
      ctx.fillStyle = fallback;
      ctx.fillRect(layout.image.x, layout.image.y, layout.image.w, layout.image.h);
    }
    const overlay = ctx.createLinearGradient(0, layout.image.y, 0, layout.image.y + layout.image.h * 0.24);
    overlay.addColorStop(0, 'rgba(0,0,0,.42)');
    overlay.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = overlay;
    ctx.fillRect(layout.image.x, layout.image.y, layout.image.w, layout.image.h * 0.24);
    ctx.restore();

    const logoMargin = canvas.w * 0.045;
    const logoW = canvas.w * (format === 'landscape' ? 0.22 : 0.30);
    containImage(ctx, options.logo, { x: canvas.w - logoMargin - logoW, y: layout.image.y + canvas.h * 0.025, w: logoW, h: canvas.h * 0.10 });
  };

  if (titleBelow) drawImage();

  const labelText = String(plate.etiqueta || family.label).toUpperCase();
  const labelSize = Math.max(18, canvas.w * (format === 'story' ? 0.022 : 0.024));
  const labelPadX = canvas.w * 0.018;
  ctx.font = `900 ${labelSize}px ${fontFamily}`;
  const labelW = ctx.measureText(labelText).width + labelPadX * 2;
  const labelH = Math.max(labelSize * 1.45, layout.label.h);
  ctx.fillStyle = family.color;
  roundedRect(ctx, layout.label.x, layout.label.y, labelW, labelH, canvas.w * 0.008);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(labelText, layout.label.x + labelPadX, layout.label.y + labelH * 0.72);

  const title = plate.titulo_sintetico || plate.titulo;
  const typography = getSyntheticTypography(format);
  const titleStart = Math.max(42, canvas.w * typography.startRatio);
  const titleMin = Math.max(28, canvas.w * typography.minRatio);
  fittedText(ctx, title, layout.title.x, layout.title.y + titleStart, layout.title.w, titleStart, titleMin, typography.maxLines, 900, family.secondary, 1.0, layout.title.h);

  if (!titleBelow) drawImage();

  ctx.strokeStyle = 'rgba(22,32,27,.16)';
  ctx.lineWidth = Math.max(2, canvas.h * 0.001);
  ctx.beginPath();
  ctx.moveTo(layout.footer.x, layout.footer.y + layout.footer.h * 0.12);
  ctx.lineTo(canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.12);
  ctx.stroke();
  ctx.fillStyle = '#526058';
  ctx.font = `700 ${Math.max(24, canvas.w * (format === 'portrait' ? 0.022 : 0.019))}px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText('www.mediamendoza.com', canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.68);
  ctx.textAlign = 'left';
  return layout;
}

function renderFullBleedPlate(ctx, plate, format, options, family, layout) {
  const { canvas } = layout;
  const branding = getFullBleedBranding(format);
  ctx.fillStyle = '#17221e';
  ctx.fillRect(0, 0, canvas.w, canvas.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvas.w, canvas.h);
  ctx.clip();
  if (!adaptiveImage(ctx, options.image, layout.image, options.focus, options.forceCover)) {
    const fallback = ctx.createLinearGradient(0, 0, canvas.w, canvas.h);
    fallback.addColorStop(0, family.secondary);
    fallback.addColorStop(1, family.color);
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, canvas.w, canvas.h);
  }
  const gradient = ctx.createLinearGradient(0, canvas.h * branding.gradientStartRatio, 0, canvas.h);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${branding.gradientAlpha})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.w, canvas.h);
  ctx.restore();

  const logoMargin = canvas.w * 0.045;
  const logoW = canvas.w * (format === 'landscape' ? 0.22 : branding.logoRatio);
  containImage(ctx, options.logo, { x: canvas.w - logoMargin - logoW, y: canvas.h * 0.04, w: logoW, h: canvas.h * branding.logoHeightRatio });

  const typography = getFullBleedTypography(format);
  const titleStart = Math.max(42, canvas.w * typography.startRatio);
  const titleMin = Math.max(28, canvas.w * typography.minRatio);
  fittedText(ctx, plate.titulo_sintetico || plate.titulo, layout.title.x, layout.title.y + titleStart, layout.title.w, titleStart, titleMin, typography.maxLines, 900, '#ffffff', 1.0, layout.title.h);
  return layout;
}

function renderDataCardPlate(ctx, plate, format, options, family, layout) {
  const { canvas } = layout;
  const facts = (plate.datos_clave || (plate.contexto ? [{ label: '', value: plate.contexto, detail: '' }] : [])).slice(0, 3);
  ctx.fillStyle = family.soft;
  ctx.fillRect(0, 0, canvas.w, canvas.h);

  const logoW = canvas.w * (format === 'story' ? 0.30 : 0.26);
  containImage(ctx, options.logo, { x: canvas.w - canvas.w * 0.045 - logoW, y: canvas.h * 0.035, w: logoW, h: canvas.h * 0.085 });

  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(22, canvas.w * 0.026)}px ${fontFamily}`;
  ctx.fillText('DATO CLAVE', layout.label.x, layout.label.y + layout.label.h * 0.76);

  const titleSize = Math.max(34, canvas.w * (format === 'story' ? 0.052 : 0.046));
  fittedText(ctx, plate.titulo_sintetico || plate.titulo, layout.title.x, layout.title.y + titleSize, layout.title.w, titleSize, Math.max(24, titleSize * 0.66), 2, 800, family.secondary, 1.08, layout.title.h);

  const primary = facts[0];
  if (primary) {
    const primarySize = Math.max(72, canvas.w * (format === 'story' ? 0.145 : 0.13));
    fittedText(ctx, primary.value, layout.primaryFact.x, layout.primaryFact.y + primarySize, layout.primaryFact.w, primarySize, Math.max(38, canvas.w * 0.055), 2, 900, family.secondary, 1.02, layout.primaryFact.h * 0.62);
    if (primary.label || primary.detail) {
      ctx.fillStyle = '#526058';
      ctx.font = `700 ${Math.max(24, canvas.w * 0.024)}px ${fontFamily}`;
      fittedText(ctx, [primary.label, primary.detail].filter(Boolean).join(' · '), layout.primaryFact.x, layout.primaryFact.y + layout.primaryFact.h * 0.84, layout.primaryFact.w, Math.max(24, canvas.w * 0.024), 18, 2, 700, '#526058', 1.08, layout.primaryFact.h * 0.20);
    }
  }

  const secondary = facts.slice(1);
  const gap = canvas.w * 0.025;
  const cardW = (layout.secondaryFacts.w - gap * Math.max(0, secondary.length - 1)) / Math.max(1, secondary.length);
  secondary.forEach((fact, index) => {
    const x = layout.secondaryFacts.x + index * (cardW + gap);
    const card = { x, y: layout.secondaryFacts.y, w: cardW, h: layout.secondaryFacts.h };
    ctx.fillStyle = '#ffffff';
    roundedRect(ctx, card.x, card.y, card.w, card.h, canvas.w * 0.012);
    ctx.fill();
    const secondarySize = Math.max(38, canvas.w * 0.065);
    fittedText(ctx, fact.value, card.x + card.w * 0.08, card.y + secondarySize, card.w * 0.84, secondarySize, Math.max(24, canvas.w * 0.036), 2, 900, family.secondary, 1.04, card.h * 0.45);
    ctx.fillStyle = '#526058';
    ctx.font = `700 ${Math.max(20, canvas.w * 0.019)}px ${fontFamily}`;
    fittedText(ctx, [fact.label, fact.detail].filter(Boolean).join(' · '), card.x + card.w * 0.08, card.y + card.h * 0.67, card.w * 0.84, Math.max(20, canvas.w * 0.019), 16, 2, 700, '#526058', 1.12, card.h * 0.28);
  });

  ctx.fillStyle = '#526058';
  ctx.font = `700 ${Math.max(18, canvas.w * 0.018)}px ${fontFamily}`;
  const source = 'Fuente: Mediamendoza';
  ctx.fillText(`${source}${plate.fecha ? ` · ${plate.fecha}` : ''}`, layout.footer.x, layout.footer.y + layout.footer.h * 0.56);
  ctx.textAlign = 'right';
  ctx.fillText('www.mediamendoza.com', canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.56);
  ctx.textAlign = 'left';
  return layout;
}

function drawEfemerideIcon(ctx, key, x, y, size, color) {
  const icon = String(key || '').toLowerCase();
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (icon.includes('deport') || icon.includes('futbol') || icon.includes('pelota')) {
    ctx.beginPath(); ctx.arc(x, y, size * 0.34, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, size * 0.12, 0, Math.PI * 2); ctx.stroke();
    [[-0.25, -0.1], [0.2, -0.2], [0.18, 0.24], [-0.2, 0.2]].forEach(([dx, dy]) => { ctx.moveTo(x, y); ctx.lineTo(x + size * dx, y + size * dy); }); ctx.stroke();
  } else if (icon.includes('aviacion') || icon.includes('avion') || icon.includes('vuelo')) {
    ctx.beginPath(); ctx.moveTo(x - size * 0.46, y); ctx.lineTo(x + size * 0.46, y); ctx.moveTo(x - size * 0.05, y); ctx.lineTo(x - size * 0.28, y - size * 0.34); ctx.moveTo(x - size * 0.05, y); ctx.lineTo(x - size * 0.28, y + size * 0.34); ctx.moveTo(x + size * 0.08, y); ctx.lineTo(x + size * 0.32, y - size * 0.2); ctx.lineTo(x + size * 0.42, y - size * 0.2); ctx.moveTo(x + size * 0.08, y); ctx.lineTo(x + size * 0.32, y + size * 0.2); ctx.lineTo(x + size * 0.42, y + size * 0.2); ctx.stroke();
  } else if (icon.includes('teatro') || icon.includes('cultura')) {
    ctx.beginPath(); ctx.arc(x - size * 0.18, y - size * 0.08, size * 0.18, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + size * 0.18, y - size * 0.08, size * 0.18, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - size * 0.38, y + size * 0.32); ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.06, x, y + size * 0.32); ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.06, x + size * 0.38, y + size * 0.32); ctx.stroke();
  } else if (icon.includes('musica') || icon.includes('woodstock') || icon.includes('guitarra')) {
    ctx.beginPath(); ctx.arc(x - size * 0.12, y + size * 0.24, size * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - size * 0.01, y + size * 0.2); ctx.lineTo(x - size * 0.01, y - size * 0.42); ctx.lineTo(x + size * 0.32, y - size * 0.52); ctx.lineTo(x + size * 0.32, y - size * 0.34); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + size * 0.18, y - size * 0.14, size * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (icon.includes('canal') || icon.includes('barco')) {
    ctx.beginPath(); ctx.moveTo(x - size * 0.42, y + size * 0.18); ctx.lineTo(x + size * 0.42, y + size * 0.18); ctx.lineTo(x + size * 0.22, y + size * 0.38); ctx.lineTo(x - size * 0.28, y + size * 0.38); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - size * 0.23, y + size * 0.12); ctx.lineTo(x - size * 0.23, y - size * 0.25); ctx.lineTo(x + size * 0.1, y - size * 0.25); ctx.lineTo(x + size * 0.1, y + size * 0.12); ctx.moveTo(x + size * 0.18, y + size * 0.12); ctx.lineTo(x + size * 0.18, y - size * 0.42); ctx.lineTo(x + size * 0.42, y - size * 0.24); ctx.stroke();
  } else if (icon.includes('mundo') || icon.includes('internacional')) {
    ctx.beginPath(); ctx.arc(x, y - size * 0.08, size * 0.26, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - size * 0.38, y + size * 0.2); ctx.lineTo(x + size * 0.38, y + size * 0.2); ctx.lineTo(x + size * 0.2, y + size * 0.36); ctx.lineTo(x - size * 0.28, y + size * 0.36); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y - size * 0.34); ctx.lineTo(x, y - size * 0.58); ctx.moveTo(x, y - size * 0.55); ctx.lineTo(x + size * 0.18, y - size * 0.42); ctx.stroke();
  } else if (icon.includes('politica')) {
    ctx.beginPath(); ctx.rect(x - size * 0.28, y - size * 0.34, size * 0.56, size * 0.68); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - size * 0.14, y - size * 0.08); ctx.lineTo(x + size * 0.14, y - size * 0.08); ctx.moveTo(x - size * 0.14, y + size * 0.10); ctx.lineTo(x + size * 0.14, y + size * 0.10); ctx.stroke();
  } else if (icon.includes('sociedad')) {
    ctx.beginPath(); ctx.arc(x - size * 0.18, y - size * 0.16, size * 0.14, 0, Math.PI * 2); ctx.arc(x + size * 0.18, y - size * 0.16, size * 0.14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + size * 0.12, size * 0.14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - size * 0.4, y + size * 0.34); ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.04, x, y + size * 0.34); ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.04, x + size * 0.4, y + size * 0.34); ctx.stroke();
  } else if (icon.includes('economia')) {
    ctx.beginPath(); ctx.arc(x, y, size * 0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '900 ' + (size * 0.42) + 'px ' + fontFamily; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', x, y); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  } else if (icon.includes('historia')) {
    ctx.beginPath(); ctx.moveTo(x - size * 0.34, y - size * 0.30); ctx.lineTo(x, y - size * 0.42); ctx.lineTo(x + size * 0.34, y - size * 0.30); ctx.lineTo(x + size * 0.34, y + size * 0.30); ctx.lineTo(x, y + size * 0.18); ctx.lineTo(x - size * 0.34, y + size * 0.30); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - size * 0.40); ctx.lineTo(x, y + size * 0.20); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(x - size * 0.2, y - size * 0.42); ctx.lineTo(x - size * 0.2, y + size * 0.3); ctx.lineTo(x + size * 0.34, y + size * 0.3); ctx.moveTo(x - size * 0.2, y - size * 0.42); ctx.lineTo(x + size * 0.34, y - size * 0.42); ctx.lineTo(x + size * 0.34, y + size * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - size * 0.42, y - size * 0.2); ctx.quadraticCurveTo(x - size * 0.05, y - size * 0.5, x + size * 0.28, y - size * 0.2); ctx.lineTo(x + size * 0.28, y + size * 0.42); ctx.quadraticCurveTo(x - size * 0.05, y + size * 0.15, x - size * 0.42, y + size * 0.42); ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
}

function renderEfemeridesPlate(ctx, plate, format, options, family, layout) {
  const { canvas } = layout;
  const items = (plate.efemerides || []).slice(0, 3);
  ctx.fillStyle = '#f4f6ef';
  ctx.fillRect(0, 0, canvas.w, canvas.h);
  const logoW = canvas.w * (format === 'story' ? 0.30 : 0.26);
  containLightLogo(ctx, options.logo, { x: canvas.w - canvas.w * 0.045 - logoW, y: canvas.h * 0.035, w: logoW, h: canvas.h * 0.075 }, '#16201b');

  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(24, canvas.w * 0.026)}px ${fontFamily}`;
  ctx.fillText('EFEMÉRIDES', layout.label.x, layout.label.y + layout.label.h * 0.76);
  fittedText(ctx, plate.titulo || 'Agenda del día', layout.title.x, layout.title.y + Math.max(44, canvas.w * 0.060), layout.title.w, Math.max(44, canvas.w * 0.060), Math.max(30, canvas.w * 0.038), 2, 900, family.secondary, 1.04, layout.title.h);

  items.forEach((item, index) => {
    const card = layout.cards[index];
    const accent = index === 0 ? family.color : index === 1 ? '#367d9c' : '#b36b27';
    ctx.fillStyle = index === 0 ? '#edf4e4' : index === 1 ? '#e7f1f5' : '#f7ecdf';
    roundedRect(ctx, card.x, card.y, card.w, card.h, canvas.w * 0.012);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(card.x, card.y, canvas.w * 0.012, card.h);
    drawEfemerideIcon(ctx, item.icono || item.categoria, card.x + card.w * 0.91, card.y + card.h * 0.48, Math.min(card.w, card.h) * 0.25, accent);
    const pad = card.w * 0.055;
    ctx.fillStyle = accent;
    ctx.font = `900 ${Math.max(38, canvas.w * 0.050)}px ${fontFamily}`;
    ctx.fillText(item.año || '', card.x + pad, card.y + card.h * 0.43);
    ctx.fillStyle = '#526058';
    ctx.font = `800 ${Math.max(20, canvas.w * 0.020)}px ${fontFamily}`;
    ctx.fillText(String(item.categoria || item.alcance || '').toUpperCase(), card.x + pad, card.y + card.h * 0.19);
    fittedText(ctx, item.titulo || '', card.x + card.w * 0.25, card.y + card.h * 0.40, card.w * 0.61, Math.max(38, canvas.w * 0.040), Math.max(26, canvas.w * 0.027), 2, 800, family.secondary, 1.06, card.h * 0.28);
    ctx.fillStyle = '#526058';
    fittedText(ctx, item.resumen || '', card.x + card.w * 0.25, card.y + card.h * 0.72, card.w * 0.61, Math.max(30, canvas.w * 0.030), Math.max(23, canvas.w * 0.023), 2, 700, '#526058', 1.10, card.h * 0.19);
  });

  ctx.fillStyle = '#526058';
  ctx.font = `700 ${Math.max(18, canvas.w * 0.018)}px ${fontFamily}`;
  ctx.fillText('Fuentes verificadas · Mediamendoza', layout.footer.x, layout.footer.y + layout.footer.h * 0.56);
  ctx.textAlign = 'right';
  ctx.fillText('www.mediamendoza.com', canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.56);
  ctx.textAlign = 'left';
  return layout;
}

function renderComparisonPlate(ctx, plate, format, options, family, layout) {
  const { canvas } = layout;
  const comparison = plate.comparativa || {};
  const left = comparison.izquierda || { etiqueta: '', valor: '', detalle: '' };
  const right = comparison.derecha || { etiqueta: '', valor: '', detalle: '' };
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.w, canvas.h);

  const logoW = canvas.w * (format === 'story' ? 0.30 : 0.26);
  const logoRect = { x: canvas.w - canvas.w * 0.045 - logoW, y: canvas.h * 0.035, w: logoW, h: canvas.h * 0.075 };
  containLightLogo(ctx, options.logo, logoRect, family.secondary);

  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(22, canvas.w * 0.026)}px ${fontFamily}`;
  ctx.fillText('COMPARATIVA', layout.label.x, layout.label.y + layout.label.h * 0.76);

  const titleSize = Math.max(36, canvas.w * (format === 'story' ? 0.052 : 0.046));
  fittedText(ctx, plate.titulo_sintetico || plate.titulo, layout.title.x, layout.title.y + titleSize, layout.title.w, titleSize, Math.max(24, titleSize * 0.66), 2, 800, family.secondary, 1.08, layout.title.h);

  if (options.image && layout.image.h > 0) {
    ctx.save();
    ctx.beginPath();
    roundedRect(ctx, layout.image.x, layout.image.y, layout.image.w, layout.image.h, canvas.w * 0.012);
    ctx.clip();
    if (!adaptiveImage(ctx, options.image, layout.image, options.focus, options.forceCover)) {
      ctx.fillStyle = family.soft;
      ctx.fillRect(layout.image.x, layout.image.y, layout.image.w, layout.image.h);
    }
    ctx.restore();
  }

  const cards = [
    { rect: layout.leftCard, data: left, color: family.soft },
    { rect: layout.rightCard, data: right, color: '#f5f6f3' },
  ];
  cards.forEach(({ rect, data, color }) => {
    ctx.fillStyle = color;
    roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, canvas.w * 0.014);
    ctx.fill();
    ctx.fillStyle = '#526058';
    ctx.font = `800 ${Math.max(22, canvas.w * 0.022)}px ${fontFamily}`;
    if (data.etiqueta) fittedText(ctx, data.etiqueta, rect.x + rect.w * 0.08, rect.y + rect.h * 0.18, rect.w * 0.84, Math.max(22, canvas.w * 0.022), 16, 2, 800, '#526058', 1.08, rect.h * 0.16);
    const valueSize = Math.max(50, canvas.w * (format === 'story' ? 0.085 : 0.075));
    if (data.valor) fittedText(ctx, data.valor, rect.x + rect.w * 0.08, rect.y + rect.h * 0.52, rect.w * 0.84, valueSize, Math.max(28, canvas.w * 0.036), 2, 900, family.secondary, 1.02, rect.h * 0.36);
    if (data.detalle) {
      ctx.fillStyle = '#526058';
      ctx.font = `700 ${Math.max(18, canvas.w * 0.018)}px ${fontFamily}`;
      fittedText(ctx, data.detalle, rect.x + rect.w * 0.08, rect.y + rect.h * 0.86, rect.w * 0.84, Math.max(18, canvas.w * 0.018), 14, 2, 700, '#526058', 1.08, rect.h * 0.12);
    }
  });

  if (left.valor && right.valor) {
    ctx.fillStyle = family.color;
    ctx.font = `900 ${Math.max(20, canvas.w * 0.022)}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('VS', canvas.w / 2, layout.leftCard.y + layout.leftCard.h * 0.54);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#526058';
  ctx.font = `700 ${Math.max(18, canvas.w * 0.018)}px ${fontFamily}`;
  const source = comparison.fuente ? `Fuente: ${comparison.fuente}` : 'Fuente: Mediamendoza';
  ctx.fillText(`${source}${comparison.fecha ? ` · ${comparison.fecha}` : ''}`, layout.footer.x, layout.footer.y + layout.footer.h * 0.56);
  ctx.textAlign = 'right';
  ctx.fillText('www.mediamendoza.com', canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.56);
  ctx.textAlign = 'left';
  return layout;
}

function renderPulsoPlate(ctx, plate, format, options, family, layout) {
  const { canvas } = layout;
  ctx.fillStyle = family.secondary;
  ctx.fillRect(0, 0, canvas.w, canvas.h);
  if (adaptiveImage(ctx, options.image, layout.image, options.focus, options.forceCover)) {
    const overlay = ctx.createLinearGradient(0, canvas.h * 0.30, 0, canvas.h);
    overlay.addColorStop(0, 'rgba(0,0,0,0)'); overlay.addColorStop(1, 'rgba(0,0,0,.86)');
    ctx.fillStyle = overlay; ctx.fillRect(0, 0, canvas.w, canvas.h);
  }
  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(20, canvas.w * 0.024)}px ${fontFamily}`;
  ctx.fillText('PULSO', layout.label.x, layout.label.y + layout.label.h * 0.74);
  const titleSize = Math.max(46, canvas.w * (format === 'story' ? 0.072 : 0.062));
  fittedText(ctx, plate.titulo_sintetico || plate.titulo, layout.impact.x, layout.impact.y + titleSize, layout.impact.w, titleSize, Math.max(28, titleSize * 0.58), 3, 900, '#ffffff', 1.0, layout.impact.h);
  ctx.fillStyle = '#ffffff'; ctx.font = `700 ${Math.max(17, canvas.w * 0.018)}px ${fontFamily}`;
  ctx.fillText('mediamendoza', layout.footer.x, layout.footer.y + layout.footer.h * 0.62);
  return layout;
}

function renderConversationPlate(ctx, plate, format, options, family, layout) {
  const { canvas } = layout;
  ctx.fillStyle = family.soft; ctx.fillRect(0, 0, canvas.w, canvas.h);
  if (adaptiveImage(ctx, options.image, layout.image, options.focus, options.forceCover)) {
    const overlay = ctx.createLinearGradient(0, 0, 0, layout.image.h);
    overlay.addColorStop(0, 'rgba(0,0,0,.10)'); overlay.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = overlay; ctx.fillRect(0, 0, canvas.w, layout.image.h);
  }
  ctx.fillStyle = family.color; ctx.font = `900 ${Math.max(20, canvas.w * 0.024)}px ${fontFamily}`;
  ctx.fillText('CONVERSACIÓN', layout.label.x, layout.label.y + layout.label.h * 0.74);
  const titleSize = Math.max(30, canvas.w * 0.040);
  fittedText(ctx, plate.titulo_sintetico || plate.titulo, layout.title.x, layout.title.y + titleSize, layout.title.w, titleSize, Math.max(22, titleSize * 0.66), 2, 800, family.secondary, 1.05, layout.title.h);
  ctx.fillStyle = family.secondary; ctx.font = `900 ${Math.max(34, canvas.w * 0.052)}px Georgia, serif`;
  ctx.fillText('“', layout.question.x, layout.question.y + canvas.w * 0.04);
  const questionSize = Math.max(30, canvas.w * (format === 'story' ? 0.045 : 0.040));
  fittedText(ctx, plate.pregunta_social || '¿Qué opinás?', layout.question.x + canvas.w * 0.04, layout.question.y + questionSize, layout.question.w - canvas.w * 0.06, questionSize, Math.max(20, questionSize * 0.65), 3, 800, family.secondary, 1.1, layout.question.h);
  ctx.fillStyle = '#526058'; ctx.font = `700 ${Math.max(17, canvas.w * 0.018)}px ${fontFamily}`;
  ctx.fillText('mediamendoza', layout.footer.x, layout.footer.y + layout.footer.h * 0.62);
  return layout;
}

function renderClavesPlate(ctx, plate, format, options, family, layout) {
  const { canvas } = layout;
  const facts = (plate.datos_clave || []).filter(fact => fact?.value).slice(0, 3);
  ctx.fillStyle = family.secondary; ctx.fillRect(0, 0, canvas.w, canvas.h);
  ctx.fillStyle = family.color; ctx.font = `900 ${Math.max(20, canvas.w * 0.024)}px ${fontFamily}`;
  ctx.fillText('CLAVES', layout.label.x, layout.label.y + layout.label.h * 0.74);
  const titleSize = Math.max(32, canvas.w * 0.042);
  fittedText(ctx, plate.titulo_sintetico || plate.titulo, layout.title.x, layout.title.y + titleSize, layout.title.w, titleSize, Math.max(22, titleSize * 0.66), 2, 800, '#ffffff', 1.05, layout.title.h);
  const gap = canvas.h * 0.018;
  const cardH = (layout.facts.h - gap * Math.max(0, facts.length - 1)) / Math.max(1, facts.length);
  facts.forEach((fact, index) => {
    const card = { x: layout.facts.x, y: layout.facts.y + index * (cardH + gap), w: layout.facts.w, h: cardH };
    ctx.fillStyle = index === 0 ? family.color : 'rgba(255,255,255,.10)'; roundedRect(ctx, card.x, card.y, card.w, card.h, canvas.w * 0.014); ctx.fill();
    const valueSize = Math.max(28, canvas.w * 0.042);
    fittedText(ctx, fact.value, card.x + card.w * 0.06, card.y + valueSize * 1.08, card.w * 0.88, valueSize, Math.max(20, valueSize * 0.64), 2, 900, index === 0 ? family.secondary : '#ffffff', 1.0, card.h * 0.58);
    if (fact.label || fact.detail) fittedText(ctx, [fact.label, fact.detail].filter(Boolean).join(' · '), card.x + card.w * 0.06, card.y + card.h * 0.83, card.w * 0.88, Math.max(16, canvas.w * 0.018), 14, 2, 700, index === 0 ? family.secondary : '#dce6df', 1.05, card.h * 0.22);
  });
  ctx.fillStyle = '#dce6df'; ctx.font = `700 ${Math.max(17, canvas.w * 0.018)}px ${fontFamily}`;
  ctx.fillText('mediamendoza', layout.footer.x, layout.footer.y + layout.footer.h * 0.62);
  return layout;
}

export function renderNewsPlate(ctx, plate, format, options = {}) {
  const family = FAMILIES[plate.template_sugerido] || FAMILIES.general;
  const plateType = plate.tipo_placa || 'noticia';
  const layout = calculatePlateLayout(format, plate);
  const { canvas } = layout;
  ctx.canvas.width = canvas.w;
  ctx.canvas.height = canvas.h;
  ctx.clearRect(0, 0, canvas.w, canvas.h);

  const gradient = ctx.createLinearGradient(0, 0, canvas.w, canvas.h);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, family.soft);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.w, canvas.h);

  if (plateType === 'foto-completa') return renderFullBleedPlate(ctx, plate, format, options, family, layout);
  if (plateType === 'dato-clave') return renderDataCardPlate(ctx, plate, format, options, family, layout);
  if (plateType === 'comparativa') return renderComparisonPlate(ctx, plate, format, options, family, layout);
  if (plateType === 'efemerides-social') return renderEfemeridesPlate(ctx, plate, format, options, family, layout);
  if (plateType === 'pulso') return renderPulsoPlate(ctx, plate, format, options, family, layout);
  if (plateType === 'conversacion') return renderConversationPlate(ctx, plate, format, options, family, layout);
  if (plateType === 'claves') return renderClavesPlate(ctx, plate, format, options, family, layout);
  if (['titular-arriba', 'titular-abajo'].includes(plateType)) return renderSyntheticPlate(ctx, plate, format, options, family, layout);

  const isHeaderless = true;
  if (!isHeaderless) {
  ctx.fillStyle = '#16201b';
  ctx.fillRect(0, 0, canvas.w, layout.header.h);
  ctx.fillStyle = family.color;
  ctx.fillRect(0, layout.header.h - Math.max(4, canvas.h * 0.004), canvas.w, Math.max(4, canvas.h * 0.004));

  const headerMargin = canvas.w * 0.045;
  const sectionBarW = Math.max(7, canvas.w * 0.006);
  ctx.fillStyle = family.color;
  ctx.fillRect(headerMargin, layout.header.h * 0.25, sectionBarW, layout.header.h * 0.48);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.max(22, canvas.w * 0.027)}px ${fontFamily}`;
  ctx.fillText(String(family.label).toUpperCase(), headerMargin + sectionBarW + canvas.w * 0.018, layout.header.h * 0.57);
  ctx.fillStyle = 'rgba(255,255,255,.58)';
  ctx.font = `600 ${Math.max(12, canvas.w * 0.010)}px ${fontFamily}`;
  ctx.fillText('INFORMACIÓN LOCAL · EDICIÓN DIGITAL', headerMargin, layout.header.h * 0.86);

  const logoW = canvas.w * (canvas.w / canvas.h > 1.2 ? 0.18 : 0.28);
  const logoH = layout.header.h * 0.62;
  containImage(ctx, options.logo, {
    x: canvas.w - headerMargin - logoW,
    y: layout.header.h * 0.16,
    w: logoW,
    h: logoH,
  });
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(layout.image.x, layout.image.y, layout.image.w, layout.image.h);
  ctx.clip();
  const imageDrawn = adaptiveImage(ctx, options.image, layout.image, options.focus, options.forceCover);
  if (!imageDrawn) {
    const fallback = ctx.createLinearGradient(0, layout.image.y, canvas.w, layout.image.y + layout.image.h);
    fallback.addColorStop(0, family.secondary);
    fallback.addColorStop(1, family.color);
    ctx.fillStyle = fallback;
    ctx.fillRect(layout.image.x, layout.image.y, layout.image.w, layout.image.h);
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.beginPath();
    ctx.arc(canvas.w * 0.74, layout.image.y + layout.image.h * 0.45, layout.image.h * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  const overlay = ctx.createLinearGradient(0, layout.image.y, 0, layout.image.y + layout.image.h);
  overlay.addColorStop(0, 'rgba(0,0,0,0.02)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.48)');
  ctx.fillStyle = overlay;
  ctx.fillRect(layout.image.x, layout.image.y, layout.image.w, layout.image.h);
  ctx.restore();

  if (isHeaderless) {
    const portraitTop = ctx.createLinearGradient(0, layout.image.y, 0, layout.image.y + layout.image.h * 0.28);
    portraitTop.addColorStop(0, 'rgba(0,0,0,.52)');
    portraitTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = portraitTop;
    ctx.fillRect(layout.image.x, layout.image.y, layout.image.w, layout.image.h * 0.28);
    const logoMargin = canvas.w * 0.045;
    const logoW = canvas.w * (format === 'landscape' ? 0.22 : 0.30);
    containImage(ctx, options.logo, {
      x: canvas.w - logoMargin - logoW,
      y: canvas.h * 0.035,
      w: logoW,
      h: canvas.h * 0.10,
    });
  }

  if (plateType === 'retrato-circular') drawPortraits(ctx, layout, plate, family, options);

  const cardX = layout.header.x;
  const cardY = layout.label.y - canvas.h * 0.018;
  const cardW = layout.header.w;
  const cardH = canvas.h - cardY - layout.footer.h - canvas.h * 0.018;
  ctx.fillStyle = 'rgba(255,255,255,.94)';
  roundedRect(ctx, cardX, cardY, cardW, cardH, canvas.w * 0.018);
  ctx.fill();
  if (plateType === 'editorial-split') {
    ctx.fillStyle = family.soft;
    const panel = layout.splitPanel;
    roundedRect(ctx, panel.x, panel.y, panel.w, panel.h, canvas.w * 0.014);
    ctx.fill();
    ctx.fillStyle = family.color;
    ctx.fillRect(panel.x, panel.y, canvas.w * 0.012, panel.h);
    drawSupportImage(ctx, layout, family, options);
  }

  const labelText = String(plate.etiqueta || family.label).toUpperCase();
  const labelSize = Math.max(18, canvas.w * (format === 'landscape' ? 0.018 : 0.024));
  ctx.font = `900 ${labelSize}px ${fontFamily}`;
  if (isHeaderless) {
    const labelPadX = canvas.w * 0.018;
    const labelW = ctx.measureText(labelText).width + labelPadX * 2;
    const labelMetrics = ctx.measureText(labelText);
    const ascent = labelMetrics.actualBoundingBoxAscent || labelSize * 0.78;
    const descent = labelMetrics.actualBoundingBoxDescent || labelSize * 0.22;
    const labelH = Math.max(labelSize * 1.45, ascent + descent + labelSize * 0.42);
    const labelY = layout.label.y + canvas.h * 0.004;
    const labelBaseline = labelY + (labelH - ascent - descent) / 2 + ascent;
    ctx.fillStyle = family.color;
    roundedRect(ctx, layout.label.x, labelY, labelW, labelH, canvas.w * 0.008);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(labelText, layout.label.x + labelPadX, labelBaseline);
  } else {
    ctx.fillStyle = family.color;
    ctx.fillText(labelText, layout.label.x, layout.label.y + layout.label.h * 0.72);
  }

  const textX = plateType === 'editorial-split' ? layout.title.x + canvas.w * 0.39 : layout.title.x;
  const textW = plateType === 'editorial-split' ? layout.title.w - canvas.w * 0.39 : layout.title.w;
  const contextX = plateType === 'editorial-split' ? layout.context.x + canvas.w * 0.39 : layout.context.x;
  const contextW = plateType === 'editorial-split' ? layout.context.w - canvas.w * 0.39 : layout.context.w;
  if (plateType === 'textual') {
    const quote = plate.textual?.cita || plate.titulo;
    const quoteArea = layout.quote;
    ctx.fillStyle = family.color;
    ctx.font = `900 ${Math.max(60, canvas.w * 0.09)}px Georgia, serif`;
    ctx.fillText('“', quoteArea.x, quoteArea.y + canvas.h * 0.10);
    const quoteStart = Math.max(38, canvas.w * (format === 'story' ? 0.052 : 0.048));
    const quoteFit = fittedText(ctx, quote, quoteArea.x + canvas.w * 0.045, quoteArea.y + canvas.h * 0.105, quoteArea.w - canvas.w * 0.08, quoteStart, Math.max(24, canvas.w * 0.024), format === 'story' ? 5 : 4, 800, family.secondary, 1.12);
    const attribution = [plate.textual?.autor, plate.textual?.cargo].filter(Boolean).join(' · ');
    if (attribution) {
      ctx.fillStyle = family.color;
      ctx.font = `800 ${Math.max(22, canvas.w * 0.022)}px ${fontFamily}`;
      ctx.fillText(`— ${attribution}`, quoteArea.x + canvas.w * 0.045, quoteArea.y + canvas.h * 0.105 + quoteFit.lines.length * quoteFit.lineHeight + canvas.h * 0.035);
    }
    if (plate.contexto) {
      const contextY = Math.min(layout.context.y, layout.footer.y - canvas.h * 0.12);
      ctx.fillStyle = family.color;
      ctx.fillRect(layout.context.x, contextY, canvas.w * 0.035, Math.max(5, canvas.h * 0.006));
      fittedText(ctx, plate.contexto, layout.context.x + canvas.w * 0.055, contextY + canvas.h * 0.034, layout.context.w - canvas.w * 0.055, Math.max(24, canvas.w * 0.026), Math.max(18, canvas.w * 0.016), 2, 600, family.secondary, 1.28);
    }
  } else {
  const titleStart = Math.max(34, canvas.w * (format === 'story' ? 0.057 : format === 'square' ? 0.055 : 0.052));
  const titleMin = Math.max(24, canvas.w * (format === 'story' ? 0.024 : 0.024));
  const titleMaxLines = 3;
  const titleFit = fittedText(ctx, plate.titulo, textX, layout.title.y + titleStart, textW, titleStart, titleMin, titleMaxLines, 800, family.secondary);
  const dekStart = Math.max(22, canvas.w * (format === 'story' ? 0.035 : format === 'portrait' ? 0.030 : format === 'square' ? 0.024 : 0.022));
  const dekMin = Math.max(18, canvas.w * (format === 'story' ? 0.022 : format === 'portrait' ? 0.020 : 0.016));
  const dekY = Math.max(layout.dek.y + dekStart, layout.title.y + titleFit.size + titleFit.lineHeight * titleFit.lines.length + canvas.h * 0.018);
  const dekFit = fittedText(ctx, plate.bajada, textX, dekY, textW, dekStart, dekMin, format === 'story' ? 4 : 3, 500, '#526058', 1.35);
  if (plate.contexto) {
    const isStory = format === 'story';
    const contextGap = canvas.h * (isStory ? 0.015 : 0.022);
    const contextPreferredY = dekY + dekFit.lineHeight * dekFit.lines.length + contextGap;
    const contextTypography = getContextTypography(format, plateType);
    const contextPad = canvas.h * (isStory ? 0.026 : format === 'portrait' ? 0.025 : 0.037);
    const footerSafeY = layout.footer.y - canvas.h * (isStory ? 0.025 : 0.035);
    const contextMin = Math.max(12, canvas.w * contextTypography.minRatio);
    const contextMaxY = footerSafeY - contextPad - contextMin * 1.3;
    const contextMinY = dekY + dekFit.lineHeight * dekFit.lines.length + contextGap;
    {
      const contextY = Math.min(contextPreferredY, contextMaxY);
      const contextStart = Math.max(22, canvas.w * contextTypography.startRatio);
      const availableContext = Math.max(contextMin, footerSafeY - (contextY + contextPad));
      const contextMaxLines = contextTypography.maxLines;
      const contextSize = Math.max(contextMin, Math.min(contextStart, availableContext / 1.3 / contextTypography.reserveLines));
      if (isStory) {
        const contextBoxH = Math.min(
          canvas.h * 0.14,
          Math.max(canvas.h * 0.055, footerSafeY - contextY - canvas.h * 0.008, contextPad + contextSize * 1.3 * contextMaxLines + canvas.h * 0.018),
        );
        ctx.fillStyle = family.soft;
        roundedRect(ctx, layout.context.x - canvas.w * 0.018, contextY - canvas.h * 0.014, layout.context.w + canvas.w * 0.036, contextBoxH, canvas.w * 0.012);
        ctx.fill();
      }
      ctx.fillStyle = family.color;
      ctx.fillRect(contextX, contextY + canvas.h * 0.02, canvas.w * 0.035, Math.max(5, canvas.h * 0.006));
      if (format === 'portrait') {
        fittedText(ctx, plate.contexto, contextX + canvas.w * 0.055, contextY + contextPad, contextW - canvas.w * 0.055, contextSize, Math.max(18, canvas.w * 0.014), contextMaxLines, 600, family.secondary, 1.3, availableContext);
      } else {
        fittedText(ctx, plate.contexto, contextX + canvas.w * 0.055, contextY + contextPad, contextW - canvas.w * 0.055, contextSize, Math.max(18, canvas.w * 0.014), contextMaxLines, 600, family.secondary, 1.3, availableContext);
      }
    }
  }
  }

  ctx.strokeStyle = 'rgba(22,32,27,.16)';
  ctx.lineWidth = Math.max(2, canvas.h * 0.001);
  ctx.beginPath();
  ctx.moveTo(layout.footer.x, layout.footer.y + layout.footer.h * 0.12);
  ctx.lineTo(canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.12);
  ctx.stroke();
  ctx.fillStyle = '#526058';
  ctx.font = `700 ${Math.max(24, canvas.w * (format === 'portrait' ? 0.022 : 0.019))}px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText('www.mediamendoza.com', canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.68);
  ctx.textAlign = 'left';
  return layout;
}
