import type { FilterOption } from "./lens";

export type HomeCategoryCard = {
  id: string;
  label: string;
  filter: FilterOption;
};

export const CLIENT_HOME_CATEGORIES: HomeCategoryCard[] = [
  { id: "singlevision", label: "Singlevision", filter: "Single Vision" },
  { id: "progressive", label: "Progressive", filter: "Progressive" },
  { id: "kryptok", label: "Kryptok", filter: "Kryptok" },
  { id: "rx", label: "Rx", filter: "All" },
  { id: "color", label: "Color", filter: "All" },
  { id: "white", label: "White", filter: "All" },
];
