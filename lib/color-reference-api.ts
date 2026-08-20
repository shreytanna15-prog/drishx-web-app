import { authFetch, getAuthHeaders } from "@/lib/auth-fetch";

export type ColorReferenceUploadResult = {
  imageUrl: string;
  storedImageUrl: string;
  message: string;
};

export async function uploadColorReference(
  file: File
): Promise<ColorReferenceUploadResult> {
  const formData = new FormData();
  formData.append("photo", file);

  const headers = getAuthHeaders();
  delete headers["Content-Type"];

  const response = await authFetch("/api/color-references", {
    method: "POST",
    headers,
    body: formData,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "Failed to upload color reference.");
  }

  return result as ColorReferenceUploadResult;
}
