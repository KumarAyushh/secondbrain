import { FastifyInstance } from "fastify";

export async function redisTestRoutes(app: FastifyInstance) {
  app.get("/redis_test", async () => {
    await app.redis.set("test:key", "Redis is working");

    const value = await app.redis.get("test:key");

    await app.redis.del("test:key");

    return {
      success: true,
      value,
    };
  });
}