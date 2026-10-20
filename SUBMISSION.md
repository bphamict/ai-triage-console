# Submission

## Identifiers

| Item | Value |
| --- | --- |
| Repository | _(private GitHub URL)_ |
| Tag | `submission-v1` |
| Commit SHA | _(fill after tagging)_ |
| Demo URL / video | _(optional)_ |

## Run & test

```bash
pnpm install
# Ensure local Postgres on :5432 (see apps/api/.env)
cp .env.example apps/api/.env
pnpm dev          # web :3000, api :3001
pnpm test
```

## Checklist

- [x] Mock-AI mode runs; fixture import twice is idempotent (12 unique source requests)
- [x] S1–S5 covered in fixtures + mock-AI map + workflow
- [x] Vitest mandatory cases
- [x] Role enforcement in NestJS service/guard layer
- [x] `.env.example` present; no secrets committed
- [x] `README.md`, `ARCHITECTURE.md`, `AI_USAGE.md`, `SUBMISSION.md`
- [ ] Tag `submission-v1` on evaluated revision

## No-real-data confirmation

This submission contains **only mock data**. No real names, email addresses, credentials, customer information, or proprietary Delements production data are included.
