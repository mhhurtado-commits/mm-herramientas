import { createCanvas } from "./core/canvas.js";
import { calcZones, getHeaderZone, getFooterZone } from "./core/layout.js";
import { drawImageCover } from "./core/image.js";
import { wrapText } from "./core/text.js";
import { MMTheme } from "./core/theme.js";

var W = 1080;
var H = 1350;

function drawWhiteBackground(ctx) {
  ctx.fillStyle = MMTheme.colors.background;
  ctx.fillRect(0, 0, W, H);
}

function drawGreenBackground(ctx) {
  ctx.fillStyle = MMTheme.colors.corporateGreen;
  ctx.fillRect(0, 0, W, H);
}

function drawGradientOverlay(ctx, zone) {
  var grad = ctx.createLinearGradient(0, zone.y + zone.h * 0.46, 0, zone.y + zone.h);
  grad.addColorStop(0, MMTheme.colors.transparent);
  grad.addColorStop(1, MMTheme.colors.overlay75);
  ctx.fillStyle = grad;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
}

function loadCoverImage(ctx, slide, project, maxHeight) {
  var imgUrl = slide.content.image || (project.article && project.article.image);
  if (!imgUrl) return;

  var img = new Image();
  img.crossOrigin = "anonymous";

  function drawLoaded() {
    var zone = getHeaderZone();
    var headerH = Math.min(zone.h, maxHeight || zone.h);
    var clippedZone = { x: zone.x, y: zone.y, w: zone.w, h: headerH };
    drawImageCover(ctx, img, clippedZone.x, clippedZone.y, clippedZone.w, clippedZone.h);
    drawGradientOverlay(ctx, clippedZone);
  }

  if (img.complete && img.naturalWidth > 0) {
    img.crossOrigin = null;
    drawLoaded();
    return;
  }

  img.onload = drawLoaded;
  img.onerror = function () {};
  img.src = imgUrl;
}

function drawLogo(ctx, src, drawFn) {
  if (!src) return;
  var img = new Image();
  img.onload = function () {
    drawFn(ctx, img);
  };
  img.onerror = function () {};
  img.src = src;
}

function fillRoundRect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, w, h, r, stroke, lineWidth) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth || 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

function drawFrame(ctx, stroke) {
  var inset = MMTheme.spacing.frame;
  strokeRoundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, 42, stroke || MMTheme.colors.lineSoft, 2);
}

function drawAccentBar(ctx) {
  var inset = MMTheme.spacing.frame + 34;
  var w = W - inset * 2;
  var y = MMTheme.spacing.frame + 24;
  var h = MMTheme.spacing.accentBarH;
  var grad = ctx.createLinearGradient(inset, y, inset + w, y);
  grad.addColorStop(0, MMTheme.colors.accent);
  grad.addColorStop(1, "#d9eb97");
  fillRoundRect(ctx, inset, y, w, h, h / 2, grad);
}

function drawPanel(ctx, x, y, w, h, fill, stroke) {
  fillRoundRect(ctx, x, y, w, h, MMTheme.radius.panel, fill || MMTheme.colors.panel);
  strokeRoundRect(ctx, x, y, w, h, MMTheme.radius.panel, stroke || MMTheme.colors.lineSoft, 2);
}

function drawLogoLockup(ctx, x, y, w, centered) {
  drawLogo(ctx, "/assets/logo.png", function (ctx2, img) {
    var logoW = w || 176;
    var logoH = img.height * (logoW / img.width);
    var dx = centered ? x - logoW / 2 : x;
    var dy = y;
    ctx2.save();
    ctx2.shadowColor = "rgba(17,17,17,0.24)";
    ctx2.shadowBlur = 10;
    ctx2.shadowOffsetX = 0;
    ctx2.shadowOffsetY = 2;
    ctx2.drawImage(img, dx, dy, logoW, logoH);
    ctx2.restore();
  });
}

function drawLeftAccent(ctx, x, y, h) {
  fillRoundRect(ctx, x, y, 18, h, 12, MMTheme.colors.accent);
}

function drawGiantNumber(ctx, value, x, y, align, color) {
  ctx.font = MMTheme.fonts.giantNumber;
  ctx.fillStyle = color || "rgba(166,206,57,0.12)";
  ctx.textAlign = align || "left";
  ctx.textBaseline = "top";
  ctx.fillText(String(value).padStart(2, "0"), x, y);
  ctx.textAlign = "start";
}

function drawQuoteMark(ctx, x, y) {
  ctx.font = MMTheme.fonts.quote;
  ctx.fillStyle = "rgba(166,206,57,0.22)";
  ctx.textBaseline = "top";
  ctx.fillText("\"", x, y);
}

