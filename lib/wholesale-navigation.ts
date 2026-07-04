import type { FilterOption } from "@/lib/types/lens";
import type { LucideIcon } from "lucide-react";
import { Eye, Focus, ScanEye } from "lucide-react";

export type WholesaleCategoryId = "sv" | "kt" | "v2";

export type LensCatalogCategory = {
  id: WholesaleCategoryId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

export const LENS_CATALOG_CATEGORIES: LensCatalogCategory[] = [
  {
    id: "sv",
    title: "Single Vision",
    subtitle: "SV products",
    icon: ScanEye,
  },
  {
    id: "kt",
    title: "Kryptok",
    subtitle: "KT products",
    icon: Eye,
  },
  {
    id: "v2",
    title: "Progressive",
    subtitle: "V2 products",
    icon: Focus,
  },
];

export function wholesaleCategoryToFilter(
  category: WholesaleCategoryId
): FilterOption {
  switch (category) {
    case "sv":
      return "Single Vision";
    case "kt":
      return "Kryptok";
    case "v2":
      return "Progressive";
  }
}

export function wholesaleCategoryTitle(category: WholesaleCategoryId): string {
  switch (category) {
    case "sv":
      return "Single Vision";
    case "kt":
      return "Kryptok";
    case "v2":
      return "Progressive";
  }
}

export function wholesaleCategoryToApiType(
  category: WholesaleCategoryId
): string {
  switch (category) {
    case "sv":
      return "single-vision";
    case "kt":
      return "kryptok";
    case "v2":
      return "progressive";
  }
}

export function catalogCategoryDisplayTitle(
  category: WholesaleCategoryId
): string {
  switch (category) {
    case "sv":
      return "SINGLE VISION";
    case "kt":
      return "KRYPTOK";
    case "v2":
      return "PROGRESSIVE";
  }
}

export function parseWholesaleCategory(
  raw: string | null | undefined
): WholesaleCategoryId {
  if (raw === "sv" || raw === "kt" || raw === "v2") {
    return raw;
  }
  return "sv";
}
