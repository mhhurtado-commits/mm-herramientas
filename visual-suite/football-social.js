// Visual Suite — Fútbol social: portada editorial independiente de la placa informativa.

const FOOTBALL_SOCIAL_MAX_TITLE = 28;
const FOOTBALL_SOCIAL_COLORS = {
  ink: '#07131d', navy: '#0b2435', blue: '#123f5b', cyan: '#35c1d1', lime: '#a6ce39',
  red: '#ef5b5b', white: '#f8fbf8', muted: 'rgba(238,247,244,.72)'
};

function footballSocialTitle(value) {
  const original = String(value || 'Partidos de hoy').trim().replace(/…+$/g, '');
  if (/^partidos de hoy/i.test(original)) return 'Partidos de hoy';
  if (original.length <= FOOTBALL_SOCIAL_MAX_TITLE) return original;
  const safe = original.slice(0, FOOTBALL_SOCIAL_MAX_TITLE).replace(/\s+\S*$/, '').trim();
  return safe || original.slice(0, FOOTBALL_SOCIAL_MAX_TITLE).trim();
}

function footballSocialSelectFeaturedMatch(matches) {
  const list = Array.isArray(matches) ? matches : [];
  return list.find(match => match && match.destacado) || list[0] || null;
}

function footballSocialStateLabel(status, result) {
  const labels = { programado: 'PROGRAMADO', 'en vivo': 'EN VIVO', finalizado: 'FINALIZADO', suspendido: 'SUSPENDIDO', cancelado: 'CANCELADO' };
  const key = String(status || 'programado').trim().toLowerCase();
  const label = labels[key] || key.toUpperCase() || 'PROGRAMADO';
  const score = String(result || '').trim();
  return score && (key === 'finalizado' || key === 'en vivo') ? `${label} · ${score}` : label;
}

function footballSocialLayoutFor(format, count) {
  const n = Math.max(0, Number(count) || 0);
  if (format === 'story') return { columns: 1, hero: n > 0, compact: n > 1 };
  return { columns: 2, hero: n > 0, compact: n > 1 };
}

function footballSocialData() {
  if (typeof getSelectedFootballData === 'function') return getSelectedFootballData();
  return { fecha: '', titulo: 'Partidos de hoy', subtitulo: '', fuente: '', partidos: [] };
}

function footballSocialFormat() {
  const key = typeof getFootballFormat === 'function' ? getFootballFormat() : 'square';
  return (typeof VS_Formats !== 'undefined' && VS_Formats[key]) || VS_Formats.square;
}

function footballSocialMatchKey(match, side) {
  if (typeof footballAssetKeyForMatch === 'function') return footballAssetKeyForMatch(match, side);
  return side === 'local' ? match.escudoLocal : match.escudoVisitante;
}

function footballSocialCompetitionKey(match) {
  return typeof footballCompetitionKey === 'function' ? footballCompetitionKey(match.competicion) : '';
}

async function preloadFootballSocialAssets(data) {
  if (typeof preloadFootballAssets === 'function') await preloadFootballAssets(data);
}

function socialRoundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth || 1; ctx.stroke(); }
}

function socialText(ctx, text, x, y, size, color, weight, align) {
  ctx.fillStyle = color || FOOTBALL_SOCIAL_COLORS.white;
  ctx.font = `${weight || 600} ${Math.round(size)}px "Inter", sans-serif`;
  ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(text || ''), x, y);
}

function socialDrawBackground(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, FOOTBALL_SOCIAL_COLORS.ink); g.addColorStop(.52, FOOTBALL_SOCIAL_COLORS.navy); g.addColorStop(1, '#071d2e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .16; ctx.strokeStyle = FOOTBALL_SOCIAL_COLORS.cyan; ctx.lineWidth = Math.max(2, W * .002);
  for (let x = -H; x < W + H; x += W * .09) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H * .55, H); ctx.stroke(); }
  ctx.globalAlpha = .24; ctx.strokeStyle = FOOTBALL_SOCIAL_COLORS.lime; ctx.lineWidth = Math.max(2, W * .0015);
  ctx.beginPath(); ctx.arc(W * .82, H * .62, Math.min(W, H) * .32, Math.PI * .85, Math.PI * 1.8); ctx.stroke();
  ctx.beginPath(); ctx.arc(W * .82, H * .62, Math.min(W, H) * .18, Math.PI * .85, Math.PI * 1.8); ctx.stroke(); ctx.restore();
}

