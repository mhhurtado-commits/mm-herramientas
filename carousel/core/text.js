var _fontSize = 32;
var _color = "#111111";
var _align = "start";
var _baseline = "top";

function setCtx(ctx, font, color, align, baseline) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align || "start";
  ctx.textBaseline = baseline || "top";
}

export function drawTitle(ctx, text, x, y, maxW, lineH, color) {
  if (!text) return y;
  setCtx(ctx, "bold 48px sans-serif", color || "#111111", "start", "top");
  return wrapText(ctx, text, x, y, maxW, lineH || 56);
}

export function drawSubtitle(ctx, text, x, y, maxW, lineH, color) {
  if (!text) return y;
  setCtx(ctx, "28px sans-serif", color || "#666666", "start", "top");
  return wrapText(ctx, text, x, y, maxW, lineH || 36);
}

export function drawParagraph(ctx, text, x, y, maxW, lineH, color, fontSize) {
  if (!text) return y;
  setCtx(ctx, (fontSize || 32) + "px sans-serif", color || "#333333", "start", "top");
  return wrapText(ctx, text, x, y, maxW, lineH || 40);
}

export function drawList(ctx, items, x, y, maxW, lineH, color, fontSize) {
  if (!items || !items.length) return y;
  setCtx(ctx, (fontSize || 30) + "px sans-serif", color || "#333333", "start", "top");
  var lh = lineH || 38;

  for (var i = 0; i < items.length; i++) {
    var bullet = "•  " + items[i];
    var nextY = wrapText(ctx, bullet, x, y, maxW, lh);
    y = nextY + 12;
  }
  return y;
}

export function wrapText(ctx, text, x, y, maxW, lineH) {
  var words = text.split(" ");
  var line = "";
  for (var i = 0; i < words.length; i++) {
    var test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxW && line.length > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[i] + " ";
      y += lineH;
    } else {
      line = test;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, y);
    y += lineH;
  }
  return y;
}
