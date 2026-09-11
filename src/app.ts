import fastify, { type FastifyInstance } from "fastify";
import type { AppConfig } from "./config/env.js";
import { buildFastifyOptions } from "./config/fastifyOptions.js";
import { errorHandler } from "./errors/errorHandler.js";
import { registerDb } from "./plugins/db.js";
import healthRoutes from "./routes/health.js";
import usersRoutes from "./routes/users.js";

export function createApp(config: AppConfig): FastifyInstance {
  const fastifyOptions = buildFastifyOptions(config);
  const app = fastify(fastifyOptions);

  app.setErrorHandler(errorHandler);

  app.decorate("config", config);
  registerDb(app, config);
  app.register(healthRoutes);
  app.register(usersRoutes);

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    config: AppConfig;
  }
}
