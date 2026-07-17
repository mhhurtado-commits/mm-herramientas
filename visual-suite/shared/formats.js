// ============================================================
// Visual Suite — Formatos de Canvas Compartidos
// ============================================================

const VS_Formats = {
  landscape: { label: 'Horizontal 16:9', w: 2400, h: 1350, cssAR: '16 / 9', cardH: 240 },
  square:    { label: 'Cuadrado 1:1',    w: 1600, h: 1600, cssAR: '1 / 1',  cardH: 280 },
  portrait:  { label: 'Vertical 4:5',    w: 1350, h: 1688, cssAR: '4 / 5',  cardH: 320 },
  story:     { label: 'Historia 9:16',   w: 1080, h: 1920, cssAR: '9 / 16', cardH: 360 }
};

window.VS_Formats = VS_Formats;
