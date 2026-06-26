import { formatPowerLabel } from "@/lib/cart-utils";
import type { LensItem } from "@/lib/types/lens";

function formatPower(value: number): string {
  const fixed = value.toFixed(2).replace(/\.?0+$/, "");
  return value > 0 ? `+${fixed}` : fixed;
}

function hasPower(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && Math.abs(Number(value)) > 1e-9;
}

export function formatLensProductDetail(item: LensItem): string {
  const parts: string[] = [];

  if (item.coating?.trim()) {
    parts.push(item.coating.trim());
  }

  if (hasPower(item.crossPower)) {
    parts.push(`cross ${formatPower(Number(item.crossPower))}`);
  } else {
    const sph = hasPower(item.sph) ? formatPower(Number(item.sph)) : "—";
    const cyl = hasPower(item.cyl) ? formatPower(Number(item.cyl)) : "—";
    parts.push(`${sph}/${cyl}`);
  }

  if (item.axis !== null && item.axis !== undefined) {
    parts.push(`x ${item.axis}`);
  }

  if (hasPower(item.add)) {
    parts.push(`ADD ${formatPower(Number(item.add))}`);
  }

  if (item.eye?.trim()) {
    parts.push(item.eye.trim());
  }

  if (item.index) {
    parts.push(`Index ${item.index}`);
  }

  return parts.join(" · ");
}

export const LENS_PRICE_PER_PAIR_LABEL = "/ pr";

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
  if (hasMeaningfulPower(item.crossPower)) {
    const value = Number(item.crossPower);
    const fixed = value.toFixed(2).replace(/\.?0+$/, "");
    return `cross ${value > 0 ? `+${fixed}` : fixed}`;
  }
  const sphPart = hasMeaningfulPower(item.sph)
    ? formatPowerLabel(item.sph!)
    : "—";
  const cylPart =
    item.cyl != null && hasMeaningfulPower(item.cyl)
      ? formatPowerLabel(item.cyl)
      : "—";
  return `${sphPart}/${cylPart}`;
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
