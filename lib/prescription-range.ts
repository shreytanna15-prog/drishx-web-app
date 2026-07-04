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

function resolveProductCylRange(cylMax: number): PowerAxisRange {
  const max = roundQuarter(cylMax);
  const options = generatePowerOptions(0, max);
  return normalizePowerAxis({ min: 0, max, options });
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

function applyKryptokCompoundPickerRules(
  item: LensItem,
  range: SelectableRange
): SelectableRange {
  if (
    item.lensType !== "Kryptok" ||
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

function withPickerRules(item: LensItem, range: SelectableRange): SelectableRange {
  let next = range;
  if (range.cyl) {
    next = { ...next, cyl: applyCylPickerRules(item, range.cyl) };
  }
  return applyKryptokCompoundPickerRules(item, next);
}

function isSameProductLine(a: LensItem, b: LensItem): boolean {
  return (
    (a.brand ?? "") === (b.brand ?? "") &&
    (a.item ?? "") === (b.item ?? "") &&
    (a.coating ?? "") === (b.coating ?? "")
  );
}

function isMilderSphSibling(rowSph: number, lensSph: number): boolean {
  if (rowSph <= lensSph) {
    return false;
  }
  if (lensSph <= 0) {
    return rowSph <= 0;
  }
  return rowSph >= 0;
}

function resolveSphFloorFromSiblings(
  item: LensItem,
  siblings: LensItem[]
): number | null {
  if (siblings.length === 0) {
    return null;
  }

  const sphMax = roundQuarter(item.sph ?? 0);
  let nextTierSph: number | null = null;

  for (const row of siblings) {
    if (row.id === item.id) {
      continue;
    }
    if (!isSameProductLine(item, row)) {
      continue;
    }

    const rowSph = roundQuarter(row.sph ?? 0);
    if (!isMilderSphSibling(rowSph, sphMax)) {
      continue;
    }

    nextTierSph =
      nextTierSph === null ? rowSph : Math.min(nextTierSph, rowSph);
  }

  if (nextTierSph === null) {
    return null;
  }

  const sphFloor = roundQuarter(nextTierSph - POWER_STEP);
  if (sphFloor <= sphMax + 1e-9) {
    return null;
  }

  return sphFloor;
}

function applySphFloorToRange(
  range: SelectableRange,
  sphFloor: number,
  sphMax: number
): SelectableRange {
  const mergedFloor =
    range.sph.min === 0 ? sphFloor : Math.min(range.sph.min, sphFloor);
  const options = generatePowerOptions(mergedFloor, sphMax);

  if (options.length === 0) {
    return range;
  }

  return {
    ...range,
    sph: normalizePowerAxis({
      min: mergedFloor,
      max: sphMax,
      options,
    }),
  };
}

function applySphTierFromSiblings(
  range: SelectableRange,
  item: LensItem,
  siblings: LensItem[]
): SelectableRange {
  const sphMax = roundQuarter(item.sph ?? 0);
  const sphFloor = resolveSphFloorFromSiblings(item, siblings);
  if (sphFloor === null) {
    return range;
  }

  return applySphFloorToRange(range, sphFloor, sphMax);
}

function applyCylTierFromCheaperSiblings(
  range: SelectableRange,
  item: LensItem,
  siblings: LensItem[]
): SelectableRange {
  const lensCyl = item.cyl;
  if (lensCyl == null || !range.cyl || siblings.length === 0) {
    return range;
  }

  const itemPrice = Number(item.price);
  const lensSph = roundQuarter(item.sph ?? 0);
  const cylMax = roundQuarter(lensCyl);
  let floor: number | null = null;

  for (const row of siblings) {
    if (row.id === item.id) {
      continue;
    }
    if (!isSameProductLine(item, row)) {
      continue;
    }
    if (Number(row.price) >= itemPrice) {
      continue;
    }
    if (roundQuarter(row.sph ?? 0) !== lensSph) {
      continue;
    }
    if (row.cyl == null || row.cyl <= lensCyl) {
      continue;
    }

    const rowFloor = roundQuarter(row.cyl - POWER_STEP);
    floor = floor === null ? rowFloor : Math.max(floor, rowFloor);
  }

  if (floor === null || floor <= cylMax + 1e-9) {
    return range;
  }

  const mergedFloor =
    range.cyl.min === 0 ? floor : Math.max(range.cyl.min, floor);
  const options = generatePowerOptions(mergedFloor, cylMax);

  if (options.length === 0) {
    return range;
  }

  return {
    ...range,
    cyl: normalizePowerAxis({
      min: mergedFloor,
      max: cylMax,
      options,
    }),
  };
}

export function restrictSelectableRangeForCheaperSiblings(
  range: SelectableRange,
  item: LensItem,
  siblings: LensItem[]
): SelectableRange {
  let next = applySphTierFromSiblings(range, item, siblings);

  if (item.lensType === "Single Vision") {
    next = applyCylTierFromCheaperSiblings(next, item, siblings);
  }

  return next;
}

export function resolveSelectableRange(item: LensItem): SelectableRange {
  const crossMeta = resolveCrossPowerMeta(item);
  if (crossMeta) {
    const sphOptions = computeCrossSphOptions(crossMeta.maxCyl);
    const initialSph = sphOptions[0] ?? 0;
    const cylOptions = computeCrossCylOptionsForSph(initialSph, crossMeta.maxCyl);

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

  if (item.selectableRange?.sph.options.length) {
    return withPickerRules(item, normalizeSelectableRange(item.selectableRange));
  }

  const sphMin = 0;
  const sphMax = roundQuarter(item.sph ?? 0);
  const sphOptions = generatePowerOptions(sphMin, sphMax);

  if (item.cyl != null) {
    return withPickerRules(item, {
      sph: { min: sphMin, max: sphMax, options: sphOptions },
      cyl: resolveProductCylRange(item.cyl),
    });
  }

  return withPickerRules(item, {
    sph: { min: sphMin, max: sphMax, options: sphOptions },
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
  const options = computeCrossCylOptionsForSph(sph, meta.maxCyl);
  return {
    min: options[0] ?? 0,
    max: options[options.length - 1] ?? 0,
    options,
  };
}

/** Wholesale / catalog CYL bounds for cross products (negative only). */
export function resolveFullCrossCylRange(meta: CrossPowerRangeMeta): PowerAxisRange {
  const options = computeFullCrossCylOptions(meta.maxCyl);
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
