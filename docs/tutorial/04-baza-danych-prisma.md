# 04 — Baza danych i Prisma

## Model danych

Jedyny model w [`prisma/schema.prisma`](../../prisma/schema.prisma) to `User`:

```mermaid
erDiagram
    USER {
        string id PK "uuid(7), domyślnie generowany"
        string email UK "unikalny, znormalizowany do lowercase"
        string passwordHash "hash argon2id, NIGDY plaintext"
        datetime createdAt "default(now())"
        datetime updatedAt "auto-update"
    }
```

Uwagi:
- `id` używa `uuid(7)` — UUID w wersji 7 jest sortowalny w czasie (przydatne
  do indeksów i paginacji po czasie utworzenia), w odróżnieniu od losowego
  `uuid(4)`.
- Tabela jest zmapowana na `users` (`@@map("users")`) — konwencja: nazwa
  modelu Prisma w PascalCase, nazwa tabeli SQL w snake_case/liczbie mnogiej.
- Generator Prisma Client (`provider = "prisma-client"`) generuje kod do
  [`src/generated/prisma/`](../../src/generated/prisma) — **nigdy nie edytuj
  tych plików ręcznie**, tylko uruchom `npm run db:generate` po zmianie
  schematu.

## Singleton `getDb()` i adapter sterownika

[`src/lib/db.ts`](../../src/lib/db.ts) nie tworzy `PrismaClient` na starcie
modułu — robi to leniwie, przy pierwszym wywołaniu `getDb()`:

```mermaid
sequenceDiagram
    participant Route as handler trasy
    participant DbMod as db.ts
    participant Config as getConfig()
    participant Adapter as PrismaPg (@prisma/adapter-pg)
    participant Prisma as PrismaClient

    Route->>DbMod: getDb()
    alt pierwsze wywołanie (_db === null)
        DbMod->>Config: getConfig() → DATABASE_URL
        DbMod->>Adapter: new PrismaPg({ connectionString })
        DbMod->>Prisma: new PrismaClient({ adapter })
        DbMod->>DbMod: zapamiętaj w _db
    end
    DbMod-->>Route: _db (ta sama instancja za każdym razem)
```

Dlaczego to ważne:
- **Leniwa inicjalizacja** oznacza, że `getDb()` też zależy od `getConfig()`,
  więc — tak samo jak `createApp()` — nie może być wołane na poziomie modułu
  (patrz [`02-konfiguracja-i-start.md`](./02-konfiguracja-i-start.md)).
- **Singleton** (`_db` w domknięciu modułu) zapobiega tworzeniu wielu puli
  połączeń do bazy w ramach jednego procesu.
- `PrismaPg` to *driver adapter* — warstwa pośrednicząca między Prisma Client
  a biblioteką `pg` (surowy sterownik Postgresa). To standardowy sposób
  konfiguracji połączenia w Prisma ORM 7.
- `closeDb()` jest wołane w hooku `onClose` aplikacji Fastify
  ([`src/app.ts`](../../src/app.ts)) — połączenie do bazy jest poprawnie
  zamykane przy zatrzymaniu serwera (`close-with-grace` w
  [`src/server.ts`](../../src/server.ts)).

## Migracje: jak zmiana w `schema.prisma` trafia do bazy

```mermaid
flowchart LR
    A["Edytuj prisma/schema.prisma"] --> B["npm run db:migrate\n(prisma migrate dev)"]
    B --> C["Nowy folder w\nprisma/migrations/&lt;timestamp&gt;_.../migration.sql"]
    C --> D["Migracja zaaplikowana\nna lokalnej bazie (db-dev)"]
    B --> E["npm run db:generate\n(prisma generate)"]
    E --> F["Regeneracja\nsrc/generated/prisma/*"]
```

Dla testów integracyjnych osobna baza (`db-test`, port 5433) jest
migrowana komendą `npm run db:migrate:test`, która używa `prisma migrate
deploy` (bez interaktywnego promptu, bez tworzenia nowych plików migracji —
tylko aplikuje istniejące).

## Od błędu Prisma do odpowiedzi HTTP (skrót)

Szczegóły w [`03-obsluga-bledow.md`](./03-obsluga-bledow.md) i
[`docs/prisma-error-handling.md`](../prisma-error-handling.md). W skrócie:

```mermaid
flowchart LR
    A["getDb().user.create(...)"] -->|"unikalny e-mail\njuż istnieje"| B["PrismaClientKnownRequestError\ncode: P2002"]
    B --> C["withPrismaError mapuje\nP2002 → ConflictError"]
    C --> D["errorHandler → 409 CONFLICT"]
```

## Zobacz też

- [`03-obsluga-bledow.md`](./03-obsluga-bledow.md) — hierarchia błędów i globalny handler
- [`05-testowanie.md`](./05-testowanie.md) — jak testy integracyjne korzystają z realnej bazy `db-test`

