import { createCanvas } from "./core/canvas.js";
import { getCarouselLayout } from "./core/layout.js";
import { drawImageContain, drawImageCover } from "./core/image.js";
import { fitText } from "./core/text.js";
import { resolveCarouselTheme } from "./core/theme.js";

var W = 1080;
var H = 1350;
var IMAGE_PROXY = "https://mm-herramientas-worker.mhhurtado.workers.dev?image=";
var imageCache = {};

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

function getCachedImage(src, onReady) {
  var normalizedSrc = normalizeImageSource(src);
  if (!normalizedSrc || typeof Image === "undefined") return null;

  var cached = imageCache[normalizedSrc];
  if (cached && cached.loaded) return cached.img;
  if (cached) {
    if (onReady) cached.listeners.push(onReady);
    return null;
  }

  var img = new Image();
  imageCache[normalizedSrc] = { img: img, loaded: false, listeners: onReady ? [onReady] : [] };
  img.crossOrigin = "anonymous";
  img.onload = function () {
    var entry = imageCache[normalizedSrc];
    if (!entry) return;
    entry.loaded = true;
    entry.listeners.forEach(function (listener) { listener(img); });
    entry.listeners = [];
    if (typeof window !== "undefined" && window.dispatchEvent && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("carousel:asset-ready", { detail: { src: normalizedSrc } }));
    }
  };
  img.onerror = function () {
    var entry = imageCache[normalizedSrc];
    if (entry) entry.listeners = [];
  };
  img.src = normalizedSrc;
  return null;
}

function drawImageFrame(ctx, src, x, y, w, h, radius) {
  var image = getCachedImage(src);
  if (!image) return false;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  drawImageCover(ctx, image, x, y, w, h);
  ctx.restore();
  strokeRoundRect(ctx, x, y, w, h, radius, "rgba(255,255,255,0.7)", 2);
  return true;
}

function drawSupportImage(ctx, src, x, y, w, h, mode, theme) {
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
    drawImageCover(ctx, image, x, y, w, h);
  }
  ctx.restore();
  strokeRoundRect(ctx, x, y, w, h, 24, theme.colors.brandLine, 2);
  return true;
}

function drawLogo(ctx, theme, layout, overImage) {
  var logo = getCachedImage("/assets/logo.png");
  if (!logo) return;
  var zone = layout.safeZones.logo;
  var width = 190;
  var height = logo.height * (width / logo.width);
  var x = zone.x;
  var y = zone.y;

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

  ctx.font = theme.fonts.category;
  var text = String(label).toUpperCase();
  var width = ctx.measureText(text).width + 42;
  fillRoundRect(ctx, x, y, width, 46, 23, theme.colors.accent);
  ctx.fillStyle = theme.colors.textPrimary;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 21, y + 23);
  ctx.textBaseline = "top";
  return y + 72;
}

function getMeasuredText(ctx, text, maxWidth, options, y) {
  var settings = options || {};
  var initialFontSize = settings.fontSize || 40;
  var lineHeight = settings.lineHeight || 48;
  var maxLines = settings.maxLines || 6;
  if (Number.isFinite(settings.maxBottom)) {
    maxLines = Math.max(1, Math.min(maxLines, Math.floor((settings.maxBottom - y) / lineHeight)));
  }

  var value = String(text || "");
  var result = fitText(ctx, value, {
    fontSize: initialFontSize,
    minFontSize: settings.minFontSize || 24,
    maxWidth: maxWidth,
    maxLines: maxLines,
    lineHeight: lineHeight,
    fontFamily: "Inter, Arial, sans-serif"
  });

  if (result.truncated) {
    value = result.lines.slice(0, maxLines).join(" ").trim();
    result = fitText(ctx, value, {
      fontSize: initialFontSize,
      minFontSize: settings.minFontSize || 24,
      maxWidth: maxWidth,
      maxLines: maxLines,
      lineHeight: lineHeight,
      fontFamily: "Inter, Arial, sans-serif"
    });
  }

  var measuredLineHeight = Math.round(lineHeight * (result.fontSize / initialFontSize));
  return {
    value: value,
    lines: result.lines,
    fontSize: result.fontSize,
    lineHeight: measuredLineHeight,
    height: result.lines.length * measuredLineHeight
  };
}

