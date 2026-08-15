import { createCanvas } from "./core/canvas.js";
import { getCarouselLayout } from "./core/layout.js";
import { drawImageContain, drawImageCover } from "./core/image.js";
import { resolveCarouselTheme } from "./core/theme.js";
import { normalizeCarouselSlide } from "./slide-model.js";
import { resolveSupportImage } from "./image-provenance.js";

var W = 1080;
var H = 1350;
var IMAGE_PROXY = "https://mm-herramientas-worker.mhhurtado.workers.dev?image=";
var imageCache = {};
var INTERNAL_TITLE_MAX_LINES = 2;

export function getBalancedContentY(minY, maxBottom, contentHeight) {
  var safeMinY = Math.max(0, Number(minY) || 0);
  var safeBottom = Math.max(safeMinY, Number(maxBottom) || safeMinY);
  var safeHeight = Math.max(0, Number(contentHeight) || 0);
  return Math.max(safeMinY, Math.round(safeMinY + (safeBottom - safeMinY - safeHeight) / 2));
}

function fillRoundRect(ctx, x, y, w, h, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, w, h, radius, stroke, lineWidth) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth || 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.stroke();
}

function normalizeImageSource(src) {
  if (!src) return "";
  if (src.indexOf("data:") === 0 || src.indexOf("blob:") === 0) return src;
  if (src.indexOf("/assets/") === 0 || src.indexOf("./") === 0 || src.indexOf("../") === 0) return src;
  if (src.indexOf(IMAGE_PROXY) === 0) return src;
  if (/^https?:\/\//i.test(src)) return IMAGE_PROXY + encodeURIComponent(src);
  return src;
}

function getImageEntry(src) {
  var normalizedSrc = normalizeImageSource(src);
  if (!normalizedSrc || typeof Image === "undefined") return null;

  var cached = imageCache[normalizedSrc];
  if (cached) return cached;

  var img = new Image();
  var resolveLoad;
  var entry = {
    img: img,
    loaded: false,
    failed: false,
    promise: new Promise(function (resolve) { resolveLoad = resolve; }),
  };
  imageCache[normalizedSrc] = entry;
  img.crossOrigin = "anonymous";
  img.onload = function () {
    var loadedEntry = imageCache[normalizedSrc];
    if (!loadedEntry) return;
    loadedEntry.loaded = true;
    resolveLoad(img);
    if (typeof window !== "undefined" && window.dispatchEvent && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("carousel:asset-ready", { detail: { src: normalizedSrc } }));
    }
  };
  img.onerror = function () {
    var failedEntry = imageCache[normalizedSrc];
    if (failedEntry) failedEntry.failed = true;
    resolveLoad(null);
    if (typeof window !== "undefined" && window.dispatchEvent && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("carousel:asset-error", { detail: { src: normalizedSrc } }));
    }
  };
  img.src = normalizedSrc;
  return entry;
}

function getCachedImage(src, onReady) {
  var entry = getImageEntry(src);
  if (!entry) return null;
  if (entry.loaded) return entry.img;
  if (onReady) {
    entry.promise.then(function (image) {
      if (image) onReady(image);
    });
  }
  return null;
}

export function preloadCarouselAssets(slides, project) {
  if (typeof Image === "undefined") return Promise.resolve([]);
  var list = Array.isArray(slides) ? slides : [slides];
  var sources = ["/assets/logo.png"];

  for (var i = 0; i < list.length; i++) {
    var slide = list[i] && list[i].slide ? list[i].slide : list[i];
    if (!slide) continue;
    var content = slide.content || {};
    var supportImage = resolveSupportImage(content.supportImage, project && project.article);
    if (supportImage) sources.push(supportImage);
    if (slide.template === "cover" || slide.type === "cover") {
      sources.push(content.image || (project && project.article && project.article.image));
    } else if (slide.template === "image" || slide.type === "imagen") {
      sources.push(content.image);
    }
  }

  var uniqueSources = [];
  for (var sourceIndex = 0; sourceIndex < sources.length; sourceIndex++) {
    var normalized = normalizeImageSource(sources[sourceIndex]);
    if (normalized && uniqueSources.indexOf(normalized) === -1) uniqueSources.push(normalized);
  }

  return Promise.all(uniqueSources.map(function (source) {
    var entry = getImageEntry(source);
    return entry ? entry.promise : Promise.resolve(null);
  }));
}

function drawImageFallback(ctx, x, y, w, h, radius, theme, label) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  ctx.fillStyle = theme.colors.surfaceSoft;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = theme.colors.accentSoft;
  ctx.fillRect(x, y, w, Math.max(18, Math.round(h * 0.12)));
  ctx.restore();
  drawMeasuredText(ctx, label, x + 28, y + Math.max(24, Math.round((h - 68) / 2)), Math.max(1, w - 56), {
    fontSize: 28, minFontSize: 20, maxLines: 2, lineHeight: 34, weight: "700", color: theme.colors.accentDark,
    role: "image-fallback",
    maxBottom: y + h - 24,
  });
  strokeRoundRect(ctx, x, y, w, h, radius, theme.colors.brandLine, 2);
  return true;
}

