import { isValidPairQuantity, piecesFromDisplayQuantity } from "@/lib/order-quantity";
import {
  buildWholesaleMatrixSpec,
  collectQtyEntriesFromSpec,
  type BuildMatrixParams,
} from "@/lib/wholesale-matrix";
import { buildPowerList } from "@/lib/wholesale-powers";

export function isWholesaleCartItem(item: {
  lineType?: string | null;
  cartLineKey?: string | null;
}): boolean {
  return (
    item.lineType === "WHOLESALE" ||
    Boolean(item.cartLineKey?.startsWith("wholesale:"))
  );
}

export type PowerRangeSpec = {
  from: number;
  to: number;
  step: number;
};

export type WholesaleGridMode = "sph-only" | "cyl-only" | "compound";

export type WholesaleSpec = {
  ranges: {
    sph?: PowerRangeSpec;
    cyl?: PowerRangeSpec;
    add?: PowerRangeSpec;
  };
  gridMode: WholesaleGridMode;
  defaultPairsPerCell: number;
  qtyOverrides: Record<string, number>;
  productAxis: number | null;
  isBifocalLens: boolean;
  isSingleVision: boolean;
  crossPower: number | null;
};

export type WholesaleExpandedLine = {
  key: string;
  sph: number;
  cyl: number | null;
  add: number | null;
  axis: number | null;
  pairs: number;
  pieces: number;
};

export type WholesaleCartBatchInput = {
  lensId: string;
  ranges: WholesaleSpec["ranges"];
  gridMode: WholesaleGridMode;
  defaultPairsPerCell: number;
  qtyOverrides?: Record<string, number>;
  productAxis?: number | null;
  isBifocalLens: boolean;
  isSingleVision: boolean;
  crossPower?: number | null;
};

