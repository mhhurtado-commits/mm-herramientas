import { createCanvas } from "./core/canvas.js";
import { getCarouselLayout } from "./core/layout.js";
import { drawImageContain, drawImageCover } from "./core/image.js";
import { resolveCarouselTheme } from "./core/theme.js";
import { normalizeCarouselSlide } from "./slide-model.js";

var W = 1080;
var H = 1350;
var IMAGE_PROXY = "https://mm-herramientas-worker.mhhurtado.workers.dev?image=";
var imageCache = {};
var INTERNAL_TITLE_MAX_LINES = 2;

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
    delete imageCache[normalizedSrc];
    resolveLoad(null);
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
    if (content.supportImage) sources.push(content.supportImage);
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
  })).then(function (images) {
    for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
      if (!images[imageIndex]) throw new Error("No se pudo cargar un recurso del carrusel.");
    }
    return images;
  });
}

function drawImageFrame(ctx, src, x, y, w, h, radius, focalPosition) {
  var image = getCachedImage(src);
  if (!image) return false;
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
  if (!image) return false;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.clip();
  ctx.fillStyle = theme.colors.surface;
  ctx.fillRect(x, y, w, h);
  if (mode === "contain") {
    drawImageContain(ctx, image, x, y, w, h);
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
  var zone = layout.safeZones.logo;
  var width = 190;
  var height = logo.height * (width / logo.width);
  var x = zone.x;
  var y = zone.y;

  if (overImage) {
    var position = project && project.settings && project.settings.coverLogoPosition || "center";
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

  if (overImage) {
    fillRoundRect(ctx, x - 18, y - 14, width + 36, height + 28, 24, theme.colors.logoBadge);
  }
  ctx.drawImage(logo, x, y, width, height);
}

function drawEditorialHeader(ctx, slide, project, theme, layout, options) {
  var content = slide.content || {};
  var label = content.eyebrow || content.kicker || content.label ||
    (project.article && project.article.category) || "";
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
  var width = Math.min(maxWidth, measuredWidth + 42);
  var height = Math.max(46, measured.height + 18);
  fillRoundRect(ctx, x, y, width, height, Math.min(23, height / 2), theme.colors.accent);
  recordMeasuredBlock(ctx, measured, textOptions.role);
  ctx.fillStyle = theme.colors.textPrimary;
  ctx.textBaseline = "top";
  ctx.__carouselLineHeight = measured.lineHeight;
  for (var lineIndex = 0; lineIndex < measured.lines.length; lineIndex++) {
    ctx.fillText(measured.lines[lineIndex], x + 21, y + 9 + lineIndex * measured.lineHeight);
  }
  ctx.font = originalFont;
  ctx.textBaseline = "top";
  return y + height + 26;
}

function getTextFont(settings, fontSize) {
  var style = settings.style ? settings.style + " " : "";
  return style + (settings.weight || "400") + " " + fontSize + "px " + (settings.fontFamily || "Inter, Arial, sans-serif");
}

function fitMeasuredText(ctx, text, maxWidth, settings, maxLines) {
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
    if (lines.length <= maxLines || fontSize === minFontSize) break;
    fontSize = Math.max(minFontSize, fontSize - 1);
  } while (true);

  ctx.font = originalFont;
  return {
    lines: lines,
    fontSize: fontSize,
    truncated: lines.length > maxLines,
  };
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
  if (Number.isFinite(settings.maxBottom)) {
    maxLines = Math.max(0, Math.min(maxLines, Math.floor((settings.maxBottom - y) / lineHeight)));
  }

  var value = String(text || "");
  var fitMaxLines = maxLines === 0 ? 1 : maxLines;
  var result = fitMeasuredText(ctx, value, maxWidth, settings, fitMaxLines);

  var measuredLineHeight = Math.round(lineHeight * (result.fontSize / initialFontSize));
  var overflow = maxLines === 0 || result.truncated || result.lines.length > maxLines;
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
  ctx.font = theme.fonts.footer;
  ctx.fillStyle = theme.colors.footer;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.__carouselLineHeight = 21;
  ctx.fillText(current + " / " + total, footer.x + footer.width - layout.content.x, footer.y + footer.height / 2);
  ctx.textAlign = "start";
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
  fillRoundRect(ctx, x, y, width, height, 28, theme.colors.surfaceSoft);
  fillRoundRect(ctx, x, y, 12, height, 6, theme.colors.accent);
  drawMeasuredText(ctx, text, x + 38, y + 31, width - 72, {
    ...textOptions,
    maxBottom: y + height - 31,
  });
  return y + height;
}

function drawCover(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  var imageHeight = Math.max(layout.content.y + 72, 610);
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawImageFrame(ctx, content.image || (project.article && project.article.image), 0, 0, W, imageHeight, 0, content.focalPosition);

  var gradient = ctx.createLinearGradient(0, imageHeight * 0.42, 0, imageHeight);
  gradient.addColorStop(0, theme.colors.transparent);
  gradient.addColorStop(1, theme.colors.overlay75);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, imageHeight);
  drawLogo(ctx, project, theme, layout, true);

  var panelX = layout.content.x;
  var panelY = layout.content.y;
  var panelW = layout.content.width;
  var panelH = layout.safeZones.footer.y - panelY - 26;
  fillRoundRect(ctx, panelX, panelY, panelW, panelH, 34, theme.colors.surface);
  strokeRoundRect(ctx, panelX, panelY, panelW, panelH, 34, theme.colors.coverPanelStroke, 2);

  var labelY = panelY + 38;
  var titleY = drawEditorialHeader(ctx, slide, project, theme, layout, { y: labelY }) + 8;
  var title = content.title ||
    (project.editorialPlan && project.editorialPlan.cover && project.editorialPlan.cover.title) ||
    (project.article && project.article.title) || "";
  var titleEnd = drawMeasuredText(ctx, title, panelX + 44, titleY, panelW - 88, {
    fontSize: 70, minFontSize: 44, maxLines: 3, lineHeight: 78, weight: "700", color: theme.colors.textPrimary,
    role: "title",
    maxBottom: panelY + panelH - 116,
  });
  drawMeasuredText(ctx, content.subtitle || content.text || "", panelX + 44, titleEnd + 16, panelW - 88, {
    fontSize: 30, minFontSize: 23, maxLines: 3, lineHeight: 40, color: theme.colors.textSecondary,
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
  var hasSupportImage = supportImage && drawSupportImage(
    ctx,
    supportImage,
    layout.content.x + layout.content.width - 250,
    layout.content.y + 132,
    220,
    180,
    "contain",
    theme,
    content.focalPosition
  );
  var textWidth = hasSupportImage ? layout.content.width - 276 : layout.content.width;
  var titleY = drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132, maxWidth: textWidth }) + 8;
  var titleEnd = drawMeasuredText(ctx, content.title, layout.content.x, titleY, textWidth, {
    fontSize: 58, minFontSize: 38, maxLines: INTERNAL_TITLE_MAX_LINES, lineHeight: 66, weight: "700", color: theme.colors.textPrimary,
    role: "title",
    maxBottom: layout.safeZones.footer.y - 150,
  });
  var cardY = Math.max(titleEnd + 34, layout.content.y + 410);
  drawContextCard(ctx, content.text, layout.content.x, cardY, layout.content.width, layout.safeZones.footer.y - 42, theme, "body");
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
  var cardHeight = Math.max(0, cardBottom - cardY);
  fillRoundRect(ctx, layout.content.x, cardY, layout.content.width, cardHeight, 34, theme.colors.accentSoft);
  strokeRoundRect(ctx, layout.content.x, cardY, layout.content.width, cardHeight, 34, theme.colors.accent, 3);
  fillRoundRect(ctx, layout.content.x, cardY, 14, cardHeight, 7, theme.colors.accent);

  var titleEnd = drawMeasuredText(ctx, content.title, layout.content.x + 48, cardY + 54, layout.content.width - 96, {
    fontSize: 68, minFontSize: 42, maxLines: INTERNAL_TITLE_MAX_LINES, lineHeight: 76, weight: "700", color: theme.colors.accentDark,
    role: "title",
    maxBottom: cardBottom - 210,
  });
  drawMeasuredText(ctx, content.text || content.subtitle || "", layout.content.x + 48, titleEnd + 36, layout.content.width - 96, {
    fontSize: 42, minFontSize: 28, maxLines: 7, lineHeight: 52, weight: "700", color: theme.colors.textPrimary,
    role: "key-point",
    maxBottom: cardBottom - 48,
  });
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
  var direct = normalizeStatItem(content.value || content.number);
  var primaryItem = direct.value ? direct : (items[0] || { value: "", label: "" });
  var primary = primaryItem.value || getStatText(content.title);
  var itemExplanation = items.map(function (item, index) {
    if (index === 0 && primaryItem === items[0]) return item.label;
    return item.label || item.value;
  }).filter(Boolean).join(" ");
  return {
    primary: primary,
    explanation: getStatText(content.text) || getStatText(content.subtitle) || primaryItem.label || itemExplanation,
  };
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
    layout.content.x + layout.content.width - 250,
    layout.content.y + 132,
    220,
    190,
    "cover",
    theme,
    content.focalPosition
  );
  var factWidth = hasSupportImage ? layout.content.width - 276 : layout.content.width;
  var headingY = drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132, maxWidth: factWidth }) + 12;
  var factEnd = drawMeasuredText(ctx, primary, layout.content.x, headingY, factWidth, {
    fontSize: 138, minFontSize: 58, maxLines: 2, lineHeight: 132, weight: "700", color: theme.colors.accentDark,
    role: "stat",
    maxBottom: layout.safeZones.footer.y - 250,
  });
  var titleEnd = drawMeasuredText(ctx, content.title && content.title !== primary ? content.title : "", layout.content.x, factEnd + 12, factWidth, {
    fontSize: 44, minFontSize: 30, maxLines: INTERNAL_TITLE_MAX_LINES, lineHeight: 52, weight: "700", color: theme.colors.textPrimary,
    role: "title",
    maxBottom: layout.safeZones.footer.y - 180,
  });
  drawContextCard(ctx, explanation, layout.content.x, Math.max(titleEnd + 32, layout.content.y + 560), layout.content.width, layout.safeZones.footer.y - 42, theme, "body");
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
  drawImageFrame(ctx, content.image, layout.content.x, imageY, layout.content.width, imageH, 30, content.focalPosition);
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
  drawLogo(ctx, project, theme, layout, false);
  var y = layout.content.y + 150;
  var source = content.source || content.title || "";
  drawEditorialHeader(ctx, { content: { label: "FUENTE" } }, project, theme, layout, { y: y });
  y += 88;
  y = drawMeasuredText(ctx, source, layout.content.x, y, layout.content.width, {
    fontSize: 54, minFontSize: 34, maxLines: 3, lineHeight: 62, weight: "700", color: theme.colors.textPrimary,
    role: "source",
    maxBottom: layout.safeZones.footer.y - 250,
  });
  y = drawMeasuredText(ctx, content.text || content.subtitle || "", layout.content.x, y + 26, layout.content.width, {
    fontSize: 32, minFontSize: 24, maxLines: 4, lineHeight: 42, color: theme.colors.textSecondary,
    role: "body",
    maxBottom: layout.safeZones.footer.y - 170,
  });
  var cta = content.cta || theme.variant.endUrlLabel;
  var ctaY = Math.min(layout.safeZones.footer.y - 154, Math.max(y + 64, layout.content.y + 620));
  fillRoundRect(ctx, layout.content.x, ctaY, layout.content.width, 96, 28, theme.colors.endCtaFill);
  drawMeasuredText(ctx, cta, layout.content.x + 30, ctaY + 28, layout.content.width - 60, {
    fontSize: 28, minFontSize: 22, maxLines: 2, lineHeight: 34, weight: "700", color: theme.colors.endCtaText,
    role: "cta",
    maxBottom: layout.safeZones.footer.y - 62,
  });
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
