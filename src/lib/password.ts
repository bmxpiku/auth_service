import argon2 from "argon2";

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,p=4,t=3$SE49KmZi05UqTbGBInDkwQ$/6RmSwpzmwD5KXBJNtaThXlmyOVQJEWVc4whaeHxCsc"; // Precomputed hash for a dummy password

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function verifyDummyPassword(password: string): Promise<void> {
  await verifyPassword(DUMMY_PASSWORD_HASH, password); // Perform dummy verification to mitigate timing attacks
}
