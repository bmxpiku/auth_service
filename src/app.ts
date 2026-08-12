import fastify, { type FastifyInstance } from "fastify";
import { errorHandler } from "./errors/errorHandler.js";
import { buildLoggerConfig } from "./config/loggerConfig.js";
import { getConfig } from "./config/configLoader.js";
import { healthRoutes } from "./routes/health.js";

export function createApp(): FastifyInstance {
  const config = getConfig();
  const app = fastify({
    logger: config.NODE_ENV !== "test" ? buildLoggerConfig(config) : false,
  });

  app.setErrorHandler(errorHandler);

  app.register(healthRoutes);

  return app;
}
