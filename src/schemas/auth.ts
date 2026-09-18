import type { FromSchema, JSONSchema } from "json-schema-to-ts";

export const loginBodySchema = {
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
      maxLength: 1024,
    },
  },
} as const satisfies JSONSchema;

export type LoginBody = FromSchema<typeof loginBodySchema>;

export const loginReply200Schema = {
  type: "object",
  required: ["access_token"],
  additionalProperties: false,
  properties: {
    access_token: {
      type: "string",
    },
  },
} as const satisfies JSONSchema;

export type LoginReply200 = FromSchema<typeof loginReply200Schema>;

export const meReply200Schema = {
  type: "object",
  required: ["id", "email"],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    email: { type: "string" },
  },
} as const satisfies JSONSchema;

export type MeReply200 = FromSchema<typeof meReply200Schema>;