function drawMeasuredText(ctx, text, x, y, maxWidth, options) {
  if (!text) return y;
  var settings = options || {};
  var lineHeight = settings.lineHeight || 48;
  var safeY = Number.isFinite(settings.maxBottom) && y >= settings.maxBottom
    ? Math.max(0, settings.maxBottom - lineHeight)
    : y;
  var measured = getMeasuredText(ctx, text, maxWidth, settings, safeY);
  ctx.font = (settings.weight || "400") + " " + measured.fontSize + "px Inter, Arial, sans-serif";
  ctx.fillStyle = settings.color || "#111111";
  ctx.textBaseline = "top";
  for (var i = 0; i < measured.lines.length; i++) {
    ctx.fillText(measured.lines[i], x, safeY + i * measured.lineHeight);
  }
  return safeY + measured.height;
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

function drawContextCard(ctx, text, x, y, width, maxBottom, theme) {
  if (!text) return y;
  var textOptions = { fontSize: 31, minFontSize: 23, maxLines: 5, lineHeight: 39, color: theme.colors.textSecondary };
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
  drawImageFrame(ctx, content.image || (project.article && project.article.image), 0, 0, W, imageHeight, 0);

  var gradient = ctx.createLinearGradient(0, imageHeight * 0.42, 0, imageHeight);
  gradient.addColorStop(0, theme.colors.transparent);
  gradient.addColorStop(1, theme.colors.overlay75);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, imageHeight);
  drawLogo(ctx, theme, layout, true);

  var panelX = layout.content.x;
  var panelY = layout.content.y;
  var panelW = layout.content.width;
  var panelH = layout.safeZones.footer.y - panelY - 26;
  fillRoundRect(ctx, panelX, panelY, panelW, panelH, 34, theme.colors.surface);
  strokeRoundRect(ctx, panelX, panelY, panelW, panelH, 34, theme.colors.coverPanelStroke, 2);

  var labelY = panelY + 38;
  var titleY = drawEditorialHeader(ctx, slide, project, theme, layout, { y: labelY }) + 8;
  var title = (project.article && project.article.title) || content.title || "";
  var titleEnd = drawMeasuredText(ctx, title, panelX + 44, titleY, panelW - 88, {
    fontSize: 70, minFontSize: 44, maxLines: 3, lineHeight: 78, weight: "700", color: theme.colors.textPrimary,
    maxBottom: panelY + panelH - 116,
  });
  drawMeasuredText(ctx, content.subtitle || content.text || "", panelX + 44, titleEnd + 16, panelW - 88, {
    fontSize: 30, minFontSize: 23, maxLines: 3, lineHeight: 40, color: theme.colors.textSecondary,
    maxBottom: panelY + panelH - 78,
  });

  ctx.font = theme.fonts.footer;
  ctx.fillStyle = theme.colors.textMuted;
  ctx.textBaseline = "middle";
  ctx.fillText("Deslizá para seguir", panelX + 44, panelY + panelH - 42);
  ctx.textBaseline = "top";
  drawSlideProgress(ctx, slide, project, theme, layout);
}

function drawText(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, theme, layout, false);
  var supportImage = content.supportImage;
  var hasSupportImage = supportImage && drawSupportImage(
    ctx,
    supportImage,
    layout.content.x + layout.content.width - 250,
    layout.content.y + 132,
    220,
    180,
    "contain",
    theme
  );
  var textWidth = hasSupportImage ? layout.content.width - 276 : layout.content.width;
  var titleY = drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132 }) + 8;
  var titleEnd = drawMeasuredText(ctx, content.title, layout.content.x, titleY, textWidth, {
    fontSize: 58, minFontSize: 38, maxLines: 3, lineHeight: 66, weight: "700", color: theme.colors.textPrimary,
    maxBottom: layout.safeZones.footer.y - 150,
  });
  var cardY = Math.max(titleEnd + 34, layout.content.y + 410);
  drawContextCard(ctx, content.text, layout.content.x, cardY, layout.content.width, layout.safeZones.footer.y - 42, theme);
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

