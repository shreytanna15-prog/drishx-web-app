import { uploadColorReference } from "@/lib/color-reference-api";
import { authFetch, getAuthHeaders } from "@/lib/auth-fetch";
import type { RxLensTypeId, RxOrderFor, RxPrescription } from "@/lib/rx-order";

export type PlaceRxOrderInput = {
  lensType: RxLensTypeId;
  orderFor: RxOrderFor;
  quantity: number;
  samePowerForBothEyes: boolean;
  prescription: RxPrescription;
  feature: string;
  lensIndex: string;
  coating: string;
  productName?: string | null;
  remarks?: string | null;
  remarkTags?: string[];
  prescriptionImageUrl?: string | null;
  /** When staff places for a customer (order on behalf). */
  userId?: string;
  deliveryServiceId?: string;
};

export type UploadRxPrescriptionResult = {
  storedImageUrl: string;
  imageUrl: string;
  message: string;
};

export async function uploadRxPrescription(
  file: File
): Promise<UploadRxPrescriptionResult> {
  const result = await uploadColorReference(file);
  return {
    storedImageUrl: result.storedImageUrl,
    imageUrl: result.imageUrl,
    message: result.message,
  };
}

export async function placeRxOrder(
  input: PlaceRxOrderInput
): Promise<
  { success: true; orderId: string; message: string } | { success: false; error: string }
> {
  try {
    const { userId, deliveryServiceId, ...orderBody } = input;
    const response = await authFetch("/api/orders/rx", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...orderBody,
        ...(userId?.trim() ? { userId: userId.trim() } : {}),
        ...(deliveryServiceId?.trim() ? { deliveryServiceId: deliveryServiceId.trim() } : {}),
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: result?.error || "Failed to place RX order.",
      };
    }

    return {
      success: true,
      orderId: result?.order?.id ?? "",
      message:
        result?.message ||
        "Your prescription order has been placed. Our team will confirm pricing and delivery.",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to place RX order.",
    };
  }
}
