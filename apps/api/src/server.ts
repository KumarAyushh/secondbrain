import { buildApp } from "./app.js";

const app = buildApp();

async function start() {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });

    app.log.info("Server started successfully");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
