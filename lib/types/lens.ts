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
};

export type LensItem = {
  id: string;
  costPrice: number | null;
  price: number;
  sph: number | null;
  cyl: number | null;
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
