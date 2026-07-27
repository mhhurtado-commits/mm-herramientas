export const EDITORIAL_CONTRACT_VERSION = "1.0";

export function createEditorialEnvelope(article, diagnosis) {
  return {
    version: EDITORIAL_CONTRACT_VERSION,
    article: normalizeEditorialArticle(article),
    diagnosis: normalizeEditorialDiagnosis(diagnosis),
    outputs: {
      carousel: null,
      reel: createEmptyReelOutput()
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
  next.outputs.reel = normalizeReelOutput(reelOutput);
  return next;
}

export function createEmptyReelOutput() {
  return {
    format: "reel_silent",
    hook: "",
    cover_text: "",
    caption: "",
    hashtags: [],
    scenes: []
  };
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

function normalizeReelOutput(reelOutput) {
  var source = reelOutput || {};
  return {
    format: cleanText(source.format) || "reel_silent",
    hook: cleanText(source.hook),
    cover_text: cleanText(source.cover_text),
    caption: cleanText(source.caption),
    hashtags: Array.isArray(source.hashtags) ? source.hashtags.filter(Boolean) : [],
    scenes: normalizeReelScenes(source.scenes)
  };
}

function normalizeReelScenes(scenes) {
  if (!Array.isArray(scenes)) return [];
  return scenes.map(function (scene, index) {
    var source = scene || {};
    return {
      order: Number(source.order || index + 1) || index + 1,
      duration_ms: Number(source.duration_ms || 0) || 0,
      visual_type: cleanText(source.visual_type),
      visual_source: cleanText(source.visual_source),
      visual_role: cleanText(source.visual_role),
      layout: cleanText(source.layout),
      text: cleanText(source.text),
      subtitle: cleanText(source.subtitle),
      items: normalizeReelItems(source.items)
    };
  });
}

function normalizeReelItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map(function (item) {
      if (typeof item === "string") {
        return { label: "", text: cleanText(item) };
      }
      var source = item || {};
      return {
        label: cleanText(source.label),
        text: cleanText(source.text || source.value)
      };
    })
    .filter(function (item) {
      return item.text;
    })
    .slice(0, 5);
}

function cleanText(value) {
  return String(value || "").trim();
}
