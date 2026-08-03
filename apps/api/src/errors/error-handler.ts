import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyTypeProvider,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerBase,
} from "fastify";

import { AppError } from "./app-error.js";
import { ERROR_CODES } from "./error-codes.js";

export function registerErrorHandler<
  RawServer extends RawServerBase,
  RawRequest extends RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer>,
  Logger extends FastifyBaseLogger,
  TypeProvider extends FastifyTypeProvider,
>(app: FastifyInstance<RawServer, RawRequest, RawReply, Logger, TypeProvider>) {
  app.setErrorHandler(
    (error, request, reply) => {
      // Log every error this is fastify default error handler
      request.log.error(error);

      // Handle expected application errors
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      // Handle unexpected errors
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: "Internal Server Error",
        },
      });
    }
  );
}
