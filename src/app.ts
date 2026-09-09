import type { Plugin } from "ajv";
import ajvFormats from "ajv-formats";
import fastify, { type FastifyInstance } from "fastify";
import { getConfig } from "./config/configLoader.js";
import { buildLoggerConfig } from "./config/loggerConfig.js";
import { errorHandler } from "./errors/errorHandler.js";
import { closeDb } from "./lib/db.js";
import healthRoutes from "./routes/health.js";
import usersRoutes from "./routes/users.js";

export function createApp(): FastifyInstance {
  const config = getConfig();

  const app = fastify({
    logger: config.NODE_ENV !== "test" ? buildLoggerConfig(config) : false,
    ajv: {
      // Fastify's default AJV option `removeAdditional: true` silently strips
      // fields instead of rejecting them when `additionalProperties: false`
      // is set in a schema. We want strict rejection (400), so we disable it.
      customOptions: {
        removeAdditional: false,
      },
      plugins: [ajvFormats.default as Plugin<unknown>],
    },
  });

  app.setErrorHandler(errorHandler);

  app.register(healthRoutes);
  app.register(usersRoutes);

  app.addHook("onClose", async () => {
    await closeDb();
  });

  return app;
}
