# AI usage

## Tools used

- **Cursor Agent (Composer)** — scaffolded the monorepo with official CLIs (`create-next-app`, `shadcn`, `@nestjs/cli`), implemented NestJS modules, mock-AI map, Next.js UI, Vitest suites, and handoff docs from `REQUIREMENT.md`.

## What AI assisted with

- Boilerplate generation and module wiring (TypeORM entities, guards, controllers)
- Deterministic mock-AI fixture content covering S1–S5
- shadcn/ui screen composition (list, detail, audit, role switcher)
- Drafting README / ARCHITECTURE / test cases aligned to acceptance scenarios

## What was personally validated

- Official CLI init commands for Next.js, shadcn/ui, and NestJS
- Fixture IDs `REQ-001`–`REQ-012` preserved; import idempotency strategy (stable `externalId`)
- Manager vs Viewer enforcement in service + guard layers
- Vitest mandatory controls (`pnpm test`)
- Local PostgreSQL on port 5432 and API/Web ports 3001/3000
- No paid model key required; mock-AI is the default path
- No real names, emails, credentials, or customer data in fixtures
