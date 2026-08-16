import fp from "fastify-plugin";
import {Redis} from "ioredis";
import type { FastifyInstance } from "fastify";
import { config } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    ...(config.redis.username ? { username: config.redis.username } : {}),
  });

  redis.on("connect", () => {
    fastify.log.info("Redis connected successfully");
  });

  redis.on("error", (error) => {
    fastify.log.error(error, "Redis connection error");
  });

  //decorate() in Fastify is basically a way to add your own property, method, or utility to the Fastify application instance.
  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async () => {
    await redis.quit();
  });
});