function drawImageFrame(ctx, src, x, y, w, h, radius, focalPosition, theme) {
  var image = getCachedImage(src);
  if (!image) return drawImageFallback(ctx, x, y, w, h, radius, theme, "Imagen no disponible");
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  drawImageCover(ctx, image, x, y, w, h, focalPosition);
  ctx.restore();
  strokeRoundRect(ctx, x, y, w, h, radius, "rgba(255,255,255,0.7)", 2);
  return true;
}

function drawSupportImage(ctx, src, x, y, w, h, mode, theme, focalPosition) {
  var image = getCachedImage(src);
  if (!image) return drawImageFallback(ctx, x, y, w, h, 24, theme, "Sin imagen");
  if (image.width < 640 || image.height < 360) return false;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.clip();
  ctx.fillStyle = theme.colors.surface;
  ctx.fillRect(x, y, w, h);
  if (mode === "contain") {
    drawImageContain(ctx, image, x, y, w, h, focalPosition);
  } else {
    drawImageCover(ctx, image, x, y, w, h, focalPosition);
  }
  ctx.restore();
  strokeRoundRect(ctx, x, y, w, h, 24, theme.colors.brandLine, 2);
  return true;
}

function drawLogo(ctx, project, theme, layout, overImage) {
  var logo = getCachedImage("/assets/logo.png");
  if (!logo) return;
  var isOverImage = overImage === true;
  var isEnd = overImage === "end";
  var zone = layout.safeZones.logo;
  var width = isEnd ? 300 : (isOverImage ? 250 : 220);
  var height = logo.height * (width / logo.width);
  var x = zone.x;
  var y = zone.y;

  if (isOverImage) {
    var position = project && project.settings && project.settings.coverLogoPosition || "right";
    if (position === "right" || position === "top-right") {
      x = W - zone.x - width;
    } else if (position === "center") {
      x = (W - width) / 2;
    } else if (position === "image-footer") {
      x = (W - width) / 2;
      y = Math.max(zone.y, layout.content.y - height - 32);
    } else if (position === "bottom-right") {
      x = W - zone.x - width;
      y = layout.safeZones.footer.y - height - 24;
    }
  }

  ctx.save();
  if (!isOverImage && !isEnd) {
    ctx.shadowColor = "rgba(27,30,34,0.58)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 1;
  }
  if (isOverImage) {
    ctx.shadowColor = "rgba(0,0,0,0.42)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
  }
  ctx.drawImage(logo, x, y, width, height);
  ctx.restore();
}

function drawEditorialHeader(ctx, slide, project, theme, layout, options) {
  var content = slide.content || {};
  var label = content.eyebrow || content.kicker || content.label ||
    theme.sectionLabel || (project.article && project.article.category) || "";
  var x = layout.content.x;
  var y = options && options.y ? options.y : layout.content.y;
  if (!label) return y;

  var text = String(label).toUpperCase();
  var maxWidth = Math.min(options && options.maxWidth ? options.maxWidth : layout.content.width, layout.content.width);
  var textOptions = {
    fontSize: 22,
    minFontSize: 16,
    maxLines: 2,
    lineHeight: 28,
    weight: "700",
    role: "eyebrow",
  };
  var measured = getMeasuredText(ctx, text, Math.max(1, maxWidth - 42), textOptions, y + 9);
  var originalFont = ctx.font;
  ctx.font = getTextFont(textOptions, measured.fontSize);
  var measuredWidth = 0;
  for (var widthIndex = 0; widthIndex < measured.lines.length; widthIndex++) {
    measuredWidth = Math.max(measuredWidth, ctx.measureText(measured.lines[widthIndex]).width);
  }
  var width = Math.min(maxWidth, measuredWidth);
  var height = Math.max(30, measured.height);
  recordMeasuredBlock(ctx, measured, textOptions.role);
  ctx.fillStyle = options && options.light ? theme.colors.white : theme.colors.accentDark;
  ctx.textBaseline = "top";
  ctx.__carouselLineHeight = measured.lineHeight;
  for (var lineIndex = 0; lineIndex < measured.lines.length; lineIndex++) {
    ctx.fillText(measured.lines[lineIndex], x + 26, y + lineIndex * measured.lineHeight);
  }
  ctx.fillStyle = theme.colors.accent;
  ctx.fillRect(x, y, 8, height);
  ctx.font = originalFont;
  ctx.textBaseline = "top";
  return y + height + 24;
}

function getTextFont(settings, fontSize) {
  var style = settings.style ? settings.style + " " : "";
  return style + (settings.weight || "400") + " " + fontSize + "px " + (settings.fontFamily || "Inter, Arial, sans-serif");
}

