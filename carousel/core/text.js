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

export function fitText(ctx, text, options) {
  var settings = options || {};
  var fontSize = settings.fontSize || 16;
  var measureContext = ctx || {
    font: "",
    measureText: function (value) {
      return { width: String(value || "").length * fontSize * 0.52 };
    }
  };
  var maxWidth = settings.maxWidth || 0;
  var maxLines = settings.maxLines || 1;
  var initialFontSize = fontSize;
  var minFontSize = settings.minFontSize || initialFontSize;
  var baseLineHeight = settings.lineHeight || Math.round(initialFontSize * 1.2);
  var fontFamily = settings.fontFamily || "sans-serif";
  var originalFont = measureContext.font;
  fontSize = initialFontSize;
  var lines;

  do {
    measureContext.font = fontSize + "px " + fontFamily;
    lines = wrapLines(measureContext, text, maxWidth);
    if (lines.length <= maxLines || fontSize === minFontSize) break;
    fontSize = Math.max(minFontSize, fontSize - 1);
  } while (true);

  measureContext.font = originalFont;
  var lineHeight = Math.round(baseLineHeight * (fontSize / initialFontSize));
  return {
    lines: lines,
    fontSize: fontSize,
    height: lines.length * lineHeight,
    truncated: lines.length > maxLines
  };
}

function wrapLines(ctx, text, maxWidth) {
  var words = String(text || "").trim().split(/\s+/);
  if (!words[0]) return [];

  var lines = [];
  var line = "";
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    var candidate = line ? line + " " + word : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else if (line) {
      lines.push(line);
      if (ctx.measureText(word).width <= maxWidth) {
        line = word;
      } else {
        var piecesAfterLine = splitWord(ctx, word, maxWidth);
        for (var afterLineIndex = 0; afterLineIndex < piecesAfterLine.length - 1; afterLineIndex++) {
          lines.push(piecesAfterLine[afterLineIndex]);
        }
        line = piecesAfterLine[piecesAfterLine.length - 1];
      }
    } else {
      var pieces = splitWord(ctx, word, maxWidth);
      for (var pieceIndex = 0; pieceIndex < pieces.length - 1; pieceIndex++) {
        lines.push(pieces[pieceIndex]);
      }
      line = pieces[pieces.length - 1];
    }
  }
  if (line) lines.push(line);
  return lines;
}

function splitWord(ctx, word, maxWidth) {
  var pieces = [];
  var piece = "";
  for (var i = 0; i < word.length; i++) {
    var candidate = piece + word[i];
    if (piece && ctx.measureText(candidate).width > maxWidth) {
      pieces.push(piece);
      piece = word[i];
    } else {
      piece = candidate;
    }
  }
  if (piece) pieces.push(piece);
  return pieces;
}
