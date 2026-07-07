export const CROSS_MIN_GAP = 0.25;
const POWER_STEP = 0.25;
const POWER_EPS = 1e-9;

function toPower(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundQuarter(value: number): number {
  return Math.round(value / POWER_STEP) * POWER_STEP;
}

function generatePowerOptions(from: number, to: number): number[] {
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

export type CrossPowerRangeMeta = {
  maxCyl: number;
  cylStartRange?: number | null;
};

function resolveCylStartRange(value: unknown | null | undefined): number | null {
  const parsed = toPower(value);
  if (parsed === null || parsed >= -POWER_EPS) {
    return null;
  }
  return roundQuarter(parsed);
}

/** Upper CYL bound (least negative) for full catalog scroll. */
function resolveCrossCylCatalogUpper(cylStartRange?: number | null): number {
  const start = resolveCylStartRange(cylStartRange);
  return start ?? -CROSS_MIN_GAP;
}

/** Upper CYL bound for a selected SPH, respecting DB cylStartRange. */
function resolveCrossCylUpperForSph(
  sph: number,
  cylStartRange?: number | null
): number {
  const roundedSph = roundQuarter(sph);
  const sphUpper = roundQuarter(-(roundedSph + CROSS_MIN_GAP));
  const start = resolveCylStartRange(cylStartRange);
  if (start === null) {
    return sphUpper;
  }
  return Math.min(sphUpper, start);
}

function deriveCrossPowerFromPrescription(item: {
  sph?: unknown | null;
  cyl?: unknown | null;
}): number | null {
  const sph = toPower(item.sph);
  const cyl = toPower(item.cyl);
  if (sph === null || cyl === null) {
    return null;
  }

  const roundedSph = roundQuarter(sph);
  const roundedCyl = roundQuarter(cyl);
  if (
    roundedSph < CROSS_MIN_GAP - POWER_EPS ||
    roundedCyl >= -POWER_EPS ||
    Math.abs(roundedCyl) - roundedSph < CROSS_MIN_GAP - POWER_EPS
  ) {
    return null;
  }

  return roundedCyl;
}

export function hasCrossPower(item: {
  crossPower?: unknown | null;
  sph?: unknown | null;
  cyl?: unknown | null;
}): boolean {
  const crossPower = toPower(item.crossPower);
  if (crossPower !== null && Math.abs(crossPower) > POWER_EPS) {
    return true;
  }
  return deriveCrossPowerFromPrescription(item) !== null;
}

export function resolveCrossPowerMeta(item: {
  crossPower?: unknown | null;
  sph?: unknown | null;
  cyl?: unknown | null;
  cylStartRange?: unknown | null;
  selectableRange?: { crossPower?: CrossPowerRangeMeta | null } | null;
}): CrossPowerRangeMeta | null {
  if (item.selectableRange?.crossPower) {
    return item.selectableRange.crossPower;
  }

  const maxCyl = toPower(item.crossPower) ?? deriveCrossPowerFromPrescription(item);
  if (maxCyl === null || Math.abs(maxCyl) <= POWER_EPS) {
    return null;
  }

  return {
    maxCyl: roundQuarter(maxCyl),
    cylStartRange: resolveCylStartRange(item.cylStartRange),
  };
}

/** Negative CYL catalog bound for cross products, from cylStartRange (or −0.25) → maxCyl. */
export function computeCrossCylOptions(
  maxCyl: number,
  cylStartRange?: number | null
): number[] {
  const cylMax = roundQuarter(maxCyl);
  if (cylMax >= -POWER_EPS) {
    return [];
  }
  const cylUpper = resolveCrossCylCatalogUpper(cylStartRange);
  if (cylUpper < cylMax - POWER_EPS) {
    return [];
  }
  return generatePowerOptions(cylUpper, cylMax);
}

/** Full negative CYL catalog bounds for wholesale / static range hints. */
export function computeFullCrossCylOptions(
  maxCyl: number,
  cylStartRange?: number | null
): number[] {
  return computeCrossCylOptions(maxCyl, cylStartRange);
}

/**
 * Cross products always use positive SPH.
 * Full SPH range: +0.25 up to (|maxCyl| − 0.25), e.g. maxCyl −2 → +0.25 … +1.75.
 */
export function computeCrossSphOptions(maxCyl: number): number[] {
  const absMax = roundQuarter(Math.abs(maxCyl));
  const sphMax = roundQuarter(absMax - CROSS_MIN_GAP);
  if (sphMax < CROSS_MIN_GAP - POWER_EPS) {
    return [];
  }
  return generatePowerOptions(CROSS_MIN_GAP, sphMax);
}

/**
 * Negative CYL scroll options for the selected SPH on cross products.
 * Range: −0.25 down to maxCyl, filtered so |CYL| − SPH ≥ 0.25.
 */
export function computeCrossCylOptionsForSph(
  sph: number,
  maxCyl: number,
  cylStartRange?: number | null
): number[] {
  const roundedSph = roundQuarter(sph);
  if (roundedSph < CROSS_MIN_GAP - POWER_EPS) {
    return [];
  }

  const cylMax = roundQuarter(maxCyl);
  if (cylMax >= -POWER_EPS) {
    return [];
  }

  const negUpper = resolveCrossCylUpperForSph(roundedSph, cylStartRange);
  const negLower = cylMax;

  if (negUpper < negLower - POWER_EPS) {
    return [];
  }

  return generatePowerOptions(negUpper, negLower);
}

/** Keep CYL valid when SPH changes — always negative, at least |SPH| + 0.25. */
export function coerceCrossCylForSph(
  sph: number,
  cyl: number,
  maxCyl: number,
  cylStartRange?: number | null
): number {
  const options = computeCrossCylOptionsForSph(sph, maxCyl, cylStartRange);
  if (options.length === 0) {
    return cyl;
  }

  const roundedSph = roundQuarter(sph);
  const roundedCyl = roundQuarter(cyl);

  const isValid =
    roundedCyl < -POWER_EPS &&
    options.some((value) => Math.abs(value - roundedCyl) < POWER_EPS) &&
    Math.abs(roundedCyl) - roundedSph >= CROSS_MIN_GAP - POWER_EPS;

  if (isValid) {
    return roundedCyl;
  }

  return options[0]!;
}

export function isAllowedCrossCombo(
  sph: number,
  cyl: number,
  cylStartRange?: number | null
): boolean {
  const roundedSph = roundQuarter(sph);
  const roundedCyl = roundQuarter(cyl);
  if (roundedSph < CROSS_MIN_GAP - POWER_EPS) {
    return false;
  }
  if (roundedCyl >= -POWER_EPS) {
    return false;
  }

  const start = resolveCylStartRange(cylStartRange);
  if (start !== null && roundedCyl > start + POWER_EPS) {
    return false;
  }

  return Math.abs(roundedCyl) - roundedSph >= CROSS_MIN_GAP - POWER_EPS;
}
