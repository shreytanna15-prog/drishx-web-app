import { z } from "zod";
import { indianMobileSchema } from "./indian-mobile";

export const authLoginBodySchema = z
  .object({
    email: z.unknown(),
    password: z.unknown(),
  })
  .transform((body, ctx) => {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();
    if (!email || !password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email and password are required.",
      });
      return z.NEVER;
    }
    return { email, password };
  });

export const otpLoginMobileSchema = indianMobileSchema;

export const otpCodeSchema = z
  .string()
  .trim()
  .min(1, "Enter the OTP code.");
