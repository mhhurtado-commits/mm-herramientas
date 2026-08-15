var BASE_THEME = {
  name: "mm_classic",
  colors: {
    background: "#fcfaf6",
    panel: "#f4f1ea",
    surface: "#ffffff",
    surfaceSoft: "#f8f6f1",
    surfaceInk: "#1b1e22",
    textPrimary: "#111111",
    textSecondary: "#353535",
    textMuted: "#666666",
    gray555: "#555555",
    grayLight: "#f5f5f5",
    lineSoft: "#ded8cd",
    accent: "#a6ce39",
    accentDark: "#7ca41f",
    accentSoft: "#edf6ce",
    corporateGreen: "#a6ce39",
    overlay: "rgba(0,0,0,0.65)",
    overlay75: "rgba(0,0,0,0.78)",
    transparent: "rgba(0,0,0,0)",
    footer: "#9f9f9f",
    white: "#ffffff",
    logoBadge: "rgba(255,255,255,0.94)",
    whiteOverlay: "rgba(255,255,255,0.16)",
    brandLine: "rgba(166,206,57,0.38)",
    accentBarEnd: "#d9eb97",
    coverPanelStroke: "rgba(222,216,205,0.86)",
    endBackground: "#eef5d6",
    endFrame: "rgba(166,206,57,0.36)",
    endPanelStroke: "rgba(166,206,57,0.28)",
    endCtaFill: "#1b1e22",
    endCtaText: "#ffffff"
  },
  fonts: {
    title: "700 52px Inter, Arial, sans-serif",
    titleCompact: "700 58px Inter, Arial, sans-serif",
    subtitle: "500 28px Inter, Arial, sans-serif",
    body: "35px Inter, Arial, sans-serif",
    list: "34px Inter, Arial, sans-serif",
    bodyLarge: "400 42px Inter, Arial, sans-serif",
    bodyXL: "400 46px Inter, Arial, sans-serif",
    footer: "600 21px Inter, Arial, sans-serif",
    category: "700 22px Inter, Arial, sans-serif",
    coverTitle: "700 84px Inter, Arial, sans-serif",
    coverSubtitle: "30px Inter, Arial, sans-serif",
    kicker: "700 22px Inter, Arial, sans-serif",
    statNumber: "700 22px Inter, Arial, sans-serif",
    endKicker: "700 24px Inter, Arial, sans-serif",
    endTitle: "700 56px Inter, Arial, sans-serif",
    giantNumber: "700 180px Inter, Arial, sans-serif",
    quote: "700 88px Georgia, serif",
    highlight: "700 40px Inter, Arial, sans-serif",
    cta: "700 60px Inter, Arial, sans-serif",
    endUrl: "700 54px Inter, Arial, sans-serif"
  },
  spacing: {
    paddingX: 58,
    paddingY: 60,
    lineHTitle: 56,
    lineHSubtitle: 40,
    lineHBody: 44,
    lineHList: 38,
    footerH: 50,
    coverLineHTitle: 76,
    coverLineHSubtitle: 42,
    paddingCover: 64,
    cardPadding: 24,
    cardGap: 22,
    frame: 34,
    accentBarH: 24
  },
  radius: {
    canvas: 16,
    small: 8,
    badge: 999,
    card: 24,
    panel: 38
  },
  variant: {
    coverLogoWidth: 264,
    coverLogoBadgeW: 364,
    coverLogoBadgeH: 116,
    coverLogoY: 96,
    coverTitleY: 824,
    coverPanelY: 760,
    coverLogoBadgeVisible: false,
    footerLogoWidth: 182,
    footerInset: 54,
    footerY: 88,
    footerLineGap: 22,
    coverSwipeWidth: 170,
    coverSwipeHeight: 46,
    categoryOnCover: false,
    categoryInText: false,
    statsCardFill: "#ffffff",
    textPanelFill: "#f4f1ea",
    showQuoteMark: true,
    showEyebrow: false,
    leftAccentHeight: 284,
    bodyOffsetY: 38,
    textWidthOffset: 10,
    statsCardStyle: "cards",
    endUrlLabel: "mediamendoza.com"
  }
};

var SECTION_FAMILIES = {
  general: { label: "Actualidad", accent: "#a6ce39", dark: "#16201b", soft: "#eaf3de" },
  efemerides: { label: "Efemérides", accent: "#8fb62e", dark: "#20301c", soft: "#eef5d6" },
  clima: { label: "Clima", accent: "#367d9c", dark: "#16303b", soft: "#dcedf3" },
  policiales: { label: "Policiales", accent: "#ba3f42", dark: "#421c1e", soft: "#f8dddd" },
  sociales: { label: "Sociedad", accent: "#b36b27", dark: "#422715", soft: "#f8ead7" },
  politica: { label: "Política", accent: "#5b4c91", dark: "#251e42", soft: "#e9e4f7" },
  economia: { label: "Economía", accent: "#507118", dark: "#213009", soft: "#eaf3de" },
  deportes: { label: "Deportes", accent: "#16806a", dark: "#103c33", soft: "#d9f1eb" }
};

