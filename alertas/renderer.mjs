// alertas/renderer.mjs — dibuja la placa en canvas. Sin DOM; ctx se recibe como argumento.
// Lenguaje visual coherente con /efemerides/ (fondo #0F1520, neutros, footer 3 columnas,
// regla de acento bajo la banda) conservando la firma de urgencia (borde amarillo, chip ALERTA).

export const FORMATS = {
  '1:1': { width: 1600, height: 1600 },
  '4:5': { width: 1350, height: 1688 },
  '9:16': { width: 1080, height: 1920 },
};

// Escalado dinámico del cuerpo: llena la altura restante entre byline y footer.
// 1 celda corta → factor alto (placa llena); 3 celdas largas + ETA → factor bajo (nunca se corta un bloque).
export const PISO_ESCALA = 0.55;
export const TOPE_ESCALA = 2.4;

export function calcularFactor(natural, disponible) {
  if (!Number.isFinite(natural) || natural <= 0) return TOPE_ESCALA;
  if (!Number.isFinite(disponible) || disponible <= 0) return PISO_ESCALA;
  return Math.min(TOPE_ESCALA, Math.max(PISO_ESCALA, disponible / natural));
}

const CREMA = '#F5F1E6';
const ATENUADO = 'rgba(245,241,230,.78)';
const REGLA = 'rgba(245,241,230,.25)';
const ACENTO = '#f5c518';
const ACENTO_FONDO = 'rgba(245,197,24,.08)';
const FONDO = '#0F1520';
const NEGRO = '#141414';
const ROJO = '#c0392b';

// Colores por nivel (semántica del prompt): gris=tranquilo, blanco=info, azul=vigilancia,
// verde=leve, amarillo=moderada, naranja=fuerte, rojo=severa, violeta=máxima
const NIVEL_COLOR = {
  gris: '#95a5a6',
  blanco: '#ecf0f1',
  azul: '#3498db',
  verde: '#27ae60',
  amarillo: '#f1c40f',
  naranja: '#e67e22',
  rojo: '#c0392b',
  violeta: '#8e44ad',
};
// Texto del chip: negro sobre fondos claros, blanco sobre fondos oscuros (contraste).
const NIVEL_TEXTO = {
  gris: NEGRO, blanco: NEGRO, azul: '#ffffff', verde: '#ffffff',
  amarillo: NEGRO, naranja: NEGRO, rojo: '#ffffff', violeta: '#ffffff',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const probe = current + ' ' + words[i];
    if (ctx.measureText(probe).width <= maxWidth) current = probe;
    else { lines.push(current); current = words[i]; }
  }
  lines.push(current);
  return lines;
}

const ETIQUETA_LABEL = { ahora: 'AFECTANDO AHORA', ruta: 'EN RUTA', siguiente: 'PRÓXIMO' };
const padOf = (W) => Math.round(W * 0.042);

function metricasCuerpo(W, f) {
  return {
    gap: Math.round(W * 0.016 * f), padV: Math.round(W * 0.0135 * f),
    labelH: Math.round(W * 0.020 * f), bodyFS: Math.round(W * 0.0245 * f),
    bodyLH: Math.round(W * 0.031 * f), labelFS: Math.round(W * 0.0125 * f),
    pillW: Math.round(W * 0.11 * f), pillH: Math.round(W * 0.034 * f),
    pillFS: Math.round(W * 0.016 * f),
    etaFS: Math.round(W * 0.0175 * f), etaLH: Math.round(W * 0.023 * f),
    etaPadV: Math.round(W * 0.017 * f), etaPadL: Math.round(W * 0.016 * f),
    bar: Math.max(4, Math.round(W * 0.004 * f)),
  };
}

const textoEta = (eta) => `⚡ ${eta.lugar}: llegada en ${eta.minutos} min — ${eta.detalle}`;

function altoCuerpo(ctx, celdas, eta, W, f) {
  const pad = padOf(W);
  const m = metricasCuerpo(W, f);
  let total = 0;
  for (const celda of celdas) {
    if (!celda.zonas) continue;
    const towardPill = celda.hacia ? m.pillW + Math.round(W * 0.014) : 0;
    const bodyMax = Math.max(1, W - pad * 2 - m.padV * 2 - towardPill);
    ctx.font = `500 ${m.bodyFS}px Inter, Arial, sans-serif`;
    const lines = wrapLines(ctx, `${celda.zonas} — ${celda.detalle}`, bodyMax).length || 1;
    total += m.padV * 2 + m.labelH + lines * m.bodyLH + Math.round(W * 0.004 * f) + m.gap;
  }
  if (eta && eta.lugar) {
    ctx.font = `800 ${m.etaFS}px Inter, Arial, sans-serif`;
    const lines = wrapLines(ctx, textoEta(eta), W - pad * 2 - Math.round(W * 0.032)).slice(0, 3).length;
    total += lines * m.etaLH + m.etaPadV + m.gap;
  }
  return total;
}

