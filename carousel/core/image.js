export function normalizeFocalPosition(value) {
  const center = { x: 0.5, y: 0.5 };
  const named = {
    'top-left': { x: 0, y: 0 },
    top: { x: 0.5, y: 0 },
    'top-right': { x: 1, y: 0 },
    left: { x: 0, y: 0.5 },
    center,
    right: { x: 1, y: 0.5 },
    'bottom-left': { x: 0, y: 1 },
    bottom: { x: 0.5, y: 1 },
    'bottom-right': { x: 1, y: 1 },
  };

  if (typeof value === 'string') {
    return named[value.trim().toLowerCase()] || center;
  }
  if (!value || typeof value !== 'object') return center;

  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return center;
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

export function drawImageCover(ctx, img, x, y, w, h, focalPosition) {
  if (!img || !img.width || !img.height) return;
  var scale = Math.max(h / img.height, w / img.width);
  var sw = img.width * scale;
  var sh = img.height * scale;
  var focus = normalizeFocalPosition(focalPosition);
  var sx = (sw - w) * focus.x;
  var sy = (sh - h) * focus.y;
  ctx.drawImage(img, x - sx, y - sy, sw, sh);
}

export function drawImageContain(ctx, img, x, y, w, h, focalPosition) {
  if (!img || !img.width || !img.height) return;
  var scale = Math.min(h / img.height, w / img.width);
  var dw = img.width * scale;
  var dh = img.height * scale;
  var focus = normalizeFocalPosition(focalPosition);
  var dx = x + (w - dw) * focus.x;
  var dy = y + (h - dh) * focus.y;
  ctx.drawImage(img, dx, dy, dw, dh);
}
