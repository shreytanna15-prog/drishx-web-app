import type { ColorLensTypeId } from "@/lib/color-lens";
import type { ColorLensMaterialId } from "@/lib/color-lens-specifications";
import type { ColorLensPrescription } from "@/lib/color-lens-prescription";

export const COLOR_LENS_COLLECTION_LABEL = "Classic Collection";
export const COLOR_LENS_DEFAULT_COATING = "Anti-Reflective";
export const COLOR_LENS_DEFAULT_TINT_STRENGTH = 50;
export const COLOR_LENS_EST_DELIVERY = "3 - 5 Days";

export type ColorLensOrderParams = {
  colorId?: string;
  colorName?: string;
  colorHex?: string;
  colorHighlight?: string;
  colorShadow?: string;
  lensType?: ColorLensTypeId | string;
  materialId?: ColorLensMaterialId | string;
  tintStrength?: number;
  referenceImageUrl?: string;
  prescription?: ColorLensPrescription;
};

type SerializedPrescription = {
  r: [number, number, number, number];
  l: [number, number, number, number];
};

export function serializePrescription(prescription: ColorLensPrescription): string {
  const payload: SerializedPrescription = {
    r: [
      prescription.right.sph,
      prescription.right.cyl,
      prescription.right.axis,
      prescription.right.add,
    ],
    l: [
      prescription.left.sph,
      prescription.left.cyl,
      prescription.left.axis,
      prescription.left.add,
    ],
  };
  return encodeURIComponent(JSON.stringify(payload));
}

export function parsePrescription(
  encoded: string | undefined
): ColorLensPrescription | null {
  if (!encoded?.trim()) return null;

  try {
    const raw = JSON.parse(decodeURIComponent(encoded)) as SerializedPrescription;
    if (!Array.isArray(raw.r) || !Array.isArray(raw.l)) return null;

    return {
      right: { sph: raw.r[0], cyl: raw.r[1], axis: raw.r[2], add: raw.r[3] },
      left: { sph: raw.l[0], cyl: raw.l[1], axis: raw.l[2], add: raw.l[3] },
    };
  } catch {
    return null;
  }
}

export function buildColorLensRouteParams(
  order: ColorLensOrderParams
): Record<string, string> {
  const params: Record<string, string> = {};

  if (order.colorId) params.colorId = order.colorId;
  if (order.colorName) params.colorName = order.colorName;
  if (order.colorHex) params.colorHex = order.colorHex;
  if (order.colorHighlight) params.colorHighlight = order.colorHighlight;
  if (order.colorShadow) params.colorShadow = order.colorShadow;
  if (order.lensType) params.lensType = order.lensType;
  if (order.materialId) params.materialId = order.materialId;
  if (order.tintStrength != null) params.tintStrength = String(order.tintStrength);
  if (order.referenceImageUrl) params.referenceImageUrl = order.referenceImageUrl;
  if (order.prescription) params.prescription = serializePrescription(order.prescription);

  return params;
}

export function buildColorLensPath(
  pathname: string,
  order: ColorLensOrderParams
): string {
  const params = new URLSearchParams(buildColorLensRouteParams(order));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function parseColorLensOrderParams(
  params: Record<string, string | string[] | undefined>
): ColorLensOrderParams {
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const tintStrengthRaw = read("tintStrength");
  const tintStrength = tintStrengthRaw ? Number(tintStrengthRaw) : undefined;

  return {
    colorId: read("colorId"),
    colorName: read("colorName"),
    colorHex: read("colorHex"),
    colorHighlight: read("colorHighlight"),
    colorShadow: read("colorShadow"),
    lensType: read("lensType"),
    materialId: read("materialId") as ColorLensMaterialId | undefined,
    tintStrength: Number.isFinite(tintStrength) ? tintStrength : undefined,
    referenceImageUrl: read("referenceImageUrl"),
    prescription: parsePrescription(read("prescription")) ?? undefined,
  };
}