var THEME_VARIANTS = {
  mm_classic: {},
  mm_efemerides: {
    name: "mm_efemerides",
    colors: {
      background: "#f7f8f1",
      panel: "#ffffff",
      surface: "#ffffff",
      surfaceSoft: "#f1f5e6",
      textPrimary: "#142019",
      textSecondary: "#435149",
      textMuted: "#68756b",
      lineSoft: "#dbe5ca",
      accent: "#8fb62e",
      accentSoft: "#eef5d6",
      brandLine: "rgba(143,182,46,0.42)",
      coverPanelStroke: "rgba(143,182,46,0.28)",
      endBackground: "#20301c",
      endFrame: "rgba(143,182,46,0.42)",
      endPanelStroke: "rgba(143,182,46,0.28)",
      endCtaFill: "#a6ce39",
      endCtaText: "#16201b"
    },
    variant: {
      categoryOnCover: false,
      categoryInText: true,
      showQuoteMark: false,
      showEyebrow: true,
      textPanelFill: "#f1f5e6",
      statsCardFill: "#f8fbf0",
      endUrlLabel: "MEDIAMENDOZA.COM"
    }
  },
  mm_editorial: {
    name: "mm_editorial",
    colors: {
      background: "#f8f6f1",
      panel: "#ffffff",
      surface: "#ffffff",
      surfaceSoft: "#f4f1ea",
      textPrimary: "#111111",
      accent: "#a6ce39",
      accentSoft: "#edf6ce"
    },
    safe: {
      logoInset: 64,
      footerHeight: 92
    }
  },
  mm_briefing: {
    colors: {
      background: "#f7f8f4",
      panel: "#f2f4ee",
      surface: "#ffffff",
      surfaceSoft: "#f6f8f2",
      textSecondary: "#2f3a33",
      textMuted: "#627067",
      lineSoft: "#d7dfcf",
      accentSoft: "#eef5d9",
      brandLine: "rgba(166,206,57,0.48)",
      accentBarEnd: "#eef6c7",
      coverPanelStroke: "rgba(166,206,57,0.22)",
      endBackground: "#f3f7e8",
      endFrame: "rgba(166,206,57,0.30)",
      endPanelStroke: "rgba(166,206,57,0.24)",
      endCtaFill: "#ffffff",
      endCtaText: "#1b1e22"
    },
    fonts: {
      titleCompact: "700 64px Inter, Arial, sans-serif",
      bodyXL: "400 50px Inter, Arial, sans-serif",
      list: "34px Inter, Arial, sans-serif",
      endTitle: "700 60px Inter, Arial, sans-serif"
    },
    spacing: {
      lineHTitle: 60,
      lineHBody: 48,
      lineHList: 40
    },
    variant: {
      coverLogoWidth: 286,
      coverLogoBadgeW: 388,
      coverLogoBadgeH: 126,
      coverPanelY: 736,
      coverLogoBadgeVisible: false,
      footerLogoWidth: 206,
      footerInset: 88,
      footerLineGap: 30,
      categoryOnCover: false,
      categoryInText: false,
      statsCardFill: "#fdfefe",
      textPanelFill: "#ffffff",
      showQuoteMark: false,
      showEyebrow: true,
      leftAccentHeight: 0,
      bodyOffsetY: 18,
      textWidthOffset: 0,
      statsCardStyle: "rows",
      endUrlLabel: "LEER EN MEDIAMENDOZA.COM"
    }
  },
  mm_impact: {
    colors: {
      background: "#f6f4ef",
      panel: "#efe9de",
      surface: "#fffdf9",
      surfaceSoft: "#f6f0e6",
      textPrimary: "#0f1211",
      textSecondary: "#2f302d",
      textMuted: "#5d625d",
      lineSoft: "#d8cebc",
      accent: "#9fcf22",
      accentDark: "#6d9710",
      accentSoft: "#edf6ce",
      brandLine: "rgba(159,207,34,0.52)",
      accentBarEnd: "#f0f7b7",
      logoBadge: "rgba(255,255,255,0.90)",
      coverPanelStroke: "rgba(207,198,180,0.90)",
      endBackground: "#e5efbf",
      endFrame: "rgba(109,151,16,0.38)",
      endPanelStroke: "rgba(109,151,16,0.24)",
      endCtaFill: "#17191c",
      endCtaText: "#ffffff"
    },
    fonts: {
      titleCompact: "700 68px Inter, Arial, sans-serif",
      coverTitle: "700 90px Inter, Arial, sans-serif",
      bodyXL: "400 52px Inter, Arial, sans-serif",
      list: "35px Inter, Arial, sans-serif",
      giantNumber: "700 196px Inter, Arial, sans-serif",
      endTitle: "700 62px Inter, Arial, sans-serif"
    },
    spacing: {
      lineHTitle: 62,
      lineHBody: 50,
      lineHList: 42
    },
    variant: {
      coverLogoWidth: 304,
      coverLogoBadgeW: 408,
      coverLogoBadgeH: 122,
      coverLogoY: 88,
      coverTitleY: 850,
      coverPanelY: 730,
      coverLogoBadgeVisible: false,
      footerLogoWidth: 214,
      footerInset: 82,
      footerLineGap: 28,
      coverSwipeWidth: 182,
      coverSwipeHeight: 50,
      categoryOnCover: false,
      categoryInText: false,
      statsCardFill: "#f8f4ea",
      textPanelFill: "#f6f0e6",
      showQuoteMark: true,
      showEyebrow: true,
      leftAccentHeight: 392,
      bodyOffsetY: 34,
      textWidthOffset: 48,
      statsCardStyle: "impact",
      endUrlLabel: "MEDIAMENDOZA.COM"
    }
  }
};

