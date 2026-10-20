# Tests

Automated Vitest suites live next to the NestJS API (as allowed by the assessment layout):

```bash
pnpm test
# equivalent: pnpm --filter @ai-triage/api test
```

Mandatory controls covered under `apps/api/src/**/*.spec.ts`:

1. Manager approval gate  
2. Viewer denial  
3. Import idempotency for `REQ-001`  
4. Duplicate merge `REQ-002` → `REQ-001`  
5. Conflict Needs Review for `REQ-003` / `REQ-004`  
6. Malformed / low-confidence mock-AI handling  
