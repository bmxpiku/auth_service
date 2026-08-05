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