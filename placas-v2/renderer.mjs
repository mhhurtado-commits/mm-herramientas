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

function fittedText(ctx, text, x, y, maxWidth, startSize, minSize, maxLines, weight, color, lineHeightFactor = 1.08) {
  let size = startSize;
  let lines = [];
  while (size >= minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    lines = wrapMeasuredText(ctx, text, maxWidth);
    if (lines.length <= maxLines) break;
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
    const contextPreferredY = format === 'portrait'
      ? dekY + dekFit.lineHeight * dekFit.lines.length + contextGap
      : Math.max(layout.context.y, dekY + dekFit.lineHeight * dekFit.lines.length + contextGap);
    const contextPad = canvas.h * (isStory ? 0.026 : format === 'portrait' ? 0.025 : 0.037);
    const footerSafeY = layout.footer.y - canvas.h * (isStory ? 0.025 : 0.035);
    const contextMin = Math.max(12, canvas.w * 0.01);
    const contextMaxY = footerSafeY - contextPad - contextMin * 1.3;
    const contextMinY = dekY + dekFit.lineHeight * dekFit.lines.length + contextGap;
    if (contextMinY <= contextMaxY) {
      const contextY = Math.min(contextPreferredY, contextMaxY);
      const contextStart = Math.max(22, canvas.w * (isStory ? 0.026 : format === 'portrait' ? 0.028 : format === 'square' ? 0.016 : 0.014));
      const availableContext = Math.max(contextMin, footerSafeY - (contextY + contextPad));
      const contextMaxLines = format === 'portrait' ? 3 : 2;
      const contextSize = Math.max(contextMin, Math.min(contextStart, availableContext / 1.3 / contextMaxLines));
      if (isStory) {
        const contextBoxH = Math.min(
          canvas.h * 0.09,
          Math.max(canvas.h * 0.055, footerSafeY - contextY - canvas.h * 0.008, contextPad + contextSize * 1.3 * 2 + canvas.h * 0.018),
        );
        ctx.fillStyle = family.soft;
        roundedRect(ctx, layout.context.x - canvas.w * 0.018, contextY - canvas.h * 0.014, layout.context.w + canvas.w * 0.036, contextBoxH, canvas.w * 0.012);
        ctx.fill();
      }
      ctx.fillStyle = family.color;
      ctx.fillRect(contextX, contextY + canvas.h * 0.02, canvas.w * 0.035, Math.max(5, canvas.h * 0.006));
      if (format === 'portrait') {
        fittedText(ctx, plate.contexto, contextX + canvas.w * 0.055, contextY + contextPad, contextW - canvas.w * 0.055, contextSize, Math.max(18, canvas.w * 0.014), contextMaxLines, 600, family.secondary, 1.3);
      } else {
        textLines(ctx, plate.contexto, contextX + canvas.w * 0.055, contextY + contextPad, contextW - canvas.w * 0.055, contextSize * 1.3, 2, `600 ${contextSize}px ${fontFamily}`, family.secondary);
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
