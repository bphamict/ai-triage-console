# Architecture

## State model

```text
Received → Triaged → Draft | Needs Review → Approved → Open
                              ↘ Rejected (terminal)
                              ↘ Merged (terminal)
```

Invalid transitions are rejected in `workflow.transitions.ts` at the service layer. Manager-only targets: `Approved`, `Rejected`, `Merged`, `Open`.

AI may only recommend `Draft` or `Needs Review`. It never moves a request to `Open`.

## Data model (TypeORM + PostgreSQL)

| Entity | Purpose |
| --- | --- |
| `Request` | Fixture fields + current state, department, priority, risk flags, optional `duplicateOf` / `triageError` |
| `Proposal` | Versioned validated AI output (`isCurrent` flag; edits create a new version) |
| `AuditEvent` | Append-only log: actor role, action, reason, before/after snapshots |
| `MergeLink` | Duplicate → canonical relationship with reason |

**ORM choice:** TypeORM for first-class NestJS integration and fast local schema sync (`synchronize: true` for the assessment demo).

## AI adapter

- Default: deterministic mock map in `fixtures/mock-ai-map.json`
- Optional live provider via `AI_PROVIDER` env (falls back to mock if not wired)
- Output validated with Zod (`AiProposalSchema`) before persist/render
- Modes: normal per-request map, plus `malformed` / `timeout` / `unavailable` / `low_confidence` under `__modes__` (force with `AI_MOCK_MODE`)

### Confidence threshold

- `confidence < 0.70` → force `recommended_state = Needs Review`
- Any of `conflict`, `security`, `privacy`, `duplicate`, `missing-information` → Needs Review regardless of confidence
- Malformed / timeout / unavailable → no invented proposal; request goes to Needs Review with `triageError` + audit `ai_failed`

## Duplicates & conflicts

- **S1:** Mock AI flags `REQ-002` with `duplicate` + `duplicate_of: REQ-001`. Manager merges via workflow; source rows remain (Merged state). Re-import is idempotent by `externalId`.
- **S2:** `REQ-003` / `REQ-004` both carry `conflict` (+ privacy/security). Both stay Needs Review until Manager decides with an audit reason.

## Auth / roles

No SSO. Demo header `x-role: Viewer | Manager`. Enforced by NestJS `RolesGuard` on mutating endpoints and again in `WorkflowService` (`assertManager`).

## Trade-offs

- Prioritized complete core over live LLM polish
- Duplicate detection is fixture/mock-AI driven (not a similarity algorithm)
- Uses local PostgreSQL on host port **5432** (configure credentials in `apps/api/.env`)
