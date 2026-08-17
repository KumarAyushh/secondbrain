import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.js";

/** Creates a Prisma client backed by PostgreSQL's connection pool. */
export function createPrismaClient(databaseUrl: string) {
  return new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
}
