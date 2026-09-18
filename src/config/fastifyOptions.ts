import type { Plugin } from "ajv";
import ajvFormats from "ajv-formats";
import type { FastifyServerOptions } from "fastify";
import type { AppConfig } from "./env.js";
import { buildLoggerConfig } from "./loggerConfig.js";

export function buildFastifyOptions(config: AppConfig): FastifyServerOptions {
  return {
    logger: config.NODE_ENV !== "test" ? buildLoggerConfig(config) : false,
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
      plugins: [ajvFormats.default as Plugin<unknown>],
    },
  };
}
