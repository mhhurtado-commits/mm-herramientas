const GENERAL_ACCENT = '#a6ce39';

export function normalizeCategoryOptions(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value, index) => ({
    id: clean(value?.id) || `categoria-${index + 1}`,
    label: clean(value?.label || value?.nombre || value?.seccion),
    vertical: clean(value?.vertical),
    recommended: Boolean(value?.recommended || value?.sugerida),
    color: clean(value?.color),
  })).filter(option => option.label).slice(0, 6);
}

export function getRecommendedCategory(options = []) {
  return options.find(option => option?.recommended) || options[0] || null;
}

export function resolveCategoryAccent(option, fallback = GENERAL_ACCENT) {
  return clean(option?.color) || fallback;
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
