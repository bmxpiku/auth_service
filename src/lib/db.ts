import { PrismaPg } from "@prisma/adapter-pg";
import { getConfig } from "../config/configLoader.js";
import { PrismaClient } from "../generated/prisma/client.js";

let _db: PrismaClient | null = null;

export function getDb(): PrismaClient {
  if (!_db) {
    const { DATABASE_URL } = getConfig();
    const adapter = new PrismaPg({ connectionString: DATABASE_URL });
    _db = new PrismaClient({ adapter });
  }
  return _db;
}
