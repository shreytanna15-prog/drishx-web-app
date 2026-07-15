import { getStoredToken } from "@/lib/auth-storage";
import {
  COLOR_LENS_DEFAULT_COATING,
  COLOR_LENS_DEFAULT_TINT_STRENGTH,
  type ColorLensOrderParams,
} from "@/lib/color-lens-order";
import type { ColorLensTypeId } from "@/lib/color-lens";
import {
  formatLensIndex,
  getLensIndexForMaterial,
  type ColorLensMaterialId,
} from "@/lib/color-lens-specifications";
import type { ColorLensPrescription } from "@/lib/color-lens-prescription";

export type PlaceColorLensOrderInput = ColorLensOrderParams & {
  colorName: string;
  prescription: ColorLensPrescription;
  materialId: ColorLensMaterialId;
  /** When staff places for a customer (order on behalf). */
  userId?: string;
};

export async function placeColorLensOrder(
  input: PlaceColorLensOrderInput
): Promise<
  { success: true; orderId: string; message: string } | { success: false; error: string }
> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const lensType = (input.lensType as ColorLensTypeId | undefined) ?? "single-vision";
  const lensIndex = formatLensIndex(getLensIndexForMaterial(input.materialId));

  const payload = {
    colorId: input.colorId ?? null,
    colorName: input.colorName,
    colorHex: input.colorHex ?? null,
    lensType,
    materialId: input.materialId,
    coating: COLOR_LENS_DEFAULT_COATING,
    tintStrength: input.tintStrength ?? COLOR_LENS_DEFAULT_TINT_STRENGTH,
    lensIndex,
    referenceImageUrl: input.referenceImageUrl ?? null,
    prescription: {
      right: input.prescription.right,
      left: input.prescription.left,
    },
    ...(input.userId?.trim() ? { userId: input.userId.trim() } : {}),
  };

  try {
    const response = await fetch("/api/orders/color-lens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: result?.error || "Failed to place color lens order.",
      };
    }

    return {
      success: true,
      orderId: result.order?.id ?? "",
      message:
        result.message ||
        "Your color lens order has been placed. Our team will confirm pricing and delivery.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to place color lens order.",
    };
  }
}