function fitMeasuredText(ctx, text, maxWidth, settings, maxLines, maxHeight) {
  var initialFontSize = settings.fontSize || 40;
  var minFontSize = settings.minFontSize || 24;
  var originalFont = ctx.font;
  var fontSize = initialFontSize;
  var lines = [];

  do {
    ctx.font = getTextFont(settings, fontSize);
    lines = settings.preserveLineBreaks
      ? wrapMeasuredParagraphs(ctx, text, maxWidth)
      : wrapMeasuredLines(ctx, text, maxWidth);
    var measuredLineHeight = Math.round((settings.lineHeight || 48) * (fontSize / initialFontSize));
    var fitsHeight = !Number.isFinite(maxHeight) || lines.length * measuredLineHeight <= maxHeight;
    if ((lines.length <= maxLines && fitsHeight) || fontSize === minFontSize) break;
    fontSize = Math.max(minFontSize, fontSize - 1);
  } while (true);

  var condensed = false;
  if (lines.length > maxLines && settings.autoCondense) {
    lines = condenseMeasuredLines(ctx, text, maxWidth, maxLines);
    condensed = true;
  }

  ctx.font = originalFont;
  var lineHeight = Math.round((settings.lineHeight || 48) * (fontSize / initialFontSize));
  return {
    lines: lines,
    fontSize: fontSize,
    truncated: lines.length > maxLines && !condensed,
    condensed: condensed,
    height: lines.length * lineHeight,
  };
}

function condenseMeasuredLines(ctx, text, maxWidth, maxLines) {
  var words = String(text || "").trim().split(/\s+/);
  var lines = [];
  var line = "";

  for (var i = 0; i < words.length; i++) {
    var candidate = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (lines.length === maxLines) break;
    line = words[i];
  }
  if (lines.length < maxLines && line) lines.push(line);

  while (lines.length && /^(de|del|la|el|las|los|para|por|con|y|e|en)$/i.test(lastWord(lines[lines.length - 1]))) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s+\S+$/, "").trim();
    if (!lines[lines.length - 1]) lines.pop();
  }
  return lines.slice(0, maxLines);
}

function lastWord(value) {
  var words = String(value || "").trim().split(/\s+/);
  return words[words.length - 1] || "";
}

function wrapMeasuredLines(ctx, text, maxWidth) {
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
        var piecesAfterLine = splitMeasuredWord(ctx, word, maxWidth);
        for (var afterLineIndex = 0; afterLineIndex < piecesAfterLine.length - 1; afterLineIndex++) {
          lines.push(piecesAfterLine[afterLineIndex]);
        }
        line = piecesAfterLine[piecesAfterLine.length - 1];
      }
    } else {
      var pieces = splitMeasuredWord(ctx, word, maxWidth);
      for (var pieceIndex = 0; pieceIndex < pieces.length - 1; pieceIndex++) {
        lines.push(pieces[pieceIndex]);
      }
      line = pieces[pieces.length - 1];
    }
  }
  if (line) lines.push(line);
  return lines;
}

function wrapMeasuredParagraphs(ctx, text, maxWidth) {
  var paragraphs = String(text || "").split(/\r?\n/);
  var lines = [];

  for (var i = 0; i < paragraphs.length; i++) {
    var paragraphLines = wrapMeasuredLines(ctx, paragraphs[i], maxWidth);
    if (paragraphLines.length) {
      lines.push.apply(lines, paragraphLines);
    } else if (i > 0 && i < paragraphs.length - 1) {
      lines.push("");
    }
  }
  return lines;
}

