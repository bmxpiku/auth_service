import type { FromSchema, JSONSchema } from "json-schema-to-ts";

export const healthReply200Schema = {
  type: "object",
  additionalProperties: false,
  required: ["status"],
  properties: {
    status: { type: "string" },
  },
} as const satisfies JSONSchema;

export type HealthReply200 = FromSchema<typeof healthReply200Schema>;
