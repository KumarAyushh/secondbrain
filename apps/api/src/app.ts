import Fastify from "fastify";

import { registerRoutes } from "./routes/index.js";
import logger from "./logger/index.js";
import { registerErrorHandler } from "./errors/index.js";
import requestIdPlugin from "./plugins/request-id.js";
export function buildApp() {
  const app = Fastify({
    // Use loggerInstance to pass your pre-configured Pino logger basically
    //connceting the logger to the fastify app
    loggerInstance: logger,
  });
  app.register(requestIdPlugin);
  registerErrorHandler(app);

  app.register(registerRoutes);
  

  return app;
}