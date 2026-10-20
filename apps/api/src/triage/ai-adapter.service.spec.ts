import { describe, expect, it, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { AiAdapterService } from './ai-adapter.service.js';
import { RecommendedState, RiskFlag } from '../common/enums.js';

describe('AiAdapterService', () => {
  let service: AiAdapterService;

  beforeEach(() => {
    const config = {
      get: (key: string, fallback?: string) => {
        const map: Record<string, string> = {
          FIXTURES_DIR: resolve(process.cwd(), '../../fixtures'),
          AI_CONFIDENCE_THRESHOLD: '0.70',
          AI_PROVIDER: 'mock',
        };
        return map[key] ?? fallback;
      },
    } as unknown as ConfigService;
    service = new AiAdapterService(config);
  });

  it('handles malformed mock-AI output safely', () => {
    const result = service.validateAndRoute({ not_a_valid_proposal: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('malformed');
    }
  });

  it('routes low-confidence mock-AI to Needs Review', async () => {
    const result = await service.propose('REQ-005');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.proposal.confidence).toBeLessThan(0.7);
      expect(result.proposal.recommended_state).toBe(
        RecommendedState.NeedsReview,
      );
      expect(result.proposal.risk_flags).toContain(
        RiskFlag.MissingInformation,
      );
    }
  });

  it('flags conflict cases for REQ-003 and REQ-004 as Needs Review', async () => {
    const a = await service.propose('REQ-003');
    const b = await service.propose('REQ-004');
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.proposal.risk_flags).toContain(RiskFlag.Conflict);
      expect(b.proposal.risk_flags).toContain(RiskFlag.Conflict);
      expect(a.proposal.recommended_state).toBe(RecommendedState.NeedsReview);
      expect(b.proposal.recommended_state).toBe(RecommendedState.NeedsReview);
    }
  });

  it('flags REQ-002 as duplicate candidate of REQ-001', async () => {
    const result = await service.propose('REQ-002');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.proposal.risk_flags).toContain(RiskFlag.Duplicate);
      expect(result.proposal.duplicate_of).toBe('REQ-001');
      expect(result.proposal.recommended_state).toBe(
        RecommendedState.NeedsReview,
      );
    }
  });
});
