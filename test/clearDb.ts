import { getConfig } from "../src/config/configLoader.js";
import { getDb } from "../src/lib/db.js";

export async function resetTestDatabase() {
  const { NODE_ENV, DATABASE_URL } = getConfig();

  if (NODE_ENV !== "test") {
    throw new Error("resetTestDatabase should only be called in test environment");
  }

  if (!new URL(DATABASE_URL).pathname.toLowerCase().includes("test")) {
    throw new Error("resetTestDatabase should only be called with test database");
  }

  await getDb().user.deleteMany({});
}
