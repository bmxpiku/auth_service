import fastifyJwt from "@fastify/jwt";
import fastify, { type FastifyInstance } from "fastify";
import type { AppConfig } from "./config/env.js";
import { buildFastifyOptions } from "./config/fastifyOptions.js";
import { errorHandler } from "./errors/errorHandler.js";
import { AUDIENCE, getPublicKeyPem, ISSUER } from "./lib/jwt.js";
import { dbPlugin } from "./plugins/db.js";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import usersRoutes from "./routes/users.js";

export function createApp(config: AppConfig): FastifyInstance {
  const fastifyOptions = buildFastifyOptions(config);
  const app = fastify(fastifyOptions);

  app.setErrorHandler(errorHandler);

  app.decorate("config", config);
  app.register(dbPlugin, { connectionString: config.DATABASE_URL });
  // Verify-only: tokens are still signed with jose's signAccessToken (src/lib/jwt.ts).
  // This plugin only gives authGuard a request.jwtVerify() to call instead of
  // calling jose's verifyAccessToken directly.
  app.register(fastifyJwt, {
    secret: { public: getPublicKeyPem },
    verify: { algorithms: ["RS256"], allowedIss: ISSUER, allowedAud: AUDIENCE },
  });
  app.register(healthRoutes);
  app.register(usersRoutes);
  app.register(authRoutes);

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    config: AppConfig;
  }
}
