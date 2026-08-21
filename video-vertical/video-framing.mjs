import { clampFocus } from './video-project.mjs';

export function getVideoFramePlan({ sourceWidth = 16, sourceHeight = 9, width = 1080, height = 1920, mode = 'contain', focus } = {}) {
  const source = { width: Math.max(1, Number(sourceWidth) || 16), height: Math.max(1, Number(sourceHeight) || 9) };
  const frame = { width: Math.max(1, Number(width) || 1080), height: Math.max(1, Number(height) || 1920) };
  const boundedFocus = clampFocus(focus);
  const backgroundScale = Math.max(frame.width / source.width, frame.height / source.height);
  const background = placed(source, frame, backgroundScale, { x: 0.5, y: 0.5 });
  const crop = mode === 'cover';
  const foregroundScale = crop ? backgroundScale : Math.min(frame.width / source.width, frame.height / source.height);
  return {
    source, frame, focus: boundedFocus,
    background: { ...background, blur: 28, crop: true },
    foreground: { ...placed(source, frame, foregroundScale, boundedFocus), crop },
  };
}

export function getOverlayLayout({ width = 1080, height = 1920 } = {}) {
  const safe = { top: height * 0.07, bottom: height * 0.9, left: width * 0.07, right: width * 0.93 };
  const lowerThird = { x: safe.left, y: height * 0.71, width: safe.right - safe.left, height: height * 0.16 };
  return {
    safe,
    hook: { x: safe.left, y: height * 0.09, width: safe.right - safe.left, height: height * 0.15 },
    caption: { x: safe.left, y: height * 0.56, width: safe.right - safe.left, height: height * 0.1 },
    lowerThird,
  };
}

function placed(source, frame, scale, focus) {
  const width = source.width * scale;
  const height = source.height * scale;
  return { x: (frame.width - width) * focus.x, y: (frame.height - height) * focus.y, width, height, scale };
}
