export function chooseImageMode({ width = 0, height = 0, hasText = false } = {}) {
  if (!width || !height) return hasText ? 'text' : 'cover';
  const ratio = width / height;
  return ratio > 1.2 ? 'contain-blur' : 'cover';
}

export function clampFocus(focus = {}) {
  return { x: clamp(focus.x, 0.5), y: clamp(focus.y, 0.5) };
}

export function getImageDrawPlan({
  sourceWidth,
  sourceHeight,
  canvasWidth,
  canvasHeight,
  mode = 'cover',
  focus = { x: 0.5, y: 0.5 },
} = {}) {
  const sw = Math.max(1, Number(sourceWidth) || 1);
  const sh = Math.max(1, Number(sourceHeight) || 1);
  const cw = Math.max(1, Number(canvasWidth) || 1);
  const ch = Math.max(1, Number(canvasHeight) || 1);
  const boundedFocus = clampFocus(focus);

  if (mode === 'contain-blur') {
    const foregroundScale = Math.min(cw / sw, ch / sh);
    const backgroundScale = Math.max(cw / sw, ch / sh);
    return {
      mode,
      focus: boundedFocus,
      foreground: {
        x: (cw - sw * foregroundScale) / 2,
        y: (ch - sh * foregroundScale) / 2,
        width: sw * foregroundScale,
        height: sh * foregroundScale,
        scale: foregroundScale,
        crop: false,
      },
      background: {
        x: (cw - sw * backgroundScale) / 2,
        y: (ch - sh * backgroundScale) / 2,
        width: sw * backgroundScale,
        height: sh * backgroundScale,
        scale: backgroundScale,
        blur: Math.max(14, Math.round(cw * 0.025)),
      },
    };
  }

  const scale = Math.max(cw / sw, ch / sh);
  const width = sw * scale;
  const height = sh * scale;
  return {
    mode: 'cover',
    focus: boundedFocus,
    foreground: {
      x: (cw - width) * boundedFocus.x,
      y: (ch - height) * boundedFocus.y,
      width,
      height,
      scale,
      crop: true,
    },
    background: null,
  };
}

function clamp(value, fallback) {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return Math.min(1, Math.max(0, numeric));
}
