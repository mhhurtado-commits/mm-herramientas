const MAX_CLIMATE_FACTS = 6;

export function adaptClimatePlan(plan, article = {}) {
  const vertical = clean(article.editorialVertical) || clean(plan?.diagnosis?.vertical);
  if (vertical !== 'clima') return plan;

  const facts = uniqueFacts(article.editorialFacts);
  const narrativeFacts = facts.filter(isNarrativeFact);
  const metricFacts = facts.filter(fact => !isNarrativeFact(fact));
  const context = uniqueText([clean(article.editorialContext), ...narrativeFacts.map(factText)], []);
  const originalEnd = plan.slides?.find((slide) => slide?.type === 'end') || {
    type: 'end',
    title: 'Seguí la nota',
    cta: 'Leé la nota completa',
  };
  const slides = [];

  if (context) slides.push({ type: 'contexto', title: '¿Cómo estará el día?', text: context, variant: 'climate' });
  if (metricFacts.length) {
    slides.push({ type: 'dato', title: 'Datos del pronóstico', items: metricFacts.slice(0, MAX_CLIMATE_FACTS), variant: 'climate' });
  } else if (!context && clean(article.summary)) {
    slides.push({ type: 'contexto', title: 'Panorama', text: clean(article.summary) });
  }

  const previousSlideText = (plan.slides || [])
    .filter((slide) => slide && slide.type !== 'end')
    .flatMap((slide) => [
      slide.text,
      slide.subtitle,
      slide.content?.text,
      slide.content?.subtitle,
      ...(Array.isArray(slide.items) ? slide.items.map((item) => (
        item && typeof item === 'object' ? factText(item) : clean(item)
      )) : []),
    ])
    .map(clean)
    .filter(Boolean);
  const extended = uniqueExtendedText([
    ...(Array.isArray(article.editorialTextual) ? article.editorialTextual : []),
    ...textCandidates(article.content),
    ...previousSlideText,
  ], [context, ...facts.map(factText)]);
  if (extended) slides.push({ type: 'contexto', title: 'Lo que sigue', text: extended, variant: 'climate' });

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
    return {
      value: factValue,
      label: [label, detail && detail !== factValue ? detail : ''].filter(Boolean).join(' — '),
      icon: climateIcon(`${label} ${factValue} ${detail}`),
    };
  }
  return { value: clean(value), label: '', icon: climateIcon(value) };
}

function climateIcon(value) {
  const text = clean(value).toLowerCase();
  if (/lluv|precipit|lloviz|nieve|granizo/.test(text)) return 'rain';
  if (/viento|ráf|rafag|km\/h/.test(text)) return 'wind';
  if (/temper|maxim|minim|grados|°c|\bc\b/.test(text)) return 'temperature';
  if (/monta|cordillera/.test(text)) return 'mountain';
  if (/mejora|despejad|sol|cielo/.test(text)) return 'sun';
  return 'info';
}

function factText(fact) {
  return [fact?.value, fact?.label].filter(Boolean).join(' — ');
}

function isNarrativeFact(fact) {
  const text = factText(fact);
  const label = clean(fact?.label).toLowerCase();
  return text.length > 110 || text.split(/\s+/).length > 18 ||
    (text.length > 50 && !/\d/.test(text)) || /panorama|contexto|descripci/.test(label);
}

function uniqueText(values, excluded) {
  const blocked = new Set(excluded.map(clean).filter(Boolean).map(value => value.toLowerCase()));
  return values.map(clean).find(value => value && !blocked.has(value.toLowerCase())) || '';
}

function uniqueExtendedText(values, excluded) {
  const blocked = new Set(excluded.map(clean).filter(Boolean).map(normalizeKey));
  const candidates = values.flatMap(textCandidates)
    .map(clean)
    .filter((value) => value && !blocked.has(normalizeKey(value)));
  const unique = [];

  for (const candidate of candidates) {
    const key = normalizeKey(candidate);
    if (!key || unique.some((value) => normalizeKey(value) === key)) continue;
    unique.push(candidate);
  }

  return unique
    .filter((candidate, index, all) => !all.some((other, otherIndex) => (
      otherIndex !== index &&
      other.length > candidate.length &&
      normalizeKey(other).includes(normalizeKey(candidate))
    )))
    .slice(0, 4)
    .join(' ');
}

function textCandidates(value) {
  return clean(value)
    .split(/(?<=[.!?])\s+/)
    .map((text) => text.trim())
    .filter((text) => text.length >= 30);
}

function normalizeKey(value) {
  return clean(value).toLowerCase().replace(/[“”"']/g, '');
}

function clean(value) {
  if (value && typeof value === 'object') {
    for (const key of ['text', 'value', 'detail', 'title', 'summary', 'description']) {
      if (value[key] !== undefined && value[key] !== null) return clean(value[key]);
    }
    return '';
  }
  return String(value || '').replace(/\s+/g, ' ').trim();
}
