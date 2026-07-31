import pino from "pino";
import { config } from "../config/env.js";

const isDevelopment = config.app.nodeEnv === "development";
// Initialize the root logger using the config provided in the environment variables
const logger = pino({
    level: config.logging.level,
    ...(isDevelopment && {
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    }),
  });

export default logger;
