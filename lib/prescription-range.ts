import {
  computeCrossCylOptionsForSph,
  computeCrossSphOptions,
  computeFullCrossCylOptions,
  resolveCrossPowerMeta,
  type CrossPowerRangeMeta,
} from "@/lib/cross-power";
import type { LensItem, PowerAxisRange, SelectableRange } from "@/lib/types/lens";
import { resolveWholesalePowerProfile } from "@/lib/wholesale-powers";

const POWER_STEP = 0.25;

function roundQuarter(value: number): number {
  return Math.round(value / POWER_STEP) * POWER_STEP;
}

export function generatePowerOptions(from: number, to: number): number[] {
  const a = roundQuarter(from);
  const b = roundQuarter(to);
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  const options: number[] = [];

  const isNegativeRange = high <= 0 || (low < 0 && high > 0);

  if (isNegativeRange) {
    let current = high;
    while (current >= low - POWER_STEP / 2) {
      options.push(roundQuarter(current));
      if (current <= low + POWER_STEP / 2) {
        break;
      }
      current = roundQuarter(current - POWER_STEP);
    }
    return options;
  }

  let current = low;
  while (current <= high + POWER_STEP / 2) {
    options.push(roundQuarter(current));
    if (current >= high - POWER_STEP / 2) {
      break;
    }
    current = roundQuarter(current + POWER_STEP);
  }
  return options;
}

export function orderPowerOptions(options: number[]): number[] {
  if (options.length <= 1) {
    return options;
  }
  const sorted = [...options].map(roundQuarter).sort((x, y) => x - y);
  const low = sorted[0]!;
  const high = sorted[sorted.length - 1]!;
  const isNegativeRange = high <= 0 || (low < 0 && high > 0);
  return isNegativeRange ? [...sorted].reverse() : sorted;
}

function normalizePowerAxis(axis: PowerAxisRange): PowerAxisRange {
  const options = orderPowerOptions(axis.options);
  if (options.length === 0) {
    return axis;
  }
  const low = Math.min(...options);
  const high = Math.max(...options);
  return { min: low, max: high, options };
}

function normalizeSelectableRange(range: SelectableRange): SelectableRange {
  return {
    sph: normalizePowerAxis({
      ...range.sph,
      options: orderPowerOptions(range.sph.options),
    }),
    cyl: range.cyl
      ? normalizePowerAxis({
          ...range.cyl,
          options: orderPowerOptions(range.cyl.options),
        })
      : null,
  };
}

function resolveAxisStart(value: number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return roundQuarter(value);
}

function resolveProductPowerRange(
  start: number | null | undefined,
  end: number | null | undefined
): PowerAxisRange | null {
  if (end === null || end === undefined) {
    return null;
  }
  const min = resolveAxisStart(start);
  const max = roundQuarter(end);
  const options = generatePowerOptions(min, max);
  return normalizePowerAxis({ min, max, options });
}

export function dropZeroFromPowerOptions(options: number[]): number[] {
  const withoutZero = options.filter((value) => Math.abs(value) > 1e-9);
  return withoutZero.length > 0 ? withoutZero : options;
}

function applyPowerAxisNoPlano(axis: PowerAxisRange): PowerAxisRange {
  const options = dropZeroFromPowerOptions(axis.options);
  return normalizePowerAxis({
    min: axis.min,
    max: axis.max,
    options,
  });
}

function applyCylPickerRules(
  item: LensItem,
  cylRange: PowerAxisRange
): PowerAxisRange {
  const isBifocalLens =
    item.lensType === "Kryptok" || item.lensType === "Progressive";
  if (!isBifocalLens || resolveWholesalePowerProfile(item) !== "cyl-only") {
    return cylRange;
  }

  return applyPowerAxisNoPlano(cylRange);
}

