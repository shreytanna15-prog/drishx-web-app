import type { ZodTypeAny } from "zod";

/** Returns first Zod issue message, or null when valid. */
export function safeParseMessage(
  schema: ZodTypeAny,
  data: unknown
): string | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "Invalid input.";
}
