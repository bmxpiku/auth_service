import type { FromSchema, JSONSchema } from "json-schema-to-ts";

export const createUserBodySchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: {
      type: "string",
      format: "email",
    },
    password: {
      type: "string",
      minLength: 8,
      maxLength: 72,
    },
  },
} as const satisfies JSONSchema;

export type CreateUserBody = FromSchema<typeof createUserBodySchema>;

export const createUserReply201Schema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    createdAt: { type: "string" },
  },
} as const;

export const errorReplySchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
    details: {
      type: "array",
      items: { type: "object" },
    },
  },
} as const;
