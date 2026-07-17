import { formatPowerLabel } from "@/lib/cart-utils";
import { resolveCrossPowerMeta } from "@/lib/cross-power";
import type { LensItem, LensType } from "@/lib/types/lens";
import { resolveWholesalePowerProfile } from "@/lib/wholesale-powers";

function formatPower(value: number): string {
  const fixed = value.toFixed(2).replace(/\.?0+$/, "");
  return value > 0 ? `+${fixed}` : fixed;
}

function hasPower(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && Math.abs(Number(value)) > 1e-9;
}

export function formatLensProductDetail(item: LensItem): string {
  const parts: string[] = [];
  const crossMeta = resolveCrossPowerMeta(item);

  if (item.coating?.trim()) {
    parts.push(item.coating.trim());
  }

  if (item.sph != null || item.cyl != null) {
    const sph = hasPower(item.sph) ? formatPower(Number(item.sph)) : "—";
    const cyl = hasPower(item.cyl) ? formatPower(Number(item.cyl)) : "—";
    parts.push(`${sph}/${cyl}`);
  } else if (crossMeta) {
    parts.push(`cross ${formatPower(crossMeta.maxCyl)}`);
  } else {
    parts.push("—/—");
  }

  if (item.axis !== null && item.axis !== undefined) {
    parts.push(`x ${item.axis}`);
  }

  if (hasPower(item.add)) {
    parts.push(`ADD ${formatPower(Number(item.add))}`);
  }

  if (item.index) {
    parts.push(`Index ${item.index}`);
  }

  return parts.join(" · ");
}

export const LENS_PRICE_PER_PAIR_LABEL = "/ pr";

function formatLensTypeAbbrev(lensType?: LensType | string | null): string {
  switch (lensType) {
    case "Kryptok":
      return "KT";
    case "Progressive":
      return "V2";
    case "Single Vision":
      return "SV";
    default:
      return "";
  }
}

function formatPowerProfileLabel(
  profile: ReturnType<typeof resolveWholesalePowerProfile>
): string {
  switch (profile) {
    case "compound":
      return "Comp";
    case "sph-only":
      return "sph";
    case "cyl-only":
      return "cyl";
    case "cross":
      return "cross";
  }
}

export function formatCrossPowerLabel(
  crossPower: number | null | undefined
): string {
  if (crossPower === null || crossPower === undefined) {
    return "—";
  }
  const value = Number(crossPower);
  if (!Number.isFinite(value)) {
    return "—";
  }
  const fixed = value.toFixed(2).replace(/\.?0+$/, "");
  return `cross ${value > 0 ? `+${fixed}` : fixed}`;
}

/** Shop / inventory product card detail, e.g. "HC Comp V2 +2.00/-1.00 x 180". */
export function formatLensProductCardDetail(item: {
  sph?: number | null;
  cyl?: number | null;
  crossPower?: number | null;
  axis?: number | null;
  coating?: string | null;
  lensType?: LensType | string | null;
}): string {
  const coating = item.coating?.trim() ?? "";
  const profileLabel = formatPowerProfileLabel(resolveWholesalePowerProfile(item));
  const lensAbbrev = formatLensTypeAbbrev(item.lensType);

  const powerPart = (item.sph != null || item.cyl != null)
    ? (() => {
        const sphPart = hasMeaningfulPower(item.sph)
          ? formatPowerLabel(item.sph!)
          : "—";
        const cylPart = hasMeaningfulPower(item.cyl)
          ? formatPowerLabel(item.cyl!)
          : "—";
        return `${sphPart}/${cylPart}`;
      })()
    : hasMeaningfulPower(item.crossPower)
      ? formatCrossPowerLabel(item.crossPower)
      : "—/—";

  const axisPart =
    item.axis !== null && item.axis !== undefined
      ? ` x ${formatAxisValue(item.axis)}`
      : "";

  return [coating, profileLabel, lensAbbrev, `${powerPart}${axisPart}`]
    .filter(Boolean)
    .join(" ");
}

function hasMeaningfulPower(value: number | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  return Math.abs(Number(value)) > 1e-9;
}

export function formatAddValue(add: number | null | undefined): string {
  if (add === null || add === undefined) {
    return "—";
  }
  return formatPowerLabel(Number(add));
}

export function formatAxisValue(axis: number | null | undefined): string {
  if (axis === null || axis === undefined) {
    return "—";
  }
  return String(axis);
}

export function formatAddAxisLabel(item: {
  add?: number | null;
  axis?: number | null;
}): string {
  return `ADD ${formatAddValue(item.add)} · AXIS ${formatAxisValue(item.axis)}`;
}

export function formatSphCylSlash(item: {
  sph?: number | null;
  cyl?: number | null;
  crossPower?: number | null;
}): string {
  // Cart / order lines always carry the selected SPH and CYL.
  // Prefer those over catalog crossPower (max CYL), so cross products
  // show both values like compound lines (e.g. +1.00/-1.25).
  if (item.sph != null || item.cyl != null) {
    const sphPart =
      item.sph != null ? formatPowerLabel(Number(item.sph)) : "—";
    const cylPart =
      item.cyl != null ? formatPowerLabel(Number(item.cyl)) : "—";
    return `${sphPart}/${cylPart}`;
  }

  const crossMeta = resolveCrossPowerMeta(item);
  if (crossMeta) {
    const value = Number(crossMeta.maxCyl);
    const fixed = value.toFixed(2).replace(/\.?0+$/, "");
    return `cross ${value > 0 ? `+${fixed}` : fixed}`;
  }

  return "—/—";
}

function isSpecialColorsItem(item: string | null | undefined): boolean {
  return item?.trim().replace(/\s+/g, " ").toLowerCase() === "special colors";
}

export function formatLensItemLabel(item: {
  item?: string | null;
  coating?: string | null;
}): string {
  const itemText = item.item?.trim() ?? "";
  const coatingText = item.coating?.trim() ?? "";

  if (isSpecialColorsItem(itemText)) {
    return coatingText || "Standard Lens";
  }

  return itemText || coatingText || "Standard Lens";
}

export function formatLensItemCoatingSummary(item: {
  item?: string | null;
  coating?: string | null;
}): string {
  const itemText = item.item?.trim() ?? "";
  const coatingText = item.coating?.trim() ?? "";

  if (isSpecialColorsItem(itemText)) {
    return coatingText || "Standard";
  }

  const parts = [itemText, coatingText].filter(Boolean);
  const unique = [...new Set(parts)];
  return unique.join(" · ") || "Standard";
}

export function isSameLensPower(
  a: {
    id?: string;
    sph?: number | null;
    cyl?: number | null;
    crossPower?: number | null;
  },
  b: {
    id?: string;
    sph?: number | null;
    cyl?: number | null;
    crossPower?: number | null;
  }
): boolean {
  if (a.id && b.id && a.id === b.id) {
    return true;
  }
  const crossA = a.crossPower ?? null;
  const crossB = b.crossPower ?? null;
  if (crossA !== null || crossB !== null) {
    return crossA === crossB;
  }
  const cylA = a.cyl ?? null;
  const cylB = b.cyl ?? null;
  return Number(a.sph) === Number(b.sph) && cylA === cylB;
}
