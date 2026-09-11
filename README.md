# Auth service

## Requirements

- Node.js 24
- nvm
- npm
- (optionally)docker with node

With `nvm` installed, select the expected Node.js version with:

```sh
nvm use
```

## Getting started

```sh
npm install
npm run dev
```

The service listens on `http://localhost:3000` by default.


## Commands

- `npm run dev` - run the service in watch mode
- `npm test` - run the test suite once
- `npm run typecheck` - check TypeScript types
- `npm run build` - compile the service to `dist/`
- `npm start` - run the compiled service (run `npm run build` first)

## Docs

- [`docs/prisma-error-handling.md`](docs/prisma-error-handling.md) - Prisma error handling flow
- [`docs/jwt-manual.md`](docs/jwt-manual.md) - JWT/JWS/JWE theory, HS256 vs RS256, claims, best practices, and `jose` usage notes
- [`docs/jwt-cheatsheet.html`](docs/jwt-cheatsheet.html) - one-page printable (monochrome, A4) JWT cheat sheet
