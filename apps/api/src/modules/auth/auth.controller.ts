import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../errors/app-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import { AuthService } from "./auth.service.js";
import { registerSchema, verifyOtpSchema } from "./auth.schema.js";

function parse<T>(schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError("Invalid request body", 400, ERROR_CODES.VALIDATION_ERROR);
  return result.data;
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(registerSchema, request.body);
  const authService = new AuthService(request.server.prisma, request.server.redis, request.log);
  await authService.register(input);
  return reply.status(202).send({ success: true, message: "Verification code sent if the email can receive mail" });
}

export async function verifyOtp(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(verifyOtpSchema, request.body);
  const authService = new AuthService(request.server.prisma, request.server.redis, request.log);
  const user = await authService.verifyOtp(input);
  return reply.status(201).send({ success: true, data: { user } });
}
