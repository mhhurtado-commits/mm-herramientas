function cleanImageSource(value) {
  return String(value || '').trim();
}

function getArticleImageSources(article) {
  const source = article || {};
  const main = cleanImageSource(source.image);
  const images = Array.isArray(source.images)
    ? source.images.map(cleanImageSource).filter(Boolean)
    : [];
  return { main, images, available: [main].concat(images).filter(Boolean) };
}

export function resolveArticleImage(reference, article) {
  const source = cleanImageSource(reference);
  const { main, images, available } = getArticleImageSources(article);
  if (source === 'article.image') return main;
  const match = source.match(/^article\.images\[(\d+)\]$/);
  if (match) return images[Number(match[1])] || '';
  return available.indexOf(source) >= 0 ? source : '';
}

export function isExplicitManualImageSource(reference) {
  const source = cleanImageSource(reference);
  return /^data:image\//i.test(source) || /^blob:/i.test(source);
}

export function resolveSupportImage(reference, article) {
  const source = cleanImageSource(reference);
  return resolveArticleImage(source, article) || (isExplicitManualImageSource(source) ? source : '');
}
