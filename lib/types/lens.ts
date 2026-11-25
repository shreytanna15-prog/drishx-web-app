export type FilterOption = "All" | LensType;

export type LensType = "Kryptok" | "Progressive" | "Single Vision";

export type ApiLensType = "KRYPTOK" | "PROGRESSIVE" | "SINGLE_VISION";

export type PowerAxisRange = {
  min: number;
  max: number;
  options: number[];
};

export type SelectableRange = {
  sph: PowerAxisRange;
  cyl: PowerAxisRange | null;
  crossPower?: {
    maxCyl: number;
    cylStartRange?: number | null;
  } | null;
};

export type LensItem = {
  id: string;
  costPrice: number | null;
  price: number;
  sph: number | null;
  sphStartRange?: number | null;
  cyl: number | null;
  cylStartRange?: number | null;
  crossPower?: number | null;
  axis: number | null;
  add: number | null;
  cylAdd?: number | null;
  eye?: string;
  quantity: number;
  createdAt: string;
  lensType?: LensType;
  brand?: string | null;
  item?: string | null;
  coating?: string | null;
  index?: number | null;
  selectableRange?: SelectableRange | null;
  /** Catalog image from Supabase (by lens type). */
  imageUrl?: string | null;
  /** New catalog stock leaf — when set, checkout uses placeCatalogOrder. */
  lensProductPowerId?: string | null;
};

export type CartLineType = "RETAIL" | "WHOLESALE";

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

export type CartItem = LensItem & {
  cartLineId: string;
  cartLineKey: string;
  cartQuantity: number;
  reservedQuantity?: number;
  isBackorder?: boolean;
  expiresAt?: string;
  lineType?: CartLineType;
  wholesaleSpec?: WholesaleSpec | null;
};

export function toApiLensType(lensType: LensType): ApiLensType {
  switch (lensType) {
    case "Kryptok":
      return "KRYPTOK";
    case "Progressive":
      return "PROGRESSIVE";
    case "Single Vision":
      return "SINGLE_VISION";
  }
}

export function formatLensType(apiType: string): LensType | string {
  switch (apiType) {
    case "KRYPTOK":
      return "Kryptok";
    case "PROGRESSIVE":
      return "Progressive";
    case "SINGLE_VISION":
      return "Single Vision";
    default:
      return apiType.replace(/_/g, " ");
  }
}
