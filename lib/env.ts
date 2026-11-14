import { z } from "zod";

const webEnvSchema = z.object({
  BACKEND_URL: z
    .string()
    .trim()
    .default("http://127.0.0.1:3000")
    .transform((value, ctx) => {
      const normalized = value.replace(/\/+$/, "") || "http://127.0.0.1:3000";
      try {
        const parsed = new URL(normalized);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("invalid protocol");
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `BACKEND_URL must be a valid http(s) URL (got "${normalized}").`,
        });
        return z.NEVER;
      }
      return normalized;
    }),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

let cached: WebEnv | null = null;

export function getEnv(): WebEnv {
  if (cached) return cached;
  const parsed = webEnvSchema.safeParse({
    BACKEND_URL: process.env.BACKEND_URL?.trim() || "http://127.0.0.1:3000",
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid environment.";
    throw new Error(first);
  }
  cached = parsed.data;
  return cached;
}

export function assertEnv(): WebEnv {
  return getEnv();
}
