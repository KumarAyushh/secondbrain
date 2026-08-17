import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { registerDebugRoutes } from "./debug.js";
import { redisTestRoutes } from "./redisTest.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
export async function registerRoutes(app: FastifyInstance) {
  await healthRoutes(app);
  await redisTestRoutes(app);
  await app.register(registerDebugRoutes, {
    prefix: "/debug",
  });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
}
