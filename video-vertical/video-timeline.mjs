export function clampTimelineTime(time, duration = 0) {
  const total = Math.max(0, Number(duration) || 0);
  return Math.min(total, Math.max(0, Number(time) || 0));
}

export function getTimelineRatio(time, duration = 0) {
  const total = Math.max(0, Number(duration) || 0);
  return total ? clampTimelineTime(time, total) / total : 0;
}

export function getTimelinePointerTime({ clientX = 0, left = 0, width = 0, duration = 0 } = {}) {
  const ratio = Math.min(1, Math.max(0, (Number(clientX) - Number(left)) / (Number(width) || 1)));
  return ratio * Math.max(0, Number(duration) || 0);
}

export function stepTimelineTime(time, seconds, duration = 0) {
  return clampTimelineTime((Number(time) || 0) + (Number(seconds) || 0), duration);
}
