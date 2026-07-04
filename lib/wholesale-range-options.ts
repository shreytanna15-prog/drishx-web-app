import { resolveCrossPowerMeta } from "@/lib/cross-power";
import {
  resolveAddOptions,
  resolveFullCrossCylRange,
  resolveSelectableRange,
} from "@/lib/prescription-range";
import type { LensItem } from "@/lib/types/lens";

/** Step size options for wholesale grid generation. */
export const WHOLESALE_STEP_OPTIONS = [0.25, 0.5, 0.75, 1] as const;

export type WholesaleBoundOptions = {
  sph: number[];
  cyl: number[];
  add: number[];
};

/** Scroll bounds for wholesale range pickers, derived from the product card range. */
export function resolveWholesaleBoundOptions(
  item: LensItem
): WholesaleBoundOptions {
  const range = resolveSelectableRange(item);
  const crossMeta = resolveCrossPowerMeta(item);
  const cylOptions = crossMeta
    ? resolveFullCrossCylRange(crossMeta).options
    : (range.cyl?.options ?? []);

  return {
    sph: range.sph.options,
    cyl: cylOptions,
    add: resolveAddOptions(item),
  };
}

/** Default from/to endpoints using the full product range (first → last scroll option). */
export function getDefaultRangeEndpoints(options: number[]): {
  from: number;
  to: number;
} {
  if (options.length === 0) {
    return { from: 0, to: 0 };
  }
  return { from: options[0]!, to: options[options.length - 1]! };
}
