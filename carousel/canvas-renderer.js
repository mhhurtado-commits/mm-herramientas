import { createCanvas } from "./core/canvas.js";
import { calcZones, getHeaderZone, getBodyZone, getFooterZone } from "./core/layout.js";
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

function loadCoverImage(ctx, slide, project) {
  var imgUrl = slide.content.image || (project.article && project.article.image);
  if (!imgUrl) return;

  var img = new Image();
  img.crossOrigin = "anonymous";

  function drawLoaded() {
    var zone = getHeaderZone();
    drawImageCover(ctx, img, zone.x, zone.y, zone.w, zone.h);
    drawGradientOverlay(ctx, zone);
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

function drawLogoBadge(ctx, x, y, w, h, centered) {
  fillRoundRect(ctx, x, y, w, h, h / 2, "#1c1f22");
  strokeRoundRect(ctx, x, y, w, h, h / 2, "rgba(255,255,255,0.28)", 2);

  drawLogo(ctx, "/assets/logo.png", function (ctx2, img) {
    var logoW = centered ? 148 : 116;
    var logoH = img.height * (logoW / img.width);
    var dx = x + (w - logoW) / 2;
    var dy = y + (h - logoH) / 2;
    ctx2.drawImage(img, dx, dy, logoW, logoH);
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
  ctx.fillText("“", x, y);
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

function drawCoverTitle(ctx, text, x, y, maxW) {
  if (!text) return y;
  ctx.font = MMTheme.fonts.coverTitle;
  ctx.fillStyle = MMTheme.colors.textPrimary;
  ctx.textBaseline = "top";
  return wrapText(ctx, text, x, y, maxW, MMTheme.spacing.coverLineHTitle);
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
  loadCoverImage(ctx, slide, project);
  drawFrame(ctx);

  var cat = project.article && project.article.category;
  drawCategoryBadge(ctx, cat || "Media Mendoza", 52, 52);

  var body = getBodyZone();
  var panelX = 28;
  var panelY = body.y - 24;
  var panelH = H - panelY - 28;
  drawPanel(ctx, panelX, panelY, W - 56, panelH, MMTheme.colors.surface, "rgba(222,216,205,0.86)");

  var pad = MMTheme.spacing.paddingCover;
  var bodyX = pad;
  var maxW = W - pad * 2;
  var titleText = slide.content.title || "";
  var titleY = body.y + 42;
  var titleEnd = drawCoverTitle(ctx, titleText, bodyX, titleY, maxW);

  var subText = slide.content.subtitle || "";
  var subY = titleEnd + 18;
  drawCoverSubtitle(ctx, subText, bodyX, subY, maxW - 70);

  drawLogoBadge(ctx, W - 252, H - 132, 188, 76, false);
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
  drawLeftAccent(ctx, panelX + 20, panelY + 24, 320);
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
    ctx.font = MMTheme.fonts.body;
    ctx.fillStyle = MMTheme.colors.textSecondary;
    ctx.textBaseline = "top";
    wrapText(ctx, text, gridX, textY + 34, maxW - 10, MMTheme.spacing.lineHBody);
  }

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
  var cardPad = MMTheme.spacing.cardPadding;
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
    wrapText(ctx, items[i], gridX + 126, cy + 30, cardW - 156, MMTheme.spacing.lineHList);
  }

  drawPageNumber(ctx, slide, project);
}

function renderEndSlide(ctx, slide, project) {
  calcZones("end");
  drawGreenBackground(ctx);
  drawFrame(ctx, "rgba(255,255,255,0.34)");

  var panelW = W - 180;
  var panelH = 610;
  var panelX = (W - panelW) / 2;
  var panelY = (H - panelH) / 2;
  drawPanel(ctx, panelX, panelY, panelW, panelH, MMTheme.colors.whiteOverlay, "rgba(255,255,255,0.22)");

  drawLogoBadge(ctx, (W - 220) / 2, panelY + 54, 220, 88, true);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  var kicker = slide.content.kicker || "SEGUIR INFORMADO";
  ctx.font = MMTheme.fonts.endKicker;
  ctx.fillStyle = MMTheme.colors.white;
  ctx.fillText(kicker, W / 2, panelY + 182);

  var endTitle = slide.content.title || "Mas informacion en mediamendoza.com";
  var fitted = fitEndTitleFont(ctx, endTitle, panelW - 164, 3);
  ctx.font = fitted.font;
  ctx.fillStyle = MMTheme.colors.white;
  wrapText(ctx, endTitle, panelX + 82, panelY + 236, panelW - 164, fitted.lineH);

  ctx.font = MMTheme.fonts.subtitle;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  wrapText(
    ctx,
    slide.content.text || "Desliza para repasar los datos clave y entrar a la nota completa.",
    panelX + 104,
    panelY + 420,
    panelW - 208,
    MMTheme.spacing.lineHSubtitle
  );

  ctx.textAlign = "start";
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
