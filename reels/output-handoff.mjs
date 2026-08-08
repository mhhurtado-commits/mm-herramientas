export const REEL_HANDOFF_KEY = 'mm-editorial-handoff';

export function createReelHandoff(editorialPackage) {
  return JSON.stringify({ output: 'reel', package: editorialPackage || null });
}

export function parseReelHandoff(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed?.output !== 'reel' || !parsed.package) return null;
    return parsed;
  } catch {
    return null;
  }
}
