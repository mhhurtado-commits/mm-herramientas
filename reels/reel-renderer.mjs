import { getImageDrawPlan } from './reel-image-layout.mjs';

const DEFAULT_LOGO = '../assets/logo.png';
const COLORS = {
  paper: '#fbfaf7',
  ink: '#18211d',
  muted: '#53605a',
  dark: '#14201b',
  white: '#ffffff',
};

export function sceneLayout({ width = 1080, height = 1920, type = 'text' } = {}) {
  const safe = { top: height * 0.08, bottom: height * 0.9, left: width * 0.08, right: width * 0.92 };
  return {
    width,
    height,
    safe,
    logo: { x: safe.left, y: height * 0.035, width: width * 0.28, height: height * 0.045 },
    accentBar: { x: safe.left, y: height * 0.105, width: width * 0.24, height: 4 },
    content: { x: safe.left, y: height * 0.22, width: safe.right - safe.left, height: height * 0.58 },
    imageArea: type === 'closure' ? null : type === 'cover'
      ? { x: 0, y: 0, width, height: height * 0.55 }
      : { x: 0, y: height * 0.54, width, height: height * 0.33 },
    cta: { x: safe.left, y: type === 'closure' ? height * 0.68 : safe.bottom - height * 0.08, width: safe.right - safe.left, height: height * 0.08 },
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
  const layout = sceneLayout({ width, height, type: scene.type });
  const accent = scene.accent || '#a8d432';
  const image = scene.image
    ? (assets[scene.image] || (assets.imageUrl === scene.image ? assets.image : null))
    : null;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, width, height);

  if (image && scene.imageMode !== 'text') drawAdaptiveImage(ctx, image, scene, width, height, layout.imageArea);
  if (scene.type !== 'closure') {
    drawLogo(ctx, assets.logo || options.logo, layout.logo, scene.type === 'cover' ? COLORS.white : COLORS.ink, {
      contrast: scene.type !== 'cover',
      shadow: true,
    });
  }
  drawAccent(ctx, accent, layout.accentBar, scene.type === 'cover' ? 0.9 : 1);

  if (scene.type === 'closure') {
    drawClosure(ctx, scene, layout, accent, assets.logo || options.logo);
  } else {
    drawEditorialText(ctx, scene, layout, accent);
  }
  return layout;
}

function drawAdaptiveImage(ctx, image, scene, width, height, area = { x: 0, y: 0, width, height }) {
  const plan = getImageDrawPlan({
    sourceWidth: image.naturalWidth || image.width,
    sourceHeight: image.naturalHeight || image.height,
    canvasWidth: area.width,
    canvasHeight: area.height,
    mode: scene.imageMode,
    focus: scene.focus,
  });
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.width, area.height);
    ctx.clip();
    if (plan.background) {
      ctx.save();
      ctx.filter = `blur(${plan.background.blur}px)`;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(image, area.x + plan.background.x, area.y + plan.background.y, plan.background.width, plan.background.height);
      ctx.restore();
      ctx.fillStyle = 'rgba(10, 18, 15, 0.32)';
      ctx.fillRect(area.x, area.y, area.width, area.height);
    }
    ctx.drawImage(image, area.x + plan.foreground.x, area.y + plan.foreground.y, plan.foreground.width, plan.foreground.height);
    ctx.restore();
}

function drawLogo(ctx, logo, box, color, options = {}) {
  if (!logo) return;
  ctx.save();
  ctx.globalAlpha = 0.96;
  if (typeof logo === 'object') {
    if (options.contrast) {
      ctx.filter = 'brightness(0.62) saturate(0.9)';
    }
    if (options.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 3;
    }
    const scale = Math.min(box.width / logo.width, box.height / logo.height);
    const width = logo.width * scale;
    const height = logo.height * scale;
    ctx.drawImage(logo, box.x, box.y, width, height);
  } else {
    ctx.fillStyle = color;
    ctx.font = '700 30px Arial, sans-serif';
    ctx.fillText('mediamendoza', box.x, box.y + box.height * 0.65);
  }
  ctx.restore();
}

