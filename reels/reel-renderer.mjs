import { getImageDrawPlan } from './reel-image-layout.mjs';

const DEFAULT_LOGO = '../assets/logo.png';
const COLORS = { paper: '#fbfaf7', ink: '#18211d', muted: '#53605a', dark: '#14201b', white: '#ffffff' };

export function sceneLayout({ width = 1080, height = 1920, type = 'text', hasImage = false } = {}) {
  const safe = { top: height * 0.07, bottom: height * 0.92, left: width * 0.08, right: width * 0.92 };
  const isCover = type === 'cover';
  const isClosure = type === 'closure';
  const internalImage = !isCover && !isClosure && hasImage;
  const imageArea = isClosure ? null : isCover
    ? { x: 0, y: 0, width, height: height * 0.56 }
    : internalImage ? { x: 0, y: height * 0.16, width, height: height * 0.32 } : null;
  const textFrame = !isCover && !isClosure
    ? internalImage
      ? { x: safe.left * 0.55, y: height * 0.51, width: safe.right - safe.left + safe.left * 0.9, height: height * 0.36 }
      : { x: safe.left * 0.55, y: height * 0.19, width: safe.right - safe.left + safe.left * 0.9, height: height * 0.69 }
    : null;
  return {
    width, height, safe,
    logo: { x: safe.left, y: height * 0.035, width: width * 0.28, height: height * 0.045 },
    accentBar: { x: safe.left, y: height * 0.105, width: width * 0.24, height: 4 },
    imageArea,
    coverCard: isCover ? { x: safe.left * 0.55, y: height * 0.59, width: safe.right - safe.left + safe.left * 0.9, height: height * 0.31 } : null,
    textFrame,
    closureSurface: isClosure ? { x: 0, y: 0, width, height } : null,
    cta: { x: safe.left, y: isClosure ? height * 0.75 : safe.bottom - height * 0.08, width: safe.right - safe.left, height: height * 0.075 },
  };
}

export function renderReelProject(canvas, project, assets = {}, sceneIndex = 0) {
  const width = canvas.width || 1080;
  const height = canvas.height || 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El canvas no tiene contexto 2D.');
  const scene = project?.scenes?.[sceneIndex] || project?.scenes?.[0];
  if (!scene) throw new Error('El proyecto no tiene escenas.');
  renderReelScene(ctx, { ...scene, section: scene.section || project.section }, assets, { width, height, logo: assets.logo || DEFAULT_LOGO });
  return canvas;
}

export function renderReelScene(ctx, scene = {}, assets = {}, options = {}) {
  const width = options.width || ctx.canvas?.width || 1080;
  const height = options.height || ctx.canvas?.height || 1920;
  const image = scene.image ? (assets[scene.image] || (assets.imageUrl === scene.image ? assets.image : null)) : null;
  const hasImage = Boolean(image && scene.imageMode !== 'text');
  const layout = sceneLayout({ width, height, type: scene.type, hasImage });
  const accent = scene.accent || '#a8d432';

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = scene.type === 'closure' ? COLORS.dark : COLORS.paper;
  ctx.fillRect(0, 0, width, height);
  if (hasImage && layout.imageArea) drawAdaptiveImage(ctx, image, scene, layout.imageArea);

  if (scene.type === 'closure') drawClosure(ctx, scene, layout, accent, assets.logo || options.logo);
  else {
    drawLogo(ctx, assets.logo || options.logo, layout.logo, scene.type === 'cover' ? COLORS.white : COLORS.ink, { contrast: scene.type !== 'cover', shadow: true });
    drawAccent(ctx, accent, layout.accentBar, scene.type === 'cover' ? 0.9 : 1);
    if (scene.type === 'cover') drawCover(ctx, scene, layout, accent);
    else drawInternalScene(ctx, scene, layout, accent, hasImage);
  }
  return layout;
}

function drawAdaptiveImage(ctx, image, scene, area) {
  const plan = getImageDrawPlan({ sourceWidth: image.naturalWidth || image.width, sourceHeight: image.naturalHeight || image.height, canvasWidth: area.width, canvasHeight: area.height, mode: scene.imageMode, focus: scene.focus });
  ctx.save();
  ctx.beginPath(); ctx.rect(area.x, area.y, area.width, area.height); ctx.clip();
  if (plan.background) {
    ctx.save(); ctx.filter = `blur(${plan.background.blur}px)`; ctx.globalAlpha = 0.55;
    ctx.drawImage(image, area.x + plan.background.x, area.y + plan.background.y, plan.background.width, plan.background.height); ctx.restore();
    ctx.fillStyle = 'rgba(10, 18, 15, 0.28)'; ctx.fillRect(area.x, area.y, area.width, area.height);
  }
  ctx.drawImage(image, area.x + plan.foreground.x, area.y + plan.foreground.y, plan.foreground.width, plan.foreground.height);
  ctx.restore();
}

