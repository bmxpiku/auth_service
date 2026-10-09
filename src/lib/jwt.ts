import { createPublicKey, KeyObject } from "node:crypto";
import { exportSPKI, type GenerateKeyPairResult, generateKeyPair, importPKCS8, jwtVerify, SignJWT } from "jose";
import { getConfig } from "../config/configLoader.js";

export const ISSUER = "auth-service"; // kto wystawił token (claim "iss")
export const AUDIENCE = "users-api"; // dla kogo jest token (claim "aud")
const ACCESS_TOKEN_EXPIRATION = "15m"; // po ilu minutach token wygasa
export const ALGORITHM = "RS256"; // RSA + SHA-256, podpis asymetryczny (klucz prywatny/publiczny)

// Cache na parę kluczy — generujemy/wczytujemy ją raz na cały proces,
// nie przy każdym podpisywaniu/weryfikacji tokena.
let keyPairPromise: Promise<GenerateKeyPairResult> | null = null;

// Rozbija JWT ("header.payload.signature") na 3 osobne fragmenty.
export function splitToken(token: string): [header: string, payload: string, signature: string] {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error(`Expected a 3-part JWT, got ${parts.length} parts`);
  }
  const [header, payload, signature] = parts;
  if (!header || !payload || !signature) {
    throw new Error("JWT segment unexpectedly empty");
  }
  return [header, payload, signature];
}

// Dekoduje jeden fragment JWT (base64url) z powrotem do obiektu JS.
// Używane w testach do np. podmiany payloadu (sprawdzenie, że podpis to wykryje).
export function decodeSegment(seg: string): unknown {
  const json = Buffer.from(seg, "base64url").toString("utf8");
  return JSON.parse(json);
}

// Generuje świeżą, losową parę kluczy RSA w pamięci (dev/test fallback —
// nietrwałe, znikają po restarcie procesu, więc stare tokeny przestają działać).
export async function generateRsaKeyPair(): Promise<GenerateKeyPairResult> {
  return generateKeyPair("RS256");
}

// Zwraca parę kluczy do podpisywania/weryfikacji tokenów.
// Produkcja: klucz prywatny bierzemy z env (stały, przetrwa restart/redeploy).
// Dev/test: generujemy tymczasowy klucz w pamięci, jeśli env go nie ma.
async function loadOrGenerateKeyPair(): Promise<GenerateKeyPairResult> {
  const { JWT_PRIVATE_KEY_BASE64, NODE_ENV } = getConfig();

  if (JWT_PRIVATE_KEY_BASE64) {
    // 1. base64 -> tekst PEM (tak trzymamy klucz w jednej linijce w .env)
    const pem = Buffer.from(JWT_PRIVATE_KEY_BASE64, "base64").toString("utf8");

    // 2. PEM -> klucz prywatny (jako CryptoKey, bo tak zwraca jose)
    const privateKey = await importPKCS8(pem, "RS256");

    // 3. CryptoKey -> KeyObject (format node:crypto), żeby móc wyliczyć klucz publiczny
    //    z klucza prywatnego (nie trzeba trzymać osobno obu kluczy w env).
    const publicKeyObject = createPublicKey(KeyObject.from(privateKey));

    // 4. KeyObject -> z powrotem CryptoKey, bo tego oczekuje jose (jwtVerify itp.)
    // `as unknown as CryptoKey`: node:crypto i jose używają dwóch różnych
    // (ale strukturalnie identycznych w runtime) deklaracji typu CryptoKey.
    const publicKey = publicKeyObject.toCryptoKey(
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, // zgodne z RS256
      true, // extractable
      ["verify"], // ten klucz służy tylko do weryfikacji
    ) as unknown as GenerateKeyPairResult["publicKey"];

    return { privateKey, publicKey };
  }

  if (NODE_ENV === "production") {
    // produkcja bez prawdziwego klucza = błąd konfiguracji, nie generujemy fallbacku
    throw new Error("JWT secret is missing");
  }

  // dev/test: brak zmiennej env -> generujemy efemeryczny klucz w pamięci
  return generateRsaKeyPair();
}

// Leniwie inicjalizuje parę kluczy i cache'uje ją w `keyPairPromise`,
// żeby kolejne wywołania (sign/verify) dostawały tę samą parę kluczy.
// Eksportowane wyłącznie na potrzeby testów — pozwala podpisać w teście
// token *tym samym* kluczem co signAccessToken, ale z celowo złymi
// claimami (zły iss/aud, brak sub), żeby przetestować realną
// weryfikację w verifyAccessToken zamiast tylko zachowania samego jose.
export async function getSigningKeyPair() {
  keyPairPromise ??= loadOrGenerateKeyPair();

  return keyPairPromise;
}

// Udostępnione, żeby inni weryfikatorzy (np. wtyczka @fastify/jwt) mogli
// sprawdzać tokeny RS256 podpisane przez signAccessToken bez duplikowania
// logiki generowania/wczytywania kluczy. Opcja `secret.public` w @fastify/jwt
// oczekuje stringa PEM, a nie obiektu CryptoKey z jose — stąd exportSPKI.
export async function getPublicKeyPem(): Promise<string> {
  const { publicKey } = await getSigningKeyPair();
  return exportSPKI(publicKey);
}

// Tworzy i podpisuje nowy access token (JWT) dla danego użytkownika.
export async function signAccessToken(userId: string): Promise<string> {
  const { privateKey } = await getSigningKeyPair();

  return new SignJWT()
    .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
    .setSubject(userId) // claim "sub" — kogo dotyczy token
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt() // claim "iat" — kiedy wystawiono
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(privateKey);
}

// Weryfikuje podpis, wydawcę, odbiorcę i czas ważności tokena,
// a następnie zwraca id użytkownika (claim "sub") zaszyte w środku.
// Rzuca błąd, jeśli token jest nieważny, sfałszowany lub wygasł.
export async function verifyAccessToken(token: string): Promise<{ userId: string }> {
  const { publicKey } = await getSigningKeyPair();
  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Invalid token payload");
  }

  return { userId: payload.sub };
}