function splitMeasuredWord(ctx, word, maxWidth) {
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

function getMeasuredText(ctx, text, maxWidth, options, y) {
  var settings = options || {};
  var initialFontSize = settings.fontSize || 40;
  var lineHeight = settings.lineHeight || 48;
  var maxLines = settings.maxLines === undefined ? 6 : settings.maxLines;
  if (Number.isFinite(settings.maxBottom) && settings.maxBottom <= y) maxLines = 0;

  var value = String(text || "");
  var fitMaxLines = maxLines === 0 ? 1 : maxLines;
  var availableHeight = Number.isFinite(settings.maxBottom) ? Math.max(0, settings.maxBottom - y) : Infinity;
  var result = fitMeasuredText(ctx, value, maxWidth, settings, fitMaxLines, availableHeight);

  var measuredLineHeight = Math.round(lineHeight * (result.fontSize / initialFontSize));
  var overflow = maxLines === 0 || result.truncated || result.lines.length > maxLines || result.height > availableHeight;
  var visibleLines = maxLines === 0 ? [] : result.lines.slice(0, maxLines);
  return {
    fullText: value,
    fullLines: result.lines,
    lines: visibleLines,
    fontSize: result.fontSize,
    lineHeight: measuredLineHeight,
    height: visibleLines.length * measuredLineHeight,
    renderedText: visibleLines.join(" "),
    overflow: overflow,
  };
}

function recordMeasuredBlock(ctx, measured, role) {
  var renderState = ctx.__carouselRenderState;
  if (!renderState) return;
  renderState.overflow = renderState.overflow || measured.overflow;
  renderState.blocks.push({
    role: role || "text",
    fullText: measured.fullText,
    renderedText: measured.renderedText,
    fullLines: measured.fullLines.length,
    renderedLines: measured.lines.length,
    overflow: measured.overflow,
  });
}

function drawMeasuredText(ctx, text, x, y, maxWidth, options) {
  if (!text) return y;
  var settings = options || {};
  var lineHeight = settings.lineHeight || 48;
  var measured = getMeasuredText(ctx, text, maxWidth, settings, y);
  recordMeasuredBlock(ctx, measured, settings.role);
  ctx.font = getTextFont(settings, measured.fontSize);
  ctx.fillStyle = settings.color || "#111111";
  ctx.textBaseline = "top";
  ctx.__carouselLineHeight = measured.lineHeight;
  for (var i = 0; i < measured.lines.length; i++) {
    ctx.fillText(measured.lines[i], x, y + i * measured.lineHeight);
  }
  return y + measured.height;
}

function measureTextHeight(ctx, text, maxWidth, options) {
  if (!text) return 0;
  var settings = options || {};
  return getMeasuredText(ctx, text, maxWidth, settings, settings.y || 0).height;
}

function drawSlideProgress(ctx, slide, project, theme, layout) {
  var total = slide.total || (project.slides && project.slides.length) || 1;
  var current = (slide.order || 0) + 1;
  var footer = layout.safeZones.footer;
  ctx.fillStyle = theme.colors.brandLine;
  ctx.fillRect(footer.x, footer.y + footer.height / 2 - 3, footer.width * (current / total), 6);
  ctx.textBaseline = "top";
}

function drawEditorialFooter(ctx, slide, project, theme, layout) {
  var footer = layout.safeZones.footer;
  ctx.strokeStyle = theme.colors.brandLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(layout.content.x, footer.y - 18);
  ctx.lineTo(layout.content.x + layout.content.width, footer.y - 18);
  ctx.stroke();
  drawSlideProgress(ctx, slide, project, theme, layout);
}

function drawContextCard(ctx, text, x, y, width, maxBottom, theme, role) {
  if (!text) return y;
  var textOptions = { fontSize: 31, minFontSize: 23, maxLines: 5, lineHeight: 39, color: theme.colors.textSecondary, role: role || "body" };
  var textHeight = measureTextHeight(ctx, text, width - 72, {
    ...textOptions,
    y: y + 31,
    maxBottom: maxBottom - 31,
  });
  var height = Math.max(142, textHeight + 62);
  if (y + height > maxBottom) y = Math.max(0, maxBottom - height);
  fillRoundRect(ctx, x, y, 8, height, 4, theme.colors.accent);
  drawMeasuredText(ctx, text, x + 38, y + 31, width - 72, {
    ...textOptions,
    maxBottom: y + height - 31,
  });
  return y + height;
}

function drawContextHighlight(ctx, text, x, y, width, maxBottom, theme, role) {
  if (!text) return y;
  var textOptions = { fontSize: 39, minFontSize: 28, maxLines: 6, lineHeight: 48, color: theme.colors.textPrimary, role: role || "context-highlight" };
  // Measure before positioning the card. Passing the final bottom boundary
  // here can mark a block as overflowing even when it can be repositioned
  // safely inside the available area below.
  var textHeight = measureTextHeight(ctx, text, width - 96, { ...textOptions, y: y + 34, maxBottom: y + 10000 });
  var height = Math.max(190, textHeight + 68);
  if (y + height > maxBottom) y = Math.max(0, maxBottom - height);
  fillRoundRect(ctx, x, y, width, height, 24, theme.colors.surfaceSoft);
  fillRoundRect(ctx, x, y, 12, height, 6, theme.colors.accent);
  drawMeasuredText(ctx, text, x + 48, y + 34, width - 96, { ...textOptions, maxBottom: y + height - 34 });
  return y + height;
}

function drawCover(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  var imageHeight = Math.min(
    layout.safeZones.footer.y - 32,
    Math.max(layout.content.y + 72, Math.round(H * 0.62))
  );
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  if (content.imageOnly && content.image) {
    drawImageFrame(ctx, content.image, 0, 0, W, H, 0, content.focalPosition, theme);
    return;
  }
  drawImageFrame(ctx, content.image || (project.article && project.article.image), 0, 0, W, imageHeight, 0, content.focalPosition, theme);

  var gradient = ctx.createLinearGradient(0, imageHeight * 0.42, 0, imageHeight);
  gradient.addColorStop(0, theme.colors.transparent);
  gradient.addColorStop(1, theme.colors.overlay75);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, imageHeight);
  drawLogo(ctx, project, theme, layout, true);

  var panelX = layout.content.x;
  // La portada necesita que la imagen conserve protagonismo: la tarjeta baja
  // sin tocar el pie ni cambiar la composición de las diapositivas internas.
  var panelY = Math.max(layout.content.y, Math.round(H * 0.56));
  var panelW = layout.content.width;
  var panelH = Math.min(520, layout.safeZones.footer.y - panelY - 26);
  fillRoundRect(ctx, panelX, panelY, panelW, panelH, 34, theme.colors.surface);
  strokeRoundRect(ctx, panelX, panelY, panelW, panelH, 34, theme.colors.coverPanelStroke, 2);

  var labelY = panelY + 38;
  var titleY = drawEditorialHeader(ctx, slide, project, theme, layout, { y: labelY }) + 8;
  var title = content.title ||
    (project.editorialPlan && project.editorialPlan.cover && project.editorialPlan.cover.title) ||
    (project.article && project.article.title) || "";
  var subtitle = content.subtitle || content.text || "";
  var titleReserve = subtitle.length > 80 ? 190 : 116;
  var titleEnd = drawMeasuredText(ctx, title, panelX + 44, titleY, panelW - 88, {
    fontSize: 70, minFontSize: 44, maxLines: 3, lineHeight: 78, weight: "700", color: theme.colors.textPrimary,
    role: "title",
    maxBottom: panelY + panelH - titleReserve,
  });
  drawMeasuredText(ctx, subtitle, panelX + 44, titleEnd + 16, panelW - 88, {
    fontSize: 30, minFontSize: 21, maxLines: 4, lineHeight: 40, color: theme.colors.textSecondary,
    role: "subtitle",
    maxBottom: panelY + panelH - 78,
  });

  ctx.font = theme.fonts.footer;
  ctx.fillStyle = theme.colors.textMuted;
  ctx.textBaseline = "middle";
  ctx.__carouselLineHeight = 21;
  ctx.fillText("Deslizá para seguir", panelX + 44, panelY + panelH - 42);
  ctx.textBaseline = "top";
  drawSlideProgress(ctx, slide, project, theme, layout);
}