function measureWrappedLines(ctx, text, maxW) {
  if (!text) return 0;
  var words = text.split(" ");
  var line = "";
  var lines = 0;
  for (var i = 0; i < words.length; i++) {
    var test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxW && line.length > 0) {
      lines += 1;
      line = words[i] + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines += 1;
  return lines;
}

function fitEndTitleFont(ctx, text, maxW, maxLines) {
  var options = [
    { font: MMTheme.fonts.endTitle, lineH: 58 },
    { font: "700 44px Inter, Arial, sans-serif", lineH: 54 },
    { font: "700 40px Inter, Arial, sans-serif", lineH: 50 },
    { font: "700 36px Inter, Arial, sans-serif", lineH: 46 }
  ];

  for (var i = 0; i < options.length; i++) {
    ctx.font = options[i].font;
    if (measureWrappedLines(ctx, text, maxW) <= maxLines) {
      return options[i];
    }
  }

  return options[options.length - 1];
}

function getHighlightText(text, maxChars) {
  if (!text) return "";
  var cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  var sentence = cleaned.split(".")[0] || cleaned;
  if (sentence.length <= maxChars) return sentence;

  var clipped = sentence.slice(0, maxChars);
  var lastSpace = clipped.lastIndexOf(" ");
  if (lastSpace > 20) clipped = clipped.slice(0, lastSpace);
  return clipped + "...";
}

function drawCategoryBadge(ctx, label, x, y) {
  if (!label) return;
  ctx.font = MMTheme.fonts.category;
  var text = label.toUpperCase();
  var tw = ctx.measureText(text).width;
  var padX = 22;
  var padY = 13;
  var bw = tw + padX * 2;
  var bh = 24 + padY * 2;
  fillRoundRect(ctx, x, y, bw, bh, MMTheme.radius.badge, MMTheme.colors.accent);
  ctx.fillStyle = MMTheme.colors.white;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + bh / 2);
}

function drawSwipeHint(ctx, x, y) {
  var w = 170;
  var h = 46;
  fillRoundRect(ctx, x, y, w, h, 23, "rgba(255,255,255,0.92)");
  strokeRoundRect(ctx, x, y, w, h, 23, "rgba(17,17,17,0.10)", 2);
  ctx.font = MMTheme.fonts.kicker;
  ctx.fillStyle = MMTheme.colors.textPrimary;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Desliza", x + w / 2, y + h / 2);
  ctx.textAlign = "start";
  ctx.textBaseline = "top";
}

function drawBrandFooter(ctx, panelX, panelY, panelW, panelH) {
  var centerX = panelX + panelW / 2;
  var y = panelY + panelH - 88;
  var logoW = 182;
  var logoY = y + 8;

  ctx.strokeStyle = MMTheme.colors.brandLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(panelX + 54, y + 36);
  ctx.lineTo(centerX - logoW / 2 - 22, y + 36);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + logoW / 2 + 22, y + 36);
  ctx.lineTo(panelX + panelW - 54, y + 36);
  ctx.stroke();

  drawLogoLockup(ctx, centerX, logoY, logoW, true);
}

function drawCoverFooter(ctx, panelX, panelY, panelW, panelH) {
  var lineY = panelY + panelH - 52;
  ctx.strokeStyle = MMTheme.colors.brandLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(panelX + 54, lineY);
  ctx.lineTo(panelX + panelW - 250, lineY);
  ctx.stroke();
  drawSwipeHint(ctx, panelX + panelW - 210, panelY + panelH - 110);
}

function drawCoverLogo(ctx) {
  var badgeW = 336;
  var badgeH = 108;
  var badgeX = (W - badgeW) / 2;
  var badgeY = 96;
  fillRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 54, "rgba(255,255,255,0.94)");
  strokeRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 54, "rgba(166,206,57,0.24)", 2);
  drawLogoLockup(ctx, W / 2, badgeY + 20, 244, true);
}

function fitCoverTitleFont(ctx, text, maxW, maxLines) {
  var options = [
    { font: MMTheme.fonts.coverTitle, lineH: 84 },
    { font: "700 78px Inter, Arial, sans-serif", lineH: 80 },
    { font: "700 70px Inter, Arial, sans-serif", lineH: 72 },
    { font: "700 62px Inter, Arial, sans-serif", lineH: 66 },
    { font: "700 54px Inter, Arial, sans-serif", lineH: 58 }
  ];

  for (var i = 0; i < options.length; i++) {
    ctx.font = options[i].font;
    if (measureWrappedLines(ctx, text, maxW) <= maxLines) return options[i];
  }

  return options[options.length - 1];
}

function drawCoverTitle(ctx, text, x, y, maxW) {
  if (!text) return y;
  var fitted = fitCoverTitleFont(ctx, text, maxW, 2);
  ctx.font = fitted.font;
  ctx.fillStyle = MMTheme.colors.textPrimary;
  ctx.textBaseline = "top";
  return wrapText(ctx, text, x, y, maxW, fitted.lineH);
}

