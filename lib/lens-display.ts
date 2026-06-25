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
