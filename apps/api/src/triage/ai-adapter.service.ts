import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  AiProposalDto,
  AiProposalSchema,
  applyConfidenceRouting,
} from '../common/schemas.js';

export type AiAdapterResult =
  | { ok: true; proposal: AiProposalDto }
  | {
      ok: false;
      error: 'malformed' | 'timeout' | 'unavailable' | 'validation';
      detail: string;
    };

@Injectable()
export class AiAdapterService {
  private readonly logger = new Logger(AiAdapterService.name);
  private readonly map: Record<string, unknown>;
  private readonly threshold: number;
  private readonly forcedMode: string | null;

  constructor(private readonly config: ConfigService) {
    const fixturesDir = resolve(
      process.cwd(),
      this.config.get<string>('FIXTURES_DIR') ?? '../../fixtures',
    );
    const mapPath = join(fixturesDir, 'mock-ai-map.json');
    this.map = JSON.parse(readFileSync(mapPath, 'utf8')) as Record<
      string,
      unknown
    >;
    this.threshold = Number(
      this.config.get<string>('AI_CONFIDENCE_THRESHOLD') ?? '0.70',
    );
    this.forcedMode = this.config.get<string>('AI_MOCK_MODE') ?? null;
  }

  async propose(requestExternalId: string): Promise<AiAdapterResult> {
    const provider = this.config.get<string>('AI_PROVIDER') ?? 'mock';
    if (provider !== 'mock') {
      this.logger.warn(
        `Live AI provider "${provider}" requested but not configured; falling back to mock`,
      );
    }
    return this.proposeMock(requestExternalId);
  }

  private async proposeMock(requestExternalId: string): Promise<AiAdapterResult> {
    const modes = (this.map.__modes__ ?? {}) as Record<string, unknown>;
    const modeKey = this.forcedMode;
    const raw = modeKey
      ? modes[modeKey]
      : (this.map[requestExternalId] ?? modes.low_confidence);

    if (!raw || typeof raw !== 'object') {
      return {
        ok: false,
        error: 'unavailable',
        detail: `No mock proposal for ${requestExternalId}`,
      };
    }

    const payload = raw as Record<string, unknown>;
    if (payload.__timeout__) {
      return {
        ok: false,
        error: 'timeout',
        detail: 'Mock AI provider timed out',
      };
    }
    if (payload.__unavailable__) {
      return {
        ok: false,
        error: 'unavailable',
        detail: 'Mock AI provider unavailable',
      };
    }

    const parsed = AiProposalSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        ok: false,
        error: 'malformed',
        detail: parsed.error.message,
      };
    }

    const routed = applyConfidenceRouting(parsed.data, this.threshold);
    return { ok: true, proposal: routed };
  }

  /** Exposed for Vitest — validate + route arbitrary AI output. */
  validateAndRoute(raw: unknown): AiAdapterResult {
    const parsed = AiProposalSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: 'malformed', detail: parsed.error.message };
    }
    return {
      ok: true,
      proposal: applyConfidenceRouting(parsed.data, this.threshold),
    };
  }
}
