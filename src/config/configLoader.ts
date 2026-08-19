import { z } from "zod";
import { type AppConfig, envSchema } from "./env.js";

let config: AppConfig | null = null;

export function loadConfig() {
  if (config) return config;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(z.treeifyError(parsed.error));
    process.exit(1);
  }

  config = parsed.data;
  return config;
}

export function getConfig(): AppConfig {
  if (!config) {
    throw new Error("Config not loaded. Call loadConfig() first.");
  }
  return config;
}
