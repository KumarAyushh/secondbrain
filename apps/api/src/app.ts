import Fastify from "fastify";
import { registerRoutes } from "./routes/index.js";
import logger from "./logger/index.js";
export function buildApp() {
  const app = Fastify({
    // Use loggerInstance to pass your pre-configured Pino logger basically
    //connceting the logger to the fastify app
    loggerInstance: logger,
  });

  app.register(registerRoutes);

  return app;
}