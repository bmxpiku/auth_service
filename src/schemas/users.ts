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
  additionalProperties: false,
  required: ["id", "email", "createdAt"],
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    createdAt: { type: "string" },
  },
} as const satisfies JSONSchema;

export type CreateUserReply201 = FromSchema<typeof createUserReply201Schema>;

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
