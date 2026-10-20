# AI Triage Console — Product & Engineering Requirements

> Source: Delements Senior IT AI Engineering Practical Assessment  
> Goal: Turn unstructured IT requests into AI-assisted task proposals, with **humans** (not AI) owning every approval decision.

---

## 1. Overview

### 1.1 Problem

IT requests arrive via chat, email, and forms. They are often duplicated, mis-routed, or blocked by conflicts between commercial urgency and security control. The product is a **triage layer** that makes work visible and reviewable before an execution task is opened.

### 1.2 Product outcomes

| Outcome | Requirement |
| --- | --- |
| Import | Import the supplied mock-request fixture and **preserve** request IDs `REQ-001`–`REQ-012`. |
| AI proposal | Generate a **validated** task proposal (summary, department, priority, owner, steps, risk flags, confidence, recommended state). |
| Human gate | Require a **Manager** decision before a proposal becomes an Open task. |
| Duplicates / conflicts | Detect and manage duplicates or conflicts **without silently resolving** them. |
| Audit | Preserve an understandable audit history for every meaningful action. |

### 1.3 Scope boundary (explicitly out of scope)

- Production SSO / real authentication providers
- Live customer databases or Delements production systems
- Google / Slack / Shopify / Jira integrations
- Background agents, billing, full design system
- Paid AI account (deterministic mock-AI is the default)

**Deployment is optional.** A reproducible local run is sufficient.

### 1.4 Constraints

| Constraint | Value |
| --- | --- |
| Timebox | 4 hours maximum — prioritize a complete, reliable core |
| Data | Mock data only |
| AI | Deterministic mock-AI mode by default; no paid model key required |
| Review | Product/code walkthrough + technical discussion |

---

## 2. Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | **Next.js** (App Router) + **TypeScript** |
| UI | **shadcn/ui** + **Tailwind CSS** |
| Backend | **NestJS** + TypeScript |
| Database | **PostgreSQL** |
| Tests | **Vitest** |
| Local tooling | Docker Compose for Postgres (recommended); `.env.example` for config |

### 2.1 Suggested monorepo layout

```text
ai-triage-console/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # NestJS backend
├── packages/                # optional shared types / Zod schemas
├── data/ or fixtures/       # assessment_requests.csv + mock-AI map
├── tests/                   # Vitest suites (or colocated under apps/api)
├── README.md
├── ARCHITECTURE.md
├── AI_USAGE.md
├── SUBMISSION.md
└── REQUIREMENT.md           # this file
```

---

## 3. Input Contract

### 3.1 Fixture

- File: `assessment_requests.csv` (12 records, English and Vietnamese).
- Preserve IDs **`REQ-001` through `REQ-012`**. Additional records are allowed; do **not** replace supplied cases.
- **No** real names, email addresses, credentials, or customer information.

### 3.2 Request fields

| Field | Description |
| --- | --- |
| `id` | Stable request identifier (e.g. `REQ-001`) |
| `source` | Origin channel (chat / email / form / etc.) |
| `department_hint` | Optional routing hint |
| `requester_role` | Role of the requester |
| `submitted_at` | Submission timestamp |
| `content` | Unstructured request body (treat as **untrusted**) |

### 3.3 Import rules

- Import must be **idempotent** via stable request ID (or an equivalent documented strategy).
- Re-importing the fixture must leave **12 unique source requests** (no duplicate rows for the same ID).

---

## 4. AI Output Contract

AI may only propose. It **cannot** approve, close, delete, or execute work.

| Field | Required behavior |
| --- | --- |
| `department` | One of: `IT`, `Marketing`, `E-commerce`, `Customer Service`, `SCM`, `Finance`, `HR`, `Production`, or `Needs Review`. |
| `priority` | `Critical` \| `High` \| `Medium` \| `Low` |
| `confidence` | `0.00`–`1.00`. Document the threshold that routes to Needs Review. |
| `summary` | Plain-language summary, **max 240 characters** |
| `proposed_owner` | A **team or role**, never an assumed personal identity |
| `proposed_steps` | One or more bounded actions, each with a **verifiable completion condition** |
| `risk_flags` | Zero or more of: `duplicate`, `conflict`, `security`, `privacy`, `missing-information` |
| `recommended_state` | `Draft` or `Needs Review` **only** |

### 4.1 AI adapter requirements

- Default to **deterministic mock-AI** (response map with valid, low-confidence, malformed-output, and timeout modes).
- Optional real provider only via **environment variables**.
- Validate structured AI output **before** storing or rendering.
- Handle: malformed output, provider timeout, unavailable AI service.
- Treat request text as untrusted (prompt-injection / “bypass workflow” attempts must not break controls).
- Safely render request and AI text (no executable instructions / unsafe HTML).

