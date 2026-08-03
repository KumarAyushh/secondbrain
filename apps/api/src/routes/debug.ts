import { FastifyInstance } from "fastify";

import { AppError, ERROR_CODES } from "../errors/index.js";

export async function registerDebugRoutes(app: FastifyInstance) {
  app.get("/app-error", async () => {
    throw new AppError(
      "User not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
  });

  app.get("/error", async () => {
    throw new Error("Something went wrong!");
  });
}