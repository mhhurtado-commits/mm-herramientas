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