function drawText(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, project, theme, layout, false);
  var supportImage = content.supportImage;
  var headerEnd = drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132 });
  var hasSupportImage = false;
  var titleY = headerEnd + 8;
  if (supportImage) {
    var imageY = headerEnd + 22;
    var imageH = 330;
    hasSupportImage = drawSupportImage(ctx, supportImage, layout.content.x, imageY, layout.content.width, imageH, "contain", theme, content.focalPosition);
    if (hasSupportImage) titleY = imageY + imageH + 28;
  }
  var textWidth = layout.content.width;
  var titleEnd = drawMeasuredText(ctx, content.title, layout.content.x, titleY, textWidth, {
    fontSize: 58, minFontSize: 38, maxLines: INTERNAL_TITLE_MAX_LINES, lineHeight: 66, weight: "700", color: theme.colors.textPrimary,
    role: "title",
    maxBottom: layout.safeZones.footer.y - 150,
  });
  var cardMaxBottom = layout.safeZones.footer.y - 42;
  var cardHeight = getContextCardHeight(ctx, content.text, hasSupportImage ? layout.content.width - 72 : layout.content.width - 96, theme, hasSupportImage);
  var cardY = getBalancedContentY(titleEnd + 34, cardMaxBottom, cardHeight);
  if (hasSupportImage) {
    drawContextCard(ctx, content.text, layout.content.x, cardY, layout.content.width, cardMaxBottom, theme, "body");
  } else {
    drawContextHighlight(ctx, content.text, layout.content.x, cardY, layout.content.width, cardMaxBottom, theme);
  }
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

function drawKey(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, project, theme, layout, false);

  var headerEnd = drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132 });
  var cardY = headerEnd + 26;
  var cardBottom = layout.safeZones.footer.y - 42;
  var cardHeight = Math.min(360, Math.max(0, cardBottom - cardY));
  fillRoundRect(ctx, layout.content.x, cardY, 14, cardHeight, 7, theme.colors.accent);
  var supportImage = content.supportImage;
  var hasSupportImage = supportImage && drawSupportImage(
    ctx, supportImage, layout.content.x + layout.content.width - 460, cardY + 34,
    420, Math.min(300, Math.max(180, cardHeight - 68)), "contain", theme, content.focalPosition
  );
  var textWidth = hasSupportImage ? layout.content.width - 500 : layout.content.width - 96;

  var titleEnd = drawMeasuredText(ctx, content.title, layout.content.x + 48, cardY + 54, textWidth, {
    fontSize: 68, minFontSize: 42, maxLines: INTERNAL_TITLE_MAX_LINES, lineHeight: 76, weight: "700", color: theme.colors.accentDark,
    role: "title",
    maxBottom: cardBottom - 210,
  });
  var keyText = content.text || content.subtitle || "";
  var sentences = keyText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [keyText];
  var groups = [];
  for (var sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
    var sentence = sentences[sentenceIndex].trim();
    if (!sentence) continue;
    if (groups.length && groups[groups.length - 1].length < 70) groups[groups.length - 1] += " " + sentence;
    else groups.push(sentence);
  }
  if (!groups.length) groups = [keyText];
  var keyMaxBottom = cardBottom - 18;
  var keyBlockHeight = groups.reduce(function (height, group) {
    return height + getContextHighlightHeight(ctx, group, layout.content.width - 148, theme) + 16;
  }, 0);
  var pointY = getBalancedContentY(titleEnd + 34, keyMaxBottom, keyBlockHeight);
  for (var pointIndex = 0; pointIndex < groups.length; pointIndex++) {
    // La imagen acompaña al encabezado; los puntos clave ocupan todo el
    // ancho disponible para evitar que una frase larga se fuerce a una
    // columna estrecha y termine marcada como desbordada.
    pointY = drawContextHighlight(ctx, groups[pointIndex], layout.content.x + 26, pointY, layout.content.width - 52, cardBottom - 18, theme, "key-point");
    pointY += 16;
  }
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

