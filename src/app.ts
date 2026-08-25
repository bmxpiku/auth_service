import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import autoload from "@fastify/autoload";
import type { Plugin } from "ajv";
import ajvFormats from "ajv-formats";
import fastify, { type FastifyInstance } from "fastify";
import { getConfig } from "./config/configLoader.js";
import { buildLoggerConfig } from "./config/loggerConfig.js";
import { errorHandler } from "./errors/errorHandler.js";
import { closeDb } from "./lib/db.js";

export function createApp(): FastifyInstance {
  const config = getConfig();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const app = fastify({
    logger: config.NODE_ENV !== "test" ? buildLoggerConfig(config) : false,
    ajv: {
      plugins: [ajvFormats.default as Plugin<unknown>],
    },
  });

  app.setErrorHandler(errorHandler);

  app.register(autoload, {
    dir: join(__dirname, "routes"),
  });

  app.addHook("onClose", async () => {
    closeDb();
  });

  return app;
}
