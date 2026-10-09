import { randomUUID } from "node:crypto";
import { getConfig } from "../config/configLoader.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { generateOpaqueToken, hashToken } from "../lib/refreshToken.js";

export interface IssueRefreshTokenResult {
  rawToken: string;
  familyId: string;
}

export interface RotateRefreshTokenResult {
  rawToken: string;
  userId: string;
}

export async function issueRefreshToken(
  db: PrismaClient,
  userId: string,
  familyId?: string,
): Promise<IssueRefreshTokenResult> {
  const { REFRESH_TOKEN_TTL_DAYS } = getConfig();
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);

  const resolvedFamilyId = familyId ?? randomUUID();

  await db.refreshToken.create({
    data: {
      tokenHash,
      familyId: resolvedFamilyId,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return {
    rawToken,
    familyId: resolvedFamilyId,
  };
}

// export async function rotateRefreshToken(db: PrismaClient, rawToken: string): Promise<RotateRefreshTokenResult>;

// export async function revokeRefreshTokenFamily(db: PrismaClient, familyId: string): Promise<void>;
