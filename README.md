# AI Triage Console

Turn unstructured IT requests into AI-assisted task proposals. **Humans** (Manager) own every approval decision before work becomes Open.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js (App Router) + TypeScript + shadcn/ui + Tailwind |
| Backend | NestJS + TypeScript + TypeORM |
| Database | PostgreSQL (local, port `5432`) |
| Tests | Vitest |
| AI | Deterministic mock-AI by default (`AI_PROVIDER=mock`) |

## Quick start

```bash
# 1) Install
pnpm install

# 2) Ensure local Postgres is running on :5432 with DB/user matching apps/api/.env
#    Example: createuser/createdb for triage / ai_triage (or point .env at your existing instance)

# 3) Configure
cp .env.example apps/api/.env

# 4) Run API (port 3001) and Web (port 3000)
pnpm dev
```

Then open http://localhost:3000 → **Import fixture** (run twice to verify idempotency: still 12 unique source requests).

## Tests

```bash
pnpm test
```

Mandatory coverage: Manager approval gate, Viewer denial, import idempotency for `REQ-001`, duplicate merge `REQ-002`→`REQ-001`, conflict Needs Review for `REQ-003`/`REQ-004`, malformed/low-confidence AI handling.

## Demo roles

Use the header **Demo role** switcher (`Viewer` ↔ `Manager`). The API enforces role via `x-role` header in NestJS guards **and** workflow service checks.

## Architecture summary

- **State:** `Received → Triaged → Draft | Needs Review → Approved → Open` (or `Rejected` / `Merged`)
- **Confidence threshold:** `< 0.70` → Needs Review; also forced by `conflict` / `security` / `privacy` / `duplicate` / `missing-information`
- **AI:** Validates with Zod before persist; malformed/timeout leave request in Needs Review with audit
- See `ARCHITECTURE.md` for data model and trade-offs

## Known limitations

- No real SSO; local role switch only
- Live LLM provider is stubbed (falls back to mock)
- TypeORM `synchronize: true` for local demo (not for production)
- Expects a local PostgreSQL on **5432** (no Docker Compose in this repo)
