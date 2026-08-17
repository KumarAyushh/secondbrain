import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

//schema for the environment variables
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3000),

  DATABASE_URL: z.string().url(),

  REDIS_HOST: z.string().min(1).default("localhost"),

  REDIS_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(6379),

  REDIS_USERNAME: z.string().min(1).optional(),

  REDIS_PASSWORD: z.string().min(1),

  OTP_SECRET: z.string().min(32).optional(),
  OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(1800).default(600),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(30).max(600).default(60),

  SENDGRID_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),

  // JWT_SECRET: z.string().min(1),

  // GEMINI_API_KEY: z.string().min(1),

  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug"])
    .default("info"),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;

  for (const key of ["OTP_SECRET", "SENDGRID_API_KEY", "EMAIL_FROM"] as const) {
    if (!env[key]) {
      ctx.addIssue({ code: "custom", path: [key], message: `${key} is required in production` });
    }
  }
});

//validate the environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables");
  console.error(parsedEnv.error.format());
  process.exit(1);
}

// Extract the validated environment
const env = parsedEnv.data;

//export the validated environment variables
export const config = {
  app: {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  },

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
  },

  auth: {
    otpSecret: env.OTP_SECRET,
    otpTtlSeconds: env.OTP_TTL_SECONDS,
    otpMaxAttempts: env.OTP_MAX_ATTEMPTS,
    otpResendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
  },

  email: {
    sendgridApiKey: env.SENDGRID_API_KEY,
    from: env.EMAIL_FROM,
  },

  // auth: {
  //   jwtSecret: env.JWT_SECRET,
  // },

  // ai: {
  //   geminiApiKey: env.GEMINI_API_KEY,
  // },

  logging: {
    level: env.LOG_LEVEL,
  },
} as const;

//export the type of the validated environment variables
export type Config = typeof config;