---

## 5. Workflow & State Model

Document and implement a state model equivalent to:

```text
Received → Triaged → Draft | Needs Review → Approved → Open
                              ↘ Rejected (terminal)
                              ↘ Merged (terminal)
```

| State | Meaning |
| --- | --- |
| `Received` | Imported / ingested, not yet triaged |
| `Triaged` | AI adapter has produced (or attempted) a proposal |
| `Draft` | Proposal ready; low risk / sufficient confidence |
| `Needs Review` | Low confidence, conflict, missing info, or risk flags require Manager attention |
| `Approved` | Manager accepted (possibly after edit) |
| `Open` | Execution task created — **only after Manager decision** |
| `Rejected` | Terminal — Manager rejected |
| `Merged` | Terminal — duplicate merged into a canonical request |

Invalid transitions must be rejected intentionally at the **service layer**.

---

## 6. Roles & Authorization

| Role | Capabilities |
| --- | --- |
| **Viewer** | Inspect list, detail, and audit. **Cannot** change state. |
| **Manager** | Approve / Edit / Reject / Merge; all decisions require an audit reason where applicable. |

- Real authentication is **not** required. Two seeded local roles or a test-role switch is acceptable.
- When server endpoints exist, enforce the role decision at the **NestJS service / guard layer**, not only in the UI.

---

## 7. UI Requirements (Next.js + shadcn/ui)

### 7.1 Views

| View | Behavior |
| --- | --- |
| **List** | Requests with filters (state, department, priority, risk flags, source, search). |
| **Detail** | Raw request + AI proposal side-by-side; show confidence, risk flags, recommended state. |
| **Review actions** | Approve / Edit / Reject / Merge (Manager only; Viewer sees disabled or hidden actions + clear messaging). |
| **Audit** | Chronological history of meaningful actions for a request (and optionally global). |

### 7.2 UX notes

- Role switcher (Viewer ↔ Manager) visible in local/demo mode.
- Empty, error, timeout, and malformed-AI states must be understandable.
- Prefer clarity over chrome; shadcn/ui components + Tailwind tokens.

---

## 8. Acceptance Scenarios (S1–S5)

Seed data **must** contain these cases. Behavior must be reproducible in mock-AI mode.

| ID | Inputs | Expected behavior |
| --- | --- | --- |
| **S1** | `REQ-001`, `REQ-002` | Duplicate checkout/storefront incident. Flag `REQ-002` as duplicate candidate. Manager can **merge** into `REQ-001`. Re-import still yields 12 unique source requests. |
| **S2** | `REQ-003`, `REQ-004` | Marketing pixel vs IT/Security block. Both remain in **Needs Review**. AI cannot create Open task; Manager decision + audit reason required. |
| **S3** | `REQ-005` | Bilingual / insufficient context. Low confidence or `missing-information`. Clarification recorded in audit history. |
| **S4** | `REQ-006` | Customer data / access change. `security` or `privacy` risk flag + authorized-role proposal. Fixture contains no real sensitive data. |
| **S5** | `REQ-007` | Prompt-injection style “bypass workflow” text. Input treated as untrusted; validation, role controls, and approval rules remain intact. |

`REQ-008`–`REQ-012` are normal routing cases for filtering and structured AI response contract verification.

---

## 9. Backend Requirements (NestJS + PostgreSQL)

### 9.1 Core modules (suggested)

| Module | Responsibility |
| --- | --- |
| `Requests` | CRUD / query, import, idempotency |
| `Triage` / `AiAdapter` | Mock (default) + optional live provider; validation; confidence threshold routing |
| `Workflow` | State transitions; Approve / Edit / Reject / Merge |
| `Duplicates` | Duplicate candidate detection; merge into canonical request |
| `Audit` | Append-only event log for meaningful actions |
| `Auth` / `Roles` | Local role switch or seeded tokens; service-layer guards |

### 9.2 Engineering guardrails

1. Validate structured AI output before persist/render.
2. Deterministic mock-AI by default; real provider optional via env only.
3. Idempotent import by stable request ID.
4. Manager/Viewer boundary enforced in services/guards.
5. Safe rendering of untrusted text.
6. Secrets never in source control — ship `.env.example` only.

### 9.3 Data model (minimum entities)

