import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { createPrismaClient } from "@secondbrain/db";

import { config } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: ReturnType<typeof createPrismaClient>;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const prisma = createPrismaClient(config.database.url);
  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