function socialDrawCompetition(ctx, match, x, y, w, h) {
  const key = footballSocialCompetitionKey(match);
  const image = typeof getFootballImage === 'function' ? getFootballImage('competencias', key) : null;
  if (image && image.naturalWidth && typeof drawFootballImageContain === 'function') return drawFootballImageContain(ctx, image, x, y, w, h);
  socialRoundRect(ctx, x, y, w, h, h * .24, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.16)', 1);
  socialText(ctx, match.competicion || 'FÚTBOL', x + w / 2, y + h * .66, h * .34, FOOTBALL_SOCIAL_COLORS.muted, 700, 'center');
}

function socialDrawBadge(ctx, match, side, x, y, size) {
  const key = footballSocialMatchKey(match, side);
  const label = side === 'local' ? match.local : match.visitante;
  const image = typeof getFootballImage === 'function' ? getFootballImage('equipos', key) : null;
  if (image && image.naturalWidth && typeof drawFootballImageContain === 'function') return drawFootballImageContain(ctx, image, x, y, size, size);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.strokeStyle = FOOTBALL_SOCIAL_COLORS.lime; ctx.lineWidth = Math.max(2, size * .025);
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size * .42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const initials = String(label || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '?';
  socialText(ctx, initials, x + size / 2, y + size * .59, size * .2, '#fff', 800, 'center');
}

function socialDrawStatus(ctx, match, x, y, w, scale) {
  const label = footballSocialStateLabel(match.estado, match.resultado);
  const live = String(match.estado || '').toLowerCase() === 'en vivo';
  socialRoundRect(ctx, x, y, w, 34 * scale, 17 * scale, live ? 'rgba(239,91,91,.20)' : 'rgba(166,206,57,.15)', live ? FOOTBALL_SOCIAL_COLORS.red : FOOTBALL_SOCIAL_COLORS.lime, 2 * scale);
  socialText(ctx, label, x + w / 2, y + 23 * scale, 17 * scale, live ? '#ffb2aa' : FOOTBALL_SOCIAL_COLORS.lime, 800, 'center');
}

function socialDrawMatchHero(ctx, match, x, y, w, h, featured) {
  const s = Math.min(w, h) / 520;
  socialRoundRect(ctx, x, y, w, h, 28 * s, 'rgba(7,19,29,.88)', featured ? FOOTBALL_SOCIAL_COLORS.lime : 'rgba(255,255,255,.18)', featured ? 4 * s : 2 * s);
  ctx.save(); ctx.globalAlpha = .1; ctx.fillStyle = FOOTBALL_SOCIAL_COLORS.cyan; ctx.beginPath(); ctx.arc(x + w * .83, y + h * .22, h * .38, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const pad = Math.max(22, w * .055);
  socialDrawCompetition(ctx, match, x + pad, y + pad, Math.min(w * .32, 245 * s), 44 * s);
  socialDrawStatus(ctx, match, x + w - pad - Math.min(w * .32, 245 * s), y + pad, Math.min(w * .32, 245 * s), s);
  socialText(ctx, match.hora || 'A confirmar', x + w / 2, y + h * .24, Math.max(28, h * .075), '#fff', 800, 'center');
  const teamY = y + h * .53; const badge = Math.min(w * .16, h * .23);
  socialDrawBadge(ctx, match, 'local', x + w * .13, teamY - badge / 2, badge); socialDrawBadge(ctx, match, 'visitante', x + w * .71, teamY - badge / 2, badge);
  const local = typeof footballDisplayName === 'function' ? footballDisplayName(match.local) : match.local;
  const visitante = typeof footballDisplayName === 'function' ? footballDisplayName(match.visitante) : match.visitante;
  const nameSize = Math.max(20, Math.min(42, w * .032));
  socialText(ctx, local, x + w * .21, teamY + badge * .65, nameSize, '#fff', 800, 'center'); socialText(ctx, visitante, x + w * .79, teamY + badge * .65, nameSize, '#fff', 800, 'center');
  socialText(ctx, 'VS', x + w / 2, teamY + badge * .22, Math.max(18, h * .035), FOOTBALL_SOCIAL_COLORS.cyan, 800, 'center');
  if (match.estadio || match.arbitro) {
    const bits = [match.estadio, match.arbitro?.principal || match.arbitro].filter(Boolean);
    socialText(ctx, bits.join('  ·  '), x + w / 2, y + h - pad * .8, Math.max(14, h * .025), FOOTBALL_SOCIAL_COLORS.muted, 600, 'center');
  }
}

function socialDrawMatchCompact(ctx, match, x, y, w, h, featured) {
  const s = Math.min(w, h) / 360;
  socialRoundRect(ctx, x, y, w, h, 20 * s, featured ? 'rgba(25,71,82,.95)' : 'rgba(7,19,29,.83)', featured ? FOOTBALL_SOCIAL_COLORS.lime : 'rgba(255,255,255,.16)', featured ? 3 * s : 2 * s);
  const pad = Math.max(14, w * .045);
  socialText(ctx, match.hora || 'A confirmar', x + pad, y + pad + 21 * s, Math.max(20, 29 * s), FOOTBALL_SOCIAL_COLORS.lime, 800, 'left');
  socialDrawStatus(ctx, match, x + w - pad - Math.min(180 * s, w * .34), y + pad, Math.min(180 * s, w * .34), s);
  const middle = y + h * .54; const badge = Math.min(h * .29, w * .15);
  socialDrawBadge(ctx, match, 'local', x + w * .13, middle - badge / 2, badge); socialDrawBadge(ctx, match, 'visitante', x + w * .72, middle - badge / 2, badge);
  const local = typeof footballDisplayName === 'function' ? footballDisplayName(match.local) : match.local;
  const visitante = typeof footballDisplayName === 'function' ? footballDisplayName(match.visitante) : match.visitante;
  const fs = Math.max(16, Math.min(26, w * .032));
  socialText(ctx, local, x + w * .205, middle + badge * .68, fs, '#fff', 750, 'center'); socialText(ctx, visitante, x + w * .795, middle + badge * .68, fs, '#fff', 750, 'center');
  socialText(ctx, match.resultado || 'VS', x + w / 2, middle + 8 * s, Math.max(15, 18 * s), match.resultado ? '#fff' : FOOTBALL_SOCIAL_COLORS.cyan, 800, 'center');
  socialText(ctx, match.competicion || 'Fútbol', x + pad, y + h - pad * .65, Math.max(12, 15 * s), FOOTBALL_SOCIAL_COLORS.muted, 600, 'left');
}

function drawFootballSocial(ctx, W, H, data) {
  const headerH = typeof VS_CanvasHelpers !== 'undefined' ? VS_CanvasHelpers.plateHeaderHeight(W, H) : Math.round(H * .15);
  socialDrawBackground(ctx, W, H);
  if (typeof VS_CanvasHelpers !== 'undefined') {
    VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'FÚTBOL', footballSocialTitle(data.titulo), headerH, { titleMaxChars: FOOTBALL_SOCIAL_MAX_TITLE, titleMinScale: .78, titleMaxWidth: W * .68 });
    VS_CanvasHelpers.drawPlateLogo(ctx, W, H);
  }
  const M = Math.round(W * .055); const matches = Array.isArray(data.partidos) ? data.partidos : [];
  const format = typeof getFootballFormat === 'function' ? getFootballFormat() : 'square';
  const layout = footballSocialLayoutFor(format, matches.length); const gap = Math.round(Math.min(W, H) * .022);
  const bodyBottom = H - Math.round(H * .075); let y = headerH + Math.round(H * .035);
  socialText(ctx, data.fecha || 'JORNADA DE FÚTBOL', M, y + 24, Math.min(W, H) * .022, FOOTBALL_SOCIAL_COLORS.cyan, 800, 'left');
  y += Math.round(H * .032);
  socialText(ctx, data.subtitulo || 'Argentina y CONMEBOL', M, y + 22, Math.min(W, H) * .025, FOOTBALL_SOCIAL_COLORS.muted, 700, 'left'); y += Math.round(H * .055);
  if (!matches.length) {
    socialRoundRect(ctx, M, y, W - M * 2, Math.min(H - y - 180, 280), 24, 'rgba(7,19,29,.76)', 'rgba(255,255,255,.16)', 2);
    socialText(ctx, 'Seleccioná al menos un partido', W / 2, y + 120, Math.min(W, H) * .035, '#fff', 700, 'center');
  } else if (layout.hero) {
    const featured = footballSocialSelectFeaturedMatch(matches); const matchH = Math.min(Math.round(H * .34), bodyBottom - y - gap);
    socialText(ctx, 'PARTIDO DESTACADO', M, y - Math.round(H * .012), Math.min(W, H) * .018, FOOTBALL_SOCIAL_COLORS.lime, 800, 'left');
    socialDrawMatchHero(ctx, featured, M, y, W - M * 2, matchH, true);
    const rest = matches.filter(m => m !== featured); const cols = layout.columns || 1; const cw = (W - M * 2 - gap * (cols - 1)) / cols;
    const rows = Math.max(1, Math.ceil(rest.length / cols));
    const remaining = Math.max(0, bodyBottom - y - matchH - gap * 2);
    const ch = Math.max(112, Math.min(245, (remaining - gap * (rows - 1)) / rows));
    rest.forEach((match, i) => socialDrawMatchCompact(ctx, match, M + (i % cols) * (cw + gap), y + matchH + gap + Math.floor(i / cols) * (ch + gap), cw, ch, false));
  } else {
    const cols = layout.columns || 1; const rows = Math.ceil(matches.length / cols); const cw = (W - M * 2 - gap * (cols - 1)) / cols;
    const ch = Math.max(150, Math.min(300, (bodyBottom - y - gap * (rows - 1)) / rows));
    matches.forEach((match, i) => socialDrawMatchCompact(ctx, match, M + (i % cols) * (cw + gap), y + Math.floor(i / cols) * (ch + gap), cw, ch, Boolean(match.destacado)));
  }
  if (typeof VS_CanvasHelpers !== 'undefined') VS_CanvasHelpers.drawFooter(ctx, W, H, true, { onField: true });
}

async function renderFootballSocial() {
  const canvas = document.getElementById('footballCanvas'); const area = document.getElementById('footballArea'); if (!canvas || !area) return;
  const format = footballSocialFormat(); const width = Math.max(320, Math.min(area.clientWidth || 760, 900));
  canvas.width = format.w; canvas.height = format.h; canvas.style.width = `${width}px`; canvas.style.height = `${Math.round(width / (format.w / format.h))}px`;
  const data = footballSocialData(); drawFootballSocial(canvas.getContext('2d'), format.w, format.h, data); await preloadFootballSocialAssets(data); drawFootballSocial(canvas.getContext('2d'), format.w, format.h, data);
}

async function exportFootballSocial() {
  const format = footballSocialFormat(); const data = footballSocialData(); await preloadFootballSocialAssets(data);
  const canvas = document.createElement('canvas'); canvas.width = format.w; canvas.height = format.h; drawFootballSocial(canvas.getContext('2d'), format.w, format.h, data);
  canvas.toBlob(blob => { if (!blob) return toast('No se pudo exportar la placa social de fútbol'); const url = URL.createObjectURL(blob); mostrarExportPreview(url, 'futbol-social-media-mendoza'); }, 'image/png', 1);
}

if (typeof window !== 'undefined') { window.renderFootballSocial = renderFootballSocial; window.exportFootballSocial = exportFootballSocial; }
if (typeof module !== 'undefined') module.exports = { footballSocialTitle, footballSocialSelectFeaturedMatch, footballSocialStateLabel, footballSocialLayoutFor };
