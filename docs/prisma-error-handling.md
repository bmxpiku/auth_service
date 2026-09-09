# Obsługa błędów Prisma — przepływ danych w `withPrismaError`

Ten dokument opisuje, jak błędy zwracane przez Prisma Client są przechwytywane,
wzbogacane o kontekst diagnostyczny i bezpiecznie logowane, bez ujawniania
wrażliwych danych (hasło, hash hasła, pełne body requestu).

## Cel

- Zachować diagnostyczny kontekst błędu (operacja, model, kod Prisma, naruszony
  constraint) w logach serwera.
- Nie logować nigdy danych wrażliwych.
- Zwrócić klientowi API czytelny, ale minimalny komunikat błędu (bez szczegółów
  implementacyjnych bazy danych).

## Uczestnicy przepływu

| Plik | Odpowiedzialność |
|---|---|
| `src/lib/prismaErrors.ts` | Łapie błędy Prisma, tłumaczy kod błędu na domenowy wyjątek, buduje `diagnostics` |
| `src/errors/AppError.ts` | Bazowa klasa błędu domenowego, przenosi `cause` oraz `context` |
| `src/errors/domain/*.ts` | Konkretne typy błędów (`ConflictError`, `NotFoundError`, ...) |
| `src/errors/errorHandler.ts` | Jedyne miejsce, które faktycznie loguje (`request.log`) i wysyła odpowiedź HTTP |
| `src/routes/users.ts` (i inne trasy) | Miejsce wywołania — opisuje, jaka operacja jest wykonywana |

## Diagram przepływu

```
Prisma rzuca PrismaClientKnownRequestError
  (np. P2002, err.meta.target: ["email"])
        │
        ▼
withPrismaError(fn, { operation, model })
  - łapie błąd w try/catch
  - buduje diagnostics = { operation, model, prismaCode, constraint }
  - mapuje kod Prisma na domenowy błąd:
      P2002 → ConflictError(message, { cause: err, context: diagnostics })
      P2025 → NotFoundError(message, { cause: err, context: diagnostics })
      inne  → rethrow (nieobsłużony błąd leci dalej bez zmian)
        │
        ▼
AppError (konstruktor)
  - zapamiętuje error.cause  (surowy błąd Prisma — do logu)
  - zapamiętuje error.context (diagnostics — do logu)
  - statusCode / code są znane od razu (409 / CONFLICT, 404 / NOT_FOUND, ...)
        │
        ▼
Fastify: setErrorHandler(errorHandler)
  errorHandler(error, request, reply):
    if (error instanceof AppError):
      if (error.cause):
        request.log.error(
          { err: error.cause, code: error.code, ...error.context },
          error.message,
        )
      reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      })
        │
        ▼
Log serwera (przykład dla P2002 na polu email):
{
  "level": "error",
  "err": { "message": "Unique constraint failed on the fields: (`email`)" },
  "code": "CONFLICT",
  "operation": "create",
  "model": "User",
  "prismaCode": "P2002",
  "constraint": ["email"],
  "msg": "Resource already exists"
}
        │
        ▼
Odpowiedź HTTP do klienta:
{ "error": "CONFLICT", "message": "Resource already exists" }
```

## Dlaczego kontekst jest budowany w `withPrismaError`, a logowany w `errorHandler`?

`withPrismaError` to zwykła funkcja pomocnicza, wywoływana z poziomu handlera
trasy — **nie ma dostępu** do loggera przypisanego do konkretnego requestu
(`request.log`), który ma już skonfigurowaną redakcję pól wrażliwych (patrz
`src/config/loggerConfig.ts`).

Zamiast importować osobny, globalny logger do `prismaErrors.ts` (co
rozjechałoby się z konfiguracją Fastify), diagnostyczny kontekst jest
**dołączany do samego błędu** (`AppError.context`) i przekazywany dalej przez
zwykły mechanizm wyjątków JavaScript. Faktyczne logowanie odbywa się w jednym,
centralnym miejscu — `errorHandler.ts` — które jako jedyne ma dostęp do
`request.log`.

Dzięki temu:
- logowanie ma jedną, przewidywalną lokalizację (łatwiej o audyt: "gdzie w
  kodzie coś jest zapisywane do logów?"),
- `withPrismaError` pozostaje czystą funkcją bez efektów ubocznych związanych
  z I/O logowania,
- redakcja pól wrażliwych skonfigurowana dla `request.log` działa automatycznie
  również dla błędów Prisma.

## Co NIGDY nie trafia do logów

- `password` / `passwordHash` — nie są częścią `diagnostics` ani `err.message`
  zwracanego przez Prisma dla naruszeń unikalności (Prisma loguje tylko nazwy
  kolumn z `err.meta.target`, nigdy wartości).
- Pełne `request.body` — `withPrismaError` i `errorHandler` nie mają do niego
  dostępu; operują wyłącznie na obiekcie błędu.

## Kontrakt wywołania

Każde użycie `withPrismaError` musi jawnie opisać wykonywaną operację:

```typescript
const user = await withPrismaError(
  () => getDb().user.create({ data: { email, passwordHash } }),
  { operation: "create", model: "User" },
);
```

To wymuszenie parametru `context` jest celowe — zapobiega sytuacji, w której
ktoś doda nowe wywołanie `withPrismaError` bez opisania, co się dzieje, co
utrudniłoby debugowanie w przyszłości.

