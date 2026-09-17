# JWT Manual — Theory, Practice with `jose`, and Best Practices

This document is preparation material for implementing token-based authentication
in this service using the [`jose`](https://github.com/panva/jose) library. It
covers the underlying theory first (library-agnostic), then how the concepts
map onto `jose` APIs.

---

## 1. Authentication vs Authorization

These two terms are often confused but answer different questions:

| | Question it answers | Example |
|---|---|---|
| **Authentication (AuthN)** | *Who are you?* | Verifying a user's password/credentials at login |
| **Authorization (AuthZ)** | *What are you allowed to do?* | Checking if the authenticated user can `DELETE /users/:id` |

A JWT is commonly used as the **result of authentication** (proof of identity)
that is then **used for authorization** on subsequent requests — the token
carries claims (like a role or scope) that the server uses to decide access.

> Authentication happens once (login). Authorization is checked on every
> protected request, usually by reading claims from the previously issued token.

---

## 2. JWT, JWS, and JWE

**JWT (JSON Web Token)** is not a standalone crypto format — it's a *container
format* (RFC 7519) for claims (a JSON payload) that must be wrapped in either:

- **JWS (JSON Web Signature, RFC 7515)** — the payload is **signed**, not
  encrypted. Anyone can read it (it's base64url, not encrypted), but tampering
  is detectable because the signature won't verify.
- **JWE (JSON Web Encryption, RFC 7516)** — the payload is **encrypted**.
  Nobody without the decryption key can read the contents.

```
JWT = an abstract token spec
├── JWS-based JWT  → "signed JWT"   → 99% of what people mean by "JWT"
└── JWE-based JWT  → "encrypted JWT" → rarer, used when payload must stay secret
```

A **signed JWT (JWS)** has 3 base64url segments separated by dots:

```
header.payload.signature
```

An **encrypted JWT (JWE)** has 5 segments:

```
header.encryptedKey.iv.ciphertext.tag
```

In this project, when we say "JWT" we mean the standard **signed JWT (JWS)**
form, since that's what `jose`'s `SignJWT` / `jwtVerify` produce and consume.

---

## 3. Why a Signed JWT Is NOT Encrypted

This is one of the most common misconceptions. A signed JWT (JWS) only
guarantees **integrity** (nothing was tampered with) and **authenticity**
(it was issued by someone holding the signing key) — it does **not**
guarantee **confidentiality**.

- The header and payload are just **base64url-encoded**, not encrypted.
- Anyone can decode a JWT with a browser console or `jwt.io` and read every
  claim inside it — no key needed.
- Only the **signature** is cryptographic proof of who created it and that
  it wasn't modified afterward.

**Consequence:** never put secrets (passwords, raw PII, internal-only data)
inside a signed JWT payload. If confidentiality is required, use a JWE, or
better: keep the JWT payload minimal (identity + a few claims) and look up
sensitive data server-side using the subject (`sub`) claim.

---

## 4. Private Key vs Public Key (Asymmetric Signing)

Relevant only for asymmetric algorithms (e.g. RS256, ES256):

| Key | Used for | Who holds it |
|---|---|---|
| **Private key** | **Signing** tokens | Only the issuer (e.g. the auth server) |
| **Public key** | **Verifying** signatures | Anyone who needs to trust the token (other services, API gateways) |

Because the public key *cannot* be used to forge a signature (only to check
one), it can be freely distributed — e.g. published at a `/.well-known/jwks.json`
endpoint (JWKS) — so multiple downstream services can verify tokens without
ever having access to the signing key.

With **symmetric** algorithms (e.g. HS256) there is only **one shared secret**
used for both signing and verifying — see below.

---

## 5. HS256 vs RS256

| | HS256 (HMAC + SHA-256) | RS256 (RSA + SHA-256) |
|---|---|---|
| Key type | Symmetric — **one shared secret** | Asymmetric — **private/public key pair** |
| Who can sign | Anyone with the secret | Only the holder of the private key |
| Who can verify | Anyone with the *same* secret | Anyone with the public key |
| Key distribution risk | If the secret leaks to *any* verifier, that party could also forge tokens | Public key can be shared freely; private key never leaves the issuer |
| Best for | Single service (issuer == verifier), simple monoliths | Multiple services/consumers verifying tokens issued by one trusted authority |
| Performance | Faster (HMAC is cheap) | Slower (RSA operations are heavier) |
| Typical key size | 256+ bit secret | 2048/4096-bit RSA key |

### Rule of thumb — when to use which

- **HS256 (symmetric):** use when the **same service** both issues and
  verifies tokens (e.g. a monolith, or this auth service validating its own
  tokens internally). Simpler to set up — just a shared secret via env var.
- **RS256 (asymmetric):** use when **other services** (microservices, third
  parties, API gateways, frontends) need to **verify** tokens **without being
  trusted to issue** them. The private key stays only on the auth server; every
  other party gets just the public key (or a JWKS endpoint).

> If in doubt in a microservices architecture: prefer asymmetric (RS256 or
> ES256) so that verification can be distributed without expanding the trust
> boundary that could forge tokens.

---

## 6. Header, Payload, and Signature

A signed JWT is three base64url-encoded segments:

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9   <- header
.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0=  <- payload
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  <- signature
```

### Header

Metadata about the token itself:

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "2026-09-key-1"
}
```

- `alg` — the signing algorithm used (critical to validate server-side —
  never trust the `alg` from an untrusted token blindly, see §8).
- `typ` — always `"JWT"` for this token type.
- `kid` (optional) — Key ID, used to pick the correct verification key when
  multiple keys are in rotation (see JWKS).

### Payload

The actual claims (data) — see §7 for the standard ones. Can also contain
custom/private claims, e.g. `role`, `permissions`.

### Signature

Computed as (for JWS):

```
signature = Sign(
  base64url(header) + "." + base64url(payload),
  <private key or shared secret>,
  algorithm
)
```

The receiving party recomputes this and compares — if it doesn't match, the
token is rejected (tampered or forged).

---

## 7. Standard Registered Claims

Defined in RFC 7519 §4.1. All are optional but conventionally used:

| Claim | Name | Meaning | Type |
|---|---|---|---|
| `iss` | Issuer | Who created/issued the token (e.g. `"https://auth.example.com"`) | string/URI |
| `sub` | Subject | Who the token is about — usually the user ID | string |
| `aud` | Audience | Who the token is intended for (which API/service should accept it) | string or array |
| `iat` | Issued At | Unix timestamp when the token was created | number |
| `nbf` | Not Before | Unix timestamp before which the token must NOT be accepted | number |
| `exp` | Expiration | Unix timestamp after which the token is invalid | number |
| `jti` | JWT ID | Unique identifier for this specific token (useful for revocation/replay-detection) | string |

### Why each matters in practice

- **`iss`** — verify it matches the expected trusted issuer; prevents
  accepting tokens from an unrelated/malicious issuer.
- **`sub`** — the anchor for "who is this about" — typically the primary key
  used to look up the user record.
- **`aud`** — prevents a token issued for Service A being replayed against
  Service B ("confused deputy" attack). Always verify `aud` matches the
  current service's expected identifier.
- **`iat`** — useful for auditing/logging and computing token age; combined
  with `exp` to derive lifetime.
- **`nbf`** — rarely needed, but useful for tokens that shouldn't be usable
  until a future point (e.g. scheduled activation).
- **`exp`** — **always required** for access tokens. Short-lived access
  tokens (minutes) limit the damage window if a token leaks.
- **`jti`** — needed if you want to support **revocation** (e.g. blocklist a
  specific token) or detect **replay** of a one-time-use token (e.g. refresh
  tokens, email verification links).

---

## 8. Good vs Bad Practices

### ✅ Good practices

- Always verify `exp`, `nbf`, `iss`, and `aud` on every incoming token — don't
  just check the signature.
- Use short expiration for **access tokens** (minutes, e.g. 15 min) and a
  separate, longer-lived **refresh token** (stored securely, ideally
  rotated/single-use) for renewing access tokens.
- Keep the payload **minimal** — only what's needed to authorize the request
  (e.g. `sub`, `role`). Look up the rest server-side.
- Prefer **asymmetric** signing (RS256/ES256) when tokens are verified by
  multiple services — keeps the private key isolated to the issuer.
- Rotate signing keys periodically; use `kid` + a JWKS endpoint so verifiers
  pick up new keys without downtime.
- Pin/allowlist the **expected algorithm** when verifying (`jose`'s
  `jwtVerify(token, key, { algorithms: ["RS256"] })`) — never accept
  whatever `alg` the token claims.
- Use HTTPS everywhere tokens are transmitted; treat tokens like passwords in
  transit.
- Store refresh tokens (and, in browsers, ideally access tokens too) in
  `httpOnly`, `Secure`, `SameSite` cookies rather than `localStorage`, to
  reduce XSS exfiltration risk.
- Include a `jti` and maintain a revocation list/blocklist for tokens you
  must be able to invalidate immediately (e.g. logout, compromised account).

### ❌ Bad practices

- **`alg: none` / algorithm confusion attacks** — some libraries historically
  accepted `"alg": "none"` (no signature at all) or allowed an attacker to
  swap `RS256` → `HS256` and use the *public key* as the HMAC secret to forge
  a valid-looking signature. Mitigation: always pin the accepted algorithm(s)
  explicitly when verifying, never derive it from the token header alone.
- Storing secrets, passwords, or full sensitive PII in the JWT payload —
  remember, it's only base64url-encoded, **not encrypted** (§3).
- Using a single long-lived token with no expiration for everything (no
  refresh flow) — a leaked token then grants indefinite access.
- Trusting a token without verifying its signature (e.g. only decoding it
  client-side/server-side without calling a `verify` function).
- Sharing the same HMAC secret across multiple untrusted services (any of
  them could then forge tokens for the others).
- Ignoring `aud` — accepting any token as long as the signature is valid,
  even if it was issued for a completely different service.
- Putting excessively large payloads in the JWT (e.g. entire user profiles) —
  bloats every request header and increases exposure if leaked.

---

## 9. `jose` in Practice

[`jose`](https://github.com/panva/jose) is a modern, dependency-free (Web
Crypto / Node crypto based) JWT/JWS/JWE library with first-class ESM and
TypeScript support — a good fit for this project (`"type": "module"`, Fastify
5, TypeScript with `NodeNext`).

### Symmetric (HS256) — sign & verify with a shared secret

```ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET); // >= 32 bytes

// Sign
const token = await new SignJWT({ role: "user" })
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setIssuer("auth-service")
  .setSubject(user.id)
  .setAudience("auth-service-api")
  .setIssuedAt()
  .setExpirationTime("15m")
  .setJti(crypto.randomUUID())
  .sign(secret);

// Verify
const { payload } = await jwtVerify(token, secret, {
  issuer: "auth-service",
  audience: "auth-service-api",
  algorithms: ["HS256"], // pin the algorithm explicitly
});
```

### Asymmetric (RS256) — sign with private key, verify with public key

```ts
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from "jose";

// Loaded once at startup (e.g. from env/secret manager, PEM-encoded)
const privateKey = await importPKCS8(process.env.JWT_PRIVATE_KEY_PEM!, "RS256");
const publicKey = await importSPKI(process.env.JWT_PUBLIC_KEY_PEM!, "RS256");

// Sign (only the issuer does this)
const token = await new SignJWT({ role: "admin" })
  .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: "2026-09-key-1" })
  .setIssuer("auth-service")
  .setSubject(user.id)
  .setAudience("downstream-service")
  .setIssuedAt()
  .setExpirationTime("15m")
  .sign(privateKey);

// Verify (any downstream service, only needs the public key)
const { payload } = await jwtVerify(token, publicKey, {
  issuer: "auth-service",
  audience: "downstream-service",
  algorithms: ["RS256"],
});
```

### Notes for this project's Fastify setup

- Load/parse keys **once** (e.g. lazily via a singleton similar to `getDb()`
  in `src/lib/db.ts`), not on every request.
- Add a Fastify `onRequest`/`preHandler` hook (or a plugin registered like
  routes in `src/routes/`) that calls `jwtVerify` and attaches the decoded
  `payload` to the request, throwing an `UnauthorizedError` (see
  `src/errors/domain/UnauthorizedError.ts`) on failure — following the
  existing "throw, don't reply manually" convention from `AGENTS.md`.
- Add required secrets/keys to `src/config/env.ts`'s `envSchema` (e.g.
  `JWT_SECRET`, or `JWT_PRIVATE_KEY_PEM`/`JWT_PUBLIC_KEY_PEM`) so they're
  validated at startup like `DATABASE_URL`.
- `jwtVerify` throws on expiry/bad signature/claim mismatch — catch and map
  to `UnauthorizedError`, mirroring the `withPrismaError` pattern documented
  in `docs/prisma-error-handling.md`.

---

## 10. Quick Reference Summary

- **AuthN** = who you are, **AuthZ** = what you can do.
- **JWT** = container spec; **JWS** = signed (readable, tamper-evident);
  **JWE** = encrypted (confidential).
- A signed JWT is **not encrypted** — never put secrets in the payload.
- **Private key signs, public key verifies** (asymmetric only).
- **HS256** = one shared secret, single-issuer-verifier setups.
  **RS256** = key pair, multi-verifier setups.
- Token = `header.payload.signature`; always validate `exp`, `nbf`, `iss`,
  `aud` in addition to the signature.
- Pin the expected algorithm(s) when verifying — never trust the token's own
  `alg` claim blindly.

