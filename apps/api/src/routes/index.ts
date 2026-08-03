import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { registerDebugRoutes } from "./debug.js";
export async function registerRoutes(app: FastifyInstance) {
  await healthRoutes(app);
  await app.register(registerDebugRoutes, {
    prefix: "/debug",
});
}