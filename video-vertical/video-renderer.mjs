import { getOverlayLayout, getVideoFramePlan } from './video-framing.mjs';
import { TITLE_DURATION, getActiveSpeaker } from './video-speakers.mjs';

export function drawVideoPreview(ctx, video, project, { width = ctx.canvas.width, height = ctx.canvas.height, time = 0, logo = null } = {}) {
  const plan = getVideoFramePlan({ sourceWidth: video?.videoWidth, sourceHeight: video?.videoHeight, width, height, mode: project?.framing?.mode, focus: project?.framing?.focus });
  const layout = getOverlayLayout({ width, height });
  ctx.clearRect(0, 0, width, height);
  ctx.save(); ctx.filter = `blur(${plan.background.blur}px) brightness(0.58)`;
  ctx.drawImage(video, plan.background.x, plan.background.y, plan.background.width, plan.background.height); ctx.restore();
  ctx.fillStyle = 'rgba(8,13,11,.2)'; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.clip();
  ctx.drawImage(video, plan.foreground.x, plan.foreground.y, plan.foreground.width, plan.foreground.height); ctx.restore();
  drawEditorialOverlay(ctx, project, { time, layout, logo });
  return { plan, layout };
}

export function drawEditorialOverlay(ctx, project, { time = 0, layout = getOverlayLayout({ width: ctx.canvas.width, height: ctx.canvas.height }), logo = null } = {}) {
  drawEditorialLayer(ctx, project, { kind: 'fixed' }, { layout, logo });
  if (time < TITLE_DURATION) drawEditorialLayer(ctx, project, { kind: 'title' }, { layout, logo });
  const speaker = getActiveSpeaker(project?.speakers || [], time);
  if (speaker) drawEditorialLayer(ctx, project, { kind: 'speaker', speaker }, { layout, logo });
  drawCaption(ctx, activeCaption(project?.captions, time), layout.caption);
  return layout;
}

export function drawEditorialLayer(ctx, project, layer = {}, { layout = getOverlayLayout({ width: ctx.canvas.width, height: ctx.canvas.height }), logo = null } = {}) {
  const lowerThird = project?.lowerThird || {};
  if (layer.kind === 'fixed') {
    drawBrandLogo(ctx, logo, layout.safe);
    drawHook(ctx, lowerThird, layout.hook);
  }
  if (layer.kind === 'title') drawLowerThird(ctx, lowerThird, layout.lowerThird);
  if (layer.kind === 'speaker') drawSpeakerLowerThird(ctx, layer.speaker, lowerThird.accent, layout.lowerThird);
}

export function fitVideoText(text, maxWidth, measure = value => value.length) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = []; let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate) > maxWidth) { lines.push(line); line = word; } else line = candidate;
  }
  if (line) lines.push(line);
  return { lines };
}

function drawHook(ctx, lowerThird = {}, box) {
  if (!lowerThird.section) return;
  ctx.save(); ctx.fillStyle = lowerThird.accent || '#a6ce39'; roundRect(ctx, box.x, box.y, Math.min(box.width, 290), 52, 26); ctx.fill();
  ctx.font = '700 25px Arial, sans-serif'; ctx.fillStyle = '#122019'; ctx.fillText((lowerThird.section || 'Actualidad').toUpperCase(), box.x + 22, box.y + 33); ctx.restore();
}

function drawSpeakerLowerThird(ctx, speaker = {}, accent, box) {
  const name = String(speaker.name || '').trim();
  if (!name) return;
  ctx.save(); ctx.fillStyle = 'rgba(10,17,14,.92)'; roundRect(ctx, box.x, box.y, box.width, box.height, 28); ctx.fill();
  ctx.fillStyle = accent || '#a6ce39'; ctx.fillRect(box.x, box.y, 12, box.height);
  const x = box.x + 34;
  ctx.font = '800 42px Arial, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(name.toUpperCase(), x, box.y + 58);
  if (speaker.role) { ctx.font = '500 25px Arial, sans-serif'; ctx.fillStyle = '#d7dfda'; ctx.fillText(String(speaker.role), x, box.y + 102); }
  ctx.restore();
}

function drawLowerThird(ctx, lowerThird = {}, box) {
  ctx.save(); ctx.fillStyle = 'rgba(10,17,14,.92)'; roundRect(ctx, box.x, box.y, box.width, box.height, 28); ctx.fill();
  ctx.fillStyle = lowerThird.accent || '#a6ce39'; ctx.fillRect(box.x, box.y, 12, box.height);
  const x = box.x + 34; const maxWidth = box.width - 68;
  ctx.font = '800 42px Arial, sans-serif'; const title = fitVideoText(lowerThird.title, maxWidth, value => ctx.measureText(value).width).lines.slice(0, 2);
  ctx.fillStyle = '#fff'; title.forEach((line, index) => ctx.fillText(line, x, box.y + 52 + index * 47));
  ctx.font = '500 22px Arial, sans-serif'; ctx.fillStyle = '#d7dfda'; ctx.fillText(lowerThird.source || 'mediamendoza', x, box.y + box.height - 28);
  ctx.restore();
}

function drawBrandLogo(ctx, logo, safe) {
  if (!logo?.width || !logo?.height) return;
  const width = ctx.canvas.width * 0.26; const height = Math.min(ctx.canvas.height * 0.075, width * logo.height / logo.width);
  ctx.save(); ctx.globalAlpha = 0.96; ctx.drawImage(logo, safe.right - width, ctx.canvas.height * 0.035, width, height); ctx.restore();
}

function drawCaption(ctx, caption, box) {
  if (!caption?.text) return;
  ctx.save(); ctx.font = '700 34px Arial, sans-serif'; const lines = fitVideoText(caption.text, box.width - 44, value => ctx.measureText(value).width).lines.slice(0, 2);
  const height = lines.length * 42 + 30; ctx.fillStyle = 'rgba(0,0,0,.76)'; roundRect(ctx, box.x, box.y + box.height - height, box.width, height, 22); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  lines.forEach((line, index) => ctx.fillText(line, box.x + box.width / 2, box.y + box.height - height + 42 + index * 42)); ctx.restore();
}

function activeCaption(captions, time) { return Array.isArray(captions) ? captions.find(caption => Number(caption.start) <= time && Number(caption.end) >= time) : null; }
function roundRect(ctx, x, y, width, height, radius) { ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); }
