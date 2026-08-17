import type { FastifyInstance } from "fastify";

import { register, verifyOtp } from "./auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", register);
  app.post("/verify-otp", verifyOtp);
}