export var MMTheme = cloneTheme(BASE_THEME);

export function applyThemeVariant(themeName) {
  var nextTheme = mergeTheme(BASE_THEME, THEME_VARIANTS[themeName] || {});
  Object.assign(MMTheme, nextTheme);
  return MMTheme;
}

export function getAvailableCarouselTemplates() {
  return Object.keys(THEME_VARIANTS);
}

export function resolveCarouselTheme(project, slide) {
  var requestedTheme = (slide && slide.style && slide.style.theme) ||
    (project && (project.carouselTheme || project.theme)) ||
    "mm_editorial";
  var theme = mergeTheme(BASE_THEME, THEME_VARIANTS[requestedTheme] || THEME_VARIANTS.mm_editorial);
  var sectionAccent = (slide && slide.style && slide.style.accent) ||
    (project && (project.sectionAccent || project.accent));

  var vertical = (slide && slide.style && slide.style.vertical) ||
    (project && project.editorialDiagnosis && project.editorialDiagnosis.vertical) ||
    (project && project.editorialPlan && project.editorialPlan.diagnosis && project.editorialPlan.diagnosis.vertical) ||
    inferSectionFromCategory(project && project.article && project.article.category);
  var family = SECTION_FAMILIES[vertical] || SECTION_FAMILIES.general;
  theme.sectionLabel = family.label;
  theme.sectionVertical = vertical;
  theme.colors.accent = family.accent;
  theme.colors.accentDark = family.dark;
  theme.colors.accentSoft = family.soft;
  theme.colors.endBackground = family.dark;
  theme.colors.endCtaFill = family.accent;
  theme.colors.endCtaText = getReadableTextColor(family.accent);

  if (sectionAccent) {
    theme.colors.accent = sectionAccent;
  }

  return theme;
}

export function getReadableTextColor(background) {
  var hex = String(background || '').replace('#', '');
  if (hex.length !== 6) return '#1b1e22';
  var red = parseInt(hex.slice(0, 2), 16) / 255;
  var green = parseInt(hex.slice(2, 4), 16) / 255;
  var blue = parseInt(hex.slice(4, 6), 16) / 255;
  var luminance = [red, green, blue].map(function (channel) {
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  var relativeLuminance = 0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2];
  return relativeLuminance > 0.46 ? '#1b1e22' : '#ffffff';
}

export function resolveSectionFamily(vertical) {
  return SECTION_FAMILIES[vertical] || SECTION_FAMILIES.general;
}

function inferSectionFromCategory(value) {
  var normalized = String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalized.includes("policial") || normalized.includes("seguridad")) return "policiales";
  if (normalized.includes("clima") || normalized.includes("meteor")) return "clima";
  if (normalized.includes("social") || normalized.includes("sociedad")) return "sociales";
  if (normalized.includes("polit")) return "politica";
  if (normalized.includes("econom")) return "economia";
  if (normalized.includes("deport")) return "deportes";
  return "general";
}

function cloneTheme(theme) {
  return JSON.parse(JSON.stringify(theme));
}

function mergeTheme(base, override) {
  var merged = cloneTheme(base);
  if (!override) return merged;

  if (override.colors) Object.assign(merged.colors, override.colors);
  if (override.fonts) Object.assign(merged.fonts, override.fonts);
  if (override.spacing) Object.assign(merged.spacing, override.spacing);
  if (override.radius) Object.assign(merged.radius, override.radius);
  if (override.variant) Object.assign(merged.variant, override.variant);

  for (var key in override) {
    if (key !== "colors" && key !== "fonts" && key !== "spacing" && key !== "radius" && key !== "variant") {
      merged[key] = override[key];
    }
  }

  merged.name = override.name || base.name;
  return merged;
}
