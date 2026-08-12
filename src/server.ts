import { createApp } from "./app.js";
import { loadConfig } from "./config/configLoader.js";

const config = loadConfig();
const app = createApp();

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
