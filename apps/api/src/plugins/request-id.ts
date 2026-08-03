import fp from "fastify-plugin";
import { randomUUID } from "node:crypto";
import { FastifyPluginAsync } from "fastify";

const requestIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", async (request) => {
    const incomingId = request.headers["x-request-id"];

    const requestId =
      typeof incomingId === "string"
        ? incomingId
        : randomUUID();

    request.headers["x-request-id"] = requestId;

    request.log = request.log.child({
      requestId,
    });
  });
};

export default fp(requestIdPlugin);