// Calcula el factor de escala del cuerpo iterando: la medida de saltos de línea
// depende del tamaño de fuente, así que el factor se ajusta hasta que el total
// dibujado entre en el espacio disponible (sin cortar ningún bloque).
function factorCuerpo(ctx, celdas, eta, W, disponible) {
  if (!Number.isFinite(disponible) || disponible <= 0) return PISO_ESCALA;
  let f = calcularFactor(altoCuerpo(ctx, celdas, eta, W, 1), disponible);
  for (let i = 0; i < 6; i++) {
    const total = altoCuerpo(ctx, celdas, eta, W, f);
    if (total <= 0) return f;
    const next = Math.min(TOPE_ESCALA, Math.max(PISO_ESCALA, f * (disponible / total)));
    if (Math.abs(next - f) < 0.01) return Math.min(next, f);
    f = next;
    if (f <= PISO_ESCALA) return PISO_ESCALA;
    if (f >= TOPE_ESCALA) return TOPE_ESCALA;
  }
  return f;
}

function unaLinea(ctx, texto, maxAncho) {
  if (ctx.measureText(texto).width <= maxAncho) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxAncho) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

export function renderAlertasPlaca(ctx, data, formatKey = '4:5', logoImg = null) {
  const cfg = FORMATS[formatKey] || FORMATS['4:5'];
  const W = cfg.width, H = cfg.height;
  const pad = padOf(W);
  const celdas = (data.celdas || []).filter((c) => c && c.zonas);

  // Fondo plano azul-noche (igual al de /efemerides/)
  ctx.fillStyle = FONDO;
  ctx.fillRect(0, 0, W, H);

  // Borde exterior amarillo redondeado
  ctx.lineWidth = Math.max(3, Math.round(W * 0.0032));
  ctx.strokeStyle = ACENTO;
  roundRect(ctx, pad * 0.4, pad * 0.4, W - pad * 0.8, H - pad * 0.8, W * 0.02);
  ctx.stroke();

  // Header banda: chip ALERTA izq + logo/fecha der (fijo, más grande)
  const nivel = NIVEL_COLOR[String(data.nivel || 'naranja').trim().toLowerCase()] || NIVEL_COLOR.naranja;
  const textoNivel = NIVEL_TEXTO[String(data.nivel || 'naranja').trim().toLowerCase()] || NEGRO;
  const chipW = Math.round(W * 0.19), chipH = Math.round(W * 0.047), chipY = pad;
  ctx.fillStyle = nivel;
  roundRect(ctx, pad, chipY, chipW, chipH, chipH * 0.18);
  ctx.fill();
  ctx.fillStyle = textoNivel;
  ctx.font = `600 ${Math.round(W * 0.026)}px Oswald, Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('ALERTA', pad + chipW / 2, chipY + chipH / 2 + 1);

  if (logoImg) {
    const logoH = Math.round(chipH * 1.5);
    const logoW = Math.round(logoH * (logoImg.width / logoImg.height));
    ctx.drawImage(logoImg, W - pad - logoW, chipY + chipH / 2 - logoH / 2, logoW, logoH);
  } else {
    ctx.fillStyle = CREMA;
    ctx.font = `600 ${Math.round(W * 0.019)}px Oswald, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('MEDIA MENDOZA', W - pad, chipY + chipH / 2);
  }
  ctx.fillStyle = ACENTO;
  ctx.font = `600 ${Math.round(W * 0.0225)}px Oswald, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${data.fecha || ''} · ${data.hora || ''}`, W - pad, chipY + chipH + W * 0.030);

  // Regla de acento 4px full-width (patrón efemérides, acento alerta)
  const ruleH = Math.max(3, Math.round(W * 0.0035));
  const ruleY = chipY + chipH + W * 0.038;
  ctx.fillStyle = ACENTO;
  ctx.fillRect(pad, ruleY, W - pad * 2, ruleH);

  // Titular (Oswald 700, caps)
  let y = ruleY + W * 0.075;
  ctx.fillStyle = CREMA;
  ctx.font = `700 ${Math.round(W * 0.06)}px Oswald, Arial, sans-serif`;
  ctx.textAlign = 'left';
  for (const line of wrapLines(ctx, String(data.titular || '').toUpperCase(), W - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += W * 0.061;
  }

  // Byline fuente (Inter caps acento)
  y += W * 0.004;
  ctx.fillStyle = ACENTO;
  ctx.font = `700 ${Math.round(W * 0.018)}px Inter, Arial, sans-serif`;
  for (const line of wrapLines(ctx, (data.fuente || '').toUpperCase(), W - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += W * 0.024;
  }

  // Cuerpo dinámico: factor iterativo disponible/natural (sin desbordar ni cortar bloques)
  const bottomLimit = H - Math.round(pad * 1.6) - Math.round(W * 0.021);
  const disponible = Math.max(0, bottomLimit - y);
  const f = factorCuerpo(ctx, celdas, data.eta, W, disponible);
  const m = metricasCuerpo(W, f);

  for (const celda of celdas) {
    const towardPill = celda.hacia ? m.pillW + Math.round(W * 0.014) : 0;
    const bodyMax = Math.max(1, W - pad * 2 - m.padV * 2 - towardPill);
    ctx.font = `500 ${m.bodyFS}px Inter, Arial, sans-serif`;
    const bodyLines = wrapLines(ctx, `${celda.zonas} — ${celda.detalle}`, bodyMax);
    const blockH = m.padV * 2 + m.labelH + bodyLines.length * m.bodyLH + Math.round(W * 0.004 * f);

    ctx.fillStyle = ACENTO_FONDO;
    roundRect(ctx, pad, y, W - pad * 2, blockH, W * 0.008);
    ctx.fill();
    ctx.fillStyle = ACENTO;
    ctx.fillRect(pad, y + W * 0.010 * f, m.bar, blockH - W * 0.020 * f);
    ctx.font = `600 ${m.labelFS}px Oswald, Arial, sans-serif`;
    ctx.fillText(ETIQUETA_LABEL[celda.etiqueta] || 'ZONA', pad + m.padV, y + m.padV + m.labelH * 0.55);
    ctx.fillStyle = CREMA;
    let lineY = y + m.padV + m.labelH + m.bodyLH * 0.75;
    ctx.font = `500 ${m.bodyFS}px Inter, Arial, sans-serif`;
    for (const line of bodyLines) {
      ctx.fillText(line, pad + m.padV, lineY);
      lineY += m.bodyLH;
    }
    if (celda.hacia) {
      const pillX = W - pad - m.padV - m.pillW, pillY = y + blockH / 2 - m.pillH / 2;
      ctx.fillStyle = ACENTO;
      roundRect(ctx, pillX, pillY, m.pillW, m.pillH, m.pillH / 2);
      ctx.fill();
      ctx.fillStyle = NEGRO;
      ctx.font = `600 ${m.pillFS}px Oswald, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`→ ${String(celda.hacia).toUpperCase()}`, pillX + m.pillW / 2, pillY + m.pillH / 2 + 1);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    }
    y += blockH + m.gap;
  }

  // Banner ETA (solo si eta != null)
  if (data.eta) {
    ctx.font = `800 ${m.etaFS}px Inter, Arial, sans-serif`;
    const etaLines = wrapLines(ctx, textoEta(data.eta), W - pad * 2 - Math.round(W * 0.032)).slice(0, 3);
    const etaH = etaLines.length * m.etaLH + m.etaPadV;
    ctx.fillStyle = ROJO;
    roundRect(ctx, pad, y, W - pad * 2, etaH, W * 0.008);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    let etaY = y + m.etaLH * 0.72 + m.etaPadV * 0.25;
    for (const line of etaLines) {
      ctx.fillText(line, pad + m.etaPadL, etaY);
      etaY += m.etaLH;
    }
    y += etaH + m.gap;
  }

  // Footer 3 columnas (patrón efemérides): FUENTE izq · dominio centro · etiqueta der
  const footRuleY = H - Math.round(pad * 0.99);
  ctx.strokeStyle = REGLA;
  ctx.lineWidth = Math.max(1.5, Math.round(W * 0.0016));
  ctx.beginPath();
  ctx.moveTo(pad, footRuleY);
  ctx.lineTo(W - pad, footRuleY);
  ctx.stroke();
  const footY = H - Math.round(pad * 0.42);
  ctx.fillStyle = ATENUADO;
  ctx.font = `600 ${Math.round(W * 0.0185)}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'left';
  const maxIzq = Math.round(W * 0.5) - pad - Math.round(W * 0.155);
  ctx.fillText(unaLinea(ctx, `FUENTE: ${String(data.fuente || '').toUpperCase()}`, maxIzq), pad, footY);
  ctx.fillStyle = CREMA;
  ctx.font = `600 ${Math.round(W * 0.022)}px Oswald, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('WWW.MEDIAMENDOZA.COM', W / 2, footY);
  ctx.fillStyle = ACENTO;
  ctx.font = `600 ${Math.round(W * 0.0225)}px Oswald, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('ALERTA DE TORMENTAS', W - pad, footY);
  ctx.textAlign = 'left';
}