function applyCompoundPickerRules(
  item: LensItem,
  range: SelectableRange
): SelectableRange {
  if (
    (item.lensType !== "Kryptok" && item.lensType !== "Progressive") ||
    resolveWholesalePowerProfile(item) !== "compound"
  ) {
    return range;
  }

  const next: SelectableRange = {
    ...range,
    sph: applyPowerAxisNoPlano(range.sph),
  };

  if (range.cyl) {
    next.cyl = applyPowerAxisNoPlano(range.cyl);
  }

  return next;
}

function isCompoundBifocalLens(item: LensItem): boolean {
  if (item.lensType !== "Kryptok" && item.lensType !== "Progressive") {
    return false;
  }
  return resolveWholesalePowerProfile(item) === "compound";
}

function withPickerRules(item: LensItem, range: SelectableRange): SelectableRange {
  let next = range;
  if (range.cyl) {
    next = { ...next, cyl: applyCylPickerRules(item, range.cyl) };
  }
  return applyCompoundPickerRules(item, next);
}

export function resolveSelectableRange(item: LensItem): SelectableRange {
  const crossMeta = resolveCrossPowerMeta(item);
  if (crossMeta) {
    const sphOptions = computeCrossSphOptions(crossMeta.maxCyl);
    const initialSph = sphOptions[0] ?? 0;
    const cylOptions = computeCrossCylOptionsForSph(
      initialSph,
      crossMeta.maxCyl,
      crossMeta.cylStartRange
    );

    return {
      sph: {
        min: sphOptions[0] ?? 0,
        max: sphOptions[sphOptions.length - 1] ?? 0,
        options: sphOptions,
      },
      cyl: cylOptions.length
        ? {
            min: cylOptions[0]!,
            max: cylOptions[cylOptions.length - 1]!,
            options: cylOptions,
          }
        : null,
      crossPower: crossMeta,
    };
  }

  if (isCompoundBifocalLens(item)) {
    const sphRange = resolveProductPowerRange(item.sphStartRange, item.sph);
    const cylRange = resolveProductPowerRange(item.cylStartRange, item.cyl);
    if (sphRange) {
      return withPickerRules(item, {
        sph: sphRange,
        cyl: cylRange,
      });
    }
  }

  if (item.selectableRange?.sph.options.length) {
    return withPickerRules(item, normalizeSelectableRange(item.selectableRange));
  }

  const sphRange = resolveProductPowerRange(item.sphStartRange, item.sph);
  const cylRange = resolveProductPowerRange(item.cylStartRange, item.cyl);

  if (sphRange) {
    return withPickerRules(item, {
      sph: sphRange,
      cyl: cylRange,
    });
  }

  return withPickerRules(item, {
    sph: { min: 0, max: 0, options: [0] },
    cyl: null,
  });
}

/** Full positive SPH scroll range for cross products. */
export function resolveCrossSphRangeForMax(meta: CrossPowerRangeMeta): PowerAxisRange {
  const options = computeCrossSphOptions(meta.maxCyl);
  return {
    min: options[0] ?? 0,
    max: options[options.length - 1] ?? 0,
    options,
  };
}

/** CYL scroll options for the selected SPH on cross products. */
export function resolveCrossCylRangeForSph(
  sph: number,
  meta: CrossPowerRangeMeta
): PowerAxisRange {
  const options = computeCrossCylOptionsForSph(sph, meta.maxCyl, meta.cylStartRange);
  return {
    min: options[0] ?? 0,
    max: options[options.length - 1] ?? 0,
    options,
  };
}

/** Wholesale / catalog CYL bounds for cross products (negative only). */
export function resolveFullCrossCylRange(meta: CrossPowerRangeMeta): PowerAxisRange {
  const options = computeFullCrossCylOptions(meta.maxCyl, meta.cylStartRange);
  return {
    min: options[0] ?? 0,
    max: options[options.length - 1] ?? 0,
    options,
  };
}

/** Kryptok / Progressive ADD scroll options (+1.00 → +3.00 in 0.25 steps). */
export function resolveAddOptions(
  _item?: Pick<LensItem, "add"> | null
): number[] {
  return generatePowerOptions(1, 3);
}
