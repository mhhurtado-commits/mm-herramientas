// alertas/renderer.mjs — dibuja la placa en canvas. Sin DOM; ctx se recibe como argumento.

export const FORMATS = {
  '1:1': { width: 1600, height: 1600 },
  '4:5': { width: 1350, height: 1688 },
  '9:16': { width: 1080, height: 1920 },
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

export function renderAlertasPlaca(ctx, data, formatKey = '4:5', logoImg = null) {
  const cfg = FORMATS[formatKey] || FORMATS['4:5'];
  const W = cfg.width, H = cfg.height;
  const pad = Math.round(W * 0.042);

  // Fondo vertical oscuro
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#10130f');
  bg.addColorStop(1, '#0a0c09');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Borde exterior amarillo redondeado
  ctx.lineWidth = Math.max(3, Math.round(W * 0.0032));
  ctx.strokeStyle = '#f5c518';
  roundRect(ctx, pad * 0.4, pad * 0.4, W - pad * 0.8, H - pad * 0.8, W * 0.02);
  ctx.stroke();

  // Header: chip ALERTA + logo/wordmark + fecha·hora
  const chipW = Math.round(W * 0.155), chipH = Math.round(W * 0.036), chipY = pad;
  ctx.fillStyle = '#f5c518';
  roundRect(ctx, pad, chipY, chipW, chipH, chipH * 0.18);
  ctx.fill();
  ctx.fillStyle = '#141414';
  ctx.font = `900 ${Math.round(W * 0.0185)}px 'Arial Black', Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('ALERTA', pad + chipW / 2, chipY + chipH / 2 + 1);

  if (logoImg) {
    const logoH = Math.round(chipH * 1.5);
    const logoW = Math.round(logoH * (logoImg.width / logoImg.height));
    ctx.drawImage(logoImg, W - pad - logoW, chipY + chipH / 2 - logoH / 2, logoW, logoH);
  } else {
    ctx.fillStyle = '#f5f5ec';
    ctx.font = `800 ${Math.round(W * 0.0135)}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('MEDIA MENDOZA', W - pad, chipY + chipH / 2 + 1);
  }
  ctx.fillStyle = '#a7a896';
  ctx.font = `600 ${Math.round(W * 0.0125)}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`${data.fecha || ''} · ${data.hora || ''}`, W - pad, chipY + chipH + W * 0.014);

  // Titular
  let y = chipY + chipH + W * 0.068;
  ctx.fillStyle = '#f5f5ec';
  ctx.font = `900 ${Math.round(W * 0.056)}px 'Arial Black', Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titleText = String(data.titular || '').toUpperCase(); // sin titular → no se dibuja nada (nunca un rótulo inventado)
  for (const line of wrapLines(ctx, titleText, W - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += W * 0.058;
  }

  // Byline fuente
  y += W * 0.006;
  ctx.fillStyle = '#f5c518';
  ctx.font = `700 ${Math.round(W * 0.0135)}px Inter, Arial, sans-serif`;
  for (const line of wrapLines(ctx, (data.fuente || '').toUpperCase(), W - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += W * 0.018;
  }

  // Bloques de zona dinámicos (1–3)
  const gap = Math.round(W * 0.016);
  const padV = Math.round(W * 0.0135);
  const labelH = Math.round(W * 0.020);
  const bodyFS = Math.round(W * 0.0245);
  const bodyLH = Math.round(W * 0.031);
  const leftBar = Math.max(4, Math.round(W * 0.004));

  for (const celda of data.celdas || []) {
    if (!celda.zonas) continue;
    const towardPill = celda.hacia ? Math.round(W * 0.088) : 0;
    const bodyMax = W - pad * 2 - padV * 2 - towardPill - (towardPill ? Math.round(W * 0.014) : 0);
    ctx.font = `500 ${bodyFS}px Inter, Arial, sans-serif`;
    const bodyLines = wrapLines(ctx, `${celda.zonas} — ${celda.detalle}`, bodyMax);
    const blockH = padV * 2 + labelH + bodyLines.length * bodyLH + Math.round(W * 0.004);
    if (y + blockH > H - pad * 1.6) break; // nunca overflow

    // Panel
    ctx.fillStyle = 'rgba(245,197,24,.08)';
    roundRect(ctx, pad, y, W - pad * 2, blockH, W * 0.008);
    ctx.fill();
    // Barra izquierda
    ctx.fillStyle = '#f5c518';
    ctx.fillRect(pad, y + W * 0.010, leftBar, blockH - W * 0.020);
    // Etiqueta
    ctx.fillStyle = '#f5c518';
    ctx.font = `800 ${Math.round(W * 0.0125)}px Inter, Arial, sans-serif`;
    ctx.fillText(ETIQUETA_LABEL[celda.etiqueta] || 'ZONA', pad + padV, y + padV + labelH * 0.55);
    // Cuerpo
    ctx.fillStyle = '#f5f5ec';
    let lineY = y + padV + labelH + bodyLH * 0.75;
    ctx.font = `500 ${bodyFS}px Inter, Arial, sans-serif`;
    for (const line of bodyLines) {
      ctx.fillText(line, pad + padV, lineY);
      lineY += bodyLH;
    }
    // Pill dirección
    if (celda.hacia) {
      const pillW = Math.round(W * 0.078), pillH = Math.round(W * 0.026);
      const pillX = W - pad - padV - pillW, pillY = y + blockH / 2 - pillH / 2;
      ctx.fillStyle = '#f5c518';
      roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.fillStyle = '#141414';
      ctx.font = `800 ${Math.round(W * 0.0125)}px Inter, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`→ ${String(celda.hacia).toUpperCase()}`, pillX + pillW / 2, pillY + pillH / 2 + 1);
      ctx.textAlign = 'left';
    }
    y += blockH + gap;
  }

  // Banner ETA (solo si eta != null)
  if (data.eta) {
    const etaText = `⚡ ${data.eta.lugar}: llegada en ${data.eta.minutos} min — ${data.eta.detalle}`;
    const etaFont = Math.round(W * 0.0175);
    ctx.font = `800 ${etaFont}px Inter, Arial, sans-serif`;
    const etaLines = wrapLines(ctx, etaText, W - pad * 2 - Math.round(W * 0.032)).slice(0, 3);
    const lineH = W * 0.023;
    const etaH = Math.round(etaLines.length * lineH + W * 0.017);
    const footTop = H - Math.round(pad * 1.6) - Math.round(W * 0.021);
    const etaTop = Math.min(y, Math.max(Math.round(pad * 1.15), footTop - etaH));
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, pad, etaTop, W - pad * 2, etaH, W * 0.008);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    let etaY = etaTop + lineH * 0.78;
    for (const line of etaLines) {
      ctx.fillText(line, pad + Math.round(W * 0.016), etaY);
      etaY += lineH;
    }
  }

  // Footer
  const footY = H - Math.round(pad * 0.78);
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, footY - W * 0.021);
  ctx.lineTo(W - pad, footY - W * 0.021);
  ctx.stroke();
  ctx.fillStyle = '#f5f5ec';
  ctx.font = `800 ${Math.round(W * 0.016)}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('MEDIA MENDOZA', pad, footY);
  ctx.fillStyle = '#a7a896';
  ctx.font = `400 ${Math.round(W * 0.0125)}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`mediamendoza.com · ${data.fecha || ''} · ${data.hora || ''}`, W - pad, footY);
  ctx.textAlign = 'left';
}