function drawStats(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  var items = Array.isArray(content.items) ? content.items : [];
  var primary = content.value || content.number || items[0] || content.title || "";
  var explanation = content.text || content.subtitle || items.slice(1).join(" ");
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, theme, layout, false);
  var supportImage = content.supportImage;
  var hasSupportImage = supportImage && drawSupportImage(
    ctx,
    supportImage,
    layout.content.x + layout.content.width - 250,
    layout.content.y + 132,
    220,
    190,
    "cover",
    theme
  );
  var factWidth = hasSupportImage ? layout.content.width - 276 : layout.content.width;
  var headingY = drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132 }) + 12;
  var factEnd = drawMeasuredText(ctx, primary, layout.content.x, headingY, factWidth, {
    fontSize: 138, minFontSize: 58, maxLines: 2, lineHeight: 132, weight: "700", color: theme.colors.accentDark,
    maxBottom: layout.safeZones.footer.y - 250,
  });
  var titleEnd = drawMeasuredText(ctx, content.title && content.title !== primary ? content.title : "", layout.content.x, factEnd + 12, factWidth, {
    fontSize: 44, minFontSize: 30, maxLines: 3, lineHeight: 52, weight: "700", color: theme.colors.textPrimary,
    maxBottom: layout.safeZones.footer.y - 180,
  });
  drawContextCard(ctx, explanation, layout.content.x, Math.max(titleEnd + 32, layout.content.y + 560), layout.content.width, layout.safeZones.footer.y - 42, theme);
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

function drawQuote(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  var quote = content.quote || content.text || content.title || "";
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, theme, layout, false);
  drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132 });
  ctx.font = "700 170px Georgia, serif";
  ctx.fillStyle = theme.colors.accent;
  ctx.textBaseline = "top";
  ctx.fillText("“", layout.content.x, layout.content.y + 196);
  var quoteEnd = drawMeasuredText(ctx, quote, layout.content.x + 28, layout.content.y + 344, layout.content.width - 28, {
    fontSize: 52, minFontSize: 30, maxLines: 8, lineHeight: 62, weight: "400", color: theme.colors.textPrimary,
    maxBottom: layout.safeZones.footer.y - (content.author || content.source ? 126 : 34),
  });
  var author = content.author || content.source || "";
  var role = content.role || "";
  var authorEnd = quoteEnd;
  if (author) {
    ctx.fillStyle = theme.colors.accentDark;
    fillRoundRect(ctx, layout.content.x + 28, quoteEnd + 38, 56, 8, 4, theme.colors.accent);
    authorEnd = drawMeasuredText(ctx, author, layout.content.x + 28, quoteEnd + 68, layout.content.width - 28, {
      fontSize: 30, minFontSize: 24, maxLines: 2, lineHeight: 38, weight: "700", color: theme.colors.textPrimary,
      maxBottom: layout.safeZones.footer.y - (role ? 54 : 20),
    });
  }
  if (role) {
    drawMeasuredText(ctx, role, layout.content.x + 28, authorEnd + 16, layout.content.width - 28, {
      fontSize: 26, minFontSize: 22, maxLines: 2, lineHeight: 34, color: theme.colors.textSecondary,
      maxBottom: layout.safeZones.footer.y - 10,
    });
  }
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

