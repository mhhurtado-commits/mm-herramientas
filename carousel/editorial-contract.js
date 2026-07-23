export const EDITORIAL_CONTRACT_VERSION = "1.0";

export function createEditorialEnvelope(article, diagnosis) {
  return {
    version: EDITORIAL_CONTRACT_VERSION,
    article: normalizeEditorialArticle(article),
    diagnosis: normalizeEditorialDiagnosis(diagnosis),
    outputs: {
      carousel: null,
      reel: null
    }
  };
}

export function attachCarouselOutput(envelope, carouselPlan, socialCopy) {
  var next = envelope || createEditorialEnvelope();
  next.outputs.carousel = {
    cover: carouselPlan && carouselPlan.cover ? carouselPlan.cover : null,
    slides: carouselPlan && Array.isArray(carouselPlan.slides) ? carouselPlan.slides : [],
    caption: socialCopy && socialCopy.caption ? socialCopy.caption : "",
    hashtags: socialCopy && Array.isArray(socialCopy.hashtags) ? socialCopy.hashtags.filter(Boolean) : []
  };
  return next;
}

export function attachReelOutput(envelope, reelOutput) {
  var next = envelope || createEditorialEnvelope();
  next.outputs.reel = reelOutput || null;
  return next;
}

function normalizeEditorialArticle(article) {
  var source = article || {};
  return {
    url: cleanText(source.url),
    title: cleanText(source.title),
    category: cleanText(source.category),
    summary: cleanText(source.summary),
    image: cleanText(source.image),
    images: Array.isArray(source.images) ? source.images.filter(Boolean) : [],
    content: cleanText(source.content)
  };
}

function normalizeEditorialDiagnosis(diagnosis) {
  var source = diagnosis || {};
  return {
    news_type: cleanText(source.news_type),
    vertical: cleanText(source.vertical),
    complexity: cleanText(source.complexity),
    tone: cleanText(source.tone),
    carousel_type: cleanText(source.carousel_type),
    template: cleanText(source.template),
    slide_count: Number(source.slide_count || 0) || 0,
    reason: cleanText(source.reason)
  };
}

function cleanText(value) {
  return String(value || "").trim();
}
