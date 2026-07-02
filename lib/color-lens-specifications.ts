export type ColorLensMaterialId =
  | "poly-tintable-brc"
  | "tintable-brc"
  | "hc"
  | "uc"
  | "tintable";

export type ColorLensMaterialOption = {
  id: ColorLensMaterialId;
  title: string;
};

export const COLOR_LENS_DIAMETER_MM = 70;

export const COLOR_LENS_INDEX_POLY = 1.499;
export const COLOR_LENS_INDEX_DEFAULT = 1.56;

export const COLOR_LENS_MATERIAL_OPTIONS: ColorLensMaterialOption[] = [
  { id: "poly-tintable-brc", title: "Poly Tintable BRC" },
  { id: "tintable-brc", title: "Tintable BRC" },
  { id: "hc", title: "HC" },
  { id: "uc", title: "UC" },
  { id: "tintable", title: "Tintable" },
];

export function getMaterialOptionsForLensType(
  lensType: string | undefined
): ColorLensMaterialOption[] {
  if (lensType === "kryptok" || lensType === "progressive") {
    return COLOR_LENS_MATERIAL_OPTIONS.filter(
      (option) => option.id !== "tintable-brc" && option.id !== "poly-tintable-brc"
    );
  }

  return COLOR_LENS_MATERIAL_OPTIONS;
}

export function getLensIndexForMaterial(materialId: ColorLensMaterialId): number {
  return materialId === "poly-tintable-brc"
    ? COLOR_LENS_INDEX_POLY
    : COLOR_LENS_INDEX_DEFAULT;
}

export function formatLensIndex(value: number): string {
  const text = value.toFixed(3);
  return text.replace(/0+$/, "").replace(/\.$/, ".0");
}