function drawCoverSubtitle(ctx, text, x, y, maxW) {
  if (!text) return y;
  ctx.font = MMTheme.fonts.coverSubtitle;
  ctx.fillStyle = MMTheme.colors.gray555;
  ctx.textBaseline = "top";
  return wrapText(ctx, text, x, y, maxW, MMTheme.spacing.coverLineHSubtitle);
}

function renderCover(ctx, slide, project) {
  calcZones("cover");
  drawWhiteBackground(ctx);
  loadCoverImage(ctx, slide, project, 760);
  drawFrame(ctx);

  var cat = project.article && project.article.category;
  drawCategoryBadge(ctx, cat || "Media Mendoza", 52, 52);
  drawCoverLogo(ctx);

  var panelY = 760;
  var panelH = H - panelY - 28;
  var panelX = 28;
  var panelW = W - 56;
  drawPanel(ctx, panelX, panelY, panelW, panelH, MMTheme.colors.surface, "rgba(222,216,205,0.86)");

  var pad = MMTheme.spacing.paddingCover;
  var bodyX = pad;
  var maxW = W - pad * 2;
  var titleText = (project.article && project.article.title) || slide.content.title || "";
  var titleY = 824;
  var titleEnd = drawCoverTitle(ctx, titleText, bodyX, titleY, maxW);

  var subText = slide.content.subtitle || slide.content.text || "";
  var subY = titleEnd + 16;
  drawCoverSubtitle(ctx, subText, bodyX, subY, maxW - 70);

  drawCoverFooter(ctx, panelX, panelY, panelW, panelH);
}

function renderTextSlide(ctx, slide, project) {
  calcZones("text");
  drawWhiteBackground(ctx);
  drawFrame(ctx);
  drawAccentBar(ctx);

  var panelX = 62;
  var panelY = 124;
  var panelW = W - 124;
  var panelH = H - 220;
  drawPanel(ctx, panelX, panelY, panelW, panelH);
  drawLeftAccent(ctx, panelX + 20, panelY + 24, 284);
  drawGiantNumber(ctx, (slide.order || 0) + 1, panelX + panelW - 70, panelY + 20, "right");

  var gridX = panelX + 70;
  var maxW = panelW - 150;
  var cat = project.article && project.article.category;

  if (cat) {
    ctx.font = MMTheme.fonts.category;
    ctx.fillStyle = MMTheme.colors.accentDark;
    ctx.textBaseline = "top";
    ctx.fillText(cat.toUpperCase(), gridX, panelY + 42);
  }

  var title = slide.content.title || "";
  var titleY = panelY + 96;
  if (title) {
    ctx.font = MMTheme.fonts.titleCompact;
    ctx.fillStyle = MMTheme.colors.textPrimary;
    ctx.textBaseline = "top";
    titleY = wrapText(ctx, title, gridX, titleY, maxW, MMTheme.spacing.lineHTitle);
  }

  var text = slide.content.text || "";
  var textY = titleY + 36;
  if (text) {
    drawQuoteMark(ctx, gridX - 8, textY - 34);
    ctx.font = MMTheme.fonts.bodyXL;
    ctx.fillStyle = MMTheme.colors.textSecondary;
    ctx.textBaseline = "top";
    wrapText(ctx, text, gridX, textY + 38, maxW - 10, 56);
  }

  drawBrandFooter(ctx, panelX, panelY, panelW, panelH);

  drawPageNumber(ctx, slide, project);
}

