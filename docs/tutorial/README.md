# Tutorial: auth_service od podstaw (Node.js / Fastify)

Ten katalog to przewodnik dla osób, które znają JavaScript/TypeScript, ale
dopiero poznają backend w Node.js i framework Fastify. Materiały opisują
**wyłącznie kod, który już istnieje** w tym repozytorium — bez planowanych
funkcji (np. logowania/JWT w praktyce), żeby nie mylić stanu faktycznego
z zamierzeniami na przyszłość.

Każdy rozdział zawiera diagram [Mermaid](https://mermaid.js.org/) (renderowany
automatycznie na GitHubie i w większości edytorów z odpowiednim podglądem) oraz
konkretne odnośniki do plików źródłowych.

## Spis treści

1. [00 — Przegląd i cykl życia żądania](./00-przeglad.md)
2. [01 — Fastify: routing, pluginy, walidacja schematów](./01-fastify-podstawy.md)
3. [02 — Konfiguracja i start aplikacji](./02-konfiguracja-i-start.md)
4. [03 — Obsługa błędów](./03-obsluga-bledow.md)
5. [04 — Baza danych i Prisma](./04-baza-danych-prisma.md)
6. [05 — Testowanie](./05-testowanie.md)

Dodatkowo: [mapa architektury (HTML, jedna strona)](./architecture-map.html) —
wizualny przegląd wszystkich warstw z tabelami odpowiedzialności, przeznaczony
do szybkiego przypomnienia sobie struktury projektu (podobny w formie do
[`docs/jwt-cheatsheet.html`](../jwt-cheatsheet.html)).

## Jak czytać ten tutorial

- Rozdziały są ułożone w kolejności, w jakiej żądanie HTTP faktycznie
  przepływa przez system: start procesu → routing → konfiguracja →
  błędy → baza danych → testy.
- Każdy rozdział da się czytać osobno — jeśli szukasz konkretnego tematu
  (np. "jak Prisma mapuje błędy"), przejdź od razu do właściwego pliku.
- Diagramy nie zastępują kodu źródłowego — każdy diagram ma link do
  plików, których dotyczy.

