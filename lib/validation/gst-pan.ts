import { z } from "zod";

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const optionalGstinPanSchema = z
  .object({
    gstNumber: z.string().optional(),
    panNumber: z.string().optional(),
  })
  .transform((input, ctx) => {
    const gst = input.gstNumber?.trim().toUpperCase() ?? "";
    const pan = input.panNumber?.trim().toUpperCase() ?? "";
    if (gst && !GSTIN_REGEX.test(gst)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid GSTIN format.",
      });
      return z.NEVER;
    }
    if (pan && !PAN_REGEX.test(pan)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid PAN format.",
      });
      return z.NEVER;
    }
    return {
      gstNumber: gst || null,
      panNumber: pan || null,
    };
  });

export function validateOptionalGstinPan(input: {
  gstNumber?: string;
  panNumber?: string;
}): string | null {
  const parsed = optionalGstinPanSchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid GSTIN/PAN.";
  }
  return null;
}
