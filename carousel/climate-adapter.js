const MAX_CLIMATE_FACTS = 6;

export function adaptClimatePlan(plan, article = {}) {
  const vertical = (clean(article.editorialVertical) || clean(plan?.diagnosis?.vertical)).toLowerCase();
  if (vertical !== 'clima') return plan;

  const facts = uniqueFacts(article.editorialFacts);
  const narrativeFacts = facts.filter(isNarrativeFact);
  const metricFacts = facts.filter(fact => !isNarrativeFact(fact));
  const sourceContext = clean(article.editorialContext);
  const futureContext = isFutureClimateText(sourceContext, article.date) ? sourceContext : '';
  const context = uniqueText([
    ...(futureContext ? [clean(article.summary), ...narrativeFacts.map(factText)] : [sourceContext, ...narrativeFacts.map(factText)]),
  ], []);
  const originalEnd = plan.slides?.find((slide) => slide?.type === 'end') || {
    type: 'end',
    title: 'Seguí la nota',
    cta: 'Leé la nota completa',
  };
  const articleTitle = clean(article.title);
  const climateEnd = {
    ...originalEnd,
    title: clean(originalEnd.title) && clean(originalEnd.title) !== articleTitle ? originalEnd.title : 'Más información',
    variant: 'climate',
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
    futureContext,
    ...(Array.isArray(article.editorialTextual) ? article.editorialTextual : []),
    ...textCandidates(article.content),
    ...previousSlideText,
  ], [context, ...facts.map(factText)]);
  if (extended) slides.push({ type: 'contexto', title: 'Lo que sigue', text: extended, variant: 'climate' });

  return {
    ...plan,
    slides: [...slides, climateEnd],
    diagnosis: { ...plan.diagnosis, vertical: 'clima', slide_count: slides.length + 2 },
  };
}

function isFutureClimateText(value, referenceDate) {
  const text = clean(value);
  if (/ma\u00f1ana|a partir del|hacia el|para el/i.test(text)) return true;
  const match = text.match(/lunes|martes|mi\u00e9rcoles|jueves|viernes|s\u00e1bado|domingo/i);
  const date = parseDate(referenceDate);
  if (!match || !date) return false;
  const weekdays = ['domingo', 'lunes', 'martes', 'mi\u00e9rcoles', 'jueves', 'viernes', 's\u00e1bado'];
  const target = weekdays.indexOf(normalizeClimateKey(match[0]));
  return target >= 0 && (target - date.getUTCDay() + 7) % 7 > 0;
}

function parseDate(value) {
  const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
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
    text.length > 45 || /panorama|contexto|descripci/.test(label);
}

function uniqueText(values, excluded) {
  const blocked = new Set(excluded.map(clean).filter(Boolean).map(value => value.toLowerCase()));
  return values.map(clean).find(value => value && !blocked.has(value.toLowerCase())) || '';
}

function uniqueExtendedText(values, excluded) {
  const blocked = new Set(excluded.map(clean).filter(Boolean).map(normalizeClimateKey));
  const candidates = values.flatMap(textCandidates)
    .map(clean)
    .filter((value) => value && !blocked.has(normalizeClimateKey(value)));
  const unique = [];

  for (const candidate of candidates) {
    const key = normalizeClimateKey(candidate);
    if (!key || unique.some((value) => normalizeClimateKey(value) === key)) continue;
    unique.push(candidate);
  }

  return unique
    .filter((candidate, index, all) => !all.some((other, otherIndex) => (
      otherIndex !== index &&
      other.length > candidate.length &&
      normalizeClimateKey(other).includes(normalizeClimateKey(candidate))
    )))
    .slice(0, 2)
    .map(compactClimateSentenceGeneral)
    .join(' ');
}

function compactClimateSentenceGeneral(value) {
  let text = clean(value).replace(/\s+/g, ' ');
  text = text
    .replace(/\b(sin embargo|por su parte|adem\u00e1s)\b[,;:]?\s*/gi, '')
    .replace(/\bfuerte\s+/gi, '')
    .replace(/\bascenso de las temperaturas\b/gi, 'ascenso t\u00e9rmico')
    .replace(/\bvolver\u00e1 a registrar\b/gi, 'volver\u00e1 a tener')
    .replace(/\bma\u00f1ana muy fr\u00eda\b/gi, 'ma\u00f1ana fr\u00eda')
    .replace(/:\s*as\u00ed estar\u00e1\b.*$/i, '.')
    .replace(/^lluvias y fr(?:i|\u00ed)o marcan .* feriado.*$/i, 'Lluvias y fr\u00edo durante el feriado.')
    .replace(/\s+en pr\u00e1cticamente todo.*$/i, '')
    .replace(/,\s*(con|mientras|aunque|debido a)\b.*$/i, '')
    .replace(/^([^,]{2,40}),\s+(?=(volver\u00e1|tendr\u00e1|registrar\u00e1|mantendr\u00e1|continuar\u00e1))/i, '$1 ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function compactClimateSentence(value) {
  const text = clean(value);
  if (/^lluvias y fr[ií]o\b.*feriado/i.test(text)) return 'Lluvias y frío durante el feriado.';
  if (/^san rafael registra lluvias d[eé]biles/i.test(text)) return 'San Rafael registra lluvias débiles.';
  return text;
}

function textCandidates(value) {
  return clean(value)
    .split(/(?<=[.!?])\s+/)
    .map((text) => text.trim())
    .filter((text) => text.length >= 30);
}

function normalizeClimateKey(value) {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ã[^\x00-\x7F]?/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
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
