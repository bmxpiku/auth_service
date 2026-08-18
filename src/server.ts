import { createApp } from "./app.js";
import { loadConfig } from "./config/configLoader.js";
import closeWithGrace from "close-with-grace";

async function start() {
  const config = loadConfig();
  const app = createApp();

  closeWithGrace({ delay: 10_000}, async ({err, signal}) => {
    if (err) {
      app.log.error({ err, signal }, "Shutdown triggered by error");
    } else {
      app.log.info({signal}, "Shutdown signal received");
    }

    await app.close();
  })

  try {
    await app.listen({host: config.HOST, port: config.PORT});
  } catch (error) {
    app.log.error({ err: error }, "Server failed to start");
    process.exitCode = 1;
  }
}

void start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
