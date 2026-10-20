import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  AiProposalSchema,
  applyConfidenceRouting,
} from '../common/schemas.js';
import { RecommendedState, RequestState, RiskFlag } from '../common/enums.js';

describe('S2 conflict — REQ-003 / REQ-004', () => {
  it('keeps both in Needs Review; AI cannot silently create Open', () => {
    const map = JSON.parse(
      readFileSync(
        resolve(process.cwd(), '../../fixtures/mock-ai-map.json'),
        'utf8',
      ),
    ) as Record<string, unknown>;

    for (const id of ['REQ-003', 'REQ-004']) {
      const parsed = AiProposalSchema.parse(map[id]);
      const routed = applyConfidenceRouting(parsed, 0.7);
      expect(routed.risk_flags).toContain(RiskFlag.Conflict);
      expect(routed.recommended_state).toBe(RecommendedState.NeedsReview);
      // recommended_state may only be Draft | Needs Review — never Open
      expect(routed.recommended_state).not.toBe(RequestState.Open);
    }
  });
});