function drawCover(ctx, scene, layout, accent) {
  const card = layout.coverCard;
  ctx.save();
  ctx.fillStyle = 'rgba(251,250,247,0.97)'; roundedRect(ctx, card.x, card.y, card.width, card.height, 36); ctx.fill();
  ctx.fillStyle = accent; ctx.fillRect(card.x, card.y + 42, 10, 48);
  const x = layout.safe.left;
  const pillY = card.y + 38;
  drawPill(ctx, clean(scene.section), x, pillY, accent, false, layout.safe.right - x);
  const titleTop = pillY + 106;
  const title = fitTextToBox(ctx, scene.title || '', layout.safe.right - x, card.height * 0.44, { startSize: 72, minSize: 44, weight: 800, maxLines: 4 });
  drawLines(ctx, title.lines, x, titleTop, title.lineHeight, COLORS.ink);
  const bodyTop = titleTop + title.height + 38;
  const body = fitTextToBox(ctx, scene.body || '', layout.safe.right - x, card.y + card.height - bodyTop - 34, { startSize: 32, minSize: 23, weight: 500, maxLines: 4 });
  drawLines(ctx, body.lines, x, bodyTop, body.lineHeight, COLORS.muted);
  ctx.restore();
}

function drawInternalScene(ctx, scene, layout, accent, hasImage) {
  const frame = layout.textFrame;
  const x = layout.safe.left;
  const width = layout.safe.right - x;
  ctx.save();
  ctx.fillStyle = accent; ctx.globalAlpha = 0.07; roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, 34); ctx.fill();
  ctx.globalAlpha = 0.34; ctx.strokeStyle = accent; ctx.lineWidth = 3; roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, 34); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = accent; ctx.fillRect(frame.x, frame.y, 12, frame.height);
  if (hasImage) { ctx.globalAlpha = 0.45; ctx.fillRect(0, layout.imageArea.y + layout.imageArea.height - 6, layout.width, 6); ctx.globalAlpha = 1; }

  const padTop = hasImage ? 42 : 58;
  drawPill(ctx, clean(scene.type === 'dato-clave' ? 'Dato clave' : scene.type.replace('-', ' ')), x, frame.y + padTop, accent, false, width);
  const titleTop = frame.y + padTop + 100;
  const title = fitTextToBox(ctx, scene.title || '', width, hasImage ? frame.height * 0.29 : frame.height * 0.27, { startSize: hasImage ? 56 : 68, minSize: 36, weight: 800, maxLines: 3 });
  drawLines(ctx, title.lines, x, titleTop, title.lineHeight, COLORS.ink);
  const contentTop = titleTop + title.height + 34;
  const cards = Array.isArray(scene.cards) ? scene.cards.filter(card => clean(card.text)) : [];
  if (cards.length) drawFactCards(ctx, cards, x, contentTop, width, frame.y + frame.height - contentTop - 36, accent);
  else {
    const body = fitTextToBox(ctx, scene.body || '', width, frame.y + frame.height - contentTop - 36, { startSize: hasImage ? 34 : 42, minSize: 24, weight: 500, maxLines: 9 });
    drawLines(ctx, body.lines, x, contentTop, body.lineHeight, COLORS.muted);
  }
  ctx.restore();
}

function drawFactCards(ctx, cards, x, y, width, availableHeight, accent) {
  const visible = cards.slice(0, 2);
  const gap = 18;
  const cardHeight = (availableHeight - gap * Math.max(0, visible.length - 1)) / visible.length;
  let currentY = y;
  for (const card of visible) {
    ctx.fillStyle = `${accent}18`; roundedRect(ctx, x - 18, currentY, width + 36, cardHeight, 24); ctx.fill();
    ctx.fillStyle = accent; ctx.fillRect(x - 18, currentY, 8, cardHeight);
    const label = clean(card.label);
    let textY = currentY + 38;
    if (label) { ctx.font = '800 21px Arial, sans-serif'; ctx.fillStyle = accent; ctx.fillText(label.toUpperCase(), x + 18, textY); textY += 34; }
    const fitted = fitTextToBox(ctx, card.text, width - 58, cardHeight - (textY - currentY) - 28, { startSize: 36, minSize: 23, weight: 600, maxLines: 7 });
    drawLines(ctx, fitted.lines, x + 18, textY + fitted.fontSize, fitted.lineHeight, COLORS.ink);
    currentY += cardHeight + gap;
  }
}

