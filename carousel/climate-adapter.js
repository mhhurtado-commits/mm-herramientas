const MAX_CLIMATE_FACTS = 6;

export function adaptClimatePlan(plan, article = {}) {
  const vertical = clean(article.editorialVertical) || clean(plan?.diagnosis?.vertical);
  if (vertical !== 'clima') return plan;

  const facts = uniqueFacts(article.editorialFacts);
  const context = clean(article.editorialContext);
  const originalEnd = plan.slides?.find((slide) => slide?.type === 'end') || {
    type: 'end',
    title: 'Seguí la nota',
    cta: 'Leé la nota completa',
  };
  const slides = [];

  if (context) slides.push({ type: 'contexto', title: '¿Cómo estará el día?', text: context });
  if (facts.length) {
    slides.push({ type: 'dato', title: 'Datos del pronóstico', items: facts.slice(0, MAX_CLIMATE_FACTS) });
  } else if (!context && clean(article.summary)) {
    slides.push({ type: 'contexto', title: 'Panorama', text: clean(article.summary) });
  }

  const extended = uniqueText([
    clean(article.editorialTextual?.[0]?.text || article.editorialTextual?.[0]),
  ], [context, ...facts.map(factText)]);
  if (extended) slides.push({ type: 'contexto', title: 'Lo que sigue', text: extended });

  return {
    ...plan,
    slides: [...slides, originalEnd],
    diagnosis: { ...plan.diagnosis, vertical: 'clima', slide_count: slides.length + 2 },
  };
}

function uniqueFacts(values) {
  const result = [];
  const seen = new Set();
  for (const raw of Array.isArray(values) ? values : []) {
    const fact = normalizeFact(raw);
    const key = factText(fact).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(fact);
  }
  return result;
}

function normalizeFact(value) {
  if (value && typeof value === 'object') {
    const label = clean(value.label);
    const factValue = clean(value.value || value.text || value.detail);
    const detail = clean(value.detail);
    return { value: factValue, label: [label, detail && detail !== factValue ? detail : ''].filter(Boolean).join(' — ') };
  }
  return { value: clean(value), label: '' };
}

function factText(fact) {
  return [fact?.value, fact?.label].filter(Boolean).join(' — ');
}

function uniqueText(values, excluded) {
  const blocked = new Set(excluded.map(clean).filter(Boolean).map(value => value.toLowerCase()));
  return values.map(clean).find(value => value && !blocked.has(value.toLowerCase())) || '';
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
