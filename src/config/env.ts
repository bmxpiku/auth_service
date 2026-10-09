import { z } from "zod";

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default("0.0.0.0"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    DATABASE_URL: z.url(),
    // Base64-encoded PKCS8 PEM of the RSA private key used to sign access
    // tokens. Required in production (see superRefine below) so that
    // restarts/redeploys don't invalidate every existing token. Optional in
    // development/test — jwt.ts falls back to generating an ephemeral
    // in-memory keypair when this is absent.
    JWT_PRIVATE_KEY_BASE64: z.string().optional(),
  })
  .superRefine((config, ctx) => {
    if (config.NODE_ENV === "production" && !config.JWT_PRIVATE_KEY_BASE64) {
      ctx.addIssue({
        code: "custom",
        path: ["JWT_PRIVATE_KEY_BASE64"],
        message: "JWT_PRIVATE_KEY_BASE64 is required in production",
      });
    }
  });

export type AppConfig = z.infer<typeof envSchema>;