function hashSpecIdentity(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function buildWholesaleSpecIdentity(spec: WholesaleSpec): string {
  return JSON.stringify({
    ranges: spec.ranges,
    gridMode: spec.gridMode,
    productAxis: spec.productAxis,
    crossPower: spec.crossPower,
    isBifocalLens: spec.isBifocalLens,
    isSingleVision: spec.isSingleVision,
  });
}

export function buildWholesaleCartLineKey(
  lensId: string,
  spec: WholesaleSpec
): string {
  const hash = hashSpecIdentity(buildWholesaleSpecIdentity(spec));
  return `wholesale:${lensId}:${hash}`;
}

export function buildWholesaleSpecFromInput(
  input: WholesaleCartBatchInput
): WholesaleSpec {
  return {
    ranges: input.ranges,
    gridMode: input.gridMode,
    defaultPairsPerCell: (() => {
      const pairs = Number(input.defaultPairsPerCell);
      return isValidPairQuantity(pairs) ? pairs : 1;
    })(),
    qtyOverrides: input.qtyOverrides ?? {},
    productAxis: input.productAxis ?? null,
    isBifocalLens: input.isBifocalLens,
    isSingleVision: input.isSingleVision,
    crossPower: input.crossPower ?? null,
  };
}

export function buildMatrixParamsFromWholesaleSpec(
  spec: WholesaleSpec
): BuildMatrixParams | null {
  const sphRange = spec.ranges.sph;
  const cylRange = spec.ranges.cyl;
  const addRange = spec.ranges.add;

  const sphList =
    sphRange && spec.gridMode !== "cyl-only"
      ? buildPowerList(sphRange.from, sphRange.to, sphRange.step)
      : [];
  const cylList =
    cylRange && spec.gridMode !== "sph-only"
      ? buildPowerList(cylRange.from, cylRange.to, cylRange.step)
      : [];
  const addList =
    spec.isBifocalLens && addRange
      ? buildPowerList(addRange.from, addRange.to, addRange.step)
      : [];

  const crossPowerMeta =
    spec.crossPower != null && Math.abs(Number(spec.crossPower)) > 1e-9
      ? { maxCyl: Math.abs(Number(spec.crossPower)) }
      : null;

  return {
    mode: spec.gridMode,
    isBifocalLens: spec.isBifocalLens,
    isSingleVision: spec.isSingleVision,
    sphList,
    cylList,
    addList,
    productAxis: spec.productAxis,
    crossPowerMeta,
  };
}

export function buildQtyMapFromWholesaleSpec(
  spec: WholesaleSpec
): Record<string, string> {
  const matrixParams = buildMatrixParamsFromWholesaleSpec(spec);
  if (!matrixParams) {
    return {};
  }

  const matrixSpec = buildWholesaleMatrixSpec(matrixParams);
  if (!matrixSpec) {
    return {};
  }

  const defaultPairs = String(Math.max(1, Math.floor(spec.defaultPairsPerCell)));
  const qtyMap: Record<string, string> = {};

  for (const row of matrixSpec.rows) {
    for (const col of matrixSpec.cols) {
      for (const cell of matrixSpec.cellsAt(row, col)) {
        const override = spec.qtyOverrides[cell.key];
        const pairs =
          override !== undefined
            ? Math.max(0, Math.floor(override))
            : Number(defaultPairs);
        if (pairs >= 1) {
          qtyMap[cell.key] = String(pairs);
        }
      }
    }
  }

  return qtyMap;
}

export function expandWholesaleSpec(
  spec: WholesaleSpec
): WholesaleExpandedLine[] {
  const matrixParams = buildMatrixParamsFromWholesaleSpec(spec);
  if (!matrixParams) {
    return [];
  }

  const matrixSpec = buildWholesaleMatrixSpec(matrixParams);
  if (!matrixSpec) {
    return [];
  }

  const defaultPairs = Math.max(1, Math.floor(spec.defaultPairsPerCell));
  const qtyMap: Record<string, string> = {};
  for (const row of matrixSpec.rows) {
    for (const col of matrixSpec.cols) {
      for (const cell of matrixSpec.cellsAt(row, col)) {
        const override = spec.qtyOverrides[cell.key];
        const pairs =
          override !== undefined
            ? Math.max(0, Math.floor(override))
            : defaultPairs;
        if (pairs >= 1) {
          qtyMap[cell.key] = String(pairs);
        }
      }
    }
  }

  const entries = collectQtyEntriesFromSpec(matrixSpec, qtyMap, matrixParams);

  return entries.map((entry) => ({
    key: entry.key,
    sph: entry.sph,
    cyl: entry.cyl,
    add: entry.add,
    axis: entry.axis,
    pairs: entry.pairs,
    pieces: piecesFromDisplayQuantity(entry.pairs, "pair"),
  }));
}

export function summarizeWholesaleSpec(spec: WholesaleSpec): {
  expanded: WholesaleExpandedLine[];
  totalPieces: number;
  totalPairs: number;
} {
  const expanded = expandWholesaleSpec(spec);
  return {
    expanded,
    totalPieces: expanded.reduce((sum, line) => sum + line.pieces, 0),
    totalPairs: expanded.reduce((sum, line) => sum + line.pairs, 0),
  };
}

export function totalPiecesForWholesaleSpec(spec: WholesaleSpec): number {
  return summarizeWholesaleSpec(spec).totalPieces;
}

export function totalPairsForWholesaleSpec(spec: WholesaleSpec): number {
  return summarizeWholesaleSpec(spec).totalPairs;
}

export function buildWholesaleSpecFromOrderState(input: {
  sphFrom: number;
  sphTo: number;
  sphStep: number;
  cylFrom: number;
  cylTo: number;
  cylStep: number;
  addFrom: number;
  addTo: number;
  addStep: number;
  gridMode: WholesaleGridMode;
  defaultPairsPerCell: number;
  qtyMap: Record<string, string>;
  productAxis: number | null;
  isBifocalLens: boolean;
  isSingleVision: boolean;
  crossPower: number | null;
  showSphRange: boolean;
  showCylRange: boolean;
}): WholesaleSpec {
  const parsedDefault = Number(input.defaultPairsPerCell) || 1;
  const defaultPairs = isValidPairQuantity(parsedDefault) ? parsedDefault : 1;
  const qtyOverrides: Record<string, number> = {};

  for (const [key, raw] of Object.entries(input.qtyMap)) {
    const pairs = Number(raw);
    if (!isValidPairQuantity(pairs)) {
      continue;
    }
    if (pairs !== defaultPairs) {
      qtyOverrides[key] = pairs;
    }
  }

  return {
    ranges: {
      ...(input.showSphRange
        ? { sph: { from: input.sphFrom, to: input.sphTo, step: input.sphStep } }
        : {}),
      ...(input.showCylRange
        ? { cyl: { from: input.cylFrom, to: input.cylTo, step: input.cylStep } }
        : {}),
      ...(input.isBifocalLens
        ? { add: { from: input.addFrom, to: input.addTo, step: input.addStep } }
        : {}),
    },
    gridMode: input.gridMode,
    defaultPairsPerCell: defaultPairs,
    qtyOverrides,
    productAxis: input.productAxis,
    isBifocalLens: input.isBifocalLens,
    isSingleVision: input.isSingleVision,
    crossPower: input.crossPower,
  };
}
