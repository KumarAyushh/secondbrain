import { buildApp } from "./app.js";
import { config } from "./config/env.js";


const app = buildApp();


async function start() {
  try {
    await app.listen({
      port: config.app.port,
      host: "0.0.0.0",
    });

    app.log.info("Server started successfully");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}



let isShuttingDown = false;
async function shutdown() {

  if(isShuttingDown) return;

  isShuttingDown = true;
  app.log.info("Server is shutting down...");

  try {
      await app.close();

      app.log.info("Server shut down successfully");
  } catch (error) {
      app.log.error(error, "Error during server shutdown");
      process.exit(1);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);


start(); 