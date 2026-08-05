import { FAMILIES, calculatePlateLayout, fitTextToLines, normalizeFocus } from './editorial-core.mjs';

const fontFamily = 'Inter, Arial, sans-serif';

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

export function renderNewsPlate(ctx, plate, format, options = {}) {
  const family = FAMILIES[plate.template_sugerido] || FAMILIES.general;
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

  const cardX = layout.header.x;
  const cardY = layout.label.y - canvas.h * 0.018;
  const cardW = layout.header.w;
  const cardH = canvas.h - cardY - layout.footer.h - canvas.h * 0.018;
  ctx.fillStyle = 'rgba(255,255,255,.94)';
  roundedRect(ctx, cardX, cardY, cardW, cardH, canvas.w * 0.018);
  ctx.fill();

  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(18, canvas.w * 0.018)}px ${fontFamily}`;
  ctx.fillText(String(plate.etiqueta || family.label).toUpperCase(), layout.label.x, layout.label.y + layout.label.h * 0.72);

  const titleSize = Math.max(34, canvas.w * (format === 'story' ? 0.047 : format === 'square' ? 0.055 : 0.052));
  const titleLineHeight = titleSize * 1.08;
  const titleMaxLines = format === 'story' ? 5 : format === 'square' ? 2 : 4;
  const titleFit = textLines(ctx, plate.titulo, layout.title.x, layout.title.y + titleSize, layout.title.w, titleLineHeight, titleMaxLines, `800 ${titleSize}px ${fontFamily}`, family.secondary);
  const dekSize = Math.max(22, canvas.w * (format === 'square' ? 0.024 : 0.022));
  const dekY = Math.max(layout.dek.y + dekSize, layout.title.y + titleSize + titleLineHeight * titleFit.lines.length + canvas.h * 0.018);
  const dekLineHeight = dekSize * 1.35;
  const dekFit = textLines(ctx, plate.bajada, layout.dek.x, dekY, layout.dek.w, dekLineHeight, format === 'square' ? 2 : 3, `500 ${dekSize}px ${fontFamily}`, '#526058');
  if (plate.contexto) {
    const contextY = Math.max(layout.context.y, dekY + dekLineHeight * dekFit.lines.length + canvas.h * 0.022);
    ctx.fillStyle = family.color;
    ctx.fillRect(layout.context.x, contextY + canvas.h * 0.02, canvas.w * 0.035, Math.max(5, canvas.h * 0.006));
    const contextSize = Math.max(16, canvas.w * (format === 'square' ? 0.015 : 0.014));
    textLines(ctx, plate.contexto, layout.context.x + canvas.w * 0.055, contextY + canvas.h * 0.037, layout.context.w - canvas.w * 0.055, contextSize * 1.3, 2, `600 ${contextSize}px ${fontFamily}`, family.secondary);
  }

  ctx.strokeStyle = 'rgba(22,32,27,.16)';
  ctx.lineWidth = Math.max(2, canvas.h * 0.001);
  ctx.beginPath();
  ctx.moveTo(layout.footer.x, layout.footer.y + layout.footer.h * 0.12);
  ctx.lineTo(canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.12);
  ctx.stroke();
  ctx.fillStyle = '#526058';
  ctx.font = `600 ${Math.max(14, canvas.w * 0.011)}px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText('www.mediamendoza.com', canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.68);
  ctx.textAlign = 'left';
  return layout;
}