function drawClosure(ctx, scene, layout, accent, logo) {
  const x = layout.safe.left;
  const width = layout.safe.right - x;
  ctx.save();
  drawLogo(ctx, logo, { x, y: layout.height * 0.095, width: width * 0.4, height: layout.height * 0.06 }, COLORS.white);
  drawAccent(ctx, accent, { x, y: layout.height * 0.075, width: width * 0.22, height: 4 }, 1);
  const title = fitTextToBox(ctx, scene.title || 'SeguÃ­ la cobertura', width, layout.height * 0.18, { startSize: 72, minSize: 46, weight: 800, maxLines: 3 });
  const titleTop = layout.height * 0.44;
  drawLines(ctx, title.lines, x, titleTop, title.lineHeight, COLORS.white);
  const body = fitTextToBox(ctx, scene.body || 'MÃ¡s informaciÃ³n en mediamendoza.com', width, layout.cta.y - (titleTop + title.height) - 70, { startSize: 38, minSize: 26, weight: 500, maxLines: 3 });
  drawLines(ctx, body.lines, x, titleTop + title.height + 54, body.lineHeight, '#dbe3de');
  ctx.fillStyle = accent; roundedRect(ctx, layout.cta.x, layout.cta.y, layout.cta.width, layout.cta.height, 24); ctx.fill();
  const cta = fitTextToBox(ctx, scene.cta || 'LeÃ© la nota completa', layout.cta.width - 56, layout.cta.height - 26, { startSize: 32, minSize: 22, weight: 800, maxLines: 2 });
  const ctaY = layout.cta.y + (layout.cta.height - cta.height) / 2 + cta.fontSize;
  drawLines(ctx, cta.lines, layout.cta.x + 28, ctaY, cta.lineHeight, COLORS.dark);
  ctx.restore();
}

export function fitTextToBox(ctx, text, width, height, { startSize = 40, minSize = 22, weight = 500, maxLines = Infinity } = {}) {
  const content = clean(text);
  if (!content) return { lines: [], fontSize: startSize, lineHeight: Math.round(startSize * 1.24), height: 0 };
  for (let fontSize = startSize; fontSize >= minSize; fontSize -= 1) {
    ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;
    const lineHeight = Math.round(fontSize * 1.24);
    const lines = wrapText(ctx, content, width);
    if (lines.length <= maxLines && lines.length * lineHeight <= height) return { lines, fontSize, lineHeight, height: lines.length * lineHeight };
  }
  const fontSize = minSize;
  ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;
  const lineHeight = Math.round(fontSize * 1.24);
  const lines = wrapText(ctx, content, width);
  return { lines, fontSize, lineHeight, height: lines.length * lineHeight };
}

function drawLogo(ctx, logo, box, color, options = {}) {
  if (!logo) return;
  ctx.save(); ctx.globalAlpha = 0.96;
  if (typeof logo === 'object') {
    if (options.contrast) ctx.filter = 'brightness(0.62) saturate(0.9)';
    if (options.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.42)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3; }
    const scale = Math.min(box.width / logo.width, box.height / logo.height);
    ctx.drawImage(logo, box.x, box.y, logo.width * scale, logo.height * scale);
  } else { ctx.fillStyle = color; ctx.font = '700 30px Arial, sans-serif'; ctx.fillText('mediamendoza', box.x, box.y + box.height * 0.65); }
  ctx.restore();
}

function drawPill(ctx, text, x, y, accent, inverse = false, maxWidth = (ctx.canvas?.width || 1080) - x - 24) {
  if (!text) return;
  const label = String(text).toUpperCase(); let fontSize = 25; const padding = 42;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${fontSize}px Arial, sans-serif`;
  while (fontSize > 18 && ctx.measureText(label).width + padding > maxWidth) { fontSize -= 1; ctx.font = `800 ${fontSize}px Arial, sans-serif`; }
  const pillWidth = Math.min(maxWidth, ctx.measureText(label).width + padding); const pillHeight = fontSize + 25;
  ctx.fillStyle = accent; roundedRect(ctx, x, y, pillWidth, pillHeight, pillHeight / 2); ctx.fill(); ctx.fillStyle = inverse ? COLORS.dark : COLORS.white; ctx.fillText(label, x + pillWidth / 2, y + pillHeight / 2);
  ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
}

function drawAccent(ctx, accent, bar, alpha) { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = accent; roundedRect(ctx, bar.x, bar.y, bar.width, bar.height, bar.height / 2); ctx.fill(); ctx.restore(); }
function roundedRect(ctx, x, y, width, height, radius) { ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); }
function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean); const lines = []; let current = '';
  for (const word of words) { const candidate = current ? `${current} ${word}` : word; if (current && ctx.measureText(candidate).width > maxWidth) { lines.push(current); current = word; } else current = candidate; }
  if (current) lines.push(current); return lines;
}
function drawLines(ctx, lines, x, y, lineHeight, color) { ctx.fillStyle = color; lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight)); }
function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