function getStatText(value) {
  return (typeof value === "string" || typeof value === "number") ? String(value).trim() : "";
}

function normalizeStatItem(item) {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    return { value: getStatText(item.value), label: getStatText(item.label) };
  }
  return { value: getStatText(item), label: "" };
}

function resolveStatsContent(content) {
  var items = Array.isArray(content.items) ? content.items.map(normalizeStatItem) : [];
  var direct = normalizeStatItem(content.value !== undefined ? content.value : content.number);
  var primaryItem = direct.value ? direct : (items[0] || { value: "", label: "" });
  var primary = primaryItem.value || getStatText(content.title);
  var itemExplanation = items.map(function (item, index) {
    if (index === 0 && primaryItem === items[0]) return item.label;
    return [item.value, item.label].filter(Boolean).join(" — ");
  }).filter(Boolean).join(" ");
  var explanationParts = [
    getStatText(content.text),
    getStatText(content.subtitle),
    itemExplanation,
  ];
  if (!items.length && primaryItem.label) explanationParts.push(primaryItem.label);
  return {
    primary: primary,
    primaryLabel: primaryItem.label,
    explanation: (items.length > 1
      ? [getStatText(content.text), getStatText(content.subtitle)]
      : explanationParts
    ).filter(Boolean).join(" "),
    items: items
  };
}

function getContextCardHeight(ctx, text, textWidth, theme, compact) {
  if (!text) return 0;
  var options = {
    fontSize: compact ? 31 : 39,
    minFontSize: compact ? 23 : 28,
    maxLines: compact ? 5 : 6,
    lineHeight: compact ? 39 : 48,
    y: 0,
    maxBottom: Infinity,
  };
  var textHeight = measureTextHeight(ctx, text, textWidth, options);
  return Math.max(compact ? 142 : 190, textHeight + (compact ? 62 : 68));
}

function getContextHighlightHeight(ctx, text, textWidth, theme) {
  return getContextCardHeight(ctx, text, textWidth, theme, false);
}

function drawStats(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  var stats = resolveStatsContent(content);
  var primary = stats.primary;
  var explanation = stats.explanation;
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, project, theme, layout, false);
  var supportImage = content.supportImage;
  var hasSupportImage = supportImage && drawSupportImage(
    ctx,
    supportImage,
    layout.content.x + layout.content.width - 460,
    layout.content.y + 132,
    420,
    300,
    "cover",
    theme,
    content.focalPosition
  );
  var factWidth = hasSupportImage ? layout.content.width - 480 : layout.content.width;
  var headingY = drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132, maxWidth: factWidth }) + 12;
  var factEnd = drawMeasuredText(ctx, primary, layout.content.x, headingY, factWidth, {
    fontSize: 138, minFontSize: 58, maxLines: 2, lineHeight: 132, weight: "700", color: theme.colors.accentDark,
    role: "stat", autoCondense: true,
    maxBottom: layout.safeZones.footer.y - 250,
  });
  var primaryLabelEnd = drawMeasuredText(ctx, stats.primaryLabel, layout.content.x, factEnd + 8, factWidth, {
    fontSize: 26, minFontSize: 20, maxLines: 2, lineHeight: 32, weight: "700", color: theme.colors.textPrimary,
    role: "stat-label", maxBottom: layout.safeZones.footer.y - 180
  });
  var titleEnd = drawMeasuredText(ctx, content.title && content.title !== primary ? content.title : "", layout.content.x, Math.max(factEnd + 12, primaryLabelEnd + 24), factWidth, {
    fontSize: 44, minFontSize: 30, maxLines: INTERNAL_TITLE_MAX_LINES, lineHeight: 52, weight: "700", color: theme.colors.textPrimary,
    role: "title",
    maxBottom: layout.safeZones.footer.y - 180,
  });
  var items = stats.items || [];
  var cardY = Math.max(titleEnd + 32, layout.content.y + 560);
  if (items.length > 1) {
    var cardWidth = layout.content.width;
    var secondaryItems = items.slice(1);
    if (items.length > 5) {
      drawMeasuredText(ctx, secondaryItems.map(function (item) {
        return [item.value, item.label].filter(Boolean).join(" — ");
      }).join(" "), layout.content.x, layout.safeZones.footer.y + 10, layout.content.width, {
        fontSize: 22, minFontSize: 18, maxLines: 1, lineHeight: 27, color: theme.colors.textPrimary,
        role: "body", maxBottom: layout.safeZones.footer.y - 10
      });
    }
    for (var itemIndex = 0; itemIndex < secondaryItems.length; itemIndex++) {
      var item = secondaryItems[itemIndex];
      var itemX = layout.content.x;
      var itemY = cardY + itemIndex * 154;
      fillRoundRect(ctx, itemX, itemY, cardWidth, 146, 22, theme.colors.surfaceSoft);
      fillRoundRect(ctx, itemX, itemY, 10, 146, 5, theme.colors.accent);
      var itemValueEnd = drawMeasuredText(ctx, item.value, itemX + 30, itemY + 20, cardWidth - 54, {
        fontSize: 42, minFontSize: 28, maxLines: 2, lineHeight: 42, weight: "700", color: theme.colors.accentDark,
        role: "stat-item", autoCondense: true, maxBottom: Math.min(itemY + 104, layout.safeZones.footer.y - 30)
      });
      drawMeasuredText(ctx, item.label, itemX + 30, Math.max(itemY + 76, itemValueEnd + 8), cardWidth - 54, {
        fontSize: 22, minFontSize: 18, maxLines: 3, lineHeight: 27, color: theme.colors.textPrimary,
        role: "body", maxBottom: Math.min(itemY + 138, layout.safeZones.footer.y - 30)
      });
    }
    if (explanation) {
      drawContextCard(ctx, explanation, layout.content.x, cardY + secondaryItems.length * 154, layout.content.width, layout.safeZones.footer.y - 42, theme, "body");
    }
  } else {
    drawContextCard(ctx, explanation, layout.content.x, cardY, layout.content.width, layout.safeZones.footer.y - 42, theme, "body");
  }
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

