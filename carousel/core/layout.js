var W = 1080;
var H = 1350;
var FOOTER_H = 50;

var _currentZones = {
  headerY: 0,
  headerH: 0,
  bodyY: 0,
  bodyH: 0,
  footerY: H - FOOTER_H,
  footerH: FOOTER_H
};

export function setDimensions(w, h) {
  W = w;
  H = h;
}

export function getHeaderZone() {
  return { x: 0, y: _currentZones.headerY, w: W, h: _currentZones.headerH };
}

export function getBodyZone() {
  return { x: 0, y: _currentZones.bodyY, w: W, h: _currentZones.bodyH };
}

export function getFooterZone() {
  return { x: 0, y: _currentZones.footerY, w: W, h: _currentZones.footerH };
}

export function calcZones(slideType) {
  if (slideType === "cover") {
    _currentZones.headerY = 0;
    _currentZones.headerH = Math.round(H * 0.68);
    _currentZones.bodyY = _currentZones.headerH;
    _currentZones.bodyH = H - _currentZones.headerH;
    _currentZones.footerY = H;
    _currentZones.footerH = 0;
  } else if (slideType === "end") {
    _currentZones.headerY = 0;
    _currentZones.headerH = 0;
    _currentZones.bodyY = 0;
    _currentZones.bodyH = H - FOOTER_H;
    _currentZones.footerY = H - FOOTER_H;
    _currentZones.footerH = FOOTER_H;
  } else {
    _currentZones.headerY = 0;
    _currentZones.headerH = 0;
    _currentZones.bodyY = 0;
    _currentZones.bodyH = H - FOOTER_H;
    _currentZones.footerY = H - FOOTER_H;
    _currentZones.footerH = FOOTER_H;
  }
}

export function getCarouselLayout(kind, width, height) {
  var canvasWidth = width || W;
  var canvasHeight = height || H;
  var paddingX = Math.round(canvasWidth * 0.054);
  var topInset = Math.round(canvasHeight * 0.06);
  var logoInset = Math.round(Math.min(canvasWidth, canvasHeight) * 0.06);
  var footerHeight = Math.round(canvasHeight * 0.068);
  var footerY = canvasHeight - footerHeight;
  var contentY = topInset;
  var contentBottom = footerY - topInset;

  if (kind === "cover") {
    contentY = Math.round(canvasHeight * 0.42);
  } else if (kind === "end") {
    contentY = Math.round(canvasHeight * 0.18);
  }

  return {
    kind: kind,
    safeZones: {
      logo: { x: logoInset, y: logoInset, width: canvasWidth - logoInset * 2, height: Math.round(canvasHeight * 0.12) },
      footer: { x: 0, y: footerY, width: canvasWidth, height: footerHeight }
    },
    content: {
      x: paddingX,
      y: contentY,
      width: canvasWidth - paddingX * 2,
      height: Math.max(0, contentBottom - contentY)
    }
  };
}
