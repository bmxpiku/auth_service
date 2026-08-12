import type { FastifyServerOptions } from 'fastify';
import type { AppConfig } from './env.js';

// Function avoids calling getConfig() at module load time,
// which would crash in tests before loadConfig() is called.
export function buildLoggerConfig(config: AppConfig): FastifyServerOptions["logger"] {
    return {
        level: config.LOG_LEVEL,
        redact: {
            paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                // works only if we're gonna log request.body by hand {body: request.body }
                "body.password",
                "body.passwordConfirm",
                "body.currentPassword",
                "body.token",
                "body.refreshToken",
            ],
            censor: "[REDACTED]",
        },
        serializers: {
            req(req) {
                return {
                    method: req.method,
                    url: req.url
                }
            },
            res(res) {
                return {
                    statusCode: res.statusCode,
                }
            }
        }
    }
}