function drawQuote(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  var quote = content.quote || content.text || content.title || "";
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, project, theme, layout, false);
  drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132 });
  ctx.font = "700 170px Georgia, serif";
  ctx.fillStyle = theme.colors.accent;
  ctx.textBaseline = "top";
  ctx.__carouselLineHeight = 170;
  ctx.fillText("“", layout.content.x, layout.content.y + 196);
  var quoteEnd = drawMeasuredText(ctx, quote, layout.content.x + 28, layout.content.y + 344, layout.content.width - 28, {
    fontSize: 52, minFontSize: 30, maxLines: 8, lineHeight: 62, weight: "400", color: theme.colors.textPrimary,
    role: "quote", preserveLineBreaks: true,
    maxBottom: layout.safeZones.footer.y - (content.author || content.source ? 126 : 34),
  });
  var author = content.author || content.source || "";
  var role = content.role || "";
  var authorEnd = quoteEnd;
  if (author) {
  ctx.fillStyle = theme.colors.accentDark;
    fillRoundRect(ctx, layout.content.x + 28, quoteEnd + 38, 56, 8, 4, theme.colors.accent);
    authorEnd = drawMeasuredText(ctx, author, layout.content.x + 28, quoteEnd + 68, layout.content.width - 28, {
      fontSize: 30, minFontSize: 30, maxLines: 30, lineHeight: 38, weight: "700", color: theme.colors.textPrimary,
      role: "author",
      maxBottom: layout.safeZones.footer.y - (role ? 0 : 20),
    });
  }
  if (role) {
    drawMeasuredText(ctx, role, layout.content.x + 28, authorEnd + 16, layout.content.width - 28, {
      fontSize: 26, minFontSize: 22, maxLines: 2, lineHeight: 34, color: theme.colors.textSecondary,
      role: "attribution",
      maxBottom: layout.safeZones.footer.y - 10,
    });
  }
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

function drawImage(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, project, theme, layout, false);
  var headerEnd = drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132 });
  var imageY = headerEnd + 22;
  var captionHeight = measureTextHeight(ctx, content.text || content.subtitle || "", layout.content.width - 64, {
    fontSize: 30, minFontSize: 23, maxLines: 3, lineHeight: 38,
    y: imageY + 28,
    maxBottom: layout.safeZones.footer.y - 20,
  });
  var titleHeight = measureTextHeight(ctx, content.title || "", layout.content.width, {
    fontSize: 40, minFontSize: 28, maxLines: INTERNAL_TITLE_MAX_LINES, lineHeight: 48,
    y: imageY + 28,
    maxBottom: layout.safeZones.footer.y - 20,
  });
  var imageH = Math.max(360, layout.safeZones.footer.y - imageY - captionHeight - titleHeight - 120);
  drawImageFrame(ctx, content.image, layout.content.x, imageY, layout.content.width, imageH, 30, content.focalPosition, theme);
  var titleEnd = drawMeasuredText(ctx, content.title || "", layout.content.x, imageY + imageH + 28, layout.content.width, {
    fontSize: 40, minFontSize: 28, maxLines: INTERNAL_TITLE_MAX_LINES, lineHeight: 48, weight: "700", color: theme.colors.textPrimary,
    role: "title",
    maxBottom: layout.safeZones.footer.y - 54,
  });
  drawMeasuredText(ctx, content.text || content.subtitle || "", layout.content.x, titleEnd + 12, layout.content.width, {
    fontSize: 30, minFontSize: 23, maxLines: 3, lineHeight: 38, color: theme.colors.textSecondary,
    role: "caption",
    maxBottom: layout.safeZones.footer.y - 18,
  });
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

