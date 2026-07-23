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
    footerLogoWidth: 182,
    footerInset: 54,
    footerY: 88,
    footerLineGap: 22,
    coverSwipeWidth: 170,
    coverSwipeHeight: 46,
    categoryOnCover: true,
    categoryInText: true,
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

var THEME_VARIANTS = {
  mm_classic: {},
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
      footerLogoWidth: 214,
      footerInset: 82,
      footerLineGap: 28,
      coverSwipeWidth: 182,
      coverSwipeHeight: 50,
      categoryOnCover: true,
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
