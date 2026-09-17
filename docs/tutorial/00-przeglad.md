# 00 — Przegląd i cykl życia żądania

## Dwa punkty wejścia

Projekt ma dwa istotne pliki startowe:

| Plik | Rola |
|---|---|
| [`src/server.ts`](../../src/server.ts) | uruchamia realny proces Node.js — nasłuchuje na porcie, obsługuje graceful shutdown |
| [`src/app.ts`](../../src/app.ts) | fabryka aplikacji Fastify (`createApp()`) — używana zarówno przez `server.ts`, jak i przez testy (`app.inject()`, bez realnego portu) |

Ten podział jest celowy: testy (`test/health.test.ts`, `test/integration/users.test.ts`)
mogą stworzyć instancję Fastify przez `createApp()` i wysyłać do niej żądania
w pamięci, bez otwierania prawdziwego gniazda sieciowego.

## Kolejność startu (`npm run dev` → serwer nasłuchuje)

```mermaid
sequenceDiagram
    participant CLI as npm run dev (tsx watch)
    participant Server as server.ts
    participant Config as configLoader.ts
    participant App as app.ts (createApp)
    participant Fastify as instancja Fastify

    CLI->>Server: import + start()
    Server->>Config: loadConfig()
    Config->>Config: envSchema.safeParse(process.env)
    alt env niepoprawny
        Config-->>Server: process.exit(1)
    end
    Server->>App: createApp()
    App->>Config: getConfig()
    App->>Fastify: fastify({ logger, ajv })
    App->>Fastify: setErrorHandler(errorHandler)
    App->>Fastify: register(healthRoutes)
    App->>Fastify: register(usersRoutes)
    App->>Fastify: addHook("onClose", closeDb)
    App-->>Server: app
    Server->>Fastify: app.listen({ host, port })
    Server->>Server: closeWithGrace(...) — nasłuch SIGINT/SIGTERM
```

**Uwaga o kolejności**: `loadConfig()` musi zostać wywołane *przed*
`createApp()`, bo `createApp()` woła `getConfig()`, które rzuca wyjątek, jeśli
konfiguracja nie została jeszcze wczytana. Zobacz
[`02-konfiguracja-i-start.md`](./02-konfiguracja-i-start.md).

## Cykl życia pojedynczego żądania HTTP

Na przykładzie `POST /users` (zobacz [`src/routes/users.ts`](../../src/routes/users.ts)):

```mermaid
flowchart TD
    A[Klient: POST /users] --> B["AJV: walidacja request.body\nwg createUserBodySchema"]
    B -- niepoprawne dane --> B1["400 Bad Request\n(errorHandler: error.validation)"]
    B -- poprawne dane --> C[handler w users.ts]
    C --> D["normalizeEmail(email)"]
    C --> E["argon2.hash(password)"]
    D --> F["withPrismaError(() => db.user.create(...))"]
    E --> F
    F -- sukces --> G["201 Created\n{ id, email, createdAt }"]
    F -- P2002 unique --> H["ConflictError\n→ errorHandler → 409"]
    F -- inny błąd --> I["errorHandler → 500"]
```

## Co dalej

- Jak dokładnie działa routing i walidacja schematów: [`01-fastify-podstawy.md`](./01-fastify-podstawy.md)
- Jak działa `loadConfig()`/`getConfig()`: [`02-konfiguracja-i-start.md`](./02-konfiguracja-i-start.md)
- Jak błędy trafiają do `errorHandler`: [`03-obsluga-bledow.md`](./03-obsluga-bledow.md)

