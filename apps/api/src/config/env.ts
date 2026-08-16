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

  // DATABASE_URL: z.string().url(),

  REDIS_HOST: z.string().min(1).default("localhost"),

  REDIS_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(6379),

  REDIS_USERNAME: z.string().min(1).optional(),

  REDIS_PASSWORD: z.string().min(1),

  // JWT_SECRET: z.string().min(1),

  // GEMINI_API_KEY: z.string().min(1),

  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug"])
    .default("info"),
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

  // database: {
  //   url: env.DATABASE_URL,
  // },

  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
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
