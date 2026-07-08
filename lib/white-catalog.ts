import { generatePowerOptions } from "@/lib/prescription-range";
import type { LensItem, SelectableRange } from "@/lib/types/lens";
import type { WholesaleGridMode } from "@/lib/wholesale-powers";

export type WhiteLensTypeId = "single-vision" | "kryptok";

export type WhiteProductLineId =
  | "white-55-sv"
  | "pg-6l-sv"
  | "white-55-kt"
  | "pg-6l-kt";

export type WhiteSingleVisionVariantId =
  | "sv-plus6-sph"
  | "sv-plus4-plus2"
  | "sv-minus10-sph"
  | "sv-minus6-minus2";

export type WhiteKryptokVariantId =
  | "kt-plus2-sph"
  | "kt-minus2-sph"
  | "kt-plus2-cyl"
  | "kt-minus2-cyl";

export type WhiteVariantId = WhiteSingleVisionVariantId | WhiteKryptokVariantId;

export type WhiteLensTypeOption = {
  id: WhiteLensTypeId;
  title: string;
  description: string;
};

export type WhiteProductLine = {
  id: WhiteProductLineId;
  lensType: WhiteLensTypeId;
  title: string;
  description: string;
};

export type WhiteVariant = {
  id: WhiteVariantId;
  lensType: WhiteLensTypeId;
  lineId: WhiteProductLineId;
  title: string;
  subtitle: string;
  gridMode: WholesaleGridMode;
  fixedAxis: number | null;
  selectableRange: SelectableRange;
  addOptions: number[];
};

const POWER_STEP = 0.25;

function powerRange(from: number, to: number) {
  const options = generatePowerOptions(from, to);
  return {
    min: options[0] ?? from,
    max: options[options.length - 1] ?? to,
    options,
  };
}

function addRange(from = 1, to = 3): number[] {
  return generatePowerOptions(from, to);
}

export const WHITE_LENS_TYPES: WhiteLensTypeOption[] = [
  {
    id: "single-vision",
    title: "Single vision",
    description: "White 55 SV and PG 6L SV product lines",
  },
  {
    id: "kryptok",
    title: "Kryptok",
    description: "White 55 KT and PG 6L KT product lines",
  },
];

export const WHITE_PRODUCT_LINES: WhiteProductLine[] = [
  {
    id: "white-55-sv",
    lensType: "single-vision",
    title: "White 55 SV",
    description: "White single vision 1.56 index range",
  },
  {
    id: "pg-6l-sv",
    lensType: "single-vision",
    title: "PG 6L SV",
    description: "PG white single vision range",
  },
  {
    id: "white-55-kt",
    lensType: "kryptok",
    title: "White 55 KT",
    description: "White kryptok bifocal range",
  },
  {
    id: "pg-6l-kt",
    lensType: "kryptok",
    title: "PG 6L KT",
    description: "PG white kryptok range",
  },
];

const SV_VARIANT_DEFS: Array<
  Omit<WhiteVariant, "lensType" | "lineId"> & {
    lineIds: WhiteProductLineId[];
  }
> = [
  {
    id: "sv-plus6-sph",
    lineIds: ["white-55-sv", "pg-6l-sv"],
    title: "+6 SPH only",
    subtitle: "SPH 0 to +6 in 0.25 steps",
    gridMode: "sph-only",
    fixedAxis: null,
    selectableRange: { sph: powerRange(0, 6), cyl: null },
    addOptions: [],
  },
  {
    id: "sv-plus4-plus2",
    lineIds: ["white-55-sv", "pg-6l-sv"],
    title: "+4 / +2",
    subtitle: "SPH 0 to +4 and CYL 0 to +2",
    gridMode: "compound",
    fixedAxis: null,
    selectableRange: { sph: powerRange(0, 4), cyl: powerRange(0, 2) },
    addOptions: [],
  },
  {
    id: "sv-minus10-sph",
    lineIds: ["white-55-sv", "pg-6l-sv"],
    title: "-10 SPH only",
    subtitle: "SPH 0 to -10 in 0.25 steps",
    gridMode: "sph-only",
    fixedAxis: null,
    selectableRange: { sph: powerRange(0, -10), cyl: null },
    addOptions: [],
  },
  {
    id: "sv-minus6-minus2",
    lineIds: ["white-55-sv", "pg-6l-sv"],
    title: "-6 / -2",
    subtitle: "SPH 0 to -6 and CYL 0 to -2",
    gridMode: "compound",
    fixedAxis: null,
    selectableRange: { sph: powerRange(0, -6), cyl: powerRange(0, -2) },
    addOptions: [],
  },
];

const KT_VARIANT_DEFS: Array<
  Omit<WhiteVariant, "lensType" | "lineId"> & {
    lineIds: WhiteProductLineId[];
  }
