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

  ctx.fillStyle = family.secondary;
  ctx.fillRect(0, 0, canvas.w, layout.header.y + layout.header.h + canvas.h * 0.018);
  ctx.fillStyle = family.color;
  ctx.fillRect(layout.header.x, layout.header.y + layout.header.h - canvas.h * 0.012, layout.header.w, canvas.h * 0.012);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.max(18, canvas.w * 0.018)}px ${fontFamily}`;
  ctx.fillText('MEDIA MENDOZA', layout.header.x, layout.header.y + layout.header.h * 0.42);
  ctx.fillStyle = family.color;
  ctx.font = `900 ${Math.max(18, canvas.w * 0.018)}px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText(family.symbol, canvas.w - layout.header.x, layout.header.y + layout.header.h * 0.42);
  ctx.textAlign = 'left';

  ctx.save();
  ctx.beginPath();
  ctx.rect(layout.image.x, layout.image.y, layout.image.w, layout.image.h);
  ctx.clip();
  const imageDrawn = coverImage(ctx, options.image, layout.image, options.focus);
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

  const titleSize = Math.max(34, canvas.w * (format === 'story' ? 0.047 : 0.052));
  textLines(ctx, plate.titulo, layout.title.x, layout.title.y + titleSize, layout.title.w, titleSize * 1.08, format === 'story' ? 5 : 4, `800 ${titleSize}px ${fontFamily}`, family.secondary);
  const dekSize = Math.max(22, canvas.w * 0.022);
  textLines(ctx, plate.bajada, layout.dek.x, layout.dek.y + dekSize, layout.dek.w, dekSize * 1.35, 3, `500 ${dekSize}px ${fontFamily}`, '#526058');
  if (plate.contexto) {
    ctx.fillStyle = family.color;
    ctx.fillRect(layout.context.x, layout.context.y + canvas.h * 0.02, canvas.w * 0.035, Math.max(5, canvas.h * 0.006));
    textLines(ctx, plate.contexto, layout.context.x + canvas.w * 0.055, layout.context.y + canvas.h * 0.037, layout.context.w - canvas.w * 0.055, Math.max(16, canvas.w * 0.014) * 1.3, 2, `600 ${Math.max(16, canvas.w * 0.014)}px ${fontFamily}`, family.secondary);
  }

  ctx.fillStyle = family.color;
  ctx.fillRect(layout.footer.x, layout.footer.y, layout.footer.w * 0.22, Math.max(6, canvas.h * 0.006));
  ctx.fillStyle = '#6a746c';
  ctx.font = `500 ${Math.max(16, canvas.w * 0.012)}px ${fontFamily}`;
  ctx.fillText('Noticias confiables del sur mendocino', layout.footer.x, layout.footer.y + layout.footer.h * 0.72);
  ctx.textAlign = 'right';
  ctx.fillText(plate.fuente?.url ? 'Fuente: noticia original' : 'Media Mendoza', canvas.w - layout.footer.x, layout.footer.y + layout.footer.h * 0.72);
  ctx.textAlign = 'left';
  return layout;
}
