export type ColorLensModeId = "predefined" | "upload-reference" | "custom-mix";

export type ColorLensMode = {
  id: ColorLensModeId;
  title: string;
  description: string;
};

export const COLOR_LENS_MODES: ColorLensMode[] = [
  {
    id: "predefined",
    title: "Predefined Colors",
    description: "Quickly choose from popular shades",
  },
  {
    id: "upload-reference",
    title: "Upload Reference",
    description: "Match from a photo or lens sample",
  },
  {
    id: "custom-mix",
    title: "Custom Mix",
    description: "Create your own unique tint",
  },
];

export const COLOR_LENS_FEATURES = [
  { id: "preview", label: "Real-time Preview" },
  { id: "accuracy", label: "Exact Accuracy" },
  { id: "quality", label: "Premium Quality" },
] as const;

export type PredefinedLensColor = {
  id: string;
  name: string;
  hex: string;
  highlight: string;
  shadow: string;
};

export type ColorLensTypeId = "single-vision" | "kryptok" | "progressive";

export type ColorLensTypeOption = {
  id: ColorLensTypeId;
  title: string;
  subtitle: string;
  description: string;
};

export const COLOR_LENS_TYPE_OPTIONS: ColorLensTypeOption[] = [
  {
    id: "single-vision",
    title: "Single Vision",
    subtitle: "Clear vision at one distance",
    description:
      "Single Vision lenses correct vision for one focal point — ideal for everyday distance or reading use with your chosen tint.",
  },
  {
    id: "progressive",
    title: "Progressive",
    subtitle: "Smooth vision at all distances",
    description:
      "Progressive lenses provide a seamless power transition from distance to near, without visible lines on the lens.",
  },
  {
    id: "kryptok",
    title: "Kryptok",
    subtitle: "Reliable bifocal performance",
    description:
      "Kryptok lenses offer dependable near and far vision zones, a trusted choice for bifocal wearers with color tint options.",
  },
];

export const PREDEFINED_LENS_COLORS: PredefinedLensColor[] = [
  { id: "brown", name: "Brown", hex: "#8B5A2B", highlight: "#C49A6C", shadow: "#5C3A1A" },
  { id: "grey", name: "Grey", hex: "#9CA3AF", highlight: "#D1D5DB", shadow: "#6B7280" },
  { id: "green", name: "Green", hex: "#2E8B57", highlight: "#6EE7B7", shadow: "#166534" },
  { id: "blue", name: "Blue", hex: "#2563EB", highlight: "#93C5FD", shadow: "#1E40AF" },
  { id: "black", name: "Black", hex: "#1F2937", highlight: "#6B7280", shadow: "#030712" },
  { id: "purple", name: "Purple", hex: "#7C3AED", highlight: "#C4B5FD", shadow: "#5B21B6" },
  { id: "honey", name: "Honey", hex: "#D4A056", highlight: "#FDE68A", shadow: "#92400E" },
  { id: "pink", name: "Pink", hex: "#EC4899", highlight: "#FBCFE8", shadow: "#9D174D" },
  { id: "orange", name: "Orange", hex: "#F97316", highlight: "#FDBA74", shadow: "#C2410C" },
  { id: "turquoise", name: "Turquoise", hex: "#14B8A6", highlight: "#99F6E4", shadow: "#0F766E" },
  { id: "violet", name: "Violet", hex: "#8B5CF6", highlight: "#DDD6FE", shadow: "#6D28D9" },
  { id: "wine", name: "Wine", hex: "#7F1D3A", highlight: "#FDA4AF", shadow: "#4C0519" },
];
