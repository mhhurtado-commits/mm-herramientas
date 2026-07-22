export function createCanvas(width, height) {
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}