function renderStatsSlide(ctx, slide, project) {
  calcZones("stats");
  drawWhiteBackground(ctx);
  drawFrame(ctx);
  drawAccentBar(ctx);

  var panelX = 62;
  var panelY = 124;
  var panelW = W - 124;
  var panelH = H - 220;
  drawPanel(ctx, panelX, panelY, panelW, panelH);
  drawGiantNumber(ctx, (slide.order || 0) + 1, panelX + panelW - 70, panelY + 20, "right");

  var gridX = panelX + 54;
  var maxW = panelW - 108;
  var cardW = maxW;
  var cardH = 154;
  var gap = MMTheme.spacing.cardGap;

  var title = slide.content.title || "";
  var titleEnd = panelY + 36;
  if (title) {
    ctx.font = MMTheme.fonts.titleCompact;
    ctx.fillStyle = MMTheme.colors.textPrimary;
    ctx.textBaseline = "top";
    titleEnd = wrapText(ctx, title, gridX, panelY + 40, maxW, MMTheme.spacing.lineHTitle);
  }

  var items = slide.content.items || [];
  var startY = titleEnd + 34;
  for (var i = 0; i < items.length; i++) {
    var cy = startY + i * (cardH + gap);
    if (cy + cardH > panelY + panelH - 30) break;

    drawPanel(ctx, gridX, cy, cardW, cardH, MMTheme.colors.surface, MMTheme.colors.lineSoft);
    fillRoundRect(ctx, gridX + 24, cy + 24, 78, 44, 22, MMTheme.colors.accentSoft);
    fillRoundRect(ctx, gridX + 24, cy + 82, 10, cardH - 106, 6, MMTheme.colors.accent);

    ctx.font = MMTheme.fonts.statNumber;
    ctx.fillStyle = MMTheme.colors.accentDark;
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1).padStart(2, "0"), gridX + 47, cy + 46);

    ctx.font = MMTheme.fonts.list;
    ctx.fillStyle = MMTheme.colors.textSecondary;
    ctx.textBaseline = "top";
    wrapText(ctx, items[i], gridX + 126, cy + 28, cardW - 156, 44);
  }

  drawBrandFooter(ctx, panelX, panelY, panelW, panelH);
  drawPageNumber(ctx, slide, project);
}

function renderEndSlide(ctx, slide, project) {
  calcZones("end");
  ctx.fillStyle = "#eef5d6";
  ctx.fillRect(0, 0, W, H);
  drawFrame(ctx, "rgba(166,206,57,0.36)");

  var panelW = W - 180;
  var panelH = 760;
  var panelX = (W - panelW) / 2;
  var panelY = (H - panelH) / 2;
  var titleX = panelX + 94;
  var titleW = panelW - 188;
  drawPanel(ctx, panelX, panelY, panelW, panelH, MMTheme.colors.surface, "rgba(166,206,57,0.28)");

  fillRoundRect(ctx, panelX, panelY, panelW, 22, 22, MMTheme.colors.accent);
  drawLogoLockup(ctx, W / 2, panelY + 54, 248, true);

  ctx.font = MMTheme.fonts.endKicker;
  ctx.fillStyle = MMTheme.colors.accentDark;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(slide.content.kicker || "SEGUIR INFORMADO", W / 2, panelY + 160);

  var endTitle = slide.content.title || "Mas informacion en mediamendoza.com";
  var fitted = fitEndTitleFont(ctx, endTitle, titleW, 3);
  ctx.font = fitted.font;
  ctx.fillStyle = MMTheme.colors.textPrimary;
  ctx.textAlign = "start";
  wrapText(ctx, endTitle, titleX, panelY + 228, titleW, fitted.lineH);

  ctx.font = MMTheme.fonts.subtitle;
  ctx.fillStyle = MMTheme.colors.textSecondary;
  ctx.textAlign = "start";
  wrapText(
    ctx,
    slide.content.text || "Desliza para repasar los datos clave y entrar a la nota completa.",
    titleX,
    panelY + 410,
    titleW,
    44
  );

  var ctaW = titleW - 40;
  var ctaX = panelX + (panelW - ctaW) / 2;
  var ctaY = panelY + panelH - 162;
  fillRoundRect(ctx, ctaX, ctaY, ctaW, 108, 30, MMTheme.colors.surfaceInk);
  strokeRoundRect(ctx, ctaX, ctaY, ctaW, 108, 30, "rgba(0,0,0,0.08)", 2);
  ctx.font = MMTheme.fonts.endUrl;
  ctx.fillStyle = MMTheme.colors.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("mediamendoza.com", ctaX + ctaW / 2, ctaY + 54);

  ctx.textAlign = "start";
  ctx.textBaseline = "top";
  drawPageNumber(ctx, slide, project);
}

function drawPageNumber(ctx, slide, project) {
  var footer = getFooterZone();
  if (footer.h === 0) return;
  var total = project.slides ? project.slides.length : 1;
  var num = (slide.order || 0) + 1;
  ctx.font = MMTheme.fonts.footer;
  ctx.fillStyle = MMTheme.colors.footer;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText(num + " / " + total, W - MMTheme.spacing.paddingX, footer.y + footer.h / 2);
  ctx.textAlign = "start";
}

export function renderSlideToCanvas(slide, project) {
  try {
    var canvas = createCanvas(W, H);
    var ctx = canvas.getContext("2d");

    switch (slide.template) {
      case "cover": renderCover(ctx, slide, project); break;
      case "text": renderTextSlide(ctx, slide, project); break;
      case "stats": renderStatsSlide(ctx, slide, project); break;
      case "end": renderEndSlide(ctx, slide, project); break;
      default: renderTextSlide(ctx, slide, project);
    }

    return canvas;
  } catch (e) {
    console.log("EXCEPTION in renderSlideToCanvas:", e);
    return null;
  }
}