- **Request** — fixture fields + current state + metadata  
- **Proposal** — validated AI output linked to request (versioned if edits occur)  
- **AuditEvent** — actor role, action, timestamp, reason, before/after snapshot or delta  
- **MergeLink** (or equivalent) — duplicate → canonical relationship  

Persist in **PostgreSQL** via NestJS (TypeORM or Prisma — document the choice in `ARCHITECTURE.md`).

---

## 10. Required Automated Tests (Vitest)

Mandatory coverage:

| # | Assertion |
| --- | --- |
| 1 | Manager **approval gate** — only Manager can move toward Open |
| 2 | Viewer **denial** — Viewer cannot change state |
| 3 | Import **idempotency** for `REQ-001` |
| 4 | Duplicate **merge** from `REQ-002` → `REQ-001` |
| 5 | Conflict state for `REQ-003` / `REQ-004` (Needs Review; no silent Open) |
| 6 | Malformed **or** low-confidence mock-AI response handled safely |

Additional tests are welcome; these prove assessment controls.

Document exact commands in `README.md`, e.g.:

```bash
pnpm test          # or: npm test / yarn test
```

---

## 11. Definition of Done

A reviewer can, from a clean checkout **without a paid model key**:

1. Start the app in **deterministic mock-AI** mode.
2. Import the baseline fixture **twice** (idempotent; 12 unique source requests).
3. Demonstrate **S1–S5** (Manager decision, Viewer denial, audit trail).
4. Verify Viewer restriction and inspect audit history.
5. Run the documented Vitest suite successfully.

Evaluation focuses on **state and audit evidence**, not a particular similarity algorithm or live-model answer.

---

## 12. Deliverables & Submission Artifacts

| Path | Contents |
| --- | --- |
| `README.md` | Setup, local run, test command, architecture summary, known limitations |
| `ARCHITECTURE.md` | State model, data model, AI adapter/fallback, duplicate/conflict approach, trade-offs |
| `AI_USAGE.md` | AI tools used, what they assisted with, what you personally validated |
| `SUBMISSION.md` | Tagged commit SHA, demo URL/video, checklist, no-real-data confirmation |
| `data/` or `fixtures/` | Baseline fixture, S1–S5 IDs preserved, any extra mock records |
| `tests/` | Automated tests for mandatory controls |

### Submission process (assessment)

1. Private GitHub repo; grant access to designated reviewer account.
2. Push final version to default branch; create immutable tag **`submission-v1`**.
3. Email `it@delements.co` with subject `[Senior IT AI Assessment] - Submission` including repo URL, tag + SHA, run/test commands, demo URL/video, limitations, and no-secrets confirmation.

---

## 13. Recommended Implementation Path

| Step | Focus | Checkpoint |
| --- | --- | --- |
| 01 | State & data model (Postgres entities + NestJS modules) | Transitions/entities clear before UI |
| 02 | Fixtures & mock-AI | All required scenarios work offline |
| 03 | Import & workflow service | Invalid transitions + repeat imports handled |
| 04 | Review experience (Next.js + shadcn) | Manager ≠ Viewer; decisions auditable |
| 05 | AI adapter & risk routing | Unsafe/low-confidence cannot leap to Open |
| 06 | Vitest + handoff docs | Reviewer reproduces from one tagged submission |

---

## 14. Confidence Threshold (to document in ARCHITECTURE.md)

Define and document a single rule, for example:

- `confidence < 0.70` → force `recommended_state = Needs Review` (and/or add `missing-information`).
- Any of `conflict`, `security`, `privacy` → force Needs Review regardless of confidence.
- Malformed / timeout / unavailable → do not invent a proposal; leave request in a safe reviewable state with audit event.

*(Exact numeric threshold is a product decision — pick one, document it, and test it.)*

---

## 15. Non-functional Requirements

| Area | Expectation |
| --- | --- |
| Reproducibility | Mock mode works with no network AI calls |
| Security hygiene | No secrets, customer data, or proprietary Delements code in repo |
| Safety | XSS-safe rendering; prompt injection does not bypass workflow |
| Clarity | README alone is enough to run and test |

---

## 16. Checklist (pre-tag)

- [ ] Mock-AI mode runs; fixture imported twice idempotently
- [ ] S1–S5 demonstrated with Manager decision + Viewer denial + audit
- [ ] Vitest mandatory cases pass from clean checkout
- [ ] Role enforcement in NestJS service layer
- [ ] `.env.example` present; no `.env` or keys committed
- [ ] `README.md`, `ARCHITECTURE.md`, `AI_USAGE.md`, `SUBMISSION.md` complete
- [ ] Tag `submission-v1` created on evaluated revision
