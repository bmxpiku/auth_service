import fastify, { type FastifyInstance } from "fastify";
import { errorHandler } from "./errors/errorHandler.js";
import { buildLoggerConfig } from "./config/loggerConfig.js";
import { getConfig } from "./config/configLoader.js";
import autoload from "@fastify/autoload";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";



export function createApp(): FastifyInstance {
  const config = getConfig();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const app = fastify({
    logger: config.NODE_ENV !== "test" ? buildLoggerConfig(config) : false,
  });

  app.setErrorHandler(errorHandler);

  app.register(autoload, {
    dir: join(__dirname, "routes")
  });

  return app;
}
