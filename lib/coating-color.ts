/**
 * Color dots for coating filter chips and product cards.
 * More specific names (LR Green, Clik) are matched before generic color words.
 */
const COATING_COLOR_RULES: Array<{ test: (value: string) => boolean; color: string }> = [
  { test: (v) => /\blr\s*green\b/.test(v), color: "#14B8A6" },
  { test: (v) => /\bclik\b/.test(v), color: "#7C3AED" },
  { test: (v) => /\b(violet|purple)\b/.test(v), color: "#9333EA" },
  { test: (v) => /\bgreen\b/.test(v), color: "#16A34A" },
  { test: (v) => /\bblue\b/.test(v), color: "#2563EB" },
  { test: (v) => /\bbrown\b/.test(v), color: "#B45309" },
  { test: (v) => /\b(grey|gray)\b/.test(v), color: "#6B7280" },
  { test: (v) => /\byellow\b/.test(v), color: "#EAB308" },
  { test: (v) => /\borange\b/.test(v), color: "#EA580C" },
  { test: (v) => /\b(pink|rose)\b/.test(v), color: "#DB2777" },
  { test: (v) => /\bred\b/.test(v), color: "#DC2626" },
  { test: (v) => /\bgold\b/.test(v), color: "#D4A017" },
];

const FALLBACK_PALETTE = [
  "#6366F1",
  "#0EA5E9",
  "#F59E0B",
  "#10B981",
  "#F43F5E",
  "#8B5CF6",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getCoatingDotColor(
  coating: string | null | undefined
): string | null {
  const normalized = coating?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
  if (!normalized) return null;

  const matched = COATING_COLOR_RULES.find((rule) => rule.test(normalized));
  if (matched) return matched.color;

  return FALLBACK_PALETTE[hashString(normalized) % FALLBACK_PALETTE.length];
}
