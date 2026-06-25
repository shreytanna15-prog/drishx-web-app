export type FilterOption = "All" | LensType;

export type LensType = "Kryptok" | "Progressive" | "Single Vision";

export type ApiLensType = "KRYPTOK" | "PROGRESSIVE" | "SINGLE_VISION";

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
