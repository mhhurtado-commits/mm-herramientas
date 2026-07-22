export function drawImageCover(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height) return;
  var scale = Math.max(h / img.height, w / img.width);
  var sw = img.width * scale;
  var sh = img.height * scale;
  var sx = (sw - w) / 2;
  var sy = (sh - h) / 2;
  ctx.drawImage(img, -sx, -sy, sw, sh);
}

export function drawImageContain(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height) return;
  var scale = Math.min(h / img.height, w / img.width);
  var dw = img.width * scale;
  var dh = img.height * scale;
  var dx = x + (w - dw) / 2;
  var dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}
