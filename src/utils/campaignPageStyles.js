// src/pages/dashboard/campaignPageStyles.js

// ── Allowed values ──
export const FONT_FAMILIES = [
  { value: "Inter", label: "Inter", stack: "'Inter', system-ui, sans-serif" },
  { value: "Poppins", label: "Poppins", stack: "'Poppins', system-ui, sans-serif" },
  { value: "Playfair Display", label: "Playfair", stack: "'Playfair Display', serif" },
  { value: "JetBrains Mono", label: "Mono", stack: "'JetBrains Mono', monospace" },
];

export const FONT_SIZES = [
  { value: "sm", label: "Small", className: "text-sm" },
  { value: "md", label: "Medium", className: "text-base" },
  { value: "lg", label: "Large", className: "text-lg" },
  { value: "xl", label: "XL", className: "text-xl" },
  { value: "2xl", label: "2XL", className: "text-2xl" },
  { value: "3xl", label: "3XL", className: "text-3xl" },
];

export const FONT_WEIGHTS = [
  { value: "normal", label: "Regular", className: "font-normal" },
  { value: "medium", label: "Medium", className: "font-medium" },
  { value: "semibold", label: "Semibold", className: "font-semibold" },
  { value: "bold", label: "Bold", className: "font-bold" },
];

export const TEXT_ALIGNS = [
  { value: "left", label: "Left", className: "text-left" },
  { value: "center", label: "Center", className: "text-center" },
  { value: "right", label: "Right", className: "text-right" },
];

export const COLOR_SWATCHES = [
  "#111827",
  "#6B7280",
  "#FFFFFF",
  "#F97316",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#FDE68A",
  "#F3F4F6",
];

// ── Defaults ──
export const DEFAULT_THEME = {
  primaryColor: "#F97316",
  bgColor: "#FFFFFF",
  textColor: "#111827",
  fontFamily: "Inter",
  baseFontSize: "md",
};

export function defaultBlockStyle(type) {
  const base = {
    textColor: null,
    bgColor: null,
    fontFamily: null,
    fontSize: null,
    fontWeight: null,
    textAlign: null,
  };
  switch (type) {
    case "Header":
      return { ...base, fontSize: "2xl", fontWeight: "bold" };
    case "Text":
      return { ...base, fontSize: "md" };
    case "Button":
      return { ...base, fontWeight: "semibold", textAlign: "center" };
    case "Footer":
      return { ...base, fontSize: "sm", textColor: "#6B7280", textAlign: "center" };
    default:
      return base;
  }
}

// ── Normalization ──
export function normalizeBlockStyle(style = {}) {
  const safe = {};
  const hex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

  if (style.textColor && hex.test(style.textColor)) safe.textColor = style.textColor;
  if (style.bgColor && hex.test(style.bgColor)) safe.bgColor = style.bgColor;
  if (FONT_FAMILIES.some((f) => f.value === style.fontFamily)) safe.fontFamily = style.fontFamily;
  if (FONT_SIZES.some((f) => f.value === style.fontSize)) safe.fontSize = style.fontSize;
  if (FONT_WEIGHTS.some((f) => f.value === style.fontWeight)) safe.fontWeight = style.fontWeight;
  if (TEXT_ALIGNS.some((f) => f.value === style.textAlign)) safe.textAlign = style.textAlign;

  return safe;
}

export function normalizeTheme(theme = {}) {
  const hex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  const safe = { ...DEFAULT_THEME };
  if (theme.primaryColor && hex.test(theme.primaryColor)) safe.primaryColor = theme.primaryColor;
  if (theme.bgColor && hex.test(theme.bgColor)) safe.bgColor = theme.bgColor;
  if (theme.textColor && hex.test(theme.textColor)) safe.textColor = theme.textColor;
  if (FONT_FAMILIES.some((f) => f.value === theme.fontFamily)) safe.fontFamily = theme.fontFamily;
  if (FONT_SIZES.some((f) => f.value === theme.baseFontSize)) safe.baseFontSize = theme.baseFontSize;
  return safe;
}

export function resolveStyle(theme, blockStyle) {
  const t = normalizeTheme(theme);
  const s = normalizeBlockStyle(blockStyle);
  return {
    textColor: s.textColor ?? t.textColor,
    bgColor: s.bgColor ?? null,
    fontFamily: s.fontFamily ?? t.fontFamily,
    fontSize: s.fontSize ?? t.baseFontSize,
    fontWeight: s.fontWeight ?? null,
    textAlign: s.textAlign ?? null,
  };
}

export function styleToCss(resolved) {
  const family =
    FONT_FAMILIES.find((f) => f.value === resolved.fontFamily)?.stack ||
    FONT_FAMILIES[0].stack;

  return {
    color: resolved.textColor,
    backgroundColor: resolved.bgColor || undefined,
    fontFamily: family,
  };
}

export function styleToClasses(resolved) {
  const size = FONT_SIZES.find((f) => f.value === resolved.fontSize)?.className || "";
  const weight = FONT_WEIGHTS.find((f) => f.value === resolved.fontWeight)?.className || "";
  const align = TEXT_ALIGNS.find((f) => f.value === resolved.textAlign)?.className || "";
  return [size, weight, align].filter(Boolean).join(" ");
}

// ══════════════════════════════════════════════════════════════════
// Social platforms
// ══════════════════════════════════════════════════════════════════
// The three socials the artist can add to a campaign. Rendered on the
// illegal-tap page ("Hold up, this belongs to X"). Artists fill in the
// full URL — this keeps the frontend simple (no handle → URL building).
export const SOCIAL_PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    brandColor: "#E1306C",
    placeholder: "https://instagram.com/yourhandle",
    // Basic sanity check — a URL that contains "instagram.com"
    validate: (url) => /instagram\.com/i.test(url),
  },
  {
    key: "youtube",
    label: "YouTube",
    brandColor: "#FF0000",
    placeholder: "https://youtube.com/@yourchannel",
    validate: (url) => /youtube\.com|youtu\.be/i.test(url),
  },
  {
    key: "spotify",
    label: "Spotify",
    brandColor: "#1DB954",
    placeholder: "https://open.spotify.com/artist/…",
    validate: (url) => /spotify\.com/i.test(url),
  },
];

export const EMPTY_SOCIALS = {
  instagram: "",
  youtube: "",
  spotify: "",
};

export function normalizeSocials(socials = {}) {
  const safe = { ...EMPTY_SOCIALS };
  for (const platform of SOCIAL_PLATFORMS) {
    const raw = socials?.[platform.key];
    if (typeof raw === "string" && raw.trim()) {
      safe[platform.key] = raw.trim();
    }
  }
  return safe;
}