function drawEnd(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  ctx.fillStyle = theme.colors.endBackground;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, project, theme, layout, "end");
  var y = layout.content.y + 150;
  var source = (project.article && project.article.title) || content.source || content.title || "";
  drawEditorialHeader(ctx, { content: { label: "SEGUÍ LA NOTA" } }, project, theme, layout, { y: y, light: true });
  y += 88;
  y = drawMeasuredText(ctx, source, layout.content.x, y, layout.content.width, {
    fontSize: 54, minFontSize: 34, maxLines: 3, lineHeight: 62, weight: "700", color: theme.colors.white,
    role: "source",
    maxBottom: layout.safeZones.footer.y - 250,
  });
  var detail = content.text || content.subtitle || (project.article && project.article.summary) || "";
  if (detail) {
    y = drawMeasuredText(ctx, "EN ESTA NOTA", layout.content.x, y + 42, layout.content.width, {
      fontSize: 22, minFontSize: 18, maxLines: 1, lineHeight: 28, weight: "700", color: theme.colors.accent,
      role: "kicker", maxBottom: layout.safeZones.footer.y - 300
    });
    y = drawMeasuredText(ctx, detail, layout.content.x, y + 12, layout.content.width, {
      fontSize: 32, minFontSize: 24, maxLines: 3, lineHeight: 42, color: "rgba(255,255,255,0.82)",
      role: "body",
      maxBottom: layout.safeZones.footer.y - 280,
    });
  }
  var cta = content.cta || theme.variant.endUrlLabel;
  var ctaY = Math.min(layout.safeZones.footer.y - 154, Math.max(y + 54, layout.content.y + 620));
  fillRoundRect(ctx, layout.content.x, ctaY, layout.content.width, 96, 28, theme.colors.endCtaFill);
  drawMeasuredText(ctx, cta, layout.content.x + 30, ctaY + 28, layout.content.width - 60, {
    fontSize: 28, minFontSize: 22, maxLines: 2, lineHeight: 34, weight: "700", color: theme.colors.endCtaText,
    role: "cta",
    maxBottom: layout.safeZones.footer.y - 62,
  });
  ctx.font = "700 34px Inter, Arial, sans-serif";
  ctx.fillStyle = theme.colors.white;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("www.mediamendoza.com", layout.content.x + layout.content.width, layout.safeZones.footer.y - 48);
  ctx.textAlign = "start";
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

export function renderSlideToCanvas(slide, project) {
  try {
    var sourceSlide = slide || { template: "text", content: {}, style: {} };
    var safeSlide = normalizeCarouselSlide(
      sourceSlide,
      Number.isInteger(sourceSlide.order) ? sourceSlide.order : 0,
      Number.isInteger(sourceSlide.total) ? sourceSlide.total : 1
    );
    var safeProject = project || {};
    if (safeSlide.content.supportImage) {
      safeSlide.content.supportImage = resolveSupportImage(safeSlide.content.supportImage, safeProject.article);
      if (safeSlide.content.supportImage && safeProject.article && safeSlide.content.supportImage === safeProject.article.image) {
        safeSlide.content.supportImage = "";
      }
    }
    var theme = resolveCarouselTheme(safeProject, safeSlide);
    var layout = getCarouselLayout(safeSlide.template || "text", W, H);
    var canvas = createCanvas(W, H);
    var ctx = canvas.getContext("2d");
    var renderState = { overflow: false, blocks: [] };
    canvas.renderState = renderState;
    ctx.__carouselRenderState = renderState;

    switch (safeSlide.template) {
      case "cover": drawCover(ctx, safeSlide, safeProject, theme, layout); break;
      case "key": drawKey(ctx, safeSlide, safeProject, theme, layout); break;
      case "stats": drawStats(ctx, safeSlide, safeProject, theme, layout); break;
      case "quote": drawQuote(ctx, safeSlide, safeProject, theme, layout); break;
      case "image": drawImage(ctx, safeSlide, safeProject, theme, layout); break;
      case "end": drawEnd(ctx, safeSlide, safeProject, theme, layout); break;
      case "text":
      default: drawText(ctx, safeSlide, safeProject, theme, layout); break;
    }
    canvas.editorialOverflow = renderState.overflow;
    return canvas;
  } catch (error) {
    console.log("EXCEPTION in renderSlideToCanvas:", error);
    return null;
  }
}