function drawEditorialText(ctx, scene, layout, accent) {
  const x = layout.content.x;
  const width = layout.content.width;
  const hasImage = Boolean(scene.image);
  const y = hasImage && scene.type === 'cover' ? layout.height * 0.55 : hasImage ? layout.height * 0.17 : layout.content.y;
  const titleSize = scene.type === 'cover' ? 76 : 70;
  ctx.save();
  if (hasImage && scene.type === 'cover') {
    ctx.fillStyle = 'rgba(251, 250, 247, 0.96)';
    roundedRect(ctx, layout.safe.left * 0.55, y - 40, width + layout.safe.left * 0.9, layout.height * 0.32, 36);
    ctx.fill();
  } else if (hasImage) {
    ctx.fillStyle = 'rgba(251, 250, 247, 0.97)';
    roundedRect(ctx, layout.safe.left * 0.55, y - 34, width + layout.safe.left * 0.9, layout.height * 0.35, 36);
    ctx.fill();
  }
  drawPill(ctx, clean(scene.type === 'cover' ? scene.section || '' : scene.type.replace('-', ' ')), x, y, accent, false, width);
  const titleY = y + 112;
  ctx.fillStyle = COLORS.ink;
  ctx.font = `800 ${titleSize}px Arial, sans-serif`;
  const titleLines = wrapText(ctx, scene.title || 'Media Mendoza', width, 3);
  drawLines(ctx, titleLines, x, titleY, titleSize * 1.05, COLORS.ink);
  const bodyY = titleY + titleLines.length * titleSize * 1.05 + 54;
  ctx.font = '500 40px Arial, sans-serif';
  const bodyLines = wrapText(ctx, scene.body || '', width, 4);
  if (scene.type === 'dato-clave') {
    const blockY = bodyY - 34;
    const blockHeight = Math.max(138, bodyLines.length * 52 + 62);
    ctx.fillStyle = `${accent}20`;
    roundedRect(ctx, x - 18, blockY - 34, width + 36, blockHeight, 24);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(x - 18, blockY - 34, 8, blockHeight);
    ctx.font = '700 40px Arial, sans-serif';
    drawLines(ctx, bodyLines, x + 18, blockY + 18, 52, COLORS.ink);
  } else {
    drawLines(ctx, bodyLines, x, bodyY, 52, COLORS.muted);
  }
  ctx.restore();
}

function drawClosure(ctx, scene, layout, accent, logo) {
  const x = layout.content.x;
  const width = layout.content.width;
  ctx.save();
  ctx.fillStyle = COLORS.dark;
  roundedRect(ctx, layout.safe.left * 0.55, layout.height * 0.22, width + layout.safe.left * 0.9, layout.height * 0.5, 36);
  ctx.fill();
  drawLogo(ctx, logo, { x, y: layout.height * 0.27, width: width * 0.38, height: layout.height * 0.055 }, COLORS.white);
  ctx.fillStyle = COLORS.white;
  ctx.font = '800 70px Arial, sans-serif';
  drawLines(ctx, wrapText(ctx, scene.title || 'Seguí informado', width, 2), x, layout.height * 0.45, 78, COLORS.white);
  ctx.font = '500 38px Arial, sans-serif';
  drawLines(ctx, wrapText(ctx, scene.body || '', width, 3), x, layout.height * 0.61, 50, '#dbe3de');
  ctx.fillStyle = accent;
  roundedRect(ctx, x, layout.cta.y, width, layout.cta.height, 24);
  ctx.fill();
  ctx.fillStyle = COLORS.dark;
  ctx.font = '800 34px Arial, sans-serif';
  ctx.fillText(scene.cta || 'Leé la nota completa en mediamendoza.com', x + 28, layout.cta.y + layout.cta.height * 0.62);
  ctx.restore();
}

function drawPill(ctx, text, x, y, accent, inverse = false, maxWidth = (ctx.canvas?.width || 1080) - x - 24) {
  if (!text) return;
  const label = String(text).toUpperCase();
  const padding = 46;
  let fontSize = 27;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${fontSize}px Arial, sans-serif`;
  while (fontSize > 18 && ctx.measureText(label).width + padding > maxWidth) {
    fontSize -= 1;
    ctx.font = `800 ${fontSize}px Arial, sans-serif`;
  }
  const width = Math.min(maxWidth, ctx.measureText(label).width + padding);
  const height = fontSize + 27;
  ctx.fillStyle = accent;
  roundedRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = inverse ? COLORS.dark : COLORS.white;
  ctx.fillText(label, x + width / 2, y + height / 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function drawAccent(ctx, accent, bar, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = accent;
  roundedRect(ctx, bar.x, bar.y, bar.width, bar.height, bar.height / 2);
  ctx.fill();
  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function drawLines(ctx, lines, x, y, lineHeight, color) {
  ctx.fillStyle = color;
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