> = [
  {
    id: "kt-plus2-sph",
    lineIds: ["white-55-kt", "pg-6l-kt"],
    title: "+2 SPH only",
    subtitle: "SPH 0 to +2 · ADD +1 to +3",
    gridMode: "sph-only",
    fixedAxis: null,
    selectableRange: { sph: powerRange(0, 2), cyl: null },
    addOptions: addRange(),
  },
  {
    id: "kt-minus2-sph",
    lineIds: ["white-55-kt", "pg-6l-kt"],
    title: "-2 SPH only",
    subtitle: "SPH 0 to -2 · ADD +1 to +3",
    gridMode: "sph-only",
    fixedAxis: null,
    selectableRange: { sph: powerRange(0, -2), cyl: null },
    addOptions: addRange(),
  },
  {
    id: "kt-plus2-cyl",
    lineIds: ["white-55-kt", "pg-6l-kt"],
    title: "+2 CYL only",
    subtitle: "CYL 0 to +2 · Axis 180 · ADD +1 to +3",
    gridMode: "cyl-only",
    fixedAxis: 180,
    selectableRange: { sph: powerRange(0, 0), cyl: powerRange(0, 2) },
    addOptions: addRange(),
  },
  {
    id: "kt-minus2-cyl",
    lineIds: ["white-55-kt", "pg-6l-kt"],
    title: "-2 CYL only",
    subtitle: "CYL 0 to -2 · Axis 90 · ADD +1 to +3",
    gridMode: "cyl-only",
    fixedAxis: 90,
    selectableRange: { sph: powerRange(0, 0), cyl: powerRange(0, -2) },
    addOptions: addRange(),
  },
];

export const WHITE_VARIANTS: WhiteVariant[] = [
  ...SV_VARIANT_DEFS.flatMap((def) =>
    def.lineIds.map((lineId) => ({
      id: def.id,
      lensType: "single-vision" as const,
      lineId,
      title: def.title,
      subtitle: def.subtitle,
      gridMode: def.gridMode,
      fixedAxis: def.fixedAxis,
      selectableRange: def.selectableRange,
      addOptions: def.addOptions,
    }))
  ),
  ...KT_VARIANT_DEFS.flatMap((def) =>
    def.lineIds.map((lineId) => ({
      id: def.id,
      lensType: "kryptok" as const,
      lineId,
      title: def.title,
      subtitle: def.subtitle,
      gridMode: def.gridMode,
      fixedAxis: def.fixedAxis,
      selectableRange: def.selectableRange,
      addOptions: def.addOptions,
    }))
  ),
];

export function parseWhiteLensType(raw: string | undefined): WhiteLensTypeId | null {
  const value = raw?.trim().toLowerCase();
  if (value === "single-vision" || value === "sv") return "single-vision";
  if (value === "kryptok" || value === "kt") return "kryptok";
  return null;
}

export function parseWhiteProductLine(raw: string | undefined): WhiteProductLineId | null {
  const value = raw?.trim().toLowerCase();
  return WHITE_PRODUCT_LINES.some((line) => line.id === value)
    ? (value as WhiteProductLineId)
    : null;
}

export function parseWhiteVariant(raw: string | undefined): WhiteVariantId | null {
  const value = raw?.trim().toLowerCase();
  return WHITE_VARIANTS.some((variant) => variant.id === value)
    ? (value as WhiteVariantId)
    : null;
}

export function getWhiteProductLine(id: WhiteProductLineId): WhiteProductLine {
  return WHITE_PRODUCT_LINES.find((entry) => entry.id === id)!;
}

export function listWhiteProductLines(lensType: WhiteLensTypeId): WhiteProductLine[] {
  return WHITE_PRODUCT_LINES.filter((line) => line.lensType === lensType);
}

export function listWhiteVariants(lineId: WhiteProductLineId): WhiteVariant[] {
  const seen = new Set<WhiteVariantId>();
  return WHITE_VARIANTS.filter((variant) => {
    if (variant.lineId !== lineId || seen.has(variant.id)) {
      return false;
    }
    seen.add(variant.id);
    return true;
  });
}

export function whiteLensTypeDisplayTitle(lensType: WhiteLensTypeId): string {
  return WHITE_LENS_TYPES.find((entry) => entry.id === lensType)?.title ?? lensType;
}

export const WHITE_CATALOG_ID_PREFIX = "white-catalog-";

export function isWhiteCatalogLensId(id: string): boolean {
  return id.startsWith(WHITE_CATALOG_ID_PREFIX);
}

export function getWhiteVariant(
  lineId: WhiteProductLineId,
  variantId: WhiteVariantId
): WhiteVariant {
  return WHITE_VARIANTS.find((entry) => entry.lineId === lineId && entry.id === variantId)!;
}

export function buildWhiteCatalogLensItem(
  lineId: WhiteProductLineId,
  variantId: WhiteVariantId
): LensItem {
  const line = getWhiteProductLine(lineId);
  const variant = getWhiteVariant(lineId, variantId);
  const lensType = variant.lensType === "single-vision" ? "Single Vision" : "Kryptok";
  const initialSph = variant.selectableRange.sph.options[0] ?? 0;
  const initialCyl = variant.selectableRange.cyl?.options[0] ?? null;

  return {
    id: `${WHITE_CATALOG_ID_PREFIX}${lineId}-${variantId}`,
    costPrice: null,
    price: 0,
    sph: initialSph,
    cyl: initialCyl,
    axis: variant.fixedAxis,
    add: variant.addOptions[0] ?? null,
    quantity: 999,
    createdAt: new Date().toISOString(),
    lensType,
    brand: line.title,
    item: variant.title,
    coating: "White",
    index: lineId.includes("pg-6l") ? 1.6 : 1.56,
    selectableRange: variant.selectableRange,
  };
}
