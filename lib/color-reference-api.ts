import { getStoredToken } from "@/lib/auth-storage";

export type ColorReferenceUploadResult = {
  imageUrl: string;
  storedImageUrl: string;
  message: string;
};

export async function uploadColorReference(
  file: File
): Promise<ColorReferenceUploadResult> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch("/api/color-references", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "Failed to upload color reference.");
  }

  return result as ColorReferenceUploadResult;
}
