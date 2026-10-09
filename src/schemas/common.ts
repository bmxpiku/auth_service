import type { FromSchema, JSONSchema } from "json-schema-to-ts";

export const errorReplySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    error: { type: "string" },
    message: { type: "string" },
    details: {
      type: "array",
      items: { type: "object" },
    },
  },
} as const satisfies JSONSchema;

export type ErrorReply = FromSchema<typeof errorReplySchema>;
