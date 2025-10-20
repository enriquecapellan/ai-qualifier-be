# AI Qualifier — Backend

NestJS API that:

- Authenticates users (JWT)
- Registers a company by domain (scrapes + summarizes)
- Generates an ICP via OpenAI
- Qualifies prospects against the ICP
- Streams onboarding progress via WebSockets

## Tech Stack

- NestJS, TypeScript
- Drizzle ORM + PostgreSQL
- socket.io (Gateway)
- OpenAI (ICP/prospect analysis)

## Requirements

- Node.js 20+
- Yarn
- PostgreSQL
- OpenAI API Key

## Setup

1. Install

```bash
yarn
```

2. Env
   Create `.env` (example):

```bash
PORT=3000
JWT_SECRET=change-me
DATABASE_URL=postgres://user:pass@localhost:5432/ai_qualifier
OPENAI_API_KEY=sk-...
```

3. Database
   Run migrations (adjust to your local flow):

```bash
yarn migration:generate
yarn migration:push
```

4. Run

```bash
yarn start:dev
```

API at http://localhost:3000, socket.io at ws://localhost:3000.

## API Overview

- Auth
  - POST `/auth/signup`
  - POST `/auth/login`
  - GET `/auth/profile`
- Companies
  - POST `/companies` — body: `{ domain: string }` (scrapes + saves + kicks off ICP generation)
  - GET `/companies/me`
  - GET `/companies/:id`
- ICP
  - POST `/icps/generate/:companyId`
  - GET `/icps/company/:companyId`
  - GET `/icps/:id`
- Prospects
  - POST `/prospects/qualify/:companyId` — body: `{ domains: string }` (comma-separated)
  - GET `/prospects/:companyId`

## WebSocket Usage

- Client connects with `auth.token` (JWT).
- On connect: emit `join-user-room`.
- Progress events: `progress-update` with `{ step, message, progress, completed?, companyId?, error? }`.

## Important Commands

```bash
yarn             # install
yarn start:dev   # dev
yarn start       # prod
yarn test        # unit tests (if configured)
```

## Testing

### Unit tests

```bash
yarn test
```

### Watch/coverage

```bash
yarn test --watch
yarn test:cov
```


## Decision Rationale

- NestJS: modular architecture (auth, companies, icp, prospects, websocket) and DI-friendly.
- Drizzle ORM: type-safe schema + migrations for Postgres.
- socket.io: simple authenticated rooms per user to push onboarding progress.
- Single qualification endpoint: supports multiple domains or a single domain (used by “Regenerate”) — keeps API surface minimal.
- Defensive checks:
  - Company existence before ICP generation
  - Conflict on duplicate ICP per company

## Troubleshooting

- 401s: ensure `Authorization: Bearer <token>` is present; `JWT_SECRET` must match.
- DB connection: verify `DATABASE_URL` and that migrations ran.
- OpenAI errors: confirm `OPENAI_API_KEY` and check rate limiting.
- WebSocket auth: ensure clients pass JWT in the connection `auth` payload.
