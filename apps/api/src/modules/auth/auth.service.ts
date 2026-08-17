import { createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import type { FastifyBaseLogger } from "fastify";
import type { Redis } from "ioredis";
import type { PrismaClient } from "@secondbrain/db";

import { config } from "../../config/env.js";
import { AppError } from "../../errors/app-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import type { PendingRegistration, RegisterInput, VerifyOtpInput } from "./auth.types.js";

const OTP_PREFIX = "auth:registration:otp:";
const OTP_THROTTLE_PREFIX = "auth:registration:throttle:";
const SCRYPT_N = 32_768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

function otpKey(email: string) {
  return `${OTP_PREFIX}${createHmac("sha256", otpSecret()).update(email).digest("hex")}`;
}

function throttleKey(email: string) {
  return `${OTP_THROTTLE_PREFIX}${createHmac("sha256", otpSecret()).update(email).digest("hex")}`;
}

function otpSecret() {
  if (config.auth.otpSecret) return config.auth.otpSecret;
  if (config.app.nodeEnv === "production") {
    throw new Error("OTP_SECRET must be configured in production");
  }
  return config.database.url;
}

function hashOtp(otp: string) {
  return createHmac("sha256", otpSecret()).update(otp).digest("hex");
}

function equalSecrets(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: 128 * 1024 * 1024,
    }, (error, key) => error ? reject(error) : resolve(key));
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
}

async function sendOtpEmail(email: string, otp: string, log: FastifyBaseLogger) {
  if (!config.email.sendgridApiKey || !config.email.from) {
    if (config.app.nodeEnv === "production") {
      throw new Error("SENDGRID_API_KEY and EMAIL_FROM must be configured in production");
    }
    log.warn({ email, otp }, "Email provider is not configured; registration OTP logged for local development");
    return;
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.email.sendgridApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: config.email.from },
      subject: "Verify your SecondBrain account",
      content: [{ type: "text/plain", value: `Your verification code is ${otp}. It expires in ${Math.floor(config.auth.otpTtlSeconds / 60)} minutes.` }],
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    log.error({ statusCode: response.status }, "SendGrid failed to send verification email");
    throw new AppError("Unable to send verification code. Please try again.", 502, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
  }
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
    private readonly log: FastifyBaseLogger,
  ) {}

  async register(input: RegisterInput) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existingUser) throw new AppError("An account with this email already exists", 409, ERROR_CODES.EMAIL_ALREADY_EXISTS);

    const cooldown = await this.redis.set(throttleKey(input.email), "1", "EX", config.auth.otpResendCooldownSeconds, "NX");
    if (cooldown !== "OK") {
      throw new AppError("Please wait before requesting another verification code", 429, ERROR_CODES.TOO_MANY_REQUESTS);
    }

    const otp = randomInt(0, 10_000).toString().padStart(4, "0");
    const registration: PendingRegistration = { passwordHash: await hashPassword(input.password), otpHash: hashOtp(otp) };
    await this.redis.set(otpKey(input.email), JSON.stringify(registration), "EX", config.auth.otpTtlSeconds);

    try {
      await sendOtpEmail(input.email, otp, this.log);
    } catch (error) {
      await this.redis.del(otpKey(input.email), throttleKey(input.email));
      throw error;
    }
  }

  async verifyOtp(input: VerifyOtpInput) {
    const key = otpKey(input.email);
    const raw = await this.redis.get(key);
    if (!raw) throw new AppError("Verification code is invalid or expired", 400, ERROR_CODES.OTP_EXPIRED);

    let registration: PendingRegistration;
    try {
      registration = JSON.parse(raw) as PendingRegistration;
    } catch {
      await this.redis.del(key);
      throw new AppError("Verification code is invalid or expired", 400, ERROR_CODES.OTP_EXPIRED);
    }

    // Keep attempts in a separate expiring key because the registration itself is JSON.
    const attemptsKey = `${key}:attempts`;
    const attemptCount = await this.redis.incr(attemptsKey);
    if (attemptCount === 1) await this.redis.expire(attemptsKey, config.auth.otpTtlSeconds);
    if (attemptCount > config.auth.otpMaxAttempts) {
      await this.redis.del(key, attemptsKey);
      throw new AppError("Too many invalid verification attempts", 429, ERROR_CODES.TOO_MANY_REQUESTS);
    }
    if (!equalSecrets(registration.otpHash, hashOtp(input.otp))) {
      throw new AppError("Verification code is invalid or expired", 400, ERROR_CODES.OTP_INVALID);
    }

    try {
      const user = await this.prisma.user.create({
        data: { email: input.email, passwordHash: registration.passwordHash },
        select: { id: true, email: true, createdAt: true },
      });
      await this.redis.del(key, attemptsKey, throttleKey(input.email));
      return user;
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        await this.redis.del(key, attemptsKey);
        throw new AppError("An account with this email already exists", 409, ERROR_CODES.EMAIL_ALREADY_EXISTS);
      }
      throw error;
    }
  }
}
