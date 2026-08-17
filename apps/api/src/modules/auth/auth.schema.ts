import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  email,
  // Long passphrases are supported; the cap prevents resource-exhaustion attacks.
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
}).strict();

export const verifyOtpSchema = z.object({
  email,
  otp: z.string().regex(/^\d{4}$/, "OTP must be a 4-digit code"),
}).strict();