function drawImage(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  ctx.fillStyle = theme.colors.background;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, theme, layout, false);
  var headerEnd = drawEditorialHeader(ctx, slide, project, theme, layout, { y: layout.content.y + 132 });
  var imageY = headerEnd + 22;
  var captionHeight = measureTextHeight(ctx, content.text || content.subtitle || "", layout.content.width - 64, {
    fontSize: 30, minFontSize: 23, maxLines: 3, lineHeight: 38,
    y: imageY + 28,
    maxBottom: layout.safeZones.footer.y - 20,
  });
  var titleHeight = measureTextHeight(ctx, content.title || "", layout.content.width, {
    fontSize: 40, minFontSize: 28, maxLines: 2, lineHeight: 48,
    y: imageY + 28,
    maxBottom: layout.safeZones.footer.y - 20,
  });
  var imageH = Math.max(360, layout.safeZones.footer.y - imageY - captionHeight - titleHeight - 120);
  drawImageFrame(ctx, content.image, layout.content.x, imageY, layout.content.width, imageH, 30);
  var titleEnd = drawMeasuredText(ctx, content.title || "", layout.content.x, imageY + imageH + 28, layout.content.width, {
    fontSize: 40, minFontSize: 28, maxLines: 2, lineHeight: 48, weight: "700", color: theme.colors.textPrimary,
    maxBottom: layout.safeZones.footer.y - 54,
  });
  drawMeasuredText(ctx, content.text || content.subtitle || "", layout.content.x, titleEnd + 12, layout.content.width, {
    fontSize: 30, minFontSize: 23, maxLines: 3, lineHeight: 38, color: theme.colors.textSecondary,
    maxBottom: layout.safeZones.footer.y - 18,
  });
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

function drawEnd(ctx, slide, project, theme, layout) {
  var content = slide.content || {};
  ctx.fillStyle = theme.colors.endBackground;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, theme, layout, false);
  var y = layout.content.y + 150;
  var source = content.source || content.title || "";
  drawEditorialHeader(ctx, { content: { label: "FUENTE" } }, project, theme, layout, { y: y });
  y += 88;
  y = drawMeasuredText(ctx, source, layout.content.x, y, layout.content.width, {
    fontSize: 54, minFontSize: 34, maxLines: 3, lineHeight: 62, weight: "700", color: theme.colors.textPrimary,
    maxBottom: layout.safeZones.footer.y - 250,
  });
  y = drawMeasuredText(ctx, content.text || content.subtitle || "", layout.content.x, y + 26, layout.content.width, {
    fontSize: 32, minFontSize: 24, maxLines: 4, lineHeight: 42, color: theme.colors.textSecondary,
    maxBottom: layout.safeZones.footer.y - 170,
  });
  var cta = content.cta || theme.variant.endUrlLabel;
  var ctaY = Math.min(layout.safeZones.footer.y - 154, Math.max(y + 64, layout.content.y + 620));
  fillRoundRect(ctx, layout.content.x, ctaY, layout.content.width, 96, 28, theme.colors.endCtaFill);
  drawMeasuredText(ctx, cta, layout.content.x + 30, ctaY + 28, layout.content.width - 60, {
    fontSize: 28, minFontSize: 22, maxLines: 2, lineHeight: 34, weight: "700", color: theme.colors.endCtaText,
    maxBottom: layout.safeZones.footer.y - 62,
  });
  drawEditorialFooter(ctx, slide, project, theme, layout);
}

export function renderSlideToCanvas(slide, project) {
  try {
    var safeSlide = slide || { template: "text", content: {}, style: {} };
    var safeProject = project || {};
    var theme = resolveCarouselTheme(safeProject, safeSlide);
    var layout = getCarouselLayout(safeSlide.template || "text", W, H);
    var canvas = createCanvas(W, H);
    var ctx = canvas.getContext("2d");

    switch (safeSlide.template) {
      case "cover": drawCover(ctx, safeSlide, safeProject, theme, layout); break;
      case "stats": drawStats(ctx, safeSlide, safeProject, theme, layout); break;
      case "quote": drawQuote(ctx, safeSlide, safeProject, theme, layout); break;
      case "image": drawImage(ctx, safeSlide, safeProject, theme, layout); break;
      case "end": drawEnd(ctx, safeSlide, safeProject, theme, layout); break;
      case "text":
      default: drawText(ctx, safeSlide, safeProject, theme, layout); break;
    }
    return canvas;
  } catch (error) {
    console.log("EXCEPTION in renderSlideToCanvas:", error);
    return null;
  }